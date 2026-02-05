# Portfolio Social App

A full-stack portfolio website with Reddit-like social features where users can post, comment, vote, and interact with each other's content.

## Features

### Authentication
- OAuth 2.0 authentication with Google and GitHub
- JWT token-based session management
- Protected routes and API endpoints

### Posts
- Create text, link, image, and portfolio posts
- Upvote/downvote system
- Tagging system
- View count tracking
- Soft delete functionality

### Comments
- Nested/threaded comments (replies)
- Upvote/downvote on comments
- Edit and delete comments
- Real-time comment updates

### User Profiles
- Customizable profiles with avatar, bio, location, website
- Skills and title showcase
- Follow/unfollow functionality
- Karma system
- User stats (posts, comments, followers, following)

### Social Features
- Follow/unfollow users
- Leaderboard by karma
- Trending posts
- Search functionality

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Passport.js** - Authentication middleware
- **JWT** - Token-based authentication
- **Express Validator** - Input validation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icons

## Project Structure

```
portfolio-social-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── passport.js          # Passport OAuth configuration
│   │   ├── controllers/              # Route controllers (optional)
│   │   ├── middleware/
│   │   │   └── auth.js              # Authentication middleware
│   │   ├── models/
│   │   │   ├── User.js              # User model
│   │   │   ├── Post.js              # Post model
│   │   │   └── Comment.js           # Comment model
│   │   ├── routes/
│   │   │   ├── auth.routes.js       # Authentication routes
│   │   │   ├── post.routes.js       # Post routes
│   │   │   ├── comment.routes.js    # Comment routes
│   │   │   └── user.routes.js       # User routes
│   │   ├── services/                 # Business logic (optional)
│   │   ├── utils/                    # Utility functions (optional)
│   │   └── server.js                 # Main server file
│   ├── package.json
│   └── .env.example                  # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                   # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx        # Navigation header
│   │   │   │   └── Sidebar.tsx       # Sidebar navigation
│   │   │   ├── posts/
│   │   │   │   └── PostCard.tsx      # Post card component
│   │   │   └── comments/
│   │   │       ├── CommentItem.tsx   # Single comment component
│   │   │       └── CommentSection.tsx # Comment section component
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx       # Authentication context
│   │   ├── pages/
│   │   │   ├── Home.tsx              # Home/feed page
│   │   │   ├── PostDetail.tsx        # Post detail page
│   │   │   ├── Login.tsx             # Login page
│   │   │   ├── Profile.tsx           # User profile page
│   │   │   └── CreatePost.tsx        # Create post page
│   │   ├── services/
│   │   │   └── api.ts                # API service functions
│   │   ├── types/
│   │   │   └── index.ts              # TypeScript type definitions
│   │   ├── App.tsx                   # Main app component
│   │   └── main.tsx                  # Entry point
│   ├── package.json
│   └── ...config files
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- MongoDB instance (local or cloud)
- Google OAuth credentials
- GitHub OAuth credentials

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/portfolio-social
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-super-secret-jwt-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

5. Start the server:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/github` - Initiate GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/logout` - Logout user

### Posts
- `GET /api/posts` - Get all posts (with pagination)
- `GET /api/posts/trending` - Get trending posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/upvote` - Upvote post
- `POST /api/posts/:id/downvote` - Downvote post
- `GET /api/posts/user/:userId` - Get posts by user
- `GET /api/posts/search/:query` - Search posts

### Comments
- `GET /api/comments/post/:postId` - Get comments for a post
- `GET /api/comments/:commentId/replies` - Get replies for a comment
- `GET /api/comments/:id` - Get single comment
- `POST /api/comments` - Create new comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `POST /api/comments/:id/upvote` - Upvote comment
- `POST /api/comments/:id/downvote` - Downvote comment

### Users
- `GET /api/users/profile/:username` - Get user by username
- `GET /api/users/:id` - Get user by ID
- `POST /api/users/:id/follow` - Follow/unfollow user
- `GET /api/users/:id/followers` - Get user's followers
- `GET /api/users/:id/following` - Get user's following
- `GET /api/users/search/:query` - Search users
- `GET /api/users/leaderboard/karma` - Get karma leaderboard

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: 5000) |
| `NODE_ENV` | Environment mode (development/production) |
| `FRONTEND_URL` | Frontend application URL |
| `MONGODB_URI` | MongoDB connection string |
| `SESSION_SECRET` | Secret for session encryption |
| `JWT_SECRET` | Secret for JWT token signing |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth client secret |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL |

## OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5000/api/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:5000/api/auth/github/callback`
4. Copy the Client ID and Client Secret to your `.env` file

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Lucide](https://lucide.dev/) for the icons
- [Tailwind CSS](https://tailwindcss.com/) for the styling utility
