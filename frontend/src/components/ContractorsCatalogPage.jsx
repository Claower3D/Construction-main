import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import './marketplace-refresh.css';
import './ContractorsCatalogPage.css';
import { createPlatformOrder } from '../services/orderSyncService';
import { freezeEscrow } from '../services/walletEngine';

/*
 * Каталог подрядчиков.
 * Источник — публичный GET /api/v1/contractors?city=&q= → { total, items: [{ id, name, companyId,
 * companyName, companyType, companyPhone, companyEmail, foreman, size, skills[], city, rating, status }] }.
 * Город фильтруется на сервере; поиск по словам («бетон караганда») и навыки — на клиенте
 * (серверный q ищет одну подстроку и не учитывает город). Демо-анкеты — только если API недоступен,
 * с явной пометкой.
 */

const BOOKING_DEPOSIT = 150000;

const AVATAR_TONES = ['#7c3aed', '#0e7490', '#7c3aed', '#047857', '#b45309', '#be123c'];

function capitalize(s) {
  const t = String(s || '').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
}

function initialsOf(name) {
  const words = String(name || '')
    .replace(/[«»"'()№—–-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(ТОО|ИП|АО|ООО|\d+)$/i.test(w));
  return (words[0]?.[0] || '?').toUpperCase() + (words[1]?.[0] || '').toUpperCase();
}

function toneOf(key) {
  let h = 0;
  for (const ch of String(key)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits.replace(/\D/g, '').length >= 10 ? `tel:${digits.startsWith('+') ? digits : `+${digits}`}` : null;
}

function mailHref(email, subject) {
  const e = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return null;
  return `mailto:${e}?subject=${encodeURIComponent(subject)}`;
}

function peopleLabel(n) {
  const v = Math.abs(Number(n)) % 100;
  const d = v % 10;
  if (v > 10 && v < 20) return `${n} человек`;
  if (d === 1) return `${n} человек`;
  if (d >= 2 && d <= 4) return `${n} человека`;
  return `${n} человек`;
}

function normalizeApiItem(it) {
  const skills = (Array.isArray(it.skills) ? it.skills : [])
    .map(capitalize)
    .filter(Boolean);
  return {
    id: String(it.id),
    source: 'api',
    name: it.name || 'Бригада',
    company: it.companyName || '',
    companyId: it.companyId || '',
    companyType: it.companyType || '',
    foreman: it.foreman || '',
    size: Number(it.size) > 0 ? Number(it.size) : null,
    skills,
    city: it.city || '',
    rating: Number(it.rating) || 0,
    available: (it.status || 'active') === 'active',
    phone: it.companyPhone || '',
    email: it.companyEmail || '',
    reviewsCount: null,
    description: '',
  };
}

// ── Демо-анкеты: показываются только когда сервер каталога недоступен ──
const DEMO_CONTRACTORS = [
  { id: 'demo-medina', name: 'ИП «Медина» (ЖБИ и люки)', company: 'ИП «Медина»', companyType: 'Поставщик ЖБИ', foreman: 'Манарбек', skills: ['Завод ЖБИ', 'Бетон и ЖБИ'], city: 'Караганда', rating: 4.95, reviewsCount: 29, available: true, phone: '+7 700 370 55 99', email: 'ip.medina@mail.ru', description: 'Кольца колодцев КС, плиты 1ПП/2ПП, днища ПН, полимерные и чугунно-бетонные люки. Отгрузка по Караганде.' },
  { id: 'demo-brigada-astana', name: 'БригадаАстана', company: 'БригадаАстана', companyType: 'Компания', foreman: '', skills: ['Сантехник', 'Отопление и вентиляция'], city: 'Шымкент', rating: 4.9, reviewsCount: 42, available: false, phone: '+7 701 555 01 11', email: '', description: 'Сантехника и отопление, 8 лет опыта.' },
  { id: 'demo-master', name: 'Мастер на все руки', company: 'Частный мастер', companyType: 'Мастер', foreman: '', skills: ['Сантехник', 'Маляр'], city: 'Астана', rating: 4.7, reviewsCount: 18, available: true, phone: '+7 702 444 22 33', email: '', description: 'Мелкий ремонт, выезд на замер в день обращения.' },
  { id: 'demo-yuzhstroy', name: 'ЮжСтрой', company: 'ЮжСтрой', companyType: 'Компания', foreman: '', skills: ['Отделка под ключ', 'Отопление и вентиляция', 'Дизайнер интерьера'], city: 'Алматы', rating: 4.6, reviewsCount: 89, available: false, phone: '+7 777 123 45 67', email: '', description: 'Полный цикл отделочных работ, 17 лет опыта.' },
  { id: 'demo-tehnostroy', name: 'ТехноСтрой', company: 'ТехноСтрой', companyType: 'Компания', foreman: '', skills: ['Фасадчик', 'Благоустройство', 'Электрик'], city: 'Алматы', rating: 4.4, reviewsCount: 31, available: true, phone: '+7 705 888 99 00', email: '', description: 'Фасады, благоустройство и электромонтаж. Гарантия 3 года.' },
  { id: 'demo-alibek', name: 'Алибек Нурланов', company: 'Частный мастер', companyType: 'Мастер', foreman: '', skills: ['Демонтажник', 'Генподрядчик', 'Сантехник'], city: 'Астана', rating: 4.3, reviewsCount: 15, available: false, phone: '+7 700 333 22 11', email: '', description: 'Демонтаж и монтаж, 11 лет опыта.' },
  { id: 'demo-serik', name: 'Серик Каримов', company: 'Частный мастер', companyType: 'Мастер', foreman: '', skills: ['Напольные покрытия', 'Электрик'], city: 'Актобе', rating: 4.3, reviewsCount: 24, available: false, phone: '+7 771 999 88 77', email: '', description: 'Электрика и напольные покрытия, 9 лет опыта.' },
  { id: 'demo-qsg', name: 'ТОО «QazStroyGroup»', company: 'ТОО «QazStroyGroup»', companyType: 'Генподрядчик', foreman: '', skills: ['Генподрядчик', 'Бетонщик', 'Кровельщик'], city: 'Караганда', rating: 5.0, reviewsCount: 112, available: true, phone: '+7 7212 50 60 70', email: '', description: 'Жилые и коммерческие здания под ключ.' },
  { id: 'demo-erzhan', name: 'Ержан, сварочные работы', company: 'Частный мастер', companyType: 'Мастер', foreman: '', skills: ['Сварщик', 'Заборы и ворота'], city: 'Алматы', rating: 4.8, reviewsCount: 37, available: true, phone: '+7 708 777 66 55', email: '', description: 'Аттестованный сварщик: металлоконструкции, навесы, ворота.' },
].map((d) => ({ size: null, companyId: '', ...d, source: 'demo' }));

const SORTS = {
  rating_desc: { label: 'Лучший рейтинг', fn: (a, b) => b.rating - a.rating || (b.size || 0) - (a.size || 0) },
  rating_asc: { label: 'Низкий рейтинг', fn: (a, b) => a.rating - b.rating },
  size_desc: { label: 'Крупные бригады', fn: (a, b) => (b.size || 0) - (a.size || 0) || b.rating - a.rating, needs: 'size' },
  reviews_desc: { label: 'Больше отзывов', fn: (a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0), needs: 'reviews' },
};

function Stars({ value }) {
  const full = Math.round(Number(value) || 0);
  return (
    <span className="cc-stars" aria-hidden="true">
      {'★'.repeat(full)}<span className="cc-stars-empty">{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  );
}

function ContactLinks({ c, compact = false }) {
  const tel = telHref(c.phone);
  const mail = mailHref(c.email, `Заявка через QazGost AI — ${c.name}`);
  if (!tel && !mail) return <span className="cc-contact-missing">Контакты не указаны</span>;
  return (
    <div className={`cc-contact-actions${compact ? ' is-compact' : ''}`} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
      {tel && (
        <a className="cc-call-btn" href={tel} aria-label={`Позвонить: ${c.company || c.name}, ${c.phone}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" /></svg>
          <span>{compact ? 'Позвонить' : c.phone}</span>
        </a>
      )}
      {mail && (
        <a className="cc-mail-btn" href={mail} aria-label={`Написать на почту: ${c.email}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm8 7.2L5 7.6V17h14V7.6l-7 4.6Zm-6.2-5.2L12 11l6.2-4H5.8Z" /></svg>
          <span>{compact ? 'Написать' : c.email}</span>
        </a>
      )}
    </div>
  );
}

export default function ContractorsCatalogPage({ onBack }) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ok | demo
  const [loadError, setLoadError] = useState('');
  const [cities, setCities] = useState([]);
  const [city, setCity] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [skill, setSkill] = useState('all');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortOrder, setSortOrder] = useState('rating_desc');

  const [selected, setSelected] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ── Загрузка из API (город — серверный фильтр) ──
  useEffect(() => {
    const ctrl = new AbortController();
    setStatus((s) => (s === 'demo' ? 'demo' : 'loading'));
    const qs = new URLSearchParams();
    if (city !== 'all') qs.set('city', city);
    const url = `/api/v1/contractors${qs.toString() ? `?${qs}` : ''}`;
    fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || !Array.isArray(data.items)) throw new Error('неожиданный ответ сервера');
        const list = data.items.map(normalizeApiItem);
        setItems(list);
        setStatus('ok');
        setLoadError('');
        if (city === 'all') {
          setCities([...new Set(list.map((c) => c.city).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru')));
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        console.warn('[contractors] API недоступен:', err.message);
        setItems(DEMO_CONTRACTORS);
        setCities([...new Set(DEMO_CONTRACTORS.map((c) => c.city))].sort((a, b) => a.localeCompare(b, 'ru')));
        setStatus('demo');
        setLoadError(err.message);
      });
    return () => ctrl.abort();
  }, [city, reloadKey]);

  const isDemo = status === 'demo';

  // Навыки из данных (без дублей, по частоте)
  const skillOptions = useMemo(() => {
    const freq = new Map();
    items.forEach((c) => c.skills.forEach((s) => {
      const k = s.toLowerCase();
      const prev = freq.get(k);
      freq.set(k, { label: prev?.label || s, n: (prev?.n || 0) + 1 });
    }));
    return [...freq.entries()]
      .sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label, 'ru'))
      .map(([key, v]) => ({ key, label: v.label, n: v.n }));
  }, [items]);

  useEffect(() => {
    if (skill !== 'all' && !skillOptions.some((s) => s.key === skill)) setSkill('all');
  }, [skillOptions, skill]);

  const hasSize = items.some((c) => c.size);
  const hasReviews = items.some((c) => c.reviewsCount != null);
  const sortOptions = Object.entries(SORTS).filter(([, s]) => !s.needs || (s.needs === 'size' ? hasSize : hasReviews));
  useEffect(() => {
    if (!sortOptions.some(([k]) => k === sortOrder)) setSortOrder('rating_desc');
  }, [sortOptions, sortOrder]);

  const filtered = useMemo(() => {
    const words = debouncedQuery.split(/\s+/).filter(Boolean);
    const list = items.filter((c) => {
      if (isDemo && city !== 'all' && c.city !== city) return false;
      if (skill !== 'all' && !c.skills.some((s) => s.toLowerCase() === skill)) return false;
      if (availableOnly && !c.available) return false;
      if (words.length) {
        const hay = [c.name, c.company, c.companyType, c.foreman, c.city, c.description, ...c.skills].join(' ').toLowerCase();
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    });
    return [...list].sort((SORTS[sortOrder] || SORTS.rating_desc).fn);
  }, [items, isDemo, city, skill, availableOnly, debouncedQuery, sortOrder]);

  const summary = useMemo(() => {
    const companies = new Set(items.map((c) => c.companyId || c.company).filter(Boolean)).size;
    const rated = items.filter((c) => c.rating > 0);
    const avg = rated.length ? rated.reduce((s, c) => s + c.rating, 0) / rated.length : 0;
    return {
      total: items.length,
      available: items.filter((c) => c.available).length,
      companies,
      avg: avg ? avg.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 2 }) : '—',
    };
  }, [items]);

  const resetFilters = () => {
    setSearchQuery('');
    setSkill('all');
    setAvailableOnly(false);
    setSortOrder('rating_desc');
    setCity('all');
  };

  const openCard = (c) => setSelected(c);

  // Esc закрывает модальные окна
  useEffect(() => {
    if (!selected && !showAddModal) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') { setSelected(null); setShowAddModal(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, showAddModal]);

  const inviteToProject = (c) => {
    const specName = c.skills.join(', ') || 'Строительные работы';
    const escrow = freezeEscrow(BOOKING_DEPOSIT, `Бронь подрядчика ${c.name}`);
    if (!escrow.ok) {
      showToast(`Недостаточно средств для депозита брони ${BOOKING_DEPOSIT.toLocaleString('ru-RU')} ₸ (доступно ${Number(escrow.newBalance || 0).toLocaleString('ru-RU')} ₸). Пополните кошелёк.`);
      return;
    }
    const order = createPlatformOrder({
      title: `Подряд: ${c.name} (${specName})`,
      category: c.skills[0] || 'Строительные работы',
      amount: BOOKING_DEPOSIT,
      budget: `${BOOKING_DEPOSIT.toLocaleString('ru-RU')} ₸ (депозит брони)`,
      description: `Прямой вызов подрядчика: ${c.name}${c.company ? ` (${c.company})` : ''}. Город: ${c.city}. Телефон: ${c.phone || '—'}.${c.foreman ? ` Бригадир: ${c.foreman}.` : ''}`,
      type: 'contractor',
      status: 'new',
      assignedTo: c.company || c.name,
      assignedEngineer: 'Назначен Менеджер CRM',
      escrowTxId: escrow.txId,
      escrowAmount: BOOKING_DEPOSIT,
    });
    showToast(`Заявка ${order.id} отправлена: «${c.name}» и менеджер CRM получили уведомление.`);
    setSelected(null);
  };

  return (
    <div className="cc-container">
      {toastMessage && <div className="cc-toast" role="status">{toastMessage}</div>}

      <header className="cc-header-bar">
        <button className="cc-back-btn" onClick={onBack} aria-label="Вернуться назад">←</button>
        <div className="cc-header-title-wrap">
          <h1 className="cc-title">Каталог подрядчиков</h1>
          <p className="cc-header-subtitle">Бригады и компании, которые принимают заказы через QazGost. Звоните напрямую или бронируйте через эскроу.</p>
        </div>
        <button className="cc-btn-add-contractor" onClick={() => setShowAddModal(true)}>Добавить анкету</button>
      </header>

      <div className="cc-content">
        <dl className="cc-summary" aria-label="Сводка каталога">
          <div><dt>Бригад и мастеров</dt><dd>{status === 'loading' ? '…' : summary.total}</dd></div>
          <div><dt>Принимают заказы</dt><dd>{status === 'loading' ? '…' : summary.available}</dd></div>
          <div><dt>Компаний</dt><dd>{status === 'loading' ? '…' : summary.companies}</dd></div>
          <div><dt>Средний рейтинг</dt><dd>{status === 'loading' ? '…' : summary.avg}</dd></div>
        </dl>

        {isDemo && (
          <div className="mkt-notice mkt-notice--warn" role="status" data-testid="contractors-demo-notice">
            <span>Сервер каталога недоступен — показаны демо-анкеты. Контакты и рейтинги в них условные.</span>
            <button type="button" className="mkt-notice-btn" onClick={() => setReloadKey((k) => k + 1)}>Повторить</button>
          </div>
        )}

        <div className="cc-toolbar">
          <div className="cc-search-box">
            <svg className="cc-search-icon" width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.2 4.2-1.4 1.4-4.2-4.2A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" /></svg>
            <label htmlFor="cc-search" className="qg-visually-hidden">Поиск подрядчиков</label>
            <input
              id="cc-search"
              type="search"
              aria-label="Поиск подрядчиков"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Название, навык или бригадир, например «бетон»"
            />
            {searchQuery && (
              <button className="cc-clear-search" aria-label="Очистить поиск" onClick={() => setSearchQuery('')}>✕</button>
            )}
          </div>

          <label className="cc-select-field">
            <span>Город</span>
            <select aria-label="Город" value={city} onChange={(e) => setCity(e.target.value)}>
              <option value="all">Все города</option>
              {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>

          <label className="cc-select-field">
            <span>Порядок</span>
            <select aria-label="Сортировка подрядчиков" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
              {sortOptions.map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </label>
        </div>

        <div className="cc-skills-row">
          <div className="cc-chips-scroll" role="group" aria-label="Навыки">
            <button
              className={`cc-chip ${skill === 'all' ? 'active' : ''}`}
              aria-pressed={skill === 'all'}
              onClick={() => setSkill('all')}
            >
              Все навыки
            </button>
            {skillOptions.map((s) => (
              <button
                key={s.key}
                className={`cc-chip ${skill === s.key ? 'active' : ''}`}
                aria-pressed={skill === s.key}
                onClick={() => setSkill(skill === s.key ? 'all' : s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            className={`cc-filter-btn ${availableOnly ? 'active' : ''}`}
            aria-pressed={availableOnly}
            onClick={() => setAvailableOnly((v) => !v)}
          >
            Только свободные
          </button>
        </div>

        <p className="cc-results-count" aria-live="polite">
          {status === 'loading' ? 'Загружаем каталог…' : <>Найдено: <strong>{filtered.length}</strong>{city !== 'all' ? ` в городе ${city}` : ''}</>}
        </p>

        {status === 'loading' && items.length === 0 ? (
          <div className="cc-cards-grid" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="mkt-skeleton-card cc-skeleton">
                <div className="mkt-skel mkt-skel-line" style={{ marginTop: 18 }} />
                <div className="mkt-skel mkt-skel-line short" />
                <div className="mkt-skel mkt-skel-line" />
                <div className="mkt-skel mkt-skel-price" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mkt-empty cc-empty-state">
            <h3>Никого не нашли</h3>
            <p>{city !== 'all' ? `В городе ${city} нет подходящих бригад. ` : ''}Уберите часть фильтров или поищите по другому навыку.</p>
            <button className="mkt-btn-secondary" onClick={resetFilters}>Сбросить фильтры</button>
          </div>
        ) : (
          <ul className="cc-cards-grid" role="list">
            {filtered.map((c) => (
              <li key={c.id} className="cc-card-item">
                <article className={`cc-card ${c.source === 'api' ? 'is-api' : 'is-demo'}`} onClick={() => openCard(c)}>
                  <div className="cc-card-top">
                    <span className="cc-avatar" style={{ background: toneOf(c.companyId || c.name) }} aria-hidden="true">{initialsOf(c.name)}</span>
                    <div className="cc-title-info">
                      <h3 className="cc-card-title">
                        {/* «растянутая» кнопка: вся карточка кликабельна, а ссылки «Позвонить/Написать» остаются отдельными */}
                        <button
                          type="button"
                          className="cc-card-open"
                          onClick={(e) => { e.stopPropagation(); openCard(c); }}
                          aria-label={`${c.name}${c.company ? `, ${c.company}` : ''}: подробнее`}
                        >
                          {c.name}
                        </button>
                      </h3>
                      <p className="cc-card-company">
                        {c.company && c.company !== c.name ? <span>{c.company}</span> : null}
                        {c.companyType ? <span className="cc-company-type">{c.companyType}</span> : null}
                      </p>
                    </div>
                    <span className="cc-rating" title={`Рейтинг ${c.rating}`}>
                      <span aria-hidden="true">★</span> {c.rating ? c.rating.toLocaleString('ru-RU') : '—'}
                      {c.reviewsCount != null && <span className="cc-reviews-count">({c.reviewsCount})</span>}
                    </span>
                  </div>

                  {c.skills.length > 0 && (
                    <ul className="cc-tags-wrap" aria-label="Навыки">
                      {c.skills.map((s) => <li key={s} className="cc-tag-pill">{s}</li>)}
                    </ul>
                  )}

                  {c.description && <p className="cc-card-desc">{c.description}</p>}

                  <dl className="cc-facts">
                    <div><dt>Город</dt><dd>{c.city || '—'}</dd></div>
                    {c.foreman && <div><dt>Бригадир</dt><dd>{c.foreman}</dd></div>}
                    {c.size && <div><dt>Состав</dt><dd>{peopleLabel(c.size)}</dd></div>}
                  </dl>

                  <div className="cc-card-footer">
                    <span className={`qg-chip ${c.available ? 'qg-chip--ok' : 'qg-chip--danger'}`}>
                      {c.available ? 'Принимает заказы' : 'Сейчас занята'}
                    </span>
                    {c.source === 'demo' && <span className="qg-chip qg-chip--warn">Демо</span>}
                  </div>

                  <ContactLinks c={c} compact />
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="cc-modal-overlay" onClick={() => setSelected(null)}>
          <div className="cc-modal-card" role="dialog" aria-modal="true" aria-labelledby="cc-modal-title" onClick={(e) => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => setSelected(null)} aria-label="Закрыть">✕</button>

            <div className="cc-modal-header">
              <span className="cc-avatar large" style={{ background: toneOf(selected.companyId || selected.name) }} aria-hidden="true">{initialsOf(selected.name)}</span>
              <div className="cc-modal-header-info">
                <h2 id="cc-modal-title">{selected.name}</h2>
                <p className="cc-card-company">
                  {[selected.company !== selected.name ? selected.company : null, selected.companyType, selected.city].filter(Boolean).join(', ')}
                </p>
                <div className="cc-modal-badges">
                  <span className={`qg-chip ${selected.available ? 'qg-chip--ok' : 'qg-chip--danger'}`}>{selected.available ? 'Принимает заказы' : 'Сейчас занята'}</span>
                  <span className="qg-chip"><Stars value={selected.rating} />&nbsp;{selected.rating ? selected.rating.toLocaleString('ru-RU') : '—'}{selected.reviewsCount != null ? `, отзывов: ${selected.reviewsCount}` : ''}</span>
                  {selected.source === 'demo' && <span className="qg-chip qg-chip--warn">Демо-анкета</span>}
                </div>
              </div>
            </div>

            <div className="cc-modal-body">
              {selected.description && (
                <section className="cc-modal-section">
                  <h3>О подрядчике</h3>
                  <p>{selected.description}</p>
                </section>
              )}

              {selected.skills.length > 0 && (
                <section className="cc-modal-section">
                  <h3>Навыки</h3>
                  <ul className="cc-tags-wrap">
                    {selected.skills.map((s) => <li key={s} className="cc-tag-pill">{s}</li>)}
                  </ul>
                </section>
              )}

              <section className="cc-modal-section">
                <h3>Бригада</h3>
                <dl className="cc-facts is-modal">
                  <div><dt>Бригадир</dt><dd>{selected.foreman || '—'}</dd></div>
                  <div><dt>Состав</dt><dd>{selected.size ? peopleLabel(selected.size) : '—'}</dd></div>
                  <div><dt>Город</dt><dd>{selected.city || '—'}</dd></div>
                  <div><dt>Компания</dt><dd>{selected.company || '—'}</dd></div>
                </dl>
              </section>

              <section className="cc-modal-section">
                <h3>Контакты компании</h3>
                <ContactLinks c={selected} />
              </section>
            </div>

            <div className="cc-modal-actions-bar">
              <button className="cc-btn-invite" onClick={() => inviteToProject(selected)} disabled={!selected.available}>
                Пригласить на проект
              </button>
              <p className="cc-modal-note">
                {selected.available
                  ? <>Бронь замораживает <span className="qg-price-tag">{BOOKING_DEPOSIT.toLocaleString('ru-RU')} ₸</span> в эскроу вашего кошелька до начала работ.</>
                  : 'Бригада сейчас занята — позвоните, чтобы договориться о сроках.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="cc-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="cc-modal-card" role="dialog" aria-modal="true" aria-labelledby="cc-add-title" onClick={(e) => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => setShowAddModal(false)} aria-label="Закрыть">✕</button>
            <h2 id="cc-add-title" className="cc-add-title">Добавить анкету</h2>
            <p className="cc-modal-sub-text">Анкету проверит модератор, после этого она появится в каталоге.</p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowAddModal(false);
                showToast('Анкета отправлена на модерацию.');
              }}
            >
              <div className="cc-form-group">
                <label htmlFor="cc-add-name">Имя мастера или название компании</label>
                <input id="cc-add-name" type="text" required placeholder="ТОО «КазСтрой» или Арман Касымов" className="cc-input" />
              </div>
              <div className="cc-form-group">
                <label htmlFor="cc-add-type">Тип</label>
                <select id="cc-add-type" className="cc-input">
                  <option value="master">Частный мастер</option>
                  <option value="company">Компания (ТОО / ИП)</option>
                </select>
              </div>
              <div className="cc-form-group">
                <label htmlFor="cc-add-skill">Основные навыки</label>
                <input id="cc-add-skill" type="text" required placeholder="Бетон, опалубка, арматура" className="cc-input" />
              </div>
              <div className="cc-form-group">
                <label htmlFor="cc-add-phone">Телефон</label>
                <input id="cc-add-phone" type="tel" required placeholder="+7 7XX XXX XX XX" className="cc-input" autoComplete="tel" />
              </div>
              <button type="submit" className="cc-btn-submit-form">Отправить на модерацию</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
