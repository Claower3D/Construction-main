// ========== ROLE MANAGER v1.0 ==========
// Единый центр управления ролями
// Решает проблему рассогласованности: UI (orderer/contractor) ↔ Service (customer/executor)

(function () {
    'use strict';

    // =============================================
    // 1. МАППИНГ РОЛЕЙ (единственный источник правды)
    // =============================================

    /**
     * Бизнес-роли приложения (каноничные имена для хранения и логики)
     */
    const Role = Object.freeze({
        CUSTOMER: 'customer',
        EXECUTOR: 'executor',
        ENGINEER: 'engineer',
        CONTROLLER: 'controller',
        ADMIN: 'admin'
    });

    /**
     * UI-алиасы (для совместимости с landing.js, index.html onclick, тестами)
     */
    const UI_ALIAS = Object.freeze({
        orderer: Role.CUSTOMER,
        contractor: Role.EXECUTOR,
        engineer: Role.ENGINEER,
        controller: Role.CONTROLLER,
        admin: Role.ADMIN,
        // обратный маппинг
        customer: Role.CUSTOMER,
        executor: Role.EXECUTOR
    });

    /**
     * Обратный маппинг: service role → UI role (для landing/HTML)
     */
    const SERVICE_TO_UI = Object.freeze({
        [Role.CUSTOMER]: 'orderer',
        [Role.EXECUTOR]: 'contractor',
        [Role.ENGINEER]: 'engineer',
        [Role.CONTROLLER]: 'controller',
        [Role.ADMIN]: 'admin'
    });

    /**
     * Человекочитаемые метки ролей
     */
    const ROLE_LABELS = Object.freeze({
        [Role.CUSTOMER]: 'Заказчик',
        [Role.EXECUTOR]: 'Исполнитель',
        [Role.ENGINEER]: 'Инженер',
        [Role.CONTROLLER]: 'Контролёр',
        [Role.ADMIN]: 'Администратор'
    });

    /**
     * Все допустимые роли
     */
    const ALL_ROLES = Object.freeze([
        Role.CUSTOMER,
        Role.EXECUTOR,
        Role.ENGINEER,
        Role.CONTROLLER,
        Role.ADMIN
    ]);

    // =============================================
    // 1b. МАППИНГ СТРАНИЦ ПО РОЛЯМ
    // =============================================

    /**
     * Страницы, доступные каждой роли. admin видит ВСЁ.
     */
    const ROLE_PAGES = Object.freeze({
        [Role.CUSTOMER]: [
            'home', 'photo-estimate', 'inspect', 'orders', 'estimates',
            'engineering', 'wallet', 'vip', 'volume', 'equipment',
            'customer-profile', 'catalog', 'customer-cabinet',
            'disputes', 'contracts', 'calendar', 'analytics', 'kpi'
        ],
        [Role.EXECUTOR]: [
            'home', 'photo-estimate', 'inspect', 'orders', 'estimates',
            'engineering', 'wallet', 'vip', 'volume', 'equipment',
            'profile', 'catalog',
            'disputes', 'contracts', 'calendar', 'analytics', 'kpi'
        ],
        [Role.ENGINEER]: [
            'home', 'engineer', 'engineering', 'wallet',
            'orders', 'profile'
        ],
        [Role.CONTROLLER]: [
            'home', 'orders', 'inspect', 'engineering', 'wallet'
        ],
        [Role.ADMIN]: null // null = доступ ко ВСЕМ страницам
    });

    /**
     * Проверяет, имеет ли текущая роль доступ к странице
     * @param {string} page - имя страницы (без "page-" префикса)
     * @returns {boolean}
     */
    function canAccessPage(page) {
        if (!page) return false;
        // Лендинг и pricing доступны всем
        if (page === 'landing' || page === 'prices') return true;
        // Админ видит всё
        if (_currentRole === Role.ADMIN) return true;
        const allowed = ROLE_PAGES[_currentRole];
        if (!allowed) return true; // null = всё доступно
        return allowed.includes(page);
    }

    /**
     * Фильтрует элементы навигации в хедере по текущей роли
     */
    function filterNavForRole() {
        const items = document.querySelectorAll('[data-role-page]');
        items.forEach(item => {
            const page = item.getAttribute('data-role-page');
            item.style.display = canAccessPage(page) ? '' : 'none';
        });
    }

    // =============================================
    // 2. СОСТОЯНИЕ
    // =============================================

    let _currentRole = Role.CUSTOMER;
    let _userRoles = [Role.CUSTOMER];
    let _switching = false; // защита от рекурсии

    // =============================================
    // 3. НОРМАЛИЗАЦИЯ РОЛЕЙ
    // =============================================

    /**
     * Принимает ЛЮБОЕ имя роли (UI или service) и возвращает каноничное имя
     * @param {string} roleInput
     * @returns {string} каноничное service-имя роли
     */
    function normalize(roleInput) {
        if (!roleInput || typeof roleInput !== 'string') return Role.CUSTOMER;
        const lower = roleInput.toLowerCase().trim();
        return UI_ALIAS[lower] || Role.CUSTOMER;
    }

    /**
     * Получить UI-алиас для роли
     * @param {string} role - каноничное имя или любое
     * @returns {string} UI-имя (orderer/contractor/engineer)
     */
    function toUI(role) {
        const canonical = normalize(role);
        return SERVICE_TO_UI[canonical] || 'orderer';
    }

    /**
     * Получить человекочитаемую метку
     * @param {string} role
     * @returns {string}
     */
    function label(role) {
        const canonical = normalize(role);
        return ROLE_LABELS[canonical] || role;
    }

    // =============================================
    // 4. ХРАНИЛИЩЕ РОЛЕЙ
    // =============================================

    function _loadFromStorage() {
        try {
            // Текущая активная роль
            const storedSelected = localStorage.getItem('selectedRole');
            const storedUI = localStorage.getItem('userRole');
            _currentRole = normalize(storedSelected || storedUI || 'customer');

            // Все доступные роли пользователя
            const savedRoles = localStorage.getItem('userRoles');
            if (savedRoles) {
                const parsed = JSON.parse(savedRoles);
                _userRoles = Array.isArray(parsed) ? parsed.map(normalize) : [Role.CUSTOMER];
            } else {
                _userRoles = [_currentRole];
            }

            // Убеждаемся, что текущая роль есть в списке
            if (!_userRoles.includes(_currentRole)) {
                _userRoles.push(_currentRole);
            }
        } catch (e) {
            console.warn('[RoleManager] Error loading from storage:', e);
            _currentRole = Role.CUSTOMER;
            _userRoles = [Role.CUSTOMER];
        }
    }

    function _saveToStorage() {
        try {
            // Сохраняем в оба ключа для обратной совместимости
            localStorage.setItem('selectedRole', _currentRole);
            localStorage.setItem('userRole', toUI(_currentRole)); // для landing.js
            localStorage.setItem('userRoles', JSON.stringify(_userRoles));

            // window.userRole для обратной совместимости с landing.js + тестами
            window.userRole = toUI(_currentRole);
        } catch (e) {
            console.warn('[RoleManager] Error saving to storage:', e);
        }
    }

    // =============================================
    // 5. ПЕРЕКЛЮЧЕНИЕ РОЛИ (главная точка входа)
    // =============================================

    /**
     * Переключить текущую роль. Принимает ЛЮБОЕ имя роли.
     * Это ЕДИНСТВЕННАЯ функция, которую нужно вызывать для смены роли.
     * 
     * @param {string} roleInput - любое имя роли (orderer, customer, contractor, executor, engineer...)
     * @param {object} [options]
     * @param {boolean} [options.showToast=true] - показать уведомление
     * @param {boolean} [options.addRole=true] - автоматически добавить роль в список если её нет
     * @param {boolean} [options.updateUI=true] - обновить UI
     * @returns {boolean} успешность
     */
    function switchTo(roleInput, options = {}) {
        const { showToast = true, addRole = true, updateUI = true } = options;

        // Защита от рекурсии
        if (_switching) return false;

        const canonical = normalize(roleInput);

        // Проверка валидности
        if (!ALL_ROLES.includes(canonical)) {
            console.error('[RoleManager] Invalid role:', roleInput);
            return false;
        }

        _switching = true;

        try {
            const prevRole = _currentRole;
            _currentRole = canonical;

            // Добавляем роль если нет
            if (addRole && !_userRoles.includes(canonical)) {
                _userRoles.push(canonical);
            }

            // Сохраняем
            _saveToStorage();

            // Логирование
            if (window.logEvent) {
                window.logEvent('ROLE_SWITCHED', null, {
                    from: prevRole,
                    to: canonical,
                    uiAlias: toUI(canonical)
                });
            }

            console.log(`[RoleManager] ✅ ${label(prevRole)} → ${label(canonical)}`);

            // Обновляем UI
            if (updateUI) {
                _updateAllUI(canonical);
            }

            // Показать тост
            if (showToast && prevRole !== canonical && window.showToast) {
                window.showToast(`✅ Вы теперь: ${label(canonical)}`);
            }

            // Уведомляем DataService о смене роли
            if (window.DataService && typeof window.DataService.setUserRole === 'function') {
                window.DataService.setUserRole(canonical);
            }

            // Диспатчим событие для подписчиков
            window.dispatchEvent(new CustomEvent('roleChanged', {
                detail: {
                    role: canonical,
                    uiRole: toUI(canonical),
                    prevRole,
                    label: label(canonical)
                }
            }));

            return true;

        } finally {
            _switching = false;
        }
    }

    // =============================================
    // 6. ОБНОВЛЕНИЕ UI
    // =============================================

    function _updateAllUI(role) {
        const uiRole = toUI(role);
        const isOrderer = uiRole === 'orderer';

        // --- Карточки выбора роли на home ---
        _toggleElement('roleCardOrderer', 'active', uiRole === 'orderer');
        _toggleElement('roleCardContractor', 'active', uiRole === 'contractor');
        _toggleElement('roleCardEngineer', 'active', uiRole === 'engineer');

        // --- Навигация ---
        _toggleElement('navRoleOrderer', 'active', uiRole === 'orderer');
        _toggleElement('navRoleContractor', 'active', uiRole === 'contractor');
        _toggleElement('navRoleEngineer', 'active', uiRole === 'engineer');

        // --- Сервисные блоки ---
        const ordererBlock = document.getElementById('ordererServices');
        const contractorBlock = document.getElementById('contractorServices');

        if (ordererBlock && contractorBlock) {
            if (uiRole === 'engineer') {
                // Инженер скрывает оба
                _hideBlock(ordererBlock);
                _hideBlock(contractorBlock);
            } else if (isOrderer) {
                _showBlock(ordererBlock);
                _hideBlock(contractorBlock);
            } else {
                _hideBlock(ordererBlock);
                _showBlock(contractorBlock);
            }
        }

        // --- Landing.js UI ---
        if (typeof window.updateLandingRoleUI === 'function') {
            window.updateLandingRoleUI();
        }

        // --- Фильтруем навигацию по роли ---
        filterNavForRole();

        // --- Скрываем/показываем карточки на home по роли ---
        _filterHomeCards();

        // --- Обновляем страницу заказов если открыта ---
        const ordersPage = document.getElementById('page-orders');
        if (ordersPage && ordersPage.classList.contains('active') && typeof window.loadOrders === 'function') {
            window.loadOrders(1);
        }

        // --- Для инженера переходим на страницу инженера ---
        if (uiRole === 'engineer' && typeof window.showPage === 'function') {
            const currentPage = document.querySelector('.page.active');
            if (currentPage && currentPage.id === 'page-home') {
                window.showPage('engineer');
            }
        }

        // --- Обновляем бейдж ТОО/ИП в навигации исполнителя ---
        if (uiRole === 'contractor') {
            _updateContractorOrgBadge();
        }
    }

    /**
     * Обновляет визуальный бейдж типа организации (ТОО/ИП/Мастер)
     * в dropdown исполнителя на основе данных из профиля
     */
    function _updateContractorOrgBadge() {
        try {
            const orgBadge = document.getElementById('contractorOrgBadge');
            const orgIcon = document.getElementById('contractorOrgIcon');
            const orgType = document.getElementById('contractorOrgType');
            const orgName = document.getElementById('contractorOrgName');
            const roleIcon = document.getElementById('contractorRoleIcon');
            const roleLabel = document.getElementById('contractorRoleLabel');

            if (!orgBadge) return;

            // Читаем профиль исполнителя из localStorage
            let profile = null;
            try {
                const profileData = localStorage.getItem('executorProfile');
                if (profileData) profile = JSON.parse(profileData);
            } catch (e) { /* ignore */ }

            if (profile && profile.orgType) {
                const type = profile.orgType;
                const name = profile.orgName || profile.contactName || '';

                if (type === 'ТОО' || type === 'too') {
                    if (orgIcon) orgIcon.textContent = '🏢';
                    if (orgType) { orgType.textContent = 'ТОО'; orgType.style.color = '#8b5cf6'; }
                    orgBadge.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))';
                    if (roleIcon) roleIcon.textContent = '🏢';
                    if (roleLabel) roleLabel.textContent = 'ТОО';
                } else if (type === 'ИП' || type === 'ip') {
                    if (orgIcon) orgIcon.textContent = '👤';
                    if (orgType) { orgType.textContent = 'ИП'; orgType.style.color = '#06b6d4'; }
                    orgBadge.style.background = 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.05))';
                    if (roleIcon) roleIcon.textContent = '👤';
                    if (roleLabel) roleLabel.textContent = 'ИП';
                } else if (type === 'Бригада' || type === 'brigade') {
                    if (orgIcon) orgIcon.textContent = '👷';
                    if (orgType) { orgType.textContent = 'Бригада'; orgType.style.color = '#f59e0b'; }
                    orgBadge.style.background = 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))';
                    if (roleIcon) roleIcon.textContent = '👷';
                    if (roleLabel) roleLabel.textContent = 'Исполнитель';
                } else {
                    if (orgIcon) orgIcon.textContent = '🔧';
                    if (orgType) { orgType.textContent = type || 'Мастер'; orgType.style.color = 'var(--primary)'; }
                    orgBadge.style.background = 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.15))';
                    if (roleIcon) roleIcon.textContent = '🔧';
                    if (roleLabel) roleLabel.textContent = 'Исполнитель';
                }

                if (orgName) orgName.textContent = name || 'Заполните анкету';
            } else {
                if (orgIcon) orgIcon.textContent = '🔧';
                if (orgType) { orgType.textContent = 'Мастер'; orgType.style.color = 'var(--primary)'; }
                if (orgName) orgName.textContent = 'Заполните анкету →';
                if (roleIcon) roleIcon.textContent = '🔧';
                if (roleLabel) roleLabel.textContent = 'Исполнитель';
            }
        } catch (e) {
            console.warn('[RoleManager] Не удалось обновить бейдж ТОО/ИП:', e);
        }
    }

    function _toggleElement(id, className, isActive) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.toggle(className, isActive);
        }
    }

    function _showBlock(el) {
        el.style.display = '';
        el.classList.remove('role-hidden');
        el.classList.add('role-visible');
    }

    function _hideBlock(el) {
        el.style.display = '';
        el.classList.remove('role-visible');
        el.classList.add('role-hidden');
    }

    // =============================================
    // 7. API ЗАПРОСОВ РОЛЕЙ
    // =============================================

    /**
     * Получить текущую каноничную роль
     * @returns {string}
     */
    function current() {
        return _currentRole;
    }

    /**
     * Получить текущую UI-роль (для landing.js совместимости)
     * @returns {string}
     */
    function currentUI() {
        return toUI(_currentRole);
    }

    /**
     * Получить все роли пользователя
     * @returns {string[]}
     */
    function allRoles() {
        return [..._userRoles];
    }

    /**
     * Проверить, есть ли у пользователя роль
     * @param {string} role - любое имя роли
     * @returns {boolean}
     */
    function hasRole(role) {
        return _userRoles.includes(normalize(role));
    }

    /**
     * Проверить, есть ли все роли
     * @returns {boolean}
     */
    function hasAllRoles() {
        return ALL_ROLES.every(r => _userRoles.includes(r));
    }

    /**
     * Дать все роли (суперрежим)
     * @returns {boolean}
     */
    function grantAllRoles() {
        _userRoles = [...ALL_ROLES];
        _saveToStorage();
        if (window.logEvent) {
            window.logEvent('ALL_ROLES_GRANTED', null, { roles: _userRoles });
        }
        console.log('[RoleManager] ✅ Все роли назначены:', _userRoles.map(label).join(', '));
        return true;
    }

    /**
     * Установить список ролей
     * @param {string[]} roles
     */
    function setRoles(roles) {
        _userRoles = Array.isArray(roles) ? roles.map(normalize) : [Role.CUSTOMER];
        if (!_userRoles.includes(_currentRole)) {
            _currentRole = _userRoles[0] || Role.CUSTOMER;
        }
        _saveToStorage();
    }

    /**
     * Проверить, является ли текущая роль одной из указанных
     * @param  {...string} roles
     * @returns {boolean}
     */
    function isOneOf(...roles) {
        return roles.map(normalize).includes(_currentRole);
    }

    /**
     * Проверить, является ли пользователь заказчиком
     * @returns {boolean}
     */
    function isCustomer() {
        return _currentRole === Role.CUSTOMER;
    }

    /**
     * Проверить, является ли пользователь исполнителем
     * @returns {boolean}
     */
    function isExecutor() {
        return _currentRole === Role.EXECUTOR;
    }

    /**
     * Проверить, является ли пользователь инженером
     * @returns {boolean}
     */
    function isEngineer() {
        return _currentRole === Role.ENGINEER;
    }

    /**
     * Проверить, является ли пользователь админом
     * @returns {boolean}
     */
    function isAdmin() {
        return _currentRole === Role.ADMIN;
    }

    // =============================================
    // 8. ОБРАТНАЯ СОВМЕСТИМОСТЬ
    // =============================================

    /**
     * Совместимый wrapper для setRole (принимает orderer/contractor/engineer)
     * Это замена для function setRole() в index.html
     */
    function setRole(uiRole) {
        return switchTo(uiRole, { showToast: true });
    }

    /**
     * Совместимый toggle (orderer ↔ contractor)
     */
    function toggleRole() {
        const next = _currentRole === Role.CUSTOMER ? Role.EXECUTOR : Role.CUSTOMER;
        return switchTo(next);
    }

    /**
     * Инициализация при загрузке
     */
    function init() {
        _loadFromStorage();
        _updateAllUI(_currentRole);
        console.log(`[RoleManager] ✅ Initialized: ${label(_currentRole)} (${toUI(_currentRole)})`);
    }

    // =============================================
    // 9. ЭКСПОРТ
    // =============================================

    /**
     * Фильтрует карточки сервисов на home page по текущей роли
     */
    function _filterHomeCards() {
        const cards = document.querySelectorAll('[data-role-page]');
        cards.forEach(card => {
            const page = card.getAttribute('data-role-page');
            if (page) {
                card.style.display = canAccessPage(page) ? '' : 'none';
            }
        });
    }

    const RoleManager = {
        // Константы
        Role,
        ALL_ROLES,
        ROLE_LABELS,
        ROLE_PAGES,

        // Маппинг
        normalize,
        toUI,
        label,

        // Управление
        switchTo,
        setRole,
        toggleRole,
        init,

        // Запросы
        current,
        currentUI,
        allRoles,
        hasRole,
        hasAllRoles,
        isOneOf,
        isCustomer,
        isExecutor,
        isEngineer,
        isAdmin,

        // Доступ к страницам
        canAccessPage,
        filterNavForRole,

        // Массовые операции
        grantAllRoles,
        setRoles
    };

    window.RoleManager = RoleManager;

    // --- Обратная совместимость: глобальные функции ---
    // setRole будет переопределена при загрузке roleManager → перекроет обе версии из index.html
    window.setRole = setRole;
    window.grantAllRoles = grantAllRoles;
    window.hasRole = hasRole;
    window.hasAllRoles = hasAllRoles;
    window.getAllRoles = allRoles;
    window.getCurrentRole = function () { return _currentRole; };
    window.canAccessPage = canAccessPage;

    // Обратная совместимость: updateNavigationForRole
    window.updateNavigationForRole = function (role) {
        _updateAllUI(normalize(role));
    };

    // Первичная загрузка из storage
    _loadFromStorage();
    window.userRole = toUI(_currentRole);

    console.log('[RoleManager] ✅ Role Manager v1.0 loaded');

})();
