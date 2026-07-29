const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/User/Desktop/Моя программа/новая прога от гугла/WebVersion/ai/data';
const files = fs.readdirSync(dir).filter(f => f.startsWith('wrk_') && f.endsWith('.js'));

const allKeys = {};
const allNames = {};
let total = 0;

files.forEach(f => {
    const c = fs.readFileSync(path.join(dir, f), 'utf8');
    const km = c.match(/'wrk_[a-z0-9_]+'/g) || [];
    km.forEach(k => {
        const key = k.replace(/'/g, '');
        if (!allKeys[key]) allKeys[key] = [];
        allKeys[key].push(f);
        total++;
    });
    const nm = c.match(/name:\s*'([^']+)'/g) || [];
    nm.forEach(n => {
        const name = n.replace(/name:\s*'/, '').replace(/'/, '');
        if (!allNames[name]) allNames[name] = [];
        allNames[name].push(f);
    });
});

const dk = Object.entries(allKeys).filter(([, v]) => v.length > 1);
const dn = Object.entries(allNames).filter(([, v]) => v.length > 1);

console.log('=== SUMMARY ===');
console.log('Files: ' + files.length);
console.log('Total keys: ' + total);
console.log('Unique keys: ' + Object.keys(allKeys).length);
console.log('');
console.log('=== DUPLICATE KEYS: ' + dk.length + ' ===');
dk.forEach(([k, v]) => console.log('  ' + k + ' -> ' + v.join(', ')));
console.log('');
console.log('=== DUPLICATE NAMES: ' + dn.length + ' ===');
dn.forEach(([k, v]) => console.log('  ' + k + ' -> ' + v.join(', ')));
