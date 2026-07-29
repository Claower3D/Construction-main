// ========== NOTIFICATION MODELS ==========
// Модели уведомлений для QAZGOST AI
// Версия: 1.0

(function () {
    'use strict';

    // ========== NOTIFICATION TYPES ==========
    const NotificationType = {
        // Сообщения
        NEW_MESSAGE: 'NEW_MESSAGE',           // Новое сообщение в чате

        // Заказы
        ORDER_CREATED: 'ORDER_CREATED',       // Заказ создан
        ORDER_PUBLISHED: 'ORDER_PUBLISHED',   // Заказ опубликован
        ORDER_ACCEPTED: 'ORDER_ACCEPTED',     // Заявка принята
        ORDER_REJECTED: 'ORDER_REJECTED',     // Заявка отклонена
        ORDER_COMPLETED: 'ORDER_COMPLETED',   // Заказ завершён
        ORDER_CANCELLED: 'ORDER_CANCELLED',   // Заказ отменён

        // Сметы
        ESTIMATE_CREATED: 'ESTIMATE_CREATED', // Смета создана
        ESTIMATE_UPDATED: 'ESTIMATE_UPDATED', // Смета обновлена
        ESTIMATE_APPROVED: 'ESTIMATE_APPROVED', // Смета одобрена

        // Работа
        WORK_STARTED: 'WORK_STARTED',         // Работа начата
        WORK_SUBMITTED: 'WORK_SUBMITTED',     // Работа на проверке
        WORK_ACCEPTED: 'WORK_ACCEPTED',       // Работа принята
        WORK_REJECTED: 'WORK_REJECTED',       // Работа отклонена

        // Платежи
        PAYMENT_RECEIVED: 'PAYMENT_RECEIVED', // Платёж получен
        PAYMENT_PENDING: 'PAYMENT_PENDING',   // Ожидается оплата

        // Напоминания
        REMINDER: 'REMINDER',                 // Напоминание
        DEADLINE_APPROACHING: 'DEADLINE_APPROACHING', // Дедлайн приближается
        DEADLINE_MISSED: 'DEADLINE_MISSED',   // Дедлайн пропущен

        // Система
        SYSTEM: 'SYSTEM',                     // Системное уведомление
        ENGINEER_REQUIRED: 'ENGINEER_REQUIRED', // Требуется проверка инженера

        // VIP
        LOT_PUBLISHED: 'LOT_PUBLISHED',       // Лот опубликован
        BID_RECEIVED: 'BID_RECEIVED',         // Получен отклик
        BID_ACCEPTED: 'BID_ACCEPTED',         // Отклик принят
    };

    // ========== NOTIFICATION PRIORITY ==========
    const NotificationPriority = {
        LOW: 'LOW',           // Информационные
        MEDIUM: 'MEDIUM',     // Важные
        HIGH: 'HIGH',         // Срочные
        URGENT: 'URGENT'      // Критические
    };

    // ========== NOTIFICATION CONFIG ==========
    const NotificationConfig = {
        [NotificationType.NEW_MESSAGE]: {
            icon: '💬',
            color: '#3b82f6',
            priority: NotificationPriority.MEDIUM,
            sound: true,
            title: 'Новое сообщение'
        },
        [NotificationType.ORDER_CREATED]: {
            icon: '📋',
            color: '#22c55e',
            priority: NotificationPriority.MEDIUM,
            sound: false,
            title: 'Заказ создан'
        },
        [NotificationType.ORDER_PUBLISHED]: {
            icon: '🚀',
            color: '#8b5cf6',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Заказ опубликован'
        },
        [NotificationType.ORDER_ACCEPTED]: {
            icon: '✅',
            color: '#22c55e',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Заявка принята'
        },
        [NotificationType.ORDER_REJECTED]: {
            icon: '❌',
            color: '#ef4444',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Заявка отклонена'
        },
        [NotificationType.ORDER_COMPLETED]: {
            icon: '🎉',
            color: '#22c55e',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Заказ завершён'
        },
        [NotificationType.ESTIMATE_CREATED]: {
            icon: '📊',
            color: '#06b6d4',
            priority: NotificationPriority.MEDIUM,
            sound: false,
            title: 'Смета создана'
        },
        [NotificationType.ESTIMATE_UPDATED]: {
            icon: '🔄',
            color: '#f59e0b',
            priority: NotificationPriority.MEDIUM,
            sound: false,
            title: 'Смета обновлена'
        },
        [NotificationType.WORK_SUBMITTED]: {
            icon: '📤',
            color: '#8b5cf6',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Работа на проверке'
        },
        [NotificationType.WORK_ACCEPTED]: {
            icon: '✅',
            color: '#22c55e',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Работа принята'
        },
        [NotificationType.PAYMENT_RECEIVED]: {
            icon: '💰',
            color: '#22c55e',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Платёж получен'
        },
        [NotificationType.PAYMENT_PENDING]: {
            icon: '⏳',
            color: '#f59e0b',
            priority: NotificationPriority.MEDIUM,
            sound: false,
            title: 'Ожидается оплата'
        },
        [NotificationType.REMINDER]: {
            icon: '🔔',
            color: '#64748b',
            priority: NotificationPriority.LOW,
            sound: false,
            title: 'Напоминание'
        },
        [NotificationType.DEADLINE_APPROACHING]: {
            icon: '⏰',
            color: '#f59e0b',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Дедлайн приближается'
        },
        [NotificationType.DEADLINE_MISSED]: {
            icon: '🚨',
            color: '#ef4444',
            priority: NotificationPriority.URGENT,
            sound: true,
            title: 'Дедлайн пропущен'
        },
        [NotificationType.ENGINEER_REQUIRED]: {
            icon: '👷',
            color: '#f59e0b',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Требуется проверка'
        },
        [NotificationType.SYSTEM]: {
            icon: 'ℹ️',
            color: '#64748b',
            priority: NotificationPriority.LOW,
            sound: false,
            title: 'Системное уведомление'
        },
        [NotificationType.LOT_PUBLISHED]: {
            icon: '📢',
            color: '#8b5cf6',
            priority: NotificationPriority.MEDIUM,
            sound: false,
            title: 'Лот опубликован'
        },
        [NotificationType.BID_RECEIVED]: {
            icon: '📨',
            color: '#06b6d4',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Новый отклик'
        },
        [NotificationType.BID_ACCEPTED]: {
            icon: '🤝',
            color: '#22c55e',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Отклик принят'
        },
        [NotificationType.ORDER_CANCELLED]: {
            icon: '🚫',
            color: '#ef4444',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Заказ отменён'
        },
        [NotificationType.ESTIMATE_APPROVED]: {
            icon: '✅',
            color: '#22c55e',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Смета одобрена'
        },
        [NotificationType.WORK_STARTED]: {
            icon: '🚀',
            color: '#8b5cf6',
            priority: NotificationPriority.MEDIUM,
            sound: false,
            title: 'Работа начата'
        },
        [NotificationType.WORK_REJECTED]: {
            icon: '❌',
            color: '#ef4444',
            priority: NotificationPriority.HIGH,
            sound: true,
            title: 'Работа отклонена'
        }
    };

    // ========== NOTIFICATION MODEL ==========
    class Notification {
        constructor(data = {}) {
            this.id = data.id || 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
            this.type = data.type || NotificationType.SYSTEM;
            this.title = data.title || '';
            this.message = data.message || '';
            this.userId = data.userId || null;        // Для кого уведомление
            this.senderId = data.senderId || null;    // От кого (опционально)

            // Связанная сущность
            this.entityType = data.entityType || null; // 'order', 'estimate', 'message', 'lot', etc.
            this.entityId = data.entityId || null;

            // Статусы
            this.isRead = data.isRead || false;
            this.isArchived = data.isArchived || false;
            this.isDeleted = data.isDeleted || false;

            // Время
            this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
            this.readAt = data.readAt ? new Date(data.readAt) : null;

            // Действия
            this.actionUrl = data.actionUrl || null;  // Куда перейти при клике
            this.actions = data.actions || [];        // Кнопки действий [{label, action}]

            // Meta
            this.metadata = data.metadata || {};
        }

        // Получить конфиг для типа
        getConfig() {
            return NotificationConfig[this.type] || NotificationConfig[NotificationType.SYSTEM];
        }

        // Получить иконку
        getIcon() {
            return this.getConfig().icon;
        }

        // Получить цвет
        getColor() {
            return this.getConfig().color;
        }

        // Получить приоритет
        getPriority() {
            return this.getConfig().priority;
        }

        // Нужен ли звук
        needsSound() {
            return this.getConfig().sound && !this.isRead;
        }

        // Получить заголовок (кастомный или дефолтный)
        getTitle() {
            return this.title || this.getConfig().title;
        }

        // Отметить прочитанным
        markAsRead() {
            if (!this.isRead) {
                this.isRead = true;
                this.readAt = new Date();
            }
            return this;
        }

        // Отметить непрочитанным
        markAsUnread() {
            this.isRead = false;
            this.readAt = null;
            return this;
        }

        // Архивировать
        archive() {
            this.isArchived = true;
            return this;
        }

        // Удалить
        delete() {
            this.isDeleted = true;
            return this;
        }

        // Относительное время
        getRelativeTime() {
            const now = new Date();
            const diff = now - this.createdAt;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);

            if (minutes < 1) return 'Только что';
            if (minutes < 60) return `${minutes} мин назад`;
            if (hours < 24) return `${hours} ч назад`;
            if (days < 7) return `${days} д назад`;

            return this.createdAt.toLocaleDateString('ru-RU');
        }

        // Валидация
        validate() {
            const errors = [];

            if (!this.type) errors.push('Тип уведомления обязателен');
            if (!this.message && !this.title) errors.push('Сообщение или заголовок обязательны');

            return {
                valid: errors.length === 0,
                errors
            };
        }

        // Сериализация
        toJSON() {
            return {
                id: this.id,
                type: this.type,
                title: this.title,
                message: this.message,
                userId: this.userId,
                senderId: this.senderId,
                entityType: this.entityType,
                entityId: this.entityId,
                isRead: this.isRead,
                isArchived: this.isArchived,
                isDeleted: this.isDeleted,
                createdAt: this.createdAt.toISOString(),
                readAt: this.readAt ? this.readAt.toISOString() : null,
                actionUrl: this.actionUrl,
                actions: this.actions,
                metadata: this.metadata
            };
        }

        // Десериализация
        static fromJSON(json) {
            return new Notification(json);
        }
    }

    // ========== USER NOTIFICATION SETTINGS ==========
    class NotificationSettings {
        constructor(data = {}) {
            this.userId = data.userId || null;

            // Каналы
            this.channels = {
                inApp: data.channels?.inApp !== false,
                email: data.channels?.email || false,
                push: data.channels?.push || false,
                sms: data.channels?.sms || false
            };

            // Типы уведомлений
            this.enabledTypes = data.enabledTypes || Object.values(NotificationType);

            // Тихий режим
            this.quietHours = {
                enabled: data.quietHours?.enabled || false,
                start: data.quietHours?.start || '22:00',
                end: data.quietHours?.end || '08:00'
            };

            // Звуки
            this.soundEnabled = data.soundEnabled !== false;

            this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
        }

        // Проверить, включён ли тип
        isTypeEnabled(type) {
            return this.enabledTypes.includes(type);
        }

        // Проверить тихий режим
        isQuietTime() {
            if (!this.quietHours.enabled) return false;

            const now = new Date();
            const currentTime = now.getHours() * 60 + now.getMinutes();

            const [startH, startM] = this.quietHours.start.split(':').map(Number);
            const [endH, endM] = this.quietHours.end.split(':').map(Number);

            const startTime = startH * 60 + startM;
            const endTime = endH * 60 + endM;

            if (startTime < endTime) {
                return currentTime >= startTime && currentTime < endTime;
            } else {
                // Через полночь
                return currentTime >= startTime || currentTime < endTime;
            }
        }

        // Сериализация
        toJSON() {
            return {
                userId: this.userId,
                channels: this.channels,
                enabledTypes: this.enabledTypes,
                quietHours: this.quietHours,
                soundEnabled: this.soundEnabled,
                updatedAt: this.updatedAt.toISOString()
            };
        }

        static fromJSON(json) {
            return new NotificationSettings(json);
        }
    }

    // ========== EXPORTS ==========
    window.NotificationModels = {
        Notification,
        NotificationSettings,
        NotificationType,
        NotificationPriority,
        NotificationConfig
    };

    console.log('✅ NotificationModels loaded');
})();
