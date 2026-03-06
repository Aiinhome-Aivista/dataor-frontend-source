import { connect } from "http2";

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
    LOGIN: '/login',
  },
  DATA_SOURCE: {
    CONNECTION_HISTORY: '/connection_history',
    CREATE_CONNECTORS: '/create_connectors',
  },
  IMPORT: {
    AGENT: '/agents',
  },
};
