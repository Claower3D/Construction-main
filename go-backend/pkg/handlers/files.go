package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"qazgost-ai/backend/pkg/config"
)

type FilesHandler struct {
	cfg *config.Config
}

func NewFilesHandler(cfg *config.Config) *FilesHandler {
	return &FilesHandler{cfg: cfg}
}

func (h *FilesHandler) UploadFile(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// 10 MB max file size
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		w.WriteHeader(http.StatusBadRequest)
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

	uploadDir := h.cfg.UploadDir
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания директории для загрузки"})
		return
	}

	ext := filepath.Ext(header.Filename)
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

	fileURL := fmt.Sprintf("/uploads/%s", newFileName)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Файл успешно загружен",
		"filename": newFileName,
		"original": header.Filename,
		"url":      fileURL,
		"size":     header.Size,
	})
}
