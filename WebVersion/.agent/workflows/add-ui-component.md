---
description: Добавление нового UI компонента в QAZGOST AI
---

# Добавление UI компонента

## Входные параметры

- **COMPONENT_NAME**: Название компонента (например: ChatWidget, NotificationBell)
- **TARGET_FILE**: Файл для добавления (например: modulesUI.js или chatUI.js)

## Шаги

### 1. Определить тип компонента

- **Глобальный** (header, footer) → добавить в script.js или отдельный файл
- **Модульный** (часть модуля) → добавить в {module}UI.js
- **Страница** → добавить как section в index.html + обработчик

### 2. Шаблон компонента

```javascript
// ===== {COMPONENT_NAME} COMPONENT =====

function render{ComponentName}(containerId, data = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('{ComponentName}: container not found');
        return;
    }

    const html = `
        <div class="{component-name}-wrapper">
            <div class="{component-name}-header">
                <h3>${data.title || 'Title'}</h3>
            </div>
            <div class="{component-name}-body">
                <!-- Content here -->
            </div>
            <div class="{component-name}-footer">
                <button class="btn btn-primary" onclick="handle{ComponentName}Action()">
                    Action
                </button>
            </div>
        </div>
    `;

    container.innerHTML = html;
    init{ComponentName}Events();
}

function init{ComponentName}Events() {
    // Add event listeners
}

function handle{ComponentName}Action() {
    // Handle action
}

// Export if in module
if (typeof window.{ModuleName}UI !== 'undefined') {
    window.{ModuleName}UI.{ComponentName} = {
        render: render{ComponentName},
        handleAction: handle{ComponentName}Action
    };
}
```

### 3. Шаблон CSS

```css
/* ===== {COMPONENT_NAME} ===== */

.{component-name}-wrapper {
    background: var(--card-bg, #fff);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.{component-name}-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border-color, #eee);
}

.{component-name}-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
}

.{component-name}-body {
    padding: 20px;
}

.{component-name}-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border-color, #eee);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
    .{component-name}-wrapper {
        background: var(--card-bg-dark, #1e1e1e);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .{component-name}-wrapper {
        border-radius: 0;
    }
}
```

### 4. Добавить контейнер в HTML

```html
<!-- В нужной секции index.html -->
<div id="{component-name}-container"></div>
```

### 5. Инициализация

```javascript
// При загрузке страницы или показе секции
document.addEventListener('DOMContentLoaded', () => {
    render{ComponentName}('{component-name}-container', {
        title: 'My Component'
    });
});
```

## Принципы UI

### Цветовая схема (используйте CSS переменные)

```css
--primary-color: #6366f1;     /* Индиго */
--success-color: #22c55e;     /* Зелёный */
--warning-color: #f59e0b;     /* Оранжевый */
--danger-color: #ef4444;      /* Красный */
--text-primary: #1f2937;
--text-secondary: #6b7280;
--bg-primary: #ffffff;
--bg-secondary: #f9fafb;
```

### Анимации

```css
/* Плавное появление */
.fade-in {
    animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Hover эффекты */
.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
```

### Доступность

- Используйте aria-label для иконок
- Обеспечьте фокус для интерактивных элементов
- Достаточный контраст цветов

## Чек-лист

- [ ] Компонент создан в правильном файле
- [ ] CSS стили добавлены
- [ ] Контейнер добавлен в HTML
- [ ] Инициализация работает
- [ ] Responsive дизайн
- [ ] Dark mode поддержка
- [ ] Нет ошибок в консоли
