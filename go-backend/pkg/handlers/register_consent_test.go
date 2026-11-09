package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
)

func TestNormalizeKzPhone(t *testing.T) {
	cases := map[string]string{
		"+7 (701) 999-88-77": "+77019998877",
		"87019998877":        "+77019998877",
		"7019998877":         "+77019998877",
		"+77172555555":       "+77172555555",
	}
	for in, want := range cases {
		got, ok := NormalizeKzPhone(in)
		if !ok || got != want {
			t.Errorf("NormalizeKzPhone(%q) = %q, %v; want %q", in, got, ok, want)
		}
	}
	for _, bad := range []string{"12345", "+7 701 999", "+998901234567", "abc"} {
		if got, ok := NormalizeKzPhone(bad); ok {
			t.Errorf("NormalizeKzPhone(%q) accepted as %q", bad, got)
		}
	}
}

func postRegister(t *testing.T, h *AuthHandler, body map[string]interface{}) *httptest.ResponseRecorder {
	t.Helper()
	b, _ := json.Marshal(body)
	req := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(b))
	w := httptest.NewRecorder()
	h.Register(w, req)
	return w
}

func TestRegisterRequiresConsentsFromNewForm(t *testing.T) {
	h := NewAuthHandler(&config.Config{JwtSecret: "test-secret-123"})
	base := func(email string) map[string]interface{} {
		return map[string]interface{}{
			"email": email, "password": "secure12345", "name": "Айгерим Сапарова",
			"role": "customer", "city": "Астана", "phone": "8 701 555 44 33",
			"consentVersion": "2026-11-10",
		}
	}

	// без согласий — отказ
	noConsent := base("consent_none@test.kz")
	if w := postRegister(t, h, noConsent); w.Code != http.StatusBadRequest {
		t.Fatalf("без согласий ожидали 400, получили %d: %s", w.Code, w.Body.String())
	}

	// только соглашение, без согласия на обработку данных — отказ
	onlyTerms := base("consent_terms@test.kz")
	onlyTerms["acceptTerms"] = true
	if w := postRegister(t, h, onlyTerms); w.Code != http.StatusBadRequest {
		t.Fatalf("без согласия на ПДн ожидали 400, получили %d", w.Code)
	}

	// неверный телефон — отказ
	badPhone := base("consent_badphone@test.kz")
	badPhone["acceptTerms"], badPhone["acceptPrivacy"] = true, true
	badPhone["phone"] = "12345"
	if w := postRegister(t, h, badPhone); w.Code != http.StatusBadRequest {
		t.Fatalf("неверный телефон: ожидали 400, получили %d", w.Code)
	}

	// всё заполнено — создан, согласия и телефон сохранены
	ok := base("consent_ok@test.kz")
	ok["acceptTerms"], ok["acceptPrivacy"], ok["marketingOptIn"] = true, true, true
	w := postRegister(t, h, ok)
	if w.Code != http.StatusCreated {
		t.Fatalf("ожидали 201, получили %d: %s", w.Code, w.Body.String())
	}

	var (
		phone, version     string
		termsAt, privacyAt *time.Time
		marketing          bool
	)
	err := database.DB.QueryRow(`SELECT phone, consent_version, terms_accepted_at, privacy_accepted_at, marketing_opt_in FROM users WHERE email=$1`, "consent_ok@test.kz").
		Scan(&phone, &version, &termsAt, &privacyAt, &marketing)
	if err != nil {
		t.Fatalf("пользователь не найден: %v", err)
	}
	if phone != "+77015554433" {
		t.Errorf("телефон сохранён как %q, ожидали +77015554433", phone)
	}
	if version != "2026-11-10" || termsAt == nil || privacyAt == nil || !marketing {
		t.Errorf("согласия не сохранены: version=%q terms=%v privacy=%v marketing=%v", version, termsAt, privacyAt, marketing)
	}

	// старые клиенты без версии документов регистрируются, но без отметки согласия
	legacy := map[string]interface{}{"email": "legacy_app@test.kz", "password": "secure12345", "name": "Инженер", "role": "engineer"}
	if w := postRegister(t, h, legacy); w.Code != http.StatusCreated {
		t.Fatalf("старый клиент: ожидали 201, получили %d: %s", w.Code, w.Body.String())
	}
	var legacyTerms *time.Time
	_ = database.DB.QueryRow(`SELECT terms_accepted_at FROM users WHERE email=$1`, "legacy_app@test.kz").Scan(&legacyTerms)
	if legacyTerms != nil {
		t.Errorf("у старого клиента не должно быть отметки согласия, получили %v", legacyTerms)
	}
}
