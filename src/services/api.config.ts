export interface ApiConfig {
  baseUrl: string;
  timeout?: number;
}

export const defaultConfig: ApiConfig = {
  baseUrl: 'http://122.163.121.176:3004',
  timeout: 10000,
};

export const API_ENDPOINTS = {
  AUTH: {
    login: '/login',
  },
  CONNECTORS: {
    CONNECTOR: '/connectors',
  },
  AGENTS: {
    AGENT: '/agents',
  },
};
