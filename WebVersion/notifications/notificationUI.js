// ========== NOTIFICATION UI ==========
// Интерфейс уведомлений с колокольчиком и dropdown
// Версия: 1.0

(function () {
    'use strict';

    // ========== STATE ==========
    let isOpen = false;
    let container = null;
    let bellElement = null;
    let dropdownElement = null;
    let unsubscribe = null;

    // ========== RENDER NOTIFICATION ITEM ==========
    function renderNotificationItem(notification) {
        const config = notification.getConfig();
        const isUnread = !notification.isRead;

        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" 
                 data-id="${notification.id}"
                 onclick="NotificationUI.handleClick('${notification.id}')">
                <div class="notification-icon" style="background: ${config.color}20; color: ${config.color}">
                    ${config.icon}
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notification.getTitle()}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${notification.getRelativeTime()}</div>
                </div>
                <div class="notification-actions">
                    ${isUnread ? `
                        <button class="notification-action-btn" onclick="event.stopPropagation(); NotificationUI.markRead('${notification.id}')" title="Отметить прочитанным">
                            ✓
                        </button>
                    ` : ''}
                    <button class="notification-action-btn delete" onclick="event.stopPropagation(); NotificationUI.delete('${notification.id}')" title="Удалить">
                        ×
                    </button>
                </div>
            </div>
        `;
    }

    // ========== RENDER DROPDOWN ==========
    function renderDropdown() {
        if (!dropdownElement) return;

        const notifications = window.NotificationService.getAll({ limit: 20 });
        const unreadCount = window.NotificationService.getUnreadCount();

        if (notifications.length === 0) {
            dropdownElement.innerHTML = `
                <div class="notification-header">
                    <h3>Уведомления</h3>
                </div>
                <div class="notification-empty">
                    <span class="notification-empty-icon">🔔</span>
                    <p>Нет уведомлений</p>
                </div>
            `;
            return;
        }

        const unreadNotifications = notifications.filter(n => !n.isRead);
        const readNotifications = notifications.filter(n => n.isRead);

        dropdownElement.innerHTML = `
            <div class="notification-header">
                <h3>Уведомления ${unreadCount > 0 ? `<span class="notification-badge-inline">${unreadCount}</span>` : ''}</h3>
                <div class="notification-header-actions">
                    ${unreadCount > 0 ? `
                        <button class="notification-header-btn" onclick="NotificationUI.markAllRead()">
                            Прочитать все
                        </button>
                    ` : ''}
                    <button class="notification-header-btn" onclick="NotificationUI.openSettings()">
                        ⚙️
                    </button>
                </div>
            </div>
            <div class="notification-list">
                ${unreadNotifications.length > 0 ? `
                    <div class="notification-section">
                        <div class="notification-section-title">Непрочитанные</div>
                        ${unreadNotifications.map(n => renderNotificationItem(n)).join('')}
                    </div>
                ` : ''}
                ${readNotifications.length > 0 ? `
                    <div class="notification-section">
                        ${unreadNotifications.length > 0 ? '<div class="notification-section-title">Прочитанные</div>' : ''}
                        ${readNotifications.slice(0, 10).map(n => renderNotificationItem(n)).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="notification-footer">
                <button class="notification-footer-btn" onclick="NotificationUI.viewAll()">
                    Все уведомления
                </button>
            </div>
        `;
    }

    // ========== UPDATE BADGE ==========
    function updateBadge() {
        if (!bellElement) return;

        const count = window.NotificationService.getUnreadCount();
        let badge = bellElement.querySelector('.notification-badge');

        if (count > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                bellElement.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
            badge.style.display = 'flex';

            // Анимация при новом уведомлении
            bellElement.classList.add('notification-bell-shake');
            setTimeout(() => bellElement.classList.remove('notification-bell-shake'), 500);
        } else {
            if (badge) {
                badge.style.display = 'none';
            }
        }
    }

    // ========== TOGGLE DROPDOWN ==========
    function toggleDropdown() {
        isOpen = !isOpen;

        if (dropdownElement) {
            if (isOpen) {
                renderDropdown();
                dropdownElement.classList.add('open');
            } else {
                dropdownElement.classList.remove('open');
            }
        }
    }

    // ========== CLOSE DROPDOWN ==========
    function closeDropdown() {
        isOpen = false;
        if (dropdownElement) {
            dropdownElement.classList.remove('open');
        }
    }

    // ========== NOTIFICATION UI API ==========
    const NotificationUI = {
        /**
         * Инициализировать UI уведомлений
         */
        init(containerId = 'notification-bell-container') {
            container = document.getElementById(containerId);

            if (!container) {
                // Создать контейнер, если не найден
                container = document.createElement('div');
                container.id = containerId;
                container.className = 'notification-container';

                // Добавить в header
                const header = document.querySelector('.app-header, .main-header, header');
                if (header) {
                    // Найти место для вставки (обычно справа)
                    const rightSection = header.querySelector('.header-right, .header-actions') || header;
                    rightSection.appendChild(container);
                }
            }

            this.render();

            // Подписаться на события
            unsubscribe = window.NotificationService.subscribe((event, data) => {
                if (event === 'countChanged' || event === 'new' || event === 'read' || event === 'allRead' || event === 'deleted') {
                    updateBadge();
                    if (isOpen) {
                        renderDropdown();
                    }
                }

                // Показать toast при новом уведомлении
                if (event === 'new' && data) {
                    this.showToast(data);
                }
            });

            // Закрыть при клике вне
            document.addEventListener('click', (e) => {
                if (container && !container.contains(e.target)) {
                    closeDropdown();
                }
            });

            console.log('✅ NotificationUI initialized');
            return this;
        },

        /**
         * Отрендерить UI колокольчика
         */
        render() {
            if (!container) return;

            const count = window.NotificationService?.getUnreadCount() || 0;

            container.innerHTML = `
                <button class="notification-bell" id="notification-bell" onclick="NotificationUI.toggle()">
                    <svg class="notification-bell-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                    </svg>
                    ${count > 0 ? `<span class="notification-badge">${count > 99 ? '99+' : count}</span>` : ''}
                </button>
                <div class="notification-dropdown" id="notification-dropdown">
                    <!-- Контент будет добавлен динамически -->
                </div>
            `;

            bellElement = container.querySelector('#notification-bell');
            dropdownElement = container.querySelector('#notification-dropdown');
        },

        /**
         * Переключить dropdown
         */
        toggle() {
            toggleDropdown();
        },

        /**
         * Закрыть dropdown
         */
        close() {
            closeDropdown();
        },

        /**
         * Обработать клик на уведомление
         */
        handleClick(id) {
            const notification = window.NotificationService.getById(id);
            if (!notification) return;

            // Отметить прочитанным
            window.NotificationService.markAsRead(id);

            // Закрыть dropdown
            closeDropdown();

            // Перейти по ссылке
            if (notification.actionUrl) {
                // Простая навигация (можно заменить на роутер)
                if (notification.actionUrl.startsWith('#')) {
                    window.location.hash = notification.actionUrl.substring(1);
                } else {
                    window.location.href = notification.actionUrl;
                }
            }
        },

        /**
         * Отметить прочитанным
         */
        markRead(id) {
            window.NotificationService.markAsRead(id);
        },

        /**
         * Отметить все прочитанными
         */
        markAllRead() {
            window.NotificationService.markAllAsRead();
            if (window.showToast) {
                window.showToast('✓ Все уведомления прочитаны');
            }
        },

        /**
         * Удалить уведомление
         */
        delete(id) {
            window.NotificationService.delete(id);
        },

        /**
         * Открыть страницу всех уведомлений
         */
        viewAll() {
            closeDropdown();
            // Можно открыть модальное окно или перейти на страницу
            this.showAllNotificationsModal();
        },

        /**
         * Открыть настройки
         */
        openSettings() {
            closeDropdown();
            this.showSettingsModal();
        },

        /**
         * Показать toast уведомление
         */
        showToast(notification) {
            const config = notification.getConfig();

            // Создать toast
            const toast = document.createElement('div');
            toast.className = 'notification-toast';
            toast.innerHTML = `
                <div class="notification-toast-icon" style="background: ${config.color}20; color: ${config.color}">
                    ${config.icon}
                </div>
                <div class="notification-toast-content">
                    <div class="notification-toast-title">${notification.getTitle()}</div>
                    <div class="notification-toast-message">${notification.message}</div>
                </div>
                <button class="notification-toast-close" onclick="this.parentElement.remove()">×</button>
            `;

            // Контейнер для toasts
            let toastContainer = document.getElementById('notification-toast-container');
            if (!toastContainer) {
                toastContainer = document.createElement('div');
                toastContainer.id = 'notification-toast-container';
                toastContainer.className = 'notification-toast-container';
                document.body.appendChild(toastContainer);
            }

            toastContainer.appendChild(toast);

            // Анимация появления
            setTimeout(() => toast.classList.add('show'), 10);

            // Автоудаление через 5 сек
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, 5000);

            // Клик для перехода
            toast.addEventListener('click', (e) => {
                if (!e.target.classList.contains('notification-toast-close')) {
                    this.handleClick(notification.id);
                    toast.remove();
                }
            });
        },

        /**
         * Показать модальное окно всех уведомлений
         */
        showAllNotificationsModal() {
            const notifications = window.NotificationService.getAll({ limit: 50 });

            const modal = document.createElement('div');
            modal.className = 'notification-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            modal.innerHTML = `
                <div class="notification-modal">
                    <div class="notification-modal-header">
                        <h2>Все уведомления</h2>
                        <button class="notification-modal-close" onclick="this.closest('.notification-modal-overlay').remove()">×</button>
                    </div>
                    <div class="notification-modal-body">
                        ${notifications.length === 0 ? `
                            <div class="notification-empty" style="padding: 3rem;">
                                <span class="notification-empty-icon">🔔</span>
                                <p>Нет уведомлений</p>
                            </div>
                        ` : `
                            <div class="notification-list notification-list-full">
                                ${notifications.map(n => renderNotificationItem(n)).join('')}
                            </div>
                        `}
                    </div>
                    <div class="notification-modal-footer">
                        <button class="btn btn-secondary" onclick="NotificationService.clearRead(); this.closest('.notification-modal-overlay').remove();">
                            Очистить прочитанные
                        </button>
                        <button class="btn btn-primary" onclick="this.closest('.notification-modal-overlay').remove();">
                            Закрыть
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        },

        /**
         * Показать модальное окно настроек
         */
        showSettingsModal() {
            const settings = window.NotificationService.getSettings();

            const modal = document.createElement('div');
            modal.className = 'notification-modal-overlay';
            modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

            modal.innerHTML = `
                <div class="notification-modal notification-modal-sm">
                    <div class="notification-modal-header">
                        <h2>⚙️ Настройки уведомлений</h2>
                        <button class="notification-modal-close" onclick="this.closest('.notification-modal-overlay').remove()">×</button>
                    </div>
                    <div class="notification-modal-body">
                        <div class="notification-settings-group">
                            <label class="notification-setting">
                                <span>🔊 Звуковые уведомления</span>
                                <input type="checkbox" id="notif-sound" ${settings?.soundEnabled ? 'checked' : ''} 
                                    onchange="NotificationService.toggleSound(this.checked)">
                            </label>
                            
                            <label class="notification-setting">
                                <span>🌙 Тихий режим</span>
                                <input type="checkbox" id="notif-quiet" ${settings?.quietHours?.enabled ? 'checked' : ''}
                                    onchange="NotificationUI.toggleQuietMode(this.checked)">
                            </label>
                            
                            <div class="notification-setting-time" id="quiet-time-settings" style="display: ${settings?.quietHours?.enabled ? 'flex' : 'none'}">
                                <span>С</span>
                                <input type="time" id="quiet-start" value="${settings?.quietHours?.start || '22:00'}"
                                    onchange="NotificationUI.updateQuietHours()">
                                <span>до</span>
                                <input type="time" id="quiet-end" value="${settings?.quietHours?.end || '08:00'}"
                                    onchange="NotificationUI.updateQuietHours()">
                            </div>
                        </div>
                    </div>
                    <div class="notification-modal-footer">
                        <button class="btn btn-primary" onclick="this.closest('.notification-modal-overlay').remove();">
                            Сохранить
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
        },

        /**
         * Переключить тихий режим
         */
        toggleQuietMode(enabled) {
            const timeSettings = document.getElementById('quiet-time-settings');
            if (timeSettings) {
                timeSettings.style.display = enabled ? 'flex' : 'none';
            }
            this.updateQuietHours();
        },

        /**
         * Обновить настройки тихого режима
         */
        updateQuietHours() {
            const enabled = document.getElementById('notif-quiet')?.checked || false;
            const start = document.getElementById('quiet-start')?.value || '22:00';
            const end = document.getElementById('quiet-end')?.value || '08:00';

            window.NotificationService.updateSettings({
                quietHours: { enabled, start, end }
            });
        },

        /**
         * Уничтожить UI
         */
        destroy() {
            if (unsubscribe) {
                unsubscribe();
            }
            if (container) {
                container.innerHTML = '';
            }
            bellElement = null;
            dropdownElement = null;
            isOpen = false;
        }
    };

    // ========== EXPORT ==========
    window.NotificationUI = NotificationUI;

    console.log('✅ NotificationUI loaded');
})();
