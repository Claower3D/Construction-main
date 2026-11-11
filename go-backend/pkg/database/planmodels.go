package database

import (
	"database/sql"
	"errors"
)

// PlanModel is a saved «План → 3D» project. Data holds the validated project JSON.
type PlanModel struct {
	ID        string  `json:"id"`
	OwnerID   string  `json:"-"`
	Name      string  `json:"name"`
	Floors    int     `json:"floors"`
	Walls     int     `json:"walls"`
	Area      float64 `json:"area"`
	Data      []byte  `json:"-"`
	UpdatedAt string  `json:"updatedAt"`
}

func runPlanModelMigrations() error {
	for _, m := range []string{
		`CREATE TABLE IF NOT EXISTS plan_models (
			id TEXT PRIMARY KEY,
			owner_id TEXT NOT NULL,
			name TEXT NOT NULL,
			floors INTEGER NOT NULL DEFAULT 1,
			walls INTEGER NOT NULL DEFAULT 0,
			area DOUBLE PRECISION NOT NULL DEFAULT 0,
			data JSONB NOT NULL,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_plan_models_owner ON plan_models(owner_id, updated_at DESC)`,
	} {
		if _, err := DB.Exec(m); err != nil {
			return err
		}
	}
	return nil
}

const planModelCols = `id, owner_id, name, floors, walls, area, to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`

// ListPlanModels returns the owner's models without the heavy data column, newest first
func ListPlanModels(ownerID string) ([]*PlanModel, error) {
	rows, err := DB.Query(`SELECT `+planModelCols+` FROM plan_models WHERE owner_id=$1 ORDER BY updated_at DESC LIMIT 200`, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []*PlanModel{}
	for rows.Next() {
		m := &PlanModel{}
		if err := rows.Scan(&m.ID, &m.OwnerID, &m.Name, &m.Floors, &m.Walls, &m.Area, &m.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, m)
	}
	return out, rows.Err()
}

// CountPlanModels reports how many models the owner already keeps
func CountPlanModels(ownerID string) (int, error) {
	var n int
	err := DB.QueryRow(`SELECT COUNT(*) FROM plan_models WHERE owner_id=$1`, ownerID).Scan(&n)
	return n, err
}

// GetPlanModel loads one model with its data
func GetPlanModel(id string) (*PlanModel, error) {
	m := &PlanModel{}
	err := DB.QueryRow(`SELECT `+planModelCols+`, data FROM plan_models WHERE id=$1`, id).
		Scan(&m.ID, &m.OwnerID, &m.Name, &m.Floors, &m.Walls, &m.Area, &m.UpdatedAt, &m.Data)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return m, err
}

// CreatePlanModel stores a new model and fills ID and UpdatedAt
func CreatePlanModel(m *PlanModel) error {
	m.ID = newID("pm")
	return DB.QueryRow(`INSERT INTO plan_models (id, owner_id, name, floors, walls, area, data) VALUES ($1,$2,$3,$4,$5,$6,$7)
		RETURNING to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
		m.ID, m.OwnerID, m.Name, m.Floors, m.Walls, m.Area, m.Data).Scan(&m.UpdatedAt)
}

// UpdatePlanModel overwrites a model; only its owner may do that
func UpdatePlanModel(m *PlanModel) error {
	err := DB.QueryRow(`UPDATE plan_models SET name=$3, floors=$4, walls=$5, area=$6, data=$7, updated_at=now()
		WHERE id=$1 AND owner_id=$2 RETURNING to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`,
		m.ID, m.OwnerID, m.Name, m.Floors, m.Walls, m.Area, m.Data).Scan(&m.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return ErrNotFound
	}
	return err
}

// DeletePlanModel removes a model
func DeletePlanModel(id string) error {
	res, err := DB.Exec(`DELETE FROM plan_models WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}
