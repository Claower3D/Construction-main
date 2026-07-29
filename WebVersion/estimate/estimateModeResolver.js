// ================================================================
// estimateModeResolver.js — Автоопределение режима анализа
// QazGost AI v4.0 · Фаза 1: выбор analysisMode
// ================================================================
(function () {
    'use strict';

    /**
     * Определить режим анализа на основе входных данных.
     * @param {object} input
     *   input.photos — массив фото
     *   input.description — текстовое описание
     *   input.category — категория
     *   input.projectId — ID VIP-проекта (если есть)
     *   input.budget — бюджет (если указан)
     *   input.tariff — тариф AI ('top'|'maximum'|'standard')
     *   input.forceMode — ручной override
     * @returns {{ analysisMode: string, reason: string, confidence: number }}
     */
    function resolve(input = {}) {
        const S = window.EstimateSchemas;
        if (!S) return { analysisMode: 'simple', reason: 'Schemas not loaded', confidence: 0.5 };

        // Manual override
        if (input.forceMode && S.AnalysisMode[input.forceMode.toUpperCase()]) {
            return {
                analysisMode: input.forceMode,
                reason: 'Режим выбран вручную',
                confidence: 1.0,
            };
        }

        const signals = [];
        let score = 0; // 0-100: <30 = simple, 30-65 = complex, >65 = vip

        // VIP project
        if (input.projectId) {
            score += 40;
            signals.push('VIP-проект');
        }

        // Budget threshold
        if (input.budget && input.budget > 50000000) {
            score += 30;
            signals.push(`Бюджет > 50M ₸`);
        } else if (input.budget && input.budget > 10000000) {
            score += 15;
            signals.push('Бюджет > 10M ₸');
        }

        // Multiple photos
        const photoCount = (input.photos || []).length;
        if (photoCount >= 5) {
            score += 20;
            signals.push(`${photoCount} фото`);
        } else if (photoCount >= 3) {
            score += 10;
            signals.push(`${photoCount} фото`);
        }

        // PDF / document present
        if (input.hasPdf || input.hasDocument) {
            score += 25;
            signals.push('Документ/PDF');
        }

        // Description complexity
        const descLen = (input.description || '').length;
        if (descLen > 500) {
            score += 15;
            signals.push('Подробное описание');
        } else if (descLen > 200) {
            score += 5;
            signals.push('Описание средней длины');
        }

        // AI tariff hint
        if (input.tariff === 'top') {
            score += 15;
            signals.push('Тариф ТОП');
        }

        // Keywords in description
        const desc = (input.description || '').toLowerCase();
        const vipKeywords = ['здание', 'жк', 'комплекс', 'трц', 'объект', 'проект', 'этаж'];
        const matchedKeywords = vipKeywords.filter(k => desc.includes(k));
        if (matchedKeywords.length >= 2) {
            score += 20;
            signals.push(`Ключевые слова: ${matchedKeywords.join(', ')}`);
        }

        // Determine mode
        let analysisMode;
        if (score >= 65) {
            analysisMode = S.AnalysisMode.VIP;
        } else if (score >= 30) {
            analysisMode = S.AnalysisMode.COMPLEX;
        } else {
            analysisMode = S.AnalysisMode.SIMPLE;
        }

        return {
            analysisMode,
            reason: signals.length > 0 ? signals.join(', ') : 'Стандартный анализ',
            confidence: Math.min(score / 100, 1.0),
            score,
            signals,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.EstimateModeResolver = { resolve };

    console.log('✅ [EstimateModeResolver] v1.0 loaded — simple/complex/vip auto-detect');
})();
