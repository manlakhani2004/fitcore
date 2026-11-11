const mongoose = require('mongoose');

const CoachProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: String,
    specializations: [String],
    certifications: [{
        name: String,
        file: String, // URL from Cloudinary
        issuer: String,
        year: Number
    }],
    experience: Number, // in years
    hourlyRate: Number,
    monthlyRate: {
        type: Number,
        default: 150 // default monthly rate for personal coach subscription
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    googleMeetLink: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('CoachProfile', CoachProfileSchema);
