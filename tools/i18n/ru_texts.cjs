// Собирает русские тексты, которые видит гость и заказчик на оценке стоимости (язык — русский).
// Дальше fallback_check.mjs показывает, какие из них на выбранном языке выходят по-английски.
const { chromium } = require('playwright'); const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:8080', API = 'http://127.0.0.1:8080';
const post = async (path, body) => { const r = await fetch(API + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return r.json().catch(() => ({})); };
const grab = (p) => p.evaluate(() => { const CYR = /[А-Яа-яЁё]/; const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const el = n.parentElement; if (!el || el.closest('script,style,noscript,[translate=no]')) continue; const t = n.nodeValue; if (CYR.test(t)) out.push(t); } for (const a of ['placeholder', 'title', 'aria-label', 'alt']) document.querySelectorAll('[' + a + ']').forEach((e) => { const t = e.getAttribute(a) || ''; if (CYR.test(t)) out.push(t); }); return out; });
(async () => {
  const stamp = String(Date.now()).slice(-6); const all = new Map(); const add = (list, where) => list.forEach((t) => { if (!all.has(t)) all.set(t, where); });
  const b = await chromium.launch();
  for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const ctx = await b.newContext({ viewport: vp }); const p = await ctx.newPage();
    for (const url of ['/', '/catalog', '/materials', '/equipment', '/engineering', '/calc', '/lidar', '/orders', '/login', '/register']) {
      await p.goto(BASE + url, { waitUntil: 'domcontentloaded' }).catch(() => {}); await p.waitForTimeout(2200);
      await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {}); await p.waitForTimeout(500);
      add(await grab(p), url);
    }
    await ctx.close();
  }
  const reg = await post('/api/v1/auth/register', { email: `rutxt_${stamp}@test.kz`, password: 'Stend-Texts-' + stamp, name: 'Проверка Текстов', role: 'customer', phone: '+7707' + stamp + '4', city: 'Алматы', acceptTerms: true, acceptPrivacy: true, termsAccepted: true, privacyAccepted: true, consentTerms: true, consentPersonalData: true });
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(([t, u]) => { localStorage.setItem('auth_token', t); localStorage.setItem('app_currentUser', JSON.stringify(u)); }, [reg.token, reg.user]);
  const p = await ctx.newPage(); const T = (id) => p.locator(`[data-testid=${id}]`);
  await p.goto(BASE + '/customer', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(2500); add(await grab(p), 'кабинет');
  await p.getByText(/Начать оценку/).first().click(); await p.waitForSelector('[data-testid=smeta-calc]', { timeout: 15000 }); await p.waitForTimeout(1200);
  add(await grab(p), 'оценка');
  // все виды работ: у каждого свои параметры и свои строки сметы
  const tm = await p.evaluate(async () => (await (await fetch('/api/v1/estimate/techmaps')).json()));
  const walk = (x) => { if (typeof x === 'string') { if (/[А-Яа-яЁё]/.test(x)) add([x], 'справочник'); } else if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') Object.values(x).forEach(walk); };
  walk(tm);
  // все виды работ и комплексы: у каждого свои строки сметы, пояснения и допущения
  const cats = [...(tm.techmaps || []).map((c) => ({ category: c.id })), ...(tm.complexes || []).map((c) => ({ complex: c.id }))];
  for (const sel of cats) for (const city of ['Алматы', 'Астана']) {
    const r = await post('/api/v1/estimate/calc', { ...sel, geometry: { area: 30, perimeter: 22, height: 2.7, doors: 1, windows: 1 }, params: {}, city, mode: 'full' });
    walk(r);
  }
  await p.getByRole('tab', { name: /вручную/i }).click(); await T('manual-len').fill('6'); await T('manual-wid').fill('5'); await T('mode-full').click();
  await Promise.all([p.waitForResponse((r) => r.url().includes('/estimate/calc'), { timeout: 20000 }), T('smeta-calc').click()]);
  await p.waitForSelector('[data-testid=smeta-result]', { timeout: 15000 }); await p.waitForTimeout(900); add(await grab(p), 'смета');
  await b.close();
  fs.writeFileSync('ru_texts.json', JSON.stringify([...all].map(([t, where]) => ({ t, where }))));
  console.log('русских фраз собрано:', all.size, '; видов работ:', cats.length);
})();
