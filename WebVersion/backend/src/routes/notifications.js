/**
 * Notifications Routes
 */

const express = require('express');
const { query } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * GET /notifications
 * Get user's notifications
 */
router.get('/', asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = `WHERE user_id = $1`;
    const params = [req.user.id];
    let paramIndex = 2;

    if (unreadOnly === 'true') {
        whereClause += ` AND is_read = FALSE`;
    }

    params.push(limit, offset);

    const result = await query(
        `SELECT * FROM notifications ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
    );

    // Get unread count
    const unreadResult = await query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
        [req.user.id]
    );

    res.json({
        success: true,
        notifications: result.rows.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            data: n.data,
            isRead: n.is_read,
            createdAt: n.created_at
        })),
        unreadCount: parseInt(unreadResult.rows[0].count) || 0
    });
}));

/**
 * GET /notifications/unread-count
 */
router.get('/unread-count', asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
        [req.user.id]
    );

    res.json({
        success: true,
        count: parseInt(result.rows[0].count) || 0
    });
}));

/**
 * POST /notifications/:id/read
 * Mark notification as read
 */
router.post('/:id/read', asyncHandler(async (req, res) => {
    const { id } = req.params;

    await query(
        `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2`,
        [id, req.user.id]
    );

    res.json({ success: true });
}));

/**
 * POST /notifications/read-all
 * Mark all notifications as read
 */
router.post('/read-all', asyncHandler(async (req, res) => {
    await query(
        `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
        [req.user.id]
    );

    res.json({ success: true, message: 'Все уведомления прочитаны' });
}));

/**
 * DELETE /notifications/:id
 * Delete notification
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    await query(
        `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
        [id, req.user.id]
    );

    res.json({ success: true });
}));

module.exports = router;
