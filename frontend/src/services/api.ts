// frontend/src/services/api.ts
import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import type { User, PostFormData, CommentFormData } from '@/types';

const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (token: string) => {
    localStorage.setItem('token', token);
    return api.get('/auth/me');
  },
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: Partial<User>) => api.put('/auth/profile', data),
  checkUsername: (username: string) => api.get(`/auth/check-username/${username}`),
  googleAuth: () => {
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  },
  githubAuth: () => {
    window.location.href = `${api.defaults.baseURL}/auth/github`;
  },
};

export const postsAPI = {
  getAll: (params?: { page?: number; limit?: number; sortBy?: string }) =>
    api.get('/posts', { params }),
  getTrending: (limit?: number) => api.get('/posts/trending', { params: { limit } }),
  getById: (id: string) => api.get(`/posts/${id}`),
  create: (data: PostFormData) => api.post('/posts', data),
  update: (id: string, data: Partial<PostFormData>) => api.put(`/posts/${id}`, data),
  delete: (id: string) => api.delete(`/posts/${id}`),
  upvote: (id: string) => api.post(`/posts/${id}/upvote`),
  downvote: (id: string) => api.post(`/posts/${id}/downvote`),
  getByUser: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/posts/user/${userId}`, { params }),
  search: (query: string, params?: { page?: number; limit?: number }) =>
    api.get(`/posts/search/${query}`, { params }),
};

export const commentsAPI = {
  getByPost: (postId: string, params?: { page?: number; limit?: number; sortBy?: string }) =>
    api.get(`/comments/post/${postId}`, { params }),
  getReplies: (commentId: string, limit?: number) =>
    api.get(`/comments/${commentId}/replies`, { params: { limit } }),
  getById: (id: string) => api.get(`/comments/${id}`),
  create: (data: CommentFormData) => api.post('/comments', data),
  update: (id: string, content: string) => api.put(`/comments/${id}`, { content }),
  delete: (id: string) => api.delete(`/comments/${id}`),
  upvote: (id: string) => api.post(`/comments/${id}/upvote`),
  downvote: (id: string) => api.post(`/comments/${id}/downvote`),
  getByUser: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/comments/user/${userId}`, { params }),
};

export const usersAPI = {
  getByUsername: (username: string) => api.get(`/users/profile/${username}`),
  getById: (id: string) => api.get(`/users/${id}`),
  follow: (id: string) => api.post(`/users/${id}/follow`),
  getFollowers: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/${id}/followers`, { params }),
  getFollowing: (id: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/${id}/following`, { params }),
  search: (query: string, params?: { page?: number; limit?: number }) =>
    api.get(`/users/search/${query}`, { params }),
  getLeaderboard: (limit?: number) => api.get('/users/leaderboard/karma', { params: { limit } }),
};

export default api;