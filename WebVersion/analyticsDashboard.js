// ========== ANALYTICS DASHBOARD ==========
// Chart.js дашборд для админа: выручка, активность, CAC, LTV
// Загружает Chart.js с CDN

(function () {
    'use strict';

    let chartJSLoaded = false;
    let charts = {};
    let period = '30d'; // 7d, 30d, 90d, 1y

    // ========== LOAD CHART.JS ==========
    function loadChartJS() {
        return new Promise((resolve, reject) => {
            if (window.Chart) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js';
            s.onload = () => { chartJSLoaded = true; resolve(); };
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    // ========== DEMO DATA GENERATORS ==========
    function getDays(n) {
        const days = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now); d.setDate(d.getDate() - i);
            days.push(d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
        }
        return days;
    }

    function getMonths(n) {
        const months = [];
        const now = new Date();
        for (let i = n - 1; i >= 0; i--) {
            const d = new Date(now); d.setMonth(d.getMonth() - i);
            months.push(d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }));
        }
        return months;
    }

    function randomSeries(n, min, max) {
        return Array.from({ length: n }, () => min + Math.random() * (max - min));
    }

    function cumulative(arr) {
        let sum = 0;
        return arr.map(v => { sum += v; return Math.round(sum); });
    }

    function getPeriodConfig() {
        switch (period) {
            case '7d': return { labels: getDays(7), n: 7 };
            case '30d': return { labels: getDays(30), n: 30 };
            case '90d': return { labels: getDays(90), n: 90 };
            case '1y': return { labels: getMonths(12), n: 12 };
            default: return { labels: getDays(30), n: 30 };
        }
    }

    // ========== KPI CALCULATIONS ==========
    function getKPIs() {
        const nDays = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
        const baseRevenue = 1250000 + Math.random() * 500000;
        const revenue = Math.round(baseRevenue * (nDays / 30));
        const prevRevenue = Math.round(revenue * (0.85 + Math.random() * 0.2));
        const users = Math.round(45 + Math.random() * 30 + nDays * 0.5);
        const prevUsers = Math.round(users * 0.88);
        const estimates = Math.round(120 + Math.random() * 80 + nDays * 2);
        const cac = Math.round(3500 + Math.random() * 2000);
        const ltv = Math.round(cac * (3 + Math.random() * 2));
        const arpu = Math.round(revenue / users);
        const churn = +(2 + Math.random() * 5).toFixed(1);

        return [
            { label: 'Выручка', value: `${(revenue / 1000000).toFixed(2)}M ₸`, change: `+${((revenue / prevRevenue - 1) * 100).toFixed(1)}%`, up: revenue > prevRevenue, icon: '💰', color: '#10b981' },
            { label: 'Пользователи', value: users.toString(), change: `+${users - prevUsers}`, up: true, icon: '👥', color: '#3b82f6' },
            { label: 'Смет создано', value: estimates.toString(), change: `+${Math.round(estimates * 0.12)}`, up: true, icon: '📊', color: '#8b5cf6' },
            { label: 'CAC', value: `${cac.toLocaleString('ru-RU')} ₸`, change: '-5.2%', up: false, icon: '🎯', color: '#f59e0b' },
            { label: 'LTV', value: `${ltv.toLocaleString('ru-RU')} ₸`, change: '+12.3%', up: true, icon: '💎', color: '#ec4899' },
            { label: 'ARPU', value: `${arpu.toLocaleString('ru-RU')} ₸`, change: '+3.1%', up: true, icon: '📈', color: '#06b6d4' },
            { label: 'Churn Rate', value: `${churn}%`, change: '-0.8%', up: false, icon: '📉', color: '#ef4444' },
            { label: 'LTV/CAC', value: (ltv / cac).toFixed(1), change: '+0.3', up: true, icon: '⚡', color: '#22c55e' }
        ];
    }

    // ========== RECENT ACTIVITY DATA ==========
    function getRecentActivity() {
        const activities = [
            { user: 'Асан Б.', action: 'Создал смету', module: 'Фундамент', amount: '485 000 ₸', time: '5 мин', status: 'active' },
            { user: 'Мария К.', action: 'Оплата', module: 'Подписка', amount: '20 000 ₸', time: '12 мин', status: 'active' },
            { user: 'Тимур Н.', action: 'Регистрация', module: '—', amount: '—', time: '18 мин', status: 'active' },
            { user: 'Алибек С.', action: 'Экспорт PDF', module: 'Кровля', amount: '1 230 000 ₸', time: '25 мин', status: 'active' },
            { user: 'Дарья В.', action: 'AI-анализ фото', module: 'Стена', amount: '—', time: '32 мин', status: 'pending' },
            { user: 'Рустам Г.', action: 'Создал заказ', module: 'VIP', amount: '3 500 000 ₸', time: '1 ч', status: 'active' },
            { user: 'Елена П.', action: 'Запрос к ИИ', module: 'Инженер', amount: '—', time: '1.5 ч', status: 'pending' },
            { user: 'Канат М.', action: 'Подписка истекла', module: '—', amount: '—', time: '3 ч', status: 'inactive' },
        ];
        return activities;
    }

    // ========== RENDER ==========
    function render() {
        let overlay = document.querySelector('.analytics-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'analytics-overlay';
            document.body.appendChild(overlay);
        }

        const kpis = getKPIs();
        const activities = getRecentActivity();

        overlay.innerHTML = `
            <div class="analytics-header">
                <h2>📊 Аналитика платформы</h2>
                <button class="analytics-close" onclick="AnalyticsDashboard.close()">✕</button>
            </div>

            <div class="analytics-period">
                ${['7d', '30d', '90d', '1y'].map(p =>
            `<button class="analytics-period-btn ${p === period ? 'active' : ''}" onclick="AnalyticsDashboard._setPeriod('${p}')">
                        ${p === '7d' ? '7 дней' : p === '30d' ? '30 дней' : p === '90d' ? '90 дней' : '1 год'}
                    </button>`
        ).join('')}
            </div>

            <div class="analytics-content">
                <!-- KPI Cards -->
                <div class="analytics-kpi-row">
                    ${kpis.map(k => `
                        <div class="analytics-kpi-card" style="--kpi-color: ${k.color}">
                            <div class="kpi-label">${k.label}</div>
                            <div class="kpi-value">${k.value}</div>
                            <span class="kpi-change ${k.up ? 'up' : 'down'}">${k.up ? '↑' : '↓'} ${k.change}</span>
                            <span class="kpi-icon">${k.icon}</span>
                        </div>
                    `).join('')}
                </div>

                <!-- Charts -->
                <div class="analytics-charts-grid">
                    <div class="analytics-chart-card full">
                        <div class="chart-title">💰 Выручка</div>
                        <div class="chart-wrap"><canvas id="chartRevenue"></canvas></div>
                    </div>
                    <div class="analytics-chart-card">
                        <div class="chart-title">👥 Активные пользователи</div>
                        <div class="chart-wrap"><canvas id="chartUsers"></canvas></div>
                    </div>
                    <div class="analytics-chart-card">
                        <div class="chart-title">📊 Сметы по типу</div>
                        <div class="chart-wrap"><canvas id="chartEstimateTypes"></canvas></div>
                    </div>
                    <div class="analytics-chart-card">
                        <div class="chart-title">🗺️ Регионы</div>
                        <div class="chart-wrap"><canvas id="chartRegions"></canvas></div>
                    </div>
                    <div class="analytics-chart-card">
                        <div class="chart-title">💎 LTV vs CAC</div>
                        <div class="chart-wrap"><canvas id="chartLtvCac"></canvas></div>
                    </div>
                </div>

                <!-- Activity table -->
                <div class="analytics-table-wrap">
                    <div class="analytics-table-header">
                        <h4>🕐 Недавняя активность</h4>
                    </div>
                    <table class="analytics-table">
                        <thead><tr><th>Пользователь</th><th>Действие</th><th>Модуль</th><th>Сумма</th><th>Время</th><th>Статус</th></tr></thead>
                        <tbody>
                            ${activities.map(a => `
                                <tr>
                                    <td><strong>${a.user}</strong></td>
                                    <td>${a.action}</td>
                                    <td>${a.module}</td>
                                    <td>${a.amount}</td>
                                    <td>${a.time}</td>
                                    <td><span class="status-badge ${a.status}">${a.status === 'active' ? 'Актив' : a.status === 'pending' ? 'Ожид.' : 'Неакт.'}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <div class="analytics-export">
                    <button class="analytics-export-btn" onclick="AnalyticsDashboard._exportCSV()">📥 CSV</button>
                    <button class="analytics-export-btn" onclick="AnalyticsDashboard._exportPDF()">📄 PDF</button>
                </div>
            </div>
        `;

        initCharts();
    }

    // ========== INIT CHARTS ==========
    async function initCharts() {
        try {
            await loadChartJS();
        } catch (e) {
            console.error('Chart.js load failed:', e);
            return;
        }

        const Chart = window.Chart;
        const cfg = getPeriodConfig();

        // Destroy existing
        Object.values(charts).forEach(c => c?.destroy?.());
        charts = {};

        // Default chart style
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.borderColor = 'rgba(148,163,184,0.08)';
        Chart.defaults.font.family = 'Inter, sans-serif';

        // Revenue chart
        const revCtx = document.getElementById('chartRevenue')?.getContext('2d');
        if (revCtx) {
            const grad = revCtx.createLinearGradient(0, 0, 0, 260);
            grad.addColorStop(0, 'rgba(16,185,129,0.3)');
            grad.addColorStop(1, 'rgba(16,185,129,0)');
            charts.revenue = new Chart(revCtx, {
                type: 'line',
                data: {
                    labels: cfg.labels,
                    datasets: [{
                        label: 'Выручка (₸)',
                        data: randomSeries(cfg.n, 30000, 120000),
                        borderColor: '#10b981', borderWidth: 2,
                        backgroundColor: grad, fill: true,
                        tension: 0.4, pointRadius: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => (v / 1000).toFixed(0) + 'k' } } } }
            });
        }

        // Users chart
        const usrCtx = document.getElementById('chartUsers')?.getContext('2d');
        if (usrCtx) {
            charts.users = new Chart(usrCtx, {
                type: 'bar',
                data: {
                    labels: cfg.labels,
                    datasets: [{
                        label: 'DAU',
                        data: randomSeries(cfg.n, 10, 60).map(Math.round),
                        backgroundColor: 'rgba(59,130,246,0.6)',
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
            });
        }

        // Estimate types (doughnut)
        const typeCtx = document.getElementById('chartEstimateTypes')?.getContext('2d');
        if (typeCtx) {
            charts.types = new Chart(typeCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Фундамент', 'Стены', 'Кровля', 'Отделка', 'Проёмы', 'Другое'],
                    datasets: [{
                        data: [35, 25, 15, 12, 8, 5],
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#06b6d4', '#64748b'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 10 } } } }
            });
        }

        // Regions (horizontal bar)
        const regCtx = document.getElementById('chartRegions')?.getContext('2d');
        if (regCtx) {
            charts.regions = new Chart(regCtx, {
                type: 'bar',
                data: {
                    labels: ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Атырау', 'Актобе'],
                    datasets: [{
                        label: 'Смет',
                        data: [120, 85, 45, 35, 28, 20],
                        backgroundColor: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
                        borderRadius: 6
                    }]
                },
                options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }

        // LTV vs CAC (bar + line)
        const ltvCtx = document.getElementById('chartLtvCac')?.getContext('2d');
        if (ltvCtx) {
            const months = getMonths(6);
            charts.ltvcac = new Chart(ltvCtx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        { label: 'LTV', data: [12000, 14500, 15200, 16800, 18000, 19500], backgroundColor: 'rgba(16,185,129,0.6)', borderRadius: 4 },
                        { label: 'CAC', data: [4500, 4200, 3800, 3600, 3500, 3200], backgroundColor: 'rgba(239,68,68,0.6)', borderRadius: 4 }
                    ]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { boxWidth: 12 } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => (v / 1000).toFixed(0) + 'k' } } } }
            });
        }
    }

    // ========== PUBLIC API ==========
    window.AnalyticsDashboard = {
        open() {
            period = '30d';
            render();
        },

        close() {
            Object.values(charts).forEach(c => c?.destroy?.());
            charts = {};
            document.querySelector('.analytics-overlay')?.remove();
        },

        _setPeriod(p) {
            period = p;
            render();
        },

        _exportCSV() {
            const kpis = getKPIs();
            let csv = 'Метрика,Значение,Изменение\n';
            kpis.forEach(k => { csv += `${k.label},${k.value},${k.change}\n`; });
            const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `analytics_${new Date().toISOString().slice(0, 10)}.csv`;
            a.click(); URL.revokeObjectURL(url);
        },

        _exportPDF() {
            if (window.jspdf?.jsPDF) {
                const doc = new window.jspdf.jsPDF();
                doc.setFontSize(18);
                doc.text('QazGost AI — Analytics Report', 14, 20);
                doc.setFontSize(10);
                doc.text(`Generated: ${new Date().toLocaleString('ru-RU')} | Period: ${period}`, 14, 28);
                const kpis = getKPIs();
                let y = 40;
                kpis.forEach(k => {
                    doc.text(`${k.label}: ${k.value} (${k.change})`, 14, y);
                    y += 8;
                });
                doc.save(`analytics_${new Date().toISOString().slice(0, 10)}.pdf`);
            } else {
                (window.QazUI?.alert || window.alert)('Экспорт PDF', 'jsPDF не загружен. Попробуйте позже.', { icon: '📄' });
            }
        }
    };

    console.log('✅ AnalyticsDashboard module loaded');
})();
