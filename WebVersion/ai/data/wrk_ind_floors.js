// === ПРОМЫШЛЕННЫЕ ПОЛЫ — бетонные, топпинг, полимерные, уличные (48 поз.) ===
(function () {
    window.AI_WRK_IND_FLOORS = {
        // === БЕТОННЫЕ ПОЛЫ === 1-10
        'wrk_if_slab_100': { name: 'Бетонный пол 100мм (B25)', unit: 'м²', price: 850, category: 'indfloors' },
        'wrk_if_slab_150': { name: 'Бетонный пол 150мм (B25)', unit: 'м²', price: 1200, category: 'indfloors' },
        'wrk_if_slab_200': { name: 'Бетонный пол 200мм (B30)', unit: 'м²', price: 1500, category: 'indfloors' },
        'wrk_if_slab_250': { name: 'Бетонный пол 250мм (B30)', unit: 'м²', price: 1800, category: 'indfloors' },
        'wrk_if_slab_300': { name: 'Бетонный пол 300мм (B35)', unit: 'м²', price: 2500, category: 'indfloors' },
        'wrk_if_rebar_mesh': { name: 'Армирование сеткой 150×150×6', unit: 'м²', price: 250, category: 'indfloors' },
        'wrk_if_rebar_double': { name: 'Двойное армирование', unit: 'м²', price: 450, category: 'indfloors' },
        'wrk_if_fiber_steel': { name: 'Фибробетон (стальная фибра)', unit: 'м²', price: 350, category: 'indfloors' },
        'wrk_if_fiber_pp': { name: 'Фибробетон (пропилен)', unit: 'м²', price: 120, category: 'indfloors' },
        // === ТОППИНГ === 11-16
        'wrk_if_topping_quartz_3': { name: 'Топпинг кварцевый 3кг/м²', unit: 'м²', price: 250, category: 'indfloors' },
        'wrk_if_topping_quartz_5': { name: 'Топпинг кварцевый 5кг/м²', unit: 'м²', price: 350, category: 'indfloors' },
        'wrk_if_topping_corun_5': { name: 'Топпинг корундовый 5кг/м²', unit: 'м²', price: 550, category: 'indfloors' },
        'wrk_if_topping_corun_7': { name: 'Топпинг корундовый 7кг/м²', unit: 'м²', price: 850, category: 'indfloors' },
        'wrk_if_topping_metal': { name: 'Топпинг металлический', unit: 'м²', price: 1200, category: 'indfloors' },
        'wrk_if_cure_compound': { name: 'Обработка кьюрингом', unit: 'м²', price: 55, category: 'indfloors' },
        // === ПОЛИМЕРНЫЕ ПОЛЫ === 17-26
        'wrk_if_epoxy_thin': { name: 'Эпоксидное покрытие (тонкослойное)', unit: 'м²', price: 550, category: 'indfloors' },
        'wrk_if_epoxy_self_5': { name: 'Эпоксидный наливной 5мм', unit: 'м²', price: 2500, category: 'indfloors' },
        'wrk_if_pu_thin': { name: 'Полиуретановое покрытие (тонкосл.)', unit: 'м²', price: 550, category: 'indfloors' },
        'wrk_if_pu_self_4': { name: 'Полиуретановый наливной 4мм', unit: 'м²', price: 2500, category: 'indfloors' },
        'wrk_if_mma': { name: 'Метилметакрилатный пол (MMA)', unit: 'м²', price: 2500, category: 'indfloors' },
        'wrk_if_epoxy_esd': { name: 'Эпоксидный ESD (антистатический)', unit: 'м²', price: 2500, category: 'indfloors' },
        'wrk_if_epoxy_flake': { name: 'Эпоксид с чипсами (декоративный)', unit: 'м²', price: 1500, category: 'indfloors' },
        // === ПОДГОТОВКА ОСНОВАНИЯ === 27-32
        'wrk_if_grind_diamond': { name: 'Шлифовка алмазными сегментами', unit: 'м²', price: 250, category: 'indfloors' },
        'wrk_if_shotblast': { name: 'Дробеструйная обработка', unit: 'м²', price: 350, category: 'indfloors' },
        'wrk_if_frez': { name: 'Фрезерование бетона', unit: 'м²', price: 350, category: 'indfloors' },
        'wrk_if_primer_epoxy': { name: 'Эпоксидный праймер', unit: 'м²', price: 120, category: 'indfloors' },
        'wrk_if_repair_mortar': { name: 'Ремонтная шпатлёвка', unit: 'м²', price: 250, category: 'indfloors' },
        'wrk_if_joint_fill': { name: 'Герметизация швов (ПУ)', unit: 'м.п.', price: 150, category: 'indfloors' },
        // === ПОЛИРОВАННЫЙ БЕТОН === 33-36
        'wrk_if_polish_800': { name: 'Полировка бетона (800 грит)', unit: 'м²', price: 850, category: 'indfloors' },
        'wrk_if_polish_1500': { name: 'Полировка бетона (1500 грит)', unit: 'м²', price: 1200, category: 'indfloors' },
        'wrk_if_polish_3000': { name: 'Полировка бетона (3000 грит)', unit: 'м²', price: 1800, category: 'indfloors' },
        'wrk_if_densifier': { name: 'Уплотнитель бетона (литиевый)', unit: 'м²', price: 120, category: 'indfloors' },
        // === СПЕЦ. ПОКРЫТИЯ === 37-42
        'wrk_if_acid_resist': { name: 'Кислотостойкое покрытие', unit: 'м²', price: 3500, category: 'indfloors' },
        'wrk_if_food_grade': { name: 'Покрытие пищевое (HACCP)', unit: 'м²', price: 2500, category: 'indfloors' },
        'wrk_if_cold_storage': { name: 'Покрытие для морозильных камер', unit: 'м²', price: 3500, category: 'indfloors' },
        'wrk_if_non_slip': { name: 'Противоскользящее покрытие', unit: 'м²', price: 1500, category: 'indfloors' },
        'wrk_if_waterproof': { name: 'Гидроизоляционное покрытие пола', unit: 'м²', price: 1200, category: 'indfloors' },
        'wrk_if_radiant_barrier': { name: 'Теплоотражающий барьер (пол)', unit: 'м²', price: 250, category: 'indfloors' },
        // === ДОПЫ === 43-48
        'wrk_if_ramp_concrete': { name: 'Бетонная рампа (пандус)', unit: 'м²', price: 2500, category: 'indfloors' },
        'wrk_if_trench_drain': { name: 'Лотковый дренаж в полу', unit: 'м.п.', price: 3500, category: 'indfloors' },
        'wrk_if_bollard_embed': { name: 'Закладная под колёсоотбойник', unit: 'шт', price: 550, category: 'indfloors' },
        'wrk_if_marking_line': { name: 'Разметка пола (краска)', unit: 'м.п.', price: 55, category: 'indfloors' },
        'wrk_if_marking_tape': { name: 'Разметка пола (лента)', unit: 'м.п.', price: 120, category: 'indfloors' },
        'wrk_if_demo_old_floor': { name: 'Демонтаж старого покрытия пола', unit: 'м²', price: 250, category: 'indfloors' }
    };
})();
