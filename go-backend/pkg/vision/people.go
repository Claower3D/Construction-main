package vision

import (
	"bytes"
	_ "embed"
	"encoding/base64"
	"errors"
	"image"
	"image/draw"
	_ "image/jpeg" // форматы, в которых фото приходят с сайта и из приложений
	_ "image/png"
	"sort"
	"strings"
	"sync"
	"time"
)

//go:embed coco320.qzm
var cocoModel []byte

var (
	netOnce sync.Once
	netInst *Net
	netErr  error
	// расчёт занимает ядра целиком — одновременно считаем не больше одного кадра
	slot = make(chan struct{}, 1)
)

func sharedNet() (*Net, error) {
	netOnce.Do(func() { netInst, netErr = Load(cocoModel) })
	return netInst, netErr
}

// Box — рамка человека в долях кадра (0…1).
type Box struct {
	X1, Y1, X2, Y2 float64
	Conf           float64
}

func (b Box) area() float64 { return (b.X2 - b.X1) * (b.Y2 - b.Y1) }

const (
	personRow = 4 // в ответе сети строки 0–3 — рамка, 4 — «человек», дальше остальные классы COCO
	nmsIoU    = 0.45

	// Правило «на фото в основном человек» (подобрано на 128 фото COCO и 336 фото стройки):
	// 1) на всём кадре люди занимают не меньше половины,
	// 2) и в центральной части кадра тоже человек.
	// Второе условие отсеивает снимки, где мастер стоит сбоку, а в центре — стена или пол.
	fullConf    = 0.5
	fullCover   = 0.5
	centerPart  = 0.5
	centerConf  = 0.3
	centerCover = 0.4
	waitForSlot = 8 * time.Second
	maxImagePix = 24_000_000 // фото крупнее не разбираем (память сервера), проверка пропускается
)

// ErrBusy — сервер занят другими фото; проверку пропускаем, смета считается как обычно.
var ErrBusy = errors.New("vision: проверка фото занята")

// DecodeDataURL превращает «data:image/jpeg;base64,…» (или чистый base64) в картинку.
func DecodeDataURL(s string) (image.Image, error) {
	if i := strings.Index(s, ","); strings.HasPrefix(s, "data:") && i > 0 {
		s = s[i+1:]
	}
	s = strings.TrimSpace(s)
	raw, err := base64.StdEncoding.DecodeString(s)
	if err != nil {
		if raw, err = base64.RawStdEncoding.DecodeString(strings.TrimRight(s, "=")); err != nil {
			return nil, errors.New("vision: фото не в формате base64")
		}
	}
	cfg, _, err := image.DecodeConfig(bytes.NewReader(raw))
	if err != nil {
		return nil, errors.New("vision: формат фото не поддержан")
	}
	if cfg.Width <= 0 || cfg.Height <= 0 || cfg.Width*cfg.Height > maxImagePix {
		return nil, errors.New("vision: недопустимый размер фото")
	}
	img, _, err := image.Decode(bytes.NewReader(raw))
	if err != nil {
		return nil, errors.New("vision: фото не читается")
	}
	return img, nil
}

func toRGBA(img image.Image) *image.RGBA {
	if r, ok := img.(*image.RGBA); ok && r.Rect.Min == (image.Point{}) {
		return r
	}
	b := img.Bounds()
	out := image.NewRGBA(image.Rect(0, 0, b.Dx(), b.Dy()))
	draw.Draw(out, out.Bounds(), img, b.Min, draw.Src)
	return out
}

// letterbox вписывает часть кадра (в пикселях) в квадрат size×size с серыми полями — как при обучении сети.
// Уменьшение — усреднением по площади, чтобы мелкие детали не «сыпались».
func letterbox(src *image.RGBA, rect image.Rectangle, size int) (*Tensor, float64, float64, float64, float64) {
	sw, sh := rect.Dx(), rect.Dy()
	r := float64(size) / float64(sw)
	if v := float64(size) / float64(sh); v < r {
		r = v
	}
	nw, nh := int(float64(sw)*r+0.5), int(float64(sh)*r+0.5)
	if nw < 1 {
		nw = 1
	}
	if nh < 1 {
		nh = 1
	}
	dx, dy := (size-nw)/2, (size-nh)/2
	t := newTensor(1, 3, size, size)
	plane := size * size
	for i := range t.Data {
		t.Data[i] = 114.0 / 255
	}
	for y := 0; y < nh; y++ {
		y0 := rect.Min.Y + y*sh/nh
		y1 := rect.Min.Y + (y+1)*sh/nh
		if y1 <= y0 {
			y1 = y0 + 1
		}
		for x := 0; x < nw; x++ {
			x0 := rect.Min.X + x*sw/nw
			x1 := rect.Min.X + (x+1)*sw/nw
			if x1 <= x0 {
				x1 = x0 + 1
			}
			var sr, sg, sb, cnt uint32
			for yy := y0; yy < y1; yy++ {
				row := src.Pix[yy*src.Stride+x0*4 : yy*src.Stride+x1*4]
				for i := 0; i < len(row); i += 4 {
					sr += uint32(row[i])
					sg += uint32(row[i+1])
					sb += uint32(row[i+2])
					cnt++
				}
			}
			o := (y+dy)*size + x + dx
			k := 1 / (float32(cnt) * 255)
			t.Data[o] = float32(sr) * k
			t.Data[plane+o] = float32(sg) * k
			t.Data[2*plane+o] = float32(sb) * k
		}
	}
	return t, float64(dx), float64(dy), float64(nw), float64(nh)
}

func clamp01(v float64) float64 {
	if v < 0 {
		return 0
	}
	if v > 1 {
		return 1
	}
	return v
}

func iou(a, b Box) float64 {
	ix := minF(a.X2, b.X2) - maxF(a.X1, b.X1)
	iy := minF(a.Y2, b.Y2) - maxF(a.Y1, b.Y1)
	if ix <= 0 || iy <= 0 {
		return 0
	}
	inter := ix * iy
	return inter / (a.area() + b.area() - inter + 1e-9)
}

func minF(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func maxF(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}

// people ищет людей на части кадра rect. Рамки — в долях этой части.
func (net *Net) people(src *image.RGBA, rect image.Rectangle, minConf float64) ([]Box, error) {
	in, dx, dy, nw, nh := letterbox(src, rect, net.Size)
	out, err := net.Run(in)
	if err != nil {
		return nil, err
	}
	if len(out.Shape) != 3 || out.Shape[1] <= personRow {
		return nil, errors.New("vision: неожиданный ответ сети")
	}
	n := out.Shape[2]
	var boxes []Box
	for i := 0; i < n; i++ {
		conf := float64(out.Data[personRow*n+i])
		if conf < minConf {
			continue
		}
		cx, cy := float64(out.Data[i]), float64(out.Data[n+i])
		w, h := float64(out.Data[2*n+i]), float64(out.Data[3*n+i])
		b := Box{clamp01((cx - w/2 - dx) / nw), clamp01((cy - h/2 - dy) / nh), clamp01((cx + w/2 - dx) / nw), clamp01((cy + h/2 - dy) / nh), conf}
		if b.X2 > b.X1 && b.Y2 > b.Y1 {
			boxes = append(boxes, b)
		}
	}
	sort.Slice(boxes, func(i, j int) bool { return boxes[i].Conf > boxes[j].Conf })
	var keep []Box
	for _, b := range boxes {
		ok := true
		for _, k := range keep {
			if iou(b, k) >= nmsIoU {
				ok = false
				break
			}
		}
		if ok {
			keep = append(keep, b)
		}
	}
	return keep, nil
}

// cover — какая доля кадра закрыта рамками (с учётом наложений).
func cover(boxes []Box) float64 {
	const g = 100
	var grid [g * g]bool
	for _, b := range boxes {
		x0, x1 := int(b.X1*g), int(b.X2*g+0.999)
		y0, y1 := int(b.Y1*g), int(b.Y2*g+0.999)
		if x1 > g {
			x1 = g
		}
		if y1 > g {
			y1 = g
		}
		for y := y0; y < y1; y++ {
			for x := x0; x < x1; x++ {
				grid[y*g+x] = true
			}
		}
	}
	n := 0
	for _, v := range grid {
		if v {
			n++
		}
	}
	return float64(n) / (g * g)
}

// PersonCheck — что сеть увидела на фото.
type PersonCheck struct {
	Dominant    bool    // на фото в основном человек, а не объект
	People      int     // сколько людей найдено уверенно
	Cover       float64 // доля кадра под людьми
	CenterCover float64 // то же в центральной части кадра
	Conf        float64 // уверенность по самому заметному человеку
}

// CheckPerson отвечает, не человек ли на фото вместо объекта.
func CheckPerson(img image.Image) (PersonCheck, error) {
	var res PersonCheck
	net, err := sharedNet()
	if err != nil {
		return res, err
	}
	select {
	case slot <- struct{}{}:
		defer func() { <-slot }()
	case <-time.After(waitForSlot):
		return res, ErrBusy
	}
	src := toRGBA(img)
	b := src.Bounds()
	if b.Dx() < 32 || b.Dy() < 32 {
		return res, nil
	}
	full, err := net.people(src, b, fullConf)
	if err != nil {
		return res, err
	}
	res.People = len(full)
	if len(full) == 0 {
		return res, nil
	}
	res.Cover = cover(full)
	res.Conf = full[0].Conf
	if res.Cover < fullCover {
		return res, nil
	}
	mx := int(float64(b.Dx()) * (1 - centerPart) / 2)
	my := int(float64(b.Dy()) * (1 - centerPart) / 2)
	center, err := net.people(src, image.Rect(b.Min.X+mx, b.Min.Y+my, b.Max.X-mx, b.Max.Y-my), centerConf)
	if err != nil {
		return res, err
	}
	res.CenterCover = cover(center)
	res.Dominant = res.CenterCover >= centerCover
	return res, nil
}
