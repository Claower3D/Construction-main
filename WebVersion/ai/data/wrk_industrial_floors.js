// === ФАЗА 3: ПРОМЫШЛЕННЫЕ ПОЛЫ, ЭПОКСИДНЫЕ, ПОЛИМЕРНЫЕ, НАЛИВНЫЕ, ПРОМЫШЛЕННЫЕ ПОКРЫТИЯ (200 поз.) ===
(function () {
    window.AI_WRK_IND_FLOORS = {
        // === ПРОМЫШЛЕННЫЕ ПОЛЫ — БЕТОННЫЕ ===
        'wrk_ifl_concrete_150': { name: 'Промышленный бетонный пол 150мм', unit: 'м²', price: 300, category: 'ind_floors' },
        'wrk_ifl_concrete_200': { name: 'Промышленный бетонный пол 200мм', unit: 'м²', price: 400, category: 'ind_floors' },
        'wrk_ifl_concrete_250': { name: 'Промышленный бетонный пол 250мм', unit: 'м²', price: 500, category: 'ind_floors' },
        'wrk_ifl_concrete_300': { name: 'Промышленный бетонный пол 300мм', unit: 'м²', price: 600, category: 'ind_floors' },
        'wrk_ifl_concrete_fiber_150': { name: 'Фибробетонный пол 150мм', unit: 'м²', price: 350, category: 'ind_floors' },
        'wrk_ifl_concrete_fiber_200': { name: 'Фибробетонный пол 200мм', unit: 'м²', price: 450, category: 'ind_floors' },
        'wrk_ifl_concrete_fiber_300': { name: 'Фибробетонный пол 300мм', unit: 'м²', price: 650, category: 'ind_floors' },
        // Топпинг
        'wrk_ifl_topping_3': { name: 'Топпинг 3кг/м²', unit: 'м²', price: 50, category: 'ind_floors' },
        'wrk_ifl_topping_5': { name: 'Топпинг 5кг/м²', unit: 'м²', price: 70, category: 'ind_floors' },
        'wrk_ifl_topping_7': { name: 'Топпинг 7кг/м² (усиленный)', unit: 'м²', price: 100, category: 'ind_floors' },
        'wrk_ifl_topping_corundum': { name: 'Корундовый топпинг', unit: 'м²', price: 120, category: 'ind_floors' },
        'wrk_ifl_topping_metal': { name: 'Металлический топпинг', unit: 'м²', price: 150, category: 'ind_floors' },
        // Полимерные полы
        'wrk_ifl_epoxy_thin_1': { name: 'Эпоксидный пол тонкослойный 1мм', unit: 'м²', price: 200, category: 'ind_floors' },
        'wrk_ifl_epoxy_thin_2': { name: 'Эпоксидный пол тонкослойный 2мм', unit: 'м²', price: 300, category: 'ind_floors' },
        'wrk_ifl_epoxy_quartz_3': { name: 'Эпоксидный кварцевый 3мм', unit: 'м²', price: 450, category: 'ind_floors' },
        'wrk_ifl_epoxy_quartz_5': { name: 'Эпоксидный кварцевый 5мм', unit: 'м²', price: 650, category: 'ind_floors' },
        'wrk_ifl_polyur_thin_1': { name: 'Полиуретановый пол 1мм', unit: 'м²', price: 250, category: 'ind_floors' },
        'wrk_ifl_polyur_thin_2': { name: 'Полиуретановый пол 2мм', unit: 'м²', price: 350, category: 'ind_floors' },
        'wrk_ifl_polyur_selflev_3': { name: 'Полиуретановый наливной 3мм', unit: 'м²', price: 450, category: 'ind_floors' },
        'wrk_ifl_polyur_selflev_5': { name: 'Полиуретановый наливной 5мм', unit: 'м²', price: 650, category: 'ind_floors' },
        'wrk_ifl_polyur_cement': { name: 'Полиуретанцемент 6мм', unit: 'м²', price: 800, category: 'ind_floors' },
        'wrk_ifl_polyur_cement_9': { name: 'Полиуретанцемент 9мм', unit: 'м²', price: 1000, category: 'ind_floors' },
        'wrk_ifl_methyl_methacryl': { name: 'Метилметакрилатный пол', unit: 'м²', price: 500, category: 'ind_floors' },
        // Декоративные промышленные
        'wrk_ifl_epoxy_3d': { name: '3D наливной пол (эпоксидный)', unit: 'м²', price: 1500, category: 'ind_floors' },
        'wrk_ifl_epoxy_flake': { name: 'Пол с чипсами/флоками', unit: 'м²', price: 500, category: 'ind_floors' },
        'wrk_ifl_epoxy_metallic': { name: 'Металлик-пол (эпоксид)', unit: 'м²', price: 800, category: 'ind_floors' },
        'wrk_ifl_terazzo': { name: 'Терраццо пол', unit: 'м²', price: 1000, category: 'ind_floors' },
        'wrk_ifl_terazzo_polished': { name: 'Терраццо полированный', unit: 'м²', price: 1200, category: 'ind_floors' },
        // Подготовка основания
        'wrk_ifl_prep_primer': { name: 'Грунтовка промышленная', unit: 'м²', price: 30, category: 'ind_floors' },
        'wrk_ifl_prep_repair': { name: 'Ремонт основания (трещины)', unit: 'м²', price: 100, category: 'ind_floors' },
        'wrk_ifl_prep_deform_joint': { name: 'Заполнение деформационного шва', unit: 'м.п.', price: 50, category: 'ind_floors' },
        'wrk_ifl_joint_cut': { name: 'Нарезка швов в полу', unit: 'м.п.', price: 30, category: 'ind_floors' },
        'wrk_ifl_joint_seal_pu': { name: 'Герметизация шва (ПУ)', unit: 'м.п.', price: 30, category: 'ind_floors' },
        'wrk_ifl_joint_seal_epoxy': { name: 'Герметизация шва (эпоксид)', unit: 'м.п.', price: 40, category: 'ind_floors' },
        // Полированный бетон
        'wrk_ifl_polished_basic': { name: 'Полированный бетон (базовый)', unit: 'м²', price: 150, category: 'ind_floors' },
        'wrk_ifl_polished_premium': { name: 'Полированный бетон (премиум)', unit: 'м²', price: 250, category: 'ind_floors' },
        'wrk_ifl_polished_litium': { name: 'Литиевая пропитка', unit: 'м²', price: 50, category: 'ind_floors' },
        // Антистатические полы
        'wrk_ifl_esd_epoxy': { name: 'ESD-пол эпоксидный', unit: 'м²', price: 600, category: 'ind_floors' },
        'wrk_ifl_esd_vinyl': { name: 'ESD-пол виниловый', unit: 'м²', price: 400, category: 'ind_floors' },
        'wrk_ifl_esd_ground': { name: 'Заземление ЕSD-пола', unit: 'точка', price: 500, category: 'ind_floors' },
        // Спортивные покрытия
        'wrk_ifl_sport_polyur_4': { name: 'Спортивное покрытие ПУ 4мм', unit: 'м²', price: 400, category: 'ind_floors' },
        'wrk_ifl_sport_polyur_6': { name: 'Спортивное покрытие ПУ 6мм', unit: 'м²', price: 500, category: 'ind_floors' },
        'wrk_ifl_sport_rubber_6': { name: 'Резиновое покрытие 6мм', unit: 'м²', price: 300, category: 'ind_floors' },
        'wrk_ifl_sport_rubber_10': { name: 'Резиновое покрытие 10мм', unit: 'м²', price: 400, category: 'ind_floors' },
        'wrk_ifl_sport_rubber_40': { name: 'Резиновое покрытие 40мм (детская)', unit: 'м²', price: 600, category: 'ind_floors' },
        'wrk_ifl_sport_tartan': { name: 'Покрытие Тартан (лёгкая атлетика)', unit: 'м²', price: 500, category: 'ind_floors' },
        // Промышленная разметка
        'wrk_ifl_mark_line': { name: 'Разметка пола (линия)', unit: 'м.п.', price: 20, category: 'ind_floors' },
        'wrk_ifl_mark_zone': { name: 'Разметка зон (краска)', unit: 'м²', price: 50, category: 'ind_floors' },
        'wrk_ifl_mark_epoxy_line': { name: 'Разметка эпоксидной краской', unit: 'м.п.', price: 40, category: 'ind_floors' }
    };
})();
