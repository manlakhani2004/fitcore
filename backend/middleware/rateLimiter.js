const { rateLimit } = require('express-rate-limit');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 500, // Limit each IP to 500 requests per window
    skip: () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

// Stricter rate limiter for authentication routes (login, register, forgot password)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 30, // Limit each IP to 30 authentication attempts per 15 minutes
    skip: () => process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
});

module.exports = { apiLimiter, authLimiter };
