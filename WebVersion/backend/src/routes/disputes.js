/**
 * QAZGOST AI - Disputes & Arbitration API Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');

/**
 * GET /api/v1/disputes - Список споров и претензий
 */
router.get('/', async (req, res, next) => {
    try {
        const query = `
            SELECT id, order_id as "orderId", title, reason, status, resolution, created_at as "createdAt"
            FROM disputes
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query);

        res.json({
            success: true,
            disputes: result.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/disputes/:id/resolve - Вынесение арбитражного решения
 */
router.post('/:id/resolve', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { resolution = 'Решено арбитражем', status = 'resolved' } = req.body;

        const query = `
            UPDATE disputes
            SET status = $1, resolution = $2, resolved_at = NOW()
            WHERE id = $3
            RETURNING *;
        `;
        const result = await pool.query(query, [status, resolution, id]);

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'resolve_dispute', `Арбитражное решение по спору #${id}: ${resolution}`]
        );

        res.json({ success: true, dispute: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
