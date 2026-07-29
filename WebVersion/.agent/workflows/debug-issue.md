---
description: Отладка и исправление ошибок в QAZGOST AI
---

# Отладка и исправление ошибок

## Входные параметры

- **ERROR_DESCRIPTION**: Описание проблемы
- **ERROR_LOCATION**: Где возникает (страница, модуль, функция)

## Шаги

### 1. Воспроизведение проблемы

// turbo

```bash
npx -y http-server "c:\Users\User\Desktop\Моя программа\новая прога от гугла\WebVersion" -p 8080 -o
```

Открыть DevTools (F12) → Console

### 2. Сбор информации

Проверить в консоли:

- [ ] Есть ли JavaScript ошибки?
- [ ] Все ли скрипты загружены? (проверить Network tab)
- [ ] Есть ли `✅ {Module} loaded` сообщения?

Записать:

- Точный текст ошибки
- Stack trace
- Шаги воспроизведения

### 3. Локализация проблемы

#### Ошибка загрузки модуля

```
Uncaught ReferenceError: {Module} is not defined
```

**Причина**: Модуль не загружен или порядок скриптов неверный
**Решение**: Проверить index.html, порядок `<script>` тегов

#### Ошибка localStorage

```
JSON.parse error / localStorage is null
```

**Причина**: Данные повреждены или отсутствуют
**Решение**: Очистить localStorage:

```javascript
localStorage.clear(); location.reload();
```

#### Ошибка UI не отображается

```
Element is null / Cannot read property of null
```

**Причина**: DOM элемент не найден
**Решение**:

1. Проверить id элемента в HTML
2. Убедиться что скрипт выполняется после DOMContentLoaded

#### Ошибка API

```
{Service}.{method} is not a function
```

**Причина**: Сервис не экспортирует метод
**Решение**: Проверить `window.{Service} = { ... }` в конце файла

### 4. Типичные проблемы и решения

| Проблема | Решение |
|----------|---------|
| Страница пустая | Проверить консоль на ошибки JS |
| Данные не сохраняются | Проверить Storage.set() и ключ |
| Кнопка не работает | Проверить onclick и наличие функции |
| Модуль undefined | Проверить порядок скриптов |
| CSS не применяется | Проверить подключение и селекторы |

### 5. Дебаг с console.log

```javascript
// Добавить временно для отладки
console.log('🔍 DEBUG:', {
    variable: someVariable,
    data: someData,
    element: document.getElementById('some-id')
});
```

### 6. Использование breakpoints

1. Открыть Sources tab в DevTools
2. Найти нужный файл
3. Кликнуть на номер строки для установки breakpoint
4. Воспроизвести проблему
5. Изучить значения переменных в Scope

### 7. Проверка после исправления

- [ ] Ошибка в консоли исчезла
- [ ] Функциональность работает корректно
- [ ] Нет регрессий (другие части не сломались)
- [ ] Данные сохраняются после F5

### 8. Документирование

Если это частая проблема, добавить в этот workflow или создать отдельный .md файл.

## Полезные команды консоли

```javascript
// Просмотр всех данных в localStorage
Object.keys(localStorage).forEach(k => console.log(k, JSON.parse(localStorage[k])));

// Проверить загруженные модули
console.log('Models:', window.Models);
console.log('Services:', window.Services);
console.log('StatusMachine:', window.StatusMachine);
console.log('FinanceService:', window.FinanceService);
console.log('VipService:', window.VipService);

// Очистить конкретный ключ
localStorage.removeItem('key_name');

// Текущий пользователь
console.log('Current user:', window.Models?.User?.current?.());
```

## Чек-лист завершения

- [ ] Проблема воспроизведена
- [ ] Причина найдена
- [ ] Исправление применено
- [ ] Проверено что работает
- [ ] Регрессионное тестирование пройдено
- [ ] Временные console.log удалены
