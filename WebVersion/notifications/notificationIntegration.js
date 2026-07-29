// ========== NOTIFICATION INTEGRATION ==========
// Интеграция уведомлений с другими модулями
// Версия: 1.0

(function () {
    'use strict';

    // Подождать загрузку всех модулей
    const waitForModules = () => {
        return new Promise((resolve) => {
            const check = () => {
                if (window.NotificationService && window.NotificationModels) {
                    resolve();
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    };

    // Инициализация интеграции
    async function initNotificationIntegration() {
        await waitForModules();

        const { NotificationType } = window.NotificationModels;
        const NS = window.NotificationService;

        console.log('[NotificationIntegration] Initializing...');

        // ===== ИНТЕГРАЦИЯ С ЧАТОМ =====
        if (window.ChatService) {
            // Переопределяем метод отправки для уведомлений о сообщениях
            const originalSend = window.ChatService.sendMessage?.bind?.(window.ChatService);

            if (originalSend) {
                window.ChatService.sendMessage = function (roomId, content, type = 'TEXT', metadata = {}) {
                    const result = originalSend(roomId, content, type, metadata);

                    // Уведомление отправлено (для демо - уведомляем самого себя)
                    // В реальном приложении это будет на стороне получателя
                    if (result) {
                        const currentUser = window.Auth?.getCurrentUser?.() || {};
                        // В демо-режиме показываем toast
                        console.log('[NotificationIntegration] Message sent to room:', roomId);
                    }

                    return result;
                };
            }

            console.log('[NotificationIntegration] Chat integration ready');
        }

        // ===== ИНТЕГРАЦИЯ С ЗАКАЗАМИ =====
        if (window.DataService?.OrderAPI) {
            const OrderAPI = window.DataService.OrderAPI;

            // Отслеживаем изменение статуса заказа
            const originalUpdateStatus = OrderAPI.updateStatus?.bind?.(OrderAPI);

            if (originalUpdateStatus) {
                OrderAPI.updateStatus = function (orderId, newStatus, comment) {
                    const order = OrderAPI.getById(orderId);
                    const oldStatus = order?.status;

                    const result = originalUpdateStatus(orderId, newStatus, comment);

                    if (result.success && order) {
                        NS.notifyOrderStatus(orderId, order.title || 'Заказ', newStatus, oldStatus);
                    }

                    return result;
                };
            }

            // Отслеживаем принятие заявок
            const originalAcceptApplication = OrderAPI.acceptApplication?.bind?.(OrderAPI);

            if (originalAcceptApplication) {
                OrderAPI.acceptApplication = function (orderId, applicationId) {
                    const result = originalAcceptApplication(orderId, applicationId);

                    if (result.success) {
                        const order = OrderAPI.getById(orderId);
                        NS.send({
                            type: NotificationType.ORDER_ACCEPTED,
                            title: 'Заявка принята!',
                            message: `Ваша заявка на заказ "${order?.title || 'Заказ'}" принята`,
                            entityType: 'order',
                            entityId: orderId
                        });
                    }

                    return result;
                };
            }

            console.log('[NotificationIntegration] Order integration ready');
        }

        // ===== ИНТЕГРАЦИЯ СО СМЕТАМИ =====
        if (window.EstimateService) {
            const originalCreate = window.EstimateService.createEstimate?.bind?.(window.EstimateService);

            if (originalCreate) {
                window.EstimateService.createEstimate = function (data) {
                    const result = originalCreate(data);

                    if (result && result.id) {
                        NS.send({
                            type: NotificationType.ESTIMATE_CREATED,
                            title: 'Смета создана',
                            message: `Создана смета для объекта "${data.objectInfo?.title || data.address || 'Объект'}"`,
                            entityType: 'estimate',
                            entityId: result.id
                        });

                        // Проверка confidence для инженера
                        if (result.versions?.[0]?.confidence < 0.6) {
                            NS.send({
                                type: NotificationType.ENGINEER_REQUIRED,
                                title: 'Требуется проверка',
                                message: `Смета ${result.id} имеет низкий уровень уверенности (${(result.versions[0].confidence * 100).toFixed(0)}%)`,
                                entityType: 'estimate',
                                entityId: result.id
                            });
                        }
                    }

                    return result;
                };
            }

            console.log('[NotificationIntegration] Estimate integration ready');
        }

        // ===== ИНТЕГРАЦИЯ С ФИНАНСАМИ =====
        if (window.FinanceService) {
            const FS = window.FinanceService;

            // Уведомление о платежах
            const originalProcessPayment = FS.processPayment?.bind?.(FS);

            if (originalProcessPayment) {
                FS.processPayment = function (quoteId, paymentData) {
                    const result = originalProcessPayment(quoteId, paymentData);

                    if (result?.success) {
                        NS.send({
                            type: NotificationType.PAYMENT_RECEIVED,
                            title: 'Платёж получен',
                            message: `Получен платёж на сумму ${paymentData.amount?.toLocaleString('ru-RU')} ₸`,
                            metadata: { amount: paymentData.amount }
                        });
                    }

                    return result;
                };
            }

            console.log('[NotificationIntegration] Finance integration ready');
        }

        // ===== ИНТЕГРАЦИЯ С VIP МОДУЛЕМ =====
        if (window.VipService) {
            const VS = window.VipService;

            // Уведомление о новых откликах
            const originalSubmitBid = VS.submitBid?.bind?.(VS);

            if (originalSubmitBid) {
                VS.submitBid = function (lotId, bidData) {
                    const result = originalSubmitBid(lotId, bidData);

                    if (result?.success) {
                        NS.send({
                            type: NotificationType.BID_RECEIVED,
                            title: 'Новый отклик',
                            message: `Получен отклик на лот "${bidData.lotTitle || 'Лот'}"`,
                            entityType: 'lot',
                            entityId: lotId
                        });
                    }

                    return result;
                };
            }

            console.log('[NotificationIntegration] VIP integration ready');
        }

        console.log('✅ NotificationIntegration initialized');

        // ===== ДЕМО УВЕДОМЛЕНИЯ =====
        // Показать приветственное уведомление при первом входе
        const hasSeenWelcome = localStorage.getItem('qazgost_welcome_notif');

        if (!hasSeenWelcome) {
            setTimeout(() => {
                NS.send({
                    type: NotificationType.SYSTEM,
                    title: 'Добро пожаловать в QAZGOST AI!',
                    message: 'Теперь вы будете получать уведомления о важных событиях',
                    actionUrl: '#home'
                });
                localStorage.setItem('qazgost_welcome_notif', 'true');
            }, 2000);
        }
    }

    // Запуск при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotificationIntegration);
    } else {
        initNotificationIntegration();
    }

    console.log('✅ NotificationIntegration module loaded');
})();
