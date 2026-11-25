// Собирает пять мобильных приложений в одно: www/<приложение>/ + экран выбора www/index.html.
// Запуск: npm run build (из папки mobile-all). Потом: npx cap sync android → сборка APK.
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const hub = resolve(here, '..');
const root = resolve(hub, '..');
const www = join(hub, 'www');

const APPS = ['customer', 'executor', 'engineer', 'manager', 'admin'];
const only = process.argv.slice(2).filter((a) => APPS.includes(a));
const list = only.length ? only : APPS;
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(cmd, cwd) {
  console.log(`  $ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit', shell: true });
}

// шрифт стартового экрана — тот же Golos Text, что внутри приложений
const fontsSrc = join(root, 'mobile-customer', 'src', 'assets', 'fonts');
if (existsSync(fontsSrc)) {
  mkdirSync(join(www, 'fonts'), { recursive: true });
  for (const f of ['golos-text-cyrillic-wght-normal.woff2', 'golos-text-latin-wght-normal.woff2', 'OFL-GolosText.txt']) {
    if (existsSync(join(fontsSrc, f))) cpSync(join(fontsSrc, f), join(www, 'fonts', f));
  }
}

for (const app of list) {
  const src = join(root, `mobile-${app}`);
  const out = join(www, app);
  console.log(`\n=== ${app} ===`);
  if (!existsSync(join(src, 'node_modules'))) run(`${npm} install --no-audit --no-fund`, src);
  rmSync(out, { recursive: true, force: true });
  // относительные пути (--base ./): приложение работает из своей подпапки
  run(`${npx} vite build --base ./ --outDir "${out}" --emptyOutDir`, src);

  const indexPath = join(out, 'index.html');
  let html = readFileSync(indexPath, 'utf8');
  if (!html.includes('switch.js')) {
    html = html.replace('</head>', '    <script src="../switch.js" defer></script>\n  </head>');
    writeFileSync(indexPath, html);
  }
}

console.log(`\nГотово: ${list.join(', ')} → ${www}`);
