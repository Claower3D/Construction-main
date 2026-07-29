// === ПИЛОМАТЕРИАЛЫ, ФАНЕРА, ОСП (50 позиций) ===
(function () {
    window.AI_MAT_LUMBER = {
        // Доска обрезная (сосна/ель)
        'board_25x100': { name: 'Доска обрезная 25×100мм', unit: 'м³', price: 55000, category: 'lumber' },
        'board_25x150': { name: 'Доска обрезная 25×150мм', unit: 'м³', price: 55000, category: 'lumber' },
        'board_30x150': { name: 'Доска обрезная 30×150мм', unit: 'м³', price: 56000, category: 'lumber' },
        'board_40x150': { name: 'Доска обрезная 40×150мм', unit: 'м³', price: 58000, category: 'lumber' },
        'board_50x150': { name: 'Доска обрезная 50×150мм', unit: 'м³', price: 60000, category: 'lumber' },
        'board_50x200': { name: 'Доска обрезная 50×200мм', unit: 'м³', price: 62000, category: 'lumber' },

        // Доска строганая
        'board_plan_20x100': { name: 'Доска строганая 20×100мм', unit: 'м³', price: 70000, category: 'lumber' },
        'board_plan_20x150': { name: 'Доска строганая 20×150мм', unit: 'м³', price: 72000, category: 'lumber' },

        // Доска половая
        'board_floor_28x130': { name: 'Доска половая шпунтованная 28мм', unit: 'м²', price: 2800, category: 'lumber' },
        'board_floor_36x130': { name: 'Доска половая шпунтованная 36мм', unit: 'м²', price: 3500, category: 'lumber' },

        // Брус
        'beam_50x50': { name: 'Брус 50×50мм', unit: 'м³', price: 58000, category: 'lumber' },
        'beam_50x100': { name: 'Брус 50×100мм', unit: 'м³', price: 58000, category: 'lumber' },
        'beam_100x100': { name: 'Брус 100×100мм', unit: 'м³', price: 60000, category: 'lumber' },
        'beam_100x150': { name: 'Брус 100×150мм', unit: 'м³', price: 62000, category: 'lumber' },
        'beam_150x150': { name: 'Брус 150×150мм', unit: 'м³', price: 65000, category: 'lumber' },
        'beam_150x200': { name: 'Брус 150×200мм', unit: 'м³', price: 68000, category: 'lumber' },
        'beam_200x200': { name: 'Брус 200×200мм', unit: 'м³', price: 70000, category: 'lumber' },

        // Рейка / брусок
        'batten_25x50': { name: 'Рейка 25×50мм', unit: 'п.м.', price: 80, category: 'lumber' },
        'batten_30x40': { name: 'Рейка 30×40мм', unit: 'п.м.', price: 70, category: 'lumber' },
        'batten_40x40': { name: 'Брусок 40×40мм', unit: 'п.м.', price: 90, category: 'lumber' },
        'batten_50x50': { name: 'Брусок 50×50мм', unit: 'п.м.', price: 120, category: 'lumber' },

        // Фанера
        'plywood_fk_4': { name: 'Фанера ФК 4мм (1525×1525)', unit: 'лист', price: 1200, category: 'lumber' },
        'plywood_fk_6': { name: 'Фанера ФК 6мм (1525×1525)', unit: 'лист', price: 1600, category: 'lumber' },
        'plywood_fk_10': { name: 'Фанера ФК 10мм (1525×1525)', unit: 'лист', price: 2400, category: 'lumber' },
        'plywood_fk_12': { name: 'Фанера ФК 12мм (1525×1525)', unit: 'лист', price: 2800, category: 'lumber' },
        'plywood_fk_15': { name: 'Фанера ФК 15мм (1525×1525)', unit: 'лист', price: 3400, category: 'lumber' },
        'plywood_fk_18': { name: 'Фанера ФК 18мм (1525×1525)', unit: 'лист', price: 3800, category: 'lumber' },
        'plywood_fsf_12': { name: 'Фанера ФСФ 12мм (2440×1220)', unit: 'лист', price: 3500, category: 'lumber' },
        'plywood_fsf_18': { name: 'Фанера ФСФ 18мм (2440×1220)', unit: 'лист', price: 4800, category: 'lumber' },
        'plywood_fsf_21': { name: 'Фанера ФСФ 21мм (2440×1220)', unit: 'лист', price: 5500, category: 'lumber' },
        'plywood_lam_18': { name: 'Фанера ламинированная 18мм', unit: 'лист', price: 6000, category: 'lumber' },
        'plywood_lam_21': { name: 'Фанера ламинированная 21мм', unit: 'лист', price: 7500, category: 'lumber' },

        // ОСП (OSB)
        'osb3_9': { name: 'ОСП-3 9мм (2500×1250)', unit: 'лист', price: 3200, category: 'lumber' },
        'osb3_12': { name: 'ОСП-3 12мм (2500×1250)', unit: 'лист', price: 4200, category: 'lumber' },
        'osb3_15': { name: 'ОСП-3 15мм (2500×1250)', unit: 'лист', price: 5000, category: 'lumber' },
        'osb3_18': { name: 'ОСП-3 18мм (2500×1250)', unit: 'лист', price: 5800, category: 'lumber' },
        'osb3_22': { name: 'ОСП-3 22мм (2500×1250)', unit: 'лист', price: 7000, category: 'lumber' },

        // ДСП / ДВП / МДФ
        'dsp_16': { name: 'ДСП 16мм (2750×1830)', unit: 'лист', price: 4000, category: 'lumber' },
        'dvp_3_2': { name: 'ДВП 3.2мм (2745×1700)', unit: 'лист', price: 900, category: 'lumber' },
        'mdf_6': { name: 'МДФ 6мм (2440×1220)', unit: 'лист', price: 2200, category: 'lumber' },
        'mdf_10': { name: 'МДФ 10мм (2440×1220)', unit: 'лист', price: 3500, category: 'lumber' },
        'mdf_16': { name: 'МДФ 16мм (2440×1220)', unit: 'лист', price: 4800, category: 'lumber' },

        // Вагонка
        'vagonka_pine_12_5': { name: 'Вагонка сосна 12.5×96мм (сорт А)', unit: 'м²', price: 1200, category: 'lumber' },
        'vagonka_pine_euro': { name: 'Евровагонка сосна 12.5×96мм', unit: 'м²', price: 1500, category: 'lumber' },
        'vagonka_lipa': { name: 'Вагонка липа 15×96мм (для бани)', unit: 'м²', price: 2500, category: 'lumber' },

        // Блок-хаус
        'blockhouse_28': { name: 'Блок-хаус 28×140мм (сосна)', unit: 'м²', price: 1800, category: 'lumber' },
        'blockhouse_36': { name: 'Блок-хаус 36×185мм (сосна)', unit: 'м²', price: 2400, category: 'lumber' },

        // Террасная доска
        'deck_dpk_140': { name: 'Террасная доска ДПК 140×25мм', unit: 'п.м.', price: 1500, category: 'lumber' },
        'deck_larch': { name: 'Террасная доска лиственница 28мм', unit: 'м²', price: 3500, category: 'lumber' },

        // Обработка
        'antiseptic_10l': { name: 'Антисептик для дерева (10л)', unit: 'шт', price: 4500, category: 'lumber' },
        'fire_protect_wood_10l': { name: 'Огнебиозащита для дерева (10л)', unit: 'шт', price: 5500, category: 'lumber' }
    };
})();
