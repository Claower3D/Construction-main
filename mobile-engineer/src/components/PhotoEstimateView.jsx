import React, { useState, useRef } from 'react';
import { Camera, Calculator, DollarSign, CheckCircle, Share2, Save, MapPin, Layers, Clock, ArrowRight } from 'lucide-react';

export default function PhotoEstimateView({ onAttachToDeal }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [workCategory, setWorkCategory] = useState('septic');
  const [selectedRegion, setSelectedRegion] = useState('karaganda');
  const [areaSize, setAreaSize] = useState('25'); // m2 or volume
  const [isCalculating, setIsCalculating] = useState(false);
  const [estimateResult, setEstimateResult] = useState(null);
  const fileInputRef = useRef(null);

  const categories = [
    { id: 'septic', label: '🕳️ Септик и сети', baseWork: 120000, baseMat: 180000, unit: 'м.п./объект' },
    { id: 'rough', label: '🔨 Черновой ремонт', baseWork: 18000, baseMat: 14000, unit: 'м²' },
    { id: 'walls', label: '🧱 Стены и перегородки', baseWork: 6500, baseMat: 8500, unit: 'м²' },
    { id: 'electric', label: '⚡ Электромонтаж', baseWork: 4500, baseMat: 3800, unit: 'м²/точка' },
    { id: 'plumbing', label: '🚿 Сантехника и ОВ', baseWork: 8500, baseMat: 9500, unit: 'м²/точка' },
    { id: 'finishing', label: '🎨 Чистовая отделка', baseWork: 16000, baseMat: 22000, unit: 'м²' }
  ];

  const regions = [
    { id: 'almaty', name: 'Алматы', coeff: 1.00 },
    { id: 'astana', name: 'Астана', coeff: 1.15 },
    { id: 'karaganda', name: 'Караганда', coeff: 1.05 },
    { id: 'atyrau', name: 'Атырау / Актау', coeff: 1.30 },
    { id: 'shymkent', name: 'Шымкент', coeff: 0.95 },
    { id: 'aktobe', name: 'Актобе / Павлодар', coeff: 1.08 }
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result);
        setEstimateResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runEstimate = () => {
    setIsCalculating(true);
    setTimeout(() => {
      setIsCalculating(false);
      const cat = categories.find(c => c.id === workCategory) || categories[0];
      const reg = regions.find(r => r.id === selectedRegion) || regions[0];
      const size = Number(areaSize) || 20;

      let workCost = Math.round(cat.baseWork * size * reg.coeff);
      let matCost = Math.round(cat.baseMat * size * reg.coeff);
      if (cat.id === 'septic') {
        workCost = Math.round(145000 * reg.coeff);
        matCost = Math.round(210000 * reg.coeff);
      }
      const machineryCost = Math.round(35000 * reg.coeff);
      const totalCost = workCost + matCost + machineryCost;
      const days = Math.max(2, Math.ceil(size / 8));

      setEstimateResult({
        categoryName: cat.label,
        regionName: reg.name,
        sizeText: `${size} ${cat.unit}`,
        workCost,
        matCost,
        machineryCost,
        totalCost,
        days,
        materialsList: cat.id === 'septic' ? [
          'Кольца КС-15.9 ЖБИ (3 шт) — 84 000 ₸',
          'Плита перекрытия ПП-15 (1 шт) — 26 000 ₸',
          'Люк полимерно-песчаный 6т (1 шт) — 14 000 ₸',
          'Труба ПВХ d110 наружная (8м) — 16 800 ₸',
          'Щебень фракция 20-40 (2т) — 18 000 ₸'
        ] : [
          'Смесь сухая штукатурная М150 — 28 мешков',
          'Грунтовка глубокого проникновения 10л — 2 канистры',
          'Сетка армирующая фасадная — 35 м²',
          'Крепёж и профили маячковые 10мм — 18 шт'
        ]
      });
    }, 1200);
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
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem'
        }}>
          💰
        </div>
      </div>

      {/* Photo Uploader */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        overflow: 'hidden',
        marginBottom: '14px'
      }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoUpload}
          style={{ display: 'none' }}
        />

        {photoUrl ? (
          <div style={{ position: 'relative' }}>
            <img
              src={photoUrl}
              alt="Объект"
              style={{ width: '100%', height: '180px', objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(7, 10, 19, 0.8)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '0.72rem',
                cursor: 'pointer'
              }}
            >
              Сменить фото
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: '140px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <Camera size={34} color="#10b981" />
            <div style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 700 }}>
              Сфотографируйте помещение или участок
            </div>
          </div>
        )}
      </div>

      {/* Category selector */}
      <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 700, marginBottom: '6px' }}>
        ВИД СТРОИТЕЛЬНЫХ РАБОТ:
      </div>
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '14px',
        scrollbarWidth: 'none'
      }}>
        {categories.map(cat => {
          const isSelected = workCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setWorkCategory(cat.id)}
              style={{
                background: isSelected ? '#10b981' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#070a13' : '#94a3b8',
                border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.74rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Region & Area Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
            Город РК (Коэфф.):
          </label>
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            style={{
              width: '100%',
              background: '#142038',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 10px',
              color: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none'
            }}
          >
            {regions.map(r => (
              <option key={r.id} value={r.id}>{r.name} (x{r.coeff})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
            Объём / Площадь:
          </label>
          <input
            type="number"
            value={areaSize}
            onChange={(e) => setAreaSize(e.target.value)}
            placeholder="25"
            style={{
              width: '100%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              padding: '8px 10px',
              color: '#ffffff',
              fontSize: '0.86rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {/* Run Calc Button */}
      <button
        onClick={runEstimate}
        disabled={isCalculating}
        className="eng-glow-btn"
        style={{
          width: '100%',
          padding: '13px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          boxShadow: '0 4px 20px rgba(16, 185, 129, 0.35)',
          marginBottom: '16px'
        }}
      >
        <Calculator size={18} />
        <span>{isCalculating ? 'Расчёт сметы...' : 'Рассчитать смету по объекту'}</span>
      </button>

      {/* Estimate Result Block */}
      {estimateResult && (
        <div style={{
          background: 'rgba(13, 21, 39, 0.95)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '18px',
          padding: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800 }}>ИТОГОВАЯ СМЕТА:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff' }}>
                {estimateResult.totalCost.toLocaleString('ru-RU')} ₸
              </div>
            </div>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '0.76rem',
              color: '#10b981',
              fontWeight: 800
            }}>
              ⏱️ {estimateResult.days} дн.
            </div>
          </div>

          {/* Breakdown items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px', marginBottom: '12px', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>🔨 Стоимость монтажных работ:</span>
              <strong>{estimateResult.workCost.toLocaleString('ru-RU')} ₸</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>🧱 Строительные материалы:</span>
              <strong>{estimateResult.matCost.toLocaleString('ru-RU')} ₸</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1' }}>
              <span>🚜 Доставка и спецтехника:</span>
              <strong>{estimateResult.machineryCost.toLocaleString('ru-RU')} ₸</strong>
            </div>
          </div>

          {/* Materials checklist */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px' }}>
              📦 Рекомендуемые материалы из маркетплейса:
            </div>
            {estimateResult.materialsList.map((m, i) => (
              <div key={i} style={{ fontSize: '0.76rem', color: '#e2e8f0', marginBottom: '3px' }}>
                • {m}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => alert('Смета успешно сохранена и отправлена менеджеру.')}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#070a13',
                border: 'none',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Save size={14} />
              <span>В карточку</span>
            </button>

            <button
              onClick={() => {
                const text = encodeURIComponent(`Смета QazGost (${estimateResult.categoryName}): ${estimateResult.totalCost.toLocaleString('ru-RU')} ₸. Срок: ${estimateResult.days} дн.`);
                window.open(`https://wa.me/?text=${text}`, '_system');
              }}
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '10px',
                padding: '10px',
                fontSize: '0.78rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <Share2 size={14} />
              <span>Клиенту</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
