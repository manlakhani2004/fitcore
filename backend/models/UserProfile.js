const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    avatar: {
        type: String,
        default: null
    },
    dateOfBirth: Date,
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'Prefer not to say']
    },
    phone: String,
    height: Number, // in cm
    weight: Number, // in kg
    bloodType: String,
    allergies: [String],
    fitnessGoals: [{
        type: String,
        enum: ['weight_loss', 'muscle_gain', 'endurance', 'flexibility', 'maintenance']
    }],
    medicalConditions: [String],
    medications: [String],
    bmi: Number,
    bmiCategory: String,
    macroTargets: {
        calories: { type: Number, default: 2500 },
        protein: { type: Number, default: 180 },
        carbs: { type: Number, default: 250 },
        fat: { type: Number, default: 80 }
    }
}, { timestamps: true });

// Pre-save middleware to calculate BMI
UserProfileSchema.pre('save', function(next) {
    if (this.height && this.weight) {
        const heightInMeters = this.height / 100;
        this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
        
        if (this.bmi < 18.5) this.bmiCategory = 'Underweight';
        else if (this.bmi >= 18.5 && this.bmi < 24.9) this.bmiCategory = 'Normal';
        else if (this.bmi >= 25 && this.bmi < 29.9) this.bmiCategory = 'Overweight';
        else this.bmiCategory = 'Obese';
    }
    if (typeof next === 'function') next();
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
