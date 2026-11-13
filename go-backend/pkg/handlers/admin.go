package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/middleware"
)

// Мобильная админка (приложение «QazGost Админ»). Все адреса — только для роли admin
// (проверка и в middleware, и здесь).
//
//   GET   /api/v1/admin/overview?days=30   сводка и графики
//   GET   /api/v1/admin/users?q=&role=&unverified=1&limit=&offset=
//   GET   /api/v1/admin/users/{id}
//   PATCH /api/v1/admin/users/{id}        {"role": "..."} и/или {"verified": true|false}
//   GET   /api/v1/admin/audit?limit=100    журнал действий администраторов

type AdminHandler struct{}

func NewAdminHandler() *AdminHandler { return &AdminHandler{} }

// AdminRoles — роли, которые администратор может назначить
var AdminRoles = map[string]bool{
	"customer": true, "executor": true, "engineer": true, "company": true, "manager": true, "admin": true,
}

func adminOnly(w http.ResponseWriter, r *http.Request) (id, email string, ok bool) {
	uid, role := currentUser(r)
	if uid == "" || role != "admin" {
		writeError(w, http.StatusForbidden, "Раздел доступен только администратору")
		return "", "", false
	}
	email, _ = r.Context().Value(middleware.ContextEmail).(string)
	return uid, email, true
}

func queryInt(r *http.Request, key string, def, min, max int) int {
	v, err := strconv.Atoi(r.URL.Query().Get(key))
	if err != nil {
		return def
	}
	if v < min {
		return min
	}
	if v > max {
		return max
	}
	return v
}

// Overview — GET /api/v1/admin/overview
func (h *AdminHandler) Overview(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
		return
	}
	if _, _, ok := adminOnly(w, r); !ok {
		return
	}
	writeJSON(w, http.StatusOK, database.GetAdminOverview(queryInt(r, "days", 30, 7, 90)))
}

// Users — GET /api/v1/admin/users и GET|PATCH /api/v1/admin/users/{id}
func (h *AdminHandler) Users(w http.ResponseWriter, r *http.Request) {
	actorID, actorEmail, ok := adminOnly(w, r)
	if !ok {
		return
	}
	id := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/admin/users"), "/")
	if id == "" {
		if r.Method != http.MethodGet {
			writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
			return
		}
		q := r.URL.Query()
		role := q.Get("role")
		if role != "" && !AdminRoles[role] {
			writeError(w, http.StatusBadRequest, "Неизвестная роль")
			return
		}
		items, total, err := database.ListAdminUsers(q.Get("q"), role, q.Get("unverified") == "1",
			queryInt(r, "limit", 50, 1, 200), queryInt(r, "offset", 0, 0, 1_000_000))
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось загрузить пользователей")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"items": items, "total": total})
		return
	}

	switch r.Method {
	case http.MethodGet:
		u, err := database.GetAdminUser(id)
		if err != nil {
			writeError(w, http.StatusNotFound, "Пользователь не найден")
			return
		}
		writeJSON(w, http.StatusOK, u)
	case http.MethodPatch:
		var body struct {
			Role     *string `json:"role"`
			Verified *bool   `json:"verified"`
		}
		if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, 4<<10)).Decode(&body); err != nil || (body.Role == nil && body.Verified == nil) {
			writeError(w, http.StatusBadRequest, "Укажите новую роль или отметку подтверждения")
			return
		}
		u, err := database.GetAdminUser(id)
		if err != nil {
			writeError(w, http.StatusNotFound, "Пользователь не найден")
			return
		}
		if body.Role != nil && *body.Role != u.Role {
			newRole := *body.Role
			if !AdminRoles[newRole] {
				writeError(w, http.StatusBadRequest, "Неизвестная роль")
				return
			}
			if id == actorID {
				writeError(w, http.StatusBadRequest, "Свою роль сменить нельзя — попросите другого администратора")
				return
			}
			if u.Role == "admin" && database.CountAdmins() <= 1 {
				writeError(w, http.StatusBadRequest, "Это последний администратор — сначала назначьте другого")
				return
			}
			// в выданных токенах записана старая роль — выходим со всех устройств
			now := time.Now().Unix()
			if err := database.SetUserRole(id, newRole, now); err != nil {
				writeError(w, http.StatusInternalServerError, "Не удалось сменить роль")
				return
			}
			middleware.RevokeTokensIssuedBefore(id, now)
			database.AddAudit(actorID, actorEmail, "role", id, u.Email+": "+u.Role+" → "+newRole)
		}
		if body.Verified != nil {
			if err := database.SetUserVerified(id, *body.Verified); err != nil {
				writeError(w, http.StatusInternalServerError, "Не удалось сохранить подтверждение")
				return
			}
			action := "verify"
			if !*body.Verified {
				action = "unverify"
			}
			database.AddAudit(actorID, actorEmail, action, id, u.Email+" ("+u.Role+")")
		}
		u, err = database.GetAdminUser(id)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось загрузить пользователя")
			return
		}
		writeJSON(w, http.StatusOK, u)
	default:
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
	}
}

// Audit — GET /api/v1/admin/audit
func (h *AdminHandler) Audit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "Метод не поддерживается")
		return
	}
	if _, _, ok := adminOnly(w, r); !ok {
		return
	}
	items, err := database.ListAudit(queryInt(r, "limit", 100, 1, 500))
	if err != nil && !errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusInternalServerError, "Не удалось загрузить журнал")
		return
	}
	writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
}
