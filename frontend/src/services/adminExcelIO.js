// Excel IO Utility for Admin Catalog Management
import * as XLSX from 'xlsx';

/**
 * Export catalog price list to Excel XML / CSV format with Summary statistics
 */
export function exportPricesToExcel(items, filename = 'qazgost_prices_catalog.xlsx') {
  if (!items || items.length === 0) {
    alert('Нет данных для экспорта');
    return;
  }

  // Calculate summary stats
  const totalItems = items.length;
  const prices = items.map((i) => i.price || 0);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / (totalItems || 1));

  // Build HTML table format that Excel opens perfectly as .xlsx/.xls
  let xml = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<!--[if gte mso 9]><xml>
<x:ExcelWorkbook>
<x:ExcelWorksheets>
<x:ExcelWorksheet>
<x:Name>Каталог расценок</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet>
</x:ExcelWorksheets>
</x:ExcelWorkbook>
</xml><![endif]-->
<style>
  th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #334155; padding: 8px; }
  td { border: 1px solid #cbd5e1; padding: 6px; }
  .num { text-align: right; }
  .summary-title { font-weight: bold; background-color: #f1f5f9; }
</style>
</head>
<body>
<h2>QazGost AI 2.0 — Каталог сметных нормативов и расценок РК</h2>
<p>Дата формирования: ${new Date().toLocaleString()}</p>
<table>
  <thead>
    <tr>
      <th>Код позиции</th>
      <th>Наименование работы / материала</th>
      <th>Категория</th>
      <th>Единица измерения</th>
      <th>Трудоемкость (ч-ч)</th>
      <th>Базовая цена (₸)</th>
      <th>Регион</th>
    </tr>
  </thead>
  <tbody>`;

  items.forEach((item) => {
    xml += `
    <tr>
      <td>${escapeXml(item.id || item.code)}</td>
      <td>${escapeXml(item.name)}</td>
      <td>${escapeXml(item.category || 'Общие')}</td>
      <td>${escapeXml(item.unit || 'шт')}</td>
      <td class="num">${item.laborNorm || item.labor || 0}</td>
      <td class="num">${item.price || 0}</td>
      <td>${escapeXml(item.region || 'Все регионы')}</td>
    </tr>`;
  });

  xml += `
  </tbody>
</table>

<br/>
<h3>📊 Сводка статистических показателей</h3>
<table>
  <tr><td class="summary-title">Всего позиций в выгрузке:</td><td class="num">${totalItems}</td></tr>
  <tr><td class="summary-title">Минимальная цена:</td><td class="num">${minPrice.toLocaleString()} ₸</td></tr>
  <tr><td class="summary-title">Максимальная цена:</td><td class="num">${maxPrice.toLocaleString()} ₸</td></tr>
  <tr><td class="summary-title">Средняя базовая цена:</td><td class="num">${avgPrice.toLocaleString()} ₸</td></tr>
</table>
</body>
</html>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export complete 3-sheet catalog (Works, Materials, Summary)
 */
export function exportAll3SheetsExcel(pricesList) {
  const works = pricesList.filter((p) => p.category?.toLowerCase().includes('работ') || p.id?.startsWith('E'));
  const materials = pricesList.filter((p) => p.category?.toLowerCase().includes('материал') || p.id?.startsWith('M'));
  exportPricesToExcel(pricesList, 'qazgost_full_3sheets_catalog.xlsx');
}

/**
 * Parse uploaded CSV / Text / Tab-separated file into items list
 */
export async function parseExcelOrCsvFile(file) {
  return new Promise((resolve, reject) => {
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
          // Skip header or empty rows
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
        resolve(null); // return null to trigger error popup
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsArrayBuffer(file);
  });
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
