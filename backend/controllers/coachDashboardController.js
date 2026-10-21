const ClientAssignment = require('../models/ClientAssignment');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const Message = require('../models/Message');
const WorkoutProgram = require('../models/WorkoutProgram');
const DietPlan = require('../models/DietPlan');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const MeasurementLog = require('../models/MeasurementLog');

const verifyRoster = async (coachId, clientId) => {
    return ClientAssignment.findOne({ coachId, clientId });
};

// @desc    Get coach's active roster
// @route   GET /api/coach-dashboard/clients
// @access  Private (Coach)
exports.getClients = async (req, res) => {
    try {
        const roster = await ClientAssignment.find({ coachId: req.user.id })
            .populate('clientId', 'name email avatar');
        res.json({ success: true, data: roster });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get detailed client view (with programs, diet, progress)
// @route   GET /api/coach-dashboard/clients/:id
// @access  Private (Coach)
exports.getClientDetails = async (req, res) => {
    try {
        const assignment = await verifyRoster(req.user.id, req.params.id);
        if (!assignment) return res.status(404).json({ success: false, message: 'Client not found' });

        const profile = await UserProfile.findOne({ userId: req.params.id });
        const programs = await WorkoutProgram.find({ coachId: req.user.id, assignedTo: req.params.id }).sort({ createdAt: -1 });
        const dietPlans = await DietPlan.find({ coachId: req.user.id, assignedTo: req.params.id }).sort({ createdAt: -1 });
        const workoutLogs = await WorkoutLog.find({ memberId: req.params.id }).sort({ date: -1 }).limit(20);
        const measurements = await MeasurementLog.find({ memberId: req.params.id }).sort({ date: -1 }).limit(20);

        res.json({
            success: true,
            data: {
                assignment,
                profile,
                programs,
                dietPlans,
                workoutLogs,
                measurements
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update coach notes
// @route   PUT /api/coach-dashboard/clients/:id/notes
// @access  Private (Coach)
exports.updateNotes = async (req, res) => {
    try {
        const assignment = await ClientAssignment.findOneAndUpdate(
            { coachId: req.user.id, clientId: req.params.id },
            { coachNotes: req.body.coachNotes },
            { new: true }
        );
        if (!assignment) return res.status(404).json({ success: false, message: 'Client not found' });
        res.json({ success: true, data: assignment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get dashboard stats
// @route   GET /api/coach-dashboard/stats
// @access  Private (Coach)
exports.getDashboardStats = async (req, res) => {
    try {
        const roster = await ClientAssignment.find({ coachId: req.user.id });
        const activeCount = roster.filter(c => c.status === 'active').length;
        res.json({ success: true, data: { activeClients: activeCount, mrr: activeCount * 150 } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Assign workout program to client (creates a personalized copy)
// @route   POST /api/coach-dashboard/clients/:id/program
// @access  Private (Coach)
exports.assignProgram = async (req, res) => {
    try {
        const assignment = await verifyRoster(req.user.id, req.params.id);
        if (!assignment) return res.status(403).json({ success: false, message: 'Client not in roster' });

        const { name, description, goal, durationWeeks, difficulty, schedule } = req.body;
        const program = await WorkoutProgram.create({
            coachId: req.user.id,
            assignedTo: req.params.id,
            name,
            description,
            goal,
            durationWeeks: durationWeeks || 4,
            difficulty,
            schedule: schedule || []
        });
        res.status(201).json({ success: true, data: program });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Assign diet plan to client (creates a personalized copy)
// @route   POST /api/coach-dashboard/clients/:id/diet-plan
// @access  Private (Coach)
exports.assignDietPlan = async (req, res) => {
    try {
        const assignment = await verifyRoster(req.user.id, req.params.id);
        if (!assignment) return res.status(403).json({ success: false, message: 'Client not in roster' });

        const { name, goal, caloriesTarget, macrosTarget, meals } = req.body;
        const plan = await DietPlan.create({
            coachId: req.user.id,
            assignedTo: req.params.id,
            name,
            goal,
            caloriesTarget,
            macrosTarget,
            meals: meals || []
        });
        res.status(201).json({ success: true, data: plan });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update macro targets for client
// @route   PUT /api/coach-dashboard/clients/:id/macros
// @access  Private (Coach)
exports.assignMacros = async (req, res) => {
    try {
        const profile = await UserProfile.findOneAndUpdate(
            { userId: req.params.id },
            { macroTargets: req.body },
            { new: true, upsert: true }
        );
        res.json({ success: true, data: profile.macroTargets });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get client workout logs
// @route   GET /api/coach-dashboard/clients/:id/workout-logs
// @access  Private (Coach)
exports.getClientWorkoutLogs = async (req, res) => {
    try {
        const assignment = await verifyRoster(req.user.id, req.params.id);
        if (!assignment) return res.status(403).json({ success: false, message: 'Client not in roster' });

        const logs = await WorkoutLog.find({ memberId: req.params.id })
            .populate('programId', 'name')
            .sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get client diet logs
// @route   GET /api/coach-dashboard/clients/:id/diet-logs
// @access  Private (Coach)
exports.getClientDietLogs = async (req, res) => {
    try {
        const assignment = await verifyRoster(req.user.id, req.params.id);
        if (!assignment) return res.status(403).json({ success: false, message: 'Client not in roster' });

        const logs = await DietLog.find({ memberId: req.params.id }).sort({ date: -1 });
        res.json({ success: true, data: logs });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get client measurements (progress)
// @route   GET /api/coach-dashboard/clients/:id/measurements
// @access  Private (Coach)
exports.getClientMeasurements = async (req, res) => {
    try {
        const assignment = await verifyRoster(req.user.id, req.params.id);
        if (!assignment) return res.status(403).json({ success: false, message: 'Client not in roster' });

        const measurements = await MeasurementLog.find({ memberId: req.params.id }).sort({ date: -1 });
        res.json({ success: true, data: measurements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get chat messages
// @route   GET /api/coach-dashboard/clients/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, receiverId: req.params.id },
                { senderId: req.params.id, receiverId: req.user.id }
            ]
        }).sort({ createdAt: 1 });
        res.json({ success: true, data: messages });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Send chat message
// @route   POST /api/coach-dashboard/clients/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
    try {
        const msg = await Message.create({
            senderId: req.user.id,
            receiverId: req.params.id,
            content: req.body.content
        });

        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: req.params.id,
            title: 'New Message',
            message: `${req.user.name || 'Your coach'} sent you a message`,
            type: 'info',
            link: '/member/inbox'
        });

        res.status(201).json({ success: true, data: msg });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
