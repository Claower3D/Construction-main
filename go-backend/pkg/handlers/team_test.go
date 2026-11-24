package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
)

func bodyMap(t *testing.T, w *httptest.ResponseRecorder) map[string]interface{} {
	t.Helper()
	var m map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &m); err != nil {
		t.Fatalf("ответ не JSON (%d): %s", w.Code, w.Body.String())
	}
	return m
}

// Администратор заводит фирму и работника; работник сам задаёт пароль при первом входе.
func TestTeam_AdminAddsCompanyAndWorker(t *testing.T) {
	admin := NewAdminHandler()
	crm := NewCRMHandler()
	auth := NewAuthHandler(&config.Config{JwtSecret: "test-secret-team"})
	tag := fmt.Sprintf("%d", time.Now().UnixNano()%1_000_000)
	login := "worker" + tag
	email := login + "@qazgost.kz"
	var companyID, userID string
	t.Cleanup(func() {
		_, _ = database.DB.Exec(`DELETE FROM users WHERE email = $1`, email)
		_, _ = database.DB.Exec(`DELETE FROM companies WHERE id = $1`, companyID)
	})
	asAdmin := func(method, path string, body interface{}) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		var req *http.Request
		if body == nil {
			req = httptest.NewRequest(method, path, nil)
		} else {
			req = jsonReq(method, path, body)
		}
		if len(path) >= 23 && path[:23] == "/api/v1/admin/companies" {
			admin.Companies(w, asUser(req, "u_admin_t", "admin"))
		} else {
			admin.Users(w, asUser(req, "u_admin_t", "admin"))
		}
		return w
	}

	// фирма
	w := asAdmin("POST", "/api/v1/admin/companies", map[string]string{"name": "ТОО Тест-Монтаж " + tag, "city": "Астана", "bin": "123"})
	if w.Code != http.StatusBadRequest {
		t.Fatalf("короткий БИН приняли: %d", w.Code)
	}
	w = asAdmin("POST", "/api/v1/admin/companies", map[string]string{"name": "ТОО Тест-Монтаж " + tag, "city": "Астана"})
	if w.Code != http.StatusCreated {
		t.Fatalf("фирма: %d %s", w.Code, w.Body.String())
	}
	companyID, _ = bodyMap(t, w)["id"].(string)
	if w = asAdmin("POST", "/api/v1/admin/companies", map[string]string{"name": "тоо тест-монтаж " + tag}); w.Code != http.StatusConflict {
		t.Fatalf("дубль фирмы: %d", w.Code)
	}

	// работник: короткий логин дополняется до адреса
	if w = asAdmin("POST", "/api/v1/admin/users", map[string]string{"name": "Тест Админ", "email": "x" + tag, "role": "admin"}); w.Code != http.StatusBadRequest {
		t.Fatalf("администратора без пароля завели: %d", w.Code)
	}
	w = asAdmin("POST", "/api/v1/admin/users", map[string]string{"name": "Мастер Тестов", "email": login, "role": "executor", "companyId": companyID, "phone": "8 701 555 00 11"})
	if w.Code != http.StatusCreated {
		t.Fatalf("работник: %d %s", w.Code, w.Body.String())
	}
	u := bodyMap(t, w)
	userID, _ = u["id"].(string)
	if u["email"] != email || u["invited"] != true || u["companyId"] != companyID || u["phone"] != "+77015550011" {
		t.Fatalf("карточка работника: %v", u)
	}
	if w = asAdmin("POST", "/api/v1/admin/users", map[string]string{"name": "Двойник", "email": email, "role": "executor"}); w.Code != http.StatusConflict {
		t.Fatalf("дубль логина: %d", w.Code)
	}

	// команда: менеджер видит фирму с работником, чужой исполнитель — нет
	team := func(uid, role string) map[string]interface{} {
		w := httptest.NewRecorder()
		crm.GetTeam(w, asUser(httptest.NewRequest("GET", "/api/v1/crm/team", nil), uid, role))
		if w.Code != http.StatusOK {
			t.Fatalf("команда для %s: %d %s", role, w.Code, w.Body.String())
		}
		return bodyMap(t, w)
	}
	hasWorker := func(m map[string]interface{}) bool {
		for _, c := range m["companies"].([]interface{}) {
			cm := c.(map[string]interface{})
			if cm["id"] != companyID {
				continue
			}
			for _, p := range cm["people"].([]interface{}) {
				if p.(map[string]interface{})["id"] == userID {
					return true
				}
			}
		}
		return false
	}
	if !hasWorker(team("u_mgr_t", "manager")) {
		t.Fatal("менеджер не видит работника в фирме")
	}
	if hasWorker(team("u_other_exec", "executor")) {
		t.Fatal("чужой исполнитель видит чужую фирму")
	}
	mine := team(userID, "executor")
	if !hasWorker(mine) || mine["me"].(map[string]interface{})["companyId"] != companyID {
		t.Fatalf("работник не видит свою фирму: %v", mine)
	}
	w = httptest.NewRecorder()
	crm.GetTeam(w, asUser(httptest.NewRequest("GET", "/api/v1/crm/team", nil), "u_cust_t", "customer"))
	if w.Code != http.StatusForbidden {
		t.Fatalf("заказчик получил список команды: %d", w.Code)
	}

	// первый вход: слабый пароль — понятный отказ; нормальный — вход и пароль закреплён
	signIn := func(pass string) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		auth.Login(w, jsonReq("POST", "/api/v1/auth/login", map[string]string{"email": email, "password": pass}))
		return w
	}
	if w = signIn("12345"); w.Code != http.StatusBadRequest || bodyMap(t, w)["code"] != "first_sign_in" {
		t.Fatalf("короткий пароль при первом входе: %d %s", w.Code, w.Body.String())
	}
	if w = signIn("Stend-Pass-9917"); w.Code != http.StatusOK || bodyMap(t, w)["token"] == nil {
		t.Fatalf("первый вход: %d %s", w.Code, w.Body.String())
	}
	if w = signIn("Other-Pass-0000"); w.Code != http.StatusUnauthorized {
		t.Fatalf("после первого входа чужой пароль пустил: %d", w.Code)
	}
	if w = signIn("Stend-Pass-9917"); w.Code != http.StatusOK {
		t.Fatalf("повторный вход: %d", w.Code)
	}
	if database.IsInvitedWithoutPassword(userID) {
		t.Fatal("после входа аккаунт всё ещё числится без пароля")
	}

	// убрать из фирмы
	if w = asAdmin("PATCH", "/api/v1/admin/users/"+userID, map[string]string{"companyId": ""}); w.Code != http.StatusOK || bodyMap(t, w)["companyId"] != "" {
		t.Fatalf("убрать из фирмы: %d %s", w.Code, w.Body.String())
	}
	if hasWorker(team("u_mgr_t", "manager")) {
		t.Fatal("работник остался в фирме")
	}
}

// Обычный аккаунт с пустым паролем (не заведённый администратором) первым входом не занять.
func TestTeam_OnlyInvitedAccountsCanBeClaimed(t *testing.T) {
	auth := NewAuthHandler(&config.Config{JwtSecret: "test-secret-team"})
	email := fmt.Sprintf("legacy_empty_%d@test.kz", time.Now().UnixNano()%1_000_000)
	_, err := database.DB.Exec(`INSERT INTO users (id,email,name,password_hash,role,created_at) VALUES ($1,$2,'Старый','', 'manager', NOW())`, "u_"+email, email)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM users WHERE email = $1`, email) })
	w := httptest.NewRecorder()
	auth.Login(w, jsonReq("POST", "/api/v1/auth/login", map[string]string{"email": email, "password": "Stend-Pass-9917"}))
	if w.Code != http.StatusUnauthorized {
		t.Fatalf("аккаунт без приглашения заняли первым входом: %d", w.Code)
	}
}
