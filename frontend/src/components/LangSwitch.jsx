import React, { useEffect, useRef, useState } from 'react';
import { LANGS, setLang, useLang } from '../i18n';

const GROUP_LABEL = { ru: 'Язык интерфейса', kk: 'Интерфейс тілі', en: 'Interface language', zh: '界面语言', tr: 'Arayüz dili' };

// Переключатель языка. Языков больше трёх, поэтому в шапке это кнопка с выпадающим списком,
// а в мобильном меню (variant="list") — все языки сразу, плитками. Названия языков написаны на них самих
// и не переводятся (translate="no"); подпись для экранных дикторов — на текущем языке.
export default function LangSwitch({ variant = 'menu', className = '', style }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];
  const label = GROUP_LABEL[lang] || GROUP_LABEL.en;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => {
      if (e.key === 'Escape') { setOpen(false); rootRef.current?.querySelector('.lang-trigger')?.focus(); }
    };
    // открыли список — фокус на текущем языке, чтобы стрелками сразу можно было выбирать
    rootRef.current?.querySelector('.lang-item.active')?.focus();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // стрелки вверх/вниз ходят по списку, Home/End — в начало и конец
  const onMenuKey = (e) => {
    const items = [...e.currentTarget.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    const go = { ArrowDown: (i + 1) % items.length, ArrowUp: (i - 1 + items.length) % items.length, Home: 0, End: items.length - 1 }[e.key];
    if (go === undefined) return;
    e.preventDefault();
    items[go].focus();
  };

  const pick = (code) => { setLang(code); setOpen(false); };

  if (variant === 'list') {
    return (
      <div className={`lang-list ${className}`.trim()} role="group" aria-label={label} style={style} translate="no">
        {LANGS.map((l) => (
          <button key={l.code} type="button" lang={l.code} data-lang={l.code}
            className={`lang-btn${lang === l.code ? ' active' : ''}`} aria-pressed={lang === l.code} onClick={() => pick(l.code)}>
            {l.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`lang-switch ${className}`.trim()} ref={rootRef} style={style} translate="no">
      <button type="button" className="lang-trigger" aria-haspopup="menu" aria-expanded={open} aria-label={`${label}: ${current.name}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'ArrowDown' && !open) { e.preventDefault(); setOpen(true); } }}>
        <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="10" cy="10" r="7.5" /><path d="M2.5 10h15M10 2.5c2.3 2.2 3.4 4.7 3.4 7.5s-1.1 5.3-3.4 7.5M10 2.5C7.7 4.7 6.6 7.2 6.6 10s1.1 5.3 3.4 7.5" />
        </svg>
        <span>{current.label}</span>
        <svg className="lang-caret" viewBox="0 0 10 6" width="9" height="6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open && (
        <div className="lang-menu" role="menu" aria-label={label} onKeyDown={onMenuKey}>
          {LANGS.map((l) => (
            <button key={l.code} type="button" role="menuitemradio" aria-checked={lang === l.code} lang={l.code} data-lang={l.code}
              className={`lang-item${lang === l.code ? ' active' : ''}`} onClick={() => pick(l.code)}>
              <span>{l.name}</span>
              <span className="lang-code">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
