// === ФАЗА 3: ЗЕМЛЯНЫЕ РАБОТЫ ДЕТАЛЬНО — ПО ГРУНТАМ, ОБЪЁМАМ, ТЕХНИКЕ (130 поз.) ===
(function () {
    window.AI_WRK_EARTHWORK_FULL = {
        // === МЕХАНИЗИРОВАННАЯ РАЗРАБОТКА ===
        'wrk_ew_excav_1_cat1': { name: 'Разработка грунта I кат. экскав.', unit: 'м³', price: 50, category: 'earthwork_full' },
        'wrk_ew_excav_1_cat2': { name: 'Разработка грунта II кат. экскав.', unit: 'м³', price: 70, category: 'earthwork_full' },
        'wrk_ew_excav_1_cat3': { name: 'Разработка грунта III кат. экскав.', unit: 'м³', price: 100, category: 'earthwork_full' },
        'wrk_ew_excav_1_cat4': { name: 'Разработка грунта IV кат. экскав.', unit: 'м³', price: 150, category: 'earthwork_full' },
        'wrk_ew_excav_rock': { name: 'Разработка скальн. грунта', unit: 'м³', price: 300, category: 'earthwork_full' },
        // Бульдозер
        'wrk_ew_bull_backfill': { name: 'Обратная засыпка бульдозером', unit: 'м³', price: 30, category: 'earthwork_full' },
        'wrk_ew_bull_clearing': { name: 'Расчистка территории бульдоз.', unit: 'м²', price: 10, category: 'earthwork_full' },

        // === РУЧНАЯ РАЗРАБОТКА ===
        'wrk_ew_manual_cat1': { name: 'Ручная разработка грунта I кат.', unit: 'м³', price: 200, category: 'earthwork_full' },
        'wrk_ew_manual_cat2': { name: 'Ручная разработка грунта II кат.', unit: 'м³', price: 300, category: 'earthwork_full' },
        'wrk_ew_manual_cat3': { name: 'Ручная разработка грунта III кат.', unit: 'м³', price: 400, category: 'earthwork_full' },
        'wrk_ew_manual_cat4': { name: 'Ручная разработка грунта IV кат.', unit: 'м³', price: 500, category: 'earthwork_full' },
        'wrk_ew_manual_trench': { name: 'Копка траншеи вручную', unit: 'м³', price: 300, category: 'earthwork_full' },
        'wrk_ew_manual_pit': { name: 'Копка ямы вручную', unit: 'м³', price: 300, category: 'earthwork_full' },

        // === КОТЛОВАНЫ ===
        'wrk_ew_pit_to_100': { name: 'Котлован до 100м³', unit: 'м³', price: 60, category: 'earthwork_full' },
        'wrk_ew_pit_100_500': { name: 'Котлован 100-500м³', unit: 'м³', price: 50, category: 'earthwork_full' },
        'wrk_ew_pit_500_1000': { name: 'Котлован 500-1000м³', unit: 'м³', price: 40, category: 'earthwork_full' },
        'wrk_ew_pit_over_1000': { name: 'Котлован более 1000м³', unit: 'м³', price: 35, category: 'earthwork_full' },

        // === ТРАНШЕИ ===
        'wrk_ew_trench_300x600': { name: 'Траншея 300×600мм', unit: 'м.п.', price: 30, category: 'earthwork_full' },
        'wrk_ew_trench_500x800': { name: 'Траншея 500×800мм', unit: 'м.п.', price: 50, category: 'earthwork_full' },
        'wrk_ew_trench_600x1000': { name: 'Траншея 600×1000мм', unit: 'м.п.', price: 80, category: 'earthwork_full' },
        'wrk_ew_trench_800x1200': { name: 'Траншея 800×1200мм', unit: 'м.п.', price: 120, category: 'earthwork_full' },
        'wrk_ew_trench_1000x1500': { name: 'Траншея 1000×1500мм', unit: 'м.п.', price: 180, category: 'earthwork_full' },
        'wrk_ew_trench_1500x2000': { name: 'Траншея 1500×2000мм', unit: 'м.п.', price: 300, category: 'earthwork_full' },
        'wrk_ew_trench_shore': { name: 'Крепление стенок траншеи', unit: 'м²', price: 30, category: 'earthwork_full' },
        'wrk_ew_trench_dewater': { name: 'Водоотлив из траншеи', unit: 'м.п.', price: 10, category: 'earthwork_full' },

        // === ОБРАТНАЯ ЗАСЫПКА ===
        'wrk_ew_compact_manual': { name: 'Уплотнение (вибротрамбовка)', unit: 'м²', price: 10, category: 'earthwork_full' },
        'wrk_ew_compact_roller': { name: 'Уплотнение (виброкаток)', unit: 'м²', price: 5, category: 'earthwork_full' },
        'wrk_ew_compact_plate': { name: 'Уплотнение (виброплита)', unit: 'м²', price: 8, category: 'earthwork_full' },

        // === ВЕРТИКАЛЬНАЯ ПЛАНИРОВКА ===
        'wrk_ew_grade_mech': { name: 'Вертикальная планировка (мех.)', unit: 'м²', price: 5, category: 'earthwork_full' },
        'wrk_ew_grade_manual': { name: 'Вертикальная планировка (ручн.)', unit: 'м²', price: 20, category: 'earthwork_full' },
        'wrk_ew_slope_form': { name: 'Формирование откоса', unit: 'м²', price: 20, category: 'earthwork_full' },
        'wrk_ew_slope_reinforce': { name: 'Укрепление откоса (геосетка)', unit: 'м²', price: 40, category: 'earthwork_full' },
        'wrk_ew_slope_seed': { name: 'Засев откоса травой', unit: 'м²', price: 15, category: 'earthwork_full' },

        // === ТРАНСПОРТИРОВКА ===
        'wrk_ew_haul_30km': { name: 'Перевозка грунта до 30км', unit: 'м³', price: 70, category: 'earthwork_full' },

        // === ДРЕНАЖ ===
        'wrk_ew_drain_pipe_110': { name: 'Дренажная труба Ø110мм', unit: 'м.п.', price: 50, category: 'earthwork_full' },
        'wrk_ew_drain_pipe_160': { name: 'Дренажная труба Ø160мм', unit: 'м.п.', price: 70, category: 'earthwork_full' },
        'wrk_ew_drain_pipe_200': { name: 'Дренажная труба Ø200мм', unit: 'м.п.', price: 100, category: 'earthwork_full' },
        'wrk_ew_drain_well_insp': { name: 'Смотровой колодец (дренаж)', unit: 'шт', price: 3000, category: 'earthwork_full' },
        'wrk_ew_drain_well_collect': { name: 'Коллекторный колодец (дренаж)', unit: 'шт', price: 5000, category: 'earthwork_full' },
        'wrk_ew_drain_geotextile': { name: 'Геотекстиль (обёртка дренажа)', unit: 'м²', price: 10, category: 'earthwork_full' },
        'wrk_ew_drain_gravel_wrap': { name: 'Обсыпка дренажа щебнем', unit: 'м.п.', price: 30, category: 'earthwork_full' },
        'wrk_ew_drain_ring': { name: 'Кольцевой дренаж (вокруг дома)', unit: 'м.п.', price: 150, category: 'earthwork_full' },
        'wrk_ew_drain_prist': { name: 'Пристенный дренаж', unit: 'м.п.', price: 100, category: 'earthwork_full' },
        'wrk_ew_drain_interceptor': { name: 'Перехватывающий дренаж', unit: 'м.п.', price: 120, category: 'earthwork_full' },

        // === ВОДОПОНИЖЕНИЕ ===
        'wrk_ew_dewater_wellpoint': { name: 'Иглофильтровое водопонижение', unit: 'точка', price: 2000, category: 'earthwork_full' },
        'wrk_ew_dewater_pumping': { name: 'Насосное водопонижение', unit: 'смена', price: 5000, category: 'earthwork_full' },
    };
})();
