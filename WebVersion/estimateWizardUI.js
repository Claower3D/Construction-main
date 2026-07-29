// ========== ESTIMATE WIZARD UI ==========
// 5-шаговый визард для создания сметы через ИИ
// Шаги: 1.Фото → 2.Анализ → 3.Уточнение → 4.Результат → 5.Экспорт

(function () {
    'use strict';

    const OBJECT_TYPES = {
        // Строительство
        foundation_strip: { emoji: '🏗️', label: 'Ленточный фундамент' },
        foundation_slab: { emoji: '🧱', label: 'Плитный фундамент' },
        foundation_pile: { emoji: '📍', label: 'Свайный фундамент' },
        wall_brick: { emoji: '🧱', label: 'Кирпичная стена' },
        wall_block: { emoji: '📦', label: 'Блочная стена' },
        slab: { emoji: '📐', label: 'Перекрытие / плита' },
        roof_flat: { emoji: '🏠', label: 'Плоская кровля' },
        roof_gable: { emoji: '⛺', label: 'Скатная кровля' },
        opening_door: { emoji: '🚪', label: 'Дверной проём' },
        opening_window: { emoji: '🪟', label: 'Оконный проём' },
        column: { emoji: '🏛️', label: 'Колонна / столб' },
        generic: { emoji: '📏', label: 'Другой объект' },
        // Ремонт
        ROOM_RENOVATION: { emoji: '🏠', label: 'Ремонт комнаты' },
        BATHROOM_RENOVATION: { emoji: '🛁', label: 'Ремонт ванной' },
        KITCHEN_RENOVATION: { emoji: '🍳', label: 'Ремонт кухни' }
    };

    let state = {
        step: 1,
        photos: [],
        estimateId: null,
        estimate: null,
        objectType: null,
        objectParams: {},
        region: 'Алматы',
        address: '',
        manualItems: []
    };

    // ========== MAIN RENDER ==========
    function render() {
        let overlay = document.querySelector('.wizard-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'wizard-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            ${renderHeader()}
            ${renderStepIndicator()}
            <div class="wizard-content">
                ${renderStep()}
            </div>
            ${renderFooter()}
        `;

        bindEvents(overlay);
    }

    // ========== HEADER ==========
    function renderHeader() {
        return `<div class="wizard-header">
            <h2>🏗️ AI-Сметчик — Пошаговый мастер</h2>
            <button class="wizard-close" data-action="close">✕</button>
        </div>`;
    }

    // ========== STEP INDICATOR ==========
    function renderStepIndicator() {
        const steps = [
            { n: 1, label: 'Фото' },
            { n: 2, label: 'AI Анализ' },
            { n: 3, label: 'Уточнение' },
            { n: 4, label: 'Результат' },
            { n: 5, label: 'Экспорт' }
        ];
        return `<div class="wizard-steps">
            ${steps.map(s => {
            const cls = s.n < state.step ? 'done' : s.n === state.step ? 'active' : '';
            const icon = s.n < state.step ? '✓' : s.n;
            return `<div class="wizard-step-item ${cls}">
                    <div class="wizard-step-circle">${icon}</div>
                    <span class="wizard-step-label">${s.label}</span>
                </div>`;
        }).join('')}
        </div>`;
    }

    // ========== STEP CONTENT ==========
    function renderStep() {
        switch (state.step) {
            case 1: return renderStep1();
            case 2: return renderStep2();
            case 3: return renderStep3();
            case 4: return renderStep4();
            case 5: return renderStep5();
            default: return '';
        }
    }

    // --- STEP 1: Photo Upload ---
    function renderStep1() {
        const photosHTML = state.photos.map((p, i) => `
            <div class="wizard-photo-thumb">
                <img src="${p.url}" alt="Photo ${i + 1}">
                <button class="wizard-photo-remove" data-action="remove-photo" data-idx="${i}">✕</button>
            </div>
        `).join('');

        return `<div class="wizard-panel">
            <h3>📸 Загрузите фото объекта</h3>
            <p class="subtitle">Сфотографируйте строительный объект или загрузите готовое фото. Можно добавить несколько.</p>

            <!-- 🔭 PHOTOGRAMMETRY TRIGGER -->
            <button class="pg-trigger-btn" id="wizardPhotoScanBtn" data-action="open-photoscan">
                <span class="pg-trigger-icon">🔭</span>
                <div class="pg-trigger-info">
                    <div class="pg-trigger-title">Объёмный анализ (5 фото)</div>
                    <div class="pg-trigger-desc">Автоматическое 3D-сканирование — размеры без ручного ввода</div>
                </div>
                <span class="pg-trigger-badge">±10% точность</span>
            </button>

            <div style="text-align:center;font-size:12px;color:rgba(255,255,255,.3);margin:8px 0 10px">— или загрузите 1 фото для быстрой оценки —</div>

            <div class="wizard-upload-zone" data-action="upload-zone">
                <div class="wizard-upload-icon">📷</div>
                <div class="wizard-upload-text">Перетащите фото сюда или нажмите для выбора</div>
                <div class="wizard-upload-hint">JPG, PNG до 10 МБ</div>
            </div>
            <input type="file" accept="image/*" multiple style="display:none" id="wizardFileInput">
            ${state.photos.length > 0 ? `<div class="wizard-photos-grid">${photosHTML}</div>` : ''}
        </div>`;
    }

    // --- STEP 2: AI Analysis ---
    function renderStep2() {
        if (!state.estimate) {
            return `<div class="wizard-panel">
                <div class="wizard-ai-processing">
                    <div class="wizard-ai-spinner"></div>
                    <div class="wizard-ai-status">🧠 ИИ анализирует фото...</div>
                    <div class="wizard-ai-step" id="aiStepText">Сканирование пикселей</div>
                    <div style="margin-top:12px;font-size:12px;color:rgba(255,255,255,0.3)">
                        Canvas API · Цветовой анализ · Детектор рёбер
                    </div>
                </div>
            </div>`;
        }

        const est = state.estimate;
        const conf = est.objectTypeConfidence || 0;
        const confClass = conf > 80 ? 'high' : conf > 55 ? 'medium' : 'low';
        const confColor = conf > 80 ? '#22c55e' : conf > 55 ? '#f59e0b' : '#ef4444';
        const confLabel = conf > 80 ? '🟢 Высокая уверенность' : conf > 55 ? '🟡 Средняя уверенность' : '🔴 Низкая уверенность';
        const typeInfo = OBJECT_TYPES[est.objectType] || { emoji: '📏', label: est.objectType || 'Неизвестно' };

        // AI signals — причины классификации
        const signals = est.signals || [];
        const signalsHTML = signals.length > 0
            ? `<div style="margin-top:16px;padding:12px 14px;border-radius:10px;background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2)">
                <div style="font-size:11px;color:#a78bfa;font-weight:600;margin-bottom:8px;letter-spacing:0.05em">🔍 КАК AI ОПРЕДЕЛИЛ ТИП:</div>
                ${signals.map(s => `<div style="font-size:12px;color:rgba(255,255,255,0.65);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05)">• ${s}</div>`).join('')}
               </div>`
            : '';

        // Дефекты
        let defectsHTML = '';
        if (est.defects && est.defects.length > 0) {
            const severityIcon = { high: '🔴', medium: '🟡', low: '🟢' };
            defectsHTML = `<div style="margin-top:16px">
                <strong style="color:var(--wizard-text);font-size:13px">⚠️ Обнаруженные дефекты:</strong>
                ${est.defects.map(d => `
                <div class="wizard-defect-card" style="margin-top:6px">
                    <span>${severityIcon[d.severity] || '⚪'} ${d.name}</span>
                    <span style="font-size:12px;color:rgba(255,255,255,0.5)">${d.description}</span>
                </div>`).join('')}
            </div>`;
        }

        // Освещение + качество
        const qualityMap = { good: '✅ Отличное (≥2МП)', moderate: '⚠️ Умеренное (<2МП)' };

        // Provider badge
        const providerBadge = `<div style="display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:20px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);font-size:11px;color:#a78bfa;margin-bottom:14px">
            ${state.aiProvider === 'onprem' ? '🟢 RF-DETR + SAM + Qwen2.5-VL' : '⚪ Canvas AI (offline)'}
        </div>`;

        return `<div class="wizard-panel">
            <h3>🤖 Результат AI-анализа</h3>
            ${providerBadge}

            <div class="wizard-ai-result">
                <div class="detected-type">
                    <span class="icon">${typeInfo.emoji}</span>
                    <span class="label">${typeInfo.label}</span>
                </div>

                <div style="display:flex;align-items:center;gap:10px;margin:8px 0 4px">
                    <span style="font-size:12px;color:${confColor}">${confLabel}</span>
                    <span style="font-size:13px;font-weight:700;color:${confColor}">${conf}%</span>
                </div>
                <div class="wizard-confidence-bar">
                    <div class="wizard-confidence-fill ${confClass}" style="width:${conf}%;transition:width 0.6s ease"></div>
                </div>

                ${signalsHTML}

                ${est.dimensions ? `<div style="margin-top:14px;font-size:13px;color:var(--wizard-text);padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.04)">
                    📐 Размеры: <b>${est.dimensions.widthM?.toFixed(1) || '?'} × ${est.dimensions.heightM?.toFixed(1) || '?'} м</b>
                    &nbsp;|&nbsp; Площадь ≈ <b>${est.dimensions.areaM2?.toFixed(1) || '?'} м²</b>
                </div>` : ''}

                ${est.lighting ? `<div style="font-size:11px;color:rgba(255,255,255,0.35);margin-top:8px">
                    📷 Качество: ${qualityMap[est.lighting] || est.lighting}
                </div>` : ''}

                ${defectsHTML}

                ${renderQwenInsights(est)}

                <div style="margin-top:16px;padding:10px 14px;border-radius:8px;background:rgba(245,158,11,0.07);font-size:12px;color:#f59e0b">
                    💡 Тип можно скорректировать на следующем шаге
                </div>
            </div>
        </div>`;
    }

    /** Render extra Qwen2.5-VL insights (scene description, missing photos, materials) */
    function renderQwenInsights(est) {
        if (!est || est.provider === 'mock' && !est.sceneDescription) return '';

        let html = '';

        // Scene description from Qwen
        if (est.sceneDescription) {
            html += `<div style="margin-top:14px;padding:10px 14px;border-radius:8px;background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.2)">
                <div style="font-size:11px;color:#34d399;font-weight:600;margin-bottom:5px">🌍 ОПИСАНИЕ СЦЕНЫ (Qwen2.5-VL):</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.75);line-height:1.5">${est.sceneDescription}</div>
            </div>`;
        }

        // Materials found
        if (est.materialsFound && est.materialsFound.length > 0) {
            html += `<div style="margin-top:10px;padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.03)">
                <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px">🧱 МАТЕРИАЛЫ НА ФОТО:</div>
                <div style="display:flex;flex-wrap:wrap;gap:5px">
                    ${est.materialsFound.map(m => `<span style="padding:2px 8px;border-radius:12px;background:rgba(99,102,241,0.12);font-size:11px;color:#c4b5fd">${m}</span>`).join('')}
                </div>
            </div>`;
        }

        // Missing photos recommendation
        if (est.missingPhotos && est.missingPhotos.length > 0) {
            html += `<div style="margin-top:10px;padding:10px 14px;border-radius:8px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15)">
                <div style="font-size:11px;color:#f59e0b;font-weight:600;margin-bottom:6px">📷 РЕКОМЕНДУЕМ ДОСНЯТЬ:</div>
                ${est.missingPhotos.map(p => `<div style="font-size:12px;color:rgba(255,255,255,0.6);padding:2px 0">• ${p}</div>`).join('')}
            </div>`;
        }

        // Detected objects summary
        if (est.detectedObjects && est.detectedObjects.length > 0) {
            const nonRef = est.detectedObjects.filter(d => !['person', 'measuring_tape', 'excavator_bucket'].includes(d.className));
            if (nonRef.length > 0) {
                html += `<div style="margin-top:10px;padding:10px 14px;border-radius:8px;background:rgba(255,255,255,0.03)">
                    <div style="font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px">🔍 ОБНАРУЖЕНО RF-DETR:</div>
                    ${nonRef.slice(0, 4).map(d => `
                    <div style="display:flex;justify-content:space-between;font-size:12px;color:rgba(255,255,255,0.65);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
                        <span>${d.className}</span>
                        <span style="color:#a78bfa">${Math.round(d.confidence * 100)}%${d.areaM2 ? ' · ' + d.areaM2.toFixed(1) + ' м²' : ''}</span>
                    </div>`).join('')}
                </div>`;
            }
        }

        return html;
    }



    // --- STEP 3: Refinement ---
    function renderStep3() {
        const est = state.estimate;
        const currentType = state.objectType || est?.objectType || 'generic';

        const typeButtons = Object.entries(OBJECT_TYPES).map(([k, v]) =>
            `<button class="wizard-type-btn ${k === currentType ? 'selected' : ''}" data-action="select-type" data-type="${k}">
                <span class="emoji">${v.emoji}</span>${v.label}
            </button>`
        ).join('');

        return `<div class="wizard-panel">
            <h3>⚙️ Уточните параметры</h3>
            <p class="subtitle">Исправьте тип объекта или добавьте размеры для точного расчёта</p>

            <div class="wizard-params-form">
                <div class="wizard-form-group full">
                    <label>Тип объекта</label>
                    <div class="wizard-type-grid">${typeButtons}</div>
                </div>

                <div class="wizard-form-group">
                    <label>Регион</label>
                    <select id="wizRegion">
                        ${['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Атырау', 'Актобе', 'Тараз', 'Павлодар'].map(
            c => `<option ${state.region === c ? 'selected' : ''}>${c}</option>`
        ).join('')}
                    </select>
                </div>

                <div class="wizard-form-group">
                    <label>Адрес объекта</label>
                    <input type="text" id="wizAddress" placeholder="ул. Абая, 15" value="${state.address || ''}">
                </div>

                <div class="wizard-form-group">
                    <label>Масштаб (пикс/метр)</label>
                    <input type="number" id="wizScale" placeholder="авто" value="${est?.scale || ''}">
                </div>

                ${renderParamsFields(currentType)}

                <div class="wizard-form-group full" style="border-top:1px solid rgba(255,255,255,0.08);padding-top:1rem;margin-top:0.5rem">
                    <label style="color:rgba(255,255,255,0.5);font-size:0.8rem">➕ Доп. позиции (вывоз мусора, охрана и др.)</label>
                    ${(state.manualItems || []).map((it, i) => `
                    <div style="display:flex;gap:0.4rem;margin-bottom:0.35rem;align-items:center">
                        <input type="text" placeholder="Название" value="${it.name}" data-manual="name" data-idx="${i}" style="flex:3;padding:0.3rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#fff;font-size:0.82rem">
                        <input type="number" placeholder="Кол" value="${it.qty}" data-manual="qty" data-idx="${i}" style="flex:1;padding:0.3rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#fff;font-size:0.82rem">
                        <input type="text" placeholder="ед" value="${it.unit}" data-manual="unit" data-idx="${i}" style="flex:1;padding:0.3rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#fff;font-size:0.82rem">
                        <input type="number" placeholder="₸ цена" value="${it.price}" data-manual="price" data-idx="${i}" style="flex:2;padding:0.3rem 0.5rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.05);color:#fff;font-size:0.82rem">
                    </div>`).join('')}
                    <button data-action="add-manual" style="padding:0.3rem 0.85rem;border-radius:6px;border:1px dashed rgba(255,255,255,0.2);background:transparent;color:rgba(255,255,255,0.5);cursor:pointer;font-size:0.78rem">+ Добавить вручную</button>
                </div>
            </div>
        </div>`;
    }

    function renderParamsFields(type) {
        const p = state.objectParams;
        const fields = {
            foundation_strip: [
                { id: 'width', label: 'Ширина (м)', val: p.width || 0.5 },
                { id: 'depth', label: 'Глубина (м)', val: p.depth || 1.2 }
            ],
            foundation_slab: [
                { id: 'thickness', label: 'Толщина плиты (м)', val: p.thickness || 0.3 }
            ],
            wall_brick: [
                { id: 'thickness', label: 'Толщина стены (м)', val: p.thickness || 0.38 },
                { id: 'height', label: 'Высота (м)', val: p.height || 3.0 }
            ],
            wall_block: [
                { id: 'thickness', label: 'Толщина стены (м)', val: p.thickness || 0.3 },
                { id: 'height', label: 'Высота (м)', val: p.height || 3.0 }
            ],
            roof_flat: [
                { id: 'insulation_mm', label: 'Утеплитель (мм)', val: p.insulation_mm || 100 }
            ],
            roof_gable: [
                { id: 'pitch_deg', label: 'Угол ската (°)', val: p.pitch_deg || 30 }
            ],
            opening_door: [
                { id: 'width', label: 'Ширина проёма (м)', val: p.width || 0.9 },
                { id: 'height', label: 'Высота проёма (м)', val: p.height || 2.1 }
            ],
            opening_window: [
                { id: 'width', label: 'Ширина проёма (м)', val: p.width || 1.2 },
                { id: 'height', label: 'Высота проёма (м)', val: p.height || 1.5 }
            ],
            ROOM_RENOVATION: [{ id: 'height', label: 'Высота потолков (м)', val: p.height || 2.7 }],
            BATHROOM_RENOVATION: [{ id: 'height', label: 'Высота (м)', val: p.height || 2.5 }],
            KITCHEN_RENOVATION: [{ id: 'height', label: 'Высота потолков (м)', val: p.height || 2.7 }]
        };

        const f = fields[type] || [];
        return f.map(fi =>
            `<div class="wizard-form-group">
                <label>${fi.label}</label>
                <input type="number" step="0.01" data-param="${fi.id}" value="${fi.val}" class="param-input">
            </div>`
        ).join('');
    }

    // --- STEP 4: Results ---
    function renderStep4() {
        const est = state.estimate;
        if (!est) {
            return `<div class="wizard-panel"><h3>⏳ Идёт пересчёт...</h3></div>`;
        }

        // ── Используем SmartEstimateEngine если есть ─────────────────────
        const smart = est._smart;
        if (smart && smart.sections) {
            return renderStep4Smart(smart, est);
        }

        // ── Fallback: старый формат ───────────────────────────────────────
        const r = est.results || { works: [], materials: [] };
        const materials = r.materials || [];
        const works = r.works || [];
        const manuals = (state.manualItems || []).filter(it => it.name && it.price > 0);
        const totalMat = materials.reduce((s, m) => s + (m.quantity || 0) * (m.price || 0), 0);
        const totalWork = works.reduce((s, w) => s + (w.quantity || 0) * (w.price || 0), 0);
        const totalManual = manuals.reduce((s, it) => s + (it.qty || 0) * (it.price || 0), 0);

        let totalLaborH = 0;
        const worksWithLabor = works.map(w => {
            let h = 0;
            if (window.LaborResolver && window.LaborResolver.findNorm) {
                const lr = window.LaborResolver.findNorm(w.name, w.unit, w.category);
                h = (lr.norm || 0) * (w.quantity || 0);
            }
            totalLaborH += h;
            return Object.assign({}, w, { laborHours: h > 0 ? h : null });
        });

        const acc = est.accuracy || 0;
        const accRange = acc >= 85 ? '±5%' : acc >= 65 ? '±15%' : '±30%';
        const accColor = acc >= 85 ? '#22c55e' : acc >= 65 ? '#f59e0b' : '#ef4444';

        function tableRows(items, showLabor) {
            return items.map(it => {
                const sum = (it.quantity || 0) * (it.price || 0);
                const snip = it.snipLabel ? `<span class="wizard-snip-badge">СНиП</span>` : '';
                const laborCell = showLabor
                    ? `<td style="text-align:center;color:#a78bfa;font-size:0.78rem">${it.laborHours ? it.laborHours.toFixed(1) + ' ч-ч' : '—'}</td>`
                    : '';
                return `<tr>
                    <td>${it.name} ${snip}</td>
                    <td>${it.quantity != null ? it.quantity.toFixed(2) : '—'}</td>
                    <td>${it.unit || ''}</td>
                    <td>${(it.price || 0).toLocaleString('ru-RU')} ₸</td>
                    <td><strong>${sum.toLocaleString('ru-RU')} ₸</strong></td>
                    ${laborCell}
                </tr>`;
            }).join('');
        }

        return `<div class="wizard-panel">
            <h3>📊 Результат расчёта</h3>
            <p class="subtitle">Смета · ${state.region}${state.address ? ` · <em style="color:rgba(255,255,255,0.4)">${state.address}</em>` : ''}</p>
            <div style="margin-bottom:12px;font-size:13px">
                Точность: <span style="color:${accColor};font-weight:700">${acc}%</span>
                <span style="color:rgba(255,255,255,0.35);font-size:0.75rem;margin-left:4px">(${accRange})</span>
            </div>
            ${materials.length > 0 ? `<div class="wizard-results-section"><h4>🧱 Материалы</h4>
                <table class="wizard-results-table"><thead><tr><th>Материал</th><th>Кол-во</th><th>Ед.</th><th>Цена</th><th>Сумма</th></tr></thead>
                <tbody>${tableRows(materials, false)}</tbody></table>
                <div class="wizard-results-total"><span>Итого материалы:</span><span>${totalMat.toLocaleString('ru-RU')} ₸</span></div></div>` : ''}
            ${worksWithLabor.length > 0 ? `<div class="wizard-results-section" style="margin-top:24px"><h4>👷 Работы</h4>
                <table class="wizard-results-table"><thead><tr><th>Работа</th><th>Кол-во</th><th>Ед.</th><th>Расценка</th><th>Сумма</th><th>⏱ Ч-ч</th></tr></thead>
                <tbody>${tableRows(worksWithLabor, true)}</tbody></table>
                <div class="wizard-results-total"><span>Итого работы:</span><span>${totalWork.toLocaleString('ru-RU')} ₸</span></div>
                ${totalLaborH > 0.01 ? `<div style="font-size:0.78rem;color:#a78bfa;text-align:right;margin-top:4px">⏱ Итого: <b>${totalLaborH.toFixed(1)}</b> чел-ч</div>` : ''}</div>` : ''}
            ${manuals.length > 0 ? `<div class="wizard-results-section" style="margin-top:24px"><h4>✏️ Доп. позиции</h4>
                <table class="wizard-results-table"><thead><tr><th>Название</th><th>Кол-во</th><th>Ед.</th><th>Цена</th><th>Сумма</th></tr></thead>
                <tbody>${manuals.map(it => { const s = (it.qty || 0) * (it.price || 0); return `<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.unit || '—'}</td><td>${(it.price || 0).toLocaleString('ru-RU')} ₸</td><td>${s.toLocaleString('ru-RU')} ₸</td></tr>`; }).join('')}</tbody></table></div>` : ''}
            <div class="wizard-results-total" style="margin-top:20px;background:rgba(16,185,129,0.12);font-size:20px">
                <span>ОБЩИЙ ИТОГ:</span><span>${(totalMat + totalWork + totalManual).toLocaleString('ru-RU')} ₸</span></div>
        </div>`;
    }

    // ── SMART RENDER (4 секции) ────────────────────────────────────────────
    function renderStep4Smart(smart, est) {
        const s = smart.sections;
        const t = smart.totals;
        const acc = smart.accuracy || 70;
        const accColor = acc >= 85 ? '#22c55e' : acc >= 65 ? '#f59e0b' : '#ef4444';
        const accRange = acc >= 85 ? '±5%' : acc >= 65 ? '±15%' : '±30%';

        // I. РАБОТЫ
        const worksHtml = s.works.length > 0 ? `
        <div class="wizard-results-section">
            <h4>🔨 I. Работы</h4>
            <table class="wizard-results-table">
                <thead><tr><th>Наименование</th><th>Кол-во</th><th>Ед.</th><th>Цена ₸</th><th>Сумма ₸</th><th style="color:#a78bfa">⏱ Ч-ч</th></tr></thead>
                <tbody>${s.works.map(w => `<tr>
                    <td>${w.name}</td>
                    <td>${w.qty.toFixed(2)}</td>
                    <td>${w.unit}</td>
                    <td>${w.price.toLocaleString('ru-RU')}</td>
                    <td><strong>${w.subtotal.toLocaleString('ru-RU')}</strong></td>
                    <td style="color:#a78bfa;font-size:0.78rem">${w.laborHours > 0 ? w.laborHours.toFixed(1) + ' <small style="opacity:.6">' + (w.laborSrc || '') + '</small>' : '—'}</td>
                </tr>`).join('')}</tbody>
            </table>
            <div class="wizard-results-total"><span>Итого работы:</span><span>${t.works.toLocaleString('ru-RU')} ₸</span></div>
        </div>` : '';

        // II. МАТЕРИАЛЫ
        const matsHtml = s.materials.length > 0 ? `
        <div class="wizard-results-section" style="margin-top:24px">
            <h4>🧱 II. Материалы <span style="font-weight:400;font-size:0.75rem;color:rgba(255,255,255,0.4)">(с учётом потерь СНиП)</span></h4>
            <table class="wizard-results-table">
                <thead><tr><th>Материал</th><th>Кол-во</th><th>Ед.</th><th>Цена ₸</th><th>Сумма ₸</th><th>Потери</th></tr></thead>
                <tbody>${s.materials.map(m => `<tr>
                    <td>${m.name}</td>
                    <td>${m.qtyWithWaste.toFixed(2)}</td>
                    <td>${m.unit}</td>
                    <td>${m.price.toLocaleString('ru-RU')}</td>
                    <td><strong>${m.subtotal.toLocaleString('ru-RU')}</strong></td>
                    <td style="font-size:0.75rem;color:${m.snip ? '#f59e0b' : 'rgba(255,255,255,0.3)'}">${m.snip ? '+' + m.wastePct + '% СНиП' : '—'}</td>
                </tr>`).join('')}</tbody>
            </table>
            <div class="wizard-results-total"><span>Итого материалы:</span><span>${t.materials.toLocaleString('ru-RU')} ₸</span></div>
        </div>` : '';

        // III. ИНСТРУМЕНТ / ОБОРУДОВАНИЕ
        const equipHtml = s.equipment.length > 0 ? `
        <div class="wizard-results-section" style="margin-top:24px">
            <h4>🔧 III. Инструмент и оборудование</h4>
            <table class="wizard-results-table">
                <thead><tr><th>Оборудование</th><th>Маш-ч</th><th>Ставка ₸/ч</th><th>Сумма ₸</th></tr></thead>
                <tbody>${s.equipment.map(eq => `<tr>
                    <td>${eq.name}</td>
                    <td>${eq.machineHours}</td>
                    <td>${eq.hourlyRate.toLocaleString('ru-RU')}</td>
                    <td><strong>${eq.subtotal.toLocaleString('ru-RU')}</strong></td>
                </tr>`).join('')}</tbody>
            </table>
            <div class="wizard-results-total"><span>Итого оборудование:</span><span>${t.equipment.toLocaleString('ru-RU')} ₸</span></div>
        </div>` : '';

        // IV. ТРУД
        const lb = s.labor;
        const laborHtml = lb.totalHours > 0 ? `
        <div class="wizard-results-section" style="margin-top:24px;background:rgba(167,139,250,0.04);border:1px solid rgba(167,139,250,0.15);border-radius:12px;padding:16px">
            <h4 style="margin-top:0">👷 IV. Стоимость труда (ЦЧ)</h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px">
                <div style="color:rgba(255,255,255,0.6)">Итого человеко-часов:</div>
                <div style="color:#a78bfa;font-weight:700">${lb.totalHours.toFixed(1)} ч-ч</div>
                <div style="color:rgba(255,255,255,0.6)">Рабочих дней:</div>
                <div>${lb.laborDays} дн. (бригада ~${lb.workers} чел.)</div>
                <div style="color:rgba(255,255,255,0.6)">Тарифная ставка (${lb.region}):</div>
                <div>${lb.tariffPerHour.toLocaleString('ru-RU')} ₸/ч</div>
            </div>
            <div class="wizard-results-total" style="margin-top:12px">
                <span>Стоимость труда:</span><span style="color:#a78bfa">${lb.subtotal.toLocaleString('ru-RU')} ₸</span>
            </div>
        </div>` : '';

        // РУЧНЫЕ ПОЗИЦИИ
        const manuals = (s.manuals || []).filter(it => it.name && it.price > 0);
        const manualsHtml = manuals.length > 0 ? `
        <div class="wizard-results-section" style="margin-top:24px"><h4>✏️ Доп. позиции</h4>
            <table class="wizard-results-table"><thead><tr><th>Название</th><th>Кол-во</th><th>Ед.</th><th>Цена</th><th>Сумма</th></tr></thead>
            <tbody>${manuals.map(it => { const sm = (it.qty || 0) * (it.price || 0); return `<tr><td>${it.name}</td><td>${it.qty}</td><td>${it.unit || '—'}</td><td>${(it.price || 0).toLocaleString('ru-RU')} ₸</td><td>${sm.toLocaleString('ru-RU')} ₸</td></tr>`; }).join('')}</tbody>
        </table></div>` : '';

        return `<div class="wizard-panel">
            <h3>📊 Развёрнутая смета</h3>
            <p class="subtitle">${smart.objectType ? (OBJECT_TYPES[smart.objectType]?.label || smart.objectType) : ''} · ${smart.region}${state.address ? ` · <em style="color:rgba(255,255,255,0.4)">${state.address}</em>` : ''}</p>
            <div style="margin-bottom:16px;font-size:13px;display:flex;gap:20px;flex-wrap:wrap">
                <span>Точность: <span style="color:${accColor};font-weight:700">${acc}%</span> <span style="color:rgba(255,255,255,0.35);font-size:0.75rem">(${accRange})</span></span>
                <span style="color:rgba(255,255,255,0.4)">Площадь: ${(smart.dimensions.area_m2 || 0).toFixed(1)} м²</span>
                <span style="color:rgba(255,255,255,0.4)">Ч-ч: ${lb.totalHours.toFixed(1)} / ${lb.laborDays} дн.</span>
            </div>
            ${worksHtml}${matsHtml}${equipHtml}${laborHtml}${manualsHtml}
            <div class="wizard-results-total" style="margin-top:24px;background:rgba(16,185,129,0.12);font-size:20px;border:1px solid rgba(16,185,129,0.25)">
                <span>ИТОГО ПО СМЕТЕ:</span>
                <span style="color:#34d399">${t.grand.toLocaleString('ru-RU')} ₸</span>
            </div>
            <div style="margin-top:10px;display:flex;gap:12px;font-size:12px;color:rgba(255,255,255,0.4);flex-wrap:wrap">
                <span>Работы: ${t.works.toLocaleString('ru-RU')} ₸</span>
                <span>Материалы: ${t.materials.toLocaleString('ru-RU')} ₸</span>
                <span>Оборудование: ${t.equipment.toLocaleString('ru-RU')} ₸</span>
                <span>Труд: ${t.labor.toLocaleString('ru-RU')} ₸</span>
            </div>
        </div>`;
    }

    // --- STEP 5: Export ---
    function renderStep5() {
        const versionOptions = (state.estimate?.versions || []).map(
            (v, i) => `<option value="${v.version}">v${v.version} — ${new Date(v.date).toLocaleDateString('ru-RU')}</option>`
        ).join('');

        return `<div class="wizard-panel">
            <h3>💾 Сохранение и экспорт</h3>
            <p class="subtitle">Скачайте смету в нужном формате или сравните с предыдущими версиями</p>

            <div class="wizard-export-grid">
                <div class="wizard-export-card" data-action="export-pdf">
                    <div class="icon">📄</div>
                    <div class="title">PDF</div>
                    <div class="desc">Смета для печати</div>
                </div>
                <div class="wizard-export-card" data-action="export-excel">
                    <div class="icon">📊</div>
                    <div class="title">Excel</div>
                    <div class="desc">Для редактирования</div>
                </div>
                <div class="wizard-export-card" data-action="export-3d">
                    <div class="icon">🏗️</div>
                    <div class="title">3D-визуализация</div>
                    <div class="desc">Интерактивная модель</div>
                </div>
            </div>

            ${versionOptions ? `
            <div class="wizard-version-diff" style="margin-top:32px">
                <h4 style="color:var(--wizard-text);margin:0 0 12px">📋 Сравнение версий</h4>
                <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
                    <select id="wizVerA" style="padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid var(--wizard-border);color:var(--wizard-text)">
                        ${versionOptions}
                    </select>
                    <span style="color:var(--wizard-text-dim)">vs</span>
                    <select id="wizVerB" style="padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid var(--wizard-border);color:var(--wizard-text)">
                        <option value="current">Текущая</option>
                        ${versionOptions}
                    </select>
                    <button class="wizard-btn wizard-btn-primary" data-action="compare-versions">Сравнить</button>
                </div>
                <div id="wizCompareResult"></div>
            </div>` : ''}
        </div>`;
    }

    // ========== FOOTER ==========
    function renderFooter() {
        const canBack = state.step > 1;
        const canNext = state.step < 5;
        const nextDisabled = state.step === 1 && state.photos.length === 0;
        const nextLabel = state.step === 1 ? '🤖 Анализировать' :
            state.step === 3 ? '📊 Рассчитать' :
                state.step === 4 ? '💾 Экспорт' :
                    state.step === 5 ? '' : 'Далее →';

        return `<div class="wizard-footer">
            ${canBack ? `<button class="wizard-btn wizard-btn-secondary" data-action="back">← Назад</button>` : '<div></div>'}
            ${nextLabel ? `<button class="wizard-btn wizard-btn-primary" data-action="next" ${nextDisabled ? 'disabled' : ''}>${nextLabel}</button>` :
                `<button class="wizard-btn wizard-btn-success" data-action="close">✅ Готово</button>`}
        </div>`;
    }

    // ========== EVENTS ==========
    function bindEvents(root) {
        root.querySelectorAll('[data-action]').forEach(el => {
            el.addEventListener('click', handleAction);
        });

        // Upload zone
        const zone = root.querySelector('.wizard-upload-zone');
        const fileInput = root.querySelector('#wizardFileInput');
        if (zone && fileInput) {
            zone.addEventListener('click', () => fileInput.click());
            zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
            zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
            zone.addEventListener('drop', e => {
                e.preventDefault(); zone.classList.remove('dragover');
                handleFiles(e.dataTransfer.files);
            });
            fileInput.addEventListener('change', e => handleFiles(e.target.files));
        }

        // Param inputs — используем 'input' чтобы захватывать значения немедленно
        root.querySelectorAll('.param-input').forEach(inp => {
            inp.addEventListener('input', () => {
                state.objectParams[inp.dataset.param] = parseFloat(inp.value) || 0;
            });
            // Также читаем начальное значение сразу при рендере
            if (inp.value) state.objectParams[inp.dataset.param] = parseFloat(inp.value) || 0;
        });

        // Region
        const regionSel = root.querySelector('#wizRegion');
        if (regionSel) regionSel.addEventListener('change', () => { state.region = regionSel.value; });

        // Address
        const addrInp = root.querySelector('#wizAddress');
        if (addrInp) addrInp.addEventListener('input', () => { state.address = addrInp.value; });

        // Manual items
        root.querySelectorAll('[data-manual]').forEach(inp => {
            inp.addEventListener('input', () => {
                const idx = parseInt(inp.dataset.idx);
                const field = inp.dataset.manual;
                if (!state.manualItems[idx]) state.manualItems[idx] = { name: '', qty: 1, unit: 'шт', price: 0 };
                state.manualItems[idx][field] = (field === 'name' || field === 'unit') ? inp.value : (parseFloat(inp.value) || 0);
            });
        });
    }

    function handleAction(e) {
        const action = e.currentTarget.dataset.action;

        switch (action) {
            case 'close':
                document.querySelector('.wizard-overlay')?.remove();
                break;
            case 'back':
                state.step = Math.max(1, state.step - 1);
                render();
                break;
            case 'next':
                handleNext();
                break;
            case 'remove-photo':
                state.photos.splice(parseInt(e.currentTarget.dataset.idx), 1);
                render();
                break;
            case 'select-type':
                state.objectType = e.currentTarget.dataset.type;
                saveDraft();
                render();
                break;
            case 'add-manual':
                if (!state.manualItems) state.manualItems = [];
                state.manualItems.push({ name: '', qty: 1, unit: 'шт', price: 0 });
                saveDraft();
                render();
                break;
            case 'export-pdf':
                if (state.estimateId && window.EstimateService?.API) {
                    window.EstimateService.API.generatePDF(state.estimateId);
                }
                break;
            case 'export-excel':
                if (state.estimateId && window.EstimateService?.API?.exportCSV) {
                    window.EstimateService.API.exportCSV(state.estimateId);
                }
                break;
            case 'export-3d':
                if (state.estimateId && window.Viewer3D) {
                    window.Viewer3D.show(state.estimate);
                }
                break;
            case 'compare-versions':
                handleCompareVersions();
                break;
        }
    }

    // ========== LOGIC ==========
    function handleFiles(files) {
        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const url = URL.createObjectURL(file);
            state.photos.push({ file, url, name: file.name });
        });
        render();
    }

    async function handleNext() {
        if (state.step === 1 && state.photos.length > 0) {
            state.step = 2;
            state.estimate = null;
            render();
            await runAIAnalysis();
            return;
        }

        if (state.step === 3) {
            // Читаем актуальные значения из полей перед расчётом
            document.querySelectorAll('.param-input').forEach(inp => {
                if (inp.dataset.param) state.objectParams[inp.dataset.param] = parseFloat(inp.value) || 0;
            });
            const regionNow = document.querySelector('#wizRegion')?.value;
            if (regionNow) state.region = regionNow;
            const addrNow = document.querySelector('#wizAddress')?.value;
            if (addrNow !== undefined) state.address = addrNow;
            saveDraft();

            // ── SmartEstimateEngine (основной путь) ──────────────────
            if (window.SmartEstimateEngine) {
                try {
                    const smart = window.SmartEstimateEngine.build({
                        objectType: state.objectType || state.estimate?.objectType || 'generic',
                        qwenResult: state.estimate,          // содержит dimensions_estimate, confidence
                        objectParams: state.objectParams,
                        region: state.region,
                        manualItems: state.manualItems || [],
                    });
                    // Прикрепляем к state.estimate как ._smart
                    if (!state.estimate) state.estimate = {};
                    state.estimate._smart = smart;
                    state.estimate.accuracy = smart.accuracy;
                    // Совместимость: results для fallback render
                    const legacy = window.SmartEstimateEngine.toLegacyFormat(smart);
                    state.estimate.results = legacy.results;
                    console.log('[Wizard] SmartEstimateEngine ✅ grand total =', smart.totals.grand);
                } catch (err) {
                    console.error('[Wizard] SmartEstimateEngine error:', err);
                }
            }

            // ── Fallback: EstimateService.API (если нет Smart) ───────
            if (!state.estimate?._smart && state.estimateId && window.EstimateService?.API) {
                const API = window.EstimateService.API;
                if (state.objectType) API.setObjectType(state.estimateId, state.objectType);
                if (Object.keys(state.objectParams).length > 0) API.setObjectParams(state.estimateId, state.objectParams);
                if (state.manualItems?.length > 0) {
                    if (API.setManualItems) API.setManualItems(state.estimateId, state.manualItems);
                    else {
                        const est = window.EstimateModels?.Estimate?.find(state.estimateId);
                        if (est) { est.manualItems = state.manualItems; est.save(); }
                    }
                }
                const scaleInput = document.querySelector('#wizScale');
                if (scaleInput?.value) API.setScale(state.estimateId, parseFloat(scaleInput.value), 'px');
                const recalcResult = API.recalculate(state.estimateId);
                if (recalcResult?.success) {
                    state.estimate = { ...state.estimate, ...recalcResult.data };
                    if (state.manualItems?.length > 0) state.estimate.manualItems = state.manualItems;
                }
            }
        }

        if (state.step < 5) {
            state.step++;
            // Черновик больше не нужен после получения результата
            if (state.step === 4) clearDraft();
            render();
        }
    }


    async function runAIAnalysis() {
        const statusEl = document.getElementById('aiStepText');
        const setStatus = (text) => { if (statusEl) statusEl.textContent = text; };

        // ── Try AIVisionService (RF-DETR + SAM + Qwen2.5-VL) ───────────────
        if (window.AIVisionService) {
            try {
                setStatus('🔌 Проверка AI-сервиса...');
                const visionResult = await window.AIVisionService.analyze(
                    state.photos[0].file,
                    {
                        region: state.region,
                        onProgress: (step, label) => setStatus(label),
                    }
                );

                const data = visionResult.toEstimateData();
                state.aiProvider = visionResult.provider;

                // Register with EstimateService if available
                if (window.EstimateService?.API) {
                    const photo = state.photos[0];
                    const reg = await window.EstimateService.API.analyzePhoto(
                        photo.file, photo.name, { region: state.region }
                    );
                    if (reg?.success) {
                        state.estimateId = reg.data.id;
                    }
                }

                // Build state.estimate with all AI metadata
                state.estimate = {
                    ...data,
                    sceneDescription: visionResult.sceneDescription,
                    materialsFound: visionResult.materialsFound,
                    missingPhotos: visionResult.missingPhotos,
                    detectedObjects: visionResult.detectedObjects,
                    provider: visionResult.provider,
                };
                state.objectType = data.objectType;
                state.objectParams = {};

                if (data.dimensions?.areaM2) state.objectParams.area = data.dimensions.areaM2;
                if (data.dimensions?.perimeterM) state.objectParams.perimeter = data.dimensions.perimeterM;
                if (data.dimensions?.depthM) state.objectParams.depth = data.dimensions.depthM;

                render();
                return;

            } catch (err) {
                console.warn('[Wizard] AIVisionService failed, falling back:', err);
                setStatus('⚠️ AI-сервис недоступен, переключение...');
                await new Promise(r => setTimeout(r, 600));
            }
        }

        // ── Fallback: legacy Canvas-based analysis ────────────────────────
        const steps = [
            'Загрузка изображения в Canvas...',
            'Анализ HSL цветового пространства...',
            'Подсчёт плотности рёбер (Sobel)...',
            'Классификация строительного объекта...',
            'Подбор материалов и расценок...'
        ];

        for (let i = 0; i < steps.length; i++) {
            setStatus(steps[i]);
            await new Promise(r => setTimeout(r, 450));
        }

        if (window.EstimateService?.API) {
            const photo = state.photos[0];
            const result = await window.EstimateService.API.analyzePhoto(photo.file, photo.name, { region: state.region });
            if (result?.success) {
                state.estimateId = result.data.id;
                state.estimate = result.data;
                state.objectType = result.data.objectType;
                state.objectParams = result.data.objectParams || {};
            }
        } else {
            // Minimal stub
            state.estimate = {
                objectType: 'foundation_strip',
                objectTypeConfidence: 72,
                dimensions: { widthM: 4.0, heightM: 3.0, areaM2: 12.0 },
                scale: 150, accuracy: 70,
                accuracyReasons: ['Масштаб определён автоматически'],
                defects: [],
                results: null,
                provider: 'legacy',
            };
            state.objectType = 'foundation_strip';
        }

        render();
    }


    function handleCompareVersions() {
        const a = document.getElementById('wizVerA')?.value;
        const b = document.getElementById('wizVerB')?.value;
        if (!a || !b || !state.estimateId || !window.EstimateService?.API?.compareVersions) return;

        const result = window.EstimateService.API.compareVersions(state.estimateId, parseInt(a), b === 'current' ? 'current' : parseInt(b));
        const container = document.getElementById('wizCompareResult');
        if (!container || !result?.success) return;

        const d = result.data;
        let html = '<div style="margin-top:16px">';

        function renderItemChanges(label, changes) {
            if (changes.length === 0) return '';
            let h = `<h4 style="color:var(--wizard-text);margin:12px 0 8px">${label}</h4>`;
            changes.forEach(c => {
                if (c.status === 'added') {
                    h += `<div class="diff-added">+ ${c.name} (${c.newQty})</div>`;
                } else if (c.status === 'removed') {
                    h += `<div class="diff-removed">- ${c.name}</div>`;
                } else {
                    const sign = c.qtyDelta > 0 ? '+' : '';
                    h += `<div class="diff-changed">≠ ${c.name}: ${c.oldQty} → ${c.newQty} (${sign}${c.qtyDelta?.toFixed(2)})</div>`;
                }
            });
            return h;
        }

        html += renderItemChanges('🧱 Материалы', d.materialChanges);
        html += renderItemChanges('👷 Работы', d.workChanges);

        const deltaSign = d.totalDelta > 0 ? '+' : '';
        const deltaClass = d.totalDelta > 0 ? 'positive' : 'negative';
        html += `<div style="margin-top:16px;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,0.04)">
            <span style="color:var(--wizard-text)">Разница: </span>
            <span class="diff-delta ${deltaClass}">${deltaSign}${d.totalDelta?.toLocaleString('ru-RU')} ₸ (${deltaSign}${d.totalDeltaPercent}%)</span>
        </div>`;
        html += '</div>';
        container.innerHTML = html;
    }

    // ========== DRAFT SAVE / RESTORE ==========
    const DRAFT_KEY = 'qazgost_estimate_draft';

    function saveDraft() {
        try {
            const draft = {
                step: state.step,
                region: state.region,
                address: state.address,
                objectType: state.objectType,
                objectParams: state.objectParams,
                manualItems: state.manualItems,
                savedAt: Date.now()
            };
            localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        } catch (e) { }
    }

    function loadDraft() {
        try {
            const raw = localStorage.getItem(DRAFT_KEY);
            if (!raw) return null;
            const d = JSON.parse(raw);
            // Черновик не старше 3 дней
            if (Date.now() - (d.savedAt || 0) > 3 * 86400000) { localStorage.removeItem(DRAFT_KEY); return null; }
            return d;
        } catch (e) { return null; }
    }

    function clearDraft() {
        try { localStorage.removeItem(DRAFT_KEY); } catch (e) { }
    }

    // ========== PUBLIC API ==========
    window.EstimateWizard = {
        async open() {
            const draft = loadDraft();
            if (draft && draft.objectType) {
                const mins = Math.round((Date.now() - draft.savedAt) / 60000);
                const timeStr = mins < 60 ? `${mins} мин. назад` : `${Math.round(mins / 60)} ч. назад`;
                const doRestore = await (window.QazUI?.confirm || window.confirm)(
                    '🔄 Восстановить черновик?',
                    `Найден незавершённый черновик (${timeStr})\nТип: ${OBJECT_TYPES[draft.objectType]?.label || draft.objectType}\nРегион: ${draft.region}`,
                    { icon: '📋', confirmText: 'Продолжить', cancelText: 'Новая смета' }
                );
                if (doRestore) {
                    state = {
                        step: Math.min(draft.step || 1, 3),
                        photos: [],
                        estimateId: null,
                        estimate: null,
                        objectType: draft.objectType,
                        objectParams: draft.objectParams || {},
                        region: draft.region || 'Алматы',
                        address: draft.address || '',
                        manualItems: draft.manualItems || []
                    };
                    render();
                    return;
                }
            }
            clearDraft();
            state = { step: 1, photos: [], estimateId: null, estimate: null, objectType: null, objectParams: {}, region: 'Алматы', address: '', manualItems: [] };
            render();
        },
        close() {
            document.querySelector('.wizard-overlay')?.remove();
        },
        getState() { return state; }
    };

    // Совместимость
    window.EstimateWizardUI = window.EstimateWizard;

    // ── Интеграция с PhotoScanUI ────────────────────────────────────────────
    // Получаем размеры из 3D-анализа и строим смету без ручного ввода
    window.addEventListener('photogrammetry:result', function (e) {
        const dims = e.detail;
        if (!dims) return;

        console.log('[EstimateWizard] 📐 Получены размеры от PhotoScan:', dims);

        state.objectParams = {
            area_m2: dims.area_m2,
            perimeter_m: dims.perimeter_m,
            height_m: dims.height_m,
            volume_m3: dims.volume_m3,
            source: 'photogrammetry',
        };

        // Открываем wizard если закрыт
        let overlay = document.querySelector('.wizard-overlay');
        if (!overlay || overlay.style.display === 'none') {
            clearDraft();
            state.step = 1;
            render();
        }

        // Строим SmartEstimate с полученными размерами
        if (window.SmartEstimateEngine) {
            try {
                const smart = window.SmartEstimateEngine.build({
                    objectType: state.objectType || 'generic',
                    objectParams: state.objectParams,
                    region: state.region || 'Алматы',
                    qwenResult: { confidence: Math.round((dims.confidence || 0.5) * 100) },
                });
                state.estimate = window.SmartEstimateEngine.toLegacyFormat(smart);
                state.estimate._smart = smart;
            } catch (err) {
                console.error('[EstimateWizard] SmartEstimateEngine error:', err);
            }
        }

        // Переходим к шагу 4 − результат
        state.step = 4;
        render();

        // Баннер уведомление
        const confPct = Math.round((dims.confidence || 0.5) * 100);
        const banner = document.createElement('div');
        banner.style.cssText = 'position:fixed;top:80px;right:20px;z-index:9999;' +
            'background:linear-gradient(135deg,#0d1117,#161b22);' +
            'border:1px solid rgba(0,217,255,.3);border-radius:12px;' +
            'padding:12px 18px;font-family:Inter,sans-serif;color:#e6edf3;' +
            'font-size:13px;box-shadow:0 8px 24px rgba(0,0,0,.5);';
        banner.innerHTML = `📐 3D-анализ завершён · Точность: <strong style="color:#00d9ff">${confPct}%</strong> · Размеры применены`;
        document.body.appendChild(banner);
        setTimeout(() => banner.remove(), 4000);
    });

    // Обработчик кнопки PhotoScan в wizard
    document.addEventListener('click', function (e) {
        if (e.target.closest('[data-action="open-photoscan"]')) {
            if (window.PhotoScanUI) {
                window.PhotoScanUI.show();
            } else {
                (window.QazUI?.alert || window.alert)('3D-сканирование', 'Модуль загружается. Попробуйте через секунду.', { icon: '📐' });
            }
        }
    });

    console.log('✅ EstimateWizard UI loaded');

})();

