// ========== PHOTO ESTIMATE MODULE v3.0 ==========
// Аккордеон-стиль: все секции видны на одной странице
// Расчёты: человеко-часы, объёмы, работы, материалы
// PDF через PeEstimatePDF (кириллица, фото, подитоги)
// AI-корректировка сметы + отправка в ленту заказов
// "Мои заказы" строго для заказчиков

(function () {
    'use strict';

    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => [...root.querySelectorAll(s)];

    function fmt(n) {
        return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₸';
    }

    function fmtNum(n) {
        return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(n);
    }

    function toast(msg, type) {
        if (window.showEnhancedToast) window.showEnhancedToast({ message: msg, type });
        else if (window.showToast) window.showToast(msg);
        else if (window.QazUI?.toast) window.QazUI.toast(msg, type);
    }

    function getCurrentRole() {
        return (window.currentRole || localStorage.getItem('userRole') || 'orderer');
    }

    // ========== AI DETECTION CONFIG ==========
    let _aiAvailable = false;
    let _aiCheckedAt = 0;
    const AI_CHECK_TTL = 60000; // cache AI availability for 60s

    // ========== STATE ==========
    const DEFAULT_STATE = {
        selectedCategory: null,
        photos: [],                 // [{file, dataUrl, detections?}]
        aiDescription: '',
        analysisComplete: false,
        analyzing: false,
        // NEW: Detailed estimate from AINormBridge → AIEstimatorV2
        _detailedEstimate: null,    // {success, estimates[], sections[], totals}
        // NEW: Full plan from buildPlan (planner + scenarios + questions)
        _buildPlanResult: null,     // {plan, estimate, scenarios, questions, explanation}
        // Анкета клиента
        clientName: '',
        clientPhone: '',
        clientAddress: '',
        clientNotes: '',
        // Region & AI Correction
        selectedRegion: 'almaty',
        aiCorrectionPrompt: '',
        orderSubmitted: false,
        // AI Detection
        _analysisSource: 'description', // 'ai' | 'description'
        _aiDetections: [],              // DetectedObject[]
        _defectSeverityFilter: 'all',   // 'all' | 'critical' | 'medium' | 'low'
        _stepTimings: null,             // {rfdetr, estimator, merging, total}
        _lastAiChanges: '',             // AI correction log
        _pipelineLog: null,             // [{step, icon, status, detail, signals?}]
        _sessionResult: null,           // ResultContract from SessionStatus.evaluate()
        _serverResult: null,            // Full IntentContract JSON from ai-service
        _offlineBlocked: false,         // True when AI server is offline
        _skipCategory: false,           // True when user skips category → AI determines from description
        analysisMode: null,             // null=auto | 'simple' | 'complex' | 'vip' — Multi-Pass Engine mode
    };

    let state = { ...DEFAULT_STATE };
    let _globalListenersBound = false;

    // ========== PERSISTENCE (localStorage) ==========
    const PE_STORAGE_KEY = 'pe_savedState';

    function persistState() {
        try {
            const toSave = {
                selectedCategory: state.selectedCategory,
                aiDescription: state.aiDescription,
                analysisComplete: state.analysisComplete,
                selectedWorks: state.selectedWorks,
                clientName: state.clientName,
                clientPhone: state.clientPhone,
                clientAddress: state.clientAddress,
                clientNotes: state.clientNotes,
                selectedRegion: state.selectedRegion,
                aiCorrectionPrompt: state.aiCorrectionPrompt,
                orderSubmitted: state.orderSubmitted,
                savedAt: Date.now()
            };
            localStorage.setItem(PE_STORAGE_KEY, JSON.stringify(toSave));
        } catch (e) {
            console.warn('PE: Failed to persist state:', e);
        }
    }

    function restoreState() {
        try {
            const raw = localStorage.getItem(PE_STORAGE_KEY);
            if (!raw) return false;
            const saved = JSON.parse(raw);
            // Only restore if saved less than 24 hours ago
            if (!saved.savedAt || Date.now() - saved.savedAt > 24 * 60 * 60 * 1000) {
                localStorage.removeItem(PE_STORAGE_KEY);
                return false;
            }
            // Merge saved fields into state
            if (saved.selectedCategory) state.selectedCategory = saved.selectedCategory;
            if (saved.aiDescription) state.aiDescription = saved.aiDescription;
            // Do NOT restore analysisComplete — stale results should not show without fresh analysis
            // if (saved.analysisComplete) state.analysisComplete = saved.analysisComplete;
            if (saved.selectedWorks && saved.selectedWorks.length) state.selectedWorks = saved.selectedWorks;
            if (saved.clientName) state.clientName = saved.clientName;
            if (saved.clientPhone) state.clientPhone = saved.clientPhone;
            if (saved.clientAddress) state.clientAddress = saved.clientAddress;
            if (saved.clientNotes) state.clientNotes = saved.clientNotes;
            if (saved.aiCorrectionPrompt) state.aiCorrectionPrompt = saved.aiCorrectionPrompt;
            if (saved.selectedRegion) state.selectedRegion = saved.selectedRegion;
            if (saved.orderSubmitted) state.orderSubmitted = saved.orderSubmitted;
            console.log('PE: State restored from localStorage');
            return true;
        } catch (e) {
            console.warn('PE: Failed to restore state:', e);
            return false;
        }
    }

    let _container = null;

    // ========== FETCH WITH RETRY (slow networks) ==========
    async function fetchWithRetry(url, options = {}, maxRetries = 3) {
        let lastError;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 30000 + attempt * 15000);
                const res = await fetch(url, { ...options, signal: controller.signal });
                clearTimeout(timeout);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res;
            } catch (e) {
                lastError = e;
                if (attempt < maxRetries - 1) {
                    const delay = 1000 * Math.pow(2, attempt);
                    console.warn(`[PE] Fetch attempt ${attempt + 1} failed, retrying in ${delay}ms...`, e.message);
                    await new Promise(r => setTimeout(r, delay));
                }
            }
        }
        throw lastError;
    }

    // ========== CATALOG PRELOAD STATE ==========
    let _catalogsLoading = false;
    let _catalogsReady = false;

    async function _ensureCatalogs() {
        if (_catalogsReady) return;
        if (window.CatalogLoader && !window.CatalogLoader.isReady()) {
            _catalogsLoading = true;
            try {
                await window.CatalogLoader.loadAll();
            } catch (e) {
                console.warn('[PE] Catalog load error:', e);
            }
            _catalogsLoading = false;
            _catalogsReady = true;
            // Re-render with loaded categories
            if (_container) render(_container, true);
        } else {
            _catalogsReady = true;
        }
    }

    // ========== MAIN RENDER ==========
    function render(container, skipRestore) {
        const c = typeof container === 'string' ? document.getElementById(container) || $(container) : container;
        if (!c) return;
        // Restore state on first render
        if (!_container && !skipRestore) {
            restoreState();
        }
        _container = c;

        // Trigger catalog preload (non-blocking, will re-render when done)
        if (!_catalogsReady && !_catalogsLoading) {
            _ensureCatalogs();
        }

        const isExecutor = getCurrentRole() === 'contractor';
        const v3 = window.PhotoEstimateV3UI;
        const canProceed = state.selectedCategory || state._skipCategory;

        c.innerHTML = `
            <div class="pe-page">
                ${renderHero()}
                ${renderCategorySection()}
                ${canProceed && v3 ? v3.renderModeTabs() : ''}
                ${canProceed && v3 ? v3.render3DTips() : ''}
                ${canProceed ? renderUploadSection() : ''}
                ${canProceed && v3 ? v3.renderContourSection() : ''}
                ${canProceed ? renderAiDescSection() : ''}
                ${canProceed ? renderAiTariffSection() : ''}
                ${canProceed ? renderAnalysisModeSection() : ''}
                ${isExecutor && canProceed ? renderClientSection() : ''}
                ${canProceed ? renderAnalyzeButton() : ''}
                ${state.analyzing ? renderAnalyzingBlock() : ''}
                ${state.analysisComplete ? renderV3ResultsSection() : ''}
            </div>
        `;

        attachEvents();
        if (v3) {
            v3.setPhotos(state.photos);
            v3.bindModeTabs();
            v3.updateModeUI();
            if (state.analysisComplete) {
                v3.bindScenarioCards();
                v3.bindQTOQuestions();
                v3.bindSAMToggle();
                v3.bindSessionStatusActions();
            }
            if (v3.getMode() === 'contour') {
                v3.bindContourCanvas();
            }
        }

        // Auto-check AI availability on render (non-blocking)
        if (Date.now() - _aiCheckedAt >= AI_CHECK_TTL) {
            checkAIAvailability().then(available => {
                // Update hero AI badge without full re-render
                const badge = document.querySelector('.pe-ai-status');
                if (badge) {
                    badge.className = 'pe-ai-status ' + (available ? 'online' : 'offline');
                    badge.innerHTML = available
                        ? '🟢 AI-распознавание активно'
                        : '🔴 Оффлайн-режим (оценка по описанию)';
                }
            });
        }
    }

    // ========== HERO ==========
    function renderHero() {
        const aiDot = _aiAvailable ? 'online' : 'offline';
        const aiText = _aiAvailable ? '🟢 AI-распознавание активно' : '🔴 Оффлайн-режим (оценка по описанию)';
        return `
            <div class="pe-hero">
                <div class="pe-hero-title">📸 Оценка стоимости по фото</div>
                <div class="pe-hero-desc">
                    Выберите категорию, загрузите фото, опишите задачу — ИИ подберёт работы и рассчитает стоимость
                </div>
                <div class="pe-ai-status pe-ai-${aiDot}">
                    <span class="pe-ai-dot"></span>
                    <span class="pe-ai-status-text">${aiText}</span>
                </div>
            </div>
        `;
    }

    // ========== 1. CATEGORY SELECTION ==========
    function renderCategorySection() {
        // Show loading spinner while catalogs are loading
        if (_catalogsLoading) {
            return `
                <div class="pe-section">
                    <div class="pe-section-title">
                        <span class="pe-step-badge">1</span> Загрузка каталога работ...
                    </div>
                    <div style="display:flex;align-items:center;justify-content:center;padding:40px;gap:12px;">
                        <div class="pe-spinner"></div>
                        <span style="color:rgba(255,255,255,0.6);font-size:14px;">Загружаем 12 000+ позиций из справочника...</span>
                    </div>
                </div>
            `;
        }

        const registry = window.WorkRegistry || window.WBSCatalog;
        const cats = registry ? registry.getCategories() : [];

        // Skip button if user already chose to skip
        if (state._skipCategory) {
            return `
                <div class="pe-section">
                    <div class="pe-section-title">
                        <span class="pe-step-badge done">✓</span> Категория: определит ИИ по описанию
                        <button class="pe-skip-undo" id="peUndoSkip" style="margin-left:auto;background:none;border:1px solid rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);padding:4px 12px;border-radius:8px;cursor:pointer;font-size:12px;">Выбрать вручную</button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="pe-section">
                <div class="pe-section-title">
                    <span class="pe-step-badge">1</span> Выберите категорию работ
                </div>
                ${cats.length === 0 ? `
                    <div style="text-align:center;padding:20px;color:rgba(255,255,255,0.5);">
                        <div style="font-size:14px;margin-bottom:12px;">📦 Каталог пуст — нажмите «Пропустить» и опишите работы текстом</div>
                    </div>
                ` : `
                    <div class="pe-categories">
                        ${cats.map(c => `
                            <div class="pe-cat-card ${state.selectedCategory === c.name ? 'selected' : ''}"
                                 style="--cat-color: ${c.color}"
                                 data-category="${c.name}">
                                <div class="pe-cat-icon">${c.icon}</div>
                                <div class="pe-cat-name">${c.name}</div>
                                <div class="pe-cat-stats">${c.workCount} работ</div>
                            </div>
                        `).join('')}
                    </div>
                `}
                <div style="text-align:center;margin-top:12px;">
                    <button id="peSkipCategory" style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(139,92,246,0.05));border:1px solid rgba(139,92,246,0.3);color:#a78bfa;padding:10px 24px;border-radius:12px;cursor:pointer;font-size:14px;transition:all 0.2s;">
                        ✨ Пропустить → ИИ определит по описанию
                    </button>
                </div>
            </div>
        `;
    }

    // ========== 2. PHOTO UPLOAD ==========
    const MAX_PHOTOS = 10;

    function renderUploadSection() {
        const registry = window.WorkRegistry || window.WBSCatalog;
        const catMeta = registry ? (registry.CATEGORY_META[state.selectedCategory] || {}) : {};
        return `
            <div class="pe-section pe-fade-in">
                <div class="pe-section-title">
                    <span class="pe-step-badge">2</span> Загрузите фото объекта
                    <span class="pe-section-hint">(необязательно, до ${MAX_PHOTOS} фото · ${state.photos.length}/${MAX_PHOTOS})</span>
                </div>
                <div class="pe-upload-tips">
                    <div class="pe-tips-icon">💡</div>
                    <div class="pe-tips-text">
                        <strong>Для точного AI-анализа:</strong> хорошее освещение, минимум 1280×720, разные ракурсы объекта. AI распознаёт конструкции и автоматически формирует смету.
                    </div>
                </div>
                <div class="pe-upload-area">
                    ${state.photos.length > 0 ? `
                        <div class="pe-photo-grid">
                            ${state.photos.map((p, i) => `
                                <div class="pe-photo-thumb">
                                    <img src="${p.dataUrl}" alt="photo ${i + 1}">
                                    <canvas class="pe-detection-canvas" data-photo-idx="${i}"></canvas>
                                    <span class="pe-photo-num">${i + 1}</span>
                                    ${p.detections && p.detections.length > 0 ? `<span class="pe-ai-badge">🤖 ${p.detections.length} объект.</span>` : ''}
                                    <button class="pe-photo-del" data-idx="${i}" title="Удалить фото">✕</button>
                                </div>
                            `).join('')}
                            ${state.photos.length < MAX_PHOTOS ? `
                                <div class="pe-photo-add" id="peAddMorePhotos">
                                    <span>+</span>
                                    <div class="pe-photo-add-hint">Ещё</div>
                                </div>
                            ` : ''}
                        </div>
                    ` : `
                        <div class="pe-upload-zone" id="peDropZone">
                            <div class="pe-upload-icon">📷</div>
                            <div class="pe-upload-text">Перетащите фото или нажмите для выбора</div>
                            <div class="pe-upload-hint">JPG, PNG · до 10MB каждое · до ${MAX_PHOTOS} фото</div>
                        </div>
                    `}
                    <input type="file" accept="image/*" multiple class="pe-hidden-input" id="peFileInput">
                </div>
            </div>
        `;
    }

    // ========== 3. AI DESCRIPTION ==========
    function renderAiDescSection() {
        return `
            <div class="pe-section pe-fade-in">
                <div class="pe-section-title">
                    <span class="pe-step-badge">3</span> Описание для ИИ
                </div>
                <div class="pe-ai-desc-block">
                    <div class="pe-ai-desc-info">
                        <div class="pe-ai-desc-info-icon">🤖</div>
                        <div class="pe-ai-desc-info-text">
                            <strong>Как работает ИИ-анализ:</strong><br>
                            ИИ распознаёт фото и сопоставляет с описанием. Из описания извлекаются площади, 
                            объёмы и тип работ. Чем точнее описание — тем точнее расчёт.
                        </div>
                    </div>
                    <textarea class="pe-ai-textarea" id="peAiDescription" 
                              placeholder="Опишите объект и задачу, например:&#10;• Ванная комната 3×4 метра, замена плитки и сантехники&#10;• Крыша частного дома, площадь 120 м², замена кровли&#10;• Офис 50 м², косметический ремонт стен и потолка"
                              rows="4">${state.aiDescription}</textarea>
                </div>
            </div>
        `;
    }
    // ========== 3.5. AI TARIFF SELECTION ==========
    function renderAiTariffSection() {
        // Determine active provider and tariff
        const mode = window.AIService ? window.AIService.getMode() : 'offline';
        const geminiOk = !!(window.GeminiService && window.GeminiService.isConfigured());
        const chatgptOk = !!(window.ChatGptService && window.ChatGptService.isConfigured());

        if (!geminiOk && !chatgptOk) {
            return `
                <div class="pe-section pe-fade-in">
                    <div class="pe-section-title">
                        <span class="pe-step-badge">🤖</span> AI Провайдер
                    </div>
                    <div style="padding:20px;text-align:center;color:rgba(255,255,255,0.5);font-size:14px;">
                        ⚠️ Ни один AI провайдер не настроен.<br>
                        Настройте Gemini или ChatGPT API ключ в настройках.
                    </div>
                </div>
            `;
        }

        // Get tariff plans from active service
        const geminiPlans = geminiOk && window.GeminiService.getTariffPlans ? window.GeminiService.getTariffPlans() : {};
        const chatgptPlans = chatgptOk && window.ChatGptService.getTariffPlans ? window.ChatGptService.getTariffPlans() : {};

        const isGemini = mode === 'gemini' || (!chatgptOk && geminiOk);
        const plans = isGemini ? geminiPlans : chatgptPlans;
        const currentTariff = isGemini
            ? (window.GeminiService.getTariff ? window.GeminiService.getTariff() : 'maximum')
            : (window.ChatGptService.getTariff ? window.ChatGptService.getTariff() : 'maximum');
        const providerLabel = isGemini ? '🌐 Google Gemini' : '🤖 OpenAI ChatGPT';

        // Build tariff cards
        let cardsHtml = '';
        for (const [key, plan] of Object.entries(plans)) {
            const isActive = key === currentTariff;
            const featuresHtml = (plan.features || []).map(f =>
                `<div class="pe-tariff-feature">✓ ${f}</div>`
            ).join('');

            cardsHtml += `
                <div class="pe-tariff-card ${isActive ? 'pe-tariff-active' : ''}" 
                     onclick="PhotoEstimateModule._setTariff('${key}')" 
                     data-tariff="${key}">
                    <div class="pe-tariff-header">
                        <div class="pe-tariff-label">${plan.label}</div>
                        <div class="pe-tariff-cost">${plan.costLevel}</div>
                    </div>
                    <div class="pe-tariff-desc">${plan.description}</div>
                    <div class="pe-tariff-features">${featuresHtml}</div>
                    ${plan.useCase ? `<div class="pe-tariff-usecase">🏗️ ${plan.useCase}</div>` : ''}
                    <div class="pe-tariff-select-btn ${isActive ? 'active' : ''}">
                        ${isActive ? '✓ Активен' : 'Выбрать'}
                    </div>
                </div>
            `;
        }

        // Provider toggle
        let providerToggle = '';
        if (geminiOk && chatgptOk) {
            providerToggle = `
                <div class="pe-provider-toggle">
                    <button class="pe-provider-btn ${isGemini ? 'active' : ''}" 
                            onclick="PhotoEstimateModule._setProvider('gemini')">
                        🌐 Gemini
                    </button>
                    <button class="pe-provider-btn ${!isGemini ? 'active' : ''}" 
                            onclick="PhotoEstimateModule._setProvider('chatgpt')">
                        🤖 ChatGPT
                    </button>
                </div>
            `;
        }

        return `
            <div class="pe-section pe-fade-in">
                <div class="pe-section-title">
                    <span class="pe-step-badge">🧠</span> AI Тариф — ${providerLabel}
                </div>
                ${providerToggle}
                <div class="pe-tariff-grid">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    // ========== 3.7. ANALYSIS MODE (Multi-Pass Engine) ==========
    function renderAnalysisModeSection() {
        // Only show if MultiPassEstimateEngine is loaded
        if (!window.MultiPassEstimateEngine) return '';

        const modes = [
            { key: '', label: '⚡ Авто', desc: 'Система выберет оптимальный режим', icon: '🤖' },
            { key: 'simple', label: '⚡ Быстрый', desc: '1 AI-вызов, быстрый результат', icon: '⚡' },
            { key: 'complex', label: '🔬 Детальный', desc: 'Несколько проходов + аудит', icon: '🔬' },
            { key: 'vip', label: '👑 VIP', desc: 'Полный pipeline + WBS маппинг', icon: '👑' },
        ];

        const current = state.analysisMode || '';
        const cardsHtml = modes.map(m => `
            <div class="pe-tariff-card ${current === m.key ? 'pe-tariff-active' : ''}"
                 onclick="PhotoEstimateModule._setAnalysisMode('${m.key}')"
                 style="cursor:pointer;min-width:0;">
                <div class="pe-tariff-header">
                    <div class="pe-tariff-label">${m.icon} ${m.label}</div>
                </div>
                <div class="pe-tariff-desc" style="font-size:12px;">${m.desc}</div>
                <div class="pe-tariff-select-btn ${current === m.key ? 'active' : ''}">
                    ${current === m.key ? '✓ Выбран' : 'Выбрать'}
                </div>
            </div>
        `).join('');

        return `
            <div class="pe-section pe-fade-in">
                <div class="pe-section-title">
                    <span class="pe-step-badge">🧬</span> Режим анализа (Multi-Pass AI Engine)
                </div>
                <div class="pe-tariff-grid" style="grid-template-columns:repeat(4,1fr);gap:10px;">
                    ${cardsHtml}
                </div>
            </div>
        `;
    }

    // ========== 4. CLIENT FORM (executor only) ==========
    function renderClientSection() {
        const phoneErr = state._phoneError ? `<div class="pe-field-error">${state._phoneError}</div>` : '';
        return `
            <div class="pe-section pe-fade-in">
                <div class="pe-section-title">
                    <span class="pe-step-badge">4</span> Анкета объекта / Данные заказчика
                </div>
                <div class="pe-client-form">
                    <div class="pe-form-row">
                        <div class="pe-form-group">
                            <label class="pe-label">👤 Имя клиента</label>
                            <input type="text" class="pe-input" id="peClientName" 
                                   value="${esc(state.clientName)}" placeholder="Иванов Иван">
                        </div>
                        <div class="pe-form-group">
                            <label class="pe-label">📞 Телефон</label>
                            <input type="tel" class="pe-input ${state._phoneError ? 'pe-input-error' : ''}" id="peClientPhone" 
                                   value="${esc(state.clientPhone)}" placeholder="+7 (700) 123-45-67"
                                   maxlength="18">
                            ${phoneErr}
                        </div>
                    </div>
                    <div class="pe-form-group">
                        <label class="pe-label">📍 Адрес объекта <span style="color:rgba(255,255,255,0.4)">(можно корректировать)</span></label>
                        <input type="text" class="pe-input" id="peClientAddress" 
                               value="${esc(state.clientAddress)}" placeholder="г. Алматы, ул. Абая, д. 15">
                    </div>
                    <div class="pe-form-row">
                        <div class="pe-form-group">
                            <label class="pe-label">🏙️ Регион (ценообразование)</label>
                            <select class="pe-input" id="peSelectedRegion">
                                <option value="almaty" ${state.selectedRegion === 'almaty' ? 'selected' : ''}>Алматы (×1.05)</option>
                                <option value="astana" ${state.selectedRegion === 'astana' ? 'selected' : ''}>Астана (×1.08)</option>
                                <option value="shymkent" ${state.selectedRegion === 'shymkent' ? 'selected' : ''}>Шымкент (×0.95)</option>
                                <option value="atyrau" ${state.selectedRegion === 'atyrau' ? 'selected' : ''}>Атырау (×1.20)</option>
                                <option value="aktau" ${state.selectedRegion === 'aktau' ? 'selected' : ''}>Актау (×1.18)</option>
                                <option value="aktobe" ${state.selectedRegion === 'aktobe' ? 'selected' : ''}>Актобе (×1.00)</option>
                                <option value="karaganda" ${state.selectedRegion === 'karaganda' ? 'selected' : ''}>Караганда (×1.00)</option>
                                <option value="pavlodar" ${state.selectedRegion === 'pavlodar' ? 'selected' : ''}>Павлодар (×1.05)</option>
                                <option value="ust-kamenogorsk" ${state.selectedRegion === 'ust-kamenogorsk' ? 'selected' : ''}>Усть-Каменогорск (×1.03)</option>
                                <option value="kostanay" ${state.selectedRegion === 'kostanay' ? 'selected' : ''}>Костанай (×1.02)</option>
                                <option value="petropavl" ${state.selectedRegion === 'petropavl' ? 'selected' : ''}>Петропавловск (×1.03)</option>
                                <option value="taraz" ${state.selectedRegion === 'taraz' ? 'selected' : ''}>Тараз (×0.98)</option>
                                <option value="semey" ${state.selectedRegion === 'semey' ? 'selected' : ''}>Семей (×1.02)</option>
                                <option value="kyzylorda" ${state.selectedRegion === 'kyzylorda' ? 'selected' : ''}>Кызылорда (×1.15)</option>
                                <option value="oral" ${state.selectedRegion === 'oral' ? 'selected' : ''}>Уральск (×1.12)</option>
                                <option value="taldykorgan" ${state.selectedRegion === 'taldykorgan' ? 'selected' : ''}>Талдыкорган (×1.05)</option>
                                <option value="turkestan" ${state.selectedRegion === 'turkestan' ? 'selected' : ''}>Туркестан (×1.00)</option>
                            </select>
                        </div>
                        <div class="pe-form-group">
                            <label class="pe-label">📝 Примечания</label>
                            <input type="text" class="pe-input" id="peClientNotes" 
                                   value="${esc(state.clientNotes)}" placeholder="Доп. информация">
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // ========== PHONE VALIDATION ==========
    function formatPhone(value) {
        const digits = value.replace(/\D/g, '');
        if (!digits) return '';
        let d = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
        if (!d.startsWith('7')) d = '7' + d;
        d = d.slice(0, 11);
        let result = '+7';
        if (d.length > 1) result += ' (' + d.slice(1, 4);
        if (d.length > 4) result += ') ' + d.slice(4, 7);
        if (d.length > 7) result += '-' + d.slice(7, 9);
        if (d.length > 9) result += '-' + d.slice(9, 11);
        return result;
    }

    function validatePhone(phone) {
        if (!phone || !phone.trim()) return null; // пустой — OK
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 11) return 'Номер неполный — нужно 11 цифр';
        if (digits.length > 11) return 'Слишком много цифр';
        if (!digits.startsWith('7')) return 'Номер должен начинаться с +7';
        return null;
    }

    // ========== ANALYZE BUTTON ==========
    function renderAnalyzeButton() {
        if (state.analysisComplete || state.analyzing) return '';
        const isExecutor = getCurrentRole() === 'contractor';
        const stepNum = isExecutor ? 5 : 4;

        // SERVER-FIRST: Show offline block if AI is not available
        if (state._offlineBlocked) {
            return `
                <div class="pe-section pe-fade-in" style="text-align:center;">
                    <div style="background:linear-gradient(135deg,#1a1a2e,#16213e);border:1px solid #e74c3c;border-radius:16px;padding:24px;margin:16px 0;">
                        <div style="font-size:2rem;margin-bottom:12px;">🔴</div>
                        <div style="color:#e74c3c;font-weight:700;font-size:1.1rem;margin-bottom:8px;">AI-сервер недоступен</div>
                        <div style="color:#aaa;font-size:0.9rem;margin-bottom:16px;">
                            Анализ невозможен без AI-сервера.<br>
                            Сервер запускается автоматически вместе с приложением.
                        </div>
                        <div style="color:#888;font-size:0.8rem;background:#0d1117;border-radius:8px;padding:12px;text-align:left;">
                            <code>Проверьте: http://localhost:8001/health</code>
                        </div>
                        <button class="pe-analyze-btn" id="peRetryConnection" style="margin-top:16px;background:linear-gradient(135deg,#e74c3c,#c0392b);">
                            🔄 Повторить подключение
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div class="pe-section pe-fade-in" style="text-align:center;">
                <button class="pe-analyze-btn" id="peStartAnalysis" ${state.analyzing ? 'disabled' : ''}>
                    🤖 Анализировать и рассчитать стоимость
                </button>
                <div class="pe-analyze-hint">
                    AI-сервер проанализирует фото, определит объекты и рассчитает смету
                </div>
            </div>
        `;
    }

    // ========== ANALYZING PROGRESS ==========
    function renderAnalyzingBlock() {
        const mode = window.AIService?.getMode?.() || 'local';
        const isGemini = mode === 'gemini';
        const isChatGpt = mode === 'chatgpt';
        const aiLabel = isGemini ? '🌐 Gemini AI' : isChatGpt ? '🤖 ChatGPT' : '🖥️ AI-сервер';
        const modelLabel = isGemini && window.GeminiService ? window.GeminiService.getModel() : '';

        const photoCount = state.photos?.length || 0;
        const photoLabel = photoCount > 1 ? `${photoCount} фото` : 'фото';

        const steps = isGemini || isChatGpt ? [
            { id: 'peA1', text: `📤 Подготовка ${photoLabel} для ${aiLabel}...` },
            { id: 'peA2', text: `🧠 ${aiLabel} анализирует ${photoCount > 1 ? 'все ракурсы' : 'объект'} и определяет работы...` },
            { id: 'peA3', text: '📐 Формирование позиций сметы и расчёт стоимости...' },
            { id: 'peA4', text: '✨ Финализация: сценарии, план работ, рекомендации...' },
        ] : [
            { id: 'peA1', text: `📤 Отправка ${photoLabel} на AI-сервер...` },
            { id: 'peA2', text: '🔍 Детекция объектов на фото...' },
            { id: 'peA3', text: '📐 Расчёт сметы + QTO...' },
            { id: 'peA4', text: '🧠 План работ + сценарии...' },
        ];

        return `
            <div class="pe-section pe-fade-in">
                <div class="pe-analyzing">
                    ${modelLabel ? `<div style="text-align:center;margin-bottom:12px;font-size:13px;color:rgba(255,255,255,0.5);">Модель: ${modelLabel}</div>` : ''}
                    <div class="pe-progress-steps" id="peProgressSteps">
                        ${steps.map((s, i) => `
                            <div class="pe-pstep ${i === 0 ? 'active' : ''}" id="${s.id}">
                                <div class="pe-pstep-icon">${i === 0 ? '<div class="pe-spinner"></div>' : '⏳'}</div>
                                <div class="pe-pstep-text">${s.text}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // ========== CONFIDENCE LEVEL ==========
    function getConfidence() {
        let score = 0;
        if (state.photos.length > 0) score += 20;
        if (state.photos.length >= 3) score += 10;
        if (state.aiDescription.trim().length > 20) score += 20;
        if (state.aiDescription.match(/(\d+)\s*[×xх]\s*(\d+)/i)) score += 25; // exact dimensions
        if (state.aiDescription.match(/(\d+)\s*м[²2]/i)) score += 20; // area given
        if (state.aiDescription.trim().length > 80) score += 5;
        if (score >= 65) return { level: 'high', label: '🟢 Высокая', hint: 'Фото + размеры = точная оценка' };
        if (score >= 30) return { level: 'medium', label: '🟡 Средняя', hint: 'Добавьте фото или укажите размеры для повышения точности' };
        return { level: 'low', label: '🔴 Низкая', hint: 'Укажите площадь (напр. 4×5 м) и загрузите фото для точной оценки' };
    }

    // ========== V3 RESULTS WRAPPER ==========
    function renderV3ResultsSection() {
        _ensureCanonicalResult();
        const v3 = window.PhotoEstimateV3UI;
        const baseEstimate = state._detailedEstimate;
        const plan = state._buildPlanResult;
        const srv = state._serverResult; // IntentContract from server

        // Total: prefer server result, then buildPlan, then AINormBridge
        const total = srv?.estimate_total
            || plan?.estimate?.totals?.grand
            || baseEstimate?.totals?.total
            || 0;

        const defects = srv?.defects?.defects
            || plan?.plan?.defectRepairs
            || v3?.state?.defects
            || [];

        const questions = srv?.questions
            || plan?.questions
            || v3?.state?._pendingQuestions
            || [];

        let v3Html = '';

        // ── Session Status Banner (from SessionStatus) ──
        if (v3 && state._sessionResult && v3.renderSessionStatusBanner) {
            v3Html += v3.renderSessionStatusBanner(state._sessionResult);
        }

        // Сценарии — используем реальные данные из buildPlan
        if (v3 && total > 0) {
            v3Html += v3.renderScenarios(total);
        }

        // Объяснение плана (от ConstructionPlanner.explain)
        if (plan?.explanation) {
            v3Html += `
                <div class="pe-section pe-fade-in" style="margin-top:16px;">
                    <div class="pe-section-title">
                        <span class="pe-step-badge done">📋</span> План работ по СНиП
                    </div>
                    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:16px;font-size:14px;line-height:1.7;white-space:pre-wrap;color:rgba(255,255,255,0.85);">${plan.explanation}</div>
                    ${plan.confidence ? `<div style="margin-top:8px;font-size:13px;color:rgba(255,255,255,0.5);">📊 Уверенность оценки: ${Math.round(plan.confidence * 100)}%</div>` : ''}
                </div>
            `;
        }

        // Дефекты
        if (v3 && defects.length > 0) {
            v3Html += v3.renderDefectsPanel(defects);
        }

        // ── Pipeline Summary Panel ──
        if (state._pipelineLog && state._pipelineLog.length > 0) {
            const statusColors = {
                done: '#10b981', skip: '#6b7280', offline: '#f59e0b', error: '#ef4444',
            };
            const statusLabels = {
                done: 'Готово', skip: 'Пропущен', offline: 'Офлайн', error: 'Ошибка',
            };
            const logHtml = state._pipelineLog.map(entry => {
                const color = statusColors[entry.status] || '#888';
                const label = statusLabels[entry.status] || entry.status;
                const signalsHtml = (entry.signals && entry.signals.length > 0)
                    ? `<div style="margin-top:4px;font-size:11px;color:rgba(255,255,255,0.5);line-height:1.5;">${entry.signals.join('<br>')}</div>`
                    : '';
                return `
                    <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
                        <div style="font-size:18px;flex-shrink:0;">${entry.icon}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-weight:600;font-size:13px;color:rgba(255,255,255,0.9);">${entry.step}</span>
                                <span style="font-size:10px;padding:2px 6px;border-radius:8px;background:${color}22;color:${color};font-weight:600;">${label}</span>
                            </div>
                            <div style="font-size:12px;color:rgba(255,255,255,0.55);margin-top:2px;">${entry.detail}</div>
                            ${signalsHtml}
                        </div>
                    </div>
                `;
            }).join('');
            v3Html += `
                <div class="pe-section pe-fade-in" style="margin-top:16px;">
                    <div class="pe-section-title">
                        <span class="pe-step-badge done">🔗</span> Пайплайн анализа — ${state._pipelineLog.length} этапов
                    </div>
                    <div style="background:rgba(255,255,255,0.03);border-radius:12px;padding:12px 16px;">${logHtml}</div>
                    <div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.35);text-align:right;">Источник: ${state._analysisSource === 'ai' ? 'AI Backend (RF-DETR)' : state._analysisSource === 'canvas_ai' ? 'Canvas AI (локальный)' : 'Описание'}</div>
                </div>
            `;
        }

        // ── Confidence Panel (from SessionStatus accuracy) ──
        if (v3 && state._sessionResult) {
            const acc = state._sessionResult.accuracy;
            const confData = {
                overall: acc.overallConfidence,
                breakdown: {
                    detection: acc.typeConfidence,
                    scale: acc.dimConfidence,
                    user_input: Object.keys(v3.getQTOAnswers ? v3.getQTOAnswers() : {}).length > 0 ? 0.8 : 0.2,
                }
            };
            v3Html += v3.renderConfidencePanel(confData);
        } else if (v3) {
            const qtoAnswers = v3.getQTOAnswers ? v3.getQTOAnswers() : {};
            const confData = {
                overall: plan?.confidence || (state._analysisSource === 'ai' ? 0.72 : 0.45),
                breakdown: plan?.confidenceBreakdown || {
                    detection: state._analysisSource === 'ai' ? 0.85 : 0.35,
                    scale: plan?.scaleCalibrated ? 0.9 : 0.3,
                    user_input: Object.keys(qtoAnswers).length > 0 ? 0.8 : 0.2,
                }
            };
            v3Html += v3.renderConfidencePanel(confData);
        }

        // ── Step Timings ──
        if (v3 && state._stepTimings) {
            v3Html += v3.renderStepTimings(state._stepTimings);
        }

        // ── SAM Overlay Controls ──
        if (v3 && state._analysisSource === 'ai' && state._aiDetections.length > 0) {
            v3Html += v3.renderSAMOverlay('peDetectionCanvas0', state._aiDetections, state._aiDetections);
        }

        // Вопросы для уточнения
        if (v3 && questions.length > 0) {
            v3Html += v3.renderQTOQuestions(questions);
        }

        // СНиП предупреждения
        if (plan?.warnings && plan.warnings.length > 0) {
            const warnHtml = plan.warnings.map(w => {
                const icon = w.severity === 'critical' ? '🔴' : '🟡';
                return `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${icon} ${w.message} ${w.snipRef ? `<span style="color:rgba(255,255,255,0.4);font-size:12px;">(${w.snipRef})</span>` : ''}</div>`;
            }).join('');
            v3Html += `
                <div class="pe-section pe-fade-in" style="margin-top:16px;">
                    <div class="pe-section-title">
                        <span class="pe-step-badge" style="background:rgba(255,165,0,0.3);">⚠️</span> Проверки по СНиП
                    </div>
                    <div style="background:rgba(255,165,0,0.08);border-radius:12px;padding:16px;font-size:13px;line-height:1.6;">${warnHtml}</div>
                </div>
            `;
        }

        return renderResultsSection() + v3Html;
    }

    // ========== RESULTS (Server-First + AIEstimatorV2 fallback) ==========
    function renderResultsSection() {
        _ensureCanonicalResult();
        const est = state._detailedEstimate;
        const srv = state._serverResult;

        // If we have server estimate items but no _detailedEstimate, render server items
        if ((!est || !est.success || !est.sections || est.sections.length === 0) && srv && srv.estimate_items && srv.estimate_items.length > 0) {
            return renderServerEstimateSection(srv);
        }

        if (!est || !est.success || est.sections.length === 0) {
            // Если нет никакой сметы — показываем сообщение
            if (state.analysisComplete) {
                return `
                    <div class="pe-section pe-fade-in" id="peResultsSection">
                        <div class="pe-section-title">
                            <span class="pe-step-badge done">✓</span> Результат оценки
                        </div>
                        <div class="pe-empty-result">
                            <div style="font-size:48px;margin-bottom:12px">🔍</div>
                            <div style="font-size:16px;margin-bottom:8px">Объекты не распознаны</div>
                            <div style="color:var(--secondary-text,#888)">Попробуйте загрузить другие фото или изменить описание</div>
                        </div>
                        <div class="pe-actions">
                            <button class="pe-action-btn pe-btn-new" id="peNewAnalysis">🔄 Новый анализ</button>
                        </div>
                    </div>
                `;
            }
            return '';
        }

        const conf = getConfidence();
        const sourceBadge = state._analysisSource === 'ai'
            ? `<span class="pe-source-badge pe-source-ai">🤖 AI-анализ фото</span>`
            : `<span class="pe-source-badge pe-source-desc">📝 По описанию</span>`;

        const materials = window.AINormBridge ? window.AINormBridge.extractAllMaterials(est) : [];
        const works = window.AINormBridge ? window.AINormBridge.extractAllWorks(est) : [];
        const estNames = est.estimates.map(e => e.objectName).join(', ');

        // AI correction changes log
        const changesLog = state._lastAiChanges ? `
            <div class="pe-ai-changes-log">
                <div class="pe-ai-changes-title">✨ Последние изменения ИИ:</div>
                <div class="pe-ai-changes-list">${state._lastAiChanges}</div>
            </div>
        ` : '';

        // Build sections HTML
        const sectionsHtml = est.sections.map(sec => {
            const matRows = sec.items.flatMap(item =>
                item.materials.map(m => `
                    <tr>
                        <td class="pe-wt-name">🧱 ${m.name}</td>
                        <td class="pe-wt-unit">${m.unit}</td>
                        <td class="pe-wt-qty">${fmtNum(m.quantity)}</td>
                        <td class="pe-wt-price">${fmt(m.unitPrice)}</td>
                        <td class="pe-wt-total">${fmt(m.sum)}</td>
                        <td class="pe-wt-hours">—</td>
                    </tr>
                `)
            ).join('');

            const workRows = sec.items.flatMap(item =>
                item.works.map(w => `
                    <tr class="pe-row-work">
                        <td class="pe-wt-name">🔧 ${w.name}</td>
                        <td class="pe-wt-unit">${w.unit}</td>
                        <td class="pe-wt-qty">${fmtNum(w.quantity)}</td>
                        <td class="pe-wt-price">${fmt(w.unitPrice)}</td>
                        <td class="pe-wt-total">${fmt(w.sum)}</td>
                        <td class="pe-wt-hours">${w.laborHours ? fmtNum(w.laborHours) : '—'}</td>
                    </tr>
                `)
            ).join('');

            if (!matRows && !workRows) return '';

            return `
                <div class="pe-result-group">
                    <div class="pe-result-group-header" data-section="${sec.code}">
                        <div class="pe-rg-name">${sec.icon} ${sec.code}. ${sec.name} <span class="pe-rg-count">(${sec.items.reduce((a, i) => a + i.materials.length + i.works.length, 0)})</span></div>
                        <div class="pe-rg-summary">
                            <span class="pe-rg-sum">${fmt(sec.subtotal.total)}</span>
                            <span class="pe-rg-toggle">▼</span>
                        </div>
                    </div>
                    <div class="pe-result-group-body">
                        <table class="pe-work-table">
                            <thead>
                                <tr>
                                    <th style="width:30%">Позиция</th>
                                    <th>Ед.</th>
                                    <th>Кол-во</th>
                                    <th>Цена</th>
                                    <th>Сумма</th>
                                    <th>Чел-ч</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${matRows}${workRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="pe-section pe-fade-in" id="peResultsSection">
                <div class="pe-section-title">
                    <span class="pe-step-badge done">✓</span> Результат оценки
                    <span class="pe-section-hint">${materials.length} мат. + ${works.length} работ</span>
                    ${sourceBadge}
                </div>

                <div class="pe-confidence pe-confidence-${conf.level}">
                    <span class="pe-conf-badge">${conf.label}</span>
                    <span class="pe-conf-hint">${conf.hint}</span>
                </div>

                ${state._analysisSource === 'ai' ? renderAIDetectionsPanel() : ''}

                <div class="pe-detail-objects" style="padding:8px 16px;color:var(--secondary-text,#aaa);font-size:13px">
                    Объекты: ${estNames}
                </div>

                ${changesLog}
                ${sectionsHtml}

                <div class="pe-totals-grid">
                    <div class="pe-total-item">
                        <div class="pe-total-icon">🧱</div>
                        <div class="pe-total-label">Материалы</div>
                        <div class="pe-total-val">${fmt(est.totals.materials)}</div>
                    </div>
                    <div class="pe-total-item">
                        <div class="pe-total-icon">🔧</div>
                        <div class="pe-total-label">Работы</div>
                        <div class="pe-total-val">${fmt(est.totals.works)}</div>
                    </div>
                    <div class="pe-total-item">
                        <div class="pe-total-icon">👷</div>
                        <div class="pe-total-label">Чел-часы</div>
                        <div class="pe-total-val">${est._smart?.sections?.labor ? fmtNum(est._smart.sections.labor.totalHours) + ' ч' : '—'}</div>
                        <div class="pe-total-sub">${est._smart?.sections?.labor ? est._smart.sections.labor.laborDays + ' дн · ' + est._smart.sections.labor.workers + ' чел' : ''}</div>
                    </div>
                    <div class="pe-total-item">
                        <div class="pe-total-icon">🚜</div>
                        <div class="pe-total-label">Мех-часы</div>
                        <div class="pe-total-val">${est._smart?.sections?.equipment ? est._smart.sections.equipment.reduce((s, e) => s + (e.machineHours || 0), 0).toFixed(1) + ' ч' : '—'}</div>
                        <div class="pe-total-sub">${est._smart?.totals?.equipment ? fmt(est._smart.totals.equipment) : ''}</div>
                    </div>
                    <div class="pe-total-item grand">
                        <div class="pe-total-icon">💰</div>
                        <div class="pe-total-label">ИТОГО</div>
                        <div class="pe-total-val">${fmt(est.totals.total)}</div>
                    </div>
                </div>

                <div class="pe-detail-region" style="text-align:center;padding:6px;color:var(--secondary-text,#aaa);font-size:12px">
                    📍 ${est.region} · ${new Date(est.generatedAt).toLocaleDateString('ru-RU')}
                </div>

                <!-- AI Correction Section -->
                <div class="pe-ai-correction">
                    <div class="pe-ai-corr-header">
                        <span class="pe-ai-corr-icon">🤖</span>
                        <span class="pe-ai-corr-title">ИИ-Корректировка сметы</span>
                        <span class="pe-ai-corr-hint">Опишите что изменить, ИИ пересчитает</span>
                    </div>
                    <div class="pe-ai-corr-body">
                        <textarea id="peAiCorrPrompt" class="pe-ai-corr-input" 
                            placeholder="Например: увеличь стоимость материалов на 15%, увеличь площадь на 20%..."
                            rows="3">${state.aiCorrectionPrompt || ''}</textarea>
                        <button class="pe-ai-corr-btn" id="peAiCorrectBtn">
                            <span class="pe-ai-corr-btn-icon">✨</span> Применить ИИ-корректировку
                        </button>
                    </div>
                </div>

                <div class="pe-actions">
                    <button class="pe-action-btn pe-btn-pdf" id="peDownloadPDF">📄 Скачать PDF</button>
                    <button class="pe-action-btn pe-btn-save" id="peSaveEstimate">💾 Сохранить</button>
                    <button class="pe-action-btn pe-btn-submit" id="peSubmitOrder" ${state.orderSubmitted ? 'disabled' : ''}>
                        ${state.orderSubmitted ? '✅ Заявка отправлена' : '📤 Отправить в ленту заказов'}
                    </button>
                    <button class="pe-action-btn pe-btn-new" id="peNewAnalysis">🔄 Новый анализ</button>
                </div>
            </div>
        `;
    }


    // ========== SERVER ESTIMATE RENDER ==========
    function renderServerEstimateSection(srv) {
        const items = srv.estimate_items || [];
        const total = srv.estimate_total || 0;
        const status = srv.sessionStatus || 'DONE_ESTIMATE';
        const accuracy = srv.accuracy || {};
        const intent = srv.intent || {};

        const statusLabels = {
            'DONE_EXACT': { label: '✅ Точный расчёт', color: '#10b981' },
            'DONE_ESTIMATE': { label: '📊 Оценочный расчёт', color: '#f59e0b' },
            'NEED_SCALE': { label: '📏 Нужен масштаб', color: '#3b82f6' },
            'NEED_ANSWERS': { label: '❓ Нужны уточнения', color: '#8b5cf6' },
            'NEED_MORE_PHOTOS': { label: '📸 Нужно больше фото', color: '#ef4444' },
        };
        const st = statusLabels[status] || statusLabels['DONE_ESTIMATE'];

        const rowsHtml = items.map((it, i) => {
            const srcBadge = it.price_source === 'database'
                ? '<span title="Цена из базы данных" style="font-size:10px;padding:1px 4px;border-radius:4px;background:rgba(16,185,129,0.15);color:#10b981;margin-left:4px;">🗄️ БД</span>'
                : (it.price_source === 'hardcoded' ? '<span title="Захардкоженная цена" style="font-size:10px;padding:1px 4px;border-radius:4px;background:rgba(245,158,11,0.15);color:#f59e0b;margin-left:4px;">📌</span>' : '');
            return `
            <tr>
                <td style="color:rgba(255,255,255,0.4);font-size:12px;width:30px;">${i + 1}</td>
                <td class="pe-wt-name">${it.work_name}${srcBadge}</td>
                <td class="pe-wt-unit">${it.unit}</td>
                <td class="pe-wt-qty">${fmtNum(it.quantity)}</td>
                <td class="pe-wt-price">${fmt(it.unit_price)}</td>
                <td class="pe-wt-total">${fmt(it.total_price)}</td>
                <td class="pe-wt-hours">${it.labor_hours ? fmtNum(it.labor_hours) : '—'}</td>
            </tr>`;
        }).join('');

        // Defect repair items
        const defectItems = srv.defect_repair_items || [];
        const defectTotal = srv.defect_repair_total || 0;
        let defectRowsHtml = '';
        if (defectItems.length > 0) {
            defectRowsHtml = `
                <tr><td colspan="6" style="padding:12px 0 4px;color:#e74c3c;font-weight:600;font-size:13px;">🔧 Ремонт дефектов</td></tr>
                ${defectItems.map((it, i) => `
                    <tr style="background:rgba(231,76,60,0.05);">
                        <td style="color:rgba(255,255,255,0.4);font-size:12px;width:30px;">${items.length + i + 1}</td>
                        <td class="pe-wt-name">🔴 ${it.work_name}</td>
                        <td class="pe-wt-unit">${it.unit}</td>
                        <td class="pe-wt-qty">${fmtNum(it.quantity)}</td>
                        <td class="pe-wt-price">${fmt(it.unit_price)}</td>
                        <td class="pe-wt-total">${fmt(it.total_price)}</td>
                    </tr>
                `).join('')}
            `;
        }

        const grandTotal = total + defectTotal;
        const confPct = Math.round((accuracy.overallConfidence || 0.5) * 100);

        return `
            <div class="pe-section pe-fade-in" id="peResultsSection">
                <div class="pe-section-title">
                    <span class="pe-step-badge done">✓</span> Результат оценки
                    <span class="pe-section-hint">${items.length + defectItems.length} позиций</span>
                    <span class="pe-source-badge pe-source-ai">🤖 ${(state._serverResult?.ai_backend === 'gemini') ? 'Gemini AI' : 'AI Server v3.0'}</span>
                </div>

                <!-- Session Status -->
                <div style="display:flex;align-items:center;gap:12px;padding:12px 16px;background:${st.color}11;border-radius:12px;margin-bottom:12px;">
                    <span style="font-size:1.3rem;">${st.label}</span>
                    <span style="margin-left:auto;font-size:12px;color:rgba(255,255,255,0.5);">
                        Уверенность: ${confPct}% · Тип: ${intent.objectType || 'generic'}
                    </span>
                </div>

                <!-- Confidence Guard Badge -->
                <div id="peConfidenceGuardBadge" style="margin-bottom:12px;"></div>

                <!-- Audit Quality Badge -->
                <div id="peAuditBadge" style="margin-bottom:12px;"></div>

                <!-- Engineer Review Queue (if pending) -->
                <div id="peEngineerQueuePanel" style="margin-bottom:12px;"></div>

                <!-- Request Engineer Review button + Ask AI Engineer -->
                <div style="margin-bottom:12px;display:flex;justify-content:flex-end;gap:8px;flex-wrap:wrap;">
                    <button onclick="window._peAskAIEngineer && window._peAskAIEngineer()"
                        class="pe-action-btn"
                        style="font-size:12px;padding:6px 14px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);color:#818cf8;border-radius:8px;cursor:pointer;">
                        🤖 Задать вопрос ИИ-инженеру
                    </button>
                    <button onclick="window._peRequestEngineerReview && window._peRequestEngineerReview()"
                        class="pe-action-btn"
                        style="font-size:12px;padding:6px 14px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.25);color:#f59e0b;border-radius:8px;cursor:pointer;">
                        👷 Запросить проверку инженера
                    </button>
                </div>

                <!-- Estimate Table -->
                <div class="pe-result-group">
                    <div class="pe-result-group-header">
                        <div class="pe-rg-name">📐 Сметный расчёт <span class="pe-rg-count">(${items.length} позиций)</span></div>
                        <div class="pe-rg-summary">
                            <span class="pe-rg-sum">${fmt(total)}</span>
                            <span class="pe-rg-toggle">▼</span>
                        </div>
                    </div>
                    <div class="pe-result-group-body">
                        <table class="pe-work-table">
                            <thead>
                                <tr>
                                    <th style="width:30px">#</th>
                                    <th style="width:28%">Позиция</th>
                                    <th>Ед.</th>
                                    <th>Кол-во</th>
                                    <th>Цена</th>
                                    <th>Сумма</th>
                                    <th>Чел-ч</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rowsHtml}
                                ${defectRowsHtml}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Grand Total -->
                <div class="pe-totals-grid">
                    <div class="pe-total-item">
                        <div class="pe-total-icon">📐</div>
                        <div class="pe-total-label">Стоимость работ</div>
                        <div class="pe-total-val">${fmt(total)}</div>
                    </div>
                    ${defectTotal > 0 ? `
                    <div class="pe-total-item">
                        <div class="pe-total-icon">🔧</div>
                        <div class="pe-total-label">Ремонт дефектов</div>
                        <div class="pe-total-val">${fmt(defectTotal)}</div>
                    </div>
                    ` : ''}
                    <div class="pe-total-item">
                        <div class="pe-total-icon">👷</div>
                        <div class="pe-total-label">Чел-часы</div>
                        <div class="pe-total-val">${(() => { const lh = items.reduce((s, it) => s + (it.labor_hours || 0), 0); return lh > 0 ? fmtNum(lh) + ' ч' : '—'; })()}</div>
                        <div class="pe-total-sub">${(() => { const lh = items.reduce((s, it) => s + (it.labor_hours || 0), 0); const days = Math.ceil(lh / 8); return lh > 0 ? days + ' дн' : ''; })()}</div>
                    </div>
                    <div class="pe-total-item">
                        <div class="pe-total-icon">🚜</div>
                        <div class="pe-total-label">Мех-часы</div>
                        <div class="pe-total-val">${(() => { const mh = items.reduce((s, it) => s + (it.machine_hours || 0), 0); return mh > 0 ? fmtNum(mh) + ' ч' : '—'; })()}</div>
                    </div>
                    <div class="pe-total-item grand">
                        <div class="pe-total-icon">💰</div>
                        <div class="pe-total-label">ИТОГО</div>
                        <div class="pe-total-val">${fmt(grandTotal)}</div>
                    </div>
                </div>

                ${srv.price_db_stats ? `
                <div style="display:flex;align-items:center;justify-content:center;gap:12px;padding:8px 16px;margin-bottom:8px;background:rgba(16,185,129,0.06);border-radius:10px;font-size:12px;color:rgba(255,255,255,0.6);">
                    <span>🗄️ База цен: ${(srv.price_db_stats.total_items || 0).toLocaleString('ru-RU')} позиций</span>
                    <span>·</span>
                    <span style="color:#10b981;">✅ Из БД: ${srv.price_db_stats.db_prices_used || 0}</span>
                    <span>·</span>
                    <span style="color:#f59e0b;">📌 Базовые: ${srv.price_db_stats.hardcoded_prices || 0}</span>
                </div>
                ` : ''}

                <div class="pe-detail-region" style="text-align:center;padding:6px;color:var(--secondary-text,#aaa);font-size:12px">
                    📍 ${srv.qwen_result?.region || state.selectedRegion || 'Алматы'} · ${srv.ai_backend === 'gemini' ? '🌐 Gemini AI' : `Pipeline v${srv.pipeline_version || '3.0'}`}${srv.processing_time_ms ? ` · ${srv.processing_time_ms}ms` : ''}
                </div>

                <!-- AI Correction Section -->
                <div class="pe-ai-correction">
                    <div class="pe-ai-corr-header">
                        <span class="pe-ai-corr-icon">🤖</span>
                        <span class="pe-ai-corr-title">ИИ-Корректировка сметы</span>
                        <span class="pe-ai-corr-hint">Опишите что изменить, ИИ пересчитает</span>
                    </div>
                    <div class="pe-ai-corr-body">
                        <textarea id="peAiCorrPrompt" class="pe-ai-corr-input" 
                            placeholder="Например: увеличь стоимость материалов на 15%, увеличь площадь на 20%..."
                            rows="3">${state.aiCorrectionPrompt || ''}</textarea>
                        <button class="pe-ai-corr-btn" id="peAiCorrectBtn">
                            <span class="pe-ai-corr-btn-icon">✨</span> Применить ИИ-корректировку
                        </button>
                    </div>
                </div>

                <div class="pe-actions">
                    <button class="pe-action-btn pe-btn-pdf" id="peDownloadPDF">📄 Скачать PDF</button>
                    <button class="pe-action-btn pe-btn-save" id="peSaveEstimate">💾 Сохранить</button>
                    <button class="pe-action-btn pe-btn-submit" id="peSubmitOrder" ${state.orderSubmitted ? 'disabled' : ''}>
                        ${state.orderSubmitted ? '✅ Заявка отправлена' : '📤 Отправить в ленту заказов'}
                    </button>
                    <button class="pe-action-btn pe-btn-new" id="peNewAnalysis">🔄 Новый анализ</button>
                    <button class="pe-action-btn" id="pePriceSearch"
                        style="background:linear-gradient(135deg,rgba(139,92,246,0.2),rgba(59,130,246,0.15));border-color:rgba(139,92,246,0.3);color:#a78bfa;">
                        🔍 Поиск по базе цен
                    </button>
                </div>
            </div>
        `;
    }

    function esc(s) { return (s || '').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

    // ========== AI SERVICE HELPERS ==========

    async function checkAIAvailability() {
        if (Date.now() - _aiCheckedAt < AI_CHECK_TTL) return _aiAvailable;
        try {
            if (window.AIService && typeof window.AIService.isAvailable === 'function') {
                _aiAvailable = await window.AIService.isAvailable();
            } else {
                _aiAvailable = false;
            }
        } catch (e) {
            _aiAvailable = false;
        }
        _aiCheckedAt = Date.now();
        console.log(`[PE] AI available: ${_aiAvailable}`);
        return _aiAvailable;
    }

    // Convert base64 dataUrl → Blob
    function dataUrlToBlob(dataUrl) {
        const [header, b64] = dataUrl.split(',');
        const mime = header.match(/:(.*?);/)[1];
        const binary = atob(b64);
        const arr = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
        return new Blob([arr], { type: mime });
    }

    // Analyze photos with real AI service
    async function analyzePhotosWithAI(photos) {
        const allDetections = [];
        for (let i = 0; i < photos.length; i++) {
            try {
                const blob = dataUrlToBlob(photos[i].dataUrl);
                const file = new File([blob], `photo_${i}.jpg`, { type: blob.type });
                const result = await window.AIService.analyze(file, {
                    generateEstimate: true,
                    region: state.selectedRegion || 'almaty'
                });
                if (result && result.objects && result.objects.length > 0) {
                    photos[i].detections = result.objects;
                    photos[i]._aiResult = result; // store full result for drawing
                    result.objects.forEach(obj => {
                        allDetections.push({ ...obj, _photoIdx: i });
                    });
                }
                console.log(`[PE] Photo ${i + 1}: ${result?.objects?.length || 0} objects detected`);
            } catch (err) {
                console.warn(`[PE] AI analysis failed for photo ${i + 1}:`, err.message);
            }
        }
        return allDetections;
    }

    // Draw bounding boxes on photo canvas overlay
    function drawDetectionsOverlay(photoIdx) {
        const photo = state.photos[photoIdx];
        if (!photo || !photo.detections || !photo._aiResult) return;

        const canvas = document.querySelector(`.pe-detection-canvas[data-photo-idx="${photoIdx}"]`);
        const img = canvas?.previousElementSibling;
        if (!canvas || !img) return;

        const waitForImg = () => {
            const rect = img.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
            const ctx = canvas.getContext('2d');

            const result = photo._aiResult;
            const scaleX = rect.width / (result.imageWidth || rect.width);
            const scaleY = rect.height / (result.imageHeight || rect.height);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Colors per class from AIService
            const colors = window.AIService?.CLASS_COLORS || {};
            const names = window.AIService?.CLASS_NAMES_RU || {};

            photo.detections.forEach(obj => {
                if (!obj.bbox) return;
                const [x1, y1, x2, y2] = obj.bbox;
                const x = x1 * scaleX;
                const y = y1 * scaleY;
                const w = (x2 - x1) * scaleX;
                const h = (y2 - y1) * scaleY;
                const color = obj.color || colors[obj.className] || '#ff6b6b';

                // SAM mask contour (filled polygon)
                const contour = obj.mask_contour || obj.maskContour;
                if (contour && contour.length > 2) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(contour[0][0] * scaleX, contour[0][1] * scaleY);
                    for (let i = 1; i < contour.length; i++) {
                        ctx.lineTo(contour[i][0] * scaleX, contour[i][1] * scaleY);
                    }
                    ctx.closePath();
                    // Semi-transparent fill
                    ctx.globalAlpha = 0.25;
                    ctx.fillStyle = color;
                    ctx.fill();
                    // Solid contour stroke
                    ctx.globalAlpha = 0.8;
                    ctx.strokeStyle = color;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                    ctx.restore();
                }

                // Bounding box
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);

                // Label
                const label = `${obj.localizedName || names[obj.className] || obj.className} ${obj.confidencePercent || Math.round((obj.confidence || 0) * 100)}%`;
                ctx.font = '10px Inter, sans-serif';
                const tw = ctx.measureText(label).width;
                ctx.fillStyle = color;
                ctx.fillRect(x, y - 14, tw + 6, 14);
                ctx.fillStyle = '#fff';
                ctx.fillText(label, x + 3, y - 3);
            });
        };

        if (img.complete) waitForImg();
        else img.onload = waitForImg;
    }

    // Render AI detections summary panel
    function renderAIDetectionsPanel() {
        if (!state._aiDetections || state._aiDetections.length === 0) return '';

        const colors = window.AIService?.CLASS_COLORS || {};
        const names = window.AIService?.CLASS_NAMES_RU || {};

        // Group by className
        const byClass = {};
        state._aiDetections.forEach(d => {
            const cls = d.className;
            if (!byClass[cls]) byClass[cls] = { count: 0, totalArea: 0, totalVolume: 0, maxConf: 0 };
            byClass[cls].count++;
            if (d.areaM2) byClass[cls].totalArea += d.areaM2;
            if (d.volumeM3) byClass[cls].totalVolume += d.volumeM3;
            byClass[cls].maxConf = Math.max(byClass[cls].maxConf, d.confidence || 0);
        });

        const cards = Object.entries(byClass).map(([cls, info]) => {
            const color = colors[cls] || '#888';
            const name = names[cls] || cls;
            const dims = info.totalArea > 0
                ? `${fmtNum(info.totalArea)} м²`
                : (info.totalVolume > 0 ? `${fmtNum(info.totalVolume)} м³` : '');
            return `
                <div class="pe-ai-det-card">
                    <div class="pe-ai-det-dot" style="background:${color}"></div>
                    <div class="pe-ai-det-info">
                        <div class="pe-ai-det-name">${name}</div>
                        <div class="pe-ai-det-meta">
                            ${info.count}× · ${Math.round(info.maxConf * 100)}% ${dims ? '· ' + dims : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div class="pe-ai-detections-panel">
                <div class="pe-ai-det-title">🔍 AI обнаружил на фото (${state._aiDetections.length} объектов)</div>
                <div class="pe-ai-det-grid">${cards}</div>
            </div>
        `;
    }

    // ========== AI ANALYSIS (SERVER-FIRST) ==========
    /** Centralized cleanup of all analysis-related state flags and UI indicators */
    function _resetAnalysisState() {
        state.analyzing = false;
        state.analysisComplete = false;
        state._lastAiChanges = '';
        state._aiDetections = [];
        state._detailedEstimate = null;
        state._buildPlanResult = null;
        state._stepTimings = {};
        state._pipelineLog = null;
        state._sessionResult = null;
        state._serverResult = null;
        state._analysisSource = 'ai';
        state._offlineBlocked = false;
        state._confidenceCheck = null;
        state._auditResult = null;
        state._deviationCheck = null;
    }

    /**
     * Bridge: if we have _detailedEstimate but no _serverResult,
     * convert legacy format → canonical _serverResult so downstream
     * code (export, save, correction) always uses one path.
     */
    function _ensureCanonicalResult() {
        if (state._serverResult && state._serverResult.estimate_items && state._serverResult.estimate_items.length > 0) return;
        if (!state._detailedEstimate || !state._detailedEstimate.sections) return;

        const est = state._detailedEstimate;
        const items = [];
        (est.sections || []).forEach(sec => {
            (sec.items || []).forEach(item => {
                // Combine materials + works into flat estimate_items
                (item.works || []).forEach(w => {
                    items.push({
                        name: w.name || item.name,
                        unit: w.unit || 'шт',
                        quantity: w.quantity || 1,
                        unit_price: w.unitPrice || w.sum || 0,
                        price: w.unitPrice || w.sum || 0,
                        total_price: w.sum || 0,
                        total: w.sum || 0,
                        category: sec.title || '',
                        price_source: 'legacy_estimate',
                    });
                });
            });
        });

        if (items.length > 0) {
            state._serverResult = state._serverResult || {};
            state._serverResult.estimate_items = items;
            state._serverResult.estimate_total = items.reduce((s, i) => s + (i.total_price || 0), 0);
            state._serverResult.objectType = est.objectType || state.selectedCategory || 'generic';
            state._serverResult._convertedFromLegacy = true;
            console.log(`[PE] 🔄 Converted _detailedEstimate → _serverResult: ${items.length} items`);
        }
    }

    async function runAnalysis() {
        // Save form fields
        saveFormState();

        // Guard: WorkRegistry or WBSCatalog must be loaded
        if (!window.WorkRegistry && !window.WBSCatalog) {
            toast('⚠️ Справочник работ не загружен. Обновите страницу.', 'error');
            return;
        }
        // Allow skip-category mode — AI will determine category from description
        if (!state.selectedCategory && !state._skipCategory) {
            toast('⚠️ Выберите категорию работ', 'warning');
            return;
        }

        // Validate phone if executor
        if (getCurrentRole() === 'contractor' && state.clientPhone) {
            const phoneErr = validatePhone(state.clientPhone);
            if (phoneErr) {
                state._phoneError = phoneErr;
                render(_container);
                toast('📞 ' + phoneErr, 'warning');
                return;
            }
        }
        state._phoneError = '';

        // ── SERVER-FIRST: AI must be online ──
        await checkAIAvailability();
        if (!_aiAvailable) {
            // Last-chance check: if GeminiService is configured, it counts as available
            if (window.GeminiService && window.GeminiService.isConfigured()) {
                _aiAvailable = true;
                _aiCheckedAt = Date.now();
                console.log('[PE] Gemini configured → treating as available');
            } else if (window.ChatGptService && window.ChatGptService.isConfigured()) {
                _aiAvailable = true;
                _aiCheckedAt = Date.now();
                console.log('[PE] ChatGPT configured → treating as available');
            } else {
                toast('🔴 AI недоступен. Ключ Gemini не найден. Проверьте config.js', 'error');
                state._offlineBlocked = true;
                render(_container);
                return;
            }
        }

        // Warn if no description and no photos
        if (!state.aiDescription.trim() && state.photos.length === 0) {
            toast('💡 Для точной оценки опишите объект или загрузите фото', 'warning');
            return;
        }

        // ── Reset state ──
        _resetAnalysisState();
        state.analyzing = true;
        render(_container);

        // Scroll to progress
        const prog = document.querySelector('.pe-analyzing');
        if (prog) prog.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const steps = ['peA1', 'peA2', 'peA3', 'peA4'];

        // ── Step 1: Uploading ──
        const stepEl1 = document.getElementById(steps[0]);
        if (stepEl1) { stepEl1.classList.add('active'); }
        const stepText1 = stepEl1?.querySelector('.pe-pstep-text');
        const _aiMode = window.AIService?.getMode?.() || 'local';
        if (stepText1) stepText1.textContent = _aiMode === 'gemini' ? '🌐 Отправка в Gemini AI...' : '📤 Отправка на AI-сервер...';

        // ── Call server full pipeline via AIService.analyzeFullPipeline ──
        let serverResult;
        try {
        serverResult = await window.AIService.analyzeFullPipeline({
            photos: state.photos,
            description: state.aiDescription,
            category: state.selectedCategory,
            region: state.selectedRegion || 'almaty',
            analysisMode: state.analysisMode || undefined,  // Multi-Pass Engine mode
            onProgress: ({ stage, percent, message }) => {
                // Animate progress steps
                if (percent >= 15 && stepEl1 && !stepEl1.classList.contains('done')) {
                    stepEl1.classList.add('done');
                    stepEl1.querySelector('.pe-pstep-icon').textContent = '✅';
                    if (stepText1) stepText1.textContent = '📤 Данные отправлены';
                    const stepEl2 = document.getElementById(steps[1]);
                    if (stepEl2) {
                        stepEl2.classList.add('active');
                        stepEl2.querySelector('.pe-pstep-icon').innerHTML = '<div class="pe-spinner"></div>';
                        const t2 = stepEl2.querySelector('.pe-pstep-text');
                        if (t2) t2.textContent = '🔍 AI детекция объектов...';
                    }
                }
                if (percent >= 50) {
                    const stepEl2 = document.getElementById(steps[1]);
                    if (stepEl2 && !stepEl2.classList.contains('done')) {
                        stepEl2.classList.add('done');
                        stepEl2.querySelector('.pe-pstep-icon').textContent = '✅';
                    }
                    const stepEl3 = document.getElementById(steps[2]);
                    if (stepEl3 && !stepEl3.classList.contains('active')) {
                        stepEl3.classList.add('active');
                        stepEl3.querySelector('.pe-pstep-icon').innerHTML = '<div class="pe-spinner"></div>';
                        const t3 = stepEl3.querySelector('.pe-pstep-text');
                        if (t3) t3.textContent = '📐 Сервер рассчитывает смету...';
                    }
                }
                if (percent >= 70) {
                    const stepEl3 = document.getElementById(steps[2]);
                    if (stepEl3 && !stepEl3.classList.contains('done')) {
                        stepEl3.classList.add('done');
                        stepEl3.querySelector('.pe-pstep-icon').textContent = '✅';
                    }
                    const stepEl4 = document.getElementById(steps[3]);
                    if (stepEl4 && !stepEl4.classList.contains('active')) {
                        stepEl4.classList.add('active');
                        stepEl4.querySelector('.pe-pstep-icon').innerHTML = '<div class="pe-spinner"></div>';
                        const t4 = stepEl4.querySelector('.pe-pstep-text');
                        if (t4) t4.textContent = '🧠 Формирование плана + сценарии...';
                    }
                }
                if (percent >= 100) {
                    for (const stepId of steps) {
                        const el = document.getElementById(stepId);
                        if (el && !el.classList.contains('done')) {
                            el.classList.add('done');
                            el.querySelector('.pe-pstep-icon').textContent = '✅';
                        }
                    }
                }
            },
        });
        } catch (pipelineErr) {
            console.error('[PE] analyzeFullPipeline crashed:', pipelineErr);
            _resetAnalysisState();
            for (const stepId of steps) {
                const el = document.getElementById(stepId);
                if (el && !el.classList.contains('done')) {
                    el.classList.add('done');
                    el.querySelector('.pe-pstep-icon').textContent = '❌';
                }
            }
            toast('❌ Критическая ошибка AI-анализа: ' + (pipelineErr.message || 'Неизвестная ошибка'), 'error');
            render(_container);
            return;
        }

        // ── Handle error ──
        if (!serverResult) {
            state.analyzing = false;
            state.analysisComplete = false;
            // Mark remaining steps as error
            for (const stepId of steps) {
                const el = document.getElementById(stepId);
                if (el && !el.classList.contains('done')) {
                    el.classList.add('done');
                    el.querySelector('.pe-pstep-icon').textContent = '❌';
                }
            }
            toast('❌ AI-анализ не удался. Проверьте Gemini API ключ или локальный сервер.', 'error');
            render(_container);
            return;
        }

        // ── Store FULL server result (IntentContract) ──
        state._serverResult = serverResult;
        state._sessionResult = {
            sessionStatus: serverResult.sessionStatus || 'DONE_ESTIMATE',
            accuracy: serverResult.accuracy || {
                overallConfidence: (serverResult.confidence || 70) / 100,
                typeConfidence: (serverResult.confidence || 70) / 100,
                dimConfidence: 0.4,
            },
            nextActions: serverResult.nextActions || [],
            questions: serverResult.questions || [],
            pipelineSteps: serverResult.step_timings || {},
        };

        // Map server data into existing state fields for backward compatibility
        state._aiDetections = (serverResult.detected_objects || []).map(d => ({
            className: d.class_name,
            confidence: d.confidence,
            bbox: d.bbox,
            area_px: d.area_px,
            width_m: d.width_m,
            height_m: d.height_m,
            area_m2: d.area_m2,
            volume_m3: d.volume_m3,
        }));
        state._stepTimings = serverResult.step_timings || {};
        // Pipeline log — адаптация для Multi-Pass vs Legacy
        if (serverResult._multiPassReport) {
            const mp = serverResult._multiPassReport;
            state._pipelineLog = (mp.passes || []).map(p => ({
                step: p.passType,
                icon: p.passType === 'object' ? '🔍' : p.passType === 'works' ? '📋' :
                      p.passType === 'completeness' ? '➕' : p.passType === 'pricing' ? '💰' :
                      p.passType === 'audit' ? '🛡️' : '🧬',
                status: 'done',
                detail: `${p.durationMs || 0}ms`,
            }));
        } else {
            // Build pipeline log based on actual AI backend used
            const backend = serverResult.ai_backend || 'unknown';
            const isGeminiBackend = backend === 'gemini';
            const isChatgptBackend = backend === 'chatgpt';
            const modelUsed = isGeminiBackend && window.GeminiService ? window.GeminiService.getModel() : backend;

            if (isGeminiBackend || isChatgptBackend) {
                const providerIcon = isGeminiBackend ? '🌐' : '🤖';
                const providerName = isGeminiBackend ? `Gemini (${modelUsed})` : 'ChatGPT';
                state._pipelineLog = [
                    { step: `${providerName} Vision`, icon: providerIcon, status: 'done', detail: `Анализ фото и описания клиента` },
                    { step: 'Распознавание типа объекта', icon: '🏗️', status: 'done', detail: `Тип: ${serverResult.objectType || state.selectedCategory || 'generic'} · Уверенность: ${serverResult.confidence || 70}%` },
                    { step: 'Генерация позиций сметы', icon: '📐', status: 'done', detail: `${serverResult.estimate_items?.length || 0} позиций · Итого: ${(serverResult.estimate_total || 0).toLocaleString('ru-RU')} ₸` },
                    { step: 'Описание объекта', icon: '📋', status: 'done', detail: (serverResult.scene_description || '').substring(0, 80) || 'Анализ завершён' },
                ];
            } else {
                state._pipelineLog = [
                    { step: 'Детекция объектов', icon: '🔍', status: 'done', detail: `${(serverResult.detected_objects || []).length} объектов` },
                    { step: 'AI Vision', icon: '🧠', status: 'done', detail: `Тип: ${state.selectedCategory || serverResult.intent?.objectType || 'generic'}` },
                    { step: 'Смета + План', icon: '📐', status: 'done', detail: `${serverResult.estimate_items?.length || 0} позиций сметы` },
                ];
            }
        }

        // ── Multi-photo degradation warning ──
        if (serverResult._multiPhotoReduced) {
            state._pipelineLog = state._pipelineLog || [];
            state._pipelineLog.push({
                step: `⚠️ Использовано 1 из ${serverResult._photosSent} фото`,
                icon: '⚠️',
                status: 'warning',
                detail: `${serverResult.ai_backend || 'ChatGPT'} не поддерживает мульти-фото. Для анализа всех фото используйте Gemini.`
            });
            toast(`⚠️ ChatGPT проанализировал только 1 из ${serverResult._photosSent} фото. Переключитесь на Gemini для полного анализа.`, 'warning');
        }

        // Map scenarios + plan for V3 UI
        const v3 = window.PhotoEstimateV3UI;
        if (v3) {
            if (serverResult.scenarios) {
                v3.state.scenarioData = serverResult.scenarios;
            }
            if (serverResult.questions && serverResult.questions.length > 0) {
                v3.state._pendingQuestions = serverResult.questions;
            }
        }

        // Build plan result for backward compat
        if (serverResult.plan) {
            state._buildPlanResult = {
                plan: { plan: serverResult.plan.work_items || [] },
                estimate: { totals: { grand: serverResult.estimate_total || 0 } },
                scenarios: serverResult.scenarios,
                questions: serverResult.questions,
                confidence: serverResult.accuracy?.overallConfidence || 0.5,
                explanation: serverResult.plan.explanation || '',
                warnings: serverResult.warnings || [],
            };
        }

        // ══════════════════════════════════════════════════════════
        // SMART PIPELINE: обогащение сметы из справочника
        // ⚡ Пропускаем если данные уже обработаны Multi-Pass Engine
        // ══════════════════════════════════════════════════════════
        if (serverResult.estimate_items && serverResult.estimate_items.length > 0 && !serverResult._multiPassReport) {
            try {
                // 1. Матчинг AI → WorkRegistry
                if (window.GeminiEstimateResolver) {
                    const objType = serverResult.objectType || serverResult.intent?.objectType || state.selectedCategory || 'other';
                    const resolved = window.GeminiEstimateResolver.resolveItems(serverResult.estimate_items, objType);
                    serverResult.estimate_items = resolved;
                    console.log(`[PE] ✅ Smart Match: ${resolved.filter(i => i.price_source === 'database' || i.price_source === 'price_kz').length}/${resolved.length} из справочника`);
                }

                // 2. Дополнение недостающих работ
                if (window.CompletenessEngine) {
                    const compResult = window.CompletenessEngine.checkAndComplete(
                        serverResult.estimate_items,
                        serverResult.objectType || state.selectedCategory,
                        { isRepair: /ремонт|замен/i.test(state.aiDescription || ''), }
                    );
                    if (compResult.addedItems.length > 0) {
                        serverResult.estimate_items = [...serverResult.estimate_items, ...compResult.addedItems];
                        serverResult.auto_completed = {
                            count: compResult.addedItems.length,
                            items: compResult.addedItems.map(i => i.name),
                            completeness: compResult.completeness,
                            warnings: compResult.warnings,
                        };
                        console.log(`[PE] ➕ CompletenessEngine: +${compResult.addedItems.length} позиций`);
                    }
                }

                // 3. Ценообразование × 3 сценария
                if (window.SmartPricingResolver) {
                    const pricingResult = window.SmartPricingResolver.price(serverResult.estimate_items);
                    serverResult.estimate_items = pricingResult.items;
                    serverResult.scenarios = pricingResult.scenarios;
                    serverResult.price_stats = pricingResult.price_stats;
                    serverResult.estimate_total = pricingResult.scenarios?.standard?.total
                        || serverResult.estimate_items.reduce((s, i) => s + (i.total_price || 0), 0);

                    // Update V3 UI scenarios
                    if (v3 && pricingResult.scenarios) {
                        v3.state.scenarioData = pricingResult.scenarios;
                    }

                    console.log(`[PE] 💰 SmartPricing: ${_formatPrice(serverResult.estimate_total)} (стандарт)`);
                }
            } catch (enrichErr) {
                console.warn('[PE] Smart Pipeline enrichment warning:', enrichErr.message);
            }
        }

        // Re-store enriched result
        state._serverResult = serverResult;

        function _formatPrice(n) { return n ? n.toLocaleString('ru-RU') + ' ₸' : '0 ₸'; }

        // ── ConfidenceGuard: auto-flag low confidence → engineer review ──
        state._confidenceCheck = null;
        if (window.ConfidenceGuard) {
            try {
                const cgInput = {
                    confidence: (serverResult.accuracy?.overallConfidence || serverResult.confidence || 50) / 100,
                    estimateConfidence: (serverResult.accuracy?.overallConfidence || serverResult.confidence || 50) / 100,
                    estimateTotal: serverResult.estimate_total || 0,
                    objects: (serverResult.detected_objects || []).map(o => ({
                        className: o.class_name,
                        localizedName: o.description_ru || o.class_name,
                        confidence: o.confidence,
                    })),
                    hasScale: serverResult.accuracy?.dimConfidence > 0.5,
                };
                const cgOrder = {
                    category: serverResult.objectType || state.selectedCategory || 'general',
                    title: state.aiDescription || `Фото-оценка ${state.selectedCategory || ''}`,
                    orderId: 'PE-' + Date.now(),
                };
                const cgResult = window.ConfidenceGuard.checkConfidence(cgInput, cgOrder);
                state._confidenceCheck = cgResult;

                if (cgResult.requiresEngineer) {
                    state._pipelineLog = state._pipelineLog || [];
                    state._pipelineLog.push({
                        step: `👷 Назначен инженер: ${cgResult.assignedEngineer?.name || '—'}`,
                        icon: '👷',
                        status: 'warning',
                        detail: `Уверенность AI ${cgResult.confidence}% < порога. ${cgResult.flags.length} замечаний.`,
                    });
                    console.log(`[PE] 👷 ConfidenceGuard: engineer assigned — ${cgResult.assignedEngineer?.name}, confidence=${cgResult.confidence}%`);
                } else {
                    console.log(`[PE] ✅ ConfidenceGuard: passed, confidence=${cgResult.confidence}%`);
                }
            } catch (cgErr) {
                console.warn('[PE] ConfidenceGuard error:', cgErr.message);
            }
        }

        // ── EstimateAuditEngine: quality gates (7 checks) ──
        state._auditResult = null;
        if (window.EstimateAuditEngine) {
            try {
                const auditSession = {
                    passes: [
                        {
                            passType: 'object',
                            confidence: serverResult.accuracy?.overallConfidence || serverResult.confidence || 50,
                        },
                        {
                            passType: 'works',
                            output: { items: serverResult.estimate_items || [] },
                        },
                        {
                            passType: 'pricing',
                            output: { items: serverResult.estimate_items || [] },
                        },
                        {
                            passType: 'completeness',
                            output: { completeness: serverResult.auto_completed?.completeness || 80 },
                        },
                    ],
                };
                const auditResult = window.EstimateAuditEngine.audit(auditSession);
                state._auditResult = auditResult;

                state._pipelineLog = state._pipelineLog || [];
                const auditIcon = auditResult.score >= 80 ? '✅' : auditResult.score >= 60 ? '⚠️' : '❌';
                state._pipelineLog.push({
                    step: `🛡️ Аудит качества: ${auditResult.score}/100`,
                    icon: auditIcon,
                    status: auditResult.passed ? 'done' : 'warning',
                    detail: auditResult.issues.length > 0
                        ? auditResult.issues.map(i => i.message).join('; ')
                        : 'Все проверки пройдены',
                });
                console.log(`[PE] 🛡️ AuditEngine: score=${auditResult.score}, passed=${auditResult.passed}, issues=${auditResult.issues.length}`);
            } catch (auditErr) {
                console.warn('[PE] EstimateAuditEngine error:', auditErr.message);
            }
        }

        console.log(
            `[PE] Server-first analysis done: status=${serverResult.sessionStatus}, ` +
            `objects=${serverResult.object_count}, estimate=${serverResult.estimate_total}, ` +
            `time=${serverResult.processing_time_ms}ms`
        );

        await delay(300);

        state.analyzing = false;
        state.analysisComplete = true;
        persistState();
        render(_container);

        // Draw detections on photos after render
        if (state._aiDetections.length > 0) {
            setTimeout(() => {
                state.photos.forEach((p, i) => {
                    if (p.detections) drawDetectionsOverlay(i);
                });
            }, 100);
        }

        // Scroll to results
        setTimeout(() => {
            const res = document.getElementById('peResultsSection');
            if (res) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);

        // Render ConfidenceGuard badge after DOM is ready
        setTimeout(() => {
            // 1. Confidence badge
            if (state._confidenceCheck && window.ConfidenceGuard) {
                window.ConfidenceGuard.renderConfidenceBadge('peConfidenceGuardBadge', state._confidenceCheck);
            }

            // 2. Audit quality badge
            if (state._auditResult) {
                const ab = document.getElementById('peAuditBadge');
                if (ab) {
                    const ar = state._auditResult;
                    const color = ar.score >= 80 ? '#10b981' : ar.score >= 60 ? '#f59e0b' : '#ef4444';
                    const bg = ar.score >= 80 ? 'rgba(16,185,129,0.06)' : ar.score >= 60 ? 'rgba(245,158,11,0.06)' : 'rgba(239,68,68,0.06)';
                    const icon = ar.score >= 80 ? '✅' : ar.score >= 60 ? '⚠️' : '❌';
                    const issuesHtml = ar.issues.length > 0
                        ? `<div id="peAuditIssues" style="display:none;margin-top:8px;font-size:12px;color:rgba(255,255,255,0.6);">
                            ${ar.issues.map(i => `<div style="padding:2px 0;">• <span style="color:${i.severity === 'critical' ? '#ef4444' : i.severity === 'warning' ? '#f59e0b' : '#3b82f6'}">${i.message}</span></div>`).join('')}
                            ${ar.suggestions.length > 0 ? `<div style="margin-top:6px;color:#818cf8;">💡 ${ar.suggestions.join(' · ')}</div>` : ''}
                        </div>`
                        : '';
                    ab.innerHTML = `
                        <div style="display:flex;align-items:center;gap:10px;padding:10px 16px;border-radius:10px;background:${bg};border:1px solid ${color}22;cursor:${ar.issues.length > 0 ? 'pointer' : 'default'};"
                            ${ar.issues.length > 0 ? `onclick="var el=document.getElementById('peAuditIssues');if(el)el.style.display=el.style.display==='none'?'block':'none';"` : ''}>
                            <span style="font-size:16px;">${icon}</span>
                            <span style="font-size:13px;color:${color};font-weight:600;">🛡️ Качество: ${ar.score}/100</span>
                            <span style="margin-left:auto;font-size:11px;color:rgba(255,255,255,0.4);">${ar.issues.length} замечаний${ar.issues.length > 0 ? ' ▼' : ''}</span>
                        </div>
                        ${issuesHtml}
                    `;
                }
            }

            // 3. Engineer review queue
            if (window.ConfidenceGuard) {
                const pendingReviews = window.ConfidenceGuard.getReviewQueue().filter(r => r.status === 'pending');
                const pendingAlerts = window.ConfidenceGuard.getDeviationAlerts().filter(a => !a.reviewed);
                if (pendingReviews.length > 0 || pendingAlerts.length > 0) {
                    window.ConfidenceGuard.renderReviewQueue('peEngineerQueuePanel');
                }
            }

            // 4. Manual review request handler
            window._peRequestEngineerReview = function () {
                if (!window.ConfidenceGuard) { toast('ConfidenceGuard не загружен', 'error'); return; }
                const manualCheck = window.ConfidenceGuard.checkConfidence(
                    { confidence: 0.3, estimateConfidence: 0.3, estimateTotal: state._serverResult?.estimate_total || 0 },
                    { category: state.selectedCategory || 'general', title: state.aiDescription || 'Ручной запрос', orderId: 'MANUAL-' + Date.now() }
                );
                state._confidenceCheck = manualCheck;
                toast(`👷 Инженер назначен: ${manualCheck.assignedEngineer?.name || '—'}`, 'success');
                window.ConfidenceGuard.renderConfidenceBadge('peConfidenceGuardBadge', manualCheck);
                const pendingReviews = window.ConfidenceGuard.getReviewQueue().filter(r => r.status === 'pending');
                if (pendingReviews.length > 0) {
                    window.ConfidenceGuard.renderReviewQueue('peEngineerQueuePanel');
                }
            };

            // 5. Ask AI Engineer — open chat with estimate context
            window._peAskAIEngineer = function () {
                if (!window.EngineerChatUI) { toast('ИИ-инженер не загружен', 'error'); return; }
                // Initialize if not done
                if (!window.EngineerChatUI.engine) {
                    window.EngineerChatUI.init();
                }
                // Set estimate context
                if (window.EngineerChatUI.engine && state._serverResult) {
                    window.EngineerChatUI.engine.setEstimateContext({
                        objectType: state._serverResult.objectType || state.selectedCategory || 'generic',
                        total: state._serverResult.estimate_total || 0,
                        items: (state._serverResult.estimate_items || []).map(i => ({
                            name: i.name || i.work_name,
                            unit: i.unit,
                            quantity: i.quantity,
                            unit_price: i.unit_price,
                            total_price: i.total_price,
                        })),
                    });
                }
                // Open chat
                if (!window.EngineerChatUI.isOpen) {
                    window.EngineerChatUI.toggle();
                }
                toast('🤖 ИИ-инженер открыт с контекстом текущей сметы', 'info');
            };
        }, 300);
    }

    function delay(ms) {
        return new Promise(r => setTimeout(r, ms));
    }

    // ========== AI CORRECTION ==========
    async function aiCorrectEstimate() {
        const prompt = (document.getElementById('peAiCorrPrompt')?.value || '').trim();
        if (!prompt) {
            toast('✍️ Опишите что изменить в смете', 'warning');
            return;
        }
        // Support both _detailedEstimate and _serverResult
        const hasDetailed = !!state._detailedEstimate;
        const hasServer = !!(state._serverResult && state._serverResult.estimate_items && state._serverResult.estimate_items.length > 0);
        if (!hasDetailed && !hasServer) {
            toast('⚠️ Нет сметы для корректировки', 'warning');
            return;
        }
        state.aiCorrectionPrompt = prompt;

        // Save original total for deviation check
        const _originalTotal = state._serverResult?.estimate_total || 0;

        const btn = document.getElementById('peAiCorrectBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="pe-spinner" style="width:16px;height:16px"></div> ИИ анализирует...';
        }

        let changes = [];
        let usedGemini = false;

        // ── Try Gemini AI correction first ──
        if (hasServer && window.GeminiService && window.GeminiService.isConfigured()) {
            try {
                const srv = state._serverResult;
                const currentEstimate = srv.estimate_items.map(it => ({
                    name: it.name || it.work_name,
                    unit: it.unit,
                    quantity: it.quantity,
                    unit_price: it.unit_price || it.price,
                    total_price: it.total_price || it.total,
                }));

                const correctionPrompt = [
                    { text: `Ты — AI-сметчик QAZGOST. Текущая смета (JSON):\n${JSON.stringify(currentEstimate, null, 2)}\n\n` +
                            `Инструкция от клиента: "${prompt}"\n\n` +
                            `Примени инструкцию к смете и верни ОБНОВЛЁННЫЙ JSON:\n` +
                            `{"estimate_items": [{name, unit, quantity, unit_price, total_price}], "changes_made": ["описание каждого изменения"]}\n` +
                            `Цены в тенге (₸), Казахстан. Верни ТОЛЬКО JSON.` }
                ];

                if (btn) btn.innerHTML = '<div class="pe-spinner" style="width:16px;height:16px"></div> 🌐 Gemini корректирует...';

                const geminiResp = await window.GeminiService.generateContent(correctionPrompt);
                if (geminiResp && !geminiResp.error) {
                    // Parse Gemini response
                    let corrected;
                    try {
                        corrected = typeof geminiResp === 'string' ? JSON.parse(geminiResp) : geminiResp;
                    } catch {
                        const jsonMatch = (typeof geminiResp === 'string' ? geminiResp : '').match(/\{[\s\S]*\}/);
                        if (jsonMatch) corrected = JSON.parse(jsonMatch[0]);
                    }

                    if (corrected && corrected.estimate_items && corrected.estimate_items.length > 0) {
                        // Apply corrected items
                        srv.estimate_items = corrected.estimate_items.map(it => ({
                            ...it,
                            work_name: it.name || it.work_name,
                            price: it.unit_price,
                            total: it.total_price,
                            price_source: it.price_source || 'gemini_corrected',
                        }));
                        srv.estimate_total = srv.estimate_items.reduce((s, it) => s + (it.total_price || 0), 0);

                        changes = corrected.changes_made || [`Gemini AI скорректировал ${corrected.estimate_items.length} позиций`];
                        usedGemini = true;
                        console.log(`[PE] ✅ Gemini AI correction: ${changes.length} changes applied`);
                    }
                }
            } catch (geminiErr) {
                console.warn('[PE] Gemini correction failed, falling back to regex:', geminiErr.message);
            }
        }

        // ── Fallback: regex-based multiplier correction ──
        if (!usedGemini) {
            await delay(800 + Math.random() * 1200);

            const promptLow = prompt.toLowerCase();

            // ── Parse percentage from prompt ──
            function parseMultiplier() {
                const matUp = promptLow.match(/(?:увеличь|повысь|подними).*материал.*?(\d+)\s*%/i);
                const matDown = promptLow.match(/(?:уменьши|снизь|сократи).*материал.*?(\d+)\s*%/i);
                const workUp = promptLow.match(/(?:увеличь|повысь|подними).*(?:стоимость|цен).*работ.*?(\d+)\s*%/i);
                const workDown = promptLow.match(/(?:уменьши|снизь|сократи).*(?:стоимость|цен).*работ.*?(\d+)\s*%/i);
                const generalUp = promptLow.match(/(?:увеличь|повысь|подними).*(?:всё|все|общ|итог|смет).*?(\d+)\s*%/i);
                const generalDown = promptLow.match(/(?:уменьши|снизь|сократи|скидк).*?(\d+)\s*%/i);
                const areaUp = promptLow.match(/(?:увеличь|повысь|подними).*(?:площадь|объём|объем|количеств).*?(\d+)\s*%/i);

                if (matUp) return { type: 'materials', mult: 1 + parseInt(matUp[1]) / 100, label: `Материалы +${matUp[1]}%` };
                if (matDown) return { type: 'materials', mult: 1 - parseInt(matDown[1]) / 100, label: `Материалы -${matDown[1]}%` };
                if (workUp) return { type: 'works', mult: 1 + parseInt(workUp[1]) / 100, label: `Работы +${workUp[1]}%` };
                if (workDown) return { type: 'works', mult: 1 - parseInt(workDown[1]) / 100, label: `Работы -${workDown[1]}%` };
                if (areaUp) return { type: 'quantity', mult: 1 + parseInt(areaUp[1]) / 100, label: `Объёмы +${areaUp[1]}%` };
                if (generalUp) return { type: 'all', mult: 1 + parseInt(generalUp[1]) / 100, label: `Общее увеличение +${generalUp[1]}%` };
                if (generalDown) return { type: 'all', mult: 1 - parseInt(generalDown[1]) / 100, label: `Скидка -${generalDown[1]}%` };
                return null;
            }
            const correction = parseMultiplier();

            // ── Apply to _detailedEstimate (legacy path) ──
            if (hasDetailed && correction) {
                const est = state._detailedEstimate;
                function applyMultiplier(type, mult) {
                    est.sections.forEach(sec => {
                        sec.items.forEach(item => {
                            if (type === 'materials' || type === 'all') {
                                item.materials.forEach(m => {
                                    m.sum = Math.round(m.sum * mult);
                                    m.unitPrice = Math.round(m.unitPrice * mult);
                                });
                            }
                            if (type === 'works' || type === 'all') {
                                item.works.forEach(w => {
                                    w.sum = Math.round(w.sum * mult);
                                    w.unitPrice = Math.round(w.unitPrice * mult);
                                });
                            }
                        });
                        sec.subtotal.materials = sec.items.reduce((a, i) => a + i.materials.reduce((s, m) => s + m.sum, 0), 0);
                        sec.subtotal.works = sec.items.reduce((a, i) => a + i.works.reduce((s, w) => s + w.sum, 0), 0);
                        sec.subtotal.total = sec.subtotal.materials + sec.subtotal.works;
                    });
                    est.totals.materials = est.sections.reduce((a, s) => a + s.subtotal.materials, 0);
                    est.totals.works = est.sections.reduce((a, s) => a + s.subtotal.works, 0);
                    est.totals.total = est.totals.materials + est.totals.works;
                }
                applyMultiplier(correction.type, correction.mult);
                changes.push(correction.label);
            }

            // ── Apply to _serverResult (server-first path) ──
            if (hasServer && correction) {
                const srv = state._serverResult;
                srv.estimate_items.forEach(item => {
                    if (correction.type === 'quantity') {
                        item.quantity = Math.round((item.quantity || 1) * correction.mult * 100) / 100;
                    } else {
                        item.unit_price = Math.round((item.unit_price || 0) * correction.mult);
                        item.price = item.unit_price;
                    }
                    item.total_price = Math.round(item.quantity * (item.unit_price || item.price || 0));
                    item.total = item.total_price;
                });
                srv.estimate_total = srv.estimate_items.reduce((s, it) => s + (it.total_price || 0), 0);
                // Also update defect repair items if present
                if (srv.defect_repair_items) {
                    srv.defect_repair_items.forEach(item => {
                        item.unit_price = Math.round((item.unit_price || 0) * correction.mult);
                        item.total_price = Math.round(item.quantity * item.unit_price);
                    });
                    srv.defect_repair_total = srv.defect_repair_items.reduce((s, it) => s + (it.total_price || 0), 0);
                }
                if (!hasDetailed) changes.push(correction.label);
            }
        }

        if (changes.length === 0) {
            changes.push('ИИ не нашёл конкретных инструкций. Попробуйте: «увеличь материалы на 20%», «добавь демонтаж», «замени профнастил на металлочерепицу», «скидка 15%»');
        }

        state._lastAiChanges = changes.join(' • ');
        state.aiCorrectionPrompt = '';

        render(_container);

        setTimeout(() => {
            const log = document.querySelector('.pe-ai-changes-log');
            if (log) log.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);

        // ── Deviation check: compare original vs corrected total ──
        if (window.ConfidenceGuard && _originalTotal > 0) {
            try {
                const newTotal = state._serverResult?.estimate_total || 0;
                const devResult = window.ConfidenceGuard.checkDeviation(_originalTotal, newTotal, {
                    title: state.aiDescription || 'AI-коррекция',
                    orderId: 'CORR-' + Date.now(),
                });
                state._deviationCheck = devResult;
                if (devResult.hasDeviation) {
                    toast(`🚩 Расхождение ${devResult.deviationPercent}% после коррекции (${devResult.direction})`, devResult.severity === 'critical' ? 'error' : 'warning');
                    console.log(`[PE] 🚩 Deviation after correction: ${devResult.deviationPercent}% ${devResult.direction}`);
                }
            } catch (devErr) {
                console.warn('[PE] Deviation check error:', devErr.message);
            }
        }

        toast(`🤖 ИИ-корректировка${usedGemini ? ' (Gemini)' : ''}: ${changes.join(', ')}`, 'success');
    }

    // ========== SUBMIT TO ORDER FEED ==========
    function submitToOrderFeed() {
        const est = state._detailedEstimate;
        const srv = state._serverResult;
        const hasDetailed = est && est.success;
        const hasServer = srv && srv.estimate_items && srv.estimate_items.length > 0;

        if (!hasDetailed && !hasServer) {
            toast('⚠️ Нет сметы для отправки', 'warning');
            return;
        }
        saveFormState();

        // Determine category label (may be null in skip-category mode)
        const catLabel = state.selectedCategory || srv?.intent?.objectType || srv?.objectType || 'Оценка по фото';

        let order;
        if (hasDetailed) {
            // Legacy detailed estimate path
            order = {
                id: Date.now(),
                title: `${catLabel} — Оценка по фото`,
                category: catLabel,
                description: state.aiDescription || `Работы по категории: ${catLabel}`,
                clientName: state.clientName || 'Заказчик',
                clientPhone: state.clientPhone || '',
                clientAddress: state.clientAddress || '',
                clientNotes: state.clientNotes || '',
                status: 'open',
                type: 'photo-estimate',
                budget: est.totals.total,
                total: est.totals.total,
                totalWork: est.totals.works,
                totalMaterial: est.totals.materials,
                totalHours: 0,
                worksCount: est.sections.reduce((a, s) => a + s.items.reduce((c, i) => c + i.works.length, 0), 0),
                sections: est.sections.map(s => ({
                    name: s.name, icon: s.icon,
                    subtotal: s.subtotal,
                    items: s.items.map(i => ({
                        objectLabel: i.objectLabel,
                        materials: i.materials,
                        works: i.works
                    }))
                })),
                photos: state.photos.length,
                photoPreview: state.photos.length > 0 ? state.photos[0].dataUrl : null,
                createdAt: new Date().toISOString(),
                date: new Date().toISOString(),
                customerId: 'self',
                source: 'photo-estimate'
            };
        } else {
            // Server-first estimate path (Gemini / local backend)
            const totalWorks = srv.estimate_items.reduce((s, it) => s + (it.total_price || 0), 0);
            const totalDefects = srv.defect_repair_total || 0;
            const grandTotal = (srv.estimate_total || totalWorks) + totalDefects;
            const totalHours = srv.estimate_items.reduce((s, it) => s + (it.labor_hours || 0), 0);
            order = {
                id: Date.now(),
                title: `${catLabel} — Оценка по фото`,
                category: catLabel,
                description: state.aiDescription || srv.qwen_result?.scene_description || `Работы: ${catLabel}`,
                clientName: state.clientName || 'Заказчик',
                clientPhone: state.clientPhone || '',
                clientAddress: state.clientAddress || '',
                clientNotes: state.clientNotes || '',
                status: 'open',
                type: 'photo-estimate',
                budget: grandTotal,
                total: grandTotal,
                totalWork: totalWorks,
                totalMaterial: 0,
                totalHours: totalHours,
                worksCount: srv.estimate_items.length + (srv.defect_repair_items?.length || 0),
                estimateItems: srv.estimate_items,
                defectRepairItems: srv.defect_repair_items || [],
                photos: state.photos.length,
                photoPreview: state.photos.length > 0 ? state.photos[0].dataUrl : null,
                createdAt: new Date().toISOString(),
                date: new Date().toISOString(),
                customerId: 'self',
                source: 'photo-estimate',
                aiBackend: srv.ai_backend || 'server',
                confidence: srv.accuracy?.overallConfidence || 0.5,
            };
        }

        // Save to orders localStorage (same store as orders page)
        try {
            let orders = JSON.parse(localStorage.getItem('buildEstimateOrders') || '[]');
            orders.unshift(order);
            // Pruning: keep max 100 entries, remove older than 30 days
            const maxAge = 30 * 24 * 60 * 60 * 1000;
            orders = orders.filter(o => !o.createdAt || (Date.now() - new Date(o.createdAt).getTime()) < maxAge).slice(0, 100);
            localStorage.setItem('buildEstimateOrders', JSON.stringify(orders));
        } catch (e) {
            console.error('Failed to save order:', e);
        }

        state.orderSubmitted = true;
        render(_container);

        toast('✅ Заявка отправлена в ленту заказов!', 'success');

        // Show success banner with navigation
        setTimeout(() => {
            const btn = document.getElementById('peSubmitOrder');
            if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 200);

        // Insert success banner after submit button
        setTimeout(() => {
            const submitBtn = document.getElementById('peSubmitOrder');
            if (submitBtn && !document.getElementById('peOrderSuccess')) {
                const banner = document.createElement('div');
                banner.id = 'peOrderSuccess';
                banner.className = 'pe-order-success';
                banner.innerHTML = `
                    <div class="pe-order-success-icon">🎉</div>
                    <div class="pe-order-success-text">
                        <strong>Заявка создана!</strong><br>
                        Заказ появился в разделе «Мои заказы» и доступен исполнителям в ленте.
                    </div>
                    <button class="pe-order-success-btn" onclick="if(window.showPage){window.showPage('orders')}">
                        📋 Перейти в Мои заказы
                    </button>
                `;
                submitBtn.parentElement.insertBefore(banner, submitBtn.nextSibling);
                banner.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 300);
    }

    // ========== SAVE FORM STATE ==========
    function saveFormState() {
        const desc = document.getElementById('peAiDescription');
        if (desc) state.aiDescription = desc.value;
        const cn = document.getElementById('peClientName');
        if (cn) state.clientName = cn.value;
        const cp = document.getElementById('peClientPhone');
        if (cp) state.clientPhone = cp.value;
        const ca = document.getElementById('peClientAddress');
        if (ca) state.clientAddress = ca.value;
        const cno = document.getElementById('peClientNotes');
        if (cno) state.clientNotes = cno.value;
        const reg = document.getElementById('peSelectedRegion');
        if (reg) state.selectedRegion = reg.value;
        persistState();
    }

    // ========== EVENTS ==========
    function attachEvents() {
        // Category cards
        $$('.pe-cat-card').forEach(card => {
            card.addEventListener('click', () => {
                const wasSelected = state.selectedCategory;
                state.selectedCategory = card.dataset.category;
                state._skipCategory = false; // Cancel skip if user picks a category
                if (wasSelected !== state.selectedCategory) {
                    state.analysisComplete = false;
                    state.analyzing = false;
                    state._detailedEstimate = null;
                }
                saveFormState();
                persistState();
                render(_container);
            });
        });

        // Skip category → AI determines from description
        const skipBtn = document.getElementById('peSkipCategory');
        if (skipBtn) {
            skipBtn.addEventListener('click', () => {
                state._skipCategory = true;
                state.selectedCategory = null;
                render(_container);
            });
        }

        // Undo skip → show categories again
        const undoSkipBtn = document.getElementById('peUndoSkip');
        if (undoSkipBtn) {
            undoSkipBtn.addEventListener('click', () => {
                state._skipCategory = false;
                render(_container);
            });
        }

        // Upload drop zone
        const dropZone = document.getElementById('peDropZone');
        const fileInput = document.getElementById('peFileInput');

        if (dropZone && fileInput) {
            dropZone.addEventListener('click', () => fileInput.click());
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
            dropZone.addEventListener('drop', e => {
                e.preventDefault(); dropZone.classList.remove('dragover');
                handleFiles(e.dataTransfer.files);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', e => handleFiles(e.target.files));
        }

        // Add more photos
        const addMore = document.getElementById('peAddMorePhotos');
        if (addMore && fileInput) {
            addMore.addEventListener('click', () => fileInput.click());
        }

        // Remove photos
        $$('.pe-photo-del').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx);
                state.photos.splice(idx, 1);
                saveFormState();
                render(_container);
            });
        });

        // Start analysis
        const startBtn = document.getElementById('peStartAnalysis');
        if (startBtn) {
            startBtn.addEventListener('click', () => runAnalysis());
        }

        // Retry connection (server-first offline block)
        const retryBtn = document.getElementById('peRetryConnection');
        if (retryBtn) {
            retryBtn.addEventListener('click', async () => {
                retryBtn.disabled = true;
                retryBtn.textContent = '⏳ Проверяю...';
                await checkAIAvailability();
                if (_aiAvailable) {
                    state._offlineBlocked = false;
                    toast('🟢 AI-сервер подключён!', 'success');
                } else {
                    toast('🔴 AI-сервер по-прежнему недоступен', 'error');
                }
                render(_container);
            });
        }

        // Section toggles
        $$('.pe-result-group-header').forEach(header => {
            header.addEventListener('click', () => {
                const body = header.nextElementSibling;
                if (!body) return;
                header.classList.toggle('collapsed');
                body.style.display = header.classList.contains('collapsed') ? 'none' : '';
            });
        });

        // ===== Global event listeners (bind once) =====
        if (!_globalListenersBound) {
            _globalListenersBound = true;
            document.addEventListener('pe:qtoAnswered', async (e) => {
                const answers = e.detail?.answers || {};
                console.log('[PE] QTO answers received:', answers);

                if (!window.PhotoEstimateEngine || !window.PhotoEstimateEngine.buildPlan) {
                    toast('⚠️ PhotoEstimateEngine не загружен', 'warning');
                    return;
                }

                // Показать индикатор пересчёта
                const applyBtn = document.getElementById('peQtoApply');
                if (applyBtn) {
                    applyBtn.disabled = true;
                    applyBtn.innerHTML = '<div class="pe-spinner" style="width:16px;height:16px;display:inline-block"></div> Пересчёт...';
                }

                try {
                    const v3 = window.PhotoEstimateV3UI;

                    // Пересчитать план с новыми ответами
                    const planResult = window.PhotoEstimateEngine.buildPlan({
                        aiResult: state._aiDetections.length > 0
                            ? { detected_objects: state._aiDetections, objectType: state._aiDetections[0]?.className || 'generic' }
                            : undefined,
                        region: state.selectedRegion || 'almaty',
                        objectType: state.selectedCategory || 'generic',
                        userAnswers: answers,
                        defects: (state._aiDetections || []).filter(d => d.className === 'defect' || d.category === 'defect'),
                    });

                    state._buildPlanResult = planResult;

                    // Обновить V3 state
                    if (v3 && planResult.scenarios) {
                        v3.state.scenarioData = planResult.scenarios;
                    }
                    if (v3 && planResult.questions) {
                        v3.state._pendingQuestions = planResult.questions;
                    }

                    console.log('[PE] Recalculated with answers:', Object.keys(answers).length, 'answers');
                    toast('✅ Смета пересчитана с учётом ваших уточнений', 'success');
                    render(_container);

                    // Прокрутить к результатам
                    setTimeout(() => {
                        const res = document.getElementById('peResultsSection');
                        if (res) res.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }, 200);

                } catch (err) {
                    console.error('[PE] Recalculation failed:', err);
                    toast('⚠️ Ошибка пересчёта: ' + err.message, 'error');
                    if (applyBtn) {
                        applyBtn.disabled = false;
                        applyBtn.textContent = '✨ Пересчитать с уточнениями';
                    }
                }
            });

            // ===== pe:scenarioChanged — выбор сценария =====
            document.addEventListener('pe:scenarioChanged', (e) => {
                const scenario = e.detail?.scenario || 'standard';
                console.log('[PE] Scenario selected:', scenario);

                const plan = state._buildPlanResult;
                if (plan && plan.scenarios && plan.scenarios[scenario]) {
                    const scenarioData = plan.scenarios[scenario];
                    const total = scenarioData.totals?.grand || scenarioData.total || 0;

                    // Обновить отображение итога в результатах
                    const totalEl = document.querySelector('.pe-total-amount');
                    if (totalEl && total > 0) {
                        totalEl.textContent = Math.round(total).toLocaleString('ru-RU') + ' ₸';
                    }

                    // Обновить заголовок сценария
                    const scenLabels = { economy: 'Эконом', standard: 'Стандарт', premium: 'Премиум' };
                    const label = scenLabels[scenario] || scenario;
                    toast(`💡 Выбран сценарий: ${label}`, 'info');
                }
            });

        } // end if (!_globalListenersBound)

        // AI Correction
        const aiCorrBtn = document.getElementById('peAiCorrectBtn');
        if (aiCorrBtn) aiCorrBtn.addEventListener('click', () => aiCorrectEstimate());

        // Defect severity filter buttons
        $$('.pe-dfilt-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const v3 = window.PhotoEstimateV3UI;
                if (v3) {
                    v3.state._defectFilter = btn.dataset.dsev || 'all';
                    // Re-render defects panel only
                    const panel = document.getElementById('peDefectsPanel');
                    const defects = state._buildPlanResult?.defects || v3.state.defects || [];
                    if (panel && defects.length > 0) {
                        panel.outerHTML = v3.renderDefectsPanel(defects);
                        // Re-bind filter buttons
                        $$('.pe-dfilt-btn').forEach(b => {
                            b.addEventListener('click', () => {
                                v3.state._defectFilter = b.dataset.dsev || 'all';
                                const p2 = document.getElementById('peDefectsPanel');
                                if (p2) { p2.outerHTML = v3.renderDefectsPanel(defects); }
                            });
                        });
                    }
                }
            });
        });

        // PDF
        const pdfBtn = document.getElementById('peDownloadPDF');
        if (pdfBtn) pdfBtn.addEventListener('click', () => generatePDF());

        // Save
        const saveBtn = document.getElementById('peSaveEstimate');
        if (saveBtn) saveBtn.addEventListener('click', () => saveEstimate());

        // Submit to order feed
        const submitBtn = document.getElementById('peSubmitOrder');
        if (submitBtn && !state.orderSubmitted) {
            submitBtn.addEventListener('click', () => submitToOrderFeed());
        }

        // New analysis
        const newBtn = document.getElementById('peNewAnalysis');
        if (newBtn) {
            newBtn.addEventListener('click', () => {
                state = { ...DEFAULT_STATE };
                // Clean saved state
                try { localStorage.removeItem('pe_savedState'); } catch (e) { }
                render(_container);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                toast('🔄 Форма очищена — начните новый расчёт', 'info');
            });
        }

        // Price search widget
        const priceSearchBtn = document.getElementById('pePriceSearch');
        if (priceSearchBtn && window.PriceSearchWidget) {
            priceSearchBtn.addEventListener('click', () => {
                PriceSearchWidget.open({
                    type: 'all',
                    hint: 'Выберите позицию из базы данных',
                    onSelect: (item) => {
                        const msg = `✅ Выбрано: ${item.name} — ${item.price ? item.price.toLocaleString('ru-RU') + ' ₸' : 'цена не указана'} (${item.unit || '—'})`;
                        toast(msg, 'success');
                        console.log('[PE] Price item selected:', item);
                    }
                });
            });
        }

        // Phone mask
        const phoneInput = document.getElementById('peClientPhone');
        if (phoneInput) {
            phoneInput.addEventListener('input', () => {
                const formatted = formatPhone(phoneInput.value);
                phoneInput.value = formatted;
                state.clientPhone = formatted;
                state._phoneError = validatePhone(formatted) || '';
            });
        }

        // Scroll-to-top button
        if (!document.getElementById('peScrollTop')) {
            const scrollBtn = document.createElement('button');
            scrollBtn.id = 'peScrollTop';
            scrollBtn.className = 'pe-scroll-top';
            scrollBtn.innerHTML = '⬆';
            scrollBtn.title = 'Наверх';
            scrollBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
            document.body.appendChild(scrollBtn);
            window.addEventListener('scroll', () => {
                scrollBtn.classList.toggle('visible', window.scrollY > 400);
            });
        }

        // Auto-save description on blur
        const descArea = document.getElementById('peAiDescription');
        if (descArea) {
            descArea.addEventListener('blur', () => { state.aiDescription = descArea.value; });
        }
    }

    // ========== FILE HANDLING ==========
    function handleFiles(files) {
        saveFormState();
        let added = 0;
        for (let i = 0; i < files.length && state.photos.length < MAX_PHOTOS; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) {
                toast(`⚠️ Файл "${file.name}" не является изображением`, 'warning');
                continue;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast(`⚠️ "${file.name}" слишком большой (макс. 10MB)`, 'error');
                continue;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                state.photos.push({ file, dataUrl: e.target.result });
                render(_container);
            };
            reader.readAsDataURL(file);
            added++;
        }
        if (state.photos.length >= MAX_PHOTOS && files.length > added) {
            toast(`📷 Достигнут лимит: ${MAX_PHOTOS} фото`, 'info');
        }
    }

    // ========== PDF GENERATION v4.0 — via PeEstimatePDF Service ==========
    // Кириллица ✓ | Фото ✓ | Секционные подитоги ✓
    async function generatePDF() {
        if (!state._detailedEstimate && !state._buildPlanResult && !state._serverResult) return;

        // Check if PeEstimatePDF service is loaded
        if (!window.PeEstimatePDF) {
            toast('⚠️ PDF-сервис не загружен', 'error');
            return;
        }
        if (!window.jspdf || !window.jspdf.jsPDF) {
            toast('⚠️ Загрузка jsPDF...', 'info');
            return;
        }

        toast('📄 Генерация PDF...', 'info');

        try {
            const registry = window.WorkRegistry || window.WBSCatalog;
            const catMeta = registry ? (registry.CATEGORY_META[state.selectedCategory] || null) : null;

            const plan = state._buildPlanResult;
            const v3 = window.PhotoEstimateV3UI;
            const selectedScenario = v3 ? v3.getScenario() : 'standard';

            const filename = await window.PeEstimatePDF.generate({
                detailedEstimate: state._detailedEstimate,
                category: state.selectedCategory,
                categoryMeta: catMeta,
                client: {
                    name: state.clientName,
                    phone: state.clientPhone,
                    address: state.clientAddress,
                    notes: state.clientNotes
                },
                description: state.aiDescription,
                photos: state.photos,
                // V3 Plan data
                plan: plan ? {
                    explanation: plan.explanation,
                    scenarios: plan.scenarios,
                    selectedScenario,
                    warnings: plan.warnings,
                    snipRefs: plan.snipRefs,
                    confidence: plan.confidence,
                    objectType: plan.objectType,
                    objectLabel: plan.objectLabel,
                } : null,
                // AI Defects data binding (from qwen_result + CV detectors)
                defects: (() => {
                    // Collect defects from AI photo results
                    const allDefects = [];
                    let summary = { cracks: 0, stains: 0, rust: 0, total: 0 };
                    let maxSeverity = 'low';
                    state.photos.forEach(p => {
                        const qr = p._aiResult?.raw?.qwen_result || p._aiResult?.qwen_result;
                        if (qr && qr.defects) {
                            qr.defects.forEach(d => allDefects.push(d));
                        }
                        if (qr && qr.defects_detected) {
                            summary.cracks += qr.defects_detected.cracks || 0;
                            summary.stains += qr.defects_detected.stains || 0;
                            summary.rust += qr.defects_detected.rust || 0;
                        }
                    });
                    summary.total = allDefects.length;
                    if (allDefects.some(d => d.severity === 'high')) maxSeverity = 'high';
                    else if (allDefects.some(d => d.severity === 'medium')) maxSeverity = 'medium';
                    return allDefects.length > 0 ? {
                        defects: allDefects,
                        summary,
                        max_severity: maxSeverity,
                        total_defect_area_pct: 0
                    } : null;
                })(),
                // 3D Measurements data binding (from qwen_result dimensions)
                measurements3d: (() => {
                    // Get dimensions from first photo's AI result
                    for (const p of state.photos) {
                        const qr = p._aiResult?.raw?.qwen_result || p._aiResult?.qwen_result;
                        if (qr && qr.dimensions_estimate) {
                            const d = qr.dimensions_estimate;
                            return {
                                area_m2: d.area_m2 || null,
                                perimeter_m: d.perimeter_m || null,
                                height_m: d.height_m || null,
                                volume_m3: d.depth_m && d.area_m2 ? d.area_m2 * d.depth_m : null,
                                confidence: (qr.confidence || 50) / 100,
                                method: qr._mock ? 'mock_estimate' : 'qwen_vlm',
                            };
                        }
                    }
                    return null;
                })(),

                // ── Materials from catalog (AI_MAT_*) ──
                materials: (() => {
                    const srv = state._serverResult;
                    const items = [];
                    // 1. Extract from server result materials if present
                    if (srv && srv.materials && Array.isArray(srv.materials)) {
                        srv.materials.forEach(m => items.push(m));
                    }
                    // 2. Extract material items from estimate_items (added by aiServiceBridge)
                    if (srv && srv.estimate_items) {
                        srv.estimate_items
                            .filter(it => it.added_by === 'catalog_material' || it.item_type === 'material')
                            .forEach(it => items.push({
                                name: it.name || it.work_name,
                                unit: it.unit,
                                quantity: it.quantity,
                                unitPrice: it.unit_price || it.price,
                                price: it.unit_price || it.price,
                            }));
                    }
                    // 3. Pull from detailedEstimate sections
                    if (state._detailedEstimate && state._detailedEstimate.sections) {
                        state._detailedEstimate.sections.forEach(sec => {
                            (sec.items || []).forEach(item => {
                                (item.materials || []).forEach(m => {
                                    if (!items.some(x => x.name === m.name)) {
                                        items.push({
                                            name: m.name,
                                            unit: m.unit,
                                            quantity: m.quantity,
                                            unitPrice: m.unitPrice,
                                            price: m.unitPrice,
                                        });
                                    }
                                });
                            });
                        });
                    }
                    return items;
                })(),

                // ── Equipment from catalog (AI_EQ_*) ──
                equipment: (() => {
                    const srv = state._serverResult;
                    const items = [];
                    // 1. From server result equipment if present
                    if (srv && srv.equipment && Array.isArray(srv.equipment)) {
                        srv.equipment.forEach(e => items.push(e));
                    }
                    // 2. From estimate_items tagged as equipment
                    if (srv && srv.estimate_items) {
                        srv.estimate_items
                            .filter(it => it.added_by === 'catalog_equipment' || it.item_type === 'equipment')
                            .forEach(it => items.push({
                                name: it.name || it.work_name,
                                unit: it.unit || 'маш-ч',
                                quantity: it.quantity,
                                hours: it.machine_hours || it.quantity,
                                unitPrice: it.unit_price || it.price,
                                rentalRate: it.unit_price || it.price,
                            }));
                    }
                    // 3. From smart pipeline equipment section
                    if (state._detailedEstimate?._smart?.sections?.equipment) {
                        state._detailedEstimate._smart.sections.equipment.forEach(eq => {
                            if (!items.some(x => x.name === eq.name)) {
                                items.push({
                                    name: eq.name,
                                    unit: 'маш-ч',
                                    quantity: eq.machineHours || 1,
                                    hours: eq.machineHours || 1,
                                    unitPrice: eq.rentalRate || 0,
                                    rentalRate: eq.rentalRate || 0,
                                });
                            }
                        });
                    }
                    return items;
                })(),
            });

            if (filename) {
                toast(`✅ PDF "${filename}" скачан`, 'success');
            }
        } catch (e) {
            console.error('PDF generation error:', e);
            toast('❌ Ошибка генерации PDF: ' + e.message, 'error');
        }
    }

    // ========== SAVE ==========
    function saveEstimate() {
        const est = state._detailedEstimate;
        const srv = state._serverResult;
        const hasDetailed = !!est;
        const hasServer = !!(srv && srv.estimate_items && srv.estimate_items.length > 0);

        if (!hasDetailed && !hasServer) {
            toast('⚠️ Нет сметы для сохранения', 'warning');
            return;
        }

        const plan = state._buildPlanResult;
        const v3 = window.PhotoEstimateV3UI;
        const selectedScenario = v3 ? v3.getScenario() : 'standard';
        const catLabel = state.selectedCategory || srv?.intent?.objectType || srv?.objectType || 'auto';

        // Build totals from whichever source is available
        const totals = hasDetailed
            ? est.totals
            : { total: srv.estimate_total || 0, works: srv.estimate_total || 0, materials: 0 };

        const data = {
            category: catLabel,
            description: state.aiDescription,
            client: {
                name: state.clientName,
                phone: state.clientPhone,
                address: state.clientAddress,
                notes: state.clientNotes
            },
            estimate: hasDetailed ? est : { success: true, estimateItems: srv.estimate_items, totals },
            totals: totals,
            date: new Date().toISOString(),
            photos: state.photos.length,
            // V3 Plan data
            plan: plan ? {
                explanation: plan.explanation,
                scenarios: plan.scenarios,
                selectedScenario,
                warnings: plan.warnings,
                confidence: plan.confidence,
                objectType: plan.objectType,
            } : null,
            // Server metadata
            aiBackend: srv?.ai_backend || null,
            confidence: srv?.accuracy?.overallConfidence || plan?.confidence || null,
        };

        // Save to photoEstimates localStorage (with pruning)
        let saved = JSON.parse(localStorage.getItem('photoEstimates') || '[]');
        saved.unshift(data);
        // Pruning: keep max 100 entries, remove older than 30 days
        const maxAge = 30 * 24 * 60 * 60 * 1000;
        saved = saved.filter(e => !e.date || (Date.now() - new Date(e.date).getTime()) < maxAge).slice(0, 100);
        localStorage.setItem('photoEstimates', JSON.stringify(saved));

        // === Также сохраняем как ЧЕРНОВИК в buildEstimateOrders ===
        try {
            const draftOrder = {
                id: Date.now(),
                title: `${catLabel} — Оценка по фото`,
                category: catLabel,
                description: state.aiDescription || `Работы по категории: ${catLabel}`,
                clientName: state.clientName || 'Заказчик',
                clientPhone: state.clientPhone || '',
                clientAddress: state.clientAddress || '',
                clientNotes: state.clientNotes || '',
                status: 'draft',
                type: 'photo-estimate',
                budget: totals.total,
                total: totals.total,
                totalWork: totals.works,
                totalMaterial: totals.materials,
                totalHours: hasDetailed ? 0 : srv.estimate_items.reduce((s, it) => s + (it.labor_hours || 0), 0),
                sections: hasDetailed ? est.sections : undefined,
                estimateItems: hasServer ? srv.estimate_items : undefined,
                photos: state.photos.length,
                photoPreview: state.photos.length > 0 ? state.photos[0].dataUrl : null,
                createdAt: new Date().toISOString(),
                date: new Date().toISOString(),
                customerId: 'self',
                source: 'photo-estimate'
            };

            const orders = JSON.parse(localStorage.getItem('buildEstimateOrders') || '[]');
            orders.unshift(draftOrder);
            localStorage.setItem('buildEstimateOrders', JSON.stringify(orders));
        } catch (e) {
            console.error('Failed to save draft order:', e);
        }

        toast('✅ Оценка сохранена как черновик в «Мои заказы»!', 'success');

        // === Save to Backend API (if available) ===
        try {
            const qr = srv?.qwen_result || state.photos[0]?._aiResult?.raw?.qwen_result || state.photos[0]?._aiResult?.qwen_result;
            const apiData = {
                client_name: state.clientName || '',
                client_phone: state.clientPhone || '',
                client_address: state.clientAddress || '',
                client_notes: state.clientNotes || '',
                category: catLabel,
                object_type: qr?.objectType || plan?.objectType || '',
                description: state.aiDescription || '',
                region: state.selectedRegion || 'almaty',
                scenario: selectedScenario,
                estimate_items: hasDetailed ? (est.sections?.flatMap(s => s.items || []) || []) : (srv.estimate_items || []),
                estimate_total: totals.total || 0,
                estimate_confidence: plan?.confidence || srv?.accuracy?.overallConfidence || 0,
                ai_confidence: qr?.confidence || 0,
                detection_count: state._aiDetections?.length || 0,
                defect_count: qr?.defects_detected?.total || 0,
                qwen_scene: qr?.scene_description || '',
            };
            fetchWithRetry('http://localhost:8001/api/v1/estimates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData),
            }, 2).then(r => {
                r.json().then(d => console.log(`✅ Estimate saved to DB: ${d.id}`));
            }).catch(() => { }); // Silent fail — localStorage is primary
        } catch (e) {
            console.debug('Backend save skipped:', e.message);
        }
    }

    // ========== EXPORT ==========
    window.PhotoEstimateModule = {
        render,
        getState: () => ({ ...state }),
        /**
         * Called from AI chat bot to skip category and prefill description
         * @param {boolean} skip - whether to skip category
         * @param {string} description - prefill description text
         */
        setSkipCategory(skip, description) {
            state._skipCategory = !!skip;
            if (description) {
                state.aiDescription = description;
            }
            if (_container) render(_container, true);
        },

        /**
         * Set AI tariff (called from tariff cards UI)
         * @param {'top'|'maximum'|'standard'} tariff
         */
        _setTariff(tariff) {
            const mode = window.AIService ? window.AIService.getMode() : 'offline';
            if (mode === 'gemini' && window.GeminiService && window.GeminiService.setTariff) {
                window.GeminiService.setTariff(tariff);
            } else if (mode === 'chatgpt' && window.ChatGptService && window.ChatGptService.setTariff) {
                window.ChatGptService.setTariff(tariff);
            } else if (window.GeminiService && window.GeminiService.isConfigured()) {
                window.GeminiService.setTariff(tariff);
            } else if (window.ChatGptService && window.ChatGptService.isConfigured()) {
                window.ChatGptService.setTariff(tariff);
            }
            toast(`🧠 AI тариф: ${tariff}`, 'success');
            if (_container) render(_container, true);
        },

        /**
         * Set AI provider (called from provider toggle)
         * @param {'gemini'|'chatgpt'} provider
         */
        _setProvider(provider) {
            if (window.AIService && window.AIService.setPreferredProvider) {
                window.AIService.setPreferredProvider(provider);
            }
            const label = provider === 'gemini' ? '🌐 Google Gemini' : '🤖 OpenAI ChatGPT';
            toast(`${label} выбран`, 'success');
            if (_container) render(_container, true);
        },

        /**
         * Set analysis mode for Multi-Pass Engine (called from mode cards UI)
         * @param {''|'simple'|'complex'|'vip'} mode — empty string = auto
         */
        _setAnalysisMode(mode) {
            state.analysisMode = mode || null;
            const labels = { '': '🤖 Авто', simple: '⚡ Быстрый', complex: '🔬 Детальный', vip: '👑 VIP' };
            toast(`Режим анализа: ${labels[mode] || labels['']}`, 'success');
            if (_container) render(_container, true);
        }
    };

    console.log('✅ PhotoEstimateModule v3.0 loaded');
})();
