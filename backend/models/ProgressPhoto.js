const mongoose = require('mongoose');

const ProgressPhotoSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    frontUrl: String, // Cloudinary URLs
    sideUrl: String,
    backUrl: String
}, { timestamps: true });

module.exports = mongoose.model('ProgressPhoto', ProgressPhotoSchema);
