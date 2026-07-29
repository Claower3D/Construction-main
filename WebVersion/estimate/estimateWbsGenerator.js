// ================================================================
// estimateWbsGenerator.js — Мост AI Estimate → VIP WBS
// QazGost AI v4.0 · Фаза 3: AI→WBS bridge
//
// Трансформирует EstimateReport в WBS-узлы для VIP Project
// ================================================================
(function () {
    'use strict';

    /**
     * Генерирует WBS-узлы из EstimateReport.
     * Каждый section → WBS Level 1, каждый item → WBS Level 2.
     *
     * @param {string} projectId — ID VIP-проекта
     * @param {object} estimateReport — EstimateReport
     * @returns {Array} WBSNode[]
     */
    function generateFromEstimate(projectId, estimateReport) {
        if (!estimateReport || !estimateReport.finalItems) return [];

        const items = estimateReport.finalItems;

        // Group items by section
        const bySection = {};
        items.forEach(item => {
            const section = item.section || 'Общие';
            if (!bySection[section]) bySection[section] = [];
            bySection[section].push(item);
        });

        const wbsNodes = [];
        let sectionIdx = 0;

        for (const [sectionName, sectionItems] of Object.entries(bySection)) {
            sectionIdx++;
            const sectionCode = `${sectionIdx}`;

            // Level 1: Section node
            const sectionTotal = sectionItems.reduce((s, i) => s + (i.price || 0), 0);
            const sectionHours = sectionItems.reduce((s, i) => s + (i.hours || 0), 0);

            const sectionNode = {
                id: `wbs_${projectId}_${sectionIdx}`,
                projectId,
                code: sectionCode,
                name: sectionName,
                level: 1,
                type: 'section',
                budget: sectionTotal,
                hours: sectionHours,
                status: 'planned',
                children: [],
                source: 'ai_estimate',
                estimateSessionId: estimateReport.sessionId || null,
            };

            // Level 2: Work items
            sectionItems.forEach((item, itemIdx) => {
                const itemCode = `${sectionCode}.${itemIdx + 1}`;
                const childNode = {
                    id: `wbs_${projectId}_${sectionIdx}_${itemIdx + 1}`,
                    projectId,
                    code: itemCode,
                    parentCode: sectionCode,
                    name: item.name,
                    level: 2,
                    type: 'work',
                    unit: item.unit,
                    quantity: item.qty || item.quantity || 0,
                    unitPrice: item.workPrice || item.price || 0,
                    budget: item.price || 0,
                    hours: item.hours || 0,
                    status: 'planned',
                    source: 'ai_estimate',
                    matched_work_id: item.matched_work_id || null,
                    confidence: item.confidence || 0.5,
                };

                sectionNode.children.push(childNode);
                wbsNodes.push(childNode);
            });

            wbsNodes.push(sectionNode);
        }

        console.log(`[EstimateWbsGenerator] Generated ${wbsNodes.length} WBS nodes for project ${projectId}`);
        return wbsNodes;
    }

    /**
     * Обновить существующий WBS количествами из оценки.
     * @param {string} projectId
     * @param {object} estimateReport
     * @returns {{ updated: number, added: number }}
     */
    function enrichWBS(projectId, estimateReport) {
        // Get existing WBS from VipService
        const VipService = window.VipService;
        if (!VipService) {
            console.warn('[EstimateWbsGenerator] VipService not available');
            return { updated: 0, added: 0 };
        }

        const project = VipService.getProject?.(projectId);
        if (!project) {
            return { updated: 0, added: 0 };
        }

        let updated = 0;
        let added = 0;

        const items = estimateReport.finalItems || [];
        const existingWbs = project.wbs || [];

        // Try to match estimate items to existing WBS nodes
        items.forEach(item => {
            const existingNode = existingWbs.find(n =>
                n.name && item.name &&
                n.name.toLowerCase().includes(item.name.toLowerCase().substring(0, 15))
            );

            if (existingNode) {
                // Update quantities and prices
                existingNode.quantity = item.qty || item.quantity || existingNode.quantity;
                existingNode.unitPrice = item.workPrice || existingNode.unitPrice;
                existingNode.budget = item.price || existingNode.budget;
                existingNode.hours = item.hours || existingNode.hours;
                existingNode.aiUpdated = true;
                existingNode.aiConfidence = item.confidence || 0.5;
                updated++;
            } else {
                added++;
            }
        });

        console.log(`[EstimateWbsGenerator] Enriched WBS: ${updated} updated, ${added} new items`);
        return { updated, added };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.EstimateWbsGenerator = {
        generateFromEstimate,
        enrichWBS,
    };

    console.log('✅ [EstimateWbsGenerator] v1.0 loaded — AI Estimate → WBS bridge');
})();
