import React, { useState } from 'react';
import { Calculator, Shovel, ShieldAlert, CheckCircle2, ChevronRight, Info } from 'lucide-react';

export default function EngineeringCalcView() {
  const [calcTab, setCalcTab] = useState('septic'); // 'septic' | 'earthwork' | 'snip'

  // Septic calculator state
  const [persons, setPersons] = useState(4);
  const [waterPerPerson, setWaterPerPerson] = useState(200); // l/day
  const dailyDischarge = persons * waterPerPerson;
  const septicVolume = ((dailyDischarge * 3) / 1000).toFixed(1); // 3-day volume in m3
  const ringsNeeded15 = Math.ceil(Number(septicVolume) / 1.59); // 1.59 m3 per KS-15 ring

  // Earthwork calculator state
  const [pitLength, setPitLength] = useState(3.0);
  const [pitWidth, setPitWidth] = useState(2.5);
  const [pitDepth, setPitDepth] = useState(3.0);
  const [soilCoeff, setSoilCoeff] = useState(1.25); // 1.25 for loam

  const geomVolume = (pitLength * pitWidth * pitDepth).toFixed(2);
  const looseVolume = (geomVolume * soilCoeff).toFixed(2);
  const truckRides10 = Math.ceil(looseVolume / 10);
  const digPriceEstimate = Math.round(geomVolume * 2500);

  return (
    <div style={{ padding: '16px' }}>
      {/* Tab Switcher */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '4px',
        marginBottom: '16px'
      }}>
        {[
          { id: 'septic', label: '🕳️ Септик' },
          { id: 'earthwork', label: '🚜 Грунт' },
          { id: 'snip', label: '📜 СНиП РК' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setCalcTab(t.id)}
            style={{
              flex: 1,
              background: calcTab === t.id ? '#f59e0b' : 'none',
              color: calcTab === t.id ? '#070a13' : '#94a3b8',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 4px',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. SEPTIC SIZING */}
      {calcTab === 'septic' && (
        <div style={{
          background: 'rgba(13, 21, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '18px'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Расчёт объёма септика по СНиП
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '16px' }}>
            Минимальный рабочий объём равен 3-суточному притоку сточных вод.
          </p>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '6px' }}>
              <span>Количество проживающих:</span>
              <span style={{ fontWeight: 800, color: '#f59e0b' }}>{persons} чел.</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={persons}
              onChange={(e) => setPersons(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#f59e0b' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#cbd5e1', marginBottom: '6px' }}>
              <span>Расход воды на 1 чел:</span>
              <span style={{ fontWeight: 800, color: '#00e5ff' }}>{waterPerPerson} л/сутки</span>
            </div>
            <input
              type="range"
              min="100"
              max="300"
              step="20"
              value={waterPerPerson}
              onChange={(e) => setWaterPerPerson(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#00e5ff' }}
            />
          </div>

          {/* Results Block */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '14px',
            padding: '16px',
            marginBottom: '16px'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Суточный сброс:</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>{dailyDischarge} л/день</div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Рабочий объём:</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f59e0b' }}>{septicVolume} м³</div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
              <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 800, marginBottom: '4px' }}>
                💡 Рекомендуемая комплектация ЖБИ:
              </div>
              <div style={{ fontSize: '0.84rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                • <strong>2 колодца</strong> (1-й септический отстойник с дном, 2-й фильтрационный без дна).<br/>
                • Диаметр колец: <strong>КС-15.9 (1.5м)</strong> — {ringsNeeded15 + 2} шт суммарно.<br/>
                • Перелив между колодцами трубой d110 с тройниками.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. EARTHWORK CALCULATOR */}
      {calcTab === 'earthwork' && (
        <div style={{
          background: 'rgba(13, 21, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '18px'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Калькулятор выемки грунта
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '16px' }}>
            Геометрический объём и разрыхление грунта для вывоза самосвалами.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Длина (м)</label>
              <input
                type="number"
                step="0.1"
                value={pitLength}
                onChange={(e) => setPitLength(Number(e.target.value))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Ширина (м)</label>
              <input
                type="number"
                step="0.1"
                value={pitWidth}
                onChange={(e) => setPitWidth(Number(e.target.value))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>Глубина (м)</label>
              <input
                type="number"
                step="0.1"
                value={pitDepth}
                onChange={(e) => setPitDepth(Number(e.target.value))}
                style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', marginBottom: '4px' }}>
              Тип грунта (коэффициент разрыхления)
            </label>
            <select
              value={soilCoeff}
              onChange={(e) => setSoilCoeff(Number(e.target.value))}
              style={{ width: '100%', background: '#142038', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px', color: '#fff' }}
            >
              <option value="1.15">Песок / Супесь (К = 1.15)</option>
              <option value="1.25">Суглинок (К = 1.25)</option>
              <option value="1.32">Глина тяжелая (К = 1.32)</option>
              <option value="1.45">Скала / Бут (К = 1.45)</option>
            </select>
          </div>

          {/* Results */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            padding: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem' }}>
              <span style={{ color: '#94a3b8' }}>Геометрический объём:</span>
              <strong style={{ color: '#fff' }}>{geomVolume} м³</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem' }}>
              <span style={{ color: '#94a3b8' }}>Объём для вывоза (рыхлый):</span>
              <strong style={{ color: '#f59e0b' }}>{looseVolume} м³</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.86rem' }}>
              <span style={{ color: '#94a3b8' }}>Самосвалы (КАМАЗ 10м³):</span>
              <strong style={{ color: '#00e5ff' }}>{truckRides10} рейса(ов)</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.88rem' }}>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Ориентир стоимости копки:</span>
              <strong style={{ color: '#10b981' }}>{digPriceEstimate.toLocaleString('ru-RU')} ₸</strong>
            </div>
          </div>
        </div>
      )}

      {/* 3. SNiP REGULATIONS */}
      {calcTab === 'snip' && (
        <div style={{
          background: 'rgba(13, 21, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '18px',
          padding: '18px'
        }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
            Санитарные нормы СНиП / СанПиН РК
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '14px' }}>
            Минимальные отступы для монтажа наружной канализации и септиков на частном участке:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { title: 'До фундамента жилого дома', val: '≥ 5 метров', note: 'Предотвращает подмыв фундамента здания', ok: true },
              { title: 'До забора / границы с соседями', val: '≥ 2–4 метра', note: 'По нормам добрососедства и СНиП', ok: true },
              { title: 'До питьевой скважины / колодца', val: '≥ 20–50 метров', note: 'Зависит от фильтрующих свойств грунта', ok: true },
              { title: 'До водопроводной магистрали', val: '≥ 10 метров', note: 'Исключает риск заражения питьевой воды', ok: true },
              { title: 'До проезжей части / дороги', val: '≥ 5 метров', note: 'Для сохранения дорожного полотна', ok: true },
              { title: 'Уклон трубы d110 наружной канализации', val: '2 см на 1 метр', note: 'Оптимальная самоочищающаяся скорость потока', ok: true },
              { title: 'Глубина промерзания грунта (Караганда/Астана)', val: '1.8 – 2.2 метра', note: 'Требуется утепление трубы (скорлупа ППУ/пеноплекс)', ok: true }
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '10px 12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#ffffff' }}>
                    {item.title}
                  </span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 900, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                    {item.val}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                  {item.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
