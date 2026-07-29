// ========== CUSTOMER CABINET UI ==========
// Кабинет заказчика — QazGost AI
// Tabs: Профиль | Объекты | Техника(VIP) | Бригады(VIP) | Лента

(function () {
    'use strict';

    const M = () => window.CabinetModels;
    let currentTab = 'projects';
    let feedFilter = 'all';
    let userId = '';

    // === Helpers ===
    function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function ago(iso) {
        const d = new Date(iso), now = Date.now(), s = Math.floor((now - d) / 1000);
        if (s < 60) return 'только что';
        if (s < 3600) return Math.floor(s / 60) + ' мин назад';
        if (s < 86400) return Math.floor(s / 3600) + ' ч назад';
        if (s < 604800) return Math.floor(s / 86400) + ' дн назад';
        return d.toLocaleDateString('ru-RU');
    }
    function toast(msg) { if (window.showToast) window.showToast(msg); }
    function getUserId() {
        if (userId) return userId;
        try {
            const s = localStorage.getItem('authSession');
            if (s) { const p = JSON.parse(s); userId = p.userId || 'guest'; return userId; }
        } catch { }
        userId = localStorage.getItem('currentUserId') || 'guest';
        return userId;
    }

    const STATUS_LABEL = { active: '🟢 В работе', paused: '⏸ Пауза', completed: '✅ Завершён' };
    const OBJ_ICONS = { house: '🏠', apartment: '🏢', office: '🏬', warehouse: '🏭', foundation: '🧱', roof: '🏚️', renovation: '🔨', landscape: '🌳', fence: '🚧', pool: '🏊', road: '🛤️', other: '📐' };
    const EQ_ICONS = { transport: '🚛', tool: '🔧', heavy: '🏗️', equipment: '⚙️' };
    const EQ_STATUS = { free: '🟢 Свободна', on_site: '📍 На объекте', repair: '🔴 В ремонте' };
    const PARTNER_ICONS = { crew: '👷', master: '🧑‍🔧', company: '🏢' };
    const FEED_LABELS = { estimate: 'Оценка', document: 'Документ', status_change: 'Статус', action_required: 'Действие', photo: 'Фото', system: 'Система', info: 'Инфо' };

    // ============================================================
    //  MAIN RENDER
    // ============================================================
    function render() {
        const c = document.getElementById('customerCabinetContent');
        if (!c) return;
        const uid = getUserId();
        const isVip = M().VipLimits.isVip(uid);
        const actionCount = M().FeedEvent.countActionRequired(uid);

        c.innerHTML = `
            <div style="max-width:960px;margin:0 auto;padding:1rem 1.5rem 6rem;">
                <!-- Tabs -->
                <div class="cab-tabs">
                    <button class="cab-tab ${currentTab === 'projects' ? 'active' : ''}" onclick="CabinetUI.switchTab('projects')">🏠 Объекты</button>
                    <button class="cab-tab ${currentTab === 'feed' ? 'active' : ''}" onclick="CabinetUI.switchTab('feed')">
                        📰 Лента${actionCount ? `<span class="tab-badge">${actionCount}</span>` : ''}
                    </button>
                    <button class="cab-tab ${currentTab === 'equipment' ? 'active' : ''}" onclick="CabinetUI.switchTab('equipment')">🔧 Техника${!isVip ? '<span class="vip-lock">🔒</span>' : ''}</button>
                    <button class="cab-tab ${currentTab === 'partners' ? 'active' : ''}" onclick="CabinetUI.switchTab('partners')">👷 Бригады${!isVip ? '<span class="vip-lock">🔒</span>' : ''}</button>
                    <button class="cab-tab ${currentTab === 'profile' ? 'active' : ''}" onclick="CabinetUI.switchTab('profile')">👤 Профиль</button>
                </div>

                <!-- Tab Content -->
                <div id="cabTabContent" class="cab-animate-in"></div>

                <!-- Sticky CTA -->
                <div class="cab-sticky-cta">
                    <button class="cab-cta-btn" onclick="CabinetUI.goToEstimate()">📸 Перейти к оценке по фото</button>
                </div>
            </div>

            <!-- Modal container -->
            <div id="cabModalContainer"></div>
        `;

        renderTab();
    }

    function switchTab(tab) {
        currentTab = tab;
        const content = document.getElementById('cabTabContent');
        if (content) { content.classList.remove('cab-animate-in'); void content.offsetWidth; content.classList.add('cab-animate-in'); }
        renderTab();
        // Update tab buttons
        document.querySelectorAll('.cab-tab').forEach(t => {
            t.classList.toggle('active', t.textContent.toLowerCase().includes(
                tab === 'projects' ? 'объект' : tab === 'feed' ? 'лент' : tab === 'equipment' ? 'техник' : tab === 'partners' ? 'бригад' : 'профил'
            ));
        });
        // Re-render tabs for proper active state
        const tabs = document.querySelectorAll('.cab-tab');
        const tabMap = ['projects', 'feed', 'equipment', 'partners', 'profile'];
        tabs.forEach((t, i) => t.classList.toggle('active', tabMap[i] === tab));
    }

    function renderTab() {
        const c = document.getElementById('cabTabContent');
        if (!c) return;
        const uid = getUserId();
        switch (currentTab) {
            case 'projects': c.innerHTML = renderProjects(uid); break;
            case 'feed': c.innerHTML = renderFeed(uid); break;
            case 'equipment': c.innerHTML = renderEquipment(uid); break;
            case 'partners': c.innerHTML = renderPartners(uid); break;
            case 'profile': c.innerHTML = renderProfile(uid); break;
        }
    }

    // ============================================================
    //  TAB: PROJECTS
    // ============================================================
    function renderProjects(uid) {
        const projects = M().Project.findAll(uid);
        const canAdd = M().VipLimits.canAddProject(uid);
        const isVip = M().VipLimits.isVip(uid);

        if (projects.length === 0) {
            return `
                <div class="cab-empty">
                    <div class="cab-empty-icon">🏗️</div>
                    <div class="cab-empty-title">Нет объектов</div>
                    <div class="cab-empty-text">Добавьте свой первый строительный объект для управления проектом</div>
                    <button class="cab-empty-btn" onclick="CabinetUI.openProjectModal()">➕ Добавить объект</button>
                </div>`;
        }

        let html = `<div class="cab-projects-grid">`;
        projects.forEach(p => {
            const icon = OBJ_ICONS[p.objectType] || '📐';
            const statusCls = p.status;
            const eqLinks = M().ProjectEquipment.findByProject(uid, p.id);
            const ptLinks = M().ProjectPartner.findByProject(uid, p.id);
            html += `
                <div class="cab-project-card ${p.isDefault ? 'default-project' : ''}" onclick="CabinetUI.openProjectDetail('${p.id}')">
                    ${p.isDefault ? '<div class="cab-prj-default-badge">⭐ Основной</div>' : ''}
                    <div class="cab-prj-header">
                        <div class="cab-prj-title">${icon} ${esc(p.title)}</div>
                        <span class="cab-prj-status ${statusCls}">${STATUS_LABEL[p.status] || p.status}</span>
                    </div>
                    <div class="cab-prj-meta">
                        <span>📍 ${esc(p.city || 'Не указан')}</span>
                        ${p.area ? `<span>📐 ${p.area} м²</span>` : ''}
                        ${eqLinks.length ? `<span>🔧 ${eqLinks.length}</span>` : ''}
                        ${ptLinks.length ? `<span>👷 ${ptLinks.length}</span>` : ''}
                    </div>
                    <div class="cab-prj-progress"><div class="cab-prj-progress-fill" style="width:${p.progress}%"></div></div>
                    <div style="display:flex;justify-content:space-between;margin-top:0.5rem;font-size:0.72rem;color:rgba(255,255,255,0.35)">
                        <span>Прогресс: ${p.progress}%</span>
                        <span>${ago(p.updatedAt)}</span>
                    </div>
                </div>`;
        });
        html += `</div>`;

        if (canAdd) {
            html += `<button class="cab-add-btn" style="margin-top:1rem" onclick="CabinetUI.openProjectModal()">➕ Добавить объект</button>`;
        } else {
            html += renderPaywall('projects');
        }

        return html;
    }

    // ============================================================
    //  TAB: FEED (Лента заказов)
    // ============================================================
    function renderFeed(uid) {
        const allEvents = M().FeedEvent.findAll(uid);
        const actions = M().FeedEvent.findActionRequired(uid);
        const projects = M().Project.findAll(uid);

        let filtered = allEvents;
        if (feedFilter === 'actions') filtered = allEvents.filter(e => e.type === 'action_required' && e.status !== 'dismissed');
        else if (feedFilter === 'estimates') filtered = allEvents.filter(e => e.type === 'estimate');
        else if (feedFilter === 'documents') filtered = allEvents.filter(e => e.type === 'document');
        else if (feedFilter === 'updates') filtered = allEvents.filter(e => e.type === 'status_change');

        let html = '';

        // Action Required Banner
        if (actions.length > 0) {
            html += `
                <div class="cab-action-banner">
                    <div class="cab-action-count">${actions.length}</div>
                    <div class="cab-action-text">
                        Требует действий
                        <span>${actions.map(a => a.title).slice(0, 2).join(', ')}${actions.length > 2 ? '...' : ''}</span>
                    </div>
                </div>`;
        }

        // Filters
        html += `
            <div class="cab-feed-filters">
                <button class="cab-feed-filter ${feedFilter === 'all' ? 'active' : ''}" onclick="CabinetUI.setFeedFilter('all')">Все</button>
                <button class="cab-feed-filter ${feedFilter === 'actions' ? 'active' : ''}" onclick="CabinetUI.setFeedFilter('actions')">⚡ Действия${actions.length ? ` (${actions.length})` : ''}</button>
                <button class="cab-feed-filter ${feedFilter === 'estimates' ? 'active' : ''}" onclick="CabinetUI.setFeedFilter('estimates')">📊 Оценки</button>
                <button class="cab-feed-filter ${feedFilter === 'documents' ? 'active' : ''}" onclick="CabinetUI.setFeedFilter('documents')">📄 Документы</button>
                <button class="cab-feed-filter ${feedFilter === 'updates' ? 'active' : ''}" onclick="CabinetUI.setFeedFilter('updates')">🔄 Обновления</button>
            </div>`;

        if (filtered.length === 0) {
            html += `
                <div class="cab-empty">
                    <div class="cab-empty-icon">📰</div>
                    <div class="cab-empty-title">Нет событий</div>
                    <div class="cab-empty-text">Создайте объект и начните оценку — события появятся здесь</div>
                    <button class="cab-empty-btn" onclick="CabinetUI.goToEstimate()">📸 Оценить по фото</button>
                </div>`;
            return html;
        }

        // Timeline
        html += `<div class="cab-feed">`;
        filtered.slice(0, 50).forEach((ev, i) => {
            const project = ev.projectId ? projects.find(p => p.id === ev.projectId) : null;
            const isNew = i < 3 && (Date.now() - new Date(ev.createdAt).getTime()) < 300000; // 5 min
            html += `
                <div class="cab-feed-item ${ev.type === 'action_required' ? 'action-required' : ''} ${isNew ? 'new' : ''}">
                    <div class="cab-feed-dot"></div>
                    <div class="cab-feed-header">
                        <span class="cab-feed-badge ${ev.type}">${ev.icon || '📌'} ${FEED_LABELS[ev.type] || ev.type}</span>
                        ${project ? `<span class="cab-feed-project">• ${esc(project.title)}</span>` : ''}
                    </div>
                    <div class="cab-feed-title">${esc(ev.title)}</div>
                    ${ev.text ? `<div class="cab-feed-text">${esc(ev.text)}</div>` : ''}
                    <div class="cab-feed-time">${ago(ev.createdAt)}</div>
                    ${ev.actionUrl ? `<span class="cab-feed-action" onclick="CabinetUI.feedAction('${ev.actionUrl}')">${ev.actionLabel || 'Открыть'} →</span>` : ''}
                </div>`;
        });
        html += `</div>`;

        return html;
    }

    // ============================================================
    //  TAB: EQUIPMENT (VIP)
    // ============================================================
    function renderEquipment(uid) {
        const isVip = M().VipLimits.isVip(uid);
        const items = M().Equipment.findAll(uid);
        const canAdd = M().VipLimits.canAddEquipment(uid);

        let html = `<div class="cab-card"><div class="cab-card-title"><span class="icon">🔧</span> Моя техника</div>`;

        if (items.length === 0) {
            html += `
                <div class="cab-empty" style="padding:2rem 1rem">
                    <div class="cab-empty-icon">🔧</div>
                    <div class="cab-empty-title">Нет техники</div>
                    <div class="cab-empty-text">Добавьте технику${isVip ? '' : ' (демо: 1 позиция)'} и привяжите к объектам</div>
                    <button class="cab-empty-btn" onclick="CabinetUI.openEquipmentModal()">➕ Добавить технику</button>
                </div>`;
        } else {
            items.forEach(eq => {
                const icon = EQ_ICONS[eq.category] || '🔧';
                const links = M().ProjectEquipment.findByEquipment(uid, eq.id);
                html += `
                    <div class="cab-list-item">
                        <div class="cab-list-info">
                            <div class="cab-list-icon" style="background:rgba(6,182,212,0.1);border-color:rgba(6,182,212,0.15)">${icon}</div>
                            <div class="cab-list-text">
                                <div class="name">${esc(eq.title)} ${eq.qty > 1 ? `<span style="opacity:0.5">×${eq.qty}</span>` : ''}</div>
                                <div class="meta">${EQ_STATUS[eq.status] || eq.status} ${links.length ? `• 📍 ${links.length} объект(ов)` : ''}</div>
                            </div>
                        </div>
                        <div class="cab-list-actions">
                            <button onclick="event.stopPropagation();CabinetUI.openLinkModal('equipment','${eq.id}')">🔗</button>
                            <button class="danger" onclick="event.stopPropagation();CabinetUI.deleteEquipment('${eq.id}')">✕</button>
                        </div>
                    </div>`;
            });

            if (canAdd) {
                html += `<button class="cab-add-btn" style="margin-top:0.75rem" onclick="CabinetUI.openEquipmentModal()">➕ Добавить технику</button>`;
            }
        }

        html += `</div>`;

        if (!isVip && items.length >= M().VipLimits.FREE_EQUIPMENT) {
            html += renderPaywall('equipment');
        }

        return html;
    }

    // ============================================================
    //  TAB: PARTNERS (VIP)
    // ============================================================
    function renderPartners(uid) {
        const isVip = M().VipLimits.isVip(uid);
        const items = M().Partner.findAll(uid);
        const canAdd = M().VipLimits.canAddPartner(uid);

        let html = `<div class="cab-card"><div class="cab-card-title"><span class="icon">👷</span> Мои бригады</div>`;

        if (items.length === 0) {
            html += `
                <div class="cab-empty" style="padding:2rem 1rem">
                    <div class="cab-empty-icon">👷</div>
                    <div class="cab-empty-title">Нет бригад</div>
                    <div class="cab-empty-text">Добавьте проверенных подрядчиков${isVip ? '' : ' (демо: 1 бригада)'}</div>
                    <button class="cab-empty-btn" onclick="CabinetUI.openPartnerModal()">➕ Добавить бригаду</button>
                </div>`;
        } else {
            items.forEach(pt => {
                const icon = PARTNER_ICONS[pt.kind] || '👷';
                const links = M().ProjectPartner.findByProject(uid, pt.id);
                html += `
                    <div class="cab-list-item">
                        <div class="cab-list-info">
                            <div class="cab-list-icon" style="background:rgba(34,197,94,0.1);border-color:rgba(34,197,94,0.15)">${icon}</div>
                            <div class="cab-list-text">
                                <div class="name">${esc(pt.title)}</div>
                                <div class="meta">📱 ${esc(pt.phone || 'Не указан')}</div>
                                ${pt.tags.length ? `<div class="cab-tags">${pt.tags.map(t => `<span class="cab-tag">${esc(t)}</span>`).join('')}</div>` : ''}
                            </div>
                        </div>
                        <div class="cab-list-actions">
                            <button onclick="event.stopPropagation();CabinetUI.openLinkModal('partner','${pt.id}')">🔗</button>
                            <button class="danger" onclick="event.stopPropagation();CabinetUI.deletePartner('${pt.id}')">✕</button>
                        </div>
                    </div>`;
            });

            if (canAdd) {
                html += `<button class="cab-add-btn" style="margin-top:0.75rem" onclick="CabinetUI.openPartnerModal()">➕ Добавить бригаду</button>`;
            }
        }

        html += `</div>`;

        if (!isVip && items.length >= M().VipLimits.FREE_PARTNERS) {
            html += renderPaywall('partners');
        }

        return html;
    }

    // ============================================================
    //  TAB: PROFILE (делегируем CustomerProfileUI)
    // ============================================================
    function renderProfile(uid) {
        // Render profile using existing CustomerProfileUI
        setTimeout(() => {
            if (window.CustomerProfileUI && window.CustomerProfileUI.render) {
                window.CustomerProfileUI.render();
            }
        }, 50);
        return `<div id="customerProfileContent"><div class="cab-skeleton cab-skeleton-card"></div><div class="cab-skeleton cab-skeleton-card"></div></div>`;
    }

    // ============================================================
    //  PAYWALL
    // ============================================================
    function renderPaywall(type) {
        const features = {
            projects: { icon: '🏗️', title: 'Нужно больше объектов?', feats: ['∞ объектов', '🔧 Техника', '👷 Бригады', '🔗 Привязки'] },
            equipment: { icon: '🔧', title: 'Больше техники с VIP', feats: ['∞ позиций техники', '📍 Привязка к объектам', '📊 Статусы', '📱 Уведомления'] },
            partners: { icon: '👷', title: 'Больше бригад с VIP', feats: ['∞ бригад', '🏷️ Теги / специализации', '📍 Привязка к объектам', '⭐ Рейтинг'] }
        };
        const f = features[type] || features.projects;
        return `
            <div class="cab-paywall" style="margin-top:1.25rem">
                <div class="cab-paywall-icon">${f.icon}</div>
                <div class="cab-paywall-title">${f.title}</div>
                <div class="cab-paywall-desc">VIP открывает полный доступ ко всем возможностям кабинета заказчика</div>
                <div class="cab-paywall-features">${f.feats.map(ft => `<span class="cab-paywall-feat">${ft}</span>`).join('')}</div>
                <button class="cab-paywall-btn" onclick="CabinetUI.openVip()">⭐ Открыть VIP</button>
            </div>`;
    }

    // ============================================================
    //  MODALS
    // ============================================================
    function closeModal() {
        const mc = document.getElementById('cabModalContainer');
        if (mc) mc.innerHTML = '';
    }

    function showModal(title, body, onSave, saveLabel) {
        const mc = document.getElementById('cabModalContainer');
        if (!mc) return;
        mc.innerHTML = `
            <div class="cab-modal-overlay" onclick="CabinetUI._closeModal()">
                <div class="cab-modal" onclick="event.stopPropagation()">
                    <div class="cab-modal-title">${title}</div>
                    ${body}
                    <div class="cab-modal-actions">
                        <button class="cab-modal-btn cancel" onclick="CabinetUI._closeModal()">Отмена</button>
                        <button class="cab-modal-btn primary" id="cabModalSaveBtn">${saveLabel || '💾 Сохранить'}</button>
                    </div>
                </div>
            </div>`;
        document.getElementById('cabModalSaveBtn').onclick = onSave;
    }

    // --- Project Modal ---
    function openProjectModal() {
        const uid = getUserId();
        if (!M().VipLimits.canAddProject(uid)) { toast('⭐ Достигнут лимит объектов. Откройте VIP!'); return; }

        const body = `
            <div class="cust-form-grid" style="gap:1rem">
                <div class="cust-field"><label>Название объекта <span class="req">*</span></label>
                    <input class="cust-input" id="cabPrjTitle" placeholder="Дом на ул. Строителей"></div>
                <div class="cust-form-grid cols-2">
                    <div class="cust-field"><label>Тип объекта</label>
                        <select class="cust-input" id="cabPrjType">
                            <option value="house">🏠 Жилой дом</option><option value="apartment">🏢 Квартира</option>
                            <option value="office">🏬 Офис / Магазин</option><option value="warehouse">🏭 Склад / Цех</option>
                            <option value="foundation">🧱 Фундамент</option><option value="roof">🏚️ Кровля</option>
                            <option value="renovation">🔨 Ремонт</option><option value="landscape">🌳 Благоустройство</option>
                            <option value="other">📐 Другое</option>
                        </select></div>
                    <div class="cust-field"><label>Город</label>
                        <select class="cust-input" id="cabPrjCity">
                            <option value="">Выберите</option>
                            ${['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Атырау', 'Другой'].map(c => `<option value="${c}">${c}</option>`).join('')}
                        </select></div>
                </div>
                <div class="cust-field"><label>Адрес</label><input class="cust-input" id="cabPrjAddr" placeholder="ул. Строителей, д. 15"></div>
                <div class="cust-form-grid cols-2">
                    <div class="cust-field"><label>Площадь (м²)</label><input type="number" class="cust-input" id="cabPrjArea" placeholder="120"></div>
                    <div class="cust-field"><label>Этажей</label><input type="number" class="cust-input" id="cabPrjFloors" placeholder="2" min="1"></div>
                </div>
                <div class="cust-field"><label>Описание</label><textarea class="cust-input" id="cabPrjDesc" rows="2" placeholder="Краткое описание проекта..."></textarea></div>
                <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;font-size:0.85rem;color:rgba(255,255,255,0.7)">
                    <input type="checkbox" id="cabPrjDefault" style="accent-color:#8b5cf6"> Сделать основным объектом
                </label>
            </div>`;

        showModal('🏗️ Новый объект', body, function () {
            const title = document.getElementById('cabPrjTitle').value.trim();
            if (!title) { toast('⚠️ Укажите название объекта'); return; }
            const uid = getUserId();

            // If setting as default, unset others
            if (document.getElementById('cabPrjDefault').checked) {
                M().Project.findAll(uid).forEach(p => { p.isDefault = false; p.save(uid); });
            }

            const prj = new M().Project({
                customerId: uid,
                title,
                objectType: document.getElementById('cabPrjType').value,
                city: document.getElementById('cabPrjCity').value,
                address: document.getElementById('cabPrjAddr').value,
                area: document.getElementById('cabPrjArea').value,
                floors: document.getElementById('cabPrjFloors').value,
                description: document.getElementById('cabPrjDesc').value,
                isDefault: document.getElementById('cabPrjDefault').checked
            });
            prj.save(uid);

            // Emit feed event
            M().FeedEvent.emit(uid, {
                projectId: prj.id, type: 'info', icon: '🏗️',
                title: 'Создан новый объект',
                text: `«${title}» добавлен в список объектов`
            });

            closeModal();
            toast('✅ Объект добавлен!');
            renderTab();
        }, '➕ Добавить');
    }

    // --- Equipment Modal ---
    function openEquipmentModal() {
        const uid = getUserId();
        if (!M().VipLimits.canAddEquipment(uid)) { toast('⭐ Лимит техники. Откройте VIP!'); return; }

        const body = `
            <div class="cust-form-grid" style="gap:1rem">
                <div class="cust-field"><label>Название <span class="req">*</span></label>
                    <input class="cust-input" id="cabEqTitle" placeholder="Экскаватор JCB 3CX"></div>
                <div class="cust-form-grid cols-2">
                    <div class="cust-field"><label>Категория</label>
                        <select class="cust-input" id="cabEqCat">
                            <option value="transport">🚛 Транспорт</option><option value="tool">🔧 Инструмент</option>
                            <option value="heavy">🏗️ Спецтехника</option><option value="equipment">⚙️ Оборудование</option>
                        </select></div>
                    <div class="cust-field"><label>Количество</label>
                        <input type="number" class="cust-input" id="cabEqQty" value="1" min="1"></div>
                </div>
                <div class="cust-field"><label>Статус</label>
                    <select class="cust-input" id="cabEqStatus">
                        <option value="free">🟢 Свободна</option><option value="on_site">📍 На объекте</option><option value="repair">🔴 В ремонте</option>
                    </select></div>
                <div class="cust-field"><label>Примечание</label><input class="cust-input" id="cabEqNote" placeholder="Дополнительная информация..."></div>
            </div>`;

        showModal('🔧 Новая техника', body, function () {
            const title = document.getElementById('cabEqTitle').value.trim();
            if (!title) { toast('⚠️ Укажите название'); return; }
            const uid = getUserId();
            const eq = new M().Equipment({
                ownerCustomerId: uid, title,
                category: document.getElementById('cabEqCat').value,
                qty: parseInt(document.getElementById('cabEqQty').value) || 1,
                status: document.getElementById('cabEqStatus').value,
                note: document.getElementById('cabEqNote').value
            });
            eq.save(uid);
            M().FeedEvent.emit(uid, { type: 'info', icon: '🔧', title: 'Добавлена техника', text: `«${title}»` });
            closeModal(); toast('✅ Техника добавлена!'); renderTab();
        }, '➕ Добавить');
    }

    // --- Partner Modal ---
    function openPartnerModal() {
        const uid = getUserId();
        if (!M().VipLimits.canAddPartner(uid)) { toast('⭐ Лимит бригад. Откройте VIP!'); return; }

        const body = `
            <div class="cust-form-grid" style="gap:1rem">
                <div class="cust-field"><label>Название / ФИО <span class="req">*</span></label>
                    <input class="cust-input" id="cabPtTitle" placeholder="Бригада Иванова"></div>
                <div class="cust-form-grid cols-2">
                    <div class="cust-field"><label>Тип</label>
                        <select class="cust-input" id="cabPtKind">
                            <option value="crew">👷 Бригада</option><option value="master">🧑‍🔧 Мастер</option><option value="company">🏢 Компания</option>
                        </select></div>
                    <div class="cust-field"><label>Телефон</label>
                        <input type="tel" class="cust-input" id="cabPtPhone" placeholder="+7 (7XX) XXX-XX-XX"></div>
                </div>
                <div class="cust-field"><label>Специализации (через запятую)</label>
                    <input class="cust-input" id="cabPtTags" placeholder="сантехника, электрика, отделка"></div>
                <div class="cust-field"><label>Комментарий</label><input class="cust-input" id="cabPtNote" placeholder="Надёжные, работал с ними 3 года"></div>
            </div>`;

        showModal('👷 Новая бригада', body, function () {
            const title = document.getElementById('cabPtTitle').value.trim();
            if (!title) { toast('⚠️ Укажите название'); return; }
            const uid = getUserId();
            const tagsStr = document.getElementById('cabPtTags').value;
            const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [];
            const pt = new M().Partner({
                ownerCustomerId: uid, title,
                kind: document.getElementById('cabPtKind').value,
                phone: document.getElementById('cabPtPhone').value,
                tags, note: document.getElementById('cabPtNote').value
            });
            pt.save(uid);
            M().FeedEvent.emit(uid, { type: 'info', icon: '👷', title: 'Добавлена бригада', text: `«${title}»` });
            closeModal(); toast('✅ Бригада добавлена!'); renderTab();
        }, '➕ Добавить');
    }

    // --- Link Modal (привязка к объектам) ---
    function openLinkModal(entityType, entityId) {
        const uid = getUserId();
        const projects = M().Project.findAll(uid);
        if (projects.length === 0) { toast('ℹ️ Сначала добавьте объект'); return; }

        const LinkClass = entityType === 'equipment' ? M().ProjectEquipment : M().ProjectPartner;
        const existingLinks = entityType === 'equipment'
            ? M().ProjectEquipment.findByEquipment(uid, entityId).map(l => l.projectId)
            : M().ProjectPartner.findByProject(uid, entityId).map(l => l.projectId);

        // For partners, we need a different approach to find links
        let linkedProjectIds = [];
        projects.forEach(p => {
            if (entityType === 'equipment') {
                const links = M().ProjectEquipment.findByProject(uid, p.id);
                if (links.find(l => l.equipmentId === entityId)) linkedProjectIds.push(p.id);
            } else {
                const links = M().ProjectPartner.findByProject(uid, p.id);
                if (links.find(l => l.partnerId === entityId)) linkedProjectIds.push(p.id);
            }
        });

        const body = `
            <div style="display:flex;flex-direction:column;gap:0.5rem">
                ${projects.map(p => `
                    <label class="cab-list-item" style="cursor:pointer;margin-bottom:0">
                        <div class="cab-list-info">
                            <input type="checkbox" value="${p.id}" class="cabLinkCb" style="accent-color:#8b5cf6;width:18px;height:18px"
                                ${linkedProjectIds.includes(p.id) ? 'checked' : ''}>
                            <div class="cab-list-text"><div class="name">${OBJ_ICONS[p.objectType] || '📐'} ${esc(p.title)}</div><div class="meta">${esc(p.city)}</div></div>
                        </div>
                    </label>
                `).join('')}
            </div>`;

        showModal(`🔗 Привязать к объектам`, body, function () {
            const checkboxes = document.querySelectorAll('.cabLinkCb');
            const uid = getUserId();

            // First, remove all existing links for this entity
            projects.forEach(p => {
                if (entityType === 'equipment') M().ProjectEquipment.unlink(uid, p.id, entityId);
                else M().ProjectPartner.unlink(uid, p.id, entityId);
            });

            // Then add selected
            let count = 0;
            checkboxes.forEach(cb => {
                if (cb.checked) {
                    if (entityType === 'equipment') M().ProjectEquipment.link(uid, cb.value, entityId);
                    else M().ProjectPartner.link(uid, cb.value, entityId);
                    count++;
                }
            });

            closeModal();
            toast(`✅ Привязано к ${count} объект(ам)!`);
            renderTab();
        }, '🔗 Сохранить');
    }

    // ============================================================
    //  PROJECT DETAIL
    // ============================================================
    function openProjectDetail(projectId) {
        const uid = getUserId();
        const p = M().Project.findById(uid, projectId);
        if (!p) return;
        const isVip = M().VipLimits.isVip(uid);

        const eqLinks = M().ProjectEquipment.findByProject(uid, p.id);
        const ptLinks = M().ProjectPartner.findByProject(uid, p.id);
        const allEquip = M().Equipment.findAll(uid);
        const allPartners = M().Partner.findAll(uid);
        const events = M().FeedEvent.findByProject(uid, p.id).slice(0, 10);

        const linkedEquip = eqLinks.map(l => allEquip.find(e => e.id === l.equipmentId)).filter(Boolean);
        const linkedPartners = ptLinks.map(l => allPartners.find(pt => pt.id === l.partnerId)).filter(Boolean);

        const icon = OBJ_ICONS[p.objectType] || '📐';

        const body = `
            <div style="display:flex;flex-direction:column;gap:1rem">
                <!-- Header info -->
                <div style="display:flex;justify-content:space-between;align-items:center">
                    <div style="font-size:1.3rem;font-weight:800">${icon} ${esc(p.title)}</div>
                    <span class="cab-prj-status ${p.status}">${STATUS_LABEL[p.status]}</span>
                </div>
                <div class="cab-prj-progress" style="height:6px"><div class="cab-prj-progress-fill" style="width:${p.progress}%"></div></div>
                <div style="font-size:0.82rem;color:rgba(255,255,255,0.5)">
                    ${p.city ? `📍 ${esc(p.city)}` : ''} ${p.area ? `• 📐 ${p.area} м²` : ''} ${p.floors ? `• 🏢 ${p.floors} эт.` : ''}
                </div>
                ${p.description ? `<div style="font-size:0.85rem;color:rgba(255,255,255,0.6)">${esc(p.description)}</div>` : ''}

                <!-- Documents / Estimates -->
                ${p.estimates.length ? `
                    <div style="font-weight:700;margin-top:0.5rem">📄 Документы и оценки</div>
                    ${p.estimates.map(e => `<div class="cab-list-item" style="margin-bottom:0.35rem"><div class="cab-list-info"><div class="cab-list-text"><div class="name">${esc(e.title)}</div><div class="meta">${e.amount ? e.amount.toLocaleString() + '₸' : ''} • ${ago(e.createdAt)}</div></div></div></div>`).join('')}
                ` : ''}

                <!-- Photos -->
                ${p.photos.length ? `
                    <div style="font-weight:700">📸 Фото</div>
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(70px,1fr));gap:0.4rem">
                        ${p.photos.slice(0, 8).map(ph => `<div style="aspect-ratio:1;border-radius:8px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)"><img src="${ph}" style="width:100%;height:100%;object-fit:cover"></div>`).join('')}
                    </div>
                ` : ''}

                <!-- VIP: Linked equipment -->
                ${isVip && linkedEquip.length ? `
                    <div style="font-weight:700">🔧 Привязанная техника</div>
                    ${linkedEquip.map(e => `<div class="cab-list-item" style="margin-bottom:0.35rem;padding:0.7rem"><div class="cab-list-info"><div class="cab-list-text"><div class="name">${EQ_ICONS[e.category] || '🔧'} ${esc(e.title)}</div></div></div></div>`).join('')}
                ` : ''}

                <!-- VIP: Linked partners -->
                ${isVip && linkedPartners.length ? `
                    <div style="font-weight:700">👷 Привязанные бригады</div>
                    ${linkedPartners.map(pt => `<div class="cab-list-item" style="margin-bottom:0.35rem;padding:0.7rem"><div class="cab-list-info"><div class="cab-list-text"><div class="name">${PARTNER_ICONS[pt.kind] || '👷'} ${esc(pt.title)}</div></div></div></div>`).join('')}
                ` : ''}

                <!-- History -->
                ${events.length ? `
                    <div style="font-weight:700">📜 Последние события</div>
                    ${events.map(ev => `<div style="font-size:0.8rem;padding:0.5rem 0;border-bottom:1px solid rgba(255,255,255,0.04);color:rgba(255,255,255,0.6)"><span style="margin-right:0.35rem">${ev.icon || '📌'}</span>${esc(ev.title)} <span style="color:rgba(255,255,255,0.3);margin-left:0.5rem">${ago(ev.createdAt)}</span></div>`).join('')}
                ` : ''}

                <!-- Status controls -->
                <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-top:0.5rem">
                    <button class="cab-modal-btn cancel" style="font-size:0.78rem;padding:0.5rem 1rem" onclick="CabinetUI._setProjectStatus('${p.id}','active')">🟢 В работе</button>
                    <button class="cab-modal-btn cancel" style="font-size:0.78rem;padding:0.5rem 1rem" onclick="CabinetUI._setProjectStatus('${p.id}','paused')">⏸ Пауза</button>
                    <button class="cab-modal-btn cancel" style="font-size:0.78rem;padding:0.5rem 1rem" onclick="CabinetUI._setProjectStatus('${p.id}','completed')">✅ Завершить</button>
                    <button class="cab-modal-btn cancel danger" style="font-size:0.78rem;padding:0.5rem 1rem;margin-left:auto;color:#ef4444;border-color:rgba(239,68,68,0.3)" onclick="CabinetUI._deleteProject('${p.id}')">🗑️ Удалить</button>
                </div>
            </div>`;

        const mc = document.getElementById('cabModalContainer');
        if (!mc) return;
        mc.innerHTML = `
            <div class="cab-modal-overlay" onclick="CabinetUI._closeModal()">
                <div class="cab-modal" style="max-width:620px" onclick="event.stopPropagation()">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem">
                        <div></div>
                        <button style="background:none;border:none;color:rgba(255,255,255,0.5);font-size:1.2rem;cursor:pointer" onclick="CabinetUI._closeModal()">✕</button>
                    </div>
                    ${body}
                </div>
            </div>`;
    }

    // ============================================================
    //  ACTIONS
    // ============================================================
    async function deleteEquipment(id) {
        const ok = await (window.QazUI?.confirm || window.confirm)('Удалить технику?', 'Единица будет удалена из списка', { icon: '🔧', danger: true, confirmText: 'Удалить' });
        if (!ok) return;
        const uid = getUserId();
        const eq = M().Equipment.findById(uid, id);
        if (eq) eq.delete(uid);
        toast('🗑️ Техника удалена');
        renderTab();
    }

    async function deletePartner(id) {
        const ok = await (window.QazUI?.confirm || window.confirm)('Удалить бригаду?', 'Бригада будет убрана из списка', { icon: '👷', danger: true, confirmText: 'Удалить' });
        if (!ok) return;
        const uid = getUserId();
        const all = M().Partner.findAll(uid);
        const pt = all.find(p => p.id === id);
        if (pt) pt.delete(uid);
        toast('🗑️ Бригада удалена');
        renderTab();
    }

    function setProjectStatus(projectId, status) {
        const uid = getUserId();
        const p = M().Project.findById(uid, projectId);
        if (!p) return;
        p.status = status;
        p.save(uid);
        M().FeedEvent.emit(uid, { projectId, type: 'status_change', icon: '🔄', title: `Статус изменён: ${STATUS_LABEL[status]}`, text: `Объект «${p.title}»` });
        closeModal(); toast('✅ Статус обновлён'); renderTab();
    }

    async function deleteProject(projectId) {
        const ok = await (window.QazUI?.confirm || window.confirm)('Удалить объект?', 'Все привязки техники и бригад будут потеряны', { icon: '🏗️', danger: true, confirmText: 'Удалить' });
        if (!ok) return;
        const uid = getUserId();
        const p = M().Project.findById(uid, projectId);
        if (p) p.delete(uid);
        M().ProjectEquipment.unlinkAll(uid, projectId, 'project');
        M().ProjectPartner.unlinkAll(uid, projectId, 'project');
        closeModal(); toast('🗑️ Объект удалён'); renderTab();
    }

    function setFeedFilter(filter) {
        feedFilter = filter;
        renderTab();
    }

    function feedAction(url) {
        if (window.showPage) window.showPage(url);
    }

    function openVip() {
        toast('⭐ VIP — скоро! Следите за обновлениями.');
        // Future: open VIP purchase flow
    }

    // ============================================================
    //  SMART "GO TO ESTIMATE" FLOW
    // ============================================================
    function goToEstimate() {
        const uid = getUserId();
        const projects = M().Project.findAll(uid);

        if (projects.length === 0) {
            toast('ℹ️ Сначала добавьте объект');
            switchTab('projects');
            // Highlight the add button
            setTimeout(() => {
                const addBtn = document.querySelector('.cab-empty-btn, .cab-add-btn');
                if (addBtn) { addBtn.style.animation = 'none'; void addBtn.offsetWidth; addBtn.style.animation = 'feedPulse 1s ease 3'; }
            }, 300);
            return;
        }

        const defProject = M().Project.getDefault(uid);
        if (defProject) {
            // Emit event
            M().FeedEvent.emit(uid, { projectId: defProject.id, type: 'estimate', icon: '📸', title: 'Начата оценка по фото', text: `Объект: «${defProject.title}»` });
            if (window.showPage) window.showPage('photo-estimate');
            return;
        }

        // Show project selection modal
        const body = `
            <div style="display:flex;flex-direction:column;gap:0.5rem">
                <p style="font-size:0.85rem;color:rgba(255,255,255,0.6);margin-bottom:0.5rem">Выберите объект для оценки:</p>
                ${projects.map((p, i) => `
                    <label class="cab-list-item" style="cursor:pointer;margin-bottom:0">
                        <div class="cab-list-info">
                            <input type="radio" name="cabEstProject" value="${p.id}" style="accent-color:#8b5cf6;width:18px;height:18px" ${i === 0 ? 'checked' : ''}>
                            <div class="cab-list-text"><div class="name">${OBJ_ICONS[p.objectType] || '📐'} ${esc(p.title)}</div><div class="meta">${esc(p.city)} ${p.area ? '• ' + p.area + ' м²' : ''}</div></div>
                        </div>
                    </label>
                `).join('')}
            </div>`;

        showModal('📸 Выберите объект для оценки', body, function () {
            const selected = document.querySelector('input[name="cabEstProject"]:checked');
            if (!selected) { toast('⚠️ Выберите объект'); return; }
            const pid = selected.value;
            const p = M().Project.findById(uid, pid);
            M().FeedEvent.emit(uid, { projectId: pid, type: 'estimate', icon: '📸', title: 'Начата оценка по фото', text: `Объект: «${p ? p.title : ''}»` });
            closeModal();
            if (window.showPage) window.showPage('photo-estimate');
        }, '📸 Выбрать и продолжить');
    }

    // ============================================================
    //  DEMO DATA (populate feed for first-time users)
    // ============================================================
    function seedDemoIfEmpty() {
        const uid = getUserId();
        const events = M().FeedEvent.findAll(uid);
        if (events.length > 0) return; // Already has data

        // Add welcome events
        const demoEvents = [
            { type: 'system', icon: '🎉', title: 'Добро пожаловать в кабинет!', text: 'Начните с добавления вашего первого объекта' },
            { type: 'action_required', icon: '📋', title: 'Заполните профиль', text: 'Контактные данные помогут подобрать лучших исполнителей', status: 'pending', actionUrl: 'customer-profile', actionLabel: 'Заполнить' },
        ];
        // Add in reverse order so newest appears first
        demoEvents.reverse().forEach(d => {
            const ev = new M().FeedEvent({ customerId: uid, ...d, createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString() });
            ev.save(uid);
        });
    }

    // ============================================================
    //  PUBLIC API
    // ============================================================
    window.CabinetUI = {
        render() { seedDemoIfEmpty(); render(); },
        switchTab,
        openProjectModal,
        openProjectDetail,
        openEquipmentModal,
        openPartnerModal,
        openLinkModal,
        deleteEquipment,
        deletePartner,
        setFeedFilter,
        feedAction,
        goToEstimate,
        openVip,
        _closeModal: closeModal,
        _setProjectStatus: setProjectStatus,
        _deleteProject: deleteProject,
    };

    console.log('✅ CabinetUI loaded');
})();
