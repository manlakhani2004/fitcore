const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');
const {
    createPost,
    uploadPostImage,
    getPosts,
    deletePost,
    toggleLike,
    addComment,
    deleteComment,
    toggleFollowUser,
    getUserCommunityProfile,
    getChallenges,
    joinChallenge
} = require('../controllers/communityController');

const router = express.Router();

router.use(protect);

router.route('/posts')
    .get(getPosts)
    .post(upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), createPost);

router.delete('/posts/:id', deletePost);

router.post('/upload', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'file', maxCount: 1 }]), uploadPostImage);

router.post('/posts/:id/like', toggleLike);
router.post('/posts/:id/comments', addComment);
router.delete('/posts/:postId/comments/:commentId', deleteComment);

router.post('/users/:id/follow', toggleFollowUser);
router.get('/users/:id/profile', getUserCommunityProfile);

router.get('/challenges', getChallenges);
router.post('/challenges/:id/join', joinChallenge);

module.exports = router;
