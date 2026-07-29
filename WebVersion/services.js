/**
 * ========================================
 * QazGost AI — Сервисный слой (services.js)
 * ========================================
 * Общие функции для Кабинетов Заказчика и Исполнителя
 */

(function () {
    'use strict';

    // ========================================
    // 1. КОНСТАНТЫ И КОНФИГУРАЦИЯ
    // ========================================

    const CURRENCY = '₸'; // Казахстанский тенге
    const STORAGE_PREFIX = 'qazgost_';

    // Статусы заявок
    const APPLICATION_STATUSES = {
        DRAFT: 'draft',
        SENT: 'sent',
        REVIEWING: 'reviewing',
        ACCEPTED: 'accepted',
        REJECTED: 'rejected'
    };

    // Статусы работ
    const WORK_STATUSES = {
        IN_PROGRESS: 'in_progress',
        ON_REVIEW: 'on_review',
        CORRECTIONS: 'corrections',
        COMPLETED: 'completed'
    };

    // Статусы дефектов
    const DEFECT_STATUSES = {
        NEW: 'new',
        IN_PROGRESS: 'in_progress',
        FIXED: 'fixed',
        CONFIRMED: 'confirmed'
    };

    // Статусы смет
    const ESTIMATE_STATUSES = {
        DRAFT: 'draft',
        FOR_APPROVAL: 'for_approval',
        APPROVED: 'approved',
        ARCHIVE: 'archive'
    };

    // Разрешённые переходы статусов
    const STATUS_TRANSITIONS = {
        application: {
            draft: ['sent'],
            sent: ['reviewing'],
            reviewing: ['accepted', 'rejected']
        },
        work: {
            in_progress: ['on_review'],
            on_review: ['corrections', 'completed'],
            corrections: ['on_review']
        },
        defect: {
            new: ['in_progress'],
            in_progress: ['fixed'],
            fixed: ['confirmed', 'in_progress']
        },
        estimate: {
            draft: ['for_approval'],
            for_approval: ['approved', 'draft'],
            approved: ['archive']
        }
    };

    // ========================================
    // 2. ХРАНИЛИЩЕ (localStorage wrapper)
    // ========================================

    const Storage = {
        get(key) {
            try {
                const data = localStorage.getItem(STORAGE_PREFIX + key);
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('Storage.get error:', e);
                return null;
            }
        },

        set(key, value) {
            try {
                localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage.set error:', e);
                return false;
            }
        },

        remove(key) {
            localStorage.removeItem(STORAGE_PREFIX + key);
        },

        // Получить коллекцию (массив объектов)
        getCollection(name) {
            return this.get(name) || [];
        },

        // Добавить в коллекцию
        addToCollection(name, item) {
            const collection = this.getCollection(name);
            item.id = item.id || this.generateId();
            item.createdAt = item.createdAt || new Date().toISOString();
            collection.push(item);
            this.set(name, collection);
            return item;
        },

        // Обновить в коллекции
        updateInCollection(name, id, updates) {
            const collection = this.getCollection(name);
            const index = collection.findIndex(item => item.id === id);
            if (index !== -1) {
                collection[index] = { ...collection[index], ...updates, updatedAt: new Date().toISOString() };
                this.set(name, collection);
                return collection[index];
            }
            return null;
        },

        // Удалить из коллекции
        removeFromCollection(name, id) {
            const collection = this.getCollection(name);
            const filtered = collection.filter(item => item.id !== id);
            this.set(name, filtered);
        },

        // Найти в коллекции
        findInCollection(name, id) {
            const collection = this.getCollection(name);
            return collection.find(item => item.id === id);
        },

        // Генератор ID
        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
        }
    };

    // ========================================
    // 3. АВТОРИЗАЦИЯ И РОЛИ
    // ========================================

    const Auth = {
        // Проверка авторизации
        requireAuth(callback) {
            if (this.isLoggedIn()) {
                if (callback) callback();
                return true;
            } else {
                if (typeof showAuthScreen === 'function') {
                    showAuthScreen();
                } else if (typeof window.showEnhancedToast === 'function') {
                    window.showEnhancedToast({ type: 'warning', message: 'Необходима авторизация' });
                }
                return false;
            }
        },

        isLoggedIn() {
            return localStorage.getItem('isLoggedIn') === 'true' || !!Storage.get('currentUser');
        },

        getCurrentUser() {
            return Storage.get('currentUser') || {
                id: 'guest',
                name: 'Гость',
                role: this.getCurrentRole()
            };
        },

        getCurrentRole() {
            // Делегируем в RoleManager (единый источник правды)
            if (window.RoleManager) return window.RoleManager.current();
            return localStorage.getItem('selectedRole') || 'customer';
        },

        // Получить все активные роли пользователя
        getAllRoles() {
            if (window.RoleManager) return window.RoleManager.allRoles();
            const saved = localStorage.getItem('userRoles');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { return ['customer']; }
            }
            return ['customer'];
        },

        // Установить все роли пользователя
        setAllRoles(roles) {
            if (window.RoleManager) {
                window.RoleManager.setRoles(roles);
                return;
            }
            localStorage.setItem('userRoles', JSON.stringify(roles));
        },

        // Проверить, есть ли у пользователя определенная роль
        hasRole(role) {
            if (window.RoleManager) return window.RoleManager.hasRole(role);
            return this.getAllRoles().includes(role);
        },

        // Проверить, есть ли у пользователя все роли
        hasAllRoles() {
            if (window.RoleManager) return window.RoleManager.hasAllRoles();
            const allRoles = ['customer', 'executor', 'engineer', 'controller', 'admin'];
            const userRoles = this.getAllRoles();
            return allRoles.every(r => userRoles.includes(r));
        },

        // Дать пользователю все роли
        grantAllRoles() {
            if (window.RoleManager) return window.RoleManager.grantAllRoles();
            const allRoles = ['customer', 'executor', 'engineer', 'controller', 'admin'];
            this.setAllRoles(allRoles);
            History.logEvent('ALL_ROLES_GRANTED', null, { roles: allRoles });
            console.log('✅ Все роли успешно назначены:', allRoles);
            return true;
        },

        switchRole(role) {
            // Делегируем в RoleManager — он обновляет storage, UI и генерирует событие
            if (window.RoleManager) {
                return window.RoleManager.switchTo(role, { showToast: false });
            }

            // Fallback если RoleManager не загрузился
            const validRoles = ['customer', 'executor', 'engineer', 'controller', 'admin'];
            if (!validRoles.includes(role)) {
                console.error('Invalid role:', role);
                return false;
            }
            localStorage.setItem('selectedRole', role);
            History.logEvent('ROLE_SWITCHED', null, { role });
            return true;
        },

        // Сохранить пользователя
        setCurrentUser(user) {
            Storage.set('currentUser', user);
        },

        // Выход
        logout() {
            Storage.remove('currentUser');
            localStorage.removeItem('isLoggedIn');
            // Токены в HttpOnly cookie — вызываем server-side logout
            if (window.API && window.API.Auth) {
                window.API.Auth.logout().catch(e => console.warn('Server logout error:', e));
            }
            History.logEvent('USER_LOGOUT', null, {});
        }
    };

    // ========================================
    // 4. ИСТОРИЯ / АУДИТ
    // ========================================

    const History = {
        logEvent(type, entityId, payload = {}) {
            const event = {
                type,
                entityId,
                payload,
                userId: Auth.getCurrentUser().id,
                role: Auth.getCurrentRole(),
                timestamp: new Date().toISOString()
            };
            Storage.addToCollection('history', event);
            console.log('[History]', type, entityId, payload);
            return event;
        },

        getHistory(entityId, entityType = null) {
            const all = Storage.getCollection('history');
            return all.filter(e => {
                if (entityId && e.entityId !== entityId) return false;
                if (entityType && e.payload?.entityType !== entityType) return false;
                return true;
            }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        },

        getRecentEvents(limit = 50) {
            const all = Storage.getCollection('history');
            return all.slice(-limit).reverse();
        }
    };

    // ========================================
    // 5. СТАТУС-МАШИНЫ
    // ========================================

    const StateMachine = {
        canTransition(entityType, currentStatus, newStatus) {
            const transitions = STATUS_TRANSITIONS[entityType];
            if (!transitions) return false;
            const allowed = transitions[currentStatus];
            return allowed && allowed.includes(newStatus);
        },

        transition(collectionName, entityType, entityId, newStatus) {
            const entity = Storage.findInCollection(collectionName, entityId);
            if (!entity) {
                console.error('Entity not found:', entityId);
                return { success: false, error: 'Entity not found' };
            }

            const currentStatus = entity.status;
            if (!this.canTransition(entityType, currentStatus, newStatus)) {
                console.error('Invalid transition:', currentStatus, '->', newStatus);
                return {
                    success: false,
                    error: `Нельзя перейти из "${currentStatus}" в "${newStatus}"`
                };
            }

            // Обновить статус
            Storage.updateInCollection(collectionName, entityId, { status: newStatus });

            // Записать в историю
            History.logEvent('STATUS_CHANGED', entityId, {
                entityType,
                from: currentStatus,
                to: newStatus
            });

            return { success: true, from: currentStatus, to: newStatus };
        }
    };

    // ========================================
    // 6. РАБОТА С ФАЙЛАМИ
    // ========================================

    const Files = {
        // Загрузить файл (сохранить как base64)
        async uploadFile(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const fileData = {
                        id: Storage.generateId(),
                        name: file.name,
                        type: file.type,
                        size: file.size,
                        data: e.target.result,
                        uploadedAt: new Date().toISOString()
                    };
                    Storage.addToCollection('files', fileData);
                    resolve(fileData);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        },

        // Прикрепить файл к сущности
        attachFile(entityType, entityId, fileId) {
            const attachment = {
                entityType,
                entityId,
                fileId,
                attachedAt: new Date().toISOString()
            };
            Storage.addToCollection('attachments', attachment);
            History.logEvent('FILE_ATTACHED', entityId, { fileId, entityType });
            return attachment;
        },

        // Получить файлы сущности
        getEntityFiles(entityType, entityId) {
            const attachments = Storage.getCollection('attachments')
                .filter(a => a.entityType === entityType && a.entityId === entityId);
            const files = Storage.getCollection('files');
            return attachments.map(a => files.find(f => f.id === a.fileId)).filter(Boolean);
        },

        // Удалить вложение
        deleteAttachment(attachmentId) {
            Storage.removeFromCollection('attachments', attachmentId);
        }
    };

    // ========================================
    // 7. PDF ГЕНЕРАЦИЯ
    // ========================================

    const PDF = {
        // Проверить наличие jsPDF
        isAvailable() {
            return typeof window.jspdf !== 'undefined' || typeof window.jsPDF !== 'undefined';
        },

        // Получить экземпляр jsPDF
        getInstance() {
            const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
            if (!jsPDF) {
                console.error('jsPDF not loaded');
                return null;
            }
            return new jsPDF();
        },

        // Генерация PDF заказа
        generateOrderPdf(orderId, includeProfile = true) {
            const doc = this.getInstance();
            if (!doc) return null;

            const order = Storage.findInCollection('orders', orderId);
            if (!order) return null;

            // Заголовок
            doc.setFontSize(18);
            doc.text('ЗАКАЗ №' + order.id.slice(-6).toUpperCase(), 20, 20);

            doc.setFontSize(12);
            let y = 35;

            // Информация о заказе
            doc.text('Название: ' + (order.title || '-'), 20, y); y += 8;
            doc.text('Адрес: ' + (order.address || '-'), 20, y); y += 8;
            doc.text('Бюджет: ' + (order.budget || 0).toLocaleString() + ' ' + CURRENCY, 20, y); y += 8;
            doc.text('Сроки: ' + (order.deadlineStart || '-') + ' — ' + (order.deadlineEnd || '-'), 20, y); y += 8;
            doc.text('Статус: ' + (order.status || '-'), 20, y); y += 15;

            // Описание
            if (order.description) {
                doc.text('Описание:', 20, y); y += 8;
                const lines = doc.splitTextToSize(order.description, 170);
                doc.text(lines, 20, y);
                y += lines.length * 6 + 10;
            }

            // Профиль исполнителя
            if (includeProfile) {
                const profile = Storage.get('executorProfile');
                if (profile) {
                    y += 10;
                    doc.text('ИСПОЛНИТЕЛЬ:', 20, y); y += 8;
                    doc.text('Имя: ' + (profile.name || '-'), 20, y); y += 8;
                    doc.text('Телефон: ' + (profile.phone || '-'), 20, y); y += 8;
                    doc.text('Тип: ' + (profile.type || '-'), 20, y);
                }
            }

            // Подвал
            doc.setFontSize(10);
            doc.text('Создано: ' + new Date().toLocaleString('ru-RU'), 20, 280);
            doc.text('QazGost AI', 170, 280);

            History.logEvent('ORDER_PDF_EXPORTED', orderId, {});
            return doc;
        },

        // Генерация PDF сметы
        generateEstimatePdf(estimateId, versionId = null) {
            const doc = this.getInstance();
            if (!doc) return null;

            const estimate = Storage.findInCollection('estimates', estimateId);
            if (!estimate) return null;

            // Найти версию
            let version = null;
            if (versionId) {
                version = Storage.getCollection('estimateVersions').find(v => v.id === versionId);
            } else {
                version = Storage.getCollection('estimateVersions')
                    .filter(v => v.estimateId === estimateId)
                    .sort((a, b) => b.versionNumber - a.versionNumber)[0];
            }

            // Заголовок
            doc.setFontSize(18);
            doc.text('СМЕТА', 20, 20);
            if (version) {
                doc.setFontSize(12);
                doc.text('Версия ' + version.versionNumber, 20, 28);
            }

            doc.setFontSize(10);
            let y = 40;

            // Таблица позиций
            if (version && version.items) {
                doc.text('№', 20, y);
                doc.text('Наименование', 30, y);
                doc.text('Ед.', 100, y);
                doc.text('Кол-во', 115, y);
                doc.text('Цена', 140, y);
                doc.text('Сумма', 165, y);
                y += 8;

                doc.line(20, y - 4, 190, y - 4);

                version.items.forEach((item, idx) => {
                    doc.text(String(idx + 1), 20, y);
                    doc.text(item.name?.slice(0, 30) || '-', 30, y);
                    doc.text(item.unit || 'шт', 100, y);
                    doc.text(String(item.qty || 0), 115, y);
                    doc.text(String(item.price || 0), 140, y);
                    doc.text(String((item.qty || 0) * (item.price || 0)), 165, y);
                    y += 7;

                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                });

                doc.line(20, y, 190, y);
                y += 8;
                doc.setFontSize(12);
                doc.text('ИТОГО: ' + (version.total || 0).toLocaleString() + ' ' + CURRENCY, 140, y);
            }

            History.logEvent('ESTIMATE_PDF_EXPORTED', estimateId, { versionId });
            return doc;
        },

        // Скачать PDF
        downloadPdf(doc, filename) {
            if (!doc) return;
            doc.save(filename || 'document.pdf');
        }
    };

    // ========================================
    // 8. ПРОФИЛЬ ИСПОЛНИТЕЛЯ
    // ========================================

    const ExecutorProfile = {
        load(userId) {
            return Storage.get('executorProfile') || this.createDraft(userId);
        },

        createDraft(userId) {
            const profile = {
                userId: userId || Auth.getCurrentUser().id,
                name: '',
                phone: '',
                email: '',
                description: '',
                type: '', // TOO, IP, PRIVATE
                services: [],
                regions: [],
                country: 'KZ',
                city: '',
                avatarUrl: '',
                portfolioUrls: [],
                rating: 0,
                reviewsCount: 0,
                completionPercent: 0,
                createdAt: new Date().toISOString()
            };
            Storage.set('executorProfile', profile);
            return profile;
        },

        update(fields) {
            const profile = this.load();
            const updated = { ...profile, ...fields, updatedAt: new Date().toISOString() };
            updated.completionPercent = this.calculateCompletion(updated);
            Storage.set('executorProfile', updated);
            History.logEvent('EXECUTOR_PROFILE_UPDATED', profile.userId, { fields: Object.keys(fields) });
            return updated;
        },

        setType(type) {
            return this.update({ type });
        },

        setServices(services) {
            return this.update({ services });
        },

        setRegions(regions) {
            return this.update({ regions });
        },

        uploadAvatar(dataUrl) {
            return this.update({ avatarUrl: dataUrl });
        },

        addPortfolioImage(dataUrl) {
            const profile = this.load();
            const urls = [...(profile.portfolioUrls || []), dataUrl].slice(0, 10);
            return this.update({ portfolioUrls: urls });
        },

        removePortfolioImage(index) {
            const profile = this.load();
            const urls = [...(profile.portfolioUrls || [])];
            urls.splice(index, 1);
            return this.update({ portfolioUrls: urls });
        },

        calculateCompletion(profile) {
            const required = ['name', 'phone', 'type', 'city'];
            const filled = required.filter(f => profile[f] && profile[f].length > 0);
            const hasServices = profile.services && profile.services.length > 0;
            const total = required.length + 1; // +1 за услуги
            const done = filled.length + (hasServices ? 1 : 0);
            return Math.round((done / total) * 100);
        },

        isMinimumComplete() {
            const profile = this.load();
            return profile.name && profile.phone && profile.type &&
                profile.city && profile.services && profile.services.length > 0;
        }
    };

    // ========================================
    // 9. ПРОФИЛЬ ЗАКАЗЧИКА
    // ========================================

    const CustomerProfile = {
        load(userId) {
            return Storage.get('customerProfile') || this.createDraft(userId);
        },

        createDraft(userId) {
            const profile = {
                userId: userId || Auth.getCurrentUser().id,
                name: '',
                phone: '',
                email: '',
                company: '',
                address: '',
                createdAt: new Date().toISOString()
            };
            Storage.set('customerProfile', profile);
            return profile;
        },

        update(fields) {
            const profile = this.load();
            const updated = { ...profile, ...fields, updatedAt: new Date().toISOString() };
            Storage.set('customerProfile', updated);
            History.logEvent('CUSTOMER_PROFILE_UPDATED', profile.userId, { fields: Object.keys(fields) });
            return updated;
        },

        isMinimumComplete() {
            const profile = this.load();
            return profile.name && profile.phone;
        }
    };

    // ========================================
    // 10. ЗАКАЗЫ
    // ========================================

    const Orders = {
        // Загрузить ленту заказов (для исполнителя)
        loadFeed(filters = {}) {
            let orders = Storage.getCollection('orders');

            // Применить фильтры
            if (filters.status) {
                orders = orders.filter(o => o.status === filters.status);
            }
            if (filters.region) {
                orders = orders.filter(o => o.region === filters.region);
            }
            if (filters.minPrice) {
                orders = orders.filter(o => (o.budget || 0) >= filters.minPrice);
            }
            if (filters.maxPrice) {
                orders = orders.filter(o => (o.budget || 0) <= filters.maxPrice);
            }

            History.logEvent('OPEN_ORDER_FEED', null, { filters });
            return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        // Загрузить заказы заказчика
        loadCustomerOrders(customerId, filters = {}) {
            let orders = Storage.getCollection('orders')
                .filter(o => o.customerId === customerId);

            if (filters.status) {
                orders = orders.filter(o => o.status === filters.status);
            }

            History.logEvent('OPEN_CUSTOMER_ORDERS', null, { customerId });
            return orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        },

        // Создать черновик заказа
        createDraft(customerId) {
            const order = {
                customerId: customerId || Auth.getCurrentUser().id,
                title: '',
                description: '',
                address: '',
                budget: 0,
                deadlineStart: '',
                deadlineEnd: '',
                status: 'draft',
                attachments: []
            };
            const created = Storage.addToCollection('orders', order);
            History.logEvent('ORDER_DRAFT_CREATED', created.id, {});
            return created;
        },

        // Обновить заказ
        update(orderId, fields) {
            const updated = Storage.updateInCollection('orders', orderId, fields);
            History.logEvent('ORDER_UPDATED', orderId, { fields: Object.keys(fields) });
            return updated;
        },

        // Опубликовать заказ
        publish(orderId) {
            if (!CustomerProfile.isMinimumComplete()) {
                return { success: false, error: 'Заполните профиль заказчика' };
            }

            const result = StateMachine.transition('orders', 'application', orderId, 'sent');
            if (result.success) {
                History.logEvent('ORDER_PUBLISHED', orderId, {});
            }
            return result;
        },

        // Получить детали заказа
        getDetails(orderId) {
            const order = Storage.findInCollection('orders', orderId);
            if (order) {
                order.applications = Storage.getCollection('applications')
                    .filter(a => a.orderId === orderId);
                order.changeRequests = Storage.getCollection('changeRequests')
                    .filter(cr => cr.orderId === orderId);
            }
            return order;
        },

        // Добавить файлы к заказу
        addAttachments(orderId, fileIds) {
            const order = Storage.findInCollection('orders', orderId);
            if (!order) return null;

            const attachments = [...(order.attachments || []), ...fileIds];
            return this.update(orderId, { attachments });
        }
    };

    // ========================================
    // 11. ЗАЯВКИ (Applications)
    // ========================================

    const Applications = {
        // Создать заявку на заказ
        create(orderId, proposedPrice, proposedDeadline, comment) {
            if (!ExecutorProfile.isMinimumComplete()) {
                return {
                    success: false,
                    error: 'Заполните анкету исполнителя перед отправкой заявки',
                    redirectTo: 'profile'
                };
            }

            const executorId = Auth.getCurrentUser().id;

            // Проверить, нет ли уже заявки
            const existing = Storage.getCollection('applications')
                .find(a => a.orderId === orderId && a.executorId === executorId);
            if (existing) {
                return { success: false, error: 'Вы уже отправляли заявку на этот заказ' };
            }

            const application = {
                orderId,
                executorId,
                proposedPrice: proposedPrice || 0,
                proposedDeadline: proposedDeadline || '',
                comment: comment || '',
                status: APPLICATION_STATUSES.SENT
            };

            const created = Storage.addToCollection('applications', application);
            History.logEvent('APPLICATION_SENT', created.id, { orderId });

            return { success: true, application: created };
        },

        // Получить заявки исполнителя
        getMyApplications(executorId) {
            return Storage.getCollection('applications')
                .filter(a => a.executorId === executorId);
        },

        // Получить заявки на заказ
        getOrderApplications(orderId) {
            return Storage.getCollection('applications')
                .filter(a => a.orderId === orderId);
        },

        // Принять заявку
        accept(applicationId) {
            const result = StateMachine.transition('applications', 'application', applicationId, 'accepted');
            if (result.success) {
                // Создать работу
                const application = Storage.findInCollection('applications', applicationId);
                if (application) {
                    Works.create(applicationId, application.orderId, application.executorId);
                }
            }
            return result;
        },

        // Отклонить заявку
        reject(applicationId) {
            return StateMachine.transition('applications', 'application', applicationId, 'rejected');
        }
    };

    // ========================================
    // 12. ЗАПРОСЫ НА ИЗМЕНЕНИЕ (ChangeRequests)
    // ========================================

    const ChangeRequests = {
        TYPES: {
            DEADLINES: 'deadlines',
            PRICE: 'price',
            MATERIALS: 'materials'
        },

        // Создать запрос на изменение сроков
        submitDeadlineChange(orderId, newStart, newEnd, comment) {
            return this.create(orderId, this.TYPES.DEADLINES, { newStart, newEnd }, comment);
        },

        // Создать запрос на изменение цены
        submitPriceChange(orderId, newPrice, breakdown, comment) {
            return this.create(orderId, this.TYPES.PRICE, { newPrice, breakdown }, comment);
        },

        // Создать запрос на изменение материалов
        submitMaterialsChange(orderId, fromMaterial, toMaterial, qty, reason, attachments) {
            return this.create(orderId, this.TYPES.MATERIALS, { fromMaterial, toMaterial, qty, reason }, attachments);
        },

        // Общий метод создания
        create(orderId, type, value, comment, attachments = []) {
            const cr = {
                orderId,
                executorId: Auth.getCurrentUser().id,
                type,
                value,
                comment: comment || '',
                attachments,
                status: 'pending'
            };

            const created = Storage.addToCollection('changeRequests', cr);
            History.logEvent('CHANGE_REQUEST_CREATED', created.id, { orderId, type });

            return created;
        },

        // Отменить запрос
        cancel(changeRequestId) {
            const cr = Storage.findInCollection('changeRequests', changeRequestId);
            if (!cr) return { success: false, error: 'Запрос не найден' };
            if (cr.status !== 'pending') {
                return { success: false, error: 'Можно отменить только ожидающие запросы' };
            }

            Storage.updateInCollection('changeRequests', changeRequestId, { status: 'cancelled' });
            History.logEvent('CHANGE_REQUEST_CANCELLED', changeRequestId, {});
            return { success: true };
        },

        // Получить запросы по заказу
        getByOrder(orderId) {
            return Storage.getCollection('changeRequests')
                .filter(cr => cr.orderId === orderId);
        }
    };

    // ========================================
    // 13. РАБОТЫ (Works)
    // ========================================

    const Works = {
        create(applicationId, orderId, executorId) {
            const work = {
                applicationId,
                orderId,
                executorId,
                status: WORK_STATUSES.IN_PROGRESS,
                stages: [],
                submittedAt: null,
                completedAt: null
            };

            const created = Storage.addToCollection('works', work);
            History.logEvent('WORK_CREATED', created.id, { orderId, applicationId });
            return created;
        },

        // Загрузить работы исполнителя
        loadMyWorks(executorId, filters = {}) {
            let works = Storage.getCollection('works')
                .filter(w => w.executorId === executorId);

            if (filters.status) {
                works = works.filter(w => w.status === filters.status);
            }

            History.logEvent('OPEN_MY_WORKS', null, { executorId });
            return works;
        },

        // Сдать работу на проверку
        submitForReview(workId, comment, attachments = []) {
            const result = StateMachine.transition('works', 'work', workId, WORK_STATUSES.ON_REVIEW);
            if (result.success) {
                Storage.updateInCollection('works', workId, {
                    submittedAt: new Date().toISOString(),
                    submitComment: comment,
                    submitAttachments: attachments
                });
                History.logEvent('WORK_SUBMITTED', workId, { comment });
            }
            return result;
        },

        // Принять работу
        complete(workId) {
            const result = StateMachine.transition('works', 'work', workId, WORK_STATUSES.COMPLETED);
            if (result.success) {
                Storage.updateInCollection('works', workId, {
                    completedAt: new Date().toISOString()
                });
            }
            return result;
        },

        // Вернуть на исправления
        returnToFix(workId, comment) {
            const result = StateMachine.transition('works', 'work', workId, WORK_STATUSES.CORRECTIONS);
            if (result.success) {
                History.logEvent('WORK_RETURNED', workId, { comment });
            }
            return result;
        },

        // Получить работу
        get(workId) {
            const work = Storage.findInCollection('works', workId);
            if (work) {
                work.defects = Defects.getByWork(workId);
                work.comments = Comments.getByWork(workId);
                work.history = History.getHistory(workId);
            }
            return work;
        }
    };

    // ========================================
    // 14. ДЕФЕКТЫ (Defects)
    // ========================================

    const Defects = {
        create(workId, stageId, description, severity, attachments = []) {
            const defect = {
                workId,
                stageId,
                description,
                severity, // 'minor', 'serious', 'critical'
                status: DEFECT_STATUSES.NEW,
                attachments,
                authorId: Auth.getCurrentUser().id
            };

            const created = Storage.addToCollection('defects', defect);
            History.logEvent('DEFECT_CREATED', created.id, { workId, severity });

            // Перевести работу в статус "Исправления"
            if (workId) {
                Works.returnToFix(workId, 'Обнаружен дефект: ' + description);
            }

            return created;
        },

        // Отметить как "В исправлении"
        markInProgress(defectId) {
            return StateMachine.transition('defects', 'defect', defectId, DEFECT_STATUSES.IN_PROGRESS);
        },

        // Отметить как исправленный
        markFixed(defectId, comment, attachments = []) {
            const result = StateMachine.transition('defects', 'defect', defectId, DEFECT_STATUSES.FIXED);
            if (result.success) {
                Storage.updateInCollection('defects', defectId, {
                    fixComment: comment,
                    fixAttachments: attachments,
                    fixedAt: new Date().toISOString()
                });
            }
            return result;
        },

        // Подтвердить исправление
        confirm(defectId) {
            return StateMachine.transition('defects', 'defect', defectId, DEFECT_STATUSES.CONFIRMED);
        },

        // Получить дефекты работы
        getByWork(workId) {
            return Storage.getCollection('defects').filter(d => d.workId === workId);
        },

        // Получить дефекты заказа
        getByOrder(orderId) {
            const works = Storage.getCollection('works').filter(w => w.orderId === orderId);
            const workIds = works.map(w => w.id);
            return Storage.getCollection('defects').filter(d => workIds.includes(d.workId));
        }
    };

    // ========================================
    // 15. КОММЕНТАРИИ (Comments)
    // ========================================

    const Comments = {
        post(workId, text, attachments = []) {
            const comment = {
                workId,
                authorId: Auth.getCurrentUser().id,
                authorRole: Auth.getCurrentRole(),
                text,
                attachments,
                parentId: null
            };

            const created = Storage.addToCollection('comments', comment);
            History.logEvent('COMMENT_ADDED', workId, { commentId: created.id });
            return created;
        },

        reply(parentId, text, attachments = []) {
            const parent = Storage.findInCollection('comments', parentId);
            if (!parent) return null;

            const comment = {
                workId: parent.workId,
                authorId: Auth.getCurrentUser().id,
                authorRole: Auth.getCurrentRole(),
                text,
                attachments,
                parentId
            };

            const created = Storage.addToCollection('comments', comment);
            History.logEvent('COMMENT_REPLY', parent.workId, { commentId: created.id, parentId });
            return created;
        },

        getByWork(workId) {
            return Storage.getCollection('comments')
                .filter(c => c.workId === workId)
                .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }
    };

    // ========================================
    // 16. СМЕТЫ (Estimates)
    // ========================================

    const Estimates = {
        createDraft(workId = null, source = 'manual') {
            const estimate = {
                executorId: Auth.getCurrentUser().id,
                workId,
                source, // 'manual', 'ai_recognition', 'quick_start'
                status: ESTIMATE_STATUSES.DRAFT,
                currentVersionId: null
            };

            const created = Storage.addToCollection('estimates', estimate);

            // Создать первую версию
            const version = this.saveVersion(created.id, [], 'Черновик');
            Storage.updateInCollection('estimates', created.id, { currentVersionId: version.id });

            History.logEvent('ESTIMATE_CREATED', created.id, { source });
            return created;
        },

        // Загрузить мои сметы
        loadMy(executorId) {
            return Storage.getCollection('estimates')
                .filter(e => e.executorId === executorId);
        },

        // Получить смету с версиями
        get(estimateId) {
            const estimate = Storage.findInCollection('estimates', estimateId);
            if (estimate) {
                estimate.versions = Storage.getCollection('estimateVersions')
                    .filter(v => v.estimateId === estimateId)
                    .sort((a, b) => b.versionNumber - a.versionNumber);
            }
            return estimate;
        },

        // Сохранить версию
        saveVersion(estimateId, items, note = '') {
            const versions = Storage.getCollection('estimateVersions')
                .filter(v => v.estimateId === estimateId);

            const total = items.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);

            const version = {
                estimateId,
                versionNumber: versions.length + 1,
                items,
                total,
                note
            };

            const created = Storage.addToCollection('estimateVersions', version);
            Storage.updateInCollection('estimates', estimateId, { currentVersionId: created.id });

            History.logEvent('ESTIMATE_VERSION_SAVED', estimateId, { versionNumber: created.versionNumber });
            return created;
        },

        // Добавить строку
        addRow(estimateId, item) {
            const estimate = this.get(estimateId);
            if (!estimate || !estimate.versions.length) return null;

            const currentVersion = estimate.versions[0];
            const items = [...currentVersion.items, { ...item, id: Storage.generateId() }];

            return this.saveVersion(estimateId, items, 'Добавлена позиция: ' + item.name);
        },

        // Обновить строку
        updateRow(estimateId, rowId, fields) {
            const estimate = this.get(estimateId);
            if (!estimate || !estimate.versions.length) return null;

            const currentVersion = estimate.versions[0];
            const items = currentVersion.items.map(item =>
                item.id === rowId ? { ...item, ...fields } : item
            );

            return this.saveVersion(estimateId, items, 'Изменена позиция');
        },

        // Удалить строку
        removeRow(estimateId, rowId) {
            const estimate = this.get(estimateId);
            if (!estimate || !estimate.versions.length) return null;

            const currentVersion = estimate.versions[0];
            const items = currentVersion.items.filter(item => item.id !== rowId);

            return this.saveVersion(estimateId, items, 'Удалена позиция');
        },

        // Пересчитать итоги
        recalculateTotals(items) {
            return items.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
        },

        // AI распознавание (заглушка)
        async runVolumeRecognition(images) {
            // MVP: возвращаем примерные данные
            History.logEvent('VOLUME_RECOGNITION_STARTED', null, { imagesCount: images.length });

            // Имитация задержки
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Примерный результат
            const mockItems = [
                { name: 'Штукатурка стен', unit: 'м²', qty: 45, price: 2500 },
                { name: 'Шпаклёвка', unit: 'м²', qty: 45, price: 1200 },
                { name: 'Покраска', unit: 'м²', qty: 45, price: 800 },
                { name: 'Укладка ламината', unit: 'м²', qty: 28, price: 1500 },
                { name: 'Монтаж плинтуса', unit: 'м.п.', qty: 24, price: 400 }
            ];

            History.logEvent('VOLUME_RECOGNITION_COMPLETED', null, { itemsCount: mockItems.length });
            return mockItems;
        }
    };

    // ========================================
    // 17. ЭТАПЫ РАБОТ (Stages)
    // ========================================

    const Stages = {
        create(orderId, name, planStart, planEnd) {
            const stage = {
                orderId,
                name,
                planStart,
                planEnd,
                actualStart: null,
                actualEnd: null,
                status: 'pending' // pending, in_progress, on_review, accepted
            };

            const created = Storage.addToCollection('stages', stage);
            History.logEvent('STAGE_CREATED', created.id, { orderId, name });
            return created;
        },

        update(stageId, fields) {
            const updated = Storage.updateInCollection('stages', stageId, fields);
            History.logEvent('STAGE_UPDATED', stageId, { fields: Object.keys(fields) });
            return updated;
        },

        setStatus(stageId, status) {
            return this.update(stageId, { status });
        },

        accept(stageId) {
            return this.update(stageId, {
                status: 'accepted',
                actualEnd: new Date().toISOString()
            });
        },

        getByOrder(orderId) {
            return Storage.getCollection('stages')
                .filter(s => s.orderId === orderId)
                .sort((a, b) => new Date(a.planStart) - new Date(b.planStart));
        },

        markOverdue() {
            const today = new Date().toISOString().split('T')[0];
            const stages = Storage.getCollection('stages');
            const overdue = stages.filter(s =>
                s.status !== 'accepted' && s.planEnd && s.planEnd < today
            );

            overdue.forEach(s => {
                Storage.updateInCollection('stages', s.id, { isOverdue: true });
            });

            return overdue;
        }
    };

    // ========================================
    // 18. ОТЗЫВЫ (Reviews)
    // ========================================

    const Reviews = {
        canLeave(orderId) {
            const order = Storage.findInCollection('orders', orderId);
            if (!order) return false;

            // Можно оставить отзыв если заказ завершён
            const works = Storage.getCollection('works')
                .filter(w => w.orderId === orderId && w.status === WORK_STATUSES.COMPLETED);

            return works.length > 0;
        },

        create(orderId, executorId, rating, text) {
            if (!this.canLeave(orderId)) {
                return { success: false, error: 'Отзыв можно оставить только после завершения работы' };
            }

            const review = {
                orderId,
                executorId,
                customerId: Auth.getCurrentUser().id,
                rating: Math.min(5, Math.max(1, rating)),
                text
            };

            const created = Storage.addToCollection('reviews', review);
            History.logEvent('REVIEW_ADDED', created.id, { orderId, executorId, rating });

            // Обновить рейтинг исполнителя
            this.updateExecutorRating(executorId);

            return { success: true, review: created };
        },

        updateExecutorRating(executorId) {
            const reviews = Storage.getCollection('reviews')
                .filter(r => r.executorId === executorId);

            if (reviews.length === 0) return;

            const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

            const profile = Storage.get('executorProfile');
            if (profile && profile.userId === executorId) {
                ExecutorProfile.update({
                    rating: Math.round(avgRating * 10) / 10,
                    reviewsCount: reviews.length
                });
            }
        },

        getByExecutor(executorId) {
            return Storage.getCollection('reviews')
                .filter(r => r.executorId === executorId);
        },

        getExecutorRating(executorId) {
            const reviews = this.getByExecutor(executorId);
            if (reviews.length === 0) return { avg: 0, count: 0 };

            const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            return {
                avg: Math.round(avg * 10) / 10,
                count: reviews.length
            };
        }
    };

    // ========================================
    // 19. ДАШБОРД ЗАКАЗЧИКА
    // ========================================

    const Dashboard = {
        loadStats(customerId) {
            const orders = Orders.loadCustomerOrders(customerId);
            const works = Storage.getCollection('works')
                .filter(w => orders.find(o => o.id === w.orderId));
            const defects = Storage.getCollection('defects')
                .filter(d => works.find(w => w.id === d.workId));
            const stages = Storage.getCollection('stages')
                .filter(s => orders.find(o => o.id === s.orderId));

            const overdueStages = Stages.markOverdue()
                .filter(s => orders.find(o => o.id === s.orderId));

            const stats = {
                totalOrders: orders.length,
                activeOrders: orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length,
                completedOrders: orders.filter(o => o.status === 'completed').length,
                overdueStagesCount: overdueStages.length,
                openDefectsCount: defects.filter(d => d.status !== DEFECT_STATUSES.CONFIRMED).length,
                totalBudget: orders.reduce((sum, o) => sum + (o.budget || 0), 0),
                currency: CURRENCY
            };

            History.logEvent('OPEN_CUSTOMER_DASHBOARD', null, { customerId });
            return stats;
        }
    };

    // ========================================
    // ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ
    // ========================================

    window.AppServices = {
        // Константы
        CURRENCY,
        APPLICATION_STATUSES,
        WORK_STATUSES,
        DEFECT_STATUSES,
        ESTIMATE_STATUSES,

        // Сервисы
        Storage,
        Auth,
        History,
        StateMachine,
        Files,
        PDF,

        // Профили
        ExecutorProfile,
        CustomerProfile,

        // Бизнес-сущности
        Orders,
        Applications,
        ChangeRequests,
        Works,
        Defects,
        Comments,
        Estimates,
        Stages,
        Reviews,
        Dashboard
    };

    // Короткие алиасы для часто используемых функций
    window.requireAuth = Auth.requireAuth.bind(Auth);
    window.getCurrentUser = Auth.getCurrentUser.bind(Auth);
    window.getCurrentRole = Auth.getCurrentRole.bind(Auth);
    window.switchRole = Auth.switchRole.bind(Auth);
    window.getAllRoles = Auth.getAllRoles.bind(Auth);
    window.hasRole = Auth.hasRole.bind(Auth);
    window.hasAllRoles = Auth.hasAllRoles.bind(Auth);
    window.grantAllRoles = Auth.grantAllRoles.bind(Auth);
    window.logEvent = History.logEvent.bind(History);
    window.isProfileComplete = ExecutorProfile.isMinimumComplete.bind(ExecutorProfile);
    window.requireProfileComplete = function (callback) {
        if (ExecutorProfile.isMinimumComplete()) {
            if (callback) callback();
            return true;
        } else {
            if (typeof showEnhancedToast === 'function') {
                showEnhancedToast({
                    type: 'warning',
                    message: 'Заполните анкету исполнителя перед отправкой заявки'
                });
            }
            if (typeof showPage === 'function') {
                showPage('profile');
            }
            return false;
        }
    };

    console.log('[Services] QazGost AI Services loaded');

})();
