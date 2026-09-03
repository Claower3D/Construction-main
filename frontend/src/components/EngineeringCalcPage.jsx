import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || '';

const CITIES = [
  'Алматы', 'Астана', 'Шымкент', 'Караганда', 'Атырау', 'Актау',
  'Актобе', 'Павлодар', 'Усть-Каменогорск', 'Семей', 'Тараз',
  'Кызылорда', 'Костанай', 'Петропавловск', 'Туркестан'
];

const SYSTEMS = [
  { id: 'sewage', label: '🚿 Канализация', icon: '🔧' },
  { id: 'water_supply', label: '💧 Водоснабжение', icon: '💧' },
  { id: 'electrical', label: '⚡ Электрика', icon: '⚡' },
];

export default function EngineeringCalcPage({ onBack }) {
  const [area, setArea] = useState('100');
  const [city, setCity] = useState('Алматы');
  const [selectedSystems, setSelectedSystems] = useState(['sewage', 'water_supply', 'electrical']);
  const [sewageLength, setSewageLength] = useState('');
  const [sewageDepth, setSewageDepth] = useState('1.2');
  const [manholes, setManholes] = useState('');
  const [waterPoints, setWaterPoints] = useState('');
  const [hotWater, setHotWater] = useState(true);
  const [sockets, setSockets] = useState('');
  const [switches, setSwitches] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const toggleSystem = (sysId) => {
    setSelectedSystems(prev =>
      prev.includes(sysId) ? prev.filter(s => s !== sysId) : [...prev, sysId]
    );
  };

  const handleCalculate = async () => {
    if (!area || parseFloat(area) <= 0) {
      setError('Укажите площадь объекта');
      return;
    }
    setIsLoading(true);
    setError(null);
    setResult(null);

    const body = {
      area_m2: parseFloat(area),
      city: city.toLowerCase(),
      systems: selectedSystems,
      hot_water: hotWater,
      sewage_depth_m: parseFloat(sewageDepth) || 1.2,
      sockets: parseInt(sockets) || 0,
      switches: parseInt(switches) || 0,
    };
    if (sewageLength) body.sewage_length_m = parseFloat(sewageLength);
    if (manholes) body.manholes = parseInt(manholes);
    if (waterPoints) body.water_points = parseInt(waterPoints);

    try {
      const resp = await fetch(`${API_URL}/api/v1/engineering/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`Ошибка ${resp.status}`);
      const data = await resp.json();
      setResult(data);
    } catch (e) {
      setError(`Ошибка расчёта: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = async (format) => {
    const endpoint = format === 'pdf' ? 'report/pdf' : 'report/excel';
    const body = {
      area_m2: parseFloat(area),
      city: city.toLowerCase(),
      systems: selectedSystems,
      hot_water: hotWater,
      sewage_depth_m: parseFloat(sewageDepth) || 1.2,
      sockets: parseInt(sockets) || 0,
      switches: parseInt(switches) || 0,
    };
    if (sewageLength) body.sewage_length_m = parseFloat(sewageLength);
    if (manholes) body.manholes = parseInt(manholes);
    if (waterPoints) body.water_points = parseInt(waterPoints);

    try {
      const resp = await fetch(`${API_URL}/api/v1/engineering/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error(`Ошибка ${resp.status}`);

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smeta_qazgost_${city}_${area}m2.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError(`Ошибка скачивания: ${e.message}`);
    }
  };

  const formatPrice = (n) => new Intl.NumberFormat('ru-KZ').format(Math.round(n));

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%)', color: '#fff', padding: '20px' }}>
      {/* Header */}
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <button onClick={onBack} style={{
          background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff',
          padding: '10px 20px', borderRadius: 12, cursor: 'pointer', fontSize: 14, marginBottom: 20
        }}>← Назад</button>

        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>🏗️ Калькулятор коммуникаций</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '8px 0 0' }}>
            QazGost AI — расчёт стоимости инженерных систем по нормативам РК
          </p>
        </div>

        {/* Input Form */}
        <div style={{
          background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24,
          border: '1px solid rgba(255,255,255,0.1)', marginBottom: 20
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📋 Параметры объекта</h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Area */}
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                Площадь (м²) *
              </label>
              <input type="number" value={area} onChange={e => setArea(e.target.value)}
                style={inputStyle} placeholder="100" />
            </div>

            {/* City */}
            <div>
              <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 6 }}>
                Город
              </label>
              <select value={city} onChange={e => setCity(e.target.value)} style={inputStyle}>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Systems toggle */}
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', display: 'block', marginBottom: 8 }}>
              Инженерные системы
            </label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {SYSTEMS.map(sys => (
                <button key={sys.id} onClick={() => toggleSystem(sys.id)} style={{
                  padding: '10px 18px', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
                  background: selectedSystems.includes(sys.id) ? 'linear-gradient(135deg, #10b981, #06b6d4)' : 'rgba(255,255,255,0.08)',
                  color: '#fff',
                }}>
                  {sys.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detailed params */}
          {selectedSystems.includes('sewage') && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#10b981' }}>🚿 Канализация</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Длина трассы (м)</label>
                  <input type="number" value={sewageLength} onChange={e => setSewageLength(e.target.value)}
                    style={inputStyle} placeholder="авто" />
                </div>
                <div>
                  <label style={labelStyle}>Глубина (м)</label>
                  <input type="number" value={sewageDepth} onChange={e => setSewageDepth(e.target.value)}
                    style={inputStyle} placeholder="1.2" step="0.1" />
                </div>
                <div>
                  <label style={labelStyle}>Колодцы (шт)</label>
                  <input type="number" value={manholes} onChange={e => setManholes(e.target.value)}
                    style={inputStyle} placeholder="авто" />
                </div>
              </div>
            </div>
          )}

          {selectedSystems.includes('water_supply') && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#06b6d4' }}>💧 Водоснабжение</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Точки водоразбора</label>
                  <input type="number" value={waterPoints} onChange={e => setWaterPoints(e.target.value)}
                    style={inputStyle} placeholder="авто" />
                </div>
                <div>
                  <label style={labelStyle}>Горячая вода</label>
                  <button onClick={() => setHotWater(!hotWater)} style={{
                    ...inputStyle, cursor: 'pointer', textAlign: 'center',
                    background: hotWater ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)',
                  }}>
                    {hotWater ? '✅ Да (ХВС + ГВС)' : '❌ Нет (только ХВС)'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedSystems.includes('electrical') && (
            <div style={{ marginTop: 16, padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 14, color: '#f59e0b' }}>⚡ Электрика</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Розетки (шт)</label>
                  <input type="number" value={sockets} onChange={e => setSockets(e.target.value)}
                    style={inputStyle} placeholder="авто" />
                </div>
                <div>
                  <label style={labelStyle}>Выключатели (шт)</label>
                  <input type="number" value={switches} onChange={e => setSwitches(e.target.value)}
                    style={inputStyle} placeholder="авто" />
                </div>
              </div>
            </div>
          )}

          {/* Calculate button */}
          <button onClick={handleCalculate} disabled={isLoading} style={{
            width: '100%', marginTop: 20, padding: '16px', borderRadius: 14, border: 'none',
            fontSize: 16, fontWeight: 700, cursor: isLoading ? 'wait' : 'pointer',
            background: isLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #10b981, #3b82f6)',
            color: '#fff', transition: 'all 0.3s',
          }}>
            {isLoading ? '⏳ Расчёт...' : '🧮 Рассчитать стоимость'}
          </button>

          {error && (
            <div style={{ marginTop: 12, padding: 12, background: 'rgba(239,68,68,0.15)', borderRadius: 10, color: '#ef4444', fontSize: 14 }}>
              ❌ {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div style={{
            background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24,
            border: '1px solid rgba(16,185,129,0.3)', marginBottom: 20
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20 }}>📊 Результат расчёта</h3>

            {/* Grand total */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(59,130,246,0.15))',
              borderRadius: 14, padding: 20, textAlign: 'center', marginBottom: 20,
              border: '1px solid rgba(16,185,129,0.3)',
            }}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>Итого</div>
              <div style={{ fontSize: 36, fontWeight: 800 }}>
                {formatPrice(result.grand_total)} ₸
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                {result.city} · {result.area_m2} м² · {result.timeline_days} дней
              </div>
            </div>

            {/* Per system */}
            {result.systems && result.systems.map((sys, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, marginBottom: 12,
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 16 }}>{sys.system}</h4>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                    {formatPrice(sys.total_cost)} ₸
                  </span>
                </div>

                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 10 }}>
                  📋 {sys.snip_code} · Срок: {sys.timeline_days} дн. · Коэф.: ×{sys.regional_coeff}
                </div>

                {/* Items table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={thStyle}>Наименование</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Объём</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Ед.</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Цена</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Сумма</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sys.items && sys.items.map((item, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={tdStyle}>{item.name}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{item.volume}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{item.unit}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>{formatPrice(item.unit_price)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>{formatPrice(item.total)} ₸</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  <span>Работы: {formatPrice(sys.works_cost)} ₸</span>
                  <span>Материалы: {formatPrice(sys.materials_cost)} ₸</span>
                </div>
              </div>
            ))}

            {/* NDS note */}
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 12, textAlign: 'center' }}>
              * Цены указаны без НДС (12%). С НДС: {formatPrice(result.grand_total * 1.12)} ₸
            </div>

            {/* Download buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button onClick={() => downloadReport('pdf')} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff',
                fontSize: 14, fontWeight: 600,
              }}>
                📄 Скачать PDF
              </button>
              <button onClick={() => downloadReport('excel')} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff',
                fontSize: 14, fontWeight: 600,
              }}>
                📊 Скачать Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: 10,
  border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
  color: '#fff', fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 4,
};

const thStyle = {
  padding: '8px 6px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontWeight: 500,
};

const tdStyle = {
  padding: '8px 6px', color: 'rgba(255,255,255,0.85)',
};
