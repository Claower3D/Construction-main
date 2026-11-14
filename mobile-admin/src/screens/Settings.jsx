import React, { useState } from 'react';
import { KeyRound, LogOut, Server } from 'lucide-react';
import { api, getServer, setServer, DEFAULT_SERVER, updateStoredToken } from '../api/adminApi';
import { PageHead, Kv } from '../components/kit';

const APP_VERSION = '1.1';

export default function Settings({ me, onLogout, toast }) {
  const [cur, setCur] = useState('');
  const [next, setNext] = useState('');
  const [rep, setRep] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [server, setSrv] = useState(getServer());

  const change = async (e) => {
    e.preventDefault();
    setErr('');
    if (next.length < 8) { setErr('Новый пароль — не короче 8 символов'); return; }
    if (next !== rep) { setErr('Пароли не совпадают'); return; }
    setBusy(true);
    try {
      const res = await api.changePassword(cur, next);
      updateStoredToken(res && res.token);
      setCur(''); setNext(''); setRep('');
      toast('Пароль изменён. На других устройствах нужно войти заново.');
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  const saveServer = () => {
    setServer(server);
    toast('Адрес сервера сохранён — войдите заново');
    onLogout();
  };

  return (
    <div className="qz-page qz-stack">
      <PageHead title="Настройки" />
      <section className="qz-card qz-stack">
        <Kv rows={[['Аккаунт', me?.name || '—'], ['Почта', me?.email], ['Роль', 'администратор'], ['Версия приложения', APP_VERSION]]} />
      </section>

      <form className="qz-card qz-stack" onSubmit={change} noValidate>
        <h3 className="qz-h3 qz-row"><KeyRound size={18} />Сменить пароль</h3>
        <label className="qz-field"><span className="qz-label">Текущий пароль</span><input id="qga-cur" className="qz-input" type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} /></label>
        <label className="qz-field"><span className="qz-label">Новый пароль</span><input id="qga-new" className="qz-input" type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} /></label>
        <label className="qz-field"><span className="qz-label">Новый пароль ещё раз</span><input id="qga-rep" className="qz-input" type="password" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="new-password" value={rep} onChange={(e) => setRep(e.target.value)} /></label>
        <p className="qz-xs qz-faint" style={{ margin: 0 }}>Не короче 8 символов, не из общеизвестных и не совпадает с почтой.</p>
        {err && <p className="qga-error" role="alert">{err}</p>}
        <button type="submit" className="qz-btn is-primary is-block" disabled={busy || !cur || !next}>{busy ? 'Меняем…' : 'Сменить пароль'}</button>
      </form>

      <section className="qz-card qz-stack">
        <h3 className="qz-h3 qz-row"><Server size={18} />Адрес сервера</h3>
        <input className="qz-input" type="url" value={server} onChange={(e) => setSrv(e.target.value)} aria-label="Адрес сервера" />
        <div className="qga-actions">
          <button type="button" className="qz-btn is-sm is-ghost" onClick={() => setSrv(DEFAULT_SERVER)}>По умолчанию</button>
          <button type="button" className="qz-btn is-sm" disabled={server.replace(/\/+$/, '') === getServer()} onClick={saveServer}>Сохранить</button>
        </div>
      </section>

      <button type="button" className="qz-btn is-danger is-block" onClick={onLogout}><LogOut size={18} />Выйти из аккаунта</button>
    </div>
  );
}
