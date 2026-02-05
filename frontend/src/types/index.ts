// User Types
export interface User {
  _id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  karma: number;
  title?: string;
  skills?: string[];
  followers: string[] | User[];
  following: string[] | User[];
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  followerCount?: number;
  followingCount?: number;
}

export interface UserStats {
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  karma: number;
}

// Post Types
export interface Post {
  _id: string;
  author: User;
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'portfolio';
  linkUrl?: string;
  images: string[];
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  comments: string[] | Comment[];
  tags: string[];
  views: number;
  isPinned: boolean;
  isDeleted: boolean;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
  voteScore?: number;
  commentCount?: number;
  userVote?: 'up' | 'down' | null;
}

// Comment Types
export interface Comment {
  _id: string;
  post: string | Post;
  author: User;
  content: string;
  parentComment: string | Comment | null;
  replies: string[] | Comment[];
  votes: {
    upvotes: string[];
    downvotes: string[];
  };
  isEdited: boolean;
  editedAt?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  voteScore?: number;
  replyCount?: number;
  userVote?: 'up' | 'down' | null;
}

// Auth Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

// Form Types
export interface PostFormData {
  title: string;
  content: string;
  type: 'text' | 'link' | 'image' | 'portfolio';
  linkUrl?: string;
  images?: string[];
  tags?: string[];
}

export interface CommentFormData {
  content: string;
  postId: string;
  parentCommentId?: string;
}

// UI Types
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
}
