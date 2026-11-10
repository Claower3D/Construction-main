package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	_ "github.com/lib/pq"

	"qazgost-ai/backend/pkg/middleware"
	"qazgost-ai/backend/pkg/models"
)

var DB *sql.DB

// InitDB opens PostgreSQL (via DATABASE_URL) and runs migrations
func InitDB(dbURL string) error {
	var err error

	// Determine if we're using Postgres or SQLite
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	if dbURL == "" {
		return fmt.Errorf("DATABASE_URL is not set")
	}

	// Railway internal connections don't support SSL
	if strings.Contains(dbURL, ".railway.internal") && !strings.Contains(dbURL, "sslmode=") {
		if strings.Contains(dbURL, "?") {
			dbURL += "&sslmode=disable"
		} else {
			dbURL += "?sslmode=disable"
		}
	}

	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	DB.SetMaxOpenConns(10)
	DB.SetMaxIdleConns(5)

	// Test connection
	if err := DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	if err := runMigrations(); err != nil {
		return fmt.Errorf("migrations failed: %w", err)
	}

	if err := runCRMMigrations(); err != nil {
		return fmt.Errorf("CRM migrations failed: %w", err)
	}

	if err := runMarketplaceMigrations(); err != nil {
		return fmt.Errorf("marketplace migrations failed: %w", err)
	}

	if err := seedData(); err != nil {
		return fmt.Errorf("seed data failed: %w", err)
	}

	if err := seedCRMData(); err != nil {
		return fmt.Errorf("CRM seed failed: %w", err)
	}

	// Seed inserts orders 101/102 with explicit ids; keep SERIAL ahead of MAX(id),
	// otherwise the 101st order fails with a duplicate key.
	if _, err := DB.Exec(`SELECT setval(pg_get_serial_sequence('orders','id'), GREATEST((SELECT COALESCE(MAX(id),0) FROM orders), 1))`); err != nil {
		log.Printf("[PostgreSQL] orders sequence repair failed: %v", err)
	}

	log.Printf("✅ [PostgreSQL] Database ready")
	return nil
}

func runMigrations() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id TEXT PRIMARY KEY,
			email TEXT UNIQUE NOT NULL,
			name TEXT NOT NULL DEFAULT '',
			password_hash TEXT NOT NULL DEFAULT '',
			role TEXT NOT NULL DEFAULT 'customer',
			phone TEXT DEFAULT '',
			city TEXT DEFAULT '',
			company TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS orders (
			id SERIAL PRIMARY KEY,
			title TEXT NOT NULL DEFAULT '',
			location TEXT DEFAULT '',
			time_range TEXT DEFAULT '',
			type TEXT DEFAULT 'object',
			contractor TEXT DEFAULT '',
			status TEXT DEFAULT 'Запланировано',
			deadline TEXT DEFAULT '',
			job_type TEXT DEFAULT '',
			client_name TEXT DEFAULT '',
			client_phone TEXT DEFAULT '',
			estimate_items TEXT DEFAULT '[]',
			total_sum REAL DEFAULT 0,
			stages TEXT DEFAULT '[]',
			created_by TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			amount NUMERIC(16,2) NOT NULL,
			type TEXT NOT NULL,
			method TEXT DEFAULT '',
			status TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS balances (
			user_id TEXT PRIMARY KEY,
			balance NUMERIC(16,2) DEFAULT 0,
			escrow_locked NUMERIC(16,2) DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS app_flags (
			name TEXT PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS chat_messages (
			id TEXT PRIMARY KEY,
			order_id TEXT DEFAULT '',
			sender_id TEXT DEFAULT '',
			sender_name TEXT DEFAULT '',
			sender_role TEXT DEFAULT '',
			text TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS engineers (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			specialization TEXT DEFAULT '',
			city TEXT DEFAULT '',
			experience TEXT DEFAULT '',
			rating REAL DEFAULT 0,
			certificate TEXT DEFAULT '',
			status TEXT DEFAULT 'Доступен',
			projects_done INTEGER DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS equipment (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			category TEXT DEFAULT '',
			price_per_day REAL DEFAULT 0,
			city TEXT DEFAULT '',
			status TEXT DEFAULT 'Доступен',
			image TEXT DEFAULT ''
		)`,
		`CREATE TABLE IF NOT EXISTS disputes (
			id TEXT PRIMARY KEY,
			order_id TEXT DEFAULT '',
			claimant TEXT DEFAULT '',
			reason TEXT DEFAULT '',
			status TEXT DEFAULT 'Открыт',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
	}

	// Idempotent column additions for existing databases (Railway prod)
	migrations = append(migrations,
		`ALTER TABLE orders ADD COLUMN IF NOT EXISTS engineer_id TEXT DEFAULT ''`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS price_per_hour REAL DEFAULT 0`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS owner_id TEXT DEFAULT ''`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS owner_name TEXT DEFAULT ''`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS owner_phone TEXT DEFAULT ''`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS plate_number TEXT DEFAULT ''`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS capacity TEXT DEFAULT ''`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS rating REAL DEFAULT 0`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0`,
		// согласия при регистрации: версия документов и время согласия
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS consent_version TEXT DEFAULT ''`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP NULL`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMP NULL`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN DEFAULT FALSE`,
		`ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMP NULL`,
	)

	for _, m := range migrations {
		if _, err := DB.Exec(m); err != nil {
			return fmt.Errorf("migration error: %w\nSQL: %s", err, m)
		}
	}
	if err := resetDemoWallets(); err != nil {
		return fmt.Errorf("wallet reset: %w", err)
	}
	log.Println("✅ [PostgreSQL] Migrations complete (8 tables)")
	return nil
}

// resetDemoWallets — один раз переводит кошельки в честный режим (2026-11).
// Онлайн-оплаты ещё не было, поэтому все балансы и операции в базе — демо: стартовые 100 000 ₸,
// «пополнения» без оплаты и тестовые записи. Обнуляем их и переводим суммы из REAL (4-байтное число
// с плавающей точкой — теряло точность на суммах больше ~16,7 млн ₸) в NUMERIC(16,2).
func resetDemoWallets() error {
	const flag = "wallet_demo_reset_2026_11"
	var done bool
	if err := DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM app_flags WHERE name=$1)`, flag).Scan(&done); err != nil {
		return err
	}
	if done {
		return nil
	}
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	for _, q := range []string{
		`ALTER TABLE balances ALTER COLUMN balance TYPE NUMERIC(16,2) USING ROUND(balance::numeric, 2)`,
		`ALTER TABLE balances ALTER COLUMN escrow_locked TYPE NUMERIC(16,2) USING ROUND(escrow_locked::numeric, 2)`,
		`ALTER TABLE transactions ALTER COLUMN amount TYPE NUMERIC(16,2) USING ROUND(amount::numeric, 2)`,
		`UPDATE balances SET balance = 0, escrow_locked = 0`,
		`DELETE FROM transactions`,
	} {
		if _, err := tx.Exec(q); err != nil {
			return fmt.Errorf("%w\nSQL: %s", err, q)
		}
	}
	if _, err := tx.Exec(`INSERT INTO app_flags (name) VALUES ($1)`, flag); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}
	log.Println("✅ [PostgreSQL] Демо-балансы обнулены: кошелёк в честном режиме до подключения онлайн-оплаты")
	return nil
}

func seedData() error {
	// Seed users only if empty
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count > 0 {
		return nil // Already seeded
	}

	log.Println("[PostgreSQL] Seeding initial data...")

	// Users
	seedUsers := []models.User{
		{ID: "u_admin_1", Email: "admin@qazgost.kz", Name: "Администратор QAZGOST AI", PasswordHash: middleware.HashPassword("admin123"), Role: "admin", City: "Караганда", Company: "ТОО «QazGost»"},
		{ID: "u_eng_1", Email: "engineer@qazgost.kz", Name: "Инженер-эксперт", PasswordHash: middleware.HashPassword("engineer123"), Role: "engineer", City: "Астана", Company: "ТОО «Инжен-Строй»"},
		{ID: "u_customer_1", Email: "customer@test.kz", Name: "Заказчик ТОО Алатау", PasswordHash: middleware.HashPassword("customer123"), Role: "customer", City: "Алматы", Company: "ТОО «Алатау»"},
		{ID: "u_exec_1", Email: "executor@test.kz", Name: "Подрядчик ИП Мастер", PasswordHash: middleware.HashPassword("executor123"), Role: "executor", City: "Караганда", Company: "ИП «Мастер Сервис»"},
		{ID: "u_manager_1", Email: "manager@qazgost.kz", Name: "Менеджер CRM", PasswordHash: middleware.HashPassword("manager123"), Role: "manager", City: "Караганда", Company: "ТОО «QazGost»"},
	}
	for _, u := range seedUsers {
		_, err := DB.Exec(`INSERT INTO users (id, email, name, password_hash, role, phone, city, company, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
			u.ID, u.Email, u.Name, u.PasswordHash, u.Role, u.Phone, u.City, u.Company, time.Now())
		if err != nil {
			return err
		}
	}

	// Orders
	items1, _ := json.Marshal([]models.EstimateItem{
		{ID: 1, Name: "Бурение изыскательских скважин (до 15 м)", Unit: "пог.м", Qty: 30, Price: 8500, Sum: 255000},
		{ID: 2, Name: "Отбор монолитов и проб воды", Unit: "проба", Qty: 8, Price: 4500, Sum: 36000},
		{ID: 3, Name: "Лабораторные испытания грунтов по СП РК", Unit: "компл.", Qty: 1, Price: 84000, Sum: 84000},
	})
	stages1, _ := json.Marshal([]models.Stage{
		{ID: "s1", Title: "1. Полевое бурение и отбор проб", Deadline: "12 Авг", Status: "Завершено"},
		{ID: "s2", Title: "2. Лабораторный анализ грунтов", Deadline: "18 Авг", Status: "В работе"},
	})
	DB.Exec(`INSERT INTO orders (id,title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
		101, "Инженерно-геологические изыскания - ТОО «QazGost»", "Караганда, ул. Ленина 42", "09:00 - 18:00", "object", "ТОО «QazGost»", "В работе", "До 18:00 (15 Август)", "Инженерно-геологические изыскания", "Иван Петров", "+7 701 555 1234", string(items1), 375000, string(stages1), "admin", time.Now())

	items2, _ := json.Marshal([]models.EstimateItem{
		{ID: 1, Name: "Разработка котлована под септик", Unit: "м³", Qty: 12, Price: 4000, Sum: 48000},
		{ID: 2, Name: "Септик 3-камерный (3.5 м³)", Unit: "шт", Qty: 1, Price: 280000, Sum: 280000},
		{ID: 3, Name: "Песчано-гравийная подушка", Unit: "м³", Qty: 6, Price: 8500, Sum: 51000},
		{ID: 4, Name: "Монтаж и подключение септика", Unit: "усл.", Qty: 1, Price: 34000, Sum: 34000},
	})
	stages2, _ := json.Marshal([]models.Stage{
		{ID: "s1", Title: "1. Земляные работы и котлован", Deadline: "20 Авг", Status: "Запланировано"},
		{ID: "s2", Title: "2. Установка емкости и подключение", Deadline: "22 Авг", Status: "Запланировано"},
	})
	DB.Exec(`INSERT INTO orders (id,title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
		102, "Септик 3-камерный - Аскар Сериков", "Астана, пос. Косшы, ул. Мира 15", "10:00 - 17:00", "object", "ИП «Мастер Сервис»", "Запланировано", "До 18:00 (20 Август)", "Септик", "Аскар Сериков", "+7 777 333 9988", string(items2), 413000, string(stages2), "admin", time.Now())

	// Chat
	DB.Exec(`INSERT INTO chat_messages (id,order_id,sender_id,sender_name,sender_role,text,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		"msg_01", "101", "u_customer_1", "Заказчик (ТОО Алатау)", "customer", "Здравствуйте! Заливка фундамента запланирована на четверг?", time.Now().Add(-2*time.Hour))
	DB.Exec(`INSERT INTO chat_messages (id,order_id,sender_id,sender_name,sender_role,text,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		"msg_02", "101", "u_eng_1", "Инженер технадзора Куаныш", "engineer", "Добрый день! Армирование принято без замечаний. Бетононасос заказан на 09:30.", time.Now().Add(-1*time.Hour))

	log.Println("✅ [PostgreSQL] Seeded 5 users, 2 orders, 2 messages")
	return nil
}

// ── CRUD helpers ──

// GetUserByEmail finds a user by email
func GetUserByEmail(email string) (*models.User, error) {
	u := &models.User{}
	err := DB.QueryRow(`SELECT id,email,name,password_hash,role,phone,city,company,created_at FROM users WHERE email=$1`, email).
		Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.Role, &u.Phone, &u.City, &u.Company, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

// GetUserByID finds user by ID
func GetUserByID(id string) (*models.User, error) {
	u := &models.User{}
	err := DB.QueryRow(`SELECT id,email,name,password_hash,role,phone,city,company,created_at FROM users WHERE id=$1`, id).
		Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.Role, &u.Phone, &u.City, &u.Company, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return u, nil
}

// CreateUser inserts a new user
func CreateUser(u *models.User) error {
	_, err := DB.Exec(`INSERT INTO users (id,email,name,password_hash,role,phone,city,company,created_at,consent_version,terms_accepted_at,privacy_accepted_at,marketing_opt_in,marketing_opt_in_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		u.ID, u.Email, u.Name, u.PasswordHash, u.Role, u.Phone, u.City, u.Company, u.CreatedAt,
		u.ConsentVersion, u.TermsAcceptedAt, u.PrivacyAcceptedAt, u.MarketingOptIn, u.MarketingOptInAt)
	return err
}

const orderColumns = `id,title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,COALESCE(engineer_id,''),created_by,created_at`

type rowScanner interface {
	Scan(dest ...interface{}) error
}

func scanOrder(sc rowScanner) (*models.Order, error) {
	o := &models.Order{}
	var itemsJSON, stagesJSON string
	if err := sc.Scan(&o.ID, &o.Title, &o.Location, &o.Time, &o.Type, &o.Contractor, &o.Status, &o.Deadline, &o.JobType, &o.ClientName, &o.ClientPhone, &itemsJSON, &o.TotalSum, &stagesJSON, &o.EngineerID, &o.CreatedBy, &o.CreatedAt); err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(itemsJSON), &o.EstimateItems)
	_ = json.Unmarshal([]byte(stagesJSON), &o.Stages)
	if o.EstimateItems == nil {
		o.EstimateItems = []models.EstimateItem{}
	}
	if o.Stages == nil {
		o.Stages = []models.Stage{}
	}
	return o, nil
}

// GetAllOrders returns all orders (never nil — an empty DB returns [])
func GetAllOrders() ([]*models.Order, error) {
	rows, err := DB.Query(`SELECT ` + orderColumns + ` FROM orders ORDER BY created_at DESC`)
	if err != nil {
		return []*models.Order{}, err
	}
	defer rows.Close()
	orders := []*models.Order{}
	for rows.Next() {
		o, err := scanOrder(rows)
		if err != nil {
			continue
		}
		orders = append(orders, o)
	}
	return orders, nil
}

// GetOrderByID returns one order or sql.ErrNoRows
func GetOrderByID(id int64) (*models.Order, error) {
	return scanOrder(DB.QueryRow(`SELECT `+orderColumns+` FROM orders WHERE id=$1`, id))
}

// CreateOrder inserts a new order and sets o.ID to the id assigned by the database
func CreateOrder(o *models.Order) error {
	itemsJSON, _ := json.Marshal(o.EstimateItems)
	stagesJSON, _ := json.Marshal(o.Stages)
	return DB.QueryRow(`INSERT INTO orders (title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,created_by,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
		o.Title, o.Location, o.Time, o.Type, o.Contractor, o.Status, o.Deadline, o.JobType, o.ClientName, o.ClientPhone, string(itemsJSON), o.TotalSum, string(stagesJSON), o.CreatedBy, o.CreatedAt).Scan(&o.ID)
}

// OrderPatchColumns maps JSON field names accepted by PATCH/PUT to DB columns
var OrderPatchColumns = map[string]string{
	"title": "title", "location": "location", "time": "time_range", "type": "type",
	"contractor": "contractor", "status": "status", "deadline": "deadline", "jobType": "job_type",
	"clientName": "client_name", "clientPhone": "client_phone", "estimateItems": "estimate_items",
	"totalSum": "total_sum", "stages": "stages",
}

// PatchOrder updates only the provided columns. Returns sql.ErrNoRows if the order does not exist.
func PatchOrder(id int64, fields map[string]interface{}) error {
	if len(fields) == 0 {
		if _, err := GetOrderByID(id); err != nil {
			return err
		}
		return nil
	}
	sets := make([]string, 0, len(fields))
	args := make([]interface{}, 0, len(fields)+1)
	for col, val := range fields {
		args = append(args, val)
		sets = append(sets, fmt.Sprintf("%s=$%d", col, len(args)))
	}
	args = append(args, id)
	res, err := DB.Exec(fmt.Sprintf(`UPDATE orders SET %s WHERE id=$%d`, strings.Join(sets, ","), len(args)), args...)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// AssignEngineer links an engineer to an order
func AssignEngineer(orderID int64, engineerID string) error {
	var exists bool
	if err := DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM engineers WHERE id=$1)`, engineerID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("engineer not found")
	}
	res, err := DB.Exec(`UPDATE orders SET engineer_id=$1 WHERE id=$2`, engineerID, orderID)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// DeleteOrder removes an order
func DeleteOrder(id int64) error {
	res, err := DB.Exec(`DELETE FROM orders WHERE id=$1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return fmt.Errorf("order not found")
	}
	return nil
}

// GetBalance returns user balance
func GetBalance(userID string) (balance, escrow float64) {
	err := DB.QueryRow(`SELECT balance, escrow_locked FROM balances WHERE user_id=$1`, userID).Scan(&balance, &escrow)
	if err != nil {
		// Новый кошелёк — с нуля: денег «из воздуха» больше нет
		DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES ($1,0,0) ON CONFLICT (user_id) DO NOTHING`, userID)
		return 0, 0
	}
	return
}

// UpdateBalance atomically updates balance
func UpdateBalance(userID string, delta float64) error {
	_, err := DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES ($1, $2::double precision, 0)
		ON CONFLICT(user_id) DO UPDATE SET balance = balances.balance + $2::double precision`, userID, delta)
	return err
}

// UpdateEscrow atomically updates escrow
func UpdateEscrow(userID string, delta float64) error {
	_, err := DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES ($1, 0, GREATEST($2::double precision, 0))
		ON CONFLICT(user_id) DO UPDATE SET escrow_locked = GREATEST(balances.escrow_locked + $2::double precision, 0)`,
		userID, delta)
	return err
}

// LockEscrowAtomic reserves amount only if available (balance - escrow) covers it.
// Single UPDATE — concurrent requests cannot double-spend.
func LockEscrowAtomic(userID string, amount float64) (bool, error) {
	GetBalance(userID) // ensure row exists
	res, err := DB.Exec(`UPDATE balances SET escrow_locked = escrow_locked + $2::double precision
		WHERE user_id=$1 AND balance - escrow_locked >= $2::double precision`, userID, amount)
	if err != nil {
		return false, err
	}
	n, _ := res.RowsAffected()
	return n == 1, nil
}

// ReleaseEscrowAtomic moves amount from the payer's escrow to the payee's balance in one transaction.
// Fails (false) if the payer's escrow is smaller than amount.
func ReleaseEscrowAtomic(fromUserID, toUserID string, amount float64) (bool, error) {
	tx, err := DB.Begin()
	if err != nil {
		return false, err
	}
	defer tx.Rollback()
	res, err := tx.Exec(`UPDATE balances SET balance = balance - $2::double precision, escrow_locked = escrow_locked - $2::double precision
		WHERE user_id=$1 AND escrow_locked >= $2::double precision`, fromUserID, amount)
	if err != nil {
		return false, err
	}
	if n, _ := res.RowsAffected(); n != 1 {
		return false, nil
	}
	if _, err := tx.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES ($1, $2::double precision, 0)
		ON CONFLICT(user_id) DO UPDATE SET balance = balances.balance + $2::double precision`, toUserID, amount); err != nil {
		return false, err
	}
	return true, tx.Commit()
}

// UserExists reports whether a user id is registered
func UserExists(id string) bool {
	var ok bool
	_ = DB.QueryRow(`SELECT EXISTS(SELECT 1 FROM users WHERE id=$1)`, id).Scan(&ok)
	return ok
}

// CountTables returns the number of tables in the public schema
func CountTables() int {
	n := 0
	_ = DB.QueryRow(`SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public'`).Scan(&n)
	return n
}

// AddTransaction records a financial transaction
func AddTransaction(tx *models.Transaction) error {
	_, err := DB.Exec(`INSERT INTO transactions (id,user_id,amount,type,method,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		tx.ID, tx.UserID, tx.Amount, tx.Type, tx.Method, tx.Status, tx.CreatedAt)
	return err
}

// GetTransactions returns transactions; userID != "" limits them to one user
func GetTransactions(userID string) ([]*models.Transaction, error) {
	var rows *sql.Rows
	var err error
	if userID != "" {
		rows, err = DB.Query(`SELECT id,user_id,amount,type,method,status,created_at FROM transactions WHERE user_id=$1 ORDER BY created_at DESC`, userID)
	} else {
		rows, err = DB.Query(`SELECT id,user_id,amount,type,method,status,created_at FROM transactions ORDER BY created_at DESC`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	txs := []*models.Transaction{}
	for rows.Next() {
		t := &models.Transaction{}
		rows.Scan(&t.ID, &t.UserID, &t.Amount, &t.Type, &t.Method, &t.Status, &t.CreatedAt)
		txs = append(txs, t)
	}
	return txs, nil
}

// AddChatMessage stores a message
func AddChatMessage(m *models.ChatMessage) error {
	_, err := DB.Exec(`INSERT INTO chat_messages (id,order_id,sender_id,sender_name,sender_role,text,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
		m.ID, m.OrderID, m.SenderID, m.SenderName, m.SenderRole, m.Text, m.CreatedAt)
	return err
}

// GetChatMessages returns messages, optionally filtered by order
func GetChatMessages(orderID string) ([]*models.ChatMessage, error) {
	var rows *sql.Rows
	var err error
	if orderID != "" {
		rows, err = DB.Query(`SELECT id,order_id,sender_id,sender_name,sender_role,text,created_at FROM chat_messages WHERE order_id=$1 ORDER BY created_at`, orderID)
	} else {
		rows, err = DB.Query(`SELECT id,order_id,sender_id,sender_name,sender_role,text,created_at FROM chat_messages ORDER BY created_at`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	msgs := []*models.ChatMessage{}
	for rows.Next() {
		m := &models.ChatMessage{}
		rows.Scan(&m.ID, &m.OrderID, &m.SenderID, &m.SenderName, &m.SenderRole, &m.Text, &m.CreatedAt)
		msgs = append(msgs, m)
	}
	return msgs, nil
}
