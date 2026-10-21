const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
    getProfile,
    updateProfile,
    uploadProfilePicture,
    updateHealthInfo,
    updateFitnessGoals,
    updateMedicalHistory,
    updateMacroTargets,
    getBMI,
    changePassword,
    exportData,
    deleteAccount,
    getMyCoach,
    setMyCoach,
    getMyMessages,
    sendMyMessage
} = require('../controllers/userController');

const router = express.Router();

router.use(protect); // All routes below are protected

router.route('/profile')
    .get(getProfile)
    .put(updateProfile);

router.put('/profile-picture', upload.single('image'), uploadProfilePicture);

router.put('/health-info', updateHealthInfo);
router.put('/fitness-goals', updateFitnessGoals);
router.put('/medical-history', updateMedicalHistory);
router.put('/macro-targets', updateMacroTargets);
router.get('/bmi', getBMI);

// Settings routes
router.put('/password', changePassword);
router.get('/export-data', exportData);
router.delete('/account', deleteAccount);

// Messaging
router.get('/my-coach', getMyCoach);
router.put('/my-coach', setMyCoach);
router.route('/my-messages')
    .get(getMyMessages)
    .post(sendMyMessage);

module.exports = router;
