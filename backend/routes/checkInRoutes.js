const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    submitCheckIn,
    getMyCheckIns,
    getCoachCheckIns,
    getClientCheckIns,
    reviewCheckIn
} = require('../controllers/checkInController');

const router = express.Router();

router.use(protect);

router.post('/', submitCheckIn);
router.get('/my-check-ins', getMyCheckIns);
router.get('/coach/all', getCoachCheckIns);
router.get('/client/:clientId', getClientCheckIns);
router.put('/:id/review', reviewCheckIn);

module.exports = router;

