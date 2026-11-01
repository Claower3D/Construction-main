import React from 'react';
import { startFlow, navigateTo } from '../utils/navigate';

/*
 * Кому подходит платформа. Вместо отзывов (их пока нечем подтвердить) —
 * честное описание того, что получает каждая роль.
 */
const ROLES = [
  {
    id: 'customer',
    who: 'Заказчик',
    title: 'Знать цену до разговора с мастером',
    points: ['Смета по фото с объёмами и материалами', 'Акт дефектов с нормативом и ценой ремонта', 'Бригады вашего города с телефонами'],
    action: 'Оценить объект',
    go: () => startFlow('register'),
  },
  {
    id: 'crew',
    who: 'Бригада и прораб',
    title: 'Заказы, за которые заплатят',
    points: ['Лента заявок по городу и виду работ', 'Деньги заказчика заморожены в эскроу', 'Этапы и фотоотчёт в мобильном приложении'],
    action: 'Открыть ленту заказов',
    go: () => startFlow('register'),
  },
  {
    id: 'engineer',
    who: 'Инженер и застройщик',
    title: 'Расчёты и изыскания в одном месте',
    points: ['Калькулятор сетей: кабель, отопление, вода', 'Изыскания, испытания свай, лаборатория', 'Технадзор с актами по ГОСТ'],
    action: 'Инженерный калькулятор',
    go: () => navigateTo('/calc'),
  },
];

export default function AudienceSection() {
  return (
    <section className="pro-section" id="audience" aria-labelledby="pro-aud-title">
      <div className="qg-container">
        <header className="pro-head">
          <h2 id="pro-aud-title">Один сервис для всех на объекте</h2>
          <p>Заказчик, бригада и инженер работают с одной сметой и одним актом — без пересылки файлов.</p>
        </header>
        <ul className="pro-roles">
          {ROLES.map((r) => (
            <li key={r.id} className={`pro-role pro-role--${r.id}`}>
              <p className="pro-role-who">{r.who}</p>
              <h3>{r.title}</h3>
              <ul>
                {r.points.map((p) => <li key={p}>{p}</li>)}
              </ul>
              <button type="button" className="qg-btn qg-btn--ghost qg-btn--sm" onClick={r.go}>{r.action}</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
