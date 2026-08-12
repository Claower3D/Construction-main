import React, { useState } from 'react';

export default function MapViewerModule() {
  const [selectedCity, setSelectedCity] = useState('все');

  const objects = [
    { id: 1, name: 'ЖК «Grand Almaty» (Блок А/Б)', city: 'Алматы', address: 'пр. Аль-Фараби 140', status: 'Монолитные работы', stage: '65%' },
    { id: 2, name: 'Бизнес-центр «Esentai Tower 2»', city: 'Алматы', address: 'пр. Аль-Фараби 77', status: 'Отделочные работы', stage: '85%' },
    { id: 3, name: 'Коттеджный городок «Astana Hills»', city: 'Астана', address: 'район Есиль', status: 'Фундаментный цикл', stage: '25%' },
    { id: 4, name: 'Торговый центр «Shymkent Plaza 2»', city: 'Шымкент', address: 'ул. Тауке хана', status: 'Фасадные работы', stage: '90%' },
  ];

  const filtered = selectedCity === 'все' ? objects : objects.filter((o) => o.city.toLowerCase() === selectedCity.toLowerCase());

  return (
    <div className="fullpage-card-box">
      <h2 className="fullpage-heading">🗺️ Интерактивная карта строящихся объектов Казахстана</h2>
      <p className="fullpage-sub">Геолокация строек, текущий прогресс выполнения работ и технадзор по регионам РК.</p>

      <div className="admin-controls-row" style={{ marginTop: '1.25rem' }}>
        <div className="type-toggle-group">
          <button className={`type-btn ${selectedCity === 'все' ? 'active' : ''}`} onClick={() => setSelectedCity('все')}>Все города</button>
          <button className={`type-btn ${selectedCity === 'Алматы' ? 'active' : ''}`} onClick={() => setSelectedCity('Алматы')}>Алматы</button>
          <button className={`type-btn ${selectedCity === 'Астана' ? 'active' : ''}`} onClick={() => setSelectedCity('Астана')}>Астана</button>
          <button className={`type-btn ${selectedCity === 'Шымкент' ? 'active' : ''}`} onClick={() => setSelectedCity('Шымкент')}>Шымкент</button>
        </div>
      </div>

      <div className="map-view-placeholder" style={{ background: '#0f172a', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '16px', padding: '2rem', textAlign: 'center', margin: '1.25rem 0' }}>
        <span style={{ fontSize: '3rem' }}>🗺️</span>
        <h3 style={{ color: '#fff', margin: '0.5rem 0' }}>Интерактивный картографический модуль QazGost Map 2.0</h3>
        <p style={{ color: '#94a3b8' }}>Отображено {filtered.length} активных объектов технического контроля</p>
      </div>

      <div className="orders-full-grid">
        {filtered.map((obj) => (
          <div className="order-item-card" key={obj.id} style={{ padding: '1.25rem' }}>
            <div className="order-head">
              <strong>{obj.name}</strong>
              <span className="order-price">{obj.stage}</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.5rem 0' }}>📍 {obj.city}, {obj.address}</p>
            <div className="status-indicator-badge online">Текущий этап: {obj.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
