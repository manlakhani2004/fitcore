const mongoose = require('mongoose');

const DietLogSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    mealsConsumed: [{
        mealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meal'
        },
        servings: {
            type: Number,
            default: 1
        },
        time: {
            type: String
        }
    }],
    totalCalories: {
        type: Number,
        default: 0
    },
    totalMacros: {
        protein: { type: Number, default: 0 },
        carbs: { type: Number, default: 0 },
        fat: { type: Number, default: 0 }
    },
    waterIntake: {
        type: Number, // in ml or glasses
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('DietLog', DietLogSchema);
