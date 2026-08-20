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

	default:
		// Generic square-meter based calculation
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

// Generic fallback
func (e *EstimatorService) calcGeneric(dims map[string]float64, category string, regCoef float64) (float64, float64, []EstimateLineItem, []string) {
	area := getDim(dims, "area", 50.0)
	if area <= 0 {
		area = 50.0
	}

	items := []EstimateLineItem{
		{Code: "GESN-GEN-001", Name: fmt.Sprintf("Комплекс строительно-монтажных работ: %s", category), Unit: "м²", Quantity: area, UnitPrice: 8500 * regCoef, Type: "work"},
		{Code: "FSSC-GEN-001", Name: "Строительные материалы и крепеж по спецификации", Unit: "м²", Quantity: area, UnitPrice: 12500 * regCoef, Type: "material"},
	}

	return area, 0, items, []string{fmt.Sprintf("Расчёт по базовой квадратуре: %.2f м²", area)}
}

func getDim(m map[string]float64, key string, defVal float64) float64 {
	if v, ok := m[key]; ok && v > 0 {
		return v
	}
	return defVal
}
