// ========== CUSTOMER PROFILE UI ==========
// Анкета заказчика — QazGost AI
// Полная форма сбора информации о проекте и контактных данных

(function () {
    'use strict';

    // ========== STATE ==========
    let customerData = {
        // Личные данные
        avatar: '', // base64 фото профиля
        fullName: '',
        phone: '',
        email: '',
        city: '',
        address: '',
        // Тип клиента
        clientType: 'individual', // individual | company
        companyName: '',
        bin: '', // БИН/ИИН
        // Проект
        projectTypes: [],
        projectDescription: '',
        budgetMin: '',
        budgetMax: '',
        timeline: '',
        urgency: 'normal', // urgent | normal | flexible
        // Объект
        objectAddress: '',
        objectArea: '',
        objectFloors: '',
        // Фото
        photos: [],
        // VIP: Техника
        equipment: [], // [{id, title, category, qty, status, note}]
        // VIP: Бригады
        partners: [],  // [{id, title, kind, phone, tags, note}]
        // Мета
        isComplete: false,
        completionPercent: 0,
        createdAt: '',
        updatedAt: ''
    };

    // VIP checking
    function isVipUser() {
        try {
            if (window.CabinetModels && window.CabinetModels.VipLimits) {
                return window.CabinetModels.VipLimits.isVip(getCurrentUserId());
            }
        } catch (e) { }
        // Fallback: check localStorage
        return localStorage.getItem('vipPurchased') === 'true';
    }

    const EQ_CATEGORIES = [
        { id: 'transport', icon: '🚛', label: 'Транспорт' },
        { id: 'tool', icon: '🔧', label: 'Инструмент' },
        { id: 'heavy', icon: '🏗️', label: 'Спецтехника' },
        { id: 'equipment', icon: '⚙️', label: 'Оборудование' }
    ];

    const PARTNER_KINDS = [
        { id: 'crew', icon: '👷', label: 'Бригада' },
        { id: 'master', icon: '🧑‍🔧', label: 'Мастер' },
        { id: 'company', icon: '🏢', label: 'Компания' }
    ];

    let renderContainerId = 'customerProfileContent'; // default, VipUI can override

    const PROJECT_TYPES = [
        { id: 'house', icon: '🏠', label: 'Жилой дом' },
        { id: 'apartment', icon: '🏢', label: 'Квартира' },
        { id: 'office', icon: '🏬', label: 'Офис / Магазин' },
        { id: 'warehouse', icon: '🏭', label: 'Склад / Цех' },
        { id: 'foundation', icon: '🧱', label: 'Фундамент' },
        { id: 'roof', icon: '🏚️', label: 'Кровля' },
        { id: 'renovation', icon: '🔨', label: 'Ремонт' },
        { id: 'landscape', icon: '🌳', label: 'Благоустройство' },
        { id: 'fence', icon: '🚧', label: 'Забор / Ворота' },
        { id: 'pool', icon: '🏊', label: 'Бассейн / Баня' },
        { id: 'road', icon: '🛤️', label: 'Дорога / Площадка' },
        { id: 'other', icon: '📐', label: 'Другое' }
    ];

    const CITIES = [
        'Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе',
        'Тараз', 'Павлодар', 'Семей', 'Атырау', 'Костанай',
        'Усть-Каменогорск', 'Петропавловск', 'Кызылорда', 'Актау',
        'Туркестан', 'Кокшетау', 'Талдыкорган', 'Экибастуз', 'Другой'
    ];

    // ========== STORAGE ==========
    function loadProfile() {
        try {
            const userId = getCurrentUserId();
            const saved = localStorage.getItem(`customerQuestionnaire_${userId}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                customerData = { ...customerData, ...parsed };
            }
        } catch (e) {
            console.warn('⚠️ CustomerProfile: load error', e);
        }
    }

    function saveProfile() {
        try {
            const userId = getCurrentUserId();
            customerData.updatedAt = new Date().toISOString();
            if (!customerData.createdAt) {
                customerData.createdAt = customerData.updatedAt;
            }
            customerData.completionPercent = calculateCompletion();
            customerData.isComplete = customerData.completionPercent >= 80;
            localStorage.setItem(`customerQuestionnaire_${userId}`, JSON.stringify(customerData));

            // Также обновляем CustomerProfile модель если доступна
            if (window.CustomerProfile) {
                const cp = window.CustomerProfile.getOrCreate(userId);
                cp.name = customerData.fullName;
                cp.phone = customerData.phone;
                cp.city = customerData.city;
                cp.address = customerData.address;
                cp.type = customerData.clientType === 'company' ? 'company' : 'individual';
                cp.companyName = customerData.companyName;
                cp.inn = customerData.bin;
                cp.save();
            }
        } catch (e) {
            console.warn('⚠️ CustomerProfile: save error', e);
        }
    }

    function getCurrentUserId() {
        try {
            const sessionStr = localStorage.getItem('authSession');
            if (sessionStr) {
                const session = JSON.parse(sessionStr);
                return session.userId || 'guest';
            }
        } catch (e) { /* ignore */ }
        return localStorage.getItem('currentUserId') || 'guest';
    }

    // ========== COMPLETION CALCULATION ==========
    function calculateCompletion() {
        let filled = 0;
        let total = 5;

        if (customerData.fullName.trim().length >= 2) filled++;
        if (customerData.phone.trim().length >= 10) filled++;
        if (customerData.city) filled++;
        if (customerData.clientType) filled++;
        if (customerData.projectTypes.length > 0) filled++;

        return Math.round((filled / total) * 100);
    }

    // ========== RENDER ==========
    function render(targetId) {
        if (targetId) renderContainerId = targetId;
        const container = document.getElementById(renderContainerId);
        if (!container) return;

        loadProfile();

        const percent = calculateCompletion();

        container.innerHTML = `
            <div class="cust-profile">
                <!-- Progress -->
                <div class="cust-progress">
                    <div class="cust-progress-header">
                        <div class="cust-progress-title">
                            📋 Заполнение анкеты
                        </div>
                        <div class="cust-progress-percent">${percent}%</div>
                    </div>
                    <div class="cust-progress-bar">
                        <div class="cust-progress-fill" style="width:${percent}%"></div>
                    </div>
                    <div class="cust-progress-steps">
                        <div class="cust-step-dot ${customerData.fullName ? 'done' : (percent === 0 ? 'active' : '')}">
                            <span class="dot"></span> Контакты
                        </div>
                        <div class="cust-step-dot ${customerData.clientType ? 'done' : ''}">
                            <span class="dot"></span> Тип клиента
                        </div>
                        <div class="cust-step-dot ${customerData.projectTypes.length > 0 ? 'done' : ''}">
                            <span class="dot"></span> Проект
                        </div>
                        <div class="cust-step-dot ${percent >= 100 ? 'done' : ''}">
                            <span class="dot"></span> Готово
                        </div>
                    </div>
                </div>

                <!-- Section 1: Контактные данные -->
                <div class="cust-section">
                    <div class="cust-section-title">
                        <span class="icon">👤</span>
                        Контактные данные
                    </div>
                    <!-- Avatar upload -->
                    <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:1.5rem">
                        <div id="custAvatarWrap" style="position:relative;width:120px;height:120px;border-radius:50%;overflow:hidden;border:3px solid rgba(6,182,212,0.4);cursor:pointer;background:rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:center;transition:all 0.3s" onclick="document.getElementById('custAvatarInput').click()" onmouseover="this.style.borderColor='rgba(6,182,212,0.8)'" onmouseout="this.style.borderColor='rgba(6,182,212,0.4)'">
                            <input type="file" id="custAvatarInput" accept="image/*" hidden onchange="window.CustomerProfileUI._uploadAvatar(event)">
                            ${customerData.avatar
                ? `<img src="${customerData.avatar}" alt="Фото" style="width:100%;height:100%;object-fit:cover">
                                   <button onclick="event.stopPropagation(); window.CustomerProfileUI._removeAvatar()" style="position:absolute;top:2px;right:2px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(239,68,68,0.9);color:white;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.3)">✕</button>`
                : `<div style="text-align:center;color:var(--text-muted)">
                                       <div style="font-size:2rem">📷</div>
                                       <div style="font-size:0.7rem;margin-top:0.25rem">Загрузить фото</div>
                                   </div>`
            }
                        </div>
                        <div style="margin-top:0.5rem;font-size:0.78rem;color:var(--text-muted)">Фото профиля • JPG, PNG</div>
                    </div>
                    <div class="cust-form-grid cols-2">
                        <div class="cust-field">
                            <label>ФИО <span class="req">*</span></label>
                            <input type="text" class="cust-input" id="custFullName"
                                   placeholder="Иванов Иван Иванович"
                                   value="${escHtml(customerData.fullName)}"
                                   oninput="window.CustomerProfileUI._onInput('fullName', this.value)">
                        </div>
                        <div class="cust-field">
                            <label>Телефон <span class="req">*</span></label>
                            <input type="tel" class="cust-input" id="custPhone"
                                   placeholder="+7 (7XX) XXX-XX-XX"
                                   value="${escHtml(customerData.phone)}"
                                   oninput="window.CustomerProfileUI._onInput('phone', this.value)">
                        </div>
                        <div class="cust-field">
                            <label>Email</label>
                            <input type="email" class="cust-input" id="custEmail"
                                   placeholder="your@email.com"
                                   value="${escHtml(customerData.email)}"
                                   oninput="window.CustomerProfileUI._onInput('email', this.value)">
                        </div>
                        <div class="cust-field">
                            <label>Город <span class="req">*</span></label>
                            <select class="cust-input" id="custCity"
                                    onchange="window.CustomerProfileUI._onInput('city', this.value)">
                                <option value="">Выберите город</option>
                                ${CITIES.map(c => `<option value="${c}" ${customerData.city === c ? 'selected' : ''}>${c}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="cust-form-grid" style="margin-top:1rem">
                        <div class="cust-field">
                            <label>Адрес проживания</label>
                            <input type="text" class="cust-input" id="custAddress"
                                   placeholder="ул. Абая, д. 10, кв. 5"
                                   value="${escHtml(customerData.address)}"
                                   oninput="window.CustomerProfileUI._onInput('address', this.value)">
                        </div>
                    </div>
                </div>

                <!-- Section 2: Тип клиента -->
                <div class="cust-section">
                    <div class="cust-section-title">
                        <span class="icon">🏢</span>
                        Тип клиента
                    </div>
                    <div class="cust-type-selector">
                        <div class="cust-type-option ${customerData.clientType === 'individual' ? 'selected' : ''}"
                             onclick="window.CustomerProfileUI._setType('individual')">
                            <input type="radio" name="custType" value="individual" ${customerData.clientType === 'individual' ? 'checked' : ''}>
                            <span class="cust-type-radio"></span>
                            <div class="cust-type-info">
                                <div class="cust-type-name">👤 Физическое лицо</div>
                                <div class="cust-type-desc">Частный клиент</div>
                            </div>
                        </div>
                        <div class="cust-type-option ${customerData.clientType === 'company' ? 'selected' : ''}"
                             onclick="window.CustomerProfileUI._setType('company')">
                            <input type="radio" name="custType" value="company" ${customerData.clientType === 'company' ? 'checked' : ''}>
                            <span class="cust-type-radio"></span>
                            <div class="cust-type-info">
                                <div class="cust-type-name">🏢 Юридическое лицо</div>
                                <div class="cust-type-desc">ТОО, ИП, АО</div>
                            </div>
                        </div>
                    </div>
                    <div class="cust-company-fields ${customerData.clientType === 'company' ? 'visible' : ''}" id="custCompanyFields">
                        <div class="cust-form-grid cols-2">
                            <div class="cust-field">
                                <label>Название организации <span class="req">*</span></label>
                                <input type="text" class="cust-input" id="custCompanyName"
                                       placeholder="ТОО «Строй Инвест»"
                                       value="${escHtml(customerData.companyName)}"
                                       oninput="window.CustomerProfileUI._onInput('companyName', this.value)">
                            </div>
                            <div class="cust-field">
                                <label>БИН / ИИН</label>
                                <input type="text" class="cust-input" id="custBin"
                                       placeholder="123456789012"
                                       maxlength="12"
                                       value="${escHtml(customerData.bin)}"
                                       oninput="window.CustomerProfileUI._onInput('bin', this.value)">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 3: Тип проекта -->
                <div class="cust-section">
                    <div class="cust-section-title">
                        <span class="icon">📐</span>
                        Какой проект вас интересует? <span class="req">*</span>
                    </div>
                    <div class="cust-chips" id="custProjectChips">
                        ${PROJECT_TYPES.map(pt => `
                            <div class="cust-chip ${customerData.projectTypes.includes(pt.id) ? 'active' : ''}"
                                 onclick="window.CustomerProfileUI._toggleChip('${pt.id}')">
                                <span class="chip-icon">${pt.icon}</span>
                                ${pt.label}
                            </div>
                        `).join('')}
                    </div>
                    <div class="cust-form-grid" style="margin-top:1.25rem">
                        <div class="cust-field">
                            <label>Опишите ваш проект</label>
                            <textarea class="cust-input" id="custProjectDesc" rows="3"
                                      placeholder="Хотим построить двухэтажный дом 120 м² с гаражом. Земельный участок в р-не Бесагаш..."
                                      oninput="window.CustomerProfileUI._onInput('projectDescription', this.value)">${escHtml(customerData.projectDescription)}</textarea>
                        </div>
                    </div>
                    <div class="cust-hint">
                        💡 Чем подробнее описание — тем точнее будет расчёт и подбор исполнителей
                    </div>
                </div>

                <!-- Section 4: VIP — Техника -->
                <div class="cust-section" style="position:relative;overflow:hidden">
                    <div class="cust-section-title">
                        <span class="icon">🔧</span>
                        Моя техника
                        <span style="margin-left:auto;font-size:0.72rem;padding:0.2rem 0.65rem;border-radius:8px;background:linear-gradient(135deg,rgba(234,179,8,0.15),rgba(139,92,246,0.15));color:#eab308;font-weight:700">⭐ VIP</span>
                    </div>
                    ${isVipUser() ? renderEquipmentSection() : renderVipLock('equipment')}
                </div>

                <!-- Section 5: VIP — Бригады -->
                <div class="cust-section" style="position:relative;overflow:hidden">
                    <div class="cust-section-title">
                        <span class="icon">👷</span>
                        Мои бригады
                        <span style="margin-left:auto;font-size:0.72rem;padding:0.2rem 0.65rem;border-radius:8px;background:linear-gradient(135deg,rgba(234,179,8,0.15),rgba(139,92,246,0.15));color:#eab308;font-weight:700">⭐ VIP</span>
                    </div>
                    ${isVipUser() ? renderPartnersSection() : renderVipLock('partners')}
                </div>

                <!-- Actions -->
                <div class="cust-actions">
                    <button class="cust-btn cust-btn-secondary" onclick="window.CustomerProfileUI._resetForm()">
                        🗑️ Очистить
                    </button>
                    <button class="cust-btn cust-btn-primary" onclick="window.CustomerProfileUI._save()">
                        💾 Сохранить анкету
                    </button>
                </div>
            </div>

            <!-- Save indicator -->
            <div class="cust-save-indicator" id="custSaveIndicator">
                ✅ Анкета сохранена!
            </div>
        `;

        // Setup photo file input listener
        setupPhotoInput();
        setupDragDrop();
    }

    // ========== HELPERS ==========
    function escHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    // ========== EVENT HANDLERS ==========
    function onInput(field, value) {
        customerData[field] = value;
        saveProfile();
        updateProgress();
    }

    function setType(type) {
        customerData.clientType = type;
        saveProfile();

        // Update UI
        document.querySelectorAll('.cust-type-option').forEach(opt => {
            opt.classList.toggle('selected', opt.querySelector('input').value === type);
        });

        const companyFields = document.getElementById('custCompanyFields');
        if (companyFields) {
            companyFields.classList.toggle('visible', type === 'company');
        }

        updateProgress();
    }

    function toggleChip(id) {
        const idx = customerData.projectTypes.indexOf(id);
        if (idx > -1) {
            customerData.projectTypes.splice(idx, 1);
        } else {
            customerData.projectTypes.push(id);
        }
        saveProfile();

        // Update chip UI
        const chips = document.querySelectorAll('#custProjectChips .cust-chip');
        chips.forEach(chip => {
            const chipId = chip.getAttribute('onclick').match(/'([^']+)'/)[1];
            chip.classList.toggle('active', customerData.projectTypes.includes(chipId));
        });

        updateProgress();
    }

    function updateProgress() {
        const percent = calculateCompletion();
        const fill = document.querySelector('.cust-progress-fill');
        const percentEl = document.querySelector('.cust-progress-percent');
        if (fill) fill.style.width = percent + '%';
        if (percentEl) percentEl.textContent = percent + '%';

        // Update step dots
        const dots = document.querySelectorAll('.cust-step-dot');
        if (dots.length >= 4) {
            dots[0].className = `cust-step-dot ${customerData.fullName ? 'done' : 'active'}`;
            dots[1].className = `cust-step-dot ${customerData.clientType ? 'done' : ''}`;
            dots[2].className = `cust-step-dot ${customerData.projectTypes.length > 0 ? 'done' : ''}`;
            dots[3].className = `cust-step-dot ${percent >= 100 ? 'done' : ''}`;
        }
    }

    function save() {
        // Validate required fields
        const errors = [];
        if (!customerData.fullName.trim()) errors.push('Укажите ФИО');
        if (!customerData.phone.trim()) errors.push('Укажите телефон');
        if (!customerData.city) errors.push('Выберите город');

        if (errors.length > 0) {
            // Highlight error fields
            const fieldMap = {
                'fullName': 'custFullName',
                'phone': 'custPhone',
                'city': 'custCity'
            };

            if (!customerData.fullName.trim()) {
                const el = document.getElementById('custFullName');
                if (el) { el.classList.add('error'); setTimeout(() => el.classList.remove('error'), 3000); }
            }
            if (!customerData.phone.trim()) {
                const el = document.getElementById('custPhone');
                if (el) { el.classList.add('error'); setTimeout(() => el.classList.remove('error'), 3000); }
            }
            if (!customerData.city) {
                const el = document.getElementById('custCity');
                if (el) { el.classList.add('error'); setTimeout(() => el.classList.remove('error'), 3000); }
            }

            if (window.showToast) {
                window.showToast('⚠️ ' + errors.join(', '));
            }
            return;
        }

        saveProfile();

        // Show success indicator
        const indicator = document.getElementById('custSaveIndicator');
        if (indicator) {
            indicator.classList.add('show');
            setTimeout(() => indicator.classList.remove('show'), 3000);
        }

        if (window.showToast) {
            window.showToast('✅ Анкета заказчика сохранена!');
        }

        // Send notification
        if (window.NotificationService && window.NotificationService.create) {
            window.NotificationService.create({
                type: 'system',
                title: 'Анкета обновлена',
                message: `Ваша анкета заказчика заполнена на ${calculateCompletion()}%`,
                icon: '📋'
            });
        }
    }

    async function resetForm() {
        const ok = await (window.QazUI?.confirm || window.confirm)('Очистить анкету?', 'Все данные профиля будут удалены безвозвратно', { icon: '🗑️', danger: true, confirmText: 'Очистить' });
        if (!ok) return;

        const userId = getCurrentUserId();
        localStorage.removeItem(`customerQuestionnaire_${userId}`);

        // Reset state
        customerData = {
            fullName: '', phone: '', email: '', city: '', address: '',
            clientType: 'individual', companyName: '', bin: '',
            projectTypes: [], projectDescription: '',
            budgetMin: '', budgetMax: '', timeline: '', urgency: 'normal',
            objectAddress: '', objectArea: '', objectFloors: '',
            photos: [], equipment: [], partners: [],
            isComplete: false, completionPercent: 0,
            createdAt: '', updatedAt: ''
        };

        render();

        if (window.showToast) {
            window.showToast('🗑️ Анкета очищена');
        }
    }

    // ========== PHOTO HANDLING ==========
    function setupPhotoInput() {
        const input = document.getElementById('custPhotoInput');
        if (input) {
            input.addEventListener('change', function (e) {
                handlePhotoFiles(e.target.files);
                e.target.value = ''; // Reset to allow re-upload
            });
        }
    }

    function setupDragDrop() {
        const zone = document.getElementById('custPhotoUpload');
        if (!zone) return;

        zone.addEventListener('dragover', function (e) {
            e.preventDefault();
            zone.style.borderColor = 'rgba(139, 92, 246, 0.5)';
            zone.style.background = 'rgba(139, 92, 246, 0.05)';
        });

        zone.addEventListener('dragleave', function () {
            zone.style.borderColor = '';
            zone.style.background = '';
        });

        zone.addEventListener('drop', function (e) {
            e.preventDefault();
            zone.style.borderColor = '';
            zone.style.background = '';
            handlePhotoFiles(e.dataTransfer.files);
        });
    }

    function handlePhotoFiles(files) {
        if (!files || files.length === 0) return;

        const maxPhotos = 10;
        const remaining = maxPhotos - customerData.photos.length;
        if (remaining <= 0) {
            if (window.showToast) window.showToast('📷 Максимум 10 фото');
            return;
        }

        const filesToProcess = Array.from(files).slice(0, remaining);

        filesToProcess.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            if (file.size > 10 * 1024 * 1024) {
                if (window.showToast) window.showToast(`⚠️ Файл ${file.name} слишком большой (макс 10 МБ)`);
                return;
            }

            const reader = new FileReader();
            reader.onload = function (e) {
                customerData.photos.push(e.target.result);
                saveProfile();
                renderPhotoGrid();
            };
            reader.readAsDataURL(file);
        });
    }

    function renderPhotoGrid() {
        const grid = document.getElementById('custPhotoGrid');
        if (!grid) return;

        grid.innerHTML = customerData.photos.map((p, i) => `
            <div class="cust-photo-thumb">
                <img src="${p}" alt="Фото ${i + 1}">
                <button class="remove-btn" onclick="event.stopPropagation(); window.CustomerProfileUI._removePhoto(${i})">✕</button>
            </div>
        `).join('');
    }

    function removePhoto(index) {
        customerData.photos.splice(index, 1);
        saveProfile();
        renderPhotoGrid();
    }

    // ========== VIP: EQUIPMENT SECTION ==========
    function renderEquipmentSection() {
        let html = '';
        if (customerData.equipment.length > 0) {
            html += '<div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem">';
            customerData.equipment.forEach((eq, i) => {
                const catObj = EQ_CATEGORIES.find(c => c.id === eq.category) || EQ_CATEGORIES[0];
                html += `
                    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px">
                        <span style="font-size:1.2rem">${catObj.icon}</span>
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:600;font-size:0.88rem">${escHtml(eq.title)}${eq.qty > 1 ? ' <span style="opacity:0.5">×' + eq.qty + '</span>' : ''}</div>
                            <div style="font-size:0.75rem;color:rgba(255,255,255,0.45)">${catObj.label}${eq.note ? ' • ' + escHtml(eq.note) : ''}</div>
                        </div>
                        <button style="background:none;border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;padding:4px 8px;cursor:pointer;font-size:0.75rem" onclick="window.CustomerProfileUI._removeEquipment(${i})">✕</button>
                    </div>`;
            });
            html += '</div>';
        }
        html += `<button style="display:flex;align-items:center;justify-content:center;gap:0.5rem;width:100%;padding:0.75rem;border:2px dashed rgba(255,255,255,0.1);border-radius:12px;background:transparent;color:rgba(255,255,255,0.5);font-size:0.85rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.25s" onclick="window.CustomerProfileUI._showAddEquipmentForm()" onmouseover="this.style.borderColor='rgba(139,92,246,0.3)';this.style.color='rgba(255,255,255,0.7)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)';this.style.color='rgba(255,255,255,0.5)'">➕ Добавить технику</button>`;
        html += `<div id="addEquipmentForm" style="display:none;margin-top:1rem"></div>`;
        return html;
    }

    function showAddEquipmentForm() {
        const form = document.getElementById('addEquipmentForm');
        if (!form) return;
        form.style.display = 'block';
        form.innerHTML = `
            <div style="padding:1rem;background:rgba(15,23,42,0.6);border:1px solid rgba(139,92,246,0.15);border-radius:14px">
                <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.85rem">🔧 Новая техника</div>
                <div class="cust-form-grid cols-2">
                    <div class="cust-field"><label>Название <span class="req">*</span></label>
                        <input class="cust-input" id="eqNewTitle" placeholder="Экскаватор JCB 3CX"></div>
                    <div class="cust-field"><label>Категория</label>
                        <select class="cust-input" id="eqNewCat">
                            ${EQ_CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.label}</option>`).join('')}
                        </select></div>
                </div>
                <div class="cust-form-grid cols-2" style="margin-top:0.75rem">
                    <div class="cust-field"><label>Количество</label>
                        <input type="number" class="cust-input" id="eqNewQty" value="1" min="1"></div>
                    <div class="cust-field"><label>Примечание</label>
                        <input class="cust-input" id="eqNewNote" placeholder="Доп. информация"></div>
                </div>
                <div style="display:flex;gap:0.75rem;margin-top:1rem;justify-content:flex-end">
                    <button class="cust-btn cust-btn-secondary" style="padding:0.5rem 1rem;font-size:0.82rem" onclick="document.getElementById('addEquipmentForm').style.display='none'">Отмена</button>
                    <button class="cust-btn cust-btn-primary" style="padding:0.5rem 1rem;font-size:0.82rem" onclick="window.CustomerProfileUI._addEquipment()">➕ Добавить</button>
                </div>
            </div>`;
        document.getElementById('eqNewTitle')?.focus();
    }

    function addEquipment() {
        const title = document.getElementById('eqNewTitle')?.value.trim();
        if (!title) { if (window.showToast) window.showToast('⚠️ Укажите название техники'); return; }
        customerData.equipment.push({
            id: 'eq_' + Date.now(),
            title,
            category: document.getElementById('eqNewCat')?.value || 'tool',
            qty: parseInt(document.getElementById('eqNewQty')?.value) || 1,
            status: 'free',
            note: document.getElementById('eqNewNote')?.value || ''
        });
        saveProfile();
        render();
        if (window.showToast) window.showToast('✅ Техника добавлена');
    }

    function removeEquipment(index) {
        customerData.equipment.splice(index, 1);
        saveProfile();
        render();
    }

    // ========== VIP: PARTNERS SECTION ==========
    function renderPartnersSection() {
        let html = '';
        if (customerData.partners.length > 0) {
            html += '<div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem">';
            customerData.partners.forEach((pt, i) => {
                const kindObj = PARTNER_KINDS.find(k => k.id === pt.kind) || PARTNER_KINDS[0];
                html += `
                    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.85rem 1rem;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px">
                        <span style="font-size:1.2rem">${kindObj.icon}</span>
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:600;font-size:0.88rem">${escHtml(pt.title)}</div>
                            <div style="font-size:0.75rem;color:rgba(255,255,255,0.45)">${kindObj.label}${pt.phone ? ' • 📱 ' + escHtml(pt.phone) : ''}</div>
                            ${pt.tags && pt.tags.length ? '<div style="display:flex;flex-wrap:wrap;gap:0.2rem;margin-top:0.25rem">' + pt.tags.map(t => '<span style="padding:0.1rem 0.4rem;border-radius:5px;font-size:0.62rem;font-weight:600;background:rgba(139,92,246,0.1);color:rgba(139,92,246,0.8);border:1px solid rgba(139,92,246,0.15)">' + escHtml(t) + '</span>').join('') + '</div>' : ''}
                        </div>
                        <button style="background:none;border:1px solid rgba(239,68,68,0.2);border-radius:8px;color:#ef4444;padding:4px 8px;cursor:pointer;font-size:0.75rem" onclick="window.CustomerProfileUI._removePartner(${i})">✕</button>
                    </div>`;
            });
            html += '</div>';
        }
        html += `<button style="display:flex;align-items:center;justify-content:center;gap:0.5rem;width:100%;padding:0.75rem;border:2px dashed rgba(255,255,255,0.1);border-radius:12px;background:transparent;color:rgba(255,255,255,0.5);font-size:0.85rem;font-weight:600;cursor:pointer;font-family:inherit;transition:all 0.25s" onclick="window.CustomerProfileUI._showAddPartnerForm()" onmouseover="this.style.borderColor='rgba(139,92,246,0.3)';this.style.color='rgba(255,255,255,0.7)'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)';this.style.color='rgba(255,255,255,0.5)'">➕ Добавить бригаду</button>`;
        html += `<div id="addPartnerForm" style="display:none;margin-top:1rem"></div>`;
        return html;
    }

    function showAddPartnerForm() {
        const form = document.getElementById('addPartnerForm');
        if (!form) return;
        form.style.display = 'block';
        form.innerHTML = `
            <div style="padding:1rem;background:rgba(15,23,42,0.6);border:1px solid rgba(139,92,246,0.15);border-radius:14px">
                <div style="font-weight:700;font-size:0.9rem;margin-bottom:0.85rem">👷 Новая бригада</div>
                <div class="cust-form-grid cols-2">
                    <div class="cust-field"><label>Название / ФИО <span class="req">*</span></label>
                        <input class="cust-input" id="ptNewTitle" placeholder="Бригада Иванова"></div>
                    <div class="cust-field"><label>Тип</label>
                        <select class="cust-input" id="ptNewKind">
                            ${PARTNER_KINDS.map(k => `<option value="${k.id}">${k.icon} ${k.label}</option>`).join('')}
                        </select></div>
                </div>
                <div class="cust-form-grid cols-2" style="margin-top:0.75rem">
                    <div class="cust-field"><label>Телефон</label>
                        <input type="tel" class="cust-input" id="ptNewPhone" placeholder="+7 (7XX) XXX-XX-XX"></div>
                    <div class="cust-field"><label>Специализации</label>
                        <input class="cust-input" id="ptNewTags" placeholder="сантехника, электрика"></div>
                </div>
                <div class="cust-form-grid" style="margin-top:0.75rem">
                    <div class="cust-field"><label>Комментарий</label>
                        <input class="cust-input" id="ptNewNote" placeholder="Надёжные, работал 3 года"></div>
                </div>
                <div style="display:flex;gap:0.75rem;margin-top:1rem;justify-content:flex-end">
                    <button class="cust-btn cust-btn-secondary" style="padding:0.5rem 1rem;font-size:0.82rem" onclick="document.getElementById('addPartnerForm').style.display='none'">Отмена</button>
                    <button class="cust-btn cust-btn-primary" style="padding:0.5rem 1rem;font-size:0.82rem" onclick="window.CustomerProfileUI._addPartner()">➕ Добавить</button>
                </div>
            </div>`;
        document.getElementById('ptNewTitle')?.focus();
    }

    function addPartner() {
        const title = document.getElementById('ptNewTitle')?.value.trim();
        if (!title) { if (window.showToast) window.showToast('⚠️ Укажите название бригады'); return; }
        const tagsStr = document.getElementById('ptNewTags')?.value || '';
        customerData.partners.push({
            id: 'pt_' + Date.now(),
            title,
            kind: document.getElementById('ptNewKind')?.value || 'crew',
            phone: document.getElementById('ptNewPhone')?.value || '',
            tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(t => t) : [],
            note: document.getElementById('ptNewNote')?.value || ''
        });
        saveProfile();
        render();
        if (window.showToast) window.showToast('✅ Бригада добавлена');
    }

    function removePartner(index) {
        customerData.partners.splice(index, 1);
        saveProfile();
        render();
    }

    // ========== VIP LOCK OVERLAY ==========
    function renderVipLock(type) {
        const desc = type === 'equipment'
            ? 'Добавляйте свою технику и привязывайте к проектам'
            : 'Добавляйте проверенных подрядчиков и бригады';
        return `
            <div style="text-align:center;padding:2rem 1rem;position:relative">
                <div style="position:absolute;inset:0;background:rgba(15,23,42,0.4);backdrop-filter:blur(2px);border-radius:12px;z-index:1"></div>
                <div style="position:relative;z-index:2">
                    <div style="font-size:2.5rem;margin-bottom:0.5rem">🔒</div>
                    <div style="font-weight:700;font-size:0.95rem;margin-bottom:0.35rem">Доступно с VIP</div>
                    <div style="font-size:0.82rem;color:rgba(255,255,255,0.5);margin-bottom:1rem">${desc}</div>
                    <button style="padding:0.7rem 1.8rem;border:none;border-radius:12px;background:linear-gradient(135deg,#eab308,#8b5cf6);color:white;font-size:0.88rem;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 20px rgba(139,92,246,0.3);transition:all 0.3s" onclick="window.CustomerProfileUI._onVipClick()" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">⭐ Подключить VIP</button>
                </div>
            </div>`;
    }

    function onVipClick() {
        if (window.showToast) window.showToast('⭐ VIP модуль — скоро! Следите за обновлениями.');
    }

    // ========== PUBLIC API ==========
    // ========== AVATAR HANDLERS ==========
    function uploadAvatar(event) {
        const file = event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            if (window.showToast) window.showToast('⚠️ Выберите файл изображения (JPG, PNG)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            if (window.showToast) window.showToast('⚠️ Максимальный размер фото — 5 МБ');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            customerData.avatar = e.target.result;
            saveProfile();
            render();
            if (window.showToast) window.showToast('✅ Фото профиля загружено');
        };
        reader.readAsDataURL(file);
    }

    function removeAvatar() {
        customerData.avatar = '';
        saveProfile();
        render();
        if (window.showToast) window.showToast('🗑️ Фото удалено');
    }

    window.CustomerProfileUI = {
        render: render,
        _onInput: onInput,
        _setType: setType,
        _toggleChip: toggleChip,
        _save: save,
        _resetForm: resetForm,
        _removePhoto: removePhoto,
        _uploadAvatar: uploadAvatar,
        _removeAvatar: removeAvatar,
        // VIP Equipment
        _showAddEquipmentForm: showAddEquipmentForm,
        _addEquipment: addEquipment,
        _removeEquipment: removeEquipment,
        // VIP Partners
        _showAddPartnerForm: showAddPartnerForm,
        _addPartner: addPartner,
        _removePartner: removePartner,
        // VIP lock
        _onVipClick: onVipClick,
        getData: function () { return { ...customerData }; },
        getCompletion: calculateCompletion
    };

    console.log('✅ CustomerProfileUI loaded');
})();
