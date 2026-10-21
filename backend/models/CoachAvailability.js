const mongoose = require('mongoose');

const CoachAvailabilitySchema = new mongoose.Schema({
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User ID of the coach
        required: true
    },
    dayOfWeek: {
        type: Number, // 0 = Sunday, 1 = Monday, etc.
        required: true
    },
    slots: [{
        startTime: String, // HH:mm format
        endTime: String,
        isBooked: {
            type: Boolean,
            default: false
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('CoachAvailability', CoachAvailabilitySchema);
