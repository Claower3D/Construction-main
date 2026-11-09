import React from 'react';
import { ArrowRight, Send } from 'lucide-react';
import { startFlow, navigateTo, scrollToSection } from '../utils/navigate';

export default function FooterSection() {
  const go = (path) => (e) => { e.preventDefault(); navigateTo(path); };
  const toSection = (id) => (e) => { e.preventDefault(); navigateTo('/'); setTimeout(() => scrollToSection(id), 50); };
  return (
    <footer className="lux-footer">
      <div className="qg-container">
        <div className="lux-glass lux-glass--gold lux-cta">
          <div>
            <h2>Превратите фото в готовую смету</h2>
            <p>Регистрация занимает минуту, первую оценку можно сделать сразу.</p>
          </div>
          <button type="button" className="qg-btn qg-btn--primary lux-btn-lg" onClick={() => startFlow('register')}>
            Начать бесплатно <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="lux-footer-grid">
          <div className="lux-footer-brand">
            <span className="lux-footer-logo">QazGost AI</span>
            <p>Сметы, проверка дефектов и подрядчики по нормам Республики Казахстан.</p>
          </div>
          <nav aria-label="Возможности">
            <p className="lux-footer-h">Возможности</p>
            <a href="#hero" onClick={toSection('hero')}>Смета по фото</a>
            <a href="#examples" onClick={toSection('examples')}>Пример сметы</a>
            <a href="#budget" onClick={toSection('budget')}>Калькулятор бюджета</a>
            <a href="/calc" onClick={go('/calc')}>Инженерный калькулятор</a>
          </nav>
          <nav aria-label="Платформа">
            <p className="lux-footer-h">Платформа</p>
            <a href="/catalog" onClick={go('/catalog')}>Подрядчики</a>
            <a href="/materials" onClick={go('/materials')}>Стройматериалы</a>
            <a href="/equipment" onClick={go('/equipment')}>Спецтехника</a>
            <a href="/wallet" onClick={go('/wallet')}>Кошелёк</a>
          </nav>
          <div className="lux-footer-contact">
            <p className="lux-footer-h">Создатель</p>
            <strong>Барбашин Максим</strong>
            <a href="https://t.me/Link_vaAI" target="_blank" rel="noopener noreferrer"><Send size={15} aria-hidden="true" /> Telegram @Link_vaAI</a>
            <a href="https://wa.me/77716983869" target="_blank" rel="noopener noreferrer">WhatsApp +7 771 698 3869</a>
          </div>
        </div>
        <div className="lux-footer-bottom">
          <p className="lux-footer-copy">© 2026 QazGost AI. Сделано в Казахстане.</p>
          <nav className="lux-footer-legal" aria-label="Документы">
            <a href="/terms" onClick={go('/terms')}>Пользовательское соглашение</a>
            <a href="/privacy" onClick={go('/privacy')}>Политика конфиденциальности</a>
            <a href="/consent" onClick={go('/consent')}>Согласие на обработку данных</a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
