const mongoose = require('mongoose');

const MeasurementLogSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    weight: {
        type: Number, // in kg
        required: true
    },
    bodyFat: Number, // percentage
    chest: Number, // in cm
    arms: Number,
    waist: Number,
    thighs: Number
}, { timestamps: true });

module.exports = mongoose.model('MeasurementLog', MeasurementLogSchema);
