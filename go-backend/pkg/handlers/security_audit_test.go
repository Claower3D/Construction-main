package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"qazgost-ai/backend/pkg/config"
	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
	"qazgost-ai/backend/pkg/models"
)

// Тесты правил доступа, добавленных по итогам аудита 2026-11.

// newTestOrder создаёт заказ от имени пользователя и удаляет его после теста
func newTestOrder(t *testing.T, userID, role string) models.Order {
	t.Helper()
	w := httptest.NewRecorder()
	NewOrdersHandler().CreateOrder(w, asUser(jsonReq("POST", "/api/v1/orders", map[string]interface{}{"title": "Заказ для проверки чата", "totalSum": 1}), userID, role))
	var o models.Order
	if err := json.NewDecoder(w.Body).Decode(&o); err != nil || o.ID == 0 {
		t.Fatalf("не удалось создать заказ: %d %v", w.Code, err)
	}
	t.Cleanup(func() {
		_, _ = database.DB.Exec(`DELETE FROM chat_messages WHERE order_id=$1`, fmt.Sprintf("%d", o.ID))
		_ = database.DeleteOrder(o.ID)
	})
	return o
}

func sendChat(userID, role, orderID, text string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	NewChatHandler().SendMessage(w, asUser(jsonReq("POST", "/api/v1/chat", map[string]string{"orderId": orderID, "text": text}), userID, role))
	return w
}

func readChat(userID, role, orderID string) (int, []models.ChatMessage) {
	url := "/api/v1/chat"
	if orderID != "" {
		url += "?orderId=" + orderID
	}
	w := httptest.NewRecorder()
	NewChatHandler().GetMessages(w, asUser(httptest.NewRequest("GET", url, nil), userID, role))
	var msgs []models.ChatMessage
	_ = json.NewDecoder(w.Body).Decode(&msgs)
	return w.Code, msgs
}

func hasText(msgs []models.ChatMessage, text string) bool {
	for _, m := range msgs {
		if m.Text == text {
			return true
		}
	}
	return false
}

// Переписку по заказу читают и ведут только участники заказа.
func TestChat_OnlyOrderParticipants(t *testing.T) {
	order := newTestOrder(t, "u_customer_1", "customer")
	oid := fmt.Sprintf("%d", order.ID)
	secret := fmt.Sprintf("секрет заказа %d", time.Now().UnixNano())

	if w := sendChat("u_customer_1", "customer", oid, secret); w.Code != http.StatusCreated {
		t.Fatalf("автор заказа не смог написать в свой чат: %d %s", w.Code, w.Body.String())
	}

	// посторонний заказчик
	if w := sendChat("u_stranger", "customer", oid, "вмешательство"); w.Code != http.StatusForbidden {
		t.Errorf("посторонний написал в чужой заказ: %d", w.Code)
	}
	if code, msgs := readChat("u_stranger", "customer", oid); code != http.StatusForbidden || len(msgs) != 0 {
		t.Errorf("посторонний прочитал чужой чат: %d, сообщений %d", code, len(msgs))
	}
	if _, msgs := readChat("u_stranger", "customer", ""); hasText(msgs, secret) {
		t.Error("чужая переписка попала в общий список постороннего")
	}

	// автор, администратор и технадзор — видят
	if code, msgs := readChat("u_customer_1", "customer", oid); code != http.StatusOK || !hasText(msgs, secret) {
		t.Errorf("автор не видит свою переписку: %d", code)
	}
	if _, msgs := readChat("u_customer_1", "customer", ""); !hasText(msgs, secret) {
		t.Error("своя переписка не попала в общий список автора")
	}
	if code, msgs := readChat("u_admin_1", "admin", oid); code != http.StatusOK || !hasText(msgs, secret) {
		t.Errorf("администратор не видит переписку: %d", code)
	}
	if code, _ := readChat("u_eng_1", "engineer", oid); code != http.StatusOK {
		t.Errorf("технадзор не видит переписку по объекту: %d", code)
	}

	// несуществующий заказ и пустой номер
	for _, bad := range []string{"999999999", "", "abc", "1 OR 1=1"} {
		if w := sendChat("u_customer_1", "customer", bad, "x"); w.Code != http.StatusForbidden {
			t.Errorf("сообщение принято в заказ %q: %d", bad, w.Code)
		}
	}
}

// streamChat подключает пользователя к потоку чата на время работы during и возвращает полученное
func streamChat(userID, role, query string, during func()) (int, string) {
	ctx, cancel := context.WithCancel(context.Background())
	req := asUser(httptest.NewRequest("GET", "/api/v1/chat/stream"+query, nil).WithContext(ctx), userID, role)
	w := httptest.NewRecorder()
	done := make(chan struct{})
	go func() {
		NewChatHandler().StreamMessages(w, req)
		close(done)
	}()
	time.Sleep(60 * time.Millisecond) // дать подписке зарегистрироваться
	during()
	time.Sleep(120 * time.Millisecond)
	cancel()
	<-done
	return w.Code, w.Body.String()
}

// Живой поток отдаёт только переписку по заказам, доступным подключившемуся.
func TestChat_StreamIsFiltered(t *testing.T) {
	order := newTestOrder(t, "u_customer_1", "customer")
	oid := fmt.Sprintf("%d", order.ID)
	secret := fmt.Sprintf("поток %d", time.Now().UnixNano())
	post := func() { sendChat("u_customer_1", "customer", oid, secret) }

	if _, body := streamChat("u_stranger", "customer", "", post); strings.Contains(body, secret) {
		t.Error("посторонний получил чужое сообщение через поток")
	}
	if code, body := streamChat("u_stranger", "customer", "?orderId="+oid, post); code != http.StatusForbidden || strings.Contains(body, secret) {
		t.Errorf("посторонний подписался на чужой заказ: %d", code)
	}
	if _, body := streamChat("u_customer_1", "customer", "", post); !strings.Contains(body, secret) {
		t.Error("автор не получил своё сообщение через поток")
	}
	if _, body := streamChat("u_admin_1", "admin", "?orderId="+oid, post); !strings.Contains(body, secret) {
		t.Error("администратор не получил сообщение через поток")
	}
}

func postLogin(h *AuthHandler, email, password string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	h.Login(w, jsonReq("POST", "/api/v1/auth/login", map[string]string{"email": email, "password": password}))
	return w
}

// Подбор пароля: после 10 неверных попыток вход по этому email закрывается на время.
func TestLogin_BlocksAfterRepeatedFailures(t *testing.T) {
	h := NewAuthHandler(&config.Config{JwtSecret: "test-secret-123"})
	email := fmt.Sprintf("lock_%d@test.kz", time.Now().UnixNano())
	other := fmt.Sprintf("lock_other_%d@test.kz", time.Now().UnixNano())
	for _, e := range []string{email, other} {
		if w := postRegister(t, h, map[string]interface{}{"email": e, "password": "Right-pass-1", "name": "Проверка"}); w.Code != http.StatusCreated {
			t.Fatalf("регистрация %s: %d %s", e, w.Code, w.Body.String())
		}
	}
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM users WHERE email IN ($1,$2)`, email, other) })

	// 3 ошибки, затем верный пароль: вход проходит и счётчик обнуляется
	for i := 0; i < 3; i++ {
		if w := postLogin(h, email, "wrong"); w.Code != http.StatusUnauthorized {
			t.Fatalf("неверный пароль: ожидался 401, получен %d", w.Code)
		}
	}
	if w := postLogin(h, email, "Right-pass-1"); w.Code != http.StatusOK {
		t.Fatalf("верный пароль после 3 ошибок: %d", w.Code)
	}

	for i := 0; i < 10; i++ {
		if w := postLogin(h, email, fmt.Sprintf("wrong-%d", i)); w.Code != http.StatusUnauthorized {
			t.Fatalf("попытка %d: ожидался 401, получен %d", i+1, w.Code)
		}
	}
	w := postLogin(h, email, "Right-pass-1")
	if w.Code != http.StatusTooManyRequests || w.Header().Get("Retry-After") == "" {
		t.Fatalf("после 10 ошибок вход должен быть закрыт: %d, Retry-After=%q", w.Code, w.Header().Get("Retry-After"))
	}
	if !strings.Contains(w.Body.String(), "Слишком много неверных попыток") {
		t.Errorf("непонятный текст блокировки: %s", w.Body.String())
	}
	// регистр и пробелы в email не обходят блокировку
	if w := postLogin(h, "  "+strings.ToUpper(email)+" ", "Right-pass-1"); w.Code != http.StatusTooManyRequests {
		t.Errorf("блокировка обойдена другим написанием email: %d", w.Code)
	}
	// другой пользователь не задет
	if w := postLogin(h, other, "Right-pass-1"); w.Code != http.StatusOK {
		t.Errorf("блокировка одного email закрыла вход другому: %d", w.Code)
	}
}

// Регистрация: строка без «@» — не email; логины мобильных приложений вида «имя@qazgost.kz» проходят.
func TestRegister_EmailShape(t *testing.T) {
	h := NewAuthHandler(&config.Config{JwtSecret: "test-secret-123"})
	for _, bad := range []string{"не-почта", "@test.kz", "user@", "   "} {
		if w := postRegister(t, h, map[string]interface{}{"email": bad, "password": "123456", "name": "x"}); w.Code != http.StatusBadRequest {
			t.Errorf("email %q принят: %d", bad, w.Code)
			_, _ = database.DB.Exec(`DELETE FROM users WHERE email=$1`, strings.ToLower(strings.TrimSpace(bad)))
		}
	}
	mobile := fmt.Sprintf("максим (пто) %d@qazgost.kz", time.Now().UnixNano())
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM users WHERE email=$1`, mobile) })
	if w := postRegister(t, h, map[string]interface{}{"email": mobile, "password": "123456", "name": "Максим", "role": "engineer"}); w.Code != http.StatusCreated {
		t.Errorf("логин мобильного приложения отклонён: %d %s", w.Code, w.Body.String())
	}
}

// Споры видят только администратор и менеджер; остальным — пустой список без ошибки.
func TestDisputes_StaffOnly(t *testing.T) {
	_, _ = database.DB.Exec(`INSERT INTO disputes (id, order_id, claimant, reason) VALUES ('dsp_audit_test','101','Заказчик','Проверка доступа') ON CONFLICT (id) DO NOTHING`)
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM disputes WHERE id='dsp_audit_test'`) })
	h := NewDisputesHandler()

	w := httptest.NewRecorder()
	h.GetDisputes(w, asUser(httptest.NewRequest("GET", "/api/v1/disputes", nil), "u_customer_1", "customer"))
	if w.Code != http.StatusOK || strings.TrimSpace(w.Body.String()) != "[]" {
		t.Errorf("заказчик получил споры платформы: %d %s", w.Code, w.Body.String())
	}

	w = httptest.NewRecorder()
	h.GetDisputes(w, asUser(httptest.NewRequest("GET", "/api/v1/disputes", nil), "u_admin_1", "admin"))
	if w.Code != http.StatusOK || !strings.Contains(w.Body.String(), "dsp_audit_test") {
		t.Errorf("администратор не видит споры: %d %s", w.Code, w.Body.String())
	}
}

// Заказ: слишком длинные поля и слишком большое тело отклоняются, обычный заказ проходит.
func TestOrders_SizeLimits(t *testing.T) {
	h := NewOrdersHandler()
	create := func(body map[string]interface{}) int {
		w := httptest.NewRecorder()
		h.CreateOrder(w, asUser(jsonReq("POST", "/api/v1/orders", body), "u_customer_1", "customer"))
		if w.Code == http.StatusCreated {
			var o models.Order
			_ = json.NewDecoder(w.Body).Decode(&o)
			_ = database.DeleteOrder(o.ID)
		}
		return w.Code
	}
	if code := create(map[string]interface{}{"title": strings.Repeat("я", 500), "location": strings.Repeat("ы", 1000)}); code != http.StatusCreated {
		t.Errorf("заказ на границе лимитов отклонён: %d", code)
	}
	if code := create(map[string]interface{}{"title": strings.Repeat("я", 501)}); code != http.StatusBadRequest {
		t.Errorf("название длиннее 500 символов принято: %d", code)
	}
	if code := create(map[string]interface{}{"title": "x", "location": strings.Repeat("ы", 1001)}); code != http.StatusBadRequest {
		t.Errorf("адрес длиннее 1000 символов принят: %d", code)
	}
	items := make([]map[string]interface{}, 2001)
	for i := range items {
		items[i] = map[string]interface{}{"name": "п", "sum": 1}
	}
	if code := create(map[string]interface{}{"title": "x", "estimateItems": items}); code != http.StatusBadRequest {
		t.Errorf("смета из 2001 позиции принята: %d", code)
	}
	if code := create(map[string]interface{}{"title": "x", "stages": []map[string]interface{}{{"title": "э", "photos": []string{strings.Repeat("A", 9<<20)}}}}); code != http.StatusBadRequest {
		t.Errorf("тело больше 8 МБ принято: %d", code)
	}

	// изменение существующего заказа — те же пределы
	order := newTestOrder(t, "u_customer_1", "customer")
	w := httptest.NewRecorder()
	h.UpdateOrder(w, asUser(jsonReq("PATCH", fmt.Sprintf("/api/v1/orders/%d", order.ID), map[string]string{"title": strings.Repeat("я", 501)}), "u_customer_1", "customer"))
	if w.Code != http.StatusBadRequest {
		t.Errorf("PATCH с названием длиннее 500 символов принят: %d", w.Code)
	}
}

// Смена пароля: нужен текущий пароль, слабые пароли не принимаются, старые сессии отзываются.
func TestChangePassword(t *testing.T) {
	cfg := &config.Config{JwtSecret: "test-secret-123"}
	h := NewAuthHandler(cfg)
	email := fmt.Sprintf("chpass_%d@test.kz", time.Now().UnixNano())
	const oldPass, newPass = "Start-pass-1", "New-strong-pass-2"
	w := postRegister(t, h, map[string]interface{}{"email": email, "password": oldPass, "name": "Смена Пароля"})
	if w.Code != http.StatusCreated {
		t.Fatalf("регистрация: %d %s", w.Code, w.Body.String())
	}
	var reg struct {
		Token string `json:"token"`
		User  struct {
			ID string `json:"id"`
		} `json:"user"`
	}
	_ = json.NewDecoder(w.Body).Decode(&reg)
	t.Cleanup(func() { _, _ = database.DB.Exec(`DELETE FROM users WHERE email=$1`, email) })

	change := func(method, current, next string) *httptest.ResponseRecorder {
		rec := httptest.NewRecorder()
		h.ChangePassword(rec, asUser(jsonReq(method, "/api/v1/auth/password", map[string]string{"currentPassword": current, "newPassword": next}), reg.User.ID, "customer"))
		return rec
	}

	if rec := change("GET", oldPass, newPass); rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("GET: ожидался 405, получен %d", rec.Code)
	}
	if rec := change("POST", "wrong-current", newPass); rec.Code != http.StatusUnauthorized {
		t.Errorf("неверный текущий пароль: ожидался 401, получен %d", rec.Code)
	}
	for _, weak := range []string{"short7!", "admin123", "12345678", "Password123", strings.SplitN(email, "@", 2)[0], email} {
		if rec := change("POST", oldPass, weak); rec.Code != http.StatusBadRequest {
			t.Errorf("слабый пароль %q принят: %d", weak, rec.Code)
		}
	}
	if rec := change("POST", oldPass, oldPass); rec.Code != http.StatusBadRequest {
		t.Errorf("новый пароль равен текущему: ожидался 400, получен %d", rec.Code)
	}
	if rec := postLogin(h, email, oldPass); rec.Code != http.StatusOK {
		t.Fatalf("после отклонённых попыток старый пароль должен работать: %d", rec.Code)
	}

	time.Sleep(1100 * time.Millisecond) // токен регистрации должен оказаться «старше» смены пароля
	rec := change("POST", oldPass, newPass)
	if rec.Code != http.StatusOK {
		t.Fatalf("смена пароля: %d %s", rec.Code, rec.Body.String())
	}
	var out struct {
		OK    bool   `json:"ok"`
		Token string `json:"token"`
	}
	_ = json.NewDecoder(rec.Body).Decode(&out)
	if !out.OK || out.Token == "" {
		t.Fatalf("в ответе нет нового токена: %+v", out)
	}

	if rec := postLogin(h, email, oldPass); rec.Code != http.StatusUnauthorized {
		t.Errorf("старый пароль всё ещё работает: %d", rec.Code)
	}
	if rec := postLogin(h, email, newPass); rec.Code != http.StatusOK {
		t.Errorf("новый пароль не работает: %d", rec.Code)
	}
	if _, err := middleware.ValidateJWT(reg.Token, cfg.JwtSecret); err == nil {
		t.Error("сессия, выданная до смены пароля, осталась действующей")
	}
	if _, err := middleware.ValidateJWT(out.Token, cfg.JwtSecret); err != nil {
		t.Errorf("новая сессия после смены пароля не принимается: %v", err)
	}
	// момент смены сохранён в базе — отзыв переживёт перезапуск сервера
	times, err := database.PasswordChangeTimes()
	if err != nil || times[reg.User.ID] == 0 {
		t.Errorf("время смены пароля не сохранено: %v %v", times[reg.User.ID], err)
	}
}
