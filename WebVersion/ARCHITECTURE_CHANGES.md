# Изменения в архитектуре QazGost AI

## Дата: 2026-01-23

## Что добавлено

### 1. Data Layer (Слой данных)

#### models.js

Все сущности данных с методами CRUD в localStorage:

- **User** - пользователи (id, role, email, phone, name)
- **CustomerProfile** - профиль заказчика (name, phone, city, type, isComplete)
- **ExecutorProfile** - профиль исполнителя (orgName, services[], experience, portfolio[])
- **Order** - заказы (customerId, status, title, description, budget, city, category)
- **Application** - заявки исполнителей (orderId, executorId, price, duration, status)
- **Work** - работы (orderId, executorId, status, agreedPrice)
- **OrderStage** - этапы работ
- **Defect** - дефекты
- **Attachment** - вложения
- **Review** - отзывы
- **AuditLog** - история изменений

#### statusMachine.js

Единый модуль управления статусами:

- **OrderStatus**: DRAFT → PUBLISHED → IN_WORK → ON_REVIEW → DONE
- **ApplicationStatus**: DRAFT → SENT → REVIEW → ACCEPTED | REJECTED
- **WorkStatus**: IN_WORK → ON_REVIEW → FIXES → DONE
- **StageStatus**: PLAN → IN_WORK → ON_REVIEW → ACCEPTED
- **DefectStatus**: NEW → IN_FIX → FIXED → CONFIRMED

Функции:

- `canTransition(entityType, from, to)` - проверка разрешённых переходов
- `transition(entity, entityType, toStatus, actor)` - выполнение перехода + AuditLog
- `renderStatusBadge(entityType, status)` - HTML-бейдж статуса

#### dataService.js

API/Сервисы для работы с данными:

- **Customer API**: getProfile, updateProfile, getOrders, createOrder, updateOrder, publishOrder, acceptApplication, rejectApplication
- **Executor API**: getProfile, updateProfile, getAvailableOrders, applyToOrder, getMyWorks, submitWork
- **Files API**: upload
- **Audit API**: getHistory

### 2. UI Компоненты

#### Модальные окна (добавлены в index.html)

- **draftOrderModal** - создание/редактирование черновика заказа
- **customerProfileModal** - профиль заказчика
- **executorProfileModal** - анкета исполнителя
- **applyModal** - отклик на заказ (для исполнителя)
- **applicationsModal** - список откликов (для заказчика)
- **historyModal** - история изменений (audit)
- **submitWorkModal** - сдача работы

#### JavaScript функции

- `openDraftModal(orderId)` / `closeDraftModal()` / `saveDraftOrder()` / `publishDraftOrder()`
- `openCustomerProfileModal()` / `saveCustomerProfile()`
- `openExecutorProfileModal()` / `saveExecutorProfile()`
- `openApplyModal(orderId)` / `submitApplication()`
- `openApplicationsModal(orderId)` / `acceptApplication()` / `rejectApplication()`
- `openHistoryModal(entityType, entityId)`
- `openSubmitWorkModalNew(workId)` / `submitWorkNew()`

### 3. Обновлённые функции

#### loadOrders()

- Теперь использует DataService вместо прямых API-вызовов
- Автоматически инициализирует демо-данные
- Поддерживает оба режима: заказчик и исполнитель

#### renderDemoOrders()

- Использует DataService.initDemoData()
- Загружает реальные заказы из localStorage

#### renderOrderActions()

- Поддерживает строковые ID (из моделей)
- Добавлен статус 'draft' с кнопкой редактирования
- Добавлена кнопка "История" для каждого заказа

#### updateUIForRole()

- Для заказчика: кнопка "Создать черновик заказа"
- Для исполнителя: ссылка "Заполните анкету"

#### getStatusText()

- Добавлен статус 'draft' = 'Черновик'
- 'open' теперь = 'Опубликован'

### 4. CSS стили

Добавлены стили:

- `.order-status.draft` - стиль для черновика
- `.modal-overlay` - оверлей модального окна
- `.modal-content` - контент модального окна
- `.modal-title` - заголовок
- `.modal-input` - поле ввода
- `.modal-actions` - кнопки действий
- `.modal-btn-cancel` / `.modal-btn-submit` - кнопки

---

## Как протестировать

### 1. Запустить приложение

```bash
cd "c:\Users\User\Desktop\Моя программа\новая прога от гугла\WebVersion"
python -m http.server 8000
```

### 2. Открыть в браузере

```
http://localhost:8000
```

### 3. Тест-кейсы

#### Заказчик

1. Войти как гость → попадаете на home
2. Перейти в "Мои заказы" → увидите кнопку "Создать черновик заказа"
3. Создать черновик → заполнить форму → "Сохранить черновик"
4. Попробовать "Опубликовать" → увидите запрос заполнить профиль
5. Заполнить профиль заказчика → снова опубликовать → заказ появится в ленте

#### Исполнитель

1. Переключить роль на "Исполнитель" (в меню)
2. Перейти в "Лента заказов" → увидите опубликованные заказы
3. Нажать "Откликнуться" → появится запрос заполнить анкету
4. Заполнить анкету исполнителя → отклик отправлен
5. (Заказчик) Принять заявку → создаётся Work
6. (Исполнитель) Сдать работу → статус ON_REVIEW

#### История

- На любом заказе нажать кнопку 📜 → увидите историю изменений

---

## Файлы

| Файл | Описание |
|------|----------|
| `models.js` | Модели данных (localStorage) |
| `statusMachine.js` | Логика переходов статусов |
| `dataService.js` | API/Сервисы |
| `index.html` | UI + модальные окна + функции |

---

## Следующие шаги

1. **Backend**: Заменить localStorage на реальный API (изменить методы в dataService.js)
2. **Этапы работ**: Добавить UI для OrderStage
3. **Дефекты**: Добавить UI для Defect
4. **Отзывы**: Добавить UI для Review после завершения
5. **PDF-отчёты**: Интеграция с jsPDF для генерации актов

---

**Статус:** ✅ MVP готов к тестированию
