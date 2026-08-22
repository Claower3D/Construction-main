import React, { useState, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════
   QAZGOST AI — КАРТОЧКА СТРОИТЕЛЬНОГО ОБЪЕКТА (COCKPIT v3.0)
   - Ролевая защита: Исполнитель НЕ МОЖЕТ редактировать заявку инженера (READ-ONLY 🔒)
   - Яркая цветовая маркировка типа заявки (Инженер / Исполнитель / Лид)
   - 7-этапный синхронизированный степпер
   - График этапов работ, GPS спецтехника и Эскроу баланс
   ═══════════════════════════════════════════════════════════════ */

const PIPELINE_STAGES = [
  { id: 'new',                label: 'Заявка',        fullLabel: '1. Новая заявка',            icon: '📝', color: '#8b5cf6' },
  { id: 'engineer_assigned',  label: 'Инженер',       fullLabel: '2. Инженер назначен',        icon: '📋', color: '#f59e0b' },
  { id: 'engineer_visit',     label: 'Выезд',         fullLabel: '3. Выезд и обследование',    icon: '🚗', color: '#f97316' },
  { id: 'estimate_ready',     label: 'Смета',         fullLabel: '4. Смета и ПСД готовы',       icon: '📊', color: '#06b6d4' },
  { id: 'pending_executor',   label: 'Подрядчик',     fullLabel: '5. Поиск исполнителя',       icon: '⏳', color: '#eab308' },
  { id: 'in_progress',        label: 'В работе',      fullLabel: '6. Строительные работы',      icon: '🟢', color: '#10b981' },
  { id: 'completed',          label: 'Сдан',          fullLabel: '7. Объект сдан и принят',     icon: '✅', color: '#22c55e' }
];

function normalizeStatus(status) {
  if (!status) return 'new';
  const s = String(status).toLowerCase();
  if (s.includes('нов') || s === 'new') return 'new';
  if (s.includes('инженер назначен') || s === 'engineer_assigned') return 'engineer_assigned';
  if (s.includes('выезд') || s.includes('проверке') || s === 'engineer_visit') return 'engineer_visit';
  if (s.includes('смет') || s === 'estimate_ready') return 'estimate_ready';
  if (s.includes('дожим') || s.includes('ждёт') || s.includes('поиск') || s === 'pending_executor') return 'pending_executor';
  if (s.includes('работ') || s.includes('процесс') || s === 'in_progress') return 'in_progress';
  if (s.includes('успеш') || s.includes('заверш') || s.includes('сдан') || s === 'completed') return 'completed';
  if (s.includes('отказ')) return 'new';
  return 'in_progress';
}

function parseMoney(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  return parseInt(String(val).replace(/\D/g, ''), 10) || 0;
}

function formatMoney(num) {
  return (Math.round(num) || 0).toLocaleString('ru-RU') + ' ₸';
}

export default function DealCardModal({ card, onClose, onSave, currentUser }) {
  // Определение роли текущего пользователя
  const userRole = currentUser?.role || (card.role === 'executor' ? 'executor' : 'manager');
  const isExecutor = userRole === 'executor';
  const isEngineer = userRole === 'engineer';

  const [formData, setFormData] = useState(() => {
    const normStatus = normalizeStatus(card.status);
    let cleanPhone = card.phone || '';
    let cleanTime = card.time || '10:00';
    if (!cleanPhone && card.time && (card.time.includes('+') || card.time.length > 8)) {
      cleanPhone = card.time;
      cleanTime = '10:00';
    }

    const baseSum = parseMoney(card.budget || 2100000);

    const defaultStages = [
      {
        id: 'STG-1',
        name: '1. Демонтаж и подготовка основания',
        status: normStatus === 'completed' ? 'completed' : (normStatus === 'in_progress' || normStatus === 'pending_executor' ? 'completed' : 'pending'),
        progress: normStatus === 'completed' || normStatus === 'in_progress' || normStatus === 'pending_executor' ? 100 : 0,
        dateRange: '01.09 – 05.09.2026',
        budget: Math.round(baseSum * 0.25),
        machinery: [
          { name: 'Самосвал Shacman (25 т)', status: '🟢 GPS Online (1.2 км)', rate: '18 000 ₸/час' }
        ]
      },
      {
        id: 'STG-2',
        name: '2. Основные строительно-монтажные работы',
        status: normStatus === 'completed' ? 'completed' : (normStatus === 'in_progress' ? 'in_progress' : 'pending'),
        progress: normStatus === 'completed' ? 100 : (normStatus === 'in_progress' ? 65 : 0),
        dateRange: '06.09 – 20.09.2026',
        budget: Math.round(baseSum * 0.55),
        machinery: [
          { name: 'Автокран XCMG QY25K5 (25 т)', status: '🟢 GPS Online (2.1 км)', rate: '28 000 ₸/час' }
        ]
      },
      {
        id: 'STG-3',
        name: '3. Финишная отделка, пусконаладка и сдача',
        status: normStatus === 'completed' ? 'completed' : 'pending',
        progress: normStatus === 'completed' ? 100 : 0,
        dateRange: '21.09 – 30.09.2026',
        budget: Math.round(baseSum * 0.20),
        machinery: []
      }
    ];

    // Определение типа карточки для цветовой шапки
    const isEngType = card.role === 'engineer' || card.type === 'request_engineering' || (card.title && (card.title.toLowerCase().includes('выезд') || card.title.toLowerCase().includes('экспертиз') || card.title.toLowerCase().includes('инженер') || card.title.toLowerCase().includes('смет')));
    const isExecType = card.role === 'executor' || card.type === 'work_stage' || (card.title && (card.title.toLowerCase().includes('монтаж') || card.title.toLowerCase().includes('фасад') || card.title.toLowerCase().includes('стройка')));

    return {
      id: card.id || String(Date.now()).slice(-4),
      leadNum: card.leadNum || '01',
      dealType: isEngType ? 'engineer' : (isExecType ? 'executor' : 'lead'),
      title: card.title || 'Строительный объект',
      category: card.category || (isEngType ? 'Инженерные сети и ПТО' : 'Общестроительные работы'),
      location: card.location || 'г. Астана',
      clientName: card.contractor || card.clientName || 'ТОО «Заказчик»',
      clientPhone: cleanPhone || '+7 (701) 888-00-11',
      budget: baseSum,
      status: normStatus,
      date: card.date || card.day || new Date().toISOString().split('T')[0],
      time: cleanTime,
      assignedEngineer: card.assignedEngineer || 'Асхат Нурланов',
      engineerPosition: 'Ведущий инженер ПТО',
      engineerVisitDate: card.engineerVisitDate || '24.08.2026 10:30',
      engineerReport: card.engineerReport || 'Выезд на объект завершён. Произведены замеры несущих конструкций и лазерное 3D-сканирование. Отклонений по ГОСТ не выявлено, смета скорректирована с учётом фактических объёмов.',
      executorName: card.acceptedBy || card.executorName || 'ТОО «GostBuild Инжиниринг»',
      executorContract: 'Договор генподряда №КЗ-2026/88',
      comments: card.comments || 'Клиент просит соблюдать тихий час с 13:00 до 15:00. Пропускная система на объекте оформлена.',
      stages: (card.stages && card.stages.length > 0) ? card.stages : defaultStages,
      estimateItems: card.estimateItems || [
        { name: 'Бетон товарный М350 В25 (ГОСТ 7473)', unit: 'м³', qty: 24, price: 24500, sum: 588000, source: 'materials_marketplace', tag: '🧱 Маркетплейс материалов' },
        { name: 'Арматура стальная А500С d16 (ГОСТ 34028)', unit: 'т', qty: 1.8, price: 380000, sum: 684000, source: 'materials_marketplace', tag: '🧱 Маркетплейс материалов' },
        { name: 'Аренда: Автокран XCMG QY25K5 (25 т)', unit: 'смена', qty: 3, price: 112000, sum: 336000, source: 'equipment_marketplace', tag: '🚜 Маркетплейс спецтехники' },
        { name: 'Аренда: Экскаватор Hitachi ZX240 (GPS Online)', unit: 'смена', qty: 2, price: 100000, sum: 200000, source: 'equipment_marketplace', tag: '🚜 Маркетплейс спецтехники' },
        { name: 'Строительно-монтажные работы бригады', unit: 'компл.', qty: 1, price: 292000, sum: 292000, source: 'labor', tag: '👷 Работы подрядчика' }
      ]
    };
  });

  const [activeTab, setActiveTab] = useState('stages'); // 'stages' | 'estimate' | 'files' | 'notes'
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const currentStageIndex = useMemo(() => {
    const idx = PIPELINE_STAGES.findIndex(s => s.id === formData.status);
    return idx >= 0 ? idx : 0;
  }, [formData.status]);

  const handleStatusChange = (newStatusId) => {
    if (isExecutor && (newStatusId === 'new' || newStatusId === 'engineer_assigned' || newStatusId === 'engineer_visit')) {
      showToast('🔒 Исполнитель не может менять инженерные статусы');
      return;
    }
    const stageObj = PIPELINE_STAGES.find(s => s.id === newStatusId);
    setFormData(prev => ({ ...prev, status: newStatusId }));
    showToast(`🔄 Статус изменён: ${stageObj?.icon} ${stageObj?.fullLabel}`);
  };

  // Расчёт эскроу-балансов
  const totalBudget = formData.budget || 2100000;
  const completedStagesSum = formData.stages
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + (s.budget || 0), 0);
  const inProgressStagesSum = formData.stages
    .filter(s => s.status === 'in_progress')
    .reduce((acc, s) => acc + (s.budget || 0), 0);
  const escrowLocked = inProgressStagesSum > 0 ? inProgressStagesSum : (formData.status === 'in_progress' ? Math.round(totalBudget * 0.55) : 0);
  const escrowPaid = completedStagesSum > 0 ? completedStagesSum : (formData.status === 'completed' ? totalBudget : Math.round(totalBudget * 0.25));

  const handleStageStatusToggle = (index) => {
    const updated = [...formData.stages];
    const current = updated[index].status;
    if (current === 'completed') {
      updated[index].status = 'in_progress';
      updated[index].progress = 50;
    } else if (current === 'in_progress') {
      updated[index].status = 'completed';
      updated[index].progress = 100;
    } else {
      updated[index].status = 'in_progress';
      updated[index].progress = 25;
    }
    setFormData(prev => ({ ...prev, stages: updated }));
    showToast(`Этап «${updated[index].name}»: ${updated[index].status === 'completed' ? '✅ Выполнен' : '🟢 В работе'}`);
  };

  const handleStageProgressChange = (index, val) => {
    const updated = [...formData.stages];
    const num = Math.min(100, Math.max(0, parseInt(val, 10) || 0));
    updated[index].progress = num;
    if (num === 100) updated[index].status = 'completed';
    else if (num > 0) updated[index].status = 'in_progress';
    else updated[index].status = 'pending';
    setFormData(prev => ({ ...prev, stages: updated }));
  };

  const handleSaveWrapper = () => {
    const finalData = {
      ...formData,
      status: formData.status === 'new' ? 'Новые' :
              formData.status === 'completed' ? 'Успешно' :
              formData.status === 'pending_executor' ? 'Дожим' : 'В работе',
      contractor: formData.clientName,
      budget: formatMoney(formData.budget),
      phone: formData.clientPhone,
      time: formData.time
    };
    onSave(finalData);
  };

  // Цветовой стиль для шапки в зависимости от типа заявки
  const typeBadgeStyle = formData.dealType === 'engineer'
    ? { bg: 'rgba(245, 158, 11, 0.25)', border: '#f59e0b', color: '#fcd34d', label: '👷 ВЫЕЗД ИНЖЕНЕРА' }
    : formData.dealType === 'executor'
    ? { bg: 'rgba(0, 229, 255, 0.25)', border: '#00e5ff', color: '#38bdf8', label: '🔨 РАБОТЫ ИСПОЛНИТЕЛЯ' }
    : { bg: 'rgba(139, 92, 246, 0.25)', border: '#8b5cf6', color: '#c4b5fd', label: '📝 НОВЫЙ ЛИД' };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(3, 7, 18, 0.88)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(20px)', padding: '16px'
    }} onClick={onClose}>
      
      {/* Главная карточка */}
      <div style={{
        backgroundColor: '#0a1424',
        width: '96vw', maxWidth: '1380px', height: '90vh', maxHeight: '860px',
        borderRadius: '20px', border: `1px solid ${typeBadgeStyle.border}`,
        boxShadow: `0 25px 60px rgba(0, 0, 0, 0.8), 0 0 40px ${typeBadgeStyle.bg}`,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>

        {/* Всплывающий тост */}
        {toastMessage && (
          <div style={{
            position: 'absolute', top: '16px', right: '70px', zIndex: 100,
            background: 'rgba(0, 229, 255, 0.2)', border: '1px solid #00e5ff',
            backdropFilter: 'blur(20px)', borderRadius: '12px', padding: '10px 20px',
            color: '#00e5ff', fontWeight: 800, fontSize: '0.85rem',
            animation: 'fadeIn 0.2s ease', boxShadow: '0 8px 24px rgba(0,229,255,0.3)'
          }}>
            {toastMessage}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            1. ХЕДЕР С ЧЁТКОЙ МАРКИРОВКОЙ ТИПА ЗАЯВКИ
            ════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '1rem 1.75rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(10, 20, 36, 0.95))',
          flexWrap: 'wrap', gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '12px',
              background: typeBadgeStyle.bg, border: `1px solid ${typeBadgeStyle.border}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', boxShadow: `0 0 20px ${typeBadgeStyle.bg}`, flexShrink: 0
            }}>
              {formData.dealType === 'engineer' ? '👷' : (formData.dealType === 'executor' ? '🔨' : '📝')}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: '0.78rem', fontWeight: 900, padding: '3px 10px', borderRadius: '6px',
                  background: typeBadgeStyle.bg, border: `1px solid ${typeBadgeStyle.border}`,
                  color: typeBadgeStyle.color, letterSpacing: '0.5px'
                }}>
                  {typeBadgeStyle.label} #{formData.id}
                </span>

                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc' }}>
                  {formData.title}
                </h2>

                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '3px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 800,
                  background: `${PIPELINE_STAGES[currentStageIndex]?.color}25`,
                  border: `1px solid ${PIPELINE_STAGES[currentStageIndex]?.color}80`,
                  color: PIPELINE_STAGES[currentStageIndex]?.color || '#00e5ff'
                }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: PIPELINE_STAGES[currentStageIndex]?.color || '#00e5ff' }} />
                  {PIPELINE_STAGES[currentStageIndex]?.icon} {PIPELINE_STAGES[currentStageIndex]?.fullLabel}
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '3px', display: 'flex', gap: '10px' }}>
                <span>📍 {formData.location}</span>
                <span>•</span>
                <span>📅 Дата: {formData.date}</span>
                <span>•</span>
                <span>🏷️ {formData.category}</span>
                {isExecutor && (
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>
                    🔒 Режим исполнителя (данные инженера защищены)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '10px', padding: '6px 14px', textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.65rem', color: '#ffd700', fontWeight: 800, textTransform: 'uppercase' }}>
                Бюджет объекта
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffd700', lineHeight: 1.1 }}>
                {formatMoney(totalBudget)}
              </div>
            </div>

            <button onClick={onClose} style={{
              background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8', width: '36px', height: '36px', borderRadius: '50%',
              fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              ✕
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            2. ИНТЕРАКТИВНЫЙ СТЕППЕР
            ════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '0.85rem 2rem',
          background: 'rgba(6, 12, 22, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute', top: '28px', left: '6%', right: '6%', height: '3px',
            background: 'rgba(255, 255, 255, 0.1)', zIndex: 1
          }} />
          <div style={{
            position: 'absolute', top: '28px', left: '6%',
            width: `${(currentStageIndex / (PIPELINE_STAGES.length - 1)) * 88}%`, height: '3px',
            background: 'linear-gradient(90deg, #8b5cf6, #f59e0b, #00e5ff, #10b981)',
            boxShadow: '0 0 10px rgba(0, 229, 255, 0.6)',
            transition: 'width 0.3s ease', zIndex: 1
          }} />

          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;
            const isFuture = idx > currentStageIndex;

            return (
              <div
                key={stage.id}
                onClick={() => handleStatusChange(stage.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  zIndex: 2, gap: '4px', cursor: 'pointer', minWidth: '70px',
                  opacity: isFuture ? 0.5 : 1, transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.06)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title={`Переключить на этап: ${stage.fullLabel}`}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  background: isActive ? stage.color : (isCompleted ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'),
                  border: `2px solid ${isActive ? '#fff' : (isCompleted ? '#10b981' : 'rgba(255,255,255,0.15)')}`,
                  color: isActive ? '#0a1628' : (isCompleted ? '#10b981' : '#94a3b8'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.95rem', fontWeight: 900,
                  boxShadow: isActive ? `0 0 16px ${stage.color}` : 'none'
                }}>
                  {isCompleted ? '✓' : (isActive ? stage.icon : `${idx + 1}`)}
                </div>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 800 : (isCompleted ? 700 : 500),
                  color: isActive ? '#00e5ff' : (isCompleted ? '#10b981' : '#64748b'),
                  textAlign: 'center'
                }}>
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* ════════════════════════════════════════════════════════
            3. ОСНОВНОЙ КОНТЕНТ (2 КОЛОНКИ)
            ════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.25rem 1.75rem',
          display: 'grid', gridTemplateColumns: '360px 1fr', gap: '1.5rem'
        }}>

          {/* ────────────────────────────────────────────────────
              ЛЕВАЯ КОЛОНКА: ОБЪЕКТ, ИНЖЕНЕР (READONLY ДЛЯ ИСПОЛНИТЕЛЯ)
              ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Блок 1: Объект и Заказчик */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)', borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.1rem'
            }}>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏢</span> Объект и Заказчик
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>НАИМЕНОВАНИЕ ОБЪЕКТА</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '0.82rem', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>ЗАКАЗЧИК</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '0.82rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>ТЕЛЕФОН</label>
                    <input
                      type="text"
                      value={formData.clientPhone}
                      onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder="+7 (701) 888-00-11"
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(56, 189, 248, 0.3)',
                        borderRadius: '8px', padding: '7px 10px', color: '#38bdf8', fontSize: '0.82rem', outline: 'none', fontWeight: 700
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>АДРЕС ОБЪЕКТА</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '7px 10px', color: '#fff', fontSize: '0.82rem', outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Блок 2: ВЫЕЗД ИНЖЕНЕРА (ЗАБЛОКИРОВАН ДЛЯ ИСПОЛНИТЕЛЯ) */}
            <div style={{
              background: isExecutor ? 'rgba(15, 23, 42, 0.5)' : 'rgba(245, 158, 11, 0.05)',
              borderRadius: '14px',
              border: `1px solid ${isExecutor ? 'rgba(255, 255, 255, 0.08)' : 'rgba(245, 158, 11, 0.25)'}`,
              padding: '1.1rem',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: isExecutor ? '#94a3b8' : '#f59e0b', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>👷</span> Выезд инженера ПТО
                </div>
                {isExecutor ? (
                  <span style={{ fontSize: '0.68rem', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 800, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    🔒 Только чтение
                  </span>
                ) : (
                  <span style={{ fontSize: '0.68rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Акт утверждён
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>ИНЖЕНЕР ПТО</label>
                    <input
                      type="text"
                      value={formData.assignedEngineer}
                      disabled={isExecutor}
                      onChange={e => setFormData({ ...formData, assignedEngineer: e.target.value })}
                      style={{
                        width: '100%', background: isExecutor ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
                        border: `1px solid ${isExecutor ? 'rgba(255,255,255,0.06)' : 'rgba(245, 158, 11, 0.3)'}`,
                        borderRadius: '8px', padding: '7px 10px', color: isExecutor ? '#94a3b8' : '#fcd34d',
                        fontSize: '0.82rem', outline: 'none', fontWeight: 700,
                        cursor: isExecutor ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>ДАТА ВЫЕЗДА</label>
                    <input
                      type="text"
                      value={formData.engineerVisitDate}
                      disabled={isExecutor}
                      onChange={e => setFormData({ ...formData, engineerVisitDate: e.target.value })}
                      style={{
                        width: '100%', background: isExecutor ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
                        border: `1px solid ${isExecutor ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
                        borderRadius: '8px', padding: '7px 10px', color: isExecutor ? '#94a3b8' : '#38bdf8',
                        fontSize: '0.82rem', outline: 'none', fontWeight: 700,
                        cursor: isExecutor ? 'not-allowed' : 'text'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>ЗАКЛЮЧЕНИЕ / ОТЧЁТ ОБСЛЕДОВАНИЯ</label>
                  <textarea
                    rows="3"
                    value={formData.engineerReport}
                    disabled={isExecutor}
                    onChange={e => setFormData({ ...formData, engineerReport: e.target.value })}
                    style={{
                      width: '100%', background: isExecutor ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)',
                      border: `1px solid ${isExecutor ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
                      borderRadius: '8px', padding: '7px 10px', color: isExecutor ? '#94a3b8' : '#cbd5e1',
                      fontSize: '0.78rem', outline: 'none', resize: 'none', lineHeight: 1.35,
                      cursor: isExecutor ? 'not-allowed' : 'text'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Блок 3: Подрядчик / Исполнитель */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.05)', borderRadius: '14px',
              border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1.1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔨</span> Подрядчик / Исполнитель
                </div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>
                  ⭐ 4.9 Рейтинг
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>ОРГАНИЗАЦИЯ</label>
                  <input
                    type="text"
                    value={formData.executorName}
                    onChange={e => setFormData({ ...formData, executorName: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px', padding: '7px 10px', color: '#6ee7b7', fontSize: '0.82rem', outline: 'none', fontWeight: 700
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '3px', fontWeight: 600 }}>ДОГОВОР ПОДРЯДА</label>
                  <input
                    type="text"
                    value={formData.executorContract}
                    onChange={e => setFormData({ ...formData, executorContract: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '7px 10px', color: '#94a3b8', fontSize: '0.82rem', outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────
              ПРАВАЯ КОЛОНКА: ДАШБОРД + ТАБЫ (ЭТАПЫ, СМЕТА, ФАЙЛЫ)
              ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* 4 Карточки верхнего финансового дашборда */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
              <div style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 215, 0, 0.25)',
                borderRadius: '12px', padding: '10px 14px'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#ffd700', fontWeight: 800, textTransform: 'uppercase' }}>Общий бюджет</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#ffd700', marginTop: '2px' }}>{formatMoney(totalBudget)}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '1px' }}>по смете проекта</div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(0, 229, 255, 0.3)',
                borderRadius: '12px', padding: '10px 14px'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#00e5ff', fontWeight: 800, textTransform: 'uppercase' }}>🔒 В Эскроу</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#00e5ff', marginTop: '2px' }}>{formatMoney(escrowLocked)}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '1px' }}>заморожено в работе</div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '12px', padding: '10px 14px'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>🔓 Выплачено</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981', marginTop: '2px' }}>{formatMoney(escrowPaid)}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '1px' }}>по актам выполненных</div>
              </div>

              <div style={{
                background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(139, 92, 246, 0.3)',
                borderRadius: '12px', padding: '10px 14px'
              }}>
                <div style={{ fontSize: '0.68rem', color: '#c4b5fd', fontWeight: 800, textTransform: 'uppercase' }}>🎁 Бонус 3%</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#c4b5fd', marginTop: '2px' }}>{formatMoney(totalBudget * 0.03)}</div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '1px' }}>менеджеру сделки</div>
              </div>
            </div>

            {/* Таб-переключатель */}
            <div style={{
              display: 'flex', gap: '6px', background: 'rgba(15, 23, 42, 0.9)',
              padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)'
            }}>
              {[
                { key: 'stages', label: '🏗️ График этапов и GPS спецтехника' },
                { key: 'estimate', label: '📊 Смета материалов и работ (ГОСТ)' },
                { key: 'files', label: '📁 Документы и фотофиксация' },
                { key: 'notes', label: '📝 Особые заметки' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    flex: 1, padding: '7px 12px', borderRadius: '8px', border: 'none',
                    background: activeTab === t.key ? 'linear-gradient(135deg, #00e5ff, #0284c7)' : 'transparent',
                    color: activeTab === t.key ? '#0a1628' : '#94a3b8',
                    fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ТАБ 1: ЭТАПЫ СТРОЙКИ & СПЕЦТЕХНИКА */}
            {activeTab === 'stages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {formData.stages.map((stg, i) => (
                  <div key={stg.id || i} style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: `1px solid ${stg.status === 'completed' ? 'rgba(16, 185, 129, 0.35)' : (stg.status === 'in_progress' ? 'rgba(0, 229, 255, 0.45)' : 'rgba(255, 255, 255, 0.08)')}`,
                    borderRadius: '12px', padding: '12px 14px',
                    boxShadow: stg.status === 'in_progress' ? '0 0 16px rgba(0, 229, 255, 0.12)' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#f8fafc' }}>{stg.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '1px' }}>
                          ⏱ Сроки: <strong style={{ color: '#38bdf8' }}>{stg.dateRange}</strong> • Бюджет этапа: <strong style={{ color: '#ffd700' }}>{formatMoney(stg.budget)}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStageStatusToggle(i)}
                        style={{
                          padding: '4px 12px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 800,
                          background: stg.status === 'completed' ? 'rgba(16,185,129,0.2)' : (stg.status === 'in_progress' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.06)'),
                          border: `1px solid ${stg.status === 'completed' ? '#10b981' : (stg.status === 'in_progress' ? '#00e5ff' : 'rgba(255,255,255,0.15)')}`,
                          color: stg.status === 'completed' ? '#10b981' : (stg.status === 'in_progress' ? '#00e5ff' : '#94a3b8'),
                          cursor: 'pointer'
                        }}
                      >
                        {stg.status === 'completed' ? '✅ Выполнен' : (stg.status === 'in_progress' ? '🟢 В работе' : '⏳ Запланирован')}
                      </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <input
                        type="range" min="0" max="100" value={stg.progress}
                        onChange={e => handleStageProgressChange(i, e.target.value)}
                        style={{ flex: 1, accentColor: '#00e5ff', cursor: 'pointer' }}
                      />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, minWidth: '35px', textAlign: 'right', color: stg.status === 'completed' ? '#10b981' : '#00e5ff' }}>
                        {stg.progress}%
                      </span>
                    </div>

                    {stg.machinery && stg.machinery.length > 0 && (
                      <div style={{
                        background: 'rgba(8, 12, 22, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '8px', padding: '6px 10px', marginTop: '6px'
                      }}>
                        {stg.machinery.map((m, mi) => (
                          <div key={mi} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#e2e8f0' }}>
                            <span>🚜 <strong>{m.name}</strong></span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>{m.status} • {m.rate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ТАБ 2: СМЕТА МАТЕРИАЛОВ И РАБОТ */}
            {activeTab === 'estimate' && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)', borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1rem', flex: 1
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.85rem' }}>📄 Смета с интеграцией Маркетплейсов (ГОСТ КЗ)</span>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: '2px' }}>
                      Автоматический расчёт стройматериалов и почасовой аренды спецтехники
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const newMat = { name: 'Кирпич керамический рядовой М150', unit: 'тыс.шт', qty: 4.5, price: 85000, sum: 382500, source: 'materials_marketplace', tag: '🧱 Маркетплейс материалов' };
                        setFormData(prev => ({
                          ...prev,
                          estimateItems: [...prev.estimateItems, newMat],
                          budget: prev.budget + 382500
                        }));
                        showToast('🧱 Кирпич М150 подтянут из Маркетплейса стройматериалов!');
                      }}
                      style={{
                        background: 'rgba(139, 92, 246, 0.15)', border: '1px solid #8b5cf6',
                        color: '#c4b5fd', borderRadius: '6px', padding: '4px 8px',
                        fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      🧱 + Стройматериалы
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const newMach = { name: 'Аренда: Самосвал Shacman 25т (GPS)', unit: 'смена', qty: 2, price: 72000, sum: 144000, source: 'equipment_marketplace', tag: '🚜 Маркетплейс спецтехники' };
                        setFormData(prev => ({
                          ...prev,
                          estimateItems: [...prev.estimateItems, newMach],
                          budget: prev.budget + 144000
                        }));
                        showToast('🚜 Самосвал Shacman подтянут из Маркетплейса спецтехники!');
                      }}
                      style={{
                        background: 'rgba(56, 189, 248, 0.15)', border: '1px solid #38bdf8',
                        color: '#7dd3fc', borderRadius: '6px', padding: '4px 8px',
                        fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer'
                      }}
                    >
                      🚜 + Спецтехника (GPS)
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast('📥 Смета экспортирована в PDF (ГОСТ КЗ)')}
                      style={{
                        background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00e5ff',
                        color: '#00e5ff', borderRadius: '6px', padding: '4px 8px',
                        fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      📥 PDF
                    </button>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', color: '#cbd5e1' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '6px 4px' }}>Позиция</th>
                      <th style={{ padding: '6px 4px' }}>Ед.</th>
                      <th style={{ padding: '6px 4px' }}>Кол-во</th>
                      <th style={{ padding: '6px 4px' }}>Цена</th>
                      <th style={{ padding: '6px 4px', textAlign: 'right' }}>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.estimateItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '8px 4px' }}>
                          <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '0.8rem' }}>{item.name}</div>
                          {item.tag && (
                            <span style={{
                              fontSize: '0.62rem', fontWeight: 800, padding: '1px 5px', borderRadius: '4px',
                              background: item.source === 'materials_marketplace' ? 'rgba(139,92,246,0.2)' : (item.source === 'equipment_marketplace' ? 'rgba(56,189,248,0.2)' : 'rgba(245,158,11,0.2)'),
                              border: `1px solid ${item.source === 'materials_marketplace' ? '#8b5cf6' : (item.source === 'equipment_marketplace' ? '#38bdf8' : '#f59e0b')}`,
                              color: item.source === 'materials_marketplace' ? '#c4b5fd' : (item.source === 'equipment_marketplace' ? '#7dd3fc' : '#fcd34d'),
                              display: 'inline-block', marginTop: '2px'
                            }}>
                              {item.tag}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '8px 4px' }}>{item.unit}</td>
                        <td style={{ padding: '8px 4px', fontWeight: 700 }}>{item.qty}</td>
                        <td style={{ padding: '8px 4px' }}>{item.price.toLocaleString('ru-RU')} ₸</td>
                        <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 900, color: '#38bdf8' }}>
                          {(item.sum || item.price * item.qty).toLocaleString('ru-RU')} ₸
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ТАБ 3: ФАЙЛЫ И ДОКУМЕНТЫ */}
            {activeTab === 'files' && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)', borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1rem', flex: 1
              }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  📁 Прикреплённые акты и фото с объекта
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { name: 'Акт выездного обследования.pdf', size: '2.4 МБ', icon: '📑' },
                    { name: 'Геодезическая разбивка.dwg', size: '8.1 МБ', icon: '📐' },
                    { name: 'Фото дефекта несущей стены.jpg', size: '3.8 МБ', icon: '📸' }
                  ].map((f, fi) => (
                    <div key={fi} style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px', padding: '10px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                      <span style={{ fontSize: '1.6rem' }}>{f.icon}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{f.name}</div>
                        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{f.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ТАБ 4: ЗАМЕТКИ */}
            {activeTab === 'notes' && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.85)', borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1rem', flex: 1
              }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                  📝 Особые комментарии и инструкции
                </div>
                <textarea
                  rows="6"
                  value={formData.comments}
                  onChange={e => setFormData({ ...formData, comments: e.target.value })}
                  style={{
                    width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '8px', padding: '10px', color: '#cbd5e1', fontSize: '0.82rem', outline: 'none', resize: 'none', lineHeight: 1.4
                  }}
                />
              </div>
            )}

            {/* Быстрые действия с учётом роли */}
            <div style={{
              display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.85)',
              borderRadius: '12px', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.06)'
            }}>
              {!isExecutor && (
                <>
                  <button
                    onClick={() => handleStatusChange('engineer_assigned')}
                    style={{
                      flex: 1, background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)',
                      color: '#fcd34d', padding: '8px 6px', borderRadius: '8px',
                      fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    📋 Инженера
                  </button>
                  <button
                    onClick={() => handleStatusChange('engineer_visit')}
                    style={{
                      flex: 1, background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)',
                      color: '#fdba74', padding: '8px 6px', borderRadius: '8px',
                      fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    🚗 На выезд
                  </button>
                  <button
                    onClick={() => handleStatusChange('pending_executor')}
                    style={{
                      flex: 1, background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.35)',
                      color: '#fde047', padding: '8px 6px', borderRadius: '8px',
                      fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                    }}
                  >
                    ⏳ Подрядчику
                  </button>
                </>
              )}
              <button
                onClick={() => handleStatusChange('in_progress')}
                style={{
                  flex: 1, background: 'rgba(0, 229, 255, 0.15)', border: '1px solid rgba(0, 229, 255, 0.35)',
                  color: '#00e5ff', padding: '8px 6px', borderRadius: '8px',
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                🚀 В работу
              </button>
              <button
                onClick={() => handleStatusChange('completed')}
                style={{
                  flex: 1, background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.35)',
                  color: '#86efac', padding: '8px 6px', borderRadius: '8px',
                  fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer'
                }}
              >
                ✅ Сдать объект
              </button>
            </div>

          </div>

        </div>

        {/* ════════════════════════════════════════════════════════
            4. ФУТЕР
            ════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '0.85rem 1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#0a1424'
        }}>
          <button
            onClick={() => showToast(`💬 Чат по объекту №${formData.id} открыт`)}
            style={{
              background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff',
              border: '1px solid rgba(0, 229, 255, 0.3)', padding: '8px 16px',
              borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            💬 Чат объекта
          </button>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)', padding: '8px 20px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700
              }}
            >
              Отмена
            </button>

            <button
              onClick={handleSaveWrapper}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', border: 'none', padding: '8px 24px',
                borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
                fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
              }}
            >
              ✓ Сохранить изменения
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
