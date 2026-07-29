// === АКУСТИКА / ЗВУКОИЗОЛЯЦИЯ — стены, потолки, полы, студии, кинотеатры (50 поз.) ===
(function () {
    window.AI_WRK_ACOUSTICS = {
        // === ЗВУКОИЗОЛЯЦИЯ СТЕН === 1-10
        'wrk_ac_wall_minwool_50': { name: 'Зв/изоляция стены минватой 50мм', unit: 'м²', price: 550, category: 'acoustics' },
        'wrk_ac_wall_minwool_100': { name: 'Зв/изоляция стены минватой 100мм', unit: 'м²', price: 850, category: 'acoustics' },
        'wrk_ac_wall_gkl_15': { name: 'Обшивка ГКЛ Acoustics 15мм', unit: 'м²', price: 550, category: 'acoustics' },
        'wrk_ac_wall_gvl_12': { name: 'Обшивка ГВЛ 12.5мм', unit: 'м²', price: 550, category: 'acoustics' },
        'wrk_ac_wall_sandwich': { name: 'Панель ЗИПС (бескаркасная)', unit: 'м²', price: 2500, category: 'acoustics' },
        'wrk_ac_wall_soundblock': { name: 'Панель SoundBlock', unit: 'м²', price: 1500, category: 'acoustics' },
        'wrk_ac_wall_membrane': { name: 'Звукоизоляционная мембрана', unit: 'м²', price: 850, category: 'acoustics' },
        'wrk_ac_wall_vibroprofile': { name: 'Виброизолирующий профиль', unit: 'м.п.', price: 250, category: 'acoustics' },
        'wrk_ac_wall_sealant': { name: 'Виброакустический герметик', unit: 'м.п.', price: 55, category: 'acoustics' },
        'wrk_ac_wall_tape': { name: 'Демпферная лента', unit: 'м.п.', price: 25, category: 'acoustics' },
        // === ЗВУКОИЗОЛЯЦИЯ ПОТОЛКОВ === 11-16
        'wrk_ac_ceil_framework': { name: 'Каркас (Виброфикс)', unit: 'м²', price: 550, category: 'acoustics' },
        'wrk_ac_ceil_minwool_50': { name: 'Потолок минвата + ГКЛ 50мм', unit: 'м²', price: 850, category: 'acoustics' },
        'wrk_ac_ceil_minwool_100': { name: 'Потолок минвата + ГКЛ 100мм', unit: 'м²', price: 1200, category: 'acoustics' },
        'wrk_ac_ceil_zips': { name: 'Потолок ЗИПС', unit: 'м²', price: 2500, category: 'acoustics' },
        'wrk_ac_ceil_spring_hanger': { name: 'Виброподвес пружинный', unit: 'шт', price: 250, category: 'acoustics' },
        'wrk_ac_ceil_rubber_hanger': { name: 'Виброподвес резиновый', unit: 'шт', price: 120, category: 'acoustics' },
        // === ПЛАВАЮЩИЙ ПОЛ === 17-22
        'wrk_ac_floor_minwool_20': { name: 'Плавающий пол (мин. вата 20мм)', unit: 'м²', price: 550, category: 'acoustics' },
        'wrk_ac_floor_minwool_50': { name: 'Плавающий пол (мин. вата 50мм)', unit: 'м²', price: 850, category: 'acoustics' },
        'wrk_ac_floor_rubber': { name: 'Подложка резиновая (пол)', unit: 'м²', price: 350, category: 'acoustics' },
        'wrk_ac_floor_sylomer': { name: 'Sylomer (виброизоляция)', unit: 'м²', price: 1500, category: 'acoustics' },
        'wrk_ac_floor_stye': { name: 'Стяжка плавающая', unit: 'м²', price: 550, category: 'acoustics' },
        'wrk_ac_floor_split': { name: 'Разделительный слой (ПЭ)', unit: 'м²', price: 25, category: 'acoustics' },
        // === АКУСТИЧЕСКАЯ ОБРАБОТКА === 23-34
        'wrk_ac_absorber_wall': { name: 'Акустическая панель (стена 50мм)', unit: 'м²', price: 1500, category: 'acoustics' },
        'wrk_ac_absorber_ceil': { name: 'Акустическая панель (потолок)', unit: 'м²', price: 1500, category: 'acoustics' },
        'wrk_ac_absorber_cloud': { name: 'Акустическое облако (подвесное)', unit: 'шт', price: 5500, category: 'acoustics' },
        'wrk_ac_absorber_baffle': { name: 'Акустический бафл (вертик.)', unit: 'шт', price: 3500, category: 'acoustics' },
        'wrk_ac_bass_trap': { name: 'Басовая ловушка (угловая)', unit: 'шт', price: 3500, category: 'acoustics' },
        'wrk_ac_diffuser_1d': { name: 'Диффузор 1D (цилиндрич.)', unit: 'шт', price: 5500, category: 'acoustics' },
        'wrk_ac_diffuser_2d': { name: 'Диффузор 2D (QRD)', unit: 'шт', price: 8500, category: 'acoustics' },
        'wrk_ac_resonator': { name: 'Резонансный абсорбер', unit: 'шт', price: 5500, category: 'acoustics' },
        'wrk_ac_fabric_wall': { name: 'Акустическая ткань (стена)', unit: 'м²', price: 850, category: 'acoustics' },
        'wrk_ac_perforated_panel': { name: 'Перфорированная панель (акуст.)', unit: 'м²', price: 2500, category: 'acoustics' },
        // === СТУДИЙНЫЕ === 35-42
        'wrk_ac_room_in_room': { name: 'Комната-в-комнате (каркас)', unit: 'м²', price: 8500, category: 'acoustics' },
        'wrk_ac_studio_door': { name: 'Дверь студийная звукоизолир.', unit: 'шт', price: 55000, category: 'acoustics' },
        'wrk_ac_studio_window': { name: 'Окно студийное (3 стекла)', unit: 'шт', price: 55000, category: 'acoustics' },
        'wrk_ac_vocal_booth': { name: 'Вокальная кабина', unit: 'шт', price: 120000, category: 'acoustics' },
        'wrk_ac_control_room': { name: 'Аппаратная (акуст. обработка)', unit: 'м²', price: 5500, category: 'acoustics' },
        'wrk_ac_cinema_seat': { name: 'Кресло кинозала (акуст.)', unit: 'шт', price: 8500, category: 'acoustics' },
        'wrk_ac_cinema_screen': { name: 'Экран кинозала (перфорированный)', unit: 'м²', price: 3500, category: 'acoustics' },
        'wrk_ac_stage_floor': { name: 'Сценический пол (плавающий)', unit: 'м²', price: 3500, category: 'acoustics' },
        // === ВЕНТИЛЯЦИЯ (АКУСТ.) === 43-46
        'wrk_ac_vent_silencer': { name: 'Шумоглушитель вентиляции', unit: 'шт', price: 5500, category: 'acoustics' },
        'wrk_ac_vent_flexible': { name: 'Гибкий шумоглушащий воздуховод', unit: 'м.п.', price: 550, category: 'acoustics' },
        'wrk_ac_vent_transfer': { name: 'Переточная решётка (шумоизол.)', unit: 'шт', price: 1500, category: 'acoustics' },
        'wrk_ac_vent_lagging': { name: 'Обёртка воздуховодов (шум)', unit: 'м²', price: 550, category: 'acoustics' },
        // === ДОПЫ === 47-50
        'wrk_ac_measurement': { name: 'Акустическое измерение (RT60)', unit: 'помещение', price: 15000, category: 'acoustics' },
        'wrk_ac_modeling': { name: 'Акустическое моделирование', unit: 'проект', price: 55000, category: 'acoustics' },
        'wrk_ac_cert_iso': { name: 'Сертификация Rw (ISO 140)', unit: 'конструкция', price: 25000, category: 'acoustics' },
        'wrk_ac_commissioning': { name: 'ПНР акустических систем', unit: 'компл.', price: 25000, category: 'acoustics' }
    };
})();
