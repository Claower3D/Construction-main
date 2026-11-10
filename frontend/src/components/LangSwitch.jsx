import React from 'react';
import { LANGS, setLang, useLang } from '../i18n';

const GROUP_LABEL = { ru: 'Язык интерфейса', kk: 'Интерфейс тілі', en: 'Interface language' };

// Переключатель RU / KZ / EN. Подписи кнопок не переводятся (translate="no"),
// название группы для экранных дикторов — на текущем языке.
export default function LangSwitch({ className = 'lang-switch', style, buttonStyle }) {
  const lang = useLang();
  return (
    <div className={className} role="group" aria-label={GROUP_LABEL[lang]} style={style} translate="no">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          className={`lang-btn${lang === l.code ? ' active' : ''}`}
          aria-pressed={lang === l.code}
          title={l.name}
          style={buttonStyle}
          onClick={() => setLang(l.code)}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
