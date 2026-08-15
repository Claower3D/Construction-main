package handlers

import (
	"encoding/json"
	"net/http"
	"sync"

	"qazgost-ai/backend/pkg/models"
)

var (
	engineersMutex sync.RWMutex
	engineersStore = []*models.Engineer{
		{
			ID:             "eng_01",
			Name:           "Куаныш Жумагулов",
			Specialization: "Геология и основания (СП РК)",
			City:           "Астана",
			Experience:     "14 лет",
			Rating:         4.95,
			Certificate:    "ГСЛ №0049182 от 14.05.2018",
			Status:         "Доступен",
			ProjectsDone:   48,
		},
		{
			ID:             "eng_02",
			Name:           "Алексей Мельников",
			Specialization: "Геодезия и 3D-сканирование",
			City:           "Караганда",
			Experience:     "11 лет",
			Rating:         4.88,
			Certificate:    "ГСЛ №0081290 от 22.09.2020",
			Status:         "На выезде",
			ProjectsDone:   36,
		},
		{
			ID:             "eng_03",
			Name:           "Данияр Айтжанов",
			Specialization: "Испытание свай & CPT зондирование",
			City:           "Алматы",
			Experience:     "9 лет",
			Rating:         4.92,
			Certificate:    "ГСЛ №0093012 от 11.02.2021",
			Status:         "Доступен",
			ProjectsDone:   29,
		},
	}
)

type EngineersHandler struct{}

func NewEngineersHandler() *EngineersHandler {
	return &EngineersHandler{}
}

func (h *EngineersHandler) GetEngineers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	engineersMutex.RLock()
	defer engineersMutex.RUnlock()
	_ = json.NewEncoder(w).Encode(engineersStore)
}

func (h *EngineersHandler) AssignEngineer(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		OrderID    int64  `json:"orderId"`
		EngineerID string `json:"engineerId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверные параметры назначения"})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Инженер технадзора успешно назначен на объект",
		"orderId":    req.OrderID,
		"engineerId": req.EngineerID,
		"status":     "Назначен",
	})
}
