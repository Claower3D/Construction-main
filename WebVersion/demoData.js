// ========== DEMO DATA INITIALIZER ==========
// Предустановленные пользователи для демонстрации системы
// 5 пользователей: 1 администратор, 2 заказчика, 2 исполнителя

(function () {
    'use strict';

    // ===== DEMO USERS DATA =====
    const DEMO_USERS = {
        // 1. Администратор
        'admin@qazgost.kz': {
            id: 'user_admin_001',
            name: 'Администратор Системы',
            email: 'admin@qazgost.kz',
            password: 'Admin123!',
            phone: '+7 (701) 000-0001',
            role: 'admin',
            createdAt: '2026-01-01T00:00:00.000Z'
        },

        // 2. Заказчик 1 - Физическое лицо
        'customer1@qazgost.kz': {
            id: 'user_customer_001',
            name: 'Алексей Петров',
            email: 'customer1@qazgost.kz',
            password: 'Customer1!',
            phone: '+7 (702) 111-1111',
            role: 'customer',
            createdAt: '2026-01-15T10:00:00.000Z'
        },

        // 3. Заказчик 2 - Компания
        'customer2@qazgost.kz': {
            id: 'user_customer_002',
            name: 'ТОО "СтройИнвест"',
            email: 'customer2@qazgost.kz',
            password: 'Customer2!',
            phone: '+7 (702) 222-2222',
            role: 'customer',
            createdAt: '2026-01-16T12:00:00.000Z'
        },

        // 4. Исполнитель 1 - Бригада
        'executor1@qazgost.kz': {
            id: 'user_executor_001',
            name: 'Бригада "Мастера"',
            email: 'executor1@qazgost.kz',
            password: 'Executor1!',
            phone: '+7 (703) 333-3333',
            role: 'executor',
            createdAt: '2026-01-10T09:00:00.000Z'
        },

        // 5. Исполнитель 2 - ИП
        'executor2@qazgost.kz': {
            id: 'user_executor_002',
            name: 'ИП Сергеев М.А.',
            email: 'executor2@qazgost.kz',
            password: 'Executor2!',
            phone: '+7 (703) 444-4444',
            role: 'executor',
            createdAt: '2026-01-12T14:00:00.000Z'
        },

        // 6. Инженер
        'engineer@qazgost.kz': {
            id: 'user_engineer_001',
            name: 'Инженер Касымов А.Б.',
            email: 'engineer@qazgost.kz',
            password: 'Engineer1!',
            phone: '+7 (704) 555-5555',
            role: 'engineer',
            createdAt: '2026-01-20T08:00:00.000Z'
        },

        // 7. Контролёр
        'controller@qazgost.kz': {
            id: 'user_controller_001',
            name: 'Контролёр Ахметов Д.С.',
            email: 'controller@qazgost.kz',
            password: 'Controller1!',
            phone: '+7 (705) 666-6666',
            role: 'controller',
            createdAt: '2026-01-22T09:00:00.000Z'
        },

        // 8. Свежий тестер (для чистого теста)
        'newtest@qazgost.kz': {
            id: 'user_newtest_001',
            name: 'Новый Тестер',
            email: 'newtest@qazgost.kz',
            password: 'QazGost2026!',
            phone: '+7 (777) 777-7777',
            role: 'customer',
            createdAt: new Date().toISOString()
        }
    };

    // ===== EXECUTOR PROFILES =====
    const EXECUTOR_PROFILES = {
        // Профиль исполнителя для администратора (доступ к обоим ролям)
        'user_admin_001': {
            id: 'ep_admin_001',
            userId: 'user_admin_001',
            orgName: 'Администратор QAZGOST',
            contactName: 'Администратор Системы',
            phone: '+7 (701) 000-0001',
            email: 'admin@qazgost.kz',
            city: 'Алматы',
            region: 'Казахстан',
            type: 'company',
            services: ['foundation', 'walls', 'roofing', 'electrical', 'plumbing', 'hvac', 'finish'],
            experience: 99,
            description: 'Административный аккаунт с полным доступом ко всем функциям системы.',
            rating: 5.0,
            reviewsCount: 0,
            ordersCompleted: 0,
            isVerified: true,
            isComplete: true,
            createdAt: '2026-01-01T00:00:00.000Z'
        },
        'user_executor_001': {
            id: 'ep_executor_001',
            userId: 'user_executor_001',
            orgName: 'Бригада "Мастера"',
            contactName: 'Иван Мастеров',
            phone: '+7 (703) 333-3333',
            email: 'executor1@qazgost.kz',
            city: 'Алматы',
            region: 'Алматы',
            type: 'brigade',
            services: ['foundation', 'walls', 'roofing', 'electrical', 'plumbing'],
            experience: 8,
            description: 'Профессиональная бригада с 8-летним опытом. Выполняем полный спектр строительных работ от фундамента до кровли.',
            rating: 4.8,
            reviewsCount: 47,
            ordersCompleted: 52,
            isVerified: true,
            isComplete: true,
            createdAt: '2026-01-10T09:00:00.000Z'
        },
        'user_executor_002': {
            id: 'ep_executor_002',
            userId: 'user_executor_002',
            orgName: 'ИП Сергеев М.А.',
            contactName: 'Михаил Сергеев',
            phone: '+7 (703) 444-4444',
            email: 'executor2@qazgost.kz',
            city: 'Астана',
            region: 'Астана',
            type: 'individual',
            services: ['electrical', 'plumbing', 'hvac', 'finish'],
            experience: 12,
            description: 'Частный мастер с 12-летним опытом. Специализация: электрика, сантехника, отопление, чистовая отделка.',
            rating: 4.9,
            reviewsCount: 89,
            ordersCompleted: 98,
            isVerified: true,
            isComplete: true,
            createdAt: '2026-01-12T14:00:00.000Z'
        }
    };

    // ===== CUSTOMER PROFILES =====
    const CUSTOMER_PROFILES = {
        // Профиль заказчика для администратора (доступ к обоим ролям)
        'user_admin_001': {
            id: 'cp_admin_001',
            userId: 'user_admin_001',
            name: 'Администратор Системы',
            phone: '+7 (701) 000-0001',
            city: 'Алматы',
            address: 'Центральный офис QAZGOST',
            type: 'company',
            companyName: 'QAZGOST AI',
            inn: '000000000000',
            isComplete: true,
            createdAt: '2026-01-01T00:00:00.000Z'
        },
        'user_customer_001': {
            id: 'cp_customer_001',
            userId: 'user_customer_001',
            name: 'Алексей Петров',
            phone: '+7 (702) 111-1111',
            city: 'Алматы',
            address: 'ул. Абая, 150',
            type: 'individual',
            isComplete: true,
            createdAt: '2026-01-15T10:00:00.000Z'
        },
        'user_customer_002': {
            id: 'cp_customer_002',
            userId: 'user_customer_002',
            name: 'ТОО "СтройИнвест"',
            phone: '+7 (702) 222-2222',
            city: 'Астана',
            address: 'пр. Мангилик Ел, 55',
            type: 'company',
            companyName: 'ТОО "СтройИнвест"',
            inn: '220640012345',
            isComplete: true,
            createdAt: '2026-01-16T12:00:00.000Z'
        }
    };

    // ===== HASH HELPER (same algorithm as auth-engine.js) =====
    async function _hashPwd(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + '_qazgost_salt_2026');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            return password; // fallback
        }
    }

    // ===== INITIALIZE DEMO DATA =====
    async function initDemoData(forceReset = false) {
        console.log('[DemoData] Initializing demo users...');

        try {
            // Check if already initialized
            const existingUsers = JSON.parse(localStorage.getItem('demoUsers') || '{}');
            const isInitialized = localStorage.getItem('demoDataInitialized') === 'true';

            if (isInitialized && !forceReset && Object.keys(existingUsers).length >= 7) {
                console.log('[DemoData] Demo data already initialized, skipping...');
                return false;
            }

            // 1. Save demo users for auth-engine.js — passwords are HASHED
            const demoUsersForAuth = {};
            for (const [email, user] of Object.entries(DEMO_USERS)) {
                demoUsersForAuth[email.toLowerCase()] = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: await _hashPwd(user.password),
                    phone: user.phone,
                    role: user.role,
                    createdAt: user.createdAt
                };
            }
            localStorage.setItem('demoUsers', JSON.stringify(demoUsersForAuth));

            // 2. Save User models (for models.js User class) — NO passwords
            for (const user of Object.values(DEMO_USERS)) {
                const userModel = {
                    id: user.id,
                    role: user.role,
                    email: user.email,
                    phone: user.phone,
                    name: user.name,
                    createdAt: user.createdAt,
                    updatedAt: user.createdAt
                };
                localStorage.setItem(`user_${user.id}`, JSON.stringify(userModel));
            }

            // 3. Save executor profiles
            for (const [userId, profile] of Object.entries(EXECUTOR_PROFILES)) {
                localStorage.setItem(`executorProfile_${userId}`, JSON.stringify(profile));
            }

            // 4. Save customer profiles
            for (const [userId, profile] of Object.entries(CUSTOMER_PROFILES)) {
                localStorage.setItem(`customerProfile_${userId}`, JSON.stringify(profile));
            }

            // Mark as initialized
            localStorage.setItem('demoDataInitialized', 'true');
            localStorage.setItem('demoDataVersion', '1.1');

            console.log('[DemoData] ✅ Demo data initialized (passwords hashed)');
            console.log('[DemoData] Available accounts:');
            console.table([
                { Role: '👑 Администратор', Email: 'admin@qazgost.kz', Password: 'Admin123!' },
                { Role: '📋 Заказчик 1', Email: 'customer1@qazgost.kz', Password: 'Customer1!' },
                { Role: '📋 Заказчик 2', Email: 'customer2@qazgost.kz', Password: 'Customer2!' },
                { Role: '🔧 Исполнитель 1', Email: 'executor1@qazgost.kz', Password: 'Executor1!' },
                { Role: '🔧 Исполнитель 2', Email: 'executor2@qazgost.kz', Password: 'Executor2!' },
                { Role: '⚙️ Инженер', Email: 'engineer@qazgost.kz', Password: 'Engineer1!' },
                { Role: '🔎 Контролёр', Email: 'controller@qazgost.kz', Password: 'Controller1!' }
            ]);

            return true;
        } catch (error) {
            console.error('[DemoData] Error initializing demo data:', error);
            return false;
        }
    }

    // ===== RESET DEMO DATA =====
    async function resetDemoData() {
        console.log('[DemoData] Resetting demo data...');

        // Clear existing demo data
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('user_') ||
                key.startsWith('executorProfile_') ||
                key.startsWith('customerProfile_') ||
                key === 'demoUsers' ||
                key === 'demoDataInitialized' ||
                key === 'demoDataVersion'
            )) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Re-initialize
        return await initDemoData(true);
    }

    // ===== GET DEMO CREDENTIALS =====
    function getDemoCredentials() {
        return [
            { role: 'admin', email: 'admin@qazgost.kz', password: 'Admin123!', name: 'Администратор Системы' },
            { role: 'customer', email: 'customer1@qazgost.kz', password: 'Customer1!', name: 'Алексей Петров' },
            { role: 'customer', email: 'customer2@qazgost.kz', password: 'Customer2!', name: 'ТОО "СтройИнвест"' },
            { role: 'executor', email: 'executor1@qazgost.kz', password: 'Executor1!', name: 'Бригада "Мастера"' },
            { role: 'executor', email: 'executor2@qazgost.kz', password: 'Executor2!', name: 'ИП Сергеев М.А.' },
            { role: 'engineer', email: 'engineer@qazgost.kz', password: 'Engineer1!', name: 'Инженер Касымов А.Б.' },
            { role: 'controller', email: 'controller@qazgost.kz', password: 'Controller1!', name: 'Контролёр Ахметов Д.С.' }
        ];
    }

    // ===== AUTO-INITIALIZE ON LOAD =====
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => initDemoData());
    } else {
        initDemoData();
    }

    // ===== EXPORT =====
    window.DemoData = {
        init: initDemoData,
        reset: resetDemoData,
        getCredentials: getDemoCredentials,
        USERS: DEMO_USERS,
        EXECUTOR_PROFILES,
        CUSTOMER_PROFILES
    };

    console.log('✅ Demo Data module loaded');
})();
