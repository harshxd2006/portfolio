import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  // Post this comment belongs to
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true
  },
  
  // Author
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Content
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  
  // Nested replies (for threaded comments)
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  
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
  
  // Metadata
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  // Awards
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

// Indexes
commentSchema.index({ post: 1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ content: 'text' });

// Virtual for vote score
commentSchema.virtual('voteScore').get(function() {
  return this.votes.upvotes.length - this.votes.downvotes.length;
});

// Virtual for reply count
commentSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to upvote
commentSchema.methods.upvote = async function(userId) {
  const upIndex = this.votes.upvotes.indexOf(userId);
  const downIndex = this.votes.downvotes.indexOf(userId);
  
  if (upIndex > -1) {
    this.votes.upvotes.splice(upIndex, 1);
  } else {
    this.votes.upvotes.push(userId);
    if (downIndex > -1) {
      this.votes.downvotes.splice(downIndex, 1);
    }
  }
  await this.save();
};

// Method to downvote
commentSchema.methods.downvote = async function(userId) {
  const upIndex = this.votes.upvotes.indexOf(userId);
  const downIndex = this.votes.downvotes.indexOf(userId);
  
  if (downIndex > -1) {
    this.votes.downvotes.splice(downIndex, 1);
  } else {
    this.votes.downvotes.push(userId);
    if (upIndex > -1) {
      this.votes.upvotes.splice(upIndex, 1);
    }
  }
  await this.save();
};

// Method to check if user has voted
commentSchema.methods.hasVoted = function(userId) {
  const upvoted = this.votes.upvotes.some(id => id.equals(userId));
  const downvoted = this.votes.downvotes.some(id => id.equals(userId));
  return { upvoted, downvoted };
};

// Method to add reply
commentSchema.methods.addReply = async function(replyId) {
  if (!this.replies.includes(replyId)) {
    this.replies.push(replyId);
    await this.save();
  }
};

// Method to edit comment
commentSchema.methods.edit = async function(newContent) {
  this.content = newContent;
  this.isEdited = true;
  this.editedAt = Date.now();
  await this.save();
};

// Method to soft delete
commentSchema.methods.softDelete = async function() {
  this.isDeleted = true;
  this.content = '[deleted]';
  await this.save();
};

// Static method to get top-level comments for a post
commentSchema.statics.getTopLevel = async function(postId, limit = 20, skip = 0) {
  return this.find({ 
    post: postId, 
    parentComment: null,
    isDeleted: false 
  })
    .sort({ 'votes.upvotes': -1, createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username displayName avatar karma')
    .lean();
};

// Static method to get replies for a comment
commentSchema.statics.getReplies = async function(commentId, limit = 10) {
  return this.find({ 
    parentComment: commentId,
    isDeleted: false 
  })
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('author', 'username displayName avatar karma')
    .lean();
};

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
