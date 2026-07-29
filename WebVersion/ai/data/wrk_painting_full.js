// === ФАЗА 3: ПОКРАСКА ДЕТАЛЬНО — ТИПЫ КРАСОК, ПОВЕРХНОСТИ, ПОДГОТОВКА (100 поз.) ===
(function () {
    window.AI_WRK_PAINTING_FULL = {
        // === ИНТЕРЬЕРНЫЕ КРАСКИ (СТЕНЫ) ===
        'wrk_pnt_wall_water_1': { name: 'Покраска стен водоэмульсионная (1 слой)', unit: 'м²', price: 8, category: 'painting_full' },
        'wrk_pnt_wall_water_2': { name: 'Покраска стен водоэмульсионная (2 слоя)', unit: 'м²', price: 14, category: 'painting_full' },
        'wrk_pnt_wall_water_3': { name: 'Покраска стен водоэмульсионная (3 слоя)', unit: 'м²', price: 20, category: 'painting_full' },
        'wrk_pnt_wall_acrylic_1': { name: 'Покраска стен акриловая (1 слой)', unit: 'м²', price: 10, category: 'painting_full' },
        'wrk_pnt_wall_acrylic_2': { name: 'Покраска стен акриловая (2 слоя)', unit: 'м²', price: 18, category: 'painting_full' },
        'wrk_pnt_wall_acrylic_3': { name: 'Покраска стен акриловая (3 слоя)', unit: 'м²', price: 25, category: 'painting_full' },
        'wrk_pnt_wall_latex_1': { name: 'Покраска стен латексная (1 слой)', unit: 'м²', price: 12, category: 'painting_full' },
        'wrk_pnt_wall_latex_2': { name: 'Покраска стен латексная (2 слоя)', unit: 'м²', price: 20, category: 'painting_full' },
        'wrk_pnt_wall_latex_3': { name: 'Покраска стен латексная (3 слоя)', unit: 'м²', price: 28, category: 'painting_full' },
        'wrk_pnt_wall_silicone_2': { name: 'Покраска стен силиконовая (2 слоя)', unit: 'м²', price: 25, category: 'painting_full' },
        'wrk_pnt_wall_ceramic_2': { name: 'Покраска стен керамическая (2 слоя)', unit: 'м²', price: 30, category: 'painting_full' },

        // === ПОТОЛКИ ===
        'wrk_pnt_ceil_water_1': { name: 'Покраска потолка водоэмульс. (1 слой)', unit: 'м²', price: 10, category: 'painting_full' },
        'wrk_pnt_ceil_water_2': { name: 'Покраска потолка водоэмульс. (2 слоя)', unit: 'м²', price: 18, category: 'painting_full' },
        'wrk_pnt_ceil_water_3': { name: 'Покраска потолка водоэмульс. (3 слоя)', unit: 'м²', price: 25, category: 'painting_full' },
        'wrk_pnt_ceil_acrylic_2': { name: 'Покраска потолка акриловая (2 слоя)', unit: 'м²', price: 22, category: 'painting_full' },

        // === ФАСАДНЫЕ КРАСКИ ===
        'wrk_pnt_facade_acrylic_2': { name: 'Покраска фасада акриловая (2 слоя)', unit: 'м²', price: 20, category: 'painting_full' },
        'wrk_pnt_facade_silicone_2': { name: 'Покраска фасада силиконовая (2 слоя)', unit: 'м²', price: 30, category: 'painting_full' },
        'wrk_pnt_facade_silicate_2': { name: 'Покраска фасада силикатная (2 слоя)', unit: 'м²', price: 25, category: 'painting_full' },
        'wrk_pnt_facade_elastom_2': { name: 'Покраска фасада эластомерная (2 слоя)', unit: 'м²', price: 40, category: 'painting_full' },

        // === МАСЛЯНЫЕ / ЭМАЛИ ===
        'wrk_pnt_enamel_pf_1': { name: 'Покраска эмалью ПФ-115 (1 слой)', unit: 'м²', price: 10, category: 'painting_full' },
        'wrk_pnt_enamel_pf_2': { name: 'Покраска эмалью ПФ-115 (2 слоя)', unit: 'м²', price: 18, category: 'painting_full' },
        'wrk_pnt_enamel_alkyd_1': { name: 'Покраска эмалью алкидная (1 слой)', unit: 'м²', price: 12, category: 'painting_full' },
        'wrk_pnt_enamel_alkyd_2': { name: 'Покраска эмалью алкидная (2 слоя)', unit: 'м²', price: 22, category: 'painting_full' },

        // === СПЕЦИАЛЬНЫЕ КРАСКИ ===
        'wrk_pnt_anti_mold': { name: 'Краска антиплесневая', unit: 'м²', price: 15, category: 'painting_full' },
        'wrk_pnt_chalkboard': { name: 'Грифельная краска', unit: 'м²', price: 40, category: 'painting_full' },
        'wrk_pnt_anti_graffiti': { name: 'Антиграффити покрытие', unit: 'м²', price: 30, category: 'painting_full' },
        'wrk_pnt_heat_resist': { name: 'Термостойкая краска', unit: 'м²', price: 30, category: 'painting_full' },
        'wrk_pnt_glow': { name: 'Светящаяся краска', unit: 'м²', price: 80, category: 'painting_full' },

        // === ЛАКИРОВАНИЕ ===
        'wrk_pnt_varnish_floor_1': { name: 'Лак для пола (1 слой)', unit: 'м²', price: 10, category: 'painting_full' },
        'wrk_pnt_varnish_floor_2': { name: 'Лак для пола (2 слоя)', unit: 'м²', price: 18, category: 'painting_full' },
        'wrk_pnt_varnish_floor_3': { name: 'Лак для пола (3 слоя)', unit: 'м²', price: 25, category: 'painting_full' },
        'wrk_pnt_varnish_wood': { name: 'Лакирование деревянных изделий', unit: 'м²', price: 15, category: 'painting_full' },
        'wrk_pnt_oil_wood': { name: 'Масло для дерева', unit: 'м²', price: 15, category: 'painting_full' },
        'wrk_pnt_wax_wood': { name: 'Воск для дерева', unit: 'м²', price: 20, category: 'painting_full' },
        'wrk_pnt_stain': { name: 'Морилка', unit: 'м²', price: 10, category: 'painting_full' },

        // === МЕТАЛЛОКОНСТРУКЦИИ ===
        'wrk_pnt_metal_enamel_1': { name: 'Покраска металла эмалью (1 слой)', unit: 'м²', price: 12, category: 'painting_full' },
        'wrk_pnt_metal_enamel_2': { name: 'Покраска металла эмалью (2 слоя)', unit: 'м²', price: 20, category: 'painting_full' },
        'wrk_pnt_metal_hammer': { name: 'Молотковая краска (металл)', unit: 'м²', price: 25, category: 'painting_full' },
        'wrk_pnt_metal_zinc_cold': { name: 'Холодное цинкование', unit: 'м²', price: 30, category: 'painting_full' },
        'wrk_pnt_metal_fireproof': { name: 'Огнезащитная краска (металл)', unit: 'м²', price: 50, category: 'painting_full' },

        // === ОБОИ ===
        'wrk_pnt_wallpaper_paper': { name: 'Поклейка обоев (бумажные)', unit: 'м²', price: 15, category: 'painting_full' },
        'wrk_pnt_wallpaper_vinyl': { name: 'Поклейка обоев (виниловые)', unit: 'м²', price: 20, category: 'painting_full' },
        'wrk_pnt_wallpaper_fleece': { name: 'Поклейка обоев (флизелиновые)', unit: 'м²', price: 18, category: 'painting_full' },
        'wrk_pnt_wallpaper_textile': { name: 'Поклейка обоев (текстильные)', unit: 'м²', price: 30, category: 'painting_full' },
        'wrk_pnt_wallpaper_glass_paint': { name: 'Стеклообои + покраска', unit: 'м²', price: 35, category: 'painting_full' },
        'wrk_pnt_wallpaper_photo': { name: 'Фотообои', unit: 'м²', price: 25, category: 'painting_full' },
        'wrk_pnt_wallpaper_3d': { name: 'Обои 3D', unit: 'м²', price: 35, category: 'painting_full' },
        'wrk_pnt_wallpaper_cork': { name: 'Пробковые обои', unit: 'м²', price: 40, category: 'painting_full' },
        'wrk_pnt_wallpaper_bamboo': { name: 'Бамбуковые обои', unit: 'м²', price: 35, category: 'painting_full' },

        // === ПОДГОТОВКА ===
        'wrk_pnt_prep_remove_old': { name: 'Снятие старой краски', unit: 'м²', price: 15, category: 'painting_full' },
        'wrk_pnt_prep_sand': { name: 'Шлифовка поверхности', unit: 'м²', price: 10, category: 'painting_full' },
        'wrk_pnt_prep_primer_1': { name: 'Грунтовка (1 слой)', unit: 'м²', price: 5, category: 'painting_full' },
        'wrk_pnt_prep_primer_2': { name: 'Грунтовка (2 слоя)', unit: 'м²', price: 8, category: 'painting_full' },
        'wrk_pnt_prep_masking': { name: 'Маляр. лента / укрывка', unit: 'м²', price: 3, category: 'painting_full' },
        'wrk_pnt_prep_patch': { name: 'Заделка трещин/сколов', unit: 'м.п.', price: 5, category: 'painting_full' }
    };
})();
