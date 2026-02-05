import 'dotenv/config';   // THIS is the key


import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import passport from 'passport';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

// Import passport config AFTER dotenv
import './config/passport.js';

import authRoutes from './routes/auth.routes.js';
import postRoutes from './routes/post.routes.js';
import commentRoutes from './routes/comment.routes.js';
import userRoutes from './routes/user.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ================= SECURITY =================
app.use(helmet());
app.use(compression());

// ================= CORS =================
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// ================= LOGGER =================
app.use(morgan('dev'));

// ================= BODY PARSING =================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================= SESSION =================
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// ================= PASSPORT =================
app.use(passport.initialize());
app.use(passport.session());

// ================= DATABASE =================
const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI);
      console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`MongoDB Error: ${error.message}`);
      process.exit(1);
    }
  } else {
    console.log('MongoDB URI not set, skipping database connection');
  }
};

connectDB();

// ================= ROUTES =================
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/users', userRoutes);

// ================= HEALTH CHECK =================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server running 🚀' });
});

// ================= ERROR HANDLER =================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message
  });
});

// ================= 404 =================
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
