// node ordercheck.mjs <язык>
// Фразы с двумя и более группами чисел, порядок которых эвристика подтвердить не смогла — на просмотр глазами.
import fs from 'fs';
const lang = process.argv[2];
const keys = JSON.parse(fs.readFileSync('keys.json','utf8'));
const groups = (s) => s.replace(/\{n\}(\s?[×xх–\-:\/]\s?\{n\})+/g, '{n}');
const sig = (s, ru) => { const out=[]; const re=/\{n\}\s?([^\s{}(),.;（），。；：、「」一-鿿]*)/g; let m; while((m=re.exec(s))) { let t=m[1].replace(/['’].*$/,''); if(ru) t=t.replace(/кг/g,'kg').replace(/мм/g,'mm').replace(/см/g,'cm').replace(/м/g,'m').replace(/шт/g,'#').replace(/т$/,'t').replace(/ч$/,'h').replace(/л/,'l').replace(/кВт/,'kw').replace(/Вт/,'w').replace(/ТБ/,'tb').replace(/КБ/,'kb').replace(/А$/,'a'); out.push(t.toLowerCase().replace(/sa$/,'h')); } return out; };
let n=0;
for (const f of fs.readdirSync(`lang/${lang}`).filter(x=>/^\d+\.txt$/.test(x)).sort()) for (const line of fs.readFileSync(`lang/${lang}/${f}`,'utf8').split('\n')) {
  const i=line.indexOf('|'); if(i<0) continue; const id=+line.slice(0,i), tr=line.slice(i+1); const s=keys[id]?.s; if(!s||!tr) continue;
  if (/\{n\d\}/.test(tr)) continue;
  const gs=groups(s), gt=groups(tr);
  if ((gs.match(/\{n\}/g)||[]).length<2) continue;
  const a=sig(gs,true), b=sig(gt,false);
  const strong = a.length===b.length && a.every((x,k)=>x===b[k]) && new Set(a).size===a.length && a.every(x=>/[a-z₸%#]/.test(x));
  if (strong) continue;
  n++; console.log(id+'|'+s+'\n   '+tr);
}
console.error('на просмотр:', n);
