const mongoose = require('mongoose');

const WeeklyCheckInSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    weight: {
        type: Number,
        required: true
    },
    sleepHours: {
        type: Number,
        default: 7
    },
    sleepQuality: {
        type: Number,
        min: 1,
        max: 5,
        default: 4
    },
    energyLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 4
    },
    stressLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 2
    },
    dietAdherence: {
        type: String,
        enum: ['100% On Plan', '80-90% Moderate', '<80% Off Track'],
        default: '100% On Plan'
    },
    workoutsCompleted: {
        type: Number,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    coachFeedback: {
        type: String,
        default: ''
    },
    coachFeedbackDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['submitted', 'reviewed'],
        default: 'submitted'
    }
}, { timestamps: true });

module.exports = mongoose.model('WeeklyCheckIn', WeeklyCheckInSchema);

