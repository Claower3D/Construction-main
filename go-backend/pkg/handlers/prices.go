package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"qazgost-ai/backend/pkg/services"
)

type PricesHandler struct {
	priceDB *services.PriceDBService
}

func NewPricesHandler() *PricesHandler {
	return &PricesHandler{
		priceDB: services.GetPriceDBService(),
	}
}

// GetPrices handles GET /api/v1/prices with search, filtering, and regional adjustments
func (h *PricesHandler) GetPrices(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	// If route path is /api/v1/prices/stats
	if strings.HasSuffix(r.URL.Path, "/stats") {
		stats := h.priceDB.GetStats()
		_ = json.NewEncoder(w).Encode(stats)
		return
	}

	// If route path is /api/v1/prices/regions
	if strings.HasSuffix(r.URL.Path, "/regions") {
		regions := h.priceDB.GetRegions()
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"regions": regions,
			"total":   len(regions),
		})
		return
	}

	query := r.URL.Query()
	q := query.Get("q")
	category := query.Get("category")
	itemType := query.Get("type")
	region := query.Get("region")

	limit := 50
	if lStr := query.Get("limit"); lStr != "" {
		if l, err := strconv.Atoi(lStr); err == nil && l > 0 {
			limit = l
		}
	}

	offset := 0
	if oStr := query.Get("offset"); oStr != "" {
		if o, err := strconv.Atoi(oStr); err == nil && o >= 0 {
			offset = o
		}
	}

	res := h.priceDB.Search(services.SearchParams{
		Query:    q,
		Category: category,
		Type:     itemType,
		Region:   region,
		Limit:    limit,
		Offset:   offset,
	})

	_ = json.NewEncoder(w).Encode(res)
}

// GetStats returns summary statistics of the price database
func (h *PricesHandler) GetStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(h.priceDB.GetStats())
}

// GetRegions returns regional price multipliers
func (h *PricesHandler) GetRegions(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]interface{}{
		"regions": h.priceDB.GetRegions(),
		"total":   len(h.priceDB.GetRegions()),
	})
}
