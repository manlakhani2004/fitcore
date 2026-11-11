const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getStats,
    getUsers,
    updateUserRole,
    getPendingCoaches,
    approveCoach,
    createPlan,
    updatePlan,
    deletePlan,
    getCoupons,
    createCoupon,
    getSettings,
    updateSettings
} = require('../controllers/adminController');

const router = express.Router();

router.use(protect);

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);
router.get('/coaches/pending', getPendingCoaches);
router.put('/coaches/:id/approve', approveCoach);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

// Membership management
router.post('/memberships/plans', createPlan);
router.put('/memberships/plans/:id', updatePlan);
router.delete('/memberships/plans/:id', deletePlan);
router.get('/memberships/coupons', getCoupons);
router.post('/memberships/coupons', createCoupon);

module.exports = router;
