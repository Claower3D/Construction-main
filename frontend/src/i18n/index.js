// Переключение языка RU / KZ / EN.
//
// Тексты приложения написаны по-русски прямо в компонентах (сотни файлов), поэтому перевод
// сделан слоем поверх DOM: текстовые узлы и атрибуты (placeholder, title, aria-label, alt)
// подменяются по словарю (dict.js), оригинал запоминается и возвращается при выборе RU.
// Если React перерисовал текст, наблюдатель видит новую русскую фразу и переводит её снова.
// Структура DOM не меняется — только nodeValue и значения атрибутов, это безопасно для React.
// Фразы, которых нет в словаре, остаются по-русски: словарь расширяется по мере перевода разделов.
//
// Словарей два. dict.js — небольшой, с казахским и английским переводом, грузится всем.
// dict.en.js — полный английский, грузится отдельным файлом и только тем, кто смотрит сайт по-английски.
// Английская версия открывается сама по адресу qazgost.com (см. defaultLangForHost); «шапку» страницы
// (язык, заголовок вкладки, описание для поисковиков) под этот адрес подставляет сервер:
// go-backend/pkg/handlers/static.go. Проверка: npm run test:i18n.

import { useSyncExternalStore } from 'react';
import { DICT, PATTERNS } from './dict.js';

export const LANGS = [
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'kk', label: 'KZ', name: 'Қазақша' },
  { code: 'en', label: 'EN', name: 'English' },
];
const CODES = LANGS.map((l) => l.code);
const STORAGE_KEY = 'qazgost_lang';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

// Язык по умолчанию задаёт домен: qazgost.com открывается на английском, остальные — на русском.
// Выбор, который человек сделал переключателем, запоминается и важнее домена.
export function defaultLangForHost(host) {
  return /(^|\.)qazgost\.com$/i.test(String(host || '')) ? 'en' : 'ru';
}

let lang = 'ru';
try { lang = defaultLangForHost(window.location.hostname); } catch (e) { /* нет окна (тесты) — русский */ }
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (CODES.includes(saved)) lang = saved;
} catch (e) { /* хранилище недоступно — язык домена */ }

// Большой английский словарь (dict.en.js) грузится отдельным файлом и только тем, кто смотрит сайт
// на английском: русскоязычным посетителям он не нужен.
let pack = null;        // { EN: { фраза: перевод }, buckets: Map, misc: [] }
let packPromise = null;
const NUM = /\d+(?:[ \u00a0\u202f.,]\d+)*/g;
const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function buildPack(mod) {
  const buckets = new Map();
  const misc = [];
  for (const [src, en] of mod.EN_TEMPLATES || []) {
    // «Всего {a} работ на {n} ₸» → /^Всего (.+?) работ на (\d+…) ₸$/
    const order = [];
    const parts = src.split(/(\{[a-z]\}|\{n\})/);
    const re = new RegExp(`^${parts.map((part, i) => {
      if (part === '{n}') { order.push('n'); return '(\\d+(?:[ \\u00a0\\u202f.,]\\d+)*)'; }
      if (/^\{[a-z]\}$/.test(part)) {
        order.push(part[1]);
        // подстановка в самом конце фразы или вплотную к другой бывает пустой: «…отправлен{b}», «{a}{b}»
        const loose = i >= parts.length - 2 || parts[i + 1] === '' || (i > 0 && parts[i - 1] === '' && i > 1);
        return loose ? '(.*?)' : '(.+?)';
      }
      return escapeRe(part);
    }).join('')}${/\}$/.test(src) ? '' : '([.!?…]*)'}$`);
    // шаблон, который кончается словом, совпадает и с точкой в конце: «…целыми упаковками.»
    // «слабый» шаблон — в нём мало своих слов («Заказ {a}»): он может совпасть с чужой фразой случайно
    const own = src.replace(/\{[a-z]\}|\{n\}/g, '').replace(/[^A-Za-zА-Яа-яЁё]/g, '').length;
    const item = { re, en, order, tail: !/\}$/.test(src), len: src.length, weak: own < 12 };
    // второй вариант разбора: первая подстановка забирает как можно больше — для фраз вида
    // «{a} × {b} прохода», где в {a} уже есть свой знак «×»
    const first = re.source.indexOf('(.+?)');
    if (first >= 0 && re.source.indexOf('(.', first + 5) > 0) item.re2 = new RegExp(`${re.source.slice(0, first)}(.+)${re.source.slice(first + 5)}`);
    const head = src.split(/\{[a-z]\}|\{n\}/)[0];
    if (head.length >= 3) { const k = head.slice(0, 3); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(item); } else misc.push(item);
  }
  // длинные шаблоны раньше коротких: «Заказ {a} не сохранён на сервере: {b}» точнее, чем «Заказ {a}»
  const byLength = (x, y) => y.len - x.len;
  buckets.forEach((items) => items.sort(byLength));
  misc.sort(byLength);
  return { EN: mod.EN || {}, buckets, misc };
}

/** Догружает словарь выбранного языка. Для русского и казахского ничего не грузит. */
export function langReady() {
  if (lang !== 'en') return Promise.resolve();
  if (!packPromise) {
    packPromise = import('./dict.en.js')
      .then((mod) => { pack = buildPack(mod); cache.clear(); })
      .catch(() => { packPromise = null; }); // нет связи — останется базовый словарь, попробуем при следующем переключении
  }
  return packPromise;
}

const cache = new Map(); // строка → перевод или null (сбрасывается при смене языка)
const CYR = /[А-Яа-яЁё]/;

// Словарь dict.js местами хранит фразу со знаками по краям («Всего:», «📋 Меню»). Тот же перевод годится
// и для фразы без них, и для фразы с другими числами — такие ключи собираются один раз.
let coreDict = null;
function buildCoreDict() {
  coreDict = new Map();
  const strip = (x) => { const m = String(x).replace(/\s+/g, ' ').trim().match(EDGE); return (m ? m[2] : String(x)).trim(); };
  for (const [k, v] of Object.entries(DICT)) {
    if (!Array.isArray(v)) continue;
    const ck = strip(k);
    const cv = [v[0] == null ? null : strip(v[0]), v[1] == null ? null : strip(v[1])];
    if (ck && ck !== k && !DICT[ck] && !coreDict.has(ck)) coreDict.set(ck, cv);
    if (/\d/.test(ck)) {
      const count = (x) => (x == null ? -1 : (x.match(NUM) || []).length);
      const n = count(ck);
      const tk = ck.replace(NUM, '{n}');
      if (!coreDict.has(tk) && !DICT[tk]) coreDict.set(tk, cv.map((x) => (count(x) === n ? x.replace(NUM, '{n}') : null)));
    }
  }
}

/** Точное совпадение: фраза целиком есть в словаре (числа подставляются на свои места). */
function lookupExact(s) {
  if (!coreDict) buildCoreDict();
  const pick = (hit) => (hit ? (lang === 'kk' ? hit[0] : hit[1]) : null);
  let t = pick(DICT[s]) ?? pick(coreDict.get(s));
  if (t != null) return t;
  if (lang === 'en' && pack) { t = pack.EN[s]; if (t != null) return t; }
  if (/\d/.test(s)) {
    // «Найдено: 9 708» ищется как «Найдено: {n}», числа возвращаются на место по порядку
    const nums = [];
    const key = s.replace(NUM, (m) => { nums.push(m); return '{n}'; });
    t = (lang === 'en' && pack ? pack.EN[key] : null) ?? pick(DICT[key]) ?? pick(coreDict.get(key));
    if (t != null) { let i = 0; return t.replace(/\{n\}/g, () => nums[i++] ?? ''); }
  }
  return null;
}

/** Шаблоны английского словаря: «Заказ {a} завершён». */
function lookupPack(s) {
  if (lang !== 'en' || !pack) return null;
  let fallback = null;
  const list = pack.buckets.get(s.slice(0, 3));
  for (const group of [list, pack.misc]) {
    if (!group) continue;
    for (const p of group) for (const re of (p.re2 ? [p.re, p.re2] : [p.re])) {
      const m = s.match(re);
      if (!m) continue;
      const vals = {}; const nums = [];
      p.order.forEach((name, i) => { if (name === 'n') nums.push(m[i + 1]); else vals[name] = m[i + 1]; });
      // подставленные куски переводим отдельно
      const done = {}; let stray = false; let clean = true;
      for (const [name, v] of Object.entries(vals)) {
        const tv = CYR.test(v) ? subParts(v) : v;
        if (tv == null) {
          clean = false;
          // длинный русский кусок без перевода в «слабом» шаблоне значит, что шаблон совпал случайно
          // («Заказ {a}» с целым абзацем) — такую фразу лучше оставить как есть, чем перевести наполовину.
          // В шаблоне со своими словами («Отметить выполненной: {a}») длинное название — обычное дело
          if (p.weak && v.length > 80) { stray = true; break; }
        }
        done[name] = tv ?? v;
      }
      if (stray) continue;
      let ni = 0;
      const out = p.en.replace(/\{n\}/g, () => nums[ni++] ?? '').replace(/\{([a-z])\}/g, (all, name) => done[name] ?? '') + (p.tail ? m[m.length - 1] : '');
      // шаблон, в котором перевелись все куски, лучше того, где кусок остался русским (имя, название);
      // такой берём, только если не нашлось ничего чище
      if (clean) return out;
      if (fallback == null) fallback = out;
    }
  }
  return fallback;
}

// Подставленный кусок: целиком, а если целиком не нашёлся — по частям («№1 — Фундаменты», «, Алматы»).
// Возвращает null, если не перевелась ни одна часть.
function subParts(v) {
  const whole = translateCore(v);
  if (whole != null) return whole;
  const lead = v.match(/^([\s,.;:—–-]+)([\s\S]+)$/);
  if (lead) { const t = translateCore(lead[2]); if (t != null) return lead[1] + t; }
  const parts = v.split(/( — | – |, | · |: |; )/);
  if (parts.length < 2) return null;
  let hit = false;
  const out = parts.map((part, i) => {
    if (i % 2 || !CYR.test(part)) return part;
    const t = translateCore(part);
    if (t != null) hit = true;
    return t ?? part;
  });
  return hit ? out.join('') : null;
}

// Даты, которые браузер пишет по-русски («24 ноября 2026 г.», «пн, 24 нояб., 12:30», «ноябрь 2026 г.»)
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_STEMS = ['янв', 'фев', 'мар', 'апр', 'ма[йя]', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WEEKDAYS = { пн: 'Mon', вт: 'Tue', ср: 'Wed', чт: 'Thu', пт: 'Fri', сб: 'Sat', вс: 'Sun', понедельник: 'Monday', вторник: 'Tuesday', среда: 'Wednesday', четверг: 'Thursday', пятница: 'Friday', суббота: 'Saturday', воскресенье: 'Sunday' };
const MONTH_RE = `(${MONTH_STEMS.join('|')})[а-яё]*\\.?`;
const DATE_RE = new RegExp(`^(?:(${Object.keys(WEEKDAYS).join('|')})\\.?,?\\s+)?(\\d{1,2})\\s+${MONTH_RE}(?:\\s+(\\d{4}))?(?:\\s*г(?:ода|\\.)?)?(?:,?\\s+(?:в\\s+)?(\\d{1,2}:\\d{2}))?$`, 'i');
const MONTH_YEAR_RE = new RegExp(`^${MONTH_RE}\\s+(\\d{4})(?:\\s*г(?:ода|\\.)?)?$`, 'i');
const monthIndex = (stem) => MONTH_STEMS.findIndex((m) => new RegExp(`^${m}$`, 'i').test(stem));

const WEEKDAY_LONG = 'понедельник|вторник|среда|четверг|пятница|суббота|воскресенье';
const DATE_WD_RE = new RegExp(`^(\\d{1,2})\\s+${MONTH_RE}(?:\\s+(\\d{4}))?(?:\\s*г(?:ода|\\.)?)?,\\s+(${WEEKDAY_LONG})$`, 'i');
const DATE_RANGE_RE = new RegExp(`^(\\d{1,2})\\s*[–—-]\\s*(\\d{1,2})\\s+${MONTH_RE}(?:\\s+(\\d{4}))?(?:\\s*г(?:ода|\\.)?)?$`, 'i');

function dateEn(s) {
  if (s.length > 40) return null;
  let w = s.match(DATE_WD_RE);
  if (w) return `${WEEKDAYS[w[4].toLowerCase()]}, ${w[1]} ${MONTHS_EN[monthIndex(w[2])]}${w[3] ? ` ${w[3]}` : ''}`;
  w = s.match(DATE_RANGE_RE);
  if (w) return `${w[1]} – ${w[2]} ${MONTHS_EN[monthIndex(w[3])]}${w[4] ? ` ${w[4]}` : ''}`;
  let m = s.match(DATE_RE);
  if (m) {
    const [, wd, day, mon, year, time] = m;
    const long = !/\.$/.test(s.replace(/\s*г\.?$/, '')) && !/[а-яё]{0,2}\.(\s|,|$)/i.test(s.slice(s.search(/[а-яё]{3}/i)).replace(/\s*г\.?$/, ''));
    const name = MONTHS_EN[monthIndex(mon)];
    return `${wd ? `${WEEKDAYS[wd.toLowerCase()]}, ` : ''}${day} ${long ? name : name.slice(0, 3)}${year ? ` ${year}` : ''}${time ? `, ${time}` : ''}`;
  }
  m = s.match(MONTH_YEAR_RE);
  if (m) return `${MONTHS_EN[monthIndex(m[1])]} ${m[2]}`;
  return null;
}

// Выражения из чисел и единиц измерения: «12,5 м × 3 м = 37,5 м²»
const UNIT_EN = { 'м²': 'm²', 'м³': 'm³', мм: 'mm', см: 'cm', км: 'km', кг: 'kg', кВт: 'kW', Вт: 'W', шт: 'pcs', 'п.м': 'lin. m', 'м.п': 'lin. m', мес: 'mo', мин: 'min', чел: 'ppl', дн: 'd', тг: '₸', м: 'm', т: 't', л: 'L', ч: 'h' };
const UNIT_RE = /(?<![А-Яа-яЁё])(м²|м³|мм|см|км|кг|кВт|Вт|шт|п\.м|м\.п|мес|мин|чел|дн|тг|м|т|л|ч)(?![А-Яа-яЁё])/g;
function unitsEn(s) {
  if (lang !== 'en' || !/\d/.test(s)) return null;
  const out = s.replace(UNIT_RE, (u) => UNIT_EN[u]);
  return CYR.test(out) ? null : out;
}

// Составные фразы. Сервер склеивает пояснения к смете из готовых кусков:
//   «точки: унитаз 1, раковина 2; ≈3 м трубы на точку + 10%» — через «; », «: », «, »;
//   «(26 м × 2,7 м − проёмы 8,3 м²) × 0,3 м + 5% бой и подрезка» — две фразы через пробел.
// Перевод собирается так же, но только если нашёлся перевод каждого куска — наполовину фраза не переводится.
const piece = (x) => (CYR.test(x) ? (lookupExact(x) ?? unitsEn(x)) : x);
function composeEn(s, depth = 0) {
  if (s.length > 260 || depth > 3) return null;
  for (const sep of ['; ', ', ']) {
    const parts = s.split(sep);
    if (parts.length < 2 || parts.length > 12) continue;
    const out = parts.map((x) => piece(x) ?? labelled(x, depth) ?? twoHalves(x) ?? composeEn(x, depth + 1));
    if (out.every((x) => x != null)) return out.join(sep);
  }
  return labelled(s, depth) ?? twoHalves(s);
}
// «точки: унитаз 1, раковина 2»
function labelled(s, depth) {
  const m = s.match(/^([^:]{2,40}): (.+)$/);
  if (!m) return null;
  const head = piece(m[1]);
  if (head == null) return null;
  const rest = piece(m[2]) ?? composeEn(m[2], depth + 1);
  return rest == null ? null : `${head}: ${rest}`;
}
// две готовые фразы подряд: начало — фраза или шаблон, остаток — фраза
function twoHalves(s) {
  let tries = 0;
  for (let i = s.lastIndexOf(' '); i > 0 && tries < 40; i = s.lastIndexOf(' ', i - 1), tries++) {
    const rest = piece(s.slice(i + 1));
    if (rest == null) continue;
    const head = s.slice(0, i);
    const th = CYR.test(head) ? (lookupExact(head) ?? unitsEn(head) ?? lookupPack(head)) : head;
    if (th != null && !CYR.test(th)) return `${th} ${rest}`;
  }
  return null;
}

/** Запасные способы: шаблоны, правила, даты, единицы, ЗАГЛАВНЫЕ буквы, фраза из частей через «·». */
function lookupLoose(s) {
  let t = lookupPack(s);
  if (t != null) return t;
  for (const p of PATTERNS) {
    const m = s.match(p.re);
    if (m) {
      const tpl = lang === 'kk' ? p.kk : p.en;
      return typeof tpl === 'function' ? tpl(m, sub) : s.replace(p.re, tpl);
    }
  }
  if (lang !== 'en') return null;
  t = dateEn(s) ?? unitsEn(s);
  if (t != null) return t;
  // «31 августа, понедельник: задач нет»
  const dated = s.match(/^(.{4,40}?): (.+)$/);
  if (dated) { const d = dateEn(dated[1]); if (d != null) return `${d}: ${translateCore(dated[2]) ?? dated[2]}`; }
  // «г. Караганда»
  const city = s.match(/^г\. ?(\S.{1,40})$/);
  if (city) return translateCore(city[1]) ?? city[1];
  // надпись, которую страница сама перевела в заглавные буквы: «МЕНЕДЖЕР»
  if (s.length > 1 && s === s.toUpperCase() && s !== s.toLowerCase()) {
    const low = s.toLowerCase();
    t = lookupExact(low[0].toUpperCase() + low.slice(1)) ?? lookupExact(low);
    if (t != null) return t.toUpperCase();
  }
  // подпись со строчной буквы, а в словаре она с заглавной: «контур помещения»
  if (/^[а-яё]/.test(s)) {
    t = lookupExact(s[0].toUpperCase() + s.slice(1));
    if (t != null) return t[0].toLowerCase() + t.slice(1);
  }
  // фраза, которую сервер или страница собрали из готовых кусков — переводится, только если переводятся все куски
  t = composeEn(s);
  if (t != null) return t;
  // «Подрядчик · Астана · 2 чел.» — по частям
  const parts = s.split(/( · | • | \| )/);
  if (parts.length > 1) {
    let hit = false;
    const out = parts.map((part, i) => {
      if (i % 2 || !CYR.test(part)) return part;
      const tp = translateCore(part);
      if (tp != null) hit = true;
      return tp ?? part;
    });
    if (hit) return out.join('');
  }
  return null;
}

const listeners = new Set();
const origText = new WeakMap();   // текстовый узел → русский оригинал
const appliedText = new WeakMap(); // текстовый узел → что записали мы
const origAttr = new WeakMap();   // элемент → { attr: оригинал }
const appliedAttr = new WeakMap(); // элемент → { attr: что записали мы }
let observer = null;
let titleObserver = null;
let originalTitle = null;

// значки и стрелки по краям фразы переводить не нужно: «📋 Меню Заказчика», «Перейти в кабинет →»
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*]*)$/u;

const lookup = (s) => lookupExact(s) ?? lookupLoose(s);
// перевод вложенной фразы внутри шаблона (город, размер); нет перевода — как есть
const sub = (x) => lookup(String(x).trim()) ?? x;

/** Перевод строки на текущий язык или null, если её нет в словаре. */
export function translate(raw) {
  if (lang === 'ru' || !raw || !CYR.test(raw)) return null;
  if (cache.has(raw)) return cache.get(raw);
  const out = translateCore(raw);
  if (cache.size > 20000) cache.clear();
  cache.set(raw, out);
  return out;
}

function translateCore(raw) {
  if (!raw || !CYR.test(raw)) return null;
  const norm = raw.replace(/\s+/g, ' ');
  const trimmed = norm.trim();
  const m = trimmed.match(EDGE);
  const [, pre, core, post] = m || [null, '', trimmed, ''];
  // дата целиком («24 ноября 2026 г.») — раньше словаря, иначе точка от «г.» останется в конце
  if (lang === 'en') { const d = dateEn(trimmed); if (d != null) return norm.replace(trimmed, () => d); }
  // три вида одной фразы: как есть; без значков в начале («Всего:», «Нет аккаунта?»); без знаков по краям
  const forms = [[trimmed, '', '']];
  const withPunct = (core + post).trim();
  if (withPunct && withPunct !== trimmed) forms.push([withPunct, pre, '']);
  const bare = core.trim();
  if (bare && bare !== trimmed && bare !== withPunct) forms.push([bare, pre, post]);
  // сначала точные совпадения во всех видах, и только потом шаблоны: иначе общий шаблон
  // («Бригада {a}») перехватывает фразу, для которой есть точный перевод без точки на конце
  for (const find of [lookupExact, lookupLoose]) {
    for (const [text, before, after] of forms) {
      const t = find(text);
      if (t != null) return norm.replace(trimmed, () => before + t + after);
    }
  }
  return null;
}

function skip(el) {
  if (!el) return true;
  if (/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA|CODE|PRE)$/.test(el.tagName)) return true;
  return !!el.closest('[translate="no"], [contenteditable="true"]');
}

function processText(node) {
  const cur = node.nodeValue;
  // быстрый выход: узел без кириллицы, который мы ещё не трогали
  if (!origText.has(node) && !CYR.test(cur)) return;
  if (skip(node.parentElement)) return;
  let orig = origText.get(node);
  if (orig === undefined || (cur !== orig && cur !== appliedText.get(node))) {
    // первый раз или React записал новую русскую фразу
    orig = cur;
    origText.set(node, orig);
  }
  const next = lang === 'ru' ? orig : (translate(orig) ?? orig);
  if (next !== cur) {
    appliedText.set(node, next);
    node.nodeValue = next;
  }
}

function processAttrs(el) {
  // подсказку в поле ввода (placeholder у textarea) переводим, а набранный человеком текст — нет
  if (!ATTRS.some((a) => el.hasAttribute(a)) || (el.tagName !== 'TEXTAREA' && skip(el)) || el.closest('[translate="no"]')) return;
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const cur = el.getAttribute(a);
    if (!origAttr.get(el)?.[a] && !CYR.test(cur)) continue;
    const origs = origAttr.get(el) || {};
    const applied = appliedAttr.get(el) || {};
    if (origs[a] === undefined || (cur !== origs[a] && cur !== applied[a])) {
      origs[a] = cur;
      origAttr.set(el, origs);
    }
    const next = lang === 'ru' ? origs[a] : (translate(origs[a]) ?? origs[a]);
    if (next !== cur) {
      applied[a] = next;
      appliedAttr.set(el, applied);
      el.setAttribute(a, next);
    }
  }
}

function walk(root) {
  if (!root) return;
  if (root.nodeType === Node.TEXT_NODE) { processText(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  processAttrs(root);
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  while (tw.nextNode()) {
    const n = tw.currentNode;
    if (n.nodeType === Node.TEXT_NODE) processText(n);
    else processAttrs(n);
  }
}

function translateTitle() {
  const el = document.querySelector('title');
  if (!el) return;
  const cur = document.title;
  if (originalTitle === null || (cur !== originalTitle && cur !== translateTitleText(originalTitle))) originalTitle = cur;
  const next = lang === 'ru' ? originalTitle : translateTitleText(originalTitle);
  if (next !== cur) document.title = next;
}
function translateTitleText(t) {
  if (lang === 'ru' || !t) return t;
  return t.split(' — ').map((part) => translate(part) ?? part).join(' — ');
}

function startObserver() {
  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'characterData') processText(m.target);
      else if (m.type === 'attributes') processAttrs(m.target);
      else m.addedNodes.forEach(walk);
    }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  const title = document.querySelector('title');
  if (title) {
    titleObserver = new MutationObserver(translateTitle);
    titleObserver.observe(title, { childList: true, characterData: true, subtree: true });
  }
}

function applyAll() {
  document.documentElement.lang = lang;
  if (lang !== 'ru') startObserver();
  walk(document.body);
  translateTitle();
}

export function getLang() { return lang; }

export function setLang(next) {
  if (!CODES.includes(next) || next === lang) return;
  lang = next;
  cache.clear();
  try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* без сохранения */ }
  applyAll();
  listeners.forEach((f) => f(next));
  // английский: сначала применяется базовый словарь, полный — как только догрузится
  if (next === 'en' && !pack) langReady().then(() => { if (lang === 'en') applyAll(); });
}

function subscribe(f) { listeners.add(f); return () => listeners.delete(f); }

/** Текущий язык для компонентов (перерисовка при смене). */
export function useLang() {
  return useSyncExternalStore(subscribe, getLang, () => 'ru');
}

/** Запуск: применяет сохранённый язык после первой отрисовки. */
export function initI18n() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
  if (lang === 'ru') return;
  const run = () => { applyAll(); if (lang === 'en' && !pack) langReady().then(() => { if (lang === 'en') applyAll(); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
