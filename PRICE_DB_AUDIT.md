# Аудит прайс-базы QazGost

Дата: 04.11.2026. Файл: `ai-service/app/data/price_db.json`. Скрипт: `python3 tools/pricedb/calibrate.py` (повторный запуск безопасен).

## Итог

- Позиций всего: 23864
- Сверка с опорными ценами **до**: 412/1814 в коридоре (23%), занижено 1383, завышено 19
- Сверка с опорными ценами **после**: 1458/1814 в коридоре (80%), занижено 270, завышено 86
- Источников с поправочным множителем: 65, позиций пересчитано: 5045
- Позиций под вопросом (`qa: "suspect"`, скрываются из маркетплейса): 356
- Нормализовано единиц: 433

Исходная цена каждой пересчитанной позиции сохранена в `priceRaw`, множитель — в `priceFactor`.

## Поправки по источникам

| Раздел | Источник | Множитель | Основание |
|---|---|---|---|
| works | `ai_wrk_painting_full` | ×50 | опорные цены: n=15, медиана ×55.0, согласованность 100% |
| works | `ai_wrk_plastering_full` | ×50 | опорные цены: n=18, медиана ×73.2, согласованность 100% |
| works | `ai_wrk_plaster_paint_full` | ×30 | опорные цены: n=20, медиана ×27.5, согласованность 100% |
| materials | `ai_mat_lighting_catalog` | ×20 | совпадения с выверенными источниками: n=6, медиана ×17.8, согласованность 100% |
| works | `ai_wrk_concrete_ext` | ×20 | опорные цены: n=7, медиана ×20.8, согласованность 100% |
| works | `ai_wrk_paint_ext` | ×20 | опорные цены: n=12, медиана ×20.2, согласованность 100% |
| works | `ai_wrk_screed_leveling` | ×20 | опорные цены: n=17, медиана ×20.8, согласованность 100% |
| materials | `ai_mat_cabletray_catalog` | ×15 | совпадения с выверенными источниками: n=16, медиана ×16.0, согласованность 100% |
| materials | `ai_mat_electric_catalog` | ×15 | опорные цены: n=36, медиана ×15.0, согласованность 94% |
| materials | `ai_mat_facade_catalog` | ×15 | опорные цены: n=8, медиана ×17.0, согласованность 100% |
| materials | `ai_mat_jbi_blocks_catalog` | ×15 | опорные цены: n=7, медиана ×17.0, согласованность 100% |
| materials | `ai_mat_brick_full_catalog` | ×12 | опорные цены: n=82, медиана ×11.7, согласованность 93% |
| materials | `ai_mat_brickext_catalog` | ×12 | опорные цены: n=12, медиана ×12.7, согласованность 100% |
| materials | `ai_mat_cable_catalog` | ×12 | опорные цены: n=30, медиана ×11.1, согласованность 100% |
| materials | `ai_mat_fasteners_catalog` | ×12 | опорные цены: n=32, медиана ×11.4, согласованность 100% |
| materials | `ai_mat_jbi_catalog` | ×12 | опорные цены: n=6, медиана ×11.8, согласованность 100% |
| materials | `ai_mat_jbi_special_catalog` | ×12 | опорные цены: n=7, медиана ×11.0, согласованность 100% |
| materials | `ai_mat_metiz_catalog` | ×12 | опорные цены: n=15, медиана ×12.5, согласованность 87% |
| works | `ai_wrk_masonry_full` | ×12 | опорные цены: n=6, медиана ×13.3, согласованность 100% |
| works | `ai_wrk_painting` | ×12 | опорные цены: n=19, медиана ×12.9, согласованность 100% |
| materials | `ai_mat_ceramictile_catalog` | ×10 | опорные цены: n=24, медиана ×10.0, согласованность 100% |
| materials | `ai_mat_electroinstall_catalog` | ×10 | опорные цены: n=23, медиана ×10.0, согласованность 96% |
| materials | `ai_mat_fencing_catalog` | ×10 | опорные цены: n=7, медиана ×10.0, согласованность 100% |
| materials | `ai_mat_fixings_catalog` | ×10 | опорные цены: n=21, медиана ×10.0, согласованность 100% |
| materials | `ai_mat_paving_catalog` | ×10 | опорные цены: n=17, медиана ×10.0, согласованность 100% |
| works | `ai_wrk_earthwork` | ×10 | опорные цены: n=9, медиана ×9.0, согласованность 100% |
| materials | `ai_mat_blocks_catalog` | ×8 | опорные цены: n=19, медиана ×7.1, согласованность 100% |
| materials | `ai_mat_brick_catalog` | ×8 | опорные цены: n=73, медиана ×8.2, согласованность 99% |
| materials | `ai_mat_drywall_catalog` | ×8 | опорные цены: n=47, медиана ×7.0, согласованность 98% |
| materials | `ai_mat_insulation_catalog` | ×8 | опорные цены: n=12, медиана ×7.5, согласованность 100% |
| materials | `ai_mat_rebar_catalog` | ×8 | опорные цены: n=17, медиана ×7.9, согласованность 88% |
| works | `ai_work_electrical_catalog` | ×8 | опорные цены: n=9, медиана ×7.5, согласованность 100% |
| works | `ai_work_plaster_paint_catalog` | ×8 | опорные цены: n=18, медиана ×7.1, согласованность 100% |
| works | `ai_work_plumbing_catalog` | ×8 | совпадения с выверенными источниками: n=6, медиана ×7.3, согласованность 100% |
| works | `ai_wrk_electrical` | ×8 | опорные цены: n=19, медиана ×7.5, согласованность 100% |
| works | `ai_wrk_flooring` | ×8 | опорные цены: n=16, медиана ×7.7, согласованность 100% |
| materials | `ai_mat_bulkmaterials_catalog` | ×6 | опорные цены: n=16, медиана ×5.9, согласованность 100% |
| materials | `ai_mat_drymix_catalog` | ×6 | опорные цены: n=45, медиана ×6.6, согласованность 100% |
| materials | `ai_mat_fasteners` | ×6 | опорные цены: n=19, медиана ×5.7, согласованность 89% |
| materials | `ai_mat_fence_catalog` | ×6 | опорные цены: n=5, медиана ×6.4, согласованность 100% |
| materials | `ai_mat_floor_catalog` | ×6 | опорные цены: n=21, медиана ×6.4, согласованность 100% |
| materials | `ai_mat_mixes_catalog` | ×6 | опорные цены: n=6, медиана ×5.6, согласованность 100% |
| materials | `ai_mat_tile_catalog` | ×6 | опорные цены: n=90, медиана ×6.4, согласованность 98% |
| works | `ai_work_concrete_catalog` | ×6 | опорные цены: n=7, медиана ×6.2, согласованность 100% |
| works | `ai_work_tiling_floor_catalog` | ×6 | опорные цены: n=19, медиана ×6.9, согласованность 100% |
| works | `ai_wrk_concrete` | ×6 | опорные цены: n=9, медиана ×5.6, согласованность 100% |
| works | `ai_wrk_plaster` | ×6 | опорные цены: n=30, медиана ×6.6, согласованность 100% |
| works | `ai_wrk_tiling` | ×6 | опорные цены: n=43, медиана ×6.9, согласованность 100% |
| materials | `ai_mat_elec_panels` | ×5 | опорные цены: n=5, медиана ×4.9, согласованность 100% |
| materials | `ai_mat_electrical` | ×5 | опорные цены: n=29, медиана ×4.9, согласованность 93% |
| materials | `ai_mat_floorcover_catalog` | ×5 | опорные цены: n=6, медиана ×5.1, согласованность 100% |
| materials | `ai_mat_metal_ext` | ×5 | опорные цены: n=18, медиана ×4.7, согласованность 100% |
| works | `ai_work_masonry_catalog` | ×5 | опорные цены: n=16, медиана ×5.1, согласованность 100% |
| works | `ai_wrk_masonry` | ×5 | опорные цены: n=51, медиана ×5.4, согласованность 100% |
| materials | `ai_mat_lumber_catalog` | ×4 | совпадения с выверенными источниками: n=7, медиана ×4.1, согласованность 100% |
| works | `ai_wrk_finishing_ext` | ×4 | опорные цены: n=20, медиана ×3.8, согласованность 100% |
| works | `ai_wrk_finishing_full` | ×4 | опорные цены: n=19, медиана ×3.7, согласованность 100% |
| works | `ai_wrk_tiling_floor_ext` | ×4 | опорные цены: n=21, медиана ×4.0, согласованность 100% |
| works | `aipricedatabase` | ×4 | опорные цены: n=35, медиана ×3.6, согласованность 94% |
| materials | `ai_mat_landscape` | ×3 | опорные цены: n=11, медиана ×3.4, согласованность 91% |
| materials | `ai_mat_timber_catalog` | ×3 | совпадения с выверенными источниками: n=9, медиана ×3.4, согласованность 100% |
| works | `ai_wrk_indfloor` | ×3 | опорные цены: n=10, медиана ×2.8, согласованность 80% |
| materials | `ai_mat_road` | ×2.5 | опорные цены: n=10, медиана ×2.7, согласованность 90% |
| works | `ai_wrk_electrical_ext2` | ×2.5 | опорные цены: n=6, медиана ×2.7, согласованность 83% |
| works | `ai_wrk_monolith_full` | ×2.5 | опорные цены: n=6, медиана ×2.7, согласованность 100% |

## Нормализация единиц

- п.м. → м.п.: 226
- упак. → уп.: 82
- комплект → компл.: 49
- комп. → компл.: 45
- тонна → т: 24
- мес → месяц: 7

## Позиции под вопросом (356)

Цена вне коридора опорной (×2.5 в обе стороны) и источник целиком не выправлен. Нужна ручная проверка по прайсу поставщика.

| Раздел | Код | Наименование | Ед. | Цена | Опорная | Источник |
|---|---|---|---|---|---|---|
| materials | brick_hand_formed | Кирпич ручной формовки | шт | 360.0 | 80 | ai_mat_brick_catalog |
| materials | brick_fire_sha44 | Кирпич шамотный ША-44 (клиновой) | шт | 280.0 | 80 | ai_mat_brick_catalog |
| materials | brick_fireclay_sha22 | Кирпич шамотный ША-22 (клин трапец.) | шт | 540.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha23 | Кирпич шамотный ША-23 (клин) | шт | 540.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha44 | Кирпич шамотный ША-44 (клин ребровой) | шт | 600.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha45 | Кирпич шамотный ША-45 (клин ребровой) | шт | 600.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha5 | Кирпич шамотный ША-5 (230×114×65) | шт | 300.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha6 | Кирпич шамотный ША-6 (230×114×40) | шт | 360.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha8 | Кирпич шамотный ША-8 (250×124×65) | шт | 480.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha94 | Кирпич шамотный ША-94 (радиальный) | шт | 720.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_sha96 | Кирпич шамотный ША-96 (радиальный) | шт | 720.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_shb5 | Кирпич шамотный ШБ-5 (230×114×65) | шт | 240.0 | 80 | ai_mat_brick_full_catalog |
| materials | brick_fireclay_shb8 | Кирпич шамотный ШБ-8 (250×124×65) | шт | 360.0 | 80 | ai_mat_brick_full_catalog |
| materials | switch_sensor_white | Выключатель сенсорный белый | шт | 7200.0 | 1500 | ai_mat_cable_catalog |
| materials | socket_hdmi_flush | Розетка HDMI (встраиваемая) | шт | 4200.0 | 1500 | ai_mat_cable_catalog |
| materials | socket_usb_c_c | Розетка с USB (2× Type-C) | шт | 6000.0 | 1500 | ai_mat_cable_catalog |
| materials | socket_usb_a_c | Розетка с USB (Type-A + Type-C) | шт | 4800.0 | 1500 | ai_mat_cable_catalog |
| materials | ceiling_rosette_500mm | Розетка потолочная Ø500мм | шт | 300.0 | 1500 | ai_mat_ceilings_catalog |
| materials | porcelain_120x120_large | Керамогранит 120×120см крупноформат | м² | 20000.0 | 7000 | ai_mat_ceramictile_catalog |
| materials | porcelain_tech_30x30 | Керамогранит технический 30×30см | м² | 2500.0 | 7000 | ai_mat_ceramictile_catalog |
| materials | putty_ready_paste_11 | Шпатлёвка готовая паста (11кг) | шт | 4200.0 | 1430 | ai_mat_drymix_catalog |
| materials | putty_ready_paste_15 | Шпатлёвка готовая паста (15кг) | шт | 5400.0 | 1950 | ai_mat_drymix_catalog |
| materials | putty_ready_paste_28 | Шпатлёвка готовая паста (28кг) | шт | 9600.0 | 3640 | ai_mat_drymix_catalog |
| materials | putty_ready_paste_5 | Шпатлёвка готовая паста (5кг) | шт | 2100.0 | 650 | ai_mat_drymix_catalog |
| materials | screw_gkl_25 | Саморез ГКЛ-металл 3.5×25мм | шт | 0.8 | 4 | ai_mat_drywall |
| materials | screw_gkl_35 | Саморез ГКЛ-металл 3.5×35мм | шт | 1.0 | 4 | ai_mat_drywall |
| materials | screw_gkl_45 | Саморез ГКЛ-металл 3.5×45мм | шт | 1.2 | 4 | ai_mat_drywall |
| materials | screw_gkl_55 | Саморез ГКЛ-металл 3.5×55мм | шт | 1.5 | 4 | ai_mat_drywall |
| materials | screw_metal_metal | Саморез металл-металл 3.5×9.5 (клоп) | шт | 0.5 | 4 | ai_mat_drywall |
| materials | dubel_gkl_molly_10 | Дюбель ГКЛ «Молли» (10шт) | уп. | 800.0 | 150 | ai_mat_drywall_catalog |
| materials | dubel_gkl_butterfly_10 | Дюбель ГКЛ «бабочка» (10шт) | уп. | 400.0 | 150 | ai_mat_drywall_catalog |
| materials | dubel_6x40_100 | Дюбель полипроп. 6×40мм (100шт) | уп. | 240.0 | 1500 | ai_mat_drywall_catalog |
| materials | dubel_6x60_100 | Дюбель полипроп. 6×60мм (100шт) | уп. | 320.0 | 1500 | ai_mat_drywall_catalog |
| materials | dubel_8x40_100 | Дюбель полипроп. 8×40мм (100шт) | уп. | 320.0 | 1500 | ai_mat_drywall_catalog |
| materials | dubel_8x60_100 | Дюбель полипроп. 8×60мм (100шт) | уп. | 400.0 | 1500 | ai_mat_drywall_catalog |
| materials | screw_profil_klop_1000 | Саморез «клоп» 3.5×11 (1000шт) | уп. | 1200.0 | 4000 | ai_mat_drywall_catalog |
| materials | screw_profil_drill_1000 | Саморез «клоп» со сверлом (1000шт) | уп. | 1440.0 | 4000 | ai_mat_drywall_catalog |
| materials | mcb_3p_50a_c | Автомат 3P 50А кривая C | шт | 7500.0 | 2200 | ai_mat_electric_catalog |
| materials | switch_touch_1 | Выключатель сенсорный 1-канальный | шт | 15000.0 | 1500 | ai_mat_electric_catalog |
| materials | switch_touch_2 | Выключатель сенсорный 2-канальный | шт | 22500.0 | 1500 | ai_mat_electric_catalog |
| materials | socket_usb_white | Розетка USB A+C 3.4А белая | шт | 4500.0 | 1500 | ai_mat_electric_catalog |
| materials | mcb_3p_40a | Автомат 3P 40A тип C | шт | 9000.0 | 2200 | ai_mat_electrical |
| materials | mcb_3p_63a | Автомат 3P 63A тип C | шт | 11000.0 | 2200 | ai_mat_electrical |
| materials | socket_usb | Розетка с USB-зарядкой | шт | 4000.0 | 1500 | ai_mat_electrical |
| materials | mat_el_mcb_1p_10a | Автомат 1П 10А хар.C | шт | 650.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_mcb_1p_16a | Автомат 1П 16А хар.C | шт | 650.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_mcb_1p_20a | Автомат 1П 20А хар.C | шт | 680.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_mcb_1p_25a | Автомат 1П 25А хар.C | шт | 700.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_mcb_1p_32a | Автомат 1П 32А хар.C | шт | 750.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_mcb_1p_40a | Автомат 1П 40А хар.C | шт | 850.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_mcb_1p_6a | Автомат 1П 6А хар.C | шт | 650.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_mcb_3p_100a | Автомат 3П 100А хар.C | шт | 8500.0 | 2200 | ai_mat_electro_ext |
| materials | mat_el_switch_1g | Выключатель 1-клавишный скрытый | шт | 280.0 | 1500 | ai_mat_electro_ext |
| materials | mat_el_switch_2g | Выключатель 2-клавишный скрытый | шт | 380.0 | 1500 | ai_mat_electro_ext |
| materials | mat_el_switch_3g | Выключатель 3-клавишный скрытый | шт | 480.0 | 1500 | ai_mat_electro_ext |
| materials | mat_el_switch_cross | Выключатель перекрёстный | шт | 550.0 | 1500 | ai_mat_electro_ext |
| materials | mat_el_vvg_2x1_5 | Кабель ВВГнг(А) 2×1.5 | м.п. | 42.0 | 245 | ai_mat_electro_ext |
| materials | mat_el_vvg_2x2_5 | Кабель ВВГнг(А) 2×2.5 | м.п. | 62.0 | 375 | ai_mat_electro_ext |
| materials | mat_el_vvg_3x1_5 | Кабель ВВГнг(А) 3×1.5 | м.п. | 55.0 | 342 | ai_mat_electro_ext |
| materials | mat_el_vvg_3x2_5 | Кабель ВВГнг(А) 3×2.5 | м.п. | 82.0 | 538 | ai_mat_electro_ext |
| materials | mat_el_vvg_3x4 | Кабель ВВГнг(А) 3×4 | м.п. | 120.0 | 830 | ai_mat_electro_ext |
| materials | mat_el_vvg_3x6 | Кабель ВВГнг(А) 3×6 | м.п. | 170.0 | 1220 | ai_mat_electro_ext |
| materials | mat_el_vvg_4x10 | Кабель ВВГнг(А) 4×10 | м.п. | 350.0 | 2650 | ai_mat_electro_ext |
| materials | mat_el_vvg_4x16 | Кабель ВВГнг(А) 4×16 | м.п. | 520.0 | 4210 | ai_mat_electro_ext |
| materials | mat_el_vvg_4x25 | Кабель ВВГнг(А) 4×25 | м.п. | 820.0 | 6550 | ai_mat_electro_ext |
| materials | mat_el_vvg_4x35 | Кабель ВВГнг(А) 4×35 | м.п. | 1100.0 | 9150 | ai_mat_electro_ext |
| materials | mat_el_vvg_4x4 | Кабель ВВГнг(А) 4×4 | м.п. | 155.0 | 1090 | ai_mat_electro_ext |
| materials | mat_el_vvg_4x6 | Кабель ВВГнг(А) 4×6 | м.п. | 220.0 | 1610 | ai_mat_electro_ext |
| materials | mat_el_vvg_5x1_5 | Кабель ВВГнг(А) 5×1.5 | м.п. | 82.0 | 538 | ai_mat_electro_ext |
| materials | mat_el_vvg_5x10 | Кабель ВВГнг(А) 5×10 | м.п. | 440.0 | 3300 | ai_mat_electro_ext |
| materials | mat_el_vvg_5x16 | Кабель ВВГнг(А) 5×16 | м.п. | 680.0 | 5250 | ai_mat_electro_ext |
| materials | mat_el_vvg_5x2_5 | Кабель ВВГнг(А) 5×2.5 | м.п. | 125.0 | 862 | ai_mat_electro_ext |
| materials | mat_el_vvg_5x4 | Кабель ВВГнг(А) 5×4 | м.п. | 190.0 | 1350 | ai_mat_electro_ext |
| materials | mat_el_vvg_5x6 | Кабель ВВГнг(А) 5×6 | м.п. | 280.0 | 2000 | ai_mat_electro_ext |
| materials | mat_el_vvg_ls_3x1_5 | Кабель ВВГнг(А)-LS 3×1.5 | м.п. | 68.0 | 342 | ai_mat_electro_ext |
| materials | mat_el_vvg_ls_3x2_5 | Кабель ВВГнг(А)-LS 3×2.5 | м.п. | 98.0 | 538 | ai_mat_electro_ext |
| materials | mat_el_vvg_ls_5x2_5 | Кабель ВВГнг(А)-LS 5×2.5 | м.п. | 155.0 | 862 | ai_mat_electro_ext |
| materials | mat_el_socket_tv | Розетка ТВ оконечная | шт | 450.0 | 1500 | ai_mat_electro_ext |
| materials | mat_el_socket_double | Розетка двойная с/з скрытая | шт | 550.0 | 1500 | ai_mat_electro_ext |
| materials | mat_el_socket_single | Розетка одинарная с/з скрытая | шт | 350.0 | 1500 | ai_mat_electro_ext |
| materials | switch_touch_2g | Выключатель сенсорный двухклавишный | шт | 7000.0 | 1500 | ai_mat_electroinstall_catalog |
| materials | switch_touch_1g | Выключатель сенсорный одноклавишный | шт | 5000.0 | 1500 | ai_mat_electroinstall_catalog |
| materials | outlet_floor_pop_up | Розетка напольная выдвижная | шт | 15000.0 | 1500 | ai_mat_electroinstall_catalog |
| materials | mat_en_switch_vacuum_10kv_1250 | Выключатель вакуумный ВВ 10кВ 1250А | шт | 650000.0 | 1500 | ai_mat_energy |
| materials | mat_en_switch_vacuum_10kv | Выключатель вакуумный ВВ ТЭЛ 10кВ 630А | шт | 450000.0 | 1500 | ai_mat_energy |
| materials | mat_en_switch_vacuum_6kv | Выключатель вакуумный ВВ ТЭЛ 6кВ 630А | шт | 380000.0 | 1500 | ai_mat_energy |
| materials | curb_garden_80x200x500 | Бордюр садовый 80×200×500мм | шт | 450.0 | 2500 | ai_mat_facade_catalog |
| materials | facade_porcl_600x1200_8mm | Керамогранит фасадный 600×1200×8мм | м² | 18000.0 | 7000 | ai_mat_facade_catalog |
| materials | dowel_6x30 | Дюбель пластиковый 6×30мм (100шт) | уп. | 480.0 | 1500 | ai_mat_fasteners |
| materials | screw_5x100_pz | Саморез универсальный 5×100мм (100шт) | уп. | 1800.0 | 400 | ai_mat_fasteners |
| materials | screw_5x70_pz | Саморез универсальный 5×70мм (100шт) | уп. | 1200.0 | 400 | ai_mat_fasteners |
| materials | screw_6x120_pz | Саморез универсальный 6×120мм (50шт) | уп. | 1680.0 | 200 | ai_mat_fasteners |
| materials | screw_wood_yellow_6x100_50 | Саморез жёлтый 6×100 (50шт) | уп. | 960.0 | 200 | ai_mat_fasteners_catalog |
| materials | screw_wood_yellow_6x120_50 | Саморез жёлтый 6×120 (50шт) | уп. | 1200.0 | 200 | ai_mat_fasteners_catalog |
| materials | screw_wood_yellow_6x80_100 | Саморез жёлтый 6×80 (100шт) | уп. | 1200.0 | 400 | ai_mat_fasteners_catalog |
| materials | screw_wood_4_8x100_100 | Саморез по дереву 4.8×100 (100шт) | уп. | 1080.0 | 400 | ai_mat_fasteners_catalog |
| materials | screw_wood_4_8x120_100 | Саморез по дереву 4.8×120 (100шт) | уп. | 1440.0 | 400 | ai_mat_fasteners_catalog |
| materials | screw_wood_4_8x150_50 | Саморез по дереву 4.8×150 (50шт) | уп. | 1080.0 | 200 | ai_mat_fasteners_catalog |
| materials | screw_metal_3_5x9_5_1000 | Саморез по металлу 3.5×9.5 «клоп» (1000шт) | уп. | 1200.0 | 4000 | ai_mat_fasteners_catalog |
| materials | mat_fx_nail_30_1kg | Гвозди строительные 1.6×30 (1кг) | кг | 400.0 | 1200 | ai_mat_fasteners_ext |
| materials | mat_fx_nail_50_1kg | Гвозди строительные 2.0×50 (1кг) | кг | 380.0 | 1200 | ai_mat_fasteners_ext |
| materials | mat_fx_nail_70_1kg | Гвозди строительные 2.5×70 (1кг) | кг | 360.0 | 1200 | ai_mat_fasteners_ext |
| materials | mat_fx_nail_100_1kg | Гвозди строительные 3.0×100 (1кг) | кг | 350.0 | 1200 | ai_mat_fasteners_ext |
| materials | mat_fx_nail_120_1kg | Гвозди строительные 3.5×120 (1кг) | кг | 350.0 | 1200 | ai_mat_fasteners_ext |
| materials | mat_fx_nail_150_1kg | Гвозди строительные 4.0×150 (1кг) | кг | 350.0 | 1200 | ai_mat_fasteners_ext |
| materials | mat_fx_nail_200_1kg | Гвозди строительные 5.0×200 (1кг) | кг | 380.0 | 1200 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_10x50 | Дюбель полипроп. 10×50 (100шт) | уп. | 280.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_10x60 | Дюбель полипроп. 10×60 (50шт) | уп. | 200.0 | 750 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_12x60 | Дюбель полипроп. 12×60 (50шт) | уп. | 250.0 | 750 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_6x30 | Дюбель полипроп. 6×30 (100шт) | уп. | 120.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_6x40 | Дюбель полипроп. 6×40 (100шт) | уп. | 150.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_8x40 | Дюбель полипроп. 8×40 (100шт) | уп. | 180.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_8x50 | Дюбель полипроп. 8×50 (100шт) | уп. | 220.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_nail_6x40 | Дюбель-гвоздь 6×40 (200шт) | уп. | 450.0 | 3000 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_nail_6x60 | Дюбель-гвоздь 6×60 (200шт) | уп. | 550.0 | 3000 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_nail_6x80 | Дюбель-гвоздь 6×80 (100шт) | уп. | 350.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_nail_8x100 | Дюбель-гвоздь 8×100 (100шт) | уп. | 500.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_dowel_nail_8x60 | Дюбель-гвоздь 8×60 (100шт) | уп. | 350.0 | 1500 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_gkl_25 | Саморез ГКЛ/мет. 3.5×25 (1000шт) | уп. | 850.0 | 4000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_gkl_32 | Саморез ГКЛ/мет. 3.5×32 (1000шт) | уп. | 950.0 | 4000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_gkl_45 | Саморез ГКЛ/мет. 3.5×45 (1000шт) | уп. | 1050.0 | 4000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_gkl_55 | Саморез ГКЛ/мет. 3.5×55 (500шт) | уп. | 650.0 | 2000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_wood_30 | Саморез по дереву 3.5×30 (500шт) | уп. | 550.0 | 2000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_wood_40 | Саморез по дереву 3.5×40 (500шт) | уп. | 600.0 | 2000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_tek_4_2x13 | Саморез со сверлом 4.2×13 (1000шт) | уп. | 1200.0 | 4000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_tek_4_2x19 | Саморез со сверлом 4.2×19 (1000шт) | уп. | 1350.0 | 4000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_tek_4_2x25 | Саморез со сверлом 4.2×25 (1000шт) | уп. | 1500.0 | 4000 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_concrete_7_5x72 | Шуруп по бетону 7.5×72 (100шт) | уп. | 1200.0 | 400 | ai_mat_fasteners_ext |
| materials | mat_fx_screw_facade_7_5x152 | Шуруп фасадный 7.5×152 (100шт) | уп. | 2200.0 | 400 | ai_mat_fasteners_ext |
| materials | screw_fence_5_5x19_250 | Саморез для профлиста 5.5×19мм (250шт) | уп. | 3000.0 | 1000 | ai_mat_fencing_catalog |
| materials | firebrick_std | Кирпич огнеупорный ШБ-5 | шт | 25.0 | 80 | ai_mat_fireplace_catalog |
| materials | dowel_gkl_driva_metal | Дюбель Дрива для ГКЛ металл | шт | 50.0 | 15 | ai_mat_fixings_catalog |
| materials | dowel_gkl_molly_m4 | Дюбель Молли для ГКЛ M4 | шт | 50.0 | 15 | ai_mat_fixings_catalog |
| materials | dowel_nylon_6x30_100 | Дюбель нейлон 6×30мм (100шт) | уп. | 300.0 | 1500 | ai_mat_fixings_catalog |
| materials | dowel_nylon_8x40_100 | Дюбель нейлон 8×40мм (100шт) | уп. | 400.0 | 1500 | ai_mat_fixings_catalog |
| materials | screw_gkl_3_5x45_500 | Саморез ГКЛ/дер. 3.5×45мм (500шт) | уп. | 600.0 | 2000 | ai_mat_fixings_catalog |
| materials | screw_gkl_3_5x25_500 | Саморез ГКЛ/мет. 3.5×25мм (500шт) | уп. | 500.0 | 2000 | ai_mat_fixings_catalog |
| materials | screw_gkl_3_5x35_500 | Саморез ГКЛ/мет. 3.5×35мм (500шт) | уп. | 600.0 | 2000 | ai_mat_fixings_catalog |
| materials | screw_wood_3_5x25_500 | Саморез по дер. 3.5×25мм (500шт) | уп. | 500.0 | 2000 | ai_mat_fixings_catalog |
| materials | screw_wood_3_5x35_500 | Саморез по дер. 3.5×35мм (500шт) | уп. | 600.0 | 2000 | ai_mat_fixings_catalog |
| materials | garden_border_rubber_1m | Бордюр садовый резиновый (1м) | шт | 150.0 | 2500 | ai_mat_gardenequip_catalog |
| materials | septic_ring_concrete_1m | Кольцо бетонное КС 10-9 (1м) | шт | 2000.0 | 30000 | ai_mat_gardenequip_catalog |
| materials | bigun_hpp_1x10m | Бикрост ХПП (1×10м) | рулон | 4000.0 | 15000 | ai_mat_insulation_catalog |
| materials | bigun_epp_1x10m | Бикрост ЭПП (1×10м) | рулон | 4800.0 | 15000 | ai_mat_insulation_catalog |
| materials | dubel_140_insul_50 | Дюбель тарельчатый 140мм (50шт) | уп. | 2000.0 | 750 | ai_mat_insulation_catalog |
| materials | dubel_160_insul_50 | Дюбель тарельчатый 160мм (50шт) | уп. | 2400.0 | 750 | ai_mat_insulation_catalog |
| materials | dubel_200_insul_50 | Дюбель тарельчатый 200мм (50шт) | уп. | 2800.0 | 750 | ai_mat_insulation_catalog |
| materials | rosette_ceil_300mm | Розетка потолочная Ø300мм | шт | 100.0 | 1500 | ai_mat_interior_catalog |
| materials | rosette_ceil_500mm | Розетка потолочная Ø500мм | шт | 300.0 | 1500 | ai_mat_interior_catalog |
| materials | curb_garden_100_20_6 | Бордюр садовый 1000×200×60 | шт | 750.0 | 2500 | ai_mat_jbi_blocks_catalog |
| materials | curb_500x200x60 | Бордюр садовый 500×200×60мм | шт | 600.0 | 2500 | ai_mat_jbi_catalog |
| materials | gravel_decorative | Щебень декоративный (белый мрамор) | м³ | 24000.0 | 6500 | ai_mat_landscape |
| materials | ring_kc10_9 | Кольцо КС10.9 (1м Ø, h=0.9м) | шт | 3000.0 | 30000 | ai_mat_landscape_catalog |
| materials | ring_kc15_9 | Кольцо КС15.9 (1.5м Ø, h=0.9м) | шт | 5000.0 | 55000 | ai_mat_landscape_catalog |
| materials | board_unedged_25_m3 | Доска необрезная 25мм (м³) | м³ | 20000.0 | 120000 | ai_mat_lumber_catalog |
| materials | board_unedged_40_m3 | Доска необрезная 40мм (м³) | м³ | 22000.0 | 120000 | ai_mat_lumber_catalog |
| materials | board_unedged_50_m3 | Доска необрезная 50мм (м³) | м³ | 24000.0 | 120000 | ai_mat_lumber_catalog |
| materials | block_keramzit_390_190 | Керамзитоблок 390×190×190 полнотелый | шт | 80.0 | 422 | ai_mat_masonry |
| materials | block_keramzit_390_190_hollow | Керамзитоблок 390×190×190 пустотелый | шт | 65.0 | 422 | ai_mat_masonry |
| materials | block_keramzit_partition | Керамзитоблок перегородочный 390×90×190 | шт | 45.0 | 200 | ai_mat_masonry |
| materials | brick_ceramic_face | Кирпич облицовочный керамический | шт | 55.0 | 180 | ai_mat_masonry |
| materials | brick_ceramic_face_color | Кирпич облицовочный цветной | шт | 70.0 | 180 | ai_mat_masonry |
| materials | brick_silicate_face | Кирпич силикатный облицовочный | шт | 38.0 | 180 | ai_mat_masonry |
| materials | brick_silicate_single | Кирпич силикатный одинарный М150 | шт | 22.0 | 70 | ai_mat_masonry |
| materials | screw_roof_4_8x35_250 | Саморез кровельный 4.8×35мм (250шт) | уп. | 2640.0 | 1000 | ai_mat_metiz_catalog |
| materials | screw_roof_4_8x50_200 | Саморез кровельный 4.8×50мм (200шт) | уп. | 2400.0 | 800 | ai_mat_metiz_catalog |
| materials | screw_roof_4_8x70_100 | Саморез кровельный 4.8×70мм (100шт) | уп. | 1800.0 | 400 | ai_mat_metiz_catalog |
| materials | wood_screw_10x100_50 | Шуруп по дереву 10×100мм (50шт) | уп. | 1800.0 | 200 | ai_mat_metiz_catalog |
| materials | wood_screw_10x120_50 | Шуруп по дереву 10×120мм (50шт) | уп. | 2160.0 | 200 | ai_mat_metiz_catalog |
| materials | wood_screw_8x80_100 | Шуруп по дереву 8×80мм (100шт) | уп. | 2400.0 | 400 | ai_mat_metiz_catalog |
| materials | molding_pu_rosette_400 | Розетка потолочная Ø400мм | шт | 500.0 | 1500 | ai_mat_paint_catalog |
| materials | curb_plastic_1m | Бордюр пластиковый (1м) | шт | 800.0 | 2500 | ai_mat_paving_catalog |
| materials | curb_garden_50x21x7 | Бордюр садовый малый 50×21×7см | шт | 600.0 | 2500 | ai_mat_paving_catalog |
| materials | paver_granite_100x100x50 | Брусчатка гранитная 100×100×50 | м² | 25000.0 | 5500 | ai_mat_paving_catalog |
| materials | paver_granite_200x100x50 | Брусчатка гранитная 200×100×50 | м² | 28000.0 | 5500 | ai_mat_paving_catalog |
| materials | sew_cap_110 | Заглушка канализ. Ø110мм | шт | 15.0 | 600 | ai_mat_pipe_catalog |
| materials | mat_pp_fit_plug_110 | Заглушка канализ. Ø110 | шт | 35.0 | 600 | ai_mat_pipes_ext |
| materials | floor_self_level_thick | Наливной пол толстослойный 10-80мм (25кг) | мешок | 1200.0 | 3500 | ai_mat_plaster |
| materials | putty_cement_grey | Шпаклёвка цементная серая (25кг) | мешок | 1100.0 | 3250 | ai_mat_plaster |
| materials | sewer_110_plug | Заглушка ПВХ Ø110 | шт | 30.0 | 600 | ai_mat_plumbing |
| materials | tool_screwdriver_18v | Шуруповёрт акк. 18В 2Ач | шт | 5000.0 | 4 | ai_mat_powertools_catalog |
| materials | tool_screwdriver_18v_pro | Шуруповёрт акк. 18В 4Ач профи | шт | 10000.0 | 4 | ai_mat_powertools_catalog |
| materials | profile_pn_27x28_4m | Профиль ПН 27×28мм (4м) | шт | 110.0 | 600 | ai_mat_profiles_catalog |
| materials | profile_pn_50x40_4m | Профиль ПН 50×40мм (4м) | шт | 130.0 | 600 | ai_mat_profiles_catalog |
| materials | profile_pp_60x27_4m | Профиль ПП 60×27мм (4м) | шт | 130.0 | 900 | ai_mat_profiles_catalog |
| materials | tool_rebar_bender_12 | Арматурогиб ручной до Ø12мм | шт | 20000.0 | 320 | ai_mat_rebar_catalog |
| materials | tool_rebar_cutter_12 | Арматурорез ручной до Ø12мм | шт | 24000.0 | 320 | ai_mat_rebar_catalog |
| materials | curb_road_1000x300x150 | Бордюр дорожный БР 100.30.15 | шт | 875.0 | 2500 | ai_mat_road |
| materials | bikrost_tkp | Бикрост ТКП (верхний слой, 10м²) | рулон | 1800.0 | 15000 | ai_mat_roofing |
| materials | bikrost_hkp | Бикрост ХКП (нижний слой, 10м²) | рулон | 1500.0 | 15000 | ai_mat_roofing |
| materials | profsheet_c8_04 | Профнастил С-8 0.4мм | м² | 1200.0 | 3500 | ai_mat_roofing |
| materials | ruberoid_rkp | Рубероид РКП-350 (15м²) | рулон | 1200.0 | 4500 | ai_mat_roofing |
| materials | uniflex_ekp | Унифлекс ЭКП (верхний, 10м²) | рулон | 3000.0 | 15000 | ai_mat_roofing |
| materials | uniflex_epv | Унифлекс ЭПВ (нижний, 10м²) | рулон | 2500.0 | 15000 | ai_mat_roofing |
| materials | mt_monterrey_0_4_ral3005 | Металлочерепица Монтеррей 0.4мм RAL3005 (м²) | м² | 350.0 | 4200 | ai_mat_roofing_catalog |
| materials | mt_monterrey_0_5_ral7024 | Металлочерепица Монтеррей 0.5мм RAL7024 (м²) | м² | 550.0 | 4200 | ai_mat_roofing_catalog |
| materials | sewer_plug_110 | Заглушка канал. Ø110 | шт | 10.0 | 600 | ai_mat_sewer_catalog |
| materials | sewer_ext_plug_110 | Заглушка наружн. Ø110 | шт | 15.0 | 600 | ai_mat_sewer_catalog |
| materials | smart_switch_2g | Выключатель умный 2-клавишный Wi-Fi | шт | 4000.0 | 1500 | ai_mat_smart_home |
| materials | soundproof_panel_gkl_12_5mm | ГКЛ акустический 12.5мм | лист | 600.0 | 2800 | ai_mat_soundproof_catalog |
| materials | vibro_profile_pn_66 | Профиль виброизоляционный ПН 66мм | шт | 200.0 | 600 | ai_mat_soundproof_catalog |
| materials | tile_border_30x600 | Бордюр 30×600мм | шт | 720.0 | 2500 | ai_mat_tile_catalog |
| materials | tile_border_50x400 | Бордюр 50×400мм | шт | 600.0 | 2500 | ai_mat_tile_catalog |
| materials | kg_1200x1200_marble | Керамогранит 1200×1200мм мрамор | м² | 24000.0 | 7000 | ai_mat_tile_catalog |
| materials | kg_20mm_600x600_stone | Керамогранит 20мм 600×600мм камень | м² | 18000.0 | 7000 | ai_mat_tile_catalog |
| materials | kg_300x300_salt_pepper | Керамогранит 300×300мм соль-перец | м² | 2700.0 | 7000 | ai_mat_tile_catalog |
| materials | kg_800x800_marble_cal | Керамогранит 800×800мм калакатта | м² | 18000.0 | 7000 | ai_mat_tile_catalog |
| materials | glue_tile_pool_25 | Клей для плитки бассейновый (25кг) | мешок | 9000.0 | 2625 | ai_mat_tile_catalog |
| materials | tile_border_5x30 | Бордюр керамический 5×30см | шт | 250.0 | 2500 | ai_mat_tiling |
| materials | drill_driver_12v_2ah | Шуруповёрт аккум. 12В 2Ач | шт | 4000.0 | 4 | ai_mat_tools_catalog |
| materials | drill_driver_18v_2ah | Шуруповёрт аккум. 18В 2Ач | шт | 6000.0 | 4 | ai_mat_tools_catalog |
| materials | drill_driver_18v_4ah | Шуруповёрт аккум. 18В 4Ач | шт | 10000.0 | 4 | ai_mat_tools_catalog |
| materials | drill_driver_18v_5ah_pro | Шуруповёрт аккум. 18В 5Ач проф. | шт | 18000.0 | 4 | ai_mat_tools_catalog |
| materials | blind_area_tile | Плитка тротуарная для отмостки (40мм) | м² | 1200.0 | 5500 | ai_mat_waterproof |
| materials | fit_kan_plug_110 | Заглушка канализ. Ø110 | шт | 20.0 | 600 | ai_mat_watersystem_catalog |
| materials | breaker_16a | Автомат 16А (свет) | шт | 450.0 | 2200 | aipricedatabase |
| materials | breaker_25a | Автомат 25А (розетки) | шт | 550.0 | 2200 | aipricedatabase |
| materials | breaker_32a | Автомат 32А (плита) | шт | 650.0 | 2200 | aipricedatabase |
| materials | border_garden | Бордюр садовый 500×200 | шт | 120.0 | 2500 | aipricedatabase |
| materials | border_stone | Бордюрный камень 1000×200 | шт | 280.0 | 2500 | aipricedatabase |
| materials | switch_single | Выключатель одноклавишный | шт | 450.0 | 1500 | aipricedatabase |
| materials | block_gas_400 | Газоблок 600x200x300 D400 | шт | 290.0 | 1152 | aipricedatabase |
| materials | block_gas_500 | Газоблок 600x200x300 D500 | шт | 320.0 | 1152 | aipricedatabase |
| materials | block_gas_600 | Газоблок 600x200x300 D600 | шт | 350.0 | 1152 | aipricedatabase |
| materials | nail_smooth_120 | Гвоздь гладкий 120мм | кг | 460.0 | 1200 | aipricedatabase |
| materials | nail_smooth_50 | Гвоздь гладкий 50мм | кг | 420.0 | 1200 | aipricedatabase |
| materials | nail_smooth_80 | Гвоздь гладкий 80мм | кг | 440.0 | 1200 | aipricedatabase |
| materials | dowel_6x60 | Дюбель-гвоздь 6×60 | шт | 5.0 | 15 | aipricedatabase |
| materials | block_keramsit | Керамзитоблок 390x190x188 | шт | 85.0 | 418 | aipricedatabase |
| materials | brick_red | Кирпич красный М150 | шт | 18.0 | 80 | aipricedatabase |
| materials | brick_facing | Кирпич облицовочный | шт | 35.0 | 180 | aipricedatabase |
| materials | brick_white | Кирпич силикатный М150 | шт | 15.0 | 70 | aipricedatabase |
| materials | bitumen_mastic | Мастика битумная | кг | 380.0 | 1200 | aipricedatabase |
| materials | mastic_cold | Мастика битумная холодная | кг | 380.0 | 1200 | aipricedatabase |
| materials | metal_tile | Металлочерепица | м² | 850.0 | 4200 | aipricedatabase |
| materials | nalivnoy_vetonit | Наливной пол Vetonit 25кг | мешок | 1200.0 | 3500 | aipricedatabase |
| materials | nalivnoy_unis | Наливной пол Юнис 25кг | мешок | 850.0 | 3500 | aipricedatabase |
| materials | block_foam | Пеноблок 600x300x200 | шт | 280.0 | 1152 | aipricedatabase |
| materials | fence_profsheet | Профлист заборный С8 | м² | 450.0 | 3500 | aipricedatabase |
| materials | profsheet_c20 | Профнастил С20 | м² | 550.0 | 3500 | aipricedatabase |
| materials | mortar_M100 | Раствор М100 | м³ | 4500.0 | 22000 | aipricedatabase |
| materials | mortar_M150 | Раствор М150 | м³ | 5500.0 | 22000 | aipricedatabase |
| materials | outlet_single | Розетка одинарная | шт | 550.0 | 1500 | aipricedatabase |
| works | work_screed_beacons | Установка маяков для стяжки | м² | 300.0 | 2500 | ai_work_concrete_catalog |
| works | work_ceiling_demo_gkl | Демонтаж потолка из ГКЛ | м² | 100.0 | 3800 | ai_work_drywall_ceiling_catalog |
| works | work_elec_demo_socket | Демонтаж розетки / выключателя | шт | 400.0 | 1500 | ai_work_electrical_catalog |
| works | work_facade_clinker | Облицовка фасада клинкерной плиткой | м² | 1000.0 | 5500 | ai_work_facade_windows_catalog |
| works | work_facade_tsokol_tile | Облицовка цоколя плиткой | м² | 800.0 | 5500 | ai_work_facade_windows_catalog |
| works | work_rosette_ceiling | Монтаж потолочной розетки | шт | 4000.0 | 1500 | ai_work_plaster_paint_catalog |
| works | work_pool_tile | Облицовка бассейна плиткой | м² | 1500.0 | 5500 | ai_work_special_catalog |
| works | work_floor_vinyl_click | Укладка виниловой плитки (замковая) | м² | 1500.0 | 5500 | ai_work_tiling_floor_catalog |
| works | work_floor_vinyl_glue | Укладка виниловой плитки (клеевая) | м² | 1800.0 | 5500 | ai_work_tiling_floor_catalog |
| works | work_floor_substrate | Укладка подложки под ламинат | м² | 180.0 | 1800 | ai_work_tiling_floor_catalog |
| works | wrk_ac_floor_stye | Стяжка плавающая | м² | 550.0 | 2500 | ai_wrk_acoustics |
| works | wrk_balc_wall_paint | Покраска стен балкона | м² | 100.0 | 1100 | ai_wrk_balcony |
| works | wrk_balc_floor_screed | Стяжка пола балкона | м² | 300.0 | 2500 | ai_wrk_balcony |
| works | wrk_balc_wall_plaster | Штукатурка стен балкона | м² | 300.0 | 2200 | ai_wrk_balcony |
| works | wrk_ceil_demo_gkl | Демонтаж потолка ГКЛ | м² | 50.0 | 3800 | ai_wrk_ceiling |
| works | wrk_ceil_gkl_putty_paint | Шпаклёвка + покраска потолка ГКЛ | м² | 150.0 | 1500 | ai_wrk_ceiling |
| works | wrk_ceil_putty_2x | Шпаклёвка потолка 2 слоя | м² | 100.0 | 1500 | ai_wrk_ceiling |
| works | wrk_ceil_putty_3x | Шпаклёвка потолка 3 слоя | м² | 140.0 | 1500 | ai_wrk_ceiling |
| works | wrk_rebar_mesh_slab | Укладка сварной сетки в стяжку | м² | 180.0 | 2500 | ai_wrk_concrete |
| works | wrk_conc_beacons | Установка маяков для стяжки | м² | 300.0 | 2500 | ai_wrk_concrete |
| works | wrk_dec_ceiling_rosette | Монтаж потолочной розетки | шт | 300.0 | 1500 | ai_wrk_decorative |
| works | wrk_dm_gkl_partition | Демонтаж перегородки из ГКЛ | м² | 250.0 | 3800 | ai_wrk_demolition_ext2 |
| works | wrk_dm_ceiling_gkl | Демонтаж потолка из ГКЛ | м² | 250.0 | 3800 | ai_wrk_demolition_ext2 |
| works | wrk_dem_floor_screed_100 | Демонтаж стяжки 100мм | м² | 50.0 | 2500 | ai_wrk_demolition_full |
| works | wrk_dem_floor_screed_30 | Демонтаж стяжки 30мм | м² | 20.0 | 2500 | ai_wrk_demolition_full |
| works | wrk_dem_floor_screed_50 | Демонтаж стяжки 50мм | м² | 30.0 | 2500 | ai_wrk_demolition_full |
| works | wrk_sound_floor_premium | Звукоизоляция пола (плавающая стяжка) | м² | 600.0 | 2500 | ai_wrk_drywall |
| works | wrk_earth_exc_man_1cat | Разработка грунта (ручн.) 1 категория | м³ | 300.0 | 9000 | ai_wrk_earth_ext |
| works | wrk_earth_exc_man_2cat | Разработка грунта (ручн.) 2 категория | м³ | 400.0 | 9000 | ai_wrk_earth_ext |
| works | wrk_earth_exc_man_3cat | Разработка грунта (ручн.) 3 категория | м³ | 500.0 | 9000 | ai_wrk_earth_ext |
| works | wrk_earth_exc_man_4cat | Разработка грунта (ручн.) 4 категория | м³ | 700.0 | 9000 | ai_wrk_earth_ext |
| works | wrk_ew_manual_1gr | Разработка грунта вручную (I гр.) | м³ | 1200.0 | 9000 | ai_wrk_earthwork_ext2 |
| works | wrk_ew_manual_2gr | Разработка грунта вручную (II гр.) | м³ | 1500.0 | 9000 | ai_wrk_earthwork_ext2 |
| works | wrk_ew_manual_3gr | Разработка грунта вручную (III гр.) | м³ | 2000.0 | 9000 | ai_wrk_earthwork_ext2 |
| works | wrk_ew_manual_4gr | Разработка грунта вручную (IV гр.) | м³ | 2800.0 | 9000 | ai_wrk_earthwork_ext2 |
| works | wrk_elec_socket_floor | Установка напольной розетки (люк) | шт | 4000.0 | 1500 | ai_wrk_electrical |
| works | wrk_ef2_socket_tv | Установка ТВ розетки | шт | 450.0 | 1500 | ai_wrk_electrical_full2 |
| works | wrk_ef2_socket_data | Установка информационной розетки (RJ-45) | шт | 550.0 | 1500 | ai_wrk_electrical_full2 |
| works | wrk_ef2_socket_ip44 | Установка розетки IP44 (влагозащ.) | шт | 550.0 | 1500 | ai_wrk_electrical_full2 |
| works | wrk_ef2_socket_double | Установка розетки двойной | шт | 450.0 | 1500 | ai_wrk_electrical_full2 |
| works | wrk_ef2_socket_single | Установка розетки одинарной | шт | 350.0 | 1500 | ai_wrk_electrical_full2 |
| works | wrk_eng_breaker_10kv | Монтаж выключателя 10кВ | шт | 20000.0 | 1500 | ai_wrk_energy |
| works | wrk_eng_breaker_110kv | Монтаж выключателя 110кВ | шт | 150000.0 | 1500 | ai_wrk_energy |
| works | wrk_eng_breaker_35kv | Монтаж выключателя 35кВ | шт | 50000.0 | 1500 | ai_wrk_energy |
| works | wrk_eng_breaker_6kv | Монтаж выключателя 6кВ | шт | 15000.0 | 1500 | ai_wrk_energy |
| works | wrk_fcd_vent_porcelain | Облицовка керамогранитом (вентфасад) | м² | 300.0 | 5500 | ai_wrk_facade_ext |
| works | wrk_fc2_nvf_panel_ceram | Облицовка НВФ керамогранитом | м² | 1200.0 | 5500 | ai_wrk_facade_full2 |
| works | wrk_fc2_brick_tile | Облицовка фасада плиткой под кирпич | м² | 1800.0 | 5500 | ai_wrk_facade_full2 |
| works | wrk_fs2_vf_granite | Облицовка керамогранит 10мм | м² | 1500.0 | 5500 | ai_wrk_facade_sys |
| works | wrk_floor_screed_mesh | Армирование стяжки сеткой | м² | 240.0 | 2500 | ai_wrk_flooring |
| works | wrk_floor_screed_beacon | Установка маяков (стяжка) | м² | 240.0 | 2500 | ai_wrk_flooring |
| works | wrk_floor_screed_fiber | Фиброармирование стяжки | м² | 120.0 | 2500 | ai_wrk_flooring |
| works | wrk_fl_park_putty | Шпатлёвка паркета | м² | 10.0 | 1500 | ai_wrk_flooring_full |
| works | wrk_hf_carbon_rod_screed | Стяжка над стержневым полом | м² | 550.0 | 2500 | ai_wrk_heatfloor |
| works | wrk_hf_water_screed | Стяжка над тёплым полом (50мм) | м² | 550.0 | 2500 | ai_wrk_heatfloor |
| works | wrk_heat_fireplace_clad_tile | Облицовка камина плиткой | м² | 1000.0 | 5500 | ai_wrk_heating |
| works | wrk_if_screed_reinforced | Армирование стяжки сеткой 4Вр1 | м² | 750.0 | 2500 | ai_wrk_indfloor |
| works | wrk_if_screed_film_pe | Укладка плёнки ПЭ под стяжку | м² | 150.0 | 2500 | ai_wrk_indfloor |
| works | wrk_lv_tv_socket | Монтаж ТВ-розетки | шт | 150.0 | 1500 | ai_wrk_low_voltage |
| works | wrk_lv_sks_socket_rj45 | Монтаж розетки RJ-45 | шт | 200.0 | 1500 | ai_wrk_low_voltage |
| works | wrk_lv_sks_socket_rj45_2 | Монтаж розетки RJ-45 (двойная) | шт | 300.0 | 1500 | ai_wrk_low_voltage |
| works | wrk_lc_tv_outlet | Монтаж ТВ розетки | шт | 350.0 | 1500 | ai_wrk_lowcurrent_full |
| works | wrk_lc_scs_outlet_single | Монтаж информационной розетки (1 порт) | шт | 450.0 | 1500 | ai_wrk_lowcurrent_full |
| works | wrk_lc_phone_outlet | Монтаж телефонной розетки | шт | 350.0 | 1500 | ai_wrk_lowcurrent_full |
| works | wrk_msnr_demo_brick_1 | Демонтаж кладки в 1 кирпич | м² | 2000.0 | 6500 | ai_wrk_masonry |
| works | wrk_msnr_demo_brick_half | Демонтаж кладки в полкирпича | м² | 1250.0 | 6500 | ai_wrk_masonry |
| works | wrk_msnr_gas_glue | Кладка газоблоков на клей | м² | 250.0 | 3800 | ai_wrk_masonry |
| works | wrk_msnr_gas_foam | Кладка газоблоков на клей-пену | м² | 150.0 | 3800 | ai_wrk_masonry |
| works | wrk_ms_block_gas_100 | Кладка газобетон 100мм | м² | 850.0 | 3800 | ai_wrk_masonry_ext |
| works | wrk_ms_block_gas_150 | Кладка газобетон 150мм | м² | 1100.0 | 3800 | ai_wrk_masonry_ext |
| works | wrk_ms_block_gas_200 | Кладка газобетон 200мм | м² | 1400.0 | 3800 | ai_wrk_masonry_ext |
| works | wrk_ms_brick_120_simple | Кладка стен кирпич 120мм (в полкирпича) | м² | 1200.0 | 3500 | ai_wrk_masonry_ext |
| works | wrk_ms_brick_250_simple | Кладка стен кирпич 250мм (в один) | м² | 2200.0 | 6500 | ai_wrk_masonry_ext |
| works | wrk_ms_brick_380_simple | Кладка стен кирпич 380мм (в полтора) | м² | 3200.0 | 9500 | ai_wrk_masonry_ext |
| works | wrk_ms_brick_510_simple | Кладка стен кирпич 510мм (в два) | м² | 4200.0 | 12500 | ai_wrk_masonry_ext |
| works | wrk_ms_block_cinder_190 | Кладка шлакоблоков 190мм | м² | 1000.0 | 3800 | ai_wrk_masonry_ext |
| works | wrk_my2_gas_200 | Кладка газобетона 200мм | м² | 1200.0 | 3800 | ai_wrk_masonry_full2 |
| works | wrk_my2_gas_250 | Кладка газобетона 250мм | м² | 1400.0 | 3800 | ai_wrk_masonry_full2 |
| works | wrk_my2_brick_1_250 | Кладка кирпича рядового 250мм (1 кирпич) | м² | 2500.0 | 6500 | ai_wrk_masonry_full2 |
| works | wrk_my2_brick_1_5_380 | Кладка кирпича рядового 380мм (1.5 кирпича) | м² | 3500.0 | 9500 | ai_wrk_masonry_full2 |
| works | wrk_my2_brick_2_510 | Кладка кирпича рядового 510мм (2 кирпича) | м² | 4500.0 | 12500 | ai_wrk_masonry_full2 |
| works | wrk_my2_cinder_200 | Кладка шлакоблока 200мм | м² | 850.0 | 3800 | ai_wrk_masonry_full2 |
| works | wrk_my2_cinder_390 | Кладка шлакоблока 390мм | м² | 1500.0 | 3800 | ai_wrk_masonry_full2 |
| works | wrk_paint_ind_airless_wall | Окраска аппаратом безвоздушным (стены) | м² | 360.0 | 1100 | ai_wrk_painting |
| works | wrk_pnt_wall_water_1 | Покраска стен водоэмульсионная (1 слой) | м² | 400.0 | 1100 | ai_wrk_painting_full |
| works | wrk_pip_uf_elec_cable | Тёплый пол (кабель в стяжку) | м² | 30.0 | 2500 | ai_wrk_piping_full |
| works | wrk_plst_paint_wall_1 | Покраска стен 1 слой | м² | 360.0 | 1100 | ai_wrk_plaster |
| works | wrk_plt_putty_super_fin | Шпаклёвка суперфиниш (под покраску) | м² | 100.0 | 1500 | ai_wrk_plaster_ext |
| works | wrk_plt_putty_finish_3x | Шпаклёвка финишная 3 слоя | м² | 100.0 | 1500 | ai_wrk_plaster_ext |
| works | wrk_pl_screed_pe_film | Плёнка ПЭ (под стяжку) | м² | 150.0 | 2500 | ai_wrk_plastering_full |
| works | wrk_pl_screed_fiber | Фиброволокно (в стяжку) | м² | 150.0 | 2500 | ai_wrk_plastering_full |
| works | wrk_rc2_demo_partition_gkl | Демонтаж перегородки (ГКЛ) | м² | 200.0 | 3800 | ai_wrk_reconstruction2 |
| works | wrk_rc2_demo_floor | Демонтаж стяжки/пола | м² | 350.0 | 2500 | ai_wrk_reconstruction2 |
| works | wrk_road_paving_40 | Укладка тротуарной плитки h=40мм | м² | 1200.0 | 5500 | ai_wrk_road |
| works | wrk_road_paving_60 | Укладка тротуарной плитки h=60мм | м² | 1500.0 | 5500 | ai_wrk_road |
| works | wrk_road_paving_80 | Укладка тротуарной плитки h=80мм | м² | 1800.0 | 5500 | ai_wrk_road |
| works | wrk_roof_flat_concrete_screed | Цементная стяжка кровли h=50мм | м² | 650.0 | 2500 | ai_wrk_roofing_ext |
| works | wrk_rf2_flat_screed_40 | Устройство уклонообразующей стяжки 40мм | м² | 550.0 | 2500 | ai_wrk_roofing_full2 |
| works | wrk_scr_hydr_bitum | Гидроизоляция под стяжку (битум) | м² | 600.0 | 2500 | ai_wrk_screed_leveling |
| works | wrk_scr_sound_pe_10 | Звукоизоляция ПЭ 10мм (под стяжку) | м² | 300.0 | 2500 | ai_wrk_screed_leveling |
| works | wrk_scr_sound_pe_5 | Звукоизоляция ПЭ 5мм (под стяжку) | м² | 200.0 | 2500 | ai_wrk_screed_leveling |
| works | wrk_sp_floor_rubber_tile | Укладка резиновой плитки (площадка) | м² | 1800.0 | 5500 | ai_wrk_sports |
| works | wrk_floor_spc_click | Укладка SPC-плитки (замковая) | м² | 1200.0 | 5500 | ai_wrk_tiling |
| works | wrk_floor_spc_glue | Укладка SPC-плитки (клеевая) | м² | 1500.0 | 5500 | ai_wrk_tiling |
| works | wrk_floor_quartz_vinyl | Укладка кварц-виниловой плитки | м² | 1200.0 | 5500 | ai_wrk_tiling |
| works | wrk_tf_vinyl_click | Укладка виниловой плитки (замковая) | м² | 1800.0 | 5500 | ai_wrk_tiling_floor_ext |
| works | wrk_tf_lvt_click | Укладка кварц-виниловой плитки (SPC) | м² | 2000.0 | 5500 | ai_wrk_tiling_floor_ext |
| works | wrk_tf_carpet_tile | Укладка ковровой плитки | м² | 1400.0 | 5500 | ai_wrk_tiling_floor_ext |
| works | wrk_tile_lay_brick | Укладка «кирпичная кладка» | м² | 110.0 | 6500 | ai_wrk_tiling_full |
| works | formwork_remove | Демонтаж опалубки | м² | 1200.0 | 3500 | aipricedatabase |
| works | demolish_wall_gkl | Демонтаж стены ГКЛ | м² | 1000.0 | 3800 | aipricedatabase |
| works | glass_block_lay | Кладка стеклоблоков | м² | 10000.0 | 3800 | aipricedatabase |
| works | plaster_ceiling | Штукатурка потолков | м² | 6000.0 | 2200 | aipricedatabase |
