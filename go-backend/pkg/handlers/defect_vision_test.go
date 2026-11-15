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

func TestDefectVision(t *testing.T) {
	var gotAuth, gotBody string
	calls := 0
	answer := `{"object":"кирпичная стена","defects":[
	 {"type":"crack","title":"Ступенчатая трещина в кладке","cells":["f3","F4","Z9","F4","G4"],"severity":"high","through":true,"description":"идёт по швам","cause":"осадка","fix":"маяки"},
	 {"type":"ghost","title":"","cells":["B2"],"severity":"awful"},
	 {"type":"spall","title":"без ячеек","cells":["M1","A99"],"severity":"low"}],
	 "overall":{"severity":"HIGH","state":"ограниченно-работоспособное","summary":"s","actions":"a"},"photo_quality":"ok"}`
	fake := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		gotAuth = r.Header.Get("Authorization")
		b, _ := io.ReadAll(r.Body)
		gotBody = string(b)
		calls++
		// как у новых моделей: старые параметры отвергаются
		if strings.Contains(gotBody, `"max_tokens"`) && !strings.Contains(gotBody, "gpt-4") {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		if strings.Contains(gotBody, "gpt-4") && strings.Contains(gotBody, "max_completion_tokens") {
			w.WriteHeader(http.StatusBadRequest)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"choices": []map[string]interface{}{{"message": map[string]string{"role": "assistant", "content": "```json\n" + answer + "\n```"}}}})
	}))
	defer fake.Close()
	t.Setenv("OPENAI_BASE_URL", fake.URL)

	photo := "data:image/jpeg;base64,/9j/AAAA"
	call := func(h *AiHandler, body map[string]interface{}, key string) *httptest.ResponseRecorder {
		r := jsonReq("POST", "/api/v1/ai/defect-vision", body)
		if key != "" {
			r.Header.Set("X-OpenAI-Key", key)
		}
		w := httptest.NewRecorder()
		h.DefectVisionProxy(w, r)
		return w
	}
	noKey := NewAiHandler(&config.Config{})
	if w := call(noKey, map[string]interface{}{"photo": photo, "cols": 8, "rows": 6}, ""); w.Code != http.StatusServiceUnavailable || !strings.Contains(w.Body.String(), "no_key") {
		t.Fatalf("without a key must be 503 no_key, got %d %s", w.Code, w.Body.String())
	}
	if w := call(noKey, map[string]interface{}{"photo": "это текст", "cols": 8, "rows": 6}, "k"); w.Code != http.StatusBadRequest {
		t.Fatalf("non-image must be 400, got %d", w.Code)
	}
	if w := call(noKey, map[string]interface{}{"photo": photo, "cols": 40, "rows": 6}, "k"); w.Code != http.StatusBadRequest {
		t.Fatalf("bad grid must be 400, got %d", w.Code)
	}

	h := NewAiHandler(&config.Config{OpenAIKey: "server-key"})
	w := call(h, map[string]interface{}{"photo": photo, "cols": 8, "rows": 6, "description": "трещина над воротами"}, "")
	if w.Code != http.StatusOK {
		t.Fatalf("status %d %s", w.Code, w.Body.String())
	}
	if gotAuth != "Bearer server-key" || !strings.Contains(gotBody, "gpt-6.1-terra") || !strings.Contains(gotBody, "max_completion_tokens") || strings.Contains(gotBody, "temperature") || !strings.Contains(gotBody, "трещина над воротами") || !strings.Contains(gotBody, "A–H") {
		t.Fatalf("upstream request is wrong: auth=%q", gotAuth)
	}
	var out struct {
		Source  string         `json:"source"`
		Defects []visionDefect `json:"defects"`
		Overall visionOverall  `json:"overall"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &out); err != nil {
		t.Fatal(err)
	}
	if out.Source != "vision-llm" || len(out.Defects) != 2 {
		t.Fatalf("want 2 sanitized defects, got %+v", out.Defects)
	}
	d := out.Defects[0]
	if d.Type != "crack" || strings.Join(d.Cells, ",") != "F3,F4,G4" || !d.Through || d.Severity != "high" {
		t.Fatalf("crack sanitized wrong: %+v", d)
	}
	if g := out.Defects[1]; g.Type != "other" || g.Severity != "medium" || g.Title != "Дефект" {
		t.Fatalf("unknown type/severity must be normalised: %+v", g)
	}
	if out.Overall.Severity != "high" {
		t.Fatalf("overall severity: %q", out.Overall.Severity)
	}
	// старая модель из настроек сервера: параметры max_tokens/temperature
	t.Setenv("OPENAI_VISION_MODEL", "gpt-4o")
	if w := call(h, map[string]interface{}{"photo": photo, "cols": 8, "rows": 6}, ""); w.Code != http.StatusOK || !strings.Contains(gotBody, `"max_tokens"`) {
		t.Fatalf("legacy model params: %d", w.Code)
	}
	// модель с незнакомым именем, которой нужны старые параметры: одна повторная попытка
	t.Setenv("OPENAI_VISION_MODEL", "gpt-4.1")
	calls = 0
	if w := call(h, map[string]interface{}{"photo": photo, "cols": 8, "rows": 6}, ""); w.Code != http.StatusOK || calls != 1 {
		t.Fatalf("gpt-4.1: %d calls=%d", w.Code, calls)
	}
	t.Setenv("OPENAI_VISION_MODEL", "")
	// a client key is forwarded instead of the server one
	_ = call(h, map[string]interface{}{"photo": photo, "cols": 6, "rows": 8}, "user-key")
	if gotAuth != "Bearer user-key" {
		t.Fatalf("user key must be used, got %q", gotAuth)
	}
}
