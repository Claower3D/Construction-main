// ========== AI PRICE DATABASE ==========
// Центральная база данных цен для ИИ-сметчика
// Все цены в тенге (₸)

(function () {
    'use strict';

    // ========== ВЕРСИЯ ПРАЙСА ==========
    const PRICE_VERSION = '2026.01';
    const PRICE_UPDATE_DATE = '2026-01-31';
    const PRICE_REGION = 'Kazakhstan';

    // ========== МАТЕРИАЛЫ ==========
    const MATERIALS = {
        // === Бетон и растворы ===
        concrete: {
            'M100': { name: 'Бетон М100', unit: 'м³', price: 20000, category: 'concrete' },
            'M150': { name: 'Бетон М150', unit: 'м³', price: 22000, category: 'concrete' },
            'M200': { name: 'Бетон М200', unit: 'м³', price: 24000, category: 'concrete' },
            'M250': { name: 'Бетон М250', unit: 'м³', price: 26000, category: 'concrete' },
            'M300': { name: 'Бетон М300', unit: 'м³', price: 28000, category: 'concrete' },
            'M350': { name: 'Бетон М350', unit: 'м³', price: 32000, category: 'concrete' },
            'M400': { name: 'Бетон М400', unit: 'м³', price: 36000, category: 'concrete' },
            'M500': { name: 'Бетон М500', unit: 'м³', price: 42000, category: 'concrete' },
            'mortar_M100': { name: 'Раствор М100', unit: 'м³', price: 4500, category: 'concrete' },
            'mortar_M150': { name: 'Раствор М150', unit: 'м³', price: 5500, category: 'concrete' },
            'peskobeton_M300': { name: 'Пескобетон М300', unit: 'м³', price: 4500, category: 'concrete' }
        },

        // === Арматура ===
        rebar: {
            'd8': { name: 'Арматура d8 A500C', unit: 'кг', price: 380, category: 'rebar', weight_per_m: 0.395 },
            'd10': { name: 'Арматура d10 A500C', unit: 'кг', price: 400, category: 'rebar', weight_per_m: 0.617 },
            'd12': { name: 'Арматура d12 A500C', unit: 'кг', price: 450, category: 'rebar', weight_per_m: 0.888 },
            'd14': { name: 'Арматура d14 A500C', unit: 'кг', price: 480, category: 'rebar', weight_per_m: 1.21 },
            'd16': { name: 'Арматура d16 A500C', unit: 'кг', price: 520, category: 'rebar', weight_per_m: 1.58 },
            'd18': { name: 'Арматура d18 A500C', unit: 'кг', price: 550, category: 'rebar', weight_per_m: 2.0 },
            'd20': { name: 'Арматура d20 A500C', unit: 'кг', price: 580, category: 'rebar', weight_per_m: 2.47 },
            'wire_vr1': { name: 'Проволока Вр-1', unit: 'кг', price: 350, category: 'rebar' },
            'mesh_100x100x4': { name: 'Сетка 100x100x4', unit: 'м²', price: 120, category: 'rebar' },
            'mesh_150x150x5': { name: 'Сетка 150x150x5', unit: 'м²', price: 180, category: 'rebar' }
        },

        // === Кирпич и блоки ===
        masonry: {
            'brick_red': { name: 'Кирпич красный М150', unit: 'шт', price: 18, category: 'masonry', per_m2: 50 },
            'brick_white': { name: 'Кирпич силикатный М150', unit: 'шт', price: 15, category: 'masonry', per_m2: 50 },
            'brick_facing': { name: 'Кирпич облицовочный', unit: 'шт', price: 35, category: 'masonry', per_m2: 50 },
            'block_gas_600': { name: 'Газоблок 600x200x300 D600', unit: 'шт', price: 350, category: 'masonry', per_m2: 12 },
            'block_gas_500': { name: 'Газоблок 600x200x300 D500', unit: 'шт', price: 320, category: 'masonry', per_m2: 12 },
            'block_gas_400': { name: 'Газоблок 600x200x300 D400', unit: 'шт', price: 290, category: 'masonry', per_m2: 12 },
            'block_foam': { name: 'Пеноблок 600x300x200', unit: 'шт', price: 280, category: 'masonry', per_m2: 12 },
            'block_keramsit': { name: 'Керамзитоблок 390x190x188', unit: 'шт', price: 85, category: 'masonry', per_m2: 12 },
            'glue_winter': { name: 'Клей для блоков зимний', unit: 'кг', price: 180, category: 'masonry' },
            'glue_summer': { name: 'Клей для блоков летний', unit: 'кг', price: 150, category: 'masonry' }
        },

        // === Песок, щебень, ПГС ===
        aggregates: {
            'sand_career': { name: 'Песок карьерный', unit: 'м³', price: 3500, category: 'aggregates' },
            'sand_river': { name: 'Песок речной', unit: 'м³', price: 4500, category: 'aggregates' },
            'gravel_5_20': { name: 'Щебень 5-20 мм', unit: 'м³', price: 4500, category: 'aggregates' },
            'gravel_20_40': { name: 'Щебень 20-40 мм', unit: 'м³', price: 4000, category: 'aggregates' },
            'gravel_40_70': { name: 'Щебень 40-70 мм', unit: 'м³', price: 3800, category: 'aggregates' },
            'pgs': { name: 'ПГС', unit: 'м³', price: 3000, category: 'aggregates' }
        },

        // === Опалубка и крепёж ===
        formwork: {
            'formwork_plywood': { name: 'Опалубка (фанера)', unit: 'м²', price: 1500, category: 'formwork' },
            'formwork_metal': { name: 'Опалубка металлическая', unit: 'м²', price: 2500, category: 'formwork' },
            'formwork_plastic': { name: 'Опалубка пластиковая', unit: 'м²', price: 1800, category: 'formwork' },
            'tie_wire': { name: 'Проволока вязальная', unit: 'кг', price: 250, category: 'formwork' }
        },

        // === Гидроизоляция и утепление ===
        insulation: {
            'geotextile': { name: 'Геотекстиль', unit: 'м²', price: 85, category: 'insulation' },
            'pe_film': { name: 'Плёнка ПЭ 200 мкм', unit: 'м²', price: 35, category: 'insulation' },
            'bitumen_primer': { name: 'Праймер битумный', unit: 'л', price: 450, category: 'insulation' },
            'bitumen_mastic': { name: 'Мастика битумная', unit: 'кг', price: 380, category: 'insulation' },
            'roofing_felt': { name: 'Рубероид', unit: 'м²', price: 120, category: 'insulation' },
            'eps_50': { name: 'Пенополистирол 50мм', unit: 'м²', price: 450, category: 'insulation' },
            'eps_100': { name: 'Пенополистирол 100мм', unit: 'м²', price: 850, category: 'insulation' },
            'xps_50': { name: 'Экструзия XPS 50мм', unit: 'м²', price: 650, category: 'insulation' },
            'xps_100': { name: 'Экструзия XPS 100мм', unit: 'м²', price: 1200, category: 'insulation' },
            'minwool_50': { name: 'Минвата 50мм', unit: 'м²', price: 280, category: 'insulation' },
            'minwool_100': { name: 'Минвата 100мм', unit: 'м²', price: 520, category: 'insulation' }
        },

        // === Трубы ===
        pipes: {
            'pipe_pvc_110': { name: 'Труба ПВХ Ø110', unit: 'п.м.', price: 350, category: 'pipes' },
            'pipe_pvc_160': { name: 'Труба ПВХ Ø160', unit: 'п.м.', price: 550, category: 'pipes' },
            'pipe_pvc_200': { name: 'Труба ПВХ Ø200', unit: 'п.м.', price: 850, category: 'pipes' },
            'pipe_metal_50': { name: 'Труба стальная Ø50', unit: 'п.м.', price: 480, category: 'pipes' },
            'pipe_metal_100': { name: 'Труба стальная Ø100', unit: 'п.м.', price: 750, category: 'pipes' },
            'pipe_hdpe_110': { name: 'Труба ПНД Ø110', unit: 'п.м.', price: 280, category: 'pipes' },
            'pipe_hdpe_160': { name: 'Труба ПНД Ø160', unit: 'п.м.', price: 450, category: 'pipes' },
            'pipe_fitting_pvc': { name: 'Фитинги ПВХ (комплект)', unit: 'компл.', price: 1200, category: 'pipes' },
            'pipe_fitting_metal': { name: 'Фитинги стальные (комплект)', unit: 'компл.', price: 1800, category: 'pipes' },
            'manhole_cover': { name: 'Колодец смотровой Ø400', unit: 'шт', price: 8500, category: 'pipes' }
        },

        // === Сваи ===
        piles: {
            'pile_casing_300': { name: 'Обсадная труба 300мм', unit: 'шт', price: 3500, category: 'piles' },
            'pile_casing_400': { name: 'Обсадная труба 400мм', unit: 'шт', price: 4500, category: 'piles' },
            'pile_screw_108': { name: 'Свая винтовая 108мм', unit: 'шт', price: 4500, category: 'piles' },
            'pile_screw_133': { name: 'Свая винтовая 133мм', unit: 'шт', price: 6500, category: 'piles' }
        },

        // === Кровельные материалы ===
        roofing: {
            'metal_tile': { name: 'Металлочерепица', unit: 'м²', price: 850, category: 'roofing' },
            'profsheet_c20': { name: 'Профнастил С20', unit: 'м²', price: 550, category: 'roofing' },
            'tile_ceramic': { name: 'Черепица керамическая', unit: 'м²', price: 1800, category: 'roofing' },
            'tile_bitumen': { name: 'Черепица битумная', unit: 'м²', price: 1200, category: 'roofing' },
            'ondulin': { name: 'Ондулин', unit: 'м²', price: 450, category: 'roofing' },
            'pvh_membrane': { name: 'ПВХ мембрана Технониколь', unit: 'м²', price: 650, category: 'roofing' },
            'rafter_50x200': { name: 'Стропила 50×200', unit: 'п.м.', price: 380, category: 'roofing' },
            'batten_25x100': { name: 'Обрешётка 25×100', unit: 'п.м.', price: 65, category: 'roofing' },
            'counter_batten_50x50': { name: 'Контробрешётка 50×50', unit: 'п.м.', price: 55, category: 'roofing' },
            'ridge': { name: 'Конёк металлический', unit: 'п.м.', price: 450, category: 'roofing' },
            'gutter_system': { name: 'Водосточная система', unit: 'п.м.', price: 1200, category: 'roofing' },
            'wind_membrane': { name: 'Мембрана гидро-ветрозащитная', unit: 'м²', price: 85, category: 'roofing' },
            'vapor_barrier': { name: 'Пароизоляция', unit: 'м²', price: 65, category: 'roofing' },
            'roof_screws': { name: 'Саморезы кровельные', unit: 'шт', price: 5, category: 'roofing' },
            'snow_guard': { name: 'Снегозадержатель', unit: 'п.м.', price: 800, category: 'roofing' }
        },

        // === Отделочные материалы ===
        finishing: {
            'plaster_gips': { name: 'Штукатурка гипсовая Knauf', unit: 'кг', price: 180, category: 'finishing' },
            'plaster_cement': { name: 'Штукатурка цементная', unit: 'кг', price: 90, category: 'finishing' },
            'putty_start': { name: 'Шпатлёвка стартовая', unit: 'кг', price: 120, category: 'finishing' },
            'putty_finish': { name: 'Шпатлёвка финишная', unit: 'кг', price: 160, category: 'finishing' },
            'paint_interior': { name: 'Краска водоэмульсионная', unit: 'л', price: 650, category: 'finishing' },
            'paint_exterior': { name: 'Краска фасадная', unit: 'л', price: 1200, category: 'finishing' },
            'gypsum_board': { name: 'Гипсокартон 12.5мм', unit: 'м²', price: 380, category: 'finishing' },
            'gypsum_board_wet': { name: 'Гипсокартон влагост.', unit: 'м²', price: 520, category: 'finishing' },
            'profile_cd60': { name: 'Профиль CD60', unit: 'п.м.', price: 120, category: 'finishing' },
            'profile_ud27': { name: 'Профиль UD27', unit: 'п.м.', price: 85, category: 'finishing' },
            'tile_wall': { name: 'Плитка настенная', unit: 'м²', price: 2500, category: 'finishing' },
            'tile_floor': { name: 'Плитка напольная', unit: 'м²', price: 3000, category: 'finishing' },
            'tile_adhesive': { name: 'Клей плиточный Ceresit', unit: 'кг', price: 150, category: 'finishing' },
            'grout': { name: 'Затирка для швов', unit: 'кг', price: 280, category: 'finishing' },
            'laminate_32': { name: 'Ламинат 32 класс', unit: 'м²', price: 3500, category: 'finishing' },
            'laminate_33': { name: 'Ламинат 33 класс', unit: 'м²', price: 4800, category: 'finishing' },
            'substrate': { name: 'Подложка 3мм', unit: 'м²', price: 120, category: 'finishing' }
        },

        // === Гидроизоляция ===
        waterproofing: {
            'membrane_hdpe': { name: 'Мембрана ПВП профилированная', unit: 'м²', price: 220, category: 'waterproofing' },
            'mastic_cold': { name: 'Мастика битумная холодная', unit: 'кг', price: 380, category: 'waterproofing' },
            'mastic_hot': { name: 'Мастика горячая', unit: 'кг', price: 280, category: 'waterproofing' },
            'roll_technoelast': { name: 'Техноэласт (наплавляемый)', unit: 'м²', price: 350, category: 'waterproofing' },
            'penetrating_hydro': { name: 'Пенетрон (проникающая)', unit: 'кг', price: 1200, category: 'waterproofing' },
            'aquastop': { name: 'Обмазочная гидроизоляция', unit: 'кг', price: 450, category: 'waterproofing' },
            'sealing_tape': { name: 'Лента гидроизоляционная', unit: 'п.м.', price: 180, category: 'waterproofing' }
        },

        // === Окна и двери ===
        windows_doors: {
            'window_pvh_1200x1500': { name: 'Окно ПВХ 1200×1500 2-кам.', unit: 'шт', price: 45000, category: 'windows_doors' },
            'window_pvh_1500x1500': { name: 'Окно ПВХ 1500×1500 2-кам.', unit: 'шт', price: 55000, category: 'windows_doors' },
            'window_pvh_2000x1500': { name: 'Окно ПВХ 2000×1500 2-кам.', unit: 'шт', price: 72000, category: 'windows_doors' },
            'door_metal_exterior': { name: 'Дверь входная металлическая', unit: 'шт', price: 65000, category: 'windows_doors' },
            'door_interior': { name: 'Дверь межкомнатная', unit: 'шт', price: 25000, category: 'windows_doors' },
            'door_bathroom': { name: 'Дверь влагостойкая (санузел)', unit: 'шт', price: 18000, category: 'windows_doors' },
            'windowsill_pvh': { name: 'Подоконник ПВХ 300мм', unit: 'п.м.', price: 2500, category: 'windows_doors' },
            'drip_cap': { name: 'Отлив оцинкованный', unit: 'п.м.', price: 650, category: 'windows_doors' },
            'foam_mounting': { name: 'Монтажная пена 750мл', unit: 'бал.', price: 480, category: 'windows_doors' },
            'anchor_plate': { name: 'Пластина анкерная', unit: 'шт', price: 85, category: 'windows_doors' }
        },

        // === Крепёж ===
        fasteners: {
            'nail_100': { name: 'Гвозди 100мм', unit: 'кг', price: 450, category: 'fasteners' },
            'nail_150': { name: 'Гвозди 150мм', unit: 'кг', price: 480, category: 'fasteners' },
            'screw_black': { name: 'Саморезы чёрные', unit: 'кг', price: 650, category: 'fasteners' },
            'anchor_bolt_12': { name: 'Анкерный болт 12мм', unit: 'шт', price: 120, category: 'fasteners' },
            'dowel_8x80': { name: 'Дюбель-гвоздь 8×80', unit: 'шт', price: 8, category: 'fasteners' }
        },

        // === Штукатурные смеси (нормы расхода по СНиП) ===
        plaster_mixes: {
            'plaster_hp_start': { name: 'Штукатурка Knauf HP Start', unit: 'кг', price: 180, category: 'plaster_mixes', consumption: 10, consumptionUnit: 'кг/м² при 10мм' },
            'plaster_rotband': { name: 'Штукатурка Knauf Rotband', unit: 'кг', price: 280, category: 'plaster_mixes', consumption: 8.5, consumptionUnit: 'кг/м² при 10мм' },
            'plaster_cement': { name: 'Штукатурка цементная', unit: 'кг', price: 120, category: 'plaster_mixes', consumption: 16, consumptionUnit: 'кг/м² при 10мм' },
            'plaster_facade': { name: 'Штукатурка фасадная', unit: 'кг', price: 250, category: 'plaster_mixes', consumption: 14, consumptionUnit: 'кг/м² при 10мм' },
            'plaster_decorative': { name: 'Штукатурка декоративная (короед)', unit: 'кг', price: 420, category: 'plaster_mixes', consumption: 3, consumptionUnit: 'кг/м²' },
            'plaster_beacon': { name: 'Маяк штукатурный 6мм', unit: 'шт', price: 55, category: 'plaster_mixes', consumption: 2, consumptionUnit: 'шт/м²' },
            'plaster_corner': { name: 'Уголок штукатурный', unit: 'п.м.', price: 45, category: 'plaster_mixes' },
            'plaster_mesh': { name: 'Сетка штукатурная 5×5', unit: 'м²', price: 85, category: 'plaster_mixes', consumption: 1.1, consumptionUnit: 'м²/м²' }
        },

        // === Шпаклёвки и грунтовки ===
        putty_primers: {
            'putty_hp_finish': { name: 'Шпаклёвка Knauf HP Finish', unit: 'кг', price: 220, category: 'putty_primers', consumption: 1.2, consumptionUnit: 'кг/м²' },
            'putty_vetonit_lr': { name: 'Шпаклёвка Vetonit LR+', unit: 'кг', price: 350, category: 'putty_primers', consumption: 1.2, consumptionUnit: 'кг/м²' },
            'putty_fugen': { name: 'Шпаклёвка Knauf Фуген', unit: 'кг', price: 300, category: 'putty_primers', consumption: 0.8, consumptionUnit: 'кг/м²' },
            'primer_deep': { name: 'Грунтовка глубокого проникн.', unit: 'л', price: 250, category: 'putty_primers', consumption: 0.15, consumptionUnit: 'л/м²' },
            'primer_betonkontakt': { name: 'Грунтовка Бетоноконтакт', unit: 'кг', price: 380, category: 'putty_primers', consumption: 0.3, consumptionUnit: 'кг/м²' },
            'primer_antifungal': { name: 'Грунтовка антигрибковая', unit: 'л', price: 450, category: 'putty_primers', consumption: 0.2, consumptionUnit: 'л/м²' }
        },

        // === Краски ===
        paints: {
            'paint_interior_white': { name: 'Краска интерьерная белая', unit: 'л', price: 850, category: 'paints', consumption: 0.15, consumptionUnit: 'л/м² на слой' },
            'paint_interior_color': { name: 'Краска интерьерная цветная', unit: 'л', price: 1200, category: 'paints', consumption: 0.15, consumptionUnit: 'л/м² на слой' },
            'paint_facade': { name: 'Краска фасадная', unit: 'л', price: 1500, category: 'paints', consumption: 0.2, consumptionUnit: 'л/м² на слой' },
            'paint_ceiling': { name: 'Краска потолочная', unit: 'л', price: 750, category: 'paints', consumption: 0.12, consumptionUnit: 'л/м² на слой' },
            'wallpaper_vinyl': { name: 'Обои виниловые', unit: 'рулон', price: 3500, category: 'paints', consumption: 0.2, consumptionUnit: 'рулонов/м²' },
            'wallpaper_flizelin': { name: 'Обои флизелиновые', unit: 'рулон', price: 4500, category: 'paints', consumption: 0.2, consumptionUnit: 'рулонов/м²' },
            'wallpaper_glue': { name: 'Клей обойный Quelyd', unit: 'кг', price: 450, category: 'paints', consumption: 0.25, consumptionUnit: 'кг/рулон' },
            'tape_masking': { name: 'Лента малярная', unit: 'шт', price: 180, category: 'paints' }
        },

        // === Плиточные материалы ===
        tiling_materials: {
            'tile_ceramic_wall': { name: 'Плитка керамическая настенная', unit: 'м²', price: 2800, category: 'tiling_materials' },
            'tile_ceramic_floor': { name: 'Плитка керамическая напольная', unit: 'м²', price: 3500, category: 'tiling_materials' },
            'tile_porcelain': { name: 'Керамогранит', unit: 'м²', price: 4200, category: 'tiling_materials' },
            'tile_mosaic': { name: 'Мозаика', unit: 'м²', price: 6500, category: 'tiling_materials' },
            'tile_adhesive_cm11': { name: 'Клей Ceresit CM-11', unit: 'кг', price: 150, category: 'tiling_materials', consumption: 3, consumptionUnit: 'кг/м²' },
            'tile_adhesive_cm14': { name: 'Клей Ceresit CM-14 (усиленный)', unit: 'кг', price: 220, category: 'tiling_materials', consumption: 3.5, consumptionUnit: 'кг/м²' },
            'tile_grout': { name: 'Затирка Ceresit CE-40', unit: 'кг', price: 380, category: 'tiling_materials', consumption: 0.4, consumptionUnit: 'кг/м²' },
            'tile_cross': { name: 'Крестики для плитки 2мм', unit: 'уп.', price: 120, category: 'tiling_materials' }
        },

        // === Электрика ===
        electrical: {
            'cable_vvg_3x1_5': { name: 'Кабель ВВГнг 3×1.5 (свет)', unit: 'м', price: 280, category: 'electrical' },
            'cable_vvg_3x2_5': { name: 'Кабель ВВГнг 3×2.5 (розетки)', unit: 'м', price: 380, category: 'electrical' },
            'cable_vvg_3x4': { name: 'Кабель ВВГнг 3×4 (плита)', unit: 'м', price: 580, category: 'electrical' },
            'cable_vvg_5x4': { name: 'Кабель ВВГнг 5×4 (ввод)', unit: 'м', price: 850, category: 'electrical' },
            'corrugation_16': { name: 'Гофра ПВХ d16', unit: 'м', price: 25, category: 'electrical' },
            'corrugation_20': { name: 'Гофра ПВХ d20', unit: 'м', price: 35, category: 'electrical' },
            'outlet_double': { name: 'Розетка двойная (Schneider)', unit: 'шт', price: 850, category: 'electrical' },
            'outlet_single': { name: 'Розетка одинарная', unit: 'шт', price: 550, category: 'electrical' },
            'outlet_ip44': { name: 'Розетка IP44 влагозащ.', unit: 'шт', price: 1200, category: 'electrical' },
            'switch_single': { name: 'Выключатель одноклавишный', unit: 'шт', price: 450, category: 'electrical' },
            'switch_double': { name: 'Выключатель двухклавишный', unit: 'шт', price: 650, category: 'electrical' },
            'switch_dimmer': { name: 'Диммер (регулятор)', unit: 'шт', price: 2500, category: 'electrical' },
            'panel_12': { name: 'Щит распр. на 12 модулей', unit: 'шт', price: 3500, category: 'electrical' },
            'panel_24': { name: 'Щит распр. на 24 модуля', unit: 'шт', price: 5500, category: 'electrical' },
            'breaker_16a': { name: 'Автомат 16А (свет)', unit: 'шт', price: 450, category: 'electrical' },
            'breaker_25a': { name: 'Автомат 25А (розетки)', unit: 'шт', price: 550, category: 'electrical' },
            'breaker_32a': { name: 'Автомат 32А (плита)', unit: 'шт', price: 650, category: 'electrical' },
            'rcd_40a': { name: 'УЗО 40А 30мА', unit: 'шт', price: 3800, category: 'electrical' },
            'junction_box': { name: 'Подрозетник (стакан)', unit: 'шт', price: 35, category: 'electrical' },
            'led_panel_600': { name: 'Светильник LED панель 600×600', unit: 'шт', price: 3500, category: 'electrical' },
            'led_spot': { name: 'Точечный светильник LED', unit: 'шт', price: 1200, category: 'electrical' },
            'cable_channel': { name: 'Кабель-канал 25×16', unit: 'м', price: 85, category: 'electrical' }
        },

        // === Сантехника ===
        plumbing: {
            'pipe_ppr_20': { name: 'Труба PPR Ø20 (холодная)', unit: 'м', price: 120, category: 'plumbing' },
            'pipe_ppr_25': { name: 'Труба PPR Ø25 (горячая)', unit: 'м', price: 180, category: 'plumbing' },
            'pipe_ppr_32': { name: 'Труба PPR Ø32 (стояк)', unit: 'м', price: 280, category: 'plumbing' },
            'pipe_sewer_50': { name: 'Труба канализ. Ø50', unit: 'м', price: 180, category: 'plumbing' },
            'pipe_sewer_110': { name: 'Труба канализ. Ø110', unit: 'м', price: 350, category: 'plumbing' },
            'fitting_ppr_angle': { name: 'Угол PPR 20×90°', unit: 'шт', price: 45, category: 'plumbing' },
            'fitting_ppr_tee': { name: 'Тройник PPR 20', unit: 'шт', price: 65, category: 'plumbing' },
            'fitting_ppr_valve': { name: 'Кран шаровый PPR 20', unit: 'шт', price: 350, category: 'plumbing' },
            'mixer_bath': { name: 'Смеситель для ванны', unit: 'шт', price: 12000, category: 'plumbing' },
            'mixer_sink': { name: 'Смеситель для раковины', unit: 'шт', price: 8500, category: 'plumbing' },
            'mixer_kitchen': { name: 'Смеситель кухонный', unit: 'шт', price: 9500, category: 'plumbing' },
            'toilet_basic': { name: 'Унитаз (эконом)', unit: 'шт', price: 25000, category: 'plumbing' },
            'toilet_premium': { name: 'Унитаз (бизнес)', unit: 'шт', price: 55000, category: 'plumbing' },
            'sink_ceramic': { name: 'Раковина керамическая', unit: 'шт', price: 8500, category: 'plumbing' },
            'bathtub_acrylic_150': { name: 'Ванна акриловая 150см', unit: 'шт', price: 35000, category: 'plumbing' },
            'bathtub_acrylic_170': { name: 'Ванна акриловая 170см', unit: 'шт', price: 45000, category: 'plumbing' },
            'shower_cabin': { name: 'Душевая кабина', unit: 'шт', price: 65000, category: 'plumbing' },
            'water_heater_50': { name: 'Водонагреватель 50л', unit: 'шт', price: 28000, category: 'plumbing' },
            'water_heater_80': { name: 'Водонагреватель 80л', unit: 'шт', price: 38000, category: 'plumbing' },
            'water_filter': { name: 'Фильтр грубой очистки', unit: 'шт', price: 1200, category: 'plumbing' },
            'siphon_sink': { name: 'Сифон для раковины', unit: 'шт', price: 650, category: 'plumbing' },
            'siphon_bath': { name: 'Сифон для ванны', unit: 'шт', price: 1200, category: 'plumbing' }
        },

        // === Двери и фурнитура ===
        doors_hardware: {
            'door_interior_laminate': { name: 'Дверь межкомн. ламинат', unit: 'шт', price: 18000, category: 'doors_hardware' },
            'door_interior_shpon': { name: 'Дверь межкомн. шпон', unit: 'шт', price: 32000, category: 'doors_hardware' },
            'door_interior_glass': { name: 'Дверь межкомн. со стеклом', unit: 'шт', price: 28000, category: 'doors_hardware' },
            'door_frame': { name: 'Дверная коробка', unit: 'комп.', price: 5500, category: 'doors_hardware' },
            'door_casing': { name: 'Наличник дверной (комп.)', unit: 'комп.', price: 2800, category: 'doors_hardware' },
            'door_handle': { name: 'Ручка дверная', unit: 'шт', price: 1800, category: 'doors_hardware' },
            'door_lock': { name: 'Замок врезной', unit: 'шт', price: 2500, category: 'doors_hardware' },
            'door_hinges': { name: 'Петли дверные (пара)', unit: 'пара', price: 650, category: 'doors_hardware' }
        },

        // === Потолочные системы ===
        ceilings: {
            'gkl_potolok': { name: 'ГКЛ потолочный 9.5мм', unit: 'м²', price: 450, category: 'ceilings' },
            'gkl_vlago': { name: 'ГКЛВ влагостойкий 9.5мм', unit: 'м²', price: 550, category: 'ceilings' },
            'profile_cd60': { name: 'Профиль CD60 потолочный', unit: 'п.м.', price: 110, category: 'ceilings' },
            'profile_ud27_ceiling': { name: 'Профиль UD27 направляющий', unit: 'п.м.', price: 85, category: 'ceilings' },
            'suspension_direct': { name: 'Подвес прямой', unit: 'шт', price: 25, category: 'ceilings' },
            'suspension_spring': { name: 'Подвес пружинный', unit: 'шт', price: 45, category: 'ceilings' },
            'connector_cd': { name: 'Соединитель крабовый', unit: 'шт', price: 35, category: 'ceilings' },
            'armstrong_plate': { name: 'Плита Armstrong 600×600', unit: 'шт', price: 280, category: 'ceilings' },
            'armstrong_profile_t24': { name: 'Профиль Armstrong Т24', unit: 'п.м.', price: 120, category: 'ceilings' },
            'stretch_ceiling_pvc': { name: 'Натяжной потолок ПВХ матовый', unit: 'м²', price: 1800, category: 'ceilings' },
            'stretch_ceiling_satin': { name: 'Натяжной потолок сатин', unit: 'м²', price: 2200, category: 'ceilings' },
            'stretch_ceiling_gloss': { name: 'Натяжной потолок глянец', unit: 'м²', price: 2500, category: 'ceilings' },
            'stretch_ceiling_fabric': { name: 'Натяжной потолок тканевый', unit: 'м²', price: 3500, category: 'ceilings' },
            'ceiling_plinth': { name: 'Плинтус потолочный', unit: 'п.м.', price: 120, category: 'ceilings' },
            'led_strip': { name: 'Светодиодная лента 14.4Вт/м', unit: 'м', price: 450, category: 'ceilings' },
            'led_profile': { name: 'Профиль для LED ленты', unit: 'м', price: 350, category: 'ceilings' }
        },

        // === Вентиляция и кондиционирование ===
        hvac: {
            'duct_galv_100': { name: 'Воздуховод оцинк. Ø100', unit: 'м', price: 350, category: 'hvac' },
            'duct_galv_125': { name: 'Воздуховод оцинк. Ø125', unit: 'м', price: 450, category: 'hvac' },
            'duct_galv_150': { name: 'Воздуховод оцинк. Ø150', unit: 'м', price: 580, category: 'hvac' },
            'duct_flex_100': { name: 'Гофра алюм. Ø100', unit: 'м', price: 180, category: 'hvac' },
            'duct_flex_125': { name: 'Гофра алюм. Ø125', unit: 'м', price: 220, category: 'hvac' },
            'grille_vent_150': { name: 'Решётка вент. 150×150', unit: 'шт', price: 250, category: 'hvac' },
            'grille_vent_200': { name: 'Решётка вент. 200×200', unit: 'шт', price: 350, category: 'hvac' },
            'fan_exhaust_100': { name: 'Вентилятор вытяжной Ø100', unit: 'шт', price: 2800, category: 'hvac' },
            'fan_exhaust_125': { name: 'Вентилятор вытяжной Ø125', unit: 'шт', price: 3500, category: 'hvac' },
            'hood_kitchen': { name: 'Вытяжка кухонная 60см', unit: 'шт', price: 18000, category: 'hvac' },
            'ac_split_9': { name: 'Кондиционер сплит 9BTU', unit: 'шт', price: 120000, category: 'hvac' },
            'ac_split_12': { name: 'Кондиционер сплит 12BTU', unit: 'шт', price: 155000, category: 'hvac' },
            'ac_split_18': { name: 'Кондиционер сплит 18BTU', unit: 'шт', price: 210000, category: 'hvac' },
            'recuperator': { name: 'Рекуператор бытовой', unit: 'шт', price: 45000, category: 'hvac' }
        },

        // === Отопление ===
        heating: {
            'radiator_bimetal_500': { name: 'Радиатор биметалл. 500мм (секция)', unit: 'секц.', price: 2800, category: 'heating' },
            'radiator_bimetal_350': { name: 'Радиатор биметалл. 350мм (секция)', unit: 'секц.', price: 2400, category: 'heating' },
            'radiator_panel_22_500': { name: 'Радиатор стальной 22/500', unit: 'шт', price: 18000, category: 'heating' },
            'pipe_ppr_heating_25': { name: 'Труба PPR армир. 25мм', unit: 'м', price: 280, category: 'heating' },
            'pipe_ppr_heating_32': { name: 'Труба PPR армир. 32мм', unit: 'м', price: 380, category: 'heating' },
            'thermostat_head': { name: 'Термоголовка радиаторная', unit: 'шт', price: 1800, category: 'heating' },
            'valve_radiator': { name: 'Кран радиаторный', unit: 'шт', price: 450, category: 'heating' },
            'underfloor_pipe': { name: 'Труба тёплого пола 16мм', unit: 'м', price: 85, category: 'heating', consumption: 6.5, consumptionUnit: 'м/м² пола' },
            'underfloor_manifold': { name: 'Коллектор тёплого пола', unit: 'шт', price: 8500, category: 'heating' },
            'underfloor_mat': { name: 'Мат отражающий для ТП', unit: 'м²', price: 120, category: 'heating' },
            'boiler_gas_24': { name: 'Котёл газовый 24кВт', unit: 'шт', price: 180000, category: 'heating' },
            'boiler_gas_32': { name: 'Котёл газовый 32кВт', unit: 'шт', price: 230000, category: 'heating' },
            'chimney_coaxial': { name: 'Коаксиальный дымоход', unit: 'комп.', price: 8500, category: 'heating' },
            'expansion_tank': { name: 'Расширительный бак 24л', unit: 'шт', price: 4500, category: 'heating' },
            'pump_circulation': { name: 'Насос циркуляционный', unit: 'шт', price: 12000, category: 'heating' }
        },

        // === Фасадные системы ===
        facade: {
            'facade_plaster_mineral': { name: 'Штукатурка фасадная минерал.', unit: 'кг', price: 200, category: 'facade', consumption: 3.5, consumptionUnit: 'кг/м²' },
            'facade_plaster_silicone': { name: 'Штукатурка фасадная силиконовая', unit: 'кг', price: 550, category: 'facade', consumption: 3, consumptionUnit: 'кг/м²' },
            'facade_insul_eps_100': { name: 'Пенополистирол фасадный 100мм', unit: 'м²', price: 450, category: 'facade', consumption: 1, consumptionUnit: 'м²/м²' },
            'facade_insul_minwool_100': { name: 'Минвата фасадная 100мм', unit: 'м²', price: 680, category: 'facade', consumption: 1, consumptionUnit: 'м²/м²' },
            'facade_adhesive': { name: 'Клей для утеплителя Ceresit CT-83', unit: 'кг', price: 180, category: 'facade', consumption: 5, consumptionUnit: 'кг/м²' },
            'facade_mesh': { name: 'Сетка фасадная 160г/м²', unit: 'м²', price: 120, category: 'facade', consumption: 1.1, consumptionUnit: 'м²/м²' },
            'facade_dowel_10x160': { name: 'Дюбель фасадный 10×160', unit: 'шт', price: 12, category: 'facade', consumption: 5, consumptionUnit: 'шт/м²' },
            'siding_vinyl': { name: 'Сайдинг виниловый', unit: 'м²', price: 650, category: 'facade' },
            'siding_metal': { name: 'Сайдинг металлический', unit: 'м²', price: 850, category: 'facade' },
            'clinker_tile': { name: 'Клинкерная плитка фасадная', unit: 'м²', price: 3500, category: 'facade' },
            'ventfacade_bracket': { name: 'Кронштейн вентфасада', unit: 'шт', price: 85, category: 'facade' },
            'ventfacade_profile_hat': { name: 'Профиль шляпный вентфасада', unit: 'п.м.', price: 120, category: 'facade' },
            'hpl_panel': { name: 'HPL-панель фасадная', unit: 'м²', price: 4500, category: 'facade' },
            'alucobond_panel': { name: 'Алюкобонд панель 4мм', unit: 'м²', price: 3200, category: 'facade' }
        },

        // === Металлоконструкции ===
        metal_structures: {
            'beam_ipb_20': { name: 'Балка двутавровая 20Б1', unit: 'т', price: 320000, category: 'metal_structures' },
            'channel_16p': { name: 'Швеллер 16П', unit: 'т', price: 295000, category: 'metal_structures' },
            'angle_63x5': { name: 'Уголок 63×63×5', unit: 'т', price: 280000, category: 'metal_structures' },
            'pipe_profile_60x40': { name: 'Труба профильная 60×40×3', unit: 'м', price: 380, category: 'metal_structures' },
            'pipe_profile_80x80': { name: 'Труба профильная 80×80×4', unit: 'м', price: 650, category: 'metal_structures' },
            'sheet_hot_4': { name: 'Лист горячекатаный 4мм', unit: 'м²', price: 2800, category: 'metal_structures' },
            'sheet_hot_6': { name: 'Лист горячекатаный 6мм', unit: 'м²', price: 4200, category: 'metal_structures' },
            'grating_mesh': { name: 'Решётка сварная 50×50', unit: 'м²', price: 1800, category: 'metal_structures' },
            'staircase_metal': { name: 'Лестница металлическая (марш)', unit: 'шт', price: 85000, category: 'metal_structures' },
            'railing_metal': { name: 'Поручни металлические', unit: 'п.м.', price: 3500, category: 'metal_structures' },
            'paint_metal_primer': { name: 'Грунт по металлу ГФ-021', unit: 'кг', price: 380, category: 'metal_structures', consumption: 0.12, consumptionUnit: 'кг/м²' },
            'paint_metal_enamel': { name: 'Эмаль по металлу ПФ-115', unit: 'кг', price: 550, category: 'metal_structures', consumption: 0.15, consumptionUnit: 'кг/м²' },
            'electrode_3mm': { name: 'Электроды 3мм (УОНИ)', unit: 'кг', price: 650, category: 'metal_structures' }
        },

        // === Полы (расширенные) ===
        flooring_extended: {
            'parquet_oak': { name: 'Паркет дуб 15мм', unit: 'м²', price: 8500, category: 'flooring_extended' },
            'parquet_board': { name: 'Паркетная доска 3-полосная', unit: 'м²', price: 4800, category: 'flooring_extended' },
            'laminate_32': { name: 'Ламинат 32 класс', unit: 'м²', price: 3200, category: 'flooring_extended' },
            'laminate_34': { name: 'Ламинат 34 класс (коммерч.)', unit: 'м²', price: 5500, category: 'flooring_extended' },
            'vinyl_plank': { name: 'Виниловый ламинат SPC', unit: 'м²', price: 4500, category: 'flooring_extended' },
            'linoleum_commercial': { name: 'Линолеум коммерческий', unit: 'м²', price: 1800, category: 'flooring_extended' },
            'linoleum_semi': { name: 'Линолеум полукоммерческий', unit: 'м²', price: 1200, category: 'flooring_extended' },
            'epoxy_floor': { name: 'Эпоксидный наливной', unit: 'кг', price: 850, category: 'flooring_extended', consumption: 1.5, consumptionUnit: 'кг/м² на мм' },
            'polyurethane_floor': { name: 'Полиуретановый наливной', unit: 'кг', price: 1100, category: 'flooring_extended', consumption: 1.3, consumptionUnit: 'кг/м² на мм' },
            'plinth_mdf': { name: 'Плинтус МДФ 80мм', unit: 'п.м.', price: 250, category: 'flooring_extended' },
            'plinth_pvc': { name: 'Плинтус ПВХ с кабель-каналом', unit: 'п.м.', price: 180, category: 'flooring_extended' },
            'threshold_alum': { name: 'Порог алюминиевый', unit: 'шт', price: 350, category: 'flooring_extended' }
        },

        // === Ландшафт и благоустройство ===
        landscape: {
            'paving_stone_grey': { name: 'Тротуарная плитка серая', unit: 'м²', price: 1200, category: 'landscape' },
            'paving_stone_color': { name: 'Тротуарная плитка цветная', unit: 'м²', price: 1600, category: 'landscape' },
            'border_stone': { name: 'Бордюрный камень 1000×200', unit: 'шт', price: 280, category: 'landscape' },
            'border_garden': { name: 'Бордюр садовый 500×200', unit: 'шт', price: 120, category: 'landscape' },
            'geotextile_landscape': { name: 'Геотекстиль 150г/м²', unit: 'м²', price: 55, category: 'landscape' },
            'fence_profsheet': { name: 'Профлист заборный С8', unit: 'м²', price: 450, category: 'landscape' },
            'fence_post_60': { name: 'Столб заборный 60×60×3 (2.5м)', unit: 'шт', price: 1800, category: 'landscape' },
            'fence_lag_40x20': { name: 'Лаг заборный 40×20×1.5', unit: 'п.м.', price: 180, category: 'landscape' },
            'gate_swing': { name: 'Ворота распашные 3м', unit: 'шт', price: 35000, category: 'landscape' },
            'wicket': { name: 'Калитка 1м', unit: 'шт', price: 12000, category: 'landscape' },
            'lawn_seed': { name: 'Газон семенной (смесь)', unit: 'кг', price: 1500, category: 'landscape', consumption: 0.04, consumptionUnit: 'кг/м²' },
            'lawn_roll': { name: 'Газон рулонный', unit: 'м²', price: 350, category: 'landscape' },
            'soil_fertile': { name: 'Грунт плодородный', unit: 'м³', price: 3500, category: 'landscape' },
            'drainage_pipe_110': { name: 'Труба дренажная Ø110', unit: 'м', price: 280, category: 'landscape' }
        },

        // === Противопожарные системы ===
        fire_safety: {
            'fire_extinguisher': { name: 'Огнетушитель ОП-5', unit: 'шт', price: 3500, category: 'fire_safety' },
            'smoke_detector': { name: 'Датчик дыма', unit: 'шт', price: 1200, category: 'fire_safety' },
            'fire_alarm_panel': { name: 'Пульт пожарной сигнализации', unit: 'шт', price: 15000, category: 'fire_safety' },
            'fire_cable': { name: 'Кабель огнестойкий КПСЭнг', unit: 'м', price: 85, category: 'fire_safety' },
            'fire_door': { name: 'Дверь противопожарная EI60', unit: 'шт', price: 45000, category: 'fire_safety' },
            'fire_paint': { name: 'Краска огнезащитная', unit: 'кг', price: 850, category: 'fire_safety', consumption: 0.5, consumptionUnit: 'кг/м²' }
        },

        // === Слаботочные системы ===
        low_voltage: {
            'cable_utp_cat5e': { name: 'Кабель UTP Cat5e', unit: 'м', price: 55, category: 'low_voltage' },
            'cable_tv_rg6': { name: 'Кабель ТВ RG-6', unit: 'м', price: 35, category: 'low_voltage' },
            'outlet_rj45': { name: 'Розетка RJ-45 (интернет)', unit: 'шт', price: 350, category: 'low_voltage' },
            'outlet_tv': { name: 'Розетка ТВ', unit: 'шт', price: 280, category: 'low_voltage' },
            'intercom': { name: 'Видеодомофон 7"', unit: 'шт', price: 25000, category: 'low_voltage' },
            'camera_ip': { name: 'IP-камера видеонаблюдения', unit: 'шт', price: 8500, category: 'low_voltage' },
            'nvr_4ch': { name: 'Видеорегистратор 4 канала', unit: 'шт', price: 18000, category: 'low_voltage' }
        },

        // === Пиломатериалы и древесина ===
        lumber: {
            'board_25x150': { name: 'Доска обрезная 25×150мм', unit: 'м³', price: 32000, category: 'lumber' },
            'board_40x150': { name: 'Доска обрезная 40×150мм', unit: 'м³', price: 35000, category: 'lumber' },
            'board_50x150': { name: 'Доска обрезная 50×150мм', unit: 'м³', price: 36000, category: 'lumber' },
            'board_50x200': { name: 'Доска обрезная 50×200мм', unit: 'м³', price: 38000, category: 'lumber' },
            'beam_100x100': { name: 'Брус 100×100мм', unit: 'м³', price: 42000, category: 'lumber' },
            'beam_100x150': { name: 'Брус 100×150мм', unit: 'м³', price: 42000, category: 'lumber' },
            'beam_150x150': { name: 'Брус 150×150мм', unit: 'м³', price: 45000, category: 'lumber' },
            'beam_150x200': { name: 'Брус 150×200мм', unit: 'м³', price: 48000, category: 'lumber' },
            'beam_200x200': { name: 'Брус 200×200мм', unit: 'м³', price: 50000, category: 'lumber' },
            'beam_glulam': { name: 'Брус клеёный (клеедrev)', unit: 'м³', price: 85000, category: 'lumber' },
            'plywood_4mm': { name: 'Фанера ФК 4мм', unit: 'м²', price: 280, category: 'lumber' },
            'plywood_10mm': { name: 'Фанера ФК 10мм', unit: 'м²', price: 580, category: 'lumber' },
            'plywood_12mm': { name: 'Фанера ФСФ 12мм', unit: 'м²', price: 750, category: 'lumber' },
            'plywood_18mm': { name: 'Фанера ФСФ 18мм', unit: 'м²', price: 1100, category: 'lumber' },
            'plywood_21mm': { name: 'Фанера ФСФ 21мм ламинированная', unit: 'м²', price: 1500, category: 'lumber' },
            'osb_9mm': { name: 'ОСП-3 (OSB) 9мм', unit: 'м²', price: 450, category: 'lumber' },
            'osb_12mm': { name: 'ОСП-3 (OSB) 12мм', unit: 'м²', price: 580, category: 'lumber' },
            'osb_18mm': { name: 'ОСП-3 (OSB) 18мм', unit: 'м²', price: 850, category: 'lumber' },
            'vagonka_pine': { name: 'Вагонка сосна А', unit: 'м²', price: 550, category: 'lumber' },
            'vagonka_lipa': { name: 'Вагонка липа (для бани)', unit: 'м²', price: 850, category: 'lumber' },
            'block_house': { name: 'Блок-хаус (имитация бруса)', unit: 'м²', price: 750, category: 'lumber' },
            'deck_board': { name: 'Террасная доска лиственница', unit: 'м²', price: 1800, category: 'lumber' },
            'deck_wpc': { name: 'Террасная доска ДПК', unit: 'м²', price: 2200, category: 'lumber' },
            'antiseptic_wood': { name: 'Антисептик для древесины', unit: 'л', price: 450, category: 'lumber', consumption: 0.15, consumptionUnit: 'л/м²' },
            'lak_wood': { name: 'Лак для дерева', unit: 'л', price: 850, category: 'lumber', consumption: 0.1, consumptionUnit: 'л/м²' },
            'morenie_wood': { name: 'Морилка для дерева', unit: 'л', price: 350, category: 'lumber', consumption: 0.1, consumptionUnit: 'л/м²' }
        },

        // === ГКЛ перегородки и системы ===
        drywall: {
            'gkl_12_5': { name: 'ГКЛ стеновой 12.5мм', unit: 'м²', price: 380, category: 'drywall' },
            'gkl_12_5v': { name: 'ГКЛВ влагостойкий 12.5мм', unit: 'м²', price: 520, category: 'drywall' },
            'gkl_12_5o': { name: 'ГКЛО огнестойкий 12.5мм', unit: 'м²', price: 580, category: 'drywall' },
            'gvl_10': { name: 'ГВЛ суперлист 10мм', unit: 'м²', price: 450, category: 'drywall' },
            'profile_cw_50': { name: 'Профиль CW 50 (стоечный)', unit: 'п.м.', price: 130, category: 'drywall' },
            'profile_cw_75': { name: 'Профиль CW 75 (стоечный)', unit: 'п.м.', price: 160, category: 'drywall' },
            'profile_cw_100': { name: 'Профиль CW 100 (стоечный)', unit: 'п.м.', price: 190, category: 'drywall' },
            'profile_uw_50': { name: 'Профиль UW 50 (направляющий)', unit: 'п.м.', price: 110, category: 'drywall' },
            'profile_uw_75': { name: 'Профиль UW 75 (направляющий)', unit: 'п.м.', price: 140, category: 'drywall' },
            'profile_uw_100': { name: 'Профиль UW 100 (направляющий)', unit: 'п.м.', price: 170, category: 'drywall' },
            'screw_gkl_25': { name: 'Саморез ГКЛ 3.5×25', unit: 'шт', price: 1.5, category: 'drywall', consumption: 23, consumptionUnit: 'шт/м²' },
            'screw_gkl_35': { name: 'Саморез ГКЛ 3.5×35', unit: 'шт', price: 2, category: 'drywall', consumption: 23, consumptionUnit: 'шт/м²' },
            'tape_serpyanka': { name: 'Лента серпянка', unit: 'м', price: 8, category: 'drywall' },
            'tape_paper_joint': { name: 'Лента бумажная Knauf', unit: 'м', price: 5, category: 'drywall' },
            'corner_gkl': { name: 'Уголок перфорированный', unit: 'п.м.', price: 35, category: 'drywall' },
            'sound_insul_50': { name: 'Звукоизоляция 50мм (в перегородку)', unit: 'м²', price: 250, category: 'drywall' },
            'sound_insul_100': { name: 'Звукоизоляция 100мм', unit: 'м²', price: 480, category: 'drywall' },
            'damper_tape': { name: 'Демпферная лента 50мм', unit: 'м', price: 25, category: 'drywall' }
        },

        // === Герметики и химия ===
        sealants: {
            'silicone_sanitary': { name: 'Герметик силиконовый санитарный', unit: 'шт', price: 450, category: 'sealants' },
            'silicone_universal': { name: 'Герметик силиконовый универс.', unit: 'шт', price: 380, category: 'sealants' },
            'silicone_fire': { name: 'Герметик огнестойкий', unit: 'шт', price: 650, category: 'sealants' },
            'acrylic_sealant': { name: 'Герметик акриловый', unit: 'шт', price: 320, category: 'sealants' },
            'polyurethane_sealant': { name: 'Герметик полиуретановый', unit: 'шт', price: 580, category: 'sealants' },
            'foam_mounting_65': { name: 'Пена монтажная 65л', unit: 'бал.', price: 580, category: 'sealants' },
            'foam_mounting_pro': { name: 'Пена монтажная проф.', unit: 'бал.', price: 750, category: 'sealants' },
            'foam_gun': { name: 'Пистолет для пены', unit: 'шт', price: 850, category: 'sealants' },
            'foam_cleaner': { name: 'Очиститель пены', unit: 'бал.', price: 350, category: 'sealants' },
            'liquid_nails': { name: 'Жидкие гвозди', unit: 'шт', price: 420, category: 'sealants' },
            'epoxy_glue': { name: 'Клей эпоксидный 2-комп.', unit: 'кг', price: 1200, category: 'sealants' },
            'contact_cement': { name: 'Клей контактный 88', unit: 'л', price: 550, category: 'sealants' },
            'psul_lenta': { name: 'ПСУЛ (предварительно сжатая лента)', unit: 'м', price: 35, category: 'sealants' }
        },

        // === Крепёж расширенный ===
        fasteners_ext: {
            'screw_wood_40': { name: 'Саморезы по дереву 4×40', unit: 'кг', price: 550, category: 'fasteners_ext' },
            'screw_wood_65': { name: 'Саморезы по дереву 4×65', unit: 'кг', price: 580, category: 'fasteners_ext' },
            'screw_wood_90': { name: 'Саморезы по дереву 5×90', unit: 'кг', price: 620, category: 'fasteners_ext' },
            'screw_metal_13': { name: 'Саморез по металлу 3.5×13', unit: 'кг', price: 700, category: 'fasteners_ext' },
            'screw_roofing': { name: 'Саморез кровельный 4.8×35', unit: 'шт', price: 5, category: 'fasteners_ext' },
            'nail_smooth_50': { name: 'Гвоздь гладкий 50мм', unit: 'кг', price: 420, category: 'fasteners_ext' },
            'nail_smooth_80': { name: 'Гвоздь гладкий 80мм', unit: 'кг', price: 440, category: 'fasteners_ext' },
            'nail_smooth_120': { name: 'Гвоздь гладкий 120мм', unit: 'кг', price: 460, category: 'fasteners_ext' },
            'nail_ring_60': { name: 'Гвоздь ершёный 60мм', unit: 'кг', price: 520, category: 'fasteners_ext' },
            'dowel_6x40': { name: 'Дюбель-гвоздь 6×40', unit: 'шт', price: 4, category: 'fasteners_ext' },
            'dowel_6x60': { name: 'Дюбель-гвоздь 6×60', unit: 'шт', price: 5, category: 'fasteners_ext' },
            'dowel_8x100': { name: 'Дюбель-гвоздь 8×100', unit: 'шт', price: 10, category: 'fasteners_ext' },
            'dowel_10x120': { name: 'Дюбель-гвоздь 10×120', unit: 'шт', price: 15, category: 'fasteners_ext' },
            'anchor_wedge_10': { name: 'Анкер клиновой 10×100', unit: 'шт', price: 45, category: 'fasteners_ext' },
            'anchor_wedge_12': { name: 'Анкер клиновой 12×120', unit: 'шт', price: 65, category: 'fasteners_ext' },
            'anchor_chemical': { name: 'Анкер химический (капсула)', unit: 'шт', price: 350, category: 'fasteners_ext' },
            'bolt_hex_m10': { name: 'Болт М10×80 с гайкой', unit: 'шт', price: 25, category: 'fasteners_ext' },
            'bolt_hex_m12': { name: 'Болт М12×100 с гайкой', unit: 'шт', price: 35, category: 'fasteners_ext' },
            'washer_m10': { name: 'Шайба М10', unit: 'шт', price: 3, category: 'fasteners_ext' },
            'perforated_plate': { name: 'Пластина перфорированная 100×200', unit: 'шт', price: 65, category: 'fasteners_ext' },
            'angle_bracket_small': { name: 'Уголок крепёжный 50×50', unit: 'шт', price: 25, category: 'fasteners_ext' },
            'angle_bracket_big': { name: 'Уголок усиленный 90×90', unit: 'шт', price: 55, category: 'fasteners_ext' },
            'joist_hanger': { name: 'Опора бруса (башмак)', unit: 'шт', price: 120, category: 'fasteners_ext' },
            'tape_mounting_double': { name: 'Лента двусторонняя монтажная', unit: 'м', price: 45, category: 'fasteners_ext' }
        },

        // === Лестницы и ступени ===
        stairs: {
            'step_pine': { name: 'Ступень сосна 900×300×40', unit: 'шт', price: 2500, category: 'stairs' },
            'step_oak': { name: 'Ступень дуб 900×300×40', unit: 'шт', price: 5500, category: 'stairs' },
            'step_beech': { name: 'Ступень бук 900×300×40', unit: 'шт', price: 4500, category: 'stairs' },
            'riser_pine': { name: 'Подступенок сосна 900×180×20', unit: 'шт', price: 800, category: 'stairs' },
            'riser_oak': { name: 'Подступенок дуб', unit: 'шт', price: 2200, category: 'stairs' },
            'stringer_wood': { name: 'Косоур деревянный', unit: 'шт', price: 8500, category: 'stairs' },
            'handrail_wood': { name: 'Поручень деревянный', unit: 'п.м.', price: 1800, category: 'stairs' },
            'baluster_wood': { name: 'Балясина деревянная', unit: 'шт', price: 450, category: 'stairs' },
            'newel_post': { name: 'Столб опорный', unit: 'шт', price: 2500, category: 'stairs' },
            'step_concrete': { name: 'Ступень бетонная (накладка)', unit: 'шт', price: 3500, category: 'stairs' },
            'nosing_alum': { name: 'Профиль для ступеней алюм.', unit: 'п.м.', price: 350, category: 'stairs' },
            'railing_glass': { name: 'Ограждение стеклянное', unit: 'п.м.', price: 12000, category: 'stairs' },
            'railing_stainless': { name: 'Перила нержавеющие', unit: 'п.м.', price: 5500, category: 'stairs' }
        },

        // === Балкон и лоджия ===
        balcony: {
            'glazing_alum_cold': { name: 'Остекление алюм. холодное', unit: 'м²', price: 4500, category: 'balcony' },
            'glazing_pvh_warm': { name: 'Остекление ПВХ тёплое', unit: 'м²', price: 8500, category: 'balcony' },
            'glazing_frame_slide': { name: 'Раздвижные рамы (Provedal)', unit: 'м²', price: 5500, category: 'balcony' },
            'insul_pir_30': { name: 'PIR плита 30мм для балкона', unit: 'м²', price: 450, category: 'balcony' },
            'insul_pir_50': { name: 'PIR плита 50мм для балкона', unit: 'м²', price: 650, category: 'balcony' },
            'penofol_5mm': { name: 'Пенофол фольгированный 5мм', unit: 'м²', price: 120, category: 'balcony' },
            'penofol_10mm': { name: 'Пенофол фольгированный 10мм', unit: 'м²', price: 200, category: 'balcony' },
            'pvc_panel': { name: 'ПВХ панель (белая)', unit: 'м²', price: 320, category: 'balcony' },
            'pvc_panel_wood': { name: 'ПВХ панель (под дерево)', unit: 'м²', price: 450, category: 'balcony' },
            'sill_balcony': { name: 'Подоконник балконный 250мм', unit: 'п.м.', price: 1800, category: 'balcony' },
            'clothesline': { name: 'Сушилка потолочная Лиана', unit: 'шт', price: 2500, category: 'balcony' },
            'electric_mat_heating': { name: 'Эл. тёплый пол мат 150Вт/м²', unit: 'м²', price: 3500, category: 'balcony' }
        },

        // === Газовое оборудование ===
        gas_equipment: {
            'gas_pipe_15': { name: 'Труба газовая Ø15', unit: 'м', price: 220, category: 'gas_equipment' },
            'gas_pipe_20': { name: 'Труба газовая Ø20', unit: 'м', price: 280, category: 'gas_equipment' },
            'gas_valve': { name: 'Кран газовый шаровый', unit: 'шт', price: 350, category: 'gas_equipment' },
            'gas_meter': { name: 'Счётчик газовый', unit: 'шт', price: 4500, category: 'gas_equipment' },
            'gas_detector': { name: 'Датчик утечки газа', unit: 'шт', price: 2500, category: 'gas_equipment' },
            'gas_hose': { name: 'Гибкая подводка газовая 1м', unit: 'шт', price: 550, category: 'gas_equipment' },
            'gas_stove': { name: 'Газовая плита 4-конфорочная', unit: 'шт', price: 55000, category: 'gas_equipment' },
            'gas_cooktop': { name: 'Варочная панель газовая', unit: 'шт', price: 45000, category: 'gas_equipment' }
        },

        // === Водосточные системы ===
        drainage_systems: {
            'gutter_pvc_125': { name: 'Желоб водосточный ПВХ 125мм', unit: 'п.м.', price: 450, category: 'drainage_systems' },
            'gutter_metal_125': { name: 'Желоб водосточный метал. 125мм', unit: 'п.м.', price: 650, category: 'drainage_systems' },
            'downpipe_pvc_87': { name: 'Труба водосточная ПВХ 87мм', unit: 'п.м.', price: 380, category: 'drainage_systems' },
            'downpipe_metal_87': { name: 'Труба водосточная метал. 87мм', unit: 'п.м.', price: 550, category: 'drainage_systems' },
            'gutter_bracket': { name: 'Кронштейн желоба', unit: 'шт', price: 120, category: 'drainage_systems' },
            'pipe_clamp': { name: 'Хомут трубы', unit: 'шт', price: 85, category: 'drainage_systems' },
            'funnel': { name: 'Воронка водосточная', unit: 'шт', price: 350, category: 'drainage_systems' },
            'elbow_67': { name: 'Колено 67°', unit: 'шт', price: 250, category: 'drainage_systems' },
            'endcap': { name: 'Заглушка желоба', unit: 'шт', price: 120, category: 'drainage_systems' },
            'connector_gutter': { name: 'Соединитель желобов', unit: 'шт', price: 180, category: 'drainage_systems' },
            'rain_tray': { name: 'Лоток ливневый бетонный', unit: 'п.м.', price: 850, category: 'drainage_systems' },
            'rain_grate': { name: 'Решётка ливневая чугунная', unit: 'шт', price: 1200, category: 'drainage_systems' },
            'rain_well': { name: 'Дождеприёмник', unit: 'шт', price: 2500, category: 'drainage_systems' },
            'geomembrane': { name: 'Геомембрана HDPE 1мм', unit: 'м²', price: 180, category: 'drainage_systems' }
        },

        // === Кухня ===
        kitchen: {
            'countertop_laminate': { name: 'Столешница ламинат 28мм', unit: 'п.м.', price: 3500, category: 'kitchen' },
            'countertop_stone': { name: 'Столешница искусств. камень', unit: 'п.м.', price: 12000, category: 'kitchen' },
            'countertop_quartz': { name: 'Столешница кварц', unit: 'п.м.', price: 25000, category: 'kitchen' },
            'kitchen_sink_ss': { name: 'Мойка нерж. врезная', unit: 'шт', price: 8500, category: 'kitchen' },
            'kitchen_sink_granite': { name: 'Мойка гранитная', unit: 'шт', price: 18000, category: 'kitchen' },
            'kitchen_mixer': { name: 'Смеситель кухонный с фильтром', unit: 'шт', price: 12000, category: 'kitchen' },
            'disposal': { name: 'Измельчитель отходов', unit: 'шт', price: 25000, category: 'kitchen' },
            'oven_builtin': { name: 'Духовой шкаф встр.', unit: 'шт', price: 65000, category: 'kitchen' },
            'dishwasher': { name: 'Посудомоечная машина встр.', unit: 'шт', price: 85000, category: 'kitchen' },
            'microwave_builtin': { name: 'СВЧ встраиваемая', unit: 'шт', price: 35000, category: 'kitchen' }
        },

        // === Строительная химия ===
        construction_chem: {
            'cement_m500': { name: 'Цемент ПЦ М500 (50кг)', unit: 'мешок', price: 2800, category: 'construction_chem' },
            'cement_m400': { name: 'Цемент ПЦ М400 (50кг)', unit: 'мешок', price: 2400, category: 'construction_chem' },
            'nalivnoy_unis': { name: 'Наливной пол Юнис 25кг', unit: 'мешок', price: 850, category: 'construction_chem', consumption: 1.6, consumptionUnit: 'кг/м² на мм' },
            'nalivnoy_vetonit': { name: 'Наливной пол Vetonit 25кг', unit: 'мешок', price: 1200, category: 'construction_chem', consumption: 1.5, consumptionUnit: 'кг/м² на мм' },
            'drying_mix': { name: 'Сухая смесь М150', unit: 'мешок', price: 350, category: 'construction_chem' },
            'plaster_renovation': { name: 'Штукатурка реставрационная', unit: 'кг', price: 350, category: 'construction_chem' },
            'concrete_repair': { name: 'Ремонтный состав для бетона', unit: 'кг', price: 250, category: 'construction_chem' },
            'hardener_floor': { name: 'Топпинг-упрочнитель для пола', unit: 'кг', price: 120, category: 'construction_chem', consumption: 5, consumptionUnit: 'кг/м²' },
            'waterproof_additive': { name: 'Добавка гидрофобизирующая', unit: 'л', price: 350, category: 'construction_chem' },
            'frost_additive': { name: 'Добавка противоморозная', unit: 'л', price: 180, category: 'construction_chem' },
            'plasticizer': { name: 'Пластификатор для бетона', unit: 'л', price: 250, category: 'construction_chem' },
            'defoamer': { name: 'Пеногаситель', unit: 'л', price: 450, category: 'construction_chem' },
            'fiber_polyprop': { name: 'Фибра полипропиленовая', unit: 'кг', price: 280, category: 'construction_chem', consumption: 0.9, consumptionUnit: 'кг/м³' },
            'curing_compound': { name: 'Плёнкообразующее для бетона', unit: 'л', price: 380, category: 'construction_chem', consumption: 0.3, consumptionUnit: 'л/м²' }
        },

        // === Стеклопакеты и зеркала ===
        glass: {
            'glass_4mm': { name: 'Стекло оконное 4мм', unit: 'м²', price: 850, category: 'glass' },
            'glass_6mm': { name: 'Стекло 6мм', unit: 'м²', price: 1200, category: 'glass' },
            'glass_tempered_8': { name: 'Стекло закалённое 8мм', unit: 'м²', price: 3500, category: 'glass' },
            'glass_triplex': { name: 'Триплекс 6мм', unit: 'м²', price: 4500, category: 'glass' },
            'mirror_4mm': { name: 'Зеркало 4мм', unit: 'м²', price: 1800, category: 'glass' },
            'mirror_mounting': { name: 'Крепление для зеркала', unit: 'комп.', price: 450, category: 'glass' },
            'shower_glass_8': { name: 'Стеклянная перегородка для душа 8мм', unit: 'м²', price: 8500, category: 'glass' },
            'glass_block': { name: 'Стеклоблок декоративный', unit: 'шт', price: 350, category: 'glass' }
        },

        // === Декоративный камень и панели ===
        decorative: {
            'stone_decor_gypsum': { name: 'Камень декоративный гипсовый', unit: 'м²', price: 1200, category: 'decorative' },
            'stone_decor_cement': { name: 'Камень декоративный цементный', unit: 'м²', price: 2500, category: 'decorative' },
            'brick_decor': { name: 'Кирпич декоративный гипсовый', unit: 'м²', price: 950, category: 'decorative' },
            'panel_3d_gypsum': { name: '3D-панель гипсовая', unit: 'м²', price: 1500, category: 'decorative' },
            'panel_mdf': { name: 'Стеновая панель МДФ', unit: 'м²', price: 650, category: 'decorative' },
            'panel_soft': { name: 'Мягкая стеновая панель', unit: 'м²', price: 3500, category: 'decorative' },
            'corniche': { name: 'Карниз потолочный гипс', unit: 'п.м.', price: 350, category: 'decorative' },
            'rosette_ceiling': { name: 'Розетка потолочная', unit: 'шт', price: 1500, category: 'decorative' },
            'molding': { name: 'Молдинг полиуретановый', unit: 'п.м.', price: 280, category: 'decorative' },
            'baseboard_hidden': { name: 'Плинтус скрытого монтажа', unit: 'п.м.', price: 550, category: 'decorative' }
        },

        // === Саморегулирующие кабели, тёплый пол электр. ===
        electric_heating: {
            'heating_cable_15': { name: 'Кабель тёплого пола 15Вт/м', unit: 'м', price: 250, category: 'electric_heating' },
            'heating_cable_20': { name: 'Кабель тёплого пола 20Вт/м', unit: 'м', price: 320, category: 'electric_heating' },
            'heating_mat_150': { name: 'Нагревательный мат 150Вт/м²', unit: 'м²', price: 3500, category: 'electric_heating' },
            'heating_mat_200': { name: 'Нагревательный мат 200Вт/м²', unit: 'м²', price: 4200, category: 'electric_heating' },
            'thermostat_simple': { name: 'Терморегулятор механический', unit: 'шт', price: 2500, category: 'electric_heating' },
            'thermostat_program': { name: 'Терморегулятор программируемый', unit: 'шт', price: 5500, category: 'electric_heating' },
            'thermostat_wifi': { name: 'Терморегулятор Wi-Fi', unit: 'шт', price: 8500, category: 'electric_heating' },
            'heating_film_ir': { name: 'Инфракрасная плёнка 220Вт/м²', unit: 'м²', price: 2200, category: 'electric_heating' },
            'self_reg_cable': { name: 'Саморегулирующий кабель (обогрев труб)', unit: 'м', price: 450, category: 'electric_heating' }
        },

        // === Леса и временные конструкции ===
        scaffolding: {
            'scaffold_frame': { name: 'Строительные леса (аренда/мес)', unit: 'м²', price: 150, category: 'scaffolding' },
            'scaffold_tour': { name: 'Вышка-тура (аренда/мес)', unit: 'шт', price: 8000, category: 'scaffolding' },
            'container_office': { name: 'Бытовка строительная (аренда/мес)', unit: 'шт', price: 25000, category: 'scaffolding' },
            'container_storage': { name: 'Контейнер складской (аренда/мес)', unit: 'шт', price: 15000, category: 'scaffolding' },
            'biotoilet': { name: 'Биотуалет (аренда/мес)', unit: 'шт', price: 12000, category: 'scaffolding' },
            'temp_fence': { name: 'Ограждение временное', unit: 'п.м.', price: 350, category: 'scaffolding' }
        },

        // === Расходные и инструмент ===
        consumables: {
            'gloves': { name: 'Перчатки рабочие', unit: 'пара', price: 150, category: 'consumables' },
            'garbage_bag': { name: 'Мешки для мусора (уп.100шт)', unit: 'уп.', price: 1200, category: 'consumables' },
            'film_cover': { name: 'Плёнка укрывная 3×10м', unit: 'шт', price: 350, category: 'consumables' },
            'tape_duct': { name: 'Скотч армированный', unit: 'шт', price: 250, category: 'consumables' },
            'saw_blade': { name: 'Диск отрезной 230мм', unit: 'шт', price: 180, category: 'consumables' },
            'drill_bit_set': { name: 'Набор свёрл по бетону', unit: 'компл.', price: 1500, category: 'consumables' },
            'diamond_disk_125': { name: 'Диск алмазный 125мм', unit: 'шт', price: 1200, category: 'consumables' },
            'diamond_disk_230': { name: 'Диск алмазный 230мм', unit: 'шт', price: 2500, category: 'consumables' },
            'sand_paper_p80': { name: 'Шкурка зернистость P80', unit: 'м²', price: 85, category: 'consumables' },
            'sand_paper_p120': { name: 'Шкурка зернистость P120', unit: 'м²', price: 95, category: 'consumables' },
            'sand_paper_p240': { name: 'Шкурка зернистость P240', unit: 'м²', price: 110, category: 'consumables' },
            'paint_roller': { name: 'Валик малярный 250мм', unit: 'шт', price: 250, category: 'consumables' },
            'paint_brush_50': { name: 'Кисть флейцевая 50мм', unit: 'шт', price: 120, category: 'consumables' },
            'paint_tray': { name: 'Кювета малярная', unit: 'шт', price: 180, category: 'consumables' }
        }
    };

    // ========== РАБОТЫ ==========
    const WORKS = {
        // === Земляные работы ===
        earthwork: {
            'excavation_manual': { name: 'Ручная копка', unit: 'м³', price: 2500, category: 'earthwork' },
            'excavation_machine': { name: 'Механизированная копка', unit: 'м³', price: 800, category: 'earthwork' },
            'backfill': { name: 'Обратная засыпка', unit: 'м³', price: 600, category: 'earthwork' },
            'compaction': { name: 'Трамбовка', unit: 'м²', price: 150, category: 'earthwork' },
            'leveling': { name: 'Планировка', unit: 'м²', price: 80, category: 'earthwork' }
        },

        // === Бетонные работы ===
        concreting: {
            'concrete_pour': { name: 'Бетонирование', unit: 'м³', price: 3500, category: 'concreting' },
            'concrete_pour_pump': { name: 'Бетонирование с насосом', unit: 'м³', price: 4500, category: 'concreting' },
            'concrete_slab': { name: 'Бетонирование плиты', unit: 'м³', price: 4500, category: 'concreting' },
            'concrete_walls': { name: 'Бетонирование стен', unit: 'м³', price: 5500, category: 'concreting' },
            'reinforcement': { name: 'Армирование', unit: 'кг', price: 35, category: 'concreting' },
            'reinforcement_cage': { name: 'Вязка каркаса', unit: 'т', price: 12000, category: 'concreting' }
        },

        // === Опалубочные работы ===
        formwork_works: {
            'formwork_install': { name: 'Монтаж опалубки', unit: 'м²', price: 800, category: 'formwork' },
            'formwork_remove': { name: 'Демонтаж опалубки', unit: 'м²', price: 300, category: 'formwork' }
        },

        // === Кладка ===
        masonry: {
            'brick_laying': { name: 'Кладка кирпича', unit: 'м²', price: 1800, category: 'masonry' },
            'brick_laying_facing': { name: 'Кладка облицовочная', unit: 'м²', price: 2500, category: 'masonry' },
            'block_laying': { name: 'Кладка блоков', unit: 'м²', price: 1200, category: 'masonry' },
            'lintel_install': { name: 'Монтаж перемычек', unit: 'шт', price: 500, category: 'masonry' }
        },

        // === Фундамент ===
        foundation: {
            'foundation_prep': { name: 'Подготовка основания', unit: 'м²', price: 450, category: 'foundation' },
            'sand_cushion': { name: 'Устройство песчаной подушки', unit: 'м²', price: 350, category: 'foundation' },
            'gravel_cushion': { name: 'Устройство щебёночной подушки', unit: 'м²', price: 400, category: 'foundation' },
            'waterproofing': { name: 'Гидроизоляция', unit: 'м²', price: 280, category: 'foundation' },
            'drainage': { name: 'Дренаж', unit: 'п.м.', price: 1200, category: 'foundation' }
        },

        // === Свайные работы ===
        piling: {
            'pile_drilling': { name: 'Бурение скважин', unit: 'п.м.', price: 2800, category: 'piling' },
            'pile_reinforcing': { name: 'Армирование сваи', unit: 'шт', price: 2500, category: 'piling' },
            'pile_concreting': { name: 'Бетонирование свай', unit: 'м³', price: 5000, category: 'piling' },
            'screw_pile': { name: 'Монтаж винтовой сваи', unit: 'шт', price: 3500, category: 'piling' }
        },

        // === Трубопроводные работы ===
        piping: {
            'pipe_trench': { name: 'Копка траншеи под трубопр.', unit: 'п.м.', price: 450, category: 'piping' },
            'pipe_pvc_lay': { name: 'Прокладка ПВХ трубы', unit: 'п.м.', price: 350, category: 'piping' },
            'pipe_metal_lay': { name: 'Прокладка стальной трубы', unit: 'п.м.', price: 650, category: 'piping' },
            'pipe_hdpe_lay': { name: 'Прокладка ПНД трубы', unit: 'п.м.', price: 280, category: 'piping' },
            'pipe_test': { name: 'Испытание трубопровода', unit: 'п.м.', price: 120, category: 'piping' },
            'manhole_install': { name: 'Устройство колодца', unit: 'шт', price: 5500, category: 'piping' }
        },

        // === Стяжка и полы ===
        flooring: {
            'screed': { name: 'Устройство стяжки', unit: 'м²', price: 550, category: 'flooring' },
            'self_leveling': { name: 'Наливной пол', unit: 'м²', price: 450, category: 'flooring' },
            'tile_laying': { name: 'Укладка плитки', unit: 'м²', price: 1200, category: 'flooring' },
            'laminate': { name: 'Укладка ламината', unit: 'м²', price: 400, category: 'flooring' }
        },

        // === Кровельные работы ===
        roofing: {
            'rafter_install': { name: 'Монтаж стропильной системы', unit: 'м²', price: 650, category: 'roofing' },
            'batten_install': { name: 'Монтаж обрешётки', unit: 'м²', price: 250, category: 'roofing' },
            'metal_tile_install': { name: 'Монтаж металлочерепицы', unit: 'м²', price: 500, category: 'roofing' },
            'membrane_install': { name: 'Монтаж ПВХ мембраны', unit: 'м²', price: 450, category: 'roofing' },
            'roof_insulation': { name: 'Утепление кровли', unit: 'м²', price: 350, category: 'roofing' },
            'ridge_install': { name: 'Установка конька и доборных', unit: 'п.м.', price: 350, category: 'roofing' },
            'gutter_install': { name: 'Монтаж водостоков', unit: 'п.м.', price: 450, category: 'roofing' },
            'slope_screed': { name: 'Стяжка разуклонки', unit: 'м²', price: 550, category: 'roofing' }
        },

        // === Отделочные работы ===
        finishing: {
            'plastering': { name: 'Штукатурка стен', unit: 'м²', price: 1200, category: 'finishing' },
            'putty_walls': { name: 'Шпатлёвка стен', unit: 'м²', price: 650, category: 'finishing' },
            'painting': { name: 'Покраска стен/потолков', unit: 'м²', price: 450, category: 'finishing' },
            'gypsum_install': { name: 'Монтаж ГКЛ', unit: 'м²', price: 800, category: 'finishing' },
            'wallpaper': { name: 'Поклейка обоев', unit: 'м²', price: 400, category: 'finishing' },
            'tile_wall_install': { name: 'Укладка плитки настенной', unit: 'м²', price: 1800, category: 'finishing' },
            'baseboard_install': { name: 'Установка плинтуса', unit: 'п.м.', price: 200, category: 'finishing' },
            'slope_finish': { name: 'Отделка откосов', unit: 'м²', price: 1200, category: 'finishing' }
        },

        // === Теплоизоляционные работы ===
        insulation_works: {
            'wall_insulation': { name: 'Утепление стен', unit: 'м²', price: 550, category: 'insulation' },
            'floor_insulation': { name: 'Утепление пола', unit: 'м²', price: 350, category: 'insulation' },
            'facade_insulation': { name: 'Утепление фасада (\"мокрый\")', unit: 'м²', price: 1500, category: 'insulation' },
            'vapor_barrier_install': { name: 'Устройство пароизоляции', unit: 'м²', price: 180, category: 'insulation' }
        },

        // === Оконно-дверные работы ===
        window_door: {
            'window_install': { name: 'Установка окна ПВХ', unit: 'шт', price: 5000, category: 'window_door' },
            'door_exterior_install': { name: 'Установка входной двери', unit: 'шт', price: 8000, category: 'window_door' },
            'door_interior_install': { name: 'Установка межкомнатной двери', unit: 'шт', price: 4000, category: 'window_door' },
            'lintel_concrete': { name: 'Устройство перемычки', unit: 'п.м.', price: 1800, category: 'window_door' }
        },

        // === Штукатурные работы (ЕНиР) ===
        plastering_works: {
            'plaster_walls_manual': { name: 'Штукатурка стен (ручная)', unit: 'м²', price: 1200, category: 'plastering', laborHours: 0.8 },
            'plaster_walls_machine': { name: 'Штукатурка стен (машинная)', unit: 'м²', price: 800, category: 'plastering', laborHours: 0.3 },
            'plaster_ceiling': { name: 'Штукатурка потолков', unit: 'м²', price: 1500, category: 'plastering', laborHours: 1.0 },
            'plaster_slopes': { name: 'Штукатурка откосов', unit: 'п.м.', price: 600, category: 'plastering', laborHours: 0.5 },
            'plaster_beacons': { name: 'Установка маяков', unit: 'м²', price: 150, category: 'plastering', laborHours: 0.15 },
            'plaster_mesh_install': { name: 'Армирование сеткой', unit: 'м²', price: 180, category: 'plastering', laborHours: 0.2 },
            'plaster_decorative': { name: 'Нанесение декор. штукатурки', unit: 'м²', price: 800, category: 'plastering', laborHours: 0.6 },
            'demolish_plaster': { name: 'Демонтаж старой штукатурки', unit: 'м²', price: 350, category: 'plastering', laborHours: 0.4 }
        },

        // === Малярные работы ===
        painting_works: {
            'putty_base': { name: 'Шпаклёвка базовая (стартовая)', unit: 'м²', price: 350, category: 'painting', laborHours: 0.3 },
            'putty_finish': { name: 'Шпаклёвка финишная', unit: 'м²', price: 400, category: 'painting', laborHours: 0.35 },
            'sanding': { name: 'Шлифовка поверхности', unit: 'м²', price: 150, category: 'painting', laborHours: 0.2 },
            'priming': { name: 'Грунтование (1 слой)', unit: 'м²', price: 80, category: 'painting', laborHours: 0.05 },
            'painting_2_coats': { name: 'Покраска в 2 слоя', unit: 'м²', price: 450, category: 'painting', laborHours: 0.25 },
            'painting_ceiling': { name: 'Покраска потолков в 2 слоя', unit: 'м²', price: 500, category: 'painting', laborHours: 0.3 },
            'wallpaper_paste': { name: 'Поклейка обоев', unit: 'м²', price: 400, category: 'painting', laborHours: 0.3 },
            'wallpaper_paste_complex': { name: 'Поклейка обоев (рисунок)', unit: 'м²', price: 550, category: 'painting', laborHours: 0.4 },
            'cornice_install': { name: 'Установка потолочного карниза', unit: 'п.м.', price: 250, category: 'painting', laborHours: 0.2 }
        },

        // === Плиточные работы ===
        tiling_works: {
            'tile_wall_lay': { name: 'Укладка плитки настенной', unit: 'м²', price: 1800, category: 'tiling', laborHours: 0.8 },
            'tile_floor_lay': { name: 'Укладка плитки напольной', unit: 'м²', price: 1500, category: 'tiling', laborHours: 0.6 },
            'tile_porcelain_lay': { name: 'Укладка керамогранита', unit: 'м²', price: 1800, category: 'tiling', laborHours: 0.7 },
            'tile_mosaic_lay': { name: 'Укладка мозаики', unit: 'м²', price: 3000, category: 'tiling', laborHours: 1.5 },
            'tile_diagonal_lay': { name: 'Укладка плитки по диагонали', unit: 'м²', price: 2200, category: 'tiling', laborHours: 1.0 },
            'tile_grouting': { name: 'Затирка швов', unit: 'м²', price: 200, category: 'tiling', laborHours: 0.15 },
            'tile_demolish': { name: 'Демонтаж старой плитки', unit: 'м²', price: 400, category: 'tiling', laborHours: 0.3 },
            'waterproof_bathroom': { name: 'Гидроизоляция санузла', unit: 'м²', price: 450, category: 'tiling', laborHours: 0.3 }
        },

        // === Электромонтажные работы ===
        electrical_works: {
            'strobing_wall': { name: 'Штробление стен', unit: 'п.м.', price: 350, category: 'electrical', laborHours: 0.3 },
            'strobing_ceiling': { name: 'Штробление потолков', unit: 'п.м.', price: 450, category: 'electrical', laborHours: 0.4 },
            'cable_lay_open': { name: 'Прокладка кабеля (открыто)', unit: 'п.м.', price: 80, category: 'electrical', laborHours: 0.05 },
            'cable_lay_hidden': { name: 'Прокладка кабеля (скрыто)', unit: 'п.м.', price: 180, category: 'electrical', laborHours: 0.15 },
            'outlet_install': { name: 'Установка розетки', unit: 'шт', price: 350, category: 'electrical', laborHours: 0.3 },
            'switch_install': { name: 'Установка выключателя', unit: 'шт', price: 300, category: 'electrical', laborHours: 0.25 },
            'panel_install': { name: 'Сборка и монтаж щитка', unit: 'шт', price: 5000, category: 'electrical', laborHours: 4.0 },
            'light_install': { name: 'Установка светильника', unit: 'шт', price: 500, category: 'electrical', laborHours: 0.5 },
            'spot_install': { name: 'Установка точечного LED', unit: 'шт', price: 350, category: 'electrical', laborHours: 0.3 },
            'chandelier_install': { name: 'Установка люстры', unit: 'шт', price: 800, category: 'electrical', laborHours: 0.8 },
            'grounding': { name: 'Устройство заземления', unit: 'шт', price: 3500, category: 'electrical', laborHours: 4.0 },
            'testing_electric': { name: 'Испытание электросети', unit: 'объект', price: 3000, category: 'electrical', laborHours: 2.0 }
        },

        // === Сантехнические работы ===
        plumbing_works: {
            'pipe_water_lay': { name: 'Прокладка водопровода PPR', unit: 'п.м.', price: 450, category: 'plumbing', laborHours: 0.3 },
            'pipe_sewer_lay': { name: 'Прокладка канализации', unit: 'п.м.', price: 400, category: 'plumbing', laborHours: 0.25 },
            'pipe_heating_lay': { name: 'Прокладка отопления', unit: 'п.м.', price: 550, category: 'plumbing', laborHours: 0.35 },
            'radiator_install': { name: 'Установка радиатора', unit: 'шт', price: 3500, category: 'plumbing', laborHours: 1.5 },
            'toilet_install': { name: 'Установка унитаза', unit: 'шт', price: 3000, category: 'plumbing', laborHours: 1.5 },
            'sink_install': { name: 'Установка раковины', unit: 'шт', price: 2000, category: 'plumbing', laborHours: 1.0 },
            'bathtub_install': { name: 'Установка ванны', unit: 'шт', price: 4500, category: 'plumbing', laborHours: 2.5 },
            'shower_install': { name: 'Установка душ. кабины', unit: 'шт', price: 5500, category: 'plumbing', laborHours: 3.0 },
            'mixer_install': { name: 'Установка смесителя', unit: 'шт', price: 1000, category: 'plumbing', laborHours: 0.5 },
            'heater_install': { name: 'Установка водонагревателя', unit: 'шт', price: 3500, category: 'plumbing', laborHours: 2.0 },
            'testing_plumbing': { name: 'Опрессовка системы', unit: 'объект', price: 2500, category: 'plumbing', laborHours: 1.5 }
        },

        // === Дверные работы ===
        door_works: {
            'door_inter_full': { name: 'Установка межкомн. двери (полная)', unit: 'шт', price: 5000, category: 'doors', laborHours: 2.5 },
            'door_inter_frame_only': { name: 'Установка дверной коробки', unit: 'шт', price: 2500, category: 'doors', laborHours: 1.5 },
            'door_casing_install': { name: 'Установка наличников', unit: 'комп.', price: 800, category: 'doors', laborHours: 0.5 },
            'door_handle_install': { name: 'Установка фурнитуры', unit: 'шт', price: 500, category: 'doors', laborHours: 0.3 },
            'door_demolish': { name: 'Демонтаж старой двери', unit: 'шт', price: 1000, category: 'doors', laborHours: 0.5 }
        },

        // === Потолочные работы ===
        ceiling_works: {
            'ceiling_gkl_1level': { name: 'Потолок ГКЛ 1 уровень', unit: 'м²', price: 1200, category: 'ceilings', laborHours: 0.8 },
            'ceiling_gkl_2level': { name: 'Потолок ГКЛ 2 уровня', unit: 'м²', price: 2200, category: 'ceilings', laborHours: 1.5 },
            'ceiling_armstrong': { name: 'Потолок Armstrong', unit: 'м²', price: 800, category: 'ceilings', laborHours: 0.4 },
            'ceiling_stretch_install': { name: 'Монтаж натяжного потолка', unit: 'м²', price: 600, category: 'ceilings', laborHours: 0.2 },
            'ceiling_stretch_2level': { name: 'Натяжной потолок 2-уровневый', unit: 'м²', price: 1200, category: 'ceilings', laborHours: 0.4 },
            'ceiling_painting_prep': { name: 'Подготовка потолка под покраску', unit: 'м²', price: 800, category: 'ceilings', laborHours: 0.6 },
            'ceiling_strip_install': { name: 'Монтаж реечного потолка', unit: 'м²', price: 900, category: 'ceilings', laborHours: 0.5 },
            'ceiling_demolish': { name: 'Демонтаж старого потолка', unit: 'м²', price: 300, category: 'ceilings', laborHours: 0.3 }
        },

        // === Вентиляция и кондиционирование ===
        hvac_works: {
            'duct_install': { name: 'Монтаж воздуховода', unit: 'п.м.', price: 450, category: 'hvac', laborHours: 0.5 },
            'fan_install': { name: 'Установка вентилятора', unit: 'шт', price: 800, category: 'hvac', laborHours: 0.5 },
            'grille_install': { name: 'Установка вент. решётки', unit: 'шт', price: 200, category: 'hvac', laborHours: 0.2 },
            'hood_install': { name: 'Монтаж кухонной вытяжки', unit: 'шт', price: 2500, category: 'hvac', laborHours: 1.5 },
            'ac_install_split': { name: 'Монтаж сплит-системы', unit: 'шт', price: 15000, category: 'hvac', laborHours: 6.0 },
            'recuperator_install': { name: 'Монтаж рекуператора', unit: 'шт', price: 5000, category: 'hvac', laborHours: 3.0 }
        },

        // === Отопительные работы ===
        heating_works: {
            'radiator_install_bimetal': { name: 'Монтаж радиатора биметалл.', unit: 'шт', price: 3500, category: 'heating', laborHours: 1.5 },
            'radiator_install_panel': { name: 'Монтаж панельного радиатора', unit: 'шт', price: 4000, category: 'heating', laborHours: 2.0 },
            'underfloor_heating_install': { name: 'Монтаж тёплого пола (водяной)', unit: 'м²', price: 650, category: 'heating', laborHours: 0.4 },
            'underfloor_electric_install': { name: 'Монтаж тёплого пола (электр.)', unit: 'м²', price: 500, category: 'heating', laborHours: 0.3 },
            'boiler_install': { name: 'Монтаж газового котла', unit: 'шт', price: 25000, category: 'heating', laborHours: 8.0 },
            'chimney_install': { name: 'Монтаж дымохода', unit: 'шт', price: 5000, category: 'heating', laborHours: 3.0 },
            'pipe_heating_lay_ppr': { name: 'Разводка отопления PPR', unit: 'п.м.', price: 550, category: 'heating', laborHours: 0.35 },
            'testing_heating': { name: 'Опрессовка отопления', unit: 'объект', price: 3000, category: 'heating', laborHours: 2.0 }
        },

        // === Фасадные работы ===
        facade_works: {
            'facade_insul_eps': { name: 'Утепление фасада EPS', unit: 'м²', price: 800, category: 'facade', laborHours: 0.5 },
            'facade_insul_minwool': { name: 'Утепление фасада минватой', unit: 'м²', price: 1000, category: 'facade', laborHours: 0.6 },
            'facade_plaster_work': { name: 'Нанесение фасадной штукатурки', unit: 'м²', price: 650, category: 'facade', laborHours: 0.5 },
            'facade_paint_work': { name: 'Покраска фасада', unit: 'м²', price: 350, category: 'facade', laborHours: 0.2 },
            'facade_siding_install': { name: 'Монтаж сайдинга', unit: 'м²', price: 550, category: 'facade', laborHours: 0.4 },
            'facade_ventilated': { name: 'Монтаж вентфасада', unit: 'м²', price: 1500, category: 'facade', laborHours: 0.8 },
            'facade_clinker': { name: 'Облицовка клинкерной плиткой', unit: 'м²', price: 2000, category: 'facade', laborHours: 1.0 },
            'facade_scaffold': { name: 'Установка/разборка лесов', unit: 'м²', price: 180, category: 'facade', laborHours: 0.15 }
        },

        // === Металлоконструкции работы ===
        metalwork: {
            'metal_welding': { name: 'Сварочные работы', unit: 'п.м.', price: 350, category: 'metalwork', laborHours: 0.3 },
            'metal_cutting': { name: 'Резка металла', unit: 'п.м.', price: 120, category: 'metalwork', laborHours: 0.1 },
            'metal_drilling': { name: 'Сверление отверстий в металле', unit: 'шт', price: 80, category: 'metalwork', laborHours: 0.1 },
            'metal_beam_install': { name: 'Монтаж балок/колонн', unit: 'т', price: 15000, category: 'metalwork', laborHours: 8.0 },
            'metal_stair_install': { name: 'Монтаж металл. лестницы', unit: 'шт', price: 15000, category: 'metalwork', laborHours: 8.0 },
            'metal_railing_install': { name: 'Монтаж перил/ограждений', unit: 'п.м.', price: 1200, category: 'metalwork', laborHours: 0.8 },
            'metal_primer_work': { name: 'Грунтовка металла', unit: 'м²', price: 150, category: 'metalwork', laborHours: 0.1 },
            'metal_paint_work': { name: 'Покраска металла', unit: 'м²', price: 250, category: 'metalwork', laborHours: 0.15 },
            'metal_anticorr': { name: 'Антикоррозийная обработка', unit: 'м²', price: 350, category: 'metalwork', laborHours: 0.2 }
        },

        // === Демонтажные работы ===
        demolition: {
            'demolish_wall_brick': { name: 'Демонтаж кирпичной стены', unit: 'м²', price: 800, category: 'demolition', laborHours: 0.8 },
            'demolish_wall_block': { name: 'Демонтаж стены из блоков', unit: 'м²', price: 600, category: 'demolition', laborHours: 0.6 },
            'demolish_wall_gkl': { name: 'Демонтаж стены ГКЛ', unit: 'м²', price: 250, category: 'demolition', laborHours: 0.2 },
            'demolish_floor_screed': { name: 'Демонтаж цем. стяжки', unit: 'м²', price: 450, category: 'demolition', laborHours: 0.5 },
            'demolish_floor_tile': { name: 'Демонтаж плитки на полу', unit: 'м²', price: 350, category: 'demolition', laborHours: 0.3 },
            'demolish_floor_parquet': { name: 'Демонтаж паркета/ламината', unit: 'м²', price: 150, category: 'demolition', laborHours: 0.1 },
            'demolish_ceiling': { name: 'Демонтаж подвесного потолка', unit: 'м²', price: 250, category: 'demolition', laborHours: 0.2 },
            'demolish_window': { name: 'Демонтаж окна', unit: 'шт', price: 1500, category: 'demolition', laborHours: 0.8 },
            'demolish_door_frame': { name: 'Демонтаж двери с коробкой', unit: 'шт', price: 1000, category: 'demolition', laborHours: 0.5 },
            'demolish_electrics': { name: 'Демонтаж электропроводки', unit: 'точка', price: 200, category: 'demolition', laborHours: 0.2 },
            'demolish_plumbing_old': { name: 'Демонтаж сантехники', unit: 'шт', price: 800, category: 'demolition', laborHours: 0.5 },
            'debris_removal': { name: 'Вынос мусора (мешки)', unit: 'мешок', price: 150, category: 'demolition', laborHours: 0.1 },
            'debris_container': { name: 'Контейнер для мусора 8м³', unit: 'шт', price: 15000, category: 'demolition' }
        },

        // === Полы расширенные ===
        flooring_extended_works: {
            'parquet_lay': { name: 'Укладка паркета', unit: 'м²', price: 1500, category: 'flooring_ext', laborHours: 1.0 },
            'parquet_board_lay': { name: 'Укладка паркетной доски', unit: 'м²', price: 600, category: 'flooring_ext', laborHours: 0.4 },
            'vinyl_lay': { name: 'Укладка винилового ламината', unit: 'м²', price: 500, category: 'flooring_ext', laborHours: 0.3 },
            'linoleum_lay': { name: 'Укладка линолеума', unit: 'м²', price: 300, category: 'flooring_ext', laborHours: 0.2 },
            'epoxy_floor_work': { name: 'Наливной эпоксидный пол', unit: 'м²', price: 1200, category: 'flooring_ext', laborHours: 0.5 },
            'floor_sanding': { name: 'Шлифовка бетонного пола', unit: 'м²', price: 350, category: 'flooring_ext', laborHours: 0.2 },
            'plinth_install_all': { name: 'Установка плинтуса', unit: 'п.м.', price: 200, category: 'flooring_ext', laborHours: 0.1 }
        },

        // === Ландшафт и благоустройство ===
        landscape_works: {
            'paving_lay': { name: 'Укладка тротуарной плитки', unit: 'м²', price: 800, category: 'landscape', laborHours: 0.5 },
            'border_install': { name: 'Установка бордюров', unit: 'п.м.', price: 250, category: 'landscape', laborHours: 0.2 },
            'fence_profsheet_install': { name: 'Монтаж забора профлист', unit: 'п.м.', price: 1200, category: 'landscape', laborHours: 0.8 },
            'fence_post_install': { name: 'Установка столбов забора', unit: 'шт', price: 1500, category: 'landscape', laborHours: 1.0 },
            'gate_install': { name: 'Установка ворот', unit: 'шт', price: 5000, category: 'landscape', laborHours: 4.0 },
            'lawn_seed_work': { name: 'Посев газона', unit: 'м²', price: 150, category: 'landscape', laborHours: 0.05 },
            'lawn_roll_work': { name: 'Укладка рулонного газона', unit: 'м²', price: 250, category: 'landscape', laborHours: 0.1 },
            'drainage_install': { name: 'Устройство дренажа', unit: 'п.м.', price: 1200, category: 'landscape', laborHours: 0.8 },
            'area_grading': { name: 'Планировка территории', unit: 'м²', price: 80, category: 'landscape', laborHours: 0.05 }
        },

        // === Противопожарные работы ===
        fire_safety_works: {
            'fire_alarm_install': { name: 'Монтаж пож. сигнализации', unit: 'точка', price: 1500, category: 'fire_safety', laborHours: 1.0 },
            'fire_cable_lay': { name: 'Прокладка огнестойкого кабеля', unit: 'п.м.', price: 120, category: 'fire_safety', laborHours: 0.1 },
            'fire_door_install': { name: 'Установка противопож. двери', unit: 'шт', price: 8000, category: 'fire_safety', laborHours: 4.0 },
            'fire_paint_work': { name: 'Огнезащитная обработка', unit: 'м²', price: 350, category: 'fire_safety', laborHours: 0.2 }
        },

        // === Слаботочные работы ===
        low_voltage_works: {
            'cable_utp_lay': { name: 'Прокладка UTP кабеля', unit: 'п.м.', price: 80, category: 'low_voltage', laborHours: 0.05 },
            'cable_tv_lay': { name: 'Прокладка ТВ кабеля', unit: 'п.м.', price: 60, category: 'low_voltage', laborHours: 0.05 },
            'outlet_rj45_install': { name: 'Установка интернет-розетки', unit: 'шт', price: 350, category: 'low_voltage', laborHours: 0.3 },
            'intercom_install': { name: 'Установка видеодомофона', unit: 'шт', price: 3000, category: 'low_voltage', laborHours: 2.0 },
            'camera_install': { name: 'Монтаж IP-камеры', unit: 'шт', price: 1500, category: 'low_voltage', laborHours: 1.0 },
            'nvr_install': { name: 'Настройка видеорегистратора', unit: 'шт', price: 2000, category: 'low_voltage', laborHours: 1.5 }
        },

        // === Работы по ГКЛ перегородкам ===
        drywall_works: {
            'partition_gkl_single': { name: 'Монтаж перегородки ГКЛ (1 слой)', unit: 'м²', price: 1200, category: 'drywall', laborHours: 0.8 },
            'partition_gkl_double': { name: 'Монтаж перегородки ГКЛ (2 слоя)', unit: 'м²', price: 1600, category: 'drywall', laborHours: 1.0 },
            'wall_obshivka_gkl': { name: 'Обшивка стен ГКЛ на каркас', unit: 'м²', price: 800, category: 'drywall', laborHours: 0.5 },
            'wall_gkl_bezkarkas': { name: 'Обшивка стен ГКЛ на клей', unit: 'м²', price: 600, category: 'drywall', laborHours: 0.4 },
            'ceiling_gkl_1level': { name: 'Потолок ГКЛ 1 уровень', unit: 'м²', price: 1200, category: 'drywall', laborHours: 0.8 },
            'ceiling_gkl_2level': { name: 'Потолок ГКЛ 2 уровня', unit: 'м²', price: 2000, category: 'drywall', laborHours: 1.2 },
            'arch_gkl': { name: 'Устройство арки из ГКЛ', unit: 'шт', price: 8000, category: 'drywall', laborHours: 6.0 },
            'niche_gkl': { name: 'Устройство ниши из ГКЛ', unit: 'шт', price: 5000, category: 'drywall', laborHours: 4.0 },
            'box_pipes_gkl': { name: 'Короб для труб из ГКЛ', unit: 'п.м.', price: 800, category: 'drywall', laborHours: 0.6 },
            'seam_gkl': { name: 'Заделка швов ГКЛ', unit: 'м²', price: 200, category: 'drywall', laborHours: 0.15 },
            'sound_insul_install': { name: 'Укладка звукоизоляции', unit: 'м²', price: 150, category: 'drywall', laborHours: 0.1 }
        },

        // === Лестничные работы ===
        staircase_works: {
            'stair_wood_install': { name: 'Монтаж деревянной лестницы', unit: 'шт', price: 35000, category: 'stairs', laborHours: 24.0 },
            'stair_concrete_cladding': { name: 'Облицовка бетонной лестницы', unit: 'ступ.', price: 2500, category: 'stairs', laborHours: 2.0 },
            'stair_step_install': { name: 'Установка ступеней', unit: 'шт', price: 1200, category: 'stairs', laborHours: 1.0 },
            'stair_railing_wood': { name: 'Монтаж перил деревянных', unit: 'п.м.', price: 1500, category: 'stairs', laborHours: 1.0 },
            'stair_railing_metal': { name: 'Монтаж перил металлических', unit: 'п.м.', price: 2000, category: 'stairs', laborHours: 1.2 },
            'stair_railing_glass': { name: 'Монтаж стеклянных ограждений', unit: 'п.м.', price: 4500, category: 'stairs', laborHours: 2.0 },
            'stair_polishing': { name: 'Шлифовка/лакировка ступеней', unit: 'ступ.', price: 800, category: 'stairs', laborHours: 0.5 }
        },

        // === Балконные работы ===
        balcony_works: {
            'balcony_glazing_cold': { name: 'Остекление (холодное)', unit: 'м²', price: 1500, category: 'balcony', laborHours: 1.0 },
            'balcony_glazing_warm': { name: 'Остекление (тёплое)', unit: 'м²', price: 2500, category: 'balcony', laborHours: 1.5 },
            'balcony_insulation': { name: 'Утепление балкона', unit: 'м²', price: 800, category: 'balcony', laborHours: 0.5 },
            'balcony_floor_lay': { name: 'Устройство пола на балконе', unit: 'м²', price: 600, category: 'balcony', laborHours: 0.4 },
            'balcony_walls_panel': { name: 'Обшивка стен ПВХ панелями', unit: 'м²', price: 500, category: 'balcony', laborHours: 0.3 },
            'balcony_walls_vagonka': { name: 'Обшивка стен вагонкой', unit: 'м²', price: 700, category: 'balcony', laborHours: 0.5 },
            'balcony_ceiling_panel': { name: 'Обшивка потолка балкона', unit: 'м²', price: 500, category: 'balcony', laborHours: 0.3 },
            'balcony_sill_install': { name: 'Установка подоконника-балк.', unit: 'п.м.', price: 600, category: 'balcony', laborHours: 0.3 },
            'balcony_elec_heating': { name: 'Монтаж эл. тёплого пола', unit: 'м²', price: 800, category: 'balcony', laborHours: 0.5 }
        },

        // === Газовые работы ===
        gas_works: {
            'gas_pipe_install': { name: 'Прокладка газовой трубы', unit: 'п.м.', price: 500, category: 'gas', laborHours: 0.5 },
            'gas_valve_install': { name: 'Установка газового крана', unit: 'шт', price: 800, category: 'gas', laborHours: 0.5 },
            'gas_meter_install': { name: 'Установка газового счётчика', unit: 'шт', price: 2000, category: 'gas', laborHours: 1.0 },
            'gas_stove_connect': { name: 'Подключение газовой плиты', unit: 'шт', price: 3000, category: 'gas', laborHours: 1.5 },
            'gas_boiler_connect': { name: 'Подключение газового котла', unit: 'шт', price: 8000, category: 'gas', laborHours: 4.0 },
            'gas_leak_test': { name: 'Проверка на утечки (опрессовка)', unit: 'усл.', price: 5000, category: 'gas', laborHours: 2.0 },
            'gas_chimney_install': { name: 'Монтаж дымохода газового', unit: 'п.м.', price: 2500, category: 'gas', laborHours: 1.5 }
        },

        // === Водосточные работы ===
        drainage_works: {
            'gutter_install': { name: 'Монтаж желобов водостока', unit: 'п.м.', price: 450, category: 'drainage', laborHours: 0.3 },
            'downpipe_install': { name: 'Монтаж водосточной трубы', unit: 'п.м.', price: 350, category: 'drainage', laborHours: 0.3 },
            'drain_pipe_lay': { name: 'Укладка дренажной трубы', unit: 'п.м.', price: 800, category: 'drainage', laborHours: 0.5 },
            'rain_tray_install': { name: 'Монтаж ливневых лотков', unit: 'п.м.', price: 600, category: 'drainage', laborHours: 0.4 },
            'rain_well_install': { name: 'Установка дождеприёмников', unit: 'шт', price: 2500, category: 'drainage', laborHours: 1.5 },
            'septik_install': { name: 'Установка септика', unit: 'шт', price: 25000, category: 'drainage', laborHours: 12.0 }
        },

        // === Кухонные работы ===
        kitchen_works: {
            'kitchen_assembly': { name: 'Сборка кухонного гарнитура', unit: 'п.м.', price: 3000, category: 'kitchen', laborHours: 2.0 },
            'countertop_install': { name: 'Установка столешницы', unit: 'п.м.', price: 1500, category: 'kitchen', laborHours: 1.0 },
            'sink_install': { name: 'Установка мойки кухонной', unit: 'шт', price: 1500, category: 'kitchen', laborHours: 1.0 },
            'appliance_builtin': { name: 'Встройка бытовой техники', unit: 'шт', price: 2000, category: 'kitchen', laborHours: 1.0 },
            'tile_backsplash': { name: 'Укладка фартука из плитки', unit: 'м²', price: 2000, category: 'kitchen', laborHours: 1.5 },
            'backsplash_glass': { name: 'Монтаж стеклянного фартука', unit: 'м²', price: 2500, category: 'kitchen', laborHours: 1.0 }
        },

        // === Деревянные конструкции ===
        woodwork: {
            'wood_frame_wall': { name: 'Монтаж каркасной стены', unit: 'м²', price: 800, category: 'woodwork', laborHours: 0.5 },
            'wood_beam_install': { name: 'Монтаж деревянных балок', unit: 'п.м.', price: 450, category: 'woodwork', laborHours: 0.4 },
            'wood_floor_install': { name: 'Укладка деревянного пола', unit: 'м²', price: 650, category: 'woodwork', laborHours: 0.5 },
            'vagonka_install': { name: 'Обшивка вагонкой', unit: 'м²', price: 500, category: 'woodwork', laborHours: 0.4 },
            'block_house_install': { name: 'Монтаж блок-хауса', unit: 'м²', price: 600, category: 'woodwork', laborHours: 0.5 },
            'deck_install': { name: 'Укладка террасной доски', unit: 'м²', price: 700, category: 'woodwork', laborHours: 0.5 },
            'osb_install': { name: 'Обшивка ОСП', unit: 'м²', price: 350, category: 'woodwork', laborHours: 0.2 },
            'plywood_install': { name: 'Укладка фанеры', unit: 'м²', price: 300, category: 'woodwork', laborHours: 0.2 },
            'wood_antiseptic': { name: 'Обработка антисептиком', unit: 'м²', price: 120, category: 'woodwork', laborHours: 0.1 },
            'wood_lacquer': { name: 'Лакировка древесины', unit: 'м²', price: 200, category: 'woodwork', laborHours: 0.15 },
            'wood_paint': { name: 'Покраска дерева', unit: 'м²', price: 180, category: 'woodwork', laborHours: 0.1 },
            'wood_carving': { name: 'Врезка замка/петель', unit: 'шт', price: 600, category: 'woodwork', laborHours: 0.5 }
        },

        // === Стеклянные и зеркальные работы ===
        glass_works: {
            'mirror_install': { name: 'Установка зеркала на клей', unit: 'м²', price: 800, category: 'glass', laborHours: 0.5 },
            'mirror_custom': { name: 'Монтаж зеркала нестандартного', unit: 'м²', price: 1200, category: 'glass', laborHours: 0.8 },
            'glass_partition': { name: 'Монтаж стеклянной перегородки', unit: 'м²', price: 3500, category: 'glass', laborHours: 2.0 },
            'glass_door_install': { name: 'Установка стеклянной двери', unit: 'шт', price: 5000, category: 'glass', laborHours: 3.0 },
            'shower_glass_install': { name: 'Монтаж душевого стекла', unit: 'шт', price: 8000, category: 'glass', laborHours: 4.0 },
            'glass_block_lay': { name: 'Кладка стеклоблоков', unit: 'м²', price: 2500, category: 'glass', laborHours: 1.5 }
        },

        // === Декоративные работы ===
        decorative_works: {
            'decor_stone_lay': { name: 'Укладка декоративного камня', unit: 'м²', price: 1500, category: 'decorative', laborHours: 1.0 },
            'decor_brick_lay': { name: 'Укладка декорат. кирпича', unit: 'м²', price: 1200, category: 'decorative', laborHours: 0.8 },
            'panel_3d_install': { name: 'Монтаж 3D-панелей', unit: 'м²', price: 800, category: 'decorative', laborHours: 0.5 },
            'panel_mdf_install': { name: 'Монтаж панелей МДФ', unit: 'м²', price: 600, category: 'decorative', laborHours: 0.4 },
            'panel_soft_install': { name: 'Монтаж мягких панелей', unit: 'м²', price: 1200, category: 'decorative', laborHours: 0.8 },
            'corniche_install': { name: 'Монтаж потолочного карниза', unit: 'п.м.', price: 350, category: 'decorative', laborHours: 0.3 },
            'molding_install': { name: 'Монтаж молдингов', unit: 'п.м.', price: 250, category: 'decorative', laborHours: 0.2 },
            'stucco_install': { name: 'Монтаж лепнины', unit: 'п.м.', price: 500, category: 'decorative', laborHours: 0.4 },
            'wallpaper_liquid': { name: 'Нанесение жидких обоев', unit: 'м²', price: 600, category: 'decorative', laborHours: 0.4 },
            'wallpaper_textile': { name: 'Поклейка текстильных обоев', unit: 'м²', price: 800, category: 'decorative', laborHours: 0.6 }
        },

        // === Электрический тёплый пол ===
        electric_heating_works: {
            'heating_mat_install': { name: 'Укладка нагревательного мата', unit: 'м²', price: 600, category: 'electric_heating', laborHours: 0.3 },
            'heating_cable_install': { name: 'Укладка нагреват. кабеля', unit: 'м²', price: 800, category: 'electric_heating', laborHours: 0.5 },
            'heating_film_install': { name: 'Укладка ИК плёнки', unit: 'м²', price: 500, category: 'electric_heating', laborHours: 0.3 },
            'thermostat_install': { name: 'Установка терморегулятора', unit: 'шт', price: 1200, category: 'electric_heating', laborHours: 0.8 },
            'self_reg_cable_install': { name: 'Монтаж саморег. кабеля на трубы', unit: 'п.м.', price: 250, category: 'electric_heating', laborHours: 0.2 }
        },

        // === Уборка и подготовка ===
        cleaning_works: {
            'rough_cleaning': { name: 'Уборка строительная (грубая)', unit: 'м²', price: 80, category: 'cleaning', laborHours: 0.05 },
            'fine_cleaning': { name: 'Уборка чистовая', unit: 'м²', price: 150, category: 'cleaning', laborHours: 0.1 },
            'window_cleaning': { name: 'Мойка окон после ремонта', unit: 'шт', price: 500, category: 'cleaning', laborHours: 0.3 },
            'floor_polishing': { name: 'Полировка полов', unit: 'м²', price: 250, category: 'cleaning', laborHours: 0.15 },
            'surface_prep': { name: 'Подготовка поверхности', unit: 'м²', price: 120, category: 'cleaning', laborHours: 0.1 },
            'priming_work': { name: 'Грунтовка поверхности', unit: 'м²', price: 80, category: 'cleaning', laborHours: 0.05 }
        },

        // === Геодезические и проектные работы ===
        geodetic_works: {
            'geodetic_survey': { name: 'Геодезическая съёмка', unit: 'усл.', price: 25000, category: 'geodetic', laborHours: 8.0 },
            'layout_axes': { name: 'Разбивка осей здания', unit: 'усл.', price: 15000, category: 'geodetic', laborHours: 4.0 },
            'level_check': { name: 'Нивелировка (проверка уровней)', unit: 'усл.', price: 5000, category: 'geodetic', laborHours: 2.0 },
            'executive_survey': { name: 'Исполнительная съёмка', unit: 'усл.', price: 20000, category: 'geodetic', laborHours: 8.0 }
        },

        // === Временные и подготовительные работы ===
        temp_works: {
            'temp_power_setup': { name: 'Организация временного электроснабж.', unit: 'усл.', price: 15000, category: 'temp', laborHours: 8.0 },
            'temp_water_setup': { name: 'Организация временного водоснабж.', unit: 'усл.', price: 12000, category: 'temp', laborHours: 6.0 },
            'site_prep': { name: 'Подготовка строительной площадки', unit: 'м²', price: 100, category: 'temp', laborHours: 0.05 },
            'scaffold_erect': { name: 'Установка строительных лесов', unit: 'м²', price: 100, category: 'temp', laborHours: 0.1 },
            'scaffold_dismantle': { name: 'Демонтаж строительных лесов', unit: 'м²', price: 60, category: 'temp', laborHours: 0.05 },
            'temp_fence_install': { name: 'Установка ограждения стройплощадки', unit: 'п.м.', price: 250, category: 'temp', laborHours: 0.2 },
            'debris_chute': { name: 'Монтаж мусороспуска', unit: 'шт', price: 5000, category: 'temp', laborHours: 3.0 }
        },

        // === Специальные работы ===
        special_works: {
            'concrete_pumping': { name: 'Подача бетона бетононасосом', unit: 'м³', price: 2500, category: 'special', laborHours: 0.1 },
            'concrete_cutting': { name: 'Резка бетона (алмазная)', unit: 'п.м.', price: 800, category: 'special', laborHours: 0.5 },
            'diamond_drilling': { name: 'Алмазное бурение (Ø до 150)', unit: 'шт', price: 2500, category: 'special', laborHours: 1.0 },
            'diamond_drilling_large': { name: 'Алмазное бурение (Ø 150-250)', unit: 'шт', price: 5000, category: 'special', laborHours: 2.0 },
            'hydrodemolition': { name: 'Гидродемонтаж бетона', unit: 'м²', price: 1500, category: 'special', laborHours: 0.5 },
            'shotcrete': { name: 'Торкретирование', unit: 'м²', price: 2000, category: 'special', laborHours: 0.3 },
            'injection_waterproof': { name: 'Инъекционная гидроизоляция', unit: 'п.м.', price: 3000, category: 'special', laborHours: 1.0 },
            'underpinning': { name: 'Усиление фундамента', unit: 'п.м.', price: 8000, category: 'special', laborHours: 4.0 },
            'concrete_polishing': { name: 'Полировка бетонного пола', unit: 'м²', price: 600, category: 'special', laborHours: 0.3 },
            'soil_stabilization': { name: 'Стабилизация грунта', unit: 'м²', price: 500, category: 'special', laborHours: 0.2 }
        }
    };

    // ========== РЕГИОНАЛЬНЫЕ КОЭФФИЦИЕНТЫ ==========
    const REGIONAL_COEFFICIENTS = {
        'Алматы': 1.0,
        'Астана': 1.15,
        'Шымкент': 0.95,
        'Караганда': 1.05,
        'Актобе': 1.10,
        'Тараз': 0.90,
        'Павлодар': 1.08,
        'Усть-Каменогорск': 1.12,
        'Семей': 1.0,
        'Костанай': 1.05,
        'Атырау': 1.25,
        'default': 1.0
    };

    // ========== СЕЗОННЫЕ КОЭФФИЦИЕНТЫ ==========
    function getSeasonCoefficient() {
        const month = new Date().getMonth() + 1;
        if (month >= 11 || month <= 3) {
            return 1.15; // Зима — дороже
        } else if (month >= 6 && month <= 8) {
            return 1.05; // Лето — небольшая наценка (высокий сезон)
        }
        return 1.0;
    }

    // ========== API ==========
    const AIPriceDatabase = {
        // Получить цену материала
        getMaterialPrice(code, region = 'default') {
            for (const category of Object.values(MATERIALS)) {
                if (category[code]) {
                    const item = category[code];
                    const regionCoef = REGIONAL_COEFFICIENTS[region] || 1.0;
                    const seasonCoef = getSeasonCoefficient();
                    return {
                        ...item,
                        basePrice: item.price,
                        adjustedPrice: Math.round(item.price * regionCoef * seasonCoef),
                        regionCoefficient: regionCoef,
                        seasonCoefficient: seasonCoef
                    };
                }
            }
            return null;
        },

        // Получить цену работы
        getWorkPrice(code, region = 'default') {
            for (const category of Object.values(WORKS)) {
                if (category[code]) {
                    const item = category[code];
                    const regionCoef = REGIONAL_COEFFICIENTS[region] || 1.0;
                    return {
                        ...item,
                        basePrice: item.price,
                        adjustedPrice: Math.round(item.price * regionCoef),
                        regionCoefficient: regionCoef
                    };
                }
            }
            return null;
        },

        // Получить все материалы по категории
        getMaterialsByCategory(category) {
            return MATERIALS[category] || {};
        },

        // Получить все работы по категории
        getWorksByCategory(category) {
            return WORKS[category] || {};
        },

        // Расчёт сметы с таблицей цен
        calculateEstimate(items, region = 'Алматы') {
            const result = {
                materials: [],
                works: [],
                totals: { materials: 0, works: 0, total: 0 },
                region,
                priceVersion: PRICE_VERSION,
                calculatedAt: new Date().toISOString()
            };

            items.forEach(item => {
                if (item.type === 'material') {
                    const priceData = this.getMaterialPrice(item.code, region);
                    if (priceData) {
                        const sum = item.quantity * priceData.adjustedPrice;
                        result.materials.push({
                            code: item.code,
                            name: priceData.name,
                            quantity: item.quantity,
                            unit: priceData.unit,
                            unitPrice: priceData.adjustedPrice,
                            sum: sum
                        });
                        result.totals.materials += sum;
                    }
                } else if (item.type === 'work') {
                    const priceData = this.getWorkPrice(item.code, region);
                    if (priceData) {
                        const sum = item.quantity * priceData.adjustedPrice;
                        result.works.push({
                            code: item.code,
                            name: priceData.name,
                            quantity: item.quantity,
                            unit: priceData.unit,
                            unitPrice: priceData.adjustedPrice,
                            sum: sum
                        });
                        result.totals.works += sum;
                    }
                }
            });

            result.totals.total = result.totals.materials + result.totals.works;
            return result;
        },

        // Поиск материала по названию
        searchMaterial(query) {
            const results = [];
            const queryLower = query.toLowerCase();

            for (const [categoryName, category] of Object.entries(MATERIALS)) {
                for (const [code, item] of Object.entries(category)) {
                    if (item.name.toLowerCase().includes(queryLower)) {
                        results.push({ code, ...item, category: categoryName });
                    }
                }
            }
            return results;
        },

        // Поиск работы по названию
        searchWork(query) {
            const results = [];
            const queryLower = query.toLowerCase();

            for (const [categoryName, category] of Object.entries(WORKS)) {
                for (const [code, item] of Object.entries(category)) {
                    if (item.name.toLowerCase().includes(queryLower)) {
                        results.push({ code, ...item, category: categoryName });
                    }
                }
            }
            return results;
        },

        // Получить все категории
        getCategories() {
            return {
                materials: Object.keys(MATERIALS),
                works: Object.keys(WORKS)
            };
        },

        // Информация о прайсе
        getPriceInfo() {
            return {
                version: PRICE_VERSION,
                updateDate: PRICE_UPDATE_DATE,
                region: PRICE_REGION,
                materialCategories: Object.keys(MATERIALS).length,
                workCategories: Object.keys(WORKS).length,
                totalMaterials: Object.values(MATERIALS).reduce((acc, cat) => acc + Object.keys(cat).length, 0),
                totalWorks: Object.values(WORKS).reduce((acc, cat) => acc + Object.keys(cat).length, 0)
            };
        },

        // Экспорт данных
        MATERIALS,
        WORKS,
        REGIONAL_COEFFICIENTS
    };

    // ========== EXPORT ==========
    window.AIPriceDatabase = AIPriceDatabase;
    console.log(`✅ AI Price Database v${PRICE_VERSION} loaded (${AIPriceDatabase.getPriceInfo().totalMaterials} materials, ${AIPriceDatabase.getPriceInfo().totalWorks} works)`);

})();
