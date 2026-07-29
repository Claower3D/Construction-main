/**
 * Finance Routes
 */

const express = require('express');
const { query, transaction } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireRole } = require('../middleware/auth');

// Telegram push
let sendTelegramNotification;
try {
    sendTelegramNotification = require('./telegram').sendTelegramNotification;
} catch (e) {
    sendTelegramNotification = async () => ({});
}

const router = express.Router();

router.use(authenticate);

/**
 * GET /finance/wallet
 * Get user's wallet
 */
router.get('/wallet', asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT * FROM wallets WHERE user_id = $1`,
        [req.user.id]
    );

    if (result.rows.length === 0) {
        // Create wallet if doesn't exist
        await query(
            `INSERT INTO wallets (user_id) VALUES ($1)`,
            [req.user.id]
        );
        return res.json({
            success: true,
            wallet: {
                balanceKZT: 0,
                balanceUSD: 0,
                frozenKZT: 0,
                frozenUSD: 0
            }
        });
    }

    const wallet = result.rows[0];

    res.json({
        success: true,
        wallet: {
            id: wallet.id,
            balanceKZT: parseInt(wallet.balance_kzt) || 0,
            balanceUSD: parseInt(wallet.balance_usd) || 0,
            frozenKZT: parseInt(wallet.frozen_kzt) || 0,
            frozenUSD: parseInt(wallet.frozen_usd) || 0,
            availableKZT: (parseInt(wallet.balance_kzt) || 0) - (parseInt(wallet.frozen_kzt) || 0),
            availableUSD: (parseInt(wallet.balance_usd) || 0) - (parseInt(wallet.frozen_usd) || 0)
        }
    });
}));

/**
 * GET /finance/transactions
 * Get user's transactions
 */
router.get('/transactions', asyncHandler(async (req, res) => {
    const { type, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get wallet
    const walletResult = await query(
        `SELECT id FROM wallets WHERE user_id = $1`,
        [req.user.id]
    );

    if (walletResult.rows.length === 0) {
        return res.json({ success: true, transactions: [], pagination: { total: 0 } });
    }

    const walletId = walletResult.rows[0].id;

    let whereClause = `WHERE wallet_id = $1`;
    const params = [walletId];
    let paramIndex = 2;

    if (type) {
        whereClause += ` AND type = $${paramIndex}`;
        params.push(type);
        paramIndex++;
    }

    if (status) {
        whereClause += ` AND status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    params.push(limit, offset);

    const result = await query(
        `SELECT * FROM transactions ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
    );

    const countResult = await query(
        `SELECT COUNT(*) FROM transactions ${whereClause}`,
        params.slice(0, -2)
    );

    res.json({
        success: true,
        transactions: result.rows.map(t => ({
            id: t.id,
            type: t.type,
            amount: parseInt(t.amount),
            currency: t.currency,
            status: t.status,
            description: t.description,
            referenceType: t.reference_type,
            metadata: t.metadata,
            createdAt: t.created_at,
            completedAt: t.completed_at
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].count)
        }
    });
}));

/**
 * POST /finance/deposit
 * Initiate deposit (placeholder for payment gateway integration)
 */
router.post('/deposit', asyncHandler(async (req, res) => {
    const { amount, currency = 'KZT', method = 'card' } = req.body;

    if (!amount || amount <= 0) {
        throw ApiError.badRequest('Укажите сумму');
    }

    // Get or create wallet
    let walletResult = await query(`SELECT id FROM wallets WHERE user_id = $1`, [req.user.id]);

    if (walletResult.rows.length === 0) {
        walletResult = await query(
            `INSERT INTO wallets (user_id) VALUES ($1) RETURNING id`,
            [req.user.id]
        );
    }

    const walletId = walletResult.rows[0].id;

    // Create pending transaction
    const result = await query(
        `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, metadata)
         VALUES ($1, 'deposit', $2, $3, 'pending', 'Пополнение счёта', $4)
         RETURNING id`,
        [walletId, amount, currency, JSON.stringify({ method })]
    );

    // In production, here we would integrate with payment gateway (PayBox, etc.)
    // For demo, we'll return a mock payment URL

    res.json({
        success: true,
        transactionId: result.rows[0].id,
        paymentUrl: `/payment/demo?tx=${result.rows[0].id}&amount=${amount}`,
        message: 'Для завершения пополнения перейдите по ссылке'
    });
}));

/**
 * POST /finance/deposit/confirm
 * Confirm deposit (called by payment gateway webhook or demo)
 */
router.post('/deposit/confirm', asyncHandler(async (req, res) => {
    const { transactionId } = req.body;

    if (!transactionId) {
        throw ApiError.badRequest('Укажите transactionId');
    }

    await transaction(async (client) => {
        // Get transaction
        const txResult = await client.query(
            `SELECT t.*, w.user_id FROM transactions t
             JOIN wallets w ON t.wallet_id = w.id
             WHERE t.id = $1 AND t.status = 'pending' FOR UPDATE`,
            [transactionId]
        );

        if (txResult.rows.length === 0) {
            throw ApiError.notFound('Транзакция не найдена');
        }

        const tx = txResult.rows[0];

        // Update transaction
        await client.query(
            `UPDATE transactions SET status = 'completed', completed_at = NOW() WHERE id = $1`,
            [transactionId]
        );

        // Update wallet balance
        const balanceField = tx.currency === 'USD' ? 'balance_usd' : 'balance_kzt';
        await client.query(
            `UPDATE wallets SET ${balanceField} = ${balanceField} + $1 WHERE id = $2`,
            [tx.amount, tx.wallet_id]
        );
    });

    res.json({ success: true, message: 'Пополнение подтверждено' });

    // 🔔 Telegram push: пополнение подтверждено
    const confirmedTx = (await query(`SELECT t.*, w.user_id FROM transactions t JOIN wallets w ON t.wallet_id = w.id WHERE t.id = $1`, [transactionId])).rows[0];
    if (confirmedTx) {
        sendTelegramNotification(confirmedTx.user_id, 'payment_received', {
            amount: confirmedTx.amount,
            orderTitle: 'Пополнение кошелька'
        }).catch(() => {});
    }
}));

/**
 * POST /finance/withdraw
 * Request withdrawal
 */
router.post('/withdraw', asyncHandler(async (req, res) => {
    const { amount, currency = 'KZT', bankDetails } = req.body;

    if (!amount || amount <= 0) {
        throw ApiError.badRequest('Укажите сумму');
    }

    await transaction(async (client) => {
        // Get wallet
        const walletResult = await client.query(
            `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
            [req.user.id]
        );

        if (walletResult.rows.length === 0) {
            throw ApiError.badRequest('Кошелёк не найден');
        }

        const wallet = walletResult.rows[0];
        const balanceField = currency === 'USD' ? 'balance_usd' : 'balance_kzt';
        const balance = parseInt(wallet[balanceField]) || 0;
        const frozenField = currency === 'USD' ? 'frozen_usd' : 'frozen_kzt';
        const frozen = parseInt(wallet[frozenField]) || 0;
        const available = balance - frozen;

        if (amount > available) {
            throw ApiError.badRequest(`Недостаточно средств. Доступно: ${available} ${currency}`);
        }

        // Create transaction
        await client.query(
            `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, metadata)
             VALUES ($1, 'withdrawal', $2, $3, 'pending', 'Вывод средств', $4)`,
            [wallet.id, amount, currency, JSON.stringify({ bankDetails })]
        );

        // Freeze amount
        await client.query(
            `UPDATE wallets SET ${frozenField} = ${frozenField} + $1 WHERE id = $2`,
            [amount, wallet.id]
        );
    });

    res.json({ success: true, message: 'Заявка на вывод создана' });
}));

/**
 * GET /finance/summary
 * Get financial summary
 */
router.get('/summary', asyncHandler(async (req, res) => {
    const walletResult = await query(`SELECT * FROM wallets WHERE user_id = $1`, [req.user.id]);

    if (walletResult.rows.length === 0) {
        return res.json({
            success: true,
            summary: {
                balance: 0,
                frozen: 0,
                totalDeposits: 0,
                totalWithdrawals: 0,
                totalEarned: 0,
                totalSpent: 0
            }
        });
    }

    const wallet = walletResult.rows[0];

    // Get transaction stats
    const statsResult = await query(
        `SELECT 
            SUM(amount) FILTER (WHERE type = 'deposit' AND status = 'completed') as deposits,
            SUM(amount) FILTER (WHERE type = 'withdrawal' AND status = 'completed') as withdrawals,
            SUM(amount) FILTER (WHERE type = 'payment' AND status = 'completed') as spent,
            SUM(amount) FILTER (WHERE type = 'commission' AND status = 'completed') as earned
         FROM transactions WHERE wallet_id = $1`,
        [wallet.id]
    );

    const stats = statsResult.rows[0];

    res.json({
        success: true,
        summary: {
            balance: parseInt(wallet.balance_kzt) || 0,
            frozen: parseInt(wallet.frozen_kzt) || 0,
            totalDeposits: parseInt(stats.deposits) || 0,
            totalWithdrawals: parseInt(stats.withdrawals) || 0,
            totalSpent: parseInt(stats.spent) || 0,
            totalEarned: parseInt(stats.earned) || 0
        }
    });
}));

// ================================================================
// 1.1 ESCROW ENDPOINTS
// ================================================================

/**
 * POST /finance/escrow
 * Create escrow for an order — freezes funds from customer wallet
 */
router.post('/escrow', asyncHandler(async (req, res) => {
    const { orderId, amount, currency = 'KZT', milestones } = req.body;

    if (!orderId || !amount || amount <= 0) {
        throw ApiError.badRequest('Укажите orderId и сумму');
    }

    let escrow;

    await transaction(async (client) => {
        // Check order exists (mock check — in prod we'd query orders table)
        // Get customer wallet
        const walletResult = await client.query(
            `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`,
            [req.user.id]
        );

        if (walletResult.rows.length === 0) {
            throw ApiError.badRequest('Кошелёк не найден');
        }

        const wallet = walletResult.rows[0];
        const balanceField = currency === 'USD' ? 'balance_usd' : 'balance_kzt';
        const frozenField = currency === 'USD' ? 'frozen_usd' : 'frozen_kzt';
        const available = (parseInt(wallet[balanceField]) || 0) - (parseInt(wallet[frozenField]) || 0);

        if (amount > available) {
            throw ApiError.badRequest(`Недостаточно средств. Доступно: ${available} ${currency}`);
        }

        // Create escrow record
        const escrowResult = await client.query(
            `INSERT INTO escrows (order_id, customer_id, amount, currency, status, created_at)
             VALUES ($1, $2, $3, $4, 'funded', NOW())
             RETURNING *`,
            [orderId, req.user.id, amount, currency]
        );

        escrow = escrowResult.rows[0];

        // Freeze funds
        await client.query(
            `UPDATE wallets SET ${frozenField} = ${frozenField} + $1 WHERE id = $2`,
            [amount, wallet.id]
        );

        // Create escrow transaction
        await client.query(
            `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, reference_type, reference_id, metadata)
             VALUES ($1, 'escrow_freeze', $2, $3, 'completed', 'Резервирование средств (Escrow)', 'order', $4, $5)`,
            [wallet.id, amount, currency, orderId, JSON.stringify({ escrowId: escrow.id })]
        );

        // Auto-create milestones if provided
        if (milestones && Array.isArray(milestones) && milestones.length > 0) {
            for (let i = 0; i < milestones.length; i++) {
                const m = milestones[i];
                await client.query(
                    `INSERT INTO escrow_milestones (escrow_id, title, amount, sequence, status, deadline)
                     VALUES ($1, $2, $3, $4, 'pending', $5)`,
                    [escrow.id, m.title, m.amount, i + 1, m.deadline || null]
                );
            }
        }
    });

    res.status(201).json({
        success: true,
        escrow: {
            id: escrow.id,
            orderId: escrow.order_id,
            amount: parseInt(escrow.amount),
            currency: escrow.currency,
            status: escrow.status,
            createdAt: escrow.created_at
        },
        message: 'Escrow создан, средства зарезервированы'
    });
}));

/**
 * GET /finance/escrow/:orderId
 * Get escrow details for an order
 */
router.get('/escrow/:orderId', asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const escrowResult = await query(
        `SELECT * FROM escrows WHERE order_id = $1 AND (customer_id = $2 OR contractor_id = $2)
         ORDER BY created_at DESC LIMIT 1`,
        [orderId, req.user.id]
    );

    if (escrowResult.rows.length === 0) {
        throw ApiError.notFound('Escrow не найден');
    }

    const esc = escrowResult.rows[0];

    // Get milestones
    const milestonesResult = await query(
        `SELECT * FROM escrow_milestones WHERE escrow_id = $1 ORDER BY sequence`,
        [esc.id]
    );

    res.json({
        success: true,
        escrow: {
            id: esc.id,
            orderId: esc.order_id,
            customerId: esc.customer_id,
            contractorId: esc.contractor_id,
            amount: parseInt(esc.amount),
            releasedAmount: parseInt(esc.released_amount) || 0,
            currency: esc.currency,
            status: esc.status,
            createdAt: esc.created_at
        },
        milestones: milestonesResult.rows.map(m => ({
            id: m.id,
            title: m.title,
            amount: parseInt(m.amount),
            sequence: m.sequence,
            status: m.status,
            deadline: m.deadline,
            completedAt: m.completed_at,
            releasedAt: m.released_at
        }))
    });
}));

/**
 * POST /finance/escrow/:escrowId/release
 * Release full escrow to contractor (or partial amount)
 */
router.post('/escrow/:escrowId/release', asyncHandler(async (req, res) => {
    const { escrowId } = req.params;
    const { amount: releaseAmount } = req.body;

    await transaction(async (client) => {
        // Get escrow
        const escrowResult = await client.query(
            `SELECT * FROM escrows WHERE id = $1 AND customer_id = $2 AND status = 'funded' FOR UPDATE`,
            [escrowId, req.user.id]
        );

        if (escrowResult.rows.length === 0) {
            throw ApiError.notFound('Escrow не найден или уже закрыт');
        }

        const esc = escrowResult.rows[0];
        const releasable = parseInt(esc.amount) - (parseInt(esc.released_amount) || 0);
        const toRelease = releaseAmount ? Math.min(releaseAmount, releasable) : releasable;

        if (toRelease <= 0) {
            throw ApiError.badRequest('Нет средств для выплаты');
        }

        // Commission 3%
        const commission = Math.round(toRelease * 0.03);
        const netAmount = toRelease - commission;

        // Get customer wallet
        const custWallet = await client.query(
            `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`, [esc.customer_id]
        );
        const frozenField = esc.currency === 'USD' ? 'frozen_usd' : 'frozen_kzt';

        // Unfreeze from customer
        await client.query(
            `UPDATE wallets SET ${frozenField} = GREATEST(${frozenField} - $1, 0),
             balance_kzt = GREATEST(balance_kzt - $1, 0)
             WHERE id = $2`,
            [toRelease, custWallet.rows[0].id]
        );

        // Credit contractor
        if (esc.contractor_id) {
            let contrWallet = await client.query(
                `SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE`, [esc.contractor_id]
            );
            if (contrWallet.rows.length === 0) {
                contrWallet = await client.query(
                    `INSERT INTO wallets (user_id) VALUES ($1) RETURNING id`, [esc.contractor_id]
                );
            }
            const balField = esc.currency === 'USD' ? 'balance_usd' : 'balance_kzt';
            await client.query(
                `UPDATE wallets SET ${balField} = ${balField} + $1 WHERE id = $2`,
                [netAmount, contrWallet.rows[0].id]
            );

            // Contractor payout transaction
            await client.query(
                `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, reference_type, reference_id)
                 VALUES ($1, 'escrow_release', $2, $3, 'completed', 'Выплата по Escrow (минус 3% комиссия)', 'escrow', $4)`,
                [contrWallet.rows[0].id, netAmount, esc.currency, escrowId]
            );
        }

        // Commission transaction (platform earnings)
        await client.query(
            `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, reference_type, reference_id)
             VALUES ($1, 'commission', $2, $3, 'completed', 'Комиссия платформы 3%', 'escrow', $4)`,
            [custWallet.rows[0].id, commission, esc.currency, escrowId]
        );

        // Update escrow
        const newReleased = (parseInt(esc.released_amount) || 0) + toRelease;
        const newStatus = newReleased >= parseInt(esc.amount) ? 'released' : 'funded';
        await client.query(
            `UPDATE escrows SET released_amount = $1, status = $2, updated_at = NOW() WHERE id = $3`,
            [newReleased, newStatus, escrowId]
        );
    });

    res.json({ success: true, message: 'Средства выплачены подрядчику' });
}));

/**
 * POST /finance/escrow/:escrowId/refund
 * Refund escrow to customer (dispute resolution)
 */
router.post('/escrow/:escrowId/refund', asyncHandler(async (req, res) => {
    const { escrowId } = req.params;
    const { amount: refundAmount, reason } = req.body;

    await transaction(async (client) => {
        const escrowResult = await client.query(
            `SELECT * FROM escrows WHERE id = $1 AND status IN ('funded', 'disputed') FOR UPDATE`,
            [escrowId]
        );

        if (escrowResult.rows.length === 0) {
            throw ApiError.notFound('Escrow не найден');
        }

        const esc = escrowResult.rows[0];
        const refundable = parseInt(esc.amount) - (parseInt(esc.released_amount) || 0);
        const toRefund = refundAmount ? Math.min(refundAmount, refundable) : refundable;

        if (toRefund <= 0) {
            throw ApiError.badRequest('Нет средств для возврата');
        }

        // Get customer wallet
        const custWallet = await client.query(
            `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`, [esc.customer_id]
        );
        const frozenField = esc.currency === 'USD' ? 'frozen_usd' : 'frozen_kzt';

        // Unfreeze and keep in balance
        await client.query(
            `UPDATE wallets SET ${frozenField} = GREATEST(${frozenField} - $1, 0) WHERE id = $2`,
            [toRefund, custWallet.rows[0].id]
        );

        // Refund transaction
        await client.query(
            `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, reference_type, reference_id, metadata)
             VALUES ($1, 'escrow_refund', $2, $3, 'completed', 'Возврат средств из Escrow', 'escrow', $4, $5)`,
            [custWallet.rows[0].id, toRefund, esc.currency, escrowId, JSON.stringify({ reason: reason || '' })]
        );

        // Update escrow
        const newStatus = toRefund >= refundable ? 'refunded' : 'funded';
        await client.query(
            `UPDATE escrows SET status = $1, updated_at = NOW() WHERE id = $2`,
            [newStatus, escrowId]
        );
    });

    res.json({ success: true, message: 'Средства возвращены заказчику' });
}));

// ================================================================
// 1.2 MILESTONE PAYMENTS API
// ================================================================

/**
 * POST /finance/escrow/:escrowId/milestones
 * Add milestones to an existing escrow
 */
router.post('/escrow/:escrowId/milestones', asyncHandler(async (req, res) => {
    const { escrowId } = req.params;
    const { milestones } = req.body;

    if (!milestones || !Array.isArray(milestones) || milestones.length === 0) {
        throw ApiError.badRequest('Укажите массив этапов');
    }

    // Verify escrow belongs to user
    const escrowResult = await query(
        `SELECT * FROM escrows WHERE id = $1 AND customer_id = $2`, [escrowId, req.user.id]
    );
    if (escrowResult.rows.length === 0) {
        throw ApiError.notFound('Escrow не найден');
    }

    const esc = escrowResult.rows[0];
    const totalMilestoneAmount = milestones.reduce((s, m) => s + (m.amount || 0), 0);

    if (totalMilestoneAmount > parseInt(esc.amount)) {
        throw ApiError.badRequest('Сумма этапов превышает сумму Escrow');
    }

    // Get current max sequence
    const seqResult = await query(
        `SELECT COALESCE(MAX(sequence), 0) as max_seq FROM escrow_milestones WHERE escrow_id = $1`, [escrowId]
    );
    let seq = seqResult.rows[0].max_seq;

    const created = [];
    for (const m of milestones) {
        seq++;
        const result = await query(
            `INSERT INTO escrow_milestones (escrow_id, title, amount, sequence, status, deadline, description)
             VALUES ($1, $2, $3, $4, 'pending', $5, $6)
             RETURNING *`,
            [escrowId, m.title, m.amount, seq, m.deadline || null, m.description || null]
        );
        created.push(result.rows[0]);
    }

    res.status(201).json({
        success: true,
        milestones: created.map(m => ({
            id: m.id,
            title: m.title,
            amount: parseInt(m.amount),
            sequence: m.sequence,
            status: m.status,
            deadline: m.deadline,
            description: m.description
        })),
        message: `${created.length} этап(ов) добавлено`
    });
}));

/**
 * GET /finance/milestones/:escrowId
 * Get milestones for escrow
 */
router.get('/milestones/:escrowId', asyncHandler(async (req, res) => {
    const { escrowId } = req.params;

    const result = await query(
        `SELECT em.*, e.amount as escrow_amount, e.released_amount, e.currency
         FROM escrow_milestones em
         JOIN escrows e ON em.escrow_id = e.id
         WHERE em.escrow_id = $1
         ORDER BY em.sequence`,
        [escrowId]
    );

    const totalPaid = result.rows
        .filter(m => m.status === 'released')
        .reduce((s, m) => s + parseInt(m.amount), 0);

    res.json({
        success: true,
        milestones: result.rows.map(m => ({
            id: m.id,
            title: m.title,
            amount: parseInt(m.amount),
            sequence: m.sequence,
            status: m.status,
            deadline: m.deadline,
            description: m.description,
            completedAt: m.completed_at,
            releasedAt: m.released_at
        })),
        summary: {
            totalAmount: parseInt(result.rows[0]?.escrow_amount) || 0,
            totalPaid,
            remaining: (parseInt(result.rows[0]?.escrow_amount) || 0) - totalPaid,
            currency: result.rows[0]?.currency || 'KZT'
        }
    });
}));

/**
 * POST /finance/milestones/:milestoneId/complete
 * Mark milestone as completed by contractor
 */
router.post('/milestones/:milestoneId/complete', asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;
    const { evidence } = req.body; // optional proof of completion

    const result = await query(
        `UPDATE escrow_milestones
         SET status = 'completed', completed_at = NOW(), metadata = $2
         WHERE id = $1 AND status = 'pending'
         RETURNING *`,
        [milestoneId, JSON.stringify({ evidence: evidence || [] })]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Этап не найден или уже завершён');
    }

    res.json({
        success: true,
        milestone: {
            id: result.rows[0].id,
            title: result.rows[0].title,
            status: 'completed',
            completedAt: result.rows[0].completed_at
        },
        message: 'Этап отмечен как выполненный, ожидает подтверждения заказчика'
    });
}));

/**
 * POST /finance/milestones/:milestoneId/approve
 * Customer approves milestone → auto-release payment
 */
router.post('/milestones/:milestoneId/approve', asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;

    await transaction(async (client) => {
        // Get milestone with escrow
        const mResult = await client.query(
            `SELECT em.*, e.id as escrow_id, e.customer_id, e.contractor_id,
                    e.amount as escrow_amount, e.released_amount, e.currency
             FROM escrow_milestones em
             JOIN escrows e ON em.escrow_id = e.id
             WHERE em.id = $1 AND em.status = 'completed' AND e.customer_id = $2
             FOR UPDATE`,
            [milestoneId, req.user.id]
        );

        if (mResult.rows.length === 0) {
            throw ApiError.notFound('Этап не найден или не готов к подтверждению');
        }

        const milestone = mResult.rows[0];
        const mAmount = parseInt(milestone.amount);
        const commission = Math.round(mAmount * 0.03);
        const netAmount = mAmount - commission;

        // Get customer wallet
        const custWallet = await client.query(
            `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`, [milestone.customer_id]
        );
        const frozenField = milestone.currency === 'USD' ? 'frozen_usd' : 'frozen_kzt';
        const balField = milestone.currency === 'USD' ? 'balance_usd' : 'balance_kzt';

        // Unfreeze + debit from customer
        await client.query(
            `UPDATE wallets SET ${frozenField} = GREATEST(${frozenField} - $1, 0),
             ${balField} = GREATEST(${balField} - $1, 0)
             WHERE id = $2`,
            [mAmount, custWallet.rows[0].id]
        );

        // Credit contractor
        if (milestone.contractor_id) {
            let contrWallet = await client.query(
                `SELECT id FROM wallets WHERE user_id = $1 FOR UPDATE`, [milestone.contractor_id]
            );
            if (contrWallet.rows.length === 0) {
                contrWallet = await client.query(
                    `INSERT INTO wallets (user_id) VALUES ($1) RETURNING id`, [milestone.contractor_id]
                );
            }
            await client.query(
                `UPDATE wallets SET ${balField} = ${balField} + $1 WHERE id = $2`,
                [netAmount, contrWallet.rows[0].id]
            );

            // Payout transaction
            await client.query(
                `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, reference_type, reference_id)
                 VALUES ($1, 'milestone_release', $2, $3, 'completed', $4, 'milestone', $5)`,
                [contrWallet.rows[0].id, netAmount, milestone.currency,
                `Оплата этапа: ${milestone.title} (минус 3%)`, milestoneId]
            );
        }

        // Commission transaction
        await client.query(
            `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, reference_type, reference_id)
             VALUES ($1, 'commission', $2, $3, 'completed', $4, 'milestone', $5)`,
            [custWallet.rows[0].id, commission, milestone.currency,
            `Комиссия 3%: ${milestone.title}`, milestoneId]
        );

        // Update milestone
        await client.query(
            `UPDATE escrow_milestones SET status = 'released', released_at = NOW() WHERE id = $1`,
            [milestoneId]
        );

        // Update escrow released_amount
        const newReleased = (parseInt(milestone.released_amount) || 0) + mAmount;
        const escrowStatus = newReleased >= parseInt(milestone.escrow_amount) ? 'released' : 'funded';
        await client.query(
            `UPDATE escrows SET released_amount = $1, status = $2, updated_at = NOW() WHERE id = $3`,
            [newReleased, escrowStatus, milestone.escrow_id]
        );
    });

    res.json({ success: true, message: 'Этап подтверждён, оплата переведена подрядчику' });
}));

/**
 * POST /finance/milestones/:milestoneId/dispute
 * Customer disputes a milestone
 */
router.post('/milestones/:milestoneId/dispute', asyncHandler(async (req, res) => {
    const { milestoneId } = req.params;
    const { reason } = req.body;

    const result = await query(
        `UPDATE escrow_milestones
         SET status = 'disputed', metadata = jsonb_set(COALESCE(metadata, '{}')::jsonb, '{dispute_reason}', $2::jsonb)
         WHERE id = $1 AND status = 'completed'
         RETURNING *`,
        [milestoneId, JSON.stringify(reason || 'Не указана')]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Этап не найден');
    }

    // Also flag escrow
    await query(
        `UPDATE escrows SET status = 'disputed', updated_at = NOW()
         WHERE id = $1`,
        [result.rows[0].escrow_id]
    );

    res.json({
        success: true,
        message: 'Спор по этапу создан, средства заморожены до решения'
    });
}));

// ================================================================
// 1.3 ENHANCED WITHDRAW API
// ================================================================

/**
 * POST /finance/withdraw/request
 * Enhanced withdrawal with bank details and validation
 */
router.post('/withdraw/request', asyncHandler(async (req, res) => {
    const { amount, currency = 'KZT', bankName, iban, recipientName, phone } = req.body;

    if (!amount || amount <= 0) {
        throw ApiError.badRequest('Укажите сумму');
    }

    if (amount < 1000) {
        throw ApiError.badRequest('Минимальная сумма вывода: 1 000 ₸');
    }

    if (!bankName || !iban) {
        throw ApiError.badRequest('Укажите банк и IBAN');
    }

    let withdrawalId;

    await transaction(async (client) => {
        // Get wallet
        const walletResult = await client.query(
            `SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE`, [req.user.id]
        );

        if (walletResult.rows.length === 0) {
            throw ApiError.badRequest('Кошелёк не найден');
        }

        const wallet = walletResult.rows[0];
        const balanceField = currency === 'USD' ? 'balance_usd' : 'balance_kzt';
        const frozenField = currency === 'USD' ? 'frozen_usd' : 'frozen_kzt';
        const available = (parseInt(wallet[balanceField]) || 0) - (parseInt(wallet[frozenField]) || 0);

        if (amount > available) {
            throw ApiError.badRequest(`Недостаточно средств. Доступно: ${available} ${currency}`);
        }

        // Create withdrawal transaction
        const txResult = await client.query(
            `INSERT INTO transactions (wallet_id, type, amount, currency, status, description, metadata)
             VALUES ($1, 'withdrawal', $2, $3, 'pending', 'Вывод средств', $4)
             RETURNING id`,
            [wallet.id, amount, currency, JSON.stringify({
                bankName,
                iban,
                recipientName: recipientName || req.user.name,
                phone: phone || req.user.phone,
                requestedAt: new Date().toISOString()
            })]
        );

        withdrawalId = txResult.rows[0].id;

        // Freeze amount
        await client.query(
            `UPDATE wallets SET ${frozenField} = ${frozenField} + $1 WHERE id = $2`,
            [amount, wallet.id]
        );
    });

    res.status(201).json({
        success: true,
        withdrawalId,
        message: 'Заявка на вывод создана. Обработка в течение 1-3 рабочих дней.',
        estimatedTime: '1-3 рабочих дня'
    });
}));

/**
 * GET /finance/withdrawals
 * Get withdrawal history
 */
router.get('/withdrawals', asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const walletResult = await query(
        `SELECT id FROM wallets WHERE user_id = $1`, [req.user.id]
    );

    if (walletResult.rows.length === 0) {
        return res.json({ success: true, withdrawals: [], pagination: { total: 0 } });
    }

    let whereClause = `WHERE wallet_id = $1 AND type = 'withdrawal'`;
    const params = [walletResult.rows[0].id];
    let pi = 2;

    if (status) {
        whereClause += ` AND status = $${pi}`;
        params.push(status);
        pi++;
    }

    params.push(parseInt(limit), offset);

    const result = await query(
        `SELECT * FROM transactions ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${pi} OFFSET $${pi + 1}`,
        params
    );

    const countResult = await query(
        `SELECT COUNT(*) FROM transactions ${whereClause}`,
        params.slice(0, -2)
    );

    res.json({
        success: true,
        withdrawals: result.rows.map(t => ({
            id: t.id,
            amount: parseInt(t.amount),
            currency: t.currency,
            status: t.status,
            bankDetails: t.metadata,
            createdAt: t.created_at,
            completedAt: t.completed_at
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].count)
        }
    });
}));

/**
 * POST /finance/withdraw/:txId/approve  (Admin only)
 * Admin approves a withdrawal
 */
router.post('/withdraw/:txId/approve', requireRole('admin'), asyncHandler(async (req, res) => {
    const { txId } = req.params;

    await transaction(async (client) => {
        const txResult = await client.query(
            `SELECT t.*, w.user_id FROM transactions t
             JOIN wallets w ON t.wallet_id = w.id
             WHERE t.id = $1 AND t.type = 'withdrawal' AND t.status = 'pending'
             FOR UPDATE`,
            [txId]
        );

        if (txResult.rows.length === 0) {
            throw ApiError.notFound('Заявка не найдена');
        }

        const tx = txResult.rows[0];
        const balanceField = tx.currency === 'USD' ? 'balance_usd' : 'balance_kzt';
        const frozenField = tx.currency === 'USD' ? 'frozen_usd' : 'frozen_kzt';

        // Complete transaction
        await client.query(
            `UPDATE transactions SET status = 'completed', completed_at = NOW() WHERE id = $1`,
            [txId]
        );

        // Deduct from balance and unfreeze
        await client.query(
            `UPDATE wallets SET
                ${balanceField} = GREATEST(${balanceField} - $1, 0),
                ${frozenField} = GREATEST(${frozenField} - $1, 0)
             WHERE id = $2`,
            [tx.amount, tx.wallet_id]
        );
    });

    res.json({ success: true, message: 'Вывод одобрен' });
}));



// ================================================================
// IIN / BIN VERIFICATION ENDPOINTS
// ================================================================

/**
 * Validate IIN (12 digits, Kazakh individual ID)
 */
function validateIIN(iin) {
    if (!iin || typeof iin !== 'string') return { valid: false, error: 'ИИН не указан' };
    const cleaned = iin.replace(/\s/g, '');
    if (cleaned.length !== 12 || !/^\d{12}$/.test(cleaned)) {
        return { valid: false, error: 'ИИН должен содержать 12 цифр' };
    }
    const mm = parseInt(cleaned.substring(2, 4));
    const dd = parseInt(cleaned.substring(4, 6));
    const ci = parseInt(cleaned.charAt(6));
    if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return { valid: false, error: 'Некорректная дата рождения в ИИН' };
    if (ci < 1 || ci > 6) return { valid: false, error: 'Некорректный код века/пола' };
    const w1 = [1,2,3,4,5,6,7,8,9,10,11], w2 = [3,4,5,6,7,8,9,10,11,1,2];
    let sum = 0;
    for (let i = 0; i < 11; i++) sum += parseInt(cleaned.charAt(i)) * w1[i];
    let check = sum % 11;
    if (check === 10) { sum = 0; for (let i = 0; i < 11; i++) sum += parseInt(cleaned.charAt(i)) * w2[i]; check = sum % 11; }
    if (check !== parseInt(cleaned.charAt(11))) return { valid: false, error: 'Неверная контрольная сумма ИИН' };
    const yy = parseInt(cleaned.substring(0, 2));
    const gender = ci % 2 === 1 ? 'male' : 'female';
    const century = ci <= 2 ? 1800 : ci <= 4 ? 1900 : 2000;
    return { valid: true, iin: cleaned, birthDate: `${century + yy}-${String(mm).padStart(2,'0')}-${String(dd).padStart(2,'0')}`, gender, mockData: { note: 'Для получения реальных данных требуется договор с eGov Connect' } };
}

/**
 * Validate BIN (12 digits, Kazakh business ID)
 */
function validateBIN(bin) {
    if (!bin || typeof bin !== 'string') return { valid: false, error: 'БИН не указан' };
    const cleaned = bin.replace(/\s/g, '');
    if (cleaned.length !== 12 || !/^\d{12}$/.test(cleaned)) return { valid: false, error: 'БИН должен содержать 12 цифр' };
    const ti = parseInt(cleaned.charAt(4));
    if (ti < 4 || ti > 6) return { valid: false, error: 'Некорректный тип организации в БИН' };
    const orgTypes = { 4: 'Резидент', 5: 'Нерезидент', 6: 'ИП' };
    return { valid: true, bin: cleaned, orgType: orgTypes[ti], mockData: { note: 'Для получения реальных данных необходимо подключение к API ГБД ЮЛ' } };
}

/**
 * POST /finance/verify-iin
 */
router.post('/verify-iin', asyncHandler(async (req, res) => {
    const result = validateIIN(req.body.iin);
    if (!result.valid) throw ApiError.badRequest(result.error);
    await query(`UPDATE users SET updated_at = NOW() WHERE id = $1`, [req.user.id]);
    try { await query(`UPDATE user_profiles SET updated_at = NOW() WHERE user_id = $1`, [req.user.id]); } catch(e) {}
    res.json({ success: true, iin: result.iin, birthDate: result.birthDate, gender: result.gender, verified: false, message: result.mockData.note });
}));

/**
 * POST /finance/verify-bin
 */
router.post('/verify-bin', asyncHandler(async (req, res) => {
    const result = validateBIN(req.body.bin);
    if (!result.valid) throw ApiError.badRequest(result.error);
    res.json({ success: true, bin: result.bin, orgType: result.orgType, verified: false, message: result.mockData.note });
}));

module.exports = router;

