const User = require('../models/User');
const UserMembership = require('../models/UserMembership');

// @desc    Get platform-wide statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getStats = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const totalUsers = await User.countDocuments();
        const totalCoaches = await User.countDocuments({ role: 'coach' });
        const totalMembers = await User.countDocuments({ role: 'member' });
        
        const activeMemberships = await UserMembership.find({ status: 'active' }).populate('planId');
        let estimatedMRR = 0;
        activeMemberships.forEach(membership => {
            if (membership.planId && membership.planId.price && membership.planId.duration) {
                // Normalize any duration (e.g., 365 days, 30 days) to a monthly equivalent
                estimatedMRR += (membership.planId.price / membership.planId.duration) * 30;
            }
        });
        estimatedMRR = Math.round(estimatedMRR);

        res.status(200).json({ 
            success: true, 
            data: { 
                totalUsers, 
                totalCoaches, 
                totalMembers, 
                estimatedMRR 
            } 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all users for management
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getUsers = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const users = await User.find().select('-password -passwordHash').sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Change a user's role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
exports.updateUserRole = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const { role } = req.body;
        
        if (!['member', 'coach', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true, runValidators: true }
        ).select('-password -passwordHash');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const CoachProfile = require('../models/CoachProfile');

// @desc    Get all pending coach applications
// @route   GET /api/admin/coaches/pending
// @access  Private (Admin)
exports.getPendingCoaches = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const pending = await CoachProfile.find({ isApproved: false })
            .populate('userId', 'name email avatar')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: pending.length, data: pending });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Approve or reject a coach application
// @route   PUT /api/admin/coaches/:id/approve
// @access  Private (Admin)
exports.approveCoach = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized as admin' });
        }

        const { status } = req.body; // 'approve' or 'reject'
        
        if (status === 'reject') {
            // If rejected, you might just delete the profile or mark it rejected
            await CoachProfile.findByIdAndDelete(req.params.id);
            return res.status(200).json({ success: true, message: 'Application rejected' });
        }

        const profile = await CoachProfile.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        ).populate('userId', 'name email');

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Coach profile not found' });
        }

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const MembershipPlan = require('../models/MembershipPlan');
const Coupon = require('../models/Coupon');

// @desc    Create membership plan
// @route   POST /api/admin/memberships/plans
// @access  Private (Admin)
exports.createPlan = async (req, res) => {
    try {
        const plan = await MembershipPlan.create(req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update membership plan
// @route   PUT /api/admin/memberships/plans/:id
// @access  Private (Admin)
exports.updatePlan = async (req, res) => {
    try {
        const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete membership plan
// @route   DELETE /api/admin/memberships/plans/:id
// @access  Private (Admin)
exports.deletePlan = async (req, res) => {
    try {
        const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
        res.status(200).json({ success: true, message: 'Plan deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all coupons
// @route   GET /api/admin/memberships/coupons
// @access  Private (Admin)
exports.getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: coupons });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create coupon
// @route   POST /api/admin/memberships/coupons
// @access  Private (Admin)
exports.createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json({ success: true, data: coupon });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
exports.getSettings = async (req, res) => {
    try {
        const SystemSetting = require('../models/SystemSetting');
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create({
                platformName: process.env.APP_NAME || 'FitCore',
                supportEmail: 'support@fitcore.com',
                stripePublicKey: 'pk_test_sample',
                stripeSecretKey: 'sk_test_placeholder'
            });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
exports.updateSettings = async (req, res) => {
    try {
        const SystemSetting = require('../models/SystemSetting');
        let settings = await SystemSetting.findOne();
        if (!settings) {
            settings = await SystemSetting.create(req.body);
        } else {
            Object.assign(settings, req.body);
            await settings.save();
        }
        res.status(200).json({ success: true, data: settings });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
