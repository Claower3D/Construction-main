// === СПЕЦРАБОТЫ — алмазная резка, промальпинизм, демонтаж, рентген, вынос коммуникаций (55 поз.) ===
(function () {
    window.AI_WRK_SPECWORKS = {
        // === АЛМАЗНАЯ РЕЗКА === 1-10
        'wrk_sw_diamond_wall_100': { name: 'Алмазная резка стены 100мм', unit: 'м.п.', price: 1200, category: 'specworks' },
        'wrk_sw_diamond_wall_150': { name: 'Алмазная резка стены 150мм', unit: 'м.п.', price: 1800, category: 'specworks' },
        'wrk_sw_diamond_wall_200': { name: 'Алмазная резка стены 200мм', unit: 'м.п.', price: 2500, category: 'specworks' },
        'wrk_sw_diamond_wall_300': { name: 'Алмазная резка стены 300мм', unit: 'м.п.', price: 3500, category: 'specworks' },
        'wrk_sw_diamond_floor_150': { name: 'Алмазная резка перекрытия 150мм', unit: 'м.п.', price: 2500, category: 'specworks' },
        'wrk_sw_diamond_floor_200': { name: 'Алмазная резка перекрытия 200мм', unit: 'м.п.', price: 3500, category: 'specworks' },
        'wrk_sw_diamond_floor_300': { name: 'Алмазная резка перекрытия 300мм', unit: 'м.п.', price: 5500, category: 'specworks' },
        'wrk_sw_diamond_drill_50': { name: 'Алмазное бурение Ø50', unit: 'шт', price: 1200, category: 'specworks' },
        // === ПРОМЫШЛЕННЫЙ АЛЬПИНИЗМ === 11-18
        'wrk_sw_rope_facade_paint': { name: 'Покраска фасада (промальп)', unit: 'м²', price: 550, category: 'specworks' },
        'wrk_sw_rope_facade_repair': { name: 'Ремонт фасада (промальп)', unit: 'м²', price: 850, category: 'specworks' },
        'wrk_sw_rope_facade_sealant': { name: 'Герметизация межпанельных швов (промальп)', unit: 'м.п.', price: 550, category: 'specworks' },
        'wrk_sw_rope_window_wash': { name: 'Мойка окон (промальп)', unit: 'м²', price: 200, category: 'specworks' },
        'wrk_sw_rope_sign_install': { name: 'Монтаж вывески (промальп)', unit: 'м²', price: 2500, category: 'specworks' },
        'wrk_sw_rope_antenna_install': { name: 'Монтаж антенны (промальп)', unit: 'шт', price: 15000, category: 'specworks' },
        'wrk_sw_rope_inspect': { name: 'Обследование фасада (промальп)', unit: 'м²', price: 150, category: 'specworks' },
        // === ВЗРЫВНЫЕ РАБОТЫ / СПЕЦДЕМОНТАЖ === 19-24
        'wrk_sw_blast_rock': { name: 'Взрывные работы (горная порода)', unit: 'м³', price: 1500, category: 'specworks' },
        'wrk_sw_blast_building': { name: 'Направленный взрыв (снос здания)', unit: 'объект', price: 5500000, category: 'specworks' },
        'wrk_sw_robot_demo': { name: 'Демонтаж роботом (Brokk)', unit: 'м³', price: 8500, category: 'specworks' },
        'wrk_sw_hydraulic_shears': { name: 'Демонтаж гидроножницами', unit: 'т', price: 5500, category: 'specworks' },
        'wrk_sw_wire_sawing': { name: 'Канатная резка бетона', unit: 'м²', price: 12000, category: 'specworks' },
        'wrk_sw_wall_sawing': { name: 'Резка стенорезной машиной', unit: 'м²', price: 8500, category: 'specworks' },
        // === РЕНТГЕН И НК БЕТОНА === 25-30
        'wrk_sw_xray_concrete': { name: 'Рентген бетона', unit: 'снимок', price: 5500, category: 'specworks' },
        'wrk_sw_ferroscan': { name: 'Ферроскан (поиск арматуры)', unit: 'м²', price: 350, category: 'specworks' },
        'wrk_sw_rebound_hammer': { name: 'Склерометрия (молоток Шмидта)', unit: 'точка', price: 550, category: 'specworks' },
        'wrk_sw_pull_out_test': { name: 'Метод отрыва (pull-out)', unit: 'точка', price: 1200, category: 'specworks' },
        'wrk_sw_ultrasonic_test': { name: 'УЗК бетона', unit: 'точка', price: 850, category: 'specworks' },
        // === ВЫНОС КОММУНИКАЦИЙ === 31-37
        'wrk_sw_relocate_water': { name: 'Перенос водопровода', unit: 'м.п.', price: 2500, category: 'specworks' },
        'wrk_sw_relocate_sewer': { name: 'Перенос канализации', unit: 'м.п.', price: 3500, category: 'specworks' },
        'wrk_sw_relocate_gas': { name: 'Перенос газопровода', unit: 'м.п.', price: 5500, category: 'specworks' },
        'wrk_sw_relocate_cable': { name: 'Перенос кабельной линии', unit: 'м.п.', price: 1500, category: 'specworks' },
        'wrk_sw_relocate_heat': { name: 'Перенос теплотрассы', unit: 'м.п.', price: 5500, category: 'specworks' },
        'wrk_sw_relocate_telecom': { name: 'Перенос линии связи', unit: 'м.п.', price: 850, category: 'specworks' },
        'wrk_sw_utility_detect': { name: 'Поиск скрытых коммуникаций (трассоискатель)', unit: 'м.п.', price: 250, category: 'specworks' },
        // === АНТИКОРРОЗИЙНАЯ ЗАЩИТА === 38-44
        'wrk_sw_anticor_sandblast': { name: 'Пескоструйная очистка металла', unit: 'м²', price: 550, category: 'specworks' },
        'wrk_sw_anticor_primer': { name: 'Грунтовка металла (1 слой)', unit: 'м²', price: 120, category: 'specworks' },
        'wrk_sw_anticor_paint_2': { name: 'Покраска металла (2 слоя)', unit: 'м²', price: 250, category: 'specworks' },
        'wrk_sw_anticor_paint_3': { name: 'Покраска металла (3 слоя)', unit: 'м²', price: 380, category: 'specworks' },
        // === ВРЕМЕННЫЕ СООРУЖЕНИЯ === 45-52
        'wrk_sw_scaffold_ring': { name: 'Монтаж клиновых лесов', unit: 'м²', price: 180, category: 'specworks' },
        'wrk_sw_scaffold_tower': { name: 'Монтаж вышки-туры', unit: 'шт', price: 8500, category: 'specworks' },
        'wrk_sw_temp_fence': { name: 'Устройство временного ограждения', unit: 'м.п.', price: 550, category: 'specworks' },
    };
})();
