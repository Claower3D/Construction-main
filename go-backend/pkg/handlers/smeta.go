package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"qazgost-ai/backend/pkg/services"
)

// SmetaHandler — расчёт сметы по технологическим картам и реальным ценам.
type SmetaHandler struct {
	priceDB *services.PriceDBService
}

func NewSmetaHandler() *SmetaHandler {
	return &SmetaHandler{priceDB: services.GetPriceDBService()}
}

// TechMaps — GET /api/v1/estimate/techmaps: категории, их параметры, комплексы и регионы.
func (h *SmetaHandler) TechMaps(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	maps, complexes := services.SmetaTechMapList()
	w.Header().Set("Cache-Control", "public, max-age=300")
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"techmaps":  maps,
		"complexes": complexes,
		"regions":   services.SmetaRegions(h.priceDB),
		"priceDate": services.SmetaPriceDate,
	})
}

// Calc — POST /api/v1/estimate/calc
func (h *SmetaHandler) Calc(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64<<10)
	var req services.SmetaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "Некорректный запрос: "+err.Error())
		return
	}
	res, err := services.CalcSmeta(req, h.priceDB)
	if err != nil {
		var se services.SmetaError
		if errors.As(err, &se) {
			writeError(w, http.StatusBadRequest, se.Msg)
			return
		}
		log.Printf("smeta: %v", err)
		writeError(w, http.StatusInternalServerError, "Не удалось рассчитать смету")
		return
	}
	writeJSON(w, http.StatusOK, res)
}
