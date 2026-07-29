// ================================================================
// photoEstimateOrchestrator.js — Оркестратор AI-оценки стоимости
// QazGost AI v3.0 · Модуль «Оценка стоимости с помощью ИИ»
//
// Связывает все компоненты в единый pipeline:
// CatalogLoader → GeminiService → GeminiEstimateResolver →
// CompletenessEngine → SmartPricingResolver → Готовая смета
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // КОНФИГУРАЦИЯ ПРОМПТА для Gemini
    // ═══════════════════════════════════════════════════════════

    const GEMINI_ESTIMATE_PROMPT = `
Ты — профессиональный сметчик-строитель Казахстана (QazGost AI).
Анализируй фото и/или описание строительного объекта.

ЗАДАЧИ:
1. Определи тип объекта (objectType)
2. Составь список КОНКРЕТНЫХ работ с количествами и ценами
3. Определи дефекты (если есть)

ФОРМАТ ОТВЕТА — строго JSON:
{
  "objectType": "foundation|masonry|roofing|flooring|electrical|plumbing|facade|demolition|finishing|hvac|landscape|other",
  "scene_description": "Краткое описание (1-2 предложения)",
  "dimensions": {
    "length_m": null,
    "width_m": null,
    "height_m": null,
    "area_m2": null,
    "perimeter_m": null
  },
  "estimate_items": [
    {
      "name": "Точное название работы по-русски (как в сметах)",
      "unit": "м²|м.п.|м³|шт|компл.|кг|т",
      "quantity": 0,
      "price": 0,
      "category": "foundation|masonry|roofing|flooring|electrical|plumbing|facade|demolition|finishing_walls|hvac|landscape|other"
    }
  ],
  "defects": [
    {
      "type": "трещина|деформация|коррозия|протечка|разрушение",
      "severity": "low|medium|high|critical",
      "description": "описание"
    }
  ],
  "confidence": 0.0-1.0,
  "notes": "дополнительные заметки"
}

ПРАВИЛА:
- Цены в тенге (₸) для Казахстана (Алматы/Астана 2024-2025)
- Единицы: м² для площадных, м.п. для линейных, м³ для объёмных, шт для штучных
- Количество определяй из фото/описания. Если неясно — ставь разумную оценку
- Минимум 3 позиции, максимум 25 позиций
- НЕ включай сопутствующие (грунтовка, армирование) — их добавит система автоматически
- Если на фото видны дефекты — добавь в defects
- confidence = твоя уверенность в оценке (0.0-1.0)
`;

    // ═══════════════════════════════════════════════════════════
    // ОСНОВНОЙ PIPELINE
    // ═══════════════════════════════════════════════════════════

    /**
     * Запустить полный pipeline оценки стоимости по фото/описанию.
     * @param {object} input
     * @param {Array<{dataUrl:string}>} input.photos — фотографии
     * @param {string} input.description — текстовое описание
     * @param {string} [input.category] — выбранная категория (может быть null)
     * @param {object} [input.context] — доп. контекст { isRepair, isWetZone, ... }
     * @param {function} [onProgress] — callback прогресса (step, percent, message)
     * @returns {Promise<object>} — готовая смета
     */
    async function run(input, onProgress) {
        // ── Multi-Pass Engine delegation (v4.0) ──
        if (window.MultiPassEstimateEngine && window.EstimateSchemas) {
            try {
                console.log('[PhotoEstimateOrchestrator] → Delegating to MultiPassEstimateEngine');
                const report = await window.MultiPassEstimateEngine.run(input, onProgress);
                return _convertReportToLegacyFormat(report, input);
            } catch (mpErr) {
                console.warn('[PhotoEstimateOrchestrator] MultiPass failed, falling back to legacy:', mpErr.message);
                // Fall through to legacy pipeline below
            }
        }

        // ── Legacy pipeline (v3.0 fallback) ──
        const startTime = Date.now();
        const log = [];
        const progress = (step, percent, message) => {
            log.push({ step, percent, message, time: Date.now() - startTime });
            if (onProgress) onProgress(step, percent, message);
        };

        try {
            // ── Шаг 1: Загрузить каталоги ──
            progress('catalogs', 5, '📚 Загружаю справочник работ...');
            await _ensureCatalogsLoaded();

            // ── Шаг 2: Отправить в AI (Gemini / ChatGPT) ──
            const _aiMode = window.AIService?.getMode?.() || 'gemini';
            const _aiLabel = _aiMode === 'chatgpt' ? '🤖 ChatGPT' : '🌐 Gemini';
            progress('ai_call', 15, `${_aiLabel}: Отправляю данные...`);
            const geminiResult = await _callAI(input.photos, input.description);

            if (!geminiResult || !geminiResult.estimate_items || geminiResult.estimate_items.length === 0) {
                return _errorResult('AI не смог определить работы. Попробуйте добавить описание.', log);
            }

            progress('gemini_done', 40, `✅ AI определил: ${geminiResult.objectType || 'объект'} (${geminiResult.estimate_items.length} позиций)`);

            // ── Шаг 3: Матчить с WorkRegistry ──
            progress('matching', 50, '🔍 Сопоставляю с базой цен (12 754 позиции)...');
            const resolver = window.GeminiEstimateResolver;
            let resolvedItems = geminiResult.estimate_items;

            if (resolver) {
                resolvedItems = resolver.resolveItems(geminiResult.estimate_items, geminiResult.objectType);
            }

            progress('matching_done', 65, `✅ Найдено в справочнике: ${resolvedItems.filter(i => i.price_source === 'database' || i.price_source === 'price_kz').length}/${resolvedItems.length}`);

            // ── Шаг 4: Дополнить недостающие работы ──
            progress('completeness', 70, '➕ Проверяю комплектность сметы...');
            let autoCompleted = { addedItems: [], warnings: [], completeness: 100, stats: {} };

            if (window.CompletenessEngine) {
                autoCompleted = window.CompletenessEngine.checkAndComplete(
                    resolvedItems,
                    geminiResult.objectType,
                    input.context || {}
                );
                // Merge added items
                resolvedItems = [...resolvedItems, ...autoCompleted.addedItems];
            }

            if (autoCompleted.addedItems.length > 0) {
                progress('completeness_done', 80, `➕ Добавлено ${autoCompleted.addedItems.length} сопутствующих работ`);
            } else {
                progress('completeness_done', 80, '✅ Смета полная — сопутствующие уже включены');
            }

            // ── Шаг 5: Ценообразование × 3 сценария ──
            progress('pricing', 85, '💰 Рассчитываю 3 сценария (Эконом / Стандарт / Премиум)...');
            let pricingResult = { items: resolvedItems, scenarios: {}, price_stats: {} };

            if (window.SmartPricingResolver) {
                pricingResult = window.SmartPricingResolver.price(resolvedItems);
            }

            // ── Шаг 6: Формирование итога ──
            progress('done', 100, '🎉 Смета готова!');

            const elapsed = Date.now() - startTime;

            const result = {
                success: true,
                objectType: geminiResult.objectType || 'other',
                scene_description: geminiResult.scene_description || '',
                dimensions: geminiResult.dimensions || {},

                // Основные позиции (merged: AI + DB + completeness)
                estimate_items: pricingResult.items,
                estimate_total: pricingResult.scenarios?.standard?.total || pricingResult.items.reduce((s, i) => s + (i.total_price || 0), 0),

                // Автодополнение
                auto_completed: {
                    count: autoCompleted.addedItems.length,
                    items: autoCompleted.addedItems.map(i => i.name),
                    completeness_before: autoCompleted.stats?.satisfiedBefore
                        ? Math.round((autoCompleted.stats.satisfiedBefore / Math.max(autoCompleted.stats.totalDependencies, 1)) * 100)
                        : 100,
                    completeness_after: autoCompleted.completeness,
                    warnings: autoCompleted.warnings,
                },

                // 3 Сценария
                scenarios: pricingResult.scenarios,

                // Статистика цен
                price_stats: pricingResult.price_stats,

                // Дефекты
                defects: geminiResult.defects || [],

                // Метаданные
                confidence: geminiResult.confidence || 0.5,
                ai_backend: (window.AIService?.getMode?.() || 'gemini'),
                notes: geminiResult.notes || '',
                pipeline_log: log,
                elapsed_ms: elapsed,

                // Контекст для UI
                context: autoCompleted.context || {},
            };

            console.log(
                `[PhotoEstimateOrchestrator] ✅ Pipeline complete in ${elapsed}ms:` +
                ` ${result.estimate_items.length} позиций, ` +
                ` стандарт = ${_formatPrice(result.estimate_total)}`
            );

            return result;

        } catch (error) {
            console.error('[PhotoEstimateOrchestrator] Pipeline error:', error);
            progress('error', 0, `❌ Ошибка: ${error.message}`);
            return _errorResult(error.message, log);
        }
    }

    // ═══════════════════════════════════════════════════════════
    // ВНУТРЕННИЕ ФУНКЦИИ
    // ═══════════════════════════════════════════════════════════

    /**
     * Убедиться что каталоги загружены.
     */
    async function _ensureCatalogsLoaded() {
        if (window.CatalogLoader && !window.CatalogLoader.isReady()) {
            console.log('[Orchestrator] Loading all catalogs...');
            await window.CatalogLoader.loadAll();
        }
        // Invalidate WR cache to pick up newly loaded catalogs
        if (window.WorkRegistry?.invalidateCache) {
            window.WorkRegistry.invalidateCache();
        }
    }

    /**
     * Вызвать Gemini AI для анализа фото + описания.
     */
    async function _callAI(photos, description) {
        const mode = window.AIService?.getMode?.() || 'gemini';
        const gemini = window.GeminiService;
        const chatgpt = window.ChatGptService;

        // ── ChatGPT path ──
        if (mode === 'chatgpt' && chatgpt && chatgpt.isConfigured()) {
            try {
                console.log('[Orchestrator] Using ChatGPT provider');
                const mainPhoto = (photos && photos.length > 0) ? (photos[0].file || photos[0]) : null;
                const gptResult = await chatgpt.analyzeConstructionPhoto(mainPhoto, {
                    description: description || '',
                    region: 'almaty',
                });
                if (gptResult) {
                    const normalized = chatgpt.normalizeToAIServiceFormat(gptResult);
                    return _parseGeminiResponse(JSON.stringify(normalized));
                }
            } catch (gptErr) {
                console.warn('[Orchestrator] ChatGPT failed, falling back to Gemini:', gptErr.message);
            }
        }

        // ── Gemini path ──
        if (!gemini) {
            // Fallback: generate from description only
            console.warn('[Orchestrator] No AI provider available — using description-only mode');
            return _generateFromDescription(description);
        }

        try {
            // Prepare images
            const imageData = [];
            if (photos && photos.length > 0) {
                for (const photo of photos.slice(0, 3)) { // Max 3 photos
                    if (photo.dataUrl) {
                        const base64 = photo.dataUrl.split(',')[1];
                        const mimeType = photo.dataUrl.split(';')[0].split(':')[1] || 'image/jpeg';
                        imageData.push({ inlineData: { data: base64, mimeType } });
                    }
                }
            }

            // Build prompt
            let userPrompt = GEMINI_ESTIMATE_PROMPT;
            if (description) {
                userPrompt += `\n\nОПИСАНИЕ ЗАКАЗЧИКА:\n${description}`;
            }
            if (imageData.length === 0) {
                userPrompt += '\n\n⚠️ Фото не предоставлено. Оценивай ТОЛЬКО по описанию.';
            }

            // Call Gemini
            const parts = [];
            parts.push({ text: userPrompt });
            imageData.forEach(img => parts.push(img));

            const response = await gemini.generateContent(parts);

            if (!response) {
                throw new Error('Gemini вернул пустой ответ');
            }

            // Parse JSON from response
            return _parseGeminiResponse(response);

        } catch (err) {
            console.error('[Orchestrator] Gemini call error:', err);
            // Fallback to description-only
            if (description) {
                return _generateFromDescription(description);
            }
            throw err;
        }
    }

    /**
     * Парсинг ответа Gemini (может быть обёрнут в markdown code blocks).
     */
    function _parseGeminiResponse(responseText) {
        let text = responseText;
        if (typeof text !== 'string') {
            // If response is an object from Gemini API
            if (text?.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = text.candidates[0].content.parts[0].text;
            } else if (text?.text) {
                text = text.text;
            } else {
                text = JSON.stringify(text);
            }
        }

        // Extract JSON from markdown code blocks
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) text = jsonMatch[1];

        // Try to find JSON object
        const braceStart = text.indexOf('{');
        const braceEnd = text.lastIndexOf('}');
        if (braceStart >= 0 && braceEnd > braceStart) {
            text = text.substring(braceStart, braceEnd + 1);
        }

        try {
            const parsed = JSON.parse(text);

            // Validate structure
            if (!parsed.estimate_items || !Array.isArray(parsed.estimate_items)) {
                parsed.estimate_items = [];
            }

            // Normalize items
            parsed.estimate_items = parsed.estimate_items
                .filter(item => item && item.name)
                .map(item => ({
                    name: item.name || '',
                    unit: item.unit || 'шт',
                    quantity: parseFloat(item.quantity) || 1,
                    price: parseFloat(item.price) || 0,
                    unit_price: parseFloat(item.price) || 0,
                    total_price: Math.round((parseFloat(item.quantity) || 1) * (parseFloat(item.price) || 0)),
                    total: Math.round((parseFloat(item.quantity) || 1) * (parseFloat(item.price) || 0)),
                    category: item.category || parsed.objectType || 'other',
                    added_by: 'gemini',
                    price_source: 'gemini',
                }));

            return parsed;
        } catch (e) {
            console.error('[Orchestrator] Failed to parse Gemini JSON:', e.message, text.substring(0, 200));
            throw new Error('Не удалось разобрать ответ AI. Попробуйте ещё раз.');
        }
    }

    /**
     * Генерация сметы только по описанию (без фото, без Gemini).
     * Используется как fallback.
     */
    function _generateFromDescription(description) {
        if (!description) return null;
        const desc = description.toLowerCase();

        // Detect type from description
        let objectType = 'other';
        const typePatterns = [
            { pattern: /фундамент|основани|ленточн|свайн|плитн.*фунд/i, type: 'foundation' },
            { pattern: /штукатурк|шпаклёвк|покраск|обои|гипсокартон|отделк/i, type: 'finishing' },
            { pattern: /плитк|ламинат|пол|стяжк|паркет|линолеум/i, type: 'flooring' },
            { pattern: /кровл|крыш|черепиц|профнастил/i, type: 'roofing' },
            { pattern: /электрик|проводк|розетк|освещен/i, type: 'electrical' },
            { pattern: /сантехник|ванн|душев|унитаз|водоснабж/i, type: 'plumbing' },
            { pattern: /фасад|утеплен.*стен|сайдинг/i, type: 'facade' },
            { pattern: /кладк|кирпич|газобетон|стен.*блок/i, type: 'masonry' },
            { pattern: /демонтаж|снос|разбор/i, type: 'demolition' },
            { pattern: /отоплен|радиатор|котёл|тёплый пол/i, type: 'heating' },
            { pattern: /вентиляц|кондиционер/i, type: 'hvac' },
        ];

        for (const { pattern, type } of typePatterns) {
            if (pattern.test(desc)) { objectType = type; break; }
        }

        // Parse dimensions
        const dimMatch = desc.match(/(\d+)[xх×](\d+)/);
        const areaMatch = desc.match(/(\d+)\s*(?:м²|кв[\.\s]*м)/);
        let area_m2 = 0;
        let length_m = 0, width_m = 0;
        if (dimMatch) {
            length_m = parseInt(dimMatch[1]);
            width_m = parseInt(dimMatch[2]);
            area_m2 = length_m * width_m;
        } else if (areaMatch) {
            area_m2 = parseInt(areaMatch[1]);
        }

        // Generate items from WorkRegistry
        const WR = window.WorkRegistry;
        const items = [];

        if (WR) {
            const group = _objectTypeToGroup(objectType);
            const works = group ? WR.getWorksByGroup(group) : [];

            // Select top works (by price, max 10)
            const topWorks = works
                .filter(w => w.price > 0)
                .sort((a, b) => b.price - a.price)
                .slice(0, 10);

            for (const work of topWorks) {
                const quantity = _estimateQuantity(work, area_m2, length_m);
                items.push({
                    name: work.name,
                    unit: work.unit || 'м²',
                    quantity: quantity,
                    price: work.price,
                    unit_price: work.price,
                    total_price: Math.round(quantity * work.price),
                    total: Math.round(quantity * work.price),
                    category: objectType,
                    added_by: 'description_fallback',
                    price_source: 'database',
                    matched_work_id: work.id,
                });
            }
        }

        return {
            objectType,
            scene_description: description,
            dimensions: { length_m, width_m, area_m2, perimeter_m: length_m && width_m ? 2 * (length_m + width_m) : 0 },
            estimate_items: items,
            confidence: 0.4,
            notes: 'Оценка по описанию (без фото). Рекомендуется загрузить фото для точности.',
        };
    }

    function _objectTypeToGroup(objectType) {
        const map = {
            foundation: 'foundation', masonry: 'masonry', concrete: 'concrete',
            roofing: 'roofing', flooring: 'flooring', electrical: 'electrical',
            plumbing: 'plumbing', hvac: 'hvac', facade: 'facade',
            finishing: 'finishing_walls', demolition: 'demolition',
            landscape: 'landscape', heating: 'heating',
        };
        return map[objectType] || null;
    }

    function _estimateQuantity(work, area_m2, length_m) {
        const unit = (work.unit || '').toLowerCase();
        if (area_m2 > 0) {
            if (unit.includes('м²')) return area_m2;
            if (unit.includes('м.п') || unit === 'м' || unit === 'пм') return Math.round(Math.sqrt(area_m2) * 4);
            if (unit.includes('м³')) return Math.round(area_m2 * 0.3);
            if (unit === 'шт') return Math.max(1, Math.round(area_m2 / 10));
        }
        if (length_m > 0) {
            if (unit.includes('м.п') || unit === 'м') return length_m * 4;
        }
        return unit === 'шт' ? 1 : 10;
    }

    function _errorResult(message, log) {
        return {
            success: false,
            error: message,
            estimate_items: [],
            estimate_total: 0,
            scenarios: {},
            price_stats: {},
            pipeline_log: log || [],
        };
    }

    function _formatPrice(n) {
        if (!n) return '0 ₸';
        return n.toLocaleString('ru-RU') + ' ₸';
    }

    /**
     * Конвертер EstimateReport → legacy формат для существующего UI.
     * Обеспечивает 100% совместимость с photoEstimateModule.js.
     */
    function _convertReportToLegacyFormat(report, input) {
        if (!report) return _errorResult('Empty report from MultiPassEngine', []);

        const items = (report.finalItems || []).map(item => ({
            name: item.name || '',
            unit: item.unit || 'шт',
            quantity: item.qty || item.quantity || 0,
            section: item.section || 'Общие',
            hours: item.hours || 0,
            workPrice: item.workPrice || 0,
            materialPrice: item.materialPrice || 0,
            price: item.price || item.workPrice || 0,
            total_price: item.price || ((item.workPrice || 0) + (item.materialPrice || 0)),
            price_source: item.price_source || 'ai',
            matched_work_id: item.matched_work_id || null,
            matchScore: item.confidence || 0,
            category: item.category || '',
        }));

        const total = items.reduce((s, i) => s + (i.total_price || 0), 0);

        return {
            success: true,
            objectType: report.plan?.objectType || 'other',
            scene_description: report.plan?.explanation || '',
            dimensions: report.measurements3d || {},

            estimate_items: items,
            estimate_total: report.scenarios?.standard?.total || total,

            auto_completed: {
                count: (report.passes || []).find(p => p.passType === 'completeness')?.output?.addedItems?.length || 0,
                items: ((report.passes || []).find(p => p.passType === 'completeness')?.output?.addedItems || []).map(i => i.name),
                completeness_before: 0,
                completeness_after: (report.passes || []).find(p => p.passType === 'completeness')?.output?.completeness || 100,
                warnings: report.plan?.warnings || [],
            },

            scenarios: report.scenarios || {},
            price_stats: {},
            defects: report.defects?.defects || [],
            confidence: report.plan?.confidence || 0.5,
            ai_backend: report.metadata?.provider || 'gemini',
            notes: '',
            pipeline_log: [],
            elapsed_ms: report.metadata?.elapsed_ms || 0,
            context: {},

            // Multi-pass metadata
            _multiPassReport: report,
            _sessionId: report.sessionId,
        };
    }


    window.PhotoEstimateOrchestrator = {
        run,
        GEMINI_ESTIMATE_PROMPT,
    };

    console.log('✅ [PhotoEstimateOrchestrator] Loaded — AI estimation pipeline ready');
})();
