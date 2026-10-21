const mongoose = require('mongoose');

const ClientAssignmentSchema = new mongoose.Schema({
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // A client can only have one active coach assignment at a time in this schema
    },
    status: {
        type: String,
        enum: ['active', 'paused', 'completed'],
        default: 'active'
    },
    coachNotes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('ClientAssignment', ClientAssignmentSchema);
