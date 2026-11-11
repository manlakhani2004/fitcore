const mongoose = require('mongoose');
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
    return ClientAssignment.findOne({
        coachId,
        $or: [{ clientId }, { _id: clientId }]
    }).populate('clientId', 'name email avatar');
};

// @desc    Get coach's active roster
// @route   GET /api/coach-dashboard/clients
// @access  Private (Coach)
exports.getClients = async (req, res) => {
    try {
        const roster = await ClientAssignment.find({ coachId: req.user.id })
            .populate('clientId', 'name email avatar');

        const rosterWithUnread = await Promise.all(roster.map(async (item) => {
            const clientObj = item.toObject();
            const memberUserId = item.clientId?._id ? item.clientId._id.toString() : item.clientId;
            if (memberUserId) {
                const unread = await Message.countDocuments({
                    senderId: memberUserId,
                    receiverId: req.user.id,
                    isRead: false
                });
                clientObj.unreadCount = unread;
            } else {
                clientObj.unreadCount = 0;
            }
            return clientObj;
        }));

        res.json({ success: true, data: rosterWithUnread });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get total unread messages count for coach
// @route   GET /api/coach-dashboard/unread-count
// @access  Private (Coach)
exports.getUnreadCount = async (req, res) => {
    try {
        const totalUnread = await Message.countDocuments({
            receiverId: req.user.id,
            isRead: false
        });

        const byClientAgg = await Message.aggregate([
            { $match: { receiverId: new mongoose.Types.ObjectId(req.user.id), isRead: false } },
            { $group: { _id: '$senderId', count: { $sum: 1 } } }
        ]);

        const byClient = {};
        byClientAgg.forEach(item => {
            byClient[item._id.toString()] = item.count;
        });

        res.json({ success: true, data: { totalUnread, byClient } });
    } catch (err) {
        console.error("getUnreadCount error:", err);
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

        const memberUserId = assignment.clientId?._id ? assignment.clientId._id.toString() : (assignment.clientId || req.params.id);
        const client = (assignment.clientId && typeof assignment.clientId === 'object' && assignment.clientId.name)
            ? assignment.clientId
            : await User.findById(memberUserId).select('name email avatar');

        const profile = await UserProfile.findOne({ userId: memberUserId });
        const programs = await WorkoutProgram.find({ coachId: req.user.id, assignedTo: memberUserId }).sort({ createdAt: -1 });
        const dietPlans = await DietPlan.find({ coachId: req.user.id, assignedTo: memberUserId }).sort({ createdAt: -1 });
        const workoutLogs = await WorkoutLog.find({ memberId: memberUserId }).sort({ date: -1 }).limit(20);
        const measurements = await MeasurementLog.find({ memberId: memberUserId }).sort({ date: -1 }).limit(20);

        res.json({
            success: true,
            data: {
                assignment,
                client,
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
            { coachId: req.user.id, $or: [{ clientId: req.params.id }, { _id: req.params.id }] },
            { coachNotes: req.body.coachNotes },
            { new: true }
        ).populate('clientId', 'name email avatar');
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

        const memberUserId = assignment.clientId?._id || assignment.clientId || req.params.id;
        const { name, description, goal, durationWeeks, difficulty, schedule } = req.body;
        const program = await WorkoutProgram.create({
            coachId: req.user.id,
            assignedTo: memberUserId,
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

        const memberUserId = assignment.clientId?._id || assignment.clientId || req.params.id;
        const { name, goal, caloriesTarget, macrosTarget, meals } = req.body;
        const plan = await DietPlan.create({
            coachId: req.user.id,
            assignedTo: memberUserId,
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
        const assignment = await verifyRoster(req.user.id, req.params.id);
        const memberUserId = assignment?.clientId?._id || assignment?.clientId || req.params.id;
        const profile = await UserProfile.findOneAndUpdate(
            { userId: memberUserId },
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

        // Automatically mark incoming messages from client as read
        await Message.updateMany(
            { senderId: req.params.id, receiverId: req.user.id, isRead: false },
            { isRead: true }
        );

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
