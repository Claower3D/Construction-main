package handlers

import (
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"

	"qazgost-ai/backend/pkg/database"
)

// Данные пользователя с сайта (календарь, объекты, уведомления, история смет, настройки компании…).
// Хранятся по ключу, как в браузере, но на сервере — и поэтому одинаковы на всех устройствах.
//
//	GET    /api/v1/me/data            → {items:[{key,updatedAt,size}]}
//	GET    /api/v1/me/data/{key}      → {key,value,updatedAt}
//	PUT    /api/v1/me/data/{key}      ← {value:"<строка>"} → {key,updatedAt}
//	DELETE /api/v1/me/data/{key}

const (
	userDataMaxValue = 4 << 20  // одна запись — до 4 МБ
	userDataMaxTotal = 40 << 20 // всего у пользователя — до 40 МБ
)

var userDataKeyRe = regexp.MustCompile(`^[A-Za-z0-9_.:-]{1,120}$`)

type UserDataHandler struct{}

func NewUserDataHandler() *UserDataHandler { return &UserDataHandler{} }

func (h *UserDataHandler) Serve(w http.ResponseWriter, r *http.Request) {
	uid, _ := currentUser(r)
	if uid == "" {
		writeError(w, http.StatusUnauthorized, "Войдите в аккаунт")
		return
	}
	key := strings.Trim(strings.TrimPrefix(r.URL.Path, "/api/v1/me/data"), "/")
	if key == "" {
		if r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}
		items, err := database.ListUserData(uid)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось загрузить данные")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"items": items})
		return
	}
	if !userDataKeyRe.MatchString(key) {
		writeError(w, http.StatusBadRequest, "Недопустимое имя записи")
		return
	}
	switch r.Method {
	case http.MethodGet:
		value, updatedAt, found, err := database.GetUserData(uid, key)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось загрузить данные")
			return
		}
		if !found {
			writeError(w, http.StatusNotFound, "Запись не найдена")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"key": key, "value": value, "updatedAt": updatedAt})
	case http.MethodPut, http.MethodPost:
		var req struct {
			Value *string `json:"value"`
		}
		body := http.MaxBytesReader(w, r.Body, userDataMaxValue+64<<10)
		data, err := io.ReadAll(body)
		if err != nil {
			writeError(w, http.StatusRequestEntityTooLarge, "Запись больше 4 МБ — она останется только на этом устройстве")
			return
		}
		if err := json.Unmarshal(data, &req); err != nil || req.Value == nil {
			writeError(w, http.StatusBadRequest, "Нужно поле value (строка)")
			return
		}
		if len(*req.Value) > userDataMaxValue {
			writeError(w, http.StatusRequestEntityTooLarge, "Запись больше 4 МБ — она останется только на этом устройстве")
			return
		}
		total, err := database.UserDataTotal(uid, key)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить данные")
			return
		}
		if total+len(*req.Value) > userDataMaxTotal {
			writeError(w, http.StatusRequestEntityTooLarge, "Место для ваших данных на сервере закончилось (40 МБ)")
			return
		}
		updatedAt, err := database.PutUserData(uid, key, *req.Value)
		if err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось сохранить данные")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"key": key, "updatedAt": updatedAt})
	case http.MethodDelete:
		if err := database.DeleteUserData(uid, key); err != nil {
			writeError(w, http.StatusInternalServerError, "Не удалось удалить данные")
			return
		}
		writeJSON(w, http.StatusOK, map[string]interface{}{"key": key, "deleted": true})
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}
