import React, { useState, useMemo } from 'react';
import './ProfileQuestionnaire.css';

export default function ProfileQuestionnaire({ onBack }) {
  // Form State
  const [avatar, setAvatar] = useState(null);
  const [fio, setFio] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [clientType, setClientType] = useState('individual'); // 'individual' | 'legal'
  const [companyName, setCompanyName] = useState('');
  const [companyBin, setCompanyBin] = useState('');
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [projectDescription, setProjectDescription] = useState('');
  
  // UI Interactive States
  const [showVipModal, setShowVipModal] = useState(false);
  const [vipModalType, setVipModalType] = useState('equipment'); // 'equipment' | 'brigade'
  const [toastMessage, setToastMessage] = useState(null);

  const projectsList = [
    { id: 'house', label: '🏠 Жилой дом' },
    { id: 'apartment', label: '🏢 Квартира' },
    { id: 'office', label: '🏪 Офис / Магазин' },
    { id: 'warehouse', label: '🏭 Склад / Цех' },
    { id: 'foundation', label: '🧱 Фундамент' },
    { id: 'roof', label: '🏚️ Кровля' },
    { id: 'repair', label: '🔨 Ремонт' },
    { id: 'landscaping', label: '🌲 Благоустройство' },
    { id: 'fence', label: '🚧 Забор / Ворота' },
    { id: 'pool', label: '🏊 Бассейн / Баня' },
    { id: 'road', label: '🛣️ Дорога / Площадка' },
    { id: 'other', label: '📐 Другое' },
  ];

  const quickPrompts = [
    "Хотим построить 2-этажный дом 140 м² с плоской крышей.",
    "Капитальный ремонт квартиры 75 м² 'под ключ'.",
    "Укладка тротуарной плитки и установка забора 45м."
  ];

  // Dynamic Progress Calculation
  const progressPercent = useMemo(() => {
    let score = 0;
    let total = 6;
    if (fio.trim()) score++;
    if (phone.trim()) score++;
    if (city) score++;
    if (clientType) score++;
    if (selectedProjects.length > 0) score++;
    if (projectDescription.trim()) score++;
    return Math.round((score / total) * 100);
  }, [fio, phone, city, clientType, selectedProjects, projectDescription]);

  const toggleProject = (id) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatar(url);
      showToast('📸 Фото профиля успешно загружено!');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleClear = () => {
    if (window.confirm('Вы уверены, что хотите очистить всю анкету?')) {
      setAvatar(null);
      setFio('');
      setPhone('');
      setEmail('');
      setCity('');
      setAddress('');
      setClientType('individual');
      setCompanyName('');
      setCompanyBin('');
      setSelectedProjects([]);
      setProjectDescription('');
      showToast('🗑️ Анкета очищена');
    }
  };

  const handleSave = () => {
    showToast(`✅ Анкета сохранена! Профиль заполнен на ${progressPercent}%`);
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="pq-container">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="pq-toast-notification">
          {toastMessage}
        </div>
      )}

      {/* Header Bar */}
      <div className="pq-header-bar">
        <button className="pq-back-btn" onClick={onBack} title="Вернуться назад">←</button>
        <div className="pq-header-title-wrap">
          <h2>📋 Моя анкета</h2>
          <span className="pq-header-subtitle">Управление личным профилем и требованиями</span>
        </div>
      </div>

      <div className="pq-content">
        
        {/* Dynamic Progress Card */}
        <div className="pq-card pq-progress-card">
          <div className="pq-progress-header">
            <span className="pq-progress-title">📋 Заполнение анкеты</span>
            <span className="pq-progress-percent">{progressPercent}%</span>
          </div>
          <div className="pq-progress-track">
            <div 
              className="pq-progress-fill" 
              style={{ width: `${Math.max(15, progressPercent)}%` }}
            ></div>
          </div>
          <div className="pq-progress-steps">
            <span 
              className={`pq-step ${fio || phone || city ? 'active' : ''}`}
              onClick={() => scrollToSection('sec-contacts')}
            >
              1. Контакты
            </span>
            <span 
              className={`pq-step ${clientType ? 'active' : ''}`}
              onClick={() => scrollToSection('sec-client-type')}
            >
              2. Тип клиента
            </span>
            <span 
              className={`pq-step ${selectedProjects.length > 0 ? 'active' : ''}`}
              onClick={() => scrollToSection('sec-project')}
            >
              3. Проект
            </span>
            <span 
              className={`pq-step ${progressPercent >= 80 ? 'active' : ''}`}
            >
              4. Готово
            </span>
          </div>
        </div>

        {/* 1. Contact Data Section */}
        <div className="pq-card" id="sec-contacts">
          <h3 className="pq-card-title">👤 Контактные данные</h3>
          
          <div className="pq-avatar-upload">
            <label htmlFor="avatar-file-input" className="pq-avatar-circle" style={{ backgroundImage: avatar ? `url(${avatar})` : 'none', backgroundSize: 'cover' }}>
              {!avatar && (
                <>
                  <span className="pq-camera-icon">📷</span>
                  <span className="pq-avatar-text">Загрузить фото</span>
                </>
              )}
            </label>
            <input 
              id="avatar-file-input" 
              type="file" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleAvatarChange} 
            />
            <span className="pq-avatar-hint">Фото профиля • JPG, PNG (нажмите для выбора)</span>
          </div>

          <div className="pq-form-grid">
            <div className="pq-form-group">
              <label>ФИО <span>*</span></label>
              <div className="pq-input-wrapper">
                <span className="pq-input-icon">👤</span>
                <input 
                  type="text" 
                  value={fio} 
                  onChange={(e) => setFio(e.target.value)} 
                  placeholder="Иванов Иван Иванович" 
                />
              </div>
            </div>

            <div className="pq-form-group">
              <label>Телефон <span>*</span></label>
              <div className="pq-input-wrapper">
                <span className="pq-input-icon">📞</span>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="+7 (7XX) XXX-XX-XX" 
                />
              </div>
            </div>

            <div className="pq-form-group">
              <label>Email</label>
              <div className="pq-input-wrapper">
                <span className="pq-input-icon">✉️</span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="your@email.com" 
                />
              </div>
            </div>

            <div className="pq-form-group">
              <label>Город <span>*</span></label>
              <div className="pq-input-wrapper">
                <span className="pq-input-icon">📍</span>
                <select value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="" disabled>Выберите город</option>
                  <option value="almaty">Алматы</option>
                  <option value="astana">Астана</option>
                  <option value="shymkent">Шымкент</option>
                  <option value="karaganda">Караганда</option>
                  <option value="aktobe">Актобе</option>
                  <option value="atyrau">Атырау</option>
                </select>
              </div>
            </div>

            <div className="pq-form-group pq-col-span-2">
              <label>Адрес проживания / Объекта</label>
              <div className="pq-input-wrapper">
                <span className="pq-input-icon">🏠</span>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  placeholder="ул. Абая, д. 10, кв. 5" 
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Client Type Section */}
        <div className="pq-card" id="sec-client-type">
          <h3 className="pq-card-title">🏢 Тип клиента</h3>
          <div className="pq-type-grid">
            <div 
              className={`pq-type-card ${clientType === 'individual' ? 'active' : ''}`}
              onClick={() => setClientType('individual')}
            >
              <div className="pq-type-radio">{clientType === 'individual' && <div className="pq-radio-inner"></div>}</div>
              <div className="pq-type-info">
                <h4>👤 Физическое лицо</h4>
                <p>Частный клиент, строительство или ремонт для себя</p>
              </div>
            </div>

            <div 
              className={`pq-type-card ${clientType === 'legal' ? 'active' : ''}`}
              onClick={() => setClientType('legal')}
            >
              <div className="pq-type-radio">{clientType === 'legal' && <div className="pq-radio-inner"></div>}</div>
              <div className="pq-type-info">
                <h4>🏢 Юридическое лицо</h4>
                <p>ТОО, ИП, АО — безналичный расчёт, закрывающие документы</p>
              </div>
            </div>
          </div>

          {/* Conditional Legal Entity Fields */}
          {clientType === 'legal' && (
            <div className="pq-legal-extra-fields mt-4">
              <div className="pq-form-group">
                <label>Название компании / ИП <span>*</span></label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={(e) => setCompanyName(e.target.value)} 
                  placeholder="ТОО 'QazStroyGroup'" 
                />
              </div>
              <div className="pq-form-group">
                <label>БИН / ИИН компании <span>*</span></label>
                <input 
                  type="text" 
                  value={companyBin} 
                  onChange={(e) => setCompanyBin(e.target.value)} 
                  placeholder="12 знаков (например, 210440019284)" 
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Project Interest Section */}
        <div className="pq-card" id="sec-project">
          <div className="pq-card-header-flex">
            <h3 className="pq-card-title m-0">📐 Какой проект вас интересует? <span>*</span></h3>
            {selectedProjects.length > 0 && (
              <span className="pq-selected-count-badge">Выбрано: {selectedProjects.length}</span>
            )}
          </div>

          <div className="pq-pills-container mt-3">
            {projectsList.map(proj => {
              const isSelected = selectedProjects.includes(proj.id);
              return (
                <button 
                  key={proj.id} 
                  className={`pq-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => toggleProject(proj.id)}
                >
                  {proj.label}
                  {isSelected && <span className="pq-pill-check">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="pq-form-group mt-4">
            <div className="pq-label-flex">
              <label>Опишите ваш проект</label>
              <span className="pq-char-count">{projectDescription.length}/500</span>
            </div>
            <textarea 
              rows="4" 
              maxLength={500}
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Хотим построить двухэтажный дом 120 м² с гаражом. Земельный участок в р-не Бесагаш..."
            ></textarea>
          </div>

          {/* Quick Prompts */}
          <div className="pq-quick-prompts">
            <span className="pq-prompts-label">Быстрые шаблоны:</span>
            <div className="pq-prompts-list">
              {quickPrompts.map((prompt, idx) => (
                <button 
                  key={idx} 
                  className="pq-prompt-btn"
                  onClick={() => setProjectDescription(prompt)}
                >
                  ⚡ {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="pq-alert-info mt-3">
            💡 Чем подробнее описание — тем точнее будет автоматический расчёт сметы и подбор исполнителей
          </div>
        </div>

        {/* 4. My Equipment (VIP Demo) */}
        <div className="pq-card">
          <div className="pq-card-header-flex">
            <h3 className="pq-card-title m-0">🔧 Моя техника</h3>
            <span className="pq-vip-badge">⭐ VIP</span>
          </div>
          
          <div className="pq-locked-box">
            <div className="pq-lock-icon">🚜</div>
            <h4>Доступно с VIP-статусом</h4>
            <p>Добавляйте свою спецтехнику, привязывайте к объектам и сдавайте в аренду напрямую</p>
            <button 
              className="pq-btn-vip" 
              onClick={() => {
                setVipModalType('equipment');
                setShowVipModal(true);
              }}
            >
              ⭐ Подключить VIP
            </button>
          </div>
        </div>

        {/* 5. My Brigades (VIP Demo) */}
        <div className="pq-card">
          <div className="pq-card-header-flex">
            <h3 className="pq-card-title m-0">👷 Мои бригады</h3>
            <span className="pq-vip-badge">⭐ VIP</span>
          </div>
          
          <div className="pq-locked-box">
            <div className="pq-lock-icon">🏗️</div>
            <h4>Доступно с VIP-статусом</h4>
            <p>Управляйте своими проверенными бригадами, назначайте прорабов и распределяйте этапы</p>
            <button 
              className="pq-btn-vip" 
              onClick={() => {
                setVipModalType('brigade');
                setShowVipModal(true);
              }}
            >
              ⭐ Подключить VIP
            </button>
          </div>
        </div>

      </div>

      {/* Sticky Action Footer */}
      <div className="pq-footer">
        <button className="pq-btn-dark" onClick={handleClear}>🗑️ Очистить</button>
        <button className="pq-btn-primary" onClick={handleSave}>
          💾 Сохранить анкету
        </button>
      </div>

      {/* VIP Interactive Modal */}
      {showVipModal && (
        <div className="pq-modal-overlay" onClick={() => setShowVipModal(false)}>
          <div className="pq-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="pq-modal-close" onClick={() => setShowVipModal(false)}>✕</button>
            <div className="pq-modal-vip-icon">⭐</div>
            <h3>Подключение VIP-доступа</h3>
            <p>
              {vipModalType === 'equipment' 
                ? 'Получите неограниченную возможность размещать личный автопарк техники, отслеживать GPS и принимать заказы без комиссии.' 
                : 'Управляйте до 15 бригадами одновременно, формируйте автоматические наряды-допуски и ведите финансовый отчёт.'}
            </p>
            <div className="pq-vip-features">
              <div className="pq-vip-feat-item">✔ Приоритет в выдаче заказчикам</div>
              <div className="pq-vip-feat-item">✔ Личный менеджер 24/7</div>
              <div className="pq-vip-feat-item">✔ Экспорт смет в Excel и 1С</div>
            </div>
            <button 
              className="pq-btn-vip-action"
              onClick={() => {
                setShowVipModal(false);
                showToast('🎉 Подписка VIP успешно активирована!');
              }}
            >
              🚀 Активировать VIP за 4 990 ₸ / мес
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
