import React from 'react';
import { ArrowRight } from 'lucide-react';
import { startFlow } from '../utils/navigate';
import { PhotoStack, AiChip, SealDoc } from './LuxFx';

// Настоящая последовательность — поэтому здесь (и только здесь) нумерация шагов.
const ART = [<PhotoStack small key="a" />, <AiChip key="b" />, <SealDoc key="c" />];

const STEPS = [
  { title: 'Загрузите фото', text: 'Стена, комната, фасад или трещина крупным планом. Подойдёт камера телефона.' },
  { title: 'Анализ и расчёт', text: 'Сервис находит дефекты, считает объёмы и подбирает расценки ЭСН РК и нормативы.' },
  { title: 'Готовая смета', text: 'Смета и акт дефектов с ценами и рекомендациями — отправьте бригаде из каталога.' },
];

export default function HowItWorksSection() {
  return (
    <section className="lux-section" id="how-it-works" aria-labelledby="lux-steps-title">
      <div className="qg-container">
        <header className="lux-head lux-head--center">
          <h2 id="lux-steps-title">Как это работает</h2>
          <p>От фото до готовой сметы — в три шага, обычно меньше минуты.</p>
        </header>
        <ol className="lux-steps">
          {STEPS.map(({ title, text }, i) => (
            <li key={title} className="lux-glass lux-step">
              <span className="lux-step-num" aria-hidden="true">{i + 1}</span>
              <span className="lux-step-art">{ART[i]}</span>
              {i > 0 && <span className="lux-step-arrow" aria-hidden="true">»</span>}
              <h3>{title}</h3>
              <p>{text}</p>
            </li>
          ))}
        </ol>
        <div className="lux-center">
          <button type="button" className="qg-btn qg-btn--primary lux-btn-lg" onClick={() => startFlow('register')}>
            Попробовать сейчас <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
