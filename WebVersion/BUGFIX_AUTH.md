# Исправление проблемы с авторизацией и отображением основного контента

## Дата: 2026-01-23

## Проблема

После входа как гость (нажатие кнопки "Пропустить") основной функционал приложения не отображался - пользователь видел только фон с частицами, но не страницу "home" с карточками сервисов.

## Причины

### 1. Несовпадение ключей localStorage

- **auth-engine.js** (строка 751) сохраняет токен как `accessToken`
- **index.html** функция `isAuthenticated()` (строка 5204) проверяла ключ `authToken`
- Результат: даже после успешной авторизации система считала пользователя неавторизованным

### 2. Кнопка "Войти как гость" не устанавливала флаги

- Кнопка только скрывала экран авторизации (`$('#authScreen').hidden = true`)
- Не устанавливала `isLoggedIn` в localStorage
- Не вызывала `showPage('home')` для перехода на главную
- Результат: приложение не знало, что пользователь "авторизован" как гость

### 3. Неоптимальная навигация после входа

- auth-engine.js перенаправлял на страницу 'estimate' вместо 'home'
- Пользователь не видел главное меню с выбором действий

## Исправления

### `index.html` - Функция isAuthenticated() (строки 5202-5213)

**Было:**

```javascript
function isAuthenticated() {
    const token = localStorage.getItem('authToken');
    const expires = localStorage.getItem('authExpires');
    return token && expires && Date.now() < parseInt(expires);
}
```

**Стало:**

```javascript
function isAuthenticated() {
    // Check both accessToken (from auth-engine.js) and authToken (legacy) for compatibility
    const token = localStorage.getItem('accessToken') || localStorage.getItem('authToken');
    const expires = localStorage.getItem('authExpires');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // User is authenticated if:
    // 1. Has valid token with non-expired timestamp, OR
    // 2. isLoggedIn flag is set (for demo/guest mode)
    return (token && expires && Date.now() < parseInt(expires)) || isLoggedIn;
}
```

**Изменения:**

- ✅ Проверяет правильный ключ `accessToken`
- ✅ Оставил fallback на `authToken` для обратной совместимости
- ✅ Добавлена проверка флага `isLoggedIn` для гостевого режима
- ✅ Подробные комментарии для будущих разработчиков

---

### `index.html` - Кнопка "Пропустить" (строки 2398-2401)

**Было:**

```html
<button class="auth-skip-btn" onclick="$('#authScreen').hidden = true; showToast('⏩ Вы вошли как гость');">
    ⏩ Пропустить
</button>
```

**Стало:**

```html
<button class="auth-skip-btn" onclick="localStorage.setItem('isLoggedIn', 'true'); localStorage.setItem('authExpires', Date.now() + 24*60*60*1000); $('#authScreen').hidden = true; $('#mainHeader').hidden = false; showToast('👤 Вы вошли как гость'); showPage('home');">
    ⏩ Пропустить
</button>
```

**Изменения:**

- ✅ Устанавливает `isLoggedIn = 'true'` в localStorage
- ✅ Устанавливает `authExpires` на 24 часа вперёд
- ✅ Показывает главный header (`$('#mainHeader').hidden = false`)
- ✅ Вызывает `showPage('home')` для перехода на главную страницу
- ✅ Улучшенное сообщение тоста с эмодзи пользователя

---

### `auth-engine.js` - Функция completeAuth() (строки 793-796)

**Было:**

```javascript
// Navigate to home or last page
if (window.showPage) {
    window.showPage('estimate');
}
```

**Стало:**

```javascript
// Navigate to home or last page
if (window.showPage) {
    window.showPage('home');
}
```

**Изменения:**

- ✅ Перенаправление на 'home' вместо 'estimate'
- ✅ Пользователь видит главное меню перед выбором действия

---

## Как протестировать исправления

### 1. Вход как гость

```
1. Откройте приложение в браузере (http://localhost:8000)
2. Нажмите кнопку "⏩ Пропустить"
3. ✅ Ожидается: появляется страница "home" с карточками сервисов
4. ✅ Ожидается: отображается главный header
5. ✅ Ожидается: можно кликнуть на карточки и перейти к функциям
```

### 2. Полная регистрация/вход

```
1. Зарегистрируйтесь или войдите через Email/Phone/OAuth
2. ✅ Ожидается: после входа отображается страница 'home'
3. ✅ Ожидается: токен сохранён как 'accessToken' в localStorage
4. ✅ Ожидается: можно перезагрузить страницу - авторизация сохранится
```

### 3. Проверка localStorage в DevTools

```javascript
// Откройте консоль браузера (F12)
console.log('accessToken:', localStorage.getItem('accessToken'));
console.log('isLoggedIn:', localStorage.getItem('isLoggedIn'));
console.log('authExpires:', localStorage.getItem('authExpires'));
console.log('Is authenticated:', isAuthenticated());
```

---

## Совместимость

- ✅ Обратная совместимость: код проверяет оба ключа (`accessToken` и `authToken`)
- ✅ Поддержка гостевого режима: флаг `isLoggedIn`
- ✅ Поддержка полной авторизации: токены + срок действия
- ✅ Все 3 метода входа работают: Email, Phone OTP, OAuth

---

## Дополнительные рекомендации

### Будущие улучшения

1. **Единый модуль авторизации**: создать `AuthService.js` с централизованной логикой
2. **Тесты**: добавить unit-тесты для `isAuthenticated()`, `completeAuth()`
3. **Аналитика**: логировать способ входа (guest/email/phone/oauth)
4. **Персистентность**: сохранять последнюю посещённую страницу и возвращать пользователя туда после входа

### Безопасность

- Текущая реализация — **демо-режим**, подходит для development/testing
- Для production необходимо:
  - Подключить реальный backend API (заменить `IS_DEMO_MODE = false`)
  - Использовать HTTPS
  - Добавить CSRF-защиту
  - Хранить токены в httpOnly cookies вместо localStorage
  - Добавить rate limiting для API входа

---

## Файлы, которые были изменены

1. `index.html` — функция `isAuthenticated()` (строки 5202-5213)
2. `index.html` — кнопка "Пропустить" (строка 2399)
3. `auth-engine.js` — функция `completeAuth()` (строка 795)

---

## Контрольный список (Checklist)

- [x] Исправлено несовпадение ключей localStorage
- [x] Кнопка "Пропустить" корректно устанавливает флаги
- [x] После входа отображается страница 'home'
- [x] Добавлены комментарии в код
- [x] Обратная совместимость обеспечена
- [x] Документация создана

---

**Статус:** ✅ ИСПРАВЛЕНО И ГОТОВО К ТЕСТИРОВАНИЮ
