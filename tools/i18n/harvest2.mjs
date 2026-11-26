// Второй проход сбора фраз: разбирает код настоящим парсером (первый проход по регулярным выражениям
// пропускал строки в файлах с апострофами и обратными кавычками). Новые фразы дописываются в конец
// phrases.json, поэтому номера уже переведённых фраз не меняются.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { DICT } from '../../frontend/src/i18n/dict.js';
const require = createRequire(new URL('../../frontend/package.json', import.meta.url));
const { parse } = require('@babel/parser');

const SRC = '../../frontend/src';
const CYR = /[А-Яа-яЁё]/;
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*]*)$/u;
const NUM = /\d+(?:[   .,]\d+)*/g;
const core = (s) => { const t = s.replace(/\s+/g, ' ').trim(); const m = t.match(EDGE); return (m ? m[2] : t).trim(); };
const tpl = (s) => s.replace(NUM, '{n}');
const LET = 'abcdefghij';
const list = JSON.parse(fs.readFileSync('phrases.json', 'utf8'));
const known = new Set(list.map((x) => x.k));
// движок теперь находит фразу и по ключу словаря без краевых знаков, и с числами → {n}
const have = new Set(Object.keys(DICT).flatMap((k) => [k, core(k), tpl(core(k))]));
const found = new Map();
const add = (raw, file, kind, prio) => {
  let s = String(raw).replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
  if (!CYR.test(s)) return;
  const marks = [];
  s = s.replace(/\u0001(\d+)\u0001/g, (all, n) => { marks.push(n); return `\u0002${marks.length - 1}\u0002`; });
  if (marks.length > 9) return;
  const k = tpl(core(s.replace(/\u0002(\d)\u0002/g, (all, i) => `⟦${LET[i]}⟧`))).replace(/⟦([a-j])⟧/g, '{$1}');
  if (!k || !CYR.test(k.replace(/\{[a-j]\}/g, '')) || k.length > 600) return;
  const isTpl = /\{[a-j]\}/.test(k);
  if (!isTpl && have.has(k)) return;
  const key = (isTpl ? 'T:' : '') + k;
  if (known.has(key)) return;
  if (!found.has(key)) found.set(key, { files: new Set(), kind: isTpl ? 'tpl' : kind, p: prio });
  found.get(key).files.add(file);
};

const walkDir = (d, out = []) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walkDir(p, out); else out.push(p); } return out; };
let failed = 0;
for (const file of walkDir(SRC)) {
  if (!/\.(jsx|js)$/.test(file) || /\.test\.js$/.test(file) || file.includes('/i18n/')) continue;
  const rel = path.relative(SRC, file);
  const prio = rel.startsWith('data/') ? 3 : 1;
  let ast;
  try { ast = parse(fs.readFileSync(file, 'utf8'), { sourceType: 'module', plugins: ['jsx'], errorRecovery: true }); } catch (e) { failed++; console.error('не разобран:', rel, e.message.slice(0, 80)); continue; }
  const visit = (node, parent, keyName) => {
    if (!node || typeof node.type !== 'string') return;
    switch (node.type) {
      case 'ImportDeclaration': case 'ExportAllDeclaration': return;
      case 'CallExpression': {
        const c = node.callee;
        // отладочные сообщения и регулярные выражения — не интерфейс
        if (c && c.type === 'MemberExpression' && c.object && c.object.name === 'console') return;
        if (c && c.type === 'Identifier' && /^(RegExp|require)$/.test(c.name)) return;
        break;
      }
      case 'NewExpression': if (node.callee && node.callee.name === 'RegExp') return; break;
      case 'StringLiteral':
        // ключи объектов («'кровля': …») — это словари распознавания, а не текст на экране
        if (parent && (parent.type === 'ObjectProperty' || parent.type === 'Property') && keyName === 'key') return;
        add(node.value, rel, 'str', prio); return;
      case 'TemplateLiteral': {
        let out = '';
        node.quasis.forEach((q, i) => { out += q.value.cooked ?? q.value.raw; if (i < node.expressions.length) out += `\u0001${i}\u0001`; });
        add(out, rel, 'str', prio);
        node.expressions.forEach((e) => visit(e, node, 'expressions'));
        return;
      }
      case 'JSXText': add(node.value, rel, 'jsx', prio); return;
      default:
    }
    for (const k of Object.keys(node)) {
      if (k === 'loc' || k === 'start' || k === 'end' || k === 'leadingComments' || k === 'trailingComments' || k === 'innerComments' || k === 'extra') continue;
      const v = node[k];
      if (Array.isArray(v)) v.forEach((x) => visit(x, node, k)); else if (v && typeof v === 'object') visit(v, node, k);
    }
  };
  visit(ast.program, null, null);
}
const fresh = [...found].map(([k, v]) => ({ k, kind: v.kind, files: [...v.files].sort(), p: v.p })).sort((a, b) => a.p - b.p || a.files[0].localeCompare(b.files[0]) || a.k.localeCompare(b.k));
console.log(`файлов не разобрано: ${failed}; новых фраз: ${fresh.length} (интерфейс ${fresh.filter((x) => x.p === 1).length}, данные ${fresh.filter((x) => x.p === 3).length})`);
if (process.argv.includes('--write')) {
  fs.writeFileSync('phrases.json', JSON.stringify([...list, ...fresh]));
  console.log(`дописано в phrases.json: номера ${list.length}…${list.length + fresh.length - 1}`);
} else {
  const by = {}; fresh.forEach((x) => { by[x.files[0]] = (by[x.files[0]] || 0) + 1; });
  console.log(Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 40).map((e) => `${e[1]} ${e[0]}`).join('\n'));
}
