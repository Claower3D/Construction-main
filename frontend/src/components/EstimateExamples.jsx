import React, { useState } from 'react';
import { CheckCircle2, Download, ArrowRight } from 'lucide-react';
import { startFlow } from '../utils/navigate';

/*
 * «Как выглядит смета»: четыре реальных примера расчёта по базе ГЭСН РК.
 * Смета оформлена как документ — шапка с объектом и регионом, таблица
 * ресурсов, итог. Пользователь переключает примеры и может скачать Excel.
 */

const SAMPLES = [
  {
    id: 'foundation',
    tab: 'Ленточный фундамент',
    title: 'Ленточный фундамент, бетон М300',
    city: 'Алматы',
    coef: '1,00',
    size: '12,0 × 10,0 × 1,2 м',
    days: 14,
    items: [
      ['Бетон тяжёлый М300 (W6, F150)', '28,8 м³', 24500, 705600],
      ['Арматура рифлёная А500С Ø12 мм', '2,4 т', 320000, 768000],
      ['Опалубка ламинированная щитовая', '88,0 м²', 4500, 396000],
      ['Разработка грунта экскаватором', '45,0 м³', 3200, 144000],
      ['Укладка и вибрирование смеси', '28,8 м³', 12000, 345600],
    ],
  },
  {
    id: 'masonry',
    tab: 'Кладка газоблока',
    title: 'Наружные стены из газоблока D500',
    city: 'Астана',
    coef: '1,15',
    size: '240 м², толщина 300 мм',
    days: 10,
    items: [
      ['Газоблок автоклавный D500 600×300×200', '72,0 м³', 28000, 2016000],
      ['Клей для ячеистого бетона, 25 кг', '65 меш.', 2400, 156000],
      ['Сетка базальтовая для армирования', '240 м²', 1200, 288000],
      ['Кладка стен с армированием', '72,0 м³', 14200, 1022400],
    ],
  },
  {
    id: 'roof',
    tab: 'Кровля',
    title: 'Двускатная кровля из металлочерепицы 0,5 мм',
    city: 'Шымкент',
    coef: '0,95',
    size: '180 м²',
    days: 8,
    items: [
      ['Металлочерепица «Монтеррей» 0,5 мм', '210 м²', 3800, 798000],
      ['Брус хвойный 50×150 мм на стропила', '4,2 м³', 95000, 399000],
      ['Мембрана супердиффузионная', '240 м²', 650, 156000],
      ['Монтаж стропильной системы и настила', '180 м²', 2980, 536400],
    ],
  },
  {
    id: 'screed',
    tab: 'Стяжка пола',
    title: 'Полусухая стяжка пола с фиброй, 60 мм',
    city: 'Караганда',
    coef: '1,05',
    size: '100 м²',
    days: 2,
    items: [
      ['Цемент ПЦ-500 Д0 и песок мытый', '6,0 м³', 26000, 156000],
      ['Фиброволокно полипропиленовое 12 мм', '8 кг', 3500, 28000],
      ['Пластификатор для тёплых полов', '10 л', 1400, 14000],
      ['Механизированная укладка с затиркой', '100 м²', 2700, 270000],
    ],
  },
];

const fmt = (n) => n.toLocaleString('ru-RU');

export default function EstimateExamples() {
  const [active, setActive] = useState(0);
  const [busy, setBusy] = useState(false);
  const s = SAMPLES[active];
  const total = s.items.reduce((sum, r) => sum + r[3], 0);

  const download = async () => {
    setBusy(true);
    try {
      const { exportPricesToExcel } = await import('../services/adminExcelIO');
      await exportPricesToExcel(
        s.items.map(([name, qty, price, sum], i) => ({
          code: `POS-${101 + i}`,
          name,
          category: s.title,
          unit: qty.split(' ').slice(1).join(' ') || 'ед.',
          laborNorm: 1,
          price: sum,
          unitPrice: price,
          region: `${s.city} (×${s.coef})`,
        })),
        `Смета_${s.id}.xlsx`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="lux-section" id="examples" aria-labelledby="lux-examples-title">
      <div className="qg-container lux-examples">
        <div className="lux-examples-copy">
          <header className="lux-head">
            <h2 id="lux-examples-title">Так выглядит смета</h2>
            <p>Прозрачная и готовая к работе — как у сметчика с опытом. Цены по базе ГЭСН РК с коэффициентом вашего города.</p>
          </header>
          <ul className="lux-checks">
            <li><CheckCircle2 size={20} aria-hidden="true" />Расчёт объёмов по фото</li>
            <li><CheckCircle2 size={20} aria-hidden="true" />Разбивка по видам работ и материалам</li>
            <li><CheckCircle2 size={20} aria-hidden="true" />Цены 2026 года с поправкой на город</li>
            <li><CheckCircle2 size={20} aria-hidden="true" />Итог и срок работ</li>
          </ul>
        </div>

        <article className="lux-glass lux-doc">
          <div className="lux-doc-bar">
            <div className="lux-tabs" role="tablist" aria-label="Примеры смет">
              {SAMPLES.map((x, i) => (
                <button
                  key={x.id}
                  type="button"
                  role="tab"
                  id={`lux-tab-${x.id}`}
                  aria-selected={i === active}
                  aria-controls="lux-doc"
                  tabIndex={i === active ? 0 : -1}
                  className="lux-tab"
                  onClick={() => setActive(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); setActive((active + 1) % SAMPLES.length); }
                    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); setActive((active - 1 + SAMPLES.length) % SAMPLES.length); }
                  }}
                >
                  {x.tab}
                </button>
              ))}
            </div>
            <span className="lux-status">Готова</span>
          </div>
          <div id="lux-doc" role="tabpanel" aria-labelledby={`lux-tab-${s.id}`}>
          <header className="lux-doc-head">
            <h3>{s.title}</h3>
            <p>{s.city}, коэффициент ×{s.coef}. {s.size}, около {s.days} дн.</p>
          </header>
          <div className="lux-table-wrap">
            <table className="lux-table">
              <thead>
                <tr>
                  <th scope="col">Наименование работ</th>
                  <th scope="col" className="num">Объём</th>
                  <th scope="col" className="num">Цена за ед.</th>
                  <th scope="col" className="num">Сумма, ₸</th>
                </tr>
              </thead>
              <tbody>
                {s.items.map(([name, qty, price, sum]) => (
                  <tr key={name}>
                    <th scope="row">{name}</th>
                    <td className="num">{qty}</td>
                    <td className="num">{fmt(price)} ₸</td>
                    <td className="num">{fmt(sum)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
          <footer className="lux-doc-foot">
            <p className="lux-doc-total"><span>Итого по смете</span><strong className="qg-num">{fmt(total)} ₸</strong></p>
            <div className="lux-doc-actions">
              <button type="button" className="qg-btn qg-btn--ghost" onClick={download} disabled={busy}>
                <Download size={18} aria-hidden="true" />{busy ? 'Готовим файл…' : 'Скачать Excel'}
              </button>
              <button type="button" className="qg-btn qg-btn--primary" onClick={() => startFlow('register')}>
                Рассчитать свой объект <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          </footer>
        </article>
      </div>
    </section>
  );
}
