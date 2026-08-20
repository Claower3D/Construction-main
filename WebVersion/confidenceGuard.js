// ========================================
// AI CONFIDENCE GUARD v1.0
// 3.2 Авто-маркировка < 0.6 → инженер
// 3.3 Расхождение > 10% → флаг
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. CONFIG
    // =============================================

    const DEFAULT_ENGINEER_POOL = [
        { id: 'eng_1', name: 'Каримов А.С.', specialization: 'Фундаменты', available: true },
        { id: 'eng_2', name: 'Петров И.М.', specialization: 'Кладка/Монолит', available: true },
        { id: 'eng_3', name: 'Алиев Т.Б.', specialization: 'Кровля/Гидро', available: false },
        { id: 'eng_4', name: 'Сергеев Д.К.', specialization: 'Отделка', available: true }
    ];

    /** Load engineer pool from localStorage, fallback to defaults */
    function _loadEngineerPool() {
        try {
            const stored = localStorage.getItem('engineerPool');
            if (stored) {
                const pool = JSON.parse(stored);
                if (Array.isArray(pool) && pool.length > 0) return pool;
            }
        } catch (e) { /* ignore */ }
        return DEFAULT_ENGINEER_POOL;
    }

    const CONFIG = {
        CONFIDENCE_THRESHOLD: 0.6,
        DEVIATION_THRESHOLD: 0.10,
        get ENGINEER_POOL() { return _loadEngineerPool(); }
    };

    // =============================================
    // 2. CONFIDENCE CHECK (3.2)
    // =============================================

    /**
     * Check AI analysis result confidence.
     * If below threshold, flag for engineer review.
     *
     * @param {Object} analysisResult - AI analysis result
     * @param {Object} orderData - Order/estimate context
     * @returns {Object} - { passed, confidence, flags[], assignedEngineer? }
     */
    function checkConfidence(analysisResult, orderData = {}) {
        if (!analysisResult) {
            return {
                passed: false,
                confidence: 0,
                flags: [{ type: 'no_data', severity: 'critical', message: 'Результат AI анализа отсутствует' }],
                requiresEngineer: true
            };
        }

        const confidence = analysisResult.estimateConfidence
            || analysisResult.confidence
            || (analysisResult.objects ? _avgObjectConfidence(analysisResult.objects) : 0);

        const flags = [];
        let requiresEngineer = false;

        // Low overall confidence
        if (confidence < CONFIG.CONFIDENCE_THRESHOLD) {
            flags.push({
                type: 'low_confidence',
                severity: 'warning',
                value: confidence,
                threshold: CONFIG.CONFIDENCE_THRESHOLD,
                message: `Уверенность AI ${Math.round(confidence * 100)}% ниже порога ${Math.round(CONFIG.CONFIDENCE_THRESHOLD * 100)}%`
            });
            requiresEngineer = true;
        }

        // Check individual objects with low confidence
        if (analysisResult.objects) {
            const lowConfObjects = analysisResult.objects.filter(o =>
                (o.confidence || o.confidencePercent / 100) < CONFIG.CONFIDENCE_THRESHOLD
            );

            if (lowConfObjects.length > 0) {
                flags.push({
                    type: 'low_object_confidence',
                    severity: 'info',
                    count: lowConfObjects.length,
                    objects: lowConfObjects.map(o => ({
                        name: o.localizedName || o.className,
                        confidence: o.confidence || o.confidencePercent / 100
                    })),
                    message: `${lowConfObjects.length} объект(ов) с низкой уверенностью распознавания`
                });
            }
        }

        // No reference object found
        if (analysisResult.hasScale === false) {
            flags.push({
                type: 'no_scale',
                severity: 'warning',
                message: 'Масштаб не определён — измерения могут быть неточными'
            });
            if (confidence < 0.7) requiresEngineer = true;
        }

        // Few objects detected
        if (analysisResult.objects && analysisResult.objects.length < 2) {
            flags.push({
                type: 'few_objects',
                severity: 'info',
                message: 'Обнаружено мало объектов — возможно, фото не информативно'
            });
        }

        // Auto-assign engineer
        let assignedEngineer = null;
        if (requiresEngineer) {
            assignedEngineer = _assignEngineer(orderData.category || 'general');
            _saveReviewRequest(analysisResult, orderData, flags, assignedEngineer);
        }

        const result = {
            passed: !requiresEngineer,
            confidence: Math.round(confidence * 100),
            flags,
            requiresEngineer,
            assignedEngineer
        };

        // Store last check
        localStorage.setItem('lastConfidenceCheck', JSON.stringify(result));

        return result;
    }

    function _avgObjectConfidence(objects) {
        if (!objects || objects.length === 0) return 0;
        const total = objects.reduce((s, o) => s + (o.confidence || (o.confidencePercent || 0) / 100), 0);
        return total / objects.length;
    }

    function _assignEngineer(category) {
        const specMap = {
            foundation: 'Фундаменты',
            concrete: 'Фундаменты',
            masonry: 'Кладка/Монолит',
            roofing: 'Кровля/Гидро',
            insulation: 'Кровля/Гидро',
            finishing: 'Отделка',
            general: null
        };

        const needed = specMap[category] || null;
        let engineer = null;

        if (needed) {
            engineer = CONFIG.ENGINEER_POOL.find(e => e.specialization === needed && e.available);
        }

        if (!engineer) {
            engineer = CONFIG.ENGINEER_POOL.find(e => e.available);
        }

        return engineer || { id: 'unassigned', name: 'Нет доступных инженеров', specialization: '-' };
    }

    function _safeGetJSON(key, defaultVal) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : defaultVal;
        } catch {
            return defaultVal;
        }
    }

    function _saveReviewRequest(analysisResult, orderData, flags, engineer) {
        let reviews = _safeGetJSON('engineerReviews', []);
        reviews.push({
            id: 'REV-' + Date.now(),
            createdAt: new Date().toISOString(),
            status: 'pending',
            orderId: orderData.orderId || null,
            orderTitle: orderData.title || 'Без названия',
            confidence: analysisResult.estimateConfidence || analysisResult.confidence || 0,
            flags: flags.map(f => f.message),
            engineer: engineer,
            estimateTotal: analysisResult.estimateTotal || 0
        });
        // Pruning: keep max 100, remove older than 30 days
        const maxAge = 30 * 24 * 60 * 60 * 1000;
        reviews = reviews.filter(r => !r.createdAt || (Date.now() - new Date(r.createdAt).getTime()) < maxAge).slice(-100);
        localStorage.setItem('engineerReviews', JSON.stringify(reviews));

        console.log(`[ConfidenceGuard] ⚠️ Review assigned to ${engineer.name} for order: ${orderData.title || 'N/A'}`);
    }

    // =============================================
    // 3. DEVIATION CHECK (3.3)
    // =============================================

    /**
     * Compare AI estimate with manual/actual amounts.
     * If deviation > 10%, flag for review.
     *
     * @param {number} aiEstimate - AI calculated amount
     * @param {number} actualAmount - Manual/actual amount
     * @param {Object} context - Additional context
     * @returns {Object} - { hasDeviation, deviationPercent, flags[], severity }
     */
    function checkDeviation(aiEstimate, actualAmount, context = {}) {
        if (!aiEstimate || !actualAmount || aiEstimate === 0 || actualAmount === 0) {
            return { hasDeviation: false, deviationPercent: 0, flags: [], severity: 'none' };
        }

        const deviation = Math.abs(aiEstimate - actualAmount) / actualAmount;
        const deviationPercent = Math.round(deviation * 100);
        const direction = aiEstimate > actualAmount ? 'выше' : 'ниже';
        const flags = [];
        let severity = 'none';

        if (deviation > CONFIG.DEVIATION_THRESHOLD) {
            severity = deviation > 0.25 ? 'critical' : deviation > 0.15 ? 'high' : 'warning';

            flags.push({
                type: 'price_deviation',
                severity,
                deviationPercent,
                direction,
                aiEstimate,
                actualAmount,
                difference: Math.abs(aiEstimate - actualAmount),
                message: `Расхождение ${deviationPercent}% (AI ${direction} на ${_fmt(Math.abs(aiEstimate - actualAmount))})`
            });

            // Suggest action based on severity
            if (severity === 'critical') {
                flags.push({
                    type: 'action_required',
                    severity: 'critical',
                    message: 'Рекомендуется экспертная проверка — расхождение значительное'
                });
            }

            // Save deviation alert
            _saveDeviationAlert(aiEstimate, actualAmount, deviationPercent, context);
        }

        // Per-item deviation check
        if (context.items && context.aiItems) {
            const itemDeviations = _checkItemDeviations(context.items, context.aiItems);
            flags.push(...itemDeviations);
        }

        return {
            hasDeviation: deviation > CONFIG.DEVIATION_THRESHOLD,
            deviationPercent,
            deviation: Math.round(deviation * 10000) / 100,
            direction,
            flags,
            severity
        };
    }

    function _checkItemDeviations(manualItems, aiItems) {
        const flags = [];
        if (!Array.isArray(manualItems) || !Array.isArray(aiItems)) return flags;

        // Compare matching items
        manualItems.forEach(mi => {
            const aiMatch = aiItems.find(ai =>
                ai.work_name === mi.work_name || ai.name === mi.name
            );

            if (aiMatch) {
                const mPrice = mi.total_price || mi.totalPrice || 0;
                const aPrice = aiMatch.total_price || aiMatch.totalPrice || 0;

                if (mPrice > 0 && aPrice > 0) {
                    const itemDev = Math.abs(mPrice - aPrice) / mPrice;
                    if (itemDev > CONFIG.DEVIATION_THRESHOLD) {
                        flags.push({
                            type: 'item_deviation',
                            severity: itemDev > 0.25 ? 'high' : 'warning',
                            itemName: mi.work_name || mi.name,
                            manualPrice: mPrice,
                            aiPrice: aPrice,
                            deviationPercent: Math.round(itemDev * 100),
                            message: `Позиция "${mi.work_name || mi.name}": расхождение ${Math.round(itemDev * 100)}%`
                        });
                    }
                }
            }
        });

        return flags;
    }

    function _saveDeviationAlert(aiEstimate, actualAmount, percent, context) {
        let alerts = _safeGetJSON('deviationAlerts', []);
        alerts.push({
            id: 'DEV-' + Date.now(),
            createdAt: new Date().toISOString(),
            status: 'open',
            aiEstimate,
            actualAmount,
            deviationPercent: percent,
            difference: Math.abs(aiEstimate - actualAmount),
            orderId: context.orderId || null,
            orderTitle: context.title || 'Без названия',
            reviewed: false
        });
        // Pruning: keep max 100, remove older than 30 days
        const maxAge = 30 * 24 * 60 * 60 * 1000;
        alerts = alerts.filter(a => !a.createdAt || (Date.now() - new Date(a.createdAt).getTime()) < maxAge).slice(-100);
        localStorage.setItem('deviationAlerts', JSON.stringify(alerts));

        console.log(`[ConfidenceGuard] 🚩 Deviation alert: ${percent}% for ${context.title || 'N/A'}`);
    }

    function _fmt(n) {
        return new Intl.NumberFormat('ru-KZ').format(n) + ' ₸';
    }

    // =============================================
    // 4. INLINE UI — CONFIDENCE BADGE
    // =============================================

    /**
     * Render inline confidence/deviation badges.
     */
    function renderConfidenceBadge(container, checkResult) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        if (checkResult.passed) {
            el.innerHTML = `
                <div class="cg-badge cg-passed">
                    <span class="cg-badge-icon">✅</span>
                    <span>AI: ${checkResult.confidence}% уверенность</span>
                </div>
            `;
        } else {
            el.innerHTML = `
                <div class="cg-badge cg-flagged">
                    <span class="cg-badge-icon">⚠️</span>
                    <div class="cg-badge-content">
                        <span class="cg-badge-title">Требуется проверка инженера</span>
                        <span class="cg-badge-detail">AI: ${checkResult.confidence}% • Назначен: ${checkResult.assignedEngineer?.name || '—'}</span>
                        ${checkResult.flags.map(f => `
                            <span class="cg-flag-item cg-${f.severity}">${f.message}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    function renderDeviationBadge(container, devResult) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        if (!devResult.hasDeviation) {
            el.innerHTML = `
                <div class="cg-badge cg-passed">
                    <span class="cg-badge-icon">✅</span>
                    <span>Расхождение: ${devResult.deviationPercent}% — в пределах нормы</span>
                </div>
            `;
        } else {
            el.innerHTML = `
                <div class="cg-badge cg-deviation cg-${devResult.severity}">
                    <span class="cg-badge-icon">🚩</span>
                    <div class="cg-badge-content">
                        <span class="cg-badge-title">Расхождение ${devResult.deviationPercent}%</span>
                        ${devResult.flags.map(f => `
                            <span class="cg-flag-item cg-${f.severity}">${f.message}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    // =============================================
    // 5. ADMIN: REVIEW QUEUE
    // =============================================

    function getReviewQueue() {
        return _safeGetJSON('engineerReviews', []);
    }

    function getDeviationAlerts() {
        return _safeGetJSON('deviationAlerts', []);
    }

    function approveReview(reviewId) {
        const reviews = getReviewQueue();
        const idx = reviews.findIndex(r => r.id === reviewId);
        if (idx !== -1) {
            reviews[idx].status = 'approved';
            reviews[idx].approvedAt = new Date().toISOString();
            localStorage.setItem('engineerReviews', JSON.stringify(reviews));
        }
        return reviews[idx];
    }

    function dismissDeviation(alertId) {
        const alerts = getDeviationAlerts();
        const idx = alerts.findIndex(a => a.id === alertId);
        if (idx !== -1) {
            alerts[idx].reviewed = true;
            alerts[idx].reviewedAt = new Date().toISOString();
            localStorage.setItem('deviationAlerts', JSON.stringify(alerts));
        }
        return alerts[idx];
    }

    function renderReviewQueue(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        const reviews = getReviewQueue().filter(r => r.status === 'pending');
        const alerts = getDeviationAlerts().filter(a => !a.reviewed);

        el.innerHTML = `
            <div class="cg-queue">
                <div class="cg-queue-header">
                    <h3>🔍 Очередь проверок</h3>
                    <div class="cg-queue-stats">
                        <span class="cg-queue-stat">⚠️ ${reviews.length} ожидают</span>
                        <span class="cg-queue-stat">🚩 ${alerts.length} расхождений</span>
                    </div>
                </div>

                ${reviews.length > 0 ? `
                    <div class="cg-queue-section">
                        <h4>👷 Ожидают инженера</h4>
                        ${reviews.map(r => `
                            <div class="cg-queue-item">
                                <div class="cg-queue-item-header">
                                    <span class="cg-queue-id">${r.id}</span>
                                    <span class="cg-queue-confidence">AI: ${Math.round((r.confidence || 0) * 100)}%</span>
                                </div>
                                <div class="cg-queue-title">${r.orderTitle}</div>
                                <div class="cg-queue-engineer">👷 ${r.engineer?.name || '—'} (${r.engineer?.specialization || '-'})</div>
                                <div class="cg-queue-flags">
                                    ${(r.flags || []).map(f => `<span class="cg-flag-mini">${f}</span>`).join('')}
                                </div>
                                <div class="cg-queue-actions">
                                    <button class="cg-btn approve" onclick="window.ConfidenceGuard.approveReview('${r.id}');window.ConfidenceGuard.renderReviewQueue(this.closest('.cg-queue').parentElement);">
                                        ✅ Подтвердить
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${alerts.length > 0 ? `
                    <div class="cg-queue-section">
                        <h4>🚩 Расхождения > ${Math.round(CONFIG.DEVIATION_THRESHOLD * 100)}%</h4>
                        ${alerts.map(a => `
                            <div class="cg-queue-item deviation">
                                <div class="cg-queue-item-header">
                                    <span class="cg-queue-id">${a.id}</span>
                                    <span class="cg-deviation-pct">${a.deviationPercent}% расхождение</span>
                                </div>
                                <div class="cg-queue-title">${a.orderTitle}</div>
                                <div class="cg-queue-amounts">
                                    AI: ${_fmt(a.aiEstimate)} → Факт: ${_fmt(a.actualAmount)}
                                    <span class="cg-diff">(Δ ${_fmt(a.difference)})</span>
                                </div>
                                <div class="cg-queue-actions">
                                    <button class="cg-btn dismiss" onclick="window.ConfidenceGuard.dismissDeviation('${a.id}');window.ConfidenceGuard.renderReviewQueue(this.closest('.cg-queue').parentElement);">
                                        ✓ Рассмотрено
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}

                ${reviews.length === 0 && alerts.length === 0 ? `
                    <div class="cg-queue-empty">
                        <span>✅</span>
                        <p>Нет ожидающих проверок</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /** C.3: Render history of completed reviews (approved + dismissed) */
    function renderReviewHistory(container) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        const approvedReviews = getReviewQueue().filter(r => r.status === 'approved');
        const dismissedAlerts = getDeviationAlerts().filter(a => a.reviewed);
        const all = [
            ...approvedReviews.map(r => ({ type: 'review', ...r, _date: r.approvedAt || r.createdAt })),
            ...dismissedAlerts.map(a => ({ type: 'deviation', ...a, _date: a.reviewedAt || a.createdAt })),
        ].sort((a, b) => new Date(b._date) - new Date(a._date)).slice(0, 20);

        if (all.length === 0) {
            el.innerHTML = '<div style="text-align:center;padding:16px;color:#6b7280;font-size:13px;">Нет истории проверок</div>';
            return;
        }

        el.innerHTML = `
            <div class="cg-queue" style="margin-top:12px;">
                <div class="cg-queue-header">
                    <h3 style="font-size:15px;">📋 История проверок (${all.length})</h3>
                </div>
                ${all.map(item => `
                    <div class="cg-queue-item" style="opacity:0.7;border-left:3px solid ${item.type === 'review' ? '#22c55e' : '#818cf8'};">
                        <div class="cg-queue-item-header">
                            <span class="cg-queue-id">${item.id}</span>
                            <span style="font-size:11px;color:#6b7280;">${new Date(item._date).toLocaleDateString('ru-RU')} ${new Date(item._date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div class="cg-queue-title">${item.orderTitle || '—'}</div>
                        <div style="font-size:11px;color:${item.type === 'review' ? '#22c55e' : '#818cf8'};">
                            ${item.type === 'review' ? '✅ Подтверждено' : '✓ Рассмотрено'}
                            ${item.engineer ? ` · 👷 ${item.engineer.name}` : ''}
                            ${item.deviationPercent ? ` · ${item.deviationPercent}% расхождение` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // =============================================
    // 6. CSS INJECTION
    // =============================================

    function _injectStyles() {
        if (document.getElementById('confidence-guard-styles')) return;
        const style = document.createElement('style');
        style.id = 'confidence-guard-styles';
        style.textContent = `
            .cg-badge { display:flex; align-items:flex-start; gap:10px; padding:12px 16px; border-radius:10px; font-size:13px; }
            .cg-badge.cg-passed { background:rgba(34,197,94,0.06); border:1px solid rgba(34,197,94,0.2); color:#22c55e; }
            .cg-badge.cg-flagged { background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.2); }
            .cg-badge.cg-deviation { border:1px solid rgba(239,68,68,0.2); }
            .cg-badge.cg-deviation.cg-warning { background:rgba(245,158,11,0.06); }
            .cg-badge.cg-deviation.cg-high { background:rgba(239,68,68,0.06); }
            .cg-badge.cg-deviation.cg-critical { background:rgba(220,38,38,0.08); border-color:rgba(220,38,38,0.3); }
            .cg-badge-icon { font-size:18px; margin-top:1px; }
            .cg-badge-content { display:flex; flex-direction:column; gap:4px; }
            .cg-badge-title { font-weight:600; font-size:14px; color:#e5e5e5; }
            .cg-badge-detail { font-size:12px; color:#9ca3af; }
            .cg-flag-item { font-size:12px; padding:2px 0; }
            .cg-flag-item.cg-warning { color:#f59e0b; }
            .cg-flag-item.cg-info { color:#3b82f6; }
            .cg-flag-item.cg-critical { color:#ef4444; }
            .cg-flag-item.cg-high { color:#f97316; }

            .cg-queue { color:#e5e5e5; font-family:'Inter',-apple-system,sans-serif; }
            .cg-queue-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:8px; }
            .cg-queue-header h3 { margin:0; font-size:18px; }
            .cg-queue-stats { display:flex; gap:12px; font-size:12px; color:#9ca3af; }
            .cg-queue-section { margin-bottom:16px; }
            .cg-queue-section h4 { margin:0 0 8px; font-size:14px; color:#9ca3af; }
            .cg-queue-item { background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:12px; margin-bottom:6px; }
            .cg-queue-item.deviation { border-left:3px solid #ef4444; }
            .cg-queue-item-header { display:flex; justify-content:space-between; margin-bottom:4px; }
            .cg-queue-id { font-size:11px; color:#6b7280; font-family:monospace; }
            .cg-queue-confidence { font-size:11px; color:#f59e0b; font-weight:600; }
            .cg-deviation-pct { font-size:11px; color:#ef4444; font-weight:600; }
            .cg-queue-title { font-size:13px; font-weight:600; margin-bottom:4px; }
            .cg-queue-engineer { font-size:12px; color:#9ca3af; margin-bottom:4px; }
            .cg-queue-amounts { font-size:12px; color:#9ca3af; margin-bottom:6px; }
            .cg-diff { color:#ef4444; font-weight:600; }
            .cg-queue-flags { display:flex; flex-direction:column; gap:2px; margin-bottom:6px; }
            .cg-flag-mini { font-size:11px; color:#f59e0b; }
            .cg-queue-actions { display:flex; gap:6px; }
            .cg-btn { padding:6px 12px; border:1px solid rgba(255,255,255,0.1); border-radius:6px; background:rgba(255,255,255,0.04); color:#e5e5e5; font-size:12px; cursor:pointer; transition:all 0.2s; }
            .cg-btn:hover { background:rgba(255,255,255,0.08); }
            .cg-btn.approve { border-color:rgba(34,197,94,0.3); color:#22c55e; }
            .cg-btn.dismiss { border-color:rgba(99,102,241,0.3); color:#818cf8; }
            .cg-queue-empty { text-align:center; padding:30px; color:#6b7280; }
            .cg-queue-empty span { font-size:32px; }
        `;
        document.head.appendChild(style);
    }

    _injectStyles();

    // =============================================
    // 7. EXPORT
    // =============================================

    window.ConfidenceGuard = {
        // Core checks
        checkConfidence,
        checkDeviation,

        // UI rendering
        renderConfidenceBadge,
        renderDeviationBadge,
        renderReviewQueue,
        renderReviewHistory,

        // Admin actions
        getReviewQueue,
        getDeviationAlerts,
        approveReview,
        dismissDeviation,

        // Engineer pool management
        getEngineerPool() { return _loadEngineerPool(); },
        updateEngineerPool(engineers) {
            if (!Array.isArray(engineers)) return;
            localStorage.setItem('engineerPool', JSON.stringify(engineers));
            console.log(`[ConfidenceGuard] 👷 Engineer pool updated: ${engineers.length} engineers`);
        },
        addEngineer(engineer) {
            const pool = _loadEngineerPool();
            pool.push({ ...engineer, id: engineer.id || 'eng_' + Date.now() });
            localStorage.setItem('engineerPool', JSON.stringify(pool));
        },

        // Config
        CONFIG
    };

    console.log('[ConfidenceGuard] ✅ AI Confidence Guard v1.0 loaded');
    console.log(`[ConfidenceGuard] Threshold: confidence < ${CONFIG.CONFIDENCE_THRESHOLD * 100}% → engineer review`);
    console.log(`[ConfidenceGuard] Threshold: deviation > ${CONFIG.DEVIATION_THRESHOLD * 100}% → flag alert`);

})();
