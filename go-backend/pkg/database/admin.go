package database

import (
	"database/sql"
	"fmt"
	"strings"
	"time"
)

// Данные для мобильной админки: только чтение агрегатов, список пользователей,
// смена роли, подтверждение специалиста и журнал действий администраторов.

// DayCount — значение за один день (дата в формате 2006-01-02)
type DayCount struct {
	Date  string `json:"date"`
	Count int    `json:"count"`
}

// AdminOverview — сводка для экрана «Обзор»
type AdminOverview struct {
	GeneratedAt string `json:"generatedAt"`
	Days        int    `json:"days"`
	Users       struct {
		Total       int            `json:"total"`
		ByRole      map[string]int `json:"byRole"`
		New7        int            `json:"new7"`
		New30       int            `json:"new30"`
		PerDay      []DayCount     `json:"perDay"`
		Unverified  int            `json:"unverified"`
		Marketing   int            `json:"marketingOptIn"`
		PassChanged int            `json:"passwordChanged"`
	} `json:"users"`
	Orders struct {
		Total        int            `json:"total"`
		ByStatus     map[string]int `json:"byStatus"`
		New7         int            `json:"new7"`
		PerDay       []DayCount     `json:"perDay"`
		SumTotal     float64        `json:"sumTotal"`
		AvgSum       float64        `json:"avgSum"`
		WithEngineer int            `json:"withEngineer"`
	} `json:"orders"`
	Market struct {
		Equipment      int            `json:"equipment"`
		MaterialOffers int            `json:"materialOffers"`
		Bookings       int            `json:"bookings"`
		BookingsBy     map[string]int `json:"bookingsByStatus"`
		BookingsSum    float64        `json:"bookingsSum"`
		Brigades       int            `json:"brigades"`
	} `json:"market"`
	Disputes struct {
		Total int `json:"total"`
		Open  int `json:"open"`
	} `json:"disputes"`
	Chat struct {
		Messages7 int `json:"messages7"`
	} `json:"chat"`
}

func scalarInt(q string, args ...interface{}) int {
	var n sql.NullInt64
	if err := DB.QueryRow(q, args...).Scan(&n); err != nil {
		return 0
	}
	return int(n.Int64)
}

func groupCounts(q string) map[string]int {
	out := map[string]int{}
	rows, err := DB.Query(q)
	if err != nil {
		return out
	}
	defer rows.Close()
	for rows.Next() {
		var k sql.NullString
		var n int
		if rows.Scan(&k, &n) == nil {
			key := strings.TrimSpace(k.String)
			if key == "" {
				key = "—"
			}
			out[key] += n
		}
	}
	return out
}

// perDay — число записей по дням за последние days дней, включая дни с нулём
func perDay(table string, days int) []DayCount {
	since := time.Now().AddDate(0, 0, -(days - 1))
	start := time.Date(since.Year(), since.Month(), since.Day(), 0, 0, 0, 0, time.Local)
	counts := map[string]int{}
	rows, err := DB.Query(fmt.Sprintf(`SELECT to_char(created_at, 'YYYY-MM-DD'), COUNT(*) FROM %s
		WHERE created_at >= $1 GROUP BY 1`, table), start)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var d string
			var n int
			if rows.Scan(&d, &n) == nil {
				counts[d] = n
			}
		}
	}
	out := make([]DayCount, 0, days)
	for i := 0; i < days; i++ {
		d := start.AddDate(0, 0, i).Format("2006-01-02")
		out = append(out, DayCount{Date: d, Count: counts[d]})
	}
	return out
}

// GetAdminOverview собирает сводку платформы за days дней
func GetAdminOverview(days int) AdminOverview {
	if days < 7 {
		days = 7
	}
	if days > 90 {
		days = 90
	}
	var o AdminOverview
	o.GeneratedAt = time.Now().Format(time.RFC3339)
	o.Days = days

	o.Users.Total = scalarInt(`SELECT COUNT(*) FROM users`)
	o.Users.ByRole = groupCounts(`SELECT role, COUNT(*) FROM users GROUP BY role`)
	o.Users.New7 = scalarInt(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`)
	o.Users.New30 = scalarInt(`SELECT COUNT(*) FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`)
	o.Users.PerDay = perDay("users", days)
	o.Users.Unverified = scalarInt(`SELECT COUNT(*) FROM users WHERE role IN ('engineer','company','executor') AND verified_at IS NULL`)
	o.Users.Marketing = scalarInt(`SELECT COUNT(*) FROM users WHERE marketing_opt_in`)
	o.Users.PassChanged = scalarInt(`SELECT COUNT(*) FROM users WHERE password_changed_unix > 0`)

	o.Orders.Total = scalarInt(`SELECT COUNT(*) FROM orders`)
	o.Orders.ByStatus = groupCounts(`SELECT status, COUNT(*) FROM orders GROUP BY status`)
	o.Orders.New7 = scalarInt(`SELECT COUNT(*) FROM orders WHERE created_at >= NOW() - INTERVAL '7 days'`)
	o.Orders.PerDay = perDay("orders", days)
	var sum, avg sql.NullFloat64
	_ = DB.QueryRow(`SELECT COALESCE(SUM(total_sum),0), COALESCE(AVG(NULLIF(total_sum,0)),0) FROM orders`).Scan(&sum, &avg)
	o.Orders.SumTotal, o.Orders.AvgSum = sum.Float64, avg.Float64
	o.Orders.WithEngineer = scalarInt(`SELECT COUNT(*) FROM orders WHERE COALESCE(engineer_id,'') <> ''`)

	o.Market.Equipment = scalarInt(`SELECT COUNT(*) FROM equipment`)
	o.Market.MaterialOffers = scalarInt(`SELECT COUNT(*) FROM material_offers`)
	o.Market.Bookings = scalarInt(`SELECT COUNT(*) FROM equipment_bookings`)
	o.Market.BookingsBy = groupCounts(`SELECT status, COUNT(*) FROM equipment_bookings GROUP BY status`)
	var bsum sql.NullFloat64
	_ = DB.QueryRow(`SELECT COALESCE(SUM(total),0) FROM equipment_bookings`).Scan(&bsum)
	o.Market.BookingsSum = bsum.Float64
	o.Market.Brigades = scalarInt(`SELECT COUNT(*) FROM brigades`)

	o.Disputes.Total = scalarInt(`SELECT COUNT(*) FROM disputes`)
	o.Disputes.Open = scalarInt(`SELECT COUNT(*) FROM disputes WHERE status IN ('Открыт','open','В работе')`)
	o.Chat.Messages7 = scalarInt(`SELECT COUNT(*) FROM chat_messages WHERE created_at >= NOW() - INTERVAL '7 days'`)
	return o
}

// AdminUser — строка списка пользователей (без хеша пароля)
type AdminUser struct {
	ID              string `json:"id"`
	Email           string `json:"email"`
	Name            string `json:"name"`
	Role            string `json:"role"`
	Phone           string `json:"phone"`
	City            string `json:"city"`
	Company         string `json:"company"`
	CreatedAt       string `json:"createdAt"`
	VerifiedAt      string `json:"verifiedAt"`
	PasswordChanged bool   `json:"passwordChanged"`
	Marketing       bool   `json:"marketingOptIn"`
}

const adminUserCols = `id, COALESCE(email,''), COALESCE(name,''), COALESCE(role,''), COALESCE(phone,''),
	COALESCE(city,''), COALESCE(company,''), created_at, verified_at, password_changed_unix > 0, COALESCE(marketing_opt_in,false)`

func scanAdminUser(sc interface{ Scan(...interface{}) error }) (AdminUser, error) {
	var u AdminUser
	var created, verified sql.NullTime
	if err := sc.Scan(&u.ID, &u.Email, &u.Name, &u.Role, &u.Phone, &u.City, &u.Company, &created, &verified, &u.PasswordChanged, &u.Marketing); err != nil {
		return u, err
	}
	if created.Valid {
		u.CreatedAt = created.Time.Format(time.RFC3339)
	}
	if verified.Valid {
		u.VerifiedAt = verified.Time.Format(time.RFC3339)
	}
	return u, nil
}

// ListAdminUsers — поиск по имени, почте, телефону, компании; фильтр по роли;
// unverified=true — только специалисты (инженер, компания, исполнитель) без подтверждения
func ListAdminUsers(q, role string, unverified bool, limit, offset int) ([]AdminUser, int, error) {
	where := []string{"TRUE"}
	args := []interface{}{}
	if q = strings.TrimSpace(q); q != "" {
		args = append(args, "%"+strings.ToLower(q)+"%")
		n := len(args)
		where = append(where, fmt.Sprintf(`(LOWER(COALESCE(name,'')) LIKE $%d OR LOWER(COALESCE(email,'')) LIKE $%d
			OR LOWER(COALESCE(phone,'')) LIKE $%d OR LOWER(COALESCE(company,'')) LIKE $%d)`, n, n, n, n))
	}
	if role != "" {
		args = append(args, role)
		where = append(where, fmt.Sprintf("role = $%d", len(args)))
	}
	if unverified {
		where = append(where, `role IN ('engineer','company','executor') AND verified_at IS NULL`)
	}
	cond := strings.Join(where, " AND ")
	total := scalarInt(`SELECT COUNT(*) FROM users WHERE `+cond, args...)
	args = append(args, limit, offset)
	rows, err := DB.Query(fmt.Sprintf(`SELECT %s FROM users WHERE %s ORDER BY created_at DESC NULLS LAST, id
		LIMIT $%d OFFSET $%d`, adminUserCols, cond, len(args)-1, len(args)), args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	out := []AdminUser{}
	for rows.Next() {
		u, err := scanAdminUser(rows)
		if err != nil {
			return nil, 0, err
		}
		out = append(out, u)
	}
	return out, total, rows.Err()
}

// GetAdminUser — один пользователь
func GetAdminUser(id string) (AdminUser, error) {
	return scanAdminUser(DB.QueryRow(`SELECT `+adminUserCols+` FROM users WHERE id=$1`, id))
}

// SetUserRole меняет роль и отзывает все текущие сессии пользователя
// (в выданных токенах записана старая роль)
func SetUserRole(id, role string, revokeUnix int64) error {
	res, err := DB.Exec(`UPDATE users SET role=$1, sessions_revoked_unix=GREATEST(sessions_revoked_unix,$2) WHERE id=$3`, role, revokeUnix, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// SetUserVerified ставит или снимает отметку «специалист подтверждён»
func SetUserVerified(id string, verified bool) error {
	q := `UPDATE users SET verified_at=NOW() WHERE id=$1`
	if !verified {
		q = `UPDATE users SET verified_at=NULL WHERE id=$1`
	}
	res, err := DB.Exec(q, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// CountAdmins — сколько администраторов (последнего нельзя разжаловать)
func CountAdmins() int { return scalarInt(`SELECT COUNT(*) FROM users WHERE role='admin'`) }

// AuditEntry — запись журнала действий администратора
type AuditEntry struct {
	ID         int64  `json:"id"`
	At         string `json:"at"`
	ActorID    string `json:"actorId"`
	ActorEmail string `json:"actorEmail"`
	Action     string `json:"action"`
	Target     string `json:"target"`
	Details    string `json:"details"`
}

// AddAudit записывает действие администратора; ошибка записи не мешает самому действию
func AddAudit(actorID, actorEmail, action, target, details string) {
	_, _ = DB.Exec(`INSERT INTO admin_audit (actor_id, actor_email, action, target, details) VALUES ($1,$2,$3,$4,$5)`,
		actorID, actorEmail, action, target, details)
}

// ListAudit — последние записи журнала
func ListAudit(limit int) ([]AuditEntry, error) {
	rows, err := DB.Query(`SELECT id, at, actor_id, actor_email, action, target, details FROM admin_audit ORDER BY id DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []AuditEntry{}
	for rows.Next() {
		var e AuditEntry
		var at time.Time
		if err := rows.Scan(&e.ID, &at, &e.ActorID, &e.ActorEmail, &e.Action, &e.Target, &e.Details); err != nil {
			return nil, err
		}
		e.At = at.Format(time.RFC3339)
		out = append(out, e)
	}
	return out, rows.Err()
}
