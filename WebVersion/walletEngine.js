/**
 * WalletEngine — управление балансом, тарифами и транзакциями
 * QazGost AI — Финансовый движок
 */
(function() {
    'use strict';

    // ========== ТАРИФЫ ==========
    const TARIFFS = [
        {
            id: 'basic',
            name: 'Базовый',
            nameEn: 'Basic',
            price: 10,
            currency: 'USD',
            icon: '🏠',
            color: '#60a5fa',
            gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
            features: [
                'Создание заказов на оценку',
                'Загрузка до 5 фото',
                'Базовые ИИ-отчёты',
                'Просмотр каталога исполнителей',
                'Email поддержка'
            ],
            role: 'customer',
            badge: 'Заказчик'
        },
        {
            id: 'professional',
            name: 'Профессионал',
            nameEn: 'Professional',
            price: 200,
            currency: 'USD',
            icon: '🏗️',
            color: '#c084fc',
            gradient: 'linear-gradient(135deg, #7c3aed, #c084fc)',
            popular: true,
            features: [
                'Всё из Базового тарифа',
                'Строительство зданий и сооружений',
                'VIP модуль ИИ-анализа',
                'Неограниченные фото',
                'Расширенные PDF-отчёты',
                'Приоритетная поддержка 24/7',
                'Доступ к маркетплейсу',
                'Аналитика и статистика'
            ],
            role: 'executor',
            badge: 'Профессионал'
        },
        {
            id: 'enterprise',
            name: 'Корпоративный',
            nameEn: 'Enterprise',
            price: null, // по запросу
            currency: 'USD',
            icon: '🏢',
            color: '#facc15',
            gradient: 'linear-gradient(135deg, #f59e0b, #facc15)',
            features: [
                'Всё из Профессионал',
                'Индивидуальная настройка',
                'API интеграция',
                'Командные аккаунты',
                'Выделенный менеджер',
                'SLA гарантии',
                'White-label решения'
            ],
            role: 'engineer',
            badge: 'Корпоративный'
        }
    ];

    // ========== МИНИМАЛЬНОЕ ПОПОЛНЕНИЕ ==========
    const MIN_TOPUP = 10; // минимум $10
    const CURRENCY_SYMBOL = '$';
    const CURRENCY_CODE = 'USD';

    // ========== СУММЫ ПОПОЛНЕНИЯ ==========
    const QUICK_AMOUNTS = [10, 25, 50, 100, 200, 500];

    // ========== СПОСОБЫ ОПЛАТЫ ==========
    const PAYMENT_METHODS = [
        { id: 'freedompay', name: 'Freedom Pay', icon: '💳', color: '#00B050', description: 'Visa / Mastercard / Kaspi' },
        { id: 'crypto', name: 'Криптовалюта', icon: '₿', color: '#F7931A', description: 'Bitcoin, USDT, ETH' },
        { id: 'promo', name: 'Промокод', icon: '🎟️', color: '#9C27B0', description: 'Активировать промокод' }
    ];

    // ========== ХРАНИЛИЩЕ ==========
    const Storage = {
        get(k) { try { return localStorage.getItem('wallet_' + k); } catch { return null; } },
        set(k, v) { try { localStorage.setItem('wallet_' + k, v); } catch {} },
        getJSON(k) { try { return JSON.parse(localStorage.getItem('wallet_' + k)); } catch { return null; } },
        setJSON(k, v) { try { localStorage.setItem('wallet_' + k, JSON.stringify(v)); } catch {} }
    };

    // ========== БАЛАНС ==========
    function getBalance() {
        return parseFloat(Storage.get('balance')) || 0;
    }

    function setBalance(amount) {
        Storage.set('balance', amount.toFixed(2));
        _notifyUpdate();
    }

    // ========== ТАРИФ ==========
    function getCurrentTariff() {
        const id = Storage.get('tariff') || null;
        return TARIFFS.find(t => t.id === id) || null;
    }

    function setTariff(tariffId) {
        Storage.set('tariff', tariffId);
        const tariff = TARIFFS.find(t => t.id === tariffId);
        if (tariff && tariff.role) {
            localStorage.setItem('userRole', tariff.role);
        }
        _notifyUpdate();
    }

    // ========== ТРАНЗАКЦИИ ==========
    function getTransactions() {
        return Storage.getJSON('transactions') || [];
    }

    function addTransaction(tx) {
        const transactions = getTransactions();
        const newTx = {
            id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            date: new Date().toISOString(),
            ...tx
        };
        transactions.unshift(newTx); // последние сверху
        // Хранить максимум 100 транзакций
        if (transactions.length > 100) transactions.length = 100;
        Storage.setJSON('transactions', transactions);
        return newTx;
    }

    // ========== ПОПОЛНЕНИЕ ==========
    function topUp(amount, method, description) {
        if (amount < MIN_TOPUP) {
            return { success: false, error: `Минимальная сумма пополнения — ${CURRENCY_SYMBOL}${MIN_TOPUP}` };
        }

        const newBalance = getBalance() + amount;
        setBalance(newBalance);

        const methodLabels = { card: '💳 Карта', crypto: '₿ Крипто', stripe: '💳 Stripe', promo: '🎟️ Промо' };
        const methodLabel = methodLabels[method] || '';

        const tx = addTransaction({
            type: 'topup',
            amount: amount,
            method: method || 'manual',
            description: description || `Пополнение кошелька${methodLabel ? ' • ' + methodLabel : ''}`,
            status: 'completed',
            balanceAfter: newBalance
        });

        return { success: true, transaction: tx, newBalance: newBalance };
    }

    // ========== СПИСАНИЕ ==========
    function charge(amount, description, orderId) {
        const currentBalance = getBalance();
        if (amount > currentBalance) {
            return { success: false, error: 'Недостаточно средств', needTopUp: amount - currentBalance };
        }

        const newBalance = currentBalance - amount;
        setBalance(newBalance);

        const tx = addTransaction({
            type: 'charge',
            amount: -amount,
            description: description || 'Списание',
            orderId: orderId || null,
            status: 'completed',
            balanceAfter: newBalance
        });

        return { success: true, transaction: tx, newBalance: newBalance };
    }

    // ========== ПОКУПКА ТАРИФА ==========
    function purchaseTariff(tariffId) {
        const tariff = TARIFFS.find(t => t.id === tariffId);
        if (!tariff) return { success: false, error: 'Тариф не найден' };
        if (!tariff.price) return { success: false, error: 'Свяжитесь с нами для этого тарифа' };

        const currentBalance = getBalance();
        if (tariff.price > currentBalance) {
            return { 
                success: false, 
                error: `Недостаточно средств. Нужно: ${CURRENCY_SYMBOL}${tariff.price}, на балансе: ${CURRENCY_SYMBOL}${currentBalance.toFixed(2)}`,
                needTopUp: tariff.price - currentBalance
            };
        }

        // Списать
        const newBalance = currentBalance - tariff.price;
        setBalance(newBalance);

        // Установить тариф
        setTariff(tariffId);

        // Запись транзакции
        const tx = addTransaction({
            type: 'tariff',
            amount: -tariff.price,
            tariffId: tariffId,
            description: `Активация тарифа «${tariff.name}»`,
            status: 'completed',
            balanceAfter: newBalance
        });

        return { success: true, transaction: tx, newBalance: newBalance, tariff: tariff };
    }

    // ========== ПРОМОКОД ==========
    function redeemPromo(code) {
        // Демо промокоды
        const promoCodes = {
            'WELCOME10': { amount: 10, type: 'bonus', description: 'Бонус: Промокод WELCOME10' },
            'VIP50': { amount: 50, type: 'bonus', description: 'Бонус: Промокод VIP50' },
            'QAZGOST100': { amount: 100, type: 'bonus', description: 'Бонус: Промокод QAZGOST100' },
            'TEST200': { amount: 200, type: 'bonus', description: 'Бонус: Промокод TEST200' }
        };

        const upperCode = (code || '').toUpperCase().trim();
        const promo = promoCodes[upperCode];

        // Проверка — уже использован
        const used = Storage.getJSON('usedPromos') || [];
        if (used.includes(upperCode)) {
            return { success: false, error: 'Этот промокод уже использован' };
        }

        if (!promo) {
            return { success: false, error: 'Недействительный промокод' };
        }

        // Начисляем
        const newBalance = getBalance() + promo.amount;
        setBalance(newBalance);

        used.push(upperCode);
        Storage.setJSON('usedPromos', used);

        addTransaction({
            type: 'promo',
            amount: promo.amount,
            promoCode: upperCode,
            description: promo.description,
            status: 'completed',
            balanceAfter: newBalance
        });

        return { success: true, amount: promo.amount, newBalance: newBalance };
    }

    // ========== PAYMENT INTEGRATION ==========
    const BACKEND_URL = window.QAZGOST_CONFIG?.apiBase || 'https://construction-api.kmp99.workers.dev';

    // ========== FREEDOM PAY INTEGRATION ==========

    /**
     * Создать платёжную сессию через Freedom Pay
     * POST → https://api.freedompay.kz/init_payment.php
     * 
     * @param {number} amount — сумма в USD
     * @param {string} type — 'topup' | 'tariff'
     * @param {string|null} tariffId — ID тарифа (если type='tariff')
     * @returns {{ success: boolean, redirectUrl?: string, paymentId?: string, error?: string }}
     */
    async function createFreedomPaySession(amount, type = 'topup', tariffId = null) {
        const cfg = window.QAZGOST_CONFIG?.freedomPay;
        if (!cfg || !cfg.merchantId || !cfg.secretKey) {
            console.error('❌ [FreedomPay] Missing config — check config.js');
            return { success: false, error: 'Freedom Pay не настроен. Проверьте config.js' };
        }

        if (!window.FreedomPaySig) {
            console.error('❌ [FreedomPay] FreedomPaySig module not loaded');
            return { success: false, error: 'Модуль подписи не загружен' };
        }

        const orderId = 'QG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const description = type === 'tariff' && tariffId
            ? `QazGost Тариф: ${tariffId} — $${amount.toFixed(2)}`
            : `QazGost пополнение — $${amount.toFixed(2)}`;

        // Формируем параметры запроса
        const baseUrl = window.location.origin + window.location.pathname;
        const successParams = `?payment=success&pg_order_id=${orderId}&amount=${amount.toFixed(2)}&type=${type}`;
        const failParams = `?payment=cancelled&pg_order_id=${orderId}`;

        const params = {
            pg_merchant_id: cfg.merchantId,
            pg_amount: amount.toFixed(2),
            pg_currency: cfg.currency || 'USD',
            pg_description: description,
            pg_order_id: orderId,
            pg_salt: window.FreedomPaySig.generateSalt(),
            pg_language: cfg.language || 'ru',
            pg_auto_clearing: '1',
            pg_success_url: baseUrl + successParams,
            pg_failure_url: baseUrl + failParams,
            pg_success_url_method: 'GET',
            pg_failure_url_method: 'GET',
        };

        // Тестовый режим
        if (cfg.testMode) {
            params.pg_testing_mode = '1';
        }

        // Сохраняем метаданные заказа в localStorage для callback
        const orderMeta = {
            orderId,
            amount,
            type,
            tariffId,
            createdAt: new Date().toISOString()
        };
        localStorage.setItem('fp_pending_' + orderId, JSON.stringify(orderMeta));

        // Генерируем подпись
        const scriptName = 'init_payment.php';
        params.pg_sig = window.FreedomPaySig.generateSignature(scriptName, params, cfg.secretKey);

        console.log('💳 [FreedomPay] Creating payment session:', { orderId, amount, type });

        try {
            // POST как application/x-www-form-urlencoded
            const formBody = Object.entries(params)
                .map(([key, val]) => encodeURIComponent(key) + '=' + encodeURIComponent(val))
                .join('&');

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000);

            // Используем Cloudflare Worker как прокси для обхода CORS
            const proxyUrl = (window.QAZGOST_CONFIG?.apiBase || 'https://construction-api.kmp99.workers.dev') + '/api/freedompay/init';
            console.log('💳 [FreedomPay] Using proxy:', proxyUrl);

            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const responseText = await response.text();
            console.log('💳 [FreedomPay] Response:', responseText.substring(0, 500));

            // Парсим XML ответ
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(responseText, 'text/xml');

            const pgStatus = xmlDoc.querySelector('pg_status')?.textContent;
            const pgPaymentId = xmlDoc.querySelector('pg_payment_id')?.textContent;
            const pgRedirectUrl = xmlDoc.querySelector('pg_redirect_url')?.textContent;
            const pgErrorDesc = xmlDoc.querySelector('pg_error_description')?.textContent;

            if (pgStatus === 'ok' && pgRedirectUrl) {
                console.log('✅ [FreedomPay] Session created:', { paymentId: pgPaymentId, redirectUrl: pgRedirectUrl });
                
                // Обновляем localStorage с payment_id
                orderMeta.pgPaymentId = pgPaymentId;
                localStorage.setItem('fp_pending_' + orderId, JSON.stringify(orderMeta));

                return {
                    success: true,
                    redirectUrl: pgRedirectUrl,
                    paymentId: pgPaymentId,
                    orderId: orderId
                };
            } else {
                const errorMsg = pgErrorDesc || `Статус: ${pgStatus || 'unknown'}`;
                console.error('❌ [FreedomPay] Error:', errorMsg);
                return { success: false, error: errorMsg };
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.error('❌ [FreedomPay] Request timeout');
                return { success: false, error: 'Таймаут запроса к Freedom Pay. Попробуйте позже.' };
            }
            console.error('❌ [FreedomPay] Network error:', err);
            return { success: false, error: 'Ошибка сети: ' + err.message };
        }
    }


    /**
     * Обработка оплаты — фронтенд-первый подход
     * Приоритет: production API → legacy API → фронтенд
     */
    async function createCheckoutSession(amount, type = 'topup', tariffId = null) {
        const userId = localStorage.getItem('authEmail') 
            || localStorage.getItem('authPhone') 
            || 'anonymous';

        // 1. Попытка через production API (Stripe Checkout)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);

            const response = await fetch(`${BACKEND_URL}/api/v1/finance/stripe/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, type, tariffId, userId }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                // Stripe live mode — redirect to Stripe hosted page
                if (data.mode === 'stripe' && data.sessionUrl) {
                    return { success: true, mode: 'stripe', redirectUrl: data.sessionUrl, sessionId: data.sessionId };
                }
                // Demo mode — server auto-credited
                if (data.mode === 'demo') {
                    topUp(amount, 'stripe_demo', `Stripe Demo: $${amount}`);
                    return { success: true, mode: 'demo', newBalance: getBalance() };
                }
            }
        } catch (err) {
            console.log('ℹ️ Production API unavailable, trying legacy...');
        }

        // 2. Fallback: legacy endpoint
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(`${BACKEND_URL}/payments/create-checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, type, tariffId, userId }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await response.json();
            if (response.ok && data.redirectUrl) {
                return { success: true, mode: 'stripe', redirectUrl: data.redirectUrl };
            }
            if (response.ok && data.mode === 'demo') {
                topUp(amount, 'server_demo', `Пополнение $${amount}`);
                return { success: true, mode: 'frontend', newBalance: getBalance() };
            }
        } catch (err) {
            console.log('ℹ️ Legacy backend unavailable — using frontend payment mode');
        }

        // 3. Фронтенд-оплата (без бэкенда)
        return { success: true, mode: 'frontend', amount, type, tariffId };
    }

    /**
     * Создать Stripe Checkout Session напрямую
     * Используется из walletUI для кнопки "Оплатить картой"
     * @returns {{ success, mode, redirectUrl, sessionId } | { success, mode: 'frontend' }}
     */
    async function createStripeCheckout(amount, type = 'topup', tariffId = null) {
        const userId = localStorage.getItem('authEmail')
            || localStorage.getItem('authPhone')
            || 'anonymous';

        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 5000);

            const resp = await fetch(`${BACKEND_URL}/api/v1/finance/stripe/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, type, tariffId, userId }),
                signal: controller.signal
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data.sessionUrl) {
                    return { success: true, mode: 'stripe', redirectUrl: data.sessionUrl, sessionId: data.sessionId };
                }
                if (data.mode === 'demo') {
                    return { success: true, mode: 'demo', amount, type };
                }
            }
        } catch (e) {
            console.log('ℹ️ Stripe API unavailable — fallback to frontend card form');
        }

        return { success: true, mode: 'frontend', amount, type, tariffId };
    }

    /**
     * Подтверждение фронтенд-оплаты
     * @param {number} amount — сумма
     * @param {string} type — 'topup' | 'tariff'
     * @param {string|null} tariffId — ID тарифа
     * @param {string} method — 'card' | 'crypto'
     * @deprecated Используйте createPendingPayment() + verifyPayment() для реальной верификации.
     *             Эта функция оставлена ТОЛЬКО для Stripe webhook / серверного подтверждения.
     */
    function confirmFrontendPayment(amount, type = 'topup', tariffId = null, method = 'card') {
        console.warn('⚠️ confirmFrontendPayment вызван напрямую. Для реальных платежей используйте createPendingPayment() → verifyPayment()');
        
        const methodLabels = { card: '💳 Карта', crypto: '₿ Крипто', freedompay: '💳 Freedom Pay' };
        const label = methodLabels[method] || method;

        if (type === 'tariff' && tariffId) {
            const tariff = TARIFFS.find(t => t.id === tariffId);
            topUp(amount, method, `Тариф «${tariff?.name || tariffId}» • ${label}`);
            setTariff(tariffId);
        } else {
            topUp(amount, method, `Пополнение ${CURRENCY_SYMBOL}${amount} • ${label}`);
        }
        return { success: true, newBalance: getBalance() };
    }

    // ========== PENDING PAYMENTS (Ожидание подтверждения) ==========

    /**
     * Создать pending-платёж (деньги НЕ зачисляются до верификации)
     */
    function createPendingPayment(amount, method, type = 'topup', tariffId = null, metadata = {}) {
        const pending = Storage.getJSON('pendingPayments') || [];
        const methodLabels = { card: '💳 Карта', crypto: '₿ Крипто', freedompay: '💳 Freedom Pay' };

        const payment = {
            id: 'pend_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            amount,
            method,
            type,
            tariffId,
            status: 'pending',        // pending → verifying → confirmed → completed | rejected | expired
            description: `${methodLabels[method] || method} • ${CURRENCY_SYMBOL}${amount.toFixed(2)}`,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 минут
            verifyAttempts: 0,
            maxAttempts: 50,  // 10 авто + до 40 ручных проверок
            ...metadata
        };

        pending.push(payment);
        Storage.setJSON('pendingPayments', pending);

        // Записываем транзакцию со статусом pending
        addTransaction({
            type: 'topup',
            amount: 0, // пока 0 — зачислим после подтверждения
            pendingAmount: amount,
            pendingId: payment.id,
            method,
            description: `⏳ Ожидание: ${payment.description}`,
            status: 'pending',
            balanceAfter: getBalance()
        });

        return payment;
    }

    /**
     * Получить все pending-платежи
     */
    function getPendingPayments() {
        const pending = Storage.getJSON('pendingPayments') || [];
        const now = new Date();
        // Автоматически помечаем истёкшие
        return pending.map(p => {
            if (p.status === 'pending' && new Date(p.expiresAt) < now) {
                p.status = 'expired';
            }
            return p;
        });
    }

    /**
     * Верификация платежа через бэкенд
     * Пытается проверить реальное поступление средств
     */
    async function verifyPayment(pendingId) {
        const pending = getPendingPayments();
        const idx = pending.findIndex(p => p.id === pendingId);
        if (idx === -1) return { success: false, error: 'Платёж не найден' };

        const payment = pending[idx];
        if (payment.status === 'completed') return { success: true, alreadyCompleted: true };
        if (payment.status === 'expired') return { success: false, error: 'Платёж истёк (30 мин)' };
        if (payment.status === 'rejected') return { success: false, error: 'Платёж отклонён' };

        payment.verifyAttempts++;
        payment.status = 'verifying';
        Storage.setJSON('pendingPayments', pending);

        // === Попытка проверки через бэкенд ===
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 5000);

            const resp = await fetch(`${BACKEND_URL}/payments/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pendingId: payment.id,
                    amount: payment.amount,
                    method: payment.method,
                    txHash: payment.txHash || null,
                    crypto: payment.crypto || null
                }),
                signal: controller.signal
            });

            if (resp.ok) {
                const data = await resp.json();
                if (data.verified) {
                    return _completePending(pendingId, 'server');
                }
                if (data.rejected) {
                    return _rejectPending(pendingId, data.reason || 'Отклонено сервером');
                }
                // Ещё не подтверждено — ждём
                payment.status = 'pending';
                payment.serverMessage = data.message || 'Ожидание подтверждения';
                Storage.setJSON('pendingPayments', pending);
                return { success: false, status: 'waiting', message: payment.serverMessage, attempts: payment.verifyAttempts };
            }
        } catch (e) {
            console.log('ℹ️ Backend verification unavailable — using local check');
        }

        // === Крипто: проверка через blockchain API ===
        if (payment.method === 'crypto' && payment.txHash) {
            const verified = await _verifyBlockchainTx(payment.txHash, payment.crypto, payment.amount);
            if (verified === true) {
                return _completePending(pendingId, 'blockchain');
            }
            if (verified === false) {
                payment.status = 'pending';
                Storage.setJSON('pendingPayments', pending);
                return { success: false, status: 'waiting', message: 'Транзакция не найдена или не подтверждена', attempts: payment.verifyAttempts };
            }
        }

        // === Нет ни бэкенда, ни blockchain — деньги НЕ зачисляются ===
        // Лимит проверок — показываем сообщение о поддержке
        if (payment.verifyAttempts >= payment.maxAttempts) {
            payment.status = 'pending';
            Storage.setJSON('pendingPayments', pending);
            return { success: false, status: 'max_attempts', message: 'Средства не обнаружены. Обратитесь в поддержку с ID платежа.' };
        }

        payment.status = 'pending';
        Storage.setJSON('pendingPayments', pending);
        return { success: false, status: 'waiting', message: 'Оплата не найдена. Попробуйте позже.', attempts: payment.verifyAttempts };
    }

    /**
     * Проверить крипто-транзакцию через публичный API
     */
    async function _verifyBlockchainTx(txHash, crypto, expectedAmount) {
        if (!txHash || txHash.length < 10) return null;

        try {
            let url = '';
            if (crypto === 'btc') {
                url = `https://blockchain.info/rawtx/${txHash}?format=json`;
            } else if (crypto === 'eth') {
                url = `https://api.etherscan.io/api?module=transaction&action=gettxreceiptstatus&txhash=${txHash}`;
            } else {
                return null; // Для USDT/TON пока нет публичного простого API
            }

            const resp = await fetch(url);
            if (resp.ok) {
                const data = await resp.json();
                // Для BTC: проверяем что tx существует
                if (crypto === 'btc' && data.hash) return true;
                // Для ETH: статус 1 = success
                if (crypto === 'eth' && data.result?.status === '1') return true;
            }
        } catch (e) {
            console.warn('Blockchain verification failed:', e.message);
        }
        return false;
    }

    /**
     * Завершить pending-платёж (зачислить средства)
     */
    function _completePending(pendingId, source = 'manual') {
        const pending = getPendingPayments();
        const idx = pending.findIndex(p => p.id === pendingId);
        if (idx === -1) return { success: false, error: 'Платёж не найден' };

        const payment = pending[idx];
        if (payment.status === 'completed') return { success: true, alreadyCompleted: true };

        // Зачисляем средства
        const methodLabels = { card: '💳 Карта', crypto: '₿ Крипто', freedompay: '💳 Freedom Pay' };
        const label = methodLabels[payment.method] || payment.method;

        if (payment.type === 'tariff' && payment.tariffId) {
            const tariff = TARIFFS.find(t => t.id === payment.tariffId);
            topUp(payment.amount, payment.method, `✅ Тариф «${tariff?.name || payment.tariffId}» • ${label}`);
            setTariff(payment.tariffId);
        } else {
            topUp(payment.amount, payment.method, `✅ Пополнение ${CURRENCY_SYMBOL}${payment.amount} • ${label}`);
        }

        // Обновляем pending-транзакцию в истории
        const txs = getTransactions();
        const txIdx = txs.findIndex(t => t.pendingId === pendingId);
        if (txIdx !== -1) {
            txs[txIdx].status = 'completed';
            txs[txIdx].description = txs[txIdx].description.replace('⏳ Ожидание:', '✅ Подтверждено:');
            Storage.setJSON('transactions', txs);
        }

        // Обновляем статус
        payment.status = 'completed';
        payment.completedAt = new Date().toISOString();
        payment.verifiedBy = source;
        Storage.setJSON('pendingPayments', pending);

        _notifyUpdate();
        return { success: true, newBalance: getBalance(), payment };
    }

    /**
     * Отклонить pending-платёж
     */
    function _rejectPending(pendingId, reason = '') {
        const pending = getPendingPayments();
        const idx = pending.findIndex(p => p.id === pendingId);
        if (idx === -1) return { success: false };

        pending[idx].status = 'rejected';
        pending[idx].rejectedAt = new Date().toISOString();
        pending[idx].rejectReason = reason;
        Storage.setJSON('pendingPayments', pending);

        // Обновляем в транзакциях
        const txs = getTransactions();
        const txIdx = txs.findIndex(t => t.pendingId === pendingId);
        if (txIdx !== -1) {
            txs[txIdx].status = 'rejected';
            txs[txIdx].description = `❌ Отклонено: ${txs[txIdx].description.replace('⏳ Ожидание:', '')}`;
            Storage.setJSON('transactions', txs);
        }

        _notifyUpdate();
        return { success: true, reason };
    }

    /**
     * Ручное подтверждение (админ / демо-режим)
     */
    function adminApprovePending(pendingId) {
        return _completePending(pendingId, 'admin');
    }

    /**
     * Обработка возврата с Freedom Pay / Stripe Checkout
     * Вызывается при загрузке страницы, если URL содержит ?payment=success
     */
    function handlePaymentReturn() {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get('payment');
        const pgOrderId = params.get('pg_order_id') || '';
        const pgPaymentId = params.get('pg_payment_id') || '';
        const amount = parseFloat(params.get('amount')) || 0;
        const type = params.get('type') || 'topup';

        if (payment === 'success') {
            // ─── Защита от двойного зачисления при F5 ───
            const processedKey = 'fp_processed_' + (pgOrderId || 'legacy_' + amount + '_' + type);
            if (localStorage.getItem(processedKey)) {
                console.log('ℹ️ [Payment] Already processed, skipping:', processedKey);
                // Просто очищаем URL
                window.history.replaceState({}, '', window.location.pathname);
                return { success: true, alreadyProcessed: true };
            }

            // Ищем данные заказа в localStorage (Freedom Pay)
            let orderAmount = amount;
            let orderType = type;
            let orderTariffId = null;

            if (pgOrderId) {
                const orderMeta = JSON.parse(localStorage.getItem('fp_pending_' + pgOrderId) || 'null');
                if (orderMeta) {
                    orderAmount = orderMeta.amount || amount;
                    orderType = orderMeta.type || type;
                    orderTariffId = orderMeta.tariffId || null;
                    // Удаляем pending запись
                    localStorage.removeItem('fp_pending_' + pgOrderId);
                }
            }

            if (orderAmount > 0) {
                // Зачисляем баланс
                const paymentMethod = pgOrderId ? 'freedompay' : 'stripe';
                const paymentLabel = pgOrderId ? 'Freedom Pay' : 'Stripe';

                if (orderType === 'tariff' && orderTariffId) {
                    const tariff = TARIFFS.find(t => t.id === orderTariffId);
                    topUp(orderAmount, paymentMethod, `✅ Тариф «${tariff?.name || orderTariffId}» • ${paymentLabel}`);
                    setTariff(orderTariffId);
                } else {
                    topUp(orderAmount, paymentMethod, `✅ Пополнение $${orderAmount.toFixed(2)} • ${paymentLabel}`);
                }

                // Помечаем как обработанный (защита от F5)
                localStorage.setItem(processedKey, new Date().toISOString());
            }
            
            // Очищаем URL
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);

            // Показываем уведомление
            setTimeout(() => {
                if (typeof window.showToast === 'function') {
                    window.showToast(`✅ Кошелёк пополнен на $${orderAmount.toFixed(2)}!`);
                } else if (window.QazUI?.alert) {
                    window.QazUI.alert('Пополнение успешно!', `Кошелёк пополнен на $${orderAmount.toFixed(2)}`, { icon: '✅' });
                }
            }, 500);

            return { success: true, amount: orderAmount, type: orderType };
        }

        if (payment === 'cancelled') {
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, '', cleanUrl);
            
            setTimeout(() => {
                if (typeof window.showToast === 'function') {
                    window.showToast('❌ Оплата отменена');
                }
            }, 500);

            return { success: false, cancelled: true };
        }

        return null;
    }

    /**
     * Синхронизация баланса с бэкендом
     */
    async function syncWithServer() {
        const userId = localStorage.getItem('authEmail') 
            || localStorage.getItem('authPhone') 
            || 'anonymous';
        
        try {
            const response = await fetch(`${BACKEND_URL}/payments/balance?userId=${encodeURIComponent(userId)}`);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.balance > 0) {
                    // Если серверный баланс больше — обновляем локальный
                    const localBalance = getBalance();
                    if (data.balance > localBalance) {
                        setBalance(data.balance);
                    }
                    if (data.tariff) {
                        setTariff(data.tariff);
                    }
                }
                return data;
            }
        } catch (err) {
            console.warn('WalletEngine: sync failed (backend offline):', err.message);
        }
        return null;
    }

    // ========== УВЕДОМЛЕНИЯ ==========
    const _listeners = [];

    function onUpdate(callback) {
        _listeners.push(callback);
    }

    function _notifyUpdate() {
        const data = {
            balance: getBalance(),
            tariff: getCurrentTariff(),
            transactions: getTransactions()
        };
        _listeners.forEach(cb => { try { cb(data); } catch(e) { console.error('WalletEngine listener error:', e); } });
    }

    // ========== ВОЗВРАТ СРЕДСТВ (REFUND) ==========
    const REFUND_WINDOW_HOURS = 24; // Возврат возможен в течение 24 часов

    /**
     * Проверка возможности возврата
     */
    function canRefund(transactionId) {
        const tx = getTransactions().find(t => t.id === transactionId);
        if (!tx) return { canRefund: false, reason: 'Транзакция не найдена' };
        if (tx.type === 'refund') return { canRefund: false, reason: 'Это уже возврат' };
        if (tx.type === 'promo') return { canRefund: false, reason: 'Промокоды не возвращаются' };
        if (tx.status === 'refunded') return { canRefund: false, reason: 'Средства уже возвращены' };
        if (tx.amount > 0) return { canRefund: false, reason: 'Возврат только для списаний' };

        // Проверка временного окна
        const txDate = new Date(tx.date);
        const now = new Date();
        const hoursElapsed = (now - txDate) / (1000 * 60 * 60);
        if (hoursElapsed > REFUND_WINDOW_HOURS) {
            return { canRefund: false, reason: `Возврат возможен только в течение ${REFUND_WINDOW_HOURS} часов` };
        }

        return { canRefund: true, transaction: tx };
    }

    /**
     * Выполнить возврат средств
     */
    function processRefund(transactionId, reason = '') {
        const check = canRefund(transactionId);
        if (!check.canRefund) return { success: false, error: check.reason };

        const originalTx = check.transaction;
        const refundAmount = Math.abs(originalTx.amount);

        // Зачисляем обратно
        const newBalance = getBalance() + refundAmount;
        setBalance(newBalance);

        // Помечаем оригинальную транзакцию как возвращённую
        const txs = getTransactions();
        const idx = txs.findIndex(t => t.id === transactionId);
        if (idx !== -1) {
            txs[idx].status = 'refunded';
            Storage.setJSON('transactions', txs);
        }

        // Если был тариф — сбрасываем
        if (originalTx.type === 'tariff' && originalTx.tariffId) {
            Storage.set('tariff', '');
            localStorage.removeItem('userRole');
        }

        // Запись о возврате
        const refundTx = addTransaction({
            type: 'refund',
            amount: refundAmount,
            originalTxId: transactionId,
            description: `Возврат: ${originalTx.description}${reason ? ' — ' + reason : ''}`,
            status: 'completed',
            balanceAfter: newBalance
        });

        return { success: true, transaction: refundTx, newBalance, refundedAmount: refundAmount };
    }

    // ========== ИНВОЙС / ЧЕКИ ==========
    /**
     * Генерация HTML-чека для транзакции
     */
    function generateInvoice(transactionId) {
        const tx = getTransactions().find(t => t.id === transactionId);
        if (!tx) return null;

        const userName = localStorage.getItem('userName') || localStorage.getItem('authEmail') || 'Пользователь';
        const invoiceNum = tx.id.replace('tx_', 'INV-');
        const date = new Date(tx.date);
        const dateStr = date.toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        const statusMap = { completed: 'Выполнено', refunded: 'Возвращено', pending: 'Ожидание' };
        const typeMap = { topup: 'Пополнение', charge: 'Списание', tariff: 'Тариф', promo: 'Промокод', refund: 'Возврат' };
        const currInfo = getCurrencyInfo();

        return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="UTF-8">
<title>Чек ${invoiceNum}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;background:#f5f5f5;padding:2rem}
.invoice{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)}
.inv-header{background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;padding:1.5rem;text-align:center}
.inv-logo{font-size:1.5rem;font-weight:800;margin-bottom:0.25rem}
.inv-subtitle{font-size:0.75rem;opacity:0.6}
.inv-body{padding:1.5rem}
.inv-row{display:flex;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid #f0f0f0;font-size:0.9rem}
.inv-row:last-child{border:none}
.inv-label{color:#666}
.inv-value{font-weight:600;color:#1a1a2e}
.inv-amount{font-size:1.8rem;font-weight:800;text-align:center;padding:1rem;margin:1rem 0;border-radius:12px}
.inv-amount.positive{color:#16a34a;background:#f0fdf4}
.inv-amount.negative{color:#dc2626;background:#fef2f2}
.inv-footer{text-align:center;padding:1rem 1.5rem;background:#fafafa;font-size:0.72rem;color:#999}
.inv-status{display:inline-block;padding:0.2rem 0.6rem;border-radius:6px;font-size:0.75rem;font-weight:600}
.inv-status.completed{background:#dcfce7;color:#16a34a}
.inv-status.refunded{background:#fef3c7;color:#d97706}
@media print{body{background:#fff;padding:0}.invoice{box-shadow:none;border-radius:0}}
</style></head><body>
<div class="invoice">
<div class="inv-header">
<div class="inv-logo">🏗️ QazGost AI</div>
<div class="inv-subtitle">Электронный чек</div>
</div>
<div class="inv-body">
<div class="inv-row"><span class="inv-label">Чек №</span><span class="inv-value">${invoiceNum}</span></div>
<div class="inv-row"><span class="inv-label">Дата</span><span class="inv-value">${dateStr}, ${timeStr}</span></div>
<div class="inv-row"><span class="inv-label">Клиент</span><span class="inv-value">${userName}</span></div>
<div class="inv-row"><span class="inv-label">Операция</span><span class="inv-value">${typeMap[tx.type] || tx.type}</span></div>
<div class="inv-row"><span class="inv-label">Описание</span><span class="inv-value">${tx.description || '—'}</span></div>
<div class="inv-amount ${tx.amount >= 0 ? 'positive' : 'negative'}">${tx.amount >= 0 ? '+' : ''}${currInfo.symbol}${Math.abs(tx.amount).toFixed(2)}</div>
<div class="inv-row"><span class="inv-label">Валюта</span><span class="inv-value">${currInfo.code}</span></div>
<div class="inv-row"><span class="inv-label">Баланс после</span><span class="inv-value">${currInfo.symbol}${(tx.balanceAfter || 0).toFixed(2)}</span></div>
<div class="inv-row"><span class="inv-label">Статус</span><span class="inv-value"><span class="inv-status ${tx.status}">${statusMap[tx.status] || tx.status}</span></span></div>
${tx.method ? `<div class="inv-row"><span class="inv-label">Метод</span><span class="inv-value">${tx.method}</span></div>` : ''}
</div>
<div class="inv-footer">
QazGost AI &copy; ${date.getFullYear()} • Электронный чек • Не является фискальным документом<br>
Сгенерировано: ${new Date().toLocaleString('ru-RU')}
</div>
</div>
<script>window.onload=()=>window.print()</script>
</body></html>`;
    }

    /**
     * Открыть чек в новом окне для печати
     */
    function printInvoice(transactionId) {
        const html = generateInvoice(transactionId);
        if (!html) return false;
        const w = window.open('', '_blank', 'width=600,height=700');
        if (w) { w.document.write(html); w.document.close(); }
        return !!w;
    }

    // ========== МУЛЬТИ-ВАЛЮТА ==========
    const CURRENCIES = {
        USD: { symbol: '$', code: 'USD', name: 'Доллар США', rate: 1 },
        KZT: { symbol: '₸', code: 'KZT', name: 'Тенге (KZ)', rate: 495 },
        RUB: { symbol: '₽', code: 'RUB', name: 'Рубль (RU)', rate: 92 }
    };

    let _currencyRatesCache = { rates: {}, fetchedAt: 0 };

    function getCurrency() {
        return Storage.get('currency') || 'USD';
    }

    function setCurrency(code) {
        if (!CURRENCIES[code]) return;
        Storage.set('currency', code);
        _notifyUpdate();
    }

    function getCurrencyInfo() {
        const code = getCurrency();
        return CURRENCIES[code] || CURRENCIES.USD;
    }

    /**
     * Получить актуальные курсы валют
     */
    async function fetchExchangeRates() {
        const now = Date.now();
        if (now - _currencyRatesCache.fetchedAt < 3600000 && Object.keys(_currencyRatesCache.rates).length) {
            return _currencyRatesCache.rates;
        }

        try {
            const resp = await fetch('https://open.er-api.com/v6/latest/USD');
            if (resp.ok) {
                const data = await resp.json();
                if (data.rates) {
                    CURRENCIES.KZT.rate = data.rates.KZT || 495;
                    CURRENCIES.RUB.rate = data.rates.RUB || 92;
                    _currencyRatesCache = { rates: data.rates, fetchedAt: now };
                    console.log('💱 Exchange rates updated:', { KZT: CURRENCIES.KZT.rate, RUB: CURRENCIES.RUB.rate });
                }
                return data.rates;
            }
        } catch (e) {
            console.warn('Exchange rate API failed, using fallback');
        }
        return null;
    }

    /**
     * Конвертировать сумму из USD в текущую валюту
     */
    function convertToDisplay(amountUSD) {
        const curr = getCurrencyInfo();
        return amountUSD * curr.rate;
    }

    /**
     * Отформатировать сумму в текущей валюте
     */
    function formatInCurrency(amountUSD) {
        const curr = getCurrencyInfo();
        const converted = Math.abs(amountUSD) * curr.rate;
        const sign = amountUSD < 0 ? '-' : '+';
        
        if (curr.code === 'KZT') {
            return `${sign}${curr.symbol}${Math.round(converted).toLocaleString('ru-RU')}`;
        }
        return `${sign}${curr.symbol}${converted.toFixed(2)}`;
    }

    // Загрузка курсов при инициализации
    if (typeof window !== 'undefined') {
        fetchExchangeRates();
    }

    // ========== ФОРМАТИРОВАНИЕ ==========
    function formatAmount(amount) {
        const abs = Math.abs(amount);
        const sign = amount < 0 ? '-' : '+';
        return `${sign}${CURRENCY_SYMBOL}${abs.toFixed(2)}`;
    }

    function formatBalance(amount) {
        return `${CURRENCY_SYMBOL}${(amount || 0).toFixed(2)}`;
    }


    // ========== AUTO-INIT ==========
    // Проверяем возврат с Stripe при загрузке
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            handlePaymentReturn();
            // Синхронизируем баланс с бэкендом (если доступен)
            syncWithServer();
        });
    }

    // ========== PUBLIC API ==========
    window.WalletEngine = {
        // Данные
        getBalance,
        getCurrentTariff,
        getTransactions,
        
        // Операции
        topUp,
        charge,
        purchaseTariff,
        redeemPromo,
        
        // Возврат
        canRefund,
        processRefund,
        REFUND_WINDOW_HOURS,

        // Инвойс / Чеки
        generateInvoice,
        printInvoice,

        // Мульти-валюта
        getCurrency,
        setCurrency,
        getCurrencyInfo,
        CURRENCIES,
        fetchExchangeRates,
        convertToDisplay,
        formatInCurrency,
        
        // Freedom Pay / Реальные платежи
        createFreedomPaySession,
        createCheckoutSession,
        createStripeCheckout,
        confirmFrontendPayment,
        handlePaymentReturn,
        syncWithServer,
        BACKEND_URL,


        // Pending платежи (верификация)
        createPendingPayment,
        getPendingPayments,
        verifyPayment,
        adminApprovePending,
        
        // Справочники
        TARIFFS,
        PAYMENT_METHODS,
        QUICK_AMOUNTS,
        MIN_TOPUP,
        CURRENCY_SYMBOL,
        
        // Форматирование
        formatAmount,
        formatBalance,
        
        // События
        onUpdate
    };

    console.log('💰 WalletEngine initialized. Balance:', formatBalance(getBalance()));
})();

