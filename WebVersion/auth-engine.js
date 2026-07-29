// ========== AUTH ENGINE ==========
// Единый модуль авторизации для QazGost AI
// Поддерживает: EMAIL_PASSWORD | PHONE_OTP | OAUTH

(function () {
    'use strict';

    // ========== CONSTANTS ==========
    const AuthMode = {
        LOGIN: 'LOGIN',
        REGISTER: 'REGISTER'
    };

    const AuthMethod = {
        EMAIL_PASSWORD: 'EMAIL_PASSWORD',
        PHONE_OTP: 'PHONE_OTP',
        OAUTH: 'OAUTH'
    };

    const UserStatus = {
        EXISTS: 'EXISTS',
        NOT_EXISTS: 'NOT_EXISTS',
        NEED_PROFILE: 'NEED_PROFILE',
        SOCIAL_ONLY: 'SOCIAL_ONLY',
        BLOCKED: 'BLOCKED'
    };

    const FormState = {
        IDLE: 'idle',
        VALIDATING: 'validating',
        LOADING: 'loading',
        ERROR: 'error',
        SUCCESS: 'success'
    };

    // API Base URL (для демо - локальный, для прода - реальный сервер)
    const API_BASE_URL = 'https://construction-api.kmp99.workers.dev';
    // Auto-detect: if Firebase is initialised, use real auth; otherwise demo
    const IS_DEMO_MODE = !window.firebaseAuth;
    const USE_FIREBASE = !!window.firebaseAuth;

    // Firebase RecaptchaVerifier (lazy-init for Phone Auth)
    let recaptchaVerifier = null;
    let firebaseConfirmation = null; // ConfirmationResult from signInWithPhoneNumber

    // ========== STATE ==========
    let currentMode = AuthMode.LOGIN;
    let currentMethod = AuthMethod.EMAIL_PASSWORD;
    let formState = FormState.IDLE;
    let generatedOTP = '';
    let otpPhone = '';
    let resendTimer = null;
    let resendSeconds = 0;

    // ========== STORAGE HELPERS ==========
    const Storage = {
        get: (key) => {
            try {
                return localStorage.getItem(key);
            } catch {
                return null;
            }
        },
        set: (key, value) => {
            try {
                localStorage.setItem(key, value);
            } catch { }
        },
        remove: (key) => {
            try {
                localStorage.removeItem(key);
            } catch { }
        },
        getJSON: (key) => {
            try {
                return JSON.parse(localStorage.getItem(key) || 'null');
            } catch {
                return null;
            }
        },
        setJSON: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
            } catch { }
        }
    };

    // ========== DEMO: USERS DATABASE ==========
    function getDemoUsers() {
        return Storage.getJSON('demoUsers') || {};
    }

    function saveDemoUsers(users) {
        Storage.setJSON('demoUsers', users);
    }

    // ========== VALIDATION ==========
    const Validators = {
        email: (email) => {
            if (!email) return 'Введите email';
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Некорректный email';
            return null;
        },
        password: (password, isRegistration = false) => {
            if (!password) return 'Введите пароль';
            if (password.length < 6) return 'Пароль минимум 6 символов';
            if (isRegistration) {
                if (password.length < 8) return 'Пароль минимум 8 символов';
                if (!/[A-Z]/.test(password)) return 'Нужна заглавная буква (A-Z)';
                if (!/[a-z]/.test(password)) return 'Нужна строчная буква (a-z)';
                if (!/[0-9]/.test(password)) return 'Нужна цифра (0-9)';
                if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Нужен спецсимвол (!@#$...)';
            }
            return null;
        },
        passwordConfirm: (password, confirm) => {
            if (!confirm) return 'Подтвердите пароль';
            if (password !== confirm) return 'Пароли не совпадают';
            return null;
        },
        name: (name) => {
            if (!name) return 'Введите имя';
            if (name.length < 2) return 'Имя минимум 2 символа';
            if (name.length > 40) return 'Имя максимум 40 символов';
            return null;
        },
        phone: (phone) => {
            if (!phone) return 'Введите номер телефона';
            const digits = phone.replace(/\D/g, '');
            // Determine expected digit count based on country code
            const expected = _getExpectedPhoneDigits(phone);
            if (digits.length < expected) return `Номер должен содержать ${expected} цифр (сейчас ${digits.length})`;
            return null;
        },
        otp: (otp) => {
            if (!otp) return 'Введите код';
            if (!/^\d{6}$/.test(otp)) return 'Код должен быть 6 цифр';
            return null;
        }
    };

    // Expected local digit count by dial code (without country code prefix)
    const PHONE_DIGIT_MAP = {
        '+7': 10, '+1': 10, '+44': 10, '+49': 11, '+33': 9, '+90': 10,
        '+380': 9, '+375': 9, '+998': 9, '+996': 9, '+992': 9, '+993': 8,
        '+994': 9, '+374': 8, '+995': 9, '+373': 8, '+370': 8, '+371': 8,
        '+372': 8, '+91': 10, '+92': 10, '+86': 11, '+81': 10, '+82': 10,
        '+971': 9, '+966': 9, '+972': 9, '+20': 10, '+27': 9,
        '+55': 11, '+52': 10, '+54': 10, '+56': 9,
        '+61': 9, '+64': 9, '+65': 8, '+66': 9, '+62': 11,
        '+39': 10, '+34': 9, '+351': 9, '+31': 9, '+32': 9,
        '+41': 9, '+43': 10, '+48': 9, '+420': 9, '+421': 9,
        '+36': 9, '+40': 9, '+359': 9, '+30': 10,
        '+880': 10, '+94': 9, '+977': 10, '+95': 9,
        '+60': 10, '+63': 10, '+84': 9,
        '+974': 8, '+965': 8, '+968': 8, '+973': 8, '+962': 9, '+961': 8,
        '+98': 10, '+964': 10, '+212': 9, '+216': 8, '+213': 9,
        '+234': 10, '+254': 9
    };

    function _getExpectedPhoneDigits(fullPhone) {
        // fullPhone already includes country code like +7..., +380...
        // Try matching from longest code prefix to shortest
        for (let len = 4; len >= 1; len--) {
            const prefix = fullPhone.slice(0, len + 1); // +XXXX
            if (PHONE_DIGIT_MAP[prefix]) {
                return PHONE_DIGIT_MAP[prefix] + prefix.length - 1; // total digits = local + code digits
            }
        }
        return 10; // fallback: 10 total digits minimum
    }

    // Exposed helper: get expected LOCAL digits count for a country dial code
    function getExpectedLocalDigits(dialCode) {
        return PHONE_DIGIT_MAP[dialCode] || 10;
    }

    // ========== UI HELPERS ==========
    const $ = (s) => document.querySelector(s);
    const $$ = (s) => Array.from(document.querySelectorAll(s));

    function showFieldError(fieldId, message) {
        const field = $(`#${fieldId}`);
        const errorEl = $(`#${fieldId}Error`);
        if (field) {
            field.classList.add('error');
            field.classList.remove('valid');
        }
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.hidden = false;
        }
    }

    function clearFieldError(fieldId) {
        const field = $(`#${fieldId}`);
        const errorEl = $(`#${fieldId}Error`);
        if (field) {
            field.classList.remove('error');
        }
        if (errorEl) {
            errorEl.hidden = true;
        }
    }

    function clearAllErrors() {
        $$('.field-error').forEach(el => el.hidden = true);
        $$('.auth-input').forEach(el => el.classList.remove('error', 'valid'));
    }

    function setButtonLoading(btnId, loading, text) {
        const btn = $(`#${btnId}`);
        if (!btn) return;
        btn.disabled = loading;
        const span = btn.querySelector('span');
        if (span) {
            span.textContent = text || (loading ? 'Загрузка...' : 'Отправить');
        }
    }

    function showToast(message, duration = 3000) {
        const toast = $('#toast');
        if (toast) {
            toast.textContent = message;
            toast.hidden = false;
            setTimeout(() => toast.hidden = true, duration);
        }
    }

    // ========== MODE & METHOD SWITCHING ==========
    function setAuthMode(mode) {
        currentMode = mode;
        updateUI();

        // Сохраняем последний режим
        Storage.set('lastAuthMode', mode);
    }

    function setAuthMethod(method) {
        currentMethod = method;
        updateUI();

        // Сохраняем последний метод
        Storage.set('lastAuthMethod', method);
    }

    function updateUI() {
        // Update mode buttons
        const loginBtn = $('#authModeLogin');
        const registerBtn = $('#authModeRegister');
        if (loginBtn && registerBtn) {
            loginBtn.classList.toggle('active', currentMode === AuthMode.LOGIN);
            registerBtn.classList.toggle('active', currentMode === AuthMode.REGISTER);
        }

        // Update method tabs
        $$('.auth-method-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === currentMethod);
        });

        // Show/hide method forms
        $$('.auth-method-form').forEach(form => {
            form.hidden = form.dataset.method !== currentMethod;
        });

        // Update texts based on mode
        updateTexts();
        clearAllErrors();
    }

    function updateTexts() {
        const isLogin = currentMode === AuthMode.LOGIN;

        // Email form texts
        const emailTitle = $('#emailFormTitle');
        const emailBtn = $('#emailSubmitBtn span');
        const emailSwitch = $('#emailSwitchLink');

        if (emailTitle) {
            emailTitle.textContent = isLogin ? 'Вход по email' : 'Регистрация по email';
        }
        if (emailBtn) {
            emailBtn.textContent = isLogin ? 'Войти' : 'Создать аккаунт';
        }
        if (emailSwitch) {
            emailSwitch.innerHTML = isLogin
                ? 'Нет аккаунта? <a href="#" onclick="AuthEngine.setMode(\'REGISTER\'); return false;">Зарегистрироваться</a>'
                : 'Уже есть аккаунт? <a href="#" onclick="AuthEngine.setMode(\'LOGIN\'); return false;">Войти</a>';
        }

        // Show/hide registration fields
        const regFields = $('#emailRegisterFields');
        const regFields2 = $('#emailRegisterFields2');
        const forgotLink = $('#forgotPasswordLink');
        if (regFields) {
            regFields.hidden = isLogin;
        }
        if (regFields2) {
            regFields2.hidden = isLogin;
        }
        if (forgotLink) {
            forgotLink.hidden = !isLogin;
        }

        // Phone form texts
        const phoneTitle = $('#phoneFormTitle');
        const phoneSubtitle = $('#phoneFormSubtitle');

        if (phoneTitle) {
            phoneTitle.textContent = isLogin ? 'Вход по телефону' : 'Регистрация по телефону';
        }
        if (phoneSubtitle) {
            phoneSubtitle.textContent = isLogin
                ? 'Войдите, чтобы сохранить заказы и получить уведомления'
                : 'Создайте аккаунт через номер телефона';
        }

        // OAuth texts
        $$('.oauth-btn-text').forEach(el => {
            const provider = el.closest('.oauth-btn')?.dataset.provider;
            if (provider) {
                el.textContent = isLogin ? `Войти через ${provider}` : `Создать через ${provider}`;
            }
        });
    }

    // ========== EMAIL/PASSWORD AUTH ==========
    async function submitEmailAuth() {
        clearAllErrors();

        // Захватываем гостевые данные перед авторизацией
        if (window.GuestMigration) window.GuestMigration.capture();

        if (currentMode === AuthMode.LOGIN) {
            await submitEmailLogin();
        } else {
            await submitEmailRegister();
        }
    }

    async function submitEmailLogin() {
        const email = $('#authEmail')?.value.trim();
        const password = $('#authPassword')?.value;

        // Validate
        let hasError = false;
        const emailError = Validators.email(email);
        if (emailError) {
            showFieldError('authEmail', emailError);
            hasError = true;
        }
        const passError = Validators.password(password);
        if (passError) {
            showFieldError('authPassword', passError);
            hasError = true;
        }
        if (hasError) return;

        setButtonLoading('emailSubmitBtn', true, 'Вход...');

        try {
            if (USE_FIREBASE) {
                await firebaseEmailLogin(email, password);
            } else if (IS_DEMO_MODE) {
                await demoEmailLogin(email, password);
            } else {
                await apiEmailLogin(email, password);
            }
        } catch (error) {
            showToast(`❌ ${error.message}`);
        } finally {
            setButtonLoading('emailSubmitBtn', false, 'Войти');
        }
    }

    // ========== FIREBASE: EMAIL LOGIN ==========
    async function firebaseEmailLogin(email, password) {
        try {
            const cred = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
            const fbUser = cred.user;

            // Get role from localStorage (roles are app-level, not Firebase)
            const storedUsers = getDemoUsers();
            const localUser = storedUsers[email.toLowerCase()];
            const role = localUser?.role || 'customer';

            onAuthSuccess({
                accessToken: await fbUser.getIdToken(),
                refreshToken: fbUser.refreshToken,
                expiresIn: 3600
            }, {
                uid: fbUser.uid,
                email: fbUser.email,
                name: fbUser.displayName || localUser?.name || email.split('@')[0],
                phone: fbUser.phoneNumber || localUser?.phone || '',
                role: role
            });
        } catch (err) {
            console.warn('Firebase login failed:', err.code, err.message);
            
            // FALLBACK TO DEMO: If user not found in Firebase, check local demo database
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
                const users = getDemoUsers();
                const demoUser = users[email.toLowerCase()];
                
                if (demoUser && await _verifyPassword(password, demoUser.password)) {
                    console.log('✅ Found user in local demo database, logging in...');
                    onAuthSuccess({
                        accessToken: 'demo_token_' + Date.now(),
                        refreshToken: 'demo_refresh_' + Date.now(),
                        expiresIn: 7 * 24 * 60 * 60
                    }, {
                        email: email,
                        name: demoUser.name,
                        phone: demoUser.phone,
                        role: demoUser.role || 'customer'
                    });
                    return;
                }
            }

            const msg = _firebaseErrorMessage(err.code);
            if (err.code === 'auth/user-not-found') {
                showFieldError('authEmail', 'Аккаунт не найден');
                showToast('ℹ️ Аккаунт не найден. Нажмите «Регистрация» для создания.', 4000);
                setTimeout(() => {
                    setAuthMode(AuthMode.REGISTER);
                    const el = $('#authEmail'); if (el) el.value = email;
                    $('#authName')?.focus();
                }, 800);
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                showFieldError('authPassword', 'Неверный пароль');
            } else {
                throw new Error(msg);
            }
        }
    }

    async function demoEmailLogin(email, password) {
        await delay(800);

        const users = getDemoUsers();
        let user = users[email.toLowerCase()];

        // Special case for backend admin if not in localStorage yet
        if (!user && email.toLowerCase() === 'admin@demo.kz') {
            user = { name: 'Администратор Бэкенда', email: 'admin@demo.kz', password: 'demo123', role: 'admin' };
        }
        if (!user && email.toLowerCase() === 'customer@demo.kz') {
            user = { name: 'Демо Заказчик', email: 'customer@demo.kz', password: 'demo123', role: 'customer' };
        }

        if (!user) {
            // USER_NOT_FOUND - предлагаем регистрацию
            showFieldError('authEmail', 'Аккаунт не найден');
            showToast('ℹ️ Аккаунт не найден. Переход к регистрации...', 4000);

            setTimeout(() => {
                setAuthMode(AuthMode.REGISTER);
                const authEmailEl = $('#authEmail'); if (authEmailEl) authEmailEl.value = email;
                $('#authName')?.focus();
            }, 800);
            return;
        }

        if (user.socialOnly) {
            showFieldError('authEmail', 'Аккаунт создан через соцсеть');
            showToast('ℹ️ Войдите через Google/Apple или задайте пароль', 5000);
            return;
        }

        if (user.blocked) {
            showFieldError('authEmail', 'Аккаунт заблокирован');
            showToast('🚫 Обратитесь в поддержку', 5000);
            return;
        }

        // Verify password: supports both hashed (SHA-256) and legacy plain text
        const passwordMatch = await _verifyPassword(password, user.password);
        if (!passwordMatch) {
            showFieldError('authPassword', 'Неверный пароль');
            return;
        }

        // Success!
        onAuthSuccess({
            accessToken: 'demo_token_' + Date.now(),
            refreshToken: 'demo_refresh_' + Date.now(),
            expiresIn: 7 * 24 * 60 * 60
        }, {
            email: email,
            name: user.name,
            phone: user.phone,
            role: user.role || 'customer'
        });
    }

    async function submitEmailRegister() {
        const name = $('#authName')?.value.trim();
        const email = $('#authEmail')?.value.trim();
        const password = $('#authPassword')?.value;
        const confirm = $('#authPasswordConfirm')?.value;

        // Validate
        let hasError = false;

        const nameError = Validators.name(name);
        if (nameError) {
            showFieldError('authName', nameError);
            hasError = true;
        }

        const emailError = Validators.email(email);
        if (emailError) {
            showFieldError('authEmail', emailError);
            hasError = true;
        }

        const passError = Validators.password(password, true);
        if (passError) {
            showFieldError('authPassword', passError);
            hasError = true;
        }

        const confirmError = Validators.passwordConfirm(password, confirm);
        if (confirmError) {
            showFieldError('authPasswordConfirm', confirmError);
            hasError = true;
        }

        // Проверка согласия на обработку ПД
        const privacyCheckbox = $('#authPrivacyConsent');
        if (privacyCheckbox && !privacyCheckbox.checked) {
            showFieldError('authPrivacyConsent', 'Необходимо принять условия');
            hasError = true;
        }

        if (hasError) return;

        setButtonLoading('emailSubmitBtn', true, 'Регистрация...');

        try {
            if (USE_FIREBASE) {
                await firebaseEmailRegister(name, email, password);
            } else if (IS_DEMO_MODE) {
                await demoEmailRegister(name, email, password);
            } else {
                await apiEmailRegister(name, email, password);
            }
        } catch (error) {
            showToast(`❌ ${error.message}`);
        } finally {
            setButtonLoading('emailSubmitBtn', false, 'Создать аккаунт');
        }
    }

    // ========== FIREBASE: EMAIL REGISTER ==========
    async function firebaseEmailRegister(name, email, password) {
        try {
            const cred = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
            const fbUser = cred.user;

            // Set display name
            await fbUser.updateProfile({ displayName: name });

            // Send email verification
            await _sendVerificationEmail(fbUser);

            // Save user in local demoUsers for role management
            const users = getDemoUsers();
            users[email.toLowerCase()] = {
                id: fbUser.uid,
                name: name,
                email: email,
                role: 'customer',
                emailVerified: false,
                createdAt: new Date().toISOString()
            };
            saveDemoUsers(users);

            onAuthSuccess({
                accessToken: await fbUser.getIdToken(),
                refreshToken: fbUser.refreshToken,
                expiresIn: 3600
            }, {
                uid: fbUser.uid,
                email: email,
                name: name,
                role: 'customer',
                emailVerified: false,
                isNewRegistration: true
            });
        } catch (err) {
            const msg = _firebaseErrorMessage(err.code);
            if (err.code === 'auth/email-already-in-use') {
                showToast('ℹ️ Аккаунт уже существует. Войдите по паролю.', 4000);
                setAuthMode(AuthMode.LOGIN);
                const el = $('#authEmail'); if (el) el.value = email;
                $('#authPassword')?.focus();
            } else {
                throw new Error(msg);
            }
        }
    }

    async function demoEmailRegister(name, email, password) {
        await delay(800);

        const users = getDemoUsers();

        if (users[email.toLowerCase()]) {
            // EMAIL_EXISTS - НЕ ошибка, а сценарий перехода к входу
            showToast('ℹ️ Аккаунт уже существует. Войдите по паролю.', 4000);
            setAuthMode(AuthMode.LOGIN);
            const authEmailEl2 = $('#authEmail'); if (authEmailEl2) authEmailEl2.value = email;
            $('#authPassword')?.focus();
            return;
        }

        // Create new user — hash password (SHA-256, client-side; production should use bcrypt on server)
        const hashedPwd = await _hashPassword(password);
        users[email.toLowerCase()] = {
            name: name,
            email: email,
            password: hashedPwd,
            role: 'customer',
            createdAt: new Date().toISOString()
        };
        saveDemoUsers(users);

        // Success!
        onAuthSuccess({
            accessToken: 'demo_token_' + Date.now(),
            refreshToken: 'demo_refresh_' + Date.now(),
            expiresIn: 7 * 24 * 60 * 60
        }, {
            email: email,
            name: name
        });
    }

    // ========== PHONE + PASSWORD AUTH ==========
    async function submitPhoneLogin() {
        clearAllErrors();

        const phone = getFullPhone();
        const password = $('#authPhonePassword')?.value;

        // Validate
        const phoneError = Validators.phone(phone);
        if (phoneError) {
            showFieldError('authPhone', phoneError);
            return;
        }
        if (!password || password.length < 4) {
            showFieldError('authPhonePassword', 'Введите пароль (минимум 4 символа)');
            return;
        }

        // Захватываем гостевые данные перед авторизацией
        if (window.GuestMigration) window.GuestMigration.capture();

        setButtonLoading('otpRequestBtn', true, 'Вход...');

        try {
            // 1) Try real backend API first
            let apiSuccess = false;
            try {
                const res = await fetch(API_BASE_URL + '/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone, password })
                });
                const data = await res.json();

                if (data.success && data.token) {
                    onAuthSuccess({
                        accessToken: data.token,
                        refreshToken: 'phone_refresh_' + Date.now(),
                        expiresIn: data.expiresIn || 900
                    }, {
                        uid: data.user?.id,
                        phone: data.user?.phone || phone,
                        name: data.user?.firstName || 'Пользователь',
                        role: data.user?.role || 'customer'
                    });
                    apiSuccess = true;
                } else if (res.status === 401) {
                    // Wrong password on real API — don't fallback, show error
                    const errMsg = data.error || 'Неверный телефон или пароль';
                    showFieldError('authPhonePassword', errMsg);
                    showToast('❌ ' + errMsg, 3000);
                    apiSuccess = true; // prevent demo fallback
                }
            } catch (apiErr) {
                console.warn('📱 API phone login failed, trying demo fallback:', apiErr.message);
            }

            // 2) If API didn't work, fallback to demo/localStorage
            if (!apiSuccess) {
                await demoPhoneLogin(phone, password);
            }
        } catch (err) {
            console.error('Phone login error:', err);
            showToast('❌ ' + (err.message || 'Ошибка входа'), 4000);
        } finally {
            setButtonLoading('otpRequestBtn', false, 'Войти');
        }
    }

    // ========== DEMO: PHONE LOGIN (localStorage) ==========
    async function demoPhoneLogin(phone, password) {
        await delay(600);

        // Seed team accounts if not yet present
        _seedTeamAccounts();

        const users = getDemoUsers();

        // Find user by phone number (try exact match and normalized)
        const normalizedPhone = phone.replace(/\D/g, '');
        let user = null;
        let userKey = null;

        for (const [key, u] of Object.entries(users)) {
            if (!u) continue;
            const uPhone = (u.phone || '').replace(/\D/g, '');
            if (uPhone === normalizedPhone || u.phone === phone) {
                user = u;
                userKey = key;
                break;
            }
        }

        if (!user) {
            showFieldError('authPhone', 'Аккаунт с этим номером не найден');
            showToast('ℹ️ Аккаунт не найден. Зарегистрируйтесь.', 4000);
            return;
        }

        if (user.blocked) {
            showFieldError('authPhone', 'Аккаунт заблокирован');
            showToast('🚫 Обратитесь в поддержку', 5000);
            return;
        }

        // Verify password: supports both hashed and plain text
        const passwordMatch = await _verifyPassword(password, user.password);
        if (!passwordMatch) {
            showFieldError('authPhonePassword', 'Неверный пароль');
            showToast('❌ Неверный пароль', 3000);
            return;
        }

        // Success!
        console.log('✅ Phone demo login successful:', phone, user.name);
        onAuthSuccess({
            accessToken: 'demo_phone_token_' + Date.now(),
            refreshToken: 'demo_phone_refresh_' + Date.now(),
            expiresIn: 7 * 24 * 60 * 60
        }, {
            phone: phone,
            name: user.name || 'Пользователь',
            role: user.role || 'customer',
            email: user.email || ''
        });
    }

    // ========== SEED TEAM ACCOUNTS ==========
    function _seedTeamAccounts() {
        const users = getDemoUsers();
        const teamAccounts = [
            { phone: '+77716983869', name: 'Управление', role: 'admin', password: '123456' },
            { phone: '+77014025364', name: 'Александр Эксковатор', role: 'executor', password: '123456' },
            { phone: '+77078441240', name: 'Володя Мастер', role: 'executor', password: '123456' },
            { phone: '+77000000000', name: 'Рабочий 1', role: 'worker', password: '123456' },
            { phone: '+77000000001', name: 'Рабочий 2', role: 'worker', password: '123456' }
        ];

        let changed = false;
        for (const account of teamAccounts) {
            const key = 'phone_' + account.phone;
            if (!users[key]) {
                users[key] = {
                    phone: account.phone,
                    name: account.name,
                    role: account.role,
                    password: account.password, // plain text for demo
                    createdAt: new Date().toISOString()
                };
                changed = true;
                console.log('📱 Seeded team account:', account.name, account.phone);
            }
        }

        if (changed) {
            saveDemoUsers(users);
        }
    }

    // ========== PHONE OTP AUTH (legacy) ==========
    async function requestOTP() {
        clearAllErrors();

        const phone = getFullPhone();
        const phoneError = Validators.phone(phone);

        if (phoneError) {
            showFieldError('authPhone', phoneError);
            return;
        }

        setButtonLoading('otpRequestBtn', true, 'Отправка...');

        try {
            // Rate limiting: max 3 OTP requests per 10 minutes
            const otpRateKey = 'otpRateLimit';
            const otpRate = Storage.getJSON(otpRateKey) || { count: 0, resetAt: 0 };
            const now = Date.now();
            if (now < otpRate.resetAt && otpRate.count >= 3) {
                const waitSec = Math.ceil((otpRate.resetAt - now) / 1000);
                showToast(`⏰ Слишком много попыток. Подождите ${waitSec} сек.`, 5000);
                return;
            }
            if (now >= otpRate.resetAt) {
                otpRate.count = 0;
                otpRate.resetAt = now + 10 * 60 * 1000; // 10 min window
            }
            otpRate.count++;
            Storage.setJSON(otpRateKey, otpRate);

            if (USE_FIREBASE) {
                await firebaseRequestOTP(phone);
            } else if (IS_DEMO_MODE) {
                await demoRequestOTP(phone);
            } else {
                await apiRequestOTP(phone);
            }
        } catch (error) {
            showToast(`❌ ${error.message}`);
        } finally {
            setButtonLoading('otpRequestBtn', false, 'Получить код');
        }
    }

    // ========== FIREBASE: PHONE OTP ==========
    async function firebaseRequestOTP(phone) {
        try {
            // Create invisible reCAPTCHA verifier
            if (!recaptchaVerifier) {
                recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                    size: 'invisible',
                    callback: () => { console.log('🔒 reCAPTCHA solved'); }
                });
            }

            const confirmation = await window.firebaseAuth.signInWithPhoneNumber(phone, recaptchaVerifier);
            firebaseConfirmation = confirmation;
            otpPhone = phone;

            // Show OTP step
            const ps1 = $('#phoneStep1'); if (ps1) ps1.hidden = true;
            const ps2 = $('#phoneStep2'); if (ps2) ps2.hidden = false;

            showToast('📱 Код отправлен на ' + phone, 5000);
            startResendTimer(60);
            $$('.otp-digit')[0]?.focus();
        } catch (err) {
            console.error('Firebase Phone Auth error:', err);
            // Reset reCAPTCHA on error
            if (recaptchaVerifier) {
                try { recaptchaVerifier.clear(); } catch(e) {}
                recaptchaVerifier = null;
            }
            throw new Error(_firebaseErrorMessage(err.code) || 'Ошибка отправки SMS');
        }
    }

    function getFullPhone() {
        const code = $('#phoneCode')?.value || '+7';
        const number = $('#authPhone')?.value.replace(/\D/g, '') || '';
        return code + number;
    }

    async function demoRequestOTP(phone) {
        // Try real API first
        if (window.API && window.API.Auth) {
            try {
                const result = await window.API.Auth.sendCode(phone);
                if (result.success) {
                    otpPhone = phone;

                    // Show OTP step
                    const ps1a = $('#phoneStep1'); if (ps1a) ps1a.hidden = true;
                    const ps2a = $('#phoneStep2'); if (ps2a) ps2a.hidden = false;

                    // In dev mode, API returns the code
                    if (result.data?.code) {
                        showToast(`📱 Код отправлен. Подсказка: ${result.data.code.toString().slice(0,2)}****`, 8000);
                        console.debug('📱 [DEMO] OTP Code:', result.data.code);
                        generatedOTP = result.data.code;
                    } else {
                        showToast('📱 Код отправлен на WhatsApp', 5000);
                    }

                    startResendTimer(60);
                    $$('.otp-digit')[0]?.focus();
                    return;
                } else {
                    showToast('❌ ' + result.error, 3000);
                    throw new Error(result.error);
                }
            } catch (e) {
                console.warn('API call failed, using demo mode:', e);
            }
        }

        // Fallback to demo mode
        await delay(1000);

        // Generate 6-digit code
        generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();
        otpPhone = phone;

        // Show OTP step
        const ps1b = $('#phoneStep1'); if (ps1b) ps1b.hidden = true;
        const ps2b = $('#phoneStep2'); if (ps2b) ps2b.hidden = false;

        // Show code hint (demo mode only, masked for safety)
        if (IS_DEMO_MODE) {
            showToast(`📱 Код отправлен. Подсказка: ${generatedOTP.slice(0,2)}****`, 8000);
            console.debug('📱 [DEMO] OTP Code:', generatedOTP);
        } else {
            showToast('📱 Код отправлен на ' + phone, 5000);
        }

        // Start resend timer
        startResendTimer(60);

        // Focus first OTP input
        $$('.otp-digit')[0]?.focus();
    }

    async function verifyOTP() {
        clearAllErrors();

        // ── Rate limiting: макс 5 попыток ввода OTP, потом блок 5 мин ──
        const verifyRateKey = 'otpVerifyRateLimit';
        const verifyRate = Storage.getJSON(verifyRateKey) || { attempts: 0, lockedUntil: 0 };
        const now = Date.now();

        if (now < verifyRate.lockedUntil) {
            const waitSec = Math.ceil((verifyRate.lockedUntil - now) / 1000);
            const waitMin = Math.ceil(waitSec / 60);
            showToast(`🔒 Слишком много попыток. Подождите ${waitMin} мин.`, 5000);
            return;
        }

        // Сброс после истечения блокировки
        if (now >= verifyRate.lockedUntil && verifyRate.attempts >= 5) {
            verifyRate.attempts = 0;
        }

        const otp = getOTPValue();
        const otpError = Validators.otp(otp);

        if (otpError) {
            showToast(`❌ ${otpError}`);
            return;
        }

        setButtonLoading('otpVerifyBtn', true, 'Проверка...');

        try {
            if (USE_FIREBASE && firebaseConfirmation) {
                await firebaseVerifyOTP(otp);
            } else if (IS_DEMO_MODE) {
                await demoVerifyOTP(otp);
            } else {
                await apiVerifyOTP(otpPhone, otp);
            }

            // Успех — сбрасываем счётчик
            Storage.remove(verifyRateKey);
        } catch (error) {
            // Ошибка — увеличиваем счётчик
            verifyRate.attempts++;
            if (verifyRate.attempts >= 5) {
                verifyRate.lockedUntil = now + 5 * 60 * 1000; // блок 5 мин
                showToast('🔒 Превышен лимит попыток. Аккаунт заблокирован на 5 минут.', 5000);
            } else {
                const remaining = 5 - verifyRate.attempts;
                showToast(`❌ ${error.message} (осталось ${remaining} попыт${remaining === 1 ? 'ка' : remaining < 5 ? 'ки' : 'ок'})`, 4000);
            }
            Storage.setJSON(verifyRateKey, verifyRate);
            clearOTPInputs();
        } finally {
            setButtonLoading('otpVerifyBtn', false, 'Подтвердить');
        }
    }

    // ========== FIREBASE: VERIFY OTP ==========
    async function firebaseVerifyOTP(otp) {
        try {
            const cred = await firebaseConfirmation.confirm(otp);
            const fbUser = cred.user;

            // Check if user exists in local storage
            const users = getDemoUsers();
            let localUser = Object.values(users).find(u => u.phone === otpPhone);

            if (!localUser) {
                // New phone user — save and show profile form
                const key = 'phone_' + otpPhone;
                users[key] = {
                    id: fbUser.uid,
                    phone: otpPhone,
                    role: 'customer',
                    createdAt: new Date().toISOString()
                };
                saveDemoUsers(users);

                // Need name — show profile form
                showProfileForm();
                return;
            }

            onAuthSuccess({
                accessToken: await fbUser.getIdToken(),
                refreshToken: fbUser.refreshToken,
                expiresIn: 3600
            }, {
                uid: fbUser.uid,
                phone: otpPhone,
                name: localUser.name || fbUser.displayName || '',
                role: localUser.role || 'customer'
            });
        } catch (err) {
            $$('.otp-digit').forEach(input => input.classList.add('error'));
            setTimeout(() => {
                $$('.otp-digit').forEach(input => input.classList.remove('error'));
            }, 1000);
            throw new Error('Неверный код');
        }
    }

    function getOTPValue() {
        return $$('.otp-digit').map(input => input.value).join('');
    }

    function clearOTPInputs() {
        $$('.otp-digit').forEach(input => {
            input.value = '';
            input.classList.remove('filled', 'error');
        });
        $$('.otp-digit')[0]?.focus();
    }

    async function demoVerifyOTP(otp) {
        // Try real API first
        if (window.API && window.API.Auth) {
            try {
                const result = await window.API.Auth.verifyCode(otpPhone, otp);
                if (result.success && result.data) {
                    // Success from real API
                    onAuthSuccess({
                        accessToken: result.data.accessToken,
                        refreshToken: result.data.refreshToken,
                        expiresIn: 7 * 24 * 60 * 60
                    }, result.data.user);
                    return;
                } else {
                    $$('.otp-digit').forEach(input => input.classList.add('error'));
                    showToast('❌ ' + (result.error || 'Неверный код'));
                    setTimeout(() => {
                        $$('.otp-digit').forEach(input => input.classList.remove('error'));
                    }, 1000);
                    throw new Error(result.error || 'Неверный код');
                }
            } catch (e) {
                console.warn('API verify failed, trying demo mode:', e);
                // Don't fallback for wrong code - just throw
                if (e.message.includes('Неверный код') || e.message.includes('Invalid')) {
                    throw e;
                }
            }
        }

        // Fallback to demo mode
        await delay(800);

        if (otp !== generatedOTP) {
            $$('.otp-digit').forEach(input => input.classList.add('error'));
            showToast('❌ Неверный код');
            setTimeout(() => {
                $$('.otp-digit').forEach(input => input.classList.remove('error'));
            }, 1000);
            throw new Error('Неверный код');
        }

        // Check if user exists
        const users = getDemoUsers();
        let user = Object.values(users).find(u => u.phone === otpPhone);

        if (!user) {
            // Create new user with phone
            const newUserId = 'phone_' + otpPhone;
            users[newUserId] = {
                phone: otpPhone,
                role: 'customer',
                createdAt: new Date().toISOString()
            };
            saveDemoUsers(users);
            user = users[newUserId];

            // NEED_PROFILE - показываем форму имени
            showProfileForm();
            return;
        }

        // Success!
        onAuthSuccess({
            accessToken: 'demo_token_' + Date.now(),
            refreshToken: 'demo_refresh_' + Date.now(),
            expiresIn: 7 * 24 * 60 * 60
        }, {
            phone: otpPhone,
            name: user.name
        });
    }

    function startResendTimer(seconds) {
        resendSeconds = seconds;
        const timerEl = $('#resendTimerText');
        const resendBtn = $('#resendOtpBtn');

        if (timerEl) timerEl.hidden = false;
        if (resendBtn) resendBtn.hidden = true;

        if (resendTimer) clearInterval(resendTimer);

        resendTimer = setInterval(() => {
            resendSeconds--;
            if (timerEl) timerEl.textContent = `Отправить повторно через ${resendSeconds} сек`;

            if (resendSeconds <= 0) {
                clearInterval(resendTimer);
                if (timerEl) timerEl.hidden = true;
                if (resendBtn) resendBtn.hidden = false;
            }
        }, 1000);
    }

    async function resendOTP() {
        await requestOTP();
    }

    function goBackToPhone() {
        const ps1c = $('#phoneStep1'); if (ps1c) ps1c.hidden = false;
        const ps2c = $('#phoneStep2'); if (ps2c) ps2c.hidden = true;
        clearOTPInputs();
        if (resendTimer) clearInterval(resendTimer);
    }

    // ========== OAUTH ==========
    async function oauthContinue(provider) {
        showToast(`🔄 Вход через ${provider}...`);

        try {
            if (USE_FIREBASE) {
                await firebaseOAuth(provider);
            } else if (IS_DEMO_MODE) {
                await demoOAuth(provider);
            } else {
                await apiOAuth(provider);
            }
        } catch (error) {
            showToast(`❌ ${error.message}`);
        }
    }

    // ========== FIREBASE: OAUTH ==========
    async function firebaseOAuth(provider) {
        let authProvider;

        switch (provider) {
            case 'Google':
                authProvider = new firebase.auth.GoogleAuthProvider();
                authProvider.addScope('email');
                authProvider.addScope('profile');
                break;
            case 'Apple':
                authProvider = new firebase.auth.OAuthProvider('apple.com');
                authProvider.addScope('email');
                authProvider.addScope('name');
                break;
            case 'GitHub':
                authProvider = new firebase.auth.GithubAuthProvider();
                break;
            case 'Telegram':
                // Telegram Login Widget — not native Firebase, use custom flow
                await _telegramOAuth();
                return;
            default:
                showToast(`ℹ️ Вход через ${provider} не поддерживается`, 3000);
                return;
        }

        try {
            const result = await window.firebaseAuth.signInWithPopup(authProvider);
            const fbUser = result.user;
            const email = fbUser.email || `${provider.toLowerCase()}_${fbUser.uid}@qazgost.kz`;

            // Save/update in local users
            const users = getDemoUsers();
            if (!users[email.toLowerCase()]) {
                users[email.toLowerCase()] = {
                    id: fbUser.uid,
                    name: fbUser.displayName || `${provider} User`,
                    email: email,
                    provider: provider,
                    role: 'customer',
                    createdAt: new Date().toISOString()
                };
                saveDemoUsers(users);
            }

            const localUser = users[email.toLowerCase()];

            onAuthSuccess({
                accessToken: await fbUser.getIdToken(),
                refreshToken: fbUser.refreshToken,
                expiresIn: 3600
            }, {
                uid: fbUser.uid,
                email: email,
                name: fbUser.displayName || localUser.name || `${provider} User`,
                phone: fbUser.phoneNumber || '',
                role: localUser.role || 'customer',
                provider: provider
            });
        } catch (err) {
            if (err.code === 'auth/popup-closed-by-user') {
                showToast('ℹ️ Вход отменён', 2000);
                return;
            }
            throw new Error(_firebaseErrorMessage(err.code) || `Ошибка входа через ${provider}`);
        }
    }

    async function demoOAuth(provider) {
        await delay(1500);

        const mockEmail = `demo_${provider.toLowerCase()}@example.com`;
        const mockName = `${provider} User`;

        // Check if email exists
        const users = getDemoUsers();
        let user = users[mockEmail];

        if (!user) {
            // Create new OAuth user
            users[mockEmail] = {
                name: mockName,
                email: mockEmail,
                provider: provider,
                socialOnly: true,
                createdAt: new Date().toISOString()
            };
            saveDemoUsers(users);
            user = users[mockEmail];
        }

        onAuthSuccess({
            accessToken: 'demo_oauth_' + Date.now(),
            refreshToken: 'demo_refresh_' + Date.now(),
            expiresIn: 7 * 24 * 60 * 60
        }, {
            email: mockEmail,
            name: mockName,
            provider: provider
        });
    }

    // ========== TELEGRAM OAUTH ==========
    // Конфигурация Telegram Bot для Login Widget
    const TELEGRAM_BOT_NAME = window.TELEGRAM_BOT_NAME || 'QazGostBot';
    const TELEGRAM_AUTH_TIMEOUT = 120000; // 2 минуты на вход

    /**
     * Полный flow входа через Telegram:
     * 1. Открывает popup с Telegram Login Widget
     * 2. Пользователь авторизуется в Telegram
     * 3. Callback приходит через postMessage / window.onTelegramAuth
     * 4. Создаём сессию (Firebase custom token / demo)
     */
    async function _telegramOAuth() {
        return new Promise((resolve, reject) => {
            // Показываем модалку ожидания
            _showTelegramAuthUI();

            // Глобальный callback для Telegram Widget
            window.onTelegramAuth = async function (tgUser) {
                console.log('📱 Telegram auth callback:', tgUser);
                _hideTelegramAuthUI();

                try {
                    await _processTelegramAuth(tgUser);
                    resolve();
                } catch (err) {
                    reject(err);
                }
            };

            // Слушаем postMessage от popup (альтернативный механизм)
            // Безопасность: принимаем только от своего origin или data: popup
            const trustedOrigin = window.location.origin;
            const messageHandler = async (event) => {
                // Проверка origin: принимаем свой домен, data: (popup), null (data: URL)
                const isTrusted = event.origin === trustedOrigin
                    || event.origin === 'null'   // data: URL popup возвращает origin 'null'
                    || event.origin === '';       // некоторые браузеры для data:
                if (!isTrusted) {
                    console.warn('⚠️ Telegram auth: rejected postMessage from untrusted origin:', event.origin);
                    return;
                }
                if (event.data?.type === 'telegram-auth' && event.data?.user) {
                    window.removeEventListener('message', messageHandler);
                    window.onTelegramAuth(event.data.user);
                }
            };
            window.addEventListener('message', messageHandler);

            // Открываем popup с виджетом
            const popupUrl = _buildTelegramPopupUrl();
            const popup = window.open(
                popupUrl,
                'telegram_auth',
                'width=550,height=470,scrollbars=no,resizable=no,left=' +
                    (screen.width / 2 - 275) + ',top=' + (screen.height / 2 - 235)
            );

            // Fallback: если popup заблокирован — инъектируем виджет inline
            if (!popup || popup.closed) {
                console.log('📱 Popup blocked, using inline Telegram widget');
                _injectTelegramWidget();
                return;
            }

            // Таймаут
            const timeout = setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                _hideTelegramAuthUI();
                if (popup && !popup.closed) popup.close();
                reject(new Error('Время ожидания входа через Telegram истекло'));
            }, TELEGRAM_AUTH_TIMEOUT);

            // Проверяем закрытие popup
            const pollClosed = setInterval(() => {
                if (popup.closed) {
                    clearInterval(pollClosed);
                    clearTimeout(timeout);
                    window.removeEventListener('message', messageHandler);
                    // Даем 2 секунды на callback (может прийти с задержкой)
                    setTimeout(() => {
                        if (document.getElementById('telegramAuthOverlay')) {
                            _hideTelegramAuthUI();
                            showToast('ℹ️ Вход через Telegram отменён', 2000);
                        }
                    }, 2000);
                }
            }, 500);
        });
    }

    /**
     * Обработка данных пользователя из Telegram
     */
    async function _processTelegramAuth(tgUser) {
        // tgUser = { id, first_name, last_name?, username?, photo_url?, auth_date, hash }
        const tgId = tgUser.id;
        const name = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(' ');
        const username = tgUser.username || '';
        const email = `tg_${tgId}@telegram.qazgost.kz`;
        const photoUrl = tgUser.photo_url || '';

        // ── Попытка верификации через бэкенд (продакшен) ──
        const API_BASE = window.API_BASE || '';
        if (API_BASE) {
            try {
                const response = await fetch(`${API_BASE}/api/auth/telegram/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(tgUser)
                });
                if (response.ok) {
                    const data = await response.json();
                    // Бэкенд вернул Firebase custom token
                    if (data.firebaseToken && window.firebaseAuth) {
                        const cred = await window.firebaseAuth.signInWithCustomToken(data.firebaseToken);
                        const fbUser = cred.user;
                        await fbUser.updateProfile({ displayName: name, photoURL: photoUrl });

                        const users = getDemoUsers();
                        if (!users[email.toLowerCase()]) {
                            users[email.toLowerCase()] = {
                                id: fbUser.uid,
                                name, email, username,
                                provider: 'Telegram',
                                telegramId: tgId,
                                role: 'customer',
                                emailVerified: true,
                                createdAt: new Date().toISOString()
                            };
                            saveDemoUsers(users);
                        }

                        onAuthSuccess({
                            accessToken: await fbUser.getIdToken(),
                            refreshToken: fbUser.refreshToken,
                            expiresIn: 3600
                        }, {
                            uid: fbUser.uid,
                            email, name, username,
                            role: users[email.toLowerCase()]?.role || 'customer',
                            provider: 'Telegram',
                            photoUrl,
                            emailVerified: true
                        });
                        return;
                    }

                    // Бэкенд вернул свой токен (без Firebase)
                    if (data.accessToken) {
                        onAuthSuccess({
                            accessToken: data.accessToken,
                            refreshToken: data.refreshToken || '',
                            expiresIn: data.expiresIn || 3600
                        }, {
                            uid: data.uid || `tg_${tgId}`,
                            email, name, username,
                            role: data.role || 'customer',
                            provider: 'Telegram',
                            photoUrl,
                            emailVerified: true
                        });
                        return;
                    }
                }
            } catch (err) {
                console.warn('Telegram backend auth failed, falling back to demo:', err.message);
            }
        }

        // ── Fallback: Demo-mode авторизация ──
        const users = getDemoUsers();
        const userKey = email.toLowerCase();

        if (!users[userKey]) {
            users[userKey] = {
                name, email, username,
                provider: 'Telegram',
                telegramId: tgId,
                socialOnly: true,
                role: 'customer',
                createdAt: new Date().toISOString()
            };
            saveDemoUsers(users);
        }

        const localUser = users[userKey];

        onAuthSuccess({
            accessToken: 'tg_token_' + tgId + '_' + Date.now(),
            refreshToken: 'tg_refresh_' + Date.now(),
            expiresIn: 7 * 24 * 60 * 60
        }, {
            uid: `tg_${tgId}`,
            email, name, username,
            role: localUser.role || 'customer',
            provider: 'Telegram',
            photoUrl,
            emailVerified: true
        });
    }

    /**
     * Генерация URL для popup с Telegram Login Widget
     */
    function _buildTelegramPopupUrl() {
        const origin = window.location.origin;
        const callbackPage = `${origin}/telegram-auth-callback.html`;

        // Inline HTML popup если callback страницы нет
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Вход через Telegram</title>
    <style>
        body { font-family: -apple-system, sans-serif; display: flex; flex-direction: column;
               align-items: center; justify-content: center; min-height: 100vh; margin: 0;
               background: linear-gradient(135deg, #0a0a1a, #1a1a2e); color: #fff; }
        h2 { margin-bottom: 20px; font-weight: 600; }
        .hint { color: rgba(255,255,255,0.5); font-size: 14px; margin-top: 20px; }
        #tg-widget { min-height: 50px; }
    </style>
</head>
<body>
    <h2>✈️ Вход через Telegram</h2>
    <div id="tg-widget"></div>
    <div class="hint">Нажмите кнопку для авторизации</div>
    <script>
        function onTelegramAuth(user) {
            if (window.opener) {
                window.opener.postMessage({ type: 'telegram-auth', user: user }, '*');
                setTimeout(function() { window.close(); }, 500);
            }
        }
        var s = document.createElement('script');
        s.src = 'https://telegram.org/js/telegram-widget.js?22';
        s.async = true;
        s.setAttribute('data-telegram-login', '${TELEGRAM_BOT_NAME}');
        s.setAttribute('data-size', 'large');
        s.setAttribute('data-radius', '12');
        s.setAttribute('data-onauth', 'onTelegramAuth(user)');
        s.setAttribute('data-request-access', 'write');
        document.getElementById('tg-widget').appendChild(s);
    </script>
</body>
</html>`;

        return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
    }

    /**
     * Инъекция виджета прямо в auth overlay (для мобильных / если popup заблокирован)
     */
    function _injectTelegramWidget() {
        const overlay = document.getElementById('telegramAuthOverlay');
        if (!overlay) return;

        const container = overlay.querySelector('.telegram-widget-container');
        if (!container) return;

        container.innerHTML = '<div id="tg-inline-widget"></div>';

        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-widget.js?22';
        script.async = true;
        script.setAttribute('data-telegram-login', TELEGRAM_BOT_NAME);
        script.setAttribute('data-size', 'large');
        script.setAttribute('data-radius', '12');
        script.setAttribute('data-onauth', 'onTelegramAuth(user)');
        script.setAttribute('data-request-access', 'write');
        container.appendChild(script);
    }

    /**
     * UI ожидания Telegram (overlay поверх auth screen)
     */
    function _showTelegramAuthUI() {
        // Убрать существующий если есть
        _hideTelegramAuthUI();

        const overlay = document.createElement('div');
        overlay.id = 'telegramAuthOverlay';
        overlay.className = 'telegram-auth-overlay';
        overlay.innerHTML = `
            <div class="telegram-auth-card">
                <div class="telegram-auth-close" onclick="
                    document.getElementById('telegramAuthOverlay')?.remove();
                ">✕</div>
                <div class="telegram-auth-icon">✈️</div>
                <div class="telegram-auth-title">Вход через Telegram</div>
                <div class="telegram-auth-subtitle">
                    Откроется окно авторизации Telegram.<br>
                    Подтвердите вход в вашем аккаунте.
                </div>
                <div class="telegram-widget-container">
                    <div class="telegram-auth-spinner"></div>
                    <div class="telegram-auth-hint">Открываем Telegram Login...</div>
                </div>
                <div class="telegram-auth-footer">
                    Если окно не открылось —
                    <a href="#" onclick="event.preventDefault(); window.AuthEngine._injectTgWidget();">
                        нажмите здесь
                    </a>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('visible'));
    }

    function _hideTelegramAuthUI() {
        const overlay = document.getElementById('telegramAuthOverlay');
        if (overlay) {
            overlay.classList.remove('visible');
            overlay.classList.add('hiding');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // ========== PROFILE COMPLETION ==========
    function showProfileForm() {
        const ps2d = $('#phoneStep2'); if (ps2d) ps2d.hidden = true;
        const profStep = $('#profileStep'); if (profStep) profStep.hidden = false;
        $('#profileName')?.focus();
    }

    async function submitProfile() {
        const name = $('#profileName')?.value.trim();
        const nameError = Validators.name(name);

        if (nameError) {
            showFieldError('profileName', nameError);
            return;
        }

        setButtonLoading('profileSubmitBtn', true, 'Сохранение...');

        try {
            await delay(500);

            // Update user in demo storage
            const users = getDemoUsers();
            const userId = 'phone_' + otpPhone;
            if (users[userId]) {
                users[userId].name = name;
                saveDemoUsers(users);
            }

            onAuthSuccess({
                accessToken: 'demo_token_' + Date.now(),
                refreshToken: 'demo_refresh_' + Date.now(),
                expiresIn: 7 * 24 * 60 * 60
            }, {
                phone: otpPhone,
                name: name
            });
        } finally {
            setButtonLoading('profileSubmitBtn', false, 'Продолжить');
        }
    }

    // ========== EMAIL VERIFICATION ==========
    let _verificationCooldown = 0;
    let _verificationCooldownTimer = null;

    /**
     * Отправка письма верификации через Firebase
     */
    async function _sendVerificationEmail(fbUser) {
        try {
            await fbUser.sendEmailVerification({
                url: window.location.origin + window.location.pathname,
                handleCodeInApp: false
            });
            console.log('📧 Verification email sent to:', fbUser.email);
        } catch (err) {
            console.warn('⚠️ Failed to send verification email:', err.code, err.message);
            // Не блокируем регистрацию — верификация не обязательна для входа
        }
    }

    /**
     * Повторная отправка верификации (public API)
     */
    async function resendVerification() {
        if (_verificationCooldown > 0) {
            showToast(`⏳ Повторная отправка через ${_verificationCooldown} сек`, 2000);
            return { success: false, cooldown: _verificationCooldown };
        }

        if (!USE_FIREBASE || !window.firebaseAuth?.currentUser) {
            showToast('ℹ️ Верификация доступна только с Firebase', 3000);
            return { success: false, error: 'no_firebase' };
        }

        const fbUser = window.firebaseAuth.currentUser;

        if (fbUser.emailVerified) {
            Storage.set('emailVerified', 'true');
            _dismissVerificationBanner();
            showToast('✅ Email уже подтверждён!', 3000);
            return { success: true, alreadyVerified: true };
        }

        try {
            await fbUser.sendEmailVerification({
                url: window.location.origin + window.location.pathname,
                handleCodeInApp: false
            });

            showToast(`📧 Письмо отправлено на ${_maskEmail(fbUser.email)}`, 5000);
            _startVerificationCooldown(60);
            _updateBannerResendState();

            return { success: true };
        } catch (err) {
            console.error('Resend verification error:', err);
            if (err.code === 'auth/too-many-requests') {
                showToast('⏳ Слишком много запросов. Подождите немного', 4000);
                _startVerificationCooldown(120);
            } else {
                showToast(`❌ Ошибка: ${_firebaseErrorMessage(err.code)}`, 4000);
            }
            return { success: false, error: err.code };
        }
    }

    /**
     * Проверка текущего статуса верификации (reload Firebase user)
     */
    async function checkVerificationStatus() {
        if (!USE_FIREBASE || !window.firebaseAuth?.currentUser) {
            return { verified: true }; // demo/api mode — считаем верифицированным
        }

        const fbUser = window.firebaseAuth.currentUser;

        try {
            // Перезагрузить данные пользователя с сервера Firebase
            await fbUser.reload();

            if (fbUser.emailVerified) {
                Storage.set('emailVerified', 'true');

                // Обновить в localStorage
                const email = (fbUser.email || '').toLowerCase();
                const users = getDemoUsers();
                if (users[email]) {
                    users[email].emailVerified = true;
                    saveDemoUsers(users);
                }

                // Обновить currentUser
                if (window.currentUser) {
                    window.currentUser.emailVerified = true;
                }

                _dismissVerificationBanner();
                showToast('✅ Email успешно подтверждён!', 5000);
                return { verified: true, justVerified: true };
            } else {
                return { verified: false };
            }
        } catch (err) {
            console.warn('Check verification error:', err);
            return { verified: false, error: err.message };
        }
    }

    /**
     * Баннер верификации (non-blocking, top of page)
     */
    function _showVerificationBanner(email, isNewRegistration = false) {
        // Не показывать если уже есть или уже верифицирован
        if (document.getElementById('emailVerificationBanner')) return;
        if (Storage.get('emailVerified') === 'true') return;
        if (Storage.get('verificationBannerDismissed') === 'true') return;

        const maskedEmail = _maskEmail(email);

        const banner = document.createElement('div');
        banner.id = 'emailVerificationBanner';
        banner.className = 'verification-banner';
        banner.innerHTML = `
            <div class="verification-banner-content">
                <div class="verification-banner-icon">${isNewRegistration ? '🎉' : '📧'}</div>
                <div class="verification-banner-text">
                    <div class="verification-banner-title">
                        ${isNewRegistration ? 'Аккаунт создан! Подтвердите email' : 'Подтвердите ваш email'}
                    </div>
                    <div class="verification-banner-subtitle">
                        Письмо отправлено на <strong>${maskedEmail}</strong>
                    </div>
                </div>
                <div class="verification-banner-actions">
                    <button class="verification-resend-btn" id="verificationResendBtn"
                            onclick="AuthEngine.resendVerification()">
                        🔄 Отправить ещё
                    </button>
                    <button class="verification-check-btn"
                            onclick="AuthEngine.checkVerificationStatus()">
                        ✅ Я подтвердил
                    </button>
                    <button class="verification-dismiss-btn"
                            onclick="AuthEngine.dismissVerificationBanner()"
                            title="Скрыть">✕</button>
                </div>
            </div>
            <div class="verification-cooldown-text" id="verificationCooldownText" hidden></div>
        `;

        // Вставить сверху, после mainHeader
        const mainHeader = document.getElementById('mainHeader');
        if (mainHeader && mainHeader.nextSibling) {
            mainHeader.parentNode.insertBefore(banner, mainHeader.nextSibling);
        } else {
            document.body.prepend(banner);
        }

        // Плавное появление
        requestAnimationFrame(() => {
            banner.classList.add('visible');
        });
    }

    function _dismissVerificationBanner() {
        const banner = document.getElementById('emailVerificationBanner');
        if (banner) {
            banner.classList.remove('visible');
            banner.classList.add('hiding');
            setTimeout(() => banner.remove(), 400);
        }
        Storage.set('verificationBannerDismissed', 'true');

        // Остановить cooldown
        if (_verificationCooldownTimer) {
            clearInterval(_verificationCooldownTimer);
            _verificationCooldownTimer = null;
            _verificationCooldown = 0;
        }
    }

    function _startVerificationCooldown(seconds) {
        _verificationCooldown = seconds;

        if (_verificationCooldownTimer) clearInterval(_verificationCooldownTimer);

        _verificationCooldownTimer = setInterval(() => {
            _verificationCooldown--;
            _updateBannerResendState();

            if (_verificationCooldown <= 0) {
                clearInterval(_verificationCooldownTimer);
                _verificationCooldownTimer = null;
            }
        }, 1000);

        _updateBannerResendState();
    }

    function _updateBannerResendState() {
        const btn = document.getElementById('verificationResendBtn');
        const cooldownText = document.getElementById('verificationCooldownText');

        if (_verificationCooldown > 0) {
            if (btn) { btn.disabled = true; btn.textContent = `⏳ ${_verificationCooldown}с`; }
            if (cooldownText) {
                cooldownText.hidden = false;
                cooldownText.textContent = `Повторная отправка через ${_verificationCooldown} сек`;
            }
        } else {
            if (btn) { btn.disabled = false; btn.textContent = '🔄 Отправить ещё'; }
            if (cooldownText) cooldownText.hidden = true;
        }
    }

    // ========== PASSWORD RESET ==========
    let _resetCooldown = 0;
    let _resetCooldownTimer = null;

    async function requestPasswordReset() {
        const email = $('#resetEmail')?.value.trim();
        const emailError = Validators.email(email);

        if (emailError) {
            showFieldError('resetEmail', emailError);
            return;
        }

        // Cooldown — не дать спамить запросами
        if (_resetCooldown > 0) {
            showToast(`⏳ Повторная отправка через ${_resetCooldown} сек`, 2000);
            return;
        }

        setButtonLoading('resetSubmitBtn', true, 'Отправка...');
        clearFieldError('resetEmail');

        try {
            if (USE_FIREBASE) {
                await _firebasePasswordReset(email);
            } else if (IS_DEMO_MODE) {
                await _demoPasswordReset(email);
            } else {
                await _apiPasswordReset(email);
            }
        } catch (error) {
            showToast(`❌ ${error.message}`, 4000);
        } finally {
            setButtonLoading('resetSubmitBtn', false, 'Отправить');
        }
    }

    // ========== FIREBASE: PASSWORD RESET ==========
    async function _firebasePasswordReset(email) {
        try {
            // Firebase отправляет реальное письмо для сброса пароля
            await window.firebaseAuth.sendPasswordResetEmail(email, {
                // URL, куда пользователь вернётся после сброса
                url: window.location.origin + window.location.pathname,
                handleCodeInApp: false
            });

            console.log('✅ Firebase password reset email sent to:', email);
            _showResetSuccessState(email);
            _startResetCooldown(60);

        } catch (err) {
            console.warn('Firebase password reset error:', err.code, err.message);

            switch (err.code) {
                case 'auth/user-not-found':
                    // Безопасность: не раскрываем существует ли email
                    // Показываем тот же успех, что и при реальной отправке
                    _showResetSuccessState(email);
                    _startResetCooldown(60);
                    break;
                case 'auth/invalid-email':
                    showFieldError('resetEmail', 'Некорректный email');
                    break;
                case 'auth/too-many-requests':
                    showFieldError('resetEmail', 'Слишком много запросов. Попробуйте позже');
                    _startResetCooldown(120);
                    break;
                case 'auth/network-request-failed':
                    throw new Error('Ошибка сети. Проверьте подключение к интернету');
                default:
                    throw new Error(_firebaseErrorMessage(err.code));
            }
        }
    }

    // ========== API: PASSWORD RESET ==========
    async function _apiPasswordReset(email) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (response.ok) {
                _showResetSuccessState(email);
                _startResetCooldown(60);
            } else {
                throw new Error(data.error || 'Ошибка сервера');
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                // Сервер не отвечает — fallback to demo
                console.warn('API reset timeout — falling back to demo');
                await _demoPasswordReset(email);
            } else {
                throw err;
            }
        }
    }

    // ========== DEMO: PASSWORD RESET ==========
    async function _demoPasswordReset(email) {
        await delay(800);

        const users = getDemoUsers();
        const user = users[email.toLowerCase()];

        if (!user) {
            // Безопасность: не раскрываем, что email не найден
            _showResetSuccessState(email);
            _startResetCooldown(60);
            return;
        }

        // В демо-режиме предлагаем задать новый пароль прямо здесь
        _showDemoResetForm(email);
    }

    // ========== UI: СОСТОЯНИЕ «ПИСЬМО ОТПРАВЛЕНО» ==========
    function _showResetSuccessState(email) {
        const section = $('#resetPasswordSection');
        if (!section) return;

        // Маскируем email для приватности
        const maskedEmail = _maskEmail(email);

        section.innerHTML = `
            <button class="auth-back-btn" onclick="AuthEngine.goBackToLogin()">← Назад</button>
            
            <div class="reset-success-state">
                <div class="reset-success-icon">📧</div>
                <h2 class="auth-form-title">Письмо отправлено!</h2>
                <p class="auth-form-subtitle">
                    Инструкции для сброса пароля отправлены на<br>
                    <strong>${maskedEmail}</strong>
                </p>
                
                <div class="reset-instructions">
                    <div class="reset-instruction-item">
                        <span class="reset-step-num">1</span>
                        <span>Проверьте почту (и папку «Спам»)</span>
                    </div>
                    <div class="reset-instruction-item">
                        <span class="reset-step-num">2</span>
                        <span>Нажмите ссылку в письме</span>
                    </div>
                    <div class="reset-instruction-item">
                        <span class="reset-step-num">3</span>
                        <span>Задайте новый пароль</span>
                    </div>
                </div>

                <div class="reset-resend-area">
                    <span id="resetCooldownText" class="reset-cooldown-text"></span>
                    <button class="auth-btn secondary" id="resetResendBtn" onclick="AuthEngine._resendReset('${email}')" hidden>
                        <span>🔄 Отправить повторно</span>
                    </button>
                </div>

                <button class="auth-btn primary" onclick="AuthEngine.goBackToLogin()" style="margin-top:1rem">
                    <span>← Вернуться к входу</span>
                </button>
            </div>
        `;
    }

    // ========== UI: ДЕМО — ФОРМА СМЕНЫ ПАРОЛЯ НАПРЯМУЮ ==========
    function _showDemoResetForm(email) {
        const section = $('#resetPasswordSection');
        if (!section) return;

        section.innerHTML = `
            <button class="auth-back-btn" onclick="AuthEngine.goBackToLogin()">← Назад</button>
            
            <h2 class="auth-form-title">🔑 Новый пароль</h2>
            <p class="auth-form-subtitle">
                Демо-режим: задайте новый пароль для <strong>${_maskEmail(email)}</strong>
            </p>

            <div class="auth-field">
                <label for="resetNewPassword">Новый пароль</label>
                <div class="password-wrapper">
                    <input type="password" id="resetNewPassword" class="auth-input" 
                           placeholder="Минимум 6 символов" autocomplete="new-password">
                    <button type="button" class="password-toggle" 
                            onclick="togglePassword('resetNewPassword', this)">👁️</button>
                </div>
                <span class="field-error" id="resetNewPasswordError" hidden></span>
            </div>

            <div class="auth-field">
                <label for="resetNewPasswordConfirm">Подтвердите пароль</label>
                <input type="password" id="resetNewPasswordConfirm" class="auth-input" 
                       placeholder="Повторите пароль" autocomplete="new-password">
                <span class="field-error" id="resetNewPasswordConfirmError" hidden></span>
            </div>

            <button class="auth-btn primary" id="resetNewPassBtn" 
                    onclick="AuthEngine._submitDemoReset('${email.replace(/'/g, "\\'")}')">
                <span>Сохранить пароль</span>
                <span class="btn-arrow">→</span>
            </button>
        `;

        setTimeout(() => $('#resetNewPassword')?.focus(), 100);
    }

    // ========== ДЕМО: СОХРАНЕНИЕ НОВОГО ПАРОЛЯ ==========
    async function _submitDemoReset(email) {
        const newPass = $('#resetNewPassword')?.value;
        const confirmPass = $('#resetNewPasswordConfirm')?.value;

        let hasError = false;
        const passError = Validators.password(newPass);
        if (passError) {
            showFieldError('resetNewPassword', passError);
            hasError = true;
        }
        const confirmError = Validators.passwordConfirm(newPass, confirmPass);
        if (confirmError) {
            showFieldError('resetNewPasswordConfirm', confirmError);
            hasError = true;
        }
        if (hasError) return;

        setButtonLoading('resetNewPassBtn', true, 'Сохранение...');

        try {
            await delay(600);

            // Обновляем пароль в demo-базе
            const users = getDemoUsers();
            if (users[email.toLowerCase()]) {
                users[email.toLowerCase()].password = newPass;
                users[email.toLowerCase()].passwordUpdatedAt = new Date().toISOString();
                saveDemoUsers(users);
            }

            showToast('✅ Пароль успешно изменён!', 4000);
            
            // Возвращаем стандартную форму и переходим к входу
            _restoreResetSection();
            goBackToLogin();

            // Подставляем email в поле входа
            setTimeout(() => {
                const el = $('#authEmail');
                if (el) el.value = email;
                $('#authPassword')?.focus();
            }, 200);

        } finally {
            setButtonLoading('resetNewPassBtn', false, 'Сохранить пароль');
        }
    }

    // ========== ПОВТОРНАЯ ОТПРАВКА ==========
    async function _resendReset(email) {
        if (_resetCooldown > 0) return;
        
        setButtonLoading('resetResendBtn', true, 'Отправка...');
        try {
            if (USE_FIREBASE) {
                await _firebasePasswordReset(email);
            } else {
                await _demoPasswordReset(email);
            }
        } catch (error) {
            showToast(`❌ ${error.message}`, 3000);
        } finally {
            setButtonLoading('resetResendBtn', false, '🔄 Отправить повторно');
        }
    }

    // ========== COOLDOWN ТАЙМЕР ==========
    function _startResetCooldown(seconds) {
        _resetCooldown = seconds;
        const textEl = () => $('#resetCooldownText');
        const btnEl = () => $('#resetResendBtn');

        const t = textEl();
        const b = btnEl();
        if (t) { t.hidden = false; t.textContent = `Повторная отправка через ${_resetCooldown} сек`; }
        if (b) b.hidden = true;

        if (_resetCooldownTimer) clearInterval(_resetCooldownTimer);

        _resetCooldownTimer = setInterval(() => {
            _resetCooldown--;
            const ct = textEl();
            if (ct) ct.textContent = `Повторная отправка через ${_resetCooldown} сек`;

            if (_resetCooldown <= 0) {
                clearInterval(_resetCooldownTimer);
                _resetCooldownTimer = null;
                const ct2 = textEl();
                const cb = btnEl();
                if (ct2) ct2.hidden = true;
                if (cb) cb.hidden = false;
            }
        }, 1000);
    }

    // ========== УТИЛИТЫ СБРОСА ==========
    function _maskEmail(email) {
        const [local, domain] = email.split('@');
        if (!domain) return email;
        const masked = local.length <= 2 
            ? local[0] + '•••' 
            : local[0] + '•'.repeat(Math.min(local.length - 2, 5)) + local.slice(-1);
        return masked + '@' + domain;
    }

    function _restoreResetSection() {
        const section = $('#resetPasswordSection');
        if (!section) return;

        section.innerHTML = `
            <button class="auth-back-btn" onclick="AuthEngine.goBackToLogin()">← Назад</button>

            <h2 class="auth-form-title">Восстановление пароля</h2>
            <p class="auth-form-subtitle">Введите email для получения инструкций</p>

            <div class="auth-field">
                <label for="resetEmail">Email</label>
                <input type="email" id="resetEmail" class="auth-input" placeholder="user@example.com">
                <span class="field-error" id="resetEmailError" hidden></span>
            </div>

            <button class="auth-btn primary" id="resetSubmitBtn" onclick="AuthEngine.requestReset()">
                <span>Отправить</span>
                <span class="btn-arrow">→</span>
            </button>
        `;
        section.hidden = true;
    }

    function showResetForm() {
        // Скрыть все формы
        $$('.auth-method-form').forEach(f => f.hidden = true);
        
        // Восстановить стандартную разметку (если была заменена success state)
        _restoreResetSection();
        
        const resetSec = $('#resetPasswordSection');
        if (resetSec) resetSec.hidden = false;

        // Подставить email из формы входа, если он введён
        const loginEmail = $('#authEmail')?.value.trim();
        if (loginEmail) {
            const resetEmailEl = $('#resetEmail');
            if (resetEmailEl) resetEmailEl.value = loginEmail;
        }

        setTimeout(() => $('#resetEmail')?.focus(), 100);
    }

    function goBackToLogin() {
        // Остановить cooldown timer при уходе
        if (_resetCooldownTimer) {
            clearInterval(_resetCooldownTimer);
            _resetCooldownTimer = null;
        }

        // Восстановить reset section для следующего использования
        _restoreResetSection();

        // Показать email-форму
        $$('.auth-method-form').forEach(f => f.hidden = true);
        $$('.auth-form-section').forEach(s => s.hidden = true);
        const emailSec = $('#emailSection');
        if (emailSec) emailSec.hidden = false;
        setAuthMethod(AuthMethod.EMAIL_PASSWORD);
    }

    // ========== AUTH SUCCESS ==========
    function onAuthSuccess(tokens, user) {
        // Clear explicit logout flag (enables Firebase auto-login on refresh)
        Storage.remove('firebaseLoggedOut');

        // Save auth state
        Storage.set('authExpires', Date.now() + (tokens.expiresIn || 900) * 1000);
        Storage.set('isLoggedIn', 'true');

        // Save JWT token for apiService.js Bearer header
        if (tokens.accessToken && !tokens.accessToken.startsWith('demo_')) {
            Storage.set('authToken', tokens.accessToken);
        }

        // Save user info
        if (user.email) Storage.set('authEmail', user.email);
        if (user.phone) Storage.set('authPhone', user.phone);
        if (user.name) Storage.set('userName', user.name);
        if (user.role) Storage.set('userAccountRole', user.role);

        // Save email verification status
        if (user.email) {
            const verified = user.emailVerified !== undefined ? user.emailVerified : true;
            Storage.set('emailVerified', verified ? 'true' : 'false');
        }

        // Save last auth method
        Storage.set('lastAuthMethod', currentMethod);

        // Set global user
        window.currentUser = user;

        // === GUEST DATA MIGRATION ===
        if (window.GuestMigration) {
            const userId = user.uid || user.email || user.phone || 'unknown';
            window.GuestMigration.migrate(userId).catch(e => {
                console.warn('[Auth] Guest migration error:', e);
            });
        }

        // === ROLE-BASED ACCESS: set role from account ===
        const accountRole = user.role || 'customer';
        if (window.RoleManager) {
            if (accountRole === 'admin') {
                window.RoleManager.grantAllRoles();
                window.RoleManager.switchTo('admin', { showToast: false });
            } else {
                window.RoleManager.setRoles([accountRole]);
                window.RoleManager.switchTo(accountRole, { showToast: false });
            }
            _applyRoleToNav(accountRole);
        }

        showToast('✅ Вход выполнен успешно!');

        // Close auth screen after delay
        setTimeout(() => {
            completeAuth();

            // Show verification banner for unverified email users (non-blocking)
            if (user.email && user.emailVerified === false) {
                setTimeout(() => _showVerificationBanner(user.email, user.isNewRegistration), 600);
            }

            // Show onboarding wizard for new users
            if (user.isNewRegistration && window.OnboardingWizard) {
                setTimeout(() => window.OnboardingWizard.show(), 800);
            }
        }, 500);
    }

    /**
     * Show/hide nav role tabs based on user's account role
     */
    function _applyRoleToNav(role) {
        const navOrderer = document.getElementById('navRoleOrderer');
        const navContractor = document.getElementById('navRoleContractor');
        const navEngineer = document.getElementById('navRoleEngineer');
        const navAdmin = document.getElementById('navRoleAdmin');

        if (role === 'admin') {
            // Admin sees everything
            if (navOrderer) navOrderer.style.display = '';
            if (navContractor) navContractor.style.display = '';
            if (navEngineer) navEngineer.style.display = '';
            if (navAdmin) navAdmin.style.display = '';
        } else if (role === 'customer') {
            if (navOrderer) navOrderer.style.display = '';
            if (navContractor) navContractor.style.display = 'none';
            if (navEngineer) navEngineer.style.display = 'none';
            if (navAdmin) navAdmin.style.display = 'none';
        } else if (role === 'executor') {
            if (navOrderer) navOrderer.style.display = 'none';
            if (navContractor) navContractor.style.display = '';
            if (navEngineer) navEngineer.style.display = 'none';
            if (navAdmin) navAdmin.style.display = 'none';
        } else if (role === 'engineer') {
            if (navOrderer) navOrderer.style.display = 'none';
            if (navContractor) navContractor.style.display = 'none';
            if (navEngineer) navEngineer.style.display = '';
            if (navAdmin) navAdmin.style.display = 'none';
        }
    }

    function completeAuth() {
        const authScreen = $('#authScreen');
        if (authScreen) {
            authScreen.hidden = true;
        }

        // Reset form
        resetAuthForm();

        // Merge guest data if any
        mergeGuestData();

        // Show main header
        const mainHeader = $('#mainHeader');
        if (mainHeader) {
            mainHeader.hidden = false;
        }

        // ⚡ Обновить UI авторизации на лендинге и в хедере
        if (window.updateLandingAuthUI) {
            window.updateLandingAuthUI();
        }

        // Check if user has active tariff — if not, open wallet/payment page
        const hasTariff = window.WalletEngine && window.WalletEngine.getCurrentTariff();
        
        if (!hasTariff && window.showPage) {
            // No tariff — redirect to wallet to choose a plan
            window.showPage('wallet');
            setTimeout(() => {
                showToast('💳 Выберите тарифный план для начала работы');
            }, 800);
        } else if (window.showPage) {
            window.showPage('home');
        }
    }

    function resetAuthForm() {
        // Clear all inputs
        $$('.auth-input').forEach(input => input.value = '');
        clearAllErrors();
        clearOTPInputs();

        // Reset to step 1
        const step1 = $('#phoneStep1');
        const step2 = $('#phoneStep2');
        const profile = $('#profileStep');
        if (step1) step1.hidden = false;
        if (step2) step2.hidden = true;
        if (profile) profile.hidden = true;

        // Reset state
        generatedOTP = '';
        otpPhone = '';
        if (resendTimer) clearInterval(resendTimer);
    }

    function mergeGuestData() {
        const user = window.currentUser;
        if (!user) return;

        const userId = user.uid || user.email || Storage.get('authEmail') || 'unknown';
        const mergeLog = [];
        let totalMerged = 0;

        console.log('📦 mergeGuestData — начало слияния для', userId);

        // ── 1. Volume Calculations (userId: 'guest' → userId) ──
        try {
            const volRaw = localStorage.getItem('VOLUME_CALCULATIONS');
            if (volRaw) {
                const volumes = JSON.parse(volRaw);
                let retagged = 0;
                volumes.forEach(v => {
                    if (v.userId === 'guest') {
                        v.userId = userId;
                        v.mergedAt = new Date().toISOString();
                        retagged++;
                    }
                });
                if (retagged > 0) {
                    localStorage.setItem('VOLUME_CALCULATIONS', JSON.stringify(volumes));
                    mergeLog.push(`Расчёты объёмов: ${retagged} шт`);
                    totalMerged += retagged;
                }
            }
        } catch (e) { console.warn('Merge volumes error:', e); }

        // ── 2. Photo Estimates (no userId field, just adopt) ──
        try {
            const peRaw = localStorage.getItem('photoEstimates');
            if (peRaw) {
                const estimates = JSON.parse(peRaw);
                let retagged = 0;
                estimates.forEach(est => {
                    if (!est.userId || est.userId === 'guest') {
                        est.userId = userId;
                        est.mergedAt = new Date().toISOString();
                        retagged++;
                    }
                });
                if (retagged > 0) {
                    localStorage.setItem('photoEstimates', JSON.stringify(estimates));
                    mergeLog.push(`Фото-сметы: ${retagged} шт`);
                    totalMerged += retagged;
                }
            }
        } catch (e) { console.warn('Merge photo estimates error:', e); }

        // ── 3. Build Estimate Orders ──
        try {
            const ordersRaw = localStorage.getItem('buildEstimateOrders');
            if (ordersRaw) {
                const orders = JSON.parse(ordersRaw);
                let retagged = 0;
                orders.forEach(ord => {
                    if (!ord.userId || ord.userId === 'guest') {
                        ord.userId = userId;
                        ord.userEmail = user.email || '';
                        ord.userName = user.name || '';
                        ord.mergedAt = new Date().toISOString();
                        retagged++;
                    }
                });
                if (retagged > 0) {
                    localStorage.setItem('buildEstimateOrders', JSON.stringify(orders));
                    mergeLog.push(`Заказы: ${retagged} шт`);
                    totalMerged += retagged;
                }
            }
        } catch (e) { console.warn('Merge orders error:', e); }

        // ── 4. Customer Questionnaire (guest → userId) ──
        try {
            const guestQuestionnaire = localStorage.getItem('customerQuestionnaire_guest');
            if (guestQuestionnaire) {
                const targetKey = `customerQuestionnaire_${userId}`;
                // Не перезаписывать, если у пользователя уже есть анкета
                if (!localStorage.getItem(targetKey)) {
                    localStorage.setItem(targetKey, guestQuestionnaire);
                    mergeLog.push('Анкета заказчика: 1 шт');
                    totalMerged++;
                }
                localStorage.removeItem('customerQuestionnaire_guest');
            }
        } catch (e) { console.warn('Merge questionnaire error:', e); }

        // ── 5. Contracts ──
        try {
            const contractsRaw = localStorage.getItem('contracts');
            if (contractsRaw) {
                const contracts = JSON.parse(contractsRaw);
                let retagged = 0;
                contracts.forEach(c => {
                    if (!c.userId || c.userId === 'guest') {
                        c.userId = userId;
                        c.mergedAt = new Date().toISOString();
                        retagged++;
                    }
                });
                if (retagged > 0) {
                    localStorage.setItem('contracts', JSON.stringify(contracts));
                    mergeLog.push(`Договоры: ${retagged} шт`);
                    totalMerged += retagged;
                }
            }
        } catch (e) { console.warn('Merge contracts error:', e); }

        // ── 6. Disputes ──
        try {
            const disputesRaw = localStorage.getItem('disputes');
            if (disputesRaw) {
                const disputes = JSON.parse(disputesRaw);
                let retagged = 0;
                disputes.forEach(d => {
                    if (!d.userId || d.userId === 'guest') {
                        d.userId = userId;
                        d.mergedAt = new Date().toISOString();
                        retagged++;
                    }
                });
                if (retagged > 0) {
                    localStorage.setItem('disputes', JSON.stringify(disputes));
                    mergeLog.push(`Споры: ${retagged} шт`);
                    totalMerged += retagged;
                }
            }
        } catch (e) { console.warn('Merge disputes error:', e); }

        // ── 7. Photo Estimate Draft (pe_savedState) ──
        try {
            const peDraft = localStorage.getItem('pe_savedState');
            if (peDraft) {
                const draft = JSON.parse(peDraft);
                if (!draft.userId || draft.userId === 'guest') {
                    draft.userId = userId;
                    draft.mergedAt = new Date().toISOString();
                    localStorage.setItem('pe_savedState', JSON.stringify(draft));
                    mergeLog.push('Черновик фото-сметы: 1 шт');
                    totalMerged++;
                }
            }
        } catch (e) { console.warn('Merge PE draft error:', e); }

        // ── 8. Generic guestDrafts (legacy) ──
        const guestDrafts = Storage.getJSON('guestDrafts');
        if (guestDrafts) {
            mergeLog.push(`Гостевые черновики: ${Array.isArray(guestDrafts) ? guestDrafts.length : 1} шт`);
            totalMerged += Array.isArray(guestDrafts) ? guestDrafts.length : 1;
            Storage.remove('guestDrafts');
        }

        // ── 9. Set currentUserId for services that use it ──
        localStorage.setItem('currentUserId', userId);

        // ── 10. Attempt server sync (non-blocking) ──
        if (totalMerged > 0) {
            console.log(`✅ mergeGuestData — объединено ${totalMerged} записей:`, mergeLog);

            _syncMergedDataToServer(userId, mergeLog).catch(err => {
                console.warn('Server sync after merge failed (will retry later):', err.message);
            });
        } else {
            console.log('📦 mergeGuestData — нет гостевых данных для объединения');
        }
    }

    /**
     * Попытка синхронизации объединённых данных на сервер (non-blocking)
     */
    async function _syncMergedDataToServer(userId, mergeLog) {
        const API_BASE = window.API_BASE || '';
        if (!API_BASE) return; // Нет бэкенда — пропускаем

        try {
            const response = await fetch(`${API_BASE}/api/user/merge-guest-data`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    mergedItems: mergeLog,
                    timestamp: new Date().toISOString()
                })
            });

            if (response.ok) {
                console.log('☁️ Guest data synced to server successfully');
            } else {
                console.warn('☁️ Server sync returned:', response.status);
            }
        } catch (err) {
            // Server offline — data lives in localStorage, will sync later
            console.debug('☁️ Server sync skipped (offline):', err.message);
        }
    }

    // ========== LOGOUT ==========
    function logout() {
        // Mark as explicitly logged out (prevents Firebase auto-login)
        Storage.set('firebaseLoggedOut', 'true');

        // Firebase sign out
        if (USE_FIREBASE && window.firebaseAuth) {
            window.firebaseAuth.signOut().catch(e => console.warn('Firebase signOut error:', e));
        }

        // Токены хранятся в HttpOnly cookies — сервер очистит их через /auth/logout
        // Вызываем server-side logout (очистка cookies + revoke в БД)
        if (window.API && window.API.Auth) {
            window.API.Auth.logout().catch(e => console.warn('Server logout error:', e));
        }

        Storage.remove('authExpires');
        Storage.remove('isLoggedIn');
        Storage.remove('authPhone');
        Storage.remove('userName');
        Storage.remove('userAccountRole');
        Storage.remove('emailVerified');
        Storage.remove('verificationBannerDismissed');

        window.currentUser = null;

        // Remove verification banner if showing
        _dismissVerificationBanner();

        // Reset role-based nav visibility (show all for next login)
        _applyRoleToNav('admin');

        // Hide main header
        const mainHeader = $('#mainHeader');
        if (mainHeader) {
            mainHeader.hidden = true;
        }

        // Navigate to landing page — hide all pages, show landing
        const allPages = $$('.page');
        allPages.forEach(p => p.classList.remove('active'));
        const landingPage = $('#page-landing');
        if (landingPage) {
            landingPage.classList.add('active');
        }

        // Show auth screen (landing already visible, but auth modal should be ready)
        const authScreen = $('#authScreen');
        if (authScreen) {
            authScreen.hidden = false;
        }

        // ⚡ Обновить UI — показать кнопки Вход/Регистрация, скрыть индикатор
        if (window.updateLandingAuthUI) {
            window.updateLandingAuthUI();
        }

        // Visual confirmation — prominent toast
        showToast('👋 Вы вышли из аккаунта. До встречи!');

        // Reset form
        resetAuthForm();
        setAuthMode(AuthMode.LOGIN);

        console.log('✅ Logout complete — redirected to landing page');
    }

    // ========== AUTO LOGIN ==========
    async function tryAutoLogin() {
        const isLoggedIn = Storage.get('isLoggedIn');
        const expires = parseInt(Storage.get('authExpires') || '0');

        if (isLoggedIn === 'true' && Date.now() < expires) {
            // Valid session exists
            const accountRole = Storage.get('userAccountRole') || 'customer';
            window.currentUser = {
                email: Storage.get('authEmail'),
                phone: Storage.get('authPhone'),
                name: Storage.get('userName'),
                role: accountRole
            };

            // Restore role-based access
            if (window.RoleManager) {
                if (accountRole === 'admin') {
                    window.RoleManager.grantAllRoles();
                    window.RoleManager.switchTo('admin', { showToast: false });
                } else {
                    window.RoleManager.setRoles([accountRole]);
                    window.RoleManager.switchTo(accountRole, { showToast: false });
                }
            }
            _applyRoleToNav(accountRole);

            // Hide auth screen
            const authScreen = $('#authScreen');
            if (authScreen) {
                authScreen.hidden = true;
            }

            return true;
        }

        return false;
    }

    // ========== INIT ==========
    function init() {
        // Restore last method
        const lastMethod = Storage.get('lastAuthMethod');
        if (lastMethod && Object.values(AuthMethod).includes(lastMethod)) {
            currentMethod = lastMethod;
        }

        // Seed team accounts into demo database
        _seedTeamAccounts();

        // Setup OTP inputs
        setupOTPInputs();

        // Initial UI update
        updateUI();

        // Try auto login
        tryAutoLogin();
    }

    function setupOTPInputs() {
        $$('.otp-digit').forEach((input, index, inputs) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value.replace(/\D/g, '');
                e.target.value = value.slice(0, 1);

                if (value) {
                    e.target.classList.add('filled');
                    if (index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                } else {
                    e.target.classList.remove('filled');
                }

                // Check if complete
                const code = inputs.map(i => i.value).join('');
                const verifyBtn = $('#otpVerifyBtn');
                if (verifyBtn) {
                    verifyBtn.disabled = code.length !== 6;
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });

            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                if (paste.length === 6) {
                    inputs.forEach((inp, i) => {
                        inp.value = paste[i] || '';
                        if (paste[i]) inp.classList.add('filled');
                    });
                    inputs[5].focus();
                    const verifyBtn = $('#otpVerifyBtn');
                    if (verifyBtn) verifyBtn.disabled = false;
                }
            });
        });
    }

    // ========== HELPERS ==========
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Hash password using SHA-256 (client-side).
     * Production should use bcrypt/argon2 on the server.
     */
    async function _hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + '_qazgost_salt_2026');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return 'sha256:' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            // Fallback for environments without crypto.subtle
            console.warn('crypto.subtle not available, using plain text');
            return password;
        }
    }

    /**
     * Verify password against stored hash.
     * Supports both SHA-256 hashed and legacy plain text passwords.
     */
    async function _verifyPassword(inputPassword, storedPassword) {
        if (!storedPassword) return false;

        // New format: sha256:hex
        if (storedPassword.startsWith('sha256:')) {
            const hashed = await _hashPassword(inputPassword);
            return hashed === storedPassword;
        }

        // Legacy plain text (for existing accounts)
        return inputPassword === storedPassword;
    }

    /**
     * Custom confirm dialog (replaces browser confirm() to avoid blocking UI)
     */
    function _customConfirm(message, onConfirm, onCancel) {
        const overlay = document.createElement('div');
        overlay.className = 'auth-confirm-overlay';
        overlay.innerHTML = `
            <div class="auth-confirm-dialog">
                <div class="auth-confirm-message">${message}</div>
                <div class="auth-confirm-actions">
                    <button class="auth-confirm-cancel">Отмена</button>
                    <button class="auth-confirm-ok">Подтвердить</button>
                </div>
            </div>
        `;

        overlay.querySelector('.auth-confirm-ok').onclick = () => {
            overlay.remove();
            if (onConfirm) onConfirm();
        };
        overlay.querySelector('.auth-confirm-cancel').onclick = () => {
            overlay.remove();
            if (onCancel) onCancel();
        };
        overlay.onclick = (e) => {
            if (e.target === overlay) { overlay.remove(); if (onCancel) onCancel(); }
        };

        document.body.appendChild(overlay);
    }

    // ========== FIREBASE ERROR MESSAGES ==========
    function _firebaseErrorMessage(code) {
        const map = {
            'auth/user-not-found': 'Аккаунт не найден',
            'auth/wrong-password': 'Неверный пароль',
            'auth/invalid-credential': 'Неверный email или пароль',
            'auth/email-already-in-use': 'Этот email уже зарегистрирован',
            'auth/weak-password': 'Слишком простой пароль (мин. 6 символов)',
            'auth/invalid-email': 'Некорректный email',
            'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
            'auth/network-request-failed': 'Ошибка сети. Проверьте интернет',
            'auth/popup-closed-by-user': 'Окно входа было закрыто',
            'auth/popup-blocked': 'Всплывающее окно заблокировано браузером',
            'auth/account-exists-with-different-credential': 'Аккаунт с этим email уже существует',
            'auth/invalid-phone-number': 'Некорректный номер телефона',
            'auth/missing-phone-number': 'Укажите номер телефона',
            'auth/quota-exceeded': 'Лимит SMS исчерпан. Попробуйте позже',
            'auth/captcha-check-failed': 'Ошибка reCAPTCHA. Обновите страницу',
            'auth/user-disabled': 'Аккаунт заблокирован'
        };
        return map[code] || `Ошибка авторизации (${code || 'unknown'})`;
    }

    // ========== FIREBASE: AUTO-LOGIN LISTENER ==========
    if (USE_FIREBASE && window.firebaseAuth) {
        window.firebaseAuth.onAuthStateChanged(async (fbUser) => {
            const wasLoggedIn = Storage.get('isLoggedIn') === 'true';
            const wasExplicitlyLoggedOut = Storage.get('firebaseLoggedOut') === 'true';

            if (fbUser && wasLoggedIn && !wasExplicitlyLoggedOut) {
                console.log('🔥 Firebase auto-login restoring session:', fbUser.email || fbUser.phoneNumber);
                const email = (fbUser.email || '').toLowerCase();
                const users = getDemoUsers();
                const localUser = users[email] || Object.values(users).find(u => u.phone === fbUser.phoneNumber);
                const role = localUser?.role || 'customer';

                // Check & update email verification status
                const wasUnverified = Storage.get('emailVerified') === 'false';
                const isNowVerified = fbUser.emailVerified;

                if (wasUnverified && isNowVerified && email) {
                    // User verified their email since last visit!
                    console.log('✅ Email verified since last session!');
                    if (users[email]) {
                        users[email].emailVerified = true;
                        saveDemoUsers(users);
                    }
                    Storage.set('emailVerified', 'true');
                }

                onAuthSuccess({
                    accessToken: await fbUser.getIdToken(),
                    refreshToken: fbUser.refreshToken,
                    expiresIn: 3600
                }, {
                    uid: fbUser.uid,
                    email: fbUser.email || '',
                    name: fbUser.displayName || localUser?.name || '',
                    phone: fbUser.phoneNumber || localUser?.phone || '',
                    role: role,
                    emailVerified: isNowVerified
                });

                // If was unverified and now verified — celebrate!
                if (wasUnverified && isNowVerified) {
                    setTimeout(() => {
                        _dismissVerificationBanner();
                        showToast('✅ Email успешно подтверждён!', 5000);
                    }, 1000);
                }
            } else if (!fbUser && wasLoggedIn) {
                console.log('🔥 Firebase session expired — logging out locally');
                logout();
            }
        });
    }

    // ========== PUBLIC API ==========
    window.AuthEngine = {
        // Mode & Method
        setMode: setAuthMode,
        setMethod: setAuthMethod,
        getMode: () => currentMode,
        getMethod: () => currentMethod,

        // Email auth
        submitEmail: submitEmailAuth,

        // Phone login (password)
        submitPhoneLogin: submitPhoneLogin,

        // Phone OTP (legacy)
        requestOTP: requestOTP,
        verifyOTP: verifyOTP,
        resendOTP: resendOTP,
        goBackToPhone: goBackToPhone,

        // OAuth
        oauth: oauthContinue,
        _injectTgWidget: _injectTelegramWidget,

        // Profile
        submitProfile: submitProfile,

        // Password reset
        requestReset: requestPasswordReset,
        showReset: showResetForm,
        goBackToLogin: goBackToLogin,
        _resendReset: _resendReset,
        _submitDemoReset: _submitDemoReset,

        // Email verification
        resendVerification: resendVerification,
        checkVerificationStatus: checkVerificationStatus,
        dismissVerificationBanner: _dismissVerificationBanner,
        isEmailVerified: () => Storage.get('emailVerified') !== 'false',

        // Session
        logout: logout,
        tryAutoLogin: tryAutoLogin,

        // Init
        init: init,

        // Constants
        Mode: AuthMode,
        Method: AuthMethod,

        // Admin: user management
        getDemoUsers: getDemoUsers,
        saveDemoUsers: saveDemoUsers,

        // Phone utils
        getExpectedLocalDigits: getExpectedLocalDigits,
        PHONE_DIGIT_MAP: PHONE_DIGIT_MAP
    };

    // Auto-init when DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 0);
    }

})();
