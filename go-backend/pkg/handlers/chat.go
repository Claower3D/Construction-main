package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

var (
	chatMutex   sync.RWMutex
	chatClients = make(map[chan *models.ChatMessage]bool)
)

type ChatHandler struct{}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{}
}

// canAccessOrderChat: переписку по заказу видят и ведут те же, кто может работать с заказом —
// автор, администратор/менеджер, технадзор и исполнитель компании-подрядчика.
// Раньше любой вошедший пользователь читал чат любого заказа по его номеру.
func canAccessOrderChat(r *http.Request, orderID string) bool {
	if _, role := currentUser(r); isStaff(role) {
		return true
	}
	id, err := strconv.ParseInt(strings.TrimSpace(orderID), 10, 64)
	if err != nil {
		return false
	}
	order, err := database.GetOrderByID(id)
	if err != nil {
		return false
	}
	return canModifyOrder(r, order)
}

// chatAccess запоминает ответ по каждому заказу на время одного запроса или одного подключения
type chatAccess struct {
	r     *http.Request
	known map[string]bool
}

func newChatAccess(r *http.Request) *chatAccess {
	return &chatAccess{r: r, known: map[string]bool{}}
}

func (c *chatAccess) allowed(orderID string) bool {
	ok, seen := c.known[orderID]
	if !seen {
		ok = canAccessOrderChat(c.r, orderID)
		c.known[orderID] = ok
	}
	return ok
}

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	orderID := strings.TrimSpace(r.URL.Query().Get("orderId"))
	access := newChatAccess(r)
	if orderID != "" && !access.allowed(orderID) {
		writeError(w, http.StatusForbidden, "Нет доступа к переписке по этому заказу")
		return
	}

	msgs, err := database.GetChatMessages(orderID)
	if err != nil {
		msgs = []*models.ChatMessage{}
	}
	// Без номера заказа — только переписка по заказам, к которым у пользователя есть доступ
	if orderID == "" {
		filtered := make([]*models.ChatMessage, 0, len(msgs))
		for _, m := range msgs {
			if access.allowed(m.OrderID) {
				filtered = append(filtered, m)
			}
		}
		msgs = filtered
	}
	writeJSON(w, http.StatusOK, msgs)
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	var req struct {
		OrderID    string `json:"orderId"`
		SenderID   string `json:"senderId"`
		SenderName string `json:"senderName"`
		SenderRole string `json:"senderRole"`
		Text       string `json:"text"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Text == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Сообщение не может быть пустым"})
		return
	}

	if len([]rune(req.Text)) > 4000 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Сообщение длиннее 4000 символов"})
		return
	}
	req.OrderID = strings.TrimSpace(req.OrderID)
	if !canAccessOrderChat(r, req.OrderID) {
		w.WriteHeader(http.StatusForbidden)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Нет доступа к переписке по этому заказу"})
		return
	}

	// Sender identity always comes from the JWT, never from the request body
	uid, role := currentUser(r)
	req.SenderID = uid
	req.SenderRole = role
	req.SenderName = "Пользователь"
	if u, err := database.GetUserByID(uid); err == nil && u.Name != "" {
		req.SenderName = u.Name
	}

	msg := &models.ChatMessage{
		ID:         fmt.Sprintf("msg_%d", time.Now().UnixNano()),
		OrderID:    req.OrderID,
		SenderID:   req.SenderID,
		SenderName: req.SenderName,
		SenderRole: req.SenderRole,
		Text:       req.Text,
		CreatedAt:  time.Now(),
	}

	if err := database.AddChatMessage(msg); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Не удалось сохранить сообщение"})
		return
	}

	chatMutex.Lock()
	for ch := range chatClients {
		select {
		case ch <- msg:
		default:
		}
	}
	chatMutex.Unlock()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(msg)
}

func (h *ChatHandler) StreamMessages(w http.ResponseWriter, r *http.Request) {
	orderFilter := strings.TrimSpace(r.URL.Query().Get("orderId"))
	// Подписка получает только переписку по заказам, доступным этому пользователю.
	// Раньше подключение без orderId получало все сообщения всех пользователей.
	access := newChatAccess(r)
	if orderFilter != "" && !access.allowed(orderFilter) {
		writeError(w, http.StatusForbidden, "Нет доступа к переписке по этому заказу")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	msgChan := make(chan *models.ChatMessage, 20)

	chatMutex.Lock()
	chatClients[msgChan] = true
	chatMutex.Unlock()

	defer func() {
		chatMutex.Lock()
		delete(chatClients, msgChan)
		close(msgChan)
		chatMutex.Unlock()
	}()

	notify := r.Context().Done()
	for {
		select {
		case <-notify:
			return
		case msg := <-msgChan:
			if orderFilter != "" && msg.OrderID != orderFilter {
				continue
			}
			if !access.allowed(msg.OrderID) {
				continue
			}
			data, _ := json.Marshal(msg)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}
