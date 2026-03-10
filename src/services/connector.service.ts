import { Connector } from '../features/connectors/types';
import { apiService, IApiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface IConnectorService {
  getCollections(connectorId: string): Promise<string[]>;
  addConnector(connector: Omit<Connector, 'id' | 'status'>): Promise<Connector>;
  createConnector(payload: any, userId?: number | null): Promise<any>;
  getConnectionHistory(userId: number | null): Promise<any>;
  continueToImport(payload: { user_id: string; connection_id: string; session_id?: string }): Promise<any>;
  searchWeb(query: string): Promise<any>;
  saveResult(payload: any): Promise<any>;
  getSavedResults(userId: string, topic?: string): Promise<any>;
  deleteSavedResult(id: string, userId: string): Promise<any>;
  describeSavedContent(userId: string): Promise<any>;
  getSessionSources(sessionId: string): Promise<any>;
  processSessionAnalysis(payload: { session_id: string; topics?: string[]; databases?: string[] }): Promise<any>;
}

class ConnectorService implements IConnectorService {
  private api: IApiService;

  private collections: Record<string, string[]> = {
    '1': ['users', 'orders', 'products', 'transactions'],
    '2': ['leads', 'opportunities', 'campaigns']
  };

  constructor(api: IApiService) {
    this.api = api;
  }

  async getCollections(connectorId: string): Promise<string[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.collections[connectorId] || ['table1', 'table2']);
      }, 500);
    });
  }

  async addConnector(connector: Omit<Connector, 'id' | 'status'>): Promise<Connector> {
    const newConnector: Connector = {
      ...connector,
      id: Math.random().toString(36).substr(2, 9),
      status: 'connected'
    };

    this.collections[newConnector.id] = ['new_table_1', 'new_table_2'];

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(newConnector);
      }, 500);
    });
  }

  async createConnector(payload: any): Promise<any> {
    return this.api.post(API_ENDPOINTS.DATA_SOURCE.CREATE_CONNECTORS, payload);
  }

  async getConnectionHistory(userId: number | null): Promise<any> {
    return this.api.get(`${API_ENDPOINTS.DATA_SOURCE.CONNECTION_HISTORY}?user_id=${userId}`);
  }

  async continueToImport(payload: { user_id: string; connection_id: string; session_id?: string }): Promise<any> {
    return this.api.post(API_ENDPOINTS.DATA_SOURCE.CONTINUE_TO_IMPORT, payload);
  }

  async searchWeb(query: string): Promise<any> {
    const userId = localStorage.getItem('dataor_user_id');
    return this.api.post(API_ENDPOINTS.DATA_SOURCE.WEB_SEARCH, {
      topic: query,
      user_id: userId
    });
  }

  async saveResult(payload: any): Promise<any> {
    return this.api.post(API_ENDPOINTS.IMPORT.SAVE_RESULT_SEARCH, payload);
  }

  async getSavedResults(userId: string, topic?: string): Promise<any> {
    if (!topic) {
      return Promise.resolve({ status: 'success', results: [] });
    }
    const url = `${API_ENDPOINTS.IMPORT.GET_SAVED_RESULTS}?user_id=${userId}&topic=${encodeURIComponent(topic)}`;
    return this.api.get(url);
  }

  async deleteSavedResult(id: string, userId: string): Promise<any> {
    return this.api.delete(`${API_ENDPOINTS.IMPORT.DELETE_SAVED_RESULT}/${id}?user_id=${userId}`);
  }

  async describeSavedContent(userId: string): Promise<any> {
    return this.api.post(API_ENDPOINTS.IMPORT.DESCRIBE_CONTENT, { user_id: userId });
  }

  async getSessionSources(sessionId: string): Promise<any> {
    return this.api.get(`${API_ENDPOINTS.IMPORT.SESSION_SOURCES}?session_id=${sessionId}`);
  }

  async processSessionAnalysis(payload: { session_id: string; topics?: string[]; databases?: string[] }): Promise<any> {
    return this.api.post(API_ENDPOINTS.IMPORT.SESSION_ANALYSIS, payload);
  }
}

export const connectorService: IConnectorService = new ConnectorService(apiService);
