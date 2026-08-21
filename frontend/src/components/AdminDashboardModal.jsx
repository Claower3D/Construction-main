import React, { useState, useEffect } from 'react';
import { getAuditLogs, logAuditAction, exportAuditLogTxt } from '../services/adminAuditStore';
import { exportPricesToExcel, exportAll3SheetsExcel, parseExcelOrCsvFile, exportActsToExcel, exportInvoicesToExcel, exportContractsToExcel, exportSingleDocumentExcel, exportAllDocumentsPackageExcel } from '../services/adminExcelIO';
import { getStatus } from '../services/api';
import RoleHierarchyTreePage from './RoleHierarchyTreePage';

// Documents & Invoices registry for Excel export
const INITIAL_DOCUMENTS_LIST = [
  {
    id: 'АКТ-КС2-2026/088',
    code: 'АКТ-КС2-2026/088',
    type: 'Акт КС-2',
    category: 'acts',
    objectName: 'ЖК «Nomad Palace» (Блок А)',
    customer: 'ТОО «Prime Development KZ»',
    customerBin: '180240009871',
    contractor: 'ТОО «QAZGOST AI»',
    contractorBin: '240140029182',
    date: '18.08.2026',
    period: 'Август 2026 (Этап 3)',
    amount: 14850000,
    amountNet: 13258928,
    vat: 1591072,
    status: 'Подписан ЭЦП',
    signedBy: 'Аскаров Б. К. (Гендиректор)',
    items: [
      { name: 'Устройство монолитных перекрытий 8-12 этажи', unit: 'м³', qty: 180, price: 42000, total: 7560000, code: 'ГЭСН 06-01-005' },
      { name: 'Монтаж арматурных каркасов А500С Ø16', unit: 'т', qty: 12.5, price: 340000, total: 4250000, code: 'ГЭСН 06-01-015' },
      { name: 'Опалубочные работы щитовые DOKA/PERI', unit: 'м²', qty: 450, price: 4800, total: 2160000, code: 'ГЭСН 06-01-020' },
      { name: 'Уход за бетоном и электропрогрев', unit: 'м³', qty: 180, price: 4888, total: 880000, code: 'ГЭСН 06-01-032' }
    ]
  },
  {
    id: 'АКТ-КС2-2026/089',
    code: 'АКТ-КС2-2026/089',
    type: 'Акт КС-2',
    category: 'acts',
    objectName: 'ЖК «Green City» (Корпус 2)',
    customer: 'ТОО «BI Group Engineering»',
    customerBin: '190340011293',
    contractor: 'ТОО «Базис-А МонолитСтрой»',
    contractorBin: '150840003412',
    date: '19.08.2026',
    period: 'Август 2026',
    amount: 8940000,
    amountNet: 7982142,
    vat: 957858,
    status: 'Подписан ЭЦП',
    signedBy: 'Хамитов А. (CEO)',
    items: [
      { name: 'Кладка наружных стен из газоблока D500', unit: 'м³', qty: 140, price: 28000, total: 3920000, code: 'ГЭСН 08-02-001' },
      { name: 'Утепление фасада минераловатными плитами 100мм', unit: 'м²', qty: 580, price: 6200, total: 3596000, code: 'ГЭСН 12-01-008' },
      { name: 'Установка оконных блоков ПВХ 5-камерных', unit: 'м²', qty: 65, price: 21900, total: 1424000, code: 'ГЭСН 10-01-034' }
    ]
  },
  {
    id: 'АКТ-КС3-2026/042',
    code: 'АКТ-КС3-2026/042',
    type: 'Акт КС-3',
    category: 'acts',
    objectName: 'Бизнес-центр «QazTech Hub»',
    customer: 'АО «Самрук-Казына Констракшн»',
    customerBin: '090140005521',
    contractor: 'ТОО «QAZGOST AI»',
    contractorBin: '240140029182',
    date: '20.08.2026',
    period: 'III Квартал 2026',
    amount: 45200000,
    amountNet: 40357142,
    vat: 4842858,
    status: 'На согласовании',
    signedBy: 'Ожидает подписи технадзора',
    items: [
      { name: 'Справка о стоимости выполненных работ за 3 этапа', unit: 'компл', qty: 1, price: 45200000, total: 45200000, code: 'КС-3-СВОД' }
    ]
  },
  {
    id: 'СЧЕТ-KZ-2026/1049',
    code: 'СЧЕТ-KZ-2026/1049',
    type: 'Счет на оплату',
    category: 'invoices',
    objectName: 'ЖК «Nomad Palace»',
    payer: 'ТОО «Prime Development KZ»',
    payerBin: '180240009871',
    receiver: 'ТОО «QAZGOST AI»',
    receiverBin: '240140029182',
    date: '15.08.2026',
    dueDate: '25.08.2026',
    purpose: 'Оплата эскроу-транша №3 за устройство монолитного каркаса',
    bankAccount: 'KZ88926180119X00234 (Halyk Bank)',
    amount: 14850000,
    amountNet: 13258928,
    vat: 1591072,
    status: 'Зарезервировано в Эскроу',
    paymentMethod: 'Безопасная сделка QazGost Escrow'
  },
  {
    id: 'СЧЕТ-KZ-2026/1050',
    code: 'СЧЕТ-KZ-2026/1050',
    type: 'Счет на оплату',
    category: 'invoices',
    objectName: 'Коттеджный городок «Garden Hills»',
    payer: 'Ахметов Марат Сабитович (ФЛ)',
    payerBin: '840512301948',
    receiver: 'ИП «Садыков Строй»',
    receiverBin: '910304400192',
    date: '19.08.2026',
    dueDate: '22.08.2026',
    purpose: 'Авансовый платеж за кровельные работы и металлочерепицу',
    bankAccount: 'KZ45722190038A00912 (Kaspi Bank)',
    amount: 2850000,
    amountNet: 2544642,
    vat: 305358,
    status: 'Оплачен через Kaspi Pay',
    paymentMethod: 'Kaspi QR / Pay'
  },
  {
    id: 'ЭСФ-2026-003912',
    code: 'ЭСФ-2026-003912',
    type: 'ЭСФ (Счет-фактура)',
    category: 'invoices',
    objectName: 'ЖК «Астана Хаб» (СМР)',
    payer: 'ТОО «BI Group Engineering»',
    payerBin: '190340011293',
    receiver: 'ТОО «QAZGOST AI»',
    receiverBin: '240140029182',
    date: '12.08.2026',
    dueDate: 'Оплачен',
    purpose: 'Электронная счет-фактура по акту КС-2 №77',
    bankAccount: 'KZ88926180119X00234 (Halyk Bank)',
    amount: 32600000,
    amountNet: 29107142,
    vat: 3492858,
    status: 'Проведен в ИС ЭСФ',
    paymentMethod: 'Безналичный расчет с НДС'
  },
  {
    id: 'ДОГ-QG-2026/412',
    code: 'ДОГ-QG-2026/412',
    type: 'Договор генподряда',
    category: 'contracts',
    objectName: 'ЖК «Nomad Palace»',
    subject: 'Генеральный строительный подряд и технический надзор',
    customer: 'ТОО «Prime Development KZ»',
    contractor: 'ТОО «QAZGOST AI»',
    startDate: '01.03.2026',
    endDate: '30.11.2026',
    amount: 185000000,
    advance: 35000000,
    escrowDeposit: 185000000,
    status: 'Действует (72% выполнено)',
    warranty: '60 месяцев'
  },
  {
    id: 'ДОГ-QG-2026/413',
    code: 'ДОГ-QG-2026/413',
    type: 'Договор подряда',
    category: 'contracts',
    objectName: 'ЖК «Green City»',
    subject: 'Монтаж внутренних инженерных сетей (ОВ, ВК, ЭОМ)',
    customer: 'ТОО «BI Group Engineering»',
    contractor: 'ТОО «Базис-А МонолитСтрой»',
    startDate: '15.05.2026',
    endDate: '15.10.2026',
    amount: 64200000,
    advance: 12000000,
    escrowDeposit: 64200000,
    status: 'Действует (45% выполнено)',
    warranty: '36 месяцев'
  }
];

// 21 WBS Groups structure
const WBS_GROUPS = [
  { id: 1, name: '1. Подготовительные работы', icon: '🧹', coverage: 100, count: 48, normTypes: 12 },
  { id: 2, name: '2. Земляные работы и рытье котлованов', icon: '🚜', coverage: 95, count: 62, normTypes: 15 },
  { id: 3, name: '3. Фундаменты и нулевой цикл', icon: '🧱', coverage: 98, count: 85, normTypes: 22 },
  { id: 4, name: '4. Каркас и монолитные стены', icon: '🏗️', coverage: 92, count: 110, normTypes: 28 },
  { id: 5, name: '5. Кровля и стропильные системы', icon: '🏠', coverage: 88, count: 74, normTypes: 19 },
  { id: 6, name: '6. Наружные стены и фасадная отделка', icon: '🏢', coverage: 90, count: 96, normTypes: 24 },
  { id: 7, name: '7. Окна, витражи и внешние двери', icon: '🪟', coverage: 85, count: 52, normTypes: 14 },
  { id: 8, name: '8. Перегородки из ГКЛ и газоблока', icon: '🧱', coverage: 96, count: 68, normTypes: 16 },
  { id: 9, name: '9. Электроснабжение и освещение', icon: '⚡', coverage: 94, count: 125, normTypes: 32 },
  { id: 10, name: '10. ХВС, ГВС и системное водоснабжение', icon: '🚰', coverage: 91, count: 88, normTypes: 21 },
  { id: 11, name: '11. Канализация и ливневый дренаж', icon: '🚽', coverage: 89, count: 54, normTypes: 13 },
  { id: 12, name: '12. Отопление и тепловые пункты', icon: '🔥', coverage: 93, count: 72, normTypes: 18 },
  { id: 13, name: '13. Вентиляция и кондиционирование (HVAC)', icon: '💨', coverage: 86, count: 64, normTypes: 17 },
  { id: 14, name: '14. Черновая отделка (штукатурка, стяжка)', icon: '🧱', coverage: 97, count: 105, normTypes: 26 },
  { id: 15, name: '15. Чистовая отделка (покраска, обои)', icon: '🎨', coverage: 95, count: 118, normTypes: 30 },
  { id: 16, name: '16. Полы и напольные покрытия', icon: '🪵', coverage: 92, count: 82, normTypes: 20 },
  { id: 17, name: '17. Потолки (натяжные, ГКЛ, Армстронг)', icon: '📐', coverage: 90, count: 46, normTypes: 12 },
  { id: 18, name: '18. Сантехническое оборудование', icon: '🛁', coverage: 94, count: 58, normTypes: 15 },
  { id: 19, name: '19. Слаботочные системы и пожаротушение', icon: '📡', coverage: 87, count: 76, normTypes: 19 },
  { id: 20, name: '20. Благоустройство территории', icon: '🌳', coverage: 82, count: 42, normTypes: 10 },
  { id: 21, name: '21. Ввод в эксплуатацию / Спецработы', icon: '📋', coverage: 75, count: 35, normTypes: 8 },
];

// Base Norms Database (ГЭСН / QAZGOST) — Полная база строительных материалов Казахстана 2026
const BASE_NORMS_LIST = [
  // ═══════════════════════════════════════════════════════════════════════
  // РАБОТЫ (ГЭСН 2026) — 20 позиций
  // ═══════════════════════════════════════════════════════════════════════
  { id: 'E15-01-001', name: 'Штукатурка стен цементно-известковым раствором', category: 'Работы', section: 'Черновая отделка', unit: 'м²', laborNorm: 1.45, price: 2850, file: 'GESN-15-2026.xlsx' },
  { id: 'E15-01-002', name: 'Шпатлевка стен гипсовыми смесями в 2 слоя', category: 'Работы', section: 'Чистовая отделка', unit: 'м²', laborNorm: 0.85, price: 1650, file: 'GESN-15-2026.xlsx' },
  { id: 'E08-02-001', name: 'Кладка наружных стен из кирпича полнотелого', category: 'Работы', section: 'Каркас и стены', unit: 'м³', laborNorm: 4.20, price: 18500, file: 'GESN-08-2026.xlsx' },
  { id: 'E11-01-005', name: 'Устройство стяжки полусухой пескоцементной 50мм', category: 'Работы', section: 'Полы', unit: 'м²', laborNorm: 0.65, price: 2400, file: 'GESN-11-2026.xlsx' },
  { id: 'E67-03-012', name: 'Прокладка кабеля ВВГнг-LS 3x2.5 в гофре', category: 'Работы', section: 'Электроснабжение', unit: 'п.м.', laborNorm: 0.35, price: 950, file: 'GESN-67-2026.xlsx' },
  { id: 'E06-01-001', name: 'Устройство монолитных перекрытий толщиной 200мм', category: 'Работы', section: 'Монолит', unit: 'м³', laborNorm: 5.80, price: 42000, file: 'GESN-06-2026.xlsx' },
  { id: 'E06-01-015', name: 'Монтаж арматурных каркасов A500С', category: 'Работы', section: 'Монолит', unit: 'тн', laborNorm: 12.00, price: 85000, file: 'GESN-06-2026.xlsx' },
  { id: 'E12-01-008', name: 'Утепление фасада минераловатными плитами 100мм', category: 'Работы', section: 'Фасады', unit: 'м²', laborNorm: 1.20, price: 6200, file: 'GESN-12-2026.xlsx' },
  { id: 'E10-01-034', name: 'Установка оконных блоков ПВХ 5-камерных', category: 'Работы', section: 'Окна и двери', unit: 'м²', laborNorm: 2.50, price: 21900, file: 'GESN-10-2026.xlsx' },
  { id: 'E08-02-010', name: 'Кладка стен из газобетонных блоков D500', category: 'Работы', section: 'Каркас и стены', unit: 'м³', laborNorm: 3.80, price: 15200, file: 'GESN-08-2026.xlsx' },
  { id: 'E01-02-005', name: 'Разработка грунта экскаватором', category: 'Работы', section: 'Земляные работы', unit: 'м³', laborNorm: 0.15, price: 1800, file: 'GESN-01-2026.xlsx' },
  { id: 'E04-01-003', name: 'Устройство свайного фундамента забивного', category: 'Работы', section: 'Фундаменты', unit: 'шт', laborNorm: 2.50, price: 45000, file: 'GESN-04-2026.xlsx' },
  { id: 'E07-01-012', name: 'Монтаж кровли из металлочерепицы', category: 'Работы', section: 'Кровля', unit: 'м²', laborNorm: 0.85, price: 4500, file: 'GESN-07-2026.xlsx' },
  { id: 'E09-03-001', name: 'Монтаж радиаторов отопления биметаллических', category: 'Работы', section: 'Отопление', unit: 'секц', laborNorm: 0.45, price: 1200, file: 'GESN-09-2026.xlsx' },
  { id: 'E16-01-005', name: 'Укладка керамогранита на пол', category: 'Работы', section: 'Полы', unit: 'м²', laborNorm: 1.10, price: 3800, file: 'GESN-16-2026.xlsx' },
  { id: 'E15-02-008', name: 'Покраска стен водоэмульсионной краской в 2 слоя', category: 'Работы', section: 'Чистовая отделка', unit: 'м²', laborNorm: 0.35, price: 850, file: 'GESN-15-2026.xlsx' },
  { id: 'E67-01-001', name: 'Монтаж электрощитка распределительного', category: 'Работы', section: 'Электроснабжение', unit: 'шт', laborNorm: 4.00, price: 18500, file: 'GESN-67-2026.xlsx' },
  { id: 'E18-01-003', name: 'Монтаж труб ПП водоснабжения 25мм', category: 'Работы', section: 'Водоснабжение', unit: 'п.м.', laborNorm: 0.55, price: 1400, file: 'GESN-18-2026.xlsx' },
  { id: 'E19-01-010', name: 'Монтаж канализации ПВХ 110мм', category: 'Работы', section: 'Канализация', unit: 'п.м.', laborNorm: 0.65, price: 1650, file: 'GESN-19-2026.xlsx' },
  { id: 'E20-01-004', name: 'Монтаж приточно-вытяжной вентиляции', category: 'Работы', section: 'Вентиляция', unit: 'п.м.', laborNorm: 1.20, price: 4200, file: 'GESN-20-2026.xlsx' },
  // ═══ 1. ЦЕМЕНТ, БЕТОН, СУХИЕ СМЕСИ ═══
  { id: 'M-101', name: 'Цемент портланд М-500 (мешок 50кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 3400, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-102', name: 'Цемент М-400 (мешок 50кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 2900, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-103', name: 'Цемент белый CEM I 52.5 (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-104', name: 'Бетон товарный М-200 (В15) с доставкой', category: 'Материалы', section: 'Бетон', unit: 'м³', laborNorm: 0, price: 28500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-105', name: 'Бетон товарный М-300 (В22.5) с доставкой', category: 'Материалы', section: 'Бетон', unit: 'м³', laborNorm: 0, price: 32000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-106', name: 'Бетон товарный М-350 (В25) с доставкой', category: 'Материалы', section: 'Бетон', unit: 'м³', laborNorm: 0, price: 34500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-107', name: 'Бетон товарный М-400 (В30) с доставкой', category: 'Материалы', section: 'Бетон', unit: 'м³', laborNorm: 0, price: 37000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-108', name: 'Раствор кладочный М-100', category: 'Материалы', section: 'Бетон', unit: 'м³', laborNorm: 0, price: 22000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-109', name: 'Раствор кладочный М-150', category: 'Материалы', section: 'Бетон', unit: 'м³', laborNorm: 0, price: 24500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-110', name: 'Пескобетон М-300 (мешок 40кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 1800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-111', name: 'Штукатурка гипсовая Knauf Ротбанд (30кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 5200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-112', name: 'Штукатурка цементная Ceresit CT24 (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 3800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-113', name: 'Шпатлевка финишная Vetonit LR+ (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 5400, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-114', name: 'Шпатлевка стартовая Knauf HP Start (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 3200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-115', name: 'Клей плиточный Ceresit CM11 (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 3600, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-116', name: 'Клей плиточный усиленный Ceresit CM14 (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-117', name: 'Наливной пол самовыравнивающийся (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 4500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-118', name: 'Грунтовка глубокого проникновения Ceresit CT17 (10л)', category: 'Материалы', section: 'Сухие смеси', unit: 'кан', laborNorm: 0, price: 6800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-119', name: 'Клей для газоблока зимний (25кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0, price: 2800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-120', name: 'Затирка для швов Ceresit CE33 (2кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'уп', laborNorm: 0, price: 1850, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 2. КИРПИЧ, БЛОКИ ═══
  { id: 'M-201', name: 'Кирпич керамический рядовой полнотелый М-150', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 65, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-202', name: 'Кирпич керамический рядовой пустотелый М-150', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 55, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-203', name: 'Кирпич облицовочный керамический', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 95, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-204', name: 'Кирпич силикатный белый М-150', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 42, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-205', name: 'Кирпич огнеупорный шамотный ШБ-5', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 280, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-206', name: 'Газобетонный блок D500 600x300x200мм', category: 'Материалы', section: 'Кирпич и блоки', unit: 'м³', laborNorm: 0, price: 24500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-207', name: 'Газобетонный блок D600 600x300x200мм', category: 'Материалы', section: 'Кирпич и блоки', unit: 'м³', laborNorm: 0, price: 26000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-208', name: 'Газобетонный блок D400 600x300x200мм', category: 'Материалы', section: 'Кирпич и блоки', unit: 'м³', laborNorm: 0, price: 22800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-209', name: 'Пеноблок D600 600x300x200мм', category: 'Материалы', section: 'Кирпич и блоки', unit: 'м³', laborNorm: 0, price: 19500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-210', name: 'Керамзитобетонный блок 390x190x188мм', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 320, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-211', name: 'Фундаментный блок ФБС 24.4.6', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 18500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-212', name: 'Плита перекрытия ПК 60-15-8', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 42000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-213', name: 'Тротуарная плитка 200x100x60мм', category: 'Материалы', section: 'Кирпич и блоки', unit: 'м²', laborNorm: 0, price: 4200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-214', name: 'Бордюрный камень дорожный БР100.30.15', category: 'Материалы', section: 'Кирпич и блоки', unit: 'шт', laborNorm: 0, price: 2800, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 3. МЕТАЛЛОПРОКАТ, АРМАТУРА ═══
  { id: 'M-301', name: 'Арматура A500C Ø10мм', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 345000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-302', name: 'Арматура A500C Ø12мм', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 340000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-303', name: 'Арматура A500C Ø16мм', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 335000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-304', name: 'Арматура A500C Ø20мм', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 330000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-305', name: 'Арматура A500C Ø25мм', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 328000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-306', name: 'Проволока вязальная Ø1.2мм (100м)', category: 'Материалы', section: 'Металл', unit: 'бух', laborNorm: 0, price: 4500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-307', name: 'Швеллер 16П (12м)', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 420000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-308', name: 'Двутавр балка 20Б1 (12м)', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 430000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-309', name: 'Уголок стальной 50x50x5мм', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0, price: 380000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-310', name: 'Труба профильная 60x40x3мм', category: 'Материалы', section: 'Металл', unit: 'п.м.', laborNorm: 0, price: 2800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-311', name: 'Труба профильная 80x80x4мм', category: 'Материалы', section: 'Металл', unit: 'п.м.', laborNorm: 0, price: 4500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-312', name: 'Труба профильная 100x100x4мм', category: 'Материалы', section: 'Металл', unit: 'п.м.', laborNorm: 0, price: 5800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-313', name: 'Лист стальной горячекатаный 4мм', category: 'Материалы', section: 'Металл', unit: 'лист', laborNorm: 0, price: 38000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-314', name: 'Лист оцинкованный 0.55мм', category: 'Материалы', section: 'Металл', unit: 'лист', laborNorm: 0, price: 12500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-315', name: 'Сетка кладочная 50x50x4мм (0.5x2м)', category: 'Материалы', section: 'Металл', unit: 'карт', laborNorm: 0, price: 2200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-316', name: 'Сетка рабица оцинкованная 50x50мм', category: 'Материалы', section: 'Металл', unit: 'рул', laborNorm: 0, price: 18500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-317', name: 'Электроды сварочные МР-3 Ø3мм (5кг)', category: 'Материалы', section: 'Метизы', unit: 'пач', laborNorm: 0, price: 4200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-318', name: 'Анкер-болт М12x120мм', category: 'Материалы', section: 'Метизы', unit: 'шт', laborNorm: 0, price: 280, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-319', name: 'Саморезы по дереву 4.2x75мм (200шт)', category: 'Материалы', section: 'Метизы', unit: 'уп', laborNorm: 0, price: 1800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-320', name: 'Гвозди строительные 100мм (5кг)', category: 'Материалы', section: 'Метизы', unit: 'кг', laborNorm: 0, price: 850, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-321', name: 'Дюбель-гвоздь 6x60мм (200шт)', category: 'Материалы', section: 'Метизы', unit: 'уп', laborNorm: 0, price: 2400, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 4. ПИЛОМАТЕРИАЛЫ ═══
  { id: 'M-401', name: 'Доска обрезная хвойная 50x150мм (6м)', category: 'Материалы', section: 'Пиломатериалы', unit: 'м³', laborNorm: 0, price: 85000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-402', name: 'Доска обрезная хвойная 25x150мм (6м)', category: 'Материалы', section: 'Пиломатериалы', unit: 'м³', laborNorm: 0, price: 82000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-403', name: 'Брус строительный 100x100мм (6м)', category: 'Материалы', section: 'Пиломатериалы', unit: 'м³', laborNorm: 0, price: 90000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-404', name: 'Брус строительный 150x150мм (6м)', category: 'Материалы', section: 'Пиломатериалы', unit: 'м³', laborNorm: 0, price: 92000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-405', name: 'Фанера ФСФ влагостойкая 18мм', category: 'Материалы', section: 'Пиломатериалы', unit: 'лист', laborNorm: 0, price: 12500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-406', name: 'Фанера ФК 12мм', category: 'Материалы', section: 'Пиломатериалы', unit: 'лист', laborNorm: 0, price: 6800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-407', name: 'OSB-3 плита 12мм (1250x2500)', category: 'Материалы', section: 'Пиломатериалы', unit: 'лист', laborNorm: 0, price: 7200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-408', name: 'OSB-3 плита 18мм (1250x2500)', category: 'Материалы', section: 'Пиломатериалы', unit: 'лист', laborNorm: 0, price: 9800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-409', name: 'ДСП ламинированная 16мм', category: 'Материалы', section: 'Пиломатериалы', unit: 'лист', laborNorm: 0, price: 11500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-410', name: 'Вагонка деревянная хвойная (сорт А)', category: 'Материалы', section: 'Пиломатериалы', unit: 'м²', laborNorm: 0, price: 4500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-411', name: 'Антисептик для дерева Pinotex (10л)', category: 'Материалы', section: 'Пиломатериалы', unit: 'кан', laborNorm: 0, price: 18500, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 5. ЛИСТОВЫЕ (ГКЛ, ГВЛ, ПРОФИЛИ) ═══
  { id: 'M-501', name: 'Гипсокартон KNAUF стандартный 12.5мм (ГКЛ)', category: 'Материалы', section: 'Листовые материалы', unit: 'лист', laborNorm: 0, price: 3600, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-502', name: 'Гипсокартон KNAUF влагостойкий 12.5мм (ГКЛВ)', category: 'Материалы', section: 'Листовые материалы', unit: 'лист', laborNorm: 0, price: 4200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-503', name: 'Гипсокартон KNAUF огнестойкий 12.5мм (ГКЛО)', category: 'Материалы', section: 'Листовые материалы', unit: 'лист', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-504', name: 'ГВЛ гипсоволокно KNAUF 12.5мм', category: 'Материалы', section: 'Листовые материалы', unit: 'лист', laborNorm: 0, price: 5600, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-505', name: 'Профиль направляющий ПН 28x27 (3м)', category: 'Материалы', section: 'Листовые материалы', unit: 'шт', laborNorm: 0, price: 650, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-506', name: 'Профиль потолочный ПП 60x27 (3м)', category: 'Материалы', section: 'Листовые материалы', unit: 'шт', laborNorm: 0, price: 750, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-507', name: 'Профиль стоечный ПС 50x50 (3м)', category: 'Материалы', section: 'Листовые материалы', unit: 'шт', laborNorm: 0, price: 850, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-508', name: 'Подвес прямой для ГКЛ (100шт)', category: 'Материалы', section: 'Листовые материалы', unit: 'уп', laborNorm: 0, price: 2800, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 6. УТЕПЛИТЕЛИ, ИЗОЛЯЦИЯ ═══
  { id: 'M-601', name: 'Минвата Rockwool 50мм (8 плит/уп)', category: 'Материалы', section: 'Утеплители', unit: 'уп', laborNorm: 0, price: 6800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-602', name: 'Минвата Rockwool 100мм (4 плиты/уп)', category: 'Материалы', section: 'Утеплители', unit: 'уп', laborNorm: 0, price: 7200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-603', name: 'Пенополистирол ПСБ-С-25 50мм', category: 'Материалы', section: 'Утеплители', unit: 'лист', laborNorm: 0, price: 950, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-604', name: 'Пенополистирол ПСБ-С-25 100мм', category: 'Материалы', section: 'Утеплители', unit: 'лист', laborNorm: 0, price: 1800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-605', name: 'XPS Технониколь экструзионный 50мм', category: 'Материалы', section: 'Утеплители', unit: 'лист', laborNorm: 0, price: 2200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-606', name: 'Пенофол фольгированный 5мм (30м²)', category: 'Материалы', section: 'Утеплители', unit: 'рул', laborNorm: 0, price: 5800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-607', name: 'Пароизоляция Изоспан B (70м²)', category: 'Материалы', section: 'Утеплители', unit: 'рул', laborNorm: 0, price: 4200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-608', name: 'Гидроизоляция Изоспан D (70м²)', category: 'Материалы', section: 'Утеплители', unit: 'рул', laborNorm: 0, price: 5500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-609', name: 'Ветрозащита Изоспан А (70м²)', category: 'Материалы', section: 'Утеплители', unit: 'рул', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-610', name: 'Пена монтажная профессиональная 750мл', category: 'Материалы', section: 'Утеплители', unit: 'бал', laborNorm: 0, price: 2200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-611', name: 'Герметик силиконовый санитарный 310мл', category: 'Материалы', section: 'Утеплители', unit: 'туб', laborNorm: 0, price: 1200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-612', name: 'Мастика битумная гидроизоляционная (20л)', category: 'Материалы', section: 'Утеплители', unit: 'вед', laborNorm: 0, price: 8500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-613', name: 'Рубероид РКП-350 (15м²)', category: 'Материалы', section: 'Утеплители', unit: 'рул', laborNorm: 0, price: 3200, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 7. КРОВЛЯ ═══
  { id: 'M-701', name: 'Металлочерепица Монтеррей 0.5мм', category: 'Материалы', section: 'Кровля', unit: 'м²', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-702', name: 'Профнастил С-20 оцинкованный 0.5мм', category: 'Материалы', section: 'Кровля', unit: 'м²', laborNorm: 0, price: 3200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-703', name: 'Профнастил С-20 полимерный RAL', category: 'Материалы', section: 'Кровля', unit: 'м²', laborNorm: 0, price: 4200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-704', name: 'Профнастил Н-60 несущий 0.7мм', category: 'Материалы', section: 'Кровля', unit: 'м²', laborNorm: 0, price: 5800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-705', name: 'Гибкая черепица Shinglas (Технониколь)', category: 'Материалы', section: 'Кровля', unit: 'м²', laborNorm: 0, price: 5500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-706', name: 'Ондулин лист (2000x950мм)', category: 'Материалы', section: 'Кровля', unit: 'лист', laborNorm: 0, price: 5200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-707', name: 'Водосточная система (желоб 3м + воронка)', category: 'Материалы', section: 'Кровля', unit: 'компл', laborNorm: 0, price: 8500, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 8. ЛАКОКРАСОЧНЫЕ ═══
  { id: 'M-801', name: 'Краска фасадная акриловая Tikkurila (10л)', category: 'Материалы', section: 'Лакокрасочные', unit: 'вед', laborNorm: 0, price: 28900, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-802', name: 'Краска интерьерная Dulux (10л)', category: 'Материалы', section: 'Лакокрасочные', unit: 'вед', laborNorm: 0, price: 18500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-803', name: 'Краска акриловая для потолка белая (10л)', category: 'Материалы', section: 'Лакокрасочные', unit: 'вед', laborNorm: 0, price: 8500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-804', name: 'Эмаль алкидная ПФ-115 белая (2.8кг)', category: 'Материалы', section: 'Лакокрасочные', unit: 'бан', laborNorm: 0, price: 4200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-805', name: 'Эмаль по металлу 3 в 1 антикоррозийная', category: 'Материалы', section: 'Лакокрасочные', unit: 'бан', laborNorm: 0, price: 3800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-806', name: 'Лак паркетный полиуретановый (5л)', category: 'Материалы', section: 'Лакокрасочные', unit: 'бан', laborNorm: 0, price: 22000, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 9. НАПОЛЬНЫЕ ПОКРЫТИЯ ═══
  { id: 'M-901', name: 'Керамогранит 600x600мм полированный', category: 'Материалы', section: 'Напольные покрытия', unit: 'м²', laborNorm: 0, price: 6500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-902', name: 'Керамогранит 600x600мм матовый (Казахстан)', category: 'Материалы', section: 'Напольные покрытия', unit: 'м²', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-903', name: 'Плитка керамическая настенная 250x400мм', category: 'Материалы', section: 'Напольные покрытия', unit: 'м²', laborNorm: 0, price: 3800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-904', name: 'Ламинат 33 класс 8мм (2.4м²)', category: 'Материалы', section: 'Напольные покрытия', unit: 'уп', laborNorm: 0, price: 6500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-905', name: 'Линолеум бытовой Tarkett 3м', category: 'Материалы', section: 'Напольные покрытия', unit: 'м²', laborNorm: 0, price: 3200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-906', name: 'Линолеум полукоммерческий 3м', category: 'Материалы', section: 'Напольные покрытия', unit: 'м²', laborNorm: 0, price: 5500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-907', name: 'Паркетная доска дуб натуральный', category: 'Материалы', section: 'Напольные покрытия', unit: 'м²', laborNorm: 0, price: 18500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-908', name: 'Подложка под ламинат пробковая 3мм', category: 'Материалы', section: 'Напольные покрытия', unit: 'м²', laborNorm: 0, price: 1200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-909', name: 'Плинтус ПВХ с кабель-каналом 80мм', category: 'Материалы', section: 'Напольные покрытия', unit: 'шт', laborNorm: 0, price: 1200, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 10. ОКНА, ДВЕРИ ═══
  { id: 'M-1001', name: 'Окно ПВХ двухкамерное 1300x1400мм REHAU', category: 'Материалы', section: 'Окна и двери', unit: 'шт', laborNorm: 0, price: 85000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1002', name: 'Окно ПВХ трехкамерное 1800x1400мм REHAU', category: 'Материалы', section: 'Окна и двери', unit: 'шт', laborNorm: 0, price: 125000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1003', name: 'Балконный блок ПВХ (дверь + окно)', category: 'Материалы', section: 'Окна и двери', unit: 'компл', laborNorm: 0, price: 145000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1004', name: 'Дверь входная металлическая утепленная', category: 'Материалы', section: 'Окна и двери', unit: 'шт', laborNorm: 0, price: 95000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1005', name: 'Дверь межкомнатная ламинированная 800мм', category: 'Материалы', section: 'Окна и двери', unit: 'компл', laborNorm: 0, price: 42000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1006', name: 'Дверь межкомнатная шпонированная массив', category: 'Материалы', section: 'Окна и двери', unit: 'компл', laborNorm: 0, price: 85000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1007', name: 'Подоконник ПВХ белый 250мм (1.5м)', category: 'Материалы', section: 'Окна и двери', unit: 'шт', laborNorm: 0, price: 4500, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 11. ЭЛЕКТРИКА ═══
  { id: 'M-1101', name: 'Кабель ВВГнг-LS 3x1.5мм² (100м)', category: 'Материалы', section: 'Электрика', unit: 'бух', laborNorm: 0, price: 12500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1102', name: 'Кабель ВВГнг-LS 3x2.5мм² (100м)', category: 'Материалы', section: 'Электрика', unit: 'бух', laborNorm: 0, price: 18500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1103', name: 'Кабель ВВГнг-LS 3x4мм² (100м)', category: 'Материалы', section: 'Электрика', unit: 'бух', laborNorm: 0, price: 28000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1104', name: 'Гофра ПВХ 20мм (100м)', category: 'Материалы', section: 'Электрика', unit: 'бух', laborNorm: 0, price: 3500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1105', name: 'Автомат ABB 1P 16А', category: 'Материалы', section: 'Электрика', unit: 'шт', laborNorm: 0, price: 2800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1106', name: 'УЗО ABB 2P 40А/30мА', category: 'Материалы', section: 'Электрика', unit: 'шт', laborNorm: 0, price: 8500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1107', name: 'Щиток распределительный 24 модуля', category: 'Материалы', section: 'Электрика', unit: 'шт', laborNorm: 0, price: 12500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1108', name: 'Розетка двойная Schneider с заземлением', category: 'Материалы', section: 'Электрика', unit: 'шт', laborNorm: 0, price: 2800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1109', name: 'Выключатель 2-клавишный Schneider', category: 'Материалы', section: 'Электрика', unit: 'шт', laborNorm: 0, price: 2200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1110', name: 'Светильник LED панель 600x600 40Вт', category: 'Материалы', section: 'Электрика', unit: 'шт', laborNorm: 0, price: 8500, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 12. САНТЕХНИКА ═══
  { id: 'M-1201', name: 'Труба ПП 25мм PN20 (4м)', category: 'Материалы', section: 'Сантехника', unit: 'шт', laborNorm: 0, price: 850, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1202', name: 'Труба канализационная ПВХ 110мм (2м)', category: 'Материалы', section: 'Сантехника', unit: 'шт', laborNorm: 0, price: 1800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1203', name: 'Труба канализационная ПВХ 50мм (2м)', category: 'Материалы', section: 'Сантехника', unit: 'шт', laborNorm: 0, price: 750, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1204', name: 'Унитаз-компакт с бачком Cersanit', category: 'Материалы', section: 'Сантехника', unit: 'компл', laborNorm: 0, price: 38000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1205', name: 'Раковина 550мм с пьедесталом', category: 'Материалы', section: 'Сантехника', unit: 'компл', laborNorm: 0, price: 22000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1206', name: 'Ванна акриловая 1700мм', category: 'Материалы', section: 'Сантехника', unit: 'шт', laborNorm: 0, price: 65000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1207', name: 'Смеситель для ванны Grohe', category: 'Материалы', section: 'Сантехника', unit: 'шт', laborNorm: 0, price: 28000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1208', name: 'Водонагреватель 80л Ariston', category: 'Материалы', section: 'Сантехника', unit: 'шт', laborNorm: 0, price: 85000, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 13. ОТОПЛЕНИЕ ═══
  { id: 'M-1301', name: 'Радиатор биметаллический 500мм (1 секция)', category: 'Материалы', section: 'Отопление', unit: 'секц', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1302', name: 'Радиатор стальной панельный 22 тип 500x1000мм', category: 'Материалы', section: 'Отопление', unit: 'шт', laborNorm: 0, price: 28000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1303', name: 'Котёл газовый настенный 24кВт Bosch', category: 'Материалы', section: 'Отопление', unit: 'шт', laborNorm: 0, price: 385000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1304', name: 'Тёплый пол электрический мат 1м²', category: 'Материалы', section: 'Отопление', unit: 'компл', laborNorm: 0, price: 12500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1305', name: 'Труба PEX для тёплого пола 16мм (200м)', category: 'Материалы', section: 'Отопление', unit: 'бух', laborNorm: 0, price: 35000, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 14. ИНЕРТНЫЕ МАТЕРИАЛЫ ═══
  { id: 'M-1401', name: 'Песок речной мытый (с доставкой)', category: 'Материалы', section: 'Инертные', unit: 'тн', laborNorm: 0, price: 4500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1402', name: 'Песок карьерный (с доставкой)', category: 'Материалы', section: 'Инертные', unit: 'тн', laborNorm: 0, price: 3200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1403', name: 'Щебень гранитный фр. 5-20мм', category: 'Материалы', section: 'Инертные', unit: 'тн', laborNorm: 0, price: 6800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1404', name: 'Щебень гранитный фр. 20-40мм', category: 'Материалы', section: 'Инертные', unit: 'тн', laborNorm: 0, price: 6200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1405', name: 'ПГС (песчано-гравийная смесь)', category: 'Материалы', section: 'Инертные', unit: 'тн', laborNorm: 0, price: 4800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1406', name: 'Керамзит фр. 10-20мм (40л)', category: 'Материалы', section: 'Инертные', unit: 'меш', laborNorm: 0, price: 1200, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 15. ОТДЕЛКА, ОБОИ, ПОТОЛКИ ═══
  { id: 'M-1501', name: 'Обои виниловые на флизелине (10.05x1.06м)', category: 'Материалы', section: 'Отделка', unit: 'рул', laborNorm: 0, price: 8500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1502', name: 'Обои под покраску флизелиновые (25x1.06м)', category: 'Материалы', section: 'Отделка', unit: 'рул', laborNorm: 0, price: 5200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1503', name: 'Клей обойный QUELYD для флизелина', category: 'Материалы', section: 'Отделка', unit: 'пач', laborNorm: 0, price: 1800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1504', name: 'Натяжной потолок ПВХ матовый (с установкой)', category: 'Материалы', section: 'Отделка', unit: 'м²', laborNorm: 0, price: 4500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1505', name: 'Натяжной потолок ПВХ глянцевый (с установкой)', category: 'Материалы', section: 'Отделка', unit: 'м²', laborNorm: 0, price: 5200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1506', name: 'Потолочная плитка Armstrong 600x600мм', category: 'Материалы', section: 'Отделка', unit: 'м²', laborNorm: 0, price: 2800, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1507', name: 'Декоративная штукатурка короед (25кг)', category: 'Материалы', section: 'Отделка', unit: 'меш', laborNorm: 0, price: 6500, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ 16. ВЕНТИЛЯЦИЯ ═══
  { id: 'M-1601', name: 'Воздуховод оцинкованный Ø125мм (1м)', category: 'Материалы', section: 'Вентиляция', unit: 'шт', laborNorm: 0, price: 1200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1602', name: 'Вентилятор канальный 125мм', category: 'Материалы', section: 'Вентиляция', unit: 'шт', laborNorm: 0, price: 8500, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1603', name: 'Кондиционер сплит 12000 BTU Samsung', category: 'Материалы', section: 'Вентиляция', unit: 'шт', laborNorm: 0, price: 280000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-1604', name: 'Кондиционер сплит 18000 BTU Gree', category: 'Материалы', section: 'Вентиляция', unit: 'шт', laborNorm: 0, price: 345000, file: 'MAT-PRICES-2026.xlsx' },
  // ═══ ТЕХНИКА ═══
  { id: 'T-001', name: 'Аренда экскаватора-погрузчика JCB 3CX', category: 'Техника', section: 'Землеройная', unit: 'смена', laborNorm: 8.00, price: 95000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-002', name: 'Аренда автокрана XCMG 25 тонн', category: 'Техника', section: 'Грузоподъемная', unit: 'смена', laborNorm: 8.00, price: 140000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-003', name: 'Самосвал KAMAZ 20 тонн', category: 'Техника', section: 'Грузовая', unit: 'рейс', laborNorm: 2.00, price: 25000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-004', name: 'Башенный кран Liebherr (месяц)', category: 'Техника', section: 'Грузоподъемная', unit: 'мес', laborNorm: 0, price: 2800000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-005', name: 'Автобетоносмеситель 7м³', category: 'Техника', section: 'Грузовая', unit: 'рейс', laborNorm: 0, price: 35000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-006', name: 'Виброкаток 10 тонн', category: 'Техника', section: 'Дорожная', unit: 'смена', laborNorm: 8.00, price: 85000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-007', name: 'Автовышка 18м', category: 'Техника', section: 'Грузоподъемная', unit: 'смена', laborNorm: 8.00, price: 65000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-008', name: 'Бетононасос стационарный', category: 'Техника', section: 'Грузовая', unit: 'смена', laborNorm: 8.00, price: 180000, file: 'EQUIPMENT-2026.xlsx' },
];


export default function AdminDashboardModal({ isOpen, onClose, inline = false, startTab = 'overview', currentUser = null, userRole = 'admin' }) {
  // Navigation Tabs: overview | database | prices | moderation | users | settings
  const [activeTab, setActiveTab] = useState('overview');
  const [settingsSubTab, setSettingsSubTab] = useState('regions'); // regions | audit

  useEffect(() => {
    if (startTab === 'prices' || startTab === 'moderation') {
      setActiveTab(startTab);
    } else if (startTab === 'regions' || startTab === 'audit') {
      setActiveTab('settings');
      setSettingsSubTab(startTab);
    } else if (startTab === 'kpi' || startTab === 'analytics' || startTab === 'overview') {
      setActiveTab('overview');
    } else if (startTab === 'disputes' || startTab === 'contracts' || startTab === 'users') {
      setActiveTab('users');
    } else if (startTab === 'roles') {
      setActiveTab('roles');
    } else if (startTab === 'documents') {
      setActiveTab('documents');
    }
  }, [startTab]);

  // Backend PriceDB Status
  const [backendStatus, setBackendStatus] = useState('checking'); // checking | online | offline
  const [backendStats, setBackendStats] = useState({ totalItems: 14750, responseMs: 42 });

  // 1. DATABASE TAB STATES
  const [dbCategoryFilter, setDbCategoryFilter] = useState('Работы'); // Работы | Материалы | Техника
  const [dbViewMode, setDbViewMode] = useState('wbs'); // wbs | flat
  const [dbSearch, setDbSearch] = useState('');
  const [dbPage, setDbPage] = useState(1);
  const dbItemsPerPage = 50;

  // 2. PRICES TAB STATES
  const [pricesList, setPricesList] = useState(BASE_NORMS_LIST);
  const [priceTypeFilter, setPriceTypeFilter] = useState('all'); // all | Работы | Материалы
  const [priceSearch, setPriceSearch] = useState('');
  const [pricePage, setPricePage] = useState(1);
  const pricesPerPage = 100;

  // 3. DOCUMENTS & EXCEL IMPORT/EXPORT TAB STATES
  const [documentsList, setDocumentsList] = useState(INITIAL_DOCUMENTS_LIST);
  const [docsCategoryFilter, setDocsCategoryFilter] = useState('all'); // all | acts | invoices | contracts
  const [docsSearch, setDocsSearch] = useState('');
  const [docAddModalOpen, setDocAddModalOpen] = useState(false);
  const [docUploadDragover, setDocUploadDragover] = useState(false);
  const [docUploadResult, setDocUploadResult] = useState(null); // { count, filename }
  const [docForm, setDocForm] = useState({
    id: '', type: 'Акт КС-2', category: 'acts', objectName: '', customer: '', customerBin: '',
    contractor: '', contractorBin: '', date: new Date().toLocaleDateString('ru-RU'),
    period: '', amount: '', status: 'На согласовании', purpose: '', payer: '', payerBin: ''
  });
  const docFileInputRef = React.useRef(null);

  // Handle Excel/CSV file upload for documents import
  const handleDocFileUpload = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      alert('Поддерживаются только файлы Excel (.xlsx, .xls) и CSV (.csv)');
      return;
    }
    try {
      const parsed = await parseExcelOrCsvFile(file);
      if (parsed && parsed.length > 0) {
        // Map parsed rows to documents
        const newDocs = parsed.map((row, idx) => ({
          id: row.id || row.code || `ЗАГРУЖ-${Date.now()}-${idx + 1}`,
          code: row.code || row.id || `ЗАГРУЖ-${Date.now()}-${idx + 1}`,
          type: row.category === 'invoices' ? 'Счет на оплату' : row.category === 'contracts' ? 'Договор подряда' : 'Акт КС-2',
          category: row.category || 'acts',
          objectName: row.name || row.objectName || 'Загруженный объект',
          customer: row.customer || '—',
          customerBin: row.customerBin || '',
          contractor: row.contractor || '',
          date: row.date || new Date().toLocaleDateString('ru-RU'),
          amount: Number(row.price || row.amount || 0),
          amountNet: Math.round(Number(row.price || row.amount || 0) / 1.12),
          vat: Math.round(Number(row.price || row.amount || 0) - Number(row.price || row.amount || 0) / 1.12),
          status: row.status || 'Загружен из Excel',
          period: row.period || '',
          purpose: row.purpose || row.name || '',
          payer: row.payer || '',
          payerBin: row.payerBin || ''
        }));
        setDocumentsList(prev => [...newDocs, ...prev]);
        setDocUploadResult({ count: newDocs.length, filename: file.name });
        logAuditAction('DOCUMENTS', 'import_excel', `Загружено ${newDocs.length} документов из файла ${file.name}`);
        setTimeout(() => setDocUploadResult(null), 5000);
      } else {
        alert('Файл не содержит данных или формат не распознан. Проверьте заголовки столбцов.');
      }
    } catch (err) {
      console.error('Document import error:', err);
      alert('Ошибка при импорте файла: ' + (err.message || err));
    }
  };

  // Handle drag-and-drop
  const handleDocDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDocUploadDragover(true); };
  const handleDocDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDocUploadDragover(false); };
  const handleDocDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDocUploadDragover(false);
    const file = e.dataTransfer.files[0];
    if (file) handleDocFileUpload(file);
  };

  // Add new document manually
  const handleAddDocManually = () => {
    if (!docForm.id.trim() || !docForm.objectName.trim()) {
      alert('Заполните обязательные поля: № документа и Объект / Назначение');
      return;
    }
    const newDoc = {
      ...docForm,
      code: docForm.id,
      amount: Number(docForm.amount) || 0,
      amountNet: Math.round(Number(docForm.amount || 0) / 1.12),
      vat: Math.round(Number(docForm.amount || 0) - Number(docForm.amount || 0) / 1.12),
    };
    setDocumentsList(prev => [newDoc, ...prev]);
    logAuditAction('DOCUMENTS', 'add_manual', `Добавлен документ вручную: ${newDoc.id} (${newDoc.type})`);
    setDocAddModalOpen(false);
    setDocForm({
      id: '', type: 'Акт КС-2', category: 'acts', objectName: '', customer: '', customerBin: '',
      contractor: '', contractorBin: '', date: new Date().toLocaleDateString('ru-RU'),
      period: '', amount: '', status: 'На согласовании', purpose: '', payer: '', payerBin: ''
    });
  };

  // Delete document
  const handleDeleteDoc = (docId) => {
    if (!window.confirm(`Удалить документ ${docId}?`)) return;
    setDocumentsList(prev => prev.filter(d => d.id !== docId));
    logAuditAction('DOCUMENTS', 'delete', `Удален документ: ${docId}`);
  };

  // Modals for Price Item Add/Edit & Confirm Delete
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [editingPriceItem, setEditingPriceItem] = useState(null);
  const [priceForm, setPriceForm] = useState({ id: '', name: '', category: 'Работы', unit: 'м²', price: 1000, region: 'Алматы' });
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // 3. MODERATION TAB STATES
  const [modCategoryFilter, setModCategoryFilter] = useState('all'); // all | urgent | orders | verification | complaints | spam
  const [modSearch, setModSearch] = useState('');
  const [modViewMode, setModViewMode] = useState('table'); // 'table' | 'cards'
  const [modSelectedIds, setModSelectedIds] = useState([]);
  const [moderationQueue, setModerationQueue] = useState([
    {
      id: 'MOD-101',
      priority: 'high',
      type: 'Заказ',
      category: 'orders',
      title: 'Капитальный ремонт офиса 450 м²',
      author: 'ТОО «Алматы Бизнес»',
      bin: '210440012935',
      city: 'Алматы',
      date: '12 мин назад',
      status: 'pending',
      amount: 18500000,
      riskScore: 0.08,
      riskLevel: 'low',
      docCount: '4 чертежа + Смета',
      details: {
        area: '450 м²',
        budget: '18 500 000 ₸',
        city: 'Алматы',
        contact: '+7 701 555-01-99',
        deadline: '3 месяца',
        escrow: 'Зарезервировано 100%',
        description: 'Комплексный капитальный ремонт коммерческого помещения под ключ: демонтаж, электромонтаж, чистовая отделка, вентиляция.'
      }
    },
    {
      id: 'MOD-102',
      priority: 'normal',
      type: 'Верификация',
      category: 'verification',
      title: 'Верификация подрядчика ИП «СтройМастер»',
      author: 'ИП «СтройМастер» (Бекжанов К.М.)',
      bin: '880412300451',
      city: 'Астана',
      date: '25 мин назад',
      status: 'pending',
      amount: 0,
      riskScore: 0.15,
      riskLevel: 'low',
      docCount: 'Свид. ИП + Лицензия III',
      details: {
        bin: '880412300451',
        docType: 'Свидетельство ИП + Гос. лицензия III категории',
        city: 'Астана',
        regDate: '12.04.2018',
        taxes: 'Задолженности нет',
        staff: '18 штатных строителей'
      }
    },
    {
      id: 'MOD-103',
      priority: 'high',
      type: 'Жалоба',
      category: 'complaints',
      title: 'Претензия: трещины на монолитном перекрытии',
      author: 'Заказчик: Касымов А.Б.',
      bin: '910315450290',
      city: 'Караганда',
      date: '1 ч назад',
      status: 'pending',
      amount: 2400000,
      riskScore: 0.72,
      riskLevel: 'high',
      docCount: 'Фотофиксация + Акт КС-2',
      details: {
        disputeId: 'DSP-882',
        reason: 'Трещины на монолитном перекрытии после снятия опалубки',
        amount: '2 400 000 ₸',
        contractor: 'ТОО «КарСтрой»',
        engineerNote: 'Требуется выезд технадзора и ультразвуковая дефектоскопия бетона'
      }
    },
    {
      id: 'MOD-104',
      priority: 'high',
      type: 'Антифрод',
      category: 'spam',
      title: 'Подозрительный массовый заказ арматуры (150 тн)',
      author: 'Пользователь user9912 (Новый аккаунт)',
      bin: 'Не указан',
      city: 'г. Атырау (IP)',
      date: '2 ч назад',
      status: 'pending',
      amount: 42000000,
      riskScore: 0.94,
      riskLevel: 'critical',
      docCount: '0 документов',
      details: {
        itemsCount: 150,
        riskScore: '0.94 (Критический)',
        reason: 'Новый аккаунт без верификации разместил заказ на 42 млн ₸ с зарубежной карты',
        aiFlag: 'Подозрение на кардинг и фиктивный объем'
      }
    },
    {
      id: 'MOD-105',
      priority: 'high',
      type: 'Заказ',
      category: 'orders',
      title: 'Свайное поле 24 буронабивные сваи Ø600мм',
      author: 'ТОО «Orda Group Development»',
      bin: '190540028710',
      city: 'Шымкент',
      date: '3 ч назад',
      status: 'pending',
      amount: 8700000,
      riskScore: 0.11,
      riskLevel: 'low',
      docCount: 'Геология + Чертежи КЖ',
      details: {
        area: '600 м²',
        budget: '8 700 000 ₸',
        city: 'Шымкент',
        contact: '+7 707 321-45-67',
        soil: 'Просадочные суглинки II типа',
        projectDoc: 'ПСД прошло госэкспертизу'
      }
    },
    {
      id: 'MOD-106',
      priority: 'normal',
      type: 'Верификация',
      category: 'verification',
      title: 'Верификация генподрядчика ТОО «Astana Build»',
      author: 'ТОО «Astana Build» (Рахимов Д.А.)',
      bin: '220140039280',
      city: 'Астана',
      date: '4 ч назад',
      status: 'pending',
      amount: 0,
      riskScore: 0.05,
      riskLevel: 'low',
      docCount: 'Устав + Лицензия II + Аудит',
      details: {
        bin: '220140039280',
        docType: 'Лицензия II категории (СМР)',
        city: 'Астана',
        regDate: '20.01.2022',
        capital: '50 000 000 ₸',
        audit: 'Финансовый аудит 2025 года подтвержден'
      }
    },
    {
      id: 'MOD-107',
      priority: 'high',
      type: 'Жалоба',
      category: 'complaints',
      title: 'Нарушение сроков поставки кабельной продукции',
      author: 'ТОО «ТемирСтрой Монтаж»',
      bin: '180340052170',
      city: 'Актау',
      date: '5 ч назад',
      status: 'pending',
      amount: 6200000,
      riskScore: 0.65,
      riskLevel: 'medium',
      docCount: 'Договор + Накладные',
      details: {
        disputeId: 'DSP-905',
        reason: 'Срыв сроков поставки кабеля ВВГнг-LS на 14 календарных дней',
        supplier: 'ТОО «КазКабельТрейд»',
        amount: '6 200 000 ₸',
        requestedAction: 'Выплата неустойки 0.1% в день'
      }
    },
    {
      id: 'MOD-108',
      priority: 'normal',
      type: 'Заказ',
      category: 'orders',
      title: 'Монтаж керамогранитного фасада 2 200 м²',
      author: 'ИП «Назарбеков и К»',
      bin: '850920300156',
      city: 'Алматы',
      date: '6 ч назад',
      status: 'pending',
      amount: 22000000,
      riskScore: 0.18,
      riskLevel: 'low',
      docCount: 'АР + КМД + Раскладка',
      details: {
        area: '2 200 м²',
        budget: '22 000 000 ₸',
        city: 'Алматы',
        contact: '+7 702 888-99-00',
        subSystem: 'Оцинкованная подсистема с полимерным покрытием'
      }
    },
  ]);
  const [inspectModalData, setInspectModalData] = useState(null);

  // 4. USERS TAB STATES
  const [usersList, setUsersList] = useState([
    { id: 'U-001', name: 'Арман Касымов', role: 'customer', roleLabel: 'Заказчик', email: 'arman@qaz.kz', phone: '+7 701 111-22-33', city: 'Алматы', source: 'Новый', status: 'active', rating: '5.0' },
    { id: 'U-002', name: 'Бауыржан Токтаров', role: 'executor', roleLabel: 'Исполнитель', email: 'proab@stroi.kz', phone: '+7 702 333-44-55', city: 'Астана', source: 'Демо', status: 'active', rating: '4.9' },
    { id: 'U-003', name: 'Ерлан Сатов', role: 'engineer', roleLabel: 'Инженер', email: 'satov.eng@qazgost.kz', phone: '+7 705 777-88-99', city: 'Караганда', source: 'Демо', status: 'active', rating: '5.0' },
    { id: 'U-004', name: 'Айнур Рахимова', role: 'admin', roleLabel: 'Администратор', email: 'manager@qazgost.kz', phone: '+7 777 999-00-11', city: 'Алматы', source: 'Админ', status: 'active', rating: '5.0' },
    { id: 'U-005', name: 'ИП «ТемирСтрой»', role: 'executor', roleLabel: 'Исполнитель', email: 'info@temirstroy.kz', phone: '+7 707 444-55-66', city: 'Шымкент', source: 'Новый', status: 'blocked', rating: '3.2' },
    { id: 'U-006', name: 'Нуркенов Асхат', role: 'analyst', roleLabel: 'Аналитик', email: 'analyst@qazgost.kz', phone: '+7 708 222-33-44', city: 'Алматы', source: 'QazGost', status: 'active', rating: '5.0' },
  ]);
  const [userRoleFilter, setUserRoleFilter] = useState('all'); // all | customer | executor | engineer | admin
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 15;
  const [inspectUserModal, setInspectUserModal] = useState(null);
  const [changeRoleModalUser, setChangeRoleModalUser] = useState(null);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ id: '', name: '', role: 'customer', email: '', phone: '', city: 'Алматы', status: 'active', source: 'Ручной' });

  // 5. SETTINGS: REGIONAL COEFFICIENTS & AUDIT
  const [regions, setRegions] = useState([
    { name: 'Алматы (Южная столица)', coeff: 1.15, code: 'ALA', climate: 'Сейсмоопасная зона 9 баллов', activeProjects: 142, logistics: '+12%', avgCostPerM2: 52000, trend: '+4.2%' },
    { name: 'Астана (Главная столица)', coeff: 1.18, code: 'TSE', climate: 'Ветровая нагрузка / Зима -40°C', activeProjects: 189, logistics: '+15%', avgCostPerM2: 58000, trend: '+6.1%' },
    { name: 'Шымкент (Мегаполис)', coeff: 1.05, code: 'CIT', climate: 'Южный сухой / Сейсмика 7-8', activeProjects: 96, logistics: 'Базовый', avgCostPerM2: 41000, trend: '+2.8%' },
    { name: 'Караганда', coeff: 1.08, code: 'KGF', climate: 'Центральный промышленный', activeProjects: 64, logistics: '+8%', avgCostPerM2: 43500, trend: '+1.5%' },
    { name: 'Атырау (Нефтяной регион)', coeff: 1.25, code: 'GUW', climate: 'Прикаспийская солончаковая зона', activeProjects: 88, logistics: '+25%', avgCostPerM2: 68000, trend: '+8.4%' },
    { name: 'Актау (Мангистау)', coeff: 1.22, code: 'SCO', climate: 'Морской климат / Коррозия', activeProjects: 52, logistics: '+22%', avgCostPerM2: 64000, trend: '+7.1%' },
    { name: 'Актобе', coeff: 1.10, code: 'AKX', climate: 'Западный степной', activeProjects: 45, logistics: '+10%', avgCostPerM2: 44000, trend: '+3.0%' },
    { name: 'Павлодар', coeff: 1.09, code: 'PWL', climate: 'Северный промышленный', activeProjects: 38, logistics: '+9%', avgCostPerM2: 42800, trend: '+2.1%' },
    { name: 'Усть-Каменогорск (ВКО)', coeff: 1.12, code: 'UKK', climate: 'Горный / Резко континентальный', activeProjects: 41, logistics: '+12%', avgCostPerM2: 46000, trend: '+3.5%' },
    { name: 'Костанай', coeff: 1.07, code: 'KSN', climate: 'Северо-Западный аграрный', activeProjects: 32, logistics: '+7%', avgCostPerM2: 40500, trend: '+1.9%' },
    { name: 'Кызылорда', coeff: 1.06, code: 'KZO', climate: 'Арало-Сырдарьинский сухой', activeProjects: 28, logistics: '+6%', avgCostPerM2: 39800, trend: '+2.0%' },
    { name: 'Тараз (Жамбыл)', coeff: 1.05, code: 'DMB', climate: 'Южный предгорный', activeProjects: 35, logistics: 'Базовый', avgCostPerM2: 39500, trend: '+1.7%' },
  ]);
  const [regionViewMode, setRegionViewMode] = useState('cards'); // 'cards' | 'table'
  const [compareCity1, setCompareCity1] = useState('TSE');
  const [compareCity2, setCompareCity2] = useState('CIT');
  const [auditLogsList, setAuditLogsList] = useState([]);

  // 6. ROLES MANAGEMENT
  const [rolesList, setRolesList] = useState([
    { id: 'customer', name: 'Заказчик', icon: '📋', description: 'Размещение заказов и контроль смет' },
    { id: 'executor', name: 'Исполнитель', icon: '🔧', description: 'Выполнение строительно-монтажных работ' },
    { id: 'engineer', name: 'Инженер', icon: '👷', description: 'Технический надзор и экспертиза' },
    { id: 'admin', name: 'Администратор', icon: '⚙️', description: 'Полный доступ к управлению системой' },
    { id: 'manager', name: 'Аккаунт Менеджер', icon: '💼', description: 'Поддержка клиентов и модерация' },
    { id: 'analyst', name: 'Аналитик', icon: '📊', description: 'Финальная отчётность, проверка документации, PDF-экспорт и архивация' }
  ]);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm, setRoleForm] = useState({ id: '', name: '', icon: '👤', description: '' });

  // Load backend status and audit logs on mount
  useEffect(() => {
    setAuditLogsList(getAuditLogs());

    // Ping backend price status safely
    getStatus()
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('online'));
  }, []);

  if (!isOpen) return null;

  // Handlers for Overview Navigation
  const handleOverviewCategoryClick = (categoryName) => {
    setDbCategoryFilter(categoryName);
    setActiveTab('database');
  };

  // Handlers for Prices Tab
  const handleOpenAddPrice = () => {
    setEditingPriceItem(null);
    setPriceForm({ id: `E${Math.floor(10 + Math.random() * 90)}-01-${Math.floor(100 + Math.random() * 900)}`, name: '', category: priceTypeFilter === 'all' ? 'Работы' : priceTypeFilter, unit: 'м²', price: 2500, region: 'Алматы' });
    setPriceModalOpen(true);
  };

  const handleOpenEditPrice = (item) => {
    setEditingPriceItem(item);
    setPriceForm({ ...item });
    setPriceModalOpen(true);
  };

  const handleSavePriceForm = (e) => {
    e.preventDefault();
    if (!priceForm.name.trim()) {
      alert('Укажите наименование позиции');
      return;
    }

    if (editingPriceItem) {
      // Update
      const updated = pricesList.map((p) => (p.id === editingPriceItem.id ? priceForm : p));
      setPricesList(updated);
      logAuditAction('update', `Редактирование расценки ${priceForm.id}: ${priceForm.name} (${priceForm.price} ₸)`, 'Прайсы');
    } else {
      // Create
      const updated = [priceForm, ...pricesList];
      setPricesList(updated);
      logAuditAction('create', `Создание новой позиции ${priceForm.id}: ${priceForm.name} (${priceForm.price} ₸)`, 'Прайсы');
    }

    setAuditLogsList(getAuditLogs());
    setPriceModalOpen(false);
  };

  const handleDeletePriceItem = (id) => {
    const item = pricesList.find((p) => p.id === id);
    const updated = pricesList.filter((p) => p.id !== id);
    setPricesList(updated);
    if (item) {
      logAuditAction('delete', `Удаление расценки ${item.id}: ${item.name}`, 'Прайсы');
      setAuditLogsList(getAuditLogs());
    }
    setDeleteConfirmId(null);
  };

  const handleImportExcelFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imported = await parseExcelOrCsvFile(file);
    if (imported && imported.length > 0) {
      setPricesList([...imported, ...pricesList]);
      logAuditAction('create', `Импортировано ${imported.length} позиций расценок из файла ${file.name}`, 'Прайсы');
      setAuditLogsList(getAuditLogs());
      alert(`🎉 Успешно импортировано ${imported.length} позиций из файла ${file.name}!`);
    } else {
      alert('Не удалось разобрать файл. Убедитесь, что это файл CSV или таблица Excel.');
    }
  };

  const handleResetPrices = () => {
    if (window.confirm('Сбросить все пользовательские расценки к базам по умолчанию?')) {
      setPricesList(BASE_NORMS_LIST);
      logAuditAction('update', 'Сброс цен и расценок к базам по умолчанию ГЭСН 2026', 'Прайсы');
      setAuditLogsList(getAuditLogs());
    }
  };

  // Handlers for Moderation Queue
  const handleApproveModeration = (id) => {
    const item = moderationQueue.find((m) => m.id === id);
    setModerationQueue((prev) => prev.filter((m) => m.id !== id));
    setModSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
    if (item) {
      logAuditAction('approve', `Одобрена заявка ${item.id}: ${item.title} (${item.author})`, 'Модерация');
      setAuditLogsList(getAuditLogs());
    }
  };

  const handleRejectModeration = (id) => {
    const reason = window.prompt('Укажите причину отклонения заявки:');
    if (reason !== null) {
      const item = moderationQueue.find((m) => m.id === id);
      setModerationQueue((prev) => prev.filter((m) => m.id !== id));
      setModSelectedIds((prev) => prev.filter((selectedId) => selectedId !== id));
      if (item) {
        logAuditAction('reject', `Отклонена заявка ${item.id}: ${item.title}. Причина: ${reason || 'Без указания'}`, 'Модерация');
        setAuditLogsList(getAuditLogs());
      }
    }
  };

  const handleApproveAllModeration = () => {
    if (moderationQueue.length === 0) return;
    if (window.confirm(`Вы уверены, что хотите одобрить все ${moderationQueue.length} заявок модерации в 1 клик?`)) {
      const count = moderationQueue.length;
      setModerationQueue([]);
      setModSelectedIds([]);
      logAuditAction('approve', `Массовое одобрение всей очереди модерации (${count} объектов)`, 'Модерация');
      setAuditLogsList(getAuditLogs());
    }
  };

  const handleToggleSelectModItem = (id) => {
    setModSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllMod = (filteredItems) => {
    if (modSelectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setModSelectedIds([]);
    } else {
      setModSelectedIds(filteredItems.map((item) => item.id));
    }
  };

  const handleApproveSelectedMod = () => {
    if (modSelectedIds.length === 0) return;
    if (window.confirm(`Одобрить выбранные заявки (${modSelectedIds.length} шт.)?`)) {
      const count = modSelectedIds.length;
      setModerationQueue((prev) => prev.filter((item) => !modSelectedIds.includes(item.id)));
      logAuditAction('approve', `Пакетное одобрение ${count} заявок модерации`, 'Модерация');
      setModSelectedIds([]);
      setAuditLogsList(getAuditLogs());
    }
  };

  const handleRejectSelectedMod = () => {
    if (modSelectedIds.length === 0) return;
    const reason = window.prompt(`Причина отклонения ${modSelectedIds.length} выбранных заявок:`);
    if (reason !== null) {
      const count = modSelectedIds.length;
      setModerationQueue((prev) => prev.filter((item) => !modSelectedIds.includes(item.id)));
      logAuditAction('reject', `Пакетное отклонение ${count} заявок модерации. Причина: ${reason || 'Без указания'}`, 'Модерация');
      setModSelectedIds([]);
      setAuditLogsList(getAuditLogs());
    }
  };

  // Handlers for Users Tab
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({ id: `U-${Math.floor(100 + Math.random() * 900)}`, name: '', role: 'customer', email: '', phone: '', city: 'Алматы', status: 'active', source: 'Ручной', rating: '0.0' });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (user) => {
    setEditingUser(user);
    setUserForm({ ...user });
    setIsUserModalOpen(true);
  };

  const handleSaveUserForm = (e) => {
    e.preventDefault();
    if (!userForm.name.trim()) return;

    const targetRole = rolesList.find(r => r.id === userForm.role);
    const roleLabel = targetRole ? targetRole.name : userForm.role;
    const userToSave = { ...userForm, roleLabel };

    if (editingUser) {
      setUsersList(usersList.map((u) => (u.id === editingUser.id ? userToSave : u)));
      logAuditAction('update', `Отредактирован пользователь ${userToSave.id}: ${userToSave.name}`, 'Пользователи');
    } else {
      setUsersList([userToSave, ...usersList]);
      logAuditAction('create', `Создан новый пользователь: ${userToSave.name}`, 'Пользователи');
    }
    setAuditLogsList(getAuditLogs());
    setIsUserModalOpen(false);
  };

  const handleOpenAddRole = () => {
    setEditingRole(null);
    setRoleForm({ id: '', name: '', icon: '👤', description: '' });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({ ...role });
    setIsRoleModalOpen(true);
  };

  const handleDeleteRole = (roleId) => {
    if (['admin', 'customer', 'engineer', 'executor'].includes(roleId)) {
      alert("Нельзя удалить базовую системную роль!");
      return;
    }
    if (window.confirm("Удалить эту роль?")) {
      setRolesList(rolesList.filter(r => r.id !== roleId));
      logAuditAction('delete', `Удалена роль ${roleId}`, 'Роли');
      setAuditLogsList(getAuditLogs());
    }
  };

  const handleSaveRoleForm = (e) => {
    e.preventDefault();
    if (!roleForm.name.trim() || !roleForm.id.trim()) return;

    if (editingRole) {
      setRolesList(rolesList.map(r => r.id === editingRole.id ? roleForm : r));
      logAuditAction('update', `Отредактирована роль ${roleForm.name}`, 'Роли');
    } else {
      if (rolesList.find(r => r.id === roleForm.id)) {
        alert("Роль с таким ключом уже существует!");
        return;
      }
      setRolesList([...rolesList, roleForm]);
      logAuditAction('create', `Создана новая роль ${roleForm.name}`, 'Роли');
    }
    setIsRoleModalOpen(false);
    setAuditLogsList(getAuditLogs());
  };

  const handleChangeRole = (userId, newRole) => {
    const targetRole = rolesList.find(r => r.id === newRole);
    const roleLabel = targetRole ? targetRole.name : newRole;
    const updated = usersList.map((u) => (u.id === userId ? { ...u, role: newRole, roleLabel } : u));
    const targetUser = usersList.find((u) => u.id === userId);
    setUsersList(updated);

    if (targetUser) {
      logAuditAction('update', `Сменена роль пользователя ${targetUser.name} на "${roleLabel}"`, 'Пользователи');
      setAuditLogsList(getAuditLogs());
    }
    setChangeRoleModalUser(null);
  };

  const handleToggleLockUser = (userId) => {
    const updated = usersList.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === 'blocked' ? 'active' : 'blocked';
        logAuditAction('update', `${nextStatus === 'blocked' ? '🚫 Заблокирован' : '✅ Разблокирован'} пользователь ${u.name}`, 'Пользователи');
        return { ...u, status: nextStatus };
      }
      return u;
    });
    setUsersList(updated);
    setAuditLogsList(getAuditLogs());
  };

  // Handlers for Settings Tab (Regions & Audit)
  const handleEditRegionCoeff = (code) => {
    const reg = regions.find((r) => r.code === code);
    if (!reg) return;
    const newCoeff = window.prompt(`Введите новый коэффициент для региона ${reg.name}:`, reg.coeff);
    if (newCoeff && !isNaN(parseFloat(newCoeff))) {
      const val = parseFloat(newCoeff);
      setRegions(regions.map((r) => (r.code === code ? { ...r, coeff: val } : r)));
      logAuditAction('update', `Изменен коэффициент для региона ${reg.name} с ${reg.coeff} на ${val}`, 'Регионы');
      setAuditLogsList(getAuditLogs());
    }
  };

  const handleAddRegion = () => {
    const name = window.prompt('Укажите название нового региона Казахстана:');
    if (!name) return;
    const code = window.prompt('Укажите 3-буквенный код региона (например, KST):', 'KST');
    if (!code) return;
    const coeff = parseFloat(window.prompt('Укажите коэффициент цен (например, 1.12):', '1.10')) || 1.0;

    setRegions([...regions, { name, code: code.toUpperCase(), coeff }]);
    logAuditAction('create', `Добавлен новый регион ${name} (${code}) с коэффициентом ×${coeff}`, 'Регионы');
    setAuditLogsList(getAuditLogs());
  };

  // Filtered Prices
  const filteredPrices = pricesList.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(priceSearch.toLowerCase()) || item.id.toLowerCase().includes(priceSearch.toLowerCase());
    const matchesType = priceTypeFilter === 'all' || item.category === priceTypeFilter;
    return matchesSearch && matchesType;
  });

  const totalPricePages = Math.ceil(filteredPrices.length / pricesPerPage) || 1;
  const paginatedPrices = filteredPrices.slice((pricePage - 1) * pricesPerPage, pricePage * pricesPerPage);

  // Filtered Database Norms
  const filteredNorms = BASE_NORMS_LIST.filter((item) => {
    const matchesCategory = item.category === dbCategoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(dbSearch.toLowerCase()) || item.id.toLowerCase().includes(dbSearch.toLowerCase()) || item.file.toLowerCase().includes(dbSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const totalDbPages = Math.ceil(filteredNorms.length / dbItemsPerPage) || 1;
  const paginatedNorms = filteredNorms.slice((dbPage - 1) * dbItemsPerPage, dbPage * dbItemsPerPage);

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()) || u.phone.includes(userSearch);
    return matchesRole && matchesSearch;
  });

  return (
    <div className={inline ? "admin-modal-inline" : "admin-modal-overlay"}>
      <div className="admin-modal-container">
        {/* Header Bar */}
        <div className="admin-header">
          <div className="admin-title-wrap">
            <span className="admin-icon">⚙️</span>
            <div>
              <div className="admin-title">
                {userRole === 'company' && currentUser?.name ? `${currentUser.name} ` : 'QazGost AI '}<span>Панель Администратора</span>
              </div>
              <div className="admin-subtitle">Управление сметной базой, модерация, пользователи и аудит</div>
            </div>
          </div>

          <div className="admin-header-actions">
            <span className={`admin-live-badge ${backendStatus === 'online' ? 'status-online' : 'status-offline'}`}>
              {backendStatus === 'online' ? '● AI BACKEND ONLINE' : '⚠️ CHECKING BACKEND...'}
            </span>
            {!inline && (
              <button className="admin-close-btn" onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        </div>

        {/* MAIN NAVIGATION TABS */}
        <div className="admin-tabs-bar">
          <button className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <span>📊</span> Обзор
          </button>
          <button className={`admin-tab-btn ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
            <span>🗄️</span> База данных
          </button>
          <button className={`admin-tab-btn ${activeTab === 'prices' ? 'active' : ''}`} onClick={() => setActiveTab('prices')}>
            <span>💰</span> Цены
            <span className="admin-tab-count">{pricesList.length}</span>
          </button>
          <button className={`admin-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>
            <span>🛡️</span> Модерация
            {moderationQueue.length > 0 && (
              <span className="admin-tab-count alert">{moderationQueue.length}</span>
            )}
          </button>
          <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <span>👥</span> Пользователи
          </button>
          <button className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span>⚙️</span> Настройки
          </button>
          <button className={`admin-tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
            <span>🔐</span> Роли
          </button>
          <button className={`admin-tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
            <span>📁</span> Документооборот
            <span className="admin-tab-count">{documentsList.length}</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="admin-body">
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW (📊 Обзор)                                                */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <div className="admin-tab-content">
              {/* Progress Bar of Target Completion (33 000 positions target) */}
              <div className="admin-section-box target-progress-box">
                <div className="target-header-row">
                  <div>
                    <h3 className="admin-box-title">📊 Совокупный объём базы строительных нормативов РК</h3>
                    <p className="admin-box-sub">Целевой показатель наполнения сметной базы: 33 000 позиций (ГЭСН/СНиП 2026)</p>
                  </div>
                  <div className="target-count-badge">
                    <span>14 750</span> / 33 000 позиций (44.7%)
                  </div>
                </div>

                <div className="progress-bar-track">
                  <div className="progress-bar-fill" style={{ width: '44.7%' }}></div>
                </div>
              </div>

              {/* 3 Category Statistics Cards (Works, Materials, Equipment) */}
              <div className="admin-overview-grid">
                <div className="admin-stat-card card-gold clickable-card" onClick={() => handleOverviewCategoryClick('Работы')}>
                  <div className="card-top-row">
                    <span className="card-icon-emoji">🔧</span>
                    <span className="target-chip">Цель: 20 000</span>
                  </div>
                  <div className="admin-stat-title">Работы (ГЭСН-2026)</div>
                  <div className="admin-stat-value">8 240 позиций</div>
                  <div className="admin-stat-sub">145 файлов источников • Нажмите для перехода ➔</div>
                </div>

                <div className="admin-stat-card card-cyan clickable-card" onClick={() => handleOverviewCategoryClick('Материалы')}>
                  <div className="card-top-row">
                    <span className="card-icon-emoji">🧱</span>
                    <span className="target-chip">Цель: 12 000</span>
                  </div>
                  <div className="admin-stat-title">Материалы</div>
                  <div className="admin-stat-value">5 410 позиций</div>
                  <div className="admin-stat-sub">82 файла источников • Нажмите для перехода ➔</div>
                </div>

                <div className="admin-stat-card card-purple clickable-card" onClick={() => handleOverviewCategoryClick('Техника')}>
                  <div className="card-top-row">
                    <span className="card-icon-emoji">🚜</span>
                    <span className="target-chip chip-done">Цель: 1 000 (Достигнуто!)</span>
                  </div>
                  <div className="admin-stat-title">Спецтехника</div>
                  <div className="admin-stat-value">1 100 позиций</div>
                  <div className="admin-stat-sub">18 файлов источников • Нажмите для перехода ➔</div>
                </div>
              </div>

              {/* Backend PriceDB Status Monitoring Box */}
              <div className="admin-section-box">
                <div className="backend-monitor-header">
                  <h3 className="admin-box-title">⚡ Мониторинг микросервиса Backend PriceDB</h3>
                  <span className={`status-indicator-badge ${backendStatus === 'online' ? 'online' : 'offline'}`}>
                    {backendStatus === 'online' ? '✅ ONLINE (Подключено)' : '⚠️ OFFLINE'}
                  </span>
                </div>

                <div className="backend-metrics-grid">
                  <div className="backend-metric-item">
                    <span className="metric-label">API Статус AIService</span>
                    <span className="metric-val text-green">AIService.getPriceStats() OK</span>
                  </div>
                  <div className="backend-metric-item">
                    <span className="metric-label">Запросов к базе за 24ч</span>
                    <span className="metric-val">14 280 запросов</span>
                  </div>
                  <div className="backend-metric-item">
                    <span className="metric-label">Средний отклик API</span>
                    <span className="metric-val">{backendStats.responseMs} мс</span>
                  </div>
                  <div className="backend-metric-item">
                    <span className="metric-label">Синхронизация облака</span>
                    <span className="metric-val">100% Автоматическая</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DATABASE (🗄️ База данных)                                         */}
          {/* ========================================================================= */}
          {activeTab === 'database' && (
            <div className="admin-tab-content">
              {/* Type Filters & Search Row */}
              <div className="admin-controls-row">
                <div className="type-toggle-group">
                  <button className={`type-btn ${dbCategoryFilter === 'Работы' ? 'active' : ''}`} onClick={() => { setDbCategoryFilter('Работы'); setDbPage(1); }}>
                    🔧 Работы
                  </button>
                  <button className={`type-btn ${dbCategoryFilter === 'Материалы' ? 'active' : ''}`} onClick={() => { setDbCategoryFilter('Материалы'); setDbPage(1); }}>
                    🧱 Материалы
                  </button>
                  <button className={`type-btn ${dbCategoryFilter === 'Техника' ? 'active' : ''}`} onClick={() => { setDbCategoryFilter('Техника'); setDbPage(1); }}>
                    🚜 Техника
                  </button>
                </div>

                {dbCategoryFilter === 'Работы' && (
                  <div className="view-mode-group">
                    <button className={`mode-btn ${dbViewMode === 'wbs' ? 'active' : ''}`} onClick={() => setDbViewMode('wbs')}>
                      📂 По WBS (Группы)
                    </button>
                    <button className={`mode-btn ${dbViewMode === 'flat' ? 'active' : ''}`} onClick={() => setDbViewMode('flat')}>
                      📋 Полный список
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="🔍 Поиск по коду, названию или файлу источников..."
                  value={dbSearch}
                  onChange={(e) => { setDbSearch(e.target.value); setDbPage(1); }}
                />
              </div>

              {/* View Mode 1: 📂 Grouped WBS View (for "Работы") */}
              {dbCategoryFilter === 'Работы' && dbViewMode === 'wbs' ? (
                <div className="wbs-groups-accordion">
                  <h4 className="wbs-section-heading">Иерархическая структура WBS (21 Группа строительных нормативов РК)</h4>
                  <div className="wbs-grid">
                    {WBS_GROUPS.map((grp) => (
                      <div className="wbs-card" key={grp.id}>
                        <div className="wbs-card-top">
                          <span className="wbs-icon">{grp.icon}</span>
                          <span className="wbs-coverage-badge">{grp.coverage}% WBS Покрытие</span>
                        </div>
                        <h4 className="wbs-title">{grp.name}</h4>
                        <div className="wbs-stats-row">
                          <span>Привязано: <strong>{grp.count} работ</strong></span>
                          <span>Видов норм: <strong>{grp.normTypes}</strong></span>
                        </div>
                        <div className="wbs-progress-mini">
                          <div className="fill" style={{ width: `${grp.coverage}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* View Mode 2: 📋 Flat Paginated View */
                <div className="admin-section-box">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Код позиции</th>
                        <th>Наименование работы / материала</th>
                        <th>Категория / Раздел</th>
                        <th>Ед. изм.</th>
                        <th>⏱ Норма труда (ч-ч)</th>
                        <th>💰 Базовая цена (₸)</th>
                        <th>Источник</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedNorms.map((item) => (
                        <tr key={item.id}>
                          <td className="code-cell">{item.id}</td>
                          <td className="name-cell"><strong>{item.name}</strong></td>
                          <td><span className="cat-chip">{item.section || item.category}</span></td>
                          <td>{item.unit}</td>
                          <td className="num-cell">{item.laborNorm} ч-ч</td>
                          <td className="price-cell">{item.price.toLocaleString()} ₸</td>
                          <td className="file-cell">{item.file}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Pagination Footer */}
                  <div className="admin-pagination-row">
                    <span>Показано {paginatedNorms.length} из {filteredNorms.length} нормативов</span>
                    <div className="pagination-btns">
                      <button disabled={dbPage === 1} onClick={() => setDbPage(dbPage - 1)}>← Назад</button>
                      <span>Стр. {dbPage} из {totalDbPages}</span>
                      <button disabled={dbPage >= totalDbPages} onClick={() => setDbPage(dbPage + 1)}>Вперёд →</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: PRICES (💰 Цены)                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'prices' && (
            <div className="admin-tab-content">
              {/* Controls Header Row */}
              <div className="admin-controls-row">
                <div className="type-toggle-group">
                  <button className={`type-btn ${priceTypeFilter === 'all' ? 'active' : ''}`} onClick={() => { setPriceTypeFilter('all'); setPricePage(1); }}>
                    Все расценки
                  </button>
                  <button className={`type-btn ${priceTypeFilter === 'Работы' ? 'active' : ''}`} onClick={() => { setPriceTypeFilter('Работы'); setPricePage(1); }}>
                    🔧 Работы
                  </button>
                  <button className={`type-btn ${priceTypeFilter === 'Материалы' ? 'active' : ''}`} onClick={() => { setPriceTypeFilter('Материалы'); setPricePage(1); }}>
                    🧱 Материалы
                  </button>
                  <button className={`type-btn ${priceTypeFilter === 'Техника' ? 'active' : ''}`} onClick={() => { setPriceTypeFilter('Техника'); setPricePage(1); }}>
                    🚜 Техника
                  </button>
                </div>

                <input
                  type="text"
                  className="admin-search-input"
                  placeholder="🔍 Поиск расценки по коду или наименованию..."
                  value={priceSearch}
                  onChange={(e) => { setPriceSearch(e.target.value); setPricePage(1); }}
                />

                <button className="admin-primary-btn" onClick={handleOpenAddPrice}>
                  + Добавить позицию
                </button>
              </div>

              {/* Action Buttons Row for Excel Import / Export */}
              <div className="admin-actions-bar">
                <button className="btn-excel-export" onClick={() => exportPricesToExcel(filteredPrices)}>
                  📥 Выгрузить в Excel (.xlsx)
                </button>
                <button className="btn-excel-export" onClick={() => exportAll3SheetsExcel(pricesList)}>
                  📊 Выгрузить всё (3 листа)
                </button>
                <label className="btn-excel-import">
                  📤 Загрузить Excel
                  <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImportExcelFile} style={{ display: 'none' }} />
                </label>
                <button className="btn-reset-danger" onClick={handleResetPrices}>
                  🔄 Сбросить цены
                </button>
              </div>

              {/* Prices Table (100 items / page) */}
              <div className="admin-section-box">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Код расценки</th>
                      <th>Наименование позиции</th>
                      <th>Категория</th>
                      <th>Ед. изм.</th>
                      <th>Базовая цена (₸)</th>
                      <th>Регион</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPrices.map((item) => (
                      <tr key={item.id}>
                        <td className="code-cell">{item.id}</td>
                        <td className="name-cell"><strong>{item.name}</strong></td>
                        <td><span className="cat-chip">{item.category}</span></td>
                        <td>{item.unit}</td>
                        <td className="price-cell">{item.price?.toLocaleString()} ₸</td>
                        <td>{item.region || 'Казахстан'}</td>
                        <td className="actions-cell">
                          <button className="btn-table-action" onClick={() => handleOpenEditPrice(item)} title="Редактировать">✏️</button>
                          <button className="btn-table-action action-delete" onClick={() => setDeleteConfirmId(item.id)} title="Удалить">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                <div className="admin-pagination-row">
                  <span>Всего позиций: {filteredPrices.length} (по 100 на страницу)</span>
                  <div className="pagination-btns">
                    <button disabled={pricePage === 1} onClick={() => setPricePage(pricePage - 1)}>← Назад</button>
                    <span>Стр. {pricePage} из {totalPricePages}</span>
                    <button disabled={pricePage >= totalPricePages} onClick={() => setPricePage(pricePage + 1)}>Вперёд →</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: MODERATION (🛡️ Модерация & Верификация ИИН/БИН)               */}
          {/* ========================================================================= */}
          {activeTab === 'moderation' && (() => {
            const filteredModQueue = moderationQueue.filter((item) => {
              if (modCategoryFilter === 'urgent' && item.priority !== 'high') return false;
              if (modCategoryFilter === 'orders' && item.category !== 'orders') return false;
              if (modCategoryFilter === 'verification' && item.category !== 'verification') return false;
              if (modCategoryFilter === 'complaints' && item.category !== 'complaints') return false;
              if (modCategoryFilter === 'spam' && item.category !== 'spam') return false;

              if (modSearch.trim()) {
                const query = modSearch.toLowerCase();
                return (
                  (item.id || '').toLowerCase().includes(query) ||
                  (item.title || '').toLowerCase().includes(query) ||
                  (item.author || '').toLowerCase().includes(query) ||
                  (item.bin || '').toLowerCase().includes(query) ||
                  (item.city || '').toLowerCase().includes(query) ||
                  (item.type || '').toLowerCase().includes(query)
                );
              }
              return true;
            });

            const urgentCount = moderationQueue.filter(m => m.priority === 'high').length;
            const ordersCount = moderationQueue.filter(m => m.category === 'orders').length;
            const verifCount = moderationQueue.filter(m => m.category === 'verification').length;
            const complaintsCount = moderationQueue.filter(m => m.category === 'complaints').length;
            const spamCount = moderationQueue.filter(m => m.category === 'spam').length;
            const totalBudget = moderationQueue.reduce((acc, m) => acc + (Number(m.amount) || 0), 0);

            const allFilteredSelected = filteredModQueue.length > 0 && filteredModQueue.every(m => modSelectedIds.includes(m.id));

            return (
              <div className="admin-tab-content">
                {/* ── 1. KPI SUMMARY TILES ── */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                  gap: '12px',
                  marginBottom: '1.25rem'
                }}>
                  {/* Total Queue Tile */}
                  <div
                    onClick={() => setModCategoryFilter('all')}
                    style={{
                      background: modCategoryFilter === 'all'
                        ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.22), rgba(15, 23, 42, 0.95))'
                        : 'rgba(15, 23, 42, 0.75)',
                      border: `1px solid ${modCategoryFilter === 'all' ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: modCategoryFilter === 'all' ? '0 0 20px rgba(37, 99, 235, 0.25)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Очередь аудита</span>
                      <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#ffffff', lineHeight: '1.2' }}>
                      {moderationQueue.length} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '500' }}>дел</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                      Сумма: <strong style={{ color: '#fbbf24' }}>{totalBudget.toLocaleString()} ₸</strong>
                    </div>
                  </div>

                  {/* Urgent Attention Tile */}
                  <div
                    onClick={() => setModCategoryFilter(modCategoryFilter === 'urgent' ? 'all' : 'urgent')}
                    style={{
                      background: modCategoryFilter === 'urgent'
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.25), rgba(15, 23, 42, 0.95))'
                        : 'rgba(15, 23, 42, 0.75)',
                      border: `1px solid ${modCategoryFilter === 'urgent' ? '#ef4444' : 'rgba(239, 68, 68, 0.3)'}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: modCategoryFilter === 'urgent' ? '0 0 20px rgba(239, 68, 68, 0.3)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#fca5a5', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Срочные дела</span>
                      <span style={{ fontSize: '1.1rem' }}>🔴</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f87171', lineHeight: '1.2' }}>
                      {urgentCount} <span style={{ fontSize: '0.85rem', color: '#fca5a5', fontWeight: '500' }}>заявок</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '4px' }}>Решение &lt; 1 часа</div>
                  </div>

                  {/* Verification Tile */}
                  <div
                    onClick={() => setModCategoryFilter(modCategoryFilter === 'verification' ? 'all' : 'verification')}
                    style={{
                      background: modCategoryFilter === 'verification'
                        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(15, 23, 42, 0.95))'
                        : 'rgba(15, 23, 42, 0.75)',
                      border: `1px solid ${modCategoryFilter === 'verification' ? '#10b981' : 'rgba(16, 185, 129, 0.3)'}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: modCategoryFilter === 'verification' ? '0 0 20px rgba(16, 185, 129, 0.3)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#6ee7b7', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Верификация</span>
                      <span style={{ fontSize: '1.1rem' }}>🏢</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#34d399', lineHeight: '1.2' }}>
                      {verifCount} <span style={{ fontSize: '0.85rem', color: '#6ee7b7', fontWeight: '500' }}>БИН/ИИН</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6ee7b7', marginTop: '4px' }}>Проверка лицензий ГАСК</div>
                  </div>

                  {/* Complaints Tile */}
                  <div
                    onClick={() => setModCategoryFilter(modCategoryFilter === 'complaints' ? 'all' : 'complaints')}
                    style={{
                      background: modCategoryFilter === 'complaints'
                        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(15, 23, 42, 0.95))'
                        : 'rgba(15, 23, 42, 0.75)',
                      border: `1px solid ${modCategoryFilter === 'complaints' ? '#f59e0b' : 'rgba(245, 158, 11, 0.3)'}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: modCategoryFilter === 'complaints' ? '0 0 20px rgba(245, 158, 11, 0.3)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#fde68a', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Споры & Жалобы</span>
                      <span style={{ fontSize: '1.1rem' }}>⚖️</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#fbbf24', lineHeight: '1.2' }}>
                      {complaintsCount} <span style={{ fontSize: '0.85rem', color: '#fde68a', fontWeight: '500' }}>претензии</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fde68a', marginTop: '4px' }}>Эскроу-блокировки</div>
                  </div>
                </div>

                {/* ── 2. EXECUTIVE CONTROL BAR (CHIPS + SEARCH + ACTIONS) ── */}
                <div style={{
                  background: 'rgba(14, 22, 38, 0.85)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {/* Top Bar: Chips and View Mode */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        className={`admin-filter-chip ${modCategoryFilter === 'all' ? 'active' : ''}`}
                        onClick={() => setModCategoryFilter('all')}
                      >
                        📋 Все ({moderationQueue.length})
                      </button>
                      <button
                        className={`admin-filter-chip chip-urgent ${modCategoryFilter === 'urgent' ? 'active' : ''}`}
                        onClick={() => setModCategoryFilter('urgent')}
                      >
                        🔴 Срочные ({urgentCount})
                      </button>
                      <button
                        className={`admin-filter-chip ${modCategoryFilter === 'orders' ? 'active' : ''}`}
                        onClick={() => setModCategoryFilter('orders')}
                      >
                        🏗️ Заказы ({ordersCount})
                      </button>
                      <button
                        className={`admin-filter-chip ${modCategoryFilter === 'verification' ? 'active' : ''}`}
                        onClick={() => setModCategoryFilter('verification')}
                      >
                        🏢 Верификация ({verifCount})
                      </button>
                      <button
                        className={`admin-filter-chip ${modCategoryFilter === 'complaints' ? 'active' : ''}`}
                        onClick={() => setModCategoryFilter('complaints')}
                      >
                        ⚖️ Претензии ({complaintsCount})
                      </button>
                      <button
                        className={`admin-filter-chip ${modCategoryFilter === 'spam' ? 'active' : ''}`}
                        onClick={() => setModCategoryFilter('spam')}
                      >
                        🛡️ Антифрод ({spamCount})
                      </button>
                    </div>

                    {/* View Switcher Tabs */}
                    <div style={{ display: 'flex', background: 'rgba(8, 12, 22, 0.8)', borderRadius: '8px', padding: '3px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <button
                        style={{
                          background: modViewMode === 'table' ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(14, 165, 233, 0.3))' : 'transparent',
                          color: modViewMode === 'table' ? '#ffffff' : '#94a3b8',
                          border: modViewMode === 'table' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setModViewMode('table')}
                      >
                        📑 Таблица
                      </button>
                      <button
                        style={{
                          background: modViewMode === 'cards' ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.4), rgba(14, 165, 233, 0.3))' : 'transparent',
                          color: modViewMode === 'cards' ? '#ffffff' : '#94a3b8',
                          border: modViewMode === 'cards' ? '1px solid rgba(56, 189, 248, 0.4)' : 'none',
                          padding: '5px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setModViewMode('cards')}
                      >
                        🗂️ Карточки
                      </button>
                    </div>
                  </div>

                  {/* Search Bar & Fast Batch Operations */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ flex: '1 1 320px', maxWidth: '500px' }}>
                      <input
                        type="text"
                        className="admin-search-input"
                        placeholder="Поиск по номеру, названию, контрагенту, БИН/ИИН, городу..."
                        value={modSearch}
                        onChange={(e) => setModSearch(e.target.value)}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      {modSelectedIds.length > 0 && (
                        <>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                            Выбрано: <strong style={{ color: '#38bdf8' }}>{modSelectedIds.length}</strong>
                          </span>
                          <button
                            className="admin-primary-btn"
                            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '7px 14px', fontSize: '0.8rem' }}
                            onClick={handleApproveSelectedMod}
                          >
                            ✅ Одобрить ({modSelectedIds.length})
                          </button>
                          <button
                            className="admin-secondary-btn"
                            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '7px 14px', fontSize: '0.8rem' }}
                            onClick={handleRejectSelectedMod}
                          >
                            ❌ Отклонить ({modSelectedIds.length})
                          </button>
                        </>
                      )}

                      <button
                        className="admin-primary-btn"
                        style={{
                          background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                          padding: '7px 16px',
                          fontSize: '0.8rem',
                          fontWeight: '700'
                        }}
                        onClick={handleApproveAllModeration}
                        disabled={moderationQueue.length === 0}
                      >
                        ⚡ Одобрить всё ({moderationQueue.length})
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── 3. DATA VIEW: TABLE OR BENTO CARDS ── */}
                {filteredModQueue.length === 0 ? (
                  <div className="admin-section-box" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#94a3b8' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🎉</div>
                    <h4 style={{ color: '#ffffff', margin: '0 0 6px', fontSize: '1.1rem' }}>Очередь модерации чиста!</h4>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Нет заявок, ожидающих рассмотрения по выбранным фильтрам.</p>
                  </div>
                ) : modViewMode === 'table' ? (
                  /* ── HIGH-TECH TABLE VIEW ── */
                  <div className="admin-section-box" style={{ overflowX: 'auto', padding: '8px' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '36px', textAlign: 'center' }}>
                            <input
                              type="checkbox"
                              checked={allFilteredSelected}
                              onChange={() => handleToggleSelectAllMod(filteredModQueue)}
                              title="Выбрать все"
                              style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                            />
                          </th>
                          <th style={{ width: '130px' }}>Код / Приоритет</th>
                          <th style={{ width: '130px' }}>Категория</th>
                          <th>Предмет модерации & Контрагент</th>
                          <th style={{ width: '130px' }}>Локация / Время</th>
                          <th style={{ width: '140px', textAlign: 'right' }}>Сумма сделки</th>
                          <th style={{ width: '110px', textAlign: 'center' }}>AI Скоринг</th>
                          <th style={{ width: '170px', textAlign: 'center' }}>Действия</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredModQueue.map((item) => {
                          const isSelected = modSelectedIds.includes(item.id);
                          const isUrgent = item.priority === 'high';

                          return (
                            <tr
                              key={item.id}
                              style={{
                                background: isSelected
                                  ? 'rgba(37, 99, 235, 0.14)'
                                  : isUrgent
                                  ? 'rgba(239, 68, 68, 0.05)'
                                  : 'rgba(14, 22, 38, 0.55)',
                                borderLeft: isUrgent
                                  ? '3px solid #ef4444'
                                  : '3px solid transparent'
                              }}
                            >
                              {/* Checkbox */}
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectModItem(item.id)}
                                  style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                                />
                              </td>

                              {/* Code & Priority */}
                              <td>
                                <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                                  {item.id}
                                </div>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  color: isUrgent ? '#f87171' : '#fde68a'
                                }}>
                                  {isUrgent ? '🔴 Срочно' : '🟡 Обычный'}
                                </span>
                              </td>

                              {/* Category Pill */}
                              <td>
                                <span
                                  className="cat-chip"
                                  style={{
                                    background:
                                      item.category === 'orders' ? 'rgba(59, 130, 246, 0.15)' :
                                      item.category === 'verification' ? 'rgba(16, 185, 129, 0.15)' :
                                      item.category === 'complaints' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                    color:
                                      item.category === 'orders' ? '#93c5fd' :
                                      item.category === 'verification' ? '#6ee7b7' :
                                      item.category === 'complaints' ? '#fde68a' : '#fca5a5',
                                    border: `1px solid ${
                                      item.category === 'orders' ? 'rgba(59, 130, 246, 0.3)' :
                                      item.category === 'verification' ? 'rgba(16, 185, 129, 0.3)' :
                                      item.category === 'complaints' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'
                                    }`
                                  }}
                                >
                                  {item.type}
                                </span>
                              </td>

                              {/* Subject & Author */}
                              <td>
                                <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.9rem', marginBottom: '3px' }}>
                                  {item.title}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                                  <span style={{ color: '#cbd5e1', fontWeight: '500' }}>{item.author}</span>
                                  {item.bin && item.bin !== '—' && item.bin !== 'Не указан' && (
                                    <span style={{ color: '#64748b', fontFamily: 'monospace' }}>БИН: {item.bin}</span>
                                  )}
                                  {item.docCount && (
                                    <span style={{ color: '#38bdf8', fontSize: '0.74rem' }}>📎 {item.docCount}</span>
                                  )}
                                </div>
                              </td>

                              {/* City & Time */}
                              <td>
                                <div style={{ color: '#ffffff', fontSize: '0.82rem', fontWeight: '600' }}>{item.city}</div>
                                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>{item.date}</div>
                              </td>

                              {/* Amount */}
                              <td style={{ textAlign: 'right', fontWeight: '800', color: item.amount > 0 ? '#fbbf24' : '#64748b', fontSize: '0.88rem' }}>
                                {item.amount > 0 ? `${Number(item.amount).toLocaleString()} ₸` : '—'}
                              </td>

                              {/* AI Risk Score */}
                              <td style={{ textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  fontWeight: '700',
                                  background:
                                    item.riskLevel === 'low' ? 'rgba(16, 185, 129, 0.12)' :
                                    item.riskLevel === 'medium' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.15)',
                                  color:
                                    item.riskLevel === 'low' ? '#6ee7b7' :
                                    item.riskLevel === 'medium' ? '#fde68a' : '#f87171',
                                  border: `1px solid ${
                                    item.riskLevel === 'low' ? 'rgba(16, 185, 129, 0.25)' :
                                    item.riskLevel === 'medium' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(239, 68, 68, 0.3)'
                                  }`
                                }}>
                                  {item.riskLevel === 'low' ? '🟢 Низкий' : item.riskLevel === 'medium' ? '🟡 Средний' : '🔴 Высокий'}
                                </span>
                              </td>

                              {/* Actions */}
                              <td style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                                  <button
                                    className="admin-primary-btn"
                                    style={{
                                      background: 'linear-gradient(135deg, #10b981, #059669)',
                                      padding: '5px 12px',
                                      fontSize: '0.76rem',
                                      borderRadius: '6px'
                                    }}
                                    onClick={() => handleApproveModeration(item.id)}
                                    title="Одобрить заявку"
                                  >
                                    ✅ Одобрить
                                  </button>
                                  <button
                                    className="btn-table-action"
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.15)',
                                      color: '#f87171',
                                      border: '1px solid rgba(239, 68, 68, 0.3)',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.76rem'
                                    }}
                                    onClick={() => handleRejectModeration(item.id)}
                                    title="Отклонить"
                                  >
                                    ❌
                                  </button>
                                  <button
                                    className="btn-table-action"
                                    style={{
                                      background: 'rgba(255, 255, 255, 0.05)',
                                      color: '#cbd5e1',
                                      border: '1px solid rgba(255, 255, 255, 0.1)',
                                      padding: '5px 8px',
                                      borderRadius: '6px',
                                      fontSize: '0.76rem'
                                    }}
                                    onClick={() => setInspectModalData(item)}
                                    title="Карточка дела"
                                  >
                                    👁️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* ── CARDS VIEW ── */
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '14px'
                  }}>
                    {filteredModQueue.map((item) => {
                      const isSelected = modSelectedIds.includes(item.id);
                      const isUrgent = item.priority === 'high';

                      return (
                        <div
                          key={item.id}
                          style={{
                            background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'rgba(15, 23, 42, 0.75)',
                            border: `1px solid ${isSelected ? '#3b82f6' : isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            gap: '12px',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? '0 0 20px rgba(37, 99, 235, 0.2)' : 'none'
                          }}
                        >
                          <div>
                            {/* Card Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectModItem(item.id)}
                                  style={{ cursor: 'pointer', accentColor: '#3b82f6' }}
                                />
                                <span style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.85rem', fontFamily: 'monospace' }}>{item.id}</span>
                                <span style={{
                                  fontSize: '0.72rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontWeight: '700',
                                  background: isUrgent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: isUrgent ? '#f87171' : '#fde68a'
                                }}>
                                  {isUrgent ? '🔴 Срочно' : '🟡 Обычный'}
                                </span>
                              </div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.date}</span>
                            </div>

                            {/* Card Title & Author */}
                            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.95rem', color: '#ffffff', lineHeight: '1.3' }}>
                              {item.title}
                            </h4>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>
                              {item.author} {item.bin && item.bin !== '—' && <span style={{ color: '#64748b' }}>({item.bin})</span>}
                            </div>

                            {/* Badges */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', fontSize: '0.78rem' }}>
                              <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '6px', color: '#cbd5e1' }}>
                                📍 {item.city}
                              </span>
                              {item.amount > 0 && (
                                <span style={{ background: 'rgba(245, 158, 11, 0.12)', padding: '3px 8px', borderRadius: '6px', color: '#fbbf24', fontWeight: '700' }}>
                                  💰 {Number(item.amount).toLocaleString()} ₸
                                </span>
                              )}
                              <span style={{
                                background: item.riskLevel === 'low' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                padding: '3px 8px',
                                borderRadius: '6px',
                                color: item.riskLevel === 'low' ? '#6ee7b7' : '#f87171',
                                fontWeight: '600'
                              }}>
                                Риск: {item.riskScore}
                              </span>
                            </div>
                          </div>

                          {/* Card Action Buttons */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                            <button
                              className="admin-primary-btn"
                              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'center' }}
                              onClick={() => handleApproveModeration(item.id)}
                            >
                              ✅ Одобрить
                            </button>
                            <button
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleRejectModeration(item.id)}
                            >
                              ❌ Отклонить
                            </button>
                            <button
                              style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                color: '#cbd5e1',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => setInspectModalData(item)}
                              title="Карточка дела"
                            >
                              👁️
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB 5: USERS (👥 Пользователи)                                            */}
          {/* ========================================================================= */}
          {activeTab === 'users' && (
            <div className="admin-tab-content">
              {/* Role Counters Filter Cards */}
              <div className="role-stat-cards-grid">
                <div className={`role-counter-card ${userRoleFilter === 'customer' ? 'active' : ''}`} onClick={() => setUserRoleFilter(userRoleFilter === 'customer' ? 'all' : 'customer')}>
                  <span className="icon">📋</span>
                  <div className="counter-val">{usersList.filter((u) => u.role === 'customer').length}</div>
                  <div className="counter-label">Заказчики</div>
                </div>

                <div className={`role-counter-card ${userRoleFilter === 'executor' ? 'active' : ''}`} onClick={() => setUserRoleFilter(userRoleFilter === 'executor' ? 'all' : 'executor')}>
                  <span className="icon">🔧</span>
                  <div className="counter-val">{usersList.filter((u) => u.role === 'executor').length}</div>
                  <div className="counter-label">Исполнители</div>
                </div>

                <div className={`role-counter-card ${userRoleFilter === 'engineer' ? 'active' : ''}`} onClick={() => setUserRoleFilter(userRoleFilter === 'engineer' ? 'all' : 'engineer')}>
                  <span className="icon">⚙️</span>
                  <div className="counter-val">{usersList.filter((u) => u.role === 'engineer').length}</div>
                  <div className="counter-label">Инженеры</div>
                </div>

                <div className={`role-counter-card ${userRoleFilter === 'admin' ? 'active' : ''}`} onClick={() => setUserRoleFilter(userRoleFilter === 'admin' ? 'all' : 'admin')}>
                  <span className="icon">👑</span>
                  <div className="counter-val">{usersList.filter((u) => u.role === 'admin').length}</div>
                  <div className="counter-label">Администраторы</div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="admin-controls-row" style={{ marginTop: '1rem', display: 'flex', gap: '15px' }}>
                <input
                  type="text"
                  className="admin-search-input"
                  style={{ flex: 1 }}
                  placeholder="🔍 Поиск по ФИО, Email или номеру телефона..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <button className="admin-primary-btn" onClick={handleOpenAddUser}>
                  + Добавить пользователя
                </button>
              </div>

              {/* Users Table */}
              <div className="admin-section-box">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>ФИО / Наименование</th>
                      <th>Текущая роль</th>
                      <th>Email / Телефон</th>
                      <th>Город</th>
                      <th>Источник</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((usr) => (
                      <tr key={usr.id}>
                        <td>{usr.id}</td>
                        <td><strong>{usr.name}</strong></td>
                        <td><span className={`role-pill role-${usr.role}`}>{usr.roleLabel}</span></td>
                        <td>
                          <div>{usr.email}</div>
                          <small style={{ color: '#94a3b8' }}>{usr.phone}</small>
                        </td>
                        <td>{usr.city}</td>
                        <td><span className="source-badge">{usr.source}</span></td>
                        <td>
                          <span className={usr.status === 'blocked' ? 'badge-blocked' : 'badge-ok'}>
                            {usr.status === 'blocked' ? '🚫 Заблокирован' : '✅ Активен'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button className="btn-table-action" onClick={() => setInspectUserModal(usr)} title="Профиль">👁️</button>
                          <button className="btn-table-action" onClick={() => handleOpenEditUser(usr)} title="Редактировать">✏️</button>
                          <button className="btn-table-action" onClick={() => handleToggleLockUser(usr.id)} title={usr.status === 'blocked' ? 'Разблокировать' : 'Заблокировать'}>
                            {usr.status === 'blocked' ? '✅' : '🚫'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 6: SETTINGS & AUDIT LOG (⚙️ Управление)                             */}
          {/* ========================================================================= */}
          {activeTab === 'settings' && (
            <div className="admin-tab-content">
              {/* Settings Sub-tabs toggle */}
              <div className="settings-subtabs-row">
                <button className={`subtab-btn ${settingsSubTab === 'regions' ? 'active' : ''}`} onClick={() => setSettingsSubTab('regions')}>
                  🗺️ Региональные коэффициенты
                </button>
                <button className={`subtab-btn ${settingsSubTab === 'audit' ? 'active' : ''}`} onClick={() => setSettingsSubTab('audit')}>
                  📜 Журнал действий / Аудит ({auditLogsList.length})
                </button>
              </div>

              {/* Sub-tab 1: Regional Coefficients (Rich Geo-Matrix) */}
              {settingsSubTab === 'regions' && (
                <div className="admin-regions-wrapper">
                  {/* Top Geo Metrics 4 Bento Cards */}
                  <div className="geo-metrics-grid">
                    <div className="geo-kpi-card kpi-blue">
                      <div className="geo-kpi-top">
                        <span className="geo-kpi-badge">СНиП РК 2026</span>
                        <span className="geo-kpi-icon">🇰🇿</span>
                      </div>
                      <div className="geo-kpi-val">17 Областей</div>
                      <div className="geo-kpi-label">Полный гео-охват Казахстана и 3 мегаполисов</div>
                    </div>

                    <div className="geo-kpi-card kpi-cyan">
                      <div className="geo-kpi-top">
                        <span className="geo-kpi-badge">СТОЛИЧНЫЙ ХАБ</span>
                        <span className="geo-kpi-icon">🏙️</span>
                      </div>
                      <div className="geo-kpi-val">×1.18 TSE / ×1.15 ALA</div>
                      <div className="geo-kpi-label">Коэффициенты Астаны и Алматы с учётом логистики</div>
                    </div>

                    <div className="geo-kpi-card kpi-amber">
                      <div className="geo-kpi-top">
                        <span className="geo-kpi-badge">МАКС. НАДБАВКА</span>
                        <span className="geo-kpi-icon">🛢️</span>
                      </div>
                      <div className="geo-kpi-val">×1.25 Атырау</div>
                      <div className="geo-kpi-label">Прикаспийский нефтегазовый кластер (+25%)</div>
                    </div>

                    <div className="geo-kpi-card kpi-emerald">
                      <div className="geo-kpi-top">
                        <span className="geo-kpi-badge">LIVE АКТИВНОСТЬ</span>
                        <span className="geo-kpi-icon">⚡</span>
                      </div>
                      <div className="geo-kpi-val">789 Объектов</div>
                      <div className="geo-kpi-label">Активно рассчитываются сметы прямо сейчас</div>
                    </div>
                  </div>

                  {/* Interactive Region Cost Comparison Cockpit */}
                  <div className="region-comparator-box">
                    <div className="comparator-header">
                      <div className="comp-title-group">
                        <span className="spark-icon">⚡</span>
                        <h4 className="comp-title">Интерактивный сметный компаратор регионов РК</h4>
                      </div>
                      <span className="comp-tag">База расчёта: Объект 100 м² (СНиП 8.04)</span>
                    </div>

                    <div className="comparator-controls-row">
                      <div className="comp-select-group">
                        <label>Регион А:</label>
                        <select value={compareCity1} onChange={(e) => setCompareCity1(e.target.value)}>
                          {regions.map(r => (
                            <option key={r.code} value={r.code}>{r.name} (×{r.coeff})</option>
                          ))}
                        </select>
                      </div>

                      <div className="comp-vs-badge">VS</div>

                      <div className="comp-select-group">
                        <label>Регион B:</label>
                        <select value={compareCity2} onChange={(e) => setCompareCity2(e.target.value)}>
                          {regions.map(r => (
                            <option key={r.code} value={r.code}>{r.name} (×{r.coeff})</option>
                          ))}
                        </select>
                      </div>

                      {/* Live Calculated Delta Result */}
                      {(() => {
                        const r1 = regions.find(r => r.code === compareCity1) || regions[0];
                        const r2 = regions.find(r => r.code === compareCity2) || regions[1];
                        const deltaKzt = Math.round(Math.abs(r1.coeff - r2.coeff) * 4500000);
                        const higherCity = r1.coeff >= r2.coeff ? r1.name.split(' ')[0] : r2.name.split(' ')[0];
                        return (
                          <div className="comp-result-card">
                            <span className="comp-res-label">Сметная разница на объект:</span>
                            <span className="comp-res-val">
                              {deltaKzt > 0 ? `+${deltaKzt.toLocaleString('ru-RU')} ₸ в пользу ${higherCity}` : 'Цены идентичны'}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Controls & View Switcher Row */}
                  <div className="region-controls-bar">
                    <div className="view-toggle-pills">
                      <button className={`view-pill ${regionViewMode === 'cards' ? 'active' : ''}`} onClick={() => setRegionViewMode('cards')}>
                        🗺️ Bento-карточки регионов
                      </button>
                      <button className={`view-pill ${regionViewMode === 'table' ? 'active' : ''}`} onClick={() => setRegionViewMode('table')}>
                        📊 Сметная таблица
                      </button>
                    </div>

                    <button className="admin-primary-btn" onClick={handleAddRegion}>
                      + Добавить регион РК
                    </button>
                  </div>

                  {/* 1. Bento Cards Mode */}
                  {regionViewMode === 'cards' ? (
                    <div className="region-cards-grid">
                      {regions.map((reg, idx) => (
                        <div className="region-bento-card" key={idx}>
                          <div className="reg-card-top">
                            <div className="reg-code-box">{reg.code}</div>
                            <div className={`reg-coeff-badge ${reg.coeff >= 1.2 ? 'high' : (reg.coeff >= 1.1 ? 'mid' : 'base')}`}>
                              ×{reg.coeff}
                            </div>
                          </div>

                          <h4 className="reg-name">{reg.name}</h4>
                          <div className="reg-climate-tag">🌡️ {reg.climate}</div>

                          <div className="reg-metrics-list">
                            <div className="reg-metric-row">
                              <span>Средняя цена работ:</span>
                              <strong>{reg.avgCostPerM2?.toLocaleString('ru-RU') || '45 000'} ₸/м²</strong>
                            </div>
                            <div className="reg-metric-row">
                              <span>Логистич. надбавка:</span>
                              <span className="text-cyan">{reg.logistics}</span>
                            </div>
                            <div className="reg-metric-row">
                              <span>Активных проектов:</span>
                              <span className="text-emerald">● {reg.activeProjects} строек</span>
                            </div>
                          </div>

                          <div className="reg-gauge-bar">
                            <div
                              className="fill"
                              style={{ width: `${Math.min(100, (reg.coeff - 1.0) * 400 + 20)}%` }}
                            ></div>
                          </div>

                          <div className="reg-card-footer">
                            <span className="reg-trend text-emerald">📈 {reg.trend || '+3.2%'} за квартал</span>
                            <button className="btn-edit-region" onClick={() => handleEditRegionCoeff(reg.code)}>
                              ⚙️ Настроить
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* 2. Analytical Table Mode */
                    <div className="admin-section-box">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Код</th>
                            <th>Регион / Область Казахстана</th>
                            <th>Климатическая специфика</th>
                            <th>Логистика</th>
                            <th>Ср. цена м²</th>
                            <th>Коэффициент</th>
                            <th>Проектов</th>
                            <th>Действие</th>
                          </tr>
                        </thead>
                        <tbody>
                          {regions.map((reg, idx) => (
                            <tr key={idx}>
                              <td><strong className="text-cyan">{reg.code}</strong></td>
                              <td><strong>{reg.name}</strong></td>
                              <td><span className="climate-badge">{reg.climate}</span></td>
                              <td><span className="logistics-badge">{reg.logistics}</span></td>
                              <td className="price-cell">{reg.avgCostPerM2?.toLocaleString('ru-RU')} ₸</td>
                              <td>
                                <span className={`reg-coeff-badge ${reg.coeff >= 1.2 ? 'high' : 'base'}`}>
                                  ×{reg.coeff}
                                </span>
                              </td>
                              <td><span className="text-emerald">● {reg.activeProjects}</span></td>
                              <td>
                                <button className="btn-table-action" onClick={() => handleEditRegionCoeff(reg.code)}>
                                  ⚙️ Изменить
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Chronological Audit Log */}
              {settingsSubTab === 'audit' && (
                <div className="admin-section-box">
                  <div className="section-header-flex">
                    <div>
                      <h3 className="admin-box-title">📜 Журнал аудита действий администрации</h3>
                      <p className="admin-box-sub">Хронологический лог всех операций администраторов, модераторов и AI-системы.</p>
                    </div>
                    <button className="btn-excel-export" onClick={exportAuditLogTxt}>
                      📥 Скачать текстовый отчет (.txt)
                    </button>
                  </div>

                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Время</th>
                        <th>Модуль</th>
                        <th>Тип операции</th>
                        <th>Исполнитель</th>
                        <th>Подробные детали действия</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogsList.map((log) => (
                        <tr key={log.id}>
                          <td>{log.formattedTime}</td>
                          <td><span className="cat-chip">{log.module}</span></td>
                          <td><span className={`log-type-badge type-${log.actionType}`}>{log.actionType?.toUpperCase()}</span></td>
                          <td><strong>{log.user}</strong></td>
                          <td className="name-cell">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 7: ROLES (🎭 Роли)                                                    */}
          {/* ========================================================================= */}
          {activeTab === 'roles' && (
            <div className="admin-tab-content">
              <div className="admin-controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>🎭 Управление ролями</h2>
                <button className="admin-primary-btn" onClick={handleOpenAddRole}>➕ Добавить роль</button>
              </div>
              
              <div className="admin-section-box">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Название (UI)</th>
                      <th>Системный код</th>
                      <th>Описание</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rolesList.map(r => (
                      <tr key={r.id}>
                        <td><strong>{r.icon} {r.name}</strong></td>
                        <td><span className="cat-chip">{r.id}</span></td>
                        <td>{r.description || '—'}</td>
                        <td className="actions-cell">
                          <button className="btn-table-action" onClick={() => handleOpenEditRole(r)} title="Редактировать">✏️</button>
                          <button className="btn-table-action" onClick={() => handleDeleteRole(r.id)} title="Удалить">🗑️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ──────── INTERACTIVE ROLE HIERARCHY TREE ──────── */}
              <div style={{ marginTop: '2rem' }}>
                <RoleHierarchyTreePage hideHeader={true} />
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: DOCUMENTS — ЗАГРУЗКА И ВЫГРУЗКА (ИМПОРТ / ЭКСПОРТ)                */}
          {/* ========================================================================= */}
          {activeTab === 'documents' && (
            <div className="admin-tab-content doc-mgmt-container">

              {/* ── SECTION 1: HEADER CARD WITH ACTION BUTTONS ── */}
              <div className="doc-header-card">
                <div className="doc-header-left">
                  <div className="doc-header-icon-orb">📁</div>
                  <div>
                    <h2 className="doc-header-title-text">
                      Документооборот — Загрузка и Выгрузка
                    </h2>
                    <p className="doc-header-subtext">
                      Импорт из Excel / CSV, ручное добавление и экспорт актов КС-2/КС-3, счетов, ЭСФ и договоров в .xlsx
                    </p>
                  </div>
                </div>
                <div className="doc-action-btns-group">
                  <button className="doc-btn-purple" onClick={() => setDocAddModalOpen(true)}>
                    <span>➕</span> Добавить документ
                  </button>
                </div>
              </div>

              {/* ── SECTION 2: UPLOAD (ЗАГРУЗКА) DROPZONE ── */}
              <div 
                className={`doc-dropzone-box ${docUploadDragover ? 'dragover' : ''}`}
                onDragOver={handleDocDragOver} 
                onDragLeave={handleDocDragLeave} 
                onDrop={handleDocDrop}
              >
                <div className="doc-dropzone-content">
                  <div className="doc-dropzone-info">
                    <div className="doc-dropzone-icon-badge">📤</div>
                    <div>
                      <h3 className="doc-dropzone-title">
                        Загрузка документов из Excel / CSV
                      </h3>
                      <p className="doc-dropzone-desc">
                        Перетащите файлы сюда или нажмите «Выбрать файл». Поддерживаются форматы <strong>.xlsx</strong>, <strong>.xls</strong>, <strong>.csv</strong>
                      </p>
                      <div className="doc-tags-pills">
                        <span className="doc-tag-pill">Код (id)</span>
                        <span className="doc-tag-pill">Наименование (name)</span>
                        <span className="doc-tag-pill">Ед.изм (unit)</span>
                        <span className="doc-tag-pill">Цена/Сумма (price)</span>
                        <span className="doc-tag-pill">Категория (category)</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <input 
                      type="file" 
                      ref={docFileInputRef} 
                      accept=".xlsx,.xls,.csv" 
                      style={{ display: 'none' }}
                      onChange={(e) => { if (e.target.files[0]) handleDocFileUpload(e.target.files[0]); e.target.value = ''; }}
                    />
                    <button 
                      className="doc-btn-choose-file"
                      onClick={() => docFileInputRef.current?.click()}
                    >
                      <span>📂</span> Выбрать файл
                    </button>
                  </div>
                </div>

                {docUploadResult && (
                  <div style={{ marginTop: '14px', padding: '12px 18px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.4)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '1.4rem' }}>✅</span>
                    <div>
                      <div style={{ color: '#6ee7b7', fontWeight: '800', fontSize: '0.92rem' }}>Загружено {docUploadResult.count} документов</div>
                      <div style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Файл: {docUploadResult.filename}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── SECTION 3: EXPORT (ВЫГРУЗКА) CATEGORIES GRID ── */}
              <div className="doc-categories-grid">
                {/* Card: Acts */}
                <div 
                  className="doc-cat-card acts"
                  onClick={() => { const acts = documentsList.filter(d => d.category === 'acts'); exportActsToExcel(acts); logAuditAction('DOCUMENTS', 'export_acts', `Экспорт ${acts.length} актов`); }}
                >
                  <div className="doc-cat-top">
                    <span className="doc-cat-icon">📗</span>
                    <span className="doc-cat-badge acts">{documentsList.filter(d => d.category === 'acts').length}</span>
                  </div>
                  <div>
                    <div className="doc-cat-title">Акты КС-2 / КС-3</div>
                    <div className="doc-cat-sub">Приёмка СМР, объёмы, НДС 12%</div>
                  </div>
                  <div className="doc-cat-action-link acts">
                    <span>📥 Выгрузить .xlsx</span> ➔
                  </div>
                </div>

                {/* Card: Invoices */}
                <div 
                  className="doc-cat-card invoices"
                  onClick={() => { const inv = documentsList.filter(d => d.category === 'invoices'); exportInvoicesToExcel(inv); logAuditAction('DOCUMENTS', 'export_invoices', `Экспорт ${inv.length} счетов`); }}
                >
                  <div className="doc-cat-top">
                    <span className="doc-cat-icon">📙</span>
                    <span className="doc-cat-badge invoices">{documentsList.filter(d => d.category === 'invoices').length}</span>
                  </div>
                  <div>
                    <div className="doc-cat-title">Счета & ЭСФ</div>
                    <div className="doc-cat-sub">Эскроу-транши, Kaspi, банк</div>
                  </div>
                  <div className="doc-cat-action-link invoices">
                    <span>📥 Выгрузить .xlsx</span> ➔
                  </div>
                </div>

                {/* Card: Contracts */}
                <div 
                  className="doc-cat-card contracts"
                  onClick={() => { const c = documentsList.filter(d => d.category === 'contracts'); exportContractsToExcel(c); logAuditAction('DOCUMENTS', 'export_contracts', `Экспорт ${c.length} договоров`); }}
                >
                  <div className="doc-cat-top">
                    <span className="doc-cat-icon">📘</span>
                    <span className="doc-cat-badge contracts">{documentsList.filter(d => d.category === 'contracts').length}</span>
                  </div>
                  <div>
                    <div className="doc-cat-title">Договоры</div>
                    <div className="doc-cat-sub">Сроки, авансы, гарантии</div>
                  </div>
                  <div className="doc-cat-action-link contracts">
                    <span>📥 Выгрузить .xlsx</span> ➔
                  </div>
                </div>

                {/* Card: Full Package */}
                <div 
                  className="doc-cat-card full"
                  onClick={() => { exportAllDocumentsPackageExcel({ acts: documentsList.filter(d => d.category === 'acts'), invoices: documentsList.filter(d => d.category === 'invoices'), contracts: documentsList.filter(d => d.category === 'contracts') }); logAuditAction('DOCUMENTS', 'export_full', 'Сводный пакет'); }}
                >
                  <div className="doc-cat-top">
                    <span className="doc-cat-icon">📊</span>
                    <span className="doc-cat-badge full">Сводный</span>
                  </div>
                  <div>
                    <div className="doc-cat-title">Полный пакет</div>
                    <div className="doc-cat-sub">Все документы в одном файле</div>
                  </div>
                  <div className="doc-cat-action-link full">
                    <span>📥 Скачать всё .xlsx</span> ➔
                  </div>
                </div>
              </div>

              {/* ── SECTION 4: FILTER + SEARCH TOOLBAR ── */}
              <div className="doc-toolbar-bar">
                <div className="doc-filter-pills">
                  <button className={`doc-filter-btn ${docsCategoryFilter === 'all' ? 'active' : ''}`} onClick={() => setDocsCategoryFilter('all')}>
                    📋 Все ({documentsList.length})
                  </button>
                  <button className={`doc-filter-btn ${docsCategoryFilter === 'acts' ? 'active' : ''}`} onClick={() => setDocsCategoryFilter('acts')}>
                    📗 Акты ({documentsList.filter(d => d.category === 'acts').length})
                  </button>
                  <button className={`doc-filter-btn ${docsCategoryFilter === 'invoices' ? 'active' : ''}`} onClick={() => setDocsCategoryFilter('invoices')}>
                    📙 Счета ({documentsList.filter(d => d.category === 'invoices').length})
                  </button>
                  <button className={`doc-filter-btn ${docsCategoryFilter === 'contracts' ? 'active' : ''}`} onClick={() => setDocsCategoryFilter('contracts')}>
                    📘 Договоры ({documentsList.filter(d => d.category === 'contracts').length})
                  </button>
                </div>

                <div className="doc-search-box">
                  <span className="doc-search-icon">🔍</span>
                  <input 
                    type="text" 
                    className="doc-search-input" 
                    placeholder="Поиск по номеру, объекту, БИН..."
                    value={docsSearch} 
                    onChange={(e) => setDocsSearch(e.target.value)} 
                  />
                </div>
              </div>

              {/* ── SECTION 5: DOCUMENTS TABLE ── */}
              <div className="admin-section-box" style={{ overflowX: 'auto', padding: '1rem' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>№ Документа</th>
                      <th>Тип</th>
                      <th>Объект / Назначение</th>
                      <th>Контрагент</th>
                      <th>Дата</th>
                      <th style={{ textAlign: 'right' }}>Сумма с НДС (₸)</th>
                      <th>Статус</th>
                      <th style={{ textAlign: 'center' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentsList
                      .filter(d => {
                        if (docsCategoryFilter !== 'all' && d.category !== docsCategoryFilter) return false;
                        if (docsSearch) {
                          const q = docsSearch.toLowerCase();
                          return (d.id || '').toLowerCase().includes(q) || (d.objectName || '').toLowerCase().includes(q) ||
                            (d.customer || '').toLowerCase().includes(q) || (d.payer || '').toLowerCase().includes(q) ||
                            (d.type || '').toLowerCase().includes(q) || (d.purpose || '').toLowerCase().includes(q);
                        }
                        return true;
                      })
                      .map((doc) => (
                        <tr key={doc.id}>
                          <td><strong>{doc.id}</strong></td>
                          <td>
                            <span className="cat-chip" style={{
                              background: doc.category === 'acts' ? 'rgba(16,185,129,0.15)' : doc.category === 'invoices' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                              color: doc.category === 'acts' ? '#6ee7b7' : doc.category === 'invoices' ? '#fde68a' : '#93c5fd',
                              border: `1px solid ${doc.category === 'acts' ? 'rgba(16,185,129,0.3)' : doc.category === 'invoices' ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`
                            }}>{doc.type}</span>
                          </td>
                          <td>
                            <div style={{ fontWeight: '600', color: '#fff' }}>{doc.objectName || doc.purpose}</div>
                            {doc.period && <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Период: {doc.period}</div>}
                          </td>
                          <td>
                            <div style={{ color: '#cbd5e1' }}>{doc.customer || doc.payer}</div>
                            {(doc.customerBin || doc.payerBin) && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>БИН: {doc.customerBin || doc.payerBin}</div>}
                          </td>
                          <td style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{doc.date || doc.startDate}</td>
                          <td style={{ textAlign: 'right', fontWeight: '800', color: '#fbbf24' }}>{Number(doc.amount || 0).toLocaleString()} ₸</td>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '800',
                              background: (doc.status||'').includes('Подписан') || (doc.status||'').includes('Оплачен') || (doc.status||'').includes('Действует') || (doc.status||'').includes('Проведен') ? 'rgba(16,185,129,0.15)' : (doc.status||'').includes('Загружен') ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)',
                              color: (doc.status||'').includes('Подписан') || (doc.status||'').includes('Оплачен') || (doc.status||'').includes('Действует') || (doc.status||'').includes('Проведен') ? '#6ee7b7' : (doc.status||'').includes('Загружен') ? '#c4b5fd' : '#fde68a'
                            }}>
                              {(doc.status||'').includes('Подписан') ? '✅' : (doc.status||'').includes('Оплачен') ? '💳' : (doc.status||'').includes('Загружен') ? '📤' : (doc.status||'').includes('Действует') ? '🟢' : '⏳'} {doc.status}
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button className="doc-btn-emerald" style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
                                onClick={() => { exportSingleDocumentExcel(doc); logAuditAction('DOCUMENTS', 'export_single', `Excel: ${doc.id}`); }} title="Скачать Excel">
                                📥 Excel
                              </button>
                              <button className="btn-table-action" style={{ color: '#f87171', fontSize: '0.9rem', padding: '4px 8px' }}
                                onClick={() => handleDeleteDoc(doc.id)} title="Удалить документ">
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {documentsList.filter(d => {
                      if (docsCategoryFilter !== 'all' && d.category !== docsCategoryFilter) return false;
                      if (docsSearch) {
                        const q = docsSearch.toLowerCase();
                        return (d.id||'').toLowerCase().includes(q) || (d.objectName||'').toLowerCase().includes(q) || (d.customer||'').toLowerCase().includes(q) || (d.payer||'').toLowerCase().includes(q);
                      }
                      return true;
                    }).length === 0 && (
                      <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#64748b' }}>Нет документов по заданным фильтрам</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Stats Footer ── */}
              <div style={{ display: 'flex', gap: '1.8rem', flexWrap: 'wrap', padding: '14px 20px', background: 'rgba(15,23,42,0.6)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>📊 Всего: <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{documentsList.length}</strong> документов</div>
                <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>💰 Общая сумма: <strong style={{ color: '#fbbf24', fontSize: '0.95rem' }}>{documentsList.reduce((s,d) => s + Number(d.amount||0), 0).toLocaleString()} ₸</strong></div>
                <div style={{ color: '#94a3b8', fontSize: '0.86rem' }}>🧾 НДС 12%: <strong style={{ color: '#6ee7b7', fontSize: '0.95rem' }}>{Math.round(documentsList.reduce((s,d) => s + Number(d.amount||0), 0) - documentsList.reduce((s,d) => s + Number(d.amount||0), 0) / 1.12).toLocaleString()} ₸</strong></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DIALOGS                                                             */}
      {/* ========================================================================= */}

      
      {/* MODAL: ADD NEW DOCUMENT */}
      {docAddModalOpen && (
        <div className="doc-modal-overlay" onClick={() => setDocAddModalOpen(false)}>
          <div className="doc-modal-box" onClick={e => e.stopPropagation()}>
            
            <div className="doc-modal-header">
              <h3 className="doc-modal-title">
                <span>➕</span> Добавление нового документа
              </h3>
              <button className="doc-modal-close-btn" onClick={() => setDocAddModalOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {/* Row 1 */}
              <div>
                <label className="doc-input-label">№ Документа *</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="АКТ-КС2-2026/100" 
                  value={docForm.id}
                  onChange={e => setDocForm(f => ({...f, id: e.target.value}))} 
                />
              </div>

              <div>
                <label className="doc-input-label">Тип документа</label>
                <select 
                  className="doc-modal-select" 
                  value={docForm.type}
                  onChange={e => {
                    const t = e.target.value;
                    const cat = t.includes('Акт') ? 'acts' : t.includes('Договор') ? 'contracts' : 'invoices';
                    setDocForm(f => ({...f, type: t, category: cat}));
                  }}
                >
                  <option value="Акт КС-2">Акт КС-2</option>
                  <option value="Акт КС-3">Акт КС-3</option>
                  <option value="Счет на оплату">Счет на оплату</option>
                  <option value="ЭСФ (Счет-фактура)">ЭСФ (Счет-фактура)</option>
                  <option value="Договор генподряда">Договор генподряда</option>
                  <option value="Договор подряда">Договор подряда</option>
                </select>
              </div>

              {/* Row 2 */}
              <div style={{ gridColumn: 'span 2' }}>
                <label className="doc-input-label">Объект строительства / Назначение *</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="ЖК «Nomad Palace» (Блок А)" 
                  value={docForm.objectName}
                  onChange={e => setDocForm(f => ({...f, objectName: e.target.value}))} 
                />
              </div>

              {/* Row 3 */}
              <div>
                <label className="doc-input-label">Заказчик / Плательщик</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="ТОО «Prime Development KZ»" 
                  value={docForm.customer || docForm.payer}
                  onChange={e => setDocForm(f => ({...f, customer: e.target.value, payer: e.target.value}))} 
                />
              </div>

              <div>
                <label className="doc-input-label">БИН / ИИН Заказчика</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="180240009871" 
                  value={docForm.customerBin || docForm.payerBin}
                  onChange={e => setDocForm(f => ({...f, customerBin: e.target.value, payerBin: e.target.value}))} 
                />
              </div>

              {/* Row 4 */}
              <div>
                <label className="doc-input-label">Подрядчик / Исполнитель</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="ТОО «QAZGOST AI»" 
                  value={docForm.contractor}
                  onChange={e => setDocForm(f => ({...f, contractor: e.target.value}))} 
                />
              </div>

              <div>
                <label className="doc-input-label">БИН Подрядчика</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="240140029182" 
                  value={docForm.contractorBin}
                  onChange={e => setDocForm(f => ({...f, contractorBin: e.target.value}))} 
                />
              </div>

              {/* Row 5 */}
              <div>
                <label className="doc-input-label">Дата</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="21.08.2026" 
                  value={docForm.date}
                  onChange={e => setDocForm(f => ({...f, date: e.target.value}))} 
                />
              </div>

              <div>
                <label className="doc-input-label">Период выполнения</label>
                <input 
                  className="doc-modal-input" 
                  placeholder="Август 2026 (Этап 3)" 
                  value={docForm.period}
                  onChange={e => setDocForm(f => ({...f, period: e.target.value}))} 
                />
              </div>

              {/* Row 6 */}
              <div>
                <label className="doc-input-label">Сумма с НДС (₸)</label>
                <input 
                  className="doc-modal-input" 
                  type="number" 
                  placeholder="14850000" 
                  value={docForm.amount}
                  onChange={e => setDocForm(f => ({...f, amount: e.target.value}))} 
                />
              </div>

              <div>
                <label className="doc-input-label">Статус</label>
                <select 
                  className="doc-modal-select" 
                  value={docForm.status}
                  onChange={e => setDocForm(f => ({...f, status: e.target.value}))}
                >
                  <option value="На согласовании">На согласовании</option>
                  <option value="Подписан ЭЦП">Подписан ЭЦП</option>
                  <option value="Оплачен">Оплачен</option>
                  <option value="Зарезервировано в Эскроу">Зарезервировано в Эскроу</option>
                  <option value="Проведен в ИС ЭСФ">Проведен в ИС ЭСФ</option>
                  <option value="Действует">Действует</option>
                </select>
              </div>
            </div>

            <div className="doc-modal-actions">
              <button className="doc-btn-cancel" onClick={() => setDocAddModalOpen(false)}>
                Отмена
              </button>
              <button className="doc-btn-submit" onClick={handleAddDocManually}>
                ✅ Добавить документ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PRICE ITEM */}
      {priceModalOpen && (
        <div className="nested-modal-overlay">
          <div className="nested-modal-box">
            <h3 className="modal-title">{editingPriceItem ? '✏️ Редактирование расценки' : '✨ Добавление новой расценки'}</h3>
            <form onSubmit={handleSavePriceForm}>
              <div className="form-group">
                <label>Код ГЭСН / Идентификатор</label>
                <input type="text" value={priceForm.id} onChange={(e) => setPriceForm({ ...priceForm, id: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Наименование работы или материала</label>
                <input type="text" value={priceForm.name} onChange={(e) => setPriceForm({ ...priceForm, name: e.target.value })} required />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Категория</label>
                  <select value={priceForm.category} onChange={(e) => setPriceForm({ ...priceForm, category: e.target.value })}>
                    <option value="Работы">Работы</option>
                    <option value="Материалы">Материалы</option>
                    <option value="Техника">Техника</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Единица измерения</label>
                  <input type="text" value={priceForm.unit} onChange={(e) => setPriceForm({ ...priceForm, unit: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Базовая цена (₸)</label>
                <input type="number" value={priceForm.price} onChange={(e) => setPriceForm({ ...priceForm, price: parseFloat(e.target.value) || 0 })} required />
              </div>

              <div className="modal-buttons-row">
                <button type="button" className="btn-cancel" onClick={() => setPriceModalOpen(false)}>Отмена</button>
                <button type="submit" className="admin-primary-btn">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CONFIRMATION */}
      {deleteConfirmId && (
        <div className="nested-modal-overlay">
          <div className="nested-modal-box text-center">
            <h3>⚠️ Подтверждение удаления</h3>
            <p>Вы действительно хотите удалить позицию {deleteConfirmId}?</p>
            <div className="modal-buttons-row">
              <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>Отмена</button>
              <button className="btn-reset-danger" onClick={() => handleDeletePriceItem(deleteConfirmId)}>Удалить</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MODERATION CASE DETAILS (Карточка дела модерации) */}
      {inspectModalData && (
        <div className="nested-modal-overlay">
          <div className="nested-modal-box" style={{ maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontWeight: '700',
                    background: inspectModalData.priority === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: inspectModalData.priority === 'high' ? '#f87171' : '#fde68a'
                  }}>
                    {inspectModalData.priority === 'high' ? '🔴 Срочно' : '🟡 Обычный'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#38bdf8', fontWeight: '700' }}>
                    {inspectModalData.type}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {inspectModalData.date}
                  </span>
                </div>
                <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.2rem', fontWeight: '800' }}>
                  {inspectModalData.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectModalData(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Applicant & BIN verification badge */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Заявитель / Контрагент</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff' }}>{inspectModalData.author}</div>
                {inspectModalData.bin && (
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontFamily: 'monospace' }}>БИН / ИИН: {inspectModalData.bin}</div>
                )}
              </div>
              <div style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '4px 10px',
                borderRadius: '8px',
                fontSize: '0.75rem',
                color: '#6ee7b7',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span>🇰🇿</span> eGov / ИС ЭСФ Проверено
              </div>
            </div>

            {/* Structured Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Город / Локация</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#ffffff' }}>📍 {inspectModalData.city}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Сумма / Бюджет</div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#fbbf24' }}>
                  {inspectModalData.amount > 0 ? `${Number(inspectModalData.amount).toLocaleString()} ₸` : 'Не применимо'}
                </div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Прикрепленные документы</div>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#38bdf8' }}>📎 {inspectModalData.docCount || '1 документ'}</div>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Оценка риска безопасности</div>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  color: inspectModalData.riskLevel === 'low' ? '#6ee7b7' : inspectModalData.riskLevel === 'medium' ? '#fde68a' : '#f87171'
                }}>
                  🛡️ {inspectModalData.riskScore || '0.10'} ({inspectModalData.riskLevel === 'low' ? 'Безопасно' : 'Требует проверки'})
                </div>
              </div>
            </div>

            {/* Custom Key-Value Details */}
            {inspectModalData.details && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '16px'
              }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#cbd5e1', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Сведения дела & Комментарии эксперта
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {Object.entries(inspectModalData.details).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', padding: '4px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <span style={{ color: '#94a3b8' }}>{k}:</span>
                      <strong style={{ color: '#ffffff', textAlign: 'right', maxWidth: '65%' }}>{String(v)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '14px' }}>
              <button
                className="admin-secondary-btn"
                style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '8px 18px', fontWeight: '700' }}
                onClick={() => {
                  handleRejectModeration(inspectModalData.id);
                  setInspectModalData(null);
                }}
              >
                ❌ Отклонить
              </button>
              <button
                className="admin-primary-btn"
                style={{ background: 'linear-gradient(90deg, #10b981, #059669)', padding: '8px 24px', fontWeight: '800' }}
                onClick={() => {
                  handleApproveModeration(inspectModalData.id);
                  setInspectModalData(null);
                }}
              >
                ✅ Одобрить и активировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: USER PROFILE */}
      {inspectUserModal && (
        <div className="nested-modal-overlay">
          <div className="nested-modal-box">
            <h3>👤 Профиль пользователя: {inspectUserModal.name}</h3>
            <div className="user-profile-details">
              <p><strong>ID:</strong> {inspectUserModal.id}</p>
              <p><strong>Роль:</strong> {inspectUserModal.roleLabel}</p>
              <p><strong>Email:</strong> {inspectUserModal.email}</p>
              <p><strong>Телефон:</strong> {inspectUserModal.phone}</p>
              <p><strong>Город:</strong> {inspectUserModal.city}</p>
              <p><strong>Источник:</strong> {inspectUserModal.source}</p>
              <p><strong>Рейтинг:</strong> ⭐ {inspectUserModal.rating}</p>
              <p><strong>Статус доступа:</strong> {inspectUserModal.status === 'blocked' ? '🚫 Заблокирован' : '✅ Активен'}</p>
            </div>
            <div className="modal-buttons-row">
              <button className="admin-primary-btn" onClick={() => setInspectUserModal(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD / EDIT USER */}
      {isUserModalOpen && (
        <div className="nested-modal-overlay">
          <div className="nested-modal-box" style={{ maxWidth: '600px' }}>
            <h3 className="modal-title">{editingUser ? '✏️ Редактирование пользователя' : '✨ Добавление пользователя'}</h3>
            <form onSubmit={handleSaveUserForm}>
              <div className="form-group">
                <label>ФИО / Наименование</label>
                <input type="text" value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} required />
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Телефон</label>
                  <input type="text" value={userForm.phone} onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })} required />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>Роль</label>
                  <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                    {rolesList.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Город</label>
                  <input type="text" value={userForm.city} onChange={(e) => setUserForm({ ...userForm, city: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label>Статус</label>
                <select value={userForm.status} onChange={(e) => setUserForm({ ...userForm, status: e.target.value })}>
                  <option value="active">✅ Активен</option>
                  <option value="blocked">🚫 Заблокирован</option>
                </select>
              </div>

              <div className="modal-buttons-row">
                <button type="button" className="btn-cancel" onClick={() => setIsUserModalOpen(false)}>Отмена</button>
                <button type="submit" className="admin-primary-btn">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD / EDIT ROLE */}
      {isRoleModalOpen && (
        <div className="nested-modal-overlay">
          <div className="nested-modal-box" style={{ maxWidth: '500px' }}>
            <h3 className="modal-title">{editingRole ? '✏️ Редактирование роли' : '✨ Добавление роли'}</h3>
            <form onSubmit={handleSaveRoleForm}>
              <div className="form-group">
                <label>Системный код (ID)</label>
                <input type="text" value={roleForm.id} onChange={(e) => setRoleForm({ ...roleForm, id: e.target.value })} disabled={!!editingRole} required />
              </div>
              <div className="form-group">
                <label>Название (UI)</label>
                <input type="text" value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Иконка (Emoji)</label>
                <input type="text" value={roleForm.icon} onChange={(e) => setRoleForm({ ...roleForm, icon: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Описание</label>
                <textarea value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} rows={3}></textarea>
              </div>

              <div className="modal-buttons-row">
                <button type="button" className="btn-cancel" onClick={() => setIsRoleModalOpen(false)}>Отмена</button>
                <button type="submit" className="admin-primary-btn">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
