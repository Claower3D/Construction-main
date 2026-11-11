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
	// Споры разбирают администратор и менеджер. Раздел пока без формы подачи, поэтому остальным
	// отдаём пустой список: раньше любой вошедший пользователь получал все споры платформы.
	if _, role := currentUser(r); !isStaff(role) {
		_ = json.NewEncoder(w).Encode([]*models.Dispute{})
		return
	}
	items, err := database.GetAllDisputes()
	if err != nil || items == nil {
		items = []*models.Dispute{}
	}
	_ = json.NewEncoder(w).Encode(items)
}
