// === ФАЗА 3: ОЧИСТНЫЕ СООРУЖЕНИЯ, ВОДОПОДГОТОВКА, НАСОСНЫЕ СТАНЦИИ, ПОЖАРОТУШЕНИЕ (130 поз.) ===
(function () {
    window.AI_WRK_WATER_TREATMENT = {
        // === ЛОКАЛЬНЫЕ ОЧИСТНЫЕ ===
        'wrk_wt_septic_1m3': { name: 'Септик 1м³ (монтаж)', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_septic_2m3': { name: 'Септик 2м³ (монтаж)', unit: 'шт', price: 7000, category: 'water_treatment' },
        'wrk_wt_septic_3m3': { name: 'Септик 3м³ (монтаж)', unit: 'шт', price: 10000, category: 'water_treatment' },
        'wrk_wt_septic_5m3': { name: 'Септик 5м³ (монтаж)', unit: 'шт', price: 15000, category: 'water_treatment' },
        'wrk_wt_aero_5': { name: 'Аэрационная станция (5 чел.)', unit: 'шт', price: 20000, category: 'water_treatment' },
        'wrk_wt_aero_10': { name: 'Аэрационная станция (10 чел.)', unit: 'шт', price: 30000, category: 'water_treatment' },
        'wrk_wt_aero_20': { name: 'Аэрационная станция (20 чел.)', unit: 'шт', price: 50000, category: 'water_treatment' },
        'wrk_wt_aero_50': { name: 'Аэрационная станция (50 чел.)', unit: 'шт', price: 80000, category: 'water_treatment' },
        'wrk_wt_grease_trap_1': { name: 'Жироуловитель 1 л/с', unit: 'шт', price: 3000, category: 'water_treatment' },
        'wrk_wt_grease_trap_3': { name: 'Жироуловитель 3 л/с', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_grease_trap_5': { name: 'Жироуловитель 5 л/с', unit: 'шт', price: 8000, category: 'water_treatment' },
        'wrk_wt_oil_sep_5': { name: 'Нефтеуловитель 5 л/с', unit: 'шт', price: 10000, category: 'water_treatment' },
        'wrk_wt_oil_sep_10': { name: 'Нефтеуловитель 10 л/с', unit: 'шт', price: 15000, category: 'water_treatment' },
        'wrk_wt_drainfield': { name: 'Поле фильтрации (дренажное)', unit: 'м.п.', price: 200, category: 'water_treatment' },
        'wrk_wt_infiltrator': { name: 'Инфильтратор', unit: 'шт', price: 1000, category: 'water_treatment' },
        'wrk_wt_sand_filter': { name: 'Песчаный фильтр (для септика)', unit: 'шт', price: 5000, category: 'water_treatment' },

        // === ВОДОПОДГОТОВКА ===
        'wrk_wt_iron_removal': { name: 'Станция обезжелезивания', unit: 'шт', price: 10000, category: 'water_treatment' },
        'wrk_wt_softener': { name: 'Умягчитель воды', unit: 'шт', price: 8000, category: 'water_treatment' },
        'wrk_wt_carbon_filter': { name: 'Угольный фильтр', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_uv_sterilizer': { name: 'УФ-стерилизатор', unit: 'шт', price: 3000, category: 'water_treatment' },
        'wrk_wt_ro_household': { name: 'Обратный осмос (бытовой)', unit: 'шт', price: 1000, category: 'water_treatment' },
        'wrk_wt_ro_commercial': { name: 'Обратный осмос (промышл.)', unit: 'шт', price: 20000, category: 'water_treatment' },
        'wrk_wt_sediment_filter': { name: 'Механический фильтр грубой очистки', unit: 'шт', price: 500, category: 'water_treatment' },
        'wrk_wt_cartridge_filter': { name: 'Картриджный фильтр', unit: 'шт', price: 200, category: 'water_treatment' },
        'wrk_wt_dosing_pump': { name: 'Дозирующий насос', unit: 'шт', price: 3000, category: 'water_treatment' },
        'wrk_wt_storage_tank_500': { name: 'Накопительный бак 500л', unit: 'шт', price: 2000, category: 'water_treatment' },
        'wrk_wt_storage_tank_1000': { name: 'Накопительный бак 1000л', unit: 'шт', price: 3000, category: 'water_treatment' },
        'wrk_wt_storage_tank_2000': { name: 'Накопительный бак 2000л', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_storage_tank_5000': { name: 'Накопительный бак 5000л', unit: 'шт', price: 8000, category: 'water_treatment' },

        // === НАСОСНЫЕ СТАНЦИИ ===
        'wrk_wt_pump_submers_1': { name: 'Скважинный насос 1м³/ч', unit: 'шт', price: 3000, category: 'water_treatment' },
        'wrk_wt_pump_submers_3': { name: 'Скважинный насос 3м³/ч', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_pump_submers_5': { name: 'Скважинный насос 5м³/ч', unit: 'шт', price: 8000, category: 'water_treatment' },
        'wrk_wt_pump_submers_10': { name: 'Скважинный насос 10м³/ч', unit: 'шт', price: 15000, category: 'water_treatment' },
        'wrk_wt_pump_station_auto': { name: 'Автомат. насосная станция', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_pump_booster': { name: 'Повысительный насос', unit: 'шт', price: 3000, category: 'water_treatment' },
        'wrk_wt_hydro_tank_24': { name: 'Гидроаккумулятор 24л', unit: 'шт', price: 500, category: 'water_treatment' },
        'wrk_wt_hydro_tank_50': { name: 'Гидроаккумулятор 50л', unit: 'шт', price: 800, category: 'water_treatment' },
        'wrk_wt_hydro_tank_100': { name: 'Гидроаккумулятор 100л', unit: 'шт', price: 1200, category: 'water_treatment' },
        'wrk_wt_hydro_tank_200': { name: 'Гидроаккумулятор 200л', unit: 'шт', price: 2000, category: 'water_treatment' },
        'wrk_wt_kns_5': { name: 'КНС (канализ. насос. ст.) 5м³/ч', unit: 'шт', price: 15000, category: 'water_treatment' },
        'wrk_wt_kns_10': { name: 'КНС (канализ. насос. ст.) 10м³/ч', unit: 'шт', price: 25000, category: 'water_treatment' },
        'wrk_wt_kns_20': { name: 'КНС (канализ. насос. ст.) 20м³/ч', unit: 'шт', price: 40000, category: 'water_treatment' },

        // === ВНУТРЕННИЙ ПРОТИВОПОЖАРНЫЙ ВОДОПРОВОД ===
        'wrk_wt_fire_hose_box': { name: 'Пожарный шкаф (ШПК)', unit: 'шт', price: 1000, category: 'water_treatment' },
        'wrk_wt_fire_pump_main': { name: 'Основной пожарный насос', unit: 'шт', price: 20000, category: 'water_treatment' },
        'wrk_wt_fire_pump_jockey': { name: 'Жокей-насос (подпиточный)', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_fire_tank_10': { name: 'Пожарный резервуар 10м³', unit: 'шт', price: 15000, category: 'water_treatment' },
        'wrk_wt_fire_tank_25': { name: 'Пожарный резервуар 25м³', unit: 'шт', price: 30000, category: 'water_treatment' },
        'wrk_wt_fire_tank_50': { name: 'Пожарный резервуар 50м³', unit: 'шт', price: 50000, category: 'water_treatment' },

        // === ЛИВНЁВКА (допол.) ===
        'wrk_wt_storm_grate_250': { name: 'Ливнёвая решётка 250мм', unit: 'шт', price: 200, category: 'water_treatment' },
        'wrk_wt_storm_grate_500': { name: 'Ливнёвая решётка 500мм', unit: 'шт', price: 400, category: 'water_treatment' },
        'wrk_wt_storm_channel_100': { name: 'Водоотводный лоток 100мм', unit: 'м.п.', price: 100, category: 'water_treatment' },
        'wrk_wt_storm_channel_200': { name: 'Водоотводный лоток 200мм', unit: 'м.п.', price: 150, category: 'water_treatment' },
        'wrk_wt_storm_channel_300': { name: 'Водоотводный лоток 300мм', unit: 'м.п.', price: 250, category: 'water_treatment' },
        'wrk_wt_storm_tank': { name: 'Ёмкость для сбора дождевой воды', unit: 'шт', price: 5000, category: 'water_treatment' },
        'wrk_wt_storm_separator': { name: 'Ливнёвый сепаратор', unit: 'шт', price: 10000, category: 'water_treatment' }
    };
})();
