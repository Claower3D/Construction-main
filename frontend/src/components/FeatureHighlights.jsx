import React from 'react';
import { Camera, Zap, FileText } from 'lucide-react';
import { PhotoStack, HardHat3D, PdfDoc, Sparkles } from './LuxFx';
import { startFlow } from '../utils/navigate';

// Три результата, ради которых приходят на платформу. Только то, что сервис делает сейчас.
const ITEMS = [
  {
    id: 'photo',
    icon: Camera,
    title: 'Смета по фото за секунды',
    text: 'Загрузите фото объекта — получите готовую смету с объёмами, ценами и стоимостью по нормам РК.',
    action: 'Рассчитать смету',
    art: <PhotoStack />,
    onClick: () => startFlow('register'),
  },
  {
    id: 'defects',
    icon: Zap,
    title: 'Акт дефектов автоматически',
    text: 'Трещины на фото отмечаются рамкой, к акту добавляются норматив, описание и цена ремонта.',
    action: 'Проверить дефект',
    art: <HardHat3D />,
    onClick: () => startFlow('register'),
  },
  {
    id: 'docs',
    icon: FileText,
    title: 'Готовые документы',
    text: 'Сметы, акты, ведомости и расчёты — в форматах PDF и Excel, для согласования и подрядчика.',
    action: 'Посмотреть пример',
    art: <PdfDoc />,
    onClick: () => document.getElementById('examples')?.scrollIntoView({ behavior: 'smooth' }),
  },
];

export default function FeatureHighlights() {
  return (
    <section className="lux-section" aria-labelledby="lux-features-title">
      <Sparkles count={18} seed={21} />
      <div className="qg-container">
        <header className="lux-head lux-head--center">
          <h2 id="lux-features-title">Что вы получаете</h2>
          <p>Полный набор инструментов для быстрой и точной оценки работ.</p>
        </header>
        <ul className="lux-features">
          {ITEMS.map(({ id, icon: Icon, title, text, action, art, onClick }) => (
            <li key={id} className="lux-glass lux-feature">
              <span className="lux-feature-art">{art}</span>
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
