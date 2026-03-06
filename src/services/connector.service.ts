import { Connector } from '../features/connectors/types';
import { apiService, IApiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface IConnectorService {
  getCollections(connectorId: string): Promise<string[]>;
  addConnector(connector: Omit<Connector, 'id' | 'status'>): Promise<Connector>;
  createConnector(payload: any): Promise<any>;
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
}

export const connectorService: IConnectorService = new ConnectorService(apiService);
