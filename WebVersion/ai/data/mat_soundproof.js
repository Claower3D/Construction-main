// === ЗВУКОИЗОЛЯЦИЯ СПЕЦИАЛИЗИРОВАННАЯ (40 позиций) ===
(function () {
    window.AI_MAT_SOUNDPROOF = {
        // ЗИПС-панели (каркасная ЗИ)
        'zips_vector_40': { name: 'ЗИПС-Вектор 40мм (1200×600)', unit: 'шт', price: 2500, category: 'soundproof' },
        'zips_modula_70': { name: 'ЗИПС-Модуль 70мм (1200×600)', unit: 'шт', price: 3500, category: 'soundproof' },
        'zips_sinema_133': { name: 'ЗИПС-Синема 133мм (1200×600)', unit: 'шт', price: 5500, category: 'soundproof' },

        // Тексаунд (тяжёлая мембрана)
        'tecsound_50': { name: 'Тексаунд 50 (звукоизоляц. мембрана, м²)', unit: 'м²', price: 1200, category: 'soundproof' },
        'tecsound_70': { name: 'Тексаунд 70 (звукоизоляц. мембрана, м²)', unit: 'м²', price: 1500, category: 'soundproof' },
        'tecsound_2ft_80': { name: 'Тексаунд 2FT 80 (с войлоком, м²)', unit: 'м²', price: 2200, category: 'soundproof' },

        // Звукоизоляционные плиты
        'sound_plate_acoustic': { name: 'Плита звукопоглощающая (Максфорте, 50мм)', unit: 'м²', price: 600, category: 'soundproof' },
        'sound_plate_50_premium': { name: 'Плита звукоизол. premium 50мм (50кг/м³)', unit: 'м²', price: 800, category: 'soundproof' },
        'sound_plate_27': { name: 'Плита звукоизол. тонкая 27мм', unit: 'м²', price: 500, category: 'soundproof' },

        // Виброподвесы
        'vibro_suspend_60': { name: 'Виброподвес (нагрузка до 12кг)', unit: 'шт', price: 250, category: 'soundproof' },
        'vibro_suspend_120': { name: 'Виброподвес (нагрузка до 25кг)', unit: 'шт', price: 350, category: 'soundproof' },
        'vibro_suspend_premium': { name: 'Виброподвес премиум (с эластомером)', unit: 'шт', price: 500, category: 'soundproof' },

        // Виброизоляция
        'vibro_isolator_washer': { name: 'Виброшайба для профиля', unit: 'шт', price: 5, category: 'soundproof' },
        'vibro_mat_5mm': { name: 'Виброизоляционный мат 5мм (м²)', unit: 'м²', price: 400, category: 'soundproof' },
        'vibro_mat_10mm': { name: 'Виброизоляционный мат 10мм (м²)', unit: 'м²', price: 700, category: 'soundproof' },
        'vibro_mat_under_equip_12': { name: 'Виброизоляция под оборудование 12мм (м²)', unit: 'м²', price: 1000, category: 'soundproof' },

        // Демпферные ленты (акустические)
        'demper_acoustic_3x50': { name: 'Лента демпферная акустическая 3×50мм (30м)', unit: 'рулон', price: 400, category: 'soundproof' },
        'demper_acoustic_3x70': { name: 'Лента демпферная акустическая 3×70мм (30м)', unit: 'рулон', price: 500, category: 'soundproof' },
        'demper_acoustic_3x100': { name: 'Лента демпферная акустическая 3×100мм (30м)', unit: 'рулон', price: 700, category: 'soundproof' },

        // Звукоизоляционный герметик
        'sealant_acoustic_310': { name: 'Герметик виброакустический (310мл)', unit: 'шт', price: 600, category: 'soundproof' },
        'sealant_acoustic_600': { name: 'Герметик виброакустический (600мл)', unit: 'шт', price: 1000, category: 'soundproof' },

        // Акустический ГКЛ
        'gkl_acoustic_12_5': { name: 'ГКЛ акустический 12.5мм (перфорир.)', unit: 'лист', price: 5000, category: 'soundproof' },
        'gvl_acoustic_12': { name: 'ГВЛ высокой плотности для ЗИ (12мм)', unit: 'лист', price: 5500, category: 'soundproof' },

        // Звукопоглощающие панели (декоративные)
        'panel_acoustic_felt_25': { name: 'Панель акустическая (войлок, 600×600×25)', unit: 'шт', price: 1500, category: 'soundproof' },
        'panel_acoustic_foam_50': { name: 'Панель акустическая (пена, пирамидка, 1000×1000)', unit: 'шт', price: 800, category: 'soundproof' },
        'panel_acoustic_wood_perf': { name: 'Панель акустическая (дерево перфорир., 600×600)', unit: 'шт', price: 3000, category: 'soundproof' },
        'panel_acoustic_baffle': { name: 'Бафл подвесной акустический (1200×300)', unit: 'шт', price: 2000, category: 'soundproof' },

        // Подложки шумоизоляционные под стяжку
        'underlay_sound_5': { name: 'Подложка шумоизоляционная 5мм (под стяжку)', unit: 'м²', price: 300, category: 'soundproof' },
        'underlay_sound_8': { name: 'Подложка шумоизоляционная 8мм (под стяжку)', unit: 'м²', price: 450, category: 'soundproof' },
        'underlay_sound_10': { name: 'Подложка шумоизоляционная 10мм (под стяжку)', unit: 'м²', price: 550, category: 'soundproof' },
        'underlay_sound_20': { name: 'Подложка шумоизоляция 20мм (под плав. стяжку)', unit: 'м²', price: 800, category: 'soundproof' },

        // Дверь звукоизоляционная
        'door_acoustic_rw37': { name: 'Дверь звукоизоляционная Rw37дБ (900мм)', unit: 'шт', price: 35000, category: 'soundproof' },
        'door_acoustic_rw42': { name: 'Дверь звукоизоляционная Rw42дБ (900мм)', unit: 'шт', price: 55000, category: 'soundproof' },

        // Окно звукоизоляционное
        'window_acoustic_rw40': { name: 'Окно шумозащитное Rw40 (1300×1400)', unit: 'шт', price: 60000, category: 'soundproof' },

        // Монтажные элементы
        'channel_sound_50': { name: 'Звукоизоляционный профиль CW-50 (3м)', unit: 'шт', price: 900, category: 'soundproof' },
        'channel_sound_75': { name: 'Звукоизоляционный профиль CW-75 (3м)', unit: 'шт', price: 1100, category: 'soundproof' },

        // Шумоизоляция труб/инженерии
        'pipe_sound_wrap_110': { name: 'Шумоизоляция для канализационной трубы Ø110 (1м)', unit: 'шт', price: 500, category: 'soundproof' },
        'pipe_sound_wrap_50': { name: 'Шумоизоляция для канализационной трубы Ø50 (1м)', unit: 'шт', price: 350, category: 'soundproof' },
        'sound_silent_pipe_110': { name: 'Канализация бесшумная Ø110мм (1м)', unit: 'шт', price: 800, category: 'soundproof' },
        'sound_silent_pipe_50': { name: 'Канализация бесшумная Ø50мм (1м)', unit: 'шт', price: 500, category: 'soundproof' }
    };
})();
