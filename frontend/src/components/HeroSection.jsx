import React from 'react';
import { Apple, Smartphone, ShieldCheck, Clock3, ScanSearch, Package } from 'lucide-react';
import { startFlow, scrollToSection } from '../utils/navigate';
import HeroHouse from './HeroHouse';
import { LightTrails, Sparkles as FxSparkles } from './LuxFx';

/*
 * Первый экран: слева — обещание для своей роли и действия,
 * справа — дом, который переходит в светящийся чертёж с выносками.
 * Ниже — четыре карточки с проверяемыми цифрами.
 */

const STATS = [
  { icon: ShieldCheck, label: 'База ЭСН РК', value: '23 864', title: 'расценки работ и материалов', sub: 'с поправкой на 11 городов' },
  { icon: Clock3, label: 'Скорость', value: 'до 1 мин', title: 'смета по фото', sub: 'объёмы, материалы и итог' },
  { icon: ScanSearch, label: 'Нейросеть YOLO26', value: '86%', title: 'точность детектора трещин', sub: 'на проверочной выборке' },
  { icon: Package, label: 'Каталог', value: '10 425', title: 'позиций стройматериалов', sub: 'цены по регионам РК' },
];

const WA = 'https://wa.me/77716983869?text=' + encodeURIComponent('Здравствуйте! Хочу установить приложение QazGost для Android.');

export default function HeroSection({ role, currentUser }) {
  const effectiveRole = currentUser?.role || role;
  const isCustomer = effectiveRole === 'customer';

  return (
    <section className="hx" id="hero" aria-labelledby="hx-title">
      <LightTrails variant="hero" className="fx-trails--hero" />
      <FxSparkles count={30} seed={11} />
      <div className="qg-container">
        <div className="hx-grid">
          <div className="hx-copy">
            <p className="hx-pill">
              <span className="hx-pill-dot" aria-hidden="true" />
              AI-оценка по фото за секунды • СНиП и ГОСТ РК • RU / KZ / EN
            </p>
            <h1 className="hx-title" id="hx-title">
              {isCustomer
                ? <>Стройте и ремонтируйте <span className="hx-accent">без переплат и рисков</span></>
                : <>Зарабатывайте на строительных заказах — <span className="hx-accent">честно и прозрачно</span></>}
            </h1>
            <p className="hx-lead">
              {isCustomer
                ? 'Загрузите фото помещения или фасада — сервис посчитает смету по нормам РК, отметит трещины и подберёт бригаду в вашем городе.'
                : 'Открывайте живую ленту заказов по всему Казахстану, отправляйте предложения по цене и срокам, ведите проекты в «Моих работах» и сдавайте результат онлайн.'}
            </p>
            <div className="hx-actions">
              <button type="button" className="qg-btn qg-btn--primary hx-btn" onClick={() => startFlow('register')}>
                {isCustomer ? 'Оценить объект по фото' : 'Открыть ленту заказов'}
                <span className="hx-kbd">{isCustomer ? 'AI' : 'OPEN'}</span>
              </button>
              <button type="button" className="qg-btn qg-btn--ghost hx-btn" onClick={() => scrollToSection('examples')}>
                Пример сметы <span className="hx-kbd hx-kbd--ghost">PDF</span>
              </button>
            </div>
            <div className="hx-apps">
              <span>Скачать приложение</span>
              <a className="hx-app-chip" href={WA} target="_blank" rel="noopener noreferrer"><Smartphone size={14} aria-hidden="true" /> Android</a>
              <span className="hx-app-chip hx-app-chip--soon" title="Приложение для iPhone готовится"><Apple size={14} aria-hidden="true" /> iOS скоро</span>
            </div>
          </div>

          <div className="hx-art">
            <HeroHouse />
          </div>
        </div>

        <dl className="hx-stats">
          {STATS.map(({ icon: Icon, label, value, title, sub }) => (
            <div key={label} className="lux-glass hx-stat">
              <dt>
                <span className="hx-stat-label"><Icon size={18} aria-hidden="true" />{label}</span>
                <span className="hx-stat-title">{title}</span>
              </dt>
              <dd>
                <span className="hx-stat-value qg-num">{value}</span>
                <span className="hx-stat-sub">{sub}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
