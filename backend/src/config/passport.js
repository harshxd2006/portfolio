console.log("GITHUB ID:", process.env.GITHUB_CLIENT_ID);

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

// ================= SERIALIZATION =================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// ================= GOOGLE STRATEGY =================
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({
            email: profile.emails?.[0]?.value
          });

          if (user) {
            if (!user.googleId) {
              user.googleId = profile.id;
              user.avatar = user.avatar || profile.photos?.[0]?.value;
              await user.save();
            }
            return done(null, user);
          }

          user = new User({
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            username:
              profile.displayName.replace(/\s+/g, '').toLowerCase() +
              Math.floor(Math.random() * 1000),
            displayName: profile.displayName,
            avatar: profile.photos?.[0]?.value,
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
} else {
  console.log('⚠ Google OAuth not configured');
}

// ================= GITHUB STRATEGY =================
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
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
          const email =
            profile.emails?.[0]?.value ||
            `${profile.username}@github.com`;

          let user = await User.findOne({
            $or: [
              { email: email },
              { githubId: profile.id }
            ]
          });

          if (user) {
            if (!user.githubId) {
              user.githubId = profile.id;
              user.avatar = user.avatar || profile.photos?.[0]?.value;
              await user.save();
            }
            return done(null, user);
          }

          user = new User({
            githubId: profile.id,
            email: email,
            username:
              profile.username + Math.floor(Math.random() * 1000),
            displayName:
              profile.displayName || profile.username,
            avatar: profile.photos?.[0]?.value,
            bio: profile._json?.bio,
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
} else {
  console.log('⚠ GitHub OAuth not configured');
}

export default passport;
