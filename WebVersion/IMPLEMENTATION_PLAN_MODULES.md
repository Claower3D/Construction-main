# План реализации модулей A и B для QazGost AI

## Дата: 2026-01-24

---

## 📋 Обзор

Данный документ описывает план реализации двух основных модулей:

- **Модуль A**: "Расчёт объёмов по фото" (Volumes/Estimate)
- **Модуль B**: "Комплексные инженерные решения" (Engineering)

---

## 🎯 Приоритеты реализации

### P0 (критично для запуска продаж) ✅
1. Estimate + Versioning + PDF
2. Engineering: каталог карточек + конструктор выбора + generateStages + PDF Brief/Stages
3. Upload файлов с лимитами + AuditLog

### P1 (следующий этап)
1. КП (Offer) + PDF Offer
2. Статусы этапов и принятие
3. Deliverables (выдача результата)

### P2 (улучшения)
1. Интеграция оплаты
2. Полная локализация RU/EN/KZ
3. Улучшение ML распознавания объёмов

---

## 📁 Новые файлы

| Файл | Назначение |
|------|------------|
| `estimateModels.js` | Модели: Estimate, EstimateVersion |
| `engineeringModels.js` | Модели: EngineeringSolution, EngineeringRequest, и др. |
| `estimateService.js` | API для расчёта объёмов |
| `engineeringService.js` | API для инженерных решений |
| `pdfGenerator.js` | Генерация PDF документов |
| `fileUpload.js` | Унифицированный модуль загрузки файлов |

---

## 🏗️ Новые модели данных

### Модуль A: Estimate (Расчёт объёмов)

```javascript
// Estimate (Расчёт)
{
    id: 'est_xxx',
    customerId: 'user_xxx',
    title: 'Фундамент для дома',
    objectInfo: {
        type: 'foundation',      // тип объекта
        city: 'Алматы',
        address: '',
        comment: ''
    },
    status: 'DRAFT' | 'ARCHIVE',
    currentVersionNo: 1,
    createdAt: ISO,
    updatedAt: ISO
}

// EstimateVersion (Версия расчёта)
{
    id: 'estv_xxx',
    estimateId: 'est_xxx',
    versionNo: 1,
    items: [
        {
            id: 'item_xxx',
            name: 'Бетон М300',
            category: 'material',    // work | material
            unit: 'м³',
            qty: 15,
            unitPrice: 45000,
            sum: 675000,
            source: 'ai',           // ai | manual
            confidence: 0.95,
            notes: ''
        }
    ],
    totals: {
        works: 125000,
        materials: 890000,
        total: 1015000
    },
    createdAt: ISO,
    createdBy: 'user_xxx'
}
```

### Модуль B: Engineering (Инженерные решения)

```javascript
// EngineeringSolution (Каталог решений)
{
    id: 'sol_xxx',
    title: 'Архитектурный раздел (АР)',
    shortDesc: 'Полный комплект архитектурных чертежей',
    imageUrl: '/images/solutions/ar.jpg',
    tags: ['проектирование', 'архитектура'],
    category: 'design',            // design | survey | supervision | docs | safety | energy
    basePrice: 500000,
    baseDurationDays: 14,
    stagesTemplate: [
        { title: 'Сбор исходных данных', durationDays: 2 },
        { title: 'Разработка концепции', durationDays: 5 },
        { title: 'Детальная проработка', durationDays: 5 },
        { title: 'Согласование', durationDays: 2 }
    ],
    deliverablesTemplate: [
        { title: 'Архитектурные чертежи (PDF)', type: 'pdf' },
        { title: 'DWG файлы', type: 'dwg' }
    ],
    whatIncluded: [
        'Планы этажей',
        'Разрезы',
        'Фасады',
        'Узлы и детали'
    ]
}

// EngineeringRequest (Заявка на инженерные решения)
{
    id: 'eng_xxx',
    customerId: 'user_xxx',
    status: 'NEW' | 'IN_REVIEW' | 'OFFER_SENT' | 'PAID' | 'IN_WORK' | 'DELIVERED' | 'CLOSED',
    objectInfo: {
        name: 'Жилой дом',
        area: 250,
        floors: 2,
        city: 'Алматы',
        address: '',
        hasDrawings: false,
        comment: ''
    },
    urgency: 'normal' | 'urgent' | 'vip',
    selectedSolutions: [],
    totalEstimate: 0,
    totalDurationDays: 0,
    createdAt: ISO,
    updatedAt: ISO
}

// EngineeringSelectedSolution (Выбранное решение в заявке)
{
    id: 'esel_xxx',
    requestId: 'eng_xxx',
    solutionId: 'sol_xxx',
    option: 'standard' | 'vip',
    params: {
        area: 250,
        floors: 2,
        hasSourceFiles: false,
        comment: ''
    },
    calculatedPrice: 550000,
    calculatedDurationDays: 16
}

// EngineeringStage (Этап проекта)
{
    id: 'estage_xxx',
    requestId: 'eng_xxx',
    solutionId: 'sol_xxx',       // null для общих этапов
    title: 'Разработка концепции АР',
    orderNo: 2,
    status: 'PLAN' | 'IN_WORK' | 'ON_REVIEW' | 'ACCEPTED',
    plannedStart: ISO,
    plannedEnd: ISO,
    actualStart: null,
    actualEnd: null,
    comment: ''
}

// Deliverable (Результат работы)
{
    id: 'deliv_xxx',
    requestId: 'eng_xxx',
    title: 'Архитектурные чертежи',
    fileId: 'file_xxx',
    type: 'pdf',
    version: 1
}
```

---

## 🔧 Алгоритмы

### Автогенерация этапов (Engineering)

```javascript
function generateStages(request, selectedSolutions) {
    const stages = [];
    let currentDate = new Date();
    
    // 1. Общий этап "Подготовка ТЗ"
    stages.push({
        title: 'Подготовка технического задания',
        solutionId: null,
        plannedStart: currentDate,
        plannedEnd: addDays(currentDate, 2),
        orderNo: 0
    });
    currentDate = addDays(currentDate, 2);
    
    // 2. Этапы по каждому решению
    let orderNo = 1;
    for (const selected of selectedSolutions) {
        const solution = getSolution(selected.solutionId);
        const factor = calculateComplexityFactor(request, selected);
        
        for (const templateStage of solution.stagesTemplate) {
            const duration = Math.ceil(templateStage.durationDays * factor);
            stages.push({
                title: `${templateStage.title} (${solution.title})`,
                solutionId: selected.solutionId,
                plannedStart: currentDate,
                plannedEnd: addDays(currentDate, duration),
                orderNo: orderNo++
            });
            currentDate = addDays(currentDate, duration);
        }
    }
    
    // 3. Общий этап "Согласование/КП"
    stages.push({
        title: 'Финальное согласование',
        solutionId: null,
        plannedStart: currentDate,
        plannedEnd: addDays(currentDate, 3),
        orderNo: orderNo
    });
    
    return stages;
}

function calculateComplexityFactor(request, selected) {
    let factor = 1.0;
    
    // Площадь
    if (request.objectInfo.area > 500) factor *= 1.3;
    else if (request.objectInfo.area > 200) factor *= 1.1;
    
    // Этажность
    if (request.objectInfo.floors > 3) factor *= 1.2;
    
    // Срочность
    if (request.urgency === 'urgent') factor *= 0.8; // Сжатые сроки
    if (request.urgency === 'vip') factor *= 0.7;
    
    // VIP опция
    if (selected.option === 'vip') factor *= 1.1;
    
    // Наличие исходников
    if (!request.objectInfo.hasDrawings) factor *= 1.2;
    
    return factor;
}
```

---

## 📄 PDF Шаблоны

### Estimate PDF (Расчёт объёмов)
- Титул: клиент, объект, дата, версия No
- Сводка итогов (материалы / работы / общий итог)
- Таблица позиций (с группировкой по категориям)
- Приложения (список загруженных файлов)
- Дисклеймер "оценочно" (если есть AI-позиции)

### Engineering Brief PDF (ТЗ)
- Заголовок и дата
- Информация об объекте
- Выбранные решения (с картинками, если возможно)
- Состав работ по каждому решению
- Требования и входные данные
- SLA / сроки

### Engineering Stages PDF (Этапы)
- Общая информация о проекте
- Таблица этапов с датами
- Группировка по решениям
- Индикаторы зависимостей

---

## ✅ Критерии приёмки

- [ ] Заказчик создаёт расчёт объёмов → получает таблицу → сохраняет V1/V2 → скачивает PDF каждой версии
- [ ] Заказчик открывает "Инженерные решения" → выбирает решения карточками → видит выбранный список снизу → генерирует этапы → скачивает PDF ТЗ и PDF Этапов
- [ ] Все ключевые действия пишутся в AuditLog
- [ ] Файлы загружаются с лимитами и привязываются к сущностям

---

## 🗂️ Структура UI (навигация)

### Кабинет Заказчика
```
├── Главная (dashboard)
├── Расчёт объёмов (Модуль A)
│   ├── Список расчётов
│   ├── Создать расчёт
│   └── Просмотр расчёта (версии, PDF)
├── Инженерные решения (Модуль B)
│   ├── Каталог решений
│   ├── Конструктор пакета
│   ├── Этапы проекта
│   └── Документы
└── Мои заказы (существующий функционал)
```

---

## 📝 Статус реализации

| Компонент | Статус |
|-----------|--------|
| estimateModels.js | ⏳ В работе |
| engineeringModels.js | ⏳ В работе |
| estimateService.js | ⏳ Запланировано |
| engineeringService.js | ⏳ Запланировано |
| UI: Список расчётов | ⏳ Запланировано |
| UI: Создание расчёта | ⏳ Запланировано |
| UI: Каталог решений | ⏳ Запланировано |
| UI: Конструктор пакета | ⏳ Запланировано |
| PDF генерация | ⏳ Запланировано |

---

**Статус документа:** 🔄 Обновляется по мере реализации
