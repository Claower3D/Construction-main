// === ВОДОПОДГОТОВКА И ВОДООЧИСТКА — фильтрация, умягчение, обезжелезивание, УФ (48 поз.) ===
(function () {
    window.AI_WRK_WATERTREAT = {
        // === МЕХАНИЧЕСКАЯ ФИЛЬТРАЦИЯ === 1-8
        'wrk_wt_filter_mesh': { name: 'Сетчатый фильтр грубой очистки', unit: 'шт', price: 1500, category: 'watertreat' },
        'wrk_wt_filter_disc': { name: 'Дисковый фильтр', unit: 'шт', price: 3500, category: 'watertreat' },
        'wrk_wt_filter_cartridge': { name: 'Картриджный фильтр (корпус)', unit: 'шт', price: 2500, category: 'watertreat' },
        'wrk_wt_filter_bag': { name: 'Мешочный фильтр', unit: 'шт', price: 5500, category: 'watertreat' },
        'wrk_wt_filter_sand': { name: 'Фильтр осадочный (песок/АГ)', unit: 'шт', price: 25000, category: 'watertreat' },
        'wrk_wt_filter_multimedia': { name: 'Мультимедийный фильтр', unit: 'шт', price: 35000, category: 'watertreat' },
        'wrk_wt_filter_self_clean': { name: 'Самопромывной фильтр', unit: 'шт', price: 15000, category: 'watertreat' },
        'wrk_wt_separator_cyclone': { name: 'Циклонный сепаратор', unit: 'шт', price: 8500, category: 'watertreat' },
        // === УМЯГЧЕНИЕ === 9-14
        'wrk_wt_softener_cab_10': { name: 'Умягчитель кабинетный (1м³/ч)', unit: 'шт', price: 25000, category: 'watertreat' },
        'wrk_wt_softener_col_10': { name: 'Умягчитель колонный (1м³/ч)', unit: 'шт', price: 35000, category: 'watertreat' },
        'wrk_wt_softener_col_25': { name: 'Умягчитель колонный (2.5м³/ч)', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_softener_col_50': { name: 'Умягчитель колонный (5м³/ч)', unit: 'шт', price: 85000, category: 'watertreat' },
        'wrk_wt_softener_duplex': { name: 'Умягчитель дуплекс (непрерывный)', unit: 'шт', price: 120000, category: 'watertreat' },
        'wrk_wt_salt_tank': { name: 'Солевой бак', unit: 'шт', price: 5500, category: 'watertreat' },
        // === ОБЕЗЖЕЛЕЗИВАНИЕ === 15-20
        'wrk_wt_iron_aeration': { name: 'Аэрационная колонна', unit: 'шт', price: 25000, category: 'watertreat' },
        'wrk_wt_iron_compressor': { name: 'Компрессор аэрации', unit: 'шт', price: 8500, category: 'watertreat' },
        'wrk_wt_iron_filter_10': { name: 'Обезжелезиватель (1м³/ч)', unit: 'шт', price: 35000, category: 'watertreat' },
        'wrk_wt_iron_filter_25': { name: 'Обезжелезиватель (2.5м³/ч)', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_iron_filter_50': { name: 'Обезжелезиватель (5м³/ч)', unit: 'шт', price: 85000, category: 'watertreat' },
        'wrk_wt_manganese_filter': { name: 'Фильтр деманганации', unit: 'шт', price: 35000, category: 'watertreat' },
        // === ОБРАТНЫЙ ОСМОС === 21-26
        'wrk_wt_ro_domestic': { name: 'Обратный осмос бытовой', unit: 'шт', price: 8500, category: 'watertreat' },
        'wrk_wt_ro_250': { name: 'Обратный осмос 250л/ч', unit: 'шт', price: 120000, category: 'watertreat' },
        'wrk_wt_ro_1000': { name: 'Обратный осмос 1000л/ч', unit: 'шт', price: 350000, category: 'watertreat' },
        'wrk_wt_ro_5000': { name: 'Обратный осмос 5000л/ч', unit: 'шт', price: 1200000, category: 'watertreat' },
        'wrk_wt_ro_tank': { name: 'Накопительный бак (пермеат)', unit: 'шт', price: 15000, category: 'watertreat' },
        'wrk_wt_ro_pump': { name: 'Насос высокого давления (RO)', unit: 'шт', price: 25000, category: 'watertreat' },
        // === ОБЕЗЗАРАЖИВАНИЕ === 27-32
        'wrk_wt_uv_10': { name: 'УФ-обеззараживатель (1м³/ч)', unit: 'шт', price: 8500, category: 'watertreat' },
        'wrk_wt_uv_50': { name: 'УФ-обеззараживатель (5м³/ч)', unit: 'шт', price: 25000, category: 'watertreat' },
        'wrk_wt_uv_100': { name: 'УФ-обеззараживатель (10м³/ч)', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_chlorine_dosing': { name: 'Станция дозирования хлора', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_ozone': { name: 'Озонатор', unit: 'шт', price: 120000, category: 'watertreat' },
        'wrk_wt_chlorine_di': { name: 'Станция диоксида хлора', unit: 'шт', price: 250000, category: 'watertreat' },
        // === КАНАЛИЗАЦИЯ / СТОКИ === 33-40
        'wrk_wt_grease_trap_sm': { name: 'Жироуловитель (до 1л/с)', unit: 'шт', price: 15000, category: 'watertreat' },
        'wrk_wt_grease_trap_lg': { name: 'Жироуловитель (до 5л/с)', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_oil_separator': { name: 'Нефтеуловитель/маслоотделитель', unit: 'шт', price: 85000, category: 'watertreat' },
        'wrk_wt_septic_3m3': { name: 'Септик 3м³', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_septic_5m3': { name: 'Септик 5м³', unit: 'шт', price: 85000, category: 'watertreat' },
        'wrk_wt_bio_station_5': { name: 'Биостанция (5 чел)', unit: 'шт', price: 85000, category: 'watertreat' },
        'wrk_wt_bio_station_10': { name: 'Биостанция (10 чел)', unit: 'шт', price: 120000, category: 'watertreat' },
        'wrk_wt_bio_station_50': { name: 'Биостанция (50 чел)', unit: 'шт', price: 550000, category: 'watertreat' },
        // === ДОПЫ === 41-48
        'wrk_wt_ph_correction': { name: 'Корректор pH', unit: 'шт', price: 25000, category: 'watertreat' },
        'wrk_wt_carbon_filter': { name: 'Угольный сорбционный фильтр', unit: 'шт', price: 25000, category: 'watertreat' },
        'wrk_wt_degas': { name: 'Дегазатор', unit: 'шт', price: 35000, category: 'watertreat' },
        'wrk_wt_analyzer_online': { name: 'Онлайн анализатор воды', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_control_panel': { name: 'Шкаф автоматики водоподготовки', unit: 'шт', price: 55000, category: 'watertreat' },
        'wrk_wt_piping': { name: 'Обвязка оборудования (ПВХ/ПЭ)', unit: 'компл.', price: 15000, category: 'watertreat' },
        'wrk_wt_commissioning': { name: 'ПНР системы водоподготовки', unit: 'компл.', price: 25000, category: 'watertreat' }
    };
})();
