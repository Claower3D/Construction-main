import React, { useState } from 'react';
import './EngineeringCalcPage.css';

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

  const sysOn = (id) => selectedSystems.includes(id);

  return (
    <div className="ec-page">
      <div className="ec-wrap">
        <button type="button" className="qg-btn qg-btn--ghost qg-btn--sm ec-back" onClick={onBack}>← Назад</button>

        <header className="ec-head">
          <h1>Калькулятор коммуникаций</h1>
          <p>Стоимость канализации, водоснабжения и электрики по нормативам РК с поправкой на город. Пустые поля считаются автоматически по площади.</p>
        </header>

        <form className="ec-card" onSubmit={(e) => { e.preventDefault(); handleCalculate(); }} noValidate>
          <fieldset className="ec-fieldset">
            <legend>Объект</legend>
            <div className="ec-grid ec-grid--2">
              <label className="ec-field" htmlFor="ec-area">
                <span>Площадь, м²</span>
                <input id="ec-area" type="number" inputMode="decimal" min="1" required value={area} onChange={e => setArea(e.target.value)} placeholder="100" />
              </label>
              <label className="ec-field" htmlFor="ec-city">
                <span>Город</span>
                <select id="ec-city" value={city} onChange={e => setCity(e.target.value)}>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
            </div>
          </fieldset>

          <fieldset className="ec-fieldset">
            <legend>Системы</legend>
            <div className="ec-toggles" role="group" aria-label="Инженерные системы">
              {SYSTEMS.map(sys => (
                <button
                  key={sys.id}
                  type="button"
                  className={`ec-toggle${sysOn(sys.id) ? ' is-on' : ''}`}
                  aria-pressed={sysOn(sys.id)}
                  onClick={() => toggleSystem(sys.id)}
                >
                  {sys.label.replace(/^[^\p{L}]+/u, '')}
                </button>
              ))}
            </div>
          </fieldset>

          {sysOn('sewage') && (
            <fieldset className="ec-fieldset ec-sub">
              <legend>Канализация</legend>
              <div className="ec-grid ec-grid--3">
                <label className="ec-field" htmlFor="ec-sew-len"><span>Длина трассы, м</span>
                  <input id="ec-sew-len" type="number" inputMode="decimal" value={sewageLength} onChange={e => setSewageLength(e.target.value)} placeholder="авто" /></label>
                <label className="ec-field" htmlFor="ec-sew-depth"><span>Глубина, м</span>
                  <input id="ec-sew-depth" type="number" inputMode="decimal" step="0.1" value={sewageDepth} onChange={e => setSewageDepth(e.target.value)} placeholder="1,2" /></label>
                <label className="ec-field" htmlFor="ec-manholes"><span>Колодцы, шт</span>
                  <input id="ec-manholes" type="number" inputMode="numeric" value={manholes} onChange={e => setManholes(e.target.value)} placeholder="авто" /></label>
              </div>
            </fieldset>
          )}

          {sysOn('water_supply') && (
            <fieldset className="ec-fieldset ec-sub">
              <legend>Водоснабжение</legend>
              <div className="ec-grid ec-grid--2">
                <label className="ec-field" htmlFor="ec-water-points"><span>Точки водоразбора</span>
                  <input id="ec-water-points" type="number" inputMode="numeric" value={waterPoints} onChange={e => setWaterPoints(e.target.value)} placeholder="авто" /></label>
                <div className="ec-field">
                  <span id="ec-hot-label">Горячая вода</span>
                  <button type="button" role="switch" aria-checked={hotWater} aria-labelledby="ec-hot-label" className={`ec-switch${hotWater ? ' is-on' : ''}`} onClick={() => setHotWater(!hotWater)}>
                    <span className="ec-switch-knob" aria-hidden="true" />
                    <span>{hotWater ? 'Да, ХВС и ГВС' : 'Нет, только ХВС'}</span>
                  </button>
                </div>
              </div>
            </fieldset>
          )}

          {sysOn('electrical') && (
            <fieldset className="ec-fieldset ec-sub">
              <legend>Электрика</legend>
              <div className="ec-grid ec-grid--2">
                <label className="ec-field" htmlFor="ec-sockets"><span>Розетки, шт</span>
                  <input id="ec-sockets" type="number" inputMode="numeric" value={sockets} onChange={e => setSockets(e.target.value)} placeholder="авто" /></label>
                <label className="ec-field" htmlFor="ec-switches"><span>Выключатели, шт</span>
                  <input id="ec-switches" type="number" inputMode="numeric" value={switches} onChange={e => setSwitches(e.target.value)} placeholder="авто" /></label>
              </div>
            </fieldset>
          )}

          <button type="submit" className="qg-btn qg-btn--primary ec-submit" disabled={isLoading || selectedSystems.length === 0}>
            {isLoading ? 'Считаем…' : 'Рассчитать стоимость'}
          </button>
          {selectedSystems.length === 0 && <p className="ec-hint">Выберите хотя бы одну систему.</p>}

          {error && <p className="ec-error" role="alert">{error}</p>}
        </form>

        {result && (
          <section className="ec-card ec-result" aria-labelledby="ec-result-title">
            <div className="ec-total">
              <div>
                <h2 id="ec-result-title">Итого по объекту</h2>
                <p className="ec-total-meta">{result.city ? result.city.charAt(0).toUpperCase() + result.city.slice(1) : ''}, {result.area_m2} м², срок около {result.timeline_days} дн.</p>
              </div>
              <div className="ec-total-price">
                <span className="qg-price-tag ec-price-big">{formatPrice(result.grand_total)} ₸</span>
                <span className="ec-total-vat">с НДС 16%: {formatPrice(result.grand_total * 1.16)} ₸</span>
              </div>
            </div>

            {result.systems && result.systems.map((sys, idx) => (
              <div key={idx} className="ec-system">
                <div className="ec-system-head">
                  <h3>{sys.system}</h3>
                  <strong className="qg-num">{formatPrice(sys.total_cost)} ₸</strong>
                </div>
                <p className="ec-system-meta">
                  <span className="qg-code">{sys.snip_code}</span>
                  <span>срок {sys.timeline_days} дн.</span>
                  <span>коэффициент региона ×{sys.regional_coeff}</span>
                </p>
                <div className="ec-table-wrap">
                  <table className="ec-table">
                    <thead>
                      <tr>
                        <th scope="col">Наименование</th>
                        <th scope="col" className="num">Объём</th>
                        <th scope="col">Ед.</th>
                        <th scope="col" className="num">Цена</th>
                        <th scope="col" className="num">Сумма, ₸</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sys.items && sys.items.map((item, i) => (
                        <tr key={i}>
                          <td>{item.name}</td>
                          <td className="num">{item.volume}</td>
                          <td>{item.unit}</td>
                          <td className="num">{formatPrice(item.unit_price)}</td>
                          <td className="num strong">{formatPrice(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="ec-system-split">
                  <span>Работы: <strong className="qg-num">{formatPrice(sys.works_cost)} ₸</strong></span>
                  <span>Материалы: <strong className="qg-num">{formatPrice(sys.materials_cost)} ₸</strong></span>
                </p>
              </div>
            ))}

            <div className="ec-downloads">
              <button type="button" className="qg-btn qg-btn--ghost" onClick={() => downloadReport('pdf')}>Скачать PDF</button>
              <button type="button" className="qg-btn qg-btn--ghost" onClick={() => downloadReport('excel')}>Скачать Excel</button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

