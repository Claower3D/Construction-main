package handlers

// Инженерный калькулятор (канализация, водоснабжение, электрика) — встроен в сервер.
// Раньше эти адреса пересылались в отдельный Python-сервис; когда он не запущен, сайт получал 502.
// Формулы и нормативы совпадают с ai-service/app/services/engineering_calc.py один в один
// (проверяется тестом на эталонных ответах Python-версии).

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"qazgost-ai/backend/pkg/services"
)

type engNorm struct {
	Name  string
	Unit  string
	Price float64
	Labor float64
}

type engItem struct {
	Name      string      `json:"name"`
	Volume    interface{} `json:"volume"` // число с одним знаком или целое (шт.)
	Unit      string      `json:"unit"`
	UnitPrice int64       `json:"unit_price"`
	Total     int64       `json:"total"`
	Materials int64       `json:"materials"`
	Works     int64       `json:"works"`
}

type engSystem struct {
	System        string    `json:"system"`
	SnipCode      string    `json:"snip_code"`
	Items         []engItem `json:"items"`
	WorksCost     int64     `json:"works_cost"`
	MaterialsCost int64     `json:"materials_cost"`
	TotalCost     int64     `json:"total_cost"`
	TimelineDays  int64     `json:"timeline_days"`
	City          string    `json:"city"`
	RegionalCoeff float64   `json:"regional_coeff"`
}

type engFull struct {
	Systems       []engSystem `json:"systems"`
	GrandTotal    int64       `json:"grand_total"`
	AreaM2        float64     `json:"area_m2"`
	City          string      `json:"city"`
	RegionalCoeff float64     `json:"regional_coeff"`
	TimelineDays  int64       `json:"timeline_days"`
}

var engRegionalCoeff = map[string]float64{
	"алматы": 1.0, "астана": 1.15, "шымкент": 0.95, "караганда": 1.05, "атырау": 1.25,
	"актау": 1.30, "актобе": 1.10, "павлодар": 1.08, "усть-каменогорск": 1.12, "семей": 1.00,
	"тараз": 0.90, "кызылорда": 1.10, "костанай": 1.05, "петропавловск": 1.00, "туркестан": 0.90,
}

// порядок городов для сообщений об ошибке
var engCityOrder = []string{"алматы", "астана", "шымкент", "караганда", "атырау", "актау", "актобе", "павлодар",
	"усть-каменогорск", "семей", "тараз", "кызылорда", "костанай", "петропавловск", "туркестан"}

var engCityAliases = map[string]string{
	"almaty": "алматы", "alma-ata": "алматы", "алма-ата": "алматы",
	"astana": "астана", "nur-sultan": "астана", "нур-султан": "астана",
	"shymkent": "шымкент", "chimkent": "шымкент",
	"karaganda": "караганда", "karagandy": "караганда", "қарағанды": "караганда",
	"atyrau": "атырау",
	"aktau":  "актау", "ақтау": "актау",
	"aktobe": "актобе", "ақтөбе": "актобе",
	"pavlodar":        "павлодар",
	"ust-kamenogorsk": "усть-каменогорск", "oskemen": "усть-каменогорск", "өскемен": "усть-каменогорск",
	"semey": "семей", "semei": "семей",
	"taraz":     "тараз",
	"kyzylorda": "кызылорда", "қызылорда": "кызылорда",
	"kostanay": "костанай", "qostanay": "костанай",
	"petropavlovsk": "петропавловск", "petropavl": "петропавловск",
	"turkestan": "туркестан", "türkistan": "туркестан",
}

var engSewage = map[string]engNorm{
	"pipe_pvc_110":       {"Труба ПВХ ∅110мм", "п.м.", 2800, 4500},
	"pipe_pvc_50":        {"Труба ПВХ ∅50мм", "п.м.", 1500, 3200},
	"pipe_cast_iron_100": {"Труба чугунная ∅100мм", "п.м.", 8500, 7500},
	"manhole_d1000":      {"Колодец ∅1000мм", "шт.", 85000, 45000},
	"trench_1m":          {"Траншея глубиной 1м", "п.м.", 0, 12000},
	"trench_1_5m":        {"Траншея глубиной 1.5м", "п.м.", 0, 18000},
	"backfill":           {"Обратная засыпка", "м³", 3500, 4000},
	"sand_bed":           {"Песчаное основание 200мм", "п.м.", 2200, 2500},
}

var engSewagePipes = []string{"pipe_pvc_110", "pipe_pvc_50", "pipe_cast_iron_100"}

// наружный диаметр трубы, м — вычитается из объёма засыпки
var engSewagePipeOD = map[string]float64{"pipe_pvc_110": 0.110, "pipe_pvc_50": 0.050, "pipe_cast_iron_100": 0.118}

var engWater = map[string]engNorm{
	"pipe_pp_25":    {"Труба ПП ∅25мм", "п.м.", 950, 2800},
	"valve_25":      {"Кран шаровый ∅25мм", "шт.", 4500, 2500},
	"filter_coarse": {"Фильтр грубой очистки", "шт.", 8500, 3000},
	"meter_water":   {"Счётчик воды", "шт.", 12000, 5000},
}

var engElectrical = map[string]engNorm{
	"wire_vvg_3x2_5": {"Кабель ВВГ 3×2.5мм²", "п.м.", 450, 1200},
	"socket_install": {"Установка розетки", "шт.", 2500, 3500},
	"switch_install": {"Установка выключателя", "шт.", 2000, 3000},
	"panel_12":       {"Щиток 12 модулей", "шт.", 18000, 12000},
	"panel_24":       {"Щиток 24 модуля", "шт.", 28000, 15000},
	"breaker_16a":    {"Автомат 16А", "шт.", 3500, 1500},
	"rcd_40a":        {"УЗО 40А", "шт.", 12000, 2500},
}

var engSupportedSystems = []string{"sewage", "water_supply", "electrical"}

const (
	engTrenchWidthM = 0.5 // ширина траншеи по дну, м
	engSandBedM     = 0.2 // толщина песчаного основания, м
)

// engNormalizeCity — ключ таблицы коэффициентов по названию города (кириллица/латиница, любой регистр)
func engNormalizeCity(name string) (string, bool) {
	key := strings.Join(strings.Fields(strings.ReplaceAll(strings.ToLower(strings.TrimSpace(name)), "ё", "е")), " ")
	key = strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(key, "г. ", ""), "город ", ""))
	if _, ok := engRegionalCoeff[key]; ok {
		return key, true
	}
	if v, ok := engCityAliases[key]; ok {
		return v, true
	}
	return "", false
}

// engRound — коммерческое округление до целого (0,5 → вверх), как ОКРУГЛ в Excel
func engRound(x float64) int64 {
	return int64(math.Floor(x + 0.5))
}

// engRound1 — округление до одного знака так же, как round(x, 1) в Python
func engRound1(x float64) float64 {
	v, _ := strconv.ParseFloat(strconv.FormatFloat(x, 'f', 1, 64), 64)
	return v
}

// engMakeItem — строка ведомости: цена за единицу = (материал + работа) × коэффициент
func engMakeItem(n engNorm, volume, coeff float64, whole bool) engItem {
	unitPrice := engRound((n.Price + n.Labor) * coeff)
	var vol interface{}
	var total int64
	if whole {
		iv := int64(volume)
		vol = iv
		total = iv * unitPrice
	} else {
		fv := engRound1(volume)
		vol = fv
		total = engRound(fv * float64(unitPrice))
	}
	var materials int64
	if denom := n.Price + n.Labor; denom != 0 {
		materials = engRound(float64(total) * n.Price / denom)
	}
	return engItem{Name: n.Name, Volume: vol, Unit: n.Unit, UnitPrice: unitPrice, Total: total, Materials: materials, Works: total - materials}
}

func engFinish(system, snip string, items []engItem, days int64, city string, coeff float64) engSystem {
	s := engSystem{System: system, SnipCode: snip, Items: items, TimelineDays: days, City: city, RegionalCoeff: coeff}
	for _, it := range items {
		s.TotalCost += it.Total
		s.MaterialsCost += it.Materials
	}
	s.WorksCost = s.TotalCost - s.MaterialsCost
	return s
}

func engMaxInt(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func engCalcSewage(lengthM, depthM float64, pipeKey string, manholes int64, city string) engSystem {
	coeff := engRegionalCoeff[city]
	if _, ok := engSewagePipeOD[pipeKey]; !ok {
		pipeKey = "pipe_pvc_110"
	}
	trench := engSewage["trench_1m"]
	if depthM >= 1.3 {
		trench = engSewage["trench_1_5m"]
	}
	od := engSewagePipeOD[pipeKey]
	pipeArea := math.Pi * (od / 2) * (od / 2)
	backfill := lengthM * math.Max(0, engTrenchWidthM*depthM-engTrenchWidthM*engSandBedM-pipeArea)
	items := []engItem{
		engMakeItem(engSewage[pipeKey], lengthM*1.05, coeff, false), // +5% запас
		engMakeItem(trench, lengthM, coeff, false),
		engMakeItem(engSewage["sand_bed"], lengthM, coeff, false),
		engMakeItem(engSewage["backfill"], backfill, coeff, false),
	}
	if manholes > 0 {
		items = append(items, engMakeItem(engSewage["manhole_d1000"], float64(manholes), coeff, true))
	}
	return engFinish("Канализация", "СП РК 4.01-103-2013", items, engMaxInt(3, engRound(lengthM/10)), city, coeff)
}

func engCalcWater(points int64, pipeLengthM float64, hotWater bool, city string) engSystem {
	coeff := engRegionalCoeff[city]
	k := 1.0
	suffix := " (ХВС)"
	if hotWater {
		k = 2
		suffix = " (ХВС+ГВС)"
	}
	pipe := engWater["pipe_pp_25"]
	pipe.Name += suffix
	items := []engItem{
		engMakeItem(pipe, pipeLengthM*k*1.1, coeff, false), // +10% запас
		engMakeItem(engWater["valve_25"], float64(points)*k, coeff, true),
		engMakeItem(engWater["meter_water"], k, coeff, true),
		engMakeItem(engWater["filter_coarse"], 1, coeff, true),
	}
	return engFinish("Водоснабжение", "СП РК 4.01-101-2012", items, engMaxInt(2, engRound(pipeLengthM/15)), city, coeff)
}

func engCalcElectrical(areaM2 float64, sockets, switches int64, city string) engSystem {
	coeff := engRegionalCoeff[city]
	if sockets == 0 {
		sockets = engMaxInt(6, engRound(areaM2/4)) // 1 розетка на 4 м²
	}
	if switches == 0 {
		switches = engMaxInt(3, engRound(areaM2/12)) // 1 выключатель на 12 м²
	}
	breakers := engMaxInt(6, engRound(float64(sockets)/3))
	panel := engElectrical["panel_24"]
	if areaM2 < 80 {
		panel = engElectrical["panel_12"]
	}
	items := []engItem{
		engMakeItem(engElectrical["wire_vvg_3x2_5"], areaM2*5, coeff, false), // ~5 п.м. кабеля на м²
		engMakeItem(engElectrical["socket_install"], float64(sockets), coeff, true),
		engMakeItem(engElectrical["switch_install"], float64(switches), coeff, true),
		engMakeItem(panel, 1, coeff, true),
		engMakeItem(engElectrical["breaker_16a"], float64(breakers), coeff, true),
		engMakeItem(engElectrical["rcd_40a"], 1, coeff, true),
	}
	return engFinish("Электрика", "ПУЭ РК, СП РК 4.04-106-2013", items, engMaxInt(3, engRound(areaM2/15)), city, coeff)
}

// engRequest — общий набор полей всех запросов калькулятора (лишние поля игнорируются)
type engRequest struct {
	City         *string  `json:"city"`
	LengthM      *float64 `json:"length_m"`
	DepthM       *float64 `json:"depth_m"`
	PipeType     *string  `json:"pipe_type"`
	Manholes     *float64 `json:"manholes"`
	PointsCount  *float64 `json:"points_count"`
	PipeLengthM  *float64 `json:"pipe_length_m"`
	HotWater     *bool    `json:"hot_water"`
	AreaM2       *float64 `json:"area_m2"`
	Sockets      *float64 `json:"sockets"`
	Switches     *float64 `json:"switches"`
	Systems      []string `json:"systems"`
	SewageLength *float64 `json:"sewage_length_m"`
	SewageDepth  *float64 `json:"sewage_depth_m"`
	WaterPoints  *float64 `json:"water_points"`
	WaterPipeM   *float64 `json:"water_pipe_m"`
}

type engError struct{ msg string }

func (e engError) Error() string { return e.msg }

func engBad(format string, a ...interface{}) error { return engError{fmt.Sprintf(format, a...)} }

// число в диапазоне (lo, hi] или [lo, hi] — как ограничения Pydantic gt/ge/le
func engNum(name string, v *float64, def float64, required, gt bool, lo, hi float64) (float64, error) {
	if v == nil {
		if required {
			return 0, engBad("Не указано поле %s", name)
		}
		return def, nil
	}
	x := *v
	if math.IsNaN(x) || math.IsInf(x, 0) || (gt && x <= lo) || (!gt && x < lo) || x > hi {
		cmp := "≥"
		if gt {
			cmp = ">"
		}
		return 0, engBad("Поле %s: нужно число %s %g и не больше %g", name, cmp, lo, hi)
	}
	return x, nil
}

func engInt(name string, v *float64, def int64, required bool, hi float64) (int64, error) {
	if v == nil {
		if required {
			return 0, engBad("Не указано поле %s", name)
		}
		return def, nil
	}
	x := *v
	if math.IsNaN(x) || math.IsInf(x, 0) || x != math.Trunc(x) || x < 0 || x > hi {
		return 0, engBad("Поле %s: нужно целое число от 0 до %g", name, hi)
	}
	return int64(x), nil
}

func engCity(v *string) (string, error) {
	if v == nil {
		return "алматы", nil
	}
	if len([]rune(*v)) > 60 {
		return "", engBad("Слишком длинное название города")
	}
	key, ok := engNormalizeCity(*v)
	if !ok {
		return "", engBad("Неизвестный город '%s'. Доступны: %s", *v, strings.Join(engCityOrder, ", "))
	}
	return key, nil
}

func engPipe(v *string) (string, error) {
	if v == nil {
		return "pipe_pvc_110", nil
	}
	for _, p := range engSewagePipes {
		if p == *v {
			return p, nil
		}
	}
	return "", engBad("Неизвестный тип трубы '%s'. Доступны: %s", *v, strings.Join(engSewagePipes, ", "))
}

func engFromSewage(req *engRequest) (interface{}, error) {
	city, err := engCity(req.City)
	if err != nil {
		return nil, err
	}
	length, err := engNum("length_m", req.LengthM, 0, true, true, 0, 10000)
	if err != nil {
		return nil, err
	}
	depth, err := engNum("depth_m", req.DepthM, 1.2, false, true, 0, 10)
	if err != nil {
		return nil, err
	}
	pipe, err := engPipe(req.PipeType)
	if err != nil {
		return nil, err
	}
	manholes, err := engInt("manholes", req.Manholes, 0, false, 1000)
	if err != nil {
		return nil, err
	}
	return engCalcSewage(length, depth, pipe, manholes, city), nil
}

func engFromWater(req *engRequest) (interface{}, error) {
	city, err := engCity(req.City)
	if err != nil {
		return nil, err
	}
	points, err := engInt("points_count", req.PointsCount, 0, true, 10000)
	if err != nil {
		return nil, err
	}
	length, err := engNum("pipe_length_m", req.PipeLengthM, 0, true, true, 0, 100000)
	if err != nil {
		return nil, err
	}
	return engCalcWater(points, length, req.HotWater == nil || *req.HotWater, city), nil
}

func engFromElectrical(req *engRequest) (interface{}, error) {
	city, err := engCity(req.City)
	if err != nil {
		return nil, err
	}
	area, err := engNum("area_m2", req.AreaM2, 0, true, true, 0, 1000000)
	if err != nil {
		return nil, err
	}
	sockets, err := engInt("sockets", req.Sockets, 0, false, 100000)
	if err != nil {
		return nil, err
	}
	switches, err := engInt("switches", req.Switches, 0, false, 100000)
	if err != nil {
		return nil, err
	}
	return engCalcElectrical(area, sockets, switches, city), nil
}

func engFromFull(req *engRequest) (*engFull, error) {
	city, err := engCity(req.City)
	if err != nil {
		return nil, err
	}
	area, err := engNum("area_m2", req.AreaM2, 0, true, true, 0, 1000000)
	if err != nil {
		return nil, err
	}
	systems := engSupportedSystems
	if req.Systems != nil {
		if len(req.Systems) == 0 {
			return nil, engBad("Список систем пуст. Доступны: %s", strings.Join(engSupportedSystems, ", "))
		}
		var unknown []string
		for _, s := range req.Systems {
			known := false
			for _, k := range engSupportedSystems {
				known = known || k == s
			}
			if !known {
				unknown = append(unknown, s)
			}
		}
		if len(unknown) > 0 {
			return nil, engBad("Неподдерживаемые системы: %s. Доступны: %s (отопление и вентиляция пока не рассчитываются)",
				strings.Join(unknown, ", "), strings.Join(engSupportedSystems, ", "))
		}
		systems = req.Systems
	}
	want := func(name string) bool {
		for _, s := range systems {
			if s == name {
				return true
			}
		}
		return false
	}
	sewLen, err := engNum("sewage_length_m", req.SewageLength, math.Max(10, area*0.3), false, true, 0, 10000)
	if err != nil {
		return nil, err
	}
	sewDepth, err := engNum("sewage_depth_m", req.SewageDepth, 1.2, false, true, 0, 10)
	if err != nil {
		return nil, err
	}
	pipe, err := engPipe(req.PipeType)
	if err != nil {
		return nil, err
	}
	manholes, err := engInt("manholes", req.Manholes, engMaxInt(1, engRound(area/50)), false, 1000)
	if err != nil {
		return nil, err
	}
	points, err := engInt("water_points", req.WaterPoints, engMaxInt(4, engRound(area/8)), false, 10000)
	if err != nil {
		return nil, err
	}
	waterPipe, err := engNum("water_pipe_m", req.WaterPipeM, math.Max(15, area*0.4), false, true, 0, 100000)
	if err != nil {
		return nil, err
	}
	sockets, err := engInt("sockets", req.Sockets, 0, false, 100000)
	if err != nil {
		return nil, err
	}
	switches, err := engInt("switches", req.Switches, 0, false, 100000)
	if err != nil {
		return nil, err
	}

	out := &engFull{Systems: []engSystem{}, AreaM2: area, City: city, RegionalCoeff: engRegionalCoeff[city]}
	// порядок систем фиксированный, как в исходном калькуляторе
	if want("sewage") {
		out.Systems = append(out.Systems, engCalcSewage(sewLen, sewDepth, pipe, manholes, city))
	}
	if want("water_supply") {
		out.Systems = append(out.Systems, engCalcWater(points, waterPipe, req.HotWater == nil || *req.HotWater, city))
	}
	if want("electrical") {
		out.Systems = append(out.Systems, engCalcElectrical(area, sockets, switches, city))
	}
	for _, s := range out.Systems {
		out.GrandTotal += s.TotalCost
		out.TimelineDays = engMaxInt(out.TimelineDays, s.TimelineDays)
	}
	return out, nil
}

// engWriteError — ошибка в обоих принятых видах: detail (так отвечал Python-сервис) и error (как остальной сервер)
func engWriteError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"detail": msg, "error": msg})
}

var engTranslit = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "e", 'ж': "zh", 'з': "z", 'и': "i",
	'й': "y", 'к': "k", 'л': "l", 'м': "m", 'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t",
	'у': "u", 'ф': "f", 'х': "kh", 'ц': "ts", 'ч': "ch", 'ш': "sh", 'щ': "sch", 'ъ': "", 'ы': "y", 'ь': "",
	'э': "e", 'ю': "yu", 'я': "ya",
}

var engUnsafeName = regexp.MustCompile(`[^A-Za-z0-9._-]+`)

// engContentDisposition — имя файла латиницей + исходное (кириллица) по RFC 5987
func engContentDisposition(filename string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(filename) {
		if t, ok := engTranslit[r]; ok {
			b.WriteString(t)
		} else {
			b.WriteRune(r)
		}
	}
	ascii := strings.Trim(engUnsafeName.ReplaceAllString(b.String(), "_"), "_")
	if ascii == "" {
		ascii = "report"
	}
	return fmt.Sprintf("attachment; filename=\"%s\"; filename*=UTF-8''%s", ascii, url.PathEscape(filename))
}

func engReportName(e *engFull, ext string) string {
	area := strings.ReplaceAll(strconv.FormatFloat(e.AreaM2, 'g', 6, 64), ".", "_")
	return fmt.Sprintf("smeta_qazgost_%s_%sm2.%s", e.City, area, ext)
}

// Engineering — /api/v1/engineering/{sewage,water,electrical,full,report/pdf,report/excel}
func Engineering(w http.ResponseWriter, r *http.Request) {
	path := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/engineering"), "/")
	switch path {
	case "sewage", "water", "electrical", "full", "report/pdf", "report/excel":
	default:
		engWriteError(w, http.StatusNotFound, "Нет такого расчёта. Доступны: sewage, water, electrical, full, report/pdf, report/excel")
		return
	}
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", "POST")
		engWriteError(w, http.StatusMethodNotAllowed, "Расчёт выполняется запросом POST с параметрами в JSON")
		return
	}
	body, err := io.ReadAll(http.MaxBytesReader(w, r.Body, 64<<10))
	if err != nil {
		engWriteError(w, http.StatusRequestEntityTooLarge, "Слишком большой запрос")
		return
	}
	var req engRequest
	if err := json.Unmarshal(body, &req); err != nil {
		engWriteError(w, http.StatusUnprocessableEntity, "Параметры расчёта должны быть в формате JSON")
		return
	}

	var result interface{}
	var calcErr error
	switch path {
	case "sewage":
		result, calcErr = engFromSewage(&req)
	case "water":
		result, calcErr = engFromWater(&req)
	case "electrical":
		result, calcErr = engFromElectrical(&req)
	default:
		var full *engFull
		full, calcErr = engFromFull(&req)
		if calcErr == nil {
			switch path {
			case "report/excel":
				data, err := engExcelReport(full, services.VATRate)
				if err != nil {
					engWriteError(w, http.StatusInternalServerError, "Не удалось собрать Excel-файл")
					return
				}
				w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
				w.Header().Set("Content-Disposition", engContentDisposition(engReportName(full, "xlsx")))
				_, _ = w.Write(data)
				return
			case "report/pdf":
				data, err := engPDFReport(full, services.VATRate)
				if err != nil {
					engWriteError(w, http.StatusInternalServerError, "Не удалось собрать PDF-файл")
					return
				}
				w.Header().Set("Content-Type", "application/pdf")
				w.Header().Set("Content-Disposition", engContentDisposition(engReportName(full, "pdf")))
				_, _ = w.Write(data)
				return
			}
			result = full
		}
	}
	if calcErr != nil {
		engWriteError(w, http.StatusUnprocessableEntity, calcErr.Error())
		return
	}
	writeJSON(w, http.StatusOK, result)
}
