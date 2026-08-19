import React, { useState } from 'react';
import './UserWalletPage.css';

export default function UserWalletPage({ onBack }) {
  const [currency, setCurrency] = useState('USD'); // 'USD' | 'KZT' | 'RUB'
  const [balance, setBalance] = useState(0);
  const [totalDeposited, setTotalDeposited] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [opsCount, setOpsCount] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [transactions, setTransactions] = useState([]);

  // Modals & Active Tab
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(null); // plan object
  const [topupAmountInput, setTopupAmountInput] = useState('50');
  const [paymentMethod, setPaymentMethod] = useState('kaspi');
  const [activeTab, setActiveTab] = useState('topup'); // 'topup' | 'tariffs' | 'analytics'
  const [toastMessage, setToastMessage] = useState(null);

  // Currency Rates (Base USD = 1)
  const rates = {
    USD: { symbol: '$', rate: 1, prefix: '$' },
    KZT: { symbol: '₸', rate: 470, prefix: '' },
    RUB: { symbol: '₽', rate: 90, prefix: '' }
  };

  const formatMoney = (amountUsd) => {
    const curr = rates[currency];
    const val = amountUsd * curr.rate;
    if (currency === 'USD') return `$${val.toFixed(2)}`;
    if (currency === 'KZT') return `${Math.round(val).toLocaleString()} ₸`;
    if (currency === 'RUB') return `${Math.round(val).toLocaleString()} ₽`;
    return `$${val}`;
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleTopupSubmit = (e) => {
    e.preventDefault();
    const amountUsd = parseFloat(topupAmountInput) || 0;
    if (amountUsd <= 0) return;

    setBalance(prev => prev + amountUsd);
    setTotalDeposited(prev => prev + amountUsd);
    setOpsCount(prev => prev + 1);
    
    const newTx = {
      id: Date.now().toString(),
      type: 'topup',
      amountUsd: amountUsd,
      date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      desc: paymentMethod === 'kaspi' ? 'Пополнение через Kaspi Pay' : 'Пополнение банковской картой',
      status: 'Успешно'
    };
    setTransactions(prev => [newTx, ...prev]);
    
    setShowTopupModal(false);
    showToast(`🎉 Баланс пополнен на ${formatMoney(amountUsd)}!`);
  };

  const handleBuyTariff = (plan) => {
    if (balance < plan.priceUsd) {
      setShowPayModal(plan);
    } else {
      setBalance(prev => prev - plan.priceUsd);
      setTotalSpent(prev => prev + plan.priceUsd);
      setSelectedPlan(plan.title);
      setOpsCount(prev => prev + 1);

      const newTx = {
        id: Date.now().toString(),
        type: 'purchase',
        amountUsd: plan.priceUsd,
        date: new Date().toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        desc: `Покупка тарифа "${plan.title}"`,
        status: 'Успешно'
      };
      setTransactions(prev => [newTx, ...prev]);

      showToast(`⭐ Тариф "${plan.title}" успешно активирован!`);
    }
  };

  const scrollToTariffs = () => {
    const el = document.getElementById('tariffs-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

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
          <span className="uw-header-icon">💳</span>
          <h2>Мой кошелёк</h2>
        </div>
      </div>

      <div className="uw-content">

        {/* Main Balance Card */}
        <div className="uw-card uw-balance-card">
          <div className="uw-balance-top">
            <div className="uw-balance-info">
              <span className="uw-balance-label">💰 Баланс кошелька</span>
              <h1 className="uw-balance-amount">{formatMoney(balance)}</h1>
              <div className="uw-plan-badge">
                📋 {selectedPlan ? `Тариф: ${selectedPlan}` : 'Тариф не выбран'}
              </div>
            </div>

            {/* Currency Switcher */}
            <div className="uw-currency-toggle">
              {['USD', 'KZT', 'RUB'].map(curr => (
                <button 
                  key={curr}
                  className={`uw-curr-btn ${currency === curr ? 'active' : ''}`}
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
              <span className="uw-no-data">Нет данных</span>
            ) : (
              <div className="uw-history-summary">
                <span>Последняя транзакция: <strong>Пополнение баланса</strong> ({formatMoney(totalDeposited)})</span>
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
              💳 Пополнить
            </button>
            <button 
              className="uw-btn-glass"
              onClick={scrollToTariffs}
            >
              ⭐ Тарифы
            </button>
            <button 
              className="uw-btn-glass"
              onClick={() => showToast('📊 Аналитика расходов активна')}
            >
              📊 Аналитика
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="uw-stats-grid">
          <div className="uw-stat-card">
            <span className="uw-stat-label">💰 Всего пополнено</span>
            <span className="uw-stat-value success">+{formatMoney(totalDeposited)}</span>
          </div>

          <div className="uw-stat-card">
            <span className="uw-stat-label">💸 Всего потрачено</span>
            <span className="uw-stat-value danger">+{formatMoney(totalSpent)}</span>
          </div>

          <div className="uw-stat-card">
            <span className="uw-stat-label">📋 Операций</span>
            <span className="uw-stat-value primary">{opsCount}</span>
          </div>
        </div>

        {/* Transaction History Section */}
        <div className="uw-transactions-section" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <h3 className="uw-section-title">📜 История операций</h3>
          {transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', color: '#94a3b8' }}>
              У вас еще нет транзакций. Пополните баланс или купите тариф.
            </div>
          ) : (
            <div className="uw-transactions-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {transactions.map(tx => (
                <div key={tx.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: tx.type === 'topup' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: tx.type === 'topup' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      {tx.type === 'topup' ? '↓' : '↑'}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#f8fafc', fontWeight: '600', fontSize: '0.95rem' }}>{tx.desc}</span>
                      <span style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.2rem' }}>{tx.date} • {tx.status}</span>
                    </div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem', color: tx.type === 'topup' ? '#10b981' : '#ef4444' }}>
                    {tx.type === 'topup' ? '+' : '-'}{formatMoney(tx.amountUsd)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tariff Plans Section */}
        <div className="uw-tariffs-section" id="tariffs-section">
          <h3 className="uw-section-title">⭐ Тарифные планы</h3>

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

      {/* Topup Modal */}
      {showTopupModal && (
        <div className="uw-modal-overlay" onClick={() => setShowTopupModal(false)}>
          <div className="uw-modal-card" onClick={e => e.stopPropagation()}>
            <button className="uw-modal-close" onClick={() => setShowTopupModal(false)}>✕</button>
            <h3>💳 Пополнение баланса</h3>
            <p className="uw-modal-sub">Выберите сумму или введите свою для мгновенного пополнения</p>

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

            <form onSubmit={handleTopupSubmit} className="mt-3">
              <div className="uw-form-group">
                <label>Сумма в USD ($):</label>
                <input 
                  type="number" 
                  min="1"
                  value={topupAmountInput} 
                  onChange={e => setTopupAmountInput(e.target.value)} 
                  className="uw-modal-input"
                />
              </div>

              <div className="uw-form-group mt-3">
                <label>Способ оплаты:</label>
                <div className="uw-payment-methods">
                  <div 
                    className={`uw-pay-card ${paymentMethod === 'kaspi' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('kaspi')}
                  >
                    <span>🔴 Kaspi Pay</span>
                  </div>
                  <div 
                    className={`uw-pay-card ${paymentMethod === 'card' ? 'active' : ''}`}
                    onClick={() => setPaymentMethod('card')}
                  >
                    <span>💳 Картой (Visa/MC)</span>
                  </div>
                </div>
              </div>

              <button type="submit" className="uw-btn-gold w-100 mt-4">
                💳 Пополнить на {formatMoney(parseFloat(topupAmountInput) || 0)}
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
