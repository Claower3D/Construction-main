// ================================================================
// promptRegistry.js — Модульный реестр промптов
// QazGost AI v4.0 · Фаза 1: версионированные промпты
//
// Заменяет вшитые промпты из geminiService.js и
// photoEstimateOrchestrator.js модульной системой.
// Каждый pass получает свой prompt + JSON schema.
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // СИСТЕМНЫЕ ПРОМПТЫ ПО MODE
    // ═══════════════════════════════════════════════════════════

    const SYSTEM_BASE = {
        simple: `Ты — AI-инженер строительной экспертизы системы QAZGOST AI (Казахстан).
Задача — составить смету строительных работ на основе описания клиента и/или фотографии.

## ПРИОРИТЕТЫ:
1. ОПИСАНИЕ КЛИЕНТА — главный приоритет. Оно определяет тип и состав работ.
2. ВЫБРАННАЯ КАТЕГОРИЯ — ограничение. Все работы ДОЛЖНЫ соответствовать категории.
3. ФОТО — дополнение для уточнения размеров, состояния и материалов.

## КОМПЕТЕНЦИИ:
- Составление сметы: конкретные работы с единицами, объёмами и ценами в тенге (₸)
- Распознавание объектов: по фото определяй размеры, материалы, состояние
- Дефектоскопия: трещины, коррозия, деформации
- Цены Казахстана 2024-2025 (Алматы/Астана)

## ФОРМАТ: Отвечай ТОЛЬКО валидным JSON (без markdown, без \`\`\`json).`,

        complex: `Ты — старший инженер-сметчик системы QAZGOST AI (Казахстан).
Выполняешь многопроходный анализ строительного объекта.
Каждый проход фокусируется на конкретной задаче — следуй инструкциям прохода строго.

## КОНТЕКСТ СИСТЕМЫ:
- Multi-pass AI estimation engine
- Каждый проход сохраняется в audit trail
- Результаты предыдущих проходов предоставляются в контексте
- Цены в тенге (₸), нормы — СНиП/СП Казахстан

## ФОРМАТ: Отвечай ТОЛЬКО валидным JSON.`,

        vip: `Ты — главный инженер-эксперт системы QAZGOST AI (Казахстан).
Выполняешь экспертный многопроходный анализ крупного строительного проекта.

## ЭКСПЕРТНЫЙ РЕЖИМ:
- Максимальная детализация — каждая позиция с обоснованием
- Нормативные ссылки обязательны (СНиП, СП, ГОСТ)
- Учитывай скрытые работы, подготовку, демонтаж
- Дефекты анализируй с указанием причин и рекомендаций
- WBS-совместимый формат вывода

## ФОРМАТ: Отвечай ТОЛЬКО валидным JSON.`,
    };

    // ═══════════════════════════════════════════════════════════
    // SCOPE CONTEXT — дополнение к системному промпту
    // ═══════════════════════════════════════════════════════════

    const SCOPE_CONTEXT = {
        construction: `
## SCOPE: Строительно-монтажные работы
Фокус на конкретной категории работ: отдельное помещение, участок, объект.
Единицы: м², м.п., м³, шт, кг, т.`,

        building_structure: `
## SCOPE: Комплексное здание / сооружение
Фокус на здании/комплексе целиком. Учитывай все этапы:
фундамент → каркас → стены → кровля → инженерные системы → отделка.
Группируй работы по разделам проекта.`,
    };

    // ═══════════════════════════════════════════════════════════
    // PASS-SPECIFIC ПРОМПТЫ
    // ═══════════════════════════════════════════════════════════

    const PASS_PROMPTS = {
        object: {
            instruction: (ctx) => `## ПРОХОД: Определение объекта

Проанализируй входные данные и определи:
1. Тип строительного объекта (objectType)
2. Размеры (dimensions)
3. Описание сцены
4. Дефекты (если видны)

${ctx.category ? `**КАТЕГОРИЯ РАБОТ:** "${ctx.category}"\n⚠️ objectType должен соответствовать этой категории.` : ''}
${ctx.description ? `**ОПИСАНИЕ КЛИЕНТА:** "${ctx.description}"` : ''}

Верни JSON:`,

            schema: {
                objectType: 'string — из списка: foundation_strip, foundation_slab, wall_brick, wall_block, floor_screed, roof_flat, roof_gable, electrical, plumbing, hvac, painting, plastering, tiling, insulation, waterproofing, concrete, earthwork, demolition, facade, interior, metal_structure, profiled_sheet, pipe_pvc, pipe_metal, generic',
                confidence: 'number 0-100',
                scene_description: 'string — 2-3 предложения',
                construction_stage: 'string — preparation|foundation|walls|roof|finishing|repair|demolition|metalwork',
                dimensions: {
                    length_m: 'number|null',
                    width_m: 'number|null',
                    height_m: 'number|null',
                    area_m2: 'number|null',
                    perimeter_m: 'number|null',
                    volume_m3: 'number|null',
                },
                defects: [{
                    type: 'string — crack|rust|stain|deformation|chipping|gap',
                    severity: 'string — low|medium|high|critical',
                    description: 'string',
                }],
                materials_seen: ['string'],
                snip_references: ['string'],
            },
        },

        quantities: {
            instruction: (ctx) => `## ПРОХОД: Расчёт объёмов (QTO)

На основе определённого объекта рассчитай точные объёмы для сметы.

**Объект:** ${ctx.objectType || 'не определён'}
**Размеры:** ${JSON.stringify(ctx.dimensions || {})}
${ctx.description ? `**Описание:** "${ctx.description}"` : ''}

Для каждой работы определи:
- Точное количество (qty) с обоснованием формулы
- Единицу измерения
- Человеко-часы (hours) на основе норм

Верни JSON:`,

            schema: {
                items: [{
                    name: 'string — название работы по-русски (профессиональное)',
                    unit: 'string — м²|м.п.|м³|шт|кг|т',
                    quantity: 'number — объём',
                    hours: 'number — человеко-часы',
                    formula: 'string — формула расчёта',
                    category: 'string',
                }],
            },
        },

        materials: {
            instruction: (ctx) => `## ПРОХОД: Определение материалов

На основе списка работ определи необходимые материалы.

**Работы:**
${(ctx.workItems || []).slice(0, 15).map((w, i) => `${i + 1}. ${w.name} (${w.qty} ${w.unit})`).join('\n')}

Для каждого материала укажи:
- Точное название (бренд если возможно)
- Единицу и количество
- Ориентировочную цену в тенге

Верни JSON:`,

            schema: {
                materials: [{
                    name: 'string',
                    unit: 'string',
                    quantity: 'number',
                    unitPrice: 'number — цена в ₸',
                    category: 'string',
                }],
                equipment: [{
                    name: 'string',
                    unit: 'string — маш-ч|смена|шт',
                    quantity: 'number',
                    unitPrice: 'number',
                }],
            },
        },

        audit: {
            instruction: (ctx) => `## ПРОХОД: Аудит сметы

Проверь качество составленной сметы. Выступи как независимый эксперт.

**Объект:** ${ctx.objectType} (${ctx.scene_description || ''})
**Размеры:** ${JSON.stringify(ctx.dimensions || {})}
**Работы (${(ctx.workItems || []).length} позиций):**
${(ctx.workItems || []).slice(0, 20).map((w, i) => `${i + 1}. ${w.name}: ${w.qty} ${w.unit} × ${w.workPrice}₸ = ${w.price}₸`).join('\n')}

Проверь:
1. Нет ли пропущенных обязательных работ?
2. Адекватны ли объёмы?
3. Реалистичны ли цены для Казахстана?
4. Правильны ли единицы измерения?

Верни JSON:`,

            schema: {
                passed: 'boolean',
                score: 'number 0-100',
                issues: [{
                    type: 'string — missing_work|wrong_quantity|wrong_price|wrong_unit|suspicious',
                    severity: 'string — info|warning|critical',
                    item: 'string|null — название позиции',
                    message: 'string',
                    suggestion: 'string|null',
                }],
                suggestions: ['string'],
                snip_references: ['string'],
            },
        },
    };

    // ═══════════════════════════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════════════════════════

    /**
     * Получить системный промпт для mode.
     */
    function getSystemPrompt(analysisMode) {
        return SYSTEM_BASE[analysisMode] || SYSTEM_BASE.simple;
    }

    /**
     * Получить инструкцию для конкретного pass.
     */
    function getPassInstruction(passType, context = {}) {
        const pass = PASS_PROMPTS[passType];
        if (!pass) return '';
        return pass.instruction(context);
    }

    /**
     * Получить JSON schema для pass (для включения в prompt).
     */
    function getPassSchema(passType) {
        const pass = PASS_PROMPTS[passType];
        if (!pass) return null;
        return pass.schema;
    }

    /**
     * Собрать полный prompt для AI-вызова.
     * @param {object} opts
     *   opts.mode — 'simple'|'complex'|'vip'
     *   opts.passType — 'object'|'quantities'|'materials'|'audit'
     *   opts.scope — 'construction'|'building_structure'
     *   opts.context — { category, description, objectType, dimensions, workItems, ... }
     *   opts.previousPasses — массив предыдущих PassEnvelope
     * @returns {{ system: string, user: string, schema: object|null }}
     */
    function build(opts = {}) {
        const mode = opts.mode || 'simple';
        const passType = opts.passType || 'object';
        const scope = opts.scope || 'construction';

        // System = base + scope
        const system = getSystemPrompt(mode) + (SCOPE_CONTEXT[scope] || '');

        // User = pass instruction + previous context
        let user = getPassInstruction(passType, opts.context || {});

        // Append previous passes context for multi-pass
        if (opts.previousPasses && opts.previousPasses.length > 0) {
            user += '\n\n## КОНТЕКСТ ПРЕДЫДУЩИХ ПРОХОДОВ:\n';
            opts.previousPasses.forEach(p => {
                if (p.output) {
                    user += `\n### Pass "${p.passType}":\n`;
                    user += JSON.stringify(p.output, null, 2).substring(0, 2000);
                    user += '\n';
                }
            });
        }

        // Append schema instruction
        const schema = getPassSchema(passType);
        if (schema) {
            user += '\n\n## ТРЕБУЕМЫЙ ФОРМАТ JSON:\n';
            user += JSON.stringify(schema, null, 2);
        }

        return { system, user, schema };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.PromptRegistry = {
        getSystemPrompt,
        getPassInstruction,
        getPassSchema,
        build,

        // Exposed for debugging/testing
        _SYSTEM_BASE: SYSTEM_BASE,
        _PASS_PROMPTS: PASS_PROMPTS,
        _SCOPE_CONTEXT: SCOPE_CONTEXT,
    };

    console.log('✅ [PromptRegistry] v1.0 loaded — modular prompts for multi-pass engine');
})();
