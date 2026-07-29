// ========== MODELS.JS ==========
// Сущности данных для QazGost AI
// Mock-storage с возможностью замены на реальный API

(function () {
    'use strict';

    // ========== ENUMS ==========
    const UserRole = {
        CUSTOMER: 'customer',
        EXECUTOR: 'executor',
        ENGINEER: 'engineer',
        CONTROLLER: 'controller',
        ADMIN: 'admin'
    };

    const OrderStatus = {
        DRAFT: 'DRAFT',
        PUBLISHED: 'PUBLISHED',
        IN_WORK: 'IN_WORK',
        ON_REVIEW: 'ON_REVIEW',
        DONE: 'DONE',
        CANCELLED: 'CANCELLED'
    };

    const ApplicationStatus = {
        DRAFT: 'DRAFT',
        SENT: 'SENT',
        REVIEW: 'REVIEW',
        ACCEPTED: 'ACCEPTED',
        REJECTED: 'REJECTED'
    };

    const WorkStatus = {
        IN_WORK: 'IN_WORK',
        ON_REVIEW: 'ON_REVIEW',
        FIXES: 'FIXES',
        DONE: 'DONE'
    };

    const StageStatus = {
        PLAN: 'PLAN',
        IN_WORK: 'IN_WORK',
        ON_REVIEW: 'ON_REVIEW',
        ACCEPTED: 'ACCEPTED'
    };

    const DefectStatus = {
        NEW: 'NEW',
        IN_FIX: 'IN_FIX',
        FIXED: 'FIXED',
        CONFIRMED: 'CONFIRMED'
    };

    const DefectSeverity = {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        CRITICAL: 'critical'
    };

    // ========== STORAGE HELPERS ==========
    const Storage = {
        get: (key) => {
            try {
                return JSON.parse(localStorage.getItem(key) || 'null');
            } catch {
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error('Storage error:', e);
            }
        },
        getAll: (prefix) => {
            const result = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    try {
                        result.push(JSON.parse(localStorage.getItem(key)));
                    } catch { }
                }
            }
            return result;
        },
        remove: (key) => {
            localStorage.removeItem(key);
        }
    };

    // ========== ID GENERATOR ==========
    function generateId(prefix = '') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    // ========== MODEL: USER ==========
    class User {
        constructor(data = {}) {
            this.id = data.id || generateId('user_');
            this.role = data.role || UserRole.CUSTOMER;
            this.email = data.email || '';
            this.phone = data.phone || '';
            this.name = data.name || '';
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`user_${this.id}`, this);
            return this;
        }

        static find(id) {
            return Storage.get(`user_${id}`);
        }

        static findByEmail(email) {
            const users = Storage.getAll('user_');
            return users.find(u => u.email === email);
        }

        static current() {
            const userId = Storage.get('currentUserId');
            return userId ? User.find(userId) : null;
        }

        static setCurrent(userId) {
            Storage.set('currentUserId', userId);
        }
    }

    // ========== MODEL: CUSTOMER PROFILE ==========
    class CustomerProfile {
        constructor(data = {}) {
            this.id = data.id || generateId('cp_');
            this.userId = data.userId || '';
            this.name = data.name || '';
            this.phone = data.phone || '';
            this.city = data.city || '';
            this.address = data.address || '';
            this.type = data.type || 'individual'; // individual | company
            this.companyName = data.companyName || '';
            this.inn = data.inn || '';
            this.isComplete = data.isComplete || false;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.name || this.name.length < 2) errors.push('Укажите имя (минимум 2 символа)');
            if (!this.phone || this.phone.length < 10) errors.push('Укажите телефон');
            if (!this.city) errors.push('Укажите город');
            return errors;
        }

        checkComplete() {
            this.isComplete = this.validate().length === 0;
            return this.isComplete;
        }

        save() {
            this.checkComplete();
            this.updatedAt = new Date().toISOString();
            Storage.set(`customerProfile_${this.userId}`, this);
            return this;
        }

        static findByUserId(userId) {
            return Storage.get(`customerProfile_${userId}`);
        }

        static getOrCreate(userId) {
            let profile = CustomerProfile.findByUserId(userId);
            if (!profile) {
                profile = new CustomerProfile({ userId });
                profile.save();
            }
            return new CustomerProfile(profile);
        }
    }

    // ========== MODEL: EXECUTOR PROFILE ==========
    class ExecutorProfile {
        constructor(data = {}) {
            this.id = data.id || generateId('ep_');
            this.userId = data.userId || '';
            this.orgName = data.orgName || '';
            this.contactName = data.contactName || '';
            this.phone = data.phone || '';
            this.email = data.email || '';
            this.city = data.city || '';
            this.region = data.region || '';
            this.type = data.type || 'individual'; // individual | company | brigade
            this.services = data.services || []; // ['foundation', 'walls', 'roofing', ...]
            this.experience = data.experience || 0; // years
            this.portfolio = data.portfolio || []; // array of image URLs
            this.description = data.description || '';
            this.rating = data.rating || 0;
            this.reviewsCount = data.reviewsCount || 0;
            this.ordersCompleted = data.ordersCompleted || 0;
            this.isVerified = data.isVerified || false;
            this.isComplete = data.isComplete || false;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.orgName && !this.contactName) errors.push('Укажите название организации или ФИО');
            if (!this.phone || this.phone.length < 10) errors.push('Укажите телефон');
            if (!this.city) errors.push('Укажите город');
            if (!this.services || this.services.length === 0) errors.push('Выберите хотя бы одну услугу');
            return errors;
        }

        checkComplete() {
            this.isComplete = this.validate().length === 0;
            return this.isComplete;
        }

        save() {
            this.checkComplete();
            this.updatedAt = new Date().toISOString();
            Storage.set(`executorProfile_${this.userId}`, this);
            return this;
        }

        static findByUserId(userId) {
            return Storage.get(`executorProfile_${userId}`);
        }

        static getOrCreate(userId) {
            let profile = ExecutorProfile.findByUserId(userId);
            if (!profile) {
                profile = new ExecutorProfile({ userId });
                profile.save();
            }
            return new ExecutorProfile(profile);
        }

        static getAll() {
            return Storage.getAll('executorProfile_');
        }
    }

    // ========== MODEL: ENGINEER PROFILE ==========
    // Профиль инженера-проектировщика (ПГС, архитектор, сметчик и т.д.)
    class EngineerProfile {
        constructor(data = {}) {
            this.id = data.id || generateId('engp_');
            this.userId = data.userId || '';
            this.fullName = data.fullName || '';
            this.phone = data.phone || '';
            this.email = data.email || '';
            this.city = data.city || '';
            this.region = data.region || '';

            // Тип: физлицо или организация
            this.type = data.type || 'individual'; // individual | company
            this.companyName = data.companyName || '';
            this.bin = data.bin || ''; // БИН организации

            // Специализации инженера
            this.specializations = data.specializations || [];
            // Возможные: ['architecture', 'structural', 'mep', 'electrical', 'hvac', 
            //             'plumbing', 'fire_safety', 'geotechnical', 'surveying', 
            //             'estimation', 'project_management']

            // Лицензии и сертификаты
            this.licenses = data.licenses || [];
            // Формат: [{ type: 'sro', number: '...', issueDate, expiryDate, isVerified }]

            // Образование
            this.education = data.education || [];
            // Формат: [{ institution, degree, year, specialty }]

            // Опыт работы
            this.experience = data.experience || 0; // лет
            this.projectsCompleted = data.projectsCompleted || 0;

            // Портфолио проектов
            this.portfolio = data.portfolio || [];
            // Формат: [{ title, description, images: [], category, year }]

            // Описание и статус
            this.description = data.description || '';
            this.rating = data.rating || 0;
            this.reviewsCount = data.reviewsCount || 0;
            this.isVerified = data.isVerified || false;
            this.isSroMember = data.isSroMember || false; // Член СРО
            this.isComplete = data.isComplete || false;

            // Тарифы
            this.hourlyRate = data.hourlyRate || null; // Почасовая ставка
            this.currency = data.currency || 'KZT';

            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.fullName || this.fullName.length < 2) errors.push('Укажите ФИО');
            if (!this.phone || this.phone.length < 10) errors.push('Укажите телефон');
            if (!this.city) errors.push('Укажите город');
            if (!this.specializations || this.specializations.length === 0) {
                errors.push('Выберите хотя бы одну специализацию');
            }
            if (this.type === 'company' && !this.companyName) {
                errors.push('Укажите название организации');
            }
            return errors;
        }

        checkComplete() {
            this.isComplete = this.validate().length === 0;
            return this.isComplete;
        }

        save() {
            this.checkComplete();
            this.updatedAt = new Date().toISOString();
            Storage.set(`engineerProfile_${this.userId}`, this);
            return this;
        }

        delete() {
            Storage.remove(`engineerProfile_${this.userId}`);
        }

        static findByUserId(userId) {
            const data = Storage.get(`engineerProfile_${userId}`);
            return data ? new EngineerProfile(data) : null;
        }

        static getOrCreate(userId) {
            let profile = EngineerProfile.findByUserId(userId);
            if (!profile) {
                profile = new EngineerProfile({ userId });
                profile.save();
            }
            return profile;
        }

        static getAll() {
            return Storage.getAll('engineerProfile_').map(p => new EngineerProfile(p));
        }

        static findBySpecialization(specialization) {
            return EngineerProfile.getAll().filter(p =>
                p.specializations.includes(specialization) && p.isComplete
            );
        }

        static findByCity(city) {
            return EngineerProfile.getAll().filter(p =>
                p.city === city && p.isComplete
            );
        }
    }

    // Справочник специализаций инженера
    const EngineerSpecializations = {
        architecture: 'Архитектура',
        structural: 'Конструктив (ПГС)',
        mep: 'Инженерные системы (MEP)',
        electrical: 'Электрика',
        hvac: 'Отопление и вентиляция (ОВиК)',
        plumbing: 'Водоснабжение и канализация (ВК)',
        fire_safety: 'Пожарная безопасность',
        geotechnical: 'Геотехника / Геология',
        surveying: 'Геодезия',
        estimation: 'Сметное дело',
        project_management: 'Управление проектами'
    };

    // ========== MODEL: ORDER ==========
    class Order {
        constructor(data = {}) {
            this.id = data.id || generateId('order_');
            this.customerId = data.customerId || '';
            this.executorId = data.executorId || null;
            this.status = data.status || OrderStatus.DRAFT;
            this.title = data.title || '';
            this.description = data.description || '';
            this.address = data.address || '';
            this.city = data.city || '';
            this.category = data.category || ''; // foundation, walls, roofing, etc.
            this.budget = data.budget || null;
            this.budgetType = data.budgetType || 'exact'; // exact | range | negotiable
            this.budgetMin = data.budgetMin || null;
            this.budgetMax = data.budgetMax || null;
            this.deadline = data.deadline || null;
            this.urgency = data.urgency || 'normal'; // urgent | normal | flexible
            this.photos = data.photos || [];
            this.attachments = data.attachments || [];
            this.estimateData = data.estimateData || null; // AI-generated estimate
            this.applicationsCount = data.applicationsCount || 0;
            this.viewsCount = data.viewsCount || 0;
            this.publishedAt = data.publishedAt || null;
            this.startedAt = data.startedAt || null;
            this.completedAt = data.completedAt || null;
            // Finance fields
            this.contractAmountKZT = data.contractAmountKZT || null; // Сумма сделки для расчёта комиссии 3%
            this.acceptedApplicationId = data.acceptedApplicationId || null; // ID принятого отклика
            this.assignedExecutorId = data.assignedExecutorId || null; // Закреплённый исполнитель (после оплаты комиссии)
            this.assignedAt = data.assignedAt || null; // Время закрепления
            this.commissionPaid = data.commissionPaid || false; // Комиссия 3% оплачена
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.title || this.title.length < 5) errors.push('Укажите название (минимум 5 символов)');
            if (!this.description || this.description.length < 20) errors.push('Добавьте описание (минимум 20 символов)');
            if (!this.city) errors.push('Укажите город');
            if (!this.category) errors.push('Выберите категорию работ');
            return errors;
        }

        canPublish() {
            return this.status === OrderStatus.DRAFT && this.validate().length === 0;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`order_${this.id}`, this);
            return this;
        }

        delete() {
            Storage.remove(`order_${this.id}`);
        }

        static find(id) {
            const data = Storage.get(`order_${id}`);
            return data ? new Order(data) : null;
        }

        static findByCustomer(customerId, status = null) {
            const orders = Storage.getAll('order_');
            return orders
                .filter(o => o.customerId === customerId && (!status || o.status === status))
                .map(o => new Order(o))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findPublished(filters = {}) {
            const orders = Storage.getAll('order_');
            return orders
                .filter(o => o.status === OrderStatus.PUBLISHED)
                .filter(o => !filters.city || o.city === filters.city)
                .filter(o => !filters.category || o.category === filters.category)
                .map(o => new Order(o))
                .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        }

        static getAll() {
            return Storage.getAll('order_').map(o => new Order(o));
        }

        static countByStatus(customerId) {
            const orders = Order.findByCustomer(customerId);
            const counts = {};
            Object.values(OrderStatus).forEach(s => counts[s] = 0);
            orders.forEach(o => counts[o.status]++);
            return counts;
        }
    }

    // ========== MODEL: APPLICATION ==========
    class Application {
        constructor(data = {}) {
            this.id = data.id || generateId('app_');
            this.orderId = data.orderId || '';
            this.executorId = data.executorId || '';
            this.status = data.status || ApplicationStatus.DRAFT;
            this.price = data.price || null;
            this.priceType = data.priceType || 'fixed'; // fixed | hourly | negotiable
            this.duration = data.duration || null; // days
            this.startDate = data.startDate || null;
            this.comment = data.comment || '';
            this.attachments = data.attachments || [];
            this.rejectionReason = data.rejectionReason || '';
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (!this.price || this.price <= 0) errors.push('Укажите цену');
            if (!this.duration || this.duration <= 0) errors.push('Укажите срок выполнения');
            return errors;
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`application_${this.id}`, this);
            return this;
        }

        delete() {
            Storage.remove(`application_${this.id}`);
        }

        static find(id) {
            const data = Storage.get(`application_${id}`);
            return data ? new Application(data) : null;
        }

        static findByOrder(orderId) {
            const apps = Storage.getAll('application_');
            return apps
                .filter(a => a.orderId === orderId)
                .map(a => new Application(a))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByExecutor(executorId, status = null) {
            const apps = Storage.getAll('application_');
            return apps
                .filter(a => a.executorId === executorId && (!status || a.status === status))
                .map(a => new Application(a))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static existsForOrder(orderId, executorId) {
            const apps = Application.findByOrder(orderId);
            return apps.some(a => a.executorId === executorId);
        }
    }

    // ========== MODEL: WORK ==========
    class Work {
        constructor(data = {}) {
            this.id = data.id || generateId('work_');
            this.orderId = data.orderId || '';
            this.executorId = data.executorId || '';
            this.applicationId = data.applicationId || '';
            this.status = data.status || WorkStatus.IN_WORK;
            this.agreedPrice = data.agreedPrice || 0;
            this.agreedDuration = data.agreedDuration || 0;
            this.startDate = data.startDate || new Date().toISOString();
            this.plannedEndDate = data.plannedEndDate || null;
            this.actualEndDate = data.actualEndDate || null;
            this.submittedAt = data.submittedAt || null;
            this.completedAt = data.completedAt || null;
            this.submissionPhotos = data.submissionPhotos || [];
            this.submissionComment = data.submissionComment || '';
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`work_${this.id}`, this);
            return this;
        }

        static find(id) {
            const data = Storage.get(`work_${id}`);
            return data ? new Work(data) : null;
        }

        static findByOrder(orderId) {
            const works = Storage.getAll('work_');
            return works.filter(w => w.orderId === orderId).map(w => new Work(w));
        }

        static findByExecutor(executorId, status = null) {
            const works = Storage.getAll('work_');
            return works
                .filter(w => w.executorId === executorId && (!status || w.status === status))
                .map(w => new Work(w))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
    }

    // ========== MODEL: ORDER STAGE ==========
    class OrderStage {
        constructor(data = {}) {
            this.id = data.id || generateId('stage_');
            this.orderId = data.orderId || '';
            this.workId = data.workId || '';
            this.title = data.title || '';
            this.description = data.description || '';
            this.order = data.order || 0; // sequence number
            this.status = data.status || StageStatus.PLAN;
            this.plannedStart = data.plannedStart || null;
            this.plannedEnd = data.plannedEnd || null;
            this.actualStart = data.actualStart || null;
            this.actualEnd = data.actualEnd || null;
            this.comment = data.comment || '';
            this.photos = data.photos || [];
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`stage_${this.id}`, this);
            return this;
        }

        static find(id) {
            const data = Storage.get(`stage_${id}`);
            return data ? new OrderStage(data) : null;
        }

        static findByOrder(orderId) {
            const stages = Storage.getAll('stage_');
            return stages
                .filter(s => s.orderId === orderId)
                .map(s => new OrderStage(s))
                .sort((a, b) => a.order - b.order);
        }
    }

    // ========== MODEL: DEFECT ==========
    class Defect {
        constructor(data = {}) {
            this.id = data.id || generateId('defect_');
            this.orderId = data.orderId || '';
            this.workId = data.workId || '';
            this.stageId = data.stageId || null; // optional
            this.status = data.status || DefectStatus.NEW;
            this.severity = data.severity || DefectSeverity.MEDIUM;
            this.title = data.title || '';
            this.description = data.description || '';
            this.photos = data.photos || [];
            this.fixPhotos = data.fixPhotos || [];
            this.fixComment = data.fixComment || '';
            this.fixedAt = data.fixedAt || null;
            this.confirmedAt = data.confirmedAt || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        save() {
            this.updatedAt = new Date().toISOString();
            Storage.set(`defect_${this.id}`, this);
            return this;
        }

        static find(id) {
            const data = Storage.get(`defect_${id}`);
            return data ? new Defect(data) : null;
        }

        static findByOrder(orderId) {
            const defects = Storage.getAll('defect_');
            return defects
                .filter(d => d.orderId === orderId)
                .map(d => new Defect(d))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByWork(workId) {
            const defects = Storage.getAll('defect_');
            return defects
                .filter(d => d.workId === workId)
                .map(d => new Defect(d));
        }

        static countUnresolved(orderId) {
            const defects = Defect.findByOrder(orderId);
            return defects.filter(d => d.status !== DefectStatus.CONFIRMED).length;
        }
    }

    // ========== MODEL: ATTACHMENT ==========
    class Attachment {
        constructor(data = {}) {
            this.id = data.id || generateId('attach_');
            this.entityType = data.entityType || ''; // order, work, defect, stage, application
            this.entityId = data.entityId || '';
            this.url = data.url || '';
            this.fileName = data.fileName || '';
            this.mimeType = data.mimeType || '';
            this.size = data.size || 0;
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            Storage.set(`attachment_${this.id}`, this);
            return this;
        }

        static findByEntity(entityType, entityId) {
            const attachments = Storage.getAll('attachment_');
            return attachments.filter(a => a.entityType === entityType && a.entityId === entityId);
        }
    }

    // ========== MODEL: REVIEW ==========
    class Review {
        constructor(data = {}) {
            this.id = data.id || generateId('review_');
            this.orderId = data.orderId || '';
            this.workId = data.workId || '';
            this.executorId = data.executorId || '';
            this.customerId = data.customerId || '';
            this.rating = data.rating || 0; // 1-5
            this.text = data.text || '';
            this.pros = data.pros || [];
            this.cons = data.cons || [];
            this.isPublic = data.isPublic !== false;
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            if (this.rating < 1 || this.rating > 5) errors.push('Укажите оценку от 1 до 5');
            if (!this.text || this.text.length < 10) errors.push('Напишите отзыв (минимум 10 символов)');
            return errors;
        }

        save() {
            Storage.set(`review_${this.id}`, this);
            return this;
        }

        static find(id) {
            const data = Storage.get(`review_${id}`);
            return data ? new Review(data) : null;
        }

        static findByExecutor(executorId) {
            const reviews = Storage.getAll('review_');
            return reviews
                .filter(r => r.executorId === executorId && r.isPublic)
                .map(r => new Review(r))
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static findByOrder(orderId) {
            const reviews = Storage.getAll('review_');
            return reviews.filter(r => r.orderId === orderId).map(r => new Review(r));
        }
    }

    // ========== MODEL: AUDIT LOG ==========
    class AuditLog {
        constructor(data = {}) {
            this.id = data.id || generateId('audit_');
            this.entityType = data.entityType || ''; // order, application, work, defect, stage
            this.entityId = data.entityId || '';
            this.action = data.action || ''; // created, statusChanged, updated, deleted
            this.fromStatus = data.fromStatus || null;
            this.toStatus = data.toStatus || null;
            this.meta = data.meta || {}; // additional data
            this.actorId = data.actorId || '';
            this.actorRole = data.actorRole || '';
            this.actorName = data.actorName || '';
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        save() {
            Storage.set(`audit_${this.id}`, this);
            return this;
        }

        static findByEntity(entityType, entityId) {
            const logs = Storage.getAll('audit_');
            return logs
                .filter(l => l.entityType === entityType && l.entityId === entityId)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        static log(entityType, entityId, action, data = {}) {
            const currentUser = User.current();
            const log = new AuditLog({
                entityType,
                entityId,
                action,
                fromStatus: data.fromStatus,
                toStatus: data.toStatus,
                meta: data.meta || {},
                actorId: currentUser?.id || 'system',
                actorRole: currentUser?.role || 'system',
                actorName: currentUser?.name || 'Система'
            });
            return log.save();
        }
    }

    // ========== EXPORT ==========
    const ModelsExport = {
        // Enums
        UserRole,
        OrderStatus,
        ApplicationStatus,
        WorkStatus,
        StageStatus,
        DefectStatus,
        DefectSeverity,
        EngineerSpecializations,

        // Classes
        User,
        CustomerProfile,
        ExecutorProfile,
        EngineerProfile,
        Order,
        Application,
        Work,
        OrderStage,
        Defect,
        Attachment,
        Review,
        AuditLog,

        // Helpers
        generateId,
        Storage,

        // Internal helpers for model extensions (e.g., modelsV2.js)
        _internal: { Storage, generateId }
    };

    // Обратная совместимость
    window.Models = ModelsExport;

    // Регистрация в реестре модулей
    if (window.ModuleRegistry) {
        window.ModuleRegistry.register('Models', ModelsExport, {
            version: '2.0',
            depends: []
        });
    } else {
        console.log('✅ Models loaded (Registry not available yet)');
    }

})();
