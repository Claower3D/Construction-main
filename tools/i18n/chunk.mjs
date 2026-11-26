import fs from 'node:fs';
const list = JSON.parse(fs.readFileSync('phrases.json', 'utf8'));
fs.mkdirSync('in', { recursive: true }); fs.mkdirSync('out', { recursive: true });
let chunk = [], size = 0, n = 0, lastFile = '';
const flush = () => { if (!chunk.length) return; n++; fs.writeFileSync(`in/${String(n).padStart(3, '0')}.txt`, chunk.join('\n') + '\n'); chunk = []; size = 0; };
list.forEach((x, i) => {
  const f = x.files[0];
  if (f !== lastFile) { chunk.push(`# ${f}`); lastFile = f; }
  const k = x.k.replace(/^T:/, '');
  chunk.push(`${i}|${k}`); size += k.length + 6;
  if (size > 6500) flush();
});
flush();
console.log('частей', n, 'фраз', list.length);
