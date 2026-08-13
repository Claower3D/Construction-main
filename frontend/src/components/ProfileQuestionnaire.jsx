import React, { useState } from 'react';
import './ProfileQuestionnaire.css';

export default function ProfileQuestionnaire({ onBack }) {
  const [clientType, setClientType] = useState('individual'); // 'individual' | 'legal'
  const [selectedProjects, setSelectedProjects] = useState([]);
  
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

  const toggleProject = (id) => {
    setSelectedProjects(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  return (
    <div className="pq-container">
      <div className="pq-header-bar">
        <button className="pq-back-btn" onClick={onBack}>←</button>
        <h2>📋 Моя анкета</h2>
      </div>

      <div className="pq-content">
        
        {/* Progress Bar */}
        <div className="pq-card">
          <div className="pq-progress-header">
            <span>📋 Заполнение анкеты</span>
            <span className="pq-progress-percent">20%</span>
          </div>
          <div className="pq-progress-track">
            <div className="pq-progress-fill" style={{width: '20%'}}></div>
          </div>
          <div className="pq-progress-steps">
            <span className="pq-step active">Контакты</span>
            <span className="pq-step active">Тип клиента</span>
            <span className="pq-step">Проект</span>
            <span className="pq-step">Готово</span>
          </div>
        </div>

        {/* Contacts */}
        <div className="pq-card">
          <h3 className="pq-card-title">👤 Контактные данные</h3>
          
          <div className="pq-avatar-upload">
            <div className="pq-avatar-circle">
              <span className="pq-camera-icon">📷</span>
              <span className="pq-avatar-text">Загрузить фото</span>
            </div>
            <span className="pq-avatar-hint">Фото профиля • JPG, PNG</span>
          </div>

          <div className="pq-form-grid">
            <div className="pq-form-group">
              <label>ФИО <span>*</span></label>
              <input type="text" placeholder="Иванов Иван Иванович" />
            </div>
            <div className="pq-form-group">
              <label>Телефон <span>*</span></label>
              <input type="text" placeholder="+7 (7XX) XXX-XX-XX" />
            </div>
            <div className="pq-form-group">
              <label>Email</label>
              <input type="email" placeholder="your@email.com" />
            </div>
            <div className="pq-form-group">
              <label>Город <span>*</span></label>
              <select defaultValue="">
                <option value="" disabled>Выберите город</option>
                <option value="almaty">Алматы</option>
                <option value="astana">Астана</option>
                <option value="shymkent">Шымкент</option>
              </select>
            </div>
            <div className="pq-form-group pq-col-span-2">
              <label>Адрес проживания</label>
              <input type="text" placeholder="ул. Абая, д. 10, кв. 5" />
            </div>
          </div>
        </div>

        {/* Client Type */}
        <div className="pq-card">
          <h3 className="pq-card-title">🏢 Тип клиента</h3>
          <div className="pq-type-grid">
            <div 
              className={`pq-type-card ${clientType === 'individual' ? 'active' : ''}`}
              onClick={() => setClientType('individual')}
            >
              <div className="pq-type-radio">{clientType === 'individual' && <div className="pq-radio-inner"></div>}</div>
              <div className="pq-type-info">
                <h4>👤 Физическое лицо</h4>
                <p>Частный клиент</p>
              </div>
            </div>
            <div 
              className={`pq-type-card ${clientType === 'legal' ? 'active' : ''}`}
              onClick={() => setClientType('legal')}
            >
              <div className="pq-type-radio">{clientType === 'legal' && <div className="pq-radio-inner"></div>}</div>
              <div className="pq-type-info">
                <h4>🏢 Юридическое лицо</h4>
                <p>ТОО, ИП, АО</p>
              </div>
            </div>
          </div>
        </div>

        {/* Project Interest */}
        <div className="pq-card">
          <h3 className="pq-card-title">📐 Какой проект вас интересует? <span>*</span></h3>
          <div className="pq-pills-container">
            {projectsList.map(proj => (
              <button 
                key={proj.id} 
                className={`pq-pill ${selectedProjects.includes(proj.id) ? 'active' : ''}`}
                onClick={() => toggleProject(proj.id)}
              >
                {proj.label}
              </button>
            ))}
          </div>

          <div className="pq-form-group mt-4">
            <label>Опишите ваш проект</label>
            <textarea rows="4" placeholder="Хотим построить двухэтажный дом 120 м² с гаражом. Земельный участок в р-не Бесагаш..."></textarea>
          </div>

          <div className="pq-alert-info">
            💡 Чем подробнее описание — тем точнее будет расчёт и подбор исполнителей
          </div>
        </div>

        {/* My Equipment (VIP) */}
        <div className="pq-card">
          <div className="pq-card-header-flex">
            <h3 className="pq-card-title m-0">🔧 Моя техника</h3>
            <span className="pq-vip-badge">⭐ VIP</span>
          </div>
          
          <div className="pq-locked-box">
            <div className="pq-lock-icon">🔒</div>
            <h4>Доступно с VIP</h4>
            <p>Добавляйте свою технику и привязывайте к проектам</p>
            <button className="pq-btn-vip">⭐ Подключить VIP</button>
          </div>
        </div>

        {/* My Brigades (VIP) */}
        <div className="pq-card">
          <div className="pq-card-header-flex">
            <h3 className="pq-card-title m-0">👷 Мои бригады</h3>
            <span className="pq-vip-badge">⭐ VIP</span>
          </div>
          
          <div className="pq-locked-box">
            <div className="pq-lock-icon">🔒</div>
            <h4>Доступно с VIP</h4>
            <p>Добавляйте проверенных подрядчиков и бригады</p>
            <button className="pq-btn-vip">⭐ Подключить VIP</button>
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="pq-footer">
        <button className="pq-btn-dark">🗑️ Очистить</button>
        <button className="pq-btn-primary">💾 Сохранить анкету</button>
      </div>
    </div>
  );
}
