import api from './api';
import { ENDPOINTS } from '../constants/api';

export const discussionService = {
  // Instructor APIs
  getInstructorCourses: async (instructorId) => {
    const response = await api.get(`${ENDPOINTS.INSTRUCTORS}/${instructorId}/courses`);
    return response.data;
  },

  // Discussion APIs
  getDiscussionsByCourse: async (courseId, page = 1, limit = 10) => {
    const response = await api.get(`${ENDPOINTS.DISCUSSIONS}/course/${courseId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  getDiscussionById: async (discussionId) => {
    const response = await api.get(`${ENDPOINTS.DISCUSSIONS}/${discussionId}`);
    return response.data;
  },

  createDiscussion: async (data) => {
    const response = await api.post(ENDPOINTS.DISCUSSIONS, data);
    return response.data;
  },

  updateDiscussion: async (discussionId, data) => {
    const response = await api.put(`${ENDPOINTS.DISCUSSIONS}/${discussionId}`, data);
    return response.data;
  },

  deleteDiscussion: async (discussionId) => {
    const response = await api.delete(`${ENDPOINTS.DISCUSSIONS}/${discussionId}`);
    return response.data;
  },

  likeDiscussion: async (discussionId) => {
    const response = await api.post(`${ENDPOINTS.DISCUSSIONS}/${discussionId}/like`);
    return response.data;
  },

  // Reply APIs
  getRepliesByDiscussion: async (discussionId) => {
    const response = await api.get(`${ENDPOINTS.DISCUSSIONS}/${discussionId}/replies`);
    return response.data;
  },

  createReply: async (data) => {
    const response = await api.post(`${ENDPOINTS.DISCUSSIONS}/${data.discussionId}/reply`, {
      content: data.content
    });
    return response.data;
  },

  updateReply: async (replyId, data) => {
    const response = await api.put(`${ENDPOINTS.DISCUSSIONS}/reply/${replyId}`, data);
    return response.data;
  },

  deleteReply: async (replyId) => {
    const response = await api.delete(`${ENDPOINTS.DISCUSSIONS}/reply/${replyId}`);
    return response.data;
  },

  likeReply: async (replyId) => {
    const response = await api.post(`${ENDPOINTS.DISCUSSIONS}/reply/${replyId}/like`);
    return response.data;
  },

  // Feedback APIs
  getCourseFeedback: async (courseId, page = 1, limit = 10) => {
    const response = await api.get(`${ENDPOINTS.FEEDBACK}/course/${courseId}`, {
      params: { page, limit },
    });
    return response.data;
  },

  createFeedback: async (data) => {
    const response = await api.post(ENDPOINTS.FEEDBACK, data);
    return response.data;
  },

  updateFeedback: async (feedbackId, data) => {
    const response = await api.put(`${ENDPOINTS.FEEDBACK}/${feedbackId}`, data);
    return response.data;
  },

  deleteFeedback: async (feedbackId) => {
    const response = await api.delete(`${ENDPOINTS.FEEDBACK}/${feedbackId}`);
    return response.data;
  },

  // Report APIs
  createReport: async (data) => {
    const response = await api.post(ENDPOINTS.REPORTS, data);
    return response.data;
  },

  getMyReports: async () => {
    const response = await api.get(`${ENDPOINTS.REPORTS}/my-reports`);
    return response.data;
  },
};
