// ========== STATUS MACHINE ==========
// Единый модуль управления статусами для QazGost AI
// Все разрешённые переходы и бизнес-логика в одном месте

(function () {
    'use strict';

    if (!window.Models) {
        console.error('[StatusMachine] window.Models is not loaded. Ensure models.js is included before statusMachine.js.');
        return;
    }
    const { OrderStatus, ApplicationStatus, WorkStatus, StageStatus, DefectStatus, AuditLog } = window.Models;

    // ========== TRANSITION RULES ==========
    const TransitionRules = {
        // Order: DRAFT → PUBLISHED → IN_WORK → ON_REVIEW → DONE
        Order: {
            [OrderStatus.DRAFT]: [OrderStatus.PUBLISHED, OrderStatus.CANCELLED],
            [OrderStatus.PUBLISHED]: [OrderStatus.IN_WORK, OrderStatus.CANCELLED],
            [OrderStatus.IN_WORK]: [OrderStatus.ON_REVIEW],
            [OrderStatus.ON_REVIEW]: [OrderStatus.DONE, OrderStatus.IN_WORK], // IN_WORK = возврат на доработку
            [OrderStatus.DONE]: [],
            [OrderStatus.CANCELLED]: []
        },

        // Application: DRAFT → SENT → REVIEW → ACCEPTED | REJECTED
        Application: {
            [ApplicationStatus.DRAFT]: [ApplicationStatus.SENT],
            [ApplicationStatus.SENT]: [ApplicationStatus.REVIEW, ApplicationStatus.REJECTED],
            [ApplicationStatus.REVIEW]: [ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED],
            [ApplicationStatus.ACCEPTED]: [],
            [ApplicationStatus.REJECTED]: []
        },

        // Work: IN_WORK → ON_REVIEW → FIXES → DONE
        Work: {
            [WorkStatus.IN_WORK]: [WorkStatus.ON_REVIEW],
            [WorkStatus.ON_REVIEW]: [WorkStatus.DONE, WorkStatus.FIXES],
            [WorkStatus.FIXES]: [WorkStatus.ON_REVIEW],
            [WorkStatus.DONE]: []
        },

        // Stage: PLAN → IN_WORK → ON_REVIEW → ACCEPTED
        Stage: {
            [StageStatus.PLAN]: [StageStatus.IN_WORK],
            [StageStatus.IN_WORK]: [StageStatus.ON_REVIEW],
            [StageStatus.ON_REVIEW]: [StageStatus.ACCEPTED, StageStatus.IN_WORK],
            [StageStatus.ACCEPTED]: []
        },

        // Defect: NEW → IN_FIX → FIXED → CONFIRMED
        Defect: {
            [DefectStatus.NEW]: [DefectStatus.IN_FIX],
            [DefectStatus.IN_FIX]: [DefectStatus.FIXED],
            [DefectStatus.FIXED]: [DefectStatus.CONFIRMED, DefectStatus.IN_FIX], // IN_FIX = не исправлено
            [DefectStatus.CONFIRMED]: []
        }
    };

    // ========== STATUS LABELS (RU) ==========
    const StatusLabels = {
        Order: {
            [OrderStatus.DRAFT]: { label: 'Черновик', icon: '📝', color: '#6b7280' },
            [OrderStatus.PUBLISHED]: { label: 'Опубликован', icon: '📢', color: '#3b82f6' },
            [OrderStatus.IN_WORK]: { label: 'В работе', icon: '🔧', color: '#f59e0b' },
            [OrderStatus.ON_REVIEW]: { label: 'На проверке', icon: '🔍', color: '#8b5cf6' },
            [OrderStatus.DONE]: { label: 'Завершён', icon: '✅', color: '#22c55e' },
            [OrderStatus.CANCELLED]: { label: 'Отменён', icon: '❌', color: '#ef4444' }
        },
        Application: {
            [ApplicationStatus.DRAFT]: { label: 'Черновик', icon: '📝', color: '#6b7280' },
            [ApplicationStatus.SENT]: { label: 'Отправлена', icon: '📤', color: '#3b82f6' },
            [ApplicationStatus.REVIEW]: { label: 'Рассматривается', icon: '👀', color: '#f59e0b' },
            [ApplicationStatus.ACCEPTED]: { label: 'Принята', icon: '✅', color: '#22c55e' },
            [ApplicationStatus.REJECTED]: { label: 'Отклонена', icon: '❌', color: '#ef4444' }
        },
        Work: {
            [WorkStatus.IN_WORK]: { label: 'В работе', icon: '🔧', color: '#f59e0b' },
            [WorkStatus.ON_REVIEW]: { label: 'На проверке', icon: '🔍', color: '#8b5cf6' },
            [WorkStatus.FIXES]: { label: 'Доработка', icon: '⚠️', color: '#ef4444' },
            [WorkStatus.DONE]: { label: 'Завершено', icon: '✅', color: '#22c55e' }
        },
        Stage: {
            [StageStatus.PLAN]: { label: 'Запланирован', icon: '📅', color: '#6b7280' },
            [StageStatus.IN_WORK]: { label: 'В работе', icon: '🔧', color: '#f59e0b' },
            [StageStatus.ON_REVIEW]: { label: 'На проверке', icon: '🔍', color: '#8b5cf6' },
            [StageStatus.ACCEPTED]: { label: 'Принят', icon: '✅', color: '#22c55e' }
        },
        Defect: {
            [DefectStatus.NEW]: { label: 'Новый', icon: '🆕', color: '#ef4444' },
            [DefectStatus.IN_FIX]: { label: 'Исправляется', icon: '🔧', color: '#f59e0b' },
            [DefectStatus.FIXED]: { label: 'Исправлен', icon: '✔️', color: '#3b82f6' },
            [DefectStatus.CONFIRMED]: { label: 'Подтверждён', icon: '✅', color: '#22c55e' }
        }
    };

    // ========== MAIN FUNCTIONS ==========

    /**
     * Check if transition is allowed
     * @param {string} entityType - 'Order', 'Application', 'Work', 'Stage', 'Defect'
     * @param {string} fromStatus - current status
     * @param {string} toStatus - target status
     * @returns {boolean}
     */
    function canTransition(entityType, fromStatus, toStatus) {
        const rules = TransitionRules[entityType];
        if (!rules) {
            console.error(`Unknown entity type: ${entityType}`);
            return false;
        }

        const allowed = rules[fromStatus];
        if (!allowed) {
            console.error(`Unknown status: ${fromStatus} for ${entityType}`);
            return false;
        }

        return allowed.includes(toStatus);
    }

    /**
     * Get allowed transitions from current status
     * @param {string} entityType
     * @param {string} currentStatus
     * @returns {string[]} array of allowed target statuses
     */
    function getAllowedTransitions(entityType, currentStatus) {
        const rules = TransitionRules[entityType];
        if (!rules) return [];
        return rules[currentStatus] || [];
    }

    /**
     * Perform status transition with validation and audit logging
     * @param {object} entity - entity object with id and status
     * @param {string} entityType - 'Order', 'Application', etc.
     * @param {string} toStatus - target status
     * @param {object} actor - user performing the action { id, role, name }
     * @param {object} meta - additional metadata
     * @returns {object} { success: boolean, error?: string }
     */
    function transition(entity, entityType, toStatus, actor = {}, meta = {}) {
        const fromStatus = entity.status;

        // Check if transition is allowed
        if (!canTransition(entityType, fromStatus, toStatus)) {
            const error = `Переход ${fromStatus} → ${toStatus} запрещён для ${entityType}`;
            console.error(error);
            return { success: false, error };
        }

        // Update entity status
        entity.status = toStatus;
        entity.updatedAt = new Date().toISOString();

        // Add timestamp for specific status changes
        if (entityType === 'Order') {
            if (toStatus === OrderStatus.PUBLISHED) entity.publishedAt = new Date().toISOString();
            if (toStatus === OrderStatus.IN_WORK) entity.startedAt = new Date().toISOString();
            if (toStatus === OrderStatus.DONE) entity.completedAt = new Date().toISOString();
        }

        if (entityType === 'Work') {
            if (toStatus === WorkStatus.ON_REVIEW) entity.submittedAt = new Date().toISOString();
            if (toStatus === WorkStatus.DONE) entity.completedAt = new Date().toISOString();
        }

        if (entityType === 'Defect') {
            if (toStatus === DefectStatus.FIXED) entity.fixedAt = new Date().toISOString();
            if (toStatus === DefectStatus.CONFIRMED) entity.confirmedAt = new Date().toISOString();
        }

        // Save entity
        entity.save();

        // Create audit log
        AuditLog.log(entityType.toLowerCase(), entity.id, 'statusChanged', {
            fromStatus,
            toStatus,
            meta
        });

        console.log(`✅ ${entityType} ${entity.id}: ${fromStatus} → ${toStatus}`);
        return { success: true };
    }

    /**
     * Get status label info
     * @param {string} entityType
     * @param {string} status
     * @returns {object} { label, icon, color }
     */
    function getStatusLabel(entityType, status) {
        const labels = StatusLabels[entityType];
        if (!labels) return { label: status, icon: '❓', color: '#6b7280' };
        return labels[status] || { label: status, icon: '❓', color: '#6b7280' };
    }

    /**
     * Render status badge HTML
     * @param {string} entityType
     * @param {string} status
     * @returns {string} HTML string
     */
    function renderStatusBadge(entityType, status) {
        const info = getStatusLabel(entityType, status);
        return `<span class="status-badge" style="background:${info.color}20;color:${info.color};border:1px solid ${info.color}40;padding:0.25rem 0.75rem;border-radius:20px;font-size:0.75rem;font-weight:600;display:inline-flex;align-items:center;gap:0.25rem">
            <span>${info.icon}</span>
            <span>${info.label}</span>
        </span>`;
    }

    // ========== BUSINESS LOGIC HELPERS ==========

    /**
     * Check if customer profile is complete for publishing orders
     */
    function canCustomerPublishOrders(customerId) {
        const { CustomerProfile } = window.Models;
        const profile = CustomerProfile.findByUserId(customerId);
        return profile && profile.isComplete;
    }

    /**
     * Check if executor profile is complete for applying to orders
     */
    function canExecutorApply(executorId) {
        const { ExecutorProfile } = window.Models;
        const profile = ExecutorProfile.findByUserId(executorId);
        return profile && profile.isComplete;
    }

    /**
     * Publish order with profile validation
     */
    function publishOrder(order, actor) {
        // Check customer profile
        if (!canCustomerPublishOrders(order.customerId)) {
            return {
                success: false,
                error: 'Заполните профиль заказчика перед публикацией',
                code: 'PROFILE_INCOMPLETE'
            };
        }

        // Validate order data
        const errors = order.validate();
        if (errors.length > 0) {
            return { success: false, error: errors.join(', '), code: 'VALIDATION_ERROR' };
        }

        // Perform transition
        return transition(order, 'Order', OrderStatus.PUBLISHED, actor);
    }

    /**
     * Apply to order with profile validation
     */
    function applyToOrder(order, executorId, applicationData, actor) {
        const { Application } = window.Models;

        // Check executor profile
        if (!canExecutorApply(executorId)) {
            return {
                success: false,
                error: 'Заполните анкету исполнителя перед откликом',
                code: 'PROFILE_INCOMPLETE'
            };
        }

        // Check if already applied
        if (Application.existsForOrder(order.id, executorId)) {
            return { success: false, error: 'Вы уже откликались на этот заказ', code: 'ALREADY_APPLIED' };
        }

        // Check order status
        if (order.status !== OrderStatus.PUBLISHED) {
            return { success: false, error: 'Заказ недоступен для отклика', code: 'INVALID_STATUS' };
        }

        // Create application
        const app = new Application({
            orderId: order.id,
            executorId,
            status: ApplicationStatus.SENT,
            ...applicationData
        });

        const validation = app.validate();
        if (validation.length > 0) {
            return { success: false, error: validation.join(', '), code: 'VALIDATION_ERROR' };
        }

        app.save();

        // Update order applications count
        order.applicationsCount = (order.applicationsCount || 0) + 1;
        order.save();

        // Log
        AuditLog.log('application', app.id, 'created', { orderId: order.id });

        return { success: true, application: app };
    }

    /**
     * Accept application and create work
     * NOTE: После принятия отклика исполнитель должен "Закрепить заказ" (оплатить 3%)
     */
    function acceptApplication(application, order, actor) {
        const { Work } = window.Models;

        if (application.status !== ApplicationStatus.SENT && application.status !== ApplicationStatus.REVIEW) {
            return { success: false, error: 'Заявка не может быть принята' };
        }

        // Update application status
        const result = transition(application, 'Application', ApplicationStatus.ACCEPTED, actor);
        if (!result.success) return result;

        // === FINANCE: Устанавливаем сумму сделки для расчёта комиссии 3% ===
        // Источник: цена отклика или бюджет заказа
        order.acceptedApplicationId = application.id;
        order.contractAmountKZT = application.price || order.budget || order.budgetMax || 0;
        // Исполнитель теперь может "Закрепить заказ" (оплатить комиссию)

        // Create work
        const work = new Work({
            orderId: order.id,
            executorId: application.executorId,
            applicationId: application.id,
            status: WorkStatus.IN_WORK,
            agreedPrice: application.price,
            agreedDuration: application.duration,
            startDate: application.startDate || new Date().toISOString()
        });

        if (application.duration) {
            const startDate = new Date(work.startDate);
            startDate.setDate(startDate.getDate() + application.duration);
            work.plannedEndDate = startDate.toISOString();
        }

        work.save();

        // Update order - теперь переход в IN_WORK только после оплаты комиссии
        // Но для совместимости оставляем старое поведение
        order.executorId = application.executorId;
        transition(order, 'Order', OrderStatus.IN_WORK, actor);

        // Reject other applications
        const { Application } = window.Models;
        const otherApps = Application.findByOrder(order.id)
            .filter(a => a.id !== application.id && a.status === ApplicationStatus.SENT);

        otherApps.forEach(app => {
            app.status = ApplicationStatus.REJECTED;
            app.rejectionReason = 'Выбран другой исполнитель';
            app.save();
        });

        AuditLog.log('work', work.id, 'created', { orderId: order.id, applicationId: application.id });

        return { success: true, work };
    }

    /**
     * Submit work for review
     */
    function submitWork(work, submissionData, actor) {
        if (work.status !== WorkStatus.IN_WORK && work.status !== WorkStatus.FIXES) {
            return { success: false, error: 'Работа не может быть сдана' };
        }

        work.submissionPhotos = submissionData.photos || [];
        work.submissionComment = submissionData.comment || '';

        const { Order } = window.Models;
        const order = Order.find(work.orderId);

        // Transition work
        const result = transition(work, 'Work', WorkStatus.ON_REVIEW, actor);
        if (!result.success) return result;

        // Transition order
        if (order && order.status === OrderStatus.IN_WORK) {
            transition(order, 'Order', OrderStatus.ON_REVIEW, actor);
        }

        return { success: true };
    }

    /**
     * Accept work and complete order
     */
    function acceptWork(work, actor) {
        const { Order, Defect } = window.Models;

        // Check for unresolved defects
        const unresolvedDefects = Defect.countUnresolved(work.orderId);
        if (unresolvedDefects > 0) {
            return {
                success: false,
                error: `Есть ${unresolvedDefects} неподтверждённых дефектов`,
                code: 'UNRESOLVED_DEFECTS'
            };
        }

        // Transition work
        const result = transition(work, 'Work', WorkStatus.DONE, actor);
        if (!result.success) return result;

        // Transition order
        const order = Order.find(work.orderId);
        if (order) {
            transition(order, 'Order', OrderStatus.DONE, actor);
        }

        return { success: true };
    }

    /**
     * Reject work (send back for fixes)
     */
    function rejectWork(work, reason, actor) {
        const { Order } = window.Models;

        work.rejectionReason = reason;
        const result = transition(work, 'Work', WorkStatus.FIXES, actor);
        if (!result.success) return result;

        const order = Order.find(work.orderId);
        if (order && order.status === OrderStatus.ON_REVIEW) {
            transition(order, 'Order', OrderStatus.IN_WORK, actor);
        }

        return { success: true };
    }

    // ========== BUSINESS RULE TIMERS (24ч, 72ч) ==========

    /**
     * Правила дедлайнов:
     * - APPLICATION_REVIEW: 24ч — заказчик должен рассмотреть отклик
     * - WORK_START: 72ч — исполнитель должен начать работу после принятия
     * - WORK_REVIEW: 48ч — заказчик должен проверить сданную работу
     * - DEFECT_FIX: 24ч — исполнитель должен начать исправление дефекта
     * - ORDER_PUBLISH_EXPIRE: 72ч — заказ автоматически снимается если нет откликов
     */

    const DeadlineRule = Object.freeze({
        APPLICATION_REVIEW: {
            code: 'APPLICATION_REVIEW',
            label: 'Рассмотрение отклика',
            hours: 24,
            entityType: 'Application',
            triggerStatus: ApplicationStatus.SENT,
            warningPercent: 75, // предупреждение при 75% истечения
            action: 'auto_reject',
            message: '⏰ Время рассмотрения отклика истекло (24ч)'
        },
        WORK_START: {
            code: 'WORK_START',
            label: 'Начало работ',
            hours: 72,
            entityType: 'Order',
            triggerStatus: OrderStatus.IN_WORK,
            warningPercent: 50,
            action: 'notify_warning',
            message: '⏰ Исполнитель не начал работу в течение 72ч'
        },
        WORK_REVIEW: {
            code: 'WORK_REVIEW',
            label: 'Проверка работы',
            hours: 48,
            entityType: 'Work',
            triggerStatus: WorkStatus.ON_REVIEW,
            warningPercent: 75,
            action: 'auto_accept',
            message: '⏰ Время проверки работы истекло (48ч) — автоприёмка'
        },
        DEFECT_FIX: {
            code: 'DEFECT_FIX',
            label: 'Исправление дефекта',
            hours: 24,
            entityType: 'Defect',
            triggerStatus: DefectStatus.IN_FIX,
            warningPercent: 75,
            action: 'escalate',
            message: '⏰ Дефект не исправлен в течение 24ч — эскалация'
        },
        ORDER_PUBLISH_EXPIRE: {
            code: 'ORDER_PUBLISH_EXPIRE',
            label: 'Срок публикации заказа',
            hours: 72,
            entityType: 'Order',
            triggerStatus: OrderStatus.PUBLISHED,
            warningPercent: 80,
            action: 'notify_no_applicants',
            message: '⏰ Заказ не получил откликов в течение 72ч'
        }
    });

    // Хранилище активных дедлайнов
    const DEADLINES_KEY = 'sm_deadlines';

    function _loadDeadlines() {
        try { return JSON.parse(localStorage.getItem(DEADLINES_KEY) || '[]'); }
        catch { return []; }
    }

    function _saveDeadlines(list) {
        localStorage.setItem(DEADLINES_KEY, JSON.stringify(list));
    }

    /**
     * TimerEngine — создание, проверка и срабатывание дедлайнов
     */
    const TimerEngine = {
        /**
         * Создать дедлайн для сущности
         * @param {string} ruleCode - код правила из DeadlineRule
         * @param {string} entityId - ID сущности
         * @param {object} meta - доп. данные { orderId, executorId, customerId }
         */
        createDeadline(ruleCode, entityId, meta = {}) {
            const rule = DeadlineRule[ruleCode];
            if (!rule) {
                console.error(`[TimerEngine] Unknown rule: ${ruleCode}`);
                return null;
            }

            const deadlines = _loadDeadlines();

            // Не создавать дубликат
            const exists = deadlines.find(d =>
                d.ruleCode === ruleCode &&
                d.entityId === entityId &&
                d.status === 'ACTIVE'
            );
            if (exists) return exists;

            const now = new Date();
            const expiresAt = new Date(now.getTime() + rule.hours * 60 * 60 * 1000);
            const warningAt = new Date(now.getTime() + rule.hours * 60 * 60 * 1000 * (rule.warningPercent / 100));

            const deadline = {
                id: 'dl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
                ruleCode,
                entityType: rule.entityType,
                entityId,
                status: 'ACTIVE', // ACTIVE | WARNING | EXPIRED | CANCELLED | COMPLETED
                createdAt: now.toISOString(),
                warningAt: warningAt.toISOString(),
                expiresAt: expiresAt.toISOString(),
                firedAt: null,
                cancelledAt: null,
                meta
            };

            deadlines.push(deadline);
            _saveDeadlines(deadlines);

            console.log(`[TimerEngine] ⏱️ Deadline created: ${rule.label} (${rule.hours}ч) for ${rule.entityType} ${entityId}`);
            return deadline;
        },

        /**
         * Отменить дедлайн (при успешном завершении действия вовремя)
         */
        cancelDeadline(ruleCode, entityId) {
            const deadlines = _loadDeadlines();
            let cancelled = 0;
            deadlines.forEach(d => {
                if (d.ruleCode === ruleCode && d.entityId === entityId && d.status === 'ACTIVE') {
                    d.status = 'CANCELLED';
                    d.cancelledAt = new Date().toISOString();
                    cancelled++;
                }
            });
            if (cancelled > 0) {
                _saveDeadlines(deadlines);
                console.log(`[TimerEngine] ✅ Cancelled ${cancelled} deadline(s): ${ruleCode} for ${entityId}`);
            }
            return cancelled;
        },

        /**
         * Пометить дедлайн как выполненный
         */
        completeDeadline(ruleCode, entityId) {
            const deadlines = _loadDeadlines();
            deadlines.forEach(d => {
                if (d.ruleCode === ruleCode && d.entityId === entityId && d.status === 'ACTIVE') {
                    d.status = 'COMPLETED';
                    d.cancelledAt = new Date().toISOString();
                }
            });
            _saveDeadlines(deadlines);
        },

        /**
         * Проверить все активные дедлайны и выполнить действия
         * @returns {Array} массив сработавших дедлайнов
         */
        checkDeadlines() {
            const deadlines = _loadDeadlines();
            const now = new Date();
            const fired = [];

            deadlines.forEach(d => {
                if (d.status !== 'ACTIVE') return;

                const rule = DeadlineRule[d.ruleCode];
                if (!rule) return;

                const expiresAt = new Date(d.expiresAt);
                const warningAt = new Date(d.warningAt);

                // Истёк
                if (now >= expiresAt) {
                    d.status = 'EXPIRED';
                    d.firedAt = now.toISOString();

                    const result = this._executeAction(rule, d);
                    fired.push({ deadline: d, result, type: 'expired' });

                    console.log(`[TimerEngine] 🔴 EXPIRED: ${rule.label} → ${rule.action} (${d.entityType} ${d.entityId})`);
                }
                // Предупреждение
                else if (now >= warningAt && d.status === 'ACTIVE') {
                    const remaining = Math.round((expiresAt - now) / (60 * 60 * 1000) * 10) / 10;
                    this._sendWarning(rule, d, remaining);
                }
            });

            _saveDeadlines(deadlines);
            return fired;
        },

        /**
         * Выполнить действие при истечении дедлайна
         */
        _executeAction(rule, deadline) {
            try {
                switch (rule.action) {
                    case 'auto_reject': {
                        // Автоотклонение отклика
                        AuditLog.log(rule.entityType.toLowerCase(), deadline.entityId, 'deadline_expired', {
                            ruleCode: deadline.ruleCode,
                            message: rule.message,
                            action: 'auto_reject'
                        });
                        return { success: true, action: 'auto_reject' };
                    }

                    case 'auto_accept': {
                        // Автоприёмка работы
                        AuditLog.log(rule.entityType.toLowerCase(), deadline.entityId, 'deadline_expired', {
                            ruleCode: deadline.ruleCode,
                            message: rule.message,
                            action: 'auto_accept'
                        });
                        return { success: true, action: 'auto_accept' };
                    }

                    case 'notify_warning': {
                        AuditLog.log(rule.entityType.toLowerCase(), deadline.entityId, 'deadline_expired', {
                            ruleCode: deadline.ruleCode,
                            message: rule.message,
                            action: 'notify_warning'
                        });
                        return { success: true, action: 'notify_warning' };
                    }

                    case 'escalate': {
                        AuditLog.log(rule.entityType.toLowerCase(), deadline.entityId, 'deadline_escalated', {
                            ruleCode: deadline.ruleCode,
                            message: rule.message,
                            action: 'escalate'
                        });
                        return { success: true, action: 'escalate' };
                    }

                    case 'notify_no_applicants': {
                        AuditLog.log(rule.entityType.toLowerCase(), deadline.entityId, 'deadline_expired', {
                            ruleCode: deadline.ruleCode,
                            message: rule.message,
                            action: 'notify_no_applicants'
                        });
                        return { success: true, action: 'notify_no_applicants' };
                    }

                    default:
                        return { success: false, error: 'Unknown action: ' + rule.action };
                }
            } catch (error) {
                console.error('[TimerEngine] Action error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Отправить предупреждение (через NotificationService если доступен)
         */
        _sendWarning(rule, deadline, remainingHours) {
            const msg = `⚠️ ${rule.label}: осталось ${remainingHours}ч (${rule.entityType} ${deadline.entityId})`;
            console.log(`[TimerEngine] ${msg}`);

            // Интеграция с системой уведомлений
            if (window.NotificationService?.send) {
                window.NotificationService.send({
                    type: 'deadline_warning',
                    title: `⚠️ ${rule.label}`,
                    message: `Осталось ${remainingHours} часов`,
                    entityType: rule.entityType,
                    entityId: deadline.entityId,
                    meta: deadline.meta
                });
            }
        },

        /**
         * Получить активные дедлайны
         * @param {string} entityType - фильтр по типу сущности (опционально)
         * @returns {Array}
         */
        getActiveDeadlines(entityType = null) {
            const deadlines = _loadDeadlines();
            return deadlines.filter(d => {
                if (d.status !== 'ACTIVE') return false;
                if (entityType && d.entityType !== entityType) return false;
                return true;
            });
        },

        /**
         * Получить все дедлайны для сущности
         */
        getDeadlinesForEntity(entityType, entityId) {
            const deadlines = _loadDeadlines();
            return deadlines.filter(d => d.entityType === entityType && d.entityId === entityId);
        },

        /**
         * Получить время до истечения дедлайна
         * @returns {object|null} { hours, minutes, percent, isWarning, isExpired }
         */
        getTimeRemaining(ruleCode, entityId) {
            const deadlines = _loadDeadlines();
            const d = deadlines.find(dl =>
                dl.ruleCode === ruleCode && dl.entityId === entityId && dl.status === 'ACTIVE'
            );
            if (!d) return null;

            const rule = DeadlineRule[ruleCode];
            const now = new Date();
            const expiresAt = new Date(d.expiresAt);
            const createdAt = new Date(d.createdAt);
            const totalMs = expiresAt - createdAt;
            const remainingMs = Math.max(0, expiresAt - now);
            const elapsedPercent = Math.round((1 - remainingMs / totalMs) * 100);

            return {
                hours: Math.floor(remainingMs / (60 * 60 * 1000)),
                minutes: Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000)),
                percent: elapsedPercent,
                isWarning: elapsedPercent >= (rule?.warningPercent || 75),
                isExpired: remainingMs <= 0
            };
        },

        /**
         * Рендер бейджа таймера
         */
        renderTimerBadge(ruleCode, entityId) {
            const time = this.getTimeRemaining(ruleCode, entityId);
            if (!time) return '';

            const rule = DeadlineRule[ruleCode];
            let color = '#3b82f6';
            let bg = '#3b82f620';
            if (time.isExpired) { color = '#ef4444'; bg = '#ef444420'; }
            else if (time.isWarning) { color = '#f59e0b'; bg = '#f59e0b20'; }

            const label = time.isExpired
                ? '⏰ Просрочено'
                : `⏱️ ${time.hours}ч ${time.minutes}м`;

            return `<span class="deadline-badge" style="background:${bg};color:${color};border:1px solid ${color}40;padding:0.2rem 0.6rem;border-radius:12px;font-size:0.7rem;font-weight:600;display:inline-flex;align-items:center;gap:0.25rem" title="${rule?.label || ruleCode}">
                <span>${label}</span>
            </span>`;
        },

        /**
         * Запустить периодическую проверку (каждые 60 секунд)
         */
        _pollInterval: null,
        startPolling(intervalMs = 60000) {
            if (this._pollInterval) return;
            this._pollInterval = setInterval(() => this.checkDeadlines(), intervalMs);
            console.log(`[TimerEngine] 🔄 Polling started (every ${intervalMs / 1000}s)`);
            // Первая проверка сразу
            this.checkDeadlines();
        },

        stopPolling() {
            if (this._pollInterval) {
                clearInterval(this._pollInterval);
                this._pollInterval = null;
                console.log('[TimerEngine] ⏸️ Polling stopped');
            }
        }
    };

    // ========== AUTO-CREATE DEADLINES ON TRANSITIONS ==========

    // Перехватываем оригинальный transition для авто-создания дедлайнов
    const _originalTransition = transition;
    function transitionWithTimers(entity, entityType, toStatus, actor = {}, meta = {}) {
        const result = _originalTransition(entity, entityType, toStatus, actor, meta);

        if (result.success) {
            // Создаём дедлайны при определённых переходах
            switch (entityType) {
                case 'Application':
                    if (toStatus === ApplicationStatus.SENT) {
                        TimerEngine.createDeadline('APPLICATION_REVIEW', entity.id, {
                            orderId: entity.orderId,
                            executorId: entity.executorId
                        });
                    }
                    if (toStatus === ApplicationStatus.ACCEPTED || toStatus === ApplicationStatus.REJECTED) {
                        TimerEngine.completeDeadline('APPLICATION_REVIEW', entity.id);
                    }
                    break;

                case 'Order':
                    if (toStatus === OrderStatus.PUBLISHED) {
                        TimerEngine.createDeadline('ORDER_PUBLISH_EXPIRE', entity.id, {
                            customerId: entity.customerId
                        });
                    }
                    if (toStatus === OrderStatus.IN_WORK) {
                        TimerEngine.cancelDeadline('ORDER_PUBLISH_EXPIRE', entity.id);
                        TimerEngine.createDeadline('WORK_START', entity.id, {
                            executorId: entity.executorId
                        });
                    }
                    if (toStatus === OrderStatus.ON_REVIEW || toStatus === OrderStatus.DONE) {
                        TimerEngine.completeDeadline('WORK_START', entity.id);
                    }
                    break;

                case 'Work':
                    if (toStatus === WorkStatus.ON_REVIEW) {
                        TimerEngine.createDeadline('WORK_REVIEW', entity.id, {
                            orderId: entity.orderId,
                            executorId: entity.executorId
                        });
                    }
                    if (toStatus === WorkStatus.DONE || toStatus === WorkStatus.FIXES) {
                        TimerEngine.completeDeadline('WORK_REVIEW', entity.id);
                    }
                    break;

                case 'Defect':
                    if (toStatus === DefectStatus.IN_FIX) {
                        TimerEngine.createDeadline('DEFECT_FIX', entity.id, {
                            orderId: entity.orderId
                        });
                    }
                    if (toStatus === DefectStatus.FIXED || toStatus === DefectStatus.CONFIRMED) {
                        TimerEngine.completeDeadline('DEFECT_FIX', entity.id);
                    }
                    break;
            }
        }

        return result;
    }

    // ========== EXPORT ==========
    const StatusMachineExport = {
        // Core functions
        canTransition,
        getAllowedTransitions,
        transition: transitionWithTimers,
        getStatusLabel,
        renderStatusBadge,

        // Business logic
        canCustomerPublishOrders,
        canExecutorApply,
        publishOrder,
        applyToOrder,
        acceptApplication,
        submitWork,
        acceptWork,
        rejectWork,

        // Timers
        TimerEngine,
        DeadlineRule,

        // Constants
        TransitionRules,
        StatusLabels
    };

    window.StatusMachine = StatusMachineExport;

    // Запускаем polling таймеров
    TimerEngine.startPolling();

    if (window.ModuleRegistry) {
        window.ModuleRegistry.register('StatusMachine', StatusMachineExport, {
            version: '2.0',
            depends: ['Models']
        });
    } else {
        console.log('✅ StatusMachine v2.0 loaded (with TimerEngine)');
    }

})();
