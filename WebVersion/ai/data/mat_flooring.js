// === НАПОЛЬНЫЕ ПОКРЫТИЯ (50 позиций) ===
(function () {
    window.AI_MAT_FLOORING = {
        // Ламинат
        'laminate_31_7mm': { name: 'Ламинат 31 класс 7мм', unit: 'м²', price: 2200, category: 'flooring' },
        'laminate_32_8mm': { name: 'Ламинат 32 класс 8мм', unit: 'м²', price: 3000, category: 'flooring' },
        'laminate_33_8mm': { name: 'Ламинат 33 класс 8мм', unit: 'м²', price: 3800, category: 'flooring' },
        'laminate_33_10mm': { name: 'Ламинат 33 класс 10мм', unit: 'м²', price: 4500, category: 'flooring' },
        'laminate_33_12mm': { name: 'Ламинат 33 класс 12мм', unit: 'м²', price: 5200, category: 'flooring' },
        'laminate_34_12mm': { name: 'Ламинат 34 класс 12мм (коммерческий)', unit: 'м²', price: 6500, category: 'flooring' },

        // Паркетная доска
        'parquet_board_oak': { name: 'Паркетная доска дуб (3-полосная)', unit: 'м²', price: 8000, category: 'flooring' },
        'parquet_board_ash': { name: 'Паркетная доска ясень (3-полосная)', unit: 'м²', price: 7500, category: 'flooring' },
        'parquet_board_1strip': { name: 'Паркетная доска дуб (1-полосная)', unit: 'м²', price: 12000, category: 'flooring' },

        // Штучный паркет
        'parquet_oak_15mm': { name: 'Паркет штучный дуб 15мм', unit: 'м²', price: 6000, category: 'flooring' },
        'parquet_beech_15mm': { name: 'Паркет штучный бук 15мм', unit: 'м²', price: 5500, category: 'flooring' },

        // Инженерная доска
        'eng_board_oak_14mm': { name: 'Инженерная доска дуб 14мм', unit: 'м²', price: 9000, category: 'flooring' },

        // Кварцвиниловая плитка (SPC/LVT)
        'spc_tile_4mm': { name: 'Кварцвинил SPC 4мм (замковый)', unit: 'м²', price: 3500, category: 'flooring' },
        'spc_tile_5mm': { name: 'Кварцвинил SPC 5мм (замковый)', unit: 'м²', price: 4500, category: 'flooring' },
        'lvt_tile_3mm': { name: 'Виниловая плитка LVT 3мм (клеевая)', unit: 'м²', price: 2800, category: 'flooring' },

        // Линолеум
        'linoleum_household': { name: 'Линолеум бытовой (21-23 класс)', unit: 'м²', price: 1200, category: 'flooring' },
        'linoleum_semi_comm': { name: 'Линолеум полукоммерческий (31-32 класс)', unit: 'м²', price: 2000, category: 'flooring' },
        'linoleum_commercial': { name: 'Линолеум коммерческий (33-34 класс)', unit: 'м²', price: 3200, category: 'flooring' },
        'linoleum_homogen': { name: 'Линолеум гомогенный (34-43 класс)', unit: 'м²', price: 4000, category: 'flooring' },

        // Ковролин
        'carpet_office': { name: 'Ковролин офисный (иглопробивной)', unit: 'м²', price: 800, category: 'flooring' },
        'carpet_household': { name: 'Ковролин бытовой (тафтинговый)', unit: 'м²', price: 1500, category: 'flooring' },
        'carpet_premium': { name: 'Ковролин премиум (шёлковый ворс)', unit: 'м²', price: 3500, category: 'flooring' },

        // Пробковое покрытие
        'cork_floor_click': { name: 'Пробковый пол замковый (10мм)', unit: 'м²', price: 5500, category: 'flooring' },
        'cork_floor_glue': { name: 'Пробковый пол клеевой (6мм)', unit: 'м²', price: 4000, category: 'flooring' },

        // Подложка
        'underlay_pe_2mm': { name: 'Подложка ПЭ 2мм', unit: 'м²', price: 50, category: 'flooring' },
        'underlay_pe_3mm': { name: 'Подложка ПЭ 3мм', unit: 'м²', price: 80, category: 'flooring' },
        'underlay_xps_3mm': { name: 'Подложка XPS 3мм', unit: 'м²', price: 150, category: 'flooring' },
        'underlay_xps_5mm': { name: 'Подложка XPS 5мм', unit: 'м²', price: 230, category: 'flooring' },
        'underlay_cork_2mm': { name: 'Подложка пробковая 2мм', unit: 'м²', price: 350, category: 'flooring' },
        'underlay_cork_3mm': { name: 'Подложка пробковая 3мм', unit: 'м²', price: 500, category: 'flooring' },
        'underlay_hвойная_5mm': { name: 'Подложка хвойная 5мм', unit: 'м²', price: 400, category: 'flooring' },

        // Плинтус
        'plinth_pvc_55': { name: 'Плинтус ПВХ 55мм (2.5м)', unit: 'шт', price: 250, category: 'flooring' },
        'plinth_pvc_70': { name: 'Плинтус ПВХ 70мм (2.5м)', unit: 'шт', price: 350, category: 'flooring' },
        'plinth_mdf_58': { name: 'Плинтус МДФ 58мм (2.4м)', unit: 'шт', price: 400, category: 'flooring' },
        'plinth_mdf_80': { name: 'Плинтус МДФ 80мм (2.4м)', unit: 'шт', price: 550, category: 'flooring' },
        'plinth_wood_pine_50': { name: 'Плинтус деревянный сосна 50мм', unit: 'п.м.', price: 150, category: 'flooring' },
        'plinth_hidden': { name: 'Плинтус скрытого монтажа алюм.', unit: 'п.м.', price: 800, category: 'flooring' },
        'plinth_corner_inner': { name: 'Угол внутренний для плинтуса', unit: 'шт', price: 30, category: 'flooring' },
        'plinth_corner_outer': { name: 'Угол наружный для плинтуса', unit: 'шт', price: 30, category: 'flooring' },
        'plinth_connector': { name: 'Соединитель для плинтуса', unit: 'шт', price: 20, category: 'flooring' },
        'plinth_endcap': { name: 'Заглушка для плинтуса (пара)', unit: 'шт', price: 25, category: 'flooring' },

        // Порожки
        'threshold_alu_flat_900': { name: 'Порожек алюминиевый плоский 900мм', unit: 'шт', price: 350, category: 'flooring' },
        'threshold_alu_level_900': { name: 'Порожек алюминиевый разноуровневый 900мм', unit: 'шт', price: 400, category: 'flooring' },
        'threshold_alu_t_900': { name: 'Порожек Т-образный 900мм', unit: 'шт', price: 450, category: 'flooring' },

        // Клей для напольных покрытий
        'glue_floor_parquet_15kg': { name: 'Клей паркетный (15кг)', unit: 'ведро', price: 5000, category: 'flooring' },
        'glue_floor_linoleum_14kg': { name: 'Клей для линолеума (14кг)', unit: 'ведро', price: 3000, category: 'flooring' },
        'glue_floor_carpet_14kg': { name: 'Клей для ковролина (14кг)', unit: 'ведро', price: 3500, category: 'flooring' },
        'tape_floor_2side_50mm': { name: 'Скотч двусторонний для пола 50мм×25м', unit: 'шт', price: 500, category: 'flooring' }
    };
})();
