package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"qazgost-ai/backend/pkg/database"
	"qazgost-ai/backend/pkg/models"
)

type OrdersHandler struct{}

func NewOrdersHandler() *OrdersHandler {
	return &OrdersHandler{}
}

// canSeeAllOrders: staff, engineers (technical supervision) and executors see the order board;
// customers see only the orders they created.
func canSeeAllOrders(role string) bool {
	return isStaff(role) || role == "engineer" || role == "executor" || role == "company"
}

// canModifyOrder: creator, admin/manager, engineers (technical supervision), or an executor whose company is the contractor
func canModifyOrder(r *http.Request, o *models.Order) bool {
	uid, role := currentUser(r)
	if isStaff(role) || (uid != "" && o.CreatedBy == uid) {
		return true
	}
	if role == "engineer" { // technical supervision works on every object
		return true
	}
	if role == "executor" {
		if u, err := database.GetUserByID(uid); err == nil && u.Company != "" && u.Company == o.Contractor {
			return true
		}
	}
	return false
}

// Пределы заказа — защита от мусора и переполнения базы, а не проверка формы:
// обычный заказ в сотни раз меньше. Тело до 8 МБ оставляет место для фото этапов.
const (
	maxOrderBody   = 8 << 20
	maxOrderTitle  = 500
	maxOrderText   = 1000
	maxOrderItems  = 2000
	maxOrderStages = 300
)

func tooLong(v string, max int) bool { return len([]rune(v)) > max }

// orderTextTooLong проверяет короткие текстовые поля заказа
func orderTextTooLong(o *models.Order) bool {
	if tooLong(o.Title, maxOrderTitle) {
		return true
	}
	for _, v := range []string{o.Location, o.Time, o.Type, o.Contractor, o.Status, o.Deadline, o.JobType, o.ClientName, o.ClientPhone} {
		if tooLong(v, maxOrderText) {
			return true
		}
	}
	return false
}

func orderIDFromPath(path string) (int64, error) {
	parts := strings.Split(strings.TrimRight(path, "/"), "/")
	return strconv.ParseInt(parts[len(parts)-1], 10, 64)
}

func (h *OrdersHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	uid, role := currentUser(r)
	orders, err := database.GetAllOrders()
	if err != nil {
		orders = []*models.Order{}
	}
	if !canSeeAllOrders(role) {
		own := make([]*models.Order, 0, len(orders))
		for _, o := range orders {
			if o.CreatedBy == uid {
				own = append(own, o)
			}
		}
		orders = own
	}
	writeJSON(w, http.StatusOK, orders)
}

func (h *OrdersHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	var order models.Order
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxOrderBody)).Decode(&order); err != nil {
		writeError(w, http.StatusBadRequest, "Неверный формат заказа")
		return
	}
	order.Title = strings.TrimSpace(order.Title)
	if order.Title == "" {
		writeError(w, http.StatusBadRequest, "Укажите название заказа")
		return
	}
	if orderTextTooLong(&order) || len(order.EstimateItems) > maxOrderItems || len(order.Stages) > maxOrderStages {
		writeError(w, http.StatusBadRequest, "Слишком длинные поля заказа: сократите название, адрес или число позиций сметы")
		return
	}
	if order.TotalSum == 0 && len(order.EstimateItems) > 0 {
		var sum float64
		for _, item := range order.EstimateItems {
			sum += item.Sum
		}
		order.TotalSum = sum
	}
	if order.TotalSum < 0 || math.IsNaN(order.TotalSum) || math.IsInf(order.TotalSum, 0) {
		writeError(w, http.StatusBadRequest, "Сумма заказа не может быть отрицательной")
		return
	}

	uid, _ := currentUser(r)
	order.CreatedBy = uid // never trust createdBy from the request body
	order.CreatedAt = time.Now()
	if order.Status == "" {
		order.Status = "Запланировано"
	}

	if err := database.CreateOrder(&order); err != nil { // sets order.ID from the database
		writeError(w, http.StatusInternalServerError, "Ошибка создания заказа")
		return
	}
	writeJSON(w, http.StatusCreated, order)
}

// UpdateOrder applies a partial update: only fields present in the JSON body change.
func (h *OrdersHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	id, err := orderIDFromPath(r.URL.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный ID заказа")
		return
	}
	existing, err := database.GetOrderByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Заказ не найден")
		return
	}
	if !canModifyOrder(r, existing) {
		writeError(w, http.StatusForbidden, "Недостаточно прав для изменения этого заказа")
		return
	}

	var raw map[string]json.RawMessage
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxOrderBody)).Decode(&raw); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректные данные")
		return
	}

	fields := map[string]interface{}{}
	for key, val := range raw {
		col, ok := database.OrderPatchColumns[key]
		if !ok {
			continue // id, createdBy, createdAt, engineerId are not client-editable here
		}
		switch key {
		case "estimateItems":
			var items []models.EstimateItem
			if err := json.Unmarshal(val, &items); err != nil {
				writeError(w, http.StatusBadRequest, "Некорректные позиции сметы")
				return
			}
			if len(items) > maxOrderItems {
				writeError(w, http.StatusBadRequest, "Слишком много позиций сметы")
				return
			}
			b, _ := json.Marshal(items)
			fields[col] = string(b)
			if _, hasTotal := raw["totalSum"]; !hasTotal {
				var total float64
				for _, it := range items {
					total += it.Sum
				}
				fields["total_sum"] = total
			}
		case "stages":
			var stages []models.Stage
			if err := json.Unmarshal(val, &stages); err != nil {
				writeError(w, http.StatusBadRequest, "Некорректные этапы")
				return
			}
			if len(stages) > maxOrderStages {
				writeError(w, http.StatusBadRequest, "Слишком много этапов")
				return
			}
			b, _ := json.Marshal(stages)
			fields[col] = string(b)
		case "totalSum":
			var v float64
			if err := json.Unmarshal(val, &v); err != nil || v < 0 || math.IsNaN(v) || math.IsInf(v, 0) {
				writeError(w, http.StatusBadRequest, "Некорректная сумма")
				return
			}
			fields[col] = v
		default:
			var v string
			if err := json.Unmarshal(val, &v); err != nil {
				writeError(w, http.StatusBadRequest, "Поле "+key+" должно быть строкой")
				return
			}
			if key == "title" && strings.TrimSpace(v) == "" {
				writeError(w, http.StatusBadRequest, "Название заказа не может быть пустым")
				return
			}
			if (key == "title" && tooLong(v, maxOrderTitle)) || tooLong(v, maxOrderText) {
				writeError(w, http.StatusBadRequest, "Поле "+key+" слишком длинное")
				return
			}
			fields[col] = v
		}
	}

	if err := database.PatchOrder(id, fields); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			writeError(w, http.StatusNotFound, "Заказ не найден")
			return
		}
		writeError(w, http.StatusInternalServerError, "Ошибка обновления заказа")
		return
	}
	updated, _ := database.GetOrderByID(id)
	writeJSON(w, http.StatusOK, map[string]interface{}{"message": "Заказ обновлён", "order": updated})
}

func (h *OrdersHandler) DeleteOrder(w http.ResponseWriter, r *http.Request) {
	id, err := orderIDFromPath(r.URL.Path)
	if err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный ID")
		return
	}
	existing, err := database.GetOrderByID(id)
	if err != nil {
		writeError(w, http.StatusNotFound, "Заказ не найден")
		return
	}
	uid, role := currentUser(r)
	if !isStaff(role) && existing.CreatedBy != uid {
		writeError(w, http.StatusForbidden, "Удалить заказ может только его автор или администратор")
		return
	}
	if err := database.DeleteOrder(id); err != nil {
		writeError(w, http.StatusNotFound, "Заказ не найден")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"message": "Заказ успешно удален"})
}
