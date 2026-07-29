// ========== AI ENGINEER MODERATOR ==========
// Модуль автоматической модерации заявок
// Замена функции инженера "Модерирует"

(function () {
    'use strict';

    // ========== MODERATION RULES ==========

    // Статусы модерации
    const ModerationStatus = {
        PENDING: 'PENDING',           // Ожидает модерации
        AUTO_APPROVED: 'AUTO_APPROVED', // Автоматически одобрено
        NEEDS_REVIEW: 'NEEDS_REVIEW', // Требует ручной проверки
        REJECTED: 'REJECTED',         // Отклонено
        ESCALATED: 'ESCALATED'        // Эскалировано на админа
    };

    // Причины отклонения
    const RejectionReasons = {
        INVALID_DATA: 'Некорректные данные',
        SUSPICIOUS_PRICE: 'Подозрительная цена',
        INCOMPLETE: 'Заявка неполная',
        DUPLICATE: 'Дубликат заявки',
        SPAM: 'Спам или тестовая заявка',
        POLICY_VIOLATION: 'Нарушение правил'
    };

    // Правила автоодобрения
    const AUTO_APPROVE_RULES = {
        maxTotalPrice: 50000000,      // Максимальная сумма для автоодобрения (50 млн тенге)
        minTotalPrice: 50000,         // Минимальная сумма (50 тыс тенге)
        maxSolutions: 10,             // Максимум решений
        requiredFields: ['objectInfo', 'solutions'], // Обязательные поля
        trustedCustomers: []          // ID доверенных заказчиков
    };

    // ========== MODERATION RESULT ==========

    class ModerationResult {
        constructor() {
            this.status = ModerationStatus.PENDING;
            this.reasons = [];
            this.warnings = [];
            this.score = 100; // 0-100, чем выше — тем лучше
            this.checkedAt = new Date().toISOString();
            this.autoDecision = null;
            this.reviewerNotes = [];
        }

        approve(reason = 'Автоматически одобрено') {
            this.status = ModerationStatus.AUTO_APPROVED;
            this.autoDecision = { action: 'approve', reason };
        }

        reject(reasonCode, details = '') {
            this.status = ModerationStatus.REJECTED;
            this.reasons.push({
                code: reasonCode,
                message: RejectionReasons[reasonCode] || reasonCode,
                details
            });
            this.autoDecision = { action: 'reject', reason: reasonCode };
        }

        escalate(reason) {
            this.status = ModerationStatus.ESCALATED;
            this.reasons.push({ code: 'ESCALATED', message: reason });
        }

        needsReview(reason) {
            this.status = ModerationStatus.NEEDS_REVIEW;
            this.reasons.push({ code: 'NEEDS_REVIEW', message: reason });
        }

        addWarning(message) {
            this.warnings.push(message);
            this.score = Math.max(0, this.score - 10);
        }

        decreaseScore(points, reason) {
            this.score = Math.max(0, this.score - points);
            this.reviewerNotes.push(`-${points}: ${reason}`);
        }

        toJSON() {
            return {
                status: this.status,
                score: this.score,
                reasons: this.reasons,
                warnings: this.warnings,
                checkedAt: this.checkedAt,
                autoDecision: this.autoDecision,
                reviewerNotes: this.reviewerNotes
            };
        }
    }

    // ========== MODERATOR ==========

    const AIEngineerModerator = {
        // Модерация заявки на инженерные решения
        moderateEngineeringRequest(request) {
            const result = new ModerationResult();

            if (!request) {
                result.reject('INVALID_DATA', 'Заявка не найдена');
                return result;
            }

            // 1. Проверка обязательных полей
            if (!this.checkRequiredFields(request, result)) {
                return result;
            }

            // 2. Проверка на дубликат
            if (this.isDuplicate(request)) {
                result.reject('DUPLICATE', 'Найдена похожая заявка');
                return result;
            }

            // 3. Проверка на спам
            if (this.isSpam(request)) {
                result.reject('SPAM', 'Заявка похожа на спам');
                return result;
            }

            // 4. Проверка суммы
            const totalPrice = request.totalPrice || 0;
            if (totalPrice < AUTO_APPROVE_RULES.minTotalPrice) {
                result.decreaseScore(20, 'Слишком маленькая сумма');
                result.addWarning('Сумма заявки ниже минимальной');
            }
            if (totalPrice > AUTO_APPROVE_RULES.maxTotalPrice) {
                result.needsReview('Сумма превышает лимит автоодобрения');
                return result;
            }

            // 5. Проверка количества решений
            const solutionsCount = request.solutions?.length || 0;
            if (solutionsCount > AUTO_APPROVE_RULES.maxSolutions) {
                result.decreaseScore(15, 'Слишком много решений');
                result.addWarning('Большое количество решений требует проверки');
            }

            // 6. Проверка объекта (использует AIEngineerValidator)
            if (window.AIEngineerValidator) {
                const validationResult = window.AIEngineerValidator.validateRequest(request);
                if (validationResult.errors.length > 0) {
                    result.decreaseScore(30, 'Ошибки валидации');
                    validationResult.errors.forEach(err => {
                        result.addWarning(err.message);
                    });
                }
                if (validationResult.needsHumanReview && validationResult.needsHumanReview()) {
                    result.needsReview('Валидатор рекомендует ручную проверку');
                    return result;
                }
            }

            // 7. Проверка доверенного заказчика
            if (AUTO_APPROVE_RULES.trustedCustomers.includes(request.customerId)) {
                result.score = Math.min(100, result.score + 20);
            }

            // Финальное решение
            if (result.score >= 70 && result.status === ModerationStatus.PENDING) {
                result.approve(`Автоодобрено (score: ${result.score})`);
            } else if (result.score >= 40) {
                result.needsReview(`Требует проверки (score: ${result.score})`);
            } else {
                result.escalate(`Низкий score: ${result.score}`);
            }

            return result;
        },

        // Проверка обязательных полей
        checkRequiredFields(request, result) {
            let hasAllFields = true;

            AUTO_APPROVE_RULES.requiredFields.forEach(field => {
                if (!request[field]) {
                    result.decreaseScore(25, `Отсутствует поле: ${field}`);
                    hasAllFields = false;
                }
            });

            if (!hasAllFields) {
                result.reject('INCOMPLETE', 'Не заполнены обязательные поля');
            }

            return hasAllFields;
        },

        // Проверка на дубликат
        isDuplicate(request) {
            // Простая проверка: ищем заявки того же заказчика за последний час
            const recentRequests = JSON.parse(localStorage.getItem('engineering_requests') || '[]');
            const oneHourAgo = Date.now() - 3600000;

            return recentRequests.some(r =>
                r.customerId === request.customerId &&
                r.id !== request.id &&
                new Date(r.createdAt).getTime() > oneHourAgo &&
                Math.abs((r.totalPrice || 0) - (request.totalPrice || 0)) < 1000
            );
        },

        // Проверка на спам
        isSpam(request) {
            const spamPatterns = ['test', 'тест', 'asdf', 'qwerty', '123456'];
            const title = (request.title || '').toLowerCase();
            const description = (request.description || '').toLowerCase();

            // Проверка паттернов
            if (spamPatterns.some(p => title.includes(p) || description.includes(p))) {
                return true;
            }

            // Проверка длины
            if (description && description.length < 10) {
                return true;
            }

            return false;
        },

        // Модерация заказа (marketplace)
        moderateOrder(order) {
            const result = new ModerationResult();

            if (!order) {
                result.reject('INVALID_DATA', 'Заказ не найден');
                return result;
            }

            // Проверка описания
            if (!order.description || order.description.length < 20) {
                result.decreaseScore(20, 'Слишком короткое описание');
            }

            // Проверка бюджета
            if (order.budget && order.budget < 10000) {
                result.decreaseScore(15, 'Очень низкий бюджет');
                result.addWarning('Бюджет может быть нереалистичным');
            }

            // Проверка контактов
            if (!order.phone && !order.email) {
                result.decreaseScore(30, 'Нет контактных данных');
            }

            // Решение
            if (result.score >= 60) {
                result.approve('Автоодобрено');
            } else {
                result.needsReview('Требует модерации');
            }

            return result;
        },

        // Получить статистику модерации
        getStats() {
            const stats = JSON.parse(localStorage.getItem('moderation_stats') || '{}');
            return {
                totalModerated: stats.total || 0,
                autoApproved: stats.autoApproved || 0,
                needsReview: stats.needsReview || 0,
                rejected: stats.rejected || 0,
                escalated: stats.escalated || 0,
                averageScore: stats.averageScore || 0
            };
        },

        // Сохранить результат модерации
        saveResult(requestId, result) {
            // Сохраняем историю
            const history = JSON.parse(localStorage.getItem('moderation_history') || '[]');
            history.push({
                requestId,
                result: result.toJSON(),
                timestamp: new Date().toISOString()
            });
            localStorage.setItem('moderation_history', JSON.stringify(history.slice(-100)));

            // Обновляем статистику
            const stats = JSON.parse(localStorage.getItem('moderation_stats') || '{}');
            stats.total = (stats.total || 0) + 1;
            stats[result.status.toLowerCase()] = (stats[result.status.toLowerCase()] || 0) + 1;

            // Средний score
            const prevAvg = stats.averageScore || 100;
            stats.averageScore = (prevAvg * (stats.total - 1) + result.score) / stats.total;

            localStorage.setItem('moderation_stats', JSON.stringify(stats));
        }
    };

    // ========== EXPORT ==========
    window.AIEngineerModerator = AIEngineerModerator;
    window.ModerationStatus = ModerationStatus;
    window.RejectionReasons = RejectionReasons;

    console.log('✅ AI Engineer Moderator loaded');
})();
