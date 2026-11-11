import React from 'react';

// Только проверяемые цифры: размер ценовой базы и каталога, скорость ответа сервиса дефектов.
// (Раньше здесь были «99,4% точности дефектоскопии» — модель так не валидирована.)
const FACTS = [
  { value: '23 864', label: 'расценки ЭСН РК в базе: работы, материалы, техника' },
  { value: '9 706', label: 'позиций стройматериалов с ценами по регионам' },
  { value: '< 1 с', label: 'на анализ одного фото сервером дефектоскопии' },
];

export default function StatsBanner() {
  return (
    <section className="lp-facts" aria-label="Платформа в цифрах">
      <div className="qg-container">
        <dl className="lp-facts-row">
          {FACTS.map((f) => (
            <div key={f.label} className="lp-fact">
              <dt>{f.label}</dt>
              <dd className="qg-num">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
