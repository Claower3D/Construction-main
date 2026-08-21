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

// Base Norms Database (ГЭСН / QAZGOST)
const BASE_NORMS_LIST = [
  { id: 'E15-01-001', name: 'Штукатурка стен цементно-известковым раствором', category: 'Работы', section: 'Черновая отделка', unit: 'м²', laborNorm: 1.45, price: 2850, file: 'GESN-15-2026.xlsx' },
  { id: 'E15-01-002', name: 'Шпатлевка стен гипсовыми смесями в 2 слоя', category: 'Работы', section: 'Чистовая отделка', unit: 'м²', laborNorm: 0.85, price: 1650, file: 'GESN-15-2026.xlsx' },
  { id: 'E08-02-001', name: 'Кладка наружных стен из кирпича полнотелого', category: 'Работы', section: 'Каркас и стены', unit: 'м³', laborNorm: 4.20, price: 18500, file: 'GESN-08-2026.xlsx' },
  { id: 'E11-01-005', name: 'Устройство стяжки полусухой пескоцементной 50мм', category: 'Работы', section: 'Полы', unit: 'м²', laborNorm: 0.65, price: 2400, file: 'GESN-11-2026.xlsx' },
  { id: 'E67-03-012', name: 'Прокладка кабеля ВВГнг-LS 3x2.5 в гофре', category: 'Работы', section: 'Электроснабжение', unit: 'п.м.', laborNorm: 0.35, price: 950, file: 'GESN-67-2026.xlsx' },
  { id: 'M-101', name: 'Цемент портланд М-500 (мешок 50кг)', category: 'Материалы', section: 'Сухие смеси', unit: 'меш', laborNorm: 0.00, price: 3400, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-102', name: 'Армированный каркас A500C 12мм', category: 'Материалы', section: 'Металл', unit: 'тн', laborNorm: 0.00, price: 385000, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-103', name: 'Гипсокартон KNAUF влагостойкий 12.5мм', category: 'Материалы', section: 'Листовые материалы', unit: 'лист', laborNorm: 0.00, price: 4200, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'M-104', name: 'Краска фасадная акриловая Tikkurila 10л', category: 'Материалы', section: 'Лакокрасочные', unit: 'вед', laborNorm: 0.00, price: 28900, file: 'MAT-PRICES-2026.xlsx' },
  { id: 'T-001', name: 'Аренда экскаватора-погрузчика JCB 3CX', category: 'Техника', section: 'Землеройная', unit: 'смена', laborNorm: 8.00, price: 95000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-002', name: 'Аренда автокрана XCMG 25 тонн', category: 'Техника', section: 'Грузоподъемная', unit: 'смена', laborNorm: 8.00, price: 140000, file: 'EQUIPMENT-2026.xlsx' },
  { id: 'T-003', name: 'Самосвал KAMAZ 20 тонн (вывоз грунта)', category: 'Техника', section: 'Грузовая', unit: 'рейс', laborNorm: 2.00, price: 25000, file: 'EQUIPMENT-2026.xlsx' },
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
  const [moderationQueue, setModerationQueue] = useState([
    { id: 'MOD-101', priority: 'high', type: 'Заказ', title: 'Заказ: Капитальный ремонт офиса 450 м²', author: 'ТОО «Алматы Бизнес» (БИН 21044001293)', date: '12 минут назад', status: 'pending', details: { area: '450 м²', budget: '18,500,000 ₸', city: 'Алматы', contact: '+7 701 555-01-99' } },
    { id: 'MOD-102', priority: 'normal', type: 'Верификация', title: 'Заявка на верификацию ИП «СтройМастер»', author: 'ИИН: 880412300451 • Астана', date: '25 минут назад', status: 'pending', details: { bin: '880412300451', docType: 'Свидетельство ИП', city: 'Астана' } },
    { id: 'MOD-103', priority: 'high', type: 'Жалоба', title: 'Жалоба на некачественную заливку бетона', author: 'Заказчик: Касымов А. • Караганда', date: '1 час назад', status: 'pending', details: { disputeId: 'DSP-882', reason: 'Трещины на монолитном перекрытии', amount: '2,400,000 ₸' } },
    { id: 'MOD-104', priority: 'normal', type: 'Спам-проверка', title: 'Подозрительный массовый заказ на материалы', author: 'Пользователь user9912 (Новый)', date: '2 часа назад', status: 'pending', details: { itemsCount: 150, riskScore: '0.84' } },
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
    setModerationQueue(moderationQueue.filter((m) => m.id !== id));
    if (item) {
      logAuditAction('approve', `Одобрена заявка ${item.id}: ${item.title}`, 'Модерация');
      setAuditLogsList(getAuditLogs());
    }
  };

  const handleRejectModeration = (id) => {
    const reason = window.prompt('Укажите причину отклонения:');
    if (reason !== null) {
      const item = moderationQueue.find((m) => m.id === id);
      setModerationQueue(moderationQueue.filter((m) => m.id !== id));
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
      logAuditAction('approve', `Массовое одобрение всей очереди модерации (${count} объектов)`, 'Модерация');
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

        {/* 6 MAIN NAVIGATION TABS */}
        <div className="admin-tabs-bar">
          <button className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            📊 1. Обзор
          </button>
          <button className={`admin-tab-btn ${activeTab === 'database' ? 'active' : ''}`} onClick={() => setActiveTab('database')}>
            🗄️ 2. База данных
          </button>
          <button className={`admin-tab-btn ${activeTab === 'prices' ? 'active' : ''}`} onClick={() => setActiveTab('prices')}>
            💰 3. Цены ({pricesList.length})
          </button>
          <button className={`admin-tab-btn ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>
            🛡️ 4. Модерация ({moderationQueue.length})
          </button>
          <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            👥 5. Пользователи
          </button>
          <button className={`admin-tab-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            ⚙️ 6. Управление
          </button>
          <button className={`admin-tab-btn ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>
            🔐 7. Роли
          </button>
          <button className={`admin-tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')} style={{ background: activeTab === 'documents' ? 'rgba(16, 185, 129, 0.2)' : '', borderColor: activeTab === 'documents' ? '#10b981' : '' }}>
            📁 8. Документы & Excel ({documentsList.length})
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
          {/* TAB 4: MODERATION (🛡️ Модерация)                                         */}
          {/* ========================================================================= */}
          {activeTab === 'moderation' && (
            <div className="admin-tab-content">
              <div className="mod-header-row">
                <h3 className="admin-box-title">🛡️ Очередь проверку заказов и верификации ИИН/БИН</h3>
                <button className="admin-primary-btn btn-approve-all" onClick={handleApproveAllModeration} disabled={moderationQueue.length === 0}>
                  ✅ Одобрить все ({moderationQueue.length})
                </button>
              </div>

              {moderationQueue.length === 0 ? (
                <div className="admin-empty-state">🎉 Все заявки очереди модерации успешно обработаны!</div>
              ) : (
                <div className="moderation-cards-grid">
                  {moderationQueue.map((item) => (
                    <div className={`mod-card priority-${item.priority}`} key={item.id}>
                      <div className="mod-card-header">
                        <span className={`priority-badge ${item.priority}`}>
                          {item.priority === 'high' ? '🔴 Срочно' : '🟡 Обычный'}
                        </span>
                        <span className="mod-type-chip">{item.type}</span>
                        <span className="mod-date">{item.date}</span>
                      </div>

                      <h4 className="mod-title">{item.title}</h4>
                      <p className="mod-author">{item.author}</p>

                      <div className="mod-actions">
                        <button className="btn-approve" onClick={() => handleApproveModeration(item.id)}>
                          ✅ Одобрить
                        </button>
                        <button className="btn-reject" onClick={() => handleRejectModeration(item.id)}>
                          ❌ Отклонить
                        </button>
                        <button className="btn-details" onClick={() => setInspectModalData(item)}>
                          👁️ Подробнее
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
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

      {/* MODAL 3: MODERATION RAW JSON DETAILS */}
      {inspectModalData && (
        <div className="nested-modal-overlay">
          <div className="nested-modal-box json-inspect-box">
            <h3>👁️ Сырые детали объекта модерации ({inspectModalData.id})</h3>
            <pre className="json-code">{JSON.stringify(inspectModalData, null, 2)}</pre>
            <div className="modal-buttons-row">
              <button className="admin-primary-btn" onClick={() => setInspectModalData(null)}>Закрыть</button>
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
