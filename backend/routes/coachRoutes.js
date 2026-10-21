const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
    registerCoachProfile,
    getCoaches,
    getMyCoachProfile,
    getCoachById,
    updateCoachProfile,
    addCertification,
    getCoachAvailability,
    updateAvailability,
    addReview,
    getCoachReviews
} = require('../controllers/coachController');

const router = express.Router();

router.use(protect);

// Fixed-path routes MUST come before parameterized /:id routes
router.get('/', getCoaches);
router.post('/register', authorize('coach'), registerCoachProfile);
router.get('/profile', authorize('coach'), getMyCoachProfile);
router.put('/profile', authorize('coach'), updateCoachProfile);
router.put('/availability', authorize('coach'), updateAvailability);
router.post('/certifications', authorize('coach'), upload.single('file'), addCertification);

// Parameterized routes
router.get('/:id', getCoachById);
router.get('/:id/availability', getCoachAvailability);
router.get('/:id/reviews', getCoachReviews);
router.post('/:id/review', authorize('member'), addReview);

module.exports = router;
