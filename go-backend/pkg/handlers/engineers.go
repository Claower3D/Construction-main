package handlers

import (
	"encoding/json"
	"net/http"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

type EngineersHandler struct{}

func NewEngineersHandler() *EngineersHandler {
	return &EngineersHandler{}
}

func (h *EngineersHandler) GetEngineers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	engineers, err := database.GetAllEngineers()
	if err != nil {
		engineers = []*models.Engineer{}
	}
	_ = json.NewEncoder(w).Encode(engineers)
}

func (h *EngineersHandler) AssignEngineer(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		OrderID    int64  `json:"orderId"`
		EngineerID string `json:"engineerId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.OrderID == 0 || req.EngineerID == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите orderId и engineerId"})
		return
	}
	if err := database.AssignEngineer(req.OrderID, req.EngineerID); err != nil {
		w.WriteHeader(http.StatusNotFound)
		msg := "Заказ не найден"
		if err.Error() == "engineer not found" {
			msg = "Инженер не найден"
		}
		_ = json.NewEncoder(w).Encode(map[string]string{"error": msg})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Инженер технадзора успешно назначен на объект",
		"orderId":    req.OrderID,
		"engineerId": req.EngineerID,
		"status":     "Назначен",
	})
}
