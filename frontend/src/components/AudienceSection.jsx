import React from 'react';
import { HardHat, UserRound, Compass, ShieldCheck, Check } from 'lucide-react';

/*
 * Кому подходит платформа. Вместо отзывов (их пока нечем подтвердить) —
 * честное описание того, что получает каждая роль на объекте.
 */
const ROLES = [
  { id: 'crew', icon: HardHat, who: 'Подрядчикам', points: ['Быстрые и точные сметы', 'Акты дефектов по фото', 'Лента заказов с эскроу'] },
  { id: 'customer', icon: UserRound, who: 'Заказчикам', points: ['Прозрачные расчёты', 'Сравнение предложений', 'Контроль качества работ'] },
  { id: 'design', icon: Compass, who: 'Проектировщикам', points: ['Проверка объёмов и смет', 'Актуальные расценки', 'Экспорт в Excel и PDF'] },
  { id: 'supervision', icon: ShieldCheck, who: 'Технадзору', points: ['Фиксация дефектов', 'Фотоотчёт с рекомендациями', 'История и отчётность'] },
];

export default function AudienceSection() {
  return (
    <section className="lux-section" id="audience" aria-labelledby="lux-aud-title">
      <div className="qg-container">
        <header className="lux-head lux-head--center">
          <h2 id="lux-aud-title">Один сервис для всех на объекте</h2>
          <p>Удобные инструменты для каждого участника строительного процесса.</p>
        </header>
        <ul className="lux-roles">
          {ROLES.map(({ id, icon: Icon, who, points }) => (
            <li key={id} className="lux-glass lux-role">
              <h3><span className="lux-icon lux-icon--sm"><Icon size={18} aria-hidden="true" /></span>{who}</h3>
              <ul>
                {points.map((p) => <li key={p}><Check size={15} aria-hidden="true" />{p}</li>)}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
