import React, { useState } from 'react';
import './EquipmentMarketplace.css';

export default function EquipmentMarketplace() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [category, setCategory] = useState('Буровая');
  const [tariff, setTariff] = useState('hourly');
  const [location, setLocation] = useState('all');
  const [radius, setRadius] = useState(50);
  const [freeToday, setFreeToday] = useState(true);
  const [withOperator, setWithOperator] = useState(false);
  const [delivery, setDelivery] = useState('all');
  const [priceMax, setPriceMax] = useState(100);

  const topTabs = [
    { id: 'marketplace', label: '🏪 Маркетплейс' },
    { id: 'fleet', label: '🚜 Мой парк' },
    { id: 'ads', label: '📄 Мои объявления' },
    { id: 'rentals', label: '📦 Мои аренды' }
  ];

  const categoryChips = [
    { id: 'all', label: '🪄 Все категории', active: false },
    { id: 'earth', label: '⛏️ Землеройная', active: false },
    { id: 'lift', label: '🏗️ Подъёмная', active: false },
    { id: 'loader', label: '🚜 Погрузчики', active: false },
    { id: 'road', label: '🛣️ Дорожная', active: false },
    { id: 'concrete', label: '🧱 Бетон/раствор', active: false },
    { id: 'transport', label: '🚚 Транспорт', active: false },
    { id: 'drill', label: '⛑️ Буровая', active: true },
    { id: 'power', label: '⚡ Энергетика', active: false }
  ];

  return (
    <div className="equipment-marketplace-container">
      <div className="em-header">
        <h1 className="em-title">🚜 Техника</h1>
        <p className="em-subtitle">Маркетплейс аренды спецтехники</p>
        
        <div className="em-tabs">
          {topTabs.map(tab => (
            <button 
              key={tab.id}
              className={`em-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="em-content">
        <div className="em-search-bar">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Искать по категории, модели или характеристикам" />
          <span className="search-results-count">Найдено: 1</span>
        </div>

        <div className="em-main-layout">
          <aside className="em-sidebar">
            <div className="filter-group">
              <label>📁 Категория</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="em-select">
                <option value="Буровая">⛑️ Буровая</option>
                <option value="Землеройная">⛏️ Землеройная</option>
                <option value="Подъемная">🏗️ Подъёмная</option>
              </select>
            </div>

            <div className="filter-group">
              <label>📊 Тариф</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="tariff" checked={tariff === 'all'} onChange={() => setTariff('all')} />
                  <span className="custom-radio"></span> Все
                </label>
                <label className="radio-label">
                  <input type="radio" name="tariff" checked={tariff === 'hourly'} onChange={() => setTariff('hourly')} />
                  <span className="custom-radio"></span> 💧 Почасовая
                </label>
                <label className="radio-label">
                  <input type="radio" name="tariff" checked={tariff === 'shift'} onChange={() => setTariff('shift')} />
                  <span className="custom-radio"></span> 🔄 Смена
                </label>
                <label className="radio-label">
                  <input type="radio" name="tariff" checked={tariff === 'trip'} onChange={() => setTariff('trip')} />
                  <span className="custom-radio"></span> 🚚 Рейс
                </label>
              </div>
            </div>

            <div className="filter-group">
              <label>📍 Локация</label>
              <select value={location} onChange={e => setLocation(e.target.value)} className="em-select">
                <option value="all">Все города</option>
                <option value="almaty">Алматы</option>
                <option value="astana">Астана</option>
                <option value="shymkent">Шымкент</option>
              </select>
              
              <div className="slider-group">
                <div className="slider-labels">
                  <span>Радиус</span>
                  <span>{radius} км</span>
                </div>
                <input type="range" min="0" max="200" value={radius} onChange={e => setRadius(e.target.value)} className="em-slider" />
              </div>
            </div>

            <div className="filter-group checkbox-group">
              <label className="check-label">
                <input type="checkbox" checked={freeToday} onChange={e => setFreeToday(e.target.checked)} />
                <span className="custom-checkbox"></span> Только свободные сегодня
              </label>
              <label className="check-label">
                <input type="checkbox" checked={withOperator} onChange={e => setWithOperator(e.target.checked)} />
                <span className="custom-checkbox"></span> С оператором
              </label>
            </div>

            <div className="filter-group">
              <label>💰 Цена за ед.</label>
              <div className="slider-group">
                <div className="slider-labels">
                  <span>до</span>
                  <span>∞</span>
                </div>
                <input type="range" min="0" max="100" value={priceMax} onChange={e => setPriceMax(e.target.value)} className="em-slider" />
              </div>
            </div>

            <div className="filter-group">
              <label>🚚 Доставка</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input type="radio" name="delivery" checked={delivery === 'all'} onChange={() => setDelivery('all')} />
                  <span className="custom-radio"></span> Все варианты
                </label>
                <label className="radio-label">
                  <input type="radio" name="delivery" checked={delivery === 'yes'} onChange={() => setDelivery('yes')} />
                  <span className="custom-radio"></span> С доставкой
                </label>
                <label className="radio-label">
                  <input type="radio" name="delivery" checked={delivery === 'no'} onChange={() => setDelivery('no')} />
                  <span className="custom-radio"></span> Самовывоз
                </label>
              </div>
            </div>

            <button className="em-submit-btn">
              Показать 1 объявление
            </button>
          </aside>

          <div className="em-results">
            <div className="em-chips">
              {categoryChips.map(chip => (
                <button key={chip.id} className={`em-chip ${chip.active ? 'active' : ''}`}>
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="em-grid">
              <div className="em-card">
                <div className="em-card-image">
                  <div className="em-card-placeholder">🚜</div>
                  <div className="em-badge success">✅ Доступна сегодня</div>
                </div>
                
                <div className="em-card-content">
                  <h3 className="em-card-title">Ямобур БМ-302, 3 м, 500 мм</h3>
                  <div className="em-card-price">₸ 7 000 <span>₸/час</span></div>
                  
                  <div className="em-card-tags">
                    <span className="em-tag hourly">💧 Почасовая</span>
                    <span className="em-tag operator">👷 С оператором</span>
                    <span className="em-tag delivery">🚚 Платная доставка</span>
                    <span className="em-tag location">Шымкент</span>
                  </div>

                  <div className="em-card-actions">
                    <button className="em-btn-primary">Забронировать</button>
                    <button className="em-btn-secondary">Сдаешь?</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
