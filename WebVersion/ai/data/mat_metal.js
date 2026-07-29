// === МЕТАЛЛОПРОКАТ (60 позиций) ===
(function () {
    window.AI_MAT_METAL = {
        // Трубы профильные
        'pipe_prof_20x20x1_5': { name: 'Труба профильная 20×20×1.5мм (6м)', unit: 'шт', price: 550, category: 'metal' },
        'pipe_prof_25x25x2': { name: 'Труба профильная 25×25×2мм (6м)', unit: 'шт', price: 800, category: 'metal' },
        'pipe_prof_40x20x2': { name: 'Труба профильная 40×20×2мм (6м)', unit: 'шт', price: 900, category: 'metal' },
        'pipe_prof_40x40x2': { name: 'Труба профильная 40×40×2мм (6м)', unit: 'шт', price: 1200, category: 'metal' },
        'pipe_prof_50x50x3': { name: 'Труба профильная 50×50×3мм (6м)', unit: 'шт', price: 2200, category: 'metal' },
        'pipe_prof_60x40x3': { name: 'Труба профильная 60×40×3мм (6м)', unit: 'шт', price: 2500, category: 'metal' },
        'pipe_prof_60x60x3': { name: 'Труба профильная 60×60×3мм (6м)', unit: 'шт', price: 2800, category: 'metal' },
        'pipe_prof_80x40x3': { name: 'Труба профильная 80×40×3мм (6м)', unit: 'шт', price: 3000, category: 'metal' },
        'pipe_prof_80x80x3': { name: 'Труба профильная 80×80×3мм (6м)', unit: 'шт', price: 3800, category: 'metal' },
        'pipe_prof_100x100x4': { name: 'Труба профильная 100×100×4мм (6м)', unit: 'шт', price: 6000, category: 'metal' },
        'pipe_prof_120x120x4': { name: 'Труба профильная 120×120×4мм (6м)', unit: 'шт', price: 8000, category: 'metal' },

        // Трубы круглые
        'pipe_round_25x2_5': { name: 'Труба круглая Ø25×2.5мм (6м)', unit: 'шт', price: 700, category: 'metal' },
        'pipe_round_32x2_5': { name: 'Труба круглая Ø32×2.5мм (6м)', unit: 'шт', price: 900, category: 'metal' },
        'pipe_round_42x3': { name: 'Труба круглая Ø42×3мм (6м)', unit: 'шт', price: 1500, category: 'metal' },
        'pipe_round_57x3_5': { name: 'Труба круглая Ø57×3.5мм (6м)', unit: 'шт', price: 2200, category: 'metal' },
        'pipe_round_76x3_5': { name: 'Труба круглая Ø76×3.5мм (6м)', unit: 'шт', price: 3200, category: 'metal' },

        // Уголок
        'angle_25x25x3': { name: 'Уголок 25×25×3мм (6м)', unit: 'шт', price: 500, category: 'metal' },
        'angle_32x32x3': { name: 'Уголок 32×32×3мм (6м)', unit: 'шт', price: 650, category: 'metal' },
        'angle_40x40x4': { name: 'Уголок 40×40×4мм (6м)', unit: 'шт', price: 1100, category: 'metal' },
        'angle_50x50x5': { name: 'Уголок 50×50×5мм (6м)', unit: 'шт', price: 1800, category: 'metal' },
        'angle_63x63x5': { name: 'Уголок 63×63×5мм (6м)', unit: 'шт', price: 2400, category: 'metal' },
        'angle_75x75x5': { name: 'Уголок 75×75×5мм (6м)', unit: 'шт', price: 2900, category: 'metal' },
        'angle_100x100x7': { name: 'Уголок 100×100×7мм (6м)', unit: 'шт', price: 5200, category: 'metal' },

        // Швеллер
        'channel_8p': { name: 'Швеллер 8П (6м)', unit: 'шт', price: 3800, category: 'metal' },
        'channel_10p': { name: 'Швеллер 10П (6м)', unit: 'шт', price: 5000, category: 'metal' },
        'channel_12p': { name: 'Швеллер 12П (6м)', unit: 'шт', price: 6200, category: 'metal' },
        'channel_14p': { name: 'Швеллер 14П (6м)', unit: 'шт', price: 7500, category: 'metal' },
        'channel_16p': { name: 'Швеллер 16П (6м)', unit: 'шт', price: 9000, category: 'metal' },
        'channel_20p': { name: 'Швеллер 20П (6м)', unit: 'шт', price: 12000, category: 'metal' },

        // Двутавр
        'beam_i_10': { name: 'Двутавр №10 (12м)', unit: 'шт', price: 10000, category: 'metal' },
        'beam_i_14': { name: 'Двутавр №14 (12м)', unit: 'шт', price: 15000, category: 'metal' },
        'beam_i_16': { name: 'Двутавр №16 (12м)', unit: 'шт', price: 18000, category: 'metal' },
        'beam_i_20': { name: 'Двутавр №20 (12м)', unit: 'шт', price: 25000, category: 'metal' },

        // Лист стальной
        'sheet_06mm': { name: 'Лист стальной 0.6мм (1250×2500)', unit: 'лист', price: 1800, category: 'metal' },
        'sheet_08mm': { name: 'Лист стальной 0.8мм (1250×2500)', unit: 'лист', price: 2200, category: 'metal' },
        'sheet_1mm': { name: 'Лист стальной 1мм (1250×2500)', unit: 'лист', price: 2800, category: 'metal' },
        'sheet_1_5mm': { name: 'Лист стальной 1.5мм (1250×2500)', unit: 'лист', price: 3800, category: 'metal' },
        'sheet_2mm': { name: 'Лист стальной 2мм (1250×2500)', unit: 'лист', price: 5000, category: 'metal' },
        'sheet_3mm': { name: 'Лист стальной 3мм (1250×2500)', unit: 'лист', price: 7500, category: 'metal' },
        'sheet_4mm': { name: 'Лист стальной 4мм (1500×6000)', unit: 'лист', price: 20000, category: 'metal' },
        'sheet_5mm': { name: 'Лист стальной 5мм (1500×6000)', unit: 'лист', price: 25000, category: 'metal' },
        'sheet_8mm': { name: 'Лист стальной 8мм (1500×6000)', unit: 'лист', price: 38000, category: 'metal' },
        'sheet_10mm': { name: 'Лист стальной 10мм (1500×6000)', unit: 'лист', price: 48000, category: 'metal' },

        // Лист оцинкованный
        'sheet_galv_05mm': { name: 'Лист оцинкованный 0.5мм (1250×2500)', unit: 'лист', price: 2200, category: 'metal' },
        'sheet_galv_07mm': { name: 'Лист оцинкованный 0.7мм (1250×2500)', unit: 'лист', price: 2800, category: 'metal' },
        'sheet_galv_1mm': { name: 'Лист оцинкованный 1мм (1250×2500)', unit: 'лист', price: 3500, category: 'metal' },

        // Полоса
        'strip_4x40': { name: 'Полоса 4×40мм (6м)', unit: 'шт', price: 600, category: 'metal' },
        'strip_5x50': { name: 'Полоса 5×50мм (6м)', unit: 'шт', price: 1000, category: 'metal' },

        // Круг (пруток)
        'round_bar_8': { name: 'Круг Ø8мм (6м)', unit: 'шт', price: 200, category: 'metal' },
        'round_bar_12': { name: 'Круг Ø12мм (6м)', unit: 'шт', price: 350, category: 'metal' },
        'round_bar_16': { name: 'Круг Ø16мм (6м)', unit: 'шт', price: 550, category: 'metal' },

        // Сварочные материалы
        'electrode_3mm_mma': { name: 'Электроды МР-3 Ø3мм (5кг)', unit: 'уп.', price: 2000, category: 'metal' },
        'electrode_2_5mm_mma': { name: 'Электроды МР-3 Ø2.5мм (5кг)', unit: 'уп.', price: 1800, category: 'metal' },
        'electrode_4mm_mma': { name: 'Электроды МР-3 Ø4мм (5кг)', unit: 'уп.', price: 2200, category: 'metal' },
        'wire_mig_0_8': { name: 'Проволока сварочная MIG 0.8мм (5кг)', unit: 'катушка', price: 2500, category: 'metal' },
        'wire_mig_1_0': { name: 'Проволока сварочная MIG 1.0мм (15кг)', unit: 'катушка', price: 6000, category: 'metal' },

        // Заклёпки / болты
        'bolt_m8x50': { name: 'Болт М8×50 с гайкой (50шт)', unit: 'уп.', price: 350, category: 'metal' },
        'bolt_m10x60': { name: 'Болт М10×60 с гайкой (25шт)', unit: 'уп.', price: 300, category: 'metal' },
        'bolt_m12x80': { name: 'Болт М12×80 с гайкой (25шт)', unit: 'уп.', price: 450, category: 'metal' },

        // Грунтовка по металлу
        'primer_metal_gf021_2_5': { name: 'Грунт ГФ-021 (2.5кг)', unit: 'шт', price: 1000, category: 'metal' }
    };
})();
