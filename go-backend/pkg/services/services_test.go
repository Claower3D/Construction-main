package services

import (
	"testing"
)

func TestPriceDBService(t *testing.T) {
	pdb := GetPriceDBService()
	if pdb.totalCount == 0 {
		t.Fatalf("Expected PriceDB items > 0, got %d", pdb.totalCount)
	}

	// Test Search
	res := pdb.Search(SearchParams{
		Query:  "бетон",
		Region: "Астана",
		Limit:  10,
	})

	if res.Filtered == 0 {
		t.Errorf("Expected filtered items for 'бетон', got 0")
	}

	if res.Coefficient <= 0 {
		t.Errorf("Expected positive regional coefficient, got %.2f", res.Coefficient)
	}

	// Test Stats
	stats := pdb.GetStats()
	if stats["totalItems"].(int) == 0 {
		t.Errorf("Expected totalItems in stats > 0")
	}
}

func TestEstimatorService(t *testing.T) {
	pdb := GetPriceDBService()
	estimator := NewEstimatorService(pdb)

	// Test Foundation QTO calculation
	req := QTOFormulaRequest{
		Category: "foundation",
		Subtype:  "strip",
		Dimensions: map[string]float64{
			"length": 50.0,
			"width":  0.4,
			"depth":  1.2,
		},
		City: "Алматы",
	}

	res := estimator.CalculateEstimate(req)
	if res.CalculatedVol <= 0 {
		t.Errorf("Expected calculated volume > 0, got %.2f", res.CalculatedVol)
	}

	if len(res.Scenarios) != 3 {
		t.Errorf("Expected 3 scenarios (Economy, Standard, Premium), got %d", len(res.Scenarios))
	}

	if res.Recommended.TotalCost <= 0 {
		t.Errorf("Expected recommended total cost > 0, got %.2f", res.Recommended.TotalCost)
	}

	// Test Wall QTO calculation
	wallReq := QTOFormulaRequest{
		Category: "walls",
		Subtype:  "brick",
		Dimensions: map[string]float64{
			"length": 40.0,
			"height": 3.0,
		},
		City: "Шымкент",
	}

	wallRes := estimator.CalculateEstimate(wallReq)
	if wallRes.CalculatedArea <= 0 {
		t.Errorf("Expected wall area > 0, got %.2f", wallRes.CalculatedArea)
	}
}

func findItem(items []EstimateLineItem, code string) *EstimateLineItem {
	for i := range items {
		if items[i].Code == code {
			return &items[i]
		}
	}
	return nil
}

func TestEstimatorRoutingAndNorms(t *testing.T) {
	est := NewEstimatorService(NewPriceDBService())

	// «покраска стен» must not be priced as brick masonry
	r := est.CalculateEstimate(QTOFormulaRequest{Category: "Покраска стен", Dimensions: map[string]float64{"area": 100}})
	if findItem(r.Recommended.Items, "QG-W-15-003") == nil {
		t.Fatalf("painting routed to the wrong calculator: %+v", r.Recommended.Items)
	}
	// «наружные сети из полиэтилена» contains «пол» but is not a floor screed
	r = est.CalculateEstimate(QTOFormulaRequest{Category: "Наружные сети водопровода из полиэтилена"})
	if findItem(r.Recommended.Items, "QG-W-23-01-002") == nil {
		t.Fatalf("external networks routed to the wrong calculator")
	}

	// brick wall 250 mm: 394 pcs/m³ + 3% and mortar 0.23 m³/m³
	r = est.CalculateEstimate(QTOFormulaRequest{Category: "Кладка стен", Dimensions: map[string]float64{"length": 10, "height": 3, "thickness": 0.25, "openings": 0}})
	vol := 10 * 3 * 0.25
	brick := findItem(r.Recommended.Items, "QG-M-01-001")
	if brick == nil || brick.Quantity < vol*394 || brick.Quantity > vol*394*1.05 {
		t.Fatalf("brick count off: %+v (volume %.2f)", brick, vol)
	}

	// foundation: rebar material = work quantity + 2%
	r = est.CalculateEstimate(QTOFormulaRequest{Category: "Фундамент", Dimensions: map[string]float64{"length": 40, "width": 0.4, "depth": 1.2}})
	work, mat := findItem(r.Recommended.Items, "QG-W-06-005"), findItem(r.Recommended.Items, "QG-M-08-001")
	if work == nil || mat == nil || mat.Quantity < work.Quantity || mat.Quantity > work.Quantity*1.03 {
		t.Fatalf("rebar work/material mismatch: %+v %+v", work, mat)
	}

	// earthwork: no separate excavator rental on top of the «with excavator» rate
	r = est.CalculateEstimate(QTOFormulaRequest{Category: "Земляные работы", Dimensions: map[string]float64{"volume": 300}})
	for _, it := range r.Recommended.Items {
		if it.Type == "equipment" && it.Unit != "рейс" {
			t.Fatalf("double-counted machinery: %+v", it)
		}
	}

	// soil type changes excavation cost
	sand := est.CalculateEstimate(QTOFormulaRequest{Category: "Земляные работы", SoilType: "sand", Dimensions: map[string]float64{"volume": 300}})
	rock := est.CalculateEstimate(QTOFormulaRequest{Category: "Земляные работы", SoilType: "rock", Dimensions: map[string]float64{"volume": 300}})
	if !(sand.Recommended.TotalCost < r.Recommended.TotalCost && r.Recommended.TotalCost < rock.Recommended.TotalCost) {
		t.Fatalf("soil factor not applied: sand %.0f, loam %.0f, rock %.0f", sand.Recommended.TotalCost, r.Recommended.TotalCost, rock.Recommended.TotalCost)
	}

	// VAT 16% on top of the total
	rec := r.Recommended
	if rec.VATRate != 0.16 || rec.TotalWithVAT != rec.TotalCost+rec.VAT || rec.VAT < rec.TotalCost*0.159 {
		t.Fatalf("VAT wrong: %+v", rec)
	}
}

func TestPriceDBSearchHidesSuspectAndDuplicates(t *testing.T) {
	s := NewPriceDBService()
	s.items = []PriceItem{
		{Code: "a", Name: "Кирпич М150", Unit: "шт", Price: 80, Type: "material"},
		{Code: "b", Name: "Кирпич  М150", Unit: "шт", Price: 90, Type: "material"},
		{Code: "c", Name: "Кирпич М150", Unit: "шт", Price: 100, Type: "material"},
		{Code: "d", Name: "Кирпич облицовочный", Unit: "шт", Price: 7, Type: "material", QA: "suspect"},
	}
	s.totalCount = len(s.items)
	s.finalize()
	res := s.Search(SearchParams{Query: "кирпич м150", Type: "material", Unique: true})
	if res.Filtered != 1 || res.Items[0].Code != "b" {
		t.Fatalf("expected one canonical (median) item, got %+v", res.Items)
	}
	res = s.Search(SearchParams{Query: "облицовочный"})
	if res.Filtered != 0 {
		t.Fatalf("suspect items must be hidden by default")
	}
	res = s.Search(SearchParams{Query: "кирпич", Sort: "price_desc", MaxPrice: 95})
	if res.Filtered != 2 || res.Items[0].Price != 90 {
		t.Fatalf("sort/maxPrice wrong: %+v", res.Items)
	}
}

func TestPriceDBLoadFinalizes(t *testing.T) {
	s := NewPriceDBService()
	s.LoadDatabase()
	if s.version == "" {
		t.Skip("price_db.json not found")
	}
	all := s.Search(SearchParams{Type: "material", Limit: 1})
	uniq := s.Search(SearchParams{Type: "material", Limit: 1, Unique: true})
	if uniq.Filtered >= all.Filtered {
		t.Fatalf("unique must hide duplicates: %d vs %d", uniq.Filtered, all.Filtered)
	}
	if s.GetStats()["audit"] == nil {
		t.Fatal("audit summary from price_db.json must be exposed in stats")
	}
	first := s.Search(SearchParams{Limit: 3}).Items
	s2 := NewPriceDBService()
	s2.LoadDatabase()
	again := s2.Search(SearchParams{Limit: 3}).Items
	for i := range first {
		if first[i].Code != again[i].Code {
			t.Fatal("catalogue order must be deterministic between restarts")
		}
	}
}
