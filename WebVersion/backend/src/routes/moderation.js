/**
 * QAZGOST AI - Moderation API Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');

/**
 * GET /api/v1/moderation/queue - Получение очереди модерации
 */
router.get('/queue', async (req, res, next) => {
    try {
        const query = `
            SELECT id, entity_id as "entityId", entity_type as "entityType", title, description, status, priority, created_at as "createdAt"
            FROM moderation_queue
            ORDER BY priority DESC, created_at DESC;
        `;
        const result = await pool.query(query);

        res.json({
            success: true,
            queue: result.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/moderation/:id/approve - Одобрение модератором
 */
router.post('/:id/approve', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE moderation_queue
            SET status = 'approved'
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [id]);

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'approve_moderation', `Элемент модерации #${id} одобрен`]
        );

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/moderation/:id/reject - Отклонение модератором
 */
router.post('/:id/reject', async (req, res, next) => {
    try {
        const { id } = req.params;
        const query = `
            UPDATE moderation_queue
            SET status = 'rejected'
            WHERE id = $1
            RETURNING *;
        `;
        const result = await pool.query(query, [id]);

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'reject_moderation', `Элемент модерации #${id} отклонён`]
        );

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/moderation/approve-all - Массовое одобрение всей очереди
 */
router.post('/approve-all', async (req, res, next) => {
    try {
        const query = `
            UPDATE moderation_queue
            SET status = 'approved'
            WHERE status = 'pending'
            RETURNING *;
        `;
        const result = await pool.query(query);

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'approve_all_moderation', `Массовое одобрение всех элементов очереди (${result.rowCount} шт.)`]
        );

        res.json({ success: true, approvedCount: result.rowCount });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
