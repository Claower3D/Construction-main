import React from 'react';

/*
 * Мобильные приложения. Три Android-приложения по ролям; установочный файл
 * выдаёт поддержка (в магазинах приложений их пока нет), поэтому кнопка
 * открывает WhatsApp с готовым текстом запроса.
 */
const APPS = [
  { id: 'manager', name: 'Менеджер', text: 'Воронка сделок, звонки и календарь объектов.' },
  { id: 'engineer', name: 'Инженер', text: 'Осмотр, фото дефектов с зумом и акт на месте.' },
  { id: 'executor', name: 'Исполнитель', text: 'Заказы, чек-лист этапов и фотоотчёт заказчику.' },
];

const WA = 'https://wa.me/77716983869?text=' + encodeURIComponent('Здравствуйте! Хочу установить приложение QazGost для Android.');

export default function MobileAppBanner() {
  return (
    <section className="pro-section" id="mobile-app" aria-labelledby="pro-app-title">
      <div className="qg-container">
        <div className="pro-app">
          <div className="pro-app-copy">
            <h2 id="pro-app-title">На объекте — с телефона</h2>
            <p>Сайт полностью работает в мобильном браузере. Для команды на объекте есть три приложения для Android, они синхронизируются с CRM.</p>
            <a className="qg-btn qg-btn--primary" href={WA} target="_blank" rel="noopener noreferrer">
              Получить приложение
            </a>
            <p className="pro-app-note">Ссылку на установку пришлём в WhatsApp. Приложение для iPhone готовится.</p>
          </div>
          <ul className="pro-app-list">
            {APPS.map((a) => (
              <li key={a.id}>
                <span className="pro-app-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="2.5" /><path d="M10.5 18.5h3" /></svg>
                </span>
                <span>
                  <strong>QazGost {a.name}</strong>
                  <span>{a.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
