// ================================================================
// schemas.js — JSON-контракты Multi-Pass Estimate Engine
// QazGost AI v4.0 · Фаза 0: контрактная база
//
// Определяет структуры данных для каждого pass, сессий и отчётов.
// Совместим с pePdfService.js (data contract).
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // PASS TYPES — список всех возможных проходов
    // ═══════════════════════════════════════════════════════════

    const PassType = {
        OBJECT:       'object',        // Определение типа объекта + dimensions
        QUANTITIES:   'quantities',    // QTO — расчёт объёмов (complex/vip)
        WORKS:        'works',         // Маппинг → WorkRegistry (local)
        MATERIALS:    'materials',     // Извлечение материалов (complex/vip)
        COMPLETENESS: 'completeness',  // Дополнение недостающих работ (local)
        PRICING:      'pricing',       // 3 сценария ценообразования (local)
        AUDIT:        'audit',         // Кросс-проверка (complex/vip)
        WBS_MAPPING:  'wbs_mapping',   // Маппинг в WBS (vip only)
    };

    // ═══════════════════════════════════════════════════════════
    // ANALYSIS MODES
    // ═══════════════════════════════════════════════════════════

    const AnalysisMode = {
        SIMPLE:  'simple',   // 1 AI-вызов + local enrichment
        COMPLEX: 'complex',  // Несколько AI-вызовов + audit
        VIP:     'vip',      // Полный pipeline + WBS mapping
    };

    // ═══════════════════════════════════════════════════════════
    // SCOPE TYPES
    // ═══════════════════════════════════════════════════════════

    const ScopeType = {
        CONSTRUCTION:       'construction',        // Отдельная работа / помещение
        BUILDING_STRUCTURE: 'building_structure',  // Здание / комплекс
    };

    // ═══════════════════════════════════════════════════════════
    // SESSION STATUS
    // ═══════════════════════════════════════════════════════════

    const SessionStatus = {
        DRAFT:    'draft',
        RUNNING:  'running',
        PAUSED:   'paused',    // Ожидание ответа пользователя (вопросы)
        DONE:     'done',
        ERROR:    'error',
    };

    // ═══════════════════════════════════════════════════════════
    // PASS SEQUENCES — по mode
    // ═══════════════════════════════════════════════════════════

    const PASS_SEQUENCES = {
        [AnalysisMode.SIMPLE]: [
            PassType.OBJECT,
            PassType.WORKS,
            PassType.COMPLETENESS,
            PassType.PRICING,
        ],
        [AnalysisMode.COMPLEX]: [
            PassType.OBJECT,
            PassType.QUANTITIES,
            PassType.WORKS,
            PassType.MATERIALS,
            PassType.COMPLETENESS,
            PassType.PRICING,
            PassType.AUDIT,
        ],
        [AnalysisMode.VIP]: [
            PassType.OBJECT,
            PassType.QUANTITIES,
            PassType.WORKS,
            PassType.MATERIALS,
            PassType.COMPLETENESS,
            PassType.PRICING,
            PassType.AUDIT,
            PassType.WBS_MAPPING,
        ],
    };

    // ═══════════════════════════════════════════════════════════
    // PASS META — описание каждого прохода
    // ═══════════════════════════════════════════════════════════

    const PASS_META = {
        [PassType.OBJECT]: {
            label: 'Определение объекта',
            emoji: '🔍',
            requiresAI: true,
            progressWeight: 30,
        },
        [PassType.QUANTITIES]: {
            label: 'Расчёт объёмов',
            emoji: '📐',
            requiresAI: true,
            progressWeight: 15,
        },
        [PassType.WORKS]: {
            label: 'Подбор работ',
            emoji: '🔧',
            requiresAI: false,
            progressWeight: 15,
        },
        [PassType.MATERIALS]: {
            label: 'Материалы',
            emoji: '🧱',
            requiresAI: true,
            progressWeight: 10,
        },
        [PassType.COMPLETENESS]: {
            label: 'Проверка полноты',
            emoji: '✅',
            requiresAI: false,
            progressWeight: 10,
        },
        [PassType.PRICING]: {
            label: 'Ценообразование',
            emoji: '💰',
            requiresAI: false,
            progressWeight: 10,
        },
        [PassType.AUDIT]: {
            label: 'Аудит',
            emoji: '🔎',
            requiresAI: true,
            progressWeight: 5,
        },
        [PassType.WBS_MAPPING]: {
            label: 'WBS маппинг',
            emoji: '📊',
            requiresAI: false,
            progressWeight: 5,
        },
    };

    // ═══════════════════════════════════════════════════════════
    // FACTORY FUNCTIONS — создание стандартных объектов
    // ═══════════════════════════════════════════════════════════

    /**
     * Создать конверт прохода (PassEnvelope).
     */
    function createPassEnvelope(passType, opts = {}) {
        return {
            passType,
            sessionId: opts.sessionId || '',
            passIndex: opts.passIndex || 0,
            input: opts.input || null,
            output: opts.output || null,
            confidence: opts.confidence || 0,
            provider: opts.provider || 'rule_engine',  // 'gemini'|'chatgpt'|'local'|'rule_engine'
            model: opts.model || '',
            durationMs: opts.durationMs || 0,
            tokensUsed: opts.tokensUsed || 0,
            timestamp: new Date().toISOString(),
            error: opts.error || null,
        };
    }

    /**
     * Создать пустую сессию оценки.
     */
    function createSession(input = {}) {
        const id = 'MPES_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
        return {
            id,
            status: SessionStatus.DRAFT,
            analysisMode: input.analysisMode || AnalysisMode.SIMPLE,
            scopeType: input.scopeType || ScopeType.CONSTRUCTION,
            input: {
                photos: input.photos || [],
                description: input.description || '',
                category: input.category || '',
                categoryMeta: input.categoryMeta || null,
                context: input.context || {},
                projectId: input.projectId || null,
                client: input.client || {},
            },
            passes: [],
            report: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
    }

    /**
     * Создать элемент работы (совместим с PDF data.works[]).
     */
    function createWorkItem(opts = {}) {
        return {
            id: opts.id || ('WI_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5)),
            name: opts.name || '',
            unit: opts.unit || 'шт',
            section: opts.section || 'Общие',
            qty: opts.qty || opts.quantity || 0,
            hours: opts.hours || 0,
            workPrice: opts.workPrice || 0,
            materialPrice: opts.materialPrice || 0,
            price: opts.price || 0,
            matched_work_id: opts.matched_work_id || null,
            price_source: opts.price_source || 'ai',
            confidence: opts.confidence || 0.5,
            category: opts.category || '',
            source_pass: opts.source_pass || '',
        };
    }

    /**
     * Создать пустой EstimateReport (совместим с PDF).
     */
    function createReport(session) {
        return {
            sessionId: session.id,
            analysisMode: session.analysisMode,
            scopeType: session.scopeType,
            passes: session.passes,

            // Работы (PDF: data.works)
            finalItems: [],

            // Материалы (PDF: data.materials)
            materials: [],

            // Техника (PDF: data.equipment)
            equipment: [],

            // Сценарии (PDF: data.plan.scenarios)
            scenarios: null,

            // Дефекты (PDF: data.defects)
            defects: {
                defects: [],
                summary: { cracks: 0, stains: 0, rust: 0, total: 0 },
                max_severity: 'none',
                total_defect_area_pct: 0,
            },

            // 3D измерения (PDF: data.measurements3d)
            measurements3d: null,

            // Мета (PDF: data.plan)
            plan: {
                explanation: '',
                scenarios: null,
                snipRefs: [],
                warnings: [],
                selectedScenario: 'standard',
                confidence: 0,
                objectType: 'generic',
            },

            auditResult: null,

            metadata: {
                elapsed_ms: 0,
                totalTokens: 0,
                provider: '',
                passCount: 0,
                mode: session.analysisMode,
            },

            generatedAt: new Date().toISOString(),
        };
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.EstimateSchemas = {
        // Enums
        PassType,
        AnalysisMode,
        ScopeType,
        SessionStatus,

        // Sequences
        PASS_SEQUENCES,
        PASS_META,

        // Factories
        createPassEnvelope,
        createSession,
        createWorkItem,
        createReport,
    };

    console.log('✅ [EstimateSchemas] v1.0 loaded — Pass types, modes, factories');
})();
