const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { chatWithAI } = require('../controllers/aiController');

const router = express.Router();

router.use(protect);

router.post('/chat', chatWithAI);

module.exports = router;
