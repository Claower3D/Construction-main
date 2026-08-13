import React, { useState } from 'react';
import './EquipmentMarketplace.css';

export default function EquipmentMarketplace() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [category, setCategory] = useState('all');
  const [tariff, setTariff] = useState('shift');
  const [location, setLocation] = useState('all');
  const [radius, setRadius] = useState(50);
  const [freeToday, setFreeToday] = useState(false);
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

  const equipmentList = [
    {
      title: 'Экскаватор гусеничный Hitachi ZX240, 24 т, 1 м³, 6.7 м',
      price: '25 000',
      unit: 'смена (8ч)',
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ],
      availableToday: true
    },
    {
      title: 'Фронтальный погрузчик XCMG ZL50G, 5 т, 3.2 м',
      price: '16 000',
      unit: 'смена (8ч)',
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'delivery', label: 'Доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ],
      availableToday: true
    },
    {
      title: 'Каток дорожный XCMG XS143J, 14 т, 2.1 м',
      price: '18 000',
      unit: 'смена (10ч)',
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Караганда' }
      ],
      availableToday: false
    },
    {
      title: 'Грейдер XCMG GR215, 4.3 м',
      price: '22 000',
      unit: 'смена (8ч)',
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ],
      availableToday: true
    },
    {
      title: 'Генератор дизельный 100кВт, 100 кВт',
      price: '12 000',
      unit: 'смена (8ч)',
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ],
      availableToday: true
    }
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
          <span className="search-results-count">Найдено: {equipmentList.length}</span>
        </div>

        <div className="em-main-layout">
          <aside className="em-sidebar">
            <div className="filter-group">
              <label>📁 Категория</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="em-select">
                <option value="all">Все категории</option>
                <option value="earth">⛏️ Землеройная</option>
                <option value="lift">🏗️ Подъёмная</option>
                <option value="loader">🚜 Погрузчики</option>
                <option value="road">🛣️ Дорожная</option>
                <option value="concrete">🧱 Бетон/раствор</option>
                <option value="transport">🚚 Транспорт</option>
                <option value="drill">⛑️ Буровая</option>
                <option value="power">⚡ Энергетика</option>
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
                <option value="karaganda">Караганда</option>
                <option value="aktobe">Актобе</option>
                <option value="taraz">Тараз</option>
                <option value="pavlodar">Павлодар</option>
                <option value="semey">Семей</option>
                <option value="atyrau">Атырау</option>
                <option value="kostanay">Костанай</option>
                <option value="petropavlovsk">Петропавловск</option>
                <option value="uralsk">Уральск</option>
                <option value="oskemen">Усть-Каменогорск</option>
                <option value="kyzylorda">Кызылорда</option>
                <option value="aktau">Актау</option>
                <option value="turkestan">Туркестан</option>
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
              <label>💰 Цена за смена</label>
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
              Показать {equipmentList.length} объявлений
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
              {equipmentList.map((item, index) => (
                <div className="em-card" key={index}>
                  <div className="em-card-image">
                    <div className="em-card-placeholder">🚜</div>
                    {item.availableToday && <div className="em-badge success">✅ Доступна сегодня</div>}
                  </div>
                  
                  <div className="em-card-content">
                    <h3 className="em-card-title">{item.title}</h3>
                    <div className="em-card-price">₸ {item.price} <span>/ {item.unit}</span></div>
                    
                    <div className="em-card-tags">
                      {item.tags.map((tag, tIndex) => (
                        <span key={tIndex} className={`em-tag ${tag.type}`}>
                          {tag.icon ? `${tag.icon} ` : ''}{tag.label}
                        </span>
                      ))}
                    </div>

                    <div className="em-card-actions">
                      <button className="em-btn-primary">Забронировать</button>
                      <button className="em-btn-secondary">Сдаешь?</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
