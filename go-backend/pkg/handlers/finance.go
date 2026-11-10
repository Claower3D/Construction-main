package handlers

import (
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

// maxFinanceOperation caps a single top-up / escrow operation (KZT)
const maxFinanceOperation = 1_000_000_000

// PaymentsEnabled — приём денег через платформу. Пока нет договора с платёжным провайдером
// и его адаптера (страница оплаты + подписанный callback), пополнение, эскроу и выплаты выключены:
// раньше Topup зачислял любую сумму без оплаты, а новый кошелёк стартовал со 100 000 ₸.
// Перед включением Topup нужно заменить на создание платежа у провайдера и зачисление по callback.
// Внимание: хранить деньги пользователей на балансе платформы (электронные деньги) в РК можно
// только через банк-эмитента — согласуйте схему с провайдером и юристом.
var PaymentsEnabled = false

const paymentsDisabledMsg = "Онлайн-оплата пока не подключена: заявки оформляются без предоплаты, оплата — напрямую исполнителю"

func paymentsDisabled(w http.ResponseWriter) bool {
	if PaymentsEnabled {
		return false
	}
	writeJSON(w, http.StatusServiceUnavailable, map[string]interface{}{
		"error":           paymentsDisabledMsg,
		"paymentsEnabled": false,
	})
	return true
}

type FinanceHandler struct{}

// Config сообщает клиентам, подключена ли онлайн-оплата (публичный, без авторизации).
func (h *FinanceHandler) Config(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"paymentsEnabled": PaymentsEnabled,
		"provider":        "",
		"note":            paymentsDisabledMsg,
	})
}

func NewFinanceHandler() *FinanceHandler {
	return &FinanceHandler{}
}

// resolveTarget returns the user id an operation applies to.
// Regular users may act only on themselves; admin/manager may pass another userId.
func resolveTarget(r *http.Request, requested string) (string, bool) {
	uid, role := currentUser(r)
	if requested == "" || requested == uid {
		return uid, uid != ""
	}
	if isStaff(role) {
		return requested, true
	}
	return "", false
}

func validAmount(a float64) bool {
	return a > 0 && !math.IsNaN(a) && !math.IsInf(a, 0) && a <= maxFinanceOperation
}

func (h *FinanceHandler) GetBalance(w http.ResponseWriter, r *http.Request) {
	userID, ok := resolveTarget(r, r.URL.Query().Get("userId"))
	if !ok {
		writeError(w, http.StatusForbidden, "Нет доступа к чужому балансу")
		return
	}
	if !database.UserExists(userID) {
		writeError(w, http.StatusNotFound, "Пользователь не найден")
		return
	}

	bal, locked := database.GetBalance(userID)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"userId":       userID,
		"balanceKzt":   bal,
		"availableKzt": bal - locked,
		"escrowLocked": locked,
		"currency":     "KZT",
	})
}

// Topup credits the caller's own balance. Выключен (503), пока PaymentsEnabled == false:
// без платёжного провайдера это было бы зачисление денег без оплаты.
func (h *FinanceHandler) Topup(w http.ResponseWriter, r *http.Request) {
	if paymentsDisabled(w) {
		return
	}
	var req struct {
		UserID string  `json:"userId"`
		Amount float64 `json:"amount"`
		Method string  `json:"method"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !validAmount(req.Amount) {
		writeError(w, http.StatusBadRequest, "Укажите корректную сумму пополнения (от 1 до 1 000 000 000 ₸)")
		return
	}
	userID, ok := resolveTarget(r, req.UserID)
	if !ok {
		writeError(w, http.StatusForbidden, "Пополнять можно только свой баланс")
		return
	}
	if !database.UserExists(userID) {
		writeError(w, http.StatusNotFound, "Пользователь не найден")
		return
	}
	if req.Method == "" {
		req.Method = "Freedom Pay"
	}

	database.GetBalance(userID) // ensure row exists
	if err := database.UpdateBalance(userID, req.Amount); err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось пополнить баланс")
		return
	}
	newBal, _ := database.GetBalance(userID)

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    userID,
		Amount:    req.Amount,
		Type:      "deposit",
		Method:    req.Method,
		Status:    "Успешно",
		CreatedAt: time.Now(),
	}
	_ = database.AddTransaction(tx)

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":     "Баланс успешно пополнен",
		"newBalance":  newBal,
		"transaction": tx,
	})
}

func (h *FinanceHandler) LockEscrow(w http.ResponseWriter, r *http.Request) {
	if paymentsDisabled(w) {
		return
	}
	var req struct {
		UserID  string  `json:"userId"`
		OrderID int64   `json:"orderId"`
		Amount  float64 `json:"amount"`
		Stage   string  `json:"stage"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !validAmount(req.Amount) {
		writeError(w, http.StatusBadRequest, "Некорректная сумма для эскроу")
		return
	}
	userID, ok := resolveTarget(r, req.UserID)
	if !ok {
		writeError(w, http.StatusForbidden, "Блокировать можно только свои средства")
		return
	}

	locked, err := database.LockEscrowAtomic(userID, req.Amount)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Ошибка блокировки эскроу")
		return
	}
	if !locked {
		writeError(w, http.StatusBadRequest, "Недостаточно доступных средств для блокировки эскроу")
		return
	}

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    userID,
		Amount:    req.Amount,
		Type:      "escrow_lock",
		Method:    fmt.Sprintf("Эскроу: Заказ #%d (%s)", req.OrderID, req.Stage),
		Status:    "Заблокировано",
		CreatedAt: time.Now(),
	}
	_ = database.AddTransaction(tx)

	_, newLocked := database.GetBalance(userID)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":      "Средства успешно зарезервированы в эскроу",
		"escrowLocked": newLocked,
		"transaction":  tx,
	})
}

// ReleaseEscrow pays the contractor from the payer's escrow.
// Only the payer (or admin/manager) may release, and never more than is locked.
func (h *FinanceHandler) ReleaseEscrow(w http.ResponseWriter, r *http.Request) {
	if paymentsDisabled(w) {
		return
	}
	var req struct {
		FromUserID string  `json:"fromUserId"`
		ToUserID   string  `json:"toUserId"`
		Amount     float64 `json:"amount"`
		OrderID    int64   `json:"orderId"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !validAmount(req.Amount) {
		writeError(w, http.StatusBadRequest, "Некорректные параметры выплаты")
		return
	}
	fromID, ok := resolveTarget(r, req.FromUserID)
	if !ok {
		writeError(w, http.StatusForbidden, "Выплату из эскроу может сделать только плательщик или администратор")
		return
	}
	if req.ToUserID == "" || req.ToUserID == fromID || !database.UserExists(req.ToUserID) {
		writeError(w, http.StatusBadRequest, "Укажите существующего получателя выплаты (toUserId)")
		return
	}

	released, err := database.ReleaseEscrowAtomic(fromID, req.ToUserID, req.Amount)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Ошибка выплаты")
		return
	}
	if !released {
		writeError(w, http.StatusBadRequest, "Сумма выплаты больше заблокированной в эскроу")
		return
	}

	tx := &models.Transaction{
		ID:        fmt.Sprintf("tx_%d", time.Now().UnixNano()),
		UserID:    fromID,
		Amount:    req.Amount,
		Type:      "payout",
		Method:    fmt.Sprintf("Выплата подрядчику за заказ #%d", req.OrderID),
		Status:    "Выплачено",
		CreatedAt: time.Now(),
	}
	_ = database.AddTransaction(tx)
	_ = database.AddTransaction(&models.Transaction{
		ID:        fmt.Sprintf("tx_%d_in", time.Now().UnixNano()),
		UserID:    req.ToUserID,
		Amount:    req.Amount,
		Type:      "payout_received",
		Method:    fmt.Sprintf("Оплата за заказ #%d", req.OrderID),
		Status:    "Зачислено",
		CreatedAt: time.Now(),
	})

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"message":     "Выплата подрядчику успешно завершена",
		"transaction": tx,
	})
}

// GetTransactions returns the caller's transactions (admin/manager: all, or ?userId=)
func (h *FinanceHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	uid, role := currentUser(r)
	filter := uid
	if isStaff(role) {
		filter = r.URL.Query().Get("userId")
	}
	txs, err := database.GetTransactions(filter)
	if err != nil {
		txs = []*models.Transaction{}
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"total": len(txs),
		"items": txs,
	})
}
