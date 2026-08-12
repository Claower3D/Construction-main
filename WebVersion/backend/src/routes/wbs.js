/**
 * QAZGOST AI - WBS Catalog API Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');

/**
 * GET /api/v1/wbs/prices - Получение пользовательских цен WBS
 */
router.get('/prices', async (req, res, next) => {
    try {
        const query = 'SELECT wbs_id as "wbsId", price FROM wbs_catalog_prices;';
        const result = await pool.query(query);

        const prices = {};
        result.rows.forEach(r => {
            prices[r.wbsId] = parseFloat(r.price);
        });

        res.json({
            success: true,
            prices
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/wbs/prices - Сохранение цены WBS вида работ
 */
router.post('/prices', async (req, res, next) => {
    try {
        const { wbsId, price } = req.body;
        if (!wbsId) {
            return res.status(400).json({ error: 'wbsId обязателен' });
        }

        const query = `
            INSERT INTO wbs_catalog_prices (wbs_id, price)
            VALUES ($1, $2)
            ON CONFLICT (wbs_id) DO UPDATE SET price = EXCLUDED.price, updated_at = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [wbsId, parseFloat(price) || 0]);

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'update_wbs_price', `Обновлена цена WBS (${wbsId}) — ${price}₸`]
        );

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
