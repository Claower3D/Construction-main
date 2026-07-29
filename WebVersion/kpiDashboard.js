// ========================================
// KPI DASHBOARD MODULE v1.0
// Базовый дашборд ключевых показателей
// ========================================
(function () {
    'use strict';

    // =============================================
    // 1. KPI ENGINE — расчёт метрик
    // =============================================

    function computeKPIs() {
        const ds = window.DataService;
        const kpis = {
            orders: { total: 0, active: 0, completed: 0, cancelled: 0, avgBudget: 0, conversionRate: 0 },
            executors: { total: 0, verified: 0, avgRating: 0, avgResponseTime: '~2ч' },
            finance: { totalRevenue: 0, avgOrderValue: 0, commissionEarned: 0 },
            platform: { activeUsers: 0, registrations: 0, aiRequests: 0, uptime: 99.7 },
            trends: []
        };

        // Сбор данных из DataService
        if (ds) {
            try {
                // Orders
                const cust = ds.Customer;
                if (cust && cust.getOrders) {
                    const res = cust.getOrders();
                    if (res && res.success) {
                        const orders = res.data || [];
                        kpis.orders.total = orders.length;
                        kpis.orders.active = orders.filter(o => ['published', 'in_work'].includes(o.status)).length;
                        kpis.orders.completed = orders.filter(o => o.status === 'done' || o.status === 'completed').length;
                        kpis.orders.cancelled = orders.filter(o => o.status === 'cancelled').length;
                        const budgets = orders.map(o => o.budget || o.budgetMax || 0).filter(b => b > 0);
                        kpis.orders.avgBudget = budgets.length ? Math.round(budgets.reduce((s, b) => s + b, 0) / budgets.length) : 0;
                        kpis.orders.conversionRate = kpis.orders.total > 0 ? Math.round((kpis.orders.completed / kpis.orders.total) * 100) : 0;
                    }
                }

                // Finance — from completed orders
                kpis.finance.totalRevenue = kpis.orders.completed * (kpis.orders.avgBudget || 250000);
                kpis.finance.avgOrderValue = kpis.orders.avgBudget || 250000;
                kpis.finance.commissionEarned = Math.round(kpis.finance.totalRevenue * 0.03);
            } catch (e) {
                console.warn('[KPIDashboard] DataService error:', e);
            }
        }

        // Demo enrichment
        if (kpis.orders.total === 0) {
            kpis.orders = { total: 47, active: 12, completed: 28, cancelled: 3, avgBudget: 385000, conversionRate: 60 };
            kpis.executors = { total: 23, verified: 15, avgRating: 4.6, avgResponseTime: '~1.5ч' };
            kpis.finance = { totalRevenue: 10780000, avgOrderValue: 385000, commissionEarned: 323400 };
            kpis.platform = { activeUsers: 156, registrations: 38, aiRequests: 1247, uptime: 99.7 };
        }

        // Trends (demo — last 7 days)
        kpis.trends = _generateTrends();

        return kpis;
    }

    function _generateTrends() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            days.push({
                date: d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                orders: Math.floor(3 + Math.random() * 8),
                revenue: Math.floor(200000 + Math.random() * 600000),
                users: Math.floor(10 + Math.random() * 30)
            });
        }
        return days;
    }

    // =============================================
    // 2. RENDER — отрисовка дашборда
    // =============================================

    function render(containerId) {
        const el = document.getElementById(containerId);
        if (!el) return;
        const kpis = computeKPIs();
        const fmt = v => new Intl.NumberFormat('ru-KZ').format(v);

        el.innerHTML = `
        <div class="tool-page" style="max-width:1200px;margin:0 auto;">
            <div class="tool-header">
                <button class="back-btn" onclick="goBack()">←</button>
                <div class="tool-title">
                    <div class="tool-title-icon" style="background:linear-gradient(135deg,#8b5cf6,#ec4899)">📊</div>
                    KPI Dashboard
                </div>
            </div>

            <!-- Summary Cards -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin-bottom:1.5rem;">
                ${_card('📋', 'Заказы', kpis.orders.total, '+' + kpis.orders.active + ' активных', '#8b5cf6')}
                ${_card('✅', 'Выполнено', kpis.orders.completed, kpis.orders.conversionRate + '% конверсия', '#22c55e')}
                ${_card('💰', 'Выручка', fmt(kpis.finance.totalRevenue) + ' ₸', 'Ø ' + fmt(kpis.finance.avgOrderValue) + ' ₸', '#f59e0b')}
                ${_card('🔧', 'Исполнители', kpis.executors.total, kpis.executors.verified + ' верифицировано', '#06b6d4')}
            </div>

            <!-- Charts Row -->
            <div style="display:grid;grid-template-columns:2fr 1fr;gap:1rem;margin-bottom:1.5rem;">
                <!-- Bar Chart — Orders by day -->
                <div class="card" style="padding:1.25rem;">
                    <div style="font-weight:700;margin-bottom:1rem;display:flex;align-items:center;gap:0.5rem;">
                        <span>📈 Заказы за неделю</span>
                    </div>
                    <div style="display:flex;align-items:flex-end;gap:0.5rem;height:140px;">
                        ${kpis.trends.map(t => {
            const h = Math.max(15, (t.orders / 12) * 120);
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">' +
                '<span style="font-size:0.7rem;font-weight:600;">' + t.orders + '</span>' +
                '<div style="width:100%;height:' + h + 'px;background:linear-gradient(180deg,#8b5cf6,#6366f1);border-radius:6px 6px 2px 2px;transition:height 0.5s ease;"></div>' +
                '<span style="font-size:0.65rem;color:var(--text-muted);">' + t.date + '</span></div>';
        }).join('')}
                    </div>
                </div>
                <!-- Donut stats -->
                <div class="card" style="padding:1.25rem;">
                    <div style="font-weight:700;margin-bottom:1rem;">📊 Статус заказов</div>
                    ${_donutStats(kpis)}
                </div>
            </div>

            <!-- Bottom Row -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1rem;">
                <!-- Platform Stats -->
                <div class="card" style="padding:1.25rem;">
                    <div style="font-weight:700;margin-bottom:1rem;">🖥️ Платформа</div>
                    <div style="display:flex;flex-direction:column;gap:0.75rem;">
                        ${_statRow('👥 Активных пользователей', kpis.platform.activeUsers)}
                        ${_statRow('📝 Регистрации (мес)', kpis.platform.registrations)}
                        ${_statRow('🤖 AI-запросы', kpis.platform.aiRequests)}
                        ${_statRow('⏱️ Uptime', kpis.platform.uptime + '%')}
                        ${_statRow('⭐ Средний рейтинг', kpis.executors.avgRating)}
                        ${_statRow('⏳ Время отклика', kpis.executors.avgResponseTime)}
                    </div>
                </div>
                <!-- Finance -->
                <div class="card" style="padding:1.25rem;">
                    <div style="font-weight:700;margin-bottom:1rem;">💳 Финансы</div>
                    <div style="display:flex;flex-direction:column;gap:0.75rem;">
                        ${_statRow('💰 Общая выручка', fmt(kpis.finance.totalRevenue) + ' ₸')}
                        ${_statRow('📊 Средний чек', fmt(kpis.finance.avgOrderValue) + ' ₸')}
                        ${_statRow('🏦 Комиссия (3%)', fmt(kpis.finance.commissionEarned) + ' ₸')}
                        ${_statRow('❌ Отменено', kpis.orders.cancelled + ' заказов')}
                    </div>
                    <div style="margin-top:1rem;padding:0.75rem;background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.2);border-radius:10px;">
                        <div style="font-size:0.8rem;font-weight:600;margin-bottom:0.3rem;">🎯 Цель месяца</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem;">Выручка: 15 000 000 ₸</div>
                        <div style="height:8px;background:rgba(255,255,255,0.06);border-radius:4px;overflow:hidden;">
                            <div style="height:100%;width:${Math.min(100, Math.round(kpis.finance.totalRevenue / 15000000 * 100))}%;background:linear-gradient(90deg,#8b5cf6,#22c55e);border-radius:4px;transition:width 1s ease;"></div>
                        </div>
                        <div style="font-size:0.7rem;color:var(--text-muted);margin-top:0.3rem;text-align:right;">${Math.round(kpis.finance.totalRevenue / 15000000 * 100)}%</div>
                    </div>
                </div>
            </div>
        </div>
        `;
    }

    function _card(icon, label, value, sub, color) {
        return '<div class="card" style="padding:1.25rem;border-left:3px solid ' + color + ';">' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;">' +
            '<div><div style="font-size:0.78rem;color:var(--text-muted);margin-bottom:0.3rem;">' + label + '</div>' +
            '<div style="font-size:1.6rem;font-weight:700;">' + value + '</div>' +
            '<div style="font-size:0.75rem;color:' + color + ';margin-top:0.2rem;">' + sub + '</div></div>' +
            '<div style="font-size:1.8rem;">' + icon + '</div></div></div>';
    }

    function _donutStats(kpis) {
        const items = [
            { label: 'Активные', value: kpis.orders.active, color: '#8b5cf6' },
            { label: 'Выполнены', value: kpis.orders.completed, color: '#22c55e' },
            { label: 'Отменены', value: kpis.orders.cancelled, color: '#ef4444' },
            { label: 'Черновики', value: Math.max(0, kpis.orders.total - kpis.orders.active - kpis.orders.completed - kpis.orders.cancelled), color: '#6b7280' }
        ];
        return '<div style="display:flex;flex-direction:column;gap:0.6rem;">' +
            items.map(i => {
                const pct = kpis.orders.total > 0 ? Math.round(i.value / kpis.orders.total * 100) : 0;
                return '<div>' +
                    '<div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:0.25rem;">' +
                    '<span style="color:var(--text-muted);">' + i.label + '</span><span style="font-weight:600;">' + i.value + ' (' + pct + '%)</span></div>' +
                    '<div style="height:6px;background:rgba(255,255,255,0.06);border-radius:3px;overflow:hidden;">' +
                    '<div style="height:100%;width:' + pct + '%;background:' + i.color + ';border-radius:3px;transition:width 0.8s ease;"></div></div></div>';
            }).join('') + '</div>';
    }

    function _statRow(label, value) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem 0;border-bottom:1px solid rgba(255,255,255,0.04);">' +
            '<span style="font-size:0.82rem;color:var(--text-muted);">' + label + '</span>' +
            '<span style="font-size:0.88rem;font-weight:600;">' + value + '</span></div>';
    }

    // =============================================
    // 3. EXPORT
    // =============================================

    window.KPIDashboard = {
        computeKPIs,
        render,
    };

    console.log('[KPIDashboard] ✅ KPI Dashboard v1.0 loaded');
})();
