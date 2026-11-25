// Документы сметы: книга Excel и страница для печати (в окне печати её сохраняют как PDF).
// Содержимое обоих документов собирается здесь из готовой сметы — те же строки и итоги, что на экране.
// Язык документа — язык интерфейса: на английской версии сайта надписи и названия позиций переводятся
// тем же словарём, что и страница (функция tr передаётся снаружи, чтобы сборку можно было проверить отдельно).

const SCN_NAME = { eco: 'Эконом', std: 'Стандарт', prem: 'Премиум' };
const KIND_NAME = { work: 'работа', material: 'материал', equipment: 'техника' };
const same = (s) => s;

// Числа пишутся по правилам языка документа: «1 234,5» по-русски, «1,234.5» по-английски.
let numLocale = 'ru-RU';
const money = (v) => Math.round(Number(v) || 0).toLocaleString(numLocale);
const qty = (v) => (Number(v) || 0).toLocaleString(numLocale, { maximumFractionDigits: 2 });
const useLocale = (info) => { numLocale = info?.lang === 'en' ? 'en-US' : 'ru-RU'; };
// Раздел в строке сметы приходит кодом («demolition») — показываем его название.
const partName = (info, id) => info?.partTitles?.[id] || id;

export function pickScenario(result, scenarioId) {
  return result.scenarios.find((s) => s.id === scenarioId) || result.scenarios[1] || result.scenarios[0];
}

/** Доля резерва в процентах — из самой сметы, а не «всегда 10». */
export function reservePercent(sc) {
  return sc.subtotal > 0 ? Math.round((sc.reserve / sc.subtotal) * 100) : 0;
}

/** Номер документа: дата и время расчёта, чтобы сметы одного дня различались. */
export function docNumber(date = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${String(date.getFullYear()).slice(2)}${p(date.getMonth() + 1)}${p(date.getDate())}-${p(date.getHours())}${p(date.getMinutes())}`;
}

/** Имя файла без запрещённых знаков. */
export function docFileName(result, scenarioId, ext, tr = same, date = new Date()) {
  const sc = pickScenario(result, scenarioId);
  const clean = (s) => String(s).replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, '_').replace(/^_+|_+$/g, '');
  const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `${clean(tr('Смета'))}_QazGost_${clean(tr(result.title))}_${clean(tr(SCN_NAME[sc.id] || sc.name))}_${day}.${ext}`;
}

/** Общие сведения документа: что считали, где, по каким размерам. */
export function docMeta(result, scenarioId, info = {}, tr = same, date = new Date()) {
  useLocale(info);
  const sc = pickScenario(result, scenarioId);
  const g = result.geometry || {};
  const rows = [
    [tr('Вид работ'), tr(result.title)],
    [tr('Сценарий'), tr(SCN_NAME[sc.id] || sc.name)],
    [tr('Город'), `${tr(result.city)} (${tr('коэффициент')} ×${result.regionCoef})`],
    [tr('Цены на'), tr(result.priceDate)],
    [tr('Размеры'), `${tr('площадь')} ${qty(g.area)} ${tr('м²')}, ${tr('периметр')} ${qty(g.perimeter)} ${tr('м')}, ${tr('высота')} ${qty(g.height)} ${tr('м')}`
      + (g.wallArea ? `, ${tr('стены за вычетом проёмов')} ${qty(g.wallArea)} ${tr('м²')}` : '')],
  ];
  if (sc.note) rows.push([tr('Состав сценария'), sc.note.split(' · ').map((part) => tr(part)).join('; ')]);
  if (info.customer) rows.push([tr('Заказчик'), info.customer]);
  if (info.description) rows.push([tr('Описание задачи'), info.description]);
  return {
    title: `${tr('Смета')} № ${docNumber(date)}`,
    date: date.toLocaleDateString(numLocale, numLocale === 'en-US' ? { year: 'numeric', month: 'long', day: 'numeric' } : undefined),
    rows,
  };
}

/** Итоговые строки сметы. */
export function docTotals(sc, tr = same) {
  const rows = [[tr('Работы'), sc.works], [tr('Материалы'), sc.materials]];
  if (sc.equipment) rows.push([tr('Техника'), sc.equipment]);
  rows.push([tr('Итого по смете'), sc.subtotal]);
  rows.push([tr(`Резерв ${reservePercent(sc)}%`), sc.reserve]);
  rows.push([tr('Бюджет с резервом'), sc.total]);
  return rows;
}

const sourceText = (it, tr) => (it.verified ? tr(it.source) : `${tr(it.source)}${it.note ? `: ${tr(it.note)}` : ''}`);

/**
 * Листы книги Excel в виде таблиц значений (массив строк). Числа остаются числами, чтобы их можно
 * было суммировать в Excel. Возвращает [{ name, rows, widths }].
 */
export function smetaSheets(result, scenarioId, info = {}, tr = same, date = new Date()) {
  const sc = pickScenario(result, scenarioId);
  const meta = docMeta(result, scenarioId, info, tr, date);
  const sheets = [];

  const main = [[`QazGost AI — ${meta.title}`], [tr('Дата расчёта'), meta.date], ...meta.rows, [],
    ['№', tr('Раздел'), tr('Этап'), tr('Наименование'), tr('Кол-во'), tr('Ед.'), tr('Цена, ₸'), tr('Сумма, ₸'), tr('Вид'), tr('Источник цены'), tr('Как посчитан объём'), tr('Ссылка')]];
  sc.items.forEach((it, i) => main.push([i + 1, tr(partName(info, it.category)), tr(it.stage), tr(it.name), it.qty, tr(it.unit), it.price, it.total,
    tr(KIND_NAME[it.kind] || it.kind), sourceText(it, tr), tr(it.why), it.url || '']));
  main.push([]);
  docTotals(sc, tr).forEach(([label, value]) => main.push(['', '', '', label, '', '', '', value]));
  main.push([], [tr('Это предварительный расчёт: итоговая смета — после выезда инженера и замеров')]);
  sheets.push({ name: tr('Смета'), rows: main, widths: [5, 22, 22, 52, 10, 8, 12, 14, 10, 34, 60, 40] });

  const purchases = result.purchases?.[sc.id];
  if (purchases?.length) {
    const rows = [[tr('Ведомость закупки материалов')], [], [tr('Материал'), tr('Кол-во'), tr('Ед.'), tr('Цена, ₸'), tr('Сумма, ₸'), tr('Где смотрели цену'), tr('Ссылка')]];
    purchases.forEach((p) => rows.push([tr(p.name), p.qty, tr(p.unit), p.price, p.total, tr(p.source), p.url || '']));
    rows.push([], [tr('Итого'), '', '', '', purchases.reduce((s, p) => s + (Number(p.total) || 0), 0)]);
    sheets.push({ name: tr('Закупка'), rows, widths: [56, 10, 8, 12, 14, 34, 40] });
  }

  const sched = result.schedule?.[sc.id];
  if (sched?.stages?.length) {
    const rows = [[tr('График работ')], [], [tr('Раздел'), tr('Этап'), tr('Начало, день'), tr('Длительность, дн'), tr('Перерыв, дн'), tr('Причина перерыва')]];
    sched.stages.forEach((s) => rows.push([tr(s.category), tr(s.stage), s.start + 1, s.days, s.wait || '', s.why ? tr(s.why) : '']));
    rows.push([], [tr('Итого, дней'), '', '', sched.days]);
    if (sched.note) rows.push([], [tr(sched.note)]);
    sheets.push({ name: tr('График'), rows, widths: [26, 30, 14, 18, 14, 44] });
  }

  const notes = [[tr('Допущения расчёта')], ...(result.assumptions || []).map((a) => [tr(a)])];
  if (result.method) notes.push([], [tr('Как посчитано')], [tr(result.method)]);
  if (result.sources?.length) {
    notes.push([], [tr('Источники цен')], [tr('Источник'), tr('Строк в смете'), tr('Ссылка')]);
    result.sources.forEach((s) => notes.push([tr(s.source), s.count, (s.urls || [])[0] || '']));
  }
  sheets.push({ name: tr('Допущения'), rows: notes, widths: [110, 14, 50] });
  return sheets;
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Страница сметы для печати: самостоятельный HTML на белом фоне, формат A4. */
export function smetaPrintHtml(result, scenarioId, info = {}, tr = same, date = new Date()) {
  const lang = info.lang || 'ru';
  const sc = pickScenario(result, scenarioId);
  const meta = docMeta(result, scenarioId, info, tr, date);
  const multi = (result.parts || []).length > 1;

  let body = '';
  let lastGroup = null;
  sc.items.forEach((it, i) => {
    const part = tr(partName(info, it.category));
    const group = multi && part !== tr(it.stage) ? `${part} · ${tr(it.stage)}` : tr(it.stage);
    if (group !== lastGroup) { body += `<tr class="grp"><td colspan="6">${esc(group)}</td></tr>`; lastGroup = group; }
    body += `<tr><td class="n">${i + 1}</td><td><b>${esc(tr(it.name))}</b><small>${esc(tr(it.why))}</small><small class="src">${esc(sourceText(it, tr))}</small></td>`
      + `<td class="r">${esc(qty(it.qty))}</td><td>${esc(tr(it.unit))}</td><td class="r">${esc(money(it.price))}</td><td class="r">${esc(money(it.total))}</td></tr>`;
  });

  const totals = docTotals(sc, tr);
  const totalsHtml = totals.map(([label, value], i) => `<tr${i >= totals.length - 3 ? ' class="strong"' : ''}><td>${esc(label)}</td><td class="r">${esc(money(value))} ₸</td></tr>`).join('');

  let extra = '';
  const purchases = result.purchases?.[sc.id];
  if (purchases?.length) {
    extra += `<h2>${esc(tr('Ведомость закупки материалов'))}</h2><table class="t"><thead><tr><th>${esc(tr('Материал'))}</th><th class="r">${esc(tr('Кол-во'))}</th><th>${esc(tr('Ед.'))}</th><th class="r">${esc(tr('Цена, ₸'))}</th><th class="r">${esc(tr('Сумма, ₸'))}</th></tr></thead><tbody>`
      + purchases.map((p) => `<tr><td>${esc(tr(p.name))}<small class="src">${esc(tr(p.source))}</small></td><td class="r">${esc(qty(p.qty))}</td><td>${esc(tr(p.unit))}</td><td class="r">${esc(money(p.price))}</td><td class="r">${esc(money(p.total))}</td></tr>`).join('')
      + '</tbody></table>';
  }
  const sched = result.schedule?.[sc.id];
  if (sched?.stages?.length) {
    extra += `<h2>${esc(tr('График работ'))} — ${esc(qty(sched.days))} ${esc(tr('дн'))}</h2><table class="t"><thead><tr><th>${esc(tr('Этап'))}</th><th class="r">${esc(tr('Начало, день'))}</th><th class="r">${esc(tr('Длительность, дн'))}</th><th>${esc(tr('Перерыв, дн'))}</th></tr></thead><tbody>`
      + sched.stages.map((s) => `<tr><td>${esc(multi && tr(s.category) !== tr(s.stage) ? `${tr(s.category)} · ${tr(s.stage)}` : tr(s.stage))}</td><td class="r">${esc(qty(s.start + 1))}</td><td class="r">${esc(qty(s.days))}</td><td>${s.wait ? `${esc(qty(s.wait))}${s.why ? ` — ${esc(tr(s.why))}` : ''}` : ''}</td></tr>`).join('')
      + '</tbody></table>';
    if (sched.note) extra += `<p class="note">${esc(tr(sched.note))}</p>`;
  }
  if (result.assumptions?.length) extra += `<h2>${esc(tr('Допущения расчёта'))}</h2><ul>${result.assumptions.map((a) => `<li>${esc(tr(a))}</li>`).join('')}</ul>`;
  if (result.sources?.length) extra += `<h2>${esc(tr('Источники цен'))}</h2><ul>${result.sources.map((s) => `<li>${esc(tr(s.source))} — ${esc(tr('Строк в смете').toLowerCase())}: ${esc(String(s.count))}${(s.urls || [])[0] ? ` · <span class="url">${esc(s.urls[0])}</span>` : ''}</li>`).join('')}</ul>`;

  return `<!DOCTYPE html>
<html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(docFileName(result, scenarioId, 'pdf', tr, date).replace(/\.pdf$/, ''))}</title>
<style>
  @page { size: A4; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 20px; font: 12px/1.45 -apple-system, "Segoe UI", Roboto, Arial, sans-serif; color: #15121f; background: #fff; }
  .page { max-width: 190mm; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; padding-bottom: 10px; border-bottom: 2px solid #2b1f5c; }
  .brand { font-size: 20px; font-weight: 800; color: #2b1f5c; letter-spacing: -0.01em; }
  .brand span { display: block; font-size: 11px; font-weight: 500; color: #5d5876; letter-spacing: 0; }
  h1 { margin: 0; font-size: 18px; text-align: right; }
  h1 span { display: block; font-size: 12px; font-weight: 500; color: #5d5876; }
  h2 { margin: 18px 0 6px; font-size: 14px; color: #2b1f5c; break-after: avoid; }
  .meta { width: 100%; margin: 12px 0 14px; border-collapse: collapse; }
  .meta td { padding: 3px 0; vertical-align: top; }
  .meta td:first-child { width: 150px; color: #5d5876; }
  table.t { width: 100%; border-collapse: collapse; }
  .t th { padding: 6px 6px; border-bottom: 1.5px solid #2b1f5c; font-size: 11px; text-align: left; color: #2b1f5c; }
  .t td { padding: 5px 6px; border-bottom: 1px solid #e3e0ee; vertical-align: top; }
  .t tr { break-inside: avoid; }
  .t thead { display: table-header-group; }
  .t .grp td { padding-top: 10px; background: #f3f1fa; font-weight: 700; color: #2b1f5c; }
  .t .grp { break-after: avoid; page-break-after: avoid; }
  .r { text-align: right; white-space: nowrap; }
  .n { width: 26px; color: #5d5876; }
  small { display: block; color: #5d5876; font-size: 10.5px; }
  small.src { color: #8a84a3; }
  .totals { width: 320px; margin: 12px 0 0 auto; border-collapse: collapse; break-inside: avoid; }
  .totals td { padding: 4px 6px; }
  .totals .strong td { font-weight: 700; }
  .totals tr:last-child td { border-top: 1.5px solid #2b1f5c; font-size: 14px; color: #2b1f5c; }
  ul { margin: 4px 0; padding-left: 18px; }
  li { margin: 2px 0; }
  .url { color: #5d5876; word-break: break-all; }
  .note, footer { color: #5d5876; font-size: 11px; }
  footer { margin-top: 20px; padding-top: 8px; border-top: 1px solid #e3e0ee; }
  .bar { position: sticky; top: 0; display: flex; gap: 10px; justify-content: center; padding: 10px; margin: -20px -20px 16px; background: #2b1f5c; }
  .bar button { padding: 10px 18px; border: 0; border-radius: 10px; background: #f2b84b; color: #1c1203; font: 700 14px/1 inherit; cursor: pointer; }
  .bar button.ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.5); }
  @media print { body { padding: 0; } .bar { display: none; } }
</style></head>
<body>
<div class="bar"><button type="button" onclick="window.print()">${esc(tr('Печать / сохранить в PDF'))}</button><button type="button" class="ghost" onclick="window.close()">${esc(tr('Закрыть'))}</button></div>
<div class="page">
<header><div class="brand">QazGost AI<span>${esc(tr('сметы по нормам РК'))} · qazgost.kz</span></div><h1>${esc(meta.title)}<span>${esc(meta.date)}</span></h1></header>
<table class="meta">${meta.rows.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</table>
<table class="t"><thead><tr><th class="n">№</th><th>${esc(tr('Позиция и как посчитан объём'))}</th><th class="r">${esc(tr('Кол-во'))}</th><th>${esc(tr('Ед.'))}</th><th class="r">${esc(tr('Цена, ₸'))}</th><th class="r">${esc(tr('Сумма, ₸'))}</th></tr></thead><tbody>${body}</tbody></table>
<table class="totals">${totalsHtml}</table>
${extra}
<footer>${esc(tr('Это предварительный расчёт: итоговая смета — после выезда инженера и замеров'))}. ${esc(tr('Цены — рыночные, с источником у каждой строки'))}. QazGost AI · qazgost.kz · WhatsApp +7 771 698 3869</footer>
</div>
</body></html>`;
}

/** Скачать смету книгой Excel (.xlsx). XLSX — загруженная библиотека SheetJS. */
export function saveSmetaXlsx(XLSX, result, scenarioId, info, tr = same) {
  const wb = XLSX.utils.book_new();
  for (const sheet of smetaSheets(result, scenarioId, info, tr)) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws['!cols'] = sheet.widths.map((wch) => ({ wch }));
    XLSX.utils.book_append_sheet(wb, ws, String(sheet.name).slice(0, 31));
  }
  XLSX.writeFile(wb, docFileName(result, scenarioId, 'xlsx', tr), { compression: true });
}

/**
 * Открыть смету для печати. Окно открывается сразу по нажатию (иначе браузер его заблокирует);
 * возвращает false, если всплывающее окно запрещено, — тогда страница показывает подсказку.
 */
export function openSmetaPrint(result, scenarioId, info, tr = same) {
  const html = smetaPrintHtml(result, scenarioId, info, tr);
  const win = window.open('', '_blank');
  if (!win) return false;
  win.document.open();
  win.document.write(html);
  win.document.close();
  // даём странице отрисоваться и сразу предлагаем печать; кнопка наверху остаётся на случай отмены
  win.addEventListener('load', () => setTimeout(() => { try { win.focus(); win.print(); } catch (e) { /* печать можно вызвать кнопкой */ } }, 250));
  return true;
}
