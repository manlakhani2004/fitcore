const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getPlans,
    getMyMembership,
    purchaseMembership,
    applyCoupon,
    cancelMembership
} = require('../controllers/membershipController');

const router = express.Router();

// Public routes
router.get('/plans', getPlans);

// Webhook is mounted in server.js to use express.raw()

// Protected routes
router.use(protect);
router.get('/my-membership', getMyMembership);
router.post('/purchase', purchaseMembership);
router.post('/apply-coupon', applyCoupon);
router.post('/cancel', cancelMembership);

module.exports = router;
