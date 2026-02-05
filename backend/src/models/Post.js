import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  
  // Media
  images: [{
    type: String,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid image URL'
    }
  }],
  
  // Post Type
  type: {
    type: String,
    enum: ['text', 'link', 'image', 'portfolio'],
    default: 'text'
  },
  
  // Link URL (for link posts)
  linkUrl: {
    type: String,
    default: null
  },
  
  // Engagement
  votes: {
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Comments
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  
  // Tags/Categories
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Metadata
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Awards (for gamification)
  awards: [{
    type: {
      type: String,
      enum: ['gold', 'silver', 'bronze']
    },
    givenBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    givenAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
postSchema.index({ createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ title: 'text', content: 'text' });
postSchema.index({ isPinned: -1, createdAt: -1 });

// Virtual for vote score
postSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for comment count
postSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Method to upvote
postSchema.methods.upvote = async function(userId) {
  const upIndex = this.votes.upvotes.indexOf(userId);
  const downIndex = this.votes.downvotes.indexOf(userId);
  
  if (upIndex > -1) {
    // Remove upvote (toggle)
    this.votes.upvotes.splice(upIndex, 1);
  } else {
    // Add upvote and remove downvote if exists
    this.votes.upvotes.push(userId);
    if (downIndex > -1) {
      this.votes.downvotes.splice(downIndex, 1);
    }
  }
  await this.save();
};

// Method to downvote
postSchema.methods.downvote = async function(userId) {
  const upIndex = this.votes.upvotes.indexOf(userId);
  const downIndex = this.votes.downvotes.indexOf(userId);
  
  if (downIndex > -1) {
    // Remove downvote (toggle)
    this.votes.downvotes.splice(downIndex, 1);
  } else {
    // Add downvote and remove upvote if exists
    this.votes.downvotes.push(userId);
    if (upIndex > -1) {
      this.votes.upvotes.splice(upIndex, 1);
    }
  }
  await this.save();
};

// Method to check if user has voted
postSchema.methods.hasVoted = function(userId) {
  const upvoted = this.votes.upvotes.some(id => id.equals(userId));
  const downvoted = this.votes.downvotes.some(id => id.equals(userId));
  return { upvoted, downvoted };
};

// Method to soft delete
postSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  await this.save();
};

// Static method to get trending posts
postSchema.statics.getTrending = async function(limit = 10) {
  return this.find({ isDeleted: false })
    .sort({ 'votes.upvotes': -1, views: -1, createdAt: -1 })
    .limit(limit)
    .populate('author', 'username displayName avatar')
    .lean();
};

// Static method to get posts by user
postSchema.statics.getByUser = async function(userId, limit = 10, skip = 0) {
  return this.find({ author: userId, isDeleted: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName avatar')
    .lean();
};

const Post = mongoose.model('Post', postSchema);

export default Post;
