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

      ]
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

  private sessionSourcesCache: Record<string, any> = {};

  async getAgents(userId: number | null, fetchFromApi: boolean = true): Promise<AgentData[]> {
    const sessionId = localStorage.getItem('DAgent_session_id');
    
    if (!sessionId) {
      return this.agents.map(agent => ({ ...agent, history: [...agent.history] }));
    }

    if (!fetchFromApi) {
      return this.agents.map(agent => ({ ...agent, history: [...agent.history] }));
    }

    try {
      const response = await connectorService.getConnectionHistory(sessionId);
      if (response && response.status === 'success' && response.agents) {
        const apiAgents = response.agents;

        this.agents = this.agents.map(localAgent => {
          const apiAgent = apiAgents.find((a: any) => a.id === localAgent.id);
          let rawHistory: any[] = [];

          if (apiAgent && apiAgent.history) {
            rawHistory = [...apiAgent.history];
          }

          // Map and sort history items
          const mappedHistory = rawHistory.map((h: any) => ({
            ...h,
            session_id: h.session_id || h.sessionId || h.sessionID || sessionId,
            connectorId: h.id, 
            id: h.id || Math.random().toString(36).substr(2, 9)
          }));

          mappedHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

          return { ...localAgent, history: mappedHistory };
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
    return agent?.history || [];
  }

  async addHistoryItem(agentId: string, item: Omit<AgentHistoryItem, 'id' | 'date'>): Promise<AgentHistoryItem> {
    // History is now strictly API-driven. We return a temporary representation 
    // but the next getAgents poll will overwrite with official API data.
    return {
      ...item,
      id: 'temp-' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString()
    } as AgentHistoryItem;
  }

  async updateHistoryItem(agentId: string, itemId: string, updates: Partial<AgentHistoryItem>): Promise<void> {
    // No-op: official status updates should come from the server through the polling cycle
    console.log(`Update requested for ${agentId}/${itemId}, awaiting server sync.`);
  }
}

export const agentService = new AgentService();
