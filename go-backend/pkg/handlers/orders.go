package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"qazgost-ai/backend/pkg/models"
)

var (
	ordersMutex sync.RWMutex
	ordersStore = []*models.Order{
		{
			ID:          101,
			Title:       "Инженерно-геологические изыскания - ТОО «QazGost»",
			Location:    "Караганда, ул. Ленина 42",
			Time:        "09:00 - 18:00",
			Type:        "object",
			Contractor:  "ТОО «QazGost»",
			Status:      "В работе",
			Deadline:    "До 18:00 (15 Август)",
			JobType:     "Инженерно-геологические изыскания",
			ClientName:  "Иван Петров",
			ClientPhone: "+7 701 555 1234",
			TotalSum:    375000,
			EstimateItems: []models.EstimateItem{
				{ID: 1, Name: "Бурение изыскательских скважин (до 15 м)", Unit: "пог.м", Qty: 30, Price: 8500, Sum: 255000},
				{ID: 2, Name: "Отбор монолитов и проб воды", Unit: "проба", Qty: 8, Price: 4500, Sum: 36000},
				{ID: 3, Name: "Лабораторные испытания грунтов по СП РК", Unit: "компл.", Qty: 1, Price: 84000, Sum: 84000},
			},
			Stages: []models.Stage{
				{ID: "s1", Title: "1. Полевое бурение и отбор проб", Deadline: "12 Авг", Status: "Завершено"},
				{ID: "s2", Title: "2. Лабораторный анализ грунтов", Deadline: "18 Авг", Status: "В работе"},
			},
			CreatedBy: "admin",
			CreatedAt: time.Now(),
		},
		{
			ID:          102,
			Title:       "Септик 3-камерный - Аскар Сериков",
			Location:    "Астана, пос. Косшы, ул. Мира 15",
			Time:        "10:00 - 17:00",
			Type:        "object",
			Contractor:  "ИП «Мастер Сервис»",
			Status:      "Запланировано",
			Deadline:    "До 18:00 (20 Август)",
			JobType:     "Септик",
			ClientName:  "Аскар Сериков",
			ClientPhone: "+7 777 333 9988",
			TotalSum:    413000,
			EstimateItems: []models.EstimateItem{
				{ID: 1, Name: "Разработка котлована под септик", Unit: "м³", Qty: 12, Price: 4000, Sum: 48000},
				{ID: 2, Name: "Септик 3-камерный (3.5 м³)", Unit: "шт", Qty: 1, Price: 280000, Sum: 280000},
				{ID: 3, Name: "Песчано-гравийная подушка", Unit: "м³", Qty: 6, Price: 8500, Sum: 51000},
				{ID: 4, Name: "Монтаж и подключение септика", Unit: "усл.", Qty: 1, Price: 34000, Sum: 34000},
			},
			Stages: []models.Stage{
				{ID: "s1", Title: "1. Земляные работы и котлован", Deadline: "20 Авг", Status: "Запланировано"},
				{ID: "s2", Title: "2. Установка емкости и подключение", Deadline: "22 Авг", Status: "Запланировано"},
			},
			CreatedBy: "admin",
			CreatedAt: time.Now(),
		},
	}
)

type OrdersHandler struct{}

func NewOrdersHandler() *OrdersHandler {
	return &OrdersHandler{}
}

func (h *OrdersHandler) GetOrders(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	ordersMutex.RLock()
	defer ordersMutex.RUnlock()
	_ = json.NewEncoder(w).Encode(ordersStore)
}

func (h *OrdersHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var order models.Order
	if err := json.NewDecoder(r.Body).Decode(&order); err != nil {
		w.WriteHeader(http.StatusBadRequest)
		_ = json.NewEncoder(w).Encode(map[string]string{"error": "Неверный формат заказа"})
		return
	}

	ordersMutex.Lock()
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

	ordersStore = append([]*models.Order{&order}, ordersStore...)
	ordersMutex.Unlock()

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

	ordersMutex.Lock()
	defer ordersMutex.Unlock()

	for i, ord := range ordersStore {
		if ord.ID == id {
			if updatePayload.Title != "" {
				ord.Title = updatePayload.Title
			}
			if updatePayload.Status != "" {
				ord.Status = updatePayload.Status
			}
			if updatePayload.Contractor != "" {
				ord.Contractor = updatePayload.Contractor
			}
			if len(updatePayload.Stages) > 0 {
				ord.Stages = updatePayload.Stages
			}
			if len(updatePayload.EstimateItems) > 0 {
				ord.EstimateItems = updatePayload.EstimateItems
				var total float64
				for _, item := range ord.EstimateItems {
					total += item.Sum
				}
				ord.TotalSum = total
			}
			ordersStore[i] = ord
			_ = json.NewEncoder(w).Encode(ord)
			return
		}
	}

	w.WriteHeader(http.StatusNotFound)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": "Заказ не найден"})
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

	ordersMutex.Lock()
	defer ordersMutex.Unlock()

	for i, ord := range ordersStore {
		if ord.ID == id {
			ordersStore = append(ordersStore[:i], ordersStore[i+1:]...)
			_ = json.NewEncoder(w).Encode(map[string]string{"message": "Заказ успешно удален"})
			return
		}
	}

	w.WriteHeader(http.StatusNotFound)
	_ = json.NewEncoder(w).Encode(map[string]string{"error": "Заказ не найден"})
}
