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
      // Backend returns {"msg": "...", "status": false} or {"message": "...", "details": "...", "status": "error"}
      const errorMessage = errorData.message || errorData.msg || `API Error: ${response.status} ${response.statusText}`;
      const detailedMessage = errorData.details ? `${errorMessage}: ${errorData.details}` : errorMessage;
      throw new Error(detailedMessage);
    }
    return response.json();
  }

  private handleError(error: any) {
    // Global error handling logic
    console.error('[Global API Error]', error);
    // You could integrate a toast library here (e.g., toast.error(error.message))
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const userId = localStorage.getItem('dataor_user_id');
    if (userId) {
      headers['user_id'] = userId;
      headers['user-id'] = userId; // Fallback in case backend expects kebab-case
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const response = await fetch(`${this.config.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: this.getHeaders(),
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
        headers: this.getHeaders(),
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
