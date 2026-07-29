// ================================================================
// estimateSessionStore.js — Хранилище сессий Multi-Pass Engine
// QazGost AI v4.0 · Фаза 0: персистенция сессий
//
// localStorage с префиксом EST_SESSION_*
// API совместим с VipModels.VipStorage
// ================================================================
(function () {
    'use strict';

    const PREFIX = 'EST_SESSION_';
    const MAX_SESSIONS = 50;  // Лимит хранимых сессий

    // ═══════════════════════════════════════════════════════════
    // CRUD OPERATIONS
    // ═══════════════════════════════════════════════════════════

    /**
     * Создать новую сессию и сохранить.
     * @param {object} input — { photos, description, category, ... }
     * @returns {object} session
     */
    function create(input = {}) {
        const S = window.EstimateSchemas;
        if (!S) throw new Error('EstimateSchemas not loaded');

        const session = S.createSession(input);
        session.status = S.SessionStatus.DRAFT;
        _save(session);

        console.log(`[EstimateSessionStore] 📝 Created session ${session.id} (${session.analysisMode})`);
        return session;
    }

    /**
     * Добавить pass к сессии.
     * @param {string} sessionId
     * @param {object} passEnvelope — созданный через EstimateSchemas.createPassEnvelope
     * @returns {number} passIndex
     */
    function addPass(sessionId, passEnvelope) {
        const session = get(sessionId);
        if (!session) throw new Error(`Session ${sessionId} not found`);

        passEnvelope.sessionId = sessionId;
        passEnvelope.passIndex = session.passes.length;
        session.passes.push(passEnvelope);
        session.updatedAt = new Date().toISOString();

        // Auto-update status
        if (session.status === 'draft') {
            session.status = 'running';
        }

        _save(session);
        return passEnvelope.passIndex;
    }

    /**
     * Получить сессию по ID.
     * @param {string} sessionId
     * @returns {object|null}
     */
    function get(sessionId) {
        try {
            const raw = localStorage.getItem(PREFIX + sessionId);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.warn(`[EstimateSessionStore] Failed to read session ${sessionId}:`, e.message);
            return null;
        }
    }

    /**
     * Обновить сессию (partial merge).
     * @param {string} sessionId
     * @param {object} updates
     * @returns {object|null} updated session
     */
    function update(sessionId, updates) {
        const session = get(sessionId);
        if (!session) return null;

        Object.assign(session, updates);
        session.updatedAt = new Date().toISOString();
        _save(session);
        return session;
    }

    /**
     * Установить финальный отчёт.
     * @param {string} sessionId
     * @param {object} report — EstimateReport
     */
    function setReport(sessionId, report) {
        const session = get(sessionId);
        if (!session) return null;

        session.report = report;
        session.status = 'done';
        session.updatedAt = new Date().toISOString();
        _save(session);

        console.log(`[EstimateSessionStore] ✅ Session ${sessionId} done — ${report.finalItems?.length || 0} items`);
        return session;
    }

    /**
     * Получить отчёт сессии.
     */
    function getReport(sessionId) {
        const session = get(sessionId);
        return session?.report || null;
    }

    /**
     * Список всех сессий (с фильтрами).
     * @param {object} filters — { status, analysisMode, limit }
     * @returns {Array}
     */
    function list(filters = {}) {
        const sessions = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key || !key.startsWith(PREFIX)) continue;
            try {
                const session = JSON.parse(localStorage.getItem(key));
                if (filters.status && session.status !== filters.status) continue;
                if (filters.analysisMode && session.analysisMode !== filters.analysisMode) continue;
                sessions.push(session);
            } catch { /* skip corrupted */ }
        }

        sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (filters.limit) {
            return sessions.slice(0, filters.limit);
        }
        return sessions;
    }

    /**
     * Удалить сессию.
     */
    function remove(sessionId) {
        localStorage.removeItem(PREFIX + sessionId);
        console.log(`[EstimateSessionStore] 🗑️ Deleted session ${sessionId}`);
    }

    /**
     * Пометить сессию как ошибочную.
     */
    function setError(sessionId, errorMessage) {
        return update(sessionId, {
            status: 'error',
            error: errorMessage,
        });
    }

    /**
     * Получить последние N pass из сессии.
     */
    function getPassResults(sessionId) {
        const session = get(sessionId);
        if (!session) return [];
        return session.passes.map(p => ({
            type: p.passType,
            output: p.output,
            confidence: p.confidence,
            durationMs: p.durationMs,
        }));
    }

    // ═══════════════════════════════════════════════════════════
    // INTERNAL
    // ═══════════════════════════════════════════════════════════

    function _save(session) {
        try {
            localStorage.setItem(PREFIX + session.id, JSON.stringify(session));
        } catch (e) {
            // Quota exceeded — clean old sessions
            if (e.name === 'QuotaExceededError') {
                _cleanup();
                try {
                    localStorage.setItem(PREFIX + session.id, JSON.stringify(session));
                } catch {
                    console.error('[EstimateSessionStore] Storage quota exceeded even after cleanup');
                }
            }
        }
    }

    function _cleanup() {
        const all = list();
        if (all.length <= MAX_SESSIONS) return;

        // Delete oldest sessions beyond limit
        const toDelete = all.slice(MAX_SESSIONS);
        toDelete.forEach(s => remove(s.id));
        console.log(`[EstimateSessionStore] 🧹 Cleaned ${toDelete.length} old sessions`);
    }

    // ═══════════════════════════════════════════════════════════
    // EXPORT
    // ═══════════════════════════════════════════════════════════

    window.EstimateSessionStore = {
        create,
        addPass,
        get,
        update,
        setReport,
        getReport,
        list,
        remove,
        setError,
        getPassResults,
    };

    console.log('✅ [EstimateSessionStore] v1.0 loaded — localStorage persistence');
})();
