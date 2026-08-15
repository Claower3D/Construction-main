package handlers

import (
	"encoding/json"
	"net/http"

	"qazgost-ai/backend/pkg/models"
)

var defaultPrices = []models.PriceRate{
	{Code: "GESN-01-01-001", Name: "Разработка грунта механизированным способом в траншеях", Unit: "м³", PriceKZT: 3500, Category: "Земляные работы", Region: "Карагандинская область"},
	{Code: "GESN-01-01-002", Name: "Бурение изыскательских скважин глубиной до 15 м", Unit: "пог.м", PriceKZT: 8500, Category: "Изыскания", Region: "Акмолинская область / Астана"},
	{Code: "GESN-04-02-005", Name: "Монтаж колодца водопроводного сборного ж/б", Unit: "компл.", PriceKZT: 85000, Category: "Водоснабжение", Region: "Все регионы РК"},
	{Code: "GESN-04-02-010", Name: "Прокладка труб ПНД Ø32 в готовую траншею", Unit: "м.п.", PriceKZT: 450, Category: "Водоснабжение", Region: "Все регионы РК"},
	{Code: "GESN-06-01-003", Name: "Устройство песчано-гравийного основания под фундамент", Unit: "м³", PriceKZT: 8500, Category: "Фундаменты", Region: "Все регионы РК"},
	{Code: "GESN-07-03-012", Name: "Испытание сваи статической нагрузкой до 200т", Unit: "свая", PriceKZT: 280000, Category: "Испытания", Region: "Алматы и Астана"},
	{Code: "GESN-01-03-008", Name: "Статическое зондирование грунтов (CPT)", Unit: "точка", PriceKZT: 55000, Category: "Геотехника", Region: "Все регионы РК"},
	{Code: "GESN-01-04-001", Name: "Топографическая съемка М 1:500", Unit: "га", PriceKZT: 65000, Category: "Геодезия", Region: "Все регионы РК"},
}

type PricesHandler struct{}

func NewPricesHandler() *PricesHandler {
	return &PricesHandler{}
}

func (h *PricesHandler) GetPrices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"normative": "ГЭСН / СНиП РК 2026",
		"total":     len(defaultPrices),
		"items":     defaultPrices,
	})
}
