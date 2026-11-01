package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/config"
)

type FilesHandler struct {
	cfg *config.Config
}

func NewFilesHandler(cfg *config.Config) *FilesHandler {
	return &FilesHandler{cfg: cfg}
}

// allowedUploadExt: photos, documents and point clouds. HTML/SVG/JS/executables are rejected —
// uploads are served from the same origin as the SPA, so an .html upload was a stored XSS.
var allowedUploadExt = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true, ".heic": true,
	".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true, ".csv": true, ".txt": true,
	".las": true, ".laz": true, ".ply": true, ".pcd": true, ".xyz": true, ".zip": true,
}

var imageExt = map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true, ".heic": true}

func (h *FilesHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	r.Body = http.MaxBytesReader(w, r.Body, 11<<20)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		w.WriteHeader(http.StatusRequestEntityTooLarge)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Превышен максимальный размер файла (10 МБ)"})
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Файл не передан в запросе"})
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(header.Filename))
	if !allowedUploadExt[ext] {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Недопустимый тип файла: разрешены фото, PDF, Office, CSV/TXT и облака точек"})
		return
	}
	// Images must really be images (sniff the first 512 bytes)
	if imageExt[ext] && ext != ".heic" {
		head := make([]byte, 512)
		n, _ := io.ReadFull(file, head)
		if !strings.HasPrefix(http.DetectContentType(head[:n]), "image/") {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Файл не является изображением"})
			return
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}
	}

	uploadDir := h.cfg.UploadDir
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания директории для загрузки"})
		return
	}

	newFileName := fmt.Sprintf("upload_%d%s", time.Now().UnixNano(), ext)
	dstPath := filepath.Join(uploadDir, newFileName)

	dst, err := os.Create(dstPath)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка сохранения файла на сервере"})
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка записи файла"})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Файл успешно загружен",
		"filename": newFileName,
		"original": header.Filename,
		"url":      "/uploads/" + newFileName,
		"size":     header.Size,
	})
}

// UploadsServer serves uploaded files safely: no directory listing, nosniff,
// a sandboxing CSP, and non-image files are forced to download.
func UploadsServer(dir string) http.Handler {
	fs := http.StripPrefix("/uploads/", http.FileServer(http.Dir(dir)))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		name := strings.TrimPrefix(r.URL.Path, "/uploads/")
		if name == "" || strings.HasSuffix(name, "/") || strings.Contains(name, "..") {
			http.NotFound(w, r)
			return
		}
		if fi, err := os.Stat(filepath.Join(dir, filepath.FromSlash(name))); err != nil || fi.IsDir() {
			http.NotFound(w, r)
			return
		}
		ext := strings.ToLower(filepath.Ext(name))
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox")
		if !imageExt[ext] && ext != ".pdf" {
			w.Header().Set("Content-Disposition", "attachment")
		}
		fs.ServeHTTP(w, r)
	})
}
