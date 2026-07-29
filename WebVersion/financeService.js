// ========== FINANCE SERVICE v1.0 ==========
// API и бизнес-логика для финансовых операций
// Провайдер-независимая архитектура

(function () {
    'use strict';

    const {
        Currency, WalletStatus, LedgerEntryType, LedgerEntryStatus,
        QuoteKind, InvoiceStatus, PaymentAttemptStatus, SubscriptionStatus,
        PaymentProvider, SubscriptionPlan,
        COMMISSION_RATE_TAKE_ORDER, ENGINEERING_EXTRA_PRICE,
        Wallet, LedgerEntry, Quote, Invoice, PaymentAttempt, Subscription, UsageCounter, TakeOrderLock
    } = window.FinanceModels || {};

    if (!Wallet || !LedgerEntry) {
        console.warn('⚠️ FinanceModels not loaded — FinanceService unavailable');
        window.FinanceService = { Pricing: {}, Wallet: {}, Payment: {}, Business: {}, Subscription: {} };
        return;
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /**
     * Get current authenticated user
     * @returns {Object|null} Current user object or null
     */
    function getCurrentUser() {
        // Try multiple sources for current user
        if (window.currentUser) return window.currentUser;

        // Try from localStorage
        const userId = localStorage.getItem('currentUserId');
        if (userId && window.Models?.User) {
            return window.Models.User.find(userId);
        }

        return null;
    }

    /**
     * Get order by ID
     * @param {string} orderId - Order ID
     * @returns {Object|null} Order object or null
     */
    function getOrder(orderId) {
        if (!orderId) return null;

        // Try from Models
        if (window.Models?.Order) {
            return window.Models.Order.find(orderId);
        }

        // Fallback to localStorage
        try {
            const data = localStorage.getItem(`order_${orderId}`);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('getOrder error:', e);
            return null;
        }
    }

    /**
     * Generate mock payment URL for demo/testing
     * @param {string} attemptId - Payment attempt ID
     * @param {number} amount - Payment amount
     * @param {string} currency - Currency code
     * @returns {string} Mock payment URL
     */
    function generateMockPaymentUrl(attemptId, amount, currency) {
        const baseUrl = window.location.origin || 'https://qazgost.kz';
        return `${baseUrl}/payment/mock?attemptId=${attemptId}&amount=${amount}&currency=${currency}`;
    }

    /**
     * Create engineering request (internal helper)
     * @param {string} userId - User ID
     * @param {Object} requestData - Request data
     * @param {Object} usage - Usage counter
     * @returns {Object} Result object
     */
    function createEngineeringRequestInternal(userId, requestData, usage) {
        // Increment usage counter
        usage.engineeringCount++;
        usage.save();

        // Create the request (mock implementation)
        const requestId = 'eng_' + Date.now();
        const request = {
            id: requestId,
            userId,
            ...requestData,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Store in localStorage
        try {
            const requests = JSON.parse(localStorage.getItem('engineering_requests') || '[]');
            requests.push(request);
            localStorage.setItem('engineering_requests', JSON.stringify(requests));
        } catch (e) {
            console.error('createEngineeringRequestInternal storage error:', e);
        }

        return {
            success: true,
            data: {
                requestId,
                usageCount: usage.engineeringCount
            }
        };
    }

    // ========================================
    // PRICING API
    // ========================================

    const PricingAPI = {
        /**
         * Get quote for 3% commission when taking an order
         * POST /pricing/take-order-commission/quote
         */
        getTakeOrderCommissionQuote(orderId) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                // Get order
                const order = getOrder(orderId);
                if (!order) {
                    return { success: false, error: 'Заказ не найден' };
                }

                // Check contractAmountKZT
                if (!order.contractAmountKZT || order.contractAmountKZT <= 0) {
                    return {
                        success: false,
                        error: 'Сумма сделки не определена. Дождитесь принятия вашего отклика заказчиком.',
                        code: 'NO_CONTRACT_AMOUNT'
                    };
                }

                // Check if order already assigned
                if (order.assignedExecutorId) {
                    return {
                        success: false,
                        error: 'Заказ уже закреплён за другим исполнителем',
                        code: 'ORDER_ALREADY_ASSIGNED'
                    };
                }

                // Create quote
                const quote = Quote.createTakeOrderQuote(
                    currentUser.id,
                    orderId,
                    order.contractAmountKZT
                );

                return {
                    success: true,
                    data: {
                        quoteId: quote.id,
                        amount: quote.amount,
                        currency: quote.currency,
                        breakdown: quote.breakdownJson,
                        expiresAt: quote.expiresAt
                    }
                };
            } catch (error) {
                console.error('getTakeOrderCommissionQuote error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Get quote for subscription
         * POST /pricing/subscription/quote
         */
        getSubscriptionQuote(planCode) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                const quote = Quote.createSubscriptionQuote(currentUser.id, planCode);

                return {
                    success: true,
                    data: {
                        quoteId: quote.id,
                        amount: quote.amount,
                        currency: quote.currency,
                        breakdown: quote.breakdownJson,
                        expiresAt: quote.expiresAt
                    }
                };
            } catch (error) {
                console.error('getSubscriptionQuote error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Get quote for extra engineering request
         * POST /pricing/engineering-extra/quote
         */
        getEngineeringExtraQuote() {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                const quote = Quote.createEngineeringExtraQuote(currentUser.id);

                return {
                    success: true,
                    data: {
                        quoteId: quote.id,
                        amount: quote.amount,
                        currency: quote.currency,
                        breakdown: quote.breakdownJson,
                        expiresAt: quote.expiresAt
                    }
                };
            } catch (error) {
                console.error('getEngineeringExtraQuote error:', error);
                return { success: false, error: error.message };
            }
        }
    };

    // ========================================
    // WALLET API
    // ========================================

    const WalletAPI = {
        /**
         * Get current user's wallets
         * GET /wallets/me
         */
        getMyWallets() {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                // Ensure wallets exist
                const walletKZT = Wallet.findOrCreateForUser(currentUser.id, Currency.KZT);
                const walletUSD = Wallet.findOrCreateForUser(currentUser.id, Currency.USD);

                // Sync balances
                walletKZT.syncBalance();
                walletUSD.syncBalance();

                return {
                    success: true,
                    data: {
                        wallets: [
                            {
                                id: walletKZT.id,
                                currency: walletKZT.currency,
                                balance: walletKZT.balanceCached,
                                status: walletKZT.status
                            },
                            {
                                id: walletUSD.id,
                                currency: walletUSD.currency,
                                balance: walletUSD.balanceCached,
                                status: walletUSD.status
                            }
                        ]
                    }
                };
            } catch (error) {
                console.error('getMyWallets error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Get wallet ledger
         * GET /wallets/:id/ledger
         */
        getWalletLedger(walletId) {
            try {
                const wallet = Wallet.findById(walletId);
                if (!wallet) {
                    return { success: false, error: 'Кошелёк не найден' };
                }

                const entries = LedgerEntry.findByWallet(walletId);

                return {
                    success: true,
                    data: {
                        balance: wallet.calculateBalance(),
                        entries: entries.map(e => ({
                            id: e.id,
                            type: e.type,
                            amount: e.amount,
                            currency: e.currency,
                            status: e.status,
                            description: e.description,
                            createdAt: e.createdAt,
                            postedAt: e.postedAt
                        }))
                    }
                };
            } catch (error) {
                console.error('getWalletLedger error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Check if user has enough balance
         */
        hasBalance(userId, amount, currency) {
            const wallet = Wallet.findByUser(userId, currency)[0];
            if (!wallet) return false;
            return wallet.calculateBalance() >= amount;
        },

        /**
         * Spend from wallet balance (internal transaction)
         * POST /wallet/spend
         */
        spend(userId, amount, currency, type, refType, refId, description = '') {
            try {
                const wallet = Wallet.findByUser(userId, currency)[0];
                if (!wallet) {
                    return { success: false, error: 'Кошелёк не найден' };
                }

                const balance = wallet.calculateBalance();
                if (balance < amount) {
                    return {
                        success: false,
                        error: 'Недостаточно средств',
                        code: 'INSUFFICIENT_BALANCE',
                        balance,
                        required: amount
                    };
                }

                // Create idempotency key
                const idempotencyKey = LedgerEntry.generateIdempotencyKey(type, refType, refId, userId);

                // Check idempotency
                if (LedgerEntry.existsByIdempotencyKey(idempotencyKey)) {
                    return {
                        success: false,
                        error: 'Операция уже выложена',
                        code: 'ALREADY_PROCESSED'
                    };
                }

                // Create and post ledger entry
                const entry = new LedgerEntry({
                    walletId: wallet.id,
                    type,
                    amount: -amount, // Negative for spending
                    currency,
                    refType,
                    refId,
                    idempotencyKey,
                    description
                });
                entry.save();
                entry.post();

                // Log
                if (window.Models?.AuditLog) {
                    new window.Models.AuditLog({
                        userId,
                        action: 'WALLET_SPEND',
                        entityType: 'LedgerEntry',
                        entityId: entry.id,
                        newData: { amount, currency, type, refType, refId }
                    }).save();
                }

                return {
                    success: true,
                    data: {
                        entryId: entry.id,
                        newBalance: wallet.calculateBalance()
                    }
                };
            } catch (error) {
                console.error('spend error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Add credit to wallet (for refunds, bonuses, error recovery)
         */
        credit(userId, amount, currency, type, refType, refId, description = '') {
            try {
                const wallet = Wallet.findOrCreateForUser(userId, currency);

                const idempotencyKey = LedgerEntry.generateIdempotencyKey(type, refType, refId, userId);

                if (LedgerEntry.existsByIdempotencyKey(idempotencyKey)) {
                    return { success: true, message: 'Already credited' };
                }

                const entry = new LedgerEntry({
                    walletId: wallet.id,
                    type,
                    amount: amount, // Positive for credit
                    currency,
                    refType,
                    refId,
                    idempotencyKey,
                    description
                });
                entry.save();
                entry.post();

                if (window.Models?.AuditLog) {
                    new window.Models.AuditLog({
                        userId,
                        action: 'WALLET_CREDIT',
                        entityType: 'LedgerEntry',
                        entityId: entry.id,
                        newData: { amount, currency, type, refType, refId, description }
                    }).save();
                }

                return {
                    success: true,
                    data: {
                        entryId: entry.id,
                        newBalance: wallet.calculateBalance()
                    }
                };
            } catch (error) {
                console.error('credit error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Top-up wallet via provider
         * POST /wallets/:id/topup/init
         */
        initTopup(walletId, amount, provider) {
            const maxLimit = 10000000; // 10M KZT default
            try {
                // Validate amount
                if (typeof amount !== 'number' || isNaN(amount)) {
                    return { success: false, error: 'Некорректная сумма' };
                }
                if (amount <= 0) {
                    return { success: false, error: 'Сумма должна быть положительной' };
                }
                // Maximum limit per transaction (10 million KZT or 25000 USD)

                if (amount > maxLimit) {
                    return {
                        success: false,
                        error: `Максимальная сумма пополнения: ${maxLimit.toLocaleString()}`,
                        code: 'AMOUNT_LIMIT_EXCEEDED'
                    };
                }
                // Minimum amount
                const minAmount = 100; // 100 KZT or $1
                if (amount < minAmount) {
                    return {
                        success: false,
                        error: `Минимальная сумма пополнения: ${minAmount}`,
                        code: 'AMOUNT_TOO_SMALL'
                    };
                }

                const wallet = Wallet.findById(walletId);
                if (!wallet) {
                    return { success: false, error: 'Кошелёк не найден' };
                }

                // Create quote
                const quote = new Quote({
                    userId: wallet.userId,
                    kind: 'TOPUP',
                    amount,
                    currency: wallet.currency,
                    breakdownJson: { amount, currency: wallet.currency }
                });
                quote.save();

                // Create invoice
                const invoice = Invoice.createFromQuote(quote);

                // Create payment attempt
                const attempt = new PaymentAttempt({
                    invoiceId: invoice.id,
                    provider,
                    amount,
                    currency: wallet.currency
                });
                attempt.save();

                // In real implementation, would call provider API here
                const paymentUrl = generateMockPaymentUrl(attempt.id, amount, wallet.currency);

                return {
                    success: true,
                    data: {
                        invoiceId: invoice.id,
                        paymentAttemptId: attempt.id,
                        paymentUrl,
                        amount,
                        currency: wallet.currency
                    }
                };
            } catch (error) {
                console.error('initTopup error:', error);
                return { success: false, error: error.message };
            }
        }
    };

    // ========================================
    // INVOICE/PAYMENT API
    // ========================================

    const PaymentAPI = {
        /**
         * Create invoice from quote
         * POST /invoices
         */
        createInvoice(quoteId) {
            try {
                const quote = Quote.findById(quoteId);
                if (!quote) {
                    return { success: false, error: 'Quote не найден' };
                }

                if (quote.isExpired()) {
                    return { success: false, error: 'Quote истёк' };
                }

                if (quote.isUsed()) {
                    return { success: false, error: 'Quote уже использован' };
                }

                const invoice = Invoice.createFromQuote(quote);

                return {
                    success: true,
                    data: {
                        invoiceId: invoice.id,
                        amount: invoice.amount,
                        currency: invoice.currency,
                        status: invoice.status,
                        expiresAt: invoice.expiresAt
                    }
                };
            } catch (error) {
                console.error('createInvoice error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Initiate payment for invoice
         * POST /payments/init
         */
        initPayment(invoiceId, provider = 'stripe') {
            try {
                const invoice = Invoice.findById(invoiceId);
                if (!invoice) {
                    return { success: false, error: 'Invoice не найден' };
                }

                if (invoice.status !== InvoiceStatus.ISSUED) {
                    return { success: false, error: 'Invoice не в статусе ISSUED' };
                }

                if (invoice.isExpired()) {
                    invoice.markExpired();
                    return { success: false, error: 'Invoice истёк' };
                }

                // Create payment attempt
                const attempt = new PaymentAttempt({
                    invoiceId: invoice.id,
                    provider,
                    amount: invoice.amount,
                    currency: invoice.currency
                });
                attempt.save();

                // Mock payment URL (in real app, call provider API)
                const paymentUrl = generateMockPaymentUrl(attempt.id, invoice.amount, invoice.currency);

                return {
                    success: true,
                    data: {
                        paymentAttemptId: attempt.id,
                        paymentUrl,
                        amount: invoice.amount,
                        currency: invoice.currency,
                        provider
                    }
                };
            } catch (error) {
                console.error('initPayment error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Handle payment webhook (provider callback)
         * POST /payments/webhook
         * CRITICAL: Must be idempotent
         */
        handleWebhook(providerPaymentId, status, rawJson = {}) {
            try {
                // Check if already processed (idempotency)
                const existingAttempt = PaymentAttempt.findByProviderPaymentId(providerPaymentId);
                if (existingAttempt && existingAttempt.isSucceeded()) {
                    console.log('Webhook already processed for:', providerPaymentId);
                    return {
                        success: true,
                        message: 'Already processed',
                        alreadyProcessed: true
                    };
                }

                // Find attempt by providerPaymentId or extract from metadata
                let attempt = existingAttempt;
                if (!attempt && rawJson.attemptId) {
                    attempt = PaymentAttempt.findById(rawJson.attemptId);
                }

                if (!attempt) {
                    console.error('PaymentAttempt not found for webhook:', providerPaymentId);
                    return { success: false, error: 'Payment attempt not found' };
                }

                if (status === 'succeeded' || status === 'SUCCEEDED') {
                    attempt.markSucceeded(providerPaymentId, rawJson);

                    // Apply business logic
                    const applyResult = applyPaymentBusinessLogic(attempt);

                    return {
                        success: true,
                        data: {
                            attemptId: attempt.id,
                            status: attempt.status,
                            applied: applyResult.success
                        }
                    };
                } else if (status === 'failed' || status === 'FAILED') {
                    attempt.markFailed(rawJson);
                    return {
                        success: true,
                        data: { attemptId: attempt.id, status: attempt.status }
                    };
                }

                return { success: true, data: { status: 'unknown status' } };
            } catch (error) {
                console.error('handleWebhook error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Simulate successful payment (for demo/testing)
         */
        simulatePaymentSuccess(attemptId) {
            const attempt = PaymentAttempt.findById(attemptId);
            if (!attempt) {
                return { success: false, error: 'Attempt not found' };
            }

            const mockProviderPaymentId = 'mock_' + Date.now();
            return this.handleWebhook(mockProviderPaymentId, 'succeeded', {
                attemptId,
                mock: true
            });
        }
    };

    // ========================================
    // BUSINESS API
    // ========================================

    const BusinessAPI = {
        /**
         * Take order (full flow: quote → pay/spend → apply)
         * POST /orders/:id/take
         */
        takeOrder(orderId) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                const executorId = currentUser.id;

                // 1. Get quote
                const quoteResult = PricingAPI.getTakeOrderCommissionQuote(orderId);
                if (!quoteResult.success) {
                    return quoteResult;
                }

                const { quoteId, amount, currency, breakdown } = quoteResult.data;

                // 2. Check if already trying to take (prevent race)
                if (TakeOrderLock.hasAppliedLock(orderId)) {
                    return {
                        success: false,
                        error: 'Заказ уже закреплён',
                        code: 'ORDER_ALREADY_TAKEN'
                    };
                }

                // 3. Try to pay from balance
                const hasBalance = WalletAPI.hasBalance(executorId, amount, currency);

                if (hasBalance) {
                    // Pay from balance
                    const spendResult = WalletAPI.spend(
                        executorId,
                        amount,
                        currency,
                        LedgerEntryType.COMMISSION_TAKE_ORDER,
                        'Order',
                        orderId,
                        `Комиссия 3% за взятие заказа #${orderId}`
                    );

                    if (!spendResult.success) {
                        return spendResult;
                    }

                    // Apply business action
                    const applyResult = applyTakeOrder(orderId, executorId, spendResult.data.entryId);

                    if (!applyResult.success) {
                        // Refund!
                        WalletAPI.credit(
                            executorId,
                            amount,
                            currency,
                            LedgerEntryType.CREDIT,
                            'Order',
                            orderId,
                            `Возврат комиссии: ${applyResult.error}`
                        );
                        return applyResult;
                    }

                    return {
                        success: true,
                        data: {
                            orderId,
                            executorId,
                            commissionPaid: amount,
                            currency,
                            paidFromBalance: true,
                            breakdown
                        }
                    };
                } else {
                    // Need to pay via provider
                    const invoiceResult = PaymentAPI.createInvoice(quoteId);
                    if (!invoiceResult.success) {
                        return invoiceResult;
                    }

                    const paymentResult = PaymentAPI.initPayment(invoiceResult.data.invoiceId);
                    if (!paymentResult.success) {
                        return paymentResult;
                    }

                    // Create lock
                    const lock = new TakeOrderLock({
                        orderId,
                        executorId,
                        paymentAttemptId: paymentResult.data.paymentAttemptId
                    });
                    lock.save();

                    return {
                        success: true,
                        requiresPayment: true,
                        data: {
                            orderId,
                            invoiceId: invoiceResult.data.invoiceId,
                            paymentAttemptId: paymentResult.data.paymentAttemptId,
                            paymentUrl: paymentResult.data.paymentUrl,
                            amount,
                            currency,
                            breakdown
                        }
                    };
                }
            } catch (error) {
                console.error('takeOrder error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Create engineering request (with subscription/usage check)
         * POST /engineering/requests
         */
        createEngineeringRequest(requestData) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                const userId = currentUser.id;

                // 1. Check subscription
                const subscription = Subscription.findActiveByUser(userId);
                if (!subscription) {
                    return {
                        success: false,
                        requiresSubscription: true,
                        error: 'Требуется подписка Engineering Pro',
                        code: 'SUBSCRIPTION_REQUIRED',
                        subscriptionInfo: {
                            planCode: 'ENGINEERING_PRO',
                            price: SubscriptionPlan.ENGINEERING_PRO.priceAmount,
                            currency: SubscriptionPlan.ENGINEERING_PRO.priceCurrency
                        }
                    };
                }

                // 2. Check usage limit
                const plan = subscription.getPlan();
                const usage = UsageCounter.findOrCreate(userId);

                if (usage.engineeringCount >= plan.engineeringRequestsLimit) {
                    // Need to pay extra $10
                    const quoteResult = PricingAPI.getEngineeringExtraQuote();
                    if (!quoteResult.success) {
                        return quoteResult;
                    }

                    // Check if user has balance
                    const hasBalance = WalletAPI.hasBalance(userId, ENGINEERING_EXTRA_PRICE, Currency.USD);

                    if (hasBalance) {
                        // Pay from balance
                        const tempRefId = 'eng_req_' + Date.now();
                        const spendResult = WalletAPI.spend(
                            userId,
                            ENGINEERING_EXTRA_PRICE,
                            Currency.USD,
                            LedgerEntryType.ENGINEERING_EXTRA,
                            'EngineeringRequest',
                            tempRefId,
                            'Дополнительный инженерный запрос'
                        );

                        if (!spendResult.success) {
                            return spendResult;
                        }

                        // Create request
                        return createEngineeringRequestInternal(userId, requestData, usage);
                    } else {
                        // Need payment
                        return {
                            success: false,
                            requiresPayment: true,
                            error: `Лимит ${plan.engineeringRequestsLimit} запросов исчерпан. Требуется оплата $${ENGINEERING_EXTRA_PRICE}`,
                            code: 'LIMIT_EXCEEDED',
                            quote: quoteResult.data
                        };
                    }
                }

                // 3. Within limit - create for free
                return createEngineeringRequestInternal(userId, requestData, usage);
            } catch (error) {
                console.error('createEngineeringRequest error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Subscribe to plan
         * POST /subscriptions
         */
        subscribe(planCode, paymentMethod = 'balance') {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                const userId = currentUser.id;
                const plan = SubscriptionPlan[planCode];
                if (!plan) {
                    return { success: false, error: 'Неизвестный тарифный план' };
                }

                // Check if already subscribed
                const existing = Subscription.findActiveByUser(userId);
                if (existing) {
                    return {
                        success: false,
                        error: 'У вас уже есть активная подписка',
                        subscription: existing.toJSON()
                    };
                }

                // Get quote
                const quoteResult = PricingAPI.getSubscriptionQuote(planCode);
                if (!quoteResult.success) {
                    return quoteResult;
                }

                const { quoteId, amount, currency } = quoteResult.data;

                if (paymentMethod === 'balance') {
                    // Try to pay from balance
                    const hasBalance = WalletAPI.hasBalance(userId, amount, currency);

                    if (hasBalance) {
                        const spendResult = WalletAPI.spend(
                            userId,
                            amount,
                            currency,
                            LedgerEntryType.SUBSCRIPTION_CHARGE,
                            'Subscription',
                            planCode + '_' + Date.now(),
                            `Подписка ${plan.name}`
                        );

                        if (!spendResult.success) {
                            return spendResult;
                        }

                        // Create subscription
                        const subscription = new Subscription({
                            userId,
                            planCode
                        });
                        subscription.save();

                        // Reset usage counter for new period
                        const usage = UsageCounter.findOrCreate(userId);
                        usage.engineeringCount = 0;
                        usage.save();

                        if (window.Models?.AuditLog) {
                            new window.Models.AuditLog({
                                userId,
                                action: 'SUBSCRIPTION_ACTIVATED',
                                entityType: 'Subscription',
                                entityId: subscription.id,
                                newData: { planCode, amount, currency }
                            }).save();
                        }

                        return {
                            success: true,
                            data: {
                                subscriptionId: subscription.id,
                                planCode,
                                status: subscription.status,
                                renewAt: subscription.renewAt,
                                paidFromBalance: true
                            }
                        };
                    }
                }

                // Need payment via provider
                const invoiceResult = PaymentAPI.createInvoice(quoteId);
                if (!invoiceResult.success) {
                    return invoiceResult;
                }

                const paymentResult = PaymentAPI.initPayment(invoiceResult.data.invoiceId);
                if (!paymentResult.success) {
                    return paymentResult;
                }

                return {
                    success: true,
                    requiresPayment: true,
                    data: {
                        invoiceId: invoiceResult.data.invoiceId,
                        paymentAttemptId: paymentResult.data.paymentAttemptId,
                        paymentUrl: paymentResult.data.paymentUrl,
                        amount,
                        currency,
                        planCode
                    }
                };
            } catch (error) {
                console.error('subscribe error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Get subscription status
         */
        getSubscriptionStatus() {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                const subscription = Subscription.findActiveByUser(currentUser.id);
                const usage = UsageCounter.findOrCreate(currentUser.id);

                if (!subscription) {
                    return {
                        success: true,
                        data: {
                            hasSubscription: false,
                            usage: {
                                engineeringCount: 0,
                                limit: 0
                            }
                        }
                    };
                }

                const plan = subscription.getPlan();

                return {
                    success: true,
                    data: {
                        hasSubscription: true,
                        subscription: {
                            id: subscription.id,
                            planCode: subscription.planCode,
                            planName: plan?.name || subscription.planCode,
                            status: subscription.status,
                            renewAt: subscription.renewAt
                        },
                        usage: {
                            engineeringCount: usage.engineeringCount,
                            limit: plan?.engineeringRequestsLimit || 3,
                            remaining: Math.max(0, (plan?.engineeringRequestsLimit || 3) - usage.engineeringCount)
                        }
                    }
                };
            } catch (error) {
                console.error('getSubscriptionStatus error:', error);
                return { success: false, error: error.message };
            }
        }
    };

    // ========================================
    // RECONCILIATION SERVICE
    // ========================================

    const ReconcileService = {
        /**
         * Find and fix payments that succeeded but weren't applied
         */
        reconcileSucceededPayments() {
            const results = [];
            const unprocessed = PaymentAttempt.findSucceededNotApplied();

            for (const attempt of unprocessed) {
                console.log('Reconciling payment attempt:', attempt.id);

                const applyResult = applyPaymentBusinessLogic(attempt);
                results.push({
                    attemptId: attempt.id,
                    invoiceId: attempt.invoiceId,
                    applied: applyResult.success,
                    error: applyResult.error
                });
            }

            return {
                success: true,
                processed: results.length,
                results
            };
        },

        /**
         * Get list of payments for admin review
         */
        getPaymentsForReview() {
            const attempts = PaymentAttempt.findSucceededNotApplied();
            return {
                success: true,
                data: attempts.map(a => ({
                    id: a.id,
                    invoiceId: a.invoiceId,
                    amount: a.amount,
                    currency: a.currency,
                    provider: a.provider,
                    paidAt: a.paidAt,
                    status: a.status
                }))
            };
        }
    };

    // ========================================
    // ESCROW API
    // ========================================

    const EscrowAPI = {
        /**
         * Создать эскроу для заказа
         * POST /escrow/create
         * @param {string} orderId - ID заказа
         * @returns {{ success, data: { escrowId, amount, commission, netAmount } }}
         */
        createEscrow(orderId) {
            try {
                const currentUser = getCurrentUser();
                if (!currentUser) {
                    return { success: false, error: 'Требуется авторизация' };
                }

                const order = getOrder(orderId);
                if (!order) {
                    return { success: false, error: 'Заказ не найден' };
                }

                // Проверяем, нет ли уже активного эскроу
                const existingEscrows = Escrow.findActiveByOrder(orderId);
                if (existingEscrows.length > 0) {
                    return {
                        success: false,
                        error: 'Для этого заказа уже существует активный эскроу',
                        data: { escrowId: existingEscrows[0].id }
                    };
                }

                const customerId = order.customerId || order.ownerId || currentUser.id;
                const executorId = order.executorId || order.assignedExecutorId;
                if (!executorId) {
                    return { success: false, error: 'Заказ не имеет назначенного исполнителя' };
                }

                const amount = order.contractAmountKZT || order.budgetAmount || order.acceptedPrice || 0;
                if (amount <= 0) {
                    return { success: false, error: 'Сумма заказа не определена' };
                }

                const escrow = Escrow.createForOrder(
                    orderId, customerId, executorId, amount, Currency.KZT
                );

                return {
                    success: true,
                    data: {
                        escrowId: escrow.id,
                        amount: escrow.amount,
                        commission: escrow.commissionAmount,
                        netAmount: escrow.netAmount,
                        currency: escrow.currency,
                        expiresAt: escrow.expiresAt
                    }
                };
            } catch (error) {
                console.error('createEscrow error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Заблокировать средства в эскроу (заказчик оплачивает)
         * POST /escrow/:id/fund
         * @param {string} escrowId - ID эскроу
         * @returns {{ success, data }}
         */
        fundEscrow(escrowId) {
            try {
                const escrow = Escrow.findById(escrowId);
                if (!escrow) {
                    return { success: false, error: 'Эскроу не найден' };
                }

                if (escrow.status !== EscrowStatus.CREATED) {
                    return { success: false, error: `Эскроу уже в статусе: ${escrow.status}` };
                }

                // Списать средства с кошелька заказчика
                const customerWallet = Wallet.findOrCreateForUser(escrow.customerId, escrow.currency);
                const balance = customerWallet.calculateBalance();

                if (balance < escrow.amount) {
                    return {
                        success: false,
                        error: `Недостаточно средств. Баланс: ${balance} ${escrow.currency}, нужно: ${escrow.amount} ${escrow.currency}`,
                        code: 'INSUFFICIENT_FUNDS',
                        data: {
                            balance,
                            required: escrow.amount,
                            currency: escrow.currency
                        }
                    };
                }

                // Создать проводку блокировки
                const idempotencyKey = LedgerEntry.generateIdempotencyKey(
                    EscrowLedgerTypes.ESCROW_HOLD, 'Escrow', escrow.id, escrow.customerId
                );

                if (LedgerEntry.existsByIdempotencyKey(idempotencyKey)) {
                    return { success: false, error: 'Средства уже заблокированы (идемпотентность)' };
                }

                const holdEntry = new LedgerEntry({
                    walletId: customerWallet.id,
                    type: EscrowLedgerTypes.ESCROW_HOLD,
                    amount: -escrow.amount, // Списание
                    currency: escrow.currency,
                    refType: 'Escrow',
                    refId: escrow.id,
                    idempotencyKey,
                    description: `Блокировка средств в эскроу для заказа #${escrow.orderId}`
                });
                holdEntry.save();
                holdEntry.post();

                // Обновить эскроу
                escrow.hold(holdEntry.id);

                // Audit
                if (window.Models?.AuditLog) {
                    window.Models.AuditLog.log('escrow', escrow.id, 'funded', {
                        customerId: escrow.customerId,
                        amount: escrow.amount,
                        holdEntryId: holdEntry.id
                    });
                }

                return {
                    success: true,
                    data: {
                        escrowId: escrow.id,
                        status: escrow.status,
                        holdEntryId: holdEntry.id,
                        amount: escrow.amount,
                        fundedAt: escrow.fundedAt
                    }
                };
            } catch (error) {
                console.error('fundEscrow error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Выплатить средства исполнителю (после приёмки работы)
         * POST /escrow/:id/release
         * @param {string} escrowId - ID эскроу
         * @returns {{ success, data }}
         */
        releaseEscrow(escrowId) {
            try {
                const escrow = Escrow.findById(escrowId);
                if (!escrow) {
                    return { success: false, error: 'Эскроу не найден' };
                }

                if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.DISPUTED) {
                    return { success: false, error: `Невозможно выплатить: эскроу в статусе ${escrow.status}` };
                }

                // 1. Выплата исполнителю (netAmount = amount - commission)
                const executorWallet = Wallet.findOrCreateForUser(escrow.executorId, escrow.currency);

                const releaseKey = LedgerEntry.generateIdempotencyKey(
                    EscrowLedgerTypes.ESCROW_RELEASE, 'Escrow', escrow.id, escrow.executorId
                );

                if (LedgerEntry.existsByIdempotencyKey(releaseKey)) {
                    return { success: false, error: 'Средства уже выплачены (идемпотентность)' };
                }

                const releaseEntry = new LedgerEntry({
                    walletId: executorWallet.id,
                    type: EscrowLedgerTypes.ESCROW_RELEASE,
                    amount: escrow.netAmount, // Зачисление
                    currency: escrow.currency,
                    refType: 'Escrow',
                    refId: escrow.id,
                    idempotencyKey: releaseKey,
                    description: `Выплата по эскроу заказа #${escrow.orderId} (за вычетом комиссии ${escrow.commissionAmount} ${escrow.currency})`
                });
                releaseEntry.save();
                releaseEntry.post();

                // 2. Комиссия платформы (учётная запись — например, системный кошелёк)
                let commissionEntryId = null;
                if (escrow.commissionAmount > 0) {
                    const platformWallet = Wallet.findOrCreateForUser('PLATFORM_SYSTEM', escrow.currency);
                    const commissionEntry = new LedgerEntry({
                        walletId: platformWallet.id,
                        type: EscrowLedgerTypes.ESCROW_COMMISSION,
                        amount: escrow.commissionAmount,
                        currency: escrow.currency,
                        refType: 'Escrow',
                        refId: escrow.id,
                        idempotencyKey: `escrow_comm:${escrow.id}`,
                        description: `Комиссия ${escrow.commissionRate * 100}% от заказа #${escrow.orderId}`
                    });
                    commissionEntry.save();
                    commissionEntry.post();
                    commissionEntryId = commissionEntry.id;
                }

                // 3. Обновить эскроу
                escrow.release(releaseEntry.id, commissionEntryId);

                // Audit
                if (window.Models?.AuditLog) {
                    window.Models.AuditLog.log('escrow', escrow.id, 'released', {
                        executorId: escrow.executorId,
                        netAmount: escrow.netAmount,
                        commission: escrow.commissionAmount,
                        releaseEntryId: releaseEntry.id
                    });
                }

                return {
                    success: true,
                    data: {
                        escrowId: escrow.id,
                        status: escrow.status,
                        executorId: escrow.executorId,
                        netAmount: escrow.netAmount,
                        commission: escrow.commissionAmount,
                        releasedAt: escrow.releasedAt
                    }
                };
            } catch (error) {
                console.error('releaseEscrow error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Вернуть средства заказчику
         * POST /escrow/:id/refund
         * @param {string} escrowId - ID эскроу
         * @param {string} reason - причина возврата
         * @returns {{ success, data }}
         */
        refundEscrow(escrowId, reason = 'Отмена заказа') {
            try {
                const escrow = Escrow.findById(escrowId);
                if (!escrow) {
                    return { success: false, error: 'Эскроу не найден' };
                }

                if (escrow.status !== EscrowStatus.FUNDED && escrow.status !== EscrowStatus.DISPUTED) {
                    return { success: false, error: `Невозможно вернуть: эскроу в статусе ${escrow.status}` };
                }

                // Вернуть полную сумму на кошелёк заказчика
                const customerWallet = Wallet.findOrCreateForUser(escrow.customerId, escrow.currency);

                const refundKey = LedgerEntry.generateIdempotencyKey(
                    EscrowLedgerTypes.ESCROW_REFUND, 'Escrow', escrow.id, escrow.customerId
                );

                if (LedgerEntry.existsByIdempotencyKey(refundKey)) {
                    return { success: false, error: 'Средства уже возвращены (идемпотентность)' };
                }

                const refundEntry = new LedgerEntry({
                    walletId: customerWallet.id,
                    type: EscrowLedgerTypes.ESCROW_REFUND,
                    amount: escrow.amount, // Зачисление обратно
                    currency: escrow.currency,
                    refType: 'Escrow',
                    refId: escrow.id,
                    idempotencyKey: refundKey,
                    description: `Возврат по эскроу заказа #${escrow.orderId}: ${reason}`
                });
                refundEntry.save();
                refundEntry.post();

                // Обновить эскроу
                escrow.refund(refundEntry.id);

                // Audit
                if (window.Models?.AuditLog) {
                    window.Models.AuditLog.log('escrow', escrow.id, 'refunded', {
                        customerId: escrow.customerId,
                        amount: escrow.amount,
                        reason,
                        refundEntryId: refundEntry.id
                    });
                }

                return {
                    success: true,
                    data: {
                        escrowId: escrow.id,
                        status: escrow.status,
                        customerId: escrow.customerId,
                        refundedAmount: escrow.amount,
                        refundedAt: escrow.refundedAt
                    }
                };
            } catch (error) {
                console.error('refundEscrow error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Открыть спор по эскроу
         * POST /escrow/:id/dispute
         * @param {string} escrowId - ID эскроу
         * @param {string} reason - причина спора
         * @returns {{ success, data }}
         */
        disputeEscrow(escrowId, reason) {
            try {
                if (!reason || reason.trim().length < 10) {
                    return { success: false, error: 'Укажите причину спора (минимум 10 символов)' };
                }

                const escrow = Escrow.findById(escrowId);
                if (!escrow) {
                    return { success: false, error: 'Эскроу не найден' };
                }

                if (escrow.status !== EscrowStatus.FUNDED) {
                    return { success: false, error: `Невозможно открыть спор: эскроу в статусе ${escrow.status}` };
                }

                escrow.dispute(reason);

                // Audit
                if (window.Models?.AuditLog) {
                    window.Models.AuditLog.log('escrow', escrow.id, 'disputed', {
                        reason,
                        customerId: escrow.customerId,
                        executorId: escrow.executorId,
                        amount: escrow.amount
                    });
                }

                return {
                    success: true,
                    data: {
                        escrowId: escrow.id,
                        status: escrow.status,
                        reason,
                        disputedAt: escrow.disputedAt
                    }
                };
            } catch (error) {
                console.error('disputeEscrow error:', error);
                return { success: false, error: error.message };
            }
        },

        /**
         * Получить информацию об эскроу
         * GET /escrow/:id
         */
        getEscrow(escrowId) {
            const escrow = Escrow.findById(escrowId);
            if (!escrow) {
                return { success: false, error: 'Эскроу не найден' };
            }
            return { success: true, data: escrow.toJSON() };
        },

        /**
         * Получить эскроу для заказа
         * GET /escrow/order/:orderId
         */
        getEscrowByOrder(orderId) {
            const escrows = Escrow.findByOrder(orderId);
            return {
                success: true,
                data: escrows.map(e => e.toJSON())
            };
        },

        /**
         * Получить все спорные эскроу (для админа)
         * GET /escrow/disputed
         */
        getDisputedEscrows() {
            const disputed = Escrow.findDisputed();
            return {
                success: true,
                data: disputed.map(e => e.toJSON())
            };
        }
    };

    // ========================================
    // INTERNAL HELPERS
    // ========================================

    function getCurrentUser() {
        const userId = localStorage.getItem('userId') || localStorage.getItem('currentUserId');
        if (!userId) return null;
        return { id: userId };
    }

    function getOrder(orderId) {
        // Try to get from DataService first
        if (window.DataService?.Customer?.getOrder) {
            const result = window.DataService.Customer.getOrder(orderId);
            if (result.success) {
                const order = result.data;
                // Ensure contractAmountKZT is set
                if (!order.contractAmountKZT) {
                    // Try to determine from budget or accepted application
                    order.contractAmountKZT = order.budgetAmount || order.acceptedPrice || null;
                }
                return order;
            }
        }

        // Fallback to localStorage
        const orders = JSON.parse(localStorage.getItem('orders') || '[]');
        return orders.find(o => o.id === orderId);
    }

    function generateMockPaymentUrl(attemptId, amount, currency) {
        // In real app, this would be the provider's payment page URL
        return `#payment-mock?attemptId=${attemptId}&amount=${amount}&currency=${currency}`;
    }

    function applyPaymentBusinessLogic(attempt) {
        try {
            if (attempt.isApplied()) {
                return { success: true, message: 'Already applied' };
            }

            const invoice = Invoice.findById(attempt.invoiceId);
            if (!invoice) {
                return { success: false, error: 'Invoice not found' };
            }

            // Mark invoice as paid
            invoice.markPaid();

            // Determine what to do based on quote kind
            const quoteKind = invoice.metaJson?.quoteKind;

            if (quoteKind === QuoteKind.TAKE_ORDER_COMMISSION) {
                // Find the lock and apply take order
                const orderId = invoice.metaJson?.breakdown?.orderId;
                if (orderId) {
                    const locks = TakeOrderLock.findByOrder(orderId);
                    const lock = locks.find(l => l.paymentAttemptId === attempt.id);

                    if (lock) {
                        const result = applyTakeOrder(orderId, lock.executorId, attempt.id);
                        if (result.success) {
                            lock.status = 'APPLIED';
                            lock.save();
                        } else {
                            // Credit back
                            WalletAPI.credit(
                                lock.executorId,
                                invoice.amount,
                                invoice.currency,
                                LedgerEntryType.CREDIT,
                                'PaymentAttempt',
                                attempt.id,
                                'Возврат: ' + result.error
                            );
                            lock.status = 'REFUNDED';
                            lock.save();
                        }
                        attempt.markApplied();
                        return result;
                    }
                }
            } else if (quoteKind === QuoteKind.SUBSCRIPTION) {
                // Activate subscription
                const planCode = invoice.metaJson?.breakdown?.planCode;
                const subscription = new Subscription({
                    userId: invoice.userId,
                    planCode
                });
                subscription.save();

                // Create ledger entry
                const wallet = Wallet.findOrCreateForUser(invoice.userId, invoice.currency);
                const entry = new LedgerEntry({
                    walletId: wallet.id,
                    type: LedgerEntryType.SUBSCRIPTION_CHARGE,
                    amount: -invoice.amount,
                    currency: invoice.currency,
                    refType: 'Subscription',
                    refId: subscription.id,
                    idempotencyKey: `sub:${subscription.id}:${invoice.userId}`,
                    description: 'Подписка ' + planCode
                });
                entry.save();
                entry.post();

                attempt.markApplied();
                return { success: true };
            } else if (quoteKind === QuoteKind.ENGINEERING_EXTRA) {
                // Just record payment, request creation happens separately
                const wallet = Wallet.findOrCreateForUser(invoice.userId, invoice.currency);
                const entry = new LedgerEntry({
                    walletId: wallet.id,
                    type: LedgerEntryType.ENGINEERING_EXTRA,
                    amount: -invoice.amount,
                    currency: invoice.currency,
                    refType: 'Invoice',
                    refId: invoice.id,
                    idempotencyKey: `eng_extra:${invoice.id}:${invoice.userId}`,
                    description: 'Дополнительный инженерный запрос'
                });
                entry.save();
                entry.post();

                attempt.markApplied();
                return { success: true };
            } else if (quoteKind === 'TOPUP') {
                // Add to balance
                const wallet = Wallet.findByUser(invoice.userId, invoice.currency)[0];
                if (wallet) {
                    const entry = new LedgerEntry({
                        walletId: wallet.id,
                        type: LedgerEntryType.TOPUP,
                        amount: invoice.amount,
                        currency: invoice.currency,
                        refType: 'Invoice',
                        refId: invoice.id,
                        idempotencyKey: `topup:${invoice.id}:${invoice.userId}`,
                        description: 'Пополнение баланса'
                    });
                    entry.save();
                    entry.post();
                }
                attempt.markApplied();
                return { success: true };
            }

            attempt.markApplied();
            return { success: true };
        } catch (error) {
            console.error('applyPaymentBusinessLogic error:', error);
            return { success: false, error: error.message };
        }
    }

    function applyTakeOrder(orderId, executorId, paymentRef) {
        try {
            // Check if already assigned (race condition protection)
            const order = getOrder(orderId);
            if (!order) {
                return { success: false, error: 'Заказ не найден' };
            }

            if (order.assignedExecutorId && order.assignedExecutorId !== executorId) {
                return {
                    success: false,
                    error: 'Заказ уже закреплён за другим исполнителем',
                    code: 'RACE_CONDITION'
                };
            }

            // Update order
            order.assignedExecutorId = executorId;
            order.assignedAt = new Date().toISOString();
            order.status = 'IN_PROGRESS';

            // Save via DataService if available
            if (window.DataService?.Executor?.takeOrder) {
                const result = window.DataService.Executor.takeOrder(orderId);
                if (!result.success) {
                    return result;
                }
            } else {
                // Fallback: save to localStorage
                const orders = JSON.parse(localStorage.getItem('orders') || '[]');
                const idx = orders.findIndex(o => o.id === orderId);
                if (idx >= 0) {
                    orders[idx] = order;
                    localStorage.setItem('orders', JSON.stringify(orders));
                }
            }

            // Create Work if exists
            if (window.Models?.Work) {
                const work = new window.Models.Work({
                    orderId,
                    executorId,
                    customerId: order.customerId,
                    status: 'IN_PROGRESS'
                });
                work.save();
            }

            // Audit log
            if (window.Models?.AuditLog) {
                new window.Models.AuditLog({
                    userId: executorId,
                    action: 'ORDER_TAKEN',
                    entityType: 'Order',
                    entityId: orderId,
                    newData: { assignedExecutorId: executorId, paymentRef }
                }).save();
            }

            // Mark lock as applied
            const locks = TakeOrderLock.findByOrder(orderId);
            locks.forEach(lock => {
                if (lock.executorId === executorId) {
                    lock.status = 'APPLIED';
                    lock.save();
                } else if (lock.status === 'PENDING') {
                    // Refund other executors who paid
                    lock.status = 'REFUNDED';
                    lock.save();
                    // Credit them
                    // (would need to look up their payment to know amount)
                }
            });

            return { success: true };
        } catch (error) {
            console.error('applyTakeOrder error:', error);
            return { success: false, error: error.message };
        }
    }

    function createEngineeringRequestInternal(userId, requestData, usage) {
        try {
            // Increment usage in the same "transaction"
            usage.increment('engineeringCount');

            // Create request via EngineeringService if available
            if (window.EngineeringService?.Request?.create) {
                return window.EngineeringService.Request.create(requestData);
            }

            // Fallback
            const request = {
                id: 'eng_req_' + Date.now(),
                customerId: userId,
                status: 'NEW',
                ...requestData,
                createdAt: new Date().toISOString()
            };

            const requests = JSON.parse(localStorage.getItem('engineering_requests') || '[]');
            requests.push(request);
            localStorage.setItem('engineering_requests', JSON.stringify(requests));

            if (window.Models?.AuditLog) {
                new window.Models.AuditLog({
                    userId,
                    action: 'ENGINEERING_REQUEST_CREATED',
                    entityType: 'EngineeringRequest',
                    entityId: request.id,
                    newData: { usageCount: usage.engineeringCount }
                }).save();
            }

            return {
                success: true,
                data: {
                    requestId: request.id,
                    usageCount: usage.engineeringCount
                }
            };
        } catch (error) {
            console.error('createEngineeringRequestInternal error:', error);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // EXPORT
    // ========================================

    window.FinanceService = {
        Pricing: PricingAPI,
        Wallet: WalletAPI,
        Payment: PaymentAPI,
        Business: BusinessAPI,
        Reconcile: ReconcileService,
        Escrow: EscrowAPI
    };

    console.log('✅ FinanceService v2.0 loaded (with Escrow)');

})();
