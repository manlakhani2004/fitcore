const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
    exportUsersCSV, 
    exportRevenueCSV, 
    exportAnalyticsCSV, 
    exportActivityCSV 
} = require('../controllers/reportsController');

const router = express.Router();

router.use(protect);

router.get('/export/users', exportUsersCSV);
router.get('/export/revenue', exportRevenueCSV);
router.get('/export/analytics', exportAnalyticsCSV);
router.get('/export/activity', exportActivityCSV);

module.exports = router;
