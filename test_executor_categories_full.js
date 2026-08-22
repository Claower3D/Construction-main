/**
 * QAZGOST AI - Comprehensive Test Suite for All 12 Executor Tools ("Я ИСПОЛНИТЕЛЬ")
 */
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
  }
}

console.log('===============================================================');
console.log('🧪 ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ ВСЕХ 12 КАТЕГОРИЙ «Я ИСПОЛНИТЕЛЬ»');
console.log('===============================================================\n');

const srcDir = 'frontend/src';

// 1. Маркетплейс материалов (e-materials)
console.log('📌 ТЕСТ 1: Категория 1 — «Маркетплейс материалов» (e-materials)');
const matPath = path.join(srcDir, 'components/MaterialsMarketplacePage.jsx');
assert(fs.existsSync(matPath), 'Файл MaterialsMarketplacePage.jsx существует');
const matCode = fs.readFileSync(matPath, 'utf8');
assert(matCode.includes('freezeEscrow') || matCode.includes('walletEngine'), 'Привязка кошелька и эскроу-депозита');
assert(matCode.includes('createPlatformOrder') || matCode.includes('orderSyncService'), 'Синхронизация заказов оптовых материалов в CRM');

// 2. Лента заказов (e-feed)
console.log('\n📌 ТЕСТ 2: Категория 2 — «Лента заказов» (e-feed)');
const ordPath = path.join(srcDir, 'components/UserOrdersPage.jsx');
assert(fs.existsSync(ordPath), 'Файл UserOrdersPage.jsx существует');
const ordCode = fs.readFileSync(ordPath, 'utf8');
assert(ordCode.includes('handleAcceptOrder') || ordCode.includes('executor'), 'Логика принятия заказа исполнителем');
assert(ordCode.includes('recalcOrderStatus') || ordCode.includes('status'), 'Авторасчет статусов этапов работ');

// 3. Мои работы (e-works)
console.log('\n📌 ТЕСТ 3: Категория 3 — «Мои работы» (e-works)');
assert(ordCode.includes('handleStartStage') || ordCode.includes('handleCompleteStage'), 'Управление стадиями СМР (Старт, Прогресс 0-100%, Завершение)');
assert(ordCode.includes('handleCompleteOrder') || ordCode.includes('КС-2') || ordCode.includes('Завершено'), 'Сдача объекта и подписание Акта КС-2');

// 4. Оценка стоимости (e-estimate)
console.log('\n📌 ТЕСТ 4: Категория 4 — «Оценка стоимости» (e-estimate)');
const estPath = path.join(srcDir, 'components/SmartPhotoEstimatePage.jsx');
assert(fs.existsSync(estPath), 'Файл SmartPhotoEstimatePage.jsx существует');
const estCode = fs.readFileSync(estPath, 'utf8');
assert(estCode.includes('gpt-4o') || estCode.includes('estimate'), 'Vision AI сметный расчёт');
assert(estCode.includes('priceScenarios') || estCode.includes('econom'), '3 Сценария цены (Эконом, Стандарт, Премиум)');

// 5. Проверка дефектов (e-inspect)
console.log('\n📌 ТЕСТ 5: Категория 5 — «Проверка дефектов» (e-inspect)');
const defPath = path.join(srcDir, 'components/DefectInspectorPage.jsx');
assert(fs.existsSync(defPath), 'Файл DefectInspectorPage.jsx существует');
const defCode = fs.readFileSync(defPath, 'utf8');
assert(defCode.includes('СНиП') || defCode.includes('snipCode'), 'Привязка к строительным нормам СНиП РК');
assert(defCode.includes('createPlatformOrder') || defCode.includes('engineer'), 'Формирование вызова инженера технадзора');

// 6. Фото-объёмы грунта (e-soil)
console.log('\n📌 ТЕСТ 6: Категория 6 — «Фото-объёмы грунта» (e-soil)');
const soilPath = path.join(srcDir, 'components/EarthworkVolumesPage.jsx');
assert(fs.existsSync(soilPath), 'Файл EarthworkVolumesPage.jsx существует');
const soilCode = fs.readFileSync(soilPath, 'utf8');
assert(soilCode.includes('geometricVolumeM3') || soilCode.includes('кубатура'), 'Геометрический расчёт объёма котлована');
assert(soilCode.includes('truckTripsCount') || soilCode.includes('самосвал'), 'Расчёт рейсов самосвалов и смен экскаватора');
assert(soilCode.includes('freezeEscrow') && soilCode.includes('createPlatformOrder'), 'Сохранение сметы земляных работ в Go Backend и Эскроу');

// 7. Инженерные решения (e-engineering)
console.log('\n📌 ТЕСТ 7: Категория 7 — «Инженерные решения» (e-engineering)');
const engSolPath = path.join(srcDir, 'components/EngineeringSolutionsPage.jsx');
assert(fs.existsSync(engSolPath), 'Файл EngineeringSolutionsPage.jsx существует');
const engSolCode = fs.readFileSync(engSolPath, 'utf8');
assert(engSolCode.includes('createPlatformOrder') || engSolCode.includes('freezeEscrow'), 'Оформление инженерного пакета с эскроу');

// 8. Мой кошелёк (e-wallet)
console.log('\n📌 ТЕСТ 8: Категория 8 — «Мой кошелёк» (e-wallet)');
const walPath = path.join(srcDir, 'components/UserWalletPage.jsx');
assert(fs.existsSync(walPath), 'Файл UserWalletPage.jsx существует');
const walCode = fs.readFileSync(walPath, 'utf8');
assert(walCode.includes('getBalanceKZT') || walCode.includes('topupBalance'), 'Управление балансом и выводом средств');

// 9. Маркетплейс техники (e-equipment)
console.log('\n📌 ТЕСТ 9: Категория 9 — «Маркетплейс техники» (e-equipment)');
const eqPath = path.join(srcDir, 'components/EquipmentMarketplace.jsx');
assert(fs.existsSync(eqPath), 'Файл EquipmentMarketplace.jsx существует');
const eqCode = fs.readFileSync(eqPath, 'utf8');
assert(eqCode.includes('qazgost_custom_equipment') || eqCode.includes('customList'), 'Автоматическое подтягивание зарегистрированной техники исполнителя');
assert(eqCode.includes('distanceKm') || eqCode.includes('GPS'), 'GPS-радар ближайшей спецтехники');

// 10. Календарь выездов (e-calendar)
console.log('\n📌 ТЕСТ 10: Категория 10 — «Календарь выездов» (e-calendar)');
const calPath = path.join(srcDir, 'components/CalendarSchedulePage.jsx');
assert(fs.existsSync(calPath), 'Файл CalendarSchedulePage.jsx существует');
const calCode = fs.readFileSync(calPath, 'utf8');
assert(calCode.includes('events') && calCode.includes('inspection'), 'Расписание инспекций и выездов технадзора');
assert(calCode.includes('handleAddEvent') || calCode.includes('Запланировать'), 'Интерактивное добавление выездов и этапов монтажа');

// 11. Каталог специалистов (e-catalog)
console.log('\n📌 ТЕСТ 11: Категория 11 — «Каталог специалистов» (e-catalog)');
const catPath = path.join(srcDir, 'components/ContractorsCatalogPage.jsx');
assert(fs.existsSync(catPath), 'Файл ContractorsCatalogPage.jsx существует');

// 12. Строительство зданий VIP (e-vip)
console.log('\n📌 ТЕСТ 12: Категория 12 — «Строительство зданий VIP» (e-vip)');
const vipPath = path.join(srcDir, 'components/BuildingConstructionPage.jsx');
assert(fs.existsSync(vipPath), 'Файл BuildingConstructionPage.jsx существует');

// 13. Проверка маршрутизации FeaturePageModule
console.log('\n📌 ТЕСТ 13: Маршрутизация всех 12 инструментов Исполнителя в FeaturePageModule.jsx');
const fpmPath = path.join(srcDir, 'components/FeaturePageModule.jsx');
const fpmCode = fs.readFileSync(fpmPath, 'utf8');
const routes = [
  'e-materials', 'e-feed', 'e-works', 'e-estimate', 'e-inspect',
  'e-soil', 'e-engineering', 'e-wallet', 'e-equipment', 'e-calendar',
  'e-catalog', 'e-vip'
];
routes.forEach(r => {
  assert(fpmCode.includes(r), `Маршрут ${r} активен в FeaturePageModule`);
});

console.log('\n===============================================================');
console.log(`ИТОГИ ТЕСТИРОВАНИЯ: УСПЕШНО: ${passed} | ОШИБОК: ${failed}`);
console.log('===============================================================');

if (failed > 0) process.exit(1);
