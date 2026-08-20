package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
	"qazgost-ai/backend/pkg/models"
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

	if req.Password == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Пароль обязателен"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	user, err := database.GetUserByEmail(email)
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный email или пароль"})
		return
	}

	if !middleware.CheckPassword(req.Password, user.PasswordHash) {
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный email или пароль"})
		return
	}

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
		Email    string `json:"email"`
		Password string `json:"password"`
		Name     string `json:"name"`
		Role     string `json:"role"`
		Phone    string `json:"phone"`
		City     string `json:"city"`
		Company  string `json:"company"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.Email == "" {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверные данные регистрации"})
		return
	}

	if req.Password == "" || len(req.Password) < 6 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Пароль должен быть не менее 6 символов"})
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))

	if _, err := database.GetUserByEmail(email); err == nil {
		w.WriteHeader(http.StatusConflict)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Пользователь с таким email уже существует"})
		return
	}

	role := req.Role
	if role == "" {
		role = "customer"
	}
	if role == "admin" || role == "manager" {
		role = "customer"
	}

	user := &models.User{
		ID:           fmt.Sprintf("u_%d", time.Now().UnixNano()),
		Email:        email,
		Name:         req.Name,
		PasswordHash: middleware.HashPassword(req.Password),
		Role:         role,
		Phone:        req.Phone,
		City:         req.City,
		Company:      req.Company,
		CreatedAt:    time.Now(),
	}

	if err := database.CreateUser(user); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания пользователя"})
		return
	}

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

	currentUser, err := database.GetUserByID(claims.UserID)
	if err != nil {
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
