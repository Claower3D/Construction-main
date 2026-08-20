package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "modernc.org/sqlite"

	"qazgost-ai/backend/pkg/middleware"
	"qazgost-ai/backend/pkg/models"
)

var DB *sql.DB

// InitDB opens SQLite and runs migrations
func InitDB(dbPath string) error {
	var err error
	DB, err = sql.Open("sqlite", dbPath+"?_journal_mode=WAL&_busy_timeout=5000")
	if err != nil {
		return fmt.Errorf("failed to open database: %w", err)
	}
	DB.SetMaxOpenConns(1) // SQLite single-writer

	if err := runMigrations(); err != nil {
		return fmt.Errorf("migrations failed: %w", err)
	}

	if err := runCRMMigrations(); err != nil {
		return fmt.Errorf("CRM migrations failed: %w", err)
	}

	if err := seedData(); err != nil {
		return fmt.Errorf("seed data failed: %w", err)
	}

	if err := seedCRMData(); err != nil {
		return fmt.Errorf("CRM seed failed: %w", err)
	}

	log.Printf("✅ [SQLite] Database ready at %s", dbPath)
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
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS orders (
			id INTEGER PRIMARY KEY,
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
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS transactions (
			id TEXT PRIMARY KEY,
			user_id TEXT NOT NULL,
			amount REAL NOT NULL,
			type TEXT NOT NULL,
			method TEXT DEFAULT '',
			status TEXT DEFAULT '',
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
		`CREATE TABLE IF NOT EXISTS balances (
			user_id TEXT PRIMARY KEY,
			balance REAL DEFAULT 0,
			escrow_locked REAL DEFAULT 0
		)`,
		`CREATE TABLE IF NOT EXISTS chat_messages (
			id TEXT PRIMARY KEY,
			order_id TEXT DEFAULT '',
			sender_id TEXT DEFAULT '',
			sender_name TEXT DEFAULT '',
			sender_role TEXT DEFAULT '',
			text TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, m := range migrations {
		if _, err := DB.Exec(m); err != nil {
			return fmt.Errorf("migration error: %w\nSQL: %s", err, m)
		}
	}
	log.Println("✅ [SQLite] Migrations complete (8 tables)")
	return nil
}

func seedData() error {
	// Seed users only if empty
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&count)
	if count > 0 {
		return nil // Already seeded
	}

	log.Println("[SQLite] Seeding initial data...")

	// Users
	seedUsers := []models.User{
		{ID: "u_admin_1", Email: "admin@qazgost.kz", Name: "Администратор QAZGOST AI", PasswordHash: middleware.HashPassword("admin123"), Role: "admin", City: "Караганда", Company: "ТОО «QazGost»"},
		{ID: "u_eng_1", Email: "engineer@qazgost.kz", Name: "Инженер-эксперт", PasswordHash: middleware.HashPassword("engineer123"), Role: "engineer", City: "Астана", Company: "ТОО «Инжен-Строй»"},
		{ID: "u_customer_1", Email: "customer@test.kz", Name: "Заказчик ТОО Алатау", PasswordHash: middleware.HashPassword("customer123"), Role: "customer", City: "Алматы", Company: "ТОО «Алатау»"},
		{ID: "u_exec_1", Email: "executor@test.kz", Name: "Подрядчик ИП Мастер", PasswordHash: middleware.HashPassword("executor123"), Role: "executor", City: "Караганда", Company: "ИП «Мастер Сервис»"},
		{ID: "u_manager_1", Email: "manager@qazgost.kz", Name: "Менеджер CRM", PasswordHash: middleware.HashPassword("manager123"), Role: "manager", City: "Караганда", Company: "ТОО «QazGost»"},
	}
	for _, u := range seedUsers {
		_, err := DB.Exec(`INSERT INTO users (id, email, name, password_hash, role, phone, city, company, created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
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
	DB.Exec(`INSERT INTO orders (id,title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
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
	DB.Exec(`INSERT INTO orders (id,title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		102, "Септик 3-камерный - Аскар Сериков", "Астана, пос. Косшы, ул. Мира 15", "10:00 - 17:00", "object", "ИП «Мастер Сервис»", "Запланировано", "До 18:00 (20 Август)", "Септик", "Аскар Сериков", "+7 777 333 9988", string(items2), 413000, string(stages2), "admin", time.Now())

	// Balances
	DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES (?,?,?)`, "u_admin_1", 2500000, 0)
	DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES (?,?,?)`, "u_customer_1", 1500000, 500000)
	DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES (?,?,?)`, "u_eng_1", 480000, 0)
	DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES (?,?,?)`, "u_exec_1", 320000, 0)

	// Transactions
	DB.Exec(`INSERT INTO transactions (id,user_id,amount,type,method,status,created_at) VALUES (?,?,?,?,?,?,?)`,
		"tx_01", "u_customer_1", 500000, "deposit", "Freedom Pay / Kaspi", "Успешно", time.Now().Add(-48*time.Hour))
	DB.Exec(`INSERT INTO transactions (id,user_id,amount,type,method,status,created_at) VALUES (?,?,?,?,?,?,?)`,
		"tx_02", "u_customer_1", 500000, "escrow_lock", "Гарантийный счет (Этап 1)", "Заблокировано", time.Now().Add(-24*time.Hour))

	// Chat
	DB.Exec(`INSERT INTO chat_messages (id,order_id,sender_id,sender_name,sender_role,text,created_at) VALUES (?,?,?,?,?,?,?)`,
		"msg_01", "101", "u_customer_1", "Заказчик (ТОО Алатау)", "customer", "Здравствуйте! Заливка фундамента запланирована на четверг?", time.Now().Add(-2*time.Hour))
	DB.Exec(`INSERT INTO chat_messages (id,order_id,sender_id,sender_name,sender_role,text,created_at) VALUES (?,?,?,?,?,?,?)`,
		"msg_02", "101", "u_eng_1", "Инженер технадзора Куаныш", "engineer", "Добрый день! Армирование принято без замечаний. Бетононасос заказан на 09:30.", time.Now().Add(-1*time.Hour))

	log.Println("✅ [SQLite] Seeded 5 users, 2 orders, 4 balances, 2 transactions, 2 messages")
	return nil
}

// ── CRUD helpers ──

// GetUserByEmail finds a user by email
func GetUserByEmail(email string) (*models.User, error) {
	u := &models.User{}
	var createdAt string
	err := DB.QueryRow(`SELECT id,email,name,password_hash,role,phone,city,company,created_at FROM users WHERE email=?`, email).
		Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.Role, &u.Phone, &u.City, &u.Company, &createdAt)
	if err != nil {
		return nil, err
	}
	u.CreatedAt, _ = time.Parse("2006-01-02 15:04:05-07:00", createdAt)
	return u, nil
}

// GetUserByID finds user by ID
func GetUserByID(id string) (*models.User, error) {
	u := &models.User{}
	var createdAt string
	err := DB.QueryRow(`SELECT id,email,name,password_hash,role,phone,city,company,created_at FROM users WHERE id=?`, id).
		Scan(&u.ID, &u.Email, &u.Name, &u.PasswordHash, &u.Role, &u.Phone, &u.City, &u.Company, &createdAt)
	if err != nil {
		return nil, err
	}
	u.CreatedAt, _ = time.Parse("2006-01-02 15:04:05-07:00", createdAt)
	return u, nil
}

// CreateUser inserts a new user
func CreateUser(u *models.User) error {
	_, err := DB.Exec(`INSERT INTO users (id,email,name,password_hash,role,phone,city,company,created_at) VALUES (?,?,?,?,?,?,?,?,?)`,
		u.ID, u.Email, u.Name, u.PasswordHash, u.Role, u.Phone, u.City, u.Company, u.CreatedAt)
	return err
}

// GetAllOrders returns all orders
func GetAllOrders() ([]*models.Order, error) {
	rows, err := DB.Query(`SELECT id,title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,created_by,created_at FROM orders ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var orders []*models.Order
	for rows.Next() {
		o := &models.Order{}
		var itemsJSON, stagesJSON, createdAt string
		err := rows.Scan(&o.ID, &o.Title, &o.Location, &o.Time, &o.Type, &o.Contractor, &o.Status, &o.Deadline, &o.JobType, &o.ClientName, &o.ClientPhone, &itemsJSON, &o.TotalSum, &stagesJSON, &o.CreatedBy, &createdAt)
		if err != nil {
			continue
		}
		json.Unmarshal([]byte(itemsJSON), &o.EstimateItems)
		json.Unmarshal([]byte(stagesJSON), &o.Stages)
		o.CreatedAt, _ = time.Parse("2006-01-02 15:04:05-07:00", createdAt)
		orders = append(orders, o)
	}
	return orders, nil
}

// CreateOrder inserts a new order
func CreateOrder(o *models.Order) error {
	itemsJSON, _ := json.Marshal(o.EstimateItems)
	stagesJSON, _ := json.Marshal(o.Stages)
	_, err := DB.Exec(`INSERT INTO orders (id,title,location,time_range,type,contractor,status,deadline,job_type,client_name,client_phone,estimate_items,total_sum,stages,created_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
		o.ID, o.Title, o.Location, o.Time, o.Type, o.Contractor, o.Status, o.Deadline, o.JobType, o.ClientName, o.ClientPhone, string(itemsJSON), o.TotalSum, string(stagesJSON), o.CreatedBy, o.CreatedAt)
	return err
}

// UpdateOrder updates an existing order
func UpdateOrder(id int64, o *models.Order) error {
	itemsJSON, _ := json.Marshal(o.EstimateItems)
	stagesJSON, _ := json.Marshal(o.Stages)
	_, err := DB.Exec(`UPDATE orders SET title=?,status=?,contractor=?,estimate_items=?,total_sum=?,stages=? WHERE id=?`,
		o.Title, o.Status, o.Contractor, string(itemsJSON), o.TotalSum, string(stagesJSON), id)
	return err
}

// DeleteOrder removes an order
func DeleteOrder(id int64) error {
	res, err := DB.Exec(`DELETE FROM orders WHERE id=?`, id)
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
	err := DB.QueryRow(`SELECT balance, escrow_locked FROM balances WHERE user_id=?`, userID).Scan(&balance, &escrow)
	if err != nil {
		// Create default balance
		DB.Exec(`INSERT INTO balances (user_id, balance, escrow_locked) VALUES (?,?,?)`, userID, 100000, 0)
		return 100000, 0
	}
	return
}

// UpdateBalance atomically updates balance
func UpdateBalance(userID string, delta float64) error {
	_, err := DB.Exec(`UPDATE balances SET balance = balance + ? WHERE user_id = ?`, delta, userID)
	return err
}

// UpdateEscrow atomically updates escrow
func UpdateEscrow(userID string, delta float64) error {
	_, err := DB.Exec(`UPDATE balances SET escrow_locked = CASE WHEN escrow_locked + ? < 0 THEN 0 ELSE escrow_locked + ? END WHERE user_id = ?`, delta, delta, userID)
	return err
}

// AddTransaction records a financial transaction
func AddTransaction(tx *models.Transaction) error {
	_, err := DB.Exec(`INSERT INTO transactions (id,user_id,amount,type,method,status,created_at) VALUES (?,?,?,?,?,?,?)`,
		tx.ID, tx.UserID, tx.Amount, tx.Type, tx.Method, tx.Status, tx.CreatedAt)
	return err
}

// GetTransactions returns all transactions
func GetTransactions() ([]*models.Transaction, error) {
	rows, err := DB.Query(`SELECT id,user_id,amount,type,method,status,created_at FROM transactions ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var txs []*models.Transaction
	for rows.Next() {
		t := &models.Transaction{}
		var createdAt string
		rows.Scan(&t.ID, &t.UserID, &t.Amount, &t.Type, &t.Method, &t.Status, &createdAt)
		t.CreatedAt, _ = time.Parse("2006-01-02 15:04:05-07:00", createdAt)
		txs = append(txs, t)
	}
	return txs, nil
}

// AddChatMessage stores a message
func AddChatMessage(m *models.ChatMessage) error {
	_, err := DB.Exec(`INSERT INTO chat_messages (id,order_id,sender_id,sender_name,sender_role,text,created_at) VALUES (?,?,?,?,?,?,?)`,
		m.ID, m.OrderID, m.SenderID, m.SenderName, m.SenderRole, m.Text, m.CreatedAt)
	return err
}

// GetChatMessages returns messages, optionally filtered by order
func GetChatMessages(orderID string) ([]*models.ChatMessage, error) {
	var rows *sql.Rows
	var err error
	if orderID != "" {
		rows, err = DB.Query(`SELECT id,order_id,sender_id,sender_name,sender_role,text,created_at FROM chat_messages WHERE order_id=? ORDER BY created_at`, orderID)
	} else {
		rows, err = DB.Query(`SELECT id,order_id,sender_id,sender_name,sender_role,text,created_at FROM chat_messages ORDER BY created_at`)
	}
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var msgs []*models.ChatMessage
	for rows.Next() {
		m := &models.ChatMessage{}
		var createdAt string
		rows.Scan(&m.ID, &m.OrderID, &m.SenderID, &m.SenderName, &m.SenderRole, &m.Text, &createdAt)
		m.CreatedAt, _ = time.Parse("2006-01-02 15:04:05-07:00", createdAt)
		msgs = append(msgs, m)
	}
	return msgs, nil
}
