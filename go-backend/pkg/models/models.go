package models

import (
	"bytes"
	"encoding/json"
	"strings"
	"time"
)

// FlexString accepts a JSON string, number, bool or null and stores it as text.
// Arrays/objects are stored as their raw JSON text. Mobile clients send budget
// as a number, web clients as a string — both must be accepted.
type FlexString string

func (f *FlexString) UnmarshalJSON(b []byte) error {
	t := bytes.TrimSpace(b)
	if len(t) == 0 || string(t) == "null" {
		*f = ""
		return nil
	}
	if t[0] == '"' {
		var v string
		if err := json.Unmarshal(t, &v); err != nil {
			return err
		}
		*f = FlexString(v)
		return nil
	}
	*f = FlexString(t)
	return nil
}

// FlexJSON is like FlexString, but when the stored text is a JSON array/object
// it is emitted back as raw JSON (round-trip of notes arrays from mobile apps).
type FlexJSON string

func (f *FlexJSON) UnmarshalJSON(b []byte) error {
	var s FlexString
	if err := s.UnmarshalJSON(b); err != nil {
		return err
	}
	*f = FlexJSON(s)
	return nil
}

func (f FlexJSON) MarshalJSON() ([]byte, error) {
	t := strings.TrimSpace(string(f))
	if len(t) > 0 && (t[0] == '[' || t[0] == '{') && json.Valid([]byte(t)) {
		return []byte(t), nil
	}
	return json.Marshal(string(f))
}

// User represents a system user
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Name         string    `json:"name"`
	PasswordHash string    `json:"-"`
	Role         string    `json:"role"`
	Phone        string    `json:"phone,omitempty"`
	City         string    `json:"city,omitempty"`
	Company      string    `json:"company,omitempty"`
	Token        string    `json:"token,omitempty"`
	CreatedAt    time.Time `json:"createdAt"`
}

// EstimateItem represents a line item in a cost estimate
type EstimateItem struct {
	ID    int64   `json:"id"`
	Name  string  `json:"name"`
	Unit  string  `json:"unit"`
	Qty   float64 `json:"qty"`
	Price float64 `json:"price"`
	Sum   float64 `json:"sum"`
}

// Stage represents a construction phase
type Stage struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Deadline    string   `json:"deadline"`
	Status      string   `json:"status"`
	Description string   `json:"description,omitempty"`
	Photos      []string `json:"photos,omitempty"`
}

// Order represents a construction project/order
type Order struct {
	ID            int64          `json:"id"`
	Title         string         `json:"title"`
	Location      string         `json:"location"`
	Time          string         `json:"time"`
	Type          string         `json:"type"`
	Contractor    string         `json:"contractor"`
	Status        string         `json:"status"`
	Deadline      string         `json:"deadline"`
	JobType       string         `json:"jobType,omitempty"`
	ClientName    string         `json:"clientName,omitempty"`
	ClientPhone   string         `json:"clientPhone,omitempty"`
	EstimateItems []EstimateItem `json:"estimateItems"`
	TotalSum      float64        `json:"totalSum"`
	Stages        []Stage        `json:"stages"`
	EngineerID    string         `json:"engineerId,omitempty"`
	CreatedBy     string         `json:"createdBy"`
	CreatedAt     time.Time      `json:"createdAt"`
}

// Engineer represents a certified technical supervisor
type Engineer struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Specialization string  `json:"specialization"`
	City           string  `json:"city"`
	Experience     string  `json:"experience"`
	Rating         float64 `json:"rating"`
	Certificate    string  `json:"certificate"`
	Status         string  `json:"status"`
	ProjectsDone   int     `json:"projectsDone"`
}

// Transaction represents a financial balance operation
type Transaction struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	Amount    float64   `json:"amount"`
	Type      string    `json:"type"`
	Method    string    `json:"method"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// ChatMessage represents a chat message
type ChatMessage struct {
	ID         string    `json:"id"`
	OrderID    string    `json:"orderId"`
	SenderID   string    `json:"senderId"`
	SenderName string    `json:"senderName"`
	SenderRole string    `json:"senderRole"`
	Text       string    `json:"text"`
	CreatedAt  time.Time `json:"createdAt"`
}

// PriceRate represents a Kazakh GESN/SNiP construction rate
type PriceRate struct {
	Code     string  `json:"code"`
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	PriceKZT float64 `json:"priceKzt"`
	Category string  `json:"category"`
	Region   string  `json:"region"`
}

// Equipment represents a rental machine/asset
type Equipment struct {
	ID           string  `json:"id"`
	Name         string  `json:"name"`
	Category     string  `json:"category"`
	PricePerDay  float64 `json:"pricePerDay"`
	PricePerHour float64 `json:"pricePerHour,omitempty"`
	City         string  `json:"city"`
	Status       string  `json:"status"`
	Image        string  `json:"image"`
	OwnerID      string  `json:"ownerId,omitempty"`
	OwnerName    string  `json:"ownerName,omitempty"`
	OwnerPhone   string  `json:"ownerPhone,omitempty"`
	PlateNumber  string  `json:"plateNumber,omitempty"`
	Capacity     string  `json:"capacity,omitempty"`
	DistanceKm   float64 `json:"distanceKm,omitempty"`
	Rating       float64 `json:"rating,omitempty"`
	ReviewsCount int     `json:"reviewsCount,omitempty"`
	Description  string  `json:"description,omitempty"`
	WithOperator bool    `json:"withOperator"`
	Delivery     bool    `json:"delivery"`
	CreatedAt    string  `json:"createdAt,omitempty"`
}

// EquipmentBooking is a rental of one machine for a date range (shifts)
type EquipmentBooking struct {
	ID            string  `json:"id"`
	EquipmentID   string  `json:"equipmentId"`
	EquipmentName string  `json:"equipmentName"`
	OwnerID       string  `json:"ownerId,omitempty"`
	RenterID      string  `json:"renterId,omitempty"`
	RenterName    string  `json:"renterName"`
	RenterPhone   string  `json:"renterPhone"`
	Address       string  `json:"address"`
	DateFrom      string  `json:"dateFrom"` // YYYY-MM-DD
	Shifts        int     `json:"shifts"`
	DateTo        string  `json:"dateTo"` // inclusive, YYYY-MM-DD
	PricePerShift float64 `json:"pricePerShift"`
	Total         float64 `json:"total"`
	PaymentMethod string  `json:"paymentMethod"`
	Status        string  `json:"status"` // pending | confirmed | completed | cancelled
	CreatedAt     string  `json:"createdAt"`
}

// MaterialOffer is a supplier's listing in the materials marketplace
type MaterialOffer struct {
	ID             string  `json:"id"`
	Name           string  `json:"name"`
	Category       string  `json:"category"`
	Unit           string  `json:"unit"`
	Price          float64 `json:"price"`
	WholesalePrice float64 `json:"wholesalePrice,omitempty"`
	WholesaleFrom  float64 `json:"wholesaleFrom,omitempty"`
	City           string  `json:"city"`
	Stock          float64 `json:"stock"`
	Gost           string  `json:"gost,omitempty"`
	Delivery       bool    `json:"delivery"`
	Pickup         bool    `json:"pickup"`
	PriceCode      string  `json:"priceCode,omitempty"` // link to the price base (сметная цена)
	Image          string  `json:"image,omitempty"`
	Description    string  `json:"description,omitempty"`
	SupplierID     string  `json:"supplierId,omitempty"`
	SupplierName   string  `json:"supplierName"`
	SupplierPhone  string  `json:"supplierPhone,omitempty"`
	Status         string  `json:"status"` // active | hidden
	CreatedAt      string  `json:"createdAt,omitempty"`
}

// Dispute represents a quality claim/dispute
type Dispute struct {
	ID        string    `json:"id"`
	OrderID   string    `json:"orderId"`
	Claimant  string    `json:"claimant"`
	Reason    string    `json:"reason"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// ── CRM MODELS ──

// Company represents a construction company in CRM
type Company struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	BIN       string    `json:"bin"`
	City      string    `json:"city"`
	Address   string    `json:"address"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	Director  string    `json:"director"`
	Type      string    `json:"type"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

// Brigade represents a construction work team
type Brigade struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	CompanyID string    `json:"companyId"`
	Foreman   string    `json:"foreman"`
	Size      int       `json:"size"`
	Skills    string    `json:"skills"`
	City      string    `json:"city"`
	Status    string    `json:"status"`
	Rating    float64   `json:"rating"`
	CreatedAt time.Time `json:"createdAt"`
}

// Client represents a CRM client/lead
type Client struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Phone     string    `json:"phone"`
	Email     string    `json:"email"`
	City      string    `json:"city"`
	Source    string    `json:"source"`
	Status    string    `json:"status"`
	Notes     string    `json:"notes"`
	CreatedAt time.Time `json:"createdAt"`
}

// CRMEvent represents a synchronized CRM deal / calendar card across all accounts and devices
type CRMEvent struct {
	ID          FlexString `json:"id"`
	Date        FlexString `json:"date"`
	LeadNum     FlexString `json:"leadNum,omitempty"`
	Title       FlexString `json:"title"`
	Status      FlexString `json:"status"`
	Type        FlexString `json:"type,omitempty"`
	Role        FlexString `json:"role,omitempty"`
	Time        FlexString `json:"time,omitempty"`
	Phone       FlexString `json:"phone,omitempty"`
	Contractor  FlexString `json:"contractor,omitempty"`
	Location    FlexString `json:"location,omitempty"`
	Budget      FlexString `json:"budget,omitempty"`
	Description FlexString `json:"description,omitempty"`
	Notes       FlexJSON   `json:"notes,omitempty"`
	CreatedBy   FlexString `json:"createdBy,omitempty"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatedAt"`
}
