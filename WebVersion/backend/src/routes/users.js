/**
 * Users Routes
 */

const express = require('express');
const { query } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

/**
 * GET /users/profile
 */
router.get('/profile', asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT u.*, up.* FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Пользователь не найден');
    }

    const user = result.rows[0];

    res.json({
        success: true,
        profile: {
            id: user.id,
            phone: user.phone,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar_url,
            role: user.role,
            isVerified: user.is_verified,
            city: user.city,
            address: user.address,
            isCompany: user.is_company,
            companyName: user.company_name,
            inn: user.inn,
            description: user.description,
            rating: parseFloat(user.rating) || 0,
            reviewsCount: user.reviews_count || 0,
            createdAt: user.created_at
        }
    });
}));

/**
 * PUT /users/profile
 */
router.put('/profile', asyncHandler(async (req, res) => {
    const { firstName, lastName, email, city, address, isCompany, companyName, inn, description } = req.body;

    // Update users table
    await query(
        `UPDATE users SET 
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            email = COALESCE($3, email)
         WHERE id = $4`,
        [firstName, lastName, email, req.user.id]
    );

    // Update user_profiles
    await query(
        `INSERT INTO user_profiles (user_id, city, address, is_company, company_name, inn, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
            city = COALESCE($2, user_profiles.city),
            address = COALESCE($3, user_profiles.address),
            is_company = COALESCE($4, user_profiles.is_company),
            company_name = COALESCE($5, user_profiles.company_name),
            inn = COALESCE($6, user_profiles.inn),
            description = COALESCE($7, user_profiles.description)`,
        [req.user.id, city, address, isCompany, companyName, inn, description]
    );

    res.json({ success: true, message: 'Профиль обновлён' });
}));

/**
 * GET /users/:id (public profile)
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await query(
        `SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.role, u.is_verified, u.rating, u.reviews_count, u.created_at,
            up.city, up.is_company, up.company_name, up.description, up.experience_years
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1 AND u.is_active = TRUE`,
        [id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Пользователь не найден');
    }

    const user = result.rows[0];

    // Get specializations
    const specs = await query(
        `SELECT s.code, s.name, s.icon FROM specializations s
         JOIN user_specializations us ON s.id = us.specialization_id
         WHERE us.user_id = $1`,
        [id]
    );

    // Get reviews
    const reviews = await query(
        `SELECT r.rating, r.comment, r.created_at, u.first_name, u.last_name
         FROM reviews r
         LEFT JOIN users u ON r.reviewer_id = u.id
         WHERE r.reviewee_id = $1
         ORDER BY r.created_at DESC LIMIT 10`,
        [id]
    );

    res.json({
        success: true,
        user: {
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Пользователь',
            avatar: user.avatar_url,
            role: user.role,
            isVerified: user.is_verified,
            rating: parseFloat(user.rating) || 0,
            reviewsCount: user.reviews_count || 0,
            city: user.city,
            isCompany: user.is_company,
            companyName: user.company_name,
            description: user.description,
            experienceYears: user.experience_years,
            specializations: specs.rows,
            reviews: reviews.rows.map(r => ({
                rating: r.rating,
                comment: r.comment,
                author: `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Клиент',
                createdAt: r.created_at
            })),
            memberSince: user.created_at
        }
    });
}));

module.exports = router;
