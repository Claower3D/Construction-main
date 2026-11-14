package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/database"
)

func TestUserData_PerUserStore(t *testing.T) {
	h := NewUserDataHandler()
	_, _ = database.DB.Exec(`DELETE FROM user_data WHERE user_id IN ('u_ud_a','u_ud_b')`)
	do := func(method, path, body, uid string) *httptest.ResponseRecorder {
		r := httptest.NewRequest(method, path, strings.NewReader(body))
		if uid != "" {
			r = asUser(r, uid, "engineer")
		}
		w := httptest.NewRecorder()
		h.Serve(w, r)
		return w
	}
	if w := do("GET", "/api/v1/me/data", "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("guest must get 401, got %d", w.Code)
	}
	if w := do("PUT", "/api/v1/me/data/qazgost_calendar_events", `{"value":"{\"2026-11-14\":[1]}"}`, "u_ud_a"); w.Code != http.StatusOK {
		t.Fatalf("put: %d %s", w.Code, w.Body.String())
	}
	w := do("GET", "/api/v1/me/data/qazgost_calendar_events", "", "u_ud_a")
	var got struct {
		Value     string `json:"value"`
		UpdatedAt int64  `json:"updatedAt"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &got)
	if w.Code != http.StatusOK || got.Value != `{"2026-11-14":[1]}` || got.UpdatedAt == 0 {
		t.Fatalf("get: %d %s", w.Code, w.Body.String())
	}
	if w := do("GET", "/api/v1/me/data/qazgost_calendar_events", "", "u_ud_b"); w.Code != http.StatusNotFound {
		t.Fatalf("another user must not see the data, got %d", w.Code)
	}
	if w := do("GET", "/api/v1/me/data", "", "u_ud_a"); !strings.Contains(w.Body.String(), `"qazgost_calendar_events"`) {
		t.Fatalf("list: %s", w.Body.String())
	}
	if w := do("PUT", "/api/v1/me/data/bad%20key!", `{"value":"x"}`, "u_ud_a"); w.Code != http.StatusBadRequest {
		t.Fatalf("bad key must be 400, got %d", w.Code)
	}
	big := `{"value":"` + strings.Repeat("x", userDataMaxValue+1) + `"}`
	if w := do("PUT", "/api/v1/me/data/big", big, "u_ud_a"); w.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("too large must be 413, got %d", w.Code)
	}
	if w := do("DELETE", "/api/v1/me/data/qazgost_calendar_events", "", "u_ud_a"); w.Code != http.StatusOK {
		t.Fatalf("delete: %d", w.Code)
	}
	if w := do("GET", "/api/v1/me/data/qazgost_calendar_events", "", "u_ud_a"); w.Code != http.StatusNotFound {
		t.Fatalf("deleted key must be 404, got %d", w.Code)
	}
}
