const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const DietLog = require('../models/DietLog');
const ClientAssignment = require('../models/ClientAssignment');
const Message = require('../models/Message');
const bcrypt = require('bcryptjs');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        let profile = await UserProfile.findOne({ userId: req.user.id }).populate('userId', 'name email role');
        
        if (!profile) {
            // Create a default profile if it doesn't exist yet
            profile = await UserProfile.create({ userId: req.user.id });
            profile = await UserProfile.findOne({ userId: req.user.id }).populate('userId', 'name email role');
        }

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
    try {
        const { dateOfBirth, gender, phone, height, weight, bloodType } = req.body;
        
        let profile = await UserProfile.findOne({ userId: req.user.id });
        if (!profile) {
            profile = new UserProfile({ userId: req.user.id });
        }

        if (dateOfBirth) profile.dateOfBirth = dateOfBirth;
        if (gender) profile.gender = gender;
        if (phone) profile.phone = phone;
        if (height) profile.height = height;
        if (weight) profile.weight = weight;
        if (bloodType) profile.bloodType = bloodType;

        await profile.save();

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Upload profile picture
// @route   POST /api/users/profile-picture
// @access  Private
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        let profile = await UserProfile.findOne({ userId: req.user.id });
        if (!profile) {
            profile = new UserProfile({ userId: req.user.id });
        }

        profile.avatar = req.file.path; // Cloudinary URL
        await profile.save();

        await User.findByIdAndUpdate(req.user.id, { avatar: req.file.path });

        res.status(200).json({ success: true, data: profile.avatar });
    } catch (err) {
        console.error('uploadProfilePicture error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update health info
// @route   PUT /api/users/health-info
// @access  Private
exports.updateHealthInfo = async (req, res) => {
    try {
        const { height, weight, bloodType, allergies } = req.body;
        
        let profile = await UserProfile.findOne({ userId: req.user.id });
        if (!profile) {
            profile = new UserProfile({ userId: req.user.id });
        }

        if (height) profile.height = height;
        if (weight) profile.weight = weight;
        if (bloodType) profile.bloodType = bloodType;
        if (allergies) profile.allergies = allergies;

        await profile.save();

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update fitness goals
// @route   PUT /api/users/fitness-goals
// @access  Private
exports.updateFitnessGoals = async (req, res) => {
    try {
        const { fitnessGoals } = req.body;
        
        let profile = await UserProfile.findOne({ userId: req.user.id });
        if (!profile) {
            profile = new UserProfile({ userId: req.user.id });
        }

        if (fitnessGoals) profile.fitnessGoals = fitnessGoals;

        await profile.save();

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update medical history
// @route   PUT /api/users/medical-history
// @access  Private
exports.updateMedicalHistory = async (req, res) => {
    try {
        const { medicalConditions, medications } = req.body;
        
        let profile = await UserProfile.findOne({ userId: req.user.id });
        if (!profile) {
            profile = new UserProfile({ userId: req.user.id });
        }

        if (medicalConditions) profile.medicalConditions = medicalConditions;
        if (medications) profile.medications = medications;

        await profile.save();

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update macro targets
// @route   PUT /api/users/macro-targets
// @access  Private
exports.updateMacroTargets = async (req, res) => {
    try {
        const { calories, protein, carbs, fat } = req.body;
        
        let profile = await UserProfile.findOne({ userId: req.user.id });
        if (!profile) {
            profile = new UserProfile({ userId: req.user.id });
        }

        if (calories !== undefined) profile.macroTargets.calories = calories;
        if (protein !== undefined) profile.macroTargets.protein = protein;
        if (carbs !== undefined) profile.macroTargets.carbs = carbs;
        if (fat !== undefined) profile.macroTargets.fat = fat;

        await profile.save();

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get user BMI
// @route   GET /api/users/bmi
// @access  Private
exports.getBMI = async (req, res) => {
    try {
        const profile = await UserProfile.findOne({ userId: req.user.id });
        if (!profile || !profile.bmi) {
            return res.status(404).json({ success: false, message: 'BMI data not found' });
        }
        res.status(200).json({ success: true, data: { bmi: profile.bmi, bmiCategory: profile.bmiCategory } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Change password
// @route   PUT /api/users/password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new password are required' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.passwordHash = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (err) {
        console.error('changePassword error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Export data
// @route   GET /api/users/export-data
// @access  Private
exports.exportData = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const profile = await UserProfile.findOne({ userId: req.user.id });
        const workouts = await WorkoutLog.find({ memberId: req.user.id });
        const diets = await DietLog.find({ memberId: req.user.id });

        const exportData = {
            user,
            profile,
            workouts,
            diets
        };

        res.status(200).json({ success: true, data: exportData });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res) => {
    try {
        await UserProfile.findOneAndDelete({ userId: req.user.id });
        await WorkoutLog.deleteMany({ memberId: req.user.id });
        await DietLog.deleteMany({ memberId: req.user.id });
        await User.findByIdAndDelete(req.user.id);
        
        res.status(200).json({ success: true, message: 'Account deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get member's assigned coach
// @route   GET /api/users/my-coach
// @access  Private
exports.getMyCoach = async (req, res) => {
    try {
        const assignment = await ClientAssignment.findOne({ clientId: req.user.id }).populate('coachId', 'name email avatar');
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'No coach assigned' });
        }
        res.status(200).json({ success: true, data: assignment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get member's messages with their coach
// @route   GET /api/users/my-messages
// @access  Private
exports.getMyMessages = async (req, res) => {
    try {
        const assignment = await ClientAssignment.findOne({ clientId: req.user.id });
        if (!assignment) {
            return res.status(200).json({ success: true, data: [] });
        }

        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, receiverId: assignment.coachId },
                { senderId: assignment.coachId, receiverId: req.user.id }
            ]
        }).sort({ createdAt: 1 });

        res.status(200).json({ success: true, data: messages });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Send message to my coach
// @route   POST /api/users/my-messages
// @access  Private
exports.sendMyMessage = async (req, res) => {
    try {
        const { content } = req.body;
        const assignment = await ClientAssignment.findOne({ clientId: req.user.id });
        if (!assignment) {
            return res.status(400).json({ success: false, message: 'No coach assigned' });
        }

        const msg = await Message.create({
            senderId: req.user.id,
            receiverId: assignment.coachId,
            content
        });

        // Notify the coach
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: assignment.coachId,
            title: 'New Message',
            message: `${req.user.name || 'Your client'} sent you a message`,
            type: 'info',
            link: '/coach/dashboard'
        });

        res.status(201).json({ success: true, data: msg });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Set/change my primary coach
// @route   PUT /api/users/my-coach
// @access  Private (Member)
exports.setMyCoach = async (req, res) => {
    try {
        const { coachId } = req.body;
        const coach = await User.findById(coachId);
        if (!coach || coach.role !== 'coach') {
            return res.status(400).json({ success: false, message: 'Invalid coach' });
        }

        // Prevent users from choosing themselves
        if (req.user.id === coachId) {
            return res.status(400).json({ success: false, message: 'You cannot be your own coach' });
        }

        const assignment = await ClientAssignment.findOneAndUpdate(
            { clientId: req.user.id },
            { coachId, clientId: req.user.id, status: 'active' },
            { upsert: true, new: true }
        ).populate('coachId', 'name email avatar');
        res.status(200).json({ success: true, data: assignment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
