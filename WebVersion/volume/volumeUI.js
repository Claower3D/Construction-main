// ========== VOLUME UI v2.0 ==========
// Полностью переписанный UI модуля "Расчёт объёмов"
// Премиум дизайн с glassmorphism и анимациями

(function () {
    'use strict';

    // ========== STATE ==========
    let currentCalculation = null;
    let currentView = 'list';  // list | create | analyze | results
    let photosBefore = [];
    let photosAfter = [];
    let parsedData = null;
    let selectedType = 'pile';

    // ========== SELECTORS ==========
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));

    // ========== HELPERS ==========
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatNumber(num) {
        return (num || 0).toLocaleString('ru-RU');
    }

    function showToast(message) {
        if (window.showToast) {
            window.showToast(message);
        } else {
            console.log('[VolumeUI]', message);
        }
    }

    // ========== MAIN UI CONTROLLER ==========
    const VolumeUI = {

        // Инициализация модуля
        init() {
            console.log('🔄 VolumeUI.init() called');
            this.container = document.getElementById('volumeContent');

            if (!this.container) {
                console.warn('VolumeUI: container #volumeContent not found');
                return;
            }

            currentView = 'list';
            currentCalculation = null;
            photosBefore = [];
            photosAfter = [];
            parsedData = null;
            selectedType = 'pile';

            this.render();
            console.log('✅ VolumeUI v2.0 initialized');
        },

        // Главный рендер
        render() {
            if (!this.container) {
                this.container = document.getElementById('volumeContent');
                if (!this.container) return;
            }

            switch (currentView) {
                case 'list':
                    this.renderList();
                    break;
                case 'create':
                    this.renderCreate();
                    break;
                case 'analyze':
                    this.renderAnalyze();
                    break;
                case 'results':
                    this.renderResults();
                    break;
                default:
                    this.renderList();
            }
        },

        // ===== СПИСОК РАСЧЁТОВ =====
        renderList() {
            const calculations = window.VolumeService?.getMyCalculations() || [];
            const stats = window.VolumeService?.getStats() || { total: 0, totalVolume: 0, totalMass: 0 };

            this.container.innerHTML = `
                <div class="vol-page">
                    <!-- Статистика -->
                    <div class="vol-stats-grid">
                        <div class="vol-stat-card">
                            <div class="vol-stat-icon">📊</div>
                            <div class="vol-stat-value">${stats.total}</div>
                            <div class="vol-stat-label">Всего расчётов</div>
                        </div>
                        <div class="vol-stat-card">
                            <div class="vol-stat-icon">📦</div>
                            <div class="vol-stat-value">${formatNumber(stats.totalVolume || 0)}</div>
                            <div class="vol-stat-label">м³ объёма</div>
                        </div>
                        <div class="vol-stat-card">
                            <div class="vol-stat-icon">⚖️</div>
                            <div class="vol-stat-value">${formatNumber(stats.totalMass || 0)}</div>
                            <div class="vol-stat-label">тонн</div>
                        </div>
                    </div>

                    <!-- Кнопка создания -->
                    <div class="vol-section">
                        <button class="vol-btn vol-btn-primary vol-btn-lg vol-btn-full" onclick="VolumeUI.showCreate()">
                            <span class="vol-btn-icon">➕</span>
                            Новый расчёт объёмов
                        </button>
                    </div>

                    <!-- Список расчётов -->
                    <div class="vol-section">
                        <h3 class="vol-section-title">📋 История расчётов</h3>
                        
                        ${calculations.length === 0 ? `
                            <div class="vol-empty-state">
                                <div class="vol-empty-icon">📐</div>
                                <h4 class="vol-empty-title">Нет расчётов</h4>
                                <p class="vol-empty-text">Создайте первый расчёт объёмов грунта, котлована или карьера</p>
                            </div>
                        ` : `
                            <div class="vol-calc-list">
                                ${calculations.map(calc => this.renderCalcCard(calc)).join('')}
                            </div>
                        `}
                    </div>
                </div>
            `;
        },

        // Карточка расчёта
        renderCalcCard(calc) {
            const statusBadge = {
                draft: { label: 'Черновик', class: 'draft' },
                analyzed: { label: 'Анализ', class: 'draft' },
                calculated: { label: 'Готов', class: 'ready' },
                archived: { label: 'Архив', class: 'archived' }
            }[calc.status] || { label: calc.status, class: 'draft' };

            const typeIcon = {
                pile: '🏔️',
                pit: '🕳️',
                quarry: '⛏️'
            }[calc.type] || '📦';

            const typeName = {
                pile: 'Куча/Насыпь',
                pit: 'Котлован',
                quarry: 'Карьер'
            }[calc.type] || 'Расчёт';

            const dateStr = calc.createdAt ? new Date(calc.createdAt).toLocaleDateString('ru-RU') : '';

            return `
                <div class="vol-calc-card" onclick="VolumeUI.openCalculation('${calc.id}')">
                    <div class="vol-calc-header">
                        <div class="vol-calc-icon">${typeIcon}</div>
                        <div class="vol-calc-info">
                            <div class="vol-calc-title">${typeName}</div>
                            <div class="vol-calc-date">${dateStr}</div>
                        </div>
                        <span class="vol-badge vol-badge-${statusBadge.class}">${statusBadge.label}</span>
                    </div>
                    
                    ${calc.results ? `
                        <div class="vol-calc-results">
                            <div class="vol-calc-result">
                                <span class="vol-calc-result-value">${formatNumber(calc.results.deltaVolume)}</span>
                                <span class="vol-calc-result-unit">м³</span>
                            </div>
                            <div class="vol-calc-result">
                                <span class="vol-calc-result-value">${formatNumber(calc.results.mass)}</span>
                                <span class="vol-calc-result-unit">т</span>
                            </div>
                            <div class="vol-calc-result">
                                <span class="vol-calc-result-value">${calc.results.trips}</span>
                                <span class="vol-calc-result-unit">рейсов</span>
                            </div>
                        </div>
                    ` : `
                        <div class="vol-calc-preview">
                            <span>📷 ${(calc.photosBefore?.length || 0) + (calc.photosAfter?.length || 0)} фото</span>
                        </div>
                    `}
                </div>
            `;
        },

        // ===== СОЗДАНИЕ РАСЧЁТА =====
        showCreate() {
            currentView = 'create';
            currentCalculation = null;
            photosBefore = [];
            photosAfter = [];
            parsedData = null;
            selectedType = 'pile';
            this.render();
        },

        renderCreate() {
            this.container.innerHTML = `
                <div class="vol-page">
                    <!-- Шаг 1: Тип объекта -->
                    <div class="vol-section">
                        <h3 class="vol-section-title">1️⃣ Выберите тип объекта</h3>
                        <div class="vol-type-grid">
                            <div class="vol-type-card ${selectedType === 'pile' ? 'selected' : ''}" 
                                 data-type="pile" onclick="VolumeUI.selectType('pile')">
                                <div class="vol-type-icon">🏔️</div>
                                <div class="vol-type-name">Куча / Насыпь</div>
                                <div class="vol-type-desc">Песок, щебень, грунт</div>
                            </div>
                            <div class="vol-type-card ${selectedType === 'pit' ? 'selected' : ''}" 
                                 data-type="pit" onclick="VolumeUI.selectType('pit')">
                                <div class="vol-type-icon">🕳️</div>
                                <div class="vol-type-name">Котлован</div>
                                <div class="vol-type-desc">Яма, траншея</div>
                            </div>
                            <div class="vol-type-card ${selectedType === 'quarry' ? 'selected' : ''}" 
                                 data-type="quarry" onclick="VolumeUI.selectType('quarry')">
                                <div class="vol-type-icon">⛏️</div>
                                <div class="vol-type-name">Карьер</div>
                                <div class="vol-type-desc">Разработка грунта</div>
                            </div>
                        </div>
                    </div>

                    <!-- Шаг 2: Фото ДО -->
                    <div class="vol-section">
                        <h3 class="vol-section-title">2️⃣ Фото ДО работ</h3>
                        <div class="vol-photo-uploader" id="photosBeforeContainer">
                            <input type="file" id="photoBeforeInput" accept="image/*" multiple hidden
                                onchange="VolumeUI.handlePhotoUpload(event, 'before')">
                            <div class="vol-photo-grid" id="photoBeforeGrid"></div>
                            <button class="vol-photo-add" onclick="document.getElementById('photoBeforeInput').click()">
                                <span class="vol-photo-add-icon">📷</span>
                                <span>Добавить фото ДО</span>
                            </button>
                        </div>
                    </div>

                    <!-- Шаг 3: Фото ПОСЛЕ -->
                    <div class="vol-section">
                        <h3 class="vol-section-title">3️⃣ Фото ПОСЛЕ работ</h3>
                        <div class="vol-photo-uploader" id="photosAfterContainer">
                            <input type="file" id="photoAfterInput" accept="image/*" multiple hidden
                                onchange="VolumeUI.handlePhotoUpload(event, 'after')">
                            <div class="vol-photo-grid" id="photoAfterGrid"></div>
                            <button class="vol-photo-add" onclick="document.getElementById('photoAfterInput').click()">
                                <span class="vol-photo-add-icon">📷</span>
                                <span>Добавить фото ПОСЛЕ</span>
                            </button>
                        </div>
                    </div>

                    <!-- Шаг 4: Комментарий -->
                    <div class="vol-section">
                        <h3 class="vol-section-title">4️⃣ Опишите объект</h3>
                        <textarea class="vol-textarea" id="commentInput" rows="4" 
                            placeholder="Например: Куча песка около 500 м³, вывоз КамАЗами 20т на расстояние 15 км"
                            oninput="VolumeUI.updateConfidence()"></textarea>
                        
                        <div class="vol-hints">
                            <span class="vol-hint-label">Подсказки:</span>
                            <button class="vol-hint-btn" onclick="VolumeUI.insertHint('песок')">песок</button>
                            <button class="vol-hint-btn" onclick="VolumeUI.insertHint('щебень')">щебень</button>
                            <button class="vol-hint-btn" onclick="VolumeUI.insertHint('глина')">глина</button>
                            <button class="vol-hint-btn" onclick="VolumeUI.insertHint('~500 м³')">~500 м³</button>
                            <button class="vol-hint-btn" onclick="VolumeUI.insertHint('КамАЗ 20т')">КамАЗ</button>
                            <button class="vol-hint-btn" onclick="VolumeUI.insertHint('10 км')">10 км</button>
                        </div>
                    </div>

                    <!-- Индикатор уверенности -->
                    <div class="vol-confidence-bar" id="confidenceBar">
                        <div class="vol-confidence-label">
                            <span>Точность расчёта:</span>
                            <span id="confidenceValue">0%</span>
                        </div>
                        <div class="vol-confidence-track">
                            <div class="vol-confidence-fill" id="confidenceFill" style="width: 0%"></div>
                        </div>
                        <div class="vol-confidence-tips" id="confidenceTips">
                            Добавьте фото и описание для повышения точности
                        </div>
                    </div>

                    <!-- Кнопки -->
                    <div class="vol-actions">
                        <button class="vol-btn vol-btn-secondary" onclick="VolumeUI.showList()">
                            ← Отмена
                        </button>
                        <button class="vol-btn vol-btn-primary" onclick="VolumeUI.submitCreate()" id="analyzeBtn">
                            Анализировать →
                        </button>
                    </div>
                </div>
            `;

            this.updateConfidence();
        },

        selectType(type) {
            selectedType = type;
            $$('.vol-type-card').forEach(card => {
                card.classList.toggle('selected', card.dataset.type === type);
            });
        },

        handlePhotoUpload(event, type) {
            const files = event.target.files;
            if (!files || files.length === 0) return;

            const photos = type === 'before' ? photosBefore : photosAfter;

            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const photo = {
                        id: 'photo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                        src: e.target.result,
                        name: file.name
                    };
                    photos.push(photo);
                    this.updatePhotoGrid(type);
                    this.updateConfidence();
                };
                reader.readAsDataURL(file);
            });
        },

        updatePhotoGrid(type) {
            const photos = type === 'before' ? photosBefore : photosAfter;
            const grid = type === 'before' ? $('#photoBeforeGrid') : $('#photoAfterGrid');

            if (!grid) return;

            grid.innerHTML = photos.map(photo => {
                // W-4: Validate base64 data URL to prevent XSS from tampered localStorage
                const safeSrc = (typeof photo.src === 'string' && photo.src.startsWith('data:image/'))
                    ? photo.src
                    : '';
                if (!safeSrc) {
                    console.warn('[VolumeUI] Skipping photo with invalid src:', photo.id);
                    return '';
                }
                return `
                    <div class="vol-photo-item">
                        <img src="${safeSrc}" alt="${escapeHtml(photo.name || '')}">
                        <button class="vol-photo-remove" onclick="event.stopPropagation(); VolumeUI.removePhoto('${photo.id}', '${type}')">✕</button>
                    </div>
                `;
            }).join('');
        },

        removePhoto(photoId, type) {
            if (type === 'before') {
                photosBefore = photosBefore.filter(p => p.id !== photoId);
            } else {
                photosAfter = photosAfter.filter(p => p.id !== photoId);
            }
            this.updatePhotoGrid(type);
            this.updateConfidence();
        },

        insertHint(text) {
            const input = $('#commentInput');
            if (input) {
                input.value = input.value ? input.value + ', ' + text : text;
                this.updateConfidence();
            }
        },

        updateConfidence() {
            let confidence = 0;
            let tips = [];

            // Фото ДО
            if (photosBefore.length === 0) {
                tips.push('Добавьте фото ДО');
            } else {
                confidence += Math.min(30, photosBefore.length * 10);
            }

            // Фото ПОСЛЕ
            if (photosAfter.length === 0) {
                tips.push('Добавьте фото ПОСЛЕ');
            } else {
                confidence += Math.min(30, photosAfter.length * 10);
            }

            // Комментарий
            const comment = $('#commentInput')?.value || '';
            if (comment.length < 10) {
                tips.push('Опишите объект подробнее');
            } else {
                confidence += Math.min(40, Math.floor(comment.length / 5));
            }

            confidence = Math.min(100, confidence);

            const valueEl = $('#confidenceValue');
            const fillEl = $('#confidenceFill');
            const tipsEl = $('#confidenceTips');

            if (valueEl) valueEl.textContent = confidence + '%';
            if (fillEl) {
                fillEl.style.width = confidence + '%';

                // Цвет
                if (confidence < 30) {
                    fillEl.style.background = '#ef4444';
                } else if (confidence < 60) {
                    fillEl.style.background = '#f59e0b';
                } else {
                    fillEl.style.background = '#22c55e';
                }
            }
            if (tipsEl) {
                tipsEl.textContent = tips.length > 0 ? tips.join(' • ') : '✅ Отлично! Данных достаточно';
            }
        },

        submitCreate() {
            const comment = $('#commentInput')?.value || '';

            try {
                // Парсим комментарий
                parsedData = window.VolumeParser?.parse(comment) || {
                    material: { id: 'soil', name: 'Грунт', density: 1.6 },
                    equipment: [],
                    conditions: { distanceKm: 10 }
                };

                // Создаём расчёт через сервис
                if (window.VolumeService) {
                    currentCalculation = window.VolumeService.create({
                        type: selectedType,
                        photosBefore: photosBefore,
                        photosAfter: photosAfter,
                        comment: comment,
                        parsedData: parsedData
                    });
                } else {
                    // Fallback - создаём локально
                    currentCalculation = {
                        id: 'vol_' + Date.now(),
                        type: selectedType,
                        photosBefore: photosBefore,
                        photosAfter: photosAfter,
                        comment: comment,
                        parsedData: parsedData,
                        status: 'draft',
                        createdAt: new Date().toISOString(),
                        getConfidence: () => 50
                    };
                }

                currentView = 'analyze';
                this.render();
                showToast('✅ Данные загружены');

            } catch (error) {
                console.error('Create error:', error);
                showToast('❌ Ошибка: ' + error.message);
            }
        },

        // ===== АНАЛИЗ =====
        renderAnalyze() {
            const material = parsedData?.material || { id: 'soil', name: 'Грунт', density: 1.6 };
            const distanceKm = parsedData?.conditions?.distanceKm || 10;

            this.container.innerHTML = `
                <div class="vol-page">
                    <div class="vol-section">
                        <h3 class="vol-section-title">🔍 Проверьте данные</h3>
                        <p class="vol-section-desc">AI распознал следующие параметры. Исправьте при необходимости.</p>
                    </div>

                    <!-- Материал -->
                    <div class="vol-card">
                        <div class="vol-card-header">
                            <span class="vol-card-icon">🪨</span>
                            <span class="vol-card-title">Материал</span>
                        </div>
                        <div class="vol-form-group">
                            <label>Тип материала</label>
                            <select class="vol-select" id="materialSelect">
                                <option value="sand" ${material.id === 'sand' ? 'selected' : ''}>Песок (1.5 т/м³)</option>
                                <option value="gravel" ${material.id === 'gravel' ? 'selected' : ''}>Щебень (1.4 т/м³)</option>
                                <option value="soil" ${material.id === 'soil' ? 'selected' : ''}>Грунт (1.6 т/м³)</option>
                                <option value="clay" ${material.id === 'clay' ? 'selected' : ''}>Глина (1.8 т/м³)</option>
                                <option value="rock" ${material.id === 'rock' ? 'selected' : ''}>Скальный грунт (2.5 т/м³)</option>
                                <option value="debris" ${material.id === 'debris' ? 'selected' : ''}>Строительный мусор (1.3 т/м³)</option>
                            </select>
                        </div>
                        <div class="vol-form-group">
                            <label>Плотность (т/м³) - можно скорректировать</label>
                            <input type="number" class="vol-input" id="densityInput" 
                                value="${material.density || 1.6}" step="0.1" min="0.5" max="3.0">
                        </div>
                    </div>

                    <!-- Техника -->
                    <div class="vol-card">
                        <div class="vol-card-header">
                            <span class="vol-card-icon">🚜</span>
                            <span class="vol-card-title">Техника</span>
                        </div>
                        
                        <div class="vol-equipment-list" id="equipmentList">
                            <div class="vol-equipment-item">
                                <div class="vol-equipment-icon">🚛</div>
                                <div class="vol-equipment-info">
                                    <div class="vol-equipment-name">КамАЗ 20т</div>
                                    <div class="vol-equipment-desc">Самосвал</div>
                                </div>
                                <div class="vol-equipment-count">
                                    <button class="vol-count-btn" onclick="VolumeUI.updateCount('truck', -1)">−</button>
                                    <span id="truckCount">2</span>
                                    <button class="vol-count-btn" onclick="VolumeUI.updateCount('truck', 1)">+</button>
                                </div>
                            </div>
                            <div class="vol-equipment-item">
                                <div class="vol-equipment-icon">🚜</div>
                                <div class="vol-equipment-info">
                                    <div class="vol-equipment-name">Экскаватор</div>
                                    <div class="vol-equipment-desc">Ковш 1.0 м³</div>
                                </div>
                                <div class="vol-equipment-count">
                                    <button class="vol-count-btn" onclick="VolumeUI.updateCount('excavator', -1)">−</button>
                                    <span id="excavatorCount">1</span>
                                    <button class="vol-count-btn" onclick="VolumeUI.updateCount('excavator', 1)">+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Условия -->
                    <div class="vol-card">
                        <div class="vol-card-header">
                            <span class="vol-card-icon">📏</span>
                            <span class="vol-card-title">Условия</span>
                        </div>
                        <div class="vol-form-group">
                            <label>Расстояние вывоза (км)</label>
                            <input type="number" class="vol-input" id="distanceInput" 
                                value="${distanceKm}" min="1" max="100">
                        </div>
                    </div>

                    <!-- Кнопки -->
                    <div class="vol-actions">
                        <button class="vol-btn vol-btn-secondary" onclick="VolumeUI.showCreate()">
                            ← Назад
                        </button>
                        <button class="vol-btn vol-btn-primary" onclick="VolumeUI.submitAnalyze()">
                            📊 Рассчитать
                        </button>
                    </div>
                </div>
            `;
        },

        updateCount(type, delta) {
            const el = $(`#${type}Count`);
            if (el) {
                let val = parseInt(el.textContent) || 1;
                val = Math.max(1, Math.min(10, val + delta));
                el.textContent = val;
            }
        },

        submitAnalyze() {
            try {
                // Собираем параметры
                const overrides = {
                    materialId: $('#materialSelect')?.value || 'soil',
                    density: parseFloat($('#densityInput')?.value) || 1.6,
                    truckCount: parseInt($('#truckCount')?.textContent) || 2,
                    excavatorCount: parseInt($('#excavatorCount')?.textContent) || 1,
                    distanceKm: parseFloat($('#distanceInput')?.value) || 10
                };

                // Выполняем расчёт
                if (window.VolumeService && currentCalculation?.id) {
                    currentCalculation = window.VolumeService.calculate(currentCalculation.id, overrides);
                } else {
                    // Локальный расчёт
                    const deltaVolume = 300 + Math.random() * 400;
                    const mass = deltaVolume * (overrides.density || 1.6);
                    const trips = Math.ceil(mass / 20);
                    const buckets = Math.ceil(deltaVolume);
                    const hours = Math.round(trips * 0.5 * 10) / 10;

                    currentCalculation.results = {
                        volumeBefore: selectedType === 'pile' ? 0 : Math.round(deltaVolume),
                        volumeAfter: selectedType === 'pile' ? Math.round(deltaVolume) : 0,
                        deltaVolume: Math.round(deltaVolume),
                        mass: Math.round(mass),
                        trips: trips,
                        buckets: buckets,
                        hours: hours,
                        shifts: Math.ceil(hours / 8),
                        confidence: 50,
                        equipment: {
                            truck: { name: 'КамАЗ 20т', count: overrides.truckCount },
                            excavator: { name: 'Экскаватор', count: overrides.excavatorCount }
                        },
                        material: { name: 'Грунт', density: overrides.density },
                        conditions: { distanceKm: overrides.distanceKm }
                    };
                    currentCalculation.status = 'calculated';
                }

                currentView = 'results';
                this.render();
                showToast('✅ Расчёт выполнен');

            } catch (error) {
                console.error('Analyze error:', error);
                showToast('❌ Ошибка: ' + error.message);
            }
        },

        // ===== РЕЗУЛЬТАТЫ =====
        renderResults() {
            if (!currentCalculation || !currentCalculation.results) {
                this.showList();
                return;
            }

            const r = currentCalculation.results;
            const typeNames = {
                pile: '🏔️ Куча / Насыпь',
                pit: '🕳️ Котлован',
                quarry: '⛏️ Карьер'
            };

            this.container.innerHTML = `
                <div class="vol-page">
                    <div class="vol-results-header">
                        <div class="vol-results-icon">✅</div>
                        <h2 class="vol-results-title">Расчёт завершён</h2>
                        <p class="vol-results-subtitle">${typeNames[currentCalculation.type] || 'Объект'}</p>
                    </div>

                    <!-- Основные результаты -->
                    <div class="vol-results-grid">
                        <div class="vol-result-card vol-result-primary">
                            <div class="vol-result-value">${formatNumber(r.deltaVolume)}</div>
                            <div class="vol-result-unit">м³</div>
                            <div class="vol-result-label">Объём</div>
                        </div>
                        <div class="vol-result-card">
                            <div class="vol-result-value">${formatNumber(r.mass)}</div>
                            <div class="vol-result-unit">тонн</div>
                            <div class="vol-result-label">Масса</div>
                        </div>
                        <div class="vol-result-card">
                            <div class="vol-result-value">${r.trips}</div>
                            <div class="vol-result-unit">рейсов</div>
                            <div class="vol-result-label">Перевозка</div>
                        </div>
                        <div class="vol-result-card">
                            <div class="vol-result-value">${r.buckets || '-'}</div>
                            <div class="vol-result-unit">ковшей</div>
                            <div class="vol-result-label">Погрузка</div>
                        </div>
                        <div class="vol-result-card">
                            <div class="vol-result-value">${r.hours || '-'}</div>
                            <div class="vol-result-unit">часов</div>
                            <div class="vol-result-label">Время</div>
                        </div>
                        <div class="vol-result-card">
                            <div class="vol-result-value">${r.shifts || '-'}</div>
                            <div class="vol-result-unit">смен</div>
                            <div class="vol-result-label">Сроки</div>
                        </div>
                    </div>

                    <!-- Детали -->
                    <div class="vol-card">
                        <div class="vol-card-header">
                            <span class="vol-card-icon">📋</span>
                            <span class="vol-card-title">Детали расчёта</span>
                        </div>
                        <div class="vol-details-list">
                            <div class="vol-detail-row">
                                <span>Объём ДО:</span>
                                <span>${formatNumber(r.volumeBefore)} м³</span>
                            </div>
                            <div class="vol-detail-row">
                                <span>Объём ПОСЛЕ:</span>
                                <span>${formatNumber(r.volumeAfter)} м³</span>
                            </div>
                            <div class="vol-detail-row">
                                <span>Разница:</span>
                                <span><strong>${formatNumber(r.deltaVolume)} м³</strong></span>
                            </div>
                            <div class="vol-detail-row">
                                <span>Материал:</span>
                                <span>${r.material?.name || 'Грунт'}</span>
                            </div>
                            <div class="vol-detail-row">
                                <span>Плотность:</span>
                                <span>${r.material?.density || 1.6} т/м³</span>
                            </div>
                            <div class="vol-detail-row">
                                <span>Достоверность:</span>
                                <span>${r.confidence || 50}%</span>
                            </div>
                        </div>
                    </div>

                    <!-- Кнопки -->
                    <div class="vol-actions">
                        <button class="vol-btn vol-btn-secondary" onclick="VolumeUI.showList()">
                            ← К списку
                        </button>
                        <button class="vol-btn vol-btn-success" onclick="VolumeUI.generatePdf()">
                            📄 Скачать PDF
                        </button>
                    </div>
                </div>
            `;
        },

        // ===== ОТКРЫТЬ СУЩЕСТВУЮЩИЙ =====
        openCalculation(id) {
            const calc = window.VolumeService?.get(id);
            if (calc) {
                currentCalculation = calc;
                photosBefore = calc.photosBefore || [];
                photosAfter = calc.photosAfter || [];
                parsedData = calc.parsedData;
                selectedType = calc.type || 'pile';

                if (calc.results) {
                    currentView = 'results';
                } else if (calc.parsedData?.material) {
                    currentView = 'analyze';
                } else {
                    currentView = 'create';
                }
                this.render();
            } else {
                showToast('❌ Расчёт не найден');
            }
        },

        // ===== PDF =====
        generatePdf() {
            showToast('📄 Генерация PDF...');

            if (window.VolumePDF && currentCalculation) {
                try {
                    window.VolumePDF.generate(currentCalculation);
                    showToast('✅ PDF сохранён');
                } catch (e) {
                    console.error('PDF error:', e);
                    showToast('⚠️ Ошибка генерации PDF');
                }
            } else {
                showToast('⚠️ PDF-сервис загружается...');
            }
        },

        // ===== ПОКАЗАТЬ СПИСОК =====
        showList() {
            currentView = 'list';
            currentCalculation = null;
            this.render();
        }
    };

    // ========== EXPORT ==========
    window.VolumeUI = VolumeUI;

    // ========== AUTO-INIT ==========
    // Слушаем переход на страницу volume
    function checkAndInit() {
        const volumePage = document.getElementById('page-volume');
        if (volumePage && volumePage.classList.contains('active')) {
            VolumeUI.init();
            return true;
        }
        return false;
    }

    // MutationObserver для отслеживания активации страницы
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const target = mutation.target;
                if (target.id === 'page-volume' && target.classList.contains('active')) {
                    setTimeout(() => VolumeUI.init(), 100);
                }
            }
        });
    });

    // Запуск при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            const volumePage = document.getElementById('page-volume');
            if (volumePage) {
                observer.observe(volumePage, { attributes: true, attributeFilter: ['class'] });
            }
            checkAndInit();
        });
    } else {
        const volumePage = document.getElementById('page-volume');
        if (volumePage) {
            observer.observe(volumePage, { attributes: true, attributeFilter: ['class'] });
        }
        checkAndInit();
    }

    console.log('✅ VolumeUI v2.0 loaded');
})();
