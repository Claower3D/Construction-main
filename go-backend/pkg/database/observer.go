package database

import (
	"log"
	"strings"
	"time"
)

// Наблюдатель — сотрудник, которому владелец открыл просмотр модуля «Застройщик» и панели
// администратора. Менять там он ничего не может: сервер пропускает его только на чтение.
// Роль у него остаётся своя (например, инженер), поэтому её возможности не меняются.

// IsObserver сообщает, открыт ли пользователю просмотр. При сбое базы — нет.
func IsObserver(userID string) bool {
	if userID == "" || DB == nil {
		return false
	}
	var on bool
	if err := DB.QueryRow(`SELECT COALESCE(observer, FALSE) FROM users WHERE id = $1`, userID).Scan(&on); err != nil {
		return false
	}
	return on
}

// SetObserver открывает или закрывает просмотр
func SetObserver(userID string, on bool) error {
	_, err := DB.Exec(`UPDATE users SET observer = $1 WHERE id = $2`, on, userID)
	return err
}

// ensureObserverSaken — разовая правка: инженеру Сакену открыт просмотр «Застройщика» и панели
// администратора (решение владельца, 27.11.2026). Снять можно в панели администратора.
func ensureObserverSaken() {
	const fix = "saken_observer_access"
	if _, err := DB.Exec(`CREATE TABLE IF NOT EXISTS applied_fixes (name TEXT PRIMARY KEY, applied_at BIGINT NOT NULL DEFAULT 0)`); err != nil {
		log.Printf("[PostgreSQL] applied_fixes: %v", err)
		return
	}
	var id, email string
	if err := DB.QueryRow(`SELECT id, COALESCE(email,'') FROM users WHERE LOWER(email) = 'saken@qazgost.kz'`).Scan(&id, &email); err != nil {
		return // аккаунта ещё нет — попробуем при следующем запуске
	}
	res, err := DB.Exec(`INSERT INTO applied_fixes (name, applied_at) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING`, fix, time.Now().Unix())
	if err != nil {
		log.Printf("[PostgreSQL] applied_fixes insert: %v", err)
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return // уже выполнялась: если доступ потом сняли вручную, заново не включаем
	}
	if err := SetObserver(id, true); err != nil {
		log.Printf("[PostgreSQL] observer access: %v", err)
		DB.Exec(`DELETE FROM applied_fixes WHERE name = $1`, fix)
		return
	}
	AddAudit("system", "system", "observer", id, strings.ToLower(email)+": открыт просмотр «Застройщика» и панели администратора (разовая правка)")
	log.Printf("✅ [PostgreSQL] Открыт просмотр для %s", strings.ToLower(email))
}
