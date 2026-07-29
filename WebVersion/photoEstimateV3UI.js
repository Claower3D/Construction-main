// ============================================================
// photoEstimateV3UI.js — V3 UI Enhancement Layer
// QAZGOST AI v3.0
//
// Provides:
//   1. Mode selector (Quick / Full 3D / Contour)
//   2. Scenario cards (Economy / Standard / Premium)
//   3. Defect visualization
//   4. QTO smart questions
//   5. Contour drawing canvas
//   6. Scale calibration prompts
// ============================================================

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────
    // STATE
    // ─────────────────────────────────────────────────────────

    const V3State = {
        mode: 'quick',            // 'quick' | '3d' | 'contour'
        selectedScenario: 'standard',
        contourPoints: [],
        contourClosed: false,
        scaleMetersPerPixel: null,
        qtoAnswers: {},
        scenarioData: null,       // { economy, standard, premium }
        _pendingQuestions: [],    // questions from buildPlan/generateQuestions
        defects: [],
        scalePromptDismissed: false,
        _defectFilter: 'all',     // 'all' | 'high' | 'medium' | 'low'
    };

    // ─────────────────────────────────────────────────────────
    // 1. MODE SELECTOR TABS
    // ─────────────────────────────────────────────────────────

    function renderModeTabs() {
        const modes = [
            { id: 'quick', icon: '📸', label: 'Быстрый', hint: '1 фото' },
            { id: '3d', icon: '📐', label: 'Полный 3D', hint: '5-10 фото' },
            { id: 'contour', icon: '✏️', label: 'Контур', hint: 'рисовать на фото' },
        ];
        return `
            <div class="pe-mode-tabs" id="peModeSelector">
                ${modes.map(m => `
                    <button class="pe-mode-tab ${V3State.mode === m.id ? 'active' : ''}"
                            data-mode="${m.id}" id="peMode_${m.id}">
                        <span class="pe-mode-icon">${m.icon}</span>
                        <span class="pe-mode-label">${m.label}</span>
                        <span class="pe-mode-hint">${m.hint}</span>
                    </button>
                `).join('')}
            </div>
        `;
    }

    function bindModeTabs() {
        const tabs = document.querySelectorAll('.pe-mode-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                V3State.mode = tab.dataset.mode;
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Update UI visibility
                updateModeUI();
            });
        });
    }

    function updateModeUI() {
        // Show/hide contour section
        const contourSec = document.getElementById('peContourSection');
        if (contourSec) contourSec.style.display = V3State.mode === 'contour' ? '' : 'none';

        // Show/hide 3D tips
        const tipsSec = document.getElementById('pe3dTips');
        if (tipsSec) tipsSec.style.display = V3State.mode === '3d' ? '' : 'none';

        // Update analyze button text
        const btn = document.getElementById('peStartAnalysis');
        if (btn) {
            const labels = {
                quick: '🔍 Быстрый анализ (1 фото)',
                '3d': '📐 Полный 3D-анализ (SfM)',
                contour: '✏️ Рассчитать по контуру',
            };
            btn.textContent = labels[V3State.mode] || btn.textContent;
        }
    }

    // ─────────────────────────────────────────────────────────
    // 2. SCENARIO CARDS
    // ─────────────────────────────────────────────────────────

    function renderScenarios(baseTotal) {
        if (!baseTotal || baseTotal <= 0) return '';

        const fmt = n => Math.round(n).toLocaleString('ru-RU');

        const scenarios = [
            {
                id: 'economy', emoji: '🏠', name: 'Эконом',
                desc: 'Бюджетные материалы, базовый набор работ',
                mult: 0.70
            },
            {
                id: 'standard', emoji: '🏗️', name: 'Стандарт',
                desc: 'Оптимальное качество по рыночной цене',
                mult: 1.00
            },
            {
                id: 'premium', emoji: '✨', name: 'Премиум',
                desc: 'Люксовые материалы, расширенные работы',
                mult: 1.60
            },
        ];

        // Try to get real scenario data from QTOEngine
        if (window.QTOEngine && V3State.scenarioData) {
            const sd = V3State.scenarioData;
            return _renderScenarioCards(sd, baseTotal);
        }

        const cards = scenarios.map(s => {
            const total = baseTotal * s.mult;
            const diff = s.mult === 1.0 ? '' : (s.mult < 1 ? `−${Math.round((1 - s.mult) * 100)}%` : `+${Math.round((s.mult - 1) * 100)}%`);
            return `
                <div class="pe-scenario-card ${s.id} ${V3State.selectedScenario === s.id ? 'selected' : ''}"
                     data-scenario="${s.id}" id="peScenario_${s.id}">
                    <div class="pe-scenario-emoji">${s.emoji}</div>
                    <div class="pe-scenario-name">${s.name}</div>
                    <div class="pe-scenario-desc">${s.desc}</div>
                    <div class="pe-scenario-price">${fmt(total)} ₸</div>
                    ${diff ? `<div class="pe-scenario-diff">${diff} от стандарта</div>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="pe-scenarios" id="peScenariosSection">
                <div class="pe-scenarios-title">💡 Сценарии стоимости</div>
                <div class="pe-scenario-grid">${cards}</div>
            </div>
        `;
    }

    function _renderScenarioCards(scenarioData, baseTotal) {
        const fmt = n => Math.round(n).toLocaleString('ru-RU');
        const keys = ['economy', 'standard', 'premium'];
        const fallbackCfg = {
            economy: { emoji: '🏠', name: 'Эконом', desc: 'Бюджетные материалы' },
            standard: { emoji: '🏗️', name: 'Стандарт', desc: 'Оптимальное качество' },
            premium: { emoji: '✨', name: 'Премиум', desc: 'Люксовые материалы' },
        };

        const cards = keys.map(key => {
            const sd = scenarioData[key];
            if (!sd) return '';

            const emoji = sd.emoji || fallbackCfg[key].emoji;
            const name = sd.name || fallbackCfg[key].name;
            const desc = sd.desc || fallbackCfg[key].desc;
            const total = sd.totals?.grand || sd.total || baseTotal;
            const mult = sd.multiplier || 1;
            const diff = mult !== 1.0
                ? (mult < 1 ? `−${Math.round((1 - mult) * 100)}%` : `+${Math.round((mult - 1) * 100)}%`)
                : '';

            // Mini breakdown if available
            let breakdownHtml = '';
            if (sd.totals && sd.totals.works) {
                breakdownHtml = `
                    <div class="pe-scenario-breakdown">
                        <div>🔧 Работы: ${fmt(sd.totals.works)} ₸</div>
                        <div>🧱 Материалы: ${fmt(sd.totals.materials)} ₸</div>
                        ${sd.totals.hidden > 0 ? `<div>🔍 Скрытые: ${fmt(sd.totals.hidden)} ₸</div>` : ''}
                    </div>
                `;
            }

            return `
                <div class="pe-scenario-card ${key} ${V3State.selectedScenario === key ? 'selected' : ''}"
                     data-scenario="${key}" id="peScenario_${key}">
                    <div class="pe-scenario-emoji">${emoji}</div>
                    <div class="pe-scenario-name">${name}</div>
                    <div class="pe-scenario-desc">${desc}</div>
                    <div class="pe-scenario-price">${fmt(total)} ₸</div>
                    ${diff ? `<div class="pe-scenario-diff">${diff} от стандарта</div>` : ''}
                    ${breakdownHtml}
                </div>
            `;
        }).join('');

        return `
            <div class="pe-scenarios" id="peScenariosSection">
                <div class="pe-scenarios-title">💡 Сценарии стоимости</div>
                <div class="pe-scenario-grid">${cards}</div>
            </div>
        `;
    }

    function bindScenarioCards() {
        document.querySelectorAll('.pe-scenario-card').forEach(card => {
            card.addEventListener('click', () => {
                V3State.selectedScenario = card.dataset.scenario;
                document.querySelectorAll('.pe-scenario-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                // Emit event for parent module
                document.dispatchEvent(new CustomEvent('pe:scenarioChanged', {
                    detail: { scenario: V3State.selectedScenario }
                }));
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    // 3. DEFECT VISUALIZATION
    // ─────────────────────────────────────────────────────────

    function renderDefectsPanel(defects) {
        if (!defects || defects.length === 0) return '';

        const typeLabels = {
            crack: '🔨 Трещина',
            stain: '💧 Пятно / протечка',
            rust: '🟤 Ржавчина / коррозия',
        };

        const severityLabels = { low: 'Низкая', medium: 'Средняя', high: 'Высокая' };
        const severityColors = { low: '#4CAF50', medium: '#FF9800', high: '#F44336' };

        // Count by severity
        const counts = { all: defects.length, high: 0, medium: 0, low: 0 };
        defects.forEach(d => { const s = d.severity || 'medium'; if (counts[s] !== undefined) counts[s]++; });

        const activeFilter = V3State._defectFilter || 'all';
        const filtered = activeFilter === 'all' ? defects : defects.filter(d => (d.severity || 'medium') === activeFilter);

        const filterBtns = ['all', 'high', 'medium', 'low'].map(sev => {
            const label = sev === 'all' ? 'Все' : severityLabels[sev];
            const cnt = counts[sev];
            const active = activeFilter === sev ? 'pe-dfilt-active' : '';
            const color = sev === 'all' ? '#888' : severityColors[sev];
            return `<button class="pe-dfilt-btn ${active}" data-dsev="${sev}" style="border-color:${color};color:${active ? '#fff' : color};background:${active ? color : 'transparent'}">${label} (${cnt})</button>`;
        }).join('');

        const items = filtered.map(d => {
            // Support multiple data formats:
            // estimateService: { type, name, severity, description }
            // AI detections:   { className, name, confidence, category }
            // plan.defectRepairs: { name, reason, cost }
            const label = d.name || d.description || d.reason || typeLabels[d.type] || d.className || d.type || 'Дефект';
            const sev = d.severity || (d.confidence > 80 ? 'high' : d.confidence > 50 ? 'medium' : 'low') || 'medium';
            const area = d.area_percent ? `${(d.area_percent * 100).toFixed(1)}% поверхности` : '';
            return `
                <div class="pe-defect-item severity-${sev}">
                    <div class="pe-defect-type">${label}</div>
                    <span class="pe-defect-severity ${sev}" style="color:${severityColors[sev] || '#888'}">${severityLabels[sev] || sev}</span>
                    ${area ? `<span class="pe-defect-area">${area}</span>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="pe-defects-panel" id="peDefectsPanel">
                <div class="pe-defects-title">⚠️ Обнаруженные дефекты (${defects.length})</div>
                <div style="display:flex;gap:6px;margin-bottom:10px;flex-wrap:wrap">${filterBtns}</div>
                <div class="pe-defect-list">${items.length > 0 ? items : '<div style="color:#888;padding:8px">Нет дефектов с такой степенью</div>'}</div>
            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────
    // 4. QTO SMART QUESTIONS
    // ─────────────────────────────────────────────────────────

    function renderQTOQuestions(questions) {
        if (!questions || questions.length === 0) return '';

        const inputs = questions.map((q, i) => {
            const id = `peQto_${q.key || i}`;

            if (q.type === 'slider') {
                const val = V3State.qtoAnswers[q.key] || q.default || q.min;
                return `
                    <div class="pe-qto-question">
                        <label class="pe-qto-label">${q.label}</label>
                        <div class="pe-qto-range-container">
                            <input type="range" class="pe-qto-range" id="${id}"
                                   data-key="${q.key}" min="${q.min}" max="${q.max}"
                                   step="${q.step || 1}" value="${val}">
                            <span class="pe-qto-range-val" id="${id}_val">${val} ${q.unit || ''}</span>
                        </div>
                    </div>
                `;
            }

            if (q.type === 'select') {
                const opts = (q.options || []).map(o => {
                    const sel = V3State.qtoAnswers[q.key] === o.value ? 'selected' : '';
                    return `<option value="${o.value}" ${sel}>${o.label}</option>`;
                }).join('');
                return `
                    <div class="pe-qto-question">
                        <label class="pe-qto-label">${q.label}</label>
                        <select class="pe-qto-select" id="${id}" data-key="${q.key}">${opts}</select>
                    </div>
                `;
            }

            if (q.type === 'boolean') {
                const on = V3State.qtoAnswers[q.key] === true || V3State.qtoAnswers[q.key] === 'true';
                return `
                    <div class="pe-qto-question">
                        <div class="pe-qto-toggle" id="${id}" data-key="${q.key}">
                            <div class="pe-qto-switch ${on ? 'on' : ''}"></div>
                            <span class="pe-qto-label" style="margin:0">${q.label}</span>
                        </div>
                    </div>
                `;
            }

            // Default: number input
            const val = V3State.qtoAnswers[q.key] || q.default || '';
            return `
                <div class="pe-qto-question">
                    <label class="pe-qto-label">${q.label}</label>
                    <input type="number" class="pe-qto-input" id="${id}"
                           data-key="${q.key}" value="${val}"
                           placeholder="${q.placeholder || ''}"
                           ${q.min !== undefined ? `min="${q.min}"` : ''}
                           ${q.max !== undefined ? `max="${q.max}"` : ''}>
                </div>
            `;
        }).join('');

        return `
            <div class="pe-qto-questions" id="peQtoQuestions">
                <div class="pe-qto-title">📋 Уточните параметры для точного расчёта</div>
                ${inputs}
                <button class="pe-qto-apply-btn" id="peQtoApply">✨ Пересчитать с уточнениями</button>
            </div>
        `;
    }

    function bindQTOQuestions() {
        // Range sliders
        document.querySelectorAll('.pe-qto-range').forEach(slider => {
            slider.addEventListener('input', () => {
                const key = slider.dataset.key;
                const val = parseFloat(slider.value);
                V3State.qtoAnswers[key] = val;
                const display = document.getElementById(slider.id + '_val');
                if (display) display.textContent = `${val} ${slider.dataset.unit || ''}`;
            });
        });

        // Selects
        document.querySelectorAll('.pe-qto-select').forEach(sel => {
            sel.addEventListener('change', () => {
                V3State.qtoAnswers[sel.dataset.key] = sel.value;
            });
        });

        // Toggles
        document.querySelectorAll('.pe-qto-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => {
                const sw = toggle.querySelector('.pe-qto-switch');
                const on = !sw.classList.contains('on');
                sw.classList.toggle('on', on);
                V3State.qtoAnswers[toggle.dataset.key] = on;
            });
        });

        // Number inputs
        document.querySelectorAll('.pe-qto-input[type="number"]').forEach(inp => {
            inp.addEventListener('change', () => {
                V3State.qtoAnswers[inp.dataset.key] = parseFloat(inp.value);
            });
        });

        // Apply button
        const applyBtn = document.getElementById('peQtoApply');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                document.dispatchEvent(new CustomEvent('pe:qtoAnswered', {
                    detail: { answers: { ...V3State.qtoAnswers } }
                }));
            });
        }
    }

    // ─────────────────────────────────────────────────────────
    // 5. CONTOUR DRAWING CANVAS
    // ─────────────────────────────────────────────────────────

    function renderContourSection() {
        return `
            <div id="peContourSection" style="display:${V3State.mode === 'contour' ? '' : 'none'}">
                <div class="pe-scale-prompt" id="peScalePrompt"
                     style="display:${V3State.scalePromptDismissed ? 'none' : ''}">
                    <span class="pe-scale-icon">📏</span>
                    <div class="pe-scale-text">
                        <strong>Укажите масштаб:</strong> для точного расчёта площади введите 
                        реальный размер объекта на фото (например, высоту двери, ширину окна).
                    </div>
                    <div class="pe-scale-actions">
                        <button class="pe-scale-btn" id="peScaleManual">Ввести размер</button>
                        <button class="pe-scale-btn" id="peScaleDismiss">Пропустить</button>
                    </div>
                </div>

                <div class="pe-contour-toolbar">
                    <button class="pe-contour-btn active" id="peContourDraw">✏️ Рисовать</button>
                    <button class="pe-contour-btn" id="peContourUndo">↩️ Отмена</button>
                    <button class="pe-contour-btn" id="peContourClear">🗑️ Очистить</button>
                    <button class="pe-contour-btn" id="peContourClose">✅ Замкнуть</button>
                </div>

                <div class="pe-contour-container" id="peContourContainer">
                    <img id="peContourImg" src="" alt="Фото для контура">
                    <canvas class="pe-contour-canvas" id="peContourCanvas"></canvas>
                </div>

                <div class="pe-contour-info" id="peContourInfo">
                    Кликните на фото, чтобы расставить точки контура. Нажмите «Замкнуть» для расчёта.
                </div>

                <div class="pe-contour-measurements" id="peContourMeasurements" style="display:none">
                    <div class="pe-contour-measurement">
                        <div class="pe-contour-value" id="peContourArea">0</div>
                        <div class="pe-contour-unit">м² площадь</div>
                    </div>
                    <div class="pe-contour-measurement">
                        <div class="pe-contour-value" id="peContourPerimeter">0</div>
                        <div class="pe-contour-unit">п.м. периметр</div>
                    </div>
                </div>
            </div>
        `;
    }

    function bindContourCanvas() {
        const canvas = document.getElementById('peContourCanvas');
        const container = document.getElementById('peContourContainer');
        const img = document.getElementById('peContourImg');
        if (!canvas || !container || !img) return;

        // Load the first photo if available (sync from parent module)
        const photos = window._pePhotos
            || (window.PhotoEstimateModule && window.PhotoEstimateModule.getState().photos)
            || [];
        if (photos.length > 0 && photos[0].dataUrl) {
            img.src = photos[0].dataUrl;
        }

        img.onload = () => {
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            redrawContour();
        };

        // Click to add point
        canvas.addEventListener('click', (e) => {
            if (V3State.contourClosed) return;

            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const x = (e.clientX - rect.left) * scaleX;
            const y = (e.clientY - rect.top) * scaleY;

            V3State.contourPoints.push({ x, y });
            redrawContour();
        });

        // Undo
        document.getElementById('peContourUndo')?.addEventListener('click', () => {
            V3State.contourPoints.pop();
            V3State.contourClosed = false;
            redrawContour();
            hideContourMeasurements();
        });

        // Clear
        document.getElementById('peContourClear')?.addEventListener('click', () => {
            V3State.contourPoints = [];
            V3State.contourClosed = false;
            redrawContour();
            hideContourMeasurements();
        });

        // Close
        document.getElementById('peContourClose')?.addEventListener('click', () => {
            if (V3State.contourPoints.length < 3) return;
            V3State.contourClosed = true;
            redrawContour();
            calculateContourMeasurements();
        });

        // Scale prompt
        document.getElementById('peScaleDismiss')?.addEventListener('click', () => {
            V3State.scalePromptDismissed = true;
            const prompt = document.getElementById('peScalePrompt');
            if (prompt) prompt.style.display = 'none';
        });

        document.getElementById('peScaleManual')?.addEventListener('click', async () => {
            const promptFn = window.QazUI?.prompt || window.prompt;
            const meters = await promptFn(
                'Реальный размер объекта',
                'Введите длину какого-либо объекта на фото (в метрах)',
                { icon: '📏', defaultValue: '2.1', inputType: 'number', placeholder: 'например: 2.1' }
            );
            if (!meters) return;
            const pixels = await promptFn(
                'Размер в пикселях',
                'Введите длину этого же объекта на фото (в пикселях)',
                { icon: '🔍', defaultValue: '200', inputType: 'number', placeholder: 'например: 200' }
            );
            if (!pixels) return;
            V3State.scaleMetersPerPixel = parseFloat(meters) / parseFloat(pixels);
            V3State.scalePromptDismissed = true;
            const promptEl = document.getElementById('peScalePrompt');
            if (promptEl) promptEl.style.display = 'none';
            if (V3State.contourClosed) calculateContourMeasurements();
        });
    }

    function redrawContour() {
        const canvas = document.getElementById('peContourCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const pts = V3State.contourPoints;
        if (pts.length === 0) return;

        // Draw lines
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x, pts[i].y);
        }
        if (V3State.contourClosed) {
            ctx.closePath();
            ctx.fillStyle = 'rgba(139, 92, 246, 0.15)';
            ctx.fill();
        }
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = Math.max(2, canvas.width / 400);
        ctx.stroke();

        // Draw points
        pts.forEach((p, i) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(4, canvas.width / 200), 0, Math.PI * 2);
            ctx.fillStyle = i === 0 ? '#22c55e' : '#8b5cf6';
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        // Update info
        const info = document.getElementById('peContourInfo');
        if (info) {
            if (V3State.contourClosed) {
                info.textContent = `✅ Контур замкнут (${pts.length} точек)`;
            } else {
                info.textContent = `Точек: ${pts.length}. ${pts.length < 3 ? 'Добавьте ещё.' : 'Нажмите «Замкнуть».'}`;
            }
        }
    }

    function calculateContourMeasurements() {
        const pts = V3State.contourPoints;
        if (pts.length < 3) return;

        // Shoelace formula for area (in pixels)
        let areaPixels = 0;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            areaPixels += pts[j].x * pts[i].y - pts[i].x * pts[j].y;
        }
        areaPixels = Math.abs(areaPixels) / 2;

        // Perimeter in pixels
        let perimeterPixels = 0;
        for (let i = 0; i < pts.length; i++) {
            const next = pts[(i + 1) % pts.length];
            perimeterPixels += Math.sqrt((next.x - pts[i].x) ** 2 + (next.y - pts[i].y) ** 2);
        }

        // Convert to meters
        const scale = V3State.scaleMetersPerPixel || 0.005; // default fallback
        const areaM2 = areaPixels * scale * scale;
        const perimeterM = perimeterPixels * scale;

        // Show
        const measurements = document.getElementById('peContourMeasurements');
        if (measurements) measurements.style.display = '';

        const areaEl = document.getElementById('peContourArea');
        const perimEl = document.getElementById('peContourPerimeter');
        if (areaEl) areaEl.textContent = areaM2.toFixed(2);
        if (perimEl) perimEl.textContent = perimeterM.toFixed(2);

        // Emit event
        document.dispatchEvent(new CustomEvent('pe:contourMeasured', {
            detail: { areaM2, perimeterM, points: pts, scale }
        }));
    }

    function hideContourMeasurements() {
        const el = document.getElementById('peContourMeasurements');
        if (el) el.style.display = 'none';
    }

    // ─────────────────────────────────────────────────────────
    // 6. 3D MODE TIPS
    // ─────────────────────────────────────────────────────────

    function render3DTips() {
        return `
            <div id="pe3dTips" class="pe-upload-tips" style="display:${V3State.mode === '3d' ? '' : 'none'}">
                <span class="pe-tips-icon">📐</span>
                <div class="pe-tips-text">
                    <strong>Полный 3D-анализ:</strong> загрузите 5–10 фото объекта с разных ракурсов.
                    Для точного масштаба положите <strong>ArUco маркер</strong> или лист А4 рядом с объектом.
                    Система автоматически построит 3D-облако точек и извлечёт реальные размеры.
                </div>
            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────
    // INTEGRATION WITH PhotoEstimateEngine
    // ─────────────────────────────────────────────────────────

    /**
     * Run V3 analysis based on selected mode.
     * Called from photoEstimateModule.js after all AI detections complete.
     */
    async function runV3Analysis(photos, detections, opts = {}) {
        const engine = window.PhotoEstimateEngine;
        if (!engine) {
            console.warn('[V3UI] PhotoEstimateEngine not loaded');
            return null;
        }

        try {
            let result;
            if (V3State.mode === 'quick' && photos.length > 0) {
                result = await engine.estimateByPhoto(photos[0].file || photos[0].dataUrl, {
                    region: opts.region || 'almaty',
                    userAnswers: V3State.qtoAnswers,
                });
            } else if (V3State.mode === '3d' && photos.length >= 3) {
                const files = photos.map(p => p.file).filter(Boolean);
                result = await engine.estimateBy5Photos(files, {
                    region: opts.region || 'almaty',
                    userAnswers: V3State.qtoAnswers,
                });
            } else if (V3State.mode === 'contour' && V3State.contourClosed) {
                const photoFile = photos[0]?.file || photos[0]?.dataUrl;
                result = await engine.estimateByContour(photoFile, V3State.contourPoints, {
                    region: opts.region || 'almaty',
                    scaleMetersPerPixel: V3State.scaleMetersPerPixel,
                    userAnswers: V3State.qtoAnswers,
                });
            }

            if (result && result.scenarios) {
                V3State.scenarioData = result.scenarios;
            }
            if (result && result.defects) {
                V3State.defects = result.defects;
            }
            if (result && result.questions) {
                V3State._pendingQuestions = result.questions;
            }

            return result;
        } catch (err) {
            console.error('[V3UI] Analysis error:', err);
            return null;
        }
    }

    // ─────────────────────────────────────────────────────────
    // 7. CONFIDENCE PANEL
    // ─────────────────────────────────────────────────────────

    /**
     * Render a confidence indicator panel with animated gradient bar.
     * @param {object} data — { overall: 0-1, breakdown: { detection, scale, user_input } }
     */
    function renderConfidencePanel(data) {
        if (!data || typeof data.overall !== 'number') return '';

        const pct = Math.round(data.overall * 100);
        const getColor = (v) => {
            if (v >= 0.8) return { start: '#10b981', end: '#059669', label: 'Высокая' };
            if (v >= 0.5) return { start: '#f59e0b', end: '#d97706', label: 'Средняя' };
            return { start: '#ef4444', end: '#dc2626', label: 'Низкая' };
        };
        const color = getColor(data.overall);

        const breakdownItems = [];
        const bd = data.breakdown || {};
        const sources = [
            { key: 'detection', icon: '🔍', label: 'AI детекция' },
            { key: 'scale', icon: '📏', label: 'Масштаб' },
            { key: 'user_input', icon: '✏️', label: 'Ввод' },
            { key: 'vlm', icon: '🧠', label: 'VLM анализ' },
        ];
        sources.forEach(s => {
            if (bd[s.key] !== undefined) {
                breakdownItems.push(`
                    <div class="pe-confidence-item">
                        <div class="pe-confidence-item-label">${s.icon} ${s.label}</div>
                        <div class="pe-confidence-item-value">${Math.round(bd[s.key] * 100)}%</div>
                    </div>
                `);
            }
        });

        return `
            <div class="pe-confidence-panel pe-fade-in" id="peConfidencePanel">
                <div class="pe-confidence-header">
                    <div class="pe-confidence-title">📊 Уверенность оценки</div>
                    <div class="pe-confidence-value"
                         style="--conf-color-start:${color.start};--conf-color-end:${color.end}">
                        ${pct}% — ${color.label}
                    </div>
                </div>
                <div class="pe-confidence-bar-track">
                    <div class="pe-confidence-bar-fill" 
                         style="width:${pct}%;background:linear-gradient(90deg,${color.start},${color.end})">
                    </div>
                </div>
                ${breakdownItems.length > 0 ? `
                    <div class="pe-confidence-breakdown">${breakdownItems.join('')}</div>
                ` : ''}
            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────
    // 8. STEP TIMINGS
    // ─────────────────────────────────────────────────────────

    /**
     * Render pipeline step timings as colored chips.
     * @param {object} timings — { step_name: duration_seconds, ... }
     */
    function renderStepTimings(timings) {
        if (!timings || typeof timings !== 'object') return '';

        const STEP_LABELS = {
            'canvas_ai': '🔬 Canvas AI',
            'rfdetr': '🎯 RF-DETR',
            'grounding_dino': '🔎 G-DINO',
            'gdino_defects': '🔨 Дефекты (DINO)',
            'sam': '🎨 SAM сегментация',
            'vlm': '🧠 VLM анализ',
            'merging': '🔗 Слияние',
            'estimator': '💰 Смета',
            'calibrator': '📏 Калибровка',
            'total': '⏱️ Всего',
        };

        const entries = Object.entries(timings).filter(([k]) => k !== 'total');
        const totalSec = timings.total || entries.reduce((s, [, v]) => s + v, 0);

        const chips = entries.map(([step, sec]) => {
            const ms = Math.round(sec * 1000);
            const label = STEP_LABELS[step] || step;
            let speed = 'fast';
            if (sec > 5) speed = 'slow';
            else if (sec > 1) speed = 'medium';

            return `
                <div class="pe-step-chip ${speed}">
                    <span class="pe-step-chip-icon">✅</span>
                    ${label}
                    <span class="pe-step-chip-time">${ms > 1000 ? (sec).toFixed(1) + 's' : ms + 'ms'}</span>
                </div>
            `;
        }).join('');

        const totalMs = Math.round(totalSec * 1000);
        const totalLabel = totalMs > 1000 ? (totalSec).toFixed(1) + ' сек' : totalMs + ' мс';

        return `
            <div class="pe-step-timings pe-fade-in" id="peStepTimings">
                <div class="pe-step-timings-title">⚡ Время анализа по шагам</div>
                <div class="pe-step-timings-grid">${chips}</div>
                <div class="pe-step-total">Общее время: <strong>${totalLabel}</strong></div>
            </div>
        `;
    }

    // ─────────────────────────────────────────────────────────
    // 9. SAM OVERLAY
    // ─────────────────────────────────────────────────────────

    let _samOverlayVisible = false;
    let _samOverlayData = null;

    /**
     * Render SAM segmentation masks overlay on a canvas.
     * @param {HTMLCanvasElement|string} canvasOrId — canvas element or its ID
     * @param {Array} masks — [{ class_name, mask_rle, bbox, confidence }]
     * @param {Array} detections — [{ label, bbox }]
     * @returns {string} HTML for toggle button + legend
     */
    function renderSAMOverlay(canvasOrId, masks, detections) {
        if (!masks || masks.length === 0) return '';

        const canvas = typeof canvasOrId === 'string'
            ? document.getElementById(canvasOrId)
            : canvasOrId;

        _samOverlayData = { canvas, masks, detections };

        // Get color map from AIService or fallback
        const COLORS = window.AIService?.CLASS_COLORS || {
            wall: '#4CAF50', floor: '#2196F3', ceiling: '#9C27B0',
            window: '#FF9800', door: '#F44336', crack: '#E91E63',
            stain: '#795548', rust: '#FF5722', pipe: '#607D8B',
        };
        const LABELS_RU = window.AIService?.CLASS_NAMES_RU || {};

        // Build legend items
        const seenClasses = new Set();
        masks.forEach(m => seenClasses.add(m.class_name || m.label || 'unknown'));

        const legend = [...seenClasses].map(cls => {
            const color = COLORS[cls] || '#888';
            const label = LABELS_RU[cls] || cls;
            return `
                <div class="pe-sam-legend-item">
                    <span class="pe-sam-legend-dot" style="background:${color}"></span>
                    ${label}
                </div>
            `;
        }).join('');

        return `
            <div id="peSAMOverlayControls">
                <button class="pe-sam-overlay-toggle ${_samOverlayVisible ? 'active' : ''}"
                        id="peSAMToggle">
                    🎨 ${_samOverlayVisible ? 'Скрыть маски' : 'Показать маски SAM'}
                </button>
                <div class="pe-sam-legend">${legend}</div>
            </div>
        `;
    }

    function _drawSAMOverlay() {
        if (!_samOverlayData || !_samOverlayData.canvas) return;

        const { canvas, masks } = _samOverlayData;
        const ctx = canvas.getContext('2d');
        const COLORS = window.AIService?.CLASS_COLORS || {};

        masks.forEach(mask => {
            const cls = mask.class_name || mask.label || 'unknown';
            const color = COLORS[cls] || '#888888';
            const alpha = 0.3;

            // If bbox is available, draw a filled rectangle
            if (mask.bbox && mask.bbox.length === 4) {
                const [x1, y1, x2, y2] = mask.bbox;

                // Parse color to rgba
                ctx.fillStyle = _hexToRgba(color, alpha);
                ctx.fillRect(x1, y1, x2 - x1, y2 - y1);

                // Border
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                // Label
                const label = window.AIService?.CLASS_NAMES_RU?.[cls] || cls;
                const conf = mask.confidence ? ` ${Math.round(mask.confidence * 100)}%` : '';
                ctx.font = `bold ${Math.max(12, canvas.width / 60)}px Inter, sans-serif`;
                const textW = ctx.measureText(label + conf).width;
                ctx.fillStyle = color;
                ctx.fillRect(x1, y1 - 18, textW + 10, 18);
                ctx.fillStyle = '#fff';
                ctx.fillText(label + conf, x1 + 5, y1 - 4);
            }

            // If mask_pixels (flat array of 0/1) is available, draw pixel-by-pixel
            if (mask.mask_pixels && canvas.width > 0) {
                const imgData = ctx.createImageData(canvas.width, canvas.height);
                const r = parseInt(color.slice(1, 3), 16);
                const g = parseInt(color.slice(3, 5), 16);
                const b = parseInt(color.slice(5, 7), 16);

                for (let i = 0; i < mask.mask_pixels.length; i++) {
                    if (mask.mask_pixels[i]) {
                        const idx = i * 4;
                        imgData.data[idx] = r;
                        imgData.data[idx + 1] = g;
                        imgData.data[idx + 2] = b;
                        imgData.data[idx + 3] = Math.round(alpha * 255);
                    }
                }
                ctx.putImageData(imgData, 0, 0);
            }
        });
    }

    function _clearSAMOverlay() {
        if (!_samOverlayData || !_samOverlayData.canvas) return;
        const { canvas } = _samOverlayData;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Redraw contour if it exists
        if (typeof redrawContour === 'function') redrawContour();
    }

    function bindSAMToggle() {
        const btn = document.getElementById('peSAMToggle');
        if (!btn) return;
        btn.addEventListener('click', () => {
            _samOverlayVisible = !_samOverlayVisible;
            btn.classList.toggle('active', _samOverlayVisible);
            btn.textContent = _samOverlayVisible ? '🎨 Скрыть маски' : '🎨 Показать маски SAM';

            if (_samOverlayVisible) {
                _drawSAMOverlay();
            } else {
                _clearSAMOverlay();
            }
        });
    }

    function _hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // ─────────────────────────────────────────────────────────
    // 10. SESSION STATUS BANNER
    // ─────────────────────────────────────────────────────────

    /**
     * Render a session status banner with accuracy, next actions, and pipeline steps.
     * @param {object} result — ResultContract from SessionStatus.evaluate()
     */
    function renderSessionStatusBanner(result) {
        if (!result || !result.sessionStatus) return '';

        const SS = window.SessionStatus;
        if (!SS) return '';

        const ui = SS.STATUS_UI[result.sessionStatus] || {};
        const acc = result.accuracy || {};

        // ── Status Header ──
        const accuracyLevel = acc.level === 'exact' ? 'Точный' : 'Оценочный';
        const overallPct = Math.round((acc.overallConfidence || 0) * 100);

        // ── Accuracy Breakdown ──
        const typePct = Math.round((acc.typeConfidence || 0) * 100);
        const dimPct = Math.round((acc.dimConfidence || 0) * 100);

        const dimSourceLabels = {
            sfm_3d: '3D реконструкция',
            aruco: 'ArUco маркер',
            a4: 'Лист A4',
            manual: 'Ручной ввод',
            exif: 'EXIF данные',
            template: 'Из описания',
            none: 'Нет данных',
        };

        // ── Next Actions Buttons ──
        const actionsHtml = (result.nextActions || []).map(a => {
            return `<button class="pe-next-action-btn" data-action="${a.action}" 
                            style="background:${ui.bg};border:1px solid ${ui.color}33;color:${ui.color};"
                            title="${a.hint}">
                        ${a.icon} ${a.hint}
                    </button>`;
        }).join('');

        // ── Pipeline Steps Grid ──
        let stepsHtml = '';
        if (result.pipelineSteps) {
            const stepEntries = Object.entries(result.pipelineSteps);
            stepsHtml = stepEntries.map(([key, status]) => {
                const stepUI = SS.PIPELINE_STEP_UI[key] || { icon: '⚙️', label: key };
                const statusUI = SS.STEP_STATUS_UI[status] || { icon: '❔', label: status, color: '#888' };
                return `
                    <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;
                                border-radius:8px;background:rgba(255,255,255,0.03);font-size:12px;">
                        <span>${stepUI.icon}</span>
                        <span style="flex:1;color:rgba(255,255,255,0.7);">${stepUI.label}</span>
                        <span style="color:${statusUI.color};font-size:11px;font-weight:600;">${statusUI.icon}</span>
                    </div>`;
            }).join('');
        }

        // ── Missing items ──
        const missingHtml = (acc.missing || []).length > 0
            ? `<div style="margin-top:8px;font-size:11px;color:rgba(255,255,255,0.4);">
                   Недостаёт: ${acc.missing.join(', ')}
               </div>`
            : '';

        return `
            <div class="pe-session-status pe-fade-in" id="peSessionStatus"
                 style="background:${ui.bg};border:1px solid ${ui.color}22;border-radius:16px;padding:20px;margin-bottom:16px;">
                
                <!-- Status Header -->
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                    <div style="font-size:32px;">${ui.icon}</div>
                    <div style="flex:1;">
                        <div style="font-size:18px;font-weight:700;color:${ui.color};">${ui.title}</div>
                        <div style="font-size:13px;color:rgba(255,255,255,0.6);margin-top:2px;">${ui.subtitle}${acc.dimSource && acc.dimSource !== 'none' ? ` (${dimSourceLabels[acc.dimSource] || acc.dimSource})` : ''}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:24px;font-weight:800;color:${ui.color};">${overallPct}%</div>
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;">${accuracyLevel}</div>
                    </div>
                </div>

                <!-- Accuracy Breakdown -->
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
                    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;">🔍 Тип объекта</div>
                        <div style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.9);margin-top:4px;">${typePct}%</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;">📏 Размеры</div>
                        <div style="font-size:20px;font-weight:700;color:rgba(255,255,255,0.9);margin-top:4px;">${dimPct}%</div>
                    </div>
                    <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:10px;text-align:center;">
                        <div style="font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;">📊 Итог</div>
                        <div style="font-size:20px;font-weight:700;color:${ui.color};margin-top:4px;">${overallPct}%</div>
                    </div>
                </div>

                <!-- Pipeline Steps -->
                ${stepsHtml ? `
                    <div style="margin-bottom:12px;">
                        <div style="font-size:11px;color:rgba(255,255,255,0.35);margin-bottom:6px;text-transform:uppercase;letter-spacing:0.5px;">Этапы пайплайна</div>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">${stepsHtml}</div>
                    </div>
                ` : ''}

                <!-- Next Actions -->
                ${actionsHtml ? `
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${actionsHtml}
                    </div>
                ` : ''}

                ${missingHtml}
            </div>
        `;
    }

    function bindSessionStatusActions() {
        document.querySelectorAll('.pe-next-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                document.dispatchEvent(new CustomEvent('pe:sessionAction', {
                    detail: { action }
                }));
            });
        });
    }

    // ─────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────

    window.PhotoEstimateV3UI = {
        state: V3State,

        // HTML renderers
        renderModeTabs,
        renderScenarios,
        renderDefectsPanel,
        renderQTOQuestions,
        renderContourSection,
        render3DTips,
        renderConfidencePanel,
        renderStepTimings,
        renderSAMOverlay,
        renderSessionStatusBanner,

        // Event binders (call after DOM insertion)
        bindModeTabs,
        bindScenarioCards,
        bindQTOQuestions,
        bindContourCanvas,
        bindSAMToggle,
        bindSessionStatusActions,
        updateModeUI,

        // Analysis
        runV3Analysis,

        // Helpers
        getMode: () => V3State.mode,
        getScenario: () => V3State.selectedScenario,
        getQTOAnswers: () => ({ ...V3State.qtoAnswers }),
        getContourPoints: () => [...V3State.contourPoints],
        setPhotos: (photos) => { window._pePhotos = photos; },
    };

    console.log('✅ [PhotoEstimateV3UI] loaded — modes, scenarios, defects, QTO, contours, confidence, timings, SAM overlay, session status');
})();

