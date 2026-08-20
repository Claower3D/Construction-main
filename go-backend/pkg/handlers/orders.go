package handlers

import (
	"encoding/json"
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

func (h *OrdersHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	orders, err := database.GetAllOrders()
	if err != nil {
		orders = []*models.Order{}
	}
	_ = json.NewEncoder(w).Encode(orders)
}

func (h *OrdersHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var order models.Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат заказа"})
		return
	}

	order.ID = time.Now().UnixNano() / 1e6
	order.CreatedAt = time.Now()
	if order.Status == "" {
		order.Status = "Запланировано"
	}
	if order.TotalSum == 0 && len(order.EstimateItems) > 0 {
		var sum float64
		for _, item := range order.EstimateItems {
			sum += item.Sum
		}
		order.TotalSum = sum
	}

	if err := database.CreateOrder(&order); err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Ошибка создания заказа"})
		return
	}

	w.WriteHeader(http.StatusCreated)
	_ = json.NewEncoder(w).Encode(order)
}

func (h *OrdersHandler) UpdateOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	pathParts := strings.Split(r.URL.Path, "/")
	if len(pathParts) < 4 {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "ID заказа не указан"})
		return
	}

	id, err := strconv.ParseInt(pathParts[len(pathParts)-1], 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Некорректный ID заказа"})
		return
	}

	var updatePayload models.Order
	if err := json.NewDecoder(r.Body).Decode(&updatePayload); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Некорректные данные"})
		return
	}

	if len(updatePayload.EstimateItems) > 0 {
		var total float64
		for _, item := range updatePayload.EstimateItems {
			total += item.Sum
		}
		updatePayload.TotalSum = total
	}

	if err := database.UpdateOrder(id, &updatePayload); err != nil {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Заказ не найден"})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Заказ обновлён"})
}

func (h *OrdersHandler) DeleteOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	pathParts := strings.Split(r.URL.Path, "/")
	id, err := strconv.ParseInt(pathParts[len(pathParts)-1], 10, 64)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Некорректный ID"})
		return
	}

	if err := database.DeleteOrder(id); err != nil {
		w.WriteHeader(http.StatusNotFound)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Заказ не найден"})
		return
	}

	_ = json.NewEncoder(w).Encode(map[string]string{"message": "Заказ успешно удален"})
}
