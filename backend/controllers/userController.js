const UserProfile = require('../models/UserProfile');
const User = require('../models/User');
const CoachProfile = require('../models/CoachProfile');
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

        const avatarUrl = req.file.path?.startsWith('http') 
            ? req.file.path 
            : `/uploads/${req.file.filename}`;

        profile.avatar = avatarUrl;
        await profile.save();

        await User.findByIdAndUpdate(req.user.id, { avatar: avatarUrl });

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

// @desc    Get member's messages with a user or their coach
// @route   GET /api/users/my-messages
// @access  Private
exports.getMyMessages = async (req, res) => {
    try {
        let otherUserId = req.query.user || req.query.userId || req.query.recipientId;

        // If no user specified in query, look for assigned coach
        if (!otherUserId) {
            const assignment = await ClientAssignment.findOne({ clientId: req.user.id });
            if (assignment && assignment.coachId) {
                otherUserId = assignment.coachId;
            }
        }

        // If still no user, find the user's most recent conversation
        if (!otherUserId) {
            const lastMsg = await Message.findOne({
                $or: [{ senderId: req.user.id }, { receiverId: req.user.id }]
            }).sort({ createdAt: -1 });

            if (lastMsg) {
                otherUserId = lastMsg.senderId.toString() === req.user.id.toString() 
                    ? lastMsg.receiverId 
                    : lastMsg.senderId;
            }
        }

        if (!otherUserId) {
            return res.status(200).json({ success: true, data: [], targetUser: null });
        }

        const targetUser = await User.findById(otherUserId).select('name email avatar role bio');

        const messages = await Message.find({
            $or: [
                { senderId: req.user.id, receiverId: otherUserId },
                { senderId: otherUserId, receiverId: req.user.id }
            ]
        }).sort({ createdAt: 1 });

        // Automatically mark incoming messages from this user as read
        await Message.updateMany(
            { senderId: otherUserId, receiverId: req.user.id, isRead: false },
            { isRead: true }
        );

        res.status(200).json({ 
            success: true, 
            data: messages,
            targetUser: targetUser || null
        });
    } catch (err) {
        console.error('getMyMessages error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get member's active conversations list
// @route   GET /api/users/conversations
// @access  Private
exports.getConversations = async (req, res) => {
    try {
        const myId = req.user.id;

        // Find all messages where user is sender or receiver
        const messages = await Message.find({
            $or: [{ senderId: myId }, { receiverId: myId }]
        }).sort({ createdAt: -1 });

        const conversationMap = new Map();

        for (const msg of messages) {
            const otherUserId = msg.senderId.toString() === myId.toString()
                ? msg.receiverId.toString()
                : msg.senderId.toString();

            if (!conversationMap.has(otherUserId)) {
                conversationMap.set(otherUserId, {
                    lastMessage: msg.content,
                    lastMessageAt: msg.createdAt,
                    unreadCount: (!msg.isRead && msg.receiverId.toString() === myId.toString()) ? 1 : 0
                });
            } else if (!msg.isRead && msg.receiverId.toString() === myId.toString()) {
                const conv = conversationMap.get(otherUserId);
                conv.unreadCount += 1;
            }
        }

        // Also check if user has an assigned coach who might not have sent messages yet
        const assignment = await ClientAssignment.findOne({ clientId: myId }).populate('coachId', 'name email avatar role');
        if (assignment && assignment.coachId) {
            const coachIdStr = assignment.coachId._id.toString();
            if (!conversationMap.has(coachIdStr)) {
                conversationMap.set(coachIdStr, {
                    lastMessage: 'Tap to start conversation',
                    lastMessageAt: assignment.createdAt || new Date(0),
                    unreadCount: 0,
                    isCoach: true
                });
            } else {
                conversationMap.get(coachIdStr).isCoach = true;
            }
        }

        const userIds = Array.from(conversationMap.keys());
        const users = await User.find({ _id: { $in: userIds } }).select('name email avatar role bio');

        const conversations = users.map(u => {
            const conv = conversationMap.get(u._id.toString());
            return {
                user: {
                    _id: u._id,
                    name: u.name,
                    email: u.email,
                    avatar: u.avatar,
                    role: u.role,
                    bio: u.bio || ''
                },
                lastMessage: conv?.lastMessage || '',
                lastMessageAt: conv?.lastMessageAt || null,
                unreadCount: conv?.unreadCount || 0,
                isCoach: conv?.isCoach || u.role === 'coach'
            };
        }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

        res.status(200).json({ success: true, count: conversations.length, data: conversations });
    } catch (err) {
        console.error('getConversations error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get member unread messages count
// @route   GET /api/users/unread-messages
// @access  Private
exports.getMemberUnreadCount = async (req, res) => {
    try {
        const unread = await Message.countDocuments({
            receiverId: req.user.id,
            isRead: false
        });
        res.status(200).json({ success: true, data: { totalUnread: unread } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Send message to a user or coach
// @route   POST /api/users/my-messages
// @access  Private
exports.sendMyMessage = async (req, res) => {
    try {
        const { content, receiverId, recipientId, user: targetUserId } = req.body;
        let targetId = receiverId || recipientId || targetUserId;

        if (!targetId) {
            const assignment = await ClientAssignment.findOne({ clientId: req.user.id });
            if (assignment && assignment.coachId) {
                targetId = assignment.coachId;
            }
        }

        if (!targetId) {
            return res.status(400).json({ success: false, message: 'Please specify a recipient for your message.' });
        }

        const trimmed = (content || '').trim();
        if (!trimmed) {
            return res.status(400).json({ success: false, message: 'Message content cannot be empty.' });
        }

        const msg = await Message.create({
            senderId: req.user.id,
            receiverId: targetId,
            content: trimmed
        });

        // Notify the recipient
        const Notification = require('../models/Notification');
        await Notification.create({
            recipient: targetId,
            title: 'New Message',
            message: `${req.user.name || 'Someone'} sent you a message`,
            type: 'info',
            link: `/member/inbox?user=${req.user.id}`
        }).catch(() => {});

        res.status(201).json({ success: true, data: msg });
    } catch (err) {
        console.error('sendMyMessage error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Set/change my primary coach
// @route   PUT /api/users/my-coach
// @access  Private (Member)
exports.setMyCoach = async (req, res) => {
    try {
        const { coachId } = req.body;
        let coach = await User.findById(coachId);
        let resolvedCoachId = coachId;

        if (!coach) {
            // Check if coachId was a CoachProfile ID
            const profile = await CoachProfile.findById(coachId);
            if (profile && profile.userId) {
                coach = await User.findById(profile.userId);
                resolvedCoachId = profile.userId.toString();
            }
        }

        if (!coach || coach.role !== 'coach') {
            return res.status(400).json({ success: false, message: 'Invalid coach' });
        }

        // Prevent users from choosing themselves
        if (req.user.id === resolvedCoachId) {
            return res.status(400).json({ success: false, message: 'You cannot be your own coach' });
        }

        const assignment = await ClientAssignment.findOneAndUpdate(
            { clientId: req.user.id },
            { coachId: resolvedCoachId, clientId: req.user.id, status: 'active' },
            { upsert: true, new: true }
        ).populate('coachId', 'name email avatar');
        res.status(200).json({ success: true, data: assignment });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
