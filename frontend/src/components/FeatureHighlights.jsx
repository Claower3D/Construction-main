import React from 'react';
import { Camera, Zap, Layers } from 'lucide-react';
import { startFlow, navigateTo } from '../utils/navigate';

// Три результата, ради которых приходят на платформу. Только то, что сервис делает сейчас.
const ITEMS = [
  {
    id: 'photo',
    icon: Camera,
    title: 'Смета и акт по фото',
    text: 'Загрузите фото объекта — сервис отметит трещины, посчитает объёмы и соберёт смету по нормам РК.',
    action: 'Рассчитать смету',
    img: '/assets/landing/feat-photo.webp',
    onClick: () => startFlow('register'),
  },
  {
    id: 'prices',
    icon: Zap,
    title: 'Актуальные расценки',
    text: '23 864 расценки ГЭСН РК и 10 425 материалов с поправкой на город и тип объекта.',
    action: 'Открыть каталог',
    img: '/assets/landing/feat-price.webp',
    onClick: () => navigateTo('/materials'),
  },
  {
    id: 'docs',
    icon: Layers,
    title: 'Готовые документы',
    text: 'Смета, ведомость материалов и акт дефектов в PDF и Excel — для согласования и подрядчика.',
    action: 'Посмотреть пример',
    img: '/assets/landing/feat-docs.webp',
    onClick: () => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' }),
  },
];

export default function FeatureHighlights() {
  return (
    <section className="lux-section" aria-labelledby="lux-features-title">
      <div className="qg-container">
        <header className="lux-head lux-head--center">
          <h2 id="lux-features-title">Что вы получаете</h2>
          <p>Полный набор инструментов для быстрой и точной оценки работ.</p>
        </header>
        <ul className="lux-features">
          {ITEMS.map(({ id, icon: Icon, title, text, action, img, onClick }) => (
            <li key={id} className="lux-glass lux-feature">
              <img className="lux-feature-img" src={img} alt="" loading="lazy" />
              <span className="lux-icon"><Icon size={22} aria-hidden="true" /></span>
              <h3>{title}</h3>
              <p>{text}</p>
              <button type="button" className="lux-link" onClick={onClick}>{action}</button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
