/**
 * QAZGOST AI - Admin Unified API Routes
 */

const express = require('express');
const router = express.Router();
const { pool } = require('../database/connection');

/**
 * GET /api/v1/admin/audit - Получение логов аудита
 */
router.get('/audit', async (req, res, next) => {
    try {
        const query = 'SELECT id, user_name as "user", action, description, created_at as "timestamp" FROM audit_logs ORDER BY created_at DESC LIMIT 100;';
        const result = await pool.query(query);

        res.json({
            success: true,
            logs: result.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/admin/audit/export - Экспорт отчета аудита в TXT
 */
router.get('/audit/export', async (req, res, next) => {
    try {
        const query = 'SELECT created_at, action, description FROM audit_logs ORDER BY created_at DESC;';
        const result = await pool.query(query);

        const text = result.rows.map(r =>
            `${new Date(r.created_at).toISOString()} | ${r.action.toUpperCase()} | ${r.description}`
        ).join('\n');

        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename=admin_audit_${new Date().toISOString().slice(0, 10)}.txt`);
        res.send(text);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/v1/admin/users - Получение всех пользователей систем для админа
 */
router.get('/users', async (req, res, next) => {
    try {
        const { role = 'all', search = '' } = req.query;
        let whereClauses = [];
        let params = [];
        let paramIdx = 1;

        if (role !== 'all') {
            whereClauses.push(`role = $${paramIdx++}`);
            params.push(role);
        }
        if (search) {
            whereClauses.push(`(LOWER(first_name) LIKE $${paramIdx} OR LOWER(last_name) LIKE $${paramIdx} OR LOWER(email) LIKE $${paramIdx} OR phone LIKE $${paramIdx})`);
            params.push(`%${search.toLowerCase()}%`);
            paramIdx++;
        }

        const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const query = `
            SELECT id, first_name as "firstName", last_name as "lastName", email, phone, role, is_active as "isActive", created_at as "createdAt"
            FROM users
            ${whereSql}
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query, params);

        res.json({
            success: true,
            users: result.rows
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/v1/admin/users/:id/role - Изменение роли пользователя
 */
router.patch('/users/:id/role', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const result = await pool.query(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *;',
            [role, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', 'change_role', `Изменена роль пользователя #${id} на «${role}»`]
        );

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/v1/admin/users/:id/toggle-block - Блокировка/Разблокировка
 */
router.patch('/users/:id/toggle-block', async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'UPDATE users SET is_active = NOT is_active, updated_at = NOW() WHERE id = $1 RETURNING *;',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }

        const user = result.rows[0];
        const statusStr = user.is_active ? 'разблокирован' : 'заблокирован';

        await pool.query(
            'INSERT INTO audit_logs (user_name, action, description) VALUES ($1, $2, $3)',
            ['Admin', user.is_active ? 'unblock_user' : 'block_user', `Пользователь #${id} ${statusStr}`]
        );

        res.json({ success: true, user });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
