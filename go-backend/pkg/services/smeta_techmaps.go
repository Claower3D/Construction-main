package services

import (
	"fmt"
	"math"
)

// Технологические карты: какие работы и материалы нужны, в каком объёме и почему.
// Объёмы считаются от геометрии контура (площадь, периметр, высота, проёмы)
// и норм расхода производителей. Строка с нулевым объёмом в смету не попадает.

type qtyFn = func(c *smetaCtx) (float64, string)

var yesNo = []SmetaOption{{0, "Нет"}, {1, "Да"}}

func (c *smetaCtx) pack(key string) float64 {
	if r, ok := resolveRate(key, c.Tier); ok && r.Pack > 0 {
		return r.Pack
	}
	return 1
}

func (c *smetaCtx) wallWhy() string {
	g := c.G
	return fmt.Sprintf("стены %s м × %s м − проёмы %s м² = %s м²", f(r2(g.Perimeter)), f(g.Height), f(r2(g.OpeningsArea())), f(r2(g.WallArea())))
}

func areaQ(c *smetaCtx) (float64, string) {
	return c.G.Area, fmt.Sprintf("площадь по контуру %s м²", f(r2(c.G.Area)))
}

func wallQ(c *smetaCtx) (float64, string) { return c.G.WallArea(), c.wallWhy() }

func when(cond func(c *smetaCtx) bool, q qtyFn) qtyFn {
	return func(c *smetaCtx) (float64, string) {
		if !cond(c) {
			return 0, ""
		}
		return q(c)
	}
}

func pEq(key string, v float64) func(c *smetaCtx) bool {
	return func(c *smetaCtx) bool { return c.p(key) == v }
}

func pOn(key string) func(c *smetaCtx) bool {
	return func(c *smetaCtx) bool { return c.p(key) > 0 }
}

func fixed(n float64, why string) qtyFn {
	return func(c *smetaCtx) (float64, string) { return n, why }
}

func byParam(key, why string) qtyFn {
	return func(c *smetaCtx) (float64, string) { return c.p(key), why }
}

// packsOf — расход материала в упаковках с пояснением.
func packsOf(rateKey string, amount func(c *smetaCtx) (float64, string)) qtyFn {
	return func(c *smetaCtx) (float64, string) {
		a, why := amount(c)
		if a <= 0 {
			return 0, ""
		}
		pk := c.pack(rateKey)
		return packs(a, pk), fmt.Sprintf("%s → %s кг(л) / %s в упаковке", why, f(r1(a)), f(pk))
	}
}

// ── Отделка стен ──

func wallPutty(c *smetaCtx) float64 {
	if c.p("finish") == 2 {
		return 0
	}
	if c.Tier == 0 {
		return 1
	}
	return 2
}

func wallPrimerPasses(c *smetaCtx) float64 {
	n := 1.0
	if c.Tier >= 1 {
		n++ // под штукатурку
	}
	if wallPutty(c) > 0 {
		n++ // под шпаклёвку
	}
	return n
}

var tmWallFinish = &TechMap{
	ID: "wall_finish", Title: "Отделка стен", Group: "Отделка", BaseLabel: "Контур помещения (пол)", UseHeight: true, UseOpen: true,
	Params: []SmetaParam{
		{Key: "finish", Label: "Чистовая отделка", Default: 0, Min: 0, Max: 2, Options: []SmetaOption{{0, "Покраска"}, {1, "Обои"}, {2, "Плитка"}}},
		{Key: "plaster_mm", Label: "Слой штукатурки", Unit: "мм", Default: 15, Min: 5, Max: 50, Step: 5, Hint: "Средняя толщина по маякам; зависит от кривизны стен"},
	},
	Stages: []tmStage{{"Грунтовка", 0, ""}, {"Выравнивание", 7, "высыхание гипсовой штукатурки"}, {"Шпаклёвка", 1, "высыхание шпаклёвки"}, {"Чистовая отделка", 0, ""}},
	Scenario: [3]string{
		"без маяков: шпаклёвка в 1 слой по существующей поверхности, краска Gaudi «Белоснежка»",
		"штукатурка по маякам, шпаклёвка Фуген в 2 слоя, краска Gaudi Standart",
		"штукатурка по маякам, финиш AlinEX Glatt Plus в 2 слоя, краска Remalux",
	},
	ScenarioFn: func(c *smetaCtx) [3]string {
		switch c.pi("finish") {
		case 1:
			return [3]string{
				"без маяков: шпаклёвка в 1 слой, флизелиновые обои",
				"штукатурка по маякам, шпаклёвка в 2 слоя, флизелиновые обои",
				"штукатурка по маякам, финиш Glatt Plus, виниловые обои на флизелине",
			}
		case 2:
			return [3]string{
				"без маяков: керамогранит 60×60 по существующей поверхности",
				"штукатурка по маякам, керамогранит 60×60",
				"штукатурка по маякам, керамогранит 60×60 под травертин",
			}
		}
		return [3]string{
			"без маяков: шпаклёвка в 1 слой по существующей поверхности, краска Gaudi «Белоснежка»",
			"штукатурка по маякам, шпаклёвка Фуген в 2 слоя, краска Gaudi Standart",
			"штукатурка по маякам, финиш AlinEX Glatt Plus в 2 слоя, краска Remalux",
		}
	},
	Lines: []tmLine{
		{Stage: "Грунтовка", Rate: "w.wall.primer", PerDay: 150, Qty: func(c *smetaCtx) (float64, string) {
			n := wallPrimerPasses(c)
			return c.G.WallArea() * n, fmt.Sprintf("%s × %s прохода (перед каждым слоем)", c.wallWhy(), f(n))
		}},
		{Stage: "Грунтовка", Rate: "m.primer", Qty: packsOf("m.primer", func(c *smetaCtx) (float64, string) {
			n := wallPrimerPasses(c)
			return c.G.WallArea() * n * 0.15, fmt.Sprintf("0,15 л/м² × %s м² × %s прохода", f(r1(c.G.WallArea())), f(n))
		})},
		{Stage: "Выравнивание", Rate: "w.wall.plaster", Only: "std+", PerDay: 12, Qty: wallQ},
		{Stage: "Выравнивание", Rate: "m.rotband", Only: "std+", Qty: packsOf("m.rotband", func(c *smetaCtx) (float64, string) {
			mm := c.p("plaster_mm")
			return c.G.WallArea() * mm / 10 * 8.5, fmt.Sprintf("Knauf: 8,5 кг/м² на 10 мм × %s мм × %s м²", f(mm), f(r1(c.G.WallArea())))
		})},
		{Stage: "Шпаклёвка", Rate: "w.wall.putty", PerDay: 20, Qty: func(c *smetaCtx) (float64, string) {
			n := wallPutty(c)
			return c.G.WallArea() * n, fmt.Sprintf("%s × %s слоя", c.wallWhy(), f(n))
		}},
		{Stage: "Шпаклёвка", Rate: "m.putty_fin", Qty: packsOf("m.putty_fin", func(c *smetaCtx) (float64, string) {
			n := wallPutty(c)
			return c.G.WallArea() * n * 1.0, fmt.Sprintf("≈1 кг/м² на слой × %s слоя × %s м²", f(n), f(r1(c.G.WallArea())))
		})},
		{Stage: "Чистовая отделка", Rate: "w.wall.paint", PerDay: 40, Qty: when(pEq("finish", 0), wallQ)},
		{Stage: "Чистовая отделка", Rate: "m.paint", Qty: when(pEq("finish", 0), packsOf("m.paint", func(c *smetaCtx) (float64, string) {
			return c.G.WallArea() * 0.3, fmt.Sprintf("2 слоя × 0,15 кг/м² × %s м²", f(r1(c.G.WallArea())))
		}))},
		{Stage: "Чистовая отделка", Rate: "w.wallpaper", PerDay: 30, Qty: when(pEq("finish", 1), wallQ)},
		{Stage: "Чистовая отделка", Rate: "m.wallpaper", Qty: when(pEq("finish", 1), func(c *smetaCtx) (float64, string) {
			g := c.G
			strip := g.Height + 0.1
			perRoll := math.Floor(10 / strip)
			if perRoll < 1 {
				perRoll = 1
			}
			width := math.Max(0, g.Perimeter-float64(g.Doors)*doorW)
			strips := math.Ceil(width / 1.06)
			return math.Ceil(strips / perRoll), fmt.Sprintf("%s полос по 1,06 м на %s м стен; в рулоне %s полосы высотой %s м", f(strips), f(r1(width)), f(perRoll), f(strip))
		})},
		{Stage: "Чистовая отделка", Rate: "m.wallpaper_glue", Qty: when(pEq("finish", 1), func(c *smetaCtx) (float64, string) {
			return math.Ceil(c.G.WallArea() / 25), fmt.Sprintf("пачка на 25 м², стены %s м²", f(r1(c.G.WallArea())))
		})},
		{Stage: "Чистовая отделка", Rate: "w.wall.tile", PerDay: 5, Qty: when(pEq("finish", 2), wallQ)},
		{Stage: "Чистовая отделка", Rate: "m.tile", Qty: when(pEq("finish", 2), func(c *smetaCtx) (float64, string) {
			return c.G.WallArea() * 1.1, c.wallWhy() + " + 10% на подрезку"
		})},
		{Stage: "Чистовая отделка", Rate: "m.tile_glue", Qty: when(pEq("finish", 2), packsOf("m.tile_glue", func(c *smetaCtx) (float64, string) {
			return c.G.WallArea() * 4.5, fmt.Sprintf("4,5 кг/м² (гребёнка 8 мм) × %s м²", f(r1(c.G.WallArea())))
		}))},
		{Stage: "Чистовая отделка", Rate: "m.grout", Qty: when(pEq("finish", 2), packsOf("m.grout", func(c *smetaCtx) (float64, string) {
			return c.G.WallArea() * 0.3, fmt.Sprintf("Ceresit CE 33: ≈0,3 кг/м² для плитки 30×60 со швом 2–3 мм × %s м²", f(r1(c.G.WallArea())))
		}))},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{
			fmt.Sprintf("Штукатурка по маякам слоем %s мм; расход Ротбанда 8,5 кг/м² на 10 мм (данные Knauf).", f(c.p("plaster_mm"))),
			"Шпаклёвка ≈1 кг/м² на слой; краска в 2 слоя по 0,15 кг/м²; грунт 0,15 л/м² перед каждым слоем.",
		}
	},
}

// ── Полы ──

func floorScreedMat(c *smetaCtx) float64 { return c.G.Area * c.p("screed_mm") / 1000 }

var tmFloors = &TechMap{
	ID: "floors", Title: "Полы", Group: "Отделка", BaseLabel: "Контур пола",
	Params: []SmetaParam{
		{Key: "cover", Label: "Покрытие", Default: 0, Min: 0, Max: 1, Options: []SmetaOption{{0, "Ламинат"}, {1, "Керамогранит"}}},
		{Key: "screed_mm", Label: "Толщина стяжки", Unit: "мм", Default: 50, Min: 30, Max: 100, Step: 10},
		{Key: "waterproof", Label: "Гидроизоляция (санузел, кухня)", Default: 0, Min: 0, Max: 1, Options: yesNo},
	},
	Stages: []tmStage{{"Гидроизоляция", 1, "высыхание гидроизоляции"}, {"Стяжка", 3, "набор прочности полусухой стяжки перед покрытием"}, {"Покрытие", 0, ""}, {"Плинтус", 0, ""}},
	Scenario: [3]string{
		"ламинат 32–33 класса по существующему основанию",
		"полусухая стяжка, ламинат 33 класса",
		"полусухая стяжка, ламинат 33 класса «ёлочкой»",
	},
	ScenarioFn: func(c *smetaCtx) [3]string {
		if c.pi("cover") == 1 {
			return [3]string{"керамогранит 60×60 по существующему основанию", "полусухая стяжка, керамогранит 60×60", "полусухая стяжка, керамогранит 60×60 под травертин"}
		}
		return [3]string{"ламинат 32–33 класса по существующему основанию", "полусухая стяжка, ламинат 33 класса", "полусухая стяжка, ламинат 33 класса «ёлочкой»"}
	},
	Lines: []tmLine{
		{Stage: "Гидроизоляция", Rate: "w.floor.waterproof", PerDay: 30, Qty: when(pOn("waterproof"), func(c *smetaCtx) (float64, string) {
			return c.G.Area + c.G.Perimeter*0.2, fmt.Sprintf("пол %s м² + заход на стены 0,2 м × %s м", f(r1(c.G.Area)), f(r1(c.G.Perimeter)))
		})},
		{Stage: "Гидроизоляция", Rate: "m.waterproof", Qty: when(pOn("waterproof"), packsOf("m.waterproof", func(c *smetaCtx) (float64, string) {
			a := c.G.Area + c.G.Perimeter*0.2
			return a * 1.4, fmt.Sprintf("2 слоя ≈1,4 кг/м² × %s м²", f(r1(a)))
		}))},
		{Stage: "Стяжка", Rate: "w.floor.screed", Only: "std+", PerDay: 60, Qty: areaQ},
		{Stage: "Стяжка", Rate: "m.cement", Only: "std+", Qty: packsOf("m.cement", func(c *smetaCtx) (float64, string) {
			v := floorScreedMat(c)
			return v * 400, fmt.Sprintf("раствор %s м³ (%s м² × %s мм), цемента 400 кг/м³", f(r2(v)), f(r1(c.G.Area)), f(c.p("screed_mm")))
		})},
		{Stage: "Стяжка", Rate: "m.sand", Only: "std+", Qty: func(c *smetaCtx) (float64, string) {
			v := floorScreedMat(c)
			return v * 1.1, fmt.Sprintf("раствор %s м³ × 1,1 м³ песка на 1 м³", f(r2(v)))
		}},
		{Stage: "Покрытие", Rate: "w.laminate", PerDay: 22, Qty: when(pEq("cover", 0), areaQ)},
		{Stage: "Покрытие", Rate: "m.laminate", Qty: when(pEq("cover", 0), func(c *smetaCtx) (float64, string) {
			return c.G.Area * 1.07, fmt.Sprintf("%s м² + 7%% на подрезку", f(r1(c.G.Area)))
		})},
		{Stage: "Покрытие", Rate: "m.underlay", Qty: when(pEq("cover", 0), func(c *smetaCtx) (float64, string) {
			return c.G.Area * 1.05, fmt.Sprintf("%s м² + 5%% нахлёст", f(r1(c.G.Area)))
		})},
		{Stage: "Покрытие", Rate: "w.floor.tile", PerDay: 7, Qty: when(pEq("cover", 1), areaQ)},
		{Stage: "Покрытие", Rate: "m.tile", Qty: when(pEq("cover", 1), func(c *smetaCtx) (float64, string) {
			return c.G.Area * 1.1, fmt.Sprintf("%s м² + 10%% на подрезку", f(r1(c.G.Area)))
		})},
		{Stage: "Покрытие", Rate: "m.tile_glue", Qty: when(pEq("cover", 1), packsOf("m.tile_glue", func(c *smetaCtx) (float64, string) {
			return c.G.Area * 5, fmt.Sprintf("5 кг/м² для плитки 60×60 × %s м²", f(r1(c.G.Area)))
		}))},
		{Stage: "Покрытие", Rate: "m.grout", Qty: when(pEq("cover", 1), packsOf("m.grout", func(c *smetaCtx) (float64, string) {
			return c.G.Area * 0.2, fmt.Sprintf("Ceresit CE 33: ≈0,2 кг/м² для плитки 60×60 со швом 2–3 мм × %s м²", f(r1(c.G.Area)))
		}))},
		{Stage: "Плинтус", Rate: "w.floor.skirting", PerDay: 40, Qty: when(pEq("cover", 0), func(c *smetaCtx) (float64, string) {
			return c.G.SkirtingLength(), fmt.Sprintf("периметр %s м − двери %d × 0,9 м", f(r1(c.G.Perimeter)), c.G.Doors)
		})},
		{Stage: "Плинтус", Rate: "m.skirting", Qty: when(pEq("cover", 0), func(c *smetaCtx) (float64, string) {
			return c.G.SkirtingLength() * 1.05, fmt.Sprintf("%s м + 5%% на подрезку", f(r1(c.G.SkirtingLength())))
		})},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{fmt.Sprintf("Стяжка %s мм, раствор 1:3 (цемента 400 кг на 1 м³). Плитка 60×60: клей 5 кг/м², затирка 0,2 кг/м² (Ceresit CE 33).", f(c.p("screed_mm")))}
	},
}

// ── Потолки ──

func ceilPutty(c *smetaCtx) float64 {
	if c.p("type") == 0 {
		return 0
	}
	if c.Tier == 0 {
		return 1
	}
	return 2
}

func ceilSpots(c *smetaCtx) (float64, string) {
	switch c.pi("spots") {
	case 1:
		return math.Ceil(c.G.Area / 2), fmt.Sprintf("1 светильник на 2 м² × %s м²", f(r1(c.G.Area)))
	case 2:
		return math.Ceil(c.G.Area / 1.5), fmt.Sprintf("1 светильник на 1,5 м² × %s м²", f(r1(c.G.Area)))
	}
	return 0, ""
}

var tmCeilings = &TechMap{
	ID: "ceilings", Title: "Потолки", Group: "Отделка", BaseLabel: "Контур потолка (= пола)",
	Params: []SmetaParam{
		{Key: "type", Label: "Тип потолка", Default: 0, Min: 0, Max: 2, Options: []SmetaOption{{0, "Натяжной"}, {1, "ГКЛ под покраску"}, {2, "Покраска по плите"}}},
		{Key: "spots", Label: "Точечные светильники", Default: 1, Min: 0, Max: 2, Options: []SmetaOption{{0, "Без них"}, {1, "1 на 2 м²"}, {2, "1 на 1,5 м²"}}},
	},
	Stages:   []tmStage{{"Каркас и обшивка", 0, ""}, {"Шпаклёвка", 1, "высыхание шпаклёвки"}, {"Покраска", 0, ""}, {"Натяжной потолок", 0, ""}, {"Светильники", 0, ""}},
	Scenario: [3]string{"натяжной матовый", "натяжной сатиновый", "натяжной глянцевый"},
	ScenarioFn: func(c *smetaCtx) [3]string {
		switch c.pi("type") {
		case 1:
			return [3]string{"ГКЛ, шпаклёвка в 1 слой, Gaudi «Белоснежка»", "ГКЛ, шпаклёвка в 2 слоя, Gaudi Standart", "ГКЛ, финиш Glatt Plus, краска Remalux"}
		case 2:
			return [3]string{"по плите: шпаклёвка в 1 слой, Gaudi «Белоснежка»", "по плите: шпаклёвка в 2 слоя, Gaudi Standart", "по плите: финиш Glatt Plus, краска Remalux"}
		}
		return [3]string{"натяжной матовый", "натяжной сатиновый", "натяжной глянцевый"}
	},
	Lines: []tmLine{
		{Stage: "Каркас и обшивка", Rate: "w.ceil.gkl", PerDay: 12, Qty: when(pEq("type", 1), areaQ)},
		{Stage: "Каркас и обшивка", Rate: "m.gkl", Qty: when(pEq("type", 1), func(c *smetaCtx) (float64, string) {
			return math.Ceil(c.G.Area * 1.1 / 3), fmt.Sprintf("%s м² + 10%%, лист 3 м²", f(r1(c.G.Area)))
		})},
		{Stage: "Каркас и обшивка", Rate: "m.profile_cd", Qty: when(pEq("type", 1), func(c *smetaCtx) (float64, string) {
			l := c.G.Area*3.3 + c.G.Perimeter
			return math.Ceil(l / 3), fmt.Sprintf("≈3,3 м профиля на 1 м² + направляющий по периметру = %s м, профиль 3 м", f(r1(l)))
		})},
		{Stage: "Шпаклёвка", Rate: "w.wall.primer", PerDay: 150, Qty: func(c *smetaCtx) (float64, string) {
			if ceilPutty(c) == 0 {
				return 0, ""
			}
			return c.G.Area * 2, fmt.Sprintf("%s м² × 2 прохода", f(r1(c.G.Area)))
		}},
		{Stage: "Шпаклёвка", Rate: "m.primer", Qty: packsOf("m.primer", func(c *smetaCtx) (float64, string) {
			if ceilPutty(c) == 0 {
				return 0, ""
			}
			return c.G.Area * 2 * 0.15, fmt.Sprintf("0,15 л/м² × %s м² × 2", f(r1(c.G.Area)))
		})},
		{Stage: "Шпаклёвка", Rate: "w.wall.putty", PerDay: 15, Qty: func(c *smetaCtx) (float64, string) {
			n := ceilPutty(c)
			return c.G.Area * n, fmt.Sprintf("%s м² × %s слоя", f(r1(c.G.Area)), f(n))
		}},
		{Stage: "Шпаклёвка", Rate: "m.putty_fin", Qty: packsOf("m.putty_fin", func(c *smetaCtx) (float64, string) {
			n := ceilPutty(c)
			return c.G.Area * n, fmt.Sprintf("≈1 кг/м² × %s слоя × %s м²", f(n), f(r1(c.G.Area)))
		})},
		{Stage: "Покраска", Rate: "w.ceil.paint", PerDay: 35, Qty: func(c *smetaCtx) (float64, string) {
			if c.p("type") == 0 {
				return 0, ""
			}
			return areaQ(c)
		}},
		{Stage: "Покраска", Rate: "m.paint", Qty: packsOf("m.paint", func(c *smetaCtx) (float64, string) {
			if c.p("type") == 0 {
				return 0, ""
			}
			return c.G.Area * 0.3, fmt.Sprintf("2 слоя × 0,15 кг/м² × %s м²", f(r1(c.G.Area)))
		})},
		{Stage: "Натяжной потолок", Rate: "w.ceil.stretch", PerDay: 30, Qty: when(pEq("type", 0), areaQ)},
		{Stage: "Светильники", Rate: "w.ceil.light", PerDay: 15, Qty: ceilSpots},
		{Stage: "Светильники", Rate: "m.spot", Qty: ceilSpots},
	},
}

// ── Электрика ──

func elCounts(c *smetaCtx) (s, sw, l float64) {
	s = c.p("sockets")
	if s <= 0 {
		s = math.Max(2, math.Ceil(c.G.Perimeter/4))
	}
	sw = c.p("switches")
	if sw <= 0 {
		sw = math.Max(1, float64(c.G.Doors))
	}
	l = c.p("lamps")
	if l <= 0 {
		l = math.Max(1, math.Ceil(c.G.Area/15))
	}
	return
}

func elPoints(c *smetaCtx) (float64, string) {
	s, sw, l := elCounts(c)
	return s + sw + l, fmt.Sprintf("%s розеток + %s выключателей + %s светильников", f(s), f(sw), f(l))
}

var tmElectric = &TechMap{
	ID: "electric", Title: "Электромонтаж", Group: "Инженерные системы", BaseLabel: "Контур помещения / квартиры",
	Params: []SmetaParam{
		{Key: "sockets", Label: "Розетки", Unit: "шт", Default: 0, Min: 0, Max: 300, Hint: "0 — по норме: 1 розетка на 4 м периметра"},
		{Key: "switches", Label: "Выключатели", Unit: "шт", Default: 0, Min: 0, Max: 100, Hint: "0 — по числу дверей"},
		{Key: "lamps", Label: "Потолочные светильники", Unit: "шт", Default: 0, Min: 0, Max: 100, Hint: "0 — 1 на 15 м²"},
		{Key: "panel", Label: "Новый электрощит", Default: 0, Min: 0, Max: 1, Options: yesNo},
	},
	Stages:   []tmStage{{"Штробление", 0, ""}, {"Прокладка кабеля", 0, ""}, {"Электрощит", 0, ""}, {"Электроустановка", 0, ""}},
	Scenario: [3]string{"полная замена проводки кабелем ВВГнг-LS 3×2,5", "полная замена проводки кабелем ВВГнг-LS 3×2,5", "замена проводки + дифавтоматы на мокрые зоны"},
	Lines: []tmLine{
		{Stage: "Штробление", Rate: "w.el.chase", PerDay: 25, Qty: func(c *smetaCtx) (float64, string) {
			n, why := elPoints(c)
			return n * 3, why + " × ≈3 м штробы на точку"
		}},
		{Stage: "Штробление", Rate: "w.el.chase_fill", PerDay: 50, Qty: func(c *smetaCtx) (float64, string) {
			n, why := elPoints(c)
			return n * 3, why + " × 3 м"
		}},
		{Stage: "Прокладка кабеля", Rate: "w.el.cable", PerDay: 80, Qty: func(c *smetaCtx) (float64, string) {
			n, why := elPoints(c)
			return n * 7, why + " × ≈7 м кабеля на точку"
		}},
		{Stage: "Прокладка кабеля", Rate: "m.cable", Qty: func(c *smetaCtx) (float64, string) {
			n, why := elPoints(c)
			return n * 7 * 1.1, why + " × 7 м + 10% запас"
		}},
		{Stage: "Прокладка кабеля", Rate: "w.el.box", PerDay: 8, Qty: func(c *smetaCtx) (float64, string) {
			n, _ := elPoints(c)
			return math.Ceil(n / 5), fmt.Sprintf("1 коробка на 5 точек, точек %s", f(n))
		}},
		{Stage: "Электрощит", Rate: "w.el.panel", PerDay: 1, Qty: when(pOn("panel"), fixed(1, "один щит"))},
		{Stage: "Электрощит", Rate: "m.panel_kit", Qty: when(pOn("panel"), fixed(1, "щит с 8 автоматами и УЗО"))},
		{Stage: "Электрощит", Rate: "w.el.breaker", PerDay: 10, Qty: when(pOn("panel"), fixed(8, "8 групп: свет, розетки по комнатам, кухня, ванная, плита, стиральная машина"))},
		{Stage: "Электрощит", Rate: "w.el.rcd", PerDay: 10, Qty: when(pOn("panel"), fixed(1, "вводное УЗО"))},
		{Stage: "Электрощит", Rate: "w.el.rcd", Only: "prem", PerDay: 10, Qty: when(pOn("panel"), fixed(2, "дифавтоматы на ванную и кухню"))},
		{Stage: "Электрощит", Rate: "m.rcd", Only: "prem", Qty: when(pOn("panel"), fixed(2, "дифавтоматы на ванную и кухню"))},
		{Stage: "Электроустановка", Rate: "w.el.socket", PerDay: 15, Qty: func(c *smetaCtx) (float64, string) {
			s, _, _ := elCounts(c)
			return s, fmt.Sprintf("%s розеток (по норме 1 на 4 м периметра %s м, если не задано)", f(s), f(r1(c.G.Perimeter)))
		}},
		{Stage: "Электроустановка", Rate: "w.el.switch", PerDay: 15, Qty: func(c *smetaCtx) (float64, string) {
			_, sw, _ := elCounts(c)
			return sw, fmt.Sprintf("%s выключателей", f(sw))
		}},
		{Stage: "Электроустановка", Rate: "m.socket", Qty: func(c *smetaCtx) (float64, string) {
			s, sw, _ := elCounts(c)
			return s + sw, fmt.Sprintf("%s розеток + %s выключателей", f(s), f(sw))
		}},
		{Stage: "Электроустановка", Rate: "w.el.light", PerDay: 6, Qty: func(c *smetaCtx) (float64, string) {
			_, _, l := elCounts(c)
			return l, fmt.Sprintf("%s светильников (1 на 15 м², если не задано)", f(l))
		}},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Электрика: ≈7 м кабеля и ≈3 м штробы на точку; светильники и люстры — заказчика (в смете только монтаж)."}
	},
}

// ── Сантехника ──

func plPoints(c *smetaCtx) (float64, string) {
	if v := c.p("points"); v > 0 {
		return v, fmt.Sprintf("задано %s точек", f(v))
	}
	n := 0.0
	parts := ""
	add := func(k string, pts float64, name string) {
		if c.p(k) > 0 {
			n += pts
			parts += fmt.Sprintf(" %s %s,", name, f(pts))
		}
	}
	add("toilet", 1, "унитаз")
	add("sink", 2, "раковина")
	add("bath", 2, "ванна")
	add("shower", 2, "душ")
	add("washer", 1, "стиральная машина")
	add("boiler", 2, "водонагреватель")
	add("towel", 2, "полотенцесушитель")
	if len(parts) > 0 {
		parts = parts[:len(parts)-1]
	}
	return n, "точки:" + parts
}

func mixers(c *smetaCtx) (float64, string) {
	n := 0.0
	for _, k := range []string{"sink", "bath", "shower"} {
		if c.p(k) > 0 {
			n++
		}
	}
	return n, "по смесителю на раковину, ванну и душ"
}

var tmPlumbing = &TechMap{
	ID: "plumbing", Title: "Сантехника и водопровод", Group: "Инженерные системы", BaseLabel: "Контур санузла / квартиры",
	Params: []SmetaParam{
		{Key: "toilet", Label: "Унитаз", Default: 1, Min: 0, Max: 2, Options: []SmetaOption{{0, "Нет"}, {1, "Компакт"}, {2, "Инсталляция"}}},
		{Key: "sink", Label: "Раковина с тумбой", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "bath", Label: "Ванна", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "shower", Label: "Душевая кабина", Default: 0, Min: 0, Max: 1, Options: yesNo},
		{Key: "washer", Label: "Стиральная машина", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "boiler", Label: "Водонагреватель", Default: 0, Min: 0, Max: 1, Options: yesNo},
		{Key: "towel", Label: "Полотенцесушитель", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "riser", Label: "Врезка в стояк", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "points", Label: "Точек водоснабжения", Unit: "шт", Default: 0, Min: 0, Max: 60, Hint: "0 — по выбранным приборам"},
	},
	Stages:   []tmStage{{"Разводка труб", 1, "опрессовка системы"}, {"Установка сантехники", 0, ""}},
	Scenario: [3]string{"бюджетный унитаз-компакт", "унитаз-компакт среднего сегмента", "унитаз верхнего сегмента"},
	Lines: []tmLine{
		{Stage: "Разводка труб", Rate: "w.pl.riser", PerDay: 2, Qty: when(pOn("riser"), fixed(1, "врезка в стояк ХВС/ГВС"))},
		{Stage: "Разводка труб", Rate: "w.pl.point", PerDay: 3, Qty: plPoints},
		{Stage: "Разводка труб", Rate: "m.ppr", Qty: func(c *smetaCtx) (float64, string) {
			n, why := plPoints(c)
			return n * 3 * 1.1, why + "; ≈3 м трубы на точку + 10%"
		}},
		{Stage: "Установка сантехники", Rate: "w.pl.toilet", PerDay: 2, Qty: when(pEq("toilet", 1), fixed(1, "унитаз-компакт"))},
		{Stage: "Установка сантехники", Rate: "m.toilet", Qty: when(pEq("toilet", 1), fixed(1, "унитаз-компакт"))},
		{Stage: "Установка сантехники", Rate: "w.pl.install", PerDay: 1, Qty: when(pEq("toilet", 2), fixed(1, "инсталляция"))},
		{Stage: "Установка сантехники", Rate: "m.install_set", Qty: when(pEq("toilet", 2), fixed(1, "инсталляция с унитазом"))},
		{Stage: "Установка сантехники", Rate: "w.pl.sink", PerDay: 3, Qty: when(pOn("sink"), fixed(1, "раковина"))},
		{Stage: "Установка сантехники", Rate: "m.sink", Qty: when(pOn("sink"), fixed(1, "раковина"))},
		{Stage: "Установка сантехники", Rate: "w.pl.mixer", PerDay: 6, Qty: mixers},
		{Stage: "Установка сантехники", Rate: "m.mixer", Qty: mixers},
		{Stage: "Установка сантехники", Rate: "w.pl.bath", PerDay: 2, Qty: when(pOn("bath"), fixed(1, "ванна"))},
		{Stage: "Установка сантехники", Rate: "m.bath", Qty: when(pOn("bath"), fixed(1, "ванна"))},
		{Stage: "Установка сантехники", Rate: "w.pl.shower", PerDay: 1, Qty: when(pOn("shower"), fixed(1, "душевая кабина"))},
		{Stage: "Установка сантехники", Rate: "m.shower", Qty: when(pOn("shower"), fixed(1, "душевая кабина"))},
		{Stage: "Установка сантехники", Rate: "w.pl.washer", PerDay: 4, Qty: when(pOn("washer"), fixed(1, "стиральная машина (сама машина — заказчика)"))},
		{Stage: "Установка сантехники", Rate: "w.pl.boiler", PerDay: 3, Qty: when(pOn("boiler"), fixed(1, "водонагреватель"))},
		{Stage: "Установка сантехники", Rate: "m.boiler", Qty: when(pOn("boiler"), fixed(1, "водонагреватель 80 л"))},
		{Stage: "Установка сантехники", Rate: "w.pl.towel", PerDay: 4, Qty: when(pOn("towel"), fixed(1, "полотенцесушитель"))},
		{Stage: "Установка сантехники", Rate: "m.towel", Qty: when(pOn("towel"), fixed(1, "полотенцесушитель"))},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Сантехника: работа «за точку» включает прокладку труб; ≈3 м трубы PPR на точку."}
	},
}

// ── Отопление, вентиляция, газ ──

func radiators(c *smetaCtx) (float64, string) {
	if v := c.p("radiators"); v > 0 {
		return v, fmt.Sprintf("задано %s радиаторов", f(v))
	}
	byArea := math.Ceil(c.G.Area * 100 / 1800)
	n := math.Max(math.Max(1, float64(c.G.Windows)), byArea)
	return n, fmt.Sprintf("теплопотери ≈100 Вт/м² × %s м² = %s кВт; радиатор 10 секций ≈1,8 кВт; не меньше числа окон (%d)", f(r1(c.G.Area)), f(r1(c.G.Area*0.1)), c.G.Windows)
}

var tmHeating = &TechMap{
	ID: "heating", Title: "Отопление", Group: "Инженерные системы", BaseLabel: "Отапливаемая площадь", UseOpen: true,
	Params:   []SmetaParam{{Key: "radiators", Label: "Радиаторы", Unit: "шт", Default: 0, Min: 0, Max: 200, Hint: "0 — по теплопотерям и числу окон"}},
	Stages:   []tmStage{{"Трубы отопления", 0, ""}, {"Радиаторы", 1, "опрессовка"}},
	Scenario: [3]string{"биметаллические радиаторы 10 секций", "биметаллические радиаторы 10 секций", "биметаллические радиаторы 10 секций"},
	Lines: []tmLine{
		{Stage: "Трубы отопления", Rate: "w.ht.supply", PerDay: 2, Qty: radiators},
		{Stage: "Радиаторы", Rate: "w.ht.radiator", PerDay: 4, Qty: radiators},
		{Stage: "Радиаторы", Rate: "m.radiator", Qty: radiators},
	},
}

var tmHvac = &TechMap{
	ID: "hvac", Title: "Кондиционирование и вентиляция", Group: "Инженерные системы", BaseLabel: "Контур помещений",
	Params: []SmetaParam{
		{Key: "splits", Label: "Сплит-системы", Unit: "шт", Default: 0, Min: 0, Max: 50, Hint: "0 — одна 9000 BTU на 25 м²"},
		{Key: "vents", Label: "Вытяжные вентиляторы", Unit: "шт", Default: 1, Min: 0, Max: 30},
	},
	Stages: []tmStage{{"Кондиционеры", 0, ""}, {"Вентиляция", 0, ""}},
	Lines: []tmLine{
		{Stage: "Кондиционеры", Rate: "e.split", PerDay: 1, Qty: func(c *smetaCtx) (float64, string) {
			if v := c.p("splits"); v > 0 {
				return v, "задано"
			}
			return math.Max(1, math.Ceil(c.G.Area/25)), fmt.Sprintf("9000 BTU охлаждает ≈25 м², площадь %s м²", f(r1(c.G.Area)))
		}},
		{Stage: "Вентиляция", Rate: "w.hvac.vent", PerDay: 4, Qty: byParam("vents", "санузлы и кухня")},
	},
}

var tmGas = &TechMap{
	ID: "gas", Title: "Газоснабжение", Group: "Инженерные системы", BaseLabel: "Контур дома",
	Params: []SmetaParam{
		{Key: "pipe_m", Label: "Длина газопровода в доме", Unit: "м", Default: 10, Min: 1, Max: 300},
		{Key: "devices", Label: "Газовые приборы", Unit: "шт", Default: 2, Min: 1, Max: 20},
		{Key: "project", Label: "Нужен проект", Default: 1, Min: 0, Max: 1, Options: yesNo},
	},
	Stages: []tmStage{{"Проект", 14, "согласование проекта в газовой службе"}, {"Монтаж газопровода", 0, ""}, {"Подключение приборов", 0, ""}},
	Lines: []tmLine{
		{Stage: "Проект", Rate: "w.gas.project", Qty: when(pOn("project"), fixed(1, "проект и согласование"))},
		{Stage: "Монтаж газопровода", Rate: "w.gas.pipe", PerDay: 10, Qty: byParam("pipe_m", "длина по проекту")},
		{Stage: "Подключение приборов", Rate: "w.gas.connect", PerDay: 3, Qty: byParam("devices", "плита и котёл")},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Газ: работы выполняет только лицензированная организация; цена уточняется после техусловий."}
	},
}

// ── Демонтаж ──

func demDebris(c *smetaCtx) (float64, string) {
	g := c.G
	v := 0.0
	if c.p("wallpaper") > 0 {
		v += g.WallArea() * 0.002
	}
	if c.p("plaster") > 0 {
		v += g.WallArea() * 0.025
	}
	if c.p("tile_all") > 0 {
		v += g.WallArea() * 0.02
	}
	if c.p("floor") > 0 {
		v += g.Area * 0.015
	}
	if c.p("screed") > 0 {
		v += g.Area * 0.06
	}
	v += c.p("partitions") * 0.13
	v += c.p("doors_out") * 0.1
	loose := v * 1.6
	if loose <= 0 {
		return 0, ""
	}
	return math.Max(1, math.Ceil(loose/6)), fmt.Sprintf("мусора ≈%s м³ в теле, %s м³ в разрыхлённом виде (×1,6); 6 м³ за рейс", f(r2(v)), f(r1(loose)))
}

var tmDemolition = &TechMap{
	ID: "demolition", Title: "Демонтаж", Group: "Подготовка", BaseLabel: "Контур помещения", UseHeight: true, UseOpen: true,
	Params: []SmetaParam{
		{Key: "wallpaper", Label: "Снять обои", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "plaster", Label: "Сбить штукатурку", Default: 0, Min: 0, Max: 1, Options: yesNo},
		{Key: "tile_all", Label: "Снять плитку со стен", Default: 0, Min: 0, Max: 1, Options: yesNo},
		{Key: "floor", Label: "Снять напольное покрытие", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "screed", Label: "Демонтаж стяжки", Default: 0, Min: 0, Max: 1, Options: yesNo},
		{Key: "partitions", Label: "Снос перегородок в ½ кирпича", Unit: "м²", Default: 0, Min: 0, Max: 500},
		{Key: "doors_out", Label: "Демонтаж дверных блоков", Unit: "шт", Default: 0, Min: 0, Max: 50},
		{Key: "building_m3", Label: "Снос строения (строительный объём)", Unit: "м³", Default: 0, Min: 0, Max: 100000},
	},
	Stages:   []tmStage{{"Демонтаж", 0, ""}, {"Вывоз мусора", 0, ""}},
	Scenario: [3]string{"объём демонтажа одинаков во всех сценариях", "объём демонтажа одинаков во всех сценариях", "объём демонтажа одинаков во всех сценариях"},
	Lines: []tmLine{
		{Stage: "Демонтаж", Rate: "w.dem.wallpaper", PerDay: 40, Qty: when(pOn("wallpaper"), wallQ)},
		{Stage: "Демонтаж", Rate: "w.dem.plaster", PerDay: 25, Qty: when(pOn("plaster"), wallQ)},
		{Stage: "Демонтаж", Rate: "w.dem.tile_wall", PerDay: 15, Qty: when(pOn("tile_all"), wallQ)},
		{Stage: "Демонтаж", Rate: "w.dem.floor", PerDay: 30, Qty: when(pOn("floor"), areaQ)},
		{Stage: "Демонтаж", Rate: "w.dem.screed", PerDay: 10, Qty: when(pOn("screed"), areaQ)},
		{Stage: "Демонтаж", Rate: "w.dem.wall_half_brick", PerDay: 6, Qty: byParam("partitions", "площадь перегородок")},
		{Stage: "Демонтаж", Rate: "w.dem.door", PerDay: 6, Qty: byParam("doors_out", "дверные блоки")},
		{Stage: "Демонтаж", Rate: "w.dem.building", PerDay: 60, Qty: byParam("building_m3", "строительный объём здания")},
		{Stage: "Вывоз мусора", Rate: "w.dem.trash", PerDay: 2, Qty: demDebris},
	},
}

// ── Общестрой ──

var tmEarth = &TechMap{
	ID: "earth", Title: "Земляные работы", Group: "Общестрой", BaseLabel: "Контур котлована / участка",
	Params: []SmetaParam{
		{Key: "depth", Label: "Глубина выемки", Unit: "м", Default: 1.5, Min: 0.1, Max: 10, Step: 0.1},
		{Key: "manual", Label: "Способ", Default: 0, Min: 0, Max: 1, Options: []SmetaOption{{0, "Мини-экскаватор"}, {1, "Вручную"}}},
		{Key: "backfill", Label: "Обратная засыпка", Unit: "%", Default: 0, Min: 0, Max: 100, Step: 10},
		{Key: "haul", Label: "Вывоз лишнего грунта", Default: 1, Min: 0, Max: 1, Options: yesNo},
	},
	Stages:   []tmStage{{"Разработка грунта", 0, ""}, {"Вывоз грунта", 0, ""}, {"Обратная засыпка", 0, ""}},
	Scenario: [3]string{"объём работ одинаков во всех сценариях", "объём работ одинаков во всех сценариях", "объём работ одинаков во всех сценариях"},
	Lines: []tmLine{
		{Stage: "Разработка грунта", Rate: "e.miniexc", PerDay: 8, Qty: when(pEq("manual", 0), func(c *smetaCtx) (float64, string) {
			v := c.G.Area * c.p("depth")
			return math.Max(4, math.Ceil(v/12)), fmt.Sprintf("%s м³ (%s м² × %s м) ÷ 12 м³/ч, минимальный заказ 4 ч", f(r1(v)), f(r1(c.G.Area)), f(c.p("depth")))
		})},
		{Stage: "Разработка грунта", Rate: "w.earth.manual", PerDay: 2.5, Qty: when(pEq("manual", 1), func(c *smetaCtx) (float64, string) {
			return c.G.Area * c.p("depth"), fmt.Sprintf("%s м² × %s м", f(r1(c.G.Area)), f(c.p("depth")))
		})},
		{Stage: "Вывоз грунта", Rate: "w.earth.haul", PerDay: 60, Qty: when(pOn("haul"), func(c *smetaCtx) (float64, string) {
			v := c.G.Area * c.p("depth") * (1 - c.p("backfill")/100)
			return v * 1.25, fmt.Sprintf("%s м³ без обратной засыпки × 1,25 (разрыхление)", f(r1(v)))
		})},
		{Stage: "Обратная засыпка", Rate: "w.earth.backfill", PerDay: 30, Qty: func(c *smetaCtx) (float64, string) {
			v := c.G.Area * c.p("depth") * c.p("backfill") / 100
			return v, fmt.Sprintf("%s%% выемки", f(c.p("backfill")))
		}},
	},
}

func foundL(c *smetaCtx) float64 { return c.G.Perimeter + c.p("inner") }
func foundV(c *smetaCtx) float64 { return foundL(c) * c.p("width") * c.p("height") }
func foundBelow(c *smetaCtx) float64 {
	return foundL(c) * c.p("width") * math.Max(0, c.p("height")-c.p("above"))
}
func foundTrench(c *smetaCtx) float64 {
	return foundL(c) * (c.p("width") + 0.4) * (math.Max(0, c.p("height")-c.p("above")) + 0.1)
}

var tmFoundation = &TechMap{
	ID: "foundation", Title: "Ленточный фундамент", Group: "Общестрой", BaseLabel: "Контур по оси наружных стен",
	Params: []SmetaParam{
		{Key: "width", Label: "Ширина ленты", Unit: "м", Default: 0.4, Min: 0.2, Max: 1.2, Step: 0.05},
		{Key: "height", Label: "Высота ленты", Unit: "м", Default: 1.2, Min: 0.4, Max: 3, Step: 0.1},
		{Key: "above", Label: "Над землёй", Unit: "м", Default: 0.4, Min: 0, Max: 1.5, Step: 0.1},
		{Key: "inner", Label: "Внутренние несущие стены", Unit: "м", Default: 0, Min: 0, Max: 500},
		{Key: "rebar", Label: "Армирование", Unit: "кг/м³", Default: 70, Min: 30, Max: 150, Step: 5, Hint: "Типично 60–80 кг на 1 м³ ленты"},
	},
	Stages:   []tmStage{{"Разбивка осей", 0, ""}, {"Земляные работы", 0, ""}, {"Подготовка", 0, ""}, {"Опалубка и армирование", 0, ""}, {"Бетонирование", 7, "набор 70% прочности бетона"}, {"Обратная засыпка", 0, ""}},
	Scenario: [3]string{"бетон М300, арматура А500С", "бетон М300, арматура А500С", "бетон М300, арматура А500С"},
	Lines: []tmLine{
		{Stage: "Разбивка осей", Rate: "w.geodesy", PerDay: 1, Qty: fixed(1, "вынос осей в натуру")},
		{Stage: "Земляные работы", Rate: "e.miniexc", PerDay: 8, Qty: func(c *smetaCtx) (float64, string) {
			v := foundTrench(c)
			return math.Max(4, math.Ceil(v/12)), fmt.Sprintf("траншея %s м × %s м × %s м = %s м³, 12 м³/ч", f(r1(foundL(c))), f(c.p("width")+0.4), f(math.Max(0, c.p("height")-c.p("above"))+0.1), f(r1(v)))
		}},
		{Stage: "Земляные работы", Rate: "w.earth.haul", PerDay: 60, Qty: func(c *smetaCtx) (float64, string) {
			v := foundBelow(c)
			return v * 1.25, fmt.Sprintf("грунт, вытесненный лентой %s м³ × 1,25", f(r1(v)))
		}},
		{Stage: "Подготовка", Rate: "m.crushed", Qty: func(c *smetaCtx) (float64, string) {
			return foundL(c) * (c.p("width") + 0.2) * 0.1 * 1.3, fmt.Sprintf("подушка 10 см по ширине %s м × %s м, уплотнение ×1,3", f(c.p("width")+0.2), f(r1(foundL(c))))
		}},
		{Stage: "Опалубка и армирование", Rate: "m.formwork", Qty: func(c *smetaCtx) (float64, string) {
			return 2 * foundL(c) * (c.p("above") + 0.1), fmt.Sprintf("2 стороны × %s м × (надземная часть %s м + 0,1)", f(r1(foundL(c))), f(c.p("above")))
		}},
		{Stage: "Опалубка и армирование", Rate: "m.rebar", Qty: func(c *smetaCtx) (float64, string) {
			v := foundV(c)
			return v * c.p("rebar") / 1000 * 1.05, fmt.Sprintf("%s м³ × %s кг/м³ + 5%% нахлёсты", f(r2(v)), f(c.p("rebar")))
		}},
		{Stage: "Бетонирование", Rate: "w.found.strip", PerDay: 4, Qty: func(c *smetaCtx) (float64, string) {
			return foundV(c), fmt.Sprintf("%s м × %s м × %s м (периметр + внутренние стены)", f(r1(foundL(c))), f(c.p("width")), f(c.p("height")))
		}},
		{Stage: "Бетонирование", Rate: "m.concrete", Qty: func(c *smetaCtx) (float64, string) {
			return foundV(c) * 1.03, fmt.Sprintf("%s м³ + 3%% потери", f(r2(foundV(c))))
		}},
		{Stage: "Обратная засыпка", Rate: "w.earth.backfill", PerDay: 30, Qty: func(c *smetaCtx) (float64, string) {
			v := foundTrench(c) - foundBelow(c)
			return v, "пазухи траншеи"
		}},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Фундамент: бетон подаётся миксером напрямую (без автобетононасоса); гидроизоляция и утепление ленты не включены."}
	},
}

var tmConcrete = &TechMap{
	ID: "concrete", Title: "Монолитная плита", Group: "Общестрой", BaseLabel: "Контур плиты",
	Params: []SmetaParam{
		{Key: "thickness", Label: "Толщина", Unit: "м", Default: 0.2, Min: 0.08, Max: 0.6, Step: 0.02},
		{Key: "kind", Label: "Вид", Default: 0, Min: 0, Max: 1, Options: []SmetaOption{{0, "Плита на грунте"}, {1, "Перекрытие"}}},
		{Key: "rebar", Label: "Армирование", Unit: "кг/м³", Default: 100, Min: 40, Max: 200, Step: 10},
	},
	Stages:   []tmStage{{"Подготовка", 0, ""}, {"Опалубка и армирование", 0, ""}, {"Бетонирование", 7, "набор 70% прочности бетона"}},
	Scenario: [3]string{"бетон М300, арматура А500С", "бетон М300, арматура А500С", "бетон М300, арматура А500С"},
	Lines: []tmLine{
		{Stage: "Подготовка", Rate: "m.crushed", Qty: when(pEq("kind", 0), func(c *smetaCtx) (float64, string) {
			return c.G.Area * 0.15 * 1.3, fmt.Sprintf("щебёночная подушка 15 см × %s м², уплотнение ×1,3", f(r1(c.G.Area)))
		})},
		{Stage: "Опалубка и армирование", Rate: "m.formwork", Qty: func(c *smetaCtx) (float64, string) {
			t := c.p("thickness")
			if c.p("kind") == 1 {
				return c.G.Area + c.G.Perimeter*t, fmt.Sprintf("днище %s м² + борта %s м × %s м", f(r1(c.G.Area)), f(r1(c.G.Perimeter)), f(t))
			}
			return c.G.Perimeter * (t + 0.1), fmt.Sprintf("борта %s м × %s м", f(r1(c.G.Perimeter)), f(t+0.1))
		}},
		{Stage: "Опалубка и армирование", Rate: "m.rebar", Qty: func(c *smetaCtx) (float64, string) {
			v := c.G.Area * c.p("thickness")
			return v * c.p("rebar") / 1000 * 1.05, fmt.Sprintf("%s м³ × %s кг/м³ + 5%%", f(r2(v)), f(c.p("rebar")))
		}},
		{Stage: "Бетонирование", Rate: "w.conc.monolith", PerDay: 4, Qty: func(c *smetaCtx) (float64, string) {
			return c.G.Area * c.p("thickness"), fmt.Sprintf("%s м² × %s м", f(r1(c.G.Area)), f(c.p("thickness")))
		}},
		{Stage: "Бетонирование", Rate: "m.concrete", Qty: func(c *smetaCtx) (float64, string) {
			v := c.G.Area * c.p("thickness")
			return v * 1.03, fmt.Sprintf("%s м³ + 3%% потери", f(r2(v)))
		}},
	},
}

func masonryV(c *smetaCtx) (float64, string) {
	g := c.G
	L := g.Perimeter + c.p("inner")
	fl := math.Max(1, c.p("floors"))
	a := math.Max(0, L*g.Height*fl-g.OpeningsArea())
	return a * c.p("thickness"), fmt.Sprintf("(%s м × %s м × %s эт. − проёмы %s м²) × %s м", f(r1(L)), f(g.Height), f(fl), f(r1(g.OpeningsArea())), f(c.p("thickness")))
}

var tmMasonry = &TechMap{
	ID: "masonry", Title: "Кладка стен из газоблока", Group: "Общестрой", BaseLabel: "Контур наружных стен", UseHeight: true, UseOpen: true,
	Params: []SmetaParam{
		{Key: "thickness", Label: "Толщина стены", Unit: "м", Default: 0.3, Min: 0.1, Max: 0.6, Step: 0.05},
		{Key: "inner", Label: "Внутренние несущие стены", Unit: "м", Default: 0, Min: 0, Max: 500},
		{Key: "floors", Label: "Этажей", Default: 1, Min: 1, Max: 5},
		{Key: "partitions", Label: "Перегородки 100 мм", Unit: "м²", Default: 0, Min: 0, Max: 2000},
	},
	Stages:   []tmStage{{"Кладка стен", 0, ""}, {"Перегородки", 0, ""}},
	Scenario: [3]string{"газоблок D500 на клею", "газоблок D500 на клею", "газоблок D500 на клею"},
	Lines: []tmLine{
		{Stage: "Кладка стен", Rate: "w.mas.aerated", PerDay: 3, Qty: masonryV},
		{Stage: "Кладка стен", Rate: "m.aerated", Qty: func(c *smetaCtx) (float64, string) {
			v, why := masonryV(c)
			return v * 1.05, why + " + 5% бой и подрезка"
		}},
		{Stage: "Кладка стен", Rate: "m.aerated_glue", Qty: packsOf("m.aerated_glue", func(c *smetaCtx) (float64, string) {
			v, _ := masonryV(c)
			return v * 25, fmt.Sprintf("≈25 кг клея на 1 м³ кладки × %s м³", f(r2(v)))
		})},
		{Stage: "Перегородки", Rate: "w.mas.partition", PerDay: 10, Qty: byParam("partitions", "площадь перегородок")},
		{Stage: "Перегородки", Rate: "m.aerated", Qty: func(c *smetaCtx) (float64, string) {
			return c.p("partitions") * 0.1 * 1.05, fmt.Sprintf("%s м² × 0,1 м + 5%%", f(c.p("partitions")))
		}},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Кладка: армопояс и перемычки считаются в разделе «Монолитная плита»."}
	},
}

var tmMetal = &TechMap{
	ID: "metal", Title: "Металлоконструкции, навес", Group: "Общестрой", BaseLabel: "Контур навеса / каркаса",
	Stages: []tmStage{{"Изготовление и монтаж", 0, ""}},
	Lines:  []tmLine{{Stage: "Изготовление и монтаж", Rate: "w.metal.canopy", PerDay: 10, Qty: areaQ}},
	Assume: func(c *smetaCtx) []string {
		return []string{"Навес: цена из объявлений включает металл, покраску и монтаж; фундаменты под стойки не включены."}
	},
}

var tmWood = &TechMap{
	ID: "wood", Title: "Деревянные конструкции", Group: "Общестрой", BaseLabel: "Контур настила",
	Stages: []tmStage{{"Лаги и настил", 0, ""}},
	Lines: []tmLine{
		{Stage: "Лаги и настил", Rate: "w.wood.floor", PerDay: 15, Qty: areaQ},
		{Stage: "Лаги и настил", Rate: "m.timber", Qty: func(c *smetaCtx) (float64, string) {
			return c.G.Area * 0.0475 * 1.07, fmt.Sprintf("лаги 50×150 шаг 0,6 м (0,0125 м³/м²) + доска 35 мм (0,035 м³/м²) × %s м² + 7%%", f(r1(c.G.Area)))
		}},
	},
}

// ── Кровля, фасад, утепление ──

func roofArea(c *smetaCtx) (float64, string) {
	pitch := c.p("pitch") * math.Pi / 180
	base := c.G.Area + c.G.Perimeter*c.p("overhang")
	return base / math.Cos(pitch), fmt.Sprintf("(%s м² + свесы %s м × %s м) ÷ cos %s° = %s м²", f(r1(c.G.Area)), f(r1(c.G.Perimeter)), f(c.p("overhang")), f(c.p("pitch")), f(r1(base/math.Cos(pitch))))
}

var tmRoof = &TechMap{
	ID: "roof", Title: "Кровля", Group: "Общестрой", BaseLabel: "Контур дома в плане",
	Params: []SmetaParam{
		{Key: "pitch", Label: "Уклон скатов", Unit: "°", Default: 30, Min: 5, Max: 60, Step: 5},
		{Key: "overhang", Label: "Свес кровли", Unit: "м", Default: 0.5, Min: 0, Max: 1.5, Step: 0.1},
		{Key: "shape", Label: "Форма", Default: 0, Min: 0, Max: 1, Options: []SmetaOption{{0, "Двускатная"}, {1, "Вальмовая"}}},
		{Key: "frame", Label: "Новая стропильная система", Default: 1, Min: 0, Max: 1, Options: yesNo},
		{Key: "insulated", Label: "Утеплённая (мансарда)", Default: 0, Min: 0, Max: 1, Options: yesNo},
		{Key: "replace", Label: "Демонтаж старой кровли", Default: 0, Min: 0, Max: 1, Options: yesNo},
	},
	Stages:   []tmStage{{"Стропильная система", 0, ""}, {"Мембрана и утепление", 0, ""}, {"Кровельное покрытие", 0, ""}, {"Водосток", 0, ""}},
	Scenario: [3]string{"металлочерепица «Венеция»", "металлочерепица «СуперМонтеррей» 0,45 мм", "металлочерепица «СуперМонтеррей» (Россия)"},
	Lines: []tmLine{
		{Stage: "Стропильная система", Rate: "w.roof.rafters", PerDay: 20, Qty: when(pOn("frame"), roofArea)},
		{Stage: "Стропильная система", Rate: "m.timber", Qty: when(pOn("frame"), func(c *smetaCtx) (float64, string) {
			a, _ := roofArea(c)
			return a * 0.035 * 1.07, fmt.Sprintf("стропила и обрешётка ≈0,035 м³ на 1 м² × %s м² + 7%%", f(r1(a)))
		})},
		{Stage: "Мембрана и утепление", Rate: "m.membrane", Qty: func(c *smetaCtx) (float64, string) {
			a, _ := roofArea(c)
			return a * 1.15, fmt.Sprintf("%s м² + 15%% нахлёсты", f(r1(a)))
		}},
		{Stage: "Мембрана и утепление", Rate: "w.roof.insul", PerDay: 40, Qty: when(pOn("insulated"), roofArea)},
		{Stage: "Мембрана и утепление", Rate: "m.roof_insul", Qty: when(pOn("insulated"), func(c *smetaCtx) (float64, string) {
			a, _ := roofArea(c)
			return a * 1.05, fmt.Sprintf("%s м² + 5%%", f(r1(a)))
		})},
		{Stage: "Кровельное покрытие", Rate: "w.roof.metal", PerDay: 40, Qty: when(pEq("replace", 0), roofArea)},
		{Stage: "Кровельное покрытие", Rate: "w.roof.replace", PerDay: 30, Qty: when(pOn("replace"), roofArea)},
		{Stage: "Кровельное покрытие", Rate: "m.roof_cover", Qty: func(c *smetaCtx) (float64, string) {
			a, _ := roofArea(c)
			return a * 1.1, fmt.Sprintf("%s м² + 10%% нахлёст и подрезка", f(r1(a)))
		}},
		{Stage: "Водосток", Rate: "w.roof.gutter", PerDay: 20, Qty: roofEaves},
		{Stage: "Водосток", Rate: "m.gutter", Qty: roofEaves},
	},
}

func roofEaves(c *smetaCtx) (float64, string) {
	if c.p("shape") == 1 {
		return c.G.Perimeter + 8*c.p("overhang"), "вальмовая: карниз по всему периметру"
	}
	return c.G.Perimeter / 2, "двускатная: карниз по двум длинным сторонам ≈ половина периметра"
}

func facadeArea(c *smetaCtx) (float64, string) {
	h := c.p("facade_h")
	a := math.Max(0, c.G.Perimeter*h-c.G.OpeningsArea())
	return a, fmt.Sprintf("%s м × %s м − проёмы %s м² = %s м²", f(r1(c.G.Perimeter)), f(h), f(r1(c.G.OpeningsArea())), f(r1(a)))
}

var tmFacade = &TechMap{
	ID: "facade", Title: "Фасадные работы", Group: "Общестрой", BaseLabel: "Контур дома в плане", UseOpen: true,
	Params: []SmetaParam{{Key: "facade_h", Label: "Высота фасада", Unit: "м", Default: 3.5, Min: 2, Max: 30, Step: 0.5}},
	Stages: []tmStage{{"Леса", 0, ""}, {"Штукатурка", 3, "высыхание цементной штукатурки"}, {"Финишная отделка", 0, ""}},
	Scenario: [3]string{
		"окраска существующего фасада без новой штукатурки",
		"штукатурка по сетке и фасадная краска в 2 слоя",
		"штукатурка по сетке и декоративная штукатурка «короед»",
	},
	Lines: []tmLine{
		{Stage: "Леса", Rate: "w.fac.scaffold", PerDay: 100, Qty: func(c *smetaCtx) (float64, string) {
			if c.p("facade_h") <= 3 {
				return 0, ""
			}
			return c.G.Perimeter * c.p("facade_h"), fmt.Sprintf("%s м × %s м", f(r1(c.G.Perimeter)), f(c.p("facade_h")))
		}},
		{Stage: "Штукатурка", Rate: "w.wall.primer", PerDay: 150, Qty: func(c *smetaCtx) (float64, string) {
			a, why := facadeArea(c)
			n := 1.0
			if c.Tier >= 1 {
				n = 2
			}
			return a * n, fmt.Sprintf("%s × %s прохода", why, f(n))
		}},
		{Stage: "Штукатурка", Rate: "m.primer", Qty: packsOf("m.primer", func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			n := 1.0
			if c.Tier >= 1 {
				n = 2
			}
			return a * n * 0.15, fmt.Sprintf("0,15 л/м² × %s м² × %s", f(r1(a)), f(n))
		})},
		{Stage: "Штукатурка", Rate: "w.fac.plaster", Only: "std+", PerDay: 15, Qty: facadeArea},
		{Stage: "Штукатурка", Rate: "m.facade_plaster", Only: "std+", Qty: packsOf("m.facade_plaster", func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return a * 15, fmt.Sprintf("15 кг/м² при слое 10 мм × %s м²", f(r1(a)))
		})},
		{Stage: "Штукатурка", Rate: "m.mesh", Only: "std+", Qty: func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return a * 1.1, fmt.Sprintf("%s м² + 10%% нахлёст", f(r1(a)))
		}},
		{Stage: "Финишная отделка", Rate: "w.fac.paint", Only: "eco+std", PerDay: 40, Qty: facadeArea},
		{Stage: "Финишная отделка", Rate: "m.facade_paint", Only: "eco+std", Qty: packsOf("m.facade_paint", func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return a * 0.35, fmt.Sprintf("2 слоя ≈0,35 кг/м² × %s м²", f(r1(a)))
		})},
		{Stage: "Финишная отделка", Rate: "w.fac.decor", Only: "prem", PerDay: 15, Qty: facadeArea},
		{Stage: "Финишная отделка", Rate: "m.decor_plaster", Only: "prem", Qty: packsOf("m.decor_plaster", func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return a * 2.8, fmt.Sprintf("«короед» 2 мм ≈2,8 кг/м² × %s м²", f(r1(a)))
		})},
	},
}

var tmInsulation = &TechMap{
	ID: "insulation", Title: "Утепление фасада", Group: "Общестрой", BaseLabel: "Контур дома в плане", UseOpen: true,
	Params:   []SmetaParam{{Key: "facade_h", Label: "Высота фасада", Unit: "м", Default: 3.5, Min: 2, Max: 30, Step: 0.5}},
	Stages:   []tmStage{{"Утепление", 2, "высыхание армирующего слоя"}},
	Scenario: [3]string{"минплита 100 мм, «мокрый фасад»", "минплита 100 мм, «мокрый фасад»", "минплита 100 мм, «мокрый фасад»"},
	Lines: []tmLine{
		{Stage: "Утепление", Rate: "w.fac.insul", PerDay: 12, Qty: facadeArea},
		{Stage: "Утепление", Rate: "m.facade_wool", Qty: func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return a * 1.05, fmt.Sprintf("%s м² + 5%% подрезка", f(r1(a)))
		}},
		{Stage: "Утепление", Rate: "m.facade_glue", Qty: packsOf("m.facade_glue", func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return a * 9, fmt.Sprintf("приклейка 5 кг/м² + армирующий слой 4 кг/м² × %s м²", f(r1(a)))
		})},
		{Stage: "Утепление", Rate: "m.mesh", Qty: func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return a * 1.1, fmt.Sprintf("%s м² + 10%% нахлёст", f(r1(a)))
		}},
		{Stage: "Утепление", Rate: "m.dowel", Qty: func(c *smetaCtx) (float64, string) {
			a, _ := facadeArea(c)
			return math.Ceil(a * 6), fmt.Sprintf("6 дюбелей на 1 м² × %s м²", f(r1(a)))
		}},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Утепление: леса учитываются в разделе «Фасадные работы»."}
	},
}

// ── Окна, двери, интерьер ──

func winCount(c *smetaCtx) (float64, string) {
	if v := c.p("count"); v > 0 {
		return v, "задано"
	}
	return math.Max(1, float64(c.G.Windows)), fmt.Sprintf("окон в контуре: %d", c.G.Windows)
}

var tmWindows = &TechMap{
	ID: "windows", Title: "Окна", Group: "Отделка", BaseLabel: "Контур помещения", UseOpen: true,
	Params: []SmetaParam{
		{Key: "count", Label: "Окна", Unit: "шт", Default: 0, Min: 0, Max: 300, Hint: "0 — по числу окон в контуре"},
		{Key: "slopes", Label: "Откосы из сэндвича", Default: 1, Min: 0, Max: 1, Options: yesNo},
	},
	Stages:   []tmStage{{"Установка окон", 0, ""}, {"Откосы и подоконники", 0, ""}},
	Scenario: [3]string{"ПВХ-окно с монтажом", "ПВХ-окно с монтажом", "ПВХ-окно премиум-профиль"},
	Lines: []tmLine{
		{Stage: "Установка окон", Rate: "w.win", PerDay: 3, Qty: winCount},
		{Stage: "Откосы и подоконники", Rate: "w.win.sill", PerDay: 6, Qty: winCount},
		{Stage: "Откосы и подоконники", Rate: "w.win.drip", PerDay: 8, Qty: winCount},
		{Stage: "Откосы и подоконники", Rate: "w.win.slopes", PerDay: 4, Qty: when(pOn("slopes"), winCount)},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Окна: цена прайса — за окно 1,3×1,3 м; окна большего размера дороже пропорционально площади."}
	},
}

func intDoors(c *smetaCtx) (float64, string) {
	if v := c.p("doors"); v > 0 {
		return v, "задано"
	}
	return float64(c.G.Doors), fmt.Sprintf("дверей в контуре: %d", c.G.Doors)
}

var tmInterior = &TechMap{
	ID: "interior", Title: "Двери и мебель", Group: "Отделка", BaseLabel: "Контур квартиры", UseOpen: true,
	Params: []SmetaParam{
		{Key: "doors", Label: "Межкомнатные двери", Unit: "шт", Default: 0, Min: 0, Max: 100, Hint: "0 — по числу дверей в контуре"},
		{Key: "entrance", Label: "Входная дверь", Default: 0, Min: 0, Max: 1, Options: yesNo},
		{Key: "kitchen_m", Label: "Кухонный гарнитур", Unit: "м.п.", Default: 0, Min: 0, Max: 20, Step: 0.5},
		{Key: "furniture", Label: "Сборка мебели", Unit: "ед", Default: 0, Min: 0, Max: 100},
	},
	Stages: []tmStage{{"Двери", 0, ""}, {"Мебель", 0, ""}},
	Lines: []tmLine{
		{Stage: "Двери", Rate: "w.door.interior", PerDay: 3, Qty: intDoors},
		{Stage: "Двери", Rate: "m.door_interior", Qty: intDoors},
		{Stage: "Двери", Rate: "w.door.entrance", PerDay: 2, Qty: when(pOn("entrance"), fixed(1, "входная дверь"))},
		{Stage: "Двери", Rate: "m.door_entrance", Qty: when(pOn("entrance"), fixed(1, "входная дверь"))},
		{Stage: "Мебель", Rate: "m.kitchen", Qty: byParam("kitchen_m", "длина гарнитура")},
		{Stage: "Мебель", Rate: "w.furn.assembly", PerDay: 3, Qty: byParam("furniture", "предметы мебели")},
	},
}

var tmStairs = &TechMap{
	ID: "stairs", Title: "Облицовка лестницы", Group: "Отделка", BaseLabel: "Контур лестничной клетки",
	Params:   []SmetaParam{{Key: "steps", Label: "Ступени", Unit: "шт", Default: 15, Min: 1, Max: 300}},
	Stages:   []tmStage{{"Облицовка ступеней", 0, ""}},
	Scenario: [3]string{"керамогранит 60×60", "керамогранит 60×60", "керамогранит под травертин"},
	Lines: []tmLine{
		{Stage: "Облицовка ступеней", Rate: "w.stairs.tile", PerDay: 3, Qty: byParam("steps", "число ступеней")},
		{Stage: "Облицовка ступеней", Rate: "m.tile", Qty: func(c *smetaCtx) (float64, string) {
			return c.p("steps") * 1.1, fmt.Sprintf("≈1 м² на ступень с подступенком × %s + 10%%", f(c.p("steps")))
		}},
		{Stage: "Облицовка ступеней", Rate: "m.tile_glue", Qty: packsOf("m.tile_glue", func(c *smetaCtx) (float64, string) {
			return c.p("steps") * 5, fmt.Sprintf("5 кг/м² × %s м²", f(c.p("steps")))
		})},
	},
}

var tmDesign = &TechMap{
	ID: "design", Title: "Дизайн-проект", Group: "Проектирование", BaseLabel: "Контур объекта",
	Params:   []SmetaParam{{Key: "object", Label: "Объект", Default: 0, Min: 0, Max: 1, Options: []SmetaOption{{0, "Квартира"}, {1, "Дом"}}}},
	Stages:   []tmStage{{"Проектирование", 0, ""}},
	Scenario: [3]string{"дизайн-проект без визуализации", "дизайн-проект без визуализации", "дизайн-проект и 3D-визуализация"},
	Lines: []tmLine{
		{Stage: "Проектирование", Rate: "w.design.flat", PerDay: 3, Qty: when(pEq("object", 0), areaQ)},
		{Stage: "Проектирование", Rate: "w.design.house", PerDay: 3, Qty: when(pEq("object", 1), areaQ)},
		{Stage: "Проектирование", Rate: "w.design.render", Only: "prem", PerDay: 5, Qty: areaQ},
	},
}

// ── Слаботочка, безопасность, наружные работы ──

func fireN(c *smetaCtx) (float64, string) {
	if v := c.p("sensors"); v > 0 {
		return v, "задано"
	}
	return math.Max(2, math.Ceil(c.G.Area/30)), fmt.Sprintf("не меньше 2 извещателей, 1 на 30 м² × %s м²", f(r1(c.G.Area)))
}

var tmFire = &TechMap{
	ID: "fire_safety", Title: "Пожарная сигнализация", Group: "Инженерные системы", BaseLabel: "Контур помещений",
	Params: []SmetaParam{{Key: "sensors", Label: "Извещатели", Unit: "шт", Default: 0, Min: 0, Max: 500, Hint: "0 — по площади"}},
	Stages: []tmStage{{"Монтаж сигнализации", 0, ""}},
	Lines: []tmLine{
		{Stage: "Монтаж сигнализации", Rate: "w.fire.sensor", PerDay: 15, Qty: fireN},
		{Stage: "Монтаж сигнализации", Rate: "m.fire.sensor", Qty: fireN},
		{Stage: "Монтаж сигнализации", Rate: "m.fire.panel", Qty: fixed(1, "один прибор")},
		{Stage: "Монтаж сигнализации", Rate: "w.el.cable", PerDay: 80, Qty: func(c *smetaCtx) (float64, string) {
			n, _ := fireN(c)
			return n*8 + 20, fmt.Sprintf("8 м шлейфа на извещатель × %s + 20 м до прибора", f(n))
		}},
		{Stage: "Монтаж сигнализации", Rate: "m.fire.cable", Qty: func(c *smetaCtx) (float64, string) {
			n, _ := fireN(c)
			return (n*8 + 20) * 1.1, "шлейф + 10% запас"
		}},
	},
	Assume: func(c *smetaCtx) []string {
		return []string{"Пожарная сигнализация для коммерческих объектов требует проекта по нормам РК; здесь — оценка монтажа."}
	},
}

var tmAutomation = &TechMap{
	ID: "automation", Title: "Видеонаблюдение", Group: "Инженерные системы", BaseLabel: "Контур объекта",
	Params: []SmetaParam{{Key: "cameras", Label: "Камеры", Unit: "шт", Default: 4, Min: 1, Max: 64}},
	Stages: []tmStage{{"Монтаж системы", 0, ""}},
	Lines: []tmLine{
		{Stage: "Монтаж системы", Rate: "w.cctv.camera", PerDay: 4, Qty: byParam("cameras", "камеры")},
		{Stage: "Монтаж системы", Rate: "m.cctv.camera", Qty: byParam("cameras", "камеры")},
		{Stage: "Монтаж системы", Rate: "m.cctv.nvr", Qty: fixed(1, "регистратор до 8 камер")},
	},
}

func netL(c *smetaCtx) float64 {
	if v := c.p("length"); v > 0 {
		return v
	}
	return c.G.Perimeter
}

var tmExternalNets = &TechMap{
	ID: "external_nets", Title: "Наружный водопровод", Group: "Наружные работы", BaseLabel: "Трасса (длина — по периметру или параметром)",
	Params: []SmetaParam{
		{Key: "length", Label: "Длина трассы", Unit: "м", Default: 0, Min: 0, Max: 5000, Hint: "0 — по периметру контура"},
		{Key: "depth", Label: "Глубина траншеи", Unit: "м", Default: 1.5, Min: 0.5, Max: 4, Step: 0.1, Hint: "ниже глубины промерзания"},
	},
	Stages: []tmStage{{"Траншея", 0, ""}, {"Укладка трубы", 0, ""}, {"Засыпка", 0, ""}},
	Lines: []tmLine{
		{Stage: "Траншея", Rate: "e.miniexc", PerDay: 8, Qty: func(c *smetaCtx) (float64, string) {
			v := netL(c) * 0.6 * c.p("depth")
			return math.Max(4, math.Ceil(v/12)), fmt.Sprintf("траншея %s м × 0,6 м × %s м = %s м³, 12 м³/ч", f(r1(netL(c))), f(c.p("depth")), f(r1(v)))
		}},
		{Stage: "Укладка трубы", Rate: "m.sand", Qty: func(c *smetaCtx) (float64, string) {
			return netL(c) * 0.6 * 0.3, "подсыпка 10 см и присыпка 20 см по ширине 0,6 м"
		}},
		{Stage: "Укладка трубы", Rate: "w.net.pipe_lay", PerDay: 50, Qty: func(c *smetaCtx) (float64, string) {
			return netL(c), "длина трассы"
		}},
		{Stage: "Укладка трубы", Rate: "m.pnd", Qty: func(c *smetaCtx) (float64, string) {
			return netL(c) * 1.03, "длина + 3%"
		}},
		{Stage: "Засыпка", Rate: "w.earth.backfill", PerDay: 30, Qty: func(c *smetaCtx) (float64, string) {
			return netL(c) * 0.6 * (c.p("depth") - 0.3), "траншея за вычетом песчаного слоя"
		}},
	},
}

func pavingBase(c *smetaCtx) float64 { return c.G.Area * 0.3 }

var tmLandscaping = &TechMap{
	ID: "landscaping", Title: "Мощение брусчаткой", Group: "Наружные работы", BaseLabel: "Контур площадки",
	Params: []SmetaParam{{Key: "curb", Label: "Бордюр по периметру", Default: 1, Min: 0, Max: 1, Options: yesNo}},
	Stages: []tmStage{{"Корыто и основание", 0, ""}, {"Укладка", 0, ""}, {"Бордюр", 0, ""}},
	Lines: []tmLine{
		{Stage: "Корыто и основание", Rate: "e.miniexc", PerDay: 8, Qty: func(c *smetaCtx) (float64, string) {
			v := pavingBase(c)
			return math.Max(4, math.Ceil(v/12)), fmt.Sprintf("корыто 30 см × %s м² = %s м³", f(r1(c.G.Area)), f(r1(v)))
		}},
		{Stage: "Корыто и основание", Rate: "w.earth.haul", PerDay: 60, Qty: func(c *smetaCtx) (float64, string) {
			return pavingBase(c) * 1.25, "грунт из корыта × 1,25"
		}},
		{Stage: "Корыто и основание", Rate: "m.crushed", Qty: func(c *smetaCtx) (float64, string) {
			return c.G.Area * 0.15 * 1.3, "щебень 15 см с уплотнением ×1,3"
		}},
		{Stage: "Корыто и основание", Rate: "m.sand", Qty: func(c *smetaCtx) (float64, string) {
			return c.G.Area * 0.05 * 1.2, "песчаная постель 5 см × 1,2"
		}},
		{Stage: "Укладка", Rate: "w.land.paving", PerDay: 20, Qty: areaQ},
		{Stage: "Укладка", Rate: "m.paving", Qty: func(c *smetaCtx) (float64, string) {
			return c.G.Area * 1.05, fmt.Sprintf("%s м² + 5%% подрезка", f(r1(c.G.Area)))
		}},
		{Stage: "Бордюр", Rate: "w.land.curb", PerDay: 20, Qty: when(pOn("curb"), func(c *smetaCtx) (float64, string) {
			return c.G.Perimeter, "по периметру площадки"
		})},
		{Stage: "Бордюр", Rate: "m.curb", Qty: when(pOn("curb"), func(c *smetaCtx) (float64, string) {
			return math.Ceil(c.G.Perimeter), "бордюр 1 м, по периметру"
		})},
	},
}

var tmRoads = &TechMap{
	ID: "roads", Title: "Асфальтирование", Group: "Наружные работы", BaseLabel: "Контур площадки / дороги",
	Params: []SmetaParam{{Key: "curb", Label: "Бордюр по периметру", Default: 1, Min: 0, Max: 1, Options: yesNo}},
	Stages: []tmStage{{"Корыто и основание", 0, ""}, {"Асфальт", 0, ""}, {"Бордюр", 0, ""}},
	Lines: []tmLine{
		{Stage: "Корыто и основание", Rate: "e.miniexc", PerDay: 8, Qty: func(c *smetaCtx) (float64, string) {
			v := c.G.Area * 0.35
			return math.Max(4, math.Ceil(v/12)), fmt.Sprintf("корыто 35 см × %s м² = %s м³", f(r1(c.G.Area)), f(r1(v)))
		}},
		{Stage: "Корыто и основание", Rate: "w.earth.haul", PerDay: 60, Qty: func(c *smetaCtx) (float64, string) {
			return c.G.Area * 0.35 * 1.25, "грунт из корыта × 1,25"
		}},
		{Stage: "Корыто и основание", Rate: "m.crushed", Qty: func(c *smetaCtx) (float64, string) {
			return c.G.Area * 0.2 * 1.3, "щебень 20 см с уплотнением ×1,3"
		}},
		{Stage: "Асфальт", Rate: "w.road.asphalt", PerDay: 300, Qty: areaQ},
		{Stage: "Бордюр", Rate: "w.land.curb", PerDay: 20, Qty: when(pOn("curb"), func(c *smetaCtx) (float64, string) {
			return c.G.Perimeter, "по периметру"
		})},
		{Stage: "Бордюр", Rate: "m.curb", Qty: when(pOn("curb"), func(c *smetaCtx) (float64, string) {
			return math.Ceil(c.G.Perimeter), "бордюр 1 м"
		})},
	},
}

func laborMap(id, title string) *TechMap {
	return &TechMap{
		ID: id, Title: title, Group: "Прочее", BaseLabel: "Контур объекта",
		Params: []SmetaParam{
			{Key: "workers", Label: "Рабочих", Unit: "чел", Default: 2, Min: 1, Max: 50},
			{Key: "days", Label: "Смен", Unit: "дн", Default: 5, Min: 1, Max: 365},
			{Key: "trips", Label: "Вывоз мусора", Unit: "рейс", Default: 1, Min: 0, Max: 100},
		},
		Stages: []tmStage{{"Работы", 0, ""}, {"Вывоз мусора", 0, ""}},
		Lines: []tmLine{
			{Stage: "Работы", Rate: "w.labor.shift", Qty: func(c *smetaCtx) (float64, string) {
				return c.p("workers") * c.p("days"), fmt.Sprintf("%s чел × %s смен", f(c.p("workers")), f(c.p("days")))
			}},
			{Stage: "Вывоз мусора", Rate: "w.dem.trash", PerDay: 2, Qty: byParam("trips", "по объёму работ")},
		},
		Assume: func(c *smetaCtx) []string {
			return []string{"Для этой категории нет типовой технологической карты: смета посчитана по трудозатратам. Для точного расчёта опишите работы инженеру QazGost."}
		},
	}
}

// ── Реестр ──

var smetaOrder = []string{
	"demolition", "earth", "foundation", "concrete", "masonry", "metal", "wood", "roof", "facade", "insulation", "windows",
	"electric", "plumbing", "heating", "hvac", "gas", "fire_safety", "automation",
	"wall_finish", "floors", "ceilings", "stairs", "interior", "design",
	"external_nets", "landscaping", "roads", "special", "other",
}

var smetaTechMaps = map[string]*TechMap{
	"demolition": tmDemolition, "earth": tmEarth, "foundation": tmFoundation, "concrete": tmConcrete,
	"masonry": tmMasonry, "metal": tmMetal, "wood": tmWood, "roof": tmRoof, "facade": tmFacade,
	"insulation": tmInsulation, "windows": tmWindows, "electric": tmElectric, "plumbing": tmPlumbing,
	"heating": tmHeating, "hvac": tmHvac, "gas": tmGas, "fire_safety": tmFire, "automation": tmAutomation,
	"wall_finish": tmWallFinish, "floors": tmFloors, "ceilings": tmCeilings, "stairs": tmStairs,
	"interior": tmInterior, "design": tmDesign, "external_nets": tmExternalNets, "landscaping": tmLandscaping,
	"roads": tmRoads, "special": laborMap("special", "Специальные работы"), "other": laborMap("other", "Прочие работы"),
}

type smetaComplexPart struct {
	Category string
	Params   map[string]float64
}

type smetaComplex struct {
	Title string
	Parts []smetaComplexPart
}

var smetaComplexOrder = []string{"apartment_renovation", "bathroom", "turnkey", "house_build", "facade_renovation", "engineering"}

var smetaComplexes = map[string]smetaComplex{
	"apartment_renovation": {"Ремонт квартиры", []smetaComplexPart{
		{"demolition", map[string]float64{"wallpaper": 1, "floor": 1}},
		{"electric", map[string]float64{"panel": 1}},
		{"plumbing", nil},
		{"wall_finish", map[string]float64{"finish": 0}},
		{"floors", map[string]float64{"cover": 0}},
		{"ceilings", map[string]float64{"type": 0}},
	}},
	"bathroom": {"Ремонт санузла", []smetaComplexPart{
		{"demolition", map[string]float64{"wallpaper": 0, "tile_all": 1, "floor": 1, "doors_out": 1}},
		{"plumbing", nil},
		{"electric", map[string]float64{"sockets": 2, "switches": 1, "lamps": 1, "panel": 0}},
		{"wall_finish", map[string]float64{"finish": 2}},
		{"floors", map[string]float64{"cover": 1, "waterproof": 1}},
		{"ceilings", map[string]float64{"type": 0}},
	}},
	"turnkey": {"Ремонт под ключ", []smetaComplexPart{
		{"demolition", map[string]float64{"wallpaper": 1, "floor": 1}},
		{"windows", nil},
		{"electric", map[string]float64{"panel": 1}},
		{"plumbing", nil},
		{"heating", nil},
		{"wall_finish", map[string]float64{"finish": 0}},
		{"floors", map[string]float64{"cover": 0}},
		{"ceilings", map[string]float64{"type": 0}},
		{"interior", map[string]float64{"entrance": 1}},
	}},
	"house_build": {"Строительство дома", []smetaComplexPart{
		{"earth", map[string]float64{"depth": 0.2, "haul": 1}},
		{"foundation", nil},
		{"masonry", nil},
		{"concrete", map[string]float64{"kind": 1}},
		{"roof", nil},
		{"windows", nil},
		{"insulation", nil},
		{"facade", nil},
		{"electric", map[string]float64{"panel": 1}},
		{"plumbing", nil},
		{"heating", nil},
		{"wall_finish", map[string]float64{"finish": 0}},
		{"floors", map[string]float64{"cover": 0}},
		{"ceilings", map[string]float64{"type": 0}},
	}},
	"facade_renovation": {"Ремонт фасада", []smetaComplexPart{
		{"insulation", nil},
		{"facade", nil},
	}},
	"engineering": {"Инженерные системы", []smetaComplexPart{
		{"electric", map[string]float64{"panel": 1}},
		{"plumbing", nil},
		{"heating", nil},
		{"hvac", nil},
		{"gas", nil},
	}},
}
