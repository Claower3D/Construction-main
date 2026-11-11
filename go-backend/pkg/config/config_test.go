package config

import "testing"

// Ключ подписи сессий: вшитого в код значения больше нет ни при каких настройках.
func TestResolveJWTSecret(t *testing.T) {
	const db = "postgres://user:pass@db.internal:5432/app"

	// свой надёжный ключ используется как есть
	if s, src := ResolveJWTSecret("9f3c1b7e5d2a4c6e8f0a1b3c5d7e9f10", db); src != "env" || s != "9f3c1b7e5d2a4c6e8f0a1b3c5d7e9f10" {
		t.Fatalf("надёжный JWT_SECRET должен использоваться как есть: %q %s", s, src)
	}

	// заглушки из примеров, старый вшитый ключ, пустой и короткий — не используются
	for _, weak := range []string{"", "  ", "qazgost-ai-secret-2026-production", "change-me-to-random-string",
		"change-me-in-production", "your-super-secret-key-change-in-production", "your-jwt-secret-here", "short-secret"} {
		s, src := ResolveJWTSecret(weak, db)
		if src != "database" {
			t.Errorf("слабый ключ %q принят как есть (источник %s)", weak, src)
		}
		if s == weak || s == "qazgost-ai-secret-2026-production" || len(s) != 64 {
			t.Errorf("для слабого ключа %q получен небезопасный секрет %q", weak, s)
		}
	}

	// ключ из DATABASE_URL стабилен между перезапусками и зависит от самой строки подключения
	a, _ := ResolveJWTSecret("", db)
	b, _ := ResolveJWTSecret("", db)
	c, _ := ResolveJWTSecret("", db+"2")
	if a != b {
		t.Fatal("ключ из DATABASE_URL должен быть одинаковым при каждом запуске")
	}
	if a == c {
		t.Fatal("разные базы должны давать разные ключи")
	}

	// без ключа и без базы — случайный ключ, каждый раз новый
	r1, src1 := ResolveJWTSecret("", "")
	r2, _ := ResolveJWTSecret("", "")
	if src1 != "random" || r1 == r2 || len(r1) != 64 {
		t.Fatalf("без базы нужен случайный ключ: %s %q %q", src1, r1, r2)
	}
}
