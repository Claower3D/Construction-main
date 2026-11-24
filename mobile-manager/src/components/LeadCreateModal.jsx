import React, { useState, useCallback, useEffect } from 'react';
import './LeadCreateModal.css';
import WorkPicker from './WorkPicker';
import { findWork, groupOfWork } from './workCatalog';
import VoiceLeadInput from './VoiceLeadInput';
import { genId, genLeadNum, localDateISO, makeNote, parseBudget } from '../api/syncCore';

export default function LeadCreateModal({ onClose, onCreateDeal, initialDate = '', initialTime = '' }) {
  const [leadData, setLeadData] = useState({
    clientName: '',
    phone: '',
    service: 'Установка септика',
    budget: '',
    address: '',
    date: initialDate || '',
    time: initialTime || '',
    notes: '',
    category: '',
    dateEnd: ''
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

    const numBudget = parseBudget(leadData.budget);
    const dateStr = leadData.date || localDateISO();
    // Период «с — по»: одинаковые даты — это один день, перепутанные ставим по порядку
    let dateEnd = leadData.dateEnd || '';
    let dateFrom = dateStr;
    if (dateEnd && dateEnd < dateFrom) [dateFrom, dateEnd] = [dateEnd, dateFrom];
    if (dateEnd === dateFrom) dateEnd = '';
    const known = findWork(leadData.service);
    const category = known ? known.group : (leadData.category || groupOfWork(leadData.service));

    // Determine direction / role (only roles known to ROLE_CONFIG)
    let role = 'lead';
    const sLower = (leadData.service || '').toLowerCase();
    if (sLower.includes('экспертиз') || sLower.includes('псд')) role = 'engineer';
    else if (sLower.includes('аренда')) role = 'machinery';
    else if (sLower.includes('ремонт') || sLower.includes('отделк') || sLower.includes('электро') || sLower.includes('кровел')) role = 'executor';

    const clientTitle = (leadData.clientName || '').trim() || 'Новый клиент';
    const serviceTitle = leadData.service || 'Установка септика';
    const fullTitle = `${serviceTitle} (${clientTitle})`;

    const newDeal = {
      id: genId('m'),            // globally unique (timestamp + random), not a 4-digit number
      leadNum: genLeadNum(),     // short number for display only
      title: fullTitle,
      client: clientTitle,
      contractor: clientTitle,
      phone: (leadData.phone || '').trim(),
      location: (leadData.address || '').trim(),
      budget: numBudget,
      status: 'Новые',
      role,
      date: dateFrom,
      ...(dateEnd ? { dateEnd, workStart: dateFrom, workEnd: dateEnd } : {}),
      ...(category ? { category } : {}),
      service: serviceTitle,
      time: leadData.time || '12:00',
      priority: numBudget >= 3000000 ? 'high' : 'normal',
      notes: [makeNote(leadData.notes || 'Создано через форму «Создание Лида»', 'Менеджер')]
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
              <WorkPicker
                value={leadData.service}
                onChange={(name, group) => setLeadData(prev => ({ ...prev, service: name, category: group }))}
              />
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
              <span className="lead-modal-label">📅 Дата начала</span>
              <input 
                type="date" 
                name="date" 
                value={leadData.date} 
                onChange={handleChange} 
                className="lead-modal-input" 
                aria-label="Дата начала"
              />
            </div>

            <div className="lead-modal-field">
              <span className="lead-modal-label">🏁 Дата окончания</span>
              <input 
                type="date" 
                name="dateEnd" 
                value={leadData.dateEnd} 
                min={leadData.date || undefined}
                onChange={handleChange} 
                className="lead-modal-input" 
                aria-label="Дата окончания"
              />
              <span className="lead-modal-hint">Если работы на несколько дней. На один день — оставьте пустым.</span>
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
