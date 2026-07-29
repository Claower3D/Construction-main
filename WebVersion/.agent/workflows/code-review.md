---
description: Проверка качества кода перед завершением задачи
---

# Code Review Checklist

## Входные параметры

- **FILES**: Список изменённых файлов
- **FEATURE**: Название функциональности

## Чек-лист проверки

### 1. Функциональность

- [ ] Код выполняет заявленную задачу
- [ ] Все edge cases обработаны
- [ ] Ошибки обрабатываются корректно

### 2. Качество кода

#### JavaScript

- [ ] Используется 'use strict'
- [ ] Нет неиспользуемых переменных
- [ ] Нет console.log (кроме ✅ loaded)
- [ ] Функции имеют понятные имена
- [ ] Комментарии к сложной логике
- [ ] Модуль экспортируется в window

#### CSS

- [ ] Используются CSS переменные
- [ ] Нет жёстко заданных цветов
- [ ] Responsive дизайн
- [ ] Поддержка Dark mode (если применимо)

#### HTML

- [ ] Семантические теги
- [ ] Уникальные id
- [ ] Доступность (aria-label, alt)

### 3. Консистентность

- [ ] Стиль кода соответствует проекту
- [ ] Именование по конвенции:
  - Модели: `{Name}` (PascalCase)
  - Функции: `{doSomething}` (camelCase)
  - CSS: `.{component-name}` (kebab-case)
  - Константы: `{CONSTANT_NAME}` (UPPER_SNAKE)

### 4. Производительность

- [ ] Нет лишних операций в циклах
- [ ] Нет утечек памяти (event listeners)
- [ ] Эффективное использование localStorage

### 5. Безопасность

- [ ] Нет eval() или innerHTML с пользовательскими данными
- [ ] Валидация входных данных
- [ ] Защита от XSS

### 6. Тестирование

// turbo

```bash
npx -y http-server "c:\Users\User\Desktop\Моя программа\новая прога от гугла\WebVersion" -p 8080 -o
```

В браузере:

- [ ] Нет ошибок в Console
- [ ] Нет ошибок в Network tab
- [ ] Функциональность работает
- [ ] Данные сохраняются после F5

### 7. Документация

- [ ] Сложные функции задокументированы
- [ ] README обновлён (если нужно)
- [ ] План модуля актуален

## Типичные ошибки

### ❌ Плохо

```javascript
// Нет 'use strict'
function save(d) {
    localStorage.setItem('data', d);
}
```

### ✅ Хорошо

```javascript
'use strict';

/**
 * Сохраняет данные в localStorage
 * @param {Object} data - Данные для сохранения
 */
function saveData(data) {
    try {
        localStorage.setItem('app_data', JSON.stringify(data));
        return { success: true };
    } catch (e) {
        console.error('Save failed:', e);
        return { success: false, error: e.message };
    }
}
```

## Финальная проверка

- [ ] Код готов к production
- [ ] Все пункты чек-листа пройдены
- [ ] Задача может быть отмечена как ✅ Done
