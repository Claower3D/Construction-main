// === МОСТОВЫЕ РАБОТЫ — опоры, пролёты, подвес, оснастка, ремонт мостов (50 поз.) ===
(function () {
    window.AI_WRK_BRIDGES = {
        // === ФУНДАМЕНТЫ / ОПОРЫ === 1-10
        'wrk_br_pile_bore_600': { name: 'Буровая свая Ø600 (мост)', unit: 'м.п.', price: 15000, category: 'bridges' },
        'wrk_br_pile_bore_1000': { name: 'Буровая свая Ø1000 (мост)', unit: 'м.п.', price: 25000, category: 'bridges' },
        'wrk_br_pile_bore_1500': { name: 'Буровая свая Ø1500 (мост)', unit: 'м.п.', price: 55000, category: 'bridges' },
        'wrk_br_pile_cap': { name: 'Ростверк мостовой опоры', unit: 'м³', price: 15000, category: 'bridges' },
        'wrk_br_abutment_rc': { name: 'Устой ж/б (мост)', unit: 'м³', price: 15000, category: 'bridges' },
        'wrk_br_pier_rc': { name: 'Промежуточная опора (бык) ж/б', unit: 'м³', price: 18000, category: 'bridges' },
        'wrk_br_pier_column': { name: 'Столбчатая опора (эстакада)', unit: 'шт', price: 350000, category: 'bridges' },
        'wrk_br_pier_wall': { name: 'Стенка-опора (путепровод)', unit: 'м³', price: 15000, category: 'bridges' },
        'wrk_br_formwork_pier': { name: 'Опалубка опоры (скользящая)', unit: 'м²', price: 3500, category: 'bridges' },
        'wrk_br_rebar_pier': { name: 'Армирование опоры', unit: 'т', price: 55000, category: 'bridges' },
        // === ПРОЛЁТНЫЕ СТРОЕНИЯ === 11-22
        'wrk_br_beam_precast_12': { name: 'Монтаж ж/б балки L=12м', unit: 'шт', price: 120000, category: 'bridges' },
        'wrk_br_beam_precast_18': { name: 'Монтаж ж/б балки L=18м', unit: 'шт', price: 250000, category: 'bridges' },
        'wrk_br_beam_precast_24': { name: 'Монтаж ж/б балки L=24м', unit: 'шт', price: 350000, category: 'bridges' },
        'wrk_br_beam_precast_33': { name: 'Монтаж ж/б балки L=33м', unit: 'шт', price: 550000, category: 'bridges' },
        'wrk_br_slab_mono': { name: 'Монолитная плита пролёта', unit: 'м²', price: 8500, category: 'bridges' },
        'wrk_br_steel_girder': { name: 'Стальная балка пролётного строения', unit: 'т', price: 120000, category: 'bridges' },
        'wrk_br_steel_box': { name: 'Стальная коробчатая балка', unit: 'т', price: 150000, category: 'bridges' },
        'wrk_br_steel_truss': { name: 'Стальная ферма (мост)', unit: 'т', price: 120000, category: 'bridges' },
        'wrk_br_cable_stayed': { name: 'Вантовая система (трос)', unit: 'т', price: 250000, category: 'bridges' },
        'wrk_br_suspension_cable': { name: 'Несущий кабель (висячий мост)', unit: 'т', price: 350000, category: 'bridges' },
        'wrk_br_arch_steel': { name: 'Арочная конструкция (сталь)', unit: 'т', price: 150000, category: 'bridges' },
        'wrk_br_precast_segment': { name: 'Сегментный монтаж (навесной)', unit: 'сегмент', price: 250000, category: 'bridges' },
        // === МОСТОВОЕ ПОЛОТНО === 23-30
        'wrk_br_deck_waterproof': { name: 'Гидроизоляция мостового полотна', unit: 'м²', price: 1200, category: 'bridges' },
        'wrk_br_deck_asphalt_50': { name: 'Асфальт мостовой (50мм)', unit: 'м²', price: 850, category: 'bridges' },
        'wrk_br_deck_asphalt_80': { name: 'Асфальт мостовой (80мм)', unit: 'м²', price: 1200, category: 'bridges' },
        'wrk_br_deck_concrete': { name: 'Бетонное покрытие моста', unit: 'м²', price: 2500, category: 'bridges' },
        'wrk_br_joint_expansion': { name: 'Деформационный шов', unit: 'м.п.', price: 15000, category: 'bridges' },
        'wrk_br_bearing_elastomer': { name: 'Опорная часть (эластомер)', unit: 'шт', price: 25000, category: 'bridges' },
        'wrk_br_bearing_pot': { name: 'Опорная часть (шаровая)', unit: 'шт', price: 85000, category: 'bridges' },
        'wrk_br_drainage_bridge': { name: 'Водоотвод мостового полотна', unit: 'м.п.', price: 2500, category: 'bridges' },
        // === ОГРАЖДЕНИЯ / ПЕРИЛА === 31-36
        'wrk_br_railing_metal': { name: 'Перильное ограждение (сталь)', unit: 'м.п.', price: 5500, category: 'bridges' },
        'wrk_br_railing_ss': { name: 'Перильное ограждение (нержав.)', unit: 'м.п.', price: 8500, category: 'bridges' },
        'wrk_br_barrier_concrete': { name: 'Барьерное ограждение (бетон)', unit: 'м.п.', price: 5500, category: 'bridges' },
        'wrk_br_barrier_metal': { name: 'Барьерное ограждение (металл)', unit: 'м.п.', price: 3500, category: 'bridges' },
        'wrk_br_noise_barrier': { name: 'Шумозащитный экран (мост)', unit: 'м²', price: 5500, category: 'bridges' },
        'wrk_br_lighting': { name: 'Освещение моста (LED)', unit: 'опора', price: 25000, category: 'bridges' },
        // === РЕМОНТ МОСТОВ === 37-44
        'wrk_br_repair_concrete': { name: 'Ремонт бетона опоры (PCC)', unit: 'м²', price: 5500, category: 'bridges' },
        'wrk_br_repair_crack_inject': { name: 'Инъектирование трещин', unit: 'м.п.', price: 2500, category: 'bridges' },
        'wrk_br_repair_cfrp_wrap': { name: 'Усиление углеволокном (CFRP)', unit: 'м²', price: 8500, category: 'bridges' },
        'wrk_br_repair_steel_jacket': { name: 'Стальная обойма (усиление)', unit: 'шт', price: 85000, category: 'bridges' },
        'wrk_br_repair_bearing_replace': { name: 'Замена опорных частей', unit: 'шт', price: 120000, category: 'bridges' },
        'wrk_br_repair_joint_replace': { name: 'Замена деформационного шва', unit: 'м.п.', price: 15000, category: 'bridges' },
        'wrk_br_repair_deck_overlay': { name: 'Ремонт покрытия моста', unit: 'м²', price: 2500, category: 'bridges' },
        'wrk_br_repair_railing': { name: 'Ремонт перильного ограждения', unit: 'м.п.', price: 3500, category: 'bridges' },
        // === ИСПЫТАНИЯ / МОНИТОРИНГ === 45-50
        'wrk_br_load_test_static': { name: 'Статические испытания моста', unit: 'компл.', price: 550000, category: 'bridges' },
        'wrk_br_load_test_dynamic': { name: 'Динамические испытания моста', unit: 'компл.', price: 350000, category: 'bridges' },
        'wrk_br_inspection_visual': { name: 'Визуальный осмотр моста', unit: 'объект', price: 55000, category: 'bridges' },
        'wrk_br_inspection_detail': { name: 'Детальное обследование моста', unit: 'объект', price: 250000, category: 'bridges' },
        'wrk_br_monitoring_strain': { name: 'Тензометрический мониторинг', unit: 'точка', price: 15000, category: 'bridges' },
        'wrk_br_monitoring_shm': { name: 'Система мониторинга здоровья (SHM)', unit: 'компл.', price: 2500000, category: 'bridges' }
    };
})();
