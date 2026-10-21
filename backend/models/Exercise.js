const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    muscleGroups: [String],
    equipment: [String],
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced']
    },
    videoUrl: String,
    thumbnailUrl: String,
    instructions: [String],
    // Default values
    sets: { type: Number, default: 3 },
    reps: { type: Number, default: 10 },
    duration: { type: Number }, // in seconds (for time-based exercises)
    restTime: { type: Number, default: 60 } // in seconds
}, { timestamps: true });

module.exports = mongoose.model('Exercise', ExerciseSchema);
