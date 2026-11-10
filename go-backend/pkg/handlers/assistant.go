package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"qazgost-ai/backend/pkg/services"
)

// POST /api/v1/ai/assistant — ИИ-ассистент на сайте.
//
// Тело: {"messages":[{"role":"user","content":"..."}, ...], "city":"Астана"}
// Ответ: text/event-stream; события:
//   data: {"t":"кусок текста"}
//   data: {"done":true,"source":"openai"|"kb"}
// Без ключа OpenAI отвечает по базе знаний платформы и реальной базе цен.

const assistantSystemPrompt = `Ты — ИИ-ассистент строительной платформы QazGost (Казахстан). Говоришь живо и дружелюбно, как опытный прораб-инженер, но по делу.

Правила:
- Отвечай на языке пользователя (русский, казахский или английский). Коротко: 2–6 предложений или короткий список. Без воды и канцелярита.
- Деньги — в тенге (₸). Нормы — СНиП РК, СП РК, ГОСТ. Если не уверен в цифре — так и скажи и предложи точный расчёт на платформе.
- Если в сообщении есть блок «Цены из базы QazGost» — опирайся на эти цены и называй их, это реальная база платформы. Цены ориентировочные, без доставки.
- Не выдумывай функции платформы. Когда уместно, дай ссылку на раздел в формате [текст](путь). Доступные разделы:
  [Стройматериалы](/materials) — 10 425 позиций с ценами по регионам РК, заказ и доставка;
  [Спецтехника](/equipment) — экскаваторы, краны, самосвалы посменно, бронь с эскроу;
  [Каталог подрядчиков](/catalog) — бригады с бригадиром, составом и телефоном;
  [Инженерный калькулятор](/calc) — кабель, отопление, водоснабжение, канализация по СНиП;
  [Инжиниринг и ПСД](/engineering) — проект, инженерные сети, технадзор;
  [Смета по фото](auth:register) и [Акт дефектов](auth:register) — после бесплатной регистрации: загружаете фото, нейросеть считает объёмы и цену или находит трещины.
- Факты о платформе (не выходи за них):
  оценка по фото: загружаете фото комнаты, стены или фасада и площадь — сервис определяет вид работ, объёмы и материалы, считает по базе ГЭСН РК (23 864 позиции) с поправкой на регион, даёт три цены: эконом, стандарт, премиум;
  дефекты: нейросеть отмечает трещины рамкой с уверенностью; коррозию, сколы, высолы и влагу пока подтверждает только инженер на осмотре; заключение предварительное;
  бесплатно: оценка стоимости, проверка дефектов и каталоги; платные — модули для застройщиков и расширенная аналитика (из встроенного кошелька);
  исполнители: каталог с прямыми звонками или заказ в ленте — бригады присылают цену и сроки; при бронировании депозит замораживается в эскроу до начала работ;
  оплата: кошелёк пополняется картой Visa или Mastercard, операции видны в истории;
  приложения: сайт работает в мобильном браузере; приложения для инженера и менеджера CRM — Android, приложение для заказчика готовится;
  живой человек: WhatsApp +7 771 698 38 69.
- Если вопрос не про стройку, ремонт или платформу — ответь одной фразой и мягко верни разговор к строительству.
- Никогда не проси пароли, данные карт и документы.`

type assistantMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type assistantReq struct {
	Messages []assistantMsg `json:"messages"`
	City     string         `json:"city"`
	Lang     string         `json:"lang"` // язык интерфейса: ru, kk, en
}

// assistantLangHint — какой язык ответа просить у модели. Интерфейс на казахском или
// английском — отвечаем на нём, если пользователь сам не пишет на другом языке.
func assistantLangHint(lang string) string {
	switch lang {
	case "kk":
		return "\nИнтерфейс пользователя на казахском: отвечай на казахском языке, если пользователь явно не пишет на другом."
	case "en":
		return "\nThe user's interface is in English: answer in English unless the user clearly writes in another language."
	}
	return ""
}

// Assistant — обработчик чата ассистента.
func (h *AiHandler) Assistant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req assistantReq
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64<<10)).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}
	msgs := sanitizeAssistantHistory(req.Messages)
	if len(msgs) == 0 || msgs[len(msgs)-1].Role != "user" {
		http.Error(w, "Empty question", http.StatusBadRequest)
		return
	}
	question := msgs[len(msgs)-1].Content
	prices := findPricesForQuestion(question, 8)
	// уточнение к прошлому вопросу: «а на 50 м²?» — ищем по предыдущему вопросу
	if len(prices) == 0 && len(questionStems(question)) == 0 && len(msgs) >= 3 {
		if q, _ := quantity(question); q > 0 || wantsPrice(question) {
			for i := len(msgs) - 2; i >= 0; i-- {
				if msgs[i].Role == "user" {
					prices = findPricesForQuestion(msgs[i].Content, 8)
					if len(prices) > 0 {
						question = msgs[i].Content + " " + question
					}
					break
				}
			}
		}
	}

	w.Header().Set("Content-Type", "text/event-stream; charset=utf-8")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("X-Accel-Buffering", "no")
	flusher, _ := w.(http.Flusher)
	send := func(v interface{}) {
		b, _ := json.Marshal(v)
		fmt.Fprintf(w, "data: %s\n\n", b)
		if flusher != nil {
			flusher.Flush()
		}
	}

	apiKey := r.Header.Get("X-OpenAI-Key")
	userKey := apiKey != ""
	if apiKey == "" && h.Config != nil {
		apiKey = h.Config.OpenAIKey
	}
	if apiKey != "" {
		model := pickModel(r, userKey, "gpt-4o-mini")
		if err := streamOpenAIAssistant(apiKey, model, msgs, prices, req.City, req.Lang, func(t string) { send(map[string]string{"t": t}) }); err == nil {
			send(map[string]interface{}{"done": true, "source": "openai"})
			return
		} else {
			log.Printf("assistant: openai failed, fallback to kb: %v", err)
		}
	}

	// Запасной режим: база знаний + реальные цены. Отдаём кусками, как «печатает».
	answer := knowledgeAnswer(question, prices)
	for _, chunk := range chunkWords(answer, 3) {
		send(map[string]string{"t": chunk})
		time.Sleep(28 * time.Millisecond)
	}
	send(map[string]interface{}{"done": true, "source": "kb"})
}

func sanitizeAssistantHistory(in []assistantMsg) []assistantMsg {
	out := make([]assistantMsg, 0, len(in))
	for _, m := range in {
		role := m.Role
		if role != "user" && role != "assistant" {
			continue
		}
		c := strings.TrimSpace(m.Content)
		if c == "" {
			continue
		}
		if utf8.RuneCountInString(c) > 2000 {
			c = string([]rune(c)[:2000])
		}
		out = append(out, assistantMsg{Role: role, Content: c})
	}
	if len(out) > 12 {
		out = out[len(out)-12:]
	}
	return out
}

// ── Цены из базы ─────────────────────────────────────────────

var stopWords = map[string]bool{
	"сколько": true, "стоит": true, "стоят": true, "стоимость": true, "цена": true, "цены": true, "ценам": true, "почем": true, "почём": true,
	"какая": true, "какой": true, "какие": true, "какую": true, "нужно": true, "надо": true, "можно": true, "сделать": true, "делать": true,
	"работы": true, "работа": true, "работ": true, "работает": true, "работают": true, "для": true, "или": true, "это": true, "мне": true,
	"под": true, "ключ": true, "квадрат": true, "квадратов": true, "метр": true, "метра": true, "метров": true, "здравствуйте": true,
	"привет": true, "пожалуйста": true, "сейчас": true, "будет": true, "есть": true, "хочу": true, "дома": true, "доме": true, "дом": true,
	"квартира": true, "квартире": true, "квартиры": true, "ремонт": true, "ремонта": true, "ремонте": true, "смета": true, "смету": true,
	"сметы": true, "смете": true, "фото": true, "фотографии": true, "фотке": true, "примерно": true, "средняя": true, "средне": true,
	"тенге": true, "рублей": true, "один": true, "одна": true, "одного": true, "всего": true, "итого": true, "посчитай": true,
	"посчитать": true, "рассчитать": true, "расчёт": true, "расчет": true, "подскажи": true, "подскажите": true, "скажи": true,
	"скажите": true, "узнать": true, "интересует": true, "нужен": true, "нужна": true, "нужны": true, "купить": true, "заказать": true,
	"сколько-то": true, "лучше": true, "дешевле": true, "дороже": true, "дорого": true, "дешево": true, "дёшево": true,
}

func questionStems(q string) []string {
	words := strings.FieldsFunc(strings.ToLower(q), func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsDigit(r) })
	var stems []string
	seen := map[string]bool{}
	for _, w := range words {
		if utf8.RuneCountInString(w) < 4 || stopWords[w] || unicode.IsDigit([]rune(w)[0]) {
			continue
		}
		rs := []rune(w)
		n := len(rs)
		// грубый стемминг: отрезаем окончание
		if n > 6 {
			rs = rs[:n-2]
		} else if n > 4 {
			rs = rs[:n-1]
		}
		s := string(rs)
		if !seen[s] {
			seen[s] = true
			stems = append(stems, s)
		}
	}
	return stems
}

// findPricesForQuestion ищет позиции, в названии которых есть все значимые слова вопроса
// (для длинных вопросов — хотя бы два). Слова должны стоять в начале слов названия:
// «фото» не находит «фотообои», «плит» не находит «оплата».
func findPricesForQuestion(q string, limit int) []services.PriceItem {
	stems := questionStems(q)
	if len(stems) == 0 {
		return nil
	}
	if len(stems) > 4 {
		stems = stems[:4]
	}
	need := len(stems)
	if need > 2 {
		need = 2
	}
	db := services.GetPriceDBService()
	type scored struct {
		it      services.PriceItem
		matched int
		lead    bool
	}
	seen := map[string]bool{}
	var list []scored
	for _, it := range db.Search(services.SearchParams{Query: stems[0], Limit: 500}).Items {
		seen[it.Code+"|"+it.Name] = true
		list = append(list, scored{it: it})
	}
	for _, st := range stems[1:] {
		for _, it := range db.Search(services.SearchParams{Query: st, Limit: 500}).Items {
			if !seen[it.Code+"|"+it.Name] {
				seen[it.Code+"|"+it.Name] = true
				list = append(list, scored{it: it})
			}
		}
	}
	var good []scored
	for _, sc := range list {
		name := strings.ToLower(sc.it.Name)
		words := strings.FieldsFunc(name, func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsDigit(r) })
		for i, st := range stems {
			for j, w := range words {
				if strings.HasPrefix(w, st) {
					sc.matched++
					if i == 0 && j == 0 {
						sc.lead = true
					}
					break
				}
			}
		}
		if sc.matched >= need && sc.it.Price > 0 {
			// демонтаж показываем, только если о нём спросили
			if strings.Contains(name, "демонтаж") && !strings.Contains(strings.ToLower(q), "демонтаж") {
				continue
			}
			good = append(good, sc)
		}
	}
	sort.SliceStable(good, func(i, j int) bool {
		if good[i].matched != good[j].matched {
			return good[i].matched > good[j].matched
		}
		if good[i].lead != good[j].lead {
			return good[i].lead
		}
		return utf8.RuneCountInString(good[i].it.Name) < utf8.RuneCountInString(good[j].it.Name)
	})
	out := []services.PriceItem{}
	names := map[string]bool{}
	for _, s := range good {
		if len(out) >= limit {
			break
		}
		k := strings.ToLower(s.it.Name) + "|" + s.it.Unit
		if names[k] {
			continue
		}
		names[k] = true
		out = append(out, s.it)
	}
	return out
}

func formatPrice(p float64) string {
	n := int64(p + 0.5)
	s := fmt.Sprintf("%d", n)
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteRune(' ')
		}
		b.WriteRune(c)
	}
	return b.String()
}

func pricesContext(items []services.PriceItem) string {
	if len(items) == 0 {
		return ""
	}
	var b strings.Builder
	b.WriteString("Цены из базы QazGost (средние по РК, ₸):\n")
	for _, it := range items {
		kind := map[string]string{"work": "работа", "material": "материал", "equipment": "техника"}[it.Type]
		fmt.Fprintf(&b, "- %s (%s) — %s ₸ за %s\n", it.Name, kind, formatPrice(it.Price), it.Unit)
	}
	b.WriteString("Это базовые сметные расценки. Если цена выглядит нереалистично низкой для рынка, оговорись и предложи точный расчёт.\n")
	return b.String()
}

// ── OpenAI со стримингом ─────────────────────────────────────

var assistantHTTP = &http.Client{Timeout: 60 * time.Second}

func openAIBaseURL() string {
	if v := os.Getenv("OPENAI_BASE_URL"); v != "" {
		return strings.TrimRight(v, "/")
	}
	return "https://api.openai.com/v1"
}

func streamOpenAIAssistant(apiKey, model string, msgs []assistantMsg, prices []services.PriceItem, city, lang string, emit func(string)) error {
	sys := assistantSystemPrompt
	if city != "" {
		sys += "\nГород пользователя: " + city + "."
	}
	sys += assistantLangHint(lang)
	chat := []map[string]string{{"role": "system", "content": sys}}
	for i, m := range msgs {
		content := m.Content
		if i == len(msgs)-1 {
			if ctx := pricesContext(prices); ctx != "" {
				content = content + "\n\n" + ctx
			}
		}
		chat = append(chat, map[string]string{"role": m.Role, "content": content})
	}
	body, _ := json.Marshal(map[string]interface{}{
		"model":       model,
		"messages":    chat,
		"stream":      true,
		"temperature": 0.5,
		"max_tokens":  600,
	})
	req, err := http.NewRequest("POST", openAIBaseURL()+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	resp, err := assistantHTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("openai status %d", resp.StatusCode)
	}
	sc := bufio.NewScanner(resp.Body)
	sc.Buffer(make([]byte, 64<<10), 1<<20)
	got := false
	for sc.Scan() {
		line := strings.TrimSpace(sc.Text())
		if !strings.HasPrefix(line, "data:") {
			continue
		}
		data := strings.TrimSpace(strings.TrimPrefix(line, "data:"))
		if data == "[DONE]" {
			break
		}
		var ev struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if json.Unmarshal([]byte(data), &ev) != nil || len(ev.Choices) == 0 {
			continue
		}
		if t := ev.Choices[0].Delta.Content; t != "" {
			got = true
			emit(t)
		}
	}
	if !got {
		return fmt.Errorf("openai: empty stream")
	}
	return nil
}

// ── База знаний (без ключа) ──────────────────────────────────

// hasAny: есть ли в тексте слово, начинающееся с одного из префиксов
// (или фраза с пробелом — тогда простое вхождение).
func hasAny(q string, words ...string) bool {
	tokens := strings.FieldsFunc(q, func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsDigit(r) })
	for _, w := range words {
		if strings.Contains(w, " ") {
			if strings.Contains(q, w) {
				return true
			}
			continue
		}
		for _, t := range tokens {
			if strings.HasPrefix(t, w) {
				return true
			}
		}
	}
	return false
}

// wantsPrice — человек спрашивает цену.
func wantsPrice(q string) bool {
	q = strings.ToLower(q)
	return hasAny(q, "сколько", "стоит", "стоят", "стоимост", "цен", "почем", "почём", "расценк", "прайс", "за м2", "за м²", "за квадрат", "бюджет")
}

var qtyRe = regexp.MustCompile(`(\d+(?:[.,]\d+)?)\s*(м2|м²|кв\.?\s*м|квадрат\w*|м3|м³|куб\w*|шт\w*|меш\w*|смен\w*|п\.?\s*м|пог\w*|метр\w*|т\b|тонн\w*)`)

// quantity достаёт объём из вопроса: «50 м2» → 50, «м²».
func quantity(q string) (float64, string) {
	m := qtyRe.FindStringSubmatch(strings.ToLower(q))
	if m == nil {
		return 0, ""
	}
	v, err := strconv.ParseFloat(strings.ReplaceAll(m[1], ",", "."), 64)
	if err != nil || v <= 0 {
		return 0, ""
	}
	u := m[2]
	switch {
	case strings.HasPrefix(u, "м2"), strings.HasPrefix(u, "м²"), strings.HasPrefix(u, "кв"):
		u = "м²"
	case strings.HasPrefix(u, "м3"), strings.HasPrefix(u, "м³"), strings.HasPrefix(u, "куб"):
		u = "м³"
	case strings.HasPrefix(u, "шт"):
		u = "шт"
	case strings.HasPrefix(u, "смен"):
		u = "смена"
	case strings.HasPrefix(u, "меш"):
		u = "мешок"
	case strings.HasPrefix(u, "т"):
		u = "т"
	default:
		u = "м"
	}
	return v, u
}

// unitAcc — единица после «за»: «за смену», «за тонну».
func unitAcc(u string) string {
	switch strings.ToLower(strings.TrimSpace(u)) {
	case "смена":
		return "смену"
	case "тонна":
		return "тонну"
	case "штука":
		return "штуку"
	}
	return u
}

func plural(n float64, one, few, many string) string {
	if n != float64(int64(n)) {
		return few
	}
	i := int64(n) % 100
	if i >= 11 && i <= 14 {
		return many
	}
	switch i % 10 {
	case 1:
		return one
	case 2, 3, 4:
		return few
	}
	return many
}

// qtyPhrase: «на 3 смены», «на 20 мешков», «на 50 м²».
func qtyPhrase(q float64, unit string) string {
	n := strconv.FormatFloat(q, 'f', -1, 64)
	switch unit {
	case "смена":
		return "на " + n + " " + plural(q, "смену", "смены", "смен")
	case "мешок":
		return "на " + n + " " + plural(q, "мешок", "мешка", "мешков")
	}
	return "на " + n + " " + unit
}

func sameUnit(item, want string) bool {
	item = strings.ToLower(strings.TrimSpace(item))
	switch want {
	case "м²":
		return item == "м²" || item == "м2" || item == "кв.м" || item == "кв. м"
	case "м³":
		return item == "м³" || item == "м3"
	case "м":
		return item == "м" || item == "п.м" || item == "пог.м" || item == "м.п."
	case "т":
		return item == "т" || item == "тн" || item == "тонна"
	}
	return strings.HasPrefix(item, want)
}

type kbTopic struct {
	keys   []string
	answer string
}

// Темы в порядке приоритета. Ответы — только по фактам с сайта.
var kbTopics = []kbTopic{
	{[]string{"кто ты", "ты бот", "ты человек", "тебя зовут", "ты кто", "ты робот"},
		"Я ИИ-ассистент QazGost, цифровой помощник. Подсказываю цены по базе платформы, объясняю, как посчитать смету и проверить дефекты, и подбираю, где найти бригаду или технику. Если нужен живой человек — пишите в WhatsApp: +7 771 698 38 69."},
	{[]string{"оператор", "живой человек", "менеджер", "связаться", "позвонить", "телефон", "whatsapp", "ватсап", "вотсап", "поддержк", "контакт"},
		"Живой специалист на связи в WhatsApp: +7 771 698 38 69. Напишите, что за объект и какие работы, — так ответят быстрее. А я могу пока прикинуть цены или подсказать, с чего начать."},
	{[]string{"по фото", "смет", "оценк", "просчит", "посчита", "рассчита"},
		"Смета по фото работает так:\n- загружаете фото комнаты, стены или фасада и указываете площадь;\n- сервис определяет вид работ, считает объёмы и материалы по базе ГЭСН РК (23 864 позиции) с поправкой на ваш регион;\n- вы получаете три цены — эконом, стандарт и премиум — и можете выгрузить смету.\n\nЭто бесплатно, нужна только регистрация: [Смета по фото](auth:register). Если напишете вид работ и площадь, например «стяжка пола 40 м²», — прикину цену прямо здесь."},
	{[]string{"трещин", "дефект", "протеч", "плесен", "грибок", "сколы", "сколов", "сырост", "высол", "коррози", "трескает", "треснул"},
		"Трещины удобно проверить по фото: нейросеть отметит их рамкой и покажет уверенность для каждой зоны. Коррозию, сколы, высолы и влагу модель пока не подтверждает — их оценивает инженер на осмотре, а заключение считается предварительным, пока его не подтвердит специалист.\n\nЕсли трещина шире 0,3 мм, растёт или идёт по несущей стене — лучше сразу вызвать инженера. [Проверить фото](auth:register) · [Технадзор](/engineering)"},
	{[]string{"бригад", "подрядчик", "мастер", "рабочих", "строител", "исполнител", "плиточник", "сантехник", "электрик", "штукатур", "маляр", "сварщик", "кровельщик", "каменщик", "найти кого"},
		"Исполнителя можно найти двумя способами:\n- в [каталоге подрядчиков](/catalog) — звоните бригаде напрямую;\n- или опубликуйте заказ в ленте — бригады из вашего города пришлют предложения по цене и срокам.\n\nПри бронировании депозит замораживается в эскроу до начала работ, так что деньги не уйдут раньше времени."},
	{[]string{"заказы", "найти заказ", "найти работу", "ищу работу", "лента", "подработ", "клиентов"},
		"Если вы бригада или мастер — заказы со всего Казахстана в ленте, без посредников и комиссий: откликаетесь с ценой и сроками, ведёте объект и сдаёте его онлайн. [Зарегистрироваться и открыть ленту](auth:register)"},
	{[]string{"экскаватор", "автокран", "самосвал", "спецтехник", "погрузчик", "манипулятор", "бульдозер", "техник", "аренд"},
		"Спецтехнику — экскаваторы, автокраны, самосвалы — можно забронировать посменно в разделе [Спецтехника](/equipment). Депозит замораживается в эскроу, владелец получает деньги после смены. Если спросите «сколько стоит экскаватор на смену» — назову ставки из базы."},
	{[]string{"доставк", "заказать материал", "купить материал", "поставщик", "материал"},
		"Стройматериалы — 10 425 позиций с ценами по регионам РК — в разделе [Стройматериалы](/materials): там же сравните поставщиков и закажете доставку на объект. Назовите материал, например «цемент М500», и я подскажу цену из базы."},
	{[]string{"кабел", "сечени", "отоплен", "радиатор", "водоснаб", "канализ", "теплопотер", "автомат", "вентиляц"},
		"Такие расчёты делает [инженерный калькулятор](/calc): сечение кабеля, отопление, водоснабжение и канализация по СНиП РК. Вводите параметры — получаете расчёт с нормативами. Если нужен проект сетей целиком — это [Инжиниринг и ПСД](/engineering)."},
	{[]string{"проект", "псд", "чертеж", "чертёж", "технадзор", "согласован", "архитект", "экспертиз"},
		"Проект, инженерные сети и технадзор за стройкой — в разделе [Инжиниринг и ПСД](/engineering). Опишите объект — площадь, этажность, что нужно, — и там подберут пакет документов."},
	{[]string{"снип", "гост", "норм", "сп рк", "требован"},
		"Опираюсь на СНиП РК, СП РК и ГОСТ. Уточните, что проверяем — фундамент, утепление, электрику или сети, — подскажу ключевые требования. Точные инженерные расчёты по нормам — в [инженерном калькуляторе](/calc)."},
	{[]string{"бесплатн", "платн", "подписк", "тариф", "комисси"},
		"Оценка стоимости, проверка дефектов и каталоги — бесплатно. Платные только модули для застройщиков и расширенная аналитика, они оплачиваются из встроенного кошелька. Для бригад лента заказов — без комиссий."},
	{[]string{"оплат", "оплачива", "карт", "кошел", "эскроу", "гарант", "возврат", "деньги"},
		"Кошелёк пополняется картой Visa или Mastercard. При бронировании бригады или техники депозит замораживается в эскроу и уходит исполнителю только после начала работ или смены. Все операции, включая заморозку и возврат, видны в истории кошелька."},
	{[]string{"приложен", "андроид", "android", "ios", "айфон", "iphone", "скачать", "apk"},
		"Сайт полностью работает в мобильном браузере. Отдельные приложения для инженера и менеджера CRM есть для Android, приложение для заказчиков готовится к выпуску."},
	{[]string{"регистрац", "зарегистр", "аккаунт", "войти", "вход", "кабинет", "логин", "пароль"},
		"Зарегистрироваться можно кнопкой «Регистрация» вверху сайта — это бесплатно. Если не получается войти или забыли пароль — напишите в WhatsApp: +7 771 698 38 69, помогут. [Зарегистрироваться](auth:register)"},
}

func knowledgeAnswer(question string, prices []services.PriceItem) string {
	q := strings.ToLower(strings.TrimSpace(question))
	words := strings.Fields(q)
	if len(words) <= 4 && hasAny(q, "привет", "здравств", "салем", "сәлем", "салам", "добрый", "хай", "hello", "ассалам") {
		return "Сәлем! Я ИИ-ассистент QazGost. Подскажу цены на работы и материалы, расскажу, как получить смету по фото, найду бригаду или технику. Что строим или ремонтируем?"
	}
	if hasAny(q, "спасибо", "рахмет", "благодар") && len(words) <= 5 {
		return "Пожалуйста! Если появятся вопросы по стройке или ценам — я здесь."
	}

	price := wantsPrice(q)
	if len(prices) > 0 && (price || !matchesTopic(q)) {
		return priceAnswer(q, prices)
	}
	for _, t := range kbTopics {
		if hasAny(q, t.keys...) {
			if price && len(prices) == 0 && strings.Contains(t.answer, "смет") {
				break
			}
			return t.answer
		}
	}
	if price {
		return "Точной позиции под этот запрос в базе не нашёл. Напишите конкретнее — вид работ или материал и объём, например «штукатурка стен 60 м²» или «бетон М300 5 м³». А полную смету с работами и материалами соберёт [Смета по фото](auth:register)."
	}
	return "Я помогаю со стройкой и ремонтом: цены на работы и материалы, смета по фото, проверка трещин, поиск бригады и спецтехники. Напишите, что нужно сделать, — например, «сколько стоит стяжка пола 50 м²» или «нужен экскаватор на смену»."
}

func matchesTopic(q string) bool {
	for _, t := range kbTopics {
		if hasAny(q, t.keys...) {
			return true
		}
	}
	return false
}

func priceAnswer(q string, prices []services.PriceItem) string {
	var b strings.Builder
	qty, unit := quantity(q)
	b.WriteString("Вот что есть в базе QazGost (средние цены по РК, без доставки):\n")
	shown := 0
	for _, it := range prices {
		if shown >= 5 {
			break
		}
		fmt.Fprintf(&b, "- **%s** — %s ₸ за %s", it.Name, formatPrice(it.Price), unitAcc(it.Unit))
		if qty > 0 && sameUnit(it.Unit, unit) {
			sum := it.Price * qty
			fmt.Fprintf(&b, " → %s ≈ **%s ₸**", qtyPhrase(qty, unit), formatPrice(sum))
		}
		b.WriteString("\n")
		shown++
	}
	kinds := map[string]int{}
	units := map[string]int{}
	for _, it := range prices {
		k := it.Type
		u := strings.ToLower(it.Unit)
		if strings.Contains(u, "смен") || strings.Contains(u, "час") {
			k = "equipment"
		}
		kinds[k]++
		units[u]++
	}
	topUnit, n := "", 0
	for u, c := range units {
		if c > n {
			topUnit, n = u, c
		}
	}
	b.WriteString("\n")
	if qty == 0 {
		hint := "«на 40 м²»"
		switch {
		case strings.Contains(topUnit, "смен"):
			hint = "«на 3 смены»"
		case strings.Contains(topUnit, "м³"), strings.Contains(topUnit, "м3"):
			hint = "«на 5 м³»"
		case strings.Contains(topUnit, "меш"):
			hint = "«20 мешков»"
		case strings.Contains(topUnit, "шт"):
			hint = "«100 шт»"
		case topUnit == "м" || strings.Contains(topUnit, "п.м"):
			hint = "«на 30 м»"
		}
		b.WriteString("Напишите объём — например, " + hint + ", — и я посчитаю сумму. ")
	}
	switch {
	case kinds["equipment"] >= kinds["material"] && kinds["equipment"] >= kinds["work"]:
		b.WriteString("Ставки зависят от города и машины. Забронировать технику на смену можно в разделе [Спецтехника](/equipment), депозит хранится в эскроу.")
	case kinds["material"] >= kinds["work"]:
		b.WriteString("Цены зависят от региона и объёма. Заказать с доставкой — в разделе [Стройматериалы](/materials).")
	case kinds["work"] == len(prices):
		b.WriteString("Это расценки на работу без материалов. Полную смету с материалами и тремя вариантами цены соберёт [Смета по фото](auth:register), а исполнителя найдёте в [каталоге подрядчиков](/catalog).")
	default:
		b.WriteString("Цены зависят от региона и объёма. Полную смету с работами и материалами соберёт [Смета по фото](auth:register), а исполнителя найдёте в [каталоге подрядчиков](/catalog).")
	}
	return b.String()
}

func chunkWords(s string, n int) []string {
	var out []string
	var cur strings.Builder
	count := 0
	for _, r := range s {
		cur.WriteRune(r)
		if r == ' ' || r == '\n' {
			count++
			if count >= n {
				out = append(out, cur.String())
				cur.Reset()
				count = 0
			}
		}
	}
	if cur.Len() > 0 {
		out = append(out, cur.String())
	}
	return out
}
