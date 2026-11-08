package handlers

import (
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"sort"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

// Equipment statuses as shown in the marketplace
const (
	eqStatusAvailable = "Доступен"
	eqStatusRented    = "В аренде"
	eqStatusRepair    = "На ремонте"
	eqStatusHidden    = "Снят с публикации"
)

// kzTime: в Казахстане с 01.03.2024 единый часовой пояс UTC+5; «сегодня» считаем по местному времени
var kzZone = time.FixedZone("KZ", 5*3600)

func kzToday() time.Time {
	t := time.Now().In(kzZone)
	return time.Date(t.Year(), t.Month(), t.Day(), 0, 0, 0, 0, time.UTC)
}

var eqStatuses = map[string]bool{eqStatusAvailable: true, eqStatusRented: true, eqStatusRepair: true, eqStatusHidden: true}

// Booking statuses and who may set them
var bookingTransitions = map[string]map[string]string{
	// from → to → who ("owner", "renter", "any")
	"pending":   {"confirmed": "owner", "cancelled": "any"},
	"confirmed": {"completed": "owner", "cancelled": "any"},
}

const maxBookingShifts = 90

type EquipmentHandler struct{}

func NewEquipmentHandler() *EquipmentHandler {
	return &EquipmentHandler{}
}

// GetEquipment handles GET /api/v1/equipment?category=&city=&q=&owner=me&available=1&sort=
// Public: hidden listings are excluded unless owner=me (requires a token, see main.go).
func (h *EquipmentHandler) GetEquipment(w http.ResponseWriter, r *http.Request) {
	items, err := database.GetAllEquipment()
	if err != nil {
		writeError(w, http.StatusServiceUnavailable, "Каталог спецтехники временно недоступен")
		return
	}

	qs := r.URL.Query()
	category := strings.ToLower(strings.TrimSpace(qs.Get("category")))
	city := strings.ToLower(strings.TrimSpace(qs.Get("city")))
	query := strings.ToLower(strings.TrimSpace(qs.Get("q")))
	mine := qs.Get("owner") == "me"
	uid, _ := currentUser(r)
	if mine && uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите, чтобы увидеть свой парк техники")
		return
	}

	busy, _ := database.BusyEquipmentIDs(kzToday().Format("2006-01-02"))

	filtered := make([]*models.Equipment, 0, len(items))
	for _, eq := range items {
		if mine {
			if eq.OwnerID != uid {
				continue
			}
		} else if eq.Status == eqStatusHidden {
			continue
		}
		if category != "" && !strings.Contains(strings.ToLower(eq.Category), category) {
			continue
		}
		if city != "" && !strings.Contains(strings.ToLower(eq.City), city) {
			continue
		}
		if query != "" {
			hay := strings.ToLower(eq.Name + " " + eq.Category + " " + eq.City + " " + eq.Capacity + " " + eq.Description)
			if !strings.Contains(hay, query) {
				continue
			}
		}
		// An active booking for today makes the machine busy regardless of the manual status
		if busy[eq.ID] && eq.Status == eqStatusAvailable {
			eq.Status = eqStatusRented
		}
		if qs.Get("available") == "1" && eq.Status != eqStatusAvailable {
			continue
		}
		// Phone numbers are shown to signed-in users only
		if uid == "" {
			eq.OwnerPhone = ""
		}
		filtered = append(filtered, eq)
	}

	switch qs.Get("sort") {
	case "price_asc":
		sort.SliceStable(filtered, func(i, j int) bool { return filtered[i].PricePerDay < filtered[j].PricePerDay })
	case "price_desc":
		sort.SliceStable(filtered, func(i, j int) bool { return filtered[i].PricePerDay > filtered[j].PricePerDay })
	case "rating_desc":
		sort.SliceStable(filtered, func(i, j int) bool { return filtered[i].Rating > filtered[j].Rating })
	}

	writeJSON(w, http.StatusOK, filtered)
}

type equipmentInput struct {
	Name         *string  `json:"name"`
	Category     *string  `json:"category"`
	PricePerDay  *float64 `json:"pricePerDay"`
	PricePerHour *float64 `json:"pricePerHour"`
	City         *string  `json:"city"`
	Status       *string  `json:"status"`
	Image        *string  `json:"image"`
	OwnerPhone   *string  `json:"ownerPhone"`
	PlateNumber  *string  `json:"plateNumber"`
	Capacity     *string  `json:"capacity"`
	Description  *string  `json:"description"`
	WithOperator *bool    `json:"withOperator"`
	Delivery     *bool    `json:"delivery"`
	OwnerName    *string  `json:"ownerName"`
}

func (in *equipmentInput) apply(eq *models.Equipment) string {
	str := func(p *string, max int) string { return truncate(strings.TrimSpace(*p), max) }
	if in.Name != nil {
		eq.Name = str(in.Name, 160)
	}
	if in.Category != nil {
		eq.Category = str(in.Category, 80)
	}
	if in.PricePerDay != nil {
		eq.PricePerDay = math.Round(*in.PricePerDay)
	}
	if in.PricePerHour != nil {
		eq.PricePerHour = math.Round(*in.PricePerHour)
	}
	if in.City != nil {
		eq.City = str(in.City, 60)
	}
	if in.Status != nil {
		eq.Status = strings.TrimSpace(*in.Status)
	}
	if in.Image != nil {
		img := strings.TrimSpace(*in.Image)
		// only our own uploads or https images; no javascript:/data: URLs
		if img != "" && !strings.HasPrefix(img, "/uploads/") && !strings.HasPrefix(img, "/assets/") && !strings.HasPrefix(img, "https://") {
			return "Фото: допускается ссылка https:// или загруженный файл"
		}
		eq.Image = truncate(img, 500)
	}
	if in.OwnerPhone != nil {
		eq.OwnerPhone = str(in.OwnerPhone, 40)
	}
	if in.OwnerName != nil {
		eq.OwnerName = str(in.OwnerName, 120)
	}
	if in.PlateNumber != nil {
		eq.PlateNumber = str(in.PlateNumber, 20)
	}
	if in.Capacity != nil {
		eq.Capacity = str(in.Capacity, 80)
	}
	if in.Description != nil {
		eq.Description = str(in.Description, 2000)
	}
	if in.WithOperator != nil {
		eq.WithOperator = *in.WithOperator
	}
	if in.Delivery != nil {
		eq.Delivery = *in.Delivery
	}
	// mobile apps may send only an hourly rate: a shift is 8 hours
	if eq.PricePerDay <= 0 && eq.PricePerHour > 0 {
		eq.PricePerDay = eq.PricePerHour * 8
	}
	if eq.Category == "" {
		eq.Category = "Прочая техника"
	}
	switch {
	case eq.Name == "":
		return "Укажите марку и модель техники"
	case eq.PricePerDay <= 0:
		return "Укажите цену за смену больше 0"
	case eq.PricePerDay > 10_000_000 || eq.PricePerHour > 2_000_000:
		return "Проверьте цену: слишком большое значение"
	case eq.PricePerHour < 0:
		return "Цена за час не может быть отрицательной"
	case eq.City == "":
		return "Укажите город"
	case !eqStatuses[eq.Status]:
		return "Недопустимый статус техники"
	}
	return ""
}

// CreateEquipment handles POST /api/v1/equipment (auth)
func (h *EquipmentHandler) CreateEquipment(w http.ResponseWriter, r *http.Request) {
	uid, _ := currentUser(r)
	var in equipmentInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректные данные объявления")
		return
	}
	eq := models.Equipment{Status: eqStatusAvailable, WithOperator: true, Delivery: true, OwnerID: uid}
	if msg := in.apply(&eq); msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return
	}
	if u, err := database.GetUserByID(uid); err == nil && u != nil {
		if eq.OwnerName == "" {
			eq.OwnerName = u.Name
		}
		if eq.OwnerPhone == "" {
			eq.OwnerPhone = u.Phone
		}
	}
	eq.ID = "" // always generated by the server
	if err := database.AddEquipment(&eq); err != nil {
		writeError(w, http.StatusInternalServerError, "Ошибка сохранения спецтехники")
		return
	}
	writeJSON(w, http.StatusCreated, map[string]interface{}{
		"message":   "Спецтехника размещена в маркетплейсе",
		"equipment": eq,
	})
}

// EquipmentItem handles GET/PATCH/DELETE /api/v1/equipment/{id} and POST /api/v1/equipment/{id}/book
func (h *EquipmentHandler) EquipmentItem(w http.ResponseWriter, r *http.Request) {
	rest := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/equipment/"), "/")
	parts := strings.Split(rest, "/")
	id := parts[0]
	if id == "" {
		writeError(w, http.StatusNotFound, "Объявление не найдено")
		return
	}
	if len(parts) == 2 && parts[1] == "book" {
		h.book(w, r, id)
		return
	}
	if len(parts) > 1 {
		writeError(w, http.StatusNotFound, "Неизвестный адрес")
		return
	}

	eq, err := database.GetEquipmentByID(id)
	if errors.Is(err, database.ErrNotFound) {
		writeError(w, http.StatusNotFound, "Объявление не найдено")
		return
	} else if err != nil {
		writeError(w, http.StatusServiceUnavailable, "База данных недоступна")
		return
	}
	uid, role := currentUser(r)

	switch r.Method {
	case http.MethodGet:
		if eq.Status == eqStatusHidden && eq.OwnerID != uid && !isStaff(role) {
			writeError(w, http.StatusNotFound, "Объявление не найдено")
			return
		}
		if uid == "" {
			eq.OwnerPhone = ""
		}
		writeJSON(w, http.StatusOK, eq)
	case http.MethodPatch, http.MethodPut:
		if uid == "" || (eq.OwnerID != uid && !isStaff(role)) {
			writeError(w, http.StatusForbidden, "Изменять объявление может только владелец")
			return
		}
		var in equipmentInput
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
			writeError(w, http.StatusBadRequest, "Некорректные данные")
			return
		}
		if msg := in.apply(eq); msg != "" {
			writeError(w, http.StatusBadRequest, msg)
			return
		}
		if err := database.UpdateEquipment(eq); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить изменения")
			return
		}
		writeJSON(w, http.StatusOK, eq)
	case http.MethodDelete:
		if uid == "" || (eq.OwnerID != uid && !isStaff(role)) {
			writeError(w, http.StatusForbidden, "Удалить объявление может только владелец")
			return
		}
		if err := database.DeleteEquipment(id); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось удалить объявление")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"message": "Объявление удалено"})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

type bookingInput struct {
	DateFrom      string `json:"dateFrom"`
	Shifts        int    `json:"shifts"`
	RenterName    string `json:"renterName"`
	RenterPhone   string `json:"renterPhone"`
	Address       string `json:"address"`
	PaymentMethod string `json:"paymentMethod"`
}

// book handles POST /api/v1/equipment/{id}/book (auth)
func (h *EquipmentHandler) book(w http.ResponseWriter, r *http.Request, id string) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	uid, _ := currentUser(r)
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите, чтобы забронировать технику")
		return
	}
	var in bookingInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректные данные брони")
		return
	}
	from, err := time.Parse("2006-01-02", in.DateFrom)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Укажите дату начала в формате ГГГГ-ММ-ДД")
		return
	}
	today := kzToday()
	if from.Before(today) {
		writeError(w, http.StatusBadRequest, "Дата начала аренды уже прошла")
		return
	}
	if from.After(today.AddDate(1, 0, 0)) {
		writeError(w, http.StatusBadRequest, "Бронировать можно не дальше чем на год вперёд")
		return
	}
	if in.Shifts < 1 || in.Shifts > maxBookingShifts {
		writeError(w, http.StatusBadRequest, "Количество смен — от 1 до 90")
		return
	}
	in.RenterName = truncate(strings.TrimSpace(in.RenterName), 120)
	in.RenterPhone = truncate(strings.TrimSpace(in.RenterPhone), 40)
	in.Address = truncate(strings.TrimSpace(in.Address), 300)
	if in.RenterPhone == "" || in.Address == "" {
		writeError(w, http.StatusBadRequest, "Укажите телефон и адрес объекта")
		return
	}

	eq, err := database.GetEquipmentByID(id)
	if errors.Is(err, database.ErrNotFound) {
		writeError(w, http.StatusNotFound, "Объявление не найдено")
		return
	} else if err != nil {
		writeError(w, http.StatusServiceUnavailable, "База данных недоступна")
		return
	}
	if eq.OwnerID != "" && eq.OwnerID == uid {
		writeError(w, http.StatusBadRequest, "Нельзя забронировать собственную технику")
		return
	}
	if eq.Status == eqStatusRepair || eq.Status == eqStatusHidden {
		writeError(w, http.StatusConflict, "Техника сейчас недоступна для бронирования")
		return
	}

	b := &models.EquipmentBooking{
		EquipmentID:   eq.ID,
		EquipmentName: eq.Name,
		OwnerID:       eq.OwnerID,
		RenterID:      uid,
		RenterName:    in.RenterName,
		RenterPhone:   in.RenterPhone,
		Address:       in.Address,
		DateFrom:      from.Format("2006-01-02"),
		DateTo:        from.AddDate(0, 0, in.Shifts-1).Format("2006-01-02"),
		Shifts:        in.Shifts,
		PricePerShift: eq.PricePerDay, // price is always taken from the listing, never from the client
		Total:         eq.PricePerDay * float64(in.Shifts),
		PaymentMethod: truncate(strings.TrimSpace(in.PaymentMethod), 40),
	}
	switch err := database.CreateBooking(b); {
	case errors.Is(err, database.ErrBusy):
		writeError(w, http.StatusConflict, "Техника уже забронирована на эти даты — выберите другие")
		return
	case errors.Is(err, database.ErrNotFound):
		writeError(w, http.StatusNotFound, "Объявление не найдено")
		return
	case err != nil:
		writeError(w, http.StatusInternalServerError, "Не удалось оформить бронь")
		return
	}
	writeJSON(w, http.StatusCreated, b)
}

// Bookings handles GET /api/v1/equipment-bookings?role=renter|owner (auth)
// and PATCH /api/v1/equipment-bookings/{id} {"status": "..."}
func (h *EquipmentHandler) Bookings(w http.ResponseWriter, r *http.Request) {
	uid, role := currentUser(r)
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "Требуется вход")
		return
	}
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/equipment-bookings"), "/")

	if id == "" {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		scope := r.URL.Query().Get("role")
		if scope == "all" && !isStaff(role) {
			scope = "renter"
		}
		if scope != "owner" && scope != "all" {
			scope = "renter"
		}
		list, err := database.ListBookings(uid, scope)
		if err != nil {
			writeError(w, http.StatusServiceUnavailable, "База данных недоступна")
			return
		}
		writeJSON(w, http.StatusOK, list)
		return
	}

	if r.Method != http.MethodPatch && r.Method != http.MethodPut {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	b, err := database.GetBooking(id)
	if errors.Is(err, database.ErrNotFound) {
		writeError(w, http.StatusNotFound, "Бронь не найдена")
		return
	} else if err != nil {
		writeError(w, http.StatusServiceUnavailable, "База данных недоступна")
		return
	}
	var in struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректные данные")
		return
	}
	who := ""
	switch {
	case isStaff(role):
		who = "staff"
	case b.OwnerID != "" && b.OwnerID == uid:
		who = "owner"
	case b.RenterID == uid:
		who = "renter"
	default:
		writeError(w, http.StatusForbidden, "Нет доступа к этой брони")
		return
	}
	need, ok := bookingTransitions[b.Status][in.Status]
	if !ok {
		writeError(w, http.StatusBadRequest, "Такой переход статуса невозможен")
		return
	}
	if need != "any" && who != need && who != "staff" {
		writeError(w, http.StatusForbidden, "Этот статус может поставить только владелец техники")
		return
	}
	if err := database.SetBookingStatus(id, b.Status, in.Status); errors.Is(err, database.ErrBusy) {
		writeError(w, http.StatusConflict, "Статус брони уже изменился — обновите список")
		return
	} else if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось изменить статус")
		return
	}
	b.Status = in.Status
	writeJSON(w, http.StatusOK, b)
}

func truncate(s string, max int) string {
	r := []rune(s)
	if len(r) > max {
		return string(r[:max])
	}
	return s
}
