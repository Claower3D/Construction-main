// Скрипт для подсчёта позиций и поиска дубликатов
const fs = require('fs');
const path = require('path');

const dataDir = __dirname;
const files = fs.readdirSync(dataDir).filter(f => f.startsWith('wrk_') && f.endsWith('.js'));

let totalItems = 0;
let fileStats = [];
let allNames = {}; // name -> [{file, key}]
let allKeys = {};  // key -> [{file}]

for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    // Count price: occurrences
    const priceMatches = content.match(/price:/g);
    const count = priceMatches ? priceMatches.length : 0;
    totalItems += count;
    fileStats.push({ file, count });

    // Extract names and keys
    const keyRegex = /'([^']+)':\s*\{\s*name:\s*'([^']+)'/g;
    let m;
    while ((m = keyRegex.exec(content)) !== null) {
        const key = m[1];
        const name = m[2];

        if (!allKeys[key]) allKeys[key] = [];
        allKeys[key].push(file);

        if (!allNames[name]) allNames[name] = [];
        allNames[name].push({ file, key });
    }
}

console.log('=== СТАТИСТИКА ===');
console.log('Файлов wrk_*.js:', files.length);
console.log('Всего позиций (price:):', totalItems);
console.log('');

// Duplicate keys
const dupKeys = Object.entries(allKeys).filter(([k, v]) => v.length > 1);
console.log('=== ДУБЛИРУЮЩИЕСЯ КЛЮЧИ ===');
console.log('Количество:', dupKeys.length);
for (const [key, files] of dupKeys.slice(0, 50)) {
    console.log(`  "${key}" -> ${files.join(', ')}`);
}
console.log('');

// Duplicate names
const dupNames = Object.entries(allNames).filter(([k, v]) => v.length > 1);
console.log('=== ДУБЛИРУЮЩИЕСЯ ИМЕНА ===');
console.log('Количество:', dupNames.length);
for (const [name, entries] of dupNames.slice(0, 80)) {
    const locs = entries.map(e => `${e.file}(${e.key})`).join(', ');
    console.log(`  "${name}" -> ${locs}`);
}

// Files sorted by count
console.log('');
console.log('=== ФАЙЛЫ ПО РАЗМЕРУ ===');
fileStats.sort((a, b) => b.count - a.count);
for (const s of fileStats) {
    console.log(`  ${s.file}: ${s.count}`);
}
