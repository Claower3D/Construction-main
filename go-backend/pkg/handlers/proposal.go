package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"math"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/services"
)

// Коммерческое предложение из заметки: менеджер или инженер пишет текстом, что нужно сделать,
// сервер находит в тексте вид работ и объёмы и считает работы, материалы и человеко-часы.
//
// Понять текст помогает ИИ (если подключён ключ OpenAI): он только вытаскивает из заметки вид работ,
// объёмы, людей и сроки. Цены и количества всегда считает встроенный сметчик — из нашей базы цен,
// а не «из головы» модели. Без ключа те же данные ищутся в тексте по ключевым словам и числам.

const (
	proposalMaxText   = 6000
	laborDayOutput    = 45000.0 // ₸ работ на одного человека в день — та же норма, что в сроках сметчика
	laborHoursPerDay  = 8.0
	proposalLLMWindow = 12 * time.Second
)

type proposalRequest struct {
	Text    string `json:"text"`
	Service string `json:"service"`
	City    string `json:"city"`
	Client  string `json:"client"`
}

// proposalFacts — что удалось понять из заметки
type proposalFacts struct {
	Category   string             `json:"category"`
	Dimensions map[string]float64 `json:"dimensions"`
	People     int                `json:"people"`
	Days       int                `json:"days"`
}

type proposalLine struct {
	Name  string  `json:"name"`
	Unit  string  `json:"unit"`
	Qty   float64 `json:"qty"`
	Price float64 `json:"price"`
	Sum   float64 `json:"sum"`
}

type proposalLabor struct {
	ManHours float64 `json:"manHours"`
	ManDays  float64 `json:"manDays"`
	Crew     int     `json:"crew"`
	Days     int     `json:"days"`
	Note     string  `json:"note"`
}

type proposalResponse struct {
	Source      string             `json:"source"` // "ai" — заметку разобрал ИИ, "local" — встроенный разбор
	SourceLabel string             `json:"sourceLabel"`
	Title       string             `json:"title"`
	City        string             `json:"city"`
	Client      string             `json:"client,omitempty"`
	Works       []proposalLine     `json:"works"`
	Materials   []proposalLine     `json:"materials"`
	Equipment   []proposalLine     `json:"equipment"`
	Labor       proposalLabor      `json:"labor"`
	Totals      map[string]float64 `json:"totals"`
	Assumptions []string           `json:"assumptions"`
	Text        string             `json:"text"` // готовый текст КП — вставить в заметку или письмо
}

// Слова заметки → вид работ, который понимает сметчик (порядок важен: частное раньше общего)
var proposalCategories = []struct {
	category string
	title    string
	keys     []string
}{
	{"демонтаж", "Демонтажные работы", []string{"демонтаж", "снос", "разбор"}},
	{"электромонтаж", "Электромонтажные работы", []string{"электр", "проводк", "розет", "кабел", "щит", "освещен"}},
	{"тёплый пол", "Устройство водяного тёплого пола", []string{"тёплый пол", "теплый пол", "тёплого пола", "теплого пола", "теплые полы", "тёплые полы"}},
	{"отопление", "Монтаж системы отопления", []string{"отоплен", "отопит", "радиатор", "батаре", "котел", "котёл", "котельн"}},
	{"сантехника", "Сантехнические работы", []string{"сантех", "унитаз", "смесител", "стояк"}},
	{"наружные сети", "Наружные сети", []string{"септик", "канализац", "водопровод", "наружн", "колодец", "скважин", "ливнев"}},
	{"земляные работы", "Земляные работы", []string{"котлован", "транше", "грунт", "земл", "планировк", "засыпк"}},
	{"фундамент", "Устройство фундамента", []string{"фундамент", "ростверк", "сваи", "опалубк"}},
	{"кровля", "Кровельные работы", []string{"кровл", "крыш", "черепиц", "профлист", "водосток"}},
	{"фасад", "Фасадные работы", []string{"фасад", "утеплен", "облицовк", "сайдинг"}},
	{"стяжка пола", "Устройство полов", []string{"стяжк", "ламинат", "линолеум", "наливн", "полы", "пол "}},
	{"отделка", "Отделочные работы", []string{"отделк", "штукатур", "шпакл", "шпатл", "покраск", "окраск", "обои", "плитк", "кафел", "ремонт"}},
	{"кладка стен", "Кладочные работы", []string{"кладк", "кирпич", "газоблок", "перегородк", "стен"}},
	{"металлоконструкции", "Монтаж металлоконструкций", []string{"металл", "ферм", "балк", "сварк", "рельс", "ангар"}},
	{"благоустройство", "Благоустройство", []string{"брусчат", "асфальт", "тротуар", "бордюр", "благоустро", "дорог"}},
}

var (
	reNum      = `(\d+(?:[.,]\d+)?)`
	reArea     = regexp.MustCompile(reNum + `\s*(?:м2|м²|кв\.?\s*м|квадрат)`)
	reVolume   = regexp.MustCompile(reNum + `\s*(?:м3|м³|куб)`)
	reLength   = regexp.MustCompile(reNum + `\s*(?:пог\.?\s*м|п\.?\s*м\b|м\.?\s*п\b|погонн|метр)`)
	rePoints   = regexp.MustCompile(reNum + `\s*(?:точ|розет|светильник|выключател)`)
	reTons     = regexp.MustCompile(reNum + `\s*(?:т\b|тонн)`)
	rePeople   = regexp.MustCompile(`(\d+|один|одного|два|двое|две|три|трое|четыре|четверо|пять|пятеро|шесть|шестеро|семь|восемь|девять|десять)\s*(?:человек|чел\b|чел\.|рабоч|мастер|монтажник)`)
	reDaysN    = regexp.MustCompile(reNum + `\s*(?:дн|день|дня|суток|смен)`)
	reDayRange = regexp.MustCompile(`с\s+(\d{1,2})(?:[-‑]?го)?(?:\s+числа)?\s+(?:по|до)\s+(\d{1,2})`)
	wordNums   = map[string]int{"один": 1, "одного": 1, "два": 2, "двое": 2, "две": 2, "три": 3, "трое": 3, "четыре": 4, "четверо": 4,
		"пять": 5, "пятеро": 5, "шесть": 6, "шестеро": 6, "семь": 7, "восемь": 8, "девять": 9, "десять": 10}
)

func firstNumber(re *regexp.Regexp, text string) (float64, bool) {
	m := re.FindStringSubmatch(text)
	if m == nil {
		return 0, false
	}
	v, err := strconv.ParseFloat(strings.Replace(m[1], ",", ".", 1), 64)
	if err != nil || v <= 0 || v > 1e7 {
		return 0, false
	}
	return v, true
}

func proposalCategory(text string) (category, title string, found bool) {
	low := strings.ToLower(text) + " "
	for _, c := range proposalCategories {
		for _, k := range c.keys {
			if strings.Contains(low, k) {
				return c.category, c.title, true
			}
		}
	}
	return "общестроительные работы", "Общестроительные работы", false
}

// parseProposalFacts — разбор заметки по ключевым словам и числам (работает без ИИ)
func parseProposalFacts(text string) proposalFacts {
	low := strings.ToLower(strings.ReplaceAll(text, "ё", "е"))
	f := proposalFacts{Dimensions: map[string]float64{}}
	f.Category, _, _ = proposalCategory(low)
	if v, ok := firstNumber(reArea, low); ok {
		f.Dimensions["area"] = v
	}
	if v, ok := firstNumber(reVolume, low); ok {
		f.Dimensions["volume"] = v
	}
	if v, ok := firstNumber(reLength, low); ok {
		f.Dimensions["length"] = v
	}
	if v, ok := firstNumber(rePoints, low); ok {
		f.Dimensions["points"] = v
	}
	if v, ok := firstNumber(reTons, low); ok {
		f.Dimensions["tonnage"] = v
	}
	if m := rePeople.FindStringSubmatch(low); m != nil {
		if n, ok := wordNums[m[1]]; ok {
			f.People = n
		} else if n, err := strconv.Atoi(m[1]); err == nil && n > 0 && n <= 500 {
			f.People = n
		}
	}
	if m := reDayRange.FindStringSubmatch(low); m != nil {
		a, _ := strconv.Atoi(m[1])
		b, _ := strconv.Atoi(m[2])
		if a >= 1 && b >= a && b <= 31 {
			f.Days = b - a + 1
		}
	}
	if f.Days == 0 {
		if v, ok := firstNumber(reDaysN, low); ok && v <= 720 {
			f.Days = int(v)
		}
	}
	return f
}

// llmProposalFacts просит ИИ вытащить из заметки вид работ и объёмы. Любая неудача — nil (тогда разбор по словам).
func (h *AiHandler) llmProposalFacts(text, service string) *proposalFacts {
	if h.Config == nil || h.Config.OpenAIKey == "" {
		return nil
	}
	kinds := make([]string, 0, len(proposalCategories))
	for _, c := range proposalCategories {
		kinds = append(kinds, c.category)
	}
	prompt := "Ты помощник сметчика. Из заметки менеджера вытащи данные для расчёта. Ответь ТОЛЬКО JSON:\n" +
		`{"category":"<один из: ` + strings.Join(kinds, ", ") + `, общестроительные работы>","dimensions":{"area":м2,"length":м,"volume":м3,"points":шт,"tonnage":т},"people":число,"days":число}` +
		"\nУказывай только те объёмы, которые прямо названы в заметке; чего нет — не выдумывай и не включай. people — сколько человек будет работать, days — сколько дней идут работы (0, если не сказано)." +
		"\nУслуга: " + service + "\nЗаметка: " + text
	body, _ := json.Marshal(map[string]interface{}{
		"model":           "gpt-4o-mini",
		"temperature":     0,
		"response_format": map[string]string{"type": "json_object"},
		"messages":        []map[string]string{{"role": "user", "content": prompt}},
	})
	req, err := http.NewRequest("POST", openAIBaseURL()+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+h.Config.OpenAIKey)
	resp, err := (&http.Client{Timeout: proposalLLMWindow}).Do(req)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()
	raw, _ := io.ReadAll(io.LimitReader(resp.Body, 64<<10))
	if resp.StatusCode != http.StatusOK {
		return nil
	}
	var out struct {
		Choices []struct {
			Message struct {
				Content string `json:"content"`
			} `json:"message"`
		} `json:"choices"`
	}
	if json.Unmarshal(raw, &out) != nil || len(out.Choices) == 0 {
		return nil
	}
	var facts proposalFacts
	if json.Unmarshal([]byte(out.Choices[0].Message.Content), &facts) != nil {
		return nil
	}
	known := facts.Category == "общестроительные работы"
	for _, c := range proposalCategories {
		if c.category == facts.Category {
			known = true
		}
	}
	if !known {
		return nil
	}
	clean := map[string]float64{}
	for _, k := range []string{"area", "length", "volume", "points", "tonnage"} {
		if v := facts.Dimensions[k]; v > 0 && v <= 1e7 && !math.IsNaN(v) {
			clean[k] = v
		}
	}
	facts.Dimensions = clean
	if facts.People < 0 || facts.People > 500 {
		facts.People = 0
	}
	if facts.Days < 0 || facts.Days > 720 {
		facts.Days = 0
	}
	return &facts
}

// Отопление и тёплый пол сметчик отдельно не считает — для них здесь свои технологические карты.
// Количества — по площади, цены — из базы цен по кодам позиций (с региональным коэффициентом).
type mapItem struct {
	code string
	qty  float64
	work bool
}

func proposalMap(category string, area float64) ([]mapItem, []string) {
	switch category {
	case "отопление":
		radiators := math.Ceil(area / 12) // один радиатор на ~12 м² (около 100 Вт на м²)
		pipes := math.Round(area * 1.2)   // м.п. разводки на м² отапливаемой площади
		boilers := math.Ceil(area / 240)  // котёл 24 кВт — до ~240 м²
		return []mapItem{
			{"work_plumb_radiator_install", radiators, true},
			{"work_plumb_pipe_heating", pipes, true},
			{"work_plumb_collector_heat", 1, true},
			{"work_plumb_pressure_test", 1, true},
			{"radiator_steel_22_500_1000", radiators, false},
			{"radiator_kit", radiators, false},
			{"radiator_bracket", radiators * 2, false},
			{"mat_pp_pprc_25_arm", math.Round(pipes * 1.1), false},
			{"gas_boiler_turbo_24", boilers, false},
		}, []string{fmt.Sprintf("Отопление посчитано по площади %s м²: 1 радиатор на 12 м², разводка 1,2 м трубы на м², газовый котёл 24 кВт на каждые 240 м². Состав уточняется по проекту.", qtyText(area))}
	case "тёплый пол":
		coils := math.Ceil(area * 6.5 / 200) // ~6,5 м трубы на м² при шаге 150 мм, бухта 200 м
		return []mapItem{
			{"work_plumb_warmfloor_water", area, true},
			{"work_plumb_collector_heat", 1, true},
			{"work_plumb_pressure_test", 1, true},
			{"ufh_wpipe_16_pex_200m", coils, false},
		}, []string{fmt.Sprintf("Тёплый пол посчитан по площади %s м²: шаг укладки 150 мм, около 6,5 м трубы на м². Утеплитель и стяжка считаются отдельно.", qtyText(area))}
	}
	return nil, nil
}

// mapLines превращает карту в строки КП. ok=false — в базе цен нет нужной позиции (тогда считает сметчик).
func mapLines(items []mapItem, city string) (works, materials []proposalLine, ok bool) {
	db := services.GetPriceDBService()
	for _, it := range items {
		pi, found := db.GetByCode(it.code, city)
		if !found || pi.Price <= 0 {
			return nil, nil, false
		}
		line := proposalLine{Name: pi.Name, Unit: pi.Unit, Qty: it.qty, Price: pi.Price, Sum: math.Round(pi.Price * it.qty)}
		if it.work {
			works = append(works, line)
		} else {
			materials = append(materials, line)
		}
	}
	return works, materials, true
}

func money(v float64) string {
	s := strconv.FormatInt(int64(math.Round(v)), 10)
	var b strings.Builder
	for i, ch := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteRune(' ')
		}
		b.WriteRune(ch)
	}
	return b.String() + " ₸"
}

func qtyText(v float64) string {
	return strings.TrimRight(strings.TrimRight(strconv.FormatFloat(math.Round(v*100)/100, 'f', 2, 64), "0"), ".")
}

var dimNames = map[string]string{"area": "площадь, м²", "length": "длина, м", "volume": "объём, м³", "points": "точек", "tonnage": "масса, т"}

// buildProposal считает КП по найденным данным
func (h *AiHandler) buildProposal(req proposalRequest, facts proposalFacts, source string) proposalResponse {
	city := strings.TrimSpace(req.City)
	if city == "" {
		city = "Астана"
	}
	title := ""
	for _, c := range proposalCategories {
		if c.category == facts.Category {
			title = c.title
		}
	}
	if title == "" {
		title = "Общестроительные работы"
	}
	if s := strings.TrimSpace(req.Service); s != "" && !strings.EqualFold(s, "Другое") {
		title = s
	}
	res := proposalResponse{Source: source, Title: title, City: city, Client: strings.TrimSpace(req.Client),
		Works: []proposalLine{}, Materials: []proposalLine{}, Equipment: []proposalLine{}}
	if source == "ai" {
		res.SourceLabel = "Заметку разобрал ИИ, цены и объёмы посчитал сметчик QazGost по базе цен"
	} else {
		res.SourceLabel = "Расчёт встроенного сметчика QazGost: вид работ и объёмы найдены в заметке по ключевым словам (ИИ не подключён)"
	}
	regCoef := 1.0
	if c, ok := services.GetPriceDBService().GetRegions()[city]; ok && c > 0 {
		regCoef = c
	}
	mapNotes := []string(nil)
	usedMap := false
	if area := facts.Dimensions["area"]; true {
		typical := area <= 0
		if typical {
			area = 120
		}
		if items, notes := proposalMap(facts.Category, area); items != nil {
			if w, m, ok := mapLines(items, city); ok {
				res.Works, res.Materials, usedMap, mapNotes = w, m, true, notes
				if typical {
					mapNotes = append(mapNotes, "Площадь в заметке не указана — взята типовая, 120 м².")
				}
			}
		}
	}
	if !usedMap {
		estCategory := facts.Category
		if estCategory == "отопление" || estCategory == "тёплый пол" {
			estCategory = "сантехника" // нужных позиций в базе цен не нашлось — ближайший расчёт сметчика
		}
		est := h.estimator.CalculateEstimate(services.QTOFormulaRequest{
			Category: estCategory, Description: req.Text, City: city, Scenario: "standard", Dimensions: facts.Dimensions,
		})
		for _, it := range est.Recommended.Items {
			line := proposalLine{Name: it.Name, Unit: it.Unit, Qty: math.Round(it.Quantity*100) / 100, Price: it.UnitPrice, Sum: it.Total}
			switch it.Type {
			case "work":
				res.Works = append(res.Works, line)
			case "equipment":
				res.Equipment = append(res.Equipment, line)
			default:
				res.Materials = append(res.Materials, line)
			}
		}
	}
	sumOf := func(lines []proposalLine) (t float64) {
		for _, l := range lines {
			t += l.Sum
		}
		return t
	}
	worksCost, materialsCost, equipmentCost := sumOf(res.Works), sumOf(res.Materials), sumOf(res.Equipment)
	contingency := math.Round((worksCost + materialsCost + equipmentCost) * 0.05)
	totalCost := worksCost + materialsCost + equipmentCost + contingency
	vat := math.Round(totalCost * services.VATRate)

	// Человеко-часы: по той же норме выработки, по которой сметчик считает сроки
	manDays := math.Ceil(worksCost/laborDayOutput*10) / 10
	labor := proposalLabor{ManDays: manDays, ManHours: math.Round(manDays * laborHoursPerDay), Crew: facts.People, Days: facts.Days}
	switch {
	case labor.Crew > 0 && labor.Days > 0:
		labor.Note = fmt.Sprintf("По заметке: %d чел. × %d дн. = %d чел.-дн.; по норме нужно %s чел.-дн.", labor.Crew, labor.Days, labor.Crew*labor.Days, qtyText(manDays))
	case labor.Crew > 0:
		labor.Days = int(math.Ceil(manDays / float64(labor.Crew)))
		labor.Note = fmt.Sprintf("Бригада из заметки: %d чел. — срок по норме %d дн.", labor.Crew, labor.Days)
	case labor.Days > 0:
		labor.Crew = int(math.Ceil(manDays / float64(labor.Days)))
		labor.Note = fmt.Sprintf("Срок из заметки: %d дн. — нужна бригада %d чел.", labor.Days, labor.Crew)
	default:
		labor.Crew = 4
		if manDays < 4 {
			labor.Crew = 2
		}
		labor.Days = int(math.Ceil(manDays / float64(labor.Crew)))
		labor.Note = fmt.Sprintf("Бригада %d чел. — срок по норме %d дн.", labor.Crew, labor.Days)
	}
	if labor.Days < 1 {
		labor.Days = 1
	}
	res.Labor = labor
	res.Totals = map[string]float64{
		"works": worksCost, "materials": materialsCost, "equipment": equipmentCost,
		"contingency": contingency, "total": totalCost, "vatRate": services.VATRate, "vat": vat, "totalWithVat": totalCost + vat,
	}

	// Допущения: что взято из заметки, а что — типовое
	if _, _, found := proposalCategory(facts.Category); !found {
		res.Assumptions = append(res.Assumptions, "Вид работ в заметке не распознан — посчитано как общестроительные работы. Уточните услугу или опишите работы подробнее.")
	}
	res.Assumptions = append(res.Assumptions, mapNotes...)
	if usedMap {
		// про объёмы уже сказано в пояснении к карте
	} else if len(facts.Dimensions) == 0 {
		res.Assumptions = append(res.Assumptions, "Объёмы в заметке не указаны — взяты типовые. Добавьте в заметку площадь (м²), длину (м) или количество, и расчёт станет точным.")
	} else {
		parts := []string{}
		for _, k := range []string{"area", "length", "volume", "points", "tonnage"} {
			if v, ok := facts.Dimensions[k]; ok {
				parts = append(parts, dimNames[k]+": "+qtyText(v))
			}
		}
		res.Assumptions = append(res.Assumptions, "Из заметки взято — "+strings.Join(parts, "; ")+". Остальные размеры — типовые.")
	}
	res.Assumptions = append(res.Assumptions,
		fmt.Sprintf("Человеко-часы — из расчёта выработки %s работ на человека в день, смена %d ч.", money(laborDayOutput), int(laborHoursPerDay)),
		fmt.Sprintf("Цены — рыночные по г. %s (коэффициент ×%.2f), резерв на непредвиденное 5%%, НДС %d%% показан отдельно.", city, regCoef, int(math.Round(services.VATRate*100))),
		"Это предварительный расчёт: итоговая смета — после выезда инженера и замеров.",
	)

	// Текст КП
	var b strings.Builder
	fmt.Fprintf(&b, "КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ\n%s\n", title)
	if res.Client != "" {
		fmt.Fprintf(&b, "Заказчик: %s\n", res.Client)
	}
	fmt.Fprintf(&b, "Город: %s\n", city)
	section := func(name string, lines []proposalLine, sum float64) {
		if len(lines) == 0 {
			return
		}
		fmt.Fprintf(&b, "\n%s:\n", name)
		for i, l := range lines {
			fmt.Fprintf(&b, "%d. %s — %s %s × %s = %s\n", i+1, l.Name, qtyText(l.Qty), l.Unit, money(l.Price), money(l.Sum))
		}
		fmt.Fprintf(&b, "Итого %s: %s\n", strings.ToLower(name), money(sum))
	}
	section("Работы", res.Works, worksCost)
	section("Материалы", res.Materials, materialsCost)
	section("Техника", res.Equipment, equipmentCost)
	fmt.Fprintf(&b, "\nТрудозатраты: %s чел.-ч (%s чел.-дн.), бригада %d чел., срок %d дн.\n", qtyText(labor.ManHours), qtyText(labor.ManDays), labor.Crew, labor.Days)
	fmt.Fprintf(&b, "\nРезерв на непредвиденное (5%%): %s\nИТОГО без НДС: %s\nНДС %d%%: %s\nИТОГО с НДС: %s\n",
		money(contingency), money(totalCost), int(math.Round(services.VATRate*100)), money(vat), money(totalCost+vat))
	b.WriteString("\nПредварительный расчёт; точная смета — после выезда инженера и замеров.")
	res.Text = b.String()
	return res
}

// Proposal — POST /api/v1/ai/proposal
func (h *AiHandler) Proposal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
		return
	}
	var req proposalRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Неверный формат запроса")
		return
	}
	req.Text = strings.TrimSpace(req.Text)
	if len([]rune(req.Text)) > proposalMaxText {
		req.Text = string([]rune(req.Text)[:proposalMaxText])
	}
	if len([]rune(req.Text)) < 5 && strings.TrimSpace(req.Service) == "" {
		writeError(w, http.StatusBadRequest, "Напишите в заметке, что нужно сделать, — хотя бы вид работ и объём")
		return
	}
	basis := req.Service + ". " + req.Text
	source := "local"
	facts := parseProposalFacts(basis)
	if ai := h.llmProposalFacts(req.Text, req.Service); ai != nil {
		source = "ai"
		// числа, которые ИИ не назвал, берём из разбора по словам
		for k, v := range facts.Dimensions {
			if _, ok := ai.Dimensions[k]; !ok {
				ai.Dimensions[k] = v
			}
		}
		if ai.People == 0 {
			ai.People = facts.People
		}
		if ai.Days == 0 {
			ai.Days = facts.Days
		}
		facts = *ai
	}
	writeJSON(w, http.StatusOK, h.buildProposal(req, facts, source))
}
