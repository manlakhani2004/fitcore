const Post = require('../models/Post');
const Challenge = require('../models/Challenge');
const User = require('../models/User');

// @desc    Create a new post
// @route   POST /api/community/posts
// @access  Private
exports.createPost = async (req, res) => {
    try {
        const { content, imageUrl } = req.body;

        const post = await Post.create({
            author: req.user.id,
            content,
            imageUrl
        });

        res.status(201).json({ success: true, data: post });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get feed (all posts)
// @route   GET /api/community/posts
// @access  Private
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate('author', 'name email avatar')
            .populate('comments.author', 'name email avatar');
            
        // Filter out orphan posts whose author was deleted
        const validPosts = posts.filter(p => p.author != null);
            
        res.status(200).json({ success: true, count: validPosts.length, data: validPosts });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server Error' });
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
        await post.populate('comments.author', 'name email avatar');
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
