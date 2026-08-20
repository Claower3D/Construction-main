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
		"u_admin_1":    2500000.0,
		"u_customer_1": 1500000.0,
		"u_eng_1":      480000.0,
		"u_exec_1":     320000.0,
	}
	escrowLocks = map[string]float64{
		"u_customer_1": 500000.0,
	}
	transactionsStore = []*models.Transaction{
		{
			ID:        "tx_01",
			UserID:    "u_customer_1",
			Amount:    500000.0,
			Type:      "deposit",
			Method:    "Freedom Pay / Kaspi",
			Status:    "Успешно",
			CreatedAt: time.Now().Add(-48 * time.Hour),
		},
		{
			ID:        "tx_02",
			UserID:    "u_customer_1",
			Amount:    500000.0,
			Type:      "escrow_lock",
			Method:    "Гарантийный счет (Этап 1)",
			Status:    "Заблокировано",
			CreatedAt: time.Now().Add(-24 * time.Hour),
		},
	}
)

type FinanceHandler struct{}

func NewFinanceHandler() *FinanceHandler {
	return &FinanceHandler{}
}

// GetBalance returns wallet balance & escrow status
func (h *FinanceHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "u_customer_1"
	}

	financeMutex.RLock()
	bal, exists := userBalances[userID]
	if !exists {
		bal = 100000.0
		userBalances[userID] = bal
	}
	locked := escrowLocks[userID]
	financeMutex.RUnlock()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"userId":       userID,
		"balanceKzt":   bal,
		"availableKzt": bal - locked,
		"escrowLocked": locked,
		"currency":     "KZT",
	})
}

// Topup adds funds to the wallet
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
		req.UserID = "u_customer_1"
	}
	if req.Method == "" {
		req.Method = "Freedom Pay"
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
		"message":     "Баланс успешно пополнен",
		"newBalance":  newBal,
		"transaction": tx,
	})
}

// LockEscrow locks milestone funds in Escrow
func (h *FinanceHandler) LockEscrow(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		UserID  string  `json:"userId"`
		OrderID int64   `json:"orderId"`
		Amount  float64 `json:"amount"`
		Stage   string  `json:"stage"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Некорректная сумма для эскроу"})
		return
	}

	if req.UserID == "" {
		req.UserID = "u_customer_1"
	}

	financeMutex.Lock()
	defer financeMutex.Unlock()

	bal := userBalances[req.UserID]
	locked := escrowLocks[req.UserID]
	available := bal - locked

	if available < req.Amount {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Недостаточно доступных средств для блокировки эскроу"})
		return
	}

	escrowLocks[req.UserID] += req.Amount

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    req.UserID,
		Amount:    req.Amount,
		Type:      "escrow_lock",
		Method:    fmt.Sprintf("Эскроу: Заказ #%d (%s)", req.OrderID, req.Stage),
		Status:    "Заблокировано",
		CreatedAt: time.Now(),
	}
	transactionsStore = append([]*models.Transaction{tx}, transactionsStore...)

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      "Средства успешно зарезервированы в эскроу",
		"escrowLocked": escrowLocks[req.UserID],
		"transaction":  tx,
	})
}

// ReleaseEscrow releases locked milestone funds to contractor upon acceptance
func (h *FinanceHandler) ReleaseEscrow(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		FromUserID string  `json:"fromUserId"`
		ToUserID   string  `json:"toUserId"`
		Amount     float64 `json:"amount"`
		OrderID    int64   `json:"orderId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Amount <= 0 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Некорректные параметры выплаты"})
		return
	}

	if req.FromUserID == "" {
		req.FromUserID = "u_customer_1"
	}
	if req.ToUserID == "" {
		req.ToUserID = "u_exec_1"
	}

	financeMutex.Lock()
	defer financeMutex.Unlock()

	userBalances[req.FromUserID] -= req.Amount
	escrowLocks[req.FromUserID] -= req.Amount
	if escrowLocks[req.FromUserID] < 0 {
		escrowLocks[req.FromUserID] = 0
	}

	userBalances[req.ToUserID] += req.Amount

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    req.FromUserID,
		Amount:    req.Amount,
		Type:      "payout",
		Method:    fmt.Sprintf("Выплата подрядчику за заказ #%d", req.OrderID),
		Status:    "Выплачено",
		CreatedAt: time.Now(),
	}
	transactionsStore = append([]*models.Transaction{tx}, transactionsStore...)

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Выплата подрядчику успешно завершена",
		"transaction": tx,
	})
}

// GetTransactions returns financial ledger
func (h *FinanceHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	financeMutex.RLock()
	defer financeMutex.RUnlock()

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"total": len(transactionsStore),
		"items": transactionsStore,
	})
}
