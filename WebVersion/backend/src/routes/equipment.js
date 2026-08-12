/**
 * QAZGOST AI - Equipment Marketplace API Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');

/**
 * GET /api/v1/equipment - Список спецтехники
 */
router.get('/', async (req, res, next) => {
    try {
        const { type = 'all', city = 'all' } = req.query;
        let whereClauses = [];
        let params = [];
        let paramIdx = 1;

        if (type !== 'all') {
            whereClauses.push(`type = $${paramIdx++}`);
            params.push(type);
        }
        if (city !== 'all') {
            whereClauses.push(`city = $${paramIdx++}`);
            params.push(city);
        }

        const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const query = `
            SELECT id, name, type, city, price_per_shift as "pricePerShift", status, created_at as "createdAt"
            FROM equipment_listings
            ${whereSql}
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query, params);

        res.json({
            success: true,
            equipment: result.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/equipment - Добавление спецтехники
 */
router.post('/', async (req, res, next) => {
    try {
        const { name, type = 'excavator', city = 'Алматы', pricePerShift = 0 } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Наименование техники обязательно' });
        }

        const query = `
            INSERT INTO equipment_listings (name, type, city, price_per_shift)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
        const result = await pool.query(query, [name, type, city, parseFloat(pricePerShift) || 0]);

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
