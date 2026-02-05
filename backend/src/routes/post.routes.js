import express from 'express';
import { body, validationResult } from 'express-validator';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { isAuthenticated, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Validation middleware
const createPostValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 300 })
    .withMessage('Title must be between 1 and 300 characters'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content must be between 1 and 10000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'link', 'image', 'portfolio'])
    .withMessage('Invalid post type')
];

// Get all posts (with pagination)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const sortBy = req.query.sortBy || 'new'; // new, top, trending
    
    let sortQuery = {};
    switch (sortBy) {
      case 'top':
        sortQuery = { 'votes.upvotes': -1, createdAt: -1 };
        break;
      case 'trending':
        sortQuery = { views: -1, 'votes.upvotes': -1, createdAt: -1 };
        break;
      default: // new
        sortQuery = { createdAt: -1 };
    }
    
    const posts = await Post.find({ isDeleted: false })
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar karma')
      .lean();
    
    // Add user vote status if authenticated
    if (req.user) {
      posts.forEach(post => {
        const voteStatus = post.votes.upvotes.some(id => id.toString() === req.user._id.toString()) ? 'up' :
                          post.votes.downvotes.some(id => id.toString() === req.user._id.toString()) ? 'down' : null;
        post.userVote = voteStatus;
      });
    }
    
    const total = await Post.countDocuments({ isDeleted: false });
    
    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching posts',
      error: error.message
    });
  }
});

// Get trending posts
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const posts = await Post.getTrending(limit);
    
    res.json({
      success: true,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trending posts',
      error: error.message
    });
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username displayName avatar karma bio title')
      .populate({
        path: 'comments',
        match: { parentComment: null, isDeleted: false },
        options: { sort: { 'votes.upvotes': -1, createdAt: -1 } },
        populate: {
          path: 'author',
          select: 'username displayName avatar karma'
        }
      });
    
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    // Add user vote status if authenticated
    const response = post.toObject();
    if (req.user) {
      const voteStatus = post.votes.upvotes.some(id => id.toString() === req.user._id.toString()) ? 'up' :
                        post.votes.downvotes.some(id => id.toString() === req.user._id.toString()) ? 'down' : null;
      response.userVote = voteStatus;
    }
    
    res.json({
      success: true,
      post: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching post',
      error: error.message
    });
  }
});

// Create post
router.post('/', isAuthenticated, createPostValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    
    const { title, content, type, linkUrl, images, tags } = req.body;
    
    const post = new Post({
      author: req.user._id,
      title,
      content,
      type: type || 'text',
      linkUrl,
      images: images || [],
      tags: tags || []
    });
    
    await post.save();
    await post.populate('author', 'username displayName avatar karma');
    
    // Update user karma
    await User.findByIdAndUpdate(req.user._id, { $inc: { karma: 1 } });
    
    res.status(201).json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating post',
      error: error.message
    });
  }
});

// Update post
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if user is the author
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this post'
      });
    }
    
    const { title, content, images, tags } = req.body;
    
    if (title) post.title = title;
    if (content) post.content = content;
    if (images) post.images = images;
    if (tags) post.tags = tags;
    
    await post.save();
    await post.populate('author', 'username displayName avatar karma');
    
    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating post',
      error: error.message
    });
  }
});

// Delete post (soft delete)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    // Check if user is the author or admin
    if (post.author.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }
    
    await post.softDelete();
    
    res.json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting post',
      error: error.message
    });
  }
});

// Upvote post
router.post('/:id/upvote', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    await post.upvote(req.user._id);
    
    // Update author karma
    const author = await User.findById(post.author);
    if (author) {
      const voteDiff = post.votes.upvotes.includes(req.user._id) ? 1 : 
                      post.votes.downvotes.includes(req.user._id) ? -1 : 0;
      author.karma += voteDiff;
      await author.save();
    }
    
    res.json({
      success: true,
      voteScore: post.voteScore,
      userVote: post.hasVoted(req.user._id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error upvoting post',
      error: error.message
    });
  }
});

// Downvote post
router.post('/:id/downvote', isAuthenticated, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post || post.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }
    
    await post.downvote(req.user._id);
    
    res.json({
      success: true,
      voteScore: post.voteScore,
      userVote: post.hasVoted(req.user._id)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error downvoting post',
      error: error.message
    });
  }
});

// Get posts by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.getByUser(userId, limit, skip);
    const total = await Post.countDocuments({ author: userId, isDeleted: false });
    
    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user posts',
      error: error.message
    });
  }
});

// Search posts
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const posts = await Post.find(
      { 
        $text: { $search: query },
        isDeleted: false 
      },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username displayName avatar karma')
      .lean();
    
    const total = await Post.countDocuments({ 
      $text: { $search: query },
      isDeleted: false 
    });
    
    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching posts',
      error: error.message
    });
  }
});

export default router;
