import React from 'react';
import { startFlow, scrollToSection, navigateTo } from '../utils/navigate';

/*
 * Первый экран. Главный образ — «лист чертежа» с тем, что реально выдаёт сервис:
 * фасад с отмеченной трещиной, размерные линии, норматив и цена ремонта.
 * Единственная анимация страницы — трещина «прочерчивается» при загрузке
 * (отключается при prefers-reduced-motion).
 */
export default function HeroSection({ role, currentUser }) {
  const isExecutor = currentUser && (role === 'executor' || currentUser.role === 'executor');

  return (
    <section className="lp-hero" id="hero" aria-labelledby="lp-hero-title">
      <div className="qg-container lp-hero-grid">
        <div className="lp-hero-copy">
          <p className="lp-hero-kicker">Для заказчиков, бригад и инженеров в Казахстане</p>
          <h1 className="lp-hero-title" id="lp-hero-title">
            {isExecutor
              ? 'Заказы на стройку и ремонт — с честной сметой с первого дня'
              : 'Смета и проверка дефектов по фото — по нормам РК'}
          </h1>
          <p className="lp-hero-lead">
            {isExecutor
              ? 'Получайте заявки из своего города, считайте объёмы по базе ГЭСН РК и сдавайте этапы онлайн. Оплата заказчика заморожена в эскроу до приёмки.'
              : 'Сфотографируйте стену, комнату или фасад. QazGost AI отметит трещины на снимке, посчитает объёмы и стоимость по базе ГЭСН РК и подскажет бригаду в вашем городе.'}
          </p>

          <div className="lp-hero-actions">
            <button type="button" className="qg-btn qg-btn--primary lp-hero-cta" onClick={() => startFlow('register')}>
              {isExecutor ? 'Открыть ленту заказов' : 'Оценить объект по фото'}
            </button>
            <button type="button" className="qg-btn qg-btn--ghost" onClick={() => scrollToSection('how-it-works')}>
              Как это работает
            </button>
          </div>

          <ul className="lp-hero-facts">
            <li>Цены 2026 года с поправкой на регион</li>
            <li>Акт с нормативами СНиП и ГОСТ РК</li>
            <li>
              <button type="button" className="lp-inline-link" onClick={() => navigateTo('/catalog')}>Бригады с телефонами</button>
              {' '}и бронь через эскроу
            </li>
          </ul>
        </div>

        <figure className="lp-sheet" aria-labelledby="lp-sheet-caption">
          <div className="lp-sheet-head">
            <span>Лист 1. Стена по оси Б</span>
            <span className="qg-code">Акт DEF-0412</span>
          </div>

          <svg className="lp-sheet-drawing" viewBox="0 0 480 290" role="img" aria-label="Схема стены: трещина отмечена рамкой с подписью «Трещина, 70%», размеры 2400 на 1800 мм">
            <defs>
              <pattern id="lp-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(140,170,214,0.16)" strokeWidth="1" />
              </pattern>
            </defs>
            {/* размер по горизонтали */}
            <g className="lp-dim">
              <line x1="60" y1="26" x2="420" y2="26" />
              <line x1="60" y1="18" x2="60" y2="52" />
              <line x1="420" y1="18" x2="420" y2="52" />
              <line x1="54" y1="32" x2="66" y2="20" />
              <line x1="414" y1="32" x2="426" y2="20" />
              <text x="240" y="20" textAnchor="middle">2 400</text>
            </g>
            {/* размер по вертикали */}
            <g className="lp-dim">
              <line x1="36" y1="52" x2="36" y2="262" />
              <line x1="28" y1="52" x2="60" y2="52" />
              <line x1="28" y1="262" x2="60" y2="262" />
              <line x1="30" y1="58" x2="42" y2="46" />
              <line x1="30" y1="268" x2="42" y2="256" />
              <text x="24" y="160" textAnchor="middle" transform="rotate(-90 24 160)">1 800</text>
            </g>
            {/* стена */}
            <rect x="60" y="52" width="360" height="210" fill="url(#lp-hatch)" stroke="rgba(140,170,214,0.45)" strokeWidth="1.5" />
            {/* проём окна */}
            <rect x="290" y="92" width="90" height="96" fill="#0a1424" stroke="rgba(140,170,214,0.45)" strokeWidth="1.2" />
            <line x1="335" y1="92" x2="335" y2="188" stroke="rgba(140,170,214,0.3)" />
            {/* трещина */}
            <path className="lp-crack" d="M176 58 L182 84 L174 106 L186 128 L180 152 L193 176 L187 200 L198 226 L192 258" />
            {/* рамка детектора */}
            <g className="lp-bbox">
              <rect x="160" y="56" width="50" height="204" rx="2" />
              <rect x="160" y="236" width="104" height="24" rx="3" className="lp-bbox-label" />
              <text x="168" y="252">Трещина, 70%</text>
            </g>
            {/* выноска */}
            <g className="lp-leader">
              <line x1="210" y1="120" x2="252" y2="96" />
              <circle cx="210" cy="120" r="2.5" />
              <text x="256" y="92">ширина 0,3 мм</text>
            </g>
          </svg>

          <dl className="lp-sheet-rows">
            <div>
              <dt>Дефект</dt>
              <dd>Трещина, высокий риск</dd>
            </div>
            <div>
              <dt>Норматив</dt>
              <dd className="qg-code">ГОСТ 31937-2011</dd>
            </div>
            <div>
              <dt>Ремонт</dt>
              <dd><span className="qg-price-tag">40 800 – 66 300 ₸</span></dd>
            </div>
          </dl>
          <figcaption id="lp-sheet-caption" className="lp-sheet-caption">
            Пример заключения: зоны на фото, норматив и цена ремонта по базе ГЭСН РК.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
