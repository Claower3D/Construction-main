// === Скрипт удаления дубликатов ИМЁН (оставляет первое вхождение, удаляет остальные) ===
const fs = require('fs');
const path = require('path');

const dataDir = __dirname;
const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith('wrk_') && f.endsWith('.js'))
    .sort(); // алфавитный порядок для предсказуемости

// 1) Собираем ВСЕ позиции: имя -> первый файл+ключ
const seenNames = {};      // name -> { file, key }  (первое вхождение)
const toRemove = [];       // { file, key, name }     (дубликаты для удаления)

for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const regex = /'([^']+)':\s*\{\s*name:\s*'([^']+)'/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
        const key = m[1];
        const name = m[2];
        if (!seenNames[name]) {
            seenNames[name] = { file, key };
        } else {
            // Это дубликат имени — пометить для удаления
            toRemove.push({ file, key, name });
        }
    }
}

console.log('=== СТАТИСТИКА ===');
console.log('Уникальных имён:', Object.keys(seenNames).length);
console.log('Дубликатов имён для удаления:', toRemove.length);

// 2) Группируем удаления по файлу
const removeByFile = {};
for (const item of toRemove) {
    if (!removeByFile[item.file]) removeByFile[item.file] = [];
    removeByFile[item.file].push(item.key);
}

console.log('Файлов затронуто:', Object.keys(removeByFile).length);

// 3) Удаляем строки из файлов
let totalRemoved = 0;
for (const [file, keys] of Object.entries(removeByFile)) {
    const filePath = path.join(dataDir, file);
    let content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const keySet = new Set(keys);

    const newLines = lines.filter(line => {
        // Проверяем, содержит ли строка один из ключей для удаления
        for (const key of keySet) {
            if (line.includes("'" + key + "'") && line.includes('price:')) {
                totalRemoved++;
                keySet.delete(key); // удаляем из сета чтобы не удалить другие строки с похожим текстом
                return false; // убрать эту строку
            }
        }
        return true; // оставить строку
    });

    if (newLines.length !== lines.length) {
        fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');
        console.log('  ' + file + ': удалено ' + (lines.length - newLines.length) + ' строк');
    }
}

console.log('');
console.log('=== ИТОГО УДАЛЕНО: ' + totalRemoved + ' позиций ===');

// 4) Пересчитаем
let newTotal = 0;
for (const file of files) {
    const content = fs.readFileSync(path.join(dataDir, file), 'utf-8');
    const priceMatches = content.match(/price:/g);
    newTotal += priceMatches ? priceMatches.length : 0;
}
console.log('Новое кол-во позиций wrk_*.js: ' + newTotal);
