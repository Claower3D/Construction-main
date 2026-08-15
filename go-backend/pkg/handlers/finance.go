package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"qazgost-ai/backend/pkg/models"
)

var (
	financeMutex sync.RWMutex
	userBalances = map[string]float64{
		"u_admin_1": 1250000.0,
		"u_eng_1":   480000.0,
	}
	transactionsStore = []*models.Transaction{
		{
			ID:        "tx_01",
			UserID:    "u_admin_1",
			Amount:    250000.0,
			Type:      "deposit",
			Method:    "Kaspi Pay",
			Status:    "Успешно",
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
	}
)

type FinanceHandler struct{}

func NewFinanceHandler() *FinanceHandler {
	return &FinanceHandler{}
}

func (h *FinanceHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "u_admin_1"
	}

	financeMutex.RLock()
	bal, exists := userBalances[userID]
	if !exists {
		bal = 100000.0
	}
	financeMutex.RUnlock()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"userId":      userID,
		"balanceKzt":  bal,
		"currency":    "KZT",
		"escrowLocked": 0.0,
	})
}

func (h *FinanceHandler) Topup(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		UserID string  `json:"userId"`
		Amount float64 `json:"amount"`
		Method string  `json:"method"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите корректную сумму пополнения"})
		return
	}

	if req.UserID == "" {
		req.UserID = "u_admin_1"
	}
	if req.Method == "" {
		req.Method = "Kaspi Pay"
	}

	financeMutex.Lock()
	userBalances[req.UserID] += req.Amount
	newBal := userBalances[req.UserID]

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    req.UserID,
		Amount:    req.Amount,
		Type:      "deposit",
		Method:    req.Method,
		Status:    "Успешно",
		CreatedAt: time.Now(),
	}
	transactionsStore = append([]*models.Transaction{tx}, transactionsStore...)
	financeMutex.Unlock()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Баланс успешно пополнен",
		"newBalance": newBal,
		"transaction": tx,
	})
}
