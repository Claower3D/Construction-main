import React, { useState } from 'react';

export default function DisputeResolutionModule() {
  const [disputes, setDisputes] = useState([
    { id: 'DSP-881', title: 'Претензия по срокам завершения монолитных работ', customer: 'Арман К.', contractor: 'ИП «СтройМастер»', amount: '2 400 000 ₸', status: 'arbitration' },
    { id: 'DSP-882', title: 'Несоответствие марки бетона в фундаменте', customer: 'ТОО «Алматы Бизнес»', contractor: 'ТОО «СпецБетон»', amount: '5 800 000 ₸', status: 'resolved' },
  ]);

  const [claimText, setClaimText] = useState('');

  const handleCreateClaim = (e) => {
    e.preventDefault();
    if (!claimText.trim()) return;
    const newClaim = {
      id: `DSP-${Math.floor(100 + Math.random() * 900)}`,
      title: claimText,
      customer: 'Текущий Заказчик',
      contractor: 'Исполнитель по Договору',
      amount: '1 500 000 ₸',
      status: 'arbitration',
    };
    setDisputes([newClaim, ...disputes]);
    setClaimText('');
    alert('🎉 Арбитражная претензия успешно подана и передана Юристу QazGost AI!');
  };

  return (
    <div className="fullpage-card-box">
      <h2 className="fullpage-heading">⚖️ Арбитраж и Разрешение споров</h2>
      <p className="fullpage-sub">Электронная подача претензий, независимая экспертиза СНиП РК и урегулирование Эскроу.</p>

      <form onSubmit={handleCreateClaim} style={{ margin: '1.5rem 0' }}>
        <label style={{ color: '#cbd5e1', fontWeight: 'bold' }}>Подать новую арбитражную претензию:</label>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input
            type="text"
            className="admin-search-input"
            placeholder="Опишите суть несоответствия или причину спора..."
            value={claimText}
            onChange={(e) => setClaimText(e.target.value)}
          />
          <button type="submit" className="admin-primary-btn" style={{ whiteSpace: 'nowrap' }}>⚖️ Подать претензию</button>
        </div>
      </form>

      <div className="orders-full-grid">
        {disputes.map((d) => (
          <div className="order-item-card" key={d.id} style={{ padding: '1.25rem' }}>
            <div className="order-head">
              <strong>{d.id}: {d.title}</strong>
              <span className="order-price">{d.amount}</span>
            </div>
            <div className="order-meta" style={{ margin: '0.75rem 0' }}>
              <span>👤 Заказчик: {d.customer}</span>
              <span>🔧 Подрядчик: {d.contractor}</span>
            </div>
            <div className="status-indicator-badge online" style={{ background: d.status === 'resolved' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: d.status === 'resolved' ? '#10b981' : '#f59e0b' }}>
              {d.status === 'resolved' ? '✅ Спору вынесено решение (Урегулировано)' : '⏳ На рассмотрении Независимого Эксперта'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
