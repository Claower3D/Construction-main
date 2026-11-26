// Переключение языка: русский, казахский, английский, китайский и любые следующие.
//
// Тексты приложения написаны по-русски прямо в компонентах (сотни файлов), поэтому перевод
// сделан слоем поверх DOM: текстовые узлы и атрибуты (placeholder, title, aria-label, alt)
// подменяются по словарю (dict.js), оригинал запоминается и возвращается при выборе RU.
// Если React перерисовал текст, наблюдатель видит новую русскую фразу и переводит её снова.
// Структура DOM не меняется — только nodeValue и значения атрибутов, это безопасно для React.
// Фразы, которых нет в словаре, остаются по-русски: словарь расширяется по мере перевода разделов.
//
// Словари. dict.js — небольшой, с казахским и английским переводом, грузится всем.
// dict.<язык>.js — полный словарь языка (en, zh, …), грузится отдельным файлом и только тем, кто выбрал этот язык.
// Новый язык = строка в LANGS + файл dict.<код>.js + строка в LOADERS. Пока фраза на новый язык не переведена,
// она показывается по-английски, а не по-русски: иностранцу английский понятнее (см. chain).
// Английская версия открывается сама по адресу qazgost.com (см. defaultLangForHost); «шапку» страницы
// (язык, заголовок вкладки, описание для поисковиков) под этот адрес подставляет сервер:
// go-backend/pkg/handlers/static.go. Проверка: npm run test:i18n.

import { useSyncExternalStore } from 'react';
import { DICT, PATTERNS } from './dict.js';

// label — короткая подпись на кнопке, name — название языка на нём самом, locale — для дат, чисел и голоса,
// dir: 'rtl' — письмо справа налево.
export const LANGS = [
  { code: 'ru', label: 'RU', name: 'Русский', locale: 'ru-RU' },
  { code: 'kk', label: 'KZ', name: 'Қазақша', locale: 'kk-KZ' },
  { code: 'en', label: 'EN', name: 'English', locale: 'en-US' },
  { code: 'zh', label: '中文', name: '简体中文', locale: 'zh-CN' },
  { code: 'tr', label: 'TR', name: 'Türkçe', locale: 'tr-TR' },
  { code: 'de', label: 'DE', name: 'Deutsch', locale: 'de-DE' },
  { code: 'uz', label: 'UZ', name: 'Oʻzbekcha', locale: 'uz-UZ' },
];
const CODES = LANGS.map((l) => l.code);
const BY_CODE = Object.fromEntries(LANGS.map((l) => [l.code, l]));
/** Обозначение языка для браузера: даты, числа, распознавание и синтез речи. */
export function langLocale(code = lang) { return BY_CODE[code]?.locale || 'ru-RU'; }

// Полные словари языков — отдельные файлы, грузятся по требованию
const LOADERS = {
  en: () => import('./dict.en.js'),
  zh: () => import('./dict.zh.js'),
  tr: () => import('./dict.tr.js'),
  de: () => import('./dict.de.js'),
  uz: () => import('./dict.uz.js'),
};
// В каком порядке искать перевод: сначала на выбранном языке, потом по-английски
const chain = (code) => (code === 'ru' ? [] : code === 'en' || code === 'kk' ? [code] : [code, 'en']);
const packsFor = (code) => chain(code).filter((c) => LOADERS[c]);
const STORAGE_KEY = 'qazgost_lang';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

// Язык по умолчанию задаёт домен: qazgost.com — международный, остальные открываются на русском.
// На qazgost.com берётся язык браузера, если сайт на него переведён (китайский и т. д.), иначе английский;
// русский и казахский браузер там тоже получают английский — для них есть qazgost.kz.
// Выбор, который человек сделал переключателем, запоминается и важнее домена.
export function defaultLangForHost(host, browserLangs = []) {
  if (!/(^|\.)qazgost\.com$/i.test(String(host || ''))) return 'ru';
  for (const b of browserLangs || []) {
    const code = String(b || '').toLowerCase().split('-')[0];
    if (code === 'en') return 'en';
    if (code !== 'ru' && code !== 'kk' && CODES.includes(code)) return code;
  }
  return 'en';
}

let lang = 'ru';
try { lang = defaultLangForHost(window.location.hostname, navigator.languages || [navigator.language]); } catch (e) { /* нет окна (тесты) — русский */ }
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (CODES.includes(saved)) lang = saved;
} catch (e) { /* хранилище недоступно — язык домена */ }

// Полный словарь языка грузится отдельным файлом и только тем, кто смотрит сайт на этом языке:
// русскоязычным посетителям он не нужен.
const packs = {};        // код языка → { T: { фраза: перевод }, buckets: Map, misc: [] }
const packPromises = {};
let target = 'ru';       // на какой язык переводим прямо сейчас (выбранный или запасной английский)
const NUM = /\d+(?:[ \u00a0\u202f.,]\d+)*/g;
const escapeRe = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Числа возвращаются в перевод по порядку: первое {n} — первое число фразы. Если в языке порядок слов
// другой («每 {n2} m² {n1} 个»), перевод называет номер числа явно: {n1}, {n2}…
function fillNums(text, nums) {
  let i = 0;
  return text.replace(/\{n(\d)?\}/g, (all, k) => (k ? nums[k - 1] : nums[i++]) ?? '');
}

function buildPack(mod) {
  const buckets = new Map();
  const misc = [];
  for (const [src, out] of mod.TEMPLATES || mod.EN_TEMPLATES || []) {
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
    const item = { re, out, order, tail: !/\}$/.test(src), len: src.length, weak: own < 12 };
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
  return { T: mod.T || mod.EN || {}, P: mod.PATTERNS || {}, buckets, misc };
}

function loadPack(code) {
  if (!packPromises[code]) {
    packPromises[code] = LOADERS[code]()
      .then((mod) => { packs[code] = buildPack(mod); cache.clear(); })
      .catch(() => { packPromises[code] = null; }); // нет связи — останется то, что есть; попробуем при следующем переключении
  }
  return packPromises[code];
}
const packsLoaded = (code) => packsFor(code).every((c) => packs[c]);

/** Догружает словари выбранного языка (и запасной английский). Для русского и казахского ничего не грузит. */
export function langReady() {
  return Promise.all(packsFor(lang).map(loadPack)).then(() => {});
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
  const pack = packs[target];
  // базовый словарь — только казахский и английский; у остальных языков всё лежит в их полном словаре
  const pick = (hit) => (hit ? (target === 'kk' ? hit[0] : target === 'en' ? hit[1] : null) : null);
  let t = pick(DICT[s]) ?? pick(coreDict.get(s));
  if (t != null) return t;
  if (pack) { t = pack.T[s]; if (t != null) return t; }
  if (/\d/.test(s)) {
    // «Найдено: 9 708» ищется как «Найдено: {n}», числа возвращаются на место по порядку
    const nums = [];
    const key = s.replace(NUM, (m) => { nums.push(m); return '{n}'; });
    t = (pack ? pack.T[key] : null) ?? pick(DICT[key]) ?? pick(coreDict.get(key));
    if (t != null) return fillNums(t, nums);
  }
  return null;
}

/** Шаблоны полного словаря: «Заказ {a} завершён». */
function lookupPack(s) {
  const pack = packs[target];
  if (!pack) return null;
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
      const out = fillNums(p.out, nums).replace(/\{([a-z])\}/g, (all, name) => done[name] ?? '') + (p.tail ? m[m.length - 1] : '');
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

// Та же дата на любом другом языке — средствами браузера (Intl), по правилам этого языка
function dateIntl(s) {
  if (s.length > 40) return null;
  const locale = langLocale(target);
  const fmt = (opts, d) => new Intl.DateTimeFormat(locale, { timeZone: 'UTC', ...opts }).format(d);
  const now = new Date().getUTCFullYear();
  const at = (year, mon, day) => new Date(Date.UTC(+year || now, monthIndex(mon), +day));
  try {
    let w = s.match(DATE_WD_RE);
    if (w) {
      // год не указан — берём тот из ближайших, в котором это число приходится на названный день недели
      const want = WEEKDAY_LONG.split('|').indexOf(w[4].toLowerCase()); // 0 — понедельник
      const year = w[3] || [now, now + 1, now - 1].find((y) => (at(y, w[2], w[1]).getUTCDay() + 6) % 7 === want);
      if (!year) return fmt({ day: 'numeric', month: 'long' }, at(now, w[2], w[1]));
      return fmt({ weekday: 'long', day: 'numeric', month: 'long', ...(w[3] ? { year: 'numeric' } : {}) }, at(year, w[2], w[1]));
    }
    w = s.match(DATE_RANGE_RE);
    if (w) return `${fmt({ day: 'numeric', month: 'long' }, at(w[4], w[3], w[1]))} – ${fmt({ day: 'numeric', month: 'long', ...(w[4] ? { year: 'numeric' } : {}) }, at(w[4], w[3], w[2]))}`;
    let m = s.match(DATE_RE);
    if (m) {
      const [, wd, day, mon, year, time] = m;
      const tok = s.match(new RegExp(MONTH_RE, 'i'))[0];
      const short = /\.$/.test(tok) || /^(янв|фев|мар|апр|июн|июл|авг|сен|сент|окт|ноя|нояб|дек)$/i.test(tok);
      let y = year;
      const opts = { day: 'numeric', month: short ? 'short' : 'long', ...(year ? { year: 'numeric' } : {}) };
      if (wd) {
        const key = wd.toLowerCase();
        const idx = key.length > 2 ? WEEKDAY_LONG.split('|').indexOf(key) : ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].indexOf(key);
        y = year || [now, now + 1, now - 1].find((yy) => (at(yy, mon, day).getUTCDay() + 6) % 7 === idx);
        if (y) opts.weekday = key.length > 2 ? 'long' : 'short';
      }
      return fmt(opts, at(y, mon, day)) + (time ? `, ${time}` : '');
    }
    m = s.match(MONTH_YEAR_RE);
    if (m) return fmt({ month: 'long', year: 'numeric' }, at(m[2], m[1], 1));
  } catch (e) { /* браузер не знает такого языка — дата останется как есть */ }
  return null;
}
// Не каждый браузер знает названия месяцев на каждом языке: без них Intl пишет «2026 M11».
// Для таких языков — свои названия; порядок слов как в английской дате: «24 noyabr 2026».
const DATE_WORDS = {
  uz: {
    months: ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'],
    days: { Monday: 'dushanba', Tuesday: 'seshanba', Wednesday: 'chorshanba', Thursday: 'payshanba', Friday: 'juma', Saturday: 'shanba', Sunday: 'yakshanba', Mon: 'Du', Tue: 'Se', Wed: 'Cho', Thu: 'Pa', Fri: 'Ju', Sat: 'Sha', Sun: 'Ya' },
  },
};
function dateOwn(s) {
  const en = dateEn(s);
  const own = DATE_WORDS[target];
  if (en == null || !own) return en;
  return en.replace(/[A-Z][a-z]+/g, (word) => {
    if (own.days[word]) return own.days[word];
    const i = MONTHS_EN.findIndex((m) => m === word || m.slice(0, 3) === word);
    return i < 0 ? word : (word.length === 3 && MONTHS_EN[i].length > 3 ? own.months[i].slice(0, 3) : own.months[i]);
  });
}
const dateOut = (s) => (target === 'en' ? dateEn(s) : !packs[target] ? null : DATE_WORDS[target] ? dateOwn(s) : dateIntl(s));

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
// Метры и килограммы везде пишутся латиницей; свои слова у языка — только для штук, дней, людей и т. п.
const UNIT_BY_LANG = {
  zh: { шт: '件', 'п.м': '延米', 'м.п': '延米', мес: '个月', мин: '分钟', чел: '人', дн: '天', ч: '小时', т: '吨', л: '升' },
  tr: { шт: 'adet', 'п.м': 'mt', 'м.п': 'mt', мес: 'ay', мин: 'dk', чел: 'kişi', дн: 'gün', ч: 'sa' },
  de: { шт: 'Stk.', 'п.м': 'lfm', 'м.п': 'lfm', мес: 'Mon.', мин: 'Min.', чел: 'Pers.', дн: 'Tg.', ч: 'Std.' },
  uz: { шт: 'dona', 'п.м': 'p.m', 'м.п': 'p.m', мес: 'oy', мин: 'daq', чел: 'kishi', дн: 'kun', ч: 'soat', см: 'sm', кВт: 'kVt', Вт: 'Vt' },
};
function unitsEn(s) {
  if (!packs[target] || !/\d/.test(s)) return null;
  const own = UNIT_BY_LANG[target];
  const out = s.replace(UNIT_RE, (u) => own?.[u] ?? UNIT_EN[u]);
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
  if (t != null) {
    if (!CYR.test(t)) return t;
    // шаблон совпал, но подставленный кусок остался русским («{a} м² + {n}% на подрезку», где {a} — целое
    // выражение): если фраза целиком собирается из готовых кусков, это точнее, чем перевод наполовину
    return (packs[target] ? composeEn(s) : null) ?? t;
  }
  for (const p of PATTERNS) {
    const m = s.match(p.re);
    if (m) {
      const tpl = p[target] ?? packs[target]?.P[p.id];
      if (tpl == null) break; // на этот язык правило не переведено — сработает запасной английский
      return typeof tpl === 'function' ? tpl(m, sub) : s.replace(p.re, tpl);
    }
  }
  if (!packs[target]) return null;
  t = dateOut(s) ?? unitsEn(s);
  if (t != null) return t;
  // «31 августа, понедельник: задач нет»
  const dated = s.match(/^(.{4,40}?): (.+)$/);
  if (dated) { const d = dateOut(dated[1]); if (d != null) return `${d}: ${translateCore(dated[2]) ?? dated[2]}`; }
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

// Перевод на выбранный язык, а если на нём фразы нет — на запасной английский.
// Вложенные куски (подстановки в шаблонах) снова начинают с выбранного языка.
function translateCore(raw) {
  if (!raw || !CYR.test(raw)) return null;
  const prev = target;
  try {
    for (const code of chain(lang)) {
      target = code;
      const t = coreFor(raw);
      if (t != null) return t;
    }
    return null;
  } finally { target = prev; }
}

function coreFor(raw) {
  const norm = raw.replace(/\s+/g, ' ');
  const trimmed = norm.trim();
  const m = trimmed.match(EDGE);
  const [, pre, core, post] = m || [null, '', trimmed, ''];
  // дата целиком («24 ноября 2026 г.») — раньше словаря, иначе точка от «г.» останется в конце
  { const d = dateOut(trimmed); if (d != null) return norm.replace(trimmed, () => d); }
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
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  document.documentElement.dir = BY_CODE[lang]?.dir || 'ltr';
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
  // сначала применяется то, что уже загружено, полный словарь языка — как только догрузится
  if (!packsLoaded(next)) langReady().then(() => { if (lang === next) applyAll(); });
}

function subscribe(f) { listeners.add(f); return () => listeners.delete(f); }

/** Текущий язык для компонентов (перерисовка при смене). */
export function useLang() {
  return useSyncExternalStore(subscribe, getLang, () => 'ru');
}

/** Запуск: применяет сохранённый язык после первой отрисовки. */
export function initI18n() {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : lang;
  if (lang === 'ru') return;
  const start = lang;
  const run = () => { applyAll(); if (!packsLoaded(start)) langReady().then(() => { if (lang === start) applyAll(); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
