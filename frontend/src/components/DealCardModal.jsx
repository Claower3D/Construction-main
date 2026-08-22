import React, { useState, useMemo } from 'react';

/* ═══════════════════════════════════════════════════════════════
   QAZGOST AI — КАРТОЧКА СТРОИТЕЛЬНОГО ОБЪЕКТА / СДЕЛКИ
   Профессиональная карточка проекта с полным жизненным циклом:
   Заявка → Инженер (выезд/дефекты) → Смета (ПСД) → Подрядчик → 
   Строительные этапы + GPS Спецтехника + Эскроу безопасность
   ═══════════════════════════════════════════════════════════════ */

// ═══ 7 ЭТАПОВ ЖИЗНЕННОГО ЦИКЛА СТРОИТЕЛЬНОГО ОБЪЕКТА ═══
const PIPELINE_STAGES = [
  { id: 'new',                label: '1. Заявка',      fullLabel: 'Новая заявка',         icon: '📝', color: '#8b5cf6' },
  { id: 'engineer_assigned',  label: '2. Инженер',     fullLabel: 'Инженер назначен',     icon: '📋', color: '#f59e0b' },
  { id: 'engineer_visit',     label: '3. Выезд',       fullLabel: 'Выезд и обследование', icon: '🚗', color: '#f97316' },
  { id: 'estimate_ready',     label: '4. Смета',       fullLabel: 'Смета и ПСД готовы',    icon: '📊', color: '#06b6d4' },
  { id: 'pending_executor',   label: '5. Подрядчик',   fullLabel: 'Поиск исполнителя',    icon: '⏳', color: '#eab308' },
  { id: 'in_progress',        label: '6. Работы',      fullLabel: 'Строительные работы',   icon: '🟢', color: '#10b981' },
  { id: 'completed',          label: '7. Сдан',        fullLabel: 'Объект сдан и принят',  icon: '✅', color: '#22c55e' }
];

// Преобразование устаревших статусов в новые
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
  // Инициализация формы с защитой от пустых или перепутанных полей
  const [formData, setFormData] = useState(() => {
    const rawStatus = card.status || 'Новые';
    const normStatus = normalizeStatus(rawStatus);

    // Исправление бага, когда в time был записан телефон или наоборот
    let cleanPhone = card.phone || '';
    let cleanTime = card.time || '10:00';
    if (!cleanPhone && card.time && (card.time.includes('+') || card.time.length > 8)) {
      cleanPhone = card.time;
      cleanTime = '10:00';
    }

    const defaultStages = [
      {
        id: 'STG-1',
        name: '1. Демонтаж и подготовка основания',
        status: normStatus === 'completed' ? 'completed' : (normStatus === 'in_progress' ? 'completed' : 'pending'),
        progress: normStatus === 'completed' || normStatus === 'in_progress' ? 100 : 0,
        dateRange: '01.09 – 05.09.2026',
        budget: Math.round(parseMoney(card.budget || 2100000) * 0.25),
        machinery: [
          { name: 'Самосвал Shacman (25 т)', status: '🟢 GPS Online', rate: '18 000 ₸/час', assigned: true }
        ]
      },
      {
        id: 'STG-2',
        name: '2. Основные строительно-монтажные работы',
        status: normStatus === 'completed' ? 'completed' : (normStatus === 'in_progress' ? 'in_progress' : 'pending'),
        progress: normStatus === 'completed' ? 100 : (normStatus === 'in_progress' ? 60 : 0),
        dateRange: '06.09 – 20.09.2026',
        budget: Math.round(parseMoney(card.budget || 2100000) * 0.55),
        machinery: [
          { name: 'Автокран XCMG QY25K5 (25 т)', status: '🟢 GPS Online', rate: '28 000 ₸/час', assigned: true }
        ]
      },
      {
        id: 'STG-3',
        name: '3. Финишная отделка, пусконаладка и сдача',
        status: normStatus === 'completed' ? 'completed' : 'pending',
        progress: normStatus === 'completed' ? 100 : 0,
        dateRange: '21.09 – 30.09.2026',
        budget: Math.round(parseMoney(card.budget || 2100000) * 0.20),
        machinery: []
      }
    ];

    return {
      id: card.id || String(Date.now()).slice(-4),
      title: card.title || 'Строительный объект',
      category: card.category || (card.type === 'request_engineering' ? 'Инженерные сети' : 'Общестроительные работы'),
      location: card.location || 'г. Астана',
      clientName: card.contractor || card.clientName || 'ТОО «Заказчик»',
      clientPhone: cleanPhone || '+7 (701) 555-12-34',
      budget: parseMoney(card.budget || 2100000),
      status: normStatus,
      rawStatusLabel: card.status || 'В работе',
      date: card.date || card.day || new Date().toISOString().split('T')[0],
      time: cleanTime,
      assignedEngineer: card.assignedEngineer || 'Асхат Нурланов (ПТО Инженер)',
      engineerVisitDate: card.engineerVisitDate || '24.08.2026 10:30',
      engineerReport: card.engineerReport || 'Выезд на объект завершён. Произведены замеры несущих конструкций и лазерное сканирование. Отклонений по ГОСТ не выявлено, смета скорректирована с учётом фактических объёмов.',
      executorName: card.acceptedBy || card.executorName || 'ТОО «GostBuild Инжиниринг»',
      executorContract: 'Договор подряда №КЗ-2026/88',
      comments: card.comments || 'Клиент просит соблюдать тихий час с 13:00 до 15:00. Пропускная система на КПП оформлена.',
      stages: (card.stages && card.stages.length > 0) ? card.stages : defaultStages,
      estimateItems: card.estimateItems || [
        { name: 'Монтаж армопояса и монолитные работы', unit: 'м³', qty: 24, price: 35000, sum: 840000 },
        { name: 'Укладка гидроизоляции и утепление', unit: 'м²', qty: 180, price: 4200, sum: 756000 },
        { name: 'Аренда спецтехники с оператором (GPS)', unit: 'смена', qty: 6, price: 84000, sum: 504000 }
      ]
    };
  });

  const [activeTab, setActiveTab] = useState('stages'); // 'stages' | 'estimate' | 'files'
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
    const stageObj = PIPELINE_STAGES.find(s => s.id === newStatusId);
    setFormData(prev => ({
      ...prev,
      status: newStatusId,
      rawStatusLabel: stageObj?.fullLabel || 'В работе'
    }));
    showToast(`🔄 Статус изменён: ${stageObj?.icon} ${stageObj?.fullLabel}`);
  };

  // Эскроу расчёты
  const totalBudget = formData.budget || 2100000;
  const completedStagesSum = formData.stages
    .filter(s => s.status === 'completed')
    .reduce((acc, s) => acc + (s.budget || 0), 0);
  const inProgressStagesSum = formData.stages
    .filter(s => s.status === 'in_progress')
    .reduce((acc, s) => acc + (s.budget || 0), 0);
  const escrowRemaining = Math.max(0, totalBudget - completedStagesSum);

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
      updated[index].progress = 10;
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

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(5, 10, 20, 0.88)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      backdropFilter: 'blur(16px)', padding: '16px'
    }} onClick={onClose}>
      
      {/* Контейнер карточки сделки */}
      <div style={{
        backgroundColor: '#0a1628',
        width: '96vw', maxWidth: '1440px', height: '92vh',
        borderRadius: '20px', border: '1px solid rgba(0, 229, 255, 0.25)',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7), 0 0 50px rgba(0, 229, 255, 0.15)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', color: '#e2e8f0', fontFamily: 'system-ui, sans-serif',
        position: 'relative'
      }} onClick={e => e.stopPropagation()}>

        {/* Всплывающий тост */}
        {toastMessage && (
          <div style={{
            position: 'absolute', top: '16px', right: '80px', zIndex: 100,
            background: 'rgba(0, 229, 255, 0.2)', border: '1px solid #00e5ff',
            backdropFilter: 'blur(20px)', borderRadius: '12px', padding: '10px 20px',
            color: '#00e5ff', fontWeight: 800, fontSize: '0.85rem',
            animation: 'fadeIn 0.2s ease', boxShadow: '0 8px 24px rgba(0,229,255,0.3)'
          }}>
            {toastMessage}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════
            1. ШАПКА КАРТОЧКИ (COCKPIT HEADER)
            ════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '1.25rem 2rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'linear-gradient(90deg, rgba(15, 23, 42, 0.95), rgba(10, 22, 40, 0.95))',
          flexWrap: 'wrap', gap: '12px'
        }}>
          {/* Заголовок + Бейдж статуса */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #00e5ff, #0284c7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', boxShadow: '0 0 20px rgba(0,229,255,0.4)'
            }}>
              🏗️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.5px' }}>
                  КАРТОЧКА ОБЪЕКТА №{formData.id}
                </h2>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800,
                  background: `${PIPELINE_STAGES[currentStageIndex]?.color}25`,
                  border: `1px solid ${PIPELINE_STAGES[currentStageIndex]?.color}80`,
                  color: PIPELINE_STAGES[currentStageIndex]?.color || '#00e5ff'
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PIPELINE_STAGES[currentStageIndex]?.color || '#00e5ff' }} />
                  {PIPELINE_STAGES[currentStageIndex]?.icon} {PIPELINE_STAGES[currentStageIndex]?.fullLabel}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px', display: 'flex', gap: '12px' }}>
                <span>📍 {formData.location}</span>
                <span>•</span>
                <span>📅 Создан: {formData.date}</span>
                <span>•</span>
                <span>🏷️ {formData.category}</span>
              </div>
            </div>
          </div>

          {/* Бюджет + Кнопка закрытия */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{
              background: 'rgba(255, 215, 0, 0.08)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: '12px', padding: '8px 18px', textAlign: 'right'
            }}>
              <div style={{ fontSize: '0.68rem', color: '#ffd700', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>
                Бюджет объекта
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffd700', lineHeight: 1.1 }}>
                {formatMoney(totalBudget)}
              </div>
            </div>

            <button onClick={onClose} style={{
              background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#94a3b8', width: '40px', height: '40px', borderRadius: '50%',
              fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}>
              ✕
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════
            2. ИНТЕРАКТИВНЫЙ СТЕППЕР (7 ЭТАПОВ СТРОЙКИ)
            ════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '1rem 2rem',
          background: 'rgba(8, 14, 26, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'relative'
        }}>
          {/* Линия соединения */}
          <div style={{
            position: 'absolute', top: '32px', left: '5%', right: '5%', height: '3px',
            background: 'linear-gradient(to right, #8b5cf6 0%, #f59e0b 25%, #06b6d4 50%, #10b981 75%, #22c55e 100%)',
            opacity: 0.3, zIndex: 1
          }} />

          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isActive = idx === currentStageIndex;
            const isUpcoming = idx > currentStageIndex;

            return (
              <div
                key={stage.id}
                onClick={() => handleStatusChange(stage.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  zIndex: 2, gap: '6px', cursor: 'pointer', minWidth: '90px',
                  opacity: isUpcoming ? 0.6 : 1, transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                title={`Переключить на этап: ${stage.fullLabel}`}
              >
                {/* Кружок этапа */}
                <div style={{
                  width: '42px', height: '42px', borderRadius: '50%',
                  background: isActive ? stage.color : (isCompleted ? 'rgba(16, 185, 129, 0.2)' : '#0f172a'),
                  border: `2px solid ${isActive ? '#fff' : (isCompleted ? '#10b981' : 'rgba(255,255,255,0.15)')}`,
                  color: isActive ? '#0a1628' : (isCompleted ? '#10b981' : '#94a3b8'),
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.1rem', fontWeight: 900,
                  boxShadow: isActive ? `0 0 20px ${stage.color}` : 'none'
                }}>
                  {isCompleted ? '✓' : stage.icon}
                </div>

                {/* Название этапа */}
                <span style={{
                  fontSize: '0.78rem',
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
            3. ОСНОВНОЙ КОНТЕНТ (3 КОЛОНКИ: ОБЪЕКТ / ЭТАПЫ / ЭСКРОУ)
            ════════════════════════════════════════════════════════ */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1.5rem 2rem',
          display: 'grid', gridTemplateColumns: '360px 1fr 340px', gap: '1.5rem'
        }}>

          {/* ────────────────────────────────────────────────────
              ЛЕВАЯ КОЛОНКА: ДАННЫЕ ОБЪЕКТА И УЧАСТНИКИ
              ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Блок 1: Объект и Клиент */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.75)', borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🏢</span> Объект и Заказчик
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>НАИМЕНОВАНИЕ ОБЪЕКТА</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>КЛИЕНТ / ЗАКАЗЧИК</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>ТЕЛЕФОН КЛИЕНТА</label>
                    <input
                      type="text"
                      value={formData.clientPhone}
                      onChange={e => setFormData({ ...formData, clientPhone: e.target.value })}
                      placeholder="+7 (701) 000-00-00"
                      style={{
                        width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px', padding: '8px 12px', color: '#38bdf8', fontSize: '0.85rem', outline: 'none', fontWeight: 700
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>АДРЕС ОБЪЕКТА</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={e => setFormData({ ...formData, location: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '8px 12px', color: '#fff', fontSize: '0.85rem', outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Блок 2: Инженер (выезд и осмотр) */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.06)', borderRadius: '14px',
              border: '1px solid rgba(245, 158, 11, 0.25)', padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>👷</span> Выезд инженера и ПТО
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>НАЗНАЧЕННЫЙ ИНЖЕНЕР</label>
                  <input
                    type="text"
                    value={formData.assignedEngineer}
                    onChange={e => setFormData({ ...formData, assignedEngineer: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '8px', padding: '8px 12px', color: '#fcd34d', fontSize: '0.85rem', outline: 'none', fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>ДАТА И ВРЕМЯ ВЫЕЗДА НА ОБЪЕКТ</label>
                  <input
                    type="text"
                    value={formData.engineerVisitDate}
                    onChange={e => setFormData({ ...formData, engineerVisitDate: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '8px 12px', color: '#38bdf8', fontSize: '0.85rem', outline: 'none', fontWeight: 700
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>ЗАКЛЮЧЕНИЕ / ОТЧЁТ ОБСЛЕДОВАНИЯ</label>
                  <textarea
                    rows="3"
                    value={formData.engineerReport}
                    onChange={e => setFormData({ ...formData, engineerReport: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '8px 12px', color: '#cbd5e1', fontSize: '0.8rem', outline: 'none', resize: 'none', lineHeight: 1.4
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Блок 3: Исполнитель (Подрядчик) */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.06)', borderRadius: '14px',
              border: '1px solid rgba(16, 185, 129, 0.25)', padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔨</span> Исполнитель / Подрядчик
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>КОМПАНИЯ / БРИГАДА</label>
                  <input
                    type="text"
                    value={formData.executorName}
                    onChange={e => setFormData({ ...formData, executorName: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px', padding: '8px 12px', color: '#6ee7b7', fontSize: '0.85rem', outline: 'none', fontWeight: 700
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 600 }}>ДОГОВОР И ОСНОВАНИЕ</label>
                  <input
                    type="text"
                    value={formData.executorContract}
                    onChange={e => setFormData({ ...formData, executorContract: e.target.value })}
                    style={{
                      width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px', padding: '8px 12px', color: '#94a3b8', fontSize: '0.85rem', outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────
              ЦЕНТРАЛЬНАЯ КОЛОНКА: ЭТАПЫ РАБОТ И СПЕЦТЕХНИКА (GPS)
              ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Таб-переключатель */}
            <div style={{
              display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.8)',
              padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)'
            }}>
              {[
                { key: 'stages', label: '🏗️ График этапов работ' },
                { key: 'estimate', label: '📊 Смета материалов и работ' },
                { key: 'files', label: '📁 Документы и фото' }
              ].map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    flex: 1, padding: '8px 14px', borderRadius: '8px', border: 'none',
                    background: activeTab === t.key ? 'linear-gradient(135deg, #00e5ff, #0284c7)' : 'transparent',
                    color: activeTab === t.key ? '#0a1628' : '#94a3b8',
                    fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ТАБ 1: ЭТАПЫ И СПЕЦТЕХНИКА */}
            {activeTab === 'stages' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {formData.stages.map((stg, i) => (
                  <div key={stg.id || i} style={{
                    background: 'rgba(15, 23, 42, 0.85)',
                    border: `1px solid ${stg.status === 'completed' ? 'rgba(16, 185, 129, 0.3)' : (stg.status === 'in_progress' ? 'rgba(0, 229, 255, 0.4)' : 'rgba(255, 255, 255, 0.08)')}`,
                    borderRadius: '14px', padding: '16px',
                    boxShadow: stg.status === 'in_progress' ? '0 0 20px rgba(0, 229, 255, 0.1)' : 'none'
                  }}>
                    {/* Заголовок этапа */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>
                          {stg.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                          ⏱ Сроки: <strong style={{ color: '#38bdf8' }}>{stg.dateRange}</strong> • Бюджет: <strong style={{ color: '#ffd700' }}>{formatMoney(stg.budget)}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStageStatusToggle(i)}
                        style={{
                          padding: '6px 14px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800,
                          background: stg.status === 'completed' ? 'rgba(16,185,129,0.2)' : (stg.status === 'in_progress' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.06)'),
                          border: `1px solid ${stg.status === 'completed' ? '#10b981' : (stg.status === 'in_progress' ? '#00e5ff' : 'rgba(255,255,255,0.15)')}`,
                          color: stg.status === 'completed' ? '#10b981' : (stg.status === 'in_progress' ? '#00e5ff' : '#94a3b8'),
                          cursor: 'pointer'
                        }}
                      >
                        {stg.status === 'completed' ? '✅ Выполнен' : (stg.status === 'in_progress' ? '🟢 В работе' : '⏳ Запланирован')}
                      </button>
                    </div>

                    {/* Слайдер прогресса */}
                    <div style={{ marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                        <span style={{ color: '#94a3b8' }}>Прогресс выполнения</span>
                        <strong style={{ color: stg.status === 'completed' ? '#10b981' : '#00e5ff' }}>{stg.progress}%</strong>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={stg.progress}
                          onChange={e => handleStageProgressChange(i, e.target.value)}
                          style={{ flex: 1, accentColor: '#00e5ff', cursor: 'pointer' }}
                        />
                      </div>
                    </div>

                    {/* Спецтехника для этапа */}
                    {stg.machinery && stg.machinery.length > 0 && (
                      <div style={{
                        background: 'rgba(8, 12, 22, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)',
                        borderRadius: '10px', padding: '10px 12px', marginTop: '8px'
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>🚜</span> Спецтехника этапа (GPS Auto-dispatch):
                        </div>
                        {stg.machinery.map((m, mi) => (
                          <div key={mi} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            fontSize: '0.8rem', color: '#e2e8f0', padding: '4px 0'
                          }}>
                            <span>🚜 {m.name}</span>
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem' }}>{m.status} • {m.rate}</span>
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
                background: 'rgba(15, 23, 42, 0.85)', borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem' }}>📄 Детализированная смета (ГОСТ)</span>
                  <button
                    onClick={() => showToast('📥 Смета скачивается в формате PDF...')}
                    style={{
                      background: 'rgba(0, 229, 255, 0.1)', border: '1px solid #00e5ff',
                      color: '#00e5ff', borderRadius: '8px', padding: '6px 12px',
                      fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    📥 Экспорт в PDF
                  </button>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '8px 4px' }}>Позиция</th>
                      <th style={{ padding: '8px 4px' }}>Ед.</th>
                      <th style={{ padding: '8px 4px' }}>Кол-во</th>
                      <th style={{ padding: '8px 4px' }}>Цена</th>
                      <th style={{ padding: '8px 4px', textAlign: 'right' }}>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.estimateItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '10px 4px', color: '#f8fafc', fontWeight: 600 }}>{item.name}</td>
                        <td style={{ padding: '10px 4px' }}>{item.unit}</td>
                        <td style={{ padding: '10px 4px' }}>{item.qty}</td>
                        <td style={{ padding: '10px 4px' }}>{item.price.toLocaleString('ru-RU')} ₸</td>
                        <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 800, color: '#38bdf8' }}>
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
                background: 'rgba(15, 23, 42, 0.85)', borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.25rem'
              }}>
                <div style={{ fontWeight: 800, color: '#38bdf8', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  📁 Прикреплённые документы и фотофиксация
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {[
                    { name: 'Акт выездного обследования.pdf', size: '2.4 МБ', icon: '📑' },
                    { name: 'Геодезическая разбивка.dwg', size: '8.1 МБ', icon: '📐' },
                    { name: 'Фото дефекта несущей стены.jpg', size: '3.8 МБ', icon: '📸' }
                  ].map((f, fi) => (
                    <div key={fi} style={{
                      background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '10px', padding: '12px', display: 'flex', alignItems: 'center', gap: '10px'
                    }}>
                      <span style={{ fontSize: '1.8rem' }}>{f.icon}</span>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{f.name}</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{f.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ────────────────────────────────────────────────────
              ПРАВАЯ КОЛОНКА: ФИНАНСЫ, ЭСКРОУ И БЫСТРЫЕ ДЕЙСТВИЯ
              ──────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {/* Эскроу безопасность */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)', borderRadius: '14px',
              border: '1px solid rgba(0, 229, 255, 0.3)', padding: '1.25rem',
              boxShadow: '0 8px 30px rgba(0, 229, 255, 0.1)'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#00e5ff', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🔒</span> Эскроу безопасность
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>Общий бюджет:</span>
                  <strong style={{ color: '#ffd700' }}>{formatMoney(totalBudget)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>🔓 Выплачено подрядчику:</span>
                  <strong style={{ color: '#10b981' }}>{formatMoney(completedStagesSum)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span style={{ color: '#94a3b8' }}>🔒 В эскроу (в работе):</span>
                  <strong style={{ color: '#00e5ff' }}>{formatMoney(inProgressStagesSum)}</strong>
                </div>

                <div style={{
                  marginTop: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Остаток к выплате:</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc' }}>
                    {formatMoney(escrowRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* Бонус менеджера */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)', borderRadius: '14px',
              border: '1px dashed rgba(16, 185, 129, 0.35)', padding: '1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#6ee7b7', fontWeight: 800, textTransform: 'uppercase' }}>
                    Вознаграждение сделки (3%)
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#34d399', marginTop: '2px' }}>
                    {formatMoney(totalBudget * 0.03)}
                  </div>
                </div>
                <div style={{ fontSize: '2rem' }}>💰</div>
              </div>
            </div>

            {/* Быстрые действия с заявкой */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.85)', borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.08)', padding: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: '#e2e8f0', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
                ⚡ Быстрые действия
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => handleStatusChange('engineer_assigned')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fcd34d', padding: '10px 14px', borderRadius: '8px',
                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <span>📋</span> Назначить инженера
                </button>

                <button
                  onClick={() => handleStatusChange('engineer_visit')}
                  style={{
                    background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.4)',
                    color: '#fdba74', padding: '10px 14px', borderRadius: '8px',
                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <span>🚗</span> Начать выезд на объект
                </button>

                <button
                  onClick={() => handleStatusChange('pending_executor')}
                  style={{
                    background: 'rgba(234, 179, 8, 0.15)', border: '1px solid rgba(234, 179, 8, 0.4)',
                    color: '#fde047', padding: '10px 14px', borderRadius: '8px',
                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <span>⏳</span> Передать исполнителю
                </button>

                <button
                  onClick={() => handleStatusChange('completed')}
                  style={{
                    background: 'rgba(34, 197, 94, 0.15)', border: '1px solid rgba(34, 197, 94, 0.4)',
                    color: '#86efac', padding: '10px 14px', borderRadius: '8px',
                    fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  <span>✅</span> Завершить и сдать объект
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ════════════════════════════════════════════════════════
            4. ФУТЕР КАРТОЧКИ СДЕЛКИ
            ════════════════════════════════════════════════════════ */}
        <div style={{
          padding: '1.25rem 2rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          backgroundColor: '#0a1628'
        }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={() => showToast(`💬 Чат по сделке №${formData.id} открыт`)}
              style={{
                background: 'rgba(0, 229, 255, 0.1)', color: '#00e5ff',
                border: '1px solid rgba(0, 229, 255, 0.3)', padding: '10px 18px',
                borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}
            >
              💬 Чат объекта
            </button>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.06)', color: '#94a3b8',
                border: '1px solid rgba(255, 255, 255, 0.15)', padding: '10px 24px',
                borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700
              }}
            >
              Отмена
            </button>

            <button
              onClick={handleSaveWrapper}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', border: 'none', padding: '10px 28px',
                borderRadius: '10px', cursor: 'pointer', fontSize: '0.9rem',
                fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px',
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
