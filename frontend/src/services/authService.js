import api from './api';
import { ENDPOINTS } from '../constants/api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post(ENDPOINTS.AUTH_LOGIN, { email, password });
    return response.data;
  },

  register: async (name, email, password, role = 'student') => {
    const response = await api.post(ENDPOINTS.AUTH_REGISTER, { name, email, password, role });
    return response.data;
  },

  logout: async () => {
    const response = await api.post(ENDPOINTS.AUTH_LOGOUT);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get(ENDPOINTS.AUTH_ME);
    return response.data;
  },

  refreshToken: async (refreshToken) => {
    const response = await api.post(ENDPOINTS.AUTH_REFRESH, { refreshToken });
    return response.data;
  },
};
