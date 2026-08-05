// ========================================
// ADMIN PANEL MODULE - AdminUI v1.0
// Панель администратора: прайсы, модерация
// ========================================

(function () {
    'use strict';

    // =============================================
    // 1. STATE
    // =============================================

    let _containerEl = null;
    let _activeTab = 'overview';   // overview | database | prices | moderation | users | settings
    let _priceType = 'all';  // all | works | materials
    let _searchQuery = '';
    let _categoryFilter = 'all';
    let _sortField = 'name';
    let _sortDir = 'asc';
    let _currentPage = 1;
    const PAGE_SIZE = 20;
    let _auditLog = [];
    let _dbType = 'works';      // works | materials | equipment
    let _dbView = 'grouped';    // grouped | list
    let _dbSearch = '';
    let _dbPage = 1;
    let _settingsSection = 'regions'; // regions | audit
    let _usersSearch = '';
    let _usersFilter = 'all'; // all | customer | executor | engineer | admin
    let _usersPage = 1;
    const USERS_PAGE_SIZE = 15;

    // =============================================
    // 2. DATA ACCESS (from AIPriceDatabase)
    // =============================================

    function _getPriceDB() {
        return window.AIPriceDatabase;
    }

    /**
     * Возвращает плоский массив всех позиций (материалы или работы)
     */
    function _getAllItems(type) {
        const db = _getPriceDB();
        if (!db) return [];
        const data = type === 'materials' ? db.MATERIALS : db.WORKS;
        if (!data) return [];

        const items = [];
        for (const cat in data) {
            for (const code in data[cat]) {
                items.push({
                    code,
                    category: cat,
                    ...data[cat][code]
                });
            }
        }

        // Merge WBS catalog works when viewing 'works'
        if (type === 'works' && window.WBSCatalog) {
            const wbsCats = window.WBSCatalog.getCategories();
            wbsCats.forEach(cat => {
                const sections = window.WBSCatalog.getSections(cat.name);
                sections.forEach(sec => {
                    const works = window.WBSCatalog.getWorks(cat.name, sec.name);
                    works.forEach(w => {
                        items.push({
                            code: w.id,
                            name: w.name,
                            unit: w.unit || '—',
                            price: w.price,
                            category: 'wbs_' + cat.name,
                            section: sec.name
                        });
                    });
                });
            });
        }

        return items;
    }

    function _getCategories(type) {
        const db = _getPriceDB();
        if (!db) return [];
        const data = type === 'materials' ? db.MATERIALS : db.WORKS;
        const cats = data ? Object.keys(data) : [];

        // Add WBS categories when viewing works
        if (type === 'works' && window.WBSCatalog) {
            window.WBSCatalog.getCategories().forEach(c => {
                const key = 'wbs_' + c.name;
                if (!cats.includes(key)) cats.push(key);
            });
        }

        return cats;
    }

    function _getRegions() {
        const db = _getPriceDB();
        if (!db || !db.REGIONAL_COEFFICIENTS) return {};
        return db.REGIONAL_COEFFICIENTS;
    }

    /**
     * Фильтрация + сортировка + пагинация позиций
     */
    function _getFilteredItems() {
        let items = _getAllItems(_priceType);

        // Filter by category
        if (_categoryFilter !== 'all') {
            items = items.filter(i => i.category === _categoryFilter);
        }

        // Filter by search
        if (_searchQuery) {
            const q = _searchQuery.toLowerCase();
            items = items.filter(i =>
                i.name.toLowerCase().includes(q) ||
                i.code.toLowerCase().includes(q)
            );
        }

        // Sort
        items.sort((a, b) => {
            let va = a[_sortField], vb = b[_sortField];
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return _sortDir === 'asc' ? -1 : 1;
            if (va > vb) return _sortDir === 'asc' ? 1 : -1;
            return 0;
        });

        return items;
    }

    // =============================================
    // 3. MODERATION DATA (demo)
    // =============================================

    function _getModerationQueue() {
        // Собираем реальные данные из заказов + демо очередь модерации
        const queue = [];
        const ds = window.DataService;

        // Реальные заказы (на проверке публикации)
        if (ds && ds.Customer) {
            try {
                const ordersResult = ds.Customer.getOrders({});
                if (ordersResult.success && ordersResult.data) {
                    ordersResult.data
                        .filter(o => o.status === 'published')
                        .slice(0, 5)
                        .forEach(order => {
                            queue.push({
                                id: `mod_order_${order.id}`,
                                type: 'order',
                                icon: '📋',
                                title: `Заказ: ${order.title}`,
                                desc: order.description ? order.description.slice(0, 120) + '…' : 'Без описания',
                                status: 'pending',
                                priority: order.urgency === 'urgent' ? 'urgent' : 'normal',
                                date: order.publishedAt || order.createdAt,
                                entity: order,
                                entityType: 'order'
                            });
                        });
                }
            } catch (e) {
                console.warn('[AdminUI] Error loading orders for moderation:', e);
            }
        }

        // Демо очередь модерации
        const demoQueue = [
            {
                id: 'mod_profile_1',
                type: 'profile',
                icon: '👤',
                title: 'Верификация: СтройМастер',
                desc: 'Компания подала заявку на верификацию. Документы: ИИН, уставные документы, лицензия.',
                status: 'pending',
                priority: 'normal',
                date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                entityType: 'profile'
            },
            {
                id: 'mod_review_1',
                type: 'review',
                icon: '⭐',
                title: 'Отзыв: негативный',
                desc: 'Заказчик оставил негативный отзыв с жалобой на качество работы. Требуется проверка.',
                status: 'pending',
                priority: 'urgent',
                date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                entityType: 'review'
            },
            {
                id: 'mod_report_1',
                type: 'report',
                icon: '🚨',
                title: 'Жалоба на пользователя',
                desc: 'Исполнитель не выходит на связь, не приступает к работе. Заказчик просит помощи.',
                status: 'pending',
                priority: 'urgent',
                date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                entityType: 'report'
            },
            {
                id: 'mod_profile_2',
                type: 'profile',
                icon: '👤',
                title: 'Верификация: БригадаПро',
                desc: 'Бригада отделочников. Документы: ИИН бригадира, фото работ. Готовы к проверке.',
                status: 'pending',
                priority: 'normal',
                date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                entityType: 'profile'
            },
            {
                id: 'mod_order_spam',
                type: 'order',
                icon: '📋',
                title: 'Подозрительный заказ',
                desc: 'Заказ с подозрительно низким бюджетом и нестандартным описанием. Возможный спам.',
                status: 'pending',
                priority: 'urgent',
                date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                entityType: 'order'
            }
        ];

        return [...queue, ...demoQueue];
    }

    // =============================================
    // 4. AUDIT LOG
    // =============================================

    function _addAuditEntry(action, description) {
        _auditLog.unshift({
            id: 'audit_' + Date.now(),
            action,
            description,
            timestamp: new Date().toISOString(),
            user: 'Admin'
        });
        // Keep last 50
        if (_auditLog.length > 50) _auditLog.length = 50;
    }

    // Init с демо данными
    function _initAuditLog() {
        if (_auditLog.length > 0) return;
        const now = Date.now();
        _auditLog = [
            { id: 'a1', action: 'update', description: 'Цена «Бетон М300» обновлена: 28000₸ → 29500₸', timestamp: new Date(now - 2 * 3600000).toISOString(), user: 'Admin' },
            { id: 'a2', action: 'approve', description: 'Верификация «СтройМастер» одобрена', timestamp: new Date(now - 5 * 3600000).toISOString(), user: 'Admin' },
            { id: 'a3', action: 'reject', description: 'Заказ #order_12345 отклонён (спам)', timestamp: new Date(now - 8 * 3600000).toISOString(), user: 'Admin' },
            { id: 'a4', action: 'create', description: 'Добавлена новая позиция «Утеплитель XPS 50мм»', timestamp: new Date(now - 24 * 3600000).toISOString(), user: 'Admin' },
            { id: 'a5', action: 'update', description: 'Региональный коэффициент Атырау: 1.20 → 1.25', timestamp: new Date(now - 48 * 3600000).toISOString(), user: 'Admin' },
            { id: 'a6', action: 'delete', description: 'Удалена дублирующая позиция «Песок речной (дубль)»', timestamp: new Date(now - 72 * 3600000).toISOString(), user: 'Admin' },
            { id: 'a7', action: 'approve', description: 'Отзыв пользователя #user_789 одобрен', timestamp: new Date(now - 96 * 3600000).toISOString(), user: 'Admin' }
        ];
    }

    // =============================================
    // 5. UTILITIES
    // =============================================

    function _formatMoney(v) {
        if (!v) return '—';
        return new Intl.NumberFormat('ru-KZ').format(v) + ' ₸';
    }

    function _formatDate(d) {
        if (!d) return '—';
        return new Date(d).toLocaleString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    function _timeAgo(d) {
        if (!d) return '';
        const ms = Date.now() - new Date(d).getTime();
        const mins = Math.floor(ms / 60000);
        if (mins < 1) return 'только что';
        if (mins < 60) return `${mins} мин. назад`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} ч. назад`;
        const days = Math.floor(hrs / 24);
        return `${days} дн. назад`;
    }

    function _getCategoryLabel(cat) {
        const map = {
            concrete: 'Бетон', rebar: 'Арматура', masonry: 'Кладка',
            aggregates: 'Наполнители', insulation: 'Изоляция', formwork: 'Опалубка',
            piles: 'Сваи', earthwork: 'Земляные', concreting: 'Бетонные',
            piling: 'Свайные', foundation: 'Фундамент', flooring: 'Полы',
            'wbs_Строительство': '🏗️ Строительство',
            'wbs_Внутренний ремонт': '🔨 Внутренний ремонт',
            'wbs_Наружные работы': '🏠 Наружные работы',
            'wbs_Инженерные системы': '⚡ Инженерные системы',
            'wbs_Металлоконструкции': '🔩 Металлоконструкции'
        };
        return map[cat] || cat;
    }

    // =============================================
    // 6. MAIN RENDER
    // =============================================

    function open(container) {
        if (typeof container === 'string') {
            _containerEl = document.getElementById(container);
        } else {
            _containerEl = container;
        }

        if (!_containerEl) {
            _containerEl = document.createElement('div');
            _containerEl.id = 'page-admin';
            _containerEl.className = 'page admin-page';
            document.body.appendChild(_containerEl);
        }

        _initAuditLog();
        _render();
        console.log('[AdminUI] ✅ Admin Panel opened');
    }

    function _render() {
        if (!_containerEl) return;

        const db = _getPriceDB();
        const priceInfo = db ? db.getPriceInfo() : { totalMaterials: 0, totalWorks: 0 };
        const modQueue = _getModerationQueue();
        const pendingCount = modQueue.filter(m => m.status === 'pending').length;
        const urgentCount = modQueue.filter(m => m.priority === 'urgent').length;
        const regions = _getRegions();
        const regionCount = Object.keys(regions).filter(k => k !== 'default').length;

        _containerEl.innerHTML = `
            <!-- Header -->
            <div class="admin-header">
                <div class="logo admin-logo" onclick="window.showPage && window.showPage('landing')" style="cursor:pointer; display:flex; align-items:center; gap:0.5rem; font-weight:800; font-size:1.4rem; color:#fff;">
                    <div class="logo-icon" style="width:36px; height:36px; background:linear-gradient(135deg, #8b5cf6, #6366f1); color:white; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:800; box-shadow:0 4px 15px rgba(139,92,246,0.4);">Q</div>
                    QazGost <span style="color:#8b5cf6;">AI</span>
                </div>
                <div class="admin-header-title">
                    <span>⚙️</span> Панель администратора
                    <span class="admin-badge">ADMIN</span>
                </div>
                
                <button class="admin-burger-btn" onclick="AdminUI.toggleMobileMenu()">
                    <div class="admin-burger-bar"></div>
                    <div class="admin-burger-bar"></div>
                    <div class="admin-burger-bar"></div>
                </button>
                
                <div class="admin-mobile-overlay" id="adminMobileOverlay" onclick="AdminUI.toggleMobileMenu()"></div>

                <div class="admin-tabs" id="adminNavTabs">
                    <div class="admin-drawer-header">
                        <div class="logo" style="display:flex; align-items:center; gap:0.5rem; font-weight:800; font-size:1.2rem; color:#fff;">
                            <div class="logo-icon" style="width:32px; height:32px; background:linear-gradient(135deg, #8b5cf6, #6366f1); color:white; border-radius:8px; display:flex; align-items:center; justify-content:center;">Q</div>
                            QazGost <span style="color:#8b5cf6;">AI</span>
                        </div>
                        <button class="admin-drawer-close" onclick="AdminUI.toggleMobileMenu()">✕</button>
                    </div>
                    
                    <button class="admin-tab ${_activeTab === 'overview' ? 'active' : ''}"
                            onclick="AdminUI.setTab('overview'); AdminUI.closeMobileMenu();">
                        <span class="tab-text">📊 Обзор</span>
                        <svg class="tab-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    <button class="admin-tab ${_activeTab === 'database' ? 'active' : ''}"
                            onclick="AdminUI.setTab('database'); AdminUI.closeMobileMenu();">
                        <span class="tab-text">🗄️ База данных</span>
                        <svg class="tab-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    <button class="admin-tab ${_activeTab === 'prices' ? 'active' : ''}"
                            onclick="AdminUI.setTab('prices'); AdminUI.closeMobileMenu();">
                        <span class="tab-text">💰 Цены</span>
                        <svg class="tab-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    <button class="admin-tab ${_activeTab === 'moderation' ? 'active' : ''}"
                            onclick="AdminUI.setTab('moderation'); AdminUI.closeMobileMenu();">
                        <span class="tab-text">🛡️ Модерация${pendingCount > 0 ? `<span class="tab-badge">${pendingCount}</span>` : ''}</span>
                        <svg class="tab-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    <button class="admin-tab ${_activeTab === 'users' ? 'active' : ''}"
                            onclick="AdminUI.setTab('users'); AdminUI.closeMobileMenu();">
                        <span class="tab-text">👥 Пользователи</span>
                        <svg class="tab-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                    <button class="admin-tab ${_activeTab === 'settings' ? 'active' : ''}"
                            onclick="AdminUI.setTab('settings'); AdminUI.closeMobileMenu();">
                        <span class="tab-text">⚙️ Управление</span>
                        <svg class="tab-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
            </div>

            <!-- Stats -->
            <div class="admin-stats">
                <div class="admin-stat-card prices">
                    <div class="admin-stat-icon">💰</div>
                    <div class="admin-stat-number">${priceInfo.totalMaterials + priceInfo.totalWorks}</div>
                    <div class="admin-stat-label">Позиций в прайсе</div>
                </div>
                <div class="admin-stat-card orders">
                    <div class="admin-stat-icon">📋</div>
                    <div class="admin-stat-number">${modQueue.filter(m => m.entityType === 'order').length}</div>
                    <div class="admin-stat-label">Заказов на модерации</div>
                </div>
                <div class="admin-stat-card moderation">
                    <div class="admin-stat-icon">⚠️</div>
                    <div class="admin-stat-number">${urgentCount}</div>
                    <div class="admin-stat-label">Срочных вопросов</div>
                </div>
                <div class="admin-stat-card users" onclick="AdminUI.setTab('users')" style="cursor:pointer">
                    <div class="admin-stat-icon">👥</div>
                    <div class="admin-stat-number">${_getAllUsers().length}</div>
                    <div class="admin-stat-label">Пользователей</div>
                </div>
                <div class="admin-stat-card revenue">
                    <div class="admin-stat-icon">📜</div>
                    <div class="admin-stat-number">${_auditLog.length}</div>
                    <div class="admin-stat-label">Записей в журнале</div>
                </div>
            </div>

            <!-- Content -->
            <div id="adminContent">
                ${_renderTab()}
            </div>
        `;
    }

    function _renderTab() {
        switch (_activeTab) {
            case 'overview':
                setTimeout(_loadBackendStats, 0);
                return _renderOverviewTab();
            case 'database': return _renderDatabaseTab();
            case 'prices': return _renderPricesTab();
            case 'moderation': return _renderModerationTab();
            case 'users': return _renderUsersTab();
            case 'settings': return _renderSettingsTab();
            default:
                setTimeout(_loadBackendStats, 0);
                return _renderOverviewTab();
        }
    }

    // =============================================
    // 6b. OVERVIEW TAB
    // =============================================

    function _renderOverviewTab() {
        const wrk = _countGlobalItems('AI_WRK_');
        const mat = _countGlobalItems('AI_MAT_');
        const eq = _countGlobalItems('AI_EQ_');
        const work_ = _countGlobalItems('AI_WORK_');
        const totalWrk = wrk.totalItems + work_.totalItems;
        const totalMat = mat.totalItems;
        const totalEq = eq.totalItems;
        const grandTotal = totalWrk + totalMat + totalEq;
        const goalWrk = 20000, goalMat = 12000, goalEq = 1000, goalTotal = 33000;
        const pct = (v, g) => Math.min(100, Math.round(v / g * 100));
        const bar = (p, color) => `
            <div style="flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${p}%;background:${color};border-radius:4px;transition:width 0.6s"></div>
            </div>
            <span style="min-width:42px;text-align:right;font-weight:700;font-size:0.85rem;color:${color}">${p}%</span>`;
        const card = (icon, label, files, total, goal, color, type) => `
            <div onclick="AdminUI.setTab('database');AdminUI.setDbType('${type}')"
                style="background:rgba(${color},0.08);border:1px solid rgba(${color},0.22);border-radius:12px;
                padding:1.25rem;cursor:pointer;transition:all 0.2s"
                onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.3)'"
                onmouseout="this.style.transform='';this.style.boxShadow=''">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                    <span style="font-weight:700;font-size:0.95rem">${icon} ${label}</span>
                    <span style="font-size:0.75rem;color:rgba(255,255,255,0.35)">${files} файлов</span>
                </div>
                <div style="font-size:1.5rem;font-weight:800;color:rgb(${color})">
                    ${total.toLocaleString('ru')}
                    <span style="font-size:0.82rem;font-weight:400;color:rgba(255,255,255,0.4)"> / ${goal.toLocaleString('ru')}</span>
                </div>
                <div style="display:flex;align-items:center;gap:0.5rem;margin:0.5rem 0">
                    ${bar(pct(total, goal), `rgb(${color})`)}
                </div>
                <div style="font-size:0.8rem;color:rgba(255,255,255,0.45)">
                    Осталось: <b style="color:rgb(${color})">${(goal - total).toLocaleString('ru')}</b>
                    <span style="float:right;font-size:0.73rem;opacity:0.5">→ Открыть список</span>
                </div>
            </div>`;
        return `
        <div class="admin-panel">
            <div class="admin-panel-header">
                <div class="admin-panel-title">📊 Обзор базы данных — Фаза 3</div>
            </div>
            <div style="padding:1.5rem">
                <div style="padding:1.5rem;background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.1));
                    border-radius:12px;margin-bottom:1.5rem">
                    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.75rem">
                        <span style="font-size:2.2rem">🏗️</span>
                        <div>
                            <div style="font-size:1.8rem;font-weight:800">
                                ${grandTotal.toLocaleString('ru')}
                                <span style="font-size:0.95rem;font-weight:400;color:rgba(255,255,255,0.45)"> / ${goalTotal.toLocaleString('ru')}</span>
                            </div>
                            <div style="font-size:0.87rem;color:rgba(255,255,255,0.55)">Всего позиций в базе данных</div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:0.75rem">
                        ${bar(pct(grandTotal, goalTotal), '#8b5cf6')}
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem">
                    ${card('🔧', 'Работы', wrk.files.length + work_.files.length, totalWrk, goalWrk, '34,197,94', 'works')}
                    ${card('🧱', 'Материалы', mat.files.length, totalMat, goalMat, '59,130,246', 'materials')}
                    ${card('🚜', 'Техника', eq.files.length, totalEq, goalEq, '245,158,11', 'equipment')}
                </div>

                <!-- Backend PriceDB Stats -->
                <div id="adminBackendStats" style="margin-top:1.25rem;padding:1rem 1.25rem;background:rgba(139,92,246,0.06);
                    border:1px solid rgba(139,92,246,0.15);border-radius:10px">
                    <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.5rem">
                        <span style="font-size:0.9rem">🖥️</span>
                        <span style="font-weight:600;font-size:0.88rem">Backend PriceDB</span>
                        <span id="adminBackendBadge" style="font-size:0.65rem;padding:0.12rem 0.4rem;border-radius:4px;
                            background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35)">загрузка…</span>
                    </div>
                    <div id="adminBackendStatsContent" style="display:flex;gap:1rem;flex-wrap:wrap;font-size:0.82rem;color:rgba(255,255,255,0.5)">
                        <span>⏳ Запрос к AI сервису...</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // Async fetch backend stats after overview render
    function _loadBackendStats() {
        if (!window.AIService || !window.AIService.getPriceStats) return;
        window.AIService.getPriceStats().then(stats => {
            const el = document.getElementById('adminBackendStatsContent');
            const badge = document.getElementById('adminBackendBadge');
            if (!el || !stats) return;
            badge.textContent = '✅ online';
            badge.style.background = 'rgba(34,197,94,0.15)';
            badge.style.color = '#22c55e';
            el.innerHTML = `
                <div style="display:flex;gap:1.5rem;flex-wrap:wrap">
                    <span>🔧 Работы: <b style="color:#22c55e">${(stats.works || 0).toLocaleString('ru')}</b></span>
                    <span>🧱 Материалы: <b style="color:#60a5fa">${(stats.materials || 0).toLocaleString('ru')}</b></span>
                    <span>🚜 Техника: <b style="color:#f59e0b">${(stats.equipment || 0).toLocaleString('ru')}</b></span>
                    <span>📊 Всего: <b style="color:#a78bfa">${(stats.total || 0).toLocaleString('ru')}</b></span>
                </div>
            `;
        }).catch(() => {
            const el = document.getElementById('adminBackendStatsContent');
            const badge = document.getElementById('adminBackendBadge');
            if (!el) return;
            badge.textContent = '⚠️ offline';
            badge.style.background = 'rgba(245,158,11,0.15)';
            badge.style.color = '#f59e0b';
            el.innerHTML = '<span style="color:rgba(255,255,255,0.3)">AI сервис недоступен — используются локальные данные</span>';
        });
    }

    // =============================================
    // 7. PRICES TAB
    // =============================================

    function _renderPricesTab() {
        const PAGE = 100;

        // Collect items for the selected type
        const getItems = (prefix, typeLabel) => {
            const result = [];
            for (const key of Object.keys(window)) {
                if (!key.startsWith(prefix)) continue;
                const catalog = window[key];
                if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;
                const src = key.replace(prefix, '').toLowerCase();
                for (const [code, item] of Object.entries(catalog)) {
                    if (!item || !item.name) continue;
                    result.push({
                        code, name: item.name, unit: item.unit || '—',
                        price: item.price || 0, labor: item.labor || null,
                        source: src, _type: typeLabel
                    });
                }
            }
            return result;
        };

        let allItems = [];
        if (_priceType === 'works' || _priceType === 'all') {
            allItems = allItems.concat(getItems('AI_WRK_', 'work'));
            allItems = allItems.concat(getItems('AI_WORK_', 'work'));
        }
        if (_priceType === 'materials' || _priceType === 'all') {
            allItems = allItems.concat(getItems('AI_MAT_', 'mat'));
        }

        // Search filter
        const q = (_searchQuery || '').toLowerCase().trim();
        const filtered = q ? allItems.filter(i =>
            i.name.toLowerCase().includes(q) ||
            i.code.toLowerCase().includes(q) ||
            i.source.includes(q)
        ) : allItems;

        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / PAGE));
        const page = Math.min(_currentPage || 1, pages);
        const slice = filtered.slice((page - 1) * PAGE, page * PAGE);

        // Format labor norm
        const fmtLabor = (labor, type) => {
            if (!labor) return '<span style="color:rgba(255,255,255,0.2)">—</span>';
            const h = labor.norm;
            const val = h < 1
                ? Math.round(h * 60) + '&nbsp;мин'
                : (h === Math.floor(h) ? h + '&nbsp;ч-ч' : h.toFixed(2) + '&nbsp;ч-ч');
            const color = type === 'work' ? '#c084fc' : '#60a5fa';
            return `<span title="${labor.src || ''}" style="color:${color};font-weight:600;background:rgba(192,132,252,0.12);padding:0.25rem 0.6rem;border-radius:6px;border:1px solid rgba(192,132,252,0.2);display:inline-block">${val}</span>`;
        };

        // Type badge
        const typeBadge = t => t === 'work'
            ? '<span style="display:inline-flex;align-items:center;justify-content:center;gap:0.3rem;font-size:0.75rem;padding:0.25rem 0.6rem;background:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);border-radius:6px;font-weight:600;white-space:nowrap;width:95px">🔧 Работа</span>'
            : '<span style="display:inline-flex;align-items:center;justify-content:center;gap:0.3rem;font-size:0.75rem;padding:0.25rem 0.6rem;background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.3);border-radius:6px;font-weight:600;white-space:nowrap;width:95px">🧱 Матер.</span>';

        const rows = slice.map((it, idx) => {
            const bgStyle = idx % 2 === 0 ? 'background:rgba(255,255,255,0.015);' : '';
            return `<tr style="${bgStyle}border-bottom:1px solid rgba(255,255,255,0.05);transition:all 0.15s ease;"
                onmouseover="this.style.background='rgba(139,92,246,0.12)';"
                onmouseout="this.style.background='${idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}';">
                <td data-label="Тип" style="padding:0.8rem 0.75rem;text-align:center;width:110px;">${typeBadge(it._type)}</td>
                <td data-label="Наименование" style="padding:0.8rem 1.25rem;font-size:0.92rem;color:#f8fafc;font-weight:500;line-height:1.45;word-break:break-word;" title="${it.name}">${it.name}</td>
                <td data-label="Раздел" style="padding:0.8rem 0.75rem;text-align:center;width:140px;"><span style="font-size:0.78rem;padding:0.25rem 0.6rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#cbd5e1;font-weight:500;display:inline-block;white-space:nowrap">${it.source}</span></td>
                <td data-label="Ед.изм." style="padding:0.8rem 0.75rem;text-align:center;font-size:0.88rem;color:#cbd5e1;font-weight:600;width:90px;">${it.unit}</td>
                <td data-label="Трудозатраты" style="padding:0.8rem 0.75rem;text-align:center;font-size:0.88rem;white-space:nowrap;width:130px;">${fmtLabor(it.labor, it._type)}</td>
                <td data-label="Цена" style="padding:0.8rem 1.5rem;text-align:right;font-weight:700;font-size:1.02rem;color:${it._type === 'work' ? '#4ade80' : '#60a5fa'};white-space:nowrap;width:160px;">
                    ${it.price ? it.price.toLocaleString('ru-RU') + '\u00a0₸' : '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            </tr>`;
        }).join('');

        // Pagination buttons
        const mkPg = (p, lbl = p, active = false) =>
            `<button onclick="AdminUI.goPage(${p})" style="padding:0.4rem 0.85rem;border-radius:8px;border:1px solid ${active ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'};background:${active ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.05)'};color:${active ? '#fff' : 'rgba(255,255,255,0.7)'};cursor:pointer;font-size:0.85rem;font-weight:${active ? '700' : '500'};min-width:38px;box-shadow:${active ? '0 2px 10px rgba(139,92,246,0.35)' : 'none'};transition:all 0.15s ease;"
            onmouseover="if(!${active})this.style.background='rgba(255,255,255,0.1)'" onmouseout="if(!${active})this.style.background='rgba(255,255,255,0.05)'">${lbl}</button>`;
        const pBtns = [];
        if (pages > 1) {
            if (page > 1) pBtns.push(mkPg(page - 1, '◀'));
            const lo = Math.max(1, page - 2), hi = Math.min(pages, page + 2);
            if (lo > 1) { pBtns.push(mkPg(1)); if (lo > 2) pBtns.push('<span style="color:rgba(255,255,255,0.3);padding:0 0.3rem;align-self:center">…</span>'); }
            for (let p2 = lo; p2 <= hi; p2++) pBtns.push(mkPg(p2, p2, p2 === page));
            if (hi < pages) { if (hi < pages - 1) pBtns.push('<span style="color:rgba(255,255,255,0.3);padding:0 0.3rem;align-self:center">…</span>'); pBtns.push(mkPg(pages)); }
            if (page < pages) pBtns.push(mkPg(page + 1, '▶'));
        }

        // Type switcher button
        const tBtn = (val, label, icon) =>
            `<button onclick="AdminUI.setPriceType('${val}')" style="padding:0.5rem 1.1rem;border-radius:8px;border:none;background:${_priceType === val ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.06)'};color:${_priceType === val ? '#fff' : 'rgba(255,255,255,0.6)'};font-size:0.88rem;cursor:pointer;font-weight:${_priceType === val ? '700' : '500'};box-shadow:${_priceType === val ? '0 2px 10px rgba(139,92,246,0.35)' : 'none'};transition:all 0.2s;">${icon} ${label}</button>`;

        // Excel export/import overrides stats
        const overrideStats = window.CatalogExcelIO ? window.CatalogExcelIO.getOverrideStats() : { total: 0 };
        const overrideBadge = overrideStats.total > 0
            ? `<span style="background:#f59e0b;color:#000;font-size:0.7rem;padding:0.15rem 0.5rem;border-radius:6px;margin-left:6px;font-weight:700">${overrideStats.total} изм.</span>`
            : '';

        return `<div class="admin-panel" style="max-width:1400px;margin:0 auto;background:rgba(15,23,42,0.85);border-radius:20px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(20px);box-shadow:0 12px 40px rgba(0,0,0,0.4);overflow:hidden;">
            <div class="admin-panel-header" style="padding:1.25rem 1.75rem;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(30,41,59,0.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
                <div>
                    <div class="admin-panel-title" style="font-size:1.3rem;font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:0.5rem;">
                        💰 Цены — Работы и Материалы
                    </div>
                    <div style="font-size:0.8rem;color:#94a3b8;margin-top:0.25rem;">Каталог расценок ГЭСН, QAZGOST и рыночных цен с поиском и фильтрацией</div>
                </div>
                <div class="admin-panel-actions" style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
                    <div style="display:flex;gap:0.35rem;background:rgba(15,23,42,0.7);padding:0.3rem;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
                        ${tBtn('all', 'Все', '📋')}
                        ${tBtn('works', 'Работы', '🔧')}
                        ${tBtn('materials', 'Материалы', '🧱')}
                    </div>
                    <div style="position:relative;">
                        <input type="text" placeholder="🔍 Поиск по названию, коду..."
                            value="${_searchQuery || ''}" oninput="AdminUI.search(this.value)"
                            style="padding:0.55rem 1rem;border-radius:10px;border:1px solid rgba(139,92,246,0.35);background:rgba(15,23,42,0.85);color:#fff;font-size:0.88rem;min-width:280px;width:320px;outline:none;transition:all 0.2s;box-shadow:inset 0 1px 3px rgba(0,0,0,0.3)"
                            onfocus="this.style.borderColor='#8b5cf6';this.style.boxShadow='0 0 14px rgba(139,92,246,0.35)'"
                            onblur="this.style.borderColor='rgba(139,92,246,0.35)';this.style.boxShadow='none'">
                    </div>
                </div>
            </div>

            <!-- Excel Export/Import Toolbar -->
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;padding:0.85rem 1.75rem;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(30,41,59,0.25);">
                <button onclick="AdminUI.exportPricesToExcel('current')" id="btnExportCurrentExcel"
                    style="display:flex;align-items:center;gap:0.4rem;padding:0.55rem 1.1rem;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;border:none;border-radius:10px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all .2s;box-shadow:0 3px 12px rgba(34,197,94,0.3)"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 18px rgba(34,197,94,0.45)'"
                    onmouseout="this.style.transform='';this.style.boxShadow='0 3px 12px rgba(34,197,94,0.3)'">
                    📥 Выгрузить в Excel
                </button>
                <button onclick="AdminUI.exportPricesToExcel('all')" id="btnExportAllExcel"
                    style="display:flex;align-items:center;gap:0.4rem;padding:0.55rem 1.1rem;background:linear-gradient(135deg,#8b5cf6,#6366f1);color:#fff;border:none;border-radius:10px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all .2s;box-shadow:0 3px 12px rgba(139,92,246,0.3)"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 18px rgba(139,92,246,0.45)'"
                    onmouseout="this.style.transform='';this.style.boxShadow='0 3px 12px rgba(139,92,246,0.3)'">
                    📊 Выгрузить всё (3 листа)
                </button>
                <label id="btnImportExcelPrices"
                    style="display:flex;align-items:center;gap:0.4rem;padding:0.55rem 1.1rem;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;border:none;border-radius:10px;font-size:0.85rem;font-weight:600;cursor:pointer;transition:all .2s;box-shadow:0 3px 12px rgba(59,130,246,0.3)"
                    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 6px 18px rgba(59,130,246,0.45)'"
                    onmouseout="this.style.transform='';this.style.boxShadow='0 3px 12px rgba(59,130,246,0.3)'">
                    📤 Загрузить Excel${overrideBadge}
                    <input type="file" accept=".xlsx,.xls" hidden
                        onchange="AdminUI.importPricesFromExcel(this)">
                </label>
                ${overrideStats.total > 0 ? `
                <button onclick="AdminUI.resetPriceOverrides()" id="btnResetPriceOverrides"
                    style="display:flex;align-items:center;gap:0.35rem;padding:0.55rem 0.95rem;background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);border-radius:10px;font-size:0.84rem;font-weight:600;cursor:pointer;transition:all .2s"
                    onmouseover="this.style.background='rgba(239,68,68,0.25)'"
                    onmouseout="this.style.background='rgba(239,68,68,0.15)'"
                    title="Сбросить все пользовательские цены">
                    🔄 Сбросить цены (${overrideStats.total})
                </button>` : ''}
            </div>

            <!-- Table Meta & Info -->
            <div style="font-size:0.85rem;color:#94a3b8;padding:0.7rem 1.75rem;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(15,23,42,0.45);display:flex;justify-content:space-between;align-items:center;">
                <span>Всего позиций в каталоге: <b style="color:#f8fafc;font-size:0.95rem;">${total.toLocaleString('ru')}</b>${q ? ' <span style="color:#8b5cf6;font-weight:600;">(по запросу)</span>' : ''}</span>
                ${pages > 1 ? `<span>Страница <b style="color:#f8fafc;">${page}</b> из <b>${pages}</b></span>` : ''}
            </div>

            <!-- Table -->
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                <thead>
                    <tr style="background:rgba(15,23,42,0.95);border-bottom:1px solid rgba(255,255,255,0.12);">
                        <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:110px;">Тип</th>
                        <th style="padding:0.9rem 1.25rem;text-align:left;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Наименование работ / материалов</th>
                        <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:140px;">Категория</th>
                        <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:90px;">Ед.</th>
                        <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#c084fc;text-transform:uppercase;letter-spacing:0.06em;width:130px;">⏱ Норма</th>
                        <th style="padding:0.9rem 1.5rem;text-align:right;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:160px;">💰 Цена (₸)</th>
                    </tr>
                </thead>
                <tbody>${rows || `<tr><td colspan="6" style="text-align:center;padding:4rem;color:#94a3b8;font-size:1.05rem;">🔍 Ничего не найдено по запросу</td></tr>`}</tbody>
            </table>
            </div>

            <!-- Pagination Bar -->
            ${pBtns.length ? `<div style="display:flex;justify-content:center;align-items:center;gap:0.45rem;padding:1.35rem;background:rgba(15,23,42,0.5);border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;">${pBtns.join('')}</div>` : ''}
        </div>`;
    }


    // =============================================
    // 8. MODERATION TAB
    // =============================================


    function _renderModerationTab() {
        const queue = _getModerationQueue();

        return `
            <div class="admin-panel">
                <div class="admin-panel-header">
                    <div class="admin-panel-title">
                        🛡️ Очередь модерации
                        <span style="font-weight:400;color:var(--text-muted,#888);font-size:0.85rem;margin-left:0.5rem;">(${queue.length} элементов)</span>
                    </div>
                    <div class="admin-panel-actions">
                        <button class="admin-btn admin-btn-success admin-btn-sm" onclick="AdminUI.approveAll()">
                            ✅ Одобрить все
                        </button>
                    </div>
                </div>

                <div class="admin-moderation-list">
                    ${queue.length === 0 ? `
                        <div class="admin-empty">
                            <div class="admin-empty-icon">🎉</div>
                            <div class="admin-empty-title">Очередь пуста</div>
                            <div class="admin-empty-desc">Нет элементов для модерации</div>
                        </div>
                    ` : queue.map(item => `
                        <div class="admin-mod-item" id="mod-${item.id}">
                            <div class="admin-mod-avatar ${item.type}">
                                ${item.icon}
                            </div>
                            <div class="admin-mod-content">
                                <div class="admin-mod-title">${item.title}</div>
                                <div class="admin-mod-desc">${item.desc}</div>
                                <div class="admin-mod-meta">
                                    <span class="admin-mod-tag ${item.status}">${item.status === 'pending' ? '⏳ Ожидает' : '✅ Проверено'}</span>
                                    ${item.priority === 'urgent' ? '<span class="admin-mod-tag urgent">🔴 Срочно</span>' : ''}
                                    <span class="admin-mod-tag time">🕐 ${_timeAgo(item.date)}</span>
                                    <span class="admin-mod-tag info">${item.entityType}</span>
                                </div>
                            </div>
                            <div class="admin-mod-actions">
                                <button class="admin-btn admin-btn-sm admin-btn-success"
                                        onclick="AdminUI.approveMod('${item.id}')"
                                        title="Одобрить">✅</button>
                                <button class="admin-btn admin-btn-sm admin-btn-danger"
                                        onclick="AdminUI.rejectMod('${item.id}')"
                                        title="Отклонить">❌</button>
                                <button class="admin-btn admin-btn-sm admin-btn-secondary"
                                        onclick="AdminUI.viewMod('${item.id}')"
                                        title="Подробнее">👁️</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // =============================================
    // 9. REGIONS TAB
    // =============================================

    function _renderRegionsTab() {
        const regions = _getRegions();

        return `
            <div class="admin-panel">
                <div class="admin-panel-header">
                    <div class="admin-panel-title">
                        🗺️ Региональные коэффициенты
                    </div>
                    <div class="admin-panel-actions">
                        <button class="admin-btn admin-btn-success" onclick="AdminUI.addRegion()">
                            ➕ Добавить регион
                        </button>
                    </div>
                </div>

                <div class="admin-regions-grid">
                    ${Object.entries(regions)
                .filter(([key]) => key !== 'default')
                .sort((a, b) => b[1] - a[1])
                .map(([region, coeff]) => {
                    const cls = coeff > 1.1 ? 'high' : coeff < 1.0 ? 'low' : 'normal';
                    return `
                                <div class="admin-region-card" onclick="AdminUI.editRegion('${region}', ${coeff})">
                                    <div class="admin-region-name">📍 ${region}</div>
                                    <div class="admin-region-coeff ${cls}">×${coeff.toFixed(2)}</div>
                                </div>
                            `;
                }).join('')}
                </div>

                <div style="padding:1rem 1.5rem;border-top:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:0.82rem;color:var(--text-muted,#888);">
                        💡 <b>Коэффициент</b> умножается на базовую цену. Например, Атырау ×1.25 = +25% к стоимости.
                        <br>Базовый коэффициент (Алматы) = 1.00
                    </div>
                </div>
            </div>
        `;
    }

    // =============================================
    // 10. AUDIT TAB
    // =============================================

    function _renderAuditTab() {
        return `
            <div class="admin-panel">
                <div class="admin-panel-header">
                    <div class="admin-panel-title">
                        📜 Журнал действий
                    </div>
                    <div class="admin-panel-actions">
                        <button class="admin-btn admin-btn-secondary admin-btn-sm" onclick="AdminUI.exportAudit()">
                            📥 Экспорт
                        </button>
                    </div>
                </div>

                ${_auditLog.length === 0 ? `
                    <div class="admin-empty">
                        <div class="admin-empty-icon">📜</div>
                        <div class="admin-empty-title">Журнал пуст</div>
                        <div class="admin-empty-desc">Действия администратора будут записываться здесь</div>
                    </div>
                ` : _auditLog.map(entry => `
                    <div class="admin-audit-item">
                        <div class="admin-audit-time">${_formatDate(entry.timestamp)}</div>
                        <div class="admin-audit-action ${entry.action}">${_getActionLabel(entry.action)}</div>
                        <div class="admin-audit-desc">${entry.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    function _getActionLabel(action) {
        const map = {
            create: '✅ Создание',
            update: '✏️ Изменение',
            delete: '🗑️ Удаление',
            approve: '👍 Одобрение',
            reject: '❌ Отклонение'
        };
        return map[action] || action;
    }

    // =============================================
    // 11. EDIT PRICE MODAL
    // =============================================

    function _openEditModal(code, category, isNew) {
        const db = _getPriceDB();
        let item = {};

        if (!isNew && db) {
            const data = _priceType === 'materials' ? db.MATERIALS : db.WORKS;
            if (data && data[category] && data[category][code]) {
                item = { code, category, ...data[category][code] };
            }
        }

        const categories = _getCategories(_priceType);

        const overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.id = 'adminEditOverlay';
        overlay.onclick = (e) => { if (e.target === overlay) closeEditModal(); };

        overlay.innerHTML = `
            <div class="admin-modal">
                <div class="admin-modal-header">
                    <div class="admin-modal-title">${isNew ? '➕ Новая позиция' : '✏️ Редактирование'}</div>
                    <button class="admin-modal-close" onclick="AdminUI.closeEditModal()">✕</button>
                </div>
                <div class="admin-modal-body">
                    <div class="admin-form-group">
                        <label class="admin-form-label">Код</label>
                        <input class="admin-form-input" id="editCode" value="${item.code || ''}" 
                               placeholder="например: concrete_M400" ${isNew ? '' : 'readonly'}>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Название</label>
                        <input class="admin-form-input" id="editName" value="${item.name || ''}" 
                               placeholder="Бетон М400">
                    </div>
                    <div class="admin-form-row">
                        <div class="admin-form-group">
                            <label class="admin-form-label">Категория</label>
                            <select class="admin-form-input" id="editCategory">
                                ${categories.map(c => `<option value="${c}" ${item.category === c ? 'selected' : ''}>${_getCategoryLabel(c)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="admin-form-group">
                            <label class="admin-form-label">Единица измерения</label>
                            <input class="admin-form-input" id="editUnit" value="${item.unit || ''}" 
                                   placeholder="м³, м², шт, кг">
                        </div>
                    </div>
                    <div class="admin-form-group">
                        <label class="admin-form-label">Цена (₸)</label>
                        <input class="admin-form-input" id="editPrice" type="number" value="${item.price || ''}" 
                               placeholder="28000" step="100">
                    </div>
                </div>
                <div class="admin-modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="AdminUI.closeEditModal()">Отмена</button>
                    <button class="admin-btn admin-btn-primary" onclick="AdminUI.saveItem(${isNew})">
                        💾 ${isNew ? 'Добавить' : 'Сохранить'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // ESC handler
        const esc = (e) => {
            if (e.key === 'Escape') {
                closeEditModal();
                document.removeEventListener('keydown', esc);
            }
        };
        document.addEventListener('keydown', esc);
    }

    function closeEditModal() {
        const overlay = document.getElementById('adminEditOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        }
    }

    // =============================================
    // 12. ACTIONS
    // =============================================

    function setTab(tab) {
        _activeTab = tab;
        _currentPage = 1;
        _render();
    }

    function setPriceType(type) {
        _priceType = type;
        _categoryFilter = 'all';
        _currentPage = 1;
        _render();
    }

    function setCategory(cat) {
        _categoryFilter = cat;
        _currentPage = 1;
        _render();
    }

    function search(query) {
        _searchQuery = query;
        _currentPage = 1;
        // Debounce render
        clearTimeout(AdminUI._searchTimeout);
        AdminUI._searchTimeout = setTimeout(() => _render(), 200);
    }

    function sort(field) {
        if (_sortField === field) {
            _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
        } else {
            _sortField = field;
            _sortDir = 'asc';
        }
        _render();
    }

    function goPage(page) {
        _currentPage = page;
        _render();
    }

    function editItem(code, category) {
        _openEditModal(code, category, false);
    }

    function addNewItem() {
        _openEditModal('', _getCategories(_priceType)[0] || '', true);
    }

    function saveItem(isNew) {
        const code = document.getElementById('editCode')?.value?.trim();
        const name = document.getElementById('editName')?.value?.trim();
        const category = document.getElementById('editCategory')?.value;
        const unit = document.getElementById('editUnit')?.value?.trim();
        const price = parseFloat(document.getElementById('editPrice')?.value) || 0;

        if (!code || !name || !price) {
            window.showToast && window.showToast('❌ Заполните все обязательные поля');
            return;
        }

        // Update in-memory database
        const db = _getPriceDB();
        if (db) {
            const data = _priceType === 'materials' ? db.MATERIALS : db.WORKS;
            if (data) {
                if (!data[category]) data[category] = {};
                const oldPrice = data[category][code]?.price;
                data[category][code] = { name, unit, price, category };

                if (isNew) {
                    _addAuditEntry('create', `Добавлена позиция «${name}» (${code}): ${_formatMoney(price)}`);
                } else {
                    _addAuditEntry('update', `Цена «${name}» обновлена: ${_formatMoney(oldPrice)} → ${_formatMoney(price)}`);
                }
            }
        }

        closeEditModal();
        _render();
        window.showToast && window.showToast(`✅ ${isNew ? 'Позиция добавлена' : 'Цена обновлена'}: ${name}`);
    }

    function deleteItem(code, category) {
        _showConfirmModal(`Удалить позицию «${code}»?`, 'Это действие нельзя отменить.', () => {
            const db = _getPriceDB();
            if (db) {
                const data = _priceType === 'materials' ? db.MATERIALS : db.WORKS;
                if (data && data[category]) {
                    const name = data[category][code]?.name || code;
                    delete data[category][code];
                    _addAuditEntry('delete', `Удалена позиция «${name}» (${code})`);
                }
            }
            _render();
            window.showToast && window.showToast('🗑️ Позиция удалена');
        });
    }

    function _showConfirmModal(title, desc, onConfirm) {
        const overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.id = 'adminConfirmOverlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
        <div class="admin-modal" style="max-width:400px">
            <div class="admin-modal-header">
                <div class="admin-modal-title">⚠️ ${title}</div>
                <button class="admin-modal-close" onclick="document.getElementById('adminConfirmOverlay').remove()">✕</button>
            </div>
            <div class="admin-modal-body">
                <p style="color:var(--text-muted,#888);font-size:0.9rem;">${desc}</p>
            </div>
            <div class="admin-modal-footer">
                <button class="admin-btn admin-btn-secondary" onclick="document.getElementById('adminConfirmOverlay').remove()">Отмена</button>
                <button class="admin-btn admin-btn-danger" id="adminConfirmBtn">🗑️ Удалить</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        document.getElementById('adminConfirmBtn').onclick = () => {
            overlay.remove();
            onConfirm();
        };
    }

    function _showPromptModal(title, label, defaultVal, onSubmit) {
        const overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.id = 'adminPromptOverlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
        overlay.innerHTML = `
        <div class="admin-modal" style="max-width:420px">
            <div class="admin-modal-header">
                <div class="admin-modal-title">${title}</div>
                <button class="admin-modal-close" onclick="document.getElementById('adminPromptOverlay').remove()">✕</button>
            </div>
            <div class="admin-modal-body">
                <div class="admin-form-label">${label}</div>
                <input type="text" id="adminPromptInput" class="admin-form-input" value="${defaultVal}" style="width:100%;padding:0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:var(--text,#fff);font-size:0.95rem;">
            </div>
            <div class="admin-modal-footer">
                <button class="admin-btn admin-btn-secondary" onclick="document.getElementById('adminPromptOverlay').remove()">Отмена</button>
                <button class="admin-btn admin-btn-success" id="adminPromptSubmit">✅ Сохранить</button>
            </div>
        </div>`;
        document.body.appendChild(overlay);
        setTimeout(() => document.getElementById('adminPromptInput').focus(), 100);
        document.getElementById('adminPromptSubmit').onclick = () => {
            const val = document.getElementById('adminPromptInput').value;
            overlay.remove();
            onSubmit(val);
        };
        document.getElementById('adminPromptInput').onkeydown = (e) => {
            if (e.key === 'Enter') document.getElementById('adminPromptSubmit').click();
        };
    }

    function approveMod(id) {
        const el = document.getElementById(`mod-${id}`);
        if (el) {
            el.style.opacity = '0.3';
            el.style.transform = 'translateX(50px)';
            setTimeout(() => {
                el.remove();
            }, 300);
        }

        _addAuditEntry('approve', `Элемент модерации #${id.replace('mod_', '')} одобрен`);
        window.showToast && window.showToast('✅ Одобрено');
    }

    function rejectMod(id) {
        const el = document.getElementById(`mod-${id}`);
        if (el) {
            el.style.opacity = '0.3';
            el.style.transform = 'translateX(-50px)';
            setTimeout(() => {
                el.remove();
            }, 300);
        }

        _addAuditEntry('reject', `Элемент модерации #${id.replace('mod_', '')} отклонён`);
        window.showToast && window.showToast('❌ Отклонено');
    }

    function viewMod(id) {
        const queue = _getModerationQueue();
        const item = queue.find(m => m.id === id);
        if (!item) return;

        const overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.id = 'adminModViewOverlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="admin-modal">
                <div class="admin-modal-header">
                    <div class="admin-modal-title">${item.icon} ${item.title}</div>
                    <button class="admin-modal-close" onclick="document.getElementById('adminModViewOverlay').remove()">✕</button>
                </div>
                <div class="admin-modal-body">
                    <div style="margin-bottom:1rem;">
                        <div class="admin-form-label">Описание</div>
                        <div style="font-size:0.9rem;line-height:1.5;color:var(--text);">${item.desc}</div>
                    </div>
                    <div class="admin-form-row">
                        <div>
                            <div class="admin-form-label">Тип</div>
                            <div style="font-size:0.9rem;">${item.entityType}</div>
                        </div>
                        <div>
                            <div class="admin-form-label">Дата</div>
                            <div style="font-size:0.9rem;">${_formatDate(item.date)}</div>
                        </div>
                    </div>
                    <div style="margin-top:1rem;">
                        <div class="admin-form-label">Приоритет</div>
                        <span class="admin-mod-tag ${item.priority === 'urgent' ? 'urgent' : 'pending'}">
                            ${item.priority === 'urgent' ? '🔴 Срочно' : '🟡 Обычный'}
                        </span>
                    </div>
                    ${item.entity ? `
                        <div style="margin-top:1rem;padding:1rem;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06);">
                            <div class="admin-form-label">Детали объекта</div>
                            <pre style="font-size:0.75rem;color:var(--text-muted,#888);overflow:auto;max-height:200px;white-space:pre-wrap;">${JSON.stringify(item.entity, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
                <div class="admin-modal-footer">
                    <button class="admin-btn admin-btn-danger" onclick="AdminUI.rejectMod('${item.id}'); document.getElementById('adminModViewOverlay').remove();">❌ Отклонить</button>
                    <button class="admin-btn admin-btn-success" onclick="AdminUI.approveMod('${item.id}'); document.getElementById('adminModViewOverlay').remove();">✅ Одобрить</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    async function approveAll() {
        const queue = _getModerationQueue();
        const ok = await (window.QazUI?.confirm || window.confirm)('Одобрить все элементы?', `Будут одобрены все ${queue.length} элементов в очереди`, { icon: '✅', confirmText: 'Одобрить все' });
        if (!ok) return;
        queue.forEach(q => {
            _addAuditEntry('approve', `Массовое одобрение: ${q.title}`);
        });
        window.showToast && window.showToast(`✅ Все ${queue.length} элементов одобрены`);
        _render();
    }

    function editRegion(region, current) {
        _showPromptModal(
            `📍 Регион «${region}»`,
            `Коэффициент (текущий: ×${current.toFixed(2)}):`,
            current.toFixed(2),
            (newCoeff) => {
                const val = parseFloat(newCoeff);
                if (isNaN(val) || val <= 0 || val > 3) {
                    window.showToast && window.showToast('❌ Некорректное значение (0 < x ≤ 3)');
                    return;
                }
                const db = _getPriceDB();
                if (db) {
                    if (!db.REGIONAL_COEFFICIENTS) db.REGIONAL_COEFFICIENTS = {};
                    db.REGIONAL_COEFFICIENTS[region] = val;
                    _addAuditEntry('update', `Коэффициент «${region}»: ×${current.toFixed(2)} → ×${val.toFixed(2)}`);
                }
                _render();
                window.showToast && window.showToast(`✅ Коэффициент «${region}» обновлён: ×${val.toFixed(2)}`);
            }
        );
    }

    function addRegion() {
        // Step 1: ask for region name
        _showPromptModal('🗺️ Новый регион', 'Название региона:', '', (name) => {
            if (!name || !name.trim()) return;
            // Step 2: ask for coefficient
            _showPromptModal(`📍 Регион «${name.trim()}»`, 'Коэффициент (например, 1.10):', '1.00', (coeff) => {
                const val = parseFloat(coeff);
                if (isNaN(val) || val <= 0 || val > 3) {
                    window.showToast && window.showToast('❌ Некорректное значение (0 < x ≤ 3)');
                    return;
                }
                const db = _getPriceDB();
                if (!db) {
                    window.showToast && window.showToast('❌ База данных прайсов не загружена');
                    return;
                }
                if (!db.REGIONAL_COEFFICIENTS) db.REGIONAL_COEFFICIENTS = {};
                db.REGIONAL_COEFFICIENTS[name.trim()] = val;
                _addAuditEntry('create', `Добавлен регион «${name.trim()}» с коэффициентом ×${val.toFixed(2)}`);
                _render();
                window.showToast && window.showToast(`✅ Регион «${name.trim()}» добавлен`);
            });
        });
    }

    function exportAudit() {
        const text = _auditLog.map(e =>
            `${_formatDate(e.timestamp)} | ${e.action.toUpperCase()} | ${e.description}`
        ).join('\n');

        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin_audit_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        window.showToast && window.showToast('📥 Журнал экспортирован');
    }

    // =============================================
    // 12b. DATABASE & SETTINGS ACTIONS
    // =============================================

    function setDbType(type) { _dbType = type; _dbView = 'grouped'; _dbSearch = ''; _dbPage = 1; _render(); }
    function setDbView(view) { _dbView = view; _dbSearch = ''; _dbPage = 1; _render(); }
    function setDbSearch(q) { _dbSearch = q; _dbPage = 1; _render(); }
    function setDbPage(p) { _dbPage = Math.max(1, parseInt(p) || 1); _render(); }
    function setSettingsSection(s) { _settingsSection = s; _render(); }

    function _getFullItemsList(type) {
        const prefixes = type === 'works' ? ['AI_WRK_', 'AI_WORK_'] :
            type === 'materials' ? ['AI_MAT_'] : ['AI_EQ_'];
        const items = [];
        for (const prefix of prefixes) {
            for (const key of Object.keys(window)) {
                if (!key.startsWith(prefix)) continue;
                const obj = window[key];
                if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue;
                const source = key.replace(prefix, '').toLowerCase();
                for (const code of Object.keys(obj)) {
                    const item = obj[code];
                    if (item && typeof item === 'object' && item.name) {
                        items.push({
                            code, source,
                            name: item.name,
                            unit: item.unit || '—',
                            price: item.price || 0,
                            labor: item.labor || null
                        });
                    }
                }
            }
        }
        return items;
    }

    function _renderFullItemsList(type) {
        const all = _getFullItemsList(type);
        const q = _dbSearch.toLowerCase().trim();
        const filtered = q ? all.filter(i =>
            i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q) || i.source.includes(q)
        ) : all;
        const PS = 50, total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / PS));
        const page = Math.min(_dbPage, pages);
        const slice = filtered.slice((page - 1) * PS, page * PS);
        const clr = { works: '#4ade80', materials: '#60a5fa', equipment: '#fbbf24' }[type] || '#fff';

        const fmtLabor = (labor) => {
            if (!labor) return '<span style="color:rgba(255,255,255,0.2)">—</span>';
            const h = labor.norm;
            const val = h < 1 ? Math.round(h * 60) + '&nbsp;мин' : (h === Math.floor(h) ? h + '&nbsp;ч-ч' : h.toFixed(2) + '&nbsp;ч-ч');
            return `<span title="${labor.src || ''}" style="color:${type === 'works' ? '#c084fc' : '#94a3b8'};font-weight:600;background:rgba(192,132,252,0.12);padding:0.25rem 0.6rem;border-radius:6px;border:1px solid rgba(192,132,252,0.2);display:inline-block">${val}</span>`;
        };
        const rows = slice.map((it, idx) => {
            const bgStyle = idx % 2 === 0 ? 'background:rgba(255,255,255,0.015);' : '';
            return `<tr style="${bgStyle}border-bottom:1px solid rgba(255,255,255,0.05);transition:all 0.15s ease;"
                onmouseover="this.style.background='rgba(139,92,246,0.12)';"
                onmouseout="this.style.background='${idx % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent'}';">
                <td data-label="Код" style="padding:0.8rem 0.75rem;font-size:0.78rem;color:#94a3b8;font-weight:600;white-space:nowrap;width:110px;text-align:center;">${it.code}</td>
                <td data-label="Наименование" style="padding:0.8rem 1.25rem;font-size:0.92rem;color:#f8fafc;font-weight:500;line-height:1.45;word-break:break-word;" title="${it.name}">${it.name}</td>
                <td data-label="Раздел" style="padding:0.8rem 0.75rem;text-align:center;width:140px;"><span style="font-size:0.78rem;padding:0.25rem 0.6rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:#cbd5e1;font-weight:500;display:inline-block;white-space:nowrap">${it.source}</span></td>
                <td data-label="Ед.изм." style="padding:0.8rem 0.75rem;text-align:center;font-size:0.88rem;color:#cbd5e1;font-weight:600;width:90px;">${it.unit}</td>
                <td data-label="Трудозатраты" style="padding:0.8rem 0.75rem;text-align:center;font-size:0.88rem;white-space:nowrap;width:130px;">${fmtLabor(it.labor)}</td>
                <td data-label="Цена" style="padding:0.8rem 1.5rem;text-align:right;font-weight:700;font-size:1.02rem;color:${clr};white-space:nowrap;width:160px;">${it.price ? it.price.toLocaleString('ru-RU') + '\u00a0₸' : '<span style="color:rgba(255,255,255,0.25)">—</span>'}</td>
            </tr>`;
        }).join('');

        const mkBtn = (p, label = p, active = false) =>
            `<button onclick="AdminUI.setDbPage(${p})" style="padding:0.4rem 0.85rem;border-radius:8px;border:1px solid ${active ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)'};background:${active ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.05)'};color:${active ? '#fff' : 'rgba(255,255,255,0.7)'};cursor:pointer;font-size:0.85rem;font-weight:${active ? '700' : '500'};min-width:38px;box-shadow:${active ? '0 2px 10px rgba(139,92,246,0.35)' : 'none'};transition:all 0.15s ease;"
            onmouseover="if(!${active})this.style.background='rgba(255,255,255,0.1)'" onmouseout="if(!${active})this.style.background='rgba(255,255,255,0.05)'">${label}</button>`;
        const paginBtns = [];
        if (pages > 1) {
            if (page > 1) paginBtns.push(mkBtn(page - 1, '◀'));
            const lo = Math.max(1, page - 2), hi = Math.min(pages, page + 2);
            if (lo > 1) { paginBtns.push(mkBtn(1)); if (lo > 2) paginBtns.push('<span style="color:rgba(255,255,255,0.3);padding:0 0.3rem;align-self:center">…</span>'); }
            for (let p = lo; p <= hi; p++) paginBtns.push(mkBtn(p, p, p === page));
            if (hi < pages) { if (hi < pages - 1) paginBtns.push('<span style="color:rgba(255,255,255,0.3);padding:0 0.3rem;align-self:center">…</span>'); paginBtns.push(mkBtn(pages)); }
            if (page < pages) paginBtns.push(mkBtn(page + 1, '▶'));
        }

        return `<div style="font-size:0.85rem;color:#94a3b8;padding:0.7rem 1.75rem;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(15,23,42,0.45);display:flex;justify-content:space-between;align-items:center;">
            <span>Всего позиций в списке: <b style="color:#f8fafc;font-size:0.95rem;">${total.toLocaleString('ru')}</b>${q ? ' <span style="color:#8b5cf6;font-weight:600;">(по запросу)</span>' : ''}</span>
            ${pages > 1 ? `<span>Страница <b style="color:#f8fafc;">${page}</b> из <b>${pages}</b></span>` : ''}
        </div>
        <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
            <thead><tr style="background:rgba(15,23,42,0.95);border-bottom:1px solid rgba(255,255,255,0.12);">
                <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:110px;">Код</th>
                <th style="padding:0.9rem 1.25rem;text-align:left;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Наименование</th>
                <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:140px;">Категория</th>
                <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:90px;">Ед.</th>
                <th style="padding:0.9rem 0.75rem;text-align:center;font-weight:700;font-size:0.78rem;color:#c084fc;text-transform:uppercase;letter-spacing:0.06em;width:130px;">⏱ Норма</th>
                <th style="padding:0.9rem 1.5rem;text-align:right;font-weight:700;font-size:0.78rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;width:160px;">💰 Цена (₸)</th>
            </tr></thead>
            <tbody>${rows || '<tr><td colspan="6" style="text-align:center;padding:4rem;color:#94a3b8;font-size:1.05rem;">🔍 Ничего не найдено</td></tr>'}</tbody>
        </table></div>
        ${paginBtns.length ? `<div style="display:flex;justify-content:center;align-items:center;gap:0.45rem;padding:1.35rem;background:rgba(15,23,42,0.5);border-top:1px solid rgba(255,255,255,0.06);flex-wrap:wrap;">${paginBtns.join('')}</div>` : ''}`;
    }

    function _renderSettingsTab() {
        const inner = _settingsSection === 'regions' ? _renderRegionsTab() : _renderAuditTab();
        const btn = (s, label, icon) =>
            `<button onclick="AdminUI.setSettingsSection('${s}')" style="padding:0.35rem 0.9rem;border-radius:6px;border:none;
            background:${_settingsSection === s ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.06)'};
            color:${_settingsSection === s ? '#fff' : 'rgba(255,255,255,0.5)'};font-size:0.82rem;cursor:pointer;font-weight:${_settingsSection === s ? '600' : '400'}">
            ${icon} ${label}</button>`;
        return `<div class="admin-panel">
            <div class="admin-panel-header">
                <div class="admin-panel-title">⚙️ Управление</div>
                <div style="display:flex;gap:0.5rem">
                    ${btn('regions', 'Регионы', '🗺️')}
                    ${btn('audit', 'Журнал аудита', '📜')}
                    <button onclick="AdminUI.exportAudit()" style="padding:0.35rem 0.9rem;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:rgba(255,255,255,0.55);font-size:0.8rem;cursor:pointer">📥 Экспорт</button>
                </div>
            </div>
            ${inner}
        </div>`;
    }

    // =============================================
    // 13. WBS TAB
    // =============================================


    let _wbsCategory = 'all';
    let _wbsSearchQuery = '';

    function _setWbsCat(cat) {
        _wbsCategory = cat;
        _wbsSearchQuery = '';
        _render();
    }

    function _searchWbs(q) {
        _wbsSearchQuery = q;
        _render();
    }

    function setWbsPrice(id, price) {
        const numPrice = parseFloat(price);
        if (isNaN(numPrice) || numPrice < 0) {
            window.showToast && window.showToast('❌ Некорректная цена');
            return;
        }
        // Store custom WBS prices in localStorage
        const key = 'adminWbsPrices';
        const prices = JSON.parse(localStorage.getItem(key) || '{}');
        prices[id] = numPrice;
        localStorage.setItem(key, JSON.stringify(prices));
        _addAuditEntry('price_update', `WBS цена обновлена: ${id} = ${numPrice}`);
        window.showToast && window.showToast('✅ Цена обновлена');
        _render();
    }

    function _renderWBSTab() {
        const wbsData = (typeof AI_WBS_STRUCTURE !== 'undefined') ? AI_WBS_STRUCTURE : [];
        const savedPrices = JSON.parse(localStorage.getItem('adminWbsPrices') || '{}');

        const allGroups = wbsData.map(g => ({
            name: g.group_name,
            subgroups: g.subgroups || []
        }));

        const filtered = allGroups.map(g => ({
            ...g,
            subgroups: g.subgroups.filter(s =>
                (_wbsCategory === 'all' || g.name === _wbsCategory) &&
                (!_wbsSearchQuery || s.toLowerCase().includes(_wbsSearchQuery.toLowerCase()))
            )
        })).filter(g => g.subgroups.length > 0);

        const catOptions = ['all', ...allGroups.map(g => g.name)].map(c =>
            `<option value="${c}" ${_wbsCategory === c ? 'selected' : ''}>${c === 'all' ? '— Все разделы —' : c}</option>`
        ).join('');

        const rows = filtered.map(g => `
            <details open style="border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:0.25rem">
                <summary style="cursor:pointer;padding:0.5rem 0.75rem;font-weight:600;font-size:0.85rem;
                    background:rgba(255,255,255,0.04);list-style:none;display:flex;justify-content:space-between">
                    <span>${g.name}</span>
                    <span style="color:rgba(255,255,255,0.4);font-weight:400">${g.subgroups.length} видов</span>
                </summary>
                <div style="padding:0.35rem 0">
                    ${g.subgroups.map(s => {
            const sid = btoa(encodeURIComponent(s)).slice(0, 16);
            const price = savedPrices[sid] || '';
            return `<div style="display:flex;justify-content:space-between;align-items:center;
                            padding:0.3rem 0.85rem;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.8rem">
                            <span style="color:rgba(255,255,255,0.75);flex:1">${s}</span>
                            <div style="display:flex;gap:0.4rem;align-items:center">
                                <input type="number" placeholder="Цена" value="${price}"
                                    style="width:90px;padding:0.2rem 0.4rem;background:rgba(255,255,255,0.07);
                                    border:1px solid rgba(255,255,255,0.1);border-radius:4px;color:#fff;font-size:0.75rem"
                                    onchange="AdminUI.setWbsPrice('${sid}', this.value)">
                                <span style="font-size:0.7rem;color:rgba(255,255,255,0.3)">₸/ед</span>
                            </div>
                        </div>`;
        }).join('')}
                </div>
            </details>`).join('');

        const totalItems = filtered.reduce((s, g) => s + g.subgroups.length, 0);

        return `
        <div class="admin-panel">
            <div class="admin-panel-header">
                <div class="admin-panel-title">📚 WBS Каталог — Виды работ по стандарту</div>
            </div>
            <div style="padding:0.75rem 1rem;display:flex;gap:0.75rem;border-bottom:1px solid rgba(255,255,255,0.06)">
                <select onchange="AdminUI._setWbsCat(this.value)"
                    style="padding:0.4rem 0.6rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
                    border-radius:6px;color:#fff;font-size:0.82rem;flex:1">${catOptions}</select>
                <input type="text" placeholder="🔍 Поиск..." value="${_wbsSearchQuery}"
                    oninput="AdminUI._searchWbs(this.value)"
                    style="padding:0.4rem 0.6rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);
                    border-radius:6px;color:#fff;font-size:0.82rem;flex:1">
                <span style="font-size:0.8rem;color:rgba(255,255,255,0.45);align-self:center;white-space:nowrap">${totalItems} видов</span>
            </div>
            <div style="overflow-y:auto;max-height:calc(100vh - 280px)">
                ${rows || '<div style="padding:2rem;text-align:center;color:rgba(255,255,255,0.3)">Ничего не найдено</div>'}
            </div>
        </div>`;
    }

    // =============================================
    // 13a. DATABASE TAB
    // =============================================


    function _countGlobalItems(prefix) {
        const result = { files: [], totalItems: 0, categories: {} };
        for (const key of Object.keys(window)) {
            if (key.startsWith(prefix)) {
                const obj = window[key];
                if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
                    const count = Object.keys(obj).length;
                    const shortName = key.replace(prefix, '').toLowerCase();
                    result.files.push({ name: key, shortName, count });
                    result.totalItems += count;
                    for (const itemKey of Object.keys(obj)) {
                        const item = obj[itemKey];
                        const cat = (item && item.category) || 'uncategorized';
                        result.categories[cat] = (result.categories[cat] || 0) + 1;
                    }
                }
            }
        }
        result.files.sort((a, b) => b.count - a.count);
        return result;
    }

    function _renderWbsGrouped(wrk, work_) {

        // ---- WBS GROUPS: ТОЧНЫЙ маппинг по shortName (Set-based) ----
        const WBS_GROUPS = [
            {
                code: '0.0', icon: '🏗️', name: 'Подготовительные работы',
                files: new Set(['demolition', 'demolition_ext2', 'demolition_full', 'geotech', 'mechanization', 'protection', 'prep_works'])
            },
            {
                code: '1.0', icon: '🌍', name: 'Земляные работы',
                files: new Set(['earthwork', 'earthwork_ext2', 'earthwork_full', 'underground', 'water_treatment', 'watertreat', 'waterfront', 'irrigation'])
            },
            {
                code: '2.0', icon: '🏛️', name: 'Фундамент',
                files: new Set(['foundation', 'foundation_ext', 'foundation_full', 'piling_full', 'reinforce'])
            },
            {
                code: '3.0', icon: '⬛', name: 'Каркас / Несущие конструкции',
                files: new Set(['concrete', 'concrete_ext2', 'concrete_full', 'monolith_full',
                    'precast', 'precast_full', 'jbi', 'metalwork', 'metalwork_full', 'metalwork_full2', 'metalwork2',
                    'steelworks', 'craneworks', 'modular', 'modular2', 'wood_construction', 'woodhouse',
                    'bridges', 'tunnels', 'reconstruction', 'reconstruction2', 'stairs', 'stairs2',
                    'earth_concrete_rebar_ext', 'concrete_catalog'])
            },
            {
                code: '4.0', icon: '🏠', name: 'Кровля',
                files: new Set(['roofing', 'roofing_ext', 'roofing_full', 'roofing_full2', 'roof_full',
                    'waterproof', 'waterproofing_full', 'waterproof_fire_demo', 'roofing_catalog'])
            },
            {
                code: '5.0', icon: '🧱', name: 'Наружные стены / Фасад',
                files: new Set(['masonry', 'masonry_ext', 'masonry_full', 'masonry_full2',
                    'facade', 'facade_ext2', 'facade_full', 'facade_full2', 'facade_sys',
                    'insulation', 'insulation_all', 'insulation_full', 'insulation_full2',
                    'gkl_masonry_facade_roof_ext', 'masonry_catalog', 'facade_windows_catalog'])
            },
            {
                code: '6.0', icon: '🚪', name: 'Окна и двери',
                files: new Set(['doors_windows_full', 'doors_windows_gates', 'windows',
                    'openings_full', 'openings_ext2', 'glass', 'glass2',
                    'elevators', 'elevators_full', 'elevators2'])
            },
            {
                code: '7.0', icon: '📋', name: 'Внутренние перегородки',
                files: new Set(['drywall', 'drywall_ext2', 'drywall_full', 'gkl_full',
                    'acoustics', 'cleanroom', 'special_rooms', 'drywall_ceiling_catalog'])
            },
            {
                code: '8.0', icon: '⚡', name: 'Электрика',
                files: new Set(['electrical', 'electrical_ext2', 'electrical_full', 'electrical_full2',
                    'electric_paint_tile_ext', 'power_supply', 'powerlines', 'smarthome', 'automation',
                    'bms', 'bms2', 'energy_eff', 'energy_ext', 'renewable_energy', 'electrical_catalog'])
            },
            {
                code: '9.0', icon: '🚰', name: 'Водоснабжение',
                files: new Set(['plumbing', 'plumbing_ext', 'plumbing_full', 'plumbing_full2',
                    'hydro', 'piping_full', 'water_ext2', 'sanitary', 'plumbing_catalog'])
            },
            {
                code: '10.0', icon: '🚽', name: 'Канализация / Дренаж',
                files: new Set(['ext_utilities', 'ext_networks', 'extnet_full', 'networks', 'ind_pipes'])
            },
            {
                code: '11.0', icon: '🔥', name: 'Отопление',
                files: new Set(['heating', 'heating_full', 'heatfloor', 'gas', 'gas_full', 'gassupply', 'fireplaces'])
            },
            {
                code: '12.0', icon: '❄️', name: 'Вентиляция и кондиционирование',
                files: new Set(['hvac', 'hvac_ext2', 'hvac_full', 'ventilation_full', 'vent_ac_heat_ext',
                    'cooling', 'climate', 'indvent', 'refrigeration', 'outdoor_hvac_catalog'])
            },
            {
                code: '13.0', icon: '🔨', name: 'Черновая отделка',
                files: new Set(['plaster', 'plaster_paint_full', 'plaster_plumbing_ext', 'plastering_full',
                    'screed_leveling', 'plaster_paint_catalog'])
            },
            {
                code: '14.0', icon: '🎨', name: 'Чистовая отделка',
                files: new Set(['painting', 'painting_full', 'decorative_ext', 'decorative_pool_misc', 'decor_elem',
                    'interior_decor', 'furniture', 'furniture2', 'textiles', 'restoration', 'restoration2',
                    'kitchen', 'balcony', 'finishing_ext', 'finishing_full',
                    'commercial_interiors', 'appliances', 'amenities_full'])
            },
            {
                code: '15.0', icon: '🪵', name: 'Полы',
                files: new Set(['flooring', 'flooring_detail', 'flooring_ceiling_stairs',
                    'tiling', 'tiling_full', 'tiling_floor_ext',
                    'ind_floors', 'indfloor', 'industrial_floors',
                    'woodwork', 'woodworks', 'tiling_floor_catalog'])
            },
            {
                code: '16.0', icon: '🟦', name: 'Потолки',
                files: new Set(['ceiling'])
            },
            {
                code: '17.0', icon: '🚿', name: 'Сантехника (приборы)',
                files: new Set(['pools', 'sauna'])
            },
            {
                code: '18.0', icon: '📡', name: 'Слаботочные системы',
                files: new Set(['low_voltage', 'low_voltage_full', 'lowvoltage', 'lowcurrent_full',
                    'telecom', 'telecom2', 'telecom3', 'security',
                    'fire', 'fire_safety', 'fire_safety_full', 'firesuppress',
                    'emergency', 'datacenter', 'smart_cctv_telecom'])
            },
            {
                code: '19.0', icon: '🌳', name: 'Благоустройство',
                files: new Set(['landscape', 'landscape_full', 'landscape_full2', 'landscape_pool_sauna',
                    'road', 'road_full', 'road_works', 'roads', 'roads2',
                    'fences', 'greenery', 'outdoor_light', 'parking', 'sports', 'sports2'])
            },
            {
                code: '20.0', icon: '🏁', name: 'Ввод в эксплуатацию / Спецработы',
                files: new Set(['maintenance', 'specworks', 'special', 'special_ext2', 'misc_ext',
                    'commercial_ext2', 'commercial_medical', 'medical_full',
                    'oilgas', 'oilgas_energy_railway',
                    'industrial', 'industrial_ext2', 'industrial2', 'industrial_spec', 'industrial_equip',
                    'warehouse', 'techequip', 'engineering', 'design_ext', 'design_services',
                    'special_catalog', 'turnkey_catalog'])
            },
        ];

        // Collect all work files from both prefixes
        const allWorkFiles = [
            ...wrk.files.map(f => ({ ...f })),
            ...work_.files.map(f => ({ ...f }))
        ];

        // Подгруппы из WBS-стандарта (window.AI_WBS_STRUCTURE)
        const wbsStructure = (typeof AI_WBS_STRUCTURE !== 'undefined') ? AI_WBS_STRUCTURE : [];

        // Name-normalisation map: WBS JSON group_name → code для сопоставления
        const WBS_NAME_MAP = {
            'Подготовительные работы': '0.0',
            'Земляные работы': '1.0',
            'Фундаменты': '2.0',
            'Каркас/несущие конструкции': '3.0',
            'Кровля': '4.0',
            'Наружные стены': '5.0',
            'Окна и двери': '6.0',
            'Внутренние перегородки': '7.0',
            'Электрика': '8.0',
            'Водоснабжение': '9.0',
            'Канализация': '10.0',
            'Отопление': '11.0',
            'Вентиляция и кондиционирование': '12.0',
            'Черновая отделка': '13.0',
            'Чистовая отделка': '14.0',
            'Полы': '15.0',
            'Потолки': '16.0',
            'Сантехнические приборы': '17.0',
            'Слаботочные системы': '18.0',
            'Благоустройство': '19.0',
            'Ввод в эксплуатацию': '20.0',
        };
        // Build subgroup lookup: code → string[]
        const wbsSubgroupMap = {};
        wbsStructure.forEach(g => {
            const code = WBS_NAME_MAP[g.group_name];
            if (code) wbsSubgroupMap[code] = g.subgroups || [];
        });

        // Exact Set-based assignment — each file matches at most one group
        const assigned = new Set();
        const groupData = WBS_GROUPS.map(grp => {
            const files = allWorkFiles.filter(f => {
                if (assigned.has(f.name)) return false;
                return grp.files.has(f.shortName);
            });
            files.forEach(f => assigned.add(f.name));
            const total = files.reduce((s, f) => s + f.count, 0);
            const wbsSubgroups = wbsSubgroupMap[grp.code] || [];
            return { code: grp.code, icon: grp.icon, name: grp.name, files, total, wbsSubgroups };
        });

        // Remaining unassigned → "Прочие" (если маппинг полный — будет пустым)
        const otherFiles = allWorkFiles.filter(f => !assigned.has(f.name));
        const otherTotal = otherFiles.reduce((s, f) => s + f.count, 0);


        const fileTags = (files, max) => files.slice(0, max).map(f =>
            `<span style="display:inline-block;margin:3px 4px;padding:0.25rem 0.6rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:6px;font-size:0.78rem;color:#cbd5e1">${f.shortName} <b style="color:#4ade80;margin-left:3px">${f.count}</b></span>`
        ).join('');

        // Сводка покрытия
        const assignedFiles = allWorkFiles.filter(f => assigned.has(f.name));
        const coveragePct = allWorkFiles.length ? Math.round(assignedFiles.length / allWorkFiles.length * 100) : 0;

        const wbsRows = groupData.map(grp => {
            const isEmpty = !grp.files.length;
            const subgroupsHtml = (!isEmpty && grp.wbsSubgroups.length) ? `
                <div style="margin-top:0.6rem;padding-top:0.5rem;border-top:1px solid rgba(255,255,255,0.08)">
                    <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:0.4rem;font-weight:600">📋 Виды работ по стандарту WBS (${grp.wbsSubgroups.length}):</div>
                    <div style="max-height:120px;overflow-y:auto;display:flex;flex-wrap:wrap;gap:4px">
                        ${grp.wbsSubgroups.map(s => `<span style="display:inline-block;padding:0.2rem 0.55rem;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);border-radius:6px;font-size:0.75rem;color:#cbd5e1;white-space:nowrap">${s}</span>`).join('')}
                    </div>
                </div>` : '';
            const subBadge = grp.wbsSubgroups.length
                ? `<span style="font-size:0.72rem;color:#a5b4fc;margin-left:0.5rem;background:rgba(99,102,241,0.15);padding:0.15rem 0.45rem;border-radius:6px;font-weight:500">${grp.wbsSubgroups.length} вид.</span>`
                : '';
            if (isEmpty) {
                return `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1.25rem;
                    border-bottom:1px solid rgba(255,255,255,0.04);opacity:0.4">
                    <span style="font-size:0.9rem;color:#94a3b8">${grp.icon} <span style="color:#64748b;font-size:0.78rem;font-weight:600">${grp.code}</span> ${grp.name}${subBadge}</span>
                    <span style="font-size:0.8rem;color:#64748b">— нет файлов</span>
                </div>`;
            }
            return `
            <details style="border-bottom:1px solid rgba(255,255,255,0.05);transition:all 0.15s ease;">
                <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;
                    padding:0.75rem 1.25rem;list-style:none;user-select:none;
                    transition:background 0.15s" onmouseover="this.style.background='rgba(139,92,246,0.08)'" onmouseout="this.style.background=''">
                    <span style="font-size:0.92rem;font-weight:600;color:#f8fafc;display:flex;align-items:center;gap:0.4rem;">
                        <span style="font-size:1.1rem">${grp.icon}</span>
                        <span style="color:#94a3b8;font-size:0.78rem;font-weight:700">${grp.code}</span>
                        <span>${grp.name}</span>
                        ${subBadge}
                    </span>
                    <span style="display:flex;align-items:center;gap:0.75rem;white-space:nowrap;margin-left:1rem">
                        <span style="font-size:0.9rem;font-weight:700;color:#4ade80;background:rgba(34,197,94,0.12);padding:0.2rem 0.6rem;border-radius:6px;border:1px solid rgba(34,197,94,0.25)">${grp.total.toLocaleString('ru')} видов</span>
                        <span style="font-size:0.78rem;color:#c084fc;background:rgba(192,132,252,0.12);padding:0.2rem 0.55rem;border-radius:6px;border:1px solid rgba(192,132,252,0.25);font-weight:600">${grp.files.length} ф.</span>
                    </span>
                </summary>
                <div style="padding:0.6rem 1.25rem 0.85rem;background:rgba(15,23,42,0.5)">
                    <div style="margin-bottom:0.4rem">${fileTags(grp.files, 15)}
                    ${grp.files.length > 15 ? `<span style="font-size:0.75rem;color:#94a3b8;margin-left:6px">+${grp.files.length - 15} ещё</span>` : ''}</div>
                    ${subgroupsHtml}
                </div>
            </details>`;
        }).join('');

        const otherRow = otherFiles.length ? `
            <details style="border-bottom:1px solid rgba(255,255,255,0.05)">
                <summary style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1.25rem;list-style:none">
                    <span style="font-size:0.92rem;font-weight:600;color:#fbbf24">📦 Не привязаны к WBS</span>
                    <span style="font-size:0.9rem;font-weight:700;color:#f59e0b">${otherTotal.toLocaleString('ru')} <span style="color:#94a3b8;font-weight:400;font-size:0.78rem">${otherFiles.length} ф.</span></span>
                </summary>
                <div style="padding:0.6rem 1.25rem 0.85rem;background:rgba(15,23,42,0.5)">${fileTags(otherFiles, 15)}</div>
            </details>` : '';

        return `
        <div style="padding:0.85rem 1.75rem 1.25rem">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.85rem;padding-bottom:0.6rem;border-bottom:1px solid rgba(255,255,255,0.08)">
                <span style="font-size:0.95rem;font-weight:700;color:#f8fafc">📂 Работы по группам WBS</span>
                <span style="font-size:0.82rem;color:#94a3b8">
                    <b style="color:#f8fafc">${groupData.filter(g => g.files.length).length}/21</b> групп &nbsp;·&nbsp;
                    <span style="color:${coveragePct === 100 ? '#4ade80' : '#fbbf24'};font-weight:600">${coveragePct}% файлов привязано</span>
                    ${otherFiles.length ? `&nbsp;·&nbsp;<span style="color:#f87171;font-weight:600">${otherFiles.length} не привязано</span>` : ''}
                </span>
            </div>
            <div style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.08);border-radius:12px;overflow:hidden">
                ${wbsRows}
                ${otherRow}
            </div>
        </div>`;
    }

    function _renderDatabaseTab() {
        const wrk = _countGlobalItems('AI_WRK_');
        const work_ = _countGlobalItems('AI_WORK_');
        const mat = _countGlobalItems('AI_MAT_');
        const eq = _countGlobalItems('AI_EQ_');
        const totalWrk = wrk.totalItems + work_.totalItems;
        const totalMat = mat.totalItems;
        const totalEq = eq.totalItems;
        const typeBtn = (k, icon, label, n) =>
            `<button onclick="AdminUI.setDbType('${k}')" style="padding:0.5rem 1.1rem;border-radius:8px;
            border:none;
            background:${_dbType === k ? 'linear-gradient(135deg,#8b5cf6,#6366f1)' : 'rgba(255,255,255,0.06)'};
            color:${_dbType === k ? '#fff' : 'rgba(255,255,255,0.6)'};
            font-size:0.88rem;cursor:pointer;font-weight:${_dbType === k ? '700' : '500'};box-shadow:${_dbType === k ? '0 2px 10px rgba(139,92,246,0.35)' : 'none'};transition:all 0.2s">
            ${icon} ${label} <span style="font-size:0.78rem;color:${_dbType === k ? '#e0e7ff' : 'rgba(255,255,255,0.35)'};margin-left:4px">${n.toLocaleString('ru')}</span></button>`;
        const viewBtn = (v, label) =>
            `<button onclick="AdminUI.setDbView('${v}')" style="padding:0.4rem 0.95rem;border-radius:8px;border:none;
            background:${_dbView === v ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)'};
            color:${_dbView === v ? '#fff' : 'rgba(255,255,255,0.6)'};font-size:0.84rem;font-weight:${_dbView === v ? '600' : '400'};cursor:pointer">${label}</button>`;
        const content = (_dbType === 'works' && _dbView === 'grouped')
            ? _renderWbsGrouped(wrk, work_)
            : _renderFullItemsList(_dbType);
        return `<div class="admin-panel" style="max-width:1400px;margin:0 auto;background:rgba(15,23,42,0.85);border-radius:20px;border:1px solid rgba(255,255,255,0.1);backdrop-filter:blur(20px);box-shadow:0 12px 40px rgba(0,0,0,0.4);overflow:hidden;">
            <div class="admin-panel-header" style="padding:1.25rem 1.75rem;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(30,41,59,0.35);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;">
                <div>
                    <div class="admin-panel-title" style="font-size:1.3rem;font-weight:700;color:#f8fafc;display:flex;align-items:center;gap:0.5rem;">
                        🗄️ База данных
                    </div>
                    <div style="font-size:0.8rem;color:#94a3b8;margin-top:0.25rem;">Справочник ГЭСН, WBS категорий, материалов и оборудования</div>
                </div>
                <div style="position:relative;">
                    <input type="text" placeholder="🔍 Поиск..." value="${_dbSearch}"
                        oninput="AdminUI.setDbSearch(this.value)"
                        style="padding:0.55rem 1rem;background:rgba(15,23,42,0.85);border:1px solid rgba(139,92,246,0.35);
                        border-radius:10px;color:#fff;font-size:0.88rem;width:260px;outline:none;transition:all 0.2s"
                        onfocus="this.style.borderColor='#8b5cf6';this.style.boxShadow='0 0 12px rgba(139,92,246,0.35)'"
                        onblur="this.style.borderColor='rgba(139,92,246,0.35)';this.style.boxShadow='none'">
                </div>
            </div>
            <div style="padding:0.85rem 1.75rem;border-bottom:1px solid rgba(255,255,255,0.06);background:rgba(30,41,59,0.25);
                display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;justify-content:space-between">
                <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap">
                    ${typeBtn('works', '🔧', 'Работы', totalWrk)}
                    ${typeBtn('materials', '🧱', 'Материалы', totalMat)}
                    ${typeBtn('equipment', '🚜', 'Техника', totalEq)}
                    ${_dbType === 'works' ? `<div style="display:flex;gap:0.35rem;margin-left:0.5rem;background:rgba(15,23,42,0.6);padding:0.25rem;border-radius:10px;border:1px solid rgba(255,255,255,0.08);">${viewBtn('grouped', '📂 По WBS')}${viewBtn('list', '📋 Полный список')}</div>` : ''}
                </div>
            </div>
            <div style="overflow-y:auto;max-height:calc(100vh - 240px)">${content}</div>
        </div>`;
    }

    // =============================================
    // 14. USERS TAB
    // =============================================

    function _getAllUsers() {
        const users = [];
        const seen = new Set();

        // 1) Demo users from demoData.js (preloaded)
        if (window.DemoData && window.DemoData.USERS) {
            const demoList = window.DemoData.USERS;
            (Array.isArray(demoList) ? demoList : Object.values(demoList)).forEach(u => {
                const key = (u.email || u.phone || u.id || '').toLowerCase();
                if (key && !seen.has(key)) {
                    seen.add(key);
                    users.push({
                        id: u.id || key,
                        name: u.name || 'Без имени',
                        email: u.email || '',
                        phone: u.phone || '',
                        role: u.role || 'customer',
                        createdAt: u.createdAt || '',
                        source: 'demo',
                        blocked: u.blocked || false
                    });
                }
            });
        }

        // 2) Registered users from localStorage (via AuthEngine)
        if (window.AuthEngine && window.AuthEngine.getDemoUsers) {
            const lsUsers = window.AuthEngine.getDemoUsers();
            if (lsUsers && typeof lsUsers === 'object') {
                Object.entries(lsUsers).forEach(([emailKey, u]) => {
                    const key = emailKey.toLowerCase();
                    if (!seen.has(key)) {
                        seen.add(key);
                        users.push({
                            id: u.id || key,
                            name: u.name || 'Без имени',
                            email: u.email || emailKey,
                            phone: u.phone || '',
                            role: u.role || 'customer',
                            createdAt: u.createdAt || '',
                            source: 'registered',
                            blocked: u.blocked || false
                        });
                    } else {
                        // Merge: update existing entry with localStorage data (may have newer role/blocked state)
                        const existing = users.find(x => (x.email || '').toLowerCase() === key);
                        if (existing && u.role) existing.role = u.role;
                        if (existing && u.blocked !== undefined) existing.blocked = u.blocked;
                    }
                });
            }
        }

        return users;
    }

    function _getRoleBadge(role) {
        const map = {
            admin:      { icon: '👑', label: 'Администратор', color: '168,85,247',  bg: 'rgba(168,85,247,0.15)' },
            manager:    { icon: '👔', label: 'Менеджер',      color: '236,72,153',  bg: 'rgba(236,72,153,0.15)' },
            customer:   { icon: '📋', label: 'Заказчик',      color: '59,130,246',  bg: 'rgba(59,130,246,0.15)' },
            executor:   { icon: '🔧', label: 'Исполнитель',   color: '34,197,94',   bg: 'rgba(34,197,94,0.15)' },
            engineer:   { icon: '⚙️', label: 'Инженер',       color: '245,158,11',  bg: 'rgba(245,158,11,0.15)' },
            controller: { icon: '🔎', label: 'Контролёр',     color: '14,165,233',  bg: 'rgba(14,165,233,0.15)' }
        };
        const r = map[role] || map.customer;
        return `<span style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.15rem 0.55rem;border-radius:6px;font-size:0.72rem;font-weight:600;background:${r.bg};color:rgb(${r.color})">${r.icon} ${r.label}</span>`;
    }

    function _renderUsersTab() {
        const allUsers = _getAllUsers();

        // Filter
        let filtered = allUsers;
        if (_usersFilter !== 'all') {
            filtered = filtered.filter(u => u.role === _usersFilter);
        }
        if (_usersSearch) {
            const q = _usersSearch.toLowerCase().trim();
            filtered = filtered.filter(u =>
                (u.name || '').toLowerCase().includes(q) ||
                (u.email || '').toLowerCase().includes(q) ||
                (u.phone || '').includes(q)
            );
        }

        // Stats
        const totalUsers = allUsers.length;
        const roleCounts = { customer: 0, executor: 0, engineer: 0, controller: 0, manager: 0, admin: 0 };
        allUsers.forEach(u => { if (roleCounts[u.role] !== undefined) roleCounts[u.role]++; });

        // Pagination
        const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PAGE_SIZE));
        const page = Math.min(_usersPage, totalPages);
        const slice = filtered.slice((page - 1) * USERS_PAGE_SIZE, page * USERS_PAGE_SIZE);

        // Filter buttons
        const filterBtn = (value, label, count) => {
            const active = _usersFilter === value;
            return `<button onclick="AdminUI.setUsersFilter('${value}')" style="padding:0.3rem 0.7rem;border-radius:6px;border:1px solid rgba(255,255,255,${active ? '0.3' : '0.1'});background:${active ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)'};color:${active ? '#fff' : 'rgba(255,255,255,0.55)'};cursor:pointer;font-size:0.78rem;font-weight:${active ? '600' : '400'}">${label} <span style=\"font-size:0.7rem;opacity:0.6\">(${count})</span></button>`;
        };

        // Rows
        const rows = slice.map(u => {
            const blockedStyle = u.blocked ? 'opacity:0.5;' : '';
            const blockedBadge = u.blocked ? '<span style="margin-left:0.4rem;font-size:0.65rem;padding:0.1rem 0.35rem;background:rgba(239,68,68,0.15);color:#ef4444;border-radius:4px">🚫 Заблокирован</span>' : '';
            const sourceBadge = u.source === 'registered'
                ? '<span style="font-size:0.6rem;padding:0.08rem 0.3rem;background:rgba(34,197,94,0.12);color:#22c55e;border-radius:3px">Новый</span>'
                : '<span style="font-size:0.6rem;padding:0.08rem 0.3rem;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.35);border-radius:3px">Демо</span>';

            return `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);${blockedStyle}"
                onmouseover="this.style.background='rgba(255,255,255,0.025)'" onmouseout="this.style.background=''">
                <td data-label="Пользователь" style="padding:0.5rem 0.75rem">
                    <div style="display:flex;align-items:center;gap:0.6rem">
                        <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,rgba(139,92,246,0.3),rgba(59,130,246,0.3));display:flex;align-items:center;justify-content:center;font-size:0.9rem;font-weight:700;color:#fff;flex-shrink:0">${(u.name || '?')[0].toUpperCase()}</div>
                        <div>
                            <div style="font-weight:600;font-size:0.85rem">${u.name}${blockedBadge}</div>
                            <div style="font-size:0.75rem;color:rgba(255,255,255,0.4)">${u.email || u.phone || '—'}</div>
                        </div>
                    </div>
                </td>
                <td data-label="Роль" style="padding:0.5rem 0.75rem">${_getRoleBadge(u.role)}</td>
                <td data-label="Статус" style="padding:0.5rem 0.75rem">${sourceBadge}</td>
                <td data-label="Регистрация" style="padding:0.5rem 0.75rem;font-size:0.78rem;color:rgba(255,255,255,0.45)">${u.createdAt ? _formatDate(u.createdAt) : '—'}</td>
                <td data-label="Действия" style="padding:0.5rem 0.75rem">
                    <div style="display:flex;gap:0.3rem">
                        <button onclick="AdminUI.viewUser('${u.email || u.id}')" style="padding:0.2rem 0.5rem;border-radius:5px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.7);cursor:pointer;font-size:0.72rem" title="Подробнее">👁️</button>
                        <button onclick="AdminUI.changeUserRole('${u.email || u.id}')" style="padding:0.2rem 0.5rem;border-radius:5px;border:1px solid rgba(139,92,246,0.3);background:rgba(139,92,246,0.1);color:#a78bfa;cursor:pointer;font-size:0.72rem" title="Сменить роль">🔄</button>
                        <button onclick="AdminUI.toggleBlockUser('${u.email || u.id}')" style="padding:0.2rem 0.5rem;border-radius:5px;border:1px solid rgba(${u.blocked ? '34,197,94' : '239,68,68'},0.3);background:rgba(${u.blocked ? '34,197,94' : '239,68,68'},0.1);color:${u.blocked ? '#22c55e' : '#ef4444'};cursor:pointer;font-size:0.72rem" title="${u.blocked ? 'Разблокировать' : 'Заблокировать'}">${u.blocked ? '✅' : '🚫'}</button>
                    </div>
                </td>
            </tr>`;
        }).join('');

        // Pagination buttons
        const mkPgBtn = (p, label, active = false) =>
            `<button onclick="AdminUI.setUsersPage(${p})" style="padding:0.2rem 0.5rem;border-radius:5px;border:1px solid rgba(255,255,255,${active ? '0.3' : '0.1'});background:${active ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.04)'};color:${active ? '#fff' : 'rgba(255,255,255,0.5)'};cursor:pointer;font-size:0.77rem;min-width:28px">${label}</button>`;
        const paginBtns = [];
        if (totalPages > 1) {
            if (page > 1) paginBtns.push(mkPgBtn(page - 1, '◀'));
            for (let p = 1; p <= totalPages; p++) paginBtns.push(mkPgBtn(p, p, p === page));
            if (page < totalPages) paginBtns.push(mkPgBtn(page + 1, '▶'));
        }

        return `
        <div class="admin-panel">
            <div class="admin-panel-header">
                <div class="admin-panel-title">👥 Пользователи системы</div>
                <div style="font-size:0.82rem;color:rgba(255,255,255,0.45)">Всего: <b style="color:#fff">${totalUsers}</b></div>
            </div>

            <!-- Role summary cards -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0.6rem;padding:0.75rem 1rem;border-bottom:1px solid rgba(255,255,255,0.06)">
                <div onclick="AdminUI.setUsersFilter('customer')" style="cursor:pointer;padding:0.6rem;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800;color:#3b82f6">${roleCounts.customer}</div>
                    <div style="font-size:0.72rem;color:rgba(255,255,255,0.5)">📋 Заказчики</div>
                </div>
                <div onclick="AdminUI.setUsersFilter('executor')" style="cursor:pointer;padding:0.6rem;background:rgba(34,197,94,0.08);border:1px solid rgba(34,197,94,0.2);border-radius:8px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800;color:#22c55e">${roleCounts.executor}</div>
                    <div style="font-size:0.72rem;color:rgba(255,255,255,0.5)">🔧 Исполнители</div>
                </div>
                <div onclick="AdminUI.setUsersFilter('engineer')" style="cursor:pointer;padding:0.6rem;background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:8px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800;color:#f59e0b">${roleCounts.engineer}</div>
                    <div style="font-size:0.72rem;color:rgba(255,255,255,0.5)">⚙️ Инженеры</div>
                </div>
                <div onclick="AdminUI.setUsersFilter('admin')" style="cursor:pointer;padding:0.6rem;background:rgba(168,85,247,0.08);border:1px solid rgba(168,85,247,0.2);border-radius:8px;text-align:center">
                    <div style="font-size:1.3rem;font-weight:800;color:#a855f7">${roleCounts.admin}</div>
                    <div style="font-size:0.72rem;color:rgba(255,255,255,0.5)">👑 Админы</div>
                </div>
            </div>

            <!-- Filters & Search -->
            <div style="padding:0.6rem 1rem;border-bottom:1px solid rgba(255,255,255,0.06);display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap">
                ${filterBtn('all', 'Все', totalUsers)}
                ${filterBtn('customer', '📋 Заказчики', roleCounts.customer)}
                ${filterBtn('executor', '🔧 Исполнители', roleCounts.executor)}
                ${filterBtn('engineer', '⚙️ Инженеры', roleCounts.engineer)}
                ${filterBtn('admin', '👑 Админы', roleCounts.admin)}
                <input type="text" placeholder="🔍 Поиск по имени, email, телефону..." value="${_usersSearch}"
                    oninput="AdminUI.searchUsers(this.value)"
                    style="margin-left:auto;padding:0.35rem 0.65rem;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:7px;color:#fff;font-size:0.81rem;width:240px;outline:none">
            </div>

            <!-- Table -->
            <div style="overflow-x:auto;overflow-y:auto;max-height:calc(100vh - 380px)">
                <table style="width:100%;border-collapse:collapse">
                    <thead>
                        <tr style="background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.08)">
                            <th style="padding:0.4rem 0.75rem;text-align:left;font-weight:500;font-size:0.72rem;color:rgba(255,255,255,0.4)">Пользователь</th>
                            <th style="padding:0.4rem 0.75rem;text-align:left;font-weight:500;font-size:0.72rem;color:rgba(255,255,255,0.4)">Роль</th>
                            <th style="padding:0.4rem 0.75rem;text-align:left;font-weight:500;font-size:0.72rem;color:rgba(255,255,255,0.4)">Источник</th>
                            <th style="padding:0.4rem 0.75rem;text-align:left;font-weight:500;font-size:0.72rem;color:rgba(255,255,255,0.4)">Дата регистрации</th>
                            <th style="padding:0.4rem 0.75rem;text-align:left;font-weight:500;font-size:0.72rem;color:rgba(255,255,255,0.4)">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows || '<tr><td colspan="5" style="text-align:center;padding:2.5rem;color:rgba(255,255,255,0.25);font-size:0.9rem">Пользователи не найдены</td></tr>'}
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            ${paginBtns.length ? `<div style="display:flex;justify-content:center;gap:0.3rem;padding:0.6rem;flex-wrap:wrap">${paginBtns.join('')}</div>` : ''}
        </div>`;
    }

    // User management actions
    function setUsersFilter(filter) {
        _usersFilter = filter;
        _usersPage = 1;
        _render();
    }

    function searchUsers(query) {
        _usersSearch = query;
        _usersPage = 1;
        clearTimeout(AdminUI._usersSearchTimeout);
        AdminUI._usersSearchTimeout = setTimeout(() => _render(), 200);
    }

    function setUsersPage(p) {
        _usersPage = Math.max(1, p);
        _render();
    }

    function viewUser(emailOrId) {
        const allUsers = _getAllUsers();
        const user = allUsers.find(u => (u.email || u.id) === emailOrId);
        if (!user) return;

        const overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.id = 'adminUserViewOverlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        overlay.innerHTML = `
            <div class="admin-modal" style="max-width:480px">
                <div class="admin-modal-header">
                    <div class="admin-modal-title">👤 Профиль пользователя</div>
                    <button class="admin-modal-close" onclick="document.getElementById('adminUserViewOverlay').remove()">✕</button>
                </div>
                <div class="admin-modal-body">
                    <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.2rem">
                        <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,rgba(139,92,246,0.4),rgba(59,130,246,0.4));display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:#fff">${(user.name || '?')[0].toUpperCase()}</div>
                        <div>
                            <div style="font-weight:700;font-size:1.05rem">${user.name}</div>
                            <div style="margin-top:0.2rem">${_getRoleBadge(user.role)}</div>
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem">
                        <div>
                            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:0.2rem">Email</div>
                            <div style="font-size:0.88rem">${user.email || '—'}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:0.2rem">Телефон</div>
                            <div style="font-size:0.88rem">${user.phone || '—'}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:0.2rem">Дата регистрации</div>
                            <div style="font-size:0.88rem">${user.createdAt ? _formatDate(user.createdAt) : '—'}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:0.2rem">Источник</div>
                            <div style="font-size:0.88rem">${user.source === 'registered' ? '🟢 Зарегистрирован' : '🔵 Демо-аккаунт'}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:0.2rem">Статус</div>
                            <div style="font-size:0.88rem">${user.blocked ? '🚫 Заблокирован' : '✅ Активен'}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem;color:rgba(255,255,255,0.4);margin-bottom:0.2rem">ID</div>
                            <div style="font-size:0.75rem;color:rgba(255,255,255,0.35);word-break:break-all">${user.id}</div>
                        </div>
                    </div>
                </div>
                <div class="admin-modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.getElementById('adminUserViewOverlay').remove()">Закрыть</button>
                    <button class="admin-btn admin-btn-primary" onclick="document.getElementById('adminUserViewOverlay').remove(); AdminUI.changeUserRole('${user.email || user.id}')">🔄 Сменить роль</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
    }

    function changeUserRole(emailOrId) {
        const allUsers = _getAllUsers();
        const user = allUsers.find(u => (u.email || u.id) === emailOrId);
        if (!user) return;

        const roles = ['customer', 'executor', 'engineer', 'admin'];
        const roleLabels = { customer: '📋 Заказчик', executor: '🔧 Исполнитель', engineer: '⚙️ Инженер', admin: '👑 Администратор' };

        const overlay = document.createElement('div');
        overlay.className = 'admin-modal-overlay';
        overlay.id = 'adminRoleOverlay';
        overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

        const options = roles.map(r =>
            `<option value="${r}" ${user.role === r ? 'selected' : ''}>${roleLabels[r]}</option>`
        ).join('');

        overlay.innerHTML = `
            <div class="admin-modal" style="max-width:400px">
                <div class="admin-modal-header">
                    <div class="admin-modal-title">🔄 Сменить роль</div>
                    <button class="admin-modal-close" onclick="document.getElementById('adminRoleOverlay').remove()">✕</button>
                </div>
                <div class="admin-modal-body">
                    <div style="margin-bottom:0.75rem;font-size:0.9rem">Пользователь: <b>${user.name}</b></div>
                    <div style="margin-bottom:0.5rem;font-size:0.82rem;color:rgba(255,255,255,0.5)">Текущая роль: ${_getRoleBadge(user.role)}</div>
                    <div class="admin-form-group" style="margin-top:1rem">
                        <label class="admin-form-label">Новая роль</label>
                        <select id="adminNewRoleSelect" class="admin-form-input" style="width:100%;padding:0.6rem;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;font-size:0.9rem">
                            ${options}
                        </select>
                    </div>
                </div>
                <div class="admin-modal-footer">
                    <button class="admin-btn admin-btn-secondary" onclick="document.getElementById('adminRoleOverlay').remove()">Отмена</button>
                    <button class="admin-btn admin-btn-primary" onclick="AdminUI._confirmRoleChange('${emailOrId}')">💾 Сохранить</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
    }

    function _confirmRoleChange(emailOrId) {
        const newRole = document.getElementById('adminNewRoleSelect')?.value;
        if (!newRole) return;

        // Update in demoUsers localStorage
        if (window.AuthEngine && window.AuthEngine.getDemoUsers) {
            const users = window.AuthEngine.getDemoUsers();
            const key = emailOrId.toLowerCase();
            if (users[key]) {
                users[key].role = newRole;
                window.AuthEngine.saveDemoUsers(users);
            } else {
                // Find by iterating
                for (const [k, v] of Object.entries(users)) {
                    if (v.email === emailOrId || v.id === emailOrId) {
                        v.role = newRole;
                        window.AuthEngine.saveDemoUsers(users);
                        break;
                    }
                }
            }
        }

        // Update in DemoData if exists
        if (window.DemoData && window.DemoData.users) {
            const list = Array.isArray(window.DemoData.users) ? window.DemoData.users : Object.values(window.DemoData.users);
            const u = list.find(x => x.email === emailOrId || x.id === emailOrId);
            if (u) u.role = newRole;
        }

        _addAuditEntry('update', `Роль пользователя «${emailOrId}» изменена на «${newRole}»`);

        const overlay = document.getElementById('adminRoleOverlay');
        if (overlay) overlay.remove();

        _render();
        window.showToast && window.showToast(`✅ Роль пользователя обновлена: ${newRole}`);
    }

    function toggleBlockUser(emailOrId) {
        const allUsers = _getAllUsers();
        const user = allUsers.find(u => (u.email || u.id) === emailOrId);
        if (!user) return;

        const newBlocked = !user.blocked;
        const action = newBlocked ? 'заблокирован' : 'разблокирован';

        // Update in demoUsers localStorage
        if (window.AuthEngine && window.AuthEngine.getDemoUsers) {
            const users = window.AuthEngine.getDemoUsers();
            const key = emailOrId.toLowerCase();
            if (users[key]) {
                users[key].blocked = newBlocked;
                window.AuthEngine.saveDemoUsers(users);
            } else {
                for (const [k, v] of Object.entries(users)) {
                    if (v.email === emailOrId || v.id === emailOrId) {
                        v.blocked = newBlocked;
                        window.AuthEngine.saveDemoUsers(users);
                        break;
                    }
                }
            }
        }

        // Update in DemoData
        if (window.DemoData && window.DemoData.users) {
            const list = Array.isArray(window.DemoData.users) ? window.DemoData.users : Object.values(window.DemoData.users);
            const u = list.find(x => x.email === emailOrId || x.id === emailOrId);
            if (u) u.blocked = newBlocked;
        }

        _addAuditEntry(newBlocked ? 'reject' : 'approve', `Пользователь «${user.name}» ${action}`);
        _render();
        window.showToast && window.showToast(`${newBlocked ? '🚫' : '✅'} Пользователь ${action}`);
    }

    // =============================================
    // 14b. EXCEL EXPORT/IMPORT FOR PRICES TAB
    // =============================================

    /**
     * Export prices to Excel from the admin Prices tab.
     * @param {string} mode - 'current' (only filtered items) or 'all' (all 3 sheets via CatalogExcelIO)
     */
    function exportPricesToExcel(mode) {
        if (typeof XLSX === 'undefined') {
            alert('⚠️ Библиотека XLSX не загружена. Перезагрузите страницу.');
            return;
        }

        // If 'all' mode — delegate to CatalogExcelIO which exports all 3 sheets
        if (mode === 'all') {
            if (window.CatalogExcelIO && window.CatalogExcelIO.exportAll) {
                window.CatalogExcelIO.exportAll();
                _addAuditEntry('export', 'Полный экспорт каталога в Excel (все листы)');
                return;
            }
        }

        // 'current' mode — export currently visible filtered items
        const getItems = (prefix, typeLabel) => {
            const result = [];
            for (const key of Object.keys(window)) {
                if (!key.startsWith(prefix)) continue;
                const catalog = window[key];
                if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) continue;
                const src = key.replace(prefix, '').toLowerCase();
                for (const [code, item] of Object.entries(catalog)) {
                    if (!item || !item.name) continue;
                    result.push({
                        code, name: item.name, unit: item.unit || '—',
                        price: item.price || 0, labor: item.labor || null,
                        source: src, _type: typeLabel,
                        category: item.category || src
                    });
                }
            }
            return result;
        };

        let allItems = [];
        if (_priceType === 'works' || _priceType === 'all') {
            allItems = allItems.concat(getItems('AI_WRK_', 'Работа'));
            allItems = allItems.concat(getItems('AI_WORK_', 'Работа'));
        }
        if (_priceType === 'materials' || _priceType === 'all') {
            allItems = allItems.concat(getItems('AI_MAT_', 'Материал'));
        }

        // Apply search filter (same as table)
        const q = (_searchQuery || '').toLowerCase().trim();
        const filtered = q ? allItems.filter(i =>
            i.name.toLowerCase().includes(q) ||
            i.code.toLowerCase().includes(q) ||
            i.source.includes(q)
        ) : allItems;

        if (filtered.length === 0) {
            alert('⚠️ Нет данных для экспорта. Проверьте фильтры.');
            return;
        }

        // Build Excel sheet
        const HEADERS = ['№', 'Код', 'Наименование', 'Тип', 'Категория', 'Ед. изм.', 'Норма (ч-ч)', 'Цена (₸)'];
        const dataRows = filtered.map((it, idx) => [
            idx + 1,
            it.code,
            it.name,
            it._type,
            it.category,
            it.unit,
            it.labor ? (it.labor.norm < 1 ? +(it.labor.norm * 60).toFixed(1) + ' мин' : it.labor.norm + ' ч-ч') : '',
            it.price || 0
        ]);

        const wsData = [HEADERS, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Column widths
        ws['!cols'] = [
            { wch: 6 },   // №
            { wch: 28 },  // Код
            { wch: 55 },  // Наименование
            { wch: 12 },  // Тип
            { wch: 20 },  // Категория
            { wch: 10 },  // Ед. изм.
            { wch: 14 },  // Норма
            { wch: 14 },  // Цена
        ];

        const wb = XLSX.utils.book_new();
        const sheetLabel = _priceType === 'works' ? 'Работы' : _priceType === 'materials' ? 'Материалы' : 'Все_позиции';
        XLSX.utils.book_append_sheet(wb, ws, sheetLabel);

        // Add summary sheet
        const summaryRows = [
            ['Отчёт по ценам QazGost AI'],
            [''],
            ['Дата выгрузки', new Date().toLocaleString('ru-RU')],
            ['Фильтр', _priceType === 'all' ? 'Все' : _priceType === 'works' ? 'Работы' : 'Материалы'],
            ['Поиск', q || '(без поиска)'],
            ['Позиций в выгрузке', filtered.length],
            ['Всего позиций (без фильтра)', allItems.length],
            [''],
            ['Средняя цена (₸)', Math.round(filtered.reduce((s, i) => s + (i.price || 0), 0) / filtered.length)],
            ['Макс. цена (₸)', Math.max(...filtered.map(i => i.price || 0))],
            ['Мин. цена (₸)', Math.min(...filtered.filter(i => i.price > 0).map(i => i.price))],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
        wsSummary['!cols'] = [{ wch: 28 }, { wch: 30 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводка');

        const date = new Date().toISOString().slice(0, 10);
        const filterSuffix = _priceType !== 'all' ? `_${sheetLabel}` : '';
        const searchSuffix = q ? `_поиск` : '';
        const filename = `QazGost_Цены${filterSuffix}${searchSuffix}_${date}.xlsx`;

        XLSX.writeFile(wb, filename);

        // Toast & audit
        if (window.showToast) window.showToast(`✅ Экспорт завершён: ${filtered.length} позиций → ${filename}`, 'success');
        _addAuditEntry('export', `Экспорт ${filtered.length} позиций в Excel: ${filename}`);
        console.log(`[AdminUI] Excel export: ${filtered.length} items → ${filename}`);
    }

    /**
     * Import prices from Excel file
     */
    function importPricesFromExcel(input) {
        if (window.CatalogExcelIO && window.CatalogExcelIO.handleFileInput) {
            window.CatalogExcelIO.handleFileInput(input);
            _addAuditEntry('import', 'Импорт цен из Excel-файла');
            // Re-render prices tab after import
            setTimeout(() => _render(), 1500);
        } else {
            alert('⚠️ Модуль CatalogExcelIO не загружен.');
        }
    }

    /**
     * Reset all price overrides
     */
    function resetPriceOverrides() {
        if (window.CatalogExcelIO && window.CatalogExcelIO.resetOverrides) {
            window.CatalogExcelIO.resetOverrides();
            _addAuditEntry('reset', 'Сброс пользовательских цен');
            setTimeout(() => _render(), 500);
        }
    }

    // =============================================
    // 15. EXPORT
    // =============================================

    function toggleMobileMenu() {
        const tabs = document.getElementById('adminNavTabs');
        const overlay = document.getElementById('adminMobileOverlay');
        if (!tabs || !overlay) return;
        tabs.classList.toggle('mobile-active');
        overlay.classList.toggle('mobile-active');
    }

    function closeMobileMenu() {
        const tabs = document.getElementById('adminNavTabs');
        const overlay = document.getElementById('adminMobileOverlay');
        if (tabs) tabs.classList.remove('mobile-active');
        if (overlay) overlay.classList.remove('mobile-active');
    }

    const AdminUI = {
        open,
        setTab,
        setPriceType,
        setCategory,
        search,
        sort,
        goPage,
        editItem,
        addNewItem,
        saveItem,
        deleteItem,
        closeEditModal,
        approveMod,
        rejectMod,
        viewMod,
        approveAll,
        editRegion,
        addRegion,
        exportAudit,
        setWbsPrice,
        _setWbsCat: (cat) => _setWbsCat(cat),
        _searchWbs: (q) => _searchWbs(q),
        setDbType,
        setDbView,
        setDbSearch,
        setDbPage,
        setSettingsSection,
        // Users tab
        setUsersFilter,
        searchUsers,
        setUsersPage,
        viewUser,
        changeUserRole,
        toggleBlockUser,
        _confirmRoleChange: (emailOrId) => _confirmRoleChange(emailOrId),
        // Excel export/import
        exportPricesToExcel,
        importPricesFromExcel,
        resetPriceOverrides,
        toggleMobileMenu,
        closeMobileMenu,
        _searchTimeout: null,
        _wbsSearchTimeout: null,
        _usersSearchTimeout: null
    };

    window.AdminUI = AdminUI;

    console.log('[AdminUI] ✅ Admin Panel v1.1 loaded (with Users management)');

})();
