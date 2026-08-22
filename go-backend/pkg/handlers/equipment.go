package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

type EquipmentHandler struct{}

func NewEquipmentHandler() *EquipmentHandler {
	return &EquipmentHandler{}
}

func (h *EquipmentHandler) GetEquipment(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	items, err := database.GetAllEquipment()
	if err != nil {
		items = []*models.Equipment{}
	}

	category := strings.ToLower(r.URL.Query().Get("category"))
	city := strings.ToLower(r.URL.Query().Get("city"))
	query := strings.ToLower(r.URL.Query().Get("q"))

	if category != "" || city != "" || query != "" {
		filtered := make([]*models.Equipment, 0, len(items))
		for _, eq := range items {
			if category != "" && !strings.Contains(strings.ToLower(eq.Category), category) {
				continue
			}
			if city != "" && !strings.Contains(strings.ToLower(eq.City), city) {
				continue
			}
			if query != "" && !strings.Contains(strings.ToLower(eq.Name), query) {
				continue
			}
			filtered = append(filtered, eq)
		}
		items = filtered
	}

	_ = json.NewEncoder(w).Encode(items)
}

func (h *EquipmentHandler) CreateEquipment(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var eq models.Equipment
	if err := json.NewDecoder(r.Body).Decode(&eq); err != nil || eq.Name == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите название и категорию спецтехники"})
		return
	}

	if eq.ID == "" {
		eq.ID = fmt.Sprintf("eq_%d", time.Now().UnixNano())
	}
	if eq.Status == "" {
		eq.Status = "Доступен"
	}
	if eq.Rating == 0 {
		eq.Rating = 5.0
	}
	if eq.ReviewsCount == 0 {
		eq.ReviewsCount = 1
	}

	if err := database.AddEquipment(&eq); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка сохранения спецтехники"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":   "Спецтехника успешно зарегистрирована в маркетплейсе",
		"equipment": eq,
	})
}
