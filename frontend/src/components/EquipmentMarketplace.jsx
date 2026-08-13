import React, { useState, useMemo } from 'react';
import './EquipmentMarketplace.css';

export default function EquipmentMarketplace() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [tariff, setTariff] = useState('all'); // 'all' | 'hourly' | 'shift' | 'trip'
  const [location, setLocation] = useState('all');
  const [radius, setRadius] = useState(100);
  const [freeToday, setFreeToday] = useState(false);
  const [withOperator, setWithOperator] = useState(false);
  const [delivery, setDelivery] = useState('all'); // 'all' | 'yes' | 'no'
  const [priceMax, setPriceMax] = useState(100000);
  
  // Interactive Modal state
  const [bookingItem, setBookingItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const topTabs = [
    { id: 'marketplace', label: '🏪 Маркетплейс' },
    { id: 'fleet', label: '🚜 Мой парк' },
    { id: 'ads', label: '📄 Мои объявления' },
    { id: 'rentals', label: '📦 Мои аренды' }
  ];

  const categoryChips = [
    { id: 'all', label: '🪄 Все категории' },
    { id: 'earth', label: '⛏️ Землеройная' },
    { id: 'lift', label: '🏗️ Подъёмная' },
    { id: 'loader', label: '🚜 Погрузчики' },
    { id: 'road', label: '🛣️ Дорожная' },
    { id: 'concrete', label: '🧱 Бетон/раствор' },
    { id: 'transport', label: '🚚 Транспорт' },
    { id: 'drill', label: '⛑️ Буровая' },
    { id: 'power', label: '⚡ Энергетика' }
  ];

  const fullEquipmentList = [
    // Землеройная (earth)
    {
      id: 1,
      category: 'earth',
      title: 'Гусеничный экскаватор Hitachi ZX240, 24 т, 1 м³, 6.7 м',
      rawPrice: 25000,
      price: '25 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 2,
      category: 'earth',
      title: 'Колёсный экскаватор JCB JS160W, 17 т, 0.9 м³',
      rawPrice: 22000,
      price: '22 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 3,
      category: 'earth',
      title: 'Мини-экскаватор Kubota U-35, 3.5 т, ковш 0.15 м³',
      rawPrice: 12000,
      price: '12 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'shymkent',
      hasOperator: false,
      hasDelivery: false,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'delivery', label: 'Самовывоз', icon: '📦' },
        { type: 'location', label: 'Шымкент' }
      ]
    },
    {
      id: 4,
      category: 'earth',
      title: 'Тяжелый бульдозер CAT D6R, 20 т, отвал 3.8 м',
      rawPrice: 32000,
      price: '32 000',
      unit: 'смена (10ч)',
      tariffType: 'shift',
      city: 'karaganda',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Караганда' }
      ]
    },

    // Подъёмная (lift)
    {
      id: 5,
      category: 'lift',
      title: 'Автокран XCMG QY25K5, 25 т, стрела 39.5 м + гусек',
      rawPrice: 28000,
      price: '28 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Бесплатная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 6,
      category: 'lift',
      title: 'Автовышка телескопическая Hyundai HD78, 28 м, 300 кг',
      rawPrice: 18000,
      price: '18 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 7,
      category: 'lift',
      title: 'Башенный кран Liebherr 130 EC-B, 8 т, стрела 60 м',
      rawPrice: 55000,
      price: '55 000',
      unit: 'смена (12ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С крановщиком', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 8,
      category: 'lift',
      title: 'Кран-манипулятор КАМАЗ 65117 (КМУ 7 т, борт 12 т)',
      rawPrice: 20000,
      price: '20 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'shymkent',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С водитель-оператором', icon: '👷' },
        { type: 'location', label: 'Шымкент' }
      ]
    },

    // Погрузчики (loader)
    {
      id: 9,
      category: 'loader',
      title: 'Фронтальный погрузчик XCMG ZL50G, 5 т, 3.2 м³',
      rawPrice: 16000,
      price: '16 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 10,
      category: 'loader',
      title: 'Экскаватор-погрузчик JCB 3CX Super, равноколёсный',
      rawPrice: 18000,
      price: '18 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 11,
      category: 'loader',
      title: 'Мини-погрузчик Bobcat S530 + гидромолот / щётка',
      rawPrice: 14000,
      price: '14 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: false,
      hasDelivery: false,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'delivery', label: 'Самовывоз', icon: '📦' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 12,
      category: 'loader',
      title: 'Телескопический погрузчик Manitou MT 1840 (18 м, 4 т)',
      rawPrice: 24000,
      price: '24 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'karaganda',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Караганда' }
      ]
    },

    // Дорожная (road)
    {
      id: 13,
      category: 'road',
      title: 'Каток дорожный XCMG XS143J, 14 т, 2.1 м',
      rawPrice: 18000,
      price: '18 000',
      unit: 'смена (10ч)',
      tariffType: 'shift',
      city: 'karaganda',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Караганда' }
      ]
    },
    {
      id: 14,
      category: 'road',
      title: 'Грейдер XCMG GR215, 4.3 м, рыхлитель',
      rawPrice: 22000,
      price: '22 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    },
    {
      id: 15,
      category: 'road',
      title: 'Асфальтоукладчик Vogele Super 1800-3 (ширина 9 м)',
      rawPrice: 48000,
      price: '48 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С бригадой', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },

    // Бетон/раствор (concrete)
    {
      id: 16,
      category: 'concrete',
      title: 'Автобетононасос Putzmeister 38m, подача 160 м³/ч',
      rawPrice: 40000,
      price: '40 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С оператором', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 17,
      category: 'concrete',
      title: 'Автобетоносмеситель КАМАЗ 6520 (миксер 10 м³)',
      rawPrice: 15000,
      price: '15 000',
      unit: 'рейс',
      tariffType: 'trip',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Рейс', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    },

    // Транспорт (transport)
    {
      id: 18,
      category: 'transport',
      title: 'Самосвал Shacman F3000, 25 т, объём 20 м³',
      rawPrice: 18000,
      price: '18 000',
      unit: 'смена (10ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С водителем', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 19,
      category: 'transport',
      title: 'Трал низкорамный FAYMONVILLE (60 т, аппарели)',
      rawPrice: 42000,
      price: '42 000',
      unit: 'рейс',
      tariffType: 'trip',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Рейс', icon: '🚚' },
        { type: 'operator', label: 'С водителем', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },

    // Буровая (drill)
    {
      id: 20,
      category: 'drill',
      title: 'Ямобур / АБКМ на базе КАМАЗ 43114 (бурение до 12 м)',
      rawPrice: 28000,
      price: '28 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: true,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С бурильщиком', icon: '👷' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 21,
      category: 'drill',
      title: 'Буровая сваебойная установка Bauer BG 28 (сваи до 40 м)',
      rawPrice: 95000,
      price: '95 000',
      unit: 'смена (10ч)',
      tariffType: 'shift',
      city: 'astana',
      hasOperator: true,
      hasDelivery: true,
      availableToday: false,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'operator', label: 'С экипажем', icon: '👷' },
        { type: 'location', label: 'Астана' }
      ]
    },

    // Энергетика (power)
    {
      id: 22,
      category: 'power',
      title: 'Генератор дизельный SDMO 100 кВт, шумозащитный',
      rawPrice: 12000,
      price: '12 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'almaty',
      hasOperator: false,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'delivery', label: 'Платная доставка', icon: '🚚' },
        { type: 'location', label: 'Алматы' }
      ]
    },
    {
      id: 23,
      category: 'power',
      title: 'Компрессор дизельный Atlas Copco XAS 97 (5.3 м³/мин)',
      rawPrice: 14000,
      price: '14 000',
      unit: 'смена (8ч)',
      tariffType: 'shift',
      city: 'astana',
      hasOperator: false,
      hasDelivery: true,
      availableToday: true,
      tags: [
        { type: 'hourly', label: 'Смена', icon: '🔄' },
        { type: 'delivery', label: 'Доставка', icon: '🚚' },
        { type: 'location', label: 'Астана' }
      ]
    }
  ];

  // Real-time Dynamic Filtering Engine
  const filteredEquipment = useMemo(() => {
    return fullEquipmentList.filter(item => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesCategory = item.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory) return false;
      }

      // 2. Category Filter
      if (category !== 'all' && item.category !== category) {
        return false;
      }

      // 3. Tariff Filter
      if (tariff !== 'all' && item.tariffType !== tariff) {
        return false;
      }

      // 4. Location Filter
      if (location !== 'all' && item.city !== location) {
        return false;
      }

      // 5. Available Today Checkbox
      if (freeToday && !item.availableToday) {
        return false;
      }

      // 6. With Operator Checkbox
      if (withOperator && !item.hasOperator) {
        return false;
      }

      // 7. Delivery Radio Option
      if (delivery === 'yes' && !item.hasDelivery) return false;
      if (delivery === 'no' && item.hasDelivery) return false;

      // 8. Price Slider Filter
      if (item.rawPrice > priceMax) {
        return false;
      }

      return true;
    });
  }, [searchQuery, category, tariff, location, freeToday, withOperator, delivery, priceMax]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="equipment-marketplace-container">
      {/* Toast */}
      {toastMessage && (
        <div className="em-toast">
          {toastMessage}
        </div>
      )}

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
        {/* Search Bar */}
        <div className="em-search-bar">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Искать по категории, модели или характеристикам (например: Hitachi, Погрузчик, 25т)..." 
          />
          <span className="search-results-count">Найдено: {filteredEquipment.length}</span>
        </div>

        <div className="em-main-layout">
          {/* Sidebar Controls */}
          <aside className="em-sidebar">
            <div className="filter-group">
              <label>📁 Категория</label>
              <select 
                value={category} 
                onChange={e => setCategory(e.target.value)} 
                className="em-select"
              >
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
              </select>
              
              <div className="slider-group">
                <div className="slider-labels">
                  <span>Радиус поиска</span>
                  <span>{radius} км</span>
                </div>
                <input type="range" min="10" max="300" value={radius} onChange={e => setRadius(e.target.value)} className="em-slider" />
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
              <label>💰 Цена за смену</label>
              <div className="slider-group">
                <div className="slider-labels">
                  <span>до</span>
                  <span>{priceMax >= 100000 ? 'Без лимита' : `${priceMax.toLocaleString()} ₸`}</span>
                </div>
                <input type="range" min="10000" max="100000" step="5000" value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className="em-slider" />
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

            <button 
              className="em-submit-btn"
              onClick={() => showToast(`🔍 Найдено объявлений: ${filteredEquipment.length}`)}
            >
              Показать {filteredEquipment.length} объявлений
            </button>
          </aside>

          {/* Results Grid & Chips */}
          <div className="em-results">
            <div className="em-chips">
              {categoryChips.map(chip => (
                <button 
                  key={chip.id} 
                  className={`em-chip ${category === chip.id ? 'active' : ''}`}
                  onClick={() => setCategory(chip.id)}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {filteredEquipment.length === 0 ? (
              <div className="em-empty-state">
                <span className="empty-icon">🚜</span>
                <h3>По вашему запросу техника не найдена</h3>
                <p>Попробуйте ослабить фильтры или изменить категорию поиска.</p>
                <button 
                  className="em-btn-secondary"
                  onClick={() => {
                    setCategory('all');
                    setSearchQuery('');
                    setTariff('all');
                    setLocation('all');
                    setFreeToday(false);
                    setWithOperator(false);
                    setDelivery('all');
                    setPriceMax(100000);
                  }}
                >
                  🔄 Сбросить все фильтры
                </button>
              </div>
            ) : (
              <div className="em-grid">
                {filteredEquipment.map((item) => (
                  <div className="em-card" key={item.id}>
                    <div className="em-card-image">
                      <div className="em-card-placeholder">
                        {item.category === 'earth' && '⛏️'}
                        {item.category === 'lift' && '🏗️'}
                        {item.category === 'loader' && '🚜'}
                        {item.category === 'road' && '🛣️'}
                        {item.category === 'concrete' && '🧱'}
                        {item.category === 'transport' && '🚚'}
                        {item.category === 'drill' && '⛑️'}
                        {item.category === 'power' && '⚡'}
                      </div>
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
                        <button 
                          className="em-btn-primary"
                          onClick={() => {
                            setBookingItem(item);
                          }}
                        >
                          Забронировать
                        </button>
                        <button 
                          className="em-btn-secondary"
                          onClick={() => showToast('📩 Запрос владельцу отправлен!')}
                        >
                          Сдаешь?
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingItem && (
        <div className="em-modal-overlay" onClick={() => setBookingItem(null)}>
          <div className="em-modal-box" onClick={e => e.stopPropagation()}>
            <button className="em-modal-close" onClick={() => setBookingItem(null)}>✕</button>
            <h2>🚜 Бронирование техники</h2>
            <h4 style={{ color: '#c084fc', margin: '0.5rem 0 1rem 0' }}>{bookingItem.title}</h4>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div>Стоимость: <strong>₸ {bookingItem.price} / {bookingItem.unit}</strong></div>
              <div>Город: <strong>{bookingItem.tags.find(t => t.type === 'location')?.label}</strong></div>
            </div>

            <div className="em-form-group mb-3">
              <label>Дата начала аренды:</label>
              <input type="date" className="em-input" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>

            <div className="em-form-group mb-3">
              <label>Количество смен / дней:</label>
              <input type="number" min="1" defaultValue="1" className="em-input" />
            </div>

            <button 
              className="em-submit-btn w-100 mt-3"
              onClick={() => {
                setBookingItem(null);
                showToast('🎉 Заявка на бронирование успешно отправлена!');
              }}
            >
              ✅ Подтвердить бронирование
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
