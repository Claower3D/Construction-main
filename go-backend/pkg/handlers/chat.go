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
	chatMutex sync.RWMutex
	chatStore = []*models.ChatMessage{
		{
			ID:         "msg_01",
			OrderID:    "101",
			SenderID:   "u_admin_1",
			SenderName: "Заказчик",
			SenderRole: "customer",
			Text:       "Здравствуйте! Когда планируется выезд геодезистов на объект?",
			CreatedAt:  time.Now().Add(-2 * time.Hour),
		},
		{
			ID:         "msg_02",
			OrderID:    "101",
			SenderID:   "u_eng_1",
			SenderName: "Инженер Куаныш",
			SenderRole: "engineer",
			Text:       "Добрый день! Буровая бригада выезжает завтра в 09:00.",
			CreatedAt:  time.Now().Add(-1 * time.Hour),
		},
	}
)

type ChatHandler struct{}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{}
}

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	orderID := r.URL.Query().Get("orderId")

	chatMutex.RLock()
	defer chatMutex.RUnlock()

	var result []*models.ChatMessage
	for _, msg := range chatStore {
		if orderID == "" || msg.OrderID == orderID {
			result = append(result, msg)
		}
	}

	_ = json.NewEncoder(w).Encode(result)
}

func (h *ChatHandler) SendMessage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var msg models.ChatMessage
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil || msg.Text == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Сообщение не может быть пустым"})
		return
	}

	chatMutex.Lock()
	msg.ID = fmt.Sprintf("msg_%d", time.Now().UnixNano())
	msg.CreatedAt = time.Now()
	if msg.OrderID == "" {
		msg.OrderID = "101"
	}
	if msg.SenderName == "" {
		msg.SenderName = "Пользователь QazGost"
	}
	chatStore = append(chatStore, &msg)
	chatMutex.Unlock()

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(msg)
}
