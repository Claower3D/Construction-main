/**
 * ========== ENGINEER UI v6.0 ==========
 * Full CRUD, org-isolated storage, calendar views, action history, brigade timer
 */

(function () {
    'use strict';

    const ED = window.EngineerData;

    // State
    let currentTab = 'calendar';
    let activeObjectId = null;
    let calYear = new Date().getFullYear();
    let calMonth = new Date().getMonth();
    let selectedDate = null;
    let calendarView = 'month'; // 'month' | 'week' | 'day'

    // Organization state
    const ORG_STORAGE_KEY = 'engOrganizations';
    const ACTIVE_ORG_KEY = 'engActiveOrg';
    let _organizations = [];
    let _activeOrg = null;

    // Helpers
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));
    const formatPrice = p => new Intl.NumberFormat('ru-RU').format(p) + ' ₸';

    function _loadOrgs() {
        try {
            _organizations = JSON.parse(localStorage.getItem(ORG_STORAGE_KEY) || '[]');
            if (!_organizations.length) {
                _organizations = [
                    {id:'org_qazgost',name:'ТОО «QazGost»',bin:'990405351447',city:'Караганда',type:'ТОО',createdAt:ED.today()},
                    {id:'org_demo',name:'ТОО «Инжен-Строй»',bin:'123456789012',city:'Караганда',type:'ТОО',createdAt:ED.today()},
                    {id:'org_demo2',name:'ИП «Мастер Сервис»',bin:'987654321098',city:'Астана',type:'ИП',createdAt:ED.today()}
                ];
                localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(_organizations));
            } else {
                // Ensure QazGost is always present
                if (!_organizations.find(o => o.id === 'org_qazgost')) {
                    _organizations.unshift({id:'org_qazgost',name:'ТОО «QazGost»',bin:'990405351447',city:'Караганда',type:'ТОО',createdAt:ED.today()});
                    localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(_organizations));
                }
            }
            _activeOrg = JSON.parse(localStorage.getItem(ACTIVE_ORG_KEY) || 'null');
        } catch(e) { _organizations = []; _activeOrg = null; }
    }
    function _saveOrgs() {
        localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(_organizations));
        if (_activeOrg) localStorage.setItem(ACTIVE_ORG_KEY, JSON.stringify(_activeOrg));
    }


    function init() {
        console.log('👷 Engineer UI v6.0 — org-isolated + full CRUD');
        _loadOrgs();
        const container = $('#engineer-container');
        if (!container) return;
        if (_activeOrg) {
            ED.setStorageKeyForOrg(_activeOrg.id);
            renderLayout(container);
            switchTab('calendar');
            _loadAPIOrders(); // Pull real customer orders (background)
        } else {
            renderOrgSelector(container);
        }
    }

    // Load published customer orders from API → merge into ED.requests
    async function _loadAPIOrders() {
        try {
            const API = window.API || window.APIService;
            if (!API || !API.Orders || !API.Orders.getPublicOrders) return;
            const res = await API.Orders.getPublicOrders();
            if (!res || !res.orders || !res.orders.length) return;
            let added = 0;
            res.orders.forEach(order => {
                if (ED.requests.find(r => r.apiId === order.id)) return;
                ED.requests.unshift({
                    id: ED.genId('req'),
                    apiId: order.id,
                    client: [order.first_name, order.last_name].filter(Boolean).join(' ') || 'Заказчик',
                    address: order.address || 'Адрес не указан',
                    type: order.category || 'Разное',
                    comment: order.description || '',
                    source: 'client',
                    urgency: 'обычная',
                    photos: 0,
                    status: 'NEW',
                    budget: order.estimated_price || 0,
                    phone: '',
                    scheduledDate: (order.created_at || '').split('T')[0] || ED.today(),
                    createdAt: order.created_at || new Date().toISOString()
                });
                added++;
            });
            if (added) {
                ED.saveData();
                const badge = document.querySelector('[data-tab="requests"] .nav-badge');
                if (badge) badge.textContent = ED.requests.filter(r => r.status === 'NEW').length;
                showToast('📬 ' + added + ' новых заявок от заказчиков');
            }
        } catch(e) {
            console.warn('[EngineerUI] API orders fetch failed (offline):', e.message);
        }
    }


    // ========== ORGANIZATION SELECTOR ==========
    function renderOrgSelector(container) {
        container.innerHTML = `
            <div style="max-width:680px;margin:2rem auto;animation:fadeInUp 0.4s ease">
                <div style="text-align:center;margin-bottom:2rem">
                    <div style="font-size:3rem;margin-bottom:0.5rem">🏢</div>
                    <h2 style="font-size:1.6rem;font-weight:800;background:linear-gradient(135deg,#a78bfa,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Выберите организацию</h2>
                    <p style="color:var(--text-muted);margin-top:0.5rem">Для начала работы выберите организацию или создайте новую</p>
                </div>
                <div style="display:flex;flex-direction:column;gap:1rem" id="eng-org-list">
                    ${_organizations.map(org => `
                        <div class="eng-card" style="cursor:pointer;transition:all 0.3s;padding:1.25rem 1.5rem" onclick="EngineerUI.selectOrg('${org.id}')"
                             onmouseenter="this.style.borderColor='rgba(139,92,246,0.4)';this.style.transform='translateY(-2px)'"
                             onmouseleave="this.style.borderColor='';this.style.transform=''">
                            <div style="display:flex;align-items:center;gap:1rem">
                                <div style="width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,rgba(139,92,246,0.25),rgba(236,72,153,0.15));display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0">
                                    ${org.type === 'ТОО' ? '🏢' : org.type === 'ИП' ? '👤' : '🔧'}
                                </div>
                                <div style="flex:1">
                                    <h3 style="margin:0;font-size:1.05rem;font-weight:700">${org.name}</h3>
                                    <div style="display:flex;gap:1rem;margin-top:0.3rem;font-size:0.82rem;color:var(--text-muted)">
                                        <span>📍 ${org.city}</span>
                                        <span>🏷️ ${org.type}</span>
                                        <span>БИН: ${org.bin}</span>
                                    </div>
                                </div>
                                <div style="font-size:1.5rem;color:var(--primary)">→</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="eng-btn eng-btn-primary" style="width:100%;margin-top:1.5rem;padding:1rem;font-size:1rem" onclick="EngineerUI.showCreateOrg()">+ Создать новую организацию</button>
            </div>`;
    }

    function selectOrg(orgId) {
        _activeOrg = _organizations.find(o => o.id === orgId);
        if (!_activeOrg) return;
        localStorage.setItem(ACTIVE_ORG_KEY, JSON.stringify(_activeOrg));
        ED.setStorageKeyForOrg(_activeOrg.id);
        showToast(`🏢 ${_activeOrg.name}`);
        const container = $('#engineer-container');
        renderLayout(container);
        switchTab('calendar');
    }

    async function showCreateOrg() {
        const p = window.QazUI ? QazUI.prompt.bind(QazUI) : (t,d,o) => Promise.resolve(prompt(d));
        const name = await p('Новая организация','Название (ТОО/ИП + имя)',{icon:'🏢',placeholder:'ТОО «Мой бизнес»',confirmText:'Далее'});
        if (!name) return;
        const city = await p('Город','В каком городе?',{icon:'📍',placeholder:'Караганда',confirmText:'Далее'});
        if (!city) return;
        const bin = await p('БИН/ИИН','12-значный номер',{icon:'🏷️',placeholder:'123456789012',confirmText:'Далее'});
        const typeChoice = await p('Тип','ТОО / ИП / Мастер',{icon:'📋',placeholder:'ТОО',confirmText:'Создать'});
        const type = ['ТОО','ИП','Мастер'].includes(typeChoice) ? typeChoice : 'ТОО';
        const newOrg = {id: ED.genId('org'), name, city: city||'Караганда', bin: bin||'', type, createdAt: ED.today()};
        _organizations.push(newOrg);
        _saveOrgs();
        showToast('🏢 Организация создана!');
        renderOrgSelector($('#engineer-container'));
    }

    function switchOrg() {
        _activeOrg = null;
        localStorage.removeItem(ACTIVE_ORG_KEY);
        renderOrgSelector($('#engineer-container'));
    }

    function renderLayout(container) {
        container.innerHTML = `
            <div class="eng-layout">
                <aside class="eng-sidebar">
                    <div class="eng-sidebar-header">
                        <h2>👷 ${_activeOrg ? _activeOrg.name : 'Кабинет инженера'}</h2>
                        <p style="cursor:pointer" onclick="EngineerUI.switchOrg()" title="Сменить организацию">🏢 ${_activeOrg ? _activeOrg.city + ' • ' + _activeOrg.type : 'iConstruction'} ⇄</p>
                    </div>
                    <nav class="eng-nav">
                        <div class="eng-nav-item active" data-tab="calendar" onclick="EngineerUI.switchTab('calendar')">
                            <span class="nav-icon">📅</span>
                            <span>Календарь</span>
                        </div>
                        <div class="eng-nav-item" data-tab="dashboard" onclick="EngineerUI.switchTab('dashboard')">
                            <span class="nav-icon">📊</span>
                            <span>Обзор</span>
                        </div>
                        <div class="eng-nav-item" data-tab="requests" onclick="EngineerUI.switchTab('requests')">
                            <span class="nav-icon">📬</span>
                            <span>Заявки</span>
                            <span class="nav-badge">${ED.requests.filter(r => r.status === 'NEW').length}</span>
                        </div>
                        <div class="eng-nav-item" data-tab="objects" onclick="EngineerUI.switchTab('objects')">
                            <span class="nav-icon">🏗️</span>
                            <span>Объекты</span>
                        </div>
                        <div class="eng-nav-divider"></div>
                        <div class="eng-nav-item" data-tab="photos" onclick="EngineerUI.switchTab('photos')">
                            <span class="nav-icon">📸</span>
                            <span>Фото / Видео</span>
                        </div>
                        <div class="eng-nav-item" data-tab="measures" onclick="EngineerUI.switchTab('measures')">
                            <span class="nav-icon">📐</span>
                            <span>Замеры</span>
                        </div>
                        <div class="eng-nav-item" data-tab="ai" onclick="EngineerUI.switchTab('ai')">
                            <span class="nav-icon">🤖</span>
                            <span>AI-просчёт</span>
                        </div>
                        <div class="eng-nav-item" data-tab="estimates" onclick="EngineerUI.switchTab('estimates')">
                            <span class="nav-icon">📄</span>
                            <span>Сметы</span>
                        </div>
                        <div class="eng-nav-divider"></div>
                        <div class="eng-nav-item" data-tab="brigades" onclick="EngineerUI.switchTab('brigades')">
                            <span class="nav-icon">👷</span>
                            <span>Бригады</span>
                        </div>
                        <div class="eng-nav-item" data-tab="materials" onclick="EngineerUI.switchTab('materials')">
                            <span class="nav-icon">📦</span>
                            <span>Материалы</span>
                        </div>
                        <div class="eng-nav-item" data-tab="reports" onclick="EngineerUI.switchTab('reports')">
                            <span class="nav-icon">📋</span>
                            <span>Отчёты</span>
                        </div>
                        <div class="eng-nav-item" data-tab="expenses" onclick="EngineerUI.switchTab('expenses')">
                            <span class="nav-icon">💰</span>
                            <span>Расходы</span>
                        </div>
                        <div class="eng-nav-item" data-tab="notifications" onclick="EngineerUI.switchTab('notifications')">
                            <span class="nav-icon">🔔</span>
                            <span>Уведомления</span>
                            <span class="nav-badge">${ED.notifications.filter(n => n.unread).length}</span>
                        </div>
                    </nav>
                </aside>
                <main class="eng-main" id="eng-main-content">
                    <!-- Content will be injected here -->
                </main>
            </div>
        `;
    }

    function switchTab(tabId) {
        currentTab = tabId;
        $$('.eng-nav-item').forEach(el => {
            el.classList.toggle('active', el.getAttribute('data-tab') === tabId);
        });

        const main = $('#eng-main-content');
        if (!main) return;

        switch (tabId) {
            case 'dashboard': renderDashboard(main); break;
            case 'calendar': renderCalendar(main); break;
            case 'requests': renderRequests(main); break;
            case 'objects': renderObjects(main); break;
            case 'photos': renderPhotos(main); break;
            case 'measures': renderMeasures(main); break;
            case 'ai': renderAI(main); break;
            case 'estimates': renderEstimates(main); break;
            case 'brigades': renderBrigades(main); break;
            case 'materials': renderMaterials(main); break;
            case 'reports': renderReports(main); break;
            case 'expenses': renderExpenses(main); break;
            case 'notifications': renderNotifications(main); break;
        }
    }

    // --- TAB RENDERING FUNCTIONS ---

    function renderDashboard(main) {
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEvents = ED.calendar.filter(e => e.date === todayStr);
        const totalBudget = ED.objects.reduce((s,o) => s + (o.budget||0), 0);
        const totalFact = ED.objects.reduce((s,o) => s + (o.factCost||0), 0);
        main.innerHTML = `
            <div class="eng-page-header"><h1>📊 Главная панель</h1>
                <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="EngineerUI.resetData()">🔄 Сброс демо</button>
            </div>
            <div class="eng-stats-grid">
                <div class="eng-stat-card" style="--stat-color:var(--primary)" onclick="EngineerUI.switchTab('requests')">
                    <div class="eng-stat-icon">📋</div><div><div class="eng-stat-value">${ED.requests.length}</div><div class="eng-stat-label">Новые заявки</div></div></div>
                <div class="eng-stat-card" style="--stat-color:var(--warning)" onclick="EngineerUI.switchTab('objects')">
                    <div class="eng-stat-icon">🏗️</div><div><div class="eng-stat-value">${ED.objects.filter(o=>o.status==='IN_WORK').length}</div><div class="eng-stat-label">В работе</div></div></div>
                <div class="eng-stat-card" style="--stat-color:var(--success)">
                    <div class="eng-stat-icon">✅</div><div><div class="eng-stat-value">${ED.objects.filter(o=>o.status==='DONE').length}</div><div class="eng-stat-label">Завершено</div></div></div>
                <div class="eng-stat-card" style="--stat-color:#06b6d4">
                    <div class="eng-stat-icon">💰</div><div><div class="eng-stat-value">${formatPrice(totalBudget - totalFact)}</div><div class="eng-stat-label">Прибыль</div></div></div>
            </div>
            <div class="eng-card-grid">
                <div class="eng-card"><div class="eng-card-header"><h3>📅 Сегодня</h3>
                    <button class="eng-btn eng-btn-sm eng-btn-secondary" onclick="EngineerUI.switchTab('calendar')">Календарь →</button></div>
                    <div class="eng-timeline">${todayEvents.length ? todayEvents.map(e=>`
                        <div class="eng-timeline-item"><strong>${e.time} — ${e.title}</strong>
                        <p class="text-muted">${e.objId ? ED.objects.find(o=>o.id===e.objId)?.address||'' : ''}</p></div>`).join('') :
                        '<p class="text-muted" style="padding:1rem">Нет событий на сегодня</p>'}
                    </div>
                </div>
                <div class="eng-card"><div class="eng-card-header"><h3>🔔 Уведомления</h3>
                    <span class="nav-badge">${ED.notifications.filter(n=>n.unread).length}</span></div>
                    <div class="eng-notif-list">${ED.notifications.slice(0,4).map(n=>`
                        <div class="eng-notif-item ${n.unread?'unread':''}">
                            <div class="eng-notif-icon">${n.icon}</div>
                            <div style="flex:1"><p style="margin:0;font-size:0.9rem">${n.text}</p>
                            <span class="eng-notif-time">${n.time}</span></div>
                        </div>`).join('')}
                    </div>
                </div>
            </div>`;
    }

    function renderCalendar(main) {
        const MONTHS = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
        const firstDay = new Date(calYear, calMonth, 1);
        const lastDay = new Date(calYear, calMonth + 1, 0);
        const startWeekday = (firstDay.getDay() + 6) % 7;
        const daysInMonth = lastDay.getDate();
        const SRC = {client:'👤 Клиент', manager:'👔 Менеджер', master:'🔧 Мастер'};

        // Count tasks per day
        const dayData = {};
        for (let d = 1; d <= daysInMonth; d++) {
            const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const ev = ED.getEventsForDate(ds);
            dayData[d] = {dateStr: ds, reqCount: ev.requests.length, objCount: ev.objects.length, evCount: ev.events.length};
        }

        main.innerHTML = `
            <div class="eng-page-header">
                <h1>📅 Рабочий календарь</h1>
                <div class="eng-header-actions">
                    <div class="eng-view-switcher">
                        <button class="eng-btn eng-btn-sm ${calendarView==='month'?'eng-btn-primary':'eng-btn-secondary'}" onclick="EngineerUI.setCalView('month')">Месяц</button>
                        <button class="eng-btn eng-btn-sm ${calendarView==='week'?'eng-btn-primary':'eng-btn-secondary'}" onclick="EngineerUI.setCalView('week')">Неделя</button>
                        <button class="eng-btn eng-btn-sm ${calendarView==='day'?'eng-btn-primary':'eng-btn-secondary'}" onclick="EngineerUI.setCalView('day')">День</button>
                    </div>
                    <button class="eng-btn eng-btn-primary" onclick="window.EngineerWizard ? EngineerWizard.open() : EngineerUI.addRequestFromCalendar()">+ Новый объект</button>
                    <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="EngineerUI.resetData()">🔄 Демо</button>
                </div>
            </div>
            <div style="display:flex;gap:1.5rem;align-items:flex-start;flex-wrap:wrap">
                <div style="flex:1;min-width:320px">
                    <div class="eng-card" style="padding:1rem 1.25rem">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                            <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="EngineerUI.calNav(-1)">← </button>
                            <h3 style="margin:0;font-size:1.1rem">${calendarView==='day' && selectedDate ? new Date(selectedDate+'T12:00:00').toLocaleDateString('ru-RU',{day:'numeric',month:'long',weekday:'long',year:'numeric'}) : MONTHS[calMonth] + ' ' + calYear}</h3>
                            <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="EngineerUI.calNav(1)"> →</button>
                        </div>
                        ${calendarView === 'month' ? `
                        <div class="eng-cal-grid">
                            ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(d => `<div class="eng-cal-header">${d}</div>`).join('')}
                            ${Array.from({length: startWeekday}, () => '<div class="eng-cal-day other-month"></div>').join('')}
                            ${Array.from({length: daysInMonth}, (_, i) => {
                                const d = i + 1;
                                const dd = dayData[d];
                                const isToday = dd.dateStr === todayStr;
                                const isSel = dd.dateStr === selectedDate;
                                const dots = [];
                                if (dd.reqCount) dots.push('<span style="color:#fbbf24">●</span>');
                                if (dd.objCount) dots.push('<span style="color:#22c55e">●</span>');
                                if (dd.evCount) dots.push('<span style="color:#60a5fa">●</span>');
                                return `<div class="eng-cal-day ${isToday?'today':''} ${isSel?'selected':''}" onclick="EngineerUI.selectDay('${dd.dateStr}')">
                                    <div class="eng-cal-day-num">${d}</div>
                                    <div style="display:flex;gap:2px;font-size:0.6rem">${dots.join('')}</div>
                                    ${dd.reqCount ? `<div class="eng-cal-event type-meeting">${dd.reqCount} заявк.</div>` : ''}
                                    ${dd.objCount ? `<div class="eng-cal-event type-mount">${dd.objCount} объект.</div>` : ''}
                                </div>`;
                            }).join('')}
                        </div>` : calendarView === 'week' ? (() => {
                            const base = selectedDate ? new Date(selectedDate+'T12:00:00') : new Date();
                            const monday = new Date(base); monday.setDate(base.getDate() - ((base.getDay()+6)%7));
                            const weekDays = Array.from({length:7}, (_,i) => { const d=new Date(monday); d.setDate(monday.getDate()+i); return d; });
                            return `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:0.5rem">
                                ${weekDays.map(wd => {
                                    const ds = wd.toISOString().split('T')[0];
                                    const ev = ED.getEventsForDate(ds);
                                    const isT = ds === todayStr;
                                    const total = ev.requests.length + ev.objects.length + ev.events.length;
                                    return `<div class="eng-card" style="padding:0.75rem;cursor:pointer;${isT?'border-color:var(--primary);':''}min-height:140px" onclick="EngineerUI.selectDay('${ds}')">
                                        <div style="font-weight:700;font-size:0.9rem;${isT?'color:var(--primary)':''}">${wd.toLocaleDateString('ru-RU',{weekday:'short'})}</div>
                                        <div style="font-size:1.3rem;font-weight:800;margin:0.25rem 0">${wd.getDate()}</div>
                                        ${ev.requests.length ? `<div class="eng-cal-event type-meeting" style="margin:2px 0">${ev.requests.length} заявк.</div>` : ''}
                                        ${ev.objects.length ? `<div class="eng-cal-event type-mount" style="margin:2px 0">${ev.objects.length} объект.</div>` : ''}
                                        ${ev.events.length ? `<div class="eng-cal-event type-control" style="margin:2px 0">${ev.events.length} событ.</div>` : ''}
                                        ${!total ? '<p class="text-muted" style="font-size:0.7rem;margin:0.5rem 0 0">—</p>' : ''}
                                    </div>`;
                                }).join('')}
                            </div>`;
                        })() : (() => {
                            const dayStr = selectedDate || todayStr;
                            const ev = ED.getEventsForDate(dayStr);
                            return renderDayPanelHTML(dayStr);
                        })()}
                        <div style="display:flex;gap:1rem;margin-top:0.75rem;font-size:0.75rem;color:var(--text-muted)">
                            <span>● <span style="color:#fbbf24">Заявки</span></span>
                            <span>● <span style="color:#22c55e">Объекты</span></span>
                            <span>● <span style="color:#60a5fa">События</span></span>
                        </div>
                    </div>
                </div>
                ${calendarView !== 'day' ? `<div id="eng-day-panel" style="flex:1;min-width:320px">
                    ${selectedDate ? renderDayPanelHTML(selectedDate) : '<div class="eng-empty"><div class="eng-empty-icon">👆</div><h3>Выберите день</h3><p>Кликните на дату в календаре</p></div>'}
                </div>` : ''}
            </div>`;
    }

    function calNav(delta) {
        if (calendarView === 'day') {
            const d = new Date(calYear, calMonth, (selectedDate ? parseInt(selectedDate.split('-')[2]) : 1) + delta);
            calYear = d.getFullYear(); calMonth = d.getMonth();
            selectedDate = d.toISOString().split('T')[0];
        } else if (calendarView === 'week') {
            const base = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date(calYear, calMonth, 1);
            base.setDate(base.getDate() + delta * 7);
            calYear = base.getFullYear(); calMonth = base.getMonth();
            selectedDate = base.toISOString().split('T')[0];
        } else {
            calMonth += delta;
            if (calMonth > 11) { calMonth = 0; calYear++; }
            if (calMonth < 0) { calMonth = 11; calYear--; }
            selectedDate = null;
        }
        switchTab('calendar');
    }

    function setCalView(view) {
        calendarView = view;
        if (view === 'day' && !selectedDate) {
            selectedDate = new Date().toISOString().split('T')[0];
        }
        switchTab('calendar');
    }

    function selectDay(dateStr) {
        selectedDate = dateStr;
        const panel = document.getElementById('eng-day-panel');
        if (panel) panel.innerHTML = renderDayPanelHTML(dateStr);
        $$('.eng-cal-day').forEach(el => el.classList.remove('selected'));
        const clicked = [...$$('.eng-cal-day')].find(el => el.onclick?.toString().includes(dateStr));
        if (clicked) clicked.classList.add('selected');
    }

    function renderDayPanelHTML(dateStr) {
        const data = ED.getEventsForDate(dateStr);
        const dayLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('ru-RU', {day:'numeric',month:'long',weekday:'long'});
        const SRC = {client:'👤', manager:'👔', master:'🔧'};
        let html = `<div class="eng-card"><h3 style="margin:0 0 1rem">📅 ${dayLabel}</h3>`;

        // Requests
        if (data.requests.length) {
            html += `<div style="margin-bottom:1rem"><h4 style="font-size:0.85rem;color:var(--text-muted);margin:0 0 0.5rem">📋 Заявки (${data.requests.length})</h4>`;
            data.requests.forEach(r => {
                html += `<div class="eng-request-card" style="margin-bottom:0.75rem;padding:1rem" onclick="EngineerUI.openMontageCard('req','${r.id}')">
                    <div style="display:flex;justify-content:space-between;align-items:center">
                        <span class="eng-status eng-status-new">${r.type}</span>
                        <span style="font-size:0.75rem">${SRC[r.source]||r.source}</span>
                    </div>
                    <h4 style="margin:0.5rem 0 0.25rem">${r.client}</h4>
                    <p class="text-muted" style="font-size:0.82rem;margin:0">${r.address}</p>
                    <div style="margin-top:0.75rem;display:flex;gap:0.5rem">
                        <button class="eng-btn eng-btn-primary eng-btn-sm" style="flex:1" onclick="event.stopPropagation();EngineerUI.acceptRequest('${r.id}')">✅ Принять</button>
                        <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="event.stopPropagation();EngineerUI.openMontageCard('req','${r.id}')">📋 Карточка</button>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        // Objects (montages)
        if (data.objects.length) {
            html += `<div style="margin-bottom:1rem"><h4 style="font-size:0.85rem;color:var(--text-muted);margin:0 0 0.5rem">🏗️ Монтажи (${data.objects.length})</h4>`;
            data.objects.forEach(o => {
                const totalPh = o.photos ? Object.values(o.photos).reduce((s,v)=>s+v,0) : 0;
                html += `<div class="eng-object-card" style="margin-bottom:0.75rem" onclick="EngineerUI.openMontageCard('obj','${o.id}')">
                    <div class="eng-object-header"><span class="eng-status eng-status-${ED.STATUS_CSS[o.status]}">${ED.STATUSES[o.status]}</span><span style="font-weight:700">${o.type}</span></div>
                    <div class="eng-object-body" style="padding:0.75rem 1rem">
                        <h4 style="margin:0">${o.client}</h4>
                        <p class="text-muted" style="font-size:0.82rem;margin:0.2rem 0">${o.address}</p>
                        <div style="display:flex;gap:1rem;margin-top:0.5rem;font-size:0.82rem">
                            <span>📸 ${totalPh}</span><span>📊 ${o.progress||0}%</span><span>${formatPrice(o.budget||0)}</span>
                        </div>
                        <div class="eng-object-progress" style="margin-top:0.5rem"><div class="eng-object-progress-fill" style="width:${o.progress||0}%"></div></div>
                    </div>
                </div>`;
            });
            html += '</div>';
        }

        // Calendar events
        if (data.events.length) {
            html += `<div><h4 style="font-size:0.85rem;color:var(--text-muted);margin:0 0 0.5rem">📌 События (${data.events.length})</h4>`;
            data.events.forEach(e => {
                html += `<div class="eng-notif-item" style="margin-bottom:0.5rem"><div class="eng-notif-icon">⏰</div><div><strong>${e.time}</strong> — ${e.title}</div></div>`;
            });
            html += '</div>';
        }

        if (!data.requests.length && !data.objects.length && !data.events.length) {
            html += '<div class="eng-empty" style="padding:2rem"><div class="eng-empty-icon">📭</div><h3>Свободный день</h3><p>Нет задач</p></div>';
        }

        html += `<div style="margin-top:1rem"><button class="eng-btn eng-btn-primary" style="width:100%" onclick="window.EngineerWizard ? EngineerWizard.open('${dateStr}') : EngineerUI.addRequestFromCalendar('${dateStr}')">+ Новый объект на этот день</button></div></div>`;
        return html;
    }

    // === MONTAGE CARD (inline modal in calendar) ===
    function openMontageCard(type, id) {
        let item, title;
        if (type === 'obj') {
            item = ED.objects.find(o => o.id === id);
            if (!item) return;
            title = `🏗️ ${item.client} — ${item.type}`;
        } else {
            item = ED.requests.find(r => r.id === id);
            if (!item) return;
            title = `📋 ${item.client} — ${item.type}`;
        }
        const photoKeys = ['before','measures','obstacles','during','hidden','after','problems'];
        const totalPh = item.photos ? (typeof item.photos === 'object' ? Object.values(item.photos).reduce((s,v)=>s+v,0) : item.photos) : 0;

        const overlay = document.createElement('div');
        overlay.className = 'eng-modal-overlay';
        overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
            <div class="eng-modal" style="max-width:700px">
                <div class="eng-modal-header"><h3 style="margin:0">${title}</h3><button class="eng-modal-close" onclick="this.closest('.eng-modal-overlay').remove()">×</button></div>
                <div class="eng-modal-body">
                    <div class="eng-object-info" style="margin-bottom:1rem">
                        <dt>📍 Адрес</dt><dd>${item.address}</dd>
                        <dt>📞 Телефон</dt><dd>${item.phone||'—'}</dd>
                        ${type==='obj' ? `<dt>💰 Бюджет</dt><dd>${formatPrice(item.budget||0)}</dd>
                        <dt>📊 Прогресс</dt><dd>${item.progress||0}%</dd>
                        <dt>👷 Бригада</dt><dd>${item.brigade?.name||'Не назначена'}</dd>` : `
                        <dt>💰 Бюджет</dt><dd>${formatPrice(item.budget||0)}</dd>
                        <dt>⏳ Срочность</dt><dd>${item.urgency||'обычная'}</dd>`}
                    </div>
                    ${item.comment ? `<div class="eng-card" style="margin-bottom:1rem"><p style="margin:0;font-size:0.9rem">💬 ${item.comment}</p></div>` : ''}
                    ${type==='obj' ? `
                    <div class="eng-card" style="margin-bottom:1rem">
                        <h4 style="margin:0 0 0.75rem">📸 Фотофиксация (${totalPh} фото)</h4>
                        <div class="eng-photo-category-tabs" style="margin-bottom:0.75rem">
                            ${ED.PHOTO_CATS.map((cat,i) => `<button class="eng-photo-cat-btn ${i===0?'active':''}" onclick="EngineerUI.selectPhotoCat(this,'${id}','${cat}')">${cat} (${item.photos?.[photoKeys[i]]||0})</button>`).join('')}
                        </div>
                        <div style="text-align:center;border:2px dashed var(--border);border-radius:12px;padding:1.5rem;margin-bottom:0.75rem"
                             ondragover="event.preventDefault();this.style.borderColor='var(--primary)'"
                             ondragleave="this.style.borderColor='var(--border)'"
                             ondrop="event.preventDefault();this.style.borderColor='var(--border)';EngineerUI.handlePhotoDrop(event,'${id}')">
                            <input type="file" id="eng-mc-photo" accept="image/*" multiple style="display:none" onchange="EngineerUI.handlePhotoUpload(event,'${id}')">
                            <button class="eng-btn eng-btn-primary" onclick="document.getElementById('eng-mc-photo').click()">📷 Загрузить фото</button>
                            <p class="text-muted" style="margin:0.5rem 0 0;font-size:0.8rem">Перетащите или нажмите</p>
                        </div>
                        <div class="eng-photo-grid" id="eng-photo-preview">
                            ${Array.from({length: Math.min(totalPh, 6)}, (_, i) => `<div class="eng-photo-item"><img src="https://picsum.photos/seed/${id}${i}/300/300" alt="Photo"><div class="eng-photo-label">Фото ${i+1}</div></div>`).join('') || '<p class="text-muted" style="text-align:center">Нет фото</p>'}
                        </div>
                        <button class="eng-btn eng-btn-success" style="width:100%;margin-top:1rem" onclick="EngineerUI.sendPhotosToClient('${id}')">📤 Отправить фото клиенту</button>
                    </div>
                    ${item.measurements && Object.keys(item.measurements).length ? `
                    <div class="eng-card"><h4 style="margin:0 0 0.5rem">📐 Замеры</h4>
                        <div class="eng-object-info">${Object.entries(item.measurements).map(([k,v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</div>
                    </div>` : ''}
                    ` : ''}
                </div>
                <div class="eng-modal-footer">
                    ${type==='req' ? `<button class="eng-btn eng-btn-primary" onclick="EngineerUI.acceptRequest('${id}');this.closest('.eng-modal-overlay').remove()">✅ Принять заявку</button>` : `
                    <button class="eng-btn eng-btn-secondary" onclick="EngineerUI.openObject('${id}');this.closest('.eng-modal-overlay').remove()">🔧 Полная карточка</button>
                    <button class="eng-btn eng-btn-primary" onclick="EngineerUI.runAI('${id}');this.closest('.eng-modal-overlay').remove()">🤖 AI-просчёт</button>`}
                    <button class="eng-btn eng-btn-secondary" onclick="this.closest('.eng-modal-overlay').remove()">Закрыть</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
    }

    function addRequestFromCalendar(preDate) {
        const brigades = ED.getAllBrigades();
        const overlay = document.createElement('div');
        overlay.className = 'qaz-modal-overlay';
        overlay.style.zIndex = '999999';
        
        const dateVal = preDate || selectedDate || new Date().toISOString().split('T')[0];

        overlay.innerHTML = `
            <div class="qaz-modal-card" style="text-align:left; max-width:450px">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
                    <h3 style="margin:0;font-size:1.2rem;color:#fff">📋 Новая заявка / Объект</h3>
                    <button class="eng-modal-close" onclick="this.closest('.qaz-modal-overlay').remove()" style="background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer">&times;</button>
                </div>
                <div class="eng-form-group" style="margin-bottom:0.75rem">
                    <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-muted)">Имя клиента</label>
                    <input type="text" id="newReqClient" placeholder="Иван Петров" style="width:100%;padding:0.6rem;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:#fff">
                </div>
                <div class="eng-form-group" style="margin-bottom:0.75rem">
                    <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-muted)">Адрес объекта</label>
                    <input type="text" id="newReqAddress" placeholder="Город, улица, дом" style="width:100%;padding:0.6rem;border-radius:8px;background:rgba(255,255,255,0.05);border:1px solid var(--border);color:#fff">
                </div>
                <div class="eng-form-group" style="margin-bottom:0.75rem">
                    <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-muted)">Тип работ</label>
                    <select id="newReqType" style="width:100%;padding:0.6rem;border-radius:8px;background:var(--bg-card);border:1px solid var(--border);color:#fff">
                        ${ED.WORK_TYPES.map(t => `<option value="${t}">${t}</option>`).join('')}
                    </select>
                </div>
                <div class="eng-form-group" style="margin-bottom:1rem">
                    <label style="display:block;margin-bottom:0.25rem;font-size:0.85rem;color:var(--text-muted)">Назначить Исполнителя / Бригаду</label>
                    <select id="newReqBrigade" style="width:100%;padding:0.6rem;border-radius:8px;background:var(--bg-card);border:1px solid var(--border);color:#fff">
                        <option value="">Не назначать (создать просто заявку)</option>
                        ${brigades.map(b => `<option value="${b.id}">${b.avatar} ${b.name} (${b.spec})</option>`).join('')}
                    </select>
                </div>
                <div class="qaz-modal-actions" style="margin-top:1.5rem">
                    <button class="qaz-modal-btn cancel" onclick="this.closest('.qaz-modal-overlay').remove()">Отмена</button>
                    <button class="qaz-modal-btn confirm" id="newReqSubmit">Создать</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        overlay.querySelector('#newReqSubmit').onclick = () => {
            const client = document.getElementById('newReqClient').value.trim();
            const address = document.getElementById('newReqAddress').value.trim();
            const type = document.getElementById('newReqType').value;
            const brigadeId = document.getElementById('newReqBrigade').value;

            if (!client || !address) {
                showToast('Заполните Имя и Адрес');
                return;
            }

            const req = ED.addRequest({client, address, type, source: 'master', scheduledDate: dateVal});
            
            if (brigadeId) {
                const newObj = ED.acceptRequest(req.id);
                if (newObj) {
                    ED.assignBrigade(newObj.id, brigadeId);
                    showToast('✅ Объект создан и бригада назначена!');
                    overlay.remove();
                    switchTab('objects');
                    return;
                }
            }
            
            showToast('📋 Заявка создана!');
            overlay.remove();
            switchTab('calendar');
        };
    }

    function sendPhotosToClient(objId) {
        const obj = ED.objects.find(o => o.id === objId);
        if (!obj) return;
        const totalPh = obj.photos ? Object.values(obj.photos).reduce((s,v)=>s+v,0) : 0;
        if (!totalPh) { showToast('⚠️ Нет фото для отправки'); return; }
        ED.addNotification('📤', `Фотоотчёт (${totalPh} фото) отправлен клиенту ${obj.client}`);
        obj.history = obj.history || [];
        obj.history.push({date: new Date().toISOString().split('T')[0], action: `Фотоотчёт (${totalPh} фото) отправлен клиенту`, by: 'Инженер'});
        ED.saveData();
        showToast(`📤 ${totalPh} фото отправлено клиенту ${obj.client}!`);
    }


    function renderRequests(main) {
        main.innerHTML = `
            <div class="eng-page-header"><h1>📬 Новые заявки (${ED.requests.length})</h1></div>
            ${ED.requests.length ? `<div class="eng-card-grid">${ED.requests.map(r => `
                <div class="eng-request-card">
                    <div class="eng-card-header"><span class="eng-status eng-status-new">${r.type}</span><span class="eng-notif-time">${r.source}</span></div>
                    <h3>${r.client}</h3>
                    <p class="text-muted" style="margin:0.5rem 0">${r.address}</p>
                    <p style="font-size:0.9rem">${r.comment}</p>
                    <div class="eng-request-meta"><span>📸 ${r.photos} фото</span><span>⏳ ${r.urgency}</span><span>📅 ${r.createdAt.split('T')[0]}</span></div>
                    <div style="margin-top:1rem;display:flex;gap:0.5rem">
                        <button class="eng-btn eng-btn-primary eng-btn-sm" style="flex:1" onclick="event.stopPropagation();EngineerUI.acceptRequest('${r.id}')">✅ Принять</button>
                        <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="event.stopPropagation()">📞</button>
                        <button class="eng-btn eng-btn-danger eng-btn-sm" onclick="event.stopPropagation();EngineerUI.deleteReq('${r.id}')">🗑️</button>
                    </div>
                </div>`).join('')}</div>` : '<div class="eng-empty"><div class="eng-empty-icon">📭</div><h3>Нет новых заявок</h3><p>Все заявки обработаны</p></div>'}
        `;
    }

    function renderObjects(main) {
        const totalPhotos = o => o.photos ? Object.values(o.photos).reduce((s,v)=>s+v,0) : 0;
        main.innerHTML = `
            <div class="eng-page-header"><h1>🏗️ Мои объекты (${ED.objects.length})</h1>
                <div class="eng-header-actions">
                    <input type="text" id="engObjSearch" placeholder="🔍 Поиск по клиенту / адресу..." 
                        oninput="EngineerUI.filterObjects(this.value)"
                        style="padding:0.5rem 1rem;border-radius:10px;background:var(--bg-card);color:var(--text);border:1px solid var(--border);font-size:0.85rem;width:250px">
                    <button class="eng-btn eng-btn-primary eng-btn-sm" onclick="EngineerUI.addObjectPrompt()">+ Новый объект</button>
                </div>
            </div>
            ${ED.objects.length ? `<div class="eng-card-grid" id="engObjectsGrid">${ED.objects.map(o => `
                <div class="eng-object-card" data-search="${(o.client+' '+o.address+' '+o.type).toLowerCase()}" onclick="EngineerUI.openObject('${o.id}')">
                    <div class="eng-object-header">
                        <span class="eng-status eng-status-${ED.STATUS_CSS[o.status]}">${ED.STATUSES[o.status]}</span>
                        <div style="display:flex;align-items:center;gap:0.5rem">
                            <span style="font-weight:700">${o.type}</span>
                            <button class="eng-btn eng-btn-danger eng-btn-sm" style="padding:0.2rem 0.5rem;font-size:0.7rem;min-height:auto" onclick="event.stopPropagation();EngineerUI.deleteObj('${o.id}')">🗑️</button>
                        </div>
                    </div>
                    <div class="eng-object-body">
                        <h3>${o.client}</h3>
                        <p class="text-muted">${o.address}</p>
                        <div class="eng-object-info" style="margin-top:1rem">
                            <dt>Бюджет</dt><dd>${formatPrice(o.budget||0)}</dd>
                            <dt>Факт</dt><dd>${formatPrice(o.factCost||0)}</dd>
                            <dt>📸 Фото</dt><dd>${totalPhotos(o)}</dd>
                            <dt>AI</dt><dd>${o.aiDone?'✅ Готов':'⏳ Нет'}</dd>
                        </div>
                        <div class="eng-object-progress" style="margin-top:1rem">
                            <div class="eng-object-progress-fill" style="width:${o.progress||0}%"></div>
                        </div>
                        <p style="margin:0.4rem 0 0;font-size:0.75rem;color:var(--text-muted);text-align:right">${o.progress||0}%</p>
                    </div>
                </div>
            `).join('')}</div>` : '<div class="eng-empty"><div class="eng-empty-icon">🏗️</div><h3>Нет объектов</h3><p>Примите заявку или создайте объект вручную</p></div>'}
        `;
    }

    function filterObjects(query) {
        const q = query.toLowerCase().trim();
        $$('.eng-object-card').forEach(card => {
            const match = !q || card.dataset.search.includes(q);
            card.style.display = match ? '' : 'none';
        });
    }

    function renderPhotos(main) {
        const obj = activeObjectId ? ED.objects.find(o => o.id === activeObjectId) : ED.objects[0];
        const objId = obj ? obj.id : null;
        const photoKeys = ['before','measures','obstacles','during','hidden','after','problems'];
        main.innerHTML = `
            <div class="eng-page-header"><h1>📸 Фото / Видео фиксация</h1>
                ${objId ? `<span class="text-muted" style="font-size:0.9rem">Объект: ${obj.client}</span>` : ''}
            </div>
            ${!objId ? '<div class="eng-empty"><div class="eng-empty-icon">📷</div><h3>Выберите объект</h3><p>Перейдите в раздел Объекты для фотофиксации</p></div>' : `
            <div class="eng-card">
                <div class="eng-photo-category-tabs">
                    ${ED.PHOTO_CATS.map((cat, i) => `
                        <button class="eng-photo-cat-btn ${i===0?'active':''}" data-cat="${cat}" onclick="EngineerUI.selectPhotoCat(this, '${objId}','${cat}')">${cat} (${obj.photos?.[photoKeys[i]]||0})</button>
                    `).join('')}
                </div>
                <div id="eng-photo-dropzone" style="margin:1.5rem 0;text-align:center;border:2px dashed var(--border);border-radius:14px;padding:2rem;transition:all 0.3s"
                     ondragover="event.preventDefault();this.style.borderColor='var(--primary)';this.style.background='rgba(139,92,246,0.05)'"
                     ondragleave="this.style.borderColor='var(--border)';this.style.background='transparent'"
                     ondrop="event.preventDefault();this.style.borderColor='var(--border)';this.style.background='transparent';EngineerUI.handlePhotoDrop(event,'${objId}')">
                    <input type="file" id="eng-photo-input" accept="image/*" multiple style="display:none" onchange="EngineerUI.handlePhotoUpload(event, '${objId}')">
                    <button class="eng-btn eng-btn-primary" onclick="document.getElementById('eng-photo-input').click()" style="padding:1rem 2rem">
                        📷 Загрузить фото
                    </button>
                    <p class="text-muted" style="margin-top:0.5rem;font-size:0.85rem">Перетащите файлы сюда или нажмите кнопку • JPG, PNG, HEIC</p>
                </div>
                <div class="eng-photo-grid" id="eng-photo-preview">
                    ${Array.from({length: Math.min(obj.photos?.[photoKeys[0]]||0, 8)}, (_, i) => `
                        <div class="eng-photo-item"><img src="https://picsum.photos/seed/${objId}${i}/300/300" alt="Photo"><div class="eng-photo-label">Фото ${i+1}</div></div>
                    `).join('') || '<p class="text-muted" style="padding:2rem;text-align:center">Нет фото в этой категории</p>'}
                </div>
            </div>`}`;
    }

    function renderMeasures(main) {
        const obj = activeObjectId ? ED.objects.find(o => o.id === activeObjectId) : null;
        if (!obj) {
            main.innerHTML = `
                <div class="eng-page-header"><h1>📐 Технические замеры</h1></div>
                <div class="eng-card"><h3>Выберите объект</h3>
                    <div class="eng-card-grid" style="margin-top:1rem">${ED.objects.map(o => `
                        <div class="eng-card" style="cursor:pointer" onclick="EngineerUI.openMeasuresFor('${o.id}')">
                            <h4 style="margin:0">${o.client}</h4>
                            <p class="text-muted" style="margin:0.25rem 0">${o.address}</p>
                            <span class="eng-status eng-status-${ED.STATUS_CSS[o.status]}">${o.type}</span>
                        </div>`).join('')}
                    </div>
                </div>`;
            return;
        }
        const m = obj.measurements || {};
        main.innerHTML = `
            <div class="eng-page-header"><h1>📐 Замеры: ${obj.client}</h1>
                <button class="eng-btn eng-btn-secondary" onclick="EngineerUI.switchTab('measures')">← Все объекты</button></div>
            <div class="eng-card"><h3>Форма замеров: ${obj.type}</h3>
                <form class="eng-measure-form" style="margin-top:1.5rem" id="measureForm">
                    <div class="eng-form-group"><label>Длина трассы (м)</label><input type="number" name="length" step="0.1" value="${m.length||''}"></div>
                    <div class="eng-form-group"><label>Глубина (м)</label><input type="number" name="depth" step="0.1" value="${m.depth||''}"></div>
                    <div class="eng-form-group"><label>Диаметр трубы</label><select name="diameter"><option ${m.diameter==='Ø32'?'selected':''}>Ø32</option><option ${m.diameter==='Ø50'?'selected':''}>Ø50</option><option ${m.diameter==='Ø110'?'selected':''}>Ø110</option></select></div>
                    <div class="eng-form-group"><label>Тип грунта</label><select name="soil"><option ${m.soil==='обычный'?'selected':''}>обычный</option><option ${m.soil==='глина'?'selected':''}>глина</option><option ${m.soil==='скальник'?'selected':''}>скальник</option></select></div>
                    <div class="eng-form-group"><label>Наличие асфальта</label><select name="asphalt"><option value="false" ${!m.asphalt?'selected':''}>Нет</option><option value="true" ${m.asphalt?'selected':''}>Да</option></select></div>
                    <div class="eng-form-group"><label>Колодцы (шт)</label><input type="number" name="wells" value="${m.wells||0}"></div>
                    <div class="eng-form-group"><label>Уклон (см/м)</label><input type="text" name="uklone" value="${m.uklone||''}"></div>
                </form>
                <div style="margin-top:1.5rem;text-align:right">
                    <button class="eng-btn eng-btn-primary" onclick="EngineerUI.saveMeasures('${obj.id}')">💾 Сохранить замеры</button>
                </div>
            </div>`;
    }

    function openMeasuresFor(objId) {
        activeObjectId = objId;
        renderMeasures($('#eng-main-content'));
    }

    function renderAI(main) {
        const geminiOk = window.GeminiService && GeminiService.isConfigured();
        const geminiModel = geminiOk ? GeminiService.getModel() : null;
        const obj = activeObjectId ? ED.objects.find(o=>o.id===activeObjectId) : ED.objects.find(o=>!o.aiDone);
        main.innerHTML = `
            <div class="eng-page-header"><h1>🤖 AI-просчёт объекта</h1>
                <button class="eng-btn eng-btn-primary" onclick="EngineerUI.runAI()">🚀 Запустить просчёт</button></div>
            <div class="eng-card" style="margin-bottom:1rem">
                <h3>Статус AI-движков</h3>
                <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-top:0.75rem">
                    <div style="padding:0.6rem 1rem;border-radius:10px;background:${geminiOk?'rgba(34,197,94,0.12)':'rgba(239,68,68,0.12)'};border:1px solid ${geminiOk?'rgba(34,197,94,0.2)':'rgba(239,68,68,0.2)'}">
                        <strong>${geminiOk?'✅':'❌'} Gemini API</strong>
                        <div style="font-size:0.8rem;color:var(--text-muted)">${geminiOk ? geminiModel : 'Ключ не настроен'}</div>
                    </div>
                    <div style="padding:0.6rem 1rem;border-radius:10px;background:${window.SmartEstimateEngine?'rgba(34,197,94,0.12)':'rgba(245,158,11,0.12)'};border:1px solid ${window.SmartEstimateEngine?'rgba(34,197,94,0.2)':'rgba(245,158,11,0.2)'}">
                        <strong>${window.SmartEstimateEngine?'✅':'⚠️'} SmartEstimate</strong>
                        <div style="font-size:0.8rem;color:var(--text-muted)">${window.SmartEstimateEngine?'Локальный расчёт':'Не загружен'}</div>
                    </div>
                </div>
                ${obj ? `<div style="margin-top:1rem;padding:0.6rem 1rem;border-radius:10px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.15)">
                    <strong>Объект:</strong> ${obj.client} — ${obj.type}
                    ${obj.aiBackend ? `<div style="font-size:0.82rem;color:var(--text-muted);margin-top:0.2rem">Последний просчёт: <strong>${obj.aiBackend}</strong>${obj.aiModel ? ` (${obj.aiModel})` : ''}</div>` : ''}
                </div>` : ''}
            </div>
            <div class="eng-card"><h3>Процесс анализа данных</h3>
                <div class="eng-ai-steps" id="ai-steps-container">
                    ${ED.AI_STEPS.map(step => `
                        <div class="eng-ai-step pending"><div class="eng-ai-step-icon">${step.icon}</div>
                            <div style="flex:1"><strong>${step.name}</strong><p class="text-muted" style="margin:0;font-size:0.8rem">Ожидание...</p></div>
                        </div>`).join('')}
                </div>
            </div>`;
    }

    function renderEstimates(main) {
        const obj = activeObjectId ? ED.objects.find(o=>o.id===activeObjectId) : ED.objects[0];
        const estItems = obj ? ED.getEstimateForObject(obj.id) : ED.estimate;
        const total = estItems.reduce((s,i) => s + i.total, 0);
        const backendLabel = obj?.aiBackend === 'gemini' ? `🤖 Gemini (${obj.aiModel||''})` :
                             obj?.aiBackend === 'smartEstimate' ? '⚙️ SmartEstimate' :
                             obj?.aiBackend === 'fallback' ? '📐 Расчёт по замерам' : '📄 Общая';
        const canSend = obj && estItems.length > 0 && total > 0;
        const sentBadge = obj?.estimateSentAt
            ? `<div style="padding:0.5rem 1rem;background:rgba(34,197,94,0.12);border-radius:8px;margin-bottom:1rem;font-size:0.85rem">✅ Смета отправлена заказчику <strong>${obj.client}</strong> — ${obj.estimateSentAt}</div>`
            : '';
        main.innerHTML = `
            <div class="eng-page-header"><h1>📄 Сметная документация</h1>
                <div class="eng-header-actions">
                    <span style="font-size:0.82rem;color:var(--text-muted)">${backendLabel}</span>
                    ${canSend ? `<button class="eng-btn eng-btn-success eng-btn-sm" onclick="EngineerUI.sendEstimateToCustomer('${obj.id}')">📤 Отправить заказчику</button>` : ''}
                    <button class="eng-btn eng-btn-primary eng-btn-sm" onclick="EngineerUI.approveEstimate()">✅ Утвердить</button>
                </div></div>
            <div class="eng-card">
                ${sentBadge}
                <table class="eng-estimate-table"><thead><tr><th>Наименование</th><th>Ед.</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
                    <tbody>${estItems.map(item => `<tr><td>${item.name}</td><td>${item.unit}</td><td>${item.qty}</td><td>${formatPrice(item.price)}</td><td>${formatPrice(item.total)}</td></tr>`).join('')}</tbody>
                    <tfoot><tr class="total-row"><td colspan="4">ИТОГО</td><td>${formatPrice(total)}</td></tr></tfoot>
                </table>
            </div>`;
    }

    // Send estimate to customer via localStorage cross-role channel + API sync
    async function sendEstimateToCustomer(objId) {
        const obj = ED.objects.find(o => o.id === objId);
        if (!obj) return;
        const estItems = ED.getEstimateForObject(objId);
        if (!estItems.length) { showToast('⚠️ Нет позиций в смете'); return; }
        const total = estItems.reduce((s,i) => s + i.total, 0);
        const sentAt = new Date().toLocaleString('ru-RU', {day:'numeric',month:'long',hour:'2-digit',minute:'2-digit'});

        // 1. Cross-role localStorage channel (works even offline)
        try {
            const inbox = JSON.parse(localStorage.getItem('customerInbox') || '[]');
            inbox.unshift({
                id: ED.genId('est'),
                type: 'estimate',
                from: 'engineer',
                engineerOrg: _activeOrg ? _activeOrg.name : 'Компания',
                client: obj.client,
                address: obj.address,
                workType: obj.type,
                total,
                items: estItems,
                sentAt,
                read: false
            });
            localStorage.setItem('customerInbox', JSON.stringify(inbox));
        } catch(e) {
            console.warn('[sendEstimate] localStorage failed:', e.message);
        }

        // 2. API sync if order has apiId (best-effort)
        try {
            const API = window.API || window.APIService;
            if (API && API.Orders && obj.apiId) {
                await API.Orders.changeOrderStatus(obj.apiId, 'estimated');
            }
        } catch(e) {
            console.warn('[sendEstimate] API sync failed:', e.message);
        }

        // 3. Mark object
        ED.updateObject(objId, { estimateSentAt: sentAt, estimateReady: true });
        obj.history = obj.history || [];
        obj.history.push({
            date: new Date().toISOString().split('T')[0],
            action: `Смета отправлена заказчику: ${formatPrice(total)}`,
            by: 'Инженер'
        });
        ED.saveData();
        ED.addNotification('📤', `Смета ${formatPrice(total)} отправлена клиенту ${obj.client}`);
        showToast(`📤 Смета отправлена заказчику! (${formatPrice(total)})`);
        renderEstimates($('#eng-main-content'));
    }


    function renderBrigades(main) {
        const allBrigades = ED.getAllBrigades();
        main.innerHTML = `
            <div class="eng-page-header"><h1>👷 Управление бригадами (${allBrigades.length})</h1>
                <button class="eng-btn eng-btn-primary" onclick="EngineerUI.addBrigadePrompt()">+ Новая бригада</button></div>
            <div class="eng-card-grid">${allBrigades.map(b => {
                const isCustom = b.id.startsWith('br_') && !ED.BRIGADES.find(x => x.id === b.id);
                // Timer: find object with this brigade
                let timerHTML = '';
                const assignedObj = ED.objects.find(o => o.brigade && o.brigade.id === b.id);
                if (assignedObj && assignedObj.brigade.startDate) {
                    const start = new Date(assignedObj.brigade.startDate);
                    const durDays = parseInt(assignedObj.brigade.duration) || 3;
                    const end = new Date(start); end.setDate(end.getDate() + durDays);
                    const remaining = Math.ceil((end - new Date()) / 86400000);
                    timerHTML = remaining > 0
                        ? `<div style="margin-top:0.5rem;padding:0.4rem 0.8rem;background:rgba(245,158,11,0.15);border-radius:8px;font-size:0.82rem">⏱️ Осталось <strong>${remaining}</strong> дн. на объекте: ${assignedObj.client}</div>`
                        : `<div style="margin-top:0.5rem;padding:0.4rem 0.8rem;background:rgba(239,68,68,0.15);border-radius:8px;font-size:0.82rem">⚠️ Просрочено на ${Math.abs(remaining)} дн.</div>`;
                }
                return `<div class="eng-brigade-card"><div class="eng-brigade-avatar">${b.avatar}</div>
                    <div style="flex:1"><h3 style="margin:0">Бригада: ${b.name}</h3>
                        <p class="text-muted" style="margin:0.25rem 0">${b.spec} / ${b.workers} чел.</p>
                        <div class="eng-status eng-status-${b.status==='free'?'done':'work'}">${b.status==='free'?'Свободна':'В работе'}</div>
                        <p style="margin:0.25rem 0;font-size:0.85rem">${formatPrice(b.pricePerDay)}/день</p>
                        ${timerHTML}
                    </div>
                    ${isCustom ? `<button class="eng-btn eng-btn-danger eng-btn-sm" style="align-self:flex-start" onclick="event.stopPropagation();EngineerUI.deleteBrigadePrompt('${b.id}')">🗑️</button>` : ''}
                </div>`;
            }).join('')}
            </div>`;
    }

    function renderMaterials(main) {
        main.innerHTML = `
            <div class="eng-page-header"><h1>📦 Материалы и склад (${ED.materials.length})</h1>
                <button class="eng-btn eng-btn-primary" onclick="EngineerUI.addMaterialPrompt()">+ Добавить материал</button></div>
            <div class="eng-card"><table class="eng-estimate-table">
                <thead><tr><th>Материал</th><th>Ед.</th><th>Кол-во</th><th>Цена</th><th>Наличие</th><th></th></tr></thead>
                <tbody>${ED.materials.map(m => `<tr>
                    <td>${m.name}</td><td>${m.unit}</td><td>${m.qty||0}</td><td>${formatPrice(m.price)}</td>
                    <td>${m.inStock ? '<span class="eng-status eng-status-done">Есть</span>' : '<span class="eng-status eng-status-problem">Заказать</span>'}</td>
                    <td><button class="eng-btn eng-btn-danger eng-btn-sm" style="padding:0.2rem 0.5rem;font-size:0.7rem;min-height:auto" onclick="EngineerUI.deleteMat('${m.id}')">🗑️</button></td>
                </tr>`).join('')}</tbody>
            </table></div>`;
    }

    function renderReports(main) {
        const obj = activeObjectId ? ED.objects.find(o=>o.id===activeObjectId) : ED.objects[0];
        main.innerHTML = `
            <div class="eng-page-header"><h1>📋 Отчёты и акты</h1>
                ${obj ? `<span class="text-muted" style="font-size:0.9rem">Объект: ${obj.client}</span>` : ''}
            </div>
            <div class="eng-card-grid">
                <div class="eng-card"><h3>📄 Акт выполненных работ</h3><p class="text-muted">Форма для закрытия объекта с расчётами</p>
                    <button class="eng-btn eng-btn-primary" style="width:100%;margin-top:1rem" onclick="EngineerUI.generatePDF()">📄 Сформировать PDF</button></div>
                <div class="eng-card"><h3>🖼️ Фотоотчёт для клиента</h3><p class="text-muted">До / Во время / После — автоматический PDF</p>
                    <button class="eng-btn eng-btn-primary" style="width:100%;margin-top:1rem" onclick="EngineerUI.generatePhotoReport()">🖼️ Собрать фотоотчёт</button></div>
                <div class="eng-card"><h3>📊 Экспорт расходов</h3><p class="text-muted">Выгрузить все расходы в CSV</p>
                    <button class="eng-btn eng-btn-secondary" style="width:100%;margin-top:1rem" onclick="EngineerUI.exportExpenses()">📊 Скачать CSV</button></div>
                <div class="eng-card"><h3>📊 Выгрузка базы (Excel)</h3><p class="text-muted">Экспорт объектов и бригад в XLSX</p>
                    <div style="display:flex;gap:0.5rem;margin-top:1rem">
                        <button class="eng-btn eng-btn-primary" style="flex:1" onclick="window.EngineerExcelIO && EngineerExcelIO.exportObjects()">🏗️ Объекты</button>
                        <button class="eng-btn eng-btn-secondary" style="flex:1" onclick="window.EngineerExcelIO && EngineerExcelIO.exportBrigades()">👷 Бригады</button>
                    </div>
                </div>
            </div>`;
    }

    function renderExpenses(main) {
        const totalFact = ED.objects.reduce((s,o) => s+(o.factCost||0), 0);
        const totalPlan = ED.objects.reduce((s,o) => s+(o.planCost||0), 0);
        const expTotal = ED.expenses.reduce((s,c) => s+c.items.reduce((ss,i) => ss+i.amount, 0), 0);
        main.innerHTML = `
            <div class="eng-page-header"><h1>💰 Учёт расходов</h1>
                <div class="eng-header-actions">
                    <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="EngineerUI.exportExpenses()">📊 CSV</button>
                    <button class="eng-btn eng-btn-primary eng-btn-sm" onclick="EngineerUI.addExpensePrompt()">+ Добавить расход</button>
                </div></div>
            <div class="eng-expense-comparison">
                <div class="eng-expense-item neutral"><div class="value">${formatPrice(totalPlan)}</div><div class="label">План</div></div>
                <div class="eng-expense-item ${totalFact>totalPlan?'negative':'positive'}"><div class="value">${formatPrice(totalFact)}</div><div class="label">Факт</div></div>
                <div class="eng-expense-item positive"><div class="value">${formatPrice(ED.objects.reduce((s,o) => s+(o.budget-o.factCost), 0))}</div><div class="label">Прибыль</div></div>
            </div>
            <div class="eng-card"><h3>Детализация (${formatPrice(expTotal)} всего)</h3>
                <div style="margin-top:1rem">${ED.expenses.map((exp, ci) => `
                    <div style="margin-bottom:1rem"><h4 style="color:var(--primary)">${exp.cat}</h4>
                        <div style="padding-left:1rem;border-left:2px solid var(--border)">${exp.items.map((i, ii) => `
                            <div style="display:flex;justify-content:space-between;align-items:center;margin:0.25rem 0">
                                <span>${i.name}</span>
                                <div style="display:flex;align-items:center;gap:0.5rem">
                                    <strong>${formatPrice(i.amount)}</strong>
                                    <button class="eng-btn eng-btn-danger eng-btn-sm" style="padding:0.15rem 0.4rem;font-size:0.65rem;min-height:auto" onclick="EngineerUI.deleteExpenseItem(${ci},${ii})">✕</button>
                                </div>
                            </div>`).join('')}
                        </div></div>`).join('')}
                </div>
            </div>`;
    }

    function renderNotifications(main) {
        const unread = ED.notifications.filter(n => n.unread).length;
        main.innerHTML = `
            <div class="eng-page-header"><h1>🔔 Уведомления ${unread ? '('+unread+' новых)' : ''}</h1>
                <button class="eng-btn eng-btn-secondary" onclick="EngineerUI.markAllRead()">✅ Прочитать всё</button></div>
            <div class="eng-card">${ED.notifications.map(n => `
                <div class="eng-notif-item ${n.unread?'unread':''}">
                    <div class="eng-notif-icon">${n.icon}</div>
                    <div style="flex:1"><p style="margin:0">${n.text}</p><span class="eng-notif-time">${n.time}</span></div>
                </div>`).join('')}
            </div>`;
    }

    // --- ACTIONS ---

    function acceptRequest(reqId) {
        const newObj = ED.acceptRequest(reqId);
        if (newObj) {
            showToast(`✅ Заявка принята → объект ${newObj.id} создан`);
            switchTab('objects');
        } else {
            showToast('❌ Заявка не найдена');
        }
    }

    function openObject(objId) {
        activeObjectId = objId;
        renderObjectDetail($('#eng-main-content'), objId);
    }

    function renderObjectDetail(main, objId) {
        const o = ED.objects.find(x => x.id === objId);
        if (!o) { showToast('Объект не найден'); return; }
        const m = o.measurements || {};
        const ph = o.photos || {};
        const totalPhotos = Object.values(ph).reduce((s,v) => s+v, 0);
        const statusOptions = ED.STATUS_FLOW.map(s => `<option value="${s}" ${o.status===s?'selected':''}>${ED.STATUSES[s]}</option>`).join('');
        const brigadeInfo = o.brigade ? `<div class="eng-brigade-card" style="margin-top:1rem"><div class="eng-brigade-avatar">👷</div><div style="flex:1"><h3 style="margin:0">Бригада: ${o.brigade.name}</h3><p class="text-muted" style="margin:0.25rem 0">${o.brigade.spec} / ${o.brigade.workers} чел.</p><p style="margin:0;font-size:0.85rem">Начало: ${o.brigade.startDate} · ${o.brigade.duration} · ${formatPrice(o.brigade.price)}</p></div></div>` : `<div style="margin-top:1rem"><p class="text-muted">Бригада не назначена</p>${ED.BRIGADES.filter(b=>b.status==='free').map(b=>`<button class="eng-btn eng-btn-primary eng-btn-sm" style="margin:0.25rem" onclick="EngineerUI.assignBrigade('${objId}','${b.id}')">${b.avatar} ${b.name} (${b.spec})</button>`).join('')}</div>`;
        main.innerHTML = `
            <div class="eng-page-header"><h1>🏗️ ${o.client}</h1>
                <div><button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="EngineerUI.switchTab('objects')">← Назад</button></div></div>
            <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem">
                <span class="eng-status eng-status-${ED.STATUS_CSS[o.status]}">${ED.STATUSES[o.status]}</span>
                <select id="engStatusSelect" onchange="EngineerUI.changeStatus('${objId}',this.value)" style="padding:0.3rem 0.5rem;border-radius:8px;background:var(--bg-card);color:var(--text);border:1px solid var(--border);font-size:0.8rem">${statusOptions}</select>
                <span style="color:var(--text-muted);font-size:0.85rem">📍 ${o.address}</span>
                <span style="color:var(--text-muted);font-size:0.85rem">📞 ${o.phone||''}</span>
                ${o.gps ? `<span style="color:#22d3ee;font-size:0.82rem">🛰️ ${o.gps}</span>` : ''}
                <button class="eng-btn eng-btn-secondary eng-btn-sm" onclick="EngineerUI.getGPS('${objId}')">📍 GPS</button>
            </div>
            <div class="eng-stats-grid">
                <div class="eng-stat-card"><div class="eng-stat-icon">💰</div><div><div class="eng-stat-value">${formatPrice(o.budget)}</div><div class="eng-stat-label">Бюджет</div></div></div>
                <div class="eng-stat-card"><div class="eng-stat-icon">📊</div><div><div class="eng-stat-value">${o.progress}%</div><div class="eng-stat-label">Прогресс</div></div></div>
                <div class="eng-stat-card"><div class="eng-stat-icon">📸</div><div><div class="eng-stat-value">${totalPhotos}</div><div class="eng-stat-label">Фото</div></div></div>
                <div class="eng-stat-card"><div class="eng-stat-icon">${o.aiDone?'✅':'⏳'}</div><div><div class="eng-stat-value">${o.aiDone?'Готов':'Нет'}</div><div class="eng-stat-label">AI-просчёт</div></div></div>
            </div>
            <div class="eng-card-grid">
                <div class="eng-card"><h3>📐 Замеры</h3>
                    <div style="margin-top:0.75rem">${Object.keys(m).length ? Object.entries(m).map(([k,v])=>`<div style="display:flex;justify-content:space-between;padding:0.3rem 0;border-bottom:1px solid var(--border)"><span style="color:var(--text-muted)">${k}</span><strong>${v}</strong></div>`).join('') : '<p class="text-muted">Замеры не заполнены</p>'}
                    </div>
                    <button class="eng-btn eng-btn-primary eng-btn-sm" style="margin-top:1rem;width:100%" onclick="EngineerUI.editMeasures('${objId}')">✏️ Редактировать замеры</button>
                </div>
                <div class="eng-card"><h3>👷 Бригада</h3>${brigadeInfo}</div>
            </div>
            <div class="eng-card"><h3>📜 История действий (${(o.history||[]).length})</h3>
                <div class="eng-timeline" style="margin-top:0.75rem">${(o.history||[]).slice().reverse().map(h => {
                    const iconMap = {'Заявка':'📋','Осмотр':'🔍','AI':'🤖','Смета':'📄','Бригада':'👷','Статус':'🔄','GPS':'📍','Фото':'📸','Замеры':'📐','Работы':'🏗️'};
                    const icon = Object.entries(iconMap).find(([k]) => h.action.includes(k))?.[1] || '📌';
                    return `<div class="eng-timeline-item">
                        <div style="display:flex;align-items:center;gap:0.5rem">
                            <span style="font-size:1.1rem">${icon}</span>
                            <div style="flex:1">
                                <strong>${h.action}</strong>
                                <div style="display:flex;gap:1rem;margin-top:0.2rem;font-size:0.78rem;color:var(--text-muted)">
                                    <span>📅 ${h.date}</span><span>👤 ${h.by}</span>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}</div>
            </div>`;
    }

    function changeStatus(objId, newStatus) {
        ED.updateObjectStatus(objId, newStatus);
        showToast(`Статус → ${ED.STATUSES[newStatus]}`);
        renderObjectDetail($('#eng-main-content'), objId);
    }

    function assignBrigade(objId, brigadeId) {
        ED.assignBrigade(objId, brigadeId);
        showToast('✅ Бригада назначена!');
        renderObjectDetail($('#eng-main-content'), objId);
    }

    function editMeasures(objId) {
        const o = ED.objects.find(x => x.id === objId);
        if (!o) return;
        const m = o.measurements || {};
        const main = $('#eng-main-content');
        main.innerHTML = `
            <div class="eng-page-header"><h1>📐 Замеры: ${o.client}</h1>
                <button class="eng-btn eng-btn-secondary" onclick="EngineerUI.openObject('${objId}')">← Назад</button></div>
            <div class="eng-card"><h3>Форма замеров: ${o.type}</h3>
                <form class="eng-measure-form" style="margin-top:1.5rem" id="measureForm">
                    <div class="eng-form-group"><label>Длина трассы (м)</label><input type="number" name="length" step="0.1" value="${m.length||''}"></div>
                    <div class="eng-form-group"><label>Глубина (м)</label><input type="number" name="depth" step="0.1" value="${m.depth||''}"></div>
                    <div class="eng-form-group"><label>Диаметр трубы</label><select name="diameter"><option ${m.diameter==='Ø32'?'selected':''}>Ø32</option><option ${m.diameter==='Ø50'?'selected':''}>Ø50</option><option ${m.diameter==='Ø110'?'selected':''}>Ø110</option></select></div>
                    <div class="eng-form-group"><label>Тип грунта</label><select name="soil"><option ${m.soil==='обычный'?'selected':''}>обычный</option><option ${m.soil==='глина'?'selected':''}>глина</option><option ${m.soil==='скальник'?'selected':''}>скальник</option></select></div>
                    <div class="eng-form-group"><label>Колодцы (шт)</label><input type="number" name="wells" value="${m.wells||0}"></div>
                    <div class="eng-form-group"><label>Уклон (см/м)</label><input type="text" name="uklone" value="${m.uklone||''}"></div>
                </form>
                <div style="margin-top:1.5rem;text-align:right">
                    <button class="eng-btn eng-btn-primary" onclick="EngineerUI.saveMeasures('${objId}')">💾 Сохранить замеры</button>
                </div>
            </div>`;
    }

    function saveMeasures(objId) {
        const form = document.getElementById('measureForm');
        if (!form) return;
        const fd = new FormData(form);
        const data = {};
        for (const [k,v] of fd.entries()) { data[k] = isNaN(v) || v==='' ? v : Number(v); }
        ED.saveMeasurements(objId, data);
        showToast('💾 Замеры сохранены!');
        renderObjectDetail($('#eng-main-content'), objId);
    }

    function runAI(objIdArg) {
        const obj = objIdArg ? ED.objects.find(o=>o.id===objIdArg) :
                    activeObjectId ? ED.objects.find(o=>o.id===activeObjectId) :
                    ED.objects.find(o=>!o.aiDone);
        if (!obj) { showToast('Нет объектов для анализа'); return; }

        const TYPE_MAP = {
            'Водопровод': 'pipe_hdpe', 'Канализация': 'pipe_pvc',
            'Септик': 'plumbing', 'Отопление': 'hvac',
            'Фундамент': 'foundation_strip', 'Стены': 'wall_block',
            'Кровля': 'roof_gable', 'Стяжка': 'floor_screed',
            'Электрика': 'electrical', 'Фасад': 'facade'
        };
        const engineType = TYPE_MAP[obj.type] || 'generic';
        const m = obj.measurements || {};
        const city = _activeOrg ? _activeOrg.city : 'Караганда';

        showToast('🤖 AI-анализ запущен...');

        // Animate steps
        const steps = $$('.eng-ai-step');
        let cur = 0;
        const stepLabels = [
            'Подключение к Gemini AI...', 'Анализ параметров объекта...',
            'Расчёт материалов по СНиП...', 'Региональные коэффициенты...',
            'Формирование сметы...'
        ];

        const interval = setInterval(async () => {
            if (cur >= steps.length) {
                clearInterval(interval);

                // === TIER 1: Real Gemini LLM call ===
                let geminiSuccess = false;
                if (window.GeminiService && GeminiService.isConfigured()) {
                    try {
                        console.log('[EngineerAI] 🚀 Calling Gemini API...');
                        const description = `${obj.type} — ${obj.address}. Клиент: ${obj.client}. ` +
                            `Параметры: длина ${m.length||'н/д'} м, глубина ${m.depth||'н/д'} м, ` +
                            `диаметр ${m.diameter||'н/д'}, грунт: ${m.soil||'н/д'}, ` +
                            `колодцев: ${m.wells||0}, асфальт: ${m.asphalt?'да':'нет'}. ` +
                            `Регион: ${city}, Казахстан.`;

                        const geminiResult = await GeminiService.analyzeConstructionPhoto(null, {
                            category: obj.type,
                            description: description,
                            region: city,
                            onProgress: (p) => {
                                console.log(`[Gemini] ${p.stage}: ${p.message}`);
                            }
                        });

                        if (geminiResult && geminiResult.estimate_items && geminiResult.estimate_items.length > 0) {
                            console.log('[EngineerAI] ✅ Gemini returned', geminiResult.estimate_items.length, 'items');
                            const newEstimate = geminiResult.estimate_items.map(item => ({
                                name: item.name,
                                unit: item.unit || 'шт',
                                qty: item.quantity || 1,
                                price: item.price || 0,
                                total: (item.quantity || 1) * (item.price || 0)
                            }));

                            ED.estimate.length = 0;
                            newEstimate.forEach(item => ED.estimate.push(item));
                            ED.saveEstimateForObject(obj.id, [...newEstimate]);

                            const totalCost = newEstimate.reduce((s,i) => s + (i.total||0), 0);
                            ED.updateObject(obj.id, {
                                planCost: totalCost,
                                aiAccuracy: geminiResult.confidence || 85,
                                aiRegion: city,
                                aiType: geminiResult.objectType || engineType,
                                aiBackend: 'gemini',
                                aiModel: GeminiService.getModel()
                            });

                            // Add to history
                            obj.history = obj.history || [];
                            obj.history.push({
                                date: new Date().toISOString().split('T')[0],
                                action: `AI Gemini (${GeminiService.getModel()}): смета ${newEstimate.length} позиций, ${formatPrice(totalCost)}`,
                                by: 'Gemini AI'
                            });

                            geminiSuccess = true;
                            ED.addNotification('🤖', `Gemini AI: смета для ${obj.client} — ${formatPrice(totalCost)}`);
                        } else {
                            console.warn('[EngineerAI] Gemini returned empty result, falling back');
                        }
                    } catch(e) {
                        console.warn('[EngineerAI] Gemini error:', e.message, '— falling back to SmartEstimate');
                    }
                }

                // === TIER 2: SmartEstimateEngine (local) ===
                if (!geminiSuccess) {
                    let estimate = null;
                    if (window.SmartEstimateEngine && typeof SmartEstimateEngine.build === 'function') {
                        try {
                            estimate = SmartEstimateEngine.build({
                                objectType: engineType,
                                qwenResult: null,
                                objectParams: {
                                    length: m.length || 20,
                                    width: m.diameter ? parseFloat(m.diameter.replace(/[^0-9.]/g,''))/1000 || 0.5 : 0.5,
                                    depth: m.depth || 1.2,
                                    height: m.depth || 1.5,
                                    perimeter: (m.length || 20) * 2
                                },
                                region: city,
                                manualItems: []
                            });
                            console.log('[EngineerAI] SmartEstimate result:', estimate);
                        } catch(e) {
                            console.warn('[EngineerAI] SmartEstimate error:', e);
                        }
                    }

                    if (estimate && estimate.sections) {
                        const newEstimate = [];
                        (estimate.sections.works || []).forEach(w => {
                            newEstimate.push({name: w.name, unit: w.unit, qty: w.qty, price: w.price, total: w.subtotal});
                        });
                        (estimate.sections.materials || []).forEach(mat => {
                            newEstimate.push({name: mat.name + ' (материал)', unit: mat.unit, qty: mat.qtyWithWaste || mat.qty, price: mat.price, total: mat.subtotal});
                        });
                        if (estimate.sections.labor) {
                            const lb = estimate.sections.labor;
                            newEstimate.push({name: 'Трудозатраты (' + lb.totalHours + ' ч.ч.)', unit: 'ч.ч.', qty: lb.totalHours, price: lb.tariffPerHour, total: lb.subtotal});
                        }
                        (estimate.sections.equipment || []).forEach(eq => {
                            newEstimate.push({name: eq.name + ' (аренда)', unit: eq.unit, qty: eq.machineHours, price: eq.hourlyRate, total: eq.subtotal});
                        });

                        ED.estimate.length = 0;
                        newEstimate.forEach(item => ED.estimate.push(item));
                        ED.saveEstimateForObject(obj.id, [...newEstimate]);
                        const totalCost = estimate.totals.grand || newEstimate.reduce((s,i) => s + (i.total||0), 0);
                        ED.updateObject(obj.id, {
                            planCost: totalCost, aiAccuracy: estimate.accuracy || 70,
                            aiRegion: city, aiType: engineType, aiBackend: 'smartEstimate'
                        });
                    } else {
                        // === TIER 3: Manual fallback ===
                        const length = m.length || 20;
                        const depth = m.depth || 1.2;
                        const volume = Math.round(length * 0.5 * depth * 10) / 10;
                        const wells = m.wells || 0;
                        const fallback = [
                            {name:'Разработка грунта (траншея)',unit:'м³',qty:volume,price:3500,total:Math.round(volume*3500)},
                            {name:'Труба ПНД ' + (m.diameter||'Ø32'),unit:'м.п.',qty:length,price:450,total:Math.round(length*450)},
                            {name:'Песчаная подушка 200мм',unit:'м³',qty:Math.round(length*0.3*0.2*10)/10,price:8000,total:Math.round(length*0.3*0.2*8000)},
                            {name:'Обратная засыпка',unit:'м³',qty:Math.round(volume*0.8*10)/10,price:2500,total:Math.round(volume*0.8*2500)},
                            {name:'Футляр защитный',unit:'м.п.',qty:Math.round(length*0.15),price:3200,total:Math.round(length*0.15*3200)},
                            {name:'Лента сигнальная',unit:'м.п.',qty:length,price:25,total:Math.round(length*25)},
                        ];
                        if (wells > 0) fallback.push({name:'Колодец (КС-10 или аналог)',unit:'шт',qty:wells,price:42500,total:wells*42500});
                        fallback.push({name:'Работа бригады (монтаж)',unit:'комплект',qty:1,price:180000,total:180000});
                        ED.estimate.length = 0;
                        fallback.forEach(item => ED.estimate.push(item));
                        ED.saveEstimateForObject(obj.id, [...fallback]);
                        const totalCost = fallback.reduce((s,i) => s + i.total, 0);
                        ED.updateObject(obj.id, { planCost: totalCost, aiBackend: 'fallback' });
                    }
                }

                ED.completeAI(obj.id);
                ED.saveData();
                showToast('✅ AI-просчёт завершён! Смета сформирована.');
                setTimeout(() => switchTab('estimates'), 600);
                return;
            }
            // Animate current step
            if (steps[cur]) {
                steps[cur].classList.remove('pending','active');
                steps[cur].classList.add('completed');
                const icon = steps[cur].querySelector('.eng-ai-step-icon');
                if (icon) icon.textContent = '✅';
            }
            cur++;
            if (cur < steps.length && steps[cur]) {
                steps[cur].classList.remove('pending');
                steps[cur].classList.add('active');
            }
        }, 800);
    }

    function approveEstimate() {
        const obj = activeObjectId ? ED.objects.find(o=>o.id===activeObjectId) : ED.objects[0];
        if (!obj) return;
        ED.approveEstimate(obj.id);
        showToast('✅ Смета утверждена!');
        switchTab('estimates');
    }

    function generatePDF() {
        if (!window.jspdf) { showToast('📦 jsPDF не загружен'); return; }
        const doc = new window.jspdf.jsPDF();
        doc.setFont('helvetica','bold');
        doc.setFontSize(16);
        doc.text('Акт выполненных работ', 20, 20);
        doc.setFontSize(10);
        doc.setFont('helvetica','normal');
        const obj = activeObjectId ? ED.objects.find(o=>o.id===activeObjectId) : ED.objects[0];
        if (obj) {
            doc.text(`Клиент: ${obj.client}`, 20, 35);
            doc.text(`Адрес: ${obj.address}`, 20, 42);
            doc.text(`Тип: ${obj.type}`, 20, 49);
            doc.text(`Бюджет: ${obj.budget} T`, 20, 56);
            doc.text(`Факт: ${obj.factCost} T`, 20, 63);
            let y = 78;
            doc.setFont('helvetica','bold');
            doc.text('Смета:', 20, y); y += 8;
            doc.setFont('helvetica','normal');
            ED.estimate.forEach(item => {
                doc.text(`${item.name} — ${item.qty} ${item.unit} x ${item.price} = ${item.total} T`, 20, y);
                y += 7; if (y > 270) { doc.addPage(); y = 20; }
            });
        }
        doc.save('act_' + (obj?.id||'report') + '.pdf');
        showToast('📄 PDF сохранён!');
    }

    function markAllRead() {
        ED.markAllRead();
        showToast('✅ Все уведомления прочитаны');
        switchTab('notifications');
    }

    async function addExpensePrompt() {
        if (!window.QazUI) return addExpensePromptFallback();
        const cat = await QazUI.prompt('Категория расхода', 'Укажите категорию (Материалы, Доставка, Техника...)', {
            icon: '💰', placeholder: 'Например: Материалы', confirmText: 'Далее'
        });
        if (!cat) return;
        const name = await QazUI.prompt('Название расхода', `Категория: ${cat}`, {
            icon: '📝', placeholder: 'Например: Труба ПНД', confirmText: 'Далее'
        });
        if (!name) return;
        const amount = await QazUI.prompt('Сумма (₸)', `${cat} → ${name}`, {
            icon: '💵', placeholder: '0', inputType: 'number', confirmText: 'Добавить'
        });
        if (!amount || isNaN(amount)) return;
        ED.addExpense(cat, name, Number(amount));
        showToast('💰 Расход добавлен');
        switchTab('expenses');
    }
    function addExpensePromptFallback() {
        const cat = prompt('Категория расхода:');
        if (!cat) return;
        const name = prompt('Название:');
        if (!name) return;
        const amount = prompt('Сумма (₸):');
        if (!amount || isNaN(amount)) return;
        ED.addExpense(cat, name, Number(amount));
        showToast('💰 Расход добавлен');
        switchTab('expenses');
    }

    async function addCalendarPrompt() {
        if (!window.QazUI) return addCalendarPromptFallback();
        const title = await QazUI.prompt('Новое событие', 'Введите название события', {
            icon: '📅', placeholder: 'Замер водопровода', confirmText: 'Далее'
        });
        if (!title) return;
        const date = await QazUI.prompt('Дата события', `Событие: ${title}`, {
            icon: '📆', placeholder: 'ГГГГ-ММ-ДД', defaultValue: new Date().toISOString().split('T')[0], confirmText: 'Далее'
        });
        if (!date) return;
        const time = await QazUI.prompt('Время', `${title} — ${date}`, {
            icon: '⏰', placeholder: 'ЧЧ:ММ', defaultValue: '10:00', confirmText: 'Создать'
        });
        ED.addCalendarEvent({date, title, time: time || '10:00', type:'inspect'});
        showToast('📅 Событие добавлено');
        switchTab('calendar');
    }
    function addCalendarPromptFallback() {
        const title = prompt('Событие:');
        if (!title) return;
        const date = prompt('Дата (ГГГГ-ММ-ДД):', new Date().toISOString().split('T')[0]);
        if (!date) return;
        const time = prompt('Время (ЧЧ:ММ):', '10:00');
        ED.addCalendarEvent({date, title, time, type:'inspect'});
        showToast('📅 Событие добавлено');
        switchTab('calendar');
    }

    async function resetData() {
        let confirmed = false;
        if (window.QazUI) {
            confirmed = await QazUI.confirm('Сброс данных', 'Сбросить все данные инженера к демо-версии? Это действие необратимо.', {
                icon: '🔄', confirmText: 'Сбросить', danger: true
            });
        } else {
            confirmed = confirm('Сбросить все данные инженера к демо-версии?');
        }
        if (confirmed) {
            ED.resetData();
            showToast('🔄 Данные сброшены');
            init();
        }
    }

    // Photo upload with real file input
    let _activePhotoCat = 'До работ';

    function selectPhotoCat(btn, objId, category) {
        _activePhotoCat = category;
        $$('.eng-photo-cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        // Update preview grid for this category
        const obj = ED.objects.find(o => o.id === objId);
        if (!obj) return;
        const catKey = {'До работ':'before','Замеры':'measures','Препятствия':'obstacles',
            'Во время работ':'during','Скрытые работы':'hidden','После работ':'after','Проблемы':'problems'}[category] || 'before';
        const count = obj.photos?.[catKey] || 0;
        const grid = document.getElementById('eng-photo-preview');
        if (grid) {
            grid.innerHTML = count > 0
                ? Array.from({length: Math.min(count, 12)}, (_, i) => `
                    <div class="eng-photo-item"><img src="https://picsum.photos/seed/${objId}${catKey}${i}/300/300" alt="Photo">
                    <div class="eng-photo-label">${category} #${i+1}</div></div>`).join('')
                : '<p class="text-muted" style="padding:2rem;text-align:center">Нет фото в этой категории</p>';
        }
    }

    function handlePhotoUpload(event, objId) {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const category = _activePhotoCat;
        const CAT_KEYS = {'До работ':'before','Замеры':'measures','Препятствия':'obstacles',
            'Во время работ':'during','Скрытые работы':'hidden','После работ':'after','Проблемы':'problems'};
        const catKey = CAT_KEYS[category] || 'before';

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            // 1. Instant local preview (UX)
            const reader = new FileReader();
            reader.onload = (e) => {
                const grid = document.getElementById('eng-photo-preview');
                if (grid) {
                    const noPhotos = grid.querySelector('.text-muted');
                    if (noPhotos) noPhotos.remove();
                    const div = document.createElement('div');
                    div.className = 'eng-photo-item';
                    div.style.animation = 'fadeInUp 0.4s ease';
                    div.innerHTML = `<img src="${e.target.result}" alt="${file.name}"><div class="eng-photo-label">${category} — ${file.name}</div>`;
                    grid.appendChild(div);
                }
            };
            reader.readAsDataURL(file);

            // 2. Upload to Cloudflare R2 via Worker
            (async () => {
                try {
                    const token = localStorage.getItem('authToken');
                    const base = (window.QAZGOST_CONFIG && window.QAZGOST_CONFIG.apiUrl)
                        || 'https://construction-api.kmp99.workers.dev/api/v1';
                    const fd = new FormData();
                    fd.append('file', file);
                    const headers = {};
                    if (token) headers['Authorization'] = 'Bearer ' + token;
                    const resp = await fetch(base + '/files/upload', { method: 'POST', headers, body: fd });
                    if (resp.ok) {
                        const data = await resp.json();
                        if (data.success && data.file && data.file.url) {
                            const obj = ED.objects.find(o => o.id === objId);
                            if (obj) {
                                obj.photoUrls = obj.photoUrls || [];
                                obj.photoUrls.push({ cat: catKey, url: data.file.url, name: file.name });
                                ED.updatePhotos(objId, category, 1);
                            }
                            return;
                        }
                    }
                    // fallback if server error
                    ED.updatePhotos(objId, category, 1);
                } catch(err) {
                    // Network offline — count locally only
                    ED.updatePhotos(objId, category, 1);
                    console.warn('[Photo] Upload failed, local count only:', err.message);
                }
            })();
        });

        showToast(`📸 ${files.length} фото: ${category}`);
        // Refresh category button counter
        $$('.eng-photo-cat-btn').forEach(btn => {
            if (btn.dataset.cat === category) {
                const obj = ED.objects.find(o => o.id === objId);
                btn.textContent = `${category} (${(obj?.photos?.[catKey] || 0) + files.length})`;
                btn.classList.add('active');
            }
        });
        event.target.value = '';
    }

    function uploadPhoto(objId, category) {
        ED.updatePhotos(objId, category, 1);
        showToast(`📸 Фото добавлено: ${category}`);
        if (activeObjectId) renderObjectDetail($('#eng-main-content'), activeObjectId);
    }

    // Drag & Drop handler for photos
    function handlePhotoDrop(event, objId) {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return;
        const fakeEvent = { target: { files, value: '' } };
        handlePhotoUpload(fakeEvent, objId);
    }

    // Create object manually via QazUI prompts
    async function addObjectPrompt() {
        const p = window.QazUI ? QazUI.prompt.bind(QazUI) : (t,d,o) => Promise.resolve(prompt(d));
        const client = await p('Новый объект', 'Имя клиента', {icon:'👤',placeholder:'Иван Петров',confirmText:'Далее'});
        if (!client) return;
        const address = await p('Адрес', `Клиент: ${client}`, {icon:'📍',placeholder:'Город, улица, дом',confirmText:'Далее'});
        if (!address) return;
        const type = await p('Тип работ', `${client} — ${address}`, {icon:'🔧',placeholder:'Водопровод / Канализация / Септик',confirmText:'Далее'});
        if (!type) return;
        const budget = await p('Бюджет (₸)', `${type} для ${client}`, {icon:'💰',placeholder:'0',inputType:'number',confirmText:'Создать'});
        const newObj = {
            id: ED.genId('obj'), client, address, type: type || 'Водопровод',
            status: 'ASSIGNED', progress: 5, engineer: 'Инженер',
            budget: Number(budget) || 0, planCost: 0, factCost: 0,
            measurements: {}, brigade: null,
            photos: {before:0,measures:0,obstacles:0,during:0,hidden:0,after:0,problems:0},
            createdAt: new Date().toISOString().split('T')[0],
            aiDone: false, estimateReady: false,
            history: [{date: new Date().toISOString().split('T')[0], action: 'Объект создан вручную', by: 'Инженер'}]
        };
        ED.objects.unshift(newObj);
        ED.addNotification('🏗️', `Новый объект: ${client} (${type})`);
        ED.saveData();
        showToast('🏗️ Объект создан!');
        switchTab('objects');
    }

    // Generate photo report (before/after)
    function generatePhotoReport() {
        const obj = activeObjectId ? ED.objects.find(o=>o.id===activeObjectId) : ED.objects[0];
        if (!obj) { showToast('Выберите объект'); return; }
        if (!window.jspdf) { showToast('📦 jsPDF не загружен'); return; }
        const doc = new window.jspdf.jsPDF();
        doc.setFontSize(16);
        doc.setFont('helvetica','bold');
        doc.text('ФОТООТЧЁТ', 105, 20, {align:'center'});
        doc.setFontSize(10);
        doc.setFont('helvetica','normal');
        doc.text(`Клиент: ${obj.client}`, 20, 35);
        doc.text(`Адрес: ${obj.address}`, 20, 42);
        doc.text(`Тип: ${obj.type}`, 20, 49);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 20, 56);
        let y = 70;
        const ph = obj.photos || {};
        const cats = {'До работ':'before','Замеры':'measures','Во время работ':'during','После работ':'after','Проблемы':'problems'};
        Object.entries(cats).forEach(([label, key]) => {
            if (y > 260) { doc.addPage(); y = 20; }
            doc.setFont('helvetica','bold');
            doc.text(`${label}: ${ph[key]||0} фото`, 20, y);
            doc.setFont('helvetica','normal');
            y += 10;
        });
        doc.save(`фотоотчёт_${obj.client}_${new Date().toISOString().split('T')[0]}.pdf`);
        showToast('🖼️ Фотоотчёт сохранён!');
    }

    // Export expenses to CSV
    function exportExpenses() {
        const rows = [['Категория','Название','Сумма (₸)']];
        ED.expenses.forEach(cat => {
            cat.items.forEach(item => {
                rows.push([cat.cat, item.name, item.amount]);
            });
        });
        const total = ED.expenses.reduce((s,c)=>s+c.items.reduce((ss,i)=>ss+i.amount,0),0);
        rows.push(['','ИТОГО', total]);
        const csv = rows.map(r => r.join(';')).join('\n');
        const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `расходы_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
        showToast('📊 Расходы экспортированы в CSV');
    }

    function showToast(msg, type = 'info') {
        if (window.QazUI && window.QazUI.toast) { window.QazUI.toast(msg); }
        else if (window.showToast) { window.showToast(msg); }
        else { console.log(`[Toast ${type}] ${msg}`); }
    }

    // Delete request with confirmation
    async function deleteReq(reqId) {
        let confirmed = false;
        if (window.QazUI) {
            confirmed = await QazUI.confirm('Удалить заявку', 'Вы уверены? Это действие необратимо.', {
                icon: '🗑️', confirmText: 'Удалить', danger: true
            });
        } else {
            confirmed = confirm('Удалить заявку?');
        }
        if (confirmed) {
            ED.deleteRequest(reqId);
            showToast('🗑️ Заявка удалена');
            switchTab('requests');
        }
    }

    // Delete object with confirmation
    async function deleteObj(objId) {
        let confirmed = false;
        if (window.QazUI) {
            confirmed = await QazUI.confirm('Удалить объект', 'Удалить объект и все его данные? Это действие необратимо.', {
                icon: '🗑️', confirmText: 'Удалить', danger: true
            });
        } else {
            confirmed = confirm('Удалить объект и все данные?');
        }
        if (confirmed) {
            ED.deleteObject(objId);
            activeObjectId = null;
            showToast('🗑️ Объект удалён');
            switchTab('objects');
        }
    }

    // === BRIGADE CRUD ===
    async function addBrigadePrompt() {
        const p = window.QazUI ? QazUI.prompt.bind(QazUI) : (t,d,o) => Promise.resolve(prompt(d));
        const name = await p('Новая бригада', 'Имя бригадира', {icon:'👷',placeholder:'Иван',confirmText:'Далее'});
        if (!name) return;
        const spec = await p('Специализация', `Бригада: ${name}`, {icon:'🔧',placeholder:'Водопровод / Канализация',confirmText:'Далее'});
        const workers = await p('Кол-во рабочих', `${name} — ${spec||'Разное'}`, {icon:'👥',placeholder:'3',inputType:'number',confirmText:'Далее'});
        const price = await p('Ставка (₸/день)', `${name}`, {icon:'💰',placeholder:'100000',inputType:'number',confirmText:'Создать'});
        ED.addBrigade({name, spec: spec||'Разное', workers: Number(workers)||2, pricePerDay: Number(price)||80000});
        ED.addNotification('👷', `Новая бригада: ${name}`);
        showToast('👷 Бригада создана!');
        switchTab('brigades');
    }

    async function deleteBrigadePrompt(brId) {
        let ok = window.QazUI ? await QazUI.confirm('Удалить бригаду','Удалить эту бригаду?',{icon:'🗑️',confirmText:'Удалить',danger:true}) : confirm('Удалить бригаду?');
        if (ok) { ED.deleteBrigade(brId); showToast('🗑️ Бригада удалена'); switchTab('brigades'); }
    }

    // === MATERIAL CRUD ===
    async function addMaterialPrompt() {
        const p = window.QazUI ? QazUI.prompt.bind(QazUI) : (t,d,o) => Promise.resolve(prompt(d));
        const name = await p('Новый материал', 'Название', {icon:'📦',placeholder:'Труба ПНД Ø32',confirmText:'Далее'});
        if (!name) return;
        const unit = await p('Единица измерения', name, {icon:'📏',placeholder:'м.п. / шт / м³',confirmText:'Далее'});
        const qty = await p('Количество', name, {icon:'🔢',placeholder:'0',inputType:'number',confirmText:'Далее'});
        const price = await p('Цена за единицу (₸)', name, {icon:'💰',placeholder:'0',inputType:'number',confirmText:'Добавить'});
        ED.addMaterial({name, unit: unit||'шт', qty: Number(qty)||0, price: Number(price)||0, inStock: Number(qty) > 0});
        showToast('📦 Материал добавлен');
        switchTab('materials');
    }

    async function deleteMat(matId) {
        let ok = window.QazUI ? await QazUI.confirm('Удалить материал','Удалить?',{icon:'🗑️',confirmText:'Удалить',danger:true}) : confirm('Удалить?');
        if (ok) { ED.deleteMaterial(matId); showToast('🗑️ Материал удалён'); switchTab('materials'); }
    }

    // === EXPENSE DELETE ===
    async function deleteExpenseItem(catIdx, itemIdx) {
        let ok = window.QazUI ? await QazUI.confirm('Удалить расход','Удалить этот расход?',{icon:'🗑️',confirmText:'Удалить',danger:true}) : confirm('Удалить расход?');
        if (ok) { ED.deleteExpense(catIdx, itemIdx); showToast('🗑️ Расход удалён'); switchTab('expenses'); }
    }

    // === GPS GEOLOCATION ===
    async function getGPS(objId) {
        if (!navigator.geolocation) { showToast('⚠️ GPS не поддерживается'); return; }
        showToast('📍 Определяю координаты...');
        navigator.geolocation.getCurrentPosition(pos => {
            const coords = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
            ED.updateObject(objId, {gps: coords, gpsDate: new Date().toISOString().split('T')[0]});
            const obj = ED.objects.find(o => o.id === objId);
            if (obj) {
                obj.history = obj.history || [];
                obj.history.push({date: new Date().toISOString().split('T')[0], action: `GPS координаты: ${coords}`, by: 'Инженер'});
                ED.saveData();
            }
            showToast(`📍 GPS: ${coords}`);
            if (activeObjectId === objId) renderObjectDetail($('#eng-main-content'), objId);
        }, err => {
            showToast('❌ Не удалось определить GPS: ' + err.message);
        }, {enableHighAccuracy: true, timeout: 10000});
    }

    // Export
    window.EngineerUI = {
        init, switchTab, acceptRequest, openObject, runAI,
        showToast,
        changeStatus, assignBrigade, editMeasures, saveMeasures,
        approveEstimate, generatePDF, markAllRead, addExpensePrompt,
        addCalendarPrompt, resetData, uploadPhoto,
        selectPhotoCat, handlePhotoUpload,
        filterObjects, handlePhotoDrop, addObjectPrompt,
        generatePhotoReport, exportExpenses,
        // Calendar-centric
        calNav, selectDay, openMontageCard, setCalView,
        addRequestFromCalendar, sendPhotosToClient,
        // Delete operations
        deleteReq, deleteObj, deleteExpenseItem,
        // Organization management
        selectOrg, showCreateOrg, switchOrg,
        // New CRUD
        addBrigadePrompt, deleteBrigadePrompt,
        addMaterialPrompt, deleteMat,
        openMeasuresFor, getGPS,
        // API-connected features
        sendEstimateToCustomer
    };

    document.addEventListener('DOMContentLoaded', () => {
        if ($('#engineer-container')) init();
    });

})();
