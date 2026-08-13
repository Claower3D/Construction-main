import React, { useState, useMemo } from 'react';
import './ContractorsCatalogPage.css';

export default function ContractorsCatalogPage({ onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'master' | 'company'
  const [availableOnly, setAvailableOnly] = useState(false);
  const [withReviewsOnly, setWithReviewsOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('rating_desc'); // 'rating_desc' | 'rating_asc'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  
  // Interactive States
  const [favorites, setFavorites] = useState([1, 4]); // list of item ids
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const specialtyChips = [
    { id: 'all', label: '🪄 Все специалисты' },
    { id: 'general', label: '🏗️ Генподрядчик' },
    { id: 'plumber', label: '🔧 Сантехник' },
    { id: 'electrician', label: '⚡ Электрик' },
    { id: 'painter', label: '🎨 Маляр' },
    { id: 'tiler', label: '🏠 Плиточник' },
    { id: 'welder', label: '🔥 Сварщик' },
    { id: 'carpenter', label: '🪵 Плотник / Столяр' },
    { id: 'roofer', label: '🏚️ Кровельщик' },
    { id: 'concrete', label: '🧱 Бетонщик' },
    { id: 'hvac', label: '❄️ Отопление / Вентиляция' },
    { id: 'demolition', label: '💥 Демонтажник' },
    { id: 'landscaper', label: '🌳 Благоустройство' },
    { id: 'designer', label: '✏️ Дизайнер интерьера' },
    { id: 'architect', label: '📐 Архитектор / Проектировщик' },
    { id: 'surveyor', label: '📏 Геодезист / Замерщик' },
    { id: 'finishing', label: '✨ Отделочник под ключ' },
    { id: 'facade', label: '🏢 Фасадчик' },
    { id: 'window', label: '🚪 Окна / Двери' },
    { id: 'flooring', label: '🟫 Напольные покрытия' },
    { id: 'drywall', label: '📐 Гипсокартонщик' }
  ];

  const contractorsList = [
    {
      id: 1,
      name: 'БригадаАстана',
      initials: 'БР',
      gradient: 'linear-gradient(135deg, #a855f7, #ec4899)',
      type: 'company',
      typeLabel: 'КОМПАНИЯ',
      subtitle: 'БригадаАстана',
      rating: 4.9,
      reviewsCount: 42,
      specialties: [
        { id: 'plumber', label: '🔧 Сантехник' },
        { id: 'hvac', label: '❄️ Отопление / Вентиляция' }
      ],
      description: 'Опытный специалист в сфере строительства. Более 8 лет опыта. Выполняем подряды любой сложности.',
      city: 'Шымкент',
      isAvailable: false,
      tier: 'Стандарт',
      tierBadge: '🥈 Стандарт',
      phone: '+7 (701) 555-01-11',
      experience: '8 лет',
      completedProjects: 64
    },
    {
      id: 2,
      name: 'Мастер на все руки',
      initials: 'МА',
      gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
      type: 'company',
      typeLabel: 'КОМПАНИЯ',
      subtitle: 'Частный мастер',
      rating: 4.7,
      reviewsCount: 18,
      specialties: [
        { id: 'plumber', label: '🔧 Сантехник' },
        { id: 'painter', label: '🎨 Маляр' }
      ],
      description: 'Опытный специалист в сфере строительства. Более 4 лет опыта. Быстрый выезд на замер.',
      city: 'Астана',
      isAvailable: true,
      tier: 'Стандарт',
      tierBadge: '🥈 Стандарт',
      phone: '+7 (702) 444-22-33',
      experience: '4 года',
      completedProjects: 28
    },
    {
      id: 3,
      name: 'ЮжСтрой',
      initials: 'ЮЖ',
      gradient: 'linear-gradient(135deg, #d946ef, #8b5cf6)',
      type: 'company',
      typeLabel: 'КОМПАНИЯ',
      subtitle: 'ЮжСтрой',
      rating: 4.6,
      reviewsCount: 89,
      specialties: [
        { id: 'finishing', label: '✨ Отделочник под ключ' },
        { id: 'hvac', label: '❄️ Отопление / Вентиляция' },
        { id: 'designer', label: '✏️ Дизайнер интерьера' }
      ],
      description: 'Опытный специалист в сфере строительства. Более 17 лет опыта. Полный цикл работ по СНиП РК.',
      city: 'Алматы',
      isAvailable: false,
      tier: 'Премиум',
      tierBadge: '🥇 Премиум',
      phone: '+7 (777) 123-45-67',
      experience: '17 лет',
      completedProjects: 140
    },
    {
      id: 4,
      name: 'ТехноСтрой',
      initials: 'ТЕ',
      gradient: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
      type: 'company',
      typeLabel: 'КОМПАНИЯ',
      subtitle: 'ТехноСтрой',
      rating: 4.4,
      reviewsCount: 31,
      specialties: [
        { id: 'facade', label: '🏢 Фасадчик' },
        { id: 'landscaper', label: '🌳 Благоустройство' },
        { id: 'electrician', label: '⚡ Электрик' }
      ],
      description: 'Опытный специалист в сфере строительства. Более 5 лет опыта. Лицензия СРО и гарантия 3 года.',
      city: 'Алматы',
      isAvailable: true,
      tier: 'Эконом',
      tierBadge: '🥉 Эконом',
      phone: '+7 (705) 888-99-00',
      experience: '5 лет',
      completedProjects: 45
    },
    {
      id: 5,
      name: 'Алибек Нурланов',
      initials: 'АЛ',
      gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
      type: 'master',
      typeLabel: 'МАСТЕР',
      subtitle: 'Частный специалист',
      rating: 4.3,
      reviewsCount: 15,
      specialties: [
        { id: 'demolition', label: '💥 Демонтажник' },
        { id: 'general', label: '🏗️ Генподрядчик' },
        { id: 'plumber', label: '🔧 Сантехник' }
      ],
      description: 'Опытный специалист в сфере строительства. Более 11 лет опыта. Качественный демонтаж и монтаж.',
      city: 'Астана',
      isAvailable: false,
      tier: 'Стандарт',
      tierBadge: '🥈 Стандарт',
      phone: '+7 (700) 333-22-11',
      experience: '11 лет',
      completedProjects: 72
    },
    {
      id: 6,
      name: 'Серик Каримов',
      initials: 'СЕ',
      gradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      type: 'master',
      typeLabel: 'МАСТЕР',
      subtitle: 'Частный мастер',
      rating: 4.3,
      reviewsCount: 24,
      specialties: [
        { id: 'flooring', label: '🪵 Напольные покрытия' },
        { id: 'electrician', label: '⚡ Электрик' }
      ],
      description: 'Опытный специалист в сфере строительства. Более 9 лет опыта. Профессиональный монтаж электрики.',
      city: 'Актобе',
      isAvailable: false,
      tier: 'Стандарт',
      tierBadge: '🥈 Стандарт',
      phone: '+7 (771) 999-88-77',
      experience: '9 лет',
      completedProjects: 53
    },
    {
      id: 7,
      name: 'ТОО «QazStroyGroup»',
      initials: 'QS',
      gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      type: 'company',
      typeLabel: 'КОМПАНИЯ',
      subtitle: 'Генподрядная организация',
      rating: 5.0,
      reviewsCount: 112,
      specialties: [
        { id: 'general', label: '🏗️ Генподрядчик' },
        { id: 'concrete', label: '🧱 Бетонщик' },
        { id: 'roofer', label: '🏚️ Кровельщик' }
      ],
      description: 'Крупная строительная компания. Строительство жилых комплексов и коммерческих зданий "под ключ".',
      city: 'Караганда',
      isAvailable: true,
      tier: 'Премиум',
      tierBadge: '🥇 Премиум',
      phone: '+7 (7212) 50-60-70',
      experience: '14 лет',
      completedProjects: 210
    },
    {
      id: 8,
      name: 'Ержан Сварочные Работы',
      initials: 'ЕС',
      gradient: 'linear-gradient(135deg, #f97316, #eab308)',
      type: 'master',
      typeLabel: 'МАСТЕР',
      subtitle: 'Сварщик 6 разряда',
      rating: 4.8,
      reviewsCount: 37,
      specialties: [
        { id: 'welder', label: '🔥 Сварщик' },
        { id: 'fence', label: '🚧 Заборы / Ворота' }
      ],
      description: 'Аттестованный НАКС сварщик. Изготовление металлоконструкций, ангаров, навесов и ворот любой сложности.',
      city: 'Алматы',
      isAvailable: true,
      tier: 'Стандарт',
      tierBadge: '🥈 Стандарт',
      phone: '+7 (708) 777-66-55',
      experience: '12 лет',
      completedProjects: 95
    }
  ];

  // Dynamic Filtering Logic
  const filteredContractors = useMemo(() => {
    let result = contractorsList.filter(c => {
      // 1. Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesCity = c.city.toLowerCase().includes(q);
        const matchesDesc = c.description.toLowerCase().includes(q);
        const matchesSpec = c.specialties.some(s => s.label.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesDesc && !matchesSpec) return false;
      }

      // 2. Specialty Filter
      if (selectedSpecialty !== 'all') {
        const hasSpec = c.specialties.some(s => s.id === selectedSpecialty);
        if (!hasSpec) return false;
      }

      // 3. Type Filter (Master / Company)
      if (typeFilter !== 'all' && c.type !== typeFilter) return false;

      // 4. Availability Filter
      if (availableOnly && !c.isAvailable) return false;

      // 5. Reviews Filter
      if (withReviewsOnly && c.reviewsCount === 0) return false;

      return true;
    });

    // Sort order
    if (sortOrder === 'rating_desc') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortOrder === 'rating_asc') {
      result.sort((a, b) => a.rating - b.rating);
    }

    return result;
  }, [searchQuery, selectedSpecialty, typeFilter, availableOnly, withReviewsOnly, sortOrder]);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const exists = prev.includes(id);
      const updated = exists ? prev.filter(fId => fId !== id) : [...prev, id];
      showToast(exists ? '💔 Удалено из избранного' : '❤️ Добавлено в избранное');
      return updated;
    });
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Stats calculation
  const totalCount = contractorsList.length;
  const availableCount = contractorsList.filter(c => c.isAvailable).length;
  const companyCount = contractorsList.filter(c => c.type === 'company').length;
  const avgRating = (contractorsList.reduce((acc, c) => acc + c.rating, 0) / totalCount).toFixed(1);

  return (
    <div className="cc-container">
      {/* Toast Notification */}
      {toastMessage && <div className="cc-toast">{toastMessage}</div>}

      {/* Top Header Bar */}
      <div className="cc-header-bar">
        <button className="cc-back-btn" onClick={onBack} title="Вернуться назад">←</button>
        <div className="cc-header-title-wrap">
          <div className="cc-title-flex">
            <span className="cc-header-icon">🔍</span>
            <h2>Каталог подрядчиков</h2>
          </div>
          <span className="cc-header-subtitle">Найдите надёжного мастера или компанию для вашего проекта</span>
        </div>

        <button 
          className="cc-btn-add-contractor"
          onClick={() => setShowAddModal(true)}
        >
          ➕ Добавить анкету
        </button>
      </div>

      <div className="cc-content">

        {/* 4 Stat KPI Cards */}
        <div className="cc-kpi-grid">
          <div className="cc-kpi-card">
            <div className="cc-kpi-icon yellow">👷</div>
            <div>
              <div className="cc-kpi-value">{totalCount}</div>
              <div className="cc-kpi-label">Подрядчиков</div>
            </div>
          </div>

          <div className="cc-kpi-card">
            <div className="cc-kpi-icon green">✅</div>
            <div>
              <div className="cc-kpi-value">{availableCount}</div>
              <div className="cc-kpi-label">Доступны</div>
            </div>
          </div>

          <div className="cc-kpi-card">
            <div className="cc-kpi-icon cyan">🏢</div>
            <div>
              <div className="cc-kpi-value">{companyCount}</div>
              <div className="cc-kpi-label">Компании</div>
            </div>
          </div>

          <div className="cc-kpi-card">
            <div className="cc-kpi-icon gold">⭐</div>
            <div>
              <div className="cc-kpi-value">{avgRating}</div>
              <div className="cc-kpi-label">Рейтинг</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="cc-search-box">
          <span className="cc-search-icon">🔍</span>
          <input 
            type="text" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Поиск: имя, услуга, город... (например, «электрик Алматы»)" 
          />
          {searchQuery && (
            <button className="cc-clear-search" onClick={() => setSearchQuery('')}>✕</button>
          )}
        </div>

        {/* Specialty Chips Carousel */}
        <div className="cc-chips-scroll">
          {specialtyChips.map(chip => (
            <button 
              key={chip.id}
              className={`cc-chip ${selectedSpecialty === chip.id ? 'active' : ''}`}
              onClick={() => setSelectedSpecialty(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Filter Toggles Row & Layout Switch */}
        <div className="cc-filters-bar">
          <div className="cc-filters-left">
            <button 
              className={`cc-filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              Все
            </button>
            <button 
              className={`cc-filter-btn ${typeFilter === 'master' ? 'active' : ''}`}
              onClick={() => setTypeFilter('master')}
            >
              👤 Мастер
            </button>
            <button 
              className={`cc-filter-btn ${typeFilter === 'company' ? 'active' : ''}`}
              onClick={() => setTypeFilter('company')}
            >
              🏢 Компания
            </button>
            <button 
              className={`cc-filter-btn ${availableOnly ? 'active green-glow' : ''}`}
              onClick={() => setAvailableOnly(!availableOnly)}
            >
              🟢 Доступен сейчас
            </button>
            <button 
              className={`cc-filter-btn ${withReviewsOnly ? 'active' : ''}`}
              onClick={() => setWithReviewsOnly(!withReviewsOnly)}
            >
              💬 С отзывами
            </button>
            <select 
              value={sortOrder} 
              onChange={e => setSortOrder(e.target.value)}
              className="cc-sort-select"
            >
              <option value="rating_desc">⭐ Рейтинг ↓</option>
              <option value="rating_asc">⭐ Рейтинг ↑</option>
            </select>
          </div>

          <div className="cc-layout-toggle">
            <button 
              className={`cc-layout-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Сетка"
            >
              ▦
            </button>
            <button 
              className={`cc-layout-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Список"
            >
              ≡
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="cc-results-count">
          Найдено: <strong>{filteredContractors.length}</strong> подрядчиков
        </div>

        {/* Contractor Cards Grid / List */}
        {filteredContractors.length === 0 ? (
          <div className="cc-empty-state">
            <span className="cc-empty-icon">🔍</span>
            <h3>Подрядчики не найдены</h3>
            <p>Попробуйте изменить запрос или сбросить фильтры.</p>
            <button 
              className="cc-btn-reset"
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('all');
                setTypeFilter('all');
                setAvailableOnly(false);
                setWithReviewsOnly(false);
              }}
            >
              🔄 Сбросить все фильтры
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'cc-cards-grid' : 'cc-cards-list'}>
            {filteredContractors.map(contractor => {
              const isFav = favorites.includes(contractor.id);
              return (
                <div 
                  key={contractor.id} 
                  className="cc-card"
                  onClick={() => setSelectedContractor(contractor)}
                >
                  {/* Top Header */}
                  <div className="cc-card-top">
                    <div className="cc-avatar-flex">
                      <div 
                        className="cc-avatar-circle" 
                        style={{ background: contractor.gradient }}
                      >
                        {contractor.initials}
                      </div>

                      <div className="cc-title-info">
                        <div className="cc-name-flex">
                          <h4>{contractor.name}</h4>
                        </div>
                        <span className={`cc-type-badge ${contractor.type}`}>
                          {contractor.typeLabel}
                        </span>
                      </div>
                    </div>

                    <button 
                      className={`cc-fav-btn ${isFav ? 'active' : ''}`}
                      onClick={(e) => toggleFavorite(contractor.id, e)}
                      title={isFav ? "Удалить из избранного" : "В избранное"}
                    >
                      {isFav ? '❤️' : '🤍'}
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="cc-rating-row">
                    <span className="cc-stars">★★★★★</span>
                    <span className="cc-rating-num">{contractor.rating}</span>
                    <span className="cc-reviews-count">({contractor.reviewsCount})</span>
                  </div>

                  {/* Specialty Tags */}
                  <div className="cc-tags-wrap">
                    {contractor.specialties.map((spec, sIdx) => (
                      <span key={sIdx} className="cc-tag-pill">
                        {spec.label}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="cc-card-desc">{contractor.description}</p>

                  {/* Footer Stats Row */}
                  <div className="cc-card-footer">
                    <span className="cc-footer-item">📍 {contractor.city}</span>
                    
                    <span className={`cc-status-dot ${contractor.isAvailable ? 'available' : 'busy'}`}>
                      {contractor.isAvailable ? '🟢 Доступен' : '🔴 Занят'}
                    </span>

                    <span className="cc-tier-badge">
                      {contractor.tierBadge}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Contractor Profile Modal Drawer */}
      {selectedContractor && (
        <div className="cc-modal-overlay" onClick={() => setSelectedContractor(null)}>
          <div className="cc-modal-card" onClick={e => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => setSelectedContractor(null)}>✕</button>
            
            {/* Header */}
            <div className="cc-modal-header">
              <div className="cc-avatar-circle large" style={{ background: selectedContractor.gradient }}>
                {selectedContractor.initials}
              </div>
              <div className="cc-modal-header-info">
                <h2>{selectedContractor.name}</h2>
                <div className="cc-modal-sub-flex">
                  <span className={`cc-type-badge ${selectedContractor.type}`}>
                    {selectedContractor.typeLabel}
                  </span>
                  <span>· {selectedContractor.city}</span>
                  <span className={`cc-status-dot ${selectedContractor.isAvailable ? 'available' : 'busy'}`}>
                    · {selectedContractor.isAvailable ? '🟢 Доступен' : '🔴 Занят'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rating & Truthfulness Card */}
            <div className="cc-m-rating-card">
              <div className="cc-m-rating-top">
                <span className="cc-m-rating-num">{selectedContractor.rating}</span>
                <div>
                  <div className="cc-stars">★★★★★</div>
                  <div className="cc-m-reviews-sub">{selectedContractor.reviewsCount} отзывов</div>
                </div>
              </div>

              <div className="cc-truth-row">
                <div className="cc-truth-label">
                  Правдивость: <span>{selectedContractor.truthPercent || '94%'}</span>
                </div>
                <div className="cc-truth-track">
                  <div className="cc-truth-fill" style={{ width: selectedContractor.truthPercent || '94%' }}></div>
                </div>
              </div>
            </div>

            <div className="cc-modal-body">
              {/* 📝 О СЕБЕ */}
              <div className="cc-modal-section">
                <h4>📝 О СЕБЕ</h4>
                <p>{selectedContractor.description}</p>
              </div>

              {/* 🛠️ СПЕЦИАЛИЗАЦИЯ */}
              <div className="cc-modal-section mt-3">
                <h4>🛠️ СПЕЦИАЛИЗАЦИЯ</h4>
                <div className="cc-tags-wrap">
                  {selectedContractor.specialties.map((s, idx) => (
                    <span key={idx} className="cc-tag-pill active-pill">
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* 💼 УСЛОВИЯ (4 Grid Box Cards) */}
              <div className="cc-modal-section mt-3">
                <h4>💼 УСЛОВИЯ</h4>
                <div className="cc-conditions-grid">
                  <div className="cc-cond-card">
                    <span className="cc-cond-icon">💰</span>
                    <div>
                      <div className="cc-cond-label">Уровень цен</div>
                      <div className="cc-cond-val">{selectedContractor.tier}</div>
                    </div>
                  </div>

                  <div className="cc-cond-card">
                    <span className="cc-cond-icon">📋</span>
                    <div>
                      <div className="cc-cond-label">Мин. заказ</div>
                      <div className="cc-cond-val">{selectedContractor.minOrder || '20 000 ₸'}</div>
                    </div>
                  </div>

                  <div className="cc-cond-card">
                    <span className="cc-cond-icon">🛡️</span>
                    <div>
                      <div className="cc-cond-label">Гарантия</div>
                      <div className="cc-cond-val">{selectedContractor.guarantee || '12 мес.'}</div>
                    </div>
                  </div>

                  <div className="cc-cond-card">
                    <span className="cc-cond-icon">📅</span>
                    <div>
                      <div className="cc-cond-label">Начало работ</div>
                      <div className="cc-cond-val">{selectedContractor.startTime || 'Завтра'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 📞 КОНТАКТЫ */}
              <div className="cc-modal-section mt-3">
                <h4>📞 КОНТАКТЫ</h4>
                <div className="cc-contacts-list">
                  <div className="cc-contact-row" onClick={() => showToast(`📞 Звонок: ${selectedContractor.phone}`)}>
                    <span className="cc-contact-icon">📱</span>
                    <span>{selectedContractor.phone}</span>
                  </div>
                  <div className="cc-contact-row">
                    <span className="cc-contact-icon">✉️</span>
                    <span>{selectedContractor.email || `contact@${selectedContractor.name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'stroy'}.kz`}</span>
                  </div>
                  <div className="cc-contact-row">
                    <span className="cc-contact-icon">📍</span>
                    <span>{selectedContractor.city} · Радиус 25 км</span>
                  </div>
                </div>
              </div>

              {/* 💬 ОТЗЫВЫ */}
              <div className="cc-modal-section mt-3">
                <h4>💬 ОТЗЫВЫ ({selectedContractor.reviewsCount})</h4>
                <div className="cc-empty-reviews">
                  {selectedContractor.reviewsCount === 0 ? 'Пока нет отзывов' : `⭐ ${selectedContractor.rating}/5 на основе ${selectedContractor.reviewsCount} проверенных объектов`}
                </div>
              </div>

            </div>

            {/* Footer Action Buttons */}
            <div className="cc-modal-actions-bar">
              <button 
                className="cc-btn-invite"
                onClick={() => showToast(`📥 Приглашение на проект отправлено contractor: ${selectedContractor.name}`)}
              >
                📥 Пригласить на проект
              </button>

              <button 
                className={`cc-btn-fav-modal ${favorites.includes(selectedContractor.id) ? 'active' : ''}`}
                onClick={(e) => toggleFavorite(selectedContractor.id, e)}
              >
                {favorites.includes(selectedContractor.id) ? '❤️ В избранном' : '🤍 В избранное'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Contractor Modal */}
      {showAddModal && (
        <div className="cc-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="cc-modal-card" onClick={e => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            <h3>➕ Добавить анкету подрядчика</h3>
            <p className="cc-modal-sub-text">Разместите свою карточку в каталоге для получения заказов</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              setShowAddModal(false);
              showToast('🎉 Ваша анкета отправлена на модерацию!');
            }}>
              <div className="cc-form-group">
                <label>Имя мастера / Название компании <span>*</span></label>
                <input type="text" required placeholder="например, ТОО 'КазСтрой' или Арман Касымов" className="cc-input" />
              </div>

              <div className="cc-form-group mt-3">
                <label>Тип аккаунта <span>*</span></label>
                <select className="cc-input">
                  <option value="master">👤 Частный мастер</option>
                  <option value="company">🏢 Компания (ТОО / ИП)</option>
                </select>
              </div>

              <div className="cc-form-group mt-3">
                <label>Основная специализация <span>*</span></label>
                <input type="text" required placeholder="например, Электрика, Отделка под ключ" className="cc-input" />
              </div>

              <div className="cc-form-group mt-3">
                <label>Телефон <span>*</span></label>
                <input type="text" required placeholder="+7 (7XX) XXX-XX-XX" className="cc-input" />
              </div>

              <button type="submit" className="cc-btn-submit-form mt-4">
                🚀 Опубликовать анкету в каталоге
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
