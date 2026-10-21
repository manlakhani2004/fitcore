const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    getMeals,
    createMeal,
    getDietPlans,
    createDietPlan,
    getMyPlan,
    logDiet,
    getTodayMacros,
    logWater
} = require('../controllers/dietController');

const router = express.Router();

router.use(protect);

router.route('/meals')
    .get(getMeals)
    .post(createMeal);

router.route('/plans')
    .get(getDietPlans)
    .post(createDietPlan);
router.get('/my-plan', getMyPlan);
router.post('/log', logDiet);
router.post('/water', logWater);
router.get('/macros/today', getTodayMacros);

module.exports = router;
