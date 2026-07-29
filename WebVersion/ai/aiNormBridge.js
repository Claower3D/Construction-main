// ========== AI NORM BRIDGE v1.0 ==========
// Мост: AI-детекции фото → AIEstimatorV2 (формулы материалов + цены)
// Превращает обнаруженные объекты в детальную смету с материалами

(function () {
    'use strict';

    // ========== МАППИНГ: AI класс → тип объекта AIEstimatorV2 ==========
    // Связывает AI-детекции с "рецептами" из aiEstimator.js
    // Все 20 классов из aiMockService.js должны иметь маппинг
    const AI_CLASS_TO_ESTIMATOR = {
        // === Земляные ===
        'trench': {
            objectType: 'TRENCH',
            convertParams: (det) => ({
                length: det.widthM || 10,
                width: det.heightM || 0.8,
                depth: det.depthM || 1.5
            })
        },
        'pit': {
            objectType: 'PIT',
            convertParams: (det) => ({
                area: det.areaM2 || 40,
                depth: det.depthM || 2.5,
                width: det.widthM || 1.0
            })
        },

        // === Фундаменты ===
        'foundation': {
            objectType: 'FOUNDATION_STRIP',
            altType: 'FOUNDATION_SLAB',
            selectType: (det) => {
                if (det.depthM && det.depthM < 0.4) return 'FOUNDATION_SLAB';
                return 'FOUNDATION_STRIP';
            },
            convertParams: (det) => {
                const area = det.areaM2 || 50;
                if (det.depthM && det.depthM < 0.4) {
                    return { area: area, thickness: det.depthM || 0.3 };
                }
                const side = Math.sqrt(area);
                const perimeter = side * 4;
                return {
                    perimeter: Math.round(perimeter * 10) / 10,
                    width: det.widthM || 0.4,
                    height: det.heightM || 0.8,
                    depth: det.depthM || 0.5
                };
            }
        },

        // === Стены ===
        'wall_brick': {
            objectType: 'WALL_BRICK',
            convertParams: (det) => ({
                area: det.areaM2 || 50,
                thickness: det.depthM || 0.25
            })
        },
        'wall_block': {
            objectType: 'WALL_BLOCK',
            convertParams: (det) => ({
                area: det.areaM2 || 50,
                thickness: det.depthM || 0.3
            })
        },

        // === Бетонные конструкции ===
        'concrete_slab': {
            objectType: 'FLOOR_SCREED',
            convertParams: (det) => ({
                area: det.areaM2 || 80,
                thickness: det.depthM || 0.05
            })
        },
        'formwork': {
            objectType: 'FOUNDATION_STRIP',
            convertParams: (det) => {
                const area = det.areaM2 || 30;
                const side = Math.sqrt(area * 2);
                return {
                    perimeter: Math.round(side * 4 * 10) / 10,
                    width: 0.4, height: 0.8, depth: 0.5
                };
            }
        },
        'rebar': {
            objectType: 'FOUNDATION_STRIP',
            convertParams: (det) => {
                const area = det.areaM2 || 40;
                const side = Math.sqrt(area);
                return {
                    perimeter: Math.round(side * 4 * 10) / 10,
                    width: 0.4, height: 0.8, depth: 0.5
                };
            }
        },

        // === Подготовка ===
        'sand_bed': {
            objectType: 'FOUNDATION_SLAB',
            convertParams: (det) => ({
                area: det.areaM2 || 60,
                thickness: 0.3
            })
        },
        'gravel_bed': {
            objectType: 'FOUNDATION_SLAB',
            convertParams: (det) => ({
                area: det.areaM2 || 60,
                thickness: 0.3
            })
        },

        // === Гидроизоляция и утепление ===
        'waterproofing': {
            objectType: 'WATERPROOFING',
            convertParams: (det) => ({
                area: det.areaM2 || 50
            })
        },
        'insulation': {
            objectType: 'INSULATION',
            convertParams: (det) => ({
                area: det.areaM2 || 50,
                thickness: 0.1
            })
        },

        // === Трубопроводы ===
        'pipe_pvc': {
            objectType: 'PIPE_PVC',
            convertParams: (det) => ({
                length: det.widthM || 10
            })
        },
        'pipe_metal': {
            objectType: 'PIPE_METAL',
            convertParams: (det) => ({
                length: det.widthM || 8
            })
        },
        'pipe_hdpe': {
            objectType: 'PIPE_HDPE',
            convertParams: (det) => ({
                length: det.widthM || 15
            })
        },
        'manhole': {
            objectType: 'MANHOLE',
            convertParams: (det) => ({
                count: 1
            })
        },

        // === Сваи ===
        'pile': {
            objectType: 'PILE',
            convertParams: (det) => ({
                count: 9,
                depth: det.heightM || 3.0
            })
        },

        // === Отделочные работы ===
        'plaster': {
            objectType: 'PLASTER',
            convertParams: (det) => ({
                area: det.areaM2 || 100,
                thickness: 20
            })
        },
        'tiles_wall': {
            objectType: 'TILES_WALL',
            convertParams: (det) => ({
                area: det.areaM2 || 25
            })
        },
        'tiles_floor': {
            objectType: 'TILES_FLOOR',
            convertParams: (det) => ({
                area: det.areaM2 || 15
            })
        },
        'painting': {
            objectType: 'PAINTING',
            convertParams: (det) => ({
                area: det.areaM2 || 80
            })
        },
        'wallpaper': {
            objectType: 'WALLPAPER',
            convertParams: (det) => ({
                area: det.areaM2 || 60
            })
        },

        // === Электрика ===
        'wiring': {
            objectType: 'WIRING',
            convertParams: (det) => ({
                area: det.areaM2 || 80,
                outletCount: 16,
                switchCount: 6,
                lightPoints: 12
            })
        },

        // === Сантехника внутренняя ===
        'pipe_water': {
            objectType: 'PIPE_WATER',
            convertParams: (det) => ({
                length: det.widthM || 15,
                sinkCount: 2,
                toiletCount: 1,
                bathCount: 1
            })
        },
        'pipe_sewer': {
            objectType: 'PIPE_SEWER',
            convertParams: (det) => ({
                length: det.widthM || 10
            })
        },

        // === Кровля ===
        'roof_metal': {
            objectType: 'ROOF_METAL',
            convertParams: (det) => ({
                area: det.areaM2 || 120
            })
        },

        // === Фасад ===
        'facade': {
            objectType: 'FACADE',
            convertParams: (det) => ({
                facadeArea: det.areaM2 || 100
            })
        },

        // === Полная отделка ===
        'full_renovation': {
            objectType: 'FULL_RENOVATION',
            convertParams: (det) => ({
                area: det.areaM2 || 80,
                rooms: 3
            })
        },

        // === Вспомогательные (без сметы) ===
        'person': null,
        'measuring_tape': null,
        'excavator_bucket': null
    };

    // ========== ИНТЕЛЛЕКТУАЛЬНЫЙ ПАРСЕР ОПИСАНИЯ ==========

    /**
     * Парсит текстовое описание и извлекает параметры для сметы
     * Пример: "3-комн. квартира 85м², полный ремонт, электрика, сантехника"
     * @param {string} text - описание объекта
     * @returns {Object} { detections: [...], params: {...} }
     */
    function parseDescription(text) {
        if (!text) return null;
        const lower = text.toLowerCase().trim();
        const detections = [];
        const params = {};

        // --- Извлечение площади ---
        const areaMatch = lower.match(/(\d+)\s*(?:м²|кв\.?\s*м|m2|sqm|квадрат)/);
        if (areaMatch) {
            params.area = parseFloat(areaMatch[1]);
        }

        // --- Извлечение комнат ---
        const roomMatch = lower.match(/(\d+)\s*(?:-?\s*комн|ком\.|room)/);
        if (roomMatch) {
            params.rooms = parseInt(roomMatch[1]);
        }

        // --- Извлечение длины ---
        const lengthMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:м\b|метр|п\.?\s*м)/);
        if (lengthMatch && !areaMatch) {
            params.length = parseFloat(lengthMatch[1]);
        }

        // --- Определение типа работ ---
        const KEYWORD_MAP = {
            'полный ремонт|капитальный ремонт|полная отделка|ремонт квартиры|ремонт под ключ': {
                className: 'full_renovation', priority: 100
            },
            'штукатур|выравнивание стен|plaster': {
                className: 'plaster', priority: 10
            },
            'плитк|кафель|tile|облицовк': {
                className: 'tiles_wall', priority: 10
            },
            'покраск|малярн|окраск|paint': {
                className: 'painting', priority: 10
            },
            'обо[ий]|wallpaper|поклейк': {
                className: 'wallpaper', priority: 10
            },
            'электр|провод|розетк|выключател|wiring': {
                className: 'wiring', priority: 15
            },
            'сантехн|водопровод|канализ|plumbing|труб': {
                className: 'pipe_water', priority: 15
            },
            'фундамент|foundation': {
                className: 'foundation', priority: 20
            },
            'крыш|кровл|roof': {
                className: 'roof_metal', priority: 15
            },
            'фасад|facade|утепление фасада': {
                className: 'facade', priority: 15
            },
            'стен.*кирпич|кирпичн|brick': {
                className: 'wall_brick', priority: 10
            },
            'стен.*блок|газобетон|газоблок|block': {
                className: 'wall_block', priority: 10
            },
            'стяжк|screed': {
                className: 'concrete_slab', priority: 10
            },
            'потол|натяжн|ceiling': {
                className: 'ceiling', priority: 10
            },
            'отоплен|радиатор|тёплый пол|теплый пол|heating': {
                className: 'heating', priority: 10
            }
        };

        const matched = [];
        for (const [pattern, mapping] of Object.entries(KEYWORD_MAP)) {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(lower)) {
                matched.push(mapping);
            }
        }

        // Сортируем по приоритету
        matched.sort((a, b) => b.priority - a.priority);

        // Если нашли "полный ремонт", используем только его
        if (matched.length > 0 && matched[0].className === 'full_renovation') {
            const area = params.area || 80;
            detections.push({
                className: 'full_renovation',
                confidence: 0.95,
                areaM2: area,
                source: 'description_parser'
            });
        } else {
            // Добавляем все найденные
            for (const m of matched) {
                detections.push({
                    className: m.className,
                    confidence: 0.90,
                    areaM2: params.area || 50,
                    widthM: params.length || undefined,
                    source: 'description_parser'
                });
            }
        }

        // Если ничего не распознали, пробуем угадать
        if (detections.length === 0 && params.area) {
            detections.push({
                className: 'full_renovation',
                confidence: 0.70,
                areaM2: params.area,
                source: 'description_parser_guess'
            });
        }

        return {
            detections: detections,
            params: params,
            rawText: text
        };
    }

    // ========== ОСНОВНАЯ ФУНКЦИЯ ==========

    /**
     * Генерирует детальную смету с материалами из AI-детекций
     * @param {Array} detections - массив AI-детекций [{className, areaM2, volumeM3, ...}]
     * @param {string} region - регион для расценок (напр. 'Алматы')
     * @returns {Object} - результат с sections, materials, works, totals
     */
    function generateDetailedEstimate(detections, region = 'Алматы') {
        const estimator = window.AIEstimatorInstance;
        if (!estimator) {
            console.warn('[AINormBridge] AIEstimatorInstance не найден');
            return { success: false, error: 'AIEstimatorV2 не загружен' };
        }

        // Установить регион
        estimator.setRegion(region);

        const result = {
            success: true,
            detections: detections.length,
            estimates: [],
            sections: [],
            totals: { materials: 0, works: 0, total: 0 },
            region: region,
            generatedAt: new Date().toISOString()
        };

        // Трекинг обработанных типов чтобы не дублировать
        const processedTypes = new Set();

        detections.forEach(det => {
            const mapping = AI_CLASS_TO_ESTIMATOR[det.className];
            if (!mapping) return; // null or undefined — skip non-estimatable classes

            // Определить тип объекта
            let objectType = mapping.objectType;
            if (mapping.selectType) {
                objectType = mapping.selectType(det);
            }

            // Не дублировать один тип объекта
            const typeKey = `${objectType}_${Math.round((det.areaM2 || 0) * 10)}`;
            if (processedTypes.has(typeKey)) return;
            processedTypes.add(typeKey);

            // Конвертировать AI-замеры → параметры для AIEstimatorV2
            const inputParams = mapping.convertParams(det);

            // Вызвать AIEstimatorV2
            const estimate = estimator.generateEstimate(objectType, inputParams);

            if (estimate.success) {
                const data = estimate.data;

                result.estimates.push({
                    objectType,
                    objectName: data.objectName,
                    inputParams,
                    aiClass: det.className,
                    confidence: det.confidence,
                    sections: data.sections,
                    totals: data.totals
                });

                // Агрегация итогов
                result.totals.materials += data.totals.materials;
                result.totals.works += data.totals.works;
                result.totals.total += data.totals.total;

                // Собрать все секции
                data.sections.forEach(sec => {
                    // Найти существующую секцию или добавить новую
                    let existing = result.sections.find(s => s.code === sec.code);
                    if (existing) {
                        // Объединить items
                        sec.items.forEach(item => {
                            const existingItem = existing.items.find(i => i.name === item.name);
                            if (existingItem) {
                                // Суммировать количества
                                existingItem.materials.forEach((m, idx) => {
                                    if (item.materials[idx]) {
                                        m.quantity += item.materials[idx].quantity;
                                        m.sum += item.materials[idx].sum;
                                    }
                                });
                                existingItem.works.forEach((w, idx) => {
                                    if (item.works[idx]) {
                                        w.quantity += item.works[idx].quantity;
                                        w.sum += item.works[idx].sum;
                                    }
                                });
                                existingItem.subtotal.materials += item.subtotal.materials;
                                existingItem.subtotal.works += item.subtotal.works;
                                existingItem.subtotal.total += item.subtotal.total;
                            } else {
                                existing.items.push({ ...item });
                            }
                        });
                        existing.subtotal.materials += sec.subtotal.materials;
                        existing.subtotal.works += sec.subtotal.works;
                        existing.subtotal.total += sec.subtotal.total;
                    } else {
                        result.sections.push({
                            code: sec.code,
                            name: sec.name,
                            icon: sec.icon,
                            items: sec.items.map(i => ({ ...i })),
                            subtotal: { ...sec.subtotal }
                        });
                    }
                });
            }
        });

        // Сортировать секции по коду
        result.sections.sort((a, b) => a.code.localeCompare(b.code));

        console.log(`[AINormBridge] Сгенерирована смета: ${result.estimates.length} объектов, ` +
            `${result.sections.length} разделов, итого ${result.totals.total.toLocaleString()}₸`);

        return result;
    }

    // ========== ФОРМАТИРОВАНИЕ ДЛЯ ВЫВОДА ==========

    /**
     * Возвращает плоский список всех материалов из детальной сметы
     */
    function extractAllMaterials(detailedEstimate) {
        const materials = [];
        if (!detailedEstimate?.success) return materials;

        detailedEstimate.sections.forEach(sec => {
            sec.items.forEach(item => {
                item.materials.forEach(m => {
                    materials.push({
                        section: sec.name,
                        sectionIcon: sec.icon,
                        ...m
                    });
                });
            });
        });

        return materials;
    }

    /**
     * Возвращает плоский список всех работ из детальной сметы
     */
    function extractAllWorks(detailedEstimate) {
        const works = [];
        if (!detailedEstimate?.success) return works;

        detailedEstimate.sections.forEach(sec => {
            sec.items.forEach(item => {
                item.works.forEach(w => {
                    works.push({
                        section: sec.name,
                        sectionIcon: sec.icon,
                        ...w
                    });
                });
            });
        });

        return works;
    }

    /**
     * Получить список поддерживаемых AI-классов
     */
    function getSupportedClasses() {
        return Object.keys(AI_CLASS_TO_ESTIMATOR);
    }

    /**
     * Проверить, есть ли поддерживаемые детекции
     */
    function hasEstimatableDetections(detections) {
        return detections.some(d => AI_CLASS_TO_ESTIMATOR[d.className]);
    }

    // ========== EXPORT ==========
    window.AINormBridge = {
        generateDetailedEstimate,
        parseDescription,
        extractAllMaterials,
        extractAllWorks,
        getSupportedClasses,
        hasEstimatableDetections,
        AI_CLASS_TO_ESTIMATOR
    };

    console.log(`✅ AINormBridge v2.0 loaded (${Object.keys(AI_CLASS_TO_ESTIMATOR).length} AI classes → AIEstimatorV2, parseDescription enabled)`);
})();
