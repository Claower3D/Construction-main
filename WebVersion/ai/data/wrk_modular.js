// === ФАЗА 3: МОДУЛЬНЫЕ КОНСТРУКЦИИ, КОНТЕЙНЕРНЫЕ ДОМА, БЫСТРОВОЗВОДИМЫЕ, ТЕНТОВЫЕ (100 поз.) ===
(function () {
    window.AI_WRK_MODULAR = {
        // === БЛОК-КОНТЕЙНЕРЫ ===
        'wrk_mod_container_20ft': { name: 'Контейнер 20 футов (установка)', unit: 'шт', price: 20000, category: 'modular' },
        'wrk_mod_container_40ft': { name: 'Контейнер 40 футов (установка)', unit: 'шт', price: 30000, category: 'modular' },
        'wrk_mod_container_insul': { name: 'Утепление контейнера', unit: 'шт', price: 15000, category: 'modular' },
        'wrk_mod_container_window': { name: 'Вырез + окно в контейнере', unit: 'шт', price: 3000, category: 'modular' },
        'wrk_mod_container_door': { name: 'Вырез + дверь в контейнере', unit: 'шт', price: 5000, category: 'modular' },
        'wrk_mod_container_electric': { name: 'Электрика в контейнере', unit: 'шт', price: 5000, category: 'modular' },
        'wrk_mod_container_plumb': { name: 'Сантехника в контейнере', unit: 'шт', price: 5000, category: 'modular' },
        'wrk_mod_container_floor': { name: 'Отделка пола контейнера', unit: 'м²', price: 100, category: 'modular' },
        'wrk_mod_container_wall': { name: 'Отделка стен контейнера', unit: 'м²', price: 80, category: 'modular' },
        'wrk_mod_container_paint_ext': { name: 'Покраска контейнера (наружн.)', unit: 'м²', price: 30, category: 'modular' },

        // === МОДУЛЬНЫЕ ЗДАНИЯ ===
        'wrk_mod_office_6x2': { name: 'Модуль офисный 6×2.4м', unit: 'шт', price: 50000, category: 'modular' },
        'wrk_mod_office_6x3': { name: 'Модуль офисный 6×3м', unit: 'шт', price: 60000, category: 'modular' },
        'wrk_mod_office_9x3': { name: 'Модуль офисный 9×3м', unit: 'шт', price: 80000, category: 'modular' },
        'wrk_mod_office_12x3': { name: 'Модуль офисный 12×3м', unit: 'шт', price: 100000, category: 'modular' },
        'wrk_mod_sanitary': { name: 'Модуль санитарный', unit: 'шт', price: 40000, category: 'modular' },
        'wrk_mod_shower': { name: 'Модуль душевой', unit: 'шт', price: 35000, category: 'modular' },
        'wrk_mod_guardhouse': { name: 'Блок-пост охраны', unit: 'шт', price: 30000, category: 'modular' },
        'wrk_mod_storage': { name: 'Модуль складской', unit: 'шт', price: 25000, category: 'modular' },
        'wrk_mod_residential': { name: 'Модуль жилой', unit: 'шт', price: 60000, category: 'modular' },
        'wrk_mod_kitchen_catering': { name: 'Модуль кухня/столовая', unit: 'шт', price: 80000, category: 'modular' },

        // === ВРЕМЕННЫЕ СООРУЖЕНИЯ (СТРОЙКА) ===
        'wrk_tmp_fence_prof': { name: 'Временный забор (профнастил)', unit: 'м.п.', price: 200, category: 'modular' },
        'wrk_tmp_fence_mesh': { name: 'Временный забор (сетка)', unit: 'м.п.', price: 100, category: 'modular' },
        'wrk_tmp_road': { name: 'Временная дорога (щебень)', unit: 'м²', price: 50, category: 'modular' },
        'wrk_tmp_road_plates': { name: 'Временная дорога (ж/б плиты)', unit: 'м²', price: 100, category: 'modular' },
        'wrk_tmp_office': { name: 'Прорабская (вагончик)', unit: 'шт', price: 20000, category: 'modular' },
        'wrk_tmp_toilet_bio': { name: 'Биотуалет (аренд. точка)', unit: 'шт', price: 1000, category: 'modular' },
        'wrk_tmp_power_box': { name: 'Временное электроснабжение', unit: 'объект', price: 10000, category: 'modular' },
        'wrk_tmp_crane_rental': { name: 'Аренда крана (смена)', unit: 'смена', price: 15000, category: 'modular' },
        'wrk_tmp_loader_rental': { name: 'Аренда погрузчика (смена)', unit: 'смена', price: 5000, category: 'modular' },

        // === ТЕНТОВЫЕ / КАРКАСНО-ТЕНТОВЫЕ ===
        'wrk_tent_arch_10x20': { name: 'Тент арочный 10×20м', unit: 'шт', price: 50000, category: 'modular' },
        'wrk_tent_arch_15x30': { name: 'Тент арочный 15×30м', unit: 'шт', price: 80000, category: 'modular' },
        'wrk_tent_arch_20x40': { name: 'Тент арочный 20×40м', unit: 'шт', price: 120000, category: 'modular' },
        'wrk_tent_frame_10x10': { name: 'Тент каркасный 10×10м', unit: 'шт', price: 30000, category: 'modular' },
        'wrk_tent_frame_10x20': { name: 'Тент каркасный 10×20м', unit: 'шт', price: 50000, category: 'modular' },
        'wrk_tent_pvc_cover': { name: 'ПВХ-покрытие тента', unit: 'м²', price: 50, category: 'modular' },
        'wrk_tent_heating': { name: 'Обогрев тентового сооружения', unit: 'объект', price: 10000, category: 'modular' },
        'wrk_tent_lighting': { name: 'Освещение тентового сооружения', unit: 'объект', price: 5000, category: 'modular' },

        // === БЫСТРОВОЗВОДИМЫЕ (ЛМК) ===
        'wrk_lmk_frame_300': { name: 'Каркас ЛМК до 300м²', unit: 'объект', price: 200000, category: 'modular' },
        'wrk_lmk_frame_500': { name: 'Каркас ЛМК до 500м²', unit: 'объект', price: 350000, category: 'modular' },
        'wrk_lmk_frame_1000': { name: 'Каркас ЛМК до 1000м²', unit: 'объект', price: 600000, category: 'modular' },
        'wrk_lmk_frame_2000': { name: 'Каркас ЛМК до 2000м²', unit: 'объект', price: 1000000, category: 'modular' },
        'wrk_lmk_sandwich_wall': { name: 'Обшивка стен сэндвич-панелями (ЛМК)', unit: 'м²', price: 300, category: 'modular' },
        'wrk_lmk_sandwich_roof': { name: 'Кровля сэндвич-панелями (ЛМК)', unit: 'м²', price: 350, category: 'modular' },
        'wrk_lmk_profsheet_wall': { name: 'Обшивка профлистом (ЛМК)', unit: 'м²', price: 150, category: 'modular' },
        'wrk_lmk_profsheet_roof': { name: 'Кровля профлистом (ЛМК)', unit: 'м²', price: 180, category: 'modular' },
        'wrk_lmk_gate_sliding': { name: 'Ворота откатные (ЛМК)', unit: 'шт', price: 20000, category: 'modular' },
        'wrk_lmk_gate_sectional': { name: 'Ворота секционные (ЛМК)', unit: 'шт', price: 15000, category: 'modular' },
        'wrk_lmk_window_insert': { name: 'Окно в сэндвич-панели', unit: 'шт', price: 3000, category: 'modular' },
        'wrk_lmk_door_insert': { name: 'Дверь в сэндвич-панели', unit: 'шт', price: 5000, category: 'modular' }
    };
})();
