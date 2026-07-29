/**
 * QAZGOST AI - Browser Mock Service
 * 
 * Generates realistic construction object detections locally in the browser.
 * Used when the Python AI backend (localhost:8001) is not available.
 * 
 * Integrates with AIService by overriding isAvailable() and analyze() methods.
 * 
 * @version 1.0.0
 */

(function (global) {
    'use strict';

    // ================================================================
    // CONFIGURATION
    // ================================================================

    const MOCK_CONFIG = {
        enabled: true,                  // Set to false to disable mock
        simulateDelay: true,            // Simulate network delay
        delayMs: { min: 800, max: 2000 }, // Random delay range
        minDetections: 2,               // Min objects per image
        maxDetections: 6,               // Max objects per image
        confidenceRange: { min: 0.72, max: 0.97 }
    };

    // ================================================================
    // CONSTRUCTION DETECTION SCENARIOS
    // ================================================================

    // Weighted scenarios — each describes a likely combination of objects
    // that the AI model would detect on a real construction photo
    const DETECTION_SCENARIOS = [
        {
            name: 'earthworks',
            weight: 20,
            objects: [
                { className: 'trench', weight: 40, depthRange: [1.0, 2.5], widthRange: [0.6, 1.5] },
                { className: 'pit', weight: 30, depthRange: [1.5, 4.0], widthRange: [3, 8] },
                { className: 'sand_bed', weight: 25 },
                { className: 'gravel_bed', weight: 20 },
                { className: 'person', weight: 15 }
            ]
        },
        {
            name: 'foundation',
            weight: 25,
            objects: [
                { className: 'foundation', weight: 50, areaRange: [40, 120] },
                { className: 'rebar', weight: 40 },
                { className: 'formwork', weight: 35 },
                { className: 'concrete_slab', weight: 25 },
                { className: 'waterproofing', weight: 20 },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'walls',
            weight: 20,
            objects: [
                { className: 'wall_brick', weight: 40, areaRange: [15, 80] },
                { className: 'wall_block', weight: 35, areaRange: [15, 80] },
                { className: 'insulation', weight: 25 },
                { className: 'formwork', weight: 15 },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'pipes',
            weight: 15,
            objects: [
                { className: 'pipe_pvc', weight: 40, lengthRange: [3, 20] },
                { className: 'pipe_metal', weight: 30, lengthRange: [3, 15] },
                { className: 'pipe_hdpe', weight: 25, lengthRange: [5, 30] },
                { className: 'trench', weight: 35, depthRange: [0.8, 1.8] },
                { className: 'manhole', weight: 20 },
                { className: 'sand_bed', weight: 15 }
            ]
        },
        {
            name: 'concrete',
            weight: 10,
            objects: [
                { className: 'concrete_slab', weight: 45, areaRange: [10, 60] },
                { className: 'rebar', weight: 40 },
                { className: 'formwork', weight: 40 },
                { className: 'pile', weight: 15 },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'waterproofing_insulation',
            weight: 10,
            objects: [
                { className: 'waterproofing', weight: 45, areaRange: [20, 100] },
                { className: 'insulation', weight: 40, areaRange: [20, 100] },
                { className: 'foundation', weight: 25 },
                { className: 'sand_bed', weight: 15 },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'interior_finishing',
            weight: 20,
            objects: [
                { className: 'plaster', weight: 40, areaRange: [30, 120] },
                { className: 'tiles_wall', weight: 35, areaRange: [8, 30] },
                { className: 'tiles_floor', weight: 30, areaRange: [6, 20] },
                { className: 'painting', weight: 35, areaRange: [40, 150] },
                { className: 'wallpaper', weight: 20, areaRange: [40, 120] },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'electrical',
            weight: 15,
            objects: [
                { className: 'wiring', weight: 50, areaRange: [40, 120] },
                { className: 'plaster', weight: 20, areaRange: [20, 60] },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'plumbing',
            weight: 15,
            objects: [
                { className: 'pipe_water', weight: 45, lengthRange: [8, 25] },
                { className: 'pipe_sewer', weight: 40, lengthRange: [5, 15] },
                { className: 'tiles_wall', weight: 30, areaRange: [10, 25] },
                { className: 'tiles_floor', weight: 25, areaRange: [4, 12] },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'roofing',
            weight: 10,
            objects: [
                { className: 'roof_metal', weight: 50, areaRange: [60, 200] },
                { className: 'insulation', weight: 35, areaRange: [60, 200] },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'facade',
            weight: 10,
            objects: [
                { className: 'facade', weight: 50, areaRange: [40, 200] },
                { className: 'insulation', weight: 35, areaRange: [40, 200] },
                { className: 'person', weight: 10 }
            ]
        },
        {
            name: 'full_renovation',
            weight: 15,
            objects: [
                { className: 'full_renovation', weight: 60, areaRange: [40, 120] },
                { className: 'wiring', weight: 30, areaRange: [40, 120] },
                { className: 'plaster', weight: 25, areaRange: [40, 120] },
                { className: 'person', weight: 10 }
            ]
        }
    ];

    // ================================================================
    // MOCK DETECTION GENERATOR
    // ================================================================

    function randomBetween(min, max) {
        return min + Math.random() * (max - min);
    }

    function randomInt(min, max) {
        return Math.floor(randomBetween(min, max + 1));
    }

    /**
     * Choose a detection scenario (weighted random)
     */
    function chooseScenario() {
        const totalWeight = DETECTION_SCENARIOS.reduce((s, sc) => s + sc.weight, 0);
        let roll = Math.random() * totalWeight;
        for (const sc of DETECTION_SCENARIOS) {
            roll -= sc.weight;
            if (roll <= 0) return sc;
        }
        return DETECTION_SCENARIOS[0];
    }

    /**
     * Generate a bounding box within image dimensions
     */
    function generateBBox(imgW, imgH, sizeHint) {
        // sizeHint: 'small' | 'medium' | 'large'
        const sizeFactors = {
            small: { wMin: 0.08, wMax: 0.20, hMin: 0.08, hMax: 0.20 },
            medium: { wMin: 0.20, wMax: 0.50, hMin: 0.15, hMax: 0.45 },
            large: { wMin: 0.40, wMax: 0.85, hMin: 0.25, hMax: 0.70 }
        };
        const f = sizeFactors[sizeHint] || sizeFactors.medium;

        const bw = Math.round(imgW * randomBetween(f.wMin, f.wMax));
        const bh = Math.round(imgH * randomBetween(f.hMin, f.hMax));
        const x1 = Math.round(randomBetween(0, Math.max(0, imgW - bw)));
        const y1 = Math.round(randomBetween(0, Math.max(0, imgH - bh)));
        const x2 = Math.min(imgW, x1 + bw);
        const y2 = Math.min(imgH, y1 + bh);

        return [x1, y1, x2, y2];
    }

    /**
     * Compute size hint based on object type
     */
    function getSizeHint(className) {
        const largeClasses = ['trench', 'pit', 'foundation', 'concrete_slab'];
        const smallClasses = ['manhole', 'pipe_pvc', 'pipe_metal', 'pipe_hdpe', 'pile', 'measuring_tape', 'person'];
        if (largeClasses.includes(className)) return 'large';
        if (smallClasses.includes(className)) return 'small';
        return 'medium';
    }

    /**
     * Generate physical measurements for a detection.
     * Simulates the scale calibration + depth estimation that the real backend performs.
     */
    function generateMeasurements(className, bbox, imgW, imgH, objDef) {
        const bboxW = bbox[2] - bbox[0];
        const bboxH = bbox[3] - bbox[1];

        // Assume a rough scale: the image covers approximately 6-15 meters width
        const estimatedSceneWidth = randomBetween(6, 15); // meters
        const pxPerMeter = imgW / estimatedSceneWidth;

        const widthM = Math.round((bboxW / pxPerMeter) * 100) / 100;
        const heightM = Math.round((bboxH / pxPerMeter) * 100) / 100;

        let areaM2 = null, volumeM3 = null, depthM = null;

        // Excavation types
        if (['trench', 'pit'].includes(className)) {
            depthM = objDef?.depthRange
                ? Math.round(randomBetween(...objDef.depthRange) * 10) / 10
                : Math.round(randomBetween(1.0, 2.5) * 10) / 10;
            areaM2 = Math.round(widthM * heightM * 10) / 10;
            volumeM3 = Math.round(areaM2 * depthM * 10) / 10;
        }
        // Area-based objects
        else if (['foundation', 'wall_brick', 'wall_block', 'concrete_slab',
            'waterproofing', 'insulation', 'formwork', 'sand_bed', 'gravel_bed'].includes(className)) {
            areaM2 = objDef?.areaRange
                ? Math.round(randomBetween(...objDef.areaRange) * 10) / 10
                : Math.round(widthM * heightM * 10) / 10;

            if (['concrete_slab'].includes(className)) {
                volumeM3 = Math.round(areaM2 * randomBetween(0.15, 0.35) * 10) / 10;
            }
            if (['sand_bed', 'gravel_bed'].includes(className)) {
                volumeM3 = Math.round(areaM2 * randomBetween(0.1, 0.3) * 10) / 10;
            }
        }
        // Linear objects (pipes)
        else if (['pipe_pvc', 'pipe_metal', 'pipe_hdpe'].includes(className)) {
            const lengthM = objDef?.lengthRange
                ? Math.round(randomBetween(...objDef.lengthRange) * 10) / 10
                : Math.round(Math.max(widthM, heightM) * 10) / 10;
            areaM2 = null;
            volumeM3 = null;
            return { width_m: lengthM, height_m: 0.15, depth_m: null, area_m2: null, volume_m3: null };
        }
        // Rebar
        else if (className === 'rebar') {
            areaM2 = Math.round(widthM * heightM * 10) / 10;
        }
        // Manhole
        else if (className === 'manhole') {
            areaM2 = Math.round(Math.PI * 0.5 * 0.5 * 10) / 10; // Ø1m
        }
        // Person / reference
        else if (className === 'person') {
            return { width_m: 0.5, height_m: 1.75, depth_m: null, area_m2: null, volume_m3: null };
        }

        return {
            width_m: widthM,
            height_m: heightM,
            depth_m: depthM,
            area_m2: areaM2,
            volume_m3: volumeM3
        };
    }

    /**
     * Generate mock detections for one image
     */
    function generateDetections(imgW, imgH) {
        const scenario = chooseScenario();
        console.log(`[MockAI] Scenario: ${scenario.name}`);

        const numDetections = randomInt(MOCK_CONFIG.minDetections, MOCK_CONFIG.maxDetections);
        const detections = [];
        const usedClasses = new Set();

        // Weighted selection of objects from scenario
        const sortedObjects = [...scenario.objects].sort((a, b) => b.weight - a.weight);

        for (let i = 0; i < numDetections && i < sortedObjects.length; i++) {
            const objDef = sortedObjects[i];

            // Some randomness: skip lower-weight objects sometimes
            if (i > 1 && Math.random() > (objDef.weight / 50)) continue;
            if (usedClasses.has(objDef.className)) continue;
            usedClasses.add(objDef.className);

            const sizeHint = getSizeHint(objDef.className);
            const bbox = generateBBox(imgW, imgH, sizeHint);
            const confidence = Math.round(randomBetween(
                MOCK_CONFIG.confidenceRange.min,
                MOCK_CONFIG.confidenceRange.max
            ) * 1000) / 1000;

            const measurements = generateMeasurements(objDef.className, bbox, imgW, imgH, objDef);

            const classNames = global.AIService?.CLASS_NAMES_RU || {};
            const classColors = global.AIService?.CLASS_COLORS || {};

            detections.push({
                class_id: getClassId(objDef.className),
                class_name: objDef.className,
                confidence: confidence,
                bbox: bbox,
                center: [Math.round((bbox[0] + bbox[2]) / 2), Math.round((bbox[1] + bbox[3]) / 2)],
                width_px: bbox[2] - bbox[0],
                height_px: bbox[3] - bbox[1],
                area_px: (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]),
                width_m: measurements.width_m,
                height_m: measurements.height_m,
                depth_m: measurements.depth_m,
                area_m2: measurements.area_m2,
                volume_m3: measurements.volume_m3
            });
        }

        return detections;
    }

    const CLASS_NAMES_LIST = [
        "trench", "pit", "foundation", "pipe_pvc", "pipe_metal",
        "pipe_hdpe", "manhole", "wall_brick", "wall_block", "concrete_slab",
        "rebar", "gravel_bed", "sand_bed", "waterproofing", "insulation",
        "formwork", "pile", "measuring_tape", "person", "excavator_bucket"
    ];

    function getClassId(className) {
        const idx = CLASS_NAMES_LIST.indexOf(className);
        return idx >= 0 ? idx : 0;
    }

    /**
     * Load image from File and return dimensions + dataUrl
     */
    function loadImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const img = new Image();
                img.onload = function () {
                    resolve({ width: img.width, height: img.height, dataUrl: e.target.result });
                };
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Simulate a realistic processing delay
     */
    function simulateDelay() {
        if (!MOCK_CONFIG.simulateDelay) return Promise.resolve();
        const ms = randomInt(MOCK_CONFIG.delayMs.min, MOCK_CONFIG.delayMs.max);
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ================================================================
    // MOCK ANALYSIS API
    // ================================================================

    /**
     * Mock version of AIClient.analyzeImage()
     * Returns data in the same format as the real backend.
     */
    async function mockAnalyzeImage(imageFile, options = {}) {
        console.log('[MockAI] Analyzing image:', imageFile.name || 'unknown', `(${(imageFile.size / 1024).toFixed(0)} KB)`);

        // Load image to get dimensions
        const imgInfo = await loadImageFile(imageFile);
        const imgW = imgInfo.width;
        const imgH = imgInfo.height;

        // Simulate processing
        await simulateDelay();

        // Generate detections
        const detections = generateDetections(imgW, imgH);

        // Build measurements summary
        const measurements = {};
        detections.forEach(d => {
            if (!measurements[d.class_name]) {
                measurements[d.class_name] = {
                    count: 0, total_area_px: 0, total_area_m2: 0, total_volume_m3: 0
                };
            }
            measurements[d.class_name].count++;
            measurements[d.class_name].total_area_px += d.area_px;
            if (d.area_m2) measurements[d.class_name].total_area_m2 += d.area_m2;
            if (d.volume_m3) measurements[d.class_name].total_volume_m3 += d.volume_m3;
        });

        // Build result in same format as AnalysisResult expects
        const result = {
            success: true,
            image_id: 'mock-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6),
            image_width: imgW,
            image_height: imgH,
            detected_objects: detections,
            object_count: detections.length,
            scale_calibrated: true,
            scale_factor: null,
            reference_object: 'auto',
            measurements: measurements,
            estimate_items: null,
            estimate_total: null,
            estimate_confidence: null,
            processing_time_ms: Math.round(randomBetween(800, 2500)),
            warnings: ['[Demo] Используется локальный эмулятор AI (Mock)']
        };

        console.log(`[MockAI] Generated ${detections.length} detections:`, detections.map(d => d.class_name));

        // Return as AnalysisResult if the class exists
        if (global.AIService && global.AIService.Result) {
            return new global.AIService.Result(result);
        }
        return result;
    }

    /**
     * Mock isAvailable — always returns true when mock is enabled
     */
    async function mockIsAvailable() {
        if (!MOCK_CONFIG.enabled) return false;
        // Small delay to feel realistic
        await new Promise(r => setTimeout(r, 100));
        return true;
    }

    // ================================================================
    // INTEGRATION WITH AISERVICE
    // ================================================================

    /**
     * Install Mock AI into the existing AIService.
     * Overrides isAvailable() and analyze() to use local mock when backend is down.
     */
    function installMockAI() {
        if (!global.AIService) {
            console.warn('[MockAI] AIService not found, creating standalone');
            global.AIService = {};
        }

        // Save original methods
        const originalIsAvailable = global.AIService.isAvailable?.bind(global.AIService);
        const originalAnalyze = global.AIService.analyze?.bind(global.AIService);

        // Override isAvailable: try real backend first, fall back to mock
        global.AIService.isAvailable = async function () {
            // First, try real backend
            if (originalIsAvailable) {
                try {
                    const real = await Promise.race([
                        originalIsAvailable(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
                    ]);
                    if (real) {
                        console.log('[MockAI] Real AI backend is available');
                        global.AIService._usingMock = false;
                        return true;
                    }
                } catch (e) {
                    // Backend not available
                }
            }

            // Use mock
            if (MOCK_CONFIG.enabled) {
                console.log('[MockAI] Using browser mock AI service');
                global.AIService._usingMock = true;
                return true;
            }

            return false;
        };

        // Override analyze: use real backend if available, otherwise mock
        global.AIService.analyze = async function (imageFile, options) {
            // If we know mock is in use, go directly to mock
            if (global.AIService._usingMock) {
                return mockAnalyzeImage(imageFile, options);
            }

            // Try real backend
            if (originalAnalyze) {
                try {
                    const result = await Promise.race([
                        originalAnalyze(imageFile, options),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000))
                    ]);
                    return result;
                } catch (e) {
                    console.warn('[MockAI] Real backend failed, using mock:', e.message);
                    global.AIService._usingMock = true;
                }
            }

            return mockAnalyzeImage(imageFile, options);
        };

        // Flag
        global.AIService._mockInstalled = true;
        global.AIService._usingMock = false;

        console.log('[MockAI] ✅ Mock AI Service installed (auto-fallback mode)');
    }

    // ================================================================
    // AUTO-INSTALL
    // ================================================================

    // Install after a short delay to ensure AIService is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(installMockAI, 100);
        });
    } else {
        setTimeout(installMockAI, 100);
    }

    // Export for manual use
    global.MockAIService = {
        config: MOCK_CONFIG,
        install: installMockAI,
        analyze: mockAnalyzeImage,
        isAvailable: mockIsAvailable,
        generateDetections: generateDetections
    };

})(typeof window !== 'undefined' ? window : this);
