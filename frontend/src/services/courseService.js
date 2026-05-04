import api from './api';
import { ENDPOINTS } from '../constants/api';

export const courseService = {
  getAllCourses: async (page = 1, limit = 10, search = '', category = '') => {
    const response = await api.get(ENDPOINTS.COURSES, {
      params: { page, limit, search, category },
    });
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await api.get(`${ENDPOINTS.COURSES}/${id}`);
    return response.data;
  },

  createCourse: async (courseData) => {
    const response = await api.post(ENDPOINTS.COURSES, courseData);
    return response.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await api.put(`${ENDPOINTS.COURSES}/${id}`, courseData);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`${ENDPOINTS.COURSES}/${id}`);
    return response.data;
  },

  uploadThumbnail: async (formData) => {
    const response = await api.post(ENDPOINTS.COURSE_UPLOAD, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getLessonsByCourse: async (courseId) => {
    // Add timestamp to bypass cache
    const timestamp = new Date().getTime();
    const response = await api.get(`${ENDPOINTS.COURSES}/${courseId}/lessons?_t=${timestamp}`);
    return response.data;
  },
};
