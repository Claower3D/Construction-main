// ========== NOTIFICATION SERVICE ==========
// Сервис управления уведомлениями
// Версия: 1.0

(function () {
    'use strict';

    const STORAGE_KEY = 'qazgost_notifications';
    const SETTINGS_KEY = 'qazgost_notification_settings';
    const MAX_NOTIFICATIONS = 100; // Макс. количество хранимых уведомлений

    // ========== INTERNAL STATE ==========
    let notifications = [];
    let settings = null;
    let listeners = [];
    let unreadCount = 0;

    // ========== STORAGE ==========
    function loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                if (!window.NotificationModels) {
                    console.warn('[NotificationService] NotificationModels not loaded, storing raw data');
                    notifications = parsed;
                } else {
                    const { Notification } = window.NotificationModels;
                    notifications = parsed.map(n => Notification.fromJSON(n));
                }
                updateUnreadCount();
            }
        } catch (e) {
            console.error('[NotificationService] Error loading:', e);
            notifications = [];
        }
    }

    function saveToStorage() {
        try {
            // Ограничиваем количество
            if (notifications.length > MAX_NOTIFICATIONS) {
                notifications = notifications.slice(-MAX_NOTIFICATIONS);
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.map(n => n.toJSON())));
        } catch (e) {
            console.error('[NotificationService] Error saving:', e);
        }
    }

    function loadSettings() {
        try {
            if (!window.NotificationModels) {
                console.warn('[NotificationService] NotificationModels not loaded, using default settings');
                settings = { soundEnabled: true, isTypeEnabled: () => true, isQuietTime: () => false, toJSON: () => ({}) };
                return;
            }
            const { NotificationSettings } = window.NotificationModels;
            const data = localStorage.getItem(SETTINGS_KEY);
            if (data) {
                settings = NotificationSettings.fromJSON(JSON.parse(data));
            } else {
                settings = new NotificationSettings({});
            }
        } catch (e) {
            console.error('[NotificationService] Error loading settings:', e);
            settings = { soundEnabled: true, isTypeEnabled: () => true, isQuietTime: () => false, toJSON: () => ({}) };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.toJSON()));
        } catch (e) {
            console.error('[NotificationService] Error saving settings:', e);
        }
    }

    // ========== HELPERS ==========
    function updateUnreadCount() {
        unreadCount = notifications.filter(n => !n.isRead && !n.isDeleted && !n.isArchived).length;
        notifyListeners('countChanged', unreadCount);
    }

    function notifyListeners(event, data) {
        listeners.forEach(listener => {
            try {
                listener(event, data);
            } catch (e) {
                console.error('[NotificationService] Listener error:', e);
            }
        });
    }

    function getCurrentUserId() {
        // Получить текущего пользователя из auth
        const user = window.Auth?.getCurrentUser?.() ||
            JSON.parse(localStorage.getItem('currentUser') || '{}');
        return user.id || 'anonymous';
    }

    function playSound() {
        if (!settings?.soundEnabled) return;
        if (settings?.isQuietTime?.()) return;

        // Простой звук уведомления (можно заменить на реальный файл)
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJitraDSkYVxW1tzhJmomqCQjnlnampzg5KalpaQjINxZGNmcH+Kko+QjIZ+cmZhYGVve4WMj4+NiYN8cmhmZGZrcnuDiIuMi4mGgXt1cG1rbG90eoCEh4iIh4WCfnp2c3Fwc3V5fYGEhoeHhoWCf3x5d3V0dHZ4e36BhISFhYSDgX98enl3d3d4e3x/gYKDg4OBgH59fHt6eXp6e3x+f4GBgoKBgX99fXx7e3t7fH1/gIGBgYCAfn19fHx8fHx9fX9/gICAf398fX19fX19fn5/f39/f39/fn5+fn5+fn5+fn9/f39/f35+fn5+fn5+fn5/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/f39/fw==');
            audio.volume = 0.3;
            audio.play().catch(() => { }); // Игнорируем ошибки автовоспроизведения
        } catch (e) {
            // Ignore
        }
    }

    // ========== NOTIFICATION SERVICE API ==========
    const NotificationService = {
        /**
         * Инициализация сервиса
         */
        init() {
            loadSettings();
            loadFromStorage();
            console.log(`✅ NotificationService initialized. ${unreadCount} unread notifications.`);
            return this;
        },

        /**
         * Создать и отправить уведомление
         */
        send(options) {
            const { Notification, NotificationType } = window.NotificationModels;

            const notification = new Notification({
                type: options.type || NotificationType.SYSTEM,
                title: options.title,
                message: options.message,
                userId: options.userId || getCurrentUserId(),
                senderId: options.senderId,
                entityType: options.entityType,
                entityId: options.entityId,
                actionUrl: options.actionUrl,
                actions: options.actions,
                metadata: options.metadata
            });

            // Проверить настройки
            if (settings && !settings.isTypeEnabled(notification.type)) {
                console.log('[NotificationService] Type disabled:', notification.type);
                return null;
            }

            // Добавить в начало списка
            notifications.unshift(notification);
            saveToStorage();
            updateUnreadCount();

            // Звук
            if (notification.needsSound()) {
                playSound();
            }

            // Уведомить слушателей
            notifyListeners('new', notification);

            console.log('[NotificationService] Sent:', notification.type, notification.message);
            return notification;
        },

        /**
         * Получить все уведомления
         */
        getAll(options = {}) {
            let result = notifications.filter(n => !n.isDeleted);

            if (options.unreadOnly) {
                result = result.filter(n => !n.isRead);
            }

            if (!options.includeArchived) {
                result = result.filter(n => !n.isArchived);
            }

            if (options.type) {
                result = result.filter(n => n.type === options.type);
            }

            if (options.entityType) {
                result = result.filter(n => n.entityType === options.entityType);
            }

            if (options.entityId) {
                result = result.filter(n => n.entityId === options.entityId);
            }

            if (options.limit) {
                result = result.slice(0, options.limit);
            }

            return result;
        },

        /**
         * Получить по ID
         */
        getById(id) {
            return notifications.find(n => n.id === id);
        },

        /**
         * Получить количество непрочитанных
         */
        getUnreadCount() {
            return unreadCount;
        },

        /**
         * Отметить прочитанным
         */
        markAsRead(id) {
            const notification = this.getById(id);
            if (notification) {
                notification.markAsRead();
                saveToStorage();
                updateUnreadCount();
                notifyListeners('read', notification);
            }
            return notification;
        },

        /**
         * Отметить все прочитанными
         */
        markAllAsRead() {
            let count = 0;
            notifications.forEach(n => {
                if (!n.isRead && !n.isDeleted && !n.isArchived) {
                    n.markAsRead();
                    count++;
                }
            });
            saveToStorage();
            updateUnreadCount();
            notifyListeners('allRead', count);
            return count;
        },

        /**
         * Архивировать
         */
        archive(id) {
            const notification = this.getById(id);
            if (notification) {
                notification.archive();
                saveToStorage();
                updateUnreadCount();
                notifyListeners('archived', notification);
            }
            return notification;
        },

        /**
         * Удалить
         */
        delete(id) {
            const notification = this.getById(id);
            if (notification) {
                notification.delete();
                saveToStorage();
                updateUnreadCount();
                notifyListeners('deleted', notification);
            }
            return notification;
        },

        /**
         * Очистить все прочитанные
         */
        clearRead() {
            notifications = notifications.filter(n => !n.isRead || n.isDeleted);
            saveToStorage();
            notifyListeners('cleared');
            return true;
        },

        /**
         * Очистить все
         */
        clearAll() {
            notifications = [];
            saveToStorage();
            updateUnreadCount();
            notifyListeners('clearedAll');
            return true;
        },

        // ========== SETTINGS ==========

        /**
         * Получить настройки
         */
        getSettings() {
            return settings;
        },

        /**
         * Обновить настройки
         */
        updateSettings(newSettings) {
            const { NotificationSettings } = window.NotificationModels;
            settings = new NotificationSettings({
                ...settings?.toJSON(),
                ...newSettings
            });
            saveSettings();
            notifyListeners('settingsChanged', settings);
            return settings;
        },

        /**
         * Включить/выключить звук
         */
        toggleSound(enabled) {
            if (settings) {
                settings.soundEnabled = enabled;
                saveSettings();
            }
            return settings?.soundEnabled;
        },

        // ========== LISTENERS ==========

        /**
         * Подписаться на события
         */
        subscribe(callback) {
            if (typeof callback === 'function') {
                listeners.push(callback);
            }
            return () => this.unsubscribe(callback);
        },

        /**
         * Отписаться от событий
         */
        unsubscribe(callback) {
            listeners = listeners.filter(l => l !== callback);
        },

        // ========== HELPER METHODS ==========

        /**
         * Отправить уведомление о новом сообщении
         */
        notifyNewMessage(chatId, senderId, senderName, preview) {
            const { NotificationType } = window.NotificationModels;
            return this.send({
                type: NotificationType.NEW_MESSAGE,
                title: `Сообщение от ${senderName}`,
                message: preview.length > 50 ? preview.substring(0, 50) + '...' : preview,
                senderId,
                entityType: 'chat',
                entityId: chatId,
                actionUrl: `#chat/${chatId}`
            });
        },

        /**
         * Отправить уведомление об изменении статуса заказа
         */
        notifyOrderStatus(orderId, orderTitle, newStatus, oldStatus) {
            const { NotificationType } = window.NotificationModels;

            const statusMap = {
                'PUBLISHED': {
                    type: NotificationType.ORDER_PUBLISHED,
                    message: `Заказ "${orderTitle}" опубликован`
                },
                'IN_WORK': {
                    type: NotificationType.WORK_STARTED,
                    message: `Работа по заказу "${orderTitle}" начата`
                },
                'ON_REVIEW': {
                    type: NotificationType.WORK_SUBMITTED,
                    message: `Работа по заказу "${orderTitle}" на проверке`
                },
                'DONE': {
                    type: NotificationType.ORDER_COMPLETED,
                    message: `Заказ "${orderTitle}" завершён`
                },
                'CANCELLED': {
                    type: NotificationType.ORDER_CANCELLED,
                    message: `Заказ "${orderTitle}" отменён`
                }
            };

            const config = statusMap[newStatus];
            if (!config) return null;

            return this.send({
                type: config.type,
                message: config.message,
                entityType: 'order',
                entityId: orderId,
                actionUrl: `#order/${orderId}`,
                metadata: { oldStatus, newStatus }
            });
        },

        /**
         * Отправить напоминание
         */
        notifyReminder(title, message, actionUrl) {
            const { NotificationType } = window.NotificationModels;
            return this.send({
                type: NotificationType.REMINDER,
                title,
                message,
                actionUrl
            });
        },

        /**
         * Отправить уведомление о дедлайне
         */
        notifyDeadline(entityType, entityId, title, isApproaching = true) {
            const { NotificationType } = window.NotificationModels;
            return this.send({
                type: isApproaching ? NotificationType.DEADLINE_APPROACHING : NotificationType.DEADLINE_MISSED,
                title: isApproaching ? 'Дедлайн приближается' : 'Дедлайн пропущен',
                message: title,
                entityType,
                entityId,
                actionUrl: `#${entityType}/${entityId}`
            });
        },

        /**
         * Отправить уведомление инженеру
         */
        notifyEngineerRequired(estimateId, reason) {
            const { NotificationType } = window.NotificationModels;
            return this.send({
                type: NotificationType.ENGINEER_REQUIRED,
                title: 'Требуется проверка инженера',
                message: reason,
                entityType: 'estimate',
                entityId: estimateId,
                actionUrl: `#estimate/${estimateId}`
            });
        },

        /**
         * Отправить уведомление об оплате
         */
        notifyPayment(type, amount, currency = '₸') {
            const { NotificationType } = window.NotificationModels;
            const isReceived = type === 'received';
            return this.send({
                type: isReceived ? NotificationType.PAYMENT_RECEIVED : NotificationType.PAYMENT_PENDING,
                title: isReceived ? 'Платёж получен' : 'Ожидается оплата',
                message: `${amount.toLocaleString('ru-RU')} ${currency}`,
                metadata: { amount, currency }
            });
        },

        // ========== DEMO ==========

        /**
         * Демо: отправить тестовые уведомления
         */
        demo() {
            const { NotificationType } = window.NotificationModels;

            const demoNotifications = [
                {
                    type: NotificationType.NEW_MESSAGE,
                    title: 'Новое сообщение',
                    message: 'Иван Петров: Здравствуйте! Хотел уточнить по смете...',
                    entityType: 'chat',
                    entityId: 'chat_demo_1'
                },
                {
                    type: NotificationType.ORDER_ACCEPTED,
                    title: 'Заявка принята!',
                    message: 'Ваша заявка на заказ "Ремонт кровли" принята заказчиком',
                    entityType: 'order',
                    entityId: 'order_demo_1'
                },
                {
                    type: NotificationType.PAYMENT_RECEIVED,
                    title: 'Платёж получен',
                    message: '150 000 ₸ зачислено на ваш баланс',
                    metadata: { amount: 150000 }
                },
                {
                    type: NotificationType.DEADLINE_APPROACHING,
                    title: 'Дедлайн приближается',
                    message: 'До завершения заказа "Отделочные работы" осталось 2 дня',
                    entityType: 'order',
                    entityId: 'order_demo_2'
                },
                {
                    type: NotificationType.ENGINEER_REQUIRED,
                    title: 'Требуется проверка инженера',
                    message: 'Смета SM-2024-001 имеет низкий уровень уверенности (45%)',
                    entityType: 'estimate',
                    entityId: 'estimate_demo_1'
                }
            ];

            let delay = 0;
            demoNotifications.forEach((notif, index) => {
                setTimeout(() => {
                    this.send(notif);
                }, delay);
                delay += 1500; // 1.5 сек между уведомлениями
            });

            console.log('🎬 Demo notifications started. 5 notifications will appear.');
            return `Демо запущено. ${demoNotifications.length} уведомлений будут отправлены.`;
        },

        /**
         * Очистить демо-данные
         */
        clearDemo() {
            const demoIds = notifications
                .filter(n => n.entityId?.includes('demo'))
                .map(n => n.id);

            demoIds.forEach(id => this.delete(id));
            return `Удалено ${demoIds.length} демо-уведомлений`;
        }
    };

    // ========== EXPORT ==========
    window.NotificationService = NotificationService;

    // Авто-инициализация
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NotificationService.init());
    } else {
        NotificationService.init();
    }

    console.log('✅ NotificationService loaded');
})();
