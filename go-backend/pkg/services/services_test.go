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
