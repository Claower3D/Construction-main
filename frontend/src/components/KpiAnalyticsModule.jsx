import React from 'react';

export default function KpiAnalyticsModule() {
  return (
    <div className="fullpage-card-box">
      <h2 className="fullpage-heading">📊 Дашборд KPI и Аналитика Эффективности</h2>
      <p className="fullpage-sub">Ключевые финансовые показатели, скорость закрытия актов КС-2/3 и индексы качества.</p>

      <div className="kpi-metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', margin: '1.5rem 0' }}>
        <div className="result-card-glow">
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Средняя экономия по сметам</div>
          <div className="big-price" style={{ color: '#10b981' }}>14.2%</div>
          <p style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>За счет AI-верификации цен</p>
        </div>
        <div className="result-card-glow">
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Успешные сделки Эскроу</div>
          <div className="big-price" style={{ color: '#38bdf8' }}>99.4%</div>
          <p style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Без вызова арбитража</p>
        </div>
        <div className="result-card-glow">
          <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Среднее время выезда ИТН</div>
          <div className="big-price" style={{ color: '#f59e0b' }}>1.8 часа</div>
          <p style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Включая Астану и Алматы</p>
        </div>
      </div>
    </div>
  );
}
