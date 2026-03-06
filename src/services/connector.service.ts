import { Connector } from '../features/connectors/types';
import { apiService, IApiService } from './api.service';

export interface IConnectorService {
  getConnectors(): Promise<Connector[]>;
  getCollections(connectorId: string): Promise<string[]>;
  addConnector(connector: Omit<Connector, 'id' | 'status'>): Promise<Connector>;
}

class ConnectorService implements IConnectorService {
  private api: IApiService;
  private connectors: Connector[] = [
    {
      id: '1',
      name: 'Snowflake',
      description: 'Connect your Snowflake data warehouse for instant AI analysis',
      type: 'Data Warehouse',
      icon: 'database',
      status: 'disconnected',
    },
    {
      id: '2',
      name: 'MySQL',
      description: 'Connect your MySQL database for instant AI analysis',
      type: 'Database',
      icon: 'server',
      status: 'disconnected',
    },
    {
      id: '3',
      name: 'MSSQL',
      description: 'Connect your Microsoft SQL Server for instant AI analysis',
      type: 'Database',
      icon: 'server',
      status: 'disconnected',
    },
    {
      id: '4',
      name: 'PostgreSQL',
      description: 'Connect your PostgreSQL database for instant AI analysis',
      type: 'Database',
      icon: 'database',
      status: 'disconnected',
    },
    {
      id: '5',
      name: 'Google Sheets',
      description: 'Connect your Google Sheets to query and analyze spreadsheet data with AI',
      type: 'Integration',
      icon: 'table',
      status: 'disconnected',
    },
    {
      id: '6',
      name: 'Web Search using LLM',
      description: 'Query the web using large language models to fetch and analyze live data',
      type: 'Integration',
      icon: 'globe',
      status: 'disconnected',
    },
  ];

  private collections: Record<string, string[]> = {
    '1': ['users', 'orders', 'products', 'transactions'],
    '2': ['leads', 'opportunities', 'campaigns']
  };

  constructor(api: IApiService) {
    this.api = api;
  }

  async getConnectors(): Promise<Connector[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...this.connectors]);
      }, 500);
    });
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

    this.connectors.push(newConnector);
    this.collections[newConnector.id] = ['new_table_1', 'new_table_2'];

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(newConnector);
      }, 500);
    });
  }
}

export const connectorService: IConnectorService = new ConnectorService(apiService);
