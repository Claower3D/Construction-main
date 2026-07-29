/**
 * WalletUI — UI компонент кошелька
 * QazGost AI — Визуальный интерфейс баланса, тарифов, транзакций
 */
(function() {
    'use strict';

    // ========== СОСТОЯНИЕ СТРАНИЦЫ ==========
    let _txFilter = 'all';   // all | topup | charge | tariff | promo | refund
    let _txPage = 1;
    const TX_PER_PAGE = 20;

    // ========== ЗАЩИТА ОТ ПОВТОРНЫХ НАЖАТИЙ ==========
    let _uiLock = false;
    let _uiLockTimer = null;
    function _acquireLock(ms = 600) {
        if (_uiLock) return false;
        _uiLock = true;
        clearTimeout(_uiLockTimer);
        _uiLockTimer = setTimeout(() => { _uiLock = false; }, ms);
        return true;
    }
    function _releaseLock() {
        _uiLock = false;
        clearTimeout(_uiLockTimer);
    }
    // Убрать ВСЕ открытые модалки кошелька
    function _removeAllWalletModals() {
        ['walletTopupModal', 'freedomPayModal', 'cryptoPayModal', 'cardPaymentModal'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (el._timerInterval) clearInterval(el._timerInterval);
                if (el._rateInterval) clearInterval(el._rateInterval);
                el.remove();
            }
        });
    }

    // ========== РЕНДЕР СТРАНИЦЫ КОШЕЛЬКА ==========
    function renderWalletPage(container) {
        if (!container) return;
        const W = window.WalletEngine;
        if (!W) { container.innerHTML = '<p style="color:#f87171">WalletEngine не загружен</p>'; return; }

        const balance = W.getBalance();
        const tariff = W.getCurrentTariff();
        const transactions = W.getTransactions();
        const currInfo = W.getCurrencyInfo ? W.getCurrencyInfo() : { symbol: '$', code: 'USD' };
        const pending = W.getPendingPayments ? W.getPendingPayments().filter(p => p.status === 'pending') : [];

        container.innerHTML = `
            <div class="wallet-page">

                <!-- ====== БАЛАНС КАРТОЧКА ====== -->
                <div class="wallet-balance-card">
                    <div class="wallet-top-row">
                        <div>
                            <div class="wallet-balance-label">💰 Баланс кошелька</div>
                            <div class="wallet-balance-amount" id="walletBalanceDisplay">${W.formatBalance(balance)}</div>
                            <div class="wallet-tariff-badge ${tariff ? 'active' : ''}" id="walletTariffBadge">
                                ${tariff ? `${tariff.icon} ${tariff.badge}` : '📋 Тариф не выбран'}
                            </div>
                        </div>
                        <!-- Переключатель валюты -->
                        <div class="wallet-currency-switcher" id="walletCurrencySwitcher">
                            ${Object.keys(W.CURRENCIES || { USD: 1 }).map(code => `
                                <button class="wallet-currency-btn ${code === currInfo.code ? 'active' : ''}" 
                                        onclick="WalletUI.switchCurrency('${code}')">${code}</button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Мини-график -->
                    <div class="wallet-spend-chart" id="walletSpendChart"></div>

                    <div class="wallet-actions">
                        <button class="wallet-action-btn primary" onclick="WalletUI.showTopUp()" id="walletTopUpBtn">
                            💳 Пополнить
                        </button>
                        <button class="wallet-action-btn secondary" onclick="WalletUI.showTariffs()">
                            ⭐ Тарифы
                        </button>
                        <button class="wallet-action-btn secondary" onclick="WalletUI.showAnalytics()" title="Аналитика">
                            📈 Аналитика
                        </button>
                    </div>
                </div>

                <!-- ====== PENDING ПЛАТЕЖИ ====== -->
                ${pending.length > 0 ? `
                <div class="wallet-pending-section" id="walletPendingSection">
                    <div class="wallet-section-title">
                        ⏳ Ожидают подтверждения
                        <span class="wallet-pending-count">${pending.length}</span>
                    </div>
                    <div class="pending-list" id="pendingList"></div>
                </div>
                ` : ''}

                <!-- ====== СТАТИСТИКА ====== -->
                <div class="wallet-stats-row" id="walletStatsRow"></div>

                <!-- ====== ТАРИФЫ ====== -->
                <div id="walletTariffsSection">
                    <div class="wallet-section-title">⭐ Тарифные планы</div>
                    <div class="tariff-cards" id="tariffCards"></div>
                </div>

                <!-- ====== ТРАНЗАКЦИИ ====== -->
                <div class="wallet-transactions">
                    <div class="wallet-tx-header">
                        <div class="wallet-section-title">📊 История операций</div>
                        <div class="wallet-tx-controls">
                            <button class="wallet-tx-export-btn" onclick="WalletUI.exportCSV()" title="Экспорт CSV">⬇️ CSV</button>
                        </div>
                    </div>

                    <!-- Фильтры -->
                    <div class="tx-filters" id="txFilters">
                        <button class="tx-filter-btn active" data-filter="all" onclick="WalletUI.setTxFilter('all')">Все</button>
                        <button class="tx-filter-btn" data-filter="topup" onclick="WalletUI.setTxFilter('topup')">💰 Пополнения</button>
                        <button class="tx-filter-btn" data-filter="charge" onclick="WalletUI.setTxFilter('charge')">🛒 Списания</button>
                        <button class="tx-filter-btn" data-filter="tariff" onclick="WalletUI.setTxFilter('tariff')">⭐ Тарифы</button>
                        <button class="tx-filter-btn" data-filter="promo" onclick="WalletUI.setTxFilter('promo')">🎟️ Промо</button>
                        <button class="tx-filter-btn" data-filter="refund" onclick="WalletUI.setTxFilter('refund')">↩️ Возвраты</button>
                    </div>

                    <div class="tx-list" id="txList"></div>
                    <div id="txLoadMore"></div>
                </div>
            </div>
        `;

        _renderTariffCards();
        _renderTransactions(transactions);
        _renderSpendChart();
        _renderStatsRow();
        if (pending.length > 0) _renderPendingList(pending);
    }

    // ========== ТАРИФНЫЕ КАРТОЧКИ ==========
    function _renderTariffCards() {
        const W = window.WalletEngine;
        const container = document.getElementById('tariffCards');
        if (!container || !W) return;

        const currentTariff = W.getCurrentTariff();
        const balance = W.getBalance();
        
        container.innerHTML = W.TARIFFS.map(t => {
            const isCurrent = currentTariff && currentTariff.id === t.id;
            const canAfford = t.price && balance >= t.price;
            const priceHtml = t.price 
                ? `<span class="currency">${W.CURRENCY_SYMBOL}</span>${t.price}` 
                : 'По запросу';
            
            return `
                <div class="tariff-card ${t.popular ? 'popular' : ''} ${isCurrent ? 'active' : ''}" data-tariff="${t.id}">
                    ${t.popular ? '<div class="tariff-popular-badge">Популярный</div>' : ''}
                    ${isCurrent ? '<div class="tariff-active-badge">✓ Активен</div>' : ''}
                    <div class="tariff-icon">${t.icon}</div>
                    <div class="tariff-name">${t.name}</div>
                    <div class="tariff-price" style="color:${t.color}">${priceHtml}</div>
                    ${t.price ? `<div class="tariff-period">единовременно</div>` : ''}
                    <ul class="tariff-features">
                        ${t.features.map(f => `<li>${f}</li>`).join('')}
                    </ul>
                    ${isCurrent ? `
                        <button class="tariff-select-btn current" disabled>✓ Активный тариф</button>
                        <button class="tariff-change-btn" onclick="WalletUI._showChangeTariff()">
                            🔄 Сменить тариф
                        </button>
                    ` : `
                        <button class="tariff-select-btn ${canAfford ? '' : 'need-topup'}" 
                                onclick="WalletUI.selectTariff('${t.id}')">
                            ${t.price 
                                ? (canAfford 
                                    ? `✅ Выбрать за ${W.CURRENCY_SYMBOL}${t.price}` 
                                    : `💳 Оплатить ${W.CURRENCY_SYMBOL}${t.price}`)
                                : '📞 Связаться'}
                        </button>
                        ${t.price && !canAfford ? `
                            <div class="tariff-deficit">Нужно ещё ${W.CURRENCY_SYMBOL}${(t.price - balance).toFixed(2)}</div>
                        ` : ''}
                    `}
                </div>
            `;
        }).join('');
    }

    // ========== ТРАНЗАКЦИИ с фильтром и пагинацией ==========
    function _renderTransactions(transactions) {
        const W = window.WalletEngine;
        const container = document.getElementById('txList');
        const loadMoreEl = document.getElementById('txLoadMore');
        if (!container) return;

        // Применяем фильтр
        let filtered = (transactions || []);
        if (_txFilter !== 'all') {
            filtered = filtered.filter(tx => tx.type === _txFilter);
        }

        if (filtered.length === 0) {
            container.innerHTML = `<div class="tx-empty">📭 ${_txFilter === 'all' ? 'Пока нет операций' : 'Нет операций в этой категории'}</div>`;
            if (loadMoreEl) loadMoreEl.innerHTML = '';
            return;
        }

        const visibleTxs = filtered.slice(0, _txPage * TX_PER_PAGE);
        const hasMore = filtered.length > visibleTxs.length;

        // Группировка по датам
        const grouped = {};
        visibleTxs.forEach(tx => {
            const dateKey = _getDateGroupKey(tx.date);
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(tx);
        });

        let html = '';
        for (const [dateKey, txs] of Object.entries(grouped)) {
            html += `<div class="tx-date-group">${dateKey}</div>`;
            html += txs.map(tx => {
                const isPositive = tx.amount > 0;
                const icons = { topup: '💰', charge: '🛒', tariff: '⭐', promo: '🎟️', card: '💳', crypto: '₿', refund: '↩️' };
                const icon = icons[tx.type] || '💸';
                const amountClass = isPositive ? 'positive' : 'negative';
                const sign = isPositive ? '+' : '';
                const date = _formatDate(tx.date);

                // Статус-бейджи
                let statusBadge = '';
                if (tx.status === 'refunded') statusBadge = '<span class="tx-badge refunded">↩ Возврат</span>';
                else if (tx.status === 'pending') statusBadge = '<span class="tx-badge pending">⏳ Ожидание</span>';
                else if (tx.status === 'rejected') statusBadge = '<span class="tx-badge rejected">❌ Отклонён</span>';

                // Отображение суммы в выбранной валюте
                const displayAmt = W.formatInCurrency ? W.formatInCurrency(tx.amount) : `${sign}$${Math.abs(tx.amount).toFixed(2)}`;

                // Кнопки действий
                const refundCheck = W && W.canRefund ? W.canRefund(tx.id) : { canRefund: false };
                const refundBtn = refundCheck.canRefund 
                    ? `<button class="tx-action-btn tx-refund" onclick="WalletUI._requestRefund('${tx.id}')" title="Возврат">↩</button>` : '';
                const invoiceBtn = (tx.amount !== 0 && tx.status !== 'pending')
                    ? `<button class="tx-action-btn tx-invoice" onclick="WalletUI._printInvoice('${tx.id}')" title="Чек">🧾</button>` : '';

                return `
                    <div class="tx-item${tx.status === 'refunded' ? ' refunded' : ''}${tx.status === 'pending' ? ' pending' : ''}">
                        <div class="tx-icon ${tx.type}">${icon}</div>
                        <div class="tx-info">
                            <div class="tx-description">${tx.description || '—'} ${statusBadge}</div>
                            <div class="tx-date">${date}</div>
                        </div>
                        <div class="tx-actions">${refundBtn}${invoiceBtn}</div>
                        <div class="tx-amount ${amountClass}">${displayAmt}</div>
                    </div>
                `;
            }).join('');
        }
        container.innerHTML = html;

        // Кнопка «Показать ещё»
        if (loadMoreEl) {
            loadMoreEl.innerHTML = hasMore
                ? `<button class="tx-load-more-btn" onclick="WalletUI.loadMoreTx()">
                       Показать ещё (${filtered.length - visibleTxs.length})
                   </button>`
                : filtered.length > TX_PER_PAGE
                    ? `<div class="tx-end-hint">Показаны все ${filtered.length} операций</div>`
                    : '';
        }
    }

    // ========== МИНИ-ГРАФИК РАСХОДОВ ==========
    function _renderSpendChart() {
        const chart = document.getElementById('walletSpendChart');
        if (!chart) return;

        const W = window.WalletEngine;
        if (!W) return;

        const transactions = W.getTransactions().slice(0, 14);
        if (transactions.length === 0) {
            chart.innerHTML = '<div style="color:rgba(255,255,255,0.3);font-size:0.75rem;text-align:center;width:100%">Нет данных</div>';
            return;
        }

        const amounts = transactions.map(t => t.amount).reverse();
        const maxAbs = Math.max(...amounts.map(Math.abs), 1);

        chart.innerHTML = amounts.map((a, i) => {
            const h = Math.max(4, Math.round((Math.abs(a) / maxAbs) * 40));
            const cls = a >= 0 ? 'positive' : 'negative';
            const displayAmt = W.formatInCurrency ? W.formatInCurrency(a) : `${a >= 0 ? '+' : ''}$${a.toFixed(0)}`;
            return `<div class="wallet-spend-bar ${cls}" style="height:${h}px;animation-delay:${i * 60}ms" data-tooltip="${displayAmt}"></div>`;
        }).join('');
    }

    // ========== СТАТИСТИКА-СТРОКА ==========
    function _renderStatsRow() {
        const W = window.WalletEngine;
        const row = document.getElementById('walletStatsRow');
        if (!row || !W) return;

        const txs = W.getTransactions();
        const totalIn  = txs.filter(t => t.amount > 0 && t.status !== 'pending').reduce((s, t) => s + t.amount, 0);
        const totalOut = txs.filter(t => t.amount < 0 && t.status !== 'pending').reduce((s, t) => s + Math.abs(t.amount), 0);
        const countTx  = txs.filter(t => t.status !== 'pending').length;
        const fmt = a => W.formatInCurrency ? W.formatInCurrency(a) : `$${a.toFixed(2)}`;

        row.innerHTML = `
            <div class="wallet-stat-card stat-in">
                <div class="wallet-stat-label">💰 Всего пополнено</div>
                <div class="wallet-stat-value">${fmt(totalIn)}</div>
            </div>
            <div class="wallet-stat-card stat-out">
                <div class="wallet-stat-label">💸 Всего потрачено</div>
                <div class="wallet-stat-value">${fmt(totalOut)}</div>
            </div>
            <div class="wallet-stat-card stat-count">
                <div class="wallet-stat-label">📋 Операций</div>
                <div class="wallet-stat-value">${countTx}</div>
            </div>
        `;
    }

    // ========== PENDING ПЛАТЕЖИ ==========
    function _renderPendingList(pending) {
        const W = window.WalletEngine;
        const container = document.getElementById('pendingList');
        if (!container || !W) return;

        const methodIcons = { card: '💳', crypto: '₿' };

        container.innerHTML = pending.map(p => {
            const expiresAt = new Date(p.expiresAt);
            const now = new Date();
            const minsLeft = Math.max(0, Math.round((expiresAt - now) / 60000));

            return `
                <div class="pending-item">
                    <div class="pending-item-icon">${methodIcons[p.method] || '💸'}</div>
                    <div class="pending-item-info">
                        <div class="pending-item-desc">${p.description}</div>
                        <div class="pending-item-time">⏱ ${minsLeft > 0 ? `Истекает через ${minsLeft} мин` : 'Истекает'}</div>
                    </div>
                    <div class="pending-item-actions">
                        <button class="pending-verify-btn" onclick="WalletUI._retryVerify('${p.id}')">
                            🔍 Проверить
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // ========== МОДАЛКА ПОПОЛНЕНИЯ ==========
    function showTopUp() {
        const W = window.WalletEngine;
        if (!W) return;
        if (!_acquireLock(400)) return; // защита от двойного клика

        // Убираем предыдущую модалку
        _removeAllWalletModals();
        _closeTopUp();

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'walletTopupModal';
        modal.onclick = (e) => { if (e.target === modal) _closeTopUp(); };

        modal.innerHTML = `
            <div class="wallet-topup-content">
                <div class="topup-header">
                    <div class="topup-title">💳 Пополнение кошелька</div>
                    <button class="topup-close" onclick="WalletUI.closeTopUp()">✕</button>
                </div>

                <!-- Быстрые суммы -->
                <div class="topup-quick-amounts" id="topupQuickAmounts">
                    ${W.QUICK_AMOUNTS.map(a => `
                        <button class="topup-quick-btn" data-amount="${a}" onclick="WalletUI._selectAmount(${a})">
                            ${W.CURRENCY_SYMBOL}${a}
                        </button>
                    `).join('')}
                </div>

                <!-- Ввод суммы -->
                <div class="topup-custom">
                    <label>Или введите сумму</label>
                    <input type="number" class="topup-amount-input" id="topupAmountInput" 
                           placeholder="${W.CURRENCY_SYMBOL}${W.MIN_TOPUP}" min="${W.MIN_TOPUP}" step="1"
                           oninput="WalletUI._onAmountInput(this.value)">
                    <div class="topup-min-hint">Минимум: ${W.CURRENCY_SYMBOL}${W.MIN_TOPUP}</div>
                </div>

                <!-- Способы оплаты -->
                <div class="topup-methods">
                    <div class="topup-method-label">Способ оплаты</div>
                    ${W.PAYMENT_METHODS.filter(m => m.id !== 'promo').map((m, i) => `
                        <button class="topup-method-btn ${i === 0 ? 'selected' : ''}" data-method="${m.id}"
                                onclick="WalletUI._selectMethod('${m.id}')">
                            <span class="topup-method-icon">${m.icon}</span>
                            <div class="topup-method-info">
                                <div class="topup-method-name">${m.name}</div>
                                <div class="topup-method-desc">${m.description}</div>
                            </div>
                        </button>
                    `).join('')}
                </div>

                <!-- Кнопка пополнения -->
                <button class="topup-submit" id="topupSubmitBtn" onclick="WalletUI._processTopUp()" disabled>
                    Пополнить
                </button>

                <!-- Промокод -->
                <div class="topup-promo-section">
                    <div class="topup-method-label">🎟️ Промокод</div>
                    <div class="topup-promo-row">
                        <input type="text" class="topup-promo-input" id="topupPromoInput" 
                               placeholder="Введите промокод">
                        <button class="topup-promo-btn" onclick="WalletUI._redeemPromo()">Применить</button>
                    </div>
                    <div id="topupPromoResult"></div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Состояние модалки
    let _selectedAmount = 0;
    let _selectedMethod = 'card';

    function _selectAmount(amount) {
        _selectedAmount = amount;
        const input = document.getElementById('topupAmountInput');
        if (input) input.value = amount;

        // Подсветка кнопки
        document.querySelectorAll('.topup-quick-btn').forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.amount) === amount);
        });

        _updateSubmitBtn();
    }

    function _onAmountInput(val) {
        _selectedAmount = parseFloat(val) || 0;
        // Снять selected с быстрых кнопок
        document.querySelectorAll('.topup-quick-btn').forEach(btn => btn.classList.remove('selected'));
        _updateSubmitBtn();
    }

    function _selectMethod(methodId) {
        _selectedMethod = methodId;
        document.querySelectorAll('.topup-method-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.method === methodId);
        });
    }

    function _updateSubmitBtn() {
        const btn = document.getElementById('topupSubmitBtn');
        const W = window.WalletEngine;
        if (!btn || !W) return;

        const valid = _selectedAmount >= W.MIN_TOPUP;
        btn.disabled = !valid;
        btn.textContent = valid 
            ? `Пополнить на ${W.CURRENCY_SYMBOL}${_selectedAmount.toFixed(2)}`
            : `Минимум ${W.CURRENCY_SYMBOL}${W.MIN_TOPUP}`;
    }

    async function _processTopUp() {
        const W = window.WalletEngine;
        if (!W) return;
        if (!_acquireLock(1000)) return; // защита от двойного нажатия

        // Сохраняем до закрытия (closeTopUp сбрасывает _selectedAmount)
        const amount = _selectedAmount;
        const method = _selectedMethod;
        _closeTopUp();

        if (amount < W.MIN_TOPUP) {
            _showToast(`❌ Минимум ${W.CURRENCY_SYMBOL}${W.MIN_TOPUP}`);
            return;
        }

        // Роутинг по способу оплаты
        switch (method) {
            case 'crypto':
                _showCryptoPayModal(amount, 'topup');
                break;
            case 'freedompay':
            default:
                _showFreedomPayModal(amount, 'topup');
                break;
        }
    }

    // ========== ОБЩИЙ ПРОЦЕСС ОПЛАТЫ (Pending → Верификация → Зачисление) ==========
    // ⚠️ Деньги зачисляются ТОЛЬКО после реального подтверждения от бэкенда.
    // Нет эмуляции. Нет авто-зачисления.
    async function _runPaymentProcess(modalId, amount, type, tariffId, steps, method = 'card') {
        const W = window.WalletEngine;
        if (!W) return;

        const modal = document.getElementById(modalId);
        if (!modal) return;

        const formArea = modal.querySelector('.pay-form-area');
        const processing = modal.querySelector('.card-processing');
        const stepsEl = modal.querySelector('.card-processing-steps');
        const successEl = modal.querySelector('.card-success');

        if (formArea) formArea.style.display = 'none';
        if (processing) processing.style.display = 'flex';

        // === Собираем метаданные для всех методов ===
        const metadata = {};
        if (method === 'crypto') {
            metadata.txHash = document.getElementById('cryptoTxHash')?.value.trim() || '';
            metadata.crypto = document.querySelector('.crypto-tab.active')?.dataset?.crypto || 'btc';
        }
        if (method === 'card') {
            // Передаём данные карты бэкенду для реальной обработки
            metadata.cardLast4 = (document.getElementById('cardNumber')?.value || '').replace(/\s/g, '').slice(-4);
            metadata.cardBrand = document.getElementById('cardBrand')?.textContent || '';
        }

        // 1. Создаём pending-платёж
        if (stepsEl) stepsEl.textContent = '📝 Регистрация платежа...';
        await new Promise(r => setTimeout(r, 800));

        const pending = W.createPendingPayment(amount, method, type, tariffId, metadata);

        // 2. Показываем UI верификации
        if (stepsEl) stepsEl.textContent = '🔍 Проверка поступления средств...';

        // Заменяем processing на верификационный UI
        const processingText = modal.querySelector('.card-processing-text');
        if (processingText) processingText.textContent = 'Ожидание подтверждения...';

        // Добавляем прогресс-элементы
        const verifyContainer = document.createElement('div');
        verifyContainer.className = 'verify-status-container';
        verifyContainer.innerHTML = `
            <div class="verify-progress">
                <div class="verify-progress-bar" id="verifyProgressBar" style="width: 0%"></div>
            </div>
            <div class="verify-status" id="verifyStatusText">🔍 Проверяем получение средств...</div>
            <div class="verify-attempt" id="verifyAttempt">Попытка 1 из 10</div>
        `;
        processing?.appendChild(verifyContainer);

        // 3. Цикл верификации — polling каждые 5 секунд (10 попыток = 50 сек)
        const POLL_ATTEMPTS = 10;
        let verified = false;
        for (let attempt = 1; attempt <= POLL_ATTEMPTS; attempt++) {
            const progressBar = document.getElementById('verifyProgressBar');
            const statusText = document.getElementById('verifyStatusText');
            const attemptText = document.getElementById('verifyAttempt');

            if (progressBar) progressBar.style.width = `${(attempt / POLL_ATTEMPTS) * 100}%`;
            if (attemptText) attemptText.textContent = `Попытка ${attempt} из ${POLL_ATTEMPTS}`;

            // Обновляем статус-текст
            const statusMessages = [
                '🔍 Проверяем получение средств...',
                '🏦 Запрос к платёжной системе...',
                '⛓️ Сканируем входящие транзакции...',
                '📡 Ожидание подтверждения от банка...',
                '🔄 Повторный запрос...'
            ];
            if (statusText) statusText.textContent = statusMessages[attempt % statusMessages.length];

            // Ждём 5 секунд
            await new Promise(r => setTimeout(r, 5000));

            // Проверяем
            const result = await W.verifyPayment(pending.id);
            
            if (result.success) {
                verified = true;
                if (statusText) statusText.textContent = '✅ Платёж подтверждён!';
                if (progressBar) { progressBar.style.width = '100%'; progressBar.style.background = '#22c55e'; }
                break;
            }

            if (result.status === 'max_attempts') {
                if (statusText) statusText.textContent = '⚠️ ' + result.message;
                break;
            }

            if (result.error) {
                if (statusText) statusText.textContent = '❌ ' + result.error;
                break;
            }

            // Продолжаем ждать...
            if (statusText && result.message) {
                statusText.textContent = '⏳ ' + result.message;
            }
        }

        if (processing) processing.style.display = 'none';

        if (verified) {
            // Успех — показываем success
            if (successEl) successEl.style.display = 'flex';
            const methodEmoji = { crypto: '₿' };
            setTimeout(() => {
                if (modal) modal.remove();
                _refreshWalletUI();
                _showToast(`${methodEmoji[method] || '✅'} Кошелёк пополнен на ${W.CURRENCY_SYMBOL}${amount.toFixed(2)}!`);
            }, 2000);
        } else {
            // Не подтверждено — показываем модалку ожидания
            _showPendingStatusModal(pending, amount, method);
            if (modal) modal.remove();
            _refreshWalletUI();
        }
    }

    // ========== МОДАЛКА СТАТУСА ОЖИДАЮЩЕГО ПЛАТЕЖА ==========
    function _showPendingStatusModal(pending, amount, method) {
        const W = window.WalletEngine;
        if (!W) return;

        const old = document.getElementById('pendingStatusModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'pendingStatusModal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        const methodNames = { crypto: 'Криптовалюта', card: 'Банковская карта' };
        const methodHints = {
            crypto: 'Транзакция будет подтверждена после получения подтверждений в блокчейне.',
            card: 'Платёж обрабатывается банком. Средства будут зачислены после авторизации.'
        };

        modal.innerHTML = `
            <div class="wallet-topup-content" style="max-width:400px">
                <div class="topup-header">
                    <div class="topup-title">⏳ Ожидание подтверждения</div>
                    <button class="topup-close" onclick="document.getElementById('pendingStatusModal')?.remove()">✕</button>
                </div>

                <div class="pending-status-body">
                    <div class="pending-icon">⏳</div>
                    <div class="pending-heading">Платёж зарегистрирован</div>
                    <div class="pending-amount">${W.CURRENCY_SYMBOL}${amount.toFixed(2)}</div>
                    <div class="pending-method">${methodNames[method] || method}</div>
                    
                    <div class="pending-info-text">
                        <strong>⚠️ Средства НЕ зачислены.</strong><br>
                        ${methodHints[method] || 'Ожидается подтверждение от платёжной системы.'}<br><br>
                        Баланс обновится только после подтверждения поступления средств на наш счёт.
                    </div>

                    <div class="pending-id">ID: ${pending.id}</div>

                    <button class="topup-submit" style="margin-top:1rem;" 
                            onclick="WalletUI._retryVerify('${pending.id}')">
                        🔍 Проверить ещё раз
                    </button>

                    <div class="card-secure-info" style="margin-top:0.75rem;">
                        <span>💬</span> Если средства не поступили — напишите в поддержку с ID платежа
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Повторная проверка из модалки статуса
    async function _retryVerify(pendingId) {
        const W = window.WalletEngine;
        if (!W) return;

        const btn = document.querySelector('#pendingStatusModal .topup-submit');
        if (btn) { btn.disabled = true; btn.textContent = '🔍 Проверяю...'; }

        const result = await W.verifyPayment(pendingId);

        if (result.success) {
            if (btn) btn.textContent = '✅ Подтверждено!';
            _showToast('✅ Платёж подтверждён! Средства зачислены.');
            _refreshWalletUI();
            setTimeout(() => document.getElementById('pendingStatusModal')?.remove(), 1500);
        } else {
            if (btn) { btn.disabled = false; btn.textContent = '🔍 Проверить ещё раз'; }
            _showToast(`⏳ ${result.message || 'Пока не подтверждено. Попробуйте позже.'}`);
        }
    }

    // ========== МОДАЛКА FREEDOM PAY ==========
    async function _showFreedomPayModal(amount, type = 'topup', tariffId = null) {
        const W = window.WalletEngine;
        if (!W) return;

        _removeAllWalletModals();

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'freedomPayModal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="wallet-topup-content card-payment-content">
                <div class="topup-header" style="background:linear-gradient(135deg,rgba(0,176,80,0.15),rgba(0,128,60,0.08))">
                    <div class="topup-title" style="display:flex;align-items:center;gap:0.5rem">
                        <span style="font-size:1.2rem">💳</span> Freedom Pay
                    </div>
                    <button class="topup-close" onclick="document.getElementById('freedomPayModal')?.remove()">✕</button>
                </div>

                <div class="card-payment-amount" style="background:linear-gradient(135deg,rgba(0,176,80,0.12),rgba(0,128,60,0.06));border-color:rgba(0,176,80,0.2);">
                    <span class="card-payment-label">Сумма к оплате</span>
                    <span class="card-payment-sum" style="color:#00B050">${W.CURRENCY_SYMBOL}${amount.toFixed(2)}</span>
                </div>

                <div class="pay-form-area" id="fpFormArea">
                    <div style="padding:1rem 0;">
                        <div style="display:flex;flex-direction:column;gap:0.6rem;margin-bottom:1rem;">
                            <div style="display:flex;align-items:center;gap:0.75rem;padding:0.75rem;border-radius:10px;background:rgba(0,176,80,0.06);border:1px solid rgba(0,176,80,0.12);">
                                <span style="font-size:1.3rem">🏦</span>
                                <div>
                                    <div style="font-weight:600;color:rgba(255,255,255,0.9);font-size:0.9rem;">Visa / Mastercard / Kaspi QR</div>
                                    <div style="font-size:0.78rem;color:rgba(255,255,255,0.4)">Безопасная оплата через Freedom Pay</div>
                                </div>
                            </div>
                        </div>

                        <button class="topup-submit" id="fpPayBtn"
                                style="background:linear-gradient(135deg,#00B050,#009040);color:#fff;font-size:1rem;padding:1rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;border:none;width:100%;border-radius:12px;cursor:pointer;font-weight:700;transition:all 0.2s;"
                                onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 15px rgba(0,176,80,0.4)'"
                                onmouseout="this.style.transform='';this.style.boxShadow=''"
                                onclick="WalletUI._initFreedomPay(${amount}, '${type}', ${tariffId ? "'" + tariffId + "'" : 'null'})">
                            🔒 Оплатить ${W.CURRENCY_SYMBOL}${amount.toFixed(2)}
                        </button>

                        <div class="card-secure-info" style="margin-top:0.75rem;">
                            <span>🔒</span> Защищённая оплата • PCI DSS • 3D Secure
                        </div>
                    </div>
                </div>

                <div class="card-processing" id="fpProcessing" style="display:none">
                    <div class="card-processing-spinner" style="border-top-color:#00B050"></div>
                    <div class="card-processing-text">Создание платежа...</div>
                    <div class="card-processing-steps" id="fpSteps"></div>
                </div>

                <div class="card-success" id="fpSuccess" style="display:none">
                    <div class="card-success-icon">✅</div>
                    <div class="card-success-text">Перенаправляем на оплату...</div>
                </div>

                <div id="fpError" style="display:none;padding:1rem;text-align:center;">
                    <div style="font-size:2rem;margin-bottom:0.5rem;">❌</div>
                    <div style="color:#f87171;font-weight:600;margin-bottom:0.5rem;" id="fpErrorText"></div>
                    <button class="topup-submit" style="margin-top:0.5rem;" 
                            onclick="document.getElementById('fpError').style.display='none';document.getElementById('fpFormArea').style.display='block';">
                        Попробовать снова
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Инициализация платежа Freedom Pay
     */
    async function _initFreedomPay(amount, type, tariffId) {
        const W = window.WalletEngine;
        if (!W || !W.createFreedomPaySession) {
            _showToast('❌ Freedom Pay не доступен');
            return;
        }
        if (!_acquireLock(3000)) return; // блокируем на 3 сек — нельзя жать повторно

        const formArea = document.getElementById('fpFormArea');
        const processing = document.getElementById('fpProcessing');
        const stepsEl = document.getElementById('fpSteps');
        const errorArea = document.getElementById('fpError');
        const errorText = document.getElementById('fpErrorText');
        const payBtn = document.getElementById('fpPayBtn');

        // Сразу отключаем кнопку
        if (payBtn) { payBtn.disabled = true; payBtn.style.opacity = '0.6'; }

        // Показываем прогресс
        if (formArea) formArea.style.display = 'none';
        if (errorArea) errorArea.style.display = 'none';
        if (processing) processing.style.display = 'flex';
        if (stepsEl) stepsEl.textContent = '🔐 Подписываем запрос...';

        await new Promise(r => setTimeout(r, 500));
        if (stepsEl) stepsEl.textContent = '🏦 Связываемся с Freedom Pay...';

        const result = await W.createFreedomPaySession(amount, type, tariffId);

        if (result.success && result.redirectUrl) {
            if (stepsEl) stepsEl.textContent = '✅ Платёж создан! Перенаправляем...';

            // Показываем успешный статус
            if (processing) processing.style.display = 'none';
            const success = document.getElementById('fpSuccess');
            if (success) success.style.display = 'flex';

            // Перенаправляем на страницу оплаты Freedom Pay
            setTimeout(() => {
                window.location.href = result.redirectUrl;
            }, 1000);
        } else {
            // Ошибка — разблокируем кнопку
            if (processing) processing.style.display = 'none';
            if (formArea) formArea.style.display = 'block';
            if (errorArea) errorArea.style.display = 'block';
            if (errorText) errorText.textContent = result.error || 'Неизвестная ошибка';
            if (payBtn) { payBtn.disabled = false; payBtn.style.opacity = '1'; }
            _releaseLock();
            _showToast('❌ ' + (result.error || 'Ошибка Freedom Pay'));
        }
    }

    // ========== МОДАЛКА ОПЛАТЫ КАРТОЙ (Stripe + Fallback) ==========
    async function _showCardPaymentModal(amount, type = 'topup', tariffId = null) {
        const W = window.WalletEngine;
        if (!W) return;

        _removeAllWalletModals();

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'cardPaymentModal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        // Проверяем доступность Stripe
        let stripeAvailable = false;
        try {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 2000);
            const cfgResp = await fetch(`${W.BACKEND_URL}/api/v1/finance/stripe/config`, { signal: controller.signal });
            if (cfgResp.ok) {
                const cfg = await cfgResp.json();
                stripeAvailable = cfg.configured;
            }
        } catch (e) { /* backend offline */ }

        // Stripe кнопка (если доступен)
        const stripeSection = `
            <div style="padding:0.5rem 0;">
                <button class="topup-submit" id="stripeCheckoutBtn"
                        style="background:linear-gradient(135deg,#635BFF,#7B73FF);color:#fff;font-size:1rem;padding:0.9rem;display:flex;align-items:center;justify-content:center;gap:0.5rem;border:none;width:100%;border-radius:12px;cursor:pointer;font-weight:700;transition:all 0.2s;"
                        onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 15px rgba(99,91,255,0.4)'"
                        onmouseout="this.style.transform='';this.style.boxShadow=''"
                        onclick="WalletUI._stripeCheckout(${amount}, '${type}', ${tariffId ? `'${tariffId}'` : 'null'})">
                    <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path fill-rule="evenodd" clip-rule="evenodd" d="M0 6a6 6 0 016-6h20a6 6 0 016 6v20a6 6 0 01-6 6H6a6 6 0 01-6-6V6zm14.5 5.2c0-.9.7-1.2 1.9-1.2 1.7 0 3.8.5 5.5 1.4V7c-1.8-.7-3.7-1-5.5-1-4.5 0-7.5 2.3-7.5 6.2 0 6 8.4 5.1 8.4 7.7 0 1-.9 1.4-2.1 1.4-1.8 0-4.2-.8-6-1.8v4.5c2 .9 4 1.2 6 1.2 4.6 0 7.7-2.3 7.7-6.2-.1-6.5-8.4-5.4-8.4-7.8z" fill="#fff"/></svg>
                    Оплатить через Stripe — $${amount.toFixed(2)}
                </button>
                <div style="text-align:center;font-size:0.72rem;color:rgba(255,255,255,0.35);margin-top:0.5rem;">
                    🔒 Безопасная оплата • Visa, Mastercard, Apple/Google Pay
                </div>
            </div>

            <!-- Разделитель -->
            <div style="display:flex;align-items:center;gap:0.75rem;margin:0.75rem 0;">
                <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
                <span style="color:rgba(255,255,255,0.25);font-size:0.75rem;white-space:nowrap;">или введите данные карты</span>
                <div style="flex:1;height:1px;background:rgba(255,255,255,0.08);"></div>
            </div>
        `;

        modal.innerHTML = `
            <div class="wallet-topup-content card-payment-content">
                <div class="topup-header">
                    <div class="topup-title">💳 Оплата картой</div>
                    <button class="topup-close" onclick="document.getElementById('cardPaymentModal')?.remove()">✕</button>
                </div>

                <div class="card-payment-amount">
                    <span class="card-payment-label">Сумма к оплате</span>
                    <span class="card-payment-sum">${W.CURRENCY_SYMBOL}${amount.toFixed(2)}</span>
                </div>

                <div class="pay-form-area">
                    ${stripeAvailable ? stripeSection : ''}
                    <div class="card-form">
                        <div class="card-field">
                            <label>Номер карты</label>
                            <div class="card-input-wrap">
                                <input type="text" id="cardNumber" class="card-input" 
                                       placeholder="4242 4242 4242 4242" maxlength="19"
                                       oninput="WalletUI._formatCardNumber(this)">
                                <span class="card-brand" id="cardBrand">💳</span>
                            </div>
                        </div>
                        <div class="card-row">
                            <div class="card-field">
                                <label>Срок</label>
                                <input type="text" id="cardExpiry" class="card-input" 
                                       placeholder="MM/YY" maxlength="5"
                                       oninput="WalletUI._formatExpiry(this)">
                            </div>
                            <div class="card-field">
                                <label>CVV</label>
                                <input type="password" id="cardCVV" class="card-input" 
                                       placeholder="•••" maxlength="4"
                                       oninput="this.value=this.value.replace(/\\D/g,'')">
                            </div>
                        </div>
                        <div class="card-field">
                            <label>Имя на карте</label>
                            <input type="text" id="cardName" class="card-input" 
                                   placeholder="IVAN PETROV"
                                   oninput="this.value=this.value.toUpperCase()">
                        </div>
                    </div>
                    <button class="topup-submit card-pay-btn" id="cardPayBtn" 
                            onclick="WalletUI._submitCardPayment(${amount}, '${type}', ${tariffId ? `'${tariffId}'` : 'null'})">
                        🔒 Оплатить ${W.CURRENCY_SYMBOL}${amount.toFixed(2)}
                    </button>
                    <div class="card-secure-info">
                        <span>🔒</span> Безопасная оплата • Данные защищены SSL
                    </div>
                </div>

                <div class="card-processing" style="display:none">
                    <div class="card-processing-spinner"></div>
                    <div class="card-processing-text">Обработка платежа...</div>
                    <div class="card-processing-steps"></div>
                </div>
                <div class="card-success" style="display:none">
                    <div class="card-success-icon">✅</div>
                    <div class="card-success-text">Платёж успешен!</div>
                    <div class="card-success-amount">+${W.CURRENCY_SYMBOL}${amount.toFixed(2)}</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        // Фокус на первый input — Stripe кнопку или поле карты
        if (!stripeAvailable) {
            setTimeout(() => document.getElementById('cardNumber')?.focus(), 100);
        }
    }

    /**
     * Stripe Checkout — редирект на Stripe hosted page
     */
    async function _stripeCheckout(amount, type, tariffId) {
        const W = window.WalletEngine;
        if (!W) return;

        const btn = document.getElementById('stripeCheckoutBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="card-processing-spinner" style="width:20px;height:20px;border-width:2px;margin:0;border-top-color:#fff;"></div> Переход на Stripe...';
        }

        try {
            const result = await W.createStripeCheckout(amount, type, tariffId);

            if (result.mode === 'stripe' && result.redirectUrl) {
                // Redirect to Stripe Checkout page
                window.location.href = result.redirectUrl;
                return;
            }

            if (result.mode === 'demo') {
                // Demo — зачислить локально и показать успех
                W.topUp(amount, 'stripe_demo', `Stripe Demo: $${amount}`);
                const modal = document.getElementById('cardPaymentModal');
                const form = modal?.querySelector('.pay-form-area');
                const success = modal?.querySelector('.card-success');
                if (form) form.style.display = 'none';
                if (success) success.style.display = 'flex';
                setTimeout(() => {
                    modal?.remove();
                    _refreshWalletUI();
                    _showToast(`💳 Stripe Demo: +$${amount.toFixed(2)} зачислено!`);
                }, 2000);
                return;
            }

            // Frontend fallback — убираем Stripe кнопку, фокус на поле карты
            if (btn) btn.style.display = 'none';
            document.getElementById('cardNumber')?.focus();
            _showToast('ℹ️ Stripe недоступен — введите данные карты вручную');

        } catch (e) {
            console.error('Stripe checkout error:', e);
            if (btn) { btn.disabled = false; btn.textContent = '💳 Повторить'; }
            _showToast('❌ Ошибка: ' + e.message);
        }
    }

    // Форматирование номера карты
    function _formatCardNumber(input) {
        let v = input.value.replace(/\D/g, '').substring(0, 16);
        input.value = v.replace(/(\d{4})(?=\d)/g, '$1 ');
        const brand = document.getElementById('cardBrand');
        if (!brand) return;
        if (v.startsWith('4')) brand.textContent = '🟦 Visa';
        else if (v.startsWith('5') || v.startsWith('2')) brand.textContent = '🟧 MC';
        else if (v.startsWith('3')) brand.textContent = '🟩 Amex';
        else brand.textContent = '💳';
    }

    function _formatExpiry(input) {
        let v = input.value.replace(/\D/g, '').substring(0, 4);
        if (v.length >= 2) v = v.substring(0, 2) + '/' + v.substring(2);
        input.value = v;
    }

    async function _submitCardPayment(amount, type, tariffId) {
        const cardNum = document.getElementById('cardNumber')?.value.replace(/\s/g, '') || '';
        const expiry = document.getElementById('cardExpiry')?.value || '';
        const cvv = document.getElementById('cardCVV')?.value || '';
        if (cardNum.length < 13) { _showToast('❌ Введите номер карты'); return; }
        if (!_validateLuhn(cardNum)) { _showToast('❌ Неверный номер карты'); return; }
        if (expiry.length < 5) { _showToast('❌ Введите срок действия'); return; }
        // Проверка месяца и года
        const [mm, yy] = expiry.split('/');
        const month = parseInt(mm, 10);
        const year = parseInt('20' + yy, 10);
        const now = new Date();
        if (month < 1 || month > 12) { _showToast('❌ Неверный месяц (01-12)'); return; }
        if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
            _showToast('❌ Карта просрочена'); return;
        }
        if (cvv.length < 3) { _showToast('❌ Введите CVV'); return; }

        await _runPaymentProcess('cardPaymentModal', amount, type, tariffId, [
            '🔐 Проверка данных карты...',
            '🏦 Связь с банком...',
            '✅ Авторизация платежа...',
            '💰 Зачисление на баланс...'
        ], 'card');
    }


    // ========== МОДАЛКА КРИПТО ОПЛАТЫ (v2) ==========

    // Конфигурация криптовалют — реальные адреса QazGost
    const CRYPTO_CONFIG = {
        btc: {
            name: 'Bitcoin',
            network: 'BTC',
            addr: window.CRYPTO_BTC_ADDR || 'bc1qkdax79w3jd4v3v66s0a0t7j3w2e56ultyewync',
            icon: '₿',
            color: '#F7931A',
            coingeckoId: 'bitcoin',
            decimals: 8,
            minConfirmations: 1,
            avgFee: '~$2-5',
            avgTime: '10-30 мин'
        },
        usdt: {
            name: 'USDT',
            network: 'TRC-20 (Tron)',
            addr: window.CRYPTO_USDT_ADDR || 'TWW5bzRNXKjA7nRw3aiokj99GaaZsnXA7h',
            icon: '₮',
            color: '#26A17B',
            coingeckoId: 'tether',
            decimals: 2,
            minConfirmations: 19,
            avgFee: '~$1',
            avgTime: '1-3 мин'
        },
        eth: {
            name: 'Ethereum',
            network: 'ERC-20',
            addr: window.CRYPTO_ETH_ADDR || '0xcc6b2224c5dac4593b9fa06525d23942ed606f57',
            icon: 'Ξ',
            color: '#627EEA',
            coingeckoId: 'ethereum',
            decimals: 6,
            minConfirmations: 12,
            avgFee: '~$1-3',
            avgTime: '2-5 мин'
        },
        ton: {
            name: 'Toncoin',
            network: 'TON',
            addr: window.CRYPTO_TON_ADDR || 'UQCL4TiJ5Zl4kuMvvJqx_97DBZdXSSfKJK90zpctWjWk7xxj',
            icon: '💎',
            color: '#0098EA',
            coingeckoId: 'the-open-network',
            decimals: 4,
            minConfirmations: 1,
            avgFee: '~$0.01',
            avgTime: '5-10 сек'
        }
    };

    // Кэш курсов
    let _cryptoRatesCache = { rates: {}, fetchedAt: 0 };
    const RATES_CACHE_TTL = 60000; // 60 сек

    /**
     * Получить курсы криптовалют через CoinGecko API (бесплатный)
     */
    async function _fetchCryptoRates() {
        const now = Date.now();
        if (now - _cryptoRatesCache.fetchedAt < RATES_CACHE_TTL && Object.keys(_cryptoRatesCache.rates).length) {
            return _cryptoRatesCache.rates;
        }

        const ids = Object.values(CRYPTO_CONFIG).map(c => c.coingeckoId).join(',');

        try {
            const resp = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
            if (resp.ok) {
                const data = await resp.json();
                const rates = {};
                for (const [key, cfg] of Object.entries(CRYPTO_CONFIG)) {
                    const price = data[cfg.coingeckoId]?.usd;
                    rates[key] = price || _getFallbackRate(key);
                }
                _cryptoRatesCache = { rates, fetchedAt: now };
                console.log('💰 Crypto rates fetched:', rates);
                return rates;
            }
        } catch (e) {
            console.warn('CoinGecko API failed, using fallback rates:', e.message);
        }

        // Fallback курсы
        return _getFallbackRates();
    }

    function _getFallbackRate(key) {
        const fallback = { btc: 68500, usdt: 1, eth: 3400, ton: 6.5 };
        return fallback[key] || 1;
    }

    function _getFallbackRates() {
        const rates = {};
        for (const key of Object.keys(CRYPTO_CONFIG)) {
            rates[key] = _getFallbackRate(key);
        }
        return rates;
    }

    /**
     * Конвертация суммы в USD → крипто
     * @param {number} amountUSD — сумма в долларах
     * @param {string} cryptoKey — ключ крипто (btc, eth, usdt, ton)
     * @param {object} rates — текущие курсы
     */
    function _convertToCrypto(amountUSD, cryptoKey, rates) {
        const rate = rates[cryptoKey] || 1;
        const cfg = CRYPTO_CONFIG[cryptoKey];
        return (amountUSD / rate).toFixed(cfg.decimals);
    }

    /**
     * Генерация QR-кода как data URL (через qrcode API)
     */
    function _generateQRUrl(data, size = 200) {
        // Используем бесплатный API для QR
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&bgcolor=0a0a1a&color=ffffff&format=svg`;
    }

    /**
     * Строим URI для крипто-кошелька (BIP-21 / EIP-681)
     */
    function _buildPaymentUri(cryptoKey, amount, rates) {
        const cfg = CRYPTO_CONFIG[cryptoKey];
        const cryptoAmount = _convertToCrypto(amount, cryptoKey, rates);

        switch (cryptoKey) {
            case 'btc':
                return `bitcoin:${cfg.addr}?amount=${cryptoAmount}`;
            case 'eth':
                return `ethereum:${cfg.addr}?value=${cryptoAmount}`;
            case 'usdt':
                return cfg.addr; // TRC-20 не имеет стандартного URI
            case 'ton':
                return `ton://transfer/${cfg.addr}?amount=${Math.round(parseFloat(cryptoAmount) * 1e9)}`;
            default:
                return cfg.addr;
        }
    }

    function _showCryptoPayModal(amount, type = 'topup', tariffId = null) {
        const W = window.WalletEngine;
        if (!W) return;

        _removeAllWalletModals();

        // Конвертируем сумму в USD (примерный курс KZT → USD)
        const KZT_TO_USD = window.KZT_TO_USD || 0.002;
        const amountUSD = amount * KZT_TO_USD;

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'cryptoPayModal';
        modal.onclick = (e) => {
            if (e.target === modal) {
                clearInterval(modal._timerInterval);
                clearInterval(modal._rateInterval);
                modal.remove();
            }
        };

        // Начальный HTML с загрузкой
        modal.innerHTML = `
            <div class="wallet-topup-content card-payment-content" style="max-width:480px">
                <div class="topup-header">
                    <div class="topup-title" style="color:#F7931A">₿ Криптовалюта</div>
                    <button class="topup-close" onclick="
                        const m=document.getElementById('cryptoPayModal');
                        if(m){clearInterval(m._timerInterval);clearInterval(m._rateInterval);m.remove()}
                    ">✕</button>
                </div>

                <div class="card-payment-amount" style="background:linear-gradient(135deg,rgba(247,147,26,0.12),rgba(98,126,234,0.08));border-color:rgba(247,147,26,0.15);">
                    <span class="card-payment-label">Сумма к оплате</span>
                    <span class="card-payment-sum">${W.CURRENCY_SYMBOL}${amount.toFixed(2)}</span>
                    <span class="card-payment-label" style="font-size:0.8rem;margin-top:2px">≈ $${amountUSD.toFixed(2)} USD</span>
                </div>

                <div class="pay-form-area" id="cryptoFormArea">
                    <div style="text-align:center;padding:2rem 0">
                        <div class="card-processing-spinner" style="border-top-color:#F7931A;margin:0 auto"></div>
                        <div style="color:rgba(255,255,255,0.4);margin-top:0.75rem;font-size:0.85rem">Загружаем курсы...</div>
                    </div>
                </div>

                <div class="card-processing" style="display:none">
                    <div class="card-processing-spinner" style="border-top-color:#F7931A"></div>
                    <div class="card-processing-text">Проверка транзакции...</div>
                    <div class="card-processing-steps"></div>
                </div>
                <div class="card-success" style="display:none">
                    <div class="card-success-icon">✅</div>
                    <div class="card-success-text">Крипто-платёж подтверждён!</div>
                    <div class="card-success-amount">+${W.CURRENCY_SYMBOL}${amount.toFixed(2)}</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Загружаем курсы и рендерим
        _fetchCryptoRates().then(rates => {
            _renderCryptoForm(modal, amount, amountUSD, type, tariffId, rates);
        });

        // Таймер 30 минут
        let seconds = 1800;
        modal._timerInterval = setInterval(() => {
            seconds--;
            const el = document.getElementById('cryptoTimer');
            if (!el || seconds <= 0) {
                clearInterval(modal._timerInterval);
                if (seconds <= 0) {
                    _showToast('⏱️ Время оплаты истекло');
                    modal.remove();
                }
                return;
            }
            const m = Math.floor(seconds / 60);
            const s = seconds % 60;
            el.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        }, 1000);

        // Авто-обновление курсов каждые 60 сек
        modal._rateInterval = setInterval(async () => {
            const rates = await _fetchCryptoRates();
            _updateCryptoAmounts(amountUSD, rates);
        }, RATES_CACHE_TTL);
    }

    /**
     * Рендер формы крипто-оплаты после загрузки курсов
     */
    function _renderCryptoForm(modal, amount, amountUSD, type, tariffId, rates) {
        const formArea = document.getElementById('cryptoFormArea');
        if (!formArea) return;

        const firstKey = Object.keys(CRYPTO_CONFIG)[0];
        const firstCfg = CRYPTO_CONFIG[firstKey];
        const firstAmount = _convertToCrypto(amountUSD, firstKey, rates);
        const firstQR = _generateQRUrl(_buildPaymentUri(firstKey, amountUSD, rates));

        formArea.innerHTML = `
            <div class="crypto-tabs">
                ${Object.entries(CRYPTO_CONFIG).map(([key, c], i) => `
                    <button class="crypto-tab ${i === 0 ? 'active' : ''}" data-crypto="${key}"
                            onclick="WalletUI._selectCrypto('${key}')"
                            style="--crypto-color:${c.color}">
                        <span class="crypto-tab-icon">${c.icon}</span> ${key.toUpperCase()}
                    </button>
                `).join('')}
            </div>

            ${Object.entries(CRYPTO_CONFIG).map(([key, c], i) => {
                const cryptoAmount = _convertToCrypto(amountUSD, key, rates);
                const payUri = _buildPaymentUri(key, amountUSD, rates);
                const qrUrl = _generateQRUrl(payUri);
                const rateUSD = rates[key] || 1;

                return `
                <div class="crypto-details ${i === 0 ? 'active' : ''}" id="cryptoDetails_${key}">
                    <div class="crypto-qr-section">
                        <img src="${qrUrl}" alt="QR ${c.name}"
                             class="crypto-qr-img"
                             onerror="this.style.display='none'"
                             loading="lazy">
                    </div>

                    <div class="crypto-info-row">
                        <span class="crypto-info-label">Отправьте точно:</span>
                        <span class="crypto-info-value crypto-amount-display" data-crypto="${key}"
                              style="color:${c.color};font-size:1.15rem;font-weight:700">
                            ${cryptoAmount} ${key.toUpperCase()}
                        </span>
                    </div>

                    <div class="crypto-info-row" style="opacity:0.5;font-size:0.8rem">
                        <span>Курс: 1 ${key.toUpperCase()} = $${rateUSD.toLocaleString()}</span>
                        <span>Сеть: ${c.network}</span>
                    </div>

                    <div class="crypto-address-block">
                        <label>Адрес ${c.name} (${c.network}):</label>
                        <div class="crypto-address-row">
                            <input type="text" class="card-input crypto-addr" value="${c.addr}" readonly>
                            <button class="crypto-copy-btn" onclick="WalletUI._copyAddr('${c.addr}')">📋</button>
                        </div>
                    </div>

                    <div class="crypto-meta-row">
                        <span>⛽ Комиссия сети: ${c.avgFee}</span>
                        <span>⏱ Время: ${c.avgTime}</span>
                    </div>

                    <div class="crypto-notice">
                        ⚠️ Отправляйте только <strong>${c.name}</strong> в сети <strong>${c.network}</strong>
                    </div>
                </div>
                `;
            }).join('')}

            <div class="crypto-txhash-block">
                <label>Хэш транзакции (необязательно):</label>
                <input type="text" id="cryptoTxHash" class="card-input"
                       placeholder="0x... или txid для ускоренной проверки"
                       style="font-family:monospace;font-size:0.8rem">
            </div>


                ⏱️ Ожидание перевода: <span id="cryptoTimer">30:00</span>
            </div>

            <button class="topup-submit" style="background:linear-gradient(135deg,#F7931A,#E88C0A);color:#fff;margin-top:0.75rem"
                    onclick="WalletUI._confirmCryptoPay(${amount}, '${type}', ${tariffId ? `'${tariffId}'` : 'null'})">
                ✅ Я отправил перевод
            </button>

            <div class="card-secure-info">
                <span>🔒</span> Блокчейн-транзакция • Автопроверка • Курсы обновляются
            </div>
        `;
    }

    /**
     * Обновление крипто-сумм при изменении курса (без перерисовки)
     */
    function _updateCryptoAmounts(amountUSD, rates) {
        for (const [key, cfg] of Object.entries(CRYPTO_CONFIG)) {
            const el = document.querySelector(`.crypto-amount-display[data-crypto="${key}"]`);
            if (el) {
                const newAmount = _convertToCrypto(amountUSD, key, rates);
                el.textContent = `${newAmount} ${key.toUpperCase()}`;
            }
        }
    }

    function _selectCrypto(key) {
        document.querySelectorAll('.crypto-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.crypto-details').forEach(d => d.classList.remove('active'));
        const tab = document.querySelector(`.crypto-tab[data-crypto="${key}"]`);
        const details = document.getElementById(`cryptoDetails_${key}`);
        if (tab) tab.classList.add('active');
        if (details) details.classList.add('active');
    }

    function _copyAddr(addr) {
        navigator.clipboard.writeText(addr).then(() => {
            _showToast('📋 Адрес скопирован!');
        }).catch(() => {
            const el = document.createElement('textarea');
            el.value = addr; document.body.appendChild(el);
            el.select(); document.execCommand('copy');
            el.remove();
            _showToast('📋 Адрес скопирован!');
        });
    }

    async function _confirmCryptoPay(amount, type, tariffId) {
        const txHash = document.getElementById('cryptoTxHash')?.value.trim() || '';
        const activeCrypto = document.querySelector('.crypto-tab.active')?.dataset?.crypto || 'btc';

        // Определяем шаги верификации
        const steps = txHash
            ? [
                `🔍 Проверка tx: ${txHash.slice(0, 10)}...`,
                `⛓️ Поиск в сети ${CRYPTO_CONFIG[activeCrypto]?.network || ''}...`,
                '✅ Транзакция найдена!',
                '💰 Зачисление на баланс...'
            ]
            : [
                '🔍 Поиск транзакции в блокчейне...',
                `⛓️ Ожидание ${CRYPTO_CONFIG[activeCrypto]?.minConfirmations || 1} подтверждений...`,
                '✅ Транзакция подтверждена!',
                '💰 Зачисление на баланс...'
            ];

        // Логируем хэш для бэкенда
        if (txHash) {
            console.log(`₿ Crypto payment — tx: ${txHash}, crypto: ${activeCrypto}, amount: ${amount}`);
        }

        await _runPaymentProcess('cryptoPayModal', amount, type, tariffId, steps, 'crypto');
    }

    function _redeemPromo() {
        const W = window.WalletEngine;
        const input = document.getElementById('topupPromoInput');
        const resultDiv = document.getElementById('topupPromoResult');
        if (!W || !input || !resultDiv) return;

        const code = input.value.trim();
        if (!code) { resultDiv.innerHTML = ''; return; }

        const result = W.redeemPromo(code);
        if (result.success) {
            resultDiv.innerHTML = `<div class="topup-promo-result success">✅ Начислено ${W.CURRENCY_SYMBOL}${result.amount}! Баланс: ${W.formatBalance(result.newBalance)}</div>`;
            input.value = '';
            _refreshWalletUI();
        } else {
            resultDiv.innerHTML = `<div class="topup-promo-result error">❌ ${result.error}</div>`;
        }
    }

    function _closeTopUp() {
        const modal = document.getElementById('walletTopupModal');
        if (modal) modal.remove();
        _selectedAmount = 0;
        _releaseLock();
    }

    // ========== ВЫБОР ТАРИФА ==========
    function selectTariff(tariffId) {
        const W = window.WalletEngine;
        if (!W) return;

        const tariff = W.TARIFFS.find(t => t.id === tariffId);
        if (!tariff) return;

        // Enterprise — по запросу
        if (!tariff.price) {
            _showToast('📞 Свяжитесь с нами для корпоративного тарифа: info@qazgost.ai');
            return;
        }

        const balance = W.getBalance();

        if (balance >= tariff.price) {
            // Хватает средств — показываем кастомную модалку подтверждения
            _showConfirmModal(
                `Активировать тариф «${tariff.name}» за ${W.CURRENCY_SYMBOL}${tariff.price}?`,
                'Сумма будет списана с баланса кошелька.',
                () => {
                    const result = W.purchaseTariff(tariffId);
                    if (result.success) {
                        _showTariffSuccessModal(tariff);
                        _refreshWalletUI();
                    } else {
                        _showToast(`❌ ${result.error}`);
                    }
                }
            );
        } else {
            // Не хватает — показываем выбор способа оплаты
            _showTariffPaymentChooser(tariff);
        }
    }

    // ========== ВЫБОР МЕТОДА ОПЛАТЫ ТАРИФА ==========
    function _showTariffPaymentChooser(tariff) {
        const W = window.WalletEngine;
        if (!W) return;

        const old = document.getElementById('tariffPayChooser');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'tariffPayChooser';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="wallet-topup-content card-payment-content">
                <div class="topup-header">
                    <div class="topup-title">⭐ Оплата тарифа</div>
                    <button class="topup-close" onclick="document.getElementById('tariffPayChooser')?.remove()">✕</button>
                </div>

                <div class="card-payment-amount" style="background:linear-gradient(135deg,${tariff.gradient.replace('linear-gradient(135deg, ', '').replace(')', '')});border-color:${tariff.color}30;">
                    <div style="display:flex;flex-direction:column;gap:0.2rem;">
                        <span style="font-size:1.5rem">${tariff.icon}</span>
                        <span class="card-payment-label">${tariff.name}</span>
                    </div>
                    <span class="card-payment-sum">${W.CURRENCY_SYMBOL}${tariff.price}</span>
                </div>

                <div style="font-size:0.85rem;color:rgba(255,255,255,0.45);text-align:center;margin-bottom:1rem;">
                    Выберите способ оплаты
                </div>

                <div style="display:flex;flex-direction:column;gap:0.6rem;">


                    <button class="topup-method-btn" style="border-color:rgba(0,176,80,0.2);padding:1rem;"
                            onclick="document.getElementById('tariffPayChooser')?.remove(); WalletUI.showFreedomPay(${tariff.price}, 'tariff', '${tariff.id}')">
                        <span class="topup-method-icon">💳</span>
                        <div class="topup-method-info">
                            <div class="topup-method-name">Freedom Pay</div>
                            <div class="topup-method-desc">Visa / Mastercard / Kaspi QR</div>
                        </div>
                    </button>

                    <button class="topup-method-btn" style="border-color:rgba(247,147,26,0.2);padding:1rem;"
                            onclick="document.getElementById('tariffPayChooser')?.remove(); WalletUI.showCryptoPay(${tariff.price}, 'tariff', '${tariff.id}')">
                        <span class="topup-method-icon">₿</span>
                        <div class="topup-method-info">
                            <div class="topup-method-name">Криптовалюта</div>
                            <div class="topup-method-desc">BTC • USDT • ETH</div>
                        </div>
                    </button>
                </div>

                <div class="card-secure-info" style="margin-top:1rem;">
                    <span>🔒</span> Тариф активируется автоматически после оплаты
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // ========== УСПЕХ ПОКУПКИ ТАРИФА ==========
    function _showTariffSuccessModal(tariff) {
        const old = document.getElementById('tariffSuccessModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'tariffSuccessModal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="wallet-topup-content card-payment-content" style="text-align:center;">
                <div class="card-success" style="display:flex;">
                    <div class="card-success-icon" style="font-size:4rem">${tariff.icon}</div>
                    <div class="card-success-text" style="font-size:1.5rem">Тариф активирован!</div>
                    <div style="color:rgba(255,255,255,0.6);font-size:1rem;margin-top:0.25rem;">
                        «${tariff.name}» — ${tariff.badge}
                    </div>
                    <div style="margin-top:1.5rem;">
                        <button class="topup-submit" onclick="document.getElementById('tariffSuccessModal')?.remove()" 
                                style="max-width:200px;margin:0 auto;">
                            🎉 Отлично!
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        _showToast(`🎉 Тариф «${tariff.name}» активирован!`);
    }

    function showTariffs() {
        const section = document.getElementById('walletTariffsSection');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ========== СМЕНА ТАРИФА ==========
    function _showChangeTariff() {
        const W = window.WalletEngine;
        if (!W) return;

        const currentTariff = W.getCurrentTariff();
        if (!currentTariff) return;

        _showConfirmModal(
            `Сменить тариф «${currentTariff.name}»?`,
            'Текущий тариф будет деактивирован. Возврат средств невозможен. Выберите новый тариф ниже.',
            () => {
                // Сбрасываем текущий тариф и показываем все
                localStorage.removeItem('wallet_tariff');
                localStorage.removeItem('userRole');
                _refreshWalletUI();
                _showToast('✅ Тариф сброшен. Выберите новый.');
                const section = document.getElementById('walletTariffsSection');
                if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        );
    }

    // ========== ПЕРЕКЛЮЧАТЕЛЬ ВАЛЮТЫ ==========
    function switchCurrency(code) {
        const W = window.WalletEngine;
        if (!W || !W.setCurrency) return;
        W.setCurrency(code);

        // Обновить кнопки
        document.querySelectorAll('.wallet-currency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim() === code);
        });

        _refreshWalletUI();
        _showToast(`💱 Валюта изменена на ${code}`);
    }

    // ========== ФИЛЬТРЫ ТРАНЗАКЦИЙ ==========
    function setTxFilter(filter) {
        _txFilter = filter;
        _txPage = 1;

        // Подсветка активного фильтра
        document.querySelectorAll('.tx-filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        const W = window.WalletEngine;
        if (W) _renderTransactions(W.getTransactions());
    }

    // ========== ПАГИНАЦИЯ ==========
    function loadMoreTx() {
        _txPage++;
        const W = window.WalletEngine;
        if (W) _renderTransactions(W.getTransactions());
    }

    // ========== ЭКСПОРТ CSV ==========
    function exportCSV() {
        const W = window.WalletEngine;
        if (!W) return;

        const txs = W.getTransactions();
        if (txs.length === 0) {
            _showToast('📭 Нет операций для экспорта');
            return;
        }

        const headers = ['ID', 'Дата', 'Тип', 'Описание', 'Сумма (USD)', 'Статус', 'Метод', 'Баланс после'];
        const rows = txs.map(tx => [
            tx.id,
            new Date(tx.date).toLocaleString('ru-RU'),
            tx.type,
            (tx.description || '').replace(/,/g, ';'),
            tx.amount.toFixed(2),
            tx.status,
            tx.method || '',
            (tx.balanceAfter || 0).toFixed(2)
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.join(','))
            .join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qazgost_wallet_${new Date().toISOString().slice(0,10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        _showToast(`✅ Экспортировано ${txs.length} операций`);
    }

    // ========== АНАЛИТИКА ==========
    function showAnalytics() {
        const W = window.WalletEngine;
        if (!W) return;

        const old = document.getElementById('walletAnalyticsModal');
        if (old) { old.remove(); return; }

        const txs = W.getTransactions().filter(t => t.status !== 'pending');

        // Считаем по типам
        const byType = {};
        txs.forEach(tx => {
            if (!byType[tx.type]) byType[tx.type] = { count: 0, total: 0 };
            byType[tx.type].count++;
            byType[tx.type].total += tx.amount;
        });

        // Считаем по месяцам (последние 6)
        const byMonth = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
            byMonth[key] = { income: 0, expense: 0 };
        }
        txs.forEach(tx => {
            const d = new Date(tx.date);
            const key = d.toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' });
            if (byMonth[key]) {
                if (tx.amount > 0) byMonth[key].income += tx.amount;
                else byMonth[key].expense += Math.abs(tx.amount);
            }
        });

        const typeLabels = { topup: '💰 Пополнения', charge: '🛒 Списания', tariff: '⭐ Тарифы', promo: '🎟️ Промокоды', refund: '↩️ Возвраты' };
        const fmt = a => W.formatInCurrency ? W.formatInCurrency(Math.abs(a)) : `$${Math.abs(a).toFixed(2)}`;

        const maxMonthVal = Math.max(...Object.values(byMonth).map(m => Math.max(m.income, m.expense)), 1);

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'walletAnalyticsModal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="wallet-topup-content analytics-modal-content">
                <div class="topup-header">
                    <div class="topup-title">📈 Аналитика кошелька</div>
                    <button class="topup-close" onclick="document.getElementById('walletAnalyticsModal')?.remove()">✕</button>
                </div>

                <!-- По месяцам -->
                <div class="analytics-section-title">📅 Активность за 6 месяцев</div>
                <div class="analytics-chart-wrap">
                    ${Object.entries(byMonth).map(([month, data]) => {
                        const inH = Math.max(4, Math.round((data.income / maxMonthVal) * 80));
                        const exH = Math.max(4, Math.round((data.expense / maxMonthVal) * 80));
                        return `
                            <div class="analytics-month-col">
                                <div class="analytics-bars">
                                    <div class="analytics-bar income" style="height:${inH}px" title="+${fmt(data.income)}"></div>
                                    <div class="analytics-bar expense" style="height:${exH}px" title="-${fmt(data.expense)}"></div>
                                </div>
                                <div class="analytics-month-label">${month}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="analytics-legend">
                    <span class="legend-dot income"></span> Пополнения
                    <span class="legend-dot expense"></span> Расходы
                </div>

                <!-- По типам -->
                <div class="analytics-section-title" style="margin-top:1.5rem">📊 Разбивка по категориям</div>
                <div class="analytics-types">
                    ${Object.entries(byType).map(([type, data]) => {
                        const label = typeLabels[type] || type;
                        const isPositive = data.total >= 0;
                        return `
                            <div class="analytics-type-row">
                                <span class="analytics-type-label">${label}</span>
                                <span class="analytics-type-count">${data.count} оп.</span>
                                <span class="analytics-type-amount ${isPositive ? 'positive' : 'negative'}">
                                    ${isPositive ? '+' : '-'}${fmt(data.total)}
                                </span>
                            </div>
                        `;
                    }).join('')}
                </div>

                <button class="topup-submit" style="margin-top:1.5rem" onclick="WalletUI.exportCSV(); document.getElementById('walletAnalyticsModal')?.remove()">
                    ⬇️ Экспортировать в CSV
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // ========== ОБНОВЛЕНИЕ UI ==========
    function _refreshWalletUI() {
        const W = window.WalletEngine;
        if (!W) return;

        // Обновить баланс
        const balanceEl = document.getElementById('walletBalanceDisplay');
        if (balanceEl) balanceEl.textContent = W.formatBalance(W.getBalance());

        // Обновить бейдж тарифа
        const tariff = W.getCurrentTariff();
        const badgeEl = document.getElementById('walletTariffBadge');
        if (badgeEl) {
            badgeEl.className = 'wallet-tariff-badge' + (tariff ? ' active' : '');
            badgeEl.innerHTML = tariff ? `${tariff.icon} ${tariff.badge}` : '📋 Тариф не выбран';
        }

        // Обновить переключатель валюты
        const currInfo = W.getCurrencyInfo ? W.getCurrencyInfo() : { code: 'USD' };
        document.querySelectorAll('.wallet-currency-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.trim() === currInfo.code);
        });

        // Обновить карточки тарифов
        _renderTariffCards();

        // Обновить транзакции
        _renderTransactions(W.getTransactions());

        // Обновить мини-график
        _renderSpendChart();

        // Обновить статистику
        _renderStatsRow();

        // Обновить список pending
        const pending = W.getPendingPayments ? W.getPendingPayments().filter(p => p.status === 'pending') : [];
        if (pending.length > 0) _renderPendingList(pending);

        // Обновить хедер с анимацией
        _updateHeaderBalance(true);
    }

    // ========== БАЛАНС В ХЕДЕРЕ ==========
    function _updateHeaderBalance(animate = false) {
        const W = window.WalletEngine;
        if (!W) return;

        const el = document.getElementById('headerWalletBalance');
        if (el) el.textContent = W.formatBalance(W.getBalance());

        // Пульс-анимация при обновлении
        if (animate) {
            const btn = document.getElementById('headerWalletBtn');
            if (btn) {
                btn.classList.remove('pulse');
                void btn.offsetWidth; // force reflow
                btn.classList.add('pulse');
                setTimeout(() => btn.classList.remove('pulse'), 500);
            }
        }
    }

    // ========== УТИЛИТЫ ==========
    function _formatDate(isoString) {
        try {
            const d = new Date(isoString);
            const now = new Date();
            const diff = now - d;
            
            if (diff < 60000) return 'Только что';
            if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
            if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
            
            return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return ''; }
    }

    function _getDateGroupKey(isoString) {
        try {
            const d = new Date(isoString);
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const txDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const diff = today - txDay;
            
            if (diff === 0) return '📅 Сегодня';
            if (diff <= 86400000) return '📅 Вчера';
            if (diff <= 86400000 * 7) return '📅 На этой неделе';
            return d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
        } catch { return '📅 Другое'; }
    }

    // ========== КАСТОМНАЯ МОДАЛКА ПОДТВЕРЖДЕНИЯ ==========
    function _showConfirmModal(title, message, onConfirm) {
        const old = document.getElementById('walletConfirmModal');
        if (old) old.remove();

        const modal = document.createElement('div');
        modal.className = 'wallet-topup-modal';
        modal.id = 'walletConfirmModal';
        modal.onclick = (e) => { if (e.target === modal) modal.remove(); };

        modal.innerHTML = `
            <div class="wallet-topup-content card-payment-content" style="max-width:420px;">
                <div class="topup-header">
                    <div class="topup-title">⚠️ Подтверждение</div>
                    <button class="topup-close" onclick="document.getElementById('walletConfirmModal')?.remove()">✕</button>
                </div>
                <div style="padding:1.5rem 0;text-align:center;">
                    <div style="font-size:1.1rem;font-weight:600;color:rgba(255,255,255,0.95);margin-bottom:0.75rem;">${title}</div>
                    <div style="font-size:0.9rem;color:rgba(255,255,255,0.5);">${message}</div>
                </div>
                <div style="display:flex;gap:0.8rem;padding-top:0.5rem;">
                    <button class="topup-submit" style="background:rgba(255,255,255,0.08);flex:1;" 
                            id="walletConfirmCancel">Отмена</button>
                    <button class="topup-submit" style="flex:1;" 
                            id="walletConfirmOk">✅ Подтвердить</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('walletConfirmCancel').onclick = () => modal.remove();
        document.getElementById('walletConfirmOk').onclick = () => {
            modal.remove();
            if (typeof onConfirm === 'function') onConfirm();
        };
    }

    // ========== LUHN ВАЛИДАЦИЯ КАРТ ==========
    function _validateLuhn(cardNumber) {
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) return false;

        let sum = 0;
        let isEven = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i], 10);
            if (isEven) {
                digit *= 2;
                if (digit > 9) digit -= 9;
            }
            sum += digit;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    }

    function _showToast(msg) {
        if (typeof window.showToast === 'function') {
            window.showToast(msg);
        } else {
            // fallback
            const toast = document.createElement('div');
            toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:0.75rem 1.5rem;background:rgba(15,15,35,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#fff;font-size:0.9rem;z-index:99999;backdrop-filter:blur(10px);animation:authCardSlideUp 0.3s ease';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }

    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    // Подписка на обновления от WalletEngine
    if (window.WalletEngine) {
        window.WalletEngine.onUpdate((data) => {
            _refreshWalletUI();

            // Интеграция с NotificationService: уведомляем при операциях
            _notifyWalletEvent(data);
        });
    }

    // Инициализация баланса в хедере при загрузке
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => _updateHeaderBalance(false), 200);
    });

    // ========== ИНТЕГРАЦИЯ С УВЕДОМЛЕНИЯМИ ==========
    let _lastKnownBalance = window.WalletEngine ? window.WalletEngine.getBalance() : 0;

    function _notifyWalletEvent(data) {
        if (!window.NotificationService || !window.NotificationModels) return;

        const W = window.WalletEngine;
        if (!W) return;

        const currentBalance = data?.balance ?? W.getBalance();
        const diff = currentBalance - _lastKnownBalance;

        if (Math.abs(diff) < 0.01) return; // нет изменений

        const NS = window.NotificationService;
        const NT = window.NotificationModels.NotificationType;

        // Определяем тип операции по последней транзакции
        const lastTx = (data?.transactions || W.getTransactions())[0];
        if (!lastTx) return;

        const txType = lastTx.type;
        let notifType, title, icon;

        if (txType === 'topup' || txType === 'promo') {
            notifType = NT.PAYMENT_RECEIVED || 'PAYMENT_RECEIVED';
            title = diff > 0 ? '💰 Кошелёк пополнен' : '💸 Списание';
            icon = '💰';
        } else if (txType === 'tariff') {
            notifType = NT.SYSTEM || 'SYSTEM';
            title = '⭐ Тариф активирован';
            icon = '⭐';
        } else if (txType === 'charge') {
            notifType = NT.SYSTEM || 'SYSTEM';
            title = '🛒 Списание средств';
            icon = '🛒';
        } else {
            notifType = NT.SYSTEM || 'SYSTEM';
            title = diff > 0 ? '💰 Пополнение' : '💸 Списание';
            icon = diff > 0 ? '💰' : '💸';
        }

        NS.send({
            type: notifType,
            title: title,
            message: lastTx.description || `${diff > 0 ? '+' : ''}${W.CURRENCY_SYMBOL}${diff.toFixed(2)}. Баланс: ${W.formatBalance(currentBalance)}`,
            actionUrl: '#wallet',
            metadata: {
                amount: diff,
                balance: currentBalance,
                transactionId: lastTx.id
            }
        });

        _lastKnownBalance = currentBalance;
    }

    // ========== ВОЗВРАТ СРЕДСТВ (UI) ==========
    function _requestRefund(txId) {
        const W = window.WalletEngine;
        if (!W) return;

        const check = W.canRefund(txId);
        if (!check.canRefund) {
            _showToast(`❌ ${check.reason}`);
            return;
        }

        const tx = check.transaction;
        const amount = Math.abs(tx.amount);

        _showConfirmModal(
            `Вернуть ${W.CURRENCY_SYMBOL}${amount.toFixed(2)} на баланс?`,
            `Транзакция: ${tx.description}`,
            () => {
                const result = W.processRefund(txId);
                if (result.success) {
                    _showToast(`↩️ Возвращено ${W.CURRENCY_SYMBOL}${result.refundedAmount.toFixed(2)} на баланс`);
                    _refreshWalletUI();
                } else {
                    _showToast(`❌ ${result.error}`);
                }
            }
        );
    }

    // ========== ЧЕКИ (UI) ==========
    function _printInvoice(txId) {
        const W = window.WalletEngine;
        if (!W || !W.printInvoice) return;

        const success = W.printInvoice(txId);
        if (!success) {
            _showToast('❌ Не удалось открыть чек. Разрешите всплывающие окна.');
        }
    }

    // ========== PUBLIC API ==========
    window.WalletUI = {
        render: renderWalletPage,
        showTopUp,
        closeTopUp: _closeTopUp,
        showTariffs,
        selectTariff,
        refreshUI: _refreshWalletUI,
        updateHeaderBalance: _updateHeaderBalance,
        // Freedom Pay
        showFreedomPay: _showFreedomPayModal,
        _initFreedomPay,

        // Legacy card (kept for backward compat)
        showCardPayment: _showCardPaymentModal,

        showCryptoPay: _showCryptoPayModal,

        // ===== НОВЫЕ ФУНКЦИИ (100%) =====
        switchCurrency,
        setTxFilter,
        loadMoreTx,
        exportCSV,
        showAnalytics,
        _showChangeTariff,

        // Внутренние (для onclick)
        _selectAmount,
        _onAmountInput,
        _selectMethod,
        _processTopUp,
        _redeemPromo,
        _formatCardNumber,
        _formatExpiry,
        _submitCardPayment,
        _stripeCheckout,

        _selectCrypto,
        _copyAddr,
        _confirmCryptoPay,
        _requestRefund,
        _printInvoice,
        _retryVerify
    };

    console.log('💰 WalletUI initialized (v2.0 — 100%)');
})();
