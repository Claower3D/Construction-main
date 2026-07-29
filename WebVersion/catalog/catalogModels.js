// ========== CATALOG MODELS v1.0 ==========
// Модели данных для Каталога подрядчиков
(function () {
    'use strict';

    // ─── EXECUTOR TYPES ───
    const EXECUTOR_TYPES = {
        MASTER: 'master',       // Частный мастер
        BRIGADE: 'brigade',     // Бригада
        COMPANY: 'company'      // Компания / ТОО / ИП
    };

    // ─── CATALOG STATUSES ───
    const CATALOG_STATUS = {
        ACTIVE: 'active',
        INACTIVE: 'inactive',
        MODERATION: 'moderation',
        BLOCKED: 'blocked'
    };

    // ─── INVITE STATUSES ───
    const INVITE_STATUS = {
        PENDING: 'pending',
        ACCEPTED: 'accepted',
        DECLINED: 'declined',
        EXPIRED: 'expired'
    };

    // ─── BUILDER CATEGORIES (with synonyms for search) ───
    const BUILDER_CATEGORIES = [
        { id: 'general', label: 'Генподрядчик', icon: '🏗️', synonyms: ['строительная компания', 'застройщик', 'подрядчик'] },
        { id: 'plumber', label: 'Сантехник', icon: '🔧', synonyms: ['водопроводчик', 'трубы', 'канализация', 'водоснабжение'] },
        { id: 'electrician', label: 'Электрик', icon: '⚡', synonyms: ['электромонтажник', 'проводка', 'щиты', 'освещение'] },
        { id: 'painter', label: 'Маляр', icon: '🎨', synonyms: ['покраска', 'шпатлёвка', 'штукатурка', 'отделочник'] },
        { id: 'tiler', label: 'Плиточник', icon: '🏠', synonyms: ['кафель', 'керамогранит', 'мозаика', 'облицовка'] },
        { id: 'welder', label: 'Сварщик', icon: '🔥', synonyms: ['сварка', 'металлоконструкции', 'ворота', 'решётки'] },
        { id: 'carpenter', label: 'Плотник / Столяр', icon: '🪵', synonyms: ['мебель', 'дерево', 'двери', 'лестницы'] },
        { id: 'roofer', label: 'Кровельщик', icon: '🏚️', synonyms: ['крыша', 'кровля', 'водосток', 'черепица'] },
        { id: 'concrete', label: 'Бетонщик', icon: '🧱', synonyms: ['фундамент', 'монолит', 'стяжка', 'отмостка'] },
        { id: 'hvac', label: 'Отопление / Вентиляция', icon: '❄️', synonyms: ['кондиционер', 'котёл', 'тёплый пол', 'радиатор'] },
        { id: 'demolition', label: 'Демонтажник', icon: '💥', synonyms: ['снос', 'разборка', 'вывоз мусора'] },
        { id: 'landscaper', label: 'Благоустройство', icon: '🌳', synonyms: ['газон', 'дорожки', 'заборы', 'полив'] },
        { id: 'designer', label: 'Дизайнер интерьера', icon: '✏️', synonyms: ['дизайн', 'проект', 'интерьер', '3D'] },
        { id: 'architect', label: 'Архитектор / Проектировщик', icon: '📐', synonyms: ['проект', 'чертёж', 'план'] },
        { id: 'surveyor', label: 'Геодезист / Замерщик', icon: '📏', synonyms: ['замер', 'геодезия', 'разметка'] },
        { id: 'finishing', label: 'Отделочник под ключ', icon: '✨', synonyms: ['ремонт квартир', 'ремонт под ключ', 'евроремонт'] },
        { id: 'facade', label: 'Фасадчик', icon: '🏢', synonyms: ['утепление', 'облицовка фасада', 'вентфасад'] },
        { id: 'window', label: 'Окна / Двери', icon: '🪟', synonyms: ['остекление', 'пластиковые окна', 'установка дверей'] },
        { id: 'flooring', label: 'Напольные покрытия', icon: '🪵', synonyms: ['ламинат', 'паркет', 'линолеум', 'наливной пол'] },
        { id: 'drywall', label: 'Гипсокартонщик', icon: '📐', synonyms: ['ГКЛ', 'перегородки', 'потолки', 'ниши'] }
    ];

    // ─── SORT OPTIONS ───
    const SORT_OPTIONS = {
        RATING_DESC: 'rating_desc',
        RATING_ASC: 'rating_asc',
        PRICE_ASC: 'price_asc',
        PRICE_DESC: 'price_desc',
        REVIEWS_DESC: 'reviews_desc',
        NEWEST: 'newest'
    };

    // ─── CATALOG ENTRY (extends executor profile for catalog display) ───
    function createCatalogEntry(executorProfile) {
        return {
            id: executorProfile.id || _genId(),
            // Basic info
            executorType: executorProfile.orgType === 'TOO' || executorProfile.orgType === 'IP' ? EXECUTOR_TYPES.COMPANY : EXECUTOR_TYPES.MASTER,
            name: executorProfile.nameOrCompany || '',
            companyName: executorProfile.companyName || '',
            avatarUrl: executorProfile.avatarUrl || '',
            about: executorProfile.about || '',
            phone: executorProfile.phone || '',
            email: executorProfile.email || '',
            // Categories & services
            categories: executorProfile.services || [],
            serviceTags: executorProfile.serviceTags || {},
            customTags: executorProfile.customTags || [],
            // Location
            city: executorProfile.city || '',
            country: executorProfile.country || 'KZ',
            serviceZones: executorProfile.serviceZones || [],
            radiusKm: executorProfile.radiusKm || 0,
            // Rating & stats
            rating: executorProfile.rating || 0,
            reviewsCount: 0,
            completedOrders: 0,
            truthfulness: 0,  // % правдивости (from completed vs promised)
            // Availability
            isAvailable: executorProfile.availability?.acceptOrders || false,
            status: executorProfile.availability?.status || '',
            startWhen: executorProfile.availability?.startWhen || '',
            // Terms
            priceLevel: executorProfile.terms?.priceLevel || '',
            minOrder: executorProfile.terms?.minOrder || 0,
            warrantyMonths: executorProfile.terms?.warrantyMonths || '',
            payments: executorProfile.terms?.payments || [],
            // Company-specific
            hasTeam: executorProfile.company?.hasTeam || false,
            teamCount: executorProfile.company?.teamCount || 0,
            equipment: executorProfile.company?.equipment || [],
            capabilities: executorProfile.company?.capabilities || [],
            // Portfolio
            portfolioPhotos: executorProfile.portfolioPhotos || [],
            // Meta
            catalogStatus: CATALOG_STATUS.ACTIVE,
            completionPercent: executorProfile.completionPercent || 0,
            createdAt: executorProfile.createdAt || new Date().toISOString(),
            updatedAt: executorProfile.updatedAt || new Date().toISOString()
        };
    }

    // ─── REVIEW MODEL ───
    function createReview(data) {
        return {
            id: _genId(),
            catalogEntryId: data.catalogEntryId || '',
            executorId: data.executorId || '',
            authorId: data.authorId || '',
            authorName: data.authorName || 'Аноним',
            authorRole: data.authorRole || 'customer',
            orderId: data.orderId || null,
            rating: Math.min(5, Math.max(1, data.rating || 5)),
            text: data.text || '',
            photos: data.photos || [],
            reply: null,  // executor reply
            isVerified: !!data.orderId,  // verified if linked to real order
            createdAt: new Date().toISOString()
        };
    }

    // ─── INVITE MODEL ───
    function createInvite(data) {
        return {
            id: _genId(),
            fromUserId: data.fromUserId || '',
            fromUserName: data.fromUserName || '',
            toExecutorId: data.toExecutorId || '',
            toExecutorName: data.toExecutorName || '',
            projectId: data.projectId || null,
            projectTitle: data.projectTitle || '',
            message: data.message || '',
            status: INVITE_STATUS.PENDING,
            createdAt: new Date().toISOString(),
            respondedAt: null
        };
    }

    // ─── FILTERS MODEL ───
    function createFilters() {
        return {
            search: '',
            categories: [],
            city: '',
            executorType: '',  // master | brigade | company | ''
            priceLevel: '',    // economy | standard | premium | ''
            isAvailable: false,
            hasReviews: false,
            minRating: 0,
            sortBy: SORT_OPTIONS.RATING_DESC
        };
    }

    // ─── HELPER ───
    function _genId() {
        return 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 6);
    }

    // ─── SEED DATA (Demo) ───
    function generateSeedData() {
        const cities = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе'];
        const names = [
            { name: 'Строй Мастер KZ', type: 'TOO', company: true },
            { name: 'Алибек Нурланов', type: 'PRIVATE', company: false },
            { name: 'БригадаАстана', type: 'IP', company: true },
            { name: 'Ремонт Плюс', type: 'TOO', company: true },
            { name: 'Серик Каримов', type: 'PRIVATE', company: false },
            { name: 'ЮжСтрой', type: 'TOO', company: true },
            { name: 'Мастер на все руки', type: 'IP', company: false },
            { name: 'Нурбол Ахметов', type: 'PRIVATE', company: false },
            { name: 'КазСтройПро', type: 'TOO', company: true },
            { name: 'Дмитрий Ким', type: 'PRIVATE', company: false },
            { name: 'ТехноСтрой', type: 'TOO', company: true },
            { name: 'Бригада Мастеров', type: 'IP', company: true }
        ];
        const allCats = BUILDER_CATEGORIES.map(c => c.id);
        const statuses = ['free', 'partial', 'busy'];
        const priceLevels = ['economy', 'standard', 'premium'];
        const startOptions = ['Сегодня', 'Неделя', 'Месяц'];

        return names.map((n, i) => {
            const cats = [];
            const catCount = 1 + Math.floor(Math.random() * 4);
            for (let j = 0; j < catCount; j++) {
                const c = allCats[Math.floor(Math.random() * allCats.length)];
                if (!cats.includes(c)) cats.push(c);
            }

            return createCatalogEntry({
                id: 'seed_' + (i + 1),
                orgType: n.type,
                nameOrCompany: n.name,
                companyName: n.company ? n.name : '',
                avatarUrl: '',
                about: `Опытный специалист в сфере строительства. Более ${3 + Math.floor(Math.random() * 15)} лет опыта.`,
                phone: '+7 7' + String(Math.floor(Math.random() * 100000000)).padStart(8, '0'),
                email: n.name.toLowerCase().replace(/\s/g, '') + '@mail.kz',
                services: cats,
                serviceTags: {},
                customTags: [],
                city: cities[i % cities.length],
                country: 'KZ',
                serviceZones: [cities[i % cities.length]],
                radiusKm: [10, 20, 50, 100][Math.floor(Math.random() * 4)],
                rating: +(3.5 + Math.random() * 1.5).toFixed(1),
                availability: {
                    acceptOrders: Math.random() > 0.2,
                    status: statuses[Math.floor(Math.random() * statuses.length)],
                    startWhen: startOptions[Math.floor(Math.random() * startOptions.length)],
                    schedule: ['weekdays']
                },
                terms: {
                    priceLevel: priceLevels[Math.floor(Math.random() * priceLevels.length)],
                    minOrder: [10000, 20000, 50000, 100000][Math.floor(Math.random() * 4)],
                    warrantyMonths: String(1 + Math.floor(Math.random() * 12)),
                    payments: ['cash', 'transfer']
                },
                company: {
                    hasTeam: n.company,
                    teamCount: n.company ? String(3 + Math.floor(Math.random() * 20)) : '0',
                    teamSpecialties: [],
                    teamRoles: [],
                    employees: [],
                    equipment: n.company ? [{ name: 'Спецтехника', category: 'Спецтехника', qty: 1, owned: true }] : [],
                    capabilities: []
                },
                portfolioPhotos: [],
                completionPercent: 50 + Math.floor(Math.random() * 50),
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 90 * 86400000)).toISOString(),
                updatedAt: new Date().toISOString()
            });
        });
    }

    // ─── EXPORT ───
    window.CatalogModels = {
        EXECUTOR_TYPES,
        CATALOG_STATUS,
        INVITE_STATUS,
        BUILDER_CATEGORIES,
        SORT_OPTIONS,
        createCatalogEntry,
        createReview,
        createInvite,
        createFilters,
        generateSeedData
    };

    console.log('✅ [CatalogModels] v1.0 loaded');
})();
