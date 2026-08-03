// ========================================
// CALENDAR MODULE - Calendar UI v1.0
// Календарь работ для исполнителей
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. СОСТОЯНИЕ МОДУЛЯ
    // =============================================

    let _currentDate = new Date();
    let _selectedDate = null;
    let _currentView = 'month'; // month | week
    let _events = [];
    let _containerEl = null;

    const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const MONTHS = [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const MONTHS_GENITIVE = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
    ];

    // =============================================
    // 2. СБОР СОБЫТИЙ ИЗ ДАННЫХ
    // =============================================

    /**
     * Собирает все события из заказов, работ, этапов
     * @returns {Array} массив нормализованных событий
     */
    function _collectEvents() {
        const events = [];
        const ds = window.DataService;
        if (!ds) return events;

        // --- Мои работы (для исполнителя) ---
        try {
            const worksResult = ds.Executor.getMyWorks();
            if (worksResult.success && worksResult.data) {
                worksResult.data.forEach(work => {
                    const order = work.order || {};

                    // Начало работы
                    if (work.startedAt || work.createdAt) {
                        events.push({
                            id: `work_start_${work.id}`,
                            date: new Date(work.startedAt || work.createdAt),
                            title: order.title || 'Заказ',
                            type: 'order',
                            icon: '🔨',
                            status: work.status,
                            description: `Начало работы • ${order.city || ''}`,
                            category: order.category || '',
                            city: order.city || '',
                            budget: order.budget || order.contractAmountKZT,
                            orderId: work.orderId,
                            workId: work.id
                        });
                    }

                    // Дедлайн заказа
                    if (order.deadline) {
                        const isOverdue = new Date(order.deadline) < new Date();
                        events.push({
                            id: `deadline_${work.id}`,
                            date: new Date(order.deadline),
                            title: order.title || 'Заказ',
                            type: isOverdue ? 'deadline' : 'deadline',
                            icon: '⏰',
                            status: work.status,
                            description: `Дедлайн${isOverdue ? ' (ПРОСРОЧЕН!)' : ''}`,
                            isOverdue,
                            category: order.category || '',
                            city: order.city || '',
                            budget: order.budget || order.contractAmountKZT,
                            orderId: work.orderId,
                            workId: work.id
                        });
                    }

                    // Работа на проверке
                    if (work.status === 'on_review' && work.submittedAt) {
                        events.push({
                            id: `review_${work.id}`,
                            date: new Date(work.submittedAt),
                            title: order.title || 'Заказ',
                            type: 'review',
                            icon: '📋',
                            status: 'on_review',
                            description: 'На проверке у заказчика',
                            category: order.category || '',
                            city: order.city || '',
                            orderId: work.orderId,
                            workId: work.id
                        });
                    }

                    // Выполненная работа
                    if (work.status === 'done' && work.completedAt) {
                        events.push({
                            id: `completed_${work.id}`,
                            date: new Date(work.completedAt),
                            title: order.title || 'Заказ',
                            type: 'completed',
                            icon: '✅',
                            status: 'done',
                            description: 'Работа выполнена',
                            category: order.category || '',
                            city: order.city || '',
                            budget: order.budget || order.contractAmountKZT,
                            orderId: work.orderId,
                            workId: work.id
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('[Calendar] Error loading works:', e);
        }

        // --- Мои заявки ---
        try {
            const appsResult = ds.Executor.getMyApplications();
            if (appsResult.success && appsResult.data) {
                appsResult.data.forEach(app => {
                    const order = app.order || {};
                    if (app.createdAt) {
                        events.push({
                            id: `app_${app.id}`,
                            date: new Date(app.createdAt),
                            title: order.title || 'Заявка',
                            type: 'application',
                            icon: '📝',
                            status: app.status,
                            description: `Отклик подан${app.status === 'accepted' ? ' (принят ✅)' : app.status === 'rejected' ? ' (отклонён ❌)' : ''}`,
                            orderId: app.orderId,
                            applicationId: app.id
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('[Calendar] Error loading applications:', e);
        }

        // --- Этапы заказов ---
        try {
            const worksResult = ds.Executor.getMyWorks();
            if (worksResult.success && worksResult.data) {
                worksResult.data.forEach(work => {
                    const stagesResult = ds.Customer.getOrderStages(work.orderId);
                    if (stagesResult.success && stagesResult.data) {
                        stagesResult.data.forEach(stage => {
                            if (stage.plannedStart) {
                                events.push({
                                    id: `stage_start_${stage.id}`,
                                    date: new Date(stage.plannedStart),
                                    title: stage.title || `Этап ${stage.order}`,
                                    type: 'stage',
                                    icon: '📅',
                                    status: stage.status,
                                    description: `Этап: плановое начало`,
                                    orderId: work.orderId,
                                    stageId: stage.id
                                });
                            }
                            if (stage.plannedEnd) {
                                events.push({
                                    id: `stage_end_${stage.id}`,
                                    date: new Date(stage.plannedEnd),
                                    title: stage.title || `Этап ${stage.order}`,
                                    type: 'deadline',
                                    icon: '🏁',
                                    status: stage.status,
                                    description: `Этап: плановое окончание`,
                                    orderId: work.orderId,
                                    stageId: stage.id
                                });
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.warn('[Calendar] Error loading stages:', e);
        }

        // --- Кастомные лиды/события (localStorage) ---
        try {
            const customEventsRaw = localStorage.getItem('executor_custom_events');
            if (customEventsRaw) {
                const customEvents = JSON.parse(customEventsRaw);
                customEvents.forEach(cev => {
                    events.push({
                        id: cev.id,
                        date: new Date(cev.date),
                        title: cev.title || 'Лид',
                        type: 'lead',
                        icon: '👤',
                        status: cev.status || 'plan',
                        description: cev.description || 'Пользовательское событие',
                        category: cev.category || '',
                        city: cev.city || '',
                        budget: cev.budget || 0,
                        contactName: cev.contactName || '',
                        contactPhone: cev.contactPhone || '',
                        attachments: cev.attachments || [],
                        isCustom: true
                    });
                });
            }
        } catch (e) {
            console.warn('[Calendar] Error loading custom events:', e);
        }

        return events;
    }

    /**
     * Генерирует демо-данные для календаря
     */
    function _generateDemoEvents() {
        const now = new Date();
        const events = [];

        const demoProjects = [
            { title: 'Фундамент ЖК "Астана Парк"', city: 'Астана', category: 'foundation', budget: 2500000 },
            { title: 'Кровля ТЦ "Мега"', city: 'Алматы', category: 'roofing', budget: 1800000 },
            { title: 'Стены частного дома', city: 'Караганда', category: 'walls', budget: 950000 },
            { title: 'Реконструкция офиса', city: 'Астана', category: 'repair', budget: 3200000 },
            { title: 'Забор участка', city: 'Шымкент', category: 'fencing', budget: 450000 }
        ];

        // Активные проекты
        for (let i = 0; i < 3; i++) {
            const proj = demoProjects[i];
            const startOffset = -Math.floor(Math.random() * 15) - 5;
            const deadlineOffset = Math.floor(Math.random() * 20) + 5;

            const startDate = new Date(now);
            startDate.setDate(startDate.getDate() + startOffset);

            const deadline = new Date(now);
            deadline.setDate(deadline.getDate() + deadlineOffset);

            events.push({
                id: `demo_work_${i}`,
                date: startDate,
                title: proj.title,
                type: 'order',
                icon: '🔨',
                status: 'in_work',
                description: `Начало работы • ${proj.city}`,
                category: proj.category,
                city: proj.city,
                budget: proj.budget
            });

            events.push({
                id: `demo_deadline_${i}`,
                date: deadline,
                title: proj.title,
                type: 'deadline',
                icon: '⏰',
                status: 'in_work',
                description: `Дедлайн`,
                category: proj.category,
                city: proj.city,
                budget: proj.budget
            });

            // Этапы для проекта
            const numStages = 2 + Math.floor(Math.random() * 2);
            for (let s = 0; s < numStages; s++) {
                const stageDate = new Date(now);
                stageDate.setDate(stageDate.getDate() + startOffset + Math.floor((deadlineOffset - startOffset) * (s + 1) / (numStages + 1)));

                events.push({
                    id: `demo_stage_${i}_${s}`,
                    date: stageDate,
                    title: `Этап ${s + 1}: ${['Подготовка', 'Основные работы', 'Отделка', 'Финал'][s] || 'Работа'}`,
                    type: 'stage',
                    icon: '📅',
                    status: stageDate < now ? 'accepted' : 'plan',
                    description: `${proj.title}`,
                    category: proj.category,
                    city: proj.city
                });
            }
        }

        // Проект на проверке
        const reviewDate = new Date(now);
        reviewDate.setDate(reviewDate.getDate() - 2);
        events.push({
            id: 'demo_review_1',
            date: reviewDate,
            title: demoProjects[3].title,
            type: 'review',
            icon: '📋',
            status: 'on_review',
            description: 'На проверке у заказчика',
            city: demoProjects[3].city,
            budget: demoProjects[3].budget
        });

        // Выполненный проект
        const completedDate = new Date(now);
        completedDate.setDate(completedDate.getDate() - 8);
        events.push({
            id: 'demo_completed_1',
            date: completedDate,
            title: demoProjects[4].title,
            type: 'completed',
            icon: '✅',
            status: 'done',
            description: 'Работа выполнена',
            city: demoProjects[4].city,
            budget: demoProjects[4].budget
        });

        // Заявки
        for (let i = 0; i < 2; i++) {
            const appDate = new Date(now);
            appDate.setDate(appDate.getDate() + Math.floor(Math.random() * 5) + 1);
            events.push({
                id: `demo_app_${i}`,
                date: appDate,
                title: `Новый заказ: ${['Монтаж крыши', 'Ремонт фасада'][i]}`,
                type: 'application',
                icon: '📝',
                status: 'sent',
                description: 'Отклик подан',
                city: ['Астана', 'Алматы'][i]
            });
        }

        return events;
    }

    // =============================================
    // 3. УТИЛИТЫ ДАТ
    // =============================================

    function _isSameDay(d1, d2) {
        return d1.getFullYear() === d2.getFullYear() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getDate() === d2.getDate();
    }

    function _isToday(date) {
        return _isSameDay(date, new Date());
    }

    function _isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    function _getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    }

    function _getFirstDayOfMonth(year, month) {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Понедельник = 0
    }

    function _formatDate(date) {
        const d = date.getDate();
        const m = MONTHS_GENITIVE[date.getMonth()];
        const y = date.getFullYear();
        return `${d} ${m} ${y}`;
    }

    function _formatMoney(amount) {
        if (!amount) return '';
        return new Intl.NumberFormat('ru-KZ').format(amount) + ' ₸';
    }

    function _getEventsForDate(date) {
        return _events.filter(ev => _isSameDay(ev.date, date));
    }

    function _getUpcomingEvents(limit = 5) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        return _events
            .filter(ev => ev.date >= now)
            .sort((a, b) => a.date - b.date)
            .slice(0, limit);
    }

    function _getStatusLabel(status) {
        const map = {
            'in_work': 'В работе',
            'on_review': 'На проверке',
            'done': 'Выполнено',
            'plan': 'План',
            'accepted': 'Принят',
            'rejected': 'Отклонён',
            'sent': 'Подана',
            'fixes': 'Доработка'
        };
        return map[status] || status || '';
    }

    // =============================================
    // 4. РЕНДЕР ОСНОВНОГО ИНТЕРФЕЙСА
    // =============================================

    /**
     * Открывает страницу календаря
     * @param {HTMLElement|string} container - контейнер или ID
     */
    function open(container) {
        if (typeof container === 'string') {
            _containerEl = document.getElementById(container);
        } else {
            _containerEl = container;
        }

        if (!_containerEl) {
            // Создаём container если нужно
            _containerEl = document.createElement('div');
            _containerEl.id = 'page-calendar';
            _containerEl.className = 'page calendar-page';
            document.body.appendChild(_containerEl);
        }

        // Сбор событий
        const liveEvents = _collectEvents();
        _events = liveEvents.length > 0 ? liveEvents : _generateDemoEvents();

        _render();
        console.log(`[Calendar] ✅ Opened. Events: ${_events.length}`);
    }

    function _render() {
        if (!_containerEl) return;

        const year = _currentDate.getFullYear();
        const month = _currentDate.getMonth();

        // Stats
        const now = new Date();
        const activeCount = _events.filter(e => e.type === 'order' && e.status === 'in_work').length;
        const reviewCount = _events.filter(e => e.type === 'review').length;
        const deadlinesSoon = _events.filter(e => {
            if (e.type !== 'deadline') return false;
            const diff = (e.date - now) / (1000 * 60 * 60 * 24);
            return diff >= 0 && diff <= 7;
        }).length;
        const completedCount = _events.filter(e => e.type === 'completed').length;

        _containerEl.innerHTML = `
            <!-- Header -->
            <div class="calendar-header">
                <div class="calendar-header-title">
                    <span>📅</span> Календарь работ
                </div>
                <div style="display:flex; align-items:center; gap:0.75rem; flex-wrap:wrap;">
                    <div class="calendar-view-tabs">
                        <button class="calendar-view-tab ${_currentView === 'month' ? 'active' : ''}" 
                                onclick="CalendarUI.setView('month')">Месяц</button>
                        <button class="calendar-view-tab ${_currentView === 'week' ? 'active' : ''}" 
                                onclick="CalendarUI.setView('week')">Неделя</button>
                    </div>
                    <div class="calendar-nav">
                        <button class="calendar-nav-btn" onclick="CalendarUI.prevMonth()" title="Назад">‹</button>
                        <span class="calendar-month-label">${MONTHS[month]} ${year}</span>
                        <button class="calendar-nav-btn" onclick="CalendarUI.nextMonth()" title="Вперёд">›</button>
                    </div>
                    <button class="calendar-today-btn" onclick="CalendarUI.goToday()">Сегодня</button>
                </div>
            </div>

            <!-- Stats -->
            <div class="calendar-stats">
                <div class="calendar-stat-card active">
                    <div class="stat-number">${activeCount}</div>
                    <div class="stat-label">🔨 Активных проектов</div>
                </div>
                <div class="calendar-stat-card review">
                    <div class="stat-number">${reviewCount}</div>
                    <div class="stat-label">📋 На проверке</div>
                </div>
                <div class="calendar-stat-card deadlines">
                    <div class="stat-number">${deadlinesSoon}</div>
                    <div class="stat-label">⏰ Дедлайнов на неделе</div>
                </div>
                <div class="calendar-stat-card completed">
                    <div class="stat-number">${completedCount}</div>
                    <div class="stat-label">✅ Выполнено</div>
                </div>
            </div>

            <!-- Main Layout -->
            <div class="calendar-layout">
                <div class="calendar-main">
                    ${_currentView === 'month' ? _renderMonthGrid(year, month) : _renderWeekGrid()}
                </div>
                <div class="calendar-sidebar">
                    ${_renderUpcoming()}
                    ${_renderLegend()}
                </div>
            </div>
        `;
    }

    // =============================================
    // 5. РЕНДЕР СЕТКИ МЕСЯЦА
    // =============================================

    function _renderMonthGrid(year, month) {
        const daysInMonth = _getDaysInMonth(year, month);
        const firstDay = _getFirstDayOfMonth(year, month);
        const today = new Date();

        // Предыдущий месяц
        const prevMonth = month === 0 ? 11 : month - 1;
        const prevYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = _getDaysInMonth(prevYear, prevMonth);

        let html = `
            <div class="calendar-grid-container">
                <div class="calendar-weekdays">
                    ${WEEKDAYS_SHORT.map(d => `<div class="calendar-weekday">${d}</div>`).join('')}
                </div>
                <div class="calendar-days">
        `;

        // Дни предыдущего месяца
        for (let i = firstDay - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            const date = new Date(prevYear, prevMonth, dayNum);
            const dayEvents = _getEventsForDate(date);
            html += _renderDayCell(date, dayNum, dayEvents, true);
        }

        // Дни текущего месяца
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayEvents = _getEventsForDate(date);
            html += _renderDayCell(date, day, dayEvents, false);
        }

        // Дни следующего месяца
        const totalCells = firstDay + daysInMonth;
        const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
        const nextMonth = month === 11 ? 0 : month + 1;
        const nextYear = month === 11 ? year + 1 : year;
        for (let day = 1; day <= remaining; day++) {
            const date = new Date(nextYear, nextMonth, day);
            const dayEvents = _getEventsForDate(date);
            html += _renderDayCell(date, day, dayEvents, true);
        }

        html += '</div></div>';
        return html;
    }

    function _renderDayCell(date, dayNum, events, isOtherMonth) {
        const isT = _isToday(date);
        const isW = _isWeekend(date);
        const isSel = _selectedDate && _isSameDay(date, _selectedDate);

        const classes = [
            'calendar-day',
            isOtherMonth ? 'other-month' : '',
            isT ? 'today' : '',
            isW ? 'weekend' : '',
            isSel ? 'selected' : ''
        ].filter(Boolean).join(' ');

        const dateStr = date.toISOString();
        const maxEvents = 3;
        const visibleEvents = events.slice(0, maxEvents);
        const moreCount = events.length - maxEvents;

        return `
            <div class="${classes}" onclick="CalendarUI.selectDate('${dateStr}')">
                <div class="calendar-day-number">${dayNum}</div>
                ${visibleEvents.map(e => `
                    <div class="calendar-event ${e.type}" title="${e.title}: ${e.description}">
                        <span>${e.icon}</span> ${e.title.length > 14 ? e.title.slice(0, 14) + '…' : e.title}
                    </div>
                `).join('')}
                ${moreCount > 0 ? `<div class="calendar-event-more">+${moreCount} ещё</div>` : ''}
            </div>
        `;
    }

    // =============================================
    // 6. РЕНДЕР СЕТКИ НЕДЕЛИ
    // =============================================

    function _renderWeekGrid() {
        const today = new Date(_currentDate);
        const dayOfWeek = today.getDay();
        const monday = new Date(today);
        monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

        let html = `
            <div class="calendar-grid-container">
                <div class="calendar-weekdays">
                    ${WEEKDAYS_SHORT.map((d, i) => {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            return `<div class="calendar-weekday">${d}, ${date.getDate()}</div>`;
        }).join('')}
                </div>
                <div class="calendar-days" style="grid-template-rows: 1fr;">
        `;

        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            const dayEvents = _getEventsForDate(date);

            const isT = _isToday(date);
            const isW = _isWeekend(date);
            const classes = [
                'calendar-day',
                isT ? 'today' : '',
                isW ? 'weekend' : ''
            ].filter(Boolean).join(' ');

            const dateStr = date.toISOString();

            html += `
                <div class="${classes}" style="min-height:200px;" onclick="CalendarUI.selectDate('${dateStr}')">
                    <div class="calendar-day-number">${date.getDate()}</div>
                    ${dayEvents.map(e => `
                        <div class="calendar-event ${e.type}" title="${e.title}: ${e.description}">
                            <span>${e.icon}</span> ${e.title.length > 18 ? e.title.slice(0, 18) + '…' : e.title}
                        </div>
                    `).join('')}
                    ${dayEvents.length === 0 ? '<div style="font-size:0.7rem;color:var(--text-muted,#888);text-align:center;margin-top:1rem;">—</div>' : ''}
                </div>
            `;
        }

        html += '</div></div>';
        return html;
    }

    // =============================================
    // 7. SIDEBAR
    // =============================================

    function _renderUpcoming() {
        const upcoming = _getUpcomingEvents(5);

        if (upcoming.length === 0) {
            return `
                <div class="calendar-sidebar-card">
                    <div class="calendar-sidebar-title">📋 Ближайшие задачи</div>
                    <div class="calendar-empty-state">
                        <div class="calendar-empty-icon">🎉</div>
                        <div class="calendar-empty-title">Всё чисто!</div>
                        <div class="calendar-empty-desc">Нет предстоящих задач</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="calendar-sidebar-card">
                <div class="calendar-sidebar-title">📋 Ближайшие задачи</div>
                <div class="calendar-upcoming-list">
                    ${upcoming.map(ev => {
            const daysLeft = Math.ceil((ev.date - new Date()) / (1000 * 60 * 60 * 24));
            const daysLabel = daysLeft === 0 ? 'Сегодня' : daysLeft === 1 ? 'Завтра' : `через ${daysLeft} дн.`;
            const badgeClass = daysLeft <= 2 ? 'urgent' : ev.status === 'done' ? 'done' : 'normal';

            return `
                            <div class="calendar-upcoming-item" onclick="CalendarUI.selectDate('${ev.date.toISOString()}')">
                                <div class="calendar-upcoming-icon ${ev.type}">
                                    ${ev.icon}
                                </div>
                                <div class="calendar-upcoming-content">
                                    <div class="calendar-upcoming-title">${ev.title}</div>
                                    <div class="calendar-upcoming-meta">
                                        <span>${daysLabel}</span>
                                        ${ev.city ? `<span>• ${ev.city}</span>` : ''}
                                        <span class="calendar-upcoming-badge ${badgeClass}">${_getStatusLabel(ev.status)}</span>
                                    </div>
                                </div>
                            </div>
                        `;
        }).join('')}
                </div>
            </div>
        `;
    }

    function _renderLegend() {
        return `
            <div class="calendar-sidebar-card">
                <div class="calendar-sidebar-title">🏷️ Обозначения</div>
                <div class="calendar-legend">
                    <div class="calendar-legend-item">
                        <div class="calendar-legend-dot order"></div>
                        <span>Активный проект</span>
                    </div>
                    <div class="calendar-legend-item">
                        <div class="calendar-legend-dot stage"></div>
                        <span>Этап работ</span>
                    </div>
                    <div class="calendar-legend-item">
                        <div class="calendar-legend-dot deadline"></div>
                        <span>Дедлайн</span>
                    </div>
                    <div class="calendar-legend-item">
                        <div class="calendar-legend-dot review"></div>
                        <span>На проверке</span>
                    </div>
                    <div class="calendar-legend-item">
                        <div class="calendar-legend-dot completed"></div>
                        <span>Завершено</span>
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // 8. МОДАЛЬНОЕ ОКНО ДНЯ
    // =============================================

    function _openDayDetail(date) {
        const events = _getEventsForDate(date);
        const formattedDate = _formatDate(date);

        const overlay = document.createElement('div');
        overlay.className = 'calendar-day-overlay';
        overlay.id = 'calendarDayOverlay';
        overlay.onclick = (e) => {
            if (e.target === overlay) closeDayDetail();
        };

        let eventsHtml = '';
        if (events.length === 0) {
            eventsHtml = `
                <div class="calendar-day-no-events">
                    <div class="calendar-day-no-events-icon">📭</div>
                    <div>Нет событий на этот день</div>
                </div>
            `;
        } else {
            eventsHtml = events.map(ev => `
                <div class="calendar-day-event">
                    <div class="calendar-day-event-icon ${ev.type}">
                        ${ev.icon}
                    </div>
                    <div class="calendar-day-event-content">
                        <div class="calendar-day-event-title">${ev.title}</div>
                        <div class="calendar-day-event-desc">${ev.description}</div>
                        <div class="calendar-day-event-tags">
                            ${ev.status ? `<span class="calendar-day-event-tag status">${_getStatusLabel(ev.status)}</span>` : ''}
                            ${ev.city ? `<span class="calendar-day-event-tag city">📍 ${ev.city}</span>` : ''}
                            ${ev.budget ? `<span class="calendar-day-event-tag budget">💰 ${_formatMoney(ev.budget)}</span>` : ''}
                            ${ev.isOverdue ? `<span class="calendar-day-event-tag overdue">⚠️ Просрочен</span>` : ''}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        overlay.innerHTML = `
            <div class="calendar-day-modal">
                <div class="calendar-day-modal-header">
                    <div class="calendar-day-modal-title">📅 ${formattedDate}</div>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="calendar-add-event-btn" onclick="CalendarUI.openAddEventModal('${date.toISOString()}')">➕ Добавить</button>
                        <button class="calendar-day-modal-close" onclick="CalendarUI.closeDayDetail()">✕</button>
                    </div>
                </div>
                <div class="calendar-day-modal-body">
                    ${eventsHtml}
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // ESC
        const handler = (e) => {
            if (e.key === 'Escape') {
                closeDayDetail();
                document.removeEventListener('keydown', handler);
            }
        };
        document.addEventListener('keydown', handler);
    }

    function closeDayDetail() {
        const overlay = document.getElementById('calendarDayOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        }
    }

    // =============================================
    // 8.5 МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ЛИДА/СОБЫТИЯ
    // =============================================

    function openAddEventModal(dateStr) {
        // Закрываем модалку дня если открыта
        closeDayDetail();

        const date = dateStr ? new Date(dateStr) : new Date();
        const formattedDate = date.toISOString().split('T')[0];

        const overlay = document.createElement('div');
        overlay.className = 'calendar-day-overlay';
        overlay.id = 'calendarAddEventOverlay';
        
        // Массив для временного хранения загруженных файлов (Base64)
        window._tempEventAttachments = [];

        overlay.innerHTML = `
            <div class="calendar-day-modal" style="max-width:500px; width:95%;">
                <div class="calendar-day-modal-header">
                    <div class="calendar-day-modal-title">➕ Новый лид / Событие</div>
                    <button class="calendar-day-modal-close" onclick="CalendarUI.closeAddEventModal()">✕</button>
                </div>
                <div class="calendar-day-modal-body" style="display:flex; flex-direction:column; gap:1rem;">
                    <div class="cal-form-group">
                        <label>Дата</label>
                        <input type="date" id="calEvDate" class="cal-input" value="${formattedDate}">
                    </div>
                    <div class="cal-form-group">
                        <label>Название (Обязательно)</label>
                        <input type="text" id="calEvTitle" class="cal-input" placeholder="Например: Ремонт квартиры" required>
                    </div>
                    <div class="cal-form-group">
                        <label>Описание</label>
                        <textarea id="calEvDesc" class="cal-input" rows="3" placeholder="Детали задачи..."></textarea>
                    </div>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem;">
                        <div class="cal-form-group">
                            <label>Имя клиента</label>
                            <input type="text" id="calEvName" class="cal-input" placeholder="Иван">
                        </div>
                        <div class="cal-form-group">
                            <label>Телефон</label>
                            <input type="text" id="calEvPhone" class="cal-input" placeholder="+7 700 000 0000">
                        </div>
                    </div>
                    <div class="cal-form-group">
                        <label>Примерный бюджет (₸)</label>
                        <input type="number" id="calEvBudget" class="cal-input" placeholder="0">
                    </div>
                    
                    <div class="cal-form-group">
                        <label>Прикрепить файлы (Фото/Документы)</label>
                        <div class="cal-upload-zone" onclick="document.getElementById('calEvFiles').click()">
                            <div class="cal-upload-icon">📎</div>
                            <div>Нажмите, чтобы выбрать файлы</div>
                            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">До 5 файлов, макс 5МБ</div>
                            <input type="file" id="calEvFiles" multiple style="display:none;" onchange="CalendarUI.handleEventFileUpload(event)">
                        </div>
                        <div id="calEvFilesPreview" class="cal-files-preview"></div>
                    </div>
                    
                    <button class="calendar-today-btn" style="width:100%; margin-top:0.5rem;" onclick="CalendarUI.saveCustomEvent()">Сохранить</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    function closeAddEventModal() {
        const overlay = document.getElementById('calendarAddEventOverlay');
        if (overlay) {
            overlay.remove();
        }
        window._tempEventAttachments = [];
    }

    function handleEventFileUpload(e) {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const previewContainer = document.getElementById('calEvFilesPreview');
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Лимит 5МБ на файл (для base64 localStorage)
            if (file.size > 5 * 1024 * 1024) {
                if(window.showToast) window.showToast(`❌ Файл ${file.name} слишком большой (макс 5MB)`);
                continue;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64 = event.target.result;
                const isImage = file.type.startsWith('image/');
                
                const attachment = {
                    name: file.name,
                    type: file.type,
                    data: base64,
                    isImage
                };
                
                window._tempEventAttachments.push(attachment);
                
                // Рендер превью
                const item = document.createElement('div');
                item.className = 'cal-file-item';
                if (isImage) {
                    item.innerHTML = `<img src="${base64}" alt="${file.name}">`;
                } else {
                    item.innerHTML = `<div class="cal-file-doc">📄</div>`;
                }
                previewContainer.appendChild(item);
            };
            reader.readAsDataURL(file);
        }
    }

    function saveCustomEvent() {
        const title = document.getElementById('calEvTitle').value.trim();
        if (!title) {
            if(window.showToast) window.showToast('⚠️ Введите название');
            return;
        }

        const dateStr = document.getElementById('calEvDate').value;
        const desc = document.getElementById('calEvDesc').value.trim();
        const name = document.getElementById('calEvName').value.trim();
        const phone = document.getElementById('calEvPhone').value.trim();
        const budget = parseInt(document.getElementById('calEvBudget').value) || 0;

        const newEvent = {
            id: 'custom_' + Date.now(),
            date: dateStr ? new Date(dateStr).toISOString() : new Date().toISOString(),
            title,
            description: desc,
            contactName: name,
            contactPhone: phone,
            budget,
            status: 'plan',
            attachments: window._tempEventAttachments || [],
            createdAt: new Date().toISOString()
        };

        try {
            const raw = localStorage.getItem('executor_custom_events');
            const customEvents = raw ? JSON.parse(raw) : [];
            customEvents.push(newEvent);
            localStorage.setItem('executor_custom_events', JSON.stringify(customEvents));
            
            if(window.showToast) window.showToast('✅ Лид сохранен!');
            
            closeAddEventModal();
            _render(); // Перерендерить календарь
        } catch (e) {
            console.error('[Calendar] Error saving event:', e);
            if(window.showToast) window.showToast('❌ Ошибка при сохранении (возможно превышен лимит памяти)');
        }
    }

    // =============================================
    // 9. НАВИГАЦИЯ
    // =============================================

    function prevMonth() {
        if (_currentView === 'week') {
            _currentDate.setDate(_currentDate.getDate() - 7);
        } else {
            _currentDate.setMonth(_currentDate.getMonth() - 1);
        }
        _render();
    }

    function nextMonth() {
        if (_currentView === 'week') {
            _currentDate.setDate(_currentDate.getDate() + 7);
        } else {
            _currentDate.setMonth(_currentDate.getMonth() + 1);
        }
        _render();
    }

    function goToday() {
        _currentDate = new Date();
        _selectedDate = new Date();
        _render();
    }

    function selectDate(dateStr) {
        const date = new Date(dateStr);
        _selectedDate = date;
        _currentDate = new Date(date);
        _openDayDetail(date);
        _render();
    }

    function setView(view) {
        _currentView = view;
        _render();
    }

    // =============================================
    // 10. ЭКСПОРТ
    // =============================================

    const CalendarUI = {
        open,
        prevMonth,
        nextMonth,
        goToday,
        selectDate,
        setView,
        closeDayDetail,
        openAddEventModal,
        closeAddEventModal,
        handleEventFileUpload,
        saveCustomEvent,

        // Для тестирования
        getEvents: () => [..._events],
        getCurrentDate: () => new Date(_currentDate)
    };

    window.CalendarUI = CalendarUI;

    console.log('[CalendarUI] ✅ Calendar Module v1.0 loaded');

})();
