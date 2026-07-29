// === СТАЛЬНЫЕ КОНСТРУКЦИИ И МЕТАЛЛООБРАБОТКА (200 поз.) ===
(function () {
    window.AI_WRK_STEELWORKS = {
        // === МОНТАЖ МЕТАЛЛОКОНСТРУКЦИЙ ===
        'wrk_sw_column_install_light': { name: 'Монтаж стальных колонн до 1т', unit: 'т', price: 35000, category: 'steelworks' },
        'wrk_sw_column_install_medium': { name: 'Монтаж стальных колонн 1-5т', unit: 'т', price: 28000, category: 'steelworks' },
        'wrk_sw_column_install_heavy': { name: 'Монтаж стальных колонн более 5т', unit: 'т', price: 22000, category: 'steelworks' },
        'wrk_sw_beam_install_light': { name: 'Монтаж балок перекрытия до 1т', unit: 'т', price: 32000, category: 'steelworks' },
        'wrk_sw_beam_install_medium': { name: 'Монтаж балок перекрытия 1-3т', unit: 'т', price: 26000, category: 'steelworks' },
        'wrk_sw_beam_install_heavy': { name: 'Монтаж балок перекрытия более 3т', unit: 'т', price: 20000, category: 'steelworks' },
        'wrk_sw_truss_install_light': { name: 'Монтаж стальных ферм до 3т', unit: 'т', price: 35000, category: 'steelworks' },
        'wrk_sw_truss_install_heavy': { name: 'Монтаж стальных ферм более 3т', unit: 'т', price: 28000, category: 'steelworks' },
        'wrk_sw_crane_beam': { name: 'Монтаж подкрановых балок', unit: 'т', price: 30000, category: 'steelworks' },
        'wrk_sw_crane_rail': { name: 'Монтаж подкранового рельса', unit: 'м.п.', price: 3500, category: 'steelworks' },
        'wrk_sw_platform_install': { name: 'Монтаж площадок обслуживания', unit: 'т', price: 45000, category: 'steelworks' },
        'wrk_sw_stairs_install': { name: 'Монтаж стальных лестниц', unit: 'т', price: 50000, category: 'steelworks' },
        'wrk_sw_railing_install': { name: 'Монтаж ограждений/перил', unit: 'м.п.', price: 2500, category: 'steelworks' },
        // === СВАРОЧНЫЕ РАБОТЫ ===
        'wrk_sw_weld_butt_6mm': { name: 'Сварка стыковая до 6мм', unit: 'м.п.', price: 850, category: 'steelworks' },
        'wrk_sw_weld_butt_12mm': { name: 'Сварка стыковая до 12мм', unit: 'м.п.', price: 1500, category: 'steelworks' },
        'wrk_sw_weld_butt_20mm': { name: 'Сварка стыковая до 20мм', unit: 'м.п.', price: 2500, category: 'steelworks' },
        'wrk_sw_weld_fillet_6mm': { name: 'Сварка угловая (катет 6мм)', unit: 'м.п.', price: 650, category: 'steelworks' },
        'wrk_sw_weld_fillet_10mm': { name: 'Сварка угловая (катет 10мм)', unit: 'м.п.', price: 1100, category: 'steelworks' },
        'wrk_sw_weld_inspection_vt': { name: 'Визуальный контроль сварных швов', unit: 'м.п.', price: 250, category: 'steelworks' },
        'wrk_sw_weld_inspection_ut': { name: 'УЗК контроль сварных швов', unit: 'м.п.', price: 650, category: 'steelworks' },
        'wrk_sw_weld_inspection_rt': { name: 'Рентген контроль сварных швов', unit: 'снимок', price: 3500, category: 'steelworks' },
        // === ВысотнЫЕ БОЛТОВЫЕ СОЕДИНЕНИЯ ===
        'wrk_sw_bolt_normal': { name: 'Постановка обычных болтов', unit: 'шт', price: 120, category: 'steelworks' },
        'wrk_sw_bolt_high_strength': { name: 'Постановка высокопрочных болтов', unit: 'шт', price: 350, category: 'steelworks' },
        'wrk_sw_bolt_pretension': { name: 'Натяжение ВП болтов (контром.)', unit: 'шт', price: 250, category: 'steelworks' },
        // === СЭНДВИЧ-ПАНЕЛИ ===
        'wrk_sw_sandwich_wall_50': { name: 'Монтаж стеновых сэндвич-панелей h=50мм', unit: 'м²', price: 1200, category: 'steelworks' },
        'wrk_sw_sandwich_wall_80': { name: 'Монтаж стеновых сэндвич-панелей h=80мм', unit: 'м²', price: 1400, category: 'steelworks' },
        'wrk_sw_sandwich_wall_100': { name: 'Монтаж стеновых сэндвич-панелей h=100мм', unit: 'м²', price: 1600, category: 'steelworks' },
        'wrk_sw_sandwich_wall_120': { name: 'Монтаж стеновых сэндвич-панелей h=120мм', unit: 'м²', price: 1800, category: 'steelworks' },
        'wrk_sw_sandwich_wall_150': { name: 'Монтаж стеновых сэндвич-панелей h=150мм', unit: 'м²', price: 2000, category: 'steelworks' },
        'wrk_sw_sandwich_roof_50': { name: 'Монтаж кровельных сэндвич-панелей h=50мм', unit: 'м²', price: 1400, category: 'steelworks' },
        'wrk_sw_sandwich_roof_80': { name: 'Монтаж кровельных сэндвич-панелей h=80мм', unit: 'м²', price: 1600, category: 'steelworks' },
        'wrk_sw_sandwich_roof_100': { name: 'Монтаж кровельных сэндвич-панелей h=100мм', unit: 'м²', price: 1800, category: 'steelworks' },
        'wrk_sw_sandwich_roof_150': { name: 'Монтаж кровельных сэндвич-панелей h=150мм', unit: 'м²', price: 2200, category: 'steelworks' },
        'wrk_sw_sandwich_roof_200': { name: 'Монтаж кровельных сэндвич-панелей h=200мм', unit: 'м²', price: 2600, category: 'steelworks' },
        // === ПРОФНАСТИЛ ===
        'wrk_sw_profsheet_wall': { name: 'Монтаж стенового профнастила', unit: 'м²', price: 650, category: 'steelworks' },
        'wrk_sw_profsheet_roof': { name: 'Монтаж кровельного профнастила', unit: 'м²', price: 750, category: 'steelworks' },
        'wrk_sw_profsheet_deck': { name: 'Монтаж профнастила несущего (перекрытие)', unit: 'м²', price: 850, category: 'steelworks' },
        // === ПРОМЫШЛЕННЫЕ ПОЛЫ ===
        'wrk_sw_floor_ind_150': { name: 'Промышленный бетонный пол h=150мм', unit: 'м²', price: 2500, category: 'steelworks' },
        'wrk_sw_floor_ind_200': { name: 'Промышленный бетонный пол h=200мм', unit: 'м²', price: 3200, category: 'steelworks' },
        'wrk_sw_floor_ind_250': { name: 'Промышленный бетонный пол h=250мм', unit: 'м²', price: 3800, category: 'steelworks' },
        'wrk_sw_floor_ind_fiber': { name: 'Фибробетонный промышленный пол h=200мм', unit: 'м²', price: 3500, category: 'steelworks' },
        'wrk_sw_floor_topping_hard': { name: 'Топпинг для пола (корундовый)', unit: 'м²', price: 750, category: 'steelworks' },
        'wrk_sw_floor_topping_quartz': { name: 'Топпинг для пола (кварцевый)', unit: 'м²', price: 550, category: 'steelworks' },
        'wrk_sw_floor_joints_cut': { name: 'Нарезка деформационных швов в полу', unit: 'м.п.', price: 350, category: 'steelworks' },
        'wrk_sw_floor_joints_seal': { name: 'Герметизация швов в полу', unit: 'м.п.', price: 450, category: 'steelworks' },
        // === ВЕНТИЛИРУЕМЫЕ ФАСАДЫ ===
        'wrk_sw_vent_facade_bracket': { name: 'Монтаж кронштейнов вентфасада', unit: 'шт', price: 350, category: 'steelworks' },
        'wrk_sw_vent_facade_profile': { name: 'Монтаж подсистемы вентфасада (профили)', unit: 'м²', price: 850, category: 'steelworks' },
        'wrk_sw_vent_facade_alucobond': { name: 'Облицовка алюкобондом (вентфасад)', unit: 'м²', price: 2800, category: 'steelworks' },
        'wrk_sw_vent_facade_fibro': { name: 'Облицовка фиброцементом (вентфасад)', unit: 'м²', price: 2200, category: 'steelworks' },
        'wrk_sw_vent_facade_metal': { name: 'Облицовка металлокассетами (вентфасад)', unit: 'м²', price: 3200, category: 'steelworks' },
        'wrk_sw_vent_facade_hpl': { name: 'Облицовка HPL-панелями (вентфасад)', unit: 'м²', price: 3500, category: 'steelworks' }
    };
})();
