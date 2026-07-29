/**
 * Orders Routes
 * Маршруты для работы с заказами
 */

const express = require('express');
const { query, transaction } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate, optionalAuth, requireRole } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

// Telegram push-уведомления (не блокирующие — ошибки логируются, но не ломают flow)
let sendTelegramNotification;
try {
    sendTelegramNotification = require('./telegram').sendTelegramNotification;
} catch (e) {
    sendTelegramNotification = async () => ({ success: false, reason: 'not_loaded' });
}

const router = express.Router();

/**
 * GET /orders
 * Получить список заказов
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { status, filter, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    if (req.user.role === 'customer') {
        // Заказчик видит только свои заказы
        whereClause = `WHERE o.customer_id = $${paramIndex}`;
        params.push(req.user.id);
        paramIndex++;
    } else if (req.user.role === 'executor') {
        if (filter === 'my') {
            // Мои заказы (назначенные)
            whereClause = `WHERE o.executor_id = $${paramIndex}`;
            params.push(req.user.id);
            paramIndex++;
        } else {
            // Лента - все опубликованные заказы
            whereClause = `WHERE o.status = 'published'`;
        }
    } else if (req.user.role === 'admin') {
        // Админ видит все
        whereClause = `WHERE 1=1`;
    }

    if (status && status !== 'all') {
        whereClause += ` AND o.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    params.push(limit, offset);

    const result = await query(
        `SELECT o.*, 
            cu.first_name as customer_first_name, cu.last_name as customer_last_name, cu.phone as customer_phone,
            eu.first_name as executor_first_name, eu.last_name as executor_last_name,
            (SELECT COUNT(*) FROM proposals WHERE order_id = o.id) as proposals_count
         FROM orders o
         LEFT JOIN users cu ON o.customer_id = cu.id
         LEFT JOIN users eu ON o.executor_id = eu.id
         ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
    );

    // Get total count
    const countParams = params.slice(0, -2); // Remove limit and offset
    const countResult = await query(
        `SELECT COUNT(*) FROM orders o ${whereClause}`,
        countParams
    );

    const orders = result.rows.map(o => {
        // Скрываем телефон если нет согласия
        const showPhone = req.user.role === 'customer' || o.phone_consent_given || o.executor_id === req.user.id;

        return {
            id: o.id,
            orderNumber: o.order_number,
            title: o.title,
            description: o.description?.substring(0, 200),
            category: o.category,
            address: o.address,
            estimatedPrice: parseInt(o.estimated_price) || 0,
            finalPrice: parseInt(o.final_price) || null,
            status: o.status,
            deadline: o.deadline,
            customer: {
                name: `${o.customer_first_name || ''} ${o.customer_last_name || ''}`.trim() || 'Заказчик',
                phone: showPhone ? o.customer_phone : null
            },
            executor: o.executor_id ? {
                name: `${o.executor_first_name || ''} ${o.executor_last_name || ''}`.trim() || 'Исполнитель'
            } : null,
            proposalsCount: parseInt(o.proposals_count) || 0,
            phoneConsentGiven: o.phone_consent_given,
            createdAt: o.created_at,
            publishedAt: o.published_at
        };
    });

    res.json({
        success: true,
        orders,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].count),
            totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
        }
    });
}));

/**
 * POST /orders
 * Создать новый заказ
 */
router.post('/', authenticate, requireRole('customer', 'admin'), asyncHandler(async (req, res) => {
    const { title, description, category, address, estimatedPrice, deadline, photos } = req.body;

    if (!title) {
        throw ApiError.badRequest('Название заказа обязательно');
    }

    const result = await transaction(async (client) => {
        // Create order
        const orderResult = await client.query(
            `INSERT INTO orders (customer_id, title, description, category, address, estimated_price, deadline, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
             RETURNING id, order_number`,
            [req.user.id, title, description, category, address, estimatedPrice || 0, deadline]
        );

        const orderId = orderResult.rows[0].id;

        // Add photos if provided
        if (photos && Array.isArray(photos)) {
            for (const photo of photos) {
                await client.query(
                    `INSERT INTO order_photos (order_id, url, type) VALUES ($1, $2, 'before')`,
                    [orderId, photo]
                );
            }
        }

        return orderResult.rows[0];
    });

    res.status(201).json({
        success: true,
        message: 'Заказ создан',
        order: {
            id: result.id,
            orderNumber: result.order_number
        }
    });
}));

/**
 * GET /orders/:id
 * Получить детали заказа
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
        `SELECT o.*, 
            cu.first_name as customer_first_name, cu.last_name as customer_last_name, 
            cu.phone as customer_phone, cu.email as customer_email,
            eu.first_name as executor_first_name, eu.last_name as executor_last_name,
            eu.phone as executor_phone
         FROM orders o
         LEFT JOIN users cu ON o.customer_id = cu.id
         LEFT JOIN users eu ON o.executor_id = eu.id
         WHERE o.id = $1`,
        [id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Заказ не найден');
    }

    const order = result.rows[0];

    // Check access
    const isOwner = order.customer_id === req.user.id;
    const isExecutor = order.executor_id === req.user.id;
    const isPublic = order.status === 'published';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isExecutor && !isPublic && !isAdmin) {
        throw ApiError.forbidden('Нет доступа к этому заказу');
    }

    // Get photos
    const photos = await query(
        `SELECT id, url, thumbnail_url, type, created_at FROM order_photos WHERE order_id = $1`,
        [id]
    );

    // Get estimate items
    const estimateItems = await query(
        `SELECT * FROM order_estimate_items WHERE order_id = $1`,
        [id]
    );

    // Get proposals (only for owner)
    let proposals = [];
    if (isOwner || isAdmin) {
        const proposalsResult = await query(
            `SELECT p.*, u.first_name, u.last_name, u.rating, u.reviews_count
             FROM proposals p
             LEFT JOIN users u ON p.executor_id = u.id
             WHERE p.order_id = $1
             ORDER BY p.created_at DESC`,
            [id]
        );
        proposals = proposalsResult.rows.map(p => ({
            id: p.id,
            price: parseInt(p.price),
            durationDays: p.duration_days,
            earliestStartDate: p.earliest_start_date,
            comment: p.comment,
            status: p.status,
            executor: {
                id: p.executor_id,
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Исполнитель',
                rating: parseFloat(p.rating) || 0,
                reviewsCount: p.reviews_count || 0
            },
            createdAt: p.created_at
        }));
    }

    // Get defects
    const defects = await query(
        `SELECT * FROM defects WHERE order_id = $1 ORDER BY created_at DESC`,
        [id]
    );

    const showPhone = isOwner || order.phone_consent_given || isExecutor || isAdmin;

    res.json({
        success: true,
        order: {
            id: order.id,
            orderNumber: order.order_number,
            title: order.title,
            description: order.description,
            category: order.category,
            address: order.address,
            estimatedPrice: parseInt(order.estimated_price) || 0,
            finalPrice: parseInt(order.final_price) || null,
            status: order.status,
            deadline: order.deadline,
            phoneConsentGiven: order.phone_consent_given,
            customer: {
                id: order.customer_id,
                name: `${order.customer_first_name || ''} ${order.customer_last_name || ''}`.trim() || 'Заказчик',
                phone: showPhone ? order.customer_phone : null,
                email: isOwner || isAdmin ? order.customer_email : null
            },
            executor: order.executor_id ? {
                id: order.executor_id,
                name: `${order.executor_first_name || ''} ${order.executor_last_name || ''}`.trim() || 'Исполнитель',
                phone: isExecutor || isOwner ? order.executor_phone : null
            } : null,
            photos: photos.rows,
            estimateItems: estimateItems.rows.map(i => ({
                id: i.id,
                name: i.name,
                unit: i.unit,
                quantity: parseFloat(i.quantity),
                unitPrice: parseInt(i.unit_price),
                totalPrice: parseInt(i.total_price),
                category: i.category
            })),
            proposals,
            defects: defects.rows.map(d => ({
                id: d.id,
                title: d.title,
                description: d.description,
                severity: d.severity,
                status: d.status,
                createdAt: d.created_at,
                fixedAt: d.fixed_at
            })),
            createdAt: order.created_at,
            publishedAt: order.published_at,
            assignedAt: order.assigned_at,
            completedAt: order.completed_at
        }
    });
}));

/**
 * PUT /orders/:id
 * Обновить заказ (только черновик)
 */
router.put('/:id', authenticate, requireRole('customer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, category, address, estimatedPrice, deadline } = req.body;

    // Check ownership and status
    const orderResult = await query(
        `SELECT * FROM orders WHERE id = $1 AND customer_id = $2`,
        [id, req.user.id]
    );

    if (orderResult.rows.length === 0) {
        throw ApiError.notFound('Заказ не найден');
    }

    if (orderResult.rows[0].status !== 'draft') {
        throw ApiError.badRequest('Можно редактировать только черновики');
    }

    await query(
        `UPDATE orders SET 
            title = COALESCE($1, title),
            description = COALESCE($2, description),
            category = COALESCE($3, category),
            address = COALESCE($4, address),
            estimated_price = COALESCE($5, estimated_price),
            deadline = COALESCE($6, deadline)
         WHERE id = $7`,
        [title, description, category, address, estimatedPrice, deadline, id]
    );

    res.json({ success: true, message: 'Заказ обновлён' });
}));

/**
 * POST /orders/:id/publish
 * Опубликовать заказ
 */
router.post('/:id/publish', authenticate, requireRole('customer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
        `UPDATE orders SET status = 'published', published_at = NOW()
         WHERE id = $1 AND customer_id = $2 AND status = 'draft'
         RETURNING id`,
        [id, req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.badRequest('Невозможно опубликовать заказ');
    }

    res.json({ success: true, message: 'Заказ опубликован' });
}));

/**
 * POST /orders/:id/proposals
 * Подать заявку на заказ (исполнитель)
 */
router.post('/:id/proposals', authenticate, requireRole('executor'), actionLimiter, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { price, durationDays, earliestStartDate, comment } = req.body;

    if (!price || price <= 0) {
        throw ApiError.badRequest('Укажите цену');
    }

    // Check order status
    const orderResult = await query(
        `SELECT * FROM orders WHERE id = $1 AND status = 'published'`,
        [id]
    );

    if (orderResult.rows.length === 0) {
        throw ApiError.notFound('Заказ не найден или недоступен');
    }

    // Upsert proposal
    const result = await query(
        `INSERT INTO proposals (order_id, executor_id, price, duration_days, earliest_start_date, comment)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (order_id, executor_id) DO UPDATE SET
            price = $3, duration_days = $4, earliest_start_date = $5, comment = $6, updated_at = NOW()
         RETURNING id`,
        [id, req.user.id, price, durationDays || 7, earliestStartDate, comment]
    );

    // Notify customer
    await query(
        `INSERT INTO notifications (user_id, type, title, message, data)
         VALUES ($1, 'new_proposal', 'Новое предложение', 'Исполнитель подал заявку на ваш заказ', $2)`,
        [orderResult.rows[0].customer_id, JSON.stringify({ orderId: id, proposalId: result.rows[0].id })]
    );

    res.status(201).json({
        success: true,
        message: 'Предложение отправлено',
        proposalId: result.rows[0].id
    });

    // 🔔 Telegram push: уведомляем заказчика о новом предложении
    const order = orderResult.rows[0];
    sendTelegramNotification(order.customer_id, 'new_proposal', {
        orderTitle: order.title,
        price,
        executorName: req.user.first_name || 'Исполнитель'
    }).catch(() => {});
}));

/**
 * POST /orders/:id/assign
 * Назначить исполнителя (заказчик)
 */
router.post('/:id/assign', authenticate, requireRole('customer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { proposalId } = req.body;

    if (!proposalId) {
        throw ApiError.badRequest('Укажите предложение');
    }

    await transaction(async (client) => {
        // Check order ownership
        const orderResult = await client.query(
            `SELECT * FROM orders WHERE id = $1 AND customer_id = $2 AND status = 'published' FOR UPDATE`,
            [id, req.user.id]
        );

        if (orderResult.rows.length === 0) {
            throw ApiError.notFound('Заказ не найден');
        }

        // Get proposal
        const proposalResult = await client.query(
            `SELECT * FROM proposals WHERE id = $1 AND order_id = $2`,
            [proposalId, id]
        );

        if (proposalResult.rows.length === 0) {
            throw ApiError.notFound('Предложение не найдено');
        }

        const proposal = proposalResult.rows[0];

        // Assign executor
        await client.query(
            `UPDATE orders SET 
                executor_id = $1, 
                status = 'assigned',
                final_price = $2,
                assigned_at = NOW()
             WHERE id = $3`,
            [proposal.executor_id, proposal.price, id]
        );

        // Accept this proposal, reject others
        await client.query(`UPDATE proposals SET status = 'accepted' WHERE id = $1`, [proposalId]);
        await client.query(`UPDATE proposals SET status = 'rejected' WHERE order_id = $1 AND id != $2`, [id, proposalId]);

        // Notify executor
        await client.query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, 'proposal_accepted', 'Заявка принята', 'Ваша заявка на заказ принята', $2)`,
            [proposal.executor_id, JSON.stringify({ orderId: id })]
        );
    });

    res.json({ success: true, message: 'Исполнитель назначен' });

    // 🔔 Telegram push: уведомляем исполнителя о принятии заявки
    const orderData = (await query(`SELECT title, final_price FROM orders WHERE id = $1`, [id])).rows[0];
    sendTelegramNotification(proposal.executor_id, 'proposal_accepted', {
        orderTitle: orderData?.title,
        price: orderData?.final_price
    }).catch(() => {});
}));

/**
 * POST /orders/:id/status
 * Изменить статус заказа
 */
router.post('/:id/status', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    // Get order
    const orderResult = await query(`SELECT * FROM orders WHERE id = $1`, [id]);

    if (orderResult.rows.length === 0) {
        throw ApiError.notFound('Заказ не найден');
    }

    const order = orderResult.rows[0];
    const isOwner = order.customer_id === req.user.id;
    const isExecutor = order.executor_id === req.user.id;

    // Validate transition rights
    const executorStatuses = ['in_progress', 'submitted'];
    const ownerStatuses = ['cancelled', 'completed', 'revision'];

    if (executorStatuses.includes(status) && !isExecutor) {
        throw ApiError.forbidden('Только исполнитель может изменить этот статус');
    }

    if (ownerStatuses.includes(status) && !isOwner) {
        throw ApiError.forbidden('Только заказчик может изменить этот статус');
    }

    // Validate status transitions
    const validTransitions = {
        'assigned': ['in_progress', 'cancelled'],
        'in_progress': ['submitted', 'cancelled'],
        'submitted': ['completed', 'revision', 'on_review'],
        'on_review': ['completed', 'revision'],
        'revision': ['submitted', 'cancelled']
    };

    if (!validTransitions[order.status]?.includes(status)) {
        throw ApiError.badRequest(`Невозможно перейти из статуса "${order.status}" в "${status}"`);
    }

    const updateFields = ['status = $1'];
    const updateParams = [status, id];

    if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
    }

    await query(
        `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $2`,
        updateParams
    );

    res.json({ success: true, message: `Статус изменён на "${status}"` });

    // 🔔 Telegram push: уведомляем обе стороны
    const notifyUserId = isOwner ? order.executor_id : order.customer_id;
    if (notifyUserId) {
        sendTelegramNotification(notifyUserId, 'status_change', {
            title: order.title,
            oldStatus: order.status,
            newStatus: status
        }).catch(() => {});
    }
    // При завершении — уведомляем обоих
    if (status === 'completed') {
        const bothUsers = [order.customer_id, order.executor_id].filter(Boolean);
        for (const uid of bothUsers) {
            sendTelegramNotification(uid, 'order_completed', {
                title: order.title,
                amount: order.final_price || order.estimated_price
            }).catch(() => {});
        }
    }
}));

/**
 * DELETE /orders/:id
 * Удалить заказ (только черновик)
 */
router.delete('/:id', authenticate, requireRole('customer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
        `DELETE FROM orders WHERE id = $1 AND customer_id = $2 AND status = 'draft' RETURNING id`,
        [id, req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.badRequest('Невозможно удалить заказ');
    }

    res.json({ success: true, message: 'Заказ удалён' });
}));

module.exports = router;
