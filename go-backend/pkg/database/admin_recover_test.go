package database

import (
	"fmt"
	"os"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/middleware"
)

func TestRecoverAdmin(t *testing.T) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		t.Skip("TEST_DATABASE_URL не задан")
	}
	if DB == nil {
		if err := InitDB(url); err != nil {
			t.Fatal(err)
		}
	}
	email := fmt.Sprintf("recover_%d@test.kz", time.Now().UnixNano())
	t.Cleanup(func() { _, _ = DB.Exec(`DELETE FROM users WHERE email=$1`, email) })
	check, hash := middleware.CheckPassword, middleware.HashPassword

	res, err := RecoverAdmin(email, "First-pass-1", check, hash)
	if err != nil || res != "created" {
		t.Fatalf("создание: %q %v", res, err)
	}
	u, _ := GetUserByEmail(email)
	if u == nil || u.Role != "admin" || !check("First-pass-1", u.PasswordHash) {
		t.Fatalf("администратор не создан как надо: %+v", u)
	}
	if res, _ := RecoverAdmin(email, "First-pass-1", check, hash); res != "unchanged" {
		t.Errorf("повторный запуск с тем же паролем должен ничего не менять: %q", res)
	}
	// разжалованный администратор с забытым паролем
	_, _ = DB.Exec(`UPDATE users SET role='customer' WHERE email=$1`, email)
	if res, _ := RecoverAdmin(email, "Second-pass-2", check, hash); res != "updated" {
		t.Errorf("смена пароля и роли: %q", res)
	}
	u, _ = GetUserByEmail(email)
	if u.Role != "admin" || !check("Second-pass-2", u.PasswordHash) || check("First-pass-1", u.PasswordHash) {
		t.Errorf("после восстановления: роль %s, новый пароль %v", u.Role, check("Second-pass-2", u.PasswordHash))
	}
	var changed int64
	_ = DB.QueryRow(`SELECT password_changed_unix FROM users WHERE email=$1`, email).Scan(&changed)
	if changed == 0 {
		t.Error("старые сессии должны быть отозваны")
	}
	// почта без учёта регистра
	if res, _ := RecoverAdmin("  "+string([]rune(email))+" ", "Second-pass-2", check, hash); res != "unchanged" {
		t.Errorf("почта с пробелами: %q", res)
	}
}
