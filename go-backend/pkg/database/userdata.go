package database

import (
	"database/sql"
	"time"
)

// UserData keeps a signed-in user's site data (calendar, objects, notifications, history…)
// on the server so it follows them to every device instead of living in one browser.

// UserDataMeta describes one stored key without its value
type UserDataMeta struct {
	Key       string `json:"key"`
	UpdatedAt int64  `json:"updatedAt"` // unix milliseconds
	Size      int    `json:"size"`
}

func runUserDataMigrations() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS user_data (
		user_id TEXT NOT NULL,
		key TEXT NOT NULL,
		value TEXT NOT NULL,
		updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
		PRIMARY KEY (user_id, key)
	)`)
	return err
}

func ListUserData(userID string) ([]UserDataMeta, error) {
	rows, err := DB.Query(`SELECT key, updated_at, length(value) FROM user_data WHERE user_id = $1 ORDER BY key`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []UserDataMeta{}
	for rows.Next() {
		var m UserDataMeta
		var t time.Time
		if err := rows.Scan(&m.Key, &t, &m.Size); err == nil {
			m.UpdatedAt = t.UnixMilli()
			out = append(out, m)
		}
	}
	return out, rows.Err()
}

// GetUserData returns value and update time; found=false when the key is not stored
func GetUserData(userID, key string) (value string, updatedAt int64, found bool, err error) {
	var t time.Time
	err = DB.QueryRow(`SELECT value, updated_at FROM user_data WHERE user_id = $1 AND key = $2`, userID, key).Scan(&value, &t)
	if err == sql.ErrNoRows {
		return "", 0, false, nil
	}
	if err != nil {
		return "", 0, false, err
	}
	return value, t.UnixMilli(), true, nil
}

// UserDataTotal returns the bytes stored for a user, excluding one key (the one being replaced)
func UserDataTotal(userID, exceptKey string) (int, error) {
	var n int
	err := DB.QueryRow(`SELECT COALESCE(SUM(length(value)),0) FROM user_data WHERE user_id = $1 AND key <> $2`, userID, exceptKey).Scan(&n)
	return n, err
}

func PutUserData(userID, key, value string) (int64, error) {
	var t time.Time
	err := DB.QueryRow(`INSERT INTO user_data (user_id, key, value, updated_at) VALUES ($1,$2,$3,now())
		ON CONFLICT (user_id, key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
		RETURNING updated_at`, userID, key, value).Scan(&t)
	if err != nil {
		return 0, err
	}
	return t.UnixMilli(), nil
}

func DeleteUserData(userID, key string) error {
	_, err := DB.Exec(`DELETE FROM user_data WHERE user_id = $1 AND key = $2`, userID, key)
	return err
}
