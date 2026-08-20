package models

import "time"

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
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Category    string  `json:"category"`
	PricePerDay float64 `json:"pricePerDay"`
	City        string  `json:"city"`
	Status      string  `json:"status"`
	Image       string  `json:"image"`
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
