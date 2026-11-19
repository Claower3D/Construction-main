package handlers

import (
	"archive/zip"
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"reflect"
	"strings"
	"testing"
)

func engPost(t *testing.T, path string, body interface{}) *httptest.ResponseRecorder {
	t.Helper()
	raw, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/engineering/"+path, bytes.NewReader(raw))
	rec := httptest.NewRecorder()
	Engineering(rec, req)
	return rec
}

// Ответы должны совпадать с исходным Python-калькулятором на эталонном наборе запросов
func TestEngineering_MatchesPythonReference(t *testing.T) {
	raw, err := os.ReadFile("testdata/engineering_golden.json")
	if err != nil {
		t.Fatal(err)
	}
	var cases []struct {
		Path string                 `json:"path"`
		Req  map[string]interface{} `json:"req"`
		Res  interface{}            `json:"res"`
	}
	if err := json.Unmarshal(raw, &cases); err != nil {
		t.Fatal(err)
	}
	if len(cases) < 200 {
		t.Fatalf("эталонов слишком мало: %d", len(cases))
	}
	for i, c := range cases {
		rec := engPost(t, c.Path, c.Req)
		if rec.Code != http.StatusOK {
			t.Fatalf("случай %d (%s %v): код %d, тело %s", i, c.Path, c.Req, rec.Code, rec.Body.String())
		}
		var got interface{}
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Fatal(err)
		}
		if !reflect.DeepEqual(got, c.Res) {
			g, _ := json.Marshal(got)
			w, _ := json.Marshal(c.Res)
			t.Fatalf("случай %d (%s %v):\nполучено %s\nожидалось %s", i, c.Path, c.Req, g, w)
		}
	}
}

func TestEngineering_Validation(t *testing.T) {
	bad := []struct {
		path string
		body map[string]interface{}
		want string
	}{
		{"full", map[string]interface{}{}, "area_m2"},
		{"full", map[string]interface{}{"area_m2": 0}, "area_m2"},
		{"full", map[string]interface{}{"area_m2": 50, "city": "Нарния"}, "Неизвестный город"},
		{"full", map[string]interface{}{"area_m2": 50, "systems": []string{}}, "Список систем пуст"},
		{"full", map[string]interface{}{"area_m2": 50, "systems": []string{"heating"}}, "Неподдерживаемые системы"},
		{"full", map[string]interface{}{"area_m2": 50, "pipe_type": "pipe_gold"}, "Неизвестный тип трубы"},
		{"full", map[string]interface{}{"area_m2": 50, "manholes": 1.5}, "manholes"},
		{"sewage", map[string]interface{}{"depth_m": 1}, "length_m"},
		{"water", map[string]interface{}{"points_count": 3}, "pipe_length_m"},
		{"electrical", map[string]interface{}{"area_m2": -1}, "area_m2"},
	}
	for _, c := range bad {
		rec := engPost(t, c.path, c.body)
		if rec.Code != http.StatusUnprocessableEntity {
			t.Fatalf("%s %v: код %d, нужен 422", c.path, c.body, rec.Code)
		}
		var out map[string]string
		_ = json.Unmarshal(rec.Body.Bytes(), &out)
		if !strings.Contains(out["detail"], c.want) || out["detail"] != out["error"] {
			t.Fatalf("%s %v: сообщение %q, ожидалось упоминание %q", c.path, c.body, out["detail"], c.want)
		}
	}
	rec := httptest.NewRecorder()
	Engineering(rec, httptest.NewRequest(http.MethodGet, "/api/v1/engineering/full", nil))
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("GET: код %d, нужен 405", rec.Code)
	}
	rec = httptest.NewRecorder()
	Engineering(rec, httptest.NewRequest(http.MethodPost, "/api/v1/engineering/solutions", strings.NewReader("{}")))
	if rec.Code != http.StatusNotFound {
		t.Fatalf("неизвестный расчёт: код %d, нужен 404", rec.Code)
	}
	rec = httptest.NewRecorder()
	Engineering(rec, httptest.NewRequest(http.MethodPost, "/api/v1/engineering/full", strings.NewReader("не json")))
	if rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("не JSON: код %d, нужен 422", rec.Code)
	}
}

func TestEngineering_Reports(t *testing.T) {
	body := map[string]interface{}{"area_m2": 120.5, "city": "усть-каменогорск"}
	rec := engPost(t, "report/excel", body)
	if rec.Code != http.StatusOK || !strings.Contains(rec.Header().Get("Content-Type"), "spreadsheetml") {
		t.Fatalf("excel: код %d, тип %s", rec.Code, rec.Header().Get("Content-Type"))
	}
	cd := rec.Header().Get("Content-Disposition")
	if !strings.Contains(cd, `filename="smeta_qazgost_ust-kamenogorsk_120_5m2.xlsx"`) || !strings.Contains(cd, "filename*=UTF-8''") {
		t.Fatalf("excel: имя файла %q", cd)
	}
	zr, err := zip.NewReader(bytes.NewReader(rec.Body.Bytes()), int64(rec.Body.Len()))
	if err != nil {
		t.Fatalf("excel не открывается как zip: %v", err)
	}
	var sheet string
	names := map[string]bool{}
	for _, f := range zr.File {
		names[f.Name] = true
		if f.Name == "xl/worksheets/sheet1.xml" {
			rc, _ := f.Open()
			b, _ := io.ReadAll(rc)
			rc.Close()
			sheet = string(b)
		}
	}
	for _, n := range []string{"[Content_Types].xml", "_rels/.rels", "xl/workbook.xml", "xl/styles.xml", "xl/worksheets/sheet1.xml"} {
		if !names[n] {
			t.Fatalf("excel: нет части %s", n)
		}
	}
	for _, want := range []string{"Усть-Каменогорск", "120.5 м²", "Канализация (СП РК 4.01-103-2013)", "ROUND(C8*E8,0)", "ИТОГО С НДС:", "НДС (16%):"} {
		if !strings.Contains(sheet, want) {
			t.Fatalf("excel: на листе нет %q", want)
		}
	}

	rec = engPost(t, "report/pdf", body)
	if rec.Code != http.StatusOK || rec.Header().Get("Content-Type") != "application/pdf" {
		t.Fatalf("pdf: код %d, тип %s", rec.Code, rec.Header().Get("Content-Type"))
	}
	if !bytes.HasPrefix(rec.Body.Bytes(), []byte("%PDF-")) || rec.Body.Len() < 5000 {
		t.Fatalf("pdf: не похоже на PDF (%d байт)", rec.Body.Len())
	}
	// отчёт по неверным параметрам — понятная ошибка, а не пустой файл
	if rec := engPost(t, "report/pdf", map[string]interface{}{"area_m2": -5}); rec.Code != http.StatusUnprocessableEntity {
		t.Fatalf("pdf с неверной площадью: код %d", rec.Code)
	}
}
