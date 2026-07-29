// === КРОВЛЯ ПОЛНАЯ — плоская, скатная, мембранная, фальцевая, зелёная (50 поз.) ===
(function () {
    window.AI_WRK_ROOF_FULL = {
        // === ПЛОСКАЯ КРОВЛЯ === 1-10
        'wrk_rf_flat_bitumen_2L': { name: 'Наплавляемая кровля 2 слоя', unit: 'м²', price: 550, category: 'rooffull' },
        'wrk_rf_flat_bitumen_3L': { name: 'Наплавляемая кровля 3 слоя', unit: 'м²', price: 850, category: 'rooffull' },
        'wrk_rf_flat_pvc': { name: 'ПВХ мембрана (механ. крепл.)', unit: 'м²', price: 850, category: 'rooffull' },
        'wrk_rf_flat_tpo': { name: 'ТПО мембрана', unit: 'м²', price: 1200, category: 'rooffull' },
        'wrk_rf_flat_epdm': { name: 'EPDM мембрана', unit: 'м²', price: 1200, category: 'rooffull' },
        'wrk_rf_flat_liquid': { name: 'Жидкая резина (кровля)', unit: 'м²', price: 850, category: 'rooffull' },
        'wrk_rf_flat_insul_minwool_100': { name: 'Утепление мин. вата 100мм', unit: 'м²', price: 350, category: 'rooffull' },
        'wrk_rf_flat_insul_minwool_200': { name: 'Утепление мин. вата 200мм', unit: 'м²', price: 550, category: 'rooffull' },
        'wrk_rf_flat_insul_pir': { name: 'Утепление PIR 100мм', unit: 'м²', price: 550, category: 'rooffull' },
        'wrk_rf_flat_slope_lwc': { name: 'Разуклонка керамзитом', unit: 'м²', price: 350, category: 'rooffull' },
        // === СКАТНАЯ КРОВЛЯ === 11-22
        'wrk_rf_tile_ceramic': { name: 'Черепица керамическая', unit: 'м²', price: 1500, category: 'rooffull' },
        'wrk_rf_tile_cement': { name: 'Черепица цементно-песчаная', unit: 'м²', price: 1200, category: 'rooffull' },
        'wrk_rf_tile_soft': { name: 'Гибкая черепица (битумная)', unit: 'м²', price: 850, category: 'rooffull' },
        'wrk_rf_slate_nat': { name: 'Натуральный сланец', unit: 'м²', price: 5500, category: 'rooffull' },
        'wrk_rf_copper': { name: 'Медная кровля', unit: 'м²', price: 5500, category: 'rooffull' },
        'wrk_rf_zinc_titan': { name: 'Цинк-титан кровля', unit: 'м²', price: 3500, category: 'rooffull' },
        'wrk_rf_ondulin': { name: 'Ондулин (еврошифер)', unit: 'м²', price: 350, category: 'rooffull' },
        'wrk_rf_rafter': { name: 'Стропильная система', unit: 'м²', price: 850, category: 'rooffull' },
        'wrk_rf_sheathing': { name: 'Обрешётка', unit: 'м²', price: 250, category: 'rooffull' },
        // === ФАЛЬЦЕВАЯ === 23-26
        'wrk_rf_seam_galv': { name: 'Фальцевая (оцинковка)', unit: 'м²', price: 850, category: 'rooffull' },
        'wrk_rf_seam_color': { name: 'Фальцевая (полимерное покрытие)', unit: 'м²', price: 1200, category: 'rooffull' },
        'wrk_rf_seam_copper': { name: 'Фальцевая (медь)', unit: 'м²', price: 5500, category: 'rooffull' },
        'wrk_rf_seam_zinc': { name: 'Фальцевая (цинк-титан)', unit: 'м²', price: 3500, category: 'rooffull' },
        // === ЗЕЛЁНАЯ КРОВЛЯ === 27-30
        'wrk_rf_green_extensive': { name: 'Экстенсивная зелёная кровля', unit: 'м²', price: 3500, category: 'rooffull' },
        'wrk_rf_green_intensive': { name: 'Интенсивная зелёная кровля', unit: 'м²', price: 8500, category: 'rooffull' },
        'wrk_rf_green_drain': { name: 'Дренажная мембрана (зелён. кровля)', unit: 'м²', price: 350, category: 'rooffull' },
        'wrk_rf_green_substrate': { name: 'Субстрат (зелён. кровля)', unit: 'м²', price: 550, category: 'rooffull' },
        // === ДОБОРНЫЕ === 31-40
        'wrk_rf_ridge': { name: 'Конёк', unit: 'м.п.', price: 350, category: 'rooffull' },
        'wrk_rf_flashing_chimney': { name: 'Примыкание к трубе', unit: 'шт', price: 3500, category: 'rooffull' },
        'wrk_rf_gutter': { name: 'Водосток (желоб + труба)', unit: 'м.п.', price: 550, category: 'rooffull' },
        'wrk_rf_gutter_heated': { name: 'Обогрев водостока (кабель)', unit: 'м.п.', price: 350, category: 'rooffull' },
        'wrk_rf_snow_guard': { name: 'Снегозадержатель', unit: 'м.п.', price: 550, category: 'rooffull' },
        'wrk_rf_safety_hook': { name: 'Кровельный крюк безопасности', unit: 'шт', price: 1500, category: 'rooffull' },
        'wrk_rf_walk_platform': { name: 'Переходной мостик (кровл.)', unit: 'м.п.', price: 1500, category: 'rooffull' },
        'wrk_rf_ladder_roof': { name: 'Кровельная лестница', unit: 'шт', price: 3500, category: 'rooffull' },
        // === МАНСАРДНЫЕ ОКНА === 41-44
        'wrk_rf_skywin_55x78': { name: 'Мансардное окно 55×78', unit: 'шт', price: 15000, category: 'rooffull' },
        'wrk_rf_skywin_roller': { name: 'Рольставни для мансардного окна', unit: 'шт', price: 12000, category: 'rooffull' },
        // === РЕМОНТ === 45-48
        'wrk_rf_repair_patch': { name: 'Локальный ремонт кровли', unit: 'м²', price: 550, category: 'rooffull' },
        'wrk_rf_repair_strip': { name: 'Демонтаж старого покрытия', unit: 'м²', price: 120, category: 'rooffull' },
        'wrk_rf_moss_clean': { name: 'Очистка от мха/лишайника', unit: 'м²', price: 120, category: 'rooffull' },
    };
})();
