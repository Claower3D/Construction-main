// ========================================
// LIVE CONSTRUCTION TRACKER v1.0
// Мониторинг стройки в реальном времени
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. STATE
    // =============================================

    let _container = null;
    let _projectId = null;
    let _projectData = null;
    let _refreshInterval = null;

    // =============================================
    // 2. DATA ACCESS
    // =============================================

    function _getProjectData(projectId) {
        // Try real data first
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        const order = orders.find(o => o.id === projectId);

        if (order) {
            return _normalizeOrder(order);
        }

        // Demo data fallback
        return _generateDemoProject(projectId);
    }

    function _normalizeOrder(order) {
        const stages = order.stages || [];
        const completedStages = stages.filter(s => s.status === 'completed' || s.status === 'accepted');
        const totalBudget = order.contractAmountKZT || order.estimatedCost || 500000;
        const spentBudget = completedStages.reduce((sum, s) => sum + (s.cost || 0), 0);

        return {
            id: order.id,
            title: order.title || 'Строительный проект',
            address: order.address || 'Алматы, Казахстан',
            status: order.status || 'in_progress',
            startDate: order.createdAt || new Date().toISOString(),
            endDate: order.deadlineDate || _addDays(new Date(), 30).toISOString(),
            totalBudget,
            spentBudget,
            progress: stages.length > 0 ? Math.round((completedStages.length / stages.length) * 100) : 0,
            stages: stages.map((s, i) => ({
                id: s.id || `stage_${i}`,
                name: s.name || `Этап ${i + 1}`,
                status: s.status || 'pending',
                progress: s.status === 'completed' ? 100 : s.status === 'in_progress' ? 50 : 0,
                cost: s.cost || 0,
                startDate: s.startDate,
                endDate: s.endDate
            })),
            photoReports: _getPhotoReports(order.id),
            workers: order.workers || _generateDemoWorkers(),
            weather: _getWeather()
        };
    }

    function _generateDemoProject(projectId) {
        const now = new Date();
        return {
            id: projectId || 'demo_project_1',
            title: 'Строительство жилого дома «Комфорт»',
            address: 'Алматы, мкр. Алатау, ул. Строителей 42',
            status: 'in_progress',
            startDate: _addDays(now, -45).toISOString(),
            endDate: _addDays(now, 75).toISOString(),
            totalBudget: 12500000,
            spentBudget: 4875000,
            progress: 39,
            stages: [
                { id: 's1', name: 'Подготовка площадки', status: 'completed', progress: 100, cost: 450000, startDate: _addDays(now, -45).toISOString(), endDate: _addDays(now, -38).toISOString() },
                { id: 's2', name: 'Земляные работы', status: 'completed', progress: 100, cost: 1200000, startDate: _addDays(now, -37).toISOString(), endDate: _addDays(now, -25).toISOString() },
                { id: 's3', name: 'Фундамент', status: 'completed', progress: 100, cost: 2500000, startDate: _addDays(now, -24).toISOString(), endDate: _addDays(now, -10).toISOString() },
                { id: 's4', name: 'Стены первого этажа', status: 'in_progress', progress: 65, cost: 725000, startDate: _addDays(now, -9).toISOString(), endDate: _addDays(now, 5).toISOString() },
                { id: 's5', name: 'Перекрытие', status: 'pending', progress: 0, cost: 0, startDate: _addDays(now, 6).toISOString(), endDate: _addDays(now, 18).toISOString() },
                { id: 's6', name: 'Стены второго этажа', status: 'pending', progress: 0, cost: 0, startDate: _addDays(now, 19).toISOString(), endDate: _addDays(now, 35).toISOString() },
                { id: 's7', name: 'Кровля', status: 'pending', progress: 0, cost: 0, startDate: _addDays(now, 36).toISOString(), endDate: _addDays(now, 50).toISOString() },
                { id: 's8', name: 'Инженерные сети', status: 'pending', progress: 0, cost: 0, startDate: _addDays(now, 45).toISOString(), endDate: _addDays(now, 65).toISOString() },
                { id: 's9', name: 'Отделка', status: 'pending', progress: 0, cost: 0, startDate: _addDays(now, 55).toISOString(), endDate: _addDays(now, 75).toISOString() }
            ],
            photoReports: [
                { id: 'pr1', date: _addDays(now, -40).toISOString(), title: 'Разметка участка', description: 'Выполнена геодезическая разметка', photos: 3, author: 'Прораб Серик' },
                { id: 'pr2', date: _addDays(now, -30).toISOString(), title: 'Котлован готов', description: 'Экскаватор завершил работу, глубина 1.8м', photos: 5, author: 'Прораб Серик' },
                { id: 'pr3', date: _addDays(now, -15).toISOString(), title: 'Заливка фундамента', description: 'Бетон М300 залит, вибрирование выполнено', photos: 8, author: 'Прораб Серик' },
                { id: 'pr4', date: _addDays(now, -5).toISOString(), title: 'Кладка стен 1 этажа', description: 'Начата кладка газоблоком 400мм', photos: 4, author: 'Каменщик Бауржан' },
                { id: 'pr5', date: _addDays(now, -1).toISOString(), title: 'Прогресс стен', description: 'Высота стен 1.8м, оконные проёмы заложены', photos: 6, author: 'Прораб Серик' }
            ],
            workers: _generateDemoWorkers(),
            weather: _getWeather()
        };
    }

    function _getPhotoReports(orderId) {
        const reports = JSON.parse(localStorage.getItem(`photo_reports_${orderId}`) || '[]');
        if (reports.length > 0) return reports;
        return [];
    }

    function _generateDemoWorkers() {
        return [
            { name: 'Серик Ахметов', role: 'Прораб', status: 'active', avatar: '👷' },
            { name: 'Бауржан Касымов', role: 'Каменщик', status: 'active', avatar: '🧱' },
            { name: 'Даулет Сериков', role: 'Бетонщик', status: 'active', avatar: '🏗️' },
            { name: 'Арман Нурланов', role: 'Электрик', status: 'pending', avatar: '⚡' },
            { name: 'Талгат Ибрагимов', role: 'Водитель', status: 'active', avatar: '🚛' }
        ];
    }

    function _getWeather() {
        const conditions = ['☀️ Ясно +5°C', '⛅ Облачно +3°C', '🌤️ Переменная облачность +4°C', '❄️ Снег -2°C'];
        return {
            current: conditions[Math.floor(Math.random() * conditions.length)],
            forecast: 'Завтра: ☁️ Облачно +2°C, без осадков'
        };
    }

    // =============================================
    // 3. UTILITIES
    // =============================================

    function _addDays(date, days) {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    }

    function _formatMoney(amount) {
        return new Intl.NumberFormat('ru-KZ').format(Math.round(amount)) + ' ₸';
    }

    function _formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-KZ', { day: 'numeric', month: 'short' });
    }

    function _formatFullDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('ru-KZ', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function _timeAgo(dateStr) {
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 60) return `${mins} мин назад`;
        if (hours < 24) return `${hours}ч назад`;
        if (days < 7) return `${days} дн назад`;
        return _formatDate(dateStr);
    }

    function _getDaysLeft(endDate) {
        const end = new Date(endDate);
        const now = new Date();
        return Math.ceil((end - now) / 86400000);
    }

    function _getStatusColor(status) {
        const colors = {
            completed: '#22c55e',
            accepted: '#22c55e',
            in_progress: '#3b82f6',
            pending: '#6b7280',
            delayed: '#ef4444',
            on_hold: '#f59e0b'
        };
        return colors[status] || '#6b7280';
    }

    function _getStatusLabel(status) {
        const labels = {
            completed: 'Завершён',
            accepted: 'Принят',
            in_progress: 'В работе',
            pending: 'Ожидает',
            delayed: 'Задержка',
            on_hold: 'Приостановлен'
        };
        return labels[status] || status;
    }

    // =============================================
    // 4. CIRCULAR PROGRESS CHART (SVG)
    // =============================================

    function _renderCircularProgress(progress, size = 180) {
        const radius = (size - 20) / 2;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (progress / 100) * circumference;
        const center = size / 2;

        let color = '#3b82f6';
        if (progress >= 75) color = '#22c55e';
        else if (progress >= 40) color = '#f59e0b';

        return `
            <div class="tracker-circular" style="width:${size}px;height:${size}px;">
                <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
                    <circle cx="${center}" cy="${center}" r="${radius}"
                        fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10"/>
                    <circle cx="${center}" cy="${center}" r="${radius}"
                        fill="none" stroke="${color}" stroke-width="10"
                        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
                        stroke-linecap="round"
                        transform="rotate(-90 ${center} ${center})"
                        style="transition: stroke-dashoffset 1.5s ease-in-out;"/>
                </svg>
                <div class="tracker-circular-text">
                    <span class="tracker-circular-value" style="color:${color};">${progress}%</span>
                    <span class="tracker-circular-label">выполнено</span>
                </div>
            </div>
        `;
    }

    // =============================================
    // 5. BUDGET BAR CHART
    // =============================================

    function _renderBudgetChart(spent, total) {
        const pct = Math.min(100, Math.round((spent / total) * 100));
        const isOver = pct > 85;

        return `
            <div class="tracker-budget">
                <div class="tracker-budget-header">
                    <span class="tracker-budget-title">💰 Бюджет</span>
                    <span class="tracker-budget-pct ${isOver ? 'over' : ''}">${pct}% использовано</span>
                </div>
                <div class="tracker-budget-bar-bg">
                    <div class="tracker-budget-bar-fill ${isOver ? 'over' : ''}" style="width:${pct}%;">
                        <div class="tracker-budget-bar-glow"></div>
                    </div>
                </div>
                <div class="tracker-budget-legend">
                    <div class="tracker-budget-item">
                        <span class="tracker-budget-dot plan"></span>
                        <span>План: ${_formatMoney(total)}</span>
                    </div>
                    <div class="tracker-budget-item">
                        <span class="tracker-budget-dot spent"></span>
                        <span>Факт: ${_formatMoney(spent)}</span>
                    </div>
                    <div class="tracker-budget-item">
                        <span class="tracker-budget-dot remain"></span>
                        <span>Остаток: ${_formatMoney(total - spent)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // 6. STAGES PROGRESS
    // =============================================

    function _renderStages(stages) {
        return `
            <div class="tracker-stages">
                <div class="tracker-section-header">
                    <h3>📋 Этапы работ</h3>
                    <span class="tracker-stage-counter">${stages.filter(s => s.status === 'completed').length}/${stages.length}</span>
                </div>
                <div class="tracker-stages-list">
                    ${stages.map((s, i) => `
                        <div class="tracker-stage ${s.status}" data-stage-id="${s.id}">
                            <div class="tracker-stage-indicator">
                                <div class="tracker-stage-num ${s.status}">
                                    ${s.status === 'completed' ? '✓' : i + 1}
                                </div>
                                ${i < stages.length - 1 ? '<div class="tracker-stage-line ' + (s.status === 'completed' ? 'done' : '') + '"></div>' : ''}
                            </div>
                            <div class="tracker-stage-content">
                                <div class="tracker-stage-row">
                                    <span class="tracker-stage-name">${s.name}</span>
                                    <span class="tracker-stage-badge ${s.status}">${_getStatusLabel(s.status)}</span>
                                </div>
                                ${s.status === 'in_progress' ? `
                                    <div class="tracker-stage-progress-bar">
                                        <div class="tracker-stage-progress-fill" style="width:${s.progress}%"></div>
                                    </div>
                                    <div class="tracker-stage-meta">
                                        <span>${s.progress}%</span>
                                        <span>${_formatDate(s.startDate)} — ${_formatDate(s.endDate)}</span>
                                    </div>
                                ` : s.status === 'completed' ? `
                                    <div class="tracker-stage-meta">
                                        <span>${_formatMoney(s.cost)}</span>
                                        <span>${_formatDate(s.startDate)} — ${_formatDate(s.endDate)}</span>
                                    </div>
                                ` : `
                                    <div class="tracker-stage-meta">
                                        <span>Запланировано</span>
                                        <span>${_formatDate(s.startDate)} — ${_formatDate(s.endDate)}</span>
                                    </div>
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // =============================================
    // 7. PHOTO TIMELINE
    // =============================================

    function _renderPhotoTimeline(reports) {
        if (!reports || reports.length === 0) {
            return `
                <div class="tracker-photos">
                    <div class="tracker-section-header">
                        <h3>📸 Фото-отчёты</h3>
                    </div>
                    <div class="tracker-empty">
                        <span>📷</span>
                        <p>Нет фото-отчётов</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="tracker-photos">
                <div class="tracker-section-header">
                    <h3>📸 Фото-отчёты</h3>
                    <span class="tracker-photos-count">${reports.length} отчётов</span>
                </div>
                <div class="tracker-timeline">
                    ${reports.map((r, i) => `
                        <div class="tracker-timeline-item ${i === 0 ? 'latest' : ''}">
                            <div class="tracker-timeline-dot ${i === 0 ? 'pulse' : ''}"></div>
                            <div class="tracker-timeline-card">
                                <div class="tracker-timeline-header">
                                    <span class="tracker-timeline-date">${_timeAgo(r.date)}</span>
                                    <span class="tracker-timeline-photos">📷 ${r.photos} фото</span>
                                </div>
                                <h4 class="tracker-timeline-title">${r.title}</h4>
                                <p class="tracker-timeline-desc">${r.description}</p>
                                <span class="tracker-timeline-author">— ${r.author}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // =============================================
    // 8. TEAM & WEATHER WIDGETS
    // =============================================

    function _renderTeamWidget(workers) {
        const active = workers.filter(w => w.status === 'active').length;
        return `
            <div class="tracker-widget">
                <div class="tracker-section-header">
                    <h3>👥 Бригада</h3>
                    <span class="tracker-team-active">${active}/${workers.length} на объекте</span>
                </div>
                <div class="tracker-team-list">
                    ${workers.map(w => `
                        <div class="tracker-team-member ${w.status}">
                            <span class="tracker-team-avatar">${w.avatar}</span>
                            <div class="tracker-team-info">
                                <span class="tracker-team-name">${w.name}</span>
                                <span class="tracker-team-role">${w.role}</span>
                            </div>
                            <span class="tracker-team-status ${w.status}">
                                ${w.status === 'active' ? '🟢' : '⏳'}
                            </span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function _renderWeatherWidget(weather) {
        return `
            <div class="tracker-widget tracker-weather">
                <div class="tracker-section-header">
                    <h3>🌤️ Погода на объекте</h3>
                </div>
                <div class="tracker-weather-current">${weather.current}</div>
                <div class="tracker-weather-forecast">${weather.forecast}</div>
            </div>
        `;
    }

    // =============================================
    // 9. MAIN RENDER
    // =============================================

    function open(container, projectId) {
        if (typeof container === 'string') {
            _container = document.getElementById(container) || document.querySelector(container);
        } else {
            _container = container;
        }

        if (!_container) {
            console.error('[Tracker] Container not found');
            return;
        }

        _projectId = projectId;
        _projectData = _getProjectData(projectId);

        _render();

        // Auto-refresh every 30 seconds
        if (_refreshInterval) clearInterval(_refreshInterval);
        _refreshInterval = setInterval(() => {
            _projectData = _getProjectData(_projectId);
            _render();
        }, 30000);
    }

    function _render() {
        if (!_container || !_projectData) return;
        const p = _projectData;
        const daysLeft = _getDaysLeft(p.endDate);

        _container.innerHTML = `
            <div class="tracker-dashboard">
                <!-- HEADER -->
                <div class="tracker-header">
                    <div class="tracker-header-info">
                        <h2 class="tracker-title">🏗️ ${p.title}</h2>
                        <div class="tracker-meta">
                            <span>📍 ${p.address}</span>
                            <span>📅 ${_formatFullDate(p.startDate)} → ${_formatFullDate(p.endDate)}</span>
                            <span class="tracker-days-left ${daysLeft < 7 ? 'urgent' : ''}">
                                ${daysLeft > 0 ? `⏱️ ${daysLeft} дней осталось` : '⚠️ Срок истёк'}
                            </span>
                        </div>
                    </div>
                    <div class="tracker-header-actions">
                        <button class="tracker-btn" onclick="window.ConstructionTracker.refresh()">🔄 Обновить</button>
                        <button class="tracker-btn primary" onclick="window.ConstructionTracker.addReport()">📷 Добавить отчёт</button>
                    </div>
                </div>

                <!-- TOP ROW: Progress + Budget -->
                <div class="tracker-top-row">
                    <div class="tracker-card tracker-progress-card">
                        <h3>Общий прогресс</h3>
                        ${_renderCircularProgress(p.progress)}
                        <div class="tracker-progress-stats">
                            <div class="tracker-stat">
                                <span class="tracker-stat-value">${p.stages.filter(s => s.status === 'completed').length}</span>
                                <span class="tracker-stat-label">завершено</span>
                            </div>
                            <div class="tracker-stat">
                                <span class="tracker-stat-value">${p.stages.filter(s => s.status === 'in_progress').length}</span>
                                <span class="tracker-stat-label">в работе</span>
                            </div>
                            <div class="tracker-stat">
                                <span class="tracker-stat-value">${p.stages.filter(s => s.status === 'pending').length}</span>
                                <span class="tracker-stat-label">ожидают</span>
                            </div>
                        </div>
                    </div>

                    <div class="tracker-card">
                        ${_renderBudgetChart(p.spentBudget, p.totalBudget)}
                    </div>
                </div>

                <!-- STAGES -->
                <div class="tracker-card">
                    ${_renderStages(p.stages)}
                </div>

                <!-- BOTTOM ROW: Photos + Team + Weather -->
                <div class="tracker-bottom-row">
                    <div class="tracker-card tracker-photos-card">
                        ${_renderPhotoTimeline(p.photoReports)}
                    </div>
                    <div class="tracker-side-widgets">
                        <div class="tracker-card">
                            ${_renderTeamWidget(p.workers)}
                        </div>
                        <div class="tracker-card">
                            ${_renderWeatherWidget(p.weather)}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Animate circular progress
        setTimeout(() => {
            const circle = _container.querySelector('.tracker-circular svg circle:nth-child(2)');
            if (circle) {
                circle.style.strokeDashoffset = circle.getAttribute('stroke-dashoffset');
            }
        }, 100);
    }

    // =============================================
    // 10. ACTIONS
    // =============================================

    function refresh() {
        _projectData = _getProjectData(_projectId);
        _render();
    }

    function addReport() {
        // Placeholder — opens a simple modal
        const modal = document.createElement('div');
        modal.className = 'tracker-modal-overlay';
        modal.innerHTML = `
            <div class="tracker-modal">
                <div class="tracker-modal-header">
                    <h3>📷 Добавить фото-отчёт</h3>
                    <button class="tracker-modal-close" onclick="this.closest('.tracker-modal-overlay').remove()">✕</button>
                </div>
                <div class="tracker-modal-body">
                    <div class="tracker-form-group">
                        <label>Заголовок</label>
                        <input type="text" id="report-title" placeholder="Например: Кладка стен 2 этажа" class="tracker-input">
                    </div>
                    <div class="tracker-form-group">
                        <label>Описание</label>
                        <textarea id="report-desc" placeholder="Опишите выполненные работы..." class="tracker-textarea"></textarea>
                    </div>
                    <div class="tracker-form-group">
                        <label>Фото (перетащите или нажмите)</label>
                        <div class="tracker-upload-zone" onclick="document.getElementById('report-photos').click()">
                            <span>📷 Выберите фото</span>
                            <input type="file" id="report-photos" multiple accept="image/*" style="display:none">
                        </div>
                    </div>
                </div>
                <div class="tracker-modal-footer">
                    <button class="tracker-btn" onclick="this.closest('.tracker-modal-overlay').remove()">Отмена</button>
                    <button class="tracker-btn primary" onclick="window.ConstructionTracker._saveReport(); this.closest('.tracker-modal-overlay').remove();">Сохранить</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    }

    function _saveReport() {
        const title = document.getElementById('report-title')?.value || 'Фото-отчёт';
        const desc = document.getElementById('report-desc')?.value || '';
        const photos = document.getElementById('report-photos')?.files?.length || 0;

        const report = {
            id: 'pr_' + Date.now(),
            date: new Date().toISOString(),
            title,
            description: desc,
            photos: photos || 1,
            author: 'Вы'
        };

        // Save to localStorage
        const key = `photo_reports_${_projectId}`;
        const reports = JSON.parse(localStorage.getItem(key) || '[]');
        reports.unshift(report);
        localStorage.setItem(key, JSON.stringify(reports));

        // Refresh
        refresh();

        // Notify
        if (window.NotificationService) {
            window.NotificationService.create({
                type: 'photo_report',
                title: 'Новый фото-отчёт',
                message: title,
                entityId: _projectId
            });
        }
    }

    function destroy() {
        if (_refreshInterval) {
            clearInterval(_refreshInterval);
            _refreshInterval = null;
        }
        if (_container) {
            _container.innerHTML = '';
        }
        _projectData = null;
    }

    // =============================================
    // 11. EXPORT
    // =============================================

    window.ConstructionTracker = {
        open,
        refresh,
        addReport,
        destroy,
        _saveReport  // for modal callback
    };

    console.log('[ConstructionTracker] ✅ Live Construction Tracker v1.0 loaded');

})();
