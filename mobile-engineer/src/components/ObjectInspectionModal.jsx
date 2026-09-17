import React, { useState, useRef } from 'react';
import { 
  X, Phone, MessageCircle, Navigation, MapPin, CheckCircle, 
  Mic, MicOff, Camera, Plus, Trash2, Save, Send, Clock, 
  AlertTriangle, FileText, Calculator, Layers, Info
} from 'lucide-react';
import { STATUS_CONFIG } from '../api/engineerApi';

export default function ObjectInspectionModal({ deal, onClose, onUpdateStatus, onSaveInspection }) {
  const [activeTab, setActiveTab] = useState('measurements'); // 'measurements' | 'status' | 'photos' | 'estimate'
  
  // Status state
  const [currentStatus, setCurrentStatus] = useState(deal.status || 'Новые');
  const [engineerNote, setEngineerNote] = useState('');

  // Measurements checklist state
  const inspection = deal.inspection || {};
  const [depth, setDepth] = useState(inspection.depth || '2.8');
  const [ringsDiameter, setRingsDiameter] = useState(inspection.ringsDiameter || 'КС-15 (1.5м)');
  const [ringsCount, setRingsCount] = useState(inspection.ringsCount || '3');
  const [pipeLength, setPipeLength] = useState(inspection.pipeLength || '8');
  const [soilType, setSoilType] = useState(inspection.soilType || 'Суглинок');
  const [groundWater, setGroundWater] = useState(inspection.groundWater || 'Низкий (>3м)');
  const [accessTruck, setAccessTruck] = useState(inspection.accessTruck || 'Удобный (прямой заезд)');
  const [oldPit, setOldPit] = useState(inspection.oldPit || 'Нет');
  const [customNotes, setCustomNotes] = useState(inspection.notes || '');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);

  // Photos state
  const [photos, setPhotos] = useState(inspection.photos || [
    { id: 'p1', tag: 'Общий вид', caption: 'Место будущего котлована', time: '11:20' }
  ]);
  const [photoTag, setPhotoTag] = useState('Общий вид');
  const fileInputRef = useRef(null);

  // Estimate state
  const [estimateItems, setEstimateItems] = useState([
    { id: 1, name: 'Кольцо ЖБИ КС-15.9 (1.5м)', qty: Number(ringsCount) || 3, unit: 'шт', price: 28000 },
    { id: 2, name: 'Плита перекрытия ПП-15', qty: 1, unit: 'шт', price: 26000 },
    { id: 3, name: 'Люк полимерно-песчаный 6т', qty: 1, unit: 'шт', price: 14000 },
    { id: 4, name: 'Копка котлована экскаватором', qty: 1, unit: 'усл', price: 45000 },
    { id: 5, name: 'Труба канализационная рыжая d110 (2м)', qty: Math.ceil(Number(pipeLength)/2) || 4, unit: 'шт', price: 4200 },
    { id: 6, name: 'Доставка манипулятором и монтаж', qty: 1, unit: 'рейс', price: 35000 }
  ]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  const calculateTotal = () => {
    return estimateItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
  };

  // Voice notes handler
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      alert('Голосовой ввод не поддерживается браузером. Вы можете ввести заметку текстом.');
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = 'ru-RU';
      rec.continuous = true;
      rec.interimResults = true;

      rec.onresult = (e) => {
        let text = '';
        for (let i = 0; i < e.results.length; i++) {
          text += e.results[i][0].transcript + ' ';
        }
        setVoiceTranscript(text);
        setCustomNotes(prev => (prev ? prev + ' ' : '') + text);
      };

      rec.onerror = (err) => {
        console.warn('Voice error:', err);
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.start();
      recognitionRef.current = rec;
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setIsRecording(false);
    }
  };

  // Add photo
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
        setPhotos(prev => [newPhoto, ...prev]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = () => {
    const inspectionData = {
      depth,
      ringsDiameter,
      ringsCount,
      pipeLength,
      soilType,
      groundWater,
      accessTruck,
      oldPit,
      notes: customNotes,
      photos,
      estimate: estimateItems,
      totalEstimate: calculateTotal()
    };
    onSaveInspection(deal.id, inspectionData);
    if (currentStatus !== deal.status) {
      onUpdateStatus(deal.id, currentStatus, engineerNote || 'Обновлены замеры инженера');
    }
    onClose();
  };

  const handleCall = () => {
    if (deal.phone) window.open(`tel:${deal.phone.replace(/[^0-9+]/g, '')}`, '_system');
  };

  const handleWhatsApp = () => {
    if (deal.phone) {
      const cleanPhone = deal.phone.replace(/[^0-9]/g, '');
      const text = encodeURIComponent(`Здравствуйте, ${deal.client}! На связи инженер QazGost по объекту «${deal.location}».`);
      window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_system');
    }
  };

  const handle2GIS = () => {
    if (deal.location) {
      window.open(`https://2gis.kz/search/${encodeURIComponent(deal.location)}`, '_system');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.96)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      {/* Top Header */}
      <div style={{
        padding: 'calc(12px + var(--safe-top)) 16px 12px',
        background: 'rgba(13, 21, 39, 0.98)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            color: '#070a13',
            fontWeight: 900
          }}>
            📐
          </div>
          <div>
            <h2 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Акт осмотра #{deal.leadNum || deal.id.slice(-3)}
            </h2>
            <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 600 }}>
              {deal.client} • {deal.title}
            </span>
          </div>
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

      {/* Quick Contact & Map bar */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.03)',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#94a3b8', flex: 1, marginRight: '10px' }}>
          <MapPin size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {deal.location}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={handleCall} style={{ background: 'rgba(16, 185, 129, 0.2)', border: 'none', borderRadius: '8px', padding: '6px 8px', color: '#10b981', cursor: 'pointer' }}>
            <Phone size={14} />
          </button>
          <button onClick={handleWhatsApp} style={{ background: 'rgba(34, 197, 94, 0.2)', border: 'none', borderRadius: '8px', padding: '6px 8px', color: '#4ade80', cursor: 'pointer' }}>
            <MessageCircle size={14} />
          </button>
          <button onClick={handle2GIS} style={{ background: 'rgba(245, 158, 11, 0.2)', border: 'none', borderRadius: '8px', padding: '6px 8px', color: '#f59e0b', cursor: 'pointer' }}>
            <Navigation size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        background: 'rgba(10, 16, 31, 0.95)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        {[
          { id: 'measurements', label: '📐 Чек-лист замера' },
          { id: 'status', label: '🚦 Статус' },
          { id: 'photos', label: `📸 Фото (${photos.length})` },
          { id: 'estimate', label: '💰 Смета' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              padding: '12px 4px',
              fontSize: '0.78rem',
              fontWeight: activeTab === t.id ? 800 : 600,
              color: activeTab === t.id ? '#f59e0b' : '#64748b',
              borderBottom: activeTab === t.id ? '2px solid #f59e0b' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>

        {/* TAB 1: MEASUREMENTS */}
        {activeTab === 'measurements' && (
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', marginBottom: '12px', textTransform: 'uppercase' }}>
              Параметры объекта (Септик / Коммуникации)
            </div>

            {/* Depth & Rings */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Глубина ямы (м)
                </label>
                <input
                  type="text"
                  value={depth}
                  onChange={(e) => setDepth(e.target.value)}
                  placeholder="2.8"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Кол-во колец (шт)
                </label>
                <input
                  type="number"
                  value={ringsCount}
                  onChange={(e) => setRingsCount(e.target.value)}
                  placeholder="3"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Rings Diameter & Pipe Length */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Диаметр ЖБ колец
                </label>
                <select
                  value={ringsDiameter}
                  onChange={(e) => setRingsDiameter(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#142038',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="КС-10 (1.0м)">КС-10 (1.0м)</option>
                  <option value="КС-15 (1.5м)">КС-15 (1.5м)</option>
                  <option value="КС-20 (2.0м)">КС-20 (2.0м)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Длина трубы до врезки (м)
                </label>
                <input
                  type="text"
                  value={pipeLength}
                  onChange={(e) => setPipeLength(e.target.value)}
                  placeholder="8"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Soil Type & Ground Water */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Тип грунта
                </label>
                <select
                  value={soilType}
                  onChange={(e) => setSoilType(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#142038',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="Суглинок">Суглинок</option>
                  <option value="Песок / Супесь">Песок / Супесь</option>
                  <option value="Глина плотная">Глина плотная</option>
                  <option value="Скала / Бут">Скала / Бут</option>
                  <option value="Чернозем">Чернозем</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                  Грунтовые воды (УГВ)
                </label>
                <select
                  value={groundWater}
                  onChange={(e) => setGroundWater(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#142038',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    color: '#ffffff',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                >
                  <option value="Низкий (>3м)">Низкий (&gt;3м)</option>
                  <option value="Средний (2-3м)">Средний (2-3м)</option>
                  <option value="Высокий (<2м)">Высокий (&lt;2м, плывун)</option>
                </select>
              </div>
            </div>

            {/* Access for machinery */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
                Подъезд манипулятора / экскаватора
              </label>
              <select
                value={accessTruck}
                onChange={(e) => setAccessTruck(e.target.value)}
                style={{
                  width: '100%',
                  background: '#142038',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              >
                <option value="Удобный (прямой заезд)">Удобный (прямой заезд)</option>
                <option value="Затруднён (узкие ворота / провода)">Затруднён (узкие ворота / провода)</option>
                <option value="Только вручную (заезд невозможен)">Только вручную (заезд невозможен)</option>
              </select>
            </div>

            {/* Voice Notes Feature */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '14px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f59e0b' }}>
                  🎙️ Голосовые заметки инженера
                </span>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  style={{
                    background: isRecording ? '#ef4444' : '#f59e0b',
                    color: '#070a13',
                    border: 'none',
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    animation: isRecording ? 'pulseGlow 1s infinite' : 'none'
                  }}
                >
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isRecording ? 'Идёт запись (Стоп)' : 'Надиктовать'}</span>
                </button>
              </div>

              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Особенности участка, уклон, препятствия, договоренности с клиентом..."
                rows={3}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '10px',
                  color: '#ffffff',
                  fontSize: '0.86rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
        )}

        {/* TAB 2: STATUS */}
        {activeTab === 'status' && (
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', marginBottom: '12px', textTransform: 'uppercase' }}>
              Статус выезда и осмотра
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {Object.keys(STATUS_CONFIG).map((st) => {
                const conf = STATUS_CONFIG[st];
                const isSelected = currentStatus === st;
                return (
                  <div
                    key={st}
                    onClick={() => setCurrentStatus(st)}
                    style={{
                      background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem' }}>{conf.icon}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: isSelected ? '#f59e0b' : '#ffffff' }}>
                        {conf.label}
                      </span>
                    </div>
                    {isSelected && <CheckCircle size={18} color="#f59e0b" />}
                  </div>
                );
              })}
            </div>

            {/* Note to status change */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px' }}>
                Комментарий к смене статуса (виден менеджеру)
              </label>
              <input
                type="text"
                value={engineerNote}
                onChange={(e) => setEngineerNote(e.target.value)}
                placeholder="Напр., Выехал на замер, буду через 25 минут..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  color: '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            {/* Manager Notes History */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', padding: '12px' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>
                История заметок по заявке
              </div>
              {(deal.notes || []).map((n, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '6px', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#f59e0b' }}>
                    <span>{n.author || 'Менеджер'}</span>
                    <span>{n.time || ''}</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#cbd5e1', marginTop: '2px' }}>
                    {n.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: PHOTOS */}
        {activeTab === 'photos' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                Фотофиксация объекта
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#070a13',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <Camera size={15} />
                <span>Сделать фото</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />

            {/* Category tag selector */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px' }}>
              {['Общий вид', 'Место котлована', 'Ввод трубы', 'Препятствие', 'Схема/Акт'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPhotoTag(tag)}
                  style={{
                    background: photoTag === tag ? '#f59e0b' : 'rgba(255, 255, 255, 0.05)',
                    color: photoTag === tag ? '#070a13' : '#94a3b8',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 10px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Photos Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {photos.map((p, idx) => (
                <div
                  key={p.id || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    height: '110px',
                    background: p.url ? `url(${p.url}) center/cover no-repeat` : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748b'
                  }}>
                    {!p.url && <Camera size={28} />}
                  </div>
                  <div style={{ padding: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        {p.tag || 'Фото'}
                      </span>
                      <span style={{ fontSize: '0.66rem', color: '#64748b' }}>{p.time || ''}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.caption || 'Без описания'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ESTIMATE */}
        {activeTab === 'estimate' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase' }}>
                Полевая смета на объекте
              </div>
              <span style={{ fontSize: '0.98rem', fontWeight: 900, color: '#10b981' }}>
                {calculateTotal().toLocaleString('ru-RU')} ₸
              </span>
            </div>

            {/* Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {estimateItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ flex: 1, marginRight: '8px' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                      {item.qty} {item.unit} × {item.price.toLocaleString('ru-RU')} ₸
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#10b981' }}>
                      {(item.qty * item.price).toLocaleString('ru-RU')} ₸
                    </span>
                    <button
                      type="button"
                      onClick={() => setEstimateItems(prev => prev.filter((_, i) => i !== idx))}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick add item */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              padding: '12px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
                + Добавить позицию в смету
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Наименование (напр., Песок 5т)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#ffffff',
                    fontSize: '0.8rem'
                  }}
                />
                <input
                  type="number"
                  placeholder="Цена (₸)"
                  value={newItemPrice}
                  onChange={(e) => setNewItemPrice(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    color: '#ffffff',
                    fontSize: '0.8rem'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newItemName && newItemPrice) {
                      setEstimateItems(prev => [...prev, {
                        id: Date.now(),
                        name: newItemName,
                        qty: 1,
                        unit: 'компл',
                        price: Number(newItemPrice)
                      }]);
                      setNewItemName('');
                      setNewItemPrice('');
                    }
                  }}
                  style={{
                    background: '#f59e0b',
                    color: '#070a13',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Save & Commit Bar */}
      <div style={{
        padding: '12px 16px calc(12px + var(--safe-bottom))',
        background: 'rgba(13, 21, 39, 0.98)',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={handleSaveAll}
          className="eng-glow-btn"
          style={{ flex: 1, padding: '14px', fontSize: '0.95rem' }}
        >
          <Save size={18} />
          <span>Сохранить замер и передать</span>
        </button>
      </div>
    </div>
  );
}
