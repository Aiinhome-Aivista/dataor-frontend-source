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
      history: []
    },
    {
      id: 'analyze',
      name: 'Process',
      historyName: 'Process',
      icon: 'bar-chart',
      description: 'Generating insights and visuals',
      history: []
    },
    {
      id: 'query',
      name: 'Query',
      historyName: 'Query',
      icon: 'message-square',
      description: 'Ready to answer your questions',
      history: []
    }
  ];

  async getAgents(userId: number | null, fetchFromApi: boolean = true): Promise<AgentData[]> {
    if (!userId) {
      return this.agents.map(agent => ({ ...agent, history: [...agent.history] }));
    }

    if (!fetchFromApi) {
      return this.agents.map(agent => ({ ...agent, history: [...agent.history] }));
    }

    try {
      const response = await connectorService.getConnectionHistory(userId);
      if (response.status === 'success') {
        const apiAgents = response.agents;
        this.agents = this.agents.map(localAgent => {
          const apiAgent = apiAgents.find((a: any) => a.id === localAgent.id);
          if (apiAgent) {
            // Map the backend 'id' from the history item to our frontend 'connectorId'
            const mappedHistory = apiAgent.history.map((h: any) => {
              // Ensure session_id is captured, checking multiple possible backend keys just in case.
              const extractedSessionId = h.session_id || h.sessionId || h.sessionID || (apiAgent as any).session_id || response.session_id;

              return {
                ...h,
                session_id: extractedSessionId,
                connectorId: h.id, // The backend uses 'id' for the connection ID
                id: h.id // keep original id as well for react keys
              };
            });
            return { ...localAgent, history: mappedHistory };
          }
          return localAgent;
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
