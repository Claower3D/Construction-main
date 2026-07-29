// ========== EXECUTOR PROFILE UI ==========
// Анкета исполнителя — QazGost AI
(function () {
    'use strict';

    // ─── DICTIONARIES ───
    const SERVICE_CATS = [
        { id: 'plumbing', label: 'Сантехника', icon: '🔧' },
        { id: 'electrical', label: 'Электрика', icon: '⚡' },
        { id: 'painting', label: 'Малярные работы', icon: '🎨' },
        { id: 'tiling', label: 'Плиточные работы', icon: '🏗️' },
        { id: 'flooring', label: 'Напольные покрытия', icon: '🪵' },
        { id: 'drywall', label: 'Гипсокартон', icon: '📐' },
        { id: 'roofing', label: 'Кровля', icon: '🏠' },
        { id: 'windows', label: 'Окна/Двери', icon: '🪟' },
        { id: 'hvac', label: 'Отопление/Вентиляция', icon: '❄️' },
        { id: 'demolition', label: 'Демонтаж', icon: '💥' },
        { id: 'finishing', label: 'Отделка под ключ', icon: '✨' },
        { id: 'welding', label: 'Сварочные работы', icon: '🔥' },
        { id: 'concrete', label: 'Бетонные работы', icon: '🧱' },
        { id: 'landscaping', label: 'Благоустройство', icon: '🌳' },
        { id: 'other', label: 'Другое', icon: '📦' }
    ];

    const SUB_TAGS = {
        plumbing: ['Установка', 'Ремонт', 'Канализация', 'Водопровод', 'Отопление', 'Бойлеры'],
        electrical: ['Проводка', 'Щиты', 'Розетки', 'Освещение', 'Слаботочка', 'Заземление'],
        painting: ['Стены', 'Потолки', 'Фасады', 'Декоративная', 'Текстурная'],
        tiling: ['Пол', 'Стены', 'Мозаика', 'Керамогранит', 'Мрамор'],
        flooring: ['Ламинат', 'Паркет', 'Линолеум', 'Наливной пол', 'Стяжка'],
        drywall: ['Перегородки', 'Потолки', 'Ниши', 'Арки', 'Короба'],
        roofing: ['Металлочерепица', 'Мягкая кровля', 'Профнастил', 'Ремонт', 'Водосток'],
        windows: ['Пластиковые', 'Алюминиевые', 'Деревянные', 'Входные двери', 'Межкомнатные'],
        hvac: ['Радиаторы', 'Тёплый пол', 'Кондиционеры', 'Вентиляция', 'Котлы'],
        demolition: ['Стен', 'Полов', 'Перекрытий', 'Фасадов', 'Вывоз мусора'],
        finishing: ['Квартиры', 'Дома', 'Офисы', 'Коммерческие', 'Дизайн-проект'],
        welding: ['Металлоконструкции', 'Ворота', 'Решётки', 'Перила', 'Трубопроводы'],
        concrete: ['Фундамент', 'Стены', 'Перекрытия', 'Отмостка', 'Монолит'],
        landscaping: ['Дорожки', 'Заборы', 'Газон', 'Дренаж', 'Полив']
    };

    const CITIES_KZ = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 'Тараз', 'Павлодар', 'Семей', 'Атырау', 'Костанай', 'Петропавловск', 'Уральск', 'Усть-Каменогорск', 'Кызылорда', 'Актау', 'Туркестан', 'Талдыкорган', 'Кокшетау', 'Темиртау', 'Экибастуз'];
    const RADIUS_OPTIONS = [0, 10, 20, 50, 100, 200];
    const TEAM_ROLES = ['Прораб', 'Инженер', 'Сметчик', 'Бухгалтер', 'Снабженец', 'Мастер', 'Электрик', 'Сантехник', 'Отделочник'];
    const EQUIP_CATS = ['Транспорт', 'Инструмент', 'Спецтехника', 'Оборудование'];
    const CAPABILITIES_LIST = [
        { id: 'engineering', label: 'Инженерные работы' },
        { id: 'estimation', label: 'Сметчик / сметный отдел' },
        { id: 'accounting', label: 'Бухгалтерия / документы' },
        { id: 'supply', label: 'Снабжение / закуп / доставка' },
        { id: 'supervision', label: 'Технадзор' }
    ];

    // ─── DEFAULT STATE ───
    const PROFILE_ID_KEY = 'executorProfileId';
    function _getOrCreateProfileId() {
        let id = localStorage.getItem(PROFILE_ID_KEY);
        if (!id) {
            id = 'ep_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(PROFILE_ID_KEY, id);
        }
        return id;
    }

    function defaultProfile() {
        return {
            id: _getOrCreateProfileId(),
            avatarUrl: '', rating: 0,
            nameOrCompany: '', phone: '', email: '', about: '',
            orgType: '', // TOO | IP | PRIVATE
            companyName: '', bin: '', legalAddress: '', directorName: '',
            services: [], serviceTags: {}, customTags: [],
            country: 'KZ', city: '',
            serviceZones: [], radiusKm: '', intercity: false,
            availability: { acceptOrders: false, status: '', startWhen: '', schedule: [] },
            terms: { priceLevel: '', minOrder: '', warrantyMonths: '', payments: [] },
            company: {
                hasTeam: false, teamCount: '', teamSpecialties: [], teamRoles: [],
                employees: [],
                equipment: [],
                capabilities: []
            },
            portfolioPhotos: [],
            completionPercent: 0, updatedAt: '', createdAt: ''
        };
    }

    let P = defaultProfile();
    let companyTab = 'team';

    // ─── LOAD / SAVE ───
    function load() {
        try {
            const s = localStorage.getItem('executorProfile');
            if (s) {
                const d = JSON.parse(s); P = {
                    ...defaultProfile(), ...d,
                    availability: { ...defaultProfile().availability, ...(d.availability || {}) },
                    terms: { ...defaultProfile().terms, ...(d.terms || {}) },
                    company: { ...defaultProfile().company, ...(d.company || {}) }
                };
                // Ensure profile has a stable ID (backward compat)
                if (!P.id) {
                    P.id = _getOrCreateProfileId();
                }
            }
        } catch (e) { console.warn('[EP] load error', e); }
    }
    function save() {
        P.updatedAt = new Date().toISOString();
        if (!P.createdAt) P.createdAt = P.updatedAt;
        P.completionPercent = computeCompleteness();

        let savedOk = false;

        // 1. Try DataService (API) first
        try {
            if (window.DataService && typeof window.DataService.saveExecutorProfile === 'function') {
                window.DataService.saveExecutorProfile(JSON.parse(JSON.stringify(P)));
                savedOk = true;
                console.log('[EP] ✅ Saved via DataService');
            }
        } catch (apiErr) {
            console.warn('[EP] DataService save failed, falling back to localStorage:', apiErr);
        }

        // 2. Always save to localStorage as fallback / cache
        try {
            localStorage.setItem('executorProfile', JSON.stringify(P));
            savedOk = true;
        } catch (storageErr) {
            console.error('[EP] ❌ localStorage save failed:', storageErr);
            // Attempt to free space by trimming old portfolio photos
            if (storageErr.name === 'QuotaExceededError' || storageErr.code === 22) {
                try {
                    const trimmed = { ...P, portfolioPhotos: P.portfolioPhotos.slice(0, 3) };
                    localStorage.setItem('executorProfile', JSON.stringify(trimmed));
                    savedOk = true;
                    console.warn('[EP] ⚠️ Saved with trimmed portfolio to fit localStorage quota');
                } catch (retryErr) {
                    console.error('[EP] ❌ Retry save also failed:', retryErr);
                }
            }
        }

        if (!savedOk) {
            if (window.showToast) window.showToast('⚠️ Не удалось сохранить анкету. Попробуйте позже.');
        }

        return savedOk;
    }

    // ─── CATALOG SYNC ───
    function syncToCatalog() {
        load(); // Refresh profile data from localStorage
        try {
            if (window.CatalogService && window.CatalogModels) {
                // Only sync if profile has minimum required data
                if (P.nameOrCompany.trim() && P.services.length > 0 && P.city) {
                    const entry = window.CatalogModels.createCatalogEntry(P);
                    window.CatalogService.Entries.upsert(entry);
                    console.log('[EP] ✅ Profile synced to catalog:', entry.name, '| id:', entry.id);
                    return true;
                } else {
                    console.log('[EP] ⏭️ Skipped catalog sync — profile incomplete (need name, services, city)');
                    return false;
                }
            } else {
                console.warn('[EP] ⚠️ CatalogService or CatalogModels not available');
                return false;
            }
        } catch (e) {
            console.error('[EP] Catalog sync error:', e);
            return false;
        }
    }


    // ─── COMPLETENESS ───
    function computeCompleteness() {
        let pts = 0, max = 100;
        // Required (70pts)
        if (P.nameOrCompany.trim().length >= 2) pts += 10;
        if (P.phone.trim().length >= 10) pts += 10;
        if (P.orgType) pts += 10;
        if (P.services.length > 0) pts += 10;
        if (P.city) pts += 10;
        if (P.radiusKm !== '' && P.radiusKm !== undefined) pts += 8;
        if (P.availability.acceptOrders) pts += 4;
        if (P.availability.status) pts += 4;
        if (P.availability.startWhen) pts += 4;
        // Optional (30pts)
        if (P.email) pts += 3;
        if (P.about.trim().length > 10) pts += 3;
        if (Object.keys(P.serviceTags).length > 0) pts += 3;
        if (P.portfolioPhotos.length >= 1) pts += 4;
        if (P.terms.priceLevel) pts += 2;
        if (P.terms.payments.length > 0) pts += 2;
        if (P.serviceZones.length > 0) pts += 2;
        if (P.availability.schedule.length > 0) pts += 2;
        if ((P.orgType === 'TOO' || P.orgType === 'IP') && P.company.hasTeam) pts += 3;
        if (P.company.equipment.length > 0) pts += 3;
        if (P.company.capabilities.length > 0) pts += 3;
        return Math.min(pts, max);
    }

    // ─── VALIDATION ───
    function validate() {
        const errs = [];
        if (!P.nameOrCompany.trim()) errs.push({ field: 'epName', msg: 'Укажите ФИО / организацию' });
        if (!P.phone.trim()) errs.push({ field: 'epPhone', msg: 'Укажите телефон' });
        if (!P.orgType) errs.push({ field: 'epOrgType', msg: 'Выберите тип организации' });
        if (P.services.length === 0) errs.push({ field: 'epServices', msg: 'Выберите хотя бы 1 услугу' });
        if (!P.city) errs.push({ field: 'epRegion', msg: 'Выберите город' });
        if (P.radiusKm === '' || P.radiusKm === undefined) errs.push({ field: 'epRegion', msg: 'Укажите радиус выезда' });
        if (!P.availability.acceptOrders) errs.push({ field: 'epAvail', msg: 'Включите «Принимаю заявки»' });
        if (!P.availability.status) errs.push({ field: 'epAvail', msg: 'Укажите статус' });
        if (!P.availability.startWhen) errs.push({ field: 'epAvail', msg: 'Укажите «Когда могу начать»' });
        // highlight
        document.querySelectorAll('.ep-card.ep-error').forEach(c => c.classList.remove('ep-error'));
        errs.forEach(e => {
            const el = document.getElementById(e.field);
            if (el) el.classList.add('ep-error');
        });
        if (errs.length > 0) {
            const first = document.getElementById(errs[0].field);
            if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
            if (window.showToast) window.showToast('⚠️ ' + errs[0].msg);
        }
        return errs.length === 0;
    }

    function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

    // ─── RENDER ───
    function render() {
        const root = document.getElementById('executorProfileRoot');
        if (!root) return;
        load();
        const pct = computeCompleteness();
        root.innerHTML = `<div class="ep-root">
        ${renderProgress(pct)}
        ${renderWarning(pct)}
        ${renderAvatar()}
        ${renderBasicInfo()}
        ${renderOrgType()}
        ${renderCompany()}
        ${renderServices()}
        ${renderRegion()}
        ${renderAvailability()}
        ${renderTerms()}
        ${renderPortfolio()}
        <div class="ep-save-bar">
            <button class="ep-save-btn" onclick="ExecutorProfileUI._save()">💾 Сохранить анкету</button>
        </div>
    </div>`;
        bindHandlers();
    }

    // ─── SECTIONS ───
    function renderProgress(pct) {
        const checks = [
            { ok: P.nameOrCompany.trim().length >= 2, label: 'ФИО', target: 'epBasic' },
            { ok: P.phone.trim().length >= 10, label: 'Телефон', target: 'epBasic' },
            { ok: !!P.orgType, label: 'Тип орг.', target: 'epOrgType' },
            { ok: P.services.length > 0, label: 'Услуги', target: 'epServices' },
            { ok: !!P.city, label: 'Город', target: 'epRegion' },
            { ok: P.radiusKm !== '' && P.radiusKm !== undefined, label: 'Радиус', target: 'epRegion' },
            { ok: P.availability.acceptOrders && P.availability.status && P.availability.startWhen, label: 'Доступность', target: 'epAvail' },
        ];
        return `<div class="ep-card ep-progress" id="epProgress">
        <div class="ep-progress-header">
            <div style="font-weight:700;font-size:.95rem;display:flex;align-items:center;gap:.5rem">📋 Готовность профиля</div>
            <div class="ep-progress-pct">${pct}%</div>
        </div>
        <div class="ep-progress-bar"><div class="ep-progress-fill" style="width:${pct}%"></div></div>
        <div class="ep-checklist">
            ${checks.map(c => `<div class="ep-check-item ${c.ok ? 'done' : ''}" onclick="document.getElementById('${c.target}').scrollIntoView({behavior:'smooth',block:'start'})"><span class="ep-dot"></span>${c.label}</div>`).join('')}
        </div>
    </div>`;
    }

    function renderWarning(pct) {
        if (pct >= 70) return '';
        return `<div style="padding:1rem;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:12px;margin-bottom:1.25rem">
        <span style="color:#f59e0b">⚠️ Заполните обязательные поля, чтобы получать заявки</span>
    </div>`;
    }

    function renderAvatar() {
        return `<div class="ep-card" style="text-align:center;padding:2rem">
        <div id="epAvatarWrap" style="width:120px;height:120px;border-radius:50%;overflow:hidden;border:3px solid rgba(139,92,246,0.4);margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;font-size:3rem;cursor:pointer;background:rgba(255,255,255,0.05);transition:.3s" onclick="document.getElementById('epAvatarInput').click()">
            <input type="file" id="epAvatarInput" accept="image/*" hidden>
            ${P.avatarUrl
                ? `<img src="${P.avatarUrl}" style="width:100%;height:100%;object-fit:cover">
                   <button onclick="event.stopPropagation();ExecutorProfileUI._removeAvatar()" style="position:absolute;top:2px;right:2px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(239,68,68,0.9);color:white;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</button>`
                : `<div style="text-align:center;color:var(--text-muted,#94a3b8)"><div style="font-size:2.5rem">👤</div></div>`}
        </div>
        <button onclick="document.getElementById('epAvatarInput').click()" style="padding:.5rem 1.5rem;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#f8fafc;cursor:pointer;font-family:inherit;font-size:.88rem">📷 Загрузить фото</button>
        <div style="margin-top:.75rem;color:rgba(255,255,255,0.45);font-size:.85rem">⭐ Рейтинг: <span>${P.rating || '—'}</span></div>
    </div>`;
    }

    function renderBasicInfo() {
        return `<div class="ep-card" id="epBasic">
        <div class="ep-title"><span class="ep-icon">📝</span> Основная информация</div>
        <div class="ep-grid cols-2">
            <div><label class="ep-label">ФИО / Организация <span class="ep-req">*</span></label>
                <input type="text" class="ep-input" id="epName" placeholder="Иванов Иван Иванович" value="${esc(P.nameOrCompany)}" data-field="nameOrCompany"></div>
            <div><label class="ep-label">Телефон <span class="ep-req">*</span></label>
                <input type="tel" class="ep-input" id="epPhone" placeholder="+7 (7XX) XXX-XX-XX" value="${esc(P.phone)}" data-field="phone"></div>
            <div><label class="ep-label">Email</label>
                <input type="email" class="ep-input" id="epEmail" placeholder="example@mail.com" value="${esc(P.email)}" data-field="email"></div>
            <div><label class="ep-label">О себе</label>
                <textarea class="ep-input" id="epAbout" rows="3" placeholder="Опыт, специализация, достижения..." data-field="about">${esc(P.about)}</textarea></div>
        </div>
    </div>`;
    }

    function renderOrgType() {
        const types = [{ v: 'TOO', l: '🏢 ТОО' }, { v: 'IP', l: '📋 ИП' }, { v: 'PRIVATE', l: '👤 Частное лицо' }];
        const showOrgFields = P.orgType === 'TOO' || P.orgType === 'IP';
        return `<div class="ep-card" id="epOrgType">
        <div class="ep-title"><span class="ep-icon">🏢</span> Тип организации <span class="ep-req">*</span></div>
        <div class="ep-radio-group">
            ${types.map(t => `<div class="ep-radio-card ${P.orgType === t.v ? 'active' : ''}" onclick="ExecutorProfileUI._setOrg('${t.v}')">
                <span class="ep-radio-dot"></span><span style="font-size:.95rem">${t.l}</span>
            </div>`).join('')}
        </div>
        ${showOrgFields ? `
        <div style="margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,0.06)">
            <div style="font-size:.88rem;font-weight:600;margin-bottom:1rem;color:rgba(255,255,255,0.7)">📄 Данные ${P.orgType === 'TOO' ? 'ТОО' : 'ИП'}</div>
            <div class="ep-grid cols-2">
                <div><label class="ep-label">Наименование ${P.orgType === 'TOO' ? 'ТОО' : 'ИП'} <span class="ep-req">*</span></label>
                    <input type="text" class="ep-input" id="epCompanyName" placeholder="${P.orgType === 'TOO' ? 'ТОО «Строй Мастер»' : 'ИП Иванов'}" value="${esc(P.companyName)}" data-field="companyName"></div>
                <div><label class="ep-label">${P.orgType === 'TOO' ? 'БИН' : 'ИИН'} <span class="ep-req">*</span></label>
                    <input type="text" class="ep-input" id="epBin" placeholder="${P.orgType === 'TOO' ? '12 цифр БИН' : '12 цифр ИИН'}" value="${esc(P.bin)}" data-field="bin" maxlength="12"></div>
                <div><label class="ep-label">Юридический адрес</label>
                    <input type="text" class="ep-input" id="epLegalAddr" placeholder="г. Алматы, ул. Абая 1, оф. 10" value="${esc(P.legalAddress)}" data-field="legalAddress"></div>
                <div><label class="ep-label">${P.orgType === 'TOO' ? 'Директор / Руководитель' : 'ФИО владельца'}</label>
                    <input type="text" class="ep-input" id="epDirector" placeholder="Иванов Иван Иванович" value="${esc(P.directorName)}" data-field="directorName"></div>
            </div>
        </div>` : ''}
    </div>`;
    }

    function renderServices() {
        return `<div class="ep-card" id="epServices">
        <div class="ep-title"><span class="ep-icon">🛠️</span> Услуги <span class="ep-req">*</span></div>
        <div class="ep-chips" style="margin-bottom:1rem">
            ${SERVICE_CATS.map(s => `<div class="ep-chip ${P.services.includes(s.id) ? 'active' : ''}" onclick="ExecutorProfileUI._toggleService('${s.id}')">
                <span>${s.icon}</span> ${s.label}
            </div>`).join('')}
        </div>
        ${renderSubTags()}
        <div style="margin-top:1rem">
            <label class="ep-label">Свои теги</label>
            <div style="display:flex;gap:.5rem">
                <input class="ep-input" id="epCustomTagInput" placeholder="Введите тег и нажмите +" style="flex:1">
                <button onclick="ExecutorProfileUI._addCustomTag()" style="padding:.5rem 1rem;border:none;border-radius:10px;background:rgba(139,92,246,0.2);color:#c4b5fd;cursor:pointer;font-size:1.1rem;font-family:inherit">+</button>
            </div>
            ${P.customTags.length > 0 ? `<div class="ep-chips" style="margin-top:.5rem">${P.customTags.map((t, i) => `<div class="ep-chip active" onclick="ExecutorProfileUI._removeCustomTag(${i})">${esc(t)} <span class="ep-chip-x">✕</span></div>`).join('')}</div>` : ''}
        </div>
    </div>`;
    }

    function renderSubTags() {
        const active = P.services.filter(s => SUB_TAGS[s]);
        if (active.length === 0) return '';
        return active.map(sid => {
            const cat = SERVICE_CATS.find(c => c.id === sid);
            const tags = SUB_TAGS[sid] || [];
            const sel = P.serviceTags[sid] || [];
            return `<div style="margin-bottom:.75rem">
            <div style="font-size:.82rem;color:rgba(255,255,255,0.5);margin-bottom:.35rem">${cat ? cat.icon : ''} ${cat ? cat.label : sid}:</div>
            <div class="ep-chips">${tags.map(t => `<div class="ep-chip ${sel.includes(t) ? 'active' : ''}" onclick="ExecutorProfileUI._toggleSubTag('${sid}','${t}')" style="font-size:.78rem;padding:.35rem .7rem">${t}</div>`).join('')}</div>
        </div>`;
        }).join('');
    }

    function renderRegion() {
        return `<div class="ep-card" id="epRegion">
        <div class="ep-title"><span class="ep-icon">🌍</span> Регион работы <span class="ep-req">*</span></div>
        <div class="ep-grid cols-2">
            <div><label class="ep-label">Страна</label>
                <select class="ep-input" id="epCountry" data-field="country">
                    <option value="KZ" ${P.country === 'KZ' ? 'selected' : ''}>🇰🇿 Казахстан</option>
                    <option value="RU" ${P.country === 'RU' ? 'selected' : ''}>🇷🇺 Россия</option>
                    <option value="BY" ${P.country === 'BY' ? 'selected' : ''}>🇧🇾 Беларусь</option>
                    <option value="UZ" ${P.country === 'UZ' ? 'selected' : ''}>🇺🇿 Узбекистан</option>
                    <option value="KG" ${P.country === 'KG' ? 'selected' : ''}>🇰🇬 Кыргызстан</option>
                </select></div>
            <div><label class="ep-label">Город / Регион <span class="ep-req">*</span></label>
                <select class="ep-input" id="epCity" data-field="city">
                    <option value="">Выберите город</option>
                    ${CITIES_KZ.map(c => `<option value="${c}" ${P.city === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select></div>
        </div>
        <div style="margin-top:1.25rem">
            <label class="ep-label">Сервисные зоны (до 20)</label>
            <div class="ep-chips">${CITIES_KZ.map(c => `<div class="ep-chip ${P.serviceZones.includes(c) ? 'active' : ''}" onclick="ExecutorProfileUI._toggleZone('${c}')" style="font-size:.78rem;padding:.35rem .7rem">${c}</div>`).join('')}</div>
        </div>
        <div style="margin-top:1.25rem">
            <label class="ep-label">Радиус выезда (км) <span class="ep-req">*</span></label>
            <div class="ep-segmented">
                ${RADIUS_OPTIONS.map(r => `<button class="ep-seg-btn ${P.radiusKm === r ? 'active' : ''}" onclick="ExecutorProfileUI._setRadius(${r})">${r === 0 ? 'На месте' : r + ' км'}</button>`).join('')}
            </div>
        </div>
        <div style="margin-top:1rem" class="ep-toggle-wrap" onclick="ExecutorProfileUI._toggleField('intercity')">
            <div class="ep-toggle ${P.intercity ? 'on' : ''}"></div>
            <div class="ep-toggle-label">Работаю межгород / область</div>
        </div>
    </div>`;
    }

    function renderAvailability() {
        const statuses = [{ v: 'free', l: '🟢 Свободен' }, { v: 'partial', l: '🟡 Частично занят' }, { v: 'busy', l: '🔴 Занят' }];
        const starts = ['Сегодня', 'Неделя', 'Месяц'];
        const scheds = [{ v: 'weekdays', l: 'Будни' }, { v: 'weekends', l: 'Выходные' }, { v: 'urgent', l: 'Срочные' }];
        return `<div class="ep-card" id="epAvail">
        <div class="ep-title"><span class="ep-icon">📅</span> Доступность <span class="ep-req">*</span></div>
        <div class="ep-toggle-wrap" onclick="ExecutorProfileUI._toggleAvail('acceptOrders')" style="margin-bottom:1.25rem">
            <div class="ep-toggle ${P.availability.acceptOrders ? 'on' : ''}"></div>
            <div class="ep-toggle-label" style="font-weight:600">Принимаю заявки</div>
        </div>
        <div style="margin-bottom:1.25rem">
            <label class="ep-label">Статус <span class="ep-req">*</span></label>
            <div class="ep-radio-group">
                ${statuses.map(s => `<div class="ep-radio-card ${P.availability.status === s.v ? 'active' : ''}" onclick="ExecutorProfileUI._setAvailField('status','${s.v}')">
                    <span class="ep-radio-dot"></span><span style="font-size:.88rem">${s.l}</span>
                </div>`).join('')}
            </div>
        </div>
        <div style="margin-bottom:1.25rem">
            <label class="ep-label">Когда могу начать <span class="ep-req">*</span></label>
            <div class="ep-segmented">
                ${starts.map(s => `<button class="ep-seg-btn ${P.availability.startWhen === s ? 'active' : ''}" onclick="ExecutorProfileUI._setAvailField('startWhen','${s}')">${s}</button>`).join('')}
            </div>
        </div>
        <div>
            <label class="ep-label">График работы</label>
            <div style="display:flex;gap:.75rem;flex-wrap:wrap">
                ${scheds.map(s => `<label class="ep-checkbox ${P.availability.schedule.includes(s.v) ? 'active' : ''}">
                    <input type="checkbox" ${P.availability.schedule.includes(s.v) ? 'checked' : ''} onchange="ExecutorProfileUI._toggleSchedule('${s.v}')"> ${s.l}
                </label>`).join('')}
            </div>
        </div>
    </div>`;
    }

    function renderTerms() {
        const levels = [{ v: 'economy', l: '💰 Эконом' }, { v: 'standard', l: '⚖️ Стандарт' }, { v: 'premium', l: '💎 Премиум' }];
        const warranties = ['', '1', '3', '6', '12'];
        const pays = [{ v: 'cash', l: 'Наличные' }, { v: 'transfer', l: 'Перевод' }, { v: 'card', l: 'Карта' }, { v: 'invoice', l: 'Безнал' }];
        return `<div class="ep-card" id="epTerms">
        <div class="ep-title"><span class="ep-icon">📋</span> Условия <span class="ep-badge">рекомендуется</span></div>
        <div class="ep-grid cols-2">
            <div>
                <label class="ep-label">Уровень цен</label>
                <div class="ep-segmented" style="width:100%">
                    ${levels.map(l => `<button class="ep-seg-btn ${P.terms.priceLevel === l.v ? 'active' : ''}" onclick="ExecutorProfileUI._setTerm('priceLevel','${l.v}')" style="flex:1">${l.l}</button>`).join('')}
                </div>
            </div>
            <div><label class="ep-label">Минимальный заказ (₸)</label>
                <input type="number" class="ep-input" id="epMinOrder" placeholder="10 000" value="${P.terms.minOrder}" data-term="minOrder"></div>
        </div>
        <div class="ep-grid cols-2" style="margin-top:1rem">
            <div><label class="ep-label">Гарантия (мес.)</label>
                <select class="ep-input" id="epWarranty" data-term="warrantyMonths">
                    <option value="" ${!P.terms.warrantyMonths ? 'selected' : ''}>Нет</option>
                    ${warranties.filter(w => w).map(w => `<option value="${w}" ${P.terms.warrantyMonths === w ? 'selected' : ''}>${w} мес.</option>`).join('')}
                </select></div>
            <div><label class="ep-label">Способы оплаты</label>
                <div style="display:flex;gap:.5rem;flex-wrap:wrap">
                    ${pays.map(p => `<label class="ep-checkbox ${P.terms.payments.includes(p.v) ? 'active' : ''}" style="font-size:.82rem">
                        <input type="checkbox" ${P.terms.payments.includes(p.v) ? 'checked' : ''} onchange="ExecutorProfileUI._togglePayment('${p.v}')"> ${p.l}
                    </label>`).join('')}
                </div>
            </div>
        </div>
    </div>`;
    }

    function renderCompany() {
        if (P.orgType !== 'TOO' && P.orgType !== 'IP') return '';
        return `<div class="ep-card" id="epCompany">
        <div class="ep-title"><span class="ep-icon">🏗️</span> Компания</div>
        <div class="ep-tabs">
            <button class="ep-tab ${companyTab === 'team' ? 'active' : ''}" onclick="ExecutorProfileUI._setCompanyTab('team')">👥 Команда</button>
            <button class="ep-tab ${companyTab === 'equip' ? 'active' : ''}" onclick="ExecutorProfileUI._setCompanyTab('equip')">🔧 Техника</button>
            <button class="ep-tab ${companyTab === 'caps' ? 'active' : ''}" onclick="ExecutorProfileUI._setCompanyTab('caps')">⚡ Возможности</button>
        </div>
        <div class="ep-tab-content ${companyTab === 'team' ? 'active' : ''}" id="epTabTeam">${renderTeamTab()}</div>
        <div class="ep-tab-content ${companyTab === 'equip' ? 'active' : ''}" id="epTabEquip">${renderEquipTab()}</div>
        <div class="ep-tab-content ${companyTab === 'caps' ? 'active' : ''}" id="epTabCaps">${renderCapsTab()}</div>
    </div>`;
    }

    function renderTeamTab() {
        return `
    <div class="ep-toggle-wrap" onclick="ExecutorProfileUI._toggleCompanyField('hasTeam')" style="margin-bottom:1rem">
        <div class="ep-toggle ${P.company.hasTeam ? 'on' : ''}"></div>
        <div class="ep-toggle-label">Есть команда</div>
    </div>
    ${P.company.hasTeam ? `
    <div class="ep-grid cols-2" style="margin-bottom:1rem">
        <div><label class="ep-label">Кол-во сотрудников</label>
            <input type="number" class="ep-input" value="${P.company.teamCount}" placeholder="5" id="epTeamCount" data-company="teamCount"></div>
        <div><label class="ep-label">Специализации команды</label>
            <div class="ep-chips">${SERVICE_CATS.slice(0, 8).map(s => `<div class="ep-chip ${P.company.teamSpecialties.includes(s.id) ? 'active' : ''}" onclick="ExecutorProfileUI._toggleTeamSpec('${s.id}')" style="font-size:.78rem;padding:.3rem .6rem">${s.icon} ${s.label}</div>`).join('')}</div>
        </div>
    </div>
    <div>
        <label class="ep-label">Ключевые роли</label>
        <div style="display:flex;gap:.5rem;flex-wrap:wrap">
            ${TEAM_ROLES.map(r => `<label class="ep-checkbox ${P.company.teamRoles.includes(r) ? 'active' : ''}" style="font-size:.82rem">
                <input type="checkbox" ${P.company.teamRoles.includes(r) ? 'checked' : ''} onchange="ExecutorProfileUI._toggleTeamRole('${r}')"> ${r}
            </label>`).join('')}
        </div>
    </div>
    `: '<div class="ep-hint">💡 Включите «Есть команда» чтобы указать состав</div>'}`;
    }

    function renderEquipTab() {
        return `
    <div style="margin-bottom:1rem">
        ${P.company.equipment.map((eq, i) => `<div style="display:flex;gap:.5rem;align-items:center;margin-bottom:.5rem;padding:.6rem .8rem;background:rgba(255,255,255,0.03);border-radius:10px;border:1px solid rgba(255,255,255,0.06)">
            <span style="flex:1;font-size:.88rem">${esc(eq.name)} <span style="color:rgba(255,255,255,0.4);font-size:.78rem">(${eq.category}, ${eq.qty} шт., ${eq.owned ? 'Своя' : 'Аренда'})</span></span>
            <button onclick="ExecutorProfileUI._removeEquip(${i})" style="border:none;background:rgba(239,68,68,0.15);color:#f87171;border-radius:8px;padding:.3rem .6rem;cursor:pointer;font-size:.78rem">✕</button>
        </div>`).join('')}
    </div>
    <div class="ep-grid cols-2" style="gap:.5rem">
        <input class="ep-input" id="epEqName" placeholder="Название (напр. Экскаватор)" style="font-size:.85rem">
        <select class="ep-input" id="epEqCat" style="font-size:.85rem">
            ${EQUIP_CATS.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <input type="number" class="ep-input" id="epEqQty" placeholder="Кол-во" value="1" min="1" style="font-size:.85rem">
        <select class="ep-input" id="epEqOwned" style="font-size:.85rem">
            <option value="1">В наличии</option><option value="0">Аренда</option>
        </select>
    </div>
    <button onclick="ExecutorProfileUI._addEquip()" style="margin-top:.75rem;padding:.55rem 1.2rem;border:none;border-radius:10px;background:rgba(139,92,246,0.2);color:#c4b5fd;cursor:pointer;font-family:inherit;font-size:.88rem">➕ Добавить технику</button>`;
    }

    function renderCapsTab() {
        return `<div style="display:flex;flex-direction:column;gap:.5rem">
        ${CAPABILITIES_LIST.map(c => `<label class="ep-checkbox ${P.company.capabilities.includes(c.id) ? 'active' : ''}">
            <input type="checkbox" ${P.company.capabilities.includes(c.id) ? 'checked' : ''} onchange="ExecutorProfileUI._toggleCap('${c.id}')"> ${c.label}
        </label>`).join('')}
    </div>`;
    }

    function renderPortfolio() {
        return `<div class="ep-card" id="epPortfolio">
        <div class="ep-title"><span class="ep-icon">📸</span> Портфолио</div>
        <div class="ep-photo-upload" onclick="document.getElementById('epPortfolioInput').click()">
            <input type="file" id="epPortfolioInput" accept="image/*" multiple hidden>
            <div style="font-size:2rem">📷</div>
            <div style="color:rgba(255,255,255,0.55);font-size:.88rem">Добавьте фото ваших работ (до 10 шт.)</div>
        </div>
        <div class="ep-hint">💡 Рекомендуем 3–5 фото для доверия клиентов</div>
        ${P.portfolioPhotos.length > 0 ? `<div class="ep-photo-grid">${P.portfolioPhotos.map((p, i) => `<div class="ep-photo-thumb">
            <img src="${p}" alt="Фото ${i + 1}">
            <button class="ep-photo-rm" onclick="ExecutorProfileUI._removePortfolio(${i})">✕</button>
        </div>`).join('')}</div>
        <div style="color:rgba(255,255,255,0.4);font-size:.78rem;margin-top:.5rem">📷 ${P.portfolioPhotos.length} из 10 фото</div>` : ''}
    </div>`;
    }

    // ─── HANDLERS ───
    function bindHandlers() {
        // Text inputs auto-save
        document.querySelectorAll('.ep-root [data-field]').forEach(el => {
            el.addEventListener('input', function () { P[this.dataset.field] = this.value; save(); updateProgress(); });
        });
        // Term inputs
        document.querySelectorAll('.ep-root [data-term]').forEach(el => {
            el.addEventListener('input', function () { P.terms[this.dataset.term] = this.value; save(); });
            el.addEventListener('change', function () { P.terms[this.dataset.term] = this.value; save(); });
        });
        // Company inputs
        document.querySelectorAll('.ep-root [data-company]').forEach(el => {
            el.addEventListener('input', function () { P.company[this.dataset.company] = this.value; save(); });
        });
        // Select fields
        const countryEl = document.getElementById('epCountry');
        if (countryEl) countryEl.addEventListener('change', function () { P.country = this.value; save(); });
        const cityEl = document.getElementById('epCity');
        if (cityEl) cityEl.addEventListener('change', function () { P.city = this.value; save(); updateProgress(); });
        // Avatar
        const avInput = document.getElementById('epAvatarInput');
        if (avInput) avInput.addEventListener('change', handleAvatarUpload);
        // Portfolio
        const pfInput = document.getElementById('epPortfolioInput');
        if (pfInput) pfInput.addEventListener('change', handlePortfolioUpload);
    }

    function updateProgress() {
        const pct = computeCompleteness();
        const fill = document.querySelector('.ep-progress-fill');
        const pctEl = document.querySelector('.ep-progress-pct');
        if (fill) fill.style.width = pct + '%';
        if (pctEl) pctEl.textContent = pct + '%';
    }

    function handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
        if (file.size > 5 * 1024 * 1024) { if (window.showToast) window.showToast('⚠️ Макс. размер 5 МБ'); return; }
        const r = new FileReader();
        r.onload = function (ev) { P.avatarUrl = ev.target.result; save(); render(); if (window.showToast) window.showToast('✅ Фото загружено'); };
        r.readAsDataURL(file);
    }

    function handlePortfolioUpload(e) {
        const files = Array.from(e.target.files);
        if (P.portfolioPhotos.length + files.length > 10) { if (window.showToast) window.showToast('⚠️ Максимум 10 фото'); return; }
        let loaded = 0;
        files.forEach(f => {
            if (!f.type.startsWith('image/') || f.size > 10 * 1024 * 1024) return;
            const r = new FileReader();
            r.onload = function (ev) { P.portfolioPhotos.push(ev.target.result); loaded++; if (loaded === files.length) { save(); render(); } };
            r.readAsDataURL(f);
        });
    }

    // ─── PUBLIC API ───
    window.ExecutorProfileUI = {
        render: render,
        _save: function () {
            if (!validate()) return;
            save();
            // Sync to catalog on explicit save
            const synced = syncToCatalog();
            render();
            if (synced) {
                if (window.showToast) window.showToast('✅ Анкета сохранена и добавлена в каталог!');
            } else {
                if (window.showToast) window.showToast('✅ Анкета сохранена!');
            }
        },
        syncToCatalog: syncToCatalog,
        _setOrg: function (v) { P.orgType = v; save(); render(); },
        _toggleService: function (id) {
            const i = P.services.indexOf(id);
            if (i > -1) { P.services.splice(i, 1); delete P.serviceTags[id]; } else { P.services.push(id); }
            save(); render();
        },
        _toggleSubTag: function (cat, tag) {
            if (!P.serviceTags[cat]) P.serviceTags[cat] = [];
            const i = P.serviceTags[cat].indexOf(tag);
            if (i > -1) P.serviceTags[cat].splice(i, 1); else P.serviceTags[cat].push(tag);
            save(); render();
        },
        _addCustomTag: function () {
            const inp = document.getElementById('epCustomTagInput');
            if (!inp || !inp.value.trim()) return;
            P.customTags.push(inp.value.trim()); save(); render();
        },
        _removeCustomTag: function (i) { P.customTags.splice(i, 1); save(); render(); },
        _toggleZone: function (c) {
            const i = P.serviceZones.indexOf(c);
            if (i > -1) P.serviceZones.splice(i, 1);
            else if (P.serviceZones.length < 20) P.serviceZones.push(c);
            save(); render();
        },
        _setRadius: function (r) { P.radiusKm = r; save(); render(); },
        _toggleField: function (f) { P[f] = !P[f]; save(); render(); },
        _toggleAvail: function (f) { P.availability[f] = !P.availability[f]; save(); render(); },
        _setAvailField: function (f, v) { P.availability[f] = v; save(); render(); },
        _toggleSchedule: function (v) {
            const i = P.availability.schedule.indexOf(v);
            if (i > -1) P.availability.schedule.splice(i, 1); else P.availability.schedule.push(v);
            save(); render();
        },
        _setTerm: function (f, v) { P.terms[f] = v; save(); render(); },
        _togglePayment: function (v) {
            const i = P.terms.payments.indexOf(v);
            if (i > -1) P.terms.payments.splice(i, 1); else P.terms.payments.push(v);
            save(); render();
        },
        _setCompanyTab: function (t) { companyTab = t; render(); },
        _toggleCompanyField: function (f) { P.company[f] = !P.company[f]; save(); render(); },
        _toggleTeamSpec: function (id) {
            const i = P.company.teamSpecialties.indexOf(id);
            if (i > -1) P.company.teamSpecialties.splice(i, 1); else P.company.teamSpecialties.push(id);
            save(); render();
        },
        _toggleTeamRole: function (r) {
            const i = P.company.teamRoles.indexOf(r);
            if (i > -1) P.company.teamRoles.splice(i, 1); else P.company.teamRoles.push(r);
            save(); render();
        },
        _addEquip: function () {
            const name = document.getElementById('epEqName'), cat = document.getElementById('epEqCat'),
                qty = document.getElementById('epEqQty'), owned = document.getElementById('epEqOwned');
            if (!name || !name.value.trim()) { if (window.showToast) window.showToast('⚠️ Укажите название'); return; }
            P.company.equipment.push({ name: name.value.trim(), category: cat.value, qty: parseInt(qty.value) || 1, owned: owned.value === '1' });
            save(); render();
        },
        _removeEquip: function (i) { P.company.equipment.splice(i, 1); save(); render(); },
        _toggleCap: function (id) {
            const i = P.company.capabilities.indexOf(id);
            if (i > -1) P.company.capabilities.splice(i, 1); else P.company.capabilities.push(id);
            save(); render();
        },
        _removeAvatar: function () { P.avatarUrl = ''; save(); render(); },
        _removePortfolio: function (i) { P.portfolioPhotos.splice(i, 1); save(); render(); },
        getData: function () { return { ...P }; },
        getCompletion: computeCompleteness
    };

    console.log('✅ ExecutorProfileUI loaded');
})();
