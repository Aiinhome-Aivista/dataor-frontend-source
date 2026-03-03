import { AgentData, AgentHistoryItem } from '../features/workflow/types';

class AgentService {
  private agents: AgentData[] = [
    {
      id: 'connect',
      name: 'Connection Agent',
      icon: 'database',
      description: 'Establishing secure link to database',
      history: [
        {
          id: 'h2',
          date: '2026-03-03T08:30:00Z',
          action: 'Reconnected to Sales Analytics',
          details: 'MySQL connection established successfully.',
          status: 'pending_input',
          activities: [
            'Verifying credentials...',
            'Establishing SSL tunnel...',
            'Handshaking with MySQL...',
            'Mapping schema structures...'
          ],
          prompt: 'New table "user_activity_logs" found on the database. Do you want to fetch the new table?',
          options: ['Fetch New Table', 'Ignore', 'Select Specific Tables']
        },
        {
          id: 'h1',
          date: '2026-03-02T10:00:00Z',
          action: 'Connected to Production DB',
          details: 'PostgreSQL connection established successfully.',
          status: 'completed'
        }
      ]
    },
    {
      id: 'ingest',
      name: 'Ingestion Agent',
      icon: 'server',
      description: 'Fetching and storing remote data',
      history: [
        {
          id: 'h4',
          date: '2026-03-03T08:35:00Z',
          action: 'Ingesting Sales Analytics',
          details: 'Checking for new data...',
          status: 'pending_input',
          activities: [
            'Streaming rows...',
            'Normalizing data types...',
            'Indexing primary keys...',
            'Storing on local cache...'
          ],
          prompt: 'New 2k data rows found. Do you want to replace the whole data or only get new data?',
          options: ['Replace Whole Data', 'Get New Data Only', 'Skip']
        },
        {
          id: 'h3',
          date: '2026-03-02T10:05:00Z',
          action: 'Ingested Production DB',
          details: 'Fetched 50,000 rows from public.users.',
          status: 'completed'
        }
      ]
    },
    {
      id: 'analyze',
      name: 'Analysis Agent',
      icon: 'bar-chart',
      description: 'Generating insights and visuals',
      history: [
        {
          id: 'h5',
          date: '2026-03-02T10:10:00Z',
          action: 'Analyzed Production DB',
          details: 'Generated 5 statistical summaries and detected 2 anomalies.',
          status: 'completed'
        }
      ]
    },
    {
      id: 'query',
      name: 'Query Agent',
      icon: 'message-square',
      description: 'Ready to answer your questions',
      history: [
        {
          id: 'h6',
          date: '2026-03-02T10:15:00Z',
          action: 'Chat Session',
          details: 'Answered 3 questions about user retention.',
          status: 'completed'
        }
      ]
    }
  ];

  async getAgents(): Promise<AgentData[]> {
    return new Promise(resolve => setTimeout(() => resolve(this.agents), 500));
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
