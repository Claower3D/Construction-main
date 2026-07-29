# 🔍 QAZGOST AI — Полный Аудит Проекта

**Дата:** 10 февраля 2026  
**Версия:** v1.0  
**Автор:** AI-аудит  

---

## 📊 Общая статистика

| Компонент | Файлов проверено | Критических багов | Предупреждений | Информационных |
|-----------|:----------------:|:-----------------:|:--------------:|:--------------:|
| **WebVersion** (JS) | ~30 файлов | 3 ✅ исправлено | 8 | 12 (4 ✅ исправлено) |
| **AndroidProject** (Kotlin) | 10 файлов | 0 | 4 | 6 |
| **ai-service** (Python) | 20 файлов | 0 ✅ исправлено | 2 | 5 (3 ✅ исправлено) |
| **Итого** | ~60 файлов | **3 исправлено** | **14** | **23 (7 исправлено)** |

---

## 🔴 КРИТИЧЕСКИЕ БАГИ (Исправлены)

### 1. `statusMachine.js` — Crash при отсутствии `window.Models`

- **Файл:** `WebVersion/statusMachine.js`, строка 8
- **Проблема:** Прямая деструктуризация `window.Models` на уровне IIFE без проверки. Если `models.js` не загрузился — весь модуль crashит.
- **Исправление:** Добавлен guard clause:

```javascript
if (!window.Models) {
    console.error('❌ Models not loaded! StatusMachine cannot initialize.');
    return;
}
```

- **Статус:** ✅ Исправлено

### 2. `engineeringModels.js` — Crash при отсутствии `window.Models`

- **Файл:** `WebVersion/engineeringModels.js`, строка 8
- **Проблема:** Аналогичная — деструктуризация без guard clause.
- **Исправление:** Добавлен guard clause перед деструктуризацией.
- **Статус:** ✅ Исправлено

### 3. `notificationService.js` — Double-fault в catch blocks

- **Файл:** `WebVersion/notifications/notificationService.js`, строки 24, 50, 53, 58
- **Проблема:** В функциях `loadFromStorage` и `loadSettings` внутри catch-блоков происходит деструктуризация `window.NotificationModels`, что само может выбросить ошибку (double-fault).
- **Исправление:** Добавлены null-safety проверки для `window.NotificationModels` в catch-блоках.
- **Статус:** ✅ Исправлено

---

## 🟡 ПРЕДУПРЕЖДЕНИЯ (Требуют внимания)

### WebVersion

#### W-1. `chatService.js` — Деструктуризация `ChatModels` с `|| {}`

- **Файл:** `WebVersion/chat/chatService.js`, строка 8-11
- **Код:** `const { ChatRoom, ChatMessage, ... } = window.ChatModels || {};`
- **Проблема:** Если `ChatModels` не загружен, все переменные будут `undefined`. Вызов методов вроде `ChatRoom.findByRef()` выбросит TypeError.
- **Рекомендация:** Добавить `if (!ChatRoom)` guard перед использованием в RoomAPI/MessageAPI.
- **Приоритет:** Средний

#### W-2. `financeService.js` — Аналогичная деструктуризация

- **Файл:** `WebVersion/financeService.js`, строка 8-14
- **Код:** `const { ... } = window.FinanceModels || {};`
- **Проблема:** Деструктуризация с fallback на `{}` — не защищает от runtime ошибок при вызове методов.
- **Рекомендация:** Добавить guard clause или проверку перед экспортом.
- **Приоритет:** Средний

#### W-3. `script.js` — Жёсткая привязка к DOM-элементам

- **Файл:** `WebVersion/script.js`, строки 148-177
- **Проблема:** `document.getElementById(...)` вызывается на уровне модуля. Если элемент отсутствует в DOM, значение будет `null`, но в дальнейшем коде нет последовательной проверки.
- **Рекомендация:** Код уже частично защищён (`if (elements.chatInput)` на строке 196), но стоит добавить аналогичные проверки для всех обработчиков.
- **Приоритет:** Низкий

#### W-4. `volumeUI.js` — Нет защиты от XSS в `photo.src`

- **Файл:** `WebVersion/volume/volumeUI.js`, строка 354
- **Код:** `<img src="${photo.src}" alt="">`
- **Проблема:** `photo.src` формируется через `FileReader.readAsDataURL()` (base64), что безопасно. Но если данные восстанавливаются из `localStorage`, содержимое может быть подменено.
- **Рекомендация:** Добавить валидацию `data:image/` при рендере.
- **Приоритет:** Низкий

#### W-5. Дублирование `vipModels.js`

- **Файлы:** `WebVersion/vipModels.js` и `WebVersion/vip/vipModels.js`
- **Проблема:** Существуют два файла vipModels.js. Оба экспортируют `window.VipModels`, что может вызвать конфликт.
- **Рекомендация:** Удалить устаревший файл `/WebVersion/vipModels.js`.
- **Приоритет:** Средний

#### W-6. `PdfGenerator.kt` — Нет обработки переполнения страницы PDF

- **Файл:** `AndroidProject/.../PdfGenerator.kt`, строки 147-149
- **Код:** `if (yPos > 780f) { yPos = 780f }`
- **Проблема:** При большом количестве объектов текст будет рисоваться поверх предыдущей строки, а не переноситься на следующую страницу.
- **Рекомендация:** Реализовать автоматическое создание новых страниц.
- **Приоритет:** Средний

#### W-7. `ObjectDetector.kt` — Утечка ресурса `FileInputStream`

- **Файл:** `AndroidProject/.../ObjectDetector.kt`, строки 62-67
- **Проблема:** `FileInputStream` и `AssetFileDescriptor` не закрываются после `map()`. Это может привести к утечке файловых дескрипторов.
- **Рекомендация:** Использовать `.use { }` для автоматического закрытия.
- **Приоритет:** Средний

#### W-8. `ObjectDetector.kt` — Утечка ресурса `Bitmap`

- **Файл:** `AndroidProject/.../ObjectDetector.kt`, строка 106
- **Код:** `val resizedBitmap = Bitmap.createScaledBitmap(bitmap, INPUT_SIZE, INPUT_SIZE, true)`
- **Проблема:** `resizedBitmap` никогда не освобождается (`recycle()`). При многократном анализе это может вызвать OutOfMemoryError.
- **Рекомендация:** Добавить `resizedBitmap.recycle()` после завершения конвертации.
- **Приоритет:** Средний

---

## 🔵 ИНФОРМАЦИОННЫЕ ЗАМЕЧАНИЯ

### WebVersion

#### I-1. Архитектура: глобальные `window.*` модули ✅ РЕШЕНО

Весь проект использовал паттерн `window.ModuleName` для межмодульного взаимодействия.

- **Решение:** Создан `moduleRegistry.js` — центральный реестр модулей с:
  - Проверкой зависимостей при регистрации
  - Логированием порядка загрузки
  - `waitFor()` / `waitForAll()` методами для ожидания модулей
  - `diagnostics()` для отладки
  - Обратной совместимостью с `window.*`
- **Файлы:** `moduleRegistry.js` (новый), `models.js` и `statusMachine.js` (интегрированы)
- **Долгосрочная рекомендация:** Миграция на ES-модули (`import/export`).

#### I-2. `services.js` vs `apiService.js` — дублирование логики

- `services.js` (1446 строк) содержит Storage wrapper, Toast, Auth и множество бизнес-логики.
- `apiService.js` (543 строки) содержит HTTP-клиент, токены, refresh-логику.
- `dataService.js` — мостик между localStorage и API.
- **Замечание:** Три уровня абстракции для данных усложняют отладку.

#### I-3. Загрузка скриптов в `index.html` ✅ РЕШЕНО

Текущий порядок загрузки (`~44 скрипта`) документирован и управляется:

- **Решение:** Создан `scriptLoader.js` с:
  - Полной картой загрузки всех 44 скриптов по 8 фазам
  - Динамической загрузкой скриптов (`load()`, `loadSequence()`, `loadParallel()`)
  - Диагностикой (`diagnostics()`)
- **Файлы:** `scriptLoader.js` (новый), `index.html` (обновлён порядок загрузки)
- **Долгосрочная рекомендация:** Миграция на бандлер (Vite/webpack).

#### I-4. `financeModels.js` — безопасная инициализация

Строка 95 использует `window.Models?.Storage || { ... }` — грамотный fallback. Хороший пример для подражания.

#### I-5. `chatService.js` — Хранение файлов в base64

`FileHelper.upload()` сохраняет файлы как base64 Data URL в память/localStorage. Для больших файлов это может:

- Переполнить квоту localStorage (5-10MB)
- Вызвать проблемы производительности

#### I-6. `HistoryActivity.kt` — JSON-парсинг без обработки ошибок

`AnalysisHistory.getAll()` парсит JSON из SharedPreferences без try-catch. Повреждённые данные вызовут crash.

### AndroidProject

#### I-7. Нет `AnalysisHistory` класса в отдельном файле

`AnalysisHistory` object и `AnalysisHistoryItem` data class определены внутри `HistoryActivity.kt`. Рекомендуется выделить в отдельный файл.

#### I-8. `MainActivity.kt` — `cameraExecutor` используется до инициализации

`initDetector()` (строка 64) вызывает `cameraExecutor.execute{}` на строке 104, но `cameraExecutor` инициализируется на строке 74 (после `initDetector`). Kotlin `lateinit` не выбросит ошибку здесь, т.к. код `cameraExecutor.execute{}` выполняется асинхронно, но это опасный паттерн.

#### I-9. `EngineerActivity.kt`, `ProjectDetailsActivity.kt` — не проверены полностью

Эти файлы не были полностью проверены в рамках данного аудита.

### ai-service

#### I-10. `detector.py` — Singleton не потокобезопасен ✅ ИСПРАВЛЕНО

`get_detector()` функция использовала глобальную переменную без блокировки.

- **Решение:** Реализован double-checked locking с `threading.Lock` в `detector.py` и `depth.py`
- Добавлены функции `reset_detector()` и `reset_depth_estimator()` для тестов

#### I-11. `config.py` — Директории создаются при импорте ✅ ИСПРАВЛЕНО

Директории создавались как побочный эффект при `import config`.

- **Решение:** Вынесено в явный `ensure_dirs()`, вызываемый в `main.py` при старте приложения

#### I-12. Модели YOLO не включены в проект ✅ РЕШЕНО

`yolov8m.pt` и `yolov8_construction.pt` отсутствуют в репозитории.

- **Решение:** Создан `scripts/download_models.py` — утилита для скачивания моделей
  - `python scripts/download_models.py` — скачать все модели
  - `python scripts/download_models.py --check` — проверить статус моделей
  - Поддержка YOLO и DPT depth моделей
  - Инструкции по обучению custom-модели

---

## ✅ ФАЙЛЫ БЕЗ ПРОБЛЕМ

Следующие файлы проверены и не содержат критических или средних проблем:

| Файл | Статус |
|------|--------|
| `WebVersion/models.js` | ✅ Базовые модели — OK |
| `WebVersion/dataService.js` | ✅ Guard clause для Models — OK |
| `WebVersion/engineeringService.js` | ✅ Guard clauses — OK |
| `WebVersion/estimateService.js` | ✅ Guard clause — OK |
| `WebVersion/vipService.js` | ✅ `\|\| {}` fallback — OK |
| `WebVersion/modulesUI.js` | ✅ Деструктуризация внутри функций — OK |
| `WebVersion/chatModels.js` | ✅ Self-contained — OK |
| `WebVersion/chatUI.js` | ✅ `\|\| {}` fallback — OK |
| `WebVersion/volumeParser.js` | ✅ Self-contained — OK |
| `WebVersion/notifications/notificationIntegration.js` | ✅ `waitForModules` — OK |
| `WebVersion/financeModels.js` | ✅ Safe fallback — OK |
| `AndroidProject/SettingsActivity.kt` | ✅ Безопасная работа с SharedPrefs — OK |
| `ai-service/app/config.py` | ✅ Pydantic Settings — OK |

---

## 🗺️ ПЛАН ДЕЙСТВИЙ

### Фаза 1 — Немедленно (Сделано ✅)

- [x] Исправить crash в `statusMachine.js`
- [x] Исправить crash в `engineeringModels.js`  
- [x] Исправить double-fault в `notificationService.js`

### Фаза 2 — Следующий спринт (Высокий приоритет)

- [x] **W-5**: Удалить дублирующийся `vipModels.js` из корня WebVersion ✅
- [x] **W-1**: Добавить guard clauses в `chatService.js` ✅ (07.04.2026)
- [x] **W-2**: Добавить guard clauses в `financeService.js` ✅ (07.04.2026)
- [x] **W-7**: Исправить утечку ресурсов в `ObjectDetector.kt` (FileInputStream) ✅ (15.07.2026)
- [x] **W-8**: Исправить утечку Bitmap в `ObjectDetector.kt` ✅ (15.07.2026)
- [x] **I-8**: Переместить инициализацию `cameraExecutor` перед `initDetector()` ✅ (15.07.2026)

### Фаза 3 — Техдолг (Средний приоритет)

- [x] **W-6**: Добавить многостраничность в PDF (Android) ✅ (15.07.2026)
- [x] **I-6**: Добавить try-catch в `AnalysisHistory.getAll()` ✅ (15.07.2026)
- [x] **I-10**: ~~Сделать singleton потокобезопасным в `detector.py`~~ ✅
- [x] **I-3**: ~~Рассмотреть миграцию на бандлер~~ ✅ Создан ScriptLoader
- [x] **I-1**: ~~Глобальные window.* модули~~ ✅ Создан ModuleRegistry
- [x] **I-11**: ~~Side-effect в config.py~~ ✅ Вынесено в ensure_dirs()
- [x] **I-12**: ~~YOLO модели~~ ✅ Создан download_models.py

### Фаза 4 — Улучшения (Низкий приоритет)

- [ ] Миграция на ES-модули (полная)
- [ ] **I-5**: Реализовать серверное хранение файлов для чата
- [ ] Интегрировать оставшиеся модули в ModuleRegistry
- [x] **W-4**: Валидация base64 в volumeUI.js ✅ (15.07.2026)

---

## 📝 ЗАКЛЮЧЕНИЕ

Проект **QAZGOST AI** имеет хорошую архитектуру и грамотное разделение на модули. Основные проблемы связаны с:

1. **Хрупкостью загрузки скриптов** — зависимость от порядка `<script>` тегов. 3 критических бага были найдены и исправлены.
2. **Ресурсными утечками в Android** — не закрываемые потоки и Bitmap'ы.
3. **Техническим долгом** — дублирование файлов, отсутствие бандлера, глобальные переменные. → Решено через ModuleRegistry + ScriptLoader.

Общая оценка качества кода: **8/10** (после всех исправлений).

### Дополнительно исправлено (07.04.2026):
- ✅ BUG-PAY-1: CVV regex double-escape
- ✅ BUG-PAY-2: Luhn-валидация карт + проверка срока
- ✅ BUG-PAY-6: syncWithServer localStorage ключи
- ✅ BUG-PAY-7: Timer leak в Kaspi/Crypto модалках
- ✅ BUG-AUTH-4: confirm() → кастомная модалка
- ✅ BUG-AUTH-6: auth close → landing (не мёртвое состояние)
- ✅ W-1/W-2: Guard clauses для chatService + financeService
