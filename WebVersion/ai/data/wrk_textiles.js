// === ТЕКСТИЛЬНЫЙ ДЕКОР — шторы, жалюзи, рулонные, римские, карнизы (48 поз.) ===
(function () {
    window.AI_WRK_TEXTILES = {
        // === ШТОРЫ === 1-10
        'wrk_tx_curtain_blackout': { name: 'Шторы блэкаут', unit: 'м²', price: 1500, category: 'textiles' },
        'wrk_tx_curtain_dim_out': { name: 'Шторы димаут', unit: 'м²', price: 1200, category: 'textiles' },
        'wrk_tx_curtain_tulle': { name: 'Тюль', unit: 'м²', price: 550, category: 'textiles' },
        'wrk_tx_curtain_linen': { name: 'Шторы льняные', unit: 'м²', price: 1500, category: 'textiles' },
        'wrk_tx_curtain_velvet': { name: 'Шторы бархатные', unit: 'м²', price: 2500, category: 'textiles' },
        'wrk_tx_curtain_theater': { name: 'Сценические/театральные шторы', unit: 'м²', price: 3500, category: 'textiles' },
        'wrk_tx_curtain_fire': { name: 'Шторы негорючие (FR)', unit: 'м²', price: 2500, category: 'textiles' },
        'wrk_tx_curtain_shower': { name: 'Штора для душа / ванной', unit: 'шт', price: 1500, category: 'textiles' },
        'wrk_tx_curtain_hospital': { name: 'Разделительная штора (мед.)', unit: 'шт', price: 3500, category: 'textiles' },
        'wrk_tx_drapery_swag': { name: 'Ламбрекен / сваги', unit: 'м.п.', price: 2500, category: 'textiles' },
        // === ЖАЛЮЗИ === 11-18
        'wrk_tx_blind_horiz_25': { name: 'Жалюзи горизонт. 25мм (алюм.)', unit: 'м²', price: 850, category: 'textiles' },
        'wrk_tx_blind_horiz_50': { name: 'Жалюзи горизонт. 50мм (дерево)', unit: 'м²', price: 2500, category: 'textiles' },
        'wrk_tx_blind_vert_89': { name: 'Жалюзи вертикальные 89мм', unit: 'м²', price: 550, category: 'textiles' },
        'wrk_tx_blind_vert_127': { name: 'Жалюзи вертикальные 127мм', unit: 'м²', price: 850, category: 'textiles' },
        'wrk_tx_blind_plisse': { name: 'Жалюзи плиссе', unit: 'м²', price: 1500, category: 'textiles' },
        'wrk_tx_blind_between': { name: 'Жалюзи межстекольные', unit: 'м²', price: 5500, category: 'textiles' },
        'wrk_tx_shutter_wood': { name: 'Шаттерсы деревянные', unit: 'м²', price: 8500, category: 'textiles' },
        'wrk_tx_shutter_pvc': { name: 'Шаттерсы ПВХ', unit: 'м²', price: 3500, category: 'textiles' },
        // === РУЛОННЫЕ ШТОРЫ === 19-26
        'wrk_tx_roller_standard': { name: 'Рулонная штора стандартная', unit: 'м²', price: 550, category: 'textiles' },
        'wrk_tx_roller_blackout': { name: 'Рулонная штора блэкаут', unit: 'м²', price: 850, category: 'textiles' },
        'wrk_tx_roller_screen': { name: 'Рулонная штора screen', unit: 'м²', price: 1200, category: 'textiles' },
        'wrk_tx_roller_day_night': { name: 'Рулонная штора «день-ночь»', unit: 'м²', price: 1200, category: 'textiles' },
        'wrk_tx_roller_auto': { name: 'Рулонная штора с мотором', unit: 'м²', price: 2500, category: 'textiles' },
        'wrk_tx_roman': { name: 'Римская штора', unit: 'м²', price: 1500, category: 'textiles' },
        'wrk_tx_roman_auto': { name: 'Римская штора моторизованная', unit: 'м²', price: 3500, category: 'textiles' },
        'wrk_tx_panel_track': { name: 'Японские панели', unit: 'м²', price: 1500, category: 'textiles' },
        // === КАРНИЗЫ === 27-34
        'wrk_tx_rod_alu_sm': { name: 'Карниз алюминиевый (1 ряд)', unit: 'м.п.', price: 350, category: 'textiles' },
        'wrk_tx_rod_alu_db': { name: 'Карниз алюминиевый (2 ряда)', unit: 'м.п.', price: 550, category: 'textiles' },
        'wrk_tx_rod_wood': { name: 'Карниз деревянный', unit: 'м.п.', price: 850, category: 'textiles' },
        'wrk_tx_rod_forged': { name: 'Карниз кованый', unit: 'м.п.', price: 1500, category: 'textiles' },
        'wrk_tx_rod_ceiling': { name: 'Карниз потолочный (ПВХ)', unit: 'м.п.', price: 250, category: 'textiles' },
        'wrk_tx_rod_hidden': { name: 'Ниша для скрытого карниза', unit: 'м.п.', price: 1200, category: 'textiles' },
        'wrk_tx_rod_electric': { name: 'Электрокарниз (мотор+профиль)', unit: 'м.п.', price: 3500, category: 'textiles' },
        'wrk_tx_rod_curved': { name: 'Карниз изогнутый (эркер)', unit: 'м.п.', price: 1500, category: 'textiles' },
        // === НАРУЖНЫЕ === 35-40
        'wrk_tx_roller_ext': { name: 'Рольставни (рольшторы) наружные', unit: 'м²', price: 3500, category: 'textiles' },
        'wrk_tx_roller_ext_auto': { name: 'Рольставни моторизованные', unit: 'м²', price: 5500, category: 'textiles' },
        'wrk_tx_awning_arm': { name: 'Маркиза рычажная', unit: 'м²', price: 3500, category: 'textiles' },
        'wrk_tx_awning_basket': { name: 'Маркиза корзиночная', unit: 'шт', price: 15000, category: 'textiles' },
        'wrk_tx_pergola_awning': { name: 'Маркиза перголная', unit: 'м²', price: 5500, category: 'textiles' },
        'wrk_tx_zip_screen': { name: 'ZIP-скрин (наружный)', unit: 'м²', price: 5500, category: 'textiles' },
        // === ДОПЫ === 41-48
        'wrk_tx_fabric_wall': { name: 'Драпировка стены тканью', unit: 'м²', price: 1500, category: 'textiles' },
        'wrk_tx_canopy_bed': { name: 'Балдахин', unit: 'шт', price: 5500, category: 'textiles' },
        'wrk_tx_mosquito_net': { name: 'Москитная сетка (рамная)', unit: 'шт', price: 1500, category: 'textiles' },
        'wrk_tx_mosquito_roll': { name: 'Москитная сетка (рулонная)', unit: 'шт', price: 3500, category: 'textiles' },
        'wrk_tx_cushion': { name: 'Подушки декоративные (пошив)', unit: 'шт', price: 850, category: 'textiles' },
        'wrk_tx_upholstery': { name: 'Обивка мебели тканью', unit: 'шт', price: 5500, category: 'textiles' },
        'wrk_tx_carpet_custom': { name: 'Ковровое покрытие по проекту', unit: 'м²', price: 5500, category: 'textiles' },
        'wrk_tx_cleaning': { name: 'Химчистка штор/тканей', unit: 'м²', price: 250, category: 'textiles' }
    };
})();
