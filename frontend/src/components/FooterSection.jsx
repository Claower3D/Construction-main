import React from 'react';
import { startFlow, navigateTo, scrollToSection } from '../utils/navigate';

export default function FooterSection() {
  const go = (path) => (e) => { e.preventDefault(); navigateTo(path); };
  return (
    <footer className="lp-footer">
      <div className="qg-container">
        <div className="lp-footer-cta">
          <div>
            <h2>Пришлите фото — получите смету и заключение</h2>
            <p>Регистрация занимает минуту. Первую оценку можно сделать сразу.</p>
          </div>
          <button type="button" className="qg-btn qg-btn--primary" onClick={() => startFlow('register')}>Начать оценку</button>
        </div>

        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <span className="lp-footer-logo">QazGost AI</span>
            <p>Сметы, проверка дефектов и подрядчики по нормам Республики Казахстан.</p>
          </div>
          <nav aria-label="Разделы сайта" className="lp-footer-nav">
            <a href="/" onClick={(e) => { e.preventDefault(); navigateTo('/'); }}>Главная</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => scrollToSection('how-it-works'), 50); }}>Как это работает</a>
            <a href="/catalog" onClick={go('/catalog')}>Подрядчики</a>
            <a href="/materials" onClick={go('/materials')}>Стройматериалы</a>
            <a href="/equipment" onClick={go('/equipment')}>Спецтехника</a>
            <a href="/wallet" onClick={go('/wallet')}>Кошелёк</a>
          </nav>
          <div className="lp-footer-creator">
            <span className="lp-footer-label">Создатель</span>
            <strong>Барбашин Максим</strong>
            <a href="https://t.me/Link_vaAI" target="_blank" rel="noopener noreferrer">Telegram: @Link_vaAI</a>
          </div>
        </div>

        <p className="lp-footer-copy">© 2026 QazGost AI. Сделано в Казахстане.</p>
      </div>
    </footer>
  );
}
