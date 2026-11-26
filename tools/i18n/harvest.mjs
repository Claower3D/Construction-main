// Собирает русские фразы интерфейса из кода сайта и сообщений сервера, которых ещё нет в словаре.
// Ключ фразы нормализуется так же, как это делает движок перевода (обрезка значков и пунктуации по краям,
// числа → {n}), чтобы одна запись покрывала все варианты.
import fs from 'node:fs';
import path from 'node:path';
import { DICT } from '../../frontend/src/i18n/dict.js';

const SRC = '../../frontend/src';
const GO = '../../go-backend/pkg/handlers';
const CYR = /[А-Яа-яЁё]/;
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*]*)$/u;
export const NUM = /\d+(?:[   .,]\d+)*/g;
export const core = (s) => { const t = s.replace(/\s+/g, ' ').trim(); const m = t.match(EDGE); return (m ? m[2] : t).trim(); };
export const tpl = (s) => s.replace(NUM, '{n}');
const have = new Set(Object.keys(DICT).flatMap((k) => [k, core(k), tpl(core(k))]));

const walk = (d, out = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p, out); else out.push(p); } return out; };
const found = new Map(); // key → { files:Set, kind }
const LET = 'abcdefghij';
// raw может содержать метки подстановок \u0001N\u0001 (N — номер по порядку)
const add = (raw, file, kind) => {
  let s = raw.replace(/\\n/g, ' ').replace(/\\(['"`])/g, '$1').replace(/&nbsp;/g, ' ').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&mdash;/g, '—').replace(/\s+/g, ' ').trim();
  if (!CYR.test(s)) return;
  const marks = [];
  s = s.replace(/\u0001(\d+)\u0001/g, (all, n) => { marks.push(n); return `\u0002${marks.length - 1}\u0002`; });
  if (marks.length > 9) return;
  let k = tpl(core(s.replace(/\u0002(\d)\u0002/g, (all, i) => `⟦${LET[i]}⟧`))).replace(/⟦([a-j])⟧/g, '{$1}');
  // подстановка на самом краю фразы движок отрежет вместе с пробелом — такие шаблоны бесполезны как есть
  if (!k || !CYR.test(k.replace(/\{[a-j]\}/g, '')) || k.length > 400) return;
  const isTpl = /\{[a-j]\}/.test(k);
  if (!isTpl && (have.has(k) || have.has(core(s)))) return;
  const key = (isTpl ? 'T:' : '') + k;
  if (!found.has(key)) found.set(key, { files: new Set(), kind: isTpl ? 'tpl' : kind });
  found.get(key).files.add(file);
};
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1');

for (const file of walk(SRC)) {
  if (!/\.(jsx|js)$/.test(file) || /\.test\.js$/.test(file) || file.includes('/i18n/')) continue;
  const rel = path.relative(SRC, file);
  let s = stripComments(fs.readFileSync(file, 'utf8'));
  // шаблонные строки: каждая подстановка ${…} помечается номером
  s = s.replace(/`((?:[^`\\]|\\.)*)`/g, (all, body) => {
    if (CYR.test(body)) {
      let i = 0, depth = 0, out = '', n = 0;
      while (i < body.length) {
        if (body[i] === '$' && body[i + 1] === '{') { depth = 1; i += 2; while (i < body.length && depth) { if (body[i] === '{') depth++; else if (body[i] === '}') depth--; i++; } out += `\u0001${n++}\u0001`; } else out += body[i++];
      }
      add(out, rel, 'str');
    }
    return '``';
  });
  for (const m of s.matchAll(/'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"/g)) { const t = m[1] ?? m[2]; if (t && CYR.test(t)) add(t, rel, 'str'); }
  if (file.endsWith('.jsx')) {
    const noStr = s.replace(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"/g, '""');
    for (const m of noStr.matchAll(/[>}]([^<>{}]*[А-Яа-яЁё][^<>{}]*)(?=[<{])/g)) { const t = m[1]; if (/[=;`]|&&|\|\||\breturn\b|\bconst\b/.test(t)) continue; add(t, rel, 'jsx'); }
  }
}
for (const file of walk(GO)) {
  if (!file.endsWith('.go') || file.endsWith('_test.go')) continue;
  const s = fs.readFileSync(file, 'utf8').replace(/\/\/[^\n]*/g, '');
  // только то, что сервер показывает человеку: тексты ошибок и сообщений
  for (const m of s.matchAll(/(?:writeError\(w, [^,]+, |"(?:error|message|hint|warning|note|title)":\s*|errors\.New\(|fmt\.(?:Sprintf|Errorf)\(|return\s+)"((?:[^"\\\n]|\\.)*)"/g)) {
    if (!CYR.test(m[1])) continue;
    let n = 0;
    add(m[1].replace(/%(?:\.\d)?[df]/g, '0').replace(/%[svq]/g, () => `\u0001${n++}\u0001`).replace(/\\"/g, '"'), 'go:' + path.basename(file), 'go');
  }
}
const prio = (f) => (f.startsWith('data/') ? 3 : f.startsWith('go:') ? 2 : /workCatalog|marketplaceProducts|estimateTemplates|Templates|mock|demo|seed/i.test(f) ? 3 : 1);
const list = [...found.entries()].map(([k, v]) => ({ k, kind: v.kind, files: [...v.files].sort(), p: Math.min(...[...v.files].map(prio)) }));
list.sort((a, b) => a.p - b.p || a.files[0].localeCompare(b.files[0]) || a.k.localeCompare(b.k));
fs.writeFileSync('phrases.json', JSON.stringify(list));
const by = {}; list.forEach((x) => { by[`${x.p}:${x.kind}`] = (by[`${x.p}:${x.kind}`] || 0) + 1; });
console.log('в словаре уже', Object.keys(DICT).length, '| новых фраз', list.length, by, '| символов', list.reduce((a, x) => a + x.k.length, 0));
