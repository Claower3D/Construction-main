package database

import (
	"database/sql"
	"errors"
	"time"
)

// Передача входа между доменами сайта. Домен, где человек уже вошёл, получает одноразовый код для
// соседнего домена; тот меняет код на свою сессию. В базе лежит только хеш кода, код живёт минуту
// и удаляется при первом же использовании.

// ErrSsoCode — кода нет, он уже использован или просрочен
var ErrSsoCode = errors.New("sso code is not valid")

// SaveSsoCode запоминает хеш кода для пользователя и домена назначения; заодно убирает просроченные.
// sessionExp — когда заканчивается сессия, от которой выдан код: новая сессия проживёт не дольше.
func SaveSsoCode(codeHash, userID, target string, expiresUnix, sessionExp int64) error {
	if _, err := DB.Exec(`DELETE FROM sso_codes WHERE expires_unix < $1`, time.Now().Unix()); err != nil {
		return err
	}
	_, err := DB.Exec(`INSERT INTO sso_codes (code_hash, user_id, target, expires_unix, session_exp) VALUES ($1,$2,$3,$4,$5)`,
		codeHash, userID, target, expiresUnix, sessionExp)
	return err
}

// TakeSsoCode забирает код: строка удаляется одним запросом, поэтому второй раз тот же код не сработает
func TakeSsoCode(codeHash string) (userID, target string, sessionExp int64, err error) {
	var expires int64
	err = DB.QueryRow(`DELETE FROM sso_codes WHERE code_hash=$1 RETURNING user_id, target, expires_unix, session_exp`, codeHash).
		Scan(&userID, &target, &expires, &sessionExp)
	if errors.Is(err, sql.ErrNoRows) {
		return "", "", 0, ErrSsoCode
	}
	if err != nil {
		return "", "", 0, err
	}
	if expires < time.Now().Unix() {
		return "", "", 0, ErrSsoCode
	}
	return userID, target, sessionExp, nil
}
