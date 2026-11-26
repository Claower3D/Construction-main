// node fallback_ids.mjs <язык> — номера фраз (keys.json), которые гость видит по-английски: список на перевод
import fs from 'node:fs';
const lang = process.argv[2];
const keys = JSON.parse(fs.readFileSync('keys.json', 'utf8')); const idOf = new Map(keys.map((k, i) => [k.s, i]));
const own = (await import(`../../frontend/src/i18n/dict.${lang}.js`)); const en = (await import('../../frontend/src/i18n/dict.en.js'));
const list = JSON.parse(fs.readFileSync('ru_texts.json', 'utf8'));
const NUM = /\d+(?:[   .,]\d+)*/g;
const EDGE = /^([\s\p{Extended_Pictographic}️‍←→➔↗•·✓✕✅⚠]*)([\s\S]*?)([\s→➔↗.,:;!?…*]*)$/u;
const seen = new Set();
for (const { t } of list) {
  const norm = t.replace(/\s+/g, ' ').trim(); const core = norm.match(EDGE)[2];
  for (const cand of [norm, core, norm.replace(NUM, '{n}'), core.replace(NUM, '{n}')]) {
    const id = idOf.get(cand); if (id == null || seen.has(id)) continue;
    if (own.T[keys[id].s] == null && en.EN[keys[id].s] != null) { seen.add(id); }
  }
}
[...seen].sort((a, b) => a - b).forEach((id) => console.log(`${id}|${keys[id].s}`));
