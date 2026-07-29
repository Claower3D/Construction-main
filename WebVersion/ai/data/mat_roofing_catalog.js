// === КАТАЛОГ КРОВЛИ — ТОЛЬКО УНИКАЛЬНЫЕ ПОЗИЦИИ (без дублей с mat_roofing.js) ===
// mat_roofing.js уже содержит: металлочерепица (Монтеррей 0.45/0.5, Супермонтеррей, Каскад),
// профнастил (С8-Н75), гибкая черепица (стандарт/многосл./премиум), ПВХ/ТПО/ЭПДМ мембраны,
// ондулин, рубероид, бикрост, унифлекс, доборные элементы (конёк/ендова/ветровая/карнизная/примыкания),
// снегозадержатели, водосток (жёлоб/труба/кронштейн/хомут/воронка/угол/заглушка/колено),
// кровельные саморезы, подкладочные ковры, битумная мастика
(function () {
    window.AI_MAT_ROOFING_CATALOG = {
        // Металлочерепица — доп. цвета и толщины (НЕТ в mat_roofing.js)
        'mt_monterrey_0_4_ral3005': { name: 'Металлочерепица Монтеррей 0.4мм RAL3005 (м²)', unit: 'м²', price: 350, category: 'roofing_catalog' },
        'mt_monterrey_0_5_ral7024': { name: 'Металлочерепица Монтеррей 0.5мм RAL7024 (м²)', unit: 'м²', price: 550, category: 'roofing_catalog' },
        // Фальцевая кровля (уникальная категория)
        'falts_zinc_0_55_m2': { name: 'Фальц цинк 0.55мм (м²)', unit: 'м²', price: 400, category: 'roofing_catalog' },
        'falts_ral_0_5_m2': { name: 'Фальц окрашенный 0.5мм (м²)', unit: 'м²', price: 600, category: 'roofing_catalog' },
        'falts_copper_0_6_m2': { name: 'Фальц медный 0.6мм (м²)', unit: 'м²', price: 2000, category: 'roofing_catalog' },
        // Натуральная черепица (уникальная категория)
        'tile_ceramic_m2': { name: 'Черепица керамическая (м²)', unit: 'м²', price: 1500, category: 'roofing_catalog' },
        'tile_concrete_m2': { name: 'Черепица цементно-песчаная (м²)', unit: 'м²', price: 600, category: 'roofing_catalog' },
        'tile_composite_m2': { name: 'Черепица композитная (м²)', unit: 'м²', price: 800, category: 'roofing_catalog' },
        // Коньково-карнизная черепица (уникальная)
        'shingle_starter_12m': { name: 'Коньково-карнизная черепица (12м.п.)', unit: 'уп.', price: 500, category: 'roofing_catalog' },
        'shingle_vent_ridge_m': { name: 'Аэратор коньковый (м.п.)', unit: 'м.п.', price: 300, category: 'roofing_catalog' },
        // Ендовный ковёр (уникальная)
        'roof_endova_carpet_10m2': { name: 'Ендовный ковёр (10м²)', unit: 'рулон', price: 1500, category: 'roofing_catalog' },
        // Пароизоляция / ветрозащита / мембраны (уникальная категория)
        'membrane_vapor_75m2': { name: 'Пароизоляция (75м²)', unit: 'рулон', price: 800, category: 'roofing_catalog' },
        'membrane_wind_75m2': { name: 'Ветрозащита (75м²)', unit: 'рулон', price: 1000, category: 'roofing_catalog' },
        'membrane_diff_75m2': { name: 'Мембрана диффузионная (75м²)', unit: 'рулон', price: 2000, category: 'roofing_catalog' },
        'membrane_superdiff_75m2': { name: 'Мембрана супердиффузионная (75м²)', unit: 'рулон', price: 3000, category: 'roofing_catalog' },
        // Снегозадержатель решётчатый (НЕТ в mat_roofing.js)
        'snow_guard_grid_3m': { name: 'Снегозадержатель решётчатый (3м)', unit: 'компл.', price: 2000, category: 'roofing_catalog' },
        // Проходные элементы (уникальная категория)
        'roof_vent_pipe_75_160': { name: 'Проходной элемент 75-160мм', unit: 'шт', price: 500, category: 'roofing_catalog' },
        'roof_vent_exit_110': { name: 'Вентиляционный выход Ø110мм', unit: 'шт', price: 1000, category: 'roofing_catalog' },
        'roof_antenna_mast': { name: 'Проходка для антенны', unit: 'шт', price: 300, category: 'roofing_catalog' },
        // Уплотнители кровельные (уникальная категория)
        'roof_tape_seal_30mm': { name: 'Уплотнитель для конька 30мм (2м)', unit: 'шт', price: 50, category: 'roofing_catalog' },
        'roof_seal_pipe_110_170': { name: 'Мастер-Flash Ø110-170мм', unit: 'шт', price: 500, category: 'roofing_catalog' },
        'roof_seal_pipe_170_280': { name: 'Мастер-Flash Ø170-280мм', unit: 'шт', price: 700, category: 'roofing_catalog' },
        // Битумный праймер (НЕТ в mat_roofing.js — там только мастика)
        'roof_primer_bitum_5l': { name: 'Праймер битумный (5л)', unit: 'шт', price: 200, category: 'roofing_catalog' },
        'roof_primer_bitum_20l': { name: 'Праймер битумный (20л)', unit: 'шт', price: 700, category: 'roofing_catalog' },
        // Ондулин Черепица (НЕТ в mat_roofing.js — там только стандарт)
        'ondulin_tile_m2': { name: 'Ондулин Черепица (м²)', unit: 'м²', price: 350, category: 'roofing_catalog' },
        // Кровельные лестницы / ходовые мостики (уникальная категория)
        'roof_ladder_3m': { name: 'Лестница кровельная 3м', unit: 'шт', price: 3000, category: 'roofing_catalog' },
        'roof_bridge_1m': { name: 'Мостик ходовой кровельный 1м', unit: 'шт', price: 2000, category: 'roofing_catalog' },
        'roof_bridge_3m': { name: 'Мостик ходовой кровельный 3м', unit: 'шт', price: 5000, category: 'roofing_catalog' },
        // Кровельный аэратор (уникальная)
        'roof_aerator_point': { name: 'Аэратор кровельный точечный', unit: 'шт', price: 200, category: 'roofing_catalog' },
        'roof_aerator_ridge': { name: 'Аэратор коньковый непрерывный (1м)', unit: 'шт', price: 500, category: 'roofing_catalog' }
    };
})();
