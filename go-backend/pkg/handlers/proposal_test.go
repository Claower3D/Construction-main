package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/services"
)

func proposalCall(t *testing.T, h *AiHandler, body map[string]string) (int, proposalResponse) {
	t.Helper()
	w := httptest.NewRecorder()
	h.Proposal(w, jsonReq("POST", "/api/v1/ai/proposal", body))
	var res proposalResponse
	_ = json.Unmarshal(w.Body.Bytes(), &res)
	return w.Code, res
}

// Заметка с экрана менеджера: отопление, с 23 по 28 число, четыре человека.
func TestProposal_FromManagerNote(t *testing.T) {
	h := NewAiHandler(&config.Config{})
	code, res := proposalCall(t, h, map[string]string{
		"service": "Другое", "city": "Астана", "client": "Арман",
		"text": "Монтаж отопительной системы. Ребята уже начали работу с 23 числа до 28 числа 11 месяца, работать будет у нас там четыре человека, площадь 180 м2",
	})
	if code != http.StatusOK {
		t.Fatalf("код %d", code)
	}
	if res.Source != "local" || !strings.Contains(res.SourceLabel, "ИИ не подключён") {
		t.Fatalf("источник расчёта: %q %q", res.Source, res.SourceLabel)
	}
	if len(res.Works) == 0 || len(res.Materials) == 0 {
		t.Fatalf("нет работ или материалов: %+v", res)
	}
	if res.Labor.Crew != 4 || res.Labor.Days != 6 || res.Labor.ManHours <= 0 {
		t.Fatalf("люди и сроки из заметки не учтены: %+v", res.Labor)
	}
	sum := 0.0
	for _, l := range append(append(res.Works, res.Materials...), res.Equipment...) {
		if l.Qty <= 0 || l.Price <= 0 || l.Sum != l.Qty*l.Price && l.Sum <= 0 {
			t.Fatalf("строка без количества или цены: %+v", l)
		}
		sum += l.Sum
	}
	tot := res.Totals
	if sum != tot["works"]+tot["materials"]+tot["equipment"] || tot["total"] != sum+tot["contingency"] || tot["totalWithVat"] != tot["total"]+tot["vat"] {
		t.Fatalf("итоги не сходятся: строки %.0f, итоги %v", sum, tot)
	}
	for _, want := range []string{"КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ", "Заказчик: Арман", "Трудозатраты", "ИТОГО с НДС"} {
		if !strings.Contains(res.Text, want) {
			t.Fatalf("в тексте КП нет «%s»:\n%s", want, res.Text)
		}
	}
	if _, ok := services.GetPriceDBService().GetByCode("work_plumb_radiator_install", ""); !ok {
		// база цен не загружена (запасной набор) — отопление считает сметчик; своя карта проверяется с PRICE_DB_PATH
		if !strings.Contains(strings.Join(res.Assumptions, " "), "площадь, м²: 180") {
			t.Fatalf("не сказано, что площадь взята из заметки: %v", res.Assumptions)
		}
		return
	}
	if !strings.Contains(strings.Join(res.Assumptions, " "), "по площади 180 м²") {
		t.Fatalf("не сказано, что площадь взята из заметки: %v", res.Assumptions)
	}
	// отопление считается своей картой: радиаторы, трубы отопления, котёл — а не канализация
	names := ""
	for _, l := range append(res.Works, res.Materials...) {
		names += strings.ToLower(l.Name) + "; "
	}
	for _, want := range []string{"радиатор", "труб отопления", "котёл", "опрессовка"} {
		if !strings.Contains(names, want) {
			t.Fatalf("в КП по отоплению нет «%s»: %s", want, names)
		}
	}
	if strings.Contains(names, "канализац") || strings.Contains(names, "смесител") {
		t.Fatalf("в КП по отоплению попала сантехника: %s", names)
	}
	if res.Works[0].Qty != 15 { // 180 м² / 12 = 15 радиаторов
		t.Fatalf("радиаторов %v, ждали 15", res.Works[0].Qty)
	}
}

func TestProposal_FactsFromText(t *testing.T) {
	cases := []struct {
		text, category string
		dim            string
		val            float64
		people, days   int
	}{
		{"Электромонтаж в офисе, 60 точек, 3 человека, 5 дней", "электромонтаж", "points", 60, 3, 5},
		{"Нужна кровля из профлиста 240 кв.м, бригада двое рабочих", "кровля", "area", 240, 2, 0},
		{"Копаем траншею 45 метров под водопровод", "наружные сети", "length", 45, 0, 0},
		{"Залить фундамент, бетона 36 м3", "фундамент", "volume", 36, 0, 0},
		{"Рельсы установка", "металлоконструкции", "", 0, 0, 0},
		{"Водяной тёплый пол 90 м2 в доме", "тёплый пол", "area", 90, 0, 0},
		{"Поменять батареи в квартире", "отопление", "", 0, 0, 0},
	}
	for _, c := range cases {
		f := parseProposalFacts(c.text)
		if f.Category != c.category || f.People != c.people || f.Days != c.days || (c.dim != "" && f.Dimensions[c.dim] != c.val) {
			t.Errorf("%q → %+v, ждали %s %s=%v люди=%d дни=%d", c.text, f, c.category, c.dim, c.val, c.people, c.days)
		}
	}
}

func TestProposal_NoVolumesIsSaidHonestly(t *testing.T) {
	h := NewAiHandler(&config.Config{})
	code, res := proposalCall(t, h, map[string]string{"service": "Установка септика", "text": "клиент просит побыстрее"})
	if code != http.StatusOK || !strings.Contains(strings.Join(res.Assumptions, " "), "Объёмы в заметке не указаны") {
		t.Fatalf("код %d, допущения %v", code, res.Assumptions)
	}
	if code, _ := proposalCall(t, h, map[string]string{"text": "  "}); code != http.StatusBadRequest {
		t.Fatalf("пустую заметку приняли: %d", code)
	}
}

// С ключом ИИ: модель разбирает заметку, цены всё равно считает сметчик; сбой ИИ не ломает расчёт.
func TestProposal_AIExtractsFacts(t *testing.T) {
	answer := `{"category":"кровля","dimensions":{"area":300,"points":-5},"people":6,"days":0}`
	status := http.StatusOK
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Header.Get("Authorization") != "Bearer test-key" {
			t.Errorf("ключ не передан")
		}
		w.WriteHeader(status)
		_ = json.NewEncoder(w).Encode(map[string]interface{}{"choices": []map[string]interface{}{{"message": map[string]string{"content": answer}}}})
	}))
	defer srv.Close()
	t.Setenv("OPENAI_BASE_URL", srv.URL)
	h := NewAiHandler(&config.Config{OpenAIKey: "test-key"})
	body := map[string]string{"service": "Другое", "text": "перекрыть крышу склада, примерно три сотни квадратов, шестеро человек, 10 дней"}

	code, res := proposalCall(t, h, body)
	if code != http.StatusOK || res.Source != "ai" || res.Labor.Crew != 6 || res.Labor.Days != 10 {
		t.Fatalf("разбор ИИ не применён: %d %s %+v", code, res.Source, res.Labor)
	}
	if !strings.Contains(strings.Join(res.Assumptions, " "), "площадь, м²: 300") || strings.Contains(strings.Join(res.Assumptions, " "), "точек") {
		t.Fatalf("объёмы от ИИ: %v", res.Assumptions)
	}

	answer = `{"category":"что-то своё","dimensions":{}}` // непонятный ответ → расчёт по словам
	if _, res = proposalCall(t, h, body); res.Source != "local" {
		t.Fatalf("непонятный ответ ИИ приняли: %s", res.Source)
	}
	status = http.StatusInternalServerError // ИИ недоступен → расчёт по словам
	if code, res = proposalCall(t, h, body); code != http.StatusOK || res.Source != "local" || len(res.Works) == 0 {
		t.Fatalf("сбой ИИ сломал расчёт: %d %s", code, res.Source)
	}
}
