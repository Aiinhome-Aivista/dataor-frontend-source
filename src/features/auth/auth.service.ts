import { apiService } from '../../services/api.service';
import { API_ENDPOINTS } from '../../services/api.config';

export const authService = {
  login: async (email: string, password?: string) => {
    return apiService.post(API_ENDPOINTS.AUTH.login, { email, password });
  }
};
