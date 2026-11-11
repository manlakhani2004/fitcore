const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    let token;
    
    // Check if auth header exists and is valid
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length > 1 && parts[1] && parts[1] !== 'undefined' && parts[1] !== 'null' && parts[1].trim() !== '') {
            token = parts[1].trim();
        }
    }
    
    // Fall back to cookie if no valid token from header
    if (!token && req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (err) {
        // If header token verification failed, attempt fallback to cookie token if present
        if (req.cookies && req.cookies.token && req.cookies.token !== token) {
            try {
                const cookieDecoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
                req.user = cookieDecoded;
                return next();
            } catch (cErr) {
                // fall through to 401
            }
        }
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: `User role ${req.user.role} is not authorized to access this route` });
        }
        next();
    };
};

module.exports = { protect, authorize };
