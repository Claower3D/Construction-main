package handlers

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

// Раздача сайта: кэш, 404 для пропавших файлов сборки, без списков папок.
func TestSPAHandler(t *testing.T) {
	dist := t.TempDir()
	write := func(rel, body string) {
		full := filepath.Join(dist, filepath.FromSlash(rel))
		if err := os.MkdirAll(filepath.Dir(full), 0o755); err != nil {
			t.Fatal(err)
		}
		if err := os.WriteFile(full, []byte(body), 0o644); err != nil {
			t.Fatal(err)
		}
	}
	write("index.html", "<!doctype html><title>QazGost</title>")
	write("assets/index-BOrSZAQL.js", "console.log(1)")
	write("assets/index-Dx3kP_9a.css", "body{}")
	write("assets/categories/cat_concrete.jpg", "jpg")
	write("models/crack-yolo26n.onnx", "onnx")
	write("favicon-64.png", "png")

	h := SPAHandler(dist)
	get := func(url string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		h(w, httptest.NewRequest("GET", url, nil))
		return w
	}
	isIndex := func(w *httptest.ResponseRecorder) bool { return strings.Contains(w.Body.String(), "<title>QazGost</title>") }

	// страницы сайта → приложение, без кэша
	for _, u := range []string{"/", "/index.html", "/login", "/customer/estimate", "/category/fundament", "/net-takoi-stranicy"} {
		w := get(u)
		if w.Code != http.StatusOK || !isIndex(w) || w.Header().Get("Cache-Control") != "no-cache" {
			t.Errorf("%s: код %d, index=%v, Cache-Control=%q", u, w.Code, isIndex(w), w.Header().Get("Cache-Control"))
		}
	}

	// файлы сборки с хешем → на год
	for _, u := range []string{"/assets/index-BOrSZAQL.js", "/assets/index-Dx3kP_9a.css"} {
		w := get(u)
		if w.Code != http.StatusOK || !strings.Contains(w.Header().Get("Cache-Control"), "immutable") {
			t.Errorf("%s: код %d, Cache-Control=%q", u, w.Code, w.Header().Get("Cache-Control"))
		}
	}

	// обычная статика → на сутки
	for _, u := range []string{"/assets/categories/cat_concrete.jpg", "/models/crack-yolo26n.onnx", "/favicon-64.png"} {
		w := get(u)
		if w.Code != http.StatusOK || w.Header().Get("Cache-Control") != "public, max-age=86400" {
			t.Errorf("%s: код %d, Cache-Control=%q", u, w.Code, w.Header().Get("Cache-Control"))
		}
	}

	// пропавший файл сборки → 404, а не страница сайта (иначе после обновления — пустой экран)
	for _, u := range []string{"/assets/Old-AbCd1234.js", "/assets/old.css", "/images/none.png", "/missing.onnx", "/assets/categories/none.jpg"} {
		w := get(u)
		if w.Code != http.StatusNotFound || isIndex(w) {
			t.Errorf("%s: ожидался 404, получен %d (index=%v)", u, w.Code, isIndex(w))
		}
	}

	// папки не показываются списком файлов
	for _, u := range []string{"/assets/", "/assets", "/assets/categories/", "/models/"} {
		w := get(u)
		if strings.Contains(w.Body.String(), "index-BOrSZAQL.js") || strings.Contains(w.Body.String(), "cat_concrete.jpg") || strings.Contains(w.Body.String(), "crack-yolo26n.onnx") {
			t.Errorf("%s: отдан список файлов папки", u)
		}
	}

	// API, health и загрузки этот обработчик не обслуживает
	for _, u := range []string{"/api/v1/unknown", "/health/x", "/uploads/x.png"} {
		if w := get(u); w.Code != http.StatusNotFound || isIndex(w) {
			t.Errorf("%s: ожидался 404, получен %d", u, w.Code)
		}
	}

	// выход за пределы папки сайта
	if w := get("/../../etc/passwd"); strings.Contains(w.Body.String(), "root:") {
		t.Error("отдан файл вне папки сайта")
	}
}
