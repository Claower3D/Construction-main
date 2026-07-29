// === ФАЗА 3: КОММЕРЧЕСКИЕ ИНТЕРЬЕРЫ — МАГАЗИНЫ, РЕСТОРАНЫ, ОФИСЫ, ГОСТИНИЦЫ (100 поз.) ===
(function () {
    window.AI_WRK_COMMERCIAL_INTERIORS = {
        // === ТОРГОВЫЕ ПОМЕЩЕНИЯ ===
        'wrk_ci_shop_floor_tile': { name: 'Пол торгового зала (керамогр.)', unit: 'м²', price: 150, category: 'commercial_interiors' },
        'wrk_ci_shop_floor_lvt': { name: 'Пол торгового зала (LVT)', unit: 'м²', price: 100, category: 'commercial_interiors' },
        'wrk_ci_shop_ceil_arm': { name: 'Потолок Армстронг (магазин)', unit: 'м²', price: 60, category: 'commercial_interiors' },
        'wrk_ci_shop_ceil_grilj': { name: 'Потолок Грильято', unit: 'м²', price: 100, category: 'commercial_interiors' },
        'wrk_ci_shop_ceil_baffle': { name: 'Потолок реечный/кубообразный', unit: 'м²', price: 120, category: 'commercial_interiors' },
        'wrk_ci_shop_light_track': { name: 'Трек-освещение (магазин)', unit: 'м.п.', price: 100, category: 'commercial_interiors' },
        'wrk_ci_shop_light_led_panel': { name: 'LED панель встроенная', unit: 'шт', price: 80, category: 'commercial_interiors' },
        'wrk_ci_shop_showcase': { name: 'Витрина остеклённая', unit: 'м²', price: 500, category: 'commercial_interiors' },
        'wrk_ci_shop_shelving': { name: 'Торговые стеллажи (монтаж)', unit: 'м.п.', price: 200, category: 'commercial_interiors' },
        'wrk_ci_shop_checkout': { name: 'Кассовая зона (обустройство)', unit: 'шт', price: 3000, category: 'commercial_interiors' },
        'wrk_ci_shop_signage_ext': { name: 'Вывеска наружная (световая)', unit: 'м²', price: 500, category: 'commercial_interiors' },
        'wrk_ci_shop_signage_int': { name: 'Навигационные таблички', unit: 'шт', price: 100, category: 'commercial_interiors' },
        'wrk_ci_shop_fitting_room': { name: 'Примерочная кабина', unit: 'шт', price: 2000, category: 'commercial_interiors' },
        'wrk_ci_shop_anti_theft': { name: 'Противокражный рамки', unit: 'комплект', price: 5000, category: 'commercial_interiors' },
        'wrk_ci_shop_auto_door': { name: 'Автоматические двери (магазин)', unit: 'шт', price: 10000, category: 'commercial_interiors' },
        'wrk_ci_shop_air_curtain': { name: 'Воздушная завеса (магазин)', unit: 'шт', price: 3000, category: 'commercial_interiors' },

        // === РЕСТОРАНЫ / КАФЕ ===
        'wrk_ci_rest_kitchen_hood': { name: 'Вытяжной зонт (ресторан)', unit: 'м.п.', price: 2000, category: 'commercial_interiors' },
        'wrk_ci_rest_kitchen_floor': { name: 'Пол кухни (нескользящая плитка)', unit: 'м²', price: 200, category: 'commercial_interiors' },
        'wrk_ci_rest_kitchen_wall': { name: 'Стена кухни (нерж. панели)', unit: 'м²', price: 300, category: 'commercial_interiors' },
        'wrk_ci_rest_kitchen_drain': { name: 'Трап кухонный (нерж.)', unit: 'шт', price: 1000, category: 'commercial_interiors' },
        'wrk_ci_rest_bar_counter': { name: 'Барная стойка', unit: 'м.п.', price: 3000, category: 'commercial_interiors' },
        'wrk_ci_rest_bar_equipment': { name: 'Оборудование бара (подключение)', unit: 'комплект', price: 5000, category: 'commercial_interiors' },
        'wrk_ci_rest_grease_trap': { name: 'Жироуловитель (ресторан)', unit: 'шт', price: 5000, category: 'commercial_interiors' },
        'wrk_ci_rest_cold_room': { name: 'Холодильная камера (ресторан)', unit: 'шт', price: 10000, category: 'commercial_interiors' },
        'wrk_ci_rest_terrace': { name: 'Летняя терраса (обустройство)', unit: 'м²', price: 300, category: 'commercial_interiors' },

        // === ОФИСЫ ===
        'wrk_ci_office_partition_glass': { name: 'Офисн. перегородка (стекло)', unit: 'м²', price: 600, category: 'commercial_interiors' },
        'wrk_ci_office_partition_alu': { name: 'Офисн. перегородка (алюм.)', unit: 'м²', price: 400, category: 'commercial_interiors' },
        'wrk_ci_office_partition_mob': { name: 'Мобильная перегородка', unit: 'м²', price: 300, category: 'commercial_interiors' },
        'wrk_ci_office_floor_carpet': { name: 'Ковровая плитка (офис)', unit: 'м²', price: 80, category: 'commercial_interiors' },
        'wrk_ci_office_floor_raised': { name: 'Фальшпол (офис) 100мм', unit: 'м²', price: 200, category: 'commercial_interiors' },
        'wrk_ci_office_ceil_arm': { name: 'Потолок Armstrong (офис)', unit: 'м²', price: 60, category: 'commercial_interiors' },
        'wrk_ci_office_ceil_ecophon': { name: 'Потолок Ecophon (акустика)', unit: 'м²', price: 150, category: 'commercial_interiors' },
        'wrk_ci_office_reception': { name: 'Ресепшн (стойка)', unit: 'шт', price: 5000, category: 'commercial_interiors' },
        'wrk_ci_office_conf_av': { name: 'Конференц-зал (AV-оборудование)', unit: 'комплект', price: 10000, category: 'commercial_interiors' },
        'wrk_ci_office_kitchen': { name: 'Офисная кухня (мини)', unit: 'комплект', price: 5000, category: 'commercial_interiors' },

        // === ГОСТИНИЦЫ ===
        'wrk_ci_hotel_room_std': { name: 'Отделка номера (стандарт)', unit: 'номер', price: 10000, category: 'commercial_interiors' },
        'wrk_ci_hotel_room_lux': { name: 'Отделка номера (люкс)', unit: 'номер', price: 25000, category: 'commercial_interiors' },
        'wrk_ci_hotel_bathroom': { name: 'Санузел номера (комплекс)', unit: 'шт', price: 5000, category: 'commercial_interiors' },
        'wrk_ci_hotel_corridor': { name: 'Отделка коридора (гостиница)', unit: 'м²', price: 200, category: 'commercial_interiors' },
        'wrk_ci_hotel_lobby': { name: 'Отделка лобби (гостиница)', unit: 'м²', price: 500, category: 'commercial_interiors' },
        'wrk_ci_hotel_door_card': { name: 'Замок карточный (отель)', unit: 'шт', price: 1000, category: 'commercial_interiors' },
        'wrk_ci_hotel_minibar': { name: 'Мини-бар (монтаж)', unit: 'шт', price: 500, category: 'commercial_interiors' },

        // === САЛОНЫ КРАСОТЫ / МЕДЦЕНТРЫ ===
        'wrk_ci_salon_station': { name: 'Рабочее место мастера', unit: 'шт', price: 2000, category: 'commercial_interiors' },
        'wrk_ci_salon_wash': { name: 'Мойка парикмахерская (монтаж)', unit: 'шт', price: 1000, category: 'commercial_interiors' },
        'wrk_ci_salon_vent': { name: 'Местная вытяжка (маникюр)', unit: 'шт', price: 500, category: 'commercial_interiors' },
        'wrk_ci_gym_floor_rubber': { name: 'Резиновое покрытие (спортзал)', unit: 'м²', price: 150, category: 'commercial_interiors' },
        'wrk_ci_gym_mirror': { name: 'Зеркальная стена (спортзал)', unit: 'м²', price: 200, category: 'commercial_interiors' },
        'wrk_ci_gym_vent': { name: 'Усиленная вентиляция (спортзал)', unit: 'объект', price: 10000, category: 'commercial_interiors' }
    };
})();
