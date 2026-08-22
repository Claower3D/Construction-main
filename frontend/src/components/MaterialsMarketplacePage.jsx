import React, { useState, useMemo, useEffect } from 'react';
import { getBalanceKZT, freezeEscrow, topupBalance } from '../services/walletEngine';
import { createPlatformOrder } from '../services/orderSyncService';
import './MaterialsMarketplacePage.css';

export default function MaterialsMarketplacePage({ onBack, hideHeader = false }) {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'ai_calc' | 'rfq' | 'my_orders'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [priceMax, setPriceMax] = useState(50000);
  const [radius, setRadius] = useState(100);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [gostOnly, setGostOnly] = useState(false);
  const [wholesaleOnly, setWholesaleOnly] = useState(false);
  const [deliveryType, setDeliveryType] = useState('all'); // 'all' | 'delivery' | 'pickup'

  // Quantities in card selectors: { [productId]: count }
  const [quantities, setQuantities] = useState({});

  // Cart State: [ { ...product, count: number } ]
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModal, setIsCheckoutModal] = useState(false);
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutPhone, setCheckoutPhone] = useState('');
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('kaspi');
  const [walletBalance, setWalletBalance] = useState(() => getBalanceKZT());
  
  useEffect(() => {
    if (isCheckoutModal) {
      setWalletBalance(getBalanceKZT());
    }
  }, [isCheckoutModal]);
  const [toastMessage, setToastMessage] = useState(null);

  // AI BOM Calculator State
  const [calcArea, setCalcArea] = useState(100);
  const [calcType, setCalcType] = useState('walls'); // 'walls' | 'foundation' | 'screed' | 'roof'
  const [aiBOMResult, setAiBOMResult] = useState(null);

  // RFQ Form State
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqVolume, setRfqVolume] = useState('');
  const [rfqCity, setRfqCity] = useState('Алматы');
  const [rfqPhone, setRfqPhone] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categories = [
    { id: 'all', label: '🪄 Все материалы' },
    { id: 'cement', label: '🧱 Цемент и смеси' },
    { id: 'blocks', label: '🧱 Кирпич и блоки' },
    { id: 'metal', label: '🔩 Арматура и металл' },
    { id: 'bulk', label: '🏗️ Песок, щебень, бетон' },
    { id: 'insulation', label: '💡 Тепло- и гидроизоляция' },
    { id: 'roofing', label: '🏠 Кровля и фасад' },
    { id: 'drywall', label: '🎨 Гипсокартон и отделка' },
    { id: 'electric', label: '⚡ Электрика и кабель' },
    { id: 'plumbing', label: '🚿 Сантехника и трубы' }
  ];

  const products = [
    // 1. Цемент и смеси
    {
      id: 'mat-1',
      category: 'cement',
      title: 'Портландцемент М500 Д0 «Казцемент» (мешок 50 кг)',
      supplier: 'ТОО «КазЦемент Индастри»',
      city: 'Алматы',
      price: 2450,
      unit: 'мешок',
      weightKg: 50,
      gost: 'ГОСТ 31108-2016',
      inStock: 3400,
      wholesaleNote: 'Опт от 50 мешков: 2 200 ₸',
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&q=80',
      badge: 'ХИТ ПРОДАЖ'
    },
    {
      id: 'mat-2',
      category: 'cement',
      title: 'Штукатурка гипсовая Knauf Rotband (30 кг)',
      supplier: 'ТОО «Кнауф Гипс Казахстан»',
      city: 'Астана',
      price: 3650,
      unit: 'мешок',
      weightKg: 30,
      gost: 'СТ РК ГОСТ 31377',
      inStock: 1200,
      wholesaleNote: 'Опт от 40 шт: 3 350 ₸',
      image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=500&q=80',
      badge: 'ПРЕМИУМ'
    },
    {
      id: 'mat-3',
      category: 'cement',
      title: 'Клей для плитки и керамогранита AlinEX «Set 300» (25 кг)',
      supplier: 'AlinEX / ТОО «Alina Group»',
      city: 'Алматы',
      price: 2850,
      unit: 'мешок',
      weightKg: 25,
      gost: 'ГОСТ РК 2026',
      inStock: 2100,
      wholesaleNote: 'Опт от 100 шт: 2 550 ₸',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&q=80',
      badge: 'В НАЛИЧИИ'
    },

    // 2. Кирпич и блоки
    {
      id: 'mat-4',
      category: 'blocks',
      title: 'Газоблок автоклавный «Экотон» D500 (600×300×200 мм)',
      supplier: 'ТОО «Экотон-Батыс»',
      city: 'Астана',
      price: 980,
      unit: 'шт',
      weightKg: 22,
      gost: 'ГОСТ 31360-2007',
      inStock: 8500,
      wholesaleNote: 'Опт от 10 поддонов (400 шт): 910 ₸',
      image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=500&q=80',
      badge: 'ТОП ВЫБОР'
    },
    {
      id: 'mat-5',
      category: 'blocks',
      title: 'Кирпич керамический полнотелый М-125 (250×120×65 мм)',
      supplier: 'ТОО «Алматинский Кирпичный Завод №1»',
      city: 'Алматы',
      price: 85,
      unit: 'шт',
      weightKg: 3.5,
      gost: 'ГОСТ 530-2012',
      inStock: 45000,
      wholesaleNote: 'Опт от 5000 шт: 76 ₸',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80',
      badge: 'ГОСТ РК'
    },

    // 3. Металл и арматура
    {
      id: 'mat-6',
      category: 'metal',
      title: 'Арматура стальная рифленая А500С Ø12 мм (длина 11.7 м)',
      supplier: 'ТОО «АрселорМиттал Темиртау Сбыт»',
      city: 'Караганда',
      price: 365000,
      unit: 'тонна',
      weightKg: 1000,
      gost: 'ГОСТ 34028-2016',
      inStock: 120,
      wholesaleNote: 'Опт от 5 тонн: 348 000 ₸',
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&q=80',
      badge: 'СЕРТИФИЦИРОВАНО'
    },
    {
      id: 'mat-7',
      category: 'metal',
      title: 'Труба профильная 40×40×2.0 мм (хлыст 6 м)',
      supplier: 'ТОО «КазМетСервис»',
      city: 'Шымкент',
      price: 5400,
      unit: 'хлыст (6м)',
      weightKg: 14.5,
      gost: 'ГОСТ 8639-82',
      inStock: 800,
      wholesaleNote: 'Опт от 50 хлыстов: 4 950 ₸',
      image: 'https://images.unsplash.com/photo-1531834685032-c34bf0d84c77?w=500&q=80',
      badge: 'В НАЛИЧИИ'
    },

    // 4. Бетон и сыпучие
    {
      id: 'mat-8',
      category: 'bulk',
      title: 'Товарный бетон марки М-350 (В25) с доставкой миксером',
      supplier: 'Бетонный завод ТОО «СтройМонолит KZ»',
      city: 'Алматы',
      price: 24500,
      unit: 'м³',
      weightKg: 2400,
      gost: 'СТ РК ГОСТ 7473-2010',
      inStock: 500,
      wholesaleNote: 'Опт от 50 м³: 22 800 ₸',
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=500&q=80',
      badge: 'БЫСТРАЯ ДОСТАВКА'
    },
    {
      id: 'mat-9',
      category: 'bulk',
      title: 'Песок речной мытый фракции 0-2 мм (самосвал 20 т)',
      supplier: 'ТОО «Карьер НерудТранс»',
      city: 'Астана',
      price: 68000,
      unit: 'машина 20т',
      weightKg: 20000,
      gost: 'ГОСТ 8736-2014',
      inStock: 40,
      wholesaleNote: 'От 3 машин: 62 000 ₸',
      image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=500&q=80',
      badge: 'КАРЬЕР'
    },

    // 5. Тепло- и гидроизоляция
    {
      id: 'mat-10',
      category: 'insulation',
      title: 'Утеплитель минераловатный ТехноНИКОЛЬ Роклайт (1200×600×50 мм)',
      supplier: 'ТОО «ТехноНИКОЛЬ Казахстан»',
      city: 'Алматы',
      price: 8900,
      unit: 'упаковка (5.76 м²)',
      weightKg: 12,
      gost: 'ГОСТ 9573-2012',
      inStock: 650,
      wholesaleNote: 'Опт от 50 упаковок: 8 100 ₸',
      image: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=500&q=80',
      badge: 'ЭНЕРГОЭФФЕКТИВНОСТЬ'
    },
    {
      id: 'mat-11',
      category: 'insulation',
      title: 'Экструдированный пенополистирол ПЕНОПЛЭКС Комфорт 50 мм',
      supplier: 'ТОО «Пеноплэкс РК»',
      city: 'Шымкент',
      price: 11500,
      unit: 'упаковка (4.85 м²)',
      weightKg: 9,
      gost: 'ГОСТ 32310-2012',
      inStock: 420,
      wholesaleNote: 'Опт от 30 упаковок: 10 600 ₸',
      image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=500&q=80',
      badge: 'ВЛАГОСТОЙКИЙ'
    },

    // 6. Гипсокартон и отделка
    {
      id: 'mat-12',
      category: 'drywall',
      title: 'Гипсокартон Knauf влагостойкий ГКЛВ (2500×1200×12.5 мм)',
      supplier: 'ТОО «Кнауф Гипс»',
      city: 'Алматы',
      price: 3450,
      unit: 'лист (3 м²)',
      weightKg: 28,
      gost: 'ГОСТ 6266-97',
      inStock: 1800,
      wholesaleNote: 'Опт от 50 листов: 3 150 ₸',
      image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80',
      badge: 'АКЦИЯ'
    }
  ];

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.supplier.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCity = selectedCity === 'all' || p.city.toLowerCase() === selectedCity.toLowerCase();
      const matchPrice = p.price <= priceMax;
      const matchInStock = !inStockOnly || p.inStock > 0;
      const matchGost = !gostOnly || (p.gost && p.gost.length > 0);
      const matchWholesale = !wholesaleOnly || (p.wholesaleNote && p.wholesaleNote.length > 0);

      return matchCat && matchSearch && matchCity && matchPrice && matchInStock && matchGost && matchWholesale;
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return 0; // default popular
    });
  }, [products, selectedCategory, searchQuery, selectedCity, sortBy, priceMax, inStockOnly, gostOnly, wholesaleOnly]);

  // Quantity helpers
  const handleQtyChange = (productId, delta) => {
    const cur = quantities[productId] || 1;
    const next = Math.max(1, cur + delta);
    setQuantities({ ...quantities, [productId]: next });
  };

  const handleAddToCart = (product) => {
    const qty = quantities[product.id] || 1;
    const existing = cart.find(c => c.id === product.id);
    if (existing) {
      setCart(cart.map(c => c.id === product.id ? { ...c, count: c.count + qty } : c));
    } else {
      setCart([...cart, { ...product, count: qty }]);
    }
    showToast(`🛒 Добавлено в корзину: ${product.title} (${qty} ${product.unit})`);
  };

  const handleRemoveFromCart = (productId) => {
    setCart(cart.filter(c => c.id !== productId));
  };

  const handleCartQtyChange = (productId, delta) => {
    setCart(cart.map(c => {
      if (c.id !== productId) return c;
      const newCount = Math.max(1, c.count + delta);
      return { ...c, count: newCount };
    }));
  };

  const handleClearCart = () => {
    setCart([]);
    showToast('🗑️ Корзина очищена');
  };

  // Cart Totals
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.price * item.count), 0);
  }, [cart]);

  const cartWeightKg = useMemo(() => {
    return cart.reduce((acc, item) => acc + ((item.weightKg || 10) * item.count), 0);
  }, [cart]);

  const recommendedVehicle = useMemo(() => {
    if (cartWeightKg <= 1500) return { name: 'Газель 1.5т (городская доставка)', cost: 12000, icon: '🚐' };
    if (cartWeightKg <= 5000) return { name: 'Валдай / Man 5т (среднетоннажный)', cost: 25000, icon: '🚚' };
    if (cartWeightKg <= 15000) return { name: 'Камаз / Самосвал 15т', cost: 45000, icon: '🚛' };
    return { name: 'Еврофура 20-25т (межгород / опт)', cost: 85000, icon: '🚜' };
  }, [cartWeightKg]);

  const cartTotalWithDelivery = cartSubtotal + (cart.length > 0 ? recommendedVehicle.cost : 0);

  // AI BOM Calculator Trigger
  const handleRunAiBOMCalc = () => {
    const area = parseFloat(calcArea) || 100;
    let resItems = [];

    if (calcType === 'walls') {
      resItems = [
        { name: 'Газоблок 600×300×200 D500', count: Math.round(area * 8.3), unit: 'шт', cost: Math.round(area * 8.3 * 980) },
        { name: 'Клей для газоблока (мешок 25кг)', count: Math.round(area * 0.4), unit: 'мешков', cost: Math.round(area * 0.4 * 2850) },
        { name: 'Арматурная сетка кладочная 50×50', count: Math.round(area * 0.5), unit: 'рулонов', cost: Math.round(area * 0.5 * 6500) }
      ];
    } else if (calcType === 'foundation') {
      resItems = [
        { name: 'Товарный бетон М-350 (В25)', count: Math.round(area * 0.35 * 10) / 10, unit: 'м³', cost: Math.round(area * 0.35 * 24500) },
        { name: 'Арматура А500С Ø12 мм', count: Math.round(area * 0.035 * 100) / 100, unit: 'тонн', cost: Math.round(area * 0.035 * 365000) },
        { name: 'Вязальная проволока 1.2 мм', count: Math.round(area * 0.2), unit: 'кг', cost: Math.round(area * 0.2 * 850) }
      ];
    } else {
      resItems = [
        { name: 'Цемент М500 Д0 (50 кг)', count: Math.round(area * 0.6), unit: 'мешков', cost: Math.round(area * 0.6 * 2450) },
        { name: 'Песок мытый строительный', count: Math.round(area * 0.1 * 10) / 10, unit: 'м³', cost: Math.round(area * 0.1 * 5500) },
        { name: 'Фиброволокно армирующее', count: Math.round(area * 0.05 * 10) / 10, unit: 'кг', cost: Math.round(area * 0.05 * 2200) }
      ];
    }

    const totalCost = resItems.reduce((acc, i) => acc + i.cost, 0);

    setAiBOMResult({
      area,
      calcType,
      items: resItems,
      totalCost,
      insights: [
        `✅ Расчёт произведен по нормам СНиП РК для объекта ${area} м².`,
        `📦 Резерв на подрезку и технологические потери: +5%.`,
        `🚚 Рекомендуемый транспорт для доставки всей партии: ${area > 80 ? 'Камаз 15т' : 'Валдай 5т'}.`
      ]
    });
    showToast('✨ AI-Спецификация материалов успешно рассчитана!');
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    const totalCost = cartTotalWithDelivery;

    // 1. If escrow payment, freeze funds from wallet
    let escrowInfo = null;
    if (paymentMethod === 'escrow') {
      escrowInfo = freezeEscrow(totalCost, `Стройматериалы: ${cart.map(c => c.title).slice(0, 2).join(', ')}...`);
      setWalletBalance(escrowInfo.newBalance);
    }

    // 2. Dispatch Platform Order to Manager CRM and Shared Orders
    const newOrder = createPlatformOrder({
      title: `Поставка стройматериалов (${cart.length} наим., ${(cartWeightKg / 1000).toFixed(1)} т)`,
      category: 'Стройматериалы',
      amount: totalCost,
      budget: `${totalCost.toLocaleString()} ₸`,
      clientName: checkoutName || 'Заказчик',
      clientPhone: checkoutPhone || '+7 (707) 123-45-67',
      city: selectedCity === 'all' ? 'Алматы' : selectedCity,
      description: `Заказ стройматериалов на объект: ${checkoutAddress}. Состав: ${cart.map(c => `${c.title} (${c.count} ${c.unit})`).join(', ')}. Транспорт: ${recommendedVehicle.name}. Оплата: ${paymentMethod === 'escrow' ? 'Эскроу заморожено' : 'Kaspi Pay'}`,
      type: 'materials',
      status: 'new',
      paymentMethod: paymentMethod === 'escrow' ? 'Эскроу QazGost' : (paymentMethod === 'kaspi' ? 'Kaspi Pay' : 'Безналичный расчет с НДС'),
      materials: cart
    });

    // Also persist in legacy materials list
    try {
      const savedOrders = JSON.parse(localStorage.getItem('qazgost_materials_orders') || '[]');
      localStorage.setItem('qazgost_materials_orders', JSON.stringify([newOrder, ...savedOrders]));
    } catch (err) {
      console.error(err);
    }

    setCart([]);
    setIsCheckoutModal(false);
    setIsCartOpen(false);
    showToast(`🎉 Заказ ${newOrder.id} оформлен и отправлен Менеджеру на комплектацию! 🧱`);
  };

  const handleRfqSubmit = (e) => {
    e.preventDefault();
    showToast('📄 Оптовая тендерная заявка разослана поставщикам РК!');
    setRfqTitle('');
    setRfqVolume('');
    setRfqPhone('');
  };

  return (
    <div className="mmp-container">
      {toastMessage && <div className="mmp-toast">{toastMessage}</div>}

      {/* Top Header Bar */}
      {!hideHeader && (
        <div className="mmp-header-bar">
          <button className="mmp-back-btn" onClick={onBack} title="Назад к дашборду">
            <span>←</span>
            <span>Назад</span>
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <div className="mmp-hero-banner">
        <div className="mmp-hero-left">
          <h2>
            <span>🧱</span>
            <span>Маркетплейс строительных материалов</span>
          </h2>
          <p>
            Прямые поставки от заводов-производителей Казахстана. Оптовые и розничные цены, паспорта качества ГОСТ/СТ РК, калькулятор объёмов и быстрая доставка на объект.
          </p>
        </div>

        <div className="mmp-hero-stats">
          <div className="mmp-stat-pill">
            <strong>1 450+</strong>
            <span>Товаров в наличии</span>
          </div>
          <div className="mmp-stat-pill">
            <strong>24/7</strong>
            <span>Эскроу & Доставка</span>
          </div>
          <div className="mmp-stat-pill">
            <strong>100%</strong>
            <span>ГОСТ РК Сертификаты</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mmp-nav-tabs">
        <button 
          className={`mmp-tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
          onClick={() => setActiveTab('catalog')}
        >
          <span>🏪 Каталог материалов</span>
        </button>

        <button 
          className={`mmp-tab-btn ${activeTab === 'ai_calc' ? 'active' : ''}`}
          onClick={() => setActiveTab('ai_calc')}
        >
          <span>🤖 AI-Калькулятор потребности (BOM)</span>
        </button>

        <button 
          className={`mmp-tab-btn ${activeTab === 'rfq' ? 'active' : ''}`}
          onClick={() => setActiveTab('rfq')}
        >
          <span>📋 Оптовый тендер (Запрос цен)</span>
        </button>

        <button 
          className="mmp-tab-btn"
          onClick={() => setIsCartOpen(true)}
          style={{ marginLeft: 'auto', background: 'rgba(16, 185, 129, 0.2)', borderColor: '#10b981', color: '#fff' }}
        >
          <span>🛒 Корзина</span>
          {cart.length > 0 && <span className="mmp-badge-cart-count">{cart.length}</span>}
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 1: CATALOG                                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'catalog' && (
        <div className="mmp-content">
          {/* Top Search Bar */}
          <div className="mmp-search-bar">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Поиск материалов: цемент, арматура, кирпич, гипсокартон, песок..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <span className="search-results-count">Найдено: {filteredProducts.length}</span>
          </div>

          <div className="mmp-main-layout">
            {/* Left Sidebar Filters */}
            <aside className="mmp-sidebar">
              <div className="mmp-filter-group">
                <label>🏷️ Категория</label>
                <select 
                  className="mmp-select"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="mmp-filter-group">
                <label>📍 Локация склада</label>
                <select 
                  className="mmp-select"
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                >
                  <option value="all">🌐 Все города / склады РК</option>
                  <option value="Алматы">Алматы (Северное кольцо)</option>
                  <option value="Астана">Астана (Промзона)</option>
                  <option value="Шымкент">Шымкент</option>
                  <option value="Караганда">Караганда</option>
                </select>
              </div>

              <div className="mmp-filter-group">
                <label>📏 Радиус поставки: {radius} км</label>
                <input 
                  type="range" 
                  min="10" 
                  max="200" 
                  step="10"
                  value={radius} 
                  onChange={e => setRadius(Number(e.target.value))}
                  className="mmp-slider"
                />
                <div className="mmp-slider-labels">
                  <span>10 км</span>
                  <span>200 км</span>
                </div>
              </div>

              <div className="mmp-filter-group">
                <label>📋 Сертификация и Наличие</label>
                <div className="mmp-checkbox-group">
                  <label className="mmp-check-label">
                    <input 
                      type="checkbox" 
                      checked={inStockOnly} 
                      onChange={e => setInStockOnly(e.target.checked)} 
                    />
                    <span>📦 Только в наличии</span>
                  </label>
                  <label className="mmp-check-label">
                    <input 
                      type="checkbox" 
                      checked={gostOnly} 
                      onChange={e => setGostOnly(e.target.checked)} 
                    />
                    <span>📜 Сертификат ГОСТ / СТ РК</span>
                  </label>
                  <label className="mmp-check-label">
                    <input 
                      type="checkbox" 
                      checked={wholesaleOnly} 
                      onChange={e => setWholesaleOnly(e.target.checked)} 
                    />
                    <span>⚡ Есть оптовые скидки</span>
                  </label>
                </div>
              </div>

              <div className="mmp-filter-group">
                <label>💰 Макс. цена (за ед.)</label>
                <div className="mmp-slider-labels">
                  <span>до {priceMax.toLocaleString()} ₸</span>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="50000" 
                  step="500"
                  value={priceMax} 
                  onChange={e => setPriceMax(Number(e.target.value))}
                  className="mmp-slider"
                />
              </div>

              <div className="mmp-filter-group">
                <label>🚚 Варианты поставки</label>
                <div className="mmp-radio-group">
                  <label className="mmp-radio-label">
                    <input 
                      type="radio" 
                      name="mmp_delivery" 
                      checked={deliveryType === 'all'} 
                      onChange={() => setDeliveryType('all')} 
                    />
                    <span>Все варианты</span>
                  </label>
                  <label className="mmp-radio-label">
                    <input 
                      type="radio" 
                      name="mmp_delivery" 
                      checked={deliveryType === 'delivery'} 
                      onChange={() => setDeliveryType('delivery')} 
                    />
                    <span>С доставкой на объект</span>
                  </label>
                  <label className="mmp-radio-label">
                    <input 
                      type="radio" 
                      name="mmp_delivery" 
                      checked={deliveryType === 'pickup'} 
                      onChange={() => setDeliveryType('pickup')} 
                    />
                    <span>Самовывоз со склада</span>
                  </label>
                </div>
              </div>

              <button className="mmp-sidebar-submit-btn" onClick={() => showToast(`🔍 Найдено ${filteredProducts.length} позиций стройматериалов`)}>
                Показать {filteredProducts.length} товаров
              </button>
            </aside>

            {/* Right Results Column */}
            <div className="mmp-results">
              {/* Category Chips */}
              <div className="mmp-category-chips">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    className={`mmp-cat-chip ${selectedCategory === cat.id ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Sort selector bar inside results */}
              <div className="mmp-sort-bar">
                <span>Сортировка:</span>
                <select 
                  className="mmp-select-sm"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  <option value="popular">⚡ По популярности</option>
                  <option value="price_asc">📉 Сначала дешевле</option>
                  <option value="price_desc">📈 Сначала дороже</option>
                </select>
              </div>

              {/* Products Grid */}
              <div className="mmp-products-grid">
                {filteredProducts.map(p => {
                  const currentQty = quantities[p.id] || 1;
                  return (
                    <div key={p.id} className="mmp-product-card">
                      <div className="mmp-card-img-wrap">
                        <img src={p.image} alt={p.title} />
                        {p.badge && <span className="mmp-card-badge">{p.badge}</span>}
                        <span className="mmp-card-gost">{p.gost}</span>
                      </div>

                      <div className="mmp-card-body">
                        <h4 className="mmp-card-title">{p.title}</h4>
                        <div className="mmp-card-supplier">
                          <span>🏭</span>
                          <span>{p.supplier}</span>
                        </div>

                        <div className="mmp-card-specs">
                          <span className="mmp-spec-tag">📍 {p.city}</span>
                          <span className="mmp-spec-tag">📦 Склад: {p.inStock} {p.unit}</span>
                          <span className="mmp-spec-tag">⚖️ {p.weightKg} кг / ед.</span>
                        </div>

                        <div className="mmp-card-price-row">
                          <div>
                            <span className="mmp-price-val">{p.price.toLocaleString()} ₸</span>
                            <span className="mmp-price-unit">/ {p.unit}</span>
                            {p.wholesaleNote && <span className="mmp-wholesale-note">{p.wholesaleNote}</span>}
                          </div>
                        </div>

                        <div className="mmp-card-actions">
                          <div className="mmp-qty-control">
                            <button className="mmp-qty-btn" onClick={() => handleQtyChange(p.id, -1)}>-</button>
                            <span className="mmp-qty-val">{currentQty}</span>
                            <button className="mmp-qty-btn" onClick={() => handleQtyChange(p.id, 1)}>+</button>
                          </div>

                          <button className="mmp-btn-add-cart" onClick={() => handleAddToCart(p)}>
                            <span>🛒</span>
                            <span>В корзину</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 2: AI BOM CALCULATOR                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'ai_calc' && (
        <div className="mmp-ai-box">
          <div className="mmp-ai-head">
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
            <div>
              <h3>AI-Калькулятор потребности стройматериалов (BOM)</h3>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Введите базовые размеры объекта — нейросеть рассчитает точную спецификацию материалов по нормам расхода СНиП РК.
              </p>
            </div>
          </div>

          <div className="mmp-ai-grid">
            <div className="mmp-ai-input-group">
              <label>Тип конструкции:</label>
              <select value={calcType} onChange={e => setCalcType(e.target.value)}>
                <option value="walls">🧱 Возведение стен (газоблок + клей)</option>
                <option value="foundation">🏗️ Заливка монолитного фундамента</option>
                <option value="screed">📐 Стяжка пола и выравнивание</option>
              </select>
            </div>

            <div className="mmp-ai-input-group">
              <label>Площадь / Объём конструкции (м²):</label>
              <input 
                type="number" 
                value={calcArea} 
                onChange={e => setCalcArea(e.target.value)} 
                min="1" 
              />
            </div>
          </div>

          <button className="mmp-ai-btn-calc" onClick={handleRunAiBOMCalc}>
            ⚡ Рассчитать спецификацию материалов
          </button>

          {aiBOMResult && (
            <div style={{ marginTop: '1.5rem', background: 'rgba(10, 15, 30, 0.7)', padding: '1.25rem', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#10b981' }}>
                📦 Рекомендуемая ведомость материалов на {aiBOMResult.area} м²:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                {aiBOMResult.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: '8px' }}>
                    <div>
                      <strong>{it.name}</strong>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Количество: {it.count} {it.unit}</div>
                    </div>
                    <strong style={{ color: '#10b981', fontSize: '1.1rem' }}>{it.cost.toLocaleString()} ₸</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                <div>
                  <span style={{ color: '#94a3b8' }}>Ориентировочный бюджет:</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#38bdf8' }}>{aiBOMResult.totalCost.toLocaleString()} ₸</div>
                </div>

                <button 
                  className="mmp-btn-add-cart"
                  onClick={() => {
                    showToast('🛒 Все рассчитанные позиции добавлены в корзину!');
                    setIsCartOpen(true);
                  }}
                  style={{ padding: '10px 20px' }}
                >
                  🛒 Добавить всю спецификацию в заказ
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* TAB 3: RFQ / WHOLESALE TENDER INQUIRY                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'rfq' && (
        <div style={{ maxWidth: '680px', margin: '0 auto', background: 'rgba(15, 23, 42, 0.85)', padding: '2rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.35rem', color: '#fff' }}>
            📋 Запрос оптовой цены у всех заводов и поставщиков РК
          </h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Укажите необходимый перечень стройматериалов. Система автоматически уведомит аккредитованные базы и заводы, и вы получите коммерческие предложения со скидкой до 20%.
          </p>

          <form onSubmit={handleRfqSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Список или описание материалов:</label>
              <textarea 
                rows="4"
                placeholder="Например: Арматура А500С Ø12мм — 25 тонн, Бетон М350 — 120 м³, Кирпич керамический — 15 000 шт."
                value={rfqTitle}
                onChange={e => setRfqTitle(e.target.value)}
                style={{ width: '100%', background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Город доставки:</label>
                <select 
                  value={rfqCity} 
                  onChange={e => setRfqCity(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                >
                  <option value="Алматы">Алматы</option>
                  <option value="Астана">Астана</option>
                  <option value="Шымкент">Шымкент</option>
                  <option value="Караганда">Караганда</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.4rem' }}>Контактный телефон:</label>
                <input 
                  type="text" 
                  placeholder="+7 (707) 000-00-00"
                  value={rfqPhone}
                  onChange={e => setRfqPhone(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              style={{ background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '12px', borderRadius: '10px', fontWeight: 900, cursor: 'pointer', marginTop: '0.5rem' }}
            >
              📤 Разослать тендерный запрос поставщикам
            </button>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* SLIDE-OVER CART DRAWER                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isCartOpen && (
        <div className="mmp-modal-backdrop" onClick={() => setIsCartOpen(false)}>
          <div className="mmp-cart-drawer" onClick={e => e.stopPropagation()}>
            <div className="mmp-cart-header">
              <h3>
                <span>🛒</span>
                <span>Корзина заказа</span>
                {cart.length > 0 && <span style={{ fontSize: '.82rem', color: '#94a3b8', marginLeft: 6 }}>({cart.length} поз.)</span>}
              </h3>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {cart.length > 0 && (
                  <button 
                    onClick={handleClearCart}
                    style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    🗑️ Очистить
                  </button>
                )}
                <button className="mmp-btn-close-cart" onClick={() => setIsCartOpen(false)}>✕</button>
              </div>
            </div>

            <div className="mmp-cart-items-list">
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🛒</span>
                  <strong>Ваша корзина пуста</strong>
                  <p style={{ fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>Выберите товары из каталога и добавьте их в корзину.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="mmp-cart-item">
                    <img src={item.image} alt={item.title} />
                    <div className="mmp-ci-info">
                      <div className="mmp-ci-title">{item.title}</div>
                      <div style={{ fontSize: '.75rem', color: '#64748b', marginBottom: 4 }}>
                        {item.supplier} • {item.city}
                      </div>
                      <div className="mmp-ci-price">
                        {(item.price * item.count).toLocaleString()} ₸
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: '6px' }}>
                          ({item.count} × {item.price.toLocaleString()} ₸/{item.unit})
                        </span>
                      </div>
                      {/* Qty Controls */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                        <button 
                          onClick={() => handleCartQtyChange(item.id, -1)}
                          style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.12)', color: '#fff', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}
                        >−</button>
                        <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 800, color: '#fff', fontSize: '.92rem' }}>{item.count}</span>
                        <button 
                          onClick={() => handleCartQtyChange(item.id, 1)}
                          style={{ width: 28, height: 28, borderRadius: 7, background: 'rgba(16,185,129,.15)', border: '1px solid rgba(16,185,129,.3)', color: '#6ee7b7', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.9rem' }}
                        >+</button>
                        <span style={{ fontSize: '.72rem', color: '#64748b', marginLeft: 4 }}>
                          {item.unit} • {((item.weightKg || 10) * item.count)} кг
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveFromCart(item.id)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '1.2rem', cursor: 'pointer', padding: '4px', flexShrink: 0 }}
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="mmp-cart-footer">
                <div className="mmp-cart-total-row">
                  <span>Стоимость товаров ({cart.reduce((s, c) => s + c.count, 0)} ед.):</span>
                  <strong>{cartSubtotal.toLocaleString()} ₸</strong>
                </div>

                <div className="mmp-cart-total-row">
                  <span>Общая масса груза:</span>
                  <span><strong>{cartWeightKg >= 1000 ? (cartWeightKg / 1000).toFixed(2) + ' т' : cartWeightKg + ' кг'}</strong></span>
                </div>

                <div className="mmp-cart-total-row">
                  <span>Транспорт: {recommendedVehicle.icon} {recommendedVehicle.name}</span>
                  <strong>{recommendedVehicle.cost.toLocaleString()} ₸</strong>
                </div>

                <div className="mmp-cart-total-row main">
                  <span>Итого к оплате:</span>
                  <strong>{cartTotalWithDelivery.toLocaleString()} ₸</strong>
                </div>

                <button 
                  className="mmp-btn-checkout"
                  onClick={() => setIsCheckoutModal(true)}
                >
                  ⚡ Оформить заказ и доставку
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* CHECKOUT MODAL                                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isCheckoutModal && (
        <div className="mmp-modal-backdrop" style={{ alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsCheckoutModal(false)}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '20px', width: '100%', maxWidth: '520px', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#fff' }}>📦 Оформление заказа стройматериалов</h3>
              <button onClick={() => setIsCheckoutModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Имя получателя / Название компании:</label>
                <input 
                  type="text" 
                  placeholder="Иван Иванов / ТОО «СтройГрупп»" 
                  value={checkoutName}
                  onChange={e => setCheckoutName(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Телефон:</label>
                <input 
                  type="text" 
                  placeholder="+7 (707) 123-45-67" 
                  value={checkoutPhone}
                  onChange={e => setCheckoutPhone(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Адрес доставки объекта:</label>
                <input 
                  type="text" 
                  placeholder="г. Алматы, мкр. Самал-2, д. 45" 
                  value={checkoutAddress}
                  onChange={e => setCheckoutAddress(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.3rem' }}>Способ оплаты:</label>
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', background: 'rgba(10,14,28,0.8)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '10px', borderRadius: '8px' }}
                >
                  <option value="kaspi">📱 Kaspi Pay (QR / Перевод)</option>
                  <option value="escrow">🛡️ Безопасная сделка QAZGOST Эскроу</option>
                  <option value="invoice">📄 Безналичный расчет (Счет с НДС для юрлиц)</option>
                </select>
              </div>

              <div style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))', border: '1px solid rgba(16, 185, 129, 0.35)', padding: '12px 16px', borderRadius: '12px', marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>Итого к оплате с доставкой:</span>
                  <strong style={{ fontSize: '1.25rem', color: '#10b981' }}>{cartTotalWithDelivery.toLocaleString()} ₸</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', fontSize: '0.82rem' }}>
                  <span style={{ color: '#94a3b8' }}>💳 Баланс кошелька: <strong style={{ color: '#fff' }}>{walletBalance.toLocaleString()} ₸</strong></span>
                  {walletBalance < cartTotalWithDelivery && (
                    <button
                      type="button"
                      onClick={() => {
                        const added = topupBalance(cartTotalWithDelivery);
                        setWalletBalance(added);
                        showToast(`🎉 Кошелёк пополнен на +${cartTotalWithDelivery.toLocaleString()} ₸ через Kaspi!`);
                      }}
                      style={{ background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', color: '#38bdf8', borderRadius: '6px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Пополнить на сумму заказа
                    </button>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                style={{ width: '100%', background: 'linear-gradient(90deg, #10b981, #059669)', border: 'none', color: '#fff', padding: '14px', borderRadius: '10px', fontWeight: 900, fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' }}
              >
                ✓ Подтвердить и отправить заявку
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
