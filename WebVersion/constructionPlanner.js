// ============================================================
// constructionPlanner.js — Строительный Планировщик v1.0
// QAZGOST AI v3.0
//
// LLM-style ReAct (Observe → Think → Act) pattern:
//   1. Observe: анализ AI-детекций (объекты, дефекты, масштаб)
//   2. Think:   правила СНиП → план работ + скрытые работы
//   3. Act:     формирование сметы через SmartEstimateEngine
//
// Knowledge Base:
//   - СНиП правила для каждого типа объекта
//   - Типичные последовательности работ
//   - Дефект → рекомендация по ремонту
//   - Вопросы для уточнения
// ============================================================

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────
    // KNOWLEDGE BASE: СНиП правила и типичные паттерны
    // ─────────────────────────────────────────────────────────

    const CONSTRUCTION_RULES = {
        // Фундаменты
        foundation_strip: {
            snipRefs: ['СП 22.13330.2016', 'СНиП 3.02.01-87'],
            sequence: [
                'Разметка и планировка участка',
                'Разработка грунта (траншея)',
                'Устройство подушки (щебень + песок)',
                'Установка опалубки',
                'Гидроизоляция (подошва)',
                'Монтаж арматурного каркаса',
                'Бетонирование',
                'Уход за бетоном (7 дней)',
                'Снятие опалубки',
                'Гидроизоляция (стены фундамента)',
                'Обратная засыпка',
            ],
            criticalChecks: [
                { check: 'depth_below_frost', message: 'Глубина ≥ глубины промерзания', severity: 'critical' },
                { check: 'concrete_class', message: 'Класс бетона ≥ B20 для фундамента', severity: 'warning' },
                { check: 'rebar_coverage', message: 'Защитный слой арматуры ≥ 40мм', severity: 'critical' },
            ],
            defectActions: {
                crack: { action: 'Инъекция эпоксидной смолой + усиление', urgency: 'high', priceBase: 45000 },
                stain: { action: 'Дренаж + повторная гидроизоляция', urgency: 'medium', priceBase: 85000 },
                rust: { action: 'Защита арматуры + ингибиторы коррозии', urgency: 'high', priceBase: 35000 },
            },
        },
        foundation_slab: {
            snipRefs: ['СП 22.13330.2016', 'СП 63.13330.2018'],
            sequence: [
                'Планировка грунта',
                'Геотекстиль',
                'Щебёночная подушка (200мм)',
                'Песчаная подушка (100мм) + трамбовка',
                'Гидроизоляция (2 слоя)',
                'Утепление ЭППС (для УШП)',
                'Установка опалубки (периметр)',
                'Вязка арматурного каркаса (2 сетки)',
                'Закладные (коммуникации)',
                'Бетонирование (класс B25)',
                'Уход за бетоном',
            ],
            criticalChecks: [
                { check: 'thickness', message: 'Толщина плиты ≥ 200мм для 1-2 этажа', severity: 'warning' },
                { check: 'rebar_step', message: 'Шаг арматуры 150-200мм', severity: 'critical' },
            ],
            defectActions: {
                crack: { action: 'Ремонт трещин + усиление углов', urgency: 'high', priceBase: 55000 },
                stain: { action: 'Обработка гидрофобизатором', urgency: 'low', priceBase: 25000 },
            },
        },
        wall_brick: {
            snipRefs: ['СП 15.13330.2012', 'СНиП II-22-81'],
            sequence: [
                'Разметка первого ряда',
                'Кладка кирпича (с перевязкой)',
                'Армирование сеткой (каждые 4-5 рядов)',
                'Устройство перемычек над проёмами',
                'Расшивка / затирка швов',
                'Установка закладных',
            ],
            criticalChecks: [
                { check: 'mortar', message: 'Марка раствора ≥ M75', severity: 'warning' },
                { check: 'verticality', message: 'Отклонение от вертикали ≤ 10мм на 1м', severity: 'critical' },
            ],
            defectActions: {
                crack: { action: 'Инъекция трещин + стальные тяжи', urgency: 'high', priceBase: 35000 },
                stain: { action: 'Обработка антигрибковым составом', urgency: 'medium', priceBase: 15000 },
                rust: { action: 'Замена арматуры + повторная кладка', urgency: 'high', priceBase: 65000 },
            },
        },
        wall_block: {
            snipRefs: ['СП 15.13330.2012', 'СТО 501-52-01-2007'],
            sequence: [
                'Гидроизоляция основания (горизонтальная)',
                'Кладка первого ряда на раствор',
                'Кладка на клей (толщина шва 2-3мм)',
                'Армирование (каждые 3-4 ряда)',
                'Устройство U-блоков над проёмами',
                'Армопояс по периметру',
            ],
            criticalChecks: [
                { check: 'glue_thickness', message: 'Толщина клеевого шва 2-3мм', severity: 'warning' },
                { check: 'armobelt', message: 'Армопояс обязателен под перекрытие', severity: 'critical' },
            ],
            defectActions: {
                crack: { action: 'Заделка трещин + армирование', urgency: 'medium', priceBase: 25000 },
                stain: { action: 'Вентиляция + антигрибок', urgency: 'low', priceBase: 12000 },
            },
        },
        floor_screed: {
            snipRefs: ['СП 29.13330.2011', 'СНиП 2.03.13-88'],
            sequence: [
                'Демонтаж старого покрытия',
                'Грунтовка основания',
                'Гидроизоляция (мокрые зоны)',
                'Установка маяков',
                'Укладка тёплого пола (если есть)',
                'Заливка стяжки',
                'Уход (21 день до полной прочности)',
                'Финишное покрытие',
            ],
            criticalChecks: [
                { check: 'min_thickness', message: 'Толщина стяжки ≥ 30мм', severity: 'critical' },
                { check: 'level', message: 'Допуск неровности ≤ 2мм/2м', severity: 'warning' },
            ],
            defectActions: {
                crack: { action: 'Расширение и заделка ремсоставом', urgency: 'low', priceBase: 8000 },
                stain: { action: 'Гидроизоляция + просушка', urgency: 'medium', priceBase: 18000 },
            },
        },
        slab: {
            snipRefs: ['СП 63.13330.2018', 'СНиП 3.03.01-87'],
            sequence: [
                'Установка стоек и опалубки',
                'Проверка уровня опалубки',
                'Укладка арматурных сеток (нижняя + верхняя)',
                'Установка фиксаторов (защитный слой)',
                'Бетонирование (класс ≥ B25)',
                'Вибрирование бетона',
                'Уход за бетоном (7-14 дней)',
                'Снятие опалубки (после набора 70% прочности)',
            ],
            criticalChecks: [
                { check: 'concrete_class', message: 'Класс бетона ≥ B25 для перекрытий', severity: 'critical' },
                { check: 'support_distance', message: 'Стойки с шагом ≤ 1.5м', severity: 'critical' },
            ],
            defectActions: {
                crack: { action: 'Инъекция + углеволоконное усиление', urgency: 'high', priceBase: 75000 },
            },
        },
        roof_gable: {
            snipRefs: ['СП 17.13330.2017', 'СНиП II-26-76'],
            sequence: [
                'Монтаж мауэрлата',
                'Установка стропильной системы',
                'Монтаж обрешётки',
                'Пароизоляция',
                'Утеплитель',
                'Гидроветрозащитная мембрана',
                'Контробрешётка + обрешётка',
                'Кровельное покрытие',
                'Водосточная система',
                'Подшивка свесов',
            ],
            criticalChecks: [
                { check: 'angle', message: 'Угол ската ≥ 14° для металлочерепицы', severity: 'warning' },
                { check: 'ventilation', message: 'Вентзазор ≥ 50мм обязателен', severity: 'critical' },
            ],
            defectActions: {
                crack: { action: 'Замена повреждённых стропил', urgency: 'high', priceBase: 45000 },
                stain: { action: 'Ремонт гидроизоляции + ревизия кровли', urgency: 'medium', priceBase: 35000 },
                rust: { action: 'Замена кровельных листов', urgency: 'medium', priceBase: 55000 },
            },
        },
        roof_flat: {
            snipRefs: ['СП 17.13330.2017'],
            sequence: [
                'Подготовка основания',
                'Пароизоляция',
                'Утепление',
                'Разуклонка',
                'Гидроизоляция (2-3 слоя)',
                'Защитный слой',
                'Водоприёмные воронки',
            ],
            criticalChecks: [
                { check: 'slope', message: 'Уклон ≥ 1.5% для водоотвода', severity: 'critical' },
            ],
            defectActions: {
                crack: { action: 'Ремонт гидроковра в месте трещины', urgency: 'high', priceBase: 25000 },
                stain: { action: 'Поиск и устранение протечки', urgency: 'high', priceBase: 40000 },
            },
        },
        generic: {
            snipRefs: [],
            sequence: ['Подготовительные работы', 'Основные работы', 'Финишные работы', 'Уборка'],
            criticalChecks: [],
            defectActions: {
                crack: { action: 'Ремонт трещин', urgency: 'medium', priceBase: 15000 },
                stain: { action: 'Обработка поверхности', urgency: 'low', priceBase: 8000 },
                rust: { action: 'Антикоррозийная обработка', urgency: 'medium', priceBase: 12000 },
            },
        },
    };

    // ─────────────────────────────────────────────────────────
    // PLANNER CORE: Observe → Think → Act
    // ─────────────────────────────────────────────────────────

    /**
     * Главная функция планирования.
     * @param {object} scene — результат AI-анализа
     * @param {object} opts — { region, userAnswers, contourData, defects }
     * @returns {object} — план работ с обоснованиями
     */
    function plan(scene, opts = {}) {
        const log = [];
        const startTime = Date.now();

        // ── STEP 1: OBSERVE ──────────────────────────────────
        log.push({ step: 'observe', message: 'Анализ входных данных...' });

        const objectType = scene.objectType || scene.type || 'generic';
        const detections = scene.detections || [];
        const measurements = scene.measurements || {};
        const defects = opts.defects || scene.defects || [];
        const userAnswers = opts.userAnswers || {};
        const region = opts.region || 'almaty';
        const contourData = opts.contourData || null;

        const rules = CONSTRUCTION_RULES[objectType] || CONSTRUCTION_RULES.generic;

        log.push({
            step: 'observe',
            message: `Тип объекта: ${objectType}, детекции: ${detections.length}, дефекты: ${defects.length}`,
        });

        // Dimensions from scene
        const dims = {
            area_m2: measurements.area_m2 || contourData?.areaM2 || 50,
            perimeter_m: measurements.perimeter_m || contourData?.perimeterM || 30,
            height_m: measurements.height_m || 3.0,
            depth_m: measurements.depth_m || 1.2,
            width_m: measurements.width_m || 0.5,
            volume_m3: measurements.volume_m3 || 0,
        };
        if (!dims.volume_m3) {
            dims.volume_m3 = dims.area_m2 * (dims.depth_m || dims.height_m || 0.3);
        }

        // Apply user answers to dimensions
        if (userAnswers.area_m2) dims.area_m2 = userAnswers.area_m2;
        if (userAnswers.height_m) dims.height_m = userAnswers.height_m;
        if (userAnswers.depth_m) dims.depth_m = userAnswers.depth_m;
        if (userAnswers.width_m) dims.width_m = userAnswers.width_m;

        // ── STEP 2: THINK — формирование плана ────────────────
        log.push({ step: 'think', message: 'Формирование плана работ по СНиП...' });

        // 2a: Основные работы (из SmartEstimateEngine)
        const mainPlan = [];
        const se = window.SmartEstimateEngine;
        if (se) {
            const matrix = se.WORK_MATRIX[objectType] || se.WORK_MATRIX.generic;
            (matrix.works || []).forEach((spec, i) => {
                const qtyKey = spec.qty_key || 'area_m2';
                const qty = dims[qtyKey] || spec.default_qty || 1;
                mainPlan.push({
                    order: i + 1,
                    workCode: spec.match ? spec.match.toString() : 'custom',
                    description: rules.sequence[i] || `Работа ${i + 1}`,
                    qtyFormula: `${qtyKey} = ${qty}`,
                    qty: Math.round(qty * 100) / 100,
                    unit: spec.unit || 'M2',
                    reason: `Согласно ${rules.snipRefs[0] || 'типовой технологии'}`,
                    confidence: 0.8,
                    source: 'ai_detection',
                });
            });
        }

        // 2b: Скрытые работы
        const hiddenWorks = se ? se.getHiddenWorks(objectType, dims, 1.0) : [];
        const hiddenPlan = hiddenWorks.map((h, i) => ({
            order: mainPlan.length + i + 1,
            workCode: 'hidden',
            description: h.name,
            qty: h.qty,
            unit: h.unit,
            reason: h.reason,
            confidence: 0.7,
            source: 'hidden_companion',
            priceEstimate: h.subtotal,
        }));

        log.push({
            step: 'think',
            message: `Основных работ: ${mainPlan.length}, скрытых: ${hiddenPlan.length}`,
        });

        // 2c: Ремонт дефектов
        const defectPlan = [];
        defects.forEach((defect, i) => {
            const defType = defect.type || 'crack';
            const action = rules.defectActions[defType];
            if (action) {
                defectPlan.push({
                    order: mainPlan.length + hiddenPlan.length + i + 1,
                    workCode: `defect_${defType}`,
                    description: `⚠️ ${action.action}`,
                    qty: 1,
                    unit: 'компл.',
                    reason: `Обнаружен дефект: ${defType} (${defect.severity || 'medium'})`,
                    confidence: 0.6,
                    source: 'defect_detection',
                    urgency: action.urgency,
                    priceEstimate: action.priceBase,
                });
            }
        });

        // 2d: Критические проверки
        const warnings = [];
        rules.criticalChecks.forEach(chk => {
            warnings.push({
                check: chk.check,
                message: chk.message,
                severity: chk.severity,
                snipRef: rules.snipRefs[0] || '',
            });
        });

        // 2e: Вопросы для уточнения
        const questions = se ? se.generateQuestions(objectType, dims, userAnswers) : [];

        // ── STEP 3: ACT — формирование итогового результата ───
        log.push({ step: 'act', message: 'Компиляция итогового плана...' });

        const fullPlan = [...mainPlan, ...hiddenPlan, ...defectPlan];

        // Calculate estimated total
        let estimatedTotal = 0;
        mainPlan.forEach(p => { estimatedTotal += (p.qty || 0) * 5000; }); // rough estimate
        hiddenPlan.forEach(p => { estimatedTotal += p.priceEstimate || 0; });
        defectPlan.forEach(p => { estimatedTotal += p.priceEstimate || 0; });

        const result = {
            objectType,
            region,
            dimensions: dims,
            plan: fullPlan,
            mainWorks: mainPlan,
            hiddenWorks: hiddenPlan,
            defectRepairs: defectPlan,
            workSequence: rules.sequence,
            snipRefs: rules.snipRefs,
            warnings,
            questions,
            estimatedTotal,
            confidence: calculatePlanConfidence(scene, dims, userAnswers),
            log,
            generatedAt: new Date().toISOString(),
            planningTimeMs: Date.now() - startTime,
        };

        console.log(`[ConstructionPlanner] ✅ Plan ready: ${fullPlan.length} items, ≈${Math.round(estimatedTotal).toLocaleString('ru-RU')} ₸`);
        return result;
    }

    // ─────────────────────────────────────────────────────────
    // HELPER: Confidence calculation
    // ─────────────────────────────────────────────────────────

    function calculatePlanConfidence(scene, dims, answers) {
        let score = 0.3; // base

        // Has AI detections
        if (scene.detections && scene.detections.length > 0) score += 0.15;

        // Has real measurements (not defaults)
        if (dims.area_m2 && dims.area_m2 !== 50) score += 0.10;
        if (dims.height_m && dims.height_m !== 3.0) score += 0.05;
        if (dims.depth_m && dims.depth_m !== 1.2) score += 0.05;

        // Has user answers
        const ansCount = Object.keys(answers || {}).length;
        if (ansCount >= 1) score += 0.10;
        if (ansCount >= 3) score += 0.10;

        // Has scale calibration
        if (scene.scale_factor) score += 0.15;

        return Math.min(0.95, Math.round(score * 100) / 100);
    }

    // ─────────────────────────────────────────────────────────
    // SUGGEST HIDDEN WORKS (standalone helper)
    // ─────────────────────────────────────────────────────────

    function suggestHiddenWorks(objectType, detections, dims) {
        const rules = CONSTRUCTION_RULES[objectType] || CONSTRUCTION_RULES.generic;
        const se = window.SmartEstimateEngine;
        if (!se) return [];

        const hidden = se.getHiddenWorks(objectType, dims, 1.0);

        // Add defect-based recommendations
        (detections || []).forEach(det => {
            if (det.type === 'defect' || det.category === 'defect') {
                const defType = det.defect_type || det.label || 'crack';
                const action = rules.defectActions[defType];
                if (action) {
                    hidden.push({
                        name: action.action,
                        unit: 'компл.',
                        qty: 1,
                        price: action.priceBase,
                        subtotal: action.priceBase,
                        reason: `Дефект: ${defType}`,
                        hidden: true,
                        urgency: action.urgency,
                    });
                }
            }
        });

        return hidden;
    }

    // ─────────────────────────────────────────────────────────
    // REFINE WITH ANSWERS — пересчёт плана с ответами пользователя
    // ─────────────────────────────────────────────────────────

    function refineWithAnswers(existingPlan, newAnswers) {
        if (!existingPlan) return null;

        // Update dimensions from answers
        const updatedDims = { ...existingPlan.dimensions };
        for (const [key, val] of Object.entries(newAnswers)) {
            if (typeof val === 'number' && updatedDims[key] !== undefined) {
                updatedDims[key] = val;
            }
        }

        // Recalculate volumes if needed
        if (newAnswers.depth_m || newAnswers.area_m2) {
            updatedDims.volume_m3 = updatedDims.area_m2 * (updatedDims.depth_m || updatedDims.height_m || 0.3);
        }

        // Re-plan with updated data
        const scene = {
            objectType: existingPlan.objectType,
            detections: [],
            measurements: updatedDims,
        };

        return plan(scene, {
            region: existingPlan.region,
            userAnswers: { ...(existingPlan._userAnswers || {}), ...newAnswers },
            defects: existingPlan.defectRepairs?.map(d => ({
                type: d.workCode?.replace('defect_', '') || 'crack',
                severity: 'medium',
            })) || [],
        });
    }

    // ─────────────────────────────────────────────────────────
    // EXPLAIN — текстовое обоснование сметы
    // ─────────────────────────────────────────────────────────

    function explain(planResult) {
        if (!planResult) return 'План не сформирован.';

        const lines = [];
        lines.push(`📋 **План работ для "${planResult.objectType}"**`);
        lines.push(`📍 Регион: ${planResult.region}`);
        lines.push(`📐 Площадь: ${planResult.dimensions.area_m2} м², высота: ${planResult.dimensions.height_m} м`);
        lines.push('');

        // SNiP references
        if (planResult.snipRefs.length > 0) {
            lines.push(`📖 Нормативы: ${planResult.snipRefs.join(', ')}`);
            lines.push('');
        }

        // Main works
        lines.push(`**I. Основные работы (${planResult.mainWorks.length}):**`);
        planResult.mainWorks.forEach(w => {
            lines.push(`  ${w.order}. ${w.description} — ${w.qty} ${w.unit}`);
            lines.push(`     Обоснование: ${w.reason}`);
        });
        lines.push('');

        // Hidden works
        if (planResult.hiddenWorks.length > 0) {
            lines.push(`**II. Сопутствующие работы (${planResult.hiddenWorks.length}):**`);
            planResult.hiddenWorks.forEach(h => {
                lines.push(`  ${h.order}. ${h.description} — ${h.qty} ${h.unit}`);
                lines.push(`     ${h.reason}`);
            });
            lines.push('');
        }

        // Defects
        if (planResult.defectRepairs.length > 0) {
            lines.push(`**III. Ремонт дефектов (${planResult.defectRepairs.length}):**`);
            planResult.defectRepairs.forEach(d => {
                lines.push(`  ${d.order}. ${d.description}`);
                lines.push(`     ${d.reason} (срочность: ${d.urgency})`);
            });
            lines.push('');
        }

        // Warnings
        if (planResult.warnings.length > 0) {
            lines.push('**⚠️ Проверки по СНиП:**');
            planResult.warnings.forEach(w => {
                const icon = w.severity === 'critical' ? '🔴' : '🟡';
                lines.push(`  ${icon} ${w.message}`);
            });
            lines.push('');
        }

        // Questions
        if (planResult.questions.length > 0) {
            lines.push(`**❓ Уточняющие вопросы (${planResult.questions.length}):**`);
            planResult.questions.forEach(q => {
                lines.push(`  • ${q.label}`);
            });
            lines.push('');
        }

        lines.push(`💰 Ориентировочная стоимость: ≈${Math.round(planResult.estimatedTotal).toLocaleString('ru-RU')} ₸`);
        lines.push(`📊 Уверенность: ${Math.round(planResult.confidence * 100)}%`);
        lines.push(`⏱️ Планирование: ${planResult.planningTimeMs}мс`);

        return lines.join('\n');
    }

    // ─────────────────────────────────────────────────────────
    // VALIDATE PLAN — проверка полноты плана (WBS coverage)
    // ─────────────────────────────────────────────────────────

    /**
     * Validate that plan covers all required WBS sections.
     * @param {object} planResult — output of plan()
     * @returns {{valid: boolean, coverage: object, missing: string[], score: number}}
     */
    function validatePlan(planResult) {
        if (!planResult) return { valid: false, coverage: {}, missing: ['Нет плана'], score: 0 };

        const required = {
            'excavation': { label: 'Земляные работы', found: false },
            'formwork': { label: 'Опалубка', found: false },
            'rebar': { label: 'Армирование', found: false },
            'concrete': { label: 'Бетонирование', found: false },
            'waterproof': { label: 'Гидроизоляция', found: false },
            'backfill': { label: 'Обратная засыпка', found: false },
        };

        // Type-specific required
        const typeReq = {
            'wall_brick': ['masonry', 'plaster', 'mortar'],
            'wall_block': ['masonry', 'adhesive', 'armobelt'],
            'floor_screed': ['demolition', 'screed', 'finish'],
            'roof_gable': ['frame', 'cover', 'insulation'],
            'roof_flat': ['insulation', 'waterproof', 'drainage'],
        };

        const objType = planResult.objectType;
        (typeReq[objType] || []).forEach(k => {
            if (!required[k]) required[k] = { label: k, found: false };
        });

        // Check what's found
        const allItems = [...(planResult.mainWorks || []), ...(planResult.hiddenWorks || [])];
        for (const item of allItems) {
            const desc = (item.description + ' ' + (item.workCode || '')).toLowerCase();
            for (const [key, val] of Object.entries(required)) {
                if (desc.includes(key) || desc.includes(val.label.toLowerCase())) {
                    val.found = true;
                }
            }
        }

        const missing = Object.entries(required)
            .filter(([, v]) => !v.found)
            .map(([, v]) => v.label);

        const totalReq = Object.keys(required).length;
        const foundCount = totalReq - missing.length;
        const score = totalReq > 0 ? Math.round(foundCount / totalReq * 100) : 0;

        return {
            valid: missing.length === 0,
            coverage: required,
            missing,
            score,
            totalSections: totalReq,
            coveredSections: foundCount,
        };
    }

    // ─────────────────────────────────────────────────────────
    // ESTIMATE TIMELINE — расчёт сроков по нормам
    // ─────────────────────────────────────────────────────────

    const WORK_NORMS = {
        excavation: { hours_per_m3: 0.8, crew: 3, label: 'Земляные работы' },
        formwork: { hours_per_m2: 1.5, crew: 2, label: 'Опалубка' },
        rebar: { hours_per_kg: 0.05, crew: 3, label: 'Армирование' },
        concrete: { hours_per_m3: 2.0, crew: 4, label: 'Бетонирование' },
        masonry: { hours_per_m2: 2.5, crew: 2, label: 'Кладка' },
        plaster: { hours_per_m2: 0.6, crew: 2, label: 'Штукатурка' },
        waterproof: { hours_per_m2: 0.4, crew: 2, label: 'Гидроизоляция' },
        screed: { hours_per_m2: 0.3, crew: 3, label: 'Стяжка' },
        roofing: { hours_per_m2: 1.2, crew: 3, label: 'Кровля' },
        paint: { hours_per_m2: 0.2, crew: 2, label: 'Покраска' },
        pipe_laying: { hours_per_m: 0.5, crew: 2, label: 'Прокладка труб' },
        demolition: { hours_per_m2: 0.4, crew: 3, label: 'Демонтаж' },
        curing_concrete: { days: 7, crew: 1, label: 'Выдержка бетона' },
        curing_screed: { days: 21, crew: 0, label: 'Выдержка стяжки' },
    };

    /**
     * Estimate timeline for a plan.
     * @param {object} planResult
     * @param {number} workHoursPerDay - default 8
     * @returns {{totalDays, phases: [], criticalPath, manHours}}
     */
    function estimateTimeline(planResult, workHoursPerDay = 8) {
        if (!planResult) return { totalDays: 0, phases: [], criticalPath: [], manHours: 0 };

        const dims = planResult.dimensions || {};
        const objType = planResult.objectType || 'generic';
        const rules = CONSTRUCTION_RULES[objType] || CONSTRUCTION_RULES.generic;

        const phases = rules.sequence.map((stepName, idx) => {
            // Try to match norms
            let hours = 8; // default 1 day
            let crew = 2;
            const lc = stepName.toLowerCase();

            for (const [key, norm] of Object.entries(WORK_NORMS)) {
                if (lc.includes(key) || lc.includes(norm.label.toLowerCase())) {
                    if (norm.days) {
                        hours = norm.days * workHoursPerDay;
                    } else if (norm.hours_per_m3) {
                        hours = (dims.volume_m3 || 10) * norm.hours_per_m3;
                    } else if (norm.hours_per_m2) {
                        hours = (dims.area_m2 || 50) * norm.hours_per_m2;
                    } else if (norm.hours_per_m) {
                        hours = (dims.perimeter_m || 30) * norm.hours_per_m;
                    } else if (norm.hours_per_kg) {
                        hours = ((dims.volume_m3 || 10) * 80) * norm.hours_per_kg;
                    }
                    crew = norm.crew || 2;
                    break;
                }
            }

            const days = Math.max(1, Math.ceil(hours / workHoursPerDay));

            return {
                order: idx + 1,
                name: stepName,
                durationDays: days,
                manHours: Math.round(hours * crew),
                crew,
            };
        });

        const totalDays = phases.reduce((s, p) => s + p.durationDays, 0);
        const manHours = phases.reduce((s, p) => s + p.manHours, 0);

        return {
            totalDays,
            totalWeeks: Math.ceil(totalDays / 5),
            phases,
            manHours,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + totalDays * 86400000).toISOString().split('T')[0],
        };
    }

    // ─────────────────────────────────────────────────────────
    // GET DEPENDENCIES — граф зависимостей работ
    // ─────────────────────────────────────────────────────────

    const DEPENDENCY_GRAPH = {
        foundation_strip: [
            { from: 'Разметка', to: 'Разработка грунта', type: 'FS' },
            { from: 'Разработка грунта', to: 'Устройство подушки', type: 'FS' },
            { from: 'Устройство подушки', to: 'Установка опалубки', type: 'FS' },
            { from: 'Установка опалубки', to: 'Гидроизоляция', type: 'FS' },
            { from: 'Гидроизоляция', to: 'Монтаж арматурного каркаса', type: 'FS' },
            { from: 'Монтаж арматурного каркаса', to: 'Бетонирование', type: 'FS' },
            { from: 'Бетонирование', to: 'Уход за бетоном', type: 'FS' },
            { from: 'Уход за бетоном', to: 'Снятие опалубки', type: 'FS' },
            { from: 'Снятие опалубки', to: 'Обратная засыпка', type: 'FS' },
        ],
        wall_brick: [
            { from: 'Разметка', to: 'Кладка кирпича', type: 'FS' },
            { from: 'Кладка кирпича', to: 'Армирование', type: 'SS' },
            { from: 'Кладка кирпича', to: 'Устройство перемычек', type: 'FS' },
            { from: 'Устройство перемычек', to: 'Расшивка', type: 'FS' },
        ],
        floor_screed: [
            { from: 'Демонтаж', to: 'Грунтовка', type: 'FS' },
            { from: 'Грунтовка', to: 'Гидроизоляция', type: 'FS' },
            { from: 'Гидроизоляция', to: 'Установка маяков', type: 'FS' },
            { from: 'Установка маяков', to: 'Заливка стяжки', type: 'FS' },
            { from: 'Заливка стяжки', to: 'Уход', type: 'FS' },
            { from: 'Уход', to: 'Финишное покрытие', type: 'FS' },
        ],
        roof_gable: [
            { from: 'Мауэрлат', to: 'Стропильная система', type: 'FS' },
            { from: 'Стропильная система', to: 'Обрешётка', type: 'FS' },
            { from: 'Обрешётка', to: 'Пароизоляция', type: 'SS' },
            { from: 'Пароизоляция', to: 'Утеплитель', type: 'FS' },
            { from: 'Утеплитель', to: 'Мембрана', type: 'FS' },
            { from: 'Мембрана', to: 'Кровельное покрытие', type: 'FS' },
        ],
    };

    /**
     * Get dependency graph for work sequence.
     * @param {string} objectType
     * @returns {{edges: [], nodes: [], hasCriticalPath: boolean}}
     */
    function getDependencies(objectType) {
        const rules = CONSTRUCTION_RULES[objectType] || CONSTRUCTION_RULES.generic;
        const edges = DEPENDENCY_GRAPH[objectType] || [];

        // If no pre-defined graph, create linear chain
        if (edges.length === 0) {
            for (let i = 0; i < rules.sequence.length - 1; i++) {
                edges.push({
                    from: rules.sequence[i],
                    to: rules.sequence[i + 1],
                    type: 'FS', // Finish-Start
                });
            }
        }

        const nodes = [...new Set(edges.flatMap(e => [e.from, e.to]))];

        return {
            objectType,
            edges,
            nodes,
            totalSteps: nodes.length,
            hasCriticalPath: true,
        };
    }

    // ─────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────

    window.ConstructionPlanner = {
        // Core
        plan,
        refineWithAnswers,
        suggestHiddenWorks,
        explain,

        // New
        validatePlan,
        estimateTimeline,
        getDependencies,

        // Knowledge base access
        RULES: CONSTRUCTION_RULES,
        WORK_NORMS,
        DEPENDENCY_GRAPH,
        getRules: (type) => CONSTRUCTION_RULES[type] || CONSTRUCTION_RULES.generic,
        getSequence: (type) => (CONSTRUCTION_RULES[type] || CONSTRUCTION_RULES.generic).sequence,
        getDefectActions: (type) => (CONSTRUCTION_RULES[type] || CONSTRUCTION_RULES.generic).defectActions,
    };

    console.log('[ConstructionPlanner] ✅ Planner ready — ReAct pattern, SNiP rules, timeline, dependencies');

})();
