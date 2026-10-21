const Payment = require('../models/Payment');

// @desc    Get user's payment history
// @route   GET /api/payments/history
// @access  Private
exports.getPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: payments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Request a refund
// @route   POST /api/payments/refund-request
// @access  Private
exports.requestRefund = async (req, res) => {
    try {
        const { paymentId, reason } = req.body;

        const payment = await Payment.findOne({ _id: paymentId, userId: req.user.id });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        if (payment.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Only completed payments can be refunded' });
        }

        payment.refundStatus = 'requested';
        payment.refundReason = reason;
        await payment.save();

        res.status(200).json({ success: true, data: payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Admin: Get all payments
// @route   GET /api/payments/admin/all
// @access  Private (Admin)
exports.getAllPayments = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const payments = await Payment.find()
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: payments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Admin: Process refund
// @route   PUT /api/payments/admin/refund/:id
// @access  Private (Admin)
exports.processRefund = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const { status } = req.body; // 'approved' or 'rejected'

        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        payment.refundStatus = status;
        if (status === 'approved') {
            payment.status = 'refunded';
            // Here you would also call Stripe API to process the actual refund
        }

        await payment.save();

        res.status(200).json({ success: true, data: payment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
