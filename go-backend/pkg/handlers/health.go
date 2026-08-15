package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"time"
)

type HealthHandler struct {
	startTime time.Time
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{startTime: time.Now()}
}

func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      "ok",
		"engine":      "Go 1.26 High-Performance Server",
		"uptime":      time.Since(h.startTime).String(),
		"environment": "production",
		"database":    "QazGost Embedded Store",
	})
}

func (h *HealthHandler) ApiStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"name":        "QAZGOST AI Golang High-Speed Backend",
		"version":     "3.0.0",
		"status":      "running",
		"performance": "sub-millisecond latency",
	})
}

func (h *HealthHandler) GetCsrfToken(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	bytes := make([]byte, 16)
	_, _ = rand.Read(bytes)
	token := hex.EncodeToString(bytes)

	http.SetCookie(w, &http.Cookie{
		Name:     "_csrf",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
		MaxAge:   86400,
	})

	_ = json.NewEncoder(w).Encode(map[string]string{
		"csrfToken": token,
	})
}
