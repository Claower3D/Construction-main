package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

type FinanceHandler struct{}

func NewFinanceHandler() *FinanceHandler {
	return &FinanceHandler{}
}

func (h *FinanceHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	userID := r.URL.Query().Get("userId")
	if userID == "" {
		userID = "u_customer_1"
	}

	bal, locked := database.GetBalance(userID)

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"userId":       userID,
		"balanceKzt":   bal,
		"availableKzt": bal - locked,
		"escrowLocked": locked,
		"currency":     "KZT",
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
		req.UserID = "u_customer_1"
	}
	if req.Method == "" {
		req.Method = "Freedom Pay"
	}

	database.UpdateBalance(req.UserID, req.Amount)
	newBal, _ := database.GetBalance(req.UserID)

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    req.UserID,
		Amount:    req.Amount,
		Type:      "deposit",
		Method:    req.Method,
		Status:    "Успешно",
		CreatedAt: time.Now(),
	}
	database.AddTransaction(tx)

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Баланс успешно пополнен",
		"newBalance":  newBal,
		"transaction": tx,
	})
}

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

	bal, locked := database.GetBalance(req.UserID)
	available := bal - locked

	if available < req.Amount {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Недостаточно доступных средств для блокировки эскроу"})
		return
	}

	database.UpdateEscrow(req.UserID, req.Amount)

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    req.UserID,
		Amount:    req.Amount,
		Type:      "escrow_lock",
		Method:    fmt.Sprintf("Эскроу: Заказ #%d (%s)", req.OrderID, req.Stage),
		Status:    "Заблокировано",
		CreatedAt: time.Now(),
	}
	database.AddTransaction(tx)

	_, newLocked := database.GetBalance(req.UserID)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":      "Средства успешно зарезервированы в эскроу",
		"escrowLocked": newLocked,
		"transaction":  tx,
	})
}

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

	database.UpdateBalance(req.FromUserID, -req.Amount)
	database.UpdateEscrow(req.FromUserID, -req.Amount)
	database.UpdateBalance(req.ToUserID, req.Amount)

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    req.FromUserID,
		Amount:    req.Amount,
		Type:      "payout",
		Method:    fmt.Sprintf("Выплата подрядчику за заказ #%d", req.OrderID),
		Status:    "Выплачено",
		CreatedAt: time.Now(),
	}
	database.AddTransaction(tx)

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Выплата подрядчику успешно завершена",
		"transaction": tx,
	})
}

func (h *FinanceHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	txs, err := database.GetTransactions()
	if err != nil {
		txs = []*models.Transaction{}
	}
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"total": len(txs),
		"items": txs,
	})
}
