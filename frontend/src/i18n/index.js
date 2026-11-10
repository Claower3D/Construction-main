// Переключение языка RU / KZ / EN.
//
// Тексты приложения написаны по-русски прямо в компонентах (сотни файлов), поэтому перевод
// сделан слоем поверх DOM: текстовые узлы и атрибуты (placeholder, title, aria-label, alt)
// подменяются по словарю (dict.js), оригинал запоминается и возвращается при выборе RU.
// Если React перерисовал текст, наблюдатель видит новую русскую фразу и переводит её снова.
// Структура DOM не меняется — только nodeValue и значения атрибутов, это безопасно для React.
// Фразы, которых нет в словаре, остаются по-русски: словарь расширяется по мере перевода разделов.

import { useSyncExternalStore } from 'react';
import { DICT, PATTERNS } from './dict';

export const LANGS = [
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'kk', label: 'KZ', name: 'Қазақша' },
  { code: 'en', label: 'EN', name: 'English' },
];
const CODES = LANGS.map((l) => l.code);
const STORAGE_KEY = 'qazgost_lang';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];

let lang = 'ru';
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (CODES.includes(saved)) lang = saved;
} catch (e) { /* хранилище недоступно — русский */ }

const listeners = new Set();
const origText = new WeakMap();   // текстовый узел → русский оригинал
const appliedText = new WeakMap(); // текстовый узел → что записали мы
const origAttr = new WeakMap();   // элемент → { attr: оригинал }
const appliedAttr = new WeakMap(); // элемент → { attr: что записали мы }
let observer = null;
let titleObserver = null;
let originalTitle = null;

const CYR = /[А-Яа-яЁё]/;
// значки и стрелки по краям фразы переводить не нужно: «📋 Меню Заказчика», «Перейти в кабинет →»
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*]*)$/u;

function lookup(s) {
  const hit = DICT[s];
  if (hit) return lang === 'kk' ? hit[0] : hit[1];
  for (const p of PATTERNS) {
    const m = s.match(p.re);
    if (m) {
      const tpl = lang === 'kk' ? p.kk : p.en;
      return typeof tpl === 'function' ? tpl(m, sub) : s.replace(p.re, tpl);
    }
  }
  return null;
}
// перевод вложенной фразы внутри шаблона (город, размер); нет перевода — как есть
const sub = (x) => lookup(String(x).trim()) ?? x;

/** Перевод строки на текущий язык или null, если её нет в словаре. */
export function translate(raw) {
  if (lang === 'ru' || !raw || !CYR.test(raw)) return null;
  const norm = raw.replace(/\s+/g, ' ');
  const trimmed = norm.trim();
  let t = lookup(trimmed);
  if (t != null) return norm.replace(trimmed, () => t);
  const m = trimmed.match(EDGE);
  if (!m) return null;
  const [, pre, core, post] = m;
  // сначала с завершающей пунктуацией («Всего:», «Нет аккаунта?»), потом без неё
  const withPunct = (core + post).trim();
  t = lookup(withPunct);
  if (t != null) return norm.replace(trimmed, () => pre + t);
  t = core ? lookup(core.trim()) : null;
  if (t != null) return norm.replace(trimmed, () => pre + t + post);
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
  if (!ATTRS.some((a) => el.hasAttribute(a)) || skip(el)) return;
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
  try { localStorage.setItem(STORAGE_KEY, next); } catch (e) { /* без сохранения */ }
  applyAll();
  listeners.forEach((f) => f(next));
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
  const run = () => applyAll();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
  else run();
}
