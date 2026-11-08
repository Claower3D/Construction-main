import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Send, Mic, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { navigateTo, openAuth } from '../utils/navigate';
import './AiAssistantWidget.css';

/*
 * Арман — ИИ-инженер QazGost.
 * Живой аватар: дыхание, моргание, движение губ во время ответа, параллакс за курсором.
 * Ответы — POST /api/v1/ai/assistant (стриминг SSE): OpenAI + реальные цены из базы,
 * без ключа — база знаний платформы.
 */

const IMG = '/assistant/arman';
const STORE = 'qg_arman_chat_v1';
const GREETING = {
  role: 'assistant',
  content: 'Сәлем! Я Арман, ИИ-инженер QazGost. Подскажу цены на работы и материалы, посчитаю смету по фото, найду бригаду или спецтехнику. С чего начнём?',
};
const QUICK = [
  'Сколько стоит стяжка пола?',
  'Смета по фото — как это работает?',
  'Нужна бригада на ремонт',
  'На стене трещина, что делать?',
];

const reduceMotion = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ── Анимация лица: моргание и речь ─────────────────────────────
function useFace(talking) {
  const [eyes, setEyes] = useState(null);   // null | 'blink-half' | 'blink'
  const [mouth, setMouth] = useState(null); // null | 'talk1' | 'talk2' | 'talk3'

  useEffect(() => {
    if (reduceMotion()) return undefined;
    let t; let alive = true;
    const seq = (steps, i = 0) => {
      if (!alive) return;
      if (i >= steps.length) { schedule(); return; }
      setEyes(steps[i][0]);
      t = setTimeout(() => seq(steps, i + 1), steps[i][1]);
    };
    const once = [['blink-half', 45], ['blink', 85], ['blink-half', 55], [null, 0]];
    const schedule = () => {
      const twice = Math.random() < 0.18;
      t = setTimeout(() => seq(twice ? [...once.slice(0, 3), [null, 120], ...once] : once), 2200 + Math.random() * 3800);
    };
    schedule();
    return () => { alive = false; clearTimeout(t); };
  }, []);

  useEffect(() => {
    if (!talking || reduceMotion()) { setMouth(null); return undefined; }
    let t; let last = null;
    const tick = () => {
      const r = Math.random();
      let next = r < 0.2 ? null : r < 0.5 ? 'talk1' : r < 0.82 ? 'talk2' : 'talk3';
      if (next === last) next = next === null ? 'talk1' : null;
      last = next;
      setMouth(next);
      t = setTimeout(tick, 85 + Math.random() * 70);
    };
    tick();
    return () => { clearTimeout(t); setMouth(null); };
  }, [talking]);

  return { eyes, mouth };
}

function ArmanStage({ talking, thinking, compact }) {
  const { eyes, mouth } = useFace(talking);
  const ref = useRef(null);
  const onMove = (e) => {
    if (reduceMotion() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.setProperty('--px', x.toFixed(3));
    ref.current.style.setProperty('--py', y.toFixed(3));
  };
  const onLeave = () => { ref.current?.style.setProperty('--px', 0); ref.current?.style.setProperty('--py', 0); };
  return (
    <div ref={ref} className={`arm-stage${compact ? ' is-compact' : ''}${talking ? ' is-talking' : ''}${thinking ? ' is-thinking' : ''}`} onPointerMove={onMove} onPointerLeave={onLeave} aria-hidden="true">
      <div className="arm-rig">
        <div className="arm-body">
          <img className="arm-base" src={`${IMG}.webp`} alt="" width="886" height="956" />
          {['blink-half', 'blink'].map((k) => (
            <img key={k} className="arm-eyes" src={`${IMG}-${k}.webp`} alt="" style={{ opacity: eyes === k ? 1 : 0 }} />
          ))}
          {['talk1', 'talk2', 'talk3'].map((k) => (
            <img key={k} className="arm-mouth" src={`${IMG}-${k}.webp`} alt="" style={{ opacity: mouth === k ? 1 : 0 }} />
          ))}
          <span className="arm-ear" />
        </div>
      </div>
      <div className="arm-holo">
        <span className="arm-scan" />
        {Array.from({ length: 10 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
      </div>
      <div className="arm-voice"><b /><b /><b /><b /><b /></div>
    </div>
  );
}

function ArmanFigure({ talking, thinking }) {
  const { eyes, mouth } = useFace(talking);
  return (
    <span className={`arm-fig${talking ? ' is-talking' : ''}${thinking ? ' is-thinking' : ''}`} aria-hidden="true">
      <span className="arm-fig-pad"><i /><i /></span>
      <span className="arm-fig-float">
        <span className="arm-fig-body">
          <img className="arm-fig-base" src={`${IMG}-fig.webp`} alt="" width="480" height="391" />
          {['blink-half', 'blink'].map((k) => (
            <img key={k} className="arm-fig-eyes" src={`${IMG}-fig-${k}.webp`} alt="" style={{ opacity: eyes === k ? 1 : 0 }} />
          ))}
          {['talk1', 'talk2', 'talk3'].map((k) => (
            <img key={k} className="arm-fig-mouth" src={`${IMG}-fig-${k}.webp`} alt="" style={{ opacity: mouth === k ? 1 : 0 }} />
          ))}
          <span className="arm-fig-ear" />
          <span className="arm-fig-tablet" />
        </span>
      </span>
      <span className="arm-fig-sparks">{Array.from({ length: 6 }, (_, i) => <i key={i} style={{ '--i': i }} />)}</span>
    </span>
  );
}

// ── Мини-markdown: абзацы, списки, **жирный**, [ссылка](путь) ───────────
function Inline({ text, onLink }) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let last = 0; let m; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1]) parts.push(<strong key={k++}>{m[1]}</strong>);
    else parts.push(<button key={k++} type="button" className="arm-link" onClick={() => onLink(m[3])}>{m[2]}</button>);
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function RichText({ text, onLink }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((line, i) => {
    const li = line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)/);
    if (li) {
      if (!list) { list = []; blocks.push({ list }); }
      list.push(li[1]);
    } else {
      list = null;
      if (line.trim()) blocks.push({ p: line, i });
    }
  });
  return blocks.map((b, i) => (b.list
    ? <ul key={i}>{b.list.map((x, j) => <li key={j}><Inline text={x} onLink={onLink} /></li>)}</ul>
    : <p key={i}><Inline text={b.p} onLink={onLink} /></p>));
}

const plain = (s) => s.replace(/\*\*/g, '').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[•#]/g, '').replace(/₸/g, ' тенге');

export default function AiAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try { const s = JSON.parse(sessionStorage.getItem(STORE) || 'null'); if (Array.isArray(s) && s.length) return s; } catch { /* пусто */ }
    return [GREETING];
  });
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);      // ждём первый токен
  const [streaming, setStreaming] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => { try { return localStorage.getItem('qg_arman_voice') === '1'; } catch { return false; } });
  const [listening, setListening] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const recRef = useRef(null);

  const talking = streaming || speaking;
  const hasSR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => { try { sessionStorage.setItem(STORE, JSON.stringify(messages.slice(-30))); } catch { /* квота */ } }, [messages]);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [messages, open, busy]);

  // приветствие-подсказка один раз за сессию
  useEffect(() => {
    if (open) { setTeaser(false); return undefined; }
    let shown = false;
    try { shown = sessionStorage.getItem('qg_arman_teaser') === '1'; } catch { /* нет хранилища */ }
    if (shown) return undefined;
    const t = setTimeout(() => { setTeaser(true); try { sessionStorage.setItem('qg_arman_teaser', '1'); } catch { /* */ } }, 6000);
    const h = setTimeout(() => setTeaser(false), 16000);
    return () => { clearTimeout(t); clearTimeout(h); };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 250);
    return () => { window.removeEventListener('keydown', onKey); clearTimeout(t); };
  }, [open]);

  useEffect(() => () => { abortRef.current?.abort(); if (hasTTS) window.speechSynthesis.cancel(); }, [hasTTS]);

  const speak = useCallback((text) => {
    if (!hasTTS) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(plain(text).slice(0, 600));
    u.lang = 'ru-RU';
    const voices = synth.getVoices();
    const male = voices.find((v) => /ru/i.test(v.lang) && /(dmitry|pavel|maxim|male|муж)/i.test(v.name));
    const ru = male || voices.find((v) => /ru/i.test(v.lang));
    if (ru) u.voice = ru;
    u.rate = 1.04; u.pitch = 0.95;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    synth.speak(u);
  }, [hasTTS]);

  const toggleVoice = () => {
    const v = !voiceOn;
    setVoiceOn(v);
    try { localStorage.setItem('qg_arman_voice', v ? '1' : '0'); } catch { /* */ }
    if (!v && hasTTS) { window.speechSynthesis.cancel(); setSpeaking(false); }
  };

  const onLink = (href) => {
    if (href.startsWith('auth:')) { openAuth(href.slice(5) || 'register'); setOpen(false); return; }
    if (href.startsWith('/')) {
      navigateTo(href);
      if (window.innerWidth < 640) setOpen(false);
      return;
    }
    if (/^https?:\/\//.test(href)) window.open(href, '_blank', 'noopener');
  };

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy || streaming) return;
    setInput('');
    const history = [...messages.filter((m) => !m.error), { role: 'user', content: q }];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setBusy(true);
    if (hasTTS) window.speechSynthesis.cancel();

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    let acc = '';
    const push = (t) => {
      acc += t;
      setMessages((prev) => { const next = prev.slice(); next[next.length - 1] = { role: 'assistant', content: acc }; return next; });
    };
    try {
      let city = '';
      try { city = localStorage.getItem('qazgost_city') || ''; } catch { /* */ }
      const key = (() => { try { return localStorage.getItem('qazgost_user_openai_key') || ''; } catch { return ''; } })();
      const resp = await fetch('/api/v1/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(key ? { 'X-OpenAI-Key': key } : {}) },
        body: JSON.stringify({ messages: history.slice(-12).map(({ role, content }) => ({ role, content })), city }),
        signal: ctrl.signal,
      });
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const ev = buf.slice(0, i); buf = buf.slice(i + 2);
          const line = ev.split('\n').find((l) => l.startsWith('data:'));
          if (!line) continue;
          let d; try { d = JSON.parse(line.slice(5)); } catch { continue; }
          if (d.t) { if (!acc) { setBusy(false); setStreaming(true); } push(d.t); }
        }
      }
      if (!acc) throw new Error('empty');
      if (voiceOn) speak(acc);
    } catch (e) {
      if (e.name !== 'AbortError') {
        setMessages((prev) => {
          const next = prev.slice();
          next[next.length - 1] = { role: 'assistant', content: acc || 'Связь пропала, ответ не дошёл. Проверьте интернет и отправьте вопрос ещё раз.', error: !acc };
          return next;
        });
      }
    } finally {
      setBusy(false);
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const listen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = 'ru-RU'; rec.interimResults = true; rec.maxAlternatives = 1;
    let final = '';
    rec.onresult = (e) => {
      let txt = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript; else txt += e.results[i][0].transcript;
      }
      setInput((final + txt).trim());
    };
    rec.onend = () => { setListening(false); if (final.trim()) send(final.trim()); };
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  const reset = () => {
    abortRef.current?.abort();
    if (hasTTS) window.speechSynthesis.cancel();
    setMessages([GREETING]);
  };

  const userCount = messages.filter((m) => m.role === 'user').length;
  const status = busy ? 'Думает…' : streaming ? 'Отвечает…' : speaking ? 'Говорит…' : listening ? 'Слушает вас…' : 'Онлайн · отвечает за секунды';

  return (
    <div className="arm-widget">
      {open && (
        <section className="arm-window" role="dialog" aria-label="Чат с ИИ-инженером Арманом">
          <ArmanStage talking={talking} thinking={busy} compact={userCount > 0} />
          <header className="arm-head">
            <div>
              <h2 className="arm-name">Арман <span>ИИ-инженер QazGost</span></h2>
              <p className={`arm-status${busy || streaming || speaking || listening ? ' is-active' : ''}`}><i />{status}</p>
            </div>
            <div className="arm-tools">
              {userCount > 0 && <button type="button" onClick={reset} aria-label="Начать заново" title="Начать заново"><RotateCcw size={17} /></button>}
              {hasTTS && (
                <button type="button" onClick={toggleVoice} aria-pressed={voiceOn} aria-label={voiceOn ? 'Выключить голос' : 'Включить голос'} title={voiceOn ? 'Голос включён' : 'Озвучивать ответы'}>
                  {voiceOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
                </button>
              )}
              <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть чат"><X size={18} /></button>
            </div>
          </header>

          <div className="arm-body-scroll" ref={bodyRef} aria-live="polite">
            {messages.map((m, i) => (
              m.role === 'assistant' && !m.content ? null : (
                <div key={i} className={`arm-msg arm-msg--${m.role === 'user' ? 'me' : 'ai'}${m.error ? ' is-error' : ''}`}>
                  {m.role === 'user' ? m.content : <RichText text={m.content} onLink={onLink} />}
                </div>
              )
            ))}
            {busy && <div className="arm-msg arm-msg--ai arm-typing" aria-label="Арман печатает"><span /><span /><span /></div>}
            {userCount === 0 && (
              <div className="arm-quick">
                {QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
              </div>
            )}
          </div>

          <form className="arm-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? 'Говорите…' : 'Спросите про цены, смету, бригаду…'}
              aria-label="Сообщение Арману"
              maxLength={1000}
            />
            {hasSR && (
              <button type="button" className={`arm-mic${listening ? ' is-on' : ''}`} onClick={listen} aria-label={listening ? 'Остановить запись' : 'Сказать голосом'}>
                <Mic size={18} />
              </button>
            )}
            <button type="submit" className="arm-send" disabled={!input.trim() || busy || streaming} aria-label="Отправить">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      {teaser && !open && (
        <div className="arm-teaser">
          <button type="button" className="arm-teaser-msg" onClick={() => setOpen(true)}>
            Сәлем! Я Арман. Посчитать смету или подсказать цены?
          </button>
          <button type="button" className="arm-teaser-x" aria-label="Скрыть подсказку" onClick={() => setTeaser(false)}>×</button>
        </div>
      )}

      <button
        type="button"
        className={`arm-trigger${open ? ' is-open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Свернуть чат с Арманом' : 'Открыть чат с ИИ-инженером Арманом'}
      >
        <ArmanFigure talking={talking} thinking={busy} />
        <span className="arm-label">
          <span className="arm-online" />
          {busy ? 'Думает…' : talking ? 'Отвечает…' : open ? 'Свернуть' : 'AI Ассистент'}
        </span>
      </button>
    </div>
  );
}
