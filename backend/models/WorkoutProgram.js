const mongoose = require('mongoose');

const WorkoutProgramSchema = new mongoose.Schema({
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
    description: String,
    goal: {
        type: String,
        default: 'muscle_gain'
    },
    durationWeeks: {
        type: Number,
        required: true,
        default: 4
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    schedule: [{
        day: Number,
        dayNumber: Number,
        dayName: String,
        exercises: [{
            name: String,
            exerciseId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Exercise'
            },
            sets: Number,
            reps: Number,
            rest: Number,
            restSeconds: Number
        }]
    }]
}, { timestamps: true });

module.exports = mongoose.model('WorkoutProgram', WorkoutProgramSchema);
