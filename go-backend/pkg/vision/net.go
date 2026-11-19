// Package vision — небольшая нейросеть прямо в сервере: находит людей на фото.
//
// Зачем: «Смета по фото» не должна считаться по снимку человека. Отдельного сервиса с Python на
// хостинге нет, поэтому сеть YOLO26n (COCO) исполняется здесь же, обычным кодом на Go: файл
// coco320.qzm — это список операций и веса (готовит ai-service/scripts/export_people_model.py).
// Один кадр 320×320 считается за доли секунды на одном-двух ядрах.
package vision

import (
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"runtime"
	"sync"
)

// Tensor — многомерный массив чисел, данные лежат подряд (как в ONNX: N, C, H, W).
type Tensor struct {
	Shape []int
	Data  []float32
}

func newTensor(shape ...int) *Tensor {
	n := 1
	for _, d := range shape {
		n *= d
	}
	return &Tensor{Shape: append([]int(nil), shape...), Data: make([]float32, n)}
}

func (t *Tensor) size() int { return len(t.Data) }

type node struct {
	Op    string                 `json:"op"`
	In    []string               `json:"in"`
	Out   []string               `json:"out"`
	Attrs map[string]interface{} `json:"attrs"`
}

func (n *node) ints(name string) []int {
	v, ok := n.Attrs[name].([]interface{})
	if !ok {
		return nil
	}
	out := make([]int, len(v))
	for i, x := range v {
		f, _ := x.(float64)
		out[i] = int(f)
	}
	return out
}

func (n *node) int(name string, def int) int {
	if f, ok := n.Attrs[name].(float64); ok {
		return int(f)
	}
	return def
}

// Net — загруженная сеть. Run можно вызывать из нескольких потоков.
type Net struct {
	Size    int
	input   string
	output  string
	nodes   []node
	consts  map[string]*Tensor
	lastUse map[string]int
	workers int
}

// Load разбирает файл формата QZM1.
func Load(raw []byte) (*Net, error) {
	if len(raw) < 8 || string(raw[:4]) != "QZM1" {
		return nil, errors.New("vision: неизвестный формат модели")
	}
	hl := int(binary.LittleEndian.Uint32(raw[4:8]))
	if hl <= 0 || 8+hl > len(raw) {
		return nil, errors.New("vision: повреждён заголовок модели")
	}
	var head struct {
		Input   string `json:"input"`
		Output  string `json:"output"`
		Size    int    `json:"size"`
		Tensors map[string]struct {
			Dims []int `json:"dims"`
			Off  int   `json:"off"`
			Len  int   `json:"len"`
		} `json:"tensors"`
		Nodes []node `json:"nodes"`
	}
	if err := json.Unmarshal(raw[8:8+hl], &head); err != nil {
		return nil, fmt.Errorf("vision: заголовок модели: %w", err)
	}
	blob := raw[8+hl:]
	net := &Net{Size: head.Size, input: head.Input, output: head.Output, nodes: head.Nodes,
		consts: map[string]*Tensor{}, lastUse: map[string]int{}}
	for name, t := range head.Tensors {
		if t.Off < 0 || t.Len < 0 || (t.Off+t.Len)*4 > len(blob) {
			return nil, fmt.Errorf("vision: веса %q выходят за файл", name)
		}
		data := make([]float32, t.Len)
		for i := range data {
			data[i] = math.Float32frombits(binary.LittleEndian.Uint32(blob[(t.Off+i)*4:]))
		}
		net.consts[name] = &Tensor{Shape: t.Dims, Data: data}
	}
	for i, n := range net.nodes {
		for _, in := range n.In {
			if in != "" {
				net.lastUse[in] = i
			}
		}
	}
	net.workers = runtime.NumCPU()
	if net.workers > 4 {
		net.workers = 4
	}
	if net.workers < 1 {
		net.workers = 1
	}
	return net, nil
}

// Run считает сеть. Вход — [1, 3, Size, Size], числа 0…1.
func (net *Net) Run(input *Tensor) (out *Tensor, err error) {
	defer func() {
		if r := recover(); r != nil {
			out, err = nil, fmt.Errorf("vision: сбой расчёта: %v", r)
		}
	}()
	if len(input.Shape) != 4 || input.Shape[1] != 3 || input.Shape[2] != net.Size || input.Shape[3] != net.Size {
		return nil, fmt.Errorf("vision: ждали вход [1 3 %d %d], получили %v", net.Size, net.Size, input.Shape)
	}
	vals := map[string]*Tensor{net.input: input}
	get := func(name string) *Tensor {
		if t, ok := vals[name]; ok {
			return t
		}
		if t, ok := net.consts[name]; ok {
			return t
		}
		panic("нет значения " + name)
	}
	for i := range net.nodes {
		n := &net.nodes[i]
		switch n.Op {
		case "Conv":
			var bias *Tensor
			if len(n.In) > 2 && n.In[2] != "" {
				bias = get(n.In[2])
			}
			vals[n.Out[0]] = net.conv(get(n.In[0]), get(n.In[1]), bias, n)
		case "Sigmoid":
			vals[n.Out[0]] = sigmoid(get(n.In[0]))
		case "Mul", "Add", "Sub", "Div":
			vals[n.Out[0]] = binary2(n.Op, get(n.In[0]), get(n.In[1]))
		case "Split":
			parts := split(get(n.In[0]), n.int("axis", 0), n.ints("int1"), len(n.Out))
			for k, name := range n.Out {
				vals[name] = parts[k]
			}
		case "Concat":
			ts := make([]*Tensor, len(n.In))
			for k, name := range n.In {
				ts[k] = get(name)
			}
			vals[n.Out[0]] = concat(ts, n.int("axis", 0))
		case "MaxPool":
			vals[n.Out[0]] = maxPool(get(n.In[0]), n)
		case "Reshape":
			vals[n.Out[0]] = reshape(get(n.In[0]), n.ints("int1"))
		case "Transpose":
			vals[n.Out[0]] = transpose(get(n.In[0]), n.ints("perm"))
		case "MatMul":
			vals[n.Out[0]] = matMul(get(n.In[0]), get(n.In[1]))
		case "Softmax":
			vals[n.Out[0]] = softmaxLast(get(n.In[0]), n.int("axis", -1))
		case "Resize":
			vals[n.Out[0]] = upsample2(get(n.In[0]), n)
		case "Slice":
			vals[n.Out[0]] = slice(get(n.In[0]), n.ints("int1"), n.ints("int2"), n.ints("int3"), n.ints("int4"))
		default:
			return nil, fmt.Errorf("vision: операция %s не поддержана", n.Op)
		}
		// промежуточные результаты больше не нужны — отпускаем память
		for _, in := range n.In {
			if in != "" && net.lastUse[in] == i && in != net.output {
				delete(vals, in)
			}
		}
	}
	res, ok := vals[net.output]
	if !ok {
		return nil, errors.New("vision: сеть не дала ответа")
	}
	return res, nil
}

// parallel делит 0…n на куски и считает их в нескольких потоках.
func (net *Net) parallel(n int, fn func(from, to int)) {
	w := net.workers
	if w > n {
		w = n
	}
	if w <= 1 {
		fn(0, n)
		return
	}
	var wg sync.WaitGroup
	var mu sync.Mutex
	var failure interface{}
	step := (n + w - 1) / w
	for from := 0; from < n; from += step {
		to := from + step
		if to > n {
			to = n
		}
		wg.Add(1)
		go func(a, b int) {
			defer wg.Done()
			defer func() {
				if r := recover(); r != nil {
					mu.Lock()
					failure = r
					mu.Unlock()
				}
			}()
			fn(a, b)
		}(from, to)
	}
	wg.Wait()
	if failure != nil {
		panic(failure)
	}
}

// axpy: dst += w * src (одинаковая длина)
func axpy(dst, src []float32, w float32) {
	src = src[:len(dst)]
	i := 0
	for ; i+4 <= len(dst); i += 4 {
		d := dst[i : i+4 : i+4]
		s := src[i : i+4 : i+4]
		d[0] += w * s[0]
		d[1] += w * s[1]
		d[2] += w * s[2]
		d[3] += w * s[3]
	}
	for ; i < len(dst); i++ {
		dst[i] += w * src[i]
	}
}

func (net *Net) conv(x, wt, bias *Tensor, n *node) *Tensor {
	C, H, W := x.Shape[1], x.Shape[2], x.Shape[3]
	M, cg, kh, kw := wt.Shape[0], wt.Shape[1], wt.Shape[2], wt.Shape[3]
	group := n.int("group", 1)
	stride := 1
	if s := n.ints("strides"); len(s) == 2 {
		stride = s[0]
	}
	pt, pl, pb, pr := 0, 0, 0, 0
	if p := n.ints("pads"); len(p) == 4 {
		pt, pl, pb, pr = p[0], p[1], p[2], p[3]
	}
	if C != cg*group || M%group != 0 {
		panic(fmt.Sprintf("conv: каналы %d, группа %d, вес %v", C, group, wt.Shape))
	}
	Ho := (H+pt+pb-kh)/stride + 1
	Wo := (W+pl+pr-kw)/stride + 1
	out := newTensor(1, M, Ho, Wo)
	plane, inPlane := Ho*Wo, H*W
	mg := M / group
	net.parallel(M, func(from, to int) {
		for oc := from; oc < to; oc++ {
			dst := out.Data[oc*plane : (oc+1)*plane]
			if bias != nil {
				b := bias.Data[oc]
				for i := range dst {
					dst[i] = b
				}
			}
			icBase := (oc / mg) * cg
			for ic := 0; ic < cg; ic++ {
				src := x.Data[(icBase+ic)*inPlane : (icBase+ic+1)*inPlane]
				wk := wt.Data[(oc*cg+ic)*kh*kw : (oc*cg+ic+1)*kh*kw]
				if kh == 1 && kw == 1 && stride == 1 && pt == 0 && pl == 0 {
					if w := wk[0]; w != 0 {
						axpy(dst, src, w)
					}
					continue
				}
				for ky := 0; ky < kh; ky++ {
					for kx := 0; kx < kw; kx++ {
						w := wk[ky*kw+kx]
						if w == 0 {
							continue
						}
						// диапазон ox, при котором ix = ox*stride + kx - pl попадает в кадр
						ox0 := 0
						if pl-kx > 0 {
							ox0 = (pl - kx + stride - 1) / stride
						}
						ox1 := (W - 1 + pl - kx) / stride
						if ox1 > Wo-1 {
							ox1 = Wo - 1
						}
						if ox1 < ox0 {
							continue
						}
						for oy := 0; oy < Ho; oy++ {
							iy := oy*stride + ky - pt
							if iy < 0 || iy >= H {
								continue
							}
							d := dst[oy*Wo+ox0 : oy*Wo+ox1+1]
							s0 := iy*W + ox0*stride + kx - pl
							if stride == 1 {
								axpy(d, src[s0:s0+len(d)], w)
							} else {
								for i := range d {
									d[i] += w * src[s0+i*stride]
								}
							}
						}
					}
				}
			}
		}
	})
	return out
}

func sigmoid(x *Tensor) *Tensor {
	out := &Tensor{Shape: x.Shape, Data: make([]float32, len(x.Data))}
	for i, v := range x.Data {
		out.Data[i] = float32(1 / (1 + math.Exp(-float64(v))))
	}
	return out
}

func apply(op string, a, b float32) float32 {
	switch op {
	case "Mul":
		return a * b
	case "Add":
		return a + b
	case "Sub":
		return a - b
	}
	return a / b
}

// binary2 — поэлементная операция с «растягиванием» размеров, как в numpy.
func binary2(op string, a, b *Tensor) *Tensor {
	if len(a.Data) == len(b.Data) && sameShape(a.Shape, b.Shape) {
		out := &Tensor{Shape: a.Shape, Data: make([]float32, len(a.Data))}
		switch op {
		case "Mul":
			for i, v := range a.Data {
				out.Data[i] = v * b.Data[i]
			}
		case "Add":
			for i, v := range a.Data {
				out.Data[i] = v + b.Data[i]
			}
		default:
			for i, v := range a.Data {
				out.Data[i] = apply(op, v, b.Data[i])
			}
		}
		return out
	}
	if len(b.Data) == 1 {
		out := &Tensor{Shape: a.Shape, Data: make([]float32, len(a.Data))}
		s := b.Data[0]
		for i, v := range a.Data {
			out.Data[i] = apply(op, v, s)
		}
		return out
	}
	if len(a.Data) == 1 {
		out := &Tensor{Shape: b.Shape, Data: make([]float32, len(b.Data))}
		s := a.Data[0]
		for i, v := range b.Data {
			out.Data[i] = apply(op, s, v)
		}
		return out
	}
	rank := len(a.Shape)
	if len(b.Shape) > rank {
		rank = len(b.Shape)
	}
	as, bs := padShape(a.Shape, rank), padShape(b.Shape, rank)
	shape := make([]int, rank)
	for i := range shape {
		switch {
		case as[i] == bs[i]:
			shape[i] = as[i]
		case as[i] == 1:
			shape[i] = bs[i]
		case bs[i] == 1:
			shape[i] = as[i]
		default:
			panic(fmt.Sprintf("%s: размеры %v и %v несовместимы", op, a.Shape, b.Shape))
		}
	}
	out := newTensor(shape...)
	astr, bstr := strides(as), strides(bs)
	idx := make([]int, rank)
	for i := range out.Data {
		ai, bi := 0, 0
		for d := 0; d < rank; d++ {
			if as[d] != 1 {
				ai += idx[d] * astr[d]
			}
			if bs[d] != 1 {
				bi += idx[d] * bstr[d]
			}
		}
		out.Data[i] = apply(op, a.Data[ai], b.Data[bi])
		for d := rank - 1; d >= 0; d-- {
			idx[d]++
			if idx[d] < shape[d] {
				break
			}
			idx[d] = 0
		}
	}
	return out
}

func sameShape(a, b []int) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func padShape(s []int, rank int) []int {
	out := make([]int, rank)
	for i := range out {
		out[i] = 1
	}
	copy(out[rank-len(s):], s)
	return out
}

func strides(shape []int) []int {
	out := make([]int, len(shape))
	s := 1
	for i := len(shape) - 1; i >= 0; i-- {
		out[i] = s
		s *= shape[i]
	}
	return out
}

func normAxis(axis, rank int) int {
	if axis < 0 {
		axis += rank
	}
	if axis < 0 || axis >= rank {
		panic(fmt.Sprintf("ось %d вне размерности %d", axis, rank))
	}
	return axis
}

// sliceAxis вырезает [from, to) по одной оси.
func sliceAxis(x *Tensor, axis, from, to int) *Tensor {
	shape := append([]int(nil), x.Shape...)
	shape[axis] = to - from
	out := newTensor(shape...)
	inner := 1
	for _, d := range x.Shape[axis+1:] {
		inner *= d
	}
	outer := 1
	for _, d := range x.Shape[:axis] {
		outer *= d
	}
	full := x.Shape[axis] * inner
	part := (to - from) * inner
	for o := 0; o < outer; o++ {
		copy(out.Data[o*part:(o+1)*part], x.Data[o*full+from*inner:o*full+to*inner])
	}
	return out
}

func split(x *Tensor, axis int, sizes []int, count int) []*Tensor {
	axis = normAxis(axis, len(x.Shape))
	if len(sizes) == 0 {
		sizes = make([]int, count)
		for i := range sizes {
			sizes[i] = x.Shape[axis] / count
		}
	}
	out := make([]*Tensor, len(sizes))
	from := 0
	for i, s := range sizes {
		out[i] = sliceAxis(x, axis, from, from+s)
		from += s
	}
	return out
}

func concat(ts []*Tensor, axis int) *Tensor {
	axis = normAxis(axis, len(ts[0].Shape))
	shape := append([]int(nil), ts[0].Shape...)
	shape[axis] = 0
	for _, t := range ts {
		shape[axis] += t.Shape[axis]
	}
	out := newTensor(shape...)
	inner := 1
	for _, d := range shape[axis+1:] {
		inner *= d
	}
	outer := 1
	for _, d := range shape[:axis] {
		outer *= d
	}
	pos := 0
	for o := 0; o < outer; o++ {
		for _, t := range ts {
			part := t.Shape[axis] * inner
			copy(out.Data[pos:pos+part], t.Data[o*part:(o+1)*part])
			pos += part
		}
	}
	return out
}

func maxPool(x *Tensor, n *node) *Tensor {
	C, H, W := x.Shape[1], x.Shape[2], x.Shape[3]
	k := n.ints("kernel_shape")
	p := n.ints("pads")
	s := n.ints("strides")
	if len(k) != 2 || len(p) != 4 || len(s) != 2 || s[0] != 1 || s[1] != 1 || p[0]*2+1 != k[0] || p[1]*2+1 != k[1] {
		panic("maxpool: поддержан только вариант «тот же размер», шаг 1")
	}
	out := newTensor(1, C, H, W)
	ry, rx := p[0], p[1]
	tmp := make([]float32, H*W)
	for c := 0; c < C; c++ {
		src := x.Data[c*H*W : (c+1)*H*W]
		dst := out.Data[c*H*W : (c+1)*H*W]
		// максимум по окну раскладывается на два прохода: по строкам и по столбцам
		for y := 0; y < H; y++ {
			for xx := 0; xx < W; xx++ {
				a, b := xx-rx, xx+rx
				if a < 0 {
					a = 0
				}
				if b > W-1 {
					b = W - 1
				}
				m := src[y*W+a]
				for i := a + 1; i <= b; i++ {
					if v := src[y*W+i]; v > m {
						m = v
					}
				}
				tmp[y*W+xx] = m
			}
		}
		for y := 0; y < H; y++ {
			a, b := y-ry, y+ry
			if a < 0 {
				a = 0
			}
			if b > H-1 {
				b = H - 1
			}
			for xx := 0; xx < W; xx++ {
				m := tmp[a*W+xx]
				for i := a + 1; i <= b; i++ {
					if v := tmp[i*W+xx]; v > m {
						m = v
					}
				}
				dst[y*W+xx] = m
			}
		}
	}
	return out
}

func reshape(x *Tensor, shape []int) *Tensor {
	out := append([]int(nil), shape...)
	known, unknown := 1, -1
	for i, d := range out {
		if d == 0 {
			d = x.Shape[i]
			out[i] = d
		}
		if d == -1 {
			unknown = i
			continue
		}
		known *= d
	}
	if unknown >= 0 {
		out[unknown] = len(x.Data) / known
		known *= out[unknown]
	}
	if known != len(x.Data) {
		panic(fmt.Sprintf("reshape: %v → %v", x.Shape, shape))
	}
	return &Tensor{Shape: out, Data: x.Data}
}

func transpose(x *Tensor, perm []int) *Tensor {
	rank := len(x.Shape)
	if len(perm) != rank {
		panic("transpose: неверная перестановка")
	}
	shape := make([]int, rank)
	for i, p := range perm {
		shape[i] = x.Shape[p]
	}
	out := newTensor(shape...)
	src := strides(x.Shape)
	idx := make([]int, rank)
	for i := range out.Data {
		off := 0
		for d := 0; d < rank; d++ {
			off += idx[d] * src[perm[d]]
		}
		out.Data[i] = x.Data[off]
		for d := rank - 1; d >= 0; d-- {
			idx[d]++
			if idx[d] < shape[d] {
				break
			}
			idx[d] = 0
		}
	}
	return out
}

// matMul перемножает матрицы в двух последних измерениях; остальные измерения совпадают.
func matMul(a, b *Tensor) *Tensor {
	ra, rb := len(a.Shape), len(b.Shape)
	if ra < 2 || ra != rb || !sameShape(a.Shape[:ra-2], b.Shape[:rb-2]) || a.Shape[ra-1] != b.Shape[rb-2] {
		panic(fmt.Sprintf("matmul: %v × %v", a.Shape, b.Shape))
	}
	n, m, k := a.Shape[ra-2], a.Shape[ra-1], b.Shape[rb-1]
	batch := 1
	for _, d := range a.Shape[:ra-2] {
		batch *= d
	}
	shape := append(append([]int(nil), a.Shape[:ra-2]...), n, k)
	out := newTensor(shape...)
	for bi := 0; bi < batch; bi++ {
		A := a.Data[bi*n*m : (bi+1)*n*m]
		B := b.Data[bi*m*k : (bi+1)*m*k]
		O := out.Data[bi*n*k : (bi+1)*n*k]
		for i := 0; i < n; i++ {
			row := O[i*k : (i+1)*k]
			for j := 0; j < m; j++ {
				if w := A[i*m+j]; w != 0 {
					axpy(row, B[j*k:(j+1)*k], w)
				}
			}
		}
	}
	return out
}

func softmaxLast(x *Tensor, axis int) *Tensor {
	if normAxis(axis, len(x.Shape)) != len(x.Shape)-1 {
		panic("softmax: поддержана только последняя ось")
	}
	k := x.Shape[len(x.Shape)-1]
	out := &Tensor{Shape: x.Shape, Data: make([]float32, len(x.Data))}
	for off := 0; off < len(x.Data); off += k {
		row := x.Data[off : off+k]
		m := row[0]
		for _, v := range row[1:] {
			if v > m {
				m = v
			}
		}
		sum := 0.0
		for i, v := range row {
			e := math.Exp(float64(v - m))
			out.Data[off+i] = float32(e)
			sum += e
		}
		inv := float32(1 / sum)
		for i := range row {
			out.Data[off+i] *= inv
		}
	}
	return out
}

func upsample2(x *Tensor, n *node) *Tensor {
	sc, _ := n.Attrs["scales"].([]interface{})
	mode, _ := n.Attrs["mode"].(string)
	if len(sc) != 4 || sc[2] != 2.0 || sc[3] != 2.0 || mode != "nearest" {
		panic("resize: поддержано только увеличение вдвое по ближайшему соседу")
	}
	C, H, W := x.Shape[1], x.Shape[2], x.Shape[3]
	out := newTensor(1, C, H*2, W*2)
	for c := 0; c < C; c++ {
		for y := 0; y < H; y++ {
			src := x.Data[c*H*W+y*W : c*H*W+(y+1)*W]
			r0 := out.Data[c*4*H*W+(2*y)*2*W : c*4*H*W+(2*y+1)*2*W]
			for i, v := range src {
				r0[2*i] = v
				r0[2*i+1] = v
			}
			copy(out.Data[c*4*H*W+(2*y+1)*2*W:c*4*H*W+(2*y+2)*2*W], r0)
		}
	}
	return out
}

func slice(x *Tensor, starts, ends, axes, steps []int) *Tensor {
	out := x
	for i := range starts {
		axis := i
		if i < len(axes) {
			axis = axes[i]
		}
		axis = normAxis(axis, len(x.Shape))
		if i < len(steps) && steps[i] != 1 {
			panic("slice: шаг, отличный от 1, не поддержан")
		}
		dim := out.Shape[axis]
		from, to := starts[i], ends[i]
		if from < 0 {
			from += dim
		}
		if to < 0 {
			to += dim
		}
		if to > dim {
			to = dim
		}
		if from < 0 {
			from = 0
		}
		if from > to {
			from = to
		}
		out = sliceAxis(out, axis, from, to)
	}
	return out
}
