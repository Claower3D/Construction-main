// ================================================================
// chatGptService.js — OpenAI ChatGPT API Client for Construction Analysis
// QAZGOST AI v3.0
//
// Provides window.ChatGptService = {
//   analyzeConstructionPhoto(photo, opts) — photo → GPT-4o → structured JSON
//   isConfigured()                       — checks if API key is set
//   setApiKey(key)                       — saves API key to localStorage
//   getApiKey()                          — reads API key
//   testConnection()                     — validate API key
//   normalizeToAIServiceFormat(result)   — convert to AIService contract
//   generateContent(messages)            — generic chat completion
// }
// ================================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'qazgost_openai_key';
    const TARIFF_KEY = 'qazgost_openai_tariff';
    const API_URL = 'https://api.openai.com/v1/chat/completions';

    // ══ Cloudflare Worker Proxy (ключи на сервере, не в браузере) ══
    const WORKER_URL = 'https://construction-api.kmp99.workers.dev';
    const USE_WORKER_PROXY = true; // true = через Worker (безопасно), false = напрямую

    // ═══════════════════════════════════════════════════════════════════════
    // ТАРИФНЫЕ ПЛАНЫ
    // ═══════════════════════════════════════════════════════════════════════

    const TARIFF_PLANS = {
        top: {
            key: 'top',
            label: '👑 ТОП — Крупные объекты',
            model: 'gpt-5.4',
            contextWindow: '1 050 000 токенов',
            contextTokens: 1050000,
            maxOutput: 32768,
            description: 'GPT-5.4 Flagship — для крупных строительных проектов: ЖК, ТРЦ, промышленные объекты. Полный анализ проектной документации.',
            features: [
                'Adaptive Reasoning (адаптивное мышление)',
                '1.05М токенов контекст — полный проект',
                'Vision Pro (фото + чертежи + PDF)',
                'Вывод до 32K токенов — детальные сметы',
                'Анализ больших спецификаций целиком',
                'Для объектов: здания, комплексы, инфраструктура',
            ],
            costLevel: '💎💎💎💎',
            recommended: false,
            useCase: 'Многоэтажные здания, ЖК, ТРЦ, промышленные объекты, инфраструктура',
        },
        maximum: {
            key: 'maximum',
            label: '🚀 Максимум',
            model: 'gpt-5.4-mini',
            contextWindow: '400 000 токенов',
            contextTokens: 400000,
            maxOutput: 16384,
            description: 'GPT-5.4 Mini — мощная и сбалансированная. 400K контекст, отличная точность для средних объектов.',
            features: [
                'Vision (анализ фото)',
                'JSON Mode',
                '400K токенов контекст',
                'Высокая точность смет',
                'Вывод 16K токенов',
            ],
            costLevel: '💎💎💎',
            recommended: true,
        },
        standard: {
            key: 'standard',
            label: '⚡ Стандарт',
            model: 'gpt-4.1-mini',
            contextWindow: '1 000 000 токенов',
            contextTokens: 1000000,
            maxOutput: 8192,
            description: 'GPT-4.1 Mini — быстрый и экономичный. 1М контекст, мгновенный отклик для типовых смет.',
            features: [
                'Vision (анализ фото)',
                'JSON Mode',
                '1М токенов контекст',
                'Быстрый отклик (< 3 сек)',
                'Экономичная для массовых расчётов',
            ],
            costLevel: '💎',
            recommended: false,
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // API Key Management
    // ═══════════════════════════════════════════════════════════════════════

    // ⚠️ Ключ загружается из config.js → window.QAZGOST_CONFIG.openaiApiKey
    function getApiKey() {
        return (window.QAZGOST_CONFIG && window.QAZGOST_CONFIG.openaiApiKey)
            || localStorage.getItem(STORAGE_KEY)
            || '';
    }

    function setApiKey(key) {
        localStorage.setItem(STORAGE_KEY, (key || '').trim());
        if (window.QAZGOST_CONFIG) {
            window.QAZGOST_CONFIG.openaiApiKey = (key || '').trim();
        }
        console.log('[ChatGptService] 🔑 API key saved');
    }

    function isConfigured() {
        const key = getApiKey();
        return key.length > 10 && key.startsWith('sk-');
    }

    /**
     * Get current tariff plan.
     * @returns {'maximum'|'standard'}
     */
    function getTariff() {
        return localStorage.getItem(TARIFF_KEY) || 'maximum';
    }

    /**
     * Set tariff plan.
     * @param {'maximum'|'standard'} tariff
     */
    function setTariff(tariff) {
        if (!TARIFF_PLANS[tariff]) {
            console.warn(`[ChatGptService] Unknown tariff: ${tariff}. Available: ${Object.keys(TARIFF_PLANS).join(', ')}`);
            return;
        }
        localStorage.setItem(TARIFF_KEY, tariff);
        console.log(`[ChatGptService] 🔧 Tariff set to: ${TARIFF_PLANS[tariff].label} (${TARIFF_PLANS[tariff].model})`);
    }

    function getTariffPlans() {
        return { ...TARIFF_PLANS };
    }

    function getModel() {
        const tariff = getTariff();
        return TARIFF_PLANS[tariff]?.model
            || (window.QAZGOST_CONFIG && window.QAZGOST_CONFIG.openaiModel)
            || TARIFF_PLANS.maximum.model;
    }

    function setModel(model) {
        console.log(`[ChatGptService] Model override: ${model}`);
    }

    function _getMaxTokens() {
        const tariff = getTariff();
        return TARIFF_PLANS[tariff]?.maxOutput || 4096;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // SYSTEM PROMPT — точная копия логики из Gemini, адаптирована под OpenAI
    // ═══════════════════════════════════════════════════════════════════════

    const SYSTEM_PROMPT = `Ты — **AI-инженер строительной экспертизы** системы QAZGOST AI (Казахстан).
Твоя задача — составлять точные сметы строительных работ на основе ОПИСАНИЯ КЛИЕНТА и ФОТОГРАФИЙ.

## ⚡ ПОРЯДОК ПРИОРИТЕТОВ (СТРОГО!):
1. **ОПИСАНИЕ КЛИЕНТА — ГЛАВНЫЙ ПРИОРИТЕТ.** Пользователь описывает ЧТО НУЖНО СДЕЛАТЬ. Именно описание определяет:
   - Какие КОНКРЕТНЫЕ работы включить в смету
   - Какой тип объекта (objectType)
   - Какие материалы и объёмы
2. **ВЫБРАННАЯ КАТЕГОРИЯ — ОГРАНИЧЕНИЕ.** Все работы ДОЛЖНЫ быть из выбранной категории. НЕ подменяй!
3. **ФОТО — ДОПОЛНЕНИЕ.** Фото используется для:
   - Уточнения реальных РАЗМЕРОВ (длина, ширина, площадь)
   - Определения СОСТОЯНИЯ объекта (дефекты)
   - Проверки МАТЕРИАЛОВ (бетон, металл, кирпич)
   - НО фото НЕ определяет тип работ — это делает описание!

## Компетенции:
1. **Составление сметы** — конкретные работы с единицами, количеством и ценами в тенге (₸)
2. **Распознавание объектов** — по фото определяй размеры, материалы, состояние
3. **Дефектоскопия** — трещины, коррозия, деформации
4. **Оценка размеров** — габариты в метрах. Если клиент указал площадь — используй её!

## Типы объектов (objectType):
foundation_strip, foundation_slab, foundation_pile, wall_brick, wall_block, wall_concrete,
slab, floor_screed, floor_tile, roof_gable, roof_flat, roof_profiled_sheet,
metal_structure, profiled_sheet, steel_frame, pipe_pvc, pipe_metal, pipe_hdpe,
electrical, plumbing, hvac, painting, plastering, tiling, insulation, waterproofing,
concrete, earthwork, demolition, facade, interior, windows_doors, landscape, rebar, trench, generic

## ФОРМАТ ОТВЕТА:
Отвечай ТОЛЬКО валидным JSON (без markdown, без \`\`\`json, без комментариев).`;

    // ═══════════════════════════════════════════════════════════════════════
    // USER PROMPT TEMPLATE
    // ═══════════════════════════════════════════════════════════════════════

    function buildUserPrompt(opts = {}) {
        const category = opts.category || '';
        const description = opts.description || '';
        const region = opts.region || 'almaty';
        const hasPhoto = opts.hasPhoto !== false;

        let prompt = `## 🎯 ЗАДАНИЕ ОТ КЛИЕНТА (ГЛАВНЫЙ ПРИОРИТЕТ)\n`;

        if (category) {
            prompt += `\n**КАТЕГОРИЯ РАБОТ:** "${category}"\n⚠️ ВСЕ работы в estimate_items СТРОГО из этой категории!`;
        }
        if (description) {
            prompt += `\n\n**ОПИСАНИЕ КЛИЕНТА (самое важное):** "${description}"\nИзвлеки из него: тип работ, материалы, размеры, количество.`;
        } else {
            prompt += `\n\n📝 Описание не указано — определи работы по категории и фото.`;
        }

        if (hasPhoto) {
            prompt += `\n\n## 📷 ФОТО ОБЪЕКТА\nИспользуй для уточнения размеров, состояния и материалов.\n❌ НЕ меняй тип работ на основе фото если клиент описал задачу!`;
        } else {
            prompt += `\n\n📷 Фото не предоставлено — работай ТОЛЬКО по описанию.`;
        }

        prompt += `\n\n## 📐 ТРЕБОВАНИЯ К СМЕТЕ
Регион: ${region} (Казахстан). Цены в тенге (₸).

Верни JSON строго по этой схеме:
{
  "objectType": "тип из списка system prompt",
  "confidence": число от 0 до 100,
  "scene_description": "Что нужно сделать, 2-3 предложения",
  "construction_stage": "preparation|foundation|walls|roof|finishing|repair|demolition|metalwork",
  "objects": [
    {
      "class_name": "тип",
      "confidence": 0.0-1.0,
      "description_ru": "описание",
      "estimated_dimensions": { "length_m": null, "width_m": null, "height_m": null, "area_m2": null }
    }
  ],
  "estimate_items": [
    {
      "name": "КОНКРЕТНОЕ название работы на русском",
      "unit": "м2|м3|п.м.|шт|кг|т",
      "quantity": число,
      "price": число в тенге,
      "category": "${category || 'auto'}"
    }
  ],
  "defects": [],
  "materials_seen": [],
  "dimensions_estimate": { "length_m": null, "width_m": null, "height_m": null, "area_m2": null, "volume_m3": null, "perimeter_m": null },
  "recommendations": [],
  "snip_references": []
}

⚠️ ПРАВИЛА:
1. Генерируй 5-15 КОНКРЕТНЫХ работ
2. Каждая работа — реалистичная цена в тенге (₸) для Казахстана
3. Количество — из описания клиента или по фото
4. Названия работ — профессиональные`;

        return prompt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // File → Base64
    // ═══════════════════════════════════════════════════════════════════════

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function dataUrlToBase64(dataUrl) {
        if (!dataUrl) return null;
        const parts = dataUrl.split(',');
        return parts.length > 1 ? parts[1] : null;
    }

    function getMimeType(file) {
        if (file && file.type) return file.type;
        return 'image/jpeg';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MAIN: Analyze Construction Photo via ChatGPT
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param {File|{file:File, dataUrl:string}} photo
     * @param {object} opts — { category, description, region, onProgress }
     * @returns {object|null} — structured analysis result
     */
    async function analyzeConstructionPhoto(photo, opts = {}) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error('[ChatGptService] ❌ No API key configured');
            return null;
        }

        const emit = (stage, percent, message) => {
            if (opts.onProgress) opts.onProgress({ stage, percent, message });
        };

        emit('preparing', 5, 'Подготовка для ChatGPT...');

        // Extract file and base64
        let base64Data = null, mimeType = 'image/jpeg';
        if (photo) {
            try {
                if (photo instanceof File) {
                    base64Data = await fileToBase64(photo);
                    mimeType = getMimeType(photo);
                } else if (photo.file) {
                    base64Data = await fileToBase64(photo.file);
                    mimeType = getMimeType(photo.file);
                } else if (photo.dataUrl) {
                    base64Data = dataUrlToBase64(photo.dataUrl);
                    mimeType = photo.dataUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';
                }
            } catch (e) {
                console.warn('[ChatGptService] ⚠️ Failed to encode photo:', e.message);
            }
        }

        if (!photo && !opts.description && !opts.category) {
            console.error('[ChatGptService] ❌ No photo, no description, no category');
            return null;
        }

        const hasPhoto = !!base64Data;
        console.log(`[ChatGptService] Mode: ${hasPhoto ? 'photo+text' : 'text-only'}, model: ${getModel()}`);

        emit('connecting', 15, 'Подключение к OpenAI ChatGPT...');

        // Build messages for Chat Completions API
        const userContent = [];

        // Text part (always)
        userContent.push({
            type: 'text',
            text: buildUserPrompt({ ...opts, hasPhoto })
        });

        // Image part (optional — requires vision-capable model)
        if (base64Data) {
            userContent.push({
                type: 'image_url',
                image_url: {
                    url: `data:${mimeType};base64,${base64Data}`,
                    detail: 'high'
                }
            });
        }

        const requestBody = {
            model: getModel(),
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: userContent }
            ],
            temperature: 0.2,
            max_tokens: _getMaxTokens(),
            response_format: { type: 'json_object' },
        };

        // Retry logic: 2 attempts
        let lastError;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                emit('analyzing', 30 + attempt * 10, attempt === 0
                    ? '🧠 ChatGPT анализирует...'
                    : '🔄 Повторная попытка...');

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 60000);

                // Выбираем URL: через Worker (безопасно) или напрямую
                const fetchUrl = USE_WORKER_PROXY
                    ? `${WORKER_URL}/api/openai/chat`
                    : API_URL;
                const headers = { 'Content-Type': 'application/json' };
                if (!USE_WORKER_PROXY) {
                    headers['Authorization'] = `Bearer ${apiKey}`;
                }

                const response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errMsg = errorData.error?.message || `HTTP ${response.status}`;
                    throw new Error(errMsg);
                }

                const data = await response.json();
                emit('parsing', 80, 'Обработка результатов...');

                // Extract text from ChatGPT response
                const text = data.choices?.[0]?.message?.content;
                if (!text) {
                    throw new Error('Empty response from ChatGPT');
                }

                // Token usage logging
                const usage = data.usage;
                if (usage) {
                    console.log(`[ChatGptService] Tokens: ${usage.prompt_tokens} in → ${usage.completion_tokens} out (total: ${usage.total_tokens})`);
                }

                // Parse JSON
                let result;
                try {
                    result = JSON.parse(text);
                } catch {
                    // Try to extract JSON from markdown code block
                    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                        result = JSON.parse(jsonMatch[1]);
                    } else {
                        const braceMatch = text.match(/\{[\s\S]*\}/);
                        if (braceMatch) {
                            result = JSON.parse(braceMatch[0]);
                        } else {
                            throw new Error('Could not parse ChatGPT response as JSON');
                        }
                    }
                }

                emit('done', 100, '✅ Анализ ChatGPT завершён');

                console.log(`[ChatGptService] ✅ Analysis complete: objectType=${result.objectType}, ` +
                    `items=${result.estimate_items?.length || 0}, model=${getModel()}`);

                return result;

            } catch (e) {
                lastError = e;
                console.warn(`[ChatGptService] Attempt ${attempt + 1} failed:`, e.message);
                if (attempt < 1) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }

        console.error('[ChatGptService] ❌ All attempts failed:', lastError?.message);
        emit('error', 0, `Ошибка ChatGPT: ${lastError?.message}`);
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Generic generateContent — for orchestrator compatibility
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generic method, compatible with GeminiService.generateContent
     * @param {Array} parts — [{ text }, { inlineData }]
     * @returns {string|null} — response text
     */
    async function generateContent(parts) {
        const apiKey = getApiKey();
        if (!apiKey) return null;

        const userContent = [];

        for (const part of parts) {
            if (part.text) {
                userContent.push({ type: 'text', text: part.text });
            }
            if (part.inlineData) {
                userContent.push({
                    type: 'image_url',
                    image_url: {
                        url: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                        detail: 'high'
                    }
                });
            }
        }

        try {
            const fetchUrl = USE_WORKER_PROXY
                ? `${WORKER_URL}/api/openai/chat`
                : API_URL;
            const headers = { 'Content-Type': 'application/json' };
            if (!USE_WORKER_PROXY) {
                headers['Authorization'] = `Bearer ${apiKey}`;
            }

            const response = await fetch(fetchUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    model: getModel(),
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: userContent }
                    ],
                    temperature: 0.2,
                    max_tokens: 4096,
                    response_format: { type: 'json_object' },
                })
            });

            if (!response.ok) return null;
            const data = await response.json();
            return data.choices?.[0]?.message?.content || null;
        } catch (e) {
            console.error('[ChatGptService] generateContent error:', e.message);
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Normalize ChatGPT response → AIService contract format
    // ═══════════════════════════════════════════════════════════════════════

    function normalizeToAIServiceFormat(chatGptResult) {
        if (!chatGptResult) return null;

        // Map objects
        const objects = (chatGptResult.objects || []).map(obj => ({
            class_name: obj.class_name || chatGptResult.objectType || 'generic',
            confidence: obj.confidence || (chatGptResult.confidence / 100) || 0.7,
            bbox: [0, 0, 0, 0],
            area_px: 0,
            width: obj.estimated_dimensions?.width_m || 0,
            height: obj.estimated_dimensions?.height_m || 0,
            description_ru: obj.description_ru || '',
            estimated_dimensions: obj.estimated_dimensions || {},
            source: 'chatgpt'
        }));

        // Map defects
        const defectItems = (chatGptResult.defects || []).map(def => ({
            type: def.type || 'unknown',
            severity: def.severity || 'low',
            confidence: def.severity === 'high' ? 0.9 : def.severity === 'medium' ? 0.7 : 0.5,
            description_ru: def.description_ru || '',
            recommendation: def.recommendation || '',
            bbox: [0, 0, 0, 0],
            source: 'chatgpt'
        }));

        // Map estimate items
        const estimateItems = (chatGptResult.estimate_items || []).map(item => ({
            work_name: item.name || 'Работа',
            name: item.name || 'Работа',
            unit: item.unit || 'шт',
            quantity: item.quantity || 1,
            unit_price: item.price || 0,
            price: item.price || 0,
            total_price: (item.quantity || 1) * (item.price || 0),
            total: (item.quantity || 1) * (item.price || 0),
            labor_hours: null,
            price_source: 'chatgpt',
            category: item.category || chatGptResult.objectType || 'generic',
            source: 'chatgpt'
        }));
        const estimateTotal = estimateItems.reduce((sum, item) => sum + item.total_price, 0);

        return {
            objects,
            defects_detected: { total: defectItems.length, items: defectItems },
            scene_description: chatGptResult.scene_description || '',
            objectType: chatGptResult.objectType || 'generic',
            object_type: chatGptResult.objectType || 'generic',
            confidence: chatGptResult.confidence || 50,
            materials_seen: chatGptResult.materials_seen || [],
            dimensions: chatGptResult.dimensions_estimate || {},
            estimate_items: estimateItems,
            estimate_total: estimateTotal,
            scale_calibrated: false,
            scale_factor: null,
            scale_method: 'chatgpt_estimate',
            construction_stage: chatGptResult.construction_stage || 'unknown',
            recommendations: chatGptResult.recommendations || [],
            snip_references: chatGptResult.snip_references || [],
            success: true,
            sessionStatus: 'complete',
            object_count: objects.length,
            processing_time_ms: 0,
            ai_backend: 'chatgpt',
            model: getModel(),
            detected_objects: objects,
            qwen_result: {
                objectType: chatGptResult.objectType || 'generic',
                confidence: chatGptResult.confidence || 50,
                scene_description: chatGptResult.scene_description || '',
                materials_seen: chatGptResult.materials_seen || [],
                dimensions_estimate: chatGptResult.dimensions_estimate || {},
                objects
            },
            plan: {
                work_items: estimateItems,
                explanation: chatGptResult.scene_description || ''
            },
            _raw: chatGptResult
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Test connection
    // ═══════════════════════════════════════════════════════════════════════

    async function testConnection() {
        const apiKey = getApiKey();
        if (!apiKey) return { ok: false, error: 'No API key' };

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'user', content: 'Ответь одним словом: работаешь?' }],
                    max_tokens: 10
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                return { ok: false, error: err.error?.message || `HTTP ${res.status}` };
            }
            return { ok: true };
        } catch (e) {
            return { ok: false, error: e.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    window.ChatGptService = {
        analyzeConstructionPhoto,
        normalizeToAIServiceFormat,
        generateContent,
        isConfigured,
        getApiKey,
        setApiKey,
        testConnection,
        getModel,
        setModel,
        // Тарифные планы
        getTariff,
        setTariff,
        getTariffPlans,
        TARIFF_PLANS,
        _buildUserPrompt: buildUserPrompt,
        _SYSTEM_PROMPT: SYSTEM_PROMPT
    };

    const _t = TARIFF_PLANS[getTariff()];
    console.log(`✅ [ChatGptService] Loaded — тариф: ${_t.label} (${_t.model}, ${_t.contextWindow}), configured: ${isConfigured()}`);
})();
