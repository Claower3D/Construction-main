/**
 * Stripe Payment Service
 * Интеграция с Stripe Checkout для приёма платежей в USD
 * 
 * Flow:
 * 1. Клиент нажимает "Оплатить картой" → сервер создаёт Stripe Checkout Session
 * 2. Клиент перенаправляется на hosted страницу Stripe
 * 3. После оплаты Stripe шлёт webhook → сервер зачисляет средства
 * 4. Клиент возвращается на success_url → фронтенд обновляет баланс
 * 
 * Документация: https://docs.stripe.com/checkout/quickstart
 */

const config = require('../config');

// Инициализация Stripe SDK
let stripe = null;
const stripeConfig = config.payments?.stripe;

if (stripeConfig?.secretKey && !stripeConfig.secretKey.includes('REPLACE')) {
    stripe = require('stripe')(stripeConfig.secretKey);
    console.log('💳 Stripe: ✅ configured');
} else {
    console.warn('⚠️  Stripe: не настроен — карточные платежи работают в demo-режиме');
}

/**
 * Проверка доступности Stripe
 */
function isConfigured() {
    return stripe !== null;
}

/**
 * Получить publishable key для фронтенда
 */
function getPublishableKey() {
    return stripeConfig?.publishableKey || null;
}

/**
 * Создать Stripe Checkout Session
 * @param {Object} params
 * @param {number} params.amount - Сумма в USD
 * @param {string} params.userId - ID пользователя
 * @param {string} params.type - 'topup' | 'tariff'
 * @param {string} [params.tariffId] - ID тарифа
 * @param {string} [params.description] - Описание
 * @returns {Object} { success, sessionId, sessionUrl, mode }
 */
async function createCheckoutSession({ amount, userId, type = 'topup', tariffId = null, description = null }) {
    if (!amount || amount < 1) {
        return { success: false, error: 'Минимальная сумма: $1' };
    }
    if (amount > 25000) {
        return { success: false, error: 'Лимит транзакции: $25,000' };
    }

    const payDesc = description 
        || (type === 'tariff' ? `QazGost AI — Тариф «${tariffId}»` : `QazGost AI — Пополнение $${amount}`);

    // Demo mode
    if (!stripe) {
        console.log(`🧪 Stripe demo: $${amount} for user ${userId}`);
        return {
            success: true,
            mode: 'demo',
            amount,
            userId,
            type,
            tariffId,
            message: 'Stripe не настроен — демо-режим'
        };
    }

    // Production: создаём Stripe Checkout Session
    try {
        const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500';

        const sessionParams = {
            payment_method_types: ['card'],
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: type === 'tariff'
                            ? `QazGost AI — Тариф ${tariffId || ''}`
                            : 'QazGost AI — Пополнение кошелька',
                        description: payDesc,
                        images: [] // можно добавить лого
                    },
                    unit_amount: Math.round(amount * 100) // Stripe принимает в центах
                },
                quantity: 1
            }],
            metadata: {
                userId: userId || 'anonymous',
                type,
                tariffId: tariffId || '',
                amount: amount.toString(),
                source: 'qazgost_ai'
            },
            success_url: `${frontendUrl}/index.html?payment=success&session_id={CHECKOUT_SESSION_ID}&amount=${amount}&type=${type}`,
            cancel_url: `${frontendUrl}/index.html?payment=cancelled`,
            // Автоматический сбор email
            customer_creation: 'if_required',
            // Locale
            locale: 'ru'
        };

        const session = await stripe.checkout.sessions.create(sessionParams);

        console.log(`✅ Stripe Checkout created: ${session.id}, amount: $${amount}`);

        return {
            success: true,
            mode: 'stripe',
            sessionId: session.id,
            sessionUrl: session.url,
            amount,
            userId,
            type,
            tariffId
        };
    } catch (error) {
        console.error('❌ Stripe Checkout error:', error.message);
        return {
            success: false,
            error: `Ошибка Stripe: ${error.message}`
        };
    }
}

/**
 * Обработать Stripe Webhook
 * Вызывается из endpoint без auth
 * @param {Buffer} rawBody - сырое тело запроса
 * @param {string} signature - заголовок stripe-signature
 * @returns {Object} { success, event, payment }
 */
function constructWebhookEvent(rawBody, signature) {
    if (!stripe) {
        return { success: false, error: 'Stripe не настроен' };
    }

    const webhookSecret = stripeConfig?.webhookSecret;

    // Если webhook secret не настроен — принимаем без верификации (dev mode)
    if (!webhookSecret || webhookSecret.includes('REPLACE')) {
        console.warn('⚠️  Stripe webhook secret не настроен — событие принято без верификации');
        try {
            const event = JSON.parse(rawBody.toString());
            return { success: true, event, verified: false };
        } catch (e) {
            return { success: false, error: 'Invalid JSON' };
        }
    }

    // Production: верификация подписи
    try {
        const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
        return { success: true, event, verified: true };
    } catch (error) {
        console.error('❌ Stripe webhook signature verification failed:', error.message);
        return { success: false, error: 'Invalid signature' };
    }
}

/**
 * Извлечь данные платежа из Stripe Checkout Session event
 * @param {Object} event - Stripe event (checkout.session.completed)
 * @returns {Object|null} { userId, amount, type, tariffId, sessionId, paymentIntent }
 */
function extractPaymentFromEvent(event) {
    if (event.type !== 'checkout.session.completed') {
        return null;
    }

    const session = event.data.object;
    const metadata = session.metadata || {};

    return {
        userId: metadata.userId || 'anonymous',
        amount: parseFloat(metadata.amount) || (session.amount_total / 100),
        type: metadata.type || 'topup',
        tariffId: metadata.tariffId || null,
        sessionId: session.id,
        paymentIntent: session.payment_intent,
        customerEmail: session.customer_details?.email || null,
        currency: session.currency || 'usd',
        status: session.payment_status // 'paid'
    };
}

/**
 * Проверить статус Checkout Session
 * @param {string} sessionId
 * @returns {Object} { success, session }
 */
async function getSessionStatus(sessionId) {
    if (!stripe) {
        return { success: false, error: 'Stripe не настроен' };
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        return {
            success: true,
            session: {
                id: session.id,
                status: session.payment_status,
                amount: session.amount_total / 100,
                currency: session.currency,
                customerEmail: session.customer_details?.email,
                metadata: session.metadata
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

module.exports = {
    isConfigured,
    getPublishableKey,
    createCheckoutSession,
    constructWebhookEvent,
    extractPaymentFromEvent,
    getSessionStatus
};
