const mongoose = require('mongoose');

const UserMembershipSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    planId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MembershipPlan',
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active'
    },
    stripeSubscriptionId: String,
    autoRenew: {
        type: Boolean,
        default: true
    },
    discountApplied: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model('UserMembership', UserMembershipSchema);
