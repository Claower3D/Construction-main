package handlers

import (
	"encoding/json"
	"net/http"

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
	_ = json.NewEncoder(w).Encode(items)
}
