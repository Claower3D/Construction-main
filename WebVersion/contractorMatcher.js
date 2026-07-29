// ========================================
// AUTO-MATCH CONTRACTORS MODULE v1.0
// Авто-подбор подрядчиков для заказов
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. MATCHING ENGINE — скоринг подрядчиков
    // =============================================

    /**
     * Весовые коэффициенты для ранжирования
     */
    const WEIGHTS = {
        categoryMatch: 0.30,   // совпадение специализации
        cityMatch: 0.20,   // совпадение города
        rating: 0.20,   // средний рейтинг
        experience: 0.10,   // лет опыта
        completedOrders: 0.10,   // количество завершённых заказов
        verified: 0.05,   // верифицирован ли
        responseTime: 0.05    // среднее время отклика (демо)
    };

    /**
     * Рассчитать score исполнителя для конкретного заказа
     * @param {Object} executor  - профиль ExecutorProfile
     * @param {Object} order     - объект заказа
     * @returns {Object} { score: 0..100, breakdown: {...} }
     */
    function scoreExecutor(executor, order) {
        const breakdown = {};

        // 1. Совпадение специализации
        const exServices = executor.services || [];
        const orderCat = order.category || '';
        const catScore = exServices.includes(orderCat) ? 100 : _fuzzyCategory(exServices, orderCat);
        breakdown.categoryMatch = catScore;

        // 2. Совпадение города
        const cityScore = (executor.city || '').toLowerCase() === (order.city || '').toLowerCase() ? 100 : 0;
        breakdown.cityMatch = cityScore;

        // 3. Рейтинг (нормализация к 0..100)
        const ratingScore = Math.min(100, ((executor.rating || 0) / 5) * 100);
        breakdown.rating = ratingScore;

        // 4. Опыт (нормализация: 15+ лет = 100)
        const expScore = Math.min(100, ((executor.experience || 0) / 15) * 100);
        breakdown.experience = expScore;

        // 5. Завершённые заказы (нормализация: 50+ = 100)
        const complScore = Math.min(100, ((executor.ordersCompleted || 0) / 50) * 100);
        breakdown.completedOrders = complScore;

        // 6. Верификация
        const verScore = executor.isVerified ? 100 : 0;
        breakdown.verified = verScore;

        // 7. Время отклика (демо: рандом 70..100)
        const respScore = 70 + Math.random() * 30;
        breakdown.responseTime = Math.round(respScore);

        // Итого
        let total = 0;
        for (const key in WEIGHTS) {
            total += (breakdown[key] || 0) * WEIGHTS[key];
        }

        return {
            score: Math.round(total),
            breakdown
        };
    }

    /**
     * Нечёткое совпадение категорий
     */
    function _fuzzyCategory(services, category) {
        const related = {
            foundation: ['concrete', 'earthwork'],
            walls: ['masonry', 'finishing'],
            roofing: ['finishing'],
            finishing: ['walls', 'flooring'],
            concrete: ['foundation'],
            plumbing: ['finishing'],
            electrical: ['finishing']
        };
        const rel = related[category] || [];
        for (const s of services) {
            if (rel.includes(s)) return 60;
        }
        return 20; // базовый score — «может взяться»
    }

    // =============================================
    // 2. MATCH API — подбор для заказа
    // =============================================

    /**
     * Найти лучших подрядчиков для заказа
     * @param {string} orderId
     * @param {Object} options - { limit: 5, minScore: 30 }
     * @returns {Object} { success, data: [{ executor, score, breakdown, rank }] }
     */
    function matchForOrder(orderId, options = {}) {
        const { limit = 5, minScore = 30 } = options;
        const ds = window.DataService;

        if (!ds) return { success: false, error: 'DataService не загружен' };

        // Получаем заказ
        const orderResult = ds.Customer.getOrder(orderId);
        if (!orderResult || !orderResult.success) {
            return { success: false, error: 'Заказ не найден' };
        }
        const order = orderResult.data;

        // Получаем всех исполнителей из localStorage
        const executors = _getAllExecutors();

        // Скоринг
        const scored = executors
            .map(exec => ({
                executor: exec,
                ...scoreExecutor(exec, order)
            }))
            .filter(s => s.score >= minScore)
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map((item, idx) => ({ ...item, rank: idx + 1 }));

        return {
            success: true,
            data: scored,
            meta: { total: executors.length, matched: scored.length, orderId }
        };
    }

    /**
     * Получить всех исполнителей (localStorage fallback + демо)
     */
    function _getAllExecutors() {
        const executors = [];

        // Из localStorage
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('executor_profile_')) {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data) executors.push(data);
                }
            }
        } catch (e) { /* ignore */ }

        // Если нет реальных — демо
        if (executors.length === 0) {
            executors.push(
                {
                    userId: 'exec_1', orgName: 'СтройМастер', contactName: 'Иванов Пётр',
                    city: 'Алматы', type: 'company', services: ['foundation', 'walls', 'roofing'],
                    experience: 10, rating: 4.8, reviewsCount: 24, ordersCompleted: 45, isVerified: true
                },
                {
                    userId: 'exec_2', orgName: 'БригадаПро', contactName: 'Сергеев Алексей',
                    city: 'Астана', type: 'brigade', services: ['walls', 'finishing'],
                    experience: 5, rating: 4.5, reviewsCount: 12, ordersCompleted: 28, isVerified: true
                },
                {
                    userId: 'exec_3', orgName: '', contactName: 'Ким Виктор',
                    city: 'Алматы', type: 'individual', services: ['foundation', 'concrete'],
                    experience: 15, rating: 4.9, reviewsCount: 56, ordersCompleted: 120, isVerified: true
                },
                {
                    userId: 'exec_4', orgName: 'РемонтПлюс', contactName: 'Назаров Тимур',
                    city: 'Алматы', type: 'company', services: ['finishing', 'electrical', 'plumbing'],
                    experience: 7, rating: 4.3, reviewsCount: 18, ordersCompleted: 35, isVerified: false
                },
                {
                    userId: 'exec_5', orgName: 'ФундаментКЗ', contactName: 'Касымов Нурлан',
                    city: 'Шымкент', type: 'company', services: ['foundation', 'concrete', 'earthwork'],
                    experience: 12, rating: 4.7, reviewsCount: 41, ordersCompleted: 88, isVerified: true
                }
            );
        }

        return executors;
    }

    // =============================================
    // 3. RENDER — UI виджет подбора
    // =============================================

    /**
     * Отрендерить виджет подбора в контейнер
     * @param {HTMLElement|string} container
     * @param {string} orderId
     */
    function renderMatchWidget(container, orderId) {
        const el = typeof container === 'string' ? document.getElementById(container) : container;
        if (!el) return;

        el.innerHTML = `
            <div style="padding:1.5rem;">
                <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:1.25rem;">
                    <div style="width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#22c55e,#06b6d4);display:flex;align-items:center;justify-content:center;font-size:1.3rem;">🤖</div>
                    <div>
                        <div style="font-weight:700;font-size:1rem;">Авто-подбор подрядчиков</div>
                        <div style="font-size:0.8rem;color:var(--text-muted,#888);">AI анализирует рейтинг, специализацию и опыт</div>
                    </div>
                </div>
                <div id="matchResults" style="min-height:60px;display:flex;align-items:center;justify-content:center;color:var(--text-muted);">
                    ⏳ Подбираем лучших исполнителей...
                </div>
            </div>
        `;

        // Имитация AI-задержки
        setTimeout(() => {
            const result = matchForOrder(orderId);
            _renderResults(document.getElementById('matchResults'), result, orderId);
        }, 800);
    }

    function _renderResults(el, result, orderId) {
        if (!el) return;

        if (!result.success || result.data.length === 0) {
            el.innerHTML = `
                <div style="text-align:center;padding:1.5rem;">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">😔</div>
                    <div style="font-weight:600;">Подрядчики не найдены</div>
                    <div style="font-size:0.82rem;color:var(--text-muted);">Попробуйте расширить параметры заказа</div>
                </div>
            `;
            return;
        }

        el.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:0.75rem;">
                ${result.data.map(item => _renderMatchCard(item)).join('')}
            </div>
            <div style="margin-top:1rem;padding:0.75rem;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:10px;font-size:0.8rem;color:var(--text-muted);">
                💡 Найдено ${result.meta.matched} из ${result.meta.total} подрядчиков. Рейтинг обновляется в реальном времени.
            </div>
        `;
    }

    function _renderMatchCard(item) {
        const exec = item.executor;
        const scoreColor = item.score >= 80 ? '#22c55e' : item.score >= 60 ? '#f59e0b' : '#ef4444';
        const typeLabel = { company: '🏢 Компания', brigade: '👥 Бригада', individual: '👤 Частный' };

        return `
            <div style="display:flex;gap:1rem;padding:0.875rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;align-items:center;transition:all 0.2s ease;"
                 onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                <!-- Rank -->
                <div style="width:32px;height:32px;border-radius:50%;background:${item.rank <= 3 ? `linear-gradient(135deg,${scoreColor},transparent)` : 'rgba(255,255,255,0.06)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;flex-shrink:0;">
                    ${item.rank <= 3 ? ['🥇', '🥈', '🥉'][item.rank - 1] : '#' + item.rank}
                </div>
                <!-- Info -->
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.2rem;">
                        <span style="font-weight:600;font-size:0.9rem;">${exec.orgName || exec.contactName}</span>
                        ${exec.isVerified ? '<span style="font-size:0.7rem;background:rgba(34,197,94,0.15);color:#22c55e;padding:1px 6px;border-radius:4px;">✅ Верифицирован</span>' : ''}
                    </div>
                    <div style="font-size:0.78rem;color:var(--text-muted);display:flex;gap:0.75rem;flex-wrap:wrap;">
                        <span>⭐ ${exec.rating || '—'}</span>
                        <span>🔧 ${exec.experience || 0} лет</span>
                        <span>📦 ${exec.ordersCompleted || 0} заказов</span>
                        <span>📍 ${exec.city || '—'}</span>
                        <span>${typeLabel[exec.type] || ''}</span>
                    </div>
                </div>
                <!-- Score -->
                <div style="text-align:center;flex-shrink:0;">
                    <div style="font-size:1.4rem;font-weight:700;color:${scoreColor};">${item.score}%</div>
                    <div style="font-size:0.65rem;color:var(--text-muted);">совпадение</div>
                </div>
                <!-- Action -->
                <button onclick="window.ContractorMatcher && window.ContractorMatcher.inviteExecutor('${exec.userId}')"
                        style="padding:0.5rem 0.85rem;background:linear-gradient(135deg,#22c55e,#06b6d4);border:none;border-radius:8px;color:#fff;font-size:0.78rem;font-weight:600;cursor:pointer;white-space:nowrap;">
                    📨 Пригласить
                </button>
            </div>
        `;
    }

    // =============================================
    // 4. INVITE — приглашение исполнителя
    // =============================================

    function inviteExecutor(executorId) {
        console.log(`[ContractorMatcher] 📨 Приглашение отправлено: ${executorId}`);
        if (window.showToast) {
            window.showToast('📨 Приглашение отправлено исполнителю!');
        }
    }

    // =============================================
    // 5. EXPORT
    // =============================================

    window.ContractorMatcher = {
        matchForOrder,
        scoreExecutor,
        renderMatchWidget,
        inviteExecutor,
        WEIGHTS
    };

    console.log('[ContractorMatcher] ✅ Auto-match v1.0 loaded');

})();
