// QazGost mobile — shared offline-first sync core.
// Identical copy lives in mobile-manager, mobile-engineer and mobile-executor (src/api/syncCore.js).
//
// Record flags (local only, never sent to the server):
//   _v      schema version
//   _dirty  local change not yet confirmed by the server
//   _synced record has been seen on / accepted by the server at least once
//   _base   server updatedAt the local copy was last reconciled with
//   _rev    local edit counter (detects edits made while a push is in flight)
//   _demo   demo record: shown offline only, never pushed

export const SCHEMA_VERSION = 2;
const SERVER_KEYS = ['id', 'leadNum', 'title', 'client', 'contractor', 'phone', 'location', 'budget', 'status',
  'role', 'type', 'date', 'time', 'description', 'notes', 'createdBy', 'updated_at'];

// ── Dates (always local time — Kazakhstan is UTC+5) ──
const pad2 = (n) => String(n).padStart(2, '0');

export function localDateISO(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseLocalDate(str) {
  const [y, m, d] = String(str || '').split('-').map(Number);
  if (!y) return new Date();
  return new Date(y, (m || 1) - 1, d || 1);
}

export function addDaysISO(str, delta) {
  const d = parseLocalDate(str);
  d.setDate(d.getDate() + delta);
  return localDateISO(d);
}

export function nowTimeLabel(d = new Date()) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function nowNoteLabel(d = new Date()) {
  return `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)} ${nowTimeLabel(d)}`;
}

// ── Ids ──
export function genId(prefix = 'm') {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function genLeadNum() {
  return String(100 + Math.floor(Math.random() * 900));
}

// ── Budget ──
export function parseBudget(b) {
  if (typeof b === 'number') return Number.isFinite(b) ? Math.round(b) : 0;
  if (typeof b !== 'string') return 0;
  const s = b.replace(/[\s  ]/g, '').replace(/[^\d.,-]/g, '');
  if (!s) return 0;
  // single decimal separator with 1–2 fraction digits → decimal value
  const dec = s.match(/^(-?\d+)[.,](\d{1,2})$/);
  if (dec) return Math.round(parseFloat(`${dec[1]}.${dec[2]}`));
  // otherwise '.' and ',' are thousand separators
  const n = parseInt(s.replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

export function formatBudget(n) {
  const v = parseBudget(n);
  return `${String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ₸`;
}

// ── Notes ──
export function normalizeNotes(notes, fallbackAuthor = '') {
  if (Array.isArray(notes)) {
    return notes
      .map((n) => {
        if (typeof n === 'string') return { text: n, time: '', author: fallbackAuthor };
        if (n && typeof n === 'object') {
          const o = { text: String(n.text || ''), time: String(n.time || ''), author: String(n.author || '') };
          if (n.at) o.at = String(n.at);
          return o;
        }
        return null;
      })
      .filter((n) => n && n.text.trim());
  }
  if (typeof notes === 'string' && notes.trim()) {
    const s = notes.trim();
    if (s.startsWith('[')) {
      try { return normalizeNotes(JSON.parse(s), fallbackAuthor); } catch (e) { /* plain text */ }
    }
    // legacy collapsed format "a | b"
    return s.split(' | ').filter((t) => t.trim()).map((text) => ({ text, time: '', author: fallbackAuthor }));
  }
  return [];
}

const noteKey = (n) => `${(n.text || '').trim()}|${n.author || ''}|${n.time || ''}`;

// Union of two note lists; notes only present in `extra` are put first (they are newer).
export function mergeNotes(primary = [], extra = []) {
  const keys = new Set(primary.map(noteKey));
  const added = extra.filter((n) => !keys.has(noteKey(n)));
  return [...added, ...primary];
}

export function makeNote(text, author) {
  const d = new Date();
  return { text, time: nowNoteLabel(d), author: author || '', at: d.toISOString() };
}

// ── Server <-> local mapping ──
function roleFromType(type) {
  if (type === 'work_stage') return 'executor';
  if (type === 'request_engineering') return 'engineer';
  return 'lead';
}

export function normalizeRemoteItem(item) {
  const client = item.contractor || item.client || item.clientName || '';
  const out = {
    id: String(item.id),
    leadNum: item.leadNum != null ? String(item.leadNum) : '',
    title: item.title || `Заявка #${item.id}`,
    client: client || 'Клиент',
    contractor: client,
    phone: item.phone || '',
    location: item.location || '',
    budget: parseBudget(item.budget),
    status: item.status || 'Новые',
    role: item.role || roleFromType(item.type),
    type: item.type || '',
    date: item.date || '',
    time: item.time || '',
    description: item.description || '',
    notes: normalizeNotes(item.notes, client || 'Менеджер'),
    createdBy: item.createdBy || '',
    updated_at: item.updatedAt || item.updated_at || item.createdAt || ''
  };
  if (item.priority) out.priority = item.priority;
  return out;
}

export function toServerPayload(deal, authorName = '') {
  // contractor may legitimately be '' on the server; do not write the display fallback «Клиент» back
  const client = String(deal.contractor != null ? deal.contractor : (deal.client || '')).trim();
  const role = deal.role || 'lead';
  return {
    id: String(deal.id),
    date: deal.date || localDateISO(),
    leadNum: deal.leadNum ? String(deal.leadNum) : '',
    title: deal.title || `Заявка (${client || 'клиент'})`,
    status: deal.status || 'Новые',
    type: deal.type || (role === 'executor' ? 'work_stage' : 'request_engineering'),
    role,
    time: deal.time || '',
    phone: deal.phone || '',
    contractor: client,
    location: deal.location || '',
    budget: formatBudget(deal.budget),
    description: deal.description || '',
    notes: normalizeNotes(deal.notes).map((n) => (n.at ? n : { text: n.text, time: n.time, author: n.author })),
    createdBy: deal.createdBy || authorName || ''
  };
}

// ── HTTP ──
export function authHeaders(token) {
  return typeof token === 'string' && token.startsWith('eyJ') ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchWithTimeout(url, opts = {}, ms = 8000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export function cleanServerUrl(url) {
  return String(url || '').trim().replace(/\/+$/, '');
}

function isQuotaError(e) {
  return !!e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014 || /quota/i.test(e.message || ''));
}

export const QUOTA_MESSAGE = 'Недостаточно памяти на устройстве: изменения не сохранены. Удалите старые фото из объектов и повторите.';

export function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (e) {
    return { ok: false, quota: isQuotaError(e), error: isQuotaError(e) ? QUOTA_MESSAGE : (e.message || 'Ошибка сохранения') };
  }
}

// ── Store ──
/**
 * cfg = {
 *   dealsKey, tombKey,
 *   demoFactory: () => [],          // demo records (shown offline only)
 *   getServerUrl: () => string,
 *   getToken: () => string|undefined,
 *   getAuthorName: () => string,
 *   localDefaults?: (rec) => rec    // add app-specific local fields to records coming from the server
 * }
 */
export function createSyncStore(cfg) {
  let inflight = null;

  function migrate(rec) {
    if (!rec || rec.id == null) return null;
    if (rec._v === SCHEMA_VERSION) return rec;
    // Legacy record (app <= 1.9): old versions re-pushed local-only items on every heartbeat,
    // so anything that is still missing on the server was deleted there → treat as server-owned.
    return {
      ...rec,
      id: String(rec.id),
      budget: parseBudget(rec.budget),
      notes: normalizeNotes(rec.notes),
      _v: SCHEMA_VERSION,
      _synced: true,
      _dirty: false,
      _rev: 0,
      _base: rec.updated_at || ''
    };
  }

  function isInitialized() {
    try { return localStorage.getItem(cfg.dealsKey) !== null; } catch (e) { return false; }
  }

  function load() {
    try {
      const raw = localStorage.getItem(cfg.dealsKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(migrate).filter(Boolean) : [];
    } catch (e) {
      return [];
    }
  }

  function save(list) {
    return safeSetItem(cfg.dealsKey, JSON.stringify(list));
  }

  function loadTombs() {
    try { return JSON.parse(localStorage.getItem(cfg.tombKey) || '{}') || {}; } catch (e) { return {}; }
  }

  function saveTombs(t) {
    safeSetItem(cfg.tombKey, JSON.stringify(t));
  }

  function pendingCount(list = load()) {
    const tombs = loadTombs();
    return list.filter((d) => d._dirty && !d._demo).length + Object.values(tombs).filter((t) => !t.confirmed).length;
  }

  function withDefaults(rec) {
    return cfg.localDefaults ? cfg.localDefaults(rec) : rec;
  }

  // Local mutations ------------------------------------------------------
  function add(deal) {
    const rec = {
      ...deal,
      id: String(deal.id || genId()),
      notes: normalizeNotes(deal.notes),
      budget: parseBudget(deal.budget),
      updated_at: new Date().toISOString(),
      _v: SCHEMA_VERSION,
      _dirty: true,
      _synced: false,
      _rev: 1,
      _base: ''
    };
    const list = [rec, ...load().filter((d) => !d._demo || deal._demo)];
    const res = save(list);
    return { ...res, list: res.ok ? list : load(), record: rec };
  }

  function edit(id, patchFn) {
    const list = load();
    const idx = list.findIndex((d) => String(d.id) === String(id));
    if (idx === -1) return { ok: false, error: 'Объект не найден', list };
    const cur = list[idx];
    const patched = patchFn({ ...cur }) || cur;
    list[idx] = {
      ...patched,
      updated_at: new Date().toISOString(),
      _dirty: cur._demo ? false : true,
      _rev: (cur._rev || 0) + 1
    };
    const res = save(list);
    return { ...res, list: res.ok ? list : load(), record: list[idx] };
  }

  function remove(id) {
    const list = load();
    const rec = list.find((d) => String(d.id) === String(id));
    const next = list.filter((d) => String(d.id) !== String(id));
    if (rec && rec._synced && !rec._demo) {
      const tombs = loadTombs();
      tombs[String(id)] = { at: Date.now(), confirmed: false };
      saveTombs(tombs);
    }
    const res = save(next);
    return { ...res, list: res.ok ? next : load() };
  }

  function loadDemo() {
    const demo = (cfg.demoFactory ? cfg.demoFactory() : []).map((d) => ({
      ...d, _v: SCHEMA_VERSION, _demo: true, _dirty: false, _synced: false, _rev: 0
    }));
    const keep = load().filter((d) => !d._demo);
    const list = [...keep, ...demo];
    save(list);
    return list;
  }

  // Merge -----------------------------------------------------------------
  function mergeOne(l, r) {
    if (!l._dirty) {
      return withDefaults({ ...l, ...r, notes: r.notes, _synced: true, _dirty: false, _base: r.updated_at });
    }
    const serverChanged = !!l._base && r.updated_at !== l._base;
    const localTime = Date.parse(l.updated_at) || 0;
    const remoteTime = Date.parse(r.updated_at) || 0;
    if (!serverChanged || localTime >= remoteTime) {
      // unsynced local edit is newer → local wins for every field, notes are united
      return { ...l, notes: mergeNotes(l.notes || [], r.notes || []), _synced: true, _dirty: true, _base: r.updated_at };
    }
    // server is newer → server fields win, local-only extras and local-only notes survive
    const notes = mergeNotes(r.notes || [], l.notes || []);
    const stillDirty = notes.length > (r.notes || []).length;
    return withDefaults({ ...l, ...r, notes, _synced: true, _dirty: stillDirty, _base: r.updated_at });
  }

  function mergeLists(local, remote, tombs) {
    const remoteById = new Map(remote.map((r) => [r.id, r]));
    const out = [];
    const seen = new Set();

    for (const l of local) {
      if (l._demo) continue; // demo data disappears as soon as the server answers
      const id = String(l.id);
      seen.add(id);
      if (tombs[id]) continue;
      const r = remoteById.get(id);
      if (!r) {
        // keep only records that still have to be pushed; synced+clean ones were deleted elsewhere
        if (l._dirty || !l._synced) out.push(l);
        continue;
      }
      out.push(mergeOne(l, r));
    }

    for (const r of remote) {
      if (seen.has(r.id)) continue;
      const t = tombs[r.id];
      if (t) {
        const rTime = Date.parse(r.updated_at) || 0;
        if (t.confirmed && rTime > t.at) {
          delete tombs[r.id]; // re-created / edited by someone after our delete
        } else {
          t.confirmed = false; // still on the server → retry DELETE
          continue;
        }
      }
      out.push(withDefaults({ ...r, _v: SCHEMA_VERSION, _synced: true, _dirty: false, _rev: 0, _base: r.updated_at }));
    }

    for (const id of Object.keys(tombs)) {
      if (!remoteById.has(id)) delete tombs[id]; // gone from the server → nothing left to delete
    }
    return out;
  }

  // Sync ------------------------------------------------------------------
  async function doSync() {
    const base = cleanServerUrl(cfg.getServerUrl());
    if (!base) return { success: false, error: 'Адрес сервера не указан', deals: load(), pendingCount: pendingCount() };
    const headers = { Accept: 'application/json', ...authHeaders(cfg.getToken && cfg.getToken()) };
    const started = Date.now();

    let remoteRaw;
    try {
      const res = await fetchWithTimeout(`${base}/api/v1/crm/events`, { method: 'GET', headers }, 8000);
      if (res.status === 401 || res.status === 403) {
        return { success: false, authRequired: true, error: 'Войдите в аккаунт заново — без входа сервер не отдаёт сделки', deals: load(), pendingCount: pendingCount() };
      }
      if (!res.ok) {
        return { success: false, error: `Сервер ответил HTTP ${res.status}`, deals: load(), pendingCount: pendingCount() };
      }
      const data = await res.json();
      remoteRaw = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : (Array.isArray(data.events) ? data.events : []));
    } catch (e) {
      return { success: false, error: e.name === 'AbortError' ? 'Таймаут соединения' : (e.message || 'Сбой сети'), deals: load(), pendingCount: pendingCount() };
    }
    const latencyMs = Date.now() - started;
    const remote = remoteRaw.filter((r) => r && r.id != null && r.id !== '').map(normalizeRemoteItem);

    // 1. merge against the CURRENT local state (re-read after the network round trip)
    const tombs = loadTombs();
    const merged = mergeLists(load(), remote, tombs);
    saveTombs(tombs);
    const saveRes = save(merged);
    const errors = [];
    if (!saveRes.ok) errors.push(saveRes.error);

    // 2. pending deletes
    for (const [id, t] of Object.entries(tombs)) {
      if (t.confirmed) continue;
      try {
        const res = await fetchWithTimeout(`${base}/api/v1/crm/events?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers }, 8000);
        if (res.ok || res.status === 404) t.confirmed = true;
        else if (res.status === 403) {
          t.confirmed = true; // удалять может только автор или менеджер — сделка вернётся при следующей синхронизации
          errors.push(`Удаление ${id}: удалить может только автор сделки или менеджер`);
        } else errors.push(`Удаление ${id}: HTTP ${res.status}`);
      } catch (e) {
        errors.push(`Удаление ${id}: ${e.message || 'сбой сети'}`);
      }
    }
    saveTombs(tombs);

    // 3. push only changed records
    let pushed = 0;
    let failed = 0;
    const toPush = load().filter((d) => d._dirty && !d._demo && !tombs[String(d.id)]);
    for (const d of toPush) {
      try {
        const res = await fetchWithTimeout(`${base}/api/v1/crm/events`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(toServerPayload(d, cfg.getAuthorName && cfg.getAuthorName()))
        }, 10000);
        if (res.status === 403) {
          // чужая заявка: сервер не примет изменения — не пытаемся отправлять их снова
          failed++;
          const fresh = load();
          const i = fresh.findIndex((x) => String(x.id) === String(d.id));
          if (i !== -1) { fresh[i] = { ...fresh[i], _dirty: false }; save(fresh); }
          errors.push(`«${d.title}»: это не ваша заявка, изменения не сохранены на сервере`);
          continue;
        }
        if (!res.ok) {
          failed++;
          const txt = await res.text().catch(() => '');
          errors.push(`«${d.title}»: HTTP ${res.status}${txt ? ' ' + txt.slice(0, 120) : ''}`);
          continue;
        }
        let ack = {};
        try { ack = await res.json(); } catch (e) { /* empty body */ }
        const fresh = load();
        const i = fresh.findIndex((x) => String(x.id) === String(d.id));
        if (i !== -1) {
          const serverTime = ack.updatedAt || ack.updated_at || '';
          if ((fresh[i]._rev || 0) === (d._rev || 0)) {
            fresh[i] = { ...fresh[i], _dirty: false, _synced: true, _base: serverTime || fresh[i]._base, updated_at: serverTime || fresh[i].updated_at };
          } else {
            fresh[i] = { ...fresh[i], _synced: true, _base: serverTime || fresh[i]._base }; // edited again meanwhile → stays dirty
          }
          const r = save(fresh);
          if (!r.ok) errors.push(r.error);
        }
        pushed++;
      } catch (e) {
        failed++;
        errors.push(`«${d.title}»: ${e.message || 'сбой сети'}`);
      }
    }

    const deals = load();
    return {
      success: true,
      latencyMs,
      pushed,
      failed,
      errors,
      deals,
      pendingCount: pendingCount(deals),
      lastSyncTime: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  }

  function sync() {
    if (!inflight) {
      inflight = doSync().finally(() => { inflight = null; });
    }
    return inflight;
  }

  return { load, save, isInitialized, add, edit, remove, loadDemo, sync, pendingCount, mergeLists, loadTombs };
}
