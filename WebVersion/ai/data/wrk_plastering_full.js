// === ФАЗА 3: ШТУКАТУРНЫЕ РАБОТЫ ДЕТАЛЬНО — ПО ТИПУ, ТОЛЩИНЕ, ПОВЕРХНОСТИ (120 поз.) ===
(function () {
    window.AI_WRK_PLASTERING_FULL = {
        // === ЦЕМЕНТНО-ПЕСЧАНАЯ ШТУКАТУРКА ===
        'wrk_pl_cps_wall_10': { name: 'ЦПС штукатурка стен 10мм', unit: 'м²', price: 20, category: 'plastering_full' },
        'wrk_pl_cps_wall_20': { name: 'ЦПС штукатурка стен 20мм', unit: 'м²', price: 30, category: 'plastering_full' },
        'wrk_pl_cps_wall_30': { name: 'ЦПС штукатурка стен 30мм', unit: 'м²', price: 40, category: 'plastering_full' },
        'wrk_pl_cps_wall_40': { name: 'ЦПС штукатурка стен 40мм', unit: 'м²', price: 55, category: 'plastering_full' },
        'wrk_pl_cps_wall_50': { name: 'ЦПС штукатурка стен 50мм', unit: 'м²', price: 70, category: 'plastering_full' },
        'wrk_pl_cps_ceil_10': { name: 'ЦПС штукатурка потолка 10мм', unit: 'м²', price: 30, category: 'plastering_full' },
        'wrk_pl_cps_ceil_20': { name: 'ЦПС штукатурка потолка 20мм', unit: 'м²', price: 45, category: 'plastering_full' },
        'wrk_pl_cps_ceil_30': { name: 'ЦПС штукатурка потолка 30мм', unit: 'м²', price: 60, category: 'plastering_full' },
        'wrk_pl_cps_facade_20': { name: 'ЦПС штукатурка фасада 20мм', unit: 'м²', price: 40, category: 'plastering_full' },
        'wrk_pl_cps_facade_30': { name: 'ЦПС штукатурка фасада 30мм', unit: 'м²', price: 55, category: 'plastering_full' },

        // === ГИПСОВАЯ ШТУКАТУРКА ===
        'wrk_pl_gips_wall_10': { name: 'Гипсовая штукатурка стен 10мм', unit: 'м²', price: 25, category: 'plastering_full' },
        'wrk_pl_gips_wall_20': { name: 'Гипсовая штукатурка стен 20мм', unit: 'м²', price: 35, category: 'plastering_full' },
        'wrk_pl_gips_wall_30': { name: 'Гипсовая штукатурка стен 30мм', unit: 'м²', price: 50, category: 'plastering_full' },
        'wrk_pl_gips_wall_40': { name: 'Гипсовая штукатурка стен 40мм', unit: 'м²', price: 65, category: 'plastering_full' },
        'wrk_pl_gips_wall_50': { name: 'Гипсовая штукатурка стен 50мм', unit: 'м²', price: 80, category: 'plastering_full' },
        'wrk_pl_gips_ceil_10': { name: 'Гипсовая штукатурка потолка 10мм', unit: 'м²', price: 35, category: 'plastering_full' },
        'wrk_pl_gips_ceil_20': { name: 'Гипсовая штукатурка потолка 20мм', unit: 'м²', price: 50, category: 'plastering_full' },

        // === МАШИННАЯ ШТУКАТУРКА ===
        'wrk_pl_mech_gips_10': { name: 'Машинная штукатурка (гипс) 10мм', unit: 'м²', price: 20, category: 'plastering_full' },
        'wrk_pl_mech_gips_20': { name: 'Машинная штукатурка (гипс) 20мм', unit: 'м²', price: 28, category: 'plastering_full' },
        'wrk_pl_mech_gips_30': { name: 'Машинная штукатурка (гипс) 30мм', unit: 'м²', price: 38, category: 'plastering_full' },
        'wrk_pl_mech_gips_40': { name: 'Машинная штукатурка (гипс) 40мм', unit: 'м²', price: 48, category: 'plastering_full' },
        'wrk_pl_mech_gips_50': { name: 'Машинная штукатурка (гипс) 50мм', unit: 'м²', price: 58, category: 'plastering_full' },
        'wrk_pl_mech_cps_20': { name: 'Машинная штукатурка (ЦПС) 20мм', unit: 'м²', price: 25, category: 'plastering_full' },
        'wrk_pl_mech_cps_30': { name: 'Машинная штукатурка (ЦПС) 30мм', unit: 'м²', price: 35, category: 'plastering_full' },

        // === ДЕКОРАТИВНАЯ ШТУКАТУРКА ===
        'wrk_pl_decor_koroyed_1_5': { name: 'Декоративная «Короед» 1.5мм', unit: 'м²', price: 40, category: 'plastering_full' },
        'wrk_pl_decor_koroyed_2_0': { name: 'Декоративная «Короед» 2.0мм', unit: 'м²', price: 45, category: 'plastering_full' },
        'wrk_pl_decor_koroyed_2_5': { name: 'Декоративная «Короед» 2.5мм', unit: 'м²', price: 50, category: 'plastering_full' },
        'wrk_pl_decor_koroyed_3_0': { name: 'Декоративная «Короед» 3.0мм', unit: 'м²', price: 55, category: 'plastering_full' },
        'wrk_pl_decor_barashek': { name: 'Декоративная «Барашек»', unit: 'м²', price: 45, category: 'plastering_full' },
        'wrk_pl_decor_shuba': { name: 'Декоративная «Шуба»', unit: 'м²', price: 35, category: 'plastering_full' },
        'wrk_pl_decor_travertine': { name: 'Декоративная «Травертин»', unit: 'м²', price: 80, category: 'plastering_full' },
        'wrk_pl_decor_venetian_wax': { name: 'Венецианская (с воском)', unit: 'м²', price: 200, category: 'plastering_full' },
        'wrk_pl_decor_silk': { name: 'Шёлковая (жидкие обои)', unit: 'м²', price: 60, category: 'plastering_full' },
        'wrk_pl_decor_marmorino': { name: 'Марморино', unit: 'м²', price: 120, category: 'plastering_full' },
        'wrk_pl_decor_beton_art': { name: 'Арт-бетон', unit: 'м²', price: 100, category: 'plastering_full' },

        // === ПОДГОТОВИТЕЛЬНЫЕ ===
        'wrk_pl_prep_mesh_steel': { name: 'Установка сетки стальной', unit: 'м²', price: 10, category: 'plastering_full' },
        'wrk_pl_prep_mesh_fiber': { name: 'Установка стеклосетки', unit: 'м²', price: 5, category: 'plastering_full' },
        'wrk_pl_prep_ugolok': { name: 'Перфорированный уголок', unit: 'м.п.', price: 3, category: 'plastering_full' },

        // === ШПАТЛЁВКА ===
        'wrk_pl_shpat_start': { name: 'Шпатлёвка стартовая', unit: 'м²', price: 15, category: 'plastering_full' },
        'wrk_pl_shpat_finish_1': { name: 'Шпатлёвка финишная (1 слой)', unit: 'м²', price: 15, category: 'plastering_full' },
        'wrk_pl_shpat_finish_2': { name: 'Шпатлёвка финишная (2 слоя)', unit: 'м²', price: 25, category: 'plastering_full' },
        'wrk_pl_shpat_finish_3': { name: 'Шпатлёвка финишная (3 слоя)', unit: 'м²', price: 35, category: 'plastering_full' },
        'wrk_pl_shpat_superfinish': { name: 'Суперфиниш (под покраску)', unit: 'м²', price: 30, category: 'plastering_full' },
        'wrk_pl_shpat_ceil_1': { name: 'Шпатлёвка потолка (1 слой)', unit: 'м²', price: 20, category: 'plastering_full' },
        'wrk_pl_shpat_ceil_2': { name: 'Шпатлёвка потолка (2 слоя)', unit: 'м²', price: 35, category: 'plastering_full' },
        'wrk_pl_shpat_ceil_3': { name: 'Шпатлёвка потолка (3 слоя)', unit: 'м²', price: 50, category: 'plastering_full' },
        'wrk_pl_shpat_gkl_1': { name: 'Шпатлёвка ГКЛ (1 слой)', unit: 'м²', price: 12, category: 'plastering_full' },
        'wrk_pl_shpat_gkl_2': { name: 'Шпатлёвка ГКЛ (2 слоя)', unit: 'м²', price: 20, category: 'plastering_full' },
        'wrk_pl_shpat_gkl_3': { name: 'Шпатлёвка ГКЛ (3 слоя)', unit: 'м²', price: 28, category: 'plastering_full' },

        // === СТЯЖКА ПОЛА ===
        'wrk_pl_screed_cps_30': { name: 'Стяжка ЦПС 30мм', unit: 'м²', price: 25, category: 'plastering_full' },
        'wrk_pl_screed_cps_50': { name: 'Стяжка ЦПС 50мм', unit: 'м²', price: 35, category: 'plastering_full' },
        'wrk_pl_screed_cps_70': { name: 'Стяжка ЦПС 70мм', unit: 'м²', price: 50, category: 'plastering_full' },
        'wrk_pl_screed_cps_100': { name: 'Стяжка ЦПС 100мм', unit: 'м²', price: 70, category: 'plastering_full' },
        'wrk_pl_screed_keramsit_50': { name: 'Керамзитная стяжка 50мм', unit: 'м²', price: 30, category: 'plastering_full' },
        'wrk_pl_screed_keramsit_100': { name: 'Керамзитная стяжка 100мм', unit: 'м²', price: 50, category: 'plastering_full' },
        'wrk_pl_screed_pe_film': { name: 'Плёнка ПЭ (под стяжку)', unit: 'м²', price: 3, category: 'plastering_full' },
        'wrk_pl_screed_mesh_50': { name: 'Сетка армирующая 50×50 Ø3', unit: 'м²', price: 10, category: 'plastering_full' },
        'wrk_pl_screed_mesh_100': { name: 'Сетка армирующая 100×100 Ø4', unit: 'м²', price: 8, category: 'plastering_full' },
        'wrk_pl_screed_fiber': { name: 'Фиброволокно (в стяжку)', unit: 'м²', price: 3, category: 'plastering_full' }
    };
})();
