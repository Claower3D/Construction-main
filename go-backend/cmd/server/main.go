package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/handlers"
	"qazgost-ai/backend/pkg/middleware"
)

func main() {
	cfg := config.LoadConfig()

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

	mux := http.NewServeMux()

	// System & Health Endpoints
	mux.HandleFunc("/health", healthHnd.HealthCheck)
	mux.HandleFunc("/api", healthHnd.ApiStatus)
	mux.HandleFunc("/api/csrf-token", healthHnd.GetCsrfToken)

	// Auth Routes
	mux.HandleFunc("/api/v1/auth/login", authHnd.Login)
	mux.HandleFunc("/api/v1/auth/register", authHnd.Register)
	mux.HandleFunc("/api/v1/auth/me", authHnd.GetMe)

	// Orders Routes
	mux.HandleFunc("/api/v1/orders", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			ordersHnd.GetOrders(w, r)
		case http.MethodPost:
			ordersHnd.CreateOrder(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/v1/orders/", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodPut, http.MethodPatch:
			ordersHnd.UpdateOrder(w, r)
		case http.MethodDelete:
			ordersHnd.DeleteOrder(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})

	// AI & QTO Construction Routes
	mux.HandleFunc("/api/v1/ai/estimate", aiHnd.EstimateCost)
	mux.HandleFunc("/api/v1/ai/defect", aiHnd.InspectDefect)

	// Export Routes
	mux.HandleFunc("/api/v1/export/estimate.csv", exportHnd.ExportEstimateCSV)

	// Engineers Routes
	mux.HandleFunc("/api/v1/engineers", engineersHnd.GetEngineers)
	mux.HandleFunc("/api/v1/engineers/assign", engineersHnd.AssignEngineer)

	// Finance, Escrow & Wallet Routes
	mux.HandleFunc("/api/v1/finance/balance", financeHnd.GetBalance)
	mux.HandleFunc("/api/v1/finance/topup", financeHnd.Topup)
	mux.HandleFunc("/api/v1/finance/escrow/lock", financeHnd.LockEscrow)
	mux.HandleFunc("/api/v1/finance/escrow/release", financeHnd.ReleaseEscrow)
	mux.HandleFunc("/api/v1/finance/transactions", financeHnd.GetTransactions)

	// Prices & GESN/SNiP 24k Catalog Routes
	mux.HandleFunc("/api/v1/prices", pricesHnd.GetPrices)
	mux.HandleFunc("/api/v1/prices/stats", pricesHnd.GetStats)
	mux.HandleFunc("/api/v1/prices/regions", pricesHnd.GetRegions)

	// Chat & Messaging Routes (REST + SSE Streaming)
	mux.HandleFunc("/api/v1/chat", func(w http.ResponseWriter, r *http.Request) {
		switch r.Method {
		case http.MethodGet:
			chatHnd.GetMessages(w, r)
		case http.MethodPost:
			chatHnd.SendMessage(w, r)
		default:
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})
	mux.HandleFunc("/api/v1/chat/stream", chatHnd.StreamMessages)

	// File Upload Routes
	mux.HandleFunc("/api/v1/files/upload", filesHnd.UploadFile)

	// Equipment & Disputes Routes
	mux.HandleFunc("/api/v1/equipment", equipmentHnd.GetEquipment)
	mux.HandleFunc("/api/v1/disputes", disputesHnd.GetDisputes)

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

	// Chain Middleware: Recovery -> Logger -> CORS
	handler := middleware.RecoveryMiddleware(
		middleware.LoggerMiddleware(
			middleware.CorsMiddleware(mux),
		),
	)

	banner := `
============================================================
   ⚡ QAZGOST AI - Ultra-Fast Golang Engine 3.0.0
============================================================
   ► Status      : ONLINE & READY
   ► Port        : %s
   ► Mode        : High-Performance Concurrent Engine
   ► Health Check: http://localhost:%s/health
   ► REST API    : http://localhost:%s/api/v1/auth/login
   ► PriceDB     : http://localhost:%s/api/v1/prices?q=бетон
   ► QTO Estimator: http://localhost:%s/api/v1/ai/estimate
============================================================
`
	fmt.Printf(banner, cfg.Port, cfg.Port, cfg.Port, cfg.Port, cfg.Port)

	addr := fmt.Sprintf(":%s", cfg.Port)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
