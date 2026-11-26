// Фразы из серверных справочников (техкарты смет, ответы помощника), которые сервер отдаёт сайту как есть.
// node harvest_go.mjs [--write] файл.go …
import fs from 'node:fs';
const CYR = /[А-Яа-яЁё]/;
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*]*)$/u;
const NUM = /\d+(?:[   .,]\d+)*/g;
const core = (s) => { const t = s.replace(/\s+/g, ' ').trim(); const m = t.match(EDGE); return (m ? m[2] : t).trim(); };
const list = JSON.parse(fs.readFileSync('phrases.json', 'utf8'));
const known = new Set(list.map((x) => x.k));
const args = process.argv.slice(2); const write = args.includes('--write');
const found = new Map();
for (const file of args.filter((a) => a.endsWith('.go'))) {
  const src = fs.readFileSync(file, 'utf8').replace(/(^|[^:"'`\\])\/\/[^\n]*/g, '$1');
  for (const m of src.matchAll(/"((?:[^"\\\n]|\\.)*)"|`([^`]*)`/g)) {
    let s = m[1] != null ? JSON.parse('"' + m[1].replace(/\\'/g, "'") + '"') : m[2];
    if (!CYR.test(s)) continue;
    // подстановки fmt: %s, %d, %.1f … → {a}, {b}
    let i = 0; const LET = 'abcdefghij';
    let num = '';
    s = s.replace(/%%/g, '\u0003').replace(/%[-+#0 ]*\d*(?:\.\d+)?([sdvfgqtx])/g, (all, verb) => { const l = LET[i++] || 'j'; if (/[dfg]/.test(verb)) num += l; return `{${l}}`; }).replace(/\u0003/g, '%');
    const hasTpl = i > 0;
    const k = core(s).replace(NUM, '{n}');
    if (!k || !CYR.test(k.replace(/\{[a-j]\}/g, '')) || k.length > 600) continue;
    const key = (hasTpl ? 'T:' : '') + k;
    if (known.has(key) || (!hasTpl && known.has('T:' + k))) continue;
    if (!found.has(key)) found.set(key, { k: key, kind: hasTpl ? 'tpl' : 'str', files: [file.replace(/^.*go-backend\//, 'go:')], p: 2, ...(num ? { num } : {}) });
  }
}
const fresh = [...found.values()];
console.log(`новых фраз: ${fresh.length}`);
if (write) { fs.writeFileSync('phrases.json', JSON.stringify([...list, ...fresh])); console.log(`номера ${list.length}…${list.length + fresh.length - 1}`); }
else fresh.forEach((x) => console.log(x.k.slice(0, 150)));
