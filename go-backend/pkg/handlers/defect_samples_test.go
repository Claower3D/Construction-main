package handlers

import (
	"archive/zip"
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/database"
)

func TestDefectSamples(t *testing.T) {
	h := NewDefectSampleHandler()
	_, _ = database.DB.Exec(`DELETE FROM defect_samples WHERE user_id IN ('u_ds_a','u_ds_b')`)
	jpeg := append([]byte{0xFF, 0xD8, 0xFF, 0xE0}, bytes.Repeat([]byte{7}, 200)...)
	photo := "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString(jpeg)
	save := func(body map[string]interface{}, uid string) *httptest.ResponseRecorder {
		r := jsonReq("POST", "/api/v1/defect-samples", body)
		if uid != "" {
			r = asUser(r, uid, "engineer")
		}
		w := httptest.NewRecorder()
		h.Save(w, r)
		return w
	}
	zones := []map[string]interface{}{
		{"cls": 0, "x": 0.1, "y": 0.2, "w": 0.3, "h": 0.4, "origin": "manual"},
		{"cls": 4, "x": 0.8, "y": 0.8, "w": 0.5, "h": 0.5},   // выходит за край — обрезается
		{"cls": 9, "x": 0.1, "y": 0.1, "w": 0.2, "h": 0.2},   // неизвестный класс — отбрасывается
		{"cls": 2, "x": 0.5, "y": 0.5, "w": 0.001, "h": 0.2}, // вырожденная — отбрасывается
	}
	ok := map[string]interface{}{"photo": photo, "width": 640, "height": 480, "zones": zones, "source": "vision", "consent": true}
	if w := save(ok, ""); w.Code != http.StatusUnauthorized {
		t.Fatalf("guest must get 401, got %d", w.Code)
	}
	noConsent := map[string]interface{}{"photo": photo, "width": 640, "height": 480, "zones": zones}
	if w := save(noConsent, "u_ds_a"); w.Code != http.StatusBadRequest {
		t.Fatalf("without consent must be 400, got %d", w.Code)
	}
	txt := map[string]interface{}{"photo": "data:image/jpeg;base64," + base64.StdEncoding.EncodeToString([]byte("это текст")), "width": 640, "height": 480, "consent": true}
	if w := save(txt, "u_ds_a"); w.Code != http.StatusBadRequest {
		t.Fatalf("non-JPEG must be 400, got %d", w.Code)
	}
	w := save(ok, "u_ds_a")
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), `"zones":2`) || !strings.Contains(w.Body.String(), `"mine":1`) {
		t.Fatalf("save: %d %s", w.Code, w.Body.String())
	}
	// то же фото ещё раз (после правки зон) — пример не дублируется
	ok["zones"] = zones[:1]
	if w := save(ok, "u_ds_a"); !strings.Contains(w.Body.String(), `"zones":1`) || !strings.Contains(w.Body.String(), `"mine":1`) {
		t.Fatalf("resave must replace: %s", w.Body.String())
	}

	w = httptest.NewRecorder()
	h.Admin(w, asUser(httptest.NewRequest("GET", "/api/v1/admin/defect-samples", nil), "u_admin_t", "admin"))
	var st struct {
		Total int            `json:"total"`
		By    map[string]int `json:"zones_by_class"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &st)
	if w.Code != http.StatusOK || st.Total < 1 || st.By["crack"] < 1 {
		t.Fatalf("stats: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	h.Admin(w, asUser(httptest.NewRequest("GET", "/api/v1/admin/defect-samples/export", nil), "u_admin_t", "admin"))
	if w.Code != http.StatusOK || w.Header().Get("Content-Type") != "application/zip" {
		t.Fatalf("export: %d %s", w.Code, w.Header().Get("Content-Type"))
	}
	zr, err := zip.NewReader(bytes.NewReader(w.Body.Bytes()), int64(w.Body.Len()))
	if err != nil {
		t.Fatal(err)
	}
	var id, label string
	names := map[string]bool{}
	for _, f := range zr.File {
		names[f.Name] = true
		if strings.HasPrefix(f.Name, "labels/") {
			rc, _ := f.Open()
			b, _ := io.ReadAll(rc)
			rc.Close()
			if strings.HasPrefix(string(b), "0 0.250000 0.400000 0.300000 0.400000") {
				label = string(b)
				id = strings.TrimSuffix(strings.TrimPrefix(f.Name, "labels/"), ".txt")
			}
		}
	}
	if id == "" || !names["images/"+id+".jpg"] || !names["classes.txt"] || !names["README.txt"] {
		t.Fatalf("zip content wrong: %v label=%q", names, label)
	}

	w = httptest.NewRecorder()
	h.Admin(w, asUser(httptest.NewRequest("DELETE", "/api/v1/admin/defect-samples?id="+id, nil), "u_admin_t", "admin"))
	if w.Code != http.StatusOK {
		t.Fatalf("delete: %d", w.Code)
	}
}
