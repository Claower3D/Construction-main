package handlers

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
	"unicode"
	"unicode/utf8"

	"qazgost-ai/backend/pkg/services"
)

// POST /api/v1/ai/assistant — ИИ-ассистент «Арман» на сайте.
//
// Тело: {"messages":[{"role":"user","content":"..."}, ...], "city":"Астана"}
// Ответ: text/event-stream; события:
//   data: {"t":"кусок текста"}
//   data: {"done":true,"source":"openai"|"kb"}
// Без ключа OpenAI отвечает по базе знаний платформы и реальной базе цен.

const assistantSystemPrompt = `Ты — Арман, ИИ-инженер строительной платформы QazGost (Казахстан). Говоришь живо и дружелюбно, как опытный прораб-инженер, но по делу.

Правила:
- Отвечай на языке пользователя (русский или казахский). Коротко: 2–6 предложений или короткий список. Без воды и канцелярита.
- Деньги — в тенге (₸). Нормы — СНиП РК, СП РК, ГОСТ. Если не уверен в цифре — так и скажи и предложи точный расчёт на платформе.
- Если в сообщении есть блок «Цены из базы QazGost» — опирайся на эти цены и называй их, это реальная база платформы. Цены ориентировочные, без доставки.
- Не выдумывай функции платформы. Когда уместно, дай ссылку на раздел в формате [текст](путь). Доступные разделы:
  [Стройматериалы](/materials) — 10 425 позиций с ценами по регионам РК, заказ и доставка;
  [Спецтехника](/equipment) — экскаваторы, краны, самосвалы посменно, бронь с эскроу;
  [Каталог подрядчиков](/catalog) — бригады с бригадиром, составом и телефоном;
  [Инженерный калькулятор](/calc) — кабель, отопление, водоснабжение, канализация по СНиП;
  [Инжиниринг и ПСД](/engineering) — проект, инженерные сети, технадзор;
  [Смета по фото](auth:register) и [Акт дефектов](auth:register) — после бесплатной регистрации: загружаете фото, нейросеть считает объёмы и цену или находит трещины.
- Если вопрос не про стройку, ремонт или платформу — ответь одной фразой и мягко верни разговор к строительству.
- Никогда не проси пароли, данные карт и документы.`

type assistantMsg struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type assistantReq struct {
	Messages []assistantMsg `json:"messages"`
	City     string         `json:"city"`
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
		if err := streamOpenAIAssistant(apiKey, model, msgs, prices, req.City, func(t string) { send(map[string]string{"t": t}) }); err == nil {
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
	"сколько": true, "стоит": true, "стоимость": true, "цена": true, "цены": true, "почем": true, "почём": true,
	"какая": true, "какой": true, "какие": true, "нужно": true, "надо": true, "можно": true, "сделать": true,
	"работы": true, "работа": true, "для": true, "или": true, "это": true, "мне": true, "под": true, "ключ": true,
	"квадрат": true, "метр": true, "метра": true, "метров": true, "здравствуйте": true, "привет": true,
	"пожалуйста": true, "сейчас": true, "будет": true, "есть": true, "хочу": true, "дома": true, "доме": true,
}

func questionStems(q string) []string {
	words := strings.FieldsFunc(strings.ToLower(q), func(r rune) bool { return !unicode.IsLetter(r) && !unicode.IsDigit(r) })
	var stems []string
	seen := map[string]bool{}
	for _, w := range words {
		if utf8.RuneCountInString(w) < 4 || stopWords[w] {
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

func findPricesForQuestion(q string, limit int) []services.PriceItem {
	stems := questionStems(q)
	if len(stems) == 0 {
		return nil
	}
	db := services.GetPriceDBService()
	type scored struct {
		it    services.PriceItem
		score int
	}
	byCode := map[string]*scored{}
	for _, s := range stems {
		res := db.Search(services.SearchParams{Query: s, Limit: 200})
		for _, it := range res.Items {
			key := it.Code + "|" + it.Name
			if sc, ok := byCode[key]; ok {
				sc.score++
			} else {
				byCode[key] = &scored{it: it, score: 1}
			}
		}
	}
	list := make([]scored, 0, len(byCode))
	for _, v := range byCode {
		// бонус, если слово — в начале названия
		for _, s := range stems {
			if strings.HasPrefix(strings.ToLower(v.it.Name), s) {
				v.score += 2
			}
		}
		list = append(list, *v)
	}
	sort.SliceStable(list, func(i, j int) bool {
		if list[i].score != list[j].score {
			return list[i].score > list[j].score
		}
		return utf8.RuneCountInString(list[i].it.Name) < utf8.RuneCountInString(list[j].it.Name)
	})
	// если ни одна позиция не совпала больше чем по одному слову при многословном вопросе — берём только лучшие
	out := []services.PriceItem{}
	for _, s := range list {
		if len(out) >= limit {
			break
		}
		if len(stems) > 1 && s.score < 2 && len(out) >= 3 {
			break
		}
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

func streamOpenAIAssistant(apiKey, model string, msgs []assistantMsg, prices []services.PriceItem, city string, emit func(string)) error {
	sys := assistantSystemPrompt
	if city != "" {
		sys += "\nГород пользователя: " + city + "."
	}
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

func knowledgeAnswer(question string, prices []services.PriceItem) string {
	q := strings.ToLower(question)
	var b strings.Builder

	switch {
	case hasAny(q, "привет", "здравств", "салем", "сәлем", "добрый"):
		b.WriteString("Сәлем! Я Арман, ИИ-инженер QazGost. Подскажу цены на работы и материалы, помогу со сметой, найду бригаду или технику. Что строим или ремонтируем?")
		return b.String()
	case hasAny(q, "фото", "смет", "посчитай", "рассчитай", "расчёт", "расчет") && len(prices) == 0:
		b.WriteString("Смету проще всего получить по фото: загружаете снимки объекта, нейросеть считает объёмы работ и материалов и даёт три сценария цены — эконом, стандарт и премиум, с выгрузкой в PDF и Excel.\n\n")
		b.WriteString("Это бесплатно после регистрации: [Смета по фото](auth:register). Если напишете, что за работы и площадь, — прикину порядок цен прямо здесь.")
		return b.String()
	case hasAny(q, "трещин", "дефект", "протеч", "плесен", "грибок", "сколы", "сколов"):
		b.WriteString("Трещины и другие дефекты удобно проверить по фото: нейросеть найдёт повреждение, покажет норматив и примерную цену ремонта, а на выходе будет акт с рекомендациями.\n\n")
		b.WriteString("Если трещина шире 0,3 мм, растёт или идёт по несущей стене — лучше вызвать инженера на технадзор. [Акт дефектов](auth:register) · [Инжиниринг и технадзор](/engineering)")
		return b.String()
	case hasAny(q, "бригад", "подрядчик", "мастер", "рабоч", "строител", "исполнител"):
		b.WriteString("В [каталоге подрядчиков](/catalog) — бригады с бригадиром, составом и телефоном, можно связаться напрямую. Если удобнее, опубликуйте заказ — бригады сами откликнутся в ленте заказов.")
		return b.String()
	case hasAny(q, "экскаватор", "кран", "самосвал", "спецтехник", "погрузчик", "манипулятор", "техник") && len(prices) == 0:
		b.WriteString("Спецтехнику можно забронировать посменно в разделе [Спецтехника](/equipment): экскаваторы, автокраны, самосвалы. Оплата идёт через эскроу — деньги получит владелец только после смены.")
		return b.String()
	case hasAny(q, "кабел", "сечени", "отоплен", "радиатор", "водоснаб", "канализ", "теплопотер"):
		b.WriteString("Это посчитает [инженерный калькулятор](/calc): сечение кабеля, отопление, водоснабжение и канализацию по СНиП РК. Введите параметры — получите расчёт с нормативами.")
		if len(prices) == 0 {
			return b.String()
		}
		b.WriteString("\n\n")
	case hasAny(q, "проект", "псд", "чертеж", "чертёж", "технадзор", "согласован"):
		b.WriteString("Проект и инженерные сети, а также технадзор за стройкой — в разделе [Инжиниринг и ПСД](/engineering). Там же можно заказать пакет документов.")
		return b.String()
	case hasAny(q, "снип", "гост", "норм", "сп рк"):
		b.WriteString("По нормам ориентируюсь на СНиП РК, СП РК и ГОСТ. Уточните, что именно проверяем — фундамент, утепление, электрику или сети, — и я подскажу ключевые требования. Точные расчёты по нормам — в [инженерном калькуляторе](/calc).")
		return b.String()
	}

	if len(prices) > 0 {
		b.WriteString("Нашёл в базе QazGost (средние цены по РК, без доставки):\n")
		for i, it := range prices {
			if i >= 5 {
				break
			}
			fmt.Fprintf(&b, "- **%s** — %s ₸ за %s\n", it.Name, formatPrice(it.Price), it.Unit)
		}
		kinds := map[string]int{}
		for _, it := range prices {
			kinds[it.Type]++
		}
		switch {
		case kinds["equipment"] >= kinds["material"] && kinds["equipment"] >= kinds["work"]:
			b.WriteString("\nСтавка зависит от города и объёма. Забронировать технику со смены можно в разделе [Спецтехника](/equipment), оплата через эскроу.")
		case kinds["material"] >= kinds["work"]:
			b.WriteString("\nЦены зависят от региона и объёма. Заказать с доставкой можно в разделе [Стройматериалы](/materials), а точную смету соберу по фото: [Смета по фото](auth:register).")
		default:
			b.WriteString("\nЦены зависят от региона и объёма. Точную смету с работами и материалами соберу по фото: [Смета по фото](auth:register), а исполнителя можно найти в [каталоге подрядчиков](/catalog).")
		}
		return b.String()
	}

	b.WriteString("Помогу с ценами на работы и материалы, сметой по фото, поиском бригады или спецтехники. Напишите, что нужно сделать — например, «сколько стоит стяжка пола 50 м²» или «нужен экскаватор на смену».")
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
