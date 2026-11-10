import React from 'react';
import { LEGAL_OPERATOR } from '../data/legal';
import { navigateTo } from '../utils/navigate';
import './UserWalletPage.css';

// Раздел «Оплата» — честный режим.
// Онлайн-оплата не подключена: баланса на платформе нет, карты здесь не вводятся,
// тарифы подключаются по заявке. Раньше страница показывала демо-баланс 150 000 ₸,
// «пополнение» без оплаты и форму с номером карты и CVV, которая никуда их не отправляла.

const PLANS = [
  {
    key: 'basic',
    icon: '🏠',
    name: 'Базовый',
    price: '4 700 ₸',
    period: 'единовременно',
    features: ['Создание заказов на оценку', 'Загрузка до 5 фото', 'Базовые ИИ-отчёты', 'Просмотр каталога исполнителей', 'Поддержка по email'],
  },
  {
    key: 'pro',
    icon: '🏗️',
    name: 'Профессионал',
    price: '94 000 ₸',
    period: 'единовременно',
    popular: true,
    features: ['Всё из Базового тарифа', 'Строительство зданий и сооружений', 'VIP-модуль ИИ-анализа', 'Неограниченные фото', 'Расширенные PDF-отчёты', 'Приоритетная поддержка', 'Аналитика и статистика'],
  },
  {
    key: 'corp',
    icon: '🏢',
    name: 'Корпоративный',
    price: 'По запросу',
    features: ['Всё из тарифа «Профессионал»', 'Индивидуальная настройка', 'API-интеграция', 'Командные аккаунты', 'Выделенный менеджер'],
  },
];

const waLink = (text) => `${LEGAL_OPERATOR.whatsappUrl}?text=${encodeURIComponent(text)}`;

export default function UserWalletPage({ onBack, currentUser }) {
  const isExecutor = currentUser?.role === 'executor';

  const steps = isExecutor
    ? [
      { t: 'Откликаетесь на заказ', d: 'Цену и сроки указываете в отклике — заказчик видит их сразу.' },
      { t: 'Договариваетесь с заказчиком', d: 'Аванс и оплату этапов согласуете напрямую: договор, Kaspi, перевод или счёт для юрлиц.' },
      { t: 'Сдаёте этапы в «Моих заказах»', d: 'Заказчик принимает этап на платформе и оплачивает его вам напрямую.' },
    ]
    : [
      { t: 'Отправляете заявку', d: 'Бронь техники, заказ материалов или приглашение бригады — без предоплаты через платформу.' },
      { t: 'Согласуете цену и оплату', d: 'Напрямую с исполнителем или поставщиком: Kaspi, перевод или счёт с НДС для юрлиц.' },
      { t: 'Принимаете этапы в «Моих заказах»', d: 'Отмечаете выполненные этапы и оплачиваете их исполнителю напрямую.' },
    ];

  return (
    <div className="uw-container">
      <div className="uw-header-bar">
        {onBack && <button type="button" className="uw-back-btn" onClick={onBack} aria-label="Назад">←</button>}
        <div className="uw-header-title">
          <h1 className="uw-title">Оплата</h1>
          <p className="uw-subtitle">Как сейчас оплачиваются заказы на QazGost и когда появится онлайн-оплата.</p>
        </div>
      </div>

      <div className="uw-content">
        <section className="uw-card uw-pay-status" aria-labelledby="uw-status-title">
          <span className="uw-pay-badge">Онлайн-оплата подключается</span>
          <h2 id="uw-status-title" className="uw-pay-title">Деньги на платформе не хранятся</h2>
          <p className="uw-pay-text">
            Мы подключаем приём платежей через платёжную систему. До этого QazGost не хранит ваши деньги
            и не списывает их: брони, аренда техники и заказы оформляются заявкой без предоплаты,
            а оплату вы проводите напрямую исполнителю или поставщику.
          </p>
          <ul className="uw-pay-facts">
            <li>Баланса и пополнения нет — на платформе ничего не начисляется и не замораживается.</li>
            <li>Данные карты здесь вводить не нужно. Когда оплата заработает, карту вы будете вводить только на защищённой странице банка или платёжной системы.</li>
            <li>Статусы заказов и этапов по-прежнему ведутся в «Моих заказах».</li>
          </ul>
          <div className="uw-pay-actions">
            <button type="button" className="uw-btn-gold" onClick={() => navigateTo('/orders')}>Мои заказы →</button>
            <a className="uw-btn-glass" href={waLink('Здравствуйте! Вопрос по оплате в QazGost AI.')} target="_blank" rel="noopener noreferrer">Вопрос по оплате в WhatsApp</a>
          </div>
        </section>

        <section className="uw-pay-steps" aria-labelledby="uw-steps-title">
          <h2 id="uw-steps-title" className="uw-section-title">{isExecutor ? 'Как получить оплату сейчас' : 'Как оплатить заказ сейчас'}</h2>
          <ol>
            {steps.map((s, i) => (
              <li key={s.t} className="uw-stat-card">
                <span className="uw-step-num" aria-hidden="true">{i + 1}</span>
                <strong>{s.t}</strong>
                <span>{s.d}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="uw-tariffs-section" aria-labelledby="uw-tariffs-title">
          <h2 id="uw-tariffs-title" className="uw-section-title">Тарифы</h2>
          <p className="uw-pay-text" style={{ marginTop: 0 }}>Пока онлайн-оплата не подключена, тариф подключается по заявке — менеджер пришлёт счёт.</p>
          <div className="uw-plans-grid">
            {PLANS.map((p) => (
              <div key={p.key} className={`uw-plan-card${p.popular ? ' popular' : ''}`}>
                {p.popular && <span className="uw-popular-badge">ПОПУЛЯРНЫЙ</span>}
                <div className="uw-plan-icon" aria-hidden="true">{p.icon}</div>
                <h3 className="uw-plan-name">{p.name}</h3>
                <div className="uw-plan-price">
                  {p.price}
                  {p.period && <span className="uw-plan-period">{p.period}</span>}
                </div>
                <ul className="uw-plan-features">
                  {p.features.map((f) => <li key={f}><span className="check" aria-hidden="true">✓</span> {f}</li>)}
                </ul>
                <a
                  className={`uw-plan-btn${p.popular ? ' popular-btn' : ''}`}
                  href={waLink(`Здравствуйте! Хочу подключить тариф «${p.name}» в QazGost AI.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Подключить «{p.name}»
                </a>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
