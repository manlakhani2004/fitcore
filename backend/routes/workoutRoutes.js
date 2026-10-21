const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getExercises,
    createExercise,
    createProgram,
    getPrograms,
    getMyProgram,
    logWorkout,
    getWorkoutHistory
} = require('../controllers/workoutController');

const router = express.Router();

router.use(protect);

router.route('/exercises')
    .get(getExercises)
    .post(createExercise);

router.route('/programs')
    .get(getPrograms)
    .post(createProgram);

router.get('/my-program', getMyProgram);
router.post('/log', logWorkout);
router.get('/history', getWorkoutHistory);

module.exports = router;
