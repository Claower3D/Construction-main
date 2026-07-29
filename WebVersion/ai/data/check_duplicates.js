const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('mat_') && f.endsWith('.js'));

const allKeys = {};
const allNames = {};
let totalItems = 0;

files.forEach(file => {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const keyRegex = /'([a-z][a-z0-9_]+)':\s*\{/g;
    let match;
    while ((match = keyRegex.exec(content)) !== null) {
        const key = match[1];
        if (!allKeys[key]) allKeys[key] = [];
        allKeys[key].push(file);
        totalItems++;
    }
    const nameRegex = /name:\s*'([^']+)'/g;
    while ((match = nameRegex.exec(content)) !== null) {
        const name = match[1];
        if (!allNames[name]) allNames[name] = [];
        allNames[name].push(file);
    }
});

const dupKeys = Object.entries(allKeys).filter(([k, v]) => v.length > 1);
const dupNames = Object.entries(allNames).filter(([k, v]) => v.length > 1);

console.log('=== TOTAL FILES: ' + files.length);
console.log('=== TOTAL ITEMS: ' + totalItems);
console.log('=== DUPLICATE KEYS: ' + dupKeys.length);
dupKeys.forEach(([k, f]) => console.log('  KEY: ' + k + ' -> ' + f.join(', ')));
console.log('=== DUPLICATE NAMES: ' + dupNames.length);
dupNames.forEach(([n, f]) => console.log('  NAME: ' + n + ' -> ' + f.join(', ')));
