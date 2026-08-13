import React, { useState } from 'react';
import './SmartDealCreateModal.css';

export default function SmartDealCreateModal({ onClose, onSave, defaultDate }) {
  const [step, setStep] = useState(1);
  const [fileLoaded, setFileLoaded] = useState(false);

  // Step 2 State
  const [clientName, setClientName] = useState('Иван Петров');
  const [clientPhone, setClientPhone] = useState('+7 XXX XXX XXXX');
  const [address, setAddress] = useState('Город, улица, дом');
  const [jobType, setJobType] = useState('Водопровод');

  // Step 3 State (Estimate)
  const [estimateItems, setEstimateItems] = useState([
    { id: 1, name: 'Разработка грунта (траншея)', unit: 'м³', qty: 30, price: 3500, sum: 105000 },
    { id: 2, name: 'Труба ПНД Ø32', unit: 'м.п.', qty: 25, price: 450, sum: 11250 },
    { id: 3, name: 'Песчаная подушка', unit: 'м³', qty: 5, price: 8000, sum: 40000 },
    { id: 4, name: 'Колодец водопроводный', unit: 'шт', qty: 1, price: 85000, sum: 85000 },
    { id: 5, name: 'Врезка', unit: 'компл.', qty: 1, price: 45000, sum: 45000 },
    { id: 6, name: 'Обратная засыпка', unit: 'м³', qty: 25, price: 2000, sum: 50000 },
    { id: 7, name: 'Благоустройство', unit: 'м²', qty: 15, price: 1500, sum: 22500 }
  ]);

  const totalSum = estimateItems.reduce((acc, curr) => acc + curr.sum, 0);

  const handleFinish = () => {
    // Call the parent's onSave to create the calendar event
    const eventPayload = {
      title: `${jobType} - ${clientName}`,
      location: address,
      time: '09:00 - 18:00',
      type: 'object',
      contractor: 'Не назначен',
      status: 'Запланировано',
      deadline: defaultDate,
      stages: [
        { id: 's1', title: '1. Подготовительные работы', deadline: defaultDate, status: 'Запланировано', description: '', photos: [], documents: [] },
        { id: 's2', title: '2. Основные работы', deadline: defaultDate, status: 'Запланировано', description: '', photos: [], documents: [] },
      ],
      photos: [],
      createdBy: 'admin'
    };
    onSave(eventPayload);
  };

  const handleAddRow = () => {
    setEstimateItems([
      ...estimateItems,
      { id: Date.now(), name: 'Новая позиция', unit: 'шт', qty: 1, price: 5000, sum: 5000 }
    ]);
  };

  return (
    <div className="sd-modal-overlay" onClick={onClose}>
      <div className="sd-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sd-modal-header">
          <h3>
            {step === 1 && '📸 Шаг 1: Фото объекта'}
            {step === 2 && '🤖 Шаг 2: AI-Анализ + Клиент'}
            {step === 3 && '📊 Шаг 3: Смета'}
          </h3>
          <button className="sd-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Progress Bar */}
        <div className="sd-progress-bar">
          <div className={`sd-progress-segment ${step >= 1 ? 'active' : ''}`}></div>
          <div className={`sd-progress-segment ${step >= 2 ? 'active' : ''}`}></div>
          <div className={`sd-progress-segment ${step >= 3 ? 'active' : ''}`}></div>
        </div>

        {/* STEP 1: Photo Upload */}
        {step === 1 && (
          <div className="sd-step-content">
            <div className="sd-dropzone" onClick={() => setFileLoaded(!fileLoaded)}>
              <div className="sd-dropzone-icon">📷</div>
              <p>Перетащите фото сюда или <span className="sd-link">выберите файл</span></p>
              <span className="sd-hint">Минимум 1 фото. По фото будет расчёт.</span>
              {fileLoaded && <div className="sd-file-loaded-badge">✅ Фото загружено (design_sketch.jpg)</div>}
            </div>
            
            <button className="sd-btn-orange-gradient w-100" onClick={() => setStep(2)}>
              Загрузите фото
            </button>
          </div>
        )}

        {/* STEP 2: AI + Client info */}
        {step === 2 && (
          <div className="sd-step-content">
            <div className="sd-ai-success-banner">
              <div className="sd-ai-header">
                <span>✅ AI-анализ завершён</span>
                <span>100%</span>
              </div>
              <div className="sd-ai-type">Тип: <strong>Общестроительные работы</strong></div>
            </div>

            <div className="sd-form-group">
              <label>Имя клиента *</label>
              <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="sd-input" />
            </div>
            <div className="sd-form-group">
              <label>Телефон</label>
              <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="sd-input" />
            </div>
            <div className="sd-form-group">
              <label>Адрес объекта *</label>
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} className="sd-input" />
            </div>
            <div className="sd-form-group">
              <label>Тип работ</label>
              <select value={jobType} onChange={e => setJobType(e.target.value)} className="sd-input sd-select">
                <option value="Водопровод">Водопровод</option>
                <option value="Канализация">Канализация</option>
                <option value="Септик">Септик</option>
                <option value="Отопление">Отопление</option>
                <option value="Дренаж">Дренаж</option>
                <option value="Ливнёвка">Ливнёвка</option>
                <option value="Врезка">Врезка</option>
              </select>
            </div>

            <div className="sd-actions-row">
              <button className="sd-btn-dark" onClick={() => setStep(1)}>← Назад</button>
              <button className="sd-btn-orange-gradient flex-1" onClick={() => setStep(3)}>Далее → Смета 📊</button>
            </div>
          </div>
        )}

        {/* STEP 3: Estimate */}
        {step === 3 && (
          <div className="sd-step-content">
            <div className="sd-table-container">
              <table className="sd-estimate-table">
                <thead>
                  <tr>
                    <th>Наименование</th>
                    <th>Ед.</th>
                    <th>Кол</th>
                    <th>Цена</th>
                    <th>Сумма</th>
                  </tr>
                </thead>
                <tbody>
                  {estimateItems.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td className="sd-text-gray">{item.unit}</td>
                      <td>{item.qty}</td>
                      <td>{item.price.toLocaleString()}</td>
                      <td className="sd-text-orange">{item.sum.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="sd-total-row">
                <span className="sd-total-label">Итого</span>
                <span className="sd-total-sum">{totalSum.toLocaleString()} ₸</span>
              </div>
            </div>

            <button className="sd-btn-dark-outline w-100 mb-4" onClick={handleAddRow}>+ Добавить строку</button>

            <div className="sd-actions-row mt-2">
              <button className="sd-btn-dark" onClick={() => setStep(2)}>← Назад</button>
              <button className="sd-btn-orange-gradient flex-1" onClick={handleFinish}>Далее → Назначение 👷</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
