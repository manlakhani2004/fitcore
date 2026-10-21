const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const cookieOptions = (maxAge) => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge
});

// Helper to generate tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
        { id: user._id, name: user.name },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Check for existing user
        let user = await User.findOne({ email: email.toLowerCase().trim() });
        if (user) {
            return res.status(400).json({ success: false, message: 'User already exists with that email' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        let assignedRole = 'member';
        if (role === 'coach') {
            assignedRole = 'coach';
        }

        // Create user
        user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            passwordHash,
            role: assignedRole
        });

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('token', accessToken, cookieOptions(15 * 60 * 1000))
            .cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000))
            .status(201).json({
                success: true,
                data: { id: user._id, name: user.name, email: user.email, role: user.role }
            });
    } catch (err) {
        console.error('register error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Check for user
        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user);

        // Save refresh token to user
        user.refreshToken = refreshToken;
        await user.save();

        res.cookie('token', accessToken, cookieOptions(15 * 60 * 1000))
            .cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000))
            .status(200).json({
                success: true,
                data: { id: user._id, name: user.name, email: user.email, role: user.role }
            });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
exports.refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken || req.body.refreshToken;
        if (!token) return res.status(401).json({ success: false, message: 'No refresh token provided' });

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshToken !== token) {
            return res.status(401).json({ success: false, message: 'Invalid refresh token' });
        }

        const tokens = generateTokens(user);
        
        user.refreshToken = tokens.refreshToken;
        await user.save();

        res.cookie('token', tokens.accessToken, cookieOptions(15 * 60 * 1000))
            .cookie('refreshToken', tokens.refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000))
            .status(200).json({
                success: true,
                user: { id: user._id, name: user.name, email: user.email, role: user.role }
            });
    } catch (err) {
        console.error(err);
        res.status(401).json({ success: false, message: 'Token refresh failed' });
    }
};

// @desc    Forgot password - generates reset token
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide an email' });
        }

        const user = await User.findOne({ email });

        // Always return success to prevent email enumeration
        if (!user) {
            return res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        console.log(`[AUTH] Password reset token generated for ${email}: ${resetToken}`);

        res.status(200).json({
            success: true,
            message: 'If that email exists, a reset link has been sent.',
            ...(process.env.NODE_ENV !== 'production' && { resetToken })
        });
    } catch (err) {
        console.error('forgotPassword error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Reset password with token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
    try {
        const { password } = req.body;
        const { token } = req.params;

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Check for matching hashed token (or legacy unhashed token for backward compatibility)
        const user = await User.findOne({
            $or: [
                { resetPasswordToken: hashedToken },
                { resetPasswordToken: token }
            ],
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(password, salt);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful. You can now log in.' });
    } catch (err) {
        console.error('resetPassword error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Logout user / clear cookies
// @route   POST /api/auth/logout
// @access  Public
exports.logout = async (req, res) => {
    res.cookie('token', 'none', { ...cookieOptions(0), expires: new Date(Date.now() + 10 * 1000) })
       .cookie('refreshToken', 'none', { ...cookieOptions(0), expires: new Date(Date.now() + 10 * 1000) })
       .status(200).json({ success: true, message: 'Logged out successfully' });
};
