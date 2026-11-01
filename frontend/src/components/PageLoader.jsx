import React from 'react';

/**
 * Заглушка для React.Suspense, пока догружается чанк страницы.
 * Без анимаций при prefers-reduced-motion (см. tokens.css → .qg-loader).
 */
export default function PageLoader({ label = 'Загружаем раздел…', compact = false }) {
  return (
    <div className={`qg-loader${compact ? ' qg-loader--compact' : ''}`} role="status" aria-live="polite">
      <span className="qg-loader__bar" aria-hidden="true" />
      <span className="qg-loader__label">{label}</span>
    </div>
  );
}
