// === ФАЗА 3: БЛАГОУСТРОЙСТВО, ЛАНДШАФТНЫЙ ДИЗАЙН, БАССЕЙНЫ, САУНЫ (250+ поз.) ===
(function () {
    // === БЛАГОУСТРОЙСТВО ТЕРРИТОРИИ ===
    window.AI_WRK_LANDSCAPE = {
        // Тротуарная плитка
        'wrk_lnd_paving_vibro_40': { name: 'Тротуарная плитка вибропресс 40мм', unit: 'м²', price: 200, category: 'landscape' },
        'wrk_lnd_paving_vibro_60': { name: 'Тротуарная плитка вибропресс 60мм', unit: 'м²', price: 250, category: 'landscape' },
        'wrk_lnd_paving_vibro_80': { name: 'Тротуарная плитка вибропресс 80мм', unit: 'м²', price: 300, category: 'landscape' },
        'wrk_lnd_paving_vibrolit': { name: 'Тротуарная плитка вибролитая', unit: 'м²', price: 250, category: 'landscape' },
        'wrk_lnd_paving_base_sand': { name: 'Основание (песок/щебень) под плитку', unit: 'м²', price: 50, category: 'landscape' },
        'wrk_lnd_paving_base_conc': { name: 'Основание (бетонное) под плитку', unit: 'м²', price: 100, category: 'landscape' },
        'wrk_lnd_paving_curb': { name: 'Бордюр тротуарный', unit: 'м.п.', price: 50, category: 'landscape' },
        'wrk_lnd_paving_curb_garden': { name: 'Бордюр садовый', unit: 'м.п.', price: 30, category: 'landscape' },
        // Дорожки и площадки
        'wrk_lnd_path_gravel': { name: 'Дорожка из щебня/гравия', unit: 'м²', price: 50, category: 'landscape' },
        'wrk_lnd_path_decorative': { name: 'Дорожка декоративная (плитняк)', unit: 'м²', price: 200, category: 'landscape' },
        'wrk_lnd_path_concrete': { name: 'Дорожка бетонная', unit: 'м²', price: 100, category: 'landscape' },
        'wrk_lnd_path_wood_deck': { name: 'Дорожка деревянная (настил)', unit: 'м²', price: 300, category: 'landscape' },
        'wrk_lnd_path_rubber': { name: 'Покрытие резиновое (дорожка)', unit: 'м²', price: 200, category: 'landscape' },
        // Озеленение
        'wrk_lnd_lawn_seed': { name: 'Засев газона (семена)', unit: 'м²', price: 20, category: 'landscape' },
        'wrk_lnd_lawn_roll': { name: 'Рулонный газон (укладка)', unit: 'м²', price: 100, category: 'landscape' },
        'wrk_lnd_lawn_prep': { name: 'Подготовка грунта под газон', unit: 'м²', price: 30, category: 'landscape' },
        'wrk_lnd_lawn_auto_water': { name: 'Система автополива (монтаж)', unit: 'м²', price: 80, category: 'landscape' },
        'wrk_lnd_lawn_robo': { name: 'Робот-газонокосилка (установка)', unit: 'шт', price: 5000, category: 'landscape' },
        'wrk_lnd_tree_plant_xl': { name: 'Посадка крупномера (6м+)', unit: 'шт', price: 10000, category: 'landscape' },
        'wrk_lnd_hedge': { name: 'Живая изгородь (высадка)', unit: 'м.п.', price: 300, category: 'landscape' },
        'wrk_lnd_flower_bed': { name: 'Клумба (устройство)', unit: 'м²', price: 100, category: 'landscape' },
        'wrk_lnd_flower_annual': { name: 'Высадка однолетников', unit: 'м²', price: 50, category: 'landscape' },
        'wrk_lnd_soil_import': { name: 'Завоз плодородного грунта', unit: 'м³', price: 100, category: 'landscape' },
        // Малые архитектурные формы
        'wrk_lnd_bench': { name: 'Скамейка (установка)', unit: 'шт', price: 500, category: 'landscape' },
        'wrk_lnd_urn': { name: 'Урна (установка)', unit: 'шт', price: 200, category: 'landscape' },
        'wrk_lnd_pergola': { name: 'Пергола (монтаж)', unit: 'шт', price: 5000, category: 'landscape' },
        'wrk_lnd_arbor_simple': { name: 'Беседка простая', unit: 'шт', price: 10000, category: 'landscape' },
        'wrk_lnd_arbor_premium': { name: 'Беседка (премиум)', unit: 'шт', price: 30000, category: 'landscape' },
        'wrk_lnd_playground': { name: 'Детская площадка (комплект)', unit: 'шт', price: 30000, category: 'landscape' },
        'wrk_lnd_swing': { name: 'Качели (установка)', unit: 'шт', price: 5000, category: 'landscape' },
        'wrk_lnd_fountain': { name: 'Фонтан (установка)', unit: 'шт', price: 20000, category: 'landscape' },
        'wrk_lnd_pond': { name: 'Декоративный пруд', unit: 'шт', price: 15000, category: 'landscape' },
        'wrk_lnd_dry_creek': { name: 'Сухой ручей', unit: 'м.п.', price: 200, category: 'landscape' },
        'wrk_lnd_retaining_wall': { name: 'Подпорная стена', unit: 'м.п.', price: 2000, category: 'landscape' },
        'wrk_lnd_gabion': { name: 'Габион', unit: 'м³', price: 2000, category: 'landscape' },
        'wrk_lnd_steps_ext': { name: 'Наружная лестница (ступени)', unit: 'ступень', price: 500, category: 'landscape' },
        // Освещение наружное
        'wrk_lnd_light_pole': { name: 'Столб уличного освещения', unit: 'шт', price: 3000, category: 'landscape' },
        'wrk_lnd_light_bollard': { name: 'Светильник-столбик', unit: 'шт', price: 1000, category: 'landscape' },
        'wrk_lnd_light_inground': { name: 'Встраиваемый грунтовый', unit: 'шт', price: 500, category: 'landscape' },
        'wrk_lnd_light_facade': { name: 'Фасадная подсветка', unit: 'шт', price: 300, category: 'landscape' },
        'wrk_lnd_light_solar': { name: 'Солнечный светильник', unit: 'шт', price: 200, category: 'landscape' },
        'wrk_lnd_light_cable_gnd': { name: 'Подземный кабель (освещение)', unit: 'м.п.', price: 30, category: 'landscape' },
        // Террасная доска
        'wrk_lnd_deck_wood': { name: 'Терраса из доски (дерево)', unit: 'м²', price: 400, category: 'landscape' },
        'wrk_lnd_deck_wpc': { name: 'Терраса из ДПК', unit: 'м²', price: 350, category: 'landscape' },
        'wrk_lnd_deck_frame': { name: 'Каркас террасы (лаги)', unit: 'м²', price: 100, category: 'landscape' },
        // Дренаж
        'wrk_lnd_drain_surface': { name: 'Поверхностный дренаж (лоток)', unit: 'м.п.', price: 200, category: 'landscape' },
        'wrk_lnd_drain_deep': { name: 'Глубинный дренаж (труба)', unit: 'м.п.', price: 300, category: 'landscape' },
        'wrk_lnd_rainwater_tank': { name: 'Ёмкость ливневая (установка)', unit: 'шт', price: 5000, category: 'landscape' },
        // Навесы / козырьки
        'wrk_lnd_canopy_poly': { name: 'Навес из поликарбоната', unit: 'м²', price: 600, category: 'landscape' },
        'wrk_lnd_canopy_metal': { name: 'Навес из металлопрофиля', unit: 'м²', price: 500, category: 'landscape' },
        'wrk_lnd_canopy_glass': { name: 'Навес стеклянный', unit: 'м²', price: 2000, category: 'landscape' },
        'wrk_lnd_canopy_fabric': { name: 'Маркиза тканевая', unit: 'м²', price: 500, category: 'landscape' }
    };

    // === БАССЕЙНЫ ===
    window.AI_WRK_POOL = {
        'wrk_pool_concrete_small': { name: 'Бассейн бетонный (до 20м³)', unit: 'шт', price: 200000, category: 'pool' },
        'wrk_pool_concrete_medium': { name: 'Бассейн бетонный (20-50м³)', unit: 'шт', price: 400000, category: 'pool' },
        'wrk_pool_concrete_large': { name: 'Бассейн бетонный (50-100м³)', unit: 'шт', price: 700000, category: 'pool' },
        'wrk_pool_composite': { name: 'Бассейн композитный (чаша)', unit: 'шт', price: 150000, category: 'pool' },
        'wrk_pool_overflow': { name: 'Бассейн переливной', unit: 'шт', price: 500000, category: 'pool' },
        'wrk_pool_pvc_liner': { name: 'ПВХ плёнка бассейна', unit: 'м²', price: 200, category: 'pool' },
        'wrk_pool_pump': { name: 'Насосное оборудование бассейна', unit: 'компл.', price: 30000, category: 'pool' },
        'wrk_pool_filter': { name: 'Фильтрация бассейна (монтаж)', unit: 'компл.', price: 20000, category: 'pool' },
        'wrk_pool_heating': { name: 'Подогрев бассейна', unit: 'компл.', price: 15000, category: 'pool' },
        'wrk_pool_cover_auto': { name: 'Покрытие автоматическое', unit: 'шт', price: 50000, category: 'pool' },
        'wrk_pool_cover_manual': { name: 'Покрытие ручное (тент)', unit: 'шт', price: 5000, category: 'pool' },
        'wrk_pool_counter_current': { name: 'Противоток', unit: 'шт', price: 20000, category: 'pool' },
        'wrk_pool_jacuzzi': { name: 'Гидромассаж (форсунки)', unit: 'компл.', price: 15000, category: 'pool' },
        'wrk_pool_waterfall': { name: 'Водопад декоративный', unit: 'шт', price: 10000, category: 'pool' }
    };

    // === САУНЫ / ХАММАМ / SPA ===
    window.AI_WRK_SAUNA = {
        'wrk_saun_finnish_small': { name: 'Сауна финская (до 4м²)', unit: 'шт', price: 50000, category: 'sauna' },
        'wrk_saun_finnish_medium': { name: 'Сауна финская (4-8м²)', unit: 'шт', price: 80000, category: 'sauna' },
        'wrk_saun_finnish_large': { name: 'Сауна финская (8-12м²)', unit: 'шт', price: 120000, category: 'sauna' },
        'wrk_saun_russian': { name: 'Русская баня (кладка)', unit: 'объект', price: 150000, category: 'sauna' },
        'wrk_saun_ir_cabin': { name: 'ИК-кабина', unit: 'шт', price: 30000, category: 'sauna' },
        'wrk_saun_hammam': { name: 'Хаммам (устройство)', unit: 'м²', price: 5000, category: 'sauna' },
        'wrk_saun_hammam_boiler': { name: 'Парогенератор хаммам', unit: 'шт', price: 20000, category: 'sauna' },
        'wrk_saun_lining_lipa': { name: 'Обшивка вагонкой (липа)', unit: 'м²', price: 200, category: 'sauna' },
        'wrk_saun_lining_cedar': { name: 'Обшивка вагонкой (кедр)', unit: 'м²', price: 350, category: 'sauna' },
        'wrk_saun_lining_abash': { name: 'Обшивка вагонкой (абаш)', unit: 'м²', price: 300, category: 'sauna' },
        'wrk_saun_bench': { name: 'Полоки (устройство)', unit: 'м.п.', price: 500, category: 'sauna' },
        'wrk_saun_heater_elec': { name: 'Электрокаменка (установка)', unit: 'шт', price: 5000, category: 'sauna' },
        'wrk_saun_heater_wood': { name: 'Дровяная печь для бани', unit: 'шт', price: 10000, category: 'sauna' },
        'wrk_saun_vent': { name: 'Вентиляция сауны', unit: 'компл.', price: 5000, category: 'sauna' },
        'wrk_saun_door_glass': { name: 'Дверь стеклянная для сауны', unit: 'шт', price: 3000, category: 'sauna' },
        'wrk_saun_foil': { name: 'Фольгированная пароизоляция', unit: 'м²', price: 20, category: 'sauna' },
        'wrk_saun_shower_cabin': { name: 'Душевая кабина (SPA)', unit: 'шт', price: 10000, category: 'sauna' },
        'wrk_saun_plunge_pool': { name: 'Купель / окунальная ванна', unit: 'шт', price: 15000, category: 'sauna' }
    };
})();
