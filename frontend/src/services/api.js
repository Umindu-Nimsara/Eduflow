import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  timeout: 600000, // 10 minutes for large file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // For FormData, let React Native set Content-Type with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
    } catch (error) {
      console.error('Error getting token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          await AsyncStorage.setItem('accessToken', accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } else {
          // No refresh token, logout
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          // Navigation will be handled by AuthContext
        }
      } catch (refreshError) {
        // Refresh failed, logout
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access denied');
    }

    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error');
    }

    // Handle Network Error
    if (!error.response) {
      console.error('=== NETWORK ERROR ===');
      console.error('Message:', error.message);
      console.error('Config:', error.config?.url);
      console.error('BaseURL:', error.config?.baseURL);
      console.error('====================');
    }

    return Promise.reject(error);
  }
);

export default api;
