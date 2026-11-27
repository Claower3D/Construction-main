package handlers

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
)

// Наблюдатель: видит «Застройщика» и панель администратора, но ничего там не меняет.
// Запросы идут через настоящую цепочку: токен → ObserverMiddleware → обработчик.
func TestObserverSeesButCannotChange(t *testing.T) {
	const secret = "observer-test-secret"
	cfg := &config.Config{UploadDir: t.TempDir(), JwtSecret: secret}
	vip := NewVipHandler(cfg)
	adm := NewAdminHandler()

	adminID, adminEmail := addTestUser(t, "admin")
	obsID, obsEmail := addTestUser(t, "engineer")
	plainID, plainEmail := addTestUser(t, "engineer")
	token := func(id, email, role string) string {
		tok, err := middleware.GenerateJWT(id, email, role, secret)
		if err != nil {
			t.Fatal(err)
		}
		return tok
	}
	adminTok, obsTok, plainTok := token(adminID, adminEmail, "admin"), token(obsID, obsEmail, "engineer"), token(plainID, plainEmail, "engineer")

	vipRoute := middleware.ObserverMiddleware(secret, []string{"admin", "manager"}, database.IsObserver, vip.Projects)
	usersRoute := middleware.ObserverMiddleware(secret, []string{"admin"}, database.IsObserver, adm.Users)
	auditRoute := middleware.ObserverMiddleware(secret, []string{"admin"}, database.IsObserver, adm.Audit)
	mediaRoute := middleware.RoleMiddleware(secret, []string{"admin", "manager"}, vip.UploadMedia)
	do := func(h http.HandlerFunc, method, path string, body interface{}, tok string) *httptest.ResponseRecorder {
		var r *http.Request
		if body != nil {
			r = jsonReq(method, path, body)
		} else {
			r = httptest.NewRequest(method, path, nil)
		}
		r.Header.Set("Authorization", "Bearer "+tok)
		w := httptest.NewRecorder()
		h(w, r)
		return w
	}

	// проект создаёт администратор
	w := do(vipRoute, "POST", "/api/v1/vip/projects", map[string]interface{}{"data": vipDoc("Объект для наблюдателя")}, adminTok)
	if w.Code != http.StatusCreated && w.Code != http.StatusOK {
		t.Fatalf("администратор создаёт проект: %d %s", w.Code, w.Body.String())
	}
	var made struct {
		ID      string `json:"id"`
		Version int    `json:"version"`
	}
	_ = json.Unmarshal(w.Body.Bytes(), &made)
	if made.ID == "" {
		t.Fatalf("нет id проекта: %s", w.Body.String())
	}
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM vip_projects WHERE id=$1`, made.ID) })

	// пока доступ не открыт — инженер не видит ни проектов, ни панели
	for name, rec := range map[string]*httptest.ResponseRecorder{
		"проекты":      do(vipRoute, "GET", "/api/v1/vip/projects", nil, obsTok),
		"пользователи": do(usersRoute, "GET", "/api/v1/admin/users", nil, obsTok),
	} {
		if rec.Code != http.StatusForbidden {
			t.Fatalf("до открытия доступа %s — 403, получено %d", name, rec.Code)
		}
	}

	// доступ открывает администратор — в журнале остаётся запись
	if w := do(usersRoute, "PATCH", "/api/v1/admin/users/"+obsID, map[string]interface{}{"observer": true}, adminTok); w.Code != http.StatusOK {
		t.Fatalf("администратор открывает просмотр: %d %s", w.Code, w.Body.String())
	}
	if !database.IsObserver(obsID) {
		t.Fatal("после включения пользователь должен быть наблюдателем")
	}
	var audits int
	database.DB.QueryRow(`SELECT COUNT(*) FROM admin_audit WHERE action='observer' AND target=$1`, obsID).Scan(&audits)
	if audits != 1 {
		t.Fatalf("в журнале должна быть одна запись об открытии просмотра, найдено %d", audits)
	}

	// читает: список проектов, сам проект, пользователей, журнал
	if w := do(vipRoute, "GET", "/api/v1/vip/projects", nil, obsTok); w.Code != http.StatusOK || !strings.Contains(w.Body.String(), made.ID) {
		t.Fatalf("наблюдатель видит список проектов: %d %s", w.Code, w.Body.String())
	}
	if w := do(vipRoute, "GET", "/api/v1/vip/projects/"+made.ID, nil, obsTok); w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "Ливневая система") {
		t.Fatalf("наблюдатель открывает проект: %d", w.Code)
	}
	if w := do(usersRoute, "GET", "/api/v1/admin/users", nil, obsTok); w.Code != http.StatusOK {
		t.Fatalf("наблюдатель видит пользователей: %d %s", w.Code, w.Body.String())
	}
	if w := do(auditRoute, "GET", "/api/v1/admin/audit", nil, obsTok); w.Code != http.StatusOK {
		t.Fatalf("наблюдатель видит журнал: %d", w.Code)
	}

	// не меняет: проект, пользователей (в том числе роли и собственный доступ), файлы
	writes := []struct {
		name string
		rec  *httptest.ResponseRecorder
	}{
		{"создать проект", do(vipRoute, "POST", "/api/v1/vip/projects", map[string]interface{}{"data": vipDoc("Чужой")}, obsTok)},
		{"изменить проект", do(vipRoute, "PUT", "/api/v1/vip/projects/"+made.ID, map[string]interface{}{"version": made.Version, "data": vipDoc("Переписал")}, obsTok)},
		{"удалить проект", do(vipRoute, "DELETE", "/api/v1/vip/projects/"+made.ID, nil, obsTok)},
		{"сменить роль себе", do(usersRoute, "PATCH", "/api/v1/admin/users/"+obsID, map[string]interface{}{"role": "admin"}, obsTok)},
		{"сменить роль другому", do(usersRoute, "PATCH", "/api/v1/admin/users/"+plainID, map[string]interface{}{"role": "manager"}, obsTok)},
		{"открыть просмотр другому", do(usersRoute, "PATCH", "/api/v1/admin/users/"+plainID, map[string]interface{}{"observer": true}, obsTok)},
		{"завести пользователя", do(usersRoute, "POST", "/api/v1/admin/users", map[string]interface{}{"email": "x@test.kz", "name": "Икс", "role": "admin"}, obsTok)},
		{"загрузить файл", do(mediaRoute, "POST", "/api/v1/vip/media", nil, obsTok)},
	}
	for _, c := range writes {
		if c.rec.Code != http.StatusForbidden {
			t.Fatalf("наблюдатель не должен %s: ждали 403, получено %d %s", c.name, c.rec.Code, c.rec.Body.String())
		}
	}
	if w := do(vipRoute, "GET", "/api/v1/vip/projects/"+made.ID, nil, adminTok); !strings.Contains(w.Body.String(), "Объект для наблюдателя") {
		t.Fatal("проект не должен был измениться")
	}
	var role string
	database.DB.QueryRow(`SELECT role FROM users WHERE id=$1`, obsID).Scan(&role)
	if role != "engineer" {
		t.Fatalf("роль наблюдателя не должна меняться, стала %q", role)
	}
	if database.IsObserver(plainID) {
		t.Fatal("наблюдатель не может раздавать просмотр другим")
	}

	// обычный инженер по-прежнему не видит ничего
	if w := do(vipRoute, "GET", "/api/v1/vip/projects", nil, plainTok); w.Code != http.StatusForbidden {
		t.Fatalf("инженер без доступа — 403, получено %d", w.Code)
	}
	if w := do(usersRoute, "GET", "/api/v1/admin/users", nil, plainTok); w.Code != http.StatusForbidden {
		t.Fatalf("инженер без доступа к панели — 403, получено %d", w.Code)
	}

	// администратор закрыл доступ — действует сразу, со старым токеном
	if w := do(usersRoute, "PATCH", "/api/v1/admin/users/"+obsID, map[string]interface{}{"observer": false}, adminTok); w.Code != http.StatusOK {
		t.Fatalf("администратор закрывает просмотр: %d", w.Code)
	}
	if w := do(vipRoute, "GET", "/api/v1/vip/projects", nil, obsTok); w.Code != http.StatusForbidden {
		t.Fatalf("после закрытия доступа — 403, получено %d", w.Code)
	}
}
