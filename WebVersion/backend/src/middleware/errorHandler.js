/**
 * Error Handler Middleware
 */

/**
 * Custom API Error class
 */
class ApiError extends Error {
    constructor(statusCode, message, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message, details) {
        return new ApiError(400, message, details);
    }

    static unauthorized(message = 'Не авторизован') {
        return new ApiError(401, message);
    }

    static forbidden(message = 'Доступ запрещён') {
        return new ApiError(403, message);
    }

    static notFound(message = 'Не найдено') {
        return new ApiError(404, message);
    }

    static conflict(message, details) {
        return new ApiError(409, message, details);
    }

    static tooMany(message = 'Слишком много запросов') {
        return new ApiError(429, message);
    }

    static internal(message = 'Внутренняя ошибка сервера') {
        return new ApiError(500, message);
    }
}

/**
 * 404 Handler
 */
function notFound(req, res, next) {
    const error = ApiError.notFound(`Маршрут ${req.originalUrl} не найден`);
    next(error);
}

/**
 * Global Error Handler
 */
function errorHandler(err, req, res, next) {
    // Default values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Внутренняя ошибка сервера';
    let details = err.details || null;

    // Log error
    if (statusCode >= 500) {
        console.error('❌ Server Error:', {
            message: err.message,
            stack: err.stack,
            url: req.originalUrl,
            method: req.method,
            body: req.body
        });
    }

    // Handle specific error types
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Недействительный токен';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Токен истёк';
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Ошибка валидации';
        details = err.details;
    }

    // PostgreSQL errors
    if (err.code === '23505') {
        statusCode = 409;
        message = 'Запись уже существует';
    }

    if (err.code === '23503') {
        statusCode = 400;
        message = 'Ссылка на несуществующую запись';
    }

    // Response
    const response = {
        success: false,
        error: {
            message,
            statusCode
        }
    };

    // Include details in development
    if (process.env.NODE_ENV === 'development') {
        response.error.details = details;
        response.error.stack = err.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * Async handler wrapper
 */
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = {
    ApiError,
    notFound,
    errorHandler,
    asyncHandler
};
