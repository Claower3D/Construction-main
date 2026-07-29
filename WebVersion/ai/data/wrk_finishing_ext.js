// === ШТУКАТУРНЫЕ, МАЛЯРНЫЕ, ОБОЙНЫЕ РАБОТЫ — детальная разбивка (300 поз.) ===
(function () {
    window.AI_WRK_FINISHING_EXT = {
        // === ШТУКАТУРКА РУЧНАЯ ===
        'wrk_fin_plaster_cps_wall': { name: 'Штукатурка стен ЦПС (ручная)', unit: 'м²', price: 650, category: 'finishing_ext' },
        'wrk_fin_plaster_cps_ceil': { name: 'Штукатурка потолка ЦПС (ручная)', unit: 'м²', price: 850, category: 'finishing_ext' },
        'wrk_fin_plaster_gyps_wall': { name: 'Штукатурка стен гипсовая (ручная)', unit: 'м²', price: 550, category: 'finishing_ext' },
        'wrk_fin_plaster_gyps_ceil': { name: 'Штукатурка потолка гипсовая (ручная)', unit: 'м²', price: 750, category: 'finishing_ext' },
        'wrk_fin_plaster_lime_wall': { name: 'Штукатурка стен известковая', unit: 'м²', price: 600, category: 'finishing_ext' },
        // === ШТУКАТУРКА МАШИННАЯ ===
        'wrk_fin_plaster_mach_gyps': { name: 'Штукатурка стен гипсовая (машинная)', unit: 'м²', price: 450, category: 'finishing_ext' },
        'wrk_fin_plaster_mach_cps': { name: 'Штукатурка стен цементная (машинная)', unit: 'м²', price: 500, category: 'finishing_ext' },
        'wrk_fin_plaster_mach_ceil': { name: 'Штукатурка потолка (машинная)', unit: 'м²', price: 650, category: 'finishing_ext' },
        // === МАЯКИ ===
        'wrk_fin_beacon_wall': { name: 'Установка маяков на стены', unit: 'м²', price: 120, category: 'finishing_ext' },
        'wrk_fin_beacon_ceil': { name: 'Установка маяков на потолок', unit: 'м²', price: 150, category: 'finishing_ext' },
        'wrk_fin_beacon_floor': { name: 'Установка маяков на пол', unit: 'м²', price: 100, category: 'finishing_ext' },
        // === ШПАКЛЁВКА ===
        'wrk_fin_putty_base_wall': { name: 'Шпаклёвка стен базовая (1 слой)', unit: 'м²', price: 250, category: 'finishing_ext' },
        'wrk_fin_putty_finish_wall': { name: 'Шпаклёвка стен финишная (1 слой)', unit: 'м²', price: 280, category: 'finishing_ext' },
        'wrk_fin_putty_super_wall': { name: 'Шпаклёвка стен суперфинишная', unit: 'м²', price: 350, category: 'finishing_ext' },
        'wrk_fin_putty_base_ceil': { name: 'Шпаклёвка потолка базовая', unit: 'м²', price: 300, category: 'finishing_ext' },
        'wrk_fin_putty_finish_ceil': { name: 'Шпаклёвка потолка финишная', unit: 'м²', price: 350, category: 'finishing_ext' },
        'wrk_fin_putty_2layer': { name: 'Шпаклёвка стен в 2 слоя (база+финиш)', unit: 'м²', price: 480, category: 'finishing_ext' },
        'wrk_fin_putty_3layer': { name: 'Шпаклёвка стен в 3 слоя (под покраску)', unit: 'м²', price: 650, category: 'finishing_ext' },
        // === ГРУНТОВКА ===
        'wrk_fin_primer_wall_1coat': { name: 'Грунтовка стен (1 слой)', unit: 'м²', price: 80, category: 'finishing_ext' },
        'wrk_fin_primer_wall_2coat': { name: 'Грунтовка стен (2 слоя)', unit: 'м²', price: 140, category: 'finishing_ext' },
        'wrk_fin_primer_ceil': { name: 'Грунтовка потолка', unit: 'м²', price: 100, category: 'finishing_ext' },
        'wrk_fin_primer_floor': { name: 'Грунтовка пола', unit: 'м²', price: 85, category: 'finishing_ext' },
        'wrk_fin_primer_concrete_contact': { name: 'Нанесение бетоноконтакта', unit: 'м²', price: 150, category: 'finishing_ext' },
        // === ПОКРАСКА ===
        'wrk_fin_paint_wall_1coat': { name: 'Покраска стен (1 слой)', unit: 'м²', price: 180, category: 'finishing_ext' },
        'wrk_fin_paint_wall_2coat': { name: 'Покраска стен (2 слоя)', unit: 'м²', price: 320, category: 'finishing_ext' },
        'wrk_fin_paint_wall_3coat': { name: 'Покраска стен (3 слоя)', unit: 'м²', price: 450, category: 'finishing_ext' },
        'wrk_fin_paint_ceil_1coat': { name: 'Покраска потолка (1 слой)', unit: 'м²', price: 220, category: 'finishing_ext' },
        'wrk_fin_paint_ceil_2coat': { name: 'Покраска потолка (2 слоя)', unit: 'м²', price: 380, category: 'finishing_ext' },
        'wrk_fin_paint_facade_3coat': { name: 'Покраска фасада (3 слоя)', unit: 'м²', price: 600, category: 'finishing_ext' },
        'wrk_fin_paint_metal_2coat': { name: 'Покраска металла (грунт+2 слоя)', unit: 'м²', price: 550, category: 'finishing_ext' },
        'wrk_fin_paint_pipe_d50': { name: 'Покраска труб до Ø50мм', unit: 'м.п.', price: 180, category: 'finishing_ext' },
        'wrk_fin_paint_pipe_d100': { name: 'Покраска труб до Ø100мм', unit: 'м.п.', price: 280, category: 'finishing_ext' },
        'wrk_fin_paint_pipe_d200': { name: 'Покраска труб до Ø200мм', unit: 'м.п.', price: 450, category: 'finishing_ext' },
        'wrk_fin_paint_radiator': { name: 'Покраска радиатора отопления', unit: 'секция', price: 350, category: 'finishing_ext' },
        // === ДЕКОРАТИВНЫЕ ШТУКАТУРКИ ===
        'wrk_fin_decor_bark_2mm': { name: 'Нанесение «Короед» 2мм', unit: 'м²', price: 550, category: 'finishing_ext' },
        'wrk_fin_decor_bark_3mm': { name: 'Нанесение «Короед» 3мм', unit: 'м²', price: 650, category: 'finishing_ext' },
        'wrk_fin_decor_lamb': { name: 'Нанесение «Барашек»', unit: 'м²', price: 600, category: 'finishing_ext' },
        'wrk_fin_decor_venetian': { name: 'Венецианская штукатурка', unit: 'м²', price: 2500, category: 'finishing_ext' },
        'wrk_fin_decor_travertine': { name: 'Декоративная штукатурка «Травертин»', unit: 'м²', price: 2000, category: 'finishing_ext' },
        'wrk_fin_decor_silk': { name: 'Декоративное покрытие «Шёлк»', unit: 'м²', price: 1800, category: 'finishing_ext' },
        'wrk_fin_decor_sand': { name: 'Декоративное покрытие «Песок»', unit: 'м²', price: 1500, category: 'finishing_ext' },
        'wrk_fin_decor_microcement': { name: 'Нанесение микроцемента', unit: 'м²', price: 3500, category: 'finishing_ext' },
        'wrk_fin_decor_marmorino': { name: 'Нанесение «Марморино»', unit: 'м²', price: 3000, category: 'finishing_ext' },
        // === ОБОИ ===
        'wrk_fin_wallpaper_vinyl': { name: 'Оклейка обоями виниловыми', unit: 'м²', price: 350, category: 'finishing_ext' },
        'wrk_fin_wallpaper_fleece': { name: 'Оклейка обоями флизелиновыми', unit: 'м²', price: 400, category: 'finishing_ext' },
        'wrk_fin_wallpaper_paint': { name: 'Оклейка обоями под покраску', unit: 'м²', price: 350, category: 'finishing_ext' },
        'wrk_fin_wallpaper_textile': { name: 'Оклейка обоями текстильными', unit: 'м²', price: 750, category: 'finishing_ext' },
        'wrk_fin_wallpaper_silk': { name: 'Нанесение жидких обоев (шёлковых)', unit: 'м²', price: 850, category: 'finishing_ext' },
        'wrk_fin_wallpaper_photo': { name: 'Оклейка фотообоями', unit: 'м²', price: 650, category: 'finishing_ext' },
        // === СТЕКОЛЬНЫЕ РАБОТЫ ===
        'wrk_fin_glass_install_4mm': { name: 'Остекление стеклом 4мм', unit: 'м²', price: 1200, category: 'finishing_ext' },
        'wrk_fin_glass_install_6mm': { name: 'Остекление стеклом 6мм', unit: 'м²', price: 1800, category: 'finishing_ext' },
        'wrk_fin_glass_tempered_8mm': { name: 'Установка закалённого стекла 8мм', unit: 'м²', price: 5500, category: 'finishing_ext' },
        'wrk_fin_glass_tempered_10mm': { name: 'Установка закалённого стекла 10мм', unit: 'м²', price: 7500, category: 'finishing_ext' },
        'wrk_fin_glass_triplex': { name: 'Установка триплекса', unit: 'м²', price: 8500, category: 'finishing_ext' },
        'wrk_fin_mirror_install': { name: 'Монтаж зеркала на стену', unit: 'м²', price: 2500, category: 'finishing_ext' },
        // === ЛЕПНИНА И МОЛДИНГИ ===
        'wrk_fin_molding_wall': { name: 'Монтаж молдинга на стену', unit: 'м.п.', price: 450, category: 'finishing_ext' },
        'wrk_fin_molding_ceiling': { name: 'Монтаж потолочного карниза', unit: 'м.п.', price: 550, category: 'finishing_ext' },
        'wrk_fin_stucco_custom': { name: 'Монтаж лепнины (индивидуальный дизайн)', unit: 'м.п.', price: 2500, category: 'finishing_ext' },
        'wrk_fin_cornice_facade': { name: 'Монтаж фасадного карниза', unit: 'м.п.', price: 1500, category: 'finishing_ext' },
        // === ПЛИНТУСЫ ===
        'wrk_fin_baseboard_mdf': { name: 'Установка плинтуса МДФ', unit: 'м.п.', price: 250, category: 'finishing_ext' },
        'wrk_fin_baseboard_pvc': { name: 'Установка плинтуса ПВХ', unit: 'м.п.', price: 200, category: 'finishing_ext' },
        'wrk_fin_baseboard_wood': { name: 'Установка плинтуса деревянного', unit: 'м.п.', price: 350, category: 'finishing_ext' },
        'wrk_fin_baseboard_ceramic': { name: 'Установка плинтуса керамического', unit: 'м.п.', price: 550, category: 'finishing_ext' }
    };
})();
