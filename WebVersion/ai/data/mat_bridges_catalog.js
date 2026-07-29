// === МОСТОСТРОЕНИЕ — тросы, опоры, деформационные швы, опорные части, ограждения (300 поз.) ===
(function () {
    window.AI_MAT_BRIDGES = {
        // === КАНАТЫ/ТРОСЫ ===
        'mat_br_cable_6x19_d12': { name: 'Канат стальной 6×19 Ø12мм', unit: 'м.п.', price: 180, category: 'bridges' },
        'mat_br_cable_6x19_d16': { name: 'Канат стальной 6×19 Ø16мм', unit: 'м.п.', price: 280, category: 'bridges' },
        'mat_br_cable_6x19_d20': { name: 'Канат стальной 6×19 Ø20мм', unit: 'м.п.', price: 420, category: 'bridges' },
        'mat_br_cable_6x19_d24': { name: 'Канат стальной 6×19 Ø24мм', unit: 'м.п.', price: 580, category: 'bridges' },
        'mat_br_cable_6x37_d30': { name: 'Канат стальной 6×37 Ø30мм', unit: 'м.п.', price: 850, category: 'bridges' },
        'mat_br_cable_6x37_d40': { name: 'Канат стальной 6×37 Ø40мм', unit: 'м.п.', price: 1500, category: 'bridges' },
        'mat_br_strand_1x7_d15': { name: 'Прядь канатная 1×7 Ø15.2мм', unit: 'м.п.', price: 220, category: 'bridges' },
        'mat_br_strand_1x7_d12': { name: 'Прядь канатная 1×7 Ø12.7мм', unit: 'м.п.', price: 180, category: 'bridges' },
        // === ОПОРНЫЕ ЧАСТИ ===
        'mat_br_bearing_rubber_200': { name: 'Опорная часть РОЧ 200×200×52', unit: 'шт', price: 35000, category: 'bridges' },
        'mat_br_bearing_rubber_300': { name: 'Опорная часть РОЧ 300×300×72', unit: 'шт', price: 55000, category: 'bridges' },
        'mat_br_bearing_rubber_400': { name: 'Опорная часть РОЧ 400×400×92', unit: 'шт', price: 85000, category: 'bridges' },
        'mat_br_bearing_rubber_500': { name: 'Опорная часть РОЧ 500×500×102', unit: 'шт', price: 120000, category: 'bridges' },
        'mat_br_bearing_pot_500': { name: 'Опорная часть тангенциальная 500кН', unit: 'шт', price: 280000, category: 'bridges' },
        'mat_br_bearing_pot_1000': { name: 'Опорная часть тангенциальная 1000кН', unit: 'шт', price: 450000, category: 'bridges' },
        'mat_br_bearing_pot_2000': { name: 'Опорная часть тангенциальная 2000кН', unit: 'шт', price: 750000, category: 'bridges' },
        // === ДЕФОРМАЦИОННЫЕ ШВЫ ===
        'mat_br_expjoint_40': { name: 'Деформационный шов ±40мм', unit: 'м.п.', price: 35000, category: 'bridges' },
        'mat_br_expjoint_80': { name: 'Деформационный шов ±80мм', unit: 'м.п.', price: 55000, category: 'bridges' },
        'mat_br_expjoint_160': { name: 'Деформационный шов ±160мм', unit: 'м.п.', price: 85000, category: 'bridges' },
        'mat_br_expjoint_240': { name: 'Деформационный шов ±240мм', unit: 'м.п.', price: 120000, category: 'bridges' },
        'mat_br_expjoint_finger': { name: 'Деформационный шов гребёнчатый', unit: 'м.п.', price: 150000, category: 'bridges' },
        'mat_br_sealant_joint': { name: 'Герметик для деформ. швов (600мл)', unit: 'шт', price: 2500, category: 'bridges' },
        // === БАЛКИ И ПРОЛЁТНЫЕ СТРОЕНИЯ ===
        'mat_br_beam_pb_12m': { name: 'Балка ж/б ПБ-1 L=12м', unit: 'шт', price: 1200000, category: 'bridges' },
        'mat_br_beam_pb_15m': { name: 'Балка ж/б ПБ-1 L=15м', unit: 'шт', price: 1650000, category: 'bridges' },
        'mat_br_beam_pb_18m': { name: 'Балка ж/б ПБ-1 L=18м', unit: 'шт', price: 2100000, category: 'bridges' },
        'mat_br_beam_pb_24m': { name: 'Балка ж/б ПБ-2 L=24м', unit: 'шт', price: 3200000, category: 'bridges' },
        'mat_br_beam_pb_33m': { name: 'Балка ж/б ПБ-2 L=33м', unit: 'шт', price: 5500000, category: 'bridges' },
        'mat_br_beam_steel_12m': { name: 'Балка стальная пролётная L=12м', unit: 'шт', price: 1800000, category: 'bridges' },
        'mat_br_beam_steel_18m': { name: 'Балка стальная пролётная L=18м', unit: 'шт', price: 3200000, category: 'bridges' },
        'mat_br_beam_steel_24m': { name: 'Балка стальная пролётная L=24м', unit: 'шт', price: 5000000, category: 'bridges' },
        // === ОГРАЖДЕНИЯ МОСТОВЫЕ ===
        'mat_br_railing_metal': { name: 'Ограждение мостовое металл. H=1.1м', unit: 'м.п.', price: 12000, category: 'bridges' },
        'mat_br_railing_conc': { name: 'Парапет мостовой ж/б', unit: 'м.п.', price: 8500, category: 'bridges' },
        'mat_br_barrier_jersey': { name: 'Барьерное ограждение (жёсткое)', unit: 'м.п.', price: 15000, category: 'bridges' },
        'mat_br_barrier_w_beam': { name: 'Ограждение мостовое W-балка', unit: 'м.п.', price: 5500, category: 'bridges' },
        // === ВОДООТВЕДЕНИЕ МОСТА ===
        'mat_br_drain_d150': { name: 'Водоотвод мостовой Ø150', unit: 'шт', price: 8500, category: 'bridges' },
        'mat_br_drain_tray': { name: 'Лоток водоотводный мостовой', unit: 'м.п.', price: 3500, category: 'bridges' },
        'mat_br_waterproof_membrane': { name: 'Гидроизоляция мостовая (мембрана)', unit: 'м²', price: 1500, category: 'bridges' },
        'mat_br_waterproof_mastic': { name: 'Мастика гидроизоляционная мостовая', unit: 'кг', price: 550, category: 'bridges' },
        // === СВАИ ДЛЯ МОСТОВ ===
        'mat_br_pile_d300_6m': { name: 'Свая ж/б мостовая Ø300 L=6м', unit: 'шт', price: 45000, category: 'bridges' },
        'mat_br_pile_d400_8m': { name: 'Свая ж/б мостовая Ø400 L=8м', unit: 'шт', price: 75000, category: 'bridges' },
        'mat_br_pile_d500_10m': { name: 'Свая ж/б мостовая Ø500 L=10м', unit: 'шт', price: 120000, category: 'bridges' },
        'mat_br_pile_d600_12m': { name: 'Свая ж/б мостовая Ø600 L=12м', unit: 'шт', price: 180000, category: 'bridges' },
        'mat_br_pile_steel_530': { name: 'Свая металл. трубчатая Ø530', unit: 'м.п.', price: 45000, category: 'bridges' },
        'mat_br_pile_steel_720': { name: 'Свая металл. трубчатая Ø720', unit: 'м.п.', price: 65000, category: 'bridges' },
        // === АНТИКОРРОЗИЙНАЯ ЗАЩИТА ===
        'mat_br_paint_primer_ep': { name: 'Грунтовка эпоксидная мостовая', unit: 'кг', price: 2500, category: 'bridges' },
        'mat_br_paint_mid_ep': { name: 'Эмаль промежуточная эпоксидная', unit: 'кг', price: 3200, category: 'bridges' },
        'mat_br_paint_top_pu': { name: 'Эмаль покровная полиуретановая', unit: 'кг', price: 4500, category: 'bridges' },
        'mat_br_zinc_spray': { name: 'Цинковое покрытие (холодное)', unit: 'кг', price: 5500, category: 'bridges' }
    };
})();
