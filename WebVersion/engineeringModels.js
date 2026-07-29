// ========== ENGINEERING MODELS ==========
// Модуль B: "Комплексные инженерные решения"
// Модели: EngineeringSolution, EngineeringRequest, EngineeringSelectedSolution, EngineeringStage, Deliverable

(function () {
    'use strict';

    if (!window.Models) {
        console.error('[EngineeringModels] window.Models is not loaded. Ensure models.js is included before engineeringModels.js.');
        return;
    }
    const { Storage, generateId, AuditLog } = window.Models;

    // ========== ENUMS ==========
    const EngineeringRequestStatus = {
        NEW: 'NEW',
        IN_REVIEW: 'IN_REVIEW',
        OFFER_SENT: 'OFFER_SENT',
        PAID: 'PAID',
        IN_WORK: 'IN_WORK',
        DELIVERED: 'DELIVERED',
        CLOSED: 'CLOSED',
        CANCELLED: 'CANCELLED'
    };

    const EngineeringStageStatus = {
        PLAN: 'PLAN',
        IN_WORK: 'IN_WORK',
        ON_REVIEW: 'ON_REVIEW',
        ACCEPTED: 'ACCEPTED'
    };

    const SolutionCategory = {
        DESIGN: 'design',          // Проектирование
        SURVEY: 'survey',          // Обследование
        SUPERVISION: 'supervision', // Надзор
        DOCS: 'docs',              // Документация
        SAFETY: 'safety',          // Безопасность
        ENERGY: 'energy'           // Энергоэффективность
    };

    const SolutionCategoryLabels = {
        design: 'Проектирование',
        survey: 'Обследование',
        supervision: 'Надзор',
        docs: 'Документация',
        safety: 'Безопасность',
        energy: 'Энергоэффективность'
    };

    const UrgencyLevel = {
        NORMAL: 'normal',
        URGENT: 'urgent',
        VIP: 'vip'
    };

    const UrgencyLabels = {
        normal: 'Обычный',
        urgent: 'Срочный',
        vip: 'VIP (приоритет)'
    };

    const SolutionOption = {
        STANDARD: 'standard',
        VIP: 'vip'
    };

    // ========== STATUS LABELS ==========
    const RequestStatusLabels = {
        [EngineeringRequestStatus.NEW]: { label: 'Новая', icon: '📋', color: '#6b7280' },
        [EngineeringRequestStatus.IN_REVIEW]: { label: 'На рассмотрении', icon: '🔍', color: '#3b82f6' },
        [EngineeringRequestStatus.OFFER_SENT]: { label: 'КП отправлено', icon: '📨', color: '#8b5cf6' },
        [EngineeringRequestStatus.PAID]: { label: 'Оплачено', icon: '💳', color: '#22c55e' },
        [EngineeringRequestStatus.IN_WORK]: { label: 'В работе', icon: '🔧', color: '#f59e0b' },
        [EngineeringRequestStatus.DELIVERED]: { label: 'Выполнено', icon: '📦', color: '#10b981' },
        [EngineeringRequestStatus.CLOSED]: { label: 'Закрыто', icon: '✅', color: '#059669' },
        [EngineeringRequestStatus.CANCELLED]: { label: 'Отменено', icon: '❌', color: '#ef4444' }
    };

    const StageStatusLabels = {
        [EngineeringStageStatus.PLAN]: { label: 'Запланировано', icon: '📅', color: '#6b7280' },
        [EngineeringStageStatus.IN_WORK]: { label: 'В работе', icon: '🔧', color: '#f59e0b' },
        [EngineeringStageStatus.ON_REVIEW]: { label: 'На проверке', icon: '🔍', color: '#8b5cf6' },
        [EngineeringStageStatus.ACCEPTED]: { label: 'Принято', icon: '✅', color: '#22c55e' }
    };

    // ========== MODEL: ENGINEERING SOLUTION (Каталог) ==========
    class EngineeringSolution {
        constructor(data = {}) {
            this.id = data.id || generateId('sol_');
            this.title = data.title || '';
            this.shortDesc = data.shortDesc || '';
            this.fullDesc = data.fullDesc || '';
            this.imageUrl = data.imageUrl || '';
            this.tags = data.tags || [];
            this.category = data.category || SolutionCategory.DESIGN;
            this.basePrice = data.basePrice || 0;
            this.baseDurationDays = data.baseDurationDays || 7;
            this.vipMultiplier = data.vipMultiplier || 1.5;
            this.stagesTemplate = data.stagesTemplate || [];
            this.deliverablesTemplate = data.deliverablesTemplate || [];
            this.whatIncluded = data.whatIncluded || [];
            this.isActive = data.isActive !== false;
            this.sortOrder = data.sortOrder || 0;
        }

        save() {
            Storage.set(`solution_${this.id}`, this);
            return this;
        }

        static find(id) {
            const data = Storage.get(`solution_${id}`);
            return data ? new EngineeringSolution(data) : null;
        }

        static getAll(category = null) {
            const solutions = Storage.getAll('solution_');
            return solutions
                .filter(s => s.isActive && (!category || s.category === category))
                .map(s => new EngineeringSolution(s))
                .sort((a, b) => a.sortOrder - b.sortOrder);
        }

        static getByCategory() {
            const all = EngineeringSolution.getAll();
            const byCategory = {};
            Object.keys(SolutionCategory).forEach(key => {
                byCategory[SolutionCategory[key]] = [];
            });
            all.forEach(s => {
                if (byCategory[s.category]) {
                    byCategory[s.category].push(s);
                }
            });
            return byCategory;
        }
    }

    // ========== MODEL: ENGINEERING REQUEST ==========
    class EngineeringRequest {
        constructor(data = {}) {
            this.id = data.id || generateId('eng_');
            this.customerId = data.customerId || '';
            this.status = data.status || EngineeringRequestStatus.NEW;
            this.objectInfo = data.objectInfo || {
                name: '',
                area: null,
                floors: 1,
                city: '',
                address: '',
                hasDrawings: false,
                comment: ''
            };
            this.urgency = data.urgency || UrgencyLevel.NORMAL;
            this.selectedSolutionIds = data.selectedSolutionIds || [];
            this.totalEstimate = data.totalEstimate || 0;
            this.totalDurationDays = data.totalDurationDays || 0;
            this.offerId = data.offerId || null;
            this.offerPrice = data.offerPrice || null;
            this.stagesGenerated = data.stagesGenerated || false;
            this.fileIds = data.fileIds || [];
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.objectInfo.name) {
                errors.push('Укажите название объекта');
            }
            if (!this.objectInfo.city) {
                errors.push('Укажите город');
            }
            if (this.selectedSolutionIds.length === 0) {
                errors.push('Выберите хотя бы одно решение');
            }
            return errors;
        }

        canGenerateStages() {
            return this.validate().length === 0 && this.selectedSolutionIds.length > 0;
        }

        recalculateTotals() {
            const selectedSolutions = EngineeringSelectedSolution.findByRequest(this.id);
            let totalPrice = 0;
            let totalDays = 0;

            selectedSolutions.forEach(sel => {
                totalPrice += sel.calculatedPrice || 0;
                totalDays += sel.calculatedDurationDays || 0;
            });

            // Apply urgency factor
            if (this.urgency === UrgencyLevel.URGENT) {
                totalPrice *= 1.2;
                totalDays = Math.ceil(totalDays * 0.8);
            } else if (this.urgency === UrgencyLevel.VIP) {
                totalPrice *= 1.5;
                totalDays = Math.ceil(totalDays * 0.6);
            }

            this.totalEstimate = Math.round(totalPrice);
            this.totalDurationDays = totalDays;

            return { totalEstimate: this.totalEstimate, totalDurationDays: this.totalDurationDays };
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`engineeringRequest_${this.id}`, this);
            return this;
        }

        delete() {
            // Delete selected solutions
            const selected = EngineeringSelectedSolution.findByRequest(this.id);
            selected.forEach(s => Storage.remove(`engineeringSelected_${s.id}`));
            // Delete stages
            const stages = EngineeringStage.findByRequest(this.id);
            stages.forEach(s => Storage.remove(`engineeringStage_${s.id}`));
            // Delete request
            Storage.remove(`engineeringRequest_${this.id}`);
        }

        static find(id) {
            const data = Storage.get(`engineeringRequest_${id}`);
            return data ? new EngineeringRequest(data) : null;
        }

        static findByCustomer(customerId, status = null) {
            const requests = Storage.getAll('engineeringRequest_');
            return requests
                .filter(r => r.customerId === customerId && (!status || r.status === status))
                .map(r => new EngineeringRequest(r))
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        }
    }

    // ========== MODEL: ENGINEERING SELECTED SOLUTION ==========
    class EngineeringSelectedSolution {
        constructor(data = {}) {
            this.id = data.id || generateId('esel_');
            this.requestId = data.requestId || '';
            this.solutionId = data.solutionId || '';
            this.option = data.option || SolutionOption.STANDARD;
            this.params = data.params || {
                area: null,
                floors: null,
                hasSourceFiles: false,
                comment: ''
            };
            this.calculatedPrice = data.calculatedPrice || 0;
            this.calculatedDurationDays = data.calculatedDurationDays || 0;
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        calculatePriceAndDuration(objectInfo) {
            const solution = EngineeringSolution.find(this.solutionId);
            if (!solution) return;

            let price = solution.basePrice;
            let days = solution.baseDurationDays;

            // Area factor
            const area = objectInfo.area || 100;
            if (area > 500) {
                price *= 1.4;
                days = Math.ceil(days * 1.3);
            } else if (area > 200) {
                price *= 1.2;
                days = Math.ceil(days * 1.15);
            } else if (area > 100) {
                price *= 1.1;
                days = Math.ceil(days * 1.05);
            }

            // Floors factor
            const floors = objectInfo.floors || 1;
            if (floors > 3) {
                price *= 1.3;
                days = Math.ceil(days * 1.2);
            } else if (floors > 1) {
                price *= 1.1;
                days = Math.ceil(days * 1.1);
            }

            // VIP option
            if (this.option === SolutionOption.VIP) {
                price *= solution.vipMultiplier;
            }

            // No source files = more work
            if (!objectInfo.hasDrawings) {
                price *= 1.15;
                days = Math.ceil(days * 1.1);
            }

            this.calculatedPrice = Math.round(price);
            this.calculatedDurationDays = days;

            return { price: this.calculatedPrice, days: this.calculatedDurationDays };
        }

        save() {
            Storage.set(`engineeringSelected_${this.id}`, this);
            return this;
        }

        delete() {
            Storage.remove(`engineeringSelected_${this.id}`);
        }

        static find(id) {
            const data = Storage.get(`engineeringSelected_${id}`);
            return data ? new EngineeringSelectedSolution(data) : null;
        }

        static findByRequest(requestId) {
            const selected = Storage.getAll('engineeringSelected_');
            return selected
                .filter(s => s.requestId === requestId)
                .map(s => new EngineeringSelectedSolution(s));
        }

        static findByRequestAndSolution(requestId, solutionId) {
            const all = EngineeringSelectedSolution.findByRequest(requestId);
            return all.find(s => s.solutionId === solutionId);
        }
    }

    // ========== MODEL: ENGINEERING STAGE ==========
    class EngineeringStage {
        constructor(data = {}) {
            this.id = data.id || generateId('estage_');
            this.requestId = data.requestId || '';
            this.solutionId = data.solutionId || null; // null for общие этапы
            this.title = data.title || '';
            this.orderNo = data.orderNo || 0;
            this.status = data.status || EngineeringStageStatus.PLAN;
            this.plannedStart = data.plannedStart || null;
            this.plannedEnd = data.plannedEnd || null;
            this.actualStart = data.actualStart || null;
            this.actualEnd = data.actualEnd || null;
            this.comment = data.comment || '';
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        isOverdue() {
            if (this.status === EngineeringStageStatus.ACCEPTED) return false;
            if (!this.plannedEnd) return false;
            return new Date() > new Date(this.plannedEnd);
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`engineeringStage_${this.id}`, this);
            return this;
        }

        static find(id) {
            const data = Storage.get(`engineeringStage_${id}`);
            return data ? new EngineeringStage(data) : null;
        }

        static findByRequest(requestId) {
            const stages = Storage.getAll('engineeringStage_');
            return stages
                .filter(s => s.requestId === requestId)
                .map(s => new EngineeringStage(s))
                .sort((a, b) => a.orderNo - b.orderNo);
        }

        static deleteByRequest(requestId) {
            const stages = EngineeringStage.findByRequest(requestId);
            stages.forEach(s => Storage.remove(`engineeringStage_${s.id}`));
        }
    }

    // ========== MODEL: DELIVERABLE ==========
    class Deliverable {
        constructor(data = {}) {
            this.id = data.id || generateId('deliv_');
            this.requestId = data.requestId || '';
            this.title = data.title || '';
            this.fileId = data.fileId || null;
            this.type = data.type || 'pdf';
            this.version = data.version || 1;
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            Storage.set(`deliverable_${this.id}`, this);
            return this;
        }

        static findByRequest(requestId) {
            const deliverables = Storage.getAll('deliverable_');
            return deliverables
                .filter(d => d.requestId === requestId)
                .map(d => new Deliverable(d));
        }
    }

    // ========== STAGE GENERATION SERVICE ==========
    function generateStages(request) {
        // Clear existing stages
        EngineeringStage.deleteByRequest(request.id);

        const selectedSolutions = EngineeringSelectedSolution.findByRequest(request.id);
        const stages = [];
        let currentDate = new Date();
        let orderNo = 0;

        // Helper to add days
        const addDays = (date, days) => {
            const result = new Date(date);
            result.setDate(result.getDate() + days);
            return result;
        };

        // 1. Общий этап: Подготовка ТЗ
        const tzDays = 2;
        stages.push(new EngineeringStage({
            requestId: request.id,
            solutionId: null,
            title: 'Подготовка технического задания',
            orderNo: orderNo++,
            plannedStart: currentDate.toISOString(),
            plannedEnd: addDays(currentDate, tzDays).toISOString()
        }));
        currentDate = addDays(currentDate, tzDays);

        // 2. Этапы по каждому выбранному решению
        for (const selected of selectedSolutions) {
            const solution = EngineeringSolution.find(selected.solutionId);
            if (!solution) continue;

            // Calculate complexity factor
            let factor = 1.0;
            const area = request.objectInfo.area || 100;
            if (area > 300) factor *= 1.2;
            if (request.objectInfo.floors > 2) factor *= 1.1;
            if (request.urgency === UrgencyLevel.URGENT) factor *= 0.85;
            if (request.urgency === UrgencyLevel.VIP) factor *= 0.7;
            if (selected.option === SolutionOption.VIP) factor *= 1.1;

            // Add stages from template
            for (const templateStage of solution.stagesTemplate) {
                const duration = Math.max(1, Math.ceil(templateStage.durationDays * factor));
                stages.push(new EngineeringStage({
                    requestId: request.id,
                    solutionId: selected.solutionId,
                    title: `${templateStage.title} (${solution.title})`,
                    orderNo: orderNo++,
                    plannedStart: currentDate.toISOString(),
                    plannedEnd: addDays(currentDate, duration).toISOString()
                }));
                currentDate = addDays(currentDate, duration);
            }
        }

        // 3. Общий этап: Финальное согласование
        const finalDays = 3;
        stages.push(new EngineeringStage({
            requestId: request.id,
            solutionId: null,
            title: 'Финальное согласование и передача результатов',
            orderNo: orderNo++,
            plannedStart: currentDate.toISOString(),
            plannedEnd: addDays(currentDate, finalDays).toISOString()
        }));

        // Save all stages
        stages.forEach(stage => stage.save());

        // Update request
        request.stagesGenerated = true;
        request.save();

        AuditLog.log('engineering_request', request.id, 'stages_generated', {
            meta: { stagesCount: stages.length }
        });

        return stages;
    }

    // ========== INITIALIZE DEFAULT SOLUTIONS CATALOG ==========
    function initSolutionsCatalog() {
        if (Storage.get('solutionsCatalogInitialized')) return;

        const solutions = [
            // === ПРОЕКТИРОВАНИЕ ===
            {
                id: 'sol_ar',
                title: 'Архитектурный раздел (АР)',
                shortDesc: 'Полный комплект архитектурных чертежей',
                category: SolutionCategory.DESIGN,
                basePrice: 450000,
                baseDurationDays: 14,
                vipMultiplier: 1.6,
                tags: ['проектирование', 'архитектура', 'чертежи'],
                whatIncluded: [
                    'Планы этажей',
                    'Разрезы и фасады',
                    'План кровли',
                    'Узлы и детали',
                    'Ведомость отделки'
                ],
                stagesTemplate: [
                    { title: 'Сбор исходных данных', durationDays: 2 },
                    { title: 'Разработка концепции', durationDays: 4 },
                    { title: 'Детальная проработка', durationDays: 6 },
                    { title: 'Оформление документации', durationDays: 2 }
                ],
                deliverablesTemplate: [
                    { title: 'Архитектурные чертежи (PDF)', type: 'pdf' },
                    { title: 'DWG файлы', type: 'dwg' }
                ],
                sortOrder: 1
            },
            {
                id: 'sol_kr',
                title: 'Конструктивный раздел (КР)',
                shortDesc: 'Расчёт и чертежи несущих конструкций',
                category: SolutionCategory.DESIGN,
                basePrice: 550000,
                baseDurationDays: 18,
                vipMultiplier: 1.5,
                tags: ['проектирование', 'конструктив', 'расчёт'],
                whatIncluded: [
                    'Расчёт несущих конструкций',
                    'Схемы армирования',
                    'Узлы соединений',
                    'Ведомость расхода стали',
                    'Спецификации'
                ],
                stagesTemplate: [
                    { title: 'Сбор нагрузок', durationDays: 3 },
                    { title: 'Расчёт конструкций', durationDays: 7 },
                    { title: 'Разработка чертежей', durationDays: 6 },
                    { title: 'Проверка и оформление', durationDays: 2 }
                ],
                deliverablesTemplate: [
                    { title: 'Расчётная записка', type: 'pdf' },
                    { title: 'Конструктивные чертежи (PDF)', type: 'pdf' },
                    { title: 'DWG файлы', type: 'dwg' }
                ],
                sortOrder: 2
            },
            {
                id: 'sol_ovik',
                title: 'ОВиК (отопление, вентиляция)',
                shortDesc: 'Проект систем отопления и вентиляции',
                category: SolutionCategory.DESIGN,
                basePrice: 380000,
                baseDurationDays: 12,
                vipMultiplier: 1.5,
                tags: ['проектирование', 'инженерия', 'овик'],
                whatIncluded: [
                    'Теплотехнический расчёт',
                    'Схема отопления',
                    'Схема вентиляции',
                    'Спецификация оборудования'
                ],
                stagesTemplate: [
                    { title: 'Теплотехнический расчёт', durationDays: 3 },
                    { title: 'Проектирование систем', durationDays: 6 },
                    { title: 'Оформление документации', durationDays: 3 }
                ],
                deliverablesTemplate: [
                    { title: 'Проект ОВиК (PDF)', type: 'pdf' }
                ],
                sortOrder: 3
            },
            {
                id: 'sol_vk',
                title: 'Водоснабжение и канализация (ВК)',
                shortDesc: 'Проект систем водоснабжения и водоотведения',
                category: SolutionCategory.DESIGN,
                basePrice: 320000,
                baseDurationDays: 10,
                vipMultiplier: 1.5,
                tags: ['проектирование', 'инженерия', 'сантехника'],
                whatIncluded: [
                    'Схема водоснабжения',
                    'Схема канализации',
                    'Гидравлический расчёт',
                    'Спецификация'
                ],
                stagesTemplate: [
                    { title: 'Гидравлический расчёт', durationDays: 2 },
                    { title: 'Разработка схем', durationDays: 5 },
                    { title: 'Оформление', durationDays: 3 }
                ],
                deliverablesTemplate: [
                    { title: 'Проект ВК (PDF)', type: 'pdf' }
                ],
                sortOrder: 4
            },
            {
                id: 'sol_eom',
                title: 'Электрика (ЭОМ)',
                shortDesc: 'Проект электроснабжения и освещения',
                category: SolutionCategory.DESIGN,
                basePrice: 350000,
                baseDurationDays: 12,
                vipMultiplier: 1.5,
                tags: ['проектирование', 'электрика', 'эом'],
                whatIncluded: [
                    'Расчёт нагрузок',
                    'Однолинейная схема',
                    'План освещения',
                    'План розеточной сети',
                    'Спецификация'
                ],
                stagesTemplate: [
                    { title: 'Расчёт нагрузок', durationDays: 2 },
                    { title: 'Разработка схем', durationDays: 6 },
                    { title: 'Планы и спецификации', durationDays: 4 }
                ],
                deliverablesTemplate: [
                    { title: 'Проект ЭОМ (PDF)', type: 'pdf' }
                ],
                sortOrder: 5
            },
            {
                id: 'sol_ss',
                title: 'Слаботочные системы (СС/СКС)',
                shortDesc: 'Проект слаботочных сетей и связи',
                category: SolutionCategory.DESIGN,
                basePrice: 280000,
                baseDurationDays: 8,
                vipMultiplier: 1.4,
                tags: ['проектирование', 'слаботочка', 'связь'],
                whatIncluded: [
                    'Схема СКС',
                    'План размещения оборудования',
                    'Спецификация'
                ],
                stagesTemplate: [
                    { title: 'Техническое задание', durationDays: 1 },
                    { title: 'Разработка схем', durationDays: 4 },
                    { title: 'Оформление', durationDays: 3 }
                ],
                deliverablesTemplate: [
                    { title: 'Проект СС (PDF)', type: 'pdf' }
                ],
                sortOrder: 6
            },
            {
                id: 'sol_bim',
                title: 'BIM-модель',
                shortDesc: '3D-модель здания с проверкой коллизий',
                category: SolutionCategory.DESIGN,
                basePrice: 650000,
                baseDurationDays: 21,
                vipMultiplier: 1.4,
                tags: ['проектирование', 'bim', '3d'],
                whatIncluded: [
                    'BIM-модель LOD 300',
                    'Отчёт о коллизиях',
                    'Визуализации'
                ],
                stagesTemplate: [
                    { title: 'Импорт исходных данных', durationDays: 3 },
                    { title: 'Создание модели', durationDays: 12 },
                    { title: 'Проверка коллизий', durationDays: 4 },
                    { title: 'Оформление отчёта', durationDays: 2 }
                ],
                deliverablesTemplate: [
                    { title: 'BIM-модель (IFC)', type: 'ifc' },
                    { title: 'Отчёт о коллизиях (PDF)', type: 'pdf' }
                ],
                sortOrder: 7
            },

            // === ОБСЛЕДОВАНИЕ ===
            {
                id: 'sol_survey',
                title: 'Техническое обследование',
                shortDesc: 'Обследование конструкций с заключением',
                category: SolutionCategory.SURVEY,
                basePrice: 250000,
                baseDurationDays: 7,
                vipMultiplier: 1.4,
                tags: ['обследование', 'экспертиза'],
                whatIncluded: [
                    'Визуальный осмотр',
                    'Инструментальное обследование',
                    'Фотофиксация',
                    'Заключение'
                ],
                stagesTemplate: [
                    { title: 'Выезд на объект', durationDays: 1 },
                    { title: 'Инструментальное обследование', durationDays: 2 },
                    { title: 'Анализ и заключение', durationDays: 4 }
                ],
                deliverablesTemplate: [
                    { title: 'Заключение обследования (PDF)', type: 'pdf' }
                ],
                sortOrder: 10
            },
            {
                id: 'sol_defect',
                title: 'Дефектовка',
                shortDesc: 'Ведомость дефектов с объёмами работ',
                category: SolutionCategory.SURVEY,
                basePrice: 180000,
                baseDurationDays: 5,
                vipMultiplier: 1.3,
                tags: ['обследование', 'дефектовка'],
                whatIncluded: [
                    'Осмотр конструкций',
                    'Фотофиксация дефектов',
                    'Ведомость дефектов',
                    'Рекомендации'
                ],
                stagesTemplate: [
                    { title: 'Выезд и осмотр', durationDays: 1 },
                    { title: 'Составление ведомости', durationDays: 3 },
                    { title: 'Оформление', durationDays: 1 }
                ],
                deliverablesTemplate: [
                    { title: 'Ведомость дефектов (PDF)', type: 'pdf' }
                ],
                sortOrder: 11
            },
            {
                id: 'sol_geodesy',
                title: 'Геодезия и обмеры',
                shortDesc: 'Геодезическая съёмка и обмерочные чертежи',
                category: SolutionCategory.SURVEY,
                basePrice: 220000,
                baseDurationDays: 5,
                vipMultiplier: 1.3,
                tags: ['обследование', 'геодезия', 'обмеры'],
                whatIncluded: [
                    'Геодезическая съёмка',
                    'Обмерочные чертежи',
                    'Ведомость помещений'
                ],
                stagesTemplate: [
                    { title: 'Выезд и съёмка', durationDays: 2 },
                    { title: 'Обработка данных', durationDays: 2 },
                    { title: 'Оформление чертежей', durationDays: 1 }
                ],
                deliverablesTemplate: [
                    { title: 'Обмерочные чертежи (PDF)', type: 'pdf' },
                    { title: 'DWG файлы', type: 'dwg' }
                ],
                sortOrder: 12
            },

            // === НАДЗОР ===
            {
                id: 'sol_technadzor',
                title: 'Технический надзор',
                shortDesc: 'Контроль качества строительных работ',
                category: SolutionCategory.SUPERVISION,
                basePrice: 400000,
                baseDurationDays: 30,
                vipMultiplier: 1.3,
                tags: ['надзор', 'контроль'],
                whatIncluded: [
                    'Регулярные проверки',
                    'Протоколы осмотров',
                    'Контроль скрытых работ',
                    'Итоговый отчёт'
                ],
                stagesTemplate: [
                    { title: 'Входной контроль', durationDays: 2 },
                    { title: 'Операционный контроль', durationDays: 25 },
                    { title: 'Приёмочный контроль', durationDays: 3 }
                ],
                deliverablesTemplate: [
                    { title: 'Журнал надзора (PDF)', type: 'pdf' },
                    { title: 'Итоговый отчёт (PDF)', type: 'pdf' }
                ],
                sortOrder: 20
            },
            {
                id: 'sol_authornadzor',
                title: 'Авторский надзор',
                shortDesc: 'Контроль соответствия проекту',
                category: SolutionCategory.SUPERVISION,
                basePrice: 350000,
                baseDurationDays: 30,
                vipMultiplier: 1.3,
                tags: ['надзор', 'авторский'],
                whatIncluded: [
                    'Проверка соответствия проекту',
                    'Согласование изменений',
                    'Журнал авторского надзора'
                ],
                stagesTemplate: [
                    { title: 'Регулярные проверки', durationDays: 28 },
                    { title: 'Оформление документации', durationDays: 2 }
                ],
                deliverablesTemplate: [
                    { title: 'Журнал авторского надзора (PDF)', type: 'pdf' }
                ],
                sortOrder: 21
            },

            // === ДОКУМЕНТАЦИЯ ===
            {
                id: 'sol_smeta',
                title: 'Смета / BoQ',
                shortDesc: 'Сметный расчёт стоимости работ',
                category: SolutionCategory.DOCS,
                basePrice: 150000,
                baseDurationDays: 5,
                vipMultiplier: 1.3,
                tags: ['документация', 'смета'],
                whatIncluded: [
                    'Локальная смета',
                    'Ведомость объёмов',
                    'Расчёт стоимости'
                ],
                stagesTemplate: [
                    { title: 'Анализ проекта', durationDays: 1 },
                    { title: 'Составление сметы', durationDays: 3 },
                    { title: 'Проверка и оформление', durationDays: 1 }
                ],
                deliverablesTemplate: [
                    { title: 'Смета (PDF)', type: 'pdf' },
                    { title: 'Смета (Excel)', type: 'xlsx' }
                ],
                sortOrder: 30
            },
            {
                id: 'sol_ppr',
                title: 'ППР / ПОС',
                shortDesc: 'Проект производства работ',
                category: SolutionCategory.DOCS,
                basePrice: 280000,
                baseDurationDays: 10,
                vipMultiplier: 1.4,
                tags: ['документация', 'ппр', 'пос'],
                whatIncluded: [
                    'Технологические карты',
                    'Стройгенплан',
                    'График работ',
                    'Мероприятия по ТБ'
                ],
                stagesTemplate: [
                    { title: 'Анализ проекта', durationDays: 2 },
                    { title: 'Разработка ППР', durationDays: 6 },
                    { title: 'Оформление', durationDays: 2 }
                ],
                deliverablesTemplate: [
                    { title: 'ППР (PDF)', type: 'pdf' }
                ],
                sortOrder: 31
            },
            {
                id: 'sol_ispolnit',
                title: 'Исполнительная документация',
                shortDesc: 'Комплект исполнительной документации',
                category: SolutionCategory.DOCS,
                basePrice: 200000,
                baseDurationDays: 7,
                vipMultiplier: 1.3,
                tags: ['документация', 'исполнительная'],
                whatIncluded: [
                    'Исполнительные схемы',
                    'Акты скрытых работ',
                    'Паспорта и сертификаты'
                ],
                stagesTemplate: [
                    { title: 'Сбор документов', durationDays: 3 },
                    { title: 'Оформление комплекта', durationDays: 4 }
                ],
                deliverablesTemplate: [
                    { title: 'Исполнительная документация (PDF)', type: 'pdf' }
                ],
                sortOrder: 32
            },

            // === БЕЗОПАСНОСТЬ ===
            {
                id: 'sol_fire',
                title: 'Пожарная безопасность',
                shortDesc: 'Раздел пожарной безопасности',
                category: SolutionCategory.SAFETY,
                basePrice: 250000,
                baseDurationDays: 10,
                vipMultiplier: 1.4,
                tags: ['безопасность', 'пожарная'],
                whatIncluded: [
                    'Расчёт категорий',
                    'Пути эвакуации',
                    'Системы пожаротушения',
                    'ПБ-мероприятия'
                ],
                stagesTemplate: [
                    { title: 'Анализ проекта', durationDays: 2 },
                    { title: 'Расчёты и разработка', durationDays: 6 },
                    { title: 'Оформление', durationDays: 2 }
                ],
                deliverablesTemplate: [
                    { title: 'Раздел ПБ (PDF)', type: 'pdf' }
                ],
                sortOrder: 40
            },

            // === ЭНЕРГОЭФФЕКТИВНОСТЬ ===
            {
                id: 'sol_energy',
                title: 'Энергоаудит',
                shortDesc: 'Энергетическое обследование здания',
                category: SolutionCategory.ENERGY,
                basePrice: 300000,
                baseDurationDays: 10,
                vipMultiplier: 1.3,
                tags: ['энергоэффективность', 'аудит'],
                whatIncluded: [
                    'Тепловизионное обследование',
                    'Анализ энергопотребления',
                    'Рекомендации по экономии',
                    'Энергопаспорт'
                ],
                stagesTemplate: [
                    { title: 'Обследование объекта', durationDays: 2 },
                    { title: 'Анализ данных', durationDays: 5 },
                    { title: 'Составление отчёта', durationDays: 3 }
                ],
                deliverablesTemplate: [
                    { title: 'Энергопаспорт (PDF)', type: 'pdf' },
                    { title: 'Отчёт по энергоаудиту (PDF)', type: 'pdf' }
                ],
                sortOrder: 50
            },
            {
                id: 'sol_thermal',
                title: 'Тепловизионное обследование',
                shortDesc: 'Выявление теплопотерь тепловизором',
                category: SolutionCategory.ENERGY,
                basePrice: 120000,
                baseDurationDays: 3,
                vipMultiplier: 1.2,
                tags: ['энергоэффективность', 'тепловизор'],
                whatIncluded: [
                    'Тепловизионная съёмка',
                    'Термограммы',
                    'Заключение'
                ],
                stagesTemplate: [
                    { title: 'Выезд и съёмка', durationDays: 1 },
                    { title: 'Анализ и отчёт', durationDays: 2 }
                ],
                deliverablesTemplate: [
                    { title: 'Отчёт с термограммами (PDF)', type: 'pdf' }
                ],
                sortOrder: 51
            }
        ];

        solutions.forEach(data => {
            const solution = new EngineeringSolution(data);
            solution.save();
        });

        Storage.set('solutionsCatalogInitialized', true);
        console.log('✅ Engineering Solutions catalog initialized');
    }

    // ========== EXPORT ==========
    window.EngineeringModels = {
        // Enums
        EngineeringRequestStatus,
        EngineeringStageStatus,
        SolutionCategory,
        SolutionCategoryLabels,
        UrgencyLevel,
        UrgencyLabels,
        SolutionOption,

        // Labels
        RequestStatusLabels,
        StageStatusLabels,

        // Classes
        EngineeringSolution,
        EngineeringRequest,
        EngineeringSelectedSolution,
        EngineeringStage,
        Deliverable,

        // Services
        generateStages,
        initSolutionsCatalog
    };

    // Auto-init catalog
    initSolutionsCatalog();

    console.log('✅ EngineeringModels loaded');

})();
