const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
    getMeasurements,
    logMeasurement,
    getPhotos,
    uploadPhotos
} = require('../controllers/progressController');

const router = express.Router();

router.use(protect);

router.route('/measurements')
    .get(getMeasurements)
    .post(logMeasurement);

router.route('/photos')
    .get(getPhotos)
    .post(upload.fields([{ name: 'front', maxCount: 1 }, { name: 'side', maxCount: 1 }, { name: 'back', maxCount: 1 }]), uploadPhotos);

module.exports = router;
