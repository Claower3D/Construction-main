import React from 'react';
import { ArrowRight } from 'lucide-react';
import { startFlow, navigateTo } from '../utils/navigate';

// Все сервисы платформы, разбитые по категориям.
// Каждая категория — ряд из широкой и узкой карточки; стороны чередуются.
const GROUPS = [
  {
    id: 'ai',
    title: 'Расчёты по фото',
    note: 'Нейросеть считает работы и находит дефекты',
    items: [
      {
        key: 'estimate', wide: true, title: 'Смета по фото',
        points: ['Фото или видео объекта', 'Объёмы работ и материалов', 'Три сценария цены', 'Экспорт в PDF и Excel'],
        result: 'Готовая смета', go: () => startFlow('register'),
      },
      {
        key: 'defect', title: 'Акт дефектов',
        points: ['Трещины, сколы, протечки', 'Ссылки на нормативы', 'Цена ремонта'],
        result: 'Акт с рекомендациями', go: () => startFlow('register'),
      },
    ],
  },
  {
    id: 'market',
    title: 'Маркетплейс',
    note: 'Материалы и техника с ценами по регионам РК',
    items: [
      {
        key: 'equipment', title: 'Спецтехника',
        points: ['Экскаваторы и погрузчики', 'Автокраны и самосвалы', 'Посменная аренда'],
        result: 'Бронь на нужные даты', go: () => navigateTo('/equipment'),
      },
      {
        key: 'materials', wide: true, title: 'Стройматериалы',
        points: ['9 706 позиций', 'Цены по регионам РК', 'Сравнение поставщиков', 'Доставка на объект'],
        result: 'Заказ и доставка', go: () => navigateTo('/materials'),
      },
    ],
  },
  {
    id: 'crews',
    title: 'Бригады и заказы',
    note: 'Найти исполнителя или взять заказ',
    items: [
      {
        key: 'crews', wide: true, title: 'Каталог подрядчиков',
        points: ['Бригады по видам работ', 'Бригадир и состав', 'Телефон для связи', 'Поиск по городу'],
        result: 'Прямой контакт', go: () => navigateTo('/catalog'),
      },
      {
        key: 'orders', title: 'Лента заказов',
        points: ['Заявки по городу', 'Этапы работ', 'Сдача объекта'],
        result: 'Заказы для бригад', go: () => startFlow('login'),
      },
    ],
  },
  {
    id: 'eng',
    title: 'Инженерия и проект',
    note: 'Расчёты по СНиП и проектная документация',
    items: [
      {
        key: 'calc', title: 'Инженерный калькулятор',
        points: ['Сечение кабеля', 'Отопление', 'Водоснабжение и канализация'],
        result: 'Расчёт по СНиП', go: () => navigateTo('/calc'),
      },
      {
        key: 'psd', wide: true, title: 'Инжиниринг и ПСД',
        points: ['Эскиз и рабочий проект', 'Инженерные сети', 'Технический надзор', 'Согласования'],
        result: 'Пакет документов', go: () => navigateTo('/engineering'),
      },
    ],
  },
];

function ServiceCard({ item }) {
  const { key, wide, title, points, result, go } = item;
  return (
    <article className={`svc-card lux-glass${wide ? ' svc-card--wide' : ''}`}>
      <div className="svc-card-body">
        <h4 className="svc-card-title">{title}</h4>
        <ul className={`svc-points${wide ? ' svc-points--2' : ''}`}>
          {points.map((p) => <li key={p}>{p}</li>)}
        </ul>
        <div className="svc-card-foot">
          <span className="svc-result">{result}</span>
          <button type="button" className="svc-open" onClick={go} aria-label={`Открыть: ${title}`}>
            Открыть <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="svc-art" aria-hidden="true">
        <img src={`/assets/landing/svc-${key}.webp`} alt="" width="400" height="300" loading="lazy" decoding="async" />
      </div>
    </article>
  );
}

export default function PlatformServicesSection() {
  return (
    <section className="lux-section svc" id="services" aria-labelledby="lux-services-title">
      <div className="qg-container">
        <header className="lux-head">
          <h2 id="lux-services-title">Все сервисы платформы</h2>
          <p>Один аккаунт для заказчика, бригады и инженера.</p>
        </header>

        <nav className="svc-jump" aria-label="Категории сервисов">
          {GROUPS.map((g) => <a key={g.id} href={`#svc-${g.id}`} data-tone={g.id}>{g.title}</a>)}
        </nav>

        <div className="svc-groups">
          {GROUPS.map((g, gi) => (
            <section key={g.id} id={`svc-${g.id}`} className="svc-group" data-tone={g.id} aria-labelledby={`svc-${g.id}-t`}>
              <div className="svc-group-head">
                <h3 id={`svc-${g.id}-t`}>{g.title}</h3>
                <p>{g.note}</p>
              </div>
              <div className={`svc-row${gi % 2 ? ' svc-row--flip' : ''}`}>
                {g.items.map((it) => <ServiceCard key={it.key} item={it} />)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
