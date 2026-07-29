// ============================================================
// photoEstimateEngine.js — Модуль оценки строительства по фото
// QAZGOST AI v3.0
//
// V3 улучшения:
//   - QTO Engine: строгие формулы + валидация
//   - 3 сценария: эконом / стандарт / премиум
//   - Скрытые работы (демонтаж, подготовка)
//   - Вопросы при неполных данных
//   - Режимы: быстрый (1 фото), полный 3D (5-10 фото), локальный (контуры)
//   - Интеграция с GroundingDINO + DefectAnalyzer
//   - Масштабирование: ArUco / A4 / EXIF / ручной ввод
//
// Порядок приоритета анализа:
//   RF-DETR + GroundingDINO > Canvas AI > эвристика
//   SfM (RANSAC planes) > Detection measurements > шаблонные размеры
//   QTO формулы > SmartEstimateEngine > типовые значения
// ============================================================

(function () {
    'use strict';

    const API_BASE = (window.QAZGOST_CONFIG && window.QAZGOST_CONFIG.aiBase) || 'http://localhost:8001';

    // ── Fetch with retry for resilient API calls ──
    async function _fetchRetry(url, options = {}, retries = 2) {
        let lastErr;
        for (let i = 0; i <= retries; i++) {
            try {
                const ctrl = new AbortController();
                const tid = setTimeout(() => ctrl.abort(), 30000 + i * 10000);
                const res = await fetch(url, { ...options, signal: ctrl.signal });
                clearTimeout(tid);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res;
            } catch (e) {
                lastErr = e;
                if (i < retries) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
            }
        }
        throw lastErr;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // МАППИНГ: результат Canvas AI → objectType
    // ─────────────────────────────────────────────────────────────────────────

    const CANVAS_TYPE_MAP = {
        wall_brick: 'wall_brick',
        wall_concrete: 'wall_block',
        wall_block: 'wall_block',
        tile_wall: 'generic',
        slab: 'slab',
        plaster: 'generic',
        drywall: 'generic',
        floor_screed: 'floor_screed',
        roof_flat: 'roof_flat',
        roof_gable: 'roof_gable',
        foundation_strip: 'foundation_strip',
        foundation_slab: 'foundation_slab',
        foundation_pile: 'foundation_pile',
    };

    const TYPE_LABELS = {
        foundation_strip: 'Ленточный фундамент',
        foundation_slab: 'Плитный фундамент',
        foundation_pile: 'Свайный фундамент',
        wall_brick: 'Кирпичная кладка',
        wall_block: 'Блочная кладка',
        floor_screed: 'Стяжка пола',
        slab: 'Перекрытие',
        roof_flat: 'Плоская кровля',
        roof_gable: 'Скатная кровля',
        pipe: 'Прокладка труб',
        pipe_pvc: 'Прокладка труб ПВХ',
        pipe_hdpe: 'Прокладка труб ПНД',
        pipe_metal: 'Прокладка металлических труб',
        generic: 'Общестроительные работы',
    };


    // ─────────────────────────────────────────────────────────────────────────
    // ШАГ 1 — CANVAS AI: определение типа объекта (локально в браузере)
    // ─────────────────────────────────────────────────────────────────────────

    async function analyzeWithCanvas(imageSource) {
        const img = await loadImage(imageSource);
        const canvas = document.createElement('canvas');
        const W = Math.min(img.naturalWidth || img.width, 320);
        const H = Math.min(img.naturalHeight || img.height, 240);
        canvas.width = W;
        canvas.height = H;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, W, H);
        const data = ctx.getImageData(0, 0, W, H).data;
        const totalPx = W * H;

        let redPx = 0, grayPx = 0, bluePx = 0, brownPx = 0, whitePx = 0;
        let avgBrightness = 0, avgSaturation = 0;

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const brightness = (r + g + b) / 3;
            const saturation = Math.max(r, g, b) - Math.min(r, g, b);

            avgBrightness += brightness;
            avgSaturation += saturation;

            if (r > 140 && g < 90 && b < 90 && r - g > 60) redPx++;
            if (saturation < 25 && brightness > 80 && brightness < 200) grayPx++;
            if (b > r + 30 && b > g + 10) bluePx++;
            if (r > 100 && g > 60 && b < 70 && r > g && r - b > 40) brownPx++;
            if (brightness > 210 && saturation < 20) whitePx++;
        }

        avgBrightness /= totalPx;
        avgSaturation /= totalPx;

        const scores = {
            wall_brick: redPx / totalPx,
            wall_concrete: grayPx / totalPx,
            tile_wall: bluePx / totalPx,
            slab: (grayPx / totalPx) * 0.8 + (avgBrightness > 150 ? 0.1 : 0),
            plaster: whitePx / totalPx,
            drywall: (whitePx / totalPx) * 0.7 + (avgSaturation < 15 ? 0.2 : 0),
            floor_screed: grayPx / totalPx * 0.6,
            roof_flat: (grayPx / totalPx) * 0.5,
            foundation_strip: (grayPx / totalPx) * 0.7 + (avgBrightness < 120 ? 0.15 : 0),
        };

        const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
        const canvasType = best[1] > 0.05 ? best[0] : 'generic';
        const objectType = CANVAS_TYPE_MAP[canvasType] || 'generic';
        const confidence = Math.min(Math.round(best[1] * 100 * 3.5 + 35), 82);

        const signals = [];
        if (scores.wall_brick > 0.08) signals.push(`🟥 Красноватый тон → кирпичная кладка (${(scores.wall_brick * 100).toFixed(0)}%)`);
        if (scores.wall_concrete > 0.2) signals.push(`⬜ Серая текстура → бетон/монолит (${(scores.wall_concrete * 100).toFixed(0)}%)`);
        if (scores.plaster > 0.3) signals.push(`🪣 Светлый тон → штукатурка (${(scores.plaster * 100).toFixed(0)}%)`);
        if (scores.tile_wall > 0.08) signals.push(`💙 Синеватые оттенки → плитка (${(scores.tile_wall * 100).toFixed(0)}%)`);
        if (avgBrightness > 190) signals.push('☀️ Высокая яркость → потолок или светлое покрытие');
        if (avgBrightness < 80) signals.push('🌑 Низкая яркость → подвал, фундамент');

        return {
            source: 'canvas_ai',
            objectType,
            confidence,
            scores,
            signals,
            label: TYPE_LABELS[objectType] || objectType,
        };
    }


    // ─────────────────────────────────────────────────────────────────────────
    // ШАГ 2 — AI-Сервис: RF-DETR + GroundingDINO + Дефекты + Калибровка
    // ─────────────────────────────────────────────────────────────────────────

    async function analyzeWithAIService(photoFile, options = {}) {
        // Prefer AIService bridge (handles Gemini fallback, caching, etc.)
        if (window.AIService) {
            try {
                const result = await window.AIService.analyze(photoFile, {
                    region: options.region,
                    confidence: options.confidence,
                    textPrompt: options.textPrompt,
                    generateEstimate: true,
                });
                if (result) {
                    return {
                        source: result.ai_backend || 'ai_service_v2',
                        objectType: result.objectType || 'generic',
                        confidence: result.confidence || 60,
                        detections: result.objects || result.detected_objects || [],
                        detectionSources: result.detection_sources || {},
                        defects: result.defects_detected || { defects: [], summary: { total: 0 } },
                        materials: result.materials_seen || [],
                        description: result.scene_description || '',
                        signals: [],
                        dimensions: result.dimensions || {},
                        measurements: result.dimensions || {},
                        scaleCalibrated: result.scale_calibrated || false,
                        scaleFactor: result.scale_factor || null,
                        scaleMethod: result.scale_method || 'unknown',
                        needsScale: !result.scale_calibrated,
                        estimateItems: result.estimate_items || [],
                        estimateTotal: result.estimate_total || null,
                        warnings: result.warnings || [],
                        _raw: result,
                    };
                }
            } catch (err) {
                console.warn('[PhotoEstimate] AIService bridge failed:', err.message);
            }
        }

        // Direct fallback to ai-service
        const formData = new FormData();
        formData.append('file', photoFile);

        const params = new URLSearchParams();
        if (options.region) params.append('region', options.region);
        if (options.confidence) params.append('confidence', options.confidence);
        params.append('generate_estimate', 'true');
        if (options.textPrompt) params.append('custom_text_prompt', options.textPrompt);

        const queryString = params.toString();
        const url = `${API_BASE}/api/v1/analyze${queryString ? '?' + queryString : ''}`;

        try {
            const res = await _fetchRetry(url, { method: 'POST', body: formData });
            const data = await res.json();

            return {
                source: 'ai_service_v2',
                objectType: data.qwen_result?.objectType || data.objectType || 'generic',
                confidence: data.qwen_result?.confidence || data.confidence || 60,
                detections: data.detected_objects || [],
                detectionSources: data.detection_sources || {},
                defects: data.defects || { defects: [], summary: { total: 0 } },
                materials: data.qwen_result?.materials_seen || [],
                description: data.qwen_result?.scene_description || '',
                signals: data.qwen_result?.signals || [],
                dimensions: data.qwen_result?.dimensions_estimate || {},
                measurements: data.measurements || {},
                scaleCalibrated: data.scale_calibrated || false,
                scaleFactor: data.scale_factor || null,
                scaleMethod: data.scale_method || 'unknown',
                needsScale: data.needs_scale !== false,
                estimateItems: data.estimate_items || [],
                estimateTotal: data.estimate_total || null,
                warnings: data.warnings || [],
                _raw: data,
            };
        } catch (err) {
            console.warn('[PhotoEstimate] AI-сервис недоступен:', err.message);
            return null;
        }
    }


    // ─────────────────────────────────────────────────────────────────────────
    // ШАГ 3 — Python SfM V2: RANSAC плоскости (5-10 фото)
    // ─────────────────────────────────────────────────────────────────────────

    async function analyzeWith3D(photos, onProgress) {
        const formData = new FormData();
        photos.forEach((f, i) => formData.append('photos', f, `photo_${i}.jpg`));

        onProgress && onProgress(5, 'Загрузка фото на сервер (3D)...');

        const uploadRes = await fetch(`${API_BASE}/api/photogrammetry/analyze`, {
            method: 'POST',
            body: formData,
        });
        if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
        const { jobId } = await uploadRes.json();

        onProgress && onProgress(15, 'Python SfM V2 (AKAZE + RANSAC planes)...');

        return await pollJobStatus(jobId, onProgress);
    }

    async function pollJobStatus(jobId, onProgress, timeout = 120000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            await sleep(2000);
            const res = await fetch(`${API_BASE}/api/photogrammetry/status/${jobId}`);
            const job = await res.json();

            onProgress && onProgress(job.progress || 50, job.step || '');

            if (job.status === 'done') {
                return {
                    source: 'sfm_3d_v2',
                    ...job.result,
                    hasAruco: job.result.has_aruco || false,
                    planesFound: job.result.planes_found || 0,
                    needsScale: job.result.needs_scale !== false,
                };
            }
            if (job.status === 'error') throw new Error(job.error || 'SfM failed');
        }
        throw new Error('SfM timeout');
    }


    // ─────────────────────────────────────────────────────────────────────────
    // ШАГ 4 — ОБЪЕДИНЕНИЕ + QTO Engine + SmartEstimateEngine + Сценарии
    // ─────────────────────────────────────────────────────────────────────────

    function buildEstimate({ canvasResult, aiResult, sfmResult, region, userAnswers, patches }) {
        // ── БЫСТРЫЙ ПУТЬ: если Gemini уже вернул готовую смету — используем её ──
        // Это исключает перезапись реальных данных шаблонными значениями SmartEstimateEngine
        if (aiResult && aiResult.estimateItems && aiResult.estimateItems.length > 0 &&
            aiResult.source && (aiResult.source === 'ai_service_v2' || aiResult.source.includes('gemini'))) {

            const estimateTotal = aiResult.estimateItems.reduce((s, it) => s + (it.total_price || it.total || 0), 0);
            const objectLabel = TYPE_LABELS[aiResult.objectType] || aiResult.objectType || 'Строительный объект';
            console.log(`[PhotoEstimateEngine] ⚡ Fast-path: Using Gemini estimate directly (${aiResult.estimateItems.length} items, ${estimateTotal.toLocaleString('ru-RU')} ₸)`);

            return {
                estimate: {
                    items: aiResult.estimateItems,
                    region: region || 'almaty',
                    generatedAt: new Date().toISOString(),
                    success: true,
                    sections: [],
                    estimates: [{ objectName: objectLabel }],
                    totals: { total: estimateTotal, materials: 0, works: estimateTotal },
                },
                smart: null,
                objectType: aiResult.objectType || 'generic',
                objectLabel: objectLabel,
                dimensions: aiResult.dimensions || {},
                dimSource: 'gemini_vision',
                qtoResults: [],
                qtoQuestions: [],
                qtoWarnings: [],
                scenarios: null,
                defects: aiResult.defects || { defects: [], summary: { total: 0 } },
                scaleCalibrated: aiResult.scaleCalibrated || false,
                scaleMethod: aiResult.scaleMethod || 'gemini_estimate',
                needsScale: false,
                typeConfidence: aiResult.confidence || 70,
                signals: [...(canvasResult?.signals || []), ...(aiResult?.signals || [])],
                warnings: aiResult.warnings || [],
                fullEstimate: null,
                mainWorks: aiResult.estimateItems,
                hiddenWorks: [],
                aiAddedWorks: [],
                materials: aiResult.materials || [],
                equipment: [],
                timeline: null,
                verification: null,
                questions: [],
                _fromGemini: true,
            };
        }

        // ── Тип объекта: AI-сервис > Canvas ────────────────────────
        let objectType = 'generic';
        let typeConfidence = 40;

        if (aiResult && aiResult.confidence > 55) {
            objectType = aiResult.objectType;
            typeConfidence = aiResult.confidence;
        } else if (canvasResult && canvasResult.confidence > 40) {
            objectType = canvasResult.objectType;
            typeConfidence = canvasResult.confidence;
        }

        // ── Размеры: SfM > AI dimensions > шаблонные ─────────────
        const dimensions = {};
        let dimSource = 'template';

        if (sfmResult && sfmResult.area_m2) {
            dimensions.area_m2 = sfmResult.area_m2;
            dimensions.perimeter_m = sfmResult.perimeter_m;
            dimensions.height_m = sfmResult.height_m;
            dimensions.volume_m3 = sfmResult.volume_m3;
            dimSource = `sfm_3d (${sfmResult.method || 'ransac_planes'})`;
        } else if (aiResult && aiResult.dimensions) {
            const ad = aiResult.dimensions;
            if (ad.area_m2) dimensions.area_m2 = ad.area_m2;
            if (ad.perimeter_m) dimensions.perimeter_m = ad.perimeter_m;
            if (ad.height_m) dimensions.height_m = ad.height_m;
            if (ad.depth_m) dimensions.height_m = dimensions.height_m || ad.depth_m;
            if (ad.width_m) dimensions.width_m = ad.width_m;
            dimSource = 'ai_vision';
        }

        // Применяем ответы пользователя (если есть)
        if (userAnswers) {
            Object.assign(dimensions, userAnswers);
            if (Object.keys(userAnswers).length) dimSource += ' + user_input';
        }

        // Агрегация патчей (если загружено несколько зон)
        if (patches && patches.length > 1 && window.QTOEngine) {
            const aggregated = window.QTOEngine.aggregatePatches(patches, 'weighted_avg');
            Object.assign(dimensions, aggregated);
            dimSource += ` + ${patches.length} patches`;
        }

        // ── QTO Engine: строгий расчёт объёмов ────────────────────
        let qtoResults = [];
        let qtoQuestions = [];
        let qtoWarnings = [];

        if (window.QTOEngine) {
            // Расчёт по формулам
            qtoResults = window.QTOEngine.calculateForObject(objectType, dimensions);

            // Добавляем скрытые работы
            qtoResults = window.QTOEngine.addHiddenWorks(objectType, dimensions, qtoResults);

            // Генерируем вопросы при неполных данных
            qtoQuestions = window.QTOEngine.generateQuestions(objectType, dimensions);

            // Собираем предупреждения
            qtoWarnings = qtoResults
                .filter(r => r.warnings && r.warnings.length)
                .flatMap(r => r.warnings);
        }

        // ── SmartEstimateEngine: подбор работ из каталога ──────────
        let estimate = null;
        let smart = null;
        let fullEstimate = null;

        if (window.SmartEstimateEngine) {
            // Используем buildFull() (ИИ-сметчик) если доступен
            if (window.SmartEstimateEngine.buildFull) {
                fullEstimate = window.SmartEstimateEngine.buildFull({
                    objectType,
                    objectParams: dimensions,
                    region: region || 'almaty',
                    qwenResult: { confidence: typeConfidence, dimensions_estimate: dimensions },
                });
                smart = fullEstimate._baseEstimate;
                estimate = window.SmartEstimateEngine.toLegacyFormat(smart);
                estimate._smart = smart;

                console.log(`[ИИ-сметчик] Верификация: ${fullEstimate.verification.passed ? '✅' : '❌'} | Автодобавлено: ${fullEstimate.aiAddedWorks.length} | Срок: ${fullEstimate.timeline ? fullEstimate.timeline.totalDays + ' дней' : 'N/A'}`);
            } else {
                smart = window.SmartEstimateEngine.build({
                    objectType,
                    objectParams: dimensions,
                    region: region || 'almaty',
                    qwenResult: { confidence: typeConfidence },
                });
                estimate = window.SmartEstimateEngine.toLegacyFormat(smart);
                estimate._smart = smart;
            }
        }

        // ── Сценарии: эконом / стандарт / премиум ─────────────────
        let scenarios = fullEstimate ? fullEstimate.scenarios : null;
        if (!scenarios && window.QTOEngine && qtoResults.length > 0) {
            const basePrices = {};
            if (smart && smart.items) {
                for (const item of smart.items) {
                    basePrices[item.name || item.work_name] = item.unit_price || item.unitPrice || 5000;
                }
            }
            scenarios = window.QTOEngine.generateScenarios(qtoResults, basePrices);
        }

        // ── Дефекты ───────────────────────────────────────────────
        const defects = aiResult?.defects || { defects: [], summary: { total: 0 } };

        // ── Собираем результат ────────────────────────────────────
        const result = {
            estimate,
            smart,
            objectType,
            objectLabel: TYPE_LABELS[objectType] || objectType,
            dimensions,
            dimSource,
            // QTO
            qtoResults,
            qtoQuestions,
            qtoWarnings,
            // Сценарии
            scenarios,
            // Дефекты
            defects,
            // Масштаб
            scaleCalibrated: aiResult?.scaleCalibrated || sfmResult?.hasAruco || false,
            scaleMethod: aiResult?.scaleMethod || (sfmResult?.hasAruco ? 'aruco' : 'heuristic'),
            needsScale: (aiResult?.needsScale !== false) && (sfmResult?.needsScale !== false),
            // Мета
            typeConfidence,
            signals: [
                ...(canvasResult?.signals || []),
                ...(aiResult?.signals || []),
            ],
            warnings: [
                ...(aiResult?.warnings || []),
                ...qtoWarnings,
            ],

            // ── Новые поля ИИ-сметчика ──
            fullEstimate: fullEstimate || null,
            mainWorks: fullEstimate ? fullEstimate.mainWorks : (smart ? smart.sections.works : []),
            hiddenWorks: fullEstimate ? fullEstimate.hiddenWorks : [],
            aiAddedWorks: fullEstimate ? fullEstimate.aiAddedWorks : [],
            materials: fullEstimate ? fullEstimate.materials : (smart ? smart.sections.materials : []),
            equipment: fullEstimate ? fullEstimate.equipment : (smart ? smart.sections.equipment : []),
            timeline: fullEstimate ? fullEstimate.timeline : null,
            verification: fullEstimate ? fullEstimate.verification : null,
            questions: fullEstimate ? fullEstimate.questions : [],
        };

        return result;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // ПУБЛИЧНЫЕ МЕТОДЫ — 3 РЕЖИМА
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * РЕЖИМ 1: Быстрый анализ (1 фото)
     * Canvas AI + AI-сервис → QTO → SmartEstimate → Сценарии
     */
    async function estimateByPhoto(photo, opts = {}) {
        const { region = 'Алматы', onProgress = () => { } } = opts;

        onProgress(5, 'Canvas AI анализ фото...');
        const canvasResult = await analyzeWithCanvas(photo);
        onProgress(20, `Тип: ${canvasResult.label} (${canvasResult.confidence}%)`);

        onProgress(30, 'AI-сервис: RF-DETR + GroundingDINO + дефекты...');
        const aiResult = await analyzeWithAIService(photo, { region });
        onProgress(60, aiResult
            ? `AI: ${aiResult.objectType} (${aiResult.confidence}%)`
            : 'AI-сервис недоступен');

        onProgress(75, 'QTO расчёт + подбор работ из каталога...');
        const result = buildEstimate({
            canvasResult, aiResult, sfmResult: null, region,
        });
        onProgress(100, '✅ Смета готова!');

        return { ...result, canvasResult, aiResult };
    }

    /**
     * РЕЖИМ 2: Полный 3D анализ (5-10 фото с маркером)
     * SfM (RANSAC planes) + AI-сервис → QTO → SmartEstimate → Сценарии
     */
    async function estimateBy5Photos(photos, opts = {}) {
        const { region = 'Алматы', onProgress = () => { } } = opts;

        onProgress(3, 'Canvas AI анализ...');
        const canvasResult = await analyzeWithCanvas(photos[0]);
        onProgress(8, `Тип: ${canvasResult.label}`);

        // AI-сервис для первого фото
        onProgress(10, 'AI-сервис: детекция + дефекты...');
        const aiResult = await analyzeWithAIService(photos[0], { region });
        onProgress(18, aiResult ? 'AI анализ завершён' : 'AI-сервис недоступен');

        // SfM 3D реконструкция
        onProgress(20, 'Запуск 3D реконструкции (AKAZE SfM + RANSAC planes)...');
        let sfmResult = null;
        try {
            sfmResult = await analyzeWith3D(photos, (pct, step) => {
                onProgress(20 + Math.round(pct * 0.60), step);
            });
        } catch (err) {
            console.warn('[PhotoEstimate] SfM failed:', err.message);
            onProgress(82, '⚠️ SfM недоступен — используем AI-размеры');
        }

        onProgress(85, 'QTO расчёт + сценарии...');
        const result = buildEstimate({
            canvasResult, aiResult, sfmResult, region,
        });
        onProgress(100, '✅ Полная смета с реальными размерами!');

        return { ...result, canvasResult, aiResult, sfmResult };
    }

    /**
     * РЕЖИМ 3: Локальный участок (контуры на фото)
     * Пользователь рисует полигон на фото, указываем масштаб → QTO
     */
    async function estimateByContour(photo, contourPoints, opts = {}) {
        const { region = 'Алматы', onProgress = () => { }, scaleHint } = opts;

        onProgress(5, 'Canvas AI анализ...');
        const canvasResult = await analyzeWithCanvas(photo);
        onProgress(15, `Тип: ${canvasResult.label}`);

        // Рассчитываем площадь контура в пикселях
        const areaPixels = calculatePolygonArea(contourPoints);
        const perimeterPixels = calculatePolygonPerimeter(contourPoints);

        // Масштаб: от пользователя или эвристика
        let scaleFactor = 0.005; // Дефолт: ~5мм/пиксель
        if (scaleHint && scaleHint.size_m && scaleHint.size_px) {
            scaleFactor = scaleHint.size_m / scaleHint.size_px;
        }

        const area_m2 = areaPixels * scaleFactor * scaleFactor;
        const perimeter_m = perimeterPixels * scaleFactor;

        onProgress(40, `Контур: ${area_m2.toFixed(1)} м², ${perimeter_m.toFixed(1)} п.м`);

        // AI для определения типа (необязательно)
        let aiResult = null;
        try {
            aiResult = await analyzeWithAIService(photo, { region });
        } catch (e) {
            // AI не обязателен для контурного режима
        }

        onProgress(70, 'QTO расчёт по контуру...');

        const dimensions = {
            area_m2: Math.round(area_m2 * 10) / 10,
            perimeter_m: Math.round(perimeter_m * 10) / 10,
        };

        const result = buildEstimate({
            canvasResult, aiResult, sfmResult: null, region,
            patches: [dimensions],
        });

        onProgress(100, '✅ Смета по контуру!');

        return {
            ...result,
            canvasResult,
            aiResult,
            contour: {
                points: contourPoints,
                areaPixels,
                perimeterPixels,
                scaleFactor,
                area_m2,
                perimeter_m,
            },
        };
    }


    // ─────────────────────────────────────────────────────────────────────────
    // ПЛАН РАБОТ: Scene → Plan → SmartEstimate → Сценарии
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * buildPlan — формирование полного плана работ из результатов AI.
     *
     * Пайплайн:
     *   1. Собрать scene из canvasResult / aiResult / sfmResult / contourData
     *   2. ConstructionPlanner.plan() → plan + hidden works + defect repairs
     *   3. SmartEstimateEngine.build() → базовая смета
     *   4. SmartEstimateEngine.buildScenarios() → 3 варианта цен
     *   5. Объединить + generateQuestions() → финальный результат
     *
     * @param {object} opts
     *   - canvasResult:  результат analyzeWithCanvas
     *   - aiResult:      результат analyzeWithAIService
     *   - sfmResult:     результат analyzeWith3D
     *   - contourData:   { areaM2, perimeterM, points }
     *   - region:        город/регион
     *   - userAnswers:   ответы пользователя на вопросы
     *   - defects:       обнаруженные дефекты
     *   - objectType:    тип объекта (override)
     * @returns {object} — полный план с работами, сценариями, вопросами, объяснением
     */
    function buildPlan(opts = {}) {
        const {
            canvasResult, aiResult, sfmResult, contourData,
            region = 'almaty', userAnswers = {}, defects = [],
            objectType: overrideType,
        } = opts;

        console.log('[PhotoEstimateEngine] 📋 buildPlan → start');

        // ── 1. Собрать scene ─────────────────────────────────────

        // Determine object type from available data
        let objectType = overrideType || 'generic';
        if (canvasResult && canvasResult.objectType) {
            objectType = canvasResult.objectType;
        }
        if (aiResult && aiResult.detected_objects) {
            const topDet = aiResult.detected_objects[0];
            if (topDet && topDet.class_name) {
                objectType = CANVAS_TYPE_MAP[topDet.class_name] || topDet.class_name || objectType;
            }
        }

        // Collect measurements from all sources
        const measurements = {};

        // From Canvas analysis
        if (canvasResult && canvasResult.measurements) {
            Object.assign(measurements, canvasResult.measurements);
        }

        // From AI service
        if (aiResult && aiResult.measurements) {
            for (const [key, val] of Object.entries(aiResult.measurements)) {
                if (!measurements[key] || val > 0) measurements[key] = val;
            }
        }

        // From SfM 3D reconstruction
        if (sfmResult) {
            if (sfmResult.planes && sfmResult.planes.length > 0) {
                const plane = sfmResult.planes[0];
                if (plane.area_m2) measurements.area_m2 = plane.area_m2;
                if (plane.height_m) measurements.height_m = plane.height_m;
                if (plane.volume_m3) measurements.volume_m3 = plane.volume_m3;
            }
            if (sfmResult.scale_factor) {
                measurements.scale_factor = sfmResult.scale_factor;
            }
        }

        // From contour drawing
        if (contourData) {
            if (contourData.areaM2) measurements.area_m2 = contourData.areaM2;
            if (contourData.perimeterM) measurements.perimeter_m = contourData.perimeterM;
        }

        // From user answers
        if (userAnswers.area_m2) measurements.area_m2 = userAnswers.area_m2;
        if (userAnswers.height_m) measurements.height_m = userAnswers.height_m;
        if (userAnswers.depth_m) measurements.depth_m = userAnswers.depth_m;

        // Collect detections
        const detections = [];
        if (aiResult && aiResult.detected_objects) {
            aiResult.detected_objects.forEach(d => detections.push(d));
        }
        if (canvasResult && canvasResult.detections) {
            canvasResult.detections.forEach(d => detections.push(d));
        }

        const scene = {
            objectType,
            detections,
            measurements,
            scale_factor: measurements.scale_factor || null,
        };

        // ── 2. ConstructionPlanner → plan ────────────────────────

        let planResult = null;
        const planner = window.ConstructionPlanner;
        if (planner) {
            planResult = planner.plan(scene, { region, userAnswers, defects });
            console.log(`[PhotoEstimateEngine] 📋 Planner: ${planResult.plan.length} items`);
        }

        // ── 3. SmartEstimateEngine → базовая смета ──────────────

        let smartEstimate = null;
        let scenarios = null;
        let questions = [];
        const se = window.SmartEstimateEngine;

        if (se) {
            // Build base estimate
            smartEstimate = se.build({
                objectType,
                qwenResult: aiResult,
                objectParams: measurements,
                region,
                manualItems: opts.manualItems || [],
            });

            // Build 3 scenarios
            scenarios = se.buildScenarios(smartEstimate);

            // Generate questions
            questions = se.generateQuestions(objectType, smartEstimate.dimensions, userAnswers);

            console.log(`[PhotoEstimateEngine] 💰 SmartEstimate: ${smartEstimate.totals.grand.toLocaleString('ru-RU')} ₸`);
            console.log(`[PhotoEstimateEngine] 📊 Scenarios: economy=${scenarios.economy.total.toLocaleString('ru-RU')}, standard=${scenarios.standard.total.toLocaleString('ru-RU')}, premium=${scenarios.premium.total.toLocaleString('ru-RU')}`);
        }

        // ── 4. Собрать финальный результат ────────────────────

        const explanation = planResult && planner ? planner.explain(planResult) : '';

        const result = {
            // Scene info
            objectType,
            objectLabel: TYPE_LABELS[objectType] || objectType,
            region,
            measurements,
            detections,

            // Plan from ConstructionPlanner
            plan: planResult,
            workSequence: planResult ? planResult.workSequence : [],
            snipRefs: planResult ? planResult.snipRefs : [],
            warnings: planResult ? planResult.warnings : [],

            // Estimate from SmartEstimateEngine
            estimate: smartEstimate,
            scenarios,

            // Questions for user
            questions,

            // Explanation text
            explanation,

            // Meta
            confidence: planResult ? planResult.confidence : 0.5,
            generatedAt: new Date().toISOString(),
        };

        console.log('[PhotoEstimateEngine] ✅ buildPlan complete');
        return result;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // УТИЛИТЫ
    // ─────────────────────────────────────────────────────────────────────────

    function loadImage(source) {
        return new Promise((resolve, reject) => {
            if (source instanceof HTMLImageElement) { resolve(source); return; }
            const img = new Image();
            const url = source instanceof File ? URL.createObjectURL(source) : source;
            img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
            img.onerror = () => reject(new Error('Не удалось загрузить изображение'));
            img.src = url;
        });
    }

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    /** Площадь полигона (Shoelace formula). Supports both [x,y] arrays and {x,y} objects. */
    function calculatePolygonArea(points) {
        if (!points || points.length < 3) return 0;
        let area = 0;
        const n = points.length;
        const _x = (p) => p.x !== undefined ? p.x : p[0];
        const _y = (p) => p.y !== undefined ? p.y : p[1];
        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            area += _x(points[i]) * _y(points[j]);
            area -= _x(points[j]) * _y(points[i]);
        }
        return Math.abs(area / 2);
    }

    /** Периметр полигона. Supports both [x,y] arrays and {x,y} objects. */
    function calculatePolygonPerimeter(points) {
        if (!points || points.length < 2) return 0;
        let perimeter = 0;
        const _x = (p) => p.x !== undefined ? p.x : p[0];
        const _y = (p) => p.y !== undefined ? p.y : p[1];
        for (let i = 0; i < points.length; i++) {
            const j = (i + 1) % points.length;
            const dx = _x(points[j]) - _x(points[i]);
            const dy = _y(points[j]) - _y(points[i]);
            perimeter += Math.sqrt(dx * dx + dy * dy);
        }
        return perimeter;
    }


    // ─────────────────────────────────────────────────────────────────────────
    // ПУБЛИЧНЫЙ API v3
    // ─────────────────────────────────────────────────────────────────────────

    window.PhotoEstimateEngine = {
        /** MODE 1: 1 фото → смета */
        estimateByPhoto,

        /** MODE 2: 5-10 фото → 3D + точная смета */
        estimateBy5Photos,

        /** MODE 3: контур на фото → локальная смета */
        estimateByContour,

        /** PLAN: Scene → Plan → SmartEstimate → Сценарии */
        buildPlan,

        /** Только Canvas анализ */
        analyzeWithCanvas,

        /** AI-сервис V2 */
        analyzeWithAIService,

        /** SfM V2 */
        analyzeWith3D,

        /** Утилиты */
        calculatePolygonArea,
        calculatePolygonPerimeter,

        /** Справочники */
        CANVAS_TYPE_MAP,
        TYPE_LABELS,
    };

    console.log('✅ [PhotoEstimateEngine] v3 — QTO + Сценарии + 3 режима + GroundingDINO + дефекты + buildPlan');

})();
