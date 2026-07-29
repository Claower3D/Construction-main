// ========== VIP UI v3.0 ==========
// Модуль "Строительство зданий и сооружений" - Premium UI
// Полностью переписан для стабильности и красивого дизайна

(function () {
    'use strict';

    // ===== HELPERS =====
    const $ = s => document.querySelector(s);
    const $$ = s => Array.from(document.querySelectorAll(s));

    // ===== STATE =====
    let currentProjectId = null;
    let currentTab = 'wbs';
    let expandedNodes = new Set();
    let selectedNodes = new Set();

    // ===== STATUS CONFIGS =====
    const PROJECT_STATUS = {
        DRAFT: { label: 'Черновик', class: 'draft' },
        ACTIVE: { label: 'Активный', class: 'active' },
        COMPLETED: { label: 'Завершён', class: 'completed' },
        ARCHIVED: { label: 'Архив', class: 'draft' }
    };

    const LOT_STATUS = {
        DRAFT: { label: 'Черновик', class: 'draft' },
        PUBLISHED: { label: 'Опубликован', class: 'published' },
        RESERVED: { label: 'Зарезервирован', class: 'in-progress' },
        IN_PROGRESS: { label: 'В работе', class: 'in-progress' },
        SUBMITTED: { label: 'На проверке', class: 'submitted' },
        REWORK: { label: 'Доработка', class: 'rework' },
        ACCEPTED: { label: 'Принят', class: 'completed' },
        CLOSED: { label: 'Закрыт', class: 'completed' },
        CANCELLED: { label: 'Отменён', class: 'draft' }
    };

    const OBJECT_TYPES = [
        { id: 'RESIDENTIAL', icon: '🏢', label: 'Жилой дом' },
        { id: 'COMMERCIAL', icon: '🏬', label: 'Коммерческий' },
        { id: 'INDUSTRIAL', icon: '🏭', label: 'Промышленный' },
        { id: 'PRIVATE', icon: '🏡', label: 'Частный дом' },
        { id: 'INFRASTRUCTURE', icon: '🌉', label: 'Инфраструктура' },
        { id: 'OTHER', icon: '🏗️', label: 'Другое' }
    ];

    // ===== INIT =====
    function init() {
        console.log('[VipUI] Initializing...');
        const container = $('#vipMain');

        if (!container) {
            console.error('[VipUI] Container #vipMain not found');
            return;
        }

        // Check dependencies
        const missing = [];
        if (!window.VipModels) missing.push('VipModels');
        if (!window.VipService) missing.push('VipService');
        if (!window.WBSGenerator) missing.push('WBSGenerator');

        if (missing.length > 0) {
            container.innerHTML = renderError(`Не загружены модули: ${missing.join(', ')}`);
            return;
        }

        console.log('[VipUI] All dependencies loaded');
        renderProjectList();
    }

    // ===== ERROR RENDER =====
    function renderError(message) {
        return `
            <div class="vip-module">
                <div class="vip-empty-state" style="border-color: rgba(239,68,68,0.3);">
                    <div class="vip-empty-icon">⚠️</div>
                    <h3 class="vip-empty-title" style="color:#ef4444">Ошибка загрузки</h3>
                    <p class="vip-empty-text">${message}</p>
                    <button class="vip-btn vip-btn-primary" onclick="location.reload()">
                        🔄 Обновить страницу
                    </button>
                </div>
            </div>
        `;
    }

    // ===== RENDER: Project List =====
    function renderProjectList() {
        const container = $('#vipMain');
        if (!container) return;

        const projects = window.VipService?.Project?.list() || [];

        container.innerHTML = `
            <div class="vip-module">
                <div class="vip-page-header">
                    <div class="vip-page-header-content">
                        <h1 class="vip-page-title">🏗️ Мои объекты</h1>
                        <p class="vip-page-subtitle">Управление строительными проектами</p>
                    </div>
                    <button class="vip-btn vip-btn-primary vip-btn-lg" onclick="VipUI.showCreateProjectModal()">
                        ➕ Создать объект
                    </button>
                </div>

                ${projects.length === 0 ? `
                    <div class="vip-empty-state">
                        <div class="vip-empty-icon">🏗️</div>
                        <h3 class="vip-empty-title">Нет объектов</h3>
                        <p class="vip-empty-text">Создайте первый строительный объект для начала работы</p>
                        <button class="vip-btn vip-btn-primary" onclick="VipUI.showCreateProjectModal()">
                            Создать объект
                        </button>
                    </div>
                ` : `
                    <div class="vip-projects-grid">
                        ${projects.map(renderProjectCard).join('')}
                    </div>
                `}
            </div>
        `;
    }

    // ===== RENDER: Project Card =====
    function renderProjectCard(project) {
        const status = PROJECT_STATUS[project.status] || PROJECT_STATUS.DRAFT;

        return `
            <div class="vip-card vip-card-clickable vip-project-card" onclick="VipUI.openProject('${project.id}')">
                <div class="vip-card-header">
                    <div class="vip-card-icon">
                        ${project.photo ? `<img src="${project.photo}" alt="">` : '🏢'}
                    </div>
                    <div class="vip-card-info">
                        <h3 class="vip-card-title">${escapeHtml(project.title)}</h3>
                        <p class="vip-card-subtitle">${escapeHtml(project.city || '')}${project.address ? ', ' + escapeHtml(project.address) : ''}</p>
                    </div>
                </div>

                <div class="vip-card-body">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem">
                        <span class="vip-badge vip-badge-${status.class}">${status.label}</span>
                        <span style="color:var(--text-muted);font-size:0.85rem">${project.wbsType || 'Без WBS'}</span>
                    </div>

                    <div class="vip-project-progress">
                        <div class="vip-progress-bar">
                            <div class="vip-progress-fill" style="width:${project.progressPercent || 0}%"></div>
                        </div>
                    </div>

                    <div class="vip-project-stats">
                        <span class="vip-project-stat">📊 ${project.progressPercent || 0}%</span>
                        <span class="vip-project-stat">📦 ${project.lotsCount || 0} лотов</span>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== RENDER: Project Dashboard =====
    function renderProjectDashboard(projectId) {
        currentProjectId = projectId;
        const container = $('#vipMain');
        if (!container) return;

        const project = window.VipService?.Project?.get(projectId);
        if (!project) {
            container.innerHTML = renderError('Проект не найден');
            return;
        }

        container.innerHTML = `
            <div class="vip-module">
                <div class="vip-page-header">
                    <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap">
                        <button class="vip-btn vip-btn-ghost" onclick="VipUI.backToList()">← Назад</button>
                        <div class="vip-page-header-content">
                            <h1 class="vip-page-title">${escapeHtml(project.title)}</h1>
                            <p class="vip-page-subtitle">${escapeHtml(project.city || '')}${project.address ? ', ' + escapeHtml(project.address) : ''}</p>
                        </div>
                    </div>
                    <button class="vip-btn vip-btn-secondary" onclick="VipUI.showEditProjectModal('${projectId}')">
                        ⚙️ Настройки
                    </button>
                </div>

                ${!project.wbsType ? renderWBSSetup(projectId) : renderProjectTabs(projectId, project)}
            </div>
        `;
    }

    // ===== RENDER: WBS Setup =====
    function renderWBSSetup(projectId) {
        return `
            <div class="vip-card" style="text-align:center;padding:3rem">
                <div style="font-size:4rem;margin-bottom:1.5rem">📋</div>
                <h3 style="margin:0 0 0.5rem">Выберите структуру работ</h3>
                <p style="color:var(--text-muted);margin:0 0 2rem">Сгенерируйте WBS для управления этапами строительства</p>
                
                <div class="vip-wbs-options">
                    <div class="vip-wbs-option" onclick="VipUI.generateWBS('${projectId}', 'WBS20')">
                        <div class="vip-wbs-option-icon">📦</div>
                        <div class="vip-wbs-option-title">WBS-20</div>
                        <div class="vip-wbs-option-desc">20 основных этапов</div>
                    </div>
                    <div class="vip-wbs-option" onclick="VipUI.generateWBS('${projectId}', 'WBS120')">
                        <div class="vip-wbs-option-icon">📊</div>
                        <div class="vip-wbs-option-title">WBS-120</div>
                        <div class="vip-wbs-option-desc">С детализацией работ</div>
                    </div>
                    <div class="vip-wbs-option" onclick="VipUI.showWBS1000Modal('${projectId}')">
                        <div class="vip-wbs-option-icon">🏢</div>
                        <div class="vip-wbs-option-title">WBS-1000</div>
                        <div class="vip-wbs-option-desc">Секции + этажи</div>
                    </div>
                </div>
            </div>
        `;
    }

    // ===== RENDER: Tabs =====
    function renderProjectTabs(projectId, project) {
        return `
            <div class="vip-tabs">
                <button class="vip-tab ${currentTab === 'wbs' ? 'active' : ''}" onclick="VipUI.switchTab('wbs')">
                    📋 WBS
                </button>
                <button class="vip-tab ${currentTab === 'lots' ? 'active' : ''}" onclick="VipUI.switchTab('lots')">
                    📦 Лоты
                </button>
                <button class="vip-tab ${currentTab === 'docs' ? 'active' : ''}" onclick="VipUI.switchTab('docs')">
                    📄 Документы
                </button>
            </div>

            <div id="tabContent">
                ${currentTab === 'wbs' ? renderWBSTab(projectId) : ''}
                ${currentTab === 'lots' ? renderLotsTab(projectId) : ''}
                ${currentTab === 'docs' ? renderDocsTab(projectId) : ''}
            </div>
        `;
    }

    // ===== RENDER: WBS Tab =====
    function renderWBSTab(projectId) {
        const nodes = window.VipModels?.WBSNode?.findByProject(projectId) || [];
        // Фильтруем только корневые узлы (level 0 или без parentId)
        const rootNodes = nodes.filter(n => !n.parentId || n.level === 0);

        return `
            <div class="vip-wbs-toolbar">
                <div class="vip-wbs-search-wrapper">
                    <span class="vip-wbs-search-icon">🔍</span>
                    <input type="text" class="vip-wbs-search" placeholder="Поиск по названию..." 
                        id="wbsSearchInput" oninput="VipUI.searchWBS(this.value)">
                </div>
                ${selectedNodes.size > 0 ? `
                    <button class="vip-btn vip-btn-primary" onclick="VipUI.showCreateLotModal()">
                        📦 Создать лот (${selectedNodes.size})
                    </button>
                    <button class="vip-btn vip-btn-secondary" onclick="VipUI.clearSelection()">
                        ✕ Сбросить
                    </button>
                ` : ''}
            </div>

            <div class="vip-wbs-container">
                ${rootNodes.length === 0 ? `
                    <div style="padding:3rem;text-align:center;color:var(--text-muted)">
                        <div style="font-size:3rem;margin-bottom:1rem">📋</div>
                        <p>WBS пуст. Сгенерируйте структуру работ.</p>
                    </div>
                ` : `
                    <div class="vip-wbs-grid" id="wbsGrid">
                        ${rootNodes.map(renderWBSBlock).join('')}
                    </div>
                `}
            </div>

            <div style="margin-top:1rem;display:flex;justify-content:space-between;align-items:center;color:var(--text-muted);font-size:0.85rem">
                <span>Нажмите на блок для выбора работ</span>
                <span>Всего: ${rootNodes.length} этапов</span>
            </div>
        `;
    }

    // ===== RENDER: WBS Block =====
    function renderWBSBlock(node) {
        const isSelected = selectedNodes.has(node.id);
        const isInLot = !!node.lotId;
        const tag = node.tags?.[0] || 'default';
        const icon = getWBSIcon(tag);

        return `
            <div class="vip-wbs-block ${isSelected ? 'selected' : ''} ${isInLot ? 'in-lot' : ''}" 
                data-tag="${tag}"
                data-id="${node.id}"
                onclick="VipUI.toggleWBSSelect('${node.id}')">
                
                ${!isInLot ? `
                    <input type="checkbox" class="vip-wbs-block-checkbox" 
                        ${isSelected ? 'checked' : ''}
                        onclick="event.stopPropagation();VipUI.toggleWBSSelect('${node.id}')">
                ` : ''}
                
                ${isInLot ? '<span class="vip-wbs-block-status in-lot">В лоте</span>' : ''}
                
                <div class="vip-wbs-block-icon">${icon}</div>
                <span class="vip-wbs-block-code">${escapeHtml(node.code)}</span>
                <span class="vip-wbs-block-title">${escapeHtml(node.title)}</span>
                ${node.unit ? `<span class="vip-wbs-block-unit">${escapeHtml(node.unit)}</span>` : ''}
            </div>
        `;
    }

    // ===== Get WBS Icon by Tag =====
    function getWBSIcon(tag) {
        const icons = {
            prep: '🚧',
            earthwork: '⛏️',
            foundation: '🧱',
            structure: '🏗️',
            roofing: '🏠',
            walls: '🧊',
            exterior: '🏢',
            interior: '🚪',
            openings: '🪟',
            electrical: '⚡',
            plumbing: '🚿',
            sewage: '🚽',
            hvac: '❄️',
            heating: '🔥',
            finish: '🎨',
            rough: '🔨',
            final: '✨',
            flooring: '🪵',
            ceiling: '💡',
            fixtures: '🛁',
            low_voltage: '📡',
            landscaping: '🌳',
            commissioning: '✅',
            section: '🏢',
            floor: '📊',
            default: '📦'
        };
        return icons[tag] || icons.default;
    }

    // ===== Clear Selection =====
    function clearSelection() {
        selectedNodes.clear();
        renderProjectDashboard(currentProjectId);
    }


    // ===== RENDER: Lots Tab =====
    function renderLotsTab(projectId) {
        const lots = window.VipService?.Lot?.getByProject(projectId) || [];

        return `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
                <h3 style="margin:0">Лоты проекта</h3>
            </div>

            ${lots.length === 0 ? `
                <div class="vip-card" style="text-align:center;padding:2rem">
                    <div style="font-size:2.5rem;margin-bottom:0.75rem">📦</div>
                    <p style="color:var(--text-muted);margin:0">Нет лотов. Выберите работы во вкладке WBS и создайте лот.</p>
                </div>
            ` : `
                <div class="vip-lots-grid">
                    ${lots.map(renderLotCard).join('')}
                </div>
            `}
        `;
    }

    // ===== RENDER: Lot Card =====
    function renderLotCard(lot) {
        const status = LOT_STATUS[lot.status] || LOT_STATUS.DRAFT;

        return `
            <div class="vip-card vip-lot-card" onclick="VipUI.openLotDetails('${lot.id}')">
                <div class="vip-lot-header">
                    <div>
                        <div class="vip-lot-badges">
                            <span class="vip-badge vip-badge-${status.class}">${status.label}</span>
                            <span class="vip-badge vip-badge-${lot.type === 'FIX' ? 'fix' : 'tender'}">
                                ${lot.type === 'FIX' ? '💰 Фикс' : '📊 Тендер'}
                            </span>
                        </div>
                        <h4 class="vip-lot-title">${escapeHtml(lot.title)}</h4>
                        <p class="vip-lot-subtitle">${lot.wbsNodeIds?.length || 0} работ</p>
                    </div>
                    <div class="vip-lot-price">${formatPrice(lot.budget)} ₸</div>
                </div>

                <div class="vip-lot-info">
                    <div class="vip-lot-info-item">📅 до ${lot.deadlineEnd || 'не указано'}</div>
                    ${lot.bidsCount > 0 ? `<div class="vip-lot-info-item">📨 ${lot.bidsCount} откликов</div>` : ''}
                </div>

                ${lot.status === 'DRAFT' ? `
                    <div class="vip-lot-actions">
                        <button class="vip-btn vip-btn-primary" style="flex:1" 
                            onclick="event.stopPropagation();VipUI.publishLot('${lot.id}')">
                            🚀 Опубликовать
                        </button>
                        <button class="vip-btn vip-btn-danger" 
                            onclick="event.stopPropagation();VipUI.deleteLot('${lot.id}')">
                            🗑️
                        </button>
                    </div>
                ` : ''}

                ${lot.status === 'SUBMITTED' ? `
                    <div class="vip-lot-actions">
                        <button class="vip-btn vip-btn-success" style="flex:1" 
                            onclick="event.stopPropagation();VipUI.showAcceptanceModal('${lot.id}')">
                            ✅ Принять
                        </button>
                        <button class="vip-btn vip-btn-danger" style="flex:1" 
                            onclick="event.stopPropagation();VipUI.showReworkModal('${lot.id}')">
                            🔄 Доработка
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // ===== RENDER: Docs Tab =====
    function renderDocsTab(projectId) {
        return `
            <div class="vip-docs-container">
                <div class="vip-docs-icon">📄</div>
                <h3 class="vip-docs-title">Документы</h3>
                <p class="vip-docs-text">Генерация PDF отчётов по проекту</p>
                <div class="vip-docs-actions">
                    <button class="vip-btn vip-btn-secondary" onclick="VipUI.generatePDF('estimate', '${projectId}')">
                        📊 Смета PDF
                    </button>
                    <button class="vip-btn vip-btn-secondary" onclick="VipUI.generatePDF('progress', '${projectId}')">
                        📈 Прогресс PDF
                    </button>
                </div>
            </div>
        `;
    }

    // ===== MODAL: Create Project =====
    function showCreateProjectModal() {
        const modal = createModal('createProjectModal', `
            <div class="vip-modal-header">
                <h2 class="vip-modal-title">🏗️ Новый строительный объект</h2>
                <p class="vip-modal-subtitle">Заполните информацию о проекте</p>
            </div>
            <div class="vip-modal-body">
                <div class="vip-photo-upload">
                    <div class="vip-photo-preview" id="projectPhotoPreview" onclick="$('#projectPhotoInput').click()">📷</div>
                    <input type="file" id="projectPhotoInput" accept="image/*" style="display:none" 
                        onchange="VipUI.previewProjectPhoto(this)">
                    <div class="vip-form-group" style="flex:1">
                        <label class="vip-form-label">Название объекта <span class="required">*</span></label>
                        <input type="text" class="vip-form-input" id="projTitle" placeholder="Например: ЖК Премиум Парк">
                    </div>
                </div>

                <div class="vip-form-group">
                    <label class="vip-form-label">Тип объекта</label>
                    <div class="vip-type-grid" id="objectTypeGrid">
                        ${OBJECT_TYPES.map((t, i) => `
                            <label class="vip-type-option ${i === 0 ? 'selected' : ''}" data-type="${t.id}" onclick="VipUI.selectObjectType('${t.id}')">
                                <span class="vip-type-icon">${t.icon}</span>
                                <span class="vip-type-label">${t.label}</span>
                                <input type="radio" name="objectType" value="${t.id}" ${i === 0 ? 'checked' : ''}>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="vip-form-row">
                    <div class="vip-form-group">
                        <label class="vip-form-label">Город <span class="required">*</span></label>
                        <input type="text" class="vip-form-input" id="projCity" placeholder="Алматы">
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Адрес</label>
                        <input type="text" class="vip-form-input" id="projAddress" placeholder="ул. Абая, 150">
                    </div>
                </div>

                <div class="vip-form-row vip-form-row-4">
                    <div class="vip-form-group">
                        <label class="vip-form-label">Этажей</label>
                        <div class="vip-input-addon">
                            <input type="number" class="vip-form-input" id="projFloors" value="1" min="1" max="200">
                            <span class="vip-input-addon-suffix">эт.</span>
                        </div>
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Секций</label>
                        <input type="number" class="vip-form-input" id="projSections" value="1" min="1" max="50">
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Площадь</label>
                        <div class="vip-input-addon">
                            <input type="number" class="vip-form-input" id="projArea" placeholder="0">
                            <span class="vip-input-addon-suffix">м²</span>
                        </div>
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Бюджет</label>
                        <div class="vip-input-addon">
                            <input type="number" class="vip-form-input" id="projBudget" placeholder="0">
                            <span class="vip-input-addon-suffix">₸</span>
                        </div>
                    </div>
                </div>

                <div class="vip-form-row">
                    <div class="vip-form-group">
                        <label class="vip-form-label">Начало</label>
                        <input type="date" class="vip-form-input" id="projStartDate">
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Завершение</label>
                        <input type="date" class="vip-form-input" id="projEndDate">
                    </div>
                </div>

                <div class="vip-form-group">
                    <label class="vip-form-label">Описание</label>
                    <textarea class="vip-form-textarea" id="projDescription" rows="3" 
                        placeholder="Краткое описание объекта..."></textarea>
                </div>
            </div>
            <div class="vip-modal-footer">
                <button class="vip-btn vip-btn-secondary" onclick="VipUI.closeModal('createProjectModal')">Отмена</button>
                <button class="vip-btn vip-btn-primary" onclick="VipUI.createProject()">✨ Создать объект</button>
            </div>
        `);

        // Set default dates
        const today = new Date().toISOString().split('T')[0];
        const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        $('#projStartDate').value = today;
        $('#projEndDate').value = nextYear;
    }

    // ===== ACTION: Create Project =====
    function createProject() {
        const title = $('#projTitle')?.value?.trim();
        const city = $('#projCity')?.value?.trim();

        if (!title || !city) {
            showToast('⚠️ Заполните обязательные поля: название и город');
            return;
        }

        const data = {
            title,
            city,
            address: $('#projAddress')?.value?.trim(),
            objectType: document.querySelector('input[name="objectType"]:checked')?.value || 'OTHER',
            floors: parseInt($('#projFloors')?.value) || 1,
            sections: parseInt($('#projSections')?.value) || 1,
            area: parseFloat($('#projArea')?.value) || 0,
            budget: parseFloat($('#projBudget')?.value) || 0,
            startDate: $('#projStartDate')?.value,
            endDate: $('#projEndDate')?.value,
            description: $('#projDescription')?.value?.trim(),
            photo: $('#projectPhotoPreview img')?.src || null
        };

        const result = window.VipService?.Project?.create(data);

        if (result?.success) {
            closeModal('createProjectModal');
            showToast('✅ Объект создан!');
            renderProjectList();
        } else {
            showToast('❌ ' + (result?.errors?.join(', ') || 'Ошибка создания'));
        }
    }

    // ===== ACTIONS =====
    function openProject(id) {
        currentProjectId = id;
        currentTab = 'wbs';
        selectedNodes.clear();
        expandedNodes.clear();
        renderProjectDashboard(id);
    }

    function backToList() {
        currentProjectId = null;
        currentTab = 'wbs';
        selectedNodes.clear();
        renderProjectList();
    }

    function switchTab(tab) {
        currentTab = tab;
        if (currentProjectId) renderProjectDashboard(currentProjectId);
    }

    function generateWBS(projectId, type) {
        const result = window.VipService?.WBS?.generate(projectId, type);
        if (result?.success) {
            showToast(`✅ ${type} сгенерирован: ${result.count} узлов`);
            renderProjectDashboard(projectId);
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    function toggleWBSExpand(nodeId) {
        if (expandedNodes.has(nodeId)) {
            expandedNodes.delete(nodeId);
        } else {
            expandedNodes.add(nodeId);
        }
        renderProjectDashboard(currentProjectId);
    }

    function toggleWBSSelect(nodeId) {
        const node = window.VipModels?.WBSNode?.find(nodeId);
        if (node?.lotId) return;

        if (selectedNodes.has(nodeId)) {
            selectedNodes.delete(nodeId);
        } else {
            selectedNodes.add(nodeId);
        }
        renderProjectDashboard(currentProjectId);
    }

    function expandAllWBS() {
        const nodes = window.VipService?.WBS?.getFlatList(currentProjectId, new Set()) || [];
        nodes.forEach(n => { if (n.hasChildren) expandedNodes.add(n.id); });
        renderProjectDashboard(currentProjectId);
    }

    function collapseAllWBS() {
        expandedNodes.clear();
        renderProjectDashboard(currentProjectId);
    }

    function searchWBS(query) {
        if (query.length >= 2) {
            const matches = window.VipService?.WBS?.search(currentProjectId, query) || [];
            matches.forEach(n => {
                let parent = window.VipModels?.WBSNode?.find(n.parentId);
                while (parent) {
                    expandedNodes.add(parent.id);
                    parent = window.VipModels?.WBSNode?.find(parent.parentId);
                }
            });
        }
        renderProjectDashboard(currentProjectId);
    }

    function publishLot(lotId) {
        const result = window.VipService?.Lot?.publish(lotId);
        if (result?.success) {
            showToast('✅ Лот опубликован');
            renderProjectDashboard(currentProjectId);
        } else {
            showToast('❌ ' + (result?.errors?.join(', ') || result?.error || 'Ошибка'));
        }
    }

    async function deleteLot(lotId) {
        const ok = await (window.QazUI?.confirm || window.confirm)('Удалить лот?', 'Это действие нельзя отменить', { icon: '🗑️', danger: true, confirmText: 'Удалить' });
        if (!ok) return;
        const result = window.VipService?.Lot?.cancel(lotId, 'Удалён пользователем');
        if (result?.success) {
            showToast('✅ Лот удалён');
            renderProjectDashboard(currentProjectId);
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    function generatePDF(type, projectId) {
        if (window.VipPdfService?.generate) {
            const result = window.VipPdfService.generate(type, projectId);
            if (result?.success) {
                showToast('✅ PDF сгенерирован');
            } else {
                showToast('❌ ' + (result?.error || 'Ошибка генерации PDF'));
            }
        } else {
            showToast('⚠️ PDF сервис не загружен');
        }
    }

    // ===== MODAL: Create Lot =====
    function showCreateLotModal() {
        if (selectedNodes.size === 0) {
            showToast('⚠️ Выберите работы из WBS');
            return;
        }

        const modal = createModal('createLotModal', `
            <div class="vip-modal-header">
                <h2 class="vip-modal-title">📦 Создать лот</h2>
                <p class="vip-modal-subtitle">Выбрано работ: ${selectedNodes.size}</p>
            </div>
            <div class="vip-modal-body">
                <div class="vip-form-group">
                    <label class="vip-form-label">Название лота <span class="required">*</span></label>
                    <input type="text" class="vip-form-input" id="lotTitle" placeholder="Название лота">
                </div>
                <div class="vip-form-group">
                    <label class="vip-form-label">Описание</label>
                    <textarea class="vip-form-textarea" id="lotDescription" rows="3" placeholder="Описание работ"></textarea>
                </div>
                <div class="vip-form-row">
                    <div class="vip-form-group">
                        <label class="vip-form-label">Тип лота</label>
                        <select class="vip-form-select" id="lotType">
                            <option value="FIX">💰 Фикс-цена</option>
                            <option value="TENDER">📊 Тендер</option>
                        </select>
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Бюджет (₸) <span class="required">*</span></label>
                        <input type="number" class="vip-form-input" id="lotBudget" placeholder="0">
                    </div>
                </div>
                <div class="vip-form-row">
                    <div class="vip-form-group">
                        <label class="vip-form-label">Начало</label>
                        <input type="date" class="vip-form-input" id="lotStart">
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Завершение <span class="required">*</span></label>
                        <input type="date" class="vip-form-input" id="lotEnd">
                    </div>
                </div>
            </div>
            <div class="vip-modal-footer">
                <button class="vip-btn vip-btn-secondary" onclick="VipUI.closeModal('createLotModal')">Отмена</button>
                <button class="vip-btn vip-btn-primary" onclick="VipUI.createLot()">Создать лот</button>
            </div>
        `);
    }

    function createLot() {
        const title = $('#lotTitle')?.value?.trim();
        const budget = parseInt($('#lotBudget')?.value) || 0;
        const deadlineEnd = $('#lotEnd')?.value;

        if (!title) {
            showToast('⚠️ Укажите название лота');
            return;
        }
        if (budget <= 0) {
            showToast('⚠️ Укажите бюджет');
            return;
        }
        if (!deadlineEnd) {
            showToast('⚠️ Укажите срок завершения');
            return;
        }

        const result = window.VipService?.Lot?.createFromWBS(
            currentProjectId,
            Array.from(selectedNodes),
            $('#lotType')?.value || 'FIX',
            {
                title,
                description: $('#lotDescription')?.value?.trim(),
                budget,
                deadlineStart: $('#lotStart')?.value,
                deadlineEnd
            }
        );

        if (result?.success) {
            closeModal('createLotModal');
            selectedNodes.clear();
            showToast('✅ Лот создан');
            renderProjectDashboard(currentProjectId);
        } else {
            showToast('❌ ' + (result?.errors?.join(', ') || result?.error || 'Ошибка'));
        }
    }

    // ===== MODAL: WBS1000 =====
    function showWBS1000Modal(projectId) {
        createModal('wbs1000Modal', `
            <div class="vip-modal-header">
                <h2 class="vip-modal-title">🏢 WBS-1000</h2>
                <p class="vip-modal-subtitle">Укажите количество секций и этажей</p>
            </div>
            <div class="vip-modal-body">
                <div class="vip-form-row">
                    <div class="vip-form-group">
                        <label class="vip-form-label">Секций</label>
                        <input type="number" class="vip-form-input" id="wbsSections" value="1" min="1" max="20">
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Этажей</label>
                        <input type="number" class="vip-form-input" id="wbsFloors" value="1" min="1" max="50">
                    </div>
                </div>
            </div>
            <div class="vip-modal-footer">
                <button class="vip-btn vip-btn-secondary" onclick="VipUI.closeModal('wbs1000Modal')">Отмена</button>
                <button class="vip-btn vip-btn-primary" onclick="VipUI.generateWBS1000('${projectId}')">Сгенерировать</button>
            </div>
        `);
    }

    function generateWBS1000(projectId) {
        const sections = parseInt($('#wbsSections')?.value) || 1;
        const floors = parseInt($('#wbsFloors')?.value) || 1;
        closeModal('wbs1000Modal');

        const result = window.VipService?.WBS?.generate(projectId, 'WBS1000', { sections, floors });
        if (result?.success) {
            showToast(`✅ WBS-1000 сгенерирован: ${result.count} узлов`);
            renderProjectDashboard(projectId);
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    // ===== MODAL: Edit Project =====
    function showEditProjectModal(projectId) {
        const project = window.VipService?.Project?.get(projectId);
        if (!project) return;

        createModal('editProjectModal', `
            <div class="vip-modal-header">
                <h2 class="vip-modal-title">⚙️ Настройки проекта</h2>
            </div>
            <div class="vip-modal-body">
                <div class="vip-form-group">
                    <label class="vip-form-label">Название <span class="required">*</span></label>
                    <input type="text" class="vip-form-input" id="editProjTitle" value="${escapeHtml(project.title)}">
                </div>
                <div class="vip-form-row">
                    <div class="vip-form-group">
                        <label class="vip-form-label">Город <span class="required">*</span></label>
                        <input type="text" class="vip-form-input" id="editProjCity" value="${escapeHtml(project.city)}">
                    </div>
                    <div class="vip-form-group">
                        <label class="vip-form-label">Адрес</label>
                        <input type="text" class="vip-form-input" id="editProjAddress" value="${escapeHtml(project.address || '')}">
                    </div>
                </div>
            </div>
            <div class="vip-modal-footer">
                <button class="vip-btn vip-btn-danger" onclick="VipUI.deleteProject('${projectId}')">🗑️ Удалить</button>
                <button class="vip-btn vip-btn-secondary" onclick="VipUI.closeModal('editProjectModal')">Отмена</button>
                <button class="vip-btn vip-btn-primary" onclick="VipUI.updateProject('${projectId}')">Сохранить</button>
            </div>
        `);
    }

    function updateProject(projectId) {
        const title = $('#editProjTitle')?.value?.trim();
        const city = $('#editProjCity')?.value?.trim();

        if (!title || !city) {
            showToast('⚠️ Заполните обязательные поля');
            return;
        }

        const result = window.VipService?.Project?.update(projectId, {
            title,
            city,
            address: $('#editProjAddress')?.value?.trim()
        });

        if (result?.success) {
            closeModal('editProjectModal');
            showToast('✅ Проект обновлён');
            renderProjectDashboard(projectId);
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    async function deleteProject(projectId) {
        const ok = await (window.QazUI?.confirm || window.confirm)('Удалить проект?', 'Проект и все связанные данные будут удалены', { icon: '🗑️', danger: true, confirmText: 'Удалить' });
        if (!ok) return;

        const result = window.VipService?.Project?.delete(projectId);
        if (result?.success) {
            closeModal('editProjectModal');
            showToast('✅ Проект удалён');
            backToList();
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    // ===== MODAL: Acceptance =====
    function showAcceptanceModal(lotId) {
        const assignment = window.VipService?.Assignment?.getByLot(lotId);
        if (!assignment) {
            showToast('⚠️ Назначение не найдено');
            return;
        }

        createModal('acceptanceModal', `
            <div class="vip-modal-header" style="background:var(--vip-gradient-success)">
                <h2 class="vip-modal-title">✅ Приёмка работ</h2>
            </div>
            <div class="vip-modal-body">
                <div class="vip-form-group">
                    <label class="vip-form-label">Комментарий</label>
                    <textarea class="vip-form-textarea" id="acceptComment" rows="3" placeholder="Комментарий к приёмке..."></textarea>
                </div>
            </div>
            <div class="vip-modal-footer">
                <button class="vip-btn vip-btn-secondary" onclick="VipUI.closeModal('acceptanceModal')">Отмена</button>
                <button class="vip-btn vip-btn-success" onclick="VipUI.acceptWork('${assignment.id}')">✅ Принять работу</button>
            </div>
        `);
    }

    function acceptWork(assignmentId) {
        const comment = $('#acceptComment')?.value?.trim() || '';
        const result = window.VipService?.Acceptance?.accept(assignmentId, comment);

        if (result?.success) {
            closeModal('acceptanceModal');
            showToast('✅ Работа принята');
            renderProjectDashboard(currentProjectId);
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    // ===== MODAL: Rework =====
    function showReworkModal(lotId) {
        const assignment = window.VipService?.Assignment?.getByLot(lotId);
        if (!assignment) {
            showToast('⚠️ Назначение не найдено');
            return;
        }

        createModal('reworkModal', `
            <div class="vip-modal-header" style="background:linear-gradient(135deg,#ef4444,#dc2626)">
                <h2 class="vip-modal-title">🔄 Отправить на доработку</h2>
            </div>
            <div class="vip-modal-body">
                <div class="vip-form-group">
                    <label class="vip-form-label">Причина доработки <span class="required">*</span></label>
                    <textarea class="vip-form-textarea" id="reworkComment" rows="3" placeholder="Опишите что нужно исправить..."></textarea>
                </div>
            </div>
            <div class="vip-modal-footer">
                <button class="vip-btn vip-btn-secondary" onclick="VipUI.closeModal('reworkModal')">Отмена</button>
                <button class="vip-btn vip-btn-danger" onclick="VipUI.reworkAssignment('${assignment.id}')">🔄 На доработку</button>
            </div>
        `);
    }

    function reworkAssignment(assignmentId) {
        const comment = $('#reworkComment')?.value?.trim();
        if (!comment) {
            showToast('⚠️ Укажите причину доработки');
            return;
        }

        const result = window.VipService?.Acceptance?.rework(assignmentId, comment);
        if (result?.success) {
            closeModal('reworkModal');
            showToast('✅ Отправлено на доработку');
            renderProjectDashboard(currentProjectId);
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    // ===== MODAL: Lot Details =====
    function openLotDetails(lotId) {
        const lot = window.VipModels?.Lot?.find(lotId);
        if (!lot) {
            showToast('⚠️ Лот не найден');
            return;
        }

        const status = LOT_STATUS[lot.status] || LOT_STATUS.DRAFT;
        const nodes = lot.wbsNodeIds?.map(id => window.VipModels?.WBSNode?.find(id)).filter(Boolean) || [];
        const assignment = window.VipService?.Assignment?.getByLot(lotId);
        const bids = window.VipService?.Bid?.getByLot(lotId) || [];

        createModal('lotDetailsModal', `
            <div class="vip-modal-header">
                <div style="display:flex;gap:0.5rem;margin-bottom:0.5rem">
                    <span class="vip-badge vip-badge-${status.class}">${status.label}</span>
                    <span class="vip-badge vip-badge-${lot.type === 'FIX' ? 'fix' : 'tender'}">
                        ${lot.type === 'FIX' ? '💰 Фикс' : '📊 Тендер'}
                    </span>
                </div>
                <h2 class="vip-modal-title">${escapeHtml(lot.title)}</h2>
            </div>
            <div class="vip-modal-body">
                <div class="vip-form-row" style="margin-bottom:1.5rem">
                    <div class="vip-card" style="padding:1rem;text-align:center">
                        <div style="color:var(--text-muted);font-size:0.85rem">Бюджет</div>
                        <div class="vip-lot-price">${formatPrice(lot.budget)} ₸</div>
                    </div>
                    <div class="vip-card" style="padding:1rem;text-align:center">
                        <div style="color:var(--text-muted);font-size:0.85rem">Сроки</div>
                        <div style="font-weight:600">${lot.deadlineStart || 'Сейчас'} — ${lot.deadlineEnd || 'Не указано'}</div>
                    </div>
                </div>

                ${lot.description ? `
                    <div style="margin-bottom:1.5rem">
                        <h4 style="margin:0 0 0.5rem">📝 Описание</h4>
                        <p style="margin:0;color:var(--text-muted)">${escapeHtml(lot.description)}</p>
                    </div>
                ` : ''}

                <div style="margin-bottom:1.5rem">
                    <h4 style="margin:0 0 0.75rem">📋 Работы (${nodes.length})</h4>
                    <div class="vip-card" style="max-height:150px;overflow-y:auto;padding:0.5rem">
                        ${nodes.map(n => `
                            <div style="padding:0.5rem;border-bottom:1px solid var(--vip-glass-border)">
                                <span style="color:var(--vip-primary);font-weight:600">${escapeHtml(n.code)}</span> ${escapeHtml(n.title)}
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${assignment ? `
                    <div style="margin-bottom:1.5rem">
                        <h4 style="margin:0 0 0.75rem">👷 Исполнитель</h4>
                        <div class="vip-executor-card">
                            <div class="vip-executor-avatar">${(assignment.executorName || '?')[0]}</div>
                            <div class="vip-executor-info">
                                <p class="vip-executor-name">${escapeHtml(assignment.executorName || 'Исполнитель')}</p>
                                <p class="vip-executor-progress">Прогресс: ${assignment.progressPercent || 0}%</p>
                            </div>
                        </div>
                    </div>
                ` : ''}

                ${bids.length > 0 && lot.type === 'TENDER' ? `
                    <div class="vip-bids-section">
                        <h4 class="vip-bids-title">📨 Отклики (${bids.length})</h4>
                        <div class="vip-bids-list">
                            ${bids.map(bid => `
                                <div class="vip-bid-item">
                                    <div class="vip-bid-avatar">${(bid.executorName || '?')[0]}</div>
                                    <div class="vip-bid-info">
                                        <div class="vip-bid-name">${escapeHtml(bid.executorName)}</div>
                                        <div class="vip-bid-price">${formatPrice(bid.price)} ₸</div>
                                    </div>
                                    ${bid.status === 'PENDING' && lot.status === 'PUBLISHED' ? `
                                        <div class="vip-bid-actions">
                                            <button class="vip-btn vip-btn-success vip-btn-sm" onclick="VipUI.acceptBid('${bid.id}')">✓</button>
                                            <button class="vip-btn vip-btn-danger vip-btn-sm" onclick="VipUI.rejectBid('${bid.id}')">✕</button>
                                        </div>
                                    ` : `
                                        <span class="vip-badge vip-badge-${bid.status === 'ACCEPTED' ? 'completed' : 'draft'}">
                                            ${bid.status === 'ACCEPTED' ? 'Принят' : bid.status === 'REJECTED' ? 'Отклонён' : bid.status}
                                        </span>
                                    `}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="vip-modal-footer">
                <button class="vip-btn vip-btn-secondary" onclick="VipUI.closeModal('lotDetailsModal')">Закрыть</button>
            </div>
        `, 'vip-modal-lg');
    }

    function acceptBid(bidId) {
        const result = window.VipService?.Bid?.accept(bidId);
        if (result?.success) {
            closeModal('lotDetailsModal');
            showToast('✅ Отклик принят');
            renderProjectDashboard(currentProjectId);
        } else {
            showToast('❌ ' + (result?.error || 'Ошибка'));
        }
    }

    function rejectBid(bidId) {
        const result = window.VipService?.Bid?.reject(bidId, 'Отклонено заказчиком');
        if (result?.success) {
            showToast('✅ Отклик отклонён');
            // Refresh
            const lot = window.VipModels?.Bid?.find(bidId)?.lotId;
            if (lot) openLotDetails(lot);
        }
    }

    // ===== HELPERS =====
    function previewProjectPhoto(input) {
        if (input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = e => {
                const preview = $('#projectPhotoPreview');
                preview.innerHTML = `<img src="${e.target.result}" alt="">`;
                preview.classList.add('has-image');
            };
            reader.readAsDataURL(input.files[0]);
        }
    }

    function selectObjectType(typeId) {
        $$('.vip-type-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.type === typeId);
            el.querySelector('input').checked = el.dataset.type === typeId;
        });
    }

    function createModal(id, content, extraClass = '') {
        closeModal(id);
        const overlay = document.createElement('div');
        overlay.className = 'vip-modal-overlay';
        overlay.id = id;
        overlay.innerHTML = `<div class="vip-modal ${extraClass}">${content}</div>`;
        overlay.onclick = e => { if (e.target === overlay) closeModal(id); };
        document.body.appendChild(overlay);
        return overlay;
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) modal.remove();
    }

    function showToast(message) {
        if (window.showToast) {
            window.showToast(message);
        } else {
            console.log('[VipUI]', message);
        }
    }

    function formatPrice(price) {
        return (price || 0).toLocaleString('ru-RU');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ===== EXPORT =====
    window.VipUI = {
        init,
        renderProjectList,
        showCreateProjectModal,
        createProject,
        openProject,
        backToList,
        switchTab,
        generateWBS,
        showWBS1000Modal,
        generateWBS1000,
        toggleWBSExpand,
        toggleWBSSelect,
        expandAllWBS,
        collapseAllWBS,
        searchWBS,
        clearSelection,
        showCreateLotModal,
        createLot,
        publishLot,
        deleteLot,
        openLotDetails,
        showAcceptanceModal,
        acceptWork,
        showReworkModal,
        reworkAssignment,
        generatePDF,
        showEditProjectModal,
        updateProject,
        deleteProject,
        acceptBid,
        rejectBid,
        previewProjectPhoto,
        selectObjectType,
        closeModal
    };

    console.log('✅ VIP UI v3.0 loaded');
})();
