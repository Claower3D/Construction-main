# 🏗️ QAZGOST AI Backend

Production-ready REST API для платформы QAZGOST AI с PostgreSQL, Redis и Socket.IO.

## 📋 Содержание

- [Требования](#требования)
- [Установка](#установка)
- [Конфигурация](#конфигурация)
- [Запуск](#запуск)
- [API Endpoints](#api-endpoints)
- [Архитектура](#архитектура)

---

## 📦 Требования

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14
- **Redis** >= 6 (опционально, для кеширования и pub/sub)
- **npm** или **yarn**

---

## 🚀 Установка

```bash
# 1. Перейти в директорию backend
cd WebVersion/backend

# 2. Установить зависимости
npm install

# 3. Создать .env файл
cp .env.example .env

# 4. Настроить переменные в .env (см. раздел Конфигурация)

# 5. Создать базу данных PostgreSQL
# Windows (PowerShell):
# psql -U postgres -c "CREATE DATABASE qazgost_db;"

# 6. Применить миграции
npm run migrate

# 7. Заполнить демо-данными (опционально)
npm run seed
```

---

## ⚙️ Конфигурация

Скопируйте `.env.example` в `.env` и настройте:

```env
# Server
NODE_ENV=development
PORT=3001

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:password@localhost:5432/qazgost_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qazgost_db
DB_USER=postgres
DB_PASSWORD=password

# Redis (опционально)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Twilio (для OTP)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:8080
```

---

## 🏃 Запуск

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

### Проверка здоровья

```bash
curl http://localhost:3001/health
```

---

## 📡 API Endpoints

### 🔐 Аутентификация `/api/v1/auth`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/send-code` | Отправить OTP код |
| POST | `/verify-code` | Проверить OTP код |
| POST | `/refresh` | Обновить токен |
| POST | `/logout` | Выход |
| GET | `/me` | Текущий пользователь |

### 👤 Пользователи `/api/v1/users`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/profile` | Мой профиль |
| PUT | `/profile` | Обновить профиль |
| GET | `/:id` | Публичный профиль |

### 📦 Заказы `/api/v1/orders`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Список заказов |
| POST | `/` | Создать заказ |
| GET | `/:id` | Детали заказа |
| PUT | `/:id` | Обновить заказ |
| DELETE | `/:id` | Удалить черновик |
| POST | `/:id/publish` | Опубликовать |
| POST | `/:id/proposals` | Подать заявку |
| POST | `/:id/assign` | Назначить исполнителя |
| POST | `/:id/status` | Изменить статус |

### 👷 Инженер `/api/v1/engineers`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/profile` | Профиль инженера |
| PUT | `/profile` | Обновить профиль |
| GET | `/summary` | Сводка проектов |
| GET | `/requests` | Доступные заявки |
| GET | `/requests/:id` | Детали заявки |
| POST | `/requests/:id/accept` | Принять заявку |
| GET | `/projects` | Мои проекты |
| GET | `/projects/:id` | Детали проекта |
| PATCH | `/projects/:id/progress` | Обновить прогресс |
| POST | `/projects/:id/submit` | Сдать проект |
| POST | `/projects/:id/comments` | Добавить комментарий |
| GET | `/specializations` | Справочник специализаций |

### 💬 Чат `/api/v1/chat`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/rooms` | Мои чаты |
| GET | `/order/:id/messages` | Сообщения заказа |
| POST | `/order/:id/messages` | Отправить сообщение |
| GET | `/project/:id/messages` | Сообщения проекта |
| POST | `/project/:id/messages` | Отправить сообщение |

### 💰 Финансы `/api/v1/finance`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/wallet` | Мой кошелёк |
| GET | `/transactions` | История транзакций |
| POST | `/deposit` | Пополнить |
| POST | `/withdraw` | Вывести |
| GET | `/summary` | Финансовая сводка |

### 🔔 Уведомления `/api/v1/notifications`

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/` | Список уведомлений |
| GET | `/unread-count` | Количество непрочитанных |
| POST | `/:id/read` | Отметить прочитанным |
| POST | `/read-all` | Отметить все прочитанными |
| DELETE | `/:id` | Удалить |

### 📁 Файлы `/api/v1/files`

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/upload` | Загрузить файл |
| POST | `/upload-multiple` | Загрузить несколько |
| POST | `/project/:id` | Загрузить в проект |
| DELETE | `/:id` | Удалить файл |

---

## 🏛️ Архитектура

```
src/
├── index.js              # Точка входа
├── config/
│   └── index.js          # Конфигурация
├── database/
│   ├── connection.js     # PostgreSQL
│   ├── redis.js          # Redis
│   ├── migrate.js        # Миграции
│   └── seed.js           # Демо-данные
├── middleware/
│   ├── auth.js           # JWT аутентификация
│   ├── errorHandler.js   # Обработка ошибок
│   ├── logger.js         # Логирование
│   └── rateLimiter.js    # Rate limiting
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── orders.js
│   ├── engineers.js
│   ├── projects.js
│   ├── chat.js
│   ├── finance.js
│   ├── notifications.js
│   └── files.js
└── socket/
    └── index.js          # Socket.IO handlers
```

---

## 🔌 Socket.IO Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_room` | `roomId` | Присоединиться к чату |
| `leave_room` | `roomId` | Покинуть чат |
| `chat_message` | `{ roomId, text }` | Отправить сообщение |
| `typing_start` | `roomId` | Начал печатать |
| `typing_stop` | `roomId` | Перестал печатать |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `Message` | Новое сообщение |
| `user_typing` | `{ userId, name }` | Пользователь печатает |
| `notification` | `Notification` | Уведомление |

---

## 🧪 Демо-аккаунты

После выполнения `npm run seed`:

| Роль | Телефон | Пароль |
|------|---------|--------|
| Заказчик | +77001111111 | demo123 |
| Исполнитель | +77002222222 | demo123 |
| Инженер | +77003333333 | demo123 |
| Админ | +77009999999 | demo123 |

---

## 📊 База данных

### Основные таблицы

- `users` – пользователи
- `user_profiles` – профили
- `specializations` – специализации
- `orders` – заказы
- `proposals` – заявки исполнителей
- `engineer_requests` – заявки на инженерные работы
- `engineer_projects` – проекты инженеров
- `project_files` – файлы проектов
- `project_comments` – комментарии
- `chat_messages` – сообщения
- `notifications` – уведомления
- `wallets` – кошельки
- `transactions` – транзакции

---

## 📜 Лицензия

© 2026 QAZGOST AI. Все права защищены.
