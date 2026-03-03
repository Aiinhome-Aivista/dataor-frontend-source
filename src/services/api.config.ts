export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

export const defaultConfig: ApiConfig = {
  baseUrl: 'https://api.example.com', // Replace with actual DB config later
  timeout: 10000,
};
