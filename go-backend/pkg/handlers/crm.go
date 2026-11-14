package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strings"
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
	if req.Status == "" {
		req.Status = "active"
	}
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
	if req.Status == "" {
		req.Status = "active"
	}
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
	if req.Status == "" {
		req.Status = "new"
	}
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
	v := newCRMViewer(r)
	if v.uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите, чтобы видеть заявки")
		return
	}
	w.Header().Set("Content-Type", "application/json")
	all, err := database.GetAllCRMEvents()
	if err != nil {
		all = []*models.CRMEvent{}
	}
	items := make([]*models.CRMEvent, 0, len(all))
	for _, e := range all {
		if v.canSee(e) {
			items = append(items, e)
		}
	}

	// Group by Date for fast calendar consumption
	grouped := make(map[string][]*models.CRMEvent)
	for _, item := range items {
		if item.Date != "" {
			grouped[string(item.Date)] = append(grouped[string(item.Date)], item)
		}
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"total":   len(items),
		"items":   items,
		"grouped": grouped,
	})
}

var (
	isoDateRe = regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	ruDateRe  = regexp.MustCompile(`^(\d{1,2})\.(\d{1,2})\.(\d{4})$`)
)

// normalizeCRMEvent trims fields, normalizes the date to YYYY-MM-DD and validates required fields.
func normalizeCRMEvent(e *models.CRMEvent, r *http.Request) error {
	e.ID = models.FlexString(strings.TrimSpace(string(e.ID)))
	e.Title = models.FlexString(strings.TrimSpace(string(e.Title)))
	d := strings.TrimSpace(string(e.Date))
	if len(d) > 10 && isoDateRe.MatchString(d[:10]) { // "2026-11-01T10:00:00Z" → "2026-11-01"
		d = d[:10]
	}
	if ruDateRe.MatchString(d) { // "01.11.2026" / "1.11.2026" → "2026-11-01"
		if t, err := time.Parse("2.1.2006", d); err == nil {
			d = t.Format("2006-01-02")
		}
	}
	if _, err := time.Parse("2006-01-02", d); err != nil {
		return fmt.Errorf("дата должна быть в формате ГГГГ-ММ-ДД")
	}
	e.Date = models.FlexString(d)
	if e.Title == "" {
		return fmt.Errorf("укажите название заявки")
	}
	if len([]rune(string(e.Title))) > 300 || len(e.Description) > 20000 || len(e.Notes) > 100000 {
		return fmt.Errorf("слишком длинные поля заявки")
	}
	if e.Status == "" {
		e.Status = "Новые"
	}
	if uid, _ := currentUser(r); uid != "" && e.CreatedBy == "" {
		e.CreatedBy = models.FlexString(uid)
	}
	e.UpdatedAt = time.Now()
	return nil
}

func (h *CRMHandler) CreateOrUpdateCRMEvent(w http.ResponseWriter, r *http.Request) {
	var req models.CRMEvent
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Неверный формат заявки")
		return
	}
	if err := normalizeCRMEvent(&req, r); err != nil {
		writeError(w, http.StatusBadRequest, "Ошибка: "+err.Error())
		return
	}
	if code, msg := newCRMViewer(r).checkWrite(&req); code != 0 {
		writeError(w, code, msg)
		return
	}
	if req.ID == "" {
		req.ID = models.FlexString(fmt.Sprintf("evt_%d", time.Now().UnixNano()))
	}

	if err := database.SaveCRMEvent(&req); err != nil {
		writeError(w, http.StatusInternalServerError, "Ошибка сохранения заявки в БД")
		return
	}
	writeJSON(w, http.StatusOK, req)
}

func (h *CRMHandler) DeleteCRMEvent(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.URL.Query().Get("id"))
	if id == "" {
		var req struct {
			ID models.FlexString `json:"id"`
		}
		_ = json.NewDecoder(r.Body).Decode(&req)
		id = strings.TrimSpace(string(req.ID))
	}
	if id == "" {
		writeError(w, http.StatusBadRequest, "Укажите ID заявки")
		return
	}

	v := newCRMViewer(r)
	if v.uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите, чтобы удалить заявку")
		return
	}
	createdBy, _, found, err := database.GetCRMEventOwner(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Ошибка удаления заявки")
		return
	}
	if !found {
		writeError(w, http.StatusNotFound, "Заявка не найдена")
		return
	}
	if !v.canDelete(createdBy) {
		writeError(w, http.StatusForbidden, "Удалить заявку может автор или менеджер")
		return
	}

	n, err := database.DeleteCRMEvent(id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Ошибка удаления заявки")
		return
	}
	if n == 0 {
		writeError(w, http.StatusNotFound, "Заявка не найдена")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "deletedId": id, "deleted": n})
}

func (h *CRMHandler) BulkSyncCRMEvents(w http.ResponseWriter, r *http.Request) {
	v := newCRMViewer(r)
	if v.uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите, чтобы синхронизировать заявки")
		return
	}
	var req struct {
		Events map[string][]*models.CRMEvent `json:"events"`
		Items  []*models.CRMEvent            `json:"items"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Неверный формат данных")
		return
	}

	var allToSync []*models.CRMEvent
	if len(req.Items) > 0 {
		allToSync = req.Items
	} else if len(req.Events) > 0 {
		for date, evts := range req.Events {
			for _, e := range evts {
				if e != nil && e.Date == "" {
					e.Date = models.FlexString(date)
				}
				allToSync = append(allToSync, e)
			}
		}
	}
	if len(allToSync) > 2000 {
		writeError(w, http.StatusRequestEntityTooLarge, "Не более 2000 заявок за один запрос")
		return
	}

	valid := make([]*models.CRMEvent, 0, len(allToSync))
	skipped := []string{}
	for _, e := range allToSync {
		if e == nil {
			continue
		}
		if err := normalizeCRMEvent(e, r); err != nil || e.ID == "" {
			skipped = append(skipped, string(e.ID))
			continue
		}
		if code, _ := v.checkWrite(e); code != 0 {
			skipped = append(skipped, string(e.ID))
			continue
		}
		valid = append(valid, e)
	}

	saved, err := database.BulkSyncCRMEvents(valid)
	if err != nil && saved == 0 && len(valid) > 0 {
		writeError(w, http.StatusInternalServerError, "Ошибка синхронизации")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"success": true, "syncedCount": saved, "skipped": skipped})
}

// GetContractors: public catalog of active brigades (GET /api/v1/contractors?city=&q=)
func (h *CRMHandler) GetContractors(w http.ResponseWriter, r *http.Request) {
	items, err := database.GetContractors()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Ошибка загрузки подрядчиков")
		return
	}
	city := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("city")))
	q := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("q")))
	out := items[:0]
	for _, c := range items {
		if city != "" && !strings.Contains(strings.ToLower(c.City), city) {
			continue
		}
		if q != "" {
			hay := strings.ToLower(c.Name + " " + c.CompanyName + " " + strings.Join(c.Skills, " ") + " " + c.CompanyType)
			if !strings.Contains(hay, q) {
				continue
			}
		}
		out = append(out, c)
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"total": len(out), "items": out})
}
