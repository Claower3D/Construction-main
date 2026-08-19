import React, { useState } from 'react';
import './WorkflowDiagramSection.css';

export default function WorkflowDiagramSection({ onAction }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState({
    clientName: 'Иван Петров',
    phone: '+7 (999) 123-45-67',
    service: 'Установка септика',
    address: 'ул. Центральная, 123',
    date: '14 августа',
    notes: '',
    budget: '1 250 000',
    statusText: 'ЛИД СОЗДАН',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrderData(prev => ({ ...prev, [name]: value }));
  };

  const handleManagerSubmit = () => {
    setCurrentStep(2);
    setOrderData(prev => ({ ...prev, statusText: 'ЗАКАЗ У ИСПОЛНИТЕЛЯ' }));
    if (onAction) {
      onAction('CREATE_LEAD', orderData);
    }
  };

  const handleExecutorSubmit = () => {
    setCurrentStep(3);
    setOrderData(prev => ({ ...prev, statusText: 'ЗАКАЗ ПОДТВЕРЖДЕН' }));
    if (onAction) {
      onAction('APPROVE_ESTIMATE', orderData);
    }
  };

  const handleDispatcherSubmit = () => {
    setCurrentStep(4);
    setOrderData(prev => ({ ...prev, statusText: 'ЗАДАЧИ НАЗНАЧЕНЫ' }));
    if (onAction) {
      onAction('DISPATCH_TASKS', orderData);
    }
  };

  const handleCrewStart = () => {
    setOrderData(prev => ({ ...prev, statusText: 'В ПРОЦЕССЕ' }));
    if (onAction) {
      onAction('START_WORK', orderData);
    }
  };

  const handleCrewComplete = () => {
    setCurrentStep(5);
    setOrderData(prev => ({ ...prev, statusText: 'ЗАВЕРШЕНО' }));
    if (onAction) {
      onAction('COMPLETE_WORK', orderData);
    }
  };

  // Helper classes
  const getPanelClass = (stepNum) => {
    if (currentStep === stepNum) return 'workflow-panel panel-active';
    if (currentStep > stepNum) return 'workflow-panel panel-completed';
    return 'workflow-panel panel-locked';
  };

  return (
    <section className="workflow-diagram-section interactive-mode">
      <div className="workflow-header">
        <h2>CRM WORKFLOW <span>&</span> TASK LIFECYCLE</h2>
        <div className="workflow-subtitle" style={{ color: '#00e1ff' }}>Интерактивная демонстрация работы в реальном времени</div>
      </div>

      <div className="workflow-panels-container">
        {/* Panel 1: Sales Manager */}
        <div className={getPanelClass(1) + ' panel-sales'}>
          <div className="panel-header">
            <div className="step-number">1</div>
            <div className="role-info">
              <h3 className="role-title">Sales Manager</h3>
              <p className="role-subtitle">Прием звонка и заявки</p>
            </div>
            <i className="fas fa-headset role-icon"></i>
          </div>

          <div className="mock-ui-card">
            <div className="mock-ui-title">Новая заявка (Лид)</div>
            <div className={`mock-field interactive-field ${currentStep === 1 ? 'active' : 'locked'}`}>
              <span className="mock-field-label">Клиент:</span>
              <input type="text" name="clientName" value={orderData.clientName} onChange={handleChange} disabled={currentStep !== 1} />
            </div>
            <div className={`mock-field interactive-field ${currentStep === 1 ? 'active' : 'locked'}`}>
              <span className="mock-field-label">Телефон:</span>
              <input type="text" name="phone" value={orderData.phone} onChange={handleChange} disabled={currentStep !== 1} />
            </div>
            <div className={`mock-field interactive-field ${currentStep === 1 ? 'active' : 'locked'}`}>
              <span className="mock-field-label">Услуга:</span>
              <input type="text" name="service" value={orderData.service} onChange={handleChange} disabled={currentStep !== 1} />
            </div>
            <div className={`mock-field interactive-field ${currentStep === 1 ? 'active' : 'locked'}`}>
              <span className="mock-field-label">Адрес:</span>
              <input type="text" name="address" value={orderData.address} onChange={handleChange} disabled={currentStep !== 1} />
            </div>
            <div className={`mock-field interactive-field ${currentStep === 1 ? 'active' : 'locked'}`}>
              <span className="mock-field-label">Дата:</span>
              <input type="text" name="date" value={orderData.date} onChange={handleChange} disabled={currentStep !== 1} />
            </div>
            <div className={`mock-field mock-field-textarea interactive-field ${currentStep === 1 ? 'active' : 'locked'}`}>
              <span className="mock-field-label" style={{alignSelf: 'flex-start', marginTop: '4px'}}>Заметки (для инженера):</span>
              <textarea name="notes" placeholder="Опишите проблему, детали доступа..." value={orderData.notes} onChange={handleChange} disabled={currentStep !== 1} rows="2" />
            </div>
          </div>

          {currentStep === 1 ? (
            <button className="action-button btn-blue interactive-btn" onClick={handleManagerSubmit}>
              <i className="fas fa-save"></i> Сохранить и передать
            </button>
          ) : (
            <div className="locked-section" style={{ background: 'rgba(0, 255, 136, 0.1)', borderColor: '#00ff88', color: '#00ff88' }}>
              <i className="fas fa-check-circle locked-icon" style={{ color: '#00ff88' }}></i>
              <span className="locked-text">Данные зафиксированы. Менеджер свободен.</span>
            </div>
          )}

          <div className="status-row">СТАТУС: {currentStep === 1 ? 'ЛИД СОЗДАН' : 'ОБРАБОТАН'}</div>
        </div>

        <div className={`workflow-connector ${currentStep > 1 ? 'active-connector' : ''}`}>
          <i className="fas fa-chevron-right"></i>
        </div>

        {/* Panel 2: Field Engineer (Исполнитель) */}
        <div className={getPanelClass(2) + ' panel-engineer'}>
          <div className="panel-header">
            <div className="step-number">2</div>
            <div className="role-info">
              <h3 className="role-title">Инженер / Сметчик</h3>
              <p className="role-subtitle">Выезд и расчет сметы</p>
            </div>
            <i className="fas fa-hard-hat role-icon"></i>
          </div>

          <div className="mock-ui-card" style={{ flex: 'none' }}>
            <div className="mock-ui-title" style={{ color: currentStep >= 2 ? '#00ff88' : '#64748b' }}>{currentStep >= 2 ? 'Смета #104 сформирована' : 'Ожидает расчет'}</div>
            <div className="mock-field">
              <span className="mock-field-label">Тип работ:</span>
              <span className="mock-field-value">{currentStep >= 2 ? orderData.service : '—'}</span>
            </div>
            <div className="mock-field">
              <span className="mock-field-label">Дата:</span>
              <span className="mock-field-value" style={{ fontSize: '0.75rem' }}>{currentStep >= 2 ? orderData.date : '—'}</span>
            </div>
            <div className={`mock-field interactive-field ${currentStep === 2 ? 'active' : 'locked'}`}>
              <span className="mock-field-label">Стоимость (₸):</span>
              <input type="text" name="budget" value={currentStep >= 2 ? orderData.budget : ''} onChange={handleChange} disabled={currentStep !== 2} />
            </div>
          </div>

          <div className={`mock-ui-card ${currentStep >= 2 ? '' : 'locked'}`} style={{ flex: 'none', opacity: currentStep >= 2 ? 1 : 0.4 }}>
            <div className="mock-ui-title" style={{ marginBottom: '0.5rem' }}>Файлы и фото с объекта</div>
            <div className="photo-gallery">
              <div className="photo-thumb" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1541888081622-1d5423fdf894?auto=format&fit=crop&w=100&q=80)' }}></div>
              <div className="photo-thumb" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1504307651254-35680f356f27?auto=format&fit=crop&w=100&q=80)' }}></div>
              <div className="photo-more">+6</div>
            </div>
          </div>

          {currentStep === 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button className="action-button btn-emerald interactive-btn" onClick={handleExecutorSubmit}>
                <i className="fas fa-check"></i> Клиент одобрил смету
              </button>
              <button className="action-button interactive-btn" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }} onClick={() => alert('Смета скачивается в формате PDF...')}>
                <i className="fas fa-download"></i> Скачать смету (PDF)
              </button>
            </div>
          ) : currentStep > 2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="estimate-badge" style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid #00ff88', color: '#00ff88', marginBottom: 0 }}>
                <i className="fas fa-check-circle"></i> Клиент одобрил смету
              </div>
              <button className="action-button interactive-btn" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => alert('Смета скачивается в формате PDF...')}>
                <i className="fas fa-download"></i> Скачать смету (PDF)
              </button>
            </div>
          ) : (
             <div className="estimate-badge locked" style={{ opacity: 0.5, borderColor: '#334155' }}>
               <i className="fas fa-lock"></i> Ожидает поступления
             </div>
          )}

          <div className="status-row" style={{ marginTop: 'auto' }}>
            СТАТУС: {currentStep === 2 ? 'РАССМОТРЕНИЕ' : (currentStep > 2 ? 'ПРИНЯТ' : 'ОЖИДАЕТ')}
          </div>
        </div>

        <div className={`workflow-connector ${currentStep > 2 ? 'active-connector' : ''}`}>
          <i className="fas fa-chevron-right"></i>
        </div>

        {/* Panel 3: System AI & Executor */}
        <div className={getPanelClass(3) + ' panel-dispatcher'}>
          <div className="panel-header">
            <div className="step-number">3</div>
            <div className="role-info">
              <h3 className="role-title">Исполнитель</h3>
              <p className="role-subtitle">Авто-подбор техники и бригад</p>
            </div>
            <i className="fas fa-robot role-icon"></i>
          </div>

          <div className="mock-ui-card">
            <div className="mock-ui-title" style={{ color: currentStep >= 3 ? '#ffaa00' : '#64748b' }}>Подобранные ресурсы</div>
            
            <div className={`resource-item ${currentStep >= 3 ? 'active' : ''}`}>
              <i className="fas fa-tractor resource-icon"></i>
              <div className="resource-details">
                <div className="resource-name">Экскаватор JCB</div>
                <div className="resource-date"><i className="far fa-calendar-alt"></i> {currentStep >= 3 ? orderData.date : '—'}</div>
              </div>
              <i className={`fas fa-check-circle check-icon ${currentStep >= 3 ? 'active' : ''}`}></i>
            </div>
            
            <div className={`resource-item ${currentStep >= 3 ? 'active' : ''}`}>
              <i className="fas fa-users resource-icon"></i>
              <div className="resource-details">
                <div className="resource-name">Бригада №2</div>
                <div className="resource-date"><i className="far fa-calendar-alt"></i> {currentStep >= 3 ? orderData.date : '—'}</div>
              </div>
              <i className={`fas fa-check-circle check-icon ${currentStep >= 3 ? 'active' : ''}`}></i>
            </div>
          </div>

          {currentStep === 3 ? (
             <button className="action-button btn-amber interactive-btn pulse" onClick={handleDispatcherSubmit} style={{ marginTop: 'auto' }}>
               <i className="fas fa-calendar-check"></i> Выставить график работ
             </button>
          ) : currentStep > 3 ? (
             <div className="estimate-badge" style={{ marginTop: 'auto', background: 'rgba(255, 170, 0, 0.1)', border: '1px solid #ffaa00', color: '#ffaa00' }}>
               <i className="fas fa-calendar-check"></i> График выставлен
             </div>
          ) : null}

          <div className="status-row" style={{ marginTop: 'auto' }}>
            СТАТУС: {currentStep === 3 ? 'ПОДБОР РЕСУРСОВ' : (currentStep > 3 ? 'ЗАДАЧИ НАЗНАЧЕНЫ' : 'ОЖИДАЕТ')}
          </div>
        </div>

        <div className={`workflow-connector ${currentStep > 3 ? 'active-connector' : ''}`}>
          <i className="fas fa-chevron-right"></i>
        </div>

        {/* Panel 4: Field Execution */}
        <div className={getPanelClass(4) + ' panel-crew'}>
          <div className="panel-header">
            <div className="step-number">4</div>
            <div className="role-info">
              <h3 className="role-title">Бригада</h3>
              <p className="role-subtitle">Выполнение</p>
            </div>
            <i className="fas fa-hard-hat role-icon"></i>
          </div>

          <div className="mock-ui-card" style={{ marginTop: '1rem' }}>
            <div className="mock-ui-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: currentStep >= 4 ? '#00e1ff' : '#64748b' }}>
              <span>Детали задачи</span>
              {orderData.statusText === 'В ПРОЦЕССЕ' && (
                <span className="badge-in-progress" style={{ fontSize: '0.65rem', background: 'rgba(255,170,0,0.2)', color: '#ffaa00', padding: '2px 6px', borderRadius: '4px' }}>● В ПРОЦЕССЕ</span>
              )}
              {orderData.statusText === 'ЗАВЕРШЕНО' && (
                <span className="badge-completed" style={{ fontSize: '0.65rem', background: 'rgba(0,255,136,0.2)', color: '#00ff88', padding: '2px 6px', borderRadius: '4px' }}>● ЗАВЕРШЕНО</span>
              )}
            </div>
            <div className="mock-field">
              <i className="fas fa-map-marker-alt" style={{ color: '#64748b', marginRight: '8px', width: '12px' }}></i>
              <span className="mock-field-value" style={{ fontSize: '0.75rem' }}>{currentStep >= 4 ? orderData.address : '—'}</span>
            </div>
            <div className="mock-field">
              <i className="fas fa-tractor" style={{ color: '#64748b', marginRight: '8px', width: '12px' }}></i>
              <span className="mock-field-value" style={{ fontSize: '0.75rem' }}>{currentStep >= 4 ? orderData.service : '—'}</span>
            </div>
            <div className="mock-field">
              <i className="far fa-calendar-alt" style={{ color: '#64748b', marginRight: '8px', width: '12px' }}></i>
              <span className="mock-field-value" style={{ fontSize: '0.75rem' }}>{currentStep >= 4 ? orderData.date : '—'}</span>
            </div>
          </div>

          {currentStep >= 4 && (
            <div className="interactive-actions" style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
               {orderData.statusText !== 'В ПРОЦЕССЕ' && orderData.statusText !== 'ЗАВЕРШЕНО' && (
                 <button className="action-button btn-amber interactive-btn pulse" onClick={handleCrewStart} style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                   <i className="fas fa-play"></i> Начать работу (Приехали)
                 </button>
               )}
               {orderData.statusText === 'В ПРОЦЕССЕ' && (
                 <button className="action-button btn-emerald interactive-btn pulse" onClick={handleCrewComplete} style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                   <i className="fas fa-check-double"></i> Завершить заказ
                 </button>
               )}
               {orderData.statusText === 'ЗАВЕРШЕНО' && (
                 <div className="estimate-badge" style={{ background: 'rgba(0, 255, 136, 0.1)', border: '1px solid #00ff88', color: '#00ff88', textAlign: 'center' }}>
                    <i className="fas fa-flag-checkered"></i> Работа выполнена
                 </div>
               )}
            </div>
          )}

          <div className="status-row" style={{ marginTop: 'auto' }}>
            СТАТУС: {currentStep < 4 ? 'ОЖИДАЕТ' : orderData.statusText}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="workflow-timeline">
        <div className="timeline-line">
           <div className="timeline-progress" style={{ width: `${(Math.min(currentStep, 4) - 1) * 33.33}%`, height: '100%', background: 'linear-gradient(90deg, #00e1ff, #00ff88)', transition: 'width 0.5s ease-in-out' }}></div>
        </div>
        
        <div className={`timeline-step ${currentStep >= 1 ? 'active' : ''}`}>
          <div className="timeline-icon" style={{ color: currentStep >= 1 ? '#00e1ff' : '#64748b', boxShadow: currentStep >= 1 ? '0 0 15px rgba(0,225,255,0.4)' : 'none' }}><i className="fas fa-phone-alt"></i></div>
          <div className="timeline-text" style={{ opacity: currentStep >= 1 ? 1 : 0.5 }}>
            <h4>Прием заявки</h4>
            <p>Фиксация данных</p>
          </div>
        </div>
        <div className={`timeline-step ${currentStep >= 2 ? 'active' : ''}`}>
          <div className="timeline-icon" style={{ color: currentStep >= 2 ? '#00ff88' : '#64748b', boxShadow: currentStep >= 2 ? '0 0 15px rgba(0,255,136,0.4)' : 'none' }}><i className="fas fa-clipboard-check"></i></div>
          <div className="timeline-text" style={{ opacity: currentStep >= 2 ? 1 : 0.5 }}>
            <h4>Выезд инженера</h4>
            <p>Расчет сметы</p>
          </div>
        </div>
        <div className={`timeline-step ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="timeline-icon" style={{ color: currentStep >= 3 ? '#ffaa00' : '#64748b', boxShadow: currentStep >= 3 ? '0 0 15px rgba(255,170,0,0.4)' : 'none' }}><i className="fas fa-cogs"></i></div>
          <div className="timeline-text" style={{ opacity: currentStep >= 3 ? 1 : 0.5 }}>
            <h4>Подбор бригады</h4>
            <p>Назначение техники</p>
          </div>
        </div>
        <div className={`timeline-step ${currentStep >= 4 ? 'active' : ''}`}>
          <div className="timeline-icon" style={{ color: currentStep >= 4 ? '#00e1ff' : '#64748b', boxShadow: currentStep >= 4 ? '0 0 15px rgba(0,225,255,0.4)' : 'none' }}><i className="fas fa-mobile-alt"></i></div>
          <div className="timeline-text" style={{ opacity: currentStep >= 4 ? 1 : 0.5 }}>
            <h4>Выполнение</h4>
            <p>Отметка в приложении</p>
          </div>
        </div>
      </div>
    </section>
  );
}
