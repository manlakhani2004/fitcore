const Post = require('../models/Post');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const UserProfile = require('../models/UserProfile');
const WorkoutLog = require('../models/WorkoutLog');

// @desc    Create a new post
// @route   POST /api/community/posts
// @access  Private
exports.createPost = async (req, res) => {
    try {
        const { content } = req.body;
        let imageUrl = req.body.imageUrl || '';

        // Check if an image was uploaded via multipart/form-data
        const file = req.file || (req.files?.image?.[0]) || (req.files?.file?.[0]);
        if (file) {
            imageUrl = file.path?.startsWith('http') 
                ? file.path 
                : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        }

        const trimmedContent = (content || '').trim();

        if (!trimmedContent && !imageUrl) {
            return res.status(400).json({ 
                success: false, 
                message: 'Please write a caption or attach a photo before posting.' 
            });
        }

        const post = await Post.create({
            author: req.user.id,
            content: trimmedContent,
            imageUrl: imageUrl || ''
        });

        await post.populate('author', 'name email avatar role bio followers');

        res.status(201).json({ success: true, data: post });
    } catch (err) {
        console.error('createPost error:', err);
        if (err.name === 'ValidationError') {
            const firstError = Object.values(err.errors)[0]?.message || 'Please provide valid post data.';
            return res.status(400).json({ success: false, message: firstError });
        }
        res.status(500).json({ success: false, message: 'Unable to publish post. Please try again.' });
    }
};

// @desc    Upload image for community post
// @route   POST /api/community/upload
// @access  Private
exports.uploadPostImage = async (req, res) => {
    try {
        const file = req.file || (req.files?.image?.[0]) || (req.files?.file?.[0]);
        if (!file) {
            return res.status(400).json({ success: false, message: 'Please select an image file to upload' });
        }
        const imageUrl = file.path?.startsWith('http') 
            ? file.path 
            : `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        res.status(200).json({ success: true, url: imageUrl });
    } catch (err) {
        console.error('uploadPostImage error:', err);
        res.status(500).json({ success: false, message: 'Image upload failed' });
    }
};

// @desc    Get feed (all posts, following, or user posts)
// @route   GET /api/community/posts
// @access  Private
exports.getPosts = async (req, res) => {
    try {
        const { filter = 'all' } = req.query;
        let query = {};

        if (filter === 'me') {
            query.author = req.user.id;
        } else if (filter === 'following') {
            const currentUser = await User.findById(req.user.id).select('following');
            const followingIds = currentUser?.following || [];
            query.author = { $in: followingIds };
        }

        const posts = await Post.find(query)
            .sort({ createdAt: -1 })
            .populate('author', 'name email avatar role bio followers')
            .populate('comments.author', 'name email avatar role');
            
        // Filter out orphan posts whose author was deleted and filter orphan comments
        const validPosts = posts
            .filter(p => p.author != null)
            .map(p => {
                if (p.comments && p.comments.length > 0) {
                    p.comments = p.comments.filter(c => c.author != null);
                }
                return p;
            });
            
        res.status(200).json({ success: true, count: validPosts.length, data: validPosts });
    } catch (err) {
        console.error('getPosts error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Delete a post
// @route   DELETE /api/community/posts/:id
// @access  Private
exports.deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        // Author of the post or an Admin can delete
        const isAuthor = post.author.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this post.' });
        }

        await Post.deleteOne({ _id: post._id });
        res.status(200).json({ success: true, message: 'Post deleted successfully.' });
    } catch (err) {
        console.error('deletePost error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete post.' });
    }
};

// @desc    Delete a comment
// @route   DELETE /api/community/posts/:postId/comments/:commentId
// @access  Private
exports.deleteComment = async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const comment = post.comments.id(req.params.commentId);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const isCommentAuthor = comment.author.toString() === req.user.id;
        const isPostAuthor = post.author.toString() === req.user.id;
        const isAdmin = req.user.role === 'admin';

        if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
            return res.status(403).json({ success: false, message: 'You are not authorized to delete this comment.' });
        }

        post.comments.pull(req.params.commentId);
        await post.save();
        await post.populate('comments.author', 'name email avatar role');

        res.status(200).json({ success: true, data: post.comments, message: 'Comment removed.' });
    } catch (err) {
        console.error('deleteComment error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete comment.' });
    }
};

// @desc    Follow or unfollow an athlete
// @route   POST /api/community/users/:id/follow
// @access  Private
exports.toggleFollowUser = async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if (targetUserId === req.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot follow yourself.' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Athlete not found.' });
        }

        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'Current user session invalid.' });
        }

        if (!targetUser.followers) targetUser.followers = [];
        if (!currentUser.following) currentUser.following = [];

        const isFollowing = currentUser.following.some(id => id.toString() === targetUserId);

        if (isFollowing) {
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== req.user.id);
        } else {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(req.user.id);
        }

        await currentUser.save();
        await targetUser.save();

        res.status(200).json({ 
            success: true, 
            isFollowing: !isFollowing,
            followersCount: targetUser.followers.length,
            followingCount: targetUser.following.length,
            message: !isFollowing ? `Now following ${targetUser.name}` : `Unfollowed ${targetUser.name}`
        });
    } catch (err) {
        console.error('toggleFollowUser error:', err);
        res.status(500).json({ success: false, message: 'Unable to update follow status.' });
    }
};

// @desc    Get athlete community profile modal/card
// @route   GET /api/community/users/:id/profile
// @access  Private
exports.getUserCommunityProfile = async (req, res) => {
    try {
        const targetUser = await User.findById(req.params.id).select('name email role avatar bio followers following createdAt');
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Athlete not found.' });
        }

        const userProfile = await UserProfile.findOne({ userId: targetUser._id }).select('fitnessGoals height weight gender');
        const workoutsCount = await WorkoutLog.countDocuments({ userId: targetUser._id });

        const athletePosts = await Post.find({ author: targetUser._id })
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('author', 'name email avatar role');

        const isFollowing = (targetUser.followers || []).some(id => id.toString() === req.user.id);

        res.status(200).json({
            success: true,
            data: {
                user: {
                    _id: targetUser._id,
                    name: targetUser.name,
                    email: targetUser.email,
                    role: targetUser.role,
                    avatar: targetUser.avatar,
                    bio: targetUser.bio || '',
                    createdAt: targetUser.createdAt,
                    followersCount: targetUser.followers?.length || 0,
                    followingCount: targetUser.following?.length || 0,
                    isFollowing,
                    isSelf: targetUser._id.toString() === req.user.id
                },
                profile: userProfile || null,
                metrics: {
                    totalWorkouts: workoutsCount || 0,
                    totalPosts: athletePosts.length
                },
                recentPosts: athletePosts
            }
        });
    } catch (err) {
        console.error('getUserCommunityProfile error:', err);
        res.status(500).json({ success: false, message: 'Failed to load athlete profile.' });
    }
};

// @desc    Toggle like on a post
// @route   POST /api/community/posts/:id/like
// @access  Private
exports.toggleLike = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        const likeIndex = post.likes.indexOf(req.user.id);
        if (likeIndex !== -1) {
            // Unlike
            post.likes.splice(likeIndex, 1);
        } else {
            // Like
            post.likes.push(req.user.id);
        }

        await post.save();
        res.status(200).json({ success: true, data: post.likes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Add comment to a post
// @route   POST /api/community/posts/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found' });
        }

        post.comments.push({
            author: req.user.id,
            content
        });

        await post.save();
        await post.populate('comments.author', 'name email avatar role');
        res.status(201).json({ success: true, data: post.comments });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all challenges
// @route   GET /api/community/challenges
// @access  Private
exports.getChallenges = async (req, res) => {
    try {
        let count = await Challenge.countDocuments();
        if (count === 0) {
            // Seed initial challenges for community
            const now = new Date();
            const start1 = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
            const end1 = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
            const start2 = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
            const end2 = new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000);

            await Challenge.create([
                {
                    title: "30-Day Iron Core Blitz",
                    description: "Complete 20 core sessions and hit 10,000 total reps across the community this month.",
                    goal: "20 Core Workouts in 30 Days",
                    type: "workout",
                    targetValue: 20,
                    startDate: start1,
                    endDate: end1,
                    participants: [],
                    leaderboard: [
                        { name: "Alex Mercer", progress: 85, rank: 1 },
                        { name: "Elena Vance", progress: 70, rank: 2 },
                        { name: "Marcus Wright", progress: 65, rank: 3 }
                    ],
                    badgeAwarded: "Iron Core Master"
                },
                {
                    title: "Spring Cut: 50,000 Calorie Burn",
                    description: "Burn calories through strength, HIIT, and cardio workouts. Track your daily calorie output.",
                    goal: "Burn 50,000 kcal total",
                    type: "calories",
                    targetValue: 50000,
                    startDate: start1,
                    endDate: end1,
                    participants: [],
                    leaderboard: [
                        { name: "Sarah Connor", progress: 90, rank: 1 },
                        { name: "John Wick", progress: 80, rank: 2 }
                    ],
                    badgeAwarded: "Calorie Crusher"
                },
                {
                    title: "14-Day Consistent Streak Habit",
                    description: "Log your daily diet, water, or workout without missing a single day.",
                    goal: "14-Day Consecutive Activity",
                    type: "streak",
                    targetValue: 14,
                    startDate: start2,
                    endDate: end2,
                    participants: [],
                    leaderboard: [],
                    badgeAwarded: "Streak Titan"
                }
            ]);
        }

        const challenges = await Challenge.find().sort({ startDate: 1 });
        res.status(200).json({ success: true, data: challenges });
    } catch (err) {
        console.error('getChallenges error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Join a challenge
// @route   POST /api/community/challenges/:id/join
// @access  Private
exports.joinChallenge = async (req, res) => {
    try {
        const challenge = await Challenge.findById(req.params.id);
        if (!challenge) {
            return res.status(404).json({ success: false, message: 'Challenge not found' });
        }

        const isParticipant = challenge.participants.some(p => p.userId && p.userId.toString() === req.user.id);
        if (!isParticipant) {
            challenge.participants.push({
                userId: req.user.id,
                joinedAt: new Date(),
                progress: 10
            });

            // Add user to leaderboard if not already present
            const inLeaderboard = challenge.leaderboard.some(l => l.userId && l.userId.toString() === req.user.id);
            if (!inLeaderboard) {
                challenge.leaderboard.push({
                    userId: req.user.id,
                    name: req.user.name || 'Member',
                    progress: 10,
                    rank: challenge.leaderboard.length + 1
                });
            }

            await challenge.save();
        }

        res.status(200).json({ success: true, data: challenge });
    } catch (err) {
        console.error('joinChallenge error:', err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
