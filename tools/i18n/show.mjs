// node show.mjs <язык> <сколько> — печатает ещё не переведённые фразы «номер|русская фраза» по порядку реестра.
import fs from 'node:fs';
const [lang, count = '200', mode] = process.argv.slice(2);
const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8'));
const done = new Set();
const dir = `lang/${lang}`;
if (fs.existsSync(dir)) for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.txt'))) for (const line of fs.readFileSync(`${dir}/${f}`, 'utf8').split('\n')) { const m = line.match(/^(\d+)\|/); if (m) done.add(+m[1]); }
const rest = keys.map((k, i) => i).filter((i) => !done.has(i));
if (mode === 'stat') { const by = [0, 0, 0, 0]; rest.forEach((i) => { by[keys[i].t]++; }); console.log(`${lang}: переведено ${done.size} из ${keys.length}; осталось по очередям ${by.join(' / ')}`); }
else for (const i of rest.slice(0, +count)) console.log(`${i}|${keys[i].s}`);
