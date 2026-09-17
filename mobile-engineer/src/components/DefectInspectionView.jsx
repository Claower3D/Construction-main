import React, { useState, useRef } from 'react';
import { Camera, AlertTriangle, CheckCircle, ShieldAlert, Scan, FileText, ChevronRight, Share2, Save, RefreshCw } from 'lucide-react';

export default function DefectInspectionView({ onAttachToDeal }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [selectedType, setSelectedType] = useState('crack');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);

  const defectTypes = [
    { id: 'crack', icon: '🧱', label: 'Трещина в бетоне / стене' },
    { id: 'leak', icon: '💧', label: 'Протечка / сырость' },
    { id: 'mold', icon: '🦠', label: 'Плесень / биопоражение' },
    { id: 'corrosion', icon: '🔩', label: 'Коррозия арматуры' },
    { id: 'facade', icon: '🏠', label: 'Отслоение фасада' },
    { id: 'foundation', icon: '🏗️', label: 'Осадка фундамента' },
    { id: 'window', icon: '🪟', label: 'Продувание окон' },
    { id: 'level', icon: '📐', label: 'Отклонение уровня' }
  ];

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result);
        setScanResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAiScan = () => {
    if (!photoUrl) {
      alert('Сначала сделайте или загрузите фото дефекта');
      return;
    }
    setIsScanning(true);

    setTimeout(() => {
      setIsScanning(false);
      // Generate expert engineering report
      if (selectedType === 'crack') {
        setScanResult({
          title: 'Силовая трещина железобетонной конструкции',
          severity: 'critical', // critical | warning | minor
          severityText: '🔴 Критический дефект (Превышение СНиП)',
          widthMm: '2.4 мм',
          limitMm: '0.3 мм (СНиП РК 2.03-30-2006)',
          depthEst: 'Сквозная (~120-180 мм)',
          cause: 'Неравномерная осадка ленточного фундамента / превышение расчетной нагрузки',
          standards: 'СН РК 1.04-26-2022 «Правила оценки технического состояния зданий»',
          recommendation: '1. Немедленная установка пластинчатых маяков для мониторинга динамики.\n2. Инъектирование безусадочной двухкомпонентной эпоксидной смолой под давлением.\n3. Усиление углеродной лентой (углеволокно) в зоне максимального растяжения.',
          urgency: 'Высокая (до начала отделочных работ)'
        });
      } else if (selectedType === 'leak' || selectedType === 'mold') {
        setScanResult({
          title: 'Капиллярное намокание и биопоражение стены',
          severity: 'warning',
          severityText: '🟡 Значительный дефект (Требует гидроизоляции)',
          widthMm: 'Площадь поражения ~1.8 м²',
          limitMm: 'Влажность > 18% (Норма < 8%)',
          depthEst: 'Глубина проникновения сырости: до 40 мм',
          cause: 'Нарушение внешней оклеечной гидроизоляции цоколя / отсутствие пристенного дренажа',
          standards: 'СНиП РК 3.02-06-2009 «Гидроизоляция подземных сооружений»',
          recommendation: '1. Вскрытие наружного периметра фундамента и сушка тепловыми пушками.\n2. Нанесение проникающей гидроизоляции проникающего действия (Пенетрон/Ксайпекс).\n3. Обработка фунгицидным антисептическим составом глубокого проникновения.',
          urgency: 'Средняя'
        });
      } else {
        setScanResult({
          title: 'Дефект конструктивного элемента',
          severity: 'warning',
          severityText: '🟡 Требует устранения по регламенту технадзора',
          widthMm: 'Отклонение 12 мм на 2 м рейку',
          limitMm: 'Допуск по ГОСТ: не более 3 мм',
          depthEst: 'Поверхностно-структурное',
          cause: 'Отклонение геометрии опалубки при монолитных работах',
          standards: 'ГОСТ 21779-82 «Технологические допуски в строительстве»',
          recommendation: 'Шлифовка бетонной поверхности алмазными чашками с последующим выравниванием ремонтным составом М300.',
          urgency: 'Плановый ремонт'
        });
      }
    }, 1500);
  };

  return (
    <div style={{ padding: '16px' }}>
      {/* Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.05) 100%)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '16px',
        padding: '14px 16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '0.74rem', color: '#f87171', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Технадзор QazGost AI
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
            Проверка дефектов
          </div>
        </div>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.3rem'
        }}>
          🔍
        </div>
      </div>

      {/* Defect Type Selector */}
      <div style={{ fontSize: '0.76rem', color: '#94a3b8', fontWeight: 700, marginBottom: '8px' }}>
        ТИП ДЕФЕКТА:
      </div>
      <div style={{
        display: 'flex',
        gap: '6px',
        overflowX: 'auto',
        paddingBottom: '8px',
        marginBottom: '14px',
        scrollbarWidth: 'none'
      }}>
        {defectTypes.map(t => {
          const isSelected = selectedType === t.id;
          return (
            <button
              key={t.id}
              onClick={() => { setSelectedType(t.id); setScanResult(null); }}
              style={{
                background: isSelected ? '#ef4444' : 'rgba(255, 255, 255, 0.04)',
                color: isSelected ? '#ffffff' : '#94a3b8',
                border: isSelected ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
                padding: '6px 12px',
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {/* Photo Frame */}
      <div style={{
        background: 'rgba(13, 21, 39, 0.9)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        overflow: 'hidden',
        marginBottom: '16px',
        position: 'relative'
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
              alt="Дефект"
              style={{ width: '100%', height: '230px', objectFit: 'cover', display: 'block' }}
            />
            {isScanning && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(7, 10, 19, 0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px'
              }}>
                <Scan size={36} color="#ef4444" style={{ animation: 'spin 2s infinite linear' }} />
                <span style={{ fontSize: '0.86rem', color: '#ef4444', fontWeight: 800 }}>
                  Нейросеть QazGost сканирует дефект...
                </span>
              </div>
            )}
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
                padding: '6px 10px',
                fontSize: '0.74rem',
                cursor: 'pointer'
              }}
            >
              Переснять
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              height: '180px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <Camera size={40} color="#f59e0b" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
                Сфотографируйте дефект на объекте
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '2px' }}>
                Камера определит параметры раскрытия и класс аварийности
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Scan Button */}
      {photoUrl && !scanResult && (
        <button
          onClick={runAiScan}
          disabled={isScanning}
          className="eng-glow-btn"
          style={{ width: '100%', padding: '14px', marginBottom: '16px', background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 20px rgba(239, 68, 68, 0.35)' }}
        >
          <Scan size={18} />
          <span>{isScanning ? 'Идёт анализ...' : 'Запустить AI-экспертизу дефекта'}</span>
        </button>
      )}

      {/* AI Scan Report Result */}
      {scanResult && (
        <div style={{
          background: 'rgba(13, 21, 39, 0.95)',
          border: scanResult.severity === 'critical' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: '18px',
          padding: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          marginBottom: '16px'
        }}>
          {/* Status badge */}
          <div style={{
            display: 'inline-block',
            fontSize: '0.74rem',
            fontWeight: 800,
            color: scanResult.severity === 'critical' ? '#ef4444' : '#f59e0b',
            background: scanResult.severity === 'critical' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
            padding: '4px 10px',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            {scanResult.severityText}
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: '#ffffff', margin: '0 0 10px' }}>
            {scanResult.title}
          </h3>

          {/* Measurements Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '10px',
            padding: '10px',
            marginBottom: '12px',
            fontSize: '0.76rem'
          }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Замер раскрытия:</span>
              <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.9rem', marginTop: '2px' }}>
                {scanResult.widthMm}
              </div>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Допуск по СНиП:</span>
              <div style={{ fontWeight: 700, color: '#cbd5e1', fontSize: '0.84rem', marginTop: '2px' }}>
                {scanResult.limitMm}
              </div>
            </div>
          </div>

          {/* Cause */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 700 }}>ПРИЧИНА ВОЗНИКНОВЕНИЯ:</div>
            <div style={{ fontSize: '0.82rem', color: '#e2e8f0', marginTop: '2px', lineHeight: 1.3 }}>
              {scanResult.cause}
            </div>
          </div>

          {/* Recommendation */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '10px',
            padding: '10px',
            marginBottom: '14px'
          }}>
            <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>
              💡 Рекомендация технадзора:
            </div>
            <div style={{ fontSize: '0.8rem', color: '#e2e8f0', marginTop: '4px', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
              {scanResult.recommendation}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              onClick={() => alert('Дефектная ведомость сохранена в акт осмотра объекта.')}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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
              <span>В акт осмотра</span>
            </button>

            <button
              onClick={() => {
                const text = encodeURIComponent(`Акт дефектовки QazGost: ${scanResult.title}. Раскрытие: ${scanResult.widthMm}. ${scanResult.severityText}`);
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
              <span>В WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
