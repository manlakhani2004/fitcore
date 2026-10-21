const mongoose = require('mongoose');
const CoachProfile = require('../models/CoachProfile');
const CoachAvailability = require('../models/CoachAvailability');
const Review = require('../models/Review');
const User = require('../models/User');

// @desc    Register as a coach
// @route   POST /api/coaches/register
// @access  Private (only users with role 'coach' can have a profile)
exports.registerCoachProfile = async (req, res) => {
    try {
        if (req.user.role !== 'coach') {
            return res.status(403).json({ success: false, message: 'Only coaches can create a coach profile' });
        }

        const { bio, specializations, experience, hourlyRate } = req.body;

        let profile = await CoachProfile.findOne({ userId: req.user.id });
        if (profile) {
            return res.status(400).json({ success: false, message: 'Coach profile already exists' });
        }

        profile = await CoachProfile.create({
            userId: req.user.id,
            bio,
            specializations,
            experience,
            hourlyRate
        });

        res.status(201).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all coaches (with filters)
// @route   GET /api/coaches
// @access  Private
exports.getCoaches = async (req, res) => {
    try {
        const { specialization, minRating, maxPrice } = req.query;
        let query = { isApproved: true };

        if (specialization) {
            query.specializations = { $in: [specialization] };
        }
        if (minRating) {
            query.averageRating = { $gte: Number(minRating) };
        }
        if (maxPrice) {
            query.hourlyRate = { $lte: Number(maxPrice) };
        }

        let coaches = await CoachProfile.find(query).populate('userId', 'name email');
        // Exclude coaches whose linked user was deleted, and exclude the current user
        coaches = coaches.filter(c => c.userId != null && c.userId._id.toString() !== req.user.id);
        res.status(200).json({ success: true, count: coaches.length, data: coaches });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get current coach's own profile
// @route   GET /api/coaches/profile
// @access  Private
exports.getMyCoachProfile = async (req, res) => {
    try {
        const profile = await CoachProfile.findOne({ userId: req.user.id }).populate('userId', 'name email avatar');
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Coach profile not found' });
        }
        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get single coach
// @route   GET /api/coaches/:id
// @access  Private
exports.getCoachById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid coach ID' });
        }
        const coach = await CoachProfile.findOne({
            $or: [{ _id: id }, { userId: id }]
        }).populate('userId', 'name email avatar');
        if (!coach) {
            return res.status(404).json({ success: false, message: 'Coach not found' });
        }
        res.status(200).json({ success: true, data: coach });
    } catch (err) {
        console.error('getCoachById error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update coach profile
// @route   PUT /api/coaches/profile
// @access  Private
exports.updateCoachProfile = async (req, res) => {
    try {
        let profile = await CoachProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Coach profile not found' });
        }

        profile = await CoachProfile.findOneAndUpdate(
            { userId: req.user.id },
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add certification
// @route   POST /api/coaches/certifications
// @access  Private
exports.addCertification = async (req, res) => {
    try {
        const { name, issuer, year } = req.body;
        // In a real app, you'd upload the file to Cloudinary and get the URL
        const fileUrl = req.file ? req.file.path : null; 

        let profile = await CoachProfile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ success: false, message: 'Coach profile not found' });
        }

        profile.certifications.push({ name, issuer, year, file: fileUrl });
        await profile.save();

        res.status(200).json({ success: true, data: profile });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get coach availability
// @route   GET /api/coaches/:id/availability
// @access  Private
exports.getCoachAvailability = async (req, res) => {
    try {
        const coachId = req.params.id === 'me' ? req.user.id : req.params.id;
        const availability = await CoachAvailability.find({ coachId });
        res.status(200).json({ success: true, data: availability });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Update coach availability
// @route   PUT /api/coaches/availability
// @access  Private
exports.updateAvailability = async (req, res) => {
    try {
        const { dayOfWeek, slots } = req.body;

        let availability = await CoachAvailability.findOne({ coachId: req.user.id, dayOfWeek });
        
        if (availability) {
            availability.slots = slots;
            await availability.save();
        } else {
            availability = await CoachAvailability.create({
                coachId: req.user.id,
                dayOfWeek,
                slots
            });
        }

        res.status(200).json({ success: true, data: availability });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add review for a coach
// @route   POST /api/coaches/:id/review
// @access  Private
exports.addReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const coachId = req.params.id;

        // Check if member already reviewed this coach
        const existingReview = await Review.findOne({ coachId, memberId: req.user.id });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this coach' });
        }

        const review = await Review.create({
            coachId,
            memberId: req.user.id,
            rating,
            comment
        });

        // Update coach average rating
        const allReviews = await Review.find({ coachId });
        const totalRating = allReviews.reduce((acc, item) => acc + item.rating, 0);
        
        await CoachProfile.findOneAndUpdate(
            { userId: coachId },
            { 
                averageRating: totalRating / allReviews.length,
                totalReviews: allReviews.length 
            }
        );

        res.status(201).json({ success: true, data: review });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get coach reviews
// @route   GET /api/coaches/:id/reviews
// @access  Private
exports.getCoachReviews = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(200).json({ success: true, data: [] });
        }
        const reviews = await Review.find({ coachId: id }).populate('memberId', 'name avatar');
        res.status(200).json({ success: true, data: reviews });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
