const Exercise = require('../models/Exercise');
const WorkoutProgram = require('../models/WorkoutProgram');
const WorkoutLog = require('../models/WorkoutLog');

// @desc    Get all exercises
// @route   GET /api/workouts/exercises
// @access  Private
exports.getExercises = async (req, res) => {
    try {
        const { muscleGroup, difficulty, equipment } = req.query;
        let query = {};
        
        if (muscleGroup) query.muscleGroups = { $in: [muscleGroup] };
        if (difficulty) query.difficulty = difficulty;
        if (equipment) query.equipment = { $in: [equipment] };

        const exercises = await Exercise.find(query);
        res.status(200).json({ success: true, count: exercises.length, data: exercises });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create new exercise
// @route   POST /api/workouts/exercises
// @access  Private (Coach/Admin)
exports.createExercise = async (req, res) => {
    try {
        if (req.user.role === 'member') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const exercise = await Exercise.create(req.body);
        res.status(201).json({ success: true, data: exercise });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create workout program
// @route   POST /api/workouts/programs
// @access  Private (Coach)
exports.createProgram = async (req, res) => {
    try {
        if (req.user.role !== 'coach') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        req.body.coachId = req.user.id;
        const program = await WorkoutProgram.create(req.body);
        
        res.status(201).json({ success: true, data: program });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get programs
// @route   GET /api/workouts/programs
// @access  Private
exports.getPrograms = async (req, res) => {
    try {
        const programs = await WorkoutProgram.find().populate('coachId', 'name');
        res.status(200).json({ success: true, data: programs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get my assigned program
// @route   GET /api/workouts/my-program
// @access  Private (Member)
exports.getMyProgram = async (req, res) => {
    try {
        const program = await WorkoutProgram.findOne({ assignedTo: req.user.id })
            .sort({ createdAt: -1 })
            .populate('coachId', 'name email');
        res.status(200).json({ success: true, data: program });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Log a workout session
// @route   POST /api/workouts/log
// @access  Private
exports.logWorkout = async (req, res) => {
    try {
        req.body.memberId = req.user.id;
        
        let totalVolume = 0;
        if (req.body.exercisesCompleted && Array.isArray(req.body.exercisesCompleted)) {
            req.body.exercisesCompleted.forEach(ex => {
                const vol = (ex.setsCompleted || 0) * (ex.repsCompleted || 0) * (ex.weightUsed || 1);
                totalVolume += vol;
            });
        }
        req.body.totalVolume = totalVolume;

        const log = await WorkoutLog.create(req.body);

        // Award gamification points
        const UserGamification = require('../models/UserGamification');
        let gamification = await UserGamification.findOne({ userId: req.user.id });
        if (!gamification) {
            gamification = await UserGamification.create({ userId: req.user.id, points: 0, level: 1 });
        }
        gamification.points += 50; 
        
        // Simple level logic (every 100 points = 1 level)
        gamification.level = Math.floor(gamification.points / 100) + 1;
        await gamification.save();

        res.status(201).json({ success: true, data: log, pointsEarned: 50, newTotal: gamification.points, level: gamification.level });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get workout history
// @route   GET /api/workouts/history
// @access  Private
exports.getWorkoutHistory = async (req, res) => {
    try {
        const history = await WorkoutLog.find({ memberId: req.user.id })
            .sort({ date: -1 })
            .populate('programId', 'name')
            .populate('exercisesCompleted.exerciseId', 'name');
            
        res.status(200).json({ success: true, data: history });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get member's last performance metrics per exercise
// @route   GET /api/workouts/last-performance
// @access  Private
exports.getLastPerformance = async (req, res) => {
    try {
        const history = await WorkoutLog.find({ memberId: req.user.id })
            .sort({ date: -1 })
            .limit(25)
            .populate('exercisesCompleted.exerciseId', 'name');

        const performanceMap = {};

        for (const log of history) {
            if (Array.isArray(log.exercisesCompleted)) {
                for (const item of log.exercisesCompleted) {
                    const exName = item.name || item.exerciseId?.name;
                    if (exName) {
                        const key = exName.trim().toLowerCase();
                        if (!performanceMap[key]) {
                            performanceMap[key] = {
                                name: exName,
                                weight: item.weightUsed || 0,
                                reps: item.repsCompleted || 0,
                                sets: item.setsCompleted || 0,
                                date: log.date
                            };
                        }
                    }
                }
            }
        }

        res.status(200).json({ success: true, data: performanceMap });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
