import React from 'react';
import { startFlow } from '../utils/navigate';

// Настоящая последовательность — поэтому здесь (и только здесь) нумерация шагов.
const STEPS = [
  {
    title: 'Сфотографируйте объект',
    text: 'Стену, комнату, фасад или трещину крупным планом. Подойдёт обычная камера телефона, лучше при дневном свете.',
    detail: 'До 10 снимков за раз',
  },
  {
    title: 'Получите заключение',
    text: 'Сервер отмечает дефекты на фото, считает объёмы и стоимость по базе ГЭСН РК и подбирает нормативы СНиП и ГОСТ.',
    detail: 'Обычно меньше минуты',
  },
  {
    title: 'Выберите бригаду',
    text: 'Отправьте заказ бригаде из каталога или в общую ленту. Оплата заморожена в эскроу, пока вы не примете работу.',
    detail: 'Акт и смета в PDF и Excel',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="lp-section lp-steps" id="how-it-works" aria-labelledby="lp-steps-title">
      <div className="qg-container">
        <div className="qg-section-head">
          <h2 id="lp-steps-title">Как это работает</h2>
          <p>От фотографии до подписанного акта — три шага.</p>
        </div>
        <ol className="lp-steps-list">
          {STEPS.map((s, i) => (
            <li key={s.title} className="lp-step">
              <span className="lp-step-num" aria-hidden="true">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
              <span className="lp-step-detail">{s.detail}</span>
            </li>
          ))}
        </ol>
        <div className="lp-steps-cta">
          <button type="button" className="qg-btn qg-btn--primary" onClick={() => startFlow('register')}>Начать с фото</button>
        </div>
      </div>
    </section>
  );
}
