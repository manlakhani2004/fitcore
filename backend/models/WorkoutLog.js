const mongoose = require('mongoose');

const WorkoutLogSchema = new mongoose.Schema({
    memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    programId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WorkoutProgram'
    },
    date: {
        type: Date,
        default: Date.now
    },
    exercisesCompleted: [{
        exerciseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise'
        },
        setsCompleted: Number,
        repsCompleted: Number,
        weightUsed: Number // optional
    }],
    totalDuration: Number, // in minutes
    caloriesBurned: Number,
    totalVolume: {
        type: Number,
        default: 0
    },
    notes: String,
    completionPercent: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLog', WorkoutLogSchema);
