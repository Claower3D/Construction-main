import React, { useState, useMemo } from 'react';
import './AnalystDashboardPage.css';

/* ── Mock Data: Completed Orders from Executors ────────────────────── */
const COMPLETED_ORDERS = [
  {
    id: 'ORD-2024-0847', status: 'pending',
    title: 'Капитальный ремонт офиса «Prime Tower» — 450 м²',
    customer: 'ТОО «Алматы Бизнес Центр»', executor: 'Жумабеков Арман (Бригада №1)',
    manager: 'Алиева Динара', engineer: 'Искаков Мурат',
    area: '450 м²', budget: '18 500 000 ₸', city: 'Алматы',
    startDate: '2024-06-15', endDate: '2024-08-10', closedDate: '2024-08-12',
    filesCount: 12, photosCount: 34,
    timeline: [
      { step: 'Заявка создана менеджером', date: '15.06.2024', actor: 'Алиева Динара (CRM)', details: 'Заказчик обратился через сайт. КП отправлено в течение 2 часов.', dotColor: '#8b5cf6' },
      { step: 'Смета утверждена', date: '18.06.2024', actor: 'Касымов Ербол (ГИП)', details: 'Смета на 18.5 млн ₸ утверждена. Объем: штукатурка 1200м², стяжка 450м², электрика 820п.м.', dotColor: '#3b82f6' },
      { step: 'Договор подписан', date: '20.06.2024', actor: 'Аскаров Бауржан (CEO)', details: 'Договор подряда №DP-0847. Эскроу открыт на 18.5 млн ₸ (3 транша).', dotColor: '#0ea5e9' },
      { step: 'Мобилизация бригады', date: '22.06.2024', actor: 'Жумабеков Арман (Прораб)', details: 'Бригада №1 (8 чел.) мобилизована. Завоз материалов: цемент M500 — 12т, арматура — 3.5т.', dotColor: '#10b981' },
      { step: 'Этап 1: Демонтаж (завершён)', date: '28.06.2024', actor: 'Бригадир Садыков', details: 'Демонтаж старой отделки, вывоз мусора (14 КАМАЗов). Акт КС-2 №1 подписан.', dotColor: '#10b981' },
      { step: 'Этап 2: Черновая отделка (завершён)', date: '18.07.2024', actor: 'Бригадир Садыков', details: 'Штукатурка стен — 1200м², стяжка пола — 450м², электропроводка — 820п.м. Всё по СНиП РК.', dotColor: '#10b981' },
      { step: 'Технадзор: Проверка качества', date: '19.07.2024', actor: 'Искаков Мурат (Технадзор)', details: 'УЗ-контроль стяжки — OK. Геометрия стен — отклонение ≤2мм/м. Заключение: СООТВЕТСТВУЕТ.', dotColor: '#f59e0b' },
      { step: 'Этап 3: Чистовая отделка (завершён)', date: '05.08.2024', actor: 'Бригадир Ким', details: 'Покраска стен Tikkurila — 1200м², керамогранит 600x600 — 450м², натяжные потолки — 450м².', dotColor: '#10b981' },
      { step: 'Исполнитель закрыл заявку', date: '10.08.2024', actor: 'Жумабеков Арман', details: 'Все работы завершены. Объект передан заказчику. Гарантия 24 мес. от QazGost.', dotColor: '#10b981' },
      { step: '→ Передано Аналитику', date: '12.08.2024', actor: 'Система QazGost AI', details: 'Заявка автоматически передана аналитику для финальной отчётности и архивации.', dotColor: '#8b5cf6' },
    ],
    files: [
      { name: 'Договор_DP-0847.pdf', type: 'pdf', size: '2.4 MB' },
      { name: 'Смета_утвержд_18.5млн.xlsx', type: 'excel', size: '890 KB' },
      { name: 'Акт_КС-2_этап1.pdf', type: 'pdf', size: '1.1 MB' },
      { name: 'Акт_КС-2_этап2.pdf', type: 'pdf', size: '1.3 MB' },
      { name: 'Акт_КС-2_этап3.pdf', type: 'pdf', size: '1.2 MB' },
      { name: 'Акт_КС-3_итоговый.pdf', type: 'pdf', size: '980 KB' },
      { name: 'Заключение_технадзора.pdf', type: 'pdf', size: '3.2 MB' },
      { name: 'Гарантийное_письмо.pdf', type: 'pdf', size: '520 KB' },
    ],
    photos: ['Демонтаж_фото_01.jpg','Штукатурка_процесс.jpg','Стяжка_замер.jpg','Электрика_скрытая.jpg','Покраска_финал.jpg','Керамогранит_укладка.jpg','Объект_сдан.jpg'],
  },
  {
    id: 'ORD-2024-0912', status: 'review',
    title: 'Строительство коттеджа «Nomad Villa» — 280 м²',
    customer: 'Ахметов Марат Серикович (ИИН)', executor: 'Бригада №2 (Ким Александр)',
    manager: 'Алиева Динара', engineer: 'Сулейменов Ринат',
    area: '280 м²', budget: '42 000 000 ₸', city: 'Алматы (Бостандыкский р-н)',
    startDate: '2024-03-01', endDate: '2024-07-28', closedDate: '2024-08-01',
    filesCount: 18, photosCount: 67,
    timeline: [
      { step: 'Заявка от частного заказчика', date: '01.03.2024', actor: 'Алиева Динара', details: 'Ахметов М.С. — строительство 2-этажного коттеджа 280м² с цокольным этажом.', dotColor: '#8b5cf6' },
      { step: 'Проект утверждён (ПСД)', date: '15.03.2024', actor: 'Касымов Ербол (ГИП)', details: 'Проект 2 этажа + цоколь. Монолитный каркас. Площадь застройки 140м².', dotColor: '#3b82f6' },
      { step: 'Фундамент завершён', date: '20.04.2024', actor: 'Бригадир Садыков', details: 'Монолитная плита 300мм + ростверк. Бетон B25 — 48м³.', dotColor: '#10b981' },
      { step: 'Коробка завершена', date: '15.06.2024', actor: 'Бригадир Ким', details: 'Стены: газоблок D500 400мм. Перекрытия: монолит B25 200мм. Кровля: металлочерепица.', dotColor: '#10b981' },
      { step: 'Отделка и инженерные сети', date: '20.07.2024', actor: 'Бригада №2', details: 'Электрика, сантехника, отопление, чистовая отделка 100%.', dotColor: '#10b981' },
      { step: 'Исполнитель закрыл заявку', date: '28.07.2024', actor: 'Ким Александр', details: 'Коттедж сдан. Акт приёмки подписан.', dotColor: '#10b981' },
      { step: '→ На проверке у аналитика', date: '01.08.2024', actor: 'Система', details: 'Проверка полноты документации и формирование итогового отчёта.', dotColor: '#f59e0b' },
    ],
    files: [
      { name: 'Проект_ПСД_коттедж.pdf', type: 'pdf', size: '15.2 MB' },
      { name: 'Договор_подряда.pdf', type: 'pdf', size: '3.1 MB' },
      { name: 'Смета_42млн.xlsx', type: 'excel', size: '1.4 MB' },
      { name: 'Акт_фундамент.pdf', type: 'pdf', size: '2.8 MB' },
      { name: 'Акт_коробка.pdf', type: 'pdf', size: '2.1 MB' },
      { name: 'Акт_приёмки_итог.pdf', type: 'pdf', size: '4.5 MB' },
    ],
    photos: ['Котлован.jpg','Арматура_плита.jpg','Заливка_бетона.jpg','Стены_газоблок.jpg','Кровля_монтаж.jpg','Отделка_внутри.jpg'],
  },
  {
    id: 'ORD-2024-0788', status: 'done',
    title: 'Ремонт квартиры 95 м² — ЖК «Астана Тауэрс»',
    customer: 'Токтаров Б.К.', executor: 'Бригада отделочников №2',
    manager: 'Алиева Динара', engineer: 'Искаков Мурат',
    area: '95 м²', budget: '6 200 000 ₸', city: 'Астана',
    startDate: '2024-04-10', endDate: '2024-06-05', closedDate: '2024-06-08',
    filesCount: 8, photosCount: 22,
    timeline: [
      { step: 'Заявка принята', date: '10.04.2024', actor: 'Менеджер', details: 'Ремонт 3-комнатной квартиры под ключ.', dotColor: '#8b5cf6' },
      { step: 'Работы завершены', date: '05.06.2024', actor: 'Исполнитель', details: 'Полный ремонт сдан заказчику.', dotColor: '#10b981' },
      { step: 'Отчёт сформирован ✓', date: '08.06.2024', actor: 'Аналитик QazGost', details: 'PDF-отчёт сгенерирован и отправлен заказчику.', dotColor: '#10b981' },
    ],
    files: [
      { name: 'Договор.pdf', type: 'pdf', size: '1.8 MB' },
      { name: 'Итоговый_отчёт.pdf', type: 'pdf', size: '8.4 MB' },
    ],
    photos: ['До_ремонта.jpg','После_ремонта.jpg'],
  },
];

/* ── Component ─────────────────────────────────────────────────────── */
export default function AnalystDashboardPage({ onBack, hideHeader = false }) {
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [orders, setOrders] = useState(COMPLETED_ORDERS);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  const filteredOrders = useMemo(() =>
    orders.filter(o => statusFilter === 'all' || o.status === statusFilter),
  [orders, statusFilter]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    review: orders.filter(o => o.status === 'review').length,
    done: orders.filter(o => o.status === 'done').length,
    totalBudget: orders.reduce((s, o) => s + parseInt(o.budget.replace(/[^\d]/g, '')), 0),
    totalPhotos: orders.reduce((s, o) => s + o.photosCount, 0),
    totalFiles: orders.reduce((s, o) => s + o.filesCount, 0),
  }), [orders]);

  const handleMarkDone = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'done' } : o));
    flash(`✅ Заявка ${orderId} — отчёт сформирован и закрыт`);
    setSelectedOrder(null);
  };

  const handleExportPDF = (order) => {
    flash(`📄 PDF-отчёт для ${order.id} скачивается...`);
    // In real app, generate PDF via backend
    setTimeout(() => {
      const content = [
        `══════════════════════════════════════════════════`,
        `  QAZGOST AI — ИТОГОВЫЙ ОТЧЁТ ПО ЗАЯВКЕ`,
        `══════════════════════════════════════════════════`,
        ``,
        `Номер заявки: ${order.id}`,
        `Название: ${order.title}`,
        `Заказчик: ${order.customer}`,
        `Исполнитель: ${order.executor}`,
        `Менеджер: ${order.manager}`,
        `Инженер технадзора: ${order.engineer}`,
        ``,
        `Площадь: ${order.area}`,
        `Бюджет: ${order.budget}`,
        `Город: ${order.city}`,
        `Дата начала: ${order.startDate}`,
        `Дата окончания: ${order.endDate}`,
        `Дата закрытия: ${order.closedDate}`,
        ``,
        `═══ ХРОНОЛОГИЯ РАБОТ ═══`,
        ...order.timeline.map((t, i) => `\n[${i + 1}] ${t.date} — ${t.step}\n    Исполнитель: ${t.actor}\n    ${t.details}`),
        ``,
        `═══ ПРИЛОЖЕННЫЕ ФАЙЛЫ (${order.files.length}) ═══`,
        ...order.files.map(f => `  📎 ${f.name} (${f.size})`),
        ``,
        `═══ ФОТОМАТЕРИАЛЫ (${order.photos?.length || 0}) ═══`,
        ...(order.photos || []).map(p => `  📷 ${p}`),
        ``,
        `══════════════════════════════════════════════════`,
        `Сгенерировано: ${new Date().toLocaleString('ru-RU')}`,
        `Система: QAZGOST AI Platform`,
        `Компания: ТОО «QAZGOST AI» (БИН: 240140029182)`,
        `══════════════════════════════════════════════════`,
      ].join('\n');

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QazGost_Report_${order.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      flash(`✅ Отчёт ${order.id} скачан!`);
    }, 800);
  };

  const TABS = [
    { key: 'queue', label: '📋 Очередь заявок', count: orders.length },
    { key: 'stats', label: '📊 Статистика', count: null },
  ];

  return (
    <div className="analyst-wrapper">
      {toast && <div className="analyst-toast">{toast}</div>}

      {/* ── Hero ────────────────────────────────────────────── */}
      <div className="analyst-hero">
        <div>
          <h2 className="analyst-hero-title">
            <span style={{ fontSize: '1.6rem' }}>📊</span>
            Рабочая область Аналитика
          </h2>
          <p className="analyst-hero-desc">
            Финальная отчётность по завершённым объектам. Проверка документации, прикрепление файлов, формирование PDF-отчётов и статистика проделанных работ.
          </p>
        </div>
        <div className="analyst-company-badge">
          <span>🏢</span>
          ТОО «QAZGOST AI»
        </div>
      </div>

      {/* ── Stats Row ──────────────────────────────────────── */}
      <div className="analyst-stats-row">
        <div className="analyst-stat-card" style={{ '--accent': 'linear-gradient(90deg, #f59e0b, #f97316)' }}>
          <div className="analyst-stat-icon">📥</div>
          <p className="analyst-stat-val">{stats.pending}</p>
          <p className="analyst-stat-label">Ожидают проверки</p>
        </div>
        <div className="analyst-stat-card" style={{ '--accent': 'linear-gradient(90deg, #3b82f6, #6366f1)' }}>
          <div className="analyst-stat-icon">🔍</div>
          <p className="analyst-stat-val">{stats.review}</p>
          <p className="analyst-stat-label">На проверке</p>
        </div>
        <div className="analyst-stat-card" style={{ '--accent': 'linear-gradient(90deg, #10b981, #06b6d4)' }}>
          <div className="analyst-stat-icon">✅</div>
          <p className="analyst-stat-val">{stats.done}</p>
          <p className="analyst-stat-label">Отчёты завершены</p>
        </div>
        <div className="analyst-stat-card" style={{ '--accent': 'linear-gradient(90deg, #8b5cf6, #ec4899)' }}>
          <div className="analyst-stat-icon">💰</div>
          <p className="analyst-stat-val">{(stats.totalBudget / 1000000).toFixed(1)} млн</p>
          <p className="analyst-stat-label">Общий бюджет (₸)</p>
        </div>
        <div className="analyst-stat-card" style={{ '--accent': 'linear-gradient(90deg, #ef4444, #f59e0b)' }}>
          <div className="analyst-stat-icon">📷</div>
          <p className="analyst-stat-val">{stats.totalPhotos}</p>
          <p className="analyst-stat-label">Фото с объектов</p>
        </div>
        <div className="analyst-stat-card" style={{ '--accent': 'linear-gradient(90deg, #06b6d4, #10b981)' }}>
          <div className="analyst-stat-icon">📎</div>
          <p className="analyst-stat-val">{stats.totalFiles}</p>
          <p className="analyst-stat-label">Документов и файлов</p>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="analyst-tabs">
        {TABS.map(t => (
          <button key={t.key} className={`analyst-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label} {t.count != null && <span style={{ marginLeft: 4, opacity: .7 }}>({t.count})</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        {activeTab === 'queue' && (
          <div style={{ display: 'flex', gap: 6 }}>
            {['all','pending','review','done'].map(s => (
              <button key={s} className={`analyst-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
                style={{ padding: '6px 12px', fontSize: '.78rem' }}>
                {s === 'all' ? 'Все' : s === 'pending' ? '⏳ Ожидают' : s === 'review' ? '🔍 Проверка' : '✅ Готовы'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Queue Tab ───────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div className="analyst-order-list">
          {filteredOrders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              Нет заявок с выбранным статусом
            </div>
          )}
          {filteredOrders.map(order => (
            <div key={order.id} className={`analyst-order-card status-${order.status}`} onClick={() => setSelectedOrder(order)}>
              <div className="analyst-order-head">
                <div>
                  <h4 className="analyst-order-title">{order.title}</h4>
                  <span className="analyst-order-id">{order.id} • {order.city}</span>
                </div>
                <span className={`analyst-order-status-pill ${order.status}`}>
                  {order.status === 'pending' ? '⏳ Ожидает' : order.status === 'review' ? '🔍 Проверка' : '✅ Готов'}
                </span>
              </div>
              <div className="analyst-order-meta">
                <span>👤 Заказчик: <strong>{order.customer}</strong></span>
                <span>🔧 Исполнитель: <strong>{order.executor}</strong></span>
                <span>💰 <strong>{order.budget}</strong></span>
                <span>📐 <strong>{order.area}</strong></span>
              </div>
              <div className="analyst-order-footer">
                <span className="analyst-files-count">
                  📎 {order.filesCount} файлов • 📷 {order.photosCount} фото
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="analyst-btn outline" onClick={e => { e.stopPropagation(); handleExportPDF(order); }}>
                    📄 PDF
                  </button>
                  <button className="analyst-btn primary" onClick={e => { e.stopPropagation(); setSelectedOrder(order); }}>
                    📋 Открыть
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Stats Tab ───────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
          <div className="analyst-section-block">
            <h4>📊 Объёмы по заказчикам</h4>
            {orders.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '.85rem' }}>
                <span style={{ color: '#e2e8f0' }}>{o.customer}</span>
                <span style={{ color: '#a78bfa', fontWeight: 800 }}>{o.budget}</span>
              </div>
            ))}
          </div>
          <div className="analyst-section-block">
            <h4>🏗️ Завершённые объекты</h4>
            {orders.map(o => (
              <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '.5rem 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '.85rem' }}>
                <span style={{ color: '#e2e8f0' }}>{o.title.substring(0, 40)}...</span>
                <span style={{ color: o.status === 'done' ? '#6ee7b7' : '#fbbf24', fontWeight: 800 }}>
                  {o.status === 'done' ? '✅ Готов' : '⏳ В работе'}
                </span>
              </div>
            ))}
          </div>
          <div className="analyst-section-block" style={{ gridColumn: '1 / -1' }}>
            <h4>📈 Сводная аналитика компании</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '.75rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#a78bfa' }}>{stats.total}</div>
                <div style={{ fontSize: '.78rem', color: '#94a3b8' }}>Всего проектов</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#6ee7b7' }}>{(stats.totalBudget / 1000000).toFixed(1)}M</div>
                <div style={{ fontSize: '.78rem', color: '#94a3b8' }}>Общий оборот (₸)</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>{stats.totalPhotos}</div>
                <div style={{ fontSize: '.78rem', color: '#94a3b8' }}>Фотоотчётов</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#60a5fa' }}>{stats.totalFiles}</div>
                <div style={{ fontSize: '.78rem', color: '#94a3b8' }}>Документов</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ───────────────────────────────────── */}
      {selectedOrder && (
        <div className="analyst-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="analyst-modal" onClick={e => e.stopPropagation()}>
            <div className="analyst-modal-head">
              <div>
                <h3>{selectedOrder.title}</h3>
                <span style={{ fontSize: '.78rem', color: '#a78bfa' }}>{selectedOrder.id} • {selectedOrder.city} • {selectedOrder.budget}</span>
              </div>
              <button className="analyst-modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="analyst-modal-body">
              {/* Info Block */}
              <div className="analyst-section-block">
                <h4>📋 Информация о заявке</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem', fontSize: '.85rem' }}>
                  <div><span style={{ color: '#94a3b8' }}>Заказчик:</span> <strong style={{ color: '#fff' }}>{selectedOrder.customer}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Исполнитель:</span> <strong style={{ color: '#fff' }}>{selectedOrder.executor}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Менеджер:</span> <strong style={{ color: '#fff' }}>{selectedOrder.manager}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Инженер:</span> <strong style={{ color: '#fff' }}>{selectedOrder.engineer}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Начало:</span> <strong style={{ color: '#fff' }}>{selectedOrder.startDate}</strong></div>
                  <div><span style={{ color: '#94a3b8' }}>Завершение:</span> <strong style={{ color: '#fff' }}>{selectedOrder.endDate}</strong></div>
                </div>
              </div>

              {/* Timeline */}
              <div className="analyst-section-block">
                <h4>🕐 Хронология работ (пошагово)</h4>
                <div className="analyst-timeline">
                  {selectedOrder.timeline.map((t, i) => (
                    <div key={i} className="analyst-step">
                      <div className="analyst-step-dot" style={{ '--dot-color': t.dotColor }}>
                        {i + 1}
                      </div>
                      <div className="analyst-step-content">
                        <div className="analyst-step-label">{t.step}</div>
                        <p className="analyst-step-text">{t.details}</p>
                        <div className="analyst-step-date">📅 {t.date} • 👤 {t.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Files */}
              <div className="analyst-section-block">
                <h4>📎 Приложенные документы ({selectedOrder.files.length})</h4>
                <div className="analyst-file-chips">
                  {selectedOrder.files.map((f, i) => (
                    <div key={i} className="analyst-file-chip" onClick={() => flash(`📥 Скачивание: ${f.name}`)}>
                      {f.type === 'pdf' ? '📄' : '📊'} {f.name}
                      <span style={{ color: '#64748b', fontSize: '.7rem' }}>({f.size})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Photos */}
              {selectedOrder.photos?.length > 0 && (
                <div className="analyst-section-block">
                  <h4>📷 Фотоматериалы ({selectedOrder.photos.length})</h4>
                  <div className="analyst-file-chips">
                    {selectedOrder.photos.map((p, i) => (
                      <div key={i} className="analyst-file-chip" style={{ background: 'rgba(16,185,129,.1)', borderColor: 'rgba(16,185,129,.3)', color: '#6ee7b7' }}>
                        🖼️ {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Zone */}
              <div className="analyst-upload-zone" onClick={() => flash('📤 Функция загрузки файлов активна')}>
                <div style={{ fontSize: '2rem', marginBottom: '.5rem' }}>📤</div>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '.92rem' }}>Прикрепить дополнительные файлы</div>
                <div style={{ color: '#64748b', fontSize: '.8rem', marginTop: '.25rem' }}>Договоры, акты, заключения, фотографии — перетащите или нажмите</div>
              </div>

              {/* Actions */}
              <div className="analyst-actions-row">
                <button className="analyst-btn pdf" onClick={() => handleExportPDF(selectedOrder)}>
                  📄 Скачать полный PDF-отчёт
                </button>
                {selectedOrder.status !== 'done' && (
                  <button className="analyst-btn primary" onClick={() => handleMarkDone(selectedOrder.id)}>
                    ✅ Сформировать отчёт и закрыть
                  </button>
                )}
                <button className="analyst-btn outline" onClick={() => setSelectedOrder(null)}>
                  Закрыть
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
