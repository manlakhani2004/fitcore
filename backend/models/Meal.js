const mongoose = require('mongoose');

const MealSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack']
    },
    calories: {
        type: Number,
        required: true
    },
    protein: {
        type: Number,
        required: true
    },
    carbs: {
        type: Number,
        required: true
    },
    fat: {
        type: Number,
        required: true
    },
    recipe: String,
    imageUrl: String
}, { timestamps: true });

module.exports = mongoose.model('Meal', MealSchema);
