import React from 'react';
import { HardHat, UserRound, Ruler, Check } from 'lucide-react';
import { startFlow, navigateTo } from '../utils/navigate';

/*
 * Кому подходит платформа. Вместо отзывов (их пока нечем подтвердить) —
 * честное описание того, что получает каждая роль.
 */
const ROLES = [
  {
    id: 'customer',
    icon: UserRound,
    who: 'Заказчик',
    title: 'Знать цену до разговора с мастером',
    points: ['Смета по фото с объёмами и материалами', 'Акт дефектов с нормативом и ценой ремонта', 'Бригады вашего города с телефонами'],
    action: 'Оценить объект',
    go: () => startFlow('register'),
  },
  {
    id: 'crew',
    icon: HardHat,
    who: 'Бригада и прораб',
    title: 'Заказы, за которые заплатят',
    points: ['Лента заявок по городу и виду работ', 'Деньги заказчика заморожены в эскроу', 'Этапы и фотоотчёт в мобильном приложении'],
    action: 'Лента заказов',
    go: () => startFlow('register'),
  },
  {
    id: 'engineer',
    icon: Ruler,
    who: 'Инженер и застройщик',
    title: 'Расчёты и изыскания в одном месте',
    points: ['Калькулятор сетей: кабель, отопление, вода', 'Изыскания, испытания свай, лаборатория', 'Технадзор с актами по ГОСТ'],
    action: 'Калькулятор',
    go: () => navigateTo('/calc'),
  },
];

export default function AudienceSection() {
  return (
    <section className="lux-section" id="audience" aria-labelledby="lux-aud-title">
      <div className="qg-container lux-aud">
        <header className="lux-head">
          <h2 id="lux-aud-title">Один сервис для всех на объекте</h2>
          <p>Сметы, дефекты и расчёты в одном месте — заказчик, бригада и инженер работают с одним документом.</p>
        </header>
        <ul className="lux-roles">
          {ROLES.map(({ id, icon: Icon, who, title, points, action, go }) => (
            <li key={id} className="lux-glass lux-role">
              <span className="lux-icon"><Icon size={22} aria-hidden="true" /></span>
              <p className="lux-role-who">{who}</p>
              <h3>{title}</h3>
              <ul>
                {points.map((p) => <li key={p}><Check size={16} aria-hidden="true" />{p}</li>)}
              </ul>
              <button type="button" className="lux-link" onClick={go}>{action}</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
