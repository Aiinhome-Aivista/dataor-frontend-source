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

  async getAgents(userId: number | null, fetchFromApi: boolean = true, includeSessionSources: boolean = false): Promise<AgentData[]> {
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

        // Fetch session sources if requested
        if (includeSessionSources) {
          const allSessionIds = new Set<string>();
          if (response.session_id) allSessionIds.add(response.session_id);

          apiAgents.forEach((a: any) => {
            if (a.session_id) allSessionIds.add(a.session_id);
            if (a.history) {
              a.history.forEach((h: any) => {
                const sId = h.session_id || h.sessionId || h.sessionID;
                if (sId) allSessionIds.add(sId);
              });
            }
          });

          await Promise.all(Array.from(allSessionIds).map(async sId => {
            if (!this.sessionSourcesCache[sId]) {
              try {
                const res = await connectorService.getSessionSources(sId);
                if (res && res.status === 'success') {
                  this.sessionSourcesCache[sId] = res;
                }
              } catch (e) { console.warn('Failed to fetch session sources:', e); }
            }
          }));
        }

        const sessionSourcesHistories: any[] = [];
        if (includeSessionSources) {
          Object.entries(this.sessionSourcesCache).forEach(([sId, res]) => {
            const databases: string[] = [];
            const topics: string[] = [];
            const activities: string[] = [];

            if (res.external_databases && res.external_databases.databases) {
              res.external_databases.databases.forEach((db: any) => {
                databases.push(db.external_database);
                activities.push(`Synced ${db.table_count} tables from ${db.external_database}.`);
              });
            }
            if (res.web_topics && res.web_topics.topics) {
              res.web_topics.topics.forEach((topic: any) => {
                topics.push(topic.topic);
                activities.push(`Saved ${topic.result_count} results for topic: ${topic.topic}.`);
              });
            }

            if (databases.length > 0 || topics.length > 0) {
              sessionSourcesHistories.push({
                id: `ss-session-${sId}`,
                session_id: sId,
                date: new Date().toISOString(),
                action: `Session Data Imported`,
                details: `Ready to analyze ${databases.length} databases and ${topics.length} topics.`,
                connectionName: 'Multiple Sources',
                status: 'pending_input',
                activities,
                customInputType: 'session_analysis_selection',
                customInputData: {
                  topics,
                  databases
                }
              });
            }
          });
        }

        this.agents = this.agents.map(localAgent => {
          const apiAgent = apiAgents.find((a: any) => a.id === localAgent.id);
          let rawHistory: any[] = [];

          if (apiAgent && apiAgent.history) {
            rawHistory = [...apiAgent.history];
          }

          if (localAgent.id === 'ingest') {
            if (sessionSourcesHistories.length > 0) {
              const combinedHistory = [...localAgent.history, ...sessionSourcesHistories];
              // Remove duplicates by id
              const uniqueHistory = Array.from(new Map(combinedHistory.map(item => [item.id, item])).values());
              uniqueHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
              return { ...localAgent, history: uniqueHistory };
            }
            return localAgent;
          }

          if (localAgent.id === 'connect') {
            const savedResultsAgent = apiAgents.find((a: any) => a.id === 'saved_results');
            if (savedResultsAgent && savedResultsAgent.history) {
              // Group saved results by topic
              const groupedResults = new Map<string, any>();

              savedResultsAgent.history.forEach((item: any) => {
                const topicActivity = item.activities?.find((act: string) => act.startsWith('Topic: '));
                const topic = topicActivity ? topicActivity.replace('Topic: ', '').trim() : 'Unknown Topic';

                if (!groupedResults.has(topic)) {
                  groupedResults.set(topic, {
                    ...item,
                    action: `Saved Research: ${topic}`,
                    details: `Found multiple sources for "${topic}".`,
                    groupedItems: [item]
                  });
                } else {
                  const existing = groupedResults.get(topic);
                  existing.groupedItems.push(item);
                }
              });

              // Format grouped results
              const aggregatedResults = Array.from(groupedResults.values()).map(group => {
                const sourceCount = group.groupedItems.length;
                const firstFewSources = group.groupedItems.slice(0, 2).map((item: any) => {
                  const linkActivity = item.activities?.find((act: string) => act.startsWith('Link: '));
                  return linkActivity ? linkActivity.replace('Link: ', '').trim() : item.connectionName;
                });

                let detailsText = `Found ${sourceCount} sources for "${group.action.replace('Saved Research: ', '')}".`;
                if (firstFewSources.length > 0) {
                  detailsText += ` Including ${firstFewSources[0]}`;
                  if (firstFewSources.length > 1) {
                    detailsText += ` and ${firstFewSources[1]}`;
                  }
                  if (sourceCount > 2) {
                    detailsText += ` and ${sourceCount - 2} more...`;
                  }
                }

                return {
                  ...group,
                  details: detailsText,
                  activities: [
                    `Topic: ${group.action.replace('Saved Research: ', '')}`,
                    `Compiled ${sourceCount} sources`,
                    'Ready to import and process this research'
                  ],
                  connectionName: 'Web Search'
                };
              });

              rawHistory = [...rawHistory, ...aggregatedResults];
            }
          }

          if (apiAgent || (localAgent.id === 'connect' && rawHistory.length > 0)) {
            // Map the backend 'id' from the history item to our frontend 'connectorId'
            const mappedHistory = rawHistory.map((h: any) => {
              // Ensure session_id is captured, checking multiple possible backend keys just in case.
              const extractedSessionId = h.session_id || h.sessionId || h.sessionID || apiAgent?.session_id || response.session_id;

              return {
                ...h,
                session_id: extractedSessionId,
                connectorId: h.id, // The backend uses 'id' for the connection ID
                id: h.id || Math.random().toString(36).substr(2, 9) // keep original id as well for react keys
              };
            });

            // Sort by date descending
            mappedHistory.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
