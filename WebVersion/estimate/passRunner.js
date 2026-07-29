// ================================================================
// passRunner.js — Исполнитель отдельных passes
// QazGost AI v4.0 · Фаза 2: AI и local pass execution
//
// Маппинг pass → существующий код:
//   object       → AI (Gemini/ChatGPT через PromptRegistry)
//   quantities   → AI (complex/vip)
//   works        → GeminiEstimateResolver.resolveItems() [local]
//   materials    → AI (complex/vip)
//   completeness → CompletenessEngine.checkAndComplete() [local]
//   pricing      → SmartPricingResolver.price() [local]
//   audit        → AI (complex/vip)
//   wbs_mapping  → EstimateWbsGenerator [local]
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // AI PASS — отправка prompt в Gemini/ChatGPT
    // ═══════════════════════════════════════════════════════════

    /**
     * Выполнить AI pass.
     * @param {object} prompt — { system, user, schema }
     * @param {object} input — { photos, description }
     * @param {string} provider — 'gemini'|'chatgpt'
     * @returns {Promise<{ output, tokens, duration, model }>}
     */
    async function runAI(prompt, input, provider = 'gemini') {
        const start = Date.now();

        // Build parts для AI
        const parts = [];

        // System instruction + user prompt as text
        parts.push({ text: prompt.system + '\n\n' + prompt.user });

        // Add photo (first photo only for passes that need it)
        if (input.photos && input.photos.length > 0) {
            const photo = input.photos[0];
            if (photo.dataUrl) {
                const base64 = photo.dataUrl.split(',')[1];
                const mimeType = photo.dataUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';
                parts.push({ inlineData: { data: base64, mimeType } });
            } else if (photo instanceof File) {
                const base64 = await _fileToBase64(photo);
                parts.push({ inlineData: { data: base64, mimeType: photo.type || 'image/jpeg' } });
            }
        }

        let responseText = null;
        let model = '';

        try {
            if (provider === 'chatgpt' && window.ChatGptService) {
                responseText = await window.ChatGptService.generateContent(parts);
                model = window.ChatGptService.getModel?.() || 'gpt-4';
            } else if (window.GeminiService) {
                responseText = await window.GeminiService.generateContent(parts);
                model = window.GeminiService.getModel?.() || 'gemini-2.5-pro';
            } else {
                throw new Error('No AI service available (GeminiService/ChatGptService)');
            }
        } catch (e) {
            console.error('[PassRunner] AI call failed:', e.message);
            throw e;
        }

        if (!responseText) {
            throw new Error('Empty AI response');
        }

        // Parse JSON response
        let output;
        try {
            output = JSON.parse(responseText);
        } catch {
            // Try to extract JSON from markdown
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                output = JSON.parse(jsonMatch[1]);
            } else {
                const braceMatch = responseText.match(/\{[\s\S]*\}/);
                if (braceMatch) {
                    output = JSON.parse(braceMatch[0]);
                } else {
                    throw new Error('Failed to parse AI response as JSON');
                }
            }
        }

        return {
            output,
            tokens: _estimateTokens(prompt.user + (responseText || '')),
            duration: Date.now() - start,
            model,
            provider,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // LOCAL PASSES — вызов существующих модулей
    // ═══════════════════════════════════════════════════════════

    /**
     * Выполнить local pass.
     * @param {string} passType
     * @param {object} previousResults — { objectOutput, quantitiesOutput, worksItems, ... }
     * @param {object} context — { category, description, ... }
     * @returns {Promise<{ output, duration }>}
     */
    async function runLocal(passType, previousResults = {}, context = {}) {
        const start = Date.now();
        let output = null;

        switch (passType) {
            case 'works':
                output = _runWorksPass(previousResults, context);
                break;

            case 'completeness':
                output = _runCompletenessPass(previousResults, context);
                break;

            case 'pricing':
                output = _runPricingPass(previousResults, context);
                break;

            case 'wbs_mapping':
                output = _runWbsMappingPass(previousResults, context);
                break;

            default:
                throw new Error(`Unknown local pass type: ${passType}`);
        }

        return {
            output,
            duration: Date.now() - start,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // WORKS PASS — GeminiEstimateResolver
    // ═══════════════════════════════════════════════════════════

    function _runWorksPass(prev, ctx) {
        const resolver = window.GeminiEstimateResolver;
        if (!resolver) {
            console.warn('[PassRunner] GeminiEstimateResolver not available');
            return { items: prev.rawItems || [], matchRate: 0 };
        }

        // Get raw items from object/quantities pass
        const rawItems = prev.rawItems || prev.objectOutput?.estimate_items || [];
        const category = ctx.category || '';

        // Resolve through WorkRegistry
        const resolved = resolver.resolveItems(rawItems, category);

        // Convert to WorkItem format
        const S = window.EstimateSchemas;
        const items = (resolved || rawItems).map(item => {
            return S ? S.createWorkItem({
                name: item.name || item.work_name || '',
                unit: item.unit || 'шт',
                section: item.section || _inferSection(item, ctx),
                qty: item.quantity || item.qty || 0,
                hours: item.hours || item.labor_hours || _estimateHours(item),
                workPrice: item.workPrice || item.price || item.unit_price || 0,
                materialPrice: item.materialPrice || Math.round((item.price || 0) * 0.3),
                price: (item.workPrice || item.price || 0) + (item.materialPrice || Math.round((item.price || 0) * 0.3)),
                matched_work_id: item.matched_work_id || item.matchedId || null,
                price_source: item.price_source || 'ai',
                confidence: item.confidence || item.matchScore || 0.5,
                category: item.category || ctx.category || '',
                source_pass: 'works',
            }) : item;
        });

        const matchedCount = items.filter(i => i.matched_work_id).length;

        return {
            items,
            matchRate: items.length > 0 ? matchedCount / items.length : 0,
            totalItems: items.length,
            matchedItems: matchedCount,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // COMPLETENESS PASS — CompletenessEngine
    // ═══════════════════════════════════════════════════════════

    function _runCompletenessPass(prev, ctx) {
        const engine = window.CompletenessEngine;
        if (!engine) {
            console.warn('[PassRunner] CompletenessEngine not available');
            return { items: prev.worksItems || [], addedItems: [], completeness: 100 };
        }

        const items = prev.worksItems || [];
        const objectType = prev.objectOutput?.objectType || ctx.objectType || 'generic';

        const result = engine.checkAndComplete(items, objectType, ctx.category);

        // Merge added items into full list
        const S = window.EstimateSchemas;
        const addedConverted = (result.addedItems || []).map(item =>
            S ? S.createWorkItem({
                ...item,
                section: item.section || _inferSection(item, ctx),
                hours: item.hours || _estimateHours(item),
                workPrice: item.workPrice || item.price || 0,
                materialPrice: item.materialPrice || Math.round((item.price || 0) * 0.3),
                price: (item.workPrice || item.price || 0) + (item.materialPrice || Math.round((item.price || 0) * 0.3)),
                source_pass: 'completeness',
                price_source: 'auto_complete',
            }) : item
        );

        return {
            items: [...items, ...addedConverted],
            addedItems: addedConverted,
            completeness: result.completeness || 100,
            warnings: result.warnings || [],
            stats: result.stats || {},
        };
    }

    // ═══════════════════════════════════════════════════════════
    // PRICING PASS — SmartPricingResolver
    // ═══════════════════════════════════════════════════════════

    function _runPricingPass(prev, ctx) {
        const resolver = window.SmartPricingResolver;
        if (!resolver) {
            console.warn('[PassRunner] SmartPricingResolver not available');
            const items = prev.completenessItems || prev.worksItems || [];
            const total = items.reduce((s, i) => s + (i.price || 0), 0);
            return {
                items,
                scenarios: {
                    economy:  { name: '🏠 Эконом', emoji: '🏠', total: Math.round(total * 0.7), desc: 'Бюджетный вариант' },
                    standard: { name: '🏗️ Стандарт', emoji: '🏗️', total, desc: 'Оптимальное качество' },
                    premium:  { name: '✨ Премиум', emoji: '✨', total: Math.round(total * 1.6), desc: 'Первоклассные материалы' },
                },
            };
        }

        const items = prev.completenessItems || prev.worksItems || [];

        // Apply pricing for all 3 scenarios
        const result = resolver.price(items, 'standard');
        const scenarios = {};

        for (const scenKey of ['economy', 'standard', 'premium']) {
            const scenResult = resolver.price(items, scenKey);
            const scenDef = resolver.SCENARIOS[scenKey];
            scenarios[scenKey] = {
                name: scenDef.label,
                emoji: scenDef.label.split(' ')[0],
                total: scenResult.total || 0,
                desc: scenDef.description,
                items: scenResult.items,
            };
        }

        // Update items with standard pricing
        const pricedItems = (result.items || items).map(item => ({
            ...item,
            workPrice: item.workPrice || item.resolvedPrice || item.price || 0,
            materialPrice: item.materialPrice || Math.round((item.resolvedPrice || item.price || 0) * 0.3),
            price: (item.workPrice || item.resolvedPrice || item.price || 0) +
                   (item.materialPrice || Math.round((item.resolvedPrice || item.price || 0) * 0.3)),
            price_source: item.price_source || 'smart_pricing',
            source_pass: 'pricing',
        }));

        return {
            items: pricedItems,
            scenarios,
            selectedScenario: 'standard',
        };
    }

    // ═══════════════════════════════════════════════════════════
    // WBS MAPPING PASS — EstimateWbsGenerator
    // ═══════════════════════════════════════════════════════════

    function _runWbsMappingPass(prev, ctx) {
        const generator = window.EstimateWbsGenerator;
        if (!generator) {
            return { wbsNodes: [], mapped: false };
        }

        const items = prev.pricedItems || prev.completenessItems || [];
        const wbsNodes = generator.generateFromEstimate(ctx.projectId, {
            finalItems: items,
        });

        return {
            wbsNodes: wbsNodes || [],
            mapped: true,
            nodeCount: (wbsNodes || []).length,
        };
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    function _inferSection(item, ctx) {
        const category = item.category || ctx.category || '';
        const meta = window.WorkRegistry?.CATEGORY_META;
        if (meta) {
            for (const [key, m] of Object.entries(meta)) {
                if (category.toLowerCase().includes(key) || key.includes(category.toLowerCase())) {
                    return m.label;
                }
            }
        }
        return category || 'Общие';
    }

    function _estimateHours(item) {
        // Rough estimate: qty * coefficient based on unit
        const qty = item.quantity || item.qty || 1;
        const unit = (item.unit || '').toLowerCase();
        if (unit.includes('м²')) return Math.round(qty * 0.5 * 10) / 10;
        if (unit.includes('м³')) return Math.round(qty * 2 * 10) / 10;
        if (unit.includes('м.п') || unit.includes('п.м')) return Math.round(qty * 0.3 * 10) / 10;
        if (unit.includes('шт')) return Math.round(qty * 1.5 * 10) / 10;
        if (unit.includes('кг') || unit.includes('т')) return Math.round(qty * 0.1 * 10) / 10;
        return Math.round(qty * 0.5 * 10) / 10;
    }

    function _fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function _estimateTokens(text) {
        // Rough: ~4 chars per token for mixed ru/en
        return Math.round((text || '').length / 4);
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.PassRunner = {
        runAI,
        runLocal,
    };

    console.log('✅ [PassRunner] v1.0 loaded — AI + local pass executor');
})();
