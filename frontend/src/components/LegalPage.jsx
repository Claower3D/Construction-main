import React, { useEffect } from 'react';
import { LEGAL_DOCS, LEGAL_OPERATOR, LEGAL_VERSION_LABEL } from '../data/legal';
import './LegalPage.css';

// Страницы /terms, /privacy, /consent — тексты из data/legal.js
export default function LegalPage({ docKey = 'privacy', onBack }) {
  const doc = LEGAL_DOCS[docKey] || LEGAL_DOCS.privacy;
  const sections = doc.sections();

  useEffect(() => {
    const prev = document.title;
    document.title = `${doc.title} — QazGost AI`;
    window.scrollTo(0, 0);
    return () => { document.title = prev; };
  }, [doc.title]);

  const go = (path) => (e) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const hasRequisites = LEGAL_OPERATOR.entity || LEGAL_OPERATOR.bin || LEGAL_OPERATOR.address;

  return (
    <div className="lg-page">
      <div className="lg-wrap">
        {onBack && (
          <button type="button" className="qg-btn qg-btn--ghost qg-btn--sm lg-back" onClick={onBack}>← Назад</button>
        )}

        <header className="lg-head">
          <h1>{doc.title}</h1>
          <p>{doc.lead}</p>
          <p className="lg-version">Редакция от {LEGAL_VERSION_LABEL}</p>
        </header>

        <nav className="lg-tabs" aria-label="Документы">
          {Object.entries(LEGAL_DOCS).map(([key, d]) => (
            <a key={key} href={d.path} onClick={go(d.path)} aria-current={key === docKey ? 'page' : undefined} className="lg-tab">
              {d.title.replace('Согласие на сбор и обработку персональных данных', 'Согласие на обработку данных')}
            </a>
          ))}
        </nav>

        <article className="lg-card">
          {sections.map((s) => (
            <section key={s.h} className="lg-section">
              <h2>{s.h}</h2>
              {(s.p || []).map((t, i) => <p key={i}>{t}</p>)}
              {s.ul && (
                <ul>
                  {s.ul.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              )}
            </section>
          ))}

          {hasRequisites && (
            <section className="lg-section lg-req">
              <h2>Реквизиты Оператора</h2>
              <dl>
                {LEGAL_OPERATOR.entity && (<><dt>Наименование</dt><dd>{LEGAL_OPERATOR.entity}</dd></>)}
                {LEGAL_OPERATOR.bin && (<><dt>БИН / ИИН</dt><dd>{LEGAL_OPERATOR.bin}</dd></>)}
                {LEGAL_OPERATOR.address && (<><dt>Адрес</dt><dd>{LEGAL_OPERATOR.address}</dd></>)}
                {LEGAL_OPERATOR.email && (<><dt>Email</dt><dd><a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a></dd></>)}
              </dl>
            </section>
          )}
        </article>

        <p className="lg-contacts">
          Вопросы по документу:{' '}
          <a href={LEGAL_OPERATOR.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp {LEGAL_OPERATOR.whatsapp}</a>
          {' · '}
          <a href={LEGAL_OPERATOR.telegramUrl} target="_blank" rel="noopener noreferrer">Telegram {LEGAL_OPERATOR.telegram}</a>
          {LEGAL_OPERATOR.email && (<>{' · '}<a href={`mailto:${LEGAL_OPERATOR.email}`}>{LEGAL_OPERATOR.email}</a></>)}
        </p>
      </div>
    </div>
  );
}
