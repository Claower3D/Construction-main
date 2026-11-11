package handlers

import (
	"net/http"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"strings"
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

// SPAHandler отдаёт собранный сайт из папки dist.
//
//   - index.html (и любой адрес страницы сайта) — «Cache-Control: no-cache»: браузер каждый раз
//     сверяется с сервером и после обновления сразу получает новую версию;
//   - файлы сборки с хешем в имени — на год, «immutable»;
//   - остальные картинки, шрифты и модели — на сутки;
//   - папки не показываются списком файлов;
//   - несуществующий файл со статическим расширением — 404.
func SPAHandler(dist string) http.HandlerFunc {
	files := http.FileServer(http.Dir(dist))
	index := filepath.Join(dist, "index.html")

	// ServeContent, а не ServeFile: тот отвечает редиректом на любой адрес, оканчивающийся на /index.html
	serveIndex := func(w http.ResponseWriter, r *http.Request) {
		f, err := os.Open(index)
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer f.Close()
		info, err := f.Stat()
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		http.ServeContent(w, r, "index.html", info.ModTime(), f)
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
			} else {
				w.Header().Set("Cache-Control", "public, max-age=86400")
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
