import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { startFlow } from '../utils/navigate';
import PhoneDemo from './PhoneDemo';

/*
 * Мобильный блок. Сайт работает в браузере телефона; Android-приложения
 * для команды выдаёт поддержка (в магазинах их пока нет), поэтому вторая
 * кнопка открывает WhatsApp с готовым запросом.
 */
const WA = 'https://wa.me/77716983869?text=' + encodeURIComponent('Здравствуйте! Хочу установить приложение QazGost для Android.');

export default function MobileAppBanner() {
  return (
    <section className="lux-section" id="mobile-app" aria-labelledby="lux-app-title">
      <div className="qg-container">
        <div className="lux-app">
          <div className="lux-app-bg" aria-hidden="true" />
          <div className="lux-app-copy">
            <h2 id="lux-app-title">На объекте — с телефона</h2>
            <p>Создавайте сметы и акты дефектов прямо на объекте. Быстро, удобно, без ноутбука.</p>
          </div>

          <PhoneDemo />

          <div className="lux-mob-side">
            <ul className="lux-checks lux-checks--tight">
              <li><Check size={18} aria-hidden="true" />Работает в браузере любого телефона</li>
              <li><Check size={18} aria-hidden="true" />Приложения для менеджера, инженера и бригады на Android</li>
              <li><Check size={18} aria-hidden="true" />Синхронизация с CRM и сметами</li>
            </ul>
            <div className="lux-app-actions">
              <button type="button" className="qg-btn qg-btn--primary" onClick={() => startFlow('register')}>
                Начать с телефона <ArrowRight size={18} aria-hidden="true" />
              </button>
              <a className="qg-btn qg-btn--ghost" href={WA} target="_blank" rel="noopener noreferrer">Приложение для Android</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
