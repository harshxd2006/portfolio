import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  // OAuth IDs
  googleId: {
    type: String,
    sparse: true,
    unique: true
  },
  githubId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Basic Info
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  
  // Profile
  avatar: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  location: {
    type: String,
    maxlength: 100,
    default: ''
  },
  website: {
    type: String,
    maxlength: 200,
    default: ''
  },
  
  // Social Stats
  karma: {
    type: Number,
    default: 0
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Account Status
  isVerified: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  
  // Portfolio Specific
  skills: [{
    type: String,
    trim: true
  }],
  title: {
    type: String,
    maxlength: 100,
    default: ''
  },
  
  // Timestamps
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ username: 'text', displayName: 'text' });
userSchema.index({ karma: -1 });

// Virtual for follower count
userSchema.virtual('followerCount').get(function() {
  return this.followers.length;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function() {
  return this.following.length;
});

// Method to update karma
userSchema.methods.updateKarma = async function(points) {
  this.karma += points;
  await this.save();
};

// Method to follow a user
userSchema.methods.follow = async function(userId) {
  if (!this.following.includes(userId)) {
    this.following.push(userId);
    await this.save();
  }
};

// Method to unfollow a user
userSchema.methods.unfollow = async function(userId) {
  this.following = this.following.filter(id => !id.equals(userId));
  await this.save();
};

// Pre-save middleware to update lastActive
userSchema.pre('save', function(next) {
  if (this.isModified()) {
    this.lastActive = Date.now();
  }
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
