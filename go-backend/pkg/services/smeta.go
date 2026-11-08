package services

import (
	"fmt"
	"math"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
)

// ─────────────────────────────────────────────────────────────────────────────
// Смета QazGost: объём каждой позиции считается по геометрии объекта и нормам
// расхода, цена берётся из справочника smeta_rates.go (с источником), сценарии
// отличаются реальным составом работ и маркой материалов, а не множителем.
// ─────────────────────────────────────────────────────────────────────────────

// SmetaGeo — геометрия помещения/объекта, измеренная по контуру.
type SmetaGeo struct {
	Area      float64 `json:"area"`      // м², площадь по контуру (пол / пятно застройки)
	Perimeter float64 `json:"perimeter"` // м
	Height    float64 `json:"height"`    // м, высота стен / этажа
	Doors     int     `json:"doors"`     // дверные проёмы 0,9×2,1 м
	Windows   int     `json:"windows"`   // оконные проёмы 1,5×1,5 м
}

const (
	doorW, doorH     = 0.9, 2.1
	windowW, windowH = 1.5, 1.5
)

func (g SmetaGeo) OpeningsArea() float64 {
	return float64(g.Doors)*doorW*doorH + float64(g.Windows)*windowW*windowH
}

// WallArea — площадь стен за вычетом проёмов.
func (g SmetaGeo) WallArea() float64 {
	return math.Max(0, g.Perimeter*g.Height-g.OpeningsArea())
}

// SkirtingLength — длина плинтуса: периметр минус ширина дверей.
func (g SmetaGeo) SkirtingLength() float64 {
	return math.Max(0, g.Perimeter-float64(g.Doors)*doorW)
}

// ── Технологические карты ──

type SmetaOption struct {
	Value float64 `json:"value"`
	Label string  `json:"label"`
}

type SmetaParam struct {
	Key     string        `json:"key"`
	Label   string        `json:"label"`
	Unit    string        `json:"unit,omitempty"`
	Default float64       `json:"default"`
	Min     float64       `json:"min"`
	Max     float64       `json:"max"`
	Step    float64       `json:"step,omitempty"`
	Options []SmetaOption `json:"options,omitempty"`
	Hint    string        `json:"hint,omitempty"`
}

// tmLine — строка техкарты. Rate — ключ расценки или уровня (smetaTiers).
type tmLine struct {
	Stage  string
	Rate   string
	Only   string // "" — во всех сценариях, "eco", "std+", "prem"
	PerDay float64
	Qty    func(c *smetaCtx) (float64, string)
}

type tmStage struct {
	Name string
	Wait float64 // технологический перерыв после этапа, дней
	Why  string
}

type TechMap struct {
	ID        string
	Title     string
	Group     string
	BaseLabel string // что обозначает контур
	UseHeight bool
	UseOpen   bool
	Params    []SmetaParam
	Stages    []tmStage
	Lines     []tmLine
	Assume    func(c *smetaCtx) []string
	Scenario  [3]string // описание состава сценариев
	// ScenarioFn — описание состава с учётом выбранных параметров (если задано)
	ScenarioFn func(c *smetaCtx) [3]string
}

type smetaCtx struct {
	G      SmetaGeo
	P      map[string]float64
	Tier   int // 0 эконом, 1 стандарт, 2 премиум
	prefix string
}

func (c *smetaCtx) p(key string) float64 {
	if v, ok := c.P[c.prefix+key]; ok {
		return v
	}
	return c.P[key]
}

func (c *smetaCtx) pi(key string) int { return int(math.Round(c.p(key))) }

// packs — сколько упаковок нужно на расход amount (кг/л/м²) при фасовке pack.
func packs(amount, pack float64) float64 {
	if amount <= 0 {
		return 0
	}
	return math.Ceil(amount/pack - 1e-9)
}

func r2(v float64) float64 { return math.Round(v*100) / 100 }
func r1(v float64) float64 { return math.Round(v*10) / 10 }

func f(v float64) string {
	if math.Abs(v-math.Round(v)) < 1e-9 {
		return fmt.Sprintf("%.0f", v)
	}
	s := fmt.Sprintf("%.2f", v)
	s = strings.TrimRight(strings.TrimRight(s, "0"), ".")
	return strings.Replace(s, ".", ",", 1)
}

// ── Запрос / ответ ──

type SmetaRequest struct {
	Category string             `json:"category"`
	Complex  string             `json:"complex,omitempty"`
	Geometry SmetaGeo           `json:"geometry"`
	Params   map[string]float64 `json:"params"`
	City     string             `json:"city"`
	Mode     string             `json:"mode"` // fast | detailed | full
}

type SmetaItem struct {
	Stage    string  `json:"stage"`
	Category string  `json:"category"`
	Key      string  `json:"key"`
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	Qty      float64 `json:"qty"`
	Price    float64 `json:"price"`
	Total    float64 `json:"total"`
	Kind     string  `json:"kind"`
	Source   string  `json:"source"`
	URL      string  `json:"url,omitempty"`
	Verified bool    `json:"verified"`
	Note     string  `json:"note,omitempty"`
	Why      string  `json:"why"`
	days     float64
}

type SmetaScenario struct {
	ID         string      `json:"id"`
	Name       string      `json:"name"`
	Note       string      `json:"note"`
	Items      []SmetaItem `json:"items"`
	Works      float64     `json:"works"`
	Materials  float64     `json:"materials"`
	Equipment  float64     `json:"equipment"`
	Subtotal   float64     `json:"subtotal"`
	Reserve    float64     `json:"reserve"`
	Total      float64     `json:"total"`
	PerM2      float64     `json:"perM2"`
	Unverified float64     `json:"unverified"` // сумма строк с расчётной оценкой цены
}

type SmetaCheck struct {
	Level string `json:"level"` // ok | warn | error
	Text  string `json:"text"`
}

type SmetaDBMatch struct {
	Key      string  `json:"key"`
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	Our      float64 `json:"our"`
	DBMedian float64 `json:"dbMedian"`
	DBMin    float64 `json:"dbMin"`
	DBMax    float64 `json:"dbMax"`
	DBCount  int     `json:"dbCount"`
	DBQ1     float64 `json:"dbQ1,omitempty"`      // нижний квартиль аналогов
	DBQ3     float64 `json:"dbQ3,omitempty"`      // верхний квартиль аналогов
	Dropped  int     `json:"dbDropped,omitempty"` // отброшено выбросов
	Ratio    float64 `json:"ratio"`
	Status   string  `json:"status"` // ok | high | low | none
	Example  string  `json:"example,omitempty"`
}

type SmetaAudit struct {
	Checks []SmetaCheck   `json:"checks"`
	DB     []SmetaDBMatch `json:"db"`
}

type SmetaScheduleStage struct {
	Stage    string  `json:"stage"`
	Category string  `json:"category"`
	Start    float64 `json:"start"`
	Days     float64 `json:"days"`
	Wait     float64 `json:"wait"`
	Why      string  `json:"why,omitempty"`
}

type SmetaSchedule struct {
	Days   float64              `json:"days"`
	Stages []SmetaScheduleStage `json:"stages"`
	Note   string               `json:"note"`
}

type SmetaPurchase struct {
	Key    string  `json:"key"`
	Name   string  `json:"name"`
	Unit   string  `json:"unit"`
	Qty    float64 `json:"qty"`
	Price  float64 `json:"price"`
	Total  float64 `json:"total"`
	Source string  `json:"source"`
	URL    string  `json:"url,omitempty"`
}

type SmetaSource struct {
	Source string   `json:"source"`
	URLs   []string `json:"urls"`
	Count  int      `json:"count"`
}

type SmetaGeoOut struct {
	SmetaGeo
	WallArea     float64 `json:"wallArea"`
	OpeningsArea float64 `json:"openingsArea"`
	Skirting     float64 `json:"skirting"`
}

type SmetaResult struct {
	Title       string                     `json:"title"`
	Category    string                     `json:"category"`
	Complex     string                     `json:"complex,omitempty"`
	Parts       []string                   `json:"parts"`
	Mode        string                     `json:"mode"`
	City        string                     `json:"city"`
	RegionCoef  float64                    `json:"regionCoef"`
	PriceDate   string                     `json:"priceDate"`
	Geometry    SmetaGeoOut                `json:"geometry"`
	Params      map[string]float64         `json:"params"`
	Scenarios   []SmetaScenario            `json:"scenarios"`
	Assumptions []string                   `json:"assumptions"`
	Audit       *SmetaAudit                `json:"audit,omitempty"`
	Schedule    map[string]*SmetaSchedule  `json:"schedule,omitempty"`
	Purchases   map[string][]SmetaPurchase `json:"purchases,omitempty"`
	Sources     []SmetaSource              `json:"sources"`
	Method      string                     `json:"method"`
}

// Региональные коэффициенты для городов, которых нет в базе цен.
var smetaExtraRegions = map[string]float64{
	"Актау": 1.25, "Петропавловск": 1.08, "Уральск": 1.10, "Талдыкорган": 0.95,
	"Туркестан": 0.90, "Кызылорда": 1.05,
}

// SmetaRegions — города и коэффициенты (база QazGost + дополнительные).
func SmetaRegions(db *PriceDBService) map[string]float64 {
	out := map[string]float64{"Алматы": 1}
	for k, v := range smetaExtraRegions {
		out[k] = v
	}
	if db != nil {
		for k, v := range db.GetRegions() {
			if k != "default" && v > 0 {
				out[k] = v
			}
		}
	}
	return out
}

var scenarioMeta = [3]struct{ id, name string }{{"eco", "Эконом"}, {"std", "Стандарт"}, {"prem", "Премиум"}}

func lineActive(only string, tier int) bool {
	switch only {
	case "":
		return true
	case "eco":
		return tier == 0
	case "std+":
		return tier >= 1
	case "std":
		return tier == 1
	case "prem":
		return tier == 2
	case "eco+std":
		return tier <= 1
	}
	return true
}

func resolveRate(key string, tier int) (SmetaRate, bool) {
	if t, ok := smetaTiers[key]; ok {
		key = t[tier]
	}
	r, ok := smetaRates[key]
	return r, ok
}

// SmetaError — ошибка входных данных (400).
type SmetaError struct{ Msg string }

func (e SmetaError) Error() string { return e.Msg }

// CalcSmeta — главный расчёт.
func CalcSmeta(req SmetaRequest, db *PriceDBService) (SmetaResult, error) {
	mode := req.Mode
	if mode != "detailed" && mode != "full" {
		mode = "fast"
	}
	g := req.Geometry
	if g.Area <= 0 || g.Perimeter <= 0 {
		return SmetaResult{}, SmetaError{"Нет геометрии: замкните контур или введите площадь и периметр"}
	}
	if g.Area > 100000 || g.Perimeter > 5000 {
		return SmetaResult{}, SmetaError{"Площадь больше 100 000 м² — проверьте масштаб контура"}
	}
	if g.Height <= 0 {
		g.Height = 2.7
	}
	if g.Height > 50 {
		return SmetaResult{}, SmetaError{"Высота больше 50 м — проверьте ввод (указывается высота стен, а не дома целиком)"}
	}
	if g.Area > g.Perimeter*g.Perimeter/(4*math.Pi)*1.1 {
		return SmetaResult{}, SmetaError{fmt.Sprintf("Площадь %s м² невозможна при периметре %s м (максимум %s м²) — проверьте размеры", f(r1(g.Area)), f(r1(g.Perimeter)), f(r1(g.Perimeter*g.Perimeter/(4*math.Pi))))}
	}
	if g.Doors < 0 || g.Windows < 0 || g.Doors > 200 || g.Windows > 400 {
		return SmetaResult{}, SmetaError{"Некорректное число проёмов"}
	}

	// состав: одна техкарта или комплекс
	type part struct {
		tm       *TechMap
		prefix   string
		override map[string]float64
	}
	var parts []part
	title := ""
	if req.Complex != "" {
		cx, ok := smetaComplexes[req.Complex]
		if !ok {
			return SmetaResult{}, SmetaError{"Неизвестный комплекс работ: " + req.Complex}
		}
		title = cx.Title
		for _, p := range cx.Parts {
			tm := smetaTechMaps[p.Category]
			if tm == nil {
				continue
			}
			parts = append(parts, part{tm, p.Category + ".", p.Params})
		}
	} else {
		tm := smetaTechMaps[req.Category]
		if tm == nil {
			return SmetaResult{}, SmetaError{"Нет технологической карты для категории «" + req.Category + "»"}
		}
		title = tm.Title
		parts = append(parts, part{tm, "", nil})
	}

	city := strings.TrimSpace(req.City)
	if city == "" {
		city = "Алматы"
	}
	regions := SmetaRegions(db)
	coef, ok := regions[city]
	unknownCity := ""
	if !ok {
		unknownCity, city, coef = city, "Алматы", 1
	}

	// параметры: значения по умолчанию → переопределения комплекса → ввод пользователя
	params := map[string]float64{}
	for _, pt := range parts {
		for _, sp := range pt.tm.Params {
			k := pt.prefix + sp.Key
			v := sp.Default
			if ov, ok := pt.override[sp.Key]; ok {
				v = ov
			}
			if uv, ok := req.Params[k]; ok {
				v = uv
			} else if uv, ok := req.Params[sp.Key]; ok && pt.prefix == "" {
				v = uv
			}
			if v < sp.Min {
				v = sp.Min
			}
			if sp.Max > sp.Min && v > sp.Max {
				v = sp.Max
			}
			params[k] = v
		}
	}

	res := SmetaResult{
		Title: title, Category: req.Category, Complex: req.Complex, Mode: mode, City: city,
		RegionCoef: coef, PriceDate: SmetaPriceDate, Params: params,
		Geometry: SmetaGeoOut{SmetaGeo: g, WallArea: r2(g.WallArea()), OpeningsArea: r2(g.OpeningsArea()), Skirting: r2(g.SkirtingLength())},
		Method: "Объём каждой позиции рассчитан по геометрии контура и нормам расхода производителей; " +
			"цены — рыночные, с источником у каждой строки; региональный коэффициент применён к работам и материалам; " +
			"сценарии различаются составом работ и маркой материалов.",
	}
	for _, pt := range parts {
		res.Parts = append(res.Parts, pt.tm.ID)
	}

	sched := map[string]*SmetaSchedule{}
	purch := map[string][]SmetaPurchase{}
	for tier := 0; tier < 3; tier++ {
		sc := SmetaScenario{ID: scenarioMeta[tier].id, Name: scenarioMeta[tier].name}
		var notes []string
		var schedStages []SmetaScheduleStage
		day := 0.0
		for _, pt := range parts {
			ctx := &smetaCtx{G: g, P: params, Tier: tier, prefix: pt.prefix}
			scn := pt.tm.Scenario
			if pt.tm.ScenarioFn != nil {
				scn = pt.tm.ScenarioFn(ctx)
			}
			same := scn[0] == scn[1] && scn[1] == scn[2]
			if s := scn[tier]; s != "" && !(same && len(parts) > 1) {
				if len(parts) > 1 {
					notes = append(notes, pt.tm.Title+": "+s)
				} else {
					notes = append(notes, s)
				}
			}
			stageDays := map[string]float64{}
			for _, ln := range pt.tm.Lines {
				if !lineActive(ln.Only, tier) {
					continue
				}
				rate, ok := resolveRate(ln.Rate, tier)
				if !ok {
					return SmetaResult{}, fmt.Errorf("smeta: нет расценки %s (%s)", ln.Rate, pt.tm.ID)
				}
				qty, why := ln.Qty(ctx)
				if qty <= 0 {
					continue
				}
				switch rate.Unit {
				case "шт", "мешок", "ведро", "канистра", "рулон", "лист", "компл", "точка", "рейс", "выезд", "ступень", "ед", "баллон":
					qty = math.Ceil(qty - 1e-9)
				default:
					qty = r2(qty)
				}
				price := math.Round(rate.Price * coef)
				it := SmetaItem{
					Stage: ln.Stage, Category: pt.tm.ID, Key: rate.Key, Name: rate.Name, Unit: rate.Unit,
					Qty: qty, Price: price, Total: math.Round(qty * price), Kind: rate.Kind,
					Source: rate.Source, URL: rate.URL, Verified: rate.Verified, Note: rate.Note, Why: why,
				}
				if ln.PerDay > 0 && rate.Kind != "material" {
					it.days = qty / ln.PerDay
					stageDays[ln.Stage] += it.days
				}
				sc.Items = append(sc.Items, it)
				switch rate.Kind {
				case "material":
					sc.Materials += it.Total
				case "equipment":
					sc.Equipment += it.Total
				default:
					sc.Works += it.Total
				}
				if !rate.Verified {
					sc.Unverified += it.Total
				}
			}
			// график: этапы последовательно, в порядке техкарты
			for _, st := range pt.tm.Stages {
				d := stageDays[st.Name]
				if d <= 0 && st.Wait <= 0 {
					continue
				}
				if d <= 0 {
					// этап без работ в этом сценарии — пропускаем и перерыв
					hasLines := false
					for _, it := range sc.Items {
						if it.Stage == st.Name && it.Category == pt.tm.ID {
							hasLines = true
							break
						}
					}
					if !hasLines {
						continue
					}
				}
				d = math.Max(0.5, math.Ceil(d*2)/2)
				schedStages = append(schedStages, SmetaScheduleStage{Stage: st.Name, Category: pt.tm.Title, Start: day, Days: d, Wait: st.Wait, Why: st.Why})
				day += d + st.Wait
			}
		}
		sc.Subtotal = sc.Works + sc.Materials + sc.Equipment
		sc.Reserve = math.Round(sc.Subtotal * 0.10)
		sc.Total = sc.Subtotal + sc.Reserve
		if g.Area > 0 {
			sc.PerM2 = math.Round(sc.Subtotal / g.Area)
		}
		sc.Note = strings.Join(notes, " · ")
		res.Scenarios = append(res.Scenarios, sc)

		if mode == "full" {
			last := 0.0
			if n := len(schedStages); n > 0 {
				last = schedStages[n-1].Start + schedStages[n-1].Days
			}
			sched[sc.ID] = &SmetaSchedule{Days: last, Stages: schedStages,
				Note: "Одна бригада, этапы идут последовательно; в сроки включены технологические перерывы (высыхание, набор прочности). Выработка — по нормам ЕНиР/практике бригад."}
			purch[sc.ID] = buildPurchases(sc.Items)
		}
	}

	// допущения
	seen := map[string]bool{}
	add := func(s string) {
		if s != "" && !seen[s] {
			seen[s] = true
			res.Assumptions = append(res.Assumptions, s)
		}
	}
	if unknownCity != "" {
		add(fmt.Sprintf("Города «%s» нет в справочнике — расчёт по ценам Алматы.", unknownCity))
	}
	add(fmt.Sprintf("Проёмы: двери %d × 0,9×2,1 м, окна %d × 1,5×1,5 м — вычтены из площади стен.", g.Doors, g.Windows))
	if coef != 1 {
		add(fmt.Sprintf("Цены Алматы пересчитаны для г. %s с коэффициентом %s.", city, f(coef)))
	}
	for _, pt := range parts {
		if pt.tm.Assume != nil {
			ctx := &smetaCtx{G: g, P: params, Tier: 1, prefix: pt.prefix}
			for _, s := range pt.tm.Assume(ctx) {
				add(s)
			}
		}
	}
	add("Резерв 10% на непредвиденные работы показан отдельно и не входит в стоимость позиций.")

	res.Sources = buildSources(res.Scenarios)

	if mode == "detailed" || mode == "full" {
		res.Audit = buildAudit(res, g, db)
	}
	if mode == "full" {
		res.Schedule = sched
		res.Purchases = purch
	}
	return res, nil
}

func buildPurchases(items []SmetaItem) []SmetaPurchase {
	idx := map[string]int{}
	out := []SmetaPurchase{} // пустой список, а не null, когда материалов нет
	for _, it := range items {
		if it.Kind != "material" {
			continue
		}
		if i, ok := idx[it.Key]; ok {
			out[i].Qty += it.Qty
			out[i].Total += it.Total
			continue
		}
		idx[it.Key] = len(out)
		out = append(out, SmetaPurchase{Key: it.Key, Name: it.Name, Unit: it.Unit, Qty: it.Qty, Price: it.Price, Total: it.Total, Source: it.Source, URL: it.URL})
	}
	for i := range out {
		out[i].Qty = r2(out[i].Qty)
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].Total > out[j].Total })
	return out
}

func buildSources(scs []SmetaScenario) []SmetaSource {
	idx := map[string]int{}
	var out []SmetaSource
	keys := map[string]bool{}
	for _, sc := range scs {
		for _, it := range sc.Items {
			if keys[it.Key] {
				continue
			}
			keys[it.Key] = true
			i, ok := idx[it.Source]
			if !ok {
				i = len(out)
				idx[it.Source] = i
				out = append(out, SmetaSource{Source: it.Source, URLs: []string{}})
			}
			out[i].Count++
			if it.URL != "" {
				dup := false
				for _, u := range out[i].URLs {
					if u == it.URL {
						dup = true
						break
					}
				}
				if !dup {
					out[i].URLs = append(out[i].URLs, it.URL)
				}
			}
		}
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].Count > out[j].Count })
	return out
}

// ── Проверка сметы (режимы «Детальный» и «Полный») ──

func normUnit(u string) string {
	u = strings.ToLower(strings.TrimSpace(u))
	u = strings.NewReplacer("2", "²", "3", "³", " ", "", ".", "").Replace(u)
	switch u {
	case "м²", "кв.м", "квм", "м2":
		return "м²"
	case "м³", "кубм", "м3":
		return "м³"
	case "мп", "пм", "м":
		return "м"
	case "шт", "штук":
		return "шт"
	case "т", "тн", "тонна":
		return "т"
	}
	return u
}

func buildAudit(res SmetaResult, g SmetaGeo, db *PriceDBService) *SmetaAudit {
	a := &SmetaAudit{}
	ok := func(s string) { a.Checks = append(a.Checks, SmetaCheck{"ok", s}) }
	warn := func(s string) { a.Checks = append(a.Checks, SmetaCheck{"warn", s}) }

	// 1. геометрия
	maxArea := g.Perimeter * g.Perimeter / (4 * math.Pi)
	if g.Area > maxArea*1.02 {
		warn(fmt.Sprintf("Площадь %s м² больше максимально возможной для периметра %s м (%s м²) — проверьте контур.", f(r1(g.Area)), f(r1(g.Perimeter)), f(r1(maxArea))))
	} else {
		sq := g.Perimeter / 4
		if g.Area < sq*sq*0.25 {
			warn(fmt.Sprintf("Контур очень вытянутый: при периметре %s м площадь всего %s м². Если это не коридор — проверьте точки.", f(r1(g.Perimeter)), f(r1(g.Area))))
		} else {
			ok(fmt.Sprintf("Геометрия согласована: %s м² при периметре %s м.", f(r1(g.Area)), f(r1(g.Perimeter))))
		}
	}
	usesHeight := false
	for _, id := range res.Parts {
		if tm := smetaTechMaps[id]; tm != nil && tm.UseHeight {
			usesHeight = true
		}
	}
	if usesHeight {
		if g.Height < 2.2 || g.Height > 4.5 {
			warn(fmt.Sprintf("Высота %s м нетипична для помещения (обычно 2,5–3,2 м).", f(g.Height)))
		}
		wall := g.Perimeter * g.Height
		if wall > 0 && g.OpeningsArea() > wall*0.4 {
			warn(fmt.Sprintf("Проёмы занимают %s%% стен — проверьте количество окон и дверей.", f(math.Round(g.OpeningsArea()/wall*100))))
		}
	}

	// 2. доля строк с проверенной ценой
	std := res.Scenarios[1]
	if std.Subtotal > 0 {
		share := 100 - math.Round(std.Unverified/std.Subtotal*100)
		msg := fmt.Sprintf("%s%% суммы «Стандарта» — по ценам из открытых прайсов и объявлений со ссылкой.", f(share))
		if share >= 80 {
			ok(msg)
		} else {
			warn(msg + " Остальное — расчётная оценка QazGost: уточните эти строки у поставщика.")
		}
	}

	// 3. ориентир рынка для ремонта квартиры
	if res.Complex == "apartment_renovation" || res.Complex == "turnkey" {
		perM2 := math.Round(std.Works / g.Area)
		lo, hi := 25000.0*res.RegionCoef, 35000.0*res.RegionCoef
		txt := fmt.Sprintf("Работы «Стандарта»: %s ₸/м² пола. Средняя цена базовых черновых и чистовых работ в РК — 25–35 тыс. ₸/м² (Bizmedia/OLX, июнь 2026).", fmtMoney(perM2))
		if perM2 < lo*0.7 || perM2 > hi*1.4 {
			warn(txt + " Отклонение заметное — проверьте состав работ.")
		} else {
			ok(txt)
		}
	}

	// 4. технологические замечания
	for _, id := range res.Parts {
		pref := ""
		if res.Complex != "" {
			pref = id + "."
		}
		switch id {
		case "floors":
			if res.Params[pref+"cover"] == 0 {
				warn("В «Эконом» ламинат кладётся без новой стяжки: это допустимо только при перепаде основания не более 2 мм на 1 м.")
			} else {
				warn("В «Эконом» плитка кладётся без новой стяжки: перепады основания до 5 мм выбираются клеем, больше — нужна стяжка.")
			}
		case "wall_finish":
			warn("В «Эконом» стены не выравниваются по маякам — только шпаклёвка по существующей поверхности. Подходит, если отклонение стен до 5 мм.")
		}
	}

	// 5. сверка цен с базой QazGost (без позиций с пометкой «подозрительная»)
	if db != nil {
		seen := map[string]bool{}
		for _, sc := range res.Scenarios {
			for _, it := range sc.Items {
				if seen[it.Key] {
					continue
				}
				seen[it.Key] = true
				if m, ok := dbAnalogs(db, it, res.City); ok {
					a.DB = append(a.DB, m)
				}
			}
		}
		n, okN, off := 0, 0, 0
		for _, m := range a.DB {
			if m.Status == "none" {
				continue
			}
			n++
			if m.Status == "ok" {
				okN++
			} else {
				off++
			}
		}
		if n > 0 {
			txt := fmt.Sprintf("Сверка со справочной базой QazGost: у %d позиций есть не меньше %d аналогов, у %d из них цена в коридоре базы (от ½ нижнего квартиля до 2 × верхнего, без выбросов).", n, dbMinAnalogs, okN)
			if off > 0 {
				warn(txt + fmt.Sprintf(" По %d позициям цена базы заметно отличается — в смете оставлена цена справочника с источником, разбор в таблице сверки.", off))
			} else {
				ok(txt)
			}
		}
	}
	return a
}

var wordRe = regexp.MustCompile(`[0-9a-zа-я²³×,]+`)

func smetaWords(s string) []string {
	return wordRe.FindAllString(strings.ReplaceAll(strings.ToLower(s), "ё", "е"), -1)
}

// Аналоги в базе не меняются, пока работает сервер: результат поиска кэшируется
// по позиции и городу, иначе «Детальный» режим перебирал 23 864 позиции на каждую строку.
type dbAnalogHit struct {
	prices   []float64
	examples []string
}

var dbAnalogCache sync.Map // "key|city" → dbAnalogHit

// WarmSmetaAudit заранее находит аналоги для базового города, чтобы первый запрос не ждал.
func WarmSmetaAudit(db *PriceDBService) {
	if db == nil {
		return
	}
	for _, r := range smetaRateList {
		if smetaRates[r.Key].DBQuery != "" {
			dbAnalogLookup(db, r.Key, "Алматы")
		}
	}
}

// Фасовка в названии: «Цемент М500, 50 кг», «Краска акриловая (10л)».
var packRe = regexp.MustCompile(`(\d+(?:[.,]\d+)?)\s*(кг|л)(?:[^\p{L}]|$)`)

// Единицы-упаковки: цены таких позиций сравниваются в пересчёте на одинаковую фасовку.
var packUnits = map[string]bool{"мешок": true, "ведро": true, "канистра": true, "банка": true, "баллон": true, "шт": true}

func packOf(name string) (float64, string, bool) {
	m := packRe.FindStringSubmatch(strings.ToLower(name))
	if m == nil {
		return 0, "", false
	}
	v, err := strconv.ParseFloat(strings.ReplaceAll(m[1], ",", "."), 64)
	if err != nil || v <= 0 {
		return 0, "", false
	}
	return v, m[2], true
}

func dbAnalogLookup(db *PriceDBService, key, city string) dbAnalogHit {
	ck := key + "|" + city
	if v, ok := dbAnalogCache.Load(ck); ok {
		return v.(dbAnalogHit)
	}
	rate := smetaRates[key]
	terms := smetaWords(rate.DBQuery)
	sr := db.Search(SearchParams{Query: rate.DBQuery, Type: rate.Kind, Region: city, Limit: 500, Unique: true})
	want := normUnit(rate.Unit)
	ourSize, ourMeas, ourPack := packOf(rate.Name)
	ourPack = ourPack && packUnits[want]
	hit := dbAnalogHit{}
	for _, p := range sr.Items {
		if p.Price <= 0 {
			continue
		}
		price, unit := p.Price, normUnit(p.Unit)
		normalized := false
		if ourPack {
			// мешок 25 кг и мешок 50 кг — разные товары: сравниваем цену за одинаковую фасовку,
			// а позиции в другой мере (литры против килограммов) не сравниваем вовсе
			if size, meas, ok := packOf(p.Name); ok {
				if meas != ourMeas || !packUnits[unit] {
					continue
				}
				if size != ourSize {
					price = p.Price * ourSize / size
					normalized = true
				}
				unit = want
			}
		}
		if unit != want {
			continue
		}
		ws := smetaWords(p.Name)
		match := true
		for _, t := range terms {
			found := false
			for _, w := range ws {
				if strings.HasPrefix(w, t) {
					found = true
					break
				}
			}
			if !found {
				match = false
				break
			}
		}
		if !match {
			continue
		}
		hit.prices = append(hit.prices, price)
		if len(hit.examples) < 3 {
			ex := fmt.Sprintf("%s — %s ₸", p.Name, fmtMoney(p.Price))
			if normalized {
				ex += fmt.Sprintf(" (≈%s ₸ за %s %s)", fmtMoney(price), f(ourSize), ourMeas)
			}
			hit.examples = append(hit.examples, ex)
		}
	}
	sort.Float64s(hit.prices)
	dbAnalogCache.Store(ck, hit)
	return hit
}

// Минимум аналогов для сверки: по одной-двум позициям базы вывод не делается.
const dbMinAnalogs = 3

// quantile — квантиль отсортированного ряда с линейной интерполяцией.
func quantile(sorted []float64, q float64) float64 {
	if len(sorted) == 0 {
		return 0
	}
	pos := q * float64(len(sorted)-1)
	lo := int(math.Floor(pos))
	hi := int(math.Ceil(pos))
	return sorted[lo] + (sorted[hi]-sorted[lo])*(pos-float64(lo))
}

// robustPrices отбрасывает выбросы по правилу Тьюки на логарифмах цен
// (за пределами Q1 − 1,5·IQR … Q3 + 1,5·IQR): в базе встречаются позиции
// другого масштаба (демонтаж плитки по 25 ₸ рядом с 1 600 ₸), и одна такая
// позиция сдвигает медиану маленькой выборки. Вход отсортирован.
func robustPrices(sorted []float64) []float64 {
	if len(sorted) < 4 {
		return sorted
	}
	logs := make([]float64, len(sorted))
	for i, p := range sorted {
		logs[i] = math.Log(p)
	}
	q1, q3 := quantile(logs, 0.25), quantile(logs, 0.75)
	iqr := q3 - q1
	lo, hi := q1-1.5*iqr, q3+1.5*iqr
	out := make([]float64, 0, len(sorted))
	for i, p := range sorted {
		if logs[i] >= lo-1e-9 && logs[i] <= hi+1e-9 {
			out = append(out, p)
		}
	}
	return out
}

// dbAnalogs ищет в базе QazGost аналоги позиции: каждое слово запроса — начало слова в названии,
// единица измерения совпадает. Позиции с пометкой «подозрительная» не учитываются,
// выбросы отбрасываются (robustPrices). Цена сметы считается совпадающей с базой, если
// лежит в межквартильном коридоре аналогов, расширенном вдвое: [Q1 / 2; Q3 × 2].
// Коридор, а не медиана, потому что в базе под одним запросом лежат и эконом-, и премиум-позиции.
func dbAnalogs(db *PriceDBService, it SmetaItem, city string) (SmetaDBMatch, bool) {
	rate := smetaRates[it.Key]
	if rate.DBQuery == "" {
		return SmetaDBMatch{}, false
	}
	hit := dbAnalogLookup(db, it.Key, city)
	prices := robustPrices(hit.prices)
	m := SmetaDBMatch{Key: it.Key, Name: it.Name, Unit: it.Unit, Our: it.Price, DBCount: len(prices),
		Dropped: len(hit.prices) - len(prices), Status: "none", Example: strings.Join(hit.examples, "; ")}
	if len(prices) < dbMinAnalogs {
		return m, true
	}
	m.DBMedian = quantile(prices, 0.5)
	m.DBMin, m.DBMax = prices[0], prices[len(prices)-1]
	m.DBQ1, m.DBQ3 = quantile(prices, 0.25), quantile(prices, 0.75)
	m.Ratio = math.Round(it.Price/m.DBMedian*100) / 100
	switch {
	case it.Price > m.DBQ3*2:
		m.Status = "high"
	case it.Price < m.DBQ1/2:
		m.Status = "low"
	default:
		m.Status = "ok"
	}
	return m, true
}

func fmtMoney(v float64) string {
	s := fmt.Sprintf("%.0f", math.Round(v))
	neg := strings.HasPrefix(s, "-")
	s = strings.TrimPrefix(s, "-")
	var b strings.Builder
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteRune(' ')
		}
		b.WriteRune(ch)
	}
	if neg {
		return "-" + b.String()
	}
	return b.String()
}

// ── Описание техкарт для интерфейса ──

type SmetaTechMapInfo struct {
	ID        string       `json:"id"`
	Title     string       `json:"title"`
	Group     string       `json:"group"`
	BaseLabel string       `json:"baseLabel"`
	UseHeight bool         `json:"useHeight"`
	UseOpen   bool         `json:"useOpenings"`
	Params    []SmetaParam `json:"params"`
	Scenarios [3]string    `json:"scenarios"`
	Stages    []string     `json:"stages"`
}

type SmetaComplexInfo struct {
	ID        string                        `json:"id"`
	Title     string                        `json:"title"`
	Parts     []string                      `json:"parts"`
	Overrides map[string]map[string]float64 `json:"overrides"` // параметры частей, заданные комплексом
}

func SmetaTechMapList() ([]SmetaTechMapInfo, []SmetaComplexInfo) {
	var maps []SmetaTechMapInfo
	for _, id := range smetaOrder {
		tm := smetaTechMaps[id]
		if tm == nil {
			continue
		}
		info := SmetaTechMapInfo{ID: tm.ID, Title: tm.Title, Group: tm.Group, BaseLabel: tm.BaseLabel, UseHeight: tm.UseHeight, UseOpen: tm.UseOpen, Params: tm.Params, Scenarios: tm.Scenario}
		if info.Params == nil {
			info.Params = []SmetaParam{}
		}
		for _, s := range tm.Stages {
			info.Stages = append(info.Stages, s.Name)
		}
		maps = append(maps, info)
	}
	var cx []SmetaComplexInfo
	for _, id := range smetaComplexOrder {
		c := smetaComplexes[id]
		ci := SmetaComplexInfo{ID: id, Title: c.Title, Overrides: map[string]map[string]float64{}}
		for _, p := range c.Parts {
			ci.Parts = append(ci.Parts, p.Category)
			if len(p.Params) > 0 {
				ci.Overrides[p.Category] = p.Params
			}
		}
		cx = append(cx, ci)
	}
	return maps, cx
}
