import React, { useState } from 'react';
import './EngineeringSolutionsPage.css';

export default function EngineeringSolutionsPage({ onBack, onOpenOrders, hideHeader = false }) {
  // Object Info Form State
  const [objectName, setObjectName] = useState('Жилой дом');
  const [area, setArea] = useState('250');
  const [floors, setFloors] = useState('2');
  const [city, setCity] = useState('Алматы');
  const [urgency, setUrgency] = useState('Обычный');
  const [hasPlans, setHasPlans] = useState(false);

  // Active Category Filter
  const [activeCategory, setActiveCategory] = useState('all');

  // Cart / Package Builder State
  const [cart, setCart] = useState([]);
  const [selectedSolution, setSelectedSolution] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdAppId, setCreatedAppId] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const categoryChips = [
    { id: 'all', label: '🪄 Все разделы' },
    { id: 'design', label: '📐 Проектирование' },
    { id: 'inspection', label: '🔍 Обследование' },
    { id: 'supervision', label: '👷 Надзор' },
    { id: 'documentation', label: '📄 Документация' },
    { id: 'safety', label: '🔥 Безопасность' },
    { id: 'energy', label: '⚡ Энергоэффективность' }
  ];

  const categories = [
    {
      id: 'design',
      title: '📐 Проектирование (ПСД & BIM)',
      solutions: [
        {
          id: 'ap',
          icon: '🏛️',
          gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
          title: 'Архитектурный раздел (АР)',
          desc: 'Полный комплект архитектурных чертежей и 3D фасадных решений',
          price: 450000,
          days: 14,
          fullDesc: 'Разработка архитектурно-строительных решений (планы этажей, фасады, разрезы, узлы, экспликации помещений) по СНиП РК 2026.'
        },
        {
          id: 'kr',
          icon: '🏗️',
          gradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
          title: 'Конструктивный раздел (КР)',
          desc: 'Расчёт и чертежи железобетонных и стальных конструкций',
          price: 550000,
          days: 18,
          fullDesc: 'Расчет несущей способности фундамента, колонн, балок, перекрытий. Чертежи КЖ и КМ с спецификациями арматуры и бетона.'
        },
        {
          id: 'ovik',
          icon: '❄️',
          gradient: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
          title: 'ОВиК (отопление, вентиляция)',
          desc: 'Проект микроклимата, отопления и приточной вентиляции',
          price: 380000,
          days: 12,
          fullDesc: 'Теплотехнический расчет, гидравлика, схемы разводки отопления, теплого пола, приточно-вытяжной вентиляции и кондиционирования.'
        },
        {
          id: 'vk',
          icon: '💧',
          gradient: 'linear-gradient(135deg, #06b6d4, #10b981)',
          title: 'Водоснабжение и канализация (ВК)',
          desc: 'Проект водопровода, насосных станций и канализации',
          price: 320000,
          days: 10,
          fullDesc: 'Аксонометрические схемы ХВС, ГВС, бытовой и ливневой канализации, насосные станции, фильтрация и учет воды.'
        },
        {
          id: 'eom',
          icon: '⚡',
          gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
          title: 'Электрика (ЭОМ)',
          desc: 'Проект электроснабжения, молниезащиты и освещения',
          price: 350000,
          days: 12,
          fullDesc: 'Однолинейные схемы ГРЩ/ЩО/ЩС, расчет нагрузок, молниезащита, заземление, розеточные сети и освещение.'
        },
        {
          id: 'ss',
          icon: '📡',
          gradient: 'linear-gradient(135deg, #ec4899, #8b5cf6)',
          title: 'Слаботочные системы (СС/СКC)',
          desc: 'Проект СКС, видеонаблюдения и системы СКУД',
          price: 280000,
          days: 8,
          fullDesc: 'СКС, видеонаблюдение (CCTV), СКУД, домофония, локальная вычислительная сеть (ЛВС) и Wi-Fi покрытие.'
        },
        {
          id: 'bim',
          icon: '🧊',
          gradient: 'linear-gradient(135deg, #d946ef, #6366f1)',
          title: 'BIM-модель (Revit 3D)',
          desc: 'Информационная 3D-модель здания с проверкой коллизий',
          price: 650000,
          days: 21,
          fullDesc: 'Сборка единой информационной модели здания в Revit/Navisworks, выявление пересечений инженерных сетей до начала строительства.'
        }
      ]
    },
    {
      id: 'inspection',
      title: '🔍 Экспертиза и обследование',
      solutions: [
        {
          id: 'tech_inspect',
          icon: '🔍',
          gradient: 'linear-gradient(135deg, #10b981, #059669)',
          title: 'Техническое обследование',
          desc: 'Инструментальное обследование конструкций с заключением СРО',
          price: 250000,
          days: 7,
          fullDesc: 'Инструментальное обследование фундамента, несущих стен и перекрытий с выдачей официального экспертного заключения СРО.'
        },
        {
          id: 'defect',
          icon: '📋',
          gradient: 'linear-gradient(135deg, #f97316, #ea580c)',
          title: 'Дефектовка',
          desc: 'Дефектная ведомость с точным расчетом объемов',
          price: 180000,
          days: 5,
          fullDesc: 'Составление акта осмотра и дефектной ведомости с точным подсчетом требуемых физических объемов ремонтно-восстановительных работ.'
        },
        {
          id: 'geodesy',
          icon: '📏',
          gradient: 'linear-gradient(135deg, #0284c7, #2563eb)',
          title: 'Геодезия и обмеры',
          desc: 'Лазерное 3D-сканирование и обмерочные чертежи',
          price: 220000,
          days: 5,
          fullDesc: 'Высокоточная лазерная съёмка помещений, посадка здания на геодезическую подоснову, исполнительные схемы.'
        }
      ]
    },
    {
      id: 'supervision',
      title: '👷 Строительный надзор',
      solutions: [
        {
          id: 'tech_supervision',
          icon: '👷',
          gradient: 'linear-gradient(135deg, #eab308, #ca8a04)',
          title: 'Технический надзор',
          desc: 'Независимый контроль качества и скрытых работ 24/7',
          price: 400000,
          days: 30,
          fullDesc: 'Непрерывный независимый аудит строительства: проверка скрытых работ, марок бетона, геометрии и подписание актов КС-2/КС-3.'
        },
        {
          id: 'author_supervision',
          icon: '✏️',
          gradient: 'linear-gradient(135deg, #a855f7, #7e22ce)',
          title: 'Авторский надзор',
          desc: 'Контроль соответствия строительно-монтажных работ проекту',
          price: 350000,
          days: 30,
          fullDesc: 'Регулярные выезды архитектора и конструктора на объект, ведение журнала авторского надзора, внесение рабочих изменений в чертежи.'
        }
      ]
    },
    {
      id: 'documentation',
      title: '📄 Сметная и разрешительная документация',
      solutions: [
        {
          id: 'boq',
          icon: '💰',
          gradient: 'linear-gradient(135deg, #10b981, #14b8a6)',
          title: 'Смета / BoQ (GESN/SNIP)',
          desc: 'Нормативный и рыночный сметный расчёт стоимости объекта',
          price: 150000,
          days: 5,
          fullDesc: 'Расчет нормативной и рыночной сметы в расценках РК 2026, детальная спецификация всех материалов и заложенных ресурсов.'
        },
        {
          id: 'ppr',
          icon: '🗺️',
          gradient: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          title: 'ППР / ПОС',
          desc: 'Проект производства работ и стройгенплан площадки',
          price: 280000,
          days: 10,
          fullDesc: 'Разработка ППР и ПОС с строгими стройгенпланами, графиками движения техники и рабочих, картами безопасности.'
        },
        {
          id: 'executive_docs',
          icon: '📜',
          gradient: 'linear-gradient(135deg, #0891b2, #0d9488)',
          title: 'Исполнительная документация',
          desc: 'Полный комплект документов для сдачи объекта ГАСК',
          price: 200000,
          days: 7,
          fullDesc: 'Подготовка исполнительных схем, паспортов на оборудование, сертификатов соответствия и актов АОСР для сдачи объекта ГАСК.'
        }
      ]
    },
    {
      id: 'safety',
      title: '🔥 Пожарная безопасность',
      solutions: [
        {
          id: 'fire_safety',
          icon: '🔥',
          gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
          title: 'Пожарная безопасность (АПС / СОУЭ)',
          desc: 'Раздел пожарной защиты, сигнализации и пожаротушения',
          price: 250000,
          days: 10,
          fullDesc: 'Проект пожарной сигнализации (АПС), системы оповещения (СОУЭ), автоматического пожаротушения и расчета эвакуации.'
        }
      ]
    },
    {
      id: 'energy',
      title: '⚡ Энергоэффективность',
      solutions: [
        {
          id: 'energy_audit',
          icon: '⚡',
          gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
          title: 'Энергоаудит здания',
          desc: 'Энергетическое обследование и выявление потерь тепла',
          price: 300000,
          days: 10,
          fullDesc: 'Комплексный энергоаудит с составлением энергетического паспорта здания, замеры электросети и рекомендации энергосбережения.'
        },
        {
          id: 'thermal_inspect',
          icon: '🌡️',
          gradient: 'linear-gradient(135deg, #f43f5e, #be123c)',
          title: 'Тепловизионное обследование',
          desc: 'Съемка профессиональным тепловизором Fluke',
          price: 120000,
          days: 3,
          fullDesc: 'Съемка профессиональным тепловизором Fluke фасадов, кровли и оконных примыканий для обнаружения мостиков холода и утечек тепла.'
        }
      ]
    }
  ];

  const toggleCart = (sol) => {
    setCart(prev => {
      const exists = prev.some(item => item.id === sol.id);
      if (exists) {
        showToast(`🗑️ "${sol.title}" удалено из пакета`);
        return prev.filter(item => item.id !== sol.id);
      } else {
        showToast(`✨ "${sol.title}" добавлено в пакет!`);
        return [...prev, sol];
      }
    });
  };

  const totalPrice = cart.reduce((acc, item) => acc + item.price, 0);
  const totalDays = cart.reduce((acc, item) => Math.max(acc, item.days), 0);

  const formatPrice = (p) => {
    return 'от ' + p.toLocaleString('ru-RU') + ' ₸';
  };

  const filteredCategories = activeCategory === 'all' 
    ? categories 
    : categories.filter(c => c.id === activeCategory);

  const handleSubmitPackage = () => {
    if (cart.length === 0) {
      showToast('⚠️ Выберите хотя бы одно инженерное решение из каталога');
      return;
    }
    if (!objectName.trim()) {
      showToast('⚠️ Укажите название объекта');
      return;
    }

    const appId = `ENG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setCreatedAppId(appId);
    setShowSuccessModal(true);

    // Sync to CRM
    try {
      const savedEvents = localStorage.getItem('qazgost_calendar_events');
      let crmEvents = savedEvents ? JSON.parse(savedEvents) : {};
      const today = new Date().toISOString().split('T')[0];
      if (!crmEvents[today]) crmEvents[today] = [];

      crmEvents[today].push({
        id: appId,
        title: `Пакет инженерных решений: ${objectName} (${cart.length} усл.)`,
        time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        type: 'request_engineering',
        status: 'Новые',
        desc: `Объект: ${objectName}, Площадь: ${area}м², Город: ${city}. Пакет: ${cart.map(c => c.title).join(', ')}. Итого: ${totalPrice.toLocaleString()} ₸`,
        contractor: 'Назначен ГИП'
      });

      localStorage.setItem('qazgost_calendar_events', JSON.stringify(crmEvents));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="es-container">
      {toastMessage && <div className="es-toast">{toastMessage}</div>}

      {/* Top Header Bar (renders if not embedded or hideHeader=false) */}
      {!hideHeader && (
        <div className="es-header-bar">
          <button className="es-back-btn" onClick={onBack} title="Вернуться">←</button>
          <div className="es-header-title-wrap">
            <div className="es-title-flex">
              <span className="es-header-icon">⚙️</span>
              <h2>Инженерные решения</h2>
            </div>
          </div>

          <button 
            className="es-btn-my-orders"
            onClick={onOpenOrders || onBack}
          >
            📋 Мои заявки
          </button>
        </div>
      )}

      {/* Category Chips Navbar */}
      <div className="es-chips-nav">
        {categoryChips.map(chip => (
          <button 
            key={chip.id}
            className={`es-chip-btn ${activeCategory === chip.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(chip.id)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="es-content-layout mt-3">

        {/* Left Column: Object Form & Catalog */}
        <div className="es-left-col">

          {/* Form Card: 📍 Информация об объекте */}
          <div className="es-form-card">
            <div className="es-form-header">
              <span className="es-form-icon">📍</span>
              <h4>Информация об объекте</h4>
            </div>

            <div className="es-form-grid">
              <div className="es-field">
                <label>Название объекта <span>*</span></label>
                <input 
                  type="text" 
                  value={objectName} 
                  onChange={e => setObjectName(e.target.value)} 
                  placeholder="Жилой дом" 
                  className="es-input" 
                />
              </div>

              <div className="es-field">
                <label>Площадь, м²</label>
                <input 
                  type="text" 
                  value={area} 
                  onChange={e => setArea(e.target.value)} 
                  placeholder="250" 
                  className="es-input" 
                />
              </div>

              <div className="es-field">
                <label>Этажность</label>
                <input 
                  type="number" 
                  value={floors} 
                  onChange={e => setFloors(e.target.value)} 
                  placeholder="2" 
                  className="es-input" 
                />
              </div>

              <div className="es-field">
                <label>Город <span>*</span></label>
                <input 
                  type="text" 
                  value={city} 
                  onChange={e => setCity(e.target.value)} 
                  placeholder="Алматы" 
                  className="es-input" 
                />
              </div>

              <div className="es-field">
                <label>Срочность</label>
                <select 
                  value={urgency} 
                  onChange={e => setUrgency(e.target.value)} 
                  className="es-input"
                >
                  <option value="Обычный">Обычный</option>
                  <option value="Срочно">Срочно (+20%)</option>
                  <option value="Экспресс">Экспресс (+40%)</option>
                </select>
              </div>

              <div className="es-field es-checkbox-field">
                <label className="es-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={hasPlans} 
                    onChange={e => setHasPlans(e.target.checked)} 
                  />
                  <span>Есть чертежи/планы</span>
                </label>
              </div>
            </div>
          </div>

          {/* Catalog Sections */}
          <div className="es-catalog-wrap">
            {filteredCategories.map(cat => (
              <div key={cat.id} className="es-category-section">
                <h3 className="es-cat-title">{cat.title}</h3>

                <div className="es-cards-grid">
                  {cat.solutions.map(sol => {
                    const isInCart = cart.some(item => item.id === sol.id);
                    return (
                      <div key={sol.id} className={`es-card ${isInCart ? 'in-cart' : ''}`}>
                        
                        {/* Colorful Gradient Banner with Unique Icon */}
                        <div className="es-card-banner" style={{ background: sol.gradient }}>
                          <span className="es-banner-icon">{sol.icon}</span>
                        </div>

                        {/* Card Info */}
                        <div className="es-card-body">
                          <h4 className="es-card-title">{sol.title}</h4>
                          <p className="es-card-desc">{sol.desc}</p>

                          <div className="es-card-meta">
                            <span className="es-price-text">{formatPrice(sol.price)}</span>
                            <span className="es-days-text">⏱ {sol.days} дней</span>
                          </div>

                          <div className="es-card-actions">
                            <button 
                              className="es-btn-more"
                              onClick={() => setSelectedSolution(sol)}
                            >
                              Подробнее
                            </button>

                            <button 
                              className={`es-btn-add ${isInCart ? 'active' : ''}`}
                              onClick={() => toggleCart(sol)}
                            >
                              {isInCart ? '✓ В пакете' : '+ Добавить'}
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Right Column: Sticky Cart Package Container */}
        <div className="es-right-col">
          <div className="es-cart-card">
            <div className="es-cart-header">
              <span className="es-cart-icon">📦</span>
              <h4>Ваш пакет</h4>
              {cart.length > 0 && (
                <span className="es-cart-badge">{cart.length}</span>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="es-cart-empty">
                <div className="es-cart-empty-icon">🛒</div>
                <p>Выберите решения из каталога</p>
              </div>
            ) : (
              <div className="es-cart-filled">
                <div className="es-cart-items-list">
                  {cart.map(item => (
                    <div key={item.id} className="es-cart-item-row">
                      <div className="es-citem-info">
                        <span className="es-citem-name">{item.title}</span>
                        <span className="es-citem-days">⏱ ~{item.days} дней</span>
                      </div>
                      <div className="es-citem-right">
                        <span className="es-citem-price">{item.price.toLocaleString()} ₸</span>
                        <button className="es-citem-remove" onClick={() => toggleCart(item)}>✕</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="es-cart-total-box">
                  <div className="es-total-row">
                    <span>Итого ориентировочно:</span>
                    <strong className="es-total-sum">{totalPrice.toLocaleString()} ₸</strong>
                  </div>
                  <div className="es-total-row sub">
                    <span>Макс. срок разработки:</span>
                    <strong>~{totalDays} рабочих дней</strong>
                  </div>
                </div>

                <button 
                  className="es-btn-submit-package"
                  onClick={handleSubmitPackage}
                >
                  🚀 Оформить заявку на пакет
                </button>

                <button 
                  className="es-btn-clear-cart"
                  onClick={() => {
                    setCart([]);
                    showToast('🗑️ Пакет очищен');
                  }}
                >
                  Очистить пакет
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Solution Detail Modal */}
      {selectedSolution && (
        <div className="es-modal-overlay" onClick={() => setSelectedSolution(null)}>
          <div className="es-modal-card" onClick={e => e.stopPropagation()}>
            <button className="es-modal-close" onClick={() => setSelectedSolution(null)}>✕</button>

            <div className="es-m-banner" style={{ background: selectedSolution.gradient }}>
              <span className="es-m-icon">{selectedSolution.icon}</span>
            </div>

            <h2>{selectedSolution.title}</h2>
            <p className="es-m-subtitle">{selectedSolution.desc}</p>

            <div className="es-m-body">
              <div className="es-m-section">
                <h4>📋 Состав работ и спецификация:</h4>
                <p>{selectedSolution.fullDesc}</p>
              </div>

              <div className="es-m-stats">
                <div className="es-mstat">
                  <span className="label">Базовая стоимость</span>
                  <span className="val pink">{formatPrice(selectedSolution.price)}</span>
                </div>
                <div className="es-mstat">
                  <span className="label">Срок исполнения</span>
                  <span className="val">⏱ {selectedSolution.days} дней</span>
                </div>
              </div>

              <div className="es-m-section mt-3">
                <h4>📦 Вы получаете на руки:</h4>
                <ul className="es-m-list">
                  <li>Готовые чертежи в формате PDF и DWG (AutoCAD / Revit)</li>
                  <li>Ведомость спецификации материалов и оборудования</li>
                  <li>Подпись и печать лицензированного инженера ГИП (СРО)</li>
                </ul>
              </div>
            </div>

            <div className="es-m-actions">
              <button 
                className={`es-btn-modal-add ${cart.some(i => i.id === selectedSolution.id) ? 'active' : ''}`}
                onClick={() => {
                  toggleCart(selectedSolution);
                  setSelectedSolution(null);
                }}
              >
                {cart.some(i => i.id === selectedSolution.id) ? '✓ Удалить из пакета' : '+ Добавить в пакет'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Application Success Modal */}
      {showSuccessModal && (
        <div className="es-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="es-modal-card success-card" onClick={e => e.stopPropagation()}>
            <button className="es-modal-close" onClick={() => setShowSuccessModal(false)}>✕</button>

            <div className="es-success-icon">🎉</div>
            <h2>Заявка успешно сформирована!</h2>
            <div className="es-app-number">Номер вашей заявки: <strong>{createdAppId}</strong></div>

            <p className="es-success-text">
              Ваш инженерный пакет по объекту <strong>«{objectName}»</strong> на сумму <strong>{totalPrice.toLocaleString()} ₸</strong> передан назначенному Главному Инженеру Проекта (ГИП).
            </p>

            <div className="es-success-actions">
              <button 
                className="es-btn-to-orders"
                onClick={() => {
                  setShowSuccessModal(false);
                  if (onOpenOrders) onOpenOrders();
                  else onBack();
                }}
              >
                📋 Перейти в Мои Заявки
              </button>

              <button 
                className="es-btn-close-success"
                onClick={() => setShowSuccessModal(false)}
              >
                Отлично
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
