// === ГКЛ СИСТЕМЫ (40 позиций) ===
(function () {
    window.AI_MAT_DRYWALL = {
        // Гипсокартон
        'gkl_9_5': { name: 'ГКЛ 9.5мм (2500×1200)', unit: 'лист', price: 2200, category: 'drywall' },
        'gkl_12_5': { name: 'ГКЛ 12.5мм (2500×1200)', unit: 'лист', price: 2800, category: 'drywall' },
        'gklv_9_5': { name: 'ГКЛВ влагостойкий 9.5мм (2500×1200)', unit: 'лист', price: 2800, category: 'drywall' },
        'gklv_12_5': { name: 'ГКЛВ влагостойкий 12.5мм (2500×1200)', unit: 'лист', price: 3500, category: 'drywall' },
        'gklo_12_5': { name: 'ГКЛО огнестойкий 12.5мм (2500×1200)', unit: 'лист', price: 3800, category: 'drywall' },
        'gvl_10': { name: 'ГВЛ 10мм (2500×1200)', unit: 'лист', price: 4000, category: 'drywall' },
        'gvl_12': { name: 'ГВЛ 12.5мм (2500×1200)', unit: 'лист', price: 4800, category: 'drywall' },
        'gvlv_10': { name: 'ГВЛВ влагостойкий 10мм', unit: 'лист', price: 4500, category: 'drywall' },

        // Профили для перегородок
        'profile_cw_50': { name: 'Профиль стоечный CW-50 (3м)', unit: 'шт', price: 650, category: 'drywall' },
        'profile_cw_75': { name: 'Профиль стоечный CW-75 (3м)', unit: 'шт', price: 780, category: 'drywall' },
        'profile_cw_100': { name: 'Профиль стоечный CW-100 (3м)', unit: 'шт', price: 900, category: 'drywall' },
        'profile_uw_50': { name: 'Профиль направляющий UW-50 (3м)', unit: 'шт', price: 550, category: 'drywall' },
        'profile_uw_75': { name: 'Профиль направляющий UW-75 (3м)', unit: 'шт', price: 680, category: 'drywall' },
        'profile_uw_100': { name: 'Профиль направляющий UW-100 (3м)', unit: 'шт', price: 800, category: 'drywall' },

        // Профили для потолков
        'profile_cd_60': { name: 'Профиль потолочный CD-60 (3м)', unit: 'шт', price: 600, category: 'drywall' },
        'profile_ud_28': { name: 'Профиль направляющий UD-28 (3м)', unit: 'шт', price: 400, category: 'drywall' },

        // Подвесы и соединители
        'suspension_direct': { name: 'Подвес прямой (120мм)', unit: 'шт', price: 25, category: 'drywall' },
        'suspension_spring': { name: 'Подвес с зажимом (пружинный)', unit: 'шт', price: 45, category: 'drywall' },
        'connector_cd_cross': { name: 'Соединитель одноуровневый (краб)', unit: 'шт', price: 35, category: 'drywall' },
        'connector_cd_extend': { name: 'Удлинитель профиля CD-60', unit: 'шт', price: 20, category: 'drywall' },
        'connector_2level': { name: 'Соединитель двухуровневый', unit: 'шт', price: 50, category: 'drywall' },

        // Крепёж для ГКЛ
        'screw_gkl_25': { name: 'Саморез ГКЛ-металл 3.5×25мм', unit: 'шт', price: 0.8, category: 'drywall' },
        'screw_gkl_35': { name: 'Саморез ГКЛ-металл 3.5×35мм', unit: 'шт', price: 1, category: 'drywall' },
        'screw_gkl_45': { name: 'Саморез ГКЛ-металл 3.5×45мм', unit: 'шт', price: 1.2, category: 'drywall' },
        'screw_gkl_55': { name: 'Саморез ГКЛ-металл 3.5×55мм', unit: 'шт', price: 1.5, category: 'drywall' },
        'screw_metal_metal': { name: 'Саморез металл-металл 3.5×9.5 (клоп)', unit: 'шт', price: 0.5, category: 'drywall' },
        'rivet_3_2x8': { name: 'Заклёпка вытяжная 3.2×8мм', unit: 'шт', price: 0.8, category: 'drywall' },

        // Шпаклёвки для ГКЛ
        'putty_fugen': { name: 'Шпаклёвка Фугенфюллер (25кг)', unit: 'мешок', price: 3500, category: 'drywall' },
        'putty_uniflot': { name: 'Шпаклёвка Унифлот (25кг)', unit: 'мешок', price: 6500, category: 'drywall' },

        // Лента
        'tape_serpyanka_45': { name: 'Лента серпянка 45мм×90м', unit: 'рулон', price: 350, category: 'drywall' },
        'tape_paper_joint': { name: 'Лента бумажная для швов (50м)', unit: 'рулон', price: 250, category: 'drywall' },
        'tape_demper_50': { name: 'Лента демпферная 50мм (30м)', unit: 'рулон', price: 500, category: 'drywall' },
        'tape_demper_100': { name: 'Лента демпферная 100мм (30м)', unit: 'рулон', price: 850, category: 'drywall' },

        // Звукоизоляция для перегородок
        'soundproof_50_gkl': { name: 'Звукоизоляция 50мм (для ГКЛ)', unit: 'м²', price: 350, category: 'drywall' },
        'soundproof_100_gkl': { name: 'Звукоизоляция 100мм (для ГКЛ)', unit: 'м²', price: 650, category: 'drywall' },

        // Уголки защитные
        'corner_metal_25': { name: 'Уголок защитный металлический 25×25 (3м)', unit: 'шт', price: 100, category: 'drywall' },
        'corner_pvc_25': { name: 'Уголок защитный ПВХ 25×25 (3м)', unit: 'шт', price: 80, category: 'drywall' },
        'corner_arched': { name: 'Уголок арочный гибкий (3м)', unit: 'шт', price: 150, category: 'drywall' },

        // Дюбель-бабочка (крепление к ГКЛ)
        'anchor_butterfly': { name: 'Дюбель-бабочка для ГКЛ', unit: 'шт', price: 8, category: 'drywall' },
        'anchor_molly': { name: 'Дюбель Молли для ГКЛ', unit: 'шт', price: 15, category: 'drywall' }
    };
})();
