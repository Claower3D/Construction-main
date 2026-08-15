package handlers

import (
	"encoding/json"
	"net/http"

	"qazgost-ai/backend/pkg/models"
)

var defaultEquipment = []models.Equipment{
	{ID: "eq_1", Name: "Экскаватор JCB 3CX Super", Category: "Землеройная техника", PricePerDay: 85000, City: "Караганда", Status: "Доступен", Image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80"},
	{ID: "eq_2", Name: "Буровая установка УРБ-2А2", Category: "Буровое оборудование", PricePerDay: 140000, City: "Астана", Status: "Доступен", Image: "https://images.unsplash.com/photo-1541888087425-ce81dfc46928?auto=format&fit=crop&w=400&q=80"},
	{ID: "eq_3", Name: "Автокран XCMG 25 тонн", Category: "Грузоподъемная техника", PricePerDay: 110000, City: "Алматы", Status: "В аренде", Image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80"},
}

type EquipmentHandler struct{}

func NewEquipmentHandler() *EquipmentHandler {
	return &EquipmentHandler{}
}

func (h *EquipmentHandler) GetEquipment(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(defaultEquipment)
}
