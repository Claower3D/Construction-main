// ========== EQUIPMENT / MARKETPLACE MODULE v2 ==========
(function () {
    'use strict';

    // ─── CATALOG ───
    const CATALOG = [
        {
            id: 'earth', label: 'Землеройная', icon: '⛏️', subs: [
                { id: 'excavator_track', label: 'Экскаватор гусеничный', priceTypes: ['hour', 'shift'], specs: [{ key: 'tonnage', label: 'Тоннаж', unit: 'т', type: 'number' }, { key: 'bucket', label: 'Ковш', unit: 'м³', type: 'number' }, { key: 'depth', label: 'Глубина копания', unit: 'м', type: 'number' }] },
                { id: 'excavator_wheel', label: 'Экскаватор колёсный', priceTypes: ['hour', 'shift'], specs: [{ key: 'tonnage', label: 'Тоннаж', unit: 'т', type: 'number' }, { key: 'bucket', label: 'Ковш', unit: 'м³', type: 'number' }] },
                { id: 'mini_excavator', label: 'Мини-экскаватор', priceTypes: ['hour', 'shift'], specs: [{ key: 'tonnage', label: 'Тоннаж', unit: 'т', type: 'number' }, { key: 'bucket', label: 'Ковш', unit: 'м³', type: 'number' }] }
            ]
        },
        {
            id: 'lifting', label: 'Подъёмная', icon: '🏗️', subs: [
                { id: 'crane', label: 'Автокран', priceTypes: ['hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмность', unit: 'т', type: 'number' }, { key: 'boom', label: 'Вылет стрелы', unit: 'м', type: 'number' }] },
                { id: 'manipulator', label: 'Манипулятор', priceTypes: ['hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмность', unit: 'т', type: 'number' }, { key: 'boom', label: 'Вылет стрелы', unit: 'м', type: 'number' }] },
                { id: 'aerial', label: 'Автовышка', priceTypes: ['hour', 'shift'], specs: [{ key: 'height', label: 'Высота подъёма', unit: 'м', type: 'number' }] }
            ]
        },
        {
            id: 'loaders', label: 'Погрузчики', icon: '🚜', subs: [
                { id: 'front_loader', label: 'Фронтальный', priceTypes: ['hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмность', unit: 'т', type: 'number' }, { key: 'liftH', label: 'Высота подъёма', unit: 'м', type: 'number' }] },
                { id: 'forklift', label: 'Вилочный', priceTypes: ['hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмность', unit: 'т', type: 'number' }, { key: 'liftH', label: 'Высота подъёма', unit: 'м', type: 'number' }] },
                { id: 'telescopic', label: 'Телескопический', priceTypes: ['hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмность', unit: 'т', type: 'number' }, { key: 'liftH', label: 'Высота подъёма', unit: 'м', type: 'number' }] }
            ]
        },
        {
            id: 'road', label: 'Дорожная', icon: '🛣️', subs: [
                { id: 'roller', label: 'Каток', priceTypes: ['hour', 'shift'], specs: [{ key: 'weight', label: 'Масса', unit: 'т', type: 'number' }, { key: 'width', label: 'Ширина', unit: 'м', type: 'number' }] },
                { id: 'grader', label: 'Грейдер', priceTypes: ['hour', 'shift'], specs: [{ key: 'bladeW', label: 'Ширина отвала', unit: 'м', type: 'number' }] }
            ]
        },
        {
            id: 'concrete', label: 'Бетон/раствор', icon: '🧱', subs: [
                { id: 'mixer', label: 'Миксер', priceTypes: ['trip', 'hour'], specs: [{ key: 'volume', label: 'Объём', unit: 'м³', type: 'number' }] },
                { id: 'pump', label: 'Бетононасос', priceTypes: ['trip', 'hour'], specs: [{ key: 'boom', label: 'Длина стрелы', unit: 'м', type: 'number' }] }
            ]
        },
        {
            id: 'transport', label: 'Транспорт', icon: '🚛', subs: [
                { id: 'dump10', label: 'Самосвал 10т', priceTypes: ['trip', 'hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмн.', unit: 'т', type: 'number' }, { key: 'bodyV', label: 'Кузов', unit: 'м³', type: 'number' }] },
                { id: 'dump20', label: 'Самосвал 20т', priceTypes: ['trip', 'hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмн.', unit: 'т', type: 'number' }, { key: 'bodyV', label: 'Кузов', unit: 'м³', type: 'number' }] },
                { id: 'gazelle', label: 'Газель', priceTypes: ['trip', 'hour', 'shift'], specs: [{ key: 'capacity', label: 'Грузоподъёмн.', unit: 'т', type: 'number' }] }
            ]
        },
        { id: 'drilling', label: 'Буровая', icon: '🔩', subs: [{ id: 'auger', label: 'Ямобур', priceTypes: ['hour', 'shift'], specs: [{ key: 'drillDepth', label: 'Глубина', unit: 'м', type: 'number' }, { key: 'drillDia', label: 'Диаметр', unit: 'мм', type: 'number' }] }] },
        {
            id: 'energy', label: 'Энергетика', icon: '⚡', subs: [
                { id: 'generator', label: 'Генератор', priceTypes: ['hour', 'shift', 'day'], specs: [{ key: 'power', label: 'Мощность', unit: 'кВт', type: 'number' }] },
                { id: 'compressor', label: 'Компрессор', priceTypes: ['hour', 'shift', 'day'], specs: [{ key: 'pressure', label: 'Давление', unit: 'бар', type: 'number' }, { key: 'flow', label: 'Производит.', unit: 'л/мин', type: 'number' }] }
            ]
        }
    ];
    const CITIES = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Семей', 'Атырау', 'Костанай', 'Петропавловск', 'Уральск', 'Усть-Каменогорск', 'Кызылорда', 'Актау', 'Туркестан'];
    const CONDITIONS = [{ v: 'new', l: 'Новая' }, { v: 'good', l: 'Хорошее' }, { v: 'ok', l: 'Рабочее' }, { v: 'repair', l: 'Треб. ремонта' }];
    const STATUSES = [{ v: 'available', l: 'Доступна', c: 'green' }, { v: 'reserved', l: 'Забронирована', c: 'yellow' }, { v: 'rented', l: 'В аренде', c: 'blue' }, { v: 'on_object', l: 'На объекте', c: 'purple' }, { v: 'in_repair', l: 'В ремонте', c: 'red' }];
    const PRICING_MODES = {
        HOUR: { v: 'HOUR', l: 'час', icon: '⏱️', unit: '₸/час', filterLabel: 'Почасовая' },
        SHIFT: { v: 'SHIFT', l: 'смена', icon: '🔄', unit: '₸/смена', filterLabel: 'Смена' },
        TRIP: { v: 'TRIP', l: 'рейс', icon: '🚛', unit: '₸/рейс', filterLabel: 'Рейс' }
    };
    function getPM(mode) { return PRICING_MODES[mode] || PRICING_MODES.HOUR; }
    const BOOKING_STATUSES = [{ v: 'new', l: 'Новая', c: 'yellow' }, { v: 'confirmed', l: 'Подтверждена', c: 'blue' }, { v: 'in_progress', l: 'В процессе', c: 'purple' }, { v: 'completed', l: 'Завершена', c: 'green' }, { v: 'canceled', l: 'Отменена', c: 'gray' }, { v: 'rejected', l: 'Отклонена', c: 'red' }];

    // ─── STORE ───
    let units = [], listings = [], bookings = [];
    const load = k => { try { return JSON.parse(localStorage.getItem(k) || '[]') } catch (e) { return [] } };
    const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    function loadAll() { units = load('equipment_units'); listings = load('equipment_listings'); bookings = load('equipment_bookings'); if (!units.length) seedData(); }
    function saveAll() { save('equipment_units', units); save('equipment_listings', listings); save('equipment_bookings', bookings); }
    function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2, 6) }
    function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }
    function getCurrentUser() {
        let role = 'customer';
        if (window.RoleManager && window.RoleManager.currentUI) role = window.RoleManager.currentUI();
        else role = localStorage.getItem('userRole') || 'orderer';
        return { id: localStorage.getItem('userId') || 'demo_user', type: role === 'contractor' ? 'executor' : 'customer' };
    }
    function findCat(id) { return CATALOG.find(c => c.id === id) }
    function findSub(cid, sid) { const c = findCat(cid); return c ? c.subs.find(s => s.id === sid) : null }
    function getCatIcon(cid) { const c = findCat(cid); return c ? c.icon : '🔧' }
    function getSubLabel(cid, sid) { const s = findSub(cid, sid); return s ? s.label : sid }
    function statusBadge(st, list) { const s = list.find(x => x.v === st); return s ? `<span class="eq-badge eq-badge-${s.c}">${s.l}</span>` : st }
    function getPricingLabel(l) {
        const pm = getPM(l.pricingMode);
        const p = l.pricing || {};
        let main = '₸ ' + Number(p.price || 0).toLocaleString('ru') + ' ' + pm.unit;
        if (l.pricingMode === 'SHIFT' && p.shiftHours) main = '₸ ' + Number(p.price).toLocaleString('ru') + ' / смена (' + p.shiftHours + 'ч)';
        if (l.pricingMode === 'TRIP' && p.includedKm) main += ' <span style="font-size:.72rem;color:rgba(255,255,255,.4)">(до ' + p.includedKm + ' км)</span>';
        return main;
    }

    // ─── SEED DATA ───
    function seedData() {
        const now = new Date().toISOString();
        const demoUnits = [
            { id: 's1', ownerId: 'demo_owner', ownerType: 'executor', title: 'Мини-экскаватор Doosan DX55', category: 'earth', subcategory: 'mini_excavator', city: 'Алматы', year: 2021, condition: 'good', status: 'available', photos: [], specs: { tonnage: 5.5, bucket: 0.16 }, createdAt: now },
            { id: 's2', ownerId: 'demo_owner', ownerType: 'executor', title: 'Экскаватор гусеничный Hitachi ZX240', category: 'earth', subcategory: 'excavator_track', city: 'Алматы', year: 2020, condition: 'good', status: 'available', photos: [], specs: { tonnage: 24, bucket: 1.0, depth: 6.7 }, createdAt: now },
            { id: 's3', ownerId: 'demo_owner2', ownerType: 'executor', title: 'Экскаватор колёсный JCB JS160W', category: 'earth', subcategory: 'excavator_wheel', city: 'Астана', year: 2019, condition: 'good', status: 'available', photos: [], specs: { tonnage: 16, bucket: 0.9 }, createdAt: now },
            { id: 's4', ownerId: 'demo_owner', ownerType: 'executor', title: 'Фронтальный погрузчик XCMG ZL50G', category: 'loaders', subcategory: 'front_loader', city: 'Алматы', year: 2020, condition: 'good', status: 'available', photos: [], specs: { capacity: 5, liftH: 3.2 }, createdAt: now },
            { id: 's5', ownerId: 'demo_owner2', ownerType: 'executor', title: 'Автокран Клинцы 25т', category: 'lifting', subcategory: 'crane', city: 'Астана', year: 2019, condition: 'ok', status: 'available', photos: [], specs: { capacity: 25, boom: 33 }, createdAt: now },
            { id: 's6', ownerId: 'demo_owner', ownerType: 'executor', title: 'Манипулятор КАМАЗ 65117', category: 'lifting', subcategory: 'manipulator', city: 'Алматы', year: 2022, condition: 'good', status: 'available', photos: [], specs: { capacity: 7, boom: 10 }, createdAt: now },
            { id: 's7', ownerId: 'demo_owner2', ownerType: 'executor', title: 'Автовышка 22м АГП-22', category: 'lifting', subcategory: 'aerial', city: 'Караганда', year: 2018, condition: 'ok', status: 'available', photos: [], specs: { height: 22 }, createdAt: now },
            { id: 's8', ownerId: 'demo_owner', ownerType: 'executor', title: 'Самосвал КАМАЗ 6520 20т', category: 'transport', subcategory: 'dump20', city: 'Алматы', year: 2022, condition: 'new', status: 'available', photos: [], specs: { capacity: 20, bodyV: 12 }, createdAt: now },
            { id: 's9', ownerId: 'demo_owner2', ownerType: 'executor', title: 'Самосвал 10т', category: 'transport', subcategory: 'dump10', city: 'Алматы', year: 2020, condition: 'good', status: 'available', photos: [], specs: { capacity: 10, bodyV: 6 }, createdAt: now },
            { id: 's10', ownerId: 'demo_owner', ownerType: 'executor', title: 'Газель грузовая', category: 'transport', subcategory: 'gazelle', city: 'Алматы', year: 2023, condition: 'new', status: 'available', photos: [], specs: { capacity: 1.5 }, createdAt: now },
            { id: 's11', ownerId: 'demo_owner2', ownerType: 'executor', title: 'Каток дорожный XCMG XS143J', category: 'road', subcategory: 'roller', city: 'Караганда', year: 2021, condition: 'good', status: 'available', photos: [], specs: { weight: 14, width: 2.1 }, createdAt: now },
            { id: 's12', ownerId: 'demo_owner', ownerType: 'executor', title: 'Грейдер XCMG GR215', category: 'road', subcategory: 'grader', city: 'Астана', year: 2020, condition: 'good', status: 'available', photos: [], specs: { bladeW: 4.3 }, createdAt: now },
            { id: 's13', ownerId: 'demo_owner2', ownerType: 'executor', title: 'Миксер 7м³ КАМАЗ', category: 'concrete', subcategory: 'mixer', city: 'Алматы', year: 2021, condition: 'good', status: 'available', photos: [], specs: { volume: 7 }, createdAt: now },
            { id: 's14', ownerId: 'demo_owner', ownerType: 'executor', title: 'Ямобур БМ-302', category: 'drilling', subcategory: 'auger', city: 'Шымкент', year: 2019, condition: 'ok', status: 'available', photos: [], specs: { drillDepth: 3, drillDia: 500 }, createdAt: now },
            { id: 's15', ownerId: 'demo_owner2', ownerType: 'executor', title: 'Генератор дизельный 100кВт', category: 'energy', subcategory: 'generator', city: 'Алматы', year: 2023, condition: 'new', status: 'available', photos: [], specs: { power: 100 }, createdAt: now }
        ];
        const demoListings = [
            { id: 'ls1', unitId: 's1', isActive: true, pricingMode: 'HOUR', pricing: { price: 4500, minHours: 4 }, withOperator: true, delivery: 'paid', deliveryRules: { basePrice: 15000 }, radiusKm: 50, availability: { availableToday: true }, description: 'Быстрая подача. Опытный оператор.', createdAt: now },
            { id: 'ls2', unitId: 's2', isActive: true, pricingMode: 'SHIFT', pricing: { price: 25000, shiftHours: 8, waitingPricePerHour: 2000 }, withOperator: true, delivery: 'paid', deliveryRules: { basePrice: 25000 }, radiusKm: 100, availability: { availableToday: false }, description: 'Полноразмерный экскаватор. Смена 8ч.', createdAt: now },
            { id: 'ls3', unitId: 's3', isActive: true, pricingMode: 'HOUR', pricing: { price: 5500, minHours: 4 }, withOperator: false, delivery: 'none', radiusKm: 80, availability: { availableToday: true }, description: 'Колёсный экскаватор JCB, самовывоз.', createdAt: now },
            { id: 'ls4', unitId: 's4', isActive: true, pricingMode: 'SHIFT', pricing: { price: 16000, shiftHours: 8 }, withOperator: false, delivery: 'included', radiusKm: 30, availability: { availableToday: true }, description: 'XCMG ZL50G. Доставка включена.', createdAt: now },
            { id: 'ls5', unitId: 's5', isActive: true, pricingMode: 'HOUR', pricing: { price: 8000, minHours: 2 }, withOperator: true, delivery: 'paid', deliveryRules: { basePrice: 20000 }, radiusKm: 60, availability: { availableToday: false }, description: 'Автокран 25т, вылет 33м.', createdAt: now },
            { id: 'ls6', unitId: 's6', isActive: true, pricingMode: 'TRIP', pricing: { price: 18000, minTrips: 1 }, withOperator: true, delivery: 'included', radiusKm: 40, availability: { availableToday: true }, description: 'Манипулятор 7т. Цена за рейс.', createdAt: now },
            { id: 'ls7', unitId: 's7', isActive: true, pricingMode: 'HOUR', pricing: { price: 6000, minHours: 3 }, withOperator: true, delivery: 'paid', deliveryRules: { basePrice: 10000 }, radiusKm: 50, availability: { availableToday: true }, description: 'Автовышка 22м с оператором.', createdAt: now },
            { id: 'ls8', unitId: 's8', isActive: true, pricingMode: 'TRIP', pricing: { price: 12000, includedKm: 15, extraKmPrice: 400 }, withOperator: true, delivery: 'included', radiusKm: 80, availability: { availableToday: true }, description: 'КАМАЗ 20т. До 15 км включено.', createdAt: now },
            { id: 'ls9', unitId: 's9', isActive: true, pricingMode: 'TRIP', pricing: { price: 8000, includedKm: 10, extraKmPrice: 350 }, withOperator: true, delivery: 'included', radiusKm: 60, availability: { availableToday: false }, description: 'Самосвал 10т. До 10 км.', createdAt: now },
            { id: 'ls10', unitId: 's10', isActive: true, pricingMode: 'TRIP', pricing: { price: 5000, minTrips: 1, includedKm: 10, extraKmPrice: 200 }, withOperator: true, delivery: 'included', radiusKm: 100, availability: { availableToday: true }, description: 'Газель. Цена за рейс.', createdAt: now },
            { id: 'ls11', unitId: 's11', isActive: true, pricingMode: 'SHIFT', pricing: { price: 18000, shiftHours: 10 }, withOperator: true, delivery: 'paid', deliveryRules: { basePrice: 30000 }, radiusKm: 80, availability: { availableToday: false }, description: 'Каток 14т. Смена 10ч.', createdAt: now },
            { id: 'ls12', unitId: 's12', isActive: true, pricingMode: 'SHIFT', pricing: { price: 22000, shiftHours: 8 }, withOperator: true, delivery: 'paid', deliveryRules: { basePrice: 35000 }, radiusKm: 120, availability: { availableToday: true }, description: 'Грейдер XCMG. Смена 8ч.', createdAt: now },
            { id: 'ls13', unitId: 's13', isActive: true, pricingMode: 'TRIP', pricing: { price: 25000, minTrips: 1 }, withOperator: true, delivery: 'included', radiusKm: 50, availability: { availableToday: true }, description: 'Миксер 7м³. Цена за рейс.', createdAt: now },
            { id: 'ls14', unitId: 's14', isActive: true, pricingMode: 'HOUR', pricing: { price: 7000, minHours: 3 }, withOperator: true, delivery: 'paid', deliveryRules: { basePrice: 12000 }, radiusKm: 40, availability: { availableToday: true }, description: 'Ямобур, глубина до 3м.', createdAt: now },
            { id: 'ls15', unitId: 's15', isActive: true, pricingMode: 'SHIFT', pricing: { price: 12000, shiftHours: 8 }, withOperator: false, delivery: 'paid', deliveryRules: { basePrice: 8000 }, radiusKm: 60, availability: { availableToday: true }, description: 'Генератор 100кВт. Тихий режим.', createdAt: now }
        ];
        units = demoUnits; listings = demoListings; bookings = [];
        saveAll();
    }

    // ─── STATE ───
    let activeTab = 'marketplace';
    let filters = { search: '', category: '', pricingMode: '', city: '', radiusKm: 50, onlyFree: false, withOp: false, priceMax: 100000, delivery: '' };

    // ─── RENDER MAIN ───
    function render() {
        const root = document.getElementById('eqRoot'); if (!root) return;
        loadAll();
        root.innerHTML = `<div class="eq-root">
            <div class="eq-header"><h2>🚜 Техника</h2><p>Маркетплейс аренды спецтехники</p></div>
            ${renderTabs()}
            <div id="eqTabContent">${renderTabContent()}</div>
        </div>`;
        bindEvents();
    }

    function renderTabs() {
        const tabs = [{ id: 'marketplace', icon: '🏪', label: 'Маркетплейс' }, { id: 'fleet', icon: '🚜', label: 'Мой парк' }, { id: 'mylistings', icon: '📋', label: 'Мои объявления' }, { id: 'myrentals', icon: '📦', label: 'Мои аренды' }];
        return `<div class="eq-tabs">${tabs.map(t => `<button class="eq-tab ${activeTab === t.id ? 'active' : ''}" onclick="EquipmentModule.openTab('${t.id}')">${t.icon} ${t.label}</button>`).join('')}</div>`;
    }
    function renderTabContent() {
        if (activeTab === 'marketplace') return renderMarketplace();
        if (activeTab === 'fleet') return renderMyFleet();
        if (activeTab === 'mylistings') return renderMyListings();
        if (activeTab === 'myrentals') return renderMyRentals();
        return '';
    }

    // ─── MARKETPLACE ───
    function getFiltered() {
        let fl = listings.filter(l => l.isActive);
        if (filters.search) { const q = filters.search.toLowerCase(); fl = fl.filter(l => { const u = units.find(x => x.id === l.unitId); return u && (u.title.toLowerCase().includes(q) || getSubLabel(u.category, u.subcategory).toLowerCase().includes(q)) }); }
        if (filters.category) fl = fl.filter(l => { const u = units.find(x => x.id === l.unitId); return u && u.category === filters.category });
        if (filters.pricingMode) fl = fl.filter(l => l.pricingMode === filters.pricingMode);
        if (filters.city) fl = fl.filter(l => { const u = units.find(x => x.id === l.unitId); return u && u.city === filters.city });
        if (filters.onlyFree) fl = fl.filter(l => l.availability && l.availability.availableToday);
        if (filters.withOp) fl = fl.filter(l => l.withOperator);
        if (filters.priceMax < 100000) fl = fl.filter(l => (l.pricing ? l.pricing.price : 0) <= filters.priceMax);
        if (filters.delivery === 'with') fl = fl.filter(l => l.delivery !== 'none');
        if (filters.delivery === 'self') fl = fl.filter(l => l.delivery === 'none');
        return fl;
    }

    function renderMarketplace() {
        const filtered = getFiltered();
        return `
        <div class="eq-topbar">
            <span style="font-size:1.1rem;opacity:.5">🔍</span>
            <input id="eqSearch" placeholder="Искать по категории, модели или характеристикам" value="${esc(filters.search)}">
            <div class="eq-count">Найдено: ${filtered.length}</div>
        </div>
        <div class="eq-layout">
            ${renderSidebar(filtered.length)}
            <div>
                ${renderCatPills()}
                ${filtered.length === 0
                ? `<div class="eq-empty"><div class="eq-empty-icon">🔍</div><div class="eq-empty-text">Объявления не найдены.<br>Попробуйте изменить фильтры.</div></div>`
                : `<div class="eq-grid">${filtered.map(l => renderCard(l)).join('')}</div>`}
            </div>
        </div>`;
    }

    function renderSidebar(count) {
        const pmLabel = filters.pricingMode ? getPM(filters.pricingMode).l : 'ед.';
        return `<div class="eq-sidebar">
            <div class="eq-sidebar-section">
                <div class="eq-sidebar-title"><span class="icon">📁</span> Категория</div>
                <div class="eq-sidebar-body">
                    <select class="eq-select" id="eqFCat">
                        <option value="">Все категории</option>
                        ${CATALOG.map(c => `<option value="${c.id}" ${filters.category === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="eq-sidebar-section">
                <div class="eq-sidebar-title"><span class="icon">📊</span> Тариф</div>
                <div class="eq-sidebar-body">
                    <label class="eq-radio-row"><input type="radio" name="eqPM" value="" ${filters.pricingMode === '' ? 'checked' : ''}> Все</label>
                    ${Object.values(PRICING_MODES).map(m => `<label class="eq-radio-row"><input type="radio" name="eqPM" value="${m.v}" ${filters.pricingMode === m.v ? 'checked' : ''}> ${m.icon} ${m.filterLabel}</label>`).join('')}
                </div>
            </div>
            <div class="eq-sidebar-section">
                <div class="eq-sidebar-title"><span class="icon">📍</span> Локация</div>
                <div class="eq-sidebar-body">
                    <select class="eq-select" id="eqFCity">
                        <option value="">Все города</option>
                        ${CITIES.map(c => `<option value="${c}" ${filters.city === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                    <div class="eq-range-wrap" style="margin-top:.4rem">
                        <div style="display:flex;justify-content:space-between"><label>Радиус</label><span class="eq-range-val" id="eqRadiusVal">${filters.radiusKm} км</span></div>
                        <input type="range" class="eq-range" id="eqFRadius" min="10" max="200" step="10" value="${filters.radiusKm}">
                    </div>
                </div>
            </div>
            <div class="eq-sidebar-section">
                <div class="eq-sidebar-body">
                    <label class="eq-check-row"><input type="checkbox" id="eqFFree" ${filters.onlyFree ? 'checked' : ''}> Только свободные сегодня</label>
                    <label class="eq-check-row"><input type="checkbox" id="eqFOp" ${filters.withOp ? 'checked' : ''}> С оператором</label>
                </div>
            </div>
            <div class="eq-sidebar-section">
                <div class="eq-sidebar-title"><span class="icon">💰</span> Цена за ${pmLabel}</div>
                <div class="eq-sidebar-body">
                    <div class="eq-range-wrap">
                        <div style="display:flex;justify-content:space-between"><label>до</label><span class="eq-range-val" id="eqPriceVal">${filters.priceMax >= 100000 ? '∞' : Number(filters.priceMax).toLocaleString('ru') + '₸'}</span></div>
                        <input type="range" class="eq-range" id="eqFPrice" min="1000" max="100000" step="1000" value="${filters.priceMax}">
                    </div>
                </div>
            </div>
            <div class="eq-sidebar-section">
                <div class="eq-sidebar-title"><span class="icon">🚚</span> Доставка</div>
                <div class="eq-sidebar-body">
                    <label class="eq-radio-row"><input type="radio" name="eqDel" value="" ${filters.delivery === '' ? 'checked' : ''}> Все варианты</label>
                    <label class="eq-radio-row"><input type="radio" name="eqDel" value="with" ${filters.delivery === 'with' ? 'checked' : ''}> С доставкой</label>
                    <label class="eq-radio-row"><input type="radio" name="eqDel" value="self" ${filters.delivery === 'self' ? 'checked' : ''}> Самовывоз</label>
                </div>
            </div>
            <button class="eq-sidebar-cta" onclick="EquipmentModule._applyFilters()">Показать ${count} объявлени${count === 1 ? 'е' : count < 5 ? 'я' : 'й'}</button>
        </div>`;
    }

    function renderCatPills() {
        return `<div class="eq-cat-pills">
            <button class="eq-cat-pill ${filters.category === '' ? 'active' : ''}" onclick="EquipmentModule._setCat('')">🔧 Все категории</button>
            ${CATALOG.map(c => `<button class="eq-cat-pill ${filters.category === c.id ? 'active' : ''}" onclick="EquipmentModule._setCat('${c.id}')">${c.icon} ${c.label}</button>`).join('')}
        </div>`;
    }

    function renderCard(l) {
        const u = units.find(x => x.id === l.unitId); if (!u) return '';
        const pm = getPM(l.pricingMode);
        const hasPhoto = u.photos && u.photos.length > 0;
        const availToday = l.availability && l.availability.availableToday;
        const sub = findSub(u.category, u.subcategory);
        let specsStr = '';
        if (sub && sub.specs && u.specs) {
            specsStr = sub.specs.filter(s => u.specs[s.key]).map(s => u.specs[s.key] + ' ' + s.unit).join(', ');
        }
        return `<div class="eq-card luxury-em-card" onclick="EquipmentModule.openDetail('${l.id}')">
            <div class="eq-card-img luxury-image-container">
                <div class="em-card-blueprint-grid"></div>
                <div class="em-brand-watermark">HEAVY EQUIPMENT SPEC</div>
                <div class="em-card-main-visual">
                    <div class="em-card-icon-halo">
                        ${hasPhoto ? `<img src="${u.photos[0]}" alt="${esc(u.title)}" style="width:100%;height:100%;object-fit:cover;border-radius:18px;">` : `<span class="em-icon-symbol">${getCatIcon(u.category)}</span>`}
                    </div>
                </div>
                <div class="em-telemetry-badge-top">
                    ${availToday ? '<span class="em-status-pill available"><span class="pulse-green-dot"></span> Готов к выезду</span>' : '<span class="em-status-pill busy">● На объекте (с 18:00)</span>'}
                    <span class="em-rating-badge">★ 4.95</span>
                </div>
            </div>
            <div class="eq-card-body luxury-content">
                <div class="em-card-category-strip">
                    <span class="em-cat-tag">СПЕЦТЕХНИКА КАЗАХСТАНА</span>
                    <span class="em-gps-tag">🛰️ GPS Online</span>
                </div>
                <div class="eq-card-title">${esc(u.title)}${specsStr ? ', ' + specsStr : ''}</div>
                <div class="em-price-cockpit">
                    <div class="em-main-price">
                        <span class="kzt-currency">₸</span>
                        <span class="kzt-value">${getPricingLabel(l)}</span>
                    </div>
                    <div class="em-escrow-guarantee">🛡️ Эскроу QazGost</div>
                </div>
                <div class="eq-card-badges">
                    <span class="eq-badge eq-badge-blue" style="font-size:.75rem">${pm.icon} ${pm.filterLabel}</span>
                    ${l.withOperator ? '<span class="eq-badge eq-badge-blue">👷 С оператором</span>' : ''}
                    ${l.delivery === 'included' ? '<span class="eq-badge eq-badge-blue">🚚 Доставка</span>' : ''}
                    ${l.delivery === 'paid' ? '<span class="eq-badge eq-badge-gray">🚚 Платная доставка</span>' : ''}
                    <span class="eq-badge eq-badge-gray">${esc(u.city)}</span>
                </div>
                <div class="eq-card-actions" onclick="event.stopPropagation()">
                    <button class="eq-btn-book luxury-book-btn" onclick="EquipmentModule.openBookingModal('${l.id}')">⚡ Забронировать</button>
                    <button class="eq-btn-rent luxury-compare-btn" onclick="EquipmentModule.openTab('fleet')">Сдаёшь?</button>
                </div>
            </div>
        </div>`;
    }

    // ─── MY FLEET ───
    function renderMyFleet() {
        const user = getCurrentUser(); const my = units.filter(u => u.ownerId === user.id);
        return `<button class="eq-btn-add" onclick="EquipmentModule.openUnitModal('add')">➕ Добавить технику</button>
        ${my.length === 0 ? `<div class="eq-empty"><div class="eq-empty-icon">🚜</div><div class="eq-empty-text">Ваш парк техники пуст.<br>Добавьте первую единицу!</div></div>`
                : my.map(u => renderFleetCard(u)).join('')}`;
    }
    function renderFleetCard(u) {
        const hasListing = listings.some(l => l.unitId === u.id && l.isActive);
        const st = STATUSES.find(s => s.v === u.status);
        return `<div class="eq-fleet-card">
            <div class="eq-fleet-thumb">${u.photos && u.photos.length ? `<img src="${u.photos[0]}">` : `<span style="font-size:1.8rem">${getCatIcon(u.category)}</span>`}</div>
            <div class="eq-fleet-info">
                <div class="eq-fleet-title">${esc(u.title)}</div>
                <div class="eq-fleet-sub">${getSubLabel(u.category, u.subcategory)} · ${esc(u.city)} ${st ? statusBadge(u.status, STATUSES) : ''} ${hasListing ? '<span class="eq-badge eq-badge-green">📢</span>' : ''}</div>
                <div class="eq-fleet-actions">
                    <button class="eq-btn-sm" onclick="EquipmentModule.openUnitModal('edit','${u.id}')">✏️ Изменить</button>
                    ${!hasListing ? `<button class="eq-btn-sm primary" onclick="EquipmentModule.openListingModal('${u.id}')">📢 Опубликовать</button>` : `<button class="eq-btn-sm" onclick="EquipmentModule._deactivateListing('${u.id}')">📴 Снять</button>`}
                    <button class="eq-btn-sm danger" onclick="EquipmentModule._deleteUnit('${u.id}')">🗑️</button>
                </div>
            </div>
        </div>`;
    }

    // ─── MY LISTINGS ───
    function renderMyListings() {
        const user = getCurrentUser(); const myU = units.filter(u => u.ownerId === user.id);
        const myL = listings.filter(l => myU.some(u => u.id === l.unitId));
        if (!myL.length) return `<div class="eq-empty"><div class="eq-empty-icon">📋</div><div class="eq-empty-text">У вас нет объявлений</div></div>`;
        return myL.map(l => {
            const u = units.find(x => x.id === l.unitId); if (!u) return '';
            const pm = getPM(l.pricingMode);
            const bk = bookings.filter(b => b.listingId === l.id);
            return `<div class="eq-fleet-card" style="flex-direction:column;gap:.5rem">
                <div style="display:flex;gap:.75rem;align-items:center">
                    <div class="eq-fleet-thumb">${u.photos && u.photos.length ? `<img src="${u.photos[0]}">` : `<span style="font-size:1.5rem">${getCatIcon(u.category)}</span>`}</div>
                    <div style="flex:1;min-width:0">
                        <div class="eq-fleet-title">${esc(u.title)}</div>
                        <div class="eq-fleet-sub">${Number(l.pricing ? l.pricing.price : 0).toLocaleString('ru')} ${pm.unit}</div>
                    </div>
                    <div class="eq-toggle-wrap" onclick="EquipmentModule._toggleListingActive('${l.id}')">
                        <div class="eq-toggle ${l.isActive ? 'on' : ''}"></div>
                    </div>
                </div>
                <div class="eq-fleet-actions" style="margin-top:.25rem">
                    ${l.isActive ? '<span class="eq-badge eq-badge-green">Активно</span>' : '<span class="eq-badge eq-badge-gray">Неактивно</span>'}
                    ${l.withOperator ? '<span class="eq-badge eq-badge-blue">Оператор</span>' : ''}
                    <button class="eq-btn-sm" onclick="EquipmentModule.openListingModal('${u.id}','${l.id}')">✏️</button>
                </div>
                ${bk.length ? `<div style="margin-top:.5rem;padding-top:.5rem;border-top:1px solid rgba(255,255,255,.06)">
                    <div style="font-size:.78rem;font-weight:700;color:rgba(255,255,255,.6);margin-bottom:.3rem">📨 Заявки (${bk.length})</div>
                    ${bk.map(b => renderBookingItem(b, true)).join('')}
                </div>`: ''}
            </div>`;
        }).join('');
    }

    // ─── MY RENTALS ───
    function renderMyRentals() {
        const user = getCurrentUser(); const my = bookings.filter(b => b.renterId === user.id);
        if (!my.length) return `<div class="eq-empty"><div class="eq-empty-icon">📦</div><div class="eq-empty-text">У вас нет заявок на аренду</div></div>`;
        return my.map(b => renderBookingItem(b, false)).join('');
    }
    function renderBookingItem(b, isOwner) {
        const l = listings.find(x => x.id === b.listingId); const u = l ? units.find(x => x.id === l.unitId) : null;
        const bs = BOOKING_STATUSES.find(s => s.v === b.status);
        return `<div class="eq-booking-item">
            <div class="eq-booking-info">
                <div class="eq-b-title">${u ? esc(u.title) : 'Техника'}</div>
                <div class="eq-b-meta">${b.dateFrom || ''} ${b.hoursCount ? '· ' + b.hoursCount + 'ч' : ''} ${b.totalPriceEstimate ? '· ~' + Number(b.totalPriceEstimate).toLocaleString('ru') + '₸' : ''}</div>
            </div>
            ${bs ? `<span class="eq-badge eq-badge-${bs.c}">${bs.l}</span>` : ''}
            <div class="eq-booking-actions">
                ${isOwner && b.status === 'new' ? `<button class="eq-btn-sm success" onclick="EquipmentModule._setBookingStatus('${b.id}','confirmed')">✓</button><button class="eq-btn-sm danger" onclick="EquipmentModule._setBookingStatus('${b.id}','rejected')">✕</button>` : ''}
                ${isOwner && b.status === 'confirmed' ? `<button class="eq-btn-sm primary" onclick="EquipmentModule._setBookingStatus('${b.id}','in_progress')">▶ Начать</button>` : ''}
                ${isOwner && b.status === 'in_progress' ? `<button class="eq-btn-sm success" onclick="EquipmentModule._setBookingStatus('${b.id}','completed')">✓ Готово</button>` : ''}
                ${!isOwner && (b.status === 'new' || b.status === 'confirmed') ? `<button class="eq-btn-sm danger" onclick="EquipmentModule._setBookingStatus('${b.id}','canceled')">Отменить</button>` : ''}
            </div>
        </div>`;
    }

    // ─── MODALS ───
    function closeModal() { const ov = document.getElementById('eqModalOverlay'); if (ov) { ov.hidden = true; ov.innerHTML = ''; } }

    function openUnitModal(mode, unitId) {
        const u = mode === 'edit' ? units.find(x => x.id === unitId) : null;
        const selCat = u ? u.category : ''; const selSub = u ? u.subcategory : '';
        const cat = findCat(selCat); const sub = findSub(selCat, selSub);
        _tempPhotos = u ? [...(u.photos || [])] : [];
        const ov = document.getElementById('eqModalOverlay'); ov.hidden = false;
        ov.innerHTML = `<div class="eq-modal">
            <div class="eq-modal-title"><span>${mode === 'edit' ? '✏️ Редактировать' : '➕ Добавить'} технику</span><button class="eq-modal-close" onclick="EquipmentModule.closeModal()">✕</button></div>
            <div class="eq-modal-section"><div class="eq-grid-2">
                <div><label class="eq-section-label">Название *</label><input class="eq-input" id="eqUnitTitle" value="${u ? esc(u.title) : ''}" placeholder="Экскаватор CAT 320"></div>
                <div><label class="eq-section-label">Город *</label><select class="eq-input" id="eqUnitCity">${CITIES.map(c => `<option value="${c}" ${u && u.city === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
                <div><label class="eq-section-label">Категория *</label><select class="eq-input" id="eqUnitCat" onchange="EquipmentModule._onCatChange()"><option value="">— Выберите —</option>${CATALOG.map(c => `<option value="${c.id}" ${selCat === c.id ? 'selected' : ''}>${c.icon} ${c.label}</option>`).join('')}</select></div>
                <div><label class="eq-section-label">Подкатегория *</label><select class="eq-input" id="eqUnitSub" onchange="EquipmentModule._onSubChange()"><option value="">— Выберите —</option>${cat ? cat.subs.map(s => `<option value="${s.id}" ${selSub === s.id ? 'selected' : ''}>${s.label}</option>`).join('') : ''}</select></div>
                <div><label class="eq-section-label">Год выпуска</label><input type="number" class="eq-input" id="eqUnitYear" value="${u ? u.year || '' : ''}" placeholder="2020"></div>
                <div><label class="eq-section-label">Состояние</label><select class="eq-input" id="eqUnitCond">${CONDITIONS.map(c => `<option value="${c.v}" ${u && u.condition === c.v ? 'selected' : ''}>${c.l}</option>`).join('')}</select></div>
                <div><label class="eq-section-label">Статус</label><select class="eq-input" id="eqUnitStatus">${STATUSES.map(s => `<option value="${s.v}" ${u && u.status === s.v ? 'selected' : ''}>${s.l}</option>`).join('')}</select></div>
            </div></div>
            <div class="eq-modal-section" id="eqSpecsContainer">${sub ? renderSpecsFields(sub.specs, u ? u.specs : {}) : '<div class="eq-section-label" style="color:rgba(255,255,255,.3)">Выберите подкатегорию для характеристик</div>'}</div>
            <div class="eq-modal-section">
                <label class="eq-section-label">Фото</label>
                <div class="eq-photo-upload" onclick="document.getElementById('eqUnitPhotoInput').click()"><input type="file" id="eqUnitPhotoInput" accept="image/*" multiple hidden>📷 Добавить фото</div>
                <div class="eq-photo-grid" id="eqUnitPhotos">${_tempPhotos.map((p, i) => `<div class="eq-photo-thumb"><img src="${p}"><button onclick="EquipmentModule._removeUnitPhoto(${i})">✕</button></div>`).join('')}</div>
            </div>
            <input type="hidden" id="eqUnitMode" value="${mode}"><input type="hidden" id="eqUnitId" value="${unitId || ''}">
            <div class="eq-modal-footer">
                <button class="eq-btn-sm" onclick="EquipmentModule.closeModal()">Отмена</button>
                <button class="eq-cta" onclick="EquipmentModule._saveUnit()">💾 Сохранить</button>
            </div>
        </div>`;
        const pi = document.getElementById('eqUnitPhotoInput'); if (pi) pi.addEventListener('change', _handleUnitPhotos);
    }

    let _tempPhotos = [];
    function _handleUnitPhotos(e) {
        Array.from(e.target.files).forEach(f => {
            if (!f.type.startsWith('image/') || f.size > 5 * 1024 * 1024) return;
            const r = new FileReader(); r.onload = ev => {
                _tempPhotos.push(ev.target.result);
                const grid = document.getElementById('eqUnitPhotos');
                if (grid) grid.innerHTML = _tempPhotos.map((p, i) => `<div class="eq-photo-thumb"><img src="${p}"><button onclick="EquipmentModule._removeUnitPhoto(${i})">✕</button></div>`).join('');
            }; r.readAsDataURL(f);
        });
    }
    function renderSpecsFields(specs, vals) {
        if (!specs || !specs.length) return '';
        return `<div class="eq-section-label">📐 Характеристики</div><div class="eq-grid-2">${specs.map(s => `<div><label class="eq-section-label">${s.label} (${s.unit})</label><input type="number" class="eq-input" id="eqSpec_${s.key}" value="${vals && vals[s.key] !== undefined ? vals[s.key] : ''}" step="any"></div>`).join('')}</div>`;
    }

    function openListingModal(unitId, listingId) {
        const l = listingId ? listings.find(x => x.id === listingId) : null; const u = units.find(x => x.id === unitId); if (!u) return;
        const curMode = l ? l.pricingMode : 'HOUR'; const p = l ? (l.pricing || {}) : {};
        const ov = document.getElementById('eqModalOverlay'); ov.hidden = false;
        ov.innerHTML = `<div class="eq-modal">
            <div class="eq-modal-title"><span>📢 ${l ? 'Редактировать' : 'Создать'} объявление</span><button class="eq-modal-close" onclick="EquipmentModule.closeModal()">✕</button></div>
            <div class="eq-modal-section"><div style="color:rgba(255,255,255,.5);font-size:.85rem">Техника: <strong style="color:#f1f5f9">${esc(u.title)}</strong></div></div>
            <div class="eq-modal-section"><div class="eq-grid-2">
                <div><label class="eq-section-label">Тариф *</label><select class="eq-input" id="eqLstPM" onchange="EquipmentModule._onPMChange()">${Object.values(PRICING_MODES).map(m => `<option value="${m.v}" ${curMode === m.v ? 'selected' : ''}>${m.icon} ${m.filterLabel} (${m.unit})</option>`).join('')}</select></div>
                <div><label class="eq-section-label">Цена (₸) *</label><input type="number" class="eq-input" id="eqLstPrice" value="${p.price || ''}" placeholder="15000"></div>
            </div></div>
            <div class="eq-modal-section" id="eqLstPricingFields">${_renderPricingFields(curMode, p)}</div>
            <div class="eq-modal-section"><div class="eq-grid-2">
                <div><label class="eq-section-label">Радиус (км)</label><input type="number" class="eq-input" id="eqLstRad" value="${l ? l.radiusKm || '' : ''}" placeholder="50"></div>
            </div></div>
            <div class="eq-modal-section" style="display:flex;flex-wrap:wrap;gap:1rem">
                <label class="eq-check-row"><input type="checkbox" id="eqLstOp" ${l && l.withOperator ? 'checked' : ''}> С оператором</label>
                <label class="eq-check-row"><input type="checkbox" id="eqLstToday" ${l && l.availability && l.availability.availableToday ? 'checked' : ''}> Доступно сегодня</label>
            </div>
            <div class="eq-modal-section"><label class="eq-section-label">Доставка</label><select class="eq-input" id="eqLstDel"><option value="none" ${l && l.delivery === 'none' ? 'selected' : ''}>Нет</option><option value="included" ${l && l.delivery === 'included' ? 'selected' : ''}>Включена</option><option value="paid" ${l && l.delivery === 'paid' ? 'selected' : ''}>Платная</option></select></div>
            <div class="eq-modal-section"><label class="eq-section-label">Описание</label><textarea class="eq-input" id="eqLstDesc" rows="3" placeholder="Условия...">${l ? esc(l.description || '') : ''}</textarea></div>
            <input type="hidden" id="eqLstUnitId" value="${unitId}"><input type="hidden" id="eqLstId" value="${listingId || ''}">
            <div class="eq-modal-footer"><button class="eq-btn-sm" onclick="EquipmentModule.closeModal()">Отмена</button><button class="eq-cta" onclick="EquipmentModule._saveListing()">📢 Опубликовать</button></div>
        </div>`;
    }
    function _renderPricingFields(mode, p) {
        p = p || {};
        let h = '<div class="eq-grid-2">';
        if (mode === 'HOUR') h += `<div><label class="eq-section-label">Мин. часов</label><input type="number" class="eq-input" id="eqLstMinH" value="${p.minHours || ''}" placeholder="4"></div><div><label class="eq-section-label">Ожидание ₸/час</label><input type="number" class="eq-input" id="eqLstWait" value="${p.waitingPricePerHour || ''}" placeholder="0"></div>`;
        if (mode === 'SHIFT') h += `<div><label class="eq-section-label">Часов в смене</label><select class="eq-input" id="eqLstShiftH"><option value="8" ${(p.shiftHours || 8) == 8 ? 'selected' : ''}>8 ч</option><option value="10" ${p.shiftHours == 10 ? 'selected' : ''}>10 ч</option><option value="12" ${p.shiftHours == 12 ? 'selected' : ''}>12 ч</option></select></div><div><label class="eq-section-label">Ожидание ₸/час</label><input type="number" class="eq-input" id="eqLstWait" value="${p.waitingPricePerHour || ''}" placeholder="0"></div>`;
        if (mode === 'TRIP') h += `<div><label class="eq-section-label">Мин. рейсов</label><input type="number" class="eq-input" id="eqLstMinTrips" value="${p.minTrips || ''}" placeholder="1"></div><div><label class="eq-section-label">Включено км</label><input type="number" class="eq-input" id="eqLstInclKm" value="${p.includedKm || ''}" placeholder="15"></div><div><label class="eq-section-label">Сверх км ₸/км</label><input type="number" class="eq-input" id="eqLstExtraKm" value="${p.extraKmPrice || ''}" placeholder="400"></div>`;

        return h + '</div>';
    }

    function _bookingFieldsFor(mode, p) {
        p = p || {};
        if (mode === 'HOUR') return `<div><label class="eq-section-label">Часы *</label><input type="number" class="eq-input" id="eqBkQty" placeholder="8" min="1"></div>`;
        if (mode === 'SHIFT') return `<div><label class="eq-section-label">Кол-во смен *</label><input type="number" class="eq-input" id="eqBkQty" placeholder="1" min="1"></div>`;
        if (mode === 'TRIP') return `<div><label class="eq-section-label">Кол-во рейсов *</label><input type="number" class="eq-input" id="eqBkQty" placeholder="1" min="1"></div><div><label class="eq-section-label">Км (опц.)</label><input type="number" class="eq-input" id="eqBkKm" placeholder="${p.includedKm || ''}" min="0"></div>`;

        return '';
    }
    function _calcBookingEst(l) {
        const p = l.pricing || {}; const qty = parseInt((document.getElementById('eqBkQty') || {}).value) || 0;
        if (qty <= 0) return '';
        let est = 0;
        if (l.pricingMode === 'HOUR') est = p.price * qty;
        if (l.pricingMode === 'SHIFT') est = p.price * qty;
        if (l.pricingMode === 'TRIP') {
            est = p.price * qty;
            const km = parseInt((document.getElementById('eqBkKm') || {}).value) || 0;
            if (km > (p.includedKm || 0)) est += (km - (p.includedKm || 0)) * (p.extraKmPrice || 0);
        }

        return est > 0 ? '~' + Math.round(est).toLocaleString('ru') + ' ₸' : '';
    }
    function openBookingModal(listingId) {
        const l = listings.find(x => x.id === listingId); if (!l) return;
        const u = units.find(x => x.id === l.unitId); const pm = getPM(l.pricingMode); const p = l.pricing || {};
        const ov = document.getElementById('eqModalOverlay'); ov.hidden = false;
        ov.innerHTML = `<div class="eq-modal">
            <div class="eq-modal-title"><span>📝 Заявка на аренду</span><button class="eq-modal-close" onclick="EquipmentModule.closeModal()">✕</button></div>
            <div class="eq-modal-section" style="display:flex;gap:.75rem;align-items:center">
                <div style="width:56px;height:56px;border-radius:10px;overflow:hidden;background:rgba(255,255,255,.04);display:flex;align-items:center;justify-content:center">${u && u.photos && u.photos.length ? `<img src="${u.photos[0]}" style="width:100%;height:100%;object-fit:cover">` : `<span style="font-size:1.5rem">${getCatIcon(u ? u.category : '')}</span>`}</div>
                <div><div style="font-weight:700;color:#f1f5f9">${u ? esc(u.title) : ''}</div><div style="font-size:.85rem;color:#a78bfa;font-weight:700">${getPricingLabel(l)}</div></div>
            </div>
            <div class="eq-modal-section"><div class="eq-grid-2">
                <div><label class="eq-section-label">Дата начала</label><input type="date" class="eq-input" id="eqBkDate"></div>
                ${_bookingFieldsFor(l.pricingMode, p)}
            </div></div>
            <div class="eq-modal-section"><label class="eq-section-label">Адрес работ</label><input class="eq-input" id="eqBkAddr" placeholder="г. Алматы, ул. Абая 1"></div>
            <div class="eq-modal-section"><label class="eq-section-label">Комментарий</label><textarea class="eq-input" id="eqBkComment" rows="2" placeholder="Ваши пожелания..."></textarea></div>
            <input type="hidden" id="eqBkListingId" value="${listingId}">
            <div id="eqBkEst" style="text-align:center;color:#a78bfa;font-weight:700;margin-top:.5rem"></div>
            <div style="text-align:center;font-size:.75rem;color:rgba(255,255,255,.35);margin-top:.3rem">⚠️ Финальная стоимость подтверждается владельцем.</div>
            <div class="eq-modal-footer"><button class="eq-btn-sm" onclick="EquipmentModule.closeModal()">Отмена</button><button class="eq-cta" onclick="EquipmentModule._saveBooking()">📨 Отправить заявку</button></div>
        </div>`;
        const _upd = () => { const est = document.getElementById('eqBkEst'); if (est) est.textContent = _calcBookingEst(l); };
        ['eqBkQty', 'eqBkKm'].forEach(id => { const el = document.getElementById(id); if (el) el.addEventListener('input', _upd); });
        const dc = document.getElementById('eqBkDispatch'); if (dc) dc.addEventListener('change', _upd);
    }

    function openDetail(listingId) {
        const l = listings.find(x => x.id === listingId); if (!l) return;
        const u = units.find(x => x.id === l.unitId); if (!u) return;
        const pm = getPM(l.pricingMode);
        const sub = findSub(u.category, u.subcategory);
        const ov = document.getElementById('eqModalOverlay'); ov.hidden = false;
        ov.innerHTML = `<div class="eq-modal" style="max-width:700px">
            <div class="eq-modal-title"><span>${esc(u.title)}</span><button class="eq-modal-close" onclick="EquipmentModule.closeModal()">✕</button></div>
            <div class="eq-gallery-main">${u.photos && u.photos.length ? `<img src="${u.photos[0]}" id="eqDetailImg">` : `<div style="font-size:4rem;opacity:.1">${getCatIcon(u.category)}</div>`}</div>
            ${u.photos && u.photos.length > 1 ? `<div class="eq-gallery-thumbs">${u.photos.map((p, i) => `<img src="${p}" class="${i === 0 ? 'active' : ''}" onclick="document.getElementById('eqDetailImg').src='${p}';this.parentElement.querySelectorAll('img').forEach(im=>im.classList.remove('active'));this.classList.add('active')">`).join('')}</div>` : ''}
            <div class="eq-modal-section" style="margin-top:1rem">
                <div style="font-size:1.15rem;font-weight:800;color:#a78bfa">${getPricingLabel(l)}</div>
                <div class="eq-card-badges" style="margin-top:.5rem">
                    <span class="eq-badge eq-badge-blue" style="font-size:.7rem">${pm.icon} ${pm.filterLabel}</span>
                    ${statusBadge(u.status, STATUSES)}
                    ${l.withOperator ? '<span class="eq-badge eq-badge-blue">👷 С оператором</span>' : ''}
                    ${l.delivery !== 'none' ? `<span class="eq-badge eq-badge-purple">🚚 ${l.delivery === 'included' ? 'Доставка включена' : 'Платная доставка'}</span>` : ''}
                    ${l.availability && l.availability.availableToday ? '<span class="eq-badge eq-badge-green eq-badge-pulse">✅ Доступно сегодня</span>' : ''}
                    <span class="eq-badge eq-badge-gray">📍 ${esc(u.city)}</span>
                </div>
            </div>
            ${sub && sub.specs.length && u.specs ? `<div class="eq-modal-section"><div class="eq-modal-section-title">📐 Характеристики</div><div class="eq-specs">${sub.specs.map(s => u.specs[s.key] != null && u.specs[s.key] !== '' ? `<div class="eq-spec-item"><span class="label">${s.label}</span><span class="value">${u.specs[s.key]} ${s.unit}</span></div>` : '').join('')}</div></div>` : ''}
            ${l.description ? `<div class="eq-modal-section"><div class="eq-modal-section-title">📝 Описание</div><div style="color:rgba(255,255,255,.6);font-size:.88rem">${esc(l.description)}</div></div>` : ''}
            <div class="eq-modal-section" style="text-align:center"><button class="eq-cta" style="width:100%" onclick="EquipmentModule.closeModal();EquipmentModule.openBookingModal('${l.id}')">📝 Забронировать</button></div>
        </div>`;
    }

    // ─── SAVE HANDLERS ───
    function _saveUnit() {
        const mode = document.getElementById('eqUnitMode').value; const id = document.getElementById('eqUnitId').value;
        const title = document.getElementById('eqUnitTitle').value.trim(); const city = document.getElementById('eqUnitCity').value;
        const cat = document.getElementById('eqUnitCat').value; const sub = document.getElementById('eqUnitSub').value;
        if (!title || !cat || !sub) { if (window.showToast) window.showToast('⚠️ Заполните название, категорию и подкатегорию'); return; }
        const subObj = findSub(cat, sub); const specs = {};
        if (subObj && subObj.specs) subObj.specs.forEach(s => { const el = document.getElementById('eqSpec_' + s.key); if (el && el.value) specs[s.key] = parseFloat(el.value); });
        const user = getCurrentUser(); const existing = mode === 'edit' ? units.find(u => u.id === id) : null;
        const d = { id: mode === 'edit' ? id : genId(), ownerId: user.id, ownerType: user.type, title, category: cat, subcategory: sub, city, year: parseInt(document.getElementById('eqUnitYear').value) || null, condition: document.getElementById('eqUnitCond').value, status: document.getElementById('eqUnitStatus').value, photos: [..._tempPhotos], specs, createdAt: existing ? existing.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() };
        if (mode === 'edit') { const idx = units.findIndex(u => u.id === id); if (idx > -1) units[idx] = d; } else units.push(d);
        saveAll(); _tempPhotos = []; closeModal(); render(); if (window.showToast) window.showToast('✅ Техника сохранена!');
    }
    function _saveListing() {
        const unitId = document.getElementById('eqLstUnitId').value; const lid = document.getElementById('eqLstId').value;
        const price = parseFloat(document.getElementById('eqLstPrice').value);
        if (!price || price <= 0) { if (window.showToast) window.showToast('⚠️ Укажите цену'); return; }
        const existing = lid ? listings.find(l => l.id === lid) : null;
        const mode = document.getElementById('eqLstPM').value;
        const pricing = { price };
        if (mode === 'HOUR') { pricing.minHours = parseInt((document.getElementById('eqLstMinH') || {}).value) || null; pricing.waitingPricePerHour = parseInt((document.getElementById('eqLstWait') || {}).value) || null; }
        if (mode === 'SHIFT') { pricing.shiftHours = parseInt((document.getElementById('eqLstShiftH') || {}).value) || 8; pricing.waitingPricePerHour = parseInt((document.getElementById('eqLstWait') || {}).value) || null; }
        if (mode === 'TRIP') { pricing.minTrips = parseInt((document.getElementById('eqLstMinTrips') || {}).value) || null; pricing.includedKm = parseInt((document.getElementById('eqLstInclKm') || {}).value) || null; pricing.extraKmPrice = parseInt((document.getElementById('eqLstExtraKm') || {}).value) || null; }

        const d = { id: lid || genId(), unitId, isActive: true, pricingMode: mode, pricing, withOperator: document.getElementById('eqLstOp').checked, delivery: document.getElementById('eqLstDel').value, deliveryRules: document.getElementById('eqLstDel').value === 'paid' ? { basePrice: 5000 } : null, radiusKm: parseInt(document.getElementById('eqLstRad').value) || 50, availability: { availableToday: document.getElementById('eqLstToday').checked }, description: document.getElementById('eqLstDesc').value.trim(), createdAt: existing ? existing.createdAt : new Date().toISOString(), updatedAt: new Date().toISOString() };
        if (existing) { const idx = listings.findIndex(l => l.id === lid); if (idx > -1) listings[idx] = d; } else listings.push(d);
        saveAll(); closeModal(); render(); if (window.showToast) window.showToast('✅ Объявление опубликовано!');
    }
    function _saveBooking() {
        const lid = document.getElementById('eqBkListingId').value; const dateFrom = document.getElementById('eqBkDate').value;
        const qty = parseInt((document.getElementById('eqBkQty') || {}).value) || 0;
        if (!qty && !dateFrom) { if (window.showToast) window.showToast('⚠️ Укажите дату и количество'); return; }
        const l = listings.find(x => x.id === lid); const user = getCurrentUser();
        const estText = l ? _calcBookingEst(l) : '';
        const estNum = estText ? parseInt(estText.replace(/[^0-9]/g, '')) : null;
        bookings.push({ id: genId(), listingId: lid, unitId: l ? l.unitId : '', renterId: user.id, renterType: user.type, workAddress: document.getElementById('eqBkAddr').value.trim(), dateFrom, hoursCount: qty || null, comment: document.getElementById('eqBkComment').value.trim(), status: 'new', totalPriceEstimate: estNum, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
        saveAll(); closeModal(); render(); if (window.showToast) window.showToast('✅ Заявка отправлена!');
    }

    // ─── EVENTS ───
    function bindEvents() {
        const s = document.getElementById('eqSearch'); if (s) s.addEventListener('input', function () { filters.search = this.value; refreshGrid(); });
        const fc = document.getElementById('eqFCat'); if (fc) fc.addEventListener('change', function () { filters.category = this.value; refreshGrid(); });
        const fcy = document.getElementById('eqFCity'); if (fcy) fcy.addEventListener('change', function () { filters.city = this.value; refreshGrid(); });
        const fr = document.getElementById('eqFRadius'); if (fr) fr.addEventListener('input', function () { filters.radiusKm = parseInt(this.value); document.getElementById('eqRadiusVal').textContent = this.value + ' км'; });
        const ff = document.getElementById('eqFFree'); if (ff) ff.addEventListener('change', function () { filters.onlyFree = this.checked; refreshGrid(); });
        const fo = document.getElementById('eqFOp'); if (fo) fo.addEventListener('change', function () { filters.withOp = this.checked; refreshGrid(); });
        const fp = document.getElementById('eqFPrice'); if (fp) fp.addEventListener('input', function () { filters.priceMax = parseInt(this.value); document.getElementById('eqPriceVal').textContent = this.value >= 100000 ? '∞' : Number(this.value).toLocaleString('ru') + '₸'; refreshGrid(); });
        document.querySelectorAll('input[name="eqDel"]').forEach(r => r.addEventListener('change', function () { filters.delivery = this.value; refreshGrid(); }));
        document.querySelectorAll('input[name="eqPM"]').forEach(r => r.addEventListener('change', function () { filters.pricingMode = this.value; refreshGrid(); }));
    }
    function refreshGrid() {
        const filtered = getFiltered();
        const cnt = document.querySelector('.eq-count'); if (cnt) cnt.textContent = 'Найдено: ' + filtered.length;
        const grid = document.querySelector('.eq-layout > div:last-child');
        if (grid) grid.innerHTML = renderCatPills() + (filtered.length === 0 ? `<div class="eq-empty"><div class="eq-empty-icon">🔍</div><div class="eq-empty-text">Объявления не найдены</div></div>` : `<div class="eq-grid">${filtered.map(l => renderCard(l)).join('')}</div>`);
        const cta = document.querySelector('.eq-sidebar-cta'); if (cta) { const n = filtered.length; cta.textContent = `Показать ${n} объявлени${n === 1 ? 'е' : n < 5 ? 'я' : 'й'}`; }
    }

    // ─── PUBLIC API ───
    window.EquipmentModule = {
        render,
        openTab: function (t) { activeTab = t; render(); },
        openUnitModal, openListingModal, openBookingModal, openDetail, closeModal,
        _saveUnit, _saveListing, _saveBooking,
        _setCat: function (c) { filters.category = c; const sel = document.getElementById('eqFCat'); if (sel) sel.value = c; refreshGrid(); },
        _applyFilters: function () { refreshGrid(); },
        _onCatChange: function () { const cat = document.getElementById('eqUnitCat').value; const sub = document.getElementById('eqUnitSub'); const c = findCat(cat); sub.innerHTML = '<option value="">— Выберите —</option>' + (c ? c.subs.map(s => `<option value="${s.id}">${s.label}</option>`).join('') : ''); document.getElementById('eqSpecsContainer').innerHTML = ''; },
        _onSubChange: function () { const cat = document.getElementById('eqUnitCat').value; const sub = document.getElementById('eqUnitSub').value; const s = findSub(cat, sub); document.getElementById('eqSpecsContainer').innerHTML = s ? renderSpecsFields(s.specs, {}) : ''; },
        _onPMChange: function () { const mode = document.getElementById('eqLstPM').value; const c = document.getElementById('eqLstPricingFields'); if (c) c.innerHTML = _renderPricingFields(mode, {}); },
        _removeUnitPhoto: function (i) { _tempPhotos.splice(i, 1); const grid = document.getElementById('eqUnitPhotos'); if (grid) grid.innerHTML = _tempPhotos.map((p, j) => `<div class="eq-photo-thumb"><img src="${p}"><button onclick="EquipmentModule._removeUnitPhoto(${j})">✕</button></div>`).join(''); },
        _deleteUnit: async function (id) { const ok = await (window.QazUI?.confirm || window.confirm)('Удалить технику?', 'Техника и все связанные объявления будут удалены', { icon: '🚜', danger: true, confirmText: 'Удалить' }); if (!ok) return; units = units.filter(u => u.id !== id); listings = listings.filter(l => l.unitId !== id); saveAll(); render(); if (window.showToast) window.showToast('🗑️ Техника удалена'); },
        _deactivateListing: function (uid) { listings.forEach(l => { if (l.unitId === uid) l.isActive = false; }); saveAll(); render(); },
        _toggleListingActive: function (id) { const l = listings.find(x => x.id === id); if (l) { l.isActive = !l.isActive; saveAll(); render(); } },
        _setBookingStatus: function (id, st) { const b = bookings.find(x => x.id === id); if (b) { b.status = st; b.updatedAt = new Date().toISOString(); saveAll(); render(); if (window.showToast) window.showToast('✅ Статус обновлён'); } }
    };
    console.log('✅ EquipmentModule v2 loaded');
})();
