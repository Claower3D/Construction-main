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
	chatMutex   sync.RWMutex
	chatClients = make(map[chan *models.ChatMessage]bool)
	chatStore   = []*models.ChatMessage{
		{
			ID:         "msg_01",
			OrderID:    "101",
			SenderID:   "u_customer_1",
			SenderName: "Заказчик (ТОО Алатау)",
			SenderRole: "customer",
			Text:       "Здравствуйте! Заливка фундамента запланирована на четверг?",
			CreatedAt:  time.Now().Add(-2 * time.Hour),
		},
		{
			ID:         "msg_02",
			OrderID:    "101",
			SenderID:   "u_eng_1",
			SenderName: "Инженер технадзора Куаныш",
			SenderRole: "engineer",
			Text:       "Добрый день! Армирование принято без замечаний. Бетононасос заказан на 09:30.",
			CreatedAt:  time.Now().Add(-1 * time.Hour),
		},
	}
)

type ChatHandler struct{}

func NewChatHandler() *ChatHandler {
	return &ChatHandler{}
}

// GetMessages returns chat history for a specific order or global
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

// SendMessage broadcasts a new message to all clients
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

	if req.SenderName == "" {
		req.SenderName = "Пользователь"
	}
	if req.SenderRole == "" {
		req.SenderRole = "customer"
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

	chatMutex.Lock()
	chatStore = append(chatStore, msg)
	// Broadcast to all active SSE streaming connections
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

// StreamMessages provides real-time SSE (Server-Sent Events) streaming for chat
func (h *ChatHandler) StreamMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

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
			data, _ := json.Marshal(msg)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}
