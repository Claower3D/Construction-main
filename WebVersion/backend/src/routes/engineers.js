/**
 * Engineer Routes
 * API для кабинета инженера
 */

const express = require('express');
const { query, transaction } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireRole } = require('../middleware/auth');
const { actionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /engineers/profile
 * Получить профиль инженера
 */
router.get('/profile', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT u.*, up.*, 
            (SELECT COUNT(*) FROM engineer_projects WHERE engineer_id = u.id) as projects_count,
            (SELECT COUNT(*) FROM engineer_projects WHERE engineer_id = u.id AND status = 'completed') as completed_count
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Профиль не найден');
    }

    const user = result.rows[0];

    // Get specializations
    const specsResult = await query(
        `SELECT s.code, s.name, s.icon FROM specializations s
         JOIN user_specializations us ON s.id = us.specialization_id
         WHERE us.user_id = $1`,
        [req.user.id]
    );

    res.json({
        success: true,
        profile: {
            id: user.id,
            phone: user.phone,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Не указано',
            avatar: user.avatar_url,
            city: user.city,
            isCompany: user.is_company,
            companyName: user.company_name,
            experienceYears: user.experience_years || 0,
            hourlyRate: user.hourly_rate || 0,
            description: user.description,
            rating: parseFloat(user.rating) || 0,
            reviewsCount: user.reviews_count || 0,
            projectsCount: parseInt(user.projects_count) || 0,
            completedCount: parseInt(user.completed_count) || 0,
            specializations: specsResult.rows.map(s => s.code),
            isComplete: !!(user.first_name && user.phone && specsResult.rows.length > 0)
        }
    });
}));

/**
 * PUT /engineers/profile
 * Обновить профиль инженера
 */
router.put('/profile', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const {
        firstName, lastName, email, city, isCompany, companyName,
        experienceYears, hourlyRate, description, specializations
    } = req.body;

    await transaction(async (client) => {
        // Update user
        await client.query(
            `UPDATE users SET 
                first_name = COALESCE($1, first_name),
                last_name = COALESCE($2, last_name),
                email = COALESCE($3, email)
             WHERE id = $4`,
            [firstName, lastName, email, req.user.id]
        );

        // Update profile
        await client.query(
            `INSERT INTO user_profiles (user_id, city, is_company, company_name, experience_years, hourly_rate, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (user_id) DO UPDATE SET
                city = COALESCE($2, user_profiles.city),
                is_company = COALESCE($3, user_profiles.is_company),
                company_name = COALESCE($4, user_profiles.company_name),
                experience_years = COALESCE($5, user_profiles.experience_years),
                hourly_rate = COALESCE($6, user_profiles.hourly_rate),
                description = COALESCE($7, user_profiles.description)`,
            [req.user.id, city, isCompany, companyName, experienceYears, hourlyRate, description]
        );

        // Update specializations
        if (specializations && Array.isArray(specializations)) {
            // Remove old
            await client.query(
                `DELETE FROM user_specializations WHERE user_id = $1`,
                [req.user.id]
            );

            // Add new
            for (const specCode of specializations) {
                await client.query(
                    `INSERT INTO user_specializations (user_id, specialization_id)
                     SELECT $1, id FROM specializations WHERE code = $2
                     ON CONFLICT DO NOTHING`,
                    [req.user.id, specCode]
                );
            }
        }
    });

    res.json({ success: true, message: 'Профиль обновлён' });
}));

/**
 * GET /engineers/summary
 * Сводка по проектам инженера
 */
router.get('/summary', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE status = 'in_progress') as in_work,
            COUNT(*) FILTER (WHERE status = 'submitted' OR status = 'on_review') as on_review,
            COUNT(*) FILTER (WHERE status = 'completed') as completed,
            COALESCE(SUM(total_price) FILTER (WHERE status = 'completed'), 0) as total_earned
         FROM engineer_projects
         WHERE engineer_id = $1`,
        [req.user.id]
    );

    const stats = result.rows[0];

    // Get rating
    const ratingResult = await query(
        `SELECT rating FROM users WHERE id = $1`,
        [req.user.id]
    );

    res.json({
        success: true,
        summary: {
            totalProjects: parseInt(stats.total) || 0,
            inWork: parseInt(stats.in_work) || 0,
            onReview: parseInt(stats.on_review) || 0,
            completed: parseInt(stats.completed) || 0,
            totalEarned: parseInt(stats.total_earned) || 0,
            rating: parseFloat(ratingResult.rows[0]?.rating) || 0
        }
    });
}));

/**
 * GET /engineers/requests
 * Доступные заявки для инженера
 */
router.get('/requests', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const { category, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = `WHERE er.status = 'open'`;
    const params = [];
    let paramIndex = 1;

    if (category && category !== 'all') {
        whereClause += ` AND er.category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
    }

    params.push(limit, offset);

    const result = await query(
        `SELECT er.*, u.first_name, u.last_name, u.phone as customer_phone,
            (SELECT COUNT(*) FROM engineer_request_solutions WHERE request_id = er.id) as solutions_count
         FROM engineer_requests er
         LEFT JOIN users u ON er.customer_id = u.id
         ${whereClause}
         ORDER BY er.created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        params
    );

    // Get total count
    const countResult = await query(
        `SELECT COUNT(*) FROM engineer_requests er ${whereClause}`,
        category && category !== 'all' ? [category] : []
    );

    res.json({
        success: true,
        requests: result.rows.map(r => ({
            id: r.id,
            category: r.category,
            title: r.title || r.object_name,
            objectName: r.object_name,
            objectAddress: r.object_address,
            customerName: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Заказчик',
            customerPhone: r.customer_phone,
            requirements: r.requirements,
            totalPrice: parseInt(r.total_price) || 0,
            solutionsCount: parseInt(r.solutions_count) || 0,
            status: r.status,
            deadline: r.deadline,
            createdAt: r.created_at
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: parseInt(countResult.rows[0].count)
        }
    });
}));

/**
 * GET /engineers/requests/:id
 * Детали заявки
 */
router.get('/requests/:id', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
        `SELECT er.*, u.first_name, u.last_name, u.phone as customer_phone, u.email as customer_email
         FROM engineer_requests er
         LEFT JOIN users u ON er.customer_id = u.id
         WHERE er.id = $1`,
        [id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Заявка не найдена');
    }

    const request = result.rows[0];

    // Get solutions
    const solutionsResult = await query(
        `SELECT * FROM engineer_request_solutions WHERE request_id = $1`,
        [id]
    );

    res.json({
        success: true,
        request: {
            id: request.id,
            category: request.category,
            title: request.title || request.object_name,
            objectName: request.object_name,
            objectAddress: request.object_address,
            description: request.description,
            requirements: request.requirements,
            totalPrice: parseInt(request.total_price) || 0,
            status: request.status,
            deadline: request.deadline,
            createdAt: request.created_at,
            customer: {
                name: `${request.first_name || ''} ${request.last_name || ''}`.trim() || 'Заказчик',
                phone: request.customer_phone,
                email: request.customer_email
            },
            solutions: solutionsResult.rows.map(s => ({
                id: s.id,
                type: s.solution_type,
                name: s.name,
                description: s.description,
                price: parseInt(s.price) || 0
            }))
        }
    });
}));

/**
 * POST /engineers/requests/:id/accept
 * Взять заявку в работу
 */
router.post('/requests/:id/accept', requireRole('engineer', 'admin'), actionLimiter, asyncHandler(async (req, res) => {
    const { id } = req.params;

    await transaction(async (client) => {
        // Check request status
        const requestResult = await client.query(
            `SELECT * FROM engineer_requests WHERE id = $1 FOR UPDATE`,
            [id]
        );

        if (requestResult.rows.length === 0) {
            throw ApiError.notFound('Заявка не найдена');
        }

        const request = requestResult.rows[0];

        if (request.status !== 'open') {
            throw ApiError.badRequest('Заявка уже взята в работу');
        }

        // Update request status
        await client.query(
            `UPDATE engineer_requests SET status = 'assigned', updated_at = NOW() WHERE id = $1`,
            [id]
        );

        // Create project
        const projectResult = await client.query(
            `INSERT INTO engineer_projects 
                (request_id, engineer_id, customer_id, title, object_address, total_price, assigned_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING id`,
            [id, req.user.id, request.customer_id, request.object_name, request.object_address, request.total_price]
        );

        // Notify customer
        await client.query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, 'request_accepted', 'Заявка принята', 'Инженер взял вашу заявку в работу', $2)`,
            [request.customer_id, JSON.stringify({ requestId: id, projectId: projectResult.rows[0].id })]
        );
    });

    res.json({ success: true, message: 'Заявка принята в работу' });
}));

/**
 * GET /engineers/projects
 * Мои проекты
 */
router.get('/projects', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = `WHERE ep.engineer_id = $1`;
    const params = [req.user.id];
    let paramIndex = 2;

    if (status && status !== 'all') {
        whereClause += ` AND ep.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
    }

    params.push(limit, offset);

    const result = await query(
        `SELECT ep.*, u.first_name, u.last_name, u.phone as customer_phone, u.email as customer_email,
            (SELECT COUNT(*) FROM project_files WHERE project_id = ep.id) as files_count,
            (SELECT COUNT(*) FROM project_comments WHERE project_id = ep.id) as comments_count
         FROM engineer_projects ep
         LEFT JOIN users u ON ep.customer_id = u.id
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
            progress: p.progress || 0,
            status: p.status,
            filesCount: parseInt(p.files_count) || 0,
            commentsCount: parseInt(p.comments_count) || 0,
            customer: {
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Заказчик',
                phone: p.customer_phone,
                email: p.customer_email
            },
            createdAt: p.created_at,
            assignedAt: p.assigned_at,
            submittedAt: p.submitted_at
        }))
    });
}));

/**
 * GET /engineers/projects/:id
 * Детали проекта
 */
router.get('/projects/:id', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
        `SELECT ep.*, u.first_name, u.last_name, u.phone as customer_phone, u.email as customer_email
         FROM engineer_projects ep
         LEFT JOIN users u ON ep.customer_id = u.id
         WHERE ep.id = $1 AND ep.engineer_id = $2`,
        [id, req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Проект не найден');
    }

    const project = result.rows[0];

    // Get files
    const filesResult = await query(
        `SELECT pf.*, u.first_name as uploader_name FROM project_files pf
         LEFT JOIN users u ON pf.uploaded_by = u.id
         WHERE pf.project_id = $1 ORDER BY pf.created_at DESC`,
        [id]
    );

    // Get comments
    const commentsResult = await query(
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
            progress: project.progress || 0,
            status: project.status,
            customer: {
                name: `${project.first_name || ''} ${project.last_name || ''}`.trim() || 'Заказчик',
                phone: project.customer_phone,
                email: project.customer_email
            },
            createdAt: project.created_at,
            assignedAt: project.assigned_at,
            submittedAt: project.submitted_at,
            completedAt: project.completed_at,
            files: filesResult.rows.map(f => ({
                id: f.id,
                name: f.name,
                url: f.url,
                type: f.type,
                size: f.size_bytes,
                uploadedBy: f.uploader_name,
                createdAt: f.created_at
            })),
            comments: commentsResult.rows.map(c => ({
                id: c.id,
                author: c.author_name,
                text: c.text,
                createdAt: c.created_at
            }))
        }
    });
}));

/**
 * PATCH /engineers/projects/:id/progress
 * Обновить прогресс проекта
 */
router.patch('/projects/:id/progress', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
        throw ApiError.badRequest('Прогресс должен быть от 0 до 100');
    }

    await query(
        `UPDATE engineer_projects SET progress = $1, updated_at = NOW() 
         WHERE id = $2 AND engineer_id = $3`,
        [progress, id, req.user.id]
    );

    res.json({ success: true, message: 'Прогресс обновлён' });
}));

/**
 * POST /engineers/projects/:id/submit
 * Сдать проект
 */
router.post('/projects/:id/submit', requireRole('engineer', 'admin'), actionLimiter, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;

    await transaction(async (client) => {
        const projectResult = await client.query(
            `SELECT * FROM engineer_projects WHERE id = $1 AND engineer_id = $2 FOR UPDATE`,
            [id, req.user.id]
        );

        if (projectResult.rows.length === 0) {
            throw ApiError.notFound('Проект не найден');
        }

        const project = projectResult.rows[0];

        if (!['in_progress', 'revision'].includes(project.status)) {
            throw ApiError.badRequest('Невозможно сдать проект в текущем статусе');
        }

        // Update status
        await client.query(
            `UPDATE engineer_projects SET status = 'submitted', submitted_at = NOW(), progress = 100, updated_at = NOW()
             WHERE id = $1`,
            [id]
        );

        // Add comment if provided
        if (comment) {
            await client.query(
                `INSERT INTO project_comments (project_id, author_id, author_name, text)
                 VALUES ($1, $2, $3, $4)`,
                [id, req.user.id, `${req.user.firstName} ${req.user.lastName}`, comment]
            );
        }

        // Notify customer
        await client.query(
            `INSERT INTO notifications (user_id, type, title, message, data)
             VALUES ($1, 'project_submitted', 'Проект сдан', 'Инженер сдал проект на проверку', $2)`,
            [project.customer_id, JSON.stringify({ projectId: id })]
        );
    });

    res.json({ success: true, message: 'Проект сдан на проверку' });
}));

/**
 * POST /engineers/projects/:id/comments
 * Добавить комментарий
 */
router.post('/projects/:id/comments', requireRole('engineer', 'admin'), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
        throw ApiError.badRequest('Текст комментария обязателен');
    }

    // Verify ownership
    const projectResult = await query(
        `SELECT * FROM engineer_projects WHERE id = $1 AND engineer_id = $2`,
        [id, req.user.id]
    );

    if (projectResult.rows.length === 0) {
        throw ApiError.notFound('Проект не найден');
    }

    const result = await query(
        `INSERT INTO project_comments (project_id, author_id, author_name, text)
         VALUES ($1, $2, $3, $4)
         RETURNING id, created_at`,
        [id, req.user.id, `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Инженер', text.trim()]
    );

    res.status(201).json({
        success: true,
        comment: {
            id: result.rows[0].id,
            text: text.trim(),
            createdAt: result.rows[0].created_at
        }
    });
}));

/**
 * GET /engineers/specializations
 * Справочник специализаций
 */
router.get('/specializations', asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT code, name, icon, description, category FROM specializations ORDER BY name`
    );

    res.json({
        success: true,
        specializations: result.rows
    });
}));

module.exports = router;
