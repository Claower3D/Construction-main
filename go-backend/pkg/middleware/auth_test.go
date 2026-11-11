package middleware

import (
	"encoding/base64"
	"strings"
	"testing"
	"time"
)

// Токен принимается только с верной подписью и неистёкшим сроком.
func TestValidateJWT(t *testing.T) {
	const secret = "test-secret-for-jwt-checks-0001"
	token, err := GenerateJWT("u_1", "a@b.kz", "customer", secret)
	if err != nil {
		t.Fatal(err)
	}
	claims, err := ValidateJWT(token, secret)
	if err != nil || claims.UserID != "u_1" || claims.Role != "customer" {
		t.Fatalf("свой токен не принят: %v %+v", err, claims)
	}

	if _, err := ValidateJWT(token, secret+"x"); err == nil {
		t.Error("токен принят с чужим ключом")
	}

	// подмена роли в теле без пересчёта подписи
	parts := strings.Split(token, ".")
	forged := base64.RawURLEncoding.EncodeToString([]byte(`{"sub":"u_1","role":"admin","email":"a@b.kz","exp":9999999999}`))
	if _, err := ValidateJWT(parts[0]+"."+forged+"."+parts[2], secret); err == nil {
		t.Error("принят токен с подменённой ролью")
	}

	// «alg: none» и пустая подпись
	none := base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"none","typ":"JWT"}`))
	if _, err := ValidateJWT(none+"."+forged+".", secret); err == nil {
		t.Error("принят токен без подписи")
	}

	for _, bad := range []string{"", "abc", "a.b", "a.b.c.d"} {
		if _, err := ValidateJWT(bad, secret); err == nil {
			t.Errorf("принят мусор вместо токена: %q", bad)
		}
	}
}

// Счётчик неверных паролей: блокирует после лимита, не трогает другие ключи, сбрасывается входом и временем.
func TestAttemptLimiter(t *testing.T) {
	l := NewAttemptLimiter(3, 80*time.Millisecond)
	if blocked, _ := l.Blocked("a@b.kz"); blocked {
		t.Fatal("новый ключ не должен быть заблокирован")
	}
	l.Fail("a@b.kz")
	l.Fail("a@b.kz")
	if blocked, _ := l.Blocked("a@b.kz"); blocked {
		t.Fatal("блокировка раньше лимита")
	}
	l.Fail("a@b.kz")
	blocked, wait := l.Blocked("a@b.kz")
	if !blocked || wait <= 0 {
		t.Fatalf("после 3 неудач ключ должен быть заблокирован: %v %v", blocked, wait)
	}
	if other, _ := l.Blocked("other@b.kz"); other {
		t.Fatal("заблокирован чужой ключ")
	}

	l.Reset("a@b.kz")
	if blocked, _ := l.Blocked("a@b.kz"); blocked {
		t.Fatal("успешный вход должен сбрасывать счётчик")
	}

	for i := 0; i < 3; i++ {
		l.Fail("c@b.kz")
	}
	time.Sleep(120 * time.Millisecond)
	if blocked, _ := l.Blocked("c@b.kz"); blocked {
		t.Fatal("блокировка должна сниматься по истечении окна")
	}
}
