const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    getCoachTasks,
    createTask,
    updateTask,
    deleteTask,
    getMyTasks,
    toggleTask
} = require('../controllers/taskController');

const router = express.Router();

router.use(protect);

// Coach routes
router.get('/coach', authorize('coach'), getCoachTasks);
router.post('/coach', authorize('coach'), createTask);
router.put('/coach/:id', authorize('coach'), updateTask);
router.delete('/coach/:id', authorize('coach'), deleteTask);

// Member routes
router.get('/my', authorize('member', 'admin', 'coach'), getMyTasks);
router.put('/my/:id', authorize('member', 'admin', 'coach'), toggleTask);

module.exports = router;
