// ================================================================
// smartPricingResolver.js — Умное ценообразование × 3 сценария
// QazGost AI v3.0 · Модуль «Оценка стоимости с помощью ИИ»
//
// Определяет финальную цену для каждой позиции по приоритету:
// 1. WorkRegistry DB → 2. PriceKZ pattern → 3. Gemini → 4. Median
// Генерирует 3 сценария: Эконом / Стандарт / Премиум
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // СЦЕНАРНЫЕ КОЭФФИЦИЕНТЫ
    // ═══════════════════════════════════════════════════════════

    const SCENARIOS = {
        economy: {
            key: 'economy',
            label: '🏠 Эконом',
            description: 'Бюджетные материалы, минимальный набор работ',
            multiplier: 0.70,
            color: '#22c55e',
        },
        standard: {
            key: 'standard',
            label: '🏗️ Стандарт',
            description: 'Оптимальное качество, рыночная цена',
            multiplier: 1.00,
            color: '#8b5cf6',
        },
        premium: {
            key: 'premium',
            label: '✨ Премиум',
            description: 'Первоклассные материалы, полный комплекс работ',
            multiplier: 1.60,
            color: '#f59e0b',
        },
    };

    // Категорийные множители для сценариев (некоторые категории дороже в премиуме)
    const CATEGORY_SCENARIO_ADJUSTMENTS = {
        economy: {
            finishing_walls: 0.6,  // стены можно покрасить дёшево
            flooring: 0.65,       // линолеум вместо плитки
            ceiling: 0.55,        // побелка вместо натяжного
            openings: 0.8,        // бюджетные окна
            landscape: 0.5,       // минимальное благоустройство
        },
        premium: {
            finishing_walls: 1.8,  // декоративная штукатурка, дизайн
            flooring: 1.9,        // мрамор, паркет
            ceiling: 1.7,         // многоуровневые потолки
            openings: 1.8,        // алюминиевые окна, дизайнерские двери
            electrical: 1.5,      // умный дом, автоматизация
            plumbing: 1.7,        // дизайнерская сантехника
            landscape: 2.0,       // ландшафтный дизайн
        },
    };

    // ═══════════════════════════════════════════════════════════
    // ОПРЕДЕЛЕНИЕ ЦЕНЫ
    // ═══════════════════════════════════════════════════════════

    /**
     * Рассчитать финальную цену для каждого item × 3 сценария.
     * @param {Array} items — resolved estimate_items (от GeminiEstimateResolver)
     * @returns {{ items, scenarios, price_stats }}
     */
    function price(items) {
        if (!items || !Array.isArray(items)) {
            return { items: [], scenarios: {}, price_stats: {} };
        }

        let fromDatabase = 0;
        let fromPriceKZ = 0;
        let fromGemini = 0;
        let fromFallback = 0;

        // Enrich each item with scenario prices
        const pricedItems = items.map(item => {
            const basePrice = item.unit_price || item.price || 0;
            const source = item.price_source || 'gemini';

            // Track stats
            if (source === 'database') fromDatabase++;
            else if (source === 'price_kz') fromPriceKZ++;
            else if (source === 'fallback') fromFallback++;
            else fromGemini++;

            // Determine category group for scenario adjustments
            const group = _getGroupForItem(item);

            // Calculate scenario prices
            const economyMult = (CATEGORY_SCENARIO_ADJUSTMENTS.economy?.[group] || SCENARIOS.economy.multiplier);
            const premiumMult = (CATEGORY_SCENARIO_ADJUSTMENTS.premium?.[group] || SCENARIOS.premium.multiplier);

            return {
                ...item,
                scenario_prices: {
                    economy: Math.round(basePrice * economyMult),
                    standard: basePrice,
                    premium: Math.round(basePrice * premiumMult),
                },
                scenario_totals: {
                    economy: Math.round((item.quantity || 1) * basePrice * economyMult),
                    standard: Math.round((item.quantity || 1) * basePrice),
                    premium: Math.round((item.quantity || 1) * basePrice * premiumMult),
                },
            };
        });

        // Calculate scenario totals
        const scenarios = {};
        for (const [key, meta] of Object.entries(SCENARIOS)) {
            const total = pricedItems.reduce((sum, item) => {
                return sum + (item.scenario_totals?.[key] || 0);
            }, 0);
            scenarios[key] = {
                ...meta,
                total,
                itemCount: pricedItems.length,
            };
        }

        const price_stats = {
            total_items: pricedItems.length,
            from_database: fromDatabase,
            from_price_kz: fromPriceKZ,
            from_gemini: fromGemini,
            from_fallback: fromFallback,
            db_coverage: pricedItems.length > 0
                ? Math.round(((fromDatabase + fromPriceKZ) / pricedItems.length) * 100)
                : 0,
        };

        console.log(
            `[SmartPricingResolver] ✅ ${pricedItems.length} позиций × 3 сценария | ` +
            `Эконом: ${_formatPrice(scenarios.economy?.total)} | ` +
            `Стандарт: ${_formatPrice(scenarios.standard?.total)} | ` +
            `Премиум: ${_formatPrice(scenarios.premium?.total)}`
        );

        return { items: pricedItems, scenarios, price_stats };
    }

    /**
     * Определить WorkRegistry группу для item (для scenario adjustments).
     */
    function _getGroupForItem(item) {
        if (item.matched_work_id && window.WorkRegistry) {
            const WR = window.WorkRegistry;
            // Quick scan
            const works = WR.search ? WR.search(item.name?.substring(0, 15) || '') : [];
            const found = works.find(w => w.id === item.matched_work_id);
            if (found) return found.group;
        }
        // Fallback: guess from name
        const name = (item.name || '').toLowerCase();
        if (/штукатурк|покраск|шпаклёвк|обои|гипсокартон/i.test(name)) return 'finishing_walls';
        if (/плитк|ламинат|пол|стяжк|паркет/i.test(name)) return 'flooring';
        if (/потолок|натяжн/i.test(name)) return 'ceiling';
        if (/электрик|розетк|кабел/i.test(name)) return 'electrical';
        if (/сантехник|унитаз|ванн|смесител|трубы.*водо/i.test(name)) return 'plumbing';
        if (/кровл|крыш|черепиц|профнастил/i.test(name)) return 'roofing';
        if (/фундамент|свай|ростверк/i.test(name)) return 'foundation';
        if (/фасад|сайдинг|утеплен.*фасад/i.test(name)) return 'facade';
        if (/окн|двер|проём/i.test(name)) return 'openings';
        if (/демонтаж/i.test(name)) return 'demolition';
        if (/кладк|кирпич|газобетон|блок/i.test(name)) return 'masonry';
        if (/благоустр|ландшафт|озелен/i.test(name)) return 'landscape';
        return 'other';
    }

    function _formatPrice(n) {
        if (!n) return '0 ₸';
        return n.toLocaleString('ru-RU') + ' ₸';
    }

    /**
     * Get scenario definitions (for UI).
     */
    function getScenarios() {
        return { ...SCENARIOS };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.SmartPricingResolver = {
        price,
        getScenarios,
        SCENARIOS,
    };

    console.log('✅ [SmartPricingResolver] Loaded — pricing × 3 scenarios (economy/standard/premium)');
})();
