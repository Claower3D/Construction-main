package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
)

// Передача входа между доменами сайта (qazgost.kz ↔ qazgost.com).
//
// У каждого домена своё хранилище в браузере, поэтому человек, вошедший на одном адресе, на втором
// видел страницу входа. Теперь второй домен может спросить первый: страница-мост на первом домене
// (frontend/public/sso.html) берёт у сервера одноразовый код, возвращает человека на второй домен,
// и тот меняет код на собственную сессию.
//
// Правила безопасности:
//   - код выдаётся только вошедшему пользователю и только для адреса из списка cfg.SsoOrigins;
//   - код одноразовый, живёт минуту, в базе хранится его хеш;
//   - обменять код может только тот домен, для которого он выдан (заголовок Origin ставит браузер);
//   - пароль нигде не передаётся; новая сессия заканчивается тогда же, когда и та, от которой выдан код,
//     поэтому передача не продлевает вход без пароля.

const ssoCodeLifetime = 60 * time.Second

func ssoHash(code string) string {
	sum := sha256.Sum256([]byte(code))
	return hex.EncodeToString(sum[:])
}

func (h *AuthHandler) ssoAllowed(origin string) bool {
	if origin == "" {
		return false
	}
	for _, o := range h.cfg.SsoOrigins {
		if o == origin {
			return true
		}
	}
	return false
}

// SsoCode — POST /api/v1/auth/sso/code {target}. Нужна действующая сессия. Отдаёт одноразовый код для соседнего домена.
func (h *AuthHandler) SsoCode(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
		return
	}
	userID, _ := r.Context().Value(middleware.ContextUserID).(string)
	if userID == "" {
		writeError(w, http.StatusUnauthorized, "Необходима авторизация")
		return
	}
	var body struct {
		Target string `json:"target"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "Неверный формат запроса")
		return
	}
	target := strings.TrimRight(strings.TrimSpace(body.Target), "/")
	origin := r.Header.Get("Origin")
	// запрос приходит со страницы-моста одного из доменов сайта, а код нужен другому домену
	if !h.ssoAllowed(origin) || !h.ssoAllowed(target) || origin == target {
		writeError(w, http.StatusForbidden, "Вход передаётся только между адресами сайта")
		return
	}
	if _, err := database.GetUserByID(userID); err != nil {
		writeError(w, http.StatusUnauthorized, "Пользователь не найден")
		return
	}
	// срок действующей сессии: новая, на соседнем адресе, закончится тогда же
	claims, err := middleware.ValidateJWT(strings.TrimPrefix(r.Header.Get("Authorization"), "Bearer "), h.cfg.JwtSecret)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Недействительный или истёкший токен")
		return
	}
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось выдать код")
		return
	}
	code := base64.RawURLEncoding.EncodeToString(raw)
	if err := database.SaveSsoCode(ssoHash(code), userID, target, time.Now().Add(ssoCodeLifetime).Unix(), claims.Exp); err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось выдать код")
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]interface{}{"code": code, "expires_in": int(ssoCodeLifetime.Seconds())})
}

// SsoExchange — POST /api/v1/auth/sso/exchange {code}. Меняет код на сессию; ответ тот же, что у входа.
func (h *AuthHandler) SsoExchange(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
		return
	}
	origin := r.Header.Get("Origin")
	if !h.ssoAllowed(origin) {
		writeError(w, http.StatusForbidden, "Вход передаётся только между адресами сайта")
		return
	}
	var body struct {
		Code string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || len(body.Code) < 20 || len(body.Code) > 100 {
		writeError(w, http.StatusBadRequest, "Неверный формат запроса")
		return
	}
	userID, target, sessionExp, err := database.TakeSsoCode(ssoHash(body.Code))
	if err != nil || target != origin {
		// код не найден, просрочен, уже использован или выдан другому домену — ответ один и тот же
		writeError(w, http.StatusUnauthorized, "Код недействителен, войдите с паролем")
		return
	}
	user, err := database.GetUserByID(userID)
	if err != nil {
		writeError(w, http.StatusUnauthorized, "Код недействителен, войдите с паролем")
		return
	}
	token, err := middleware.GenerateJWTUntil(user.ID, user.Email, user.Role, h.cfg.JwtSecret, sessionExp)
	if err != nil {
		// исходная сессия успела закончиться — на соседнем адресе тоже нужен пароль
		writeError(w, http.StatusUnauthorized, "Код недействителен, войдите с паролем")
		return
	}
	if user.Role == "admin" {
		database.AddAudit(user.ID, user.Email, "admin_sign_in", user.ID, "вход администратора: передан с "+strings.TrimPrefix(originOther(h.cfg.SsoOrigins, origin), "https://"))
	}
	user.Token = token
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Успешный вход", "token": token, "user": user})
}

// originOther — адрес из списка, отличный от данного (для записи в журнал: с какого домена передан вход)
func originOther(all []string, origin string) string {
	for _, o := range all {
		if o != origin {
			return o
		}
	}
	return "другого адреса сайта"
}
