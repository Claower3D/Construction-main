// ============================================================
// Экспорт ПОЛНОЙ базы данных (194 файла, ~24000 позиций)
// из WebVersion/ai/data/*.js → ai-service/app/data/price_db.json
// Запуск: node _export_price_db.js
// ============================================================
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const DATA_DIR = path.join(__dirname, 'WebVersion', 'ai', 'data');
const AI_PRICE_DB = path.join(__dirname, 'WebVersion', 'ai', 'aiPriceDatabase.js');
const OUT_DIR = path.join(__dirname, 'ai-service', 'app', 'data');
const OUT_FILE = path.join(OUT_DIR, 'price_db.json');

// 1. Создаём мок-window и sandbox
const mockWindow = {};
const sandbox = { window: mockWindow, console, Date, setTimeout: () => { }, setInterval: () => { } };
vm.createContext(sandbox);

// 2. Загружаем aiPriceDatabase.js (основной прайс с MATERIALS / WORKS)
try {
    const priceDbSrc = fs.readFileSync(AI_PRICE_DB, 'utf-8');
    vm.runInContext(priceDbSrc, sandbox);
    console.log('✅ aiPriceDatabase.js загружен');
} catch (e) {
    console.warn('⚠️ aiPriceDatabase.js не найден или ошибка:', e.message);
}

// 3. Загружаем все файлы из ai/data/
const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.js') && !f.startsWith('_') && !f.startsWith('check'));
let loaded = 0, errors = 0;

for (const file of files) {
    try {
        const src = fs.readFileSync(path.join(DATA_DIR, file), 'utf-8');
        vm.runInContext(src, sandbox);
        loaded++;
    } catch (e) {
        errors++;
        console.warn(`⚠️ Ошибка в ${file}: ${e.message}`);
    }
}
console.log(`✅ Загружено ${loaded}/${files.length} файлов (ошибок: ${errors})`);

// 4. Собираем все данные по префиксам
const works = {};
const materials = {};
const equipment = {};

for (const [key, obj] of Object.entries(mockWindow)) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) continue;

    const source = key.toLowerCase();

    if (key.startsWith('AI_WRK_') || key.startsWith('AI_WORK_')) {
        for (const [code, item] of Object.entries(obj)) {
            if (item && item.name) {
                works[code] = { ...item, source };
            }
        }
    } else if (key.startsWith('AI_MAT_')) {
        for (const [code, item] of Object.entries(obj)) {
            if (item && item.name) {
                materials[code] = { ...item, source };
            }
        }
    } else if (key.startsWith('AI_EQ_')) {
        for (const [code, item] of Object.entries(obj)) {
            if (item && item.name) {
                equipment[code] = { ...item, source };
            }
        }
    }
}

// 5. Добавляем данные из AIPriceDatabase (MATERIALS + WORKS)
const priceDB = mockWindow.AIPriceDatabase;
if (priceDB) {
    if (priceDB.MATERIALS) {
        for (const [catName, cat] of Object.entries(priceDB.MATERIALS)) {
            for (const [code, item] of Object.entries(cat)) {
                if (!materials[code]) {
                    materials[code] = { ...item, source: 'aipricedatabase', group: catName };
                }
            }
        }
    }
    if (priceDB.WORKS) {
        for (const [catName, cat] of Object.entries(priceDB.WORKS)) {
            for (const [code, item] of Object.entries(cat)) {
                if (!works[code]) {
                    works[code] = { ...item, source: 'aipricedatabase', group: catName };
                }
            }
        }
    }
}

// 6. Формируем итоговый JSON
const output = {
    version: "2026.01",
    exported_at: new Date().toISOString(),
    regional_coefficients: priceDB ? priceDB.REGIONAL_COEFFICIENTS : {},
    works,
    materials,
    equipment,
    stats: {
        works_count: Object.keys(works).length,
        materials_count: Object.keys(materials).length,
        equipment_count: Object.keys(equipment).length,
        total: Object.keys(works).length + Object.keys(materials).length + Object.keys(equipment).length,
        source_files: loaded
    }
};

// 7. Сохраняем
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

console.log('\n========================================');
console.log('  ЭКСПОРТ БАЗЫ ДАННЫХ ЗАВЕРШЁН');
console.log('========================================');
console.log(`🔧 Работы:    ${output.stats.works_count.toLocaleString('ru')}`);
console.log(`🧱 Материалы: ${output.stats.materials_count.toLocaleString('ru')}`);
console.log(`🚜 Техника:   ${output.stats.equipment_count.toLocaleString('ru')}`);
console.log(`📊 ВСЕГО:     ${output.stats.total.toLocaleString('ru')}`);
console.log(`📁 Файл:      ${OUT_FILE}`);
console.log(`💾 Размер:    ${(fs.statSync(OUT_FILE).size / 1024 / 1024).toFixed(1)} МБ`);
