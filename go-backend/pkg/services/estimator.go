package services

import (
	"fmt"
	"math"
	"strings"
	"time"
)

// QTOFormulaRequest represents the parameters sent for QTO volume calculation
type QTOFormulaRequest struct {
	Category    string             `json:"category"`    // e.g. "foundation", "walls", "roof", "screed", "facade", "paint", "tile"
	Subtype     string             `json:"subtype"`     // e.g. "strip", "slab", "brick", "gasblock", "flat_roof", "pitched_roof"
	Dimensions  map[string]float64 `json:"dimensions"`  // length, width, height, thickness, area, volume, perimeter, openings
	City        string             `json:"city"`        // e.g. "Астана", "Алматы", "Шымкент"
	Scenario    string             `json:"scenario"`    // "economy", "standard", "premium"
	FloorCount  int                `json:"floorCount"`  // default 1
	SoilType    string             `json:"soilType"`    // "sand", "clay", "rock"
	Description string             `json:"description"` // optional textual description
}

// EstimateLineItem represents a detailed line in the cost estimate
type EstimateLineItem struct {
	Code      string  `json:"code"`
	Name      string  `json:"name"`
	Unit      string  `json:"unit"`
	Quantity  float64 `json:"quantity"`
	UnitPrice float64 `json:"unitPrice"`
	Total     float64 `json:"total"`
	Type      string  `json:"type"` // "work", "material", "equipment"
	SnipRef   string  `json:"snipRef,omitempty"`
}

// ScenarioResult represents calculation for a specific cost tier
type ScenarioResult struct {
	Name          string             `json:"name"`          // "Эконом", "Стандарт", "Премиум"
	TotalCost     float64            `json:"totalCost"`     // KZT
	WorksCost     float64            `json:"worksCost"`     // KZT
	MaterialsCost float64            `json:"materialsCost"` // KZT
	EquipmentCost float64            `json:"equipmentCost"` // KZT
	Contingency   float64            `json:"contingency"`   // Непредвиденные (5%)
	VATRate       float64            `json:"vatRate"`       // 0.16 с 01.01.2026
	VAT           float64            `json:"vat"`           // НДС к итогу
	TotalWithVAT  float64            `json:"totalWithVat"`  // итог с НДС
	TimelineDays  int                `json:"timelineDays"`
	Items         []EstimateLineItem `json:"items"`
}

// QTOEstimateResult represents the complete multi-scenario estimate output
type QTOEstimateResult struct {
	Category       string           `json:"category"`
	CalculatedArea float64          `json:"calculatedArea"`   // m2
	CalculatedVol  float64          `json:"calculatedVolume"` // m3
	Region         string           `json:"region"`
	RegionalCoeff  float64          `json:"regionalCoeff"`
	Normative      string           `json:"normative"`
	Scenarios      []ScenarioResult `json:"scenarios"`
	Recommended    ScenarioResult   `json:"recommended"`
	AiInsights     []string         `json:"aiInsights"`
	CalculatedAt   time.Time        `json:"calculatedAt"`
}

// VATRate — ставка НДС в РК с 01.01.2026 (новый Налоговый кодекс РК); та же, что VAT_RATE в ai-service
const VATRate = 0.16

// contingencyRate — резерв на непредвиденные работы и затраты
const contingencyRate = 0.05

// soilFactor returns a cost multiplier for excavation by soil group
func soilFactor(soil string) (float64, string) {
	s := strings.ToLower(soil)
	switch {
	case strings.Contains(s, "rock") || strings.Contains(s, "скал"):
		return 3.0, "Скальный грунт: разработка гидромолотом/рыхлителем, стоимость земляных работ ×3.0"
	case strings.Contains(s, "clay") || strings.Contains(s, "глин"):
		return 1.2, "Глинистый грунт (III группа): стоимость разработки ×1.2"
	case strings.Contains(s, "sand") || strings.Contains(s, "песок") || strings.Contains(s, "песч"):
		return 0.9, "Песчаный грунт (I группа): стоимость разработки ×0.9, нужен контроль откосов"
	}
	return 1.0, ""
}

// EstimatorService calculates QTO construction estimates in native Go
type EstimatorService struct {
	priceDB *PriceDBService
}

// NewEstimatorService creates a new EstimatorService instance
func NewEstimatorService(pdb *PriceDBService) *EstimatorService {
	if pdb == nil {
		pdb = GetPriceDBService()
	}
	return &EstimatorService{priceDB: pdb}
}

// CalculateEstimate performs comprehensive QTO formula computation & cost analysis
func (e *EstimatorService) CalculateEstimate(req QTOFormulaRequest) QTOEstimateResult {
	if req.City == "" {
		req.City = "Алматы"
	}
	if req.FloorCount <= 0 {
		req.FloorCount = 1
	}

	regCoef := 1.0
	if coef, ok := e.priceDB.coefficients[req.City]; ok {
		regCoef = coef
	}

	dims := req.Dimensions
	if dims == nil {
		dims = make(map[string]float64)
	}

	// 1. Calculate Quantities & Volumes using 16 Construction Formulas
	var area, volume float64
	var baseItems []EstimateLineItem
	var insights []string

	catLower := strings.ToLower(req.Category + " " + req.Subtype)
	soilCoef, soilNote := soilFactor(req.SoilType)

	// Order matters: the more specific kinds of work are checked first
	// (раньше «покраска стен» уходила в кирпичную кладку, «наружные сети из полиэтилена» — в стяжку пола).
	has := func(keys ...string) bool {
		for _, k := range keys {
			if strings.Contains(catLower, k) {
				return true
			}
		}
		return false
	}
	switch {
	case has("demo", "демонт", "снос"):
		area, volume, baseItems, insights = e.calcDemolition(dims, regCoef)
	case has("external", "наружн", "сети", "сеть", "водопровод", "канализац"):
		area, volume, baseItems, insights = e.calcExternalNets(dims, regCoef, soilCoef)
	case has("earth", "земл", "грунт", "котлован", "траншея"):
		area, volume, baseItems, insights = e.calcEarthwork(dims, regCoef, soilCoef)
	case has("metal", "метал"):
		area, volume, baseItems, insights = e.calcMetalwork(dims, regCoef)
	case has("road", "дорог", "благоустрой", "брусчат", "тротуар"):
		area, volume, baseItems, insights = e.calcRoadsLandscaping(dims, regCoef)
	case has("facade", "фасад"):
		area, volume, baseItems, insights = e.calcFacade(dims, req.Subtype, regCoef)
	case has("paint", "покраск", "окраск", "отделк", "штукатур", "шпакл", "шпатл"):
		area, volume, baseItems, insights = e.calcFinishing(dims, req.Subtype, regCoef)
	case has("electr", "электр"):
		area, volume, baseItems, insights = e.calcElectrical(dims, regCoef)
	case has("plumb", "сантех"):
		area, volume, baseItems, insights = e.calcPlumbing(dims, regCoef)
	case has("roof", "кровл"):
		area, volume, baseItems, insights = e.calcRoof(dims, req.Subtype, regCoef)
	case has("found", "фундамент"):
		area, volume, baseItems, insights = e.calcFoundation(dims, req.Subtype, regCoef, soilCoef)
	case has("screed", "стяжк", "пол ", "полы", "floor") || strings.HasSuffix(strings.TrimSpace(catLower), "пол"):
		area, volume, baseItems, insights = e.calcFlooring(dims, req.Subtype, regCoef)
	case has("wall", "стен", "кладк", "кирпич", "газоблок", "gasblock", "brick"):
		area, volume, baseItems, insights = e.calcWalls(dims, req.Subtype, regCoef)
	default:
		area, volume, baseItems, insights = e.calcGeneric(dims, req.Category, regCoef)
	}
	if soilNote != "" && (has("found", "фундамент", "earth", "земл", "грунт", "котлован", "траншея", "external", "наружн", "сети", "сеть", "водопровод", "канализац")) {
		insights = append(insights, soilNote)
	}

	// 2. Generate 3 Scenarios: Economy (0.80x), Standard (1.0x), Premium (1.35x) — same as the web templates
	scenarios := []ScenarioResult{
		e.buildScenario("Эконом", 0.80, baseItems, area, volume),
		e.buildScenario("Стандарт", 1.00, baseItems, area, volume),
		e.buildScenario("Премиум", 1.35, baseItems, area, volume),
	}

	recommended := scenarios[1] // Default Standard

	// Add regional and normative insights
	insights = append(insights,
		fmt.Sprintf("Региональный коэффициент для г. %s: ×%.2f", req.City, regCoef),
		"Объёмы и расход материалов — по типовым нормам расхода (ориентир ЭСН РК 8.04-01-2022), цены — рыночные по РК 2026; это предварительная оценка, а не проектная смета по НДЦС РК 8.01-08-2022",
		fmt.Sprintf("Учтены технологические потери материалов, резерв на непредвиденные работы %.0f%% и НДС %.0f%%", contingencyRate*100, VATRate*100),
	)

	return QTOEstimateResult{
		Category:       req.Category,
		CalculatedArea: math.Round(area*100) / 100,
		CalculatedVol:  math.Round(volume*100) / 100,
		Region:         req.City,
		RegionalCoeff:  regCoef,
		Normative:      "Рыночные цены РК 2026; нормы расхода — ЭСН РК 8.04-01-2022 (ориентир)",
		Scenarios:      scenarios,
		Recommended:    recommended,
		AiInsights:     insights,
		CalculatedAt:   time.Now(),
	}
}

func (e *EstimatorService) buildScenario(name string, multiplier float64, baseItems []EstimateLineItem, area, vol float64) ScenarioResult {
	var works, materials, equipment float64
	var items []EstimateLineItem

	for _, it := range baseItems {
		itemCopy := it
		itemCopy.UnitPrice = math.Round(it.UnitPrice * multiplier)
		itemCopy.Total = math.Round(itemCopy.UnitPrice * itemCopy.Quantity)

		switch it.Type {
		case "work":
			works += itemCopy.Total
		case "material":
			materials += itemCopy.Total
		case "equipment":
			equipment += itemCopy.Total
		}
		items = append(items, itemCopy)
	}

	contingency := math.Round((works + materials + equipment) * contingencyRate)
	total := works + materials + equipment + contingency
	vat := math.Round(total * VATRate)

	// Estimate days
	days := int(math.Ceil(works / 45000.0)) // ~45,000 KZT labor output per brigadier/day
	if days < 2 {
		days = 2
	}

	return ScenarioResult{
		Name:          name,
		TotalCost:     total,
		WorksCost:     works,
		MaterialsCost: materials,
		EquipmentCost: equipment,
		Contingency:   contingency,
		VATRate:       VATRate,
		VAT:           vat,
		TotalWithVAT:  total + vat,
		TimelineDays:  days,
		Items:         items,
	}
}

// 1. Foundation Formula (ленточный монолитный фундамент)
func (e *EstimatorService) calcFoundation(dims map[string]float64, subtype string, regCoef, soilCoef float64) (float64, float64, []EstimateLineItem, []string) {
	length := getDim(dims, "length", 40.0) // m
	width := getDim(dims, "width", 0.4)    // m
	depth := getDim(dims, "depth", 1.2)    // m

	volume := length * width * depth     // m3 бетона
	area := length * width               // m2 подошвы
	formworkArea := length * depth * 2.0 // m2 опалубки (две стороны ленты)
	rebarT := volume * 0.08              // 80 кг арматуры на 1 м³ ленты
	// Траншея шире ленты на 0.3 м с каждой стороны (рабочее пространство для опалубки и гидроизоляции)
	trenchVol := length * (width + 0.6) * (depth + 0.15)

	items := []EstimateLineItem{
		{Code: "QG-W-01-001", Name: "Разработка грунта экскаватором в траншеях с доработкой вручную", Unit: "м³", Quantity: trenchVol, UnitPrice: 3500 * regCoef * soilCoef, Type: "work", SnipRef: "СП РК 5.01-102"},
		{Code: "QG-W-06-003", Name: "Устройство песчано-гравийной подушки 150 мм с уплотнением", Unit: "м³", Quantity: length * (width + 0.2) * 0.15, UnitPrice: 8500 * regCoef, Type: "work"},
		{Code: "QG-W-06-002", Name: "Монтаж и демонтаж щитовой опалубки", Unit: "м²", Quantity: formworkArea, UnitPrice: 2400 * regCoef, Type: "work"},
		{Code: "QG-W-06-005", Name: "Вязка арматурного каркаса (А500С Ø12-16, 80 кг/м³)", Unit: "т", Quantity: rebarT, UnitPrice: 180000 * regCoef, Type: "work"},
		{Code: "QG-W-06-001", Name: "Укладка и вибрирование бетона В25 (М350)", Unit: "м³", Quantity: volume, UnitPrice: 12000 * regCoef, Type: "work"},
		{Code: "QG-W-06-010", Name: "Обмазочная гидроизоляция боковых поверхностей в 2 слоя", Unit: "м²", Quantity: formworkArea, UnitPrice: 1200 * regCoef, Type: "work"},
		{Code: "QG-W-01-005", Name: "Обратная засыпка пазух с послойным уплотнением", Unit: "м³", Quantity: math.Max(0, trenchVol-volume), UnitPrice: 2200 * regCoef * soilCoef, Type: "work"},
		{Code: "QG-M-04-001", Name: "Товарный бетон B25 W6 F150 с доставкой (+2% потери)", Unit: "м³", Quantity: volume * 1.02, UnitPrice: 30000 * regCoef, Type: "material"},
		{Code: "QG-M-08-001", Name: "Арматура рифлёная А500С (+2% обрезки)", Unit: "т", Quantity: rebarT * 1.02, UnitPrice: 380000 * regCoef, Type: "material"},
		{Code: "QG-M-06-010", Name: "Мастика битумная гидроизоляционная (2 кг/м² на 2 слоя)", Unit: "кг", Quantity: formworkArea * 2.0, UnitPrice: 1200 * regCoef, Type: "material"},
		{Code: "QG-E-01-002", Name: "Аренда автобетононасоса 36 м", Unit: "смена", Quantity: math.Ceil(volume / 50.0), UnitPrice: 120000 * regCoef, Type: "equipment"},
	}

	insights := []string{
		fmt.Sprintf("Объём монолитного ж/б: %.2f м³, арматура: %.2f т (80 кг/м³), опалубка: %.2f м²", volume, rebarT, formworkArea),
		fmt.Sprintf("Выемка траншеи с рабочим пространством 0.3 м: %.1f м³, обратная засыпка: %.1f м³", trenchVol, math.Max(0, trenchVol-volume)),
		"Гидроизоляцию наносить после набора бетоном 70% прочности; бетонную подготовку под подошвой при необходимости добавить отдельно",
	}
	return area, volume, items, insights
}

// 2. Walls & Masonry Formula
func (e *EstimatorService) calcWalls(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	length := getDim(dims, "length", 30.0)
	height := getDim(dims, "height", 3.0)
	sub := strings.ToLower(subtype)
	gas := strings.Contains(sub, "gas") || strings.Contains(sub, "газо") || strings.Contains(sub, "пено") || strings.Contains(sub, "block") || strings.Contains(sub, "блок")
	defThickness := 0.38 // 1.5 кирпича
	if gas {
		defThickness = 0.3
	}
	thickness := getDim(dims, "thickness", defThickness) // m
	openings, hasOpenings := dims["openings"]
	if !hasOpenings || openings < 0 {
		openings = 12.0 // m2
	}

	grossArea := length * height
	netArea := grossArea - openings
	if netArea <= 0 {
		netArea = grossArea
	}
	volume := netArea * thickness

	var items []EstimateLineItem
	var insights []string
	if gas {
		// блок 600×300×200 = 0.036 м³; клей ~25 кг на 1 м³ кладки; армирование каждого 4-го ряда (через 1 м по высоте)
		items = []EstimateLineItem{
			{Code: "QG-W-08-010", Name: fmt.Sprintf("Кладка стен из газобетонных блоков D500 на клею, толщина %.0f мм", thickness*1000), Unit: "м³", Quantity: volume, UnitPrice: 14000 * regCoef, Type: "work", SnipRef: "СП РК 5.03-107"},
			{Code: "QG-W-08-011", Name: "Армирование кладки арматурой Ø8 в штробах (каждый 4-й ряд)", Unit: "м.п.", Quantity: length * 2 * math.Ceil(height/1.0), UnitPrice: 450 * regCoef, Type: "work"},
			{Code: "QG-M-01-010", Name: "Блоки газобетонные D500 (+3% бой и подрезка)", Unit: "м³", Quantity: volume * 1.03, UnitPrice: 32000 * regCoef, Type: "material"},
			{Code: "QG-M-04-010", Name: "Клей для газобетона, мешок 25 кг (25 кг/м³)", Unit: "мешок", Quantity: math.Ceil(volume * 1.0), UnitPrice: 2400 * regCoef, Type: "material"},
			{Code: "QG-M-08-010", Name: "Арматура А500С Ø8 (0.395 кг/м)", Unit: "т", Quantity: length * 2 * math.Ceil(height/1.0) * 0.000395 * 1.05, UnitPrice: 380000 * regCoef, Type: "material"},
			{Code: "QG-E-02-001", Name: "Аренда крана-манипулятора (разгрузка и подача поддонов)", Unit: "смена", Quantity: math.Ceil(volume / 40.0), UnitPrice: 85000 * regCoef, Type: "equipment"},
		}
		insights = []string{
			fmt.Sprintf("Чистая площадь кладки: %.2f м² (за вычетом проёмов %.2f м²), объём: %.2f м³ ≈ %.0f блоков 600×300×200", netArea, openings, volume, math.Ceil(volume*1.03/0.036)),
			"Первый ряд — на цементно-песчаный раствор по гидроизоляции; над проёмами — перемычки (в расчёт не входят)",
		}
	} else {
		// одинарный кирпич 250×120×65 со швами 10 мм: 394 шт/м³, раствор 0.23 м³/м³; кладочная сетка через 4 ряда (~0.3 м)
		meshLayers := math.Ceil(height / 0.3)
		meshArea := length * thickness * meshLayers
		items = []EstimateLineItem{
			{Code: "QG-W-08-001", Name: fmt.Sprintf("Кладка стен из керамического кирпича М150, толщина %.0f мм", thickness*1000), Unit: "м³", Quantity: volume, UnitPrice: 22000 * regCoef, Type: "work", SnipRef: "СП РК 5.03-107"},
			{Code: "QG-W-08-004", Name: "Укладка кладочной сетки через каждые 4 ряда", Unit: "м²", Quantity: meshArea, UnitPrice: 950 * regCoef, Type: "work"},
			{Code: "QG-M-01-001", Name: "Кирпич керамический одинарный М150 (394 шт/м³ + 3% бой)", Unit: "шт", Quantity: math.Ceil(volume * 394 * 1.03), UnitPrice: 85 * regCoef, Type: "material"},
			{Code: "QG-M-04-002", Name: "Раствор кладочный цементно-песчаный М100 (0.23 м³/м³ + 2%)", Unit: "м³", Quantity: volume * 0.23 * 1.02, UnitPrice: 22000 * regCoef, Type: "material"},
			{Code: "QG-M-08-004", Name: "Сетка кладочная базальтовая 50×50 (+10% нахлёст)", Unit: "м²", Quantity: meshArea * 1.1, UnitPrice: 350 * regCoef, Type: "material"},
			{Code: "QG-E-02-001", Name: "Аренда крана-манипулятора / подъёмника", Unit: "смена", Quantity: math.Ceil(volume / 30.0), UnitPrice: 85000 * regCoef, Type: "equipment"},
		}
		insights = []string{
			fmt.Sprintf("Чистая площадь кладки: %.2f м² (за вычетом проёмов %.2f м²), объём: %.2f м³ ≈ %.0f шт кирпича", netArea, openings, volume, math.Ceil(volume*394*1.03)),
			"Учтены перевязка швов и армирование кладочной сеткой; перемычки над проёмами считаются отдельно",
		}
	}
	return netArea, volume, items, insights
}

// 3. Roof Formula (скатная кровля из металлочерепицы; area — площадь кровли в плане)
func (e *EstimatorService) calcRoof(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 150.0)
	slope := math.Min(getDim(dims, "slope", 20.0), 60) // degrees
	adjustedArea := area / math.Cos(slope*math.Pi/180.0)

	items := []EstimateLineItem{
		{Code: "QG-W-12-001", Name: "Монтаж стропильной системы и обрешётки", Unit: "м²", Quantity: adjustedArea, UnitPrice: 5500 * regCoef, Type: "work"},
		{Code: "QG-W-12-003", Name: "Укладка ветро-влагозащитной диффузионной мембраны", Unit: "м²", Quantity: adjustedArea, UnitPrice: 850 * regCoef, Type: "work"},
		{Code: "QG-W-12-005", Name: "Утепление кровли минераловатными плитами 200 мм", Unit: "м²", Quantity: adjustedArea, UnitPrice: 1500 * regCoef, Type: "work"},
		{Code: "QG-W-12-004", Name: "Монтаж кровельного покрытия (металлочерепица / профлист)", Unit: "м²", Quantity: adjustedArea, UnitPrice: 3800 * regCoef, Type: "work"},
		{Code: "QG-M-12-003", Name: "Пиломатериал хвойный: стропила, обрешётка, контробрешётка (0.035 м³/м²)", Unit: "м³", Quantity: adjustedArea * 0.035 * 1.05, UnitPrice: 120000 * regCoef, Type: "material"},
		{Code: "QG-M-12-004", Name: "Мембрана диффузионная (+15% нахлёст)", Unit: "м²", Quantity: adjustedArea * 1.15, UnitPrice: 450 * regCoef, Type: "material"},
		{Code: "QG-M-12-001", Name: "Металлочерепица 0.5 мм с полимерным покрытием (+12% подрезка)", Unit: "м²", Quantity: adjustedArea * 1.12, UnitPrice: 4200 * regCoef, Type: "material"},
		{Code: "QG-M-12-002", Name: "Утеплитель минераловатный 200 мм (плотность 45 кг/м³, +5%)", Unit: "м³", Quantity: adjustedArea * 0.20 * 1.05, UnitPrice: 28000 * regCoef, Type: "material"},
	}

	insights := []string{
		fmt.Sprintf("Площадь скатов с уклоном %.1f°: %.2f м² (в плане %.2f м²)", slope, adjustedArea, area),
		"Предусмотрен вентзазор между мембраной и покрытием (контробрешётка); доборные элементы и водосток — отдельной позицией",
	}
	return adjustedArea, adjustedArea * 0.2, items, insights
}

// 4. Flooring & Screed
func (e *EstimatorService) calcFlooring(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 80.0)
	thickness := getDim(dims, "thickness", 0.07) // 7 cm screed
	volume := area * thickness

	items := []EstimateLineItem{
		{Code: "QG-W-11-01-001", Name: "Очистка и обеспыливание основания + грунтовка", Unit: "м²", Quantity: area, UnitPrice: 650 * regCoef, Type: "work"},
		{Code: "QG-W-11-01-002", Name: "Устройство полусухой стяжки пола 70 мм механизированным способом", Unit: "м²", Quantity: area, UnitPrice: 2800 * regCoef, Type: "work"},
		{Code: "QG-M-11-01-001", Name: "Пескобетон М300 / ЦПС с фиброволокном", Unit: "т", Quantity: volume * 1.8, UnitPrice: 42000 * regCoef, Type: "material"},
		{Code: "QG-M-11-02-001", Name: "Демпферная лента и деформационные швы", Unit: "м.п.", Quantity: math.Sqrt(area) * 4 * 1.2, UnitPrice: 450 * regCoef, Type: "material"},
		{Code: "QG-E-03-01-001", Name: "Аренда растворонасоса (пневмонагнетателя)", Unit: "смена", Quantity: 1, UnitPrice: 65000 * regCoef, Type: "equipment"},
	}

	insights := []string{
		fmt.Sprintf("Площадь стяжки: %.2f м², объём раствора: %.2f м³", area, volume),
		"Нарезка термоусадочных швов на 3-й день для предотвращения трещин",
	}
	return area, volume, items, insights
}

// 5. Facade Formula
func (e *EstimatorService) calcFacade(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 200.0)

	items := []EstimateLineItem{
		{Code: "QG-W-15-02-001", Name: "Монтаж фасадных строительных лесов", Unit: "м²", Quantity: area, UnitPrice: 950 * regCoef, Type: "work"},
		{Code: "QG-W-15-02-002", Name: "Монтаж утеплителя минплита 100 мм на клей и тарельчатые дюбели", Unit: "м²", Quantity: area, UnitPrice: 3200 * regCoef, Type: "work"},
		{Code: "QG-W-15-02-003", Name: "Армирующий слой со щелочестойкой стеклосеткой", Unit: "м²", Quantity: area, UnitPrice: 2100 * regCoef, Type: "work"},
		{Code: "QG-W-15-02-004", Name: "Нанесение декоративной штукатурки (Короед / Шуба)", Unit: "м²", Quantity: area, UnitPrice: 2800 * regCoef, Type: "work"},
		{Code: "QG-M-15-01-001", Name: "Фасадный утеплитель 100 мм плотностью 135 кг/м³", Unit: "м²", Quantity: area * 1.05, UnitPrice: 4800 * regCoef, Type: "material"},
	}

	insights := []string{
		fmt.Sprintf("Площадь фасада: %.2f м²", area),
		"Толщину утеплителя проверить теплотехническим расчётом для региона (СП РК 2.04-107)",
	}
	return area, area * 0.1, items, insights
}

// 6. Finishing (Plaster + Paint)
func (e *EstimatorService) calcFinishing(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 120.0)

	items := []EstimateLineItem{
		{Code: "QG-W-15-001", Name: "Штукатурка стен по маякам гипсовой смесью (средний слой 15 мм)", Unit: "м²", Quantity: area, UnitPrice: 2900 * regCoef, Type: "work"},
		{Code: "QG-W-15-002", Name: "Шпаклевка стен под покраску в 2 слоя со стеклохолстом", Unit: "м²", Quantity: area, UnitPrice: 2400 * regCoef, Type: "work"},
		{Code: "QG-W-15-003", Name: "Покраска стен водоэмульсионной моющейся краской в 2 слоя", Unit: "м²", Quantity: area, UnitPrice: 1600 * regCoef, Type: "work"},
		{Code: "QG-M-15-004", Name: "Грунтовка глубокого проникновения (3 прохода по 0.15 л/м²)", Unit: "л", Quantity: area * 0.45, UnitPrice: 800 * regCoef, Type: "material"},
		{Code: "QG-M-15-002", Name: "Гипсовая штукатурная смесь (8.5 кг/м² на 10 мм × 15 мм − ~12.8 кг/м²)", Unit: "кг", Quantity: area * 12.8, UnitPrice: 150 * regCoef, Type: "material"},
		{Code: "QG-M-15-005", Name: "Шпаклевка финишная (2 слоя, 1.8 кг/м²)", Unit: "кг", Quantity: area * 1.8, UnitPrice: 140 * regCoef, Type: "material"},
		{Code: "QG-M-15-006", Name: "Стеклохолст малярный (+10% нахлёст)", Unit: "м²", Quantity: area * 1.1, UnitPrice: 250 * regCoef, Type: "material"},
		{Code: "QG-M-15-003", Name: "Краска интерьерная моющаяся (2 слоя × 0.15 л/м²)", Unit: "л", Quantity: area * 0.3, UnitPrice: 3200 * regCoef, Type: "material"},
	}

	return area, 0, items, []string{fmt.Sprintf("Площадь чистовой отделки: %.2f м²; расход штукатурки рассчитан на средний слой 15 мм", area)}
}

// 7. Electrical
func (e *EstimatorService) calcElectrical(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	points := getDim(dims, "points", 45.0) // sockets + switches + lamps
	cableLen := points * 12.0              // m

	items := []EstimateLineItem{
		{Code: "QG-W-33-01-001", Name: "Штробление стен под кабель и высверливание подрозетников", Unit: "точка", Quantity: points, UnitPrice: 3500 * regCoef, Type: "work"},
		{Code: "QG-W-33-01-002", Name: "Прокладка кабеля ВВГнг-LS в гофре", Unit: "м.п.", Quantity: cableLen, UnitPrice: 450 * regCoef, Type: "work"},
		{Code: "QG-W-33-01-003", Name: "Сборка и расключение распределительного электрощита", Unit: "щит", Quantity: 1, UnitPrice: 45000 * regCoef, Type: "work"},
		{Code: "QG-M-33-01-001", Name: "Кабель силовой медный ВВГнг-LS 3×2.5 и 3×1.5", Unit: "м.п.", Quantity: cableLen * 1.1, UnitPrice: 480 * regCoef, Type: "material"},
		{Code: "QG-M-33-02-001", Name: "Автоматические выключатели и УЗО (Schneider / ABB)", Unit: "компл.", Quantity: 1, UnitPrice: 85000 * regCoef, Type: "material"},
	}

	return points, cableLen, items, []string{fmt.Sprintf("Точек подключения: %.0f шт, протяжённость трасс: %.0f м", points, cableLen)}
}

// 8. Plumbing
func (e *EstimatorService) calcPlumbing(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	points := getDim(dims, "points", 8.0) // sinks, toilet, shower, washing machine

	items := []EstimateLineItem{
		{Code: "QG-W-16-01-001", Name: "Монтаж водопроводных труб полипропилен / сшитый полиэтилен", Unit: "точка", Quantity: points, UnitPrice: 12000 * regCoef, Type: "work"},
		{Code: "QG-W-16-01-002", Name: "Монтаж канализационных труб ПВХ Ø50-110", Unit: "точка", Quantity: points, UnitPrice: 8500 * regCoef, Type: "work"},
		{Code: "QG-W-16-01-003", Name: "Установка сантехнических приборов и смесителей", Unit: "прибор", Quantity: points, UnitPrice: 7500 * regCoef, Type: "work"},
		{Code: "QG-M-16-01-001", Name: "Коллекторная группа, фильтры и трубы", Unit: "компл.", Quantity: 1, UnitPrice: 120000 * regCoef, Type: "material"},
	}

	return points, 0, items, []string{fmt.Sprintf("Сантехнических узлов: %.0f шт с коллекторной разводкой", points)}
}

// 9. External Networks (Наружные сети и коммуникации)
func (e *EstimatorService) calcExternalNets(dims map[string]float64, regCoef, soilCoef float64) (float64, float64, []EstimateLineItem, []string) {
	length := getDim(dims, "length", 75.0) // м.п. траншеи
	depth := getDim(dims, "depth", 1.8)    // м глубина заложения
	width := getDim(dims, "width", 0.8)    // м ширина
	trenchVol := length * width * depth    // м3
	beddingVol := length * width * 0.15
	pipeVol := math.Pi * 0.055 * 0.055 * length
	backfillVol := math.Max(0, trenchVol-beddingVol-pipeVol)

	items := []EstimateLineItem{
		{Code: "QG-W-01-02-001", Name: "Разработка грунта в траншее экскаватором 0.65 м³ с погрузкой", Unit: "м³", Quantity: trenchVol, UnitPrice: 3800 * regCoef * soilCoef, Type: "work", SnipRef: "СП РК 5.01-102"},
		{Code: "QG-W-23-01-001", Name: "Устройство песчаной постели под трубопровод t=150 мм", Unit: "м³", Quantity: beddingVol, UnitPrice: 7500 * regCoef, Type: "work"},
		{Code: "QG-W-23-01-002", Name: "Укладка напорных полиэтиленовых труб ПЭ 100 SDR 17 Ø110", Unit: "м.п.", Quantity: length, UnitPrice: 4200 * regCoef, Type: "work", SnipRef: "СП РК 4.01-103"},
		{Code: "QG-W-23-03-001", Name: "Монтаж железобетонных смотровых колодцев Ø1000 (КС 10.9)", Unit: "шт.", Quantity: math.Max(2, math.Ceil(length/35.0)), UnitPrice: 48000 * regCoef, Type: "work"},
		{Code: "QG-M-23-01-001", Name: "Труба напорная ПЭ 100 Ø110×6.6 мм питьевая (ГОСТ 18599)", Unit: "м.п.", Quantity: length * 1.02, UnitPrice: 3400 * regCoef, Type: "material"},
		{Code: "QG-M-23-02-001", Name: "Комплект ж/б колец, днищ и крышек колодца с люком Т (ГОСТ 8020)", Unit: "компл.", Quantity: math.Max(2, math.Ceil(length/35.0)), UnitPrice: 95000 * regCoef, Type: "material"},
		{Code: "QG-W-23-01-008", Name: "Гидравлическое испытание и промывка трубопровода", Unit: "м.п.", Quantity: length, UnitPrice: 1600 * regCoef, Type: "work"},
		{Code: "QG-W-01-02-005", Name: "Обратная засыпка траншеи с послойным виброуплотнением", Unit: "м³", Quantity: backfillVol, UnitPrice: 2200 * regCoef * soilCoef, Type: "work"},
		{Code: "QG-E-01-03-001", Name: "Доставка экскаватора на объект и обратно (трал); работа машины учтена в расценках", Unit: "рейс", Quantity: 2, UnitPrice: 45000 * regCoef, Type: "equipment"},
		{Code: "DOC-23-01-001", Name: "Исполнительная геодезическая съёмка и сдача технадзору", Unit: "компл.", Quantity: 1, UnitPrice: 75000 * regCoef, Type: "work", SnipRef: "СП РК 1.03-106"},
	}

	insights := []string{
		fmt.Sprintf("Протяжённость трассы: %.0f м.п., выемка: %.1f м³, обратная засыпка (за вычетом постели и трубы): %.1f м³", length, trenchVol, backfillVol),
		fmt.Sprintf("Глубина заложения %.1f м — проверьте, что она ниже нормативной глубины промерзания для региона", depth),
		"Обязательно составление акта освидетельствования скрытых работ (АОСР) на песчаную подушку и опрессовку",
	}

	return length, trenchVol, items, insights
}

// 10. Earthwork (Земляные работы)
func (e *EstimatorService) calcEarthwork(dims map[string]float64, regCoef, soilCoef float64) (float64, float64, []EstimateLineItem, []string) {
	vol := getDim(dims, "volume", 250.0) // м3
	area := getDim(dims, "area", 150.0)  // м2

	items := []EstimateLineItem{
		{Code: "QG-W-01-01-001", Name: "Срезка растительного слоя грунта бульдозером до 20 см", Unit: "м²", Quantity: area, UnitPrice: 650 * regCoef, Type: "work"},
		{Code: "QG-W-01-01-002", Name: "Разработка грунта II группы экскаватором в отвал / на вывоз", Unit: "м³", Quantity: vol, UnitPrice: 2800 * regCoef * soilCoef, Type: "work"},
		{Code: "QG-W-01-01-003", Name: "Вывоз и утилизация излишков грунта самосвалами 25т", Unit: "м³", Quantity: vol * 0.8, UnitPrice: 3200 * regCoef, Type: "work"},
		{Code: "QG-W-01-01-004", Name: "Планировка и послойное уплотнение дна котлована катком", Unit: "м²", Quantity: area, UnitPrice: 1200 * regCoef, Type: "work"},
		{Code: "QG-E-01-01-001", Name: "Доставка экскаватора и бульдозера на объект и обратно (трал); работа машин учтена в расценках", Unit: "рейс", Quantity: 2, UnitPrice: 60000 * regCoef, Type: "equipment"},
	}

	return area, vol, items, []string{
		fmt.Sprintf("Объём земляных работ: %.1f м³, площадь планировки: %.1f м²", vol, area),
		"Расценки на разработку и вывоз включают работу экскаватора и самосвалов — отдельная аренда техники не добавляется",
	}
}

// 11. Demolition (Демонтажные работы)
func (e *EstimatorService) calcDemolition(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 80.0)
	vol := area * 0.25

	items := []EstimateLineItem{
		{Code: "QG-W-46-01-001", Name: "Механизированный демонтаж конструкций гидромолотом / бетоноломом", Unit: "м³", Quantity: vol, UnitPrice: 14000 * regCoef, Type: "work"},
		{Code: "QG-W-46-01-002", Name: "Ручная разборка и сортировка строительных элементов", Unit: "м²", Quantity: area, UnitPrice: 2200 * regCoef, Type: "work"},
		{Code: "QG-W-46-01-003", Name: "Сбор, фасовка в мешки и погрузка строительного мусора", Unit: "т", Quantity: vol * 2.2, UnitPrice: 6500 * regCoef, Type: "work"},
		{Code: "QG-W-46-01-004", Name: "Вывоз строительного мусора на полигон утилизации (самосвал 20т)", Unit: "рейс", Quantity: math.Ceil(vol / 8.0), UnitPrice: 38000 * regCoef, Type: "work"},
	}

	return area, vol, items, []string{fmt.Sprintf("Площадь демонтажа: %.1f м², объём лома: %.1f м³", area, vol)}
}

// 12. Roads & Landscaping (Дороги и благоустройство)
func (e *EstimatorService) calcRoadsLandscaping(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 120.0) // м2

	items := []EstimateLineItem{
		{Code: "QG-W-27-01-001", Name: "Устройство щебеночного основания фр. 20-40 мм толщиной 15 см", Unit: "м²", Quantity: area, UnitPrice: 3200 * regCoef, Type: "work"},
		{Code: "QG-W-27-01-002", Name: "Укладка тротуарной плитки / брусчатки толщиной 60-80 мм", Unit: "м²", Quantity: area, UnitPrice: 4500 * regCoef, Type: "work"},
		{Code: "QG-W-27-01-003", Name: "Установка дорожного / садового бордюра (БР 100.20.8) на бетон", Unit: "м.п.", Quantity: math.Sqrt(area) * 4.0, UnitPrice: 2800 * regCoef, Type: "work"},
		{Code: "QG-M-27-01-001", Name: "Брусчатка вибропрессованная М400 (ГОСТ 17608) с запасом 5%", Unit: "м²", Quantity: area * 1.05, UnitPrice: 5200 * regCoef, Type: "material"},
		{Code: "QG-M-27-02-001", Name: "Щебень гранитный, песок мытый и сухая смесь М150", Unit: "т", Quantity: area * 0.35, UnitPrice: 8500 * regCoef, Type: "material"},
	}

	return area, 0, items, []string{fmt.Sprintf("Площадь покрытия: %.1f м², длина бордюрной линии: %.1f м.п.", area, math.Sqrt(area)*4.0)}
}

// 13. Metalwork (Металлоконструкции)
func (e *EstimatorService) calcMetalwork(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	tonnage := getDim(dims, "tonnage", 4.5) // тонн
	area := tonnage * 32.0                  // м2 окраски

	items := []EstimateLineItem{
		{Code: "QG-W-09-01-001", Name: "Монтаж стальных балок, колонн и связей из прокатного профиля", Unit: "т", Quantity: tonnage, UnitPrice: 185000 * regCoef, Type: "work", SnipRef: "СНиП РК 5.04-23"},
		{Code: "QG-W-09-01-002", Name: "Сварочные работы и монтаж высокопрочных болтовых соединений", Unit: "узел", Quantity: tonnage * 8, UnitPrice: 12500 * regCoef, Type: "work"},
		{Code: "QG-W-13-01-001", Name: "Обезжиривание, грунтование ГФ-021 и огнезащитная покраска R60", Unit: "м²", Quantity: area, UnitPrice: 4200 * regCoef, Type: "work"},
		{Code: "QG-M-09-01-001", Name: "Прокат стальной фасонный С255 / С345 (балки, швеллер, труба)", Unit: "т", Quantity: tonnage * 1.06, UnitPrice: 560000 * regCoef, Type: "material"},
		{Code: "QG-E-02-01-001", Name: "Работа автокрана XCMG 25т (GPS Online)", Unit: "маш-час", Quantity: math.Max(8, math.Ceil(tonnage*3)), UnitPrice: 28000 * regCoef, Type: "equipment"},
	}

	return tonnage, area, items, []string{fmt.Sprintf("Масса металлоконструкций: %.2f т, площадь огнезащиты: %.1f м²", tonnage, area)}
}

// 14. Generic Enhanced QTO
func (e *EstimatorService) calcGeneric(dims map[string]float64, category string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 65.0)
	if area <= 0 {
		area = 65.0
	}

	items := []EstimateLineItem{
		{Code: "QG-W-GEN-001", Name: fmt.Sprintf("1. Подготовительные работы и разметка объекта: %s", category), Unit: "компл.", Quantity: 1, UnitPrice: area * 1200 * regCoef, Type: "work"},
		{Code: "QG-W-GEN-002", Name: fmt.Sprintf("2. Основной комплекс строительно-монтажных работ: %s", category), Unit: "м²", Quantity: area, UnitPrice: 7200 * regCoef, Type: "work"},
		{Code: "QG-W-GEN-003", Name: "3. Монтажные крепления, расходные материалы и оснастка", Unit: "компл.", Quantity: 1, UnitPrice: area * 1800 * regCoef, Type: "work"},
		{Code: "QG-M-GEN-001", Name: "4. Сертифицированные строительные материалы по спецификации", Unit: "м²", Quantity: area * 1.08, UnitPrice: 8900 * regCoef, Type: "material"},
		{Code: "QG-M-GEN-002", Name: "5. Защитные составы, гидрофобизаторы и крепёж (ГОСТ РК)", Unit: "компл.", Quantity: 1, UnitPrice: area * 2100 * regCoef, Type: "material"},
		{Code: "QG-E-GEN-001", Name: "6. Доставка материалов и работа спецтехники/манипулятора", Unit: "рейс", Quantity: math.Max(1, math.Ceil(area/50.0)), UnitPrice: 45000 * regCoef, Type: "equipment"},
		{Code: "DOC-GEN-001", Name: "7. Инженерный контроль, сдача технадзору и акты АОСР", Unit: "компл.", Quantity: 1, UnitPrice: 40000 * regCoef, Type: "work", SnipRef: "СП РК 1.03-106"},
	}

	return area, 0, items, []string{
		fmt.Sprintf("Расчёт по нормативной площади: %.2f м² (%s)", area, category),
		"Укрупнённый расчёт: без проекта и ведомости объёмов точность ±25%",
	}
}

func getDim(m map[string]float64, key string, defVal float64) float64 {
	if v, ok := m[key]; ok && v > 0 {
		return v
	}
	return defVal
}
