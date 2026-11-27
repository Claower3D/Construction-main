import React, { useCallback, useEffect, useRef, useState } from 'react';
import VipWorksBoard from '@site/components/VipWorksBoard';
import VipObjectView from '@site/components/vip/VipObjectView';
import { listProjects, getProject } from '@site/services/vipApi';
import { getSession, clearSession, signIn, sessionAccepted, ROLES } from './session';

// Приложение «VIP Застройщик»: те же экраны, что в модуле «Строительство зданий» на сайте.
// Внизу четыре раздела: график работ, объект с моделью, люди и техника, документы.

const I = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
const TABS = [
  { id: 'schedule', label: 'График', icon: <><rect x="3" y="5" width="18" height="16" rx="2" {...I} /><path d="M3 10h18M8 3v4M16 3v4M7 14h6M7 17.5h10" {...I} /></> },
  { id: 'object', label: 'Объект', icon: <><path d="M3 11 12 5l9 6" {...I} /><path d="M5 10v10h14V10M3 20h18M9 20v-6h6v6" {...I} /></> },
  { id: 'team', label: 'Люди и техника', icon: <><circle cx="9" cy="8" r="3.2" {...I} /><path d="M3 20c.5-3.6 2.8-5.5 6-5.5s5.5 1.9 6 5.5" {...I} /><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 2.8 2.4 3 5.2" {...I} /></> },
  { id: 'docs', label: 'Документы', icon: <><path d="M6 3h8l4 4v14H6z" {...I} /><path d="M14 3v4h4M9 12h6M9 16h6" {...I} /></> },
];

function Login({ onDone, notice }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError('');
    try { onDone(await signIn(email, password)); } catch (err) { setError(err.message || 'Не удалось войти'); } finally { setBusy(false); }
  };
  return (
    <div className="vb-login">
      <form className="vb-login-card" onSubmit={submit}>
        <div className="vb-brand"><span className="vb-brand-mark">Q</span><span>QazGost <b>Застройщик</b></span></div>
        <h1>Вход</h1>
        <p className="vb-lead">График работ, объект, люди, техника и документы стройки.</p>
        {notice && !error && <div className="vb-alert info" role="status">{notice}</div>}
        {error && <div className="vb-alert" role="alert">{error}</div>}
        <label className="vb-field"><span>Эл. почта</span>
          <input className="vip-input" type="email" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="vb-field"><span>Пароль</span>
          <span className="vb-pass">
            <input className="vip-input" type={show ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="button" className="vb-eye" onClick={() => setShow(!show)} aria-pressed={show}>{show ? 'скрыть' : 'показать'}</button>
          </span>
        </label>
        <button type="submit" className="vip-primary-btn vb-submit" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
        <p className="vb-note">Доступ — у администратора, менеджера и тех, кому открыт просмотр. Учётная запись та же, что на сайте qazgost.kz.</p>
      </form>
    </div>
  );
}

function ObjectScreen({ onOpen }) {
  const [state, setState] = useState({ status: 'loading', error: '', project: null });
  const load = useCallback(async () => {
    setState({ status: 'loading', error: '', project: null });
    try {
      const items = await listProjects();
      let want = '';
      try { want = localStorage.getItem('qazgost_vip_project') || ''; } catch { /* память недоступна */ }
      const hit = items.find((x) => x.id === want) || items[0];
      if (!hit) { setState({ status: 'empty', error: '', project: null }); return; }
      const p = await getProject(hit.id);
      setState({ status: 'ready', error: '', project: p.data });
    } catch (e) { setState({ status: 'error', error: e.message || 'не удалось загрузить', project: null }); }
  }, []);
  useEffect(() => { load(); }, [load]);
  if (state.status === 'loading') return <div className="vip-content-section"><div className="vwb-empty" role="status"><div className="vwb-spinner" aria-hidden="true" /><p>Загружаем объект…</p></div></div>;
  if (state.status === 'error') return <div className="vip-content-section"><div className="vwb-empty" role="alert"><h3>Объект не открылся</h3><p>{state.error}</p><button type="button" className="vip-primary-btn" onClick={load}>Повторить</button></div></div>;
  if (state.status === 'empty') return <div className="vip-content-section"><div className="vwb-empty"><h3>Объектов пока нет</h3><p>Создайте проект или загрузите его из файла в разделе «График».</p><button type="button" className="vip-primary-btn" onClick={() => onOpen('schedule')}>Открыть график</button></div></div>;
  return <div className="vip-content-section vb-object"><VipObjectView project={state.project} onOpen={onOpen} /></div>;
}

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState('schedule');
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);
  const showToast = useCallback((m) => { setToast(m); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''), 3500); }, []);

  const signOut = useCallback((why = '') => { clearSession(); setSession(null); setNotice(why); }, []);

  // сессию могли закрыть (сменили пароль или права) — проверяем при запуске и возврате в приложение
  useEffect(() => {
    if (!session) return undefined;
    let alive = true;
    const check = async () => {
      if (document.visibilityState === 'hidden') return;
      const ok = await sessionAccepted(session.token);
      if (alive && !ok) signOut('Сессия закрыта: истёк её срок или у аккаунта сменили пароль. Войдите снова.');
    };
    check();
    const timer = setInterval(check, 60000);
    document.addEventListener('visibilitychange', check);
    return () => { alive = false; clearInterval(timer); document.removeEventListener('visibilitychange', check); };
  }, [session, signOut]);

  useEffect(() => { window.scrollTo(0, 0); }, [tab]);
  // высота верхней полосы приложения: шапка календаря прилипает прямо под ней
  const headBar = useRef(null);
  useEffect(() => {
    const el = headBar.current;
    if (!el) return undefined;
    const set = () => document.documentElement.style.setProperty('--vwb-sticky-top', `${el.offsetHeight}px`);
    set();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(set) : null;
    if (ro) ro.observe(el);
    return () => { if (ro) ro.disconnect(); document.documentElement.style.removeProperty('--vwb-sticky-top'); };
  }, [session]); // полоса появляется после входа

  if (!session) return <Login notice={notice} onDone={(s) => { setNotice(''); setSession(s); setTab('schedule'); }} />;

  return (
    <div className="vb-app">
      <header className="vb-head" ref={headBar}>
        <div className="vb-head-title"><b>Застройщик</b><small>{session.user.name || session.user.email}</small></div>
        <button type="button" className="vb-out" onClick={() => signOut('')}>Выйти</button>
      </header>
      <main className="vip-construction-module vb-main">
        {toast && <div className="vip-toast" role="status">{toast}</div>}
        {tab === 'object'
          ? <ObjectScreen onOpen={setTab} />
          : <VipWorksBoard key={tab} section={tab} onToast={showToast} readOnly={!ROLES.includes(session.user.role)} />}
      </main>
      <nav className="vb-nav" aria-label="Разделы">
        {TABS.map((t) => (
          <button type="button" key={t.id} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            <svg viewBox="0 0 24 24" aria-hidden="true">{t.icon}</svg>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
