// === НАРУЖНОЕ ОСВЕЩЕНИЕ — уличное, архитектурное, ландшафтное, парковое (50 поз.) ===
(function () {
    window.AI_WRK_OUTDOOR_LIGHT = {
        // === УЛИЧНОЕ ОСВЕЩЕНИЕ === 1-12
        'wrk_ol_pole_steel_6': { name: 'Установка опоры освещения h=6м', unit: 'шт', price: 15000, category: 'outdoorlight' },
        'wrk_ol_pole_steel_8': { name: 'Установка опоры освещения h=8м', unit: 'шт', price: 18000, category: 'outdoorlight' },
        'wrk_ol_pole_steel_10': { name: 'Установка опоры освещения h=10м', unit: 'шт', price: 25000, category: 'outdoorlight' },
        'wrk_ol_pole_steel_12': { name: 'Установка опоры освещения h=12м', unit: 'шт', price: 35000, category: 'outdoorlight' },
        'wrk_ol_pole_decorative': { name: 'Опора декоративная (чугун/литьё)', unit: 'шт', price: 55000, category: 'outdoorlight' },
        'wrk_ol_fixture_led_50': { name: 'Светильник LED 50Вт', unit: 'шт', price: 5500, category: 'outdoorlight' },
        'wrk_ol_fixture_led_100': { name: 'Светильник LED 100Вт', unit: 'шт', price: 8500, category: 'outdoorlight' },
        'wrk_ol_fixture_led_150': { name: 'Светильник LED 150Вт', unit: 'шт', price: 12000, category: 'outdoorlight' },
        'wrk_ol_fixture_led_200': { name: 'Светильник LED 200Вт', unit: 'шт', price: 15000, category: 'outdoorlight' },
        'wrk_ol_fixture_led_300': { name: 'Светильник LED 300Вт', unit: 'шт', price: 25000, category: 'outdoorlight' },
        'wrk_ol_bracket_single': { name: 'Кронштейн одинарный', unit: 'шт', price: 2500, category: 'outdoorlight' },
        'wrk_ol_bracket_double': { name: 'Кронштейн двойной', unit: 'шт', price: 3500, category: 'outdoorlight' },
        // === АРХИТЕКТУРНАЯ ПОДСВЕТКА === 13-22
        'wrk_ol_arch_wall_wash': { name: 'Настенный заливающий (wall washer)', unit: 'шт', price: 8500, category: 'outdoorlight' },
        'wrk_ol_arch_narrow_beam': { name: 'Узколучевой (narrow beam)', unit: 'шт', price: 5500, category: 'outdoorlight' },
        'wrk_ol_arch_linear': { name: 'Линейный LED (фасад)', unit: 'м.п.', price: 3500, category: 'outdoorlight' },
        'wrk_ol_arch_flood_rgb': { name: 'Прожектор RGB (фасадный)', unit: 'шт', price: 12000, category: 'outdoorlight' },
        'wrk_ol_arch_gobo': { name: 'Гобо-проектор', unit: 'шт', price: 15000, category: 'outdoorlight' },
        'wrk_ol_arch_media_facade': { name: 'Медиафасад (LED пиксель)', unit: 'м²', price: 35000, category: 'outdoorlight' },
        'wrk_ol_arch_contour': { name: 'Контурная подсветка (LED дюралайт)', unit: 'м.п.', price: 550, category: 'outdoorlight' },
        'wrk_ol_arch_neon_flex': { name: 'Гибкий неон (фасад)', unit: 'м.п.', price: 850, category: 'outdoorlight' },
        'wrk_ol_arch_column_light': { name: 'Подсветка колонн', unit: 'шт', price: 8500, category: 'outdoorlight' },
        'wrk_ol_arch_dmx': { name: 'Контроллер DMX (управление подсветкой)', unit: 'шт', price: 25000, category: 'outdoorlight' },
        // === ЛАНДШАФТНОЕ ОСВЕЩЕНИЕ === 23-34
        'wrk_ol_garden_bollard': { name: 'Столбик ландшафтный LED', unit: 'шт', price: 3500, category: 'outdoorlight' },
        'wrk_ol_garden_path': { name: 'Грунтовый путевой LED', unit: 'шт', price: 2500, category: 'outdoorlight' },
        'wrk_ol_garden_spike': { name: 'Прожектор на колышке (дерево)', unit: 'шт', price: 2500, category: 'outdoorlight' },
        'wrk_ol_garden_inground': { name: 'Грунтовый встраиваемый LED', unit: 'шт', price: 5500, category: 'outdoorlight' },
        'wrk_ol_garden_wall_sm': { name: 'Настенный светильник (фасад дома)', unit: 'шт', price: 2500, category: 'outdoorlight' },
        'wrk_ol_garden_post_top': { name: 'Фонарь-торшер (парковый)', unit: 'шт', price: 12000, category: 'outdoorlight' },
        'wrk_ol_garden_stepping': { name: 'Подсветка ступеней (наружная)', unit: 'шт', price: 1500, category: 'outdoorlight' },
        'wrk_ol_garden_underwater': { name: 'Подводный светильник LED', unit: 'шт', price: 5500, category: 'outdoorlight' },
        'wrk_ol_garden_solar': { name: 'Солнечный светильник (автономный)', unit: 'шт', price: 2500, category: 'outdoorlight' },
        'wrk_ol_garden_string': { name: 'Гирлянда уличная LED', unit: 'м.п.', price: 350, category: 'outdoorlight' },
        'wrk_ol_garden_festoon': { name: 'Ретро-гирлянда (лампочки)', unit: 'м.п.', price: 550, category: 'outdoorlight' },
        'wrk_ol_garden_fiber': { name: 'Оптоволоконная подсветка (ландшафт)', unit: 'компл.', price: 25000, category: 'outdoorlight' },
        // === КАБЕЛЬНАЯ ИНФРАСТРУКТУРА === 35-42
        'wrk_ol_cable_trench': { name: 'Траншея под кабель освещения', unit: 'м.п.', price: 350, category: 'outdoorlight' },
        'wrk_ol_cable_vvg_3x25': { name: 'Кабель ВВГ 3×2.5 (наружный)', unit: 'м.п.', price: 55, category: 'outdoorlight' },
        'wrk_ol_cable_vvg_5x4': { name: 'Кабель ВВГ 5×4 (магистраль)', unit: 'м.п.', price: 120, category: 'outdoorlight' },
        'wrk_ol_cable_duct': { name: 'Труба ПНД Ø50 (защита кабеля)', unit: 'м.п.', price: 55, category: 'outdoorlight' },
        'wrk_ol_panel_outdoor': { name: 'Шкаф управления наружным освещением', unit: 'шт', price: 55000, category: 'outdoorlight' },
        'wrk_ol_photocell': { name: 'Фотореле', unit: 'шт', price: 850, category: 'outdoorlight' },
        'wrk_ol_timer_astro': { name: 'Астрономический таймер', unit: 'шт', price: 3500, category: 'outdoorlight' },
        'wrk_ol_ground_loop': { name: 'Контур заземления (освещение)', unit: 'компл.', price: 8500, category: 'outdoorlight' },
        // === СПЕЦПОДСВЕТКА === 43-48
        'wrk_ol_sign_illuminated': { name: 'Подсветка вывески/логотипа', unit: 'шт', price: 15000, category: 'outdoorlight' },
        'wrk_ol_flag_pole': { name: 'Подсветка флагштока', unit: 'шт', price: 5500, category: 'outdoorlight' },
        'wrk_ol_monument': { name: 'Подсветка памятника/скульптуры', unit: 'шт', price: 8500, category: 'outdoorlight' },
        'wrk_ol_fountain': { name: 'Подсветка фонтана', unit: 'компл.', price: 35000, category: 'outdoorlight' },
        'wrk_ol_bridge_illumin': { name: 'Подсветка пешеходного моста', unit: 'компл.', price: 120000, category: 'outdoorlight' },
        'wrk_ol_holiday_decor': { name: 'Праздничная иллюминация', unit: 'компл.', price: 55000, category: 'outdoorlight' }
    };
})();
