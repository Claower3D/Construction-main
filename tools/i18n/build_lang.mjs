// node build_lang.mjs <язык> — собирает frontend/src/i18n/dict.<язык>.js из lang/<язык>/*.txt (строки «номер|перевод»).
// Проверяет подстановки ({a}, {b}, {n}) и что в переводе не осталось кириллицы.
import fs from 'node:fs';
const lang = process.argv[2];
const NAMES = { zh: 'Китайский', tr: 'Турецкий', uz: 'Узбекский', ar: 'Арабский', de: 'Немецкий', ja: 'Японский' };
if (!NAMES[lang]) { console.log('язык?'); process.exit(2); }
const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));
const T = {}; const TPL = []; const bad = []; const seen = new Set();
const ph = (s) => [...s.matchAll(/\{([a-j]|n)\d?\}/g)].map((q) => q[1]);
// номера чисел в переводе: {n2} … {n1} — когда в языке порядок слов другой
const idx = (s) => [...s.matchAll(/\{n(\d)?\}/g)].map((q) => (q[1] ? +q[1] : 0));
const letters = (q) => q.filter((c) => c !== 'n').sort().join('');
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*。，：；！？]*)$/u;
const strip = (x) => { const m = String(x).replace(/\s+/g, ' ').trim().match(EDGE); return (m ? m[2] : String(x)).trim(); };
const NUM = /\d+(?:[   .,]\d+)*/g;
const dir = `lang/${lang}`;
for (const f of fs.existsSync(dir) ? fs.readdirSync(dir).filter((n) => n.endsWith('.txt')).sort() : []) {
  for (const line of fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n')) {
    const m = line.match(/^(\d+)\|(.*)$/);
    if (!m) { if (line.trim()) bad.push(`${f}: непонятная строка «${line.slice(0, 60)}»`); continue; }
    const i = +m[1]; const tr = m[2].trim(); const k = keys[i];
    if (!k) { bad.push(`${f}: нет фразы №${i}`); continue; }
    if (seen.has(i)) { bad.push(`${f}: №${i} дважды`); continue; }
    seen.add(i);
    if (!tr) continue; // пустой перевод — покажется по-английски
    const a = ph(k.s), b = ph(tr);
    if (letters(a) !== letters(b) || a.filter((c) => c === 'n').length < b.filter((c) => c === 'n').length) { bad.push(`${f}: №${i} подстановки не сходятся: «${k.s}» → «${tr}»`); continue; }
    // числа-подстановки возвращаются на место по порядку — порядок {n} и букв-чисел менять нельзя
    if (a.filter((c) => c === 'n').length > 1 && a.filter((c) => c === 'n').length !== b.filter((c) => c === 'n').length) { bad.push(`${f}: №${i} разное число {n}: «${k.s}» → «${tr}»`); continue; }
    { const ix = idx(tr); const some = ix.some(Boolean);
      if (some && (ix.some((x) => !x) || ix.slice().sort().join() !== ix.map((_, q) => q + 1).join() || ix.length !== a.filter((c) => c === 'n').length)) { bad.push(`${f}: №${i} номера чисел {n1}, {n2}… должны встречаться все по одному разу: «${tr}»`); continue; } }
    if (/[А-Яа-яЁё]/.test(tr)) { bad.push(`${f}: №${i} в переводе осталась кириллица: «${tr}»`); continue; }
    if (/\{[a-j]\}/.test(k.s)) { TPL.push([k.s, tr]); continue; }
    T[k.s] = tr;
    if (k.t === 0) {
      // фразы базового словаря хранятся со знаками по краям и с числами — добавляем те же запасные виды,
      // что движок строит для казахского и английского: без знаков по краям и с {n} вместо чисел
      const ck = strip(k.s); const cv = strip(tr);
      if (ck && ck !== k.s && T[ck] == null) T[ck] = cv;
      if (/\d/.test(ck)) {
        const n = (ck.match(NUM) || []).length;
        if ((cv.match(NUM) || []).length === n) { const tk = ck.replace(NUM, '{n}'); if (T[tk] == null) T[tk] = cv.replace(NUM, '{n}'); }
      }
    }
  }
}
const literal = (src) => src.replace(/\{[a-j]\}|\{n\}/g, '').replace(/[^A-Za-zА-Яа-яЁё]/g, '').length;
for (const t of TPL.filter((x) => literal(x[0]) < 4)) TPL.splice(TPL.indexOf(t), 1);
TPL.sort((p, q) => q[0].length - p[0].length);
const js = `// ${NAMES[lang]} словарь интерфейса: русская фраза → перевод. Грузится только тем, кто выбрал этот язык\n// (подробности — в i18n/index.js). Фразы, которых здесь нет, показываются по-английски.\n// T — фразы целиком ({n} — число), TEMPLATES — фразы с подстановками {a}, {b}…\n/* eslint-disable */\nexport const T = ${JSON.stringify(T, null, 0).replace(/","/g, '",\n"')};\n\nexport const TEMPLATES = ${JSON.stringify(TPL, null, 0).replace(/\],\[/g, '],\n[')};\n`;
const extra = fs.existsSync(`${dir}/patterns.js`) ? fs.readFileSync(`${dir}/patterns.js`, 'utf8') : '';
fs.writeFileSync(`../../frontend/src/i18n/dict.${lang}.js`, js + extra);
const left = [0, 0, 0, 0]; keys.forEach((k, i) => { if (!seen.has(i)) left[k.t]++; });
console.log(`${lang}: переведено ${seen.size} из ${keys.length}; фраз ${Object.keys(T).length}, шаблонов ${TPL.length}; осталось по очередям ${left.join(' / ')}; замечаний ${bad.length}; размер ${(Buffer.byteLength(js) / 1024).toFixed(0)} КБ`);
bad.slice(0, 40).forEach((b) => console.log('  ' + b));
