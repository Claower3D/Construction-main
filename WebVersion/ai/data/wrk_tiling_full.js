// === ФАЗА 3: ПЛИТОЧНЫЕ РАБОТЫ (ВСЕ ДЕТАЛИ), МОЗАИКА, КЛЕИ, ЗАТИРКИ, ПОДГОТОВКА (120 поз.) ===
(function () {
    window.AI_WRK_TILING_FULL = {
        // === ПЛИТКА НАПОЛЬНАЯ (по размеру) ===
        'wrk_tile_f_300x300': { name: 'Плитка пол 300×300мм', unit: 'м²', price: 100, category: 'tiling_full' },
        'wrk_tile_f_400x400': { name: 'Плитка пол 400×400мм', unit: 'м²', price: 110, category: 'tiling_full' },
        'wrk_tile_f_450x450': { name: 'Плитка пол 450×450мм', unit: 'м²', price: 120, category: 'tiling_full' },
        'wrk_tile_f_500x500': { name: 'Плитка пол 500×500мм', unit: 'м²', price: 130, category: 'tiling_full' },
        'wrk_tile_f_600x600': { name: 'Плитка пол 600×600мм', unit: 'м²', price: 150, category: 'tiling_full' },
        'wrk_tile_f_600x1200': { name: 'Плитка пол 600×1200мм', unit: 'м²', price: 200, category: 'tiling_full' },
        'wrk_tile_f_800x800': { name: 'Плитка пол 800×800мм', unit: 'м²', price: 200, category: 'tiling_full' },
        'wrk_tile_f_1000x1000': { name: 'Плитка пол 1000×1000мм', unit: 'м²', price: 250, category: 'tiling_full' },
        'wrk_tile_f_1200x600': { name: 'Керамогранит пол 1200×600мм', unit: 'м²', price: 200, category: 'tiling_full' },
        'wrk_tile_f_1200x1200': { name: 'Керамогранит пол 1200×1200мм', unit: 'м²', price: 300, category: 'tiling_full' },
        'wrk_tile_f_1500x750': { name: 'Крупноформат 1500×750мм', unit: 'м²', price: 300, category: 'tiling_full' },
        'wrk_tile_f_1600x3200': { name: 'Слэб 1600×3200мм', unit: 'м²', price: 500, category: 'tiling_full' },

        // === ПЛИТКА НАСТЕННАЯ (по размеру) ===
        'wrk_tile_w_200x200': { name: 'Плитка стена 200×200мм', unit: 'м²', price: 100, category: 'tiling_full' },
        'wrk_tile_w_200x250': { name: 'Плитка стена 200×250мм', unit: 'м²', price: 100, category: 'tiling_full' },
        'wrk_tile_w_250x400': { name: 'Плитка стена 250×400мм', unit: 'м²', price: 110, category: 'tiling_full' },
        'wrk_tile_w_300x600': { name: 'Плитка стена 300×600мм', unit: 'м²', price: 120, category: 'tiling_full' },
        'wrk_tile_w_300x900': { name: 'Плитка стена 300×900мм', unit: 'м²', price: 150, category: 'tiling_full' },
        'wrk_tile_w_600x600': { name: 'Плитка стена 600×600мм', unit: 'м²', price: 160, category: 'tiling_full' },
        'wrk_tile_w_600x1200': { name: 'Плитка стена 600×1200мм', unit: 'м²', price: 200, category: 'tiling_full' },
        'wrk_tile_w_subway_75x150': { name: 'Плитка «кабанчик» 75×150мм', unit: 'м²', price: 120, category: 'tiling_full' },
        'wrk_tile_w_subway_100x200': { name: 'Плитка «кабанчик» 100×200мм', unit: 'м²', price: 120, category: 'tiling_full' },
        'wrk_tile_w_subway_100x300': { name: 'Плитка «кабанчик» 100×300мм', unit: 'м²', price: 130, category: 'tiling_full' },

        // === МОЗАИКА ===
        'wrk_tile_mosaic_stone': { name: 'Мозаика каменная', unit: 'м²', price: 400, category: 'tiling_full' },
        'wrk_tile_mosaic_mix': { name: 'Мозаика микс (комбинированная)', unit: 'м²', price: 350, category: 'tiling_full' },
        'wrk_tile_mosaic_penny': { name: 'Мозаика «пенни» (круглая)', unit: 'м²', price: 350, category: 'tiling_full' },
        'wrk_tile_mosaic_hexagon': { name: 'Мозаика гексагон', unit: 'м²', price: 300, category: 'tiling_full' },

        // === СПОСОБЫ УКЛАДКИ ===
        'wrk_tile_lay_straight': { name: 'Укладка прямая', unit: 'м²', price: 100, category: 'tiling_full' },
        'wrk_tile_lay_diagonal': { name: 'Укладка диагональная (+30%)', unit: 'м²', price: 130, category: 'tiling_full' },
        'wrk_tile_lay_brick': { name: 'Укладка «кирпичная кладка»', unit: 'м²', price: 110, category: 'tiling_full' },
        'wrk_tile_lay_modular': { name: 'Укладка модульная (разноформат)', unit: 'м²', price: 150, category: 'tiling_full' },
        'wrk_tile_lay_versailles': { name: 'Укладка «Версаль»', unit: 'м²', price: 200, category: 'tiling_full' },
        'wrk_tile_lay_hex': { name: 'Укладка гексагон', unit: 'м²', price: 150, category: 'tiling_full' },

        // === КЛЕИ ===
        'wrk_tile_glue_c1': { name: 'Клей C1 (стандартный)', unit: 'мешок', price: 20, category: 'tiling_full' },
        'wrk_tile_glue_c2': { name: 'Клей C2 (усиленный)', unit: 'мешок', price: 30, category: 'tiling_full' },
        'wrk_tile_glue_c2s1': { name: 'Клей C2S1 (эластичный)', unit: 'мешок', price: 40, category: 'tiling_full' },
        'wrk_tile_glue_c2s2': { name: 'Клей C2S2 (супер-эластичный)', unit: 'мешок', price: 50, category: 'tiling_full' },
        'wrk_tile_glue_epoxy': { name: 'Клей эпоксидный (реактивный)', unit: 'кг', price: 50, category: 'tiling_full' },

        // === ЗАТИРКИ ===
        'wrk_tile_grout_flex': { name: 'Затирка эластичная', unit: 'кг', price: 15, category: 'tiling_full' },
        'wrk_tile_grout_silicone': { name: 'Силиконовая затирка (углы)', unit: 'туба', price: 10, category: 'tiling_full' },

        // === ДОП. РАБОТЫ ===
        'wrk_tile_cut_straight': { name: 'Подрезка плитки (прямая)', unit: 'м.п.', price: 10, category: 'tiling_full' },
        'wrk_tile_cut_45': { name: 'Подрезка под 45° (заусовка)', unit: 'м.п.', price: 30, category: 'tiling_full' },
        'wrk_tile_cut_hole_round': { name: 'Отверстие круглое в плитке', unit: 'шт', price: 20, category: 'tiling_full' },
        'wrk_tile_cut_hole_rect': { name: 'Отверстие прямоугольное в плитке', unit: 'шт', price: 30, category: 'tiling_full' },
        'wrk_tile_cut_outlet': { name: 'Вырез под розетку/выключатель', unit: 'шт', price: 20, category: 'tiling_full' },
        'wrk_tile_profile_l': { name: 'Профиль-уголок (раскладка L)', unit: 'м.п.', price: 15, category: 'tiling_full' },
        'wrk_tile_profile_step': { name: 'Профиль ступенчатый', unit: 'м.п.', price: 25, category: 'tiling_full' },
        'wrk_tile_wedge_lvl': { name: 'Система выравнивания (СВП)', unit: 'м²', price: 10, category: 'tiling_full' },
        'wrk_tile_primer_floor': { name: 'Грунтовка пола (под плитку)', unit: 'м²', price: 8, category: 'tiling_full' },
        'wrk_tile_primer_wall': { name: 'Грунтовка стен (под плитку)', unit: 'м²', price: 8, category: 'tiling_full' },
        'wrk_tile_demo_wall': { name: 'Демонтаж плитки стен', unit: 'м²', price: 25, category: 'tiling_full' },

        // === НАТУРАЛЬНЫЙ КАМЕНЬ ===
        'wrk_tile_marble_floor': { name: 'Мрамор пол (укладка)', unit: 'м²', price: 400, category: 'tiling_full' },
        'wrk_tile_marble_wall': { name: 'Мрамор стена (укладка)', unit: 'м²', price: 450, category: 'tiling_full' },
        'wrk_tile_granite_floor': { name: 'Гранит пол (укладка)', unit: 'м²', price: 350, category: 'tiling_full' },
        'wrk_tile_travertine': { name: 'Травертин (укладка)', unit: 'м²', price: 400, category: 'tiling_full' },
        'wrk_tile_onyx': { name: 'Оникс (укладка)', unit: 'м²', price: 600, category: 'tiling_full' },
        'wrk_tile_slate': { name: 'Сланец (укладка)', unit: 'м²', price: 300, category: 'tiling_full' },
        'wrk_tile_stone_polish': { name: 'Полировка натурального камня', unit: 'м²', price: 100, category: 'tiling_full' },
        'wrk_tile_stone_seal': { name: 'Пропитка натурального камня', unit: 'м²', price: 30, category: 'tiling_full' }
    };
})();
