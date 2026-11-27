package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
)

// Передача входа между доменами сайта: одноразовый код, только свои адреса, только свой домен назначения.

const ssoKz, ssoCom = "https://qazgost.kz", "https://qazgost.com"

func ssoHandler() *AuthHandler {
	return NewAuthHandler(&config.Config{JwtSecret: "test-secret-123", SsoOrigins: []string{ssoKz, ssoCom}})
}

func ssoUser(t *testing.T, h *AuthHandler, role string) (email, token, id string) {
	t.Helper()
	email = fmt.Sprintf("sso_%s_%d@test.kz", role, time.Now().UnixNano())
	if w := postRegister(t, h, map[string]interface{}{"email": email, "password": "Right-pass-1", "name": "Проверка"}); w.Code != http.StatusCreated {
		t.Fatalf("регистрация: %d %s", w.Code, w.Body.String())
	}
	t.Cleanup(func() {
		_, _ = database.DB.Exec(`DELETE FROM sso_codes WHERE user_id IN (SELECT id FROM users WHERE email=$1)`, email)
		_, _ = database.DB.Exec(`DELETE FROM users WHERE email=$1`, email)
	})
	if role != "customer" {
		if _, err := database.DB.Exec(`UPDATE users SET role=$1 WHERE email=$2`, role, email); err != nil {
			t.Fatal(err)
		}
	}
	w := postLogin(h, email, "Right-pass-1")
	var out struct {
		Token string `json:"token"`
		User  struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	if w.Code != http.StatusOK || json.Unmarshal(w.Body.Bytes(), &out) != nil || out.Token == "" {
		t.Fatalf("вход: %d %s", w.Code, w.Body.String())
	}
	return email, out.Token, out.User.ID
}

func ssoCode(h *AuthHandler, token, origin, target string) *httptest.ResponseRecorder {
	body, _ := json.Marshal(map[string]string{"target": target})
	r := httptest.NewRequest("POST", "/api/v1/auth/sso/code", bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	if token != "" {
		r.Header.Set("Authorization", "Bearer "+token)
	}
	if origin != "" {
		r.Header.Set("Origin", origin)
	}
	w := httptest.NewRecorder()
	middleware.AuthMiddleware(h.cfg.JwtSecret, h.SsoCode)(w, r)
	return w
}

func ssoExchange(h *AuthHandler, code, origin string) *httptest.ResponseRecorder {
	body, _ := json.Marshal(map[string]string{"code": code})
	r := httptest.NewRequest("POST", "/api/v1/auth/sso/exchange", bytes.NewReader(body))
	r.Header.Set("Content-Type", "application/json")
	if origin != "" {
		r.Header.Set("Origin", origin)
	}
	w := httptest.NewRecorder()
	h.SsoExchange(w, r)
	return w
}

func codeOf(t *testing.T, w *httptest.ResponseRecorder) string {
	t.Helper()
	var out struct {
		Code string `json:"code"`
	}
	if w.Code != http.StatusOK || json.Unmarshal(w.Body.Bytes(), &out) != nil || len(out.Code) < 40 {
		t.Fatalf("код не выдан: %d %s", w.Code, w.Body.String())
	}
	return out.Code
}

func TestSso_HandsSessionToSiblingDomain(t *testing.T) {
	h := ssoHandler()
	email, token, id := ssoUser(t, h, "admin")
	code := codeOf(t, ssoCode(h, token, ssoKz, ssoCom))

	// в базе лежит хеш, а не сам код
	var plain int
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM sso_codes WHERE code_hash=$1`, code).Scan(&plain); err != nil || plain != 0 {
		t.Fatalf("код хранится в открытом виде: %d %v", plain, err)
	}

	w := ssoExchange(h, code, ssoCom)
	var out struct {
		Token string `json:"token"`
		User  struct {
			ID, Email, Role string
		} `json:"user"`
	}
	if w.Code != http.StatusOK || json.Unmarshal(w.Body.Bytes(), &out) != nil {
		t.Fatalf("обмен кода: %d %s", w.Code, w.Body.String())
	}
	if out.User.ID != id || out.User.Email != email || out.User.Role != "admin" || out.Token == "" {
		t.Fatalf("выдана сессия не того пользователя: %+v", out.User)
	}
	// новая сессия рабочая, и прежняя тоже осталась
	for name, tok := range map[string]string{"новая": out.Token, "прежняя": token} {
		r := httptest.NewRequest("GET", "/api/v1/auth/me", nil)
		r.Header.Set("Authorization", "Bearer "+tok)
		rec := httptest.NewRecorder()
		h.GetMe(rec, r)
		if rec.Code != http.StatusOK {
			t.Errorf("сессия «%s» не работает: %d %s", name, rec.Code, rec.Body.String())
		}
	}
	// передача не продлевает вход: новая сессия заканчивается тогда же, когда и исходная
	was, err1 := middleware.ValidateJWT(token, h.cfg.JwtSecret)
	now, err2 := middleware.ValidateJWT(out.Token, h.cfg.JwtSecret)
	if err1 != nil || err2 != nil || now.Exp != was.Exp || now.UserID != was.UserID {
		t.Errorf("срок новой сессии должен совпадать со сроком исходной: %v %v %+v %+v", err1, err2, was, now)
	}
	// код одноразовый
	if w := ssoExchange(h, code, ssoCom); w.Code != http.StatusUnauthorized {
		t.Errorf("код сработал второй раз: %d %s", w.Code, w.Body.String())
	}
}

func TestSso_CodeOnlyForItsDomain(t *testing.T) {
	h := ssoHandler()
	_, token, _ := ssoUser(t, h, "customer")

	// код, выданный для .com, на .kz не меняется — и после этой попытки сгорает
	code := codeOf(t, ssoCode(h, token, ssoKz, ssoCom))
	if w := ssoExchange(h, code, ssoKz); w.Code != http.StatusUnauthorized {
		t.Errorf("код принят не своим доменом: %d %s", w.Code, w.Body.String())
	}
	if w := ssoExchange(h, code, ssoCom); w.Code != http.StatusUnauthorized {
		t.Errorf("код должен сгореть после чужой попытки: %d", w.Code)
	}

	// чужой сайт не может ни обменять код, ни обойтись без заголовка Origin
	code = codeOf(t, ssoCode(h, token, ssoKz, ssoCom))
	for _, origin := range []string{"https://evil.example", "https://qazgost.com.evil.example", "http://qazgost.com", ""} {
		if w := ssoExchange(h, code, origin); w.Code != http.StatusForbidden {
			t.Errorf("обмен с адреса %q должен быть запрещён: %d %s", origin, w.Code, w.Body.String())
		}
	}
	if w := ssoExchange(h, code, ssoCom); w.Code != http.StatusOK {
		t.Errorf("после чужих запросов без права обмена код должен остаться рабочим: %d %s", w.Code, w.Body.String())
	}
}

func TestSso_CodeIssuedOnlyToSignedInUserForOwnDomains(t *testing.T) {
	h := ssoHandler()
	_, token, _ := ssoUser(t, h, "customer")

	if w := ssoCode(h, "", ssoKz, ssoCom); w.Code != http.StatusUnauthorized {
		t.Errorf("без входа код не выдаётся: %d", w.Code)
	}
	if w := ssoCode(h, "not-a-token", ssoKz, ssoCom); w.Code != http.StatusUnauthorized {
		t.Errorf("с поддельным токеном код не выдаётся: %d", w.Code)
	}
	cases := []struct{ origin, target, why string }{
		{ssoKz, "https://evil.example", "чужой адрес назначения"},
		{ssoKz, "https://qazgost.com.evil.example", "похожий адрес назначения"},
		{ssoKz, "http://qazgost.com", "адрес без https"},
		{ssoKz, ssoKz, "тот же домен"},
		{"https://evil.example", ssoCom, "запрос с чужого сайта"},
		{"", ssoCom, "запрос без Origin"},
		{ssoKz, "", "пустой адрес назначения"},
	}
	for _, c := range cases {
		if w := ssoCode(h, token, c.origin, c.target); w.Code != http.StatusForbidden {
			t.Errorf("%s: код не должен выдаваться: %d %s", c.why, w.Code, w.Body.String())
		}
	}
	var n int
	if err := database.DB.QueryRow(`SELECT COUNT(*) FROM sso_codes WHERE target NOT IN ($1,$2)`, ssoKz, ssoCom).Scan(&n); err != nil || n != 0 {
		t.Errorf("в базе код для чужого адреса: %d %v", n, err)
	}
}

func TestSso_ExpiredOrBrokenCode(t *testing.T) {
	h := ssoHandler()
	_, token, id := ssoUser(t, h, "customer")

	code := codeOf(t, ssoCode(h, token, ssoCom, ssoKz))
	if _, err := database.DB.Exec(`UPDATE sso_codes SET expires_unix=$1 WHERE user_id=$2`, time.Now().Unix()-5, id); err != nil {
		t.Fatal(err)
	}
	if w := ssoExchange(h, code, ssoKz); w.Code != http.StatusUnauthorized {
		t.Errorf("просроченный код принят: %d %s", w.Code, w.Body.String())
	}
	if w := ssoExchange(h, "A-code-that-was-never-issued-0123456789abcdef", ssoKz); w.Code != http.StatusUnauthorized {
		t.Errorf("выдуманный код принят: %d", w.Code)
	}
	for _, bad := range []string{"", "short", string(bytes.Repeat([]byte("x"), 300))} {
		if w := ssoExchange(h, bad, ssoKz); w.Code != http.StatusBadRequest {
			t.Errorf("код %q…: ожидался отказ по формату: %d", fmt.Sprintf("%.8s", bad), w.Code)
		}
	}

	// исходная сессия закончилась раньше, чем код обменяли, — новая не выдаётся
	code = codeOf(t, ssoCode(h, token, ssoCom, ssoKz))
	if _, err := database.DB.Exec(`UPDATE sso_codes SET session_exp=$1 WHERE user_id=$2`, time.Now().Unix()-1, id); err != nil {
		t.Fatal(err)
	}
	if w := ssoExchange(h, code, ssoKz); w.Code != http.StatusUnauthorized {
		t.Errorf("сессия выдана после окончания исходной: %d %s", w.Code, w.Body.String())
	}

	// аккаунт удалён между выдачей кода и обменом — сессия не выдаётся
	code = codeOf(t, ssoCode(h, token, ssoCom, ssoKz))
	if _, err := database.DB.Exec(`DELETE FROM users WHERE id=$1`, id); err != nil {
		t.Fatal(err)
	}
	if w := ssoExchange(h, code, ssoKz); w.Code != http.StatusUnauthorized {
		t.Errorf("код удалённого аккаунта принят: %d %s", w.Code, w.Body.String())
	}
}
