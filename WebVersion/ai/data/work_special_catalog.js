// === КАТАЛОГ РАБОТ: СПЕЦИАЛЬНЫЕ РАБОТЫ (80 позиций) ===
(function () {
    window.AI_WORK_SPECIAL_CATALOG = {
        // === СВАРОЧНЫЕ РАБОТЫ ===
        'work_weld_pipe_steel': { name: 'Сварка стальных труб', unit: 'стык', price: 500, category: 'work_special' },
        'work_weld_pipe_ppr': { name: 'Пайка ППР труб', unit: 'стык', price: 100, category: 'work_special' },
        'work_weld_frame': { name: 'Сварка металлоконструкций', unit: 'кг', price: 30, category: 'work_special' },
        'work_weld_fence': { name: 'Сварка каркаса забора', unit: 'м.п.', price: 300, category: 'work_special' },
        'work_weld_stair': { name: 'Изготовление металлической лестницы', unit: 'шт', price: 20000, category: 'work_special' },
        'work_weld_railing': { name: 'Изготовление перил (сварных)', unit: 'м.п.', price: 2000, category: 'work_special' },
        'work_weld_gate': { name: 'Изготовление металлических ворот', unit: 'шт', price: 15000, category: 'work_special' },
        'work_weld_canopy': { name: 'Изготовление металлического навеса', unit: 'м²', price: 1500, category: 'work_special' },
        // === СТОЛЯРНЫЕ РАБОТЫ ===
        'work_carp_shelf': { name: 'Изготовление полок (дерево)', unit: 'м.п.', price: 500, category: 'work_special' },
        'work_carp_railing_wood': { name: 'Монтаж деревянных перил', unit: 'м.п.', price: 1500, category: 'work_special' },
        'work_carp_stair_wood': { name: 'Обшивка лестницы деревом', unit: 'ступень', price: 2000, category: 'work_special' },
        'work_carp_countertop': { name: 'Установка столешницы (дерево/камень)', unit: 'м.п.', price: 1000, category: 'work_special' },
        'work_carp_built_in_closet': { name: 'Сборка встроенного шкафа', unit: 'шт', price: 5000, category: 'work_special' },
        'work_carp_kitchen_assemble': { name: 'Сборка и установка кухни', unit: 'м.п.', price: 2000, category: 'work_special' },
        'work_carp_furniture_assemble': { name: 'Сборка мебели (корпусной)', unit: 'шт', price: 1000, category: 'work_special' },
        'work_carp_wainscot': { name: 'Обшивка стен вагонкой', unit: 'м²', price: 300, category: 'work_special' },
        'work_carp_wainscot_ceiling': { name: 'Обшивка потолка вагонкой', unit: 'м²', price: 350, category: 'work_special' },
        'work_carp_imitation_bar': { name: 'Обшивка стен имитацией бруса', unit: 'м²', price: 350, category: 'work_special' },
        // === УБОРКА / ПОДГОТОВКА ===
        'work_cleanup_rough': { name: 'Уборка строительная (грубая)', unit: 'м²', price: 30, category: 'work_special' },
        'work_cleanup_fine': { name: 'Уборка строительная (тонкая)', unit: 'м²', price: 50, category: 'work_special' },
        'work_cleanup_after_repair': { name: 'Уборка после ремонта (финишная)', unit: 'м²', price: 80, category: 'work_special' },
        'work_debris_remove': { name: 'Вынос строительного мусора', unit: 'мешок', price: 50, category: 'work_special' },
        'work_debris_container': { name: 'Вывоз контейнера мусора', unit: 'конт.', price: 5000, category: 'work_special' },
        // === ЗАМЕРЫ / ПРОЕКТИРОВАНИЕ ===
        'work_measure_apt': { name: 'Обмеры квартиры', unit: 'шт', price: 3000, category: 'work_special' },
        'work_measure_house': { name: 'Обмеры дома', unit: 'шт', price: 5000, category: 'work_special' },
        'work_design_apt': { name: 'Дизайн-проект квартиры', unit: 'м²', price: 1000, category: 'work_special' },
        'work_design_house': { name: 'Дизайн-проект дома', unit: 'м²', price: 1200, category: 'work_special' },
        'work_project_arch': { name: 'Архитектурный проект дома', unit: 'шт', price: 50000, category: 'work_special' },
        'work_project_construct': { name: 'Конструктивный раздел проекта', unit: 'шт', price: 30000, category: 'work_special' },
        'work_estimate_create': { name: 'Составление сметы', unit: 'шт', price: 5000, category: 'work_special' },
        // === ДЕРЕВЯННОЕ СТРОИТЕЛЬСТВО ===
        'work_frame_wall': { name: 'Возведение каркасной стены', unit: 'м²', price: 500, category: 'work_special' },
        'work_frame_floor': { name: 'Устройство каркасного перекрытия', unit: 'м²', price: 400, category: 'work_special' },
        'work_log_build': { name: 'Сборка сруба (бревно)', unit: 'м²', price: 1500, category: 'work_special' },
        'work_timber_build': { name: 'Сборка дома из бруса', unit: 'м²', price: 800, category: 'work_special' },
        'work_sip_build': { name: 'Сборка дома из SIP-панелей', unit: 'м²', price: 600, category: 'work_special' },
        'work_wood_treat': { name: 'Обработка дерева антисептиком', unit: 'м²', price: 50, category: 'work_special' },
        'work_wood_stain': { name: 'Покрытие дерева лаком/маслом/морилкой', unit: 'м²', price: 100, category: 'work_special' },
        // === БАССЕЙНЫ / САУНЫ ===
        'work_sauna_turnkey': { name: 'Монтаж сауны «под ключ»', unit: 'м²', price: 5000, category: 'work_special' },
        'work_sauna_stove': { name: 'Установка банной печи', unit: 'шт', price: 3000, category: 'work_special' },
        'work_sauna_bench': { name: 'Устройство полкóв в сауне', unit: 'м²', price: 2000, category: 'work_special' },
        'work_pool_tile': { name: 'Облицовка бассейна плиткой', unit: 'м²', price: 1500, category: 'work_special' },
        'work_pool_equipment': { name: 'Монтаж оборудования бассейна', unit: 'компл.', price: 20000, category: 'work_special' },
        // === ГАЗОСНАБЖЕНИЕ ===
        'work_gas_pipe_install': { name: 'Монтаж газопровода внутреннего', unit: 'м.п.', price: 500, category: 'work_special' },
        'work_gas_boiler_connect': { name: 'Подключение газового котла', unit: 'шт', price: 5000, category: 'work_special' },
        'work_gas_stove_connect': { name: 'Подключение газовой плиты', unit: 'шт', price: 1000, category: 'work_special' },
        'work_gas_meter_install': { name: 'Установка газового счётчика', unit: 'шт', price: 2000, category: 'work_special' },
        'work_gas_project': { name: 'Проект газоснабжения', unit: 'шт', price: 20000, category: 'work_special' },
        // === АНТИКОРРОЗИЙНАЯ ОБРАБОТКА ===
        'work_anticorr_metal': { name: 'Антикоррозийная обработка металла', unit: 'м²', price: 100, category: 'work_special' },
        'work_sandblast': { name: 'Пескоструйная обработка', unit: 'м²', price: 200, category: 'work_special' },
        // === ТРАНСПОРТИРОВКА / ПОДЪЁМ ===
        'work_cargo_lift_floor': { name: 'Подъём материалов на этаж', unit: 'этаж·т', price: 500, category: 'work_special' },
        'work_cargo_crane': { name: 'Работа автокрана (час)', unit: 'час', price: 5000, category: 'work_special' },
        'work_cargo_lift_manual': { name: 'Ручной подъём (без лифта)', unit: 'т', price: 1000, category: 'work_special' },
        'work_delivery_city': { name: 'Доставка материалов (по городу)', unit: 'рейс', price: 3000, category: 'work_special' },
        // === РЕСТАВРАЦИЯ ===
        'work_restore_brick': { name: 'Реставрация кирпичной кладки', unit: 'м²', price: 2000, category: 'work_special' },
        'work_restore_stucco': { name: 'Реставрация лепнины', unit: 'м.п.', price: 3000, category: 'work_special' },
        'work_restore_floor_wood': { name: 'Реставрация деревянного пола', unit: 'м²', price: 500, category: 'work_special' },
        // === УМНЫЙ ДОМ ===
        'work_smart_hub_setup': { name: 'Настройка системы умного дома', unit: 'шт', price: 5000, category: 'work_special' },
        'work_smart_scene_program': { name: 'Программирование сценариев', unit: 'шт', price: 1000, category: 'work_special' },
        'work_smart_device_install': { name: 'Установка умного устройства', unit: 'шт', price: 300, category: 'work_special' },
        // === СОЛНЕЧНАЯ ЭНЕРГЕТИКА ===
        'work_solar_panel_mount': { name: 'Монтаж солнечной панели', unit: 'шт', price: 1000, category: 'work_special' },
        'work_solar_inverter_install': { name: 'Установка инвертора + АКБ', unit: 'компл.', price: 5000, category: 'work_special' },
        'work_solar_system_design': { name: 'Проектирование солнечной системы', unit: 'шт', price: 10000, category: 'work_special' }
    };
})();
