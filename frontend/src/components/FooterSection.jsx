import React from 'react';

export default function FooterSection() {
  return (
    <footer style={{ position: 'relative', zIndex: 1, background: 'rgba(3, 7, 18, 0.95)', borderTop: '1px solid var(--border)', padding: '50px 0 30px' }}>
      <div className="container">
        {/* Big Gold Start CTA Button */}
        <div className="footer-cta-wrap">
          <button className="btn-start-gold-big">
            <span>Начать оценку</span>
            <span className="cta-badge-kbd" style={{ background: 'rgba(0, 0, 0, 0.25)', color: '#000', fontWeight: 'bold' }}>
              GO
            </span>
          </button>
        </div>

        {/* Footer Navigation Links */}
        <div className="footer-nav-row">
          <span style={{ fontWeight: '900', color: 'var(--gold-main)' }}>🏗️ QazGost AI</span>
          <span>|</span>
          <a href="#">Главная</a>
          <a href="#">Оценка</a>
          <a href="#">Проверка</a>
          <a href="#">Заказы</a>
          <a href="#">💳 Кошелёк</a>
        </div>

        {/* Copyright */}
        <div className="footer-copyright">
          © 2026 QazGost AI. Все права защищены. 🇰🇿 Сделано в Казахстане
        </div>

        {/* Creator Block */}
        <div className="creator-block">
          <div className="creator-label">СОЗДАТЕЛЬ</div>
          <div className="creator-name">Барбашин Максим</div>
          <a href="https://t.me/Link_vaAI" target="_blank" rel="noopener noreferrer" className="telegram-btn">
            <span>✈️</span>
            <span>@Link_vaAI</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
