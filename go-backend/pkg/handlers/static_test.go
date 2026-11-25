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
	isIndex := func(w *httptest.ResponseRecorder) bool {
		return strings.Contains(w.Body.String(), "<title>QazGost</title>")
	}

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

// Два адреса сайта: qazgost.com получает английскую «шапку» страницы, qazgost.kz — русскую;
// обе версии ссылаются друг на друга, прочие адреса получают файл без изменений.
func TestSPAHandlerLanguageByHost(t *testing.T) {
	dist := t.TempDir()
	page := "<!DOCTYPE html>\n<html lang=\"ru\">\n  <head>\n    <meta name=\"description\" content=\"QazGost AI — сметы по фото.\" />\n    <title>QazGost AI — сметы</title>\n  </head>\n  <body><div id=\"root\"></div></body>\n</html>\n"
	if err := os.WriteFile(filepath.Join(dist, "index.html"), []byte(page), 0o644); err != nil {
		t.Fatal(err)
	}
	h := SPAHandler(dist)
	get := func(host, url string, hdr ...string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		r := httptest.NewRequest("GET", url, nil)
		r.Host = host
		for i := 0; i+1 < len(hdr); i += 2 {
			r.Header.Set(hdr[i], hdr[i+1])
		}
		h(w, r)
		return w
	}
	has := func(body string, parts ...string) string {
		for _, p := range parts {
			if !strings.Contains(body, p) {
				return p
			}
		}
		return ""
	}

	// английский адрес, с www и портом тоже
	for _, host := range []string{"qazgost.com", "www.qazgost.com", "QAZGOST.COM:443"} {
		w := get(host, "/catalog")
		body := w.Body.String()
		if miss := has(body, `<html lang="en">`, "<title>"+indexTitleEn+"</title>", `content="`+indexDescEn+`"`,
			`<link rel="canonical" href="https://qazgost.com/catalog" />`,
			`hreflang="ru" href="https://qazgost.kz/catalog"`, `hreflang="en" href="https://qazgost.com/catalog"`,
			`hreflang="x-default" href="https://qazgost.kz/catalog"`); miss != "" {
			t.Errorf("%s: в странице нет %q", host, miss)
		}
		if strings.Contains(body, "сметы") {
			t.Errorf("%s: в английской шапке остался русский текст", host)
		}
		if w.Header().Get("Content-Language") != "en" || w.Header().Get("Cache-Control") != "no-cache" {
			t.Errorf("%s: заголовки %v", host, w.Header())
		}
	}

	// русский адрес: текст не меняется, ссылки на обе версии есть
	w := get("qazgost.kz", "/")
	body := w.Body.String()
	if miss := has(body, `<html lang="ru">`, "<title>QazGost AI — сметы</title>", `<link rel="canonical" href="https://qazgost.kz/" />`,
		`hreflang="en" href="https://qazgost.com/"`); miss != "" {
		t.Errorf("qazgost.kz: в странице нет %q", miss)
	}
	if w.Header().Get("Content-Language") != "" {
		t.Errorf("qazgost.kz: лишний Content-Language")
	}

	// адрес за прокси, который передаёт исходный адрес отдельным заголовком
	if b := get("internal:8080", "/", "X-Forwarded-Host", "qazgost.com").Body.String(); !strings.Contains(b, `<html lang="en">`) {
		t.Errorf("X-Forwarded-Host: страница не английская")
	}

	// чужой адрес (технический адрес хостинга, похожее имя) — файл как есть
	for _, host := range []string{"construction-main-production.up.railway.app", "notqazgost.com", "qazgost.com.evil.example", "localhost:8080"} {
		if b := get(host, "/").Body.String(); b != page {
			t.Errorf("%s: страница изменена", host)
		}
	}

	// адрес страницы попадает в ссылки только экранированным
	b := get("qazgost.com", `/a"><script>alert(1)</script>`).Body.String()
	if strings.Contains(b, "<script>alert(1)") || strings.Contains(b, `/a">`) {
		t.Errorf("адрес страницы вставлен без экранирования: %s", b)
	}
	if b := get("qazgost.com", "/index.html").Body.String(); !strings.Contains(b, `href="https://qazgost.com/" />`) {
		t.Errorf("/index.html: ссылка должна вести на главную")
	}
}

// Настоящий index.html сайта содержит всё, что сервер подменяет для английского адреса.
func TestRealIndexHasLocalizableHead(t *testing.T) {
	data, err := os.ReadFile(filepath.Join("..", "..", "..", "frontend", "index.html"))
	if err != nil {
		t.Skip("frontend/index.html рядом нет — проверка пропущена")
	}
	out := string(localizeIndex(data, siteHostEn, "/"))
	for _, part := range []string{`<html lang="en">`, "<title>" + indexTitleEn + "</title>", indexDescEn, `hreflang="ru"`} {
		if !strings.Contains(out, part) {
			t.Errorf("в index.html не нашлось место для %q", part)
		}
	}
	if strings.Contains(out, "сметы") {
		t.Errorf("в английской шапке остался русский текст")
	}
}

// Приложение для Android скачивается с сайта: файл отдаётся как пакет Android и как загрузка.
func TestSPAHandlerServesAndroidApp(t *testing.T) {
	dist := t.TempDir()
	if err := os.MkdirAll(filepath.Join(dist, "downloads"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dist, "index.html"), []byte("<!doctype html><title>QazGost</title>"), 0o644); err != nil {
		t.Fatal(err)
	}
	apk := []byte("PK\x03\x04 apk body")
	if err := os.WriteFile(filepath.Join(dist, "downloads", "QazGost-1.1.apk"), apk, 0o644); err != nil {
		t.Fatal(err)
	}
	h := SPAHandler(dist)
	get := func(url string, hdr ...string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		r := httptest.NewRequest("GET", url, nil)
		for i := 0; i+1 < len(hdr); i += 2 {
			r.Header.Set(hdr[i], hdr[i+1])
		}
		h(w, r)
		return w
	}

	w := get("/downloads/QazGost-1.1.apk")
	if w.Code != http.StatusOK || w.Body.String() != string(apk) {
		t.Fatalf("файл приложения: код %d, тело %d байт", w.Code, w.Body.Len())
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/vnd.android.package-archive" {
		t.Errorf("Content-Type = %q", ct)
	}
	if cd := w.Header().Get("Content-Disposition"); cd != "attachment; filename=QazGost-1.1.apk" {
		t.Errorf("Content-Disposition = %q", cd)
	}
	if cc := w.Header().Get("Cache-Control"); cc != "public, max-age=86400" {
		t.Errorf("Cache-Control = %q", cc)
	}
	// докачка после обрыва связи: сервер отдаёт запрошенный кусок файла
	if part := get("/downloads/QazGost-1.1.apk", "Range", "bytes=0-1"); part.Code != http.StatusPartialContent || part.Body.String() != "PK" {
		t.Errorf("докачка: код %d, тело %q", part.Code, part.Body.String())
	}
	// файла старой или несуществующей версии нет — честный 404, а не страница сайта
	if miss := get("/downloads/QazGost-0.9.apk"); miss.Code != http.StatusNotFound {
		t.Errorf("несуществующий файл: код %d", miss.Code)
	}
	// список файлов папки не показывается
	if dir := get("/downloads/"); strings.Contains(dir.Body.String(), "QazGost-1.1.apk") {
		t.Errorf("папка downloads показана списком")
	}
}
