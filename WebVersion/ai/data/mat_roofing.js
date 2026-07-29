// === КРОВЕЛЬНЫЕ МАТЕРИАЛЫ (50 позиций) ===
(function () {
    window.AI_MAT_ROOFING = {
        // Металлочерепица
        'mtile_monterrey_045': { name: 'Металлочерепица Монтеррей 0.45мм', unit: 'м²', price: 2200, category: 'roofing' },
        'mtile_monterrey_05': { name: 'Металлочерепица Монтеррей 0.5мм', unit: 'м²', price: 2800, category: 'roofing' },
        'mtile_supermonterrey': { name: 'Металлочерепица Супермонтеррей 0.5мм', unit: 'м²', price: 3200, category: 'roofing' },
        'mtile_cascade': { name: 'Металлочерепица Каскад 0.5мм', unit: 'м²', price: 3000, category: 'roofing' },

        // Профнастил кровельный
        'profsheet_c8_04': { name: 'Профнастил С-8 0.4мм', unit: 'м²', price: 1200, category: 'roofing' },
        'profsheet_c20_045': { name: 'Профнастил С-20 0.45мм', unit: 'м²', price: 1600, category: 'roofing' },
        'profsheet_c21_05': { name: 'Профнастил С-21 0.5мм', unit: 'м²', price: 1900, category: 'roofing' },
        'profsheet_hc35_05': { name: 'Профнастил НС-35 0.5мм', unit: 'м²', price: 2200, category: 'roofing' },
        'profsheet_h60_07': { name: 'Профнастил Н-60 0.7мм', unit: 'м²', price: 3000, category: 'roofing' },
        'profsheet_h75_07': { name: 'Профнастил Н-75 0.7мм', unit: 'м²', price: 3500, category: 'roofing' },

        // Мягкая черепица
        'shingles_basic': { name: 'Гибкая черепица (стандарт)', unit: 'м²', price: 1500, category: 'roofing' },
        'shingles_multi': { name: 'Гибкая черепица (многослойная)', unit: 'м²', price: 2500, category: 'roofing' },
        'shingles_premium': { name: 'Гибкая черепица (премиум)', unit: 'м²', price: 3500, category: 'roofing' },

        // ПВХ мембрана
        'membrane_pvc_12': { name: 'ПВХ мембрана 1.2мм', unit: 'м²', price: 1200, category: 'roofing' },
        'membrane_pvc_15': { name: 'ПВХ мембрана 1.5мм', unit: 'м²', price: 1600, category: 'roofing' },
        'membrane_tpo_12': { name: 'ТПО мембрана 1.2мм', unit: 'м²', price: 1400, category: 'roofing' },
        'membrane_epdm_12': { name: 'ЭПДМ мембрана 1.2мм', unit: 'м²', price: 1800, category: 'roofing' },

        // Ондулин / еврошифер
        'ondulin_sheet': { name: 'Ондулин лист 1950×960мм', unit: 'лист', price: 2800, category: 'roofing' },

        // Рубероид / наплавляемые
        'ruberoid_rkp': { name: 'Рубероид РКП-350 (15м²)', unit: 'рулон', price: 1200, category: 'roofing' },
        'bikrost_hkp': { name: 'Бикрост ХКП (нижний слой, 10м²)', unit: 'рулон', price: 1500, category: 'roofing' },
        'bikrost_tkp': { name: 'Бикрост ТКП (верхний слой, 10м²)', unit: 'рулон', price: 1800, category: 'roofing' },
        'uniflex_epv': { name: 'Унифлекс ЭПВ (нижний, 10м²)', unit: 'рулон', price: 2500, category: 'roofing' },
        'uniflex_ekp': { name: 'Унифлекс ЭКП (верхний, 10м²)', unit: 'рулон', price: 3000, category: 'roofing' },

        // Доборные элементы
        'ridge_round': { name: 'Конёк полукруглый', unit: 'шт (2м)', price: 1200, category: 'roofing' },
        'ridge_flat': { name: 'Конёк плоский', unit: 'шт (2м)', price: 800, category: 'roofing' },
        'endova_lower': { name: 'Ендова нижняя', unit: 'шт (2м)', price: 900, category: 'roofing' },
        'endova_upper': { name: 'Ендова верхняя', unit: 'шт (2м)', price: 700, category: 'roofing' },
        'wind_plank': { name: 'Ветровая (торцевая) планка', unit: 'шт (2м)', price: 600, category: 'roofing' },
        'drip_plank': { name: 'Карнизная планка', unit: 'шт (2м)', price: 500, category: 'roofing' },
        'adj_plank': { name: 'Планка примыкания', unit: 'шт (2м)', price: 700, category: 'roofing' },

        // Снегозадержание
        'snow_holder_tube': { name: 'Снегозадержатель трубчатый (3м)', unit: 'шт', price: 3500, category: 'roofing' },
        'snow_holder_plank': { name: 'Снегозадержатель планочный (2м)', unit: 'шт', price: 1500, category: 'roofing' },

        // Водосточная система
        'gutter_125': { name: 'Желоб водосточный Ø125мм (3м)', unit: 'шт', price: 1200, category: 'roofing' },
        'gutter_150': { name: 'Желоб водосточный Ø150мм (3м)', unit: 'шт', price: 1500, category: 'roofing' },
        'downpipe_87': { name: 'Труба водосточная Ø87мм (3м)', unit: 'шт', price: 1000, category: 'roofing' },
        'downpipe_100': { name: 'Труба водосточная Ø100мм (3м)', unit: 'шт', price: 1300, category: 'roofing' },
        'gutter_bracket': { name: 'Кронштейн желоба', unit: 'шт', price: 120, category: 'roofing' },
        'pipe_clamp': { name: 'Хомут трубы водосточной', unit: 'шт', price: 80, category: 'roofing' },
        'gutter_funnel': { name: 'Воронка водосточная', unit: 'шт', price: 350, category: 'roofing' },
        'gutter_corner': { name: 'Угол желоба 90°', unit: 'шт', price: 450, category: 'roofing' },
        'gutter_plug': { name: 'Заглушка желоба', unit: 'шт', price: 120, category: 'roofing' },
        'downpipe_elbow': { name: 'Колено водосточной трубы', unit: 'шт', price: 200, category: 'roofing' },

        // Кровельные саморезы
        'screw_roof_4_8x29': { name: 'Саморез кровельный 4.8×29мм (окраш.)', unit: 'шт', price: 5, category: 'roofing' },
        'screw_roof_4_8x35': { name: 'Саморез кровельный 4.8×35мм (окраш.)', unit: 'шт', price: 6, category: 'roofing' },
        'screw_roof_4_8x70': { name: 'Саморез кровельный 4.8×70мм (окраш.)', unit: 'шт', price: 8, category: 'roofing' },

        // Подкладочные ковры
        'underlayment_self_adh': { name: 'Подкладочный ковёр самоклеящийся', unit: 'м²', price: 400, category: 'roofing' },
        'underlayment_mech': { name: 'Подкладочный ковёр механич. фиксация', unit: 'м²', price: 250, category: 'roofing' },

        // Битумная мастика для кровли
        'mastic_bitum_cold': { name: 'Мастика битумная холодная (20кг)', unit: 'ведро', price: 2500, category: 'roofing' },
        'mastic_bitum_hot': { name: 'Мастика битумная горячая (25кг)', unit: 'мешок', price: 1800, category: 'roofing' }
    };
})();
