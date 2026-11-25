package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/config"
)

// точка 1×1 в формате PNG — «фото» для проверок
const tinyPNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="

// Разбор фото для сметы: ответы сервиса ИИ подменяются местным сервером, в интернет запросы не уходят.
func TestSmetaPhotoHint(t *testing.T) {
	var gotAuth, gotBody string
	reply := func(status int, content string) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			gotAuth = r.Header.Get("Authorization")
			b, _ := io.ReadAll(r.Body)
			gotBody = string(b)
			if status != http.StatusOK {
				http.Error(w, `{"error":{"message":"nope"}}`, status)
				return
			}
			_ = json.NewEncoder(w).Encode(map[string]interface{}{
				"choices": []map[string]interface{}{{"message": map[string]string{"role": "assistant", "content": content}}},
			})
		}
	}
	var current http.HandlerFunc
	ai := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) { current(w, r) }))
	defer ai.Close()
	t.Setenv("OPENAI_BASE_URL", ai.URL)

	call := func(h *AiHandler, body string, hdr ...string) (*httptest.ResponseRecorder, smetaPhotoHint) {
		w := httptest.NewRecorder()
		r := httptest.NewRequest(http.MethodPost, "/api/v1/estimate/photo-hint", strings.NewReader(body))
		for i := 0; i+1 < len(hdr); i += 2 {
			r.Header.Set(hdr[i], hdr[i+1])
		}
		h.SmetaPhotoHint(w, r)
		var out smetaPhotoHint
		_ = json.Unmarshal(w.Body.Bytes(), &out)
		return w, out
	}
	body := func(category string) string {
		b, _ := json.Marshal(map[string]interface{}{"photos": []string{tinyPNG}, "description": "ванная 2×2 м", "category": category, "city": "Алматы"})
		return string(b)
	}
	withKey := NewAiHandler(&config.Config{OpenAIKey: "sk-test-server-key"})
	noKey := NewAiHandler(&config.Config{})

	// без ключа — честный ответ «не подключён», а не выдуманная смета
	if w, out := call(noKey, body("floors")); w.Code != http.StatusOK || out.Status != "unavailable" || out.Reason != "no_key" || out.Message == "" {
		t.Fatalf("без ключа: код %d, ответ %+v", w.Code, out)
	}

	// обычный разбор: вид работ совпал с выбранным
	current = reply(http.StatusOK, `Вот ответ: {"detected_type":"Санузел со старой плиткой на стенах","suggested_category":"wall_finish","confidence":0.82,"area_m2":14.5,"condition":"Плитка местами отошла","defects":["Трещина в углу","Следы протечки у стояка"],"insights":["Проверить гидроизоляцию","Заложить демонтаж плитки","","x","y","z","лишнее"]}`)
	w, out := call(withKey, body("wall_finish"))
	if w.Code != http.StatusOK || out.Status != "ok" || out.Photos != 1 || out.Suggested == nil || out.Suggested.ID != "wall_finish" || out.Suggested.Title == "" || !out.Matches {
		t.Fatalf("разбор: код %d, ответ %+v", w.Code, out)
	}
	if out.AreaM2 != 14.5 || len(out.Defects) != 2 || len(out.Insights) != 5 || out.Confidence != 0.82 || out.Detected == "" || out.Condition == "" {
		t.Errorf("разбор: поля ответа %+v", out)
	}
	if gotAuth != "Bearer sk-test-server-key" {
		t.Errorf("ключ сервера не передан сервису ИИ: %q", gotAuth)
	}
	if !strings.Contains(gotBody, "wall_finish — ") || !strings.Contains(gotBody, "image_url") || !strings.Contains(gotBody, "json_object") || strings.Contains(gotBody, "unit_price") {
		t.Errorf("запрос к сервису ИИ собран не так, как задумано")
	}

	// ИИ увидел другое — страница получит подсказку сменить вид работ
	if _, out := call(withKey, body("floors")); out.Status != "ok" || out.Matches || out.Suggested == nil || out.Suggested.ID != "wall_finish" {
		t.Errorf("несовпадение вида работ: %+v", out)
	}
	// комплекс «Ремонт квартиры» включает отделку стен — это совпадение
	if _, out := call(withKey, body("apartment_renovation")); !out.Matches {
		t.Errorf("комплекс с нужной работой должен считаться совпадением: %+v", out)
	}
	// вид работ не выбран — предлагаем, но не говорим о несовпадении
	if _, out := call(withKey, body("")); !out.Matches || out.Suggested == nil {
		t.Errorf("без выбранного вида работ: %+v", out)
	}
	// свой ключ пользователя важнее серверного
	if _, out := call(noKey, body("wall_finish"), "X-OpenAI-Key", "sk-user-own-key"); out.Status != "ok" || gotAuth != "Bearer sk-user-own-key" {
		t.Errorf("ключ пользователя: %+v, передан %q", out, gotAuth)
	}
	// выдуманный вид работ не показываем
	current = reply(http.StatusOK, `{"detected_type":"Комната","suggested_category":"teleport_install","insights":"одно замечание"}`)
	if _, out := call(withKey, body("floors")); out.Status != "ok" || out.Suggested != nil || !out.Matches || len(out.Insights) != 1 {
		t.Errorf("выдуманный вид работ: %+v", out)
	}

	// на фото не объект
	current = reply(http.StatusOK, `{"not_object":true,"reason":"на фото кот"}`)
	if w, _ := call(withKey, body("floors")); w.Code != http.StatusUnprocessableEntity || !strings.Contains(w.Body.String(), photoNotObjectCode) {
		t.Errorf("не объект: код %d, тело %s", w.Code, w.Body.String())
	}

	// сбои сервиса ИИ называются своими именами
	for status, reason := range map[int]string{http.StatusUnauthorized: "key_rejected", http.StatusTooManyRequests: "quota", http.StatusInternalServerError: "error", http.StatusGatewayTimeout: "timeout"} {
		current = reply(status, "")
		if w, out := call(withKey, body("floors")); w.Code != http.StatusOK || out.Status != "unavailable" || out.Reason != reason || out.Message == "" {
			t.Errorf("сбой %d: код %d, ответ %+v (ждали %s)", status, w.Code, out, reason)
		}
	}
	current = reply(http.StatusOK, "я не знаю")
	if _, out := call(withKey, body("floors")); out.Status != "unavailable" || out.Reason != "error" {
		t.Errorf("ответ не в формате JSON: %+v", out)
	}

	// плохие запросы
	for name, bad := range map[string]string{
		"нет фото":       `{"photos":[],"category":"floors"}`,
		"не изображение": `{"photos":["data:text/html;base64,PGI+"],"category":"floors"}`,
		"не JSON":        `{"photos":`,
	} {
		if w, _ := call(withKey, bad); w.Code != http.StatusBadRequest {
			t.Errorf("%s: код %d", name, w.Code)
		}
	}
	w = httptest.NewRecorder()
	withKey.SmetaPhotoHint(w, httptest.NewRequest(http.MethodGet, "/api/v1/estimate/photo-hint", nil))
	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("GET: код %d", w.Code)
	}
}

// На английской версии сайта ИИ просят отвечать по-английски; по умолчанию — по-русски.
func TestSmetaPhotoLangRule(t *testing.T) {
	if !strings.Contains(smetaPhotoLangRule("en"), "английском") || !strings.Contains(smetaPhotoLangRule(" KK "), "казахском") {
		t.Fatal("язык ответа ИИ не учитывается")
	}
	for _, l := range []string{"", "ru", "xx"} {
		if !strings.Contains(smetaPhotoLangRule(l), "по-русски") {
			t.Fatalf("для %q ожидался русский", l)
		}
	}
}
