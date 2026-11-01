import React, { useState, useRef, useEffect } from 'react';
import { Camera, Calculator, Share2, Save, AlertTriangle } from 'lucide-react';
import { runVisionEstimate } from '../api/engineerApi';
import { compressImage } from '../utils/image';

const money = (v) => `${Math.round(Number(v) || 0).toLocaleString('ru-RU')} ₸`;

export default function PhotoEstimateView({ deals = [], onAttachToDeal }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [workCategory, setWorkCategory] = useState('septic');
  const [selectedRegion, setSelectedRegion] = useState('karaganda');
  const [areaSize, setAreaSize] = useState('');
  const [comment, setComment] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);
  const [error, setError] = useState(null);
  const [dealId, setDealId] = useState('');
  const [attachState, setAttachState] = useState(null);
  const fileInputRef = useRef(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  const realDeals = deals.filter(d => !d._demo);

  // serverCategory: keywords understood by the backend estimator (pkg/services/estimator.go)
  const categories = [
    { id: 'septic', label: '🕳️ Септик и сети', unit: 'м.п.', serverCategory: 'наружные сети, септик' },
    { id: 'earth', label: '🚜 Земляные работы', unit: 'м³', serverCategory: 'земляные работы, грунт' },
    { id: 'found', label: '🏗️ Фундамент', unit: 'м³', serverCategory: 'фундамент' },
    { id: 'walls', label: '🧱 Стены и кладка', unit: 'м²', serverCategory: 'стены, кладка' },
    { id: 'roof', label: '🏠 Кровля', unit: 'м²', serverCategory: 'кровля' },
    { id: 'electric', label: '⚡ Электромонтаж', unit: 'м²', serverCategory: 'электромонтаж' },
    { id: 'plumbing', label: '🚿 Сантехника', unit: 'м²', serverCategory: 'сантехника' },
    { id: 'finishing', label: '🎨 Отделка', unit: 'м²', serverCategory: 'отделка, покраска' }
  ];

  const regions = [
    { id: 'almaty', name: 'Алматы' },
    { id: 'astana', name: 'Астана' },
    { id: 'karaganda', name: 'Караганда' },
    { id: 'atyrau', name: 'Атырау' },
    { id: 'shymkent', name: 'Шымкент' },
    { id: 'aktobe', name: 'Актобе' }
  ];

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;
    try {
      const { dataUrl } = await compressImage(file, 1280, 0.7);
      if (!mountedRef.current) return;
      setPhotoUrl(dataUrl);
      setEstimateResult(null);
      setError(null);
    } catch (err) {
      setError('Не удалось прочитать фото: ' + (err.message || 'ошибка'));
    }
  };

  const runEstimate = async () => {
    const cat = categories.find(c => c.id === workCategory) || categories[0];
    const reg = regions.find(r => r.id === selectedRegion) || regions[0];
    const size = Number(String(areaSize).replace(',', '.'));
    if (areaSize !== '' && (!Number.isFinite(size) || size <= 0)) {
      setError('Объём / площадь должны быть положительным числом');
      return;
    }
    setIsCalculating(true);
    setError(null);
    setEstimateResult(null);
    setAttachState(null);
    try {
      const description = [
        cat.label.replace(/^\S+\s/, ''),
        size > 0 ? `объём/площадь: ${size} ${cat.unit}` : '',
        comment.trim()
      ].filter(Boolean).join('; ');
      const r = await runVisionEstimate({
        photoDataUrl: photoUrl,
        description,
        category: cat.serverCategory,
        city: reg.name,
        mode: 'auto'
      });
      if (mountedRef.current) {
        setEstimateResult({ ...r, categoryName: cat.label.replace(/^\S+\s/, ''), city: reg.name, sizeText: size > 0 ? `${size} ${cat.unit}` : '' });
      }
    } catch (err) {
      if (mountedRef.current) setError(err.message || 'Сервис сметы недоступен');
    } finally {
      if (mountedRef.current) setIsCalculating(false);
    }
  };

  const handleAttach = async () => {
    if (!estimateResult || !dealId || !onAttachToDeal) return;
    setAttachState({ busy: true });
    const res = await onAttachToDeal(dealId, estimateResult);
    if (mountedRef.current) setAttachState(res || { ok: false, error: 'нет ответа' });
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.05) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            QazGost Smart Estimate
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            Оценка стоимости по фото
          </div>
        </div>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
          💰
        </div>
      </div>

      {/* Photo Uploader */}
      <div style={{ background: 'rgba(13, 21, 39, 0.9)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '18px', overflow: 'hidden', marginBottom: '14px' }}>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        {photoUrl ? (
          <div style={{ position: 'relative' }}>
            <img src={photoUrl} alt="Объект" style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }} />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(7, 10, 19, 0.8)', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '8px', padding: '4px 10px', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              Сменить фото
            </button>
          </div>
        ) : (
          <div onClick={() => fileInputRef.current?.click()} style={{ height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#64748b' }}>
            <Camera size={34} color="#10b981" />
            <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700 }}>Сфотографируйте помещение или участок</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Фото необязательно — без него расчёт идёт по описанию</div>
          </div>
        )}
      </div>

      {/* Category selector */}
      <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>ВИД СТРОИТЕЛЬНЫХ РАБОТ:</div>
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '14px', scrollbarWidth: 'none' }}>
        {categories.map(cat => {
          const isSelected = workCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setWorkCategory(cat.id)}
              style={{ background: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.04)', color: isSelected ? '#070a13' : '#94a3b8', border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.08)', padding: '6px 12px', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700, whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Region & Area Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Город РК:</label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{ width: '100%', background: '#142038', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '8px 10px', color: '#ffffff', fontSize: '0.82rem', outline: 'none' }}
          >
            {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Объём / Площадь:</label>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            value={areaSize}
            onChange={(e) => setAreaSize(e.target.value)}
            placeholder="напр. 25"
            style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '8px 10px', color: '#ffffff', fontSize: '0.86rem', outline: 'none' }}
          />
        </div>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="Комментарий для сметчика (глубина, материалы, особенности объекта)..."
        style={{ width: '100%', background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '10px', padding: '8px 10px', color: '#ffffff', fontSize: '0.8rem', outline: 'none', marginBottom: '14px', resize: 'vertical' }}
      />

      {/* Run Calc Button */}
      <button
        onClick={runEstimate}
        disabled={isCalculating}
        className="eng-glow-btn"
        style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)', marginBottom: '16px' }}
      >
        <Calculator size={18} />
        <span>{isCalculating ? 'Сервер считает смету...' : 'Рассчитать смету по объекту'}</span>
      </button>

      {error && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', borderRadius: '12px', padding: '12px', color: '#fca5a5', fontSize: '0.82rem', marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Estimate Result Block */}
      {estimateResult && (
        <div style={{ background: 'rgba(13, 21, 39, 0.95)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '18px', padding: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>ИТОГОВАЯ СМЕТА ({estimateResult.source}):</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>{money(estimateResult.total)}</div>
            </div>
            {estimateResult.days > 0 && (
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.76rem', color: '#10b981', fontWeight: 800 }}>
                ⏱️ {estimateResult.days} дн.
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginBottom: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}><span>🔨 Работы:</span><strong>{money(estimateResult.works)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}><span>🧱 Материалы:</span><strong>{money(estimateResult.materials)}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}><span>🚜 Техника:</span><strong>{money(estimateResult.equipment)}</strong></div>
            {estimateResult.contingency > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}><span>📎 Непредвиденные:</span><strong>{money(estimateResult.contingency)}</strong></div>
            )}
          </div>

          {estimateResult.items.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>📦 Позиции сметы:</div>
              {estimateResult.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '0.76rem', color: '#e2e8f0', marginBottom: '3px' }}>
                  <span>• {it.name}{it.qty ? ` — ${Math.round(Number(it.qty) * 100) / 100} ${it.unit || ''}` : ''}</span>
                  <span style={{ color: '#94a3b8', whiteSpace: 'nowrap' }}>{it.total ? money(it.total) : ''}</span>
                </div>
              ))}
            </div>
          )}

          {estimateResult.insights.length > 0 && (
            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '12px' }}>
              {estimateResult.insights.slice(0, 4).map((t, i) => <div key={i}>💡 {t}</div>)}
            </div>
          )}

          {/* Attach to object */}
          <select
            value={dealId}
            onChange={(e) => { setDealId(e.target.value); setAttachState(null); }}
            style={{ width: '100%', background: '#142038', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', padding: '8px 10px', color: '#fff', fontSize: '0.8rem', marginBottom: '8px' }}
          >
            <option value="">— объект для сметы —</option>
            {realDeals.map(d => <option key={d.id} value={d.id}>#{d.leadNum || d.id} • {d.title}</option>)}
          </select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={handleAttach}
              disabled={!dealId || attachState?.busy}
              style={{ background: dealId ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.06)', color: dealId ? '#070a13' : '#64748b', border: 'none', borderRadius: '10px', padding: '10px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: dealId ? 'pointer' : 'default' }}
            >
              <Save size={14} />
              <span>{attachState?.busy ? 'Отправка...' : 'В карточку объекта'}</span>
            </button>

            <button
              onClick={() => {
                const text = encodeURIComponent(`Смета QazGost (${estimateResult.categoryName}, ${estimateResult.city}): ${money(estimateResult.total)}${estimateResult.days ? `. Срок: ${estimateResult.days} дн.` : ''}`);
                window.open(`https://wa.me/?text=${text}`, '_system');
              }}
              style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: '10px', padding: '10px', fontSize: '0.78rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', cursor: 'pointer' }}
            >
              <Share2 size={14} />
              <span>Клиенту</span>
            </button>
          </div>

          {attachState && !attachState.busy && (
            <div style={{ marginTop: '10px', fontSize: '0.76rem', fontWeight: 700, color: attachState.ok && attachState.synced ? '#10b981' : '#fbbf24' }}>
              {!attachState.ok
                ? `⚠ Не сохранено: ${attachState.error}`
                : attachState.synced
                  ? '✓ Смета сохранена в объекте и отправлена менеджеру (на сервер)'
                  : `⚠ Смета сохранена на телефоне, но НЕ отправлена менеджеру (${attachState.error}). Отправится при следующей синхронизации.`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
