// ========== AI ENGINEER VALIDATOR ==========
// Модуль автоматической валидации и проверки расчётов
// Замена роли ENGINEER на ИИ-систему

(function () {
    'use strict';

    // ========== VALIDATION RULES ==========

    // Правила валидации площадей
    const AREA_RULES = {
        minArea: 1,           // Минимальная площадь м²
        maxArea: 100000,      // Максимальная площадь м²
        minRoomArea: 4,       // Минимальная площадь комнаты м²
        maxHeight: 50,        // Максимальная высота этажа м
        minHeight: 2.2,       // Минимальная высота этажа м
        maxFloors: 100        // Максимальное количество этажей
    };

    // Правила валидации стоимости
    const PRICE_RULES = {
        minPricePerSqm: 5000,       // Минимальная цена за м² (тенге)
        maxPricePerSqm: 500000,     // Максимальная цена за м² (тенге)
        suspiciouslyLow: 10000,     // Подозрительно низкая цена
        suspiciouslyHigh: 300000,   // Подозрительно высокая цена
        vipMultiplierMin: 1.2,      // Минимальный множитель VIP
        vipMultiplierMax: 3.0       // Максимальный множитель VIP
    };

    // Правила валидации сроков
    const DURATION_RULES = {
        minDaysPerSolution: 1,      // Минимум дней на решение
        maxDaysPerSolution: 365,    // Максимум дней на решение
        minDaysPerSqm: 0.01,        // Минимум дней на м²
        maxDaysPerSqm: 1,           // Максимум дней на м²
        warningThreshold: 180       // Порог предупреждения (дней)
    };

    // ========== VALIDATION STATUS ==========
    const ValidationStatus = {
        VALID: 'VALID',                    // Всё в порядке
        WARNING: 'WARNING',                // Предупреждение (можно продолжить)
        ERROR: 'ERROR',                    // Ошибка (нельзя продолжить)
        NEEDS_REVIEW: 'NEEDS_REVIEW',      // Требует проверки администратором
        AUTO_APPROVED: 'AUTO_APPROVED'     // Автоматически одобрено
    };

    // ========== VALIDATION RESULT ==========
    class ValidationResult {
        constructor() {
            this.status = ValidationStatus.VALID;
            this.errors = [];
            this.warnings = [];
            this.recommendations = [];
            this.aiConfidence = 1.0; // 0-1, уровень уверенности ИИ
            this.checkedAt = new Date().toISOString();
        }

        addError(code, message, field = null) {
            this.errors.push({ code, message, field, severity: 'error' });
            this.status = ValidationStatus.ERROR;
            this.aiConfidence = Math.min(this.aiConfidence, 0.3);
        }

        addWarning(code, message, field = null) {
            this.warnings.push({ code, message, field, severity: 'warning' });
            if (this.status === ValidationStatus.VALID) {
                this.status = ValidationStatus.WARNING;
            }
            this.aiConfidence = Math.min(this.aiConfidence, 0.7);
        }

        addRecommendation(message, category = 'general') {
            this.recommendations.push({ message, category });
        }

        needsHumanReview() {
            return this.aiConfidence < 0.5 ||
                this.warnings.length > 3 ||
                this.errors.length > 0;
        }

        toJSON() {
            return {
                status: this.needsHumanReview() ? ValidationStatus.NEEDS_REVIEW :
                    (this.status === ValidationStatus.VALID ? ValidationStatus.AUTO_APPROVED : this.status),
                errors: this.errors,
                warnings: this.warnings,
                recommendations: this.recommendations,
                aiConfidence: Math.round(this.aiConfidence * 100),
                checkedAt: this.checkedAt,
                needsHumanReview: this.needsHumanReview()
            };
        }
    }

    // ========== VALIDATORS ==========

    // Валидация объекта (площадь, этажность, тип)
    function validateObjectInfo(objectInfo) {
        const result = new ValidationResult();

        if (!objectInfo) {
            result.addError('MISSING_OBJECT', 'Информация об объекте не указана');
            return result;
        }

        // Проверка площади
        const area = parseFloat(objectInfo.area) || 0;
        if (area <= 0) {
            result.addError('INVALID_AREA', 'Площадь должна быть больше 0', 'area');
        } else if (area < AREA_RULES.minArea) {
            result.addError('AREA_TOO_SMALL', `Площадь слишком мала (мин. ${AREA_RULES.minArea} м²)`, 'area');
        } else if (area > AREA_RULES.maxArea) {
            result.addError('AREA_TOO_LARGE', `Площадь слишком велика (макс. ${AREA_RULES.maxArea} м²)`, 'area');
        } else if (area < 20) {
            result.addWarning('AREA_UNUSUAL', 'Площадь менее 20 м² — уточните параметры', 'area');
        }

        // Проверка этажности
        const floors = parseInt(objectInfo.floors) || 1;
        if (floors < 1) {
            result.addError('INVALID_FLOORS', 'Количество этажей должно быть минимум 1', 'floors');
        } else if (floors > AREA_RULES.maxFloors) {
            result.addError('TOO_MANY_FLOORS', `Слишком много этажей (макс. ${AREA_RULES.maxFloors})`, 'floors');
        } else if (floors > 30) {
            result.addWarning('HIGH_RISE', 'Высотное здание — требуются специализированные расчёты', 'floors');
            result.aiConfidence = Math.min(result.aiConfidence, 0.6);
        }

        // Проверка типа объекта
        const validTypes = ['house', 'apartment', 'commercial', 'industrial', 'other'];
        if (!objectInfo.type || !validTypes.includes(objectInfo.type)) {
            result.addWarning('UNKNOWN_TYPE', 'Тип объекта не указан или неизвестен', 'type');
        }

        // Рекомендации
        if (area > 500 && floors === 1) {
            result.addRecommendation('Для больших одноэтажных объектов рекомендуется разделение на зоны', 'optimization');
        }
        if (floors > 3 && !objectInfo.hasElevator) {
            result.addRecommendation('Рекомендуется предусмотреть лифт для зданий выше 3 этажей', 'accessibility');
        }

        return result;
    }

    // Валидация выбранных решений
    function validateSelectedSolutions(solutions, objectInfo) {
        const result = new ValidationResult();

        if (!solutions || solutions.length === 0) {
            result.addWarning('NO_SOLUTIONS', 'Не выбрано ни одного решения');
            return result;
        }

        let totalPrice = 0;
        let totalDuration = 0;
        const categories = new Set();

        solutions.forEach((sol, index) => {
            // Проверка цены
            if (sol.calculatedPrice <= 0) {
                result.addError('INVALID_PRICE', `Решение #${index + 1}: цена не рассчитана`, `solutions[${index}]`);
            } else {
                totalPrice += sol.calculatedPrice;

                // Проверка цены за м²
                const area = parseFloat(objectInfo?.area) || 1;
                const pricePerSqm = sol.calculatedPrice / area;

                if (pricePerSqm < PRICE_RULES.suspiciouslyLow) {
                    result.addWarning('PRICE_LOW',
                        `Решение "${sol.title || '#' + (index + 1)}": подозрительно низкая цена`,
                        `solutions[${index}]`);
                }
                if (pricePerSqm > PRICE_RULES.suspiciouslyHigh) {
                    result.addWarning('PRICE_HIGH',
                        `Решение "${sol.title || '#' + (index + 1)}": высокая цена — проверьте параметры`,
                        `solutions[${index}]`);
                }
            }

            // Проверка сроков
            if (sol.calculatedDuration <= 0) {
                result.addError('INVALID_DURATION', `Решение #${index + 1}: срок не рассчитан`, `solutions[${index}]`);
            } else {
                totalDuration += sol.calculatedDuration;

                if (sol.calculatedDuration > DURATION_RULES.maxDaysPerSolution) {
                    result.addWarning('DURATION_LONG',
                        `Решение "${sol.title || '#' + (index + 1)}": очень долгий срок выполнения`,
                        `solutions[${index}]`);
                }
            }

            // VIP-множитель
            if (sol.option === 'vip') {
                const multiplier = sol.vipMultiplier || 1;
                if (multiplier < PRICE_RULES.vipMultiplierMin || multiplier > PRICE_RULES.vipMultiplierMax) {
                    result.addWarning('VIP_MULTIPLIER',
                        `Решение "${sol.title || '#' + (index + 1)}": нестандартный VIP-множитель`,
                        `solutions[${index}]`);
                }
            }

            if (sol.category) {
                categories.add(sol.category);
            }
        });

        // Общие проверки
        if (totalDuration > DURATION_RULES.warningThreshold) {
            result.addWarning('TOTAL_DURATION',
                `Общий срок ${totalDuration} дней — это более ${Math.round(totalDuration / 30)} месяцев`);
            result.addRecommendation('Рассмотрите возможность параллельного выполнения работ', 'optimization');
        }

        // Рекомендации по категориям
        if (categories.has('electrical') && !categories.has('safety')) {
            result.addRecommendation('При электромонтаже рекомендуется также заказать проект безопасности', 'safety');
        }
        if (categories.has('hvac') && !categories.has('energy')) {
            result.addRecommendation('При проектировании ОВК рекомендуется расчёт энергоэффективности', 'efficiency');
        }

        return result;
    }

    // Валидация этапов работ
    function validateStages(stages) {
        const result = new ValidationResult();

        if (!stages || stages.length === 0) {
            result.addWarning('NO_STAGES', 'Этапы работ не сгенерированы');
            return result;
        }

        let totalDuration = 0;
        let lastEndDate = null;

        stages.forEach((stage, index) => {
            // Проверка последовательности дат
            if (stage.plannedStart && lastEndDate) {
                const start = new Date(stage.plannedStart);
                const prevEnd = new Date(lastEndDate);

                if (start < prevEnd) {
                    result.addWarning('STAGE_OVERLAP',
                        `Этап "${stage.title}": пересечение с предыдущим этапом`,
                        `stages[${index}]`);
                }
            }

            // Проверка длительности
            const duration = stage.duration || 0;
            totalDuration += duration;

            if (duration <= 0) {
                result.addError('STAGE_NO_DURATION',
                    `Этап "${stage.title}": не указана длительность`,
                    `stages[${index}]`);
            }

            // Проверка результатов
            if (!stage.deliverables || stage.deliverables.length === 0) {
                result.addWarning('STAGE_NO_DELIVERABLES',
                    `Этап "${stage.title}": не указаны результаты`,
                    `stages[${index}]`);
            }

            lastEndDate = stage.plannedEnd;
        });

        // Рекомендации
        if (stages.length > 10) {
            result.addRecommendation('Большое количество этапов — рассмотрите группировку', 'optimization');
        }

        return result;
    }

    // Комплексная валидация заявки
    function validateRequest(request) {
        const result = new ValidationResult();

        if (!request) {
            result.addError('MISSING_REQUEST', 'Заявка не найдена');
            return result;
        }

        // Валидация объекта
        const objectResult = validateObjectInfo(request.objectInfo);
        result.errors.push(...objectResult.errors);
        result.warnings.push(...objectResult.warnings);
        result.recommendations.push(...objectResult.recommendations);
        result.aiConfidence = Math.min(result.aiConfidence, objectResult.aiConfidence);

        // Валидация решений (если есть)
        if (request.solutions && request.solutions.length > 0) {
            const solutionsResult = validateSelectedSolutions(request.solutions, request.objectInfo);
            result.errors.push(...solutionsResult.errors);
            result.warnings.push(...solutionsResult.warnings);
            result.recommendations.push(...solutionsResult.recommendations);
            result.aiConfidence = Math.min(result.aiConfidence, solutionsResult.aiConfidence);
        }

        // Валидация этапов (если есть)
        if (request.stages && request.stages.length > 0) {
            const stagesResult = validateStages(request.stages);
            result.errors.push(...stagesResult.errors);
            result.warnings.push(...stagesResult.warnings);
            result.recommendations.push(...stagesResult.recommendations);
            result.aiConfidence = Math.min(result.aiConfidence, stagesResult.aiConfidence);
        }

        // Проверка контактов
        if (!request.objectInfo?.address) {
            result.addWarning('NO_ADDRESS', 'Адрес объекта не указан', 'objectInfo.address');
        }

        // Итоговый статус
        if (result.errors.length > 0) {
            result.status = ValidationStatus.ERROR;
        } else if (result.needsHumanReview()) {
            result.status = ValidationStatus.NEEDS_REVIEW;
        } else if (result.warnings.length > 0) {
            result.status = ValidationStatus.WARNING;
        } else {
            result.status = ValidationStatus.AUTO_APPROVED;
        }

        return result;
    }

    // ========== AI RECOMMENDATIONS ==========

    // Генерация ИИ-рекомендаций для объекта
    function generateRecommendations(objectInfo, context = {}) {
        const recommendations = [];

        const area = parseFloat(objectInfo?.area) || 0;
        const floors = parseInt(objectInfo?.floors) || 1;
        const type = objectInfo?.type || 'house';

        // Рекомендации по площади
        if (area > 200) {
            recommendations.push({
                category: 'engineering',
                priority: 'medium',
                title: 'Зонирование объекта',
                description: 'Для объекта более 200 м² рекомендуется проект зонирования для оптимизации инженерных систем.'
            });
        }

        // Рекомендации по этажности
        if (floors >= 2) {
            recommendations.push({
                category: 'structural',
                priority: 'high',
                title: 'Расчёт несущих конструкций',
                description: 'Для многоэтажных объектов обязателен расчёт несущей способности.'
            });
        }

        // Рекомендации по типу
        if (type === 'commercial') {
            recommendations.push({
                category: 'fire_safety',
                priority: 'high',
                title: 'Проект пожарной безопасности',
                description: 'Для коммерческих объектов требуется проект пожарной безопасности по СНиП.'
            });
        }

        if (type === 'industrial') {
            recommendations.push({
                category: 'ventilation',
                priority: 'high',
                title: 'Промышленная вентиляция',
                description: 'Для промышленных объектов требуется расчёт промышленной вентиляции.'
            });
        }

        // Общие рекомендации
        recommendations.push({
            category: 'energy',
            priority: 'medium',
            title: 'Энергоаудит',
            description: 'Рекомендуется провести энергоаудит для оптимизации затрат на эксплуатацию.'
        });

        return recommendations;
    }

    // ========== EXPORT ==========
    window.AIEngineerValidator = {
        // Статусы
        ValidationStatus,

        // Валидаторы
        validateObjectInfo,
        validateSelectedSolutions,
        validateStages,
        validateRequest,

        // Рекомендации
        generateRecommendations,

        // Правила (для отладки)
        RULES: {
            AREA: AREA_RULES,
            PRICE: PRICE_RULES,
            DURATION: DURATION_RULES
        }
    };

    console.log('✅ AI Engineer Validator loaded');
})();
