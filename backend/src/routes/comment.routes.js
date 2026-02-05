import express from 'express';
import { body, validationResult } from 'express-validator';
import Comment from '../models/Comment.js';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { isAuthenticated, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const createCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Comment must be between 1 and 5000 characters')
];

// Get comments for a post
router.get('/post/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'top'; // top, new
    
    let sortQuery = {};
    switch (sortBy) {
      case 'new':
        sortQuery = { createdAt: -1 };
        break;
      default: // top
        sortQuery = { 'votes.upvotes': -1, createdAt: -1 };
    }
    
    const comments = await Comment.find({ 
      post: postId, 
      parentComment: null,
      isDeleted: false 
    })
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar karma')
      .lean();
    
    // Add user vote status if authenticated
    if (req.user) {
      comments.forEach(comment => {
        const voteStatus = comment.votes.upvotes.some(id => id.toString() === req.user._id.toString()) ? 'up' :
                          comment.votes.downvotes.some(id => id.toString() === req.user._id.toString()) ? 'down' : null;
        comment.userVote = voteStatus;
      });
    }
    
    const total = await Comment.countDocuments({ 
      post: postId, 
      parentComment: null,
      isDeleted: false 
    });
    
    res.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + comments.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: error.message
    });
  }
});

// Get replies for a comment
router.get('/:commentId/replies', optionalAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const replies = await Comment.getReplies(commentId, limit);
    
    // Add user vote status if authenticated
    if (req.user) {
      replies.forEach(reply => {
        const voteStatus = reply.votes.upvotes.some(id => id.toString() === req.user._id.toString()) ? 'up' :
                          reply.votes.downvotes.some(id => id.toString() === req.user._id.toString()) ? 'down' : null;
        reply.userVote = voteStatus;
      });
    }
    
    res.json({
      success: true,
      replies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching replies',
      error: error.message
    });
  }
});

// Get single comment
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate('author', 'username displayName avatar karma')
      .populate({
        path: 'replies',
        match: { isDeleted: false },
        options: { sort: { createdAt: 1 } },
        populate: {
          path: 'author',
          select: 'username displayName avatar karma'
        }
      });
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    const response = comment.toObject();
    if (req.user) {
      const voteStatus = comment.votes.upvotes.some(id => id.toString() === req.user._id.toString()) ? 'up' :
                        comment.votes.downvotes.some(id => id.toString() === req.user._id.toString()) ? 'down' : null;
      response.userVote = voteStatus;
    }
    
    res.json({
      success: true,
      comment: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching comment',
      error: error.message
    });
  }
});

// Create comment
router.post('/', isAuthenticated, createCommentValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { postId, content, parentCommentId } = req.body;
    
    // Verify post exists
    const post = await Post.findById(postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // If replying to a comment, verify it exists
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment || parentComment.isDeleted) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found'
        });
      }
    }
    
    const comment = new Comment({
      post: postId,
      author: req.user._id,
      content,
      parentComment: parentCommentId || null
    });
    
    await comment.save();
    
    // Add comment to post
    post.comments.push(comment._id);
    await post.save();
    
    // If it's a reply, add to parent comment
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      if (parentComment) {
        await parentComment.addReply(comment._id);
      }
    }
    
    await comment.populate('author', 'username displayName avatar karma');
    
    // Update user karma
    await User.findByIdAndUpdate(req.user._id, { $inc: { karma: 1 } });
    
    res.status(201).json({
      success: true,
      comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
});

// Update comment
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user is the author
    if (comment.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }
    
    const { content } = req.body;
    
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Content is required'
      });
    }
    
    await comment.edit(content);
    await comment.populate('author', 'username displayName avatar karma');
    
    res.json({
      success: true,
      comment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: error.message
    });
  }
});

// Delete comment (soft delete)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    // Check if user is the author or admin
    if (comment.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }
    
    await comment.softDelete();
    
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: error.message
    });
  }
});

// Upvote comment
router.post('/:id/upvote', isAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    await comment.upvote(req.user._id);
    
    // Update author karma
    const author = await User.findById(comment.author);
    if (author) {
      const voteDiff = comment.votes.upvotes.includes(req.user._id) ? 1 : 
                      comment.votes.downvotes.includes(req.user._id) ? -1 : 0;
      author.karma += voteDiff;
      await author.save();
    }
    
    res.json({
      success: true,
      voteScore: comment.voteScore,
      userVote: comment.hasVoted(req.user._id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error upvoting comment',
      error: error.message
    });
  }
});

// Downvote comment
router.post('/:id/downvote', isAuthenticated, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment || comment.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }
    
    await comment.downvote(req.user._id);
    
    res.json({
      success: true,
      voteScore: comment.voteScore,
      userVote: comment.hasVoted(req.user._id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downvoting comment',
      error: error.message
    });
  }
});

// Get comments by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const comments = await Comment.find({ 
      author: userId,
      isDeleted: false 
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar karma')
      .populate('post', 'title')
      .lean();
    
    const total = await Comment.countDocuments({ 
      author: userId,
      isDeleted: false 
    });
    
    res.json({
      success: true,
      comments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + comments.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user comments',
      error: error.message
    });
  }
});

export default router;
