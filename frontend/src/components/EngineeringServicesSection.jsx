import React from 'react';
import { navigateTo } from '../utils/navigate';

/*
 * Инженерные изыскания: шесть услуг в виде спецификации — название,
 * что входит, ключевой параметр. Одна кнопка ведёт в раздел инжиниринга,
 * где оформляется заявка.
 */
const SERVICES = [
  {
    id: 'geo',
    title: 'Инженерно-геологические изыскания',
    param: 'бурение до 35 м',
    desc: 'Разрез грунтовых пластов и лабораторный анализ по СП РК.',
    items: ['Изыскательские скважины', 'Отбор монолитов и проб воды', 'Опасные геологические процессы'],
  },
  {
    id: 'geodesy',
    title: 'Геодезия и топосъёмка',
    param: 'масштаб 1:500',
    desc: 'Привязка осей здания, лазерное сканирование и исполнительная съёмка сетей.',
    items: ['Топоплан участка', 'Съёмка подземных коммуникаций', 'Вынос осей в натуру'],
  },
  {
    id: 'cpt',
    title: 'Статическое зондирование (CPT)',
    param: 'усилие 200 кН',
    desc: 'Непрерывное вдавливание конуса с тензодатчиками для расчёта несущей способности.',
    items: ['Лобовое сопротивление', 'Расчленение пластов', 'Несущая способность свай'],
  },
  {
    id: 'piles',
    title: 'Испытания свай',
    param: 'нагрузка до 500 т',
    desc: 'Статические и динамические испытания с сейсмоакустическим контролем.',
    items: ['Статическая нагрузка', 'Динамика (PDA)', 'Контроль сплошности'],
  },
  {
    id: 'plate',
    title: 'Штамповые испытания',
    param: 'модуль E, МПа',
    desc: 'Деформационные характеристики грунтов плоскими штампами в шурфах и скважинах.',
    items: ['Модуль деформации', 'Просадочность грунтов', 'Испытания в скважинах'],
  },
  {
    id: 'lab',
    title: 'Лаборатория грунтов',
    param: 'аккредитация',
    desc: 'Физико-механический и химический анализ образцов грунта и подземных вод.',
    items: ['Компрессионное сжатие', 'Коррозионная агрессивность', 'Химический анализ воды'],
  },
];

export default function EngineeringServicesSection() {
  return (
    <section className="pro-section pro-section--tint" id="engineering" aria-labelledby="pro-eng-title">
      <div className="qg-container">
        <header className="pro-head pro-head--split">
          <div>
            <h2 id="pro-eng-title">Изыскания и геотехника</h2>
            <p>Полевые и лабораторные испытания с официальным заключением по СНиП РК и СП РК — для проекта, экспертизы и банка.</p>
          </div>
          <button type="button" className="qg-btn qg-btn--ghost" onClick={() => navigateTo('/engineering')}>
            Заказать изыскания
          </button>
        </header>

        <ul className="pro-eng">
          {SERVICES.map((s) => (
            <li key={s.id} className="pro-eng-item">
              <div className="pro-eng-top">
                <h3>{s.title}</h3>
                <span className="pro-eng-param qg-num">{s.param}</span>
              </div>
              <p>{s.desc}</p>
              <ul className="pro-eng-list">
                {s.items.map((i) => <li key={i}>{i}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
