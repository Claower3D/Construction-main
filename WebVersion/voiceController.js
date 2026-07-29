// ========== VOICE CONTROLLER ==========
// Центральный голосовой контроллер QazGost AI
// Объединяет: Web Speech API → CommandRouter → Adapters
// Режимы: COMMAND (распознание команд) | DICTATION (диктовка текста) | ITEMS (ввод позиций сметы)
// 
// Зависимости: voiceInput.js, commandRouter.js
// Опционально: voiceInput.css

(function () {
    'use strict';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    // ========== STATE ==========

    const STATE = {
        IDLE: 'idle',
        LISTENING: 'listening',
        PROCESSING: 'processing',
        CONFIRMING: 'confirming',
        ERROR: 'error'
    };

    const MODE = {
        COMMAND: 'command',      // Распознание голосовых команд
        DICTATION: 'dictation',  // Диктовка текста в поле
        ITEMS: 'items'           // Ввод позиций сметы (legacy VoiceInput)
    };

    let state = STATE.IDLE;
    let mode = MODE.COMMAND;
    let recognition = null;
    let lang = 'ru-RU';
    let currentTranscript = '';
    let pendingConfirmation = null;
    let targetField = null;       // For DICTATION mode
    let waveAnimInterval = null;
    let _consentGiven = false;
    let _onResultCallback = null;
    let _statusBarEl = null;

    // ========== CONSENT ==========

    function hasConsent() {
        if (_consentGiven) return true;
        try {
            return localStorage.getItem('voice_consent') === 'true';
        } catch {
            return false;
        }
    }

    function giveConsent() {
        _consentGiven = true;
        try {
            localStorage.setItem('voice_consent', 'true');
            localStorage.setItem('voice_consent_at', new Date().toISOString());
        } catch {}
    }

    function revokeConsent() {
        _consentGiven = false;
        try {
            localStorage.removeItem('voice_consent');
            localStorage.setItem('voice_consent_revoked_at', new Date().toISOString());
        } catch {}
    }

    async function showConsentModal() {
        return new Promise((resolve) => {
            // Check if modal already exists
            let modal = document.getElementById('voice-consent-modal');
            if (modal) { resolve(hasConsent()); return; }

            modal = document.createElement('div');
            modal.id = 'voice-consent-modal';
            modal.className = 'voice-consent-overlay';
            modal.innerHTML = `
                <div class="voice-consent-card">
                    <div class="voice-consent-icon">🎙️</div>
                    <h3>Голосовое управление</h3>
                    <p>Для голосового ввода QazGost AI использует микрофон вашего устройства.</p>
                    <ul>
                        <li>🔒 Аудио обрабатывается локально (Web Speech API)</li>
                        <li>🚫 Записи НЕ сохраняются на сервере</li>
                        <li>⚡ Вы можете отключить доступ в любой момент</li>
                    </ul>
                    <p class="voice-consent-lang">
                        Поддерживаемые языки: 🇷🇺 Русский • 🇰🇿 Қазақша • 🇺🇸 English
                    </p>
                    <div class="voice-consent-actions">
                        <button id="voice-consent-deny" class="voice-btn-secondary">Не сейчас</button>
                        <button id="voice-consent-allow" class="voice-btn-primary">🎙️ Разрешить</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Inject styles if not present
            if (!document.getElementById('voice-consent-styles')) {
                const style = document.createElement('style');
                style.id = 'voice-consent-styles';
                style.textContent = `
                    .voice-consent-overlay {
                        position: fixed; inset: 0; z-index: 100000;
                        background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
                        display: flex; align-items: center; justify-content: center;
                        animation: fadeIn 0.2s ease;
                    }
                    .voice-consent-card {
                        background: linear-gradient(145deg, #1e293b, #0f172a);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 20px; padding: 32px; max-width: 420px; width: 90%;
                        color: #e2e8f0; text-align: center;
                        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
                    }
                    .voice-consent-icon { font-size: 48px; margin-bottom: 16px; }
                    .voice-consent-card h3 { font-size: 1.3rem; margin-bottom: 12px; color: #f8fafc; }
                    .voice-consent-card p { font-size: 0.9rem; color: #94a3b8; margin-bottom: 16px; line-height: 1.5; }
                    .voice-consent-card ul {
                        list-style: none; padding: 0; margin: 0 0 16px 0; text-align: left;
                    }
                    .voice-consent-card li {
                        padding: 6px 0; font-size: 0.85rem; color: #cbd5e1;
                    }
                    .voice-consent-lang { font-size: 0.8rem !important; color: #64748b !important; }
                    .voice-consent-actions { display: flex; gap: 12px; margin-top: 20px; }
                    .voice-consent-actions button {
                        flex: 1; padding: 12px 20px; border-radius: 12px; border: none;
                        font-size: 0.95rem; font-weight: 600; cursor: pointer;
                        transition: all 0.2s ease;
                    }
                    .voice-btn-secondary {
                        background: rgba(255,255,255,0.08); color: #94a3b8;
                    }
                    .voice-btn-secondary:hover { background: rgba(255,255,255,0.15); }
                    .voice-btn-primary {
                        background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white;
                    }
                    .voice-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(59,130,246,0.3); }
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                `;
                document.head.appendChild(style);
            }

            document.getElementById('voice-consent-allow').onclick = () => {
                giveConsent();
                modal.remove();
                resolve(true);
            };

            document.getElementById('voice-consent-deny').onclick = () => {
                modal.remove();
                resolve(false);
            };
        });
    }

    // ========== RECOGNITION ENGINE ==========

    function initRecognition() {
        if (recognition) return;
        if (!isSupported) {
            console.warn('[VoiceController] SpeechRecognition not supported');
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        recognition.maxAlternatives = 3;

        recognition.onresult = handleResult;
        recognition.onerror = handleError;
        recognition.onend = handleEnd;
    }

    function handleResult(event) {
        let interim = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalText += transcript;
            } else {
                interim += transcript;
            }
        }

        // Update status bar with interim results
        if (interim) {
            updateStatusBar(interim, 'interim');
        }

        if (finalText) {
            currentTranscript = finalText;
            processFinalText(finalText);
        }
    }

    function handleError(event) {
        console.warn('[VoiceController] Speech error:', event.error);

        if (event.error === 'not-allowed') {
            state = STATE.ERROR;
            updateStatusBar('⚠️ Доступ к микрофону запрещён', 'error');
        } else if (event.error === 'no-speech') {
            updateStatusBar('🔇 Речь не обнаружена', 'warning');
        } else if (event.error === 'network') {
            updateStatusBar('🌐 Ошибка сети', 'error');
        }
    }

    function handleEnd() {
        if (state === STATE.LISTENING) {
            // Auto-restart if still in listening state
            try { recognition.start(); } catch (e) { /* already started */ }
        }
    }

    // ========== PROCESS FINAL TEXT ==========

    async function processFinalText(text) {
        state = STATE.PROCESSING;
        updateStatusBar(`⏳ ${text}`, 'processing');

        switch (mode) {
            case MODE.COMMAND: {
                // Try to parse as command
                const parsed = window.CommandRouter?.parseCommand(text, {
                    role: window.RoleManager?.current?.() || 'customer'
                });

                if (parsed) {
                    // Command recognized
                    if (parsed.requiresConfirm) {
                        // Need confirmation
                        pendingConfirmation = parsed;
                        state = STATE.CONFIRMING;
                        updateStatusBar(`❓ ${getCommandDescription(parsed)} — скажите «да» или «нет»`, 'confirm');
                        return;
                    }

                    // Execute immediately
                    const result = await window.CommandRouter.executeCommand(parsed, { skipConfirm: true });
                    if (result.success) {
                        updateStatusBar(`✅ ${getCommandDescription(parsed)}`, 'success');
                    } else {
                        updateStatusBar(`❌ ${result.error || 'Ошибка'}`, 'error');
                    }
                } else {
                    // Not a command — show as unrecognized
                    updateStatusBar(`🤔 «${text}» — команда не распознана`, 'warning');
                }

                state = STATE.LISTENING;
                break;
            }

            case MODE.DICTATION: {
                // Fill target field with dictated text
                if (targetField) {
                    const el = typeof targetField === 'string'
                        ? document.querySelector(targetField)
                        : targetField;

                    if (el) {
                        // Append or replace
                        if (el.value) {
                            el.value += ' ' + text;
                        } else {
                            el.value = text;
                        }
                        el.dispatchEvent(new Event('input', { bubbles: true }));
                        updateStatusBar(`📝 «${text}»`, 'success');
                    }
                }

                if (_onResultCallback) {
                    _onResultCallback(text);
                }

                state = STATE.LISTENING;
                break;
            }

            case MODE.ITEMS: {
                // Delegate to legacy VoiceInput for estimate items
                if (window.VoiceInput) {
                    // VoiceInput handles its own parsing
                    updateStatusBar(`🎤 ${text}`, 'info');
                }

                if (_onResultCallback) {
                    _onResultCallback(text);
                }

                state = STATE.LISTENING;
                break;
            }
        }
    }

    // ========== CONFIRMATION HANDLER ==========

    function handleConfirmation(text) {
        const lower = text.toLowerCase().trim();
        const isYes = /^(да|yes|подтверж|ок|ok|верно|точно|ладно)/.test(lower);
        const isNo = /^(нет|no|отмена|cancel|не|нее)/.test(lower);

        if (isYes && pendingConfirmation) {
            window.CommandRouter?.executeCommand(pendingConfirmation, { skipConfirm: true })
                .then(result => {
                    if (result.success) {
                        updateStatusBar(`✅ Выполнено`, 'success');
                    } else {
                        updateStatusBar(`❌ ${result.error}`, 'error');
                    }
                });
            pendingConfirmation = null;
            state = STATE.LISTENING;
        } else if (isNo) {
            pendingConfirmation = null;
            state = STATE.LISTENING;
            updateStatusBar('↩️ Отменено', 'info');
        }
        // else: neither yes nor no — keep waiting
    }

    // ========== STATUS BAR ==========

    function ensureStatusBar() {
        if (_statusBarEl && document.contains(_statusBarEl)) return;

        _statusBarEl = document.createElement('div');
        _statusBarEl.id = 'voice-status-bar';
        _statusBarEl.className = 'voice-status-bar hidden';
        _statusBarEl.innerHTML = `
            <div class="voice-status-indicator"></div>
            <div class="voice-status-text"></div>
            <div class="voice-status-actions">
                <button class="voice-mode-btn" onclick="VoiceController.cycleMode()" title="Сменить режим">
                    <span class="voice-mode-icon">🎯</span>
                </button>
                <button class="voice-lang-btn-mini" onclick="VoiceController.cycleLang()" title="Сменить язык">
                    <span class="voice-lang-icon">🇷🇺</span>
                </button>
                <button class="voice-close-btn" onclick="VoiceController.stop()" title="Остановить">✕</button>
            </div>
        `;
        document.body.appendChild(_statusBarEl);

        // Inject styles
        if (!document.getElementById('voice-controller-styles')) {
            const style = document.createElement('style');
            style.id = 'voice-controller-styles';
            style.textContent = `
                .voice-status-bar {
                    position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                    z-index: 99999; display: flex; align-items: center; gap: 12px;
                    background: linear-gradient(145deg, #1e293b, #0f172a);
                    border: 1px solid rgba(59,130,246,0.3);
                    border-radius: 16px; padding: 10px 16px; min-width: 320px; max-width: 600px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                    transition: all 0.3s ease; animation: slideUp 0.3s ease;
                }
                .voice-status-bar.hidden { display: none; }
                .voice-status-indicator {
                    width: 10px; height: 10px; border-radius: 50%;
                    background: #3b82f6; flex-shrink: 0;
                    animation: pulse 1.5s ease infinite;
                }
                .voice-status-bar.listening .voice-status-indicator { background: #22c55e; }
                .voice-status-bar.processing .voice-status-indicator { background: #f59e0b; animation: none; }
                .voice-status-bar.error .voice-status-indicator { background: #ef4444; animation: none; }
                .voice-status-bar.success .voice-status-indicator { background: #22c55e; animation: none; }
                .voice-status-bar.confirm .voice-status-indicator { background: #a855f7; }
                .voice-status-text {
                    flex: 1; color: #e2e8f0; font-size: 0.85rem; font-weight: 500;
                    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                }
                .voice-status-text.interim { color: #94a3b8; font-style: italic; }
                .voice-status-actions { display: flex; gap: 6px; flex-shrink: 0; }
                .voice-status-actions button {
                    width: 32px; height: 32px; border-radius: 8px; border: none;
                    background: rgba(255,255,255,0.08); color: #e2e8f0;
                    font-size: 14px; cursor: pointer; display: flex;
                    align-items: center; justify-content: center;
                    transition: all 0.2s ease;
                }
                .voice-status-actions button:hover {
                    background: rgba(255,255,255,0.15); transform: scale(1.05);
                }
                .voice-close-btn { color: #f87171 !important; font-weight: bold; }
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.85); }
                }

                /* Floating mic button */
                .voice-fab {
                    position: fixed; bottom: 80px; right: 20px; z-index: 99998;
                    width: 56px; height: 56px; border-radius: 50%; border: none;
                    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
                    color: white; font-size: 24px; cursor: pointer;
                    box-shadow: 0 4px 20px rgba(59,130,246,0.4);
                    transition: all 0.3s ease;
                    display: flex; align-items: center; justify-content: center;
                }
                .voice-fab:hover { transform: scale(1.1); box-shadow: 0 6px 30px rgba(59,130,246,0.5); }
                .voice-fab.active {
                    background: linear-gradient(135deg, #ef4444, #dc2626);
                    animation: fabPulse 1.5s ease infinite;
                }
                .voice-fab.hidden { display: none; }
                @keyframes fabPulse {
                    0%, 100% { box-shadow: 0 4px 20px rgba(239,68,68,0.4); }
                    50% { box-shadow: 0 4px 30px rgba(239,68,68,0.7); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    function updateStatusBar(text, type = 'info') {
        ensureStatusBar();
        _statusBarEl.classList.remove('hidden', 'listening', 'processing', 'error', 'success', 'confirm', 'warning');
        _statusBarEl.classList.add(type);

        const textEl = _statusBarEl.querySelector('.voice-status-text');
        if (textEl) {
            textEl.textContent = text;
            textEl.className = 'voice-status-text' + (type === 'interim' ? ' interim' : '');
        }

        // Update mode icon
        const modeIcon = _statusBarEl.querySelector('.voice-mode-icon');
        if (modeIcon) {
            const icons = { [MODE.COMMAND]: '🎯', [MODE.DICTATION]: '📝', [MODE.ITEMS]: '📦' };
            modeIcon.textContent = icons[mode] || '🎯';
        }

        // Update lang icon
        const langIcon = _statusBarEl.querySelector('.voice-lang-icon');
        if (langIcon) {
            const icons = { 'ru-RU': '🇷🇺', 'kk-KZ': '🇰🇿', 'en-US': '🇺🇸' };
            langIcon.textContent = icons[lang] || '🌐';
        }

        // Auto-hide success/error after 3s
        if (['success', 'error', 'warning'].includes(type)) {
            setTimeout(() => {
                if (state === STATE.LISTENING) {
                    updateStatusBar(getModeLabel(), 'listening');
                } else if (state === STATE.IDLE) {
                    hideStatusBar();
                }
            }, 3000);
        }
    }

    function hideStatusBar() {
        if (_statusBarEl) {
            _statusBarEl.classList.add('hidden');
        }
    }

    function getModeLabel() {
        switch (mode) {
            case MODE.COMMAND: return '🎯 Режим команд — слушаю...';
            case MODE.DICTATION: return '📝 Диктовка — говорите...';
            case MODE.ITEMS: return '📦 Ввод позиций сметы — говорите...';
            default: return '🎙️ Слушаю...';
        }
    }

    function getCommandDescription(parsed) {
        const descriptions = {
            navigate: `Навигация → ${parsed.command}`,
            form: `Форма: ${parsed.command}`,
            calendar: `Календарь: ${parsed.command}`,
            photoEstimate: `Оценка: ${parsed.command}`,
            order: `Заказ: ${parsed.command}`,
            defect: `Дефект: ${parsed.command}`,
            voice: `Голос: ${parsed.command}`
        };
        return descriptions[parsed.action] || parsed.intent;
    }

    // ========== FAB (Floating Action Button) ==========

    function ensureFAB() {
        if (document.getElementById('voice-fab-btn')) return;

        const fab = document.createElement('button');
        fab.id = 'voice-fab-btn';
        fab.className = 'voice-fab';
        fab.setAttribute('data-testid', 'voice-fab');
        fab.innerHTML = '🎙️';
        fab.title = 'Голосовое управление';
        fab.onclick = () => {
            if (state === STATE.LISTENING) {
                VoiceCtrl.stop();
            } else {
                VoiceCtrl.start();
            }
        };
        document.body.appendChild(fab);
    }

    function updateFAB() {
        const fab = document.getElementById('voice-fab-btn');
        if (!fab) return;

        if (state === STATE.LISTENING) {
            fab.classList.add('active');
            fab.innerHTML = '⏹️';
            fab.title = 'Остановить запись';
        } else {
            fab.classList.remove('active');
            fab.innerHTML = '🎙️';
            fab.title = 'Голосовое управление';
        }
    }

    // ========== PUBLIC API ==========

    const VoiceCtrl = {
        isSupported,

        /**
         * Start voice recognition
         * @param {object} options - { mode: 'command'|'dictation'|'items', lang: 'ru-RU', targetField: selector|element }
         */
        async start(options = {}) {
            if (!isSupported) {
                updateStatusBar('⚠️ Браузер не поддерживает голосовой ввод (используйте Chrome)', 'error');
                return false;
            }

            // Check/request consent
            if (!hasConsent()) {
                const allowed = await showConsentModal();
                if (!allowed) return false;
            }

            // Set mode
            mode = options.mode || MODE.COMMAND;
            lang = options.lang || lang;
            targetField = options.targetField || null;
            _onResultCallback = options.onResult || null;

            // Init recognition
            initRecognition();
            if (!recognition) return false;

            recognition.lang = lang;

            try {
                recognition.start();
                state = STATE.LISTENING;
                ensureStatusBar();
                updateStatusBar(getModeLabel(), 'listening');
                updateFAB();
                console.log(`[VoiceController] ▶️ Started in ${mode} mode (${lang})`);
                return true;
            } catch (e) {
                console.error('[VoiceController] Start error:', e);
                state = STATE.ERROR;
                updateStatusBar('❌ Ошибка запуска микрофона', 'error');
                return false;
            }
        },

        /**
         * Stop voice recognition
         */
        stop() {
            if (recognition) {
                state = STATE.IDLE;
                try { recognition.stop(); } catch (e) { /* */ }
            }
            state = STATE.IDLE;
            pendingConfirmation = null;
            hideStatusBar();
            updateFAB();
            console.log('[VoiceController] ⏹️ Stopped');
        },

        /**
         * Toggle voice on/off
         */
        toggle(options = {}) {
            if (state === STATE.LISTENING) {
                this.stop();
            } else {
                this.start(options);
            }
        },

        /**
         * Switch mode
         */
        setMode(newMode) {
            if (Object.values(MODE).includes(newMode)) {
                mode = newMode;
                if (state === STATE.LISTENING) {
                    updateStatusBar(getModeLabel(), 'listening');
                }
            }
        },

        /**
         * Cycle through modes
         */
        cycleMode() {
            const modes = [MODE.COMMAND, MODE.DICTATION, MODE.ITEMS];
            const idx = modes.indexOf(mode);
            mode = modes[(idx + 1) % modes.length];
            if (state === STATE.LISTENING) {
                updateStatusBar(getModeLabel(), 'listening');
            }
        },

        /**
         * Switch language
         */
        setLang(newLang) {
            lang = newLang;
            if (recognition) recognition.lang = newLang;
            if (state === STATE.LISTENING) {
                updateStatusBar(getModeLabel(), 'listening');
            }
        },

        /**
         * Cycle through languages
         */
        cycleLang() {
            const langs = ['ru-RU', 'kk-KZ', 'en-US'];
            const idx = langs.indexOf(lang);
            lang = langs[(idx + 1) % langs.length];
            if (recognition) recognition.lang = lang;
            if (state === STATE.LISTENING) {
                updateStatusBar(getModeLabel(), 'listening');
            }
        },

        /**
         * Get current state
         */
        getState() {
            return { state, mode, lang, isListening: state === STATE.LISTENING };
        },

        /**
         * Show/hide the floating microphone button
         */
        showFAB() { ensureFAB(); },
        hideFAB() {
            const fab = document.getElementById('voice-fab-btn');
            if (fab) fab.classList.add('hidden');
        },

        /**
         * Process text manually (for testing or text-based input)
         */
        async processText(text) {
            return processFinalText(text);
        },

        // Consent management
        hasConsent,
        giveConsent,
        revokeConsent,
        showConsentModal,

        // Constants
        STATE,
        MODE
    };

    window.VoiceController = VoiceCtrl;

    // Auto-show FAB if voice is enabled in config
    document.addEventListener('DOMContentLoaded', () => {
        const config = window.QAZGOST_CONFIG;
        if (config?.features?.voiceEnabled) {
            ensureFAB();
        }
    });

    console.log(`✅ VoiceController loaded (Speech API ${isSupported ? 'supported' : 'NOT supported'})`);
})();
