const mongoose = require('mongoose');

const MembershipPlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    price: {
        type: Number,
        required: true
    },
    duration: {
        type: Number, // in days
        required: true
    },
    features: [String],
    isActive: {
        type: Boolean,
        default: true
    },
    stripePriceId: {
        type: String,
        // required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('MembershipPlan', MembershipPlanSchema);
