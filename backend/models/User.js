const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'coach', 'member'],
        default: 'member'
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    avatar: String,
    bio: {
        type: String,
        maxlength: 250,
        default: ''
    },
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    emailVerifyToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    refreshToken: String
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
