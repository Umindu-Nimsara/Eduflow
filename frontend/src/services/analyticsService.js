import api from './api';
import { ENDPOINTS } from '../constants/api';

export const analyticsService = {
  // Enrollment APIs
  getMyEnrollments: async (page = 1, limit = 10) => {
    const response = await api.get(`${ENDPOINTS.ENROLLMENTS}/my-enrollments`, {
      params: { page, limit },
    });
    return response.data;
  },

  getEnrollmentById: async (enrollmentId) => {
    const response = await api.get(`${ENDPOINTS.ENROLLMENTS}/${enrollmentId}`);
    return response.data;
  },

  // Progress APIs
  getCourseProgress: async (courseId) => {
    const response = await api.get(`${ENDPOINTS.PROGRESS}/course/${courseId}`);
    return response.data;
  },

  updateLessonProgress: async (lessonId, data) => {
    const response = await api.post(`${ENDPOINTS.PROGRESS}/lesson/${lessonId}`, data);
    return response.data;
  },

  getMyProgress: async () => {
    const response = await api.get(`${ENDPOINTS.PROGRESS}/my-progress`);
    return response.data;
  },

  // Certificate APIs
  getMyCertificates: async () => {
    const response = await api.get(`${ENDPOINTS.CERTIFICATES}/my-certificates`);
    return response.data;
  },

  getCertificateById: async (certificateId) => {
    const response = await api.get(`${ENDPOINTS.CERTIFICATES}/${certificateId}`);
    return response.data;
  },

  downloadCertificate: async (certificateId) => {
    const response = await api.get(`${ENDPOINTS.CERTIFICATES}/${certificateId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Analytics APIs
  getStudentAnalytics: async () => {
    const response = await api.get(`${ENDPOINTS.ANALYTICS}/student`);
    return response.data;
  },

  getInstructorAnalytics: async () => {
    const response = await api.get(`${ENDPOINTS.ANALYTICS}/instructor`);
    return response.data;
  },

  getCourseAnalytics: async (courseId) => {
    const response = await api.get(`${ENDPOINTS.ANALYTICS}/course/${courseId}`);
    return response.data;
  },
};
