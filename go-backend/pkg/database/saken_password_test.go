package database

import (
	"crypto/sha256"
	"encoding/hex"
	"strings"
	"testing"
)

// Проверяем, что отпечаток в коде действительно соответствует паролю, который владелец
// передал сотруднику. Считаем так же, как middleware.CheckPassword: sha256(соль + пароль).
func TestSakenPasswordHashMatches(t *testing.T) {
	const password = "saken123"

	parts := strings.SplitN(sakenPasswordHash, ":", 2)
	if len(parts) != 2 {
		t.Fatalf("отпечаток должен быть вида соль:хеш, получили %q", sakenPasswordHash)
	}
	salt, err := hex.DecodeString(parts[0])
	if err != nil {
		t.Fatalf("соль не читается: %v", err)
	}
	h := sha256.New()
	h.Write(salt)
	h.Write([]byte(password))
	if got := hex.EncodeToString(h.Sum(nil)); got != parts[1] {
		t.Fatalf("пароль %q не подходит к отпечатку: посчитали %s, в коде %s", password, got, parts[1])
	}
}
