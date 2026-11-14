package handlers

import (
	"net/http"
	"strings"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

// Доступ к сделкам CRM:
//   - без входа — только отправить новую заявку (форма на сайте), читать и менять нельзя;
//   - admin, manager — видят и меняют все сделки, могут удалять;
//   - engineer, executor, company (рабочие приложения) — видят и меняют все сделки, удаляют только свои;
//   - customer — видит и меняет только свои заявки (созданные им или с его телефоном).

func crmSeesAll(role string) bool {
	switch role {
	case "admin", "manager", "engineer", "executor", "company":
		return true
	}
	return false
}

func phoneTail(s string) string {
	var b strings.Builder
	for _, c := range s {
		if c >= '0' && c <= '9' {
			b.WriteRune(c)
		}
	}
	d := b.String()
	if len(d) > 10 {
		d = d[len(d)-10:]
	}
	return d
}

func samePhone(a, b string) bool {
	ta, tb := phoneTail(a), phoneTail(b)
	return len(ta) >= 7 && ta == tb
}

// crmViewer describes the caller once per request
type crmViewer struct {
	uid, role, phone string
}

func newCRMViewer(r *http.Request) crmViewer {
	uid, role := currentUser(r)
	v := crmViewer{uid: uid, role: role}
	if uid != "" && !crmSeesAll(role) {
		if u, err := database.GetUserByID(uid); err == nil && u != nil {
			v.phone = u.Phone
		}
	}
	return v
}

func (v crmViewer) owns(createdBy, phone string) bool {
	if v.uid == "" {
		return false
	}
	return createdBy == v.uid || (v.phone != "" && samePhone(phone, v.phone))
}

func (v crmViewer) canSee(e *models.CRMEvent) bool {
	return crmSeesAll(v.role) || v.owns(string(e.CreatedBy), string(e.Phone))
}

// checkWrite decides whether the caller may save this deal. Returns 0 when allowed.
func (v crmViewer) checkWrite(e *models.CRMEvent) (int, string) {
	id := strings.TrimSpace(string(e.ID))
	if id != "" {
		createdBy, phone, found, err := database.GetCRMEventOwner(id)
		if err != nil {
			return http.StatusInternalServerError, "Ошибка проверки заявки"
		}
		if found {
			if v.uid == "" {
				return http.StatusUnauthorized, "Войдите, чтобы изменить заявку"
			}
			if !crmSeesAll(v.role) && !v.owns(createdBy, phone) {
				return http.StatusForbidden, "Это не ваша заявка"
			}
			return 0, ""
		}
	}
	// New deal: anyone may send it, but only staff may set the author on someone else's behalf
	if !crmSeesAll(v.role) {
		e.CreatedBy = models.FlexString(v.uid)
	}
	return 0, ""
}

func (v crmViewer) canDelete(createdBy string) bool {
	if v.uid == "" {
		return false
	}
	return isStaff(v.role) || createdBy == v.uid
}
