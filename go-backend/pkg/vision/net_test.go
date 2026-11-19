package vision

import (
	"encoding/binary"
	"image"
	"image/color"
	"math"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// Тот же рисунок, что в ai-service/scripts/export_people_model.py (synthetic_input).
func syntheticInput(size int) *Tensor {
	t := newTensor(1, 3, size, size)
	for i := range t.Data {
		v := (int64(i)*7919 + int64(i/size)*104729) % 1000
		t.Data[i] = float32(float64(v) / 999.0)
	}
	return t
}

// Сеть на Go должна давать те же числа, что и настоящий onnxruntime (эталон снят скриптом экспорта).
func TestNet_MatchesReference(t *testing.T) {
	net, err := sharedNet()
	if err != nil {
		t.Fatal(err)
	}
	raw, err := os.ReadFile(filepath.Join("testdata", "reference.bin"))
	if err != nil {
		t.Fatal(err)
	}
	start := time.Now()
	out, err := net.Run(syntheticInput(net.Size))
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("один кадр: %v, потоков %d", time.Since(start).Round(time.Millisecond), net.workers)
	if len(out.Shape) != 3 || out.Shape[1] != 84 {
		t.Fatalf("форма ответа %v", out.Shape)
	}
	n := out.Shape[2]
	if len(raw) != 6*n*4 {
		t.Fatalf("эталон: %d байт, ждали %d", len(raw), 6*n*4)
	}
	worstBox, worstScore := 0.0, 0.0
	for i := 0; i < 6*n; i++ {
		ref := float64(math.Float32frombits(binary.LittleEndian.Uint32(raw[i*4:])))
		d := math.Abs(float64(out.Data[i]) - ref)
		if i < 4*n {
			if d > worstBox {
				worstBox = d
			}
		} else if d > worstScore {
			worstScore = d
		}
	}
	t.Logf("расхождение с эталоном: рамки %.4f пикс., оценки %.6f", worstBox, worstScore)
	if worstBox > 0.05 || worstScore > 0.001 {
		t.Fatalf("сеть считает не так, как эталон: рамки %.4f, оценки %.6f", worstBox, worstScore)
	}
}

func TestLoad_RejectsGarbage(t *testing.T) {
	for _, raw := range [][]byte{nil, []byte("QZM1"), []byte("XXXX\x05\x00\x00\x00{}"), append([]byte("QZM1\xff\xff\xff\x7f"), 1, 2, 3)} {
		if _, err := Load(raw); err == nil {
			t.Fatalf("приняли мусор %q", raw)
		}
	}
}

// Стена, пол, пустая комната — людей нет, проверка не мешает.
func TestCheckPerson_ObjectPhotoPasses(t *testing.T) {
	img := image.NewRGBA(image.Rect(0, 0, 640, 480))
	for y := 0; y < 480; y++ {
		for x := 0; x < 640; x++ {
			brick := uint8(150)
			if y%40 < 3 || (x+(y/40%2)*40)%80 < 3 {
				brick = 205 // швы кладки
			}
			img.Set(x, y, color.RGBA{brick, uint8(float64(brick) * 0.55), uint8(float64(brick) * 0.4), 255})
		}
	}
	res, err := CheckPerson(img)
	if err != nil {
		t.Fatal(err)
	}
	if res.Dominant || res.People != 0 {
		t.Fatalf("на кирпичной стене нашли человека: %+v", res)
	}
}

func TestDecodeDataURL(t *testing.T) {
	if _, err := DecodeDataURL("data:image/jpeg;base64,@@@"); err == nil {
		t.Fatal("приняли битый base64")
	}
	if _, err := DecodeDataURL("data:text/plain;base64,aGVsbG8="); err == nil {
		t.Fatal("приняли не картинку")
	}
}

// Проверка на настоящих фото. Снимки людей в репозиторий не кладём, поэтому тест включается переменной:
//
//	VISION_PHOTOS=/путь/к/папке go test ./pkg/vision -run Photos -v
//
// Имена файлов: person_* — на фото в основном человек, object_* — объект (в кадре может быть мастер).
func TestCheckPerson_Photos(t *testing.T) {
	dir := os.Getenv("VISION_PHOTOS")
	if dir == "" {
		t.Skip("VISION_PHOTOS не задана")
	}
	files, _ := filepath.Glob(filepath.Join(dir, "*"))
	checked := 0
	for _, p := range files {
		name := filepath.Base(p)
		want, known := false, false
		switch {
		case strings.HasPrefix(name, "person_"):
			want, known = true, true
		case strings.HasPrefix(name, "object_"):
			known = true
		}
		if !known {
			continue
		}
		f, err := os.Open(p)
		if err != nil {
			t.Fatal(err)
		}
		img, _, err := image.Decode(f)
		f.Close()
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		start := time.Now()
		res, err := CheckPerson(img)
		if err != nil {
			t.Fatalf("%s: %v", name, err)
		}
		checked++
		t.Logf("%-28s человек=%v людей=%d кадр=%.2f центр=%.2f увер=%.2f  %v", name, res.Dominant, res.People, res.Cover, res.CenterCover, res.Conf, time.Since(start).Round(time.Millisecond))
		if res.Dominant != want {
			t.Errorf("%s: ждали «человек»=%v, получили %v", name, want, res.Dominant)
		}
	}
	if checked == 0 {
		t.Fatal("в папке нет файлов person_* / object_*")
	}
}
