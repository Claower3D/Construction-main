package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/middleware"
	"qazgost-ai/backend/pkg/models"
)

var (
	usersMutex sync.RWMutex
	usersStore = map[string]*models.User{
		"admin@qazgost.kz": {
			ID:        "u_admin_1",
			Email:     "admin@qazgost.kz",
			Name:      "Администратор QAZGOST AI",
			Role:      "admin",
			City:      "Караганда",
			Company:   "ТОО «QazGost»",
			CreatedAt: time.Now(),
		},
		"engineer@qazgost.kz": {
			ID:        "u_eng_1",
			Email:     "engineer@qazgost.kz",
			Name:      "Инженер-эксперт",
			Role:      "engineer",
			City:      "Астана",
			Company:   "ТОО «Инжен-Строй»",
			CreatedAt: time.Now(),
		},
	}
)

type AuthHandler struct {
	cfg *config.Config
}

func NewAuthHandler(cfg *config.Config) *AuthHandler {
	return &AuthHandler{cfg: cfg}
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат запроса"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	role := "customer"
	if strings.Contains(email, "admin") {
		role = "admin"
	} else if strings.Contains(email, "executor") {
		role = "executor"
	} else if strings.Contains(email, "engineer") {
		role = "engineer"
	} else if strings.Contains(email, "manager") {
		role = "manager"
	}

	usersMutex.Lock()
	user, exists := usersStore[email]
	if !exists {
		name := strings.Split(email, "@")[0]
		user = &models.User{
			ID:        fmt.Sprintf("u_%d", time.Now().UnixNano()),
			Email:     email,
			Name:      name,
			Role:      role,
			City:      "Караганда",
			CreatedAt: time.Now(),
		}
		usersStore[email] = user
	}
	usersMutex.Unlock()

	token, err := middleware.GenerateJWT(user.ID, user.Email, user.Role, h.cfg.JwtSecret)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка генерации токена"})
		return
	}

	user.Token = token
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Успешный вход",
		"token":   token,
		"user":    user,
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var req struct {
		Email   string `json:"email"`
		Name    string `json:"name"`
		Role    string `json:"role"`
		Phone   string `json:"phone"`
		City    string `json:"city"`
		Company string `json:"company"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверные данные регистрации"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	role := req.Role
	if role == "" {
		role = "customer"
	}

	usersMutex.Lock()
	user := &models.User{
		ID:        fmt.Sprintf("u_%d", time.Now().UnixNano()),
		Email:     email,
		Name:      req.Name,
		Role:      role,
		Phone:     req.Phone,
		City:      req.City,
		Company:   req.Company,
		CreatedAt: time.Now(),
	}
	usersStore[email] = user
	usersMutex.Unlock()

	token, _ := middleware.GenerateJWT(user.ID, user.Email, user.Role, h.cfg.JwtSecret)
	user.Token = token

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Регистрация завершена",
		"token":   token,
		"user":    user,
	})
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Необходима авторизация"})
		return
	}

	tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
	claims, err := middleware.ValidateJWT(tokenStr, h.cfg.JwtSecret)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Сессия истекла"})
		return
	}

	usersMutex.RLock()
	var currentUser *models.User
	for _, u := range usersStore {
		if u.Email == claims.Email || u.ID == claims.UserID {
			currentUser = u
			break
		}
	}
	usersMutex.RUnlock()

	if currentUser == nil {
		currentUser = &models.User{
			ID:    claims.UserID,
			Email: claims.Email,
			Name:  strings.Split(claims.Email, "@")[0],
			Role:  claims.Role,
		}
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"user": currentUser,
	})
}
