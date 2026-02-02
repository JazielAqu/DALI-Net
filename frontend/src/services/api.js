import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth token if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  guestLogin: () => api.post('/auth/guest-login'),
};

// Members API
export const membersAPI = {
  getAll: (params) => api.get('/members', { params }),
  getById: (id) => api.get(`/members/${id}`),
  getPosts: (id, params) => api.get(`/members/${id}/posts`, { params }),
  getFollowers: (id) => api.get(`/members/${id}/followers`),
  getFollowing: (id) => api.get(`/members/${id}/following`),
  create: (data) => api.post('/members', data),
  update: (id, data) => api.patch(`/members/${id}`, data),
  createSelf: () => api.post('/members/self'),
  deleteSelf: () => api.delete('/members/self'),
};

// Posts API
export const postsAPI = {
  getAll: (params) => api.get('/posts', { params }),
  getById: (id) => api.get(`/posts/${id}`),
  getFeed: (userId, params) => api.get(`/posts/feed/${userId}`, { params }),
  create: (data) => api.post('/posts', data),
  update: (id, data) => api.patch(`/posts/${id}`, data),
  delete: (id, data) => api.delete(`/posts/${id}`, { data }),
};

// Following API
export const followingAPI = {
  follow: (data) => api.post('/following', data),
  unfollow: (followerId, followingId) => api.delete(`/following/${followerId}/${followingId}`),
  getFollowers: (userId) => api.get(`/following/${userId}/followers`),
  getFollowing: (userId) => api.get(`/following/${userId}/following`),
};

// Likes API
export const likesAPI = {
  like: (data) => api.post('/likes', data),
  unlike: (userId, postId) => api.delete(`/likes/${userId}/${postId}`),
  getByPost: (postId) => api.get(`/likes/post/${postId}`),
  getByUser: (userId) => api.get(`/likes/user/${userId}`),
};

// Comments API
export const commentsAPI = {
  getByPost: (postId) => api.get(`/comments/post/${postId}`),
  create: (data) => api.post('/comments', data),
  delete: (id, data) => api.delete(`/comments/${id}`, { data }),
};

// Notifications API
export const notificationsAPI = {
  getByUser: (userId, params) => api.get(`/notifications/${userId}`, { params }),
  create: (data) => api.post('/notifications', data),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: (userId) => api.patch(`/notifications/${userId}/read-all`),
  clearAll: (userId) => api.delete(`/notifications/user/${userId}`),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
