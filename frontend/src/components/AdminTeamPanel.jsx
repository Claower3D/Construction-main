import React, { useCallback, useEffect, useState } from 'react';
import { authHeaders, jsonAuthHeaders } from '../services/platformUtils';
import './AdminTeamPanel.css';

// Панель администратора → «Пользователи»: настоящие данные сервера.
// Администратор заводит фирму и её работников. Пароль работнику не назначается: человек сам
// придумывает его при первом входе (на сайте или в приложении) со своим логином.

const ROLES = [
  { key: 'executor', label: 'Исполнитель (мастер)' },
  { key: 'engineer', label: 'Инженер' },
  { key: 'engineer_nocrm', label: 'Инженер без CRM' },
  { key: 'company', label: 'Подрядчик (фирма)' },
  { key: 'manager', label: 'Менеджер' },
  { key: 'customer', label: 'Заказчик' },
];
const ROLE_RU = { ...Object.fromEntries(ROLES.map((r) => [r.key, r.label])), admin: 'Администратор' };
const COMPANY_TYPES = ['Подрядчик', 'Субподрядчик', 'Поставщик', 'Проектная организация', 'Заказчик'];
const EMPTY_USER = { name: '', email: '', role: 'executor', phone: '', city: '', companyId: '' };
const EMPTY_COMPANY = { name: '', bin: '', city: '', phone: '', director: '', type: 'Подрядчик' };

async function api(method, path, body) {
  const res = await fetch(path, { method, headers: body ? jsonAuthHeaders() : authHeaders(), body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch { /* пустой ответ */ }
  if (!res.ok) throw new Error((data && data.error) || `сервер ответил ${res.status}`);
  return data;
}

export default function AdminTeamPanel() {
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState(null); // { title, text }
  const [busy, setBusy] = useState(false);
  const [userForm, setUserForm] = useState(null);
  const [companyForm, setCompanyForm] = useState(null);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ limit: '200' });
      if (q.trim()) params.set('q', q.trim());
      if (role) params.set('role', role);
      const [c, u] = await Promise.all([api('GET', '/api/v1/admin/companies'), api('GET', `/api/v1/admin/users?${params}`)]);
      setCompanies(c.items || []);
      setUsers(u.items || []);
      setTotal(u.total || 0);
      setError('');
    } catch (e) {
      setError(`Не удалось загрузить данные: ${e.message}`);
    }
  }, [q, role]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const saveCompany = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const c = await api('POST', '/api/v1/admin/companies', companyForm);
      setCompanyForm(null);
      setNote({ title: `Фирма «${c.name}» добавлена`, text: 'Теперь можно добавить в неё работников — кнопка «Добавить работника».' });
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const saveUser = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = await api('POST', '/api/v1/admin/users', userForm);
      setUserForm(null);
      setNote({
        title: `${u.name} добавлен(а)`,
        text: `Логин для входа: ${u.email}. Пароль назначать не нужно — при первом входе на сайте или в приложении человек сам придумает пароль (не короче 8 символов) и введёт его вместе с этим логином.`,
      });
      await load();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  const moveUser = async (u, companyId) => {
    try {
      await api('PATCH', `/api/v1/admin/users/${encodeURIComponent(u.id)}`, { companyId });
      await load();
    } catch (err) { setError(err.message); }
  };

  const field = (form, set, name, label, props = {}) => (
    <label className="atp-field">
      <span>{label}</span>
      <input value={form[name]} onChange={(e) => set({ ...form, [name]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="admin-tab-content atp">
      {error && <div className="atp-alert atp-alert--error" role="alert">{error} <button type="button" onClick={() => setError('')} aria-label="Скрыть">✕</button></div>}
      {note && <div className="atp-alert atp-alert--ok" role="status"><div><strong>{note.title}</strong><div>{note.text}</div></div><button type="button" onClick={() => setNote(null)} aria-label="Скрыть">✕</button></div>}

      <section className="atp-section">
        <div className="atp-head">
          <h3>🏢 Фирмы <span className="atp-count">{companies.length}</span></h3>
          <button type="button" className="atp-btn atp-btn--gold" onClick={() => { setCompanyForm({ ...EMPTY_COMPANY }); setUserForm(null); }}>+ Добавить фирму</button>
        </div>
        {companyForm && (
          <form className="atp-form" onSubmit={saveCompany}>
            {field(companyForm, setCompanyForm, 'name', 'Название фирмы *', { required: true, placeholder: 'ТОО «…»', autoFocus: true })}
            {field(companyForm, setCompanyForm, 'bin', 'БИН (12 цифр)', { inputMode: 'numeric', maxLength: 12 })}
            {field(companyForm, setCompanyForm, 'city', 'Город', { placeholder: 'Астана' })}
            {field(companyForm, setCompanyForm, 'phone', 'Телефон', { placeholder: '+7 701 000 00 00' })}
            {field(companyForm, setCompanyForm, 'director', 'Руководитель')}
            <label className="atp-field">
              <span>Тип</span>
              <select value={companyForm.type} onChange={(e) => setCompanyForm({ ...companyForm, type: e.target.value })}>
                {COMPANY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <div className="atp-form-actions">
              <button type="button" className="atp-btn" onClick={() => setCompanyForm(null)}>Отмена</button>
              <button type="submit" className="atp-btn atp-btn--gold" disabled={busy}>Сохранить фирму</button>
            </div>
          </form>
        )}
        {companies.length === 0 ? (
          <div className="atp-empty">Фирм пока нет. Добавьте первую — потом в неё можно будет добавить работников.</div>
        ) : (
          <div className="atp-companies">
            {companies.map((c) => (
              <div className="atp-company" key={c.id}>
                <div className="atp-company-name">{c.name}</div>
                <div className="atp-company-sub">{[c.type, c.city, c.bin && `БИН ${c.bin}`].filter(Boolean).join(' · ') || '—'}</div>
                <div className="atp-company-foot">
                  <span>👷 {c.people} чел.</span>
                  <button type="button" className="atp-link" onClick={() => { setUserForm({ ...EMPTY_USER, companyId: c.id, city: c.city || '' }); setCompanyForm(null); }}>+ работник</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="atp-section">
        <div className="atp-head">
          <h3>👥 Пользователи <span className="atp-count">{total}</span></h3>
          <div className="atp-tools">
            <input className="atp-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск: ФИО, логин, телефон, фирма" aria-label="Поиск пользователя" />
            <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Роль">
              <option value="">Все роли</option>
              {[...ROLES, { key: 'admin', label: 'Администратор' }].map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
            </select>
            <button type="button" className="atp-btn atp-btn--gold" onClick={() => { setUserForm({ ...EMPTY_USER }); setCompanyForm(null); }}>+ Добавить работника</button>
          </div>
        </div>
        {userForm && (
          <form className="atp-form" onSubmit={saveUser}>
            {field(userForm, setUserForm, 'name', 'ФИО *', { required: true, autoFocus: true })}
            {field(userForm, setUserForm, 'email', 'Логин или email *', { required: true, placeholder: 'ivan.master или ivan@mail.kz', autoCapitalize: 'none' })}
            <label className="atp-field">
              <span>Роль *</span>
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                {ROLES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </select>
            </label>
            <label className="atp-field">
              <span>Фирма</span>
              <select value={userForm.companyId} onChange={(e) => setUserForm({ ...userForm, companyId: e.target.value })}>
                <option value="">Без фирмы (одиночка)</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            {field(userForm, setUserForm, 'phone', 'Телефон', { placeholder: '+7 701 000 00 00' })}
            {field(userForm, setUserForm, 'city', 'Город')}
            <div className="atp-form-hint">Короткий логин без «@» сервер дополнит до адреса @qazgost.kz. Пароль человек придумает сам при первом входе.</div>
            <div className="atp-form-actions">
              <button type="button" className="atp-btn" onClick={() => setUserForm(null)}>Отмена</button>
              <button type="submit" className="atp-btn atp-btn--gold" disabled={busy}>Добавить работника</button>
            </div>
          </form>
        )}
        <div className="atp-table-wrap">
          <table className="atp-table">
            <thead>
              <tr><th>ФИО</th><th>Логин</th><th>Роль</th><th>Фирма</th><th>Вход</th></tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={5} className="atp-empty">Никого не найдено.</td></tr>}
              {users.map((u) => (
                <tr key={u.id}>
                  <td><strong>{u.name || '—'}</strong>{u.phone ? <div className="atp-sub">{u.phone}</div> : null}</td>
                  <td>{u.email}</td>
                  <td>{ROLE_RU[u.role] || u.role}</td>
                  <td>
                    <select value={u.companyId || ''} onChange={(e) => moveUser(u, e.target.value)} aria-label={`Фирма: ${u.name || u.email}`}>
                      <option value="">Без фирмы</option>
                      {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </td>
                  <td>{u.invited ? <span className="atp-pill atp-pill--wait">ещё не входил</span> : <span className="atp-pill">активен</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > users.length && <div className="atp-sub">Показаны первые {users.length} из {total} — уточните поиск.</div>}
      </section>
    </div>
  );
}
