import React, { useEffect } from 'react';
import './RegisterPage.css';

/**
 * «Страница не найдена».
 *
 * Раньше любой неизвестный адрес (опечатка, устаревшая ссылка, /category/<несуществующий раздел>)
 * молча показывал главную или пустой экран между шапкой и подвалом. Теперь человек видит,
 * что адрес неверный, и поисковикам страница помечается как неиндексируемая.
 */
export default function NotFoundPage({ onHome, onOpenCatalog }) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = 'Страница не найдена — QazGost AI';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex';
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, []);

  return (
    <div className="rg-page">
      <div className="rg-done" data-testid="not-found">
        <h1>Страница не найдена</h1>
        <p>По этому адресу ничего нет: возможно, в ссылке опечатка или раздел переехал.</p>
        <button type="button" className="rg-submit" onClick={onHome}>На главную</button>
        {onOpenCatalog && (
          <p style={{ marginTop: '14px' }}>
            <a href="/materials" onClick={(e) => { e.preventDefault(); onOpenCatalog(); }}>Открыть каталог материалов</a>
          </p>
        )}
      </div>
    </div>
  );
}
