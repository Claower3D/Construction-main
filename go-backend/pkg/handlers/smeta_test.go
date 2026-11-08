package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSmetaCalcHTTP(t *testing.T) {
	h := NewSmetaHandler()

	body := `{"category":"wall_finish","geometry":{"area":20,"perimeter":18,"height":2.7,"doors":1,"windows":1},"city":"Алматы","mode":"detailed"}`
	rr := httptest.NewRecorder()
	h.Calc(rr, httptest.NewRequest(http.MethodPost, "/api/v1/estimate/calc", strings.NewReader(body)))
	if rr.Code != http.StatusOK {
		t.Fatalf("status %d: %s", rr.Code, rr.Body.String())
	}
	var res struct {
		Geometry struct {
			WallArea float64 `json:"wallArea"`
		} `json:"geometry"`
		Scenarios []struct {
			ID       string  `json:"id"`
			Subtotal float64 `json:"subtotal"`
			Items    []struct {
				Key    string  `json:"key"`
				Total  float64 `json:"total"`
				Source string  `json:"source"`
			} `json:"items"`
		} `json:"scenarios"`
		Audit *struct {
			Checks []struct{ Level, Text string } `json:"checks"`
		} `json:"audit"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatal(err)
	}
	if res.Geometry.WallArea != 44.46 {
		t.Fatalf("wallArea %v", res.Geometry.WallArea)
	}
	if len(res.Scenarios) != 3 || res.Audit == nil || len(res.Audit.Checks) == 0 {
		t.Fatalf("ответ неполный: %s", rr.Body.String())
	}
	for _, sc := range res.Scenarios {
		var sum float64
		for _, it := range sc.Items {
			sum += it.Total
			if it.Source == "" {
				t.Errorf("%s: строка %s без источника", sc.ID, it.Key)
			}
		}
		if sum != sc.Subtotal {
			t.Errorf("%s: сумма строк %v ≠ %v", sc.ID, sum, sc.Subtotal)
		}
	}

	// ошибки ввода → 400 с понятным текстом
	for _, bad := range []string{`{`, `{"category":"floors","geometry":{"area":0,"perimeter":0}}`, `{"category":"x","geometry":{"area":10,"perimeter":13}}`} {
		rr := httptest.NewRecorder()
		h.Calc(rr, httptest.NewRequest(http.MethodPost, "/api/v1/estimate/calc", strings.NewReader(bad)))
		if rr.Code != http.StatusBadRequest {
			t.Errorf("%s → %d, ждём 400", bad, rr.Code)
		}
	}
	rr = httptest.NewRecorder()
	h.Calc(rr, httptest.NewRequest(http.MethodGet, "/api/v1/estimate/calc", nil))
	if rr.Code != http.StatusMethodNotAllowed {
		t.Errorf("GET → %d", rr.Code)
	}
}

func TestSmetaTechMapsHTTP(t *testing.T) {
	rr := httptest.NewRecorder()
	NewSmetaHandler().TechMaps(rr, httptest.NewRequest(http.MethodGet, "/api/v1/estimate/techmaps", nil))
	if rr.Code != http.StatusOK {
		t.Fatalf("status %d", rr.Code)
	}
	var res struct {
		TechMaps  []struct{ ID string } `json:"techmaps"`
		Complexes []struct{ ID string } `json:"complexes"`
		Regions   map[string]float64    `json:"regions"`
	}
	if err := json.Unmarshal(rr.Body.Bytes(), &res); err != nil {
		t.Fatal(err)
	}
	if len(res.TechMaps) != 29 || len(res.Complexes) != 6 || res.Regions["Алматы"] != 1 {
		t.Fatalf("техкарт %d, комплексов %d, регионы %v", len(res.TechMaps), len(res.Complexes), res.Regions)
	}
}
