/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { ApiError } = require('./errorHandler');
const { query } = require('../database/connection');

/**
 * Verify JWT Token
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        let token = null;

        // 1. Проверяем Authorization header (API-клиенты)
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        }
        // 2. Fallback — читаем из HttpOnly cookie (браузер)
        else if (req.cookies && req.cookies.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            throw ApiError.unauthorized('Токен не предоставлен');
        }

        try {
            const decoded = jwt.verify(token, config.jwt.secret);

            if (decoded.type !== 'access') {
                throw ApiError.unauthorized('Неверный тип токена');
            }

            // Get user from database
            const result = await query(
                `SELECT id, phone, email, first_name, last_name, role, is_active, is_verified
                 FROM users WHERE id = $1`,
                [decoded.userId]
            );

            if (result.rows.length === 0) {
                throw ApiError.unauthorized('Пользователь не найден');
            }

            const user = result.rows[0];

            if (!user.is_active) {
                throw ApiError.forbidden('Аккаунт деактивирован');
            }

            req.user = {
                id: user.id,
                phone: user.phone,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isVerified: user.is_verified
            };

            next();

        } catch (err) {
            if (err.name === 'TokenExpiredError') {
                throw ApiError.unauthorized('Токен истёк');
            }
            if (err.name === 'JsonWebTokenError') {
                throw ApiError.unauthorized('Недействительный токен');
            }
            throw err;
        }

    } catch (error) {
        next(error);
    }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const hasCookie = req.cookies && req.cookies.accessToken;

        if ((!authHeader || !authHeader.startsWith('Bearer ')) && !hasCookie) {
            req.user = null;
            return next();
        }

        await authenticate(req, res, next);

    } catch (error) {
        // Don't fail, just continue without user
        req.user = null;
        next();
    }
}

/**
 * Require specific role(s)
 */
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized());
        }

        if (!roles.includes(req.user.role)) {
            return next(ApiError.forbidden(`Требуется роль: ${roles.join(' или ')}`));
        }

        next();
    };
}

/**
 * Require any of the specified roles or ownership
 */
function requireRoleOrOwner(ownerIdField, ...roles) {
    return async (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized());
        }

        // Check if admin or allowed role
        if (roles.includes(req.user.role) || req.user.role === 'admin') {
            return next();
        }

        // Check ownership (implementation depends on context)
        // This is typically overridden in specific routes

        next(ApiError.forbidden('Нет доступа'));
    };
}

/**
 * Generate JWT Access Token
 */
function generateAccessToken(userId, role = 'customer') {
    return jwt.sign(
        { userId, role, type: 'access' },
        config.jwt.secret,
        { expiresIn: config.jwt.accessExpiresIn }
    );
}

/**
 * Generate JWT Refresh Token
 */
function generateRefreshToken(userId, role = 'customer') {
    return jwt.sign(
        { userId, role, type: 'refresh', jti: Date.now().toString() },
        config.jwt.secret,
        { expiresIn: config.jwt.refreshExpiresIn }
    );
}

/**
 * Verify Refresh Token
 */
function verifyRefreshToken(token) {
    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        if (decoded.type !== 'refresh') {
            return null;
        }
        return decoded;
    } catch (error) {
        return null;
    }
}

module.exports = {
    authenticate,
    optionalAuth,
    requireRole,
    requireRoleOrOwner,
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};
