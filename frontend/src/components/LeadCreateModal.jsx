import React, { useState } from 'react';
import './LeadCreateModal.css';

export default function LeadCreateModal({ onClose, onSave }) {
  const [leadData, setLeadData] = useState({
    clientName: 'Иван Петров',
    phone: '+7 (999) 123-45-67',
    service: 'Установка септика',
    address: 'ул. Центральная, 123',
    date: '14 августа'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeadData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // We send the lead data up
    onSave(leadData);
  };

  return (
    <div className="lead-modal-overlay" onClick={onClose}>
      <div className="lead-modal-container" onClick={e => e.stopPropagation()}>
        <button className="lead-modal-close" onClick={onClose}>✕</button>

        <div className="lead-modal-header">
          <div className="lead-modal-step-badge">1</div>
          <div className="lead-modal-role-info">
            <h3 className="lead-modal-role-title">Sales Manager</h3>
            <p className="lead-modal-role-subtitle">Прием звонка и заявки</p>
          </div>
        </div>

        <div className="lead-modal-body">
          <h4 className="lead-modal-title">Новая заявка (Лид)</h4>
          
          <div className="lead-modal-field">
            <span className="lead-modal-label">Клиент:</span>
            <input 
              type="text" 
              name="clientName" 
              value={leadData.clientName} 
              onChange={handleChange} 
              className="lead-modal-input" 
            />
          </div>

          <div className="lead-modal-field">
            <span className="lead-modal-label">Телефон:</span>
            <input 
              type="text" 
              name="phone" 
              value={leadData.phone} 
              onChange={handleChange} 
              className="lead-modal-input" 
            />
          </div>

          <div className="lead-modal-field">
            <span className="lead-modal-label">Услуга:</span>
            <input 
              type="text" 
              name="service" 
              value={leadData.service} 
              onChange={handleChange} 
              className="lead-modal-input" 
            />
          </div>

          <div className="lead-modal-field">
            <span className="lead-modal-label">Адрес:</span>
            <input 
              type="text" 
              name="address" 
              value={leadData.address} 
              onChange={handleChange} 
              className="lead-modal-input" 
            />
          </div>

          <div className="lead-modal-field">
            <span className="lead-modal-label">Дата:</span>
            <input 
              type="text" 
              name="date" 
              value={leadData.date} 
              onChange={handleChange} 
              className="lead-modal-input" 
            />
          </div>
        </div>

        <button className="lead-modal-submit-btn" onClick={handleSubmit}>
          Сохранить и передать
        </button>

        <div className="lead-modal-status">СТАТУС: ЛИД СОЗДАН</div>
      </div>
    </div>
  );
}
