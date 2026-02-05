import express from 'express';
import User from '../models/User.js';
import Post from '../models/Post.js';
import Comment from '../models/Comment.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Get user profile by username
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({ username: username.toLowerCase() })
      .select('-__v')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Get user's stats
    const postCount = await Post.countDocuments({ author: user._id, isDeleted: false });
    const commentCount = await Comment.countDocuments({ author: user._id, isDeleted: false });
    
    res.json({
      success: true,
      user: {
        ...user.toObject(),
        stats: {
          postCount,
          commentCount,
          followerCount: user.followers.length,
          followingCount: user.following.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
});

// Get user profile by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-__v')
      .populate('followers', 'username displayName avatar')
      .populate('following', 'username displayName avatar');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

// Follow user
router.post('/:id/follow', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Can't follow yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot follow yourself'
      });
    }
    
    const userToFollow = await User.findById(id);
    if (!userToFollow) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    const currentUser = await User.findById(req.user._id);
    
    // Check if already following
    const isFollowing = currentUser.following.includes(id);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(userId => !userId.equals(id));
      userToFollow.followers = userToFollow.followers.filter(userId => !userId.equals(req.user._id));
      
      await currentUser.save();
      await userToFollow.save();
      
      res.json({
        success: true,
        message: 'Unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Follow
      currentUser.following.push(id);
      userToFollow.followers.push(req.user._id);
      
      await currentUser.save();
      await userToFollow.save();
      
      res.json({
        success: true,
        message: 'Followed successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error following user',
      error: error.message
    });
  }
});

// Get user's followers
router.get('/:id/followers', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(id)
      .populate({
        path: 'followers',
        select: 'username displayName avatar karma bio',
        options: { skip, limit }
      });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      followers: user.followers,
      pagination: {
        page,
        limit,
        total: user.followers.length,
        hasMore: skip + user.followers.length < user.followers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching followers',
      error: error.message
    });
  }
});

// Get user's following
router.get('/:id/following', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const user = await User.findById(id)
      .populate({
        path: 'following',
        select: 'username displayName avatar karma bio',
        options: { skip, limit }
      });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      following: user.following,
      pagination: {
        page,
        limit,
        total: user.following.length,
        hasMore: skip + user.following.length < user.following.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching following',
      error: error.message
    });
  }
});

// Search users
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    })
      .select('username displayName avatar karma bio title')
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await User.countDocuments({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { displayName: { $regex: query, $options: 'i' } }
      ]
    });
    
    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasMore: skip + users.length < total
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching users',
      error: error.message
    });
  }
});

// Get top users by karma
router.get('/leaderboard/karma', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const users = await User.find()
      .select('username displayName avatar karma bio title')
      .sort({ karma: -1 })
      .limit(limit)
      .lean();
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching leaderboard',
      error: error.message
    });
  }
});

export default router;
