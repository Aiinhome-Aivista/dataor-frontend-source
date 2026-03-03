import { Connector } from '../features/connectors/types';
import { apiService, IApiService } from './api.service';

export interface IConnectorService {
  getConnectors(): Promise<Connector[]>;
  getCollections(connectorId: string): Promise<string[]>;
}

class ConnectorService implements IConnectorService {
  private api: IApiService;

  constructor(api: IApiService) {
    this.api = api;
  }

  async getConnectors(): Promise<Connector[]> {
    // In a real app: return this.api.get<Connector[]>('/connectors');
    // For now, simulate API call with dummy data
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate potential error for demonstration
        if (Math.random() < 0.05) {
          reject(new Error('Failed to fetch connectors'));
          return;
        }
        resolve([
          {
            id: '1',
            name: 'Production DB',
            description: 'Connect your Postgres data for instant AI analysis',
            type: 'Database',
            icon: 'database',
            status: 'connected',
          },
          {
            id: '2',
            name: 'Sales Analytics',
            description: 'Connect your MySQL data for instant AI analysis',
            type: 'Database',
            icon: 'server',
            status: 'connected',
          },
          {
            id: '3',
            name: 'Snowflake',
            description: 'Connect your Snowflake data for instant AI analysis',
            type: 'Data Warehouse',
            icon: 'server',
            status: 'disconnected',
          },
          {
            id: '4',
            name: 'Slack',
            description: 'Connect your Slack workspace to receive reports and insights',
            type: 'Integration',
            icon: 'share-2',
            status: 'connected',
          },
          {
            id: '5',
            name: 'Google Drive',
            description: 'Analyze your Google Drive files and folders',
            type: 'Integration',
            icon: 'share-2',
            status: 'disconnected',
          },
        ]);
      }, 500);
    });
  }

  async getCollections(connectorId: string): Promise<string[]> {
    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.05) {
          reject(new Error('Failed to fetch collections'));
          return;
        }
        if (connectorId === '1') {
          resolve(['users', 'orders', 'products', 'transactions']);
        } else if (connectorId === '2') {
          resolve(['leads', 'opportunities', 'campaigns']);
        } else {
          resolve(['table1', 'table2']);
        }
      }, 500);
    });
  }
}

export const connectorService: IConnectorService = new ConnectorService(apiService);
