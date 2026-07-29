// === ГИДРОИЗОЛЯЦИЯ (35 позиций) ===
(function () {
    window.AI_MAT_WATERPROOF = {
        // Обмазочная (битумная)
        'wp_bitum_cold_10': { name: 'Мастика битумная холодная (10кг)', unit: 'ведро', price: 1800, category: 'waterproof' },
        'wp_bitum_cold_20': { name: 'Мастика битумная холодная (20кг)', unit: 'ведро', price: 3200, category: 'waterproof' },
        'wp_bitum_hot_25': { name: 'Мастика битумная горячая (25кг)', unit: 'мешок', price: 1500, category: 'waterproof' },
        'wp_bitum_rubber_10': { name: 'Мастика битумно-каучуковая (10кг)', unit: 'ведро', price: 2500, category: 'waterproof' },
        'wp_bitum_rubber_20': { name: 'Мастика битумно-каучуковая (20кг)', unit: 'ведро', price: 4500, category: 'waterproof' },

        // Обмазочная (полимерная / для ванных)
        'wp_polymer_7': { name: 'Гидроизоляция полимерная (7кг)', unit: 'ведро', price: 3500, category: 'waterproof' },
        'wp_polymer_14': { name: 'Гидроизоляция полимерная (14кг)', unit: 'ведро', price: 6000, category: 'waterproof' },
        'wp_cement_20': { name: 'Гидроизоляция цементная (20кг)', unit: 'мешок', price: 2500, category: 'waterproof' },

        // Рулонная самоклеящаяся
        'wp_roll_self_1x10': { name: 'Гидроизоляция рулонная самоклеящаяся (10м²)', unit: 'рулон', price: 3500, category: 'waterproof' },

        // Проникающая
        'wp_penetrating_5': { name: 'Гидроизоляция проникающая Пенетрон (5кг)', unit: 'ведро', price: 5000, category: 'waterproof' },
        'wp_penetrating_10': { name: 'Гидроизоляция проникающая (10кг)', unit: 'ведро', price: 8000, category: 'waterproof' },

        // Ленты гидроизоляционные
        'wp_tape_100': { name: 'Лента гидроизоляционная 100мм (10м)', unit: 'шт', price: 1200, category: 'waterproof' },
        'wp_tape_120': { name: 'Лента гидроизоляционная 120мм (10м)', unit: 'шт', price: 1500, category: 'waterproof' },
        'wp_corner_inner': { name: 'Уголок гидроизоляционный внутренний', unit: 'шт', price: 200, category: 'waterproof' },
        'wp_corner_outer': { name: 'Уголок гидроизоляционный наружный', unit: 'шт', price: 200, category: 'waterproof' },
        'wp_manchette': { name: 'Манжета гидроизоляционная (для трубы)', unit: 'шт', price: 300, category: 'waterproof' },

        // Мембраны
        'wp_membrane_hdpe_1': { name: 'Мембрана профилированная HDPE (1×20м)', unit: 'рулон', price: 3000, category: 'waterproof' },
        'wp_membrane_hdpe_2': { name: 'Мембрана профилированная HDPE (2×20м)', unit: 'рулон', price: 5500, category: 'waterproof' },
        'wp_geomembrane_1mm': { name: 'Геомембрана HDPE 1мм (м²)', unit: 'м²', price: 350, category: 'waterproof' },

        // Дренажные материалы
        'drain_pipe_110_perf': { name: 'Труба дренажная перфорированная Ø110мм (50м)', unit: 'бухта', price: 5000, category: 'waterproof' },
        'drain_pipe_160_perf': { name: 'Труба дренажная перфорированная Ø160мм (50м)', unit: 'бухта', price: 8000, category: 'waterproof' },
        'drain_pipe_200_perf': { name: 'Труба дренажная Ø200мм (50м)', unit: 'бухта', price: 12000, category: 'waterproof' },
        'drain_well_315': { name: 'Колодец дренажный смотровой Ø315', unit: 'шт', price: 3000, category: 'waterproof' },
        'drain_well_460': { name: 'Колодец дренажный сборный Ø460', unit: 'шт', price: 6000, category: 'waterproof' },

        // Геотекстиль
        'geotextile_100': { name: 'Геотекстиль 100 г/м² (1.5×50м)', unit: 'рулон', price: 4000, category: 'waterproof' },
        'geotextile_150': { name: 'Геотекстиль 150 г/м² (1.5×50м)', unit: 'рулон', price: 5500, category: 'waterproof' },
        'geotextile_200': { name: 'Геотекстиль 200 г/м² (1.5×50м)', unit: 'рулон', price: 7000, category: 'waterproof' },
        'geotextile_300': { name: 'Геотекстиль 300 г/м² (2×50м)', unit: 'рулон', price: 12000, category: 'waterproof' },

        // Гидрошпонка / бентонитовый шнур
        'bentonite_cord_20mm': { name: 'Бентонитовый шнур 20×25мм (5м)', unit: 'шт', price: 1500, category: 'waterproof' },
        'water_stop_pvc': { name: 'Гидрошпонка ПВХ 200мм (п.м.)', unit: 'п.м.', price: 350, category: 'waterproof' },

        // Праймер
        'primer_bitum_20l': { name: 'Праймер битумный (20л)', unit: 'шт', price: 2500, category: 'waterproof' },

        // Отмостка
        'blind_area_tile': { name: 'Плитка тротуарная для отмостки (40мм)', unit: 'м²', price: 1200, category: 'waterproof' },

        // Ливнёвка
        'storm_channel_1m': { name: 'Лоток ливневый пластиковый (1м)', unit: 'шт', price: 800, category: 'waterproof' },
        'storm_grate_1m': { name: 'Решётка для лотка (1м)', unit: 'шт', price: 500, category: 'waterproof' },
        'storm_inlet': { name: 'Дождеприёмник 300×300', unit: 'шт', price: 1200, category: 'waterproof' }
    };
})();
