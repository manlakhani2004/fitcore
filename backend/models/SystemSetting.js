const mongoose = require('mongoose');

const SystemSettingSchema = new mongoose.Schema({
    platformName: {
        type: String,
        default: 'FitCore'
    },
    supportEmail: {
        type: String,
        default: 'support@fitcore.com'
    },
    currency: {
        type: String,
        default: 'INR'
    },
    stripePublicKey: {
        type: String,
        default: ''
    },
    stripeSecretKey: {
        type: String,
        default: ''
    },
    allowRegistrations: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', SystemSettingSchema);

