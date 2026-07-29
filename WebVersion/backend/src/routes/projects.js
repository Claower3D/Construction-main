/**
 * Projects Routes (Engineer Projects)
 */

const express = require('express');
const { query } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * GET /projects
 */
router.get('/', asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // User can be engineer or customer
    let whereClause = `WHERE (ep.engineer_id = $1 OR ep.customer_id = $1)`;
    const params = [req.user.id];
    let paramIndex = 2;

    if (status && status !== 'all') {
        whereClause += ` AND ep.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    params.push(limit, offset);

    const result = await query(
        `SELECT ep.*, 
            eng.first_name as eng_first, eng.last_name as eng_last,
            cust.first_name as cust_first, cust.last_name as cust_last
         FROM engineer_projects ep
         LEFT JOIN users eng ON ep.engineer_id = eng.id
         LEFT JOIN users cust ON ep.customer_id = cust.id
         ${whereClause}
         ORDER BY ep.updated_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
    );

    res.json({
        success: true,
        projects: result.rows.map(p => ({
            id: p.id,
            title: p.title,
            objectAddress: p.object_address,
            totalPrice: parseInt(p.total_price) || 0,
            progress: p.progress,
            status: p.status,
            engineer: {
                id: p.engineer_id,
                name: `${p.eng_first || ''} ${p.eng_last || ''}`.trim() || 'Инженер'
            },
            customer: {
                id: p.customer_id,
                name: `${p.cust_first || ''} ${p.cust_last || ''}`.trim() || 'Заказчик'
            },
            createdAt: p.created_at,
            assignedAt: p.assigned_at
        }))
    });
}));

/**
 * GET /projects/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
        `SELECT ep.*,
            eng.first_name as eng_first, eng.last_name as eng_last, eng.phone as eng_phone,
            cust.first_name as cust_first, cust.last_name as cust_last, cust.phone as cust_phone
         FROM engineer_projects ep
         LEFT JOIN users eng ON ep.engineer_id = eng.id
         LEFT JOIN users cust ON ep.customer_id = cust.id
         WHERE ep.id = $1 AND (ep.engineer_id = $2 OR ep.customer_id = $2)`,
        [id, req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Проект не найден');
    }

    const project = result.rows[0];

    // Files
    const files = await query(
        `SELECT * FROM project_files WHERE project_id = $1 ORDER BY created_at DESC`,
        [id]
    );

    // Comments
    const comments = await query(
        `SELECT * FROM project_comments WHERE project_id = $1 ORDER BY created_at ASC`,
        [id]
    );

    res.json({
        success: true,
        project: {
            id: project.id,
            title: project.title,
            objectAddress: project.object_address,
            totalPrice: parseInt(project.total_price) || 0,
            progress: project.progress,
            status: project.status,
            engineer: {
                id: project.engineer_id,
                name: `${project.eng_first || ''} ${project.eng_last || ''}`.trim(),
                phone: project.eng_phone
            },
            customer: {
                id: project.customer_id,
                name: `${project.cust_first || ''} ${project.cust_last || ''}`.trim(),
                phone: project.cust_phone
            },
            files: files.rows.map(f => ({
                id: f.id,
                name: f.name,
                url: f.url,
                type: f.type,
                size: f.size_bytes,
                createdAt: f.created_at
            })),
            comments: comments.rows.map(c => ({
                id: c.id,
                author: c.author_name,
                text: c.text,
                createdAt: c.created_at
            })),
            createdAt: project.created_at,
            assignedAt: project.assigned_at,
            submittedAt: project.submitted_at,
            completedAt: project.completed_at
        }
    });
}));

module.exports = router;
