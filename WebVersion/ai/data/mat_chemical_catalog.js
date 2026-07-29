// === ХИМИЧЕСКАЯ ПРОМЫШЛЕННОСТЬ — защитные покрытия, кислотостойкие, полимерные ёмкости (200 поз.) ===
(function () {
    window.AI_MAT_CHEMICAL = {
        // === КИСЛОТОСТОЙКИЕ МАТЕРИАЛЫ ===
        'mat_ch_brick_acid': { name: 'Кирпич кислотоупорный КУ', unit: 'шт', price: 120, category: 'chemical' },
        'mat_ch_tile_acid_150': { name: 'Плитка кислотоупорная 150×150×20', unit: 'шт', price: 180, category: 'chemical' },
        'mat_ch_tile_acid_200': { name: 'Плитка кислотоупорная 200×200×20', unit: 'шт', price: 350, category: 'chemical' },
        'mat_ch_tile_acid_300': { name: 'Плитка кислотоупорная 300×300×30', unit: 'шт', price: 650, category: 'chemical' },
        'mat_ch_mastic_acid': { name: 'Мастика кислотоупорная (20кг)', unit: 'ведро', price: 12000, category: 'chemical' },
        'mat_ch_mortar_acid': { name: 'Раствор кислотоупорный (25кг)', unit: 'мешок', price: 5500, category: 'chemical' },
        'mat_ch_grout_acid': { name: 'Затирка кислотостойкая (5кг)', unit: 'упак.', price: 4500, category: 'chemical' },
        // === ЗАЩИТНЫЕ ПОКРЫТИЯ ===
        'mat_ch_coat_epoxy_2k': { name: 'Покрытие эпоксидное 2К (25кг)', unit: 'комп.', price: 45000, category: 'chemical' },
        'mat_ch_coat_epoxy_novolac': { name: 'Покрытие эпоксиноволачное (25кг)', unit: 'комп.', price: 65000, category: 'chemical' },
        'mat_ch_coat_vinyl_ester': { name: 'Покрытие винилэфирное (25кг)', unit: 'комп.', price: 55000, category: 'chemical' },
        'mat_ch_coat_polyurea': { name: 'Полимочевина (25кг)', unit: 'комп.', price: 85000, category: 'chemical' },
        'mat_ch_coat_polyurethane': { name: 'Покрытие полиуретановое (25кг)', unit: 'комп.', price: 42000, category: 'chemical' },
        'mat_ch_coat_rubber_lining': { name: 'Резиновая футеровка (листовая)', unit: 'м²', price: 8500, category: 'chemical' },
        'mat_ch_coat_frp_lining': { name: 'Стеклопластиковая футеровка', unit: 'м²', price: 12000, category: 'chemical' },
        'mat_ch_coat_ptfe_sheet': { name: 'Лист PTFE (фторопласт) 2мм', unit: 'м²', price: 15000, category: 'chemical' },
        'mat_ch_coat_pvdf_sheet': { name: 'Лист PVDF 3мм', unit: 'м²', price: 12000, category: 'chemical' },
        'mat_ch_coat_pp_sheet': { name: 'Лист полипропиленовый 5мм', unit: 'м²', price: 3500, category: 'chemical' },
        'mat_ch_coat_pe_sheet': { name: 'Лист полиэтиленовый 5мм', unit: 'м²', price: 2800, category: 'chemical' },
        // === ПОЛИМЕРНЫЕ ТРУБЫ (ХИМ.СТОЙКИЕ) ===
        'mat_ch_pipe_pvdf_32': { name: 'Труба PVDF Ду32', unit: 'м.п.', price: 3500, category: 'chemical' },
        'mat_ch_pipe_pvdf_50': { name: 'Труба PVDF Ду50', unit: 'м.п.', price: 5500, category: 'chemical' },
        'mat_ch_pipe_pvdf_75': { name: 'Труба PVDF Ду75', unit: 'м.п.', price: 8500, category: 'chemical' },
        'mat_ch_pipe_pvdf_110': { name: 'Труба PVDF Ду110', unit: 'м.п.', price: 15000, category: 'chemical' },
        'mat_ch_pipe_pp_acid_50': { name: 'Труба ПП кислотостойкая Ду50', unit: 'м.п.', price: 2500, category: 'chemical' },
        'mat_ch_pipe_pp_acid_110': { name: 'Труба ПП кислотостойкая Ду110', unit: 'м.п.', price: 5500, category: 'chemical' },
        'mat_ch_pipe_frp_100': { name: 'Труба стеклопластиковая Ду100', unit: 'м.п.', price: 8500, category: 'chemical' },
        'mat_ch_pipe_frp_150': { name: 'Труба стеклопластиковая Ду150', unit: 'м.п.', price: 12000, category: 'chemical' },
        'mat_ch_pipe_frp_200': { name: 'Труба стеклопластиковая Ду200', unit: 'м.п.', price: 18000, category: 'chemical' },
        'mat_ch_pipe_frp_300': { name: 'Труба стеклопластиковая Ду300', unit: 'м.п.', price: 28000, category: 'chemical' },
        // === ЁМКОСТИ И РЕЗЕРВУАРЫ ===
        'mat_ch_tank_pe_1000': { name: 'Ёмкость ПЭ 1000л (вертикальная)', unit: 'шт', price: 45000, category: 'chemical' },
        'mat_ch_tank_pe_2000': { name: 'Ёмкость ПЭ 2000л', unit: 'шт', price: 75000, category: 'chemical' },
        'mat_ch_tank_pe_5000': { name: 'Ёмкость ПЭ 5000л', unit: 'шт', price: 150000, category: 'chemical' },
        'mat_ch_tank_pe_10000': { name: 'Ёмкость ПЭ 10000л', unit: 'шт', price: 280000, category: 'chemical' },
        'mat_ch_tank_frp_5000': { name: 'Ёмкость стеклопластик 5м³', unit: 'шт', price: 350000, category: 'chemical' },
        'mat_ch_tank_frp_10000': { name: 'Ёмкость стеклопластик 10м³', unit: 'шт', price: 650000, category: 'chemical' },
        'mat_ch_tank_frp_25000': { name: 'Ёмкость стеклопластик 25м³', unit: 'шт', price: 1200000, category: 'chemical' },
        'mat_ch_tank_ss_316_1000': { name: 'Ёмкость н/ж ст. AISI 316 1м³', unit: 'шт', price: 350000, category: 'chemical' },
        'mat_ch_tank_ss_316_5000': { name: 'Ёмкость н/ж ст. AISI 316 5м³', unit: 'шт', price: 1200000, category: 'chemical' },
        // === ПАЛЕТОЧНЫЕ ПОДДОНЫ ===
        'mat_ch_bund_pe_200l': { name: 'Поддон-локализатор для 1 бочки 200л', unit: 'шт', price: 25000, category: 'chemical' },
        'mat_ch_bund_pe_4x200l': { name: 'Поддон-локализатор для 4 бочек', unit: 'шт', price: 65000, category: 'chemical' },
        'mat_ch_bund_pe_ibc': { name: 'Поддон-локализатор для IBC куба', unit: 'шт', price: 55000, category: 'chemical' },
        // === НАСОСЫ ХИМИЧЕСКИЕ ===
        'mat_ch_pump_magnet_25': { name: 'Насос магнитный химический Ду25', unit: 'шт', price: 180000, category: 'chemical' },
        'mat_ch_pump_magnet_50': { name: 'Насос магнитный химический Ду50', unit: 'шт', price: 350000, category: 'chemical' },
        'mat_ch_pump_diaphragm_25': { name: 'Насос мембранный пневматич. Ду25', unit: 'шт', price: 120000, category: 'chemical' },
        'mat_ch_pump_diaphragm_50': { name: 'Насос мембранный пневматич. Ду50', unit: 'шт', price: 220000, category: 'chemical' },
        'mat_ch_pump_peristaltic': { name: 'Насос перистальтический 500л/ч', unit: 'шт', price: 280000, category: 'chemical' },
        // === СРЕДСТВА ЗАЩИТЫ ===
        'mat_ch_suit_acid': { name: 'Костюм кислотозащитный', unit: 'шт', price: 15000, category: 'chemical' },
        'mat_ch_gloves_acid': { name: 'Перчатки кислотостойкие', unit: 'пара', price: 2500, category: 'chemical' },
        'mat_ch_boots_acid': { name: 'Сапоги кислотостойкие', unit: 'пара', price: 8500, category: 'chemical' },
        'mat_ch_respirator_chem': { name: 'Респиратор с хим. фильтром', unit: 'шт', price: 5500, category: 'chemical' },
        'mat_ch_shower_emergency': { name: 'Душ аварийный (стационарный)', unit: 'шт', price: 120000, category: 'chemical' },
        'mat_ch_eyewash_station': { name: 'Станция промывки глаз', unit: 'шт', price: 65000, category: 'chemical' },
        'mat_ch_spill_kit': { name: 'Набор для ликвидации проливов', unit: 'комп.', price: 35000, category: 'chemical' },
        // === ГАЗООЧИСТКА ===
        'mat_ch_scrubber_small': { name: 'Скруббер малый 1000м³/ч', unit: 'шт', price: 850000, category: 'chemical' },
        'mat_ch_scrubber_medium': { name: 'Скруббер средний 5000м³/ч', unit: 'шт', price: 2500000, category: 'chemical' },
        'mat_ch_carbon_filter_500': { name: 'Фильтр угольный 500м³/ч', unit: 'шт', price: 350000, category: 'chemical' },
        'mat_ch_activated_carbon_25': { name: 'Уголь активированный (25кг)', unit: 'мешок', price: 8500, category: 'chemical' }
    };
})();
