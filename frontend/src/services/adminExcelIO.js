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
