package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/models"
)

func decode(t *testing.T, w *httptest.ResponseRecorder, v interface{}) {
	t.Helper()
	if err := json.NewDecoder(w.Body).Decode(v); err != nil {
		t.Fatalf("decode: %v (%s)", err, w.Body.String())
	}
}

func TestEquipmentLifecycleAndBooking(t *testing.T) {
	h := NewEquipmentHandler()
	owner := fmt.Sprintf("u_owner_%d", time.Now().UnixNano())
	renter := fmt.Sprintf("u_renter_%d", time.Now().UnixNano())

	// create
	w := httptest.NewRecorder()
	h.CreateEquipment(w, asUser(jsonReq("POST", "/api/v1/equipment", map[string]interface{}{
		"name": "Экскаватор-погрузчик JCB 4CX", "category": "Землеройная техника", "pricePerDay": 90000, "city": "Алматы",
		"id": "eq_hijack", "ownerId": "someone_else",
	}), owner, "executor"))
	if w.Code != http.StatusCreated {
		t.Fatalf("create: %d %s", w.Code, w.Body.String())
	}
	var created struct{ Equipment models.Equipment }
	decode(t, w, &created)
	eq := created.Equipment
	if eq.ID == "eq_hijack" || eq.OwnerID != owner {
		t.Fatalf("server must assign id and owner, got id=%s owner=%s", eq.ID, eq.OwnerID)
	}

	// validation
	w = httptest.NewRecorder()
	h.CreateEquipment(w, asUser(jsonReq("POST", "/api/v1/equipment", map[string]interface{}{"name": "X", "category": "Y", "pricePerDay": -5, "city": "Алматы"}), owner, "executor"))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("negative price must be rejected, got %d", w.Code)
	}

	// owner=me lists it
	w = httptest.NewRecorder()
	h.GetEquipment(w, asUser(httptest.NewRequest("GET", "/api/v1/equipment?owner=me", nil), owner, "executor"))
	var mine []models.Equipment
	decode(t, w, &mine)
	if len(mine) != 1 || mine[0].ID != eq.ID {
		t.Fatalf("owner=me should return exactly the new listing, got %+v", mine)
	}

	// someone else cannot edit
	w = httptest.NewRecorder()
	h.EquipmentItem(w, asUser(jsonReq("PATCH", "/api/v1/equipment/"+eq.ID, map[string]interface{}{"pricePerDay": 1}), renter, "customer"))
	if w.Code != http.StatusForbidden {
		t.Fatalf("foreign PATCH must be 403, got %d", w.Code)
	}

	// owner edits price
	w = httptest.NewRecorder()
	h.EquipmentItem(w, asUser(jsonReq("PATCH", "/api/v1/equipment/"+eq.ID, map[string]interface{}{"pricePerDay": 95000}), owner, "executor"))
	if w.Code != http.StatusOK {
		t.Fatalf("owner PATCH: %d %s", w.Code, w.Body.String())
	}

	// booking: price comes from the listing, not from the client
	day := time.Now().AddDate(0, 0, 3).Format("2006-01-02")
	w = httptest.NewRecorder()
	h.EquipmentItem(w, asUser(jsonReq("POST", "/api/v1/equipment/"+eq.ID+"/book", map[string]interface{}{
		"dateFrom": day, "shifts": 2, "renterName": "Тест", "renterPhone": "+77010000000", "address": "Алматы, объект", "total": 1,
	}), renter, "customer"))
	if w.Code != http.StatusCreated {
		t.Fatalf("book: %d %s", w.Code, w.Body.String())
	}
	var b models.EquipmentBooking
	decode(t, w, &b)
	if b.Total != 190000 || b.Shifts != 2 || b.DateTo == b.DateFrom {
		t.Fatalf("unexpected booking %+v", b)
	}

	// overlapping booking is rejected
	w = httptest.NewRecorder()
	h.EquipmentItem(w, asUser(jsonReq("POST", "/api/v1/equipment/"+eq.ID+"/book", map[string]interface{}{
		"dateFrom": time.Now().AddDate(0, 0, 4).Format("2006-01-02"), "shifts": 1, "renterPhone": "+7", "address": "x",
	}), renter, "customer"))
	if w.Code != http.StatusConflict {
		t.Fatalf("overlap must be 409, got %d %s", w.Code, w.Body.String())
	}

	// past dates are rejected
	w = httptest.NewRecorder()
	h.EquipmentItem(w, asUser(jsonReq("POST", "/api/v1/equipment/"+eq.ID+"/book", map[string]interface{}{
		"dateFrom": time.Now().AddDate(0, 0, -1).Format("2006-01-02"), "shifts": 1, "renterPhone": "+7", "address": "x",
	}), renter, "customer"))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("past date must be 400, got %d", w.Code)
	}

	// renter sees it, owner sees it; renter cannot confirm, owner can
	w = httptest.NewRecorder()
	h.Bookings(w, asUser(httptest.NewRequest("GET", "/api/v1/equipment-bookings?role=owner", nil), owner, "executor"))
	var ownerList []models.EquipmentBooking
	decode(t, w, &ownerList)
	if len(ownerList) != 1 {
		t.Fatalf("owner should see 1 booking, got %d", len(ownerList))
	}
	w = httptest.NewRecorder()
	h.Bookings(w, asUser(jsonReq("PATCH", "/api/v1/equipment-bookings/"+b.ID, map[string]string{"status": "confirmed"}), renter, "customer"))
	if w.Code != http.StatusForbidden {
		t.Fatalf("renter confirm must be 403, got %d", w.Code)
	}
	w = httptest.NewRecorder()
	h.Bookings(w, asUser(jsonReq("PATCH", "/api/v1/equipment-bookings/"+b.ID, map[string]string{"status": "confirmed"}), owner, "executor"))
	if w.Code != http.StatusOK {
		t.Fatalf("owner confirm: %d %s", w.Code, w.Body.String())
	}
	w = httptest.NewRecorder()
	h.Bookings(w, asUser(jsonReq("PATCH", "/api/v1/equipment-bookings/"+b.ID, map[string]string{"status": "cancelled"}), renter, "customer"))
	if w.Code != http.StatusOK {
		t.Fatalf("renter cancel: %d %s", w.Code, w.Body.String())
	}

	// hidden listing disappears from the public catalogue
	w = httptest.NewRecorder()
	h.EquipmentItem(w, asUser(jsonReq("PATCH", "/api/v1/equipment/"+eq.ID, map[string]interface{}{"status": "Снят с публикации"}), owner, "executor"))
	if w.Code != http.StatusOK {
		t.Fatalf("hide: %d", w.Code)
	}
	w = httptest.NewRecorder()
	h.GetEquipment(w, httptest.NewRequest("GET", "/api/v1/equipment?q=JCB%204CX", nil))
	var pub []models.Equipment
	decode(t, w, &pub)
	for _, e := range pub {
		if e.ID == eq.ID {
			t.Fatalf("hidden listing must not be public")
		}
		if e.OwnerPhone != "" {
			t.Fatalf("phones must be hidden from guests")
		}
	}

	// delete
	w = httptest.NewRecorder()
	h.EquipmentItem(w, asUser(httptest.NewRequest("DELETE", "/api/v1/equipment/"+eq.ID, nil), owner, "executor"))
	if w.Code != http.StatusOK {
		t.Fatalf("delete: %d", w.Code)
	}
}

func TestMaterialOffers(t *testing.T) {
	h := NewMaterialsHandler()
	sup := fmt.Sprintf("u_sup_%d", time.Now().UnixNano())

	w := httptest.NewRecorder()
	h.Offers(w, asUser(jsonReq("POST", "/api/v1/materials", map[string]interface{}{"name": "Цемент", "unit": "мешок", "price": 2200, "city": "Алматы"}), "u_c", "customer"))
	if w.Code != http.StatusForbidden {
		t.Fatalf("customers cannot sell, got %d", w.Code)
	}

	w = httptest.NewRecorder()
	h.Offers(w, asUser(jsonReq("POST", "/api/v1/materials", map[string]interface{}{
		"name": "Цемент ПЦ-400 Д20, 50 кг", "category": "cement", "unit": "мешок", "price": 2300,
		"wholesalePrice": 2100, "wholesaleFrom": 40, "city": "Алматы", "stock": 500, "supplierName": "ТОО Тест",
	}), sup, "company"))
	if w.Code != http.StatusCreated {
		t.Fatalf("create offer: %d %s", w.Code, w.Body.String())
	}
	var res struct{ Offer models.MaterialOffer }
	decode(t, w, &res)

	w = httptest.NewRecorder()
	h.Offers(w, asUser(jsonReq("POST", "/api/v1/materials", map[string]interface{}{
		"name": "X", "unit": "шт", "price": 100, "wholesalePrice": 150, "wholesaleFrom": 5, "city": "Алматы",
	}), sup, "company"))
	if w.Code != http.StatusBadRequest {
		t.Fatalf("wholesale above retail must be rejected, got %d", w.Code)
	}

	w = httptest.NewRecorder()
	h.Offers(w, httptest.NewRequest("GET", "/api/v1/materials?q=пц-400&city=Алматы", nil))
	var list struct {
		Items []struct{ Offer models.MaterialOffer }
	}
	decode(t, w, &list)
	found := false
	for _, it := range list.Items {
		if it.Offer.ID == res.Offer.ID {
			found = true
			if it.Offer.SupplierPhone != "" {
				t.Fatalf("phone must be hidden from guests")
			}
		}
	}
	if !found {
		t.Fatalf("offer not found in public list")
	}

	w = httptest.NewRecorder()
	h.Offers(w, asUser(jsonReq("PATCH", "/api/v1/materials/"+res.Offer.ID, map[string]interface{}{"price": 1}), "u_other", "company"))
	if w.Code != http.StatusForbidden {
		t.Fatalf("foreign PATCH must be 403, got %d", w.Code)
	}
	w = httptest.NewRecorder()
	h.Offers(w, asUser(httptest.NewRequest("DELETE", "/api/v1/materials/"+res.Offer.ID, nil), sup, "company"))
	if w.Code != http.StatusOK {
		t.Fatalf("delete: %d", w.Code)
	}
}

func TestSamePack(t *testing.T) {
	if samePack("Цемент М400 (25кг)", "Цемент ПЦ-400, мешок 50 кг") {
		t.Fatal("25 кг vs 50 кг must not match")
	}
	if !samePack("Цемент ПЦ М400 (50кг)", "Цемент ПЦ-400 Д20 50 кг") || !samePack("Песок", "Песок мытый 50 кг") {
		t.Fatal("same/unspecified pack must match")
	}
}
