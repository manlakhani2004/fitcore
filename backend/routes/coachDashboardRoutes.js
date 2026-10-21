const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getClients,
    getClientDetails,
    updateNotes,
    getDashboardStats,
    assignProgram,
    assignDietPlan,
    assignMacros,
    getClientWorkoutLogs,
    getClientDietLogs,
    getClientMeasurements,
    getMessages,
    sendMessage
} = require('../controllers/coachDashboardController');

const router = express.Router();

router.use(protect);
router.use(authorize('coach'));

router.route('/stats').get(getDashboardStats);
router.route('/clients').get(getClients);
router.route('/clients/:id').get(getClientDetails);
router.route('/clients/:id/notes').put(updateNotes);
router.route('/clients/:id/program').post(assignProgram);
router.route('/clients/:id/diet-plan').post(assignDietPlan);
router.route('/clients/:id/macros').put(assignMacros);
router.route('/clients/:id/workout-logs').get(getClientWorkoutLogs);
router.route('/clients/:id/diet-logs').get(getClientDietLogs);
router.route('/clients/:id/measurements').get(getClientMeasurements);
router.route('/clients/:id/messages')
    .get(getMessages)
    .post(sendMessage);

module.exports = router;
