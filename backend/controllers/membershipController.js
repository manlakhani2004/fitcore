const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const MembershipPlan = require('../models/MembershipPlan');
const UserMembership = require('../models/UserMembership');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');

// @desc    Get all active membership plans
// @route   GET /api/memberships/plans
// @access  Public
exports.getPlans = async (req, res) => {
    try {
        const plans = await MembershipPlan.find({ isActive: true });
        res.status(200).json({ success: true, data: plans });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get user's current membership
// @route   GET /api/memberships/my-membership
// @access  Private
exports.getMyMembership = async (req, res) => {
    try {
        const membership = await UserMembership.findOne({ userId: req.user.id, status: 'active' }).populate('planId');
        if (!membership) {
            return res.status(404).json({ success: false, message: 'No active membership found' });
        }
        res.status(200).json({ success: true, data: membership });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create Stripe Checkout Session for purchase
// @route   POST /api/memberships/purchase
// @access  Private
exports.purchaseMembership = async (req, res) => {
    try {
        const { planId, couponCode } = req.body;

        const plan = await MembershipPlan.findById(planId);
        if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

        let discount = 0;
        let coupon = null;

        if (couponCode) {
            coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), expiresAt: { $gt: Date.now() } });
            if (coupon && coupon.usedCount < coupon.usageLimit) {
                if (coupon.discountType === 'percent') {
                    discount = (plan.price * coupon.value) / 100;
                } else {
                    discount = coupon.value;
                }
            } else {
                return res.status(400).json({ success: false, message: 'Invalid or expired coupon' });
            }
        }

        const finalPrice = Math.max(0, plan.price - discount);

        // Check if Stripe is configured or running dummy test key
        if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('sk_test_dummy')) {
            // MOCK / LOCAL DEV FLOW: Immediately activate membership & create Payment record
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
            
            const membership = await UserMembership.create({
                userId: req.user.id,
                planId: plan._id,
                startDate,
                endDate,
                status: 'active',
                discountApplied: discount > 0
            });

            await Payment.create({
                userId: req.user.id,
                type: 'membership',
                amount: finalPrice,
                currency: 'usd',
                status: 'completed',
                refundStatus: 'none',
                stripePaymentId: `mock_pay_${Date.now()}`
            });

            if (coupon) {
                coupon.usedCount += 1;
                await coupon.save();
            }

            return res.status(200).json({ success: true, url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/member/profile?payment=success` });
        }

        // Real Stripe Checkout Flow
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: plan.name,
                            description: plan.description || `${plan.duration} days membership plan`,
                        },
                        unit_amount: Math.round(finalPrice * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/member/profile?payment=success`,
            cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/member/membership?payment=cancelled`,
            client_reference_id: req.user.id.toString(),
            metadata: {
                planId: plan._id.toString(),
                couponCode: coupon ? coupon.code : ''
            }
        });

        res.status(200).json({ success: true, url: session.url });
    } catch (err) {
        console.error('purchaseMembership error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Apply coupon validation
// @route   POST /api/memberships/apply-coupon
// @access  Private
exports.applyCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Coupon code is required' });
        
        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) return res.status(404).json({ success: false, message: 'Invalid coupon code' });
        if (coupon.expiresAt && coupon.expiresAt < Date.now()) return res.status(400).json({ success: false, message: 'Coupon expired' });
        if (coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });

        res.status(200).json({ success: true, data: coupon });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Cancel membership
// @route   POST /api/memberships/cancel
// @access  Private
exports.cancelMembership = async (req, res) => {
    try {
        const membership = await UserMembership.findOne({ userId: req.user.id, status: 'active' });
        if (!membership) {
            return res.status(404).json({ success: false, message: 'No active membership found' });
        }
        
        membership.status = 'cancelled';
        await membership.save();

        res.status(200).json({ success: true, message: 'Subscription cancelled successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Stripe Webhook
// @route   POST /api/memberships/webhook
// @access  Public
exports.stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planId = session.metadata.planId;

        const plan = await MembershipPlan.findById(planId);
        if (plan) {
            const startDate = new Date();
            const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

            await UserMembership.create({
                userId,
                planId,
                startDate,
                endDate,
                status: 'active'
            });

            await Payment.create({
                userId,
                type: 'membership',
                amount: (session.amount_total || (plan.price * 100)) / 100,
                currency: session.currency || 'usd',
                stripePaymentId: session.payment_intent || session.id,
                status: 'completed',
                refundStatus: 'none'
            });
        }
    }

    res.status(200).json({ received: true });
};
