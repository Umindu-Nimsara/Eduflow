import api from './api';
import { ENDPOINTS } from '../constants/api';

export const instructorService = {
  getAllInstructors: async (page = 1, limit = 10) => {
    const response = await api.get(ENDPOINTS.INSTRUCTORS, {
      params: { page, limit },
    });
    return response.data;
  },

  getInstructorById: async (id) => {
    const response = await api.get(`${ENDPOINTS.INSTRUCTORS}/${id}`);
    return response.data;
  },

  registerInstructor: async (instructorData) => {
    const response = await api.post(ENDPOINTS.INSTRUCTOR_REGISTER, instructorData);
    return response.data;
  },

  updateInstructor: async (id, instructorData) => {
    const response = await api.put(`${ENDPOINTS.INSTRUCTORS}/${id}`, instructorData);
    return response.data;
  },

  uploadPhoto: async (formData) => {
    const response = await api.post(ENDPOINTS.INSTRUCTOR_UPLOAD_PHOTO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getInstructorCourses: async (id) => {
    const response = await api.get(`${ENDPOINTS.INSTRUCTORS}/${id}/courses`);
    return response.data;
  },

  getInstructorStats: async (id) => {
    const response = await api.get(`${ENDPOINTS.INSTRUCTORS}/${id}/stats`);
    return response.data;
  },
};
