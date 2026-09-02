import React, { useState } from 'react';
import './LeadCreateModal.css';

export default function LeadCreateModal({ onClose, onSave, initialDate = '', initialTime = '' }) {
  const [leadData, setLeadData] = useState({
    clientName: '',
    phone: '',
    service: 'Установка септика',
    budget: 1500000,
    address: '',
    date: initialDate || '',
    time: initialTime || '',
    notes: '',
    files: []
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeadData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setLeadData(prev => ({ ...prev, files: [...prev.files, ...selectedFiles] }));
    }
  };

  const removeFile = (idxToRemove) => {
    setLeadData(prev => ({
      ...prev,
      files: prev.files.filter((_, idx) => idx !== idxToRemove)
    }));
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
          <div className="lead-modal-step-badge">
            <span style={{ fontSize: '1.4rem' }}>✨</span>
          </div>
          <div className="lead-modal-role-info">
            <h3 className="lead-modal-role-title">Создание Лида</h3>
            <p className="lead-modal-role-subtitle">Sales Manager • Прием заявки</p>
          </div>
        </div>

        <div className="lead-modal-body">
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
                  <option value="Другое">Другое...</option>
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
                placeholder="1 500 000"
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

            <div className="lead-modal-field full-width">
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
                rows="3"
              />
            </div>

            <div className="lead-modal-field full-width">
              <span className="lead-modal-label">📎 Медиа и документы</span>
              <div className="lead-modal-file-upload">
                <label className="file-upload-btn">
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange} 
                    style={{ display: 'none' }}
                  />
                  <span>+ Выбрать файлы</span>
                </label>
                
                {leadData.files.length > 0 && (
                  <div className="attached-files-list">
                    {leadData.files.map((file, idx) => (
                      <div key={idx} className="attached-file-item">
                        <span className="file-name">📄 {file.name}</span>
                        <button className="remove-file-btn" onClick={() => removeFile(idx)}>✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lead-modal-footer">
          <button className="lead-modal-submit-btn" onClick={handleSubmit}>
            Создать заявку
          </button>
        </div>
      </div>
    </div>
  );
}
