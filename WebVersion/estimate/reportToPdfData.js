// ================================================================
// reportToPdfData.js — Конвертер EstimateReport → PDF data
// QazGost AI v4.0 · Фаза 3.5: мост к pePdfService.js
//
// Преобразует выход MultiPassEstimateEngine в формат,
// который напрямую принимает PeEstimatePDF.generate(data)
// ================================================================
(function () {
    'use strict';

    /**
     * Преобразует EstimateReport в формат pePdfService.generate(data).
     *
     * @param {object} report — результат MultiPassEstimateEngine.run()
     * @param {object} context — UI-контекст
     *   context.photos — [{ dataUrl }] оригинальные фото
     *   context.client — { name, phone, address, notes }
     *   context.category — название категории
     *   context.categoryMeta — { icon, color } из WorkRegistry
     * @returns {object} — data для PeEstimatePDF.generate()
     */
    function convert(report, context = {}) {
        if (!report) return null;

        // ── Works → data.works ──
        const works = (report.finalItems || []).map((item, idx) => ({
            id: item.id || `work_${idx + 1}`,
            name: item.name || 'Работа',
            unit: item.unit || 'шт',
            section: item.section || _resolveSection(item, context),
            qty: item.qty || item.quantity || 0,
            hours: item.hours || 0,
            workPrice: item.workPrice || 0,
            materialPrice: item.materialPrice || 0,
            price: (item.workPrice || 0) + (item.materialPrice || 0),
        }));

        // ── Category meta ──
        const categoryMeta = context.categoryMeta || _resolveCategoryMeta(context.category);

        // ── Plan ──
        const plan = report.plan ? {
            explanation: report.plan.explanation || '',
            scenarios: report.scenarios || null,
            snipRefs: report.plan.snipRefs || [],
            warnings: report.plan.warnings || [],
            selectedScenario: report.plan.selectedScenario || 'standard',
            confidence: report.plan.confidence || 0,
            objectType: report.plan.objectType || 'generic',
        } : null;

        // ── Multi-pass metadata badge ──
        const _multiPass = {
            mode: report.analysisMode || 'simple',
            passCount: report.metadata?.passCount || 0,
            provider: report.metadata?.provider || '',
            elapsed_ms: report.metadata?.elapsed_ms || 0,
        };

        return {
            // Required by pePdfService
            works,
            category: context.category || '',
            categoryMeta,
            client: context.client || {},
            description: report.plan?.explanation || context.description || '',
            photos: context.photos || [],
            plan,

            // Optional sections
            defects: report.defects || null,
            measurements3d: report.measurements3d || null,
            materials: (report.materials || []).map(m => ({
                name: m.name || '',
                unit: m.unit || 'шт',
                quantity: m.quantity || 0,
                unitPrice: m.unitPrice || m.price || 0,
            })),
            equipment: (report.equipment || []).map(e => ({
                name: e.name || '',
                unit: e.unit || 'маш-ч',
                quantity: e.quantity || e.hours || 0,
                unitPrice: e.unitPrice || e.rentalRate || e.price || 0,
            })),

            // Multi-pass metadata for PDF badge
            _multiPass,

            // Also attach detailedEstimate for backward compat
            detailedEstimate: _buildDetailedEstimate(works),
        };
    }

    /**
     * Helper: Build detailedEstimate (legacy format) from works.
     */
    function _buildDetailedEstimate(works) {
        const bySection = {};
        works.forEach(w => {
            const sec = w.section || 'Общие';
            if (!bySection[sec]) bySection[sec] = [];
            bySection[sec].push(w);
        });

        return {
            sections: Object.entries(bySection).map(([name, items]) => ({
                name,
                items,
            })),
        };
    }

    /**
     * Helper: Resolve section from item category.
     */
    function _resolveSection(item, ctx) {
        const cat = item.category || ctx.category || '';
        const meta = window.WorkRegistry?.CATEGORY_META;
        if (meta) {
            for (const [key, m] of Object.entries(meta)) {
                if (cat.toLowerCase().includes(key)) return m.label;
            }
        }
        return cat || 'Общие';
    }

    /**
     * Helper: Resolve category meta from category name.
     */
    function _resolveCategoryMeta(categoryName) {
        if (!categoryName) return { icon: '📋', color: '#6366f1' };

        const meta = window.WorkRegistry?.CATEGORY_META;
        if (meta) {
            for (const [key, m] of Object.entries(meta)) {
                if (m.label === categoryName || categoryName.toLowerCase().includes(key)) {
                    return { icon: m.icon, color: m.color };
                }
            }
        }

        // WBSCatalog fallback
        const wbsMeta = window.WBSCatalog?.CATEGORY_META;
        if (wbsMeta && wbsMeta[categoryName]) {
            return wbsMeta[categoryName];
        }

        return { icon: '📋', color: '#6366f1' };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.ReportToPdfData = { convert };

    console.log('✅ [ReportToPdfData] v1.0 loaded — EstimateReport → PDF data converter');
})();
