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

// loginFailures: не больше 10 неверных паролей на один email за 10 минут, с каких бы адресов
// ни шли попытки. Лимит запросов с одного адреса стоит отдельно, на маршруте (main.go).
var loginFailures = middleware.NewAttemptLimiter(10, 10*time.Minute)

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
	if len(email) > 254 || len(req.Password) > 1024 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат запроса"})
		return
	}

	if blocked, wait := loginFailures.Blocked(email); blocked {
		minutes := int(wait.Minutes()) + 1
		w.Header().Set("Retry-After", fmt.Sprintf("%d", int(wait.Seconds())+1))
		w.WriteHeader(http.StatusTooManyRequests)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": fmt.Sprintf("Слишком много неверных попыток входа. Попробуйте через %d мин.", minutes)})
		return
	}

	user, err := database.GetUserByEmail(email)
	if err != nil {
		loginFailures.Fail(email)
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный email или пароль"})
		return
	}

	if !middleware.CheckPassword(req.Password, user.PasswordHash) {
		loginFailures.Fail(email)
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный email или пароль"})
		return
	}
	loginFailures.Reset(email)

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
		Email             string  `json:"email"`
		Password          string  `json:"password"`
		Name              string  `json:"name"`
		FullName          string  `json:"fullName"`
		Role              string  `json:"role"`
		Phone             string  `json:"phone"`
		City              string  `json:"city"`
		Company           string  `json:"company"`
		HasEquipment      bool    `json:"hasEquipment"`
		EquipmentName     string  `json:"equipmentName"`
		EquipmentCategory string  `json:"equipmentCategory"`
		PricePerDay       float64 `json:"pricePerDay"`
		PricePerHour      float64 `json:"pricePerHour"`
		PlateNumber       string  `json:"plateNumber"`
		Capacity          string  `json:"capacity"`
		EquipmentImage    string  `json:"equipmentImage"`
		// Согласия из формы регистрации
		AcceptTerms    bool   `json:"acceptTerms"`
		AcceptPrivacy  bool   `json:"acceptPrivacy"`
		MarketingOptIn bool   `json:"marketingOptIn"`
		ConsentVersion string `json:"consentVersion"`
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
	// Мобильные приложения дописывают к логину «@qazgost.kz», поэтому проверка мягкая:
	// нужен знак «@» с непустыми частями по обе стороны. Строгая проверка адреса — на форме сайта.
	if at := strings.LastIndex(email, "@"); at <= 0 || at == len(email)-1 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите email в формате name@example.kz"})
		return
	}
	if len(req.Password) > 1024 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Слишком длинный пароль"})
		return
	}

	if _, err := database.GetUserByEmail(email); err == nil {
		w.WriteHeader(http.StatusConflict)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Пользователь с таким email уже существует"})
		return
	}

	// The web form sends "fullName", the API used to read only "name" → names were saved empty
	if strings.TrimSpace(req.Name) == "" {
		req.Name = req.FullName
	}
	req.Name = strings.TrimSpace(req.Name)
	if len([]rune(req.Name)) > 200 || len(req.Phone) > 50 || len(req.City) > 100 || len(req.Company) > 300 || len(email) > 254 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Слишком длинные поля регистрации"})
		return
	}

	// Телефон: храним в едином виде +7XXXXXXXXXX
	if strings.TrimSpace(req.Phone) != "" {
		phone, ok := NormalizeKzPhone(req.Phone)
		if !ok {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный номер телефона: нужен формат +7 и 10 цифр"})
			return
		}
		req.Phone = phone
	}

	// Новая форма регистрации передаёт версию документов — тогда согласия обязательны.
	// Старые мобильные приложения версию не передают: регистрируем, но без отметки согласия.
	req.ConsentVersion = strings.TrimSpace(req.ConsentVersion)
	if len(req.ConsentVersion) > 32 {
		req.ConsentVersion = req.ConsentVersion[:32]
	}
	if req.ConsentVersion != "" {
		if !req.AcceptTerms || !req.AcceptPrivacy {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Чтобы зарегистрироваться, примите пользовательское соглашение и дайте согласие на обработку персональных данных"})
			return
		}
		if req.Phone == "" {
			w.WriteHeader(http.StatusBadRequest)
			_ = json.NewEncoder(w).Encode(map[string]string{"error": "Укажите номер телефона"})
			return
		}
	}

	// Only known self-service roles; admin/manager (and anything unknown) become customer
	role := req.Role
	switch role {
	case "customer", "executor", "engineer", "company":
	default:
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
	if req.ConsentVersion != "" {
		now := user.CreatedAt
		user.ConsentVersion = req.ConsentVersion
		user.TermsAcceptedAt = &now
		user.PrivacyAcceptedAt = &now
		if req.MarketingOptIn {
			user.MarketingOptIn = true
			user.MarketingOptInAt = &now
		}
	}

	if err := database.CreateUser(user); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания пользователя"})
		return
	}

	// If executor registered with equipment, automatically add equipment to marketplace
	if req.HasEquipment || req.EquipmentName != "" || (req.Role == "executor" && req.EquipmentCategory != "") {
		eqName := req.EquipmentName
		if eqName == "" {
			eqName = fmt.Sprintf("Спецтехника (%s)", req.Name)
		}
		eqCategory := req.EquipmentCategory
		if eqCategory == "" {
			eqCategory = "Землеройная техника"
		}
		priceDay := req.PricePerDay
		if priceDay <= 0 {
			priceDay = 95000
		}
		priceHour := req.PricePerHour
		if priceHour <= 0 {
			priceHour = 12000
		}
		img := strings.TrimSpace(req.EquipmentImage)
		if !strings.HasPrefix(img, "/uploads/") && !strings.HasPrefix(img, "https://") {
			img = "" // the marketplace shows a placeholder by category
		}
		city := req.City
		if city == "" {
			city = "Алматы"
		}

		eq := &models.Equipment{
			ID:           fmt.Sprintf("eq_%d", time.Now().UnixNano()),
			Name:         eqName,
			Category:     eqCategory,
			PricePerDay:  priceDay,
			PricePerHour: priceHour,
			City:         city,
			Status:       "Доступен",
			Image:        img,
			OwnerID:      user.ID,
			OwnerName:    user.Name,
			OwnerPhone:   user.Phone,
			PlateNumber:  req.PlateNumber,
			Capacity:     req.Capacity,
			WithOperator: true,
			Delivery:     true,
		}
		_ = database.AddEquipment(eq)
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
		// A validly signed token for a user that does not exist (deleted, or forged) is not a session
		w.WriteHeader(http.StatusUnauthorized)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Пользователь не найден"})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"user": currentUser,
	})
}

// NormalizeKzPhone приводит номер к виду +7XXXXXXXXXX. Принимает «8 701…», «+7 (701) …», «7701…».
func NormalizeKzPhone(raw string) (string, bool) {
	digits := make([]byte, 0, 16)
	for i := 0; i < len(raw); i++ {
		if c := raw[i]; c >= '0' && c <= '9' {
			digits = append(digits, c)
		}
	}
	if len(digits) == 11 && digits[0] == '8' {
		digits[0] = '7'
	}
	if len(digits) == 10 {
		digits = append([]byte{'7'}, digits...)
	}
	if len(digits) != 11 || digits[0] != '7' {
		return "", false
	}
	return "+" + string(digits), true
}
