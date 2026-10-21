const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getAvailableSlots,
    bookAppointment,
    getMyAppointments,
    getCoachSchedule,
    cancelAppointment,
    confirmAppointment
} = require('../controllers/appointmentController');

const router = express.Router();

router.use(protect);

router.get('/available-slots/:coachId/:date', getAvailableSlots);
router.post('/book', bookAppointment);
router.get('/my-appointments', getMyAppointments);
router.get('/coach-schedule', getCoachSchedule);
router.put('/:id/cancel', cancelAppointment);
router.put('/:id/confirm', confirmAppointment);

module.exports = router;
