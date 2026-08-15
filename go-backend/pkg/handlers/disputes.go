package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"qazgost-ai/backend/pkg/models"
)

var defaultDisputes = []models.Dispute{
	{
		ID:        "disp_01",
		OrderID:   "101",
		Claimant:  "Иван Петров",
		Reason:    "Проверка качества уплотнения обратной засыпки",
		Status:    "На рассмотрении арбитра QazGost",
		CreatedAt: time.Now().Add(-12 * time.Hour),
	},
}

type DisputesHandler struct{}

func NewDisputesHandler() *DisputesHandler {
	return &DisputesHandler{}
}

func (h *DisputesHandler) GetDisputes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(defaultDisputes)
}
