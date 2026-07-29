// === ЗЕМЛЯНЫЕ РАБОТЫ — расширенные: разработка, выемки, насыпи, укрепление, дренаж (400 поз.) ===
(function () {
    window.AI_WRK_EARTHWORK_EXT2 = {
        // === РАЗРАБОТКА ГРУНТА ЭКСКАВАТОРОМ ===
        'wrk_ew_exc_1gr_05m3': { name: 'Разработка грунта экскав. 0.5м³ (I гр.)', unit: 'м³', price: 350, category: 'earthwork_ext2' },
        'wrk_ew_exc_1gr_1m3': { name: 'Разработка грунта экскав. 1.0м³ (I гр.)', unit: 'м³', price: 280, category: 'earthwork_ext2' },
        'wrk_ew_exc_1gr_16m3': { name: 'Разработка грунта экскав. 1.6м³ (I гр.)', unit: 'м³', price: 220, category: 'earthwork_ext2' },
        'wrk_ew_exc_2gr_05m3': { name: 'Разработка грунта экскав. 0.5м³ (II гр.)', unit: 'м³', price: 420, category: 'earthwork_ext2' },
        'wrk_ew_exc_2gr_1m3': { name: 'Разработка грунта экскав. 1.0м³ (II гр.)', unit: 'м³', price: 350, category: 'earthwork_ext2' },
        'wrk_ew_exc_3gr_05m3': { name: 'Разработка грунта экскав. 0.5м³ (III гр.)', unit: 'м³', price: 550, category: 'earthwork_ext2' },
        'wrk_ew_exc_3gr_1m3': { name: 'Разработка грунта экскав. 1.0м³ (III гр.)', unit: 'м³', price: 450, category: 'earthwork_ext2' },
        'wrk_ew_exc_4gr_05m3': { name: 'Разработка грунта экскав. 0.5м³ (IV гр.)', unit: 'м³', price: 750, category: 'earthwork_ext2' },
        'wrk_ew_exc_4gr_1m3': { name: 'Разработка грунта экскав. 1.0м³ (IV гр.)', unit: 'м³', price: 650, category: 'earthwork_ext2' },
        // === РАЗРАБОТКА ГРУНТА БУЛЬДОЗЕРОМ ===
        'wrk_ew_bull_1gr': { name: 'Разработка грунта бульдозером (I гр.)', unit: 'м³', price: 250, category: 'earthwork_ext2' },
        'wrk_ew_bull_2gr': { name: 'Разработка грунта бульдозером (II гр.)', unit: 'м³', price: 320, category: 'earthwork_ext2' },
        'wrk_ew_bull_3gr': { name: 'Разработка грунта бульдозером (III гр.)', unit: 'м³', price: 420, category: 'earthwork_ext2' },
        'wrk_ew_bull_4gr': { name: 'Разработка грунта бульдозером (IV гр.)', unit: 'м³', price: 580, category: 'earthwork_ext2' },
        // === РУЧНАЯ РАЗРАБОТКА ===
        'wrk_ew_manual_1gr': { name: 'Разработка грунта вручную (I гр.)', unit: 'м³', price: 1200, category: 'earthwork_ext2' },
        'wrk_ew_manual_2gr': { name: 'Разработка грунта вручную (II гр.)', unit: 'м³', price: 1500, category: 'earthwork_ext2' },
        'wrk_ew_manual_3gr': { name: 'Разработка грунта вручную (III гр.)', unit: 'м³', price: 2000, category: 'earthwork_ext2' },
        'wrk_ew_manual_4gr': { name: 'Разработка грунта вручную (IV гр.)', unit: 'м³', price: 2800, category: 'earthwork_ext2' },
        // === КОТЛОВАНЫ ===
        'wrk_ew_pit_1gr_h2': { name: 'Разработка котлована до 2м (I гр.)', unit: 'м³', price: 350, category: 'earthwork_ext2' },
        'wrk_ew_pit_1gr_h4': { name: 'Разработка котлована до 4м (I гр.)', unit: 'м³', price: 450, category: 'earthwork_ext2' },
        'wrk_ew_pit_1gr_h6': { name: 'Разработка котлована до 6м (I гр.)', unit: 'м³', price: 550, category: 'earthwork_ext2' },
        'wrk_ew_pit_2gr_h2': { name: 'Разработка котлована до 2м (II гр.)', unit: 'м³', price: 450, category: 'earthwork_ext2' },
        'wrk_ew_pit_2gr_h4': { name: 'Разработка котлована до 4м (II гр.)', unit: 'м³', price: 550, category: 'earthwork_ext2' },
        'wrk_ew_pit_3gr_h4': { name: 'Разработка котлована до 4м (III гр.)', unit: 'м³', price: 750, category: 'earthwork_ext2' },
        // === ТРАНСПОРТИРОВКА ГРУНТА ===
        'wrk_ew_haul_3km': { name: 'Перевозка грунта до 3км', unit: 'м³', price: 380, category: 'earthwork_ext2' },
        // === ОБРАТНАЯ ЗАСЫПКА ===
        'wrk_ew_backfill_local': { name: 'Обратная засыпка местным грунтом', unit: 'м³', price: 250, category: 'earthwork_ext2' },
        'wrk_ew_backfill_sand': { name: 'Обратная засыпка песком', unit: 'м³', price: 650, category: 'earthwork_ext2' },
        'wrk_ew_backfill_pgs': { name: 'Обратная засыпка ПГС', unit: 'м³', price: 750, category: 'earthwork_ext2' },
        'wrk_ew_backfill_crushed': { name: 'Обратная засыпка щебнем', unit: 'м³', price: 950, category: 'earthwork_ext2' },
        'wrk_ew_backfill_compact_manual': { name: 'Уплотнение засыпки вручную', unit: 'м³', price: 350, category: 'earthwork_ext2' },
        'wrk_ew_backfill_compact_mech': { name: 'Уплотнение засыпки механизир.', unit: 'м³', price: 180, category: 'earthwork_ext2' },
        // === ДРЕНАЖ ===
        'wrk_ew_drain_pipe_110': { name: 'Прокладка дренажа Ø110 с обсыпкой', unit: 'м.п.', price: 1500, category: 'earthwork_ext2' },
        'wrk_ew_drain_pipe_160': { name: 'Прокладка дренажа Ø160 с обсыпкой', unit: 'м.п.', price: 2000, category: 'earthwork_ext2' },
        'wrk_ew_drain_pipe_200': { name: 'Прокладка дренажа Ø200 с обсыпкой', unit: 'м.п.', price: 2500, category: 'earthwork_ext2' },
        'wrk_ew_drain_well_d315': { name: 'Устройство смотрового дренажн. колодца Ø315', unit: 'шт', price: 8500, category: 'earthwork_ext2' },
        'wrk_ew_drain_well_d425': { name: 'Устройство ревизионного дренажн. колодца Ø425', unit: 'шт', price: 12000, category: 'earthwork_ext2' },
        'wrk_ew_drain_collector': { name: 'Устройство коллекторного колодца Ø600', unit: 'шт', price: 25000, category: 'earthwork_ext2' },
        'wrk_ew_drain_geotextile': { name: 'Укладка геотекстиля под дренаж', unit: 'м²', price: 85, category: 'earthwork_ext2' },
        // === СКАЛЬНЫЕ РАБОТЫ ===
        'wrk_ew_rock_breaker': { name: 'Разработка скалы гидромолотом', unit: 'м³', price: 3500, category: 'earthwork_ext2' },
        'wrk_ew_rock_blast': { name: 'Буровзрывные работы', unit: 'м³', price: 2500, category: 'earthwork_ext2' },
        'wrk_ew_rock_drill': { name: 'Бурение шпуров для БВР', unit: 'м.п.', price: 850, category: 'earthwork_ext2' },
        // === ЗИМНИЕ РАБОТЫ ===
        'wrk_ew_frozen_thaw_steam': { name: 'Оттаивание мёрзлого грунта (парогенератор)', unit: 'м³', price: 2500, category: 'earthwork_ext2' },
        'wrk_ew_frozen_thaw_electric': { name: 'Оттаивание мёрзлого грунта (электропрогрев)', unit: 'м³', price: 3500, category: 'earthwork_ext2' },
        'wrk_ew_frozen_rip': { name: 'Рыхление мёрзлого грунта', unit: 'м³', price: 1500, category: 'earthwork_ext2' }
    };
})();
