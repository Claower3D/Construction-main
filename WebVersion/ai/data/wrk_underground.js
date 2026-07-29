// === ПОДЗЕМНЫЕ КОММУНИКАЦИИ — колодцы, коллекторы, кабельные каналы, микротоннели (50 поз.) ===
(function () {
    window.AI_WRK_UNDERGROUND = {
        // === КОЛОДЦЫ === 1-10
        'wrk_ug_well_rc_1000': { name: 'Колодец ж/б Ø1000', unit: 'шт', price: 25000, category: 'underground' },
        'wrk_ug_well_rc_1500': { name: 'Колодец ж/б Ø1500', unit: 'шт', price: 35000, category: 'underground' },
        'wrk_ug_well_rc_2000': { name: 'Колодец ж/б Ø2000', unit: 'шт', price: 55000, category: 'underground' },
        'wrk_ug_well_pp_400': { name: 'Колодец ПП Ø400', unit: 'шт', price: 8500, category: 'underground' },
        'wrk_ug_well_pp_600': { name: 'Колодец ПП Ø600', unit: 'шт', price: 12000, category: 'underground' },
        'wrk_ug_well_pp_1000': { name: 'Колодец ПП Ø1000', unit: 'шт', price: 25000, category: 'underground' },
        'wrk_ug_well_telecom': { name: 'Колодец связи ККС-2', unit: 'шт', price: 25000, category: 'underground' },
        'wrk_ug_well_telecom_lg': { name: 'Колодец связи ККС-5', unit: 'шт', price: 55000, category: 'underground' },
        'wrk_ug_hatch_lg': { name: 'Люк чугунный (тяжёлый Д400)', unit: 'шт', price: 5500, category: 'underground' },
        'wrk_ug_hatch_sm': { name: 'Люк пластиковый (газон)', unit: 'шт', price: 1500, category: 'underground' },
        // === ТРУБОПРОВОДЫ НАРУЖНЫЕ === 11-20
        'wrk_ug_pipe_pnd_110': { name: 'Труба ПНД Ø110 (канализ.)', unit: 'м.п.', price: 350, category: 'underground' },
        'wrk_ug_pipe_pnd_160': { name: 'Труба ПНД Ø160', unit: 'м.п.', price: 550, category: 'underground' },
        'wrk_ug_pipe_pnd_225': { name: 'Труба ПНД Ø225', unit: 'м.п.', price: 850, category: 'underground' },
        'wrk_ug_pipe_pnd_315': { name: 'Труба ПНД Ø315', unit: 'м.п.', price: 1200, category: 'underground' },
        'wrk_ug_pipe_rc_300': { name: 'Труба ж/б Ø300', unit: 'м.п.', price: 1500, category: 'underground' },
        'wrk_ug_pipe_rc_500': { name: 'Труба ж/б Ø500', unit: 'м.п.', price: 2500, category: 'underground' },
        'wrk_ug_pipe_rc_1000': { name: 'Труба ж/б Ø1000', unit: 'м.п.', price: 5500, category: 'underground' },
        'wrk_ug_pipe_steel_100': { name: 'Труба стальная Ø100 (ГНБ)', unit: 'м.п.', price: 1200, category: 'underground' },
        'wrk_ug_pipe_steel_200': { name: 'Труба стальная Ø200 (футляр)', unit: 'м.п.', price: 2500, category: 'underground' },
        'wrk_ug_trench_1m': { name: 'Траншея (h до 1м)', unit: 'м.п.', price: 550, category: 'underground' },
        // === ГНБ (ГОРИЗОНТАЛЬНОЕ БУРЕНИЕ) === 21-26
        'wrk_ug_hdd_63': { name: 'ГНБ Ø63 (до 50м)', unit: 'м.п.', price: 1500, category: 'underground' },
        'wrk_ug_hdd_110': { name: 'ГНБ Ø110', unit: 'м.п.', price: 2500, category: 'underground' },
        'wrk_ug_hdd_160': { name: 'ГНБ Ø160', unit: 'м.п.', price: 3500, category: 'underground' },
        'wrk_ug_hdd_225': { name: 'ГНБ Ø225', unit: 'м.п.', price: 5500, category: 'underground' },
        'wrk_ug_hdd_315': { name: 'ГНБ Ø315', unit: 'м.п.', price: 8500, category: 'underground' },
        'wrk_ug_hdd_500': { name: 'ГНБ Ø500', unit: 'м.п.', price: 15000, category: 'underground' },
        // === КАБЕЛЬНЫЕ КАНАЛЫ === 27-34
        'wrk_ug_duct_pnd_50': { name: 'Каналозация ПНД Ø50', unit: 'м.п.', price: 55, category: 'underground' },
        'wrk_ug_duct_pnd_110': { name: 'Каналозация ПНД Ø110', unit: 'м.п.', price: 120, category: 'underground' },
        'wrk_ug_duct_pnd_160': { name: 'Каналозация ПНД Ø160', unit: 'м.п.', price: 180, category: 'underground' },
        'wrk_ug_duct_micro_3x14': { name: 'Микротрубки 3×14мм', unit: 'м.п.', price: 55, category: 'underground' },
        'wrk_ug_duct_micro_7x14': { name: 'Микротрубки 7×14мм', unit: 'м.п.', price: 85, category: 'underground' },
        'wrk_ug_cable_trough': { name: 'Лоток кабельный (бетонный)', unit: 'м.п.', price: 1500, category: 'underground' },
        'wrk_ug_sand_bed': { name: 'Песчаная подушка', unit: 'м.п.', price: 55, category: 'underground' },
        // === КОЛЛЕКТОРЫ === 35-40
        'wrk_ug_collector_rc': { name: 'Коллектор ж/б (проходной)', unit: 'м.п.', price: 85000, category: 'underground' },
        'wrk_ug_collector_cut': { name: 'Коллектор щитовая проходка', unit: 'м.п.', price: 120000, category: 'underground' },
        'wrk_ug_collector_micro': { name: 'Микротоннель (продавливание)', unit: 'м.п.', price: 55000, category: 'underground' },
        'wrk_ug_collector_ventil': { name: 'Вентиляция коллектора', unit: 'компл.', price: 250000, category: 'underground' },
        'wrk_ug_collector_pump': { name: 'КНС (канализац. станция)', unit: 'компл.', price: 550000, category: 'underground' },
        'wrk_ug_collector_entry': { name: 'Входная камера коллектора', unit: 'шт', price: 250000, category: 'underground' },
        // === ДОПЫ === 41-50
        'wrk_ug_bedding_sand': { name: 'Подсыпка песком (обратная засыпка)', unit: 'м³', price: 550, category: 'underground' },
        'wrk_ug_shoring_trench': { name: 'Крепление стенки траншеи', unit: 'м²', price: 550, category: 'underground' },
        'wrk_ug_dewatering': { name: 'Водоотлив (траншея)', unit: 'маш-ч', price: 550, category: 'underground' },
        'wrk_ug_potholing': { name: 'Шурфование (поиск комм.)', unit: 'шурф', price: 5500, category: 'underground' },
        'wrk_ug_detector_pipe': { name: 'Трассоискатель (поиск труб)', unit: 'смена', price: 8500, category: 'underground' },
        'wrk_ug_cctv_inspect': { name: 'Телеинспекция (CCTV-камера)', unit: 'м.п.', price: 120, category: 'underground' },
        'wrk_ug_relining': { name: 'Санация трубы (рукав)', unit: 'м.п.', price: 5500, category: 'underground' },
        'wrk_ug_commissioning': { name: 'Испытание сети (давление/пролив)', unit: 'участок', price: 8500, category: 'underground' }
    };
})();
