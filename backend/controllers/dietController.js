const Meal = require('../models/Meal');
const DietPlan = require('../models/DietPlan');
const DietLog = require('../models/DietLog');

// @desc    Get meals (with filters)
// @route   GET /api/diet/meals
// @access  Private
exports.getMeals = async (req, res) => {
    try {
        const { type } = req.query;
        let query = {};
        if (type && type !== 'All') {
            query.type = type.toLowerCase();
        }

        const meals = await Meal.find(query);
        res.status(200).json({ success: true, data: meals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create meal (Coach/Admin)
// @route   POST /api/diet/meals
// @access  Private
exports.createMeal = async (req, res) => {
    try {
        if (req.user.role === 'member') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const meal = await Meal.create(req.body);
        res.status(201).json({ success: true, data: meal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all diet plans
// @route   GET /api/diet/plans
// @access  Private
exports.getDietPlans = async (req, res) => {
    try {
        const plans = await DietPlan.find().populate('coachId', 'name').populate('meals');
        res.status(200).json({ success: true, data: plans });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Create diet plan
// @route   POST /api/diet/plans
// @access  Private (Coach)
exports.createDietPlan = async (req, res) => {
    try {
        if (req.user.role !== 'coach') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }
        req.body.coachId = req.user.id;
        const plan = await DietPlan.create(req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get my assigned diet plan
// @route   GET /api/diet/my-plan
// @access  Private (Member)
exports.getMyPlan = async (req, res) => {
    try {
        const plan = await DietPlan.findOne({ assignedTo: req.user.id })
            .sort({ createdAt: -1 })
            .populate('coachId', 'name email')
            .populate('meals');
        res.status(200).json({ success: true, data: plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Log daily diet
// @route   POST /api/diet/log
// @access  Private
exports.logDiet = async (req, res) => {
    try {
        const { name, calories, protein, carbs, fat, type } = req.body;
        
        // Find or create the meal
        let meal = await Meal.findOne({ name: name });
        if (!meal) {
            meal = await Meal.create({ name, calories, protein, carbs, fat, type: type || 'snack' });
        }

        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        let log = await DietLog.findOne({
            memberId: req.user.id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!log) {
            log = await DietLog.create({
                memberId: req.user.id,
                date: new Date(),
                mealsConsumed: [],
                totalCalories: 0,
                totalMacros: { protein: 0, carbs: 0, fat: 0 }
            });
        }

        log.mealsConsumed.push({
            mealId: meal._id,
            servings: 1,
            time: type || 'snack'
        });

        log.totalCalories += Number(calories);
        log.totalMacros.protein += Number(protein);
        log.totalMacros.carbs += Number(carbs);
        log.totalMacros.fat += Number(fat);

        await log.save();

        res.status(201).json({ success: true, data: log });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get today's macros
// @route   GET /api/diet/macros/today
// @access  Private
exports.getTodayMacros = async (req, res) => {
    try {
        // Find log for today
        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        const log = await DietLog.findOne({
            memberId: req.user.id,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).populate('mealsConsumed.mealId');

        if (!log) {
            return res.status(200).json({ 
                success: true, 
                data: { totalCalories: 0, totalMacros: { protein: 0, carbs: 0, fat: 0 }, waterIntake: 0 }
            });
        }

        res.status(200).json({ success: true, data: log });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Log water intake
// @route   POST /api/diet/water
// @access  Private
exports.logWater = async (req, res) => {
    try {
        const { waterIntake, glasses } = req.body;
        const amount = waterIntake !== undefined ? Number(waterIntake) : Number(glasses || 0);

        const startOfDay = new Date();
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date();
        endOfDay.setHours(23,59,59,999);

        let log = await DietLog.findOne({
            memberId: req.user.id,
            date: { $gte: startOfDay, $lte: endOfDay }
        });

        if (!log) {
            log = await DietLog.create({
                memberId: req.user.id,
                date: new Date(),
                mealsConsumed: [],
                totalCalories: 0,
                totalMacros: { protein: 0, carbs: 0, fat: 0 },
                waterIntake: amount
            });
        } else {
            log.waterIntake = amount;
            await log.save();
        }

        res.status(200).json({ success: true, data: { waterIntake: log.waterIntake } });
    } catch (err) {
        console.error('logWater error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
