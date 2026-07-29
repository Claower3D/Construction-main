// ============================================================
// timelineCalculator.js — Расчёт сроков и последовательности v1.0
// QAZGOST AI — Цифровой инженер-сметчик
//
// Функции:
//   1. Расчёт длительности каждого этапа работ (чел-ч → дни)
//   2. Определение последовательности с зависимостями
//   3. Технологические перерывы (набор прочности бетона и т.д.)
//   4. Состав бригады по специальностям
//   5. Потребность в технике
//   6. Сезонные коэффициенты
// ============================================================

(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // 1. WORK DURATION NORMS — нормативы длительности (чел-ч/ед.)
    // ═══════════════════════════════════════════════════════════

    const DURATION_NORMS = {
        // Земляные работы
        'разметка': { norm: 4.0, unit: 'компл.', crew: 'geodesist', machine: null },
        'разработка грунта': { norm: 0.8, unit: 'M3', crew: 'excavator_op', machine: 'Экскаватор' },
        'планировка': { norm: 0.3, unit: 'M2', crew: 'laborer', machine: null },
        'трамбовка': { norm: 0.2, unit: 'M2', crew: 'laborer', machine: 'Виброплита' },
        'обратная засыпка': { norm: 0.5, unit: 'M3', crew: 'laborer', machine: null },
        'вывоз мусора': { norm: 2.0, unit: 'рейс', crew: 'driver', machine: 'Самосвал' },

        // Бетонные работы
        'опалубка': { norm: 0.8, unit: 'M2', crew: 'carpenter', machine: null },
        'армирование': { norm: 0.05, unit: 'кг', crew: 'rebar_fitter', machine: null },
        'заливка бетон': { norm: 1.2, unit: 'M3', crew: 'concreter', machine: 'Бетоносмеситель' },
        'виброуплотнение': { norm: 0.3, unit: 'M3', crew: 'concreter', machine: 'Вибратор глубинный' },
        'демонтаж опалубки': { norm: 0.4, unit: 'M2', crew: 'carpenter', machine: null },

        // Каменные работы
        'кладка кирпич': { norm: 0.8, unit: 'M2', crew: 'bricklayer', machine: null },
        'кладка блок': { norm: 0.5, unit: 'M2', crew: 'bricklayer', machine: null },
        'перемычки': { norm: 1.5, unit: 'шт', crew: 'bricklayer', machine: null },
        'армопояс': { norm: 1.8, unit: 'п.м.', crew: 'concreter', machine: null },

        // Отделочные
        'грунтовка': { norm: 0.15, unit: 'M2', crew: 'painter', machine: null },
        'штукатурка': { norm: 0.5, unit: 'M2', crew: 'plasterer', machine: null },
        'стяжка': { norm: 0.3, unit: 'M2', crew: 'concreter', machine: 'Виброрейка' },
        'маяки': { norm: 0.2, unit: 'M2', crew: 'concreter', machine: null },
        'покраска': { norm: 0.2, unit: 'M2', crew: 'painter', machine: null },
        'плитка': { norm: 0.6, unit: 'M2', crew: 'tiler', machine: null },
        'ламинат': { norm: 0.25, unit: 'M2', crew: 'floorer', machine: null },

        // Кровельные
        'стропильная': { norm: 0.6, unit: 'M2', crew: 'roofer', machine: null },
        'мауэрлат': { norm: 0.8, unit: 'п.м.', crew: 'roofer', machine: null },
        'обрешётка': { norm: 0.3, unit: 'M2', crew: 'roofer', machine: null },
        'кровельное покрытие': { norm: 0.4, unit: 'M2', crew: 'roofer', machine: null },
        'металлочерепица': { norm: 0.4, unit: 'M2', crew: 'roofer', machine: null },
        'пароизоляция': { norm: 0.15, unit: 'M2', crew: 'roofer', machine: null },
        'утепление': { norm: 0.25, unit: 'M2', crew: 'insulator', machine: null },
        'водосточная': { norm: 8.0, unit: 'компл.', crew: 'roofer', machine: null },
        'подшивка свесов': { norm: 0.5, unit: 'п.м.', crew: 'roofer', machine: null },

        // Изоляционные
        'гидроизоляция': { norm: 0.25, unit: 'M2', crew: 'insulator', machine: null },
        'геотекстиль': { norm: 0.1, unit: 'M2', crew: 'laborer', machine: null },

        // Демонтаж
        'демонтаж': { norm: 0.6, unit: 'M2', crew: 'demolisher', machine: 'Перфоратор' },
        'уборка': { norm: 0.1, unit: 'M2', crew: 'laborer', machine: null },
    };

    // ═══════════════════════════════════════════════════════════
    // 2. TECHNOLOGICAL BREAKS — технологические перерывы
    // ═══════════════════════════════════════════════════════════

    const TECH_BREAKS = [
        {
            after: /залив.*бетон|бетониров|фундамент.*плит/i,
            before: /демонтаж опалуб|нагрузк|кладк|монтаж.*на.*фундам/i,
            days: 3,
            fullDays: 28,
            reason: 'Набор прочности бетона (70% — 3 дня, 100% — 28 дней)',
            critical: true,
        },
        {
            after: /стяжк/i,
            before: /плитк|ламинат|паркет|покраск|покрыт/i,
            days: 7,
            fullDays: 28,
            reason: 'Высыхание и набор прочности стяжки',
            critical: true,
        },
        {
            after: /штукатурк/i,
            before: /покраск|обои|поклейк|шпаклёвк/i,
            days: 2,
            fullDays: 7,
            reason: 'Просушка штукатурного слоя',
            critical: false,
        },
        {
            after: /грунтовк/i,
            before: /покраск|штукатурк|стяжк/i,
            days: 1,
            fullDays: 1,
            reason: 'Высыхание грунтовки (12-24 часа)',
            critical: false,
        },
        {
            after: /гидроизоляц.*обмазоч/i,
            before: /стяжк|плитк|кладк/i,
            days: 1,
            fullDays: 2,
            reason: 'Полимеризация гидроизоляции',
            critical: false,
        },
    ];

    // ═══════════════════════════════════════════════════════════
    // 3. CREW TYPES — состав бригады
    // ═══════════════════════════════════════════════════════════

    const CREW_TYPES = {
        geodesist: { label: 'Геодезист', rateKZT: 6000, category: 'Специалист' },
        excavator_op: { label: 'Оператор экскаватора', rateKZT: 5500, category: 'Механизатор' },
        driver: { label: 'Водитель самосвала', rateKZT: 4500, category: 'Механизатор' },
        laborer: { label: 'Разнорабочий', rateKZT: 3500, category: 'Подсобный' },
        carpenter: { label: 'Плотник-опалубщик', rateKZT: 5000, category: 'Строитель' },
        rebar_fitter: { label: 'Арматурщик', rateKZT: 5500, category: 'Строитель' },
        concreter: { label: 'Бетонщик', rateKZT: 5000, category: 'Строитель' },
        bricklayer: { label: 'Каменщик', rateKZT: 5500, category: 'Строитель' },
        plasterer: { label: 'Штукатур', rateKZT: 4800, category: 'Отделочник' },
        painter: { label: 'Маляр', rateKZT: 4500, category: 'Отделочник' },
        tiler: { label: 'Плиточник', rateKZT: 5500, category: 'Отделочник' },
        floorer: { label: 'Укладчик полов', rateKZT: 5000, category: 'Отделочник' },
        roofer: { label: 'Кровельщик', rateKZT: 6000, category: 'Строитель' },
        insulator: { label: 'Изолировщик', rateKZT: 4800, category: 'Строитель' },
        demolisher: { label: 'Демонтажник', rateKZT: 4000, category: 'Подсобный' },
        electrician: { label: 'Электрик', rateKZT: 6000, category: 'Специалист' },
        plumber: { label: 'Сантехник', rateKZT: 5500, category: 'Специалист' },
    };

    // ═══════════════════════════════════════════════════════════
    // 4. SEASONAL FACTORS — сезонность
    // ═══════════════════════════════════════════════════════════

    const SEASONAL_FACTORS = {
        winter: { months: [11, 12, 1, 2, 3], factor: 1.30, label: 'Зима', restrictOutdoor: true, restrictWet: true },
        spring: { months: [4, 5], factor: 1.10, label: 'Весна', restrictOutdoor: false, restrictWet: false },
        summer: { months: [6, 7, 8], factor: 1.00, label: 'Лето', restrictOutdoor: false, restrictWet: false },
        autumn: { months: [9, 10], factor: 1.15, label: 'Осень', restrictOutdoor: false, restrictWet: true },
    };

    function getSeasonalFactor(month) {
        const m = month || (new Date().getMonth() + 1);
        for (const [, season] of Object.entries(SEASONAL_FACTORS)) {
            if (season.months.includes(m)) return season;
        }
        return SEASONAL_FACTORS.summer;
    }

    // ═══════════════════════════════════════════════════════════
    // 5. STAGE SEQUENCES — порядок этапов по типу объекта
    // ═══════════════════════════════════════════════════════════

    const STAGE_ORDER = {
        foundation_strip: [
            'Подготовительные', 'Земляные работы', 'Бетонные работы',
            'Изоляционные', 'Завершающие'
        ],
        foundation_slab: [
            'Подготовительные', 'Земляные работы', 'Изоляционные',
            'Бетонные работы', 'Завершающие'
        ],
        wall_brick: [
            'Подготовительные', 'Основные работы', 'Отделочные', 'Завершающие'
        ],
        wall_block: [
            'Подготовительные', 'Основные работы', 'Отделочные', 'Завершающие'
        ],
        floor_screed: [
            'Подготовительные', 'Изоляционные', 'Основные работы', 'Завершающие'
        ],
        roof_gable: [
            'Каркас', 'Изоляционные', 'Основные работы', 'Завершающие'
        ],
        roof_flat: [
            'Подготовительные', 'Изоляционные', 'Основные работы', 'Завершающие'
        ],
        generic: [
            'Подготовительные', 'Основные работы', 'Отделочные', 'Завершающие'
        ],
    };

    // ═══════════════════════════════════════════════════════════
    // CORE: calculateTimeline
    // ═══════════════════════════════════════════════════════════

    /**
     * Расчёт полного таймлайна для сметы.
     *
     * @param {object} params
     *   - objectType:    тип объекта
     *   - estimateItems: массив позиций сметы
     *   - dimensions:    размеры объекта
     *   - region:        регион (опционально, для ставок)
     *   - month:         месяц (для сезонности)
     *   - crewSize:      общий размер бригады (по умолчанию — авто)
     *
     * @returns {object} — полный результат таймлайна
     */
    function calculateTimeline(params) {
        const {
            objectType = 'generic',
            estimateItems = [],
            dimensions = {},
            region = 'almaty',
            month,
            crewSize,
        } = params;

        const season = getSeasonalFactor(month);
        const stageOrderList = STAGE_ORDER[objectType] || STAGE_ORDER.generic;

        // ── 1. Рассчитать длительность каждой позиции ──────────

        const itemsWithDuration = estimateItems.map(item => {
            const name = (item.name || item.work_name || '').toLowerCase();
            const qty = item.qty || item.quantity || 1;
            const stage = item.stage || item.section || _guessStage(name);

            // Найти норму по ключевым словам
            let bestNorm = null;
            let bestKey = '';
            for (const [key, norm] of Object.entries(DURATION_NORMS)) {
                if (name.includes(key)) {
                    bestNorm = norm;
                    bestKey = key;
                    break;
                }
            }

            let durationHours = item.laborHours || 0;
            let crewType = 'laborer';
            let machineNeeded = null;

            if (bestNorm) {
                durationHours = Math.max(durationHours, qty * bestNorm.norm);
                crewType = bestNorm.crew;
                machineNeeded = bestNorm.machine;
            } else if (durationHours === 0) {
                // Эвристика: 1 чел-ч на ед. если нет нормы
                durationHours = qty * 0.5;
            }

            // Сезонный коэффициент
            durationHours = durationHours * season.factor;

            const durationDays = Math.max(0.5, Math.ceil(durationHours / 8 * 10) / 10);

            return {
                ...item,
                stage,
                durationHours: Math.round(durationHours * 10) / 10,
                durationDays,
                crewType,
                crewLabel: (CREW_TYPES[crewType] || CREW_TYPES.laborer).label,
                machineNeeded,
                normSource: bestKey || 'эвристика',
            };
        });

        // ── 2. Группировка по этапам ────────────────────────────

        const stageGroups = {};
        for (const item of itemsWithDuration) {
            const stage = item.stage || 'Основные работы';
            if (!stageGroups[stage]) stageGroups[stage] = [];
            stageGroups[stage].push(item);
        }

        // ── 3. Построить последовательность этапов ────────────────

        const stages = [];
        let cumulativeDays = 0;

        for (const stageName of stageOrderList) {
            const items = stageGroups[stageName];
            if (!items || items.length === 0) continue;

            const totalHours = items.reduce((s, i) => s + i.durationHours, 0);
            // Определить бригаду для этапа
            const crewNeeded = Math.max(1, Math.ceil(totalHours / 64)); // 8ч × 8дней
            const parallelFactor = Math.min(crewNeeded, crewSize || crewNeeded);
            const stageDays = Math.max(1, Math.ceil(totalHours / (8 * parallelFactor)));

            // Проверить техперерыв перед этим этапом
            let breakDays = 0;
            let breakReason = null;
            if (stages.length > 0) {
                const prevStageName = stages[stages.length - 1].name;
                const prevItems = stages[stages.length - 1].items.map(i => i.name || '').join(' ');
                const currItems = items.map(i => i.name || '').join(' ');

                for (const tb of TECH_BREAKS) {
                    if (tb.after.test(prevItems) && tb.before.test(currItems)) {
                        breakDays = tb.days;
                        breakReason = tb.reason;
                        break;
                    }
                }
            }

            const startDay = cumulativeDays + breakDays + 1;
            const endDay = startDay + stageDays - 1;
            cumulativeDays = endDay;

            const machines = [...new Set(items.filter(i => i.machineNeeded).map(i => i.machineNeeded))];
            const crew = [...new Set(items.map(i => i.crewLabel))];

            stages.push({
                name: stageName,
                items,
                totalHours: Math.round(totalHours * 10) / 10,
                crewNeeded: parallelFactor,
                crew,
                machines,
                stageDays,
                startDay,
                endDay,
                breakBefore: breakDays > 0 ? { days: breakDays, reason: breakReason } : null,
            });
        }

        // ── 4. Итог ─────────────────────────────────────────────

        const totalDays = cumulativeDays;
        const totalHours = itemsWithDuration.reduce((s, i) => s + i.durationHours, 0);
        const totalCrewSize = Math.max(1, new Set(itemsWithDuration.map(i => i.crewType)).size);
        const allMachines = [...new Set(itemsWithDuration.filter(i => i.machineNeeded).map(i => i.machineNeeded))];

        // Состав бригады
        const crewComposition = {};
        for (const item of itemsWithDuration) {
            const ct = item.crewType;
            if (!crewComposition[ct]) {
                crewComposition[ct] = {
                    type: ct,
                    label: (CREW_TYPES[ct] || CREW_TYPES.laborer).label,
                    category: (CREW_TYPES[ct] || CREW_TYPES.laborer).category,
                    rateKZT: (CREW_TYPES[ct] || CREW_TYPES.laborer).rateKZT,
                    totalHours: 0,
                    count: 0,
                };
            }
            crewComposition[ct].totalHours += item.durationHours;
        }
        // Определить количество рабочих каждого типа
        for (const [, crew] of Object.entries(crewComposition)) {
            crew.count = Math.max(1, Math.ceil(crew.totalHours / (totalDays * 8)));
            crew.totalHours = Math.round(crew.totalHours * 10) / 10;
        }

        const crewList = Object.values(crewComposition).sort((a, b) => b.totalHours - a.totalHours);

        // Технологические перерывы в общем списке
        const breaks = stages
            .filter(s => s.breakBefore)
            .map(s => ({
                afterStage: stages[stages.indexOf(s) - 1]?.name || '—',
                beforeStage: s.name,
                days: s.breakBefore.days,
                reason: s.breakBefore.reason,
            }));

        return {
            totalDays,
            totalHours: Math.round(totalHours),
            totalWeeks: Math.ceil(totalDays / 7),
            totalCrewSize,
            season: {
                name: season.label,
                factor: season.factor,
                month: month || (new Date().getMonth() + 1),
            },
            stages,
            crew: crewList,
            machines: allMachines,
            breaks,
            itemsWithDuration,
            summary: `Ориентировочный срок: ${totalDays} дней (${Math.ceil(totalDays / 7)} нед.), бригада ${crewList.length} спец., ${Math.round(totalHours)} чел-ч`,
        };
    }

    // ── UTILS ──────────────────────────────────────────────────

    function _guessStage(name) {
        if (/подготовит|размет|планиров|грунтовк|маяк|демонтаж|убор/i.test(name)) return 'Подготовительные';
        if (/земл|выемк|засыпк|копк|экскав|котлован|трамбовк/i.test(name)) return 'Земляные работы';
        if (/бетон|опалубк|армиров|залив|вибро/i.test(name)) return 'Бетонные работы';
        if (/гидроизол|пароизол|утепл|изоляц/i.test(name)) return 'Изоляционные';
        if (/штукатурк|покраск|шпакл|обои|плитк|ламинат|отделк/i.test(name)) return 'Отделочные';
        if (/кровл|стропил|обрешётк|металлочереп|водосток/i.test(name)) return 'Кровельные';
        if (/вывоз|уборк|мусор/i.test(name)) return 'Завершающие';
        return 'Основные работы';
    }

    // ── PUBLIC API ─────────────────────────────────────────────

    window.TimelineCalculator = {
        calculateTimeline,
        getSeasonalFactor,
        DURATION_NORMS,
        TECH_BREAKS,
        CREW_TYPES,
        SEASONAL_FACTORS,
        STAGE_ORDER,
    };

    console.log('[TimelineCalculator] ✅ Калькулятор сроков и последовательности загружен');

})();
