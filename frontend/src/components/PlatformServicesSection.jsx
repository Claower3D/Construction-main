import React from 'react';
import { startFlow, navigateTo } from '../utils/navigate';

// «Спецификация» сервисов — как таблица на листе чертежа: что делает, для кого, куда перейти.
const SERVICES = [
  { title: 'Оценка стоимости по фото', what: 'Смета, ведомость материалов, три сценария цены', who: 'Заказчик, исполнитель', action: 'Открыть', go: () => startFlow('register') },
  { title: 'Проверка дефектов', what: 'Трещины на фото, акт с нормативами и ценой ремонта', who: 'Заказчик, инженер', action: 'Открыть', go: () => startFlow('register') },
  { title: 'Стройматериалы', what: '10 425 позиций с ценами по регионам РК', who: 'Все', action: 'Перейти', go: () => navigateTo('/materials') },
  { title: 'Спецтехника', what: 'Аренда экскаваторов, кранов и самосвалов посменно', who: 'Все', action: 'Перейти', go: () => navigateTo('/equipment') },
  { title: 'Каталог подрядчиков', what: 'Бригады с бригадиром, составом и телефоном', who: 'Заказчик', action: 'Перейти', go: () => navigateTo('/catalog') },
  { title: 'Лента заказов и «Мои работы»', what: 'Заявки по городу, этапы, сдача объекта онлайн', who: 'Исполнитель', action: 'Войти', go: () => startFlow('login') },
  { title: 'Инженерный калькулятор', what: 'Сечение кабеля, отопление, водоснабжение', who: 'Инженер, исполнитель', action: 'Перейти', go: () => navigateTo('/calc') },
  { title: 'Инжиниринг и ПСД', what: 'Проект, инженерные сети, технадзор под ключ', who: 'Застройщик', action: 'Перейти', go: () => navigateTo('/engineering') },
];

export default function PlatformServicesSection() {
  return (
    <section className="lp-section lp-services" id="services" aria-labelledby="lp-services-title">
      <div className="qg-container">
        <div className="qg-section-head">
          <h2 id="lp-services-title">Все сервисы платформы</h2>
          <p>Один аккаунт для заказчика, бригады и инженера. Раздел откроется в вашем кабинете.</p>
        </div>
        <div className="lp-spec" role="table" aria-label="Сервисы платформы">
          <div className="lp-spec-row lp-spec-head" role="row">
            <span role="columnheader">Сервис</span>
            <span role="columnheader">Что делает</span>
            <span role="columnheader">Для кого</span>
            <span role="columnheader"><span className="qg-visually-hidden">Действие</span></span>
          </div>
          {SERVICES.map((s) => (
            <div className="lp-spec-row" role="row" key={s.title}>
              <span role="cell" className="lp-spec-title">{s.title}</span>
              <span role="cell" className="lp-spec-what">{s.what}</span>
              <span role="cell" className="lp-spec-who">{s.who}</span>
              <span role="cell" className="lp-spec-go">
                <button type="button" className="qg-btn qg-btn--ghost qg-btn--sm" onClick={s.go} aria-label={`${s.action}: ${s.title}`}>
                  {s.action}
                </button>
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
