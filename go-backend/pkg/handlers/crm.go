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
		"companies": len(companies),
		"brigades":  len(brigades),
		"clients":   len(clients),
		"engineers": len(engineers),
		"orders":    len(orders),
	})
}

// ── CRM Events & Calendar Multi-Device Synchronization ──

func (h *CRMHandler) GetCRMEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	items, err := database.GetAllCRMEvents()
	if err != nil {
		items = []*models.CRMEvent{}
	}

	// Group by Date for fast calendar consumption
	grouped := make(map[string][]*models.CRMEvent)
	for _, item := range items {
		if item.Date != "" {
			grouped[item.Date] = append(grouped[item.Date], item)
		}
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"total":   len(items),
		"items":   items,
		"grouped": grouped,
	})
}

func (h *CRMHandler) CreateOrUpdateCRMEvent(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req models.CRMEvent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Title == "" || req.Date == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите название и дату заявки"})
		return
	}

	if req.ID == "" {
		req.ID = fmt.Sprintf("evt_%d", time.Now().UnixNano())
	}
	if req.Status == "" {
		req.Status = "Новые"
	}
	req.UpdatedAt = time.Now()

	if err := database.SaveCRMEvent(&req); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка сохранения заявки в БД"})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(req)
}

func (h *CRMHandler) DeleteCRMEvent(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	id := r.URL.Query().Get("id")
	if id == "" {
		// Also support JSON body or path
		var req struct {
			ID string `json:"id"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		id = req.ID
	}
	if id == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите ID заявки"})
		return
	}

	if err := database.DeleteCRMEvent(id); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка удаления заявки"})
		return
	}

	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "deletedId": id})
}

func (h *CRMHandler) BulkSyncCRMEvents(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		Events map[string][]*models.CRMEvent `json:"events"`
		Items  []*models.CRMEvent            `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат данных"})
		return
	}

	var allToSync []*models.CRMEvent
	if len(req.Items) > 0 {
		allToSync = req.Items
	} else if len(req.Events) > 0 {
		for date, evts := range req.Events {
			for _, e := range evts {
				if e.Date == "" {
					e.Date = date
				}
				allToSync = append(allToSync, e)
			}
		}
	}

	if err := database.BulkSyncCRMEvents(allToSync); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка синхронизации"})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "syncedCount": len(allToSync)})
}
