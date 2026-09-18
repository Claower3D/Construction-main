import React, { useState, useCallback, useEffect } from 'react';
import './LeadCreateModal.css';
import VoiceLeadInput from './VoiceLeadInput';

export default function LeadCreateModal({ onClose, onCreateDeal, initialDate = '', initialTime = '' }) {
  const [leadData, setLeadData] = useState({
    clientName: '',
    phone: '',
    service: 'Установка септика',
    budget: '',
    address: '',
    date: initialDate || '',
    time: initialTime || '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeadData(prev => ({ ...prev, [name]: value }));
  };

  const handleVoiceFields = useCallback((fields) => {
    setLeadData(prev => {
      const updated = { ...prev };
      if (fields.clientName) updated.clientName = fields.clientName;
      if (fields.phone) updated.phone = fields.phone;
      if (fields.service) updated.service = fields.service;
      if (fields.budget) updated.budget = fields.budget;
      if (fields.address) updated.address = fields.address;
      if (fields.notes) updated.notes = fields.notes;
      if (fields.date) updated.date = fields.date;
      return updated;
    });
  }, []);

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!leadData.clientName && !leadData.service) {
      alert('Пожалуйста, укажите имя клиента или услугу');
      return;
    }

    const numBudget = parseInt(String(leadData.budget).replace(/[^0-9]/g, ''), 10) || 0;
    const now = new Date();
    const dateStr = leadData.date || now.toISOString().split('T')[0];

    // Determine direction / role
    let role = 'builder';
    const sLower = (leadData.service || '').toLowerCase();
    if (sLower.includes('экспертиз')) role = 'engineer';
    else if (sLower.includes('ремонт') || sLower.includes('отделк') || sLower.includes('электро')) role = 'executor';

    const clientTitle = (leadData.clientName || '').trim() || 'Новый клиент';
    const serviceTitle = leadData.service || 'Установка септика';
    const fullTitle = `${serviceTitle} (${clientTitle})`;
    const generatedId = String(Math.floor(1000 + Math.random() * 9000));
    const generatedLeadNum = String(Math.floor(10 + Math.random() * 90));

    const newDeal = {
      id: generatedId,
      leadNum: generatedLeadNum,
      title: fullTitle,
      client: clientTitle,
      contractor: clientTitle,
      phone: (leadData.phone || '').trim() || '+7 (701) 555-43-21',
      location: (leadData.address || '').trim() || 'г. Алматы',
      budget: numBudget,
      status: 'Новые',
      role,
      date: dateStr,
      time: leadData.time || '12:00',
      priority: numBudget >= 3000000 ? 'high' : 'normal',
      notes: [
        { 
          text: leadData.notes || 'Создано через форму «Создание Лида»', 
          time: 'Только что', 
          author: 'Менеджер' 
        }
      ],
      rawNotes: leadData.notes || 'Создано через форму «Создание Лида»'
    };

    onCreateDeal(newDeal);
    onClose();
  };

  return (
    <div className="lead-modal-overlay" onClick={onClose}>
      <div className="lead-modal-container" onClick={e => e.stopPropagation()}>
        <button className="lead-modal-close" onClick={onClose}>✕</button>

        {/* Header - Точная копия со скриншота ПК */}
        <div className="lead-modal-header">
          <div className="lead-modal-step-badge">
            <span style={{ fontSize: '1.4rem' }}>✨</span>
          </div>
          <div className="lead-modal-role-info">
            <h3 className="lead-modal-role-title">Создание Лида</h3>
            <p className="lead-modal-role-subtitle">Sales Manager • Прием заявки</p>
          </div>
        </div>

        {/* Body */}
        <div className="lead-modal-body">
          {/* Голосовой ввод (VoiceLeadInput) вверху */}
          <VoiceLeadInput onFieldsExtracted={handleVoiceFields} />

          {/* Форма с полями */}
          <div className="lead-modal-grid">
            <div className="lead-modal-field">
              <span className="lead-modal-label">👤 Клиент</span>
              <input 
                type="text" 
                name="clientName" 
                value={leadData.clientName} 
                onChange={handleChange} 
                className="lead-modal-input"
                placeholder="Имя клиента"
              />
            </div>

            <div className="lead-modal-field">
              <span className="lead-modal-label">📞 Телефон</span>
              <input 
                type="text" 
                name="phone" 
                value={leadData.phone} 
                onChange={handleChange} 
                className="lead-modal-input"
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <div className="lead-modal-field">
              <span className="lead-modal-label">🛠 Услуга</span>
              <div className="select-wrapper">
                <select 
                  name="service" 
                  value={leadData.service} 
                  onChange={handleChange} 
                  className="lead-modal-input" 
                >
                  <option value="Установка септика">Установка септика</option>
                  <option value="Бурение скважины на воду">Бурение скважины на воду</option>
                  <option value="Разработка ПСД">Разработка ПСД</option>
                  <option value="Монтаж HVAC системы">Монтаж HVAC системы</option>
                  <option value="Заливка монолитного фундамента">Заливка монолитного фундамента</option>
                  <option value="Техническая экспертиза">Техническая экспертиза</option>
                  <option value="Аренда спецтехники">Аренда спецтехники</option>
                  <option value="Кровельные работы">Кровельные работы</option>
                  <option value="Ремонт квартиры">Ремонт квартиры</option>
                  <option value="Электромонтаж">Электромонтаж</option>
                  <option value="Другое...">Другое...</option>
                </select>
              </div>
            </div>

            <div className="lead-modal-field">
              <span className="lead-modal-label">💰 Бюджет (₸)</span>
              <input 
                type="number" 
                name="budget" 
                value={leadData.budget} 
                onChange={handleChange} 
                className="lead-modal-input" 
                placeholder="Напр., 1 500 000"
              />
            </div>

            <div className="lead-modal-field">
              <span className="lead-modal-label">📅 Дата</span>
              <input 
                type="date" 
                name="date" 
                value={leadData.date} 
                onChange={handleChange} 
                className="lead-modal-input" 
              />
            </div>

            <div className="lead-modal-field">
              <span className="lead-modal-label">📍 Адрес объекта</span>
              <input 
                type="text" 
                name="address" 
                value={leadData.address} 
                onChange={handleChange} 
                className="lead-modal-input"
                placeholder="Город, улица, дом..."
              />
            </div>

            <div className="lead-modal-field full-width">
              <span className="lead-modal-label">📝 Заметки для инженера</span>
              <textarea 
                name="notes" 
                value={leadData.notes} 
                onChange={handleChange} 
                placeholder="Подробности заявки, особенности объекта, сроки..."
                className="lead-modal-input textarea" 
                rows="2"
              />
            </div>
          </div>

          {/* Синяя кнопка «Создать заявку» */}
          <button 
            type="button" 
            onClick={handleSubmit} 
            className="lead-modal-submit-btn"
          >
            Создать заявку
          </button>
        </div>
      </div>
    </div>
  );
}
