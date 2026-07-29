/**
 * qtoEngine.js — QTO Engine (Quantity Take-Off)
 * 
 * Строгий расчёт объёмов работ и материалов.
 * 
 * Функции:
 * 1. Формулы для каждого типа работ (штукатурка, стяжка, кладка, ...)
 * 2. Валидация входных данных (диапазоны, единицы)
 * 3. Агрегация патчей (несколько зон → единый расчёт)
 * 4. Вычет проёмов из площади стен
 * 5. Запасы и коэффициенты (waste factor)
 * 
 * Используется SmartEstimateEngine.js для подбора работ из каталога.
 */

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════════════════════
    // ЕДИНИЦЫ ИЗМЕРЕНИЯ
    // ═══════════════════════════════════════════════════════════════════════════

    const UNITS = {
        M2: { label: 'м²', name: 'Квадратный метр' },
        M3: { label: 'м³', name: 'Кубический метр' },
        LM: { label: 'п.м', name: 'Погонный метр' },
        PCS: { label: 'шт', name: 'Штука' },
        SET: { label: 'комп', name: 'Комплект' },
        TON: { label: 'т', name: 'Тонна' },
        KG: { label: 'кг', name: 'Килограмм' },
        L: { label: 'л', name: 'Литр' },
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // ВАЛИДАЦИЯ ДИАПАЗОНОВ
    // ═══════════════════════════════════════════════════════════════════════════

    const VALIDATION_RANGES = {
        wall_height: { min: 2.2, max: 6.0, unit: 'м', desc: 'Высота стены' },
        wall_thickness: { min: 0.08, max: 0.60, unit: 'м', desc: 'Толщина стены' },
        screed_thickness: { min: 0.03, max: 0.15, unit: 'м', desc: 'Толщина стяжки' },
        plaster_thickness: { min: 0.005, max: 0.05, unit: 'м', desc: 'Толщина штукатурки' },
        insulation_thickness: { min: 0.03, max: 0.20, unit: 'м', desc: 'Толщина утеплителя' },
        room_area: { min: 1.0, max: 200.0, unit: 'м²', desc: 'Площадь помещения' },
        floor_area: { min: 1.0, max: 500.0, unit: 'м²', desc: 'Площадь пола' },
        wall_area: { min: 1.0, max: 300.0, unit: 'м²', desc: 'Площадь стены' },
        opening_ratio: { min: 0, max: 0.60, unit: '', desc: 'Доля проёмов в стене' },
        foundation_depth: { min: 0.5, max: 3.0, unit: 'м', desc: 'Глубина фундамента' },
        foundation_width: { min: 0.3, max: 1.2, unit: 'м', desc: 'Ширина ленты фундамента' },
    };

    function validate(paramName, value) {
        const range = VALIDATION_RANGES[paramName];
        if (!range) return { valid: true };
        if (value < range.min || value > range.max) {
            return {
                valid: false,
                error: `${range.desc}: ${value} ${range.unit} вне диапазона [${range.min}–${range.max}]`,
                clamped: Math.max(range.min, Math.min(range.max, value)),
            };
        }
        return { valid: true };
    }

    function validateAll(params) {
        const errors = [];
        const warnings = [];

        for (const [key, value] of Object.entries(params)) {
            if (typeof value !== 'number' || isNaN(value)) continue;
            const result = validate(key, value);
            if (!result.valid) {
                warnings.push(result.error);
                params[key] = result.clamped; // auto-correct
            }
        }

        return { errors, warnings, corrected: params };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ФОРМУЛЫ РАСЧЁТА (QTO формулы)
    // ═══════════════════════════════════════════════════════════════════════════

    const FORMULAS = {

        // ── Стены ──────────────────────────────────────────────────────────

        /** Штукатурка стен: qty = площадь стены (м²) */
        plaster_walls: {
            name: 'Штукатурка стен',
            unit: 'M2',
            calculate(params) {
                const { wall_area, openings_area = 0 } = params;
                const net_area = wall_area - openings_area;
                return {
                    qty: Math.max(0, net_area),
                    formula: `A_стен - A_проёмов = ${wall_area} - ${openings_area} = ${(net_area).toFixed(1)} м²`,
                };
            },
            validate(params) {
                const checks = [];
                if (params.openings_area >= params.wall_area) {
                    checks.push('Площадь проёмов ≥ площади стены!');
                }
                return checks;
            },
        },

        /** Покраска стен: qty = площадь стены (м²) × 2 слоя */
        paint_walls: {
            name: 'Покраска стен',
            unit: 'M2',
            calculate(params) {
                const { wall_area, openings_area = 0, coats = 2 } = params;
                const net_area = (wall_area - openings_area) * coats;
                return {
                    qty: Math.max(0, net_area),
                    formula: `(A_стен - A_проёмов) × ${coats} слоя = ${net_area.toFixed(1)} м²`,
                };
            },
        },

        /** Кладка стен (кирпич/блок): qty = площадь стены (м²) с вычетом проёмов */
        masonry_walls: {
            name: 'Кладка стен',
            unit: 'M2',
            calculate(params) {
                const { wall_area, openings_area = 0 } = params;
                const net_area = wall_area - openings_area;
                return {
                    qty: Math.max(0, net_area),
                    formula: `A_стен - A_проёмов = ${wall_area} - ${openings_area} = ${net_area.toFixed(1)} м²`,
                };
            },
            validate(params) {
                const checks = [];
                const ratio = params.openings_area / params.wall_area;
                const v = validate('opening_ratio', ratio);
                if (!v.valid) checks.push(v.error);
                return checks;
            },
        },

        /** Объём кладки: qty = площадь × толщина стены (м³) */
        masonry_volume: {
            name: 'Объём кладки',
            unit: 'M3',
            calculate(params) {
                const { wall_area, openings_area = 0, wall_thickness = 0.25 } = params;
                const net_area = wall_area - openings_area;
                const volume = net_area * wall_thickness;
                return {
                    qty: Math.max(0, volume),
                    formula: `(${wall_area} - ${openings_area}) × ${wall_thickness} = ${volume.toFixed(2)} м³`,
                };
            },
        },

        // ── Полы ───────────────────────────────────────────────────────────

        /** Стяжка пола: qty = площадь × толщина (м³) */
        floor_screed: {
            name: 'Стяжка пола',
            unit: 'M3',
            calculate(params) {
                const { floor_area, screed_thickness = 0.05 } = params;
                const volume = floor_area * screed_thickness;
                return {
                    qty: Math.max(0, volume),
                    formula: `A_пола × h_стяжки = ${floor_area} × ${screed_thickness} = ${volume.toFixed(2)} м³`,
                };
            },
            validate(params) {
                const checks = [];
                const v = validate('screed_thickness', params.screed_thickness || 0.05);
                if (!v.valid) checks.push(v.error);
                return checks;
            },
        },

        /** Укладка плитки: qty = площадь пола (м²) + запас 10% */
        floor_tiling: {
            name: 'Укладка плитки',
            unit: 'M2',
            calculate(params) {
                const { floor_area, waste_factor = 1.10 } = params;
                const qty = floor_area * waste_factor;
                return {
                    qty,
                    formula: `A_пола × запас = ${floor_area} × ${waste_factor} = ${qty.toFixed(1)} м²`,
                };
            },
        },

        /** Ламинат/паркет: qty = площадь + запас 7% */
        floor_laminate: {
            name: 'Укладка ламината',
            unit: 'M2',
            calculate(params) {
                const { floor_area, waste_factor = 1.07 } = params;
                const qty = floor_area * waste_factor;
                return {
                    qty,
                    formula: `A_пола × ${waste_factor} = ${qty.toFixed(1)} м²`,
                };
            },
        },

        // ── Потолок ────────────────────────────────────────────────────────

        /** Штукатурка потолка: qty = площадь потолка (м²) */
        plaster_ceiling: {
            name: 'Штукатурка потолка',
            unit: 'M2',
            calculate(params) {
                const { ceiling_area } = params;
                return {
                    qty: ceiling_area,
                    formula: `A_потолка = ${ceiling_area} м²`,
                };
            },
        },

        // ── Фундаменты ────────────────────────────────────────────────────

        /** Ленточный фундамент: qty = периметр × ширина × глубина (м³) */
        foundation_strip: {
            name: 'Ленточный фундамент (бетон)',
            unit: 'M3',
            calculate(params) {
                const { perimeter, foundation_width = 0.4, foundation_depth = 1.0 } = params;
                const volume = perimeter * foundation_width * foundation_depth;
                return {
                    qty: volume,
                    formula: `P × W × D = ${perimeter} × ${foundation_width} × ${foundation_depth} = ${volume.toFixed(2)} м³`,
                };
            },
            validate(params) {
                const checks = [];
                if (params.foundation_width) {
                    const v = validate('foundation_width', params.foundation_width);
                    if (!v.valid) checks.push(v.error);
                }
                if (params.foundation_depth) {
                    const v = validate('foundation_depth', params.foundation_depth);
                    if (!v.valid) checks.push(v.error);
                }
                return checks;
            },
        },

        /** Плитный фундамент: qty = площадь × толщина (м³) */
        foundation_slab: {
            name: 'Плитный фундамент (бетон)',
            unit: 'M3',
            calculate(params) {
                const { floor_area, slab_thickness = 0.30 } = params;
                const volume = floor_area * slab_thickness;
                return {
                    qty: volume,
                    formula: `A × h = ${floor_area} × ${slab_thickness} = ${volume.toFixed(2)} м³`,
                };
            },
        },

        /** Свайный фундамент: qty = кол-во свай (шт) */
        foundation_pile: {
            name: 'Забивка свай',
            unit: 'PCS',
            calculate(params) {
                const { perimeter, pile_spacing = 2.0 } = params;
                const count = Math.ceil(perimeter / pile_spacing) + 4; // +4 угловые
                return {
                    qty: count,
                    formula: `P / шаг + угловые = ${perimeter}/${pile_spacing} + 4 = ${count} шт`,
                };
            },
        },

        // ── Земляные работы ────────────────────────────────────────────────

        /** Обратная засыпка: qty = объём котлована - объём фундамента (м³) */
        backfill: {
            name: 'Обратная засыпка',
            unit: 'M3',
            calculate(params) {
                const { pit_volume, foundation_volume } = params;
                const qty = Math.max(0, pit_volume - foundation_volume);
                return {
                    qty,
                    formula: `V_котлов - V_фунд = ${pit_volume} - ${foundation_volume} = ${qty.toFixed(2)} м³`,
                };
            },
        },

        // ── Утепление ──────────────────────────────────────────────────────

        /** Утепление: qty = площадь × толщина (м³) */
        insulation: {
            name: 'Утепление',
            unit: 'M3',
            calculate(params) {
                const { area, insulation_thickness = 0.05 } = params;
                const volume = area * insulation_thickness;
                return {
                    qty: volume,
                    formula: `A × h = ${area} × ${insulation_thickness} = ${volume.toFixed(3)} м³`,
                };
            },
        },

        // ── Гидроизоляция ──────────────────────────────────────────────────

        /** Гидроизоляция: qty = площадь (м²) + нахлёст 15% */
        waterproofing: {
            name: 'Гидроизоляция',
            unit: 'M2',
            calculate(params) {
                const { area, overlap_factor = 1.15 } = params;
                const qty = area * overlap_factor;
                return {
                    qty,
                    formula: `A × нахлёст = ${area} × ${overlap_factor} = ${qty.toFixed(1)} м²`,
                };
            },
        },

        // ── Трубы ──────────────────────────────────────────────────────────

        /** Прокладка труб: qty = длина (п.м) + запас на фитинги 5% */
        pipe_laying: {
            name: 'Прокладка труб',
            unit: 'LM',
            calculate(params) {
                const { length, fittings_factor = 1.05 } = params;
                const qty = length * fittings_factor;
                return {
                    qty,
                    formula: `L × ${fittings_factor} = ${length} × ${fittings_factor} = ${qty.toFixed(1)} п.м`,
                };
            },
        },

        // ── Арматура ──────────────────────────────────────────────────────

        /** Армирование: qty = объём бетона × расход (кг) */
        rebar: {
            name: 'Армирование',
            unit: 'KG',
            calculate(params) {
                const { concrete_volume, rebar_rate_kg_m3 = 80 } = params;
                const qty = concrete_volume * rebar_rate_kg_m3;
                return {
                    qty,
                    formula: `V_бетон × ${rebar_rate_kg_m3} кг/м³ = ${concrete_volume} × ${rebar_rate_kg_m3} = ${qty.toFixed(0)} кг`,
                };
            },
        },

        // ── Опалубка ──────────────────────────────────────────────────────

        /** Опалубка: qty = периметр × высота (м²) */
        formwork: {
            name: 'Устройство опалубки',
            unit: 'M2',
            calculate(params) {
                const { perimeter, height } = params;
                const qty = perimeter * height * 2; // Обе стороны
                return {
                    qty,
                    formula: `P × H × 2стороны = ${perimeter} × ${height} × 2 = ${qty.toFixed(1)} м²`,
                };
            },
        },

        // ── Демонтаж ──────────────────────────────────────────────────────

        /** Демонтаж: qty = площадь (м²) */
        demolition: {
            name: 'Демонтажные работы',
            unit: 'M2',
            calculate(params) {
                const { area } = params;
                return { qty: area, formula: `A = ${area} м²` };
            },
        },
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // АГРЕГАЦИЯ ПАТЧЕЙ (несколько зон → единый расчёт)
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Агрегирует несколько участков (patches) в единые параметры.
     * 
     * @param {Array} patches - массив { area_m2, perimeter_m, height_m, ... }
     * @param {string} mode - 'sum' | 'average' | 'max' | 'weighted_avg'
     * @returns {Object} агрегированные параметры
     */
    function aggregatePatches(patches, mode = 'sum') {
        if (!patches || !patches.length) return {};

        if (patches.length === 1) return { ...patches[0], patch_count: 1 };

        const result = {};
        const numericKeys = new Set();
        // Extensive: should always be summed
        const sumKeys = new Set(['area_m2', 'perimeter_m', 'volume_m3', 'openings_area']);
        // Intensive: should be averaged (weighted by area if available)
        const avgKeys = new Set(['height_m', 'width_m', 'depth_m', 'confidence',
            'thickness_m', 'foundation_depth', 'foundation_width',
            'screed_thickness', 'slab_thickness']);

        // Collect all numeric keys
        for (const p of patches) {
            for (const [k, v] of Object.entries(p)) {
                if (typeof v === 'number') numericKeys.add(k);
            }
        }

        // Total area for weighting
        const totalArea = patches.reduce((s, p) => s + (p.area_m2 || 0), 0) || 1;

        for (const key of numericKeys) {
            const values = patches.map(p => p[key] || 0);

            if (mode === 'weighted_avg') {
                if (sumKeys.has(key)) {
                    result[key] = values.reduce((a, b) => a + b, 0);
                } else if (avgKeys.has(key)) {
                    // Area-weighted average
                    let wSum = 0;
                    for (let i = 0; i < patches.length; i++) {
                        const w = (patches[i].area_m2 || 1) / totalArea;
                        wSum += (patches[i][key] || 0) * w;
                    }
                    result[key] = wSum;
                } else {
                    result[key] = values.reduce((a, b) => a + b, 0);
                }
            } else {
                switch (mode) {
                    case 'sum':
                        result[key] = values.reduce((a, b) => a + b, 0);
                        break;
                    case 'average':
                        result[key] = values.reduce((a, b) => a + b, 0) / values.length;
                        break;
                    case 'max':
                        result[key] = Math.max(...values);
                        break;
                }
            }
        }

        // Preserve non-numeric fields from first patch
        const first = patches[0];
        for (const [k, v] of Object.entries(first)) {
            if (typeof v !== 'number' && result[k] === undefined) {
                result[k] = v;
            }
        }

        result.patch_count = patches.length;
        result.total_area = patches.reduce((s, p) => s + (p.area_m2 || 0), 0);
        result.total_volume = patches.reduce((s, p) => s + (p.volume_m3 || 0), 0);
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ГЛАВНАЯ ФУНКЦИЯ РАСЧЁТА
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Рассчитывает объёмы работ по формулам QTO.
     * 
     * @param {string} formulaName - название формулы (ключ из FORMULAS)
     * @param {Object} params      - входные параметры
     * @returns {Object} { qty, unit, formula, warnings }
     */
    function calculate(formulaName, params) {
        const formula = FORMULAS[formulaName];
        if (!formula) {
            return {
                qty: 0,
                unit: 'M2',
                formula: `Формула "${formulaName}" не найдена`,
                warnings: [`Неизвестная формула: ${formulaName}`],
                error: true,
            };
        }

        // Валидация
        const warnings = [];
        if (formula.validate) {
            const checks = formula.validate(params);
            if (checks && checks.length) {
                warnings.push(...checks);
            }
        }

        // Расчёт
        const result = formula.calculate(params);

        // Проверка на отрицательный или нулевой результат
        if (result.qty <= 0) {
            warnings.push(`Результат расчёта ≤ 0: ${result.formula}`);
        }

        return {
            name: formula.name,
            qty: Math.max(0, Math.round(result.qty * 100) / 100),
            unit: formula.unit,
            unit_label: UNITS[formula.unit]?.label || formula.unit,
            formula: result.formula,
            warnings,
        };
    }

    /**
     * Расчёт полного набора работ для объекта.
     * На основе objectType определяет нужные формулы и считает объёмы.
     * 
     * @param {string} objectType - тип объекта (foundation_strip, wall_brick, floor_screed, ...)
     * @param {Object} dimensions - { area_m2, perimeter_m, height_m, volume_m3, ... }
     * @returns {Array} массив результатов расчёта
     */
    function calculateForObject(objectType, dimensions) {
        const results = [];
        const d = { ...dimensions };

        switch (objectType) {
            case 'foundation_strip':
                results.push(calculate('foundation_strip', {
                    perimeter: d.perimeter_m || 30,
                    foundation_width: d.width_m || 0.4,
                    foundation_depth: d.height_m || 1.0,
                }));
                // Сопутствующие: опалубка
                results.push(calculate('formwork', {
                    perimeter: d.perimeter_m || 30,
                    height: d.height_m || 1.0,
                }));
                // Арматура
                const fVol = (d.perimeter_m || 30) * (d.width_m || 0.4) * (d.height_m || 1.0);
                results.push(calculate('rebar', { concrete_volume: fVol }));
                // Гидроизоляция
                results.push(calculate('waterproofing', {
                    area: (d.perimeter_m || 30) * (d.height_m || 1.0),
                }));
                break;

            case 'foundation_slab':
                results.push(calculate('foundation_slab', {
                    floor_area: d.area_m2 || 100,
                    slab_thickness: d.height_m || 0.30,
                }));
                const sVol = (d.area_m2 || 100) * (d.height_m || 0.30);
                results.push(calculate('rebar', { concrete_volume: sVol }));
                results.push(calculate('waterproofing', { area: d.area_m2 || 100 }));
                break;

            case 'foundation_pile':
                results.push(calculate('foundation_pile', {
                    perimeter: d.perimeter_m || 40,
                    pile_spacing: 2.0,
                }));
                break;

            case 'wall_brick':
            case 'wall_block':
                const wallArea = d.area_m2 || 50;
                const openings = (d.openings_area || wallArea * 0.15);
                results.push(calculate('masonry_walls', {
                    wall_area: wallArea,
                    openings_area: openings,
                }));
                results.push(calculate('plaster_walls', {
                    wall_area: wallArea,
                    openings_area: openings,
                }));
                results.push(calculate('paint_walls', {
                    wall_area: wallArea,
                    openings_area: openings,
                }));
                break;

            case 'floor_screed':
                results.push(calculate('floor_screed', {
                    floor_area: d.area_m2 || 50,
                    screed_thickness: d.height_m || 0.05,
                }));
                break;

            case 'roof_flat':
            case 'roof_gable':
                results.push(calculate('waterproofing', { area: d.area_m2 || 80 }));
                results.push(calculate('insulation', {
                    area: d.area_m2 || 80,
                    insulation_thickness: 0.10,
                }));
                break;

            case 'slab':
                results.push(calculate('foundation_slab', {
                    floor_area: d.area_m2 || 30,
                    slab_thickness: d.height_m || 0.20,
                }));
                results.push(calculate('rebar', {
                    concrete_volume: (d.area_m2 || 30) * (d.height_m || 0.20),
                }));
                results.push(calculate('formwork', {
                    perimeter: d.perimeter_m || 22,
                    height: d.height_m || 0.20,
                }));
                break;

            case 'pipe':
            case 'pipe_pvc':
            case 'pipe_hdpe':
            case 'pipe_metal':
                results.push(calculate('pipe_laying', {
                    length: d.perimeter_m || d.height_m || 10,
                }));
                break;

            default:
                // Generic: используем площадь для базовых работ
                if (d.area_m2) {
                    results.push(calculate('plaster_walls', {
                        wall_area: d.area_m2,
                        openings_area: d.area_m2 * 0.1,
                    }));
                }
                break;
        }

        return results;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // СЦЕНАРИИ (ЭКОНОМ / СТАНДАРТ / ПРЕМИУМ)
    // ═══════════════════════════════════════════════════════════════════════════

    const SCENARIO_COEFFICIENTS = {
        economy: { price: 0.70, quality: 'Эконом — бюджетные материалы, минимальная отделка', waste: 1.05 },
        standard: { price: 1.00, quality: 'Стандарт — средние материалы, полная отделка', waste: 1.10 },
        premium: { price: 1.60, quality: 'Премиум — высококачественные материалы, дизайн-отделка', waste: 1.15 },
    };

    /**
     * Генерирует 3 сценария сметы.
     * 
     * @param {Array}  qtoResults  - результаты QTO расчёта
     * @param {Object} basePrices  - базовые цены из каталога
     * @returns {Object} { economy: {...}, standard: {...}, premium: {...} }
     */
    function generateScenarios(qtoResults, basePrices = {}) {
        const scenarios = {};

        for (const [scenarioName, coef] of Object.entries(SCENARIO_COEFFICIENTS)) {
            const items = qtoResults.map(item => {
                const basePrice = basePrices[item.name] || 5000; // Тенге за единицу
                const adjustedQty = item.qty * coef.waste;
                const adjustedPrice = basePrice * coef.price;
                const total = Math.round(adjustedQty * adjustedPrice);

                return {
                    ...item,
                    qty: Math.round(adjustedQty * 100) / 100,
                    unit_price: Math.round(adjustedPrice),
                    total,
                    scenario: scenarioName,
                };
            });

            const totalCost = items.reduce((sum, i) => sum + i.total, 0);

            scenarios[scenarioName] = {
                name: coef.quality,
                items,
                total_cost: totalCost,
                waste_factor: coef.waste,
                price_factor: coef.price,
            };
        }

        return scenarios;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // СКРЫТЫЕ/СОПУТСТВУЮЩИЕ РАБОТЫ
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Добавляет скрытые работы, которые обязательны но не видны на фото.
     * Например: демонтаж, подготовка поверхности, уборка, вынос мусора.
     */
    const HIDDEN_WORKS = {
        'foundation_strip': [
            { formula: 'demolition', desc: 'Подготовка площадки', area_factor: 1.2 },
            { formula: 'backfill', desc: 'Обратная засыпка', auto: true },
        ],
        'wall_brick': [
            { formula: 'demolition', desc: 'Демонтаж старого покрытия', area_factor: 0.5 },
        ],
        'wall_block': [
            { formula: 'demolition', desc: 'Демонтаж старого покрытия', area_factor: 0.5 },
        ],
        'floor_screed': [
            { formula: 'demolition', desc: 'Демонтаж старого пола', area_factor: 1.0 },
        ],
    };

    function addHiddenWorks(objectType, dimensions, existingResults) {
        const hidden = HIDDEN_WORKS[objectType];
        if (!hidden) return existingResults;

        const results = [...existingResults];

        for (const hw of hidden) {
            if (hw.auto) continue; // auto-works handled in calculateForObject

            const area = (dimensions.area_m2 || 50) * (hw.area_factor || 1.0);
            const calcResult = calculate(hw.formula, { area });
            calcResult.is_hidden = true;
            calcResult.description = hw.desc;
            results.push(calcResult);
        }

        return results;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ВОПРОСЫ ПРИ НЕПОЛНЫХ ДАННЫХ
    // ═══════════════════════════════════════════════════════════════════════════

    function generateQuestions(objectType, dimensions) {
        const questions = [];

        // Общие вопросы
        if (!dimensions.height_m || dimensions.height_m <= 0) {
            questions.push({
                id: 'height',
                text: 'Какова высота объекта (в метрах)?',
                type: 'number',
                default: objectType.includes('foundation') ? 1.0 : 2.8,
                range: [0.3, 6.0],
            });
        }

        if (!dimensions.perimeter_m && !dimensions.area_m2) {
            questions.push({
                id: 'perimeter',
                text: 'Каков периметр объекта (в метрах)?',
                type: 'number',
                default: 30,
                range: [4, 200],
            });
        }

        // Специфичные по типу
        if (objectType === 'wall_brick' || objectType === 'wall_block') {
            questions.push({
                id: 'openings_ratio',
                text: 'Примерный процент площади, занятый проёмами (окна+двери)?',
                type: 'slider',
                default: 15,
                range: [0, 50],
                unit: '%',
            });
            questions.push({
                id: 'wall_thickness',
                text: 'Толщина стены (м)?',
                type: 'select',
                options: [
                    { value: 0.12, label: 'Полкирпича (120 мм)' },
                    { value: 0.25, label: 'Кирпич (250 мм)' },
                    { value: 0.38, label: 'Полтора кирпича (380 мм)' },
                    { value: 0.20, label: 'Блок 200 мм' },
                    { value: 0.30, label: 'Блок 300 мм' },
                    { value: 0.40, label: 'Блок 400 мм' },
                ],
                default: 0.25,
            });
        }

        if (objectType === 'floor_screed') {
            questions.push({
                id: 'screed_thickness',
                text: 'Толщина стяжки (мм)?',
                type: 'select',
                options: [
                    { value: 0.03, label: '30 мм (минимальная)' },
                    { value: 0.05, label: '50 мм (стандартная)' },
                    { value: 0.08, label: '80 мм (толстая)' },
                    { value: 0.10, label: '100 мм (с тёплым полом)' },
                ],
                default: 0.05,
            });
        }

        if (objectType.includes('foundation')) {
            questions.push({
                id: 'has_waterproofing',
                text: 'Нужна гидроизоляция фундамента?',
                type: 'boolean',
                default: true,
            });
        }

        return questions;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // VALIDATE ESTIMATE
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Validates all items in an estimate for invalid values.
     * @param {Array} items - estimate items [{qty, unit_price, total_price, ...}]
     * @returns {{valid: boolean, errors: string[], cleaned: Array}}
     */
    function validateEstimate(items) {
        const errors = [];
        const cleaned = [];

        for (let i = 0; i < items.length; i++) {
            const item = { ...items[i] };
            let ok = true;

            for (const key of ['qty', 'unit_price', 'total_price']) {
                const v = item[key];
                if (typeof v !== 'number' || isNaN(v) || !isFinite(v)) {
                    errors.push(`[${i}] ${item.work_name || item.name || '?'}: ${key} = ${v} (невалидное значение)`);
                    item[key] = 0;
                    ok = false;
                }
                if (v < 0) {
                    errors.push(`[${i}] ${item.work_name || item.name || '?'}: ${key} = ${v} (отрицательное)`);
                    item[key] = Math.abs(v);
                    ok = false;
                }
            }
            if (ok || item.qty > 0) cleaned.push(item);
        }

        return { valid: errors.length === 0, errors, cleaned };
    }

    /**
     * Export estimate items as CSV text (can be saved or downloaded).
     * @param {Array} items
     * @param {string} title
     * @returns {string} CSV content
     */
    function exportToCSV(items, title = 'QAZGOST AI Estimate') {
        const BOM = '\uFEFF'; // UTF-8 BOM for Excel
        let csv = BOM;
        csv += `"${title}"\r\n`;
        csv += `"Дата","${new Date().toLocaleDateString('ru-KZ')}"\r\n\r\n`;
        csv += '"#","Код","Наименование работ","Ед.изм","Кол-во","Цена (тг)","Сумма (тг)"\r\n';

        let total = 0;
        items.forEach((item, idx) => {
            const qty = item.qty || item.quantity || 0;
            const price = item.unit_price || 0;
            const sum = item.total_price || item.total || (qty * price);
            total += sum;
            csv += `${idx + 1},"${item.work_code || ''}","${item.work_name || item.name || ''}","${item.unit_label || item.unit || ''}",${qty},${price},${sum}\r\n`;
        });

        csv += `\r\n"","","ИТОГО","","","",${total}\r\n`;
        return csv;
    }

    /**
     * Download CSV as file.
     */
    function downloadCSV(items, filename = 'estimate.csv') {
        const csv = exportToCSV(items);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Get unit with Russian description.
     */
    function getUnitDescription(unitKey) {
        return UNITS[unitKey] || { label: unitKey, name: unitKey };
    }

    /**
     * Merge patches with conflict resolution strategy.
     * @param {Array} patches
     * @param {'latest_wins'|'weighted_avg'} strategy
     */
    function mergePatches(patches, strategy = 'weighted_avg') {
        if (strategy === 'latest_wins') {
            return patches.length ? { ...patches[patches.length - 1], patch_count: patches.length } : {};
        }
        return aggregatePatches(patches, 'weighted_avg');
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════════

    window.QTOEngine = {
        UNITS,
        FORMULAS,
        VALIDATION_RANGES,
        SCENARIO_COEFFICIENTS,

        validate,
        validateAll,
        calculate,
        calculateForObject,
        aggregatePatches,
        generateScenarios,
        addHiddenWorks,
        generateQuestions,
        validateEstimate,
        exportToCSV,
        downloadCSV,
        getUnitDescription,
        mergePatches,

        HIDDEN_WORKS,
    };

    console.log('[QTOEngine] ✅ Loaded — формулы, валидация, сценарии, скрытые работы, экспорт CSV');
})();
