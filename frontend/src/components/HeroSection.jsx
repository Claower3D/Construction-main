import React from 'react';
import { startFlow, scrollToSection, navigateTo } from '../utils/navigate';

/*
 * Первый экран. Главный образ — лист заключения в рамке чертежа с основной
 * надписью (штампом), как его выдаёт сервис: стена с найденной трещиной,
 * размеры, норматив и цена ремонта. Это единственный «громкий» элемент
 * страницы; единственная анимация — однократный проход сканера по листу
 * и прорисовка трещины (отключается при prefers-reduced-motion).
 */

const PROOF = [
  { value: '23 864', label: 'расценки ГЭСН РК' },
  { value: '10 425', label: 'позиций материалов' },
  { value: '11', label: 'городов с поправкой цены' },
];

export default function HeroSection({ role, currentUser }) {
  const isExecutor = currentUser && (role === 'executor' || currentUser.role === 'executor');

  return (
    <section className="pro-hero" id="hero" aria-labelledby="pro-hero-title">
      <div className="qg-container pro-hero-grid">
        <div className="pro-hero-copy">
          <p className="pro-hero-kicker">
            {isExecutor ? 'Для бригад и прорабов в Казахстане' : 'Для заказчиков, бригад и инженеров в Казахстане'}
          </p>
          <h1 className="pro-hero-title" id="pro-hero-title">
            {isExecutor ? 'Заказы со сметой с первого дня' : 'Смета и акт дефектов по фото'}
          </h1>
          <p className="pro-hero-lead">
            {isExecutor
              ? 'Заявки из вашего города, объёмы по базе ГЭСН РК и сдача этапов онлайн. Оплата заказчика заморожена в эскроу до приёмки.'
              : 'Сфотографируйте стену, комнату или фасад. Сервис отметит трещины, посчитает объёмы и стоимость по нормам РК и подберёт бригаду в вашем городе.'}
          </p>

          <div className="pro-hero-actions">
            <button type="button" className="qg-btn qg-btn--primary pro-btn-lg" onClick={() => startFlow('register')}>
              {isExecutor ? 'Открыть ленту заказов' : 'Оценить объект по фото'}
            </button>
            <button type="button" className="qg-btn qg-btn--ghost pro-btn-lg" onClick={() => scrollToSection('examples')}>
              Пример сметы
            </button>
          </div>

          <dl className="pro-proof">
            {PROOF.map((p) => (
              <div key={p.label}>
                <dt>{p.label}</dt>
                <dd className="qg-num">{p.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="pro-sheet" aria-labelledby="pro-sheet-caption">
          <div className="pro-sheet-frame">
            <svg className="pro-sheet-drawing" viewBox="0 0 480 290" role="img" aria-label="Схема стены: трещина отмечена рамкой с подписью «Трещина, 70%», размеры 2400 на 1800 мм">
              <defs>
                <pattern id="pro-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                  <line x1="0" y1="0" x2="0" y2="9" stroke="rgba(189,178,230,0.13)" strokeWidth="1" />
                </pattern>
              </defs>
              <g className="pro-dim">
                <line x1="60" y1="26" x2="420" y2="26" />
                <line x1="60" y1="18" x2="60" y2="52" />
                <line x1="420" y1="18" x2="420" y2="52" />
                <line x1="54" y1="32" x2="66" y2="20" />
                <line x1="414" y1="32" x2="426" y2="20" />
                <text x="240" y="20" textAnchor="middle">2 400</text>
              </g>
              <g className="pro-dim">
                <line x1="36" y1="52" x2="36" y2="262" />
                <line x1="28" y1="52" x2="60" y2="52" />
                <line x1="28" y1="262" x2="60" y2="262" />
                <line x1="30" y1="58" x2="42" y2="46" />
                <line x1="30" y1="268" x2="42" y2="256" />
                <text x="24" y="160" textAnchor="middle" transform="rotate(-90 24 160)">1 800</text>
              </g>
              <rect x="60" y="52" width="360" height="210" fill="url(#pro-hatch)" stroke="rgba(189,178,230,0.42)" strokeWidth="1.4" />
              <rect x="290" y="92" width="90" height="96" fill="#120f20" stroke="rgba(189,178,230,0.42)" strokeWidth="1.2" />
              <line x1="335" y1="92" x2="335" y2="188" stroke="rgba(189,178,230,0.28)" />
              <path className="pro-crack" d="M176 58 L182 84 L174 106 L186 128 L180 152 L193 176 L187 200 L198 226 L192 258" />
              <g className="pro-bbox">
                <rect x="160" y="56" width="50" height="204" rx="2" />
                <rect x="160" y="236" width="104" height="24" rx="3" className="pro-bbox-label" />
                <text x="168" y="252">Трещина, 70%</text>
              </g>
              <g className="pro-leader">
                <line x1="210" y1="120" x2="252" y2="96" />
                <circle cx="210" cy="120" r="2.5" />
                <text x="256" y="92">ширина 0,3 мм</text>
              </g>
              <rect className="pro-scan" x="60" y="52" width="360" height="3" />
            </svg>

            {/* Основная надпись — как штамп на листе чертежа */}
            <dl className="pro-stamp">
              <div className="pro-stamp-title">
                <dt>Объект</dt>
                <dd>Стена по оси Б, 2-й этаж</dd>
              </div>
              <div>
                <dt>Дефект</dt>
                <dd>Трещина, высокий риск</dd>
              </div>
              <div>
                <dt>Норматив</dt>
                <dd className="qg-code">ГОСТ 31937-2011</dd>
              </div>
              <div className="pro-stamp-price">
                <dt>Ремонт</dt>
                <dd className="qg-num">40 800 – 66 300 ₸</dd>
              </div>
              <div>
                <dt>Акт</dt>
                <dd className="qg-code">DEF-0412</dd>
              </div>
              <div>
                <dt>Лист</dt>
                <dd className="qg-num">1 из 3</dd>
              </div>
            </dl>
          </div>
          <figcaption id="pro-sheet-caption" className="pro-sheet-caption">
            Пример заключения. Модель обучена на трещинах; остальные дефекты подтверждает инженер.
            {' '}
            <button type="button" className="pro-link" onClick={() => navigateTo('/catalog')}>Найти инженера</button>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
