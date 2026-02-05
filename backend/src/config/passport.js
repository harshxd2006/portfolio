import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Update OAuth provider info if not set
          if (!user.googleId) {
            user.googleId = profile.id;
            user.avatar = user.avatar || profile.photos[0]?.value;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.displayName.replace(/\s+/g, '').toLowerCase() + Math.floor(Math.random() * 1000),
          displayName: profile.displayName,
          avatar: profile.photos[0]?.value,
          isVerified: true
        });

        await user.save();
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

// GitHub OAuth Strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: '/api/auth/github/callback',
      scope: ['user:email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value || `${profile.username}@github.com`;
        
        // Check if user already exists
        let user = await User.findOne({ 
          $or: [
            { email: email },
            { githubId: profile.id }
          ]
        });

        if (user) {
          // Update OAuth provider info if not set
          if (!user.githubId) {
            user.githubId = profile.id;
            user.avatar = user.avatar || profile.photos[0]?.value;
            await user.save();
          }
          return done(null, user);
        }

        // Create new user
        user = new User({
          githubId: profile.id,
          email: email,
          username: profile.username + Math.floor(Math.random() * 1000),
          displayName: profile.displayName || profile.username,
          avatar: profile.photos[0]?.value,
          bio: profile._json.bio,
          isVerified: true
        });

        await user.save();
        done(null, user);
      } catch (error) {
        done(error, null);
      }
    }
  )
);

export default passport;
