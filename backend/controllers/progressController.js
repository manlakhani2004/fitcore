const MeasurementLog = require('../models/MeasurementLog');
const ProgressPhoto = require('../models/ProgressPhoto');

// @desc    Get measurements
// @route   GET /api/progress/measurements
// @access  Private
exports.getMeasurements = async (req, res) => {
    try {
        const measurements = await MeasurementLog.find({ memberId: req.user.id }).sort({ date: 1 });
        res.status(200).json({ success: true, data: measurements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Log new measurement
// @route   POST /api/progress/measurements
// @access  Private
exports.logMeasurement = async (req, res) => {
    try {
        req.body.memberId = req.user.id;
        const measurement = await MeasurementLog.create(req.body);
        res.status(201).json({ success: true, data: measurement });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get progress photos
// @route   GET /api/progress/photos
// @access  Private
exports.getPhotos = async (req, res) => {
    try {
        const photos = await ProgressPhoto.find({ memberId: req.user.id }).sort({ date: -1 });
        res.status(200).json({ success: true, data: photos });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Upload progress photos (requires multer/cloudinary middleware in route)
// @route   POST /api/progress/photos
// @access  Private
exports.uploadPhotos = async (req, res) => {
    try {
        const frontUrl = req.files && req.files['front'] ? req.files['front'][0].path : null;
        const sideUrl = req.files && req.files['side'] ? req.files['side'][0].path : null;
        const backUrl = req.files && req.files['back'] ? req.files['back'][0].path : null;

        const photoLog = await ProgressPhoto.create({
            memberId: req.user.id,
            frontUrl,
            sideUrl,
            backUrl
        });

        res.status(201).json({ success: true, data: photoLog });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
