const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Post author is required']
    },
    content: {
        type: String,
        default: '',
        maxlength: [500, 'Post content cannot exceed 500 characters'],
        validate: {
            validator: function(val) {
                // Must have either content text or an imageUrl
                const hasText = typeof val === 'string' && val.trim().length > 0;
                const hasImage = typeof this.imageUrl === 'string' && this.imageUrl.trim().length > 0;
                return hasText || hasImage;
            },
            message: 'Please provide either text content or a photo for your post.'
        }
    },
    imageUrl: {
        type: String,
        default: ''
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: String,
            required: true,
            maxlength: 200
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
