package database

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/models"
)

// newID returns a collision-safe id: prefix + time + random suffix
func newID(prefix string) string {
	var b [4]byte
	_, _ = rand.Read(b[:])
	return fmt.Sprintf("%s_%d%s", prefix, time.Now().UnixNano(), hex.EncodeToString(b[:]))
}

// ErrNotFound is returned when a marketplace record does not exist
var ErrNotFound = errors.New("not found")

// ErrBusy is returned when a machine is already booked for the requested dates
var ErrBusy = errors.New("busy")

func runMarketplaceMigrations() error {
	migrations := []string{
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS with_operator BOOLEAN DEFAULT TRUE`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS delivery BOOLEAN DEFAULT TRUE`,
		`ALTER TABLE equipment ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`,
		`CREATE TABLE IF NOT EXISTS equipment_bookings (
			id TEXT PRIMARY KEY,
			equipment_id TEXT NOT NULL,
			equipment_name TEXT DEFAULT '',
			owner_id TEXT DEFAULT '',
			renter_id TEXT DEFAULT '',
			renter_name TEXT DEFAULT '',
			renter_phone TEXT DEFAULT '',
			address TEXT DEFAULT '',
			date_from DATE NOT NULL,
			date_to DATE NOT NULL,
			shifts INTEGER NOT NULL DEFAULT 1,
			price_per_shift REAL DEFAULT 0,
			total REAL DEFAULT 0,
			payment_method TEXT DEFAULT '',
			status TEXT DEFAULT 'pending',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_eq_bookings_equipment ON equipment_bookings(equipment_id, date_from, date_to)`,
		`CREATE TABLE IF NOT EXISTS material_offers (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			category TEXT DEFAULT '',
			unit TEXT DEFAULT 'шт',
			price REAL NOT NULL DEFAULT 0,
			wholesale_price REAL DEFAULT 0,
			wholesale_from REAL DEFAULT 0,
			city TEXT DEFAULT '',
			stock REAL DEFAULT 0,
			gost TEXT DEFAULT '',
			delivery BOOLEAN DEFAULT TRUE,
			pickup BOOLEAN DEFAULT TRUE,
			price_code TEXT DEFAULT '',
			image TEXT DEFAULT '',
			description TEXT DEFAULT '',
			supplier_id TEXT DEFAULT '',
			supplier_name TEXT DEFAULT '',
			supplier_phone TEXT DEFAULT '',
			status TEXT DEFAULT 'active',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_material_offers_supplier ON material_offers(supplier_id)`,
	}
	for _, m := range migrations {
		if _, err := DB.Exec(m); err != nil {
			return fmt.Errorf("marketplace migration error: %w\nSQL: %s", err, m)
		}
	}
	return nil
}

// ── Equipment ──

const equipmentCols = `id,COALESCE(name,''),COALESCE(category,''),COALESCE(price_per_day,0),COALESCE(price_per_hour,0),COALESCE(city,''),
	COALESCE(status,'Доступен'),COALESCE(image,''),
	COALESCE(owner_id,''),COALESCE(owner_name,''),COALESCE(owner_phone,''),COALESCE(plate_number,''),COALESCE(capacity,''),
	COALESCE(rating,0),COALESCE(reviews_count,0),COALESCE(description,''),COALESCE(with_operator,TRUE),COALESCE(delivery,TRUE),
	COALESCE(to_char(created_at,'YYYY-MM-DD'),'')`

func scanEquipment(sc interface{ Scan(...interface{}) error }) (*models.Equipment, error) {
	e := &models.Equipment{}
	err := sc.Scan(&e.ID, &e.Name, &e.Category, &e.PricePerDay, &e.PricePerHour, &e.City, &e.Status, &e.Image,
		&e.OwnerID, &e.OwnerName, &e.OwnerPhone, &e.PlateNumber, &e.Capacity, &e.Rating, &e.ReviewsCount,
		&e.Description, &e.WithOperator, &e.Delivery, &e.CreatedAt)
	return e, err
}

// GetEquipmentByID returns one machine or ErrNotFound
func GetEquipmentByID(id string) (*models.Equipment, error) {
	e, err := scanEquipment(DB.QueryRow(`SELECT `+equipmentCols+` FROM equipment WHERE id=$1`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return e, err
}

// UpdateEquipment writes all editable fields of a machine
func UpdateEquipment(e *models.Equipment) error {
	res, err := DB.Exec(`UPDATE equipment SET name=$2,category=$3,price_per_day=$4,price_per_hour=$5,city=$6,status=$7,image=$8,
		owner_phone=$9,plate_number=$10,capacity=$11,description=$12,with_operator=$13,delivery=$14,owner_name=$15 WHERE id=$1`,
		e.ID, e.Name, e.Category, e.PricePerDay, e.PricePerHour, e.City, e.Status, e.Image,
		e.OwnerPhone, e.PlateNumber, e.Capacity, e.Description, e.WithOperator, e.Delivery, e.OwnerName)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// DeleteEquipment removes a machine and cancels its active bookings in one transaction
func DeleteEquipment(id string) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck
	res, err := tx.Exec(`DELETE FROM equipment WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	if _, err := tx.Exec(`UPDATE equipment_bookings SET status='cancelled' WHERE equipment_id=$1 AND status IN ('pending','confirmed')`, id); err != nil {
		return err
	}
	return tx.Commit()
}

// BusyEquipmentIDs returns machines that have an active booking covering the given day
func BusyEquipmentIDs(day string) (map[string]bool, error) {
	rows, err := DB.Query(`SELECT DISTINCT equipment_id FROM equipment_bookings
		WHERE status IN ('pending','confirmed') AND date_from <= $1::date AND date_to >= $1::date`, day)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := map[string]bool{}
	for rows.Next() {
		var id string
		if rows.Scan(&id) == nil {
			out[id] = true
		}
	}
	return out, nil
}

// ── Bookings ──

const bookingCols = `id,equipment_id,equipment_name,owner_id,renter_id,renter_name,renter_phone,address,
	to_char(date_from,'YYYY-MM-DD'),to_char(date_to,'YYYY-MM-DD'),shifts,price_per_shift,total,payment_method,status,
	to_char(created_at,'YYYY-MM-DD"T"HH24:MI:SS')`

func scanBooking(sc interface{ Scan(...interface{}) error }) (*models.EquipmentBooking, error) {
	b := &models.EquipmentBooking{}
	err := sc.Scan(&b.ID, &b.EquipmentID, &b.EquipmentName, &b.OwnerID, &b.RenterID, &b.RenterName, &b.RenterPhone, &b.Address,
		&b.DateFrom, &b.DateTo, &b.Shifts, &b.PricePerShift, &b.Total, &b.PaymentMethod, &b.Status, &b.CreatedAt)
	return b, err
}

// CreateBooking inserts a booking if the machine is free for [DateFrom, DateTo].
// The overlap check and insert run in one transaction with a row lock on the machine.
func CreateBooking(b *models.EquipmentBooking) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback() //nolint:errcheck

	var lockedID string
	if err := tx.QueryRow(`SELECT id FROM equipment WHERE id=$1 FOR UPDATE`, b.EquipmentID).Scan(&lockedID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrNotFound
		}
		return err
	}
	var clash int
	if err := tx.QueryRow(`SELECT COUNT(*) FROM equipment_bookings WHERE equipment_id=$1 AND status IN ('pending','confirmed')
		AND date_from <= $3::date AND date_to >= $2::date`, b.EquipmentID, b.DateFrom, b.DateTo).Scan(&clash); err != nil {
		return err
	}
	if clash > 0 {
		return ErrBusy
	}
	if b.ID == "" {
		b.ID = newID("bk")
	}
	if b.Status == "" {
		b.Status = "pending"
	}
	if _, err := tx.Exec(`INSERT INTO equipment_bookings (id,equipment_id,equipment_name,owner_id,renter_id,renter_name,renter_phone,address,
		date_from,date_to,shifts,price_per_shift,total,payment_method,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::date,$10::date,$11,$12,$13,$14,$15)`,
		b.ID, b.EquipmentID, b.EquipmentName, b.OwnerID, b.RenterID, b.RenterName, b.RenterPhone, b.Address,
		b.DateFrom, b.DateTo, b.Shifts, b.PricePerShift, b.Total, b.PaymentMethod, b.Status); err != nil {
		return err
	}
	b.CreatedAt = time.Now().Format("2006-01-02T15:04:05")
	return tx.Commit()
}

// ListBookings returns bookings where the user is the renter ("renter"), the owner ("owner"), or all (staff, "all")
func ListBookings(userID, role string) ([]*models.EquipmentBooking, error) {
	q := `SELECT ` + bookingCols + ` FROM equipment_bookings`
	var args []interface{}
	switch role {
	case "owner":
		q += ` WHERE owner_id=$1`
		args = append(args, userID)
	case "renter":
		q += ` WHERE renter_id=$1`
		args = append(args, userID)
	}
	q += ` ORDER BY date_from DESC, created_at DESC LIMIT 500`
	rows, err := DB.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []*models.EquipmentBooking{}
	for rows.Next() {
		if b, err := scanBooking(rows); err == nil {
			out = append(out, b)
		}
	}
	return out, nil
}

// GetBooking returns one booking or ErrNotFound
func GetBooking(id string) (*models.EquipmentBooking, error) {
	b, err := scanBooking(DB.QueryRow(`SELECT `+bookingCols+` FROM equipment_bookings WHERE id=$1`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return b, err
}

// SetBookingStatus changes the status only if it is still `from` (compare-and-set);
// ErrBusy means another request changed it first.
func SetBookingStatus(id, from, to string) error {
	res, err := DB.Exec(`UPDATE equipment_bookings SET status=$3 WHERE id=$1 AND status=$2`, id, from, to)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrBusy
	}
	return nil
}

// ── Material offers ──

const offerCols = `id,name,category,unit,price,COALESCE(wholesale_price,0),COALESCE(wholesale_from,0),city,COALESCE(stock,0),
	COALESCE(gost,''),COALESCE(delivery,TRUE),COALESCE(pickup,TRUE),COALESCE(price_code,''),COALESCE(image,''),COALESCE(description,''),
	COALESCE(supplier_id,''),COALESCE(supplier_name,''),COALESCE(supplier_phone,''),COALESCE(status,'active'),
	COALESCE(to_char(created_at,'YYYY-MM-DD'),'')`

func scanOffer(sc interface{ Scan(...interface{}) error }) (*models.MaterialOffer, error) {
	o := &models.MaterialOffer{}
	err := sc.Scan(&o.ID, &o.Name, &o.Category, &o.Unit, &o.Price, &o.WholesalePrice, &o.WholesaleFrom, &o.City, &o.Stock,
		&o.Gost, &o.Delivery, &o.Pickup, &o.PriceCode, &o.Image, &o.Description,
		&o.SupplierID, &o.SupplierName, &o.SupplierPhone, &o.Status, &o.CreatedAt)
	return o, err
}

// OfferFilter narrows ListMaterialOffers
type OfferFilter struct {
	Query      string
	Category   string
	City       string
	SupplierID string // when set, hidden offers of this supplier are returned too
	InStock    bool
}

// ListMaterialOffers returns active offers (plus the supplier's own hidden ones when SupplierID is set)
func ListMaterialOffers(f OfferFilter) ([]*models.MaterialOffer, error) {
	where := []string{}
	args := []interface{}{}
	add := func(cond string, v interface{}) {
		args = append(args, v)
		where = append(where, strings.ReplaceAll(cond, "?", fmt.Sprintf("$%d", len(args))))
	}
	if f.SupplierID != "" {
		add("supplier_id = ?", f.SupplierID)
	} else {
		where = append(where, "status = 'active'")
	}
	if f.Query != "" {
		add("(LOWER(name) LIKE ? OR LOWER(supplier_name) LIKE ? OR LOWER(category) LIKE ?)", "%"+strings.ToLower(f.Query)+"%")
		// the same placeholder is used three times
	}
	if f.Category != "" {
		add("LOWER(category) LIKE ?", "%"+strings.ToLower(f.Category)+"%")
	}
	if f.City != "" {
		add("LOWER(city) = ?", strings.ToLower(f.City))
	}
	if f.InStock {
		where = append(where, "stock > 0")
	}
	q := `SELECT ` + offerCols + ` FROM material_offers`
	if len(where) > 0 {
		q += ` WHERE ` + strings.Join(where, " AND ")
	}
	q += ` ORDER BY created_at DESC LIMIT 1000`
	rows, err := DB.Query(q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []*models.MaterialOffer{}
	for rows.Next() {
		if o, err := scanOffer(rows); err == nil {
			out = append(out, o)
		}
	}
	return out, nil
}

// GetMaterialOffer returns one offer or ErrNotFound
func GetMaterialOffer(id string) (*models.MaterialOffer, error) {
	o, err := scanOffer(DB.QueryRow(`SELECT `+offerCols+` FROM material_offers WHERE id=$1`, id))
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	return o, err
}

// SaveMaterialOffer inserts or updates an offer (upsert by id)
func SaveMaterialOffer(o *models.MaterialOffer) error {
	if o.ID == "" {
		o.ID = newID("mo")
	}
	if o.Status == "" {
		o.Status = "active"
	}
	_, err := DB.Exec(`INSERT INTO material_offers (id,name,category,unit,price,wholesale_price,wholesale_from,city,stock,gost,delivery,pickup,
		price_code,image,description,supplier_id,supplier_name,supplier_phone,status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
		ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,category=EXCLUDED.category,unit=EXCLUDED.unit,price=EXCLUDED.price,
		wholesale_price=EXCLUDED.wholesale_price,wholesale_from=EXCLUDED.wholesale_from,city=EXCLUDED.city,stock=EXCLUDED.stock,
		gost=EXCLUDED.gost,delivery=EXCLUDED.delivery,pickup=EXCLUDED.pickup,price_code=EXCLUDED.price_code,image=EXCLUDED.image,
		description=EXCLUDED.description,supplier_name=EXCLUDED.supplier_name,supplier_phone=EXCLUDED.supplier_phone,status=EXCLUDED.status
		WHERE material_offers.supplier_id = EXCLUDED.supplier_id`,
		o.ID, o.Name, o.Category, o.Unit, o.Price, o.WholesalePrice, o.WholesaleFrom, o.City, o.Stock, o.Gost, o.Delivery, o.Pickup,
		o.PriceCode, o.Image, o.Description, o.SupplierID, o.SupplierName, o.SupplierPhone, o.Status)
	return err
}

// DeleteMaterialOffer removes an offer
func DeleteMaterialOffer(id string) error {
	res, err := DB.Exec(`DELETE FROM material_offers WHERE id=$1`, id)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}
