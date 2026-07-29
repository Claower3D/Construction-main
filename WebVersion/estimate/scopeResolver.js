// ================================================================
// scopeResolver.js — Определение scope (construction / building)
// QazGost AI v4.0 · Фаза 1: выбор scopeType
// ================================================================
(function () {
    'use strict';

    /**
     * Определить scope на основе входных данных.
     * @param {object} input
     * @returns {{ scopeType: string, reason: string }}
     */
    function resolve(input = {}) {
        const S = window.EstimateSchemas;
        if (!S) return { scopeType: 'construction', reason: 'Schemas not loaded' };

        // VIP project → building
        if (input.projectId) {
            return {
                scopeType: S.ScopeType.BUILDING_STRUCTURE,
                reason: 'VIP-проект: анализ здания/комплекса',
            };
        }

        // PDF → likely building
        if (input.hasPdf || input.hasDocument) {
            return {
                scopeType: S.ScopeType.BUILDING_STRUCTURE,
                reason: 'Документ/PDF → комплексный объект',
            };
        }

        // Keyword analysis
        const desc = (input.description || '').toLowerCase();
        const buildingKeywords = [
            'дом', 'здание', 'жк', 'жилой комплекс', 'трц', 'торговый центр',
            'этаж', 'квартир', 'коттедж', 'особняк', 'офис', 'склад', 'ангар',
            'промышлен', 'фабрик', 'завод', 'инфраструктур', 'комплекс',
        ];

        const matched = buildingKeywords.filter(k => desc.includes(k));
        if (matched.length >= 1) {
            return {
                scopeType: S.ScopeType.BUILDING_STRUCTURE,
                reason: `Ключевые слова: ${matched.join(', ')}`,
            };
        }

        // Many photos suggest complex object
        if ((input.photos || []).length >= 5) {
            return {
                scopeType: S.ScopeType.BUILDING_STRUCTURE,
                reason: '5+ фото → комплексный объект',
            };
        }

        // Default
        return {
            scopeType: S.ScopeType.CONSTRUCTION,
            reason: 'Стандартный: отдельная работа/помещение',
        };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.ScopeResolver = { resolve };

    console.log('✅ [ScopeResolver] v1.0 loaded — construction/building_structure');
})();
