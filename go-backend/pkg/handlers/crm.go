package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

type CRMHandler struct{}

func NewCRMHandler() *CRMHandler {
	return &CRMHandler{}
}

// ── Companies ──

func (h *CRMHandler) GetCompanies(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	items, err := database.GetAllCompanies()
	if err != nil {
		items = []*models.Company{}
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"total": len(items), "items": items})
}

func (h *CRMHandler) CreateCompany(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req models.Company
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите название компании"})
		return
	}
	req.ID = fmt.Sprintf("comp_%d", time.Now().UnixNano())
	if req.Status == "" { req.Status = "active" }
	req.CreatedAt = time.Now()

	if err := database.CreateCompany(&req); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания компании"})
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(req)
}

// ── Brigades ──

func (h *CRMHandler) GetBrigades(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	items, err := database.GetAllBrigades()
	if err != nil {
		items = []*models.Brigade{}
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"total": len(items), "items": items})
}

func (h *CRMHandler) CreateBrigade(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req models.Brigade
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите название бригады"})
		return
	}
	req.ID = fmt.Sprintf("brig_%d", time.Now().UnixNano())
	if req.Status == "" { req.Status = "active" }
	req.CreatedAt = time.Now()

	if err := database.CreateBrigade(&req); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания бригады"})
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(req)
}

// ── Clients ──

func (h *CRMHandler) GetClients(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	items, err := database.GetAllClients()
	if err != nil {
		items = []*models.Client{}
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"total": len(items), "items": items})
}

func (h *CRMHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req models.Client
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Name == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите имя клиента"})
		return
	}
	req.ID = fmt.Sprintf("cli_%d", time.Now().UnixNano())
	if req.Status == "" { req.Status = "new" }
	req.CreatedAt = time.Now()

	if err := database.CreateClient(&req); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания клиента"})
		return
	}
	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(req)
}

// ── Dashboard ──

func (h *CRMHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	companies, _ := database.GetAllCompanies()
	brigades, _ := database.GetAllBrigades()
	clients, _ := database.GetAllClients()
	engineers, _ := database.GetAllEngineers()
	orders, _ := database.GetAllOrders()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"companies":  len(companies),
		"brigades":   len(brigades),
		"clients":    len(clients),
		"engineers":  len(engineers),
		"orders":     len(orders),
	})
}
