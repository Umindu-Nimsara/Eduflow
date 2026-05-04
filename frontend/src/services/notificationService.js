import api from './api';
import { ENDPOINTS } from '../constants/api';

export const notificationService = {
  // Notification APIs
  getMyNotifications: async (page = 1, limit = 20) => {
    const response = await api.get(ENDPOINTS.NOTIFICATIONS, {
      params: { page, limit },
    });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put(`${ENDPOINTS.NOTIFICATIONS}/mark-all-read`);
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`${ENDPOINTS.NOTIFICATIONS}/${notificationId}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get(`${ENDPOINTS.NOTIFICATIONS}/unread-count`);
    return response.data;
  },

  // Announcement APIs
  getAllAnnouncements: async (page = 1, limit = 10) => {
    const response = await api.get(ENDPOINTS.ANNOUNCEMENTS, {
      params: { page, limit },
    });
    return response.data;
  },

  getAnnouncementById: async (announcementId) => {
    const response = await api.get(`${ENDPOINTS.ANNOUNCEMENTS}/${announcementId}`);
    return response.data;
  },

  // Streak APIs
  getMyStreak: async () => {
    const response = await api.get(`${ENDPOINTS.STREAKS}/my-streak`);
    return response.data;
  },

  updateStreak: async () => {
    const response = await api.post(`${ENDPOINTS.STREAKS}/update`);
    return response.data;
  },

  // Badge APIs
  getMyBadges: async () => {
    const response = await api.get(`${ENDPOINTS.BADGES}/my-badges`);
    return response.data;
  },

  getAllBadges: async () => {
    const response = await api.get(ENDPOINTS.BADGES);
    return response.data;
  },
};
