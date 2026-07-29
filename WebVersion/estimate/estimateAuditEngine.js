// ================================================================
// estimateAuditEngine.js — Quality gates для complex/vip
// QazGost AI v4.0 · Фаза 2: кросс-проверка результатов
//
// Интегрируется с ConfidenceGuard.js
// ================================================================
(function () {
    'use strict';

    /**
     * Аудит сессии — кросс-проверка items vs quantities vs materials.
     * @param {object} session — EstimateSession
     * @returns {{ passed, score, issues, suggestions }}
     */
    function audit(session) {
        if (!session || !session.passes) {
            return { passed: false, score: 0, issues: [{ type: 'no_data', severity: 'critical', message: 'Нет данных для аудита' }], suggestions: [] };
        }

        const issues = [];
        let score = 100;

        // Extract pass results
        const objectPass = session.passes.find(p => p.passType === 'object');
        const worksPass = session.passes.find(p => p.passType === 'works');
        const pricingPass = session.passes.find(p => p.passType === 'pricing');
        const completenessPass = session.passes.find(p => p.passType === 'completeness');

        // ── Check 1: Object detection confidence ──
        if (objectPass) {
            const conf = objectPass.confidence || 0;
            if (conf < 40) {
                score -= 30;
                issues.push({
                    type: 'low_confidence',
                    severity: 'critical',
                    item: null,
                    message: `Уверенность определения объекта: ${conf}% (порог: 40%)`,
                });
            } else if (conf < 60) {
                score -= 15;
                issues.push({
                    type: 'low_confidence',
                    severity: 'warning',
                    item: null,
                    message: `Уверенность определения объекта: ${conf}% (рекомендуется > 60%)`,
                });
            }
        }

        // ── Check 2: Works count ──
        const items = worksPass?.output?.items || pricingPass?.output?.items || [];
        if (items.length < 3) {
            score -= 20;
            issues.push({
                type: 'too_few_items',
                severity: 'warning',
                item: null,
                message: `Мало позиций в смете: ${items.length} (рекомендуется ≥ 3)`,
            });
        }

        // ── Check 3: Zero prices ──
        const zeroPriceItems = items.filter(i => (i.price || 0) <= 0 && (i.workPrice || 0) <= 0);
        if (zeroPriceItems.length > 0) {
            score -= zeroPriceItems.length * 5;
            issues.push({
                type: 'zero_price',
                severity: 'warning',
                item: zeroPriceItems.map(i => i.name).join(', '),
                message: `${zeroPriceItems.length} позиций без цены`,
            });
        }

        // ── Check 4: Zero quantities ──
        const zeroQtyItems = items.filter(i => (i.qty || i.quantity || 0) <= 0);
        if (zeroQtyItems.length > 0) {
            score -= zeroQtyItems.length * 5;
            issues.push({
                type: 'zero_quantity',
                severity: 'warning',
                item: zeroQtyItems.map(i => i.name).join(', '),
                message: `${zeroQtyItems.length} позиций без объёма`,
            });
        }

        // ── Check 5: Completeness ──
        if (completenessPass?.output?.completeness < 70) {
            score -= 15;
            issues.push({
                type: 'incomplete',
                severity: 'warning',
                item: null,
                message: `Полнота сметы: ${completenessPass.output.completeness}% (рекомендуется > 70%)`,
            });
        }

        // ── Check 6: Price outliers ──
        const prices = items.map(i => i.price || i.workPrice || 0).filter(p => p > 0);
        if (prices.length >= 3) {
            const median = _median(prices);
            const outliers = items.filter(i => {
                const p = i.price || i.workPrice || 0;
                return p > 0 && (p > median * 5 || p < median * 0.1);
            });
            if (outliers.length > 0) {
                score -= outliers.length * 3;
                issues.push({
                    type: 'price_outlier',
                    severity: 'info',
                    item: outliers.map(i => i.name).join(', '),
                    message: `${outliers.length} позиций с подозрительной ценой (отклонение от медианы)`,
                });
            }
        }

        // ── Check 7: Integrate ConfidenceGuard ──
        if (window.ConfidenceGuard) {
            const total = items.reduce((s, i) => s + (i.price || 0), 0);
            const cgResult = window.ConfidenceGuard.checkConfidence({
                confidence: (objectPass?.confidence || 50) / 100,
                estimateTotal: total,
            });

            if (!cgResult.passed) {
                score -= 10;
                cgResult.flags.forEach(f => {
                    issues.push({
                        type: 'confidence_guard',
                        severity: f.severity || 'warning',
                        item: null,
                        message: f.message,
                    });
                });
            }
        }

        // ── Build suggestions ──
        const suggestions = [];
        if (score < 70) suggestions.push('Рекомендуется проверка инженера');
        if (items.length < 5) suggestions.push('Добавьте описание для более полной сметы');
        if (zeroPriceItems.length > 0) suggestions.push('Проверьте цены позиций без стоимости');

        score = Math.max(0, Math.min(100, score));

        return {
            passed: score >= 60,
            score,
            issues,
            suggestions,
        };
    }

    function _median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.EstimateAuditEngine = { audit };

    console.log('✅ [EstimateAuditEngine] v1.0 loaded — quality gates + ConfidenceGuard integration');
})();
