import React, { useState, useRef } from 'react';
import { 
  X, Phone, Navigation, MapPin, CheckCircle, Clock, 
  Camera, Plus, Trash2, Save, Send, Truck, Layers, 
  FileText, CheckSquare, Square, AlertCircle, ChevronRight
} from 'lucide-react';
import { STATUS_CONFIG, STAGE_CONFIG } from '../api/executorApi';

export default function WorkOrderDetailModal({ 
  order, 
  onClose, 
  onUpdateStatus, 
  onToggleStage, 
  onAddPhoto, 
  onRequestMachinery 
}) {
  const [activeSubTab, setActiveSubTab] = useState('stages'); // 'stages' | 'photos' | 'materials' | 'machinery'
  const [stageNotesInput, setStageNotesInput] = useState({});
  const [selectedStatus, setSelectedStatus] = useState(order.status || 'В работе');
  const [customComment, setCustomComment] = useState('');

  // Photo state
  const [photoTag, setPhotoTag] = useState('Скрытые работы');
  const fileInputRef = useRef(null);

  // Machinery state
  const [machType, setMachType] = useState('Манипулятор 10т');
  const [machDate, setMachDate] = useState(new Date().toISOString().split('T')[0]);
  const [machTime, setMachTime] = useState('10:00');
  const [machNote, setMachNote] = useState('');

  const stages = order.stages || STAGE_CONFIG.map(s => ({ id: s.id, title: s.title, done: false, time: null, note: '' }));
  const completedCount = stages.filter(s => s.done).length;

  const handleToggleStage = (stageId, currentDone) => {
    const note = stageNotesInput[stageId] || '';
    onToggleStage(order.id, stageId, !currentDone, note);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newPhoto = {
          id: `photo_${Date.now()}`,
          url: event.target?.result,
          tag: photoTag,
          caption: `${photoTag} (${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })})`,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
        };
        onAddPhoto(order.id, newPhoto);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMachineryRequest = () => {
    onRequestMachinery(order.id, machType, machDate, machTime, machNote);
    setMachNote('');
    alert(`Заявка на ${machType} оформлена на ${machDate} в ${machTime}!`);
  };

  const handleApplyStatusChange = () => {
    onUpdateStatus(order.id, selectedStatus, customComment || `Статус изменен на "${selectedStatus}"`);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.95)',
      backdropFilter: 'blur(16px)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Modal Top Header */}
      <div style={{
        padding: 'calc(14px + var(--safe-top)) 16px 12px',
        background: 'rgba(13, 21, 39, 0.98)',
        borderBottom: '1px solid rgba(0, 229, 255, 0.15)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <span style={{ fontSize: '0.72rem', color: '#00e5ff', fontWeight: 900 }}>
            НАРЯД #{order.leadNum || order.id}
          </span>
          <h2 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: '2px 0 0',
            maxWidth: '320px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {order.title}
          </h2>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Sub Tabs: Этапы | Фотоотчёт | Материалы | Техника */}
      <div style={{
        display: 'flex',
        background: 'rgba(10, 16, 31, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '4px 10px'
      }}>
        {[
          { id: 'stages', label: `Этапы (${completedCount}/7)` },
          { id: 'photos', label: `Фото (${(order.photos || []).length})` },
          { id: 'materials', label: `Материалы` },
          { id: 'machinery', label: `Техника` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom: activeSubTab === tab.id ? '2px solid #00e5ff' : '2px solid transparent',
              color: activeSubTab === tab.id ? '#00e5ff' : '#94a3b8',
              fontSize: '0.78rem',
              fontWeight: activeSubTab === tab.id ? 800 : 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {/* TAB 1: STAGES CHECKLIST */}
        {activeSubTab === 'stages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{
              background: 'rgba(0, 229, 255, 0.08)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '14px',
              padding: '12px 14px',
              marginBottom: '6px'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', marginBottom: '2px' }}>
                Пошаговый чек-лист монтажа
              </div>
              <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: 0 }}>
                Отмечайте выполненные этапы. Время фиксируется в акте на сервере.
              </p>
            </div>

            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                style={{
                  background: stage.done ? 'rgba(16, 185, 129, 0.1)' : 'rgba(13, 21, 39, 0.85)',
                  border: stage.done ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '12px',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <button
                    onClick={() => handleToggleStage(stage.id, stage.done)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      marginTop: '2px'
                    }}
                  >
                    {stage.done ? (
                      <CheckCircle size={22} color="#10b981" />
                    ) : (
                      <Square size={22} color="#64748b" />
                    )}
                  </button>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '0.88rem',
                        fontWeight: 800,
                        color: stage.done ? '#ffffff' : '#f1f5f9',
                        textDecoration: stage.done ? 'line-through' : 'none'
                      }}>
                        {idx + 1}. {stage.title}
                      </span>
                      {stage.time && (
                        <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                          ✓ {stage.time}
                        </span>
                      )}
                    </div>

                    {stage.note && (
                      <div style={{ fontSize: '0.74rem', color: '#00e5ff', marginTop: '4px', fontStyle: 'italic' }}>
                        Примечание: {stage.note}
                      </div>
                    )}

                    {!stage.done && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Заметка к этапу (глубина, уклон...)"
                          value={stageNotesInput[stage.id] || ''}
                          onChange={(e) => setStageNotesInput({ ...stageNotesInput, [stage.id]: e.target.value })}
                          style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            padding: '6px 8px',
                            color: '#ffffff',
                            fontSize: '0.74rem',
                            outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => handleToggleStage(stage.id, false)}
                          style={{
                            background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 12px',
                            color: '#060b17',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Сдать этап
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: PHOTOS */}
        {activeSubTab === 'photos' && (
          <div>
            <div style={{
              background: 'rgba(13, 21, 39, 0.85)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff', margin: '0 0 10px' }}>
                Фотофиксация и скрытые работы
              </h4>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                {['Скрытые работы', 'Котлован', 'Монтаж ЖБИ', 'Сдача'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setPhotoTag(tag)}
                    style={{
                      background: photoTag === tag ? '#00e5ff' : 'rgba(255, 255, 255, 0.05)',
                      color: photoTag === tag ? '#060b17' : '#94a3b8',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                className="exec-glow-btn"
                style={{ width: '100%', padding: '12px', fontSize: '0.88rem' }}
              >
                <Camera size={18} />
                <span>Сделать снимок / Загрузить фото</span>
              </button>
            </div>

            {/* Photos Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {(order.photos || []).map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(13, 21, 39, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  {p.url ? (
                    <img src={p.url} alt="" style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '110px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 229, 255, 0.08)', color: '#00e5ff' }}>
                      📷 Фото #{idx + 1}
                    </div>
                  )}
                  <div style={{ padding: '8px' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ffffff' }}>
                      {p.tag || 'СМР'}
                    </div>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                      {p.caption || p.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MATERIALS */}
        {activeSubTab === 'materials' && (
          <div>
            <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
              Материалы под объект
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(order.materials || []).map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(13, 21, 39, 0.85)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Количество: {m.qty} {m.unit}
                    </div>
                  </div>

                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background: m.status === 'delivered' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                    color: m.status === 'delivered' ? '#10b981' : '#f59e0b'
                  }}>
                    {m.status === 'delivered' ? '✓ Доставлено' : '⏳ В доставке'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: MACHINERY */}
        {activeSubTab === 'machinery' && (
          <div>
            {/* Request Form */}
            <div style={{
              background: 'rgba(13, 21, 39, 0.85)',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              borderRadius: '16px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#ffffff', margin: '0 0 12px' }}>
                Заказать спецтехнику на объект
              </h4>

              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Тип техники:</label>
                <select
                  value={machType}
                  onChange={(e) => setMachType(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#ffffff',
                    fontSize: '0.82rem'
                  }}
                >
                  <option value="Манипулятор 10т">Манипулятор 10т (подача колец)</option>
                  <option value="Экскаватор колесный">Экскаватор колесный (копка котлована)</option>
                  <option value="Мини-экскаватор 3т">Мини-экскаватор 3т (стесненные условия)</option>
                  <option value="Самосвал 20т">Самосвал 20т (вывоз грунта / доставка щебня)</option>
                  <option value="Ассенизатор 10м³">Ассенизатор 10м³ (откачка старой ямы)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Дата:</label>
                  <input
                    type="date"
                    value={machDate}
                    onChange={(e) => setMachDate(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '8px', color: '#00e5ff', fontSize: '0.8rem' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Время подачи:</label>
                  <input
                    type="time"
                    value={machTime}
                    onChange={(e) => setMachTime(e.target.value)}
                    style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '8px', color: '#ffffff', fontSize: '0.8rem' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '14px' }}>
                <input
                  type="text"
                  placeholder="Примечание (заезд со двора, узкие ворота...)"
                  value={machNote}
                  onChange={(e) => setMachNote(e.target.value)}
                  style={{ width: '100%', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '8px', color: '#ffffff', fontSize: '0.8rem', outline: 'none' }}
                />
              </div>

              <button
                onClick={handleSendMachineryRequest}
                className="exec-glow-btn"
                style={{ width: '100%', padding: '10px', fontSize: '0.84rem' }}
              >
                <Truck size={16} />
                <span>Отправить заявку на технику</span>
              </button>
            </div>

            {/* Existing requests */}
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              История заявок на технику
            </div>
            {(order.machinery || []).map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: 'rgba(13, 21, 39, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#00e5ff' }}>
                    {m.type}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    {m.date} в {m.time} {m.comment && `(${m.comment})`}
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700 }}>
                  ✓ Оформлено
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Controls: Status switcher & apply */}
      <div style={{
        padding: '12px 16px calc(12px + var(--safe-bottom))',
        background: 'rgba(13, 21, 39, 0.98)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        gap: '10px',
        alignItems: 'center'
      }}>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(0, 229, 255, 0.3)',
            borderRadius: '12px',
            padding: '12px 10px',
            color: '#00e5ff',
            fontSize: '0.84rem',
            fontWeight: 800,
            outline: 'none'
          }}
        >
          <option value="В работе" style={{ background: '#060b17' }}>⚙️ В работе</option>
          <option value="На объекте" style={{ background: '#060b17' }}>📍 На объекте</option>
          <option value="Приёмка" style={{ background: '#060b17' }}>🔍 Готов к приёмке</option>
          <option value="Завершено" style={{ background: '#060b17' }}>✅ Объект сдан</option>
        </select>

        <button
          onClick={handleApplyStatusChange}
          className="exec-glow-btn"
          style={{ padding: '12px 20px', fontSize: '0.86rem' }}
        >
          <span>Сохранить</span>
        </button>
      </div>
    </div>
  );
}