package database

import (
	"database/sql"
	"errors"
)

// VipProject — рабочий проект модуля «Строительство зданий и сооружений»: график работ, штат,
// техника, бригады, фото и видео. Документ целиком лежит в data (JSON), версия растёт при каждом
// сохранении — по ней сервер замечает, что двое правили проект одновременно.
type VipProject struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Version   int    `json:"version"`
	Data      []byte `json:"-"`
	CreatedBy string `json:"-"`
	UpdatedAt string `json:"updatedAt"`
	// сводка для списка
	Works     int    `json:"works"`
	Staff     int    `json:"staff"`
	Equipment int    `json:"equipment"`
	StartDate string `json:"startDate"`
}

// ErrVersionConflict — проект успели изменить с другого устройства
var ErrVersionConflict = errors.New("version conflict")

func runVipMigrations() error {
	_, err := DB.Exec(`CREATE TABLE IF NOT EXISTS vip_projects (
		id TEXT PRIMARY KEY,
		name TEXT NOT NULL,
		data JSONB NOT NULL,
		version INTEGER NOT NULL DEFAULT 1,
		created_by TEXT NOT NULL DEFAULT '',
		created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`)
	return err
}

const vipTime = `to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`

// ListVipProjects returns projects without the heavy document, newest first
func ListVipProjects() ([]*VipProject, error) {
	rows, err := DB.Query(`SELECT id, name, version, ` + vipTime + `,
		COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(data->'works') = 'array' THEN data->'works' END), 0),
		COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(data->'staff') = 'array' THEN data->'staff' END), 0),
		COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(data->'equipment') = 'array' THEN data->'equipment' END), 0),
		COALESCE(data->>'startDate', '')
		FROM vip_projects ORDER BY updated_at DESC LIMIT 200`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []*VipProject{}
	for rows.Next() {
		p := &VipProject{}
		if err := rows.Scan(&p.ID, &p.Name, &p.Version, &p.UpdatedAt, &p.Works, &p.Staff, &p.Equipment, &p.StartDate); err != nil {
			return nil, err
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// CountVipProjects reports how many projects are stored
func CountVipProjects() (int, error) {
	var n int
	err := DB.QueryRow(`SELECT COUNT(*) FROM vip_projects`).Scan(&n)
	return n, err
}

// GetVipProject loads one project with its document
func GetVipProject(id string) (*VipProject, error) {
	p := &VipProject{}
	err := DB.QueryRow(`SELECT id, name, version, `+vipTime+`, data FROM vip_projects WHERE id=$1`, id).
		Scan(&p.ID, &p.Name, &p.Version, &p.UpdatedAt, &p.Data)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return p, err
}

// CreateVipProject stores a new project and fills ID, Version and UpdatedAt
func CreateVipProject(p *VipProject) error {
	p.ID = newID("vip")
	p.Version = 1
	return DB.QueryRow(`INSERT INTO vip_projects (id, name, data, created_by) VALUES ($1,$2,$3,$4) RETURNING `+vipTime,
		p.ID, p.Name, p.Data, p.CreatedBy).Scan(&p.UpdatedAt)
}

// UpdateVipProject saves the document only if nobody changed it since the caller loaded it
// (expectedVersion). Returns ErrVersionConflict otherwise, ErrNotFound if the project is gone.
func UpdateVipProject(p *VipProject, expectedVersion int) error {
	err := DB.QueryRow(`UPDATE vip_projects SET name=$2, data=$3, version=version+1, updated_at=now()
		WHERE id=$1 AND version=$4 RETURNING version, `+vipTime,
		p.ID, p.Name, p.Data, expectedVersion).Scan(&p.Version, &p.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		var exists bool
		if e := DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM vip_projects WHERE id=$1)`, p.ID).Scan(&exists); e != nil {
			return e
		}
		if exists {
			return ErrVersionConflict
		}
		return ErrNotFound
	}
	return err
}

// DeleteVipProject removes a project
func DeleteVipProject(id string) error {
	res, err := DB.Exec(`DELETE FROM vip_projects WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}
