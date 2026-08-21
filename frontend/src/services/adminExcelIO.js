// Excel IO Utility for Admin Catalog Management using SheetJS (XLSX)
import * as XLSX from 'xlsx';

/**
 * Export catalog price list to genuine binary Excel (.xlsx) format with Summary sheet
 */
export function exportPricesToExcel(items, filename = 'qazgost_prices_catalog.xlsx') {
  if (!items || items.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // 1. Prepare main items rows
  const rows = items.map((item) => ({
    'Код позиции': item.id || item.code || '',
    'Наименование работы / материала': item.name || '',
    'Категория': item.category || 'Общие',
    'Единица измерения': item.unit || 'шт',
    'Трудоемкость (ч-ч)': Number(item.laborNorm || item.labor || 0),
    'Базовая цена (₸)': Number(item.price || 0),
    'Регион': item.region || 'Все регионы'
  }));

  // 2. Prepare summary stats rows
  const totalItems = items.length;
  const prices = items.map((i) => Number(i.price || 0));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / (totalItems || 1));

  const summaryRows = [
    { 'Показатель': 'Всего позиций в выгрузке', 'Значение': totalItems },
    { 'Показатель': 'Минимальная цена (₸)', 'Значение': minPrice },
    { 'Показатель': 'Максимальная цена (₸)', 'Значение': maxPrice },
    { 'Показатель': 'Средняя базовая цена (₸)', 'Значение': avgPrice },
    { 'Показатель': 'Дата и время выгрузки', 'Значение': new Date().toLocaleString() }
  ];

  // 3. Create Workbook
  const wb = XLSX.utils.book_new();

  // Main Sheet
  const wsMain = XLSX.utils.json_to_sheet(rows);
  wsMain['!cols'] = [
    { wch: 16 }, // Код позиции
    { wch: 50 }, // Наименование
    { wch: 24 }, // Категория
    { wch: 18 }, // Единица измерения
    { wch: 20 }, // Трудоемкость
    { wch: 18 }, // Базовая цена
    { wch: 18 }  // Регион
  ];
  XLSX.utils.book_append_sheet(wb, wsMain, 'Каталог расценок');

  // Summary Sheet
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 32 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводная статистика');

  // 4. Download valid binary .xlsx file
  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Export complete 3-sheet catalog (Works, Materials, All)
 */
export function exportAll3SheetsExcel(pricesList, filename = 'qazgost_full_3sheets_catalog.xlsx') {
  if (!pricesList || pricesList.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  const wb = XLSX.utils.book_new();

  // Sheet 1: All Items
  const allRows = pricesList.map((item) => ({
    'Код позиции': item.id || item.code || '',
    'Наименование работы / материала': item.name || '',
    'Категория': item.category || 'Общие',
    'Единица измерения': item.unit || 'шт',
    'Трудоемкость (ч-ч)': Number(item.laborNorm || item.labor || 0),
    'Базовая цена (₸)': Number(item.price || 0),
    'Регион': item.region || 'Все регионы'
  }));
  const wsAll = XLSX.utils.json_to_sheet(allRows);
  wsAll['!cols'] = [{ wch: 16 }, { wch: 50 }, { wch: 24 }, { wch: 18 }, { wch: 20 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsAll, 'Общий каталог');

  // Sheet 2: Works
  const works = pricesList.filter((p) => (p.category && p.category.toLowerCase().includes('работ')) || (p.id && String(p.id).startsWith('E')));
  const workRows = (works.length > 0 ? works : pricesList).map((item) => ({
    'Код работы': item.id || item.code || '',
    'Наименование работы': item.name || '',
    'Категория': item.category || 'Работы',
    'Единица измерения': item.unit || 'м²',
    'Трудоемкость (ч-ч)': Number(item.laborNorm || item.labor || 0),
    'Базовая цена (₸)': Number(item.price || 0)
  }));
  const wsWorks = XLSX.utils.json_to_sheet(workRows);
  wsWorks['!cols'] = [{ wch: 16 }, { wch: 50 }, { wch: 24 }, { wch: 18 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsWorks, 'Строительные работы');

  // Sheet 3: Materials
  const materials = pricesList.filter((p) => (p.category && p.category.toLowerCase().includes('материал')) || (p.id && String(p.id).startsWith('M')));
  const matRows = (materials.length > 0 ? materials : pricesList).map((item) => ({
    'Код материала': item.id || item.code || '',
    'Наименование материала': item.name || '',
    'Категория': item.category || 'Материалы',
    'Единица измерения': item.unit || 'шт',
    'Базовая цена (₸)': Number(item.price || 0)
  }));
  const wsMats = XLSX.utils.json_to_sheet(matRows);
  wsMats['!cols'] = [{ wch: 16 }, { wch: 50 }, { wch: 24 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, wsMats, 'Строительные материалы');

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * Parse uploaded Excel (.xlsx, .xls) / CSV file into items list
 */
export async function parseExcelOrCsvFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const parsedItems = [];
        json.forEach((row, idx) => {
          if (idx === 0 || !row || row.length < 2) return;
          const code = String(row[0] || '').trim();
          const name = String(row[1] || '').trim();
          const unit = String(row[2] || 'м²').trim();
          const priceStr = String(row[3] || '1000').replace(/[^\d.]/g, '');
          const price = parseFloat(priceStr) || 1000;
          const category = String(row[4] || 'Строительные работы').trim();

          if (code && name) {
            parsedItems.push({
              id: code,
              code: code,
              name: name,
              unit: unit,
              price: price,
              category: category,
              laborNorm: 1.2,
              region: 'Казахстан',
            });
          }
        });
        resolve(parsedItems);
      } catch (err) {
        console.error('Excel parse error:', err);
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * ──────────────────────────────────────────────────────────────────────────
 * 1. EXPORT ACTS OF COMPLETED WORKS (АКТЫ КС-2, КС-3, СКРЫТЫХ РАБОТ)
 * ──────────────────────────────────────────────────────────────────────────
 */
export function exportActsToExcel(actsList, filename = 'qazgost_acts_registry_ks2_ks3.xlsx') {
  if (!actsList || actsList.length === 0) {
    alert('Нет актов для экспорта');
    return;
  }

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Main Acts Registry ──
  const mainRows = actsList.map((act) => ({
    '№ Акта': act.id || act.code || '',
    'Тип акта': act.type || 'Акт КС-2',
    'Объект строительства': act.objectName || act.object || '',
    'Заказчик (ТОО/ФЛ)': act.customer || '',
    'БИН/ИИН Заказчика': act.customerBin || '—',
    'Генподрядчик': act.contractor || '',
    'БИН Подрядчика': act.contractorBin || '—',
    'Дата составления': act.date || new Date().toLocaleDateString(),
    'Период выполнения': act.period || 'Текущий месяц',
    'Сумма без НДС (₸)': Number(act.amountNet || Math.round((act.amount || 0) / 1.12)),
    'НДС 12% (₸)': Number(act.vat || Math.round((act.amount || 0) - (act.amount || 0) / 1.12)),
    'Итого с НДС (₸)': Number(act.amount || 0),
    'Статус ЭЦП': act.status || 'Подписан ЭЦП',
    'Подписант': act.signedBy || 'Аскаров Б. К. (Гендиректор)'
  }));

  const wsMain = XLSX.utils.json_to_sheet(mainRows);
  wsMain['!cols'] = [
    { wch: 18 }, // № Акта
    { wch: 16 }, // Тип
    { wch: 30 }, // Объект
    { wch: 28 }, // Заказчик
    { wch: 18 }, // БИН Заказчика
    { wch: 28 }, // Генподрядчик
    { wch: 18 }, // БИН Подрядчика
    { wch: 16 }, // Дата
    { wch: 20 }, // Период
    { wch: 20 }, // Сумма без НДС
    { wch: 16 }, // НДС
    { wch: 20 }, // Итого
    { wch: 18 }, // Статус
    { wch: 32 }  // Подписант
  ];
  XLSX.utils.book_append_sheet(wb, wsMain, 'Реестр Актов КС-2 и КС-3');

  // ── Sheet 2: Itemized Breakdown of Works ──
  const itemRows = [];
  actsList.forEach((act) => {
    const items = act.items || [
      { name: `Комплекс СМР: ${act.objectName || 'Объект'} (Этап)`, unit: 'компл', qty: 1, price: act.amount || 1000000, total: act.amount || 1000000, code: 'СНиП-РК-8.02' }
    ];
    items.forEach((item, idx) => {
      itemRows.push({
        '№ Акта': act.id || act.code || '',
        '№ п/п': idx + 1,
        'Обоснование (ГЭСН/СНиП)': item.code || 'ГЭСН-2026',
        'Наименование работ / затрат': item.name || '',
        'Ед. изм.': item.unit || 'м²',
        'Количество': Number(item.qty || 1),
        'Цена за ед. (₸)': Number(item.price || 0),
        'Сумма (₸)': Number(item.total || ((item.qty || 1) * (item.price || 0)))
      });
    });
  });

  const wsItems = XLSX.utils.json_to_sheet(itemRows);
  wsItems['!cols'] = [
    { wch: 18 },
    { wch: 8 },
    { wch: 24 },
    { wch: 45 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Детализация позиций КС-2');

  // ── Sheet 3: Summary Totals ──
  const totalSum = actsList.reduce((acc, a) => acc + Number(a.amount || 0), 0);
  const totalVat = Math.round(totalSum - totalSum / 1.12);
  const totalNet = totalSum - totalVat;

  const summaryRows = [
    { 'Показатель': 'Всего оформлено актов (шт)', 'Значение': actsList.length },
    { 'Показатель': 'Сумма выполненных работ без НДС (₸)', 'Значение': totalNet },
    { 'Показатель': 'Сумма налога на добавленную стоимость НДС 12% (₸)', 'Значение': totalVat },
    { 'Показатель': 'ИТОГО выполнено по актам с НДС (₸)', 'Значение': totalSum },
    { 'Показатель': 'Сформировано в системе', 'Значение': 'QAZGOST AI Enterprise Cloud' },
    { 'Показатель': 'Дата и время выгрузки', 'Значение': new Date().toLocaleString() }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = [{ wch: 48 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Сводный итог по актам');

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * ──────────────────────────────────────────────────────────────────────────
 * 2. EXPORT INVOICES & ESCROW TRANCHES (СЧЕТА НА ОПЛАТУ, ИНВОЙСЫ, ЭСКРОУ)
 * ──────────────────────────────────────────────────────────────────────────
 */
export function exportInvoicesToExcel(invoicesList, filename = 'qazgost_invoices_and_bills.xlsx') {
  if (!invoicesList || invoicesList.length === 0) {
    alert('Нет счетов для экспорта');
    return;
  }

  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Invoices Registry ──
  const invoiceRows = invoicesList.map((inv) => ({
    '№ Счета': inv.id || inv.code || '',
    'Тип документа': inv.type || 'Счет на оплату',
    'Дата выставления': inv.date || new Date().toLocaleDateString(),
    'Срок оплаты (Дедлайн)': inv.dueDate || 'В течение 3 банковских дней',
    'Назначение платежа': inv.purpose || 'Оплата строительно-монтажных работ',
    'Объект': inv.objectName || inv.object || 'Объект заказчика',
    'Плательщик (Заказчик)': inv.payer || '',
    'БИН/ИИН Плательщика': inv.payerBin || '—',
    'Получатель (Поставщик)': inv.receiver || 'ТОО «QAZGOST AI»',
    'БИН Получателя': inv.receiverBin || '240140029182',
    'Банк / ИИК': inv.bankAccount || 'KZ88926180119X00234 (Halyk Bank)',
    'Сумма без НДС (₸)': Number(inv.amountNet || Math.round((inv.amount || 0) / 1.12)),
    'НДС 12% (₸)': Number(inv.vat || Math.round((inv.amount || 0) - (inv.amount || 0) / 1.12)),
    'Итого к оплате (₸)': Number(inv.amount || 0),
    'Статус оплаты': inv.status || 'Оплачен (Эскроу)',
    'Способ оплаты': inv.paymentMethod || 'Эскроу QazGost / Kaspi Pay'
  }));

  const wsInvoices = XLSX.utils.json_to_sheet(invoiceRows);
  wsInvoices['!cols'] = [
    { wch: 18 }, // № Счета
    { wch: 20 }, // Тип
    { wch: 16 }, // Дата
    { wch: 22 }, // Дедлайн
    { wch: 35 }, // Назначение
    { wch: 26 }, // Объект
    { wch: 26 }, // Плательщик
    { wch: 18 }, // БИН Плательщика
    { wch: 26 }, // Получатель
    { wch: 18 }, // БИН Получателя
    { wch: 32 }, // Банк
    { wch: 20 }, // Без НДС
    { wch: 16 }, // НДС
    { wch: 20 }, // Итого
    { wch: 20 }, // Статус
    { wch: 26 }  // Способ
  ];
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'Реестр счетов на оплату');

  // ── Sheet 2: Financial Stats ──
  const totalInvoiced = invoicesList.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const paidInvoices = invoicesList.filter(i => (i.status || '').toLowerCase().includes('оплач') || (i.status || '').toLowerCase().includes('эскроу'));
  const totalPaid = paidInvoices.reduce((acc, i) => acc + Number(i.amount || 0), 0);
  const totalPending = totalInvoiced - totalPaid;

  const finSummary = [
    { 'Финансовый показатель': 'Всего выставлено счетов (шт)', 'Значение': invoicesList.length },
    { 'Финансовый показатель': 'Общая сумма выставленных счетов с НДС (₸)', 'Значение': totalInvoiced },
    { 'Финансовый показатель': 'Оплачено и заблокировано в Эскроу (₸)', 'Значение': totalPaid },
    { 'Финансовый показатель': 'Ожидает оплаты / В обработке (₸)', 'Значение': totalPending },
    { 'Финансовый показатель': 'Расчетный НДС 12% (₸)', 'Значение': Math.round(totalInvoiced - totalInvoiced / 1.12) },
    { 'Финансовый показатель': 'Платформа эмиссии', 'Значение': 'QAZGOST AI Finance Gateway' },
    { 'Финансовый показатель': 'Дата генерации выгрузки', 'Значение': new Date().toLocaleString() }
  ];
  const wsFin = XLSX.utils.json_to_sheet(finSummary);
  wsFin['!cols'] = [{ wch: 48 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(wb, wsFin, 'Финансовый свод');

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * ──────────────────────────────────────────────────────────────────────────
 * 3. EXPORT CONTRACTS & LEGAL AGREEMENTS (РЕЕСТР ДОГОВОРОВ ПОДРЯДА)
 * ──────────────────────────────────────────────────────────────────────────
 */
export function exportContractsToExcel(contractsList, filename = 'qazgost_contracts_registry.xlsx') {
  if (!contractsList || contractsList.length === 0) {
    alert('Нет договоров для экспорта');
    return;
  }

  const wb = XLSX.utils.book_new();

  const contractRows = contractsList.map((c) => ({
    '№ Договора': c.id || c.code || '',
    'Предмет договора': c.subject || 'Строительный подряд',
    'Объект': c.objectName || c.object || '',
    'Заказчик': c.customer || '',
    'Подрядчик': c.contractor || '',
    'Дата заключения': c.startDate || c.date || '',
    'Срок сдачи': c.endDate || '',
    'Сумма договора (₸)': Number(c.amount || 0),
    'Аванс (₸)': Number(c.advance || 0),
    'Эскроу-депозит (₸)': Number(c.escrowDeposit || c.amount || 0),
    'Статус исполнения': c.status || 'В работе',
    'Гарантийный срок': c.warranty || '36 месяцев'
  }));

  const ws = XLSX.utils.json_to_sheet(contractRows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 32 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 18 },
    { wch: 20 },
    { wch: 18 },
    { wch: 18 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Договоры подряда');

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}

/**
 * ──────────────────────────────────────────────────────────────────────────
 * 4. EXPORT SINGLE DOCUMENT TO EXCEL (ОДИН КОНКРЕТНЫЙ АКТ ИЛИ СЧЕТ)
 * ──────────────────────────────────────────────────────────────────────────
 */
export function exportSingleDocumentExcel(doc) {
  if (!doc) return;

  const isAct = (doc.type || '').toLowerCase().includes('акт') || (doc.id || '').startsWith('АКТ') || (doc.id || '').startsWith('ACT');
  const wb = XLSX.utils.book_new();

  // Header info table
  const headerInfo = [
    { 'Реквизит': 'Наименование документа', 'Значение': `${doc.type || (isAct ? 'Акт выполненных работ КС-2' : 'Счет на оплату')} № ${doc.id || doc.code}` },
    { 'Реквизит': 'Дата документа', 'Значение': doc.date || new Date().toLocaleDateString() },
    { 'Реквизит': 'Объект строительства', 'Значение': doc.objectName || doc.object || 'ЖК Nomad Palace' },
    { 'Реквизит': 'Заказчик', 'Значение': doc.customer || doc.payer || 'ТОО «Prime Development KZ»' },
    { 'Реквизит': 'Подрядчик / Исполнитель', 'Значение': doc.contractor || doc.receiver || 'ТОО «QAZGOST AI»' },
    { 'Реквизит': 'Сумма без НДС', 'Значение': `${(doc.amountNet || Math.round((doc.amount || 0) / 1.12)).toLocaleString()} ₸` },
    { 'Реквизит': 'НДС 12%', 'Значение': `${(doc.vat || Math.round((doc.amount || 0) - (doc.amount || 0) / 1.12)).toLocaleString()} ₸` },
    { 'Реквизит': 'ВСЕГО К ОПЛАТЕ С НДС', 'Значение': `${(doc.amount || 0).toLocaleString()} ₸` },
    { 'Реквизит': 'Статус', 'Значение': doc.status || 'Подписан ЭЦП / Оплачен' }
  ];

  const wsHeader = XLSX.utils.json_to_sheet(headerInfo);
  wsHeader['!cols'] = [{ wch: 30 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsHeader, 'Паспорт документа');

  // Items table
  const items = doc.items || [
    { name: `Выполнение этапа: ${doc.purpose || doc.objectName || 'СМР'}`, unit: 'компл', qty: 1, price: doc.amount || 500000, total: doc.amount || 500000 }
  ];
  const itemsRows = items.map((it, idx) => ({
    '№ п/п': idx + 1,
    'Наименование работ / услуг / материалов': it.name,
    'Единица': it.unit || 'м²',
    'Объем': Number(it.qty || 1),
    'Цена за ед. (₸)': Number(it.price || 0),
    'Сумма без скидки (₸)': Number(it.total || ((it.qty || 1) * (it.price || 0)))
  }));
  const wsItems = XLSX.utils.json_to_sheet(itemsRows);
  wsItems['!cols'] = [{ wch: 8 }, { wch: 50 }, { wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsItems, 'Спецификация позиций');

  const filename = `${doc.id || 'Документ'}_${(doc.type || 'Экспорт').replace(/[^\wа-яА-Я0-9]/g, '_')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * ──────────────────────────────────────────────────────────────────────────
 * 5. EXPORT FULL AUDIT DOCS PACKAGE (ALL-IN-ONE MASTER EXCEL WORKBOOK)
 * ──────────────────────────────────────────────────────────────────────────
 */
export function exportAllDocumentsPackageExcel(allData = {}, filename = 'qazgost_full_documents_package_2026.xlsx') {
  const acts = allData.acts || [];
  const invoices = allData.invoices || [];
  const contracts = allData.contracts || [];

  const wb = XLSX.utils.book_new();

  // 1. Acts Sheet
  if (acts.length > 0) {
    const actRows = acts.map(a => ({
      '№ Акта': a.id || a.code,
      'Тип': a.type || 'КС-2',
      'Объект': a.objectName || a.object,
      'Заказчик': a.customer,
      'Подрядчик': a.contractor,
      'Дата': a.date,
      'Сумма с НДС (₸)': Number(a.amount || 0),
      'Статус': a.status
    }));
    const wsA = XLSX.utils.json_to_sheet(actRows);
    wsA['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 28 }, { wch: 24 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsA, '1. Акты КС-2 и КС-3');
  }

  // 2. Invoices Sheet
  if (invoices.length > 0) {
    const invRows = invoices.map(i => ({
      '№ Счета': i.id || i.code,
      'Тип': i.type || 'Счет на оплату',
      'Назначение': i.purpose,
      'Плательщик': i.payer,
      'Получатель': i.receiver,
      'Дата': i.date,
      'Сумма с НДС (₸)': Number(i.amount || 0),
      'Статус': i.status
    }));
    const wsI = XLSX.utils.json_to_sheet(invRows);
    wsI['!cols'] = [{ wch: 18 }, { wch: 18 }, { wch: 32 }, { wch: 24 }, { wch: 24 }, { wch: 14 }, { wch: 18 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, wsI, '2. Счета и Эскроу');
  }

  // 3. Contracts Sheet
  if (contracts.length > 0) {
    const cRows = contracts.map(c => ({
      '№ Договора': c.id || c.code,
      'Предмет': c.subject,
      'Объект': c.objectName || c.object,
      'Заказчик': c.customer,
      'Подрядчик': c.contractor,
      'Сумма (₸)': Number(c.amount || 0),
      'Статус': c.status
    }));
    const wsC = XLSX.utils.json_to_sheet(cRows);
    wsC['!cols'] = [{ wch: 18 }, { wch: 28 }, { wch: 26 }, { wch: 24 }, { wch: 24 }, { wch: 18 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsC, '3. Договоры');
  }

  const safeFilename = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, safeFilename);
}
