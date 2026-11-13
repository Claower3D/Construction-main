import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Users as UsersIcon, ClipboardList, ShieldCheck, Menu, ArrowLeft, RefreshCw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getSession, clearSession, setUnauthorizedHandler, api } from './api/adminApi';
import Login from './screens/Login';
import Overview from './screens/Overview';
import Users from './screens/Users';
import Orders from './screens/Orders';
import Moderation from './screens/Moderation';
import More, { MORE_ITEMS } from './screens/More';
import Settings from './screens/Settings';
import { Disputes, Prices, Regions, Kpi, Server, Roles, Audit, Market, Documents } from './screens/Sections';
import mark from './assets/mark.png';

const TABS = [
  { id: 'overview', label: 'Обзор', icon: LayoutDashboard },
  { id: 'users', label: 'Люди', icon: UsersIcon },
  { id: 'orders', label: 'Заказы', icon: ClipboardList },
  { id: 'moderation', label: 'Проверка', icon: ShieldCheck },
  { id: 'more', label: 'Ещё', icon: Menu },
];
const SUB = Object.fromEntries(MORE_ITEMS.map((m) => [m.id, m]));
const TITLES = { overview: 'Обзор', users: 'Пользователи', orders: 'Заказы', moderation: 'Модерация', more: 'Ещё' };

export default function App() {
  const [session, setSession] = useState(() => getSession());
  const [notice, setNotice] = useState('');
  const [screen, setScreen] = useState('overview');
  const [preset, setPreset] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [toastMsg, setToastMsg] = useState(null);
  const [badge, setBadge] = useState(0);
  const toastTimer = useRef(null);
  const mainRef = useRef(null);

  const toast = useCallback((text, kind = 'ok') => {
    clearTimeout(toastTimer.current);
    setToastMsg({ text, kind });
    toastTimer.current = setTimeout(() => setToastMsg(null), 3200);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setSession(null); setNotice('Сессия закончилась или права изменились — войдите снова.'); });
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/status-bar').then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        StatusBar.setBackgroundColor({ color: '#0d1520' }).catch(() => {});
      }).catch(() => {});
    }
  }, []);

  // Навигация через историю: аппаратная кнопка «назад» на Android возвращает на прошлый экран
  useEffect(() => {
    const onPop = (e) => {
      const st = e.state || {};
      setScreen(st.screen || 'overview');
      setPreset(st.preset || null);
    };
    window.history.replaceState({ screen: 'overview' }, '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const go = useCallback((id, p = null) => {
    setScreen(id); setPreset(p);
    window.history.pushState({ screen: id, preset: p }, '');
    if (mainRef.current) mainRef.current.scrollTop = 0;
  }, []);

  // число специалистов, ждущих проверки, — на значке вкладки
  useEffect(() => {
    if (!session) return;
    api.overview(7).then((o) => setBadge(o.users.unverified || 0)).catch(() => {});
  }, [session, refreshKey]);

  if (!session) {
    return <Login notice={notice} onLoggedIn={() => { setNotice(''); setSession(getSession()); setScreen('overview'); }} />;
  }

  const logout = () => { clearSession(); setSession(null); setNotice(''); };
  const me = session.user;
  const isSub = !!SUB[screen];
  const activeTab = isSub ? 'more' : screen;
  const title = isSub ? SUB[screen].title : TITLES[screen];
  const common = { me, toast, go, preset, refreshKey };

  let body;
  switch (screen) {
    case 'users': body = <Users {...common} />; break;
    case 'orders': body = <Orders {...common} />; break;
    case 'moderation': body = <Moderation {...common} onPending={setBadge} />; break;
    case 'more': body = <More go={go} />; break;
    case 'disputes': body = <Disputes {...common} />; break;
    case 'prices': body = <Prices {...common} />; break;
    case 'regions': body = <Regions {...common} />; break;
    case 'kpi': body = <Kpi {...common} />; break;
    case 'server': body = <Server {...common} />; break;
    case 'roles': body = <Roles {...common} />; break;
    case 'audit': body = <Audit {...common} />; break;
    case 'market': body = <Market {...common} />; break;
    case 'documents': body = <Documents />; break;
    case 'settings': body = <Settings me={me} toast={toast} onLogout={logout} />; break;
    default: body = <Overview {...common} />;
  }

  return (
    <div className="qz-app">
      <header className="qz-header">
        <div className="qz-header-bar">
          {isSub
            ? <button type="button" className="qz-iconbtn" aria-label="Назад" onClick={() => window.history.back()}><ArrowLeft size={22} /></button>
            : <img src={mark} alt="" width="36" height="36" className="qga-header-mark" />}
          <div className="qz-header-titles">
            <h1 className="qz-header-title">{title}</h1>
            <div className="qz-header-sub"><span className="qz-net is-online" aria-hidden="true" /><span>QazGost Админ · {me?.name || me?.email}</span></div>
          </div>
          <button type="button" className="qz-iconbtn" aria-label="Обновить данные" onClick={() => { setRefreshKey((k) => k + 1); toast('Данные обновлены'); }}>
            <RefreshCw size={20} />
          </button>
        </div>
      </header>

      <main className="qz-main" ref={mainRef} key={screen}>{body}</main>

      <nav className="qz-nav" aria-label="Разделы">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button key={id} type="button" data-tab={id} className={`qz-nav-item${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined}
              onClick={() => (screen === id ? setRefreshKey((k) => k + 1) : go(id))}>
              <span className="qz-nav-icon"><Icon size={22} strokeWidth={active ? 2.4 : 2} /></span>
              <span className="qz-nav-label">{label}</span>
              {id === 'moderation' && badge > 0 && <span className="qz-nav-badge">{badge > 99 ? '99+' : badge}</span>}
            </button>
          );
        })}
      </nav>

      {toastMsg && <div className={`qz-toast${toastMsg.kind === 'error' ? ' is-error' : ''}`} role="status">{toastMsg.text}</div>}
    </div>
  );
}
