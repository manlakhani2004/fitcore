const mongoose = require('mongoose');

const DailyTaskSchema = new mongoose.Schema({
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    date: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['workout', 'diet', 'habit', 'general'],
        default: 'general'
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: Date,
    notes: String
}, { timestamps: true });

module.exports = mongoose.model('DailyTask', DailyTaskSchema);
