package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
	"qazgost-ai/backend/pkg/models"
)

// Tests need a throwaway PostgreSQL database:
//   TEST_DATABASE_URL=postgres://postgres@localhost:5432/qazgost_test?sslmode=disable go test ./...
// (the old TestMain passed a SQLite file path to the PostgreSQL driver, so 3 of 5 tests always failed)
func TestMain(m *testing.M) {
	url := os.Getenv("TEST_DATABASE_URL")
	if url == "" {
		fmt.Println("TEST_DATABASE_URL not set — skipping handler tests that need PostgreSQL")
		os.Exit(0)
	}
	if err := database.InitDB(url); err != nil {
		fmt.Println("cannot init test database:", err)
		os.Exit(1)
	}
	code := m.Run()
	_ = database.DB.Close()
	os.Exit(code)
}

// asUser injects the claims AuthMiddleware would put into the request context
func asUser(r *http.Request, id, role string) *http.Request {
	ctx := context.WithValue(r.Context(), middleware.ContextUserID, id)
	ctx = context.WithValue(ctx, middleware.ContextRole, role)
	return r.WithContext(ctx)
}

func jsonReq(method, path string, v interface{}) *http.Request {
	b, _ := json.Marshal(v)
	return httptest.NewRequest(method, path, bytes.NewBuffer(b))
}

func TestHealthCheck(t *testing.T) {
	h := NewHealthHandler()
	req := httptest.NewRequest("GET", "/health", nil)
	w := httptest.NewRecorder()

	h.HealthCheck(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}

	var res map[string]interface{}
	if err := json.NewDecoder(w.Body).Decode(&res); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if res["status"] != "ok" {
		t.Errorf("Expected status ok, got %v", res["status"])
	}
}

func TestOrdersHandler_CreateAndGet(t *testing.T) {
	h := NewOrdersHandler()

	order := models.Order{
		Title:      "Тестовый объект - Ремонт офиса",
		JobType:    "Отделочные работы",
		ClientName: "Аскар Сатпаев",
		TotalSum:   750000,
		Status:     "Запланировано",
	}

	body, _ := json.Marshal(order)
	req := asUser(httptest.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body)), "u_customer_1", "customer")
	w := httptest.NewRecorder()

	h.CreateOrder(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	// Test GetOrders
	reqGet := asUser(httptest.NewRequest("GET", "/api/v1/orders", nil), "u_customer_1", "customer")
	wGet := httptest.NewRecorder()
	h.GetOrders(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", wGet.Code)
	}
}

func TestFinanceHandler_TopupAndEscrow(t *testing.T) {
	// логика учёта на будущее: включаем оплату только на время теста
	PaymentsEnabled = true
	defer func() { PaymentsEnabled = false }()
	h := NewFinanceHandler()

	// 1. Topup
	topupReq := map[string]interface{}{
		"amount": 500000.0,
		"method": "Kaspi Pay (Test)",
	}
	body, _ := json.Marshal(topupReq)
	req := asUser(httptest.NewRequest("POST", "/api/v1/finance/topup", bytes.NewBuffer(body)), "u_eng_1", "engineer")
	w := httptest.NewRecorder()

	h.Topup(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on topup, got %d: %s", w.Code, w.Body.String())
	}

	// 2. Check Balance
	reqBal := asUser(httptest.NewRequest("GET", "/api/v1/finance/balance", nil), "u_eng_1", "engineer")
	wBal := httptest.NewRecorder()
	h.GetBalance(wBal, reqBal)

	var balRes map[string]interface{}
	_ = json.NewDecoder(wBal.Body).Decode(&balRes)
	if balRes["balanceKzt"].(float64) < 500000 {
		t.Fatalf("Expected balance >= 500000, got %v", balRes["balanceKzt"])
	}

	// 3. Lock Escrow
	lockReq := map[string]interface{}{
		"orderId": 101,
		"amount":  150000.0,
		"stage":   "Фундаментные работы",
	}
	bodyLock, _ := json.Marshal(lockReq)
	reqLock := asUser(httptest.NewRequest("POST", "/api/v1/finance/escrow/lock", bytes.NewBuffer(bodyLock)), "u_eng_1", "engineer")
	wLock := httptest.NewRecorder()

	h.LockEscrow(wLock, reqLock)
	if wLock.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on escrow lock, got %d: %s", wLock.Code, wLock.Body.String())
	}

	// 4. Release Escrow
	relReq := map[string]interface{}{
		"toUserId":   "u_exec_1",
		"amount":     150000.0,
		"orderId":    101,
	}
	bodyRel, _ := json.Marshal(relReq)
	reqRel := asUser(httptest.NewRequest("POST", "/api/v1/finance/escrow/release", bytes.NewBuffer(bodyRel)), "u_eng_1", "engineer")
	wRel := httptest.NewRecorder()

	h.ReleaseEscrow(wRel, reqRel)
	if wRel.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on escrow release, got %d: %s", wRel.Code, wRel.Body.String())
	}
}

func TestAiHandler_EstimateAndDefect(t *testing.T) {
	cfg := &config.Config{OpenAIKey: ""}
	h := NewAiHandler(cfg)

	// 1. AI Estimate Cost (Go SNiP RK 16 Native Formulas)
	estReq := UnifiedEstimateRequest{
		Category: "Общестроительные работы",
		City:     "Алматы",
		Dimensions: map[string]float64{
			"area": 45.0,
		},
		Description: "Кладка стен из кирпича 45 м2",
	}
	bodyEst, _ := json.Marshal(estReq)
	reqEst := httptest.NewRequest("POST", "/api/v1/ai/estimate", bytes.NewBuffer(bodyEst))
	wEst := httptest.NewRecorder()

	h.EstimateCost(wEst, reqEst)
	if wEst.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on estimate, got %d: %s", wEst.Code, wEst.Body.String())
	}

	// 2. AI Inspect Defect (Go SNiP RK Expert Fallback)
	defReq := map[string]string{
		"description": "Обнаружена глубокая трещина штукатурки и протечка в углу потолка",
	}
	bodyDef, _ := json.Marshal(defReq)
	reqDef := httptest.NewRequest("POST", "/api/v1/ai/defect", bytes.NewBuffer(bodyDef))
	wDef := httptest.NewRecorder()

	h.InspectDefect(wDef, reqDef)
	if wDef.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on defect inspection, got %d: %s", wDef.Code, wDef.Body.String())
	}

	var defRes map[string]interface{}
	_ = json.NewDecoder(wDef.Body).Decode(&defRes)
	if defRes["defectType"] == "" || defRes["snipCode"] == "" {
		t.Errorf("Expected defectType and snipCode to be populated, got: %v", defRes)
	}
}

func TestExecutorRegistrationWithEquipment(t *testing.T) {
	cfg := &config.Config{JwtSecret: "test-secret-123"}
	authHnd := NewAuthHandler(cfg)
	equipHnd := NewEquipmentHandler()

	// 1. Register an executor who owns an excavator
	regReq := map[string]interface{}{
		"email":             "driver_kazakh@stroy.kz",
		"password":          "secure12345",
		"name":              "Касымбек Жолдасов",
		"role":              "executor",
		"city":              "Астана",
		"phone":             "+7 (701) 999-88-77",
		"hasEquipment":      true,
		"equipmentName":     "Гусеничный экскаватор CAT 320D (1.2 м³)",
		"equipmentCategory": "Землеройная техника",
		"pricePerDay":       110000.0,
		"plateNumber":       "01 888 KZ 01",
	}

	bodyReg, _ := json.Marshal(regReq)
	reqReg := httptest.NewRequest("POST", "/api/v1/auth/register", bytes.NewBuffer(bodyReg))
	wReg := httptest.NewRecorder()

	authHnd.Register(wReg, reqReg)
	if wReg.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created on registration, got %d: %s", wReg.Code, wReg.Body.String())
	}

	// 2. Query Equipment Marketplace to verify machine is live
	reqEq := httptest.NewRequest("GET", "/api/v1/equipment?city=астана", nil)
	wEq := httptest.NewRecorder()

	equipHnd.GetEquipment(wEq, reqEq)
	if wEq.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK from equipment marketplace, got %d", wEq.Code)
	}

	var items []*models.Equipment
	if err := json.NewDecoder(wEq.Body).Decode(&items); err != nil {
		t.Fatalf("Failed to decode equipment list: %v", err)
	}

	found := false
	for _, item := range items {
		if item.Name == "Гусеничный экскаватор CAT 320D (1.2 м³)" {
			found = true
			if item.PricePerDay != 110000.0 {
				t.Errorf("Expected price 110000, got %v", item.PricePerDay)
			}
			break
		}
	}

	if !found {
		t.Fatalf("Newly registered executor's equipment was NOT found in marketplace!")
	}
}


// ── Regression tests for bugs found in the November 2026 audit ──

func TestCRMDelete_ExactMatchOnly(t *testing.T) {
	h := NewCRMHandler()
	for _, id := range []string{"del_a1", "del_a12", "del_b1"} {
		w := httptest.NewRecorder()
		h.CreateOrUpdateCRMEvent(w, jsonReq("POST", "/api/v1/crm/events", map[string]interface{}{"id": id, "title": "t " + id, "date": "2026-11-05"}))
		if w.Code != http.StatusOK {
			t.Fatalf("create %s: %d %s", id, w.Code, w.Body.String())
		}
	}
	count := func() int {
		items, _ := database.GetAllCRMEvents()
		n := 0
		for _, e := range items {
			if len(e.ID) >= 4 && string(e.ID)[:4] == "del_" {
				n++
			}
		}
		return n
	}
	w := httptest.NewRecorder()
	h.DeleteCRMEvent(w, httptest.NewRequest("DELETE", "/api/v1/crm/events?id=del_a1", nil))
	if w.Code != http.StatusOK || count() != 2 {
		t.Fatalf("delete del_a1 must remove exactly one event, left %d (code %d)", count(), w.Code)
	}
	w = httptest.NewRecorder()
	h.DeleteCRMEvent(w, httptest.NewRequest("DELETE", "/api/v1/crm/events?id=%25", nil))
	if w.Code != http.StatusNotFound || count() != 2 {
		t.Fatalf("delete id=%% must not wipe anything, code %d, left %d", w.Code, count())
	}
}

func TestCRMEvent_AcceptsMobilePayloadTypes(t *testing.T) {
	h := NewCRMHandler()
	body := map[string]interface{}{"items": []map[string]interface{}{{
		"id": 7921, "title": "Септик", "date": "2026-11-06", "budget": 375000.5,
		"notes": []map[string]string{{"text": "замер", "author": "Максим"}},
	}}}
	w := httptest.NewRecorder()
	h.BulkSyncCRMEvents(w, jsonReq("POST", "/api/v1/crm/events/sync", body))
	if w.Code != http.StatusOK {
		t.Fatalf("mobile sync payload rejected: %d %s", w.Code, w.Body.String())
	}
	items, _ := database.GetAllCRMEvents()
	for _, e := range items {
		if e.ID == "7921" {
			out, _ := json.Marshal(e)
			var back map[string]interface{}
			_ = json.Unmarshal(out, &back)
			if _, isArr := back["notes"].([]interface{}); !isArr || back["budget"] != "375000.5" {
				t.Fatalf("round-trip broken: %s", out)
			}
			return
		}
	}
	t.Fatal("synced event not found")
}

func TestCRMEvent_Validation(t *testing.T) {
	h := NewCRMHandler()
	for _, bad := range []map[string]interface{}{{"title": "", "date": "2026-11-01"}, {"title": "x", "date": "не-дата"}} {
		w := httptest.NewRecorder()
		h.CreateOrUpdateCRMEvent(w, jsonReq("POST", "/api/v1/crm/events", bad))
		if w.Code != http.StatusBadRequest {
			t.Errorf("expected 400 for %v, got %d", bad, w.Code)
		}
	}
	w := httptest.NewRecorder()
	h.CreateOrUpdateCRMEvent(w, jsonReq("POST", "/api/v1/crm/events", map[string]interface{}{"title": "ru date", "date": "05.11.2026"}))
	if w.Code != http.StatusOK || !bytes.Contains(w.Body.Bytes(), []byte(`"2026-11-05"`)) {
		t.Errorf("dd.mm.yyyy must be normalised: %d %s", w.Code, w.Body.String())
	}
}

func TestFinance_OwnershipAndLimits(t *testing.T) {
	// логика учёта на будущее: включаем оплату только на время теста
	PaymentsEnabled = true
	defer func() { PaymentsEnabled = false }()
	h := NewFinanceHandler()

	w := httptest.NewRecorder()
	h.GetBalance(w, asUser(httptest.NewRequest("GET", "/api/v1/finance/balance?userId=u_admin_1", nil), "u_customer_1", "customer"))
	if w.Code != http.StatusForbidden {
		t.Errorf("customer read admin balance: %d", w.Code)
	}

	w = httptest.NewRecorder()
	h.Topup(w, asUser(jsonReq("POST", "/", map[string]interface{}{"userId": "u_admin_1", "amount": 1000}), "u_customer_1", "customer"))
	if w.Code != http.StatusForbidden {
		t.Errorf("customer topped up admin: %d", w.Code)
	}

	w = httptest.NewRecorder()
	h.ReleaseEscrow(w, asUser(jsonReq("POST", "/", map[string]interface{}{"fromUserId": "u_admin_1", "toUserId": "u_customer_1", "amount": 1000}), "u_customer_1", "customer"))
	if w.Code != http.StatusForbidden {
		t.Errorf("customer released admin escrow: %d", w.Code)
	}

	bal0, esc0 := database.GetBalance("u_customer_1")
	w = httptest.NewRecorder()
	h.ReleaseEscrow(w, asUser(jsonReq("POST", "/", map[string]interface{}{"toUserId": "u_exec_1", "amount": esc0 + 1_000_000}), "u_customer_1", "customer"))
	bal1, _ := database.GetBalance("u_customer_1")
	if w.Code != http.StatusBadRequest || bal1 != bal0 {
		t.Errorf("release above escrow must fail without touching balance: code %d, %v -> %v", w.Code, bal0, bal1)
	}

	w = httptest.NewRecorder()
	h.Topup(w, asUser(jsonReq("POST", "/", map[string]interface{}{"amount": 100.5}), "u_customer_1", "customer"))
	bal2, _ := database.GetBalance("u_customer_1")
	if w.Code != http.StatusOK || bal2-bal1 != 100.5 {
		t.Errorf("fractional top-up must really be credited: code %d delta %v", w.Code, bal2-bal1)
	}

	w = httptest.NewRecorder()
	h.GetTransactions(w, asUser(httptest.NewRequest("GET", "/", nil), "u_exec_1", "executor"))
	var res struct {
		Items []models.Transaction `json:"items"`
	}
	_ = json.NewDecoder(w.Body).Decode(&res)
	for _, tx := range res.Items {
		if tx.UserID != "u_exec_1" {
			t.Fatalf("executor sees foreign transaction of %s", tx.UserID)
		}
	}
}

func TestOrders_IDPatchAndOwnership(t *testing.T) {
	h := NewOrdersHandler()
	w := httptest.NewRecorder()
	h.CreateOrder(w, asUser(jsonReq("POST", "/api/v1/orders", map[string]interface{}{"title": "Фундамент", "totalSum": 1000, "createdBy": "admin"}), "u_customer_1", "customer"))
	var created models.Order
	_ = json.NewDecoder(w.Body).Decode(&created)
	stored, err := database.GetOrderByID(created.ID)
	if err != nil || stored.Title != "Фундамент" {
		t.Fatalf("returned id %d does not exist in DB: %v", created.ID, err)
	}
	if stored.CreatedBy != "u_customer_1" {
		t.Errorf("createdBy must come from the token, got %q", stored.CreatedBy)
	}

	w = httptest.NewRecorder()
	h.UpdateOrder(w, asUser(jsonReq("PATCH", fmt.Sprintf("/api/v1/orders/%d", created.ID), map[string]string{"status": "В работе"}), "u_customer_1", "customer"))
	after, _ := database.GetOrderByID(created.ID)
	if w.Code != http.StatusOK || after.Title != "Фундамент" || after.TotalSum != 1000 || after.Status != "В работе" {
		t.Fatalf("PATCH status must keep other fields: code %d, %+v", w.Code, after)
	}

	w = httptest.NewRecorder()
	h.UpdateOrder(w, asUser(jsonReq("PUT", "/api/v1/orders/999999999", map[string]string{"title": "x"}), "u_admin_1", "admin"))
	if w.Code != http.StatusNotFound {
		t.Errorf("update of a missing order must be 404, got %d", w.Code)
	}

	w = httptest.NewRecorder()
	h.DeleteOrder(w, asUser(httptest.NewRequest("DELETE", fmt.Sprintf("/api/v1/orders/%d", created.ID), nil), "u_exec_1", "executor"))
	if w.Code != http.StatusForbidden {
		t.Errorf("executor deleted a foreign order: %d", w.Code)
	}
}

func TestChat_SenderFromToken(t *testing.T) {
	h := NewChatHandler()
	order := newTestOrder(t, "u_customer_1", "customer") // писать можно только в чат своего заказа
	w := httptest.NewRecorder()
	h.SendMessage(w, asUser(jsonReq("POST", "/api/v1/chat", map[string]string{"orderId": fmt.Sprintf("%d", order.ID), "text": "hi", "senderId": "u_admin_1", "senderRole": "admin", "senderName": "Админ"}), "u_customer_1", "customer"))
	var msg models.ChatMessage
	_ = json.NewDecoder(w.Body).Decode(&msg)
	if msg.SenderID != "u_customer_1" || msg.SenderRole != "customer" {
		t.Fatalf("sender spoofing possible: %+v", msg)
	}
}

func TestUpload_RejectsHTML(t *testing.T) {
	h := NewFilesHandler(&config.Config{UploadDir: t.TempDir()})
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)
	fw, _ := mw.CreateFormFile("file", "x.html")
	_, _ = fw.Write([]byte("<script>alert(1)</script>"))
	_ = mw.Close()
	req := httptest.NewRequest("POST", "/api/v1/files/upload", &buf)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()
	h.UploadFile(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("html upload must be rejected, got %d", w.Code)
	}
}

func TestDefectVision_NoKeyUsesDescription(t *testing.T) {
	h := NewAiHandler(&config.Config{})
	w := httptest.NewRecorder()
	h.DefectVisionProxy(w, jsonReq("POST", "/api/v1/ai/defect-vision", map[string]interface{}{"description": "протечка воды с потолка"}))
	if !bytes.Contains(w.Body.Bytes(), []byte("гидроизоляц")) {
		t.Fatalf("description ignored: %s", w.Body.String())
	}
}

func TestEquipment_PersistsOwnerFields(t *testing.T) {
	h := NewEquipmentHandler()
	w := httptest.NewRecorder()
	h.CreateEquipment(w, asUser(jsonReq("POST", "/api/v1/equipment", map[string]interface{}{"name": "Кран тест", "pricePerHour": 15000, "plateNumber": "123ABC", "city": "Астана"}), "u_exec_1", "executor"))
	var res struct {
		Equipment models.Equipment `json:"equipment"`
	}
	_ = json.NewDecoder(w.Body).Decode(&res)
	items, _ := database.GetAllEquipment()
	for _, e := range items {
		if e.ID == res.Equipment.ID {
			if e.OwnerID != "u_exec_1" || e.PlateNumber != "123ABC" || e.PricePerHour != 15000 {
				t.Fatalf("owner fields lost: %+v", e)
			}
			return
		}
	}
	t.Fatal("equipment not stored")
}

func TestHealth_CountsPostgresTables(t *testing.T) {
	h := NewHealthHandler()
	w := httptest.NewRecorder()
	h.HealthCheck(w, httptest.NewRequest("GET", "/health", nil))
	var res map[string]interface{}
	_ = json.NewDecoder(w.Body).Decode(&res)
	if w.Code != http.StatusOK || res["dbTables"].(float64) < 12 {
		t.Fatalf("health: %d %v", w.Code, res)
	}
}

// Честный режим: пока онлайн-оплата не подключена, денег «из воздуха» нет —
// новый кошелёк с нуля, пополнение/эскроу/выплата отвечают 503 и ничего не меняют.
func TestFinance_PaymentsDisabled(t *testing.T) {
	PaymentsEnabled = false
	h := NewFinanceHandler()

	w := httptest.NewRecorder()
	h.Config(w, httptest.NewRequest("GET", "/api/v1/finance/config", nil))
	var cfg map[string]interface{}
	_ = json.NewDecoder(w.Body).Decode(&cfg)
	if cfg["paymentsEnabled"] != false {
		t.Fatalf("config должен сообщать paymentsEnabled=false, получили %v", cfg)
	}

	before, _ := database.GetBalance("u_exec_1")
	for name, call := range map[string]func(http.ResponseWriter, *http.Request){
		"topup":   h.Topup,
		"lock":    h.LockEscrow,
		"release": h.ReleaseEscrow,
	} {
		w := httptest.NewRecorder()
		call(w, asUser(jsonReq("POST", "/", map[string]interface{}{"amount": 100000, "toUserId": "u_customer_1"}), "u_exec_1", "executor"))
		if w.Code != http.StatusServiceUnavailable {
			t.Errorf("%s при выключенной оплате: ожидали 503, получили %d", name, w.Code)
		}
	}
	after, _ := database.GetBalance("u_exec_1")
	if after != before {
		t.Errorf("баланс изменился без оплаты: %v → %v", before, after)
	}

	// новый пользователь начинает с нуля, а не со 100 000 ₸
	if bal, esc := database.GetBalance("u_new_wallet_check"); bal != 0 || esc != 0 {
		t.Errorf("новый кошелёк должен быть пустым, получили %v / %v", bal, esc)
	}
}
