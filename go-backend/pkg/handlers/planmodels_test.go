package handlers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"
)

func planBody(name string, walls int) map[string]interface{} {
	ws := make([]map[string]interface{}, 0, walls)
	for i := 0; i < walls; i++ {
		ws = append(ws, map[string]interface{}{"id": fmt.Sprintf("w%d", i), "ax": 0, "ay": float64(i), "bx": 5, "by": float64(i), "t": 0.2})
	}
	return map[string]interface{}{
		"area": 40.5,
		"data": map[string]interface{}{
			"name": name, "floorHeight": 3, "slab": 0.2, "groundSlab": true, "evil": "<script>",
			"floors": []map[string]interface{}{{
				"id": "f1", "name": "1 этаж", "walls": ws,
				"openings": []map[string]interface{}{{"id": "o1", "wallId": "w0", "type": "door", "at": 2, "w": 0.9, "h": 2.1, "sill": 0}},
			}},
		},
	}
}

func TestPlanModelsLifecycle(t *testing.T) {
	h := NewPlanModelsHandler()
	owner := fmt.Sprintf("u_eng_%d", time.Now().UnixNano())
	other := owner + "_other"
	call := func(method, path string, body interface{}, uid, role string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		var r *http.Request
		if body != nil {
			r = jsonReq(method, path, body)
		} else {
			r = httptest.NewRequest(method, path, nil)
		}
		if uid != "" {
			r = asUser(r, uid, role)
		}
		h.Models(w, r)
		return w
	}

	if w := call("GET", "/api/v1/plan-models", nil, "", ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("anonymous list must be 401, got %d", w.Code)
	}

	w := call("POST", "/api/v1/plan-models", planBody("Дом 10 × 8", 3), owner, "engineer")
	if w.Code != http.StatusCreated {
		t.Fatalf("create: %d %s", w.Code, w.Body.String())
	}
	var created struct {
		ID    string
		Name  string
		Walls int
		Area  float64
	}
	decode(t, w, &created)
	if created.ID == "" || created.Name != "Дом 10 × 8" || created.Walls != 3 || created.Area != 40.5 {
		t.Fatalf("unexpected create response: %+v", created)
	}
	path := "/api/v1/plan-models/" + created.ID

	// bad payloads
	for name, body := range map[string]map[string]interface{}{
		"no name":     planBody("  ", 1),
		"bad opening": {"data": map[string]interface{}{"name": "x", "floorHeight": 3, "slab": 0.2, "floors": []map[string]interface{}{{"walls": []map[string]interface{}{}, "openings": []map[string]interface{}{{"wallId": "nope", "type": "door", "at": 1, "w": 1, "h": 2, "sill": 0}}}}}},
		"no floors":   {"data": map[string]interface{}{"name": "x", "floorHeight": 3, "slab": 0.2, "floors": []map[string]interface{}{}}},
		"bad height":  {"data": map[string]interface{}{"name": "x", "floorHeight": 300, "slab": 0.2, "floors": []map[string]interface{}{{}}}},
	} {
		if w := call("POST", "/api/v1/plan-models", body, owner, "engineer"); w.Code != http.StatusBadRequest {
			t.Fatalf("%s must be rejected, got %d %s", name, w.Code, w.Body.String())
		}
	}

	// read back: unknown fields are dropped
	w = call("GET", path, nil, owner, "engineer")
	if w.Code != http.StatusOK {
		t.Fatalf("get: %d %s", w.Code, w.Body.String())
	}
	if body := w.Body.String(); strings.Contains(body, "evil") || !strings.Contains(body, `"wallId":"w0"`) {
		t.Fatalf("stored data must be the validated project only: %s", body)
	}

	// another user sees nothing
	if w := call("GET", path, nil, other, "engineer"); w.Code != http.StatusNotFound {
		t.Fatalf("foreign model must look missing, got %d", w.Code)
	}
	if w := call("PUT", path, planBody("Взлом", 1), other, "engineer"); w.Code != http.StatusNotFound {
		t.Fatalf("foreign update must look missing, got %d", w.Code)
	}
	if w := call("DELETE", path, nil, other, "engineer"); w.Code != http.StatusNotFound {
		t.Fatalf("foreign delete must look missing, got %d", w.Code)
	}
	w = call("GET", "/api/v1/plan-models", nil, other, "engineer")
	var list struct{ Items []struct{ ID string } }
	decode(t, w, &list)
	if len(list.Items) != 0 {
		t.Fatalf("other user's list must be empty, got %d", len(list.Items))
	}

	// staff may read but not overwrite
	if w := call("GET", path, nil, "u_admin_x", "admin"); w.Code != http.StatusOK {
		t.Fatalf("staff read: %d", w.Code)
	}
	if w := call("PUT", path, planBody("Правка", 1), "u_admin_x", "admin"); w.Code != http.StatusForbidden {
		t.Fatalf("staff update must be 403, got %d", w.Code)
	}

	// owner updates
	w = call("PUT", path, planBody("Дом 10 × 8, ред. 2", 5), owner, "engineer")
	if w.Code != http.StatusOK {
		t.Fatalf("update: %d %s", w.Code, w.Body.String())
	}
	w = call("GET", "/api/v1/plan-models", nil, owner, "engineer")
	var mine struct {
		Items []struct {
			ID    string
			Name  string
			Walls int
		}
	}
	decode(t, w, &mine)
	if len(mine.Items) != 1 || mine.Items[0].Name != "Дом 10 × 8, ред. 2" || mine.Items[0].Walls != 5 {
		t.Fatalf("list after update: %+v", mine.Items)
	}

	if w := call("DELETE", path, nil, owner, "engineer"); w.Code != http.StatusOK {
		t.Fatalf("delete: %d", w.Code)
	}
	if w := call("GET", path, nil, owner, "engineer"); w.Code != http.StatusNotFound {
		t.Fatalf("deleted model must be 404, got %d", w.Code)
	}
}
