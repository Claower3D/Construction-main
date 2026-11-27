package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sort"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

// Команда для назначения на объект: фирмы → бригады и работники, плюс одиночки.
// Менеджер, администратор и инженер видят всех; исполнитель и подрядчик — только свою фирму.

type teamBrigade struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Foreman string `json:"foreman,omitempty"`
	Size    int    `json:"size,omitempty"`
	Skills  string `json:"skills,omitempty"`
}

type teamCompany struct {
	ID       string                `json:"id"`
	Name     string                `json:"name"`
	City     string                `json:"city,omitempty"`
	Type     string                `json:"type,omitempty"`
	Phone    string                `json:"phone,omitempty"`
	Brigades []teamBrigade         `json:"brigades"`
	People   []database.TeamPerson `json:"people"`
}

var teamViewerRoles = map[string]bool{"admin": true, "manager": true, "engineer": true, RoleEngineerNoCRM: true, "executor": true, "company": true}

func (h *CRMHandler) GetTeam(w http.ResponseWriter, r *http.Request) {
	uid, role := currentUser(r)
	if uid == "" || !teamViewerRoles[role] {
		writeError(w, http.StatusForbidden, "Список команды доступен сотрудникам")
		return
	}
	companies, err := database.GetAllCompanies()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось загрузить фирмы")
		return
	}
	brigades, _ := database.GetAllBrigades()
	people, err := database.ListTeamPeople()
	if err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось загрузить работников")
		return
	}
	myCompany := database.UserCompanyID(uid)
	ownOnly := role == "executor" || role == "company"

	byID := map[string]*teamCompany{}
	order := []*teamCompany{}
	for _, c := range companies {
		if ownOnly && c.ID != myCompany {
			continue
		}
		tc := &teamCompany{ID: c.ID, Name: c.Name, City: c.City, Type: c.Type, Phone: c.Phone, Brigades: []teamBrigade{}, People: []database.TeamPerson{}}
		byID[c.ID] = tc
		order = append(order, tc)
	}
	for _, b := range brigades {
		if tc := byID[b.CompanyID]; tc != nil {
			tc.Brigades = append(tc.Brigades, teamBrigade{ID: b.ID, Name: b.Name, Foreman: b.Foreman, Size: b.Size, Skills: b.Skills})
		}
	}
	solo := []database.TeamPerson{}
	for _, p := range people {
		if tc := byID[p.CompanyID]; tc != nil && p.CompanyID != "" {
			tc.People = append(tc.People, p)
			continue
		}
		if ownOnly {
			if p.ID == uid { // одиночка видит только себя
				solo = append(solo, p)
			}
			continue
		}
		if p.CompanyID == "" {
			solo = append(solo, p)
		}
	}
	sort.SliceStable(order, func(i, j int) bool { return strings.ToLower(order[i].Name) < strings.ToLower(order[j].Name) })
	out := make([]teamCompany, 0, len(order))
	for _, tc := range order {
		out = append(out, *tc)
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"me":        map[string]string{"id": uid, "role": role, "companyId": myCompany},
		"companies": out,
		"solo":      solo,
	})
}

// ── Администратор: фирмы ──

type companyInput struct {
	Name     *string `json:"name"`
	BIN      *string `json:"bin"`
	City     *string `json:"city"`
	Phone    *string `json:"phone"`
	Director *string `json:"director"`
	Type     *string `json:"type"`
}

func trimPtr(p *string, max int) (string, bool) {
	if p == nil {
		return "", false
	}
	v := strings.TrimSpace(*p)
	if len([]rune(v)) > max {
		v = string([]rune(v)[:max])
	}
	return v, true
}

func (in *companyInput) applyTo(c *models.Company) string {
	if v, ok := trimPtr(in.Name, 200); ok {
		c.Name = v
	}
	if v, ok := trimPtr(in.BIN, 20); ok {
		c.BIN = v
	}
	if v, ok := trimPtr(in.City, 100); ok {
		c.City = v
	}
	if v, ok := trimPtr(in.Director, 200); ok {
		c.Director = v
	}
	if v, ok := trimPtr(in.Type, 60); ok {
		c.Type = v
	}
	if v, ok := trimPtr(in.Phone, 50); ok {
		if v != "" {
			norm, good := NormalizeKzPhone(v)
			if !good {
				return "Неверный номер телефона: нужен формат +7 и 10 цифр"
			}
			v = norm
		}
		c.Phone = v
	}
	if c.Name == "" {
		return "Укажите название фирмы"
	}
	if c.BIN != "" && (len(c.BIN) != 12 || strings.Trim(c.BIN, "0123456789") != "") {
		return "БИН — это 12 цифр"
	}
	return ""
}

// Companies: GET — список с числом работников; POST — новая фирма; PATCH ?id= — правка.
func (h *AdminHandler) Companies(w http.ResponseWriter, r *http.Request) {
	actorID, actorEmail, ok := adminOnly(w, r)
	if !ok {
		return
	}
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/admin/companies"), "/")
	if id == "" {
		id = strings.TrimSpace(r.URL.Query().Get("id"))
	}
	switch r.Method {
	case http.MethodGet:
		items, err := database.GetAllCompanies()
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось загрузить фирмы")
			return
		}
		count := database.CompanyHeadcount()
		out := make([]map[string]interface{}, 0, len(items))
		for _, c := range items {
			out = append(out, map[string]interface{}{
				"id": c.ID, "name": c.Name, "bin": c.BIN, "city": c.City, "phone": c.Phone, "director": c.Director,
				"type": c.Type, "status": c.Status, "people": count[c.ID],
			})
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"items": out})
	case http.MethodPost:
		var in companyInput
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8<<10)).Decode(&in); err != nil {
			writeError(w, http.StatusBadRequest, "Неверный формат запроса")
			return
		}
		c := &models.Company{ID: fmt.Sprintf("comp_%d", time.Now().UnixNano()), Status: "active", CreatedAt: time.Now()}
		if msg := in.applyTo(c); msg != "" {
			writeError(w, http.StatusBadRequest, msg)
			return
		}
		if database.CompanyNameTaken(c.Name, "") {
			writeError(w, http.StatusConflict, "Фирма с таким названием уже есть")
			return
		}
		if err := database.CreateCompany(c); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось создать фирму")
			return
		}
		database.AddAudit(actorID, actorEmail, "company_create", c.ID, c.Name)
		writeJSON(w, http.StatusCreated, c)
	case http.MethodPatch:
		c, err := database.GetCompany(id)
		if err != nil {
			writeError(w, http.StatusNotFound, "Фирма не найдена")
			return
		}
		var in companyInput
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8<<10)).Decode(&in); err != nil {
			writeError(w, http.StatusBadRequest, "Неверный формат запроса")
			return
		}
		if msg := in.applyTo(c); msg != "" {
			writeError(w, http.StatusBadRequest, msg)
			return
		}
		if database.CompanyNameTaken(c.Name, c.ID) {
			writeError(w, http.StatusConflict, "Фирма с таким названием уже есть")
			return
		}
		if err := database.UpdateCompany(c); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить фирму")
			return
		}
		database.AddAudit(actorID, actorEmail, "company_update", c.ID, c.Name)
		writeJSON(w, http.StatusOK, c)
	default:
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
	}
}

// ── Администратор: новый работник ──

// inviteRoles — кого можно завести заранее. Администратора так не создать: аккаунт без пароля
// занимает тот, кто войдёт первым, и для полного доступа это слишком рискованно.
var inviteRoles = map[string]bool{"executor": true, "engineer": true, RoleEngineerNoCRM: true, "company": true, "manager": true, "customer": true}

func (h *AdminHandler) createUser(w http.ResponseWriter, r *http.Request, actorID, actorEmail string) {
	var in struct {
		Name      string `json:"name"`
		Email     string `json:"email"`
		Role      string `json:"role"`
		Phone     string `json:"phone"`
		City      string `json:"city"`
		CompanyID string `json:"companyId"`
	}
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 8<<10)).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "Неверный формат запроса")
		return
	}
	name := strings.TrimSpace(in.Name)
	email := strings.ToLower(strings.TrimSpace(in.Email))
	if name == "" || len([]rune(name)) > 200 {
		writeError(w, http.StatusBadRequest, "Укажите ФИО работника")
		return
	}
	if email == "" || strings.ContainsAny(email, " \t\r\n") || len(email) > 200 {
		writeError(w, http.StatusBadRequest, "Укажите логин или email без пробелов")
		return
	}
	if !strings.Contains(email, "@") { // короткий логин: как в мобильных приложениях
		email += "@qazgost.kz"
	}
	if at := strings.LastIndex(email, "@"); at <= 0 || at == len(email)-1 {
		writeError(w, http.StatusBadRequest, "Укажите email в формате name@example.kz")
		return
	}
	if !inviteRoles[in.Role] {
		writeError(w, http.StatusBadRequest, "Выберите роль: исполнитель, инженер, подрядчик, менеджер или заказчик")
		return
	}
	phone := strings.TrimSpace(in.Phone)
	if phone != "" {
		norm, good := NormalizeKzPhone(phone)
		if !good {
			writeError(w, http.StatusBadRequest, "Неверный номер телефона: нужен формат +7 и 10 цифр")
			return
		}
		phone = norm
	}
	city := strings.TrimSpace(in.City)
	if len([]rune(city)) > 100 {
		city = string([]rune(city)[:100])
	}
	companyName := ""
	if in.CompanyID != "" {
		c, err := database.GetCompany(in.CompanyID)
		if err != nil {
			writeError(w, http.StatusBadRequest, "Фирма не найдена")
			return
		}
		companyName = c.Name
	}
	if _, err := database.GetUserByEmail(email); err == nil {
		writeError(w, http.StatusConflict, "Пользователь с таким логином уже есть")
		return
	}
	u := &models.User{ID: fmt.Sprintf("usr_%d", time.Now().UnixNano()), Email: email, Name: name, Role: in.Role,
		Phone: phone, City: city, Company: companyName, CreatedAt: time.Now()}
	if err := database.CreateInvitedUser(u, in.CompanyID); err != nil {
		writeError(w, http.StatusInternalServerError, "Не удалось создать работника")
		return
	}
	database.AddAudit(actorID, actorEmail, "user_invite", u.ID, fmt.Sprintf("%s (%s), роль %s, фирма: %s", email, name, in.Role, companyName))
	created, err := database.GetAdminUser(u.ID)
	if err != nil {
		writeJSON(w, http.StatusCreated, map[string]string{"id": u.ID, "email": email})
		return
	}
	writeJSON(w, http.StatusCreated, created)
}
