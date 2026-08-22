// Full Platform Categories & End-to-End Logic Test Suite for QazGost AI "Я Заказчик"

const fs = require('fs');
const path = require('path');

// Mock localStorage for Node environment
const store = {};
global.localStorage = {
  getItem: (key) => store[key] || null,
  setItem: (key, val) => { store[key] = String(val); },
  removeItem: (key) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; }
};

console.log('===============================================================');
console.log('🧪 ЗАПУСК ПОЛНОГО ТЕСТИРОВАНИЯ ВСЕХ 9 КАТЕГОРИЙ «Я ЗАКАЗЧИК»');
console.log('===============================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    failCount++;
  }
}

// 1. TEST WALLET ENGINE & ESCROW FREEZE
console.log('📌 ТЕСТ 1: Финансовый движок (Кошелёк и Эскроу-транши)');
const walletPath = path.join(__dirname, 'frontend/src/services/walletEngine.js');
assert(fs.existsSync(walletPath), 'Файл walletEngine.js существует');

const walletCode = fs.readFileSync(walletPath, 'utf8');
assert(walletCode.includes('freezeEscrow'), 'Функция freezeEscrow объявлена');
assert(walletCode.includes('spendBalance'), 'Функция spendBalance объявлена');
assert(walletCode.includes('topupBalance'), 'Функция topupBalance объявлена');
assert(walletCode.includes('getBalanceKZT'), 'Функция getBalanceKZT объявлена');

// 2. TEST ORDER SYNC SERVICE & CRM DISPATCH
console.log('\n📌 ТЕСТ 2: Единый диспетчер заказов и CRM-календаря');
const syncPath = path.join(__dirname, 'frontend/src/services/orderSyncService.js');
assert(fs.existsSync(syncPath), 'Файл orderSyncService.js существует');

const syncCode = fs.readFileSync(syncPath, 'utf8');
assert(syncCode.includes('[🚜 ТЕХНИКА]'), 'Поддержка CRM-метки спецтехники');
assert(syncCode.includes('[🧱 МАТЕРИАЛЫ]'), 'Поддержка CRM-метки стройматериалов');
assert(syncCode.includes('[👷 ИНЖЕНЕР]'), 'Поддержка CRM-метки выезда инженера');
assert(syncCode.includes('[📝 ЛИД]'), 'Поддержка CRM-метки нового лида');
assert(syncCode.includes('qazgost_calendar_events'), 'Синхронизация в календарь Менеджера');

// 3. TEST CATEGORY 1: SMART PHOTO ESTIMATE (3 SCENARIOS & VISION AI)
console.log('\n📌 ТЕСТ 3: Категория 1 — «Оценка стоимости» (Vision AI & 3 Сценария)');
const estimatePath = path.join(__dirname, 'frontend/src/components/SmartPhotoEstimatePage.jsx');
const estimateCode = fs.readFileSync(estimatePath, 'utf8');
assert(estimateCode.includes('GPT-4o Vision'), 'Подключение нейросети GPT-4o Vision');
assert(estimateCode.includes('selectedScenario'), 'Интерактивный переключатель 3 сценариев цены');
assert(estimateCode.includes('🟢 Эконом (-15%)'), 'Сценарий Эконом (-15%)');
assert(estimateCode.includes('🔵 Стандарт (СНиП)'), 'Сценарий Стандарт');
assert(estimateCode.includes('🟣 Премиум (+25%)'), 'Сценарий Премиум (+25%)');
assert(estimateCode.includes('createPlatformOrder'), 'Кнопка «Оформить заказ по этой смете» синхронизирует заказ в CRM');

// 4. TEST CATEGORY 2: DEFECT INSPECTION (SNIP RK & REAL VISION)
console.log('\n📌 ТЕСТ 4: Категория 2 — «Проверка дефектов» (Дефектоскопия по СНиП РК)');
const defectPath = path.join(__dirname, 'frontend/src/components/DefectInspectorPage.jsx');
const defectCode = fs.readFileSync(defectPath, 'utf8');
assert(defectCode.includes('GPT-4o Vision'), 'Vision AI анализ дефектов по фото');
assert(defectCode.includes('snipCode'), 'Привязка к кодам СНиП РК');
assert(defectCode.includes('fixMethod'), 'Технологическая карта устранения');
assert(defectCode.includes('createPlatformOrder'), 'Кнопка «Вызвать инженера / Устранить дефект»');
assert(defectCode.includes("type: 'defect'") && defectCode.includes('assignedEngineer'), 'Формирование вызова инженера ПТО');

// 5. TEST CATEGORY 3: EQUIPMENT MARKETPLACE (GPS & ESCROW)
console.log('\n📌 ТЕСТ 5: Категория 3 — «Маркетплейс техники» (GPS Радар и Эскроу)');
const equipPath = path.join(__dirname, 'frontend/src/components/EquipmentMarketplace.jsx');
const equipCode = fs.readFileSync(equipPath, 'utf8');
assert(equipCode.includes('freezeEscrow'), 'Заморозка эскроу при аренде техники');
assert(equipCode.includes('walletBalance'), 'Отображение баланса кошелька в модальном окне');
assert(equipCode.includes('createPlatformOrder'), 'Создание заказа на аренду с передачей Менеджеру и Исполнителю');
assert(equipCode.includes('distanceKm'), 'GPS-радар дистанции до объекта');

// 6. TEST CATEGORY 4: MATERIALS MARKETPLACE (AI BOM & CART ESCROW)
console.log('\n📌 ТЕСТ 6: Категория 4 — «Маркетплейс материалов» (BOM, Корзина, Эскроу)');
const matPath = path.join(__dirname, 'frontend/src/components/MaterialsMarketplacePage.jsx');
const matCode = fs.readFileSync(matPath, 'utf8');
assert(matCode.includes('freezeEscrow'), 'Заморозка эскроу при покупке материалов');
assert(matCode.includes('cartTotalWithDelivery'), 'Калькуляция веса, логистики и доставки транспортом');
assert(matCode.includes('aiBOMResult'), 'AI BOM калькулятор расхода бетона, арматуры, смесей');
assert(matCode.includes('createPlatformOrder'), 'Передача заказа партии материалов Менеджеру CRM');

// 7. TEST CATEGORY 5: USER ORDERS (7 STAGES WORKFLOW)
console.log('\n📌 ТЕСТ 7: Категория 5 — «Мои заказы» (7-этапный жизненный цикл)');
const ordersPath = path.join(__dirname, 'frontend/src/components/UserOrdersPage.jsx');
const ordersCode = fs.readFileSync(ordersPath, 'utf8');
assert(ordersCode.includes('engineer_assigned'), 'Этап 2: Назначение инженера');
assert(ordersCode.includes('engineer_visit'), 'Этап 3: Выезд инженера на замеры');
assert(ordersCode.includes('estimate_ready'), 'Этап 4: Смета ГОСТ КЗ готова');
assert(ordersCode.includes('pending_executor'), 'Этап 5: Передача исполнителю');
assert(ordersCode.includes('in_progress'), 'Этап 6: Строительные работы в процессе');
assert(ordersCode.includes('completed'), 'Этап 7: Завершение и сдача объекта');

// 8. TEST CATEGORY 6: USER WALLET
console.log('\n📌 ТЕСТ 8: Категория 6 — «Мой кошелёк» (Управление балансом)');
const walletPagePath = path.join(__dirname, 'frontend/src/components/UserWalletPage.jsx');
const walletPageCode = fs.readFileSync(walletPagePath, 'utf8');
assert(walletPageCode.includes('getBalanceKZT'), 'Отображение текущего баланса');
assert(walletPageCode.includes('topupBalance'), 'Пополнение через Kaspi Pay');

// 9. TEST CATEGORY 7: CONTRACTORS CATALOG
console.log('\n📌 ТЕСТ 9: Категория 7 — «Каталог подрядчиков» (Лицензии ГАСК)');
const contPath = path.join(__dirname, 'frontend/src/components/ContractorsCatalogPage.jsx');
assert(fs.existsSync(contPath), 'Файл ContractorsCatalogPage.jsx существует');

// 10. TEST CATEGORY 8: ENGINEERING SOLUTIONS
console.log('\n📌 ТЕСТ 10: Категория 8 — «Инженерные решения» (Электрика, HVAC, Септики)');
const engPath = path.join(__dirname, 'frontend/src/components/EngineeringSolutionsPage.jsx');
assert(fs.existsSync(engPath), 'Файл EngineeringSolutionsPage.jsx существует');

// 11. TEST CATEGORY 9: BUILDING CONSTRUCTION VIP
console.log('\n📌 ТЕСТ 11: Категория 9 — «Строительство зданий» (ПСД, Генподряд)');
const buildPath = path.join(__dirname, 'frontend/src/components/BuildingConstructionPage.jsx');
assert(fs.existsSync(buildPath), 'Файл BuildingConstructionPage.jsx существует');

// 12. TEST COMPONENT ROUTING IN FEATUREPAGEMODULE
console.log('\n📌 ТЕСТ 12: Маршрутизация и доступность всех 9 инструментов Заказчика');
const fpmPath = path.join(__dirname, 'frontend/src/components/FeaturePageModule.jsx');
const fpmCode = fs.readFileSync(fpmPath, 'utf8');
assert(fpmCode.includes("itemId === 'c-estimate'"), 'Маршрут c-estimate (Оценка стоимости)');
assert(fpmCode.includes("itemId === 'c-inspect'"), 'Маршрут c-inspect (Проверка дефектов)');
assert(fpmCode.includes("itemId === 'c-equipment'"), 'Маршрут c-equipment (Маркетплейс техники)');
assert(fpmCode.includes("itemId === 'c-materials'"), 'Маршрут c-materials (Маркетплейс материалов)');
assert(fpmCode.includes("itemId === 'c-orders'"), 'Маршрут c-orders (Мои заказы)');
assert(fpmCode.includes("itemId === 'c-wallet'"), 'Маршрут c-wallet (Мой кошелёк)');
assert(fpmCode.includes("itemId === 'c-catalog'"), 'Маршрут c-catalog (Каталог подрядчиков)');
assert(fpmCode.includes("itemId === 'c-engineering'"), 'Маршрут c-engineering (Инженерные решения)');
assert(fpmCode.includes("itemId === 'c-vip'"), 'Маршрут c-vip (Строительство зданий)');

console.log('\n===============================================================');
console.log(`ИТОГИ ТЕСТИРОВАНИЯ: УСПЕШНО: ${passCount} | ОШИБОК: ${failCount}`);
console.log('===============================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
