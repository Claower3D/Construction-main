/**
 * QAZGOST AI - Photo Analyzer UI Component
 * 
 * UI component for photo analysis with drag-and-drop,
 * visualization of detections, and auto-estimation display.
 * 
 * @version 1.0.0
 */

(function (global) {
    'use strict';

    // ============================================================
    // AI ANALYZER UI
    // ============================================================

    const AIAnalyzerUI = {

        // State
        currentImage: null,
        currentResult: null,
        isAnalyzing: false,

        /**
         * Render photo upload and analysis UI
         * @param {string} containerId - Container element ID
         * @param {Object} options - UI options
         */
        render(containerId, options = {}) {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`Container not found: ${containerId}`);
                return;
            }

            const defaults = {
                region: 'almaty',
                showEstimate: true,
                referenceObject: null,
                onAnalysisComplete: null,
                onError: null
            };

            const config = { ...defaults, ...options };
            container.dataset.aiConfig = JSON.stringify(config);

            container.innerHTML = `
                <div class="ai-analyzer">
                    <!-- Upload Zone -->
                    <div class="ai-upload-zone" id="ai-upload-zone-${containerId}">
                        <div class="ai-upload-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/>
                                <path d="M12 12v9"/>
                                <path d="m16 16-4-4-4 4"/>
                            </svg>
                        </div>
                        <h3>Загрузите фото объекта</h3>
                        <p>Перетащите изображение сюда или нажмите для выбора</p>
                        <div class="ai-upload-buttons">
                            <button class="ai-btn ai-btn-secondary ai-camera-btn" id="ai-camera-btn-${containerId}">
                                📷 Сделать фото
                            </button>
                        </div>
                        <p class="ai-upload-hint">Поддерживаются: JPG, PNG, WebP (до 50 МБ)</p>
                        <input type="file" id="ai-file-input-${containerId}" accept="image/*" hidden>
                        <input type="file" id="ai-camera-input-${containerId}" accept="image/*" capture="environment" hidden>
                    </div>

                    <!-- Preview with Canvas -->
                    <div class="ai-preview-container" id="ai-preview-${containerId}" style="display: none;">
                        <div class="ai-preview-header">
                            <span class="ai-preview-filename"></span>
                            <button class="ai-btn-icon ai-btn-remove" title="Удалить">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                        <div class="ai-preview-image-wrapper">
                            <img class="ai-preview-image" alt="Preview">
                            <canvas class="ai-detection-canvas"></canvas>
                        </div>
                        
                        <!-- Reference Object Selector -->
                        <div class="ai-reference-selector">
                            <label>Объект для масштаба:</label>
                            <select class="ai-reference-select">
                                <option value="">Автоматически</option>
                                <option value="person">Человек (1.75м)</option>
                                <option value="measuring_tape">Рулетка (1м)</option>
                                <option value="excavator_bucket">Ковш экскаватора (1.2м)</option>
                            </select>
                        </div>
                        
                        <!-- Analyze Button -->
                        <button class="ai-btn ai-btn-analyze" id="ai-analyze-btn-${containerId}">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="M21 21l-4.35-4.35"/>
                            </svg>
                            <span>Анализировать фото</span>
                        </button>
                    </div>

                    <!-- Loading State v2 — Step-by-step progress -->
                    <div class="ai-loading" id="ai-loading-${containerId}" style="display: none;">
                        <div class="ai-steps-progress">
                            <div class="ai-step" data-step="1">
                                <div class="ai-step-icon">📤</div>
                                <div class="ai-step-info">
                                    <span class="ai-step-name">Загрузка изображения</span>
                                    <div class="ai-step-bar"><div class="ai-step-fill"></div></div>
                                </div>
                            </div>
                            <div class="ai-step" data-step="2">
                                <div class="ai-step-icon">🔍</div>
                                <div class="ai-step-info">
                                    <span class="ai-step-name">Определение объектов</span>
                                    <div class="ai-step-bar"><div class="ai-step-fill"></div></div>
                                </div>
                            </div>
                            <div class="ai-step" data-step="3">
                                <div class="ai-step-icon">📏</div>
                                <div class="ai-step-info">
                                    <span class="ai-step-name">Масштабирование</span>
                                    <div class="ai-step-bar"><div class="ai-step-fill"></div></div>
                                </div>
                            </div>
                            <div class="ai-step" data-step="4">
                                <div class="ai-step-icon">📐</div>
                                <div class="ai-step-info">
                                    <span class="ai-step-name">Расчёт объёмов</span>
                                    <div class="ai-step-bar"><div class="ai-step-fill"></div></div>
                                </div>
                            </div>
                            <div class="ai-step" data-step="5">
                                <div class="ai-step-icon">💰</div>
                                <div class="ai-step-info">
                                    <span class="ai-step-name">Генерация сметы</span>
                                    <div class="ai-step-bar"><div class="ai-step-fill"></div></div>
                                </div>
                            </div>
                        </div>
                        <p class="ai-loading-hint">ИИ анализирует ваше фото...</p>
                    </div>

                    <!-- Results -->
                    <div class="ai-results" id="ai-results-${containerId}" style="display: none;">
                        <!-- Detection Summary -->
                        <div class="ai-result-section">
                            <h4>🔍 Обнаруженные объекты</h4>
                            <div class="ai-detected-objects"></div>
                        </div>

                        <!-- Measurements -->
                        <div class="ai-result-section ai-measurements" style="display: none;">
                            <h4>📐 Измерения</h4>
                            <div class="ai-measurements-list"></div>
                        </div>

                        <!-- Estimate -->
                        <div class="ai-result-section ai-estimate" style="display: none;">
                            <h4>💰 Предварительная смета</h4>
                            <div class="ai-estimate-table-wrapper">
                                <table class="ai-estimate-table">
                                    <thead>
                                        <tr>
                                            <th>Наименование работ</th>
                                            <th>Ед.</th>
                                            <th>Кол-во</th>
                                            <th>Цена</th>
                                            <th>Сумма</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="4"><strong>ИТОГО:</strong></td>
                                            <td class="ai-estimate-total"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <div class="ai-estimate-confidence"></div>
                        </div>

                        <!-- Warnings -->
                        <div class="ai-warnings" style="display: none;"></div>

                        <!-- Actions -->
                        <div class="ai-result-actions">
                            <button class="ai-btn ai-btn-secondary ai-btn-new">
                                Новый анализ
                            </button>
                            <button class="ai-btn ai-btn-primary ai-btn-use-estimate">
                                Использовать смету
                            </button>
                        </div>
                    </div>

                    <!-- Error State -->
                    <div class="ai-error" id="ai-error-${containerId}" style="display: none;">
                        <div class="ai-error-icon">⚠️</div>
                        <h4>Ошибка анализа</h4>
                        <p class="ai-error-message"></p>
                        <button class="ai-btn ai-btn-secondary ai-btn-retry">
                            Попробовать снова
                        </button>
                    </div>
                </div>
            `;

            // Attach event listeners
            this._attachEvents(containerId, config);
        },

        /**
         * Attach event listeners
         * @private
         */
        _attachEvents(containerId, config) {
            const container = document.getElementById(containerId);
            const uploadZone = document.getElementById(`ai-upload-zone-${containerId}`);
            const fileInput = document.getElementById(`ai-file-input-${containerId}`);
            const analyzeBtn = document.getElementById(`ai-analyze-btn-${containerId}`);
            const previewContainer = document.getElementById(`ai-preview-${containerId}`);
            const cameraBtn = document.getElementById(`ai-camera-btn-${containerId}`);
            const cameraInput = document.getElementById(`ai-camera-input-${containerId}`);

            // Click to upload
            uploadZone.addEventListener('click', (e) => {
                if (e.target.closest('.ai-camera-btn')) return;
                fileInput.click();
            });

            // Camera button
            if (cameraBtn) {
                cameraBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (cameraInput) cameraInput.click();
                });
            }

            // File selected
            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this._handleFile(containerId, e.target.files[0], config);
                }
            });

            // Camera input
            if (cameraInput) {
                cameraInput.addEventListener('change', (e) => {
                    if (e.target.files.length > 0) {
                        this._handleFile(containerId, e.target.files[0], config);
                    }
                });
            }

            // Drag and drop
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('ai-dragover');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('ai-dragover');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('ai-dragover');

                if (e.dataTransfer.files.length > 0) {
                    this._handleFile(containerId, e.dataTransfer.files[0], config);
                }
            });

            // Remove button
            container.querySelector('.ai-btn-remove')?.addEventListener('click', (e) => {
                e.stopPropagation();
                this._reset(containerId);
            });

            // Analyze button
            analyzeBtn?.addEventListener('click', () => {
                this._analyze(containerId, config);
            });

            // New analysis button
            container.querySelector('.ai-btn-new')?.addEventListener('click', () => {
                this._reset(containerId);
            });

            // Retry button
            container.querySelector('.ai-btn-retry')?.addEventListener('click', () => {
                this._analyze(containerId, config);
            });

            // Use estimate button
            container.querySelector('.ai-btn-use-estimate')?.addEventListener('click', () => {
                if (config.onAnalysisComplete && this.currentResult) {
                    config.onAnalysisComplete(this.currentResult);
                }
            });
        },

        /**
         * Handle file selection
         * @private
         */
        _handleFile(containerId, file, config) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                (window.QazUI?.alert || window.alert)('Неверный формат', 'Пожалуйста, выберите изображение (JPG, PNG, WebP)', { icon: '📷' });
                return;
            }

            // Validate file size (50MB)
            if (file.size > 50 * 1024 * 1024) {
                (window.QazUI?.alert || window.alert)('Файл слишком большой', 'Максимальный размер файла — 50 МБ', { icon: '⚠️' });
                return;
            }

            this.currentImage = file;

            // Show preview
            const uploadZone = document.getElementById(`ai-upload-zone-${containerId}`);
            const previewContainer = document.getElementById(`ai-preview-${containerId}`);
            const previewImage = previewContainer.querySelector('.ai-preview-image');
            const filenameSpan = previewContainer.querySelector('.ai-preview-filename');

            uploadZone.style.display = 'none';
            previewContainer.style.display = 'block';

            filenameSpan.textContent = file.name;

            const reader = new FileReader();
            reader.onload = (e) => {
                previewImage.src = e.target.result;
            };
            reader.readAsDataURL(file);

            // Hide results
            document.getElementById(`ai-results-${containerId}`).style.display = 'none';
            document.getElementById(`ai-error-${containerId}`).style.display = 'none';
        },

        /**
         * Run analysis
         * @private
         */
        async _analyze(containerId, config) {
            if (!this.currentImage || this.isAnalyzing) return;

            this.isAnalyzing = true;

            const previewContainer = document.getElementById(`ai-preview-${containerId}`);
            const loadingEl = document.getElementById(`ai-loading-${containerId}`);
            const resultsEl = document.getElementById(`ai-results-${containerId}`);
            const errorEl = document.getElementById(`ai-error-${containerId}`);
            const analyzeBtn = document.getElementById(`ai-analyze-btn-${containerId}`);

            // Get reference object selection
            const refSelect = previewContainer.querySelector('.ai-reference-select');
            const referenceObject = refSelect?.value || config.referenceObject;

            // Show loading with step animation
            analyzeBtn.disabled = true;
            loadingEl.style.display = 'flex';
            resultsEl.style.display = 'none';
            errorEl.style.display = 'none';

            // Animate steps
            const steps = loadingEl.querySelectorAll('.ai-step');
            steps.forEach(s => s.classList.remove('active', 'done'));
            const animateStep = (stepNum) => {
                steps.forEach((s, i) => {
                    if (i < stepNum) { s.classList.add('done'); s.classList.remove('active'); }
                    else if (i === stepNum) { s.classList.add('active'); s.classList.remove('done'); }
                    else { s.classList.remove('active', 'done'); }
                });
            };
            let stepIndex = 0;
            animateStep(0);
            const stepInterval = setInterval(() => {
                stepIndex++;
                if (stepIndex < 5) animateStep(stepIndex);
            }, 800);

            try {
                // Check if AI service is available
                if (!window.AIService) {
                    throw new Error('AI сервис не подключен');
                }

                const available = await AIService.isAvailable();
                if (!available) {
                    throw new Error('AI сервис недоступен. Убедитесь, что он запущен.');
                }

                // Analyze
                const result = await AIService.analyze(this.currentImage, {
                    referenceObject: referenceObject || undefined,
                    region: config.region,
                    generateEstimate: config.showEstimate
                });

                this.currentResult = result;

                // Draw detections on canvas
                this._drawDetections(containerId, result);

                // Display results
                this._displayResults(containerId, result, config);

                clearInterval(stepInterval);
                steps.forEach(s => { s.classList.add('done'); s.classList.remove('active'); });
                await new Promise(r => setTimeout(r, 400));
                loadingEl.style.display = 'none';
                resultsEl.style.display = 'block';

            } catch (error) {
                console.error('Analysis error:', error);
                clearInterval(stepInterval);
                loadingEl.style.display = 'none';
                errorEl.style.display = 'flex';
                errorEl.querySelector('.ai-error-message').textContent = error.message;

                if (config.onError) {
                    config.onError(error);
                }
            } finally {
                this.isAnalyzing = false;
                analyzeBtn.disabled = false;
            }
        },

        /**
         * Draw detections on canvas overlay
         * @private
         */
        _drawDetections(containerId, result) {
            const previewContainer = document.getElementById(`ai-preview-${containerId}`);
            const image = previewContainer.querySelector('.ai-preview-image');
            const canvas = previewContainer.querySelector('.ai-detection-canvas');
            const ctx = canvas.getContext('2d');

            // Wait for image to load
            if (!image.complete) {
                image.onload = () => this._drawDetections(containerId, result);
                return;
            }

            // Set canvas size to match image display size
            const rect = image.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;

            // Calculate scale factors
            const scaleX = rect.width / result.imageWidth;
            const scaleY = rect.height / result.imageHeight;

            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw each detection
            result.objects.forEach(obj => {
                const [x1, y1, x2, y2] = obj.bbox;
                const x = x1 * scaleX;
                const y = y1 * scaleY;
                const w = (x2 - x1) * scaleX;
                const h = (y2 - y1) * scaleY;

                // Draw box
                ctx.strokeStyle = obj.color;
                ctx.lineWidth = 2;
                ctx.strokeRect(x, y, w, h);

                // Draw label background
                const label = `${obj.localizedName} ${obj.confidencePercent}%`;
                ctx.font = '12px Inter, sans-serif';
                const textWidth = ctx.measureText(label).width;

                ctx.fillStyle = obj.color;
                ctx.fillRect(x, y - 20, textWidth + 8, 20);

                // Draw label text
                ctx.fillStyle = 'white';
                ctx.fillText(label, x + 4, y - 6);
            });
        },

        /**
         * Display analysis results
         * @private
         */
        _displayResults(containerId, result, config) {
            const resultsEl = document.getElementById(`ai-results-${containerId}`);

            // Detected objects
            const objectsEl = resultsEl.querySelector('.ai-detected-objects');
            const summary = result.getSummary();

            objectsEl.innerHTML = Object.entries(summary).map(([className, data]) => `
                <div class="ai-object-chip" style="--chip-color: ${AIService.CLASS_COLORS[className] || '#888'}">
                    <span class="ai-object-name">${AIService.CLASS_NAMES_RU[className] || className}</span>
                    <span class="ai-object-count">${data.count}</span>
                </div>
            `).join('') || '<p class="ai-no-objects">Объекты не обнаружены</p>';

            // Measurements
            if (result.hasScale) {
                const measurementsSection = resultsEl.querySelector('.ai-measurements');
                const measurementsList = resultsEl.querySelector('.ai-measurements-list');

                measurementsSection.style.display = 'block';

                let measurementsHtml = '';
                result.objects.forEach(obj => {
                    if (obj.hasMetrics) {
                        measurementsHtml += `
                            <div class="ai-measurement-item">
                                <span class="ai-measurement-name">${obj.localizedName}</span>
                                <span class="ai-measurement-values">
                                    ${obj.widthM ? `Ш: ${obj.widthM.toFixed(2)}м` : ''}
                                    ${obj.heightM ? `В: ${obj.heightM.toFixed(2)}м` : ''}
                                    ${obj.depthM ? `Г: ${obj.depthM.toFixed(2)}м` : ''}
                                    ${obj.volumeM3 ? `Объём: ${obj.volumeM3.toFixed(2)}м³` : ''}
                                </span>
                            </div>
                        `;
                    }
                });

                measurementsList.innerHTML = measurementsHtml || '<p>Нет данных об измерениях</p>';
            }

            // Estimate
            if (result.hasEstimate && config.showEstimate) {
                const estimateSection = resultsEl.querySelector('.ai-estimate');
                const tbody = resultsEl.querySelector('.ai-estimate-table tbody');
                const totalEl = resultsEl.querySelector('.ai-estimate-total');
                const confidenceEl = resultsEl.querySelector('.ai-estimate-confidence');

                estimateSection.style.display = 'block';

                tbody.innerHTML = result.estimateItems.map(item => `
                    <tr>
                        <td>${item.work_name}</td>
                        <td>${item.unit}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit_price.toLocaleString('ru-RU')} ₸</td>
                        <td>${item.total_price.toLocaleString('ru-RU')} ₸</td>
                    </tr>
                `).join('');

                totalEl.innerHTML = `<strong>${result.getFormattedTotal()}</strong>`;

                const confPercent = Math.round(result.estimateConfidence * 100);
                confidenceEl.innerHTML = `
                    <span class="ai-confidence-label">Уверенность расчёта:</span>
                    <span class="ai-confidence-value ${confPercent >= 70 ? 'high' : confPercent >= 50 ? 'medium' : 'low'}">
                        ${confPercent}%
                    </span>
                `;
            }

            // Warnings
            if (result.warnings.length > 0) {
                const warningsEl = resultsEl.querySelector('.ai-warnings');
                warningsEl.style.display = 'block';
                warningsEl.innerHTML = result.warnings.map(w => `
                    <div class="ai-warning-item">⚠️ ${w}</div>
                `).join('');
            }
        },

        /**
         * Reset to initial state
         * @private
         */
        _reset(containerId) {
            const uploadZone = document.getElementById(`ai-upload-zone-${containerId}`);
            const previewContainer = document.getElementById(`ai-preview-${containerId}`);
            const resultsEl = document.getElementById(`ai-results-${containerId}`);
            const errorEl = document.getElementById(`ai-error-${containerId}`);
            const fileInput = document.getElementById(`ai-file-input-${containerId}`);
            const canvas = previewContainer.querySelector('.ai-detection-canvas');

            this.currentImage = null;
            this.currentResult = null;

            uploadZone.style.display = 'flex';
            previewContainer.style.display = 'none';
            resultsEl.style.display = 'none';
            errorEl.style.display = 'none';

            fileInput.value = '';

            // Clear canvas
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    // Export
    global.AIAnalyzerUI = AIAnalyzerUI;

})(typeof window !== 'undefined' ? window : this);
