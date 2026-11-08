package services

// Справочник расценок для сметы QazGost (базовый город — Алматы, коэффициент 1,00).
//
// Verified=true — цена взята из открытого прайса подрядчика или из предложений
// продавцов (источник в Source, ссылка в URL, если страница известна).
// Verified=false — открытого прайса не нашлось: это расчётная оценка QazGost,
// методика в Note, и в смете такая строка помечается «оценка».
// Цены рыночные, без НДС, актуальность — SmetaPriceDate.

type SmetaRate struct {
	Key      string  `json:"key"`
	Name     string  `json:"name"`
	Unit     string  `json:"unit"`
	Price    float64 `json:"price"`
	Kind     string  `json:"kind"` // work | material | equipment
	Source   string  `json:"source"`
	URL      string  `json:"url,omitempty"`
	Verified bool    `json:"verified"`
	Note     string  `json:"note,omitempty"`
	Pack     float64 `json:"pack,omitempty"` // фасовка: кг/л/м² в одной упаковке
	DBQuery  string  `json:"-"`              // слова для сверки с базой QazGost
}

const SmetaPriceDate = "ноябрь 2026"

const (
	srcProff      = "Прайс «Профф-Ремонт», Алматы, 2026"
	urlProff      = "https://proff-remont.kz/ceny/"
	srcRekrovli   = "Прайс «Рекровли», Алматы, 2026"
	urlRekrovli   = "https://rekrovli.kz/"
	srcSatu       = "Satu.kz, предложения продавцов, 2026"
	srcOLX        = "OLX.kz, объявления, 2026"
	srcKaspi      = "Kaspi Объявления, Алматы, 2026"
	srcBizmedia   = "Bizmedia.kz по данным OLX, июнь 2026"
	urlBizmedia   = "https://bizmedia.kz/2026-06-29-stroitelnyj-sezon-startoval-kak-izmenilis-czeny-na-materialy-i-uslugi-v-kazahstane/"
	srcSilver     = "Прайс «Silver-Ремонт», Алматы"
	srcEstimate   = "Оценка QazGost"
	urlSatuRoof   = "https://satu.kz/Metallocherepitsa-v-almate.html"
	urlKaspiTile  = "https://obyavleniya.kaspi.kz/a/kafelschik-master-120758607"
	urlKaspiTiler = "https://obyavleniya.kaspi.kz/a/kafelschik-114185822"
	urlSatuPorc   = "https://satu.kz/almaty/Keramogranit-6060.html"
	urlKaspiFound = "https://obyavleniya.kaspi.kz/a/fundament-117422153"
	urlSatuLam    = "https://satu.kz/almaty/Laminirovannyj-parket-33-klass.html"
)

func rateW(key, name, unit string, price float64, src, url, q string) SmetaRate {
	return SmetaRate{Key: key, Name: name, Unit: unit, Price: price, Kind: "work", Source: src, URL: url, Verified: true, DBQuery: q}
}

func rateM(key, name, unit string, price float64, src, url string, pack float64, q string) SmetaRate {
	return SmetaRate{Key: key, Name: name, Unit: unit, Price: price, Kind: "material", Source: src, URL: url, Verified: true, Pack: pack, DBQuery: q}
}

func rateE(key, name, unit string, price float64, src, url, q string) SmetaRate {
	return SmetaRate{Key: key, Name: name, Unit: unit, Price: price, Kind: "equipment", Source: src, URL: url, Verified: true, DBQuery: q}
}

// rateEst — позиция без открытого прайса: цена — оценка, методика в note.
func rateEst(r SmetaRate, note string) SmetaRate {
	r.Verified = false
	r.Source = srcEstimate
	r.URL = ""
	r.Note = note
	return r
}

var smetaRateList = []SmetaRate{
	// ── Демонтаж ──
	rateW("w.dem.plaster", "Демонтаж штукатурки со стен", "м²", 970, srcProff, urlProff, "демонтаж штукатур"),
	rateW("w.dem.tile_wall", "Демонтаж плитки со стен", "м²", 855, srcProff, urlProff, "демонтаж плитк"),
	rateW("w.dem.floor", "Демонтаж напольного покрытия (ламинат, линолеум, ПВХ-плитка)", "м²", 625, srcProff, urlProff, "демонтаж пол"),
	rateW("w.dem.tile_floor", "Демонтаж плитки с пола", "м²", 1200, srcKaspi, urlKaspiTiler, "демонтаж плитк"),
	rateW("w.dem.screed", "Демонтаж стяжки", "м²", 2000, srcProff, urlProff, "демонтаж стяжк"),
	rateW("w.dem.wallpaper", "Очистка стен от обоев", "м²", 515, srcProff, urlProff, "обои"),
	rateW("w.dem.wall_half_brick", "Демонтаж перегородки в ½ кирпича", "м²", 2050, srcProff, urlProff, "демонтаж перегород"),
	rateW("w.dem.door", "Демонтаж деревянного дверного блока", "шт", 6950, srcProff, urlProff, "демонтаж двер"),
	rateW("w.dem.building", "Снос строения механизированный (по строительному объёму)", "м³", 3200, srcSatu, "https://satu.kz/Kotlovany.html", "снос"),
	rateW("w.dem.trash", "Погрузка и вывоз строительного мусора (самосвал до 6 м³)", "рейс", 25000, srcKaspi, "https://obyavleniya.kaspi.kz/a/vyivoz-musora-119668975", "вывоз мусор"),

	// ── Стены ──
	rateW("w.wall.primer", "Грунтовка стен глубокого проникновения", "м²", 400, srcProff, urlProff, "грунтовк"),
	rateW("w.wall.plaster", "Штукатурка стен по маякам", "м²", 2050, srcProff, urlProff, "штукатурк стен"),
	rateW("w.wall.putty", "Шпаклёвка и шлифовка стен (один слой)", "м²", 1500, srcProff, urlProff, "шпатлевк"),
	rateW("w.wall.paint", "Окраска стен в 2 слоя", "м²", 1250, srcProff, urlProff, "окраск стен"),
	rateW("w.wall.wallpaper", "Поклейка флизелиновых обоев", "м²", 1350, srcProff, urlProff, "обои"),
	rateW("w.wall.wallpaper_vinyl", "Поклейка виниловых обоев на флизелине", "м²", 1450, srcProff, urlProff, "обои"),
	rateW("w.wall.tile", "Облицовка стен плиткой", "м²", 8000, srcKaspi, urlKaspiTile, "облицовк плитк"),
	rateW("w.wall.gkl_partition", "Монтаж перегородки из ГКЛ", "м²", 2350, srcProff, urlProff, "перегородк"),
	rateW("w.wall.gkl_insul", "Укладка звукоизоляции в перегородку ГКЛ", "м²", 685, srcProff, urlProff, "утеплител"),

	rateM("m.rotband", "Штукатурка гипсовая Knauf Ротбанд, 30 кг", "мешок", 3200, srcSatu, "https://satu.kz/Rotband.html", 30, "ротбанд"),
	rateM("m.primer", "Грунтовка акриловая Remalux, 10 л", "канистра", 4000, srcSatu, "https://satu.kz/almaty/Remalux.html", 10, "грунтовк"),
	rateM("m.putty", "Шпаклёвка гипсовая Knauf Фуген, 25 кг", "мешок", 3850, srcSatu, "https://satu.kz/Gipsovye-materialy.html", 25, "шпатлевк"),
	rateM("m.putty_prem", "Шпаклёвка финишная AlinEX Glatt Plus, 25 кг", "мешок", 6850, srcSatu, "https://almaty.satu.kz/Glatt-plyus.html", 25, "шпатлевк"),
	rateM("m.paint_eco", "Краска интерьерная Gaudi «Белоснежка», 10 кг", "ведро", 5500, srcSatu, "https://satu.kz/almaty/Gaudi.html", 10, "краск"),
	rateM("m.paint_std", "Краска интерьерная Gaudi Standart, 10 кг", "ведро", 10600, srcSatu, "https://satu.kz/almaty/Gaudi.html", 10, "краск"),
	rateM("m.paint_prem", "Краска интерьерная Remalux, 25 кг", "ведро", 16500, srcSatu, "https://satu.kz/brands/Remalux", 25, "краск"),
	rateM("m.wallpaper", "Обои флизелиновые Pure Rose, рулон 1,06×10,05 м", "рулон", 9900, srcSatu, "https://satu.kz/p45013722-oboi-pure-rose.html", 0, "обои"),
	rateEst(rateM("m.wallpaper_glue", "Клей для флизелиновых обоев (пачка на 25 м²)", "шт", 2500, "", "", 25, "клей обойн"),
		"Розничная цена пачки клея Quelyd/Metylan в Алматы"),
	rateM("m.gkl", "Лист гипсокартона влагостойкий Knauf 12,5 мм, 2,5×1,2 м", "лист", 3420, srcSatu, "https://satu.kz/Gipsokarton-stenovoj-razmer.html", 3, "гипсокартон"),
	rateM("m.profile_ps", "Профиль стоечный ПС 75×50, 3 м (573 ₸/м)", "шт", 1719, srcSatu, "https://satu.kz/almaty/Profil-stoechnyj-ps-7550.html", 3, "профиль"),
	rateM("m.profile_cd", "Профиль потолочный Knauf ПП 60×27, 3 м", "шт", 1750, srcSatu, "https://satu.kz/almaty/Profil-dlya-gipsokartona-60-27.html", 3, "профиль"),
	rateM("m.tile_glue", "Клей плиточный Ceresit CM 11 Plus, 25 кг", "мешок", 3190, srcSatu, "https://satu.kz/almaty/Klej-ceresit-cm-11.html", 25, "клей плит"),
	rateM("m.grout", "Затирка Ceresit CE 33, 5 кг", "мешок", 3110, srcSatu, "https://satu.kz/almaty/Zatirka-ceresit.html", 5, "затирк"),
	rateM("m.foam", "Пена монтажная Makroflex Standard, 750 мл", "баллон", 3400, srcSatu, "https://satu.kz/almaty/Pena-montazhnaya-makroflex.html", 1, "пена"),

	// ── Полы ──
	rateW("w.floor.screed", "Полусухая стяжка пола", "м²", 2550, srcProff, urlProff, "стяжк"),
	rateW("w.floor.self_level", "Устройство наливного пола", "м²", 2100, srcProff, urlProff, "наливн"),
	rateW("w.floor.laminate", "Укладка ламината (прямая)", "м²", 1150, srcProff, urlProff, "ламинат"),
	rateW("w.floor.laminate_herring", "Укладка ламината «ёлочкой»", "м²", 2400, srcProff, urlProff, "ламинат"),
	rateW("w.floor.tile", "Укладка плитки / керамогранита на пол", "м²", 7000, srcKaspi, urlKaspiTile, "уклад плитк"),
	rateW("w.floor.skirting", "Монтаж пластикового плинтуса", "м.п.", 455, srcProff, urlProff, "плинтус"),
	rateEst(rateW("w.floor.waterproof", "Обмазочная гидроизоляция пола в 2 слоя", "м²", 1500, "", "", "гидроизоляц"),
		"Ставка плиточников по объявлениям Алматы 1–2 тыс. ₸/м²"),

	rateM("m.cement", "Цемент М500, 50 кг", "мешок", 2300, srcOLX, "https://www.olx.kz/alma-ata/q-цемент/", 50, "цемент"),
	rateEst(rateM("m.sand", "Песок мытый с доставкой", "м³", 7000, "", "", 1, "песок"),
		"Satu: песок мытый мелкий 5 900 ₸/м³, доставка КамАЗом по 10 м³ оговаривается отдельно; с доставкой по Алматы ≈7 000 ₸/м³"),
	rateM("m.laminate_eco", "Ламинат Super Natural Narrow, 33 класс, 8 мм", "м²", 3024, srcSatu, urlSatuLam, 1, "ламинат"),
	rateM("m.laminate_std", "Ламинат Kastamonu Floorpan Black, 33 класс, 8 мм", "м²", 4700, srcSatu, urlSatuLam, 1, "ламинат"),
	rateM("m.laminate_prem", "Ламинат «французская ёлка», 33 класс, 8 мм", "м²", 7150, srcSatu, "https://llp.satu.kz/p127805819-laminat-frantsuzskaya-yolka.html", 1, "ламинат"),
	rateM("m.underlay", "Подложка листовая 3 мм (упаковка 8,4 м² — 2 144 ₸)", "м²", 255, srcSatu, "https://satu.kz/p97767459-podlozhka-pod-laminat.html", 1, "подложк"),
	rateEst(rateM("m.skirting", "Плинтус ПВХ с заглушками и углами", "м.п.", 300, "", "", 1, "плинтус"),
		"Satu: плинтус ПВХ VOX 65 мм, 2,5 м — 505 ₸ (≈200 ₸/м); углы, заглушки и соединители ≈100 ₸ на метр"),
	rateM("m.porcelain", "Керамогранит 60×60 «Тянь-Шань Керамик»", "м²", 2800, srcSatu, urlSatuPorc, 1, "керамогранит"),
	rateM("m.porcelain_std", "Керамогранит 60×60 под мрамор", "м²", 4200, srcSatu, urlSatuPorc, 1, "керамогранит"),
	rateM("m.porcelain_prem", "Керамогранит 60×60 «Пиастрелла» МС 600", "м²", 7000, srcSatu, "https://bazaplitki.satu.kz/p120656821-keramogranit-bezhevyj-odnotonnyj.html", 1, "керамогранит"),
	rateEst(rateM("m.waterproof", "Гидроизоляция обмазочная, 15 кг", "ведро", 12000, "", "", 15, "гидроизоляц"),
		"Satu: Ceresit CL 51 5 кг — 11 016 ₸, CR 65 20 кг — 7 052 ₸, CR 166 комплект — 52 000 ₸; взята средняя цена эластичного состава за 15 кг"),

	// ── Потолки ──
	rateW("w.ceil.stretch_mat", "Натяжной потолок матовый (полотно и монтаж)", "м²", 2800, srcProff, urlProff, "натяжн"),
	rateW("w.ceil.stretch_satin", "Натяжной потолок сатиновый (полотно и монтаж)", "м²", 3650, srcProff, urlProff, "натяжн"),
	rateW("w.ceil.stretch_gloss", "Натяжной потолок глянцевый (полотно и монтаж)", "м²", 4100, srcProff, urlProff, "натяжн"),
	rateW("w.ceil.gkl", "Потолок из ГКЛ в один уровень", "м²", 1500, srcSilver, "", "потолок"),
	rateW("w.ceil.light", "Установка точечного светильника", "шт", 625, srcProff, urlProff, "светильник"),
	rateM("m.spot", "Светильник точечный LED Gauss Frameless, 6 Вт", "шт", 3244, srcSatu, "https://satu.kz/almaty/Diodnyj-vstraivaemyj-svetilnik-6w.html", 1, "светильник"),

	// ── Электрика ──
	rateW("w.el.chase", "Штробление бетона/кирпича под кабель (штроба до 25 мм)", "м.п.", 800, srcProff, urlProff, "штроб"),
	rateW("w.el.chase_fill", "Заделка штроб", "м.п.", 625, srcProff, urlProff, "штроб"),
	rateW("w.el.socket", "Установка розетки", "шт", 1150, srcProff, urlProff, "розетк"),
	rateW("w.el.switch", "Установка выключателя", "шт", 1650, srcProff, urlProff, "выключател"),
	rateW("w.el.box", "Монтаж распределительной коробки", "шт", 2850, srcProff, urlProff, "коробк"),
	rateW("w.el.panel", "Монтаж корпуса электрощита", "шт", 4400, srcProff, urlProff, "щит"),
	rateW("w.el.breaker", "Установка автомата в щит", "шт", 2200, srcProff, urlProff, "автомат"),
	rateW("w.el.rcd", "Установка УЗО / дифавтомата", "шт", 4000, srcProff, urlProff, "узо"),
	rateW("w.el.light", "Монтаж люстры / потолочного светильника", "шт", 3350, srcProff, urlProff, "люстр"),
	rateM("m.cable", "Кабель ВВГнг-LS 3×2,5", "м", 720, srcSatu, "https://satu.kz/Vvg.html", 1, "кабель"),
	rateEst(rateM("m.socket", "Розетка / выключатель с рамкой и подрозетником", "шт", 1800, "", "", 1, "розетк"),
		"Satu: механизм Schneider AtlasDesign 16 А — 1 050 ₸; рамка и подрозетник ≈750 ₸"),
	rateM("m.panel_kit", "Щит ЩРН-12 IEK, 8 автоматов ВА47-29 16 А и УЗО ВД1-63", "компл", 17045, srcSatu, "https://almaty.satu.kz/Shkaf-schrn-12.html", 1, "щит"),
	rateM("m.rcd", "Дифавтомат IEK АД12 2P 16 А 30 мА", "шт", 3846, srcSatu, "https://satu.kz/almaty/Difavtomat-16a-10ma.html", 1, "дифавтомат"),

	// ── Сантехника, отопление, вентиляция, газ ──
	rateW("w.pl.pipe", "Разводка водопровода (полипропилен)", "м.п.", 1450, srcProff, urlProff, "разводк"),
	rateW("w.pl.point", "Разводка водопровода за точку (замена труб)", "точка", 6550, srcProff, urlProff, "точк"),
	rateW("w.pl.riser", "Врезка в стояк", "шт", 3650, srcProff, urlProff, "стояк"),
	rateW("w.pl.toilet", "Установка унитаза «компакт»", "шт", 13000, srcProff, urlProff, "унитаз"),
	rateW("w.pl.install", "Монтаж инсталляции и подвесного унитаза", "компл", 47000, srcProff, urlProff, "инсталляц"),
	rateW("w.pl.sink", "Установка раковины с тумбой", "шт", 12000, srcProff, urlProff, "раковин"),
	rateW("w.pl.mixer", "Установка смесителя", "шт", 5600, srcProff, urlProff, "смесител"),
	rateW("w.pl.bath", "Установка акриловой ванны", "шт", 7200, srcProff, urlProff, "ванн"),
	rateW("w.pl.shower", "Сборка и установка душевой кабины с поддоном", "шт", 25000, srcSatu, "https://almaty.satu.kz/Ustanovka-dushevyh-kabin.html", "душев"),
	rateW("w.pl.boiler", "Монтаж водонагревателя", "шт", 16000, srcProff, urlProff, "водонагрев"),
	rateW("w.pl.towel", "Установка полотенцесушителя", "шт", 9650, srcProff, urlProff, "полотенцесуш"),
	rateW("w.pl.washer", "Подключение стиральной машины", "шт", 8000, srcProff, urlProff, "стиральн"),
	rateW("w.ht.radiator", "Монтаж и подключение радиатора", "шт", 6150, srcProff, urlProff, "радиатор"),
	rateW("w.ht.supply", "Подводка труб к радиатору", "шт", 18000, srcProff, urlProff, "радиатор"),
	rateM("m.toilet_eco", "Унитаз-компакт «Стандарт»", "шт", 37500, srcSatu, "https://satu.kz/almaty/Kompakt-unitaz.html", 1, "унитаз"),
	rateM("m.toilet", "Унитаз-компакт Santeri «Грация»", "шт", 42530, srcSatu, "https://satu.kz/almaty/Unitaz-napolnyj.html", 1, "унитаз"),
	rateM("m.toilet_prem", "Унитаз-компакт Santek «Анимо», сиденье дюропласт", "шт", 68460, srcSatu, "https://satu.kz/almaty/Unitaz-s-pryamym-vypuskom.html", 1, "унитаз"),
	rateM("m.radiator", "Радиатор биметаллический 500 мм, 10 секций", "шт", 28800, srcSatu, "https://satu.kz/Radiator-bez-pokrytiya.html", 1, "радиатор"),
	rateEst(rateM("m.ppr", "Труба PPR 20 мм с фитингами и креплением", "м", 650, "", "", 1, "труба"),
		"Satu: труба PPR PN20 Ø20 — 350 ₸/м; фитинги и крепёж ≈300 ₸ на метр трассы"),
	rateM("m.install_set", "Инсталляция Creavit с подвесным унитазом и кнопкой", "компл", 132000, srcSatu, "https://satu.kz/almaty/Installyatsiya-unitaz.html", 1, "инсталляц"),
	rateM("m.sink", "Тумба с раковиной «Енисей Классик» 60 см", "шт", 42990, srcSatu, "https://satu.kz/almaty/Tumba-rakovina-klassik.html", 1, "раковин"),
	rateM("m.mixer", "Смеситель для раковины однорычажный Aquadeus 80", "шт", 15800, srcSatu, "https://neptunsw.satu.kz/g2561991-smesiteli-dlya-rakoviny", 1, "смесител"),
	rateM("m.bath", "Ванна акриловая VentoSPa AQUA LA 170×70", "шт", 73800, srcSatu, "https://satu.kz/almaty/Vanna-akrilovaya-175h70.html", 1, "ванн"),
	rateM("m.shower", "Душевая кабина Erlit 90×90 с поддоном", "шт", 160000, srcSatu, "https://almaty.satu.kz/Zakrytye-dushevye-kabiny.html", 1, "душев"),
	rateM("m.boiler", "Водонагреватель Ariston PRO1 R ABS 80 л", "шт", 67500, srcSatu, "https://satu.kz/almaty/Ariston-80-litrov.html", 1, "водонагрев"),
	rateM("m.towel", "Полотенцесушитель водяной «Лира» 710×400, нержавеющая сталь", "шт", 28000, srcSatu, "https://satu.kz/almaty/Vodyanoj-polotentsesushitel-iz-nerzhaveyuschej-stali.html", 1, "полотенцесуш"),
	rateE("e.split", "Сплит-система 9000 BTU с установкой", "компл", 139900, srcOLX, "", "сплит"),
	rateEst(rateW("w.hvac.vent", "Установка вытяжного вентилятора / решётки", "шт", 4000, "", "", "вентилятор"),
		"Ставка электриков и сантехников по объявлениям Алматы"),
	rateEst(rateW("w.gas.pipe", "Монтаж внутреннего газопровода", "м.п.", 6000, "", "", "газопровод"),
		"Ориентир по объявлениям лицензированных газовых служб; точная цена — после техусловий и проекта"),
	rateEst(rateW("w.gas.connect", "Подключение газового прибора (плита, котёл)", "шт", 25000, "", "", "газ"),
		"Ориентир по объявлениям лицензированных газовых служб"),
	rateEst(rateW("w.gas.project", "Проект газоснабжения частного дома", "компл", 150000, "", "", "проект"),
		"Ориентир по предложениям проектных организаций Алматы"),

	rateEst(rateW("w.ceil.paint", "Окраска потолка в 2 слоя", "м²", 1400, "", "", "окраск потол"),
		"Окраска стен 1 250 ₸/м² по прайсу «Профф-Ремонт» плюс надбавка за работу над головой"),
	rateEst(rateW("w.el.cable", "Прокладка кабеля в штробе / гофре", "м", 300, "", "", "прокладк кабел"),
		"Ставка электриков по объявлениям Алматы 200–400 ₸/м"),
	rateEst(rateM("m.fire.cable", "Кабель КПСнг(А)-FRLS 1×2×0,75", "м", 250, "", "", 1, "кпс"),
		"Розничная цена огнестойкого кабеля для пожарной сигнализации"),
	rateEst(rateW("w.roof.insul", "Утепление кровли минватой с пароизоляцией", "м²", 1500, "", "", "утеплен кровл"),
		"Ставка кровельщиков по объявлениям Алматы 1–2 тыс. ₸/м²"),
	rateEst(rateM("m.gutter", "Водосточная система: желоб, трубы, крепления", "м.п.", 4500, "", "", 1, "водосток"),
		"Средняя цена металлической водосточной системы в пересчёте на метр карниза"),
	rateM("m.mesh", "Сетка фасадная 160 г/м² (рулон 50 м² — 12 000 ₸)", "м²", 240, srcSatu, "https://satu.kz/Setka-fasadnaya-160.html", 1, "сетк"),
	rateM("m.dowel", "Дюбель тарельчатый 10×160 с металлическим гвоздём", "шт", 75, srcSatu, "https://satu.kz/Dyubel-gvozd.html", 1, "дюбел"),
	rateM("m.door_entrance", "Дверь входная металлическая «Титан 120»", "шт", 159990, srcSatu, "https://satu.kz/almaty/Vhodnye-stalnye-dveri.html", 1, "двер входн"),

	// ── Окна и двери ──
	rateW("w.win.pvc", "Окно ПВХ 1,3×1,3 м с монтажом", "шт", 110000, srcProff, urlProff, "окно"),
	rateW("w.win.pvc_prem", "Окно ПВХ 1,3×1,3 м, премиум-профиль, с монтажом", "шт", 120000, srcProff, urlProff, "окно"),
	rateW("w.win.sill", "Подоконник с установкой", "шт", 6200, srcProff, urlProff, "подоконник"),
	rateW("w.win.drip", "Отлив с установкой", "шт", 1300, srcProff, urlProff, "отлив"),
	rateW("w.win.slopes", "Откосы из сэндвич-панели", "шт", 2450, srcProff, urlProff, "откос"),
	rateW("w.door.entrance", "Монтаж входной двери", "шт", 22000, srcProff, urlProff, "двер"),
	rateW("w.door.interior", "Монтаж межкомнатной двери с коробкой и наличниками", "шт", 15000, srcKaspi, "https://obyavleniya.kaspi.kz/a/esik-ornatu-111235176", "двер"),
	rateM("m.door_interior", "Дверь межкомнатная NEAPOL, экошпон, с коробкой и наличниками", "компл", 49900, srcSatu, "https://satu.kz/almaty/Horoshie-mezhkomnatnye-dveri.html", 1, "двер"),

	// ── Общестрой ──
	rateM("m.concrete", "Бетон товарный М300 (В22,5)", "м³", 28000, srcSatu, "https://satu.kz/Beton-v300.html", 1, "бетон"),
	rateM("m.rebar", "Арматура А500С Ø12", "т", 350000, srcOLX, "https://www.olx.kz/talgar/q-арматура/", 1, "арматур"),
	rateM("m.aerated", "Газоблок автоклавный D500", "м³", 34500, srcSatu, "https://satu.kz/Gazoblok-100.html", 1, "газоблок"),
	rateM("m.aerated_glue", "Клей для газоблока STRONG, 25 кг", "мешок", 2050, srcSatu, "https://satu.kz/almaty/Kladka-penoblokov.html", 25, "клей"),
	rateW("w.mas.aerated", "Кладка стен из газоблока на клей", "м³", 15000, srcKaspi, "", "кладк"),
	rateW("w.mas.partition", "Кладка перегородок из газобетона до 100 мм", "м²", 4450, srcProff, urlProff, "перегородк"),
	rateW("w.found.strip", "Ленточный фундамент: опалубка, армирование, бетонирование", "м³", 30000, srcKaspi, urlKaspiFound, "фундамент"),
	rateW("w.conc.monolith", "Монолитная плита: опалубка, армирование, бетонирование", "м³", 30000, srcKaspi, urlKaspiFound, "монолит"),
	rateEst(rateM("m.formwork", "Пиломатериал на опалубку (3 оборота)", "м²", 1800, "", "", 1, "опалубк"),
		"Доска и фанера на 1 м² щита опалубки с учётом трёх оборотов"),
	rateM("m.crushed", "Щебень 20–40 с доставкой по Алматы", "м³", 6200, srcSatu, "https://satu.kz/almaty/Scheben-fraktsii-20-40.html", 1, "щебень"),

	// ── Земляные работы ──
	rateE("e.miniexc", "Мини-экскаватор с оператором", "маш.-ч", 15000, srcSatu, "https://satu.kz/Kotlovany.html", "экскаватор"),
	rateEst(rateW("w.earth.manual", "Разработка грунта вручную", "м³", 6000, "", "", "грунт"),
		"Смена землекопа 15–18 тыс. ₸ при выработке 2,5–3 м³ по объявлениям Алматы"),
	rateEst(rateW("w.earth.haul", "Вывоз грунта самосвалом", "м³", 2500, "", "", "вывоз грунт"),
		"Рейс КАМАЗа ≈25 000 ₸ на 10 м³ разрыхлённого грунта"),
	rateEst(rateW("w.earth.backfill", "Обратная засыпка с уплотнением", "м³", 2000, "", "", "засыпк"),
		"Мини-экскаватор и виброплита по ставке техники"),

	// ── Кровля, фасад, утепление ──
	rateW("w.roof.metal", "Монтаж металлочерепицы", "м²", 2900, srcRekrovli, urlRekrovli, "металлочерепиц"),
	rateW("w.roof.replace", "Замена кровли: демонтаж старого покрытия и монтаж нового", "м²", 4100, srcRekrovli, urlRekrovli, "кровл"),
	rateW("w.roof.gutter", "Монтаж водосточной системы", "м.п.", 1600, srcRekrovli, urlRekrovli, "водосток"),
	rateEst(rateW("w.roof.rafters", "Стропильная система и обрешётка", "м²", 3500, "", "", "стропил"),
		"Ставка кровельных бригад по объявлениям Алматы 3–4 тыс. ₸/м²"),
	rateM("m.metal_tile_eco", "Металлочерепица «Венеция»", "м²", 2200, srcSatu, urlSatuRoof, 1, "металлочерепиц"),
	rateM("m.metal_tile", "Металлочерепица «СуперМонтеррей», матовая 0,45 мм", "м²", 2600, srcSatu, urlSatuRoof, 1, "металлочерепиц"),
	rateM("m.metal_tile_prem", "Металлочерепица «СуперМонтеррей», матовая, Россия", "м²", 3400, srcSatu, urlSatuRoof, 1, "металлочерепиц"),
	rateM("m.roof_insul", "Минплита MakWool П80, 100 мм (35 800 ₸/м³)", "м²", 3580, srcSatu, "https://satu.kz/semey/Minplit.html", 1, "утеплител"),
	rateM("m.membrane", "Мембрана ветро-влагозащитная Изоспан А (рулон 70 м² — 19 950 ₸)", "м²", 285, srcSatu, "https://satu.kz/almaty/Vetrozaschitnaya-membrana.html", 1, "мембран"),
	rateM("m.timber", "Доска обрезная хвойная 1–2 сорта", "м³", 165000, srcSatu, "https://satu.kz/almaty/Doski-obreznye-hvojnyh-porod.html", 1, "пиломатериал"),
	rateEst(rateW("w.fac.scaffold", "Аренда и монтаж строительных лесов", "м²", 900, "", "", "леса"),
		"Аренда лесов на месяц с монтажом в пересчёте на м² фасада"),
	rateEst(rateW("w.fac.plaster", "Штукатурка фасада по сетке", "м²", 2500, "", "", "штукатурк"),
		"Объявления Kaspi «штукатурка фасада», Алматы: 2 000–4 000 ₸/м², чаще всего 2 500"),
	rateEst(rateW("w.fac.decor", "Декоративная штукатурка фасада «короед»", "м²", 3500, "", "", "декоратив"),
		"Объявления Kaspi, Алматы: «короед» от 2 500 ₸/м², с грунтованием и откосами 3–4 тыс. ₸/м²"),
	rateEst(rateW("w.fac.paint", "Окраска фасада в 2 слоя", "м²", 1500, "", "", "окраск"),
		"Окраска стен по прайсу «Профф-Ремонт» 1 250 ₸/м² плюс работа на высоте"),
	rateW("w.fac.insul", "Утепление фасада: клей, плита, дюбели, армирующий слой", "м²", 5000, srcSatu, "https://satu.kz/almaty/Uteplenie-sten-fasadov-minvatoj.html", "утеплен"),
	rateM("m.facade_wool", "Минплита фасадная IZOTERM П100, 100 мм (38 900 ₸/м³)", "м²", 3890, srcSatu, "https://satu.kz/semey/Minplit.html", 1, "минплит"),
	rateM("m.facade_glue", "Клей для минплиты и армирующий состав Ceresit CT 190, 25 кг", "мешок", 4588, srcSatu, "https://satu.kz/almaty/Smesi-suhie-kleevye.html", 25, "клей"),
	rateEst(rateM("m.facade_plaster", "Штукатурка цементная фасадная, 25 кг", "мешок", 2200, "", "", 25, "штукатурк"),
		"Средняя цена цементной штукатурки 25 кг в Алматы"),
	rateM("m.decor_plaster", "Декоративная штукатурка «короед» Ceresit CT 35, 25 кг", "мешок", 6400, srcSatu, "https://satu.kz/almaty/Koroed-25-kg.html", 25, "декоратив"),
	rateM("m.facade_paint", "Краска фасадная, 25 кг", "ведро", 18000, srcSatu, "", 25, "краск"),

	// ── Благоустройство, дороги, металл, дерево ──
	rateW("w.land.paving", "Укладка брусчатки на подготовленное основание", "м²", 2500, srcKaspi, "https://obyavleniya.kaspi.kz/a/ukladka-bruschatki-122343348", "брусчатк"),
	rateM("m.paving", "Брусчатка вибропрессованная 6 см", "м²", 2500, srcOLX, "", 1, "брусчатк"),
	rateW("w.land.curb", "Установка тротуарного бордюра на бетон", "м.п.", 2300, srcSatu, "https://satu.kz/almaty/Ukladka-bordyurov.html", "бордюр"),
	rateEst(rateM("m.curb", "Бордюр тротуарный 1000×200×80", "шт", 1800, "", "", 1, "бордюр"),
		"Средняя цена у производителей Алматинской области"),
	rateW("w.road.asphalt", "Асфальтирование (материал и укладка)", "м²", 6000, srcKaspi, "", "асфальт"),
	rateW("w.metal.canopy", "Металлический навес / каркас: изготовление и монтаж", "м²", 23000, srcKaspi, "", "навес"),
	rateEst(rateW("w.wood.floor", "Деревянный настил по лагам", "м²", 3500, "", "", "настил"),
		"Ставка плотников по объявлениям Алматы 3–4 тыс. ₸/м²"),

	// ── Наружные сети ──
	rateEst(rateW("w.net.pipe_lay", "Укладка напорной трубы ПНД в траншею", "м.п.", 1500, "", "", "труб"),
		"Ставка бригад по объявлениям, без земляных работ"),
	rateEst(rateM("m.pnd", "Труба ПНД 32 мм для воды", "м", 600, "", "", 1, "труба"),
		"Розничная цена трубы ПЭ100 SDR11 Ø32"),

	// ── Слаботочные системы, пожарная безопасность ──
	rateW("w.fire.sensor", "Установка датчика сигнализации", "шт", 1600, srcProff, urlProff, "датчик"),
	rateEst(rateM("m.fire.sensor", "Извещатель пожарный дымовой", "шт", 3500, "", "", 1, "извещател"),
		"Средняя цена дымового извещателя ИП 212"),
	rateEst(rateM("m.fire.panel", "Прибор приёмно-контрольный с аккумулятором", "шт", 60000, "", "", 1, "прибор"),
		"Средняя цена прибора на 4–8 шлейфов"),
	rateEst(rateW("w.cctv.camera", "Монтаж IP-камеры с прокладкой кабеля", "шт", 10000, "", "", "камер"),
		"Объявления Kaspi, Алматы: установка камеры 5 000–12 000 ₸; с прокладкой кабеля — верхняя половина диапазона"),
	rateEst(rateM("m.cctv.camera", "IP-камера 4 Мп", "шт", 25000, "", "", 1, "камер"),
		"Средняя цена IP-камеры начального уровня"),
	rateEst(rateM("m.cctv.nvr", "Видеорегистратор с диском 1 ТБ", "шт", 55000, "", "", 1, "регистратор"),
		"Satu: 8-канальный Hikvision DS-7108NI-Q1/M — 39 500–52 750 ₸ без диска, DS-E08NI-Q1 с SSD 1 ТБ — 58 500 ₸"),

	// ── Проектирование и прочее ──
	rateW("w.design.flat", "Дизайн-проект интерьера квартиры", "м²", 2650, srcProff, urlProff, "дизайн"),
	rateW("w.design.house", "Дизайн-проект интерьера дома", "м²", 3400, srcProff, urlProff, "дизайн"),
	rateW("w.design.render", "3D-визуализация интерьера", "м²", 2550, srcProff, urlProff, "визуализац"),
	rateW("w.geodesy", "Выезд геодезиста, разбивка осей", "выезд", 55000, srcBizmedia, urlBizmedia, "геодез"),
	rateEst(rateW("w.labor.shift", "Разнорабочий", "смена", 15000, "", "", "разнорабоч"),
		"Ставка разнорабочего по объявлениям Алматы 12–18 тыс. ₸ за смену"),
	rateEst(rateW("w.stairs.tile", "Облицовка ступени керамогранитом", "ступень", 9000, "", "", "ступен"),
		"Укладка 4 650 ₸/м² по прайсу «Профф-Ремонт» с подрезкой и запилом ≈1 м² на ступень"),
	rateEst(rateW("w.furn.assembly", "Сборка и установка корпусной мебели", "ед", 8000, "", "", "мебел"),
		"Ставка сборщиков мебели по объявлениям Алматы"),
	rateEst(rateM("m.kitchen", "Кухонный гарнитур на заказ (ЛДСП/МДФ)", "м.п.", 180000, "", "", 1, "кухн"),
		"Средняя цена погонного метра у мебельных цехов Алматы"),
}

// Уровни для сценариев «Эконом / Стандарт / Премиум»: разные реальные позиции справочника.
var smetaTiers = map[string][3]string{
	"m.paint":        {"m.paint_eco", "m.paint_std", "m.paint_prem"},
	"m.putty_fin":    {"m.putty", "m.putty", "m.putty_prem"},
	"m.laminate":     {"m.laminate_eco", "m.laminate_std", "m.laminate_prem"},
	"w.laminate":     {"w.floor.laminate", "w.floor.laminate", "w.floor.laminate_herring"},
	"m.tile":         {"m.porcelain", "m.porcelain_std", "m.porcelain_prem"},
	"w.ceil.stretch": {"w.ceil.stretch_mat", "w.ceil.stretch_satin", "w.ceil.stretch_gloss"},
	"w.win":          {"w.win.pvc", "w.win.pvc", "w.win.pvc_prem"},
	"m.toilet":       {"m.toilet_eco", "m.toilet", "m.toilet_prem"},
	"m.roof_cover":   {"m.metal_tile_eco", "m.metal_tile", "m.metal_tile_prem"},
	"w.wallpaper":    {"w.wall.wallpaper", "w.wall.wallpaper", "w.wall.wallpaper_vinyl"},
}

var smetaRates = func() map[string]SmetaRate {
	out := make(map[string]SmetaRate, len(smetaRateList))
	for _, r := range smetaRateList {
		out[r.Key] = r
	}
	return out
}()

// Диапазоны предложений, из которых взята середина (показываются в смете рядом с ценой).
var smetaRangeNotes = map[string]string{
	"m.rotband":        "Предложения Satu 2 700–3 600 ₸ за мешок (ноябрь 2026)",
	"m.cable":          "Предложения Satu 620–735 ₸/м (ноябрь 2026)",
	"m.concrete":       "Предложения Satu 17 000–56 150 ₸/м³, медиана 26 850 (ноябрь 2026)",
	"m.rebar":          "OLX Талгар 325 000 ₸/т, Satu 380 000 ₸/т (октябрь–ноябрь 2026)",
	"m.aerated":        "Среднее двух предложений D500: Kaspi 28 000 и Satu 41 000 ₸/м³",
	"m.toilet":         "Satu, Алматы: унитазы-компакт 37 500–68 460 ₸ (ноябрь 2026)",
	"m.cement":         "Объявления OLX, Алматы: 2 250–2 400 ₸ за мешок М450–М500",
	"m.paving":         "Объявления OLX 2 099–2 800 ₸/м²",
	"w.land.paving":    "Объявления Kaspi 2 000–3 000 ₸/м²",
	"w.road.asphalt":   "Объявления Kaspi 4 000–8 000 ₸/м²",
	"w.metal.canopy":   "Объявления Kaspi 20 000–26 000 ₸/м², с материалом",
	"w.geodesy":        "Bizmedia/OLX: 30 000–80 000 ₸ за выезд",
	"e.split":          "OLX: кондиционер с установкой от 139 900 ₸",
	"w.mas.aerated":    "Объявления Kaspi «кладка газоблока», Алматы",
	"w.floor.tile":     "Kaspi, плиточник в Алматы: пол от 7 000 ₸/м²; диапазон объявлений 5 000–12 000",
	"w.wall.tile":      "Kaspi, плиточник в Алматы: стены от 8 000 ₸/м²",
	"m.radiator":       "Satu: 500 мм, 10 секций — 22 392 и 35 209 ₸, взято среднее",
	"m.paint_eco":      "Satu, Алматы: от 5 500 ₸ (ноябрь 2026)",
	"w.dem.tile_floor": "Kaspi, плиточник в Алматы: демонтаж плитки от 1 200 ₸/м²; у «Профф-Ремонт» демонтаж полов в целом — 1 800 ₸/м²",
	"m.porcelain":      "Satu, Алматы: 25 предложений 60×60 — 2 800–7 990 ₸/м², медиана 2 800 (ноябрь 2026)",
	"m.porcelain_std":  "Satu, Алматы: 60×60 под мрамор и белый — 3 850–4 200 ₸/м²; диапазон страницы 2 800–7 990",
	"m.dowel":          "Satu: дюбели 10×160 — 20–75 ₸; для минваты нужен металлический гвоздь (FIX PLAST — 75 ₸)",
	"w.door.interior":  "Kaspi, Алматы: установка межкомнатной двери 10 000–20 000 ₸, чаще 15 000",
	"w.dem.door":       "Прайс «Профф-Ремонт»: снятие деревянной дверной конструкции — 6 950 ₸, металлической — 14 000 ₸",
	"m.wallpaper":      "Satu: флизелиновые обои 1,06×10 м — 3 900–16 700 ₸ за рулон, коллекции премиум — до 34 000",
	"w.pl.shower":      "Satu и Kaspi, Алматы: установка душевой кабины 18 000–30 000 ₸; у «Профф-Ремонт» — 68 000 ₸",
	"w.fac.insul":      "Satu и Kaspi, Алматы: утепление стен минплитой с армирующим слоем 3 500–5 000 ₸/м², от 5 000 у компаний",
	"w.land.curb":      "Satu, Алматы: установка бордюра 1 200–3 000 ₸/м.п., медиана предложений 2 300",
	"w.dem.trash":      "Kaspi, Алматы: вывоз мусора 10 000–25 000 ₸ за рейс; взята верхняя граница — с погрузкой",
	"w.found.strip":    "Kaspi, Алматы: работа бригады 30 000 ₸/м³; бетон, арматура и опалубка посчитаны отдельными строками",
	"w.conc.monolith":  "Kaspi, Алматы: работа бригады 30 000 ₸/м³; бетон, арматура и опалубка посчитаны отдельными строками",
	"m.laminate_std":   "Satu, Алматы: ламинат 33 класса 8 мм — 3 024–6 888 ₸/м² (ноябрь 2026)",
	"m.laminate_prem":  "Satu, Алматы: ламинат «ёлочка» 33 класса — 6 400–7 150 ₸/м²",
	"m.panel_kit":      "Сумма цен Satu: щит ЩРН-12 — 5 610 ₸, 8 автоматов ВА47-29 1P 16 А по 808 ₸, УЗО ВД1-63 2P 16 А — 4 971 ₸",
	"m.crushed":        "Satu, Алматы: 2 800–3 000 ₸/м³ на карьере; с доставкой по Алматы и области — 6 200 ₸/м³",
	"m.membrane":       "Satu: Изоспан А, рулон 70 м² — 19 950 ₸ (285 ₸/м²)",
	"m.mesh":           "Satu: сетка 160 г/м², рулон 50 м² — 12 000 ₸ (240 ₸/м²)",
	"m.underlay":       "Satu: подложка Solid 3 мм, упаковка 8,4 м² — 2 144 ₸ (255 ₸/м²)",
	"w.el.chase":       "Прайс «Профф-Ремонт»: штроба до 25 мм — 800 ₸/м.п., 25–60 мм — 1 750; под кабель ВВГ 3×2,5 хватает 20–25 мм",
}

func init() {
	for k, n := range smetaRangeNotes {
		if r, ok := smetaRates[k]; ok && r.Note == "" {
			r.Note = n
			smetaRates[k] = r
		}
	}
}

// Запросы для сверки с базой QazGost (слова — начала слов в названии позиции базы).
// Позиции без надёжного аналога в базе не сверяются.
var smetaDBQuery = map[string]string{
	"w.dem.plaster": "демонтаж штукатурки", "w.dem.tile_wall": "демонтаж плитки стен", "w.dem.floor": "демонтаж напольного покрытия",
	"w.dem.screed": "демонтаж стяжки", "w.dem.wallpaper": "снятие обоев", "w.dem.wall_half_brick": "демонтаж перегородки", "w.dem.door": "демонтаж двери",
	"w.wall.primer": "грунтовка глубокого", "w.wall.plaster": "штукатурка стен гипсовая", "w.wall.putty": "шпатлевка финишная",
	"w.wall.paint": "покраска стен 2 слоя", "w.wall.wallpaper": "поклейка флизелиновых обоев", "w.wall.wallpaper_vinyl": "поклейка виниловых обоев",
	"w.wall.tile": "укладка настенной плитки", "w.floor.screed": "полусухая стяжка", "w.floor.laminate": "укладка ламината",
	"w.floor.tile": "укладка напольной плитки", "w.floor.skirting": "плинтуса пвх", "w.floor.waterproof": "гидроизоляция пола",
	"w.floor.self_level": "наливной пол", "w.ceil.stretch_mat": "натяжной потолок матовый", "w.ceil.stretch_satin": "натяжной потолок сатиновый",
	"w.ceil.stretch_gloss": "натяжной потолок глянцевый", "w.ceil.gkl": "потолок из гкл", "w.ceil.light": "установка точечного светильника",
	"w.ceil.paint": "покраска потолка 2 слоя", "w.el.chase": "штробление", "w.el.socket": "установка розетки", "w.el.switch": "установка выключателя",
	"w.el.box": "распределительной коробки", "w.el.breaker": "установка автомата", "w.el.rcd": "установка узо", "w.el.light": "установка люстры",
	"w.pl.toilet": "установка унитаза", "w.pl.install": "подвесного унитаза инсталляция", "w.pl.sink": "установка раковины",
	"w.pl.mixer": "установка смесителя", "w.pl.bath": "установка акриловой ванны", "w.pl.shower": "установка душевой кабины",
	"w.pl.boiler": "установка водонагревателя", "w.pl.towel": "установка полотенцесушителя", "w.pl.washer": "подключение стиральной",
	"w.ht.radiator": "установка биметалл радиатора", "w.door.interior": "установка межкомнатной двери", "w.door.entrance": "установка входной двери",
	"w.roof.metal": "монтаж металлочерепицы", "w.roof.gutter": "монтаж водосточн", "w.roof.rafters": "монтаж стропильной системы",
	"w.fac.decor": "короед", "w.fac.paint": "покраска фасада 2 слоя", "w.fac.insul": "утепление фасада", "w.land.paving": "укладка брусчатки",
	"w.land.curb": "установка бордюра", "w.fire.sensor": "установка датчика", "w.cctv.camera": "монтаж ip камеры", "w.design.flat": "дизайн проект",
	"w.design.house": "дизайн проект", "w.earth.manual": "разработка грунта вручную", "w.earth.backfill": "обратная засыпка",
	"m.rotband": "ротбанд", "m.primer": "грунтовка", "m.putty": "шпатлевка гипсовая", "m.putty_prem": "шпатлевка финишная",
	"m.paint_eco": "краска акриловая", "m.paint_std": "краска акриловая", "m.paint_prem": "краска акриловая", "m.wallpaper": "обои флизелин", "m.gkl": "гкл",
	"m.tile_glue": "клей плиточный", "m.cement": "цемент", "m.sand": "песок", "m.laminate_eco": "ламинат", "m.laminate_std": "ламинат 33",
	"m.laminate_prem": "ламинат 33", "m.underlay": "подложка", "m.porcelain": "керамогранит 60", "m.porcelain_std": "керамогранит 60", "m.porcelain_prem": "керамогранит 60",
	"m.waterproof": "гидроизоляция", "m.spot": "светильник точечный", "m.cable": "кабель ввгнг", "m.socket": "розетка", "m.rcd": "дифавтомат",
	"m.toilet_eco": "унитаз компакт", "m.toilet": "унитаз компакт", "m.toilet_prem": "унитаз компакт", "m.radiator": "радиатор биметалл",
	"m.mixer": "смеситель для раковины", "m.bath": "ванна акрил", "m.shower": "душевая кабина", "m.boiler": "водонагреватель",
	"m.towel": "полотенцесушитель водяной", "m.door_entrance": "дверь входная", "m.concrete": "бетон м300", "m.aerated": "газоблок",
	"m.aerated_glue": "клей газоблок", "m.formwork": "опалубка", "m.crushed": "щебень", "m.metal_tile_eco": "металлочерепица",
	"m.metal_tile": "металлочерепица", "m.metal_tile_prem": "металлочерепица", "m.membrane": "мембрана", "m.facade_glue": "клей утеплителя",
	"m.facade_plaster": "штукатурка цементная", "m.decor_plaster": "короед", "m.facade_paint": "краска фасадная", "m.curb": "бордюр",
	"m.fire.sensor": "извещатель дымовой", "m.cctv.camera": "ip камера", "m.cctv.nvr": "видеорегистратор", "m.install_set": "инсталляция",
	"m.dowel": "дюбель тарельчатый",
}

func init() {
	for k, r := range smetaRates {
		r.DBQuery = smetaDBQuery[k]
		smetaRates[k] = r
	}
}
