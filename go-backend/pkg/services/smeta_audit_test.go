package services

import (
	"math"
	"testing"
)

func TestQuantile(t *testing.T) {
	xs := []float64{1, 2, 3, 4, 5}
	for _, c := range []struct{ q, want float64 }{{0, 1}, {0.25, 2}, {0.5, 3}, {0.75, 4}, {1, 5}} {
		if got := quantile(xs, c.q); math.Abs(got-c.want) > 1e-9 {
			t.Errorf("quantile(%v) = %v, want %v", c.q, got, c.want)
		}
	}
	if got := quantile([]float64{10, 20}, 0.5); got != 15 {
		t.Errorf("median of two = %v, want 15", got)
	}
}

func TestRobustPricesDropsScaleOutliers(t *testing.T) {
	// реальная выборка из базы: «штробление» с позициями по 10–40 ₸ рядом с 450–1 600 ₸
	in := []float64{10, 15, 450, 480, 500, 600, 625, 700, 800, 900, 1200, 1600}
	out := robustPrices(in)
	for _, p := range out {
		if p < 100 {
			t.Fatalf("выброс %v не отброшен: %v", p, out)
		}
	}
	if len(out) != len(in)-2 {
		t.Fatalf("отброшено %d, ожидалось 2: %v", len(in)-len(out), out)
	}
	// короткая выборка не трогается: по трём точкам выброс не определить
	short := []float64{25, 1600, 1700}
	if got := robustPrices(short); len(got) != 3 {
		t.Fatalf("короткая выборка изменена: %v", got)
	}
	// однородная выборка остаётся целиком
	flat := []float64{2200, 2800, 2800, 3360, 3600, 4000, 4240}
	if got := robustPrices(flat); len(got) != len(flat) {
		t.Fatalf("однородная выборка урезана: %v", got)
	}
}

func TestPackOf(t *testing.T) {
	cases := []struct {
		name string
		size float64
		meas string
		ok   bool
	}{
		{"Цемент М500, 50 кг", 50, "кг", true},
		{"Цемент М400 (25кг)", 25, "кг", true},
		{"Краска акриловая белая (10л)", 10, "л", true},
		{"Пена монтажная Makroflex Standard, 750 мл", 0, "", false},
		{"Гарантия 10 лет", 0, "", false},
		{"Затирка Ceresit CE 33, 5 кг", 5, "кг", true},
	}
	for _, c := range cases {
		size, meas, ok := packOf(c.name)
		if ok != c.ok || size != c.size || meas != c.meas {
			t.Errorf("packOf(%q) = %v %q %v, want %v %q %v", c.name, size, meas, ok, c.size, c.meas, c.ok)
		}
	}
}

func TestDBAnalogsComparePerPack(t *testing.T) {
	db := &PriceDBService{coefficients: map[string]float64{}, items: []PriceItem{
		{Code: "c1", Name: "Цемент М500 (25кг)", Unit: "мешок", Price: 1200, Type: "material"},
		{Code: "c2", Name: "Цемент М500 (50кг)", Unit: "мешок", Price: 2300, Type: "material"},
		{Code: "c3", Name: "Цемент ПЦ-500 (50кг)", Unit: "шт", Price: 2500, Type: "material"},
		{Code: "c4", Name: "Цемент М500 навалом", Unit: "т", Price: 45000, Type: "material"},
		{Code: "c5", Name: "Цемент белый (1л)", Unit: "банка", Price: 900, Type: "material"},
	}}
	hit := dbAnalogLookup(db, "m.cement", "ТестПакет")
	want := []float64{2300, 2400, 2500} // 25 кг × 2; тонна и литры не сравниваются
	if len(hit.prices) != len(want) {
		t.Fatalf("prices = %v, want %v", hit.prices, want)
	}
	for i := range want {
		if hit.prices[i] != want[i] {
			t.Fatalf("prices = %v, want %v", hit.prices, want)
		}
	}
	m, _ := dbAnalogs(db, SmetaItem{Key: "m.cement", Name: "Цемент", Unit: "мешок", Price: 2300}, "ТестПакет")
	if m.Status != "ok" || m.DBCount != 3 {
		t.Fatalf("status %q count %d, want ok/3", m.Status, m.DBCount)
	}
	m2, _ := dbAnalogs(db, SmetaItem{Key: "m.cement", Name: "Цемент", Unit: "мешок", Price: 9000}, "ТестПакет")
	if m2.Status != "high" {
		t.Fatalf("цена 9 000 за мешок должна быть выше коридора базы, got %q", m2.Status)
	}
}
