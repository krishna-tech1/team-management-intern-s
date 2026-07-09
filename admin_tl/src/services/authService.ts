import { apiClient } from './apiClient';

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    return apiClient.post('/auth/login', credentials);
  },
  logout: async () => {
    return apiClient.post('/auth/logout');
  },
  getCurrentUser: async () => {
    return apiClient.get('/auth/me');
  },
  changePassword: async (payload: { oldPassword: string; newPassword: string }) => {
    return apiClient.post('/onboarding/password/change', payload);
  }
};
