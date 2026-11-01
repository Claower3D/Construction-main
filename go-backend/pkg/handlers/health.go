package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"runtime"
	"time"

	"qazgost-ai/backend/pkg/database"
)

type HealthHandler struct {
	startTime time.Time
}

func NewHealthHandler() *HealthHandler {
	return &HealthHandler{startTime: time.Now()}
}

func (h *HealthHandler) HealthCheck(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// Check database
	// The DB error text is logged, not returned: it may contain host names / connection details
	dbStatus := "ok"
	dbTables := 0
	httpStatus := http.StatusOK
	overall := "ok"
	if database.DB != nil {
		if err := database.DB.Ping(); err != nil {
			log.Printf("[health] database ping failed: %v", err)
			dbStatus = "error"
		} else {
			dbTables = database.CountTables()
		}
	} else {
		dbStatus = "not initialized"
	}
	if dbStatus != "ok" {
		// 503 lets Railway's healthcheck restart the service instead of keeping
		// a backend that answers 500 to every login / order request.
		httpStatus = http.StatusServiceUnavailable
		overall = "degraded"
	}

	// Memory stats
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	w.WriteHeader(httpStatus)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"status":     overall,
		"version":    "3.3.0",
		"engine":     "Go " + runtime.Version() + " High-Performance Server",
		"uptime":     time.Since(h.startTime).String(),
		"uptimeSec":  int(time.Since(h.startTime).Seconds()),
		"database":   dbStatus,
		"dbTables":   dbTables,
		"goroutines": runtime.NumGoroutine(),
		"memoryMB":   int(mem.Alloc / 1024 / 1024),
		"gcCycles":   mem.NumGC,
		"os":         runtime.GOOS,
		"arch":       runtime.GOARCH,
		"cpus":       runtime.NumCPU(),
	})
}

func (h *HealthHandler) ApiStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var userCount, orderCount int
	if database.DB != nil {
		database.DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
		database.DB.QueryRow("SELECT COUNT(*) FROM orders").Scan(&orderCount)
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"name":        "QAZGOST AI Construction Platform",
		"version":     "3.3.0",
		"status":      "running",
		"performance": "sub-millisecond latency",
		"storage":     "PostgreSQL",
		"auth":        "JWT HMAC-SHA256",
		"users":       userCount,
		"orders":      orderCount,
		"endpoints":   30,
		"modules":     []string{"Auth", "Orders", "Finance", "Chat", "AI/QTO", "CRM", "Engineers", "Equipment", "PriceDB"},
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

