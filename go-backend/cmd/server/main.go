package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/handlers"
	"qazgost-ai/backend/pkg/middleware"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize PostgreSQL database (Railway provides DATABASE_URL)
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Println("[⚠️ WARNING] DATABASE_URL not set — running with offline/degraded database")
	}
	if err := database.InitDB(dbURL); err != nil {
		log.Printf("[⚠️ WARNING] Database connection not established: %v (server will continue running)", err)
	} else if database.DB != nil {
		defer database.DB.Close()
	}
	auth := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.AuthMiddleware(cfg.JwtSecret, next)
	}
	roleAdmin := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.RoleMiddleware(cfg.JwtSecret, []string{"admin", "manager"}, next)
	}
	// CRM is still reachable without a token because the web "linked accounts" and the
	// mobile apps do not have server JWTs yet (login flow left unchanged on request).
	// A valid token, when sent, is used for createdBy.
	optAuth := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.OptionalAuthMiddleware(cfg.JwtSecret, next)
	}
	// Public AI endpoints spend the server's OpenAI key / CPU — limit per client IP
	aiLimit := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.RateLimit(30, time.Minute, next)
	}

	// Initialize handlers
	healthHnd := handlers.NewHealthHandler()
	authHnd := handlers.NewAuthHandler(cfg)
	ordersHnd := handlers.NewOrdersHandler()
	engineersHnd := handlers.NewEngineersHandler()
	financeHnd := handlers.NewFinanceHandler()
	pricesHnd := handlers.NewPricesHandler()
	chatHnd := handlers.NewChatHandler()
	filesHnd := handlers.NewFilesHandler(cfg)
	equipmentHnd := handlers.NewEquipmentHandler()
	disputesHnd := handlers.NewDisputesHandler()
	aiHnd := handlers.NewAiHandler(cfg)
	exportHnd := handlers.NewExportHandler()
	crmHnd := handlers.NewCRMHandler()
	speechHnd := handlers.NewSpeechHandler()

	mux := http.NewServeMux()

	// ── PUBLIC ENDPOINTS (no auth required) ──
	mux.HandleFunc("/health", healthHnd.HealthCheck)
	mux.HandleFunc("/api", healthHnd.ApiStatus)
	mux.HandleFunc("/api/csrf-token", healthHnd.GetCsrfToken)
	mux.HandleFunc("/api/v1/auth/login", authHnd.Login)
	mux.HandleFunc("/api/v1/auth/register", authHnd.Register)
	mux.HandleFunc("/api/v1/auth/me", authHnd.GetMe) // self-validates token internally

	// Prices catalog — public read access
	mux.HandleFunc("/api/v1/prices", pricesHnd.GetPrices)
	mux.HandleFunc("/api/v1/prices/stats", pricesHnd.GetStats)
	mux.HandleFunc("/api/v1/prices/regions", pricesHnd.GetRegions)

	// Equipment marketplace — public GET (token optional: owner=me, phones), writes require auth
	mux.HandleFunc("/api/v1/equipment", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			optAuth(equipmentHnd.GetEquipment)(w, r)
		case http.MethodPost:
			auth(equipmentHnd.CreateEquipment)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/v1/equipment/", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			optAuth(equipmentHnd.EquipmentItem)(w, r)
			return
		}
		auth(equipmentHnd.EquipmentItem)(w, r)
	})
	mux.HandleFunc("/api/v1/equipment-bookings", auth(equipmentHnd.Bookings))
	mux.HandleFunc("/api/v1/equipment-bookings/", auth(equipmentHnd.Bookings))

	// Materials marketplace — supplier offers (reference prices stay in /api/v1/prices)
	materialsHnd := handlers.NewMaterialsHandler()
	materialsRoute := func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			optAuth(materialsHnd.Offers)(w, r)
			return
		}
		auth(materialsHnd.Offers)(w, r)
	}
	mux.HandleFunc("/api/v1/materials", materialsRoute)
	mux.HandleFunc("/api/v1/materials/", materialsRoute)
	mux.HandleFunc("/api/v1/disputes", auth(disputesHnd.GetDisputes))

	// Contractors catalog — public read (brigades + company contacts)
	mux.HandleFunc("/api/v1/contractors", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		crmHnd.GetContractors(w, r)
	})

	// ── PROTECTED ENDPOINTS (auth required) ──

	// Orders — auth required
	mux.HandleFunc("/api/v1/orders", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			auth(ordersHnd.GetOrders)(w, r)
		case http.MethodPost:
			auth(ordersHnd.CreateOrder)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/v1/orders/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut, http.MethodPatch:
			auth(ordersHnd.UpdateOrder)(w, r)
		case http.MethodDelete:
			auth(ordersHnd.DeleteOrder)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	// AI & QTO — Public estimation & defect inspection (accessible to all users & guests)
	mux.HandleFunc("/api/v1/ai/estimate", aiLimit(aiHnd.EstimateCost))
	mux.HandleFunc("/api/v1/ai/defect", aiLimit(aiHnd.InspectDefect))
	mux.HandleFunc("/api/v1/ai/vision", aiLimit(aiHnd.VisionProxy))
	mux.HandleFunc("/api/v1/ai/defect-vision", aiLimit(aiHnd.DefectVisionProxy))
	mux.HandleFunc("/api/v1/ai/validate-key", aiLimit(aiHnd.ValidateKey))
	mux.HandleFunc("/api/v1/ai/assistant", middleware.RateLimit(20, time.Minute, aiHnd.Assistant))

	// Phase 2: Engineering & LiDAR & defect detection — proxy to Python AI service
	mux.HandleFunc("/api/v1/engineering/", aiLimit(aiHnd.ProxyToAIService))
	mux.HandleFunc("/api/v1/lidar/", aiLimit(aiHnd.ProxyToAIService))
	mux.HandleFunc("/api/v1/defect-scan", aiLimit(aiHnd.ProxyToAIService))
	mux.HandleFunc("/api/v1/analyze", aiLimit(aiHnd.ProxyToAIService))
	mux.HandleFunc("/api/v1/prices/", aiHnd.ProxyToAIService)

	// Speech Recognition — public (for CRM voice input)
	mux.HandleFunc("/api/v1/speech/recognize", speechHnd.Recognize)

	// Export — auth required
	mux.HandleFunc("/api/v1/export/estimate.csv", auth(exportHnd.ExportEstimateCSV))

	// Engineers — auth required, assign = admin only
	mux.HandleFunc("/api/v1/engineers", auth(engineersHnd.GetEngineers))
	mux.HandleFunc("/api/v1/engineers/assign", roleAdmin(engineersHnd.AssignEngineer))

	// Finance — auth required
	mux.HandleFunc("/api/v1/finance/balance", auth(financeHnd.GetBalance))
	mux.HandleFunc("/api/v1/finance/topup", auth(financeHnd.Topup))
	mux.HandleFunc("/api/v1/finance/escrow/lock", auth(financeHnd.LockEscrow))
	mux.HandleFunc("/api/v1/finance/escrow/release", auth(financeHnd.ReleaseEscrow))
	mux.HandleFunc("/api/v1/finance/transactions", auth(financeHnd.GetTransactions))

	// Chat — auth required
	mux.HandleFunc("/api/v1/chat", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			auth(chatHnd.GetMessages)(w, r)
		case http.MethodPost:
			auth(chatHnd.SendMessage)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/v1/chat/stream", auth(chatHnd.StreamMessages))

	// File Upload — auth required
	mux.HandleFunc("/api/v1/files/upload", auth(filesHnd.UploadFile))

	// ── CRM MODULE — auth required ──
	mux.HandleFunc("/api/v1/crm/dashboard", auth(crmHnd.GetDashboard))

	mux.HandleFunc("/api/v1/crm/companies", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			auth(crmHnd.GetCompanies)(w, r)
		case http.MethodPost:
			auth(crmHnd.CreateCompany)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/v1/crm/brigades", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			auth(crmHnd.GetBrigades)(w, r)
		case http.MethodPost:
			auth(crmHnd.CreateBrigade)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	mux.HandleFunc("/api/v1/crm/clients", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			auth(crmHnd.GetClients)(w, r)
		case http.MethodPost:
			auth(crmHnd.CreateClient)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	// CRM Deals & Events Sync across all devices (both /api/v1 and /api aliases)
	crmEventsHandler := func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			optAuth(crmHnd.GetCRMEvents)(w, r)
		case http.MethodPost, http.MethodPut:
			optAuth(crmHnd.CreateOrUpdateCRMEvent)(w, r)
		case http.MethodDelete:
			optAuth(crmHnd.DeleteCRMEvent)(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}
	mux.HandleFunc("/api/v1/crm/events", crmEventsHandler)
	mux.HandleFunc("/api/crm/events", crmEventsHandler)

	crmSyncHandler := func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodPost {
			optAuth(crmHnd.BulkSyncCRMEvents)(w, r)
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	}
	mux.HandleFunc("/api/v1/crm/events/sync", crmSyncHandler)
	mux.HandleFunc("/api/crm/events/sync", crmSyncHandler)

	// Static Files (/uploads) — no directory listing, nosniff, sandbox CSP
	_ = os.MkdirAll(cfg.UploadDir, 0755)
	mux.Handle("/uploads/", handlers.UploadsServer(cfg.UploadDir))

	// Frontend SPA Fallback (if built dist exists)
	frontendDist, _ := filepath.Abs("./frontend/dist")
	if _, err := os.Stat(frontendDist); err == nil {
		spaHandler := http.FileServer(http.Dir(frontendDist))
		mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
			if strings.HasPrefix(r.URL.Path, "/api") || strings.HasPrefix(r.URL.Path, "/health") || strings.HasPrefix(r.URL.Path, "/uploads") {
				http.NotFound(w, r)
				return
			}
			path := filepath.Join(frontendDist, r.URL.Path)
			if _, err := os.Stat(path); os.IsNotExist(err) {
				http.ServeFile(w, r, filepath.Join(frontendDist, "index.html"))
				return
			}
			spaHandler.ServeHTTP(w, r)
		})
	}

	// Chain Middleware: Recovery -> Logger -> Security headers -> Body limit -> CORS (allowlist) -> DB guard
	handler := middleware.RecoveryMiddleware(
		middleware.LoggerMiddleware(
			middleware.SecurityHeadersMiddleware(
				middleware.BodyLimitMiddleware(55 << 20)(
					middleware.CorsMiddleware(cfg.CorsOrigins)(requireDB(mux)),
				),
			),
		),
	)

	banner := `
============================================================
   ⚡ QAZGOST AI - Ultra-Fast Golang Engine 3.1.0
============================================================
   ► Status      : ONLINE & SECURED
   ► Port        : %s
   ► Auth        : JWT HMAC-SHA256 + Password Hash
   ► CORS        : Allowlist (no wildcard *)
   ► RBAC        : AuthMiddleware on all sensitive routes
   ► Health Check: http://localhost:%s/health
   ► REST API    : http://localhost:%s/api/v1/auth/login
   ► PriceDB     : http://localhost:%s/api/v1/prices?q=бетон
============================================================
`
	fmt.Printf(banner, cfg.Port, cfg.Port, cfg.Port, cfg.Port)

	addr := fmt.Sprintf(":%s", cfg.Port)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

// dbFreePrefixes: endpoints that work without PostgreSQL (price catalog, AI, health)
var dbFreePrefixes = []string{
	"/health", "/api/csrf-token", "/api/v1/prices", "/api/v1/ai/", "/api/v1/engineering/",
	"/api/v1/lidar/", "/api/v1/defect-scan", "/api/v1/analyze", "/api/v1/speech/", "/uploads/",
}

// requireDB answers 503 instead of panicking (nil *sql.DB) when the server runs without a database
func requireDB(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if database.DB == nil && strings.HasPrefix(r.URL.Path, "/api") && r.URL.Path != "/api" {
			free := false
			for _, p := range dbFreePrefixes {
				if strings.HasPrefix(r.URL.Path, p) {
					free = true
					break
				}
			}
			if !free {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusServiceUnavailable)
				_, _ = w.Write([]byte(`{"error":"База данных недоступна: задайте DATABASE_URL (PostgreSQL)"}`))
				return
			}
		}
		next.ServeHTTP(w, r)
	})
}
