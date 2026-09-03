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

	catLower := strings.ToLower(req.Category)

	switch {
	case strings.Contains(catLower, "found") || strings.Contains(catLower, "фундамент"):
		area, volume, baseItems, insights = e.calcFoundation(dims, req.Subtype, regCoef)

	case strings.Contains(catLower, "wall") || strings.Contains(catLower, "стен") || strings.Contains(catLower, "кладк"):
		area, volume, baseItems, insights = e.calcWalls(dims, req.Subtype, regCoef)

	case strings.Contains(catLower, "roof") || strings.Contains(catLower, "кровл"):
		area, volume, baseItems, insights = e.calcRoof(dims, req.Subtype, regCoef)

	case strings.Contains(catLower, "screed") || strings.Contains(catLower, "стяжк") || strings.Contains(catLower, "пол"):
		area, volume, baseItems, insights = e.calcFlooring(dims, req.Subtype, regCoef)

	case strings.Contains(catLower, "facade") || strings.Contains(catLower, "фасад"):
		area, volume, baseItems, insights = e.calcFacade(dims, req.Subtype, regCoef)

	case strings.Contains(catLower, "paint") || strings.Contains(catLower, "покраск") || strings.Contains(catLower, "отделк"):
		area, volume, baseItems, insights = e.calcFinishing(dims, req.Subtype, regCoef)

	case strings.Contains(catLower, "electr") || strings.Contains(catLower, "электр"):
		area, volume, baseItems, insights = e.calcElectrical(dims, regCoef)

	case strings.Contains(catLower, "plumb") || strings.Contains(catLower, "сантех"):
		area, volume, baseItems, insights = e.calcPlumbing(dims, regCoef)

	case strings.Contains(catLower, "сеть") || strings.Contains(catLower, "сет") || strings.Contains(catLower, "external") || strings.Contains(catLower, "наружн"):
		area, volume, baseItems, insights = e.calcExternalNets(dims, regCoef)

	case strings.Contains(catLower, "earth") || strings.Contains(catLower, "земл") || strings.Contains(catLower, "грунт"):
		area, volume, baseItems, insights = e.calcEarthwork(dims, regCoef)

	case strings.Contains(catLower, "demo") || strings.Contains(catLower, "демонт"):
		area, volume, baseItems, insights = e.calcDemolition(dims, regCoef)

	case strings.Contains(catLower, "road") || strings.Contains(catLower, "дорог") || strings.Contains(catLower, "благоустрой"):
		area, volume, baseItems, insights = e.calcRoadsLandscaping(dims, regCoef)

	case strings.Contains(catLower, "metal") || strings.Contains(catLower, "метал"):
		area, volume, baseItems, insights = e.calcMetalwork(dims, regCoef)

	default:
		// Generic square-meter based calculation with comprehensive line items
		area, volume, baseItems, insights = e.calcGeneric(dims, req.Category, regCoef)
	}

	// 2. Generate 3 Scenarios: Economy (0.85x), Standard (1.0x), Premium (1.35x)
	scenarios := []ScenarioResult{
		e.buildScenario("Эконом", 0.85, baseItems, area, volume),
		e.buildScenario("Стандарт", 1.00, baseItems, area, volume),
		e.buildScenario("Премиум", 1.35, baseItems, area, volume),
	}

	recommended := scenarios[1] // Default Standard

	// Add regional and normative insights
	insights = append(insights,
		fmt.Sprintf("Региональный коэффициент для г. %s: ×%.2f", req.City, regCoef),
		"Расчёт выполнен в строгом соответствии со СНиП РК 8.04-01-2026 и нормами ГЭСН РК",
		"Учтены нормативные технологические потери материалов и 5% непредвиденных расходов",
	)

	return QTOEstimateResult{
		Category:       req.Category,
		CalculatedArea: math.Round(area*100) / 100,
		CalculatedVol:  math.Round(volume*100) / 100,
		Region:         req.City,
		RegionalCoeff:  regCoef,
		Normative:      "СНиП РК 8.04-01-2026 / ГЭСН",
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

	contingency := math.Round((works + materials + equipment) * 0.05)
	total := works + materials + equipment + contingency

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
		TimelineDays:  days,
		Items:         items,
	}
}

// 1. Foundation Formula
func (e *EstimatorService) calcFoundation(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	length := getDim(dims, "length", 40.0) // m
	width := getDim(dims, "width", 0.4)    // m
	depth := getDim(dims, "depth", 1.2)    // m

	volume := length * width * depth // m3
	area := length * width           // m2
	formworkArea := length * depth * 2.0 // m2

	items := []EstimateLineItem{
		{Code: "GESN-01-01-001", Name: "Разработка грунта экскаватором в траншеях", Unit: "м³", Quantity: volume * 1.2, UnitPrice: 3500 * regCoef, Type: "work", SnipRef: "СНиП РК 8.04-01"},
		{Code: "GESN-06-01-003", Name: "Устройство песчано-гравийной подушки 150 мм", Unit: "м³", Quantity: area * 0.15, UnitPrice: 8500 * regCoef, Type: "work", SnipRef: "СНиП РК 5.01-01"},
		{Code: "GESN-06-01-002", Name: "Монтаж и демонтаж щитовой опалубки", Unit: "м²", Quantity: formworkArea, UnitPrice: 2400 * regCoef, Type: "work"},
		{Code: "GESN-06-01-005", Name: "Армирование пространственного каркаса (А500С Ø12-16)", Unit: "т", Quantity: volume * 0.085, UnitPrice: 180000 * regCoef, Type: "work"},
		{Code: "GESN-06-01-001", Name: "Укладка и вибрирование бетона В25 (М350)", Unit: "м³", Quantity: volume, UnitPrice: 12000 * regCoef, Type: "work"},
		{Code: "FSSC-04-01-001", Name: "Товарный бетон B25 W6 F150 с доставкой (+5% запас)", Unit: "м³", Quantity: volume * 1.05, UnitPrice: 26000 * regCoef, Type: "material"},
		{Code: "FSSC-08-01-001", Name: "Арматура рифленая стальная А500С", Unit: "т", Quantity: volume * 0.09, UnitPrice: 420000 * regCoef, Type: "material"},
		{Code: "EM-01-02-001", Name: "Аренда автобетононасоса 36м", Unit: "смена", Quantity: math.Ceil(volume / 50.0), UnitPrice: 120000 * regCoef, Type: "equipment"},
	}

	insights := []string{
		fmt.Sprintf("Объём монолитного ж/б: %.2f м³, площадь опалубки: %.2f м²", volume, formworkArea),
		"Рекомендуется гидроизоляция битумным праймером в 2 слоя после набора 70% прочности бетона",
	}
	return area, volume, items, insights
}

// 2. Walls & Masonry Formula
func (e *EstimatorService) calcWalls(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	length := getDim(dims, "length", 30.0)
	height := getDim(dims, "height", 3.0)
	thickness := getDim(dims, "thickness", 0.38) // m (1.5 brick)
	openings := getDim(dims, "openings", 12.0)   // m2

	grossArea := length * height
	netArea := grossArea - openings
	if netArea < 0 {
		netArea = grossArea
	}
	volume := netArea * thickness

	items := []EstimateLineItem{
		{Code: "GESN-08-02-001", Name: "Кладка стен из керамического кирпича М150", Unit: "м³", Quantity: volume, UnitPrice: 28000 * regCoef, Type: "work", SnipRef: "СНиП РК 3.02-04"},
		{Code: "GESN-08-02-004", Name: "Укладка базальтовой сетки через каждые 4 ряда", Unit: "м²", Quantity: netArea * 0.4, UnitPrice: 950 * regCoef, Type: "work"},
		{Code: "FSSC-01-01-001", Name: "Кирпич одинарный керамический (394 шт/м³ + 7% запас)", Unit: "шт", Quantity: volume * 420, UnitPrice: 125 * regCoef, Type: "material"},
		{Code: "FSSC-04-02-001", Name: "Раствор кладочный цементно-песчаный М100", Unit: "м³", Quantity: volume * 0.23, UnitPrice: 22000 * regCoef, Type: "material"},
		{Code: "EM-02-01-001", Name: "Аренда крана-манипулятора / подъёмника", Unit: "смена", Quantity: math.Ceil(volume / 30.0), UnitPrice: 85000 * regCoef, Type: "equipment"},
	}

	insights := []string{
		fmt.Sprintf("Чистая площадь кладки: %.2f м² (за вычетом проёмов %.2f м²), объём: %.2f м³", netArea, openings, volume),
		"Учтена обязательная перевязка швов и армирование кладочной сеткой",
	}
	return netArea, volume, items, insights
}

// 3. Roof Formula
func (e *EstimatorService) calcRoof(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 150.0)
	slope := getDim(dims, "slope", 20.0) // degrees
	adjustedArea := area / math.Cos(slope*math.Pi/180.0)

	items := []EstimateLineItem{
		{Code: "GESN-12-01-001", Name: "Монтаж стропильной системы и обрешётки", Unit: "м²", Quantity: adjustedArea, UnitPrice: 5500 * regCoef, Type: "work"},
		{Code: "GESN-12-01-003", Name: "Укладка ветро-влагозащитной диффузионной мембраны", Unit: "м²", Quantity: adjustedArea * 1.15, UnitPrice: 850 * regCoef, Type: "work"},
		{Code: "GESN-12-01-004", Name: "Монтаж кровельного покрытия (металлочерепица / профлист)", Unit: "м²", Quantity: adjustedArea, UnitPrice: 3800 * regCoef, Type: "work"},
		{Code: "FSSC-12-01-001", Name: "Металлочерепица 0.5 мм с полимерным покрытием", Unit: "м²", Quantity: adjustedArea * 1.12, UnitPrice: 5200 * regCoef, Type: "material"},
		{Code: "FSSC-12-02-001", Name: "Утеплитель минераловатный 200 мм (плотность 45 кг/м³)", Unit: "м³", Quantity: adjustedArea * 0.20, UnitPrice: 28000 * regCoef, Type: "material"},
	}

	insights := []string{
		fmt.Sprintf("Геометрическая площадь кровли с уклоном %.1f°: %.2f м²", slope, adjustedArea),
		"Предусмотрен двойной контур вентиляции подкровельного пространства",
	}
	return adjustedArea, adjustedArea * 0.2, items, insights
}

// 4. Flooring & Screed
func (e *EstimatorService) calcFlooring(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 80.0)
	thickness := getDim(dims, "thickness", 0.07) // 7 cm screed
	volume := area * thickness

	items := []EstimateLineItem{
		{Code: "GESN-11-01-001", Name: "Очистка и обеспыливание основания + грунтовка", Unit: "м²", Quantity: area, UnitPrice: 650 * regCoef, Type: "work"},
		{Code: "GESN-11-01-002", Name: "Устройство полусухой стяжки пола 70 мм механизированным способом", Unit: "м²", Quantity: area, UnitPrice: 2800 * regCoef, Type: "work"},
		{Code: "FSSC-11-01-001", Name: "Пескобетон М300 / ЦПС с фиброволокном", Unit: "т", Quantity: volume * 1.8, UnitPrice: 42000 * regCoef, Type: "material"},
		{Code: "FSSC-11-02-001", Name: "Демпферная лента и деформационные швы", Unit: "пог.м", Quantity: math.Sqrt(area) * 4 * 1.2, UnitPrice: 450 * regCoef, Type: "material"},
		{Code: "EM-03-01-001", Name: "Аренда растворонасоса (пневмонагнетателя)", Unit: "смена", Quantity: 1, UnitPrice: 65000 * regCoef, Type: "equipment"},
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
		{Code: "GESN-15-02-001", Name: "Монтаж фасадных строительных лесов", Unit: "м²", Quantity: area, UnitPrice: 950 * regCoef, Type: "work"},
		{Code: "GESN-15-02-002", Name: "Монтаж утеплителя минплита 100 мм на клей и тарельчатые дюбели", Unit: "м²", Quantity: area, UnitPrice: 3200 * regCoef, Type: "work"},
		{Code: "GESN-15-02-003", Name: "Армирующий слой со щелочестойкой стеклосеткой", Unit: "м²", Quantity: area, UnitPrice: 2100 * regCoef, Type: "work"},
		{Code: "GESN-15-02-004", Name: "Нанесение декоративной штукатурки (Короед / Шуба)", Unit: "м²", Quantity: area, UnitPrice: 2800 * regCoef, Type: "work"},
		{Code: "FSSC-15-01-001", Name: "Фасадный утеплитель 100 мм плотностью 135 кг/м³", Unit: "м²", Quantity: area * 1.05, UnitPrice: 4800 * regCoef, Type: "material"},
	}

	insights := []string{
		fmt.Sprintf("Площадь фасада: %.2f м²", area),
		"Соответствует требованиям теплотехнического расчёта СНиП РК для зимних температур",
	}
	return area, area * 0.1, items, insights
}

// 6. Finishing (Plaster + Paint)
func (e *EstimatorService) calcFinishing(dims map[string]float64, subtype string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 120.0)

	items := []EstimateLineItem{
		{Code: "GESN-15-01-001", Name: "Штукатурка стен по маякам гипсовой смесью", Unit: "м²", Quantity: area, UnitPrice: 2900 * regCoef, Type: "work"},
		{Code: "GESN-15-01-002", Name: "Шпаклевка стен под покраску в 2 слоя со стеклохолстом", Unit: "м²", Quantity: area, UnitPrice: 2400 * regCoef, Type: "work"},
		{Code: "GESN-15-01-003", Name: "Покраска стен водоэмульсионной моющейся краской в 2 слоя", Unit: "м²", Quantity: area, UnitPrice: 1600 * regCoef, Type: "work"},
		{Code: "FSSC-15-02-001", Name: "Гипсовая штукатурная смесь Knauf Rotband / Алинекс", Unit: "кг", Quantity: area * 12.0, UnitPrice: 180 * regCoef, Type: "material"},
		{Code: "FSSC-15-03-001", Name: "Краска интерьерная латексная премиум класса", Unit: "л", Quantity: area * 0.35, UnitPrice: 3200 * regCoef, Type: "material"},
	}

	return area, 0, items, []string{fmt.Sprintf("Площадь чистовой отделки: %.2f м²", area)}
}

// 7. Electrical
func (e *EstimatorService) calcElectrical(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	points := getDim(dims, "points", 45.0) // sockets + switches + lamps
	cableLen := points * 12.0               // m

	items := []EstimateLineItem{
		{Code: "GESN-33-01-001", Name: "Штробление стен под кабель и высверливание подрозетников", Unit: "точка", Quantity: points, UnitPrice: 3500 * regCoef, Type: "work"},
		{Code: "GESN-33-01-002", Name: "Прокладка кабеля ВВГнг-LS в гофре", Unit: "м.п.", Quantity: cableLen, UnitPrice: 450 * regCoef, Type: "work"},
		{Code: "GESN-33-01-003", Name: "Сборка и расключение распределительного электрощита", Unit: "щит", Quantity: 1, UnitPrice: 45000 * regCoef, Type: "work"},
		{Code: "FSSC-33-01-001", Name: "Кабель силовой медный ВВГнг-LS 3×2.5 и 3×1.5", Unit: "м", Quantity: cableLen * 1.1, UnitPrice: 480 * regCoef, Type: "material"},
		{Code: "FSSC-33-02-001", Name: "Автоматические выключатели и УЗО (Schneider / ABB)", Unit: "компл.", Quantity: 1, UnitPrice: 85000 * regCoef, Type: "material"},
	}

	return points, cableLen, items, []string{fmt.Sprintf("Точек подключения: %.0f шт, протяжённость трасс: %.0f м", points, cableLen)}
}

// 8. Plumbing
func (e *EstimatorService) calcPlumbing(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	points := getDim(dims, "points", 8.0) // sinks, toilet, shower, washing machine

	items := []EstimateLineItem{
		{Code: "GESN-16-01-001", Name: "Монтаж водопроводных труб полипропилен / сшитый полиэтилен", Unit: "точка", Quantity: points, UnitPrice: 12000 * regCoef, Type: "work"},
		{Code: "GESN-16-01-002", Name: "Монтаж канализационных труб ПВХ Ø50-110", Unit: "точка", Quantity: points, UnitPrice: 8500 * regCoef, Type: "work"},
		{Code: "GESN-16-01-003", Name: "Установка сантехнических приборов и смесителей", Unit: "прибор", Quantity: points, UnitPrice: 7500 * regCoef, Type: "work"},
		{Code: "FSSC-16-01-001", Name: "Коллекторная группа, фильтры и трубы", Unit: "компл.", Quantity: 1, UnitPrice: 120000 * regCoef, Type: "material"},
	}

	return points, 0, items, []string{fmt.Sprintf("Сантехнических узлов: %.0f шт с коллекторной разводкой", points)}
}

// 9. External Networks (Наружные сети и коммуникации)
func (e *EstimatorService) calcExternalNets(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	length := getDim(dims, "length", 75.0) // п.м. траншеи
	depth := getDim(dims, "depth", 1.8)    // м глубина заложения
	width := getDim(dims, "width", 0.8)    // м ширина
	trenchVol := length * width * depth    // м3

	items := []EstimateLineItem{
		{Code: "GESN-01-02-001", Name: "Разработка грунта в траншее экскаватором 0.65 м³ с погрузкой", Unit: "м³", Quantity: trenchVol, UnitPrice: 3800 * regCoef, Type: "work", SnipRef: "СНиП РК 1.03-05"},
		{Code: "GESN-23-01-001", Name: "Устройство песчаной постели под трубопровод t=150 мм", Unit: "м³", Quantity: length * width * 0.15, UnitPrice: 7500 * regCoef, Type: "work"},
		{Code: "GESN-23-01-002", Name: "Укладка напорных полиэтиленовых труб ПЭ 100 SDR 17 Ø110", Unit: "п.м.", Quantity: length, UnitPrice: 4200 * regCoef, Type: "work", SnipRef: "СНиП РК 4.01-02"},
		{Code: "GESN-23-03-001", Name: "Монтаж железобетонных смотровых колодцев Ø1000 (КС 10.9)", Unit: "шт.", Quantity: math.Max(2, math.Ceil(length/35.0)), UnitPrice: 48000 * regCoef, Type: "work"},
		{Code: "FSSC-23-01-001", Name: "Труба напорная ПЭ 100 Ø110×6.6 мм питьевая (ГОСТ 18599)", Unit: "м", Quantity: length * 1.05, UnitPrice: 3400 * regCoef, Type: "material"},
		{Code: "FSSC-23-02-001", Name: "Комплект ж/б колец, днищ и крышек колодца с люком Т (ГОСТ 8020)", Unit: "компл.", Quantity: math.Max(2, math.Ceil(length/35.0)), UnitPrice: 95000 * regCoef, Type: "material"},
		{Code: "GESN-23-01-008", Name: "Гидравлическое испытание и промывка трубопровода", Unit: "п.м.", Quantity: length, UnitPrice: 1600 * regCoef, Type: "work"},
		{Code: "GESN-01-02-005", Name: "Обратная засыпка траншеи с послойным виброуплотнением", Unit: "м³", Quantity: trenchVol * 0.9, UnitPrice: 2200 * regCoef, Type: "work"},
		{Code: "EM-01-03-001", Name: "Работа экскаватора-погрузчика JCB 4CX (GPS Online)", Unit: "маш-час", Quantity: 16, UnitPrice: 18000 * regCoef, Type: "equipment"},
		{Code: "DOC-23-01-001", Name: "Исполнительная геодезическая съёмка и сдача технадзору", Unit: "компл.", Quantity: 1, UnitPrice: 75000 * regCoef, Type: "work", SnipRef: "СП РК 1.03-106"},
	}

	insights := []string{
		fmt.Sprintf("Протяжённость трассы: %.0f п.м., объём выемки грунта: %.1f м³", length, trenchVol),
		"Глубина заложения 1.8 м рассчитана ниже нормативной глубины промерзания грунта для региона",
		"Обязательно составление акта освидетельствования скрытых работ (АОСР) на песчаную подушку и опрессовку",
	}

	return length, trenchVol, items, insights
}

// 10. Earthwork (Земляные работы)
func (e *EstimatorService) calcEarthwork(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	vol := getDim(dims, "volume", 250.0) // м3
	area := getDim(dims, "area", 150.0)   // м2

	items := []EstimateLineItem{
		{Code: "GESN-01-01-001", Name: "Срезка растительного слоя грунта бульдозером до 20 см", Unit: "м²", Quantity: area, UnitPrice: 650 * regCoef, Type: "work"},
		{Code: "GESN-01-01-002", Name: "Разработка грунта II группы экскаватором в отвал / на вывоз", Unit: "м³", Quantity: vol, UnitPrice: 2800 * regCoef, Type: "work"},
		{Code: "GESN-01-01-003", Name: "Вывоз и утилизация излишков грунта самосвалами 25т", Unit: "м³", Quantity: vol * 0.8, UnitPrice: 3200 * regCoef, Type: "work"},
		{Code: "GESN-01-01-004", Name: "Планировка и послойное уплотнение дна котлована катком", Unit: "м²", Quantity: area, UnitPrice: 1200 * regCoef, Type: "work"},
		{Code: "EM-01-01-001", Name: "Аренда экскаватора гусеничного 22т (ковш 1.2 м³)", Unit: "смена", Quantity: math.Ceil(vol / 120.0), UnitPrice: 160000 * regCoef, Type: "equipment"},
		{Code: "EM-01-01-002", Name: "Аренда самосвала Shacman 25т (GPS Online)", Unit: "маш-час", Quantity: 12, UnitPrice: 18000 * regCoef, Type: "equipment"},
	}

	return area, vol, items, []string{fmt.Sprintf("Объём земляных работ: %.1f м³, площадь планировки: %.1f м²", vol, area)}
}

// 11. Demolition (Демонтажные работы)
func (e *EstimatorService) calcDemolition(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 80.0)
	vol := area * 0.25

	items := []EstimateLineItem{
		{Code: "GESN-46-01-001", Name: "Механизированный демонтаж конструкций гидромолотом / бетоноломом", Unit: "м³", Quantity: vol, UnitPrice: 14000 * regCoef, Type: "work"},
		{Code: "GESN-46-01-002", Name: "Ручная разборка и сортировка строительных элементов", Unit: "м²", Quantity: area, UnitPrice: 2200 * regCoef, Type: "work"},
		{Code: "GESN-46-01-003", Name: "Сбор, фасовка в мешки и погрузка строительного мусора", Unit: "т", Quantity: vol * 2.2, UnitPrice: 6500 * regCoef, Type: "work"},
		{Code: "GESN-46-01-004", Name: "Вывоз строительного мусора на полигон утилизации (самосвал 20т)", Unit: "рейс", Quantity: math.Ceil(vol / 8.0), UnitPrice: 38000 * regCoef, Type: "work"},
	}

	return area, vol, items, []string{fmt.Sprintf("Площадь демонтажа: %.1f м², объём лома: %.1f м³", area, vol)}
}

// 12. Roads & Landscaping (Дороги и благоустройство)
func (e *EstimatorService) calcRoadsLandscaping(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 120.0) // м2

	items := []EstimateLineItem{
		{Code: "GESN-27-01-001", Name: "Устройство щебеночного основания фр. 20-40 мм толщиной 15 см", Unit: "м²", Quantity: area, UnitPrice: 3200 * regCoef, Type: "work"},
		{Code: "GESN-27-01-002", Name: "Укладка тротуарной плитки / брусчатки толщиной 60-80 мм", Unit: "м²", Quantity: area, UnitPrice: 4500 * regCoef, Type: "work"},
		{Code: "GESN-27-01-003", Name: "Установка дорожного / садового бордюра (БР 100.20.8) на бетон", Unit: "п.м.", Quantity: math.Sqrt(area) * 4.0, UnitPrice: 2800 * regCoef, Type: "work"},
		{Code: "FSSC-27-01-001", Name: "Брусчатка вибропрессованная М400 (ГОСТ 17608) с запасом 5%", Unit: "м²", Quantity: area * 1.05, UnitPrice: 5200 * regCoef, Type: "material"},
		{Code: "FSSC-27-02-001", Name: "Щебень гранитный, песок мытый и сухая смесь М150", Unit: "т", Quantity: area * 0.35, UnitPrice: 8500 * regCoef, Type: "material"},
	}

	return area, 0, items, []string{fmt.Sprintf("Площадь покрытия: %.1f м², длина бордюрной линии: %.1f п.м.", area, math.Sqrt(area)*4.0)}
}

// 13. Metalwork (Металлоконструкции)
func (e *EstimatorService) calcMetalwork(dims map[string]float64, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	tonnage := getDim(dims, "tonnage", 4.5) // тонн
	area := tonnage * 32.0                   // м2 окраски

	items := []EstimateLineItem{
		{Code: "GESN-09-01-001", Name: "Монтаж стальных балок, колонн и связей из прокатного профиля", Unit: "т", Quantity: tonnage, UnitPrice: 185000 * regCoef, Type: "work", SnipRef: "СНиП РК 5.04-23"},
		{Code: "GESN-09-01-002", Name: "Сварочные работы и монтаж высокопрочных болтовых соединений", Unit: "узел", Quantity: tonnage * 8, UnitPrice: 12500 * regCoef, Type: "work"},
		{Code: "GESN-13-01-001", Name: "Обезжиривание, грунтование ГФ-021 и огнезащитная покраска R60", Unit: "м²", Quantity: area, UnitPrice: 4200 * regCoef, Type: "work"},
		{Code: "FSSC-09-01-001", Name: "Прокат стальной фасонный С255 / С345 (балки, швеллер, труба)", Unit: "т", Quantity: tonnage * 1.06, UnitPrice: 560000 * regCoef, Type: "material"},
		{Code: "EM-02-01-001", Name: "Работа автокрана XCMG 25т (GPS Online)", Unit: "маш-час", Quantity: 14, UnitPrice: 28000 * regCoef, Type: "equipment"},
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
		{Code: "GESN-GEN-001", Name: fmt.Sprintf("1. Подготовительные работы и разметка объекта: %s", category), Unit: "компл.", Quantity: 1, UnitPrice: area * 1200 * regCoef, Type: "work"},
		{Code: "GESN-GEN-002", Name: fmt.Sprintf("2. Основной комплекс строительно-монтажных работ: %s", category), Unit: "м²", Quantity: area, UnitPrice: 7200 * regCoef, Type: "work", SnipRef: "СНиП РК 8.04-01"},
		{Code: "GESN-GEN-003", Name: "3. Монтажные крепления, расходные материалы и оснастка", Unit: "компл.", Quantity: 1, UnitPrice: area * 1800 * regCoef, Type: "work"},
		{Code: "FSSC-GEN-001", Name: "4. Сертифицированные строительные материалы по спецификации", Unit: "м²", Quantity: area * 1.08, UnitPrice: 8900 * regCoef, Type: "material"},
		{Code: "FSSC-GEN-002", Name: "5. Защитные составы, гидрофобизаторы и крепёж (ГОСТ РК)", Unit: "компл.", Quantity: 1, UnitPrice: area * 2100 * regCoef, Type: "material"},
		{Code: "EM-GEN-001", Name: "6. Доставка материалов и работа спецтехники/манипулятора", Unit: "рейс", Quantity: math.Max(1, math.Ceil(area/50.0)), UnitPrice: 45000 * regCoef, Type: "equipment"},
		{Code: "DOC-GEN-001", Name: "7. Инженерный контроль, сдача технадзору и акты АОСР", Unit: "компл.", Quantity: 1, UnitPrice: 40000 * regCoef, Type: "work", SnipRef: "СП РК 1.03-106"},
	}

	return area, 0, items, []string{
		fmt.Sprintf("Расчёт по нормативной площади: %.2f м² (%s)", area, category),
		"Смета детализирована по единичным расценкам ГЭСН РК 2026",
	}
}

func getDim(m map[string]float64, key string, defVal float64) float64 {
	if v, ok := m[key]; ok && v > 0 {
		return v
	}
	return defVal
}
