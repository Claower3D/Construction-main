# 💰 Финансовая Система v1.0 - План Внедрения

## Обзор

Реализовано финансовое ядро для QazGost AI с поддержкой:

- **Ledger-based учёт** — баланс = сумма проводок (источник истины)
- **Идемпотентность** — защита от двойных списаний
- **Провайдер-независимость** — подключение любой платёжки через единый интерфейс
- **Транзакционность** — атомарные операции с откатом при ошибках

---

## 📊 Модели данных

### Созданные файлы

| Файл | Описание |
|------|----------|
| `financeModels.js` | Модели: Wallet, LedgerEntry, Quote, Invoice, PaymentAttempt, Subscription, UsageCounter, TakeOrderLock |
| `financeService.js` | API: PricingAPI, WalletAPI, PaymentAPI, BusinessAPI, ReconcileService |

### Структура моделей

```
Wallet (Кошелёк)
├── id, userId, currency [KZT|USD], status, balanceCached

LedgerEntry (Проводка) — ИСТОЧНИК ИСТИНЫ
├── id, walletId, type, amount (±), currency, status
├── refType, refId, idempotencyKey (UNIQUE!)
└── Статусы: PENDING → POSTED → REVERSED

Quote (Расчёт стоимости)
├── id, userId, kind, amount, currency, breakdownJson, expiresAt

Invoice (Счёт)
├── id, userId, quoteId, amount, currency, status
└── Статусы: ISSUED → PAID | EXPIRED | CANCELED

PaymentAttempt (Попытка оплаты)
├── id, invoiceId, provider, providerPaymentId (UNIQUE!)
├── status, appliedAt
└── Статусы: CREATED → PROCESSING → SUCCEEDED | FAILED

Subscription (Подписка)
├── id, userId, planCode, status, renewAt
└── Статусы: ACTIVE → CANCELED | EXPIRED

UsageCounter (Счётчик использования)
├── userId, periodYYYYMM, engineeringCount

TakeOrderLock (Блокировка для гонок)
├── orderId, executorId, status [PENDING|APPLIED|REFUNDED]
```

---

## 💵 Правила монетизации

### Бесплатно ✅

- Расчёт объёмов по фото
- PDF по объёмам/расчётам

### Исполнитель: 3% комиссия

```javascript
Комиссия = round(Order.contractAmountKZT * 0.03)
// Источник contractAmountKZT:
//   1. budgetAmountKZT (если заказчик указал бюджет)
//   2. acceptedApplicationPriceKZT (если принят отклик)
//   3. иначе → "Взять заказ" заблокирован
```

### Заказчик: Подписка $20/мес

- **Engineering Pro**: $20/мес → 3 EngineeringRequest/месяц
- **Превышение лимита**: $10 за каждый дополнительный

---

## 🔄 Потоки оплаты

### 1. Исполнитель "Взять заказ"

```
[Кнопка "Взять заказ"]
        ↓
[POST /pricing/take-order-commission/quote]
  → Проверка: contractAmountKZT > 0?
  → Проверка: order.assignedExecutorId == null?
  → Расчёт: commission = round(amount * 0.03)
        ↓
[Хватает на балансе KZT?]
    ДА → WalletAPI.spend() → applyTakeOrder()
    НЕТ → Invoice → PaymentAttempt → Провайдер
           ↓ WEBHOOK
         applyTakeOrder() в транзакции:
           - Order.assignedExecutorId = executorId
           - Order.status = IN_PROGRESS
           - Создать Work
           - AuditLog
```

### 2. Подписка Engineering Pro

```
[Кнопка "Оформить подписку"]
        ↓
[POST /pricing/subscription/quote] 
  → $20 USD
        ↓
[Хватает на балансе USD?]
    ДА → WalletAPI.spend() → Subscription.ACTIVE
    НЕТ → Invoice → Провайдер → WEBHOOK → Subscription.ACTIVE
        ↓
[UsageCounter сброшен на 0]
```

### 3. Создание EngineeringRequest

```
[Запрос на инженерные расчёты]
        ↓
[Проверка: Subscription.ACTIVE?]
    НЕТ → return SUBSCRIPTION_REQUIRED
        ↓
[UsageCounter.engineeringCount < 3?]
    ДА → Создать request, ++count
    НЕТ → return LIMIT_EXCEEDED + quote $10
             ↓
          [Оплата $10] → Создать request, ++count
```

---

## 🛡️ Защитные механизмы

### Идемпотентность

```javascript
// Уникальные ключи предотвращают дубли:
LedgerEntry.idempotencyKey = `${type}:${refType}:${refId}:${userId}`
PaymentAttempt.providerPaymentId = UNIQUE от провайдера

// Webhook обработчик:
if (existingAttempt.isSucceeded()) {
    return { success: true, alreadyProcessed: true };
}
```

### Защита от гонок (два исполнителя одновременно)

```javascript
// TakeOrderLock создаётся ДО оплаты
// При успешной оплате:
if (TakeOrderLock.hasAppliedLock(orderId)) {
    // Второму → CREDIT в кошелёк
    WalletAPI.credit(executorId, amount, 'CREDIT', ...)
}
```

### Авто-возврат при ошибках

```javascript
// Если applyTakeOrder() вернул ошибку после оплаты:
if (!applyResult.success) {
    WalletAPI.credit(
        executorId, amount, currency,
        LedgerEntryType.CREDIT,
        'Order', orderId,
        `Возврат комиссии: ${applyResult.error}`
    );
}
```

---

## 🔧 API Reference

### PricingAPI

```javascript
FinanceService.Pricing.getTakeOrderCommissionQuote(orderId)
FinanceService.Pricing.getSubscriptionQuote('ENGINEERING_PRO')
FinanceService.Pricing.getEngineeringExtraQuote()
```

### WalletAPI

```javascript
FinanceService.Wallet.getMyWallets()
  → { wallets: [{ id, currency, balance, status }, ...] }

FinanceService.Wallet.getWalletLedger(walletId)
  → { balance, entries: [...] }

FinanceService.Wallet.spend(userId, amount, currency, type, refType, refId, description)
FinanceService.Wallet.credit(userId, amount, currency, type, refType, refId, description)
```

### PaymentAPI

```javascript
FinanceService.Payment.createInvoice(quoteId)
FinanceService.Payment.initPayment(invoiceId, provider)
FinanceService.Payment.handleWebhook(providerPaymentId, status, rawJson)
FinanceService.Payment.simulatePaymentSuccess(attemptId) // для тестов
```

### BusinessAPI

```javascript
FinanceService.Business.takeOrder(orderId)
  → { success, data: { orderId, commissionPaid, paidFromBalance } }
  → { success, requiresPayment: true, data: { paymentUrl, ... } }

FinanceService.Business.createEngineeringRequest(requestData)
  → { success } или { requiresSubscription } или { requiresPayment }

FinanceService.Business.subscribe('ENGINEERING_PRO')
FinanceService.Business.getSubscriptionStatus()
  → { hasSubscription, subscription, usage: { engineeringCount, limit, remaining } }
```

### ReconcileService

```javascript
FinanceService.Reconcile.reconcileSucceededPayments()
FinanceService.Reconcile.getPaymentsForReview()
```

---

## ✅ Контрольный чек-лист

| Правило | Реализовано |
|---------|-------------|
| Нельзя списать дважды по одному платежу | ✅ idempotencyKey |
| Нельзя "взять заказ" без contractAmountKZT | ✅ Проверка в quote |
| Нельзя "взять заказ" если уже закреплён | ✅ TakeOrderLock + проверка |
| При гонке: один берёт, второй получает credit | ✅ Авто-credit |
| Подписка $20 = ровно 3 запроса/мес | ✅ UsageCounter |
| 4+ запросы только после оплаты $10 | ✅ LIMIT_EXCEEDED paywall |
| Бесплатные модули не затронуты | ✅ Отдельная логика |
| Всё пишется в AuditLog | ✅ По всем действиям |

---

## 🚀 Следующие шаги (P1)

1. **UI для кошелька** — баланс, история, пополнение
2. **Интеграция с Kaspi/PayBox** — реальные webhooks
3. **Эскроу** — заморозка денег до приёмки работы
4. **Выплаты исполнителям** — вывод на карту
5. **Автопродление подписки** — recurring через провайдера
6. **Админ-панель** — мониторинг платежей, reconcile

---

## 📁 Структура хранения (localStorage)

```
finance_wallets        → Wallet[]
finance_ledger         → LedgerEntry[]
finance_quotes         → Quote[]
finance_invoices       → Invoice[]
finance_payment_attempts → PaymentAttempt[]
finance_subscriptions  → Subscription[]
finance_usage          → UsageCounter[]
finance_take_order_locks → TakeOrderLock[]
```

---

## 🔌 Подключение провайдера (шаблон)

```javascript
// Добавить в PaymentProvider enum:
const PaymentProvider = {
    KASPI: 'KASPI',
    PAYBOX: 'PAYBOX',
    // ...
};

// Реализовать адаптер:
const KaspiAdapter = {
    createPayment(amount, currency, callbackUrl) {
        // Вызов Kaspi API
        return { paymentUrl, providerPaymentId };
    },
    
    parseWebhook(rawBody) {
        // Парсинг webhook от Kaspi
        return { providerPaymentId, status, rawJson };
    }
};

// Использовать в PaymentAPI.initPayment():
if (provider === PaymentProvider.KASPI) {
    const { paymentUrl } = await KaspiAdapter.createPayment(...);
}
```

---

*Документ создан: 2026-01-24*
*Версия: 1.0*
