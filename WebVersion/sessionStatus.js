// ============================================================
// sessionStatus.js — Unified Session Status Model
// QAZGOST AI v3.0
//
// Provides:
//   window.SessionStatus.evaluate(ctx) → ResultContract JSON
//   window.SessionStatus.STATUS — status constants
//   window.SessionStatus.THRESHOLDS — quality thresholds
// ============================================================

(function () {
    'use strict';

    // ─────────────────────────────────────────────────────────
    // CONSTANTS
    // ─────────────────────────────────────────────────────────

    const STATUS = Object.freeze({
        DONE_EXACT: 'DONE_EXACT',
        DONE_ESTIMATE: 'DONE_ESTIMATE',
        NEED_MORE_PHOTOS: 'NEED_MORE_PHOTOS',
        NEED_SCALE: 'NEED_SCALE',
        NEED_ANSWERS: 'NEED_ANSWERS',
        ERROR: 'ERROR',
    });

    const THRESHOLDS = Object.freeze({
        photoQuality: { good: 0.65, ok: 0.55 },
        scaleConfidence: { marker: 0.7 },
        dimConfidence: { exact: 0.65 },
        minPhotos: { quick: 1, full3d: 5 },
    });

    const PIPELINE_STEPS = [
        'photoQA', 'detection', 'segmentation', 'scale',
        'geometry_3d', 'qto', 'plan', 'estimate',
    ];

    // ─────────────────────────────────────────────────────────
    // MAIN EVALUATE FUNCTION
    // ─────────────────────────────────────────────────────────

    /**
     * Evaluate session context → ResultContract JSON
     *
     * @param {object} ctx
     *   ctx.photos         - [{dataUrl, file, detections?}]
     *   ctx.aiDetections    - DetectedObject[] from RF-DETR
     *   ctx.canvasResult    - {objectType, label, confidence, signals} from analyzeWithCanvas
     *   ctx.buildPlanResult - from PhotoEstimateEngine.buildPlan()
     *   ctx.detailedEstimate - from AINormBridge
     *   ctx.analysisSource  - 'ai' | 'canvas_ai' | 'description'
     *   ctx.scaleAvailable  - bool (true if ArUco/A4/manual_scale found)
     *   ctx.scaleMethod     - 'aruco' | 'a4' | 'manual' | 'exif' | 'sfm_3d' | null
     *   ctx.description     - user text description
     *   ctx.qtoAnswers      - {key: value} from QTO questions
     *   ctx.missingParams   - string[] from QTO validation
     *   ctx.pipelineLog     - [{step, icon, status, detail}]
     *   ctx.error           - Error object if pipeline failed
     *   ctx.mode            - 'quick' | '3d' | 'contour'
     *
     * @returns {object} ResultContract
     */
    function evaluate(ctx) {
        if (!ctx) ctx = {};

        const accuracy = buildAccuracy(ctx);
        const pipelineSteps = buildPipelineSteps(ctx);

        // ── Determine sessionStatus ──
        let sessionStatus;

        // 1. Real error
        if (ctx.error) {
            sessionStatus = STATUS.ERROR;
        }
        // 2. Not enough data at all
        else if (!ctx.photos?.length && !ctx.description?.trim()) {
            sessionStatus = STATUS.NEED_MORE_PHOTOS;
        }
        // 3. Photos exist but quality too low or not enough for mode
        else if (ctx.photos?.length > 0 && _needMorePhotos(ctx)) {
            sessionStatus = STATUS.NEED_MORE_PHOTOS;
        }
        // 4. Missing mandatory QTO answers
        else if (ctx.missingParams?.length > 0) {
            sessionStatus = STATUS.NEED_ANSWERS;
        }
        // 5. No scale → can't do exact
        else if (!accuracy.scaleAvailable && ctx.photos?.length > 0 && ctx.analysisSource !== 'description') {
            sessionStatus = STATUS.NEED_SCALE;
        }
        // 6. Exact calculation possible
        else if (accuracy.scaleAvailable && accuracy.dimConfidence >= THRESHOLDS.dimConfidence.exact && accuracy.overallConfidence >= 0.6) {
            sessionStatus = STATUS.DONE_EXACT;
        }
        // 7. Default: estimate
        else {
            sessionStatus = STATUS.DONE_ESTIMATE;
        }

        const nextActions = buildNextActions(sessionStatus, ctx, accuracy);
        const questions = buildQuestions(ctx);

        return {
            sessionStatus,
            accuracy,
            nextActions,
            questions,
            pipelineSteps,
            result: {
                scene: ctx.canvasResult || null,
                dimensions: _extractDimensions(ctx),
                qto: ctx.buildPlanResult?.estimate || null,
                plan: ctx.buildPlanResult?.plan || null,
                estimate: ctx.detailedEstimate || ctx.buildPlanResult?.estimate || null,
            },
        };
    }

    // ─────────────────────────────────────────────────────────
    // ACCURACY CALCULATION
    // ─────────────────────────────────────────────────────────

    function buildAccuracy(ctx) {
        // Type confidence: how well do we know WHAT the object is
        let typeConfidence = 0;
        if (ctx.analysisSource === 'ai' && ctx.aiDetections?.length > 0) {
            const maxConf = Math.max(...ctx.aiDetections.map(d => d.confidence || 0));
            typeConfidence = Math.min(maxConf / 100, 1);
        } else if (ctx.analysisSource === 'canvas_ai' && ctx.canvasResult) {
            typeConfidence = Math.min((ctx.canvasResult.confidence || 0) / 100, 1);
        } else if (ctx.description?.trim()) {
            // Description-based: low confidence
            const descLen = ctx.description.trim().length;
            typeConfidence = Math.min(0.15 + descLen / 500, 0.45);
        }

        // Dimension confidence: how accurate are the measured sizes
        let dimConfidence = 0;
        let dimSource = 'none';
        const scaleAvailable = _isScaleAvailable(ctx);

        if (scaleAvailable) {
            if (ctx.scaleMethod === 'sfm_3d') { dimConfidence = 0.85; dimSource = 'sfm_3d'; }
            else if (ctx.scaleMethod === 'aruco') { dimConfidence = 0.9; dimSource = 'aruco'; }
            else if (ctx.scaleMethod === 'a4') { dimConfidence = 0.75; dimSource = 'a4'; }
            else if (ctx.scaleMethod === 'manual') { dimConfidence = 0.7; dimSource = 'manual'; }
            else if (ctx.scaleMethod === 'exif') { dimConfidence = 0.5; dimSource = 'exif'; }
            else { dimConfidence = 0.6; dimSource = 'manual'; }
        } else {
            // Check if user gave dimensions in text
            const dimRegex = /(\d+)\s*[×xх]\s*(\d+)/i;
            const areaRegex = /(\d+)\s*м[²2]/i;
            if (ctx.description && dimRegex.test(ctx.description)) {
                dimConfidence = 0.55;
                dimSource = 'template';
            } else if (ctx.description && areaRegex.test(ctx.description)) {
                dimConfidence = 0.45;
                dimSource = 'template';
            } else {
                dimConfidence = 0.2;
                dimSource = 'none';
            }
        }

        // Cap dimConfidence if no scale
        if (!scaleAvailable) {
            dimConfidence = Math.min(dimConfidence, 0.35);
        }

        // Overall confidence: weighted
        const overallConfidence = Math.min(0.4 * typeConfidence + 0.6 * dimConfidence, 1);

        // What's missing
        const missing = [];
        if (!scaleAvailable) missing.push('scale');
        if (!ctx.photos?.length) missing.push('photos');
        if (ctx.missingParams) missing.push(...ctx.missingParams.map(p => `answers.${p}`));
        if (ctx.photos?.length > 0 && ctx.photos.length < 3 && ctx.mode === '3d') missing.push('more_photos');

        return {
            level: scaleAvailable && dimConfidence >= THRESHOLDS.dimConfidence.exact ? 'exact' : 'estimated',
            typeConfidence: Math.round(typeConfidence * 100) / 100,
            dimConfidence: Math.round(dimConfidence * 100) / 100,
            overallConfidence: Math.round(overallConfidence * 100) / 100,
            dimSource,
            scaleAvailable,
            missing,
        };
    }

    // ─────────────────────────────────────────────────────────
    // PIPELINE STEPS
    // ─────────────────────────────────────────────────────────

    function buildPipelineSteps(ctx) {
        const steps = {};

        // photoQA
        if (ctx.photos?.length > 0) {
            steps.photoQA = 'done';
        } else {
            steps.photoQA = 'skipped';
        }

        // detection
        if (ctx.analysisSource === 'ai') {
            steps.detection = ctx.aiDetections?.length > 0 ? 'done' : 'error';
        } else if (ctx.analysisSource === 'canvas_ai') {
            steps.detection = ctx.canvasResult ? 'done' : 'skipped';
        } else {
            steps.detection = 'skipped';
        }

        // segmentation (SAM)
        if (ctx.analysisSource === 'ai' && ctx.aiDetections?.some(d => d.mask_contour || d.mask_pixels)) {
            steps.segmentation = 'done';
        } else if (ctx.analysisSource === 'ai') {
            steps.segmentation = 'skipped';
        } else {
            steps.segmentation = 'offline';
        }

        // scale
        if (_isScaleAvailable(ctx)) {
            steps.scale = 'done';
        } else if (ctx.photos?.length > 0) {
            steps.scale = 'need_input';
        } else {
            steps.scale = 'skipped';
        }

        // geometry_3d
        if (ctx.mode === '3d') {
            steps.geometry_3d = ctx.buildPlanResult?.sfmResult ? 'done' : 'error';
        } else {
            steps.geometry_3d = 'skipped';
        }

        // qto
        steps.qto = ctx.buildPlanResult?.estimate ? 'done' : 'skipped';

        // plan
        steps.plan = ctx.buildPlanResult?.plan ? 'done' : 'skipped';

        // estimate
        if (ctx.detailedEstimate || ctx.buildPlanResult?.estimate) {
            steps.estimate = 'done';
        } else {
            steps.estimate = 'skipped';
        }

        return steps;
    }

    // ─────────────────────────────────────────────────────────
    // NEXT ACTIONS
    // ─────────────────────────────────────────────────────────

    function buildNextActions(status, ctx, accuracy) {
        const actions = [];

        switch (status) {
            case STATUS.NEED_MORE_PHOTOS:
                actions.push({
                    action: 'upload_photos',
                    min: ctx.mode === '3d' ? 5 : 1,
                    icon: '📸',
                    hint: ctx.mode === '3d'
                        ? 'Загрузите 5-10 фото объекта с разных ракурсов'
                        : 'Сфотографируйте объект целиком',
                    tips: ['Общий план', 'С другого угла', 'Крупный план дефекта'],
                });
                break;

            case STATUS.NEED_SCALE:
                actions.push({
                    action: 'add_scale_marker',
                    icon: '📏',
                    hint: 'Положите лист A4 на стену и сфотографируйте',
                });
                actions.push({
                    action: 'manual_scale',
                    icon: '📐',
                    hint: 'Введите 1 известный размер (высота двери, ширина окна)',
                });
                actions.push({
                    action: 'continue_as_estimate',
                    icon: '📊',
                    hint: 'Продолжить как оценочный расчёт (без масштаба)',
                });
                break;

            case STATUS.NEED_ANSWERS:
                actions.push({
                    action: 'answer_questions',
                    icon: '❓',
                    hint: `Ответьте на ${ctx.missingParams?.length || 1} вопрос(а) для точного расчёта`,
                    questions: ctx.missingParams || [],
                });
                break;

            case STATUS.DONE_ESTIMATE:
                if (!accuracy.scaleAvailable) {
                    actions.push({
                        action: 'add_scale_marker',
                        icon: '📏',
                        hint: 'Добавьте A4/рулетку для точного расчёта',
                    });
                }
                if (!ctx.photos?.length) {
                    actions.push({
                        action: 'upload_photos',
                        min: 1,
                        icon: '📸',
                        hint: 'Загрузите фото для повышения точности',
                    });
                }
                if (accuracy.missing.some(m => m.startsWith('answers.'))) {
                    actions.push({
                        action: 'answer_questions',
                        icon: '❓',
                        hint: 'Уточните параметры для повышения точности',
                    });
                }
                break;

            case STATUS.ERROR:
                actions.push({
                    action: 'retry',
                    icon: '🔄',
                    hint: 'Повторить анализ',
                });
                actions.push({
                    action: 'fallback_canvas',
                    icon: '🔬',
                    hint: 'Использовать локальный анализ (Canvas AI)',
                });
                break;

            case STATUS.DONE_EXACT:
                // Optionally suggest PDF
                actions.push({
                    action: 'download_pdf',
                    icon: '📄',
                    hint: 'Скачать смету в PDF',
                });
                break;
        }

        return actions;
    }

    // ─────────────────────────────────────────────────────────
    // QUESTIONS (from missing params)
    // ─────────────────────────────────────────────────────────

    function buildQuestions(ctx) {
        const questions = [];

        if (ctx.missingParams) {
            const QTO_QUESTIONS = {
                'thickness_mm': {
                    id: 'thickness_mm',
                    text: 'Толщина покрытия (мм)?',
                    type: 'select',
                    options: [10, 15, 20, 30, 50],
                },
                'plaster_thickness_mm': {
                    id: 'plaster_thickness_mm',
                    text: 'Толщина штукатурки (мм)?',
                    type: 'select',
                    options: [10, 15, 20, 30],
                },
                'ceiling_height': {
                    id: 'ceiling_height',
                    text: 'Высота потолков (м)?',
                    type: 'select',
                    options: [2.5, 2.7, 3.0, 3.5],
                },
                'screed_thickness_mm': {
                    id: 'screed_thickness_mm',
                    text: 'Толщина стяжки (мм)?',
                    type: 'select',
                    options: [30, 50, 70, 100],
                },
            };

            for (const param of ctx.missingParams) {
                if (QTO_QUESTIONS[param]) {
                    questions.push(QTO_QUESTIONS[param]);
                }
            }
        }

        // Also include questions from buildPlan
        if (ctx.buildPlanResult?.questions) {
            questions.push(...ctx.buildPlanResult.questions);
        }

        return questions;
    }

    // ─────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────

    function _isScaleAvailable(ctx) {
        if (ctx.scaleAvailable === true) return true;
        if (ctx.scaleMethod && ctx.scaleMethod !== 'none') return true;
        // Check if user entered dimensions in description
        if (ctx.description) {
            const dimRegex = /(\d+)\s*[×xх]\s*(\d+)/i;
            if (dimRegex.test(ctx.description)) return false; // dimensions in text, but not calibrated
        }
        return false;
    }

    function _needMorePhotos(ctx) {
        if (!ctx.photos || ctx.photos.length === 0) return true;
        if (ctx.mode === '3d' && ctx.photos.length < THRESHOLDS.minPhotos.full3d) return true;
        return false;
    }

    function _extractDimensions(ctx) {
        const dims = {};
        if (ctx.description) {
            const dimMatch = ctx.description.match(/(\d+(?:\.\d+)?)\s*[×xх]\s*(\d+(?:\.\d+)?)/i);
            if (dimMatch) {
                dims.width = parseFloat(dimMatch[1]);
                dims.height = parseFloat(dimMatch[2]);
                dims.area = dims.width * dims.height;
                dims.source = 'user_text';
            }
            const areaMatch = ctx.description.match(/(\d+(?:\.\d+)?)\s*м[²2]/i);
            if (areaMatch && !dims.area) {
                dims.area = parseFloat(areaMatch[1]);
                dims.source = 'user_text';
            }
        }
        return dims;
    }

    // ─────────────────────────────────────────────────────────
    // UI LABEL HELPERS
    // ─────────────────────────────────────────────────────────

    const STATUS_UI = Object.freeze({
        [STATUS.DONE_EXACT]: {
            icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,0.12)',
            title: 'Точный расчёт',
            subtitle: 'Масштаб подтверждён',
        },
        [STATUS.DONE_ESTIMATE]: {
            icon: '⚠️', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
            title: 'Оценочный расчёт',
            subtitle: 'Для точности уточните данные',
        },
        [STATUS.NEED_MORE_PHOTOS]: {
            icon: '📸', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
            title: 'Нужно больше фото',
            subtitle: 'Загрузите фото объекта',
        },
        [STATUS.NEED_SCALE]: {
            icon: '📏', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
            title: 'Нужен масштаб',
            subtitle: 'Укажите масштаб для точного расчёта',
        },
        [STATUS.NEED_ANSWERS]: {
            icon: '❓', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
            title: 'Нужны уточнения',
            subtitle: 'Ответьте на вопросы',
        },
        [STATUS.ERROR]: {
            icon: '❌', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',
            title: 'Ошибка анализа',
            subtitle: 'Попробуйте ещё раз',
        },
    });

    const PIPELINE_STEP_UI = Object.freeze({
        photoQA: { icon: '📷', label: 'Качество фото' },
        detection: { icon: '🔍', label: 'Детекция объектов' },
        segmentation: { icon: '🎨', label: 'Сегментация (SAM)' },
        scale: { icon: '📏', label: 'Масштаб' },
        geometry_3d: { icon: '📐', label: '3D реконструкция' },
        qto: { icon: '📊', label: 'QTO расчёт' },
        plan: { icon: '📋', label: 'План работ' },
        estimate: { icon: '💰', label: 'Смета' },
    });

    const STEP_STATUS_UI = Object.freeze({
        done: { icon: '✅', label: 'Готово', color: '#10b981' },
        skipped: { icon: '⏭️', label: 'Пропущен', color: '#6b7280' },
        offline: { icon: '📡', label: 'Офлайн', color: '#f59e0b' },
        error: { icon: '❌', label: 'Ошибка', color: '#ef4444' },
        need_input: { icon: '✏️', label: 'Нужен ввод', color: '#8b5cf6' },
    });

    // ─────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────

    window.SessionStatus = {
        evaluate,
        STATUS,
        THRESHOLDS,
        PIPELINE_STEPS,
        STATUS_UI,
        PIPELINE_STEP_UI,
        STEP_STATUS_UI,
    };

    console.log('✅ [SessionStatus] loaded — DONE_EXACT, DONE_ESTIMATE, NEED_SCALE, NEED_MORE_PHOTOS, NEED_ANSWERS, ERROR');
})();
