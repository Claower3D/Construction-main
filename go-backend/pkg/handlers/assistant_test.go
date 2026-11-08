package handlers

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/config"
)

func TestHasAnyMatchesWordPrefixes(t *testing.T) {
	if hasAny("сколько стоит штукатурка", "сколы", "трещин") {
		t.Fatal("«сколько» не должно считаться дефектом")
	}
	if !hasAny("на стене трещина", "трещин") {
		t.Fatal("ожидали совпадение по «трещина»")
	}
	if !hasAny("нормы сп рк для фасада", "сп рк") {
		t.Fatal("фраза с пробелом должна искаться вхождением")
	}
}

func TestAssistantKnowledgeFallbackStreams(t *testing.T) {
	t.Setenv("OPENAI_API_KEY", "")
	h := &AiHandler{Config: &config.Config{}}
	body := `{"messages":[{"role":"user","content":"Нужна бригада на ремонт"}]}`
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai/assistant", bytes.NewBufferString(body))
	rec := httptest.NewRecorder()
	h.Assistant(rec, req)
	out := rec.Body.String()
	if !strings.Contains(out, `"done":true`) || !strings.Contains(out, "/catalog") {
		t.Fatalf("неожиданный ответ: %s", out)
	}
}

func TestAssistantRejectsEmptyQuestion(t *testing.T) {
	h := &AiHandler{Config: &config.Config{}}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/ai/assistant", bytes.NewBufferString(`{"messages":[]}`))
	rec := httptest.NewRecorder()
	h.Assistant(rec, req)
	if rec.Code != http.StatusBadRequest {
		t.Fatalf("ожидали 400, получили %d", rec.Code)
	}
}

func TestQuantityAndPhrases(t *testing.T) {
	if q, u := quantity("стяжка пола 50 м2"); q != 50 || u != "м²" {
		t.Fatalf("got %v %q", q, u)
	}
	if got := qtyPhrase(3, "смена"); got != "на 3 смены" {
		t.Fatalf("got %q", got)
	}
	if got := qtyPhrase(21, "мешок"); got != "на 21 мешок" {
		t.Fatalf("got %q", got)
	}
}

func TestKnowledgeAnswersHowItWorksWithoutPrices(t *testing.T) {
	q := "Смета по фото — как это работает?"
	if len(findPricesForQuestion(q, 8)) != 0 {
		t.Fatal("вопрос о работе сервиса не должен искать цены (фотообои, фотореле)")
	}
	if !strings.Contains(knowledgeAnswer(q, nil), "три цены") {
		t.Fatal("ожидали объяснение сметы по фото")
	}
}
