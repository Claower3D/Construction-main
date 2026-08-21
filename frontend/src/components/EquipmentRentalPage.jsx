import React, { useState, useMemo } from 'react';
import './EquipmentRentalPage.css';

const EQUIPMENT = [
  { id: 'eq-1', cat: 'excavators', title: 'Экскаватор-погрузчик JCB 3CX', supplier: 'ТОО «АренаТех»', city: 'Алматы', price: 45000, unit: 'смена', power: '92 л.с.', weight: '8.5 т', image: 'https://images.unsplash.com/photo-1580901368919-7738efb0f228?w=500&q=80', badge: 'ПОПУЛЯРНЫЙ', inStock: 4 },
  { id: 'eq-2', cat: 'excavators', title: 'Экскаватор гусеничный Hyundai R220LC-9S', supplier: 'ТОО «КазСпецТехника»', city: 'Астана', price: 85000, unit: 'смена', power: '151 л.с.', weight: '22.5 т', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80', badge: '', inStock: 2 },
  { id: 'eq-3', cat: 'cranes', title: 'Автокран Ивановец КС-45717К-3 (25т)', supplier: 'ТОО «КранСервис»', city: 'Алматы', price: 120000, unit: 'смена', power: '240 л.с.', weight: '21.2 т', image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=500&q=80', badge: 'ТОП', inStock: 3 },
  { id: 'eq-4', cat: 'cranes', title: 'Башенный кран Liebherr 110 EC-B 6', supplier: 'ТОО «МегаКран»', city: 'Астана', price: 350000, unit: 'месяц', power: '22 кВт', weight: '5.8 т (стрела)', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=500&q=80', badge: 'ПРЕМИУМ', inStock: 1 },
  { id: 'eq-5', cat: 'trucks', title: 'Самосвал КАМАЗ 6520 (20т)', supplier: 'ТОО «ТрансСтрой»', city: 'Караганда', price: 55000, unit: 'смена', power: '320 л.с.', weight: '12.5 т', image: 'https://images.unsplash.com/photo-1597423244036-ef5020e83f3c?w=500&q=80', badge: '', inStock: 8 },
  { id: 'eq-6', cat: 'trucks', title: 'Миксер бетоновоз MAN TGS 7м³', supplier: 'ТОО «БетонМикс»', city: 'Алматы', price: 65000, unit: 'рейс', power: '400 л.с.', weight: '14.2 т', image: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=500&q=80', badge: '', inStock: 5 },
  { id: 'eq-7', cat: 'loaders', title: 'Фронтальный погрузчик SDLG L956F', supplier: 'ТОО «АренаТех»', city: 'Шымкент', price: 40000, unit: 'смена', power: '162 л.с.', weight: '17 т', image: 'https://images.unsplash.com/photo-1599059813005-11265ba4b4ce?w=500&q=80', badge: '', inStock: 3 },
  { id: 'eq-8', cat: 'loaders', title: 'Мини-погрузчик Bobcat S650', supplier: 'ТОО «КазСпецТехника»', city: 'Алматы', price: 35000, unit: 'смена', power: '74 л.с.', weight: '3.6 т', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', badge: 'ХИТ', inStock: 6 },
  { id: 'eq-9', cat: 'concrete', title: 'Бетононасос стационарный Putzmeister BSA 1409', supplier: 'ТОО «БетонМикс»', city: 'Астана', price: 95000, unit: 'смена', power: '129 л.с.', weight: '5.2 т', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80', badge: '', inStock: 2 },
  { id: 'eq-10', cat: 'concrete', title: 'Виброплита Wacker Neuson DPU 6555', supplier: 'ТОО «РентСтрой»', city: 'Алматы', price: 12000, unit: 'сутки', power: '8.6 л.с.', weight: '440 кг', image: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=500&q=80', badge: '', inStock: 12 },
  { id: 'eq-11', cat: 'scaffolding', title: 'Леса строительные рамные ЛРСП-40 (комплект 100м²)', supplier: 'ТОО «Каркас Плюс»', city: 'Алматы', price: 85000, unit: 'месяц', power: '—', weight: '2.8 т', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80', badge: '', inStock: 15 },
  { id: 'eq-12', cat: 'scaffolding', title: 'Опалубка стеновая PERI TRIO (комплект 50м²)', supplier: 'ТОО «ОпалубкаСервис»', city: 'Астана', price: 180000, unit: 'месяц', power: '—', weight: '4.5 т', image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=500&q=80', badge: 'ПРЕМИУМ', inStock: 3 },
  { id: 'eq-13', cat: 'generators', title: 'Дизельный генератор Atlas Copco QAS 80 (65 кВт)', supplier: 'ТОО «ЭнергоАренда»', city: 'Алматы', price: 28000, unit: 'сутки', power: '65 кВт', weight: '1.7 т', image: 'https://images.unsplash.com/photo-1590496793929-36417d3117de?w=500&q=80', badge: '', inStock: 7 },
  { id: 'eq-14', cat: 'generators', title: 'Компрессор винтовой Atlas Copco XAS 97 (5.3 м³/мин)', supplier: 'ТОО «ЭнергоАренда»', city: 'Караганда', price: 22000, unit: 'сутки', power: '49 кВт', weight: '1.2 т', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&q=80', badge: '', inStock: 4 },
];

const CATEGORIES = [
  { id: 'all', label: '🪄 Вся техника' },
  { id: 'excavators', label: '🏗️ Экскаваторы' },
  { id: 'cranes', label: '🏗️ Краны' },
  { id: 'trucks', label: '🚛 Самосвалы и миксеры' },
  { id: 'loaders', label: '🚜 Погрузчики' },
  { id: 'concrete', label: '🧱 Бетонное оборудование' },
  { id: 'scaffolding', label: '🔩 Леса и опалубка' },
  { id: 'generators', label: '⚡ Генераторы и компрессоры' },
];

export default function EquipmentRentalPage({ onBack }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const filtered = useMemo(() => {
    return EQUIPMENT.filter(e => {
      if (selectedCategory !== 'all' && e.cat !== selectedCategory) return false;
      if (selectedCity !== 'all' && e.city !== selectedCity) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !e.supplier.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedCity, searchQuery]);

  const addToCart = (item) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, days: c.days + 1 } : c));
    } else {
      setCart([...cart, { ...item, days: 1 }]);
    }
    flash('🚜 ' + item.title + ' добавлено в заявку');
  };

  const removeFromCart = (id) => setCart(cart.filter(c => c.id !== id));
  const cartTotal = cart.reduce((s, c) => s + c.price * c.days, 0);

  return (
    <div className="eqp-wrapper">
      {toast && <div className="eqp-toast">{toast}</div>}

      {/* Hero */}
      <div className="eqp-hero">
        <div>
          <h2 className="eqp-hero-title">
            <span>🚜</span> Аренда строительной техники
          </h2>
          <p className="eqp-hero-desc">
            Экскаваторы, краны, самосвалы, погрузчики, бетононасосы, генераторы и опалубка. 
            Прямая аренда от компаний Казахстана — без посредников.
          </p>
        </div>
        <div className="eqp-hero-stats">
          <div className="eqp-hero-stat"><strong>{EQUIPMENT.length}</strong><span>единиц техники</span></div>
          <div className="eqp-hero-stat"><strong>24/7</strong><span>подача на объект</span></div>
          <div className="eqp-hero-stat"><strong>100%</strong><span>страховка ТС</span></div>
        </div>
      </div>

      {/* Categories */}
      <div className="eqp-cats">
        {CATEGORIES.map(c => (
          <button key={c.id}
            className={`eqp-cat-btn ${selectedCategory === c.id ? 'active' : ''}`}
            onClick={() => setSelectedCategory(c.id)}
          >{c.label}</button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="eqp-filters">
        <input className="eqp-search" placeholder="🔎 Поиск техники..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        <select className="eqp-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
          <option value="all">📍 Все города</option>
          <option value="Алматы">Алматы</option>
          <option value="Астана">Астана</option>
          <option value="Караганда">Караганда</option>
          <option value="Шымкент">Шымкент</option>
        </select>
        <button className="eqp-cart-btn" onClick={() => setIsCartOpen(true)}>
          🛒 Заявка {cart.length > 0 && <span className="eqp-cart-badge">{cart.length}</span>}
        </button>
      </div>

      {/* Grid */}
      <div className="eqp-grid">
        {filtered.map(item => (
          <div key={item.id} className="eqp-card">
            <div className="eqp-card-img">
              <img src={item.image} alt={item.title} />
              {item.badge && <span className="eqp-badge">{item.badge}</span>}
            </div>
            <div className="eqp-card-body">
              <h4 className="eqp-card-title">{item.title}</h4>
              <div className="eqp-card-supplier">{item.supplier} • {item.city}</div>
              <div className="eqp-card-specs">
                <span>⚙️ {item.power}</span>
                <span>⚖️ {item.weight}</span>
                <span>📦 {item.inStock} ед.</span>
              </div>
              <div className="eqp-card-bottom">
                <div className="eqp-price">
                  <strong>{item.price.toLocaleString()} ₸</strong>
                  <span>/ {item.unit}</span>
                </div>
                <button className="eqp-add-btn" onClick={() => addToCart(item)}>
                  + В заявку
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            Техника не найдена. Попробуйте другие фильтры.
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="eqp-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="eqp-drawer" onClick={e => e.stopPropagation()}>
            <div className="eqp-drawer-head">
              <h3>🛒 Заявка на аренду ({cart.length})</h3>
              <button onClick={() => setIsCartOpen(false)} className="eqp-close">✕</button>
            </div>
            <div className="eqp-drawer-body">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚜</div>
                  <strong>Заявка пуста</strong>
                  <p style={{ fontSize: '.85rem', marginTop: '.5rem' }}>Выберите технику из каталога</p>
                </div>
              ) : cart.map(item => (
                <div key={item.id} className="eqp-cart-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: '.88rem' }}>{item.title}</div>
                    <div style={{ fontSize: '.78rem', color: '#94a3b8' }}>{item.supplier} • {item.city}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, days: Math.max(1, c.days - 1)} : c))}
                        style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>−</button>
                      <span style={{ fontWeight: 800, color: '#fff' }}>{item.days}</span>
                      <button onClick={() => setCart(cart.map(c => c.id === item.id ? {...c, days: c.days + 1} : c))}
                        style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#6ee7b7', cursor: 'pointer', fontWeight: 800 }}>+</button>
                      <span style={{ fontSize: '.72rem', color: '#64748b' }}>{item.unit}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#fbbf24' }}>{(item.price * item.days).toLocaleString()} ₸</div>
                    <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '.8rem', marginTop: 4 }}>Удалить</button>
                  </div>
                </div>
              ))}
            </div>
            {cart.length > 0 && (
              <div className="eqp-drawer-footer">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '.95rem' }}>
                  <span style={{ color: '#cbd5e1' }}>Итого к оплате:</span>
                  <strong style={{ color: '#10b981', fontSize: '1.15rem' }}>{cartTotal.toLocaleString()} ₸</strong>
                </div>
                <button className="eqp-checkout-btn" onClick={() => { flash('✅ Заявка на аренду отправлена! Менеджер свяжется в течение 15 минут.'); setCart([]); setIsCartOpen(false); }}>
                  ⚡ Отправить заявку на аренду
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
