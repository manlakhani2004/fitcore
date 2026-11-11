const { rateLimit } = require('express-rate-limit');

// Helper to determine if rate limiting should be skipped
const shouldSkip = (req) => {
    // Skip if not explicitly production
    if (process.env.NODE_ENV !== 'production') return true;
    
    // Skip localhost and internal loopback addresses
    const ip = req.ip || req.connection?.remoteAddress || '';
    if (
        ip === '127.0.0.1' || 
        ip === '::1' || 
        ip === '::ffff:127.0.0.1' || 
        req.hostname === 'localhost' ||
        req.hostname === '127.0.0.1'
    ) {
        return true;
    }

    return false;
};

// General API rate limiter (15 minutes window, generous 10,000 limit in production)
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 10000, // Generous limit for SPAs with background sync
    skip: shouldSkip,
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
    limit: 100, // Limit each IP to 100 authentication attempts per 15 minutes
    skip: shouldSkip,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
});

module.exports = { apiLimiter, authLimiter };
