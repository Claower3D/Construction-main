import React, { useState, useCallback } from 'react';
import './LeadCreateModal.css';
import VoiceLeadInput from './VoiceLeadInput';
import WorkPicker from './WorkPicker';
import ProposalPanel, { requestProposal } from './ProposalPanel';
import { findWork, groupOfWork } from './workCatalog';

export default function LeadCreateModal({ onClose, onSave, initialDate = '', initialTime = '' }) {
  const [leadData, setLeadData] = useState({
    clientName: '',
    phone: '',
    service: 'Установка септика',
    category: '',
    budget: 1500000,
    address: '',
    date: initialDate || '',
    dateEnd: '',
    time: initialTime || '',
    notes: '',
    files: []
  });

  // КП из заметки: сервер находит в тексте вид работ и объёмы и считает работы, материалы, человеко-часы
  const [proposal, setProposal] = useState(null);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [kp, setKp] = useState({ busy: false, error: '' });
  const buildProposal = async () => {
    setKp({ busy: true, error: '' });
    try {
      const res = await requestProposal({ text: leadData.notes, service: leadData.service, city: (leadData.address || '').split(',')[0].replace(/^г\.?\s*/i, '').trim(), client: leadData.clientName });
      setProposal(res);
      setProposalOpen(true);
      setKp({ busy: false, error: '' });
    } catch (err) {
      setKp({ busy: false, error: `КП не посчиталось: ${err.message}` });
    }
  };

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

  const handleSubmit = () => {
    // Период «с — по»: если даты перепутаны местами, ставим по порядку; одинаковые — это один день
    let { date, dateEnd } = leadData;
    if (date && dateEnd && dateEnd < date) [date, dateEnd] = [dateEnd, date];
    if (dateEnd === date) dateEnd = '';
    const known = findWork(leadData.service);
    const category = known ? known.group : (leadData.category || groupOfWork(leadData.service));
    onSave({ ...leadData, date, dateEnd, category, ...(leadData.proposal ? { proposal: leadData.proposal } : {}) });
  };

  // Listen for voice prefill events from CrmPage
  React.useEffect(() => {
    const handler = (e) => {
      const d = e.detail;
      if (d) {
        setLeadData(prev => ({
          ...prev,
          clientName: d.clientName || prev.clientName,
          phone: d.phone || prev.phone,
          service: d.service || prev.service,
          budget: d.budget || prev.budget,
          address: d.address || prev.address,
          date: d.date || prev.date,
          time: d.time || prev.time,
          notes: d.notes || prev.notes,
        }));
      }
    };
    window.addEventListener('voice_lead_prefill', handler);
    return () => window.removeEventListener('voice_lead_prefill', handler);
  }, []);

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
          <VoiceLeadInput onFieldsExtracted={handleVoiceFields} />
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
                placeholder="1 500 000"
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
              <div className="lead-kp-row">
                <button type="button" className="lead-kp-btn" onClick={buildProposal} disabled={kp.busy || (!leadData.notes.trim() && !leadData.service)}>
                  {kp.busy ? 'Считаю…' : '📄 Сделать КП из заметки'}
                </button>
                {leadData.proposal && (
                  <button type="button" className="lead-kp-btn" onClick={() => { setProposal(leadData.proposal); setProposalOpen(true); }}>
                    ✓ КП прикреплено · {Math.round(leadData.proposal.totals?.totalWithVat || 0).toLocaleString('ru-RU')} ₸
                  </button>
                )}
                <span className={`lead-kp-status${kp.error ? ' is-error' : ''}`} role={kp.error ? 'alert' : undefined}>
                  {kp.error || 'Расчёт материалов, работ и человеко-часов по тексту заметки'}
                </span>
              </div>
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

        {proposalOpen && proposal && (
          <ProposalPanel
            proposal={proposal}
            onClose={() => setProposalOpen(false)}
            onInsert={(p) => { setLeadData(prev => ({ ...prev, proposal: p, budget: Math.round(p.totals?.totalWithVat || prev.budget) })); setProposalOpen(false); }}
          />
        )}

        <div className="lead-modal-footer">
          <button className="lead-modal-submit-btn" onClick={handleSubmit}>
            Создать заявку
          </button>
        </div>
      </div>
    </div>
  );
}
