/**
 * QAZGOST AI - JavaScript Client
 * 
 * Client library for communicating with the AI analysis service.
 * Provides photo analysis, object detection, and auto-estimation.
 * 
 * @version 1.0.0
 */

(function (global) {
    'use strict';

    // ============================================================
    // CONFIGURATION
    // ============================================================

    const DEFAULT_CONFIG = {
        baseUrl: 'http://localhost:8001',
        apiVersion: 'v1',
        timeout: 30000,  // 30 seconds
        retries: 2,
        defaultConfidence: 0.25,
        defaultRegion: 'almaty'
    };

    let config = { ...DEFAULT_CONFIG };

    // ============================================================
    // AI CLIENT CLASS
    // ============================================================

    class AIClient {
        constructor(options = {}) {
            this.config = { ...config, ...options };
            this.baseUrl = `${this.config.baseUrl}/api/${this.config.apiVersion}`;
        }

        /**
         * Configure the AI client
         * @param {Object} options - Configuration options
         */
        static configure(options) {
            config = { ...config, ...options };
        }

        /**
         * Check if AI service is available
         * @returns {Promise<boolean>}
         */
        async isAvailable() {
            try {
                const response = await this._fetch('/health', { method: 'GET' });
                return response.status === 'healthy';
            } catch (error) {
                console.warn('AI service not available:', error.message);
                return false;
            }
        }

        /**
         * Get detailed service status
         * @returns {Promise<Object>}
         */
        async getStatus() {
            return this._fetch('/health/detailed', { method: 'GET' });
        }

        /**
         * Get list of detectable object classes
         * @returns {Promise<Object>}
         */
        async getClasses() {
            return this._fetch('/classes', { method: 'GET' });
        }

        /**
         * Analyze a construction photo
         * @param {File|Blob} imageFile - Image file to analyze
         * @param {Object} options - Analysis options
         * @returns {Promise<AnalysisResult>}
         */
        async analyzeImage(imageFile, options = {}) {
            const formData = new FormData();
            formData.append('file', imageFile);

            // Add optional parameters
            if (options.referenceObject) {
                formData.append('reference_object', options.referenceObject);
            }
            if (options.referenceSize) {
                formData.append('reference_size', options.referenceSize);
            }
            if (options.confidence !== undefined) {
                formData.append('confidence', options.confidence);
            }
            if (options.region) {
                formData.append('region', options.region);
            }
            if (options.calculateDepth !== undefined) {
                formData.append('calculate_depth', options.calculateDepth);
            }
            if (options.generateEstimate !== undefined) {
                formData.append('generate_estimate', options.generateEstimate);
            }

            const result = await this._fetch('/analyze', {
                method: 'POST',
                body: formData
            });

            return new AnalysisResult(result);
        }

        /**
         * Quick detection without full analysis
         * @param {File|Blob} imageFile - Image file
         * @param {Object} options - Detection options
         * @returns {Promise<Object>}
         */
        async detectObjects(imageFile, options = {}) {
            const formData = new FormData();
            formData.append('file', imageFile);

            if (options.confidence) {
                formData.append('confidence', options.confidence);
            }
            if (options.classes) {
                formData.append('classes', options.classes.join(','));
            }

            return this._fetch('/detect', {
                method: 'POST',
                body: formData
            });
        }

        /**
         * Internal fetch wrapper with retries and error handling
         * @private
         */
        async _fetch(endpoint, options = {}) {
            const url = `${this.baseUrl}${endpoint}`;
            let lastError = null;

            for (let attempt = 0; attempt <= this.config.retries; attempt++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(
                        () => controller.abort(),
                        this.config.timeout
                    );

                    const response = await fetch(url, {
                        ...options,
                        signal: controller.signal,
                        headers: {
                            ...options.headers,
                            // Don't set Content-Type for FormData
                            ...(!(options.body instanceof FormData) && {
                                'Content-Type': 'application/json'
                            })
                        }
                    });

                    clearTimeout(timeoutId);

                    if (!response.ok) {
                        const error = await response.json().catch(() => ({}));
                        throw new AIError(
                            error.message || `HTTP ${response.status}`,
                            response.status,
                            error
                        );
                    }

                    return await response.json();

                } catch (error) {
                    lastError = error;

                    if (error.name === 'AbortError') {
                        throw new AIError('Request timeout', 408);
                    }

                    // Retry on network errors
                    if (attempt < this.config.retries && !error.status) {
                        await this._delay(1000 * (attempt + 1));
                        continue;
                    }

                    throw error instanceof AIError
                        ? error
                        : new AIError(error.message, 0);
                }
            }

            throw lastError;
        }

        /**
         * Delay helper
         * @private
         */
        _delay(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    // ============================================================
    // ANALYSIS RESULT CLASS
    // ============================================================

    class AnalysisResult {
        constructor(data) {
            this.raw = data;
            this.success = data.success;
            this.imageId = data.image_id;
            this.imageWidth = data.image_width;
            this.imageHeight = data.image_height;
            this.processingTimeMs = data.processing_time_ms;
            this.warnings = data.warnings || [];

            // Detections
            this.objects = (data.detected_objects || []).map(
                obj => new DetectedObject(obj)
            );
            this.objectCount = data.object_count || 0;

            // Calibration
            this.scaleCalibrated = data.scale_calibrated || false;
            this.scaleFactor = data.scale_factor;
            this.referenceObject = data.reference_object;

            // Measurements
            this.measurements = data.measurements || {};

            // Estimate
            this.estimateItems = data.estimate_items || [];
            this.estimateTotal = data.estimate_total;
            this.estimateConfidence = data.estimate_confidence;
        }

        /**
         * Check if analysis was successful
         */
        get isSuccess() {
            return this.success && this.objectCount > 0;
        }

        /**
         * Check if scale was calibrated
         */
        get hasScale() {
            return this.scaleCalibrated && this.scaleFactor > 0;
        }

        /**
         * Check if estimate was generated
         */
        get hasEstimate() {
            return this.estimateItems.length > 0;
        }

        /**
         * Get objects by class name
         * @param {string} className 
         */
        getObjectsByClass(className) {
            return this.objects.filter(obj => obj.className === className);
        }

        /**
         * Get summary statistics
         */
        getSummary() {
            const byClass = {};
            this.objects.forEach(obj => {
                if (!byClass[obj.className]) {
                    byClass[obj.className] = {
                        count: 0,
                        totalAreaM2: 0,
                        totalVolumeM3: 0
                    };
                }
                byClass[obj.className].count++;
                if (obj.areaM2) byClass[obj.className].totalAreaM2 += obj.areaM2;
                if (obj.volumeM3) byClass[obj.className].totalVolumeM3 += obj.volumeM3;
            });
            return byClass;
        }

        /**
         * Format estimate total as currency
         */
        getFormattedTotal(currency = 'KZT') {
            if (!this.estimateTotal) return null;
            return new Intl.NumberFormat('ru-RU', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0
            }).format(this.estimateTotal);
        }
    }

    // ============================================================
    // DETECTED OBJECT CLASS
    // ============================================================

    class DetectedObject {
        constructor(data) {
            this.classId = data.class_id;
            this.className = data.class_name;
            this.confidence = data.confidence;
            this.bbox = data.bbox;  // [x1, y1, x2, y2]
            this.center = data.center;  // [x, y]
            this.widthPx = data.width_px;
            this.heightPx = data.height_px;
            this.areaPx = data.area_px;

            // Metric measurements (if calibrated)
            this.widthM = data.width_m;
            this.heightM = data.height_m;
            this.depthM = data.depth_m;
            this.areaM2 = data.area_m2;
            this.volumeM3 = data.volume_m3;
        }

        /**
         * Get confidence as percentage
         */
        get confidencePercent() {
            return Math.round(this.confidence * 100);
        }

        /**
         * Check if object has metric measurements
         */
        get hasMetrics() {
            return this.widthM !== null && this.widthM !== undefined;
        }

        /**
         * Get localized class name
         */
        get localizedName() {
            return CLASS_NAMES_RU[this.className] || this.className;
        }

        /**
         * Get CSS color for class
         */
        get color() {
            return CLASS_COLORS[this.className] || '#888888';
        }
    }

    // ============================================================
    // AI ERROR CLASS
    // ============================================================

    class AIError extends Error {
        constructor(message, status = 0, data = null) {
            super(message);
            this.name = 'AIError';
            this.status = status;
            this.data = data;
        }

        get isNetworkError() {
            return this.status === 0;
        }

        get isTimeout() {
            return this.status === 408;
        }

        get isServerError() {
            return this.status >= 500;
        }
    }

    // ============================================================
    // CONSTANTS
    // ============================================================

    const CLASS_NAMES_RU = {
        'trench': 'Траншея',
        'pit': 'Котлован',
        'foundation': 'Фундамент',
        'pipe_pvc': 'Труба ПВХ',
        'pipe_metal': 'Труба металлическая',
        'pipe_hdpe': 'Труба ПНД',
        'manhole': 'Люк / колодец',
        'wall_brick': 'Кирпичная стена',
        'wall_block': 'Блочная стена',
        'concrete_slab': 'Бетонная плита',
        'rebar': 'Арматура',
        'gravel_bed': 'Щебёночная подушка',
        'sand_bed': 'Песчаная подушка',
        'waterproofing': 'Гидроизоляция',
        'insulation': 'Утеплитель',
        'formwork': 'Опалубка',
        'pile': 'Свая',
        'measuring_tape': 'Рулетка',
        'person': 'Человек',
        'excavator_bucket': 'Ковш экскаватора'
    };

    const CLASS_COLORS = {
        'trench': '#ff6b6b',
        'pit': '#ffa94d',
        'foundation': '#74c0fc',
        'pipe_pvc': '#69db7c',
        'pipe_metal': '#868e96',
        'pipe_hdpe': '#38d9a9',
        'manhole': '#b197fc',
        'wall_brick': '#e64980',
        'wall_block': '#ff8787',
        'concrete_slab': '#a9e34b',
        'rebar': '#fab005',
        'gravel_bed': '#fcc419',
        'sand_bed': '#ffe066',
        'waterproofing': '#20c997',
        'insulation': '#ff922b',
        'formwork': '#845ef7',
        'pile': '#495057',
        'measuring_tape': '#ff6b6b',
        'person': '#4dabf7',
        'excavator_bucket': '#ffd43b'
    };

    // ============================================================
    // EXPORT
    // ============================================================

    const AIService = {
        // Classes
        Client: AIClient,
        Result: AnalysisResult,
        DetectedObject: DetectedObject,
        Error: AIError,

        // Constants
        CLASS_NAMES_RU,
        CLASS_COLORS,

        // Default client instance
        _client: null,

        /**
         * Configure global settings
         */
        configure(options) {
            AIClient.configure(options);
            this._client = null;  // Reset default client
        },

        /**
         * Get default client instance
         */
        getClient() {
            if (!this._client) {
                this._client = new AIClient();
            }
            return this._client;
        },

        /**
         * Quick check if service is available
         */
        async isAvailable() {
            return this.getClient().isAvailable();
        },

        /**
         * Analyze image using default client
         */
        async analyze(imageFile, options) {
            return this.getClient().analyzeImage(imageFile, options);
        },

        /**
         * Quick detect using default client
         */
        async detect(imageFile, options) {
            return this.getClient().detectObjects(imageFile, options);
        }
    };

    // Export to global scope
    global.AIService = AIService;

    // Also export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = AIService;
    }

})(typeof window !== 'undefined' ? window : this);
