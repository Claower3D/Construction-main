import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { startFlow } from '../utils/navigate';
import PhoneDemo from './PhoneDemo';
import { ANDROID_APK_FILE, ANDROID_APK_URL } from '../utils/androidApp';

/*
 * Мобильный блок. Сайт работает в браузере телефона; приложение для Android
 * (все роли в одном) в магазинах пока нет, поэтому вторая кнопка скачивает
 * файл APK прямо с сайта (см. utils/androidApp.js).
 */

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
              <li><Check size={18} aria-hidden="true" />Приложение для Android: все роли в одном</li>
              <li><Check size={18} aria-hidden="true" />Синхронизация с CRM и сметами</li>
            </ul>
            <div className="lux-app-actions">
              <button type="button" className="qg-btn qg-btn--primary" onClick={() => startFlow('register')}>
                Начать с телефона <ArrowRight size={18} aria-hidden="true" />
              </button>
              <a className="qg-btn qg-btn--ghost" href={ANDROID_APK_URL} download={ANDROID_APK_FILE}>Приложение для Android</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
