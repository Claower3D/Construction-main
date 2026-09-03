package database

import (
	"fmt"
	"log"
	"time"

	"qazgost-ai/backend/pkg/models"
)

func runCRMMigrations() error {
	migrations := []string{
		`CREATE TABLE IF NOT EXISTS companies (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			bin TEXT DEFAULT '',
			city TEXT DEFAULT '',
			address TEXT DEFAULT '',
			phone TEXT DEFAULT '',
			email TEXT DEFAULT '',
			director TEXT DEFAULT '',
			type TEXT DEFAULT '',
			status TEXT DEFAULT 'active',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS brigades (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			company_id TEXT DEFAULT '',
			foreman TEXT DEFAULT '',
			size INTEGER DEFAULT 0,
			skills TEXT DEFAULT '',
			city TEXT DEFAULT '',
			status TEXT DEFAULT 'active',
			rating REAL DEFAULT 0,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS clients (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			phone TEXT DEFAULT '',
			email TEXT DEFAULT '',
			city TEXT DEFAULT '',
			source TEXT DEFAULT '',
			status TEXT DEFAULT 'new',
			notes TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS crm_events (
			id TEXT PRIMARY KEY,
			date TEXT NOT NULL,
			lead_num TEXT DEFAULT '',
			title TEXT NOT NULL,
			status TEXT NOT NULL,
			type TEXT DEFAULT '',
			role TEXT DEFAULT '',
			time TEXT DEFAULT '',
			phone TEXT DEFAULT '',
			contractor TEXT DEFAULT '',
			location TEXT DEFAULT '',
			budget TEXT DEFAULT '',
			description TEXT DEFAULT '',
			notes TEXT DEFAULT '',
			created_by TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW(),
			updated_at TIMESTAMP DEFAULT NOW()
		)`,
	}

	for _, m := range migrations {
		if _, err := DB.Exec(m); err != nil {
			return fmt.Errorf("CRM migration error: %w", err)
		}
	}
	log.Println("✅ [PostgreSQL] CRM migrations complete (4 tables)")
	return nil
}

func seedCRMData() error {
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM companies").Scan(&count)
	if count > 0 {
		return nil
	}

	log.Println("[PostgreSQL] Seeding CRM data...")

	// Engineers
	engineers := []struct {
		id, name, spec, city, exp, cert, status string
		rating                                  float64
		done                                    int
	}{
		{"eng_01", "Куаныш Жумагулов", "Геология и основания (СП РК)", "Астана", "14 лет", "ГСЛ №0049182 от 14.05.2018", "Доступен", 4.95, 48},
		{"eng_02", "Алексей Мельников", "Геодезия и 3D-сканирование", "Караганда", "11 лет", "ГСЛ №0081290 от 22.09.2020", "На выезде", 4.88, 36},
		{"eng_03", "Данияр Айтжанов", "Испытание свай & CPT зондирование", "Алматы", "9 лет", "ГСЛ №0093012 от 11.02.2021", "Доступен", 4.92, 29},
	}
	for _, e := range engineers {
		DB.Exec("INSERT INTO engineers (id,name,specialization,city,experience,rating,certificate,status,projects_done) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
			e.id, e.name, e.spec, e.city, e.exp, e.rating, e.cert, e.status, e.done)
	}

	// Equipment
	DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES ($1,$2,$3,$4,$5,$6,$7)", "eq_1", "Экскаватор JCB 3CX Super", "Землеройная техника", 85000.0, "Караганда", "Доступен", "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80")
	DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES ($1,$2,$3,$4,$5,$6,$7)", "eq_2", "Буровая установка УРБ-2А2", "Буровое оборудование", 140000.0, "Астана", "Доступен", "https://images.unsplash.com/photo-1541888087425-ce81dfc46928?auto=format&fit=crop&w=400&q=80")
	DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES ($1,$2,$3,$4,$5,$6,$7)", "eq_3", "Автокран XCMG 25 тонн", "Грузоподъемная техника", 110000.0, "Алматы", "В аренде", "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80")

	// Companies
	DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
		"comp_01", "ТОО «QazGost»", "120340005678", "Караганда", "ул. Ленина 42", "+7 721 234 5678", "info@qazgost.kz", "Арман Алиев", "Генподрядчик", "active", time.Now())
	DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
		"comp_02", "ИП «Мастер Сервис»", "890210034567", "Астана", "пос. Косшы, ул. Мира 15", "+7 777 333 9988", "master@service.kz", "Аскар Сериков", "Субподрядчик", "active", time.Now())
	DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
		"comp_03", "ТОО «Инжен-Строй»", "190520067890", "Астана", "пр. Республики 89", "+7 717 890 1234", "info@inzhenstroy.kz", "Берик Казыбеков", "Проектировщик", "active", time.Now())
	DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
		"comp_tabys", "ТОО «ТАБЫС - АСМ»", "131040012428", "Караганда", "пр. Сакена Сейфуллина, 105-К", "+7 702 364 08 71", "tabys-asm@mail.ru", "Пекушева Н.Р.", "Поставщик ЖБИ", "active", time.Now())

	// Brigades
	DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
		"brig_01", "Бригада №1 — Фундаменты", "comp_01", "Ерлан Кусаинов", 8, "Бетон, арматура, опалубка", "Караганда", "active", 4.9, time.Now())
	DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
		"brig_02", "Бригада №2 — Земляные работы", "comp_01", "Максат Толегенов", 6, "Котлованы, тренши, планировка", "Караганда", "active", 4.7, time.Now())
	DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
		"brig_03", "Бригада №3 — Септики и канализация", "comp_02", "Серик Касымов", 5, "Монтаж септиков, трубопровод", "Астана", "active", 4.8, time.Now())
	DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
		"brig_tabys", "Доставка и монтаж ЖБИ (Манипулятор)", "comp_tabys", "Наталья", 4, "Доставка манипулятором, монтаж колец, септиков и ФБС", "Караганда", "active", 5.0, time.Now())

	// Clients
	DB.Exec("INSERT INTO clients (id,name,phone,email,city,source,status,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
		"cli_01", "Иван Петров", "+7 701 555 1234", "petrov@mail.kz", "Караганда", "Сайт", "active", "Геология под жилой дом", time.Now())
	DB.Exec("INSERT INTO clients (id,name,phone,email,city,source,status,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
		"cli_02", "Аскар Сериков", "+7 777 333 9988", "serikov@mail.kz", "Астана", "Instagram", "active", "Септик 3-камерный", time.Now())

	log.Println("✅ [PostgreSQL] CRM seeded: 4 companies, 4 brigades, 2 clients, 3 engineers, 3 equipment")
	return nil
}

// ── CRM CRUD ──

func GetAllCompanies() ([]*models.Company, error) {
	rows, err := DB.Query("SELECT id,name,bin,city,address,phone,email,director,type,status,created_at FROM companies ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*models.Company
	for rows.Next() {
		c := &models.Company{}
		rows.Scan(&c.ID, &c.Name, &c.BIN, &c.City, &c.Address, &c.Phone, &c.Email, &c.Director, &c.Type, &c.Status, &c.CreatedAt)
		items = append(items, c)
	}
	return items, nil
}

func CreateCompany(c *models.Company) error {
	_, err := DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
		c.ID, c.Name, c.BIN, c.City, c.Address, c.Phone, c.Email, c.Director, c.Type, c.Status, c.CreatedAt)
	return err
}

func GetAllBrigades() ([]*models.Brigade, error) {
	rows, err := DB.Query("SELECT id,name,company_id,foreman,size,skills,city,status,rating,created_at FROM brigades ORDER BY name")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*models.Brigade
	for rows.Next() {
		b := &models.Brigade{}
		rows.Scan(&b.ID, &b.Name, &b.CompanyID, &b.Foreman, &b.Size, &b.Skills, &b.City, &b.Status, &b.Rating, &b.CreatedAt)
		items = append(items, b)
	}
	return items, nil
}

func CreateBrigade(b *models.Brigade) error {
	_, err := DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
		b.ID, b.Name, b.CompanyID, b.Foreman, b.Size, b.Skills, b.City, b.Status, b.Rating, b.CreatedAt)
	return err
}

func GetAllClients() ([]*models.Client, error) {
	rows, err := DB.Query("SELECT id,name,phone,email,city,source,status,notes,created_at FROM clients ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*models.Client
	for rows.Next() {
		c := &models.Client{}
		rows.Scan(&c.ID, &c.Name, &c.Phone, &c.Email, &c.City, &c.Source, &c.Status, &c.Notes, &c.CreatedAt)
		items = append(items, c)
	}
	return items, nil
}

func CreateClient(c *models.Client) error {
	_, err := DB.Exec("INSERT INTO clients (id,name,phone,email,city,source,status,notes,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)",
		c.ID, c.Name, c.Phone, c.Email, c.City, c.Source, c.Status, c.Notes, c.CreatedAt)
	return err
}

func GetAllEngineers() ([]*models.Engineer, error) {
	rows, err := DB.Query("SELECT id,name,specialization,city,experience,rating,certificate,status,projects_done FROM engineers ORDER BY rating DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*models.Engineer
	for rows.Next() {
		e := &models.Engineer{}
		rows.Scan(&e.ID, &e.Name, &e.Specialization, &e.City, &e.Experience, &e.Rating, &e.Certificate, &e.Status, &e.ProjectsDone)
		items = append(items, e)
	}
	return items, nil
}

func GetAllEquipment() ([]*models.Equipment, error) {
	rows, err := DB.Query("SELECT id,name,category,price_per_day,city,status,image FROM equipment ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*models.Equipment
	for rows.Next() {
		e := &models.Equipment{}
		rows.Scan(&e.ID, &e.Name, &e.Category, &e.PricePerDay, &e.City, &e.Status, &e.Image)
		e.Rating = 4.9
		e.ReviewsCount = 12
		e.DistanceKm = 2.4
		items = append(items, e)
	}
	return items, nil
}

func AddEquipment(e *models.Equipment) error {
	if e.ID == "" {
		e.ID = fmt.Sprintf("eq_%d", time.Now().UnixNano())
	}
	if e.Status == "" {
		e.Status = "Доступен"
	}
	if e.Image == "" {
		e.Image = "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80"
	}
	_, err := DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES ($1,$2,$3,$4,$5,$6,$7)",
		e.ID, e.Name, e.Category, e.PricePerDay, e.City, e.Status, e.Image)
	return err
}

func GetAllDisputes() ([]*models.Dispute, error) {
	rows, err := DB.Query("SELECT id,order_id,claimant,reason,status,created_at FROM disputes ORDER BY created_at DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var items []*models.Dispute
	for rows.Next() {
		d := &models.Dispute{}
		rows.Scan(&d.ID, &d.OrderID, &d.Claimant, &d.Reason, &d.Status, &d.CreatedAt)
		items = append(items, d)
	}
	return items, nil
}

// ── CRM Events Multi-Device Synchronization ──

func GetAllCRMEvents() ([]*models.CRMEvent, error) {
	rows, err := DB.Query("SELECT id, date, lead_num, title, status, type, role, time, phone, contractor, location, budget, description, notes, created_by, created_at, updated_at FROM crm_events ORDER BY date ASC, time ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []*models.CRMEvent
	for rows.Next() {
		evt := &models.CRMEvent{}
		if err := rows.Scan(&evt.ID, &evt.Date, &evt.LeadNum, &evt.Title, &evt.Status, &evt.Type, &evt.Role, &evt.Time, &evt.Phone, &evt.Contractor, &evt.Location, &evt.Budget, &evt.Description, &evt.Notes, &evt.CreatedBy, &evt.CreatedAt, &evt.UpdatedAt); err == nil {
			items = append(items, evt)
		}
	}
	return items, nil
}

func SaveCRMEvent(evt *models.CRMEvent) error {
	if evt.ID == "" {
		evt.ID = fmt.Sprintf("evt_%d", time.Now().UnixNano())
	}
	if evt.Status == "" {
		evt.Status = "Новые"
	}
	now := time.Now()

	query := `INSERT INTO crm_events (id, date, lead_num, title, status, type, role, time, phone, contractor, location, budget, description, notes, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		ON CONFLICT(id) DO UPDATE SET
			date=EXCLUDED.date,
			lead_num=EXCLUDED.lead_num,
			title=EXCLUDED.title,
			status=EXCLUDED.status,
			type=EXCLUDED.type,
			role=EXCLUDED.role,
			time=EXCLUDED.time,
			phone=EXCLUDED.phone,
			contractor=EXCLUDED.contractor,
			location=EXCLUDED.location,
			budget=EXCLUDED.budget,
			description=EXCLUDED.description,
			notes=EXCLUDED.notes,
			updated_at=EXCLUDED.updated_at`

	_, err := DB.Exec(query,
		evt.ID, evt.Date, evt.LeadNum, evt.Title, evt.Status, evt.Type, evt.Role, evt.Time,
		evt.Phone, evt.Contractor, evt.Location, evt.Budget, evt.Description, evt.Notes, evt.CreatedBy, now, now)
	return err
}

func DeleteCRMEvent(id string) error {
	_, err := DB.Exec("DELETE FROM crm_events WHERE id = $1 OR lead_num = $2 OR id LIKE $3", id, id, "%"+id+"%")
	return err
}

func BulkSyncCRMEvents(evts []*models.CRMEvent) error {
	for _, e := range evts {
		_ = SaveCRMEvent(e)
	}
	return nil
}
