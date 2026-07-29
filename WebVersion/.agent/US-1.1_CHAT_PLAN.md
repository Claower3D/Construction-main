# План реализации US-1.1: Чат заказчик-подрядчик

## Дата начала: 2026-01-30

## Story Points: 13

## Приоритет: P0

---

## Описание

**Как** заказчик/подрядчик,  
**Я хочу** обмениваться сообщениями в чате внутри системы,  
**Чтобы** обсуждать детали заказа без использования внешних мессенджеров.

---

## Критерии приёмки

- [x] Чат доступен на странице заказа
- [x] Сообщения сохраняются в localStorage
- [x] Поддержка текста и вложений (фото, документы)
- [x] Индикатор непрочитанных сообщений
- [x] История переписки сохраняется

---

## Технические задачи

### 1. Модели (chatModels.js) ✅

- [x] `ChatRoom` — комната чата (привязка к заказу)
- [x] `ChatMessage` — сообщение (текст, вложения, статус)
- [x] `ChatParticipant` — участник чата
- [x] Enums: `MessageType`, `MessageStatus`

### 2. Сервис (chatService.js) ✅

- [x] `ChatAPI.createRoom(orderId)` — создать комнату
- [x] `ChatAPI.sendMessage(roomId, content, attachments)` — отправить
- [x] `ChatAPI.getMessages(roomId, limit, offset)` — получить сообщения
- [x] `ChatAPI.markAsRead(roomId)` — отметить прочитанными
- [x] `ChatAPI.getUnreadCount(userId)` — количество непрочитанных

### 3. UI (chatUI.js) ✅

- [x] `renderChatWidget(containerId, orderId)` — виджет чата
- [x] `renderMessageList(messages)` — список сообщений
- [x] `renderMessageInput()` — поле ввода
- [x] `renderAttachmentPreview(files)` — превью вложений
- [x] `handleSendMessage()` — отправка
- [x] `handleFileUpload()` — загрузка файлов

### 4. Стили (chat.css) ✅

- [x] Контейнер чата
- [x] Bubble сообщений (свои/чужие)
- [x] Поле ввода с кнопками
- [x] Анимации появления
- [x] Responsive дизайн

### 5. Интеграция ✅

- [x] Подключить в index.html
- [x] Добавить кнопку "Чат" на странице заказа (VIP лоты)
- [x] Floating кнопка чата (chatIntegration.js)
- [x] Индикатор непрочитанных (global badge)

---

## Порядок реализации

1. ✅ chatModels.js
2. ✅ chatService.js  
3. ✅ chatUI.js
4. ✅ chat.css
5. ✅ chatIntegration.js (floating кнопка + связь с заказами)
6. ✅ Интеграция в index.html
7. ✅ Интеграция в VIP модуль (vipUI.js — toggleLotChat)

---

## Зависимости

- `models.js` — User, Order
- `services.js` — Auth.getCurrentUser()
- `dataService.js` — Order API

---

## Реализованные файлы

| Файл | Описание |
|------|----------|
| `chat/chatModels.js` | Модели ChatRoom, ChatMessage, ChatParticipant |
| `chat/chatService.js` | API для работы с чатами, сообщениями, файлами |
| `chat/chatUI.js` | Виджет чата, рендеринг сообщений |
| `chat/chat.css` | Стили чата |
| `chat/chatIntegration.js` | Интеграция: floating кнопка, inline чат |

---

## Статус: ✅ Завершено

**Дата завершения:** 2026-01-30
