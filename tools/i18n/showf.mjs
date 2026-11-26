// node showf.mjs <язык> <часть имени файла> — непереведённые фразы из указанного файла
import fs from 'node:fs';
const [lang, pat, count = '400'] = process.argv.slice(2);
const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8')); const list = JSON.parse(fs.readFileSync('phrases.json', 'utf8'));
const filesOf = new Map(); for (const x of list) { let s = x.k.replace(/^T:/, ''); if (x.num) s = s.replace(/\{([a-j])\}/g, (a, c) => (x.num.includes(c) ? '{n}' : a)); filesOf.set(s, [...(filesOf.get(s) || []), ...(x.files || [])]); }
const done = new Set(); const dir = `lang/${lang}`;
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.txt'))) for (const line of fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n')) { const m = line.match(/^(\d+)\|/); if (m) done.add(+m[1]); }
let n = 0; keys.forEach((k, i) => { if (done.has(i) || n >= +count) return; if ((filesOf.get(k.s) || ['?']).some((f) => f.includes(pat))) { console.log(`${i}|${k.s}`); n++; } });
