import { ApiConfig, defaultConfig } from './api.config';

export interface IApiService {
  get<T>(endpoint: string): Promise<T>;
  post<T>(endpoint: string, data: any): Promise<T>;
}

class ApiService implements IApiService {
  private config: ApiConfig;

  constructor(config: ApiConfig = defaultConfig) {
    this.config = config;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  private handleError(error: any) {
    // Global error handling logic
    console.error('[Global API Error]', error);
    // You could integrate a toast library here (e.g., toast.error(error.message))
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      return this.handleResponse<T>(response);
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
}

// Export as a singleton instance of the interface
export const apiService: IApiService = new ApiService();
