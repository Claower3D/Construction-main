// ========== VOICE INPUT MODULE ==========
// Web Speech API для голосового ввода позиций сметы
// Поддержка: русский, казахский, английский

(function () {
    'use strict';

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const isSupported = !!SpeechRecognition;

    let recognition = null;
    let isRecording = false;
    let lang = 'ru-RU';
    let items = [];        // recognized estimate items
    let transcript = '';   // current transcript
    let waveInterval = null;

    // ========== NLP: Pattern matching for construction items ==========
    const PATTERNS = [
        // Quantities + Materials
        { regex: /(\d+[\.,]?\d*)\s*(куб|м[³3]|кубометр)/i, unit: 'м³' },
        { regex: /(\d+[\.,]?\d*)\s*(квадрат|м[²2]|кв\.?\s*м)/i, unit: 'м²' },
        { regex: /(\d+[\.,]?\d*)\s*(кг|килограмм)/i, unit: 'кг' },
        { regex: /(\d+[\.,]?\d*)\s*(шт|штук)/i, unit: 'шт' },
        { regex: /(\d+[\.,]?\d*)\s*(п\.?\s*м|погонн)/i, unit: 'п.м.' },
        { regex: /(\d+[\.,]?\d*)\s*(тонн|т\b)/i, unit: 'т' },
        { regex: /(\d+[\.,]?\d*)\s*(литр|л\b)/i, unit: 'л' },
    ];

    const MATERIAL_KEYWORDS = {
        'бетон': { code: 'M200', category: 'concrete', icon: '🧱' },
        'бетон м300': { code: 'M300', category: 'concrete', icon: '🧱' },
        'бетон м400': { code: 'M400', category: 'concrete', icon: '🧱' },
        'арматура': { code: 'd12', category: 'rebar', icon: '🔩' },
        'арматура 10': { code: 'd10', category: 'rebar', icon: '🔩' },
        'арматура 16': { code: 'd16', category: 'rebar', icon: '🔩' },
        'кирпич': { code: 'brick_red', category: 'masonry', icon: '🧱' },
        'кирпич облиц': { code: 'brick_facing', category: 'masonry', icon: '🧱' },
        'газоблок': { code: 'block_gas_600', category: 'masonry', icon: '📦' },
        'пеноблок': { code: 'block_foam', category: 'masonry', icon: '📦' },
        'песок': { code: 'sand_career', category: 'aggregates', icon: '⛱️' },
        'щебень': { code: 'gravel_5_20', category: 'aggregates', icon: '🪨' },
        'пгс': { code: 'pgs', category: 'aggregates', icon: '🪨' },
        'опалубка': { code: 'formwork_plywood', category: 'formwork', icon: '🪵' },
        'утеплитель': { code: 'eps_100', category: 'insulation', icon: '🟡' },
        'минвата': { code: 'minwool_100', category: 'insulation', icon: '🟡' },
        'пенополистирол': { code: 'eps_100', category: 'insulation', icon: '🟡' },
        'металлочерепица': { code: 'metal_tile', category: 'roofing', icon: '🏠' },
        'профнастил': { code: 'profsheet_c20', category: 'roofing', icon: '🏠' },
        'гипсокартон': { code: 'gypsum_board', category: 'finishing', icon: '📋' },
        'штукатурка': { code: 'plaster_gips', category: 'finishing', icon: '🪣' },
        'краска': { code: 'paint_interior', category: 'finishing', icon: '🎨' },
        'плитка': { code: 'tile_floor', category: 'finishing', icon: '🔲' },
        'ламинат': { code: 'laminate_32', category: 'finishing', icon: '🪵' },
        'окно': { code: 'window_pvh_1200x1500', category: 'windows_doors', icon: '🪟' },
        'дверь': { code: 'door_interior', category: 'windows_doors', icon: '🚪' },
        'дверь входная': { code: 'door_metal_exterior', category: 'windows_doors', icon: '🚪' },
        'пена монтажная': { code: 'foam_mounting', category: 'windows_doors', icon: '💨' },
        'рубероид': { code: 'roofing_felt', category: 'insulation', icon: '📜' },
        'гвозди': { code: 'nail_100', category: 'fasteners', icon: '🔨' },
        'саморез': { code: 'screw_black', category: 'fasteners', icon: '🔩' },
    };

    const WORK_KEYWORDS = {
        'копка': { code: 'excavation_manual', category: 'earthwork', icon: '⛏️' },
        'экскаватор': { code: 'excavation_machine', category: 'earthwork', icon: '🚜' },
        'бетонировани': { code: 'concrete_pour', category: 'concreting', icon: '🏗️' },
        'армировани': { code: 'reinforcement', category: 'concreting', icon: '🔩' },
        'кладка': { code: 'brick_laying', category: 'masonry', icon: '🧱' },
        'штукатур': { code: 'plastering', category: 'finishing', icon: '🪣' },
        'покраска': { code: 'painting', category: 'finishing', icon: '🎨' },
        'утеплени': { code: 'wall_insulation', category: 'insulation_works', icon: '🟡' },
        'стяжка': { code: 'screed', category: 'flooring', icon: '📐' },
        'укладка плитк': { code: 'tile_laying', category: 'flooring', icon: '🔲' },
        'укладка ламинат': { code: 'laminate', category: 'flooring', icon: '🪵' },
        'монтаж окон': { code: 'window_install', category: 'window_door', icon: '🪟' },
        'монтаж двер': { code: 'door_interior_install', category: 'window_door', icon: '🚪' },
        'гидроизоляци': { code: 'waterproofing', category: 'foundation', icon: '💧' },
        'монтаж кровл': { code: 'metal_tile_install', category: 'roofing', icon: '🏠' },
    };

    // ========== PARSE TRANSCRIPT ==========
    function parseTranscript(text) {
        const lower = text.toLowerCase().trim();
        if (!lower || lower.length < 3) return null;

        // Extract quantity
        let quantity = 1;
        let unit = '';
        for (const p of PATTERNS) {
            const m = lower.match(p.regex);
            if (m) {
                quantity = parseFloat(m[1].replace(',', '.'));
                unit = p.unit;
                break;
            }
        }

        // Try to match material
        for (const [kw, info] of Object.entries(MATERIAL_KEYWORDS)) {
            if (lower.includes(kw)) {
                let price = 0;
                if (window.AIPriceDatabase) {
                    const p = window.AIPriceDatabase.getMaterialPrice(info.code);
                    if (p) { price = p.adjustedPrice; unit = unit || p.unit; }
                }
                return {
                    type: 'material', name: kw, code: info.code,
                    category: info.category, icon: info.icon,
                    quantity, unit, price,
                    source: text
                };
            }
        }

        // Try to match work
        for (const [kw, info] of Object.entries(WORK_KEYWORDS)) {
            if (lower.includes(kw)) {
                let price = 0;
                if (window.AIPriceDatabase) {
                    const p = window.AIPriceDatabase.getWorkPrice(info.code);
                    if (p) { price = p.adjustedPrice; unit = unit || p.unit; }
                }
                return {
                    type: 'work', name: kw, code: info.code,
                    category: info.category, icon: info.icon,
                    quantity, unit, price,
                    source: text
                };
            }
        }

        return null;
    }

    // ========== RENDER ==========
    function render() {
        let overlay = document.querySelector('.voice-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'voice-overlay';
            document.body.appendChild(overlay);
        }

        if (!isSupported) {
            overlay.innerHTML = `
                <button class="voice-close" onclick="VoiceInput.close()">✕</button>
                <div class="voice-not-supported">
                    <div class="icon">🎙️🚫</div>
                    <div class="msg">Голосовой ввод не поддерживается</div>
                    <div class="sub">Используйте Chrome или Edge для работы с Web Speech API</div>
                </div>`;
            return;
        }

        const waveBars = Array.from({ length: 20 }, (_, i) =>
            `<div class="voice-wave-bar" style="height:${8 + Math.random() * 4}px;animation-delay:${i * 0.05}s"></div>`
        ).join('');

        const itemsHTML = items.map((it, i) => `
            <div class="voice-item-card">
                <span class="voice-item-icon">${it.icon}</span>
                <div class="voice-item-info">
                    <div class="voice-item-name">${capitalize(it.name)}</div>
                    <div class="voice-item-detail">${it.quantity} ${it.unit} • ${it.type === 'material' ? 'Матер.' : 'Работа'}</div>
                </div>
                <span class="voice-item-price">${it.price ? (it.quantity * it.price).toLocaleString('ru-RU') + ' ₸' : '—'}</span>
                <button class="voice-item-remove" data-idx="${i}" onclick="VoiceInput._removeItem(${i})">✕</button>
            </div>
        `).join('');

        const totalSum = items.reduce((s, it) => s + (it.quantity * (it.price || 0)), 0);

        overlay.innerHTML = `
            <button class="voice-close" onclick="VoiceInput.close()">✕</button>
            <div class="voice-main">
                <div class="voice-lang">
                    <button class="voice-lang-btn ${lang === 'ru-RU' ? 'active' : ''}" onclick="VoiceInput._setLang('ru-RU')">🇷🇺 Русский</button>
                    <button class="voice-lang-btn ${lang === 'kk-KZ' ? 'active' : ''}" onclick="VoiceInput._setLang('kk-KZ')">🇰🇿 Қазақша</button>
                    <button class="voice-lang-btn ${lang === 'en-US' ? 'active' : ''}" onclick="VoiceInput._setLang('en-US')">🇺🇸 English</button>
                </div>

                <div class="voice-mic-wrap">
                    <button class="voice-mic-btn ${isRecording ? 'recording' : ''}" onclick="VoiceInput.toggle()">🎙️</button>
                    <div class="voice-ring"></div>
                    <div class="voice-ring"></div>
                    <div class="voice-ring"></div>
                </div>

                <div class="voice-waveform" id="voiceWaveform">${waveBars}</div>

                <div class="voice-status">${isRecording ? '🔴 Слушаю...' : 'Нажмите для начала записи'}</div>
                <div class="voice-transcript ${transcript ? '' : 'partial'}">${transcript || 'Скажите позицию сметы...'}</div>

                <div class="voice-hint">
                    💡 Примеры: «25 кубов бетона М300» • «100 квадратов кирпича» • «3 окна» • «штукатурка 50 квадратов»
                </div>

                ${items.length > 0 ? `
                <div class="voice-items">${itemsHTML}</div>
                <div style="text-align:center;margin-top:12px;font-size:15px;color:#f1f5f9;font-weight:700">
                    Итого: ${totalSum.toLocaleString('ru-RU')} ₸ (${items.length} поз.)
                </div>
                ` : ''}

                <div class="voice-actions">
                    ${items.length > 0 ? `
                    <button class="voice-btn voice-btn-secondary" onclick="VoiceInput._clearItems()">🗑️ Очистить</button>
                    <button class="voice-btn voice-btn-primary" onclick="VoiceInput._applyItems()">✅ Добавить в смету</button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

    // ========== RECOGNITION SETUP ==========
    function initRecognition() {
        if (recognition) return;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;
        recognition.maxAlternatives = 3;

        recognition.onresult = (e) => {
            let interim = '';
            let final = '';
            for (let i = e.resultIndex; i < e.results.length; i++) {
                const t = e.results[i][0].transcript;
                if (e.results[i].isFinal) {
                    final += t;
                } else {
                    interim += t;
                }
            }

            if (final) {
                transcript = final;
                const parsed = parseTranscript(final);
                if (parsed) {
                    items.push(parsed);
                }
                render();
            } else if (interim) {
                transcript = interim;
                const transcriptEl = document.querySelector('.voice-transcript');
                if (transcriptEl) {
                    transcriptEl.textContent = interim;
                    transcriptEl.className = 'voice-transcript partial';
                }
            }
        };

        recognition.onerror = (e) => {
            console.warn('Speech error:', e.error);
            if (e.error === 'not-allowed') {
                const statusEl = document.querySelector('.voice-status');
                if (statusEl) statusEl.textContent = '⚠️ Доступ к микрофону запрещён';
            }
        };

        recognition.onend = () => {
            if (isRecording) {
                // Restart if still recording
                try { recognition.start(); } catch (e) { /* */ }
            }
        };
    }

    // ========== WAVEFORM ANIMATION ==========
    function startWaveAnimation() {
        waveInterval = setInterval(() => {
            const bars = document.querySelectorAll('.voice-wave-bar');
            bars.forEach(bar => {
                const h = 6 + Math.random() * 28;
                bar.style.height = h + 'px';
            });
        }, 100);
    }

    function stopWaveAnimation() {
        clearInterval(waveInterval);
        const bars = document.querySelectorAll('.voice-wave-bar');
        bars.forEach(bar => { bar.style.height = '8px'; });
    }

    // ========== PUBLIC API ==========
    window.VoiceInput = {
        open() {
            items = [];
            transcript = '';
            isRecording = false;
            render();
        },

        close() {
            if (isRecording) this.toggle();
            document.querySelector('.voice-overlay')?.remove();
        },

        toggle() {
            if (!isSupported) return;
            initRecognition();

            if (isRecording) {
                isRecording = false;
                recognition.stop();
                stopWaveAnimation();
            } else {
                isRecording = true;
                recognition.lang = lang;
                try { recognition.start(); } catch (e) { /* already started */ }
                startWaveAnimation();
            }
            render();
        },

        _setLang(l) {
            lang = l;
            if (recognition) recognition.lang = l;
            render();
        },

        _removeItem(idx) {
            items.splice(idx, 1);
            render();
        },

        _clearItems() {
            items = [];
            transcript = '';
            render();
        },

        _applyItems() {
            // Emit event with recognized items for integration
            const event = new CustomEvent('voiceItemsReady', { detail: { items: [...items] } });
            document.dispatchEvent(event);
            console.log('🎤 Voice items applied:', items);
            (window.QazUI?.alert || function(t,m){window.showToast?.(m||t)})('✅ Позиции добавлены', `Добавлено ${items.length} позиций в смету (${items.reduce((s, it) => s + it.quantity * (it.price || 0), 0).toLocaleString('ru-RU')} ₸)`, { icon: '🎤' });
            items = [];
            transcript = '';
            render();
        },

        getItems() { return [...items]; },
        isSupported() { return isSupported; }
    };

    console.log(`✅ VoiceInput module loaded (Speech API ${isSupported ? 'supported' : 'NOT supported'})`);
})();
