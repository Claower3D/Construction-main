// ========== DATA SERVICE ==========
// API/Сервисы для QazGost AI
// Supports both: Real API (when backend is available) and localStorage fallback

(function () {
    'use strict';

    // ========== API MODE DETECTION ==========
    let useRealAPI = false;
    let apiChecked = false;

    // Check if real API is available
    async function checkAPIAvailability() {
        if (apiChecked) return useRealAPI;

        if (window.API && window.API.healthCheck) {
            try {
                const result = await window.API.healthCheck();
                useRealAPI = result.success && result.data?.database === 'connected';
                console.log(useRealAPI ? '🌐 Using Real API' : '💾 Using localStorage (API unavailable)');
            } catch (e) {
                useRealAPI = false;
                console.log('💾 Using localStorage fallback');
            }
        }
        apiChecked = true;
        return useRealAPI;
    }

    // Auto-check on load
    setTimeout(() => checkAPIAvailability(), 100);

    // Guard: ensure Models are loaded before destructuring
    if (!window.Models) {
        console.error('[DataService] window.Models is not loaded. Ensure models.js is included before dataService.js. Aborting initialization.');
        return;
    }

    const {
        User, CustomerProfile, ExecutorProfile, EngineerProfile, Order, Application,
        Work, OrderStage, Defect, Attachment, Review, AuditLog,
        OrderStatus, ApplicationStatus, WorkStatus, StageStatus, DefectStatus
    } = window.Models;

    if (!window.StatusMachine) {
        console.error('[DataService] window.StatusMachine is not loaded. Ensure statusMachine.js is included before dataService.js. Aborting initialization.');
        return;
    }
    const SM = window.StatusMachine;

    // ========== CURRENT USER CONTEXT ==========
    let currentUser = null;
    let currentProfile = null;

    function initUser() {
        // Try to get from localStorage
        const userId = localStorage.getItem('currentUserId');
        const userRole = (window.RoleManager && window.RoleManager.current()) || localStorage.getItem('userRole') || 'customer';
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        if (isLoggedIn) {
            currentUser = User.find(userId);
            if (!currentUser) {
                // Create new user
                currentUser = new User({
                    id: userId || undefined,
                    role: userRole,
                    email: localStorage.getItem('authEmail') || '',
                    phone: localStorage.getItem('authPhone') || '',
                    name: localStorage.getItem('userName') || 'Пользователь'
                });
                currentUser.save();
                localStorage.setItem('currentUserId', currentUser.id);
            }

            // Load profile based on role
            if (currentUser.role === 'customer') {
                currentProfile = CustomerProfile.getOrCreate(currentUser.id);
            } else if (currentUser.role === 'executor') {
                currentProfile = ExecutorProfile.getOrCreate(currentUser.id);
            } else if (currentUser.role === 'engineer') {
                currentProfile = EngineerProfile.getOrCreate(currentUser.id);
            }
        }

        return { user: currentUser, profile: currentProfile };
    }

    function getCurrentUser() {
        if (!currentUser) initUser();
        return currentUser;
    }

    function getCurrentProfile() {
        if (!currentProfile) initUser();
        return currentProfile;
    }

    function setUserRole(role) {
        // Нормализуем роль через RoleManager
        const canonical = window.RoleManager ? window.RoleManager.normalize(role) : role;

        if (currentUser) {
            currentUser.role = canonical;
            currentUser.save();
        }
        localStorage.setItem('userRole', role);

        // Reload profile for new role
        if (canonical === 'customer' || canonical === 'admin') {
            currentProfile = CustomerProfile.getOrCreate(currentUser?.id);
        } else if (canonical === 'executor') {
            currentProfile = ExecutorProfile.getOrCreate(currentUser?.id);
        } else if (canonical === 'engineer') {
            currentProfile = EngineerProfile.getOrCreate(currentUser?.id);
        }

        return currentProfile;
    }

    // Проверка: имеет ли пользователь доступ к функционалу заказчика
    function canAccessCustomerFeatures() {
        if (window.RoleManager) {
            return window.RoleManager.isOneOf('customer', 'admin') || window.RoleManager.hasRole('customer');
        }
        const user = getCurrentUser();
        if (!user) return false;
        return user.role === 'customer' || user.role === 'admin';
    }

    // Проверка: имеет ли пользователь доступ к функционалу исполнителя
    function canAccessExecutorFeatures() {
        if (window.RoleManager) {
            return window.RoleManager.isOneOf('executor', 'admin') || window.RoleManager.hasRole('executor');
        }
        const user = getCurrentUser();
        if (!user) return false;
        return user.role === 'executor' || user.role === 'admin';
    }

    // Проверка: имеет ли пользователь доступ к функционалу инженера
    function canAccessEngineerFeatures() {
        if (window.RoleManager) {
            return window.RoleManager.isOneOf('engineer', 'admin') || window.RoleManager.hasRole('engineer');
        }
        const user = getCurrentUser();
        if (!user) return false;
        return user.role === 'engineer' || user.role === 'admin';
    }

    // Проверка: является ли пользователь администратором
    function isAdmin() {
        const user = getCurrentUser();
        return user?.role === 'admin';
    }

    // Получить активную "подроль" для администратора (для UI)
    function getActiveViewRole() {
        const user = getCurrentUser();
        if (!user) return null;
        if (user.role === 'admin') {
            // Админ может переключаться между режимами просмотра
            return localStorage.getItem('adminViewRole') || 'customer';
        }
        return user.role;
    }

    // Установить активную "подроль" для администратора (для UI)
    function setAdminViewRole(viewRole) {
        if (['customer', 'executor', 'engineer'].includes(viewRole)) {
            localStorage.setItem('adminViewRole', viewRole);
        }
    }


    // ========== CUSTOMER API ==========
    const CustomerAPI = {
        // GET /customer/profile
        getProfile() {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };
            return { success: true, data: CustomerProfile.getOrCreate(user.id) };
        },

        // PUT /customer/profile
        updateProfile(data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const profile = CustomerProfile.getOrCreate(user.id);
            Object.assign(profile, data);
            profile.save();

            currentProfile = profile;
            return { success: true, data: profile };
        },

        // GET /customer/orders
        getOrders(filters = {}) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            let orders = Order.findByCustomer(user.id);

            if (filters.status) {
                orders = orders.filter(o => o.status === filters.status);
            }

            return { success: true, data: orders };
        },

        // POST /orders - создать черновик
        createOrder(data = {}) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = new Order({
                customerId: user.id,
                status: OrderStatus.DRAFT,
                ...data
            });
            order.save();

            AuditLog.log('order', order.id, 'created', {});

            return { success: true, data: order };
        },

        // PATCH /orders/:id - редактировать черновик
        updateOrder(orderId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            if (order.customerId !== user.id) return { success: false, error: 'Нет доступа' };
            if (order.status !== OrderStatus.DRAFT) {
                return { success: false, error: 'Можно редактировать только черновик' };
            }

            Object.assign(order, data);
            order.save();

            AuditLog.log('order', order.id, 'updated', { fields: Object.keys(data) });

            return { success: true, data: order };
        },

        // POST /orders/:id/publish
        publishOrder(orderId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            if (order.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            return SM.publishOrder(order, { id: user.id, role: user.role, name: user.name });
        },

        // DELETE /orders/:id - удалить черновик
        deleteOrder(orderId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            if (order.customerId !== user.id) return { success: false, error: 'Нет доступа' };
            if (order.status !== OrderStatus.DRAFT) {
                return { success: false, error: 'Можно удалить только черновик' };
            }

            order.delete();
            AuditLog.log('order', orderId, 'deleted', {});

            return { success: true };
        },

        // GET /orders/:id
        getOrder(orderId) {
            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            return { success: true, data: order };
        },

        // GET /orders/:id/applications
        getOrderApplications(orderId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            if (order.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const applications = Application.findByOrder(orderId);

            // Enrich with executor info
            const enriched = applications.map(app => {
                const executor = ExecutorProfile.findByUserId(app.executorId);
                return {
                    ...app,
                    executor: executor || { orgName: 'Исполнитель', rating: 0 }
                };
            });

            return { success: true, data: enriched };
        },

        // POST /orders/:id/applications/:appId/accept
        acceptApplication(orderId, appId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            if (order.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const application = Application.find(appId);
            if (!application) return { success: false, error: 'Заявка не найдена' };

            return SM.acceptApplication(application, order, { id: user.id, role: user.role });
        },

        // POST /orders/:id/applications/:appId/reject
        rejectApplication(orderId, appId, reason = '') {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            if (order.customerId !== user.id) return { success: false, error: 'Нет доступа' };

            const application = Application.find(appId);
            if (!application) return { success: false, error: 'Заявка не найдена' };

            application.rejectionReason = reason;
            return SM.transition(application, 'Application', ApplicationStatus.REJECTED, { id: user.id });
        },

        // GET /orders/:id/stages
        getOrderStages(orderId) {
            return { success: true, data: OrderStage.findByOrder(orderId) };
        },

        // POST /orders/:id/stages
        createStage(orderId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const stage = new OrderStage({
                orderId,
                ...data
            });
            stage.save();

            return { success: true, data: stage };
        },

        // GET /orders/:id/defects
        getOrderDefects(orderId) {
            return { success: true, data: Defect.findByOrder(orderId) };
        },

        // POST /orders/:id/defects
        createDefect(orderId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const works = Work.findByOrder(orderId);
            const work = works[0];

            const defect = new Defect({
                orderId,
                workId: work?.id,
                ...data
            });
            defect.save();

            AuditLog.log('defect', defect.id, 'created', { orderId });

            return { success: true, data: defect };
        },

        // POST /defects/:id/confirm
        confirmDefect(defectId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const defect = Defect.find(defectId);
            if (!defect) return { success: false, error: 'Дефект не найден' };

            return SM.transition(defect, 'Defect', DefectStatus.CONFIRMED, { id: user.id });
        },

        // POST /orders/:id/reviews
        createReview(orderId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };
            if (order.status !== OrderStatus.DONE) {
                return { success: false, error: 'Можно оставить отзыв только после завершения' };
            }

            const review = new Review({
                orderId,
                customerId: user.id,
                executorId: order.executorId,
                ...data
            });

            const errors = review.validate();
            if (errors.length > 0) {
                return { success: false, error: errors.join(', ') };
            }

            review.save();

            // Update executor rating
            const executor = ExecutorProfile.findByUserId(order.executorId);
            if (executor) {
                const reviews = Review.findByExecutor(order.executorId);
                const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                executor.rating = Math.round(avgRating * 10) / 10;
                executor.reviewsCount = reviews.length;
                executor.save();
            }

            return { success: true, data: review };
        },

        // GET /customer/summary
        getSummary() {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const orders = Order.findByCustomer(user.id);
            const counts = Order.countByStatus(user.id);

            return {
                success: true,
                data: {
                    totalOrders: orders.length,
                    drafts: counts[OrderStatus.DRAFT] || 0,
                    published: counts[OrderStatus.PUBLISHED] || 0,
                    inWork: counts[OrderStatus.IN_WORK] || 0,
                    completed: counts[OrderStatus.DONE] || 0
                }
            };
        },

        // Accept work
        acceptWork(orderId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const works = Work.findByOrder(orderId);
            const work = works[0];
            if (!work) return { success: false, error: 'Работа не найдена' };

            return SM.acceptWork(work, { id: user.id });
        },

        // Reject work
        rejectWork(orderId, reason) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const works = Work.findByOrder(orderId);
            const work = works[0];
            if (!work) return { success: false, error: 'Работа не найдена' };

            return SM.rejectWork(work, reason, { id: user.id });
        }
    };

    // ========== EXECUTOR API ==========
    const ExecutorAPI = {
        // GET /executor/profile
        getProfile() {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };
            return { success: true, data: ExecutorProfile.getOrCreate(user.id) };
        },

        // PUT /executor/profile
        updateProfile(data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const profile = ExecutorProfile.getOrCreate(user.id);
            Object.assign(profile, data);
            profile.save();

            currentProfile = profile;
            return { success: true, data: profile };
        },

        // GET /executor/orders - опубликованные заказы для ленты
        getAvailableOrders(filters = {}) {
            let orders = Order.findPublished(filters);

            // Enrich with customer info
            const enriched = orders.map(order => {
                const customer = CustomerProfile.findByUserId(order.customerId);
                return {
                    ...order,
                    customer: customer || { name: 'Заказчик', city: order.city }
                };
            });

            return { success: true, data: enriched };
        },

        // POST /orders/:id/apply
        applyToOrder(orderId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const order = Order.find(orderId);
            if (!order) return { success: false, error: 'Заказ не найден' };

            return SM.applyToOrder(order, user.id, data, { id: user.id });
        },

        // GET /executor/applications
        getMyApplications(status = null) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const applications = Application.findByExecutor(user.id, status);

            // Enrich with order info
            const enriched = applications.map(app => {
                const order = Order.find(app.orderId);
                return {
                    ...app,
                    order: order || { title: 'Заказ' }
                };
            });

            return { success: true, data: enriched };
        },

        // GET /executor/works
        getMyWorks(status = null) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const works = Work.findByExecutor(user.id, status);

            // Enrich with order info
            const enriched = works.map(work => {
                const order = Order.find(work.orderId);
                const customer = order ? CustomerProfile.findByUserId(order.customerId) : null;
                return {
                    ...work,
                    order: order || { title: 'Заказ' },
                    customer: customer || { name: 'Заказчик' }
                };
            });

            return { success: true, data: enriched };
        },

        // POST /works/:id/submit
        submitWork(workId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const work = Work.find(workId);
            if (!work) return { success: false, error: 'Работа не найдена' };
            if (work.executorId !== user.id) return { success: false, error: 'Нет доступа' };

            return SM.submitWork(work, data, { id: user.id });
        },

        // POST /defects/:id/markFixed
        markDefectFixed(defectId, data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const defect = Defect.find(defectId);
            if (!defect) return { success: false, error: 'Дефект не найден' };

            defect.fixPhotos = data.photos || [];
            defect.fixComment = data.comment || '';

            return SM.transition(defect, 'Defect', DefectStatus.FIXED, { id: user.id });
        },

        // GET /executor/summary
        getSummary() {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const works = Work.findByExecutor(user.id);
            const applications = Application.findByExecutor(user.id);
            const profile = ExecutorProfile.findByUserId(user.id);

            const worksByStatus = {};
            Object.values(WorkStatus).forEach(s => worksByStatus[s] = 0);
            works.forEach(w => worksByStatus[w.status]++);

            return {
                success: true,
                data: {
                    totalWorks: works.length,
                    inWork: worksByStatus[WorkStatus.IN_WORK] || 0,
                    onReview: worksByStatus[WorkStatus.ON_REVIEW] || 0,
                    completed: worksByStatus[WorkStatus.DONE] || 0,
                    pendingApplications: applications.filter(a => a.status === ApplicationStatus.SENT).length,
                    rating: profile?.rating || 0,
                    reviewsCount: profile?.reviewsCount || 0
                }
            };
        }
    };

    // ========== FILES API ==========
    const FilesAPI = {
        // POST /files/upload
        async upload(file, entityType, entityId) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const attachment = new Attachment({
                        entityType,
                        entityId,
                        url: e.target.result,
                        fileName: file.name,
                        mimeType: file.type,
                        size: file.size
                    });
                    attachment.save();

                    resolve({ success: true, data: attachment });
                };
                reader.onerror = () => {
                    resolve({ success: false, error: 'Ошибка загрузки файла' });
                };
                reader.readAsDataURL(file);
            });
        },

        // GET /files/:entityType/:entityId
        getByEntity(entityType, entityId) {
            return { success: true, data: Attachment.findByEntity(entityType, entityId) };
        }
    };

    // ========== ENGINEER API ==========
    const EngineerAPI = {
        // GET /engineer/profile
        getProfile() {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };
            return { success: true, data: EngineerProfile.getOrCreate(user.id) };
        },

        // PUT /engineer/profile
        updateProfile(data) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const profile = EngineerProfile.getOrCreate(user.id);
            Object.assign(profile, data);
            profile.save();

            currentProfile = profile;
            return { success: true, data: profile };
        },

        // GET /engineer/requests - доступные заявки на инжиниринг
        getAvailableRequests(filters = {}) {
            // Получаем заявки на инжиниринг из EngineeringModels если они есть
            if (window.EngineeringModels?.EngineeringRequest) {
                const requests = window.EngineeringModels.EngineeringRequest.getAll()
                    .filter(r => r.status === 'IN_REVIEW' || r.status === 'OFFER_SENT');

                // Фильтрация
                let filtered = requests;
                if (filters.category) {
                    filtered = filtered.filter(r => r.category === filters.category);
                }
                if (filters.city) {
                    filtered = filtered.filter(r => r.city === filters.city);
                }

                return { success: true, data: filtered };
            }

            // Demo data for testing
            const demoRequests = [
                {
                    id: 'eng-demo-001',
                    category: 'DESIGN',
                    objectName: 'Жилой комплекс "Астана Парк"',
                    objectAddress: 'г. Астана, ул. Сарыарка 15',
                    customerName: 'ТОО "СтройИнвест"',
                    customerPhone: '+7 701 234 5678',
                    customerEmail: 'info@stroyinvest.kz',
                    requirements: 'Разработка архитектурного проекта 16-этажного жилого комплекса. Требуется полный комплект проектной документации включая АР, КЖ, ОВиК.',
                    totalPrice: 2500000,
                    status: 'PENDING',
                    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                    solutions: [
                        { solutionId: 'arch-001', name: 'Архитектурный проект', description: 'Полный комплект АР', price: 1500000, icon: '🏛️' },
                        { solutionId: 'struct-001', name: 'Конструктив (КЖ)', description: 'Железобетонные конструкции', price: 800000, icon: '🏗️' },
                        { solutionId: 'hvac-001', name: 'ОВиК', description: 'Системы вентиляции', price: 200000, icon: '❄️' }
                    ],
                    attachments: [
                        { name: 'ТЗ_на_проектирование.pdf', url: '#' },
                        { name: 'Участок_кадастр.pdf', url: '#' }
                    ]
                },
                {
                    id: 'eng-demo-002',
                    category: 'CALCULATION',
                    objectName: 'Торговый центр "Мега"',
                    objectAddress: 'г. Алматы, пр. Достык 111',
                    customerName: 'АО "Ритейл Групп"',
                    customerPhone: '+7 702 555 1234',
                    customerEmail: 'tender@retailgroup.kz',
                    requirements: 'Расчёт несущих конструкций для реконструкции торгового центра. Усиление существующих колонн и перекрытий.',
                    totalPrice: 850000,
                    status: 'PENDING',
                    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                    solutions: [
                        { solutionId: 'calc-001', name: 'Расчёт конструкций', description: 'Статический расчёт', price: 450000, icon: '🔢' },
                        { solutionId: 'reinf-001', name: 'Проект усиления', description: 'Схемы усиления', price: 400000, icon: '🏗️' }
                    ],
                    attachments: []
                },
                {
                    id: 'eng-demo-003',
                    category: 'DOCUMENTATION',
                    objectName: 'Частный дом',
                    objectAddress: 'г. Караганда, пос. Жана-Арка',
                    customerName: 'Иванов Пётр Сергеевич',
                    customerPhone: '+7 705 111 2233',
                    customerEmail: 'petr.ivanov@mail.ru',
                    requirements: 'Подготовка эскизного проекта индивидуального жилого дома 250 м². Современный стиль, два этажа, гараж на 2 машины.',
                    totalPrice: 350000,
                    status: 'PENDING',
                    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
                    solutions: [
                        { solutionId: 'sketch-001', name: 'Эскизный проект', description: '3D-визуализация + планировки', price: 350000, icon: '🎨' }
                    ],
                    attachments: [
                        { name: 'Референсы.zip', url: '#' }
                    ]
                }
            ];

            // Apply filters
            let filtered = demoRequests;
            if (filters.category) {
                filtered = filtered.filter(r => r.category === filters.category);
            }

            return { success: true, data: filtered };
        },

        // GET /engineer/assignments - мои назначенные проекты
        getMyAssignments() {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            // Получаем назначенные заявки
            if (window.EngineeringModels?.EngineeringRequest) {
                const requests = window.EngineeringModels.EngineeringRequest.getAll()
                    .filter(r => r.assignedEngineerId === user.id);
                return { success: true, data: requests };
            }

            // Demo data for testing
            const demoAssignments = [
                {
                    id: 'eng-assign-001',
                    category: 'DESIGN',
                    objectName: 'Офисное здание "БизнесЦентр"',
                    objectAddress: 'г. Астана, ул. Кабанбай Батыра 42',
                    customerName: 'ТОО "Офис Плюс"',
                    customerPhone: '+7 701 888 9999',
                    customerEmail: 'office@officeplus.kz',
                    totalPrice: 1200000,
                    status: 'IN_WORK',
                    progress: 45,
                    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    assignedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
                    files: [
                        { name: 'ТЗ_офис.pdf', type: 'pdf', size: '2.5 МБ', url: '#' },
                        { name: 'Планировка_этажа.dwg', type: 'dwg', size: '15.2 МБ', url: '#' }
                    ],
                    comments: [
                        { author: 'Заказчик', text: 'Просьба учесть открытую планировку на 3 этаже', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
                        { author: 'Система', text: 'Проект взят в работу', createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
                    ]
                },
                {
                    id: 'eng-assign-002',
                    category: 'CALCULATION',
                    objectName: 'Складской комплекс',
                    objectAddress: 'г. Алматы, ИП "Логистик"',
                    customerName: 'ТОО "Логистик Казахстан"',
                    customerPhone: '+7 727 333 4455',
                    customerEmail: 'project@logistic.kz',
                    totalPrice: 650000,
                    status: 'ON_REVIEW',
                    progress: 85,
                    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
                    assignedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
                    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    files: [
                        { name: 'Расчёт_конструкций.pdf', type: 'pdf', size: '8.1 МБ', url: '#' },
                        { name: 'Схема_каркаса.dwg', type: 'dwg', size: '22.5 МБ', url: '#' },
                        { name: 'Спецификация.xlsx', type: 'excel', size: '1.2 МБ', url: '#' }
                    ],
                    comments: []
                }
            ];

            return { success: true, data: demoAssignments };
        },

        // POST /engineer/requests/:id/accept - принять заявку
        acceptRequest(requestId) {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            if (window.EngineeringModels?.EngineeringRequest) {
                const request = window.EngineeringModels.EngineeringRequest.find(requestId);
                if (!request) return { success: false, error: 'Заявка не найдена' };

                request.assignedEngineerId = user.id;
                request.status = 'IN_WORK';
                request.save();

                AuditLog.log('engineering_request', requestId, 'engineer_assigned', {
                    engineerId: user.id
                });

                return { success: true, data: request };
            }
            return { success: false, error: 'Модуль инжиниринга не загружен' };
        },

        // GET /engineer/summary
        getSummary() {
            const user = getCurrentUser();
            if (!user) return { success: false, error: 'Не авторизован' };

            const profile = EngineerProfile.findByUserId(user.id);
            let assignments = [];
            let completed = 0;

            if (window.EngineeringModels?.EngineeringRequest) {
                assignments = window.EngineeringModels.EngineeringRequest.getAll()
                    .filter(r => r.assignedEngineerId === user.id);
                completed = assignments.filter(r => r.status === 'CLOSED').length;
            }

            return {
                success: true,
                data: {
                    totalAssignments: assignments.length,
                    inWork: assignments.filter(r => r.status === 'IN_WORK').length,
                    completed: completed,
                    rating: profile?.rating || 0,
                    reviewsCount: profile?.reviewsCount || 0,
                    projectsCompleted: profile?.projectsCompleted || 0,
                    specializations: profile?.specializations || []
                }
            };
        }
    };

    // ========== AUDIT API ==========
    const AuditAPI = {
        // GET /audit
        getHistory(entityType, entityId) {
            const logs = AuditLog.findByEntity(entityType, entityId);
            return { success: true, data: logs };
        }
    };

    // ========== DEMO DATA ==========
    function initDemoData() {
        // Check if demo data already exists
        if (localStorage.getItem('demoDataInitialized')) {
            return;
        }

        console.log('🔧 Initializing demo data...');

        // Create demo executor profiles
        const executors = [
            {
                userId: 'demo_exec_1',
                orgName: 'СтройМастер',
                contactName: 'Иванов Пётр',
                phone: '+7 (701) 123-45-67',
                city: 'Алматы',
                type: 'company',
                services: ['foundation', 'walls', 'roofing'],
                experience: 10,
                rating: 4.8,
                reviewsCount: 24,
                ordersCompleted: 45,
                isVerified: true,
                isComplete: true,
                description: 'Строительная компания с 10-летним опытом. Выполняем все виды строительных работ.'
            },
            {
                userId: 'demo_exec_2',
                orgName: 'БригадаПро',
                contactName: 'Сергеев Алексей',
                phone: '+7 (702) 234-56-78',
                city: 'Астана',
                type: 'brigade',
                services: ['walls', 'finishing'],
                experience: 5,
                rating: 4.5,
                reviewsCount: 12,
                ordersCompleted: 28,
                isVerified: true,
                isComplete: true,
                description: 'Бригада отделочников. Быстро, качественно, недорого.'
            },
            {
                userId: 'demo_exec_3',
                orgName: '',
                contactName: 'Ким Виктор',
                phone: '+7 (705) 345-67-89',
                city: 'Алматы',
                type: 'individual',
                services: ['foundation', 'concrete'],
                experience: 15,
                rating: 4.9,
                reviewsCount: 56,
                ordersCompleted: 120,
                isVerified: true,
                isComplete: true,
                description: 'Мастер по фундаментам и бетонным работам. 15 лет опыта.'
            }
        ];

        executors.forEach(data => {
            const profile = new ExecutorProfile(data);
            profile.save();
        });

        // Create demo orders
        const demoCustomerId = 'demo_customer_1';
        const orders = [
            {
                customerId: demoCustomerId,
                status: OrderStatus.PUBLISHED,
                title: 'Заливка фундамента для дома 10x12м',
                description: 'Требуется залить ленточный фундамент для частного дома. Площадь 120 кв.м, глубина 1.2м. Грунт песчаный. Нужен опыт работы с бетоном М300.',
                address: 'ул. Абая, 123',
                city: 'Алматы',
                category: 'foundation',
                budget: 850000,
                budgetType: 'exact',
                urgency: 'normal',
                publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                applicationsCount: 3,
                viewsCount: 45
            },
            {
                customerId: demoCustomerId,
                status: OrderStatus.PUBLISHED,
                title: 'Кладка стен из газоблока',
                description: 'Нужно выложить стены из газобетонных блоков. Общая площадь стен около 200 кв.м. Материал предоставляем.',
                address: 'мкр. Самал-2',
                city: 'Алматы',
                category: 'walls',
                budget: 450000,
                budgetType: 'negotiable',
                urgency: 'urgent',
                publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                applicationsCount: 5,
                viewsCount: 78
            },
            {
                customerId: demoCustomerId,
                status: OrderStatus.PUBLISHED,
                title: 'Ремонт кровли частного дома',
                description: 'Требуется ремонт мягкой кровли. Площадь 150 кв.м. Есть протечки в нескольких местах.',
                address: 'пос. Бесагаш',
                city: 'Алматы',
                category: 'roofing',
                budgetMin: 200000,
                budgetMax: 350000,
                budgetType: 'range',
                urgency: 'urgent',
                publishedAt: new Date().toISOString(),
                applicationsCount: 2,
                viewsCount: 23
            }
        ];

        orders.forEach(data => {
            const order = new Order(data);
            order.save();
        });

        localStorage.setItem('demoDataInitialized', 'true');
        console.log('✅ Demo data initialized');
    }

    // ========== EXPORT ==========
    window.DataService = {
        // Init
        init: initUser,
        initDemoData,

        // API Mode
        checkAPIAvailability,
        isUsingRealAPI: () => useRealAPI,

        // User context
        getCurrentUser,
        getCurrentProfile,
        setUserRole,

        // Role checks (for admin access to all functionality)
        canAccessCustomerFeatures,
        canAccessExecutorFeatures,
        canAccessEngineerFeatures,
        isAdmin,
        getActiveViewRole,
        setAdminViewRole,

        // APIs (localStorage fallback)
        Customer: CustomerAPI,
        Executor: ExecutorAPI,
        Engineer: EngineerAPI,
        Files: FilesAPI,
        Audit: AuditAPI
    };

    // Expose real API when available
    if (window.API) {
        window.DataService.API = window.API;
    }

    console.log('✅ DataService loaded');

})();
