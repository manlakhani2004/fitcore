const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
    createPost,
    getPosts,
    toggleLike,
    addComment,
    getChallenges,
    joinChallenge
} = require('../controllers/communityController');

const router = express.Router();

router.use(protect);

router.route('/posts')
    .get(getPosts)
    .post(createPost);

router.post('/posts/:id/like', toggleLike);
router.post('/posts/:id/comments', addComment);

router.get('/challenges', getChallenges);
router.post('/challenges/:id/join', joinChallenge);

module.exports = router;
