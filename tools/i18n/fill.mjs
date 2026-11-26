// дописывает пустые строки "N|" для пропущенных номеров в диапазоне (фразы, которые намеренно оставлены по-русски)
import fs from 'node:fs';
const [file, from, to] = process.argv.slice(2);
const have = new Set(fs.readFileSync(file, 'utf8').split('\n').map((l) => l.split('|')[0]).filter(Boolean));
let add = '';
for (let i = Number(from); i <= Number(to); i++) if (!have.has(String(i))) add += `${i}|\n`;
fs.appendFileSync(file, add);
console.log('добавлено пустых:', add.split('\n').length - 1);
