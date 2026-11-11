const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Load Models
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const CoachProfile = require('../models/CoachProfile');
const ClientAssignment = require('../models/ClientAssignment');
const Payment = require('../models/Payment');
const MeasurementLog = require('../models/MeasurementLog');
const CoachAvailability = require('../models/CoachAvailability');
const WorkoutProgram = require('../models/WorkoutProgram');
const DietPlan = require('../models/DietPlan');
const SystemSetting = require('../models/SystemSetting');
const Exercise = require('../models/Exercise');

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

const seedDB = async () => {
    try {
        console.log('Clearing database...');
        await User.deleteMany();
        await UserProfile.deleteMany();
        await CoachProfile.deleteMany();
        await ClientAssignment.deleteMany();
        await Payment.deleteMany();
        await MeasurementLog.deleteMany();
        await CoachAvailability.deleteMany();
        await WorkoutProgram.deleteMany();
        await DietPlan.deleteMany();
        await SystemSetting.deleteMany();

        console.log('Database cleared!');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('man@1610', salt);

        console.log('Creating users...');
        
        // 1. Create Admin
        const admin = await User.create({
            name: 'Man Lakhani',
            email: 'manblakhani@gmail.com',
            passwordHash,
            role: 'admin',
            isEmailVerified: true
        });

        // 2. Create Coaches
        const coachesData = [
            { name: 'Anjali Sutariya', email: 'anjalisutariya232@gmail.com', role: 'coach', specializations: ['Weight Loss', 'HIIT'] },
            { name: 'Mike Tyson', email: 'mike@fitcore.com', role: 'coach', specializations: ['Boxing', 'Endurance'] },
            { name: 'Elena Rostova', email: 'elena@fitcore.com', role: 'coach', specializations: ['Flexibility'], isApproved: false }
        ];

        const coaches = [];
        for (const data of coachesData) {
            const user = await User.create({
                name: data.name,
                email: data.email,
                passwordHash,
                role: 'coach',
                isEmailVerified: true
            });
            coaches.push(user);
            await CoachProfile.create({
                userId: user._id,
                bio: `Professional coach specializing in ${data.specializations.join(', ')}`,
                specializations: data.specializations,
                experience: Math.floor(Math.random() * 10) + 1,
                hourlyRate: Math.floor(Math.random() * 50) + 50,
                isApproved: data.isApproved !== false,
                averageRating: (Math.random() * 2 + 3).toFixed(1),
                totalReviews: Math.floor(Math.random() * 100) + 10
            });
        }

        // 3. Create Members
        const membersData = [
            { name: 'Bhargavi', email: 'bhargavi@gmail.com' },
            { name: 'Harsh', email: 'harsh@gmail.com' },
            { name: 'David Goggins', email: 'david@fitcore.com' },
            { name: 'Chris Bumstead', email: 'chris@fitcore.com' }
        ];

        const members = [];
        for (const data of membersData) {
            const user = await User.create({
                name: data.name,
                email: data.email,
                passwordHash,
                role: 'member',
                isEmailVerified: true
            });
            members.push(user);
            await UserProfile.create({
                userId: user._id,
                height: 180,
                weight: 80,
                fitnessGoals: ['muscle_gain', 'endurance'],
                bmi: 24.7,
                bmiCategory: 'Normal'
            });
        }

        console.log('Creating Client Assignments...');
        // Assign first two members to Sarah Connor
        await ClientAssignment.create([
            { coachId: coaches[0]._id, clientId: members[0]._id, status: 'active' },
            { coachId: coaches[0]._id, clientId: members[1]._id, status: 'active' }
        ]);

        console.log('Creating Payments...');
        // Add some payments for member 0
        await Payment.create([
            {
                userId: members[0]._id,
                stripeSessionId: 'sess_1234',
                stripePaymentIntentId: 'pi_1234',
                amount: 19.99,
                currency: 'usd',
                status: 'completed',
                type: 'membership',
                description: 'Pro Membership',
                refundStatus: 'none',
                createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            },
            {
                userId: members[0]._id,
                stripeSessionId: 'sess_5678',
                stripePaymentIntentId: 'pi_5678',
                amount: 19.99,
                currency: 'usd',
                status: 'completed',
                type: 'membership',
                description: 'Pro Membership',
                refundStatus: 'requested',
                refundReason: 'Accidental double charge',
                createdAt: new Date()
            }
        ]);

        console.log('Creating Measurement Logs...');
        const logDates = [
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
            new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            new Date()
        ];
        
        let weight = 85;
        let bodyFat = 20;

        for (const date of logDates) {
            await MeasurementLog.create({
                memberId: members[0]._id,
                date: date,
                weight: weight,
                bodyFat: bodyFat,
                chest: 40,
                arms: 15,
                waist: 34,
                thighs: 22
            });
            weight -= 1; // Losing weight over time
            bodyFat -= 0.5;
        }

        console.log('Creating Coach Availability...');
        const standardSlots = [
            { startTime: '09:00', endTime: '10:00', isBooked: false },
            { startTime: '10:00', endTime: '11:00', isBooked: false },
            { startTime: '11:00', endTime: '12:00', isBooked: false },
            { startTime: '14:00', endTime: '15:00', isBooked: false },
            { startTime: '15:00', endTime: '16:00', isBooked: false },
            { startTime: '16:00', endTime: '17:00', isBooked: false }
        ];

        for (const coach of [coaches[0], coaches[1]]) {
            for (let day = 0; day <= 6; day++) {
                await CoachAvailability.create({
                    coachId: coach._id,
                    dayOfWeek: day,
                    slots: standardSlots
                });
            }
        }

        console.log('Creating Sample Workout Program & Diet Plan for Member 1...');
        await WorkoutProgram.create({
            coachId: coaches[0]._id,
            assignedTo: members[0]._id,
            name: '12-Week Hypertrophy & Strength',
            description: 'Custom coach-designed progression focused on compound lifts and progressive overload.',
            goal: 'muscle_gain',
            durationWeeks: 12,
            difficulty: 'intermediate',
            schedule: [
                {
                    day: 1,
                    dayNumber: 1,
                    dayName: 'Upper Body Power',
                    exercises: [
                        { name: 'Barbell Bench Press', sets: 4, reps: 8, restSeconds: 90 },
                        { name: 'Bent-Over Barbell Row', sets: 4, reps: 10, restSeconds: 90 },
                        { name: 'Overhead Dumbbell Press', sets: 3, reps: 10, restSeconds: 60 },
                        { name: 'Incline Dumbbell Curl', sets: 3, reps: 12, restSeconds: 60 }
                    ]
                },
                {
                    day: 2,
                    dayNumber: 2,
                    dayName: 'Lower Body Strength',
                    exercises: [
                        { name: 'Barbell Back Squat', sets: 4, reps: 6, restSeconds: 120 },
                        { name: 'Romanian Deadlift', sets: 3, reps: 10, restSeconds: 90 },
                        { name: 'Walking Lunges', sets: 3, reps: 12, restSeconds: 60 },
                        { name: 'Hanging Leg Raises', sets: 3, reps: 15, restSeconds: 45 }
                    ]
                },
                {
                    day: 3,
                    dayNumber: 3,
                    dayName: 'Active Recovery & Core',
                    exercises: [
                        { name: 'Plank Hold', sets: 3, reps: 60, restSeconds: 45 },
                        { name: 'Bicycle Crunches', sets: 3, reps: 20, restSeconds: 45 }
                    ]
                },
                {
                    day: 4,
                    dayNumber: 4,
                    dayName: 'Push Hypertrophy',
                    exercises: [
                        { name: 'Incline Dumbbell Press', sets: 4, reps: 10, restSeconds: 90 },
                        { name: 'Dumbbell Lateral Raises', sets: 4, reps: 15, restSeconds: 60 },
                        { name: 'Cable Tricep Pushdown', sets: 3, reps: 12, restSeconds: 60 }
                    ]
                },
                {
                    day: 5,
                    dayNumber: 5,
                    dayName: 'Pull & Conditioning',
                    exercises: [
                        { name: 'Lat Pulldown', sets: 4, reps: 10, restSeconds: 75 },
                        { name: 'Leg Press', sets: 3, reps: 12, restSeconds: 90 },
                        { name: 'Battle Ropes', sets: 3, reps: 30, restSeconds: 60 }
                    ]
                }
            ]
        });

        await DietPlan.create({
            coachId: coaches[0]._id,
            assignedTo: members[0]._id,
            name: 'Lean Bulk High-Protein Protocol',
            goal: 'muscle_gain',
            caloriesTarget: 2600,
            macrosTarget: {
                protein: 180,
                carbs: 280,
                fat: 75
            }
        });

        console.log('Seeding Default System Settings...');
        await SystemSetting.findOneAndUpdate(
            {},
            {
                platformName: 'FitCore',
                supportEmail: 'support@fitcore.com',
                currency: 'INR',
                allowRegistrations: true
            },
            { upsert: true, new: true }
        );

        console.log('Seeding Exercise Library...');
        const { exercises } = require('./seedExercises');
        await Exercise.deleteMany();
        await Exercise.insertMany(exercises);

        console.log('Data successfully seeded!');
        console.log('--- TEST ACCOUNTS (Password: man@1610) ---');
        console.log('Admin:', admin.email);
        console.log('Coach (Approved):', coaches[0].email);
        console.log('Coach (Pending):', coaches[2].email);
        console.log('Member 1:', members[0].email);
        console.log('Member 2:', members[1].email);
        
        process.exit();
    } catch (error) {
        console.error('Error with data import', error);
        process.exit(1);
    }
};

seedDB();
