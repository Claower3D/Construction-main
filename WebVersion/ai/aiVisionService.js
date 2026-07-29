/**
 * aiVisionService.js — On-Prem AI Vision Bridge
 *
 * Orchestrates calls to the Python FastAPI backend (localhost:8001)
 * running RF-DETR + SAM + Qwen2.5-VL.
 *
 * Priority chain:
 *   1. Python backend (localhost:8001) — on-prem, real models
 *   2. aiMockService (browser Canvas) — offline fallback
 *
 * API surface consumed by estimateWizardUI.js:
 *   AIVisionService.analyze(imageFile, options) → VisionResult
 *   AIVisionService.isOnline()                 → Promise<boolean>
 *   AIVisionService.getProviderName()          → string
 *
 * @module AIVisionService
 */

(function () {
    'use strict';

    const BACKEND_URL = 'http://localhost:8001/api/v1';
    const TIMEOUT_MS = 45000;  // 45s — Qwen can be slow on CPU

    // ─────────────────────────────────────────────────────────────────────────
    // VisionResult — normalized output consumed by wizard + estimateService
    // ─────────────────────────────────────────────────────────────────────────

    class VisionResult {
        /**
         * @param {Object} raw  — raw AnalysisResponse from Python backend
         *                        or EstimateResult from aiMockService
         * @param {string} provider  — 'onprem' | 'mock'
         */
        constructor(raw, provider = 'onprem') {
            this.provider = provider;
            this.raw = raw;

            // ── from Qwen2.5-VL structured output ──────────────────────────
            const q = raw.qwen_result || {};

            this.objectType = q.objectType || raw.objectType || 'generic';
            this.objectTypeConfidence = q.confidence || raw.objectTypeConfidence || 60;
            this.signals = q.signals || raw.signals || [];
            this.defects = q.defects || raw.defects || [];
            this.materialsFound = q.materials_seen || [];
            this.missingPhotos = q.missing_photos || [];
            this.sceneDescription = q.scene_description || '';

            // ── dimensions (from Qwen estimate or CV calibration) ──────────
            const dimQ = q.dimensions_estimate || {};
            this.dimensions = {
                widthM: dimQ.width_m || raw.dimensions?.widthM || null,
                heightM: dimQ.height_m || raw.dimensions?.heightM || null,
                areaM2: dimQ.area_m2 || raw.dimensions?.areaM2 || null,
                depthM: dimQ.depth_m || raw.dimensions?.depthM || null,
                perimeterM: dimQ.perimeter_m || null,
            };

            // ── detected objects (from RF-DETR + SAM) ─────────────────────
            this.detectedObjects = (raw.detected_objects || []).map(d => ({
                className: d.class_name,
                confidence: d.confidence,
                bbox: d.bbox,
                areaM2: d.area_m2,
                volumeM3: d.volume_m3,
                widthM: d.width_m,
                heightM: d.height_m,
            }));

            // ── estimate items from AutoEstimator ─────────────────────────
            this.estimateItems = (raw.estimate_items || []).map(it => ({
                workCode: it.work_code,
                workName: it.work_name,
                unit: it.unit,
                quantity: it.quantity,
                unitPrice: it.unit_price,
                totalPrice: it.total_price,
                confidence: it.confidence,
            }));

            this.estimateTotal = raw.estimate_total || null;
            this.estimateConfidence = raw.estimate_confidence || null;

            // ── scale ──────────────────────────────────────────────────────
            this.scaleCalibrated = raw.scale_calibrated || false;
            this.scaleFactor = raw.scale_factor || null;
            this.referenceObject = raw.reference_object || null;

            // ── meta ────────────────────────────────────────────────────────
            this.processingMs = raw.processing_time_ms || 0;
            this.warnings = raw.warnings || [];

            // ── legacy compat (estimateWizardUI.js reads these) ───────────
            this.lighting = raw.lighting || (raw.image_width > 0 ? 'good' : 'moderate');
            this.scale = raw.scaleFactor || 150;
            this.accuracy = this.scaleCalibrated ? 88 : 70;
            this.accuracyReasons = this.scaleCalibrated
                ? ['Калибровка масштаба выполнена по эталонному объекту']
                : ['Масштаб определён автоматически (без эталона)'];
        }

        /** @returns {Object} compatible with EstimateService.analyzePhoto result */
        toEstimateData() {
            return {
                objectType: this.objectType,
                objectTypeConfidence: this.objectTypeConfidence,
                signals: this.signals,
                defects: this.defects,
                dimensions: this.dimensions,
                lighting: this.lighting,
                scale: this.scale,
                accuracy: this.accuracy,
                accuracyReasons: this.accuracyReasons,
                // Extra AI fields
                detectedObjects: this.detectedObjects,
                estimateItems: this.estimateItems,
                estimateTotal: this.estimateTotal,
                sceneDescription: this.sceneDescription,
                materialsFound: this.materialsFound,
                missingPhotos: this.missingPhotos,
                provider: this.provider,
            };
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AIVisionService
    // ─────────────────────────────────────────────────────────────────────────

    const AIVisionService = {

        // ── Internal state ────────────────────────────────────────────────
        _onpremAvailable: null,  // null = not yet checked
        _lastOnlineCheck: 0,
        _CHECK_INTERVAL: 30000,  // re-check every 30s

        // ── Public API ────────────────────────────────────────────────────

        /**
         * Analyze a construction photo.
         *
         * @param {File}   imageFile
         * @param {Object} options
         * @param {string}  options.region           — 'Алматы' etc.
         * @param {number}  options.confidence        — detection threshold 0-1
         * @param {string}  options.referenceObject   — 'person' | 'measuring_tape'
         * @param {number}  options.referenceSize     — meters
         * @param {Function} options.onProgress       — callback(step, label)
         *
         * @returns {Promise<VisionResult>}
         */
        async analyze(imageFile, options = {}) {
            const {
                region = 'Алматы',
                confidence = 0.30,
                referenceObject = null,
                referenceSize = null,
                onProgress = null,
            } = options;

            const progress = (step, label) => {
                if (typeof onProgress === 'function') onProgress(step, label);
            };

            // ── Try on-prem backend ───────────────────────────────────────
            const online = await this.isOnline();

            if (online) {
                try {
                    progress(1, '📡 Отправка в локальный AI-сервис...');

                    const regionKey = this._mapRegion(region);
                    const params = new URLSearchParams({ region: regionKey, confidence }).toString();

                    if (referenceObject) params.append('reference_object', referenceObject);
                    if (referenceSize) params.append('reference_size', referenceSize);

                    const formData = new FormData();
                    formData.append('file', imageFile);

                    const urlParams = new URLSearchParams({ region: regionKey, confidence });
                    if (referenceObject) urlParams.append('reference_object', referenceObject);
                    if (referenceSize) urlParams.append('reference_size', referenceSize);

                    progress(2, '🔍 RF-DETR: поиск строительных объектов...');

                    const raw = await this._fetchWithTimeout(
                        `${BACKEND_URL}/analyze?${urlParams}`,
                        { method: 'POST', body: formData },
                        TIMEOUT_MS
                    );

                    progress(3, '✂️ SAM: уточнение контуров...');
                    await this._delay(200);  // visual feedback pause

                    progress(4, '🧠 Qwen2.5-VL: генерация сметы...');
                    await this._delay(200);

                    progress(5, '✅ Анализ завершён');

                    const result = new VisionResult(raw, 'onprem');
                    console.log('[AIVisionService] On-prem analysis done:', result);
                    return result;

                } catch (err) {
                    console.warn('[AIVisionService] On-prem failed, falling back to mock:', err.message);
                    this._onpremAvailable = false;
                }
            }

            // ── Fallback: aiMockService ───────────────────────────────────
            progress(1, '🖥️ Локальный Canvas-анализ (offline режим)...');

            const mockRaw = await this._runMockAnalysis(imageFile, options);
            return new VisionResult(mockRaw, 'mock');
        },

        /**
         * Check if the Python backend is reachable.
         * Result is cached for 30s.
         *
         * @returns {Promise<boolean>}
         */
        async isOnline() {
            const now = Date.now();
            if (
                this._onpremAvailable !== null &&
                now - this._lastOnlineCheck < this._CHECK_INTERVAL
            ) {
                return this._onpremAvailable;
            }

            try {
                const resp = await this._fetchWithTimeout(
                    `${BACKEND_URL}/health`,
                    { method: 'GET' },
                    3000
                );
                this._onpremAvailable = !!(resp && resp.status === 'healthy');
            } catch {
                this._onpremAvailable = false;
            }

            this._lastOnlineCheck = now;
            return this._onpremAvailable;
        },

        /** Returns human-readable provider name */
        async getProviderName() {
            const online = await this.isOnline();
            return online ? '🟢 On-Prem AI (RF-DETR + SAM + Qwen2.5-VL)' : '⚪ Mock (Canvas AI)';
        },

        // ── Internal helpers ──────────────────────────────────────────────

        async _fetchWithTimeout(url, options = {}, timeout = TIMEOUT_MS) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), timeout);
            try {
                const resp = await fetch(url, { ...options, signal: controller.signal });
                if (!resp.ok) {
                    const errText = await resp.text().catch(() => '');
                    throw new Error(`HTTP ${resp.status}: ${errText}`);
                }
                return await resp.json();
            } finally {
                clearTimeout(timer);
            }
        },

        async _runMockAnalysis(imageFile, options = {}) {
            // Delegate to existing aiMockService if available
            if (window.AIService) {
                try {
                    const svc = new window.AIService({ alwaysMock: true });
                    const result = await svc.analyze(imageFile, options);
                    return result?.raw || result || {};
                } catch (e) {
                    console.warn('[AIVisionService] Mock service error:', e);
                }
            }

            // Minimal fallback stub
            return {
                objectType: 'foundation_strip',
                objectTypeConfidence: 72,
                signals: ['Canvas-анализ (offline)', 'Модель недоступна'],
                defects: [],
                dimensions: { widthM: null, heightM: null, areaM2: null },
                lighting: 'moderate',
                scale: 150,
                estimate_items: [],
                warnings: ['On-prem AI недоступен. Запустите ai-service/'],
            };
        },

        /** Map Russian region name → backend region key */
        _mapRegion(name) {
            const MAP = {
                'Алматы': 'almaty',
                'Астана': 'astana',
                'Шымкент': 'shymkent',
                'Караганда': 'karaganda',
                'Атырау': 'atyrau',
                'Актобе': 'aktobe',
                'Тараз': 'taraz',
                'Павлодар': 'pavlodar',
                'Актау': 'aktau',
            };
            return MAP[name] || 'almaty';
        },

        _delay: (ms) => new Promise(r => setTimeout(r, ms)),
    };

    // ─────────────────────────────────────────────────────────────────────────
    // Expose globally
    // ─────────────────────────────────────────────────────────────────────────
    window.AIVisionService = AIVisionService;
    window.VisionResult = VisionResult;

    console.log('[AIVisionService] Initialized. Backend:', BACKEND_URL);

})();
