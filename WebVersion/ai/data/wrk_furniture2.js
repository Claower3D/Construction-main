// === МЕБЕЛЬ ВСТРОЕННАЯ ПОЛН — кухни, шкафы, гардеробные, офис (50 поз.) ===
(function () {
    window.AI_WRK_FURNITURE2 = {
        // === КУХНИ === 1-12
        'wrk_fur2_kitchen_l': { name: 'Кухня Г-образная', unit: 'компл.', price: 150000, category: 'furniture2' },
        'wrk_fur2_kitchen_u': { name: 'Кухня П-образная', unit: 'компл.', price: 250000, category: 'furniture2' },
        'wrk_fur2_kitchen_mdf': { name: 'Кухня 3м (МДФ плёнка)', unit: 'компл.', price: 150000, category: 'furniture2' },
        'wrk_fur2_kitchen_enamel': { name: 'Кухня 3м (МДФ эмаль)', unit: 'компл.', price: 250000, category: 'furniture2' },
        'wrk_fur2_kitchen_wood': { name: 'Кухня 3м (массив)', unit: 'компл.', price: 450000, category: 'furniture2' },
        'wrk_fur2_top_lam': { name: 'Столешница пластик/ДСП', unit: 'м.п.', price: 3500, category: 'furniture2' },
        'wrk_fur2_top_stone': { name: 'Столешница искусств. камень', unit: 'м.п.', price: 12000, category: 'furniture2' },
        'wrk_fur2_top_granite': { name: 'Столешница гранит', unit: 'м.п.', price: 25000, category: 'furniture2' },
        // === ШКАФЫ-КУПЕ === 13-20
        'wrk_fur2_wrd_2d': { name: 'Шкаф-купе 2-дверный', unit: 'шт', price: 55000, category: 'furniture2' },
        'wrk_fur2_wrd_3d': { name: 'Шкаф-купе 3-дверный', unit: 'шт', price: 85000, category: 'furniture2' },
        'wrk_fur2_wrd_4d': { name: 'Шкаф-купе 4-дверный', unit: 'шт', price: 120000, category: 'furniture2' },
        'wrk_fur2_wrd_mirror': { name: 'Двери-купе зеркальные', unit: 'шт', price: 15000, category: 'furniture2' },
        'wrk_fur2_wrd_glass': { name: 'Двери-купе стекло (лакобель)', unit: 'шт', price: 18000, category: 'furniture2' },
        'wrk_fur2_wrd_filling': { name: 'Наполнение (полки/штанги)', unit: 'секция', price: 3500, category: 'furniture2' },
        'wrk_fur2_wrd_drawer': { name: 'Ящик выдвижной', unit: 'шт', price: 2500, category: 'furniture2' },
        'wrk_fur2_wrd_led': { name: 'LED подсветка шкафа', unit: 'секция', price: 1500, category: 'furniture2' },
        // === ГАРДЕРОБНЫЕ === 21-26
        'wrk_fur2_dress_sm': { name: 'Гардеробная (до 4м²)', unit: 'компл.', price: 55000, category: 'furniture2' },
        'wrk_fur2_dress_md': { name: 'Гардеробная (до 8м²)', unit: 'компл.', price: 120000, category: 'furniture2' },
        'wrk_fur2_dress_lg': { name: 'Гардеробная (до 12м²)', unit: 'компл.', price: 250000, category: 'furniture2' },
        'wrk_fur2_dress_rod': { name: 'Штанга/пантограф', unit: 'шт', price: 1500, category: 'furniture2' },
        'wrk_fur2_dress_basket': { name: 'Корзина выдвижная', unit: 'шт', price: 2500, category: 'furniture2' },
        'wrk_fur2_dress_shoe': { name: 'Полка для обуви', unit: 'шт', price: 3500, category: 'furniture2' },
        // === СТЕЛЛАЖИ === 27-32
        'wrk_fur2_shelf_wall': { name: 'Полка навесная', unit: 'шт', price: 1500, category: 'furniture2' },
        'wrk_fur2_shelf_float': { name: 'Полка парящая', unit: 'шт', price: 2500, category: 'furniture2' },
        'wrk_fur2_bookcase': { name: 'Стеллаж книжный', unit: 'секция', price: 12000, category: 'furniture2' },
        'wrk_fur2_tv_unit': { name: 'Тумба под ТВ', unit: 'шт', price: 25000, category: 'furniture2' },
        'wrk_fur2_console': { name: 'Консоль', unit: 'шт', price: 15000, category: 'furniture2' },
        'wrk_fur2_rack_metal': { name: 'Стеллаж металлический', unit: 'секция', price: 5500, category: 'furniture2' },
        // === ВАННАЯ === 33-38
        'wrk_fur2_mirror_cab': { name: 'Зеркальный шкафчик', unit: 'шт', price: 8500, category: 'furniture2' },
        'wrk_fur2_tall_cab': { name: 'Пенал ванный', unit: 'шт', price: 12000, category: 'furniture2' },
        'wrk_fur2_laundry_cab': { name: 'Шкаф под стиральную машину', unit: 'шт', price: 25000, category: 'furniture2' },
        // === ОФИС === 39-44
        'wrk_fur2_desk_office': { name: 'Офисный стол', unit: 'шт', price: 2500, category: 'furniture2' },
        'wrk_fur2_reception': { name: 'Стойка ресепшн', unit: 'шт', price: 55000, category: 'furniture2' },
        'wrk_fur2_file_cab': { name: 'Шкаф для документов', unit: 'шт', price: 5500, category: 'furniture2' },
        'wrk_fur2_locker_4': { name: 'Локерный шкаф (4 ячейки)', unit: 'шт', price: 12000, category: 'furniture2' },
        'wrk_fur2_locker_8': { name: 'Локерный шкаф (8 ячеек)', unit: 'шт', price: 18000, category: 'furniture2' },
        'wrk_fur2_bench': { name: 'Скамья раздевалки', unit: 'м.п.', price: 3500, category: 'furniture2' },
        // === МОНТАЖ === 45-50
        'wrk_fur2_assemble': { name: 'Сборка корпусной мебели', unit: 'шт', price: 2500, category: 'furniture2' },
        'wrk_fur2_hang_upper': { name: 'Навеска верхних шкафов', unit: 'шт', price: 1500, category: 'furniture2' },
        'wrk_fur2_plinth': { name: 'Цоколь/плинтус кухни', unit: 'м.п.', price: 350, category: 'furniture2' },
        'wrk_fur2_splash_glass': { name: 'Фартук стеклянный', unit: 'м.п.', price: 2500, category: 'furniture2' },
        'wrk_fur2_appliance': { name: 'Установка встроенной техники', unit: 'шт', price: 2500, category: 'furniture2' }
    };
})();
