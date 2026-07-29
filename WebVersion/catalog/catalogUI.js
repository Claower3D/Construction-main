// ========== CATALOG UI v1.0 ==========
// Полный UI модуля «Каталог подрядчиков»
(function () {
    'use strict';

    // ─── STATE ───
    let currentFilters = null;
    let currentView = 'grid'; // grid | list
    let currentPage = 1;
    const PAGE_SIZE = 12;
    let profileOverlay = null;

    // ─── INIT ───
    function init() {
        if (!window.CatalogModels || !window.CatalogService) {
            console.warn('[CatalogUI] Models or Service not loaded');
            return;
        }
        currentFilters = window.CatalogModels.createFilters();
        console.log('✅ [CatalogUI] v1.0 initialized');
    }

    // ─── RENDER MAIN PAGE ───
    function render(container) {
        if (!container) {
            container = document.getElementById('catalogContainer');
        }
        if (!container) return;

        if (!currentFilters) {
            currentFilters = window.CatalogModels.createFilters();
        }

        const stats = window.CatalogService.Entries.getStats();
        const categories = window.CatalogModels.BUILDER_CATEGORIES;
        const results = window.CatalogService.Entries.search(currentFilters);
        const totalPages = Math.ceil(results.length / PAGE_SIZE);
        const pageResults = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

        container.innerHTML = `
            <div class="catalog-page">
                <!-- Header -->
                <div class="catalog-header">
                    <div>
                        <h1 class="catalog-title">🔍 Каталог подрядчиков</h1>
                        <p class="catalog-subtitle">Найдите надёжного мастера или компанию для вашего проекта</p>
                    </div>
                </div>

                <!-- Stats -->
                <div class="catalog-stats">
                    <div class="catalog-stat-item">
                        <span class="catalog-stat-icon">👷</span>
                        <div>
                            <div class="catalog-stat-value">${stats.total}</div>
                            <div class="catalog-stat-label">Подрядчиков</div>
                        </div>
                    </div>
                    <div class="catalog-stat-item">
                        <span class="catalog-stat-icon">✅</span>
                        <div>
                            <div class="catalog-stat-value">${stats.active}</div>
                            <div class="catalog-stat-label">Доступны</div>
                        </div>
                    </div>
                    <div class="catalog-stat-item">
                        <span class="catalog-stat-icon">🏢</span>
                        <div>
                            <div class="catalog-stat-value">${stats.companies}</div>
                            <div class="catalog-stat-label">Компании</div>
                        </div>
                    </div>
                    <div class="catalog-stat-item">
                        <span class="catalog-stat-icon">⭐</span>
                        <div>
                            <div class="catalog-stat-value">${stats.avgRating}</div>
                            <div class="catalog-stat-label">Рейтинг</div>
                        </div>
                    </div>
                </div>

                <!-- Search -->
                <div class="catalog-search-bar">
                    <input type="text" 
                           class="catalog-search-input" 
                           id="catalogSearchInput"
                           placeholder="Поиск: имя, услуга, город… (например, «электрик Алматы»)"
                           value="${_esc(currentFilters.search)}"
                           autocomplete="off" />
                    <span class="catalog-search-icon">🔍</span>
                    <button class="catalog-search-clear ${currentFilters.search ? 'visible' : ''}" 
                            id="catalogSearchClear" title="Очистить">✕</button>
                </div>

                <!-- Category chips -->
                <div class="catalog-categories-scroll">
                    ${categories.map(cat => `
                        <button class="catalog-chip ${currentFilters.categories.includes(cat.id) ? 'active' : ''}" 
                                data-cat="${cat.id}">
                            <span class="catalog-chip-icon">${cat.icon}</span>${cat.label}
                        </button>
                    `).join('')}
                </div>

                <!-- Filters row -->
                <div class="catalog-filters">
                    <div class="catalog-filter-group">
                        <button class="catalog-chip ${currentFilters.executorType === '' ? 'active' : ''}" data-type="">Все</button>
                        <button class="catalog-chip ${currentFilters.executorType === 'master' ? 'active' : ''}" data-type="master">👤 Мастер</button>
                        <button class="catalog-chip ${currentFilters.executorType === 'company' ? 'active' : ''}" data-type="company">🏢 Компания</button>
                    </div>
                    <div class="catalog-filter-group">
                        <button class="catalog-chip ${currentFilters.isAvailable ? 'active' : ''}" data-toggle="available">
                            🟢 Доступен сейчас
                        </button>
                        <button class="catalog-chip ${currentFilters.hasReviews ? 'active' : ''}" data-toggle="reviews">
                            💬 С отзывами
                        </button>
                    </div>
                    <div class="catalog-filter-group">
                        <select class="catalog-sort-select" id="catalogSortSelect">
                            <option value="rating_desc" ${currentFilters.sortBy === 'rating_desc' ? 'selected' : ''}>⭐ Рейтинг ↓</option>
                            <option value="rating_asc" ${currentFilters.sortBy === 'rating_asc' ? 'selected' : ''}>⭐ Рейтинг ↑</option>
                            <option value="price_asc" ${currentFilters.sortBy === 'price_asc' ? 'selected' : ''}>💰 Цена ↑</option>
                            <option value="price_desc" ${currentFilters.sortBy === 'price_desc' ? 'selected' : ''}>💰 Цена ↓</option>
                            <option value="reviews_desc" ${currentFilters.sortBy === 'reviews_desc' ? 'selected' : ''}>💬 Отзывы ↓</option>
                            <option value="newest" ${currentFilters.sortBy === 'newest' ? 'selected' : ''}>🆕 Новые</option>
                        </select>
                    </div>
                </div>

                <!-- Toolbar -->
                <div class="catalog-toolbar">
                    <span class="catalog-results-count">
                        Найдено: <strong>${results.length}</strong> подрядчиков
                    </span>
                    <div class="catalog-view-toggle">
                        <button class="catalog-view-btn ${currentView === 'grid' ? 'active' : ''}" data-view="grid" title="Сетка">▦</button>
                        <button class="catalog-view-btn ${currentView === 'list' ? 'active' : ''}" data-view="list" title="Список">☰</button>
                    </div>
                </div>

                <!-- Grid -->
                <div class="catalog-grid ${currentView === 'list' ? 'list-view' : ''}" id="catalogGrid">
                    ${pageResults.length > 0
                ? pageResults.map(e => renderCard(e)).join('')
                : renderEmpty()
            }
                </div>

                <!-- Pagination -->
                ${totalPages > 1 ? renderPagination(totalPages) : ''}
            </div>
        `;

        // Bind events
        _bindEvents(container);
    }

    // ─── CARD ───
    function renderCard(entry) {
        const categories = window.CatalogModels.BUILDER_CATEGORIES;
        const isFav = window.CatalogService.Favorites.isFavorite(entry.id);

        // Stars
        const starsHtml = _renderStars(entry.rating || 0);

        // Type badge
        const typeBadge = entry.executorType === 'company'
            ? '<span class="catalog-card-type-badge badge-company">Компания</span>'
            : entry.executorType === 'brigade'
                ? '<span class="catalog-card-type-badge badge-brigade">Бригада</span>'
                : '<span class="catalog-card-type-badge badge-master">Мастер</span>';

        // Categories (max 3)
        const catHtml = (entry.categories || []).slice(0, 3).map(catId => {
            const cat = categories.find(c => c.id === catId);
            return cat ? `<span class="catalog-card-cat">${cat.icon} ${cat.label}</span>` : '';
        }).join('');

        // Status
        const statusClass = entry.isAvailable && entry.status !== 'busy'
            ? 'available'
            : entry.status === 'busy' ? 'busy' : 'partial';
        const statusText = statusClass === 'available' ? 'Доступен'
            : statusClass === 'busy' ? 'Занят' : 'Частично';

        // Avatar initials
        const initials = (entry.name || 'N').substring(0, 2).toUpperCase();

        // Price
        const priceText = entry.priceLevel === 'economy' ? '💰 Эконом'
            : entry.priceLevel === 'premium' ? '💎 Премиум'
                : '📊 Стандарт';

        return `
            <div class="catalog-card" data-entry-id="${entry.id}">
                <button class="catalog-card-fav ${isFav ? 'active' : ''}" 
                        data-fav-id="${entry.id}" title="В избранное"
                        onclick="event.stopPropagation()">
                    ${isFav ? '❤️' : '🤍'}
                </button>
                <div class="catalog-card-header">
                    <div class="catalog-card-avatar">
                        ${entry.avatarUrl
                ? `<img src="${_esc(entry.avatarUrl)}" alt="${_esc(entry.name)}" />`
                : `<span class="initials">${initials}</span>`
            }
                    </div>
                    <div class="catalog-card-info">
                        <div class="catalog-card-name">${_esc(entry.name)}</div>
                        <div class="catalog-card-type">
                            ${typeBadge}
                            ${entry.companyName ? `· ${_esc(entry.companyName)}` : ''}
                        </div>
                    </div>
                </div>

                <div class="catalog-card-rating">
                    <div class="catalog-rating-stars">${starsHtml}</div>
                    <span class="catalog-rating-value">${(entry.rating || 0).toFixed(1)}</span>
                    <span class="catalog-rating-count">(${entry.reviewsCount || 0})</span>
                </div>

                <div class="catalog-card-categories">${catHtml}</div>

                ${entry.about ? `<p class="catalog-card-about">${_esc(entry.about)}</p>` : ''}

                <div class="catalog-card-footer">
                    <span class="catalog-card-city">📍 ${_esc(entry.city || 'Казахстан')}</span>
                    <span class="catalog-card-status ${statusClass}">
                        <span class="status-dot ${statusClass}"></span>
                        ${statusText}
                    </span>
                    <span class="catalog-card-price">${priceText}</span>
                </div>
            </div>
        `;
    }

    // ─── EMPTY STATE ───
    function renderEmpty() {
        return `
            <div class="catalog-empty">
                <div class="catalog-empty-icon">🔍</div>
                <div class="catalog-empty-text">Ничего не найдено</div>
                <p class="catalog-empty-hint">Попробуйте изменить фильтры или ключевые слова поиска</p>
            </div>
        `;
    }

    // ─── PAGINATION ───
    function renderPagination(totalPages) {
        let html = '<div class="catalog-pagination">';
        for (let i = 1; i <= totalPages; i++) {
            html += `<button class="catalog-page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        html += '</div>';
        return html;
    }

    // ─── STARS ───
    function _renderStars(rating) {
        let html = '';
        for (let i = 1; i <= 5; i++) {
            if (rating >= i) {
                html += '<span class="star-on">★</span>';
            } else if (rating >= i - 0.5) {
                html += '<span class="star-half">★</span>';
            } else {
                html += '<span class="star-off">★</span>';
            }
        }
        return html;
    }

    // ─── PROFILE MODAL ───
    function openProfile(entryId) {
        const entry = window.CatalogService.Entries.getById(entryId);
        if (!entry) return;

        const categories = window.CatalogModels.BUILDER_CATEGORIES;
        const reviews = window.CatalogService.Reviews.getByExecutor(entryId);
        const truthfulness = window.CatalogService.calculateTruthfulness(entryId);
        const isFav = window.CatalogService.Favorites.isFavorite(entryId);
        const reviewStats = window.CatalogService.Reviews.getStats(entryId);
        const starsHtml = _renderStars(entry.rating || 0);

        // Type badge
        const typeBadge = entry.executorType === 'company'
            ? '<span class="catalog-card-type-badge badge-company">Компания</span>'
            : entry.executorType === 'brigade'
                ? '<span class="catalog-card-type-badge badge-brigade">Бригада</span>'
                : '<span class="catalog-card-type-badge badge-master">Мастер</span>';

        // Categories
        const catHtml = (entry.categories || []).map(catId => {
            const cat = categories.find(c => c.id === catId);
            return cat ? `<span class="catalog-card-cat">${cat.icon} ${cat.label}</span>` : '';
        }).join('');

        // Status
        const statusClass = entry.isAvailable && entry.status !== 'busy' ? 'available'
            : entry.status === 'busy' ? 'busy' : 'partial';
        const statusText = statusClass === 'available' ? '🟢 Доступен'
            : statusClass === 'busy' ? '🔴 Занят' : '🟡 Частично';

        // Initials
        const initials = (entry.name || 'N').substring(0, 2).toUpperCase();

        // Truthfulness bar color
        const truthColor = truthfulness >= 70 ? '#22c55e'
            : truthfulness >= 40 ? '#f59e0b' : '#ef4444';

        // Reviews HTML
        const reviewsHtml = reviews.slice(0, 5).map(r => `
            <div class="catalog-review-item">
                <div class="catalog-review-header">
                    <div class="catalog-review-author">
                        <div class="catalog-review-author-avatar">${(r.authorName || 'A')[0].toUpperCase()}</div>
                        <span class="catalog-review-author-name">${_esc(r.authorName)}</span>
                        <div class="catalog-rating-stars" style="font-size:0.8rem;">${_renderStars(r.rating)}</div>
                    </div>
                    <span class="catalog-review-date">${_formatDate(r.createdAt)}</span>
                </div>
                <p class="catalog-review-text">${_esc(r.text || 'Без комментария')}</p>
                ${r.reply ? `
                    <div class="catalog-review-reply">
                        <div class="catalog-review-reply-label">↩ Ответ исполнителя</div>
                        <p class="catalog-review-reply-text">${_esc(r.reply.text)}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

        // Create overlay
        if (profileOverlay) {
            profileOverlay.remove();
        }

        profileOverlay = document.createElement('div');
        profileOverlay.className = 'catalog-profile-overlay';
        profileOverlay.id = 'catalogProfileOverlay';
        profileOverlay.innerHTML = `
            <div class="catalog-profile-modal">
                <div class="catalog-profile-header">
                    <button class="catalog-profile-close" id="catalogProfileClose">✕</button>
                    <div class="catalog-profile-top">
                        <div class="catalog-profile-avatar">
                            ${entry.avatarUrl
                ? `<img src="${_esc(entry.avatarUrl)}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />`
                : initials
            }
                        </div>
                        <div class="catalog-profile-main">
                            <h2 class="catalog-profile-name">${_esc(entry.name)}</h2>
                            <div class="catalog-profile-type-row">
                                ${typeBadge}
                                <span style="color:var(--text-muted);font-size:0.85rem;">· ${_esc(entry.city || 'Казахстан')}</span>
                                <span style="font-size:0.85rem;font-weight:600;" class="${statusClass}">${statusText}</span>
                            </div>
                        </div>
                    </div>

                    <div class="catalog-profile-rating">
                        <div class="catalog-profile-rating-value">${(entry.rating || 0).toFixed(1)}</div>
                        <div class="catalog-profile-rating-meta">
                            <div class="catalog-rating-stars">${starsHtml}</div>
                            <span class="catalog-rating-count">${reviewStats.count} отзывов</span>
                        </div>
                    </div>

                    <div class="catalog-profile-truth" style="margin-top:0.75rem;">
                        <span class="catalog-truth-label">Правдивость: ${truthfulness}%</span>
                        <div class="catalog-truth-bar">
                            <div class="catalog-truth-bar-fill" style="width:${truthfulness}%;background:${truthColor};"></div>
                        </div>
                    </div>
                </div>

                <div class="catalog-profile-body">
                    <!-- About -->
                    ${entry.about ? `
                        <div class="catalog-profile-section">
                            <h3 class="catalog-profile-section-title">📝 О себе</h3>
                            <p class="catalog-profile-about">${_esc(entry.about)}</p>
                        </div>
                    ` : ''}

                    <!-- Categories -->
                    <div class="catalog-profile-section">
                        <h3 class="catalog-profile-section-title">🛠 Специализация</h3>
                        <div class="catalog-card-categories">${catHtml || '<span style="color:var(--text-muted)">Не указана</span>'}</div>
                    </div>

                    <!-- Terms -->
                    <div class="catalog-profile-section">
                        <h3 class="catalog-profile-section-title">💼 Условия</h3>
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.75rem;">
                            <div class="catalog-contact-row" style="border:1px solid var(--border);border-radius:12px;padding:0.75rem;">
                                <span class="catalog-contact-icon">💰</span>
                                <div>
                                    <div style="font-size:0.75rem;color:var(--text-muted)">Уровень цен</div>
                                    <div class="catalog-contact-value">${entry.priceLevel === 'economy' ? 'Эконом' : entry.priceLevel === 'premium' ? 'Премиум' : 'Стандарт'}</div>
                                </div>
                            </div>
                            <div class="catalog-contact-row" style="border:1px solid var(--border);border-radius:12px;padding:0.75rem;">
                                <span class="catalog-contact-icon">📋</span>
                                <div>
                                    <div style="font-size:0.75rem;color:var(--text-muted)">Мин. заказ</div>
                                    <div class="catalog-contact-value">${entry.minOrder ? entry.minOrder.toLocaleString('ru-RU') + ' ₸' : 'Не указан'}</div>
                                </div>
                            </div>
                            <div class="catalog-contact-row" style="border:1px solid var(--border);border-radius:12px;padding:0.75rem;">
                                <span class="catalog-contact-icon">🛡</span>
                                <div>
                                    <div style="font-size:0.75rem;color:var(--text-muted)">Гарантия</div>
                                    <div class="catalog-contact-value">${entry.warrantyMonths ? entry.warrantyMonths + ' мес.' : 'Не указана'}</div>
                                </div>
                            </div>
                            <div class="catalog-contact-row" style="border:1px solid var(--border);border-radius:12px;padding:0.75rem;">
                                <span class="catalog-contact-icon">📅</span>
                                <div>
                                    <div style="font-size:0.75rem;color:var(--text-muted)">Начало работ</div>
                                    <div class="catalog-contact-value">${entry.startWhen || 'По договорённости'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Team (if company) -->
                    ${entry.hasTeam ? `
                        <div class="catalog-profile-section">
                            <h3 class="catalog-profile-section-title">👥 Команда</h3>
                            <p style="color:var(--text-muted);font-size:0.9rem;">
                                Команда из <strong style="color:var(--text)">${entry.teamCount || '?'}</strong> человек
                                ${entry.equipment && entry.equipment.length > 0
                    ? ` · Спецтехника: ${entry.equipment.map(eq => eq.name).join(', ')}`
                    : ''
                }
                            </p>
                        </div>
                    ` : ''}

                    <!-- Contacts -->
                    <div class="catalog-profile-section">
                        <h3 class="catalog-profile-section-title">📞 Контакты</h3>
                        ${entry.phone ? `
                            <div class="catalog-contact-row">
                                <span class="catalog-contact-icon">📱</span>
                                <span class="catalog-contact-value">${_esc(entry.phone)}</span>
                            </div>
                        ` : ''}
                        ${entry.email ? `
                            <div class="catalog-contact-row">
                                <span class="catalog-contact-icon">📧</span>
                                <span class="catalog-contact-value">${_esc(entry.email)}</span>
                            </div>
                        ` : ''}
                        <div class="catalog-contact-row">
                            <span class="catalog-contact-icon">📍</span>
                            <span class="catalog-contact-value">${_esc(entry.city || 'Казахстан')}${entry.radiusKm ? ` · Радиус ${entry.radiusKm} км` : ''}</span>
                        </div>
                    </div>

                    <!-- Reviews -->
                    <div class="catalog-profile-section">
                        <h3 class="catalog-profile-section-title">💬 Отзывы (${reviewStats.count})</h3>
                        ${reviewsHtml || '<p style="color:var(--text-muted);font-size:0.9rem;">Пока нет отзывов</p>'}
                    </div>

                    <!-- Actions -->
                    <div class="catalog-profile-actions">
                        <button class="catalog-btn catalog-btn-primary" id="catalogInviteBtn" data-entry-id="${entry.id}">
                            📩 Пригласить на проект
                        </button>
                        <button class="catalog-btn catalog-btn-secondary" id="catalogFavBtn" data-entry-id="${entry.id}">
                            ${isFav ? '❤️ В избранном' : '🤍 В избранное'}
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(profileOverlay);

        // Animate in
        requestAnimationFrame(() => {
            profileOverlay.classList.add('active');
        });

        // Bind close
        profileOverlay.querySelector('#catalogProfileClose').addEventListener('click', closeProfile);
        profileOverlay.addEventListener('click', (e) => {
            if (e.target === profileOverlay) closeProfile();
        });

        // Fav button
        const favBtn = profileOverlay.querySelector('#catalogFavBtn');
        if (favBtn) {
            favBtn.addEventListener('click', () => {
                const added = window.CatalogService.Favorites.toggle(entry.id);
                favBtn.innerHTML = added ? '❤️ В избранном' : '🤍 В избранное';
                if (window.showToast) {
                    window.showToast(added ? '❤️ Добавлен в избранное' : '💔 Удалён из избранного');
                }
            });
        }

        // Invite button
        const inviteBtn = profileOverlay.querySelector('#catalogInviteBtn');
        if (inviteBtn) {
            inviteBtn.addEventListener('click', () => {
                openInviteModal(entry);
            });
        }

        // Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                closeProfile();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    function closeProfile() {
        if (profileOverlay) {
            profileOverlay.classList.remove('active');
            setTimeout(() => {
                if (profileOverlay && profileOverlay.parentNode) {
                    profileOverlay.remove();
                }
                profileOverlay = null;
            }, 350);
        }
    }

    // ─── INVITE MODAL ───
    function openInviteModal(entry) {
        if (!window.openModal) {
            if (window.showToast) window.showToast('⚠️ Модальная система не загружена');
            return;
        }

        window.openModal({
            id: 'catalog-invite-modal',
            title: `📩 Пригласить: ${entry.name}`,
            content: `
                <div class="catalog-invite-form">
                    <div class="catalog-invite-field">
                        <label>Название проекта</label>
                        <input type="text" id="inviteProjectTitle" placeholder="Например: Ремонт квартиры 2-комн." />
                    </div>
                    <div class="catalog-invite-field">
                        <label>Сообщение</label>
                        <textarea id="inviteMessage" placeholder="Опишите задачу, сроки, требования…"></textarea>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '📩 Отправить приглашение',
                    type: 'primary',
                    onClick: () => {
                        const title = document.getElementById('inviteProjectTitle')?.value || '';
                        const message = document.getElementById('inviteMessage')?.value || '';

                        if (!title.trim()) {
                            if (window.shakeInput) {
                                window.shakeInput(document.getElementById('inviteProjectTitle'));
                            }
                            return;
                        }

                        window.CatalogService.Invites.send({
                            fromUserId: 'current_user',
                            fromUserName: 'Вы',
                            toExecutorId: entry.id,
                            toExecutorName: entry.name,
                            projectTitle: title,
                            message: message
                        });

                        if (window.closeModal) window.closeModal();
                        if (window.showToast) window.showToast('✅ Приглашение отправлено!');
                        if (window.showEnhancedToast) {
                            window.showEnhancedToast({
                                type: 'success',
                                message: `Приглашение отправлено ${entry.name}`
                            });
                        }
                    }
                },
                {
                    text: 'Отмена',
                    type: 'ghost',
                    onClick: () => {
                        if (window.closeModal) window.closeModal();
                    }
                }
            ]
        });
    }

    // ─── EVENT BINDINGS ───
    function _bindEvents(container) {
        // Search input
        const searchInput = container.querySelector('#catalogSearchInput');
        if (searchInput) {
            let debounce = null;
            searchInput.addEventListener('input', () => {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    currentFilters.search = searchInput.value;
                    currentPage = 1;

                    // Toggle clear button
                    const clearBtn = container.querySelector('#catalogSearchClear');
                    if (clearBtn) {
                        clearBtn.classList.toggle('visible', !!searchInput.value);
                    }

                    render(container);
                }, 300);
            });
        }

        // Search clear
        const clearBtn = container.querySelector('#catalogSearchClear');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                currentFilters.search = '';
                currentPage = 1;
                render(container);
            });
        }

        // Category chips
        container.querySelectorAll('.catalog-chip[data-cat]').forEach(chip => {
            chip.addEventListener('click', () => {
                const catId = chip.dataset.cat;
                const idx = currentFilters.categories.indexOf(catId);
                if (idx >= 0) {
                    currentFilters.categories.splice(idx, 1);
                } else {
                    currentFilters.categories.push(catId);
                }
                currentPage = 1;
                render(container);
            });
        });

        // Executor type filter
        container.querySelectorAll('.catalog-chip[data-type]').forEach(chip => {
            chip.addEventListener('click', () => {
                currentFilters.executorType = chip.dataset.type;
                currentPage = 1;
                render(container);
            });
        });

        // Toggle filters (available, reviews)
        container.querySelectorAll('.catalog-chip[data-toggle]').forEach(chip => {
            chip.addEventListener('click', () => {
                const toggle = chip.dataset.toggle;
                if (toggle === 'available') {
                    currentFilters.isAvailable = !currentFilters.isAvailable;
                } else if (toggle === 'reviews') {
                    currentFilters.hasReviews = !currentFilters.hasReviews;
                }
                currentPage = 1;
                render(container);
            });
        });

        // Sort select
        const sortSelect = container.querySelector('#catalogSortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                currentFilters.sortBy = sortSelect.value;
                currentPage = 1;
                render(container);
            });
        }

        // View toggle
        container.querySelectorAll('.catalog-view-btn[data-view]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentView = btn.dataset.view;
                render(container);
            });
        });

        // Card clicks → open profile
        container.querySelectorAll('.catalog-card[data-entry-id]').forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't open profile if clicking fav button
                if (e.target.closest('.catalog-card-fav')) return;
                openProfile(card.dataset.entryId);
            });
        });

        // Favorite buttons on cards
        container.querySelectorAll('.catalog-card-fav[data-fav-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = btn.dataset.favId;
                const added = window.CatalogService.Favorites.toggle(entryId);
                btn.innerHTML = added ? '❤️' : '🤍';
                btn.classList.toggle('active', added);
                if (window.showToast) {
                    window.showToast(added ? '❤️ Добавлен в избранное' : '💔 Удалён из избранного');
                }
            });
        });

        // Pagination
        container.querySelectorAll('.catalog-page-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', () => {
                currentPage = parseInt(btn.dataset.page);
                render(container);
                // Scroll to top
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });
    }

    // ─── HELPERS ───
    function _esc(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function _formatDate(dateStr) {
        if (!dateStr) return '';
        try {
            const d = new Date(dateStr);
            return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    }

    // ─── EXPORT ───
    window.CatalogUI = {
        init,
        render,
        openProfile,
        closeProfile
    };

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    console.log('✅ [CatalogUI] v1.0 loaded');
})();
