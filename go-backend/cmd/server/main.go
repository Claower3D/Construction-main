package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/handlers"
	"qazgost-ai/backend/pkg/middleware"
)

func main() {
	cfg := config.LoadConfig()

	// Initialize SQLite database
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "./data/qazgost.db"
	}
	_ = os.MkdirAll(filepath.Dir(dbPath), 0755)
	if err := database.InitDB(dbPath); err != nil {
		log.Fatalf("[FATAL] Database init failed: %v", err)
	}
	defer database.DB.Close()
	auth := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.AuthMiddleware(cfg.JwtSecret, next)
	}
	roleAdmin := func(next http.HandlerFunc) http.HandlerFunc {
		return middleware.RoleMiddleware(cfg.JwtSecret, []string{"admin", "manager"}, next)
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

	// Equipment & Disputes — auth required
	mux.HandleFunc("/api/v1/equipment", auth(equipmentHnd.GetEquipment))
	mux.HandleFunc("/api/v1/disputes", auth(disputesHnd.GetDisputes))

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

	// AI & QTO — auth required
	mux.HandleFunc("/api/v1/ai/estimate", auth(aiHnd.EstimateCost))
	mux.HandleFunc("/api/v1/ai/defect", auth(aiHnd.InspectDefect))

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

	// Static Files (/uploads)
	_ = os.MkdirAll(cfg.UploadDir, 0755)
	fileServer := http.FileServer(http.Dir(cfg.UploadDir))
	mux.Handle("/uploads/", http.StripPrefix("/uploads/", fileServer))

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

	// Chain Middleware: Recovery -> Logger -> CORS (allowlist)
	handler := middleware.RecoveryMiddleware(
		middleware.LoggerMiddleware(
			middleware.CorsMiddleware(cfg.CorsOrigins)(mux),
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
