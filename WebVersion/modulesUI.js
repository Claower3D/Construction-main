// ========== MODULES UI ==========
// UI компоненты для Модуля A (Расчёт объёмов) и Модуля B (Инженерные решения)

(function () {
    'use strict';

    // ========== HELPERS ==========
    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => [...root.querySelectorAll(s)];

    function formatPrice(price) {
        return new Intl.NumberFormat('ru-RU').format(price) + ' ₸';
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ru-RU');
    }

    function showToast(message, type = 'info') {
        if (window.showEnhancedToast) {
            window.showEnhancedToast({ message, type });
        } else if (window.QazUI?.toast) {
            window.QazUI.toast(message, type);
        } else if (window.showToast && window.showToast !== showToast) {
            window.showToast(message);
        }
    }

    // ========== STATE ==========
    let currentEstimate = null;
    let currentVersion = null;
    let currentVersionItems = [];
    let currentEngineeringRequest = null;

    // ========================================
    // MODULE A: ESTIMATE UI
    // ========================================

    // Render estimates list page
    function renderEstimatesList(container) {
        const result = window.EstimateService.API.getList();
        if (!result.success) {
            container.innerHTML = `<div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">Ошибка</div>
                <div class="empty-state-desc">${result.error}</div>
            </div>`;
            return;
        }

        const estimates = result.data;
        const { ObjectTypeLabels, EstimateStatus } = window.EstimateModels;

        container.innerHTML = `
            <div class="module-page">
                <div class="module-header">
                    <h1 class="module-title">
                        <span class="module-title-icon">📊</span>
                        Расчёт объёмов
                    </h1>
                    <div class="module-actions">
                        <button class="btn btn-primary btn-lg" onclick="ModulesUI.openCreateEstimate()">
                            ➕ Новый расчёт
                        </button>
                    </div>
                </div>

                <div class="module-tabs">
                    <button class="module-tab active" data-filter="all">
                        Все <span class="badge">${estimates.length}</span>
                    </button>
                    <button class="module-tab" data-filter="DRAFT">
                        Черновики <span class="badge">${estimates.filter(e => e.status === 'DRAFT').length}</span>
                    </button>
                    <button class="module-tab" data-filter="ARCHIVE">
                        Архив <span class="badge">${estimates.filter(e => e.status === 'ARCHIVE').length}</span>
                    </button>
                </div>

                <div id="estimatesGrid" class="cards-grid">
                    ${estimates.length === 0 ? `
                        <div class="empty-state" style="grid-column: 1/-1;">
                            <div class="empty-state-icon">📋</div>
                            <div class="empty-state-title">Нет расчётов</div>
                            <div class="empty-state-desc">Создайте первый расчёт объёмов</div>
                            <button class="btn btn-primary" onclick="ModulesUI.openCreateEstimate()">
                                ➕ Создать расчёт
                            </button>
                        </div>
                    ` : estimates.map(est => `
                        <div class="estimate-card animate-slide-up" onclick="ModulesUI.openEstimate('${est.id}')">
                            <div class="estimate-card-header">
                                <div>
                                    <div class="estimate-card-title">${est.title}</div>
                                    <div class="estimate-card-type">${ObjectTypeLabels[est.objectInfo?.type] || 'Другое'}</div>
                                </div>
                                <span class="estimate-card-badge ${est.status.toLowerCase()}">
                                    ${est.status === 'DRAFT' ? 'Черновик' : 'Архив'}
                                </span>
                            </div>
                            <div class="estimate-card-info">
                                <div class="estimate-card-info-item">
                                    <span class="estimate-card-info-label">Версия</span>
                                    <span class="estimate-card-info-value">V${est.currentVersionNo || 0}</span>
                                </div>
                                <div class="estimate-card-info-item">
                                    <span class="estimate-card-info-label">Дата</span>
                                    <span class="estimate-card-info-value">${formatDate(est.updatedAt)}</span>
                                </div>
                                ${est.latestVersion ? `
                                    <div class="estimate-card-info-item">
                                        <span class="estimate-card-info-label">Итого</span>
                                        <span class="estimate-card-info-value estimate-card-total">
                                            ${formatPrice(est.latestVersion.total)}
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Tab filtering
        $$('.module-tab', container).forEach(tab => {
            tab.addEventListener('click', () => {
                $$('.module-tab', container).forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const filter = tab.dataset.filter;
                const grid = $('#estimatesGrid', container);
                const filteredEstimates = filter === 'all'
                    ? estimates
                    : estimates.filter(e => e.status === filter);
                // Re-render grid
                if (filteredEstimates.length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state" style="grid-column: 1/-1;">
                            <div class="empty-state-icon">📋</div>
                            <div class="empty-state-title">Нет расчётов</div>
                        </div>
                    `;
                } else {
                    grid.innerHTML = filteredEstimates.map(est => `
                        <div class="estimate-card animate-slide-up" onclick="ModulesUI.openEstimate('${est.id}')">
                            <div class="estimate-card-header">
                                <div>
                                    <div class="estimate-card-title">${est.title}</div>
                                    <div class="estimate-card-type">${ObjectTypeLabels[est.objectInfo?.type] || 'Другое'}</div>
                                </div>
                                <span class="estimate-card-badge ${est.status.toLowerCase()}">
                                    ${est.status === 'DRAFT' ? 'Черновик' : 'Архив'}
                                </span>
                            </div>
                            <div class="estimate-card-info">
                                <div class="estimate-card-info-item">
                                    <span class="estimate-card-info-label">Версия</span>
                                    <span class="estimate-card-info-value">V${est.currentVersionNo || 0}</span>
                                </div>
                                <div class="estimate-card-info-item">
                                    <span class="estimate-card-info-label">Дата</span>
                                    <span class="estimate-card-info-value">${formatDate(est.updatedAt)}</span>
                                </div>
                                ${est.latestVersion ? `
                                    <div class="estimate-card-info-item">
                                        <span class="estimate-card-info-label">Итого</span>
                                        <span class="estimate-card-info-value estimate-card-total">
                                            ${formatPrice(est.latestVersion.total)}
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('');
                }
            });
        });
    }

    // Open create estimate modal
    function openCreateEstimate() {
        const { ObjectType, ObjectTypeLabels } = window.EstimateModels;

        if (window.openModal) {
            window.openModal({
                id: 'createEstimateModal',
                title: '📊 Новый расчёт объёмов',
                content: `
                    <div class="form-group">
                        <label class="form-label">Название / Объект *</label>
                        <input type="text" id="estTitle" class="form-input" placeholder="Например: Фундамент для дома">
                    </div>
                    <div class="object-form-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                        <div class="form-group">
                            <label class="form-label">Тип объекта *</label>
                            <select id="estObjectType" class="form-select">
                                ${Object.entries(ObjectTypeLabels).map(([key, label]) =>
                    `<option value="${key}">${label}</option>`
                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Площадь, м²</label>
                            <input type="number" id="estArea" class="form-input" placeholder="100" min="1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Город</label>
                            <input type="text" id="estCity" class="form-input" placeholder="Алматы">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Адрес</label>
                            <input type="text" id="estAddress" class="form-input" placeholder="ул. Абая, 123">
                        </div>
                    </div>
                    <div class="form-group" style="margin-top: 1rem;">
                        <label class="form-label">Комментарий</label>
                        <textarea id="estComment" class="form-textarea" placeholder="Дополнительная информация..."></textarea>
                    </div>
                `,
                actions: [
                    { label: 'Отмена', type: 'secondary', onClick: () => window.closeModal() },
                    {
                        label: '✨ Создать и рассчитать',
                        type: 'primary',
                        onClick: () => createEstimateAndRecognize()
                    }
                ]
            });
        }
    }

    // Create estimate and run recognition
    function createEstimateAndRecognize() {
        const title = $('#estTitle')?.value?.trim();
        const objectType = $('#estObjectType')?.value;
        const area = parseFloat($('#estArea')?.value) || 10;
        const city = $('#estCity')?.value?.trim() || '';
        const address = $('#estAddress')?.value?.trim() || '';
        const comment = $('#estComment')?.value?.trim() || '';

        if (!title || title.length < 3) {
            showToast('Укажите название (минимум 3 символа)', 'error');
            return;
        }

        // Create estimate
        const createResult = window.EstimateService.API.create({
            title,
            objectInfo: { type: objectType, area, city, address, comment }
        });

        if (!createResult.success) {
            showToast(createResult.error, 'error');
            return;
        }

        const estimate = createResult.data;

        // Run recognition
        const recognizeResult = window.EstimateService.API.recognize(estimate.id);
        if (recognizeResult.success) {
            // Save as version 1
            window.EstimateService.API.saveVersion(estimate.id, {
                items: recognizeResult.data.items,
                notes: 'Автоматический расчёт'
            });
        }

        window.closeModal();
        showToast('✅ Расчёт создан!', 'success');

        // Open estimate
        openEstimate(estimate.id);
    }

    // Open single estimate
    function openEstimate(estimateId) {
        const result = window.EstimateService.API.get(estimateId);
        if (!result.success) {
            showToast(result.error, 'error');
            return;
        }

        currentEstimate = result.data.estimate;
        const versions = result.data.versions;
        currentVersion = versions[0] || null;
        currentVersionItems = currentVersion?.items || [];

        const { ObjectTypeLabels } = window.EstimateModels;

        const container = $('#moduleContent') || document.body;
        container.innerHTML = `
            <div class="module-page">
                <div class="module-header">
                    <h1 class="module-title">
                        <button class="btn btn-secondary" onclick="ModulesUI.showEstimatesList()" style="margin-right: 1rem;">
                            ← Назад
                        </button>
                        ${currentEstimate.title}
                    </h1>
                    <div class="module-actions">
                        <button class="btn btn-ai" onclick="ModulesUI.openAIAnalyzer('${estimateId}')" title="AI-анализ фотографии">
                            🤖 AI Анализ
                        </button>
                        <button class="btn btn-outline-primary" onclick="ModulesUI.recalculateEstimate('${estimateId}')">
                            🔄 Пересчитать
                        </button>
                        <button class="btn btn-primary" onclick="ModulesUI.saveEstimateVersion('${estimateId}')">
                            💾 Сохранить версию
                        </button>
                        <button class="btn btn-success" onclick="ModulesUI.downloadEstimatePDF('${estimateId}')">
                            📄 Скачать PDF
                        </button>
                    </div>
                </div>

                <div class="estimate-detail">
                    <div class="estimate-main">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
                            <h3 style="margin: 0;">📋 Позиции сметы</h3>
                            <div class="version-selector">
                                ${versions.map(v => `
                                    <button class="version-btn ${v.id === currentVersion?.id ? 'active' : ''}"
                                            onclick="ModulesUI.switchVersion('${estimateId}', '${v.id}')">
                                        V${v.versionNo}
                                    </button>
                                `).join('')}
                                ${versions.length === 0 ? '<span style="color: var(--text-muted);">Нет версий</span>' : ''}
                                ${versions.length >= 2 ? `
                                    <button class="diff-compare-btn" onclick="ModulesUI.openDiffViewer('${estimateId}')">
                                        🔀 Сравнить
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div id="estimateTableContainer">
                            ${renderEstimateTable()}
                        </div>

                        <div id="estimateTotals">
                            ${renderEstimateTotals()}
                        </div>
                    </div>

                    <div class="estimate-sidebar">
                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">📍 Информация об объекте</h4>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">
                                <p><strong>Тип:</strong> ${ObjectTypeLabels[currentEstimate.objectInfo?.type] || '-'}</p>
                                <p><strong>Площадь:</strong> ${currentEstimate.objectInfo?.area || '-'} м²</p>
                                <p><strong>Город:</strong> ${currentEstimate.objectInfo?.city || '-'}</p>
                                <p><strong>Адрес:</strong> ${currentEstimate.objectInfo?.address || '-'}</p>
                            </div>
                        </div>

                        <div class="estimate-sidebar-card ai-card">
                            <h4 class="estimate-sidebar-title">🤖 AI-анализ фото</h4>
                            <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0 0 0.75rem 0;">
                                Загрузите фото объекта для автоматического распознавания и расчёта
                            </p>
                            <div id="ai-analyzer-container-${estimateId}" class="ai-analyzer-embed"></div>
                            <button class="btn btn-ai btn-full" onclick="ModulesUI.openAIAnalyzer('${estimateId}')" id="ai-analyze-btn">
                                📸 Анализировать фото
                            </button>
                        </div>

                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">📁 Файлы</h4>
                            <div class="upload-zone-sm" id="estimateUploadZone">
                                <div class="upload-zone-icon">📎</div>
                                <div class="upload-zone-text">Перетащите фото/планы или нажмите</div>
                            </div>
                            <div class="files-list" id="estimateFiles"></div>
                        </div>

                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">🚀 Действия</h4>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <button class="btn btn-primary" onclick="ModulesUI.createOrderFromEstimate('${estimateId}')">
                                    📋 Создать заказ из расчёта
                                </button>
                                <button class="btn btn-secondary" onclick="ModulesUI.archiveEstimate('${estimateId}')">
                                    📥 Отправить в архив
                                </button>
                            </div>
                        </div>

                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">💬 Чат по расчёту</h4>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                                    Общайтесь с инженером по вопросам расчёта
                                </p>
                                <button class="btn btn-outline-primary" onclick="ModulesUI.toggleEstimateChat('${estimateId}')" id="estimateChatToggle">
                                    💬 Открыть чат
                                </button>
                            </div>
                            <div id="estimate-chat-container" style="display:none; margin-top: 0.75rem; border-radius: 8px; overflow: hidden;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Render estimate items table
    function renderEstimateTable() {
        if (!currentVersionItems || currentVersionItems.length === 0) {
            return `
                <div class="empty-state" style="padding: 2rem;">
                    <div class="empty-state-icon">📊</div>
                    <div class="empty-state-title">Нет позиций</div>
                    <div class="empty-state-desc">Нажмите "Пересчитать" для получения данных</div>
                </div>
            `;
        }

        const materials = currentVersionItems.filter(i => i.category === 'material');
        const works = currentVersionItems.filter(i => i.category === 'work');

        return `
            <table class="estimate-table">
                <thead>
                    <tr>
                        <th>Наименование</th>
                        <th>Ед.</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                        <th>Ист.</th>
                    </tr>
                </thead>
                <tbody>
                    ${materials.length > 0 ? `
                        <tr class="category-row">
                            <td colspan="6">📦 МАТЕРИАЛЫ</td>
                        </tr>
                        ${materials.map(item => renderEstimateRow(item)).join('')}
                    ` : ''}
                    ${works.length > 0 ? `
                        <tr class="category-row">
                            <td colspan="6">🔧 РАБОТЫ</td>
                        </tr>
                        ${works.map(item => renderEstimateRow(item)).join('')}
                    ` : ''}
                </tbody>
            </table>
        `;
    }

    function renderEstimateRow(item) {
        return `
            <tr data-item-id="${item.id}">
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td class="editable-cell" onclick="ModulesUI.editItemCell(this, '${item.id}', 'qty')">
                    ${item.qty}
                </td>
                <td class="editable-cell" onclick="ModulesUI.editItemCell(this, '${item.id}', 'unitPrice')">
                    ${formatPrice(item.unitPrice).replace(' ₸', '')}
                </td>
                <td><strong>${formatPrice(item.sum)}</strong></td>
                <td>
                    <span class="source-badge ${item.source}">${item.source === 'ai' ? 'AI' : 'Р'}</span>
                </td>
            </tr>
        `;
    }

    function renderEstimateTotals() {
        if (!currentVersion) return '';

        const totals = currentVersion.totals || { materials: 0, works: 0, total: 0 };

        return `
            <div class="estimate-totals">
                <div class="estimate-total-item">
                    <div class="estimate-total-label">📦 Материалы</div>
                    <div class="estimate-total-value">${formatPrice(totals.materials)}</div>
                </div>
                <div class="estimate-total-item">
                    <div class="estimate-total-label">🔧 Работы</div>
                    <div class="estimate-total-value">${formatPrice(totals.works)}</div>
                </div>
                <div class="estimate-total-item">
                    <div class="estimate-total-label">💰 ИТОГО</div>
                    <div class="estimate-total-value grand">${formatPrice(totals.total)}</div>
                </div>
            </div>
        `;
    }

    // Edit cell inline
    function editItemCell(cell, itemId, field) {
        const item = currentVersionItems.find(i => i.id === itemId);
        if (!item) return;

        const currentValue = item[field];
        const input = document.createElement('input');
        input.type = 'number';
        input.value = currentValue;
        input.className = 'form-input';
        input.style.cssText = 'width: 80px; padding: 0.25rem;';

        input.onblur = () => {
            const newValue = parseFloat(input.value) || 0;
            item[field] = newValue;
            item.sum = item.qty * item.unitPrice;
            item.source = 'manual'; // Mark as manually edited
            recalculateVersionTotals();
            refreshEstimateUI();
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') input.blur();
            if (e.key === 'Escape') {
                input.value = currentValue;
                input.blur();
            }
        };

        cell.innerHTML = '';
        cell.appendChild(input);
        input.focus();
        input.select();
    }

    function recalculateVersionTotals() {
        if (!currentVersion) return;

        let materials = 0;
        let works = 0;

        currentVersionItems.forEach(item => {
            if (item.category === 'material') {
                materials += item.sum;
            } else {
                works += item.sum;
            }
        });

        currentVersion.items = currentVersionItems;
        currentVersion.totals = { materials, works, total: materials + works };
    }

    function refreshEstimateUI() {
        const tableContainer = $('#estimateTableContainer');
        const totalsContainer = $('#estimateTotals');
        if (tableContainer) tableContainer.innerHTML = renderEstimateTable();
        if (totalsContainer) totalsContainer.innerHTML = renderEstimateTotals();
    }

    // Save version
    function saveEstimateVersion(estimateId) {
        if (!currentVersionItems || currentVersionItems.length === 0) {
            showToast('Нет данных для сохранения', 'error');
            return;
        }

        const result = window.EstimateService.API.saveVersion(estimateId, {
            items: currentVersionItems
        });

        if (result.success) {
            showToast('✅ Версия сохранена!', 'success');
            openEstimate(estimateId); // Refresh
        } else {
            showToast(result.error, 'error');
        }
    }

    // Recalculate
    function recalculateEstimate(estimateId) {
        const result = window.EstimateService.API.recognize(estimateId);
        if (result.success) {
            currentVersionItems = result.data.items;
            if (currentVersion) {
                currentVersion.items = currentVersionItems;
                currentVersion.totals = result.data.totals;
            }
            refreshEstimateUI();
            showToast('🔄 Расчёт обновлён!', 'success');
        } else {
            showToast(result.error, 'error');
        }
    }

    // Download PDF
    function downloadEstimatePDF(estimateId) {
        const result = window.EstimateService.PDF.generate(estimateId, currentVersion?.versionNo);
        if (result.success) {
            showToast('📄 PDF скачан!', 'success');
        } else {
            showToast(result.error, 'error');
        }
    }

    // Switch version
    function switchVersion(estimateId, versionId) {
        const result = window.EstimateService.API.getVersion(estimateId, versionId);
        if (result.success) {
            currentVersion = result.data;
            currentVersionItems = currentVersion.items || [];
            refreshEstimateUI();
            // Update version buttons
            $$('.version-btn').forEach(btn => {
                btn.classList.toggle('active', btn.textContent.includes(`V${currentVersion.versionNo}`));
            });
        }
    }

    // Create order from estimate
    function createOrderFromEstimate(estimateId) {
        const result = window.EstimateService.API.createOrderFromEstimate(estimateId, currentVersion?.versionNo);
        if (result.success) {
            showToast('✅ Заказ создан! Перейдите в "Мои заказы"', 'success');
        } else {
            showToast(result.error, 'error');
        }
    }

    // Archive estimate
    async function archiveEstimate(estimateId) {
        const ok = await (window.QazUI?.confirm || window.confirm)('Архивировать расчёт?', 'Смета будет перемещена в архив', { icon: '📥', confirmText: 'В архив' });
        if (ok) {
            const result = window.EstimateService.API.archive(estimateId);
            if (result.success) {
                showToast('📥 Отправлено в архив', 'success');
                showEstimatesList();
            } else {
                showToast(result.error, 'error');
            }
        }
    }

    // ========================================
    // DIFF VIEWER: Сравнение версий смет
    // ========================================

    let diffFilter = 'all'; // all | added | removed | changed

    function openDiffViewer(estimateId) {
        const result = window.EstimateService.API.get(estimateId);
        if (!result.success) {
            showToast(result.error, 'error');
            return;
        }

        const est = result.data.estimate || result.data;
        const versions = result.data.versions || est.versions || [];

        if (versions.length < 2) {
            showToast('Нужно минимум 2 версии для сравнения', 'info');
            return;
        }

        // Default: compare latest two versions
        const oldIdx = versions.length >= 2 ? versions.length - 2 : 0;
        const newIdx = versions.length - 1;

        diffFilter = 'all';
        renderDiffModal(estimateId, versions, oldIdx, newIdx);
    }

    function renderDiffModal(estimateId, versions, oldIdx, newIdx) {
        const oldVer = versions[oldIdx];
        const newVer = versions[newIdx];

        if (!oldVer || !newVer) return;

        const diff = computeDiff(oldVer, newVer);

        // Remove existing overlay
        const existing = document.getElementById('diffOverlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'diffOverlay';
        overlay.className = 'diff-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) closeDiffViewer(); };

        const versionOptions = versions.map((v, i) =>
            `<option value="${i}" ${i === oldIdx ? 'selected' : ''}>V${v.versionNumber || v.versionNo || (i + 1)} — ${formatDate(v.savedAt || v.createdAt)}</option>`
        ).join('');

        const versionOptionsNew = versions.map((v, i) =>
            `<option value="${i}" ${i === newIdx ? 'selected' : ''}>V${v.versionNumber || v.versionNo || (i + 1)} — ${formatDate(v.savedAt || v.createdAt)}</option>`
        ).join('');

        const formatP = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₸';

        // Compute totals
        const oldTotal = computeVersionTotal(oldVer);
        const newTotal = computeVersionTotal(newVer);
        const deltaTotalVal = newTotal.total - oldTotal.total;
        const deltaMat = newTotal.materials - oldTotal.materials;
        const deltaWork = newTotal.works - oldTotal.works;

        const fmtDelta = (v) => v === 0 ? '—' : (v > 0 ? '+' + formatP(v) : formatP(v));
        const deltaClass = (v) => v > 0 ? 'up' : v < 0 ? 'down' : 'same';

        overlay.innerHTML = `
            <div class="diff-modal">
                <div class="diff-modal-header">
                    <div class="diff-modal-title">
                        🔀 Сравнение версий сметы
                    </div>
                    <button class="diff-modal-close" onclick="ModulesUI.closeDiffViewer()" title="Закрыть">✕</button>
                </div>

                <div class="diff-version-selectors">
                    <div class="diff-version-group">
                        <span class="diff-version-label old">Было</span>
                        <select class="diff-version-select" id="diffOldVersion" onchange="ModulesUI._onDiffVersionChange('${estimateId}')">
                            ${versionOptions}
                        </select>
                    </div>
                    <span class="diff-arrow">→</span>
                    <div class="diff-version-group">
                        <span class="diff-version-label new">Стало</span>
                        <select class="diff-version-select" id="diffNewVersion" onchange="ModulesUI._onDiffVersionChange('${estimateId}')">
                            ${versionOptionsNew}
                        </select>
                    </div>
                </div>

                <div class="diff-summary">
                    <div class="diff-summary-card added">
                        <div class="diff-summary-number">+${diff.added.length}</div>
                        <div class="diff-summary-label">Добавлено</div>
                    </div>
                    <div class="diff-summary-card removed">
                        <div class="diff-summary-number">-${diff.removed.length}</div>
                        <div class="diff-summary-label">Удалено</div>
                    </div>
                    <div class="diff-summary-card changed">
                        <div class="diff-summary-number">${diff.changed.length}</div>
                        <div class="diff-summary-label">Изменено</div>
                    </div>
                    <div class="diff-summary-card delta">
                        <div class="diff-summary-number">${fmtDelta(deltaTotalVal)}</div>
                        <div class="diff-summary-label">Разница</div>
                    </div>
                </div>

                <div class="diff-filters">
                    <button class="diff-filter-btn ${diffFilter === 'all' ? 'active' : ''}" onclick="ModulesUI._setDiffFilter('${estimateId}', 'all')">Все</button>
                    <button class="diff-filter-btn ${diffFilter === 'changed' ? 'active' : ''}" onclick="ModulesUI._setDiffFilter('${estimateId}', 'changed')">🔄 Изменённые</button>
                    <button class="diff-filter-btn ${diffFilter === 'added' ? 'active' : ''}" onclick="ModulesUI._setDiffFilter('${estimateId}', 'added')">➕ Новые</button>
                    <button class="diff-filter-btn ${diffFilter === 'removed' ? 'active' : ''}" onclick="ModulesUI._setDiffFilter('${estimateId}', 'removed')">➖ Удалённые</button>
                </div>

                <div class="diff-modal-body">
                    ${renderDiffTable(diff)}
                </div>

                <div class="diff-modal-footer">
                    <div class="diff-footer-item">
                        <div class="diff-footer-label">📦 Материалы</div>
                        <div class="diff-footer-values">
                            <span class="diff-footer-old">${formatP(oldTotal.materials)}</span>
                            <span class="diff-footer-arrow">→</span>
                            <span class="diff-footer-new">${formatP(newTotal.materials)}</span>
                        </div>
                        <span class="diff-footer-delta ${deltaClass(deltaMat)}">${fmtDelta(deltaMat)}</span>
                    </div>
                    <div class="diff-footer-item">
                        <div class="diff-footer-label">🔧 Работы</div>
                        <div class="diff-footer-values">
                            <span class="diff-footer-old">${formatP(oldTotal.works)}</span>
                            <span class="diff-footer-arrow">→</span>
                            <span class="diff-footer-new">${formatP(newTotal.works)}</span>
                        </div>
                        <span class="diff-footer-delta ${deltaClass(deltaWork)}">${fmtDelta(deltaWork)}</span>
                    </div>
                    <div class="diff-footer-item">
                        <div class="diff-footer-label">💰 Итого</div>
                        <div class="diff-footer-values">
                            <span class="diff-footer-old">${formatP(oldTotal.total)}</span>
                            <span class="diff-footer-arrow">→</span>
                            <span class="diff-footer-new">${formatP(newTotal.total)}</span>
                        </div>
                        <span class="diff-footer-delta ${deltaClass(deltaTotalVal)}">${fmtDelta(deltaTotalVal)}</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // ESC to close
        const escHandler = (e) => {
            if (e.key === 'Escape') { closeDiffViewer(); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
    }

    function computeVersionTotal(version) {
        const items = version.items || [];
        let materials = 0, works = 0;
        items.forEach(item => {
            const sum = (item.sum != null) ? item.sum : ((item.qty || 0) * (item.unitPrice || item.price || 0));
            if (item.category === 'material') materials += sum;
            else works += sum;
        });
        // If version has totals object, use it
        if (version.totals) {
            return {
                materials: version.totals.materials || materials,
                works: version.totals.works || works,
                total: version.totals.total || (materials + works)
            };
        }
        if (version.total != null) {
            return { materials, works, total: version.total };
        }
        return { materials, works, total: materials + works };
    }

    /**
     * Compute diff between two versions
     * Returns { added: [], removed: [], changed: [], unchanged: [] }
     */
    function computeDiff(oldVer, newVer) {
        const oldItems = (oldVer.items || []);
        const newItems = (newVer.items || []);

        // Build maps by name (primary key for matching)
        const oldMap = new Map();
        oldItems.forEach(item => {
            const key = (item.name || '').trim().toLowerCase();
            oldMap.set(key, item);
        });

        const newMap = new Map();
        newItems.forEach(item => {
            const key = (item.name || '').trim().toLowerCase();
            newMap.set(key, item);
        });

        const added = [];
        const removed = [];
        const changed = [];
        const unchanged = [];

        const getSum = (item) => {
            if (item.sum != null) return item.sum;
            if (item.totalPrice != null) return item.totalPrice;
            return (item.qty || 0) * (item.unitPrice || item.price || 0);
        };

        const getQty = (item) => item.qty || item.quantity || 0;
        const getPrice = (item) => item.unitPrice || item.price || 0;

        // Check new items
        for (const [key, newItem] of newMap) {
            if (oldMap.has(key)) {
                const oldItem = oldMap.get(key);
                const oldQty = getQty(oldItem);
                const newQty = getQty(newItem);
                const oldPrice = getPrice(oldItem);
                const newPrice = getPrice(newItem);
                const oldSum = getSum(oldItem);
                const newSum = getSum(newItem);

                // Check if anything changed (with tolerance for floating point)
                const qtyChanged = Math.abs(oldQty - newQty) > 0.001;
                const priceChanged = Math.abs(oldPrice - newPrice) > 0.01;

                if (qtyChanged || priceChanged) {
                    changed.push({
                        name: newItem.name,
                        unit: newItem.unit || oldItem.unit || '',
                        category: newItem.category || oldItem.category || 'material',
                        oldQty, newQty,
                        oldPrice, newPrice,
                        oldSum, newSum,
                        qtyChanged, priceChanged,
                        type: 'changed'
                    });
                } else {
                    unchanged.push({
                        name: newItem.name,
                        unit: newItem.unit || '',
                        category: newItem.category || 'material',
                        oldQty, newQty: oldQty,
                        oldPrice, newPrice: oldPrice,
                        oldSum, newSum: oldSum,
                        type: 'unchanged'
                    });
                }
            } else {
                // New item
                added.push({
                    name: newItem.name,
                    unit: newItem.unit || '',
                    category: newItem.category || 'material',
                    oldQty: 0, newQty: getQty(newItem),
                    oldPrice: 0, newPrice: getPrice(newItem),
                    oldSum: 0, newSum: getSum(newItem),
                    type: 'added'
                });
            }
        }

        // Check removed items
        for (const [key, oldItem] of oldMap) {
            if (!newMap.has(key)) {
                removed.push({
                    name: oldItem.name,
                    unit: oldItem.unit || '',
                    category: oldItem.category || 'material',
                    oldQty: getQty(oldItem), newQty: 0,
                    oldPrice: getPrice(oldItem), newPrice: 0,
                    oldSum: getSum(oldItem), newSum: 0,
                    type: 'removed'
                });
            }
        }

        return { added, removed, changed, unchanged };
    }

    function renderDiffTable(diff) {
        // Apply filter
        let allRows = [];

        if (diffFilter === 'all') {
            allRows = [...diff.changed, ...diff.added, ...diff.removed, ...diff.unchanged];
        } else if (diffFilter === 'changed') {
            allRows = diff.changed;
        } else if (diffFilter === 'added') {
            allRows = diff.added;
        } else if (diffFilter === 'removed') {
            allRows = diff.removed;
        }

        if (allRows.length === 0) {
            return `
                <div class="diff-empty-state">
                    <div class="diff-empty-icon">🔍</div>
                    <div class="diff-empty-title">${diffFilter === 'all' ? 'Нет изменений' : 'Нет записей'}</div>
                    <div class="diff-empty-desc">${diffFilter === 'all' ? 'Версии идентичны' : 'Нет элементов для выбранного фильтра'}</div>
                </div>
            `;
        }

        // Group by category
        const materials = allRows.filter(r => r.category === 'material');
        const works = allRows.filter(r => r.category !== 'material');

        const formatP = (n) => new Intl.NumberFormat('ru-RU').format(Math.round(n));

        return `
            <table class="diff-table">
                <thead>
                    <tr>
                        <th style="width:30px;"></th>
                        <th>Наименование</th>
                        <th>Ед.</th>
                        <th>Кол-во</th>
                        <th>Цена</th>
                        <th>Сумма</th>
                        <th style="width:80px;">Статус</th>
                    </tr>
                </thead>
                <tbody>
                    ${materials.length > 0 ? `
                        <tr class="diff-category-row"><td colspan="7">📦 Материалы</td></tr>
                        ${materials.map(r => renderDiffRow(r, formatP)).join('')}
                    ` : ''}
                    ${works.length > 0 ? `
                        <tr class="diff-category-row"><td colspan="7">🔧 Работы</td></tr>
                        ${works.map(r => renderDiffRow(r, formatP)).join('')}
                    ` : ''}
                    ${materials.length === 0 && works.length === 0 ? `
                        <tr class="diff-category-row"><td colspan="7">📋 Позиции</td></tr>
                        ${allRows.map(r => renderDiffRow(r, formatP)).join('')}
                    ` : ''}
                </tbody>
            </table>
        `;
    }

    function renderDiffRow(row, formatP) {
        const icon = row.type === 'added' ? '➕'
            : row.type === 'removed' ? '➖'
                : row.type === 'changed' ? '🔄' : '—';

        const badgeLabel = row.type === 'added' ? 'НОВОЕ'
            : row.type === 'removed' ? 'УДАЛЕНО'
                : row.type === 'changed' ? 'ИЗМЕНЕНО' : '—';

        // Format qty cell
        let qtyCell = `${row.newQty}`;
        if (row.type === 'changed' && row.qtyChanged) {
            const delta = row.newQty - row.oldQty;
            const sign = delta > 0 ? '+' : '';
            qtyCell = `
                <div class="diff-value-change">
                    <span class="diff-old-value">${row.oldQty}</span>
                    <span class="diff-new-value">${row.newQty}</span>
                    <span class="diff-delta ${delta > 0 ? 'positive' : 'negative'}">${sign}${delta.toFixed(2)}</span>
                </div>
            `;
        } else if (row.type === 'removed') {
            qtyCell = `${row.oldQty}`;
        }

        // Format price cell
        let priceCell = `${formatP(row.newPrice)}`;
        if (row.type === 'changed' && row.priceChanged) {
            const delta = row.newPrice - row.oldPrice;
            const sign = delta > 0 ? '+' : '';
            priceCell = `
                <div class="diff-value-change">
                    <span class="diff-old-value">${formatP(row.oldPrice)}</span>
                    <span class="diff-new-value">${formatP(row.newPrice)}</span>
                    <span class="diff-delta ${delta > 0 ? 'positive' : 'negative'}">${sign}${formatP(delta)}</span>
                </div>
            `;
        } else if (row.type === 'removed') {
            priceCell = `${formatP(row.oldPrice)}`;
        }

        // Format sum cell
        let sumCell = `<strong>${formatP(row.newSum)} ₸</strong>`;
        if (row.type === 'changed' && (row.qtyChanged || row.priceChanged)) {
            const delta = row.newSum - row.oldSum;
            const sign = delta > 0 ? '+' : '';
            sumCell = `
                <div class="diff-value-change">
                    <span class="diff-old-value">${formatP(row.oldSum)} ₸</span>
                    <strong class="diff-new-value">${formatP(row.newSum)} ₸</strong>
                    <span class="diff-delta ${delta > 0 ? 'positive' : 'negative'}">${sign}${formatP(delta)} ₸</span>
                </div>
            `;
        } else if (row.type === 'removed') {
            sumCell = `<strong>${formatP(row.oldSum)} ₸</strong>`;
        }

        return `
            <tr class="diff-${row.type}">
                <td>${icon}</td>
                <td>${row.name}</td>
                <td>${row.unit}</td>
                <td>${qtyCell}</td>
                <td>${priceCell}</td>
                <td>${sumCell}</td>
                <td><span class="diff-type-badge ${row.type}">${badgeLabel}</span></td>
            </tr>
        `;
    }

    function _onDiffVersionChange(estimateId) {
        const result = window.EstimateService.API.get(estimateId);
        if (!result.success) return;

        const est = result.data.estimate || result.data;
        const versions = result.data.versions || est.versions || [];
        const oldIdx = parseInt(document.getElementById('diffOldVersion')?.value || '0');
        const newIdx = parseInt(document.getElementById('diffNewVersion')?.value || '1');

        renderDiffModal(estimateId, versions, oldIdx, newIdx);
    }

    function _setDiffFilter(estimateId, filter) {
        diffFilter = filter;
        _onDiffVersionChange(estimateId);
    }

    function closeDiffViewer() {
        const overlay = document.getElementById('diffOverlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 200);
        }
    }

    // ========================================
    // MODULE B: ENGINEERING UI
    // ========================================

    // Render engineering solutions catalog
    function renderEngineeringCatalog(container) {
        const categoriesResult = window.EngineeringService.Solutions.getByCategory();
        if (!categoriesResult.success) {
            container.innerHTML = `<div class="empty-state">Ошибка загрузки каталога</div>`;
            return;
        }

        const byCategory = categoriesResult.data;
        const { SolutionCategoryLabels } = window.EngineeringModels;

        // Get or create current request
        let requestData = sessionStorage.getItem('currentEngineeringRequest');
        if (requestData) {
            currentEngineeringRequest = JSON.parse(requestData);
        }

        const selectedIds = currentEngineeringRequest?.selectedSolutionIds || [];

        container.innerHTML = `
            <div class="module-page">
                <div class="module-header">
                    <h1 class="module-title">
                        <span class="module-title-icon">🏗️</span>
                        Инженерные решения
                    </h1>
                    <div class="module-actions">
                        <button class="btn btn-secondary" onclick="ModulesUI.showEngineeringRequests()">
                            📋 Мои заявки
                        </button>
                    </div>
                </div>

                <div class="package-builder">
                    <div class="package-main">
                        <!-- Object form -->
                        <div class="object-form">
                            <h3 class="object-form-title">📍 Информация об объекте</h3>
                            <div class="object-form-grid">
                                <div class="form-group">
                                    <label class="form-label">Название объекта *</label>
                                    <input type="text" id="engObjectName" class="form-input" 
                                           placeholder="Жилой дом" value="${currentEngineeringRequest?.objectInfo?.name || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Площадь, м²</label>
                                    <input type="number" id="engObjectArea" class="form-input" 
                                           placeholder="250" value="${currentEngineeringRequest?.objectInfo?.area || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Этажность</label>
                                    <input type="number" id="engObjectFloors" class="form-input" 
                                           placeholder="2" value="${currentEngineeringRequest?.objectInfo?.floors || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Город *</label>
                                    <input type="text" id="engObjectCity" class="form-input" 
                                           placeholder="Алматы" value="${currentEngineeringRequest?.objectInfo?.city || ''}">
                                </div>
                                <div class="form-group">
                                    <label class="form-label">Срочность</label>
                                    <select id="engUrgency" class="form-select">
                                        <option value="normal" ${currentEngineeringRequest?.urgency === 'normal' ? 'selected' : ''}>Обычный</option>
                                        <option value="urgent" ${currentEngineeringRequest?.urgency === 'urgent' ? 'selected' : ''}>Срочный (+20%)</option>
                                        <option value="vip" ${currentEngineeringRequest?.urgency === 'vip' ? 'selected' : ''}>VIP (+50%)</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label class="form-label">&nbsp;</label>
                                    <label class="form-checkbox-group">
                                        <input type="checkbox" id="engHasDrawings" class="form-checkbox"
                                               ${currentEngineeringRequest?.objectInfo?.hasDrawings ? 'checked' : ''}>
                                        <span>Есть чертежи/планы</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Solutions catalog -->
                        <div class="solutions-catalog">
                            ${Object.entries(byCategory).filter(([_, solutions]) => solutions.length > 0).map(([category, solutions]) => `
                                <div class="solutions-category">
                                    <h3 class="solutions-category-title">
                                        ${getCategoryIcon(category)} ${SolutionCategoryLabels[category] || category}
                                    </h3>
                                    <div class="solutions-grid">
                                        ${solutions.map(sol => `
                                            <div class="solution-card ${selectedIds.includes(sol.id) ? 'selected' : ''}" 
                                                 data-solution-id="${sol.id}">
                                                <div class="solution-card-image">${getSolutionIcon(sol.category)}</div>
                                                <div class="solution-card-body">
                                                    <div class="solution-card-title">${sol.title}</div>
                                                    <div class="solution-card-desc">${sol.shortDesc}</div>
                                                    <div class="solution-card-meta">
                                                        <span class="solution-card-price">от ${formatPrice(sol.basePrice)}</span>
                                                        <span class="solution-card-duration">${sol.baseDurationDays} дней</span>
                                                    </div>
                                                    <div class="solution-card-actions">
                                                        <button class="solution-card-btn secondary" 
                                                                onclick="ModulesUI.showSolutionDetails('${sol.id}')">
                                                            Подробнее
                                                        </button>
                                                        <button class="solution-card-btn ${selectedIds.includes(sol.id) ? 'added' : 'primary'}" 
                                                                onclick="ModulesUI.toggleSolution('${sol.id}')">
                                                            ${selectedIds.includes(sol.id) ? '✓ Добавлено' : '+ Добавить'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        `).join('')}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Sidebar: Summary -->
                    <div class="package-sidebar">
                        <div class="package-summary" id="packageSummary">
                            ${renderPackageSummary()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Bind object form changes
        ['engObjectName', 'engObjectArea', 'engObjectFloors', 'engObjectCity', 'engUrgency', 'engHasDrawings'].forEach(id => {
            const el = $(`#${id}`);
            if (el) {
                el.addEventListener('change', updateEngineeringObjectInfo);
            }
        });
    }

    function getCategoryIcon(category) {
        const icons = {
            design: '📐',
            survey: '🔍',
            supervision: '👷',
            docs: '📄',
            safety: '🔥',
            energy: '⚡'
        };
        return icons[category] || '📋';
    }

    function getSolutionIcon(category) {
        const icons = {
            design: '📐',
            survey: '🔍',
            supervision: '👷',
            docs: '📄',
            safety: '🔥',
            energy: '⚡'
        };
        return icons[category] || '📋';
    }

    function updateEngineeringObjectInfo() {
        if (!currentEngineeringRequest) {
            currentEngineeringRequest = {
                objectInfo: {},
                selectedSolutionIds: [],
                urgency: 'normal'
            };
        }

        currentEngineeringRequest.objectInfo = {
            name: $('#engObjectName')?.value || '',
            area: parseFloat($('#engObjectArea')?.value) || null,
            floors: parseInt($('#engObjectFloors')?.value) || 1,
            city: $('#engObjectCity')?.value || '',
            hasDrawings: $('#engHasDrawings')?.checked || false
        };
        currentEngineeringRequest.urgency = $('#engUrgency')?.value || 'normal';

        sessionStorage.setItem('currentEngineeringRequest', JSON.stringify(currentEngineeringRequest));
        updatePackageSummary();
    }

    function toggleSolution(solutionId) {
        if (!currentEngineeringRequest) {
            currentEngineeringRequest = {
                objectInfo: {},
                selectedSolutionIds: [],
                urgency: 'normal'
            };
        }

        const idx = currentEngineeringRequest.selectedSolutionIds.indexOf(solutionId);
        if (idx > -1) {
            currentEngineeringRequest.selectedSolutionIds.splice(idx, 1);
        } else {
            currentEngineeringRequest.selectedSolutionIds.push(solutionId);
        }

        sessionStorage.setItem('currentEngineeringRequest', JSON.stringify(currentEngineeringRequest));

        // Update card state
        const card = $(`.solution-card[data-solution-id="${solutionId}"]`);
        if (card) {
            card.classList.toggle('selected', idx === -1);
            const btn = card.querySelector('.solution-card-btn.primary, .solution-card-btn.added');
            if (btn) {
                btn.textContent = idx === -1 ? '✓ Добавлено' : '+ Добавить';
                btn.classList.toggle('primary', idx > -1);
                btn.classList.toggle('added', idx === -1);
            }
        }

        updatePackageSummary();
    }

    function renderPackageSummary() {
        const selectedIds = currentEngineeringRequest?.selectedSolutionIds || [];

        if (selectedIds.length === 0) {
            return `
                <h3 class="package-summary-title">📦 Ваш пакет</h3>
                <div class="empty-state" style="padding: 2rem 1rem;">
                    <div class="empty-state-icon">🛒</div>
                    <div class="empty-state-desc">Выберите решения из каталога</div>
                </div>
            `;
        }

        let totalPrice = 0;
        let totalDays = 0;

        const solutions = selectedIds.map(id => {
            const sol = window.EngineeringModels.EngineeringSolution.find(id);
            if (sol) {
                // Simple price calculation (can be improved)
                let price = sol.basePrice;
                let days = sol.baseDurationDays;

                const area = currentEngineeringRequest?.objectInfo?.area || 100;
                if (area > 200) { price *= 1.2; days = Math.ceil(days * 1.1); }
                if (area > 500) { price *= 1.3; days = Math.ceil(days * 1.2); }

                if (currentEngineeringRequest?.urgency === 'urgent') { price *= 1.2; days = Math.ceil(days * 0.85); }
                if (currentEngineeringRequest?.urgency === 'vip') { price *= 1.5; days = Math.ceil(days * 0.7); }

                totalPrice += price;
                totalDays += days;

                return { ...sol, calculatedPrice: Math.round(price), calculatedDays: days };
            }
            return null;
        }).filter(Boolean);

        return `
            <h3 class="package-summary-title">📦 Ваш пакет (${selectedIds.length})</h3>
            <div class="package-summary-list">
                ${solutions.map(sol => `
                    <div class="package-summary-item">
                        <span class="icon">✓</span>
                        <span>${sol.title}</span>
                    </div>
                `).join('')}
            </div>
            <div class="package-summary-totals">
                <div class="package-summary-row">
                    <span>Ориент. срок:</span>
                    <span>~${totalDays} дней</span>
                </div>
                <div class="package-summary-row total">
                    <span>Итого:</span>
                    <span class="value">${formatPrice(Math.round(totalPrice))}</span>
                </div>
            </div>
            <div class="package-summary-actions">
                <button class="btn btn-primary btn-lg" onclick="ModulesUI.createEngineeringRequest()">
                    📋 Сформировать заявку
                </button>
                <button class="btn btn-outline-primary" onclick="ModulesUI.generateStagesPreview()">
                    📅 Просмотр этапов
                </button>
            </div>
        `;
    }

    function updatePackageSummary() {
        const summary = $('#packageSummary');
        if (summary) {
            summary.innerHTML = renderPackageSummary();
        }
    }

    function createEngineeringRequest() {
        updateEngineeringObjectInfo();

        if (!currentEngineeringRequest?.objectInfo?.name) {
            showToast('Укажите название объекта', 'error');
            return;
        }
        if (!currentEngineeringRequest?.objectInfo?.city) {
            showToast('Укажите город', 'error');
            return;
        }
        if (!currentEngineeringRequest?.selectedSolutionIds?.length) {
            showToast('Выберите хотя бы одно решение', 'error');
            return;
        }

        // Create request
        const createResult = window.EngineeringService.Request.create({
            objectInfo: currentEngineeringRequest.objectInfo,
            urgency: currentEngineeringRequest.urgency
        });

        if (!createResult.success) {
            showToast(createResult.error, 'error');
            return;
        }

        const request = createResult.data;

        // Add solutions
        currentEngineeringRequest.selectedSolutionIds.forEach(solutionId => {
            window.EngineeringService.Request.addSolution(request.id, solutionId, 'standard');
        });

        // Generate stages
        window.EngineeringService.Request.generateStages(request.id);

        // Clear session
        sessionStorage.removeItem('currentEngineeringRequest');
        currentEngineeringRequest = null;

        showToast('✅ Заявка создана!', 'success');
        openEngineeringRequest(request.id);
    }

    function openEngineeringRequest(requestId) {
        const result = window.EngineeringService.Request.get(requestId);
        if (!result.success) {
            showToast(result.error, 'error');
            return;
        }

        const { request, selectedSolutions, stages, statusLabel } = result.data;
        const { UrgencyLabels, StageStatusLabels } = window.EngineeringModels;

        const container = $('#moduleContent') || document.body;
        container.innerHTML = `
            <div class="module-page">
                <div class="module-header">
                    <h1 class="module-title">
                        <button class="btn btn-secondary" onclick="ModulesUI.showEngineeringCatalog()" style="margin-right: 1rem;">
                            ← Назад
                        </button>
                        ${request.objectInfo.name || 'Заявка'}
                        <span class="stage-status ${request.status.toLowerCase()}" style="margin-left: 1rem;">
                            ${statusLabel?.icon} ${statusLabel?.label}
                        </span>
                    </h1>
                    <div class="module-actions">
                        <button class="btn btn-primary" onclick="ModulesUI.downloadEngineeringBriefPDF('${requestId}')">
                            📄 Скачать ТЗ
                        </button>
                        <button class="btn btn-success" onclick="ModulesUI.downloadEngineeringStagesPDF('${requestId}')">
                            📅 Скачать этапы
                        </button>
                    </div>
                </div>

                <div class="estimate-detail">
                    <div class="estimate-main">
                        <!-- Selected Solutions -->
                        <div class="selected-solutions">
                            <h3 class="selected-solutions-title">
                                🏗️ Выбранные решения
                                <span class="selected-solutions-count">${selectedSolutions.length}</span>
                            </h3>
                            ${selectedSolutions.map(sel => `
                                <div class="selected-solution-item">
                                    <div class="selected-solution-header">
                                        <span class="selected-solution-title">${sel.solution.title}</span>
                                    </div>
                                    <div class="selected-solution-meta">
                                        <span>Опция: ${sel.option === 'vip' ? 'VIP' : 'Стандарт'}</span>
                                        <span class="selected-solution-price">${formatPrice(sel.calculatedPrice)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Stages Timeline -->
                        <div class="stages-timeline" style="margin-top: 1.5rem;">
                            <h3 class="stages-timeline-title">📅 План-график этапов</h3>
                            ${stages.map((stage, idx) => `
                                <div class="stage-item ${stage.solutionId ? '' : 'general'} ${stage.isOverdue ? 'overdue' : ''}">
                                    <div class="stage-number">${idx + 1}</div>
                                    <div class="stage-content">
                                        <div class="stage-title">
                                            ${stage.title}
                                            ${stage.isOverdue ? '<span class="stage-overdue-badge">⚠️ Просрочено</span>' : ''}
                                        </div>
                                        <div class="stage-dates">
                                            ${formatDate(stage.plannedStart)} — ${formatDate(stage.plannedEnd)}
                                        </div>
                                    </div>
                                    <span class="stage-status ${stage.status.toLowerCase().replace('_', '-')}">
                                        ${stage.statusLabel?.label || stage.status}
                                    </span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="estimate-sidebar">
                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">📍 Объект</h4>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">
                                <p><strong>Название:</strong> ${request.objectInfo.name || '-'}</p>
                                <p><strong>Площадь:</strong> ${request.objectInfo.area || '-'} м²</p>
                                <p><strong>Этажность:</strong> ${request.objectInfo.floors || '-'}</p>
                                <p><strong>Город:</strong> ${request.objectInfo.city || '-'}</p>
                                <p><strong>Срочность:</strong> ${UrgencyLabels[request.urgency] || request.urgency}</p>
                            </div>
                        </div>

                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">💰 Итого</h4>
                            <div style="text-align: center; padding: 1rem;">
                                <div style="font-size: 2rem; font-weight: 700; color: var(--success);">
                                    ${formatPrice(request.totalEstimate)}
                                </div>
                                <div style="font-size: 0.9rem; color: var(--text-muted); margin-top: 0.5rem;">
                                    ~${request.totalDurationDays} дней
                                </div>
                            </div>
                        </div>

                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">🚀 Действия</h4>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                ${request.status === 'NEW' ? `
                                    <button class="btn btn-primary" onclick="ModulesUI.submitEngineeringRequest('${requestId}')">
                                        📨 Отправить на рассмотрение
                                    </button>
                                ` : ''}
                            </div>
                        </div>

                        <div class="estimate-sidebar-card">
                            <h4 class="estimate-sidebar-title">💬 Чат по заявке</h4>
                            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
                                    Обсудите детали с проектировщиками
                                </p>
                                <button class="btn btn-outline-primary" onclick="ModulesUI.toggleEngineeringChat('${requestId}')" id="engineeringChatToggle">
                                    💬 Открыть чат
                                </button>
                            </div>
                            <div id="engineering-chat-container" style="display:none; margin-top: 0.75rem; border-radius: 8px; overflow: hidden;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    function downloadEngineeringBriefPDF(requestId) {
        const result = window.EngineeringService.PDF.generateBrief(requestId);
        if (result.success) {
            showToast('📄 PDF ТЗ скачан!', 'success');
        } else {
            showToast(result.error, 'error');
        }
    }

    function downloadEngineeringStagesPDF(requestId) {
        const result = window.EngineeringService.PDF.generateStages(requestId);
        if (result.success) {
            showToast('📅 PDF Этапов скачан!', 'success');
        } else {
            showToast(result.error, 'error');
        }
    }

    function submitEngineeringRequest(requestId) {
        const result = window.EngineeringService.Request.submit(requestId);
        if (result.success) {
            showToast('📨 Заявка отправлена!', 'success');
            openEngineeringRequest(requestId);
        } else {
            showToast(result.error, 'error');
        }
    }

    // ========================================
    // NAVIGATION
    // ========================================

    function showEstimatesList() {
        const container = $('#moduleContent') || createModuleContainer();
        renderEstimatesList(container);
    }

    function showEngineeringCatalog() {
        const container = $('#moduleContent') || createModuleContainer();
        renderEngineeringCatalog(container);
    }

    function showEngineeringRequests() {
        const result = window.EngineeringService.Request.getList();
        if (!result.success) {
            showToast(result.error, 'error');
            return;
        }

        const requests = result.data;
        const container = $('#moduleContent') || createModuleContainer();

        container.innerHTML = `
            <div class="module-page">
                <div class="module-header">
                    <h1 class="module-title">
                        <span class="module-title-icon">📋</span>
                        Мои заявки на инженерные решения
                    </h1>
                    <div class="module-actions">
                        <button class="btn btn-primary btn-lg" onclick="ModulesUI.showEngineeringCatalog()">
                            ← К каталогу решений
                        </button>
                    </div>
                </div>

                <div class="cards-grid">
                    ${requests.length === 0 ? `
                        <div class="empty-state" style="grid-column: 1/-1;">
                            <div class="empty-state-icon">📋</div>
                            <div class="empty-state-title">Нет заявок</div>
                            <div class="empty-state-desc">Выберите решения в каталоге</div>
                            <button class="btn btn-primary" onclick="ModulesUI.showEngineeringCatalog()">
                                🏗️ Перейти в каталог
                            </button>
                        </div>
                    ` : requests.map(req => `
                        <div class="estimate-card animate-slide-up" onclick="ModulesUI.openEngineeringRequest('${req.id}')">
                            <div class="estimate-card-header">
                                <div>
                                    <div class="estimate-card-title">${req.objectInfo?.name || 'Заявка'}</div>
                                    <div class="estimate-card-type">${req.solutionsCount} решений</div>
                                </div>
                                <span class="stage-status ${req.status.toLowerCase()}" style="padding: 0.25rem 0.75rem; font-size: 0.75rem;">
                                    ${req.statusLabel?.icon} ${req.statusLabel?.label}
                                </span>
                            </div>
                            <div class="estimate-card-info">
                                <div class="estimate-card-info-item">
                                    <span class="estimate-card-info-label">Срок</span>
                                    <span class="estimate-card-info-value">${req.totalDurationDays} дней</span>
                                </div>
                                <div class="estimate-card-info-item">
                                    <span class="estimate-card-info-label">Дата</span>
                                    <span class="estimate-card-info-value">${formatDate(req.createdAt)}</span>
                                </div>
                                <div class="estimate-card-info-item">
                                    <span class="estimate-card-info-label">Итого</span>
                                    <span class="estimate-card-info-value estimate-card-total">
                                        ${formatPrice(req.totalEstimate)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function createModuleContainer() {
        let container = $('#moduleContent');
        if (!container) {
            container = document.createElement('div');
            container.id = 'moduleContent';
            container.style.cssText = 'position: relative; z-index: 1;';

            // Try to insert after header
            const mainHeader = $('#mainHeader');
            if (mainHeader && mainHeader.nextSibling) {
                mainHeader.parentNode.insertBefore(container, mainHeader.nextSibling);
            } else {
                document.body.appendChild(container);
            }
        }
        return container;
    }

    function showSolutionDetails(solutionId) {
        const result = window.EngineeringService.Solutions.get(solutionId);
        if (!result.success) {
            showToast('Решение не найдено', 'error');
            return;
        }

        const sol = result.data;
        const { SolutionCategoryLabels } = window.EngineeringModels;

        if (window.openModal) {
            window.openModal({
                id: 'solutionDetailModal',
                title: sol.title,
                content: `
                    <div class="solution-modal-content">
                        <div class="solution-modal-image">${getSolutionIcon(sol.category)}</div>
                        <div class="solution-modal-category">${SolutionCategoryLabels[sol.category] || sol.category}</div>
                        <div class="solution-modal-desc">${sol.shortDesc}</div>
                        
                        <div class="solution-modal-meta">
                            <div class="solution-modal-meta-item">
                                <div class="solution-modal-meta-label">Базовая цена</div>
                                <div class="solution-modal-meta-value price">${formatPrice(sol.basePrice)}</div>
                            </div>
                            <div class="solution-modal-meta-item">
                                <div class="solution-modal-meta-label">Базовый срок</div>
                                <div class="solution-modal-meta-value">${sol.baseDurationDays} дней</div>
                            </div>
                        </div>

                        ${sol.whatIncluded?.length ? `
                            <div class="solution-modal-section">
                                <h4 class="solution-modal-section-title">✓ Что входит</h4>
                                <ul class="solution-modal-list">
                                    ${sol.whatIncluded.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        ${sol.stagesTemplate?.length ? `
                            <div class="solution-modal-section">
                                <h4 class="solution-modal-section-title">📅 Этапы работ</h4>
                                <ul class="solution-modal-list">
                                    ${sol.stagesTemplate.map(s => `<li>${s.title} (${s.durationDays} дней)</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `,
                actions: [
                    { label: 'Закрыть', type: 'secondary', onClick: () => window.closeModal() },
                    {
                        label: '+ Добавить в пакет',
                        type: 'primary',
                        onClick: () => {
                            toggleSolution(solutionId);
                            window.closeModal();
                        }
                    }
                ]
            });
        }
    }

    // ========================================
    // CHAT INTEGRATION
    // ========================================
    let estimateChatVisible = false;
    let engineeringChatVisible = false;

    function toggleEstimateChat(estimateId) {
        const container = document.getElementById('estimate-chat-container');
        const button = document.getElementById('estimateChatToggle');

        if (!container) return;

        estimateChatVisible = !estimateChatVisible;

        if (estimateChatVisible) {
            container.style.display = 'block';
            if (button) button.textContent = '💬 Скрыть чат';

            // Render chat using ChatUI
            if (window.ChatUI?.render) {
                window.ChatUI.render('estimate-chat-container', `estimate_${estimateId}`, { floating: false });
            } else {
                container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-muted)">⚠️ Модуль чата не загружен</div>';
            }
        } else {
            container.style.display = 'none';
            if (button) button.textContent = '💬 Открыть чат';

            if (window.ChatUI?.destroy) {
                window.ChatUI.destroy();
            }
            container.innerHTML = '';
        }
    }

    function toggleEngineeringChat(requestId) {
        const container = document.getElementById('engineering-chat-container');
        const button = document.getElementById('engineeringChatToggle');

        if (!container) return;

        engineeringChatVisible = !engineeringChatVisible;

        if (engineeringChatVisible) {
            container.style.display = 'block';
            if (button) button.textContent = '💬 Скрыть чат';

            // Render chat using ChatUI
            if (window.ChatUI?.render) {
                window.ChatUI.render('engineering-chat-container', `engineering_${requestId}`, { floating: false });
            } else {
                container.innerHTML = '<div style="padding:1rem;text-align:center;color:var(--text-muted)">⚠️ Модуль чата не загружен</div>';
            }
        } else {
            container.style.display = 'none';
            if (button) button.textContent = '💬 Открыть чат';

            if (window.ChatUI?.destroy) {
                window.ChatUI.destroy();
            }
            container.innerHTML = '';
        }
    }

    // ========================================
    // AI INTEGRATION
    // ========================================

    /**
     * Open AI photo analyzer modal for estimate
     * @param {string} estimateId - Estimate ID
     */
    function openAIAnalyzer(estimateId) {
        // Check if AIAnalyzerUI is available
        if (!window.AIAnalyzerUI) {
            showToast('AI модуль не загружен', 'error');
            console.error('[ModulesUI] AIAnalyzerUI not loaded');
            return;
        }

        // Create modal
        if (window.openModal) {
            window.openModal({
                id: 'aiAnalyzerModal',
                title: '🤖 AI Анализ фотографии',
                width: '800px',
                content: `
                    <div id="ai-analyzer-modal-container" style="min-height: 400px;"></div>
                `,
                actions: [
                    { label: 'Закрыть', type: 'secondary', onClick: () => window.closeModal() }
                ],
                onOpen: () => {
                    // Render AI analyzer in modal
                    setTimeout(() => {
                        window.AIAnalyzerUI.render('ai-analyzer-modal-container', {
                            region: 'almaty',
                            showEstimate: true,
                            onAnalysisComplete: (result) => {
                                handleAIAnalysisResult(estimateId, result);
                            },
                            onError: (error) => {
                                console.error('[AI] Analysis error:', error);
                                showToast('Ошибка анализа: ' + error.message, 'error');
                            }
                        });
                    }, 100);
                }
            });
        } else {
            // Fallback: render in place
            const container = document.getElementById(`ai-analyzer-container-${estimateId}`);
            if (container) {
                window.AIAnalyzerUI.render(`ai-analyzer-container-${estimateId}`, {
                    region: 'almaty',
                    showEstimate: true,
                    onAnalysisComplete: (result) => {
                        handleAIAnalysisResult(estimateId, result);
                    }
                });
            }
        }
    }

    /**
     * Handle AI analysis result and apply to estimate
     * @param {string} estimateId - Estimate ID
     * @param {Object} result - AI analysis result
     */
    function handleAIAnalysisResult(estimateId, result) {
        console.log('[ModulesUI] AI analysis result:', result);

        if (!result || !result.success) {
            showToast('Анализ не дал результатов', 'warning');
            return;
        }

        // Store analysis result
        const storageKey = `estimate_ai_analysis_${estimateId}`;
        localStorage.setItem(storageKey, JSON.stringify({
            imageId: result.imageId,
            objectCount: result.objectCount,
            measurements: result.measurements,
            estimateItems: result.estimateItems,
            estimateTotal: result.estimateTotal,
            estimateConfidence: result.estimateConfidence,
            timestamp: new Date().toISOString()
        }));

        // Show result summary
        const objectsCount = result.objectCount || 0;
        const itemsCount = result.estimateItems?.length || 0;

        showToast(`Обнаружено ${objectsCount} объектов, сгенерировано ${itemsCount} позиций`, 'success');

        // Apply estimate items if available
        if (result.estimateItems && result.estimateItems.length > 0) {
            applyAIEstimateItems(estimateId, result.estimateItems, result.estimateTotal);
        }

        // Close modal
        if (window.closeModal) {
            window.closeModal();
        }
    }

    /**
     * Apply AI-generated estimate items to current estimate
     * @param {string} estimateId - Estimate ID
     * @param {Array} items - Estimate items from AI
     * @param {number} total - Total amount
     */
    function applyAIEstimateItems(estimateId, items, total) {
        // Show confirmation modal
        if (window.openModal) {
            const itemsHtml = items.slice(0, 5).map(item => `
                <tr>
                    <td>${item.work_name}</td>
                    <td style="text-align: right;">${item.quantity} ${item.unit}</td>
                    <td style="text-align: right;">${item.total_price?.toLocaleString('ru-RU')} ₸</td>
                </tr>
            `).join('');

            const moreItems = items.length > 5 ? `<tr><td colspan="3" style="color: var(--text-muted); font-style: italic;">... и ещё ${items.length - 5} позиций</td></tr>` : '';

            window.openModal({
                id: 'applyAIItemsModal',
                title: '✅ Применить AI-смету?',
                content: `
                    <p>AI распознал объекты на фото и сгенерировал смету.</p>
                    <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
                        <thead>
                            <tr style="border-bottom: 1px solid var(--border-color);">
                                <th style="text-align: left; padding: 0.5rem;">Работа</th>
                                <th style="text-align: right; padding: 0.5rem;">Кол-во</th>
                                <th style="text-align: right; padding: 0.5rem;">Сумма</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                            ${moreItems}
                        </tbody>
                        <tfoot>
                            <tr style="border-top: 2px solid var(--border-color);">
                                <td colspan="2" style="padding: 0.5rem;"><strong>ИТОГО:</strong></td>
                                <td style="text-align: right; padding: 0.5rem; color: var(--success);"><strong>${total?.toLocaleString('ru-RU')} ₸</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">
                        Позиции будут добавлены в текущую версию сметы.
                    </p>
                `,
                actions: [
                    { label: 'Отмена', type: 'secondary', onClick: () => window.closeModal() },
                    {
                        label: '✨ Применить',
                        type: 'primary',
                        onClick: () => {
                            // Add items to estimate via EstimateService
                            addAIItemsToEstimate(estimateId, items);
                            window.closeModal();
                        }
                    }
                ]
            });
        }
    }

    /**
     * Add AI items to estimate
     * @param {string} estimateId - Estimate ID
     * @param {Array} items - Items to add
     */
    function addAIItemsToEstimate(estimateId, items) {
        if (!window.EstimateService || !currentVersion) {
            showToast('Не удалось добавить позиции', 'error');
            return;
        }

        try {
            // Convert AI items to estimate items format
            items.forEach(aiItem => {
                const newItem = {
                    id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    name: aiItem.work_name,
                    unit: aiItem.unit,
                    quantity: aiItem.quantity,
                    unitPrice: aiItem.unit_price,
                    totalPrice: aiItem.total_price,
                    source: 'ai_detection',
                    confidence: aiItem.confidence || 0.85
                };

                currentVersionItems.push(newItem);
            });

            // Save version
            const versionResult = window.EstimateService.API.saveVersion(
                estimateId,
                currentVersionItems
            );

            if (versionResult.success) {
                showToast(`Добавлено ${items.length} позиций из AI-анализа`, 'success');
                // Refresh UI
                refreshEstimateUI();
            } else {
                showToast('Ошибка сохранения: ' + versionResult.error, 'error');
            }

        } catch (error) {
            console.error('[ModulesUI] Error adding AI items:', error);
            showToast('Ошибка добавления позиций', 'error');
        }
    }

    // ========================================
    // EXPORT
    // ========================================
    window.ModulesUI = {
        // Estimates
        showEstimatesList,
        renderEstimatesList,
        openCreateEstimate,
        openEstimate,
        saveEstimateVersion,
        recalculateEstimate,
        downloadEstimatePDF,
        switchVersion,
        editItemCell,
        createOrderFromEstimate,
        archiveEstimate,

        // Diff Viewer
        openDiffViewer,
        closeDiffViewer,
        _onDiffVersionChange,
        _setDiffFilter,

        // Engineering
        showEngineeringCatalog,
        renderEngineeringCatalog,
        showEngineeringRequests,
        openEngineeringRequest,
        toggleSolution,
        showSolutionDetails,
        createEngineeringRequest,
        downloadEngineeringBriefPDF,
        downloadEngineeringStagesPDF,
        submitEngineeringRequest,
        generateStagesPreview: () => showToast('Функция в разработке', 'info'),

        // Chat integration
        toggleEstimateChat,
        toggleEngineeringChat,

        // AI Integration
        openAIAnalyzer
    };

    console.log('✅ ModulesUI loaded');

})();
