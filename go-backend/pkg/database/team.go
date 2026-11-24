package database

import (
	"log"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/models"
)

// Команда: фирмы, их бригады и работники. Работник — обычный пользователь; привязка к фирме — users.company_id.
// Администратор может завести работника заранее (invited_at > 0, пароля ещё нет): пароль человек
// задаёт сам при первом входе.

func ensureTeamColumns() {
	for _, q := range []string{
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id TEXT NOT NULL DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at BIGINT NOT NULL DEFAULT 0`,
	} {
		if _, err := DB.Exec(q); err != nil {
			log.Printf("[PostgreSQL] team columns: %v", err)
		}
	}
}

// TeamPerson — работник в списках команды (без email и служебных полей)
type TeamPerson struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	Phone     string `json:"phone,omitempty"`
	City      string `json:"city,omitempty"`
	Company   string `json:"company,omitempty"`
	CompanyID string `json:"companyId,omitempty"`
	Invited   bool   `json:"invited,omitempty"` // заведён администратором, ещё ни разу не входил
}

// ListTeamPeople — исполнители, инженеры и подрядчики (те, кого назначают на объект)
func ListTeamPeople() ([]TeamPerson, error) {
	rows, err := DB.Query(`SELECT id, COALESCE(name,''), role, COALESCE(phone,''), COALESCE(city,''), COALESCE(company,''),
		COALESCE(company_id,''), (COALESCE(password_hash,'') = '' AND invited_at > 0)
		FROM users WHERE role IN ('executor','engineer','company') ORDER BY LOWER(COALESCE(name,'')), id`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []TeamPerson{}
	for rows.Next() {
		var p TeamPerson
		if err := rows.Scan(&p.ID, &p.Name, &p.Role, &p.Phone, &p.City, &p.Company, &p.CompanyID, &p.Invited); err == nil {
			out = append(out, p)
		}
	}
	return out, rows.Err()
}

// UserCompanyID — фирма пользователя (” — одиночка)
func UserCompanyID(userID string) string {
	var id string
	_ = DB.QueryRow(`SELECT COALESCE(company_id,'') FROM users WHERE id = $1`, userID).Scan(&id)
	return id
}

func GetCompany(id string) (*models.Company, error) {
	c := &models.Company{}
	err := DB.QueryRow("SELECT id,name,bin,city,address,phone,email,director,type,status,created_at FROM companies WHERE id = $1", id).
		Scan(&c.ID, &c.Name, &c.BIN, &c.City, &c.Address, &c.Phone, &c.Email, &c.Director, &c.Type, &c.Status, &c.CreatedAt)
	if err != nil {
		return nil, err
	}
	return c, nil
}

func CompanyNameTaken(name, exceptID string) bool {
	var n int
	_ = DB.QueryRow(`SELECT COUNT(*) FROM companies WHERE LOWER(name) = LOWER($1) AND id <> $2`, strings.TrimSpace(name), exceptID).Scan(&n)
	return n > 0
}

func UpdateCompany(c *models.Company) error {
	if _, err := DB.Exec(`UPDATE companies SET name=$2, bin=$3, city=$4, phone=$5, director=$6, type=$7 WHERE id=$1`,
		c.ID, c.Name, c.BIN, c.City, c.Phone, c.Director, c.Type); err != nil {
		return err
	}
	// название фирмы хранится и в карточках работников — держим в согласии
	_, err := DB.Exec(`UPDATE users SET company = $2 WHERE company_id = $1`, c.ID, c.Name)
	return err
}

// CreateInvitedUser заводит работника без пароля: пароль он задаст при первом входе.
func CreateInvitedUser(u *models.User, companyID string) error {
	_, err := DB.Exec(`INSERT INTO users (id,email,name,password_hash,role,phone,city,company,created_at,company_id,invited_at)
		VALUES ($1,$2,$3,'',$4,$5,$6,$7,$8,$9,$10)`,
		u.ID, u.Email, u.Name, u.Role, u.Phone, u.City, u.Company, u.CreatedAt, companyID, time.Now().Unix())
	return err
}

// IsInvitedWithoutPassword — аккаунт завёл администратор, и в него ещё не входили
func IsInvitedWithoutPassword(userID string) bool {
	var ok bool
	_ = DB.QueryRow(`SELECT (COALESCE(password_hash,'') = '' AND invited_at > 0) FROM users WHERE id = $1`, userID).Scan(&ok)
	return ok
}

func SetUserCompany(userID, companyID, companyName string) error {
	_, err := DB.Exec(`UPDATE users SET company_id = $2, company = $3 WHERE id = $1`, userID, companyID, companyName)
	return err
}

// CompanyHeadcount — сколько работников числится в каждой фирме
func CompanyHeadcount() map[string]int {
	out := map[string]int{}
	rows, err := DB.Query(`SELECT company_id, COUNT(*) FROM users WHERE COALESCE(company_id,'') <> '' GROUP BY company_id`)
	if err != nil {
		return out
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var n int
		if rows.Scan(&id, &n) == nil {
			out[id] = n
		}
	}
	return out
}
