// ============================================================
// SmartEstimateEngine.js — Умный движок сметы v1.0
// Работы + Материалы + Инструмент + Труд
// Использует: AI_WRK_*, AI_MAT_*, AI_EQ_*, LABOR_NORMS_DB
// ============================================================

(function () {
    'use strict';

    // ── Региональные ставки труда (тг/ч) ──────────────────────
    // Все 20 областей Казахстана + 3 города респ. значения
    const LABOR_RATES = {
        'алматы': 5500, 'almaty': 5500,
        'астана': 5200, 'astana': 5200,
        'шымкент': 4200, 'shymkent': 4200,
        'атырау': 5000, 'atyrau': 5000,
        'актау': 5000, 'aktau': 5000,     // Мангистау
        'актобе': 4300, 'aktobe': 4300,
        'тараз': 3800, 'taraz': 3800,     // Жамбыл
        'павлодар': 4000, 'pavlodar': 4000,
        'караганда': 4200, 'karaganda': 4200,
        'костанай': 3900, 'kostanay': 3900,
        'усть-каменогорск': 4200, 'ust-kamenogorsk': 4200,   // ВКО
        'семей': 3800, 'semey': 3800,
        'петропавловск': 3800, 'petropavlovsk': 3800,   // СКО
        'кызылорда': 3600, 'kyzylorda': 3600,
        'талдыкорган': 3700, 'taldykorgan': 3700,   // Жетысу
        'кокшетау': 3700, 'kokshetau': 3700,   // Акмолинская
        'туркестан': 3500, 'turkestan': 3500,
        'уральск': 4000, 'uralsk': 4000,   // ЗКО
        'жезказган': 4100, 'zhezkazgan': 4100,   // Улытау
        'конаев': 4500, 'konayev': 4500,   // Алматинская обл.
        '_default': 4500
    };
    function getLaborRate(city) {
        return LABOR_RATES[(city || 'default').toLowerCase()] || LABOR_RATES._default;
    }

    // ── Коэффициенты потерь СНиП ───────────────────────────────
    const WASTE = {
        concrete: 1.05, rebar: 1.03, brick: 1.07, block: 1.05,
        sand: 1.10, gravel: 1.08, wood: 1.10, roofing: 1.12,
        insulation: 1.08, waterproofing: 1.15, plaster: 1.05,
        paint: 1.10, tile: 1.10, mortar: 1.05, default: 1.05
    };

    // ── Региональные надбавки к ценам (логистика + рынок) ──────
    const REG_COEF = {
        'алматы': 1.15, 'almaty': 1.15,
        'астана': 1.12, 'astana': 1.12,
        'шымкент': 1.0, 'shymkent': 1.0,
        'атырау': 1.18, 'atyrau': 1.18,
        'актау': 1.20, 'aktau': 1.20,
        'актобе': 1.05, 'aktobe': 1.05,
        'тараз': 0.92, 'taraz': 0.92,
        'павлодар': 0.95, 'pavlodar': 0.95,
        'караганда': 0.97, 'karaganda': 0.97,
        'костанай': 0.93, 'kostanay': 0.93,
        'усть-каменогорск': 1.0, 'ust-kamenogorsk': 1.0,
        'семей': 0.90, 'semey': 0.90,
        'петропавловск': 0.92, 'petropavlovsk': 0.92,
        'кызылорда': 0.88, 'kyzylorda': 0.88,
        'талдыкорган': 0.90, 'taldykorgan': 0.90,
        'кокшетау': 0.92, 'kokshetau': 0.92,
        'туркестан': 0.85, 'turkestan': 0.85,
        'уральск': 0.95, 'uralsk': 0.95,
        'жезказган': 0.97, 'zhezkazgan': 0.97,
        'конаев': 1.08, 'konayev': 1.08,
        _default: 1.0
    };
    function getRegCoef(city) {
        return REG_COEF[(city || '').toLowerCase()] || REG_COEF._default;
    }

    // ═══════════════════════════════════════════════════════════
    // 1a. STAGE & DESCRIPTION MAPS — описания и этапы для позиций
    // ═══════════════════════════════════════════════════════════

    const WORK_STAGE_MAP = {
        'разработка грунта': { stage: 'Земляные работы', section: 'Основные работы', desc: 'Механизированная или ручная выемка грунта до проектной отметки' },
        'разметка': { stage: 'Подготовительные', section: 'Подготовительные', desc: 'Геодезическая разбивка осей и установка обносок' },
        'ленточный фундамент': { stage: 'Бетонные работы', section: 'Основные работы', desc: 'Устройство монолитного ленточного фундамента' },
        'армирование': { stage: 'Бетонные работы', section: 'Основные работы', desc: 'Монтаж арматурного каркаса по проекту' },
        'заливка': { stage: 'Бетонные работы', section: 'Основные работы', desc: 'Укладка бетонной смеси с виброуплотнением' },
        'опалубка': { stage: 'Бетонные работы', section: 'Основные работы', desc: 'Установка и крепление щитовой опалубки' },
        'гидроизоляция': { stage: 'Изоляционные', section: 'Основные работы', desc: 'Нанесение гидроизоляционного покрытия (обмазочное или мембранное)' },
        'уплотнение': { stage: 'Земляные работы', section: 'Основные работы', desc: 'Послойное уплотнение грунта виброплитой' },
        'кладка кирпич': { stage: 'Каменные работы', section: 'Основные работы', desc: 'Кирпичная кладка с перевязкой швов' },
        'кладка газобетон': { stage: 'Каменные работы', section: 'Основные работы', desc: 'Кладка газобетонных блоков на клей' },
        'штукатурка': { stage: 'Отделочные', section: 'Отделочные', desc: 'Оштукатуривание поверхности по маякам' },
        'расшивка': { stage: 'Отделочные', section: 'Отделочные', desc: 'Декоративная обработка кладочных швов' },
        'стяжка': { stage: 'Отделочные', section: 'Основные работы', desc: 'Устройство цементно-песчаной стяжки по маякам' },
        'грунтовка': { stage: 'Подготовительные', section: 'Подготовительные', desc: 'Грунтование основания для обеспечения адгезии' },
        'стропил': { stage: 'Каркас кровли', section: 'Основные работы', desc: 'Монтаж стропильной системы по проекту' },
        'металлочерепица': { stage: 'Кровельные', section: 'Основные работы', desc: 'Укладка кровельного покрытия из металлочерепицы' },
        'пароизоляция': { stage: 'Изоляционные', section: 'Основные работы', desc: 'Монтаж пароизоляционной плёнки' },
        'водосточная': { stage: 'Завершающие', section: 'Завершающие', desc: 'Монтаж водосточной системы (желоба, воронки, трубы)' },
        'наплавляем': { stage: 'Кровельные', section: 'Основные работы', desc: 'Наплавление рулонной кровли газовой горелкой' },
        'утепление': { stage: 'Изоляционные', section: 'Основные работы', desc: 'Монтаж теплоизоляционного слоя' },
        'демонтаж': { stage: 'Подготовительные', section: 'Подготовительные', desc: 'Разборка и демонтаж существующих конструкций' },
        'окраска': { stage: 'Отделочные', section: 'Отделочные', desc: 'Покраска поверхности в 2 слоя' },
        'покраска': { stage: 'Отделочные', section: 'Отделочные', desc: 'Покраска поверхности с грунтовкой' },
        'буронабивная': { stage: 'Свайные работы', section: 'Основные работы', desc: 'Бурение скважин и заливка свай' },
        'ростверк': { stage: 'Бетонные работы', section: 'Основные работы', desc: 'Устройство монолитного ростверка по сваям' },
        'фундаментная плита': { stage: 'Бетонные работы', section: 'Основные работы', desc: 'Устройство монолитной фундаментной плиты' },
    };

    function _resolveStageAndDesc(workName) {
        const name = (workName || '').toLowerCase();
        for (const [key, info] of Object.entries(WORK_STAGE_MAP)) {
            if (name.includes(key)) return info;
        }
        return { stage: 'Основные работы', section: 'Основные работы', desc: '' };
    }

    // ═══════════════════════════════════════════════════════════
    // 1. WORK SELECTOR — подбор работ по типу объекта
    // ═══════════════════════════════════════════════════════════
    const WORK_MATRIX = {
        foundation_strip: {
            works: [
                { match: /Разработка грунта.*экскав/i, qty_key: 'volume_m3', default_qty: 40 },
                { match: /Ленточный фундамент 40/i, qty_key: 'perimeter_m', default_qty: 60 },
                { match: /Армирование.*фундамент/i, qty_key: 'perimeter_m', default_qty: 60 },
                { match: /Заливка фундамента.*М300/i, qty_key: 'volume_m3', default_qty: 30 },
                { match: /ГИ фундамента обмазочная/i, qty_key: 'area_m2', default_qty: 80 },
            ],
            materials: [
                { search: 'бетон м300', qty_key: 'volume_m3', default_qty: 30, waste: 'concrete' },
                { search: 'арматура диаметр', qty_key: 'rebar_kg', default_qty: 1200, waste: 'rebar' },
                { search: 'щебень', qty_key: 'gravel_m3', default_qty: 6, waste: 'gravel' },
                { search: 'песок речной', qty_key: 'sand_m3', default_qty: 5, waste: 'sand' },
                { search: 'пеноплекс', qty_key: 'insul_m2', default_qty: 80, waste: 'insulation' },
            ],
            equipment: ['Перфоратор SDS+', 'Вибратор глубинный', 'Бетоносмеситель'],
        },
        foundation_slab: {
            works: [
                { match: /Разработка грунта.*экскав/i, qty_key: 'volume_m3', default_qty: 60 },
                { match: /Уплотнение грунта|трамбовк/i, qty_key: 'area_m2', default_qty: 100 },
                { match: /Фундаментная плита 300/i, qty_key: 'area_m2', default_qty: 100 },
                { match: /Армирование плитного фунд/i, qty_key: 'area_m2', default_qty: 100 },
                { match: /ГИ фундамента мембранная/i, qty_key: 'area_m2', default_qty: 100 },
            ],
            materials: [
                { search: 'бетон м350', qty_key: 'volume_m3', default_qty: 40, waste: 'concrete' },
                { search: 'арматура диаметр', qty_key: 'rebar_kg', default_qty: 2500, waste: 'rebar' },
                { search: 'щебень', qty_key: 'gravel_m3', default_qty: 10, waste: 'gravel' },
                { search: 'геотекстиль', qty_key: 'area_m2', default_qty: 110, waste: 'default' },
            ],
            equipment: ['Виброплита 90кг', 'Вибратор глубинный', 'Лазерный уровень'],
        },
        foundation_pile: {
            works: [
                { match: /Буронабивная свая Ø200/i, qty_key: 'pile_count', default_qty: 20 },
                { match: /Ростверк 400/i, qty_key: 'perimeter_m', default_qty: 40 },
                { match: /Заливка фундамента.*М300/i, qty_key: 'volume_m3', default_qty: 15 },
            ],
            materials: [
                { search: 'бетон м300', qty_key: 'volume_m3', default_qty: 15, waste: 'concrete' },
                { search: 'арматура диаметр', qty_key: 'rebar_kg', default_qty: 600, waste: 'rebar' },
            ],
            equipment: ['Перфоратор SDS-max', 'Вибратор глубинный'],
        },
        wall_brick: {
            works: [
                { match: /Кладка кирпич|кирпич.*кладка/i, qty_key: 'area_m2', default_qty: 80 },
                { match: /Расшивка швов|расшивк/i, qty_key: 'area_m2', default_qty: 80 },
                { match: /Штукатурка цементно|штукатурк/i, qty_key: 'area_m2', default_qty: 80 },
            ],
            materials: [
                { search: 'кирпич рядовой', qty_key: 'brick_count', default_qty: 6000, waste: 'brick' },
                { search: 'раствор кладочный', qty_key: 'mortar_m3', default_qty: 5, waste: 'mortar' },
                { search: 'сетка кладочная', qty_key: 'mesh_m2', default_qty: 80, waste: 'default' },
            ],
            equipment: ['Растворомешалка', 'Перфоратор SDS+', 'Шуруповёрт'],
        },
        wall_block: {
            works: [
                { match: /Кладка газобетон\s*\d+мм/i, qty_key: 'area_m2', default_qty: 80 },
                { match: /Штукатурка цементно|штукатурк/i, qty_key: 'area_m2', default_qty: 80 },
            ],
            materials: [
                { search: 'газобетонный блок', qty_key: 'block_count', default_qty: 250, waste: 'block' },
                { search: 'клей для блоков', qty_key: 'glue_bags', default_qty: 30, waste: 'default' },
            ],
            equipment: ['Пила для газобетона', 'Растворомешалка', 'Лазерный уровень'],
        },
        floor_screed: {
            works: [
                { match: /Стяжка цементно|стяжка пол/i, qty_key: 'area_m2', default_qty: 50 },
                { match: /Грунтовка основания|грунтовк/i, qty_key: 'area_m2', default_qty: 50 },
            ],
            materials: [
                { search: 'смесь для стяжки', qty_key: 'bags', default_qty: 75, waste: 'default' },
                { search: 'фибра полипропилен', qty_key: 'kg', default_qty: 3, waste: 'default' },
                { search: 'пленка полиэтилен', qty_key: 'area_m2', default_qty: 55, waste: 'default' },
            ],
            equipment: ['Виброрейка', 'Дрель-миксер', 'Лазерный уровень'],
        },
        slab: {
            works: [
                { match: /Опалубка перекры|перекрытие опалуб/i, qty_key: 'area_m2', default_qty: 60 },
                { match: /Армирование плитного|арматур.*плит/i, qty_key: 'rebar_t', default_qty: 1.5 },
                { match: /Заливка.*М300|бетонирование.*перекры/i, qty_key: 'volume_m3', default_qty: 15 },
            ],
            materials: [
                { search: 'бетон м300', qty_key: 'volume_m3', default_qty: 15, waste: 'concrete' },
                { search: 'арматура диаметр', qty_key: 'rebar_kg', default_qty: 1500, waste: 'rebar' },
            ],
            equipment: ['Вибратор глубинный', 'Бетоносмеситель'],
        },
        roof_gable: {
            works: [
                { match: /Монтаж стропил|стропильн.*сист/i, qty_key: 'area_m2', default_qty: 150 },
                { match: /Монтаж металлочереп|металлочереп/i, qty_key: 'area_m2', default_qty: 150 },
                { match: /Пароизоляция|гидроизоляция.*кровл/i, qty_key: 'area_m2', default_qty: 150 },
                { match: /Монтаж водосточ|желоб/i, qty_key: 'perimeter_m', default_qty: 50 },
            ],
            materials: [
                { search: 'металлочерепица', qty_key: 'area_m2', default_qty: 150, waste: 'roofing' },
                { search: 'брус стропила', qty_key: 'length_m', default_qty: 400, waste: 'wood' },
                { search: 'пароизоляция', qty_key: 'area_m2', default_qty: 165, waste: 'default' },
                { search: 'утеплитель', qty_key: 'area_m2', default_qty: 150, waste: 'insulation' },
            ],
            equipment: ['Циркулярная пила', 'Шуруповёрт', 'Строительный фен'],
        },
        roof_flat: {
            works: [
                { match: /Наплавляем.*кровл|рубероид|кровл.*рулон/i, qty_key: 'area_m2', default_qty: 100 },
                { match: /Утепление кровл/i, qty_key: 'area_m2', default_qty: 100 },
                { match: /Пароизоляция/i, qty_key: 'area_m2', default_qty: 100 },
            ],
            materials: [
                { search: 'пвх мембрана', qty_key: 'area_m2', default_qty: 110, waste: 'roofing' },
                { search: 'минвата плита', qty_key: 'area_m2', default_qty: 100, waste: 'insulation' },
                { search: 'пароизоляция', qty_key: 'area_m2', default_qty: 110, waste: 'default' },
            ],
            equipment: ['Строительный фен', 'Шуруповёрт'],
        },
        generic: {
            works: [
                { match: /Демонтаж.*конструк|разборка/i, qty_key: 'area_m2', default_qty: 50 },
                { match: /Штукатурка цементно/i, qty_key: 'area_m2', default_qty: 50 },
                { match: /Окраска|покраска/i, qty_key: 'area_m2', default_qty: 50 },
            ],
            materials: [
                { search: 'краска фасадная', qty_key: 'area_m2', default_qty: 50, waste: 'paint' },
                { search: 'штукатурка', qty_key: 'area_m2', default_qty: 50, waste: 'plaster' },
            ],
            equipment: ['Перфоратор SDS+', 'Шлифмашина'],
        },
    };

    // ─── Поиск работы в каталоге AI_WRK_* по regex паттерну ──
    function findWork(pattern, unit) {
        for (const key of Object.keys(window)) {
            if (!key.startsWith('AI_WRK_') && !key.startsWith('AI_WORK_')) continue;
            const cat = window[key];
            if (!cat || typeof cat !== 'object') continue;
            for (const [, item] of Object.entries(cat)) {
                if (!item || !item.name) continue;
                if (pattern.test(item.name)) {
                    if (!unit || item.unit === unit) return item;
                }
            }
        }
        return null;
    }

    // ─── Поиск материала в каталоге AI_MAT_* по тексту ────────
    function findMaterial(searchText) {
        const term = searchText.toLowerCase();
        let best = null;
        let bestScore = 0;
        for (const key of Object.keys(window)) {
            if (!key.startsWith('AI_MAT_')) continue;
            const cat = window[key];
            if (!cat || typeof cat !== 'object') continue;
            for (const [, item] of Object.entries(cat)) {
                if (!item || !item.name || !item.price) continue;
                const name = item.name.toLowerCase();
                const words = term.split(' ').filter(Boolean);
                const matches = words.filter(w => name.includes(w)).length;
                const score = matches / words.length;
                if (score > bestScore) { bestScore = score; best = item; }
            }
        }
        return bestScore >= 0.5 ? best : null;
    }

    // ─── Поиск оборудования в каталоге AI_EQ_* ────────────────
    function findEquipment(searchText) {
        const term = searchText.toLowerCase();
        let best = null;
        let bestScore = 0;
        for (const key of Object.keys(window)) {
            if (!key.startsWith('AI_EQ_')) continue;
            const cat = window[key];
            if (!cat || typeof cat !== 'object') continue;
            for (const [, item] of Object.entries(cat)) {
                if (!item || !item.name || !item.price) continue;
                const name = item.name.toLowerCase();
                const words = term.split(' ').filter(Boolean);
                const matches = words.filter(w => name.includes(w)).length;
                const score = matches / words.length;
                if (score > bestScore) { bestScore = score; best = item; }
            }
        }
        return bestScore >= 0.4 ? best : null;
    }

    // ═══════════════════════════════════════════════════════════
    // 2. DIMENSIONS RESOLVER — извлекаем размеры из Qwen/params
    // ═══════════════════════════════════════════════════════════
    function resolveDimensions(qwenResult, objectParams, objectType) {
        const qd = (qwenResult && qwenResult.dimensions_estimate) || {};
        const p = objectParams || {};

        const area_m2 = qd.area_m2 || (p.length && p.width ? p.length * p.width : null) || 50;
        const perimeter_m = qd.perimeter_m || (p.perimeter) || Math.sqrt(area_m2) * 4;
        const height_m = qd.height_m || p.height || 1.5;
        const depth_m = qd.depth_m || p.depth || 1.2;
        const width_m = qd.width_m || p.width || 0.5;

        // Производные
        const volume_m3 = area_m2 * (depth_m || height_m || 0.3);
        const rebar_kg = volume_m3 * 80;   // ~80 кг/м³ для фундаментов
        const rebar_t = rebar_kg / 1000;
        const pile_count = Math.ceil(perimeter_m / 1.5);

        return {
            area_m2, perimeter_m, height_m, depth_m, width_m,
            volume_m3, rebar_kg, rebar_t, pile_count,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 3. MAIN BUILD FUNCTION
    // ═══════════════════════════════════════════════════════════
    function build({ objectType, qwenResult, objectParams, region, manualItems }) {
        const type = objectType || 'generic';
        const matrix = WORK_MATRIX[type] || WORK_MATRIX.generic;
        const dims = resolveDimensions(qwenResult, objectParams, type);
        const regCoef = getRegCoef(region);
        const laborRate = getLaborRate(region);
        const regionLabel = region || 'Казахстан';

        console.log(`[SmartEstimateEngine] Building estimate: type=${type}, area=${dims.area_m2}м², region=${regionLabel}`);

        // ── SECTION I: WORKS ──────────────────────────────────
        const worksSection = [];
        let totalLaborHours = 0;
        let totalWorksCost = 0;

        for (const spec of matrix.works) {
            const item = findWork(spec.pattern || spec.match, spec.unit);
            if (!item) continue;

            // Определяем количество
            let qty = dims[spec.qty_key] || spec.default_qty || 1;
            if (spec.side) qty = qty * spec.side; // Для опалубки: периметр × высоту

            const price = Math.round(item.price * regCoef);

            // Человеко-часы через LaborResolver
            let laborNorm = 0;
            let laborSrc = '—';
            if (window.LaborResolver && window.LaborResolver.findNorm) {
                const r = window.LaborResolver.findNorm(item.name, item.unit, item.category);
                laborNorm = r.norm || 0;
                laborSrc = r.src || '—';
            }
            const laborHours = Math.round(qty * laborNorm * 10) / 10;
            totalLaborHours += laborHours;

            const subtotal = Math.round(qty * price);
            totalWorksCost += subtotal;

            const stageInfo = _resolveStageAndDesc(item.name);
            worksSection.push({
                name: item.name,
                unit: item.unit,
                qty: Math.round(qty * 100) / 100,
                price: price,
                subtotal: subtotal,
                laborHours: laborHours,
                laborNorm: laborNorm,
                laborSrc: laborSrc,
                category: item.category || type,
                // ── Новые поля ИИ-сметчика ──
                section: stageInfo.section,
                stage: stageInfo.stage,
                description: stageInfo.desc,
                aiComment: null,
                addedByAI: false,
                assumption: null,
            });
        }

        // Ручные позиции (из wizard шага 3)
        const manuals = (manualItems || []).filter(it => it.name && it.price > 0);

        // ── SECTION II: MATERIALS ──────────────────────────────
        const materialsSection = [];
        let totalMatsCost = 0;

        for (const spec of matrix.materials) {
            const mat = findMaterial(spec.search);
            if (!mat) continue;

            let qty = dims[spec.qty_key] || spec.default_qty || 1;
            const wasteCoef = WASTE[spec.waste] || WASTE.default;
            const qtyWithWaste = Math.ceil(qty * wasteCoef * 10) / 10;
            const price = Math.round(mat.price * regCoef);
            const subtotal = Math.round(qtyWithWaste * price);
            totalMatsCost += subtotal;

            materialsSection.push({
                name: mat.name,
                unit: mat.unit,
                qty: qty,
                qtyWithWaste: qtyWithWaste,
                wastePct: Math.round((wasteCoef - 1) * 100),
                price: price,
                subtotal: subtotal,
                snip: wasteCoef > 1,
                // ── Новые поля ИИ-сметчика ──
                section: 'Материалы',
                stage: 'Материалы',
                description: `Материал для ${type}`,
                aiComment: wasteCoef > 1 ? `Запас +${Math.round((wasteCoef - 1) * 100)}% по СНиП` : null,
                addedByAI: false,
                assumption: null,
            });
        }

        // ── SECTION III: EQUIPMENT ─────────────────────────────
        const equipSection = [];
        let totalEquipCost = 0;

        for (const eqSearch of matrix.equipment) {
            const eq = findEquipment(eqSearch);
            if (!eq) continue;

            // Машино-часы: ~10% от чел-ч по работам, минимум 2 часа
            const machineHours = Math.max(2, Math.round(totalLaborHours * 0.1 * 10) / 10);
            // Аренда/амортизация = цена × 0.001 за час (примерно)
            const hourlyRate = Math.round(eq.price * 0.001 * regCoef);
            const subtotal = Math.round(machineHours * hourlyRate);
            totalEquipCost += subtotal;

            equipSection.push({
                name: eq.name,
                unit: 'маш-ч',
                machineHours: machineHours,
                hourlyRate: hourlyRate,
                subtotal: subtotal,
                // ── Новые поля ИИ-сметчика ──
                section: 'Оборудование и техника',
                stage: 'Оборудование',
                description: `Аренда: ${eqSearch}`,
                aiComment: null,
                addedByAI: false,
            });
        }

        // ── SECTION IV: LABOR ──────────────────────────────────
        const laborSubtotal = Math.round(totalLaborHours * laborRate);
        const laborDays = Math.ceil(totalLaborHours / 8);
        const laborWorkers = Math.max(1, Math.ceil(laborDays / 15)); // за 15 дней

        const laborSection = {
            totalHours: Math.round(totalLaborHours * 10) / 10,
            tariffPerHour: laborRate,
            laborDays: laborDays,
            workers: laborWorkers,
            subtotal: laborSubtotal,
            region: regionLabel,
        };

        // ── TOTALS ─────────────────────────────────────────────
        const manualTotal = manuals.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);
        const grandTotal = totalWorksCost + totalMatsCost + totalEquipCost + laborSubtotal + manualTotal;

        const accuracy = qwenResult && qwenResult.confidence
            ? Math.min(95, Math.round(qwenResult.confidence * 0.85 + 15))
            : 65;

        return {
            objectType: type,
            region: regionLabel,
            dimensions: dims,
            sections: {
                works: worksSection,
                materials: materialsSection,
                equipment: equipSection,
                labor: laborSection,
                manuals: manuals,
            },
            totals: {
                works: totalWorksCost,
                materials: totalMatsCost,
                equipment: totalEquipCost,
                labor: laborSubtotal,
                manual: manualTotal,
                grand: grandTotal,
            },
            accuracy,
            generatedAt: new Date().toISOString(),
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 4. LEGACY ADAPTER — совместимость с renderStep4() wizard
    // Конвертирует SmartEstimate → формат {results: {works, materials}}
    // ═══════════════════════════════════════════════════════════
    function toLegacyFormat(smart) {
        const s = smart.sections;

        const works = s.works.map(w => ({
            name: w.name,
            quantity: w.qty,
            unit: w.unit,
            price: w.price,
            laborHours: w.laborHours,
            category: w.category,
        }));

        const materials = s.materials.map(m => ({
            name: m.name,
            quantity: m.qtyWithWaste,
            unit: m.unit,
            price: m.price,
            snipLabel: m.snip ? `+${m.wastePct}% СНиП` : null,
        }));

        return {
            results: { works, materials },
            accuracy: smart.accuracy,
            _smart: smart,       // полный объект доступен через ._smart
        };
    }

    // ═══════════════════════════════════════════════════════════
    // 5. HIDDEN / COMPANION WORKS — скрытые сопутствующие работы
    // ═══════════════════════════════════════════════════════════

    const HIDDEN_WORKS = {
        foundation_strip: [
            { name: 'Демонтаж старого фундамента', unit: 'M3', qtyMult: 0.3, priceBase: 12000, reason: 'Удаление остатков старого основания' },
            { name: 'Подготовка основания (щебень + трамбовка)', unit: 'M2', qtyKey: 'area_m2', priceBase: 3500, reason: 'Подушка под фундамент (СНиП 3.02.01-87)' },
            { name: 'Гидроизоляция фундамента', unit: 'M2', qtyKey: 'area_m2', qtyMult: 1.2, priceBase: 2800, reason: 'Защита от грунтовых вод' },
            { name: 'Обратная засыпка грунтом', unit: 'M3', qtyMult: 0.4, priceBase: 4500, reason: 'Засыпка пазух фундамента' },
            { name: 'Вывоз строительного мусора', unit: 'M3', qtyMult: 0.5, priceBase: 8000, reason: 'Вывоз на полигон' },
        ],
        foundation_slab: [
            { name: 'Планировка грунта', unit: 'M2', qtyKey: 'area_m2', priceBase: 1200, reason: 'Выравнивание площадки' },
            { name: 'Щебёночная подушка 200мм', unit: 'M2', qtyKey: 'area_m2', priceBase: 3800, reason: 'Подготовка основания (СП 22.13330)' },
            { name: 'Гидроизоляция (2 слоя)', unit: 'M2', qtyKey: 'area_m2', qtyMult: 1.1, priceBase: 3200, reason: 'Защита плиты снизу' },
            { name: 'Утепление ЭППС 100мм', unit: 'M2', qtyKey: 'area_m2', priceBase: 4500, reason: 'Теплоизоляция (для УШП)' },
            { name: 'Уборка и вывоз мусора', unit: 'рейс', qtyFixed: 3, priceBase: 25000, reason: 'Вывоз грунта и мусора' },
        ],
        wall_brick: [
            { name: 'Демонтаж старой кладки', unit: 'M3', qtyMult: 0.2, priceBase: 8000, reason: 'При реконструкции' },
            { name: 'Устройство перемычек', unit: 'шт', qtyFixed: 4, priceBase: 15000, reason: 'Перемычки над проёмами (СП 70.13330)' },
            { name: 'Армирование кладки сеткой', unit: 'M2', qtyKey: 'area_m2', qtyMult: 0.3, priceBase: 1500, reason: 'Каждые 4-5 рядов (СНиП II-22-81)' },
            { name: 'Расшивка швов', unit: 'M2', qtyKey: 'area_m2', priceBase: 800, reason: 'Финишная обработка швов' },
        ],
        wall_block: [
            { name: 'Устройство перемычек', unit: 'шт', qtyFixed: 4, priceBase: 12000, reason: 'Перемычки над проёмами' },
            { name: 'Армопояс', unit: 'п.м.', qtyKey: 'perimeter_m', priceBase: 8500, reason: 'Монолитный пояс по периметру (СП 15.13330)' },
            { name: 'Чистовая штукатурка', unit: 'M2', qtyKey: 'area_m2', qtyMult: 2.0, priceBase: 3500, reason: 'Обе стороны стены' },
        ],
        floor_screed: [
            { name: 'Демонтаж старого покрытия', unit: 'M2', qtyKey: 'area_m2', priceBase: 1800, reason: 'Удаление старой стяжки/покрытия' },
            { name: 'Грунтовка основания', unit: 'M2', qtyKey: 'area_m2', priceBase: 400, reason: 'Бетоноконтакт для адгезии' },
            { name: 'Гидроизоляция пола', unit: 'M2', qtyKey: 'area_m2', qtyMult: 1.1, priceBase: 1200, reason: 'Обмазочная гидроизоляция (мокрые зоны)' },
            { name: 'Установка маяков', unit: 'M2', qtyKey: 'area_m2', priceBase: 600, reason: 'Направляющие для выравнивания' },
        ],
        slab: [
            { name: 'Установка опалубки', unit: 'M2', qtyKey: 'area_m2', qtyMult: 1.3, priceBase: 5500, reason: 'Опалубка по периметру + стойки' },
            { name: 'Вязка арматурного каркаса', unit: 'тн', qtyMult: 0.08, priceBase: 45000, reason: 'Арматура Ø12-16 (СП 63.13330)' },
            { name: 'Уход за бетоном (7 дней)', unit: 'M2', qtyKey: 'area_m2', priceBase: 300, reason: 'Поливка, укрытие плёнкой' },
        ],
        roof_gable: [
            { name: 'Демонтаж старой кровли', unit: 'M2', qtyKey: 'area_m2', priceBase: 2500, reason: 'При реконструкции крыши' },
            { name: 'Пароизоляция', unit: 'M2', qtyKey: 'area_m2', qtyMult: 1.1, priceBase: 800, reason: 'Защита утеплителя изнутри' },
            { name: 'Водосточная система', unit: 'комплект', qtyFixed: 1, priceBase: 85000, reason: 'Водостоки, желоба, воронки' },
            { name: 'Подшивка свесов', unit: 'п.м.', qtyKey: 'perimeter_m', priceBase: 3500, reason: 'Софиты карнизных свесов' },
        ],
        roof_flat: [
            { name: 'Разуклонка керамзитом', unit: 'M3', qtyMult: 0.15, priceBase: 6500, reason: 'Уклон для водоотвода (СП 17.13330)' },
            { name: 'Пароизоляция', unit: 'M2', qtyKey: 'area_m2', priceBase: 900, reason: 'Под утеплитель' },
            { name: 'Водоприёмные воронки', unit: 'шт', qtyFixed: 3, priceBase: 12000, reason: 'Внутренний водосток' },
        ],
        generic: [
            { name: 'Подготовительные работы', unit: 'компл.', qtyFixed: 1, priceBase: 35000, reason: 'Разметка, установка ограждений, подключение' },
            { name: 'Уборка после работ', unit: 'M2', qtyKey: 'area_m2', priceBase: 250, reason: 'Финальная уборка помещения' },
            { name: 'Вывоз мусора', unit: 'рейс', qtyFixed: 2, priceBase: 25000, reason: 'Контейнер + вывоз на полигон' },
        ],
    };

    /**
     * Получить массив скрытых работ для объекта с расчёт qty и cost.
     */
    function getHiddenWorks(objectType, dims, regCoef) {
        const hiddenSpecs = HIDDEN_WORKS[objectType] || HIDDEN_WORKS.generic;
        const coef = regCoef || 1.0;

        return hiddenSpecs.map(spec => {
            let qty;
            if (spec.qtyFixed) {
                qty = spec.qtyFixed;
            } else if (spec.qtyKey && dims[spec.qtyKey]) {
                qty = dims[spec.qtyKey] * (spec.qtyMult || 1.0);
            } else if (spec.qtyMult && dims.volume_m3) {
                qty = dims.volume_m3 * spec.qtyMult;
            } else {
                qty = 1;
            }
            qty = Math.round(qty * 100) / 100;

            const price = Math.round(spec.priceBase * coef);
            const subtotal = Math.round(qty * price);

            return {
                name: spec.name,
                unit: spec.unit,
                qty,
                price,
                subtotal,
                reason: spec.reason,
                hidden: true,
            };
        });
    }

    // ═══════════════════════════════════════════════════════════
    // 6. SMART QUESTIONS — генерация вопросов при неполных данных
    // ═══════════════════════════════════════════════════════════

    const QUESTION_TEMPLATES = {
        foundation_strip: [
            { key: 'depth_m', label: 'Глубина фундамента (м)', type: 'slider', min: 0.5, max: 3.0, step: 0.1, default: 1.2, unit: 'м', condition: d => !d.depth_m || d.depth_m <= 0 },
            { key: 'width_m', label: 'Ширина ленты (м)', type: 'slider', min: 0.3, max: 1.2, step: 0.1, default: 0.5, unit: 'м', condition: d => !d.width_m || d.width_m <= 0 },
            { key: 'has_basement', label: 'Есть подвал/цоколь?', type: 'boolean', default: false },
            {
                key: 'soil_type', label: 'Тип грунта', type: 'select', options: [
                    { value: 'clay', label: 'Глина' }, { value: 'sand', label: 'Песок' },
                    { value: 'rock', label: 'Скальный' }, { value: 'loam', label: 'Суглинок' },
                ], default: 'loam'
            },
        ],
        foundation_slab: [
            { key: 'slab_thickness', label: 'Толщина плиты (м)', type: 'slider', min: 0.15, max: 0.60, step: 0.05, default: 0.30, unit: 'м' },
            { key: 'has_insulation', label: 'Утеплённая (УШП)?', type: 'boolean', default: false },
            {
                key: 'floors_count', label: 'Этажность здания', type: 'select', options: [
                    { value: '1', label: '1 этаж' }, { value: '2', label: '2 этажа' }, { value: '3', label: '3 этажа' },
                ], default: '1'
            },
        ],
        wall_brick: [
            {
                key: 'wall_thickness', label: 'Толщина стены (кирпичей)', type: 'select', options: [
                    { value: '0.5', label: '0.5 кирпича (120мм)' }, { value: '1', label: '1 кирпич (250мм)' },
                    { value: '1.5', label: '1.5 кирпича (380мм)' }, { value: '2', label: '2 кирпича (510мм)' },
                ], default: '1'
            },
            { key: 'openings_count', label: 'Количество проёмов', type: 'number', min: 0, max: 20, default: 3, placeholder: 'двери + окна' },
            { key: 'has_insulation', label: 'Нужно утепление?', type: 'boolean', default: false },
        ],
        wall_block: [
            {
                key: 'block_width', label: 'Толщина блока (мм)', type: 'select', options: [
                    { value: '200', label: '200мм (перегородка)' }, { value: '300', label: '300мм' },
                    { value: '400', label: '400мм (несущая)' }, { value: '500', label: '500мм' },
                ], default: '300'
            },
            { key: 'openings_count', label: 'Количество проёмов', type: 'number', min: 0, max: 20, default: 3 },
        ],
        floor_screed: [
            { key: 'screed_thickness', label: 'Толщина стяжки (мм)', type: 'slider', min: 30, max: 150, step: 10, default: 50, unit: 'мм' },
            {
                key: 'floor_finish', label: 'Финишное покрытие', type: 'select', options: [
                    { value: 'tile', label: 'Плитка' }, { value: 'laminate', label: 'Ламинат' },
                    { value: 'parquet', label: 'Паркет' }, { value: 'none', label: 'Без покрытия' },
                ], default: 'tile'
            },
            { key: 'has_warm_floor', label: 'Тёплый пол?', type: 'boolean', default: false },
        ],
        slab: [
            { key: 'slab_thickness', label: 'Толщина перекрытия (мм)', type: 'slider', min: 120, max: 300, step: 20, default: 200, unit: 'мм' },
            {
                key: 'load_class', label: 'Класс нагрузки', type: 'select', options: [
                    { value: 'light', label: 'Лёгкая (жильё)' }, { value: 'medium', label: 'Средняя (офис)' },
                    { value: 'heavy', label: 'Тяжёлая (склад)' },
                ], default: 'light'
            },
        ],
        roof_gable: [
            {
                key: 'roof_material', label: 'Кровельный материал', type: 'select', options: [
                    { value: 'metal_tile', label: 'Металлочерепица' }, { value: 'soft', label: 'Гибкая черепица' },
                    { value: 'profiled', label: 'Профнастил' }, { value: 'slate', label: 'Шифер' },
                ], default: 'metal_tile'
            },
            { key: 'roof_angle', label: 'Угол ската (°)', type: 'slider', min: 15, max: 60, step: 5, default: 30, unit: '°' },
            { key: 'has_dormer', label: 'Есть мансардные окна?', type: 'boolean', default: false },
        ],
        roof_flat: [
            {
                key: 'roof_layers', label: 'Слоёв гидроизоляции', type: 'select', options: [
                    { value: '2', label: '2 слоя' }, { value: '3', label: '3 слоя' },
                ], default: '2'
            },
            { key: 'has_insulation', label: 'Уложить утеплитель?', type: 'boolean', default: true },
        ],
        generic: [
            { key: 'area_m2', label: 'Площадь работ (м²)', type: 'number', min: 1, max: 10000, default: 50, placeholder: 'площадь', condition: d => !d.area_m2 || d.area_m2 <= 0 },
            { key: 'height_m', label: 'Высота (м)', type: 'slider', min: 0.5, max: 12, step: 0.5, default: 3.0, unit: 'м', condition: d => !d.height_m || d.height_m <= 0 },
            {
                key: 'complexity', label: 'Сложность', type: 'select', options: [
                    { value: 'simple', label: 'Простая' }, { value: 'normal', label: 'Средняя' }, { value: 'complex', label: 'Сложная' },
                ], default: 'normal'
            },
        ],
    };

    /**
     * Генерирует список уточняющих вопросов на основе типа объекта и имеющихся данных.
     * @param {string} objectType — тип объекта
     * @param {object} dims — текущие размеры (из resolveDimensions)
     * @param {object} existingAnswers — уже полученные ответы
     * @returns {Array} — массив вопросов для UI
     */
    function generateQuestions(objectType, dims, existingAnswers) {
        const templates = QUESTION_TEMPLATES[objectType] || QUESTION_TEMPLATES.generic;
        const answered = existingAnswers || {};

        return templates
            .filter(q => {
                // Skip questions already answered
                if (answered[q.key] !== undefined) return false;
                // Check condition if present
                if (q.condition && !q.condition(dims)) return false;
                // If no condition, show all unanswered
                return !q.condition || q.condition(dims);
            })
            .map(q => ({
                key: q.key,
                label: q.label,
                type: q.type,
                min: q.min,
                max: q.max,
                step: q.step,
                default: q.default,
                unit: q.unit,
                options: q.options,
                placeholder: q.placeholder,
            }));
    }

    // ═══════════════════════════════════════════════════════════
    // 7. SCENARIOS — economy / standard / premium
    // ═══════════════════════════════════════════════════════════

    const SCENARIO_CONFIG = {
        economy: {
            name: 'Эконом',
            emoji: '🏠',
            desc: 'Бюджетные материалы, базовый набор работ',
            worksMult: 0.85,      // дешевле рабочая сила (бригады)
            materialsMult: 0.60,  // дешёвые аналоги материалов
            equipMult: 0.80,      // аренда вместо покупки
            laborMult: 0.90,      // менее квалифицированные
            hiddenMult: 0.50,     // минимум скрытых работ
        },
        standard: {
            name: 'Стандарт',
            emoji: '🏗️',
            desc: 'Оптимальное качество по рыночной цене',
            worksMult: 1.00,
            materialsMult: 1.00,
            equipMult: 1.00,
            laborMult: 1.00,
            hiddenMult: 1.00,
        },
        premium: {
            name: 'Премиум',
            emoji: '✨',
            desc: 'Люксовые материалы, расширенные работы',
            worksMult: 1.20,      // более качественные работы
            materialsMult: 1.80,  // премиальные материалы
            equipMult: 1.30,      // профессиональное оборудование
            laborMult: 1.40,      // высококвалифицированные
            hiddenMult: 1.30,     // полный набор сопутствующих
        },
    };

    /**
     * Создаёт 3 варианта сметы: эконом, стандарт, премиум.
     * @param {object} baseEstimate — результат build()
     * @returns {object} — { economy, standard, premium } с пересчитанными секциями
     */
    function buildScenarios(baseEstimate) {
        const result = {};

        for (const [sceneKey, cfg] of Object.entries(SCENARIO_CONFIG)) {
            const s = baseEstimate.sections;
            const dims = baseEstimate.dimensions;
            const regCoef = getRegCoef(baseEstimate.region);

            // Works
            const scenarioWorks = s.works.map(w => ({
                ...w,
                price: Math.round(w.price * cfg.worksMult),
                subtotal: Math.round(w.qty * w.price * cfg.worksMult),
            }));
            const totalWorks = scenarioWorks.reduce((sum, w) => sum + w.subtotal, 0);

            // Materials
            const scenarioMats = s.materials.map(m => ({
                ...m,
                price: Math.round(m.price * cfg.materialsMult),
                subtotal: Math.round(m.qtyWithWaste * m.price * cfg.materialsMult),
            }));
            const totalMats = scenarioMats.reduce((sum, m) => sum + m.subtotal, 0);

            // Equipment
            const scenarioEquip = s.equipment.map(e => ({
                ...e,
                hourlyRate: Math.round(e.hourlyRate * cfg.equipMult),
                subtotal: Math.round(e.machineHours * e.hourlyRate * cfg.equipMult),
            }));
            const totalEquip = scenarioEquip.reduce((sum, e) => sum + e.subtotal, 0);

            // Labor
            const laborSub = Math.round(s.labor.subtotal * cfg.laborMult);

            // Hidden works
            const hidden = getHiddenWorks(baseEstimate.objectType, dims, regCoef);
            const scenarioHidden = hidden.map(h => ({
                ...h,
                price: Math.round(h.price * cfg.hiddenMult),
                subtotal: Math.round(h.qty * h.price * cfg.hiddenMult),
            }));
            const totalHidden = scenarioHidden.reduce((sum, h) => sum + h.subtotal, 0);

            // Manual
            const manualTotal = (s.manuals || []).reduce((sum, m) => sum + (m.qty || 0) * (m.price || 0), 0);

            const total = totalWorks + totalMats + totalEquip + laborSub + totalHidden + manualTotal;

            result[sceneKey] = {
                name: cfg.name,
                emoji: cfg.emoji,
                desc: cfg.desc,
                multiplier: total / (baseEstimate.totals.grand || total || 1),
                total,
                sections: {
                    works: scenarioWorks,
                    materials: scenarioMats,
                    equipment: scenarioEquip,
                    labor: { ...s.labor, subtotal: laborSub },
                    hidden: scenarioHidden,
                    manuals: s.manuals || [],
                },
                totals: {
                    works: totalWorks,
                    materials: totalMats,
                    equipment: totalEquip,
                    labor: laborSub,
                    hidden: totalHidden,
                    manual: manualTotal,
                    grand: total,
                },
            };
        }

        return result;
    }

    // ═══════════════════════════════════════════════════════════
    // 8. FULL BUILD — полная смета с верификацией и таймлайном
    // ═══════════════════════════════════════════════════════════

    /**
     * buildFull — расширенная функция сборки сметы.
     * Интегрирует: build() → верификация → autoFix → таймлайн → сценарии.
     * Возвращает полную смету по ТЗ ИИ-сметчика.
     */
    function buildFull(params) {
        const { objectType, qwenResult, objectParams, region, manualItems, month } = params;
        const type = objectType || 'generic';
        const regCoef = getRegCoef(region);

        // ── Шаг 1: Базовая смета ──
        const baseEstimate = build({ objectType, qwenResult, objectParams, region, manualItems });
        const dims = baseEstimate.dimensions;

        // ── Шаг 2: Скрытые работы ──
        const hiddenWorks = getHiddenWorks(type, dims, regCoef);

        // ── Шаг 3: Верификация ИИ ──
        let verification = { passed: true, autoFixItems: [], errors: [], warnings: [], aiComments: [] };
        let aiAddedWorks = [];
        if (window.AIEstimateVerifier) {
            const allItems = [...baseEstimate.sections.works, ...hiddenWorks];
            verification = window.AIEstimateVerifier.verify(type, allItems, dims, regCoef);
            aiAddedWorks = verification.autoFixItems || [];

            // Добавить в лог
            if (aiAddedWorks.length > 0) {
                console.log(`[SmartEstimateEngine] ИИ добавил ${aiAddedWorks.length} позиций для полноты сметы`);
            }
            if (verification.errors.length > 0) {
                console.warn(`[SmartEstimateEngine] Верификация: ${verification.errors.length} ошибок`);
            }
        }

        // ── Шаг 4: Расчёт сроков ──
        let timeline = null;
        if (window.TimelineCalculator) {
            const allWorkItems = [
                ...baseEstimate.sections.works,
                ...hiddenWorks,
                ...aiAddedWorks,
            ];
            timeline = window.TimelineCalculator.calculateTimeline({
                objectType: type,
                estimateItems: allWorkItems,
                dimensions: dims,
                region,
                month,
            });
        }

        // ── Шаг 5: Генерация вопросов ──
        const questions = generateQuestions(type, dims, objectParams);

        // ── Шаг 6: Сценарии ──
        const scenarios = buildScenarios(baseEstimate);

        // ── Шаг 7: Стоимость скрытых + добавленных ИИ ──
        const hiddenTotal = hiddenWorks.reduce((s, h) => s + (h.subtotal || 0), 0);
        const aiAddedTotal = aiAddedWorks.reduce((s, a) => s + (a.subtotal || 0), 0);

        // ── Шаг 8: Итоговая стоимость ──
        const grandTotalFull = baseEstimate.totals.grand + hiddenTotal + aiAddedTotal;

        return {
            // Основные данные
            objectType: type,
            region: baseEstimate.region,
            dimensions: dims,
            accuracy: baseEstimate.accuracy,
            generatedAt: baseEstimate.generatedAt,

            // Работы (разделённые по категориям)
            mainWorks: baseEstimate.sections.works,
            hiddenWorks: hiddenWorks,
            aiAddedWorks: aiAddedWorks,

            // Остальные секции
            materials: baseEstimate.sections.materials,
            equipment: baseEstimate.sections.equipment,
            labor: baseEstimate.sections.labor,
            manuals: baseEstimate.sections.manuals,

            // Стоимость
            totals: {
                ...baseEstimate.totals,
                hidden: hiddenTotal,
                aiAdded: aiAddedTotal,
                grandFull: grandTotalFull,
            },

            // Сроки
            timeline,

            // Сценарии
            scenarios,

            // Верификация ИИ
            verification,

            // Вопросы пользователю
            questions,

            // Базовая смета (для обратной совместимости)
            _baseEstimate: baseEstimate,
        };
    }

    // ── PUBLIC API ─────────────────────────────────────────────
    window.SmartEstimateEngine = {
        build,
        buildFull,
        toLegacyFormat,
        findWork,
        findMaterial,
        findEquipment,
        getLaborRate,
        WORK_MATRIX,
        // Phase 7 additions
        getHiddenWorks,
        generateQuestions,
        buildScenarios,
        HIDDEN_WORKS,
        SCENARIO_CONFIG,
        QUESTION_TEMPLATES,
    };

    console.log('[SmartEstimateEngine] ✅ Engine ready — Works + Materials + Equipment + Labor + Scenarios + Questions + AI Verifier + Timeline');

})();
