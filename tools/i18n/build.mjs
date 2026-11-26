// Собирает frontend/src/i18n/dict.en.js из переводов out/*.txt (строки «номер|English»).
// Проверяет: у каждой переведённой фразы те же подстановки ({a}, {b}, {n}), что и в русской.
import fs from 'node:fs';
const list = JSON.parse(fs.readFileSync('phrases.json', 'utf8'));
const EN = {}; const TPL = []; const bad = []; const seen = new Set();
for (const f of fs.readdirSync('out').sort()) {
  for (const line of fs.readFileSync(`out/${f}`, 'utf8').split('\n')) {
    const m = line.match(/^(\d+)\|(.*)$/);
    if (!m) continue;
    const i = +m[1]; const en = m[2].trim(); const x = list[i];
    if (!x) { bad.push(`${f}: нет фразы №${i}`); continue; }
    if (seen.has(i)) { bad.push(`${f}: №${i} дважды`); continue; }
    seen.add(i);
    if (!en) continue; // пустой перевод — оставить по-русски
    let src = x.k.replace(/^T:/, '');
    let enText = en;
    const ph = (s) => [...s.matchAll(/\{([a-j]|n)\}/g)].map((q) => q[1]);
    const a = ph(src), b = ph(en);
    const letters = (q) => q.filter((c) => c !== 'n').sort().join('');
    if (letters(a) !== letters(b) || a.filter((c) => c === 'n').length < b.filter((c) => c === 'n').length) { bad.push(`${f}: №${i} подстановки не сходятся: «${src}» → «${en}»`); continue; }
    if (/[А-Яа-яЁё]/.test(en.replace(/₸|№/g, ''))) { bad.push(`${f}: №${i} в переводе осталась кириллица: «${en}»`); continue; }
    // серверные фразы: подстановки-числа (%d, %.1f) на странице уже числа — такие фразы ищутся как «{n}»,
    // поэтому порядок чисел в переводе должен быть тем же, что и в русской фразе
    if (x.num) {
      const isNum = (c) => c === 'n' || x.num.includes(c);
      const seq = (q) => q.filter(isNum).join('');
      if (seq(a) !== seq(b)) { bad.push(`${f}: №${i} числа в переводе идут в другом порядке: «${src}» → «${en}»`); continue; }
      const conv = (t) => t.replace(/\{([a-j])\}/g, (all, c) => (x.num.includes(c) ? '{n}' : all));
      src = conv(src); enText = conv(en);
    }
    if (/\{[a-j]\}/.test(src)) TPL.push([src, enText]); else EN[src] = enText;
  }
}
// Дополнения, найденные при проверке страниц: строки «русская фраза|English» в extra.txt (важнее основных)
if (fs.existsSync('extra.txt')) {
  for (const line of fs.readFileSync('extra.txt', 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    const cut = line.lastIndexOf('|'); if (cut < 1) { bad.push(`extra.txt: нет разделителя: «${line}»`); continue; }
    const src = line.slice(0, cut).trim(); const en = line.slice(cut + 1).trim();
    const ph = (x) => [...x.matchAll(/\{([a-j]|n)\}/g)].map((q) => q[1]);
    const letters = (q) => q.filter((c) => c !== 'n').sort().join('');
    if (letters(ph(src)) !== letters(ph(en))) { bad.push(`extra.txt: подстановки не сходятся: «${src}»`); continue; }
    if (/[А-Яа-яЁё]/.test(en.replace(/₸|№/g, ''))) { bad.push(`extra.txt: в переводе осталась кириллица: «${en}»`); continue; }
    if (/\{[a-j]\}/.test(src)) { const i = TPL.findIndex((t) => t[0] === src); if (i >= 0) TPL.splice(i, 1); TPL.push([src, en]); } else EN[src] = en;
  }
}
// Шаблон почти из одних подстановок («{a} {b} на {c}») совпадает с любой фразой и портит её — такие не берём
const literal = (src) => src.replace(/\{[a-j]\}|\{n\}/g, '').replace(/[^A-Za-zА-Яа-яЁё]/g, '').length;
const dropped = TPL.filter((t) => literal(t[0]) < 4);
for (const t of dropped) TPL.splice(TPL.indexOf(t), 1);
const missing = list.map((x, i) => i).filter((i) => !seen.has(i));
// длинные шаблоны раньше коротких: точнее совпадение
TPL.sort((p, q) => q[0].length - p[0].length);
const js = `// Английский словарь интерфейса: русская фраза → English. Грузится только на английской версии сайта\n// (адрес qazgost.com или выбор EN в переключателе языка), подробности — в i18n/index.js.\n//\n// EN — фразы целиком. Число в фразе записано как {n}: «Найдено: {n}» подходит и для «Найдено: 12», и для «Найдено: 9 708».\n// EN_TEMPLATES — фразы с подстановками {a}, {b}…: «Заказ {a} завершён». Длинные шаблоны стоят раньше коротких.\n// Значки в начале фразы и знаки препинания в конце в ключ не входят — движок отбрасывает их сам.\n// Новую фразу можно дописать прямо сюда: 'русская фраза': 'English'.\n/* eslint-disable */\nexport const EN = ${JSON.stringify(EN, null, 0).replace(/","/g, '",\n"')};\n\nexport const EN_TEMPLATES = ${JSON.stringify(TPL, null, 0).replace(/\],\[/g, '],\n[')};\n`;
fs.writeFileSync('../../frontend/src/i18n/dict.en.js', js);
console.log(`переведено ${seen.size} из ${list.length}; фраз ${Object.keys(EN).length}, шаблонов ${TPL.length}; не хватает ${missing.length}; замечаний ${bad.length}; размер ${(js.length / 1024).toFixed(0)} КБ`);
bad.slice(0, 40).forEach((b) => console.log('  ' + b));
if (dropped.length) console.log('  слишком общие шаблоны (не взяты): ' + dropped.map((t) => `«${t[0]}»`).join(', '));
if (missing.length && missing.length < 60) console.log('  нет перевода для №:', missing.join(','));
