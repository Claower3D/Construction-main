// ================================================================
// multiPassEstimateEngine.js — Главный оркестратор Multi-Pass Engine
// QazGost AI v4.0 · Фаза 2: ядро системы
//
// Координирует последовательное выполнение passes:
//   mode=simple:  object → works → completeness → pricing
//   mode=complex: object → quantities → works → materials → completeness → pricing → audit
//   mode=vip:     object → quantities → works → materials → completeness → pricing → audit → wbs
//
// Вход: { photos, description, category, context }
// Выход: EstimateReport (совместим с pePdfService.js)
// ================================================================
(function () {
    'use strict';

    // ═══════════════════════════════════════════════════════════
    // MAIN: run()
    // ═══════════════════════════════════════════════════════════

    /**
     * Запустить полный pipeline оценки.
     * @param {object} input
     *   input.photos — [{ dataUrl }] или [File]
     *   input.description — текстовое описание
     *   input.category — категория работ
     *   input.categoryMeta — { icon, color }
     *   input.context — { isRepair, isWetZone, ... }
     *   input.projectId — ID VIP-проекта (опционально)
     *   input.client — { name, phone, address }
     *   input.forceMode — ручной выбор mode
     *   input.provider — 'gemini'|'chatgpt' (default: auto)
     * @param {function} onProgress — (step, percent, message)
     * @returns {Promise<EstimateReport>}
     */
    async function run(input, onProgress) {
        const startTime = Date.now();
        const S = window.EstimateSchemas;
        const Store = window.EstimateSessionStore;
        const PR = window.PromptRegistry;
        const Runner = window.PassRunner;

        if (!S || !Store || !PR || !Runner) {
            throw new Error('Multi-Pass Engine dependencies not loaded: EstimateSchemas, EstimateSessionStore, PromptRegistry, PassRunner');
        }

        const emit = (step, percent, message) => {
            if (onProgress) onProgress(step, percent, message);
        };

        // ── 1. Resolve mode and scope ──
        emit('init', 2, '⚙️ Определяю режим анализа...');

        const modeResult = window.EstimateModeResolver
            ? window.EstimateModeResolver.resolve(input)
            : { analysisMode: input.forceMode || 'simple', reason: 'default' };

        const scopeResult = window.ScopeResolver
            ? window.ScopeResolver.resolve(input)
            : { scopeType: 'construction', reason: 'default' };

        const mode = input.forceMode || modeResult.analysisMode;
        const scope = scopeResult.scopeType;

        console.log(`[MultiPassEngine] Mode: ${mode} (${modeResult.reason}), Scope: ${scope}`);

        // ── 2. Create session ──
        emit('init', 5, `📋 Режим: ${_modeLabel(mode)} | Scope: ${scope}`);

        const session = Store.create({
            ...input,
            analysisMode: mode,
            scopeType: scope,
        });

        Store.update(session.id, { status: S.SessionStatus.RUNNING });

        // ── 3. Get pass sequence ──
        const passSequence = S.PASS_SEQUENCES[mode] || S.PASS_SEQUENCES.simple;
        const totalPasses = passSequence.length;

        console.log(`[MultiPassEngine] Session ${session.id}: ${totalPasses} passes → [${passSequence.join(', ')}]`);

        // ── 4. Determine AI provider ──
        const provider = input.provider || _detectProvider();

        // ── 5. Execute passes sequentially ──
        const passResults = {};  // passType → output
        let totalTokens = 0;

        for (let i = 0; i < passSequence.length; i++) {
            const passType = passSequence[i];
            const passMeta = S.PASS_META[passType];
            const basePercent = 5 + Math.round((i / totalPasses) * 90);

            emit(passType, basePercent, `${passMeta.emoji} ${passMeta.label}...`);

            try {
                let envelope;

                if (passMeta.requiresAI) {
                    // AI pass
                    envelope = await _executeAIPass(passType, {
                        input,
                        mode,
                        scope,
                        passResults,
                        provider,
                        session,
                        S, PR, Runner,
                    });
                } else {
                    // Local pass
                    envelope = await _executeLocalPass(passType, {
                        input,
                        passResults,
                        session,
                        S, Runner,
                    });
                }

                // Store pass result
                Store.addPass(session.id, envelope);
                passResults[passType] = envelope.output;
                totalTokens += envelope.tokensUsed || 0;

                console.log(`[MultiPassEngine] ✅ Pass "${passType}" done (${envelope.durationMs}ms, conf: ${envelope.confidence})`);

            } catch (err) {
                console.error(`[MultiPassEngine] ❌ Pass "${passType}" failed:`, err.message);

                // Create error envelope
                const errorEnvelope = S.createPassEnvelope(passType, {
                    sessionId: session.id,
                    error: err.message,
                    confidence: 0,
                    durationMs: Date.now() - startTime,
                });

                Store.addPass(session.id, errorEnvelope);

                // For critical passes (object), abort. For others, continue.
                if (passType === 'object') {
                    Store.setError(session.id, `Критическая ошибка в pass "${passType}": ${err.message}`);
                    throw new Error(`Pass "${passType}" failed: ${err.message}`);
                }

                // Non-critical — log and continue
                passResults[passType] = null;
            }
        }

        // ── 6. Assemble report ──
        emit('report', 95, '📊 Формирую отчёт...');

        const report = _assembleReport(session, passResults, {
            elapsed_ms: Date.now() - startTime,
            totalTokens,
            provider,
            mode,
        });

        Store.setReport(session.id, report);

        emit('done', 100, `✅ Готово! ${report.finalItems.length} позиций, ${_modeLabel(mode)}`);

        console.log(`[MultiPassEngine] 🏁 Session ${session.id} complete: ${report.finalItems.length} items, ${Date.now() - startTime}ms`);

        return report;
    }

    // ═══════════════════════════════════════════════════════════
    // RE-RUN SINGLE PASS
    // ═══════════════════════════════════════════════════════════

    /**
     * Повторить один pass (после уточнения пользователем).
     */
    async function rerunPass(sessionId, passType, overrides = {}) {
        const Store = window.EstimateSessionStore;
        const session = Store.get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        // Get previous results from stored passes
        const passResults = {};
        for (const p of session.passes) {
            if (p.output) passResults[p.passType] = p.output;
        }

        // Apply overrides
        Object.assign(passResults, overrides);

        // Re-execute the pass
        const S = window.EstimateSchemas;
        const Runner = window.PassRunner;
        const passMeta = S.PASS_META[passType];

        let envelope;
        if (passMeta.requiresAI) {
            envelope = await _executeAIPass(passType, {
                input: session.input,
                mode: session.analysisMode,
                scope: session.scopeType,
                passResults,
                provider: _detectProvider(),
                session,
                S,
                PR: window.PromptRegistry,
                Runner,
            });
        } else {
            envelope = await _executeLocalPass(passType, {
                input: session.input,
                passResults,
                session,
                S,
                Runner,
            });
        }

        Store.addPass(sessionId, envelope);
        return envelope;
    }

    /**
     * Получить текущую сессию.
     */
    function getSession(sessionId) {
        return window.EstimateSessionStore?.get(sessionId) || null;
    }

    // ═══════════════════════════════════════════════════════════
    // INTERNAL: Execute AI Pass
    // ═══════════════════════════════════════════════════════════

    async function _executeAIPass(passType, opts) {
        const { input, mode, scope, passResults, provider, session, S, PR, Runner } = opts;

        // Build context for prompt
        const promptContext = {
            category: input.category || '',
            description: input.description || '',
            objectType: passResults.object?.objectType || '',
            dimensions: passResults.object?.dimensions || {},
            scene_description: passResults.object?.scene_description || '',
            workItems: passResults.works?.items || passResults.completeness?.items || [],
        };

        // Build prompt
        const prompt = PR.build({
            mode,
            passType,
            scope,
            context: promptContext,
            previousPasses: session.passes || [],
        });

        // Execute AI call
        const result = await Runner.runAI(prompt, input, provider);

        // Create envelope
        return S.createPassEnvelope(passType, {
            sessionId: session.id,
            input: { promptLength: prompt.user.length },
            output: result.output,
            confidence: result.output?.confidence || 0.7,
            provider: result.provider || provider,
            model: result.model || '',
            durationMs: result.duration,
            tokensUsed: result.tokens,
        });
    }

    // ═══════════════════════════════════════════════════════════
    // INTERNAL: Execute Local Pass
    // ═══════════════════════════════════════════════════════════

    async function _executeLocalPass(passType, opts) {
        const { input, passResults, session, S, Runner } = opts;

        // Build previous results context
        const prev = {
            objectOutput: passResults.object || null,
            rawItems: passResults.object?.estimate_items || passResults.quantities?.items || [],
            worksItems: passResults.works?.items || [],
            completenessItems: passResults.completeness?.items || passResults.works?.items || [],
            pricedItems: passResults.pricing?.items || [],
        };

        const context = {
            category: input.category || '',
            description: input.description || '',
            objectType: passResults.object?.objectType || 'generic',
            projectId: input.projectId || null,
            ...(input.context || {}),
        };

        const result = await Runner.runLocal(passType, prev, context);

        return S.createPassEnvelope(passType, {
            sessionId: session.id,
            input: { passType },
            output: result.output,
            confidence: _inferLocalConfidence(passType, result.output),
            provider: 'rule_engine',
            durationMs: result.duration,
        });
    }

    // ═══════════════════════════════════════════════════════════
    // INTERNAL: Assemble EstimateReport
    // ═══════════════════════════════════════════════════════════

    function _assembleReport(session, passResults, meta) {
        const S = window.EstimateSchemas;
        const report = S.createReport(session);

        // Final items — from pricing (has all items with prices)
        report.finalItems = passResults.pricing?.items
            || passResults.completeness?.items
            || passResults.works?.items
            || [];

        // Scenarios
        report.scenarios = passResults.pricing?.scenarios || null;

        // Materials & Equipment
        if (passResults.materials) {
            report.materials = passResults.materials.materials || [];
            report.equipment = passResults.materials.equipment || [];
        }

        // Defects (from object pass)
        if (passResults.object?.defects && passResults.object.defects.length > 0) {
            const defects = passResults.object.defects;
            report.defects = {
                defects,
                summary: {
                    cracks: defects.filter(d => d.type === 'crack').length,
                    stains: defects.filter(d => d.type === 'stain').length,
                    rust: defects.filter(d => d.type === 'rust').length,
                    total: defects.length,
                },
                max_severity: _maxSeverity(defects),
                total_defect_area_pct: 0,
            };
        }

        // Dimensions → measurements3d
        if (passResults.object?.dimensions) {
            const d = passResults.object.dimensions;
            report.measurements3d = {
                area_m2: d.area_m2 || 0,
                perimeter_m: d.perimeter_m || 0,
                height_m: d.height_m || 0,
                volume_m3: d.volume_m3 || 0,
                confidence: (passResults.object.confidence || 70) / 100,
                method: 'ai_estimation',
                num_points_3d: 0,
            };
        }

        // Plan
        report.plan = {
            explanation: passResults.object?.scene_description || '',
            scenarios: report.scenarios,
            snipRefs: passResults.object?.snip_references || passResults.audit?.snip_references || [],
            warnings: [
                ...(passResults.completeness?.warnings || []),
                ...(passResults.audit?.issues?.filter(i => i.severity === 'warning').map(i => i.message) || []),
            ],
            selectedScenario: passResults.pricing?.selectedScenario || 'standard',
            confidence: (passResults.object?.confidence || 70) / 100,
            objectType: passResults.object?.objectType || 'generic',
        };

        // Audit
        if (passResults.audit) {
            report.auditResult = {
                passed: passResults.audit.passed !== false,
                score: passResults.audit.score || 80,
                issues: passResults.audit.issues || [],
            };
        }

        // Metadata
        report.metadata = {
            elapsed_ms: meta.elapsed_ms,
            totalTokens: meta.totalTokens,
            provider: meta.provider,
            passCount: Object.keys(passResults).length,
            mode: meta.mode,
        };

        report.generatedAt = new Date().toISOString();

        return report;
    }

    // ═══════════════════════════════════════════════════════════
    // HELPERS
    // ═══════════════════════════════════════════════════════════

    function _detectProvider() {
        const aiMode = window.AIService?.getMode?.();
        if (aiMode === 'chatgpt' && window.ChatGptService?.isConfigured?.()) return 'chatgpt';
        if (window.GeminiService?.isConfigured?.()) return 'gemini';
        return 'gemini';
    }

    function _modeLabel(mode) {
        const labels = {
            simple: '⚡ Быстрый',
            complex: '🔬 Детальный',
            vip: '👑 VIP',
        };
        return labels[mode] || mode;
    }

    function _maxSeverity(defects) {
        const order = ['none', 'low', 'medium', 'high', 'critical'];
        let max = 0;
        for (const d of defects) {
            const idx = order.indexOf(d.severity || 'low');
            if (idx > max) max = idx;
        }
        return order[max];
    }

    function _inferLocalConfidence(passType, output) {
        if (!output) return 0;
        switch (passType) {
            case 'works':
                return output.matchRate ? Math.round(output.matchRate * 100) : 50;
            case 'completeness':
                return output.completeness || 80;
            case 'pricing':
                return 90;  // Local pricing is deterministic
            default:
                return 70;
        }
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.MultiPassEstimateEngine = {
        run,
        rerunPass,
        getSession,
    };

    console.log('✅ [MultiPassEstimateEngine] v1.0 loaded — multi-pass orchestrator (simple/complex/vip)');
})();
