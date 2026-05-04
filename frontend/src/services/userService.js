import api from './api';
import { ENDPOINTS } from '../constants/api';

export const userService = {
  getUserById: async (id) => {
    const response = await api.get(`${ENDPOINTS.USERS}/${id}`);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`${ENDPOINTS.USERS}/${id}`, userData);
    return response.data;
  },

  uploadPhoto: async (formData) => {
    const response = await api.post(ENDPOINTS.USER_UPLOAD_PHOTO, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
