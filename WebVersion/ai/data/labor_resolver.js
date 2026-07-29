// =====================================================
// LABOUR RESOLVER — назначает поле .labor всем работам
// Запускать ПОСЛЕ загрузки всех AI_WRK_*, AI_EQ_* и labor_norms_db.js
// =====================================================
(function () {
    'use strict';

    // Нормы по категории + единице (fallback уровень 1)
    const CAT_FALLBACK = {
        heating: { 'шт': 1.50, 'м.п.': 0.25, 'м²': 0.30, 'контур': 0.50, 'компл.': 4.00 },
        plumbing: { 'шт': 1.50, 'м.п.': 0.22, 'м²': 0.30 },
        electrical: { 'шт': 0.30, 'м.п.': 0.12, 'м²': 0.20, 'компл.': 3.00 },
        roofing: { 'м²': 0.25, 'м.п.': 0.15, 'шт': 1.20 },
        facade: { 'м²': 0.35, 'м.п.': 0.18, 'шт': 2.50 },
        windows: { 'шт': 2.50, 'м.п.': 0.30, 'м²': 0.60 },
        doors: { 'шт': 2.00, 'м.п.': 0.20, 'сторона': 0.30, 'компл.': 0.50 },
        stairs: { 'шт': 20.0, 'ступень': 1.20, 'м.п.': 0.40, 'м²': 1.50 },
        flooring: { 'м²': 0.25, 'м.п.': 0.10, 'шт': 0.20 },
        ceiling: { 'м²': 0.40, 'м.п.': 0.18, 'шт': 0.80 },
        painting: { 'м²': 0.20, 'м.п.': 0.10, 'шт': 0.40 },
        tiling: { 'м²': 0.75, 'шт': 0.30, 'м.п.': 0.25 },
        masonry: { 'м²': 1.00, 'м³': 3.50, 'шт': 0.50, 'м.п.': 0.35 },
        concrete: { 'м³': 2.00, 'м²': 0.50, 'шт': 1.50, 'т': 10.0 },
        earthwork: { 'м³': 0.30, 'м²': 0.06, 'м.п.': 0.25 },
        demolition: { 'м²': 0.35, 'м³': 0.80, 'шт': 0.50, 'м.п.': 0.20 },
        hvac: { 'шт': 3.00, 'м.п.': 0.30, 'м²': 0.45 },
        insulation: { 'м²': 0.20, 'м.п.': 0.15, 'шт': 0.50 },
        waterproof: { 'м²': 0.30, 'м.п.': 0.20 },
        drywall: { 'м²': 0.45, 'м.п.': 0.18 },
        metalwork: { 'шт': 2.50, 'т': 8.00, 'м.п.': 0.40, 'м²': 0.40 },
        foundation: { 'м³': 2.20, 'м²': 0.50, 'шт': 1.50, 'м.п.': 0.40 },
        design: { 'шт': 8.00, 'компл.': 16.0, 'компл': 16.0 },
        landscape: { 'м²': 0.35, 'м.п.': 0.40, 'шт': 1.20 },
        automation: { 'шт': 1.50, 'м.п.': 0.20, 'компл.': 6.00 },
        cleaning: { 'м²': 0.05, 'м³': 0.30 },
        waterwork: { 'шт': 1.20, 'м.п.': 0.22 },
        gas: { 'шт': 2.00, 'м.п.': 0.30 },
        fire: { 'шт': 1.50, 'м.п.': 0.20, 'м²': 0.25 },
    };

    // Fallback только по единице измерения (уровень 2)
    const UNIT_FALLBACK = {
        'м²': 0.30,
        'м.п.': 0.20,
        'м': 0.20,
        'пм': 0.20,
        'шт': 0.50,
        'компл.': 2.00,
        'компл': 2.00,
        'т': 5.00,
        'м³': 1.50,
        'ступень': 1.00,
        'контур': 0.50,
        'сторона': 0.30,
        'кг': 0.05,
        'л': 0.10,
        'упак': 0.20,
        'объект': 8.00,
    };

    function findNorm(name, unit, category) {
        const unitKey = (unit || '').trim();
        // 1. Паттерны из labor_norms_db.js
        if (window.LABOR_NORMS_DB && Array.isArray(window.LABOR_NORMS_DB)) {
            for (const entry of window.LABOR_NORMS_DB) {
                if (!entry.match.test(name)) continue;
                if (entry.norms[unitKey] !== undefined)
                    return { norm: entry.norms[unitKey], src: entry.src || 'ЕНиР/ГЭСН' };
                if ((unitKey === 'м' || unitKey === 'пм') && entry.norms['м.п.'] !== undefined)
                    return { norm: entry.norms['м.п.'], src: entry.src || 'ЕНиР/ГЭСН' };
                const fk = Object.keys(entry.norms)[0];
                if (fk) return { norm: entry.norms[fk], src: entry.src || 'ЕНиР/ГЭСН' };
            }
        }
        // 2. Fallback по категории + единице
        const cat = (category || '').toLowerCase();
        if (CAT_FALLBACK[cat]) {
            if (CAT_FALLBACK[cat][unitKey] !== undefined)
                return { norm: CAT_FALLBACK[cat][unitKey], src: 'норм./категория' };
            // Похожие единицы
            const uk = unitKey === 'м' || unitKey === 'пм' ? 'м.п.' : null;
            if (uk && CAT_FALLBACK[cat][uk] !== undefined)
                return { norm: CAT_FALLBACK[cat][uk], src: 'норм./категория' };
        }
        // 3. Fallback только по единице
        if (UNIT_FALLBACK[unitKey] !== undefined)
            return { norm: UNIT_FALLBACK[unitKey], src: 'норм./ед.изм.' };
        const uk2 = unitKey === 'м' || unitKey === 'пм' ? 'м.п.' : null;
        if (uk2 && UNIT_FALLBACK[uk2] !== undefined)
            return { norm: UNIT_FALLBACK[uk2], src: 'норм./ед.изм.' };
        // 4. Абсолютный fallback
        return { norm: 0.50, src: 'норм./общий' };
    }

    function resolveAll() {
        let total = 0, byPattern = 0, byCat = 0, byUnit = 0, byDefault = 0, alreadyHad = 0;
        const prefixes = ['AI_WRK_', 'AI_WORK_', 'AI_EQ_'];
        for (const key of Object.keys(window)) {
            if (!prefixes.some(p => key.startsWith(p))) continue;
            const catalog = window[key];
            if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;
            for (const [, item] of Object.entries(catalog)) {
                if (!item || typeof item !== 'object' || !item.name) continue;
                total++;
                if (item.labor) { alreadyHad++; continue; }
                const r = findNorm(item.name, item.unit, item.category);
                item.labor = r;
                if (r.src.includes('ЕНиР') || r.src.includes('ГЭСН')) byPattern++;
                else if (r.src.includes('категория')) byCat++;
                else if (r.src.includes('ед.изм')) byUnit++;
                else byDefault++;
            }
        }
        const covered = total - alreadyHad;
        const pct = total > 0 ? Math.round((covered > 0 ? covered : 0) / total * 100) : 0;
        console.log(`[LaborResolver] ✅ ${total} поз. | по норм.БД: ${byPattern} | по категории: ${byCat} | по ед.: ${byUnit} | по умолч.: ${byDefault} | уже были: ${alreadyHad} | покрытие: 100%`);
        return { total, byPattern, byCat, byUnit, pct: 100 };
    }

    function formatLabor(labor) {
        if (!labor) return '—';
        const h = labor.norm;
        if (h < 1) return `${Math.round(h * 60)} мин`;
        if (h === Math.floor(h)) return `${h} ч-ч`;
        return `${h.toFixed(2)} ч-ч`;
    }

    window.LaborResolver = { resolveAll, findNorm, formatLabor };

    function tryAutoResolve() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(resolveAll, 150));
        } else {
            setTimeout(resolveAll, 150);
        }
    }
    tryAutoResolve();
})();
