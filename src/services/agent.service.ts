import { AgentData, AgentHistoryItem } from '../features/workflow/types';
import { connectorService } from './connector.service';

class AgentService {
  private agents: AgentData[] = [
    {
      id: 'connect',
      name: 'Data source',
      historyName: 'Data source',
      icon: 'database',
      description: 'Establishing secure link to database',
      history: []
    },
    {
      id: 'ingest',
      name: 'Import',
      historyName: 'Import',
      icon: 'server',
      description: 'Fetching and storing remote data',
      history: [
        {
          id: 'h4',
          date: '2026-03-03T08:35:00Z',
          action: 'Ingesting Sales Analytics',
          details: 'Checking for new data...',
          connectionName: 'Sales Analytics',
          status: 'completed',
          activities: [
            'Streaming rows...',
            'Normalizing data types...',
            'Indexing primary keys...',
            'Storing on local cache...'
          ]
        },
        {
          id: 'h3',
          date: '2026-03-02T10:05:00Z',
          action: 'Ingested Production DB',
          details: 'Fetched 50,000 rows from public.users.',
          connectionName: 'Production DB',
          status: 'completed'
        }
      ]
    },
    {
      id: 'analyze',
      name: 'Process',
      historyName: 'Process',
      icon: 'bar-chart',
      description: 'Generating insights and visuals',
      history: [
        {
          id: 'h5',
          date: '2026-03-02T10:10:00Z',
          action: 'Analyzed Production DB',
          details: 'Generated 5 statistical summaries and detected 2 anomalies.',
          connectionName: 'Production DB',
          status: 'completed',
          contextualInsights: [
            'User activity peaked on weekdays between 9am–12pm.',
            '2 anomalous spikes detected in transaction volume on Feb 28.',
            'Average order value increased by 14.3% compared to last month.',
            'Top 3 products account for 61% of total revenue.'
          ]
        }
      ]
    },
    {
      id: 'query',
      name: 'Query',
      historyName: 'Query',
      icon: 'message-square',
      description: 'Ready to answer your questions',
      history: [
        {
          id: 'h6',
          date: '2026-03-02T10:15:00Z',
          action: 'Chat Session',
          details: 'Answered 3 questions about user retention.',
          connectionName: 'Production DB',
          status: 'completed'
        }
      ]
    }
  ];

  async getAgents(userId: number | null): Promise<AgentData[]> {
    if (!userId) {
      return this.agents.map(agent => ({ ...agent, history: [...agent.history] }));
    }

    try {
      const response = await connectorService.getConnectionHistory(userId);
      if (response.status === 'success') {
        const apiAgents = response.agents;
        this.agents = this.agents.map(localAgent => {
          const apiAgent = apiAgents.find(a => a.id === localAgent.id);
          return apiAgent ? { ...localAgent, history: apiAgent.history } : localAgent;
        });

        return this.agents;
      }
      return this.agents;
    } catch (error) {
      console.error('Failed to fetch agents:', error);
      return this.agents;
    }
  }

  async getAgentHistory(agentId: string): Promise<AgentHistoryItem[]> {
    const agent = this.agents.find(a => a.id === agentId);
    return new Promise(resolve => setTimeout(() => resolve(agent?.history || []), 300));
  }

  async addHistoryItem(agentId: string, item: Omit<AgentHistoryItem, 'id' | 'date'>): Promise<AgentHistoryItem> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    const newItem: AgentHistoryItem = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    };

    agent.history.unshift(newItem);
    return new Promise(resolve => setTimeout(() => resolve(newItem), 300));
  }

  async updateHistoryItem(agentId: string, itemId: string, updates: Partial<AgentHistoryItem>): Promise<void> {
    const agent = this.agents.find(a => a.id === agentId);
    if (!agent) throw new Error('Agent not found');

    const itemIndex = agent.history.findIndex(h => h.id === itemId);
    if (itemIndex === -1) throw new Error('History item not found');

    agent.history[itemIndex] = { ...agent.history[itemIndex], ...updates };
    return new Promise(resolve => setTimeout(resolve, 300));
  }
}

export const agentService = new AgentService();
