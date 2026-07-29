// ============================================================
// geminiService.js — Google Gemini API Client for Construction Analysis
// QAZGOST AI v3.0
//
// Provides window.GeminiService = {
//   analyzeConstructionPhoto(file, opts) — photo → Gemini → structured JSON
//   isConfigured()                      — checks if API key is set
//   setApiKey(key)                      — saves API key to localStorage
//   getApiKey()                         — reads API key
// }
// ============================================================

(function () {
    'use strict';

    const STORAGE_KEY = 'qazgost_gemini_key';
    const TARIFF_KEY = 'qazgost_gemini_tariff';
    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

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
            model: 'gemini-3.1-pro-preview',
            contextWindow: '2 000 000 токенов',
            contextTokens: 2000000,
            maxOutput: 65536,
            description: 'Gemini 3.1 Pro — для крупных строительных объектов: ЖК, ТРЦ, инфраструктура. Максимальный контекст 2М для анализа полных проектов.',
            features: [
                'Thinking Mode (глубокий анализ)',
                '2М токенов контекст — вмещает полный проект',
                'Полный анализ чертежей и спецификаций',
                'Мультимодальность (фото + текст + PDF)',
                'Вывод до 65K токенов — детальные сметы',
                'Для объектов: здания, комплексы, инфраструктура',
            ],
            costLevel: '💎💎💎💎',
            recommended: false,
            useCase: 'Многоэтажные здания, ЖК, ТРЦ, промышленные объекты, инфраструктура',
        },
        maximum: {
            key: 'maximum',
            label: '🚀 Максимум',
            model: 'gemini-2.5-pro',
            contextWindow: '1 000 000 токенов',
            contextTokens: 1000000,
            maxOutput: 65536,
            description: 'Gemini 2.5 Pro — оптимальная мощность. 1М контекст, thinking mode, проверенная стабильность.',
            features: [
                'Thinking Mode (сложные расчёты)',
                'Мультимодальность (фото + чертежи)',
                '1М токенов контекст',
                'Максимальная точность смет',
                'Вывод 65K токенов',
            ],
            costLevel: '💎💎💎',
            recommended: false,
        },
        standard: {
            key: 'standard',
            label: '⚡ Стандарт (рекомендуется)',
            model: 'gemini-2.5-flash',
            contextWindow: '1 000 000 токенов',
            contextTokens: 1000000,
            maxOutput: 8192,
            description: 'Gemini 2.5 Flash — быстрый и экономичный. 1М контекст, мгновенный отклик для типовых смет. Оптимален для большинства задач.',
            features: [
                'Мультимодальность (фото + текст)',
                'Быстрый отклик (< 3 сек)',
                '1М токенов контекст',
                'Экономичная для массовых расчётов',
            ],
            costLevel: '💎',
            recommended: true,
        },
    };

    // ═══════════════════════════════════════════════════════════════════════
    // API Key Management
    // ═══════════════════════════════════════════════════════════════════════

    // ⚠️ Ключ загружается из config.js → window.QAZGOST_CONFIG.geminiApiKey
    const DEFAULT_API_KEY = '';

    function getApiKey() {
        return (window.QAZGOST_CONFIG && window.QAZGOST_CONFIG.geminiApiKey)
            || localStorage.getItem(STORAGE_KEY)
            || DEFAULT_API_KEY;
    }

    function setApiKey(key) {
        localStorage.setItem(STORAGE_KEY, key.trim());
        if (window.QAZGOST_CONFIG) {
            window.QAZGOST_CONFIG.geminiApiKey = key.trim();
        }
        console.log('[GeminiService] 🔑 API key saved');
    }

    function isConfigured() {
        return getApiKey().length > 10;
    }

    /**
     * Get current tariff plan.
     * @returns {'maximum'|'standard'}
     */
    function getTariff() {
        return localStorage.getItem(TARIFF_KEY) || 'standard';
    }

    /**
     * Set tariff plan.
     * @param {'maximum'|'standard'} tariff
     */
    function setTariff(tariff) {
        if (!TARIFF_PLANS[tariff]) {
            console.warn(`[GeminiService] Unknown tariff: ${tariff}. Available: ${Object.keys(TARIFF_PLANS).join(', ')}`);
            return;
        }
        localStorage.setItem(TARIFF_KEY, tariff);
        console.log(`[GeminiService] 🔧 Tariff set to: ${TARIFF_PLANS[tariff].label} (${TARIFF_PLANS[tariff].model})`);
    }

    function getTariffPlans() {
        return { ...TARIFF_PLANS };
    }

    function getModel() {
        const tariff = getTariff();
        return TARIFF_PLANS[tariff]?.model
            || (window.QAZGOST_CONFIG && window.QAZGOST_CONFIG.geminiModel)
            || TARIFF_PLANS.maximum.model;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CONSTRUCTION ANALYSIS PROMPT — специализированный для Казахстана/СНиП
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

## Примеры правильного анализа:
- Описание: "монтаж металлокаркаса ангара 200м2" + Фото стройки → objectType: metal_structure, работы: монтаж колонн, монтаж ферм, монтаж профнастила и т.д.
- Описание: "замена кровли, площадь 150м2" + Фото крыши → objectType: roof_profiled_sheet, работы: демонтаж старой кровли, монтаж профнастила и т.д.
- Описание: "штукатурка стен в квартире 80м2" + Фото стен → objectType: plastering, работы: штукатурка, грунтовка и т.д.

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

## Типы дефектов:
crack (трещина), rust (коррозия), stain (пятно), deformation (деформация), chipping (скол), gap (зазор)

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
        const photoCount = opts.photoCount || (hasPhoto ? 1 : 0);

        // ══════ БЛОК 1: ЗАДАНИЕ (ГЛАВНЫЙ ПРИОРИТЕТ) ══════
        let prompt = `## 🎯 ЗАДАНИЕ ОТ КЛИЕНТА (ГЛАВНЫЙ ПРИОРИТЕТ)\n`;

        if (category) {
            prompt += `\n**КАТЕГОРИЯ РАБОТ:** "${category}"\n⚠️ ВСЕ работы в estimate_items СТРОГО из этой категории! Не подменяй!`;
        }

        if (description) {
            prompt += `\n\n**ОПИСАНИЕ КЛИЕНТА (самое важное):** "${description}"\nИменно это описание определяет КАКИЕ КОНКРЕТНО работы нужны. Извлеки из него:\n- Тип работ (монтаж, демонтаж, ремонт, замена)\n- Материалы (профнастил, металл, бетон, плитка)\n- Размеры если указаны (м2, м3, п.м.)\n- Количество если указано`;
        } else {
            prompt += `\n\n📝 Описание не указано — определи работы по категории и фото.`;
        }

        // ══════ БЛОК 2: ФОТО (ДОПОЛНЕНИЕ) ══════
        if (photoCount > 1) {
            prompt += `\n\n## 📷 ФОТО ОБЪЕКТА — ${photoCount} ракурсов (следуют после текста)\n` +
                `Проанализируй ВСЕ ${photoCount} фото вместе для максимальной точности:\n` +
                `- Сопоставь размеры по всем ракурсам (длина, ширина, высота, площадь)\n` +
                `- Выяви дефекты на каждом фото (трещины, коррозия, деформации)\n` +
                `- Определи материалы и состояние из разных ракурсов\n` +
                `- Для каждого объекта в objects[] и дефекта в defects[] укажи "photo_index": номер фото (1-${photoCount})\n` +
                `❌ НЕ меняй тип работ на основе фото если клиент описал задачу!`;
        } else if (hasPhoto) {
            prompt += `\n\n## 📷 ФОТО ОБЪЕКТА (для уточнения)\nИспользуй фото для:\n- Уточнения РАЗМЕРОВ объекта\n- Определения СОСТОЯНИЯ (дефекты, износ)\n- Проверки МАТЕРИАЛОВ\n❌ НЕ меняй тип работ на основе фото если клиент описал задачу!`;
        } else {
            prompt += `\n\n📷 Фото не предоставлено — работай ТОЛЬКО по описанию и категории.`;
        }

        // ══════ БЛОК 3: СМЕТА ══════
        prompt += `\n\n## 📐 ТРЕБОВАНИЯ К СМЕТЕ\nРегион: ${region} (Казахстан). Цены в тенге (₸).\n\nВерни JSON строго по этой схеме:
{
  "objectType": "тип из списка system prompt, подходящий для '${category || 'auto'}'",
  "confidence": число от 0 до 100,
  "scene_description": "Что нужно сделать по описанию клиента + что видно на фото, 2-3 предложения",
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
      "name": "КОНКРЕТНОЕ название работы на русском из категории '${category || 'auto'}'",
      "unit": "м2|м3|п.м.|шт|кг|т",
      "quantity": число (из описания клиента или по фото),
      "price": число в тенге (реальная рыночная цена Казахстан 2024-2025),
      "category": "${category || 'auto'}"
    }
  ],
  "defects": [],
  "materials_seen": [],
  "dimensions_estimate": { "length_m": null, "width_m": null, "height_m": null, "area_m2": null, "volume_m3": null, "perimeter_m": null },
  "recommendations": [],
  "snip_references": []
}

⚠️ ПРАВИЛА для estimate_items:
1. Генерируй 5-15 КОНКРЕТНЫХ работ, строго по категории "${category || 'определи'}" и описанию клиента
2. Каждая работа — реалистичная цена в тенге (₸) для Казахстана
3. Количество — из описания клиента (если указана площадь/длина) или по фото
4. Названия работ — профессиональные: "Монтаж профнастила С21 стенового", а не "работа 1"`;

        return prompt;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // File → Base64
    // ═══════════════════════════════════════════════════════════════════════

    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                // reader.result = "data:image/jpeg;base64,/9j/..."
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
    // MAIN: Analyze Construction Photo via Gemini
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Конвертирует один объект фото в { base64, mimeType } или null.
     * Поддерживает: File, {file:File}, {dataUrl:string}
     */
    async function _encodePhoto(photo) {
        if (!photo) return null;
        try {
            if (photo instanceof File) {
                return { base64: await fileToBase64(photo), mimeType: getMimeType(photo) };
            } else if (photo.file instanceof File) {
                return { base64: await fileToBase64(photo.file), mimeType: getMimeType(photo.file) };
            } else if (photo.dataUrl) {
                const b64 = dataUrlToBase64(photo.dataUrl);
                const mime = photo.dataUrl.match(/data:(.*?);/)?.[1] || 'image/jpeg';
                return b64 ? { base64: b64, mimeType: mime } : null;
            }
        } catch (e) {
            console.warn('[GeminiService] ⚠️ Failed to encode photo:', e.message);
        }
        return null;
    }

    /**
     * @param {File|{file:File,dataUrl:string}|Array} photo — одно фото или массив фото
     * @param {object} opts
     *   opts.category    — категория работ
     *   opts.description — описание от клиента
     *   opts.region      — регион (default 'almaty')
     *   opts.onProgress  — callback({stage, percent, message})
     * @returns {object|null}
     */
    async function analyzeConstructionPhoto(photo, opts = {}) {
        const apiKey = getApiKey();
        if (!apiKey) {
            console.error('[GeminiService] ❌ No API key configured');
            return { error: true, code: 'NO_API_KEY', message: 'Gemini API ключ не настроен. Укажите ключ в config.js или настройках.' };
        }

        const emit = (stage, percent, message) => {
            if (opts.onProgress) opts.onProgress({ stage, percent, message });
        };

        // ── Нормализуем входные данные: один объект или массив ──
        const photoArray = Array.isArray(photo)
            ? photo
            : (photo ? [photo] : []);

        const totalPhotos = photoArray.length;
        emit('preparing', 5, totalPhotos > 1
            ? `Подготовка ${totalPhotos} фото для Gemini AI...`
            : 'Подготовка фото для Gemini AI...');

        // ── Кодируем все фото параллельно (макс. 8 чтобы не перегрузить) ──
        const MAX_PHOTOS = 8;
        const photosToEncode = photoArray.slice(0, MAX_PHOTOS);
        const encoded = (await Promise.all(photosToEncode.map(p => _encodePhoto(p))))
            .filter(Boolean); // убираем null

        if (encoded.length === 0 && !opts.description && !opts.category) {
            console.error('[GeminiService] ❌ No valid photos, no description, no category');
            return { error: true, code: 'NO_INPUT', message: 'Нет фото, описания или категории для анализа.' };
        }

        console.log(`[GeminiService] Mode: ${encoded.length > 0 ? `${encoded.length} фото` : 'text-only'}, category: ${opts.category || '-'}, desc: ${(opts.description || '').substring(0, 50)}`);

        emit('connecting', 15, 'Подключение к Google Gemini...');

        const model = getModel();

        // ── Собираем parts: TEXT → ФОТО 1 → ФОТО 2 → ... ──
        const contentParts = [
            { text: buildUserPrompt({ ...opts, hasPhoto: encoded.length > 0, photoCount: encoded.length }) }
        ];

        // Добавляем все фото как отдельные inline_data части
        for (let i = 0; i < encoded.length; i++) {
            const { base64, mimeType } = encoded[i];
            if (encoded.length > 1) {
                // Подписываем фото номером чтобы Gemini мог ссылаться
                contentParts.push({ text: `📷 Фото ${i + 1} из ${encoded.length}:` });
            }
            contentParts.push({
                inline_data: { mime_type: mimeType, data: base64 }
            });
        }

        const requestBody = {
            model: model, // Worker использует это поле для выбора модели
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [
                { parts: contentParts }
            ],
            generationConfig: {
                temperature: 0.2,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        // Выбираем URL: через Worker (безопасно) или напрямую
        // Попытка 1: Worker proxy, Попытка 2: прямой вызов Gemini API
        const workerUrl = `${WORKER_URL}/api/gemini/generate`;
        const directUrl = `${API_URL}/${model}:generateContent?key=${apiKey}`;
        const fetchUrls = USE_WORKER_PROXY
            ? [workerUrl, directUrl]  // Worker first, direct fallback
            : [directUrl];

        // Retry logic: try each URL endpoint (Worker → Direct)
        const _startTime = Date.now();
        let lastError;
        for (let urlIdx = 0; urlIdx < fetchUrls.length; urlIdx++) {
            const fetchUrl = fetchUrls[urlIdx];
            const isWorker = fetchUrl.includes('workers.dev');
            const label = isWorker ? 'Worker Proxy' : 'Direct API';

            try {
                emit('analyzing', 30 + urlIdx * 20, urlIdx === 0
                    ? '🧠 Gemini анализирует фото...'
                    : '🔄 Переключение на прямой API...');

                console.log(`[GeminiService] Trying ${label}: ${fetchUrl.substring(0, 60)}...`);

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 60000);

                const response = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    const errMsg = errorData.error?.message || `HTTP ${response.status}`;
                    throw new Error(`${label}: ${errMsg}`);
                }

                const data = await response.json();

                emit('parsing', 80, 'Обработка результатов...');

                // Extract text from Gemini response
                // Worker wraps: { ok: true, candidates: [...] }
                // Direct API:   { candidates: [...] }
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (!text) {
                    console.warn(`[GeminiService] ${label}: No text in response. Keys:`, Object.keys(data));
                    throw new Error(`${label}: Empty response from Gemini (no candidates text)`);
                }

                // Parse JSON (Gemini should return clean JSON thanks to responseMimeType)
                let result;
                try {
                    result = JSON.parse(text);
                } catch {
                    // Try to extract JSON from markdown code block
                    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
                    if (jsonMatch) {
                        result = JSON.parse(jsonMatch[1]);
                    } else {
                        // Try to find JSON object in text
                        const braceMatch = text.match(/\{[\s\S]*\}/);
                        if (braceMatch) {
                            result = JSON.parse(braceMatch[0]);
                        } else {
                            console.error(`[GeminiService] ${label}: Unparseable response:`, text.substring(0, 300));
                            throw new Error('Could not parse Gemini response as JSON');
                        }
                    }
                }

                // Track processing time
                result._processing_time_ms = Date.now() - _startTime;

                // Validate result has estimate_items
                if (!result.estimate_items || result.estimate_items.length === 0) {
                    console.warn(`[GeminiService] ⚠️ Gemini returned 0 estimate_items, objectType: ${result.objectType}`);
                }

                emit('done', 100, `✅ Анализ Gemini завершён (${label})`);

                console.log(`[GeminiService] ✅ Analysis complete via ${label}: objectType=${result.objectType}, ` +
                    `items=${result.estimate_items?.length || 0}, objects=${result.objects?.length || 0}`);

                return result;

            } catch (e) {
                lastError = e;
                console.warn(`[GeminiService] ${label} failed:`, e.message);
                if (urlIdx < fetchUrls.length - 1) {
                    console.log('[GeminiService] Falling back to next endpoint...');
                    await new Promise(r => setTimeout(r, 1000));
                }
            }
        }

        console.error('[GeminiService] ❌ All attempts failed:', lastError?.message);
        emit('error', 0, `Ошибка Gemini: ${lastError?.message}`);
        const code = lastError?.name === 'AbortError' ? 'TIMEOUT'
            : lastError?.message?.includes('HTTP') ? 'NETWORK'
            : lastError?.message?.includes('parse') || lastError?.message?.includes('JSON') ? 'PARSE_ERROR'
            : 'UNKNOWN';
        return { error: true, code, message: lastError?.message || 'Все попытки подключения к Gemini не удались' };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Normalize Gemini response → AIService contract format
    // ═══════════════════════════════════════════════════════════════════════

    /** Normalize confidence to 0-1 scale (Gemini returns 0-100) */
    function _toConfidence01(val) {
        if (val == null) return 0.5;
        return val > 1 ? val / 100 : val;
    }

    /**
     * Convert Gemini structured response to the format expected by
     * photoEstimateModule.js and other consumers of AIService.analyze()
     */
    function normalizeToAIServiceFormat(geminiResult) {
        if (!geminiResult) return null;

        // Map objects to detection format
        const objects = (geminiResult.objects || []).map((obj, idx) => ({
            class_name: obj.class_name || geminiResult.objectType || 'generic',
            confidence: _toConfidence01(obj.confidence) || _toConfidence01(geminiResult.confidence) || 0.7,
            bbox: [0, 0, 0, 0], // Gemini doesn't return pixel coordinates
            area_px: 0,
            width: obj.estimated_dimensions?.width_m || 0,
            height: obj.estimated_dimensions?.height_m || 0,
            description_ru: obj.description_ru || '',
            photo_index: obj.photo_index || null,
            estimated_dimensions: obj.estimated_dimensions || {},
            source: 'gemini'
        }));

        // Map defects
        const defectItems = (geminiResult.defects || []).map((def, idx) => ({
            type: def.type || 'unknown',
            severity: def.severity || 'low',
            confidence: def.severity === 'high' ? 0.9 : def.severity === 'medium' ? 0.7 : 0.5,
            description_ru: def.description_ru || '',
            recommendation: def.recommendation || '',
            urgency: def.urgency || 'low',
            bbox: [0, 0, 0, 0],
            source: 'gemini'
        }));

        // Map estimate_items from Gemini → match renderServerEstimateSection field names
        const estimateItems = (geminiResult.estimate_items || []).map((item, idx) => {
            const qty = item.quantity || 1;
            const price = item.unit_price || item.price || 0;
            const total = item.total_price || item.total || (qty * price);
            return {
                work_name: item.name || item.work_name || 'Работа',
                name: item.name || item.work_name || 'Работа',
                unit: item.unit || 'шт',
                quantity: qty,
                unit_price: price,
                price: price,
                total_price: total,
                total: total,
                labor_hours: item.labor_hours || null,
                price_source: item.price_source || 'gemini',
                category: item.category || geminiResult.objectType || 'generic',
                source: 'gemini'
            };
        });
        const estimateTotal = estimateItems.reduce((sum, item) => sum + item.total_price, 0);

        return {
            // Objects (detections)
            objects: objects,

            // Defects
            defects_detected: {
                total: defectItems.length,
                items: defectItems
            },

            // Scene description
            scene_description: geminiResult.scene_description || '',

            // Object type
            objectType: geminiResult.objectType || 'generic',
            object_type: geminiResult.objectType || 'generic',

            // Confidence
            confidence: geminiResult.confidence || 50,

            // Materials
            materials_seen: geminiResult.materials_seen || [],

            // Dimensions
            dimensions: geminiResult.dimensions_estimate || {},

            // Estimate items (NEW: directly from Gemini)
            estimate_items: estimateItems,
            estimate_total: estimateTotal,

            // Scale info (Gemini estimates, not calibrated)
            scale_calibrated: false,
            scale_factor: null,
            scale_method: 'gemini_estimate',

            // Construction stage
            construction_stage: geminiResult.construction_stage || 'unknown',

            // Recommendations
            recommendations: geminiResult.recommendations || [],
            snip_references: geminiResult.snip_references || [],

            // Pipeline metadata
            success: true,
            sessionStatus: 'DONE_ESTIMATE',
            object_count: objects.length,
            processing_time_ms: geminiResult._processing_time_ms || 0,
            ai_backend: 'gemini',
            model: getModel(),

            // For estimator compatibility
            detected_objects: objects,
            qwen_result: {
                objectType: geminiResult.objectType || 'generic',
                confidence: geminiResult.confidence || 50,
                scene_description: geminiResult.scene_description || '',
                materials_seen: geminiResult.materials_seen || [],
                dimensions_estimate: geminiResult.dimensions_estimate || {},
                objects: objects
            },

            // Plan for work items display
            plan: {
                work_items: estimateItems,
                explanation: geminiResult.scene_description || ''
            },

            // Raw Gemini result
            _raw: geminiResult
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Generic generateContent — for orchestrator compatibility
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Generic method, compatible with ChatGptService.generateContent.
     * Used by PhotoEstimateOrchestrator._callAI.
     * @param {Array} parts — [{ text }, { inlineData: { data, mimeType } }]
     * @returns {string|null} — response text
     */
    async function generateContent(parts) {
        const apiKey = getApiKey();
        if (!apiKey) return null;

        // Convert orchestrator parts format to Gemini API format
        const contentParts = [];
        for (const part of parts) {
            if (part.text) {
                contentParts.push({ text: part.text });
            }
            if (part.inlineData) {
                contentParts.push({
                    inline_data: {
                        mime_type: part.inlineData.mimeType,
                        data: part.inlineData.data
                    }
                });
            }
        }

        const model = getModel();
        const workerUrl = `${WORKER_URL}/api/gemini/generate`;
        const directUrl = `${API_URL}/${model}:generateContent?key=${apiKey}`;
        const urls = USE_WORKER_PROXY ? [workerUrl, directUrl] : [directUrl];

        const requestBody = {
            model: model,
            system_instruction: {
                parts: [{ text: SYSTEM_PROMPT }]
            },
            contents: [{ parts: contentParts }],
            generationConfig: {
                temperature: 0.2,
                topP: 0.8,
                topK: 40,
                maxOutputTokens: 4096,
                responseMimeType: 'application/json'
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
            ]
        };

        for (const url of urls) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 60000);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody),
                    signal: controller.signal
                });
                clearTimeout(timeout);

                if (!response.ok) {
                    console.warn(`[GeminiService] generateContent ${url.includes('workers') ? 'Worker' : 'Direct'} failed: HTTP ${response.status}`);
                    continue;
                }
                const data = await response.json();
                return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
            } catch (e) {
                console.warn(`[GeminiService] generateContent error (${url.includes('workers') ? 'Worker' : 'Direct'}):`, e.message);
            }
        }
        console.error('[GeminiService] generateContent: all endpoints failed');
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Quick test — validate API key
    // ═══════════════════════════════════════════════════════════════════════

    async function testConnection() {
        const apiKey = getApiKey();
        if (!apiKey) return { ok: false, error: 'No API key' };

        try {
            const model = getModel();
            const url = `${API_URL}/${model}:generateContent?key=${apiKey}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Ответь одним словом: работаешь?' }] }],
                    generationConfig: { maxOutputTokens: 10 }
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

    window.GeminiService = {
        analyzeConstructionPhoto,
        normalizeToAIServiceFormat,
        generateContent,
        isConfigured,
        getApiKey,
        setApiKey,
        testConnection,
        getModel,
        // Тарифные планы
        getTariff,
        setTariff,
        getTariffPlans,
        TARIFF_PLANS,
        // Expose for debugging
        _buildUserPrompt: buildUserPrompt,
        _SYSTEM_PROMPT: SYSTEM_PROMPT
    };

    const _t = TARIFF_PLANS[getTariff()];
    console.log(`✅ [GeminiService] Loaded — тариф: ${_t.label} (${_t.model}, ${_t.contextWindow}), configured: ${isConfigured()}`);
})();
