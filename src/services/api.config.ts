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
    CONTINUE_TO_IMPORT: '/connect-external-db',
    WEB_SEARCH: '/search',
  },
  IMPORT: {
    AGENT: '/agents',
    SESSION_SOURCES: '/session-sources',
    SESSION_ANALYSIS: '/session-analysis',
    SAVE_RESULT_SEARCH: '/save-result',
    GET_SAVED_RESULTS: '/saved-results',
    DELETE_SAVED_RESULT: '/saved-results',
    DESCRIBE_CONTENT: '/saved-content/describe',
  },
  CHAT: {
    CHAT: '/session-chat',
  },
  WORKSPACE: {
    CREATE: '/create_workspace',
    GET_WORKSPACES: '/workspaces',
  },
};
