// === ГИДРОТЕХНИЧЕСКИЕ СООРУЖЕНИЯ — дамбы, причалы, берегоукрепление, водосбросы (300 поз.) ===
(function () {
    window.AI_WRK_HYDRO = {
        // === БЕРЕГОУКРЕПЛЕНИЕ ===
        'wrk_hy_shore_gabion': { name: 'Берегоукрепление габионами', unit: 'м³', price: 5500, category: 'hydro' },
        'wrk_hy_shore_matras': { name: 'Берегоукрепление матрацами Рено', unit: 'м²', price: 2500, category: 'hydro' },
        'wrk_hy_shore_rc_slab': { name: 'Берегоукрепление ж/б плитами', unit: 'м²', price: 5500, category: 'hydro' },
        'wrk_hy_shore_sheetpile': { name: 'Берегоукрепление шпунтом', unit: 'м²', price: 8500, category: 'hydro' },
        'wrk_hy_shore_stone': { name: 'Берегоукрепление камнем (наброска)', unit: 'м³', price: 3500, category: 'hydro' },
        'wrk_hy_shore_geotube': { name: 'Берегоукрепление геотрубами', unit: 'м.п.', price: 5500, category: 'hydro' },
        // === ДАМБЫ ===
        'wrk_hy_dam_earthfill': { name: 'Устройство насыпной дамбы', unit: 'м³', price: 350, category: 'hydro' },
        'wrk_hy_dam_core': { name: 'Устройство глиняного ядра дамбы', unit: 'м³', price: 550, category: 'hydro' },
        'wrk_hy_dam_riprap': { name: 'Крепление откоса камнем', unit: 'м²', price: 2500, category: 'hydro' },
        'wrk_hy_dam_geomembrane': { name: 'Противофильтрационный экран (геомембрана)', unit: 'м²', price: 550, category: 'hydro' },
        // === ПРИЧАЛЫ ===
        'wrk_hy_pier_rc_pile': { name: 'Свайное основание причала', unit: 'м.п.', price: 15000, category: 'hydro' },
        'wrk_hy_pier_rc_slab': { name: 'Ж/б плита причала', unit: 'м²', price: 12000, category: 'hydro' },
        'wrk_hy_pier_fender': { name: 'Монтаж отбойного устройства', unit: 'шт', price: 55000, category: 'hydro' },
        'wrk_hy_pier_bollard': { name: 'Монтаж швартового кнехта', unit: 'шт', price: 25000, category: 'hydro' },
        // === КАНАЛЫ ===
        'wrk_hy_channel_excavation': { name: 'Устройство канала (выемка)', unit: 'м³', price: 450, category: 'hydro' },
        'wrk_hy_channel_lining_rc': { name: 'Крепление канала ж/б плитами', unit: 'м²', price: 5500, category: 'hydro' },
        'wrk_hy_channel_lining_geo': { name: 'Крепление канала геомембраной', unit: 'м²', price: 450, category: 'hydro' },
        // === ВОДОСБРОСЫ / ЗАТВОРЫ ===
        'wrk_hy_spillway_rc': { name: 'Устройство водосброса (ж/б)', unit: 'м³', price: 18000, category: 'hydro' },
        'wrk_hy_gate_install': { name: 'Монтаж затвора', unit: 'т', price: 55000, category: 'hydro' },
        // === ПОДВОДНЫЕ РАБОТЫ ===
        'wrk_hy_diver_inspect': { name: 'Водолазное обследование', unit: 'час', price: 8500, category: 'hydro' },
        'wrk_hy_diver_weld': { name: 'Подводная сварка', unit: 'час', price: 12000, category: 'hydro' },
        'wrk_hy_dredging': { name: 'Дноуглубление', unit: 'м³', price: 550, category: 'hydro' }
    };
})();
