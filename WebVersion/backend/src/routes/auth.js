/**
 * Authentication Routes
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { query, transaction } = require('../database/connection');
const { ApiError, asyncHandler } = require('../middleware/errorHandler');
const { authLimiter } = require('../middleware/rateLimiter');
const {
    authenticate,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
} = require('../middleware/auth');
const config = require('../config');

const router = express.Router();

// ========== COOKIE HELPERS ==========
const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    path: '/'
};

function setTokenCookies(res, accessToken, refreshToken) {
    // Access token — короткий срок (15 мин)
    res.cookie('accessToken', accessToken, {
        ...COOKIE_OPTIONS,
        maxAge: 15 * 60 * 1000 // 15 minutes
    });
    // Refresh token — длинный срок (30 дней)
    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            ...COOKIE_OPTIONS,
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
    }
}

function clearTokenCookies(res) {
    res.clearCookie('accessToken', { ...COOKIE_OPTIONS });
    res.clearCookie('refreshToken', { ...COOKIE_OPTIONS });
}

// Twilio client (optional)
let twilioClient = null;
if (config.twilio.accountSid && config.twilio.authToken) {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhone(phone) {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('8') && cleaned.length === 11) {
        cleaned = '+7' + cleaned.slice(1);
    }
    if (!cleaned.startsWith('+')) {
        cleaned = '+' + cleaned;
    }
    return cleaned;
}

/**
 * Generate 6-digit OTP
 */
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /auth/send-code
 * Send OTP via WhatsApp/SMS
 */
router.post('/send-code', authLimiter, asyncHandler(async (req, res) => {
    const { phone, method = 'whatsapp' } = req.body;

    if (!phone) {
        throw ApiError.badRequest('Номер телефона обязателен');
    }

    const normalizedPhone = normalizePhone(phone);

    if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
        throw ApiError.badRequest('Неверный формат номера телефона');
    }

    // Check for recent OTP
    const existing = await query(
        `SELECT * FROM otp_codes WHERE phone = $1 AND expires_at > NOW() AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedPhone]
    );

    if (existing.rows.length > 0) {
        const lastOtp = existing.rows[0];
        const secondsAgo = (Date.now() - new Date(lastOtp.created_at).getTime()) / 1000;
        if (secondsAgo < 60) {
            throw ApiError.tooMany(`Подождите ${Math.ceil(60 - secondsAgo)} сек. перед повторной отправкой`);
        }
    }

    // Generate and save OTP
    const code = generateOTP();
    await query(
        `INSERT INTO otp_codes (phone, code, expires_at) VALUES ($1, $2, NOW() + INTERVAL '5 minutes')`,
        [normalizedPhone, code]
    );

    // Send via Twilio (or log in dev mode)
    let sendResult = { success: true, method: 'demo' };

    if (twilioClient && config.env !== 'development') {
        try {
            if (method === 'whatsapp') {
                await twilioClient.messages.create({
                    from: config.twilio.whatsappFrom,
                    to: `whatsapp:${normalizedPhone}`,
                    body: `🔐 Ваш код подтверждения для QAZGOST AI: *${code}*\n\nКод действителен 5 минут.`
                });
                sendResult.method = 'whatsapp';
            } else {
                await twilioClient.messages.create({
                    from: config.twilio.smsFrom,
                    to: normalizedPhone,
                    body: `QAZGOST AI: Ваш код подтверждения: ${code}. Код действителен 5 минут.`
                });
                sendResult.method = 'sms';
            }
        } catch (error) {
            console.error('Twilio error:', error.message);
            // Fallback: still allow in development
            if (config.env !== 'development') {
                throw ApiError.internal('Не удалось отправить код');
            }
        }
    }

    const response = {
        success: true,
        method: sendResult.method,
        message: `Код отправлен ${sendResult.method === 'whatsapp' ? 'в WhatsApp' : 'по SMS'}`
    };

    // Include code in development mode
    if (config.env === 'development') {
        response.devCode = code;
    }

    res.json(response);
}));

/**
 * POST /auth/verify-code
 * Verify OTP and authenticate
 */
router.post('/verify-code', authLimiter, asyncHandler(async (req, res) => {
    const { phone, code, role = 'customer' } = req.body;

    if (!phone || !code) {
        throw ApiError.badRequest('Телефон и код обязательны');
    }

    const normalizedPhone = normalizePhone(phone);
    const validRoles = ['customer', 'executor', 'engineer'];
    const userRole = validRoles.includes(role) ? role : 'customer';

    // Find valid OTP
    const otpResult = await query(
        `SELECT * FROM otp_codes 
         WHERE phone = $1 AND expires_at > NOW() AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1`,
        [normalizedPhone]
    );

    if (otpResult.rows.length === 0) {
        throw ApiError.badRequest('Код не найден или истёк. Запросите новый код.');
    }

    const otp = otpResult.rows[0];

    // Check attempts
    if (otp.attempts >= otp.max_attempts) {
        await query(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [otp.id]);
        throw ApiError.badRequest('Превышено количество попыток. Запросите новый код.');
    }

    // Verify code
    if (otp.code !== code) {
        await query(`UPDATE otp_codes SET attempts = attempts + 1 WHERE id = $1`, [otp.id]);
        const remaining = otp.max_attempts - otp.attempts - 1;
        throw ApiError.badRequest(`Неверный код. Осталось попыток: ${remaining}`);
    }

    // Mark OTP as used
    await query(`UPDATE otp_codes SET used_at = NOW() WHERE id = $1`, [otp.id]);

    // Find or create user
    let userId;
    const userResult = await query(`SELECT id, role FROM users WHERE phone = $1`, [normalizedPhone]);

    if (userResult.rows.length === 0) {
        // Create new user
        const newUser = await query(
            `INSERT INTO users (phone, role) VALUES ($1, $2) RETURNING id`,
            [normalizedPhone, userRole]
        );
        userId = newUser.rows[0].id;

        // Create empty wallet
        await query(`INSERT INTO wallets (user_id) VALUES ($1)`, [userId]);

        // Create profile
        await query(`INSERT INTO user_profiles (user_id) VALUES ($1)`, [userId]);
    } else {
        userId = userResult.rows[0].id;
        // Update role if different
        if (userResult.rows[0].role !== userRole) {
            await query(`UPDATE users SET role = $1 WHERE id = $2`, [userRole, userId]);
        }
    }

    // Generate tokens
    const accessToken = generateAccessToken(userId, userRole);
    const refreshToken = generateRefreshToken(userId, userRole);

    // Save refresh token
    await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
        [userId, bcrypt.hashSync(refreshToken, 10)]
    );

    // Set tokens in HttpOnly cookies
    setTokenCookies(res, accessToken, refreshToken);

    res.json({
        success: true,
        message: 'Авторизация успешна',
        user: {
            id: userId,
            phone: normalizedPhone,
            role: userRole
        },
        // Токены передаются ТОЛЬКО через HttpOnly cookies (setTokenCookies выше)
        // НЕ отправляем в JSON body для защиты от XSS
        expiresIn: 900 // 15 minutes
    });
}));

/**
 * POST /auth/refresh
 * Refresh access token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
    // Читаем refresh token из HttpOnly cookie (приоритет) или body (fallback для API-клиентов)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
        throw ApiError.badRequest('Refresh token обязателен');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
        throw ApiError.unauthorized('Недействительный refresh token');
    }

    // Check if token exists and not revoked
    const tokenResult = await query(
        `SELECT rt.*, u.role FROM refresh_tokens rt
         JOIN users u ON rt.user_id = u.id
         WHERE rt.user_id = $1 AND rt.revoked_at IS NULL AND rt.expires_at > NOW()
         ORDER BY rt.created_at DESC LIMIT 10`,
        [decoded.userId]
    );

    // Find matching token
    let validToken = null;
    for (const row of tokenResult.rows) {
        if (bcrypt.compareSync(refreshToken, row.token_hash)) {
            validToken = row;
            break;
        }
    }

    if (!validToken) {
        throw ApiError.unauthorized('Refresh token не найден или отозван');
    }

    // Revoke old token (rotation)
    await query(`UPDATE refresh_tokens SET revoked_at = NOW() WHERE id = $1`, [validToken.id]);

    // Generate new tokens
    const newAccessToken = generateAccessToken(decoded.userId, validToken.role);
    const newRefreshToken = generateRefreshToken(decoded.userId, validToken.role);

    // Save new refresh token
    await query(
        `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 days')`,
        [decoded.userId, bcrypt.hashSync(newRefreshToken, 10)]
    );

    // Set new tokens in HttpOnly cookies
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({
        success: true,
        // Токены передаются ТОЛЬКО через HttpOnly cookies
        expiresIn: 900
    });
}));

/**
 * POST /auth/logout
 * Revoke refresh token
 */
router.post('/logout', asyncHandler(async (req, res) => {
    // Читаем refresh token из cookie (приоритет) или body (fallback)
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
        const decoded = verifyRefreshToken(refreshToken);
        if (decoded) {
            // Revoke all tokens for this user
            await query(
                `UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL`,
                [decoded.userId]
            );
        }
    }

    // Clear token cookies
    clearTokenCookies(res);

    res.json({ success: true, message: 'Выход выполнен' });
}));

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const result = await query(
        `SELECT u.*, up.city, up.company_name, up.is_company, up.experience_years, up.hourly_rate
         FROM users u
         LEFT JOIN user_profiles up ON u.id = up.user_id
         WHERE u.id = $1`,
        [req.user.id]
    );

    if (result.rows.length === 0) {
        throw ApiError.notFound('Пользователь не найден');
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
        user: {
            id: user.id,
            phone: user.phone,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            avatar: user.avatar_url,
            role: user.role,
            isVerified: user.is_verified,
            rating: parseFloat(user.rating) || 0,
            reviewsCount: user.reviews_count,
            city: user.city,
            isCompany: user.is_company,
            companyName: user.company_name,
            experienceYears: user.experience_years,
            hourlyRate: user.hourly_rate,
            specializations: specsResult.rows,
            createdAt: user.created_at
        }
    });
}));

module.exports = router;
