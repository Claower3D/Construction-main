// ============================================================
// aiServiceBridge.js — AIService Bridge (Frontend → AI Analysis)
// QAZGOST AI v3.0
//
// ARCHITECTURE: Multi-Provider with Fallback Chain
//   Priority: User preference → Gemini → ChatGPT → Local Backend
//   1. If user set preferred provider → use it
//   2. Else if GeminiService is configured → use Google Gemini API
//   3. Else if ChatGptService is configured → use OpenAI ChatGPT
//   4. Else if local ai-service is online → use localhost:8001
//   5. Else → offline
//
// Provides window.AIService = {
//   isAvailable()          — checks if any AI backend is available
//   getMode()              — returns 'gemini' | 'chatgpt' | 'local' | 'offline'
//   setPreferredProvider() — force specific provider
//   analyze(file, opts)    — photo → AI → returns detections
//   analyzeFullPipeline()  — full pipeline with progress
//   CLASS_COLORS           — color map for detection overlays
//   CLASS_NAMES_RU         — Russian labels for detected classes
// }
// ============================================================

(function () {
    'use strict';

    const AI_BASE = (window.QAZGOST_CONFIG && window.QAZGOST_CONFIG.aiBase) || 'http://localhost:8001';
    const HEALTH_TTL = 30000; // cache health status for 30s
    let _lastHealthCheck = 0;
    let _isAvailable = false;

    // ── Detection class colors (for Canvas overlay) ──
    const CLASS_COLORS = {
        foundation_strip: '#FF6B35',
        foundation_slab: '#FF8C42',
        foundation_pile: '#FFA500',
        wall_brick: '#E74C3C',
        wall_block: '#C0392B',
        wall_concrete: '#95A5A6',
        slab: '#7F8C8D',
        floor_screed: '#BDC3C7',
        pipe_pvc: '#3498DB',
        pipe_hdpe: '#2980B9',
        pipe_metal: '#1ABC9C',
        rebar: '#8E44AD',
        trench: '#D35400',
        excavator: '#F39C12',
        crane: '#27AE60',
        manhole: '#2C3E50',
        person: '#16A085',
        measuring_tape: '#E67E22',
        aruco_marker: '#9B59B6',
        crack: '#E74C3C',
        stain: '#F1C40F',
        rust: '#D35400',
    };

    // ── Russian labels ──
    const CLASS_NAMES_RU = {
        foundation_strip: 'Ленточный фундамент',
        foundation_slab: 'Плитный фундамент',
        foundation_pile: 'Свайный фундамент',
        wall_brick: 'Кирпичная кладка',
        wall_block: 'Блочная кладка',
        wall_concrete: 'Бетонная стена',
        slab: 'Перекрытие',
        floor_screed: 'Стяжка пола',
        pipe_pvc: 'Труба ПВХ',
        pipe_hdpe: 'Труба ПНД',
        pipe_metal: 'Металлическая труба',
        rebar: 'Арматура',
        trench: 'Траншея',
        excavator: 'Экскаватор',
        crane: 'Кран',
        manhole: 'Колодец',
        person: 'Человек',
        measuring_tape: 'Рулетка',
        aruco_marker: 'ArUco маркер',
        crack: 'Трещина',
        stain: 'Пятно/потёк',
        rust: 'Коррозия',
    };

    // ═══════════════════════════════════════════════════════════════════════
    // Mode detection — which AI backend to use?
    // ═══════════════════════════════════════════════════════════════════════

    const PREF_KEY = 'qazgost_ai_provider';

    function _isGeminiConfigured() {
        return !!(window.GeminiService && window.GeminiService.isConfigured());
    }

    function _isChatGptConfigured() {
        return !!(window.ChatGptService && window.ChatGptService.isConfigured());
    }

    /**
     * Set preferred AI provider (persisted in localStorage).
     * @param {'gemini'|'chatgpt'|'auto'} provider
     */
    function setPreferredProvider(provider) {
        localStorage.setItem(PREF_KEY, provider);
        console.log(`[AIService] 🔧 Preferred provider set to: ${provider}`);
    }

    function getPreferredProvider() {
        return localStorage.getItem(PREF_KEY) || 'auto';
    }

    /**
     * Returns current AI backend mode.
     * @returns {'gemini'|'chatgpt'|'local'|'offline'}
     */
    function getMode() {
        const pref = getPreferredProvider();

        // User explicitly chose a provider
        if (pref === 'gemini' && _isGeminiConfigured()) return 'gemini';
        if (pref === 'chatgpt' && _isChatGptConfigured()) return 'chatgpt';

        // Auto: Gemini → ChatGPT → local
        if (_isGeminiConfigured()) return 'gemini';
        if (_isChatGptConfigured()) return 'chatgpt';
        if (_isAvailable) return 'local';
        return 'offline';
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Health check — is AI backend alive?
    // ═══════════════════════════════════════════════════════════════════════

    async function isAvailable() {
        // Gemini or ChatGPT is always available if configured
        if (_isGeminiConfigured()) {
            _isAvailable = true;
            _lastHealthCheck = Date.now();
            console.log(`[AIService] Health: 🟢 Gemini API (${window.GeminiService.getModel()})`);
            return true;
        }
        if (_isChatGptConfigured()) {
            _isAvailable = true;
            _lastHealthCheck = Date.now();
            console.log(`[AIService] Health: 🟢 ChatGPT API (${window.ChatGptService.getModel()})`);
            return true;
        }

        // Otherwise check local backend
        if (Date.now() - _lastHealthCheck < HEALTH_TTL) return _isAvailable;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            const res = await fetch(`${AI_BASE}/api/v1/health`, { signal: controller.signal });
            clearTimeout(timeout);
            _isAvailable = res.ok;
        } catch {
            _isAvailable = false;
        }
        _lastHealthCheck = Date.now();
        console.log(`[AIService] Health: ${_isAvailable ? '🟢 local' : '🔴 offline'} (${AI_BASE})`);
        return _isAvailable;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Analyze photo — Gemini-first, local backend fallback
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * @param {File} file — photo file
     * @param {object} opts — { region, generateEstimate, confidence, textPrompt }
     * @returns {object} — { objects, defects, scene_description, measurements, ... }
     */
    async function analyze(file, opts = {}) {
        const mode = getMode();

        // ── GEMINI PATH ──
        if (mode === 'gemini' || (_isGeminiConfigured() && mode !== 'chatgpt')) {
            console.log('[AIService] 🌐 Using Gemini API for analysis');
            const geminiResult = await window.GeminiService.analyzeConstructionPhoto(file, {
                category: opts.category || opts.textPrompt || '',
                description: opts.description || opts.textPrompt || '',
                region: opts.region || 'almaty'
            });
            if (geminiResult && !geminiResult.error) {
                return window.GeminiService.normalizeToAIServiceFormat(geminiResult);
            }
            console.warn('[AIService] Gemini failed:', geminiResult?.message || 'no result', ', trying ChatGPT...');
        }

        // ── CHATGPT PATH ──
        if (mode === 'chatgpt' || _isChatGptConfigured()) {
            console.log('[AIService] 🤖 Using ChatGPT API for analysis');
            const gptResult = await window.ChatGptService.analyzeConstructionPhoto(file, {
                category: opts.textPrompt || opts.category || '',
                description: opts.textPrompt || '',
                region: opts.region || 'almaty'
            });
            if (gptResult) {
                return window.ChatGptService.normalizeToAIServiceFormat(gptResult);
            }
            console.warn('[AIService] ChatGPT failed, trying local backend...');
        }

        // ── LOCAL BACKEND PATH ──
        return await _analyzeLocal(file, opts);
    }

    /** Original local backend analysis (POST /api/v1/analyze) */
    async function _analyzeLocal(file, opts = {}) {
        const formData = new FormData();
        formData.append('file', file);

        const params = new URLSearchParams();
        if (opts.region) params.append('region', opts.region);
        if (opts.generateEstimate) params.append('generate_estimate', 'true');
        if (opts.confidence) params.append('confidence', opts.confidence);
        if (opts.textPrompt) params.append('custom_text_prompt', opts.textPrompt);

        const queryString = params.toString();
        const url = `${AI_BASE}/api/v1/analyze${queryString ? '?' + queryString : ''}`;

        let lastError;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 45000 + attempt * 15000);
                const res = await fetch(url, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal,
                });
                clearTimeout(timeout);

                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();

                // Normalize response
                return {
                    objects: normalizeDetections(data),
                    defects_detected: data.defects || { total: 0, items: [] },
                    scene_description: data.qwen_result?.scene_description || data.scene_description || '',
                    objectType: data.qwen_result?.objectType || data.object_type || 'generic',
                    confidence: data.qwen_result?.confidence || data.confidence || 50,
                    materials_seen: data.qwen_result?.materials_seen || [],
                    dimensions: data.qwen_result?.dimensions_estimate || data.measurements || {},
                    scale_calibrated: data.scale_calibrated || false,
                    scale_factor: data.scale_factor || null,
                    scale_method: data.scale_method || 'unknown',
                    estimate_items: data.estimate_items || [],
                    estimate_total: data.estimate_total || 0,
                    price_db_stats: data.price_db_stats || null,
                    _raw: data,
                };
            } catch (e) {
                lastError = e;
                if (attempt < 1) {
                    console.warn(`[AIService] Attempt ${attempt + 1} failed:`, e.message);
                    await new Promise(r => setTimeout(r, 2000));
                }
            }
        }
        console.error('[AIService] analyze failed:', lastError?.message);
        return null;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Normalize detections from various backend formats
    // ═══════════════════════════════════════════════════════════════════════

    function normalizeDetections(data) {
        const objects = [];

        // From pipeline detected_objects
        if (data.detected_objects && Array.isArray(data.detected_objects)) {
            data.detected_objects.forEach(det => {
                objects.push({
                    class_name: det.class_name || det.label || 'unknown',
                    confidence: det.confidence || 0.5,
                    bbox: det.bbox || det.box || [0, 0, 0, 0],
                    area_px: det.area_px || 0,
                    width: det.width || (det.bbox ? det.bbox[2] - det.bbox[0] : 0),
                    height: det.height || (det.bbox ? det.bbox[3] - det.bbox[1] : 0),
                    source: det.source || 'rfdetr',
                });
            });
        }

        // From Qwen VLM objects
        if (data.qwen_result?.objects && Array.isArray(data.qwen_result.objects)) {
            data.qwen_result.objects.forEach(obj => {
                // Avoid duplicates
                const existing = objects.find(o =>
                    o.class_name === obj.class_name && Math.abs(o.confidence - (obj.confidence || 0.7)) < 0.1
                );
                if (!existing) {
                    objects.push({
                        class_name: obj.class_name || obj.type || 'detected',
                        confidence: obj.confidence || 0.7,
                        bbox: obj.bbox || [0, 0, 0, 0],
                        area_px: obj.area_px || 0,
                        width: obj.width || 0,
                        height: obj.height || 0,
                        source: 'qwen_vlm',
                    });
                }
            });
        }

        return objects;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Poll Health — background monitoring
    // ═══════════════════════════════════════════════════════════════════════

    let _pollTimer = null;

    /**
     * Start polling AI server health at interval.
     * @param {number} intervalMs — poll interval (default 30s)
     * @param {function} onStatusChange — callback(isOnline: boolean)
     */
    function pollHealth(intervalMs = 30000, onStatusChange = null) {
        if (_pollTimer) clearInterval(_pollTimer);

        const check = async () => {
            const prev = _isAvailable;
            await isAvailable();
            if (onStatusChange && prev !== _isAvailable) {
                onStatusChange(_isAvailable);
            }
        };

        check(); // immediate first check
        _pollTimer = setInterval(check, intervalMs);
        console.log(`[AIService] 🔄 Health polling started (every ${intervalMs / 1000}s)`);
    }

    function stopPollHealth() {
        if (_pollTimer) {
            clearInterval(_pollTimer);
            _pollTimer = null;
            console.log('[AIService] ⏹️ Health polling stopped');
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Analyze with progress callback
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Analyze photo with progress stages callback.
     * @param {File} file
     * @param {object} opts — same as analyze()
     * @param {function} onProgress — callback({ stage, percent, message })
     * @returns {object|null}
     */
    async function analyzeWithProgress(file, opts = {}, onProgress = null) {
        const emit = (stage, percent, message) => {
            if (onProgress) onProgress({ stage, percent, message });
        };

        const mode = getMode();
        emit('upload', 5, `Подготовка фото... (${mode === 'gemini' ? '🌐 Gemini' : '🖥️ Локальный сервер'})`);

        // Check connection first
        const online = await isAvailable();
        if (!online) {
            emit('error', 0, 'AI сервер недоступен');
            return null;
        }
        emit('connect', 15, mode === 'gemini'
            ? 'Подключение к Google Gemini...'
            : 'Подключение к AI серверу...');

        emit('analyze', 30, mode === 'gemini'
            ? '🧠 Gemini анализирует фото...'
            : 'Загрузка фото и запуск анализа...');

        // Run actual analysis (routes through Gemini or local)
        const result = await analyze(file, opts);

        if (!result) {
            emit('error', 0, 'Ошибка анализа');
            return null;
        }

        emit('detect', 60, `Обнаружено объектов: ${result.objects?.length || 0}`);
        emit('estimate', 80, 'Формирование сметы...');

        // Cache result
        setLastAnalysisCache(result);

        emit('done', 100, `Анализ завершён (${mode})`);
        return result;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Full Pipeline — Server-First Analysis (IntentContract)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Send photos + description + category → get full IntentContract JSON.
     * This is the PRIMARY analysis method in server-first architecture.
     * All intelligence is on the server; frontend just renders.
     *
     * @param {object} ctx
     *   ctx.photos       — [{file: File, dataUrl: string}]
     *   ctx.description  — user text description
     *   ctx.category     — work category (e.g. 'interior', 'foundation')
     *   ctx.region       — region for pricing (default 'almaty')
     *   ctx.onProgress   — callback({stage, percent, message})
     *
     * @returns {object|null} — Full IntentContract JSON from server:
     *   { intent, detected_objects, defects, scale_*, estimate_*, plan, scenarios,
     *     sessionStatus, accuracy, nextActions, questions, step_timings, warnings }
     */
    async function analyzeFullPipeline(ctx = {}) {
        const emit = (stage, percent, message) => {
            if (ctx.onProgress) ctx.onProgress({ stage, percent, message });
        };

        // ── Multi-Pass Engine delegation (v4.0) ──
        if (window.MultiPassEstimateEngine && window.EstimateSchemas && ctx.analysisMode) {
            try {
                console.log(`[AIService] → Delegating to MultiPassEstimateEngine (mode: ${ctx.analysisMode})`);
                const provider = getMode();  // inherit current provider
                const report = await window.MultiPassEstimateEngine.run({
                    photos: ctx.photos || [],
                    description: ctx.description || '',
                    category: ctx.category || '',
                    context: ctx.context || {},
                    forceMode: ctx.analysisMode,
                    provider: provider !== 'offline' ? provider : 'gemini',
                }, (step, percent, message) => {
                    emit(step, percent, message);
                });

                if (report && report.finalItems && report.finalItems.length > 0) {
                    // Convert EstimateReport → AIService normalized format
                    const normalized = _convertMultiPassToNormalized(report, ctx);
                    setLastAnalysisCache(normalized);
                    emit('done', 100, `✅ Multi-Pass анализ завершён (${report.metadata?.passCount || 0} проходов)`);
                    return normalized;
                }
            } catch (mpErr) {
                console.warn('[AIService] MultiPass failed, falling back to standard pipeline:', mpErr.message);
            }
        }

        const mode = getMode();
        const modeLabel = mode === 'gemini' ? '🌐 Gemini' : mode === 'chatgpt' ? '🤖 ChatGPT' : '🖥️ Сервер';
        emit('checking', 5, `${modeLabel} — проверка подключения...`);

        const online = await isAvailable();
        if (!online) {
            emit('error', 0, 'AI сервер недоступен. Настройте Gemini/ChatGPT API ключ или запустите ai-service.');
            return null;
        }

        const hasPhotos = ctx.photos && ctx.photos.length > 0;
        const hasDescription = ctx.description && ctx.description.trim().length > 0;

        // ── GEMINI PATH ──
        if ((mode === 'gemini' || (mode !== 'chatgpt' && _isGeminiConfigured())) && (hasPhotos || hasDescription)) {
            const photoCount = hasPhotos ? ctx.photos.length : 0;
            emit('uploading', 15, photoCount > 1
                ? `🌐 Подготовка ${photoCount} фото для Gemini...`
                : hasPhotos ? '🌐 Подготовка фото для Gemini...' : '🌐 Отправка описания в Gemini...');

            // Передаём ВСЕ фото — GeminiService принимает массив
            const photosToSend = hasPhotos ? ctx.photos : null;

            try {
                const geminiResult = await window.GeminiService.analyzeConstructionPhoto(photosToSend, {
                    category: ctx.category || '',
                    description: ctx.description || '',
                    region: ctx.region || 'almaty',
                    onProgress: ({ stage, percent, message }) => {
                        const mappedPercent = 15 + Math.round(percent * 0.75);
                        emit(stage, mappedPercent, message);
                    }
                });

                if (geminiResult && !geminiResult.error) {
                    const normalized = window.GeminiService.normalizeToAIServiceFormat(geminiResult);

                    // ── Resolve AI prices with real databases ──
                    if (window.GeminiEstimateResolver && normalized.estimate_items && normalized.estimate_items.length > 0) {
                        try {
                            const objType = normalized.objectType || ctx.category || 'generic';
                            normalized.estimate_items = window.GeminiEstimateResolver.resolveItems(normalized.estimate_items, objType);
                            normalized.estimate_total = normalized.estimate_items.reduce((s, it) => s + (it.total_price || 0), 0);
                            normalized._pricesResolved = true;
                            const dbCount = normalized.estimate_items.filter(i => i.price_source === 'database' || i.price_source === 'price_kz').length;
                            console.log(`[AIService] 💰 PriceResolver: ${dbCount}/${normalized.estimate_items.length} items matched to real prices`);
                        } catch (resolveErr) {
                            console.warn('[AIService] GeminiEstimateResolver error:', resolveErr.message);
                        }
                    }

                    setLastAnalysisCache(normalized);
                    emit('done', 100, `✅ Анализ завершён (${photoCount > 1 ? photoCount + ' фото · ' : ''}Gemini ${window.GeminiService.getModel()})`);
                    console.log(`[AIService] ✅ Gemini pipeline: objectType=${normalized.objectType}, photos=${photoCount}`);
                    return normalized;
                }
            } catch (geminiErr) {
                console.warn('[AIService] Gemini pipeline error:', geminiErr.message);
            }
            const geminiErrMsg = geminiResult?.error ? ` (${geminiResult.code}: ${geminiResult.message})` : '';
            console.warn(`[AIService] Gemini pipeline failed${geminiErrMsg}, trying ChatGPT...`);
        }

        // ── CHATGPT PATH ──
        if ((mode === 'chatgpt' || _isChatGptConfigured()) && (hasPhotos || hasDescription)) {
            emit('uploading', 15, hasPhotos ? '🤖 Подготовка фото для ChatGPT...' : '🤖 Отправка описания в ChatGPT...');

            // ChatGptService.analyzeConstructionPhoto accepts: File, {file:File}, {dataUrl:string}, or null
            let mainPhoto = null;
            if (hasPhotos) {
                const p = ctx.photos[0];
                if (p instanceof File) {
                    mainPhoto = p;
                } else if (p.file instanceof File) {
                    mainPhoto = p;
                } else if (p.dataUrl) {
                    mainPhoto = { dataUrl: p.dataUrl };
                }
            }

            try {
                const gptResult = await window.ChatGptService.analyzeConstructionPhoto(mainPhoto, {
                    category: ctx.category || '',
                    description: ctx.description || '',
                    region: ctx.region || 'almaty',
                    onProgress: ({ stage, percent, message }) => {
                        const mappedPercent = 15 + Math.round(percent * 0.75);
                        emit(stage, mappedPercent, message);
                    }
                });

                if (gptResult) {
                    const normalized = window.ChatGptService.normalizeToAIServiceFormat(gptResult);

                    // ── Flag multi-photo degradation ──
                    if (hasPhotos && ctx.photos.length > 1) {
                        normalized._multiPhotoReduced = true;
                        normalized._photosUsed = 1;
                        normalized._photosSent = ctx.photos.length;
                        console.warn(`[AIService] ⚠️ ChatGPT: used 1/${ctx.photos.length} photos (multi-photo not supported)`);
                    }

                    setLastAnalysisCache(normalized);
                    emit('done', 100, `✅ Анализ завершён (ChatGPT ${window.ChatGptService.getModel()})`);
                    console.log(`[AIService] ✅ ChatGPT pipeline: objectType=${normalized.objectType}, objects=${normalized.object_count}`);
                    return normalized;
                }
            } catch (gptErr) {
                console.warn('[AIService] ChatGPT pipeline error:', gptErr.message);
            }
            console.warn('[AIService] ChatGPT pipeline failed, trying local backend...');
        }

        // ── LOCAL BACKEND PATH ──
        emit('uploading', 15, 'Загрузка данных на сервер...');

        const formData = new FormData();

        // Attach photos (first photo as main file for /analyze endpoint)
        if (ctx.photos && ctx.photos.length > 0) {
            const mainPhoto = ctx.photos[0];
            const file = mainPhoto.file || _dataUrlToFile(mainPhoto.dataUrl, 'photo.jpg');
            if (file) formData.append('file', file); // 'file' matches FastAPI param name
        }

        // Query params
        const params = new URLSearchParams();
        params.append('region', ctx.region || 'almaty');
        params.append('generate_estimate', 'true');

        if (ctx.description) {
            params.append('custom_text_prompt', ctx.description);
        }
        if (ctx.category) {
            params.append('category', ctx.category);
        }

        const url = `${AI_BASE}/api/v1/analyze?${params.toString()}`;

        emit('analyzing', 30, 'AI анализирует фото...');

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 300000); // 5 min for Qwen VLM
            const res = await fetch(url, {
                method: 'POST',
                body: formData,
                signal: controller.signal,
            });
            clearTimeout(timeout);

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            emit('processing', 70, 'Формирование сметы и плана...');

            const data = await res.json();

            if (!data.success) {
                emit('error', 0, data.error || 'Ошибка анализа');
                return null;
            }

            // ── Override estimate with category-matched items from WorkRegistry ──
            if (ctx.category && window.WorkRegistry) {
                console.log(`[AIService] Overriding backend estimate with category: ${ctx.category}`);
                const categoryItems = _buildEstimateFromCategory(ctx.category, ctx.description, data);
                if (categoryItems && categoryItems.length > 0) {
                    data.estimate_items = categoryItems;
                    data.estimate_total = categoryItems.reduce((s, it) => s + (it.total_price || 0), 0);
                    // Override objectType based on category
                    const categoryTypeMap = {
                        'metal_structures': 'metal_structure',
                        'Металлоконструкции': 'metal_structure',
                        'roofing': 'roof_profiled_sheet',
                        'Кровля': 'roof_profiled_sheet',
                        'foundation': 'foundation_strip',
                        'Фундамент': 'foundation_strip',
                        'walls': 'wall_brick',
                        'Стены': 'wall_brick',
                        'interior': 'interior',
                        'Отделка': 'interior',
                        'electrical': 'electrical',
                        'Электромонтаж': 'electrical',
                        'plumbing': 'plumbing',
                        'Сантехника': 'plumbing',
                    };
                    if (categoryTypeMap[ctx.category]) {
                        data.intent = data.intent || {};
                        data.intent.objectType = categoryTypeMap[ctx.category];
                    }
                    console.log(`[AIService] ✅ Category override: ${categoryItems.length} items, total=${data.estimate_total}`);
                }
            }

            emit('done', 100, `Анализ завершён: ${data.sessionStatus}`);

            // Cache
            setLastAnalysisCache(data);

            console.log(
                `[AIService] ✅ Full pipeline: status=${data.sessionStatus}, ` +
                `objects=${data.object_count}, estimate=${data.estimate_total}, ` +
                `time=${data.processing_time_ms}ms`
            );

            return data;
        } catch (e) {
            console.error('[AIService] analyzeFullPipeline failed:', e.message);
            
            // ── FALLBACK: generate estimate from WorkRegistry when both Gemini and backend fail ──
            if (ctx.category && window.WorkRegistry) {
                console.log(`[AIService] Using WorkRegistry fallback for category: ${ctx.category}`);
                const fallbackItems = _buildEstimateFromCategory(ctx.category, ctx.description, null);
                if (fallbackItems && fallbackItems.length > 0) {
                    const fallbackTotal = fallbackItems.reduce((s, it) => s + (it.total_price || 0), 0);
                    emit('done', 100, `Оценка по справочнику (${ctx.category})`);
                    return {
                        success: true,
                        sessionStatus: 'DONE_ESTIMATE',
                        ai_backend: 'workregistry_fallback',
                        objectType: ctx.category,
                        object_type: ctx.category,
                        intent: { objectType: ctx.category },
                        detected_objects: [],
                        object_count: 0,
                        estimate_items: fallbackItems,
                        estimate_total: fallbackTotal,
                        accuracy: { overallConfidence: 0.4 },
                        processing_time_ms: 0,
                        pipeline_version: '3.0',
                        price_db_stats: { total_items: fallbackItems.length, db_prices_used: fallbackItems.length, hardcoded_prices: 0 },
                        qwen_result: { region: ctx.region || 'almaty' },
                    };
                }
            }
            
            emit('error', 0, `Ошибка: ${e.message}`);
            return null;
        }
    }

    /**
     * Build estimate items from WorkRegistry based on user's selected category.
     * Uses category → WorkRegistry lookup to find relevant works with real prices.
     */
    function _buildEstimateFromCategory(category, description, serverData) {
        const WR = window.WorkRegistry;
        if (!WR) return null;

        let works = [];
        
        // WorkRegistry API:
        //   getAllWorksForCategory(label: string) — by Russian label like 'Металлоконструкции'
        //   getWorksByGroup(key: string) — by group key like 'metalwork'
        //   search(query: string) — text search

        // 1. Try by Russian label (this is what the UI passes as category)
        if (WR.getAllWorksForCategory) {
            works = WR.getAllWorksForCategory(category) || [];
            console.log(`[AIService] WorkRegistry.getAllWorksForCategory('${category}'): ${works.length} works`);
        }
        
        // 2. Try by group key (if category is a key like 'metalwork')
        if (works.length === 0 && WR.getWorksByGroup) {
            works = WR.getWorksByGroup(category) || [];
            console.log(`[AIService] WorkRegistry.getWorksByGroup('${category}'): ${works.length} works`);
        }

        // 3. Try getCategoryKeyByLabel then getWorksByGroup
        if (works.length === 0 && WR.getCategoryKeyByLabel && WR.getWorksByGroup) {
            const key = WR.getCategoryKeyByLabel(category);
            if (key) {
                works = WR.getWorksByGroup(key) || [];
                console.log(`[AIService] WorkRegistry key='${key}': ${works.length} works`);
            }
        }

        // 4. Text search fallback
        if (works.length === 0 && WR.search) {
            works = WR.search(category) || [];
            console.log(`[AIService] WorkRegistry.search('${category}'): ${works.length} works`);
        }

        if (works.length === 0) {
            console.warn(`[AIService] No works found in WorkRegistry for category: ${category}`);
            return null;
        }

        // Take top 10-15 most relevant works
        const selectedWorks = works.slice(0, 15);

        // Estimate dimensions from serverData or defaults
        const dims = serverData?.dimensions_estimate || serverData?.qwen_result?.dimensions_estimate || {};
        const area = dims.area_m2 || 50;  // default 50 m²
        const length = dims.length_m || 10;
        const volume = dims.volume_m3 || (area * 0.2);

        const items = selectedWorks.map(w => {
            const unit = w.unit || w.ed || 'м2';
            let quantity = 1;
            
            // Estimate quantity based on unit
            if (unit.includes('м2') || unit.includes('m2')) quantity = Math.round(area * 10) / 10;
            else if (unit.includes('м3') || unit.includes('m3')) quantity = Math.round(volume * 10) / 10;
            else if (unit.includes('п.м') || unit.includes('м.п')) quantity = Math.round(length * 10) / 10;
            else if (unit.includes('кг') || unit === 'kg') quantity = Math.round(area * 5);
            else if (unit.includes('т') || unit === 't') quantity = Math.round(area * 0.05 * 10) / 10;
            else if (unit.includes('шт') || unit === 'pcs') quantity = Math.max(1, Math.round(area / 5));
            
            const price = w.price || w.unit_price || w.cost || 1500;
            const total = Math.round(quantity * price);

            return {
                work_name: w.name || w.work_name || 'Работа',
                name: w.name || w.work_name || 'Работа',
                unit: unit,
                quantity: quantity,
                unit_price: price,
                price: price,
                total_price: total,
                total: total,
                labor_hours: w.labor_hours || w.man_hours || null,
                price_source: 'database',
                category: category,
                source: 'workregistry',
                item_type: 'work'
            };
        });

        // ── Добавляем материалы из AI_MAT_* ──
        const categoryKeywords = (category || '').toLowerCase().split(/[\s_-]+/);
        const matPrefixes = ['AI_MAT_'];
        let matCount = 0;
        
        for (const key of Object.keys(window)) {
            if (!matPrefixes.some(p => key.startsWith(p))) continue;
            const catalog = window[key];
            if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;
            
            for (const item of Object.values(catalog)) {
                if (!item || !item.name || !item.price || item.price <= 0) continue;
                const itemCat = (item.category || '').toLowerCase();
                const itemName = item.name.toLowerCase();
                
                // Проверяем релевантность по категории
                const isRelevant = categoryKeywords.some(kw => 
                    kw.length > 2 && (itemCat.includes(kw) || itemName.includes(kw))
                );
                if (!isRelevant) continue;
                if (matCount >= 5) break; // максимум 5 материалов

                const unit = item.unit || 'шт';
                let qty = 1;
                if (unit.includes('м²') || unit.includes('м2')) qty = Math.round(area * 1.1 * 10) / 10;
                else if (unit.includes('м³') || unit.includes('м3')) qty = Math.round(volume * 1.05 * 10) / 10;
                else if (unit.includes('кг')) qty = Math.round(area * 3);
                else if (unit.includes('шт')) qty = Math.max(1, Math.round(area / 3));

                items.push({
                    work_name: item.name,
                    name: item.name,
                    unit: unit,
                    quantity: qty,
                    unit_price: item.price,
                    price: item.price,
                    total_price: Math.round(qty * item.price),
                    total: Math.round(qty * item.price),
                    price_source: 'material_db',
                    category: category,
                    source: 'material_catalog',
                    item_type: 'material'
                });
                matCount++;
            }
            if (matCount >= 5) break;
        }

        // ── Добавляем технику из AI_EQ_* ──
        const eqPrefixes = ['AI_EQ_'];
        let eqCount = 0;
        
        for (const key of Object.keys(window)) {
            if (!eqPrefixes.some(p => key.startsWith(p))) continue;
            const catalog = window[key];
            if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;
            
            for (const item of Object.values(catalog)) {
                if (!item || !item.name || !item.price || item.price <= 0) continue;
                const itemCat = (item.category || '').toLowerCase();
                const itemName = item.name.toLowerCase();
                
                const isRelevant = categoryKeywords.some(kw => 
                    kw.length > 2 && (itemCat.includes(kw) || itemName.includes(kw))
                );
                if (!isRelevant) continue;
                if (eqCount >= 3) break; // максимум 3 единицы техники

                items.push({
                    work_name: item.name,
                    name: item.name,
                    unit: item.unit || 'смена',
                    quantity: Math.max(1, Math.ceil(area / 50)),
                    unit_price: item.price,
                    price: item.price,
                    total_price: Math.round(Math.max(1, Math.ceil(area / 50)) * item.price),
                    total: Math.round(Math.max(1, Math.ceil(area / 50)) * item.price),
                    price_source: 'equipment_db',
                    category: category,
                    source: 'equipment_catalog',
                    item_type: 'equipment'
                });
                eqCount++;
            }
            if (eqCount >= 3) break;
        }

        console.log(`[AIService] ✅ Category estimate: ${selectedWorks.length} работ, ${matCount} материалов, ${eqCount} техники`);
        return items;
    }

    /**
     * Convert dataURL to File object (for FormData).
     */
    function _dataUrlToFile(dataUrl, filename) {
        if (!dataUrl) return null;
        try {
            const arr = dataUrl.split(',');
            const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) u8arr[n] = bstr.charCodeAt(n);
            return new File([u8arr], filename, { type: mime });
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Analysis cache (sessionStorage) — context-aware
    // ═══════════════════════════════════════════════════════════════════════

    const CACHE_PREFIX = 'qazgost_analysis_';
    const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

    /** Simple hash for cache key differentiation */
    function _cacheHash(str) {
        let h = 0;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) - h + str.charCodeAt(i)) | 0;
        }
        return Math.abs(h).toString(36);
    }

    /** Build context-aware cache key from analysis parameters */
    function _buildCacheKey(ctx) {
        const parts = [
            (ctx?.description || '').substring(0, 50),
            ctx?.category || '',
            String(ctx?.photos?.length || 0),
            ctx?.region || 'almaty',
        ];
        return CACHE_PREFIX + _cacheHash(parts.join('|'));
    }

    function getLastAnalysisCache(ctx) {
        try {
            const key = ctx ? _buildCacheKey(ctx) : CACHE_PREFIX + 'last';
            const raw = sessionStorage.getItem(key);
            if (!raw) return null;
            const cached = JSON.parse(raw);
            if (Date.now() - cached._cachedAt > CACHE_TTL) {
                sessionStorage.removeItem(key);
                return null;
            }
            return cached;
        } catch {
            return null;
        }
    }

    function setLastAnalysisCache(result, ctx) {
        try {
            const toCache = { ...result, _cachedAt: Date.now() };
            delete toCache._raw; // don't cache raw blob
            const key = ctx ? _buildCacheKey(ctx) : CACHE_PREFIX + 'last';
            sessionStorage.setItem(key, JSON.stringify(toCache));
            // Cleanup old cache entries (keep max 5)
            const keys = [];
            for (let i = 0; i < sessionStorage.length; i++) {
                const k = sessionStorage.key(i);
                if (k && k.startsWith(CACHE_PREFIX)) keys.push(k);
            }
            if (keys.length > 5) {
                // Remove oldest entries beyond 5
                const entries = keys.map(k => {
                    try { return { k, t: JSON.parse(sessionStorage.getItem(k))._cachedAt || 0 }; }
                    catch { return { k, t: 0 }; }
                }).sort((a, b) => a.t - b.t);
                for (let i = 0; i < entries.length - 5; i++) {
                    sessionStorage.removeItem(entries[i].k);
                }
            }
        } catch {
            // sessionStorage full — silently ignore
        }
    }

    function clearAnalysisCache() {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const k = sessionStorage.key(i);
            if (k && k.startsWith(CACHE_PREFIX)) sessionStorage.removeItem(k);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Price Database API (~24000 items: works + materials + equipment)
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Search price database by name.
     * @param {string} query — search text (e.g. "бетон", "арматура")
     * @param {string} type — 'works' | 'materials' | 'equipment' | 'all'
     * @param {number} limit — max results (default 20)
     * @returns {Array} — [{code, name, unit, price, category, type, score}]
     */
    async function searchPrices(query, type = 'all', limit = 20) {
        try {
            const params = new URLSearchParams({ q: query, type, limit });
            const res = await fetch(`${AI_BASE}/api/v1/prices/search?${params}`);
            if (!res.ok) return [];
            const data = await res.json();
            return data.results || [];
        } catch (e) {
            console.warn('[AIService] searchPrices error:', e.message);
            return [];
        }
    }

    /**
     * Get single price item by code.
     * @param {string} code — item code (e.g. "BRICK_M150")
     * @returns {object|null}
     */
    async function getPriceItem(code) {
        try {
            const res = await fetch(`${AI_BASE}/api/v1/prices/item/${encodeURIComponent(code)}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.item || null;
        } catch {
            return null;
        }
    }

    /**
     * Get price database statistics.
     * @returns {object} — {works: {count, categories}, materials: {count, categories}, equipment: {count, categories}, total}
     */
    async function getPriceStats() {
        try {
            const res = await fetch(`${AI_BASE}/api/v1/prices/stats`);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }

    // ═══════════════════════════════════════════════════════════════════════
    // MULTI-PASS → NORMALIZED FORMAT CONVERTER
    // ═══════════════════════════════════════════════════════════════════════

    /**
     * Преобразует EstimateReport (из MultiPassEstimateEngine) в нормализованный
     * формат AIService, который ожидает photoEstimateModule.js.
     */
    function _convertMultiPassToNormalized(report, ctx) {
        const items = (report.finalItems || []).map(item => ({
            name: item.name || '',
            unit: item.unit || 'шт',
            quantity: item.qty || item.quantity || 0,
            price: item.workPrice || item.price || 0,
            total_price: item.price || ((item.workPrice || 0) + (item.materialPrice || 0)),
            category: item.category || ctx.category || '',
            section: item.section || 'Общие',
            hours: item.hours || 0,
            workPrice: item.workPrice || 0,
            materialPrice: item.materialPrice || 0,
            price_source: item.price_source || 'ai',
            matched_work_id: item.matched_work_id || null,
            matchScore: item.confidence || 0,
        }));

        const total = items.reduce((s, i) => s + (i.total_price || 0), 0);

        return {
            // Fields expected by photoEstimateModule.js
            objectType: report.plan?.objectType || 'generic',
            sessionStatus: 'DONE_ESTIMATE',
            object_count: items.length,
            processing_time_ms: report.metadata?.elapsed_ms || 0,
            pipeline_version: '4.0',

            // Estimate items
            estimate_items: items,
            estimate_total: report.scenarios?.standard?.total || total,

            // Scenarios
            scenarios: report.scenarios || {},

            // Defects
            defects: report.defects?.defects || [],

            // Plan
            plan: report.plan ? {
                explanation: report.plan.explanation || '',
                work_items: items,
                scenarios: report.scenarios,
                snipRefs: report.plan.snipRefs || [],
                warnings: report.plan.warnings || [],
            } : null,

            // Accuracy
            accuracy: {
                overallConfidence: report.plan?.confidence || 0.5,
            },

            // Detected objects (empty for text-only mode)
            detected_objects: [],
            detection_sources: {},

            // Auto-completed
            auto_completed: null,

            // Price stats
            price_stats: {},

            // Intent
            intent: {
                objectType: report.plan?.objectType || 'generic',
                category: ctx.category || '',
            },

            // Multi-pass metadata
            _multiPassReport: report,
            _sessionId: report.sessionId,
            _analysisMode: report.analysisMode,

            // Step timings (from passes)
            step_timings: (report.passes || []).reduce((acc, p) => {
                acc[p.passType] = p.durationMs || 0;
                return acc;
            }, {}),
        };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════════════════

    window.AIService = {
        isAvailable,
        getMode,
        setPreferredProvider,
        getPreferredProvider,
        analyze,
        analyzeWithProgress,
        analyzeFullPipeline,
        pollHealth,
        stopPollHealth,
        getLastAnalysisCache,
        clearAnalysisCache,
        // Price Database API
        searchPrices,
        getPriceItem,
        getPriceStats,
        // Constants
        CLASS_COLORS,
        CLASS_NAMES_RU,
        AI_BASE,
    };

    const _mode = getMode();
    const _modeLabel = _mode === 'gemini' ? '🌐 Gemini' : _mode === 'chatgpt' ? '🤖 ChatGPT' : `🖥️ ${AI_BASE}`;
    const _providers = [
        _isGeminiConfigured() ? '✅ Gemini' : '⬜ Gemini',
        _isChatGptConfigured() ? '✅ ChatGPT' : '⬜ ChatGPT',
    ].join(', ');
    console.log(`✅ [AIService] Bridge loaded → ${_modeLabel} | Providers: ${_providers}`);
})();
