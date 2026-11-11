const WeeklyCheckIn = require('../models/WeeklyCheckIn');
const ClientAssignment = require('../models/ClientAssignment');
const MeasurementLog = require('../models/MeasurementLog');
const CoachProfile = require('../models/CoachProfile');
const mongoose = require('mongoose');

// Helper to resolve coach User ID
async function resolveCoachId(memberUserId) {
    const assignment = await ClientAssignment.findOne({
        clientId: memberUserId,
        status: 'active'
    });
    if (assignment) {
        return assignment.coachId;
    }
    return null;
}

// @desc    Submit weekly check-in
// @route   POST /api/check-ins
// @access  Private (Member)
exports.submitCheckIn = async (req, res) => {
    try {
        const {
            weight,
            sleepHours,
            sleepQuality,
            energyLevel,
            stressLevel,
            dietAdherence,
            workoutsCompleted,
            notes
        } = req.body;

        if (!weight) {
            return res.status(400).json({ success: false, message: 'Fasted weight (kg) is required.' });
        }

        const coachId = await resolveCoachId(req.user.id);

        const checkIn = await WeeklyCheckIn.create({
            memberId: req.user.id,
            coachId: coachId || undefined,
            weight: Number(weight),
            sleepHours: Number(sleepHours) || 7,
            sleepQuality: Number(sleepQuality) || 4,
            energyLevel: Number(energyLevel) || 4,
            stressLevel: Number(stressLevel) || 2,
            dietAdherence: dietAdherence || '100% On Plan',
            workoutsCompleted: Number(workoutsCompleted) || 0,
            notes: notes || '',
            status: 'submitted'
        });

        // Automatically log weight into MeasurementLog so weight trend charts update in sync
        try {
            await MeasurementLog.create({
                memberId: req.user.id,
                date: new Date(),
                weight: Number(weight)
            });
        } catch (measErr) {
            console.error("Non-fatal: failed to duplicate into MeasurementLog", measErr);
        }

        res.status(201).json({ success: true, data: checkIn });
    } catch (err) {
        console.error("Error submitting check-in:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get member's own check-ins
// @route   GET /api/check-ins/my-check-ins
// @access  Private (Member)
exports.getMyCheckIns = async (req, res) => {
    try {
        const checkIns = await WeeklyCheckIn.find({ memberId: req.user.id })
            .sort({ date: -1 })
            .populate('coachId', 'name email avatar');

        res.status(200).json({ success: true, count: checkIns.length, data: checkIns });
    } catch (err) {
        console.error("Error fetching my check-ins:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all check-ins for coach roster
// @route   GET /api/check-ins/coach/all
// @access  Private (Coach)
exports.getCoachCheckIns = async (req, res) => {
    try {
        const assignments = await ClientAssignment.find({ coachId: req.user.id });
        const clientIds = assignments.map(a => a.clientId).filter(Boolean);
        
        const checkIns = await WeeklyCheckIn.find({
            $or: [
                { coachId: req.user.id },
                { memberId: { $in: clientIds } }
            ]
        })
        .sort({ date: -1 })
        .populate('memberId', 'name email avatar');

        res.status(200).json({ success: true, count: checkIns.length, data: checkIns });
    } catch (err) {
        console.error("Error fetching coach check-ins:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get client check-ins (for Coach)
// @route   GET /api/check-ins/client/:clientId
// @access  Private (Coach/Admin)
exports.getClientCheckIns = async (req, res) => {
    try {
        let targetUserId = req.params.clientId;

        // If targetUserId is a ClientAssignment _id, resolve it
        if (mongoose.Types.ObjectId.isValid(targetUserId)) {
            const assignment = await ClientAssignment.findById(targetUserId);
            if (assignment && assignment.clientId) {
                targetUserId = assignment.clientId;
            }
        }

        const checkIns = await WeeklyCheckIn.find({ memberId: targetUserId })
            .sort({ date: -1 })
            .populate('memberId', 'name email avatar');

        res.status(200).json({ success: true, count: checkIns.length, data: checkIns });
    } catch (err) {
        console.error("Error fetching client check-ins:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Review weekly check-in (submit coach feedback)
// @route   PUT /api/check-ins/:id/review
// @access  Private (Coach)
exports.reviewCheckIn = async (req, res) => {
    try {
        const { feedback } = req.body;
        if (!feedback) {
            return res.status(400).json({ success: false, message: 'Feedback text is required' });
        }

        const checkIn = await WeeklyCheckIn.findById(req.params.id);
        if (!checkIn) {
            return res.status(404).json({ success: false, message: 'Check-in not found' });
        }

        checkIn.coachFeedback = feedback;
        checkIn.coachFeedbackDate = new Date();
        checkIn.status = 'reviewed';
        checkIn.coachId = req.user.id;

        await checkIn.save();

        res.status(200).json({ success: true, data: checkIn });
    } catch (err) {
        console.error("Error reviewing check-in:", err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

