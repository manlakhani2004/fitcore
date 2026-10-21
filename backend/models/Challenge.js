const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    goal: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['workout', 'steps', 'streak', 'calories', 'weight_loss'],
        default: 'workout'
    },
    targetValue: {
        type: Number,
        default: 100
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    participants: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        progress: {
            type: Number,
            default: 0
        }
    }],
    leaderboard: [{
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        name: String,
        progress: {
            type: Number,
            default: 0
        },
        rank: Number
    }],
    bannerUrl: String,
    badgeAwarded: String
}, { timestamps: true });

module.exports = mongoose.model('Challenge', ChallengeSchema);
