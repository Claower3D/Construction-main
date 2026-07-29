// ================================================================
// completenessEngine.js — Дополнение недостающих работ
// QazGost AI v3.0 · Модуль «Оценка стоимости с помощью ИИ»
//
// Если AI определил основную работу, но забыл сопутствующие —
// автоматически добавить (грунтовка к штукатурке, армирование
// к фундаменту и т.д.)
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // ПОМОЩНИКИ
    // ═══════════════════════════════════════════════════════════

    /**
     * Проверить, содержит ли массив items позицию с похожим именем.
     */
    function alreadyHas(items, searchName) {
        if (!searchName) return false;
        const q = searchName.toLowerCase();
        return items.some(item => {
            const n = (item.name || '').toLowerCase();
            // Fuzzy check: at least 60% of words match
            const qWords = q.split(/\s+/).filter(w => w.length > 2);
            const nWords = n.split(/\s+/).filter(w => w.length > 2);
            if (qWords.length === 0) return false;
            const matchCount = qWords.filter(w => nWords.some(nw => nw.includes(w) || w.includes(nw))).length;
            return matchCount / qWords.length >= 0.5;
        });
    }

    /**
     * Проверить условие правила.
     */
    function checkCondition(condition, context) {
        if (!condition || condition === 'always') return true;

        if (condition === 'wet_zone') {
            return context.isWetZone === true;
        }
        if (condition === 'repair') {
            return context.isRepair === true;
        }
        if (condition === 'hidden_wiring') {
            return context.hiddenWiring !== false; // default true
        }
        // area>N
        const areaMatch = condition.match(/^area>(\d+)$/);
        if (areaMatch) {
            const threshold = parseInt(areaMatch[1]);
            return (context.area_m2 || 0) > threshold;
        }
        return true;
    }

    /**
     * Определить контекст из описания и позиций.
     */
    function inferContext(items, description) {
        const desc = (description || '').toLowerCase();
        const allNames = items.map(i => (i.name || '').toLowerCase()).join(' ');
        const combined = desc + ' ' + allNames;

        const totalArea = items.reduce((sum, i) => {
            if ((i.unit || '').includes('м²')) return sum + (i.quantity || 0);
            return sum;
        }, 0);

        return {
            isWetZone: /ванн|душев|санузел|туалет|мокр.*зон|бассейн|кухн/i.test(combined),
            isRepair: /ремонт|замен|рестав|реконструкц|вторичн|старый/i.test(combined),
            hiddenWiring: !/открыт.*проводк|кабель.*канал|наружн.*проводк/i.test(combined),
            area_m2: totalArea,
            isNewBuild: /новострой|новое строительств|с нуля/i.test(combined),
        };
    }

    // ═══════════════════════════════════════════════════════════
    // ОСНОВНАЯ ФУНКЦИЯ
    // ═══════════════════════════════════════════════════════════

    /**
     * Проверить смету на полноту и добавить недостающие работы.
     * @param {Array} items — текущие estimate_items
     * @param {string} objectType — тип объекта
     * @param {object} [contextOverride] — ручные настройки контекста
     * @returns {{ addedItems, warnings, completeness, context }}
     */
    function checkAndComplete(items, objectType, contextOverride) {
        const rules = window.COMPLETENESS_RULES;
        if (!rules || !Array.isArray(rules)) {
            console.warn('[CompletenessEngine] COMPLETENESS_RULES not loaded');
            return { addedItems: [], warnings: [], completeness: 100, context: {} };
        }

        const context = {
            ...inferContext(items, objectType),
            ...(contextOverride || {}),
        };

        const addedItems = [];
        const warnings = [];
        let triggeredRulesCount = 0;
        let satisfiedDeps = 0;
        let totalDeps = 0;

        // For each rule, check if any item triggers it
        for (const rule of rules) {
            // Find triggering item(s)
            const triggerItems = items.filter(item => {
                const name = (item.name || '').toLowerCase();
                if (rule.trigger instanceof RegExp) return rule.trigger.test(name);
                return name.includes(rule.trigger.toLowerCase());
            });

            if (triggerItems.length === 0) continue;
            triggeredRulesCount++;

            // For each required dependency
            for (const dep of rule.required) {
                totalDeps++;

                // Check condition
                if (!checkCondition(dep.condition, context)) {
                    satisfiedDeps++; // condition not met → considered satisfied
                    continue;
                }

                // Check if already in the list
                if (alreadyHas(items, dep.name) || alreadyHas(addedItems, dep.name)) {
                    satisfiedDeps++;
                    continue;
                }

                // Calculate quantity from trigger items
                const baseQuantity = triggerItems.reduce((sum, ti) => sum + (ti.quantity || 1), 0);
                const quantity = dep.fixedQuantity || Math.round(baseQuantity * (dep.quantityFactor || 1.0) * 10) / 10;

                // Try to find in WorkRegistry
                let unitPrice = dep.fallbackPrice;
                let priceSource = 'fallback';
                let matchedWorkId = null;

                if (window.GeminiEstimateResolver) {
                    const match = window.GeminiEstimateResolver.findBestMatch(dep.searchQuery || dep.name);
                    if (match && match.score >= 0.35 && match.work.price > 0) {
                        unitPrice = match.work.price;
                        priceSource = 'database';
                        matchedWorkId = match.work.id;
                    }
                }

                const newItem = {
                    name: dep.name,
                    unit: dep.unit,
                    quantity: quantity,
                    unit_price: unitPrice,
                    price: unitPrice,
                    total_price: Math.round(quantity * unitPrice),
                    total: Math.round(quantity * unitPrice),
                    price_source: priceSource,
                    matched_work_id: matchedWorkId,
                    added_by: 'completeness',
                    priority: dep.priority || 5,
                    confidence: priceSource === 'database' ? 0.85 : 0.65,
                    triggered_by: triggerItems[0]?.name || '',
                };

                addedItems.push(newItem);
                warnings.push(`➕ Добавлено: ${dep.name} (${quantity} ${dep.unit}) — к работе «${triggerItems[0]?.name || '?'}»`);
            }
        }

        // Calculate completeness score
        const completeness = totalDeps > 0
            ? Math.round(((satisfiedDeps + addedItems.length) / totalDeps) * 100)
            : 100;

        // Sort added items by priority
        addedItems.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        console.log(
            `[CompletenessEngine] ✅ ${triggeredRulesCount} правил сработало → ` +
            `${addedItems.length} позиций добавлено, полнота: ${completeness}%`
        );

        return {
            addedItems,
            warnings,
            completeness,
            context,
            stats: {
                rulesTriggered: triggeredRulesCount,
                totalRules: rules.length,
                totalDependencies: totalDeps,
                satisfiedBefore: satisfiedDeps,
                addedCount: addedItems.length,
            }
        };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.CompletenessEngine = {
        checkAndComplete,
        inferContext,
    };

    console.log('✅ [CompletenessEngine] Loaded — auto-complete missing works');
})();
