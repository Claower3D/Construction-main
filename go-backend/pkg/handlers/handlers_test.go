package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

func TestMain(m *testing.M) {
	_ = os.Remove("./test_qazgost.db")
	_ = database.InitDB("./test_qazgost.db")
	code := m.Run()
	_ = database.DB.Close()
	_ = os.Remove("./test_qazgost.db")
	os.Exit(code)
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
	req := httptest.NewRequest("POST", "/api/v1/orders", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	h.CreateOrder(w, req)
	if w.Code != http.StatusCreated {
		t.Fatalf("Expected 201 Created, got %d: %s", w.Code, w.Body.String())
	}

	// Test GetOrders
	reqGet := httptest.NewRequest("GET", "/api/v1/orders", nil)
	wGet := httptest.NewRecorder()
	h.GetOrders(wGet, reqGet)

	if wGet.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", wGet.Code)
	}
}

func TestFinanceHandler_TopupAndEscrow(t *testing.T) {
	h := NewFinanceHandler()

	// 1. Topup
	topupReq := map[string]interface{}{
		"userId": "test_user_777",
		"amount": 500000.0,
		"method": "Kaspi Pay (Test)",
	}
	body, _ := json.Marshal(topupReq)
	req := httptest.NewRequest("POST", "/api/v1/finance/topup", bytes.NewBuffer(body))
	w := httptest.NewRecorder()

	h.Topup(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on topup, got %d: %s", w.Code, w.Body.String())
	}

	// 2. Check Balance
	reqBal := httptest.NewRequest("GET", "/api/v1/finance/balance?userId=test_user_777", nil)
	wBal := httptest.NewRecorder()
	h.GetBalance(wBal, reqBal)

	var balRes map[string]interface{}
	_ = json.NewDecoder(wBal.Body).Decode(&balRes)
	if balRes["balanceKzt"].(float64) < 500000 {
		t.Fatalf("Expected balance >= 500000, got %v", balRes["balanceKzt"])
	}

	// 3. Lock Escrow
	lockReq := map[string]interface{}{
		"userId":  "test_user_777",
		"orderId": 101,
		"amount":  150000.0,
		"stage":   "Фундаментные работы",
	}
	bodyLock, _ := json.Marshal(lockReq)
	reqLock := httptest.NewRequest("POST", "/api/v1/finance/escrow/lock", bytes.NewBuffer(bodyLock))
	wLock := httptest.NewRecorder()

	h.LockEscrow(wLock, reqLock)
	if wLock.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK on escrow lock, got %d: %s", wLock.Code, wLock.Body.String())
	}

	// 4. Release Escrow
	relReq := map[string]interface{}{
		"fromUserId": "test_user_777",
		"toUserId":   "exec_brigade_1",
		"amount":     150000.0,
		"orderId":    101,
	}
	bodyRel, _ := json.Marshal(relReq)
	reqRel := httptest.NewRequest("POST", "/api/v1/finance/escrow/release", bytes.NewBuffer(bodyRel))
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
