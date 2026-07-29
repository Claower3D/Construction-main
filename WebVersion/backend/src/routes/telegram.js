/**
 * Telegram Bot Integration Routes
 * API endpoints для Telegram-бота QazGost AI
 * 
 * Эти роуты доступны боту напрямую (без JWT-auth, с API key)
 */

const express = require('express');
const crypto = require('crypto');
const { query } = require('../database/connection');
const { asyncHandler, ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// ── API Key middleware для бота ──────────────────────────────────
function botApiKeyAuth(req, res, next) {
    const apiKey = req.headers['x-bot-api-key'] || req.query.apiKey;
    const expectedKey = process.env.BOT_API_KEY;

    if (!expectedKey) {
        // В dev-режиме пропускаем проверку
        if (process.env.NODE_ENV !== 'production') {
            return next();
        }
        return res.status(500).json({ success: false, error: 'BOT_API_KEY not configured' });
    }

    if (apiKey !== expectedKey) {
        return res.status(401).json({ success: false, error: 'Invalid bot API key' });
    }
    next();
}

router.use(botApiKeyAuth);

// ═══════════════════════════════════════════════════════════════
// 1. GET /telegram/user/:userId/balance — Баланс пользователя
// ═══════════════════════════════════════════════════════════════

router.get('/user/:userId/balance', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    // Запрос баланса из wallets
    const walletResult = await query(
        `SELECT currency, COALESCE(balance_cached, 0) as balance 
         FROM wallets 
         WHERE user_id = $1 AND status = 'active'`,
        [userId]
    );

    // Подписка пользователя
    const subResult = await query(
        `SELECT plan_code, status, expires_at 
         FROM subscriptions 
         WHERE user_id = $1 AND status = 'active' 
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
    );

    const wallets = walletResult.rows;
    const subscription = subResult.rows[0];

    // Основной баланс (KZT приоритет)
    const kztWallet = wallets.find(w => w.currency === 'KZT');
    const usdWallet = wallets.find(w => w.currency === 'USD');

    res.json({
        success: true,
        balance: kztWallet ? parseFloat(kztWallet.balance) : 0,
        balanceUsd: usdWallet ? parseFloat(usdWallet.balance) : 0,
        currency: '₸',
        tariff: subscription ? subscription.plan_code : 'FREE',
        wallets: wallets.map(w => ({
            currency: w.currency,
            balance: parseFloat(w.balance)
        }))
    });
}));

// ═══════════════════════════════════════════════════════════════
// 2. GET /telegram/user/:userId/orders — Заказы пользователя
// ═══════════════════════════════════════════════════════════════

router.get('/user/:userId/orders', asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    const ordersResult = await query(
        `SELECT id, title, description, status, budget_from, budget_to, 
                city, deadline, created_at
         FROM orders 
         WHERE customer_id = $1 OR assigned_executor_id = $1
         ORDER BY created_at DESC 
         LIMIT $2`,
        [userId, limit]
    );

    res.json({
        success: true,
        orders: ordersResult.rows.map(o => ({
            id: o.id,
            title: o.title || 'Заказ',
            status: o.status,
            total: o.budget_to || o.budget_from || 0,
            city: o.city,
            deadline: o.deadline,
            createdAt: o.created_at
        })),
        total: ordersResult.rows.length
    });
}));

// ═══════════════════════════════════════════════════════════════
// 3. POST /telegram/link/verify — Верификация кода привязки
// ═══════════════════════════════════════════════════════════════

router.post('/link/verify', asyncHandler(async (req, res) => {
    const { linkCode, telegramId, telegramUsername } = req.body;

    if (!linkCode || !telegramId) {
        throw ApiError.badRequest('linkCode и telegramId обязательны');
    }

    // Ищем pending link code в telegram_bindings
    const bindingResult = await query(
        `SELECT id, user_id, link_code, expires_at 
         FROM telegram_bindings 
         WHERE link_code = $1 AND status = 'pending'`,
        [linkCode.toUpperCase()]
    );

    if (bindingResult.rows.length === 0) {
        return res.json({ success: false, error: 'Код не найден или истёк' });
    }

    const binding = bindingResult.rows[0];

    // Проверяем срок действия
    if (new Date(binding.expires_at) < new Date()) {
        await query(`UPDATE telegram_bindings SET status = 'expired' WHERE id = $1`, [binding.id]);
        return res.json({ success: false, error: 'Код истёк. Запросите новый в профиле.' });
    }

    // Активируем привязку
    await query(
        `UPDATE telegram_bindings 
         SET telegram_id = $1, telegram_username = $2, status = 'active', linked_at = NOW()
         WHERE id = $3`,
        [telegramId.toString(), telegramUsername || '', binding.id]
    );

    // Сохраняем telegram_id в профиле пользователя
    await query(
        `UPDATE user_profiles 
         SET telegram_id = $1, telegram_username = $2 
         WHERE user_id = $3`,
        [telegramId.toString(), telegramUsername || '', binding.user_id]
    );

    res.json({
        success: true,
        userId: binding.user_id,
        message: 'Аккаунт успешно привязан'
    });
}));

// ═══════════════════════════════════════════════════════════════
// 4. POST /telegram/link/generate — Генерация нового кода (для UI)
// ═══════════════════════════════════════════════════════════════

router.post('/link/generate', asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        throw ApiError.badRequest('userId обязателен');
    }

    // Генерируем 8-значный код
    const linkCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 минут

    // Деактивируем старые pending коды
    await query(
        `UPDATE telegram_bindings SET status = 'expired' 
         WHERE user_id = $1 AND status = 'pending'`,
        [userId]
    );

    // Создаём новый код
    await query(
        `INSERT INTO telegram_bindings (user_id, link_code, status, expires_at)
         VALUES ($1, $2, 'pending', $3)`,
        [userId, linkCode, expiresAt]
    );

    res.json({
        success: true,
        linkCode,
        expiresAt: expiresAt.toISOString()
    });
}));

// ═══════════════════════════════════════════════════════════════
// 5. GET /telegram/user/by-telegram/:telegramId — Найти user по tg id
// ═══════════════════════════════════════════════════════════════

router.get('/user/by-telegram/:telegramId', asyncHandler(async (req, res) => {
    const { telegramId } = req.params;

    const result = await query(
        `SELECT tb.user_id, u.first_name, u.last_name, u.phone, u.role
         FROM telegram_bindings tb
         JOIN users u ON u.id = tb.user_id
         WHERE tb.telegram_id = $1 AND tb.status = 'active'
         LIMIT 1`,
        [telegramId.toString()]
    );

    if (result.rows.length === 0) {
        return res.json({ success: false, linked: false });
    }

    const user = result.rows[0];
    res.json({
        success: true,
        linked: true,
        userId: user.user_id,
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: user.role
    });
}));

// ═══════════════════════════════════════════════════════════════
// 6. POST /telegram/notify — Отправить уведомление (для backend)
// ═══════════════════════════════════════════════════════════════

router.post('/notify', asyncHandler(async (req, res) => {
    const { userId, type, data } = req.body;

    if (!userId || !type) {
        throw ApiError.badRequest('userId и type обязательны');
    }

    // Находим telegram_id пользователя
    const binding = await query(
        `SELECT telegram_id FROM telegram_bindings 
         WHERE user_id = $1 AND status = 'active' 
         LIMIT 1`,
        [userId]
    );

    if (binding.rows.length === 0) {
        return res.json({ success: false, error: 'Telegram не привязан' });
    }

    const telegramId = binding.rows[0].telegram_id;

    // Отправляем уведомление через Bot API напрямую
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return res.json({ success: false, error: 'TELEGRAM_BOT_TOKEN not configured' });
    }

    const message = _formatNotification(type, data);

    try {
        const fetch = require('node-fetch') || globalThis.fetch;
        const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await resp.json();
        res.json({ success: result.ok, telegramId });
    } catch (e) {
        console.error('[Telegram] Notification failed:', e.message);
        res.json({ success: false, error: e.message });
    }
}));

// ═══════════════════════════════════════════════════════════════
// 7. POST /telegram/estimate/save — Сохранить смету из бота
// ═══════════════════════════════════════════════════════════════

router.post('/estimate/save', asyncHandler(async (req, res) => {
    const { userId, description, category, result: estimateResult } = req.body;

    if (!userId || !description) {
        throw ApiError.badRequest('userId и description обязательны');
    }

    const estimateItems = estimateResult?.estimate_items || [];
    const estimateTotal = estimateResult?.estimate_total || 0;

    // Создаём заказ-черновик из сметы
    const orderResult = await query(
        `INSERT INTO orders (customer_id, title, description, category, estimated_price, status)
         VALUES ($1, $2, $3, $4, $5, 'draft')
         RETURNING id, order_number`,
        [
            userId,
            `Смета: ${description.substring(0, 100)}`,
            `Создано из Telegram Bot\n\n${description}`,
            category || 'renovation',
            estimateTotal
        ]
    );

    const orderId = orderResult.rows[0].id;

    // Сохраняем позиции сметы
    for (const item of estimateItems.slice(0, 50)) {
        await query(
            `INSERT INTO order_estimate_items (order_id, name, unit, quantity, unit_price, total_price, category)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                orderId,
                item.name || 'Позиция',
                item.unit || 'шт',
                item.quantity || 1,
                item.unit_price || item.total || 0,
                item.total || 0,
                item.category || ''
            ]
        );
    }

    res.json({
        success: true,
        orderId,
        orderNumber: orderResult.rows[0].order_number,
        message: 'Смета сохранена как черновик заказа'
    });
}));

// ═══════════════════════════════════════════════════════════════
// NOTIFICATION HELPER — Reusable by other routes
// ═══════════════════════════════════════════════════════════════

/**
 * Отправить Telegram-уведомление пользователю.
 * Можно вызывать из любого модуля: 
 *   const { sendTelegramNotification } = require('./telegram');
 *   await sendTelegramNotification(userId, 'status_change', { title, oldStatus, newStatus });
 */
async function sendTelegramNotification(userId, type, data = {}) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return { success: false, reason: 'no_token' };

    try {
        // Найти telegram_id
        const binding = await query(
            `SELECT telegram_id FROM telegram_bindings 
             WHERE user_id = $1 AND status = 'active' LIMIT 1`,
            [userId]
        );

        if (binding.rows.length === 0) {
            return { success: false, reason: 'not_linked' };
        }

        const telegramId = binding.rows[0].telegram_id;
        const message = _formatNotification(type, data);

        const resp = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramId,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const result = await resp.json();
        if (result.ok) {
            console.log(`[Telegram] ✅ Notification sent to ${telegramId}: ${type}`);
        }
        return { success: result.ok, telegramId };
    } catch (e) {
        console.error(`[Telegram] ❌ Notification failed for user ${userId}:`, e.message);
        return { success: false, error: e.message };
    }
}

// ── Notification formatter ──────────────────────────────────────
function _formatNotification(type, data = {}) {
    const fmt = (n) => n ? new Intl.NumberFormat('ru-KZ').format(n) : '';

    switch (type) {
        case 'new_order':
            return `🆕 *Новый заказ!*\n\n📋 ${data.title || ''}\n💰 ${fmt(data.amount)} ₸\n📍 ${data.city || ''}\n📅 ${data.deadline || ''}`;
        case 'status_change':
            return `🔄 *Статус заказа изменён*\n\n📋 ${data.title || ''}\n📌 ${data.oldStatus || ''} → *${data.newStatus || ''}*\n⏰ ${new Date().toLocaleString('ru-KZ')}`;
        case 'new_proposal':
            return `👷 *Новое предложение!*\n\n📋 ${data.orderTitle || ''}\n💰 Цена: *${fmt(data.price)} ₸*\n👤 ${data.executorName || 'Исполнитель'}`;
        case 'proposal_accepted':
            return `🎉 *Заявка принята!*\n\n📋 ${data.orderTitle || ''}\n💰 ${fmt(data.price)} ₸\n\nПерейдите в заказ для начала работы.`;
        case 'new_message':
            return `💬 *Новое сообщение*\n\nОт: ${data.sender || ''}\n📋 ${data.orderTitle || ''}\n> ${(data.message || '').substring(0, 200)}`;
        case 'payment_received':
            return `💰 *Оплата получена!*\n\nСумма: *${fmt(data.amount)} ₸*\n📋 ${data.orderTitle || ''}`;
        case 'payment_released':
            return `🎉 *Средства выведены!*\n\nСумма: *${fmt(data.amount)} ₸*\n💳 ${data.destination || ''}`;
        case 'order_completed':
            return `✅ *Заказ завершён!*\n\n📋 ${data.title || ''}\n💰 ${fmt(data.amount)} ₸\n\nОставьте отзыв на платформе.`;
        case 'estimate_saved':
            return `💾 *Смета сохранена*\n\n📋 ${data.description || ''}\n💰 ${fmt(data.total)} ₸\n📝 Черновик заказа создан.`;
        default:
            return `🔔 *Уведомление*\n\n${data.message || JSON.stringify(data)}`;
    }
}

// Экспортируем router + helper
module.exports = router;
module.exports.sendTelegramNotification = sendTelegramNotification;

