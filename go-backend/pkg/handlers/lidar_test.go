package handlers

import (
	"bytes"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"math"
	"math/rand"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type pt = [3]float64

// комната 5 × 4 × 2,7 м: точки на полу, потолке и стенах, шум 1 мм
func lidarRoom(rng *rand.Rand, n int) []pt {
	const L, W, H = 5.0, 4.0, 2.7
	out := make([]pt, 0, n+8)
	for i := 0; i < n; i++ {
		x, y, z := rng.Float64()*L, rng.Float64()*W, rng.Float64()*H
		e := rng.NormFloat64() * 0.001
		switch rng.Intn(6) {
		case 0:
			z = 0 + e
		case 1:
			z = H + e
		case 2:
			x = 0 + e
		case 3:
			x = L + e
		case 4:
			y = 0 + e
		default:
			y = W + e
		}
		out = append(out, pt{x, y, z})
	}
	// углы — чтобы размеры по границам были ровно 5 × 4 × 2,7
	for _, x := range []float64{0, L} {
		for _, y := range []float64{0, W} {
			for _, z := range []float64{0, H} {
				out = append(out, pt{x, y, z})
			}
		}
	}
	return out
}

func lidarSlab(rng *rand.Rand, n int, noise float64) []pt {
	out := make([]pt, n)
	for i := range out {
		out[i] = pt{rng.Float64() * 6, rng.Float64() * 3, 10 + rng.NormFloat64()*noise}
	}
	return out
}

// площадка 10 × 8 м с котлованом 4 × 3 м глубиной 1 м
func lidarPit(rng *rand.Rand, n int) []pt {
	out := make([]pt, 0, n)
	for len(out) < n {
		x, y := rng.Float64()*10, rng.Float64()*8
		z := rng.NormFloat64() * 0.002
		if x > 3 && x < 7 && y > 2.5 && y < 5.5 {
			z -= 1
		}
		out = append(out, pt{x, y, z})
	}
	return out
}

func plyASCII(p []pt) []byte {
	var b bytes.Buffer
	fmt.Fprintf(&b, "ply\nformat ascii 1.0\ncomment test\nelement vertex %d\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nend_header\n", len(p))
	for _, v := range p {
		fmt.Fprintf(&b, "%.6f %.6f %.6f 200\n", v[0], v[1], v[2])
	}
	return b.Bytes()
}

func plyBinary(p []pt, order binary.ByteOrder, name string) []byte {
	var b bytes.Buffer
	// перед координатами — лишнее поле, после — цвет: проверяем смещения
	fmt.Fprintf(&b, "ply\nformat %s 1.0\nelement vertex %d\nproperty uchar intensity\nproperty double x\nproperty double y\nproperty float z\nproperty ushort label\nend_header\n", name, len(p))
	for _, v := range p {
		b.WriteByte(7)
		_ = binary.Write(&b, order, v[0])
		_ = binary.Write(&b, order, v[1])
		_ = binary.Write(&b, order, float32(v[2]))
		_ = binary.Write(&b, order, uint16(3))
	}
	return b.Bytes()
}

func pcdHeader(n int, mode string) string {
	return fmt.Sprintf("# .PCD v0.7 - Point Cloud Data file format\nVERSION 0.7\nFIELDS x y z intensity\nSIZE 4 4 4 4\nTYPE F F F F\nCOUNT 1 1 1 1\nWIDTH %d\nHEIGHT 1\nVIEWPOINT 0 0 0 1 0 0 0\nPOINTS %d\nDATA %s\n", n, n, mode)
}

func pcdASCII(p []pt) []byte {
	var b bytes.Buffer
	b.WriteString(pcdHeader(len(p), "ascii"))
	for _, v := range p {
		fmt.Fprintf(&b, "%.6f %.6f %.6f 0.5\n", v[0], v[1], v[2])
	}
	return b.Bytes()
}

func pcdBinary(p []pt) []byte {
	var b bytes.Buffer
	b.WriteString(pcdHeader(len(p), "binary"))
	for _, v := range p {
		for _, f := range []float32{float32(v[0]), float32(v[1]), float32(v[2]), 0.5} {
			_ = binary.Write(&b, binary.LittleEndian, f)
		}
	}
	return b.Bytes()
}

// LZF без поиска повторов: одни «литералы» блоками до 32 байт — корректный поток для распаковщика
func lzfStore(in []byte) []byte {
	var out []byte
	for len(in) > 0 {
		n := len(in)
		if n > 32 {
			n = 32
		}
		out = append(out, byte(n-1))
		out = append(out, in[:n]...)
		in = in[n:]
	}
	return out
}

func pcdCompressed(p []pt) []byte {
	var raw bytes.Buffer // по полям: все x, все y, все z, все intensity
	for f := 0; f < 4; f++ {
		for _, v := range p {
			val := float32(0.5)
			if f < 3 {
				val = float32(v[f])
			}
			_ = binary.Write(&raw, binary.LittleEndian, val)
		}
	}
	comp := lzfStore(raw.Bytes())
	var b bytes.Buffer
	b.WriteString(pcdHeader(len(p), "binary_compressed"))
	_ = binary.Write(&b, binary.LittleEndian, uint32(len(comp)))
	_ = binary.Write(&b, binary.LittleEndian, uint32(raw.Len()))
	b.Write(comp)
	return b.Bytes()
}

func xyzText(p []pt) []byte {
	var b bytes.Buffer
	b.WriteString("// x y z\n")
	for i, v := range p {
		sep := " "
		if i%2 == 1 {
			sep = ","
		}
		fmt.Fprintf(&b, "%.6f%s%.6f%s%.6f\r\n", v[0], sep, v[1], sep, v[2])
	}
	return b.Bytes()
}

func lasFile(p []pt, format byte) []byte {
	const headerSize, recLen = 227, 20
	h := make([]byte, headerSize)
	copy(h, "LASF")
	h[24], h[25] = 1, 2
	le := binary.LittleEndian
	le.PutUint16(h[94:], headerSize)
	le.PutUint32(h[96:], headerSize)
	h[104] = format
	le.PutUint16(h[105:], recLen)
	le.PutUint32(h[107:], uint32(len(p)))
	off := [3]float64{500000, 4800000, 300} // координаты как в геодезии — проверяем масштаб и сдвиг
	for i := 0; i < 3; i++ {
		le.PutUint64(h[131+8*i:], math.Float64bits(0.001))
		le.PutUint64(h[155+8*i:], math.Float64bits(off[i]))
	}
	var b bytes.Buffer
	b.Write(h)
	for _, v := range p {
		rec := make([]byte, recLen)
		for i := 0; i < 3; i++ {
			le.PutUint32(rec[4*i:], uint32(int32(math.Round(v[i]/0.001))))
		}
		b.Write(rec)
	}
	return b.Bytes()
}

func lidarPost(t *testing.T, path, filename string, data []byte) (int, map[string]interface{}) {
	t.Helper()
	var body bytes.Buffer
	mw := multipart.NewWriter(&body)
	fw, _ := mw.CreateFormFile("file", filename)
	_, _ = fw.Write(data)
	_ = mw.Close()
	req := httptest.NewRequest(http.MethodPost, "/api/v1/lidar/"+path, &body)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	rec := httptest.NewRecorder()
	Lidar(rec, req)
	var out map[string]interface{}
	if err := json.Unmarshal(rec.Body.Bytes(), &out); err != nil {
		t.Fatalf("%s: ответ не JSON: %s", filename, rec.Body.String())
	}
	return rec.Code, out
}

func near(t *testing.T, what string, got interface{}, want, tol float64) {
	t.Helper()
	g, ok := got.(float64)
	if !ok || math.Abs(g-want) > tol {
		t.Fatalf("%s: получено %v, ожидалось %g ± %g", what, got, want, tol)
	}
}

func TestLidar_RoomInEveryFormat(t *testing.T) {
	room := lidarRoom(rand.New(rand.NewSource(1)), 30000)
	files := map[string][]byte{
		"room_ascii.ply":      plyASCII(room),
		"room_le.ply":         plyBinary(room, binary.LittleEndian, "binary_little_endian"),
		"room_be.ply":         plyBinary(room, binary.BigEndian, "binary_big_endian"),
		"room_ascii.pcd":      pcdASCII(room),
		"room_binary.pcd":     pcdBinary(room),
		"room_compressed.pcd": pcdCompressed(room),
		"room.xyz":            xyzText(room),
		"Комната 1.LAS":       lasFile(room, 0),
	}
	for name, data := range files {
		code, out := lidarPost(t, "analyze", name, data)
		if code != http.StatusOK {
			t.Fatalf("%s: код %d: %v", name, code, out)
		}
		if out["scan_type"] != "room" || out["file"] != name {
			t.Fatalf("%s: тип %v, файл %v", name, out["scan_type"], out["file"])
		}
		near(t, name+" точек", out["n_points"], float64(len(room)), 0)
		d := out["dimensions"].(map[string]interface{})
		near(t, name+" длина", d["length_m"], 5, 0.01)
		near(t, name+" ширина", d["width_m"], 4, 0.01)
		near(t, name+" высота", d["height_m"], 2.7, 0.01)
		near(t, name+" пол", d["floor_area_m2"], 20, 0.1)
		near(t, name+" стены", d["wall_area_m2"], 48.6, 0.3)
		near(t, name+" объём", d["volume_m3"], 54, 0.4)
		near(t, name+" периметр", d["perimeter_m"], 18, 0.05)
		dev := out["deviations"].(map[string]interface{})
		// ровные стены с шумом 1 мм: отклонения в пределах допуска
		if p95 := dev["p95_deviation_mm"].(float64); p95 > 3 {
			t.Fatalf("%s: p95 = %v мм для ровной комнаты", name, p95)
		}
		if !strings.Contains(dev["quality"].(string), "Отлично") {
			t.Fatalf("%s: качество %v", name, dev["quality"])
		}
	}
}

func TestLidar_SurfaceAndExcavation(t *testing.T) {
	rng := rand.New(rand.NewSource(2))
	code, out := lidarPost(t, "analyze", "slab.xyz", xyzText(lidarSlab(rng, 20000, 0.001)))
	if code != http.StatusOK || out["scan_type"] != "surface" {
		t.Fatalf("плита: код %d, тип %v", code, out["scan_type"])
	}
	d := out["dimensions"].(map[string]interface{})
	near(t, "плита длина", d["length_m"], 6, 0.02)
	near(t, "плита ширина", d["width_m"], 3, 0.02)
	near(t, "плита площадь", d["area_m2"], 18, 0.2)
	dev := out["deviations"].(map[string]interface{})
	if dev["surface_type"] != "horizontal" {
		t.Fatalf("плита: тип поверхности %v", dev["surface_type"])
	}
	near(t, "плита среднее отклонение", dev["avg_deviation_mm"], 0.8, 0.3) // E|N(0, 1 мм)| ≈ 0,8 мм

	// неровная плита (шум 6 мм) — уже не «отлично»
	_, rough := lidarPost(t, "deviations", "rough.xyz", xyzText(lidarSlab(rng, 20000, 0.006)))
	if q := rough["quality"].(string); strings.Contains(q, "Отлично") {
		t.Fatalf("неровная плита оценена как %q (p95 = %v мм)", q, rough["p95_deviation_mm"])
	}
	near(t, "неровная плита p95", rough["p95_deviation_mm"], 11.8, 1.5) // 1,96 × 6 мм

	code, out = lidarPost(t, "analyze", "pit.pcd", pcdBinary(lidarPit(rng, 40000)))
	if code != http.StatusOK || out["scan_type"] != "excavation" {
		t.Fatalf("котлован: код %d, тип %v", code, out["scan_type"])
	}
	d = out["dimensions"].(map[string]interface{})
	near(t, "котлован глубина", d["max_depth_m"], 1, 0.03)
	if v := d["volume_m3"].(float64); v < 1 {
		t.Fatalf("котлован: объём %v м³", v)
	}

	// вертикальная стена
	wall := make([]pt, 15000)
	for i := range wall {
		wall[i] = pt{2 + rng.NormFloat64()*0.001, rng.Float64() * 4, rng.Float64() * 1.2}
	}
	_, w := lidarPost(t, "deviations", "wall.ply", plyASCII(wall))
	if w["surface_type"] != "vertical" {
		t.Fatalf("стена: тип поверхности %v", w["surface_type"])
	}
}

func TestLidar_Errors(t *testing.T) {
	room := lidarRoom(rand.New(rand.NewSource(3)), 500)
	cases := []struct {
		name string
		data []byte
		code int
		want string
	}{
		{"empty.ply", nil, 400, "пустой"},
		{"few.xyz", xyzText(room[:50]), 400, "Слишком мало"},
		{"scan.laz", []byte("LASF...."), 400, "LAZ"},
		{"packed.las", lasFile(room, 0x80), 400, "LAZ"},
		{"text.ply", []byte("это не облако точек"), 400, "PLY"},
		{"text.pcd", []byte("это не облако точек\n"), 400, "PCD"},
		{"text.las", []byte("это не облако точек"), 400, "LAS"},
		{"photo.jpg", []byte{0xff, 0xd8, 0xff}, 400, "Неподдерживаемый формат"},
		{"noext", []byte("1 2 3"), 400, "Неподдерживаемый формат"},
		{"cut.ply", plyBinary(room, binary.LittleEndian, "binary_little_endian")[:400], 400, "Слишком мало"},
		{"nan.xyz", []byte(strings.Repeat("nan nan nan\n", 300)), 400, "Слишком мало"},
	}
	for _, c := range cases {
		code, out := lidarPost(t, "analyze", c.name, c.data)
		msg, _ := out["detail"].(string)
		if code != c.code || !strings.Contains(msg, c.want) || out["error"] != out["detail"] {
			t.Fatalf("%s: код %d, сообщение %q; ожидалось %d и упоминание %q", c.name, code, msg, c.code, c.want)
		}
	}
	rec := httptest.NewRecorder()
	Lidar(rec, httptest.NewRequest(http.MethodGet, "/api/v1/lidar/analyze", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("GET: код %d, нужен 405", rec.Code)
	}
	rec = httptest.NewRecorder()
	Lidar(rec, httptest.NewRequest(http.MethodPost, "/api/v1/lidar/analyze", strings.NewReader("нет файла")))
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("без файла: код %d, нужен 422", rec.Code)
	}
	rec = httptest.NewRecorder()
	Lidar(rec, httptest.NewRequest(http.MethodPost, "/api/v1/lidar/mesh", nil))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("неизвестный адрес: код %d, нужен 404", rec.Code)
	}
}

// Ровная комната должна оцениваться как ровная при любой ориентации и пропорциях:
// точки стен у пола (и пола у стен) не считаются неровностью основной плоскости.
func TestLidar_FlatRoomIsFlat(t *testing.T) {
	for seed := int64(10); seed < 16; seed++ {
		rng := rand.New(rand.NewSource(seed))
		L, W, H := 3+rng.Float64()*6, 2.5+rng.Float64()*3, 2.4+rng.Float64()*0.8
		angle := rng.Float64() * math.Pi
		cs, sn := math.Cos(angle), math.Sin(angle)
		pts := make([]pt, 0, 40000)
		// точек на грани пропорционально её площади — как у настоящего сканера
		areas := []float64{L * W, L * W, W * H, W * H, L * H, L * H}
		total := 2 * (L*W + W*H + L*H)
		for len(pts) < 40000 {
			x, y, z := rng.Float64()*L, rng.Float64()*W, rng.Float64()*H
			e := rng.NormFloat64() * 0.001
			r := rng.Float64() * total
			face := 0
			for r > areas[face] {
				r -= areas[face]
				face++
			}
			switch face {
			case 0:
				z = e
			case 1:
				z = H + e
			case 2:
				x = e
			case 3:
				x = L + e
			case 4:
				y = e
			default:
				y = W + e
			}
			pts = append(pts, pt{x*cs - y*sn, x*sn + y*cs, z}) // комната повёрнута в плане
		}
		code, out := lidarPost(t, "analyze", "room.xyz", xyzText(pts))
		if code != http.StatusOK {
			t.Fatalf("зерно %d: код %d", seed, code)
		}
		dev := out["deviations"].(map[string]interface{})
		if p95 := dev["p95_deviation_mm"].(float64); p95 > 3 || !strings.Contains(dev["quality"].(string), "Отлично") {
			t.Fatalf("зерно %d (комната %.1f×%.1f×%.1f): p95 = %v мм, оценка %v, тип %v", seed, L, W, H, p95, dev["quality"], dev["surface_type"])
		}
	}
}

// один и тот же файл — один и тот же ответ (постоянное зерно случайной выборки)
func TestLidar_Deterministic(t *testing.T) {
	data := pcdBinary(lidarPit(rand.New(rand.NewSource(4)), 30000))
	_, a := lidarPost(t, "analyze", "pit.pcd", data)
	_, b := lidarPost(t, "analyze", "pit.pcd", data)
	ja, _ := json.Marshal(a)
	jb, _ := json.Marshal(b)
	if !bytes.Equal(ja, jb) {
		t.Fatalf("ответы различаются:\n%s\n%s", ja, jb)
	}
}
