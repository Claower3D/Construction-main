package database

import (
	"database/sql"
	"time"
)

// Учебные примеры для своей модели дефектов: фото + зоны, проверенные человеком на сайте.

// DefectSample is one training example
type DefectSample struct {
	ID        string
	UserID    string
	Width     int
	Height    int
	Photo     []byte
	Zones     string // JSON: [{"cls":0,"x":..,"y":..,"w":..,"h":..,"origin":"model|manual|vision"}]
	Source    string
	CreatedAt time.Time
}

func runDefectSampleMigrations() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS defect_samples (
		id TEXT PRIMARY KEY,
		user_id TEXT NOT NULL,
		width INTEGER NOT NULL,
		height INTEGER NOT NULL,
		photo BYTEA NOT NULL,
		zones TEXT NOT NULL,
		source TEXT NOT NULL DEFAULT '',
		created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`)
	return err
}

// SaveDefectSample inserts a sample or replaces the zones of the same photo saved earlier
func SaveDefectSample(s *DefectSample) error {
	_, err := DB.Exec(`INSERT INTO defect_samples (id, user_id, width, height, photo, zones, source)
		VALUES ($1,$2,$3,$4,$5,$6,$7)
		ON CONFLICT (id) DO UPDATE SET zones = EXCLUDED.zones, source = EXCLUDED.source, updated_at = now()`,
		s.ID, s.UserID, s.Width, s.Height, s.Photo, s.Zones, s.Source)
	return err
}

func CountDefectSamples() (total int, last *time.Time, err error) {
	var t sql.NullTime
	err = DB.QueryRow(`SELECT COUNT(*), MAX(updated_at) FROM defect_samples`).Scan(&total, &t)
	if t.Valid {
		last = &t.Time
	}
	return total, last, err
}

func CountDefectSamplesByUser(userID string) (int, error) {
	var n int
	err := DB.QueryRow(`SELECT COUNT(*) FROM defect_samples WHERE user_id = $1`, userID).Scan(&n)
	return n, err
}

// ListDefectSampleZones returns id+zones of every sample (without photos) for statistics
func ListDefectSampleZones() (map[string]string, error) {
	rows, err := DB.Query(`SELECT id, zones FROM defect_samples`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]string{}
	for rows.Next() {
		var id, z string
		if err := rows.Scan(&id, &z); err == nil {
			out[id] = z
		}
	}
	return out, rows.Err()
}

// EachDefectSample streams samples one by one (photos can be large)
func EachDefectSample(fn func(*DefectSample) error) error {
	rows, err := DB.Query(`SELECT id, user_id, width, height, photo, zones, source, created_at FROM defect_samples ORDER BY created_at`)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		s := &DefectSample{}
		if err := rows.Scan(&s.ID, &s.UserID, &s.Width, &s.Height, &s.Photo, &s.Zones, &s.Source, &s.CreatedAt); err != nil {
			return err
		}
		if err := fn(s); err != nil {
			return err
		}
	}
	return rows.Err()
}

func DeleteDefectSample(id string) (int64, error) {
	res, err := DB.Exec(`DELETE FROM defect_samples WHERE id = $1`, id)
	if err != nil {
		return 0, err
	}
	return res.RowsAffected()
}
