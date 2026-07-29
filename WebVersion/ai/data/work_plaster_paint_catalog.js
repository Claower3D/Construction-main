// === КАТАЛОГ РАБОТ: ШТУКАТУРНЫЕ И МАЛЯРНЫЕ РАБОТЫ (70 позиций) ===
(function () {
    window.AI_WORK_PLASTER_PAINT_CATALOG = {
        // Штукатурка стен
        'work_plaster_cement_manual': { name: 'Штукатурка стен цементная (ручная)', unit: 'м²', price: 350, category: 'work_plaster' },
        'work_plaster_cement_machine': { name: 'Штукатурка стен цементная (машинная)', unit: 'м²', price: 250, category: 'work_plaster' },
        'work_plaster_gypsum_manual': { name: 'Штукатурка стен гипсовая (ручная)', unit: 'м²', price: 300, category: 'work_plaster' },
        'work_plaster_gypsum_machine': { name: 'Штукатурка стен гипсовая (машинная)', unit: 'м²', price: 220, category: 'work_plaster' },
        'work_plaster_cement_thick': { name: 'Штукатурка стен (слой > 30мм, с сеткой)', unit: 'м²', price: 450, category: 'work_plaster' },
        'work_plaster_beacon_set': { name: 'Установка маяков под штукатурку', unit: 'м²', price: 50, category: 'work_plaster' },
        // Штукатурка потолков
        'work_plaster_ceiling_cement': { name: 'Штукатурка потолка цементная', unit: 'м²', price: 500, category: 'work_plaster' },
        'work_plaster_ceiling_gypsum': { name: 'Штукатурка потолка гипсовая', unit: 'м²', price: 450, category: 'work_plaster' },
        // Штукатурка откосов
        'work_plaster_slope_window': { name: 'Штукатурка оконных откосов', unit: 'м.п.', price: 300, category: 'work_plaster' },
        'work_plaster_slope_door': { name: 'Штукатурка дверных откосов', unit: 'м.п.', price: 350, category: 'work_plaster' },
        // Декоративная штукатурка
        'work_plaster_decor_koroed': { name: 'Нанесение декоративной штукатурки «короед»', unit: 'м²', price: 400, category: 'work_plaster' },
        'work_plaster_decor_bark': { name: 'Нанесение штукатурки «шуба»', unit: 'м²', price: 350, category: 'work_plaster' },
        'work_plaster_decor_venetian': { name: 'Нанесение венецианской штукатурки', unit: 'м²', price: 800, category: 'work_plaster' },
        'work_plaster_decor_silk': { name: 'Нанесение шёлковой штукатурки', unit: 'м²', price: 500, category: 'work_plaster' },
        'work_plaster_decor_travertine': { name: 'Нанесение штукатурки «травертин»', unit: 'м²', price: 700, category: 'work_plaster' },
        'work_plaster_decor_marmorino': { name: 'Нанесение штукатурки «марморино»', unit: 'м²', price: 900, category: 'work_plaster' },
        'work_plaster_decor_microcement': { name: 'Нанесение микроцемента', unit: 'м²', price: 1000, category: 'work_plaster' },
        // Шпаклёвка
        'work_putty_walls_start': { name: 'Шпаклёвка стен стартовая', unit: 'м²', price: 150, category: 'work_plaster' },
        'work_putty_walls_finish': { name: 'Шпаклёвка стен финишная', unit: 'м²', price: 180, category: 'work_plaster' },
        'work_putty_walls_super': { name: 'Шпаклёвка стен суперфинишная (под покраску)', unit: 'м²', price: 250, category: 'work_plaster' },
        'work_putty_ceiling': { name: 'Шпаклёвка потолка', unit: 'м²', price: 250, category: 'work_plaster' },
        'work_putty_ceiling_super': { name: 'Шпаклёвка потолка суперфинишная', unit: 'м²', price: 350, category: 'work_plaster' },
        'work_putty_slope': { name: 'Шпаклёвка откосов', unit: 'м.п.', price: 200, category: 'work_plaster' },
        // Грунтовка
        'work_primer_deep': { name: 'Грунтовка глубокого проникновения', unit: 'м²', price: 30, category: 'work_plaster' },
        'work_primer_contact': { name: 'Грунтовка бетоноконтакт', unit: 'м²', price: 50, category: 'work_plaster' },
        'work_primer_antifungal': { name: 'Обработка противогрибковым составом', unit: 'м²', price: 40, category: 'work_plaster' },
        // Покраска
        'work_paint_walls_1': { name: 'Покраска стен (1 слой)', unit: 'м²', price: 80, category: 'work_paint' },
        'work_paint_walls_2': { name: 'Покраска стен (2 слоя)', unit: 'м²', price: 120, category: 'work_paint' },
        'work_paint_walls_3': { name: 'Покраска стен (3 слоя)', unit: 'м²', price: 160, category: 'work_paint' },
        'work_paint_ceiling_1': { name: 'Покраска потолка (1 слой)', unit: 'м²', price: 100, category: 'work_paint' },
        'work_paint_ceiling_2': { name: 'Покраска потолка (2 слоя)', unit: 'м²', price: 150, category: 'work_paint' },
        'work_paint_slope': { name: 'Покраска откосов', unit: 'м.п.', price: 150, category: 'work_paint' },
        'work_paint_pipe': { name: 'Покраска труб', unit: 'м.п.', price: 100, category: 'work_paint' },
        'work_paint_radiator': { name: 'Покраска радиатора', unit: 'шт', price: 500, category: 'work_paint' },
        'work_paint_facade': { name: 'Покраска фасада', unit: 'м²', price: 150, category: 'work_paint' },
        'work_paint_fence': { name: 'Покраска забора', unit: 'м²', price: 120, category: 'work_paint' },
        'work_paint_floor': { name: 'Покраска пола', unit: 'м²', price: 120, category: 'work_paint' },
        // Обои
        'work_wallpaper_vinyl': { name: 'Поклейка виниловых обоев', unit: 'м²', price: 200, category: 'work_paint' },
        'work_wallpaper_fleece': { name: 'Поклейка флизелиновых обоев', unit: 'м²', price: 200, category: 'work_paint' },
        'work_wallpaper_paper': { name: 'Поклейка бумажных обоев', unit: 'м²', price: 150, category: 'work_paint' },
        'work_wallpaper_textile': { name: 'Поклейка текстильных обоев', unit: 'м²', price: 400, category: 'work_paint' },
        'work_wallpaper_glass': { name: 'Поклейка стеклообоев', unit: 'м²', price: 250, category: 'work_paint' },
        'work_wallpaper_photo': { name: 'Поклейка фотообоев', unit: 'м²', price: 300, category: 'work_paint' },
        'work_wallpaper_liquid': { name: 'Нанесение жидких обоев', unit: 'м²', price: 300, category: 'work_paint' },
        'work_wallpaper_strip_old': { name: 'Снятие старых обоев', unit: 'м²', price: 50, category: 'work_paint' },
        // Лепнина / молдинги
        'work_molding_ceiling': { name: 'Монтаж потолочных молдингов', unit: 'м.п.', price: 150, category: 'work_paint' },
        'work_molding_wall': { name: 'Монтаж стеновых молдингов', unit: 'м.п.', price: 200, category: 'work_paint' },
        'work_rosette_ceiling': { name: 'Монтаж потолочной розетки', unit: 'шт', price: 500, category: 'work_paint' },
        'work_cornice_decor': { name: 'Монтаж декоративного карниза', unit: 'м.п.', price: 300, category: 'work_paint' },
        // Демонтаж
        'work_demo_plaster': { name: 'Демонтаж штукатурки', unit: 'м²', price: 150, category: 'work_plaster' },
        'work_demo_putty': { name: 'Снятие шпаклёвки', unit: 'м²', price: 100, category: 'work_plaster' },
        'work_demo_paint': { name: 'Снятие старой краски', unit: 'м²', price: 100, category: 'work_paint' },
        'work_demo_tile_walls': { name: 'Демонтаж плитки со стен', unit: 'м²', price: 200, category: 'work_plaster' },
        // Фактурные работы
        'work_stucco_molding': { name: 'Изготовление лепнины на заказ', unit: 'м.п.', price: 1000, category: 'work_paint' },
        'work_art_painting': { name: 'Художественная роспись стен', unit: 'м²', price: 3000, category: 'work_paint' },
        // Фасадная штукатурка
        'work_facade_plaster_cement': { name: 'Фасадная штукатурка цементная', unit: 'м²', price: 400, category: 'work_plaster' },
        'work_facade_plaster_decor': { name: 'Фасадная декоративная штукатурка', unit: 'м²', price: 500, category: 'work_plaster' },
        'work_facade_insulation_eifs': { name: 'Утепление фасада мокрым способом (СФТК)', unit: 'м²', price: 800, category: 'work_plaster' },
        'work_facade_mesh_embed': { name: 'Армирование фасада сеткой', unit: 'м²', price: 200, category: 'work_plaster' }
    };
})();
