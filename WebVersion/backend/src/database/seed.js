/**
 * Database Seed Script
 * Populates database with demo data
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { pool, query } = require('./connection');

async function seed() {
    console.log('🌱 Starting database seed...\n');

    try {
        // ========== SPECIALIZATIONS ==========
        console.log('📚 Seeding specializations...');

        const specializations = [
            { code: 'architecture', name: 'Архитектура', icon: '🏛️', category: 'design' },
            { code: 'structural', name: 'Конструктив (ПГС)', icon: '🏗️', category: 'engineering' },
            { code: 'mep', name: 'Инженерные сети (MEP)', icon: '⚡', category: 'engineering' },
            { code: 'hvac', name: 'Отопление и вентиляция (HVAC)', icon: '❄️', category: 'engineering' },
            { code: 'plumbing', name: 'Водоснабжение и канализация', icon: '🚿', category: 'engineering' },
            { code: 'electrical', name: 'Электроснабжение', icon: '💡', category: 'engineering' },
            { code: 'fire_safety', name: 'Пожарная безопасность', icon: '🧯', category: 'safety' },
            { code: 'geotechnical', name: 'Геотехника', icon: '🌍', category: 'survey' },
            { code: 'surveying', name: 'Геодезия', icon: '📐', category: 'survey' },
            { code: 'estimation', name: 'Сметное дело', icon: '📊', category: 'management' },
            { code: 'project_management', name: 'Управление проектами', icon: '📋', category: 'management' },
            { code: 'interior_design', name: 'Дизайн интерьера', icon: '🎨', category: 'design' }
        ];

        for (const spec of specializations) {
            await query(
                `INSERT INTO specializations (code, name, icon, category)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (code) DO UPDATE SET name = $2, icon = $3, category = $4`,
                [spec.code, spec.name, spec.icon, spec.category]
            );
        }
        console.log(`  ✅ ${specializations.length} specializations`);

        // ========== DEMO USERS ==========
        console.log('\n👤 Seeding demo users...');

        const passwordHash = await bcrypt.hash('demo123', 10);

        const demoUsers = [
            { phone: '+77001111111', firstName: 'Демо', lastName: 'Заказчик', role: 'customer', email: 'customer@demo.kz' },
            { phone: '+77002222222', firstName: 'Демо', lastName: 'Исполнитель', role: 'executor', email: 'executor@demo.kz' },
            { phone: '+77003333333', firstName: 'Демо', lastName: 'Инженер', role: 'engineer', email: 'engineer@demo.kz' },
            { phone: '+77009999999', firstName: 'Админ', lastName: 'Системы', role: 'admin', email: 'admin@demo.kz' },
            // Additional engineers
            { phone: '+77004444444', firstName: 'Алексей', lastName: 'Петров', role: 'engineer', email: 'alex@demo.kz' },
            { phone: '+77005555555', firstName: 'Мария', lastName: 'Иванова', role: 'engineer', email: 'maria@demo.kz' },
        ];

        const userIds = {};

        for (const user of demoUsers) {
            const result = await query(
                `INSERT INTO users (phone, first_name, last_name, role, email, password_hash, is_verified, rating)
                 VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
                 ON CONFLICT (phone) DO UPDATE SET first_name = $2, last_name = $3, role = $4
                 RETURNING id`,
                [user.phone, user.firstName, user.lastName, user.role, user.email, passwordHash,
                user.role === 'engineer' ? (3.5 + Math.random() * 1.5).toFixed(2) : 0]
            );
            userIds[user.role + (user.phone.slice(-1))] = result.rows[0].id;

            // Create wallet
            await query(
                `INSERT INTO wallets (user_id, balance_kzt)
                 VALUES ($1, $2)
                 ON CONFLICT (user_id) DO NOTHING`,
                [result.rows[0].id, Math.floor(100000 + Math.random() * 500000)]
            );

            // Create profile
            await query(
                `INSERT INTO user_profiles (user_id, city, experience_years, hourly_rate, description)
                 VALUES ($1, $2, $3, $4, $5)
                 ON CONFLICT (user_id) DO UPDATE SET city = $2`,
                [
                    result.rows[0].id,
                    ['Алматы', 'Астана', 'Шымкент'][Math.floor(Math.random() * 3)],
                    user.role === 'engineer' ? Math.floor(3 + Math.random() * 15) : 0,
                    user.role === 'engineer' ? Math.floor(5000 + Math.random() * 15000) : 0,
                    user.role === 'engineer' ? 'Опытный специалист с успешными проектами' : null
                ]
            );

            // Add specializations for engineers
            if (user.role === 'engineer') {
                const numSpecs = 2 + Math.floor(Math.random() * 4);
                const shuffled = [...specializations].sort(() => Math.random() - 0.5);
                for (let i = 0; i < numSpecs; i++) {
                    await query(
                        `INSERT INTO user_specializations (user_id, specialization_id)
                         SELECT $1, id FROM specializations WHERE code = $2
                         ON CONFLICT DO NOTHING`,
                        [result.rows[0].id, shuffled[i].code]
                    );
                }
            }
        }
        console.log(`  ✅ ${demoUsers.length} users`);

        // ========== DEMO ORDERS ==========
        console.log('\n📦 Seeding demo orders...');

        const orderTitles = [
            'Ремонт ванной комнаты',
            'Укладка ламината',
            'Покраска стен',
            'Установка натяжного потолка',
            'Замена электропроводки',
            'Штукатурка стен',
            'Укладка плитки',
            'Монтаж гипсокартона',
            'Ремонт балкона',
            'Установка сантехники'
        ];

        const statuses = ['published', 'published', 'assigned', 'in_progress', 'submitted', 'completed'];

        // Get customer id
        const customerResult = await query(`SELECT id FROM users WHERE role = 'customer' LIMIT 1`);
        const customerId = customerResult.rows[0]?.id;

        const executorResult = await query(`SELECT id FROM users WHERE role = 'executor' LIMIT 1`);
        const executorId = executorResult.rows[0]?.id;

        if (customerId) {
            for (let i = 0; i < 15; i++) {
                const status = statuses[i % statuses.length];
                const hasExecutor = status !== 'published';

                await query(
                    `INSERT INTO orders (customer_id, executor_id, title, description, category, address, estimated_price, status, phone_consent_given)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [
                        customerId,
                        hasExecutor ? executorId : null,
                        orderTitles[i % orderTitles.length],
                        `Требуется выполнить работы: ${orderTitles[i % orderTitles.length].toLowerCase()}. Площадь примерно ${15 + i * 3} м².`,
                        'repair',
                        `г. Алматы, ул. Примерная, д. ${10 + i}`,
                        Math.floor(50000 + Math.random() * 300000),
                        status,
                        status === 'completed'
                    ]
                );
            }
            console.log(`  ✅ 15 orders`);
        }

        // ========== DEMO ENGINEER REQUESTS ==========
        console.log('\n📐 Seeding engineer requests...');

        const requestCategories = [
            { code: 'architecture', title: 'Архитектурный проект жилого дома' },
            { code: 'structural', title: 'Расчёт несущих конструкций' },
            { code: 'mep', title: 'Проект инженерных сетей' },
            { code: 'hvac', title: 'Проект системы вентиляции' },
            { code: 'electrical', title: 'Проект электроснабжения' },
            { code: 'fire_safety', title: 'Раздел пожарной безопасности' },
            { code: 'estimation', title: 'Составление сметной документации' }
        ];

        if (customerId) {
            for (let i = 0; i < 10; i++) {
                const cat = requestCategories[i % requestCategories.length];
                const status = i < 5 ? 'open' : 'assigned';

                await query(
                    `INSERT INTO engineer_requests (customer_id, title, category, object_name, object_address, description, requirements, total_price, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                     RETURNING id`,
                    [
                        customerId,
                        cat.title,
                        cat.code,
                        `Объект №${i + 1}`,
                        `г. Алматы, мкр. Новый, ${20 + i}`,
                        `Необходимо разработать ${cat.title.toLowerCase()} для объекта.`,
                        'Срок выполнения: 2 недели. Требуется лицензия.',
                        Math.floor(100000 + Math.random() * 400000),
                        status
                    ]
                );
            }
            console.log(`  ✅ 10 engineer requests`);
        }

        // ========== DEMO ENGINEER PROJECTS ==========
        console.log('\n🏗️ Seeding engineer projects...');

        const engineerResult = await query(`SELECT id FROM users WHERE role = 'engineer' LIMIT 1`);
        const engineerId = engineerResult.rows[0]?.id;

        if (engineerId && customerId) {
            const projectStatuses = ['in_progress', 'in_progress', 'submitted', 'completed'];

            for (let i = 0; i < 8; i++) {
                const status = projectStatuses[i % projectStatuses.length];
                const progress = status === 'completed' ? 100 :
                    status === 'submitted' ? 100 :
                        Math.floor(20 + Math.random() * 60);

                await query(
                    `INSERT INTO engineer_projects (engineer_id, customer_id, title, object_address, total_price, progress, status)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        engineerId,
                        customerId,
                        `Проект ${['АР', 'КР', 'ОВ', 'ВК', 'ЭС'][i % 5]} для объекта #${i + 1}`,
                        `г. Алматы, ул. Инженерная, ${50 + i}`,
                        Math.floor(150000 + Math.random() * 350000),
                        progress,
                        status
                    ]
                );
            }
            console.log(`  ✅ 8 engineer projects`);
        }

        console.log('\n✨ Database seeded successfully!');

    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

seed();
