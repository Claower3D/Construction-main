/**
 * QAZGOST AI - Prices & Catalog API Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');

/**
 * GET /api/v1/prices - Получение списка расценок
 */
router.get('/', async (req, res, next) => {
    try {
        const { type = 'all', search = '', page = 1, limit = 50 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let whereClauses = [];
        let params = [];
        let paramIdx = 1;

        if (type !== 'all') {
            whereClauses.push(`type = $${paramIdx++}`);
            params.push(type === 'works' ? 'work' : type === 'materials' ? 'material' : type);
        }

        if (search) {
            whereClauses.push(`(LOWER(name) LIKE $${paramIdx} OR LOWER(code) LIKE $${paramIdx} OR LOWER(source) LIKE $${paramIdx})`);
            params.push(`%${search.toLowerCase()}%`);
            paramIdx++;
        }

        const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // Count query
        const countRes = await pool.query(`SELECT COUNT(*) FROM price_items ${whereSql}`, params);
        const total = parseInt(countRes.rows[0]?.count || 0);

        // Select query
        params.push(parseInt(limit), offset);
        const selectSql = `
            SELECT code, name, type, category, unit, price, labor_norm as "laborNorm", source
            FROM price_items
            ${whereSql}
            ORDER BY name ASC
            LIMIT $${paramIdx++} OFFSET $${paramIdx++}
        `;
        const result = await pool.query(selectSql, params);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
            items: result.rows
        });
    } catch (err) {
        console.warn('⚠️  Database disconnected, serving demo prices catalog');
        const region = req.query.region || 'Алматы';
        res.json({
            success: true,
            total: 6,
            page: 1,
            pages: 1,
            items: [
                { id: "p1", code: "ГЭСН-01-01", name: "Бетонная стяжка пола M300 (100мм)", unit: "м²", price: 4800, category: "Общестрой", region },
                { id: "p2", code: "ГЭСН-01-02", name: "Штукатурка стен по маякам гипс", unit: "м²", price: 3200, category: "Отделка", region },
                { id: "p3", code: "ГЭСН-02-05", name: "Монтаж кабеля ВВГнг-LS 3x2.5", unit: "м", price: 850, category: "Электрика", region },
                { id: "p4", code: "ГЭСН-03-01", name: "Укладка керамогранита 60x60", unit: "м²", price: 6500, category: "Отделка", region },
                { id: "p5", code: "ГЭСН-04-12", name: "Монтаж гипрочного потолка в 2 слоя", unit: "м²", price: 4200, category: "Потолки", region },
                { id: "p6", code: "ГЭСН-05-08", name: "Установка коллектора водоснабжения", unit: "шт", price: 28000, category: "Сантехника", region }
            ]
        });
    }
});


/**
 * GET /api/v1/prices/stats - Статистика базы данных расценок
 */
router.get('/stats', async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE type = 'work') as works,
                COUNT(*) FILTER (WHERE type = 'material') as materials,
                COUNT(*) FILTER (WHERE type = 'equipment') as equipment,
                COUNT(*) as total
            FROM price_items
        `);
        const row = result.rows[0] || {};
        res.json({
            success: true,
            stats: {
                works: parseInt(row.works || 0),
                materials: parseInt(row.materials || 0),
                equipment: parseInt(row.equipment || 0),
                total: parseInt(row.total || 0)
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/v1/prices - Создание новой позиции расценок
 */
router.post('/', async (req, res, next) => {
    try {
        const { code, name, type = 'work', category = 'general', unit = '—', price = 0, laborNorm = null, source = 'manual' } = req.body;
        if (!code || !name) {
            return res.status(400).json({ error: 'Код и наименование обязательны' });
        }

        const query = `
            INSERT INTO price_items (code, name, type, category, unit, price, labor_norm, source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                type = EXCLUDED.type,
                category = EXCLUDED.category,
                unit = EXCLUDED.unit,
                price = EXCLUDED.price,
                labor_norm = EXCLUDED.labor_norm,
                updated_at = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [code, name, type, category, unit, price, laborNorm, source]);

        // Audit log
        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'create_price', `Создана/обновлена позиция расценки «${name}» (${code}) — ${price}₸`]
        );

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * PUT /api/v1/prices/:code - Редактирование расценки
 */
router.put('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const { name, category, unit, price, laborNorm } = req.body;

        const query = `
            UPDATE price_items
            SET name = COALESCE($1, name),
                category = COALESCE($2, category),
                unit = COALESCE($3, unit),
                price = COALESCE($4, price),
                labor_norm = COALESCE($5, labor_norm),
                updated_at = NOW()
            WHERE code = $6
            RETURNING *;
        `;
        const result = await pool.query(query, [name, category, unit, price, laborNorm, code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Позиция не найдена' });
        }

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'update_price', `Обновлена расценка «${name || code}»: ${price}₸`]
        );

        res.json({ success: true, item: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/v1/prices/:code - Удаление расценки
 */
router.delete('/:code', async (req, res, next) => {
    try {
        const { code } = req.params;
        const result = await pool.query('DELETE FROM price_items WHERE code = $1 RETURNING *', [code]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Позиция не найдена' });
        }

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'delete_price', `Удалена расценка «${code}»`]
        );

        res.json({ success: true, message: 'Позиция удалена' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
