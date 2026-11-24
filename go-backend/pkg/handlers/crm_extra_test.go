package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/database"
)

func crmCard(t *testing.T, id string) map[string]interface{} {
	t.Helper()
	items, err := database.GetAllCRMEvents()
	if err != nil {
		t.Fatal(err)
	}
	for _, it := range items {
		if string(it.ID) == id {
			b, _ := json.Marshal(it)
			var m map[string]interface{}
			_ = json.Unmarshal(b, &m)
			return m
		}
	}
	t.Fatalf("сделка %s не найдена", id)
	return nil
}

// Карточка сделки хранит на сервере все свои поля: даты работ и сдачи, мастеров, этапы.
func TestCRMEvent_KeepsCardFields(t *testing.T) {
	h := NewCRMHandler()
	const id = "extra_t1"
	t.Cleanup(func() { _, _ = database.DeleteCRMEvent(id) })
	save := func(body map[string]interface{}) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		h.CreateOrUpdateCRMEvent(w, asUser(jsonReq("POST", "/api/v1/crm/events", body), "u_mgr_t", "manager"))
		return w
	}
	w := save(map[string]interface{}{
		"id": id, "title": "Рельсы", "date": "2026-11-23", "day": "2026-11-23",
		"dateEnd": "2026-11-28", "workStart": "2026-11-23", "workEnd": "2026-11-28", "handoverDate": "2026-11-30",
		"assignedWorkers":   "Мастер Владимир, Мастер Данил",
		"assignedWorkerIds": []string{"u1", "u2"},
		"stages":            []map[string]interface{}{{"id": "STG-1", "name": "Монтаж", "start": "2026-11-23", "end": "2026-11-28", "progress": 40}},
	})
	if w.Code != http.StatusOK {
		t.Fatalf("сохранение: %d %s", w.Code, w.Body.String())
	}
	var resp map[string]interface{}
	_ = json.Unmarshal(w.Body.Bytes(), &resp)
	if resp["workEnd"] != "2026-11-28" {
		t.Fatalf("ответ сервера без дополнительных полей: %s", w.Body.String())
	}
	c := crmCard(t, id)
	if c["dateEnd"] != "2026-11-28" || c["handoverDate"] != "2026-11-30" || c["assignedWorkers"] != "Мастер Владимир, Мастер Данил" {
		t.Fatalf("поля не сохранились: %v", c)
	}
	if st, ok := c["stages"].([]interface{}); !ok || len(st) != 1 || st[0].(map[string]interface{})["end"] != "2026-11-28" {
		t.Fatalf("этапы не сохранились: %v", c["stages"])
	}
	if _, has := c["day"]; has {
		t.Fatal("служебное поле day попало в карточку")
	}

	// старое приложение сохраняет сделку без новых полей — они остаются
	if w := save(map[string]interface{}{"id": id, "title": "Рельсы", "date": "2026-11-24", "status": "В работе"}); w.Code != http.StatusOK {
		t.Fatalf("повторное сохранение: %d", w.Code)
	}
	c = crmCard(t, id)
	if c["date"] != "2026-11-24" || c["status"] != "В работе" || c["workEnd"] != "2026-11-28" || c["assignedWorkers"] == nil {
		t.Fatalf("после сохранения старым приложением поля потерялись: %v", c)
	}

	// новое значение заменяет старое, пустое — очищает
	save(map[string]interface{}{"id": id, "title": "Рельсы", "date": "2026-11-24", "workEnd": "2026-12-05", "handoverDate": ""})
	c = crmCard(t, id)
	if c["workEnd"] != "2026-12-05" || c["handoverDate"] != "" || c["workStart"] != "2026-11-23" {
		t.Fatalf("обновление полей: %v", c)
	}
}

// Слишком тяжёлое поле (например, фото внутри карточки) не сохраняется, но сама сделка — сохраняется.
func TestCRMEvent_DropsHugeFieldKeepsDeal(t *testing.T) {
	h := NewCRMHandler()
	const id = "extra_big"
	t.Cleanup(func() { _, _ = database.DeleteCRMEvent(id) })
	w := httptest.NewRecorder()
	h.CreateOrUpdateCRMEvent(w, asUser(jsonReq("POST", "/api/v1/crm/events", map[string]interface{}{
		"id": id, "title": "t", "date": "2026-11-05", "blob": strings.Repeat("x", 500000), "workEnd": "2026-11-09",
	}), "u_mgr_t", "manager"))
	if w.Code != http.StatusOK {
		t.Fatalf("сделка с тяжёлым полем не сохранилась: %d", w.Code)
	}
	c := crmCard(t, id)
	if _, has := c["blob"]; has || c["workEnd"] != "2026-11-09" {
		t.Fatalf("тяжёлое поле сохранено или потеряно обычное: workEnd=%v blob=%v", c["workEnd"], has)
	}
}
