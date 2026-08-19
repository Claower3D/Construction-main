import React, { useState } from 'react';

export default function DealCardModal({ card, onClose, onSave, currentUser }) {
  const [formData, setFormData] = useState({ ...card });
  const [expandedStageId, setExpandedStageId] = useState(null);

  const canEdit = currentUser?.role === 'admin' || card.createdBy === currentUser?.id || card.assignedTo === currentUser?.id || !card.createdBy;

  const [allUsers] = useState(() => {
    const defaultUsers = [
      { id: 'u_1', name: 'Ербол Маратов', role: 'engineer' },
      { id: 'u_2', name: 'Ирина Ким', role: 'engineer' },
      { id: 'u_3', name: 'ТОО QazGost', role: 'executor' },
      { id: 'u_4', name: 'Алексей Смирнов', role: 'executor' },
      { id: 'u_5', name: 'Светлана Иванова', role: 'manager' }
    ];
    try {
      const registered = JSON.parse(localStorage.getItem('qazgost_registered_users') || '[]');
      return [...defaultUsers, ...registered];
    } catch(e) {
      return defaultUsers;
    }
  });

  const pipelineStages = [
    { id: 'Новые', label: 'Новая' },
    { id: 'В работе', label: 'В работе' },
    { id: 'Дожим', label: 'Дожим' },
    { id: 'Менеджер ОП', label: 'Менеджер ОП' },
    { id: 'РОП', label: 'РОП' },
    { id: 'Финансист', label: 'Финансист' },
    { id: 'Успешно', label: 'Завершено' },
  ];

  const currentStageIndex = pipelineStages.findIndex(s => s.id === formData.status);
  const activeIndex = currentStageIndex >= 0 ? currentStageIndex : 0;

  const handleAssignToWorker = (role) => {
    try {
      const storageKey = `qazgost_calendar_events_${role}`;
      const savedEvents = localStorage.getItem(storageKey);
      let crmEvents = savedEvents ? JSON.parse(savedEvents) : {};
      
      // Determine day (default to today if missing)
      const day = formData.day || new Date().toISOString().split('T')[0];
      if (!crmEvents[day]) crmEvents[day] = [];
      
      const newEvent = {
        ...formData,
        status: role === 'engineer' ? 'На проверке у инженера' : 'В работе',
        contractor: role === 'engineer' ? 'Отдел ПТО' : 'Исполнитель'
      };
      
      // Prevent duplicates if already exists
      const existingIdx = crmEvents[day].findIndex(e => e.id === formData.id);
      if (existingIdx !== -1) {
        crmEvents[day][existingIdx] = newEvent;
      } else {
        crmEvents[day].push(newEvent);
      }
      localStorage.setItem(storageKey, JSON.stringify(crmEvents));
      
      // Remove from the other role's calendar to avoid ghosts
      try {
        const otherRole = role === 'engineer' ? 'executor' : 'engineer';
        const otherKey = `qazgost_calendar_events_${otherRole}`;
        const otherSaved = localStorage.getItem(otherKey);
        if (otherSaved) {
          let otherEvents = JSON.parse(otherSaved);
          for (const d in otherEvents) {
            otherEvents[d] = otherEvents[d].filter(e => e.id !== formData.id);
          }
          localStorage.setItem(otherKey, JSON.stringify(otherEvents));
        }
      } catch (e) {}

      handleChange('status', 'В работе'); // Update current modal status too
      handleChange('contractor', role === 'engineer' ? 'Отдел ПТО' : 'Исполнитель');
      
      alert(`✅ Успешно! Заявка передана в календарь ${role === 'engineer' ? 'Инженера' : 'Исполнителя'}. Уведомление отправлено.`);
    } catch (err) {
      console.error(err);
      alert('Ошибка при передаче заявки.');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStage = () => {
    const newStages = [...(formData.stages || [])];
    newStages.push({ id: Date.now(), title: '', status: 'В работе' });
    handleChange('stages', newStages);
  };

  const handleStageChange = (index, newTitle) => {
    const newStages = [...(formData.stages || [])];
    newStages[index].title = newTitle;
    handleChange('stages', newStages);
  };

  const handleStageStatusToggle = (index) => {
    const newStages = [...(formData.stages || [])];
    newStages[index].status = newStages[index].status === 'Решено' ? 'В работе' : 'Решено';
    handleChange('stages', newStages);
  };

  const handleRemoveStage = (index) => {
    const newStages = [...(formData.stages || [])];
    newStages.splice(index, 1);
    handleChange('stages', newStages);
  };

  const parseBudget = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 0;
    return 0;
  };

  const hasEstimate = formData.estimateItems && formData.estimateItems.length > 0;
  
  let currentBudget = 0;
  if (hasEstimate) {
    currentBudget = formData.totalSum || 0;
  } else if (formData.budget !== undefined) {
    currentBudget = parseBudget(formData.budget);
  } else {
    currentBudget = formData.title === 'Новая заявка' ? 0 : 
    (formData.type === 'active_project' ? 1250000 : 
    (formData.type === 'work_stage' ? 450000 : 
    (formData.type === 'deadline' ? 820000 : 150000)));
  }

  const formatMoney = (val) => Math.round(val).toLocaleString('ru-RU') + ' ₸';
  const bonus = currentBudget * 0.03;

  const STAT_WIDGETS = [
    { title: 'ЦЕНА ПРОДАЖИ', val: formatMoney(currentBudget), sub: 'итого к клиенту', color: '#22c55e' },
    { title: 'ОЧИЩЕННАЯ СУММА', val: formatMoney(currentBudget * 0.78), sub: 'после налогов/комиссий', color: '#3b82f6' },
    { title: 'СЕБЕСТОИМОСТЬ', val: formatMoney(currentBudget * 0.22), sub: 'базовая себестоимость', color: '#a1a1aa' },
    { title: 'ДОП. РАСХОД', val: formatMoney(currentBudget * 0.04), sub: 'с себестоимостью, без наценки', color: '#f59e0b' },
    { title: 'КОМИССИЯ МАСТЕРУ', val: formatMoney(currentBudget * 0.08), sub: 'доп. процента мастеру', color: '#f59e0b' },
    { title: 'ПРИБЫЛЬ ОЧИЩЕННАЯ', val: formatMoney(currentBudget * 0.44), sub: 'после ФОТ, мастера и банка', color: '#22c55e' },
  ];

  const handleSaveWrapper = () => {
    const finalBudget = hasEstimate ? (formData.totalSum || 0) : currentBudget;
    const finalFormData = { ...formData, budget: `${finalBudget} ₸` };

    // Check for assignment changes
    if (finalFormData.assignedTo && finalFormData.assignedTo !== card.assignedTo) {
      const assignedUser = allUsers.find(u => u.id === finalFormData.assignedTo);
      if (assignedUser) {
        const notifRole = assignedUser.role; // 'engineer' or 'executor'
        const key = `${notifRole}_notifications`;
        const existing = JSON.parse(localStorage.getItem(key) || '[]');
        const newNotif = {
          id: `NOT-${Date.now()}`,
          icon: '🔔',
          title: 'Новая заявка',
          text: `Менеджер назначил вам новую заявку: ${finalFormData.title || 'Без названия'} (№${finalFormData.id || 'NEW'})`,
          time: 'Только что',
          unread: true
        };
        localStorage.setItem(key, JSON.stringify([newNotif, ...existing]));
        window.dispatchEvent(new Event('notifications_updated'));

        // Push to their calendar
        try {
          const storageKey = `qazgost_calendar_events_${notifRole}`;
          const savedEvents = localStorage.getItem(storageKey);
          let calEvents = savedEvents ? JSON.parse(savedEvents) : {};
          const day = finalFormData.day || new Date().toISOString().split('T')[0];
          if (!calEvents[day]) calEvents[day] = [];
          
          const newEvent = {
            ...finalFormData,
            status: notifRole === 'engineer' ? 'На проверке у инженера' : 'В работе',
          };
          
          const existingIdx = calEvents[day].findIndex(e => e.id === finalFormData.id);
          if (existingIdx !== -1) {
            calEvents[day][existingIdx] = newEvent;
          } else {
            calEvents[day].push(newEvent);
          }
          localStorage.setItem(storageKey, JSON.stringify(calEvents));

          // Remove from the other role's calendar
          const otherRole = notifRole === 'engineer' ? 'executor' : 'engineer';
          const otherKey = `qazgost_calendar_events_${otherRole}`;
          const otherSaved = localStorage.getItem(otherKey);
          if (otherSaved) {
            let otherEvents = JSON.parse(otherSaved);
            for (const d in otherEvents) {
              otherEvents[d] = otherEvents[d].filter(e => e.id !== finalFormData.id);
            }
            localStorage.setItem(otherKey, JSON.stringify(otherEvents));
          }
        } catch(e) {
          console.error('Failed to sync calendar', e);
        }
      }
    }
    onSave(finalFormData);
  };

  const baseBudget = parseInt(String(formData.budget || formData.totalPrice || 0).replace(/\D/g, '')) || 0;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.85)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(5px)'
    }}>
      <div style={{
        backgroundColor: '#0a0f18',
        width: '95vw', maxWidth: '1400px', height: '90vh',
        borderRadius: '16px', border: '1px solid #1e293b',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(34,197,94,0.1)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', color: '#fff', fontFamily: 'system-ui, sans-serif'
      }}>
        
        {/* HEADER */}
        <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: 700, letterSpacing: '0.5px' }}>КАРТОЧКА СДЕЛКИ №{formData.id}</h2>
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              border: '1px solid rgba(34, 197, 94, 0.3)', backgroundColor: 'rgba(34, 197, 94, 0.1)',
              padding: '0.4rem 1rem', borderRadius: '20px', color: '#22c55e', fontSize: '0.85rem', fontWeight: 600
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#22c55e' }}/>
              Сделка активна
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#64748b', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
        </div>

        {/* CONTENT (SCROLLABLE) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* TOP SECTION: PIPELINE & ACTION BOX */}
          <div style={{ display: 'flex', gap: '2rem' }}>
            
            {/* PIPELINE */}
            <div style={{ flex: 1, backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.5rem', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', width: '100%', position: 'relative', justifyContent: 'space-between' }}>
                {/* Connecting Line */}
                <div style={{ position: 'absolute', top: '24px', left: '4%', right: '4%', height: '3px', background: 'linear-gradient(to right, #22c55e 30%, #3b82f6 60%, #334155 100%)', zIndex: 1 }} />
                
                {pipelineStages.map((stage, idx) => {
                  const isCompleted = idx < activeIndex;
                  const isActive = idx === activeIndex;
                  let dotColor = '#334155';
                  let iconColor = '#64748b';
                  if (isCompleted) { dotColor = '#22c55e'; iconColor = '#22c55e'; }
                  if (isActive) { dotColor = '#3b82f6'; iconColor = '#3b82f6'; }

                  return (
                    <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, gap: '0.5rem', width: '80px' }}>
                      <div style={{ 
                        width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#0a0f18',
                        border: `2px solid ${dotColor}`, display: 'flex', justifyContent: 'center', alignItems: 'center',
                        boxShadow: isActive ? '0 0 15px rgba(59, 130, 246, 0.5)' : (isCompleted ? '0 0 10px rgba(34, 197, 94, 0.2)' : 'none')
                      }}>
                        {isCompleted && <span style={{ color: '#22c55e', fontSize: '1.2rem' }}>✓</span>}
                        {isActive && <span style={{ color: '#3b82f6', fontSize: '1.2rem' }}>•</span>}
                        {!isCompleted && !isActive && <span style={{ color: '#64748b', fontSize: '1rem' }}>{idx+1}</span>}
                      </div>
                      <span style={{ color: isActive || isCompleted ? '#fff' : '#64748b', fontSize: '0.8rem', fontWeight: isActive ? 600 : 400, textAlign: 'center' }}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ACTION BOX (ПЕРЕДАТЬ СДЕЛКУ) */}
            <div style={{ width: '400px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.2rem' }}>
               <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.8rem', letterSpacing: '1px' }}>ПЕРЕДАТЬ СДЕЛКУ</div>
               <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                 <button onClick={() => handleChange('status', 'Менеджер ОП')} style={{ flex: 1, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid #3b82f6', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>👤 Менеджеру ОП</button>
                 <button onClick={() => handleChange('status', 'РОП')} style={{ flex: 1, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', border: '1px solid #a855f7', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>🛡️ РОПу</button>
                 <button onClick={() => handleChange('status', 'Финансист')} style={{ flex: 1, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}>🪙 Финансисту</button>
               </div>

               <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.8rem', letterSpacing: '1px' }}>НАЗНАЧИТЬ И ОТПРАВИТЬ УВЕДОМЛЕНИЕ</div>
               <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                 <button onClick={() => handleAssignToWorker('engineer')} style={{ flex: 1, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>⚙️ Инженеру</button>
                 <button onClick={() => handleAssignToWorker('executor')} style={{ flex: 1, background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', border: '1px solid #ec4899', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 }}>👷 Исполнителю</button>
               </div>
               
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem', letterSpacing: '1px' }}>НАЗНАЧЕН (ОТВЕТСТВЕННЫЙ)</div>
                    <select 
                       value={formData.assignedTo || ''} 
                       onChange={(e) => {
                         const val = e.target.value;
                         handleChange('assignedTo', val);
                         const user = allUsers.find(u => u.id === val);
                         handleChange('contractor', user ? user.name : 'Не распределено');
                       }}
                       style={{ width: '100%', background: '#0a0f18', color: '#fff', border: '1px solid #1e293b', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }}
                    >
                      <option value="">-- Не назначен --</option>
                      <optgroup label="Инженеры">
                        {allUsers.filter(u => u.role === 'engineer').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="Исполнители">
                        {allUsers.filter(u => u.role === 'executor').map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                 <div style={{ display: 'flex', gap: '0.5rem', flex: 1, alignItems: 'flex-end' }}>
                   <button onClick={() => handleChange('status', 'Успешно')} style={{ flex: 1, background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', border: '1px solid #22c55e', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>✓ Успешно</button>
                   <button onClick={() => handleChange('status', 'Отказ')} style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>✕ Отказ</button>
                 </div>
               </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div style={{ display: 'flex', gap: '2rem' }}>
            
            {/* COLUMN 1: ДАННЫЕ СДЕЛКИ & ЭТАПЫ (From Image 2) */}
            <div style={{ width: '380px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.5rem' }}>
                 <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.2rem', letterSpacing: '1px' }}>ДАННЫЕ СДЕЛКИ</div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                   <div>
                     <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>НАЗВАНИЕ / ИНСПЕКЦИЯ</label>
                     <input type="text" value={formData.title || ''} onChange={(e) => handleChange('title', e.target.value)} style={{ width: '100%', background: '#0a0f18', color: '#fff', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }} />
                   </div>
                   
                   <div style={{ display: 'flex', gap: '1rem' }}>
                     <div style={{ flex: 1 }}>
                       <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>ТЕЛЕФОН</label>
                       <input type="text" value={formData.time || '+7 (707) 555-01-23'} onChange={(e) => handleChange('time', e.target.value)} style={{ width: '100%', background: '#0a0f18', color: '#fff', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }} />
                     </div>
                     <div style={{ flex: 1 }}>
                       <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>АДРЕС / ЛОКАЦИЯ</label>
                       <input type="text" value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} style={{ width: '100%', background: '#0a0f18', color: '#fff', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }} />
                     </div>
                   </div>

                   <div>
                     <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>БЮДЖЕТ (₸) {hasEstimate && '(Сумма из сметы)'}</label>
                     <input type="number" value={currentBudget} disabled={hasEstimate} onChange={(e) => handleChange('budget', e.target.value + ' ₸')} style={{ width: '100%', background: hasEstimate ? '#1e293b' : '#0a0f18', color: '#fff', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', fontSize: '0.9rem' }} />
                   </div>

                   <div style={{ marginTop: '0.5rem', background: 'rgba(34, 197, 94, 0.1)', border: '1px dashed rgba(34, 197, 94, 0.3)', padding: '0.8rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <span style={{ fontSize: '0.8rem', color: '#6ee7b7', fontWeight: 700 }}>🎁 Ваш бонус менеджера (3%)</span>
                     <span style={{ fontSize: '1.1rem', color: '#34d399', fontWeight: 900 }}>{Math.floor(bonus).toLocaleString('ru-RU')} ₸</span>
                   </div>

                   <div>
                     <label style={{ fontSize: '0.7rem', color: '#64748b', display: 'block', marginBottom: '4px' }}>ОСОБЫЕ КОММЕНТАРИИ</label>
                     <textarea rows="3" value={formData.comments || ''} onChange={(e) => handleChange('comments', e.target.value)} style={{ width: '100%', background: '#0a0f18', color: '#fff', border: '1px solid #1e293b', padding: '0.8rem', borderRadius: '8px', fontSize: '0.85rem', resize: 'none' }} placeholder="Связаться в течение дня, предоставить опросный лист..."></textarea>
                   </div>
                 </div>
              </div>

               {/* ФОТО И ДОКУМЕНТЫ */}
               <div style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                   <div style={{ fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '1px' }}>ФАЙЛЫ И ФОТО С ОБЪЕКТА</div>
                   <button style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }} onClick={(e) => { e.preventDefault(); alert('Смета генерируется и скачивается в формате PDF...'); }}>
                     <i className="fas fa-file-pdf"></i> Скачать смету (PDF)
                   </button>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '0.8rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                   {formData.photos && formData.photos.map((p, i) => (
                     <div key={i} style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundImage: p.isImg ? `url(${p.url})` : 'none', backgroundColor: p.isImg ? 'transparent' : '#1e293b', backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid #1e293b', flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }} title={p.name}>
                       {!p.isImg && <span style={{ fontSize: '2rem' }}>{p.preview}</span>}
                     </div>
                   ))}
                   {(!formData.photos || formData.photos.length === 0) && (
                     <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', padding: '0.5rem 0' }}>Нет прикрепленных файлов</div>
                   )}
                   <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: 'rgba(59,130,246,0.1)', border: '1px dashed rgba(59,130,246,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, cursor: 'pointer', color: '#3b82f6', flexDirection: 'column', gap: '0.2rem' }}>
                     <span style={{ fontSize: '1.2rem' }}>+</span>
                     <span style={{ fontSize: '0.6rem' }}>Добавить</span>
                   </div>
                 </div>
               </div>

              {/* СМЕТА ОТ ИНЖЕНЕРА (ЕСЛИ ЕСТЬ) */}
              {formData.estimateItems && formData.estimateItems.length > 0 && (
              <div style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.5rem', marginBottom: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                   <div style={{ fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '1px', fontWeight: 600 }}>СМЕТА ОТ ИНЖЕНЕРА (ИИ)</div>
                   <div style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>Рассчитано</div>
                 </div>
                 
                 <table style={{ width: '100%', borderCollapse: 'collapse', color: '#cbd5e1', fontSize: '0.85rem' }}>
                   <thead>
                     <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', textAlign: 'left' }}>
                       <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Наименование</th>
                       <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Ед.</th>
                       <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Кол.</th>
                       <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Цена</th>
                       <th style={{ paddingBottom: '0.5rem', fontWeight: 600 }}>Сумма</th>
                     </tr>
                   </thead>
                   <tbody>
                     {formData.estimateItems.map((item, idx) => (
                       <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                         <td style={{ padding: '0.6rem 0' }}>{item.name}</td>
                         <td style={{ padding: '0.6rem 0' }}>{item.unit}</td>
                         <td style={{ padding: '0.6rem 0' }}>{item.qty}</td>
                         <td style={{ padding: '0.6rem 0' }}>{item.price.toLocaleString()} ₸</td>
                         <td style={{ padding: '0.6rem 0', fontWeight: 'bold', color: '#38bdf8' }}>{(item.sum || 0).toLocaleString()} ₸</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #1e293b', fontWeight: 'bold', fontSize: '1rem' }}>
                   <span>ИТОГО:</span>
                   <span style={{ color: '#34d399' }}>{(formData.totalSum || 0).toLocaleString()} ₸</span>
                 </div>
              </div>
              )}

              {/* ЭТАПЫ (From Image 2) */}
              <div style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.5rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
                   <div style={{ fontSize: '0.85rem', color: '#94a3b8', letterSpacing: '1px' }}>ЭТАПЫ ({formData.stages ? formData.stages.length : 0})</div>
                   <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem' }}>33% Выполнено</div>
                 </div>
                 
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                   {(formData.stages || []).map((stg, i) => {
                     const isExpanded = expandedStageId === (stg.id || i);
                     return (
                     <div key={stg.id || i} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: isExpanded ? '#0a0f18' : 'transparent', padding: isExpanded ? '1rem' : '0', borderRadius: '12px', border: isExpanded ? '1px solid #1e293b' : 'none', transition: 'all 0.2s' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                         <div 
                           onClick={() => handleStageStatusToggle(i)}
                           style={{ 
                           cursor: 'pointer', flex: 1, padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                           background: stg.status === 'Решено' ? 'rgba(34,197,94,0.1)' : (stg.status === 'В работе' ? 'rgba(59,130,246,0.1)' : 'transparent'),
                           border: `1px solid ${stg.status === 'Решено' ? '#22c55e' : (stg.status === 'В работе' ? '#3b82f6' : '#1e293b')}`,
                           color: stg.status === 'Решено' ? '#22c55e' : (stg.status === 'В работе' ? '#3b82f6' : '#94a3b8')
                         }}>
                           <span>{stg.status === 'Решено' ? '✓' : '○'}</span>
                           <input 
                             type="text" 
                             value={stg.title} 
                             onChange={(e) => handleStageChange(i, e.target.value)}
                             onClick={(e) => e.stopPropagation()}
                             placeholder="Название этапа..."
                             style={{ background: 'transparent', border: 'none', color: 'inherit', outline: 'none', width: '100%', fontSize: '0.85rem' }}
                           />
                         </div>
                         <button 
                           onClick={() => setExpandedStageId(isExpanded ? null : (stg.id || i))}
                           style={{ background: isExpanded ? '#1e293b' : 'rgba(59,130,246,0.1)', color: isExpanded ? '#fff' : '#3b82f6', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s' }}
                         >
                           {isExpanded ? 'Скрыть ▲' : 'Подробнее ▼'}
                         </button>
                         <button onClick={() => handleRemoveStage(i)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}>✕</button>
                       </div>
                       
                       {isExpanded && (
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '0.5rem', paddingLeft: '1rem', borderLeft: '2px solid #1e293b' }}>
                           <div style={{ display: 'flex', gap: '1rem' }}>
                             <div style={{ flex: 1 }}>
                               <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>СРОК (ДЕДЛАЙН)</label>
                               <input type="text" value={stg.deadline || ''} onChange={(e) => {
                                 const newStages = [...formData.stages];
                                 newStages[i].deadline = e.target.value;
                                 handleChange('stages', newStages);
                               }} placeholder="Например: 15 Авг" style={{ width: '100%', background: '#111827', color: '#fff', border: '1px solid #1e293b', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }} />
                             </div>
                             <div style={{ flex: 1 }}>
                               <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>ИСПОЛНИТЕЛЬ</label>
                               <input type="text" value={stg.executor || ''} onChange={(e) => {
                                 const newStages = [...formData.stages];
                                 newStages[i].executor = e.target.value;
                                 handleChange('stages', newStages);
                               }} placeholder="Бригада / Менеджер" style={{ width: '100%', background: '#111827', color: '#fff', border: '1px solid #1e293b', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem' }} />
                             </div>
                           </div>
                           <div>
                             <label style={{ fontSize: '0.65rem', color: '#64748b', display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>ОПИСАНИЕ И ЗАДАЧИ ЭТАПА</label>
                             <textarea rows="2" value={stg.description || ''} onChange={(e) => {
                               const newStages = [...formData.stages];
                               newStages[i].description = e.target.value;
                               handleChange('stages', newStages);
                             }} placeholder="Подробности задачи..." style={{ width: '100%', background: '#111827', color: '#fff', border: '1px solid #1e293b', padding: '0.6rem', borderRadius: '8px', fontSize: '0.85rem', resize: 'none' }}></textarea>
                           </div>
                         </div>
                       )}
                     </div>
                   )})}
                   {(!formData.stages || formData.stages.length === 0) && (
                     <div style={{ color: '#64748b', fontSize: '0.85rem', fontStyle: 'italic' }}>Нет добавленных этапов</div>
                   )}
                   <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                     <button onClick={handleAddStage} style={{ flex: 1, background: 'rgba(168,85,247,0.1)', border: '1px solid #a855f7', color: '#a855f7', padding: '0.5rem', borderRadius: '20px', fontSize: '0.8rem', cursor: 'pointer' }}>+ Добавить этап</button>
                   </div>
                 </div>
              </div>

            </div>

            {/* COLUMN 2: ФИНАНСЫ (Widgets) */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignContent: 'start' }}>
              {STAT_WIDGETS.map((widget, i) => (
                <div key={i} style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.2rem', position: 'relative' }}>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '0.4rem', letterSpacing: '1px' }}>{widget.title}</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: widget.color, marginBottom: '0.2rem' }}>{widget.val}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{widget.sub}</div>
                  
                  {/* Fake Sparkline Chart */}
                  <div style={{ marginTop: '1rem', height: '40px', width: '100%', position: 'relative' }}>
                    <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                      <path d="M0,30 L10,25 L20,35 L30,20 L40,28 L50,15 L60,25 L70,10 L80,20 L90,5 L100,15" fill="none" stroke={widget.color} strokeWidth="2" strokeOpacity="0.8" />
                      <circle cx="100" cy="15" r="3" fill={widget.color} />
                    </svg>
                  </div>
                </div>
              ))}
            </div>

            {/* COLUMN 3: CHARTS */}
            <div style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1e293b', padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1.5rem', letterSpacing: '1px', width: '100%', textAlign: 'left' }}>СТРУКТУРА СУММЫ</div>
                {/* CSS Donut Chart Mock */}
                <div style={{ 
                  width: '140px', height: '140px', borderRadius: '50%', 
                  background: 'conic-gradient(#22c55e 0% 45%, #3b82f6 45% 75%, #f59e0b 75% 100%)',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1.5rem'
                }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#111827', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>{formatMoney(baseBudget)}</span>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>итого</span>
                  </div>
                </div>
                <div style={{ width: '100%', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', color: '#94a3b8' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{display:'flex', gap:'0.5rem', alignItems:'center'}}><div style={{width:8,height:8,borderRadius:'50%',backgroundColor:'#22c55e'}}/>Себестоимость</span> <span>45%</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{display:'flex', gap:'0.5rem', alignItems:'center'}}><div style={{width:8,height:8,borderRadius:'50%',backgroundColor:'#3b82f6'}}/>Комиссии</span> <span>30%</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{display:'flex', gap:'0.5rem', alignItems:'center'}}><div style={{width:8,height:8,borderRadius:'50%',backgroundColor:'#f59e0b'}}/>Налоги</span> <span>25%</span></div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: '#0a0f18' }}>
          <button onClick={onClose} style={{ background: 'transparent', color: '#fff', border: '1px solid #334155', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
            {canEdit ? 'Отмена' : 'Закрыть'}
          </button>
          {canEdit ? (
            <button onClick={handleSaveWrapper} style={{ background: '#22c55e', color: '#fff', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ✓ Сохранить изменения
            </button>
          ) : (
            <div style={{ padding: '0.8rem 2rem', color: '#ef4444', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
              🔒 Нет прав для редактирования
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
