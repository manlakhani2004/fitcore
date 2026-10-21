const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getPaymentHistory,
    requestRefund,
    getAllPayments,
    processRefund
} = require('../controllers/paymentController');

const router = express.Router();

router.use(protect);

router.get('/history', getPaymentHistory);
router.post('/refund-request', requestRefund);

// Admin routes
router.get('/admin/all', getAllPayments);
router.put('/admin/refund/:id', processRefund);

module.exports = router;
