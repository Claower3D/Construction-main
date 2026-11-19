package handlers

// Анализ облака точек (LiDAR) — встроен в сервер, без Python-сервиса и open3d.
// Повторяет ai-service/app/services/lidar.py: тип скана (помещение / плоскость / котлован),
// размеры, объём и отклонения поверхности от плоскости (RANSAC) по допускам СНиП.
// Форматы: PLY, PCD, XYZ, LAS. Сжатый LAZ не читается — об этом говорит понятная ошибка.

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"fmt"
	"io"
	"math"
	"math/rand"
	"net/http"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
)

const (
	lidarMinPoints  = 100
	lidarMaxFit     = 200_000 // плоскость и статистика считаются по случайной подвыборке
	lidarMaxUpload  = 50 << 20
	lidarRansacEval = 20_000 // гипотезы RANSAC оцениваются на меньшей выборке, итог — на всей
)

var lidarExtensions = map[string]bool{".las": true, ".laz": true, ".ply": true, ".pcd": true, ".xyz": true}

type lidarError struct{ msg string }

func (e lidarError) Error() string { return e.msg }

func lidarBad(format string, a ...interface{}) error { return lidarError{fmt.Sprintf(format, a...)} }

// lidarCloud — границы и число всех точек + случайная подвыборка для расчётов
type lidarCloud struct {
	n        int
	min, max [3]float64
	sumX     float64
	sumY     float64
	pts      [][3]float64
	rng      *rand.Rand
}

func newLidarCloud() *lidarCloud {
	return &lidarCloud{
		min: [3]float64{math.Inf(1), math.Inf(1), math.Inf(1)},
		max: [3]float64{math.Inf(-1), math.Inf(-1), math.Inf(-1)},
		rng: rand.New(rand.NewSource(42)), // постоянное зерно: один и тот же файл даёт один и тот же ответ
	}
}

func (c *lidarCloud) add(x, y, z float64) {
	if math.IsNaN(x) || math.IsNaN(y) || math.IsNaN(z) || math.IsInf(x, 0) || math.IsInf(y, 0) || math.IsInf(z, 0) {
		return // точки с NaN/Inf отбрасываются
	}
	c.n++
	p := [3]float64{x, y, z}
	for i := 0; i < 3; i++ {
		if p[i] < c.min[i] {
			c.min[i] = p[i]
		}
		if p[i] > c.max[i] {
			c.max[i] = p[i]
		}
	}
	c.sumX += x
	c.sumY += y
	// резервуарная выборка: каждая точка попадает в подвыборку с равной вероятностью
	if len(c.pts) < lidarMaxFit {
		c.pts = append(c.pts, p)
	} else if j := c.rng.Intn(c.n); j < lidarMaxFit {
		c.pts[j] = p
	}
}

// ───────────────────────── чтение форматов ─────────────────────────

func lidarTypeSize(t string) int {
	switch t {
	case "char", "uchar", "int8", "uint8":
		return 1
	case "short", "ushort", "int16", "uint16":
		return 2
	case "int", "uint", "int32", "uint32", "float", "float32":
		return 4
	case "double", "float64", "int64", "uint64":
		return 8
	}
	return 0
}

func lidarReadNum(b []byte, t string, order binary.ByteOrder) float64 {
	switch t {
	case "char", "int8":
		return float64(int8(b[0]))
	case "uchar", "uint8":
		return float64(b[0])
	case "short", "int16":
		return float64(int16(order.Uint16(b)))
	case "ushort", "uint16":
		return float64(order.Uint16(b))
	case "int", "int32":
		return float64(int32(order.Uint32(b)))
	case "uint", "uint32":
		return float64(order.Uint32(b))
	case "float", "float32":
		return float64(math.Float32frombits(order.Uint32(b)))
	case "double", "float64":
		return math.Float64frombits(order.Uint64(b))
	case "int64":
		return float64(int64(order.Uint64(b)))
	case "uint64":
		return float64(order.Uint64(b))
	}
	return math.NaN()
}

func lidarParsePLY(data []byte, c *lidarCloud) error {
	if !bytes.HasPrefix(data, []byte("ply")) {
		return lidarBad("Файл не похож на PLY: нет заголовка «ply»")
	}
	end := bytes.Index(data, []byte("end_header"))
	if end < 0 {
		return lidarBad("В PLY-файле нет конца заголовка (end_header)")
	}
	body := data[end+len("end_header"):]
	if len(body) > 0 && body[0] == '\r' {
		body = body[1:]
	}
	if len(body) > 0 && body[0] == '\n' {
		body = body[1:]
	}
	type prop struct{ name, typ string }
	format := ""
	vertexCount := -1
	inVertex := false
	seenOther := false // до вершин идёт другой элемент — такой порядок не поддерживаем
	var props []prop
	for _, line := range strings.Split(string(data[:end]), "\n") {
		f := strings.Fields(strings.TrimSpace(line))
		if len(f) == 0 {
			continue
		}
		switch f[0] {
		case "format":
			if len(f) > 1 {
				format = f[1]
			}
		case "element":
			inVertex = len(f) >= 3 && f[1] == "vertex"
			if inVertex {
				n, err := strconv.Atoi(f[2])
				if err != nil || n < 0 {
					return lidarBad("В PLY-файле неверное число точек")
				}
				vertexCount = n
			} else if vertexCount < 0 {
				seenOther = true
			}
		case "property":
			if inVertex && len(f) >= 3 && f[1] != "list" {
				props = append(props, prop{f[len(f)-1], f[1]})
			}
		}
	}
	if vertexCount < 0 {
		return lidarBad("В PLY-файле нет точек (элемент vertex)")
	}
	if seenOther {
		return lidarBad("PLY-файл с необычным порядком данных: точки идут не первыми. Пересохраните облако точек")
	}
	idx := map[string]int{}
	for i, p := range props {
		idx[p.name] = i
	}
	ix, okx := idx["x"]
	iy, oky := idx["y"]
	iz, okz := idx["z"]
	if !okx || !oky || !okz {
		return lidarBad("В PLY-файле нет координат x, y, z")
	}
	if format == "ascii" {
		sc := bufio.NewScanner(bytes.NewReader(body))
		sc.Buffer(make([]byte, 0, 64<<10), 1<<20)
		need := ix
		if iy > need {
			need = iy
		}
		if iz > need {
			need = iz
		}
		for i := 0; i < vertexCount && sc.Scan(); i++ {
			f := strings.Fields(sc.Text())
			if len(f) <= need {
				continue
			}
			x, e1 := strconv.ParseFloat(f[ix], 64)
			y, e2 := strconv.ParseFloat(f[iy], 64)
			z, e3 := strconv.ParseFloat(f[iz], 64)
			if e1 == nil && e2 == nil && e3 == nil {
				c.add(x, y, z)
			}
		}
		return nil
	}
	var order binary.ByteOrder = binary.LittleEndian
	switch format {
	case "binary_little_endian":
	case "binary_big_endian":
		order = binary.BigEndian
	default:
		return lidarBad("Неизвестный вид PLY-файла: %q", format)
	}
	offs := make([]int, len(props))
	stride := 0
	for i, p := range props {
		sz := lidarTypeSize(p.typ)
		if sz == 0 {
			return lidarBad("В PLY-файле неизвестный тип данных: %s", p.typ)
		}
		offs[i] = stride
		stride += sz
	}
	if stride == 0 {
		return lidarBad("В PLY-файле не описаны данные точек")
	}
	n := vertexCount
	if avail := len(body) / stride; avail < n {
		n = avail // файл обрезан — берём сколько есть
	}
	for i := 0; i < n; i++ {
		rec := body[i*stride : (i+1)*stride]
		c.add(lidarReadNum(rec[offs[ix]:], props[ix].typ, order), lidarReadNum(rec[offs[iy]:], props[iy].typ, order), lidarReadNum(rec[offs[iz]:], props[iz].typ, order))
	}
	return nil
}

// lidarLZF — распаковка LZF (так сжаты PCD-файлы «binary_compressed»)
func lidarLZF(in []byte, outLen int) ([]byte, error) {
	out := make([]byte, 0, outLen)
	i := 0
	for i < len(in) {
		ctrl := int(in[i])
		i++
		if ctrl < 32 { // литералы
			ctrl++
			if i+ctrl > len(in) {
				return nil, lidarBad("PCD-файл повреждён (сжатые данные обрываются)")
			}
			out = append(out, in[i:i+ctrl]...)
			i += ctrl
			continue
		}
		length := ctrl >> 5
		if length == 7 {
			if i >= len(in) {
				return nil, lidarBad("PCD-файл повреждён (сжатые данные обрываются)")
			}
			length += int(in[i])
			i++
		}
		if i >= len(in) {
			return nil, lidarBad("PCD-файл повреждён (сжатые данные обрываются)")
		}
		ref := len(out) - ((ctrl & 0x1f) << 8) - int(in[i]) - 1
		i++
		if ref < 0 {
			return nil, lidarBad("PCD-файл повреждён (неверная ссылка в сжатых данных)")
		}
		for k := 0; k < length+2; k++ {
			out = append(out, out[ref+k])
		}
		if len(out) > outLen {
			return nil, lidarBad("PCD-файл повреждён (данных больше, чем заявлено)")
		}
	}
	return out, nil
}

func lidarParsePCD(data []byte, c *lidarCloud) error {
	var fields, types []string
	var sizes, counts []int
	points := -1
	width, height := -1, 1
	mode := ""
	pos := 0
	for pos < len(data) {
		nl := bytes.IndexByte(data[pos:], '\n')
		if nl < 0 {
			break
		}
		line := strings.TrimSpace(string(data[pos : pos+nl]))
		pos += nl + 1
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		f := strings.Fields(line)
		ints := func() []int {
			out := make([]int, 0, len(f)-1)
			for _, v := range f[1:] {
				n, _ := strconv.Atoi(v)
				out = append(out, n)
			}
			return out
		}
		switch strings.ToUpper(f[0]) {
		case "FIELDS":
			fields = f[1:]
		case "SIZE":
			sizes = ints()
		case "TYPE":
			types = f[1:]
		case "COUNT":
			counts = ints()
		case "WIDTH":
			if v := ints(); len(v) > 0 {
				width = v[0]
			}
		case "HEIGHT":
			if v := ints(); len(v) > 0 {
				height = v[0]
			}
		case "POINTS":
			if v := ints(); len(v) > 0 {
				points = v[0]
			}
		case "DATA":
			if len(f) > 1 {
				mode = strings.ToLower(f[1])
			}
		}
		if mode != "" {
			break
		}
	}
	if mode == "" || len(fields) == 0 {
		return lidarBad("Файл не похож на PCD: нет заголовка с полями и строкой DATA")
	}
	if points < 0 && width > 0 {
		points = width * height
	}
	if points < 0 {
		return lidarBad("В PCD-файле не указано число точек")
	}
	if len(counts) != len(fields) {
		counts = make([]int, len(fields))
		for i := range counts {
			counts[i] = 1
		}
	}
	col := map[string]int{} // номер столбца (с учётом COUNT) по имени поля
	n := 0
	for i, name := range fields {
		col[strings.ToLower(name)] = n
		n += counts[i]
	}
	ix, okx := col["x"]
	iy, oky := col["y"]
	iz, okz := col["z"]
	if !okx || !oky || !okz {
		return lidarBad("В PCD-файле нет координат x, y, z")
	}
	body := data[pos:]
	if mode == "ascii" {
		sc := bufio.NewScanner(bytes.NewReader(body))
		sc.Buffer(make([]byte, 0, 64<<10), 1<<20)
		need := ix
		if iy > need {
			need = iy
		}
		if iz > need {
			need = iz
		}
		for sc.Scan() {
			f := strings.Fields(sc.Text())
			if len(f) <= need {
				continue
			}
			x, e1 := strconv.ParseFloat(f[ix], 64)
			y, e2 := strconv.ParseFloat(f[iy], 64)
			z, e3 := strconv.ParseFloat(f[iz], 64)
			if e1 == nil && e2 == nil && e3 == nil {
				c.add(x, y, z)
			}
		}
		return nil
	}
	if len(sizes) != len(fields) || len(types) != len(fields) {
		return lidarBad("В PCD-файле не описаны размеры и типы полей")
	}
	// смещение и тип каждого поля в записи
	offs := make([]int, len(fields))
	typ := make([]string, len(fields))
	stride := 0
	fi := map[string]int{}
	for i, name := range fields {
		offs[i] = stride
		stride += sizes[i] * counts[i]
		fi[strings.ToLower(name)] = i
		switch strings.ToUpper(types[i]) + strconv.Itoa(sizes[i]) {
		case "F4":
			typ[i] = "float32"
		case "F8":
			typ[i] = "float64"
		case "I1":
			typ[i] = "int8"
		case "I2":
			typ[i] = "int16"
		case "I4":
			typ[i] = "int32"
		case "I8":
			typ[i] = "int64"
		case "U1":
			typ[i] = "uint8"
		case "U2":
			typ[i] = "uint16"
		case "U4":
			typ[i] = "uint32"
		case "U8":
			typ[i] = "uint64"
		}
	}
	fx, fy, fz := fi["x"], fi["y"], fi["z"]
	if typ[fx] == "" || typ[fy] == "" || typ[fz] == "" || stride == 0 {
		return lidarBad("В PCD-файле неизвестный тип координат")
	}
	le := binary.LittleEndian
	switch mode {
	case "binary":
		if avail := len(body) / stride; avail < points {
			points = avail
		}
		for i := 0; i < points; i++ {
			rec := body[i*stride:]
			c.add(lidarReadNum(rec[offs[fx]:], typ[fx], le), lidarReadNum(rec[offs[fy]:], typ[fy], le), lidarReadNum(rec[offs[fz]:], typ[fz], le))
		}
	case "binary_compressed":
		if len(body) < 8 {
			return lidarBad("PCD-файл повреждён (нет сжатых данных)")
		}
		compLen := int(le.Uint32(body))
		rawLen := int(le.Uint32(body[4:]))
		if compLen < 0 || compLen > len(body)-8 || rawLen < 0 || rawLen > 1<<30 || rawLen < points*stride {
			return lidarBad("PCD-файл повреждён (неверный размер сжатых данных)")
		}
		raw, err := lidarLZF(body[8:8+compLen], rawLen)
		if err != nil {
			return err
		}
		if len(raw) < points*stride {
			return lidarBad("PCD-файл повреждён (сжатых данных меньше, чем заявлено)")
		}
		// в сжатом виде данные лежат по полям: сначала все x, потом все y …
		colOff := func(f int) int { return offs[f] * points }
		for i := 0; i < points; i++ {
			c.add(lidarReadNum(raw[colOff(fx)+i*sizes[fx]:], typ[fx], le), lidarReadNum(raw[colOff(fy)+i*sizes[fy]:], typ[fy], le), lidarReadNum(raw[colOff(fz)+i*sizes[fz]:], typ[fz], le))
		}
	default:
		return lidarBad("Неизвестный вид PCD-файла: %q", mode)
	}
	return nil
}

func lidarParseXYZ(data []byte, c *lidarCloud) error {
	if bytes.IndexByte(data[:minInt(len(data), 4096)], 0) >= 0 {
		return lidarBad("Файл XYZ должен быть текстовым: в каждой строке три числа x y z")
	}
	sc := bufio.NewScanner(bytes.NewReader(data))
	sc.Buffer(make([]byte, 0, 64<<10), 1<<20)
	split := func(r rune) bool { return r == ' ' || r == '\t' || r == ',' || r == ';' || r == '\r' }
	for sc.Scan() {
		f := strings.FieldsFunc(sc.Text(), split)
		if len(f) < 3 {
			continue
		}
		x, e1 := strconv.ParseFloat(f[0], 64)
		y, e2 := strconv.ParseFloat(f[1], 64)
		z, e3 := strconv.ParseFloat(f[2], 64)
		if e1 == nil && e2 == nil && e3 == nil {
			c.add(x, y, z)
		}
	}
	return nil
}

func minInt(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func lidarParseLAS(data []byte, c *lidarCloud) error {
	if len(data) < 227 || string(data[:4]) != "LASF" {
		return lidarBad("Файл не похож на LAS: нет подписи LASF")
	}
	le := binary.LittleEndian
	minor := data[25]
	headerSize := int(le.Uint16(data[94:]))
	offset := int(le.Uint32(data[96:]))
	format := data[104]
	recLen := int(le.Uint16(data[105:]))
	count := int(le.Uint32(data[107:]))
	if minor >= 4 && headerSize >= 255 && len(data) >= 255 {
		if n := le.Uint64(data[247:]); n > 0 && n < 1<<40 {
			count = int(n)
		}
	}
	if format&0x80 != 0 {
		return lidarBad("Это сжатый LAZ. Сохраните скан без сжатия (LAS) либо в PLY, PCD или XYZ")
	}
	if recLen < 12 || offset < headerSize || offset > len(data) {
		return lidarBad("LAS-файл повреждён (неверный заголовок)")
	}
	var scale, off [3]float64
	for i := 0; i < 3; i++ {
		scale[i] = math.Float64frombits(le.Uint64(data[131+8*i:]))
		off[i] = math.Float64frombits(le.Uint64(data[155+8*i:]))
	}
	if avail := (len(data) - offset) / recLen; avail < count {
		count = avail
	}
	for i := 0; i < count; i++ {
		rec := data[offset+i*recLen:]
		c.add(float64(int32(le.Uint32(rec)))*scale[0]+off[0], float64(int32(le.Uint32(rec[4:])))*scale[1]+off[1], float64(int32(le.Uint32(rec[8:])))*scale[2]+off[2])
	}
	return nil
}

func lidarLoad(name string, data []byte) (*lidarCloud, error) {
	if len(data) == 0 {
		return nil, lidarBad("Файл облака точек пустой")
	}
	c := newLidarCloud()
	var err error
	switch strings.ToLower(filepath.Ext(name)) {
	case ".ply":
		err = lidarParsePLY(data, c)
	case ".pcd":
		err = lidarParsePCD(data, c)
	case ".xyz":
		err = lidarParseXYZ(data, c)
	case ".las":
		err = lidarParseLAS(data, c)
	case ".laz":
		err = lidarBad("Сжатый формат LAZ пока не читается. Сохраните скан без сжатия (LAS) либо в PLY, PCD или XYZ")
	default:
		err = lidarBad("Неподдерживаемый формат файла")
	}
	if err != nil {
		return nil, err
	}
	if c.n < lidarMinPoints {
		return nil, lidarBad("Слишком мало корректных точек: %d (нужно минимум %d). Файл пустой, повреждён или не является облаком точек.", c.n, lidarMinPoints)
	}
	return c, nil
}

// ───────────────────────── геометрия ─────────────────────────

type lidarPlane struct {
	a, b, c, d  float64 // единичная нормаль и смещение: a·x + b·y + c·z + d = 0
	inlierRatio float64
	nz          float64
}

func planeFrom3(p, q, r [3]float64) (a, b, c, d float64, ok bool) {
	u := [3]float64{q[0] - p[0], q[1] - p[1], q[2] - p[2]}
	v := [3]float64{r[0] - p[0], r[1] - p[1], r[2] - p[2]}
	a = u[1]*v[2] - u[2]*v[1]
	b = u[2]*v[0] - u[0]*v[2]
	c = u[0]*v[1] - u[1]*v[0]
	n := math.Sqrt(a*a + b*b + c*c)
	if n < 1e-12 {
		return 0, 0, 0, 0, false
	}
	a, b, c = a/n, b/n, c/n
	return a, b, c, -(a*p[0] + b*p[1] + c*p[2]), true
}

// lidarSmallestEigen — собственный вектор наименьшего собственного значения симметричной матрицы 3×3 (метод Якоби)
func lidarSmallestEigen(m [3][3]float64) [3]float64 {
	v := [3][3]float64{{1, 0, 0}, {0, 1, 0}, {0, 0, 1}}
	for sweep := 0; sweep < 50; sweep++ {
		offDiag := math.Abs(m[0][1]) + math.Abs(m[0][2]) + math.Abs(m[1][2])
		if offDiag < 1e-18 {
			break
		}
		for p := 0; p < 2; p++ {
			for q := p + 1; q < 3; q++ {
				if math.Abs(m[p][q]) < 1e-300 {
					continue
				}
				theta := (m[q][q] - m[p][p]) / (2 * m[p][q])
				t := 1 / (math.Abs(theta) + math.Sqrt(theta*theta+1))
				if theta < 0 {
					t = -t
				}
				cs := 1 / math.Sqrt(t*t+1)
				sn := t * cs
				for k := 0; k < 3; k++ { // столбцы
					mkp, mkq := m[k][p], m[k][q]
					m[k][p] = cs*mkp - sn*mkq
					m[k][q] = sn*mkp + cs*mkq
				}
				for k := 0; k < 3; k++ { // строки
					mpk, mqk := m[p][k], m[q][k]
					m[p][k] = cs*mpk - sn*mqk
					m[q][k] = sn*mpk + cs*mqk
				}
				for k := 0; k < 3; k++ {
					vkp, vkq := v[k][p], v[k][q]
					v[k][p] = cs*vkp - sn*vkq
					v[k][q] = sn*vkp + cs*vkq
				}
			}
		}
	}
	best := 0
	for i := 1; i < 3; i++ {
		if m[i][i] < m[best][best] {
			best = i
		}
	}
	return [3]float64{v[0][best], v[1][best], v[2][best]}
}

// lidarDominantPlane — RANSAC: самая «населённая» плоскость облака (пол, стена, плита)
func lidarDominantPlane(pts [][3]float64, threshold float64, rng *rand.Rand) lidarPlane {
	n := len(pts)
	eval := pts
	if n > lidarRansacEval {
		eval = make([][3]float64, lidarRansacEval)
		for i := range eval {
			eval[i] = pts[rng.Intn(n)]
		}
	}
	var ba, bb, bc, bd float64
	bestCount := -1
	for it := 0; it < 1000; it++ {
		a, b, c, d, ok := planeFrom3(pts[rng.Intn(n)], pts[rng.Intn(n)], pts[rng.Intn(n)])
		if !ok {
			continue
		}
		count := 0
		for _, p := range eval {
			if math.Abs(a*p[0]+b*p[1]+c*p[2]+d) <= threshold {
				count++
			}
		}
		if count > bestCount {
			bestCount, ba, bb, bc, bd = count, a, b, c, d
		}
	}
	if bestCount < 0 {
		return lidarPlane{c: 1, nz: 1}
	}
	// уточнение по всем попавшим точкам (наименьшие квадраты), два прохода
	for pass := 0; pass < 2; pass++ {
		var cx, cy, cz float64
		k := 0
		for _, p := range pts {
			if math.Abs(ba*p[0]+bb*p[1]+bc*p[2]+bd) <= threshold {
				cx += p[0]
				cy += p[1]
				cz += p[2]
				k++
			}
		}
		if k < 3 {
			break
		}
		cx, cy, cz = cx/float64(k), cy/float64(k), cz/float64(k)
		var m [3][3]float64
		for _, p := range pts {
			if math.Abs(ba*p[0]+bb*p[1]+bc*p[2]+bd) <= threshold {
				d := [3]float64{p[0] - cx, p[1] - cy, p[2] - cz}
				for i := 0; i < 3; i++ {
					for j := 0; j < 3; j++ {
						m[i][j] += d[i] * d[j]
					}
				}
			}
		}
		nv := lidarSmallestEigen(m)
		if l := math.Sqrt(nv[0]*nv[0] + nv[1]*nv[1] + nv[2]*nv[2]); l > 1e-12 {
			ba, bb, bc = nv[0]/l, nv[1]/l, nv[2]/l
			bd = -(ba*cx + bb*cy + bc*cz)
		}
	}
	inliers := 0
	for _, p := range pts {
		if math.Abs(ba*p[0]+bb*p[1]+bc*p[2]+bd) <= threshold {
			inliers++
		}
	}
	return lidarPlane{a: ba, b: bb, c: bc, d: bd, inlierRatio: float64(inliers) / float64(n), nz: math.Abs(bc)}
}

// lidarPercentile — как numpy.percentile (линейная интерполяция); v должен быть отсортирован
func lidarPercentile(v []float64, p float64) float64 {
	if len(v) == 0 {
		return 0
	}
	pos := p / 100 * float64(len(v)-1)
	lo := int(math.Floor(pos))
	hi := int(math.Ceil(pos))
	return v[lo] + (v[hi]-v[lo])*(pos-float64(lo))
}

func lidarRoundTo(x float64, digits int) float64 {
	v, _ := strconv.ParseFloat(strconv.FormatFloat(x, 'f', digits, 64), 64)
	return v
}

func lidarDeviations(c *lidarCloud) map[string]interface{} {
	fit := lidarDominantPlane(c.pts, 0.02, c.rng)
	const band = 0.05
	dist := func(pl lidarPlane, p [3]float64) float64 {
		return math.Abs(pl.a*p[0] + pl.b*p[1] + pl.c*p[2] + pl.d)
	}
	// Соседние поверхности (стены у пола, пол у стены) тоже попадают в полосу ±5 см и выглядят как
	// «неровность» в сантиметры. Находим остальные крупные плоскости облака и их точки не учитываем.
	var others []lidarPlane
	rest := make([][3]float64, 0, len(c.pts))
	for _, p := range c.pts {
		if dist(fit, p) > 0.03 {
			rest = append(rest, p)
		}
	}
	minPlane := len(c.pts) * 3 / 100
	if minPlane < 100 {
		minPlane = 100
	}
	for k := 0; k < 6 && len(rest) >= minPlane; k++ {
		pl := lidarDominantPlane(rest, 0.02, c.rng)
		if int(pl.inlierRatio*float64(len(rest))) < minPlane {
			break
		}
		if math.Abs(pl.a*fit.a+pl.b*fit.b+pl.c*fit.c) < 0.8 { // не параллельна основной
			others = append(others, pl)
		}
		keep := rest[:0]
		for _, p := range rest {
			if dist(pl, p) > 0.03 {
				keep = append(keep, p)
			}
		}
		rest = keep
	}
	var dev []float64
	for _, p := range c.pts {
		d := dist(fit, p)
		if d > band {
			continue
		}
		foreign := false
		for _, o := range others {
			if dist(o, p) <= 0.03 {
				foreign = true
				break
			}
		}
		if !foreign {
			dev = append(dev, d*1000)
		}
	}
	sort.Float64s(dev)
	var maxDev, avgDev, p95 float64
	if len(dev) > 0 {
		maxDev = dev[len(dev)-1]
		sum := 0.0
		for _, d := range dev {
			sum += d
		}
		avgDev = sum / float64(len(dev))
		p95 = lidarPercentile(dev, 95)
	}
	surface := "inclined"
	if fit.nz > 0.9 {
		surface = "horizontal"
	} else if fit.nz < 0.1 {
		surface = "vertical"
	}
	// Качество по СНиП 3.04.01-87 (штукатурка: до 3 мм на 1 м) — по 95-му перцентилю
	quality := "🚨 Критическое отклонение (> 10мм)"
	switch {
	case p95 <= 3:
		quality = "✅ Отлично (< 3мм — СНиП 3.04.01-87)"
	case p95 <= 5:
		quality = "⚠️ Допустимо (3-5мм)"
	case p95 <= 10:
		quality = "❌ Требует исправления (5-10мм)"
	}
	return map[string]interface{}{
		"surface_type":     surface,
		"method":           "ransac_dominant_plane",
		"points_used":      len(c.pts),
		"surface_points":   len(dev),
		"surface_share":    lidarRoundTo(float64(len(dev))/float64(len(c.pts)), 3),
		"max_deviation_mm": lidarRoundTo(maxDev, 1),
		"avg_deviation_mm": lidarRoundTo(avgDev, 1),
		"p95_deviation_mm": lidarRoundTo(p95, 1),
		"quality":          quality,
		"snip_norm":        "СНиП 3.04.01-87",
		"max_allowed_mm":   3.0,
	}
}

func lidarExcavation(c *lidarCloud, ground *float64) map[string]interface{} {
	zero := map[string]interface{}{"volume_m3": 0, "area_m2": 0, "max_depth_m": 0, "avg_depth_m": 0}
	level := 0.0
	if ground != nil {
		level = *ground
	} else {
		// уровень земли — 95-й перцентиль высот
		zs := make([]float64, len(c.pts))
		for i, p := range c.pts {
			zs[i] = p[2]
		}
		sort.Float64s(zs)
		level = lidarPercentile(zs, 95)
	}
	minX, maxX, minY, maxY := math.Inf(1), math.Inf(-1), math.Inf(1), math.Inf(-1)
	var sum, maxDepth float64
	k := 0
	for _, p := range c.pts {
		if p[2] >= level {
			continue
		}
		depth := level - p[2]
		sum += depth
		if depth > maxDepth {
			maxDepth = depth
		}
		minX, maxX = math.Min(minX, p[0]), math.Max(maxX, p[0])
		minY, maxY = math.Min(minY, p[1]), math.Max(maxY, p[1])
		k++
	}
	if k < 10 {
		return zero
	}
	avg := sum / float64(k)
	area := (maxX - minX) * (maxY - minY) // оценка по описанному прямоугольнику
	return map[string]interface{}{
		"volume_m3":   lidarRoundTo(area*avg, 2),
		"area_m2":     lidarRoundTo(area, 2),
		"max_depth_m": lidarRoundTo(maxDepth, 3),
		"avg_depth_m": lidarRoundTo(avg, 3),
	}
}

func lidarAnalyze(c *lidarCloud) map[string]interface{} {
	ext := [3]float64{c.max[0] - c.min[0], c.max[1] - c.min[1], c.max[2] - c.min[2]}
	var scanType string
	var dims map[string]interface{}
	if ext[2] > 1.5 {
		scanType = "room"
		length, width, height := ext[0], ext[1], ext[2]
		if width > length {
			length, width = width, length
		}
		dims = map[string]interface{}{
			"length_m":        lidarRoundTo(length, 3),
			"width_m":         lidarRoundTo(width, 3),
			"height_m":        lidarRoundTo(height, 3),
			"floor_area_m2":   lidarRoundTo(length*width, 2),
			"wall_area_m2":    lidarRoundTo(2*(length+width)*height, 2),
			"ceiling_area_m2": lidarRoundTo(length*width, 2),
			"volume_m3":       lidarRoundTo(length*width*height, 2),
			"perimeter_m":     lidarRoundTo(2*(length+width), 2),
			"n_points":        c.n,
		}
	} else {
		fit := lidarDominantPlane(c.pts, 0.03, c.rng)
		horizontal := fit.nz > 0.9
		var ground *float64
		belowShare := 0.0
		if horizontal {
			// высота плоскости в центре облака
			cx, cy := c.sumX/float64(c.n), c.sumY/float64(c.n)
			g := -(fit.a*cx + fit.b*cy + fit.d) / fit.c
			ground = &g
			below := 0
			for _, p := range c.pts {
				if p[2] < g-0.10 {
					below++
				}
			}
			belowShare = float64(below) / float64(len(c.pts))
		}
		if horizontal && fit.inlierRatio >= 0.8 && belowShare < 0.05 {
			scanType = "surface"
			dims = map[string]interface{}{
				"length_m":           lidarRoundTo(math.Max(ext[0], ext[1]), 3),
				"width_m":            lidarRoundTo(math.Min(ext[0], ext[1]), 3),
				"area_m2":            lidarRoundTo(ext[0]*ext[1], 2),
				"plane_inlier_ratio": lidarRoundTo(fit.inlierRatio, 3),
			}
		} else {
			scanType = "excavation"
			dims = lidarExcavation(c, ground)
		}
	}
	return map[string]interface{}{
		"scan_type":  scanType,
		"n_points":   c.n,
		"dimensions": dims,
		"deviations": lidarDeviations(c),
		"bbox":       map[string]interface{}{"min": c.min[:], "max": c.max[:]},
	}
}

// Lidar — /api/v1/lidar/analyze и /api/v1/lidar/deviations (multipart, поле file)
func Lidar(w http.ResponseWriter, r *http.Request) {
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/lidar"), "/")
	if path != "analyze" && path != "deviations" {
		engWriteError(w, http.StatusNotFound, "Нет такого адреса. Доступны: analyze, deviations")
		return
	}
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		engWriteError(w, http.StatusMethodNotAllowed, "Загрузите файл облака точек запросом POST (поле file)")
		return
	}
	// повреждённый файл не должен обрывать соединение — отвечаем понятной ошибкой
	defer func() {
		if rec := recover(); rec != nil {
			engWriteError(w, http.StatusBadRequest, "Не удалось прочитать облако точек: файл повреждён")
		}
	}()
	r.Body = http.MaxBytesReader(w, r.Body, lidarMaxUpload+1<<20)
	file, header, err := r.FormFile("file")
	if err != nil {
		if strings.Contains(err.Error(), "too large") {
			engWriteError(w, http.StatusRequestEntityTooLarge, "Файл облака точек слишком большой (максимум 50 МБ)")
			return
		}
		engWriteError(w, http.StatusUnprocessableEntity, "Не получен файл облака точек (поле file)")
		return
	}
	defer file.Close()
	if r.MultipartForm != nil {
		defer r.MultipartForm.RemoveAll()
	}
	name := filepath.Base(header.Filename)
	ext := strings.ToLower(filepath.Ext(name))
	if !lidarExtensions[ext] {
		shown := ext
		if shown == "" {
			shown = "(нет расширения)"
		}
		engWriteError(w, http.StatusBadRequest, fmt.Sprintf("Неподдерживаемый формат файла: %s. Подходят: .las, .ply, .pcd, .xyz", shown))
		return
	}
	data, err := io.ReadAll(io.LimitReader(file, lidarMaxUpload+1))
	if err != nil {
		engWriteError(w, http.StatusBadRequest, "Не удалось прочитать файл облака точек")
		return
	}
	if len(data) > lidarMaxUpload {
		engWriteError(w, http.StatusRequestEntityTooLarge, "Файл облака точек слишком большой (максимум 50 МБ)")
		return
	}
	cloud, err := lidarLoad(name, data)
	if err != nil {
		if le, ok := err.(lidarError); ok {
			engWriteError(w, http.StatusBadRequest, le.msg)
			return
		}
		engWriteError(w, http.StatusBadRequest, "Не удалось прочитать облако точек")
		return
	}
	if path == "deviations" {
		writeJSON(w, http.StatusOK, lidarDeviations(cloud))
		return
	}
	result := lidarAnalyze(cloud)
	if len([]rune(name)) > 255 {
		name = string([]rune(name)[:255])
	}
	result["file"] = name
	writeJSON(w, http.StatusOK, result)
}
