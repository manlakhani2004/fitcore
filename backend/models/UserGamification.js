const mongoose = require('mongoose');

const UserGamificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    points: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    badges: [{
        name: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    streakDays: {
        type: Number,
        default: 0
    },
    lastActivityDate: {
        type: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('UserGamification', UserGamificationSchema);
