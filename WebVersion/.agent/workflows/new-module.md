---
description: Создание нового модуля для QAZGOST AI
---

# Создание нового модуля

## Входные параметры

- **MODULE_NAME**: Название модуля (например: chat, notifications, calendar)
- **MODULE_DIR**: Директория модуля (опционально, если отдельная папка)

## Шаги

### 1. Создать структуру файлов

Для модуля в отдельной папке:

```
WebVersion/{MODULE_NAME}/
├── {MODULE_NAME}Models.js   # Модели данных
├── {MODULE_NAME}Service.js  # API и бизнес-логика
├── {MODULE_NAME}UI.js       # UI компоненты
└── {MODULE_NAME}.css        # Стили
```

Для модуля в корне:

```
WebVersion/
├── {MODULE_NAME}Models.js
├── {MODULE_NAME}Service.js
└── {MODULE_NAME}UI.js (опционально)
```

### 2. Шаблон Models.js

```javascript
// ========== {MODULE_NAME} MODELS v1.0 ==========
// Модели данных для модуля {MODULE_NAME}

(function () {
    'use strict';

    // ===== CONSTANTS =====
    const STORAGE_KEY = '{MODULE_NAME}_data';

    // ===== ENUMS =====
    const {ModuleName}Status = Object.freeze({
        DRAFT: 'DRAFT',
        ACTIVE: 'ACTIVE',
        ARCHIVED: 'ARCHIVED'
    });

    // ===== STORAGE HELPER =====
    const Storage = {
        get(key) {
            try {
                return JSON.parse(localStorage.getItem(key)) || [];
            } catch { return []; }
        },
        set(key, data) {
            localStorage.setItem(key, JSON.stringify(data));
        },
        generateId(prefix = '{module}_') {
            return prefix + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
    };

    // ===== MODEL =====
    class {ModelName} {
        constructor(data = {}) {
            this.id = data.id || Storage.generateId();
            this.status = data.status || {ModuleName}Status.DRAFT;
            this.createdAt = data.createdAt || new Date().toISOString();
            this.updatedAt = data.updatedAt || new Date().toISOString();
        }

        validate() {
            const errors = [];
            // Add validation rules
            return errors;
        }

        save() {
            const errors = this.validate();
            if (errors.length) return { success: false, errors };
            
            this.updatedAt = new Date().toISOString();
            const all = Storage.get(STORAGE_KEY);
            const idx = all.findIndex(x => x.id === this.id);
            if (idx >= 0) all[idx] = this;
            else all.push(this);
            Storage.set(STORAGE_KEY, all);
            return { success: true };
        }

        static find(id) {
            return Storage.get(STORAGE_KEY).find(x => x.id === id);
        }

        static getAll() {
            return Storage.get(STORAGE_KEY);
        }
    }

    // ===== EXPORT =====
    window.{ModuleName}Models = {
        {ModelName},
        {ModuleName}Status,
        Storage
    };

    console.log('✅ {ModuleName}Models loaded');
})();
```

### 3. Шаблон Service.js

```javascript
// ========== {MODULE_NAME} SERVICE v1.0 ==========
// API и бизнес-логика модуля {MODULE_NAME}

(function () {
    'use strict';

    const { {ModelName}, {ModuleName}Status } = window.{ModuleName}Models || {};

    // ===== API =====
    const {ModuleName}API = {
        create(data) {
            const item = new {ModelName}(data);
            return item.save();
        },

        get(id) {
            return {ModelName}.find(id);
        },

        list(filters = {}) {
            let items = {ModelName}.getAll();
            // Apply filters
            return items;
        },

        update(id, data) {
            const item = {ModelName}.find(id);
            if (!item) return { success: false, error: 'Not found' };
            Object.assign(item, data);
            return new {ModelName}(item).save();
        },

        delete(id) {
            const all = {ModelName}.getAll();
            const filtered = all.filter(x => x.id !== id);
            window.{ModuleName}Models.Storage.set('{module}_data', filtered);
            return { success: true };
        }
    };

    // ===== EXPORT =====
    window.{ModuleName}Service = {
        API: {ModuleName}API
    };

    console.log('✅ {ModuleName}Service loaded');
})();
```

### 4. Подключить в index.html

Добавить перед закрывающим `</body>`:

```html
<!-- {MODULE_NAME} Module -->
<script src="{module}/{module}Models.js"></script>
<script src="{module}/{module}Service.js"></script>
<script src="{module}/{module}UI.js"></script>
<link rel="stylesheet" href="{module}/{module}.css">
```

### 5. Добавить навигацию

В modulesUI.js или в соответствующем месте добавить пункт меню.

### 6. Создать план модуля

Создать файл `.agent/{MODULE_NAME}_MODULE_PLAN.md` с описанием:

- Цели модуля
- Модели данных
- API endpoints
- UI компоненты
- Критерии приёмки

## Чек-лист

- [ ] Models.js создан и экспортирует модели
- [ ] Service.js создан с API
- [ ] UI.js создан (если нужен)
- [ ] CSS стили созданы
- [ ] Подключено в index.html
- [ ] Добавлена навигация
- [ ] План модуля задокументирован
