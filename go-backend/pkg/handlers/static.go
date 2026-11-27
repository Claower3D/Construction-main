package handlers

import (
	"bytes"
	"html"
	"mime"
	"net"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// hashedAsset — файлы сборки Vite: в имени есть хеш содержимого (index-BOrSZAQL.js), поэтому
// под одним именем содержимое не меняется никогда и браузер может хранить файл год.
var hashedAsset = regexp.MustCompile(`^/assets/[^/]+-[A-Za-z0-9_-]{8,}\.(js|css|woff2?|ttf|wasm|onnx|png|jpe?g|webp|svg|gif)$`)

// staticExt — расширения файлов. Запрос такого файла, которого нет на диске, получает 404,
// а не страницу сайта: иначе браузер после обновления сайта получал HTML вместо старого
// скрипта и показывал пустой экран.
var staticExt = map[string]bool{
	".js": true, ".mjs": true, ".css": true, ".map": true, ".json": true, ".txt": true, ".xml": true,
	".png": true, ".jpg": true, ".jpeg": true, ".webp": true, ".svg": true, ".gif": true, ".ico": true, ".avif": true,
	".woff": true, ".woff2": true, ".ttf": true, ".otf": true, ".wasm": true, ".onnx": true,
	".mp4": true, ".webm": true, ".mp3": true, ".pdf": true, ".glb": true, ".usdz": true, ".apk": true, ".zip": true,
}

// У сайта два адреса: qazgost.kz — русская версия, qazgost.com — английская. Интерфейс переводит
// сам сайт в браузере (frontend/src/i18n), а здесь под адрес подстраивается «шапка» страницы —
// язык, заголовок вкладки и описание, — чтобы поисковики и предпросмотр ссылок видели нужный язык
// ещё до запуска скриптов. Обе версии ссылаются друг на друга (hreflang).
const (
	siteHostRu = "qazgost.kz"
	siteHostEn = "qazgost.com"

	indexTitleEn = "QazGost AI — estimates and defect inspection under Kazakhstan standards"
	indexDescEn  = "QazGost AI — estimates from photos, defect checks and a contractor catalog under Kazakhstan standards."
)

var (
	indexLangRe  = regexp.MustCompile(`<html lang="ru">`)
	indexTitleRe = regexp.MustCompile(`<title>[^<]*</title>`)
	indexDescRe  = regexp.MustCompile(`<meta name="description" content="[^"]*"\s*/?>`)
	indexHeadEnd = regexp.MustCompile(`</head>`)
)

// siteHost возвращает "qazgost.kz" или "qazgost.com", если запрос пришёл на один из адресов сайта
// (с www или без), иначе пустую строку.
func siteHost(r *http.Request) string {
	for _, raw := range []string{r.Host, r.Header.Get("X-Forwarded-Host")} {
		h := strings.ToLower(strings.TrimSpace(strings.Split(raw, ",")[0]))
		if name, _, err := net.SplitHostPort(h); err == nil {
			h = name
		}
		h = strings.TrimPrefix(strings.TrimSuffix(h, "."), "www.")
		if h == siteHostRu || h == siteHostEn {
			return h
		}
	}
	return ""
}

// localizeIndex готовит index.html под адрес сайта: для qazgost.com — английские язык, заголовок
// и описание; для обоих адресов — ссылки на вторую языковую версию той же страницы.
func localizeIndex(page []byte, host, urlPath string) []byte {
	if host == "" {
		return page
	}
	if host == siteHostEn {
		page = indexLangRe.ReplaceAllLiteral(page, []byte(`<html lang="en">`))
		page = indexTitleRe.ReplaceAllLiteral(page, []byte("<title>"+indexTitleEn+"</title>"))
		page = indexDescRe.ReplaceAllLiteral(page, []byte(`<meta name="description" content="`+indexDescEn+`" />`))
	}
	p := html.EscapeString(path.Clean("/" + urlPath))
	if p == "/index.html" {
		p = "/"
	}
	links := "  <link rel=\"canonical\" href=\"https://" + host + p + "\" />\n" +
		"    <link rel=\"alternate\" hreflang=\"ru\" href=\"https://" + siteHostRu + p + "\" />\n" +
		"    <link rel=\"alternate\" hreflang=\"en\" href=\"https://" + siteHostEn + p + "\" />\n" +
		"    <link rel=\"alternate\" hreflang=\"x-default\" href=\"https://" + siteHostRu + p + "\" />\n  </head>"
	if loc := indexHeadEnd.FindIndex(page); loc != nil {
		out := make([]byte, 0, len(page)+len(links))
		out = append(out, page[:loc[0]]...)
		out = append(out, links...)
		out = append(out, page[loc[1]:]...)
		return out
	}
	return page
}

// SPAHandler отдаёт собранный сайт из папки dist.
//
//   - index.html (и любой адрес страницы сайта) — «Cache-Control: no-cache»: браузер каждый раз
//     сверяется с сервером и после обновления сразу получает новую версию;
//   - файлы сборки с хешем в имени — на год, «immutable»;
//   - остальные картинки, шрифты и модели — на сутки;
//   - файл приложения для Android (.apk) отдаётся как загрузка с типом пакета Android;
//   - папки не показываются списком файлов;
//   - несуществующий файл со статическим расширением — 404.
func SPAHandler(dist string) http.HandlerFunc {
	files := http.FileServer(http.Dir(dist))
	index := filepath.Join(dist, "index.html")

	// index.html читается с диска один раз и перечитывается, только если файл изменился
	var (
		mu      sync.Mutex
		cached  []byte
		modTime time.Time
	)
	loadIndex := func() ([]byte, time.Time, bool) {
		info, err := os.Stat(index)
		if err != nil || info.IsDir() {
			return nil, time.Time{}, false
		}
		mu.Lock()
		defer mu.Unlock()
		if cached == nil || !info.ModTime().Equal(modTime) {
			data, err := os.ReadFile(index)
			if err != nil {
				return nil, time.Time{}, false
			}
			cached, modTime = data, info.ModTime()
		}
		return cached, modTime, true
	}

	// ServeContent, а не ServeFile: тот отвечает редиректом на любой адрес, оканчивающийся на /index.html
	serveIndex := func(w http.ResponseWriter, r *http.Request) {
		page, mod, ok := loadIndex()
		if !ok {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		host := siteHost(r)
		if host == siteHostEn {
			w.Header().Set("Content-Language", "en")
		}
		http.ServeContent(w, r, "index.html", mod, bytes.NewReader(localizeIndex(page, host, r.URL.Path)))
	}

	return func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api") || strings.HasPrefix(r.URL.Path, "/health") || strings.HasPrefix(r.URL.Path, "/uploads") {
			http.NotFound(w, r)
			return
		}
		clean := path.Clean("/" + r.URL.Path)
		if clean == "/" || clean == "/index.html" {
			serveIndex(w, r)
			return
		}
		info, err := os.Stat(filepath.Join(dist, filepath.FromSlash(clean)))
		switch {
		case err == nil && !info.IsDir():
			if hashedAsset.MatchString(clean) {
				w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
			} else if strings.ToLower(path.Ext(clean)) == ".html" {
				// отдельные страницы сборки (например, мост входа между доменами /sso.html) — всегда свежие
				w.Header().Set("Cache-Control", "no-cache")
			} else {
				w.Header().Set("Cache-Control", "public, max-age=86400")
			}
			if strings.ToLower(path.Ext(clean)) == ".apk" {
				// приложение для Android: телефон должен скачать файл и предложить установку,
				// а не пытаться открыть его как архив
				w.Header().Set("Content-Type", "application/vnd.android.package-archive")
				w.Header().Set("Content-Disposition", mime.FormatMediaType("attachment", map[string]string{"filename": path.Base(clean)}))
			}
			files.ServeHTTP(w, r)
		case staticExt[strings.ToLower(path.Ext(clean))] || strings.HasPrefix(clean, "/assets/"):
			// файла нет (или это папка со статикой) — честный 404 без кэширования
			w.Header().Set("Cache-Control", "no-store")
			http.NotFound(w, r)
		default:
			// адрес страницы сайта (/login, /customer/estimate…) или папка — отдаём приложение
			serveIndex(w, r)
		}
	}
}
