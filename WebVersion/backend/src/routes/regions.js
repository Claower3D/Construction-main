/**
 * QAZGOST AI - Regional Coefficients API Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');

/**
 * GET /api/v1/regions - Получение коэффициентов регионов
 */
router.get('/', async (req, res, next) => {
    try {
        const query = 'SELECT region, coefficient FROM regional_coefficients ORDER BY coefficient DESC;';
        const result = await pool.query(query);

        // Map to object
        const regionsMap = { default: 1.00 };
        result.rows.forEach(r => {
            regionsMap[r.region] = parseFloat(r.coefficient);
        });

        res.json({
            success: true,
            regions: regionsMap
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/regions - Добавление нового региона
 */
router.post('/', async (req, res, next) => {
    try {
        const { region, coefficient = 1.00 } = req.body;
        if (!region) {
            return res.status(400).json({ error: 'Название региона обязательно' });
        }

        const query = `
            INSERT INTO regional_coefficients (region, coefficient)
            VALUES ($1, $2)
            ON CONFLICT (region) DO UPDATE SET coefficient = EXCLUDED.coefficient, updated_at = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [region, parseFloat(coefficient)]);

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'create_region', `Добавлен/обновлен регион «${region}» с коэффициентом ×${coefficient}`]
        );

        res.json({ success: true, region: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/v1/regions/:name - Изменение коэффициента региона
 */
router.put('/:name', async (req, res, next) => {
    try {
        const { name } = req.params;
        const { coefficient } = req.body;

        const query = `
            UPDATE regional_coefficients
            SET coefficient = $1, updated_at = NOW()
            WHERE region = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [parseFloat(coefficient), name]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Регион не найден' });
        }

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'update_region', `Обновлен коэффициент региона «${name}» на ×${coefficient}`]
        );

        res.json({ success: true, region: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
