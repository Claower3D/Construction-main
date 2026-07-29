// === ФАСАДНЫЕ СИСТЕМЫ — ВФ, мокрый фасад, HPL, терракота, клинкер (50 поз.) ===
(function () {
    window.AI_WRK_FACADE_SYS = {
        // === ВЕНТФАСАД (НФС) === 1-14
        'wrk_fs2_vf_subframe_alu': { name: 'Подсистема алюминиевая (НФС)', unit: 'м²', price: 1500, category: 'facadesys' },
        'wrk_fs2_vf_subframe_steel': { name: 'Подсистема стальная (НФС)', unit: 'м²', price: 1200, category: 'facadesys' },
        'wrk_fs2_vf_subframe_ss': { name: 'Подсистема нержавеющая', unit: 'м²', price: 2500, category: 'facadesys' },
        'wrk_fs2_vf_insul_100': { name: 'Утеплитель ВФ мин. вата 100мм', unit: 'м²', price: 350, category: 'facadesys' },
        'wrk_fs2_vf_insul_150': { name: 'Утеплитель ВФ мин. вата 150мм', unit: 'м²', price: 550, category: 'facadesys' },
        'wrk_fs2_vf_insul_200': { name: 'Утеплитель ВФ мин. вата 200мм', unit: 'м²', price: 850, category: 'facadesys' },
        'wrk_fs2_vf_acm_4': { name: 'Облицовка АКП 4мм', unit: 'м²', price: 1200, category: 'facadesys' },
        'wrk_fs2_vf_acm_fr': { name: 'Облицовка АКП FR (негорючий)', unit: 'м²', price: 1500, category: 'facadesys' },
        'wrk_fs2_vf_granite': { name: 'Облицовка керамогранит 10мм', unit: 'м²', price: 1500, category: 'facadesys' },
        'wrk_fs2_vf_natural': { name: 'Облицовка натуральный камень', unit: 'м²', price: 5500, category: 'facadesys' },
        'wrk_fs2_vf_hpl': { name: 'Облицовка HPL-панель 8мм', unit: 'м²', price: 2500, category: 'facadesys' },
        'wrk_fs2_vf_terracotta': { name: 'Облицовка терракота', unit: 'м²', price: 3500, category: 'facadesys' },
        'wrk_fs2_vf_fiber_cement': { name: 'Облицовка фиброцемент', unit: 'м²', price: 1500, category: 'facadesys' },
        'wrk_fs2_vf_metal_cassette': { name: 'Металлокассета', unit: 'м²', price: 1500, category: 'facadesys' },
        // === МОКРЫЙ ФАСАД (СФТК) === 15-24
        'wrk_fs2_wf_eps_100': { name: 'СФТК EPS 100мм', unit: 'м²', price: 1500, category: 'facadesys' },
        'wrk_fs2_wf_eps_150': { name: 'СФТК EPS 150мм', unit: 'м²', price: 1800, category: 'facadesys' },
        'wrk_fs2_wf_eps_200': { name: 'СФТК EPS 200мм', unit: 'м²', price: 2200, category: 'facadesys' },
        'wrk_fs2_wf_mw_100': { name: 'СФТК мин.вата 100мм', unit: 'м²', price: 2200, category: 'facadesys' },
        'wrk_fs2_wf_mw_150': { name: 'СФТК мин.вата 150мм', unit: 'м²', price: 2500, category: 'facadesys' },
        'wrk_fs2_wf_plaster_mineral': { name: 'Штукатурка минеральная (финиш)', unit: 'м²', price: 350, category: 'facadesys' },
        'wrk_fs2_wf_plaster_silicone': { name: 'Штукатурка силиконовая', unit: 'м²', price: 550, category: 'facadesys' },
        'wrk_fs2_wf_plaster_silicate': { name: 'Штукатурка силикатная', unit: 'м²', price: 450, category: 'facadesys' },
        'wrk_fs2_wf_plaster_acrylic': { name: 'Штукатурка акриловая', unit: 'м²', price: 350, category: 'facadesys' },
        'wrk_fs2_wf_paint': { name: 'Покраска фасада', unit: 'м²', price: 250, category: 'facadesys' },
        // === КЛИНКЕРНАЯ ОБЛИЦОВКА === 25-30
        'wrk_fs2_clinker_tile': { name: 'Клинкерная плитка (фасад)', unit: 'м²', price: 2500, category: 'facadesys' },
        'wrk_fs2_clinker_brick': { name: 'Клинкерный кирпич (облицовка)', unit: 'м²', price: 3500, category: 'facadesys' },
        'wrk_fs2_clinker_thermo': { name: 'Термопанель с клинкером', unit: 'м²', price: 2500, category: 'facadesys' },
        'wrk_fs2_facing_brick': { name: 'Облицовочный кирпич', unit: 'м²', price: 2500, category: 'facadesys' },
        'wrk_fs2_facing_stone': { name: 'Облицовка искусственным камнем', unit: 'м²', price: 1500, category: 'facadesys' },
        // === САЙДИНГ === 31-36
        'wrk_fs2_siding_wood': { name: 'Планкен/имитация бруса', unit: 'м²', price: 1200, category: 'facadesys' },
        'wrk_fs2_siding_composite': { name: 'Сайдинг ДПК', unit: 'м²', price: 1500, category: 'facadesys' },
        'wrk_fs2_blockhouse': { name: 'Блок-хаус', unit: 'м²', price: 850, category: 'facadesys' },
        // === ДОБОРНЫЕ === 37-44
        'wrk_fs2_corner': { name: 'Угловой элемент фасада', unit: 'м.п.', price: 550, category: 'facadesys' },
        'wrk_fs2_window_slope': { name: 'Откос оконный (фасадный)', unit: 'м.п.', price: 550, category: 'facadesys' },
        'wrk_fs2_soffit': { name: 'Подшивка свеса (софит)', unit: 'м²', price: 550, category: 'facadesys' },
        'wrk_fs2_parapet_cap': { name: 'Парапетная крышка', unit: 'м.п.', price: 550, category: 'facadesys' },
        'wrk_fs2_drainage_profile': { name: 'Отлив фасадный', unit: 'м.п.', price: 250, category: 'facadesys' },
        'wrk_fs2_expansion_joint': { name: 'Деформационный шов (фасад)', unit: 'м.п.', price: 550, category: 'facadesys' },
        'wrk_fs2_fire_barrier': { name: 'Противопожарный пояс', unit: 'м.п.', price: 850, category: 'facadesys' },
        'wrk_fs2_ventgap': { name: 'Вент. зазор (элементы)', unit: 'м²', price: 120, category: 'facadesys' },
        // === РЕМОНТ / ОЧИСТКА === 45-50
        'wrk_fs2_wash_high': { name: 'Мойка фасада (альпинизм)', unit: 'м²', price: 120, category: 'facadesys' },
        'wrk_fs2_wash_lift': { name: 'Мойка фасада (люлька)', unit: 'м²', price: 85, category: 'facadesys' },
        'wrk_fs2_repair_plaster': { name: 'Ремонт штукатурки фасада', unit: 'м²', price: 550, category: 'facadesys' },
        'wrk_fs2_repair_tile': { name: 'Замена фасадной плитки', unit: 'м²', price: 1500, category: 'facadesys' },
        'wrk_fs2_hydrophob': { name: 'Гидрофобизация фасада', unit: 'м²', price: 120, category: 'facadesys' },
        'wrk_fs2_thermal_survey': { name: 'Тепловизионное обследование фасада', unit: 'объект', price: 15000, category: 'facadesys' }
    };
})();
