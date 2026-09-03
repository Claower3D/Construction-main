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
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)`,
	}

	for _, m := range migrations {
		if _, err := DB.Exec(m); err != nil {
			return fmt.Errorf("CRM migration error: %w", err)
		}
	}
	log.Println("\u2705 [SQLite] CRM migrations complete (4 tables)")
	return nil
}

func seedCRMData() error {
	var count int
	DB.QueryRow("SELECT COUNT(*) FROM companies").Scan(&count)
	if count > 0 {
		return nil
	}

	log.Println("[SQLite] Seeding CRM data...")

	// Engineers
	engineers := []struct{ id, name, spec, city, exp, cert, status string; rating float64; done int }{
		{"eng_01", "\u041a\u0443\u0430\u043d\u044b\u0448 \u0416\u0443\u043c\u0430\u0433\u0443\u043b\u043e\u0432", "\u0413\u0435\u043e\u043b\u043e\u0433\u0438\u044f \u0438 \u043e\u0441\u043d\u043e\u0432\u0430\u043d\u0438\u044f (\u0421\u041f \u0420\u041a)", "\u0410\u0441\u0442\u0430\u043d\u0430", "14 \u043b\u0435\u0442", "\u0413\u0421\u041b \u21160049182 \u043e\u0442 14.05.2018", "\u0414\u043e\u0441\u0442\u0443\u043f\u0435\u043d", 4.95, 48},
		{"eng_02", "\u0410\u043b\u0435\u043a\u0441\u0435\u0439 \u041c\u0435\u043b\u044c\u043d\u0438\u043a\u043e\u0432", "\u0413\u0435\u043e\u0434\u0435\u0437\u0438\u044f \u0438 3D-\u0441\u043a\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435", "\u041a\u0430\u0440\u0430\u0433\u0430\u043d\u0434\u0430", "11 \u043b\u0435\u0442", "\u0413\u0421\u041b \u21160081290 \u043e\u0442 22.09.2020", "\u041d\u0430 \u0432\u044b\u0435\u0437\u0434\u0435", 4.88, 36},
		{"eng_03", "\u0414\u0430\u043d\u0438\u044f\u0440 \u0410\u0439\u0442\u0436\u0430\u043d\u043e\u0432", "\u0418\u0441\u043f\u044b\u0442\u0430\u043d\u0438\u0435 \u0441\u0432\u0430\u0439 & CPT \u0437\u043e\u043d\u0434\u0438\u0440\u043e\u0432\u0430\u043d\u0438\u0435", "\u0410\u043b\u043c\u0430\u0442\u044b", "9 \u043b\u0435\u0442", "\u0413\u0421\u041b \u21160093012 \u043e\u0442 11.02.2021", "\u0414\u043e\u0441\u0442\u0443\u043f\u0435\u043d", 4.92, 29},
	}
	for _, e := range engineers {
		DB.Exec("INSERT INTO engineers (id,name,specialization,city,experience,rating,certificate,status,projects_done) VALUES (?,?,?,?,?,?,?,?,?)",
			e.id, e.name, e.spec, e.city, e.exp, e.rating, e.cert, e.status, e.done)
	}

	// Equipment
	DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES (?,?,?,?,?,?,?)", "eq_1", "\u042d\u043a\u0441\u043a\u0430\u0432\u0430\u0442\u043e\u0440 JCB 3CX Super", "\u0417\u0435\u043c\u043b\u0435\u0440\u043e\u0439\u043d\u0430\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430", 85000.0, "\u041a\u0430\u0440\u0430\u0433\u0430\u043d\u0434\u0430", "\u0414\u043e\u0441\u0442\u0443\u043f\u0435\u043d", "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=400&q=80")
	DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES (?,?,?,?,?,?,?)", "eq_2", "\u0411\u0443\u0440\u043e\u0432\u0430\u044f \u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043a\u0430 \u0423\u0420\u0411-2\u04102", "\u0411\u0443\u0440\u043e\u0432\u043e\u0435 \u043e\u0431\u043e\u0440\u0443\u0434\u043e\u0432\u0430\u043d\u0438\u0435", 140000.0, "\u0410\u0441\u0442\u0430\u043d\u0430", "\u0414\u043e\u0441\u0442\u0443\u043f\u0435\u043d", "https://images.unsplash.com/photo-1541888087425-ce81dfc46928?auto=format&fit=crop&w=400&q=80")
	DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES (?,?,?,?,?,?,?)", "eq_3", "\u0410\u0432\u0442\u043e\u043a\u0440\u0430\u043d XCMG 25 \u0442\u043e\u043d\u043d", "\u0413\u0440\u0443\u0437\u043e\u043f\u043e\u0434\u044a\u0435\u043c\u043d\u0430\u044f \u0442\u0435\u0445\u043d\u0438\u043a\u0430", 110000.0, "\u0410\u043b\u043c\u0430\u0442\u044b", "\u0412 \u0430\u0440\u0435\u043d\u0434\u0435", "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80")

	// Companies
	DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
		"comp_01", "\u0422\u041e\u041e \u00abQazGost\u00bb", "120340005678", "\u041a\u0430\u0440\u0430\u0433\u0430\u043d\u0434\u0430", "\u0443\u043b. \u041b\u0435\u043d\u0438\u043d\u0430 42", "+7 721 234 5678", "info@qazgost.kz", "\u0410\u0440\u043c\u0430\u043d \u0410\u043b\u0438\u0435\u0432", "\u0413\u0435\u043d\u043f\u043e\u0434\u0440\u044f\u0434\u0447\u0438\u043a", "active", time.Now())
	DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
		"comp_02", "\u0418\u041f \u00ab\u041c\u0430\u0441\u0442\u0435\u0440 \u0421\u0435\u0440\u0432\u0438\u0441\u00bb", "890210034567", "\u0410\u0441\u0442\u0430\u043d\u0430", "\u043f\u043e\u0441. \u041a\u043e\u0441\u0448\u044b, \u0443\u043b. \u041c\u0438\u0440\u0430 15", "+7 777 333 9988", "master@service.kz", "\u0410\u0441\u043a\u0430\u0440 \u0421\u0435\u0440\u0438\u043a\u043e\u0432", "\u0421\u0443\u0431\u043f\u043e\u0434\u0440\u044f\u0434\u0447\u0438\u043a", "active", time.Now())
	DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
		"comp_03", "\u0422\u041e\u041e \u00ab\u0418\u043d\u0436\u0435\u043d-\u0421\u0442\u0440\u043e\u0439\u00bb", "190520067890", "\u0410\u0441\u0442\u0430\u043d\u0430", "\u043f\u0440. \u0420\u0435\u0441\u043f\u0443\u0431\u043b\u0438\u043a\u0438 89", "+7 717 890 1234", "info@inzhenstroy.kz", "\u0411\u0435\u0440\u0438\u043a \u041a\u0430\u0437\u044b\u0431\u0435\u043a\u043e\u0432", "\u041f\u0440\u043e\u0435\u043a\u0442\u0438\u0440\u043e\u0432\u0449\u0438\u043a", "active", time.Now())

	// Brigades
	DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
		"brig_01", "\u0411\u0440\u0438\u0433\u0430\u0434\u0430 \u21161 \u2014 \u0424\u0443\u043d\u0434\u0430\u043c\u0435\u043d\u0442\u044b", "comp_01", "\u0415\u0440\u043b\u0430\u043d \u041a\u0443\u0441\u0430\u0438\u043d\u043e\u0432", 8, "\u0411\u0435\u0442\u043e\u043d, \u0430\u0440\u043c\u0430\u0442\u0443\u0440\u0430, \u043e\u043f\u0430\u043b\u0443\u0431\u043a\u0430", "\u041a\u0430\u0440\u0430\u0433\u0430\u043d\u0434\u0430", "active", 4.9, time.Now())
	DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
		"brig_02", "\u0411\u0440\u0438\u0433\u0430\u0434\u0430 \u21162 \u2014 \u0417\u0435\u043c\u043b\u044f\u043d\u044b\u0435 \u0440\u0430\u0431\u043e\u0442\u044b", "comp_01", "\u041c\u0430\u043a\u0441\u0430\u0442 \u0422\u043e\u043b\u0435\u0433\u0435\u043d\u043e\u0432", 6, "\u041a\u043e\u0442\u043b\u043e\u0432\u0430\u043d\u044b, \u0442\u0440\u0435\u043d\u0448\u0438, \u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u043a\u0430", "\u041a\u0430\u0440\u0430\u0433\u0430\u043d\u0434\u0430", "active", 4.7, time.Now())
	DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
		"brig_03", "\u0411\u0440\u0438\u0433\u0430\u0434\u0430 \u21163 \u2014 \u0421\u0435\u043f\u0442\u0438\u043a\u0438 \u0438 \u043a\u0430\u043d\u0430\u043b\u0438\u0437\u0430\u0446\u0438\u044f", "comp_02", "\u0421\u0435\u0440\u0438\u043a \u041a\u0430\u0441\u044b\u043c\u043e\u0432", 5, "\u041c\u043e\u043d\u0442\u0430\u0436 \u0441\u0435\u043f\u0442\u0438\u043a\u043e\u0432, \u0442\u0440\u0443\u0431\u043e\u043f\u0440\u043e\u0432\u043e\u0434", "\u0410\u0441\u0442\u0430\u043d\u0430", "active", 4.8, time.Now())

	// Clients
	DB.Exec("INSERT INTO clients (id,name,phone,email,city,source,status,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
		"cli_01", "\u0418\u0432\u0430\u043d \u041f\u0435\u0442\u0440\u043e\u0432", "+7 701 555 1234", "petrov@mail.kz", "\u041a\u0430\u0440\u0430\u0433\u0430\u043d\u0434\u0430", "\u0421\u0430\u0439\u0442", "active", "\u0413\u0435\u043e\u043b\u043e\u0433\u0438\u044f \u043f\u043e\u0434 \u0436\u0438\u043b\u043e\u0439 \u0434\u043e\u043c", time.Now())
	DB.Exec("INSERT INTO clients (id,name,phone,email,city,source,status,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
		"cli_02", "\u0410\u0441\u043a\u0430\u0440 \u0421\u0435\u0440\u0438\u043a\u043e\u0432", "+7 777 333 9988", "serikov@mail.kz", "\u0410\u0441\u0442\u0430\u043d\u0430", "Instagram", "active", "\u0421\u0435\u043f\u0442\u0438\u043a 3-\u043a\u0430\u043c\u0435\u0440\u043d\u044b\u0439", time.Now())

	log.Println("\u2705 [SQLite] CRM seeded: 3 companies, 3 brigades, 2 clients, 3 engineers, 3 equipment")
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
		var ca string
		rows.Scan(&c.ID, &c.Name, &c.BIN, &c.City, &c.Address, &c.Phone, &c.Email, &c.Director, &c.Type, &c.Status, &ca)
		items = append(items, c)
	}
	return items, nil
}

func CreateCompany(c *models.Company) error {
	_, err := DB.Exec("INSERT INTO companies (id,name,bin,city,address,phone,email,director,type,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
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
		var ca string
		rows.Scan(&b.ID, &b.Name, &b.CompanyID, &b.Foreman, &b.Size, &b.Skills, &b.City, &b.Status, &b.Rating, &ca)
		items = append(items, b)
	}
	return items, nil
}

func CreateBrigade(b *models.Brigade) error {
	_, err := DB.Exec("INSERT INTO brigades (id,name,company_id,foreman,size,skills,city,status,rating,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
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
		var ca string
		rows.Scan(&c.ID, &c.Name, &c.Phone, &c.Email, &c.City, &c.Source, &c.Status, &c.Notes, &ca)
		items = append(items, c)
	}
	return items, nil
}

func CreateClient(c *models.Client) error {
	_, err := DB.Exec("INSERT INTO clients (id,name,phone,email,city,source,status,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?)",
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
	_, err := DB.Exec("INSERT INTO equipment (id,name,category,price_per_day,city,status,image) VALUES (?,?,?,?,?,?,?)",
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
		var ca string
		rows.Scan(&d.ID, &d.OrderID, &d.Claimant, &d.Reason, &d.Status, &ca)
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
		var cat, uat string
		if err := rows.Scan(&evt.ID, &evt.Date, &evt.LeadNum, &evt.Title, &evt.Status, &evt.Type, &evt.Role, &evt.Time, &evt.Phone, &evt.Contractor, &evt.Location, &evt.Budget, &evt.Description, &evt.Notes, &evt.CreatedBy, &cat, &uat); err == nil {
			evt.CreatedAt, _ = time.Parse("2006-01-02 15:04:05", cat)
			evt.UpdatedAt, _ = time.Parse("2006-01-02 15:04:05", uat)
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
	now := time.Now().Format("2006-01-02 15:04:05")

	query := `INSERT INTO crm_events (id, date, lead_num, title, status, type, role, time, phone, contractor, location, budget, description, notes, created_by, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			date=excluded.date,
			lead_num=excluded.lead_num,
			title=excluded.title,
			status=excluded.status,
			type=excluded.type,
			role=excluded.role,
			time=excluded.time,
			phone=excluded.phone,
			contractor=excluded.contractor,
			location=excluded.location,
			budget=excluded.budget,
			description=excluded.description,
			notes=excluded.notes,
			updated_at=excluded.updated_at`

	_, err := DB.Exec(query,
		evt.ID, evt.Date, evt.LeadNum, evt.Title, evt.Status, evt.Type, evt.Role, evt.Time,
		evt.Phone, evt.Contractor, evt.Location, evt.Budget, evt.Description, evt.Notes, evt.CreatedBy, now, now)
	return err
}

func DeleteCRMEvent(id string) error {
	_, err := DB.Exec("DELETE FROM crm_events WHERE id = ?", id)
	return err
}

func BulkSyncCRMEvents(evts []*models.CRMEvent) error {
	for _, e := range evts {
		_ = SaveCRMEvent(e)
	}
	return nil
}
