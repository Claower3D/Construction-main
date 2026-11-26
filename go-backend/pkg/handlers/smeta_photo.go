package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/services"
)

// Разбор фото для сметы. ИИ не считает ни цен, ни объёмов — смета строится по технологическим картам
// из обмера. От фото нужно другое: понять, что на снимке, подходит ли выбранный вид работ, в каком
// состоянии поверхность и что стоит учесть (скрытые работы, дефекты). Поэтому запрос короткий и дешёвый,
// а ответ — подсказка, которую страница показывает рядом со сметой.
//
// Если ИИ недоступен, сервер говорит об этом прямо и называет причину (нет ключа, ключ отклонён,
// исчерпан лимит, сервис не ответил) — раньше в этом случае молча подставлялась «запасная» смета,
// и страница не могла объяснить человеку, что произошло.

const (
	smetaPhotoMax      = 5
	smetaPhotoMaxBytes = 6 << 20 // одно фото в виде data:-ссылки
)

type smetaPhotoRequest struct {
	Photos      []string `json:"photos"`
	Description string   `json:"description"`
	Category    string   `json:"category"` // выбранный вид работ или комплекс (id), может быть пустым
	City        string   `json:"city"`
	Lang        string   `json:"lang"` // язык страницы: на английской версии сайта ИИ отвечает по-английски
}

type smetaPhotoSuggestion struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type smetaPhotoHint struct {
	Status     string                `json:"status"` // ok | unavailable
	Reason     string                `json:"reason,omitempty"`
	Message    string                `json:"message,omitempty"`
	Photos     int                   `json:"photos,omitempty"`
	Detected   string                `json:"detected,omitempty"`
	Suggested  *smetaPhotoSuggestion `json:"suggested,omitempty"`
	Matches    bool                  `json:"matches"`
	Confidence float64               `json:"confidence,omitempty"`
	AreaM2     float64               `json:"area_m2,omitempty"`
	Condition  string                `json:"condition,omitempty"`
	Defects    []string              `json:"defects,omitempty"`
	Insights   []string              `json:"insights,omitempty"`
}

var smetaPhotoReasons = map[string]string{
	"no_key":       "ИИ-разбор фото не подключён: на сервере нет ключа OpenAI. Смета посчитана без него — по обмеру и справочнику.",
	"key_rejected": "ИИ-разбор фото не выполнен: сервис ИИ отклонил ключ OpenAI. Проверьте ключ.",
	"quota":        "ИИ-разбор фото не выполнен: исчерпан лимит запросов к сервису ИИ. Попробуйте позже.",
	"timeout":      "ИИ-разбор фото не выполнен: сервис ИИ не ответил вовремя. Попробуйте ещё раз.",
	"error":        "ИИ-разбор фото не выполнен: сервис ИИ вернул ошибку. Смета посчитана без него.",
}

func smetaPhotoUnavailable(reason string) smetaPhotoHint {
	return smetaPhotoHint{Status: "unavailable", Reason: reason, Message: smetaPhotoReasons[reason]}
}

var smetaPhotoHTTP = &http.Client{Timeout: 45 * time.Second}

// SmetaPhotoHint — POST /api/v1/estimate/photo-hint
func (h *AiHandler) SmetaPhotoHint(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
		return
	}
	var req smetaPhotoRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, decodeErrorText(err))
		return
	}
	photos := make([]string, 0, smetaPhotoMax)
	for _, p := range req.Photos {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if !strings.HasPrefix(p, "data:image/") {
			writeError(w, http.StatusBadRequest, "Нужно фото в формате изображения")
			return
		}
		if len(p) > smetaPhotoMaxBytes {
			writeError(w, http.StatusRequestEntityTooLarge, "Фото слишком большое")
			return
		}
		if len(photos) < smetaPhotoMax {
			photos = append(photos, p)
		}
	}
	if len(photos) == 0 {
		writeError(w, http.StatusBadRequest, "Нужно хотя бы одно фото")
		return
	}
	if len([]rune(req.Description)) > 2000 {
		req.Description = string([]rune(req.Description)[:2000])
	}

	// На фото человек, а не объект — не разбираем
	if photosShowPerson(photos) {
		writePhotoNotObject(w, photoPersonMsg)
		return
	}

	apiKey := r.Header.Get("X-OpenAI-Key")
	userKey := apiKey != ""
	if apiKey == "" {
		apiKey = h.Config.OpenAIDetailedKey
		if apiKey == "" {
			apiKey = h.Config.OpenAIKey
		}
	}
	if apiKey == "" {
		writeJSON(w, http.StatusOK, smetaPhotoUnavailable("no_key"))
		return
	}

	maps, complexes := services.SmetaTechMapList()
	titles := map[string]string{}
	var list strings.Builder
	for _, m := range maps {
		titles[m.ID] = m.Title
		fmt.Fprintf(&list, "%s — %s\n", m.ID, m.Title)
	}
	selected := titles[req.Category]
	var selectedParts []string
	for _, c := range complexes {
		if c.ID == req.Category {
			selected = c.Title
			selectedParts = c.Parts
		}
	}

	prompt := fmt.Sprintf(`Ты — инженер-сметчик и специалист технадзора в Казахстане. Посмотри фото объекта и помоги составить смету.
Цены и объёмы считать НЕ нужно — их посчитает программа по обмеру. Твоя задача — описать, что видно.

Виды работ (id — название):
%s
Выбранный человеком вид работ: %s
Описание задачи от человека: %s

Если на фото нет строительного объекта или помещения (человек, животное, еда, документ, пейзаж), ответь {"not_object":true,"reason":"что на фото"}.
Иначе ответь СТРОГО одним JSON-объектом без пояснений:
{"detected_type":"одной фразой: что на фото и какие работы здесь нужны",
 "suggested_category":"id самого подходящего вида работ из списка",
 "confidence":0.0,
 "area_m2":0,
 "condition":"одной фразой: состояние поверхностей и конструкций",
 "defects":["видимые дефекты: трещины, протечки, плесень, отслоения — только то, что действительно видно"],
 "insights":["до пяти коротких практических замечаний для сметы: что учесть, какие скрытые работы возможны, что проверить на месте"]}
area_m2 — грубая оценка площади пола или обрабатываемой поверхности, 0 — если оценить нельзя. %s`,
		list.String(), orDash(selected), orDash(req.Description), smetaPhotoLangRule(req.Lang))

	parts := []map[string]interface{}{{"type": "text", "text": prompt}}
	for _, p := range photos {
		parts = append(parts, map[string]interface{}{"type": "image_url", "image_url": map[string]string{"url": p, "detail": "auto"}})
	}
	body, _ := json.Marshal(map[string]interface{}{
		"model":           pickModel(r, userKey, "gpt-4o"),
		"max_tokens":      900,
		"temperature":     0.2,
		"response_format": map[string]string{"type": "json_object"},
		"messages":        []map[string]interface{}{{"role": "user", "content": parts}},
	})

	raw, reason := callSmetaPhotoAI(r.Context(), apiKey, body)
	if reason != "" {
		writeJSON(w, http.StatusOK, smetaPhotoUnavailable(reason))
		return
	}
	if msg, no := notObjectReply(raw); no {
		writePhotoNotObject(w, msg)
		return
	}

	var ai struct {
		Detected   string      `json:"detected_type"`
		Suggested  string      `json:"suggested_category"`
		Confidence float64     `json:"confidence"`
		Area       float64     `json:"area_m2"`
		Condition  string      `json:"condition"`
		Defects    interface{} `json:"defects"`
		Insights   interface{} `json:"insights"`
	}
	if err := json.Unmarshal([]byte(raw), &ai); err != nil {
		writeJSON(w, http.StatusOK, smetaPhotoUnavailable("error"))
		return
	}

	out := smetaPhotoHint{
		Status:    "ok",
		Photos:    len(photos),
		Detected:  clipText(ai.Detected, 240),
		Condition: clipText(ai.Condition, 240),
		Defects:   textList(ai.Defects, 6, 200),
		Insights:  textList(ai.Insights, 5, 260),
		Matches:   true,
	}
	if ai.Confidence > 0 && ai.Confidence <= 1 {
		out.Confidence = ai.Confidence
	}
	if ai.Area > 0 && ai.Area < 100000 {
		out.AreaM2 = ai.Area
	}
	// вид работ предлагаем только из справочника — выдуманный id не показываем
	if id := strings.TrimSpace(ai.Suggested); titles[id] != "" {
		out.Suggested = &smetaPhotoSuggestion{ID: id, Title: titles[id]}
		if req.Category != "" {
			out.Matches = id == req.Category
			for _, p := range selectedParts { // комплекс подходит, если нужная работа входит в его состав
				if p == id {
					out.Matches = true
				}
			}
		}
	}
	writeJSON(w, http.StatusOK, out)
}

// callSmetaPhotoAI отправляет запрос в сервис ИИ и возвращает текст ответа или причину отказа.
func callSmetaPhotoAI(ctx context.Context, apiKey string, body []byte) (string, string) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, openAIBaseURL()+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return "", "error"
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	resp, err := smetaPhotoHTTP.Do(req)
	if err != nil {
		var te interface{ Timeout() bool }
		if errors.As(err, &te) && te.Timeout() {
			return "", "timeout"
		}
		return "", "error"
	}
	defer resp.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	switch {
	case resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden:
		return "", "key_rejected"
	case resp.StatusCode == http.StatusTooManyRequests:
		return "", "quota"
	case resp.StatusCode == http.StatusGatewayTimeout || resp.StatusCode == http.StatusRequestTimeout:
		return "", "timeout"
	case resp.StatusCode != http.StatusOK:
		return "", "error"
	}
	var parsed openAIResponse
	if err := json.Unmarshal(data, &parsed); err != nil || len(parsed.Choices) == 0 {
		return "", "error"
	}
	raw := parsed.Choices[0].Message.Content
	start, end := strings.Index(raw, "{"), strings.LastIndex(raw, "}")
	if start < 0 || end <= start {
		return "", "error"
	}
	return raw[start : end+1], ""
}

// smetaPhotoLangRule — на каком языке ИИ пишет текст ответа (id вида работ язык не меняет).
func smetaPhotoLangRule(lang string) string {
	if name := uiLangName(lang); name != "" {
		return "Все текстовые поля пиши на языке: " + name + ". Коротко и по делу."
	}
	return "Пиши по-русски, без воды."
}

// uiLangName — название языка интерфейса для подсказки ИИ; пусто — русский или неизвестный язык.
// Список совпадает с языками сайта (frontend/src/i18n/index.js).
func uiLangName(lang string) string {
	switch strings.ToLower(strings.TrimSpace(lang)) {
	case "en", "en-us":
		return "английский"
	case "en-gb":
		return "английский (британское написание: colour, centre, organise)"
	case "en-ca":
		return "английский (канадское написание: colour, centre, organize)"
	case "fr":
		return "французский"
	case "it":
		return "итальянский"
	case "es":
		return "испанский (Мексика)"
	case "kk":
		return "казахский"
	case "zh":
		return "китайский (упрощённые иероглифы)"
	case "tr":
		return "турецкий"
	case "uz":
		return "узбекский (латиница)"
	case "ar":
		return "арабский"
	case "de":
		return "немецкий"
	case "ja":
		return "японский"
	}
	return ""
}

func orDash(s string) string {
	if strings.TrimSpace(s) == "" {
		return "—"
	}
	return s
}

func clipText(s string, max int) string {
	s = strings.Join(strings.Fields(s), " ")
	if r := []rune(s); len(r) > max {
		return string(r[:max])
	}
	return s
}

// textList принимает от ИИ список строк (или одну строку) и приводит к короткому списку.
func textList(v interface{}, maxItems, maxLen int) []string {
	var out []string
	add := func(s string) {
		if s = clipText(s, maxLen); s != "" && len(out) < maxItems {
			out = append(out, s)
		}
	}
	switch t := v.(type) {
	case string:
		add(t)
	case []interface{}:
		for _, x := range t {
			if s, ok := x.(string); ok {
				add(s)
			}
		}
	}
	return out
}
