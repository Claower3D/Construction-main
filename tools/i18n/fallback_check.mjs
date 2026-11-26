// node fallback_check.mjs <язык> — какие собранные русские фразы на этом языке выходят по-английски
// (или не переводятся совсем). Сначала ru_texts.cjs — он собирает фразы с запущенного сайта.
import fs from 'node:fs';
const lang = process.argv[2];
globalThis.window = { location: { hostname: 'qazgost.kz' } };
globalThis.localStorage = { getItem: (k) => (k === 'qazgost_lang' ? lang : null), setItem() {} };
const { translate, langReady } = await import('../../frontend/src/i18n/index.js');
await langReady();
const en = (await import('../../frontend/src/i18n/dict.en.js'));
const own = (await import(`../../frontend/src/i18n/dict.${lang}.js`));
const list = JSON.parse(fs.readFileSync('ru_texts.json', 'utf8'));
const NUM = /\d+(?:[   .,]\d+)*/g; const CYR = /[А-Яа-яЁё]/;
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*]*)$/u;
let none = 0, viaEn = 0; const out = [];
for (const { t, where } of list) {
  const r = translate(t);
  if (r == null) { none++; out.push(`НЕТ   [${where}] ${t.trim().slice(0, 110)}`); continue; }
  if (CYR.test(r)) { out.push(`ЧАСТЬ [${where}] ${t.trim().slice(0, 80)} → ${r.trim().slice(0, 80)}`); continue; }
  const core = t.replace(/\s+/g, ' ').trim().match(EDGE)[2]; const key = core.replace(NUM, '{n}');
  const inOwn = own.T[core] != null || own.T[key] != null || own.T[t] != null;
  const inEn = en.EN[core] != null || en.EN[key] != null;
  if (!inOwn && inEn) { viaEn++; out.push(`EN    [${where}] ${core.slice(0, 90)} → ${r.trim().slice(0, 70)}`); }
}
console.log(out.join('\n')); console.log(`всего ${list.length}; без перевода ${none}; по-английски ${viaEn}`);
