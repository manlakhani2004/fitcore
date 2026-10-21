const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    startTime: {
        type: String, // e.g., "14:00"
        required: true
    },
    endTime: {
        type: String, // e.g., "15:00"
        required: true
    },
    type: {
        type: String,
        enum: ['online', 'offline', 'yoga'],
        default: 'online'
    },
    capacity: {
        type: Number,
        default: 1
    },
    enrolledCount: {
        type: Number,
        default: 0
    },
    meetingLink: {
        type: String
    },
    location: {
        type: String
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    notes: {
        type: String
    },
    cancelReason: {
        type: String
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'refunded'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
