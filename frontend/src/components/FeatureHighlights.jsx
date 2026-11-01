import React from 'react';
import { startFlow, navigateTo } from '../utils/navigate';

// Три задачи, ради которых приходят на платформу. Без фото-заглушек и рекламных процентов:
// только то, что сервис действительно делает сейчас.
const ITEMS = [
  {
    id: 'estimate',
    title: 'Смета без выезда мастера',
    text: 'Объёмы и материалы считаются по 23 864 расценкам ГЭСН РК с поправкой на регион. Три варианта цены — эконом, стандарт и премиум.',
    action: 'Рассчитать смету',
    onClick: () => startFlow('register'),
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 4h13l5 5v19H7z" /><path d="M20 4v5h5" /><path d="M11 15h10M11 19h10M11 23h6" /></svg>
    ),
  },
  {
    id: 'defects',
    title: 'Трещины видно на фото',
    text: 'Нейросеть отмечает трещины рамкой и показывает уверенность для каждой зоны. Коррозию, сколы и влагу подтверждает инженер на осмотре.',
    action: 'Проверить дефект',
    onClick: () => startFlow('register'),
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="5" width="24" height="22" /><path d="M14 5l2 6-3 5 4 5-2 6" /><path d="M10 9h9v15h-9z" strokeDasharray="2 2" /></svg>
    ),
  },
  {
    id: 'crews',
    title: 'Бригада с прямыми контактами',
    text: 'В каталоге — бригады с бригадиром, составом и телефоном компании. Бронь замораживает депозит в эскроу до начала работ.',
    action: 'Открыть каталог',
    onClick: () => navigateTo('/catalog'),
    icon: (
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 18a11 11 0 0 1 22 0" /><path d="M3 18h26v4H3z" /><path d="M16 7v4" /></svg>
    ),
  },
];

export default function FeatureHighlights() {
  return (
    <section className="lp-section lp-features" aria-labelledby="lp-features-title">
      <div className="qg-container">
        <div className="qg-section-head">
          <h2 id="lp-features-title">Что вы получаете</h2>
          <p>Три задачи, ради которых к нам приходят: узнать цену, понять, насколько опасен дефект, и найти, кто его устранит.</p>
        </div>
        <ul className="lp-features-grid">
          {ITEMS.map((item) => (
            <li key={item.id} className="lp-feature">
              <span className="lp-feature-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <button type="button" className="qg-btn qg-btn--quiet lp-feature-link" onClick={item.onClick}>
                {item.action}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
