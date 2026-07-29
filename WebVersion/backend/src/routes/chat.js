/**
 * Chat Routes
 */

const express = require('express');
const { query } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

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
 * GET /chat/rooms
 * Get user's chat rooms
 */
router.get('/rooms', asyncHandler(async (req, res) => {
    // Get rooms from orders and projects
    const ordersResult = await query(
        `SELECT o.id, o.title, 'order' as type, o.customer_id, o.executor_id,
            (SELECT COUNT(*) FROM chat_messages WHERE order_id = o.id AND is_read = FALSE AND sender_id != $1) as unread
         FROM orders o
         WHERE (o.customer_id = $1 OR o.executor_id = $1) AND o.executor_id IS NOT NULL
         ORDER BY o.updated_at DESC`,
        [req.user.id]
    );

    const projectsResult = await query(
        `SELECT ep.id, ep.title, 'project' as type, ep.customer_id, ep.engineer_id as executor_id,
            (SELECT COUNT(*) FROM chat_messages WHERE project_id = ep.id AND is_read = FALSE AND sender_id != $1) as unread
         FROM engineer_projects ep
         WHERE ep.customer_id = $1 OR ep.engineer_id = $1
         ORDER BY ep.updated_at DESC`,
        [req.user.id]
    );

    const rooms = [
        ...ordersResult.rows.map(r => ({
            id: `order_${r.id}`,
            title: r.title,
            type: 'order',
            referenceId: r.id,
            unreadCount: parseInt(r.unread) || 0
        })),
        ...projectsResult.rows.map(r => ({
            id: `project_${r.id}`,
            title: r.title,
            type: 'project',
            referenceId: r.id,
            unreadCount: parseInt(r.unread) || 0
        }))
    ];

    res.json({ success: true, rooms });
}));

/**
 * GET /chat/order/:orderId/messages
 * Get messages for order chat
 */
router.get('/order/:orderId/messages', asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { before, limit = 50 } = req.query;

    // Check access
    const orderResult = await query(
        `SELECT * FROM orders WHERE id = $1 AND (customer_id = $2 OR executor_id = $2)`,
        [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
        throw ApiError.notFound('Чат не найден');
    }

    let whereClause = `WHERE order_id = $1`;
    const params = [orderId];

    if (before) {
        whereClause += ` AND created_at < $2`;
        params.push(before);
    }

    params.push(limit);

    const result = await query(
        `SELECT cm.*, u.first_name, u.last_name, u.avatar_url
         FROM chat_messages cm
         LEFT JOIN users u ON cm.sender_id = u.id
         ${whereClause}
         ORDER BY cm.created_at DESC
         LIMIT $${params.length}`,
        params
    );

    // Mark as read
    await query(
        `UPDATE chat_messages SET is_read = TRUE WHERE order_id = $1 AND sender_id != $2 AND is_read = FALSE`,
        [orderId, req.user.id]
    );

    res.json({
        success: true,
        messages: result.rows.reverse().map(m => ({
            id: m.id,
            text: m.text,
            sender: {
                id: m.sender_id,
                name: m.sender_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Пользователь',
                avatar: m.avatar_url
            },
            isOwn: m.sender_id === req.user.id,
            isRead: m.is_read,
            createdAt: m.created_at
        }))
    });
}));

/**
 * POST /chat/order/:orderId/messages
 * Send message to order chat
 */
router.post('/order/:orderId/messages', asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        throw ApiError.badRequest('Сообщение не может быть пустым');
    }

    // Check access
    const orderResult = await query(
        `SELECT * FROM orders WHERE id = $1 AND (customer_id = $2 OR executor_id = $2)`,
        [orderId, req.user.id]
    );

    if (orderResult.rows.length === 0) {
        throw ApiError.forbidden('Нет доступа к чату');
    }

    const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Пользователь';

    const result = await query(
        `INSERT INTO chat_messages (room_id, order_id, sender_id, sender_name, text)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at`,
        [`order_${orderId}`, orderId, req.user.id, senderName, text.trim()]
    );

    const message = {
        id: result.rows[0].id,
        text: text.trim(),
        sender: {
            id: req.user.id,
            name: senderName
        },
        isOwn: true,
        isRead: false,
        createdAt: result.rows[0].created_at
    };

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.to(`order_${orderId}`).emit('new_message', message);
    }

    res.status(201).json({ success: true, message });

    // 🔔 Telegram push: уведомляем собеседника
    const order = orderResult.rows[0];
    const recipientId = order.customer_id === req.user.id ? order.executor_id : order.customer_id;
    if (recipientId) {
        sendTelegramNotification(recipientId, 'new_message', {
            sender: senderName,
            orderTitle: order.title,
            message: text.trim()
        }).catch(() => {});
    }
}));

/**
 * GET /chat/project/:projectId/messages
 */
router.get('/project/:projectId/messages', asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { before, limit = 50 } = req.query;

    // Check access
    const projectResult = await query(
        `SELECT * FROM engineer_projects WHERE id = $1 AND (customer_id = $2 OR engineer_id = $2)`,
        [projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
        throw ApiError.notFound('Чат не найден');
    }

    let whereClause = `WHERE project_id = $1`;
    const params = [projectId];

    if (before) {
        whereClause += ` AND created_at < $2`;
        params.push(before);
    }

    params.push(limit);

    const result = await query(
        `SELECT cm.*, u.first_name, u.last_name, u.avatar_url
         FROM chat_messages cm
         LEFT JOIN users u ON cm.sender_id = u.id
         ${whereClause}
         ORDER BY cm.created_at DESC
         LIMIT $${params.length}`,
        params
    );

    // Mark as read
    await query(
        `UPDATE chat_messages SET is_read = TRUE WHERE project_id = $1 AND sender_id != $2 AND is_read = FALSE`,
        [projectId, req.user.id]
    );

    res.json({
        success: true,
        messages: result.rows.reverse().map(m => ({
            id: m.id,
            text: m.text,
            sender: {
                id: m.sender_id,
                name: m.sender_name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Пользователь',
                avatar: m.avatar_url
            },
            isOwn: m.sender_id === req.user.id,
            isRead: m.is_read,
            createdAt: m.created_at
        }))
    });
}));

/**
 * POST /chat/project/:projectId/messages
 */
router.post('/project/:projectId/messages', asyncHandler(async (req, res) => {
    const { projectId } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        throw ApiError.badRequest('Сообщение не может быть пустым');
    }

    // Check access
    const projectResult = await query(
        `SELECT * FROM engineer_projects WHERE id = $1 AND (customer_id = $2 OR engineer_id = $2)`,
        [projectId, req.user.id]
    );

    if (projectResult.rows.length === 0) {
        throw ApiError.forbidden('Нет доступа к чату');
    }

    const senderName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Пользователь';

    const result = await query(
        `INSERT INTO chat_messages (room_id, project_id, sender_id, sender_name, text)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, created_at`,
        [`project_${projectId}`, projectId, req.user.id, senderName, text.trim()]
    );

    const message = {
        id: result.rows[0].id,
        text: text.trim(),
        sender: { id: req.user.id, name: senderName },
        isOwn: true,
        isRead: false,
        createdAt: result.rows[0].created_at
    };

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.to(`project_${projectId}`).emit('new_message', message);
    }

    res.status(201).json({ success: true, message });

    // 🔔 Telegram push: уведомляем собеседника
    const project = projectResult.rows[0];
    const recipientId = project.customer_id === req.user.id ? project.engineer_id : project.customer_id;
    if (recipientId) {
        sendTelegramNotification(recipientId, 'new_message', {
            sender: senderName,
            orderTitle: project.title,
            message: text.trim()
        }).catch(() => {});
    }
}));

module.exports = router;
