// ========== FINANCE UI v1.0 ==========
// UI компоненты для финансовой системы: кошелёк, баланс, транзакции, оплата

(function () {
    'use strict';

    const $ = (s, root = document) => root.querySelector(s);
    const $$ = (s, root = document) => [...root.querySelectorAll(s)];

    // ========== FORMATTERS ==========

    function formatAmount(amount, currency) {
        if (currency === 'KZT') {
            return new Intl.NumberFormat('ru-RU').format(amount) + ' ₸';
        } else if (currency === 'USD') {
            return '$' + new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(amount);
        }
        return amount + ' ' + currency;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function formatShortDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            return 'Сегодня, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays === 1) {
            return 'Вчера, ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
        }
    }

    // ========== LEDGER TYPE LABELS ==========

    const LedgerTypeLabels = {
        TOPUP: { label: 'Пополнение', icon: '💰', isCredit: true },
        COMMISSION_TAKE_ORDER: { label: 'Комиссия за заказ', icon: '📋', isCredit: false },
        SUBSCRIPTION_CHARGE: { label: 'Подписка', icon: '✨', isCredit: false },
        ENGINEERING_EXTRA: { label: 'Доп. запрос', icon: '🏗️', isCredit: false },
        REFUND: { label: 'Возврат', icon: '↩️', isCredit: true },
        BONUS: { label: 'Бонус', icon: '🎁', isCredit: true },
        CREDIT: { label: 'Компенсация', icon: '💳', isCredit: true }
    };

    // ========== WALLET WIDGET (For Header) ==========

    function renderWalletWidget() {
        const result = window.FinanceService?.Wallet?.getMyWallets();
        if (!result?.success) {
            return `<div class="wallet-widget" onclick="FinanceUI.openWallet()">
                <span class="wallet-widget-icon">💳</span>
                <span style="font-size: 0.8rem;">Войдите</span>
            </div>`;
        }

        const wallets = result.data.wallets;
        const kzt = wallets.find(w => w.currency === 'KZT') || { balance: 0 };
        const usd = wallets.find(w => w.currency === 'USD') || { balance: 0 };

        return `
            <div class="wallet-widget" onclick="FinanceUI.openWallet()">
                <span class="wallet-widget-icon">💳</span>
                <div class="wallet-widget-balances">
                    <div class="wallet-widget-balance kzt">
                        ${new Intl.NumberFormat('ru-RU').format(kzt.balance)}
                        <span class="wallet-widget-currency">₸</span>
                    </div>
                    <div class="wallet-widget-balance usd">
                        $${usd.balance.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }

    // ========== WALLET PAGE ==========

    function renderWalletPage(container) {
        const walletsResult = window.FinanceService?.Wallet?.getMyWallets();
        const subscriptionResult = window.FinanceService?.Business?.getSubscriptionStatus();

        if (!walletsResult?.success) {
            container.innerHTML = `
                <div class="wallet-page">
                    <div class="empty-state">
                        <div class="empty-state-icon">🔒</div>
                        <div class="empty-state-title">Авторизуйтесь</div>
                        <div class="empty-state-desc">Для доступа к кошельку необходимо войти в аккаунт</div>
                    </div>
                </div>
            `;
            return;
        }

        const wallets = walletsResult.data.wallets;
        const kzt = wallets.find(w => w.currency === 'KZT') || { id: null, balance: 0 };
        const usd = wallets.find(w => w.currency === 'USD') || { id: null, balance: 0 };
        const subscription = subscriptionResult?.data || { hasSubscription: false };

        container.innerHTML = `
            <div class="wallet-page">
                <div class="wallet-header">
                    <h1 class="wallet-title">
                        <span class="wallet-title-icon">💳</span>
                        Мой кошелёк
                    </h1>
                    <div class="wallet-actions">
                        <button class="btn btn-secondary" onclick="window.showPage && window.showPage('home')">
                            ← Назад
                        </button>
                    </div>
                </div>

                <!-- Balance Cards -->
                <div class="balance-cards">
                    <div class="balance-card kzt">
                        <div class="balance-card-header">
                            <div class="balance-card-title">Баланс KZT</div>
                            <div class="balance-card-icon">🇰🇿</div>
                        </div>
                        <div class="balance-card-amount">
                            ${new Intl.NumberFormat('ru-RU').format(kzt.balance)}
                            <span class="balance-card-currency">₸</span>
                        </div>
                        <div class="balance-card-actions">
                            <button class="balance-card-btn primary" onclick="FinanceUI.openTopup('KZT')">
                                ➕ Пополнить
                            </button>
                            <button class="balance-card-btn secondary" onclick="FinanceUI.showTransactions('KZT')">
                                📜 История
                            </button>
                        </div>
                    </div>

                    <div class="balance-card usd">
                        <div class="balance-card-header">
                            <div class="balance-card-title">Баланс USD</div>
                            <div class="balance-card-icon">🇺🇸</div>
                        </div>
                        <div class="balance-card-amount">
                            $${usd.balance.toFixed(2)}
                        </div>
                        <div class="balance-card-actions">
                            <button class="balance-card-btn primary" onclick="FinanceUI.openTopup('USD')">
                                ➕ Пополнить
                            </button>
                            <button class="balance-card-btn secondary" onclick="FinanceUI.showTransactions('USD')">
                                📜 История
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Subscription Card -->
                ${renderSubscriptionCard(subscription)}

                <!-- Transactions -->
                <div class="transactions-section">
                    <div class="transactions-header">
                        <div class="transactions-title">
                            📜 История операций
                        </div>
                        <div class="transactions-filters">
                            <button class="transactions-filter-btn active" data-filter="all">Все</button>
                            <button class="transactions-filter-btn" data-filter="KZT">KZT</button>
                            <button class="transactions-filter-btn" data-filter="USD">USD</button>
                        </div>
                    </div>
                    <div class="transactions-list" id="transactionsList">
                        ${renderTransactionsList(kzt.id, usd.id)}
                    </div>
                </div>
            </div>
        `;

        // Setup filter buttons
        setupTransactionFilters(kzt.id, usd.id);
    }

    function renderSubscriptionCard(subscription) {
        if (!subscription.hasSubscription) {
            return `
                <div class="subscription-card">
                    <div class="subscription-card-header">
                        <div class="subscription-card-title">Engineering Pro</div>
                        <span class="subscription-card-badge inactive">Не активна</span>
                    </div>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 1rem;">
                        Получите доступ к инженерным расчётам: 3 запроса в месяц за $20
                    </p>
                    <button class="btn btn-primary" onclick="FinanceUI.openSubscribe()">
                        ✨ Оформить подписку — $20/мес
                    </button>
                </div>
            `;
        }

        const usage = subscription.usage || { engineeringCount: 0, limit: 3, remaining: 3 };
        const usagePercent = Math.min(100, (usage.engineeringCount / usage.limit) * 100);

        return `
            <div class="subscription-card">
                <div class="subscription-card-header">
                    <div class="subscription-card-title">${subscription.subscription?.planName || 'Engineering Pro'}</div>
                    <span class="subscription-card-badge active">Активна</span>
                </div>
                <div class="subscription-card-info">
                    <div class="subscription-info-item">
                        <div class="subscription-info-label">Продление</div>
                        <div class="subscription-info-value">${formatDate(subscription.subscription?.renewAt)}</div>
                    </div>
                    <div class="subscription-info-item">
                        <div class="subscription-info-label">Использовано</div>
                        <div class="subscription-info-value">${usage.engineeringCount} / ${usage.limit} запросов</div>
                    </div>
                </div>
                <div class="subscription-usage">
                    <div class="subscription-usage-bar">
                        <div class="subscription-usage-progress" style="width: ${usagePercent}%"></div>
                    </div>
                    <div class="subscription-usage-text">
                        ${usage.remaining > 0
                ? `Осталось ${usage.remaining} бесплатных запросов`
                : 'Лимит исчерпан. Дополнительные запросы — $10'}
                    </div>
                </div>
            </div>
        `;
    }

    function renderTransactionsList(kztWalletId, usdWalletId, filter = 'all') {
        let entries = [];

        if (kztWalletId && (filter === 'all' || filter === 'KZT')) {
            const kztResult = window.FinanceService?.Wallet?.getWalletLedger(kztWalletId);
            if (kztResult?.success) {
                entries = entries.concat(kztResult.data.entries.map(e => ({ ...e, walletCurrency: 'KZT' })));
            }
        }

        if (usdWalletId && (filter === 'all' || filter === 'USD')) {
            const usdResult = window.FinanceService?.Wallet?.getWalletLedger(usdWalletId);
            if (usdResult?.success) {
                entries = entries.concat(usdResult.data.entries.map(e => ({ ...e, walletCurrency: 'USD' })));
            }
        }

        // Sort by date descending
        entries.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        if (entries.length === 0) {
            return `
                <div class="transactions-empty">
                    <div class="transactions-empty-icon">📭</div>
                    <div class="transactions-empty-title">Нет операций</div>
                    <div class="transactions-empty-desc">Здесь будет отображаться история ваших транзакций</div>
                </div>
            `;
        }

        return entries.map(entry => {
            const typeInfo = LedgerTypeLabels[entry.type] || { label: entry.type, icon: '💰', isCredit: entry.amount > 0 };
            const isCredit = entry.amount > 0;

            return `
                <div class="transaction-item">
                    <div class="transaction-icon ${isCredit ? 'credit' : 'debit'}">
                        ${typeInfo.icon}
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-title">${typeInfo.label}</div>
                        <div class="transaction-date">${formatShortDate(entry.createdAt)}</div>
                    </div>
                    <div class="transaction-amount ${isCredit ? 'credit' : 'debit'}">
                        ${isCredit ? '+' : ''}${formatAmount(entry.amount, entry.currency)}
                    </div>
                    <span class="transaction-status ${entry.status.toLowerCase()}">
                        ${entry.status === 'POSTED' ? '✓' : entry.status === 'PENDING' ? '⏳' : '✗'}
                    </span>
                </div>
            `;
        }).join('');
    }

    function setupTransactionFilters(kztWalletId, usdWalletId) {
        $$('.transactions-filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                $$('.transactions-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const filter = btn.dataset.filter;
                const list = $('#transactionsList');
                if (list) {
                    list.innerHTML = renderTransactionsList(kztWalletId, usdWalletId, filter);
                }
            });
        });
    }

    // ========== TOPUP MODAL ==========

    let selectedTopupAmount = 5000;


    function openTopup(currency = 'KZT') {
        const amounts = currency === 'KZT'
            ? [1000, 5000, 10000, 25000, 50000, 100000]
            : [5, 10, 20, 50, 100, 200];

        selectedTopupAmount = amounts[1];

        if (window.openModal) {
            window.openModal({
                id: 'topupModal',
                title: `💰 Пополнить баланс (${currency})`,
                size: 'medium',
                content: `
                    <div class="topup-amounts">
                        ${amounts.map(amount => `
                            <button class="topup-amount-btn ${amount === selectedTopupAmount ? 'selected' : ''}" 
                                    data-amount="${amount}"
                                    onclick="FinanceUI.selectTopupAmount(${amount})">
                                ${formatAmount(amount, currency)}
                            </button>
                        `).join('')}
                    </div>

                    <div class="topup-custom">
                        <div class="topup-custom-label">Или введите свою сумму:</div>
                        <input type="number" class="topup-custom-input" id="topupCustomAmount" 
                               placeholder="${currency === 'KZT' ? '10000' : '50'}"
                               onchange="FinanceUI.selectTopupAmount(this.value)">
                    </div>

                    <div class="topup-providers">
                        <div class="topup-providers-title">Способ оплаты:</div>
                        <div class="topup-provider-list">


                                <span class="topup-provider-icon">🏦</span>

                            </button>
                            <button class="topup-provider-btn" data-provider="PAYBOX"
                                    onclick="FinanceUI.selectProvider('PAYBOX')">
                                <span class="topup-provider-icon">💳</span>
                                <span class="topup-provider-name">PayBox</span>
                            </button>
                            <button class="topup-provider-btn" data-provider="HALYK"
                                    onclick="FinanceUI.selectProvider('HALYK')">
                                <span class="topup-provider-icon">🏛️</span>
                                <span class="topup-provider-name">Halyk</span>
                            </button>
                        </div>
                    </div>

                    <div id="topupSummary" style="text-align: center; padding: 1rem; background: rgba(59,130,246,0.1); border-radius: 12px;">
                        <div style="font-size: 0.85rem; color: var(--text-muted);">К оплате:</div>
                        <div style="font-size: 1.75rem; font-weight: 700; color: var(--primary-color);">
                            ${formatAmount(selectedTopupAmount, currency)}
                        </div>
                    </div>
                `,
                actions: [
                    { label: 'Отмена', type: 'secondary', onClick: () => window.closeModal() },
                    {
                        label: '💳 Оплатить',
                        type: 'primary',
                        onClick: () => processTopup(currency)
                    }
                ]
            });
        }
    }

    function selectTopupAmount(amount) {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        selectedTopupAmount = numAmount;

        // Update UI
        $$('.topup-amount-btn').forEach(btn => {
            btn.classList.toggle('selected', parseFloat(btn.dataset.amount) === numAmount);
        });

        const summary = $('#topupSummary');
        if (summary) {
            const currency = summary.querySelector('div:last-child').textContent.includes('₸') ? 'KZT' : 'USD';
            summary.querySelector('div:last-child').textContent = formatAmount(numAmount, currency);
        }
    }

    function selectProvider(provider) {
        selectedProvider = provider;
        $$('.topup-provider-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.provider === provider);
        });
    }

    function processTopup(currency) {
        const walletsResult = window.FinanceService?.Wallet?.getMyWallets();
        if (!walletsResult?.success) {
            showToast('Ошибка получения кошелька', 'error');
            return;
        }

        const wallet = walletsResult.data.wallets.find(w => w.currency === currency);
        if (!wallet) {
            showToast('Кошелёк не найден', 'error');
            return;
        }

        const result = window.FinanceService?.Wallet?.initTopup(wallet.id, selectedTopupAmount, selectedProvider);

        if (result?.success) {
            window.closeModal();
            showPaymentRedirectModal(result.data);
        } else {
            showToast(result?.error || 'Ошибка инициализации платежа', 'error');
        }
    }

    function showPaymentRedirectModal(paymentData) {
        if (window.openModal) {
            window.openModal({
                id: 'paymentRedirectModal',
                title: '🔄 Переход к оплате',
                size: 'small',
                content: `
                    <div class="payment-confirmation">
                        <div class="payment-confirmation-icon">💳</div>
                        <div class="payment-confirmation-title">Переход на страницу оплаты</div>
                        <div class="payment-confirmation-amount">
                            ${formatAmount(paymentData.amount, paymentData.currency)}
                        </div>
                        <div class="payment-confirmation-desc">
                            Вы будете перенаправлены на страницу платёжной системы
                        </div>
                        <div style="margin-top: 1rem;">
                            <small style="color: var(--text-muted);">
                                ID платежа: ${paymentData.paymentAttemptId}
                            </small>
                        </div>
                    </div>
                `,
                actions: [
                    { label: 'Отмена', type: 'secondary', onClick: () => window.closeModal() },
                    {
                        label: '➡️ Перейти к оплате',
                        type: 'primary',
                        onClick: () => {
                            // For demo - simulate payment
                            simulatePayment(paymentData.paymentAttemptId);
                        }
                    }
                ]
            });
        }
    }

    function simulatePayment(attemptId) {
        // For demo - simulate successful payment
        const result = window.FinanceService?.Payment?.simulatePaymentSuccess(attemptId);
        window.closeModal();

        if (result?.success) {
            showToast('✅ Платёж успешно обработан!', 'success');
            // Refresh wallet page if open
            const container = $('#moduleContent');
            if (container) {
                renderWalletPage(container);
            }
        } else {
            showToast('Ошибка обработки платежа', 'error');
        }
    }

    // ========== COMMISSION MODAL (Take Order) ==========

    function openTakeOrderModal(orderId, orderTitle) {
        const quoteResult = window.FinanceService?.Pricing?.getTakeOrderCommissionQuote(orderId);

        if (!quoteResult?.success) {
            if (quoteResult?.code === 'NO_CONTRACT_AMOUNT') {
                showToast('Дождитесь принятия вашего отклика заказчиком', 'warning');
            } else if (quoteResult?.code === 'ORDER_ALREADY_ASSIGNED') {
                showToast('Заказ уже закреплён за другим исполнителем', 'error');
            } else {
                showToast(quoteResult?.error || 'Ошибка получения расчёта', 'error');
            }
            return;
        }

        const quote = quoteResult.data;
        const breakdown = quote.breakdown;

        if (window.openModal) {
            window.openModal({
                id: 'takeOrderModal',
                title: '📋 Закрепить заказ',
                size: 'medium',
                content: `
                    <div style="margin-bottom: 1.5rem;">
                        <h3 style="margin: 0 0 0.5rem;">${orderTitle || 'Заказ'}</h3>
                        <p style="color: var(--text-muted); margin: 0;">
                            Для закрепления заказа необходимо оплатить комиссию сервиса
                        </p>
                    </div>

                    <div class="commission-info">
                        <div class="commission-info-title">
                            ⚡ Расчёт комиссии (3%)
                        </div>
                        <div class="commission-breakdown">
                            <div class="commission-row">
                                <span class="commission-row-label">Сумма сделки</span>
                                <span class="commission-row-value">${formatAmount(breakdown.contractAmount, 'KZT')}</span>
                            </div>
                            <div class="commission-row">
                                <span class="commission-row-label">Ставка комиссии</span>
                                <span class="commission-row-value">${breakdown.ratePercent}</span>
                            </div>
                            <div class="commission-row total">
                                <span class="commission-row-label">К оплате</span>
                                <span class="commission-row-value">${formatAmount(breakdown.commission, 'KZT')}</span>
                            </div>
                        </div>
                    </div>

                    <div style="background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.2); border-radius: 12px; padding: 1rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <span style="font-size: 1.5rem;">✅</span>
                            <div>
                                <div style="font-weight: 600; color: #22c55e;">После оплаты</div>
                                <div style="font-size: 0.85rem; color: var(--text-muted);">
                                    Заказ будет закреплён за вами, и вы сможете приступить к работе
                                </div>
                            </div>
                        </div>
                    </div>
                `,
                actions: [
                    { label: 'Отмена', type: 'secondary', onClick: () => window.closeModal() },
                    {
                        label: `💳 Оплатить ${formatAmount(breakdown.commission, 'KZT')}`,
                        type: 'primary',
                        onClick: () => processTakeOrder(orderId)
                    }
                ]
            });
        }
    }

    function processTakeOrder(orderId) {
        const result = window.FinanceService?.Business?.takeOrder(orderId);

        if (!result) {
            showToast('Ошибка сервиса', 'error');
            return;
        }

        if (result.success && !result.requiresPayment) {
            window.closeModal();
            showToast('✅ Заказ успешно закреплён!', 'success');
            // Refresh page
            if (window.showPage) window.showPage('myWorks');
            return;
        }

        if (result.requiresPayment) {
            window.closeModal();
            showPaymentRedirectModal(result.data);
            return;
        }

        showToast(result.error || 'Ошибка оплаты', 'error');
    }

    // ========== SUBSCRIPTION MODAL ==========

    function openSubscribe() {
        const quoteResult = window.FinanceService?.Pricing?.getSubscriptionQuote('ENGINEERING_PRO');

        if (!quoteResult?.success) {
            showToast(quoteResult?.error || 'Ошибка получения расчёта', 'error');
            return;
        }

        const quote = quoteResult.data;
        const breakdown = quote.breakdown;

        if (window.openModal) {
            window.openModal({
                id: 'subscribeModal',
                title: '✨ Engineering Pro',
                size: 'medium',
                content: `
                    <div style="text-align: center; padding: 1rem 0;">
                        <div style="font-size: 4rem; margin-bottom: 1rem;">🏗️</div>
                        <h2 style="margin: 0 0 0.5rem; color: #8b5cf6;">Engineering Pro</h2>
                        <div style="font-size: 2rem; font-weight: 700; margin-bottom: 1rem;">
                            ${formatAmount(breakdown.price, breakdown.currency)}<span style="font-size: 1rem; opacity: 0.7;">/мес</span>
                        </div>
                    </div>

                    <div style="background: rgba(139,92,246,0.1); border: 1px solid rgba(139,92,246,0.2); border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem;">
                        <h4 style="margin: 0 0 1rem; color: #a78bfa;">Что входит в подписку:</h4>
                        <ul style="margin: 0; padding-left: 1.25rem; color: var(--text-color);">
                            <li style="margin-bottom: 0.5rem;">✅ ${breakdown.engineeringRequestsLimit} инженерных запроса в месяц</li>
                            <li style="margin-bottom: 0.5rem;">✅ Генерация этапов и сроков</li>
                            <li style="margin-bottom: 0.5rem;">✅ Выбор из 20+ типов решений</li>
                            <li style="margin-bottom: 0.5rem;">✅ PDF-брифы для подрядчиков</li>
                            <li>✅ Приоритетная поддержка</li>
                        </ul>
                    </div>

                    <div style="text-align: center; font-size: 0.85rem; color: var(--text-muted);">
                        Дополнительные запросы сверх лимита — $10 каждый
                    </div>
                `,
                actions: [
                    { label: 'Отмена', type: 'secondary', onClick: () => window.closeModal() },
                    {
                        label: `✨ Оформить за ${formatAmount(breakdown.price, breakdown.currency)}`,
                        type: 'primary',
                        onClick: () => processSubscribe()
                    }
                ]
            });
        }
    }

    function processSubscribe() {
        const result = window.FinanceService?.Business?.subscribe('ENGINEERING_PRO');

        if (!result) {
            showToast('Ошибка сервиса', 'error');
            return;
        }

        if (result.success && !result.requiresPayment) {
            window.closeModal();
            showToast('✅ Подписка активирована!', 'success');
            // Refresh wallet page
            const container = $('#moduleContent');
            if (container) {
                renderWalletPage(container);
            }
            return;
        }

        if (result.requiresPayment) {
            window.closeModal();
            showPaymentRedirectModal(result.data);
            return;
        }

        showToast(result.error || 'Ошибка оформления подписки', 'error');
    }

    // ========== HELPER ==========

    function showToast(message, type = 'info') {
        if (window.showEnhancedToast) {
            window.showEnhancedToast({ message, type });
        } else if (window.QazUI?.toast) {
            window.QazUI.toast(message, type);
        }
    }

    function openWallet() {
        if (window.showPage) {
            window.showPage('wallet');
        }
    }

    function showTransactions(currency) {
        // Switch to transactions tab with filter
        const filterBtn = $(`.transactions-filter-btn[data-filter="${currency}"]`);
        if (filterBtn) {
            filterBtn.click();
            // Scroll to transactions
            const section = $('.transactions-section');
            if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    // ========== EXPORT ==========

    window.FinanceUI = {
        // Widgets
        renderWalletWidget,
        renderWalletPage,

        // Modals
        openWallet,
        openTopup,
        openTakeOrderModal,
        openSubscribe,

        // Actions
        selectTopupAmount,
        selectProvider,
        showTransactions,

        // For external use
        formatAmount,
        formatDate
    };

    console.log('✅ FinanceUI v1.0 loaded');

})();
