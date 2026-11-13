package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
)

func addTestUser(t *testing.T, role string) (id, email string) {
	t.Helper()
	n := time.Now().UnixNano()
	id = fmt.Sprintf("adm_test_%d", n)
	email = fmt.Sprintf("adm_test_%d@test.kz", n)
	if _, err := database.DB.Exec(`INSERT INTO users (id,email,name,password_hash,role,created_at) VALUES ($1,$2,$3,'x',$4,NOW())`,
		id, email, "Тест "+role, role); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM users WHERE id=$1`, id) })
	return id, email
}

func adminCall(h http.HandlerFunc, method, path string, body interface{}, uid, role string) *httptest.ResponseRecorder {
	var req *http.Request
	if body != nil {
		req = jsonReq(method, path, body)
	} else {
		req = httptest.NewRequest(method, path, nil)
	}
	rec := httptest.NewRecorder()
	h(rec, asUser(req, uid, role))
	return rec
}

func TestAdminEndpoints(t *testing.T) {
	h := NewAdminHandler()
	adminID, _ := addTestUser(t, "admin")
	targetID, targetEmail := addTestUser(t, "engineer")
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM admin_audit WHERE target=$1`, targetID) })

	// не администратор (даже менеджер) не видит ничего
	for _, c := range []struct {
		h    http.HandlerFunc
		path string
	}{{h.Overview, "/api/v1/admin/overview"}, {h.Users, "/api/v1/admin/users"}, {h.Audit, "/api/v1/admin/audit"}} {
		for _, role := range []string{"manager", "engineer", "customer", ""} {
			if rec := adminCall(c.h, "GET", c.path, nil, "someone", role); rec.Code != http.StatusForbidden {
				t.Errorf("%s под ролью %q: ожидался 403, получен %d", c.path, role, rec.Code)
			}
		}
	}

	// сводка
	rec := adminCall(h.Overview, "GET", "/api/v1/admin/overview?days=14", nil, adminID, "admin")
	if rec.Code != http.StatusOK {
		t.Fatalf("overview: %d %s", rec.Code, rec.Body.String())
	}
	var ov database.AdminOverview
	_ = json.NewDecoder(rec.Body).Decode(&ov)
	if ov.Days != 14 || len(ov.Users.PerDay) != 14 || len(ov.Orders.PerDay) != 14 {
		t.Errorf("графики по дням: days=%d users=%d orders=%d", ov.Days, len(ov.Users.PerDay), len(ov.Orders.PerDay))
	}
	if ov.Users.Total < 2 || ov.Users.ByRole["admin"] < 1 || ov.Users.ByRole["engineer"] < 1 {
		t.Errorf("пользователи посчитаны неверно: %+v", ov.Users)
	}
	if last := ov.Users.PerDay[len(ov.Users.PerDay)-1]; last.Date != time.Now().Format("2006-01-02") || last.Count < 2 {
		t.Errorf("сегодняшние регистрации: %+v", last)
	}

	// поиск и фильтр «не подтверждены»
	listHas := func(query string) bool {
		rec := adminCall(h.Users, "GET", "/api/v1/admin/users?"+query, nil, adminID, "admin")
		var res struct {
			Items []database.AdminUser `json:"items"`
			Total int                  `json:"total"`
		}
		_ = json.NewDecoder(rec.Body).Decode(&res)
		for _, u := range res.Items {
			if u.ID == targetID {
				return true
			}
		}
		return false
	}
	if !listHas("q=" + targetEmail) {
		t.Error("поиск по почте не нашёл пользователя")
	}
	if !listHas("unverified=1&limit=200") {
		t.Error("новый инженер должен быть в списке на подтверждение")
	}
	if rec := adminCall(h.Users, "GET", "/api/v1/admin/users?role=superuser", nil, adminID, "admin"); rec.Code != http.StatusBadRequest {
		t.Errorf("неизвестная роль в фильтре: %d", rec.Code)
	}

	// подтверждение
	rec = adminCall(h.Users, "PATCH", "/api/v1/admin/users/"+targetID, map[string]bool{"verified": true}, adminID, "admin")
	var u database.AdminUser
	_ = json.NewDecoder(rec.Body).Decode(&u)
	if rec.Code != http.StatusOK || u.VerifiedAt == "" {
		t.Fatalf("подтверждение: %d %+v", rec.Code, u)
	}
	if listHas("unverified=1&limit=200") {
		t.Error("подтверждённый инженер остался в списке на подтверждение")
	}

	// смена роли: старая сессия пользователя перестаёт действовать
	const secret = "admin-test-secret"
	oldToken, _ := middleware.GenerateJWT(targetID, targetEmail, "engineer", secret)
	time.Sleep(1100 * time.Millisecond)
	rec = adminCall(h.Users, "PATCH", "/api/v1/admin/users/"+targetID, map[string]string{"role": "customer"}, adminID, "admin")
	_ = json.NewDecoder(rec.Body).Decode(&u)
	if rec.Code != http.StatusOK || u.Role != "customer" {
		t.Fatalf("смена роли: %d %+v", rec.Code, u)
	}
	if _, err := middleware.ValidateJWT(oldToken, secret); err == nil {
		t.Error("токен со старой ролью должен быть отозван")
	}
	newToken, _ := middleware.GenerateJWT(targetID, targetEmail, "customer", secret)
	if _, err := middleware.ValidateJWT(newToken, secret); err != nil {
		t.Errorf("новый вход после смены роли должен работать: %v", err)
	}

	// запреты
	if rec := adminCall(h.Users, "PATCH", "/api/v1/admin/users/"+targetID, map[string]string{"role": "root"}, adminID, "admin"); rec.Code != http.StatusBadRequest {
		t.Errorf("неизвестная роль: %d", rec.Code)
	}
	if rec := adminCall(h.Users, "PATCH", "/api/v1/admin/users/"+adminID, map[string]string{"role": "customer"}, adminID, "admin"); rec.Code != http.StatusBadRequest {
		t.Errorf("смена собственной роли: %d", rec.Code)
	}
	if rec := adminCall(h.Users, "PATCH", "/api/v1/admin/users/nope-404", map[string]bool{"verified": true}, adminID, "admin"); rec.Code != http.StatusNotFound {
		t.Errorf("несуществующий пользователь: %d", rec.Code)
	}
	if rec := adminCall(h.Users, "DELETE", "/api/v1/admin/users/"+targetID, nil, adminID, "admin"); rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("удаление не поддерживается: %d", rec.Code)
	}

	// журнал
	rec = adminCall(h.Audit, "GET", "/api/v1/admin/audit", nil, adminID, "admin")
	var audit struct {
		Items []database.AuditEntry `json:"items"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&audit)
	got := map[string]bool{}
	for _, e := range audit.Items {
		if e.Target == targetID {
			got[e.Action] = true
		}
	}
	if !got["verify"] || !got["role"] {
		t.Errorf("в журнале нет записей о подтверждении и смене роли: %v", got)
	}
}
