import React, { useState, useEffect } from 'react';
import { getBalanceKZT, getTransactions, topupBalance, spendBalance } from '../services/walletEngine';
import './UserWalletPage.css';

const TX_STATUS = {
  completed: 'проведено',
  held_in_escrow: 'заморожено в эскроу',
  released: 'выплачено',
  partially_released: 'выплачено частично',
  refunded: 'возвращено',
  pending: 'в обработке',
  failed: 'ошибка',
};

export default function UserWalletPage({ onBack, currentUser }) {
  // Уникальный ключ пользователя для изоляции данных кошелька
  const userKey = currentUser?.login || currentUser?.email || currentUser?.name || 'guest';

  const [currency, setCurrency] = useState('KZT'); // 'KZT' | 'USD' | 'RUB'
  // Единственный источник правды — walletEngine (сумма в KZT); в UI баланс хранится в USD (курс 470).
  const [balance, setBalance] = useState(() => getBalanceKZT(currentUser) / 470);
  const [selectedPlan, setSelectedPlan] = useState(() => {
    try { return localStorage.getItem(`qazgost_plan_${userKey}`) || null; } catch { return null; }
  });
  const [transactions, setTransactions] = useState(() => getTransactions(currentUser));
  const totalDeposited = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0) / 470;
  const totalSpent = transactions.filter(t => t.amount < 0).reduce((s, t) => s - t.amount, 0) / 470;
  const opsCount = transactions.length;

  const refreshWallet = () => {
    setBalance(getBalanceKZT(currentUser) / 470);
    setTransactions(getTransactions(currentUser));
  };

  // Saved Bank Cards State — привязаны к конкретному пользователю
  // Полный номер карты и CVC НЕ храним: только маска и последние 4 цифры.
  const sanitizeCards = (list) => (Array.isArray(list) ? list : []).map(({ rawNumber, cvc, ...c }) => {
    const last4 = c.last4 || String(rawNumber || c.number || '').replace(/\D/g, '').slice(-4);
    return { ...c, last4, number: `•••• •••• •••• ${last4}` };
  });
  const [savedCards, setSavedCards] = useState(() => {
    try {
      const stored = localStorage.getItem(`qazgost_cards_${userKey}`);
      if (stored) return sanitizeCards(JSON.parse(stored));
    } catch (e) {}
    return [];
  });

  // Modals & Forms State
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null); // plan object
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isProcessingTopup, setIsProcessingTopup] = useState(false);

  const [topupAmountInput, setTopupAmountInput] = useState('50');
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'kaspi' | 'new_card'
  const [selectedCardId, setSelectedCardId] = useState(savedCards[0]?.id || '');

  // Add Card Form Inputs
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardExp, setNewCardExp] = useState('');
  const [newCardCvc, setNewCardCvc] = useState('');
  const [newCardBank, setNewCardBank] = useState('Kaspi Bank');
  const [setAsDefaultCard, setSetAsDefaultCard] = useState(true);

  // OTP Verification
  const [otpInput, setOtpInput] = useState('7788');
  const [pendingTopupAmount, setPendingTopupAmount] = useState(0);

  const [toastMessage, setToastMessage] = useState(null);

  // Currency Rates (Base USD = 1)
  const rates = {
    USD: { symbol: '$', rate: 1, prefix: '$' },
    KZT: { symbol: '₸', rate: 470, prefix: '' },
    RUB: { symbol: '₽', rate: 90, prefix: '' }
  };

  // Перезагрузка карт при смене пользователя
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`qazgost_cards_${userKey}`);
      if (stored) {
        setSavedCards(sanitizeCards(JSON.parse(stored)));
      } else {
        setSavedCards([]);
      }
    } catch (e) {
      setSavedCards([]);
    }
  }, [userKey]);

  // Сохранение карт конкретного пользователя
  useEffect(() => {
    localStorage.setItem(`qazgost_cards_${userKey}`, JSON.stringify(savedCards));
  }, [savedCards, userKey]);

  const formatMoney = (amountUsd) => {
    const curr = rates[currency];
    const val = amountUsd * curr.rate;
    if (currency === 'USD') return `$${val.toFixed(2)}`;
    if (currency === 'KZT') return `${Math.round(val).toLocaleString('ru-RU')} ₸`;
    if (currency === 'RUB') return `${Math.round(val).toLocaleString('ru-RU')} ₽`;
    return `$${val}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Format Card Number (adds spaces every 4 digits)
  const handleCardNumberChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 16);
    const formatted = clean.replace(/(.{4})/g, '$1 ').trim();
    setNewCardNumber(formatted);
  };

  // Format Expiry Date MM/YY
  const handleExpChange = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      setNewCardExp(`${clean.slice(0, 2)}/${clean.slice(2)}`);
    } else {
      setNewCardExp(clean);
    }
  };

  // Detect card brand from number
  const detectBrand = (num) => {
    const clean = num.replace(/\D/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (clean.startsWith('5')) return 'Mastercard';
    if (clean.startsWith('3')) return 'Amex';
    return 'Visa';
  };

  // Handle Binding a New Card
  const handleSaveNewCard = (e) => {
    e.preventDefault();
    const cleanNum = newCardNumber.replace(/\D/g, '');
    if (cleanNum.length < 16) {
      alert('⚠️ Пожалуйста, введите полный 16-значный номер карты.');
      return;
    }
    if (!newCardHolder.trim()) {
      alert('⚠️ Введите имя держателя карты (на латинице).');
      return;
    }
    const expMonth = parseInt(newCardExp.slice(0, 2), 10);
    if (newCardExp.length < 5 || !(expMonth >= 1 && expMonth <= 12)) {
      alert('⚠️ Введите срок действия карты в формате ММ/ГГ.');
      return;
    }

    const brand = detectBrand(cleanNum);
    const last4 = cleanNum.slice(-4);
    const cardId = `card_${Date.now()}`;

    // Select color gradient based on bank
    let bg = 'linear-gradient(135deg, #2563eb, #1d4ed8)';
    if (newCardBank.includes('Kaspi')) bg = 'linear-gradient(135deg, #e11d48, #9f1239)';
    if (newCardBank.includes('Halyk')) bg = 'linear-gradient(135deg, #059669, #064e3b)';
    if (newCardBank.includes('Freedom')) bg = 'linear-gradient(135deg, #10b981, #0284c7)';
    if (newCardBank.includes('Forte')) bg = 'linear-gradient(135deg, #7c3aed, #4c1d95)';

    const newCardObj = {
      id: cardId,
      bank: newCardBank,
      brand: brand,
      number: `•••• •••• •••• ${last4}`,
      last4,
      holder: newCardHolder.toUpperCase(),
      exp: newCardExp,
      isDefault: setAsDefaultCard || savedCards.length === 0,
      bgGradient: bg
    };

    let updatedList = [...savedCards];
    if (setAsDefaultCard) {
      updatedList = updatedList.map(c => ({ ...c, isDefault: false }));
    }
    updatedList.push(newCardObj);
    setSavedCards(updatedList);
    setSelectedCardId(cardId);

    // Reset Form & Close Modal
    setNewCardNumber('');
    setNewCardHolder('');
    setNewCardExp('');
    setNewCardCvc('');
    setShowAddCardModal(false);

    showToast(`💳 Карта ${brand} •••• ${last4} (${newCardBank}) успешно привязана!`);
  };

  // Set card as default
  const handleSetDefaultCard = (id) => {
    setSavedCards(prev => prev.map(c => ({ ...c, isDefault: c.id === id })));
    setSelectedCardId(id);
    showToast('⭐ Карта выбрана как основная для пополнения');
  };

  // Delete saved card
  const handleDeleteCard = (id) => {
    if (confirm('Вы действительно хотите отвязать эту карту?')) {
      setSavedCards(prev => prev.filter(c => c.id !== id));
      showToast('🗑️ Карта успешно отвязана');
    }
  };

  // Initiate Top-Up Process
  const handleInitiateTopup = (e) => {
    e.preventDefault();
    const amountUsd = parseFloat(topupAmountInput) || 0;
    if (amountUsd <= 0) {
      alert('Укажите корректную сумму пополнения');
      return;
    }

    setPendingTopupAmount(amountUsd);

    if (paymentMethod === 'kaspi') {
      // Direct Kaspi Pay flow
      executeTopupSuccess(amountUsd, 'Kaspi Pay (QR)');
    } else {
      // 3D Secure / OTP SMS confirmation flow for linked card
      setShowTopupModal(false);
      setShowOtpModal(true);
    }
  };

  // Confirm Topup via OTP Code
  const handleConfirmOtp = (e) => {
    e.preventDefault();
    setIsProcessingTopup(true);

    const activeCard = savedCards.find(c => c.id === selectedCardId) || savedCards[0];
    const cardInfoText = activeCard 
      ? `${activeCard.brand} •••• ${activeCard.number.slice(-4)} (${activeCard.bank})`
      : 'Банковская карта';

    setTimeout(() => {
      setIsProcessingTopup(false);
      setShowOtpModal(false);
      executeTopupSuccess(pendingTopupAmount, cardInfoText);
    }, 1200);
  };

  const executeTopupSuccess = (amountUsd, sourceText) => {
    try {
      topupBalance(Math.round(amountUsd * 470), sourceText, currentUser);
    } catch (err) {
      showToast(`⚠️ ${err.message}`);
      return;
    }
    refreshWallet();
    showToast(`🎉 Баланс пополнен на ${formatMoney(amountUsd)}!`);
  };

  // Buy Tariff
  const handleBuyTariff = (plan) => {
    // Реальное списание через walletEngine (раньше менялся только React-state и после F5 деньги «возвращались»)
    const res = spendBalance(Math.round(plan.priceUsd * 470), `Покупка тарифа "${plan.title}"`, currentUser, 'purchase');
    if (!res.ok) {
      setShowPayModal(plan);
      return;
    }
    setSelectedPlan(plan.title);
    try { localStorage.setItem(`qazgost_plan_${userKey}`, plan.title); } catch (e) {}
    refreshWallet();
    showToast(`⭐ Тариф "${plan.title}" успешно активирован!`);
  };

  const scrollToTariffs = () => {
    const el = document.getElementById('tariffs-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const activeSelectedCard = savedCards.find(c => c.id === selectedCardId) || savedCards[0];

  return (
    <div className="uw-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="uw-toast">
          {toastMessage}
        </div>
      )}

      {/* Header Navigation */}
      <div className="uw-header-bar">
        <button className="uw-back-btn" onClick={onBack} title="Назад">←</button>
        <div className="uw-header-title">
          <h1 className="uw-title">Кошелёк</h1>
          <p className="uw-subtitle">Баланс, карты и эскроу по заказам. Деньги за работу заморожены, пока вы не примете этап.</p>
        </div>
      </div>

      <div className="uw-content">

        {/* Main Balance Card */}
        <div className="uw-card uw-balance-card">
          <div className="uw-balance-top">
            <div className="uw-balance-info">
              <span className="uw-balance-label">Доступно</span>
              <p className="uw-balance-amount qg-num">{formatMoney(balance)}</p>
              <div className="uw-plan-badge">
                {selectedPlan ? `Тариф: ${selectedPlan}` : 'Тариф не выбран'}
              </div>
            </div>

            {/* Currency Switcher */}
            <div className="uw-currency-toggle" role="group" aria-label="Валюта отображения">
              {['USD', 'KZT', 'RUB'].map(curr => (
                <button 
                  key={curr}
                  className={`uw-curr-btn ${currency === curr ? 'active' : ''}`}
                  aria-pressed={currency === curr}
                  onClick={() => setCurrency(curr)}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* History Data Box */}
          <div className="uw-history-box">
            {opsCount === 0 ? (
              <span className="uw-no-data">Нет транзакций. Нажмите «Пополнить», чтобы пополнить баланс с карты.</span>
            ) : (
              <div className="uw-history-summary">
                <span>Последняя операция: <strong>{transactions[0]?.title || '—'}</strong> ({formatMoney(Math.abs(Number(transactions[0]?.amount) || 0) / 470)})</span>
                <span className="uw-history-time">Сегодня, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            )}
          </div>

          {/* Action Buttons Bar */}
          <div className="uw-action-bar">
            <button 
              className="uw-btn-gold" 
              onClick={() => setShowTopupModal(true)}
            >
              Пополнить с карты
            </button>
            <button 
              className="uw-btn-glass"
              onClick={() => setShowAddCardModal(true)}
            >
              Привязать карту
            </button>
            <button 
              className="uw-btn-glass"
              onClick={scrollToTariffs}
            >
              Тарифы
            </button>
          </div>
        </div>

        {/* LINKED BANK CARDS MANAGEMENT SECTION */}
        <div className="uw-cards-section">
          <div className="uw-section-header">
            <h2 className="uw-section-title">Карты <span className="uw-count">{savedCards.length}</span></h2>
            <button className="uw-add-card-link-btn" onClick={() => setShowAddCardModal(true)}>
              Привязать новую карту
            </button>
          </div>

          <div className="uw-bank-cards-grid">
            {savedCards.map(card => (
              <div 
                key={card.id} 
                className={`uw-credit-card-item ${card.isDefault ? 'is-default' : ''}`}
                style={{ background: card.bgGradient }}
              >
                {card.isDefault && <span className="card-default-badge">Основная</span>}
                
                <div className="card-top-row">
                  <div className="card-chip-box">
                    <div className="chip-lines"></div>
                  </div>
                  <span className="card-bank-name">{card.bank}</span>
                </div>

                <div className="card-number-display">
                  {card.number}
                </div>

                <div className="card-bottom-row">
                  <div>
                    <div className="card-meta-lbl">Держатель</div>
                    <div className="card-meta-val">{card.holder}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="card-meta-lbl">Срок</div>
                    <div className="card-meta-val">{card.exp}</div>
                  </div>
                  <div className="card-brand-logo">{card.brand}</div>
                </div>

                <div className="card-actions-overlay">
                  {!card.isDefault && (
                    <button 
                      className="card-action-btn default-btn"
                      onClick={() => handleSetDefaultCard(card.id)}
                    >
                      Сделать основной
                    </button>
                  )}
                  <button 
                    className="card-action-btn delete-btn"
                    onClick={() => handleDeleteCard(card.id)}
                  >
                    Отвязать
                  </button>
                </div>
              </div>
            ))}

            {/* Add Card Plus Tile */}
            <button type="button" className="uw-add-card-tile" onClick={() => setShowAddCardModal(true)}>
              <span className="add-card-icon" aria-hidden="true">+</span>
              <span className="add-card-title">Привязать карту</span>
              <span className="add-card-sub">Visa, Mastercard, Kaspi</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="uw-stats-grid">
          <div className="uw-stat-card">
            <span className="uw-stat-label">Пополнено</span>
            <span className="uw-stat-value success">+{formatMoney(totalDeposited)}</span>
          </div>

          <div className="uw-stat-card">
            <span className="uw-stat-label">Потрачено</span>
            <span className="uw-stat-value danger">{totalSpent > 0 ? '−' : ''}{formatMoney(totalSpent)}</span>
          </div>

          <div className="uw-stat-card">
            <span className="uw-stat-label">Операций</span>
            <span className="uw-stat-value primary">{opsCount}</span>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="uw-transactions-section" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h2 className="uw-section-title">История операций</h2>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              У вас еще нет транзакций. Пополните баланс или купите тариф.
            </div>
          ) : (
            <div className="uw-transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {transactions.map(tx => {
                // Транзакции walletEngine: amount в KZT со знаком; formatMoney принимает USD
                const isRelease = tx.type === 'escrow_release';
                const kzt = isRelease ? (Number(tx.releasedAmount) || 0) : (Number(tx.amount) || 0);
                const incoming = !isRelease && kzt > 0;
                const color = isRelease ? '#38bdf8' : (incoming ? '#10b981' : '#ef4444');
                return (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: incoming ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {isRelease ? '🔓' : (incoming ? '↓' : '↑')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.95rem' }}>{tx.title}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{tx.date}, {TX_STATUS[tx.status] || tx.status}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color }}>
                    {isRelease ? '' : (incoming ? '+' : '-')}{formatMoney(Math.abs(kzt) / 470)}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tariff Plans Section */}
        <div className="uw-tariffs-section" id="tariffs-section">
          <h2 className="uw-section-title">Тарифы</h2>

          <div className="uw-plans-grid">
            
            {/* Card 1: Базовый */}
            <div className="uw-plan-card">
              <div className="uw-plan-icon">🏠</div>
              <h4 className="uw-plan-name">Базовый</h4>
              <div className="uw-plan-price">
                {formatMoney(10)}
                <span className="uw-plan-period">единовременно</span>
              </div>

              <ul className="uw-plan-features">
                <li><span className="check">✓</span> Создание заказов на оценку</li>
                <li><span className="check">✓</span> Загрузка до 5 фото</li>
                <li><span className="check">✓</span> Базовые ИИ-отчёты</li>
                <li><span className="check">✓</span> Просмотр каталога исполнителей</li>
                <li><span className="check">✓</span> Email поддержка</li>
              </ul>

              <button 
                className="uw-plan-btn"
                onClick={() => handleBuyTariff({ title: 'Базовый', priceUsd: 10 })}
              >
                💳 Оплатить {formatMoney(10)}
              </button>
              {balance < 10 && (
                <span className="uw-need-more">Нужно ещё {formatMoney(10 - balance)}</span>
              )}
            </div>

            {/* Card 2: Профессионал (Popular) */}
            <div className="uw-plan-card popular">
              <span className="uw-popular-badge">ПОПУЛЯРНЫЙ</span>
              <div className="uw-plan-icon">🏗️</div>
              <h4 className="uw-plan-name">Профессионал</h4>
              <div className="uw-plan-price popular-color">
                {formatMoney(200)}
                <span className="uw-plan-period">единовременно</span>
              </div>

              <ul className="uw-plan-features">
                <li><span className="check">✓</span> Всё из Базового тарифа</li>
                <li><span className="check">✓</span> Строительство зданий и сооружений</li>
                <li><span className="check">✓</span> VIP модуль ИИ-анализа</li>
                <li><span className="check">✓</span> Неограниченные фото</li>
                <li><span className="check">✓</span> Расширенные PDF-отчёты</li>
                <li><span className="check">✓</span> Приоритетная поддержка 24/7</li>
                <li><span className="check">✓</span> Доступ к маркетплейсу</li>
                <li><span className="check">✓</span> Аналитика и статистика</li>
              </ul>

              <button 
                className="uw-plan-btn popular-btn"
                onClick={() => handleBuyTariff({ title: 'Профессионал', priceUsd: 200 })}
              >
                💳 Оплатить {formatMoney(200)}
              </button>
              {balance < 200 && (
                <span className="uw-need-more">Нужно ещё {formatMoney(200 - balance)}</span>
              )}
            </div>

            {/* Card 3: Корпоративный */}
            <div className="uw-plan-card">
              <div className="uw-plan-icon">🏢</div>
              <h4 className="uw-plan-name">Корпоративный</h4>
              <div className="uw-plan-price gold-text">
                По запросу
              </div>

              <ul className="uw-plan-features">
                <li><span className="check">✓</span> Всё из Профессионал</li>
                <li><span className="check">✓</span> Индивидуальная настройка</li>
                <li><span className="check">✓</span> API интеграция</li>
                <li><span className="check">✓</span> Командные аккаунты</li>
                <li><span className="check">✓</span> Выделенный менеджер</li>
                <li><span className="check">✓</span> SLA гарантии</li>
                <li><span className="check">✓</span> White-label решения</li>
              </ul>

              <button 
                className="uw-plan-btn"
                onClick={() => showToast('📞 Заявка на Корпоративный тариф отправлена менеджеру!')}
              >
                📞 Связаться
              </button>
            </div>

          </div>
        </div>

      </div>

      {/* TOPUP MODAL (ПОПОЛНЕНИЕ С КАРТЫ ИЛИ KASPI) */}
      {showTopupModal && (
        <div className="uw-modal-overlay" onClick={() => setShowTopupModal(false)}>
          <div className="uw-modal-card" onClick={e => e.stopPropagation()}>
            <button className="uw-modal-close" onClick={() => setShowTopupModal(false)}>✕</button>
            <h3>💳 Пополнение баланса</h3>
            <p className="uw-modal-sub">Выберите привязанную карту или метод оплаты</p>

            <div className="uw-preset-amounts">
              {[10, 50, 100, 200].map(amt => (
                <button 
                  key={amt} 
                  className={`uw-preset-btn ${topupAmountInput === String(amt) ? 'active' : ''}`}
                  onClick={() => setTopupAmountInput(String(amt))}
                >
                  {formatMoney(amt)}
                </button>
              ))}
            </div>

            <form onSubmit={handleInitiateTopup} className="mt-3">
              <div className="uw-form-group">
                <label>Сумма пополнения ($ USD):</label>
                <input 
                  type="number" 
                  min="1"
                  value={topupAmountInput} 
                  onChange={e => setTopupAmountInput(e.target.value)} 
                  className="uw-modal-input"
                />
              </div>

              <div className="uw-form-group mt-3">
                <label>Источник оплаты:</label>
                
                {/* SELECT LINKED CARD OR KASPI */}
                <div className="uw-card-picker-list">
                  {savedCards.map(c => (
                    <div 
                      key={c.id} 
                      className={`uw-card-picker-item ${paymentMethod === 'card' && selectedCardId === c.id ? 'active' : ''}`}
                      onClick={() => {
                        setPaymentMethod('card');
                        setSelectedCardId(c.id);
                      }}
                    >
                      <div className="picker-left">
                        <span className="picker-icon">💳</span>
                        <div>
                          <strong style={{ color: '#fff', fontSize: '0.88rem' }}>{c.bank} ({c.brand})</strong>
                          <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>{c.number}</div>
                        </div>
                      </div>
                      {c.isDefault && <span className="picker-badge">Основная</span>}
                    </div>
                  ))}

                  <div 
                    className={`uw-card-picker-item ${paymentMethod === 'kaspi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('kaspi')}
                  >
                    <div className="picker-left">
                      <span className="picker-icon">🔴</span>
                      <div>
                        <strong style={{ color: '#fff', fontSize: '0.88rem' }}>Kaspi Pay / QR</strong>
                        <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Оплата по QR-коду</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button 
                  type="button" 
                  className="uw-btn-add-new-card"
                  onClick={() => {
                    setShowTopupModal(false);
                    setShowAddCardModal(true);
                  }}
                >
                  + Привязать другую банковскую карту
                </button>
              </div>

              <button type="submit" className="uw-btn-gold w-100 mt-4">
                💳 Списать и пополнить {formatMoney(parseFloat(topupAmountInput) || 0)}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADD NEW CARD MODAL (ПРИВЯЗКА БАНКОВСКОЙ КАРТЫ) */}
      {showAddCardModal && (
        <div className="uw-modal-overlay" onClick={() => setShowAddCardModal(false)}>
          <div className="uw-modal-card uw-modal-card-wide" onClick={e => e.stopPropagation()}>
            <button className="uw-modal-close" onClick={() => setShowAddCardModal(false)}>✕</button>
            
            <h3>💳 Привязать банковскую карту</h3>
            <p className="uw-modal-sub">Введите реквизиты карты для мгновенных пополнений кошелька</p>

            {/* LIVE CARD PREVIEW */}
            <div className="uw-live-card-preview" style={{ background: newCardBank.includes('Kaspi') ? 'linear-gradient(135deg, #e11d48, #9f1239)' : (newCardBank.includes('Halyk') ? 'linear-gradient(135deg, #059669, #064e3b)' : 'linear-gradient(135deg, #2563eb, #1d4ed8)') }}>
              <div className="card-top-row">
                <div className="card-chip-box"><div className="chip-lines"></div></div>
                <span className="card-bank-name">{newCardBank}</span>
              </div>
              <div className="card-number-display">
                {newCardNumber || '•••• •••• •••• ••••'}
              </div>
              <div className="card-bottom-row">
                <div>
                  <div className="card-meta-lbl">Держатель</div>
                  <div className="card-meta-val">{newCardHolder.toUpperCase() || 'YOUR NAME'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="card-meta-lbl">Срок</div>
                  <div className="card-meta-val">{newCardExp || 'MM/YY'}</div>
                </div>
                <div className="card-brand-logo">{detectBrand(newCardNumber)}</div>
              </div>
            </div>

            <form onSubmit={handleSaveNewCard} className="mt-3">
              <div className="uw-form-group">
                <label>Банк-эмитент:</label>
                <select 
                  className="uw-modal-input" 
                  value={newCardBank}
                  onChange={e => setNewCardBank(e.target.value)}
                >
                  <option value="Kaspi Bank">🔴 Kaspi Bank (Казахстан)</option>
                  <option value="Halyk Bank">🟢 Halyk Bank (Народный)</option>
                  <option value="Freedom Bank">🟢 Freedom Bank (Казахстан)</option>
                  <option value="Jusan Bank">🟠 Jusan Bank</option>
                  <option value="Forte Bank">🟣 ForteBank</option>
                  <option value="Международная карта">💳 Международный банк (Visa/Mastercard)</option>
                </select>
              </div>

              <div className="uw-form-group mt-3">
                <label>Номер карты (16 цифр):</label>
                <input 
                  type="text" 
                  placeholder="4400 0000 0000 0000"
                  maxLength="19"
                  value={newCardNumber}
                  onChange={e => handleCardNumberChange(e.target.value)}
                  className="uw-modal-input font-mono"
                  required
                />
              </div>

              <div className="uw-form-grid-2 mt-3">
                <div className="uw-form-group">
                  <label>Срок (ММ/ГГ):</label>
                  <input 
                    type="text" 
                    placeholder="12/28"
                    maxLength="5"
                    value={newCardExp}
                    onChange={e => handleExpChange(e.target.value)}
                    className="uw-modal-input"
                    required
                  />
                </div>

                <div className="uw-form-group">
                  <label>CVC / CVV:</label>
                  <input 
                    type="password" 
                    placeholder="•••"
                    maxLength="3"
                    value={newCardCvc}
                    onChange={e => setNewCardCvc(e.target.value.replace(/\D/g, ''))}
                    className="uw-modal-input"
                    required
                  />
                </div>
              </div>

              <div className="uw-form-group mt-3">
                <label>Имя и фамилия на карте (латиницей):</label>
                <input 
                  type="text" 
                  placeholder="ERBOL MARATOV"
                  value={newCardHolder}
                  onChange={e => setNewCardHolder(e.target.value)}
                  className="uw-modal-input uppercase"
                  required
                />
              </div>

              <div className="uw-form-checkbox mt-3">
                <input 
                  type="checkbox" 
                  id="set-default"
                  checked={setSetAsDefaultCard} 
                  onChange={e => setSetAsDefaultCard(e.target.checked)} 
                />
                <label htmlFor="set-default">Сделать основной картой для пополнений</label>
              </div>

              <button type="submit" className="uw-btn-gold w-100 mt-4">
                💳 Сохранить и привязать карту
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3D SECURE / SMS OTP VERIFICATION MODAL */}
      {showOtpModal && (
        <div className="uw-modal-overlay">
          <div className="uw-modal-card text-center" onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛡️</div>
            <h3>3D Secure Подтверждение</h3>
            <p className="uw-modal-sub">
              Мы отправили 4-значный SMS-код на привязанный номер телефона для пополнения {formatMoney(pendingTopupAmount)} с карты {activeSelectedCard ? activeSelectedCard.number : ''}
            </p>

            <form onSubmit={handleConfirmOtp} className="mt-3">
              <div className="uw-form-group">
                <label style={{ textAlign: 'center' }}>Введите SMS-код подтверждения:</label>
                <input 
                  type="text" 
                  maxLength="4"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value)}
                  className="uw-modal-input otp-input"
                  style={{ textAlign: 'center', fontSize: '1.6rem', letterSpacing: '8px', fontWeight: 900 }}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="uw-btn-gold w-100 mt-4"
                disabled={isProcessingTopup}
              >
                {isProcessingTopup ? '⏳ Обработка транзакции...' : '✅ Подтвердить пополнение'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Payment Need Topup Modal */}
      {showPayModal && (
        <div className="uw-modal-overlay" onClick={() => setShowPayModal(null)}>
          <div className="uw-modal-card" onClick={e => e.stopPropagation()}>
            <button className="uw-modal-close" onClick={() => setShowPayModal(null)}>✕</button>
            <h3>⚠️ Недостаточно средств</h3>
            <p className="uw-modal-sub">
              Для покупки тарифа <strong>"{showPayModal.title}"</strong> необходимо {formatMoney(showPayModal.priceUsd)}. 
              Ваш баланс: {formatMoney(balance)}.
            </p>

            <button 
              className="uw-btn-gold w-100 mt-3"
              onClick={() => {
                const diff = showPayModal.priceUsd - balance;
                setTopupAmountInput(String(diff));
                setShowPayModal(null);
                setShowTopupModal(true);
              }}
            >
              💳 Пополнить на {formatMoney(showPayModal.priceUsd - balance)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
