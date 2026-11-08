package services

import (
	"math"
	"os"
	"testing"
)

// Комната 5×4 м, высота 2,7 м, одна дверь и одно окно.
var room = SmetaGeo{Area: 20, Perimeter: 18, Height: 2.7, Doors: 1, Windows: 1}

func calc(t *testing.T, req SmetaRequest) SmetaResult {
	t.Helper()
	res, err := CalcSmeta(req, nil)
	if err != nil {
		t.Fatalf("CalcSmeta(%s%s): %v", req.Category, req.Complex, err)
	}
	return res
}

func smetaItem(sc SmetaScenario, key string) *SmetaItem {
	for i := range sc.Items {
		if sc.Items[i].Key == key {
			return &sc.Items[i]
		}
	}
	return nil
}

func TestSmetaWallArea(t *testing.T) {
	if got := room.WallArea(); math.Abs(got-44.46) > 1e-9 {
		t.Fatalf("wall area = %v, want 44.46 (18×2,7 − 1,89 − 2,25)", got)
	}
	if got := room.SkirtingLength(); math.Abs(got-17.1) > 1e-9 {
		t.Fatalf("skirting = %v, want 17.1", got)
	}
}

func TestSmetaRatesAreSourced(t *testing.T) {
	for _, r := range smetaRateList {
		if r.Price <= 0 || r.Name == "" || r.Unit == "" || r.Source == "" {
			t.Errorf("%s: неполная расценка %+v", r.Key, r)
		}
		if r.Verified && r.Source == srcEstimate {
			t.Errorf("%s: помечена проверенной, но источник — оценка", r.Key)
		}
		if !r.Verified && r.Note == "" {
			t.Errorf("%s: оценка без методики", r.Key)
		}
		if r.Kind != "work" && r.Kind != "material" && r.Kind != "equipment" {
			t.Errorf("%s: неизвестный вид %q", r.Key, r.Kind)
		}
	}
	for tier, keys := range smetaTiers {
		for _, k := range keys {
			if _, ok := smetaRates[k]; !ok {
				t.Errorf("уровень %s ссылается на несуществующую расценку %s", tier, k)
			}
		}
	}
}

// Каждая техкарта и каждый комплекс считаются без ошибок, во всех сценариях есть строки,
// суммы сходятся до тенге.
func TestSmetaAllCategoriesAndComplexes(t *testing.T) {
	check := func(name string, res SmetaResult) {
		if len(res.Scenarios) != 3 {
			t.Fatalf("%s: сценариев %d", name, len(res.Scenarios))
		}
		for _, sc := range res.Scenarios {
			if len(sc.Items) == 0 {
				t.Errorf("%s/%s: пустая смета", name, sc.ID)
			}
			var sum, w, m, e float64
			for _, it := range sc.Items {
				if it.Qty <= 0 || it.Price <= 0 {
					t.Errorf("%s/%s: строка %s с нулём: qty=%v price=%v", name, sc.ID, it.Key, it.Qty, it.Price)
				}
				if it.Total != math.Round(it.Qty*it.Price) {
					t.Errorf("%s/%s: %s total %v ≠ %v×%v", name, sc.ID, it.Key, it.Total, it.Qty, it.Price)
				}
				if it.Why == "" {
					t.Errorf("%s/%s: %s без обоснования объёма", name, sc.ID, it.Key)
				}
				sum += it.Total
				switch it.Kind {
				case "work":
					w += it.Total
				case "material":
					m += it.Total
				case "equipment":
					e += it.Total
				}
			}
			if sum != sc.Subtotal || w != sc.Works || m != sc.Materials || e != sc.Equipment {
				t.Errorf("%s/%s: суммы не сходятся: строки %v, итог %v (работы %v/%v, материалы %v/%v)", name, sc.ID, sum, sc.Subtotal, w, sc.Works, m, sc.Materials)
			}
			if sc.Reserve != math.Round(sc.Subtotal*0.1) || sc.Total != sc.Subtotal+sc.Reserve {
				t.Errorf("%s/%s: резерв %v, итого %v при подытоге %v", name, sc.ID, sc.Reserve, sc.Total, sc.Subtotal)
			}
		}
	}
	for _, id := range smetaOrder {
		if smetaTechMaps[id] == nil {
			t.Fatalf("нет техкарты %s", id)
		}
		check(id, calc(t, SmetaRequest{Category: id, Geometry: room, Mode: "full"}))
	}
	for _, id := range smetaComplexOrder {
		check(id, calc(t, SmetaRequest{Complex: id, Geometry: room, Mode: "full"}))
	}
	if len(smetaOrder) != 29 {
		t.Fatalf("категорий %d, ожидалось 29", len(smetaOrder))
	}
}

func TestSmetaWallFinishQuantities(t *testing.T) {
	res := calc(t, SmetaRequest{Category: "wall_finish", Geometry: room})
	eco, std, prem := res.Scenarios[0], res.Scenarios[1], res.Scenarios[2]

	// Стандарт: грунт перед штукатуркой, шпаклёвкой и краской = 3 прохода
	if it := smetaItem(std, "w.wall.primer"); it == nil || it.Qty != 133.38 {
		t.Fatalf("грунтовка std: %+v, ждём 133,38 м²", it)
	}
	// Ротбанд: 44,46 м² × 15 мм × 0,85 кг = 566,9 кг → 19 мешков по 30 кг
	if it := smetaItem(std, "m.rotband"); it == nil || it.Qty != 19 {
		t.Fatalf("Ротбанд std: %+v, ждём 19 мешков", it)
	}
	// Шпаклёвка 2 слоя по 1 кг/м² = 88,9 кг → 4 мешка Фугена
	if it := smetaItem(std, "m.putty"); it == nil || it.Qty != 4 {
		t.Fatalf("Фуген std: %+v, ждём 4 мешка", it)
	}
	// Краска 0,3 кг/м² × 44,46 = 13,3 кг → 2 ведра по 10 кг
	if it := smetaItem(std, "m.paint_std"); it == nil || it.Qty != 2 {
		t.Fatalf("краска std: %+v, ждём 2 ведра", it)
	}
	// Эконом без штукатурки по маякам
	if smetaItem(eco, "w.wall.plaster") != nil || smetaItem(eco, "m.rotband") != nil {
		t.Fatal("в «Эконом» не должно быть штукатурки по маякам")
	}
	if smetaItem(prem, "m.putty_prem") == nil || smetaItem(prem, "m.paint_prem") == nil {
		t.Fatal("в «Премиум» должны быть Glatt Plus и Remalux")
	}
	if !(eco.Subtotal < std.Subtotal && std.Subtotal < prem.Subtotal) {
		t.Fatalf("сценарии не по возрастанию: %v / %v / %v", eco.Subtotal, std.Subtotal, prem.Subtotal)
	}
}

func TestSmetaWallpaperRolls(t *testing.T) {
	res := calc(t, SmetaRequest{Category: "wall_finish", Geometry: room, Params: map[string]float64{"finish": 1}})
	// ширина 18 − 0,9 = 17,1 м → 17 полос; высота полосы 2,8 → 3 полосы в рулоне → 6 рулонов
	if it := smetaItem(res.Scenarios[1], "m.wallpaper"); it == nil || it.Qty != 6 {
		t.Fatalf("обои: %+v, ждём 6 рулонов", it)
	}
	if smetaItem(res.Scenarios[1], "w.wall.paint") != nil {
		t.Fatal("при обоях не должно быть покраски")
	}
}

func TestSmetaFloors(t *testing.T) {
	res := calc(t, SmetaRequest{Category: "floors", Geometry: room})
	if smetaItem(res.Scenarios[0], "w.floor.screed") != nil {
		t.Fatal("эконом: стяжки быть не должно")
	}
	std := res.Scenarios[1]
	// стяжка 20 м² × 50 мм = 1 м³ раствора → 400 кг цемента = 8 мешков, песка 1,1 м³
	if it := smetaItem(std, "m.cement"); it == nil || it.Qty != 8 {
		t.Fatalf("цемент: %+v, ждём 8 мешков", it)
	}
	if it := smetaItem(std, "m.sand"); it == nil || it.Qty != 1.1 {
		t.Fatalf("песок: %+v, ждём 1,1 м³", it)
	}
	if it := smetaItem(std, "m.laminate_std"); it == nil || it.Qty != 21.4 {
		t.Fatalf("ламинат: %+v, ждём 21,4 м²", it)
	}
	if it := smetaItem(res.Scenarios[2], "w.floor.laminate_herring"); it == nil {
		t.Fatal("премиум: укладка ёлочкой")
	}
}

func TestSmetaRegionCoefficient(t *testing.T) {
	alm := calc(t, SmetaRequest{Category: "wall_finish", Geometry: room, City: "Алматы"})
	ast := calc(t, SmetaRequest{Category: "wall_finish", Geometry: room, City: "Актау"})
	a, b := smetaItem(alm.Scenarios[1], "w.wall.plaster"), smetaItem(ast.Scenarios[1], "w.wall.plaster")
	if a.Price != 2050 || b.Price != math.Round(2050*1.25) {
		t.Fatalf("цены: Алматы %v, Актау %v", a.Price, b.Price)
	}
	if ast.RegionCoef != 1.25 {
		t.Fatalf("коэффициент Актау %v", ast.RegionCoef)
	}
}

func TestSmetaValidation(t *testing.T) {
	if _, err := CalcSmeta(SmetaRequest{Category: "floors"}, nil); err == nil {
		t.Fatal("без геометрии должна быть ошибка")
	}
	if _, err := CalcSmeta(SmetaRequest{Category: "nope", Geometry: room}, nil); err == nil {
		t.Fatal("неизвестная категория должна давать ошибку")
	}
	if _, err := CalcSmeta(SmetaRequest{Complex: "nope", Geometry: room}, nil); err == nil {
		t.Fatal("неизвестный комплекс должен давать ошибку")
	}
}

func TestSmetaModes(t *testing.T) {
	fast := calc(t, SmetaRequest{Complex: "apartment_renovation", Geometry: room, Mode: "fast"})
	if fast.Audit != nil || fast.Schedule != nil || fast.Purchases != nil {
		t.Fatal("быстрый режим: только смета")
	}
	det := calc(t, SmetaRequest{Complex: "apartment_renovation", Geometry: room, Mode: "detailed"})
	if det.Audit == nil || len(det.Audit.Checks) == 0 || det.Schedule != nil {
		t.Fatal("детальный режим: проверка без графика")
	}
	full := calc(t, SmetaRequest{Complex: "apartment_renovation", Geometry: room, Mode: "full"})
	sch := full.Schedule["std"]
	if sch == nil || sch.Days <= 0 || len(sch.Stages) < 5 {
		t.Fatalf("полный режим: график %+v", sch)
	}
	var buy float64
	for _, p := range full.Purchases["std"] {
		buy += p.Total
	}
	if buy != full.Scenarios[1].Materials {
		t.Fatalf("закупка %v ≠ материалы %v", buy, full.Scenarios[1].Materials)
	}
	// этапы идут последовательно, без наложений
	prevEnd := 0.0
	for _, st := range sch.Stages {
		if st.Start < prevEnd-1e-9 {
			t.Fatalf("этап %s начинается раньше конца предыдущего", st.Stage)
		}
		prevEnd = st.Start + st.Days + st.Wait
	}
}

func TestSmetaComplexParamsPrefixed(t *testing.T) {
	res := calc(t, SmetaRequest{Complex: "bathroom", Geometry: SmetaGeo{Area: 4, Perimeter: 8, Height: 2.5, Doors: 1}})
	std := res.Scenarios[1]
	if smetaItem(std, "w.wall.tile") == nil || smetaItem(std, "w.floor.waterproof") == nil {
		t.Fatal("санузел: плитка на стенах и гидроизоляция пола")
	}
	if smetaItem(std, "w.wall.paint") != nil {
		t.Fatal("санузел: покраски стен быть не должно")
	}
	// пользователь меняет параметр конкретной части комплекса
	res2 := calc(t, SmetaRequest{Complex: "bathroom", Geometry: SmetaGeo{Area: 4, Perimeter: 8, Height: 2.5, Doors: 1},
		Params: map[string]float64{"plumbing.bath": 0, "plumbing.shower": 1}})
	if smetaItem(res2.Scenarios[1], "w.pl.bath") != nil || smetaItem(res2.Scenarios[1], "w.pl.shower") == nil {
		t.Fatal("параметры части комплекса не применились")
	}
}

func TestSmetaAuditWithPriceDB(t *testing.T) {
	path := os.Getenv("PRICE_DB_PATH")
	if path == "" {
		t.Skip("PRICE_DB_PATH не задан")
	}
	db := NewPriceDBService()
	db.LoadDatabase()
	res, err := CalcSmeta(SmetaRequest{Complex: "apartment_renovation", Geometry: room, Mode: "detailed", City: "Астана"}, db)
	if err != nil {
		t.Fatal(err)
	}
	if res.RegionCoef != 1.15 {
		t.Fatalf("Астана: коэффициент %v", res.RegionCoef)
	}
	matched := 0
	for _, m := range res.Audit.DB {
		if m.Status != "none" {
			matched++
		}
	}
	if matched == 0 {
		t.Fatal("сверка с базой не нашла ни одной позиции")
	}
}
