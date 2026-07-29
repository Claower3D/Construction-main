# VIP-Модуль: Проекты зданий и сооружений
## Implementation Plan v1.0

**Дата создания:** 2026-01-26
**Статус:** В разработке

---

## 📋 Обзор модуля

VIP-модуль позволяет заказчику вести целое здание как проект:
- Выбирать работы картинками (каталог модулей)
- Группировать их в подгруппы (WorkPackages)
- Внутри каждого модуля иметь задачи/чек-листы
- Создавать и публиковать заявки подрядчикам
- Контролировать выполнение: статусы, дефекты, документы, история, PDF

---

## 🗂️ Структура файлов

```
WebVersion/
├── vipModels.js       # Модели данных VIP
├── vipService.js      # Бизнес-логика VIP
├── vipUI.js           # UI компоненты VIP
├── vip.css            # Стили VIP-модуля
├── vipCatalogData.js  # Данные каталога модулей
└── images/vip/        # Изображения для каталога
    ├── foundation.webp
    ├── walls.webp
    ├── roofing.webp
    ├── electric.webp
    ├── plumbing.webp
    ├── gas.webp
    ├── hvac.webp
    ├── finishing.webp
    ├── landscaping.webp
    └── ...
```

---

## 📊 Модель данных

### 1. VipProject (VIP объект)
| Поле | Тип | Описание |
|------|-----|----------|
| id | string | Уникальный ID |
| customerId | string | ID заказчика |
| title | string | Название проекта |
| addressText | string | Адрес (опц.) |
| city | string | Город |
| region | string | Регион |
| type | enum | HOUSE / COMMERCIAL / REPAIR |
| status | enum | DRAFT / ACTIVE / COMPLETED / ARCHIVED |
| totalBudgetKZT | number | Общий бюджет (опц.) |
| coverImageUrl | string | Обложка проекта |
| createdAt | ISO date | Дата создания |
| updatedAt | ISO date | Дата обновления |

### 2. VipWorkPackage (подгруппа)
| Поле | Тип | Описание |
|------|-----|----------|
| id | string | Уникальный ID |
| projectId | string | ID проекта |
| title | string | Название подгруппы |
| orderIndex | number | Порядок сортировки |

### 3. VipModule (модуль работ)
| Поле | Тип | Описание |
|------|-----|----------|
| id | string | Уникальный ID |
| projectId | string | ID проекта |
| packageId | string | ID подгруппы |
| catalogItemId | string | ID карточки каталога |
| title | string | Название |
| description | string | Описание |
| plannedStart | ISO date | Планируемое начало |
| plannedEnd | ISO date | Планируемое окончание |
| budgetAmountKZT | number | Бюджет (опц.) |
| status | enum | DRAFT / READY / PUBLISHED / ASSIGNED / IN_WORK / ON_REVIEW / DONE |
| assignedExecutorId | string | ID назначенного исполнителя |
| subOrderId | string | ID связанного заказа |
| createdAt | ISO date | Дата создания |
| updatedAt | ISO date | Дата обновления |

### 4. VipTask (задача)
| Поле | Тип | Описание |
|------|-----|----------|
| id | string | Уникальный ID |
| moduleId | string | ID модуля |
| title | string | Название |
| isRequired | boolean | Обязательная? |
| status | enum | TODO / DOING / DONE / ACCEPTED |
| orderIndex | number | Порядок |
| comment | string | Комментарий |

### 5. VipDefect (дефект)
| Поле | Тип | Описание |
|------|-----|----------|
| id | string | Уникальный ID |
| projectId | string | ID проекта |
| moduleId | string | ID модуля |
| taskId | string | ID задачи (опц.) |
| description | string | Описание |
| severity | enum | LOW / MEDIUM / HIGH |
| status | enum | NEW / IN_FIX / FIXED / CONFIRMED |
| photos | array | Фото дефекта |
| createdByUserId | string | Кто создал |
| createdAt | ISO date | Дата создания |

### 6. VipCatalogItem (карточка каталога)
| Поле | Тип | Описание |
|------|-----|----------|
| id | string | Уникальный ID |
| packageKey | string | Ключ подгруппы |
| title | string | Название |
| shortDesc | string | Краткое описание |
| imageUrl | string | URL изображения |
| taskTemplateJson | array | Шаблон задач |
| requirementsJson | object | Требования |
| defaultDurationDays | number | Дней по умолчанию |

---

## 🚦 Статусы модуля

```
DRAFT → READY → PUBLISHED → ASSIGNED → IN_WORK → ON_REVIEW → DONE
                                                      ↓
                                              (return) IN_WORK
```

### Условия перехода в READY:
- ✅ Есть description ИЛИ вложение (фото/план)
- ✅ Заполнены сроки (plannedEnd)
- ✅ Выбрана подгруппа (packageId)

### Блокировка DONE:
- ❌ Есть дефекты со статусом NEW / IN_FIX / FIXED

---

## 🎨 UI Экраны

### P0 (Ядро)
1. **Projects List** (`/vip/projects`) - Список объектов
2. **Create Project** - Создание нового объекта
3. **Catalog** (`/vip/catalog`) - Каталог модулей картинками
4. **Project Dashboard** (`/vip/projects/:id`) - Дашборд проекта с канбаном
5. **Module Details** (`/vip/projects/:id/modules/:moduleId`) - Детали модуля

### P1 (Контроль)
6. Tasks Checklist - Чеклист задач
7. Defects Management - Управление дефектами
8. PDF Generation - Генерация PDF

### P2 (Умность)
9. Dependencies - Зависимости между модулями
10. Auto-planning - Автопланирование

---

## 📦 Категории каталога

| Ключ | Название RU | Иконка |
|------|-------------|--------|
| FOUNDATION | Фундамент | 🏗️ |
| WALLS | Стены и перегородки | 🧱 |
| ROOFING | Кровля | 🏠 |
| ELECTRIC | Электрика | ⚡ |
| PLUMBING | Водоснабжение и канализация | 🚿 |
| GAS | Газоснабжение | 🔥 |
| HVAC | Отопление и вентиляция | ❄️ |
| FINISHING | Отделочные работы | 🎨 |
| LANDSCAPING | Благоустройство | 🌳 |
| WINDOWS | Окна и двери | 🚪 |
| SECURITY | Охранные системы | 🔒 |
| SMART_HOME | Умный дом | 📱 |

---

## ✅ Критерии приёмки P0

- [ ] Заказчик создаёт VIP-объект
- [ ] Добавляет модули из каталога (картинки)
- [ ] Видит подгруппы и канбан по статусам
- [ ] Внутри модуля есть задачи и вложения
- [ ] "Опубликовать модуль" создаёт заявку (Order с orderType=VIP_MODULE)
- [ ] Исполнитель видит заявку в ленте
- [ ] AuditLog на ключевые действия

---

## 🔧 Интеграция с существующей системой

### Связь с Order:
При публикации модуля создаётся Order с полями:
```javascript
{
  orderType: 'VIP_MODULE',
  vipProjectId: 'project_xxx',
  vipModuleId: 'module_xxx',
  title: '[VIP] ' + module.title,
  // ... остальные поля Order
}
```

### Отображение в ленте исполнителя:
Заказы с `orderType === 'VIP_MODULE'` помечаются бейджем "VIP" в ленте.

---

## 📝 Changelog

- **v1.0** (2026-01-26) - Начальный план реализации
