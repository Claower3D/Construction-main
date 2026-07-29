// ========== AI ESTIMATOR v2.0 ==========
// ИИ-Сметчик с группировкой по разделам работ
// Каждый блок = отдельный вид работ со своими материалами

(function () {
    'use strict';

    // ========== РАЗДЕЛЫ СМЕТЫ ==========
    // Каждый раздел содержит свои материалы и работы

    const ESTIMATE_SECTIONS = {
        // === ЗЕМЛЯНЫЕ РАБОТЫ ===
        earthwork: {
            code: '01',
            name: 'Земляные работы',
            icon: '🏗️',
            items: {
                excavation: {
                    name: 'Разработка грунта',
                    materials: [],
                    works: [
                        { code: 'excavation_manual', formula: (p) => p.excavationVolume || (p.perimeter * p.width * (p.height + p.depth) * 1.5) }
                    ]
                },
                backfill: {
                    name: 'Обратная засыпка',
                    materials: [],
                    works: [
                        { code: 'backfill', formula: (p) => p.backfillVolume || (p.excavationVolume * 0.3) }
                    ]
                }
            }
        },

        // === ПОДГОТОВКА ОСНОВАНИЯ ===
        foundation_prep: {
            code: '02',
            name: 'Подготовка основания',
            icon: '⬛',
            items: {
                sand_cushion: {
                    name: 'Песчаная подушка',
                    materials: [
                        { code: 'sand_career', formula: (p) => p.cushionArea * 0.2 }
                    ],
                    works: [
                        { code: 'sand_cushion', formula: (p) => p.cushionArea }
                    ]
                },
                gravel_cushion: {
                    name: 'Щебёночная подготовка',
                    materials: [
                        { code: 'gravel_5_20', formula: (p) => p.cushionArea * 0.15 }
                    ],
                    works: [
                        { code: 'gravel_cushion', formula: (p) => p.cushionArea }
                    ]
                },
                geotextile: {
                    name: 'Геотекстиль',
                    materials: [
                        { code: 'geotextile', formula: (p) => p.cushionArea * 1.1 }
                    ],
                    works: []
                }
            }
        },

        // === ОПАЛУБОЧНЫЕ РАБОТЫ ===
        formwork: {
            code: '03',
            name: 'Опалубочные работы',
            icon: '📐',
            items: {
                formwork_install: {
                    name: 'Монтаж опалубки',
                    materials: [
                        { code: 'formwork_plywood', formula: (p) => p.formworkArea }
                    ],
                    works: [
                        { code: 'formwork_install', formula: (p) => p.formworkArea }
                    ]
                },
                formwork_remove: {
                    name: 'Демонтаж опалубки',
                    materials: [],
                    works: [
                        { code: 'formwork_remove', formula: (p) => p.formworkArea }
                    ]
                }
            }
        },

        // === АРМАТУРНЫЕ РАБОТЫ ===
        reinforcement: {
            code: '04',
            name: 'Арматурные работы',
            icon: '🔩',
            items: {
                rebar_d12: {
                    name: 'Арматура d12',
                    materials: [
                        { code: 'd12', formula: (p) => p.rebarLength * 0.888 }  // кг
                    ],
                    works: [
                        { code: 'reinforcement', formula: (p) => p.rebarLength * 0.888 }
                    ]
                },
                rebar_d14: {
                    name: 'Арматура d14',
                    materials: [
                        { code: 'd14', formula: (p) => p.rebarLength14 * 1.21 }
                    ],
                    works: [
                        { code: 'reinforcement', formula: (p) => p.rebarLength14 * 1.21 }
                    ]
                },
                mesh: {
                    name: 'Армирующая сетка',
                    materials: [
                        { code: 'mesh_100x100x4', formula: (p) => p.meshArea }
                    ],
                    works: []
                }
            }
        },

        // === БЕТОННЫЕ РАБОТЫ ===
        concreting: {
            code: '05',
            name: 'Бетонные работы',
            icon: '🧱',
            items: {
                concrete_m300: {
                    name: 'Бетонирование М300',
                    materials: [
                        { code: 'M300', formula: (p) => p.concreteVolume * 1.05 }
                    ],
                    works: [
                        { code: 'concrete_pour', formula: (p) => p.concreteVolume }
                    ]
                },
                concrete_m350: {
                    name: 'Бетонирование М350',
                    materials: [
                        { code: 'M350', formula: (p) => p.concreteVolume350 * 1.05 }
                    ],
                    works: [
                        { code: 'concrete_slab', formula: (p) => p.concreteVolume350 }
                    ]
                }
            }
        },

        // === КЛАДОЧНЫЕ РАБОТЫ ===
        masonry: {
            code: '06',
            name: 'Кладочные работы',
            icon: '🧱',
            items: {
                brick: {
                    name: 'Кирпичная кладка',
                    materials: [
                        { code: 'brick_red', formula: (p) => p.brickArea * 50 },
                        { code: 'mortar_M100', formula: (p) => p.brickArea * 0.02 }
                    ],
                    works: [
                        { code: 'brick_laying', formula: (p) => p.brickArea }
                    ]
                },
                block: {
                    name: 'Кладка газоблоков',
                    materials: [
                        { code: 'block_gas_500', formula: (p) => p.blockArea * 12 },
                        { code: 'glue_summer', formula: (p) => p.blockArea * 1.5 }
                    ],
                    works: [
                        { code: 'block_laying', formula: (p) => p.blockArea }
                    ]
                }
            }
        },

        // === ГИДРОИЗОЛЯЦИЯ ===
        waterproofing: {
            code: '07',
            name: 'Гидроизоляция',
            icon: '💧',
            items: {
                bitumen: {
                    name: 'Обмазочная гидроизоляция',
                    materials: [
                        { code: 'bitumen_primer', formula: (p) => p.waterproofArea * 0.3 },
                        { code: 'bitumen_mastic', formula: (p) => p.waterproofArea * 1.5 }
                    ],
                    works: [
                        { code: 'waterproofing', formula: (p) => p.waterproofArea }
                    ]
                },
                membrane: {
                    name: 'Плёночная гидроизоляция',
                    materials: [
                        { code: 'pe_film', formula: (p) => p.filmArea * 1.1 }
                    ],
                    works: []
                }
            }
        },

        // === СТЯЖКА И ПОЛЫ ===
        flooring: {
            code: '08',
            name: 'Устройство полов',
            icon: '🏠',
            items: {
                screed: {
                    name: 'Цементная стяжка',
                    materials: [
                        { code: 'peskobeton_M300', formula: (p) => p.screedArea * p.screedThickness * 1.05 },
                        { code: 'pe_film', formula: (p) => p.screedArea * 1.1 }
                    ],
                    works: [
                        { code: 'screed', formula: (p) => p.screedArea }
                    ]
                }
            }
        },

        // === ТРУБОПРОВОДНЫЕ РАБОТЫ ===
        piping: {
            code: '09',
            name: 'Трубопроводные работы',
            icon: '🚧',
            items: {
                pipe_pvc: {
                    name: 'Прокладка ПВХ трубы',
                    materials: [
                        { code: 'pipe_pvc_110', formula: (p) => p.pipeLength },
                        { code: 'pipe_fitting_pvc', formula: (p) => Math.ceil(p.pipeLength / 6) }
                    ],
                    works: [
                        { code: 'pipe_pvc_lay', formula: (p) => p.pipeLength },
                        { code: 'pipe_test', formula: (p) => p.pipeLength }
                    ]
                },
                pipe_metal: {
                    name: 'Прокладка стальной трубы',
                    materials: [
                        { code: 'pipe_metal_100', formula: (p) => p.pipeLength },
                        { code: 'pipe_fitting_metal', formula: (p) => Math.ceil(p.pipeLength / 6) }
                    ],
                    works: [
                        { code: 'pipe_metal_lay', formula: (p) => p.pipeLength },
                        { code: 'pipe_test', formula: (p) => p.pipeLength }
                    ]
                },
                pipe_hdpe: {
                    name: 'Прокладка ПНД трубы',
                    materials: [
                        { code: 'pipe_hdpe_110', formula: (p) => p.pipeLength },
                        { code: 'pipe_fitting_pvc', formula: (p) => Math.ceil(p.pipeLength / 6) }
                    ],
                    works: [
                        { code: 'pipe_hdpe_lay', formula: (p) => p.pipeLength },
                        { code: 'pipe_test', formula: (p) => p.pipeLength }
                    ]
                },
                trench_for_pipe: {
                    name: 'Траншея под трубопровод',
                    materials: [
                        { code: 'sand_career', formula: (p) => p.trenchLength * 0.3 * 0.15 }
                    ],
                    works: [
                        { code: 'pipe_trench', formula: (p) => p.trenchLength }
                    ]
                },
                manhole: {
                    name: 'Смотровой колодец',
                    materials: [
                        { code: 'manhole_cover', formula: (p) => p.manholeCount || 1 }
                    ],
                    works: [
                        { code: 'manhole_install', formula: (p) => p.manholeCount || 1 }
                    ]
                }
            }
        },

        // === ТЕПЛОИЗОЛЯЦИЯ ===
        insulation_thermal: {
            code: '10',
            name: 'Теплоизоляция',
            icon: '❄️',
            items: {
                wall_insulation: {
                    name: 'Утепление стен',
                    materials: [
                        { code: 'eps_100', formula: (p) => p.insulationArea },
                        { code: 'dowel_8x80', formula: (p) => p.insulationArea * 5 }
                    ],
                    works: [
                        { code: 'wall_insulation', formula: (p) => p.insulationArea }
                    ]
                },
                floor_insulation: {
                    name: 'Утепление пола',
                    materials: [
                        { code: 'xps_50', formula: (p) => p.insulationArea },
                        { code: 'pe_film', formula: (p) => p.insulationArea * 1.1 }
                    ],
                    works: [
                        { code: 'floor_insulation', formula: (p) => p.insulationArea }
                    ]
                }
            }
        },

        // === СВАЙНЫЕ РАБОТЫ ===
        piling: {
            code: '11',
            name: 'Свайные работы',
            icon: '⛓️',
            items: {
                screw_pile: {
                    name: 'Устройство винтовой сваи',
                    materials: [
                        { code: 'pile_screw_108', formula: (p) => p.pileCount },
                        { code: 'M300', formula: (p) => p.pileCount * 0.05 }
                    ],
                    works: [
                        { code: 'screw_pile', formula: (p) => p.pileCount },
                        { code: 'pile_reinforcing', formula: (p) => p.pileCount }
                    ]
                },
                bored_pile: {
                    name: 'Буронабивная свая',
                    materials: [
                        { code: 'pile_casing_300', formula: (p) => p.pileCount },
                        { code: 'M300', formula: (p) => p.pileCount * 0.15 },
                        { code: 'd12', formula: (p) => p.pileCount * 4 * p.pileDepth * 0.888 }
                    ],
                    works: [
                        { code: 'pile_drilling', formula: (p) => p.pileCount * p.pileDepth },
                        { code: 'pile_reinforcing', formula: (p) => p.pileCount },
                        { code: 'pile_concreting', formula: (p) => p.pileCount * 0.15 }
                    ]
                }
            }
        },

        // === ШТУКАТУРНЫЕ РАБОТЫ ===
        plastering: {
            code: '12',
            name: 'Штукатурные работы',
            icon: '🎨',
            items: {
                plaster_walls: {
                    name: 'Штукатурка стен',
                    materials: [
                        { code: 'plaster_hp_start', formula: (p) => (p.wallArea || 0) * 10 * ((p.plasterThickness || 20) / 10) },
                        { code: 'plaster_beacon', formula: (p) => Math.ceil((p.wallArea || 0) / 3) },
                        { code: 'primer_deep', formula: (p) => (p.wallArea || 0) * 0.15 }
                    ],
                    works: [
                        { code: 'plaster_beacons', formula: (p) => p.wallArea || 0 },
                        { code: 'plaster_walls_manual', formula: (p) => p.wallArea || 0 }
                    ]
                },
                plaster_ceiling: {
                    name: 'Штукатурка потолков',
                    materials: [
                        { code: 'plaster_rotband', formula: (p) => (p.ceilingArea || 0) * 8.5 },
                        { code: 'primer_deep', formula: (p) => (p.ceilingArea || 0) * 0.15 }
                    ],
                    works: [
                        { code: 'plaster_ceiling', formula: (p) => p.ceilingArea || 0 }
                    ]
                },
                plaster_slopes: {
                    name: 'Штукатурка откосов',
                    materials: [
                        { code: 'plaster_hp_start', formula: (p) => (p.slopeLength || 0) * 2.5 }
                    ],
                    works: [
                        { code: 'plaster_slopes', formula: (p) => p.slopeLength || 0 }
                    ]
                }
            }
        },

        // === МАЛЯРНЫЕ РАБОТЫ ===
        painting: {
            code: '13',
            name: 'Малярные работы',
            icon: '🖌️',
            items: {
                putty: {
                    name: 'Шпаклёвка стен и потолков',
                    materials: [
                        { code: 'putty_hp_finish', formula: (p) => ((p.wallArea || 0) + (p.ceilingArea || 0)) * 1.2 },
                        { code: 'primer_deep', formula: (p) => ((p.wallArea || 0) + (p.ceilingArea || 0)) * 0.15 }
                    ],
                    works: [
                        { code: 'putty_base', formula: (p) => (p.wallArea || 0) + (p.ceilingArea || 0) },
                        { code: 'putty_finish', formula: (p) => (p.wallArea || 0) + (p.ceilingArea || 0) },
                        { code: 'sanding', formula: (p) => (p.wallArea || 0) + (p.ceilingArea || 0) }
                    ]
                },
                painting_walls: {
                    name: 'Покраска стен',
                    materials: [
                        { code: 'paint_interior_white', formula: (p) => (p.paintWallArea || 0) * 0.15 * 2 },
                        { code: 'primer_deep', formula: (p) => (p.paintWallArea || 0) * 0.15 }
                    ],
                    works: [
                        { code: 'priming', formula: (p) => p.paintWallArea || 0 },
                        { code: 'painting_2_coats', formula: (p) => p.paintWallArea || 0 }
                    ]
                },
                wallpaper: {
                    name: 'Поклейка обоев',
                    materials: [
                        { code: 'wallpaper_vinyl', formula: (p) => Math.ceil((p.wallpaperArea || 0) * 0.2) },
                        { code: 'wallpaper_glue', formula: (p) => Math.ceil((p.wallpaperArea || 0) * 0.2) * 0.25 }
                    ],
                    works: [
                        { code: 'wallpaper_paste', formula: (p) => p.wallpaperArea || 0 }
                    ]
                },
                painting_ceiling: {
                    name: 'Покраска потолков',
                    materials: [
                        { code: 'paint_ceiling', formula: (p) => (p.ceilingArea || 0) * 0.12 * 2 }
                    ],
                    works: [
                        { code: 'painting_ceiling', formula: (p) => p.ceilingArea || 0 }
                    ]
                }
            }
        },

        // === ПЛИТОЧНЫЕ РАБОТЫ ===
        tiling: {
            code: '14',
            name: 'Плиточные работы',
            icon: '🪟',
            items: {
                tile_wall: {
                    name: 'Облицовка стен плиткой',
                    materials: [
                        { code: 'tile_ceramic_wall', formula: (p) => (p.tileWallArea || 0) * 1.10 },
                        { code: 'tile_adhesive_cm11', formula: (p) => (p.tileWallArea || 0) * 3 },
                        { code: 'tile_grout', formula: (p) => (p.tileWallArea || 0) * 0.4 }
                    ],
                    works: [
                        { code: 'tile_wall_lay', formula: (p) => p.tileWallArea || 0 },
                        { code: 'tile_grouting', formula: (p) => p.tileWallArea || 0 }
                    ]
                },
                tile_floor: {
                    name: 'Облицовка пола плиткой',
                    materials: [
                        { code: 'tile_ceramic_floor', formula: (p) => (p.tileFloorArea || 0) * 1.10 },
                        { code: 'tile_adhesive_cm14', formula: (p) => (p.tileFloorArea || 0) * 3.5 },
                        { code: 'tile_grout', formula: (p) => (p.tileFloorArea || 0) * 0.4 }
                    ],
                    works: [
                        { code: 'tile_floor_lay', formula: (p) => p.tileFloorArea || 0 },
                        { code: 'tile_grouting', formula: (p) => p.tileFloorArea || 0 }
                    ]
                },
                waterproof_bathroom: {
                    name: 'Гидроизоляция санузла',
                    materials: [
                        { code: 'aquastop', formula: (p) => (p.wetArea || 0) * 1.5 },
                        { code: 'sealing_tape', formula: (p) => (p.wetArea || 0) * 0.5 }
                    ],
                    works: [
                        { code: 'waterproof_bathroom', formula: (p) => p.wetArea || 0 }
                    ]
                }
            }
        },

        // === ЭЛЕКТРОМОНТАЖНЫЕ РАБОТЫ ===
        electrical: {
            code: '15',
            name: 'Электромонтажные работы',
            icon: '⚡',
            items: {
                wiring: {
                    name: 'Электропроводка',
                    materials: [
                        { code: 'cable_vvg_3x2_5', formula: (p) => (p.outletCount || 0) * 8 },
                        { code: 'cable_vvg_3x1_5', formula: (p) => (p.switchCount || 0) * 6 },
                        { code: 'corrugation_20', formula: (p) => ((p.outletCount || 0) * 8 + (p.switchCount || 0) * 6) },
                        { code: 'junction_box', formula: (p) => (p.outletCount || 0) + (p.switchCount || 0) }
                    ],
                    works: [
                        { code: 'strobing_wall', formula: (p) => ((p.outletCount || 0) + (p.switchCount || 0)) * 3 },
                        { code: 'cable_lay_hidden', formula: (p) => (p.outletCount || 0) * 8 + (p.switchCount || 0) * 6 }
                    ]
                },
                outlets: {
                    name: 'Розетки и выключатели',
                    materials: [
                        { code: 'outlet_double', formula: (p) => p.outletCount || 0 },
                        { code: 'switch_double', formula: (p) => p.switchCount || 0 }
                    ],
                    works: [
                        { code: 'outlet_install', formula: (p) => p.outletCount || 0 },
                        { code: 'switch_install', formula: (p) => p.switchCount || 0 }
                    ]
                },
                panel: {
                    name: 'Электрощит',
                    materials: [
                        { code: 'panel_12', formula: (p) => 1 },
                        { code: 'breaker_16a', formula: (p) => Math.ceil((p.switchCount || 4) / 2) },
                        { code: 'breaker_25a', formula: (p) => Math.ceil((p.outletCount || 8) / 3) },
                        { code: 'rcd_40a', formula: (p) => 1 }
                    ],
                    works: [
                        { code: 'panel_install', formula: (p) => 1 }
                    ]
                },
                lighting: {
                    name: 'Освещение',
                    materials: [
                        { code: 'led_spot', formula: (p) => p.lightPoints || 0 }
                    ],
                    works: [
                        { code: 'spot_install', formula: (p) => p.lightPoints || 0 }
                    ]
                }
            }
        },

        // === САНТЕХНИЧЕСКИЕ РАБОТЫ (ВНУТРЕННИЕ) ===
        plumbing_interior: {
            code: '16',
            name: 'Сантехнические работы',
            icon: '🚿',
            items: {
                water_supply: {
                    name: 'Водоснабжение',
                    materials: [
                        { code: 'pipe_ppr_20', formula: (p) => (p.waterLength || 0) },
                        { code: 'pipe_ppr_25', formula: (p) => (p.waterLength || 0) * 0.3 },
                        { code: 'fitting_ppr_angle', formula: (p) => Math.ceil((p.waterLength || 0) / 2) },
                        { code: 'fitting_ppr_valve', formula: (p) => (p.fixtureCount || 0) }
                    ],
                    works: [
                        { code: 'pipe_water_lay', formula: (p) => (p.waterLength || 0) * 1.3 }
                    ]
                },
                sewer: {
                    name: 'Канализация',
                    materials: [
                        { code: 'pipe_sewer_50', formula: (p) => (p.sewerLength || 0) * 0.6 },
                        { code: 'pipe_sewer_110', formula: (p) => (p.sewerLength || 0) * 0.4 }
                    ],
                    works: [
                        { code: 'pipe_sewer_lay', formula: (p) => p.sewerLength || 0 }
                    ]
                },
                fixtures: {
                    name: 'Сантехнические приборы',
                    materials: [
                        { code: 'toilet_basic', formula: (p) => p.toiletCount || 0 },
                        { code: 'sink_ceramic', formula: (p) => p.sinkCount || 0 },
                        { code: 'mixer_sink', formula: (p) => p.sinkCount || 0 },
                        { code: 'bathtub_acrylic_170', formula: (p) => p.bathCount || 0 },
                        { code: 'mixer_bath', formula: (p) => p.bathCount || 0 }
                    ],
                    works: [
                        { code: 'toilet_install', formula: (p) => p.toiletCount || 0 },
                        { code: 'sink_install', formula: (p) => p.sinkCount || 0 },
                        { code: 'bathtub_install', formula: (p) => p.bathCount || 0 },
                        { code: 'mixer_install', formula: (p) => (p.sinkCount || 0) + (p.bathCount || 0) }
                    ]
                }
            }
        },

        // === ПОТОЛКИ ===
        ceiling: {
            code: '17',
            name: 'Потолочные работы',
            icon: '⬆️',
            items: {
                stretch_ceiling: {
                    name: 'Натяжной потолок',
                    materials: [
                        { code: 'stretch_ceiling_pvc', formula: (p) => p.ceilingArea || 0 }
                    ],
                    works: [
                        { code: 'ceiling_stretch_install', formula: (p) => p.ceilingArea || 0 }
                    ]
                },
                gkl_ceiling: {
                    name: 'Потолок из ГКЛ',
                    materials: [
                        { code: 'gkl_potolok', formula: (p) => (p.ceilingArea || 0) * 1.05 },
                        { code: 'profile_cd60', formula: (p) => (p.ceilingArea || 0) * 2.9 },
                        { code: 'profile_ud27_ceiling', formula: (p) => Math.sqrt(p.ceilingArea || 10) * 4 },
                        { code: 'suspension_direct', formula: (p) => (p.ceilingArea || 0) * 1 }
                    ],
                    works: [
                        { code: 'ceiling_gkl_1level', formula: (p) => p.ceilingArea || 0 }
                    ]
                }
            }
        },

        // === ОТОПЛЕНИЕ ===
        heating_system: {
            code: '18',
            name: 'Отопление',
            icon: '🔥',
            items: {
                radiators: {
                    name: 'Радиаторное отопление',
                    materials: [
                        { code: 'radiator_bimetal_500', formula: (p) => (p.radiatorSections || 0) },
                        { code: 'pipe_ppr_heating_25', formula: (p) => (p.heatingPipeLength || 0) },
                        { code: 'valve_radiator', formula: (p) => (p.radiatorCount || 0) * 2 },
                        { code: 'thermostat_head', formula: (p) => p.radiatorCount || 0 }
                    ],
                    works: [
                        { code: 'radiator_install_bimetal', formula: (p) => p.radiatorCount || 0 },
                        { code: 'pipe_heating_lay_ppr', formula: (p) => p.heatingPipeLength || 0 }
                    ]
                },
                underfloor: {
                    name: 'Тёплый пол',
                    materials: [
                        { code: 'underfloor_pipe', formula: (p) => (p.underfloorArea || 0) * 6.5 },
                        { code: 'underfloor_mat', formula: (p) => p.underfloorArea || 0 },
                        { code: 'underfloor_manifold', formula: (p) => Math.ceil((p.underfloorArea || 10) / 15) }
                    ],
                    works: [
                        { code: 'underfloor_heating_install', formula: (p) => p.underfloorArea || 0 }
                    ]
                }
            }
        },

        // === ФАСАДНЫЕ РАБОТЫ ===
        facade_system: {
            code: '19',
            name: 'Фасадные работы',
            icon: '🏠',
            items: {
                facade_insulation: {
                    name: 'Утепление фасада',
                    materials: [
                        { code: 'facade_insul_eps_100', formula: (p) => (p.facadeArea || 0) },
                        { code: 'facade_adhesive', formula: (p) => (p.facadeArea || 0) * 5 },
                        { code: 'facade_mesh', formula: (p) => (p.facadeArea || 0) * 1.1 },
                        { code: 'facade_dowel_10x160', formula: (p) => (p.facadeArea || 0) * 5 }
                    ],
                    works: [
                        { code: 'facade_insul_eps', formula: (p) => p.facadeArea || 0 },
                        { code: 'facade_scaffold', formula: (p) => p.facadeArea || 0 }
                    ]
                },
                facade_finish: {
                    name: 'Отделка фасада',
                    materials: [
                        { code: 'facade_plaster_mineral', formula: (p) => (p.facadeArea || 0) * 3.5 }
                    ],
                    works: [
                        { code: 'facade_plaster_work', formula: (p) => p.facadeArea || 0 },
                        { code: 'facade_paint_work', formula: (p) => p.facadeArea || 0 }
                    ]
                }
            }
        }
    };

    // ========== РЕЦЕПТЫ ДЛЯ ТИПОВ ОБЪЕКТОВ ==========
    // Какие разделы и пункты включать для каждого типа

    const OBJECT_TO_SECTIONS = {
        'FOUNDATION_STRIP': {
            name: 'Ленточный фундамент',
            sections: [
                { section: 'earthwork', items: ['excavation'] },
                { section: 'foundation_prep', items: ['sand_cushion', 'gravel_cushion'] },
                { section: 'formwork', items: ['formwork_install'] },
                { section: 'reinforcement', items: ['rebar_d12'] },
                { section: 'concreting', items: ['concrete_m300'] },
                { section: 'waterproofing', items: ['bitumen'] }
            ],
            paramCalculator: (p) => ({
                excavationVolume: p.perimeter * p.width * (p.height + p.depth) * 1.5,
                cushionArea: p.perimeter * p.width,
                formworkArea: p.perimeter * (p.height + p.depth) * 2,
                rebarLength: p.perimeter * 8,
                concreteVolume: p.perimeter * p.width * (p.height + p.depth),
                waterproofArea: p.perimeter * (p.height + p.depth)
            }),
            defaultParams: { perimeter: 40, width: 0.4, height: 0.8, depth: 0.5 }
        },

        'FOUNDATION_SLAB': {
            name: 'Плитный фундамент',
            sections: [
                { section: 'earthwork', items: ['excavation'] },
                { section: 'foundation_prep', items: ['sand_cushion', 'gravel_cushion', 'geotextile'] },
                { section: 'reinforcement', items: ['rebar_d14'] },
                { section: 'concreting', items: ['concrete_m350'] }
            ],
            paramCalculator: (p) => ({
                excavationVolume: p.area * 0.5,
                cushionArea: p.area,
                rebarLength14: p.area * 2 * 6.6,
                concreteVolume350: p.area * p.thickness
            }),
            defaultParams: { area: 100, thickness: 0.3 }
        },

        'WALL_BRICK': {
            name: 'Кирпичная стена',
            sections: [
                { section: 'masonry', items: ['brick'] }
            ],
            paramCalculator: (p) => ({
                brickArea: p.area
            }),
            defaultParams: { area: 50, thickness: 0.25 }
        },

        'WALL_BLOCK': {
            name: 'Стена из газоблоков',
            sections: [
                { section: 'masonry', items: ['block'] }
            ],
            paramCalculator: (p) => ({
                blockArea: p.area
            }),
            defaultParams: { area: 50, thickness: 0.3 }
        },

        'FLOOR_SCREED': {
            name: 'Цементная стяжка',
            sections: [
                { section: 'foundation_prep', items: ['sand_cushion'] },
                { section: 'flooring', items: ['screed'] }
            ],
            paramCalculator: (p) => ({
                cushionArea: p.area,
                screedArea: p.area,
                screedThickness: p.thickness
            }),
            defaultParams: { area: 80, thickness: 0.05 }
        },

        // === Земляные работы ===

        'TRENCH': {
            name: 'Траншея',
            sections: [
                { section: 'earthwork', items: ['excavation', 'backfill'] }
            ],
            paramCalculator: (p) => ({
                excavationVolume: p.length * p.width * p.depth,
                backfillVolume: p.length * p.width * p.depth * 0.3,
                perimeter: p.length, width: p.width, height: 0, depth: p.depth
            }),
            defaultParams: { length: 10, width: 0.8, depth: 1.5 }
        },

        'PIT': {
            name: 'Котлован',
            sections: [
                { section: 'earthwork', items: ['excavation', 'backfill'] },
                { section: 'foundation_prep', items: ['sand_cushion', 'gravel_cushion'] }
            ],
            paramCalculator: (p) => ({
                excavationVolume: p.area * p.depth * 1.2,
                backfillVolume: p.area * p.depth * 0.25,
                cushionArea: p.area,
                perimeter: Math.sqrt(p.area) * 4, width: p.width || 1, height: 0, depth: p.depth
            }),
            defaultParams: { area: 40, depth: 2.5, width: 1.0 }
        },

        // === Гидроизоляция ===

        'WATERPROOFING': {
            name: 'Гидроизоляция',
            sections: [
                { section: 'waterproofing', items: ['bitumen', 'membrane'] }
            ],
            paramCalculator: (p) => ({
                waterproofArea: p.area,
                filmArea: p.area
            }),
            defaultParams: { area: 50 }
        },

        // === Теплоизоляция ===

        'INSULATION': {
            name: 'Теплоизоляция',
            sections: [
                { section: 'insulation_thermal', items: ['wall_insulation'] }
            ],
            paramCalculator: (p) => ({
                insulationArea: p.area
            }),
            defaultParams: { area: 50, thickness: 0.1 }
        },

        // === Трубопроводы ===

        'PIPE_PVC': {
            name: 'Трубопровод ПВХ',
            sections: [
                { section: 'piping', items: ['trench_for_pipe', 'pipe_pvc'] }
            ],
            paramCalculator: (p) => ({
                trenchLength: p.length,
                pipeLength: p.length
            }),
            defaultParams: { length: 10 }
        },

        'PIPE_METAL': {
            name: 'Трубопровод стальной',
            sections: [
                { section: 'piping', items: ['trench_for_pipe', 'pipe_metal'] }
            ],
            paramCalculator: (p) => ({
                trenchLength: p.length,
                pipeLength: p.length
            }),
            defaultParams: { length: 8 }
        },

        'PIPE_HDPE': {
            name: 'Трубопровод ПНД',
            sections: [
                { section: 'piping', items: ['trench_for_pipe', 'pipe_hdpe'] }
            ],
            paramCalculator: (p) => ({
                trenchLength: p.length,
                pipeLength: p.length
            }),
            defaultParams: { length: 15 }
        },

        'MANHOLE': {
            name: 'Смотровой колодец',
            sections: [
                { section: 'earthwork', items: ['excavation'] },
                { section: 'piping', items: ['manhole'] }
            ],
            paramCalculator: (p) => ({
                excavationVolume: p.count * 1.5 * 1.5 * 1.8,
                manholeCount: p.count,
                perimeter: 4.7, width: 0.5, height: 0, depth: 1.8
            }),
            defaultParams: { count: 1 }
        },

        // === Сваи ===

        'PILE': {
            name: 'Свайный фундамент',
            sections: [
                { section: 'piling', items: ['bored_pile'] }
            ],
            paramCalculator: (p) => ({
                pileCount: p.count,
                pileDepth: p.depth
            }),
            defaultParams: { count: 9, depth: 3.0 }
        },

        // === ОТДЕЛОЧНЫЕ ОБЪЕКТЫ ===

        'PLASTER': {
            name: 'Штукатурные работы',
            sections: [
                { section: 'plastering', items: ['plaster_walls'] }
            ],
            paramCalculator: (p) => ({
                wallArea: p.area,
                plasterThickness: p.thickness || 20,
                slopeLength: 0
            }),
            defaultParams: { area: 100, thickness: 20 }
        },

        'TILES_WALL': {
            name: 'Плитка настенная',
            sections: [
                { section: 'tiling', items: ['tile_wall', 'waterproof_bathroom'] }
            ],
            paramCalculator: (p) => ({
                tileWallArea: p.area,
                wetArea: p.area * 0.5
            }),
            defaultParams: { area: 25 }
        },

        'TILES_FLOOR': {
            name: 'Плитка напольная',
            sections: [
                { section: 'tiling', items: ['tile_floor'] }
            ],
            paramCalculator: (p) => ({
                tileFloorArea: p.area
            }),
            defaultParams: { area: 15 }
        },

        'PAINTING': {
            name: 'Малярные работы',
            sections: [
                { section: 'painting', items: ['putty', 'painting_walls', 'painting_ceiling'] }
            ],
            paramCalculator: (p) => ({
                wallArea: p.wallArea || p.area * 3,
                ceilingArea: p.area,
                paintWallArea: p.wallArea || p.area * 3
            }),
            defaultParams: { area: 80 }
        },

        'WALLPAPER': {
            name: 'Оклейка обоями',
            sections: [
                { section: 'painting', items: ['putty', 'wallpaper'] }
            ],
            paramCalculator: (p) => ({
                wallArea: p.wallArea || p.area * 3,
                ceilingArea: 0,
                wallpaperArea: p.wallArea || p.area * 3
            }),
            defaultParams: { area: 60 }
        },

        'WIRING': {
            name: 'Электропроводка',
            sections: [
                { section: 'electrical', items: ['wiring', 'outlets', 'panel', 'lighting'] }
            ],
            paramCalculator: (p) => ({
                outletCount: p.outletCount || Math.ceil(p.area / 5),
                switchCount: p.switchCount || Math.ceil(p.area / 15),
                lightPoints: p.lightPoints || Math.ceil(p.area / 5)
            }),
            defaultParams: { area: 80, outletCount: 16, switchCount: 6, lightPoints: 12 }
        },

        'PIPE_WATER': {
            name: 'Водоснабжение',
            sections: [
                { section: 'plumbing_interior', items: ['water_supply', 'fixtures'] }
            ],
            paramCalculator: (p) => ({
                waterLength: p.length || 15,
                fixtureCount: (p.sinkCount || 0) + (p.toiletCount || 0) + (p.bathCount || 0),
                sinkCount: p.sinkCount || 2,
                toiletCount: p.toiletCount || 1,
                bathCount: p.bathCount || 1,
                sewerLength: 0
            }),
            defaultParams: { length: 15, sinkCount: 2, toiletCount: 1, bathCount: 1 }
        },

        'PIPE_SEWER': {
            name: 'Канализация',
            sections: [
                { section: 'plumbing_interior', items: ['sewer'] }
            ],
            paramCalculator: (p) => ({
                sewerLength: p.length || 10,
                waterLength: 0, fixtureCount: 0, sinkCount: 0, toiletCount: 0, bathCount: 0
            }),
            defaultParams: { length: 10 }
        },

        'ROOF_METAL': {
            name: 'Металлическая кровля',
            sections: [
                { section: 'roofing_structure', items: ['rafter', 'batten', 'roof_cover'] },
                { section: 'insulation_thermal', items: ['wall_insulation'] }
            ],
            paramCalculator: (p) => ({
                roofArea: p.area,
                insulationArea: p.area,
                perimeter: Math.sqrt(p.area) * 4
            }),
            defaultParams: { area: 120 }
        },

        // === ПОЛНАЯ ОТДЕЛКА КВАРТИРЫ ===

        'FULL_RENOVATION': {
            name: 'Полная отделка квартиры',
            sections: [
                { section: 'plastering', items: ['plaster_walls'] },
                { section: 'painting', items: ['putty', 'painting_walls', 'painting_ceiling'] },
                { section: 'tiling', items: ['tile_wall', 'tile_floor', 'waterproof_bathroom'] },
                { section: 'flooring', items: ['screed', 'laminate'] },
                { section: 'electrical', items: ['wiring', 'outlets', 'panel', 'lighting'] },
                { section: 'plumbing_interior', items: ['water_supply', 'sewer', 'fixtures'] },
                { section: 'ceiling', items: ['stretch_ceiling'] }
            ],
            paramCalculator: (p) => {
                const floorArea = p.area || 80;
                const wallArea = floorArea * 3;
                const rooms = p.rooms || Math.ceil(floorArea / 18);
                return {
                    wallArea: wallArea,
                    ceilingArea: floorArea,
                    plasterThickness: 20,
                    slopeLength: rooms * 6,
                    paintWallArea: wallArea * 0.6,
                    wallpaperArea: 0,
                    tileWallArea: 12,
                    tileFloorArea: 8,
                    wetArea: 8,
                    screedArea: floorArea,
                    screedThickness: 0.05,
                    outletCount: rooms * 4 + 4,
                    switchCount: rooms + 2,
                    lightPoints: rooms * 3,
                    waterLength: 15,
                    sewerLength: 10,
                    fixtureCount: 4,
                    toiletCount: 1,
                    sinkCount: 2,
                    bathCount: 1
                };
            },
            defaultParams: { area: 80, rooms: 3 }
        }
    };

    // ========== КЛАСС ГЕНЕРАТОРА СМЕТ ==========

    class AIEstimatorV2 {
        constructor(region = 'Алматы') {
            this.region = region;
            this.priceDB = window.AIPriceDatabase;
        }

        // Генерация сметы по разделам
        generateEstimate(objectType, inputParams = {}) {
            const recipe = OBJECT_TO_SECTIONS[objectType];

            if (!recipe) {
                return {
                    success: false,
                    error: `Неизвестный тип: ${objectType}`,
                    supportedTypes: Object.keys(OBJECT_TO_SECTIONS)
                };
            }

            // Объединяем параметры
            const params = { ...recipe.defaultParams, ...inputParams };

            // Расчёт производных параметров
            const calculatedParams = recipe.paramCalculator(params);
            const fullParams = { ...params, ...calculatedParams };

            // Результат
            const result = {
                objectType,
                objectName: recipe.name,
                inputParams: params,
                calculatedParams,
                sections: [],
                totals: { materials: 0, works: 0, total: 0 },
                region: this.region,
                generatedAt: new Date().toISOString()
            };

            // Обходим разделы
            recipe.sections.forEach(sectionRef => {
                const sectionDef = ESTIMATE_SECTIONS[sectionRef.section];
                if (!sectionDef) return;

                const section = {
                    code: sectionDef.code,
                    name: sectionDef.name,
                    icon: sectionDef.icon,
                    items: [],
                    subtotal: { materials: 0, works: 0, total: 0 }
                };

                // Обходим пункты раздела
                sectionRef.items.forEach(itemKey => {
                    const itemDef = sectionDef.items[itemKey];
                    if (!itemDef) return;

                    const item = {
                        name: itemDef.name,
                        materials: [],
                        works: [],
                        subtotal: { materials: 0, works: 0, total: 0 }
                    };

                    // Материалы
                    itemDef.materials.forEach(mat => {
                        const quantity = mat.formula(fullParams);
                        if (quantity > 0) {
                            const priceData = this.priceDB?.getMaterialPrice(mat.code, this.region);
                            if (priceData) {
                                const sum = Math.round(quantity * priceData.adjustedPrice);
                                item.materials.push({
                                    code: mat.code,
                                    name: priceData.name,
                                    quantity: Math.round(quantity * 100) / 100,
                                    unit: priceData.unit,
                                    unitPrice: priceData.adjustedPrice,
                                    sum
                                });
                                item.subtotal.materials += sum;
                            }
                        }
                    });

                    // Работы
                    itemDef.works.forEach(work => {
                        const quantity = work.formula(fullParams);
                        if (quantity > 0) {
                            const priceData = this.priceDB?.getWorkPrice(work.code, this.region);
                            if (priceData) {
                                const sum = Math.round(quantity * priceData.adjustedPrice);
                                item.works.push({
                                    code: work.code,
                                    name: priceData.name,
                                    quantity: Math.round(quantity * 100) / 100,
                                    unit: priceData.unit,
                                    unitPrice: priceData.adjustedPrice,
                                    sum
                                });
                                item.subtotal.works += sum;
                            }
                        }
                    });

                    item.subtotal.total = item.subtotal.materials + item.subtotal.works;

                    if (item.subtotal.total > 0) {
                        section.items.push(item);
                        section.subtotal.materials += item.subtotal.materials;
                        section.subtotal.works += item.subtotal.works;
                        section.subtotal.total += item.subtotal.total;
                    }
                });

                if (section.items.length > 0) {
                    result.sections.push(section);
                    result.totals.materials += section.subtotal.materials;
                    result.totals.works += section.subtotal.works;
                    result.totals.total += section.subtotal.total;
                }
            });

            return { success: true, data: result };
        }

        // Форматирование для вывода
        formatEstimate(estimate) {
            if (!estimate.success) return estimate.error;

            const data = estimate.data;
            let output = `\n📋 СМЕТА: ${data.objectName}\n`;
            output += `📍 Регион: ${data.region}\n`;
            output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

            data.sections.forEach(section => {
                output += `${section.icon} ${section.code}. ${section.name}\n`;
                output += `────────────────────────────────────────\n`;

                section.items.forEach(item => {
                    output += `   📌 ${item.name}\n`;

                    item.materials.forEach(m => {
                        output += `      • ${m.name}: ${m.quantity} ${m.unit} × ${m.unitPrice.toLocaleString()}₸ = ${m.sum.toLocaleString()}₸\n`;
                    });

                    item.works.forEach(w => {
                        output += `      🔧 ${w.name}: ${w.quantity} ${w.unit} × ${w.unitPrice.toLocaleString()}₸ = ${w.sum.toLocaleString()}₸\n`;
                    });

                    output += `      Итого: ${item.subtotal.total.toLocaleString()}₸\n\n`;
                });

                output += `   ▶ ИТОГО по разделу: ${section.subtotal.total.toLocaleString()}₸\n`;
                output += `     (материалы: ${section.subtotal.materials.toLocaleString()}₸, работы: ${section.subtotal.works.toLocaleString()}₸)\n\n`;
            });

            output += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
            output += `💰 ИТОГО ПО СМЕТЕ:\n`;
            output += `   Материалы: ${data.totals.materials.toLocaleString()}₸\n`;
            output += `   Работы: ${data.totals.works.toLocaleString()}₸\n`;
            output += `   ═══════════════════════════════════\n`;
            output += `   ВСЕГО: ${data.totals.total.toLocaleString()}₸\n`;

            return output;
        }

        // Получить структуру разделов
        getSections() {
            return ESTIMATE_SECTIONS;
        }

        // Получить типы объектов
        getObjectTypes() {
            return Object.entries(OBJECT_TO_SECTIONS).map(([code, def]) => ({
                code,
                name: def.name,
                defaultParams: def.defaultParams
            }));
        }

        setRegion(region) {
            this.region = region;
        }
    }

    // ========== SINGLETON ==========
    const estimatorV2 = new AIEstimatorV2('Алматы');

    // ========== EXPORT ==========
    window.AIEstimatorV2 = AIEstimatorV2;
    window.AIEstimatorInstance = estimatorV2;  // Заменяем старый
    window.ESTIMATE_SECTIONS = ESTIMATE_SECTIONS;

    console.log('✅ AI Estimator v2.0 loaded (с группировкой по разделам)');
})();
