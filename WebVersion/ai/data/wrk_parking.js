// === ПАРКОВКИ И ПАРКИНГИ — подземные, многоуровневые, открытые, оборудование (50 поз.) ===
(function () {
    window.AI_WRK_PARKING = {
        // === ПОДЗЕМНЫЙ ПАРКИНГ === 1-10
        'wrk_prk_excavation_deep': { name: 'Разработка котлована (подземный паркинг)', unit: 'м³', price: 850, category: 'parking' },
        'wrk_prk_shoring_wall': { name: 'Стена в грунте (ограждение котлована)', unit: 'м²', price: 12000, category: 'parking' },
        'wrk_prk_slab_bottom': { name: 'Фундаментная плита паркинга', unit: 'м²', price: 5500, category: 'parking' },
        'wrk_prk_slab_floor': { name: 'Монолитное перекрытие паркинга', unit: 'м²', price: 5500, category: 'parking' },
        'wrk_prk_column_rc': { name: 'Колонна ж/б паркинга', unit: 'шт', price: 25000, category: 'parking' },
        'wrk_prk_wall_rc': { name: 'Стена ж/б паркинга', unit: 'м²', price: 5500, category: 'parking' },
        'wrk_prk_ramp_rc': { name: 'Рампа въездная (бетон)', unit: 'м²', price: 8500, category: 'parking' },
        'wrk_prk_waterproof_slab': { name: 'Гидроизоляция плиты покрытия', unit: 'м²', price: 850, category: 'parking' },
        'wrk_prk_waterproof_wall': { name: 'Гидроизоляция стен паркинга', unit: 'м²', price: 550, category: 'parking' },
        'wrk_prk_dewater_system': { name: 'Система водопонижения', unit: 'компл.', price: 250000, category: 'parking' },
        // === МНОГОУРОВНЕВЫЙ ПАРКИНГ === 11-16
        'wrk_prk_steel_frame': { name: 'Металлокаркас многоуровневого паркинга', unit: 'т', price: 85000, category: 'parking' },
        'wrk_prk_precast_slab': { name: 'Сборные ж/б плиты перекрытия', unit: 'м²', price: 3500, category: 'parking' },
        'wrk_prk_facade_mesh': { name: 'Фасад из сетки/ламелей', unit: 'м²', price: 2500, category: 'parking' },
        'wrk_prk_facade_perfor': { name: 'Фасад из перфорлиста', unit: 'м²', price: 3500, category: 'parking' },
        'wrk_prk_elevator_car': { name: 'Автомобильный лифт (2т)', unit: 'шт', price: 5500000, category: 'parking' },
        'wrk_prk_turntable': { name: 'Поворотная платформа', unit: 'шт', price: 550000, category: 'parking' },
        // === ПОКРЫТИЕ ПОЛОВ === 17-22
        'wrk_prk_floor_epoxy': { name: 'Эпоксидное покрытие пола паркинга', unit: 'м²', price: 850, category: 'parking' },
        'wrk_prk_floor_topping': { name: 'Топпинг (упрочнитель бетона)', unit: 'м²', price: 350, category: 'parking' },
        'wrk_prk_floor_marking': { name: 'Разметка парковочных мест', unit: 'место', price: 550, category: 'parking' },
        'wrk_prk_floor_number': { name: 'Нумерация мест', unit: 'место', price: 120, category: 'parking' },
        'wrk_prk_floor_speed_bump': { name: 'Монтаж "лежачего полицейского"', unit: 'м.п.', price: 1200, category: 'parking' },
        // === ОБОРУДОВАНИЕ === 23-36
        'wrk_prk_barrier_entry': { name: 'Шлагбаум на въезде', unit: 'шт', price: 55000, category: 'parking' },
        'wrk_prk_barrier_exit': { name: 'Шлагбаум на выезде', unit: 'шт', price: 55000, category: 'parking' },
        'wrk_prk_ticket_machine': { name: 'Паркомат (выдача билетов)', unit: 'шт', price: 250000, category: 'parking' },
        'wrk_prk_payment_machine': { name: 'Терминал оплаты парковки', unit: 'шт', price: 350000, category: 'parking' },
        'wrk_prk_lpr_camera': { name: 'Камера распознавания номеров (LPR)', unit: 'шт', price: 55000, category: 'parking' },
        'wrk_prk_guidance_sensor': { name: 'Датчик занятости места (ультразвук.)', unit: 'шт', price: 5500, category: 'parking' },
        'wrk_prk_guidance_display': { name: 'Табло «Свободно/Занято» (этаж)', unit: 'шт', price: 15000, category: 'parking' },
        'wrk_prk_guidance_server': { name: 'Сервер системы паркинга', unit: 'компл.', price: 120000, category: 'parking' },
        'wrk_prk_ev_charger_50': { name: 'Зарядная станция EV 50кВт (DC)', unit: 'шт', price: 550000, category: 'parking' },
        'wrk_prk_fire_sprinkler': { name: 'Спринклерная система паркинга', unit: 'м²', price: 850, category: 'parking' },
        // === ВЕНТИЛЯЦИЯ ПАРКИНГА === 37-40
        'wrk_prk_vent_jet_fan': { name: 'Струйный вентилятор (jet fan)', unit: 'шт', price: 55000, category: 'parking' },
        'wrk_prk_vent_co_sensor': { name: 'Датчик CO паркинга', unit: 'шт', price: 8500, category: 'parking' },
        'wrk_prk_vent_exhaust': { name: 'Вытяжная система паркинга', unit: 'компл.', price: 250000, category: 'parking' },
        'wrk_prk_vent_supply': { name: 'Приточная система паркинга', unit: 'компл.', price: 250000, category: 'parking' },
        // === ОТКРЫТАЯ ПАРКОВКА === 41-48
        'wrk_prk_asphalt_base': { name: 'Основание парковки (щебень)', unit: 'м²', price: 550, category: 'parking' },
        'wrk_prk_asphalt_surface': { name: 'Асфальтовое покрытие', unit: 'м²', price: 850, category: 'parking' },
        'wrk_prk_paving_stone': { name: 'Мощение тротуарной плиткой', unit: 'м²', price: 1500, category: 'parking' },
        'wrk_prk_grass_grid': { name: 'Газонная решётка (экопарковка)', unit: 'м²', price: 850, category: 'parking' },
        'wrk_prk_curb': { name: 'Бордюр парковки', unit: 'м.п.', price: 550, category: 'parking' },
        'wrk_prk_wheel_stop': { name: 'Колёсоотбойник', unit: 'шт', price: 550, category: 'parking' },
        'wrk_prk_bollard': { name: 'Столбик ограничительный', unit: 'шт', price: 2500, category: 'parking' },
        'wrk_prk_lighting': { name: 'Освещение парковки (LED)', unit: 'светильник', price: 5500, category: 'parking' }
    };
})();
