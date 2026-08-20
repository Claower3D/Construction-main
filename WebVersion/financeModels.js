// ========== FINANCE MODELS v1.0 ==========
// Финансовое ядро: кошельки, проводки, счета, платежи, подписки
// Принципы: Ledger - источник истины, идемпотентность, транзакционность

(function () {
    'use strict';

    // ========================================
    // CONSTANTS & ENUMS
    // ========================================

    const Currency = Object.freeze({
        KZT: 'KZT',
        USD: 'USD'
    });

    const WalletStatus = Object.freeze({
        ACTIVE: 'ACTIVE',
        FROZEN: 'FROZEN',
        CLOSED: 'CLOSED'
    });

    const LedgerEntryType = Object.freeze({
        TOPUP: 'TOPUP',                           // Пополнение +
        COMMISSION_TAKE_ORDER: 'COMMISSION_TAKE_ORDER', // 3% за взятие заказа -
        SUBSCRIPTION_CHARGE: 'SUBSCRIPTION_CHARGE',     // Подписка $20 -
        ENGINEERING_EXTRA: 'ENGINEERING_EXTRA',         // Доп. инженерный запрос $10 -
        REFUND: 'REFUND',                               // Возврат +
        BONUS: 'BONUS',                                 // Бонус +
        CREDIT: 'CREDIT'                                // Кредит при ошибке +
    });

    const LedgerEntryStatus = Object.freeze({
        PENDING: 'PENDING',
        POSTED: 'POSTED',
        REVERSED: 'REVERSED'
    });

    const QuoteKind = Object.freeze({
        TAKE_ORDER_COMMISSION: 'TAKE_ORDER_COMMISSION',
        SUBSCRIPTION: 'SUBSCRIPTION',
        ENGINEERING_EXTRA: 'ENGINEERING_EXTRA'
    });

    const InvoiceStatus = Object.freeze({
        ISSUED: 'ISSUED',
        PAID: 'PAID',
        EXPIRED: 'EXPIRED',
        CANCELED: 'CANCELED'
    });

    const PaymentAttemptStatus = Object.freeze({
        CREATED: 'CREATED',
        PROCESSING: 'PROCESSING',
        SUCCEEDED: 'SUCCEEDED',
        FAILED: 'FAILED',
        CANCELED: 'CANCELED'
    });

    const SubscriptionStatus = Object.freeze({
        ACTIVE: 'ACTIVE',
        CANCELED: 'CANCELED',
        EXPIRED: 'EXPIRED',
        PAST_DUE: 'PAST_DUE'
    });

    const PaymentProvider = Object.freeze({

        PAYBOX: 'PAYBOX',
        HALYK: 'HALYK',
        CLOUDPAYMENTS: 'CLOUDPAYMENTS',
        INTERNAL: 'INTERNAL' // Списание с баланса
    });

    // Subscription Plans
    const SubscriptionPlan = Object.freeze({
        ENGINEERING_PRO: {
            code: 'ENGINEERING_PRO',
            name: 'Engineering Pro',
            priceAmount: 20,
            priceCurrency: Currency.USD,
            engineeringRequestsLimit: 3,
            durationDays: 30
        }
    });

    // Commission rates
    const COMMISSION_RATE_TAKE_ORDER = 0.03; // 3%
    const ENGINEERING_EXTRA_PRICE = 10; // $10 USD

    // ========================================
    // STORAGE HELPERS
    // ========================================

    const Storage = window.Models?.Storage || {
        getAll: (key) => {
            try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
        },
        save: (key, data) => {
            try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) { console.error(e); }
        },
        generateId: () => 'fin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    };

    // ========================================
    // WALLET MODEL
    // ========================================

    class Wallet {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.userId = data.userId || null;
            this.currency = data.currency || Currency.KZT;
            this.status = data.status || WalletStatus.ACTIVE;
            this.balanceCached = data.balanceCached || 0; // Cached, not source of truth
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        /**
         * Calculate actual balance from ledger entries (source of truth)
         */
        calculateBalance() {
            const entries = LedgerEntry.findByWallet(this.id);
            let balance = 0;
            entries.forEach(entry => {
                if (entry.status === LedgerEntryStatus.POSTED) {
                    balance += entry.amount; // amount is signed (+/-)
                }
            });
            return balance;
        }

        /**
         * Update cached balance from ledger
         */
        syncBalance() {
            this.balanceCached = this.calculateBalance();
            this.updatedAt = new Date().toISOString();
            this.save();
            return this.balanceCached;
        }

        validate() {
            if (!this.userId) return { valid: false, error: 'userId обязателен' };
            if (!Object.values(Currency).includes(this.currency)) {
                return { valid: false, error: 'Неверная валюта' };
            }
            return { valid: true };
        }

        save() {
            const validation = this.validate();
            if (!validation.valid) throw new Error(validation.error);

            const wallets = Storage.getAll('finance_wallets');
            const idx = wallets.findIndex(w => w.id === this.id);
            if (idx >= 0) {
                wallets[idx] = this.toJSON();
            } else {
                wallets.push(this.toJSON());
            }
            Storage.save('finance_wallets', wallets);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                userId: this.userId,
                currency: this.currency,
                status: this.status,
                balanceCached: this.balanceCached,
                createdAt: this.createdAt,
                updatedAt: this.updatedAt
            };
        }

        static fromJSON(data) {
            return new Wallet(data);
        }

        static findById(id) {
            const wallets = Storage.getAll('finance_wallets');
            const data = wallets.find(w => w.id === id);
            return data ? Wallet.fromJSON(data) : null;
        }

        static findByUser(userId, currency = null) {
            const wallets = Storage.getAll('finance_wallets');
            return wallets
                .filter(w => w.userId === userId && (!currency || w.currency === currency))
                .map(Wallet.fromJSON);
        }

        static findOrCreateForUser(userId, currency) {
            const existing = Wallet.findByUser(userId, currency);
            if (existing.length > 0) return existing[0];

            const wallet = new Wallet({ userId, currency });
            wallet.save();

            // Log creation
            if (window.Models?.AuditLog) {
                new window.Models.AuditLog({
                    userId,
                    action: 'WALLET_CREATED',
                    entityType: 'Wallet',
                    entityId: wallet.id,
                    newData: { currency }
                }).save();
            }

            return wallet;
        }
    }

    // ========================================
    // LEDGER ENTRY MODEL (Проводки)
    // ========================================

    class LedgerEntry {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.walletId = data.walletId || null;
            this.type = data.type || null;
            this.amount = data.amount || 0; // Signed: + for credit, - for debit
            this.currency = data.currency || Currency.KZT;
            this.status = data.status || LedgerEntryStatus.PENDING;
            this.refType = data.refType || null; // e.g., 'Order', 'Invoice', 'Subscription'
            this.refId = data.refId || null;
            this.idempotencyKey = data.idempotencyKey || null; // CRITICAL for preventing duplicates
            this.description = data.description || '';
            this.metaJson = data.metaJson || {};
            this.createdAt = data.createdAt || new Date().toISOString();
            this.postedAt = data.postedAt || null;
            this.reversedAt = data.reversedAt || null;
        }

        /**
         * Generate idempotency key
         */
        static generateIdempotencyKey(type, refType, refId, userId) {
            return `${type}:${refType}:${refId}:${userId}`;
        }

        /**
         * Check if idempotency key already exists
         */
        static existsByIdempotencyKey(key) {
            const entries = Storage.getAll('finance_ledger');
            return entries.some(e => e.idempotencyKey === key);
        }

        /**
         * Post the entry (make it effective)
         */
        post() {
            if (this.status !== LedgerEntryStatus.PENDING) {
                throw new Error('Only PENDING entries can be posted');
            }
            this.status = LedgerEntryStatus.POSTED;
            this.postedAt = new Date().toISOString();
            this.save();

            // Update wallet cached balance
            const wallet = Wallet.findById(this.walletId);
            if (wallet) wallet.syncBalance();

            return this;
        }

        /**
         * Reverse the entry (cancel it)
         */
        reverse(reason = '') {
            if (this.status !== LedgerEntryStatus.POSTED) {
                throw new Error('Only POSTED entries can be reversed');
            }
            this.status = LedgerEntryStatus.REVERSED;
            this.reversedAt = new Date().toISOString();
            this.metaJson.reversalReason = reason;
            this.save();

            // Update wallet cached balance
            const wallet = Wallet.findById(this.walletId);
            if (wallet) wallet.syncBalance();

            return this;
        }

        validate() {
            if (!this.walletId) return { valid: false, error: 'walletId обязателен' };
            if (!this.type) return { valid: false, error: 'type обязателен' };
            if (typeof this.amount !== 'number') return { valid: false, error: 'amount должен быть числом' };
            return { valid: true };
        }

        save() {
            const validation = this.validate();
            if (!validation.valid) throw new Error(validation.error);

            const entries = Storage.getAll('finance_ledger');

            // Check idempotency
            if (this.idempotencyKey) {
                const existing = entries.find(e => e.idempotencyKey === this.idempotencyKey && e.id !== this.id);
                if (existing) {
                    console.warn('LedgerEntry with this idempotencyKey already exists:', this.idempotencyKey);
                    return LedgerEntry.fromJSON(existing);
                }
            }

            const idx = entries.findIndex(e => e.id === this.id);
            if (idx >= 0) {
                entries[idx] = this.toJSON();
            } else {
                entries.push(this.toJSON());
            }
            Storage.save('finance_ledger', entries);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                walletId: this.walletId,
                type: this.type,
                amount: this.amount,
                currency: this.currency,
                status: this.status,
                refType: this.refType,
                refId: this.refId,
                idempotencyKey: this.idempotencyKey,
                description: this.description,
                metaJson: this.metaJson,
                createdAt: this.createdAt,
                postedAt: this.postedAt,
                reversedAt: this.reversedAt
            };
        }

        static fromJSON(data) {
            return new LedgerEntry(data);
        }

        static findById(id) {
            const entries = Storage.getAll('finance_ledger');
            const data = entries.find(e => e.id === id);
            return data ? LedgerEntry.fromJSON(data) : null;
        }

        static findByWallet(walletId) {
            const entries = Storage.getAll('finance_ledger');
            return entries.filter(e => e.walletId === walletId).map(LedgerEntry.fromJSON);
        }

        static findByRef(refType, refId) {
            const entries = Storage.getAll('finance_ledger');
            return entries.filter(e => e.refType === refType && e.refId === refId).map(LedgerEntry.fromJSON);
        }
    }

    // ========================================
    // QUOTE MODEL (Расчёт стоимости)
    // ========================================

    class Quote {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.userId = data.userId || null;
            this.kind = data.kind || null;
            this.amount = data.amount || 0;
            this.currency = data.currency || Currency.KZT;
            this.breakdownJson = data.breakdownJson || {}; // Детализация расчёта
            this.expiresAt = data.expiresAt || this._defaultExpiry();
            this.createdAt = data.createdAt || new Date().toISOString();
            this.usedInvoiceId = data.usedInvoiceId || null; // Invoice created from this quote
        }

        _defaultExpiry() {
            const date = new Date();
            date.setMinutes(date.getMinutes() + 30); // 30 minutes
            return date.toISOString();
        }

        isExpired() {
            return new Date() > new Date(this.expiresAt);
        }

        isUsed() {
            return !!this.usedInvoiceId;
        }

        markUsed(invoiceId) {
            this.usedInvoiceId = invoiceId;
            this.save();
        }

        save() {
            const quotes = Storage.getAll('finance_quotes');
            const idx = quotes.findIndex(q => q.id === this.id);
            if (idx >= 0) {
                quotes[idx] = this.toJSON();
            } else {
                quotes.push(this.toJSON());
            }
            Storage.save('finance_quotes', quotes);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                userId: this.userId,
                kind: this.kind,
                amount: this.amount,
                currency: this.currency,
                breakdownJson: this.breakdownJson,
                expiresAt: this.expiresAt,
                createdAt: this.createdAt,
                usedInvoiceId: this.usedInvoiceId
            };
        }

        static fromJSON(data) {
            return new Quote(data);
        }

        static findById(id) {
            const quotes = Storage.getAll('finance_quotes');
            const data = quotes.find(q => q.id === id);
            return data ? Quote.fromJSON(data) : null;
        }

        /**
         * Calculate 3% commission for taking an order
         */
        static calculateTakeOrderCommission(contractAmountKZT) {
            const commission = Math.round(contractAmountKZT * COMMISSION_RATE_TAKE_ORDER);
            return {
                amount: commission,
                currency: Currency.KZT,
                breakdown: {
                    contractAmount: contractAmountKZT,
                    rate: COMMISSION_RATE_TAKE_ORDER,
                    ratePercent: (COMMISSION_RATE_TAKE_ORDER * 100) + '%',
                    commission: commission
                }
            };
        }

        /**
         * Create quote for taking an order
         */
        static createTakeOrderQuote(userId, orderId, contractAmountKZT) {
            const calc = Quote.calculateTakeOrderCommission(contractAmountKZT);
            const quote = new Quote({
                userId,
                kind: QuoteKind.TAKE_ORDER_COMMISSION,
                amount: calc.amount,
                currency: calc.currency,
                breakdownJson: {
                    ...calc.breakdown,
                    orderId
                }
            });
            quote.save();
            return quote;
        }

        /**
         * Create quote for subscription
         */
        static createSubscriptionQuote(userId, planCode) {
            const plan = SubscriptionPlan[planCode];
            if (!plan) throw new Error('Unknown plan: ' + planCode);

            const quote = new Quote({
                userId,
                kind: QuoteKind.SUBSCRIPTION,
                amount: plan.priceAmount,
                currency: plan.priceCurrency,
                breakdownJson: {
                    planCode: plan.code,
                    planName: plan.name,
                    price: plan.priceAmount,
                    currency: plan.priceCurrency,
                    engineeringRequestsLimit: plan.engineeringRequestsLimit,
                    durationDays: plan.durationDays
                }
            });
            quote.save();
            return quote;
        }

        /**
         * Create quote for extra engineering request
         */
        static createEngineeringExtraQuote(userId) {
            const quote = new Quote({
                userId,
                kind: QuoteKind.ENGINEERING_EXTRA,
                amount: ENGINEERING_EXTRA_PRICE,
                currency: Currency.USD,
                breakdownJson: {
                    description: 'Дополнительный инженерный запрос (сверх лимита подписки)',
                    price: ENGINEERING_EXTRA_PRICE,
                    currency: Currency.USD
                }
            });
            quote.save();
            return quote;
        }
    }

    // ========================================
    // INVOICE MODEL (Счёт)
    // ========================================

    class Invoice {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.userId = data.userId || null;
            this.quoteId = data.quoteId || null;
            this.amount = data.amount || 0;
            this.currency = data.currency || Currency.KZT;
            this.status = data.status || InvoiceStatus.ISSUED;
            this.expiresAt = data.expiresAt || this._defaultExpiry();
            this.paidAt = data.paidAt || null;
            this.metaJson = data.metaJson || {};
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        _defaultExpiry() {
            const date = new Date();
            date.setHours(date.getHours() + 24); // 24 hours
            return date.toISOString();
        }

        isExpired() {
            return this.status === InvoiceStatus.ISSUED && new Date() > new Date(this.expiresAt);
        }

        markPaid() {
            this.status = InvoiceStatus.PAID;
            this.paidAt = new Date().toISOString();
            this.save();
        }

        markExpired() {
            this.status = InvoiceStatus.EXPIRED;
            this.save();
        }

        cancel() {
            if (this.status === InvoiceStatus.PAID) {
                throw new Error('Cannot cancel paid invoice');
            }
            this.status = InvoiceStatus.CANCELED;
            this.save();
        }

        save() {
            const invoices = Storage.getAll('finance_invoices');
            const idx = invoices.findIndex(i => i.id === this.id);
            if (idx >= 0) {
                invoices[idx] = this.toJSON();
            } else {
                invoices.push(this.toJSON());
            }
            Storage.save('finance_invoices', invoices);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                userId: this.userId,
                quoteId: this.quoteId,
                amount: this.amount,
                currency: this.currency,
                status: this.status,
                expiresAt: this.expiresAt,
                paidAt: this.paidAt,
                metaJson: this.metaJson,
                createdAt: this.createdAt
            };
        }

        static fromJSON(data) {
            return new Invoice(data);
        }

        static findById(id) {
            const invoices = Storage.getAll('finance_invoices');
            const data = invoices.find(i => i.id === id);
            return data ? Invoice.fromJSON(data) : null;
        }

        static findByUser(userId, status = null) {
            const invoices = Storage.getAll('finance_invoices');
            return invoices
                .filter(i => i.userId === userId && (!status || i.status === status))
                .map(Invoice.fromJSON);
        }

        static createFromQuote(quote) {
            if (quote.isExpired()) throw new Error('Quote expired');
            if (quote.isUsed()) throw new Error('Quote already used');

            const invoice = new Invoice({
                userId: quote.userId,
                quoteId: quote.id,
                amount: quote.amount,
                currency: quote.currency,
                metaJson: {
                    quoteKind: quote.kind,
                    breakdown: quote.breakdownJson
                }
            });
            invoice.save();
            quote.markUsed(invoice.id);

            return invoice;
        }
    }

    // ========================================
    // PAYMENT ATTEMPT MODEL
    // ========================================

    class PaymentAttempt {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.invoiceId = data.invoiceId || null;
            this.provider = data.provider || PaymentProvider.INTERNAL;
            this.providerPaymentId = data.providerPaymentId || null; // UNIQUE from provider
            this.status = data.status || PaymentAttemptStatus.CREATED;
            this.amount = data.amount || 0;
            this.currency = data.currency || Currency.KZT;
            this.rawJson = data.rawJson || {}; // Full provider response
            this.createdAt = data.createdAt || new Date().toISOString();
            this.paidAt = data.paidAt || null;
            this.appliedAt = data.appliedAt || null; // When business action was applied
        }

        isSucceeded() {
            return this.status === PaymentAttemptStatus.SUCCEEDED;
        }

        isApplied() {
            return !!this.appliedAt;
        }

        markSucceeded(providerPaymentId, rawJson = {}) {
            this.status = PaymentAttemptStatus.SUCCEEDED;
            this.providerPaymentId = providerPaymentId;
            this.paidAt = new Date().toISOString();
            this.rawJson = rawJson;
            this.save();
        }

        markFailed(rawJson = {}) {
            this.status = PaymentAttemptStatus.FAILED;
            this.rawJson = rawJson;
            this.save();
        }

        markApplied() {
            this.appliedAt = new Date().toISOString();
            this.save();
        }

        save() {
            const attempts = Storage.getAll('finance_payment_attempts');

            // Check uniqueness of providerPaymentId
            if (this.providerPaymentId) {
                const existing = attempts.find(a =>
                    a.providerPaymentId === this.providerPaymentId &&
                    a.id !== this.id
                );
                if (existing) {
                    console.warn('PaymentAttempt with this providerPaymentId already exists');
                    return PaymentAttempt.fromJSON(existing);
                }
            }

            const idx = attempts.findIndex(a => a.id === this.id);
            if (idx >= 0) {
                attempts[idx] = this.toJSON();
            } else {
                attempts.push(this.toJSON());
            }
            Storage.save('finance_payment_attempts', attempts);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                invoiceId: this.invoiceId,
                provider: this.provider,
                providerPaymentId: this.providerPaymentId,
                status: this.status,
                amount: this.amount,
                currency: this.currency,
                rawJson: this.rawJson,
                createdAt: this.createdAt,
                paidAt: this.paidAt,
                appliedAt: this.appliedAt
            };
        }

        static fromJSON(data) {
            return new PaymentAttempt(data);
        }

        static findById(id) {
            const attempts = Storage.getAll('finance_payment_attempts');
            const data = attempts.find(a => a.id === id);
            return data ? PaymentAttempt.fromJSON(data) : null;
        }

        static findByProviderPaymentId(providerPaymentId) {
            const attempts = Storage.getAll('finance_payment_attempts');
            const data = attempts.find(a => a.providerPaymentId === providerPaymentId);
            return data ? PaymentAttempt.fromJSON(data) : null;
        }

        static findByInvoice(invoiceId) {
            const attempts = Storage.getAll('finance_payment_attempts');
            return attempts.filter(a => a.invoiceId === invoiceId).map(PaymentAttempt.fromJSON);
        }

        /**
         * Find succeeded but not applied payments (for reconciliation)
         */
        static findSucceededNotApplied() {
            const attempts = Storage.getAll('finance_payment_attempts');
            return attempts
                .filter(a => a.status === PaymentAttemptStatus.SUCCEEDED && !a.appliedAt)
                .map(PaymentAttempt.fromJSON);
        }
    }

    // ========================================
    // SUBSCRIPTION MODEL
    // ========================================

    class Subscription {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.userId = data.userId || null;
            this.planCode = data.planCode || null;
            this.status = data.status || SubscriptionStatus.ACTIVE;
            this.startAt = data.startAt || new Date().toISOString();
            this.renewAt = data.renewAt || this._calculateRenewAt();
            this.providerSubId = data.providerSubId || null; // If managed by provider
            this.createdAt = data.createdAt || new Date().toISOString();
        }

        _calculateRenewAt() {
            const plan = SubscriptionPlan[this.planCode];
            const days = plan ? plan.durationDays : 30;
            const date = new Date();
            date.setDate(date.getDate() + days);
            return date.toISOString();
        }

        isActive() {
            return this.status === SubscriptionStatus.ACTIVE && new Date() < new Date(this.renewAt);
        }

        getPlan() {
            return SubscriptionPlan[this.planCode] || null;
        }

        renew() {
            const plan = this.getPlan();
            if (!plan) throw new Error('Unknown plan');
            const date = new Date();
            date.setDate(date.getDate() + plan.durationDays);
            this.renewAt = date.toISOString();
            this.status = SubscriptionStatus.ACTIVE;
            this.save();
        }

        cancel() {
            this.status = SubscriptionStatus.CANCELED;
            this.save();
        }

        expire() {
            this.status = SubscriptionStatus.EXPIRED;
            this.save();
        }

        save() {
            const subs = Storage.getAll('finance_subscriptions');
            const idx = subs.findIndex(s => s.id === this.id);
            if (idx >= 0) {
                subs[idx] = this.toJSON();
            } else {
                subs.push(this.toJSON());
            }
            Storage.save('finance_subscriptions', subs);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                userId: this.userId,
                planCode: this.planCode,
                status: this.status,
                startAt: this.startAt,
                renewAt: this.renewAt,
                providerSubId: this.providerSubId,
                createdAt: this.createdAt
            };
        }

        static fromJSON(data) {
            return new Subscription(data);
        }

        static findById(id) {
            const subs = Storage.getAll('finance_subscriptions');
            const data = subs.find(s => s.id === id);
            return data ? Subscription.fromJSON(data) : null;
        }

        static findActiveByUser(userId) {
            const subs = Storage.getAll('finance_subscriptions');
            const active = subs.find(s =>
                s.userId === userId &&
                s.status === SubscriptionStatus.ACTIVE &&
                new Date() < new Date(s.renewAt)
            );
            return active ? Subscription.fromJSON(active) : null;
        }

        static findByUser(userId) {
            const subs = Storage.getAll('finance_subscriptions');
            return subs.filter(s => s.userId === userId).map(Subscription.fromJSON);
        }
    }

    // ========================================
    // USAGE COUNTER MODEL
    // ========================================

    class UsageCounter {
        constructor(data = {}) {
            this.userId = data.userId || null;
            this.periodYYYYMM = data.periodYYYYMM || UsageCounter.currentPeriod();
            this.engineeringCount = data.engineeringCount || 0;
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        static currentPeriod() {
            const now = new Date();
            return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        }

        increment(field = 'engineeringCount') {
            this[field] = (this[field] || 0) + 1;
            this.updatedAt = new Date().toISOString();
            this.save();
            return this[field];
        }

        save() {
            const counters = Storage.getAll('finance_usage');
            const key = `${this.userId}:${this.periodYYYYMM}`;
            const idx = counters.findIndex(c => `${c.userId}:${c.periodYYYYMM}` === key);
            if (idx >= 0) {
                counters[idx] = this.toJSON();
            } else {
                counters.push(this.toJSON());
            }
            Storage.save('finance_usage', counters);
            return this;
        }

        toJSON() {
            return {
                userId: this.userId,
                periodYYYYMM: this.periodYYYYMM,
                engineeringCount: this.engineeringCount,
                updatedAt: this.updatedAt
            };
        }

        static fromJSON(data) {
            return new UsageCounter(data);
        }

        static findOrCreate(userId, periodYYYYMM = null) {
            const period = periodYYYYMM || UsageCounter.currentPeriod();
            const counters = Storage.getAll('finance_usage');
            const existing = counters.find(c => c.userId === userId && c.periodYYYYMM === period);

            if (existing) return UsageCounter.fromJSON(existing);

            const counter = new UsageCounter({ userId, periodYYYYMM: period });
            counter.save();
            return counter;
        }
    }

    // ========================================
    // TAKE ORDER LOCK (для предотвращения гонок)
    // ========================================

    class TakeOrderLock {
        constructor(data = {}) {
            this.orderId = data.orderId || null;
            this.executorId = data.executorId || null;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.paymentAttemptId = data.paymentAttemptId || null;
            this.status = data.status || 'PENDING'; // PENDING, APPLIED, REFUNDED
        }

        save() {
            const locks = Storage.getAll('finance_take_order_locks');
            const idx = locks.findIndex(l => l.orderId === this.orderId && l.executorId === this.executorId);
            if (idx >= 0) {
                locks[idx] = this.toJSON();
            } else {
                locks.push(this.toJSON());
            }
            Storage.save('finance_take_order_locks', locks);
            return this;
        }

        toJSON() {
            return {
                orderId: this.orderId,
                executorId: this.executorId,
                createdAt: this.createdAt,
                paymentAttemptId: this.paymentAttemptId,
                status: this.status
            };
        }

        static fromJSON(data) {
            return new TakeOrderLock(data);
        }

        static findByOrder(orderId) {
            const locks = Storage.getAll('finance_take_order_locks');
            return locks.filter(l => l.orderId === orderId).map(TakeOrderLock.fromJSON);
        }

        static exists(orderId, executorId) {
            const locks = Storage.getAll('finance_take_order_locks');
            return locks.some(l => l.orderId === orderId && l.executorId === executorId);
        }

        static hasAppliedLock(orderId) {
            const locks = Storage.getAll('finance_take_order_locks');
            return locks.some(l => l.orderId === orderId && l.status === 'APPLIED');
        }
    }

    // ========================================
    // ESCROW STATUS
    // ========================================

    const EscrowStatus = Object.freeze({
        CREATED: 'CREATED',       // Эскроу создан, ожидает оплаты заказчиком
        FUNDED: 'FUNDED',         // Средства заблокированы
        RELEASED: 'RELEASED',     // Средства выплачены исполнителю
        DISPUTED: 'DISPUTED',     // Спор (средства заморожены)
        REFUNDED: 'REFUNDED',     // Возврат заказчику
        PARTIALLY_RELEASED: 'PARTIALLY_RELEASED', // Частичная выплата
        EXPIRED: 'EXPIRED'        // Истёк, средства возвращены
    });

    // Дополнительные типы проводок для Escrow
    const EscrowLedgerTypes = Object.freeze({
        ESCROW_HOLD: 'ESCROW_HOLD',           // Блокировка средств заказчика -
        ESCROW_RELEASE: 'ESCROW_RELEASE',     // Выплата исполнителю +
        ESCROW_REFUND: 'ESCROW_REFUND',       // Возврат заказчику +
        ESCROW_COMMISSION: 'ESCROW_COMMISSION' // Комиссия платформы -
    });

    // ========================================
    // ESCROW MODEL
    // ========================================

    class Escrow {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.orderId = data.orderId || null;
            this.customerId = data.customerId || null;     // Заказчик (плательщик)
            this.executorId = data.executorId || null;     // Исполнитель (получатель)
            this.amount = data.amount || 0;                // Полная сумма сделки
            this.currency = data.currency || Currency.KZT;
            this.commissionRate = data.commissionRate || COMMISSION_RATE_TAKE_ORDER; // 3%
            this.commissionAmount = data.commissionAmount || 0;
            this.netAmount = data.netAmount || 0;          // Сумма к выплате исполнителю
            this.status = data.status || EscrowStatus.CREATED;
            this.description = data.description || '';

            // Ledger entry references
            this.holdEntryId = data.holdEntryId || null;       // ID проводки блокировки
            this.releaseEntryId = data.releaseEntryId || null; // ID проводки выплаты
            this.refundEntryId = data.refundEntryId || null;   // ID проводки возврата
            this.commissionEntryId = data.commissionEntryId || null;

            // Dispute
            this.disputeReason = data.disputeReason || '';
            this.disputeResolvedBy = data.disputeResolvedBy || null; // admin userId
            this.disputeResolution = data.disputeResolution || ''; // 'release' | 'refund' | 'split'

            // Timestamps
            this.createdAt = data.createdAt || new Date().toISOString();
            this.fundedAt = data.fundedAt || null;
            this.releasedAt = data.releasedAt || null;
            this.refundedAt = data.refundedAt || null;
            this.disputedAt = data.disputedAt || null;
            this.expiresAt = data.expiresAt || this._defaultExpiry();
        }

        _defaultExpiry() {
            const date = new Date();
            date.setDate(date.getDate() + 7); // 7 дней на сделку
            return date.toISOString();
        }

        /**
         * Рассчитать комиссию и чистую сумму
         */
        calculateAmounts() {
            this.commissionAmount = Math.round(this.amount * this.commissionRate);
            this.netAmount = this.amount - this.commissionAmount;
            return { commission: this.commissionAmount, net: this.netAmount };
        }

        /**
         * Заблокировать средства (CREATED → FUNDED)
         */
        hold(holdEntryId) {
            if (this.status !== EscrowStatus.CREATED) {
                throw new Error(`Cannot hold: escrow is ${this.status}`);
            }
            this.status = EscrowStatus.FUNDED;
            this.holdEntryId = holdEntryId;
            this.fundedAt = new Date().toISOString();
            this.save();
            return this;
        }

        /**
         * Выплатить исполнителю (FUNDED → RELEASED)
         * Вызывается после приёмки работы заказчиком
         */
        release(releaseEntryId, commissionEntryId = null) {
            if (this.status !== EscrowStatus.FUNDED && this.status !== EscrowStatus.DISPUTED) {
                throw new Error(`Cannot release: escrow is ${this.status}`);
            }
            this.status = EscrowStatus.RELEASED;
            this.releaseEntryId = releaseEntryId;
            this.commissionEntryId = commissionEntryId;
            this.releasedAt = new Date().toISOString();
            this.save();
            return this;
        }

        /**
         * Возврат заказчику (FUNDED → REFUNDED)
         * Вызывается при отмене заказа или проигрыше спора исполнителем
         */
        refund(refundEntryId) {
            if (this.status !== EscrowStatus.FUNDED && this.status !== EscrowStatus.DISPUTED) {
                throw new Error(`Cannot refund: escrow is ${this.status}`);
            }
            this.status = EscrowStatus.REFUNDED;
            this.refundEntryId = refundEntryId;
            this.refundedAt = new Date().toISOString();
            this.save();
            return this;
        }

        /**
         * Открыть спор (FUNDED → DISPUTED)
         */
        dispute(reason) {
            if (this.status !== EscrowStatus.FUNDED) {
                throw new Error(`Cannot dispute: escrow is ${this.status}`);
            }
            this.status = EscrowStatus.DISPUTED;
            this.disputeReason = reason;
            this.disputedAt = new Date().toISOString();
            this.save();
            return this;
        }

        /**
         * Проверка: истёк ли эскроу
         */
        isExpired() {
            return this.status === EscrowStatus.FUNDED && new Date() > new Date(this.expiresAt);
        }

        /**
         * Истечение срока (FUNDED → EXPIRED → авторефанд)
         */
        expire() {
            if (this.status !== EscrowStatus.FUNDED) {
                throw new Error(`Cannot expire: escrow is ${this.status}`);
            }
            this.status = EscrowStatus.EXPIRED;
            this.save();
            return this;
        }

        validate() {
            if (!this.orderId) return { valid: false, error: 'orderId обязателен' };
            if (!this.customerId) return { valid: false, error: 'customerId обязателен' };
            if (!this.executorId) return { valid: false, error: 'executorId обязателен' };
            if (!this.amount || this.amount <= 0) return { valid: false, error: 'amount должен быть больше 0' };
            return { valid: true };
        }

        save() {
            const validation = this.validate();
            if (!validation.valid) throw new Error(validation.error);

            const escrows = Storage.getAll('finance_escrows');
            const idx = escrows.findIndex(e => e.id === this.id);
            if (idx >= 0) {
                escrows[idx] = this.toJSON();
            } else {
                escrows.push(this.toJSON());
            }
            Storage.save('finance_escrows', escrows);
            return this;
        }

        toJSON() {
            return {
                id: this.id,
                orderId: this.orderId,
                customerId: this.customerId,
                executorId: this.executorId,
                amount: this.amount,
                currency: this.currency,
                commissionRate: this.commissionRate,
                commissionAmount: this.commissionAmount,
                netAmount: this.netAmount,
                status: this.status,
                description: this.description,
                holdEntryId: this.holdEntryId,
                releaseEntryId: this.releaseEntryId,
                refundEntryId: this.refundEntryId,
                commissionEntryId: this.commissionEntryId,
                disputeReason: this.disputeReason,
                disputeResolvedBy: this.disputeResolvedBy,
                disputeResolution: this.disputeResolution,
                createdAt: this.createdAt,
                fundedAt: this.fundedAt,
                releasedAt: this.releasedAt,
                refundedAt: this.refundedAt,
                disputedAt: this.disputedAt,
                expiresAt: this.expiresAt
            };
        }

        static fromJSON(data) {
            return new Escrow(data);
        }

        static findById(id) {
            const escrows = Storage.getAll('finance_escrows');
            const data = escrows.find(e => e.id === id);
            return data ? Escrow.fromJSON(data) : null;
        }

        static findByOrder(orderId) {
            const escrows = Storage.getAll('finance_escrows');
            return escrows.filter(e => e.orderId === orderId).map(Escrow.fromJSON);
        }

        static findActiveByOrder(orderId) {
            const escrows = Storage.getAll('finance_escrows');
            return escrows
                .filter(e => e.orderId === orderId && (e.status === EscrowStatus.CREATED || e.status === EscrowStatus.FUNDED))
                .map(Escrow.fromJSON);
        }

        static findByCustomer(customerId) {
            const escrows = Storage.getAll('finance_escrows');
            return escrows.filter(e => e.customerId === customerId).map(Escrow.fromJSON);
        }

        static findByExecutor(executorId) {
            const escrows = Storage.getAll('finance_escrows');
            return escrows.filter(e => e.executorId === executorId).map(Escrow.fromJSON);
        }

        static findDisputed() {
            const escrows = Storage.getAll('finance_escrows');
            return escrows.filter(e => e.status === EscrowStatus.DISPUTED).map(Escrow.fromJSON);
        }

        /**
         * Создать эскроу для заказа
         */
        static createForOrder(orderId, customerId, executorId, amount, currency = Currency.KZT) {
            const escrow = new Escrow({
                orderId,
                customerId,
                executorId,
                amount,
                currency,
                description: `Эскроу для заказа #${orderId}`
            });
            escrow.calculateAmounts();
            escrow.save();

            // Audit log
            if (window.Models?.AuditLog) {
                window.Models.AuditLog.log('escrow', escrow.id, 'created', {
                    orderId,
                    customerId,
                    executorId,
                    amount,
                    currency,
                    commission: escrow.commissionAmount,
                    netAmount: escrow.netAmount
                });
            }

            return escrow;
        }
    }

    // ========================================
    // EXPORT
    // ========================================

    window.FinanceModels = {
        // Enums
        Currency,
        WalletStatus,
        LedgerEntryType,
        LedgerEntryStatus,
        QuoteKind,
        InvoiceStatus,
        PaymentAttemptStatus,
        SubscriptionStatus,
        PaymentProvider,
        SubscriptionPlan,
        EscrowStatus,
        EscrowLedgerTypes,

        // Constants
        COMMISSION_RATE_TAKE_ORDER,
        ENGINEERING_EXTRA_PRICE,

        // Models
        Wallet,
        LedgerEntry,
        Quote,
        Invoice,
        PaymentAttempt,
        Subscription,
        UsageCounter,
        TakeOrderLock,
        Escrow
    };

    console.log('✅ FinanceModels v2.0 loaded (with Escrow)');

})();

