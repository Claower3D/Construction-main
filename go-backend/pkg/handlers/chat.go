package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
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

func (h *ChatHandler) GetMessages(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	orderID := r.URL.Query().Get("orderId")
	uid, role := currentUser(r)

	msgs, err := database.GetChatMessages(orderID)
	if err != nil {
		msgs = []*models.ChatMessage{}
	}
	// Without an orderId a regular user gets only the threads they took part in
	if orderID == "" && !isStaff(role) {
		mine := map[string]bool{}
		for _, m := range msgs {
			if m.SenderID == uid {
				mine[m.OrderID] = true
			}
		}
		filtered := make([]*models.ChatMessage, 0, len(msgs))
		for _, m := range msgs {
			if mine[m.OrderID] {
				filtered = append(filtered, m)
			}
		}
		msgs = filtered
	}

	_ = json.NewEncoder(w).Encode(msgs)
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
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	msgChan := make(chan *models.ChatMessage, 20)
	orderFilter := r.URL.Query().Get("orderId")

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
			data, _ := json.Marshal(msg)
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
		}
	}
}
