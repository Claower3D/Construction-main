import React from 'react';
import { Sparkles, PlayCircle, Zap, Package, MapPin, FileText, FolderOpen, Camera, ClipboardList, Store, Download } from 'lucide-react';
import { startFlow, scrollToSection } from '../utils/navigate';
import { LightTrails, Sparkles as FxSparkles, Ground } from './LuxFx';

/*
 * Первый экран: слева — обещание и главное действие, справа — ноутбук
 * с экраном настоящей сметы поверх вечерней стройплощадки.
 * Единственная анимация — однократная прорисовка трещины на чертеже
 * (отключается при prefers-reduced-motion).
 */

const PROOF = [
  { icon: Zap, value: '23 864', label: 'расценки ГЭСН РК' },
  { icon: Package, value: '10 425', label: 'позиций материалов' },
  { icon: MapPin, value: '11', label: 'городов с поправкой цены' },
];

const NAV = [
  { icon: Camera, name: 'Новая оценка', active: true },
  { icon: FolderOpen, name: 'Объекты' },
  { icon: FileText, name: 'Сметы' },
  { icon: ClipboardList, name: 'Акты дефектов' },
  { icon: Store, name: 'Каталог услуг' },
];

const ROWS = [
  ['Грунтовка стен', '42,6 м²', '6 390'],
  ['Штукатурка стен', '42,6 м²', '51 120'],
  ['Окраска в 2 слоя', '42,6 м²', '29 820'],
  ['Устранение трещин', '12,4 п.м', '16 740'],
  ['Вывоз мусора', '1 рейс', '12 000'],
];

export default function HeroSection({ role, currentUser }) {
  const isExecutor = currentUser && (role === 'executor' || currentUser.role === 'executor');

  return (
    <section className="lux-hero" id="hero" aria-labelledby="lux-hero-title">
      <div className="lux-hero-bg" aria-hidden="true" />
      <LightTrails variant="hero" className="fx-trails--hero" />
      <FxSparkles count={34} seed={11} />
      <div className="qg-container lux-hero-grid">
        <div className="lux-hero-copy">
          <p className="lux-pill"><Sparkles size={15} aria-hidden="true" /> AI для строительства и ремонта</p>
          <h1 className="lux-hero-title" id="lux-hero-title">
            {isExecutor
              ? <>Заказы со сметой <span className="lux-gold">с первого дня</span></>
              : <>Смета и акт дефектов <span className="lux-gold">по фото</span></>}
          </h1>
          <p className="lux-hero-lead">
            {isExecutor
              ? 'Заявки из вашего города, объёмы по базе ГЭСН РК и сдача этапов онлайн. Оплата заказчика заморожена в эскроу до приёмки.'
              : 'Сфотографируйте объект и получите смету и акт дефектов с объёмами, ценами и нормативами РК. Быстро, точно и по актуальным ценам 2026 года.'}
          </p>
          <div className="lux-hero-actions">
            <button type="button" className="qg-btn qg-btn--primary lux-btn-lg" onClick={() => startFlow('register')}>
              {isExecutor ? 'Открыть ленту заказов' : 'Создать смету по фото'}
            </button>
            <button type="button" className="qg-btn qg-btn--ghost lux-btn-lg" onClick={() => scrollToSection('how-it-works')}>
              <PlayCircle size={20} aria-hidden="true" /> Как это работает
            </button>
          </div>
          <dl className="lux-proof">
            {PROOF.map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <dd><Icon size={20} aria-hidden="true" /><span className="qg-num">{value}</span></dd>
                <dt>{label}</dt>
              </div>
            ))}
          </dl>
        </div>

        <div className="lux-device" aria-label="Пример экрана сервиса: смета по фото с чертежом стены и итогами расчёта" role="img">
          <div className="lux-ai-chip" aria-hidden="true">
            <span className="lux-ai-mark">AI</span>
            <span className="lux-ai-steps"><span>Анализ фото</span><span>Расчёт объёмов</span><span>Готовая смета</span></span>
          </div>
          <div className="lux-laptop" aria-hidden="true">
            <div className="lux-screen">
              <aside className="lux-app-nav">
                <span className="lux-app-logo">QazGost</span>
                {NAV.map(({ icon: Icon, name, active }) => (
                  <span key={name} className={active ? 'is-active' : undefined}><Icon size={12} />{name}</span>
                ))}
              </aside>
              <div className="lux-app-main">
                <div className="lux-app-head"><strong>Смета № 3847</strong><span>Ремонт помещения</span></div>
                <svg className="lux-app-drawing" viewBox="0 0 300 120">
                  <rect x="20" y="16" width="200" height="92" className="wall" />
                  <rect x="160" y="34" width="40" height="44" className="win" />
                  <path className="lux-crack" d="M92 18 L96 34 L90 48 L98 62 L94 76 L101 92 L97 106" />
                  <rect x="82" y="17" width="26" height="90" className="box" />
                  <rect x="82" y="96" width="62" height="12" rx="2" className="tag" />
                  <text x="86" y="105">Трещина 70%</text>
                  <line x1="20" y1="8" x2="220" y2="8" className="dim" />
                  <text x="120" y="6" className="dimt">4 200</text>
                  <path d="M232 92 L252 70 L272 76 L292 40" className="trend" />
                </svg>
                <div className="lux-app-rows">
                  {ROWS.map(([n, q, s]) => (
                    <span key={n}><b>{n}</b><i>{q}</i><em>{s} ₸</em></span>
                  ))}
                </div>
              </div>
              <div className="lux-app-side">
                <strong>Итоги расчёта</strong>
                <span><i>Объём</i><b>42,6 м²</b></span>
                <span><i>Дефекты</i><b>1 трещина</b></span>
                <span><i>Норматив</i><b>ГОСТ 31937</b></span>
                <span><i>Срок</i><b>4 дня</b></span>
                <span className="lux-app-total"><i>Итого</i><b className="gold">116 070 ₸</b></span>
                <span className="lux-app-btn"><Download size={11} />Скачать смету</span>
              </div>
            </div>
            <div className="lux-base" />
          </div>
          <Ground className="fx-ground--hero" />
        </div>
      </div>
    </section>
  );
}
