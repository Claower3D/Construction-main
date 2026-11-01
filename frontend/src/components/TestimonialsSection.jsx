import React from 'react';

const REVIEWS = [
  {
    name: 'Арман Касымов',
    role: 'Заказчик, Алматы',
    quote: 'Сделал смету по фото ванной. Раньше мастер считал на глаз и называл цену вдвое выше. Теперь я знаю, сколько это стоит на самом деле.',
  },
  {
    name: 'Айгерим Нурланова',
    role: 'Дизайнер интерьеров, Астана',
    quote: 'Загружаю фото, получаю смету и сразу показываю клиенту. Проверка дефектов помогает увидеть проблемы до начала работ.',
  },
  {
    name: 'Бауыржан Токтаров',
    role: 'Прораб, ТОО «СтройМарк»',
    quote: 'Заявки из своего города приходят каждый день. Прозрачные цены помогают договариваться с заказчиком без торга вслепую.',
  },
];

function initials(name) {
  return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('');
}

export default function TestimonialsSection() {
  return (
    <section className="lp-section lp-reviews" id="testimonials" aria-labelledby="lp-reviews-title">
      <div className="qg-container">
        <div className="qg-section-head">
          <h2 id="lp-reviews-title">Что говорят пользователи</h2>
          <p>Заказчики, дизайнеры и прорабы из разных городов Казахстана.</p>
        </div>
        <ul className="lp-reviews-grid">
          {REVIEWS.map((r) => (
            <li key={r.name}>
              <figure className="lp-review">
                <blockquote>
                  <p>{r.quote}</p>
                </blockquote>
                <figcaption>
                  <span className="lp-review-avatar" aria-hidden="true">{initials(r.name)}</span>
                  <span>
                    <strong>{r.name}</strong>
                    <span>{r.role}</span>
                  </span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
