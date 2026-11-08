package services

import (
	"encoding/json"
	"log"
	"math"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"sync"
)

// PriceItem represents a single work, material, or equipment item in the database
type PriceItem struct {
	Code     string  `json:"code"`
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	Price    float64 `json:"price"`
	Category string  `json:"category"`
	Source   string  `json:"source,omitempty"`
	Type     string  `json:"type"` // "work", "material", "equipment"
	// QA: "" (ok), "corrected" (price fixed by tools/pricedb/calibrate.py), "suspect" (outside the reference corridor)
	QA       string  `json:"qa,omitempty"`
	PriceRaw float64 `json:"priceRaw,omitempty"`
	dup      bool    // a non-canonical duplicate (same type+name+unit as another item)
}

// RawPriceDB represents the raw JSON structure of price_db.json
type RawPriceDB struct {
	Version              string                            `json:"version"`
	ExportedAt           string                            `json:"exported_at"`
	RegionalCoefficients map[string]float64                `json:"regional_coefficients"`
	Works                map[string]map[string]interface{} `json:"works"`
	Materials            map[string]map[string]interface{} `json:"materials"`
	Equipment            map[string]map[string]interface{} `json:"equipment"`
	Stats                map[string]interface{}            `json:"stats"`
}

// PriceDBService handles high-speed in-memory searches and rate queries
type PriceDBService struct {
	mu           sync.RWMutex
	items        []PriceItem
	itemByCode   map[string]PriceItem
	categories   map[string]int
	coefficients map[string]float64
	version      string
	totalCount   int
	audit        map[string]interface{}
}

var (
	priceDBInstance *PriceDBService
	priceDBOnce     sync.Once
)

// GetPriceDBService returns the singleton instance of PriceDBService
func GetPriceDBService() *PriceDBService {
	priceDBOnce.Do(func() {
		priceDBInstance = NewPriceDBService()
		priceDBInstance.LoadDatabase()
	})
	return priceDBInstance
}

// NewPriceDBService creates a new PriceDB service instance
func NewPriceDBService() *PriceDBService {
	return &PriceDBService{
		items:        make([]PriceItem, 0, 25000),
		itemByCode:   make(map[string]PriceItem, 25000),
		categories:   make(map[string]int),
		coefficients: make(map[string]float64),
	}
}

// LoadDatabase loads price_db.json into memory
func (s *PriceDBService) LoadDatabase() {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Candidate paths for price_db.json
	candidatePaths := []string{}
	if env := os.Getenv("PRICE_DB_PATH"); env != "" {
		candidatePaths = append(candidatePaths, env)
	}
	if exe, err := os.Executable(); err == nil { // next to the binary (Docker: /app/server)
		dir := filepath.Dir(exe)
		candidatePaths = append(candidatePaths,
			filepath.Join(dir, "ai-service/app/data/price_db.json"),
			filepath.Join(dir, "../ai-service/app/data/price_db.json"))
	}
	candidatePaths = append(candidatePaths,
		"../ai-service/app/data/price_db.json",
		"../../ai-service/app/data/price_db.json",
		"ai-service/app/data/price_db.json",
		"data/price_db.json",
		"pkg/data/price_db.json",
	)

	var data []byte
	var loadedPath string

	for _, p := range candidatePaths {
		abs, _ := filepath.Abs(p)
		if fileData, errRead := os.ReadFile(abs); errRead == nil {
			data = fileData
			loadedPath = abs
			break
		}
	}

	if len(data) == 0 {
		log.Printf("⚠️ [PriceDB] price_db.json not found, using fallback seed data")
		s.loadFallbackData()
		return
	}

	var raw RawPriceDB
	if err := json.Unmarshal(data, &raw); err != nil {
		log.Printf("❌ [PriceDB] JSON unmarshal error: %v, using fallback seed data", err)
		s.loadFallbackData()
		return
	}

	s.version = raw.Version
	s.coefficients = raw.RegionalCoefficients

	// Ensure default regional coefficients for all major Kazakhstan cities
	defaultRegions := map[string]float64{
		"Астана": 1.15, "Алматы": 1.00, "Шымкент": 0.95, "Атырау": 1.25,
		"Актау": 1.20, "Караганда": 1.05, "Актобе": 1.05, "Павлодар": 1.00,
		"Усть-Каменогорск": 1.05, "Костанай": 1.00, "Тараз": 0.95, "Семей": 1.00,
		"Кызылорда": 0.95, "Уральск": 1.05, "Петропавловск": 1.00, "Туркестан": 0.90,
		"Кокшетау": 1.00, "Темиртау": 1.05, "Талдыкорган": 1.00, "Экибастуз": 1.00,
		"Рудный": 1.00, "Жанаозен": 1.20, "Жезказган": 1.10,
	}
	if s.coefficients == nil {
		s.coefficients = make(map[string]float64)
	}
	for city, coef := range defaultRegions {
		if _, exists := s.coefficients[city]; !exists {
			s.coefficients[city] = coef
		}
	}

	// Parse Works
	s.parseCategoryMap(raw.Works, "work")
	// Parse Materials
	s.parseCategoryMap(raw.Materials, "material")
	// Parse Equipment
	s.parseCategoryMap(raw.Equipment, "equipment")
	if a, ok := raw.Stats["audit"].(map[string]interface{}); ok {
		s.audit = a
	}
	s.finalize()

	s.totalCount = len(s.items)
	log.Printf("✅ [PriceDB] Loaded %d items (%s) from %s", s.totalCount, s.version, loadedPath)
}

func (s *PriceDBService) parseCategoryMap(data map[string]map[string]interface{}, itemType string) {
	for code, val := range data {
		name, _ := val["name"].(string)
		unit, _ := val["unit"].(string)
		category, _ := val["category"].(string)
		source, _ := val["source"].(string)

		var price float64
		switch p := val["price"].(type) {
		case float64:
			price = p
		case int:
			price = float64(p)
		}
		qa, _ := val["qa"].(string)
		priceRaw, _ := val["priceRaw"].(float64)

		if name == "" {
			name = code
		}
		if category == "" {
			category = "Общие работы"
		}

		item := PriceItem{
			Code:     code,
			Name:     name,
			Unit:     unit,
			Price:    price,
			Category: category,
			Source:   source,
			Type:     itemType,
			QA:       qa,
			PriceRaw: priceRaw,
		}

		s.items = append(s.items, item)
		s.itemByCode[code] = item
		s.categories[category]++
	}
}

// finalize sorts items deterministically (map order is random) and marks duplicates:
// for every (type, name, unit) group the item with the median price is canonical.
func (s *PriceDBService) finalize() {
	sort.SliceStable(s.items, func(i, j int) bool {
		a, b := s.items[i], s.items[j]
		if a.Type != b.Type {
			return a.Type < b.Type
		}
		if a.Category != b.Category {
			return a.Category < b.Category
		}
		if a.Name != b.Name {
			return a.Name < b.Name
		}
		return a.Code < b.Code
	})
	groups := map[string][]int{}
	for i, it := range s.items {
		key := it.Type + "|" + strings.ToLower(strings.Join(strings.Fields(it.Name), " ")) + "|" + it.Unit
		groups[key] = append(groups[key], i)
	}
	for _, idx := range groups {
		if len(idx) < 2 {
			continue
		}
		cand := make([]int, 0, len(idx))
		for _, i := range idx {
			if s.items[i].QA != "suspect" {
				cand = append(cand, i)
			}
		}
		if len(cand) == 0 {
			cand = idx
		}
		sort.SliceStable(cand, func(a, b int) bool { return s.items[cand[a]].Price < s.items[cand[b]].Price })
		keep := cand[len(cand)/2]
		for _, i := range idx {
			if i != keep {
				s.items[i].dup = true
			}
		}
	}
}

func (s *PriceDBService) loadFallbackData() {
	fallbackWorks := []PriceItem{
		{Code: "QG-W-01-01-001", Name: "Разработка грунта механизированным способом в траншеях", Unit: "м³", Price: 3500, Category: "Земляные работы", Type: "work"},
		{Code: "QG-W-06-01-003", Name: "Устройство песчано-гравийного основания под фундамент", Unit: "м³", Price: 8500, Category: "Фундаменты", Type: "work"},
		{Code: "QG-W-06-01-001", Name: "Устройство ленточного монолитного ж/б фундамента В25", Unit: "м³", Price: 42000, Category: "Фундаменты", Type: "work"},
		{Code: "QG-W-08-02-001", Name: "Кладка стен из кирпича керамического М150", Unit: "м³", Price: 38000, Category: "Стены и перегородки", Type: "work"},
		{Code: "QG-W-12-01-001", Name: "Устройство плоской кровли из рулонных материалов", Unit: "м²", Price: 6500, Category: "Кровля", Type: "work"},
		{Code: "QG-W-15-01-001", Name: "Штукатурка стен цементно-песчаным раствором", Unit: "м²", Price: 2800, Category: "Отделка", Type: "work"},
		{Code: "QG-M-01-01-001", Name: "Кирпич керамический одинарный полнотелый М150", Unit: "шт", Price: 120, Category: "Материалы", Type: "material"},
		{Code: "QG-M-04-01-001", Name: "Бетон тяжелый класса В25 (М350)", Unit: "м³", Price: 26000, Category: "Материалы", Type: "material"},
		{Code: "QG-E-01-01-001", Name: "Экскаватор гусеничный 1.0 м³ (аренда)", Unit: "маш-час", Price: 18000, Category: "Спецтехника", Type: "equipment"},
		{Code: "QG-E-01-02-001", Name: "Автобетононасос 36м", Unit: "маш-час", Price: 25000, Category: "Спецтехника", Type: "equipment"},
	}

	for _, item := range fallbackWorks {
		s.items = append(s.items, item)
		s.itemByCode[item.Code] = item
		s.categories[item.Category]++
	}
	// Same base as price_db.json / README: Алматы = 1.00
	s.coefficients = map[string]float64{"Астана": 1.15, "Алматы": 1.00, "Шымкент": 0.95}
	s.finalize()
	s.totalCount = len(s.items)
}

// SearchParams contains filtering options for PriceDB
type SearchParams struct {
	Query    string
	Category string
	Type     string // "work", "material", "equipment", or empty for all
	Region   string
	Limit    int
	Offset   int
	// Sort: "" (catalogue order), "price_asc", "price_desc", "name"
	Sort     string
	MinPrice float64 // after the regional coefficient; 0 = no limit
	MaxPrice float64
	// IncludeSuspect returns items whose price failed the sanity check (hidden by default)
	IncludeSuspect bool
	// Unique hides duplicates (same type+name+unit) — one row per material
	Unique bool
}

// SearchResult holds search query response
type SearchResult struct {
	Total       int         `json:"total"`
	Filtered    int         `json:"filtered"`
	Limit       int         `json:"limit"`
	Offset      int         `json:"offset"`
	Region      string      `json:"region"`
	Coefficient float64     `json:"coefficient"`
	Items       []PriceItem `json:"items"`
}

// Search performs sub-millisecond in-memory search across all items
func (s *PriceDBService) Search(params SearchParams) SearchResult {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if params.Limit <= 0 {
		params.Limit = 50
	}
	if params.Limit > 500 {
		params.Limit = 500
	}
	if params.Offset < 0 {
		params.Offset = 0
	}

	q := strings.ToLower(strings.TrimSpace(params.Query))
	cat := strings.ToLower(strings.TrimSpace(params.Category))
	itemType := strings.ToLower(strings.TrimSpace(params.Type))

	regionCoef := 1.0
	if params.Region != "" {
		if coef, exists := s.coefficients[params.Region]; exists {
			regionCoef = coef
		}
	}

	terms := strings.Fields(q)
	var matched []PriceItem
	for _, item := range s.items {
		if item.QA == "suspect" && !params.IncludeSuspect {
			continue
		}
		if item.dup && params.Unique {
			continue
		}
		// Type filter
		if itemType != "" && item.Type != itemType {
			continue
		}
		// Category filter
		if cat != "" && !strings.Contains(strings.ToLower(item.Category), cat) {
			continue
		}
		// Text Query filter
		// every word of the query must occur in name, code or category ("кирпич м150" finds "Кирпич керамич. одинарный М150")
		if len(terms) > 0 {
			hay := strings.ToLower(item.Name + " " + item.Code + " " + item.Category)
			hay = strings.ReplaceAll(hay, "ё", "е")
			ok := true
			for _, t := range terms {
				if !strings.Contains(hay, strings.ReplaceAll(t, "ё", "е")) {
					ok = false
					break
				}
			}
			if !ok {
				continue
			}
		}

		adjustedItem := item
		if regionCoef != 1.0 {
			adjustedItem.Price = math.Round(item.Price * regionCoef)
		}
		if params.MinPrice > 0 && adjustedItem.Price < params.MinPrice {
			continue
		}
		if params.MaxPrice > 0 && adjustedItem.Price > params.MaxPrice {
			continue
		}
		matched = append(matched, adjustedItem)
	}

	switch params.Sort {
	case "price_asc":
		sort.SliceStable(matched, func(i, j int) bool { return matched[i].Price < matched[j].Price })
	case "price_desc":
		sort.SliceStable(matched, func(i, j int) bool { return matched[i].Price > matched[j].Price })
	case "name":
		sort.SliceStable(matched, func(i, j int) bool { return matched[i].Name < matched[j].Name })
	}

	filteredTotal := len(matched)
	start := params.Offset
	if start > filteredTotal {
		start = filteredTotal
	}
	end := start + params.Limit
	if end > filteredTotal {
		end = filteredTotal
	}

	pagedItems := matched[start:end]

	return SearchResult{
		Total:       s.totalCount,
		Filtered:    filteredTotal,
		Limit:       params.Limit,
		Offset:      params.Offset,
		Region:      params.Region,
		Coefficient: regionCoef,
		Items:       pagedItems,
	}
}

// GetByCode retrieves a specific item by code with optional regional adjustment
func (s *PriceDBService) GetByCode(code string, region string) (PriceItem, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	item, exists := s.itemByCode[code]
	if !exists {
		return PriceItem{}, false
	}

	if region != "" {
		if coef, hasCoef := s.coefficients[region]; hasCoef {
			item.Price = math.Round(item.Price * coef)
		}
	}
	return item, true
}

// GetStats returns summary statistics of PriceDB
func (s *PriceDBService) GetStats() map[string]interface{} {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return map[string]interface{}{
		"totalItems":   s.totalCount,
		"version":      s.version,
		"categories":   s.categories,
		"regionsCount": len(s.coefficients),
		// Ориентировочные рыночные цены; методика сметы — НДЦС РК 8.01-08-2022, нормы расхода — ЭСН РК 8.04-01-2022
		"normative": "Рыночные цены РК 2026 (ориентир); методика НДЦС РК 8.01-08-2022",
		"audit":     s.audit,
	}
}

// GetRegions returns all supported regions and their coefficients
func (s *PriceDBService) GetRegions() map[string]float64 {
	s.mu.RLock()
	defer s.mu.RUnlock()

	copyMap := make(map[string]float64, len(s.coefficients))
	for k, v := range s.coefficients {
		copyMap[k] = v
	}
	return copyMap
}
