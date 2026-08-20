package handlers

import (
	"encoding/json"
	"net/http"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

type DisputesHandler struct{}

func NewDisputesHandler() *DisputesHandler {
	return &DisputesHandler{}
}

func (h *DisputesHandler) GetDisputes(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	items, err := database.GetAllDisputes()
	if err != nil || items == nil {
		items = []*models.Dispute{}
	}
	_ = json.NewEncoder(w).Encode(items)
}
