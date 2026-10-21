const mongoose = require('mongoose');

const DietPlanSchema = new mongoose.Schema({
    coachId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    name: {
        type: String,
        required: true
    },
    goal: {
        type: String,
        default: 'maintenance'
    },
    caloriesTarget: {
        type: Number,
        required: true
    },
    macrosTarget: {
        protein: Number,
        carbs: Number,
        fat: Number
    },
    meals: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meal'
    }]
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', DietPlanSchema);
