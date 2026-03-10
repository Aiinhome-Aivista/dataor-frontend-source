import { useState, useEffect, useRef } from 'react';
import { AgentData, AgentHistoryItem } from '../types';
import { Card, CardContent, CardHeader, Badge, Button } from '@/src/ui-kit';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Server, BarChart3, MessageSquare, Sparkles, CheckCircle2, Loader2, Clock, Play, RotateCcw, ArrowRight, ChevronRight, Globe, Search } from 'lucide-react';
import { agentService } from '@/src/services/agent.service';

import { ConnectorList } from '../../connectors/components/ConnectorList';
import { Connector } from '../../connectors/types';
import { ChatWindow } from '../../chat/components/ChatWindow';
import { useConnectorContext } from '../../../context/ConnectorContext';
import { useAuthContext } from '../../../context/AuthContext';
import { connectorService } from '@/src/services/connector.service';

interface AgentWorkflowProps {
  onComplete: () => void;
  compact?: boolean;
  defaultAgentId?: string;
  onChangeTab?: (tabId: string) => void;
  onNewConnector?: () => void;
  onForwardWithContext?: (agentId: string, context: string) => void;
  initialChatMessage?: string;
}

import { HistoryItemCard } from './HistoryItemCard';
import { AgentStepper, getAgentIcon } from './AgentStepper';
import { IngestDataView } from './IngestDataView';

export const AgentWorkflow = ({
  onComplete,
  compact = false,
  defaultAgentId = 'connect',
  onChangeTab,
  onNewConnector,
  onForwardWithContext,
  initialChatMessage
}: AgentWorkflowProps) => {
  const {
    selectedConnector: activeConnector,
    setSelectedConnector,
    connectorResults,
    setConnectorResults,
    isImporting,
    setIsImporting,
    searchTopic
  } = useConnectorContext();
  const { userId } = useAuthContext();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(defaultAgentId);
  const [isLoading, setIsLoading] = useState(true);
  const isDescribingRef = useRef(false);

  useEffect(() => {
    setSelectedAgentId(defaultAgentId);
  }, [defaultAgentId]);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      const data = await agentService.getAgents(userId, defaultAgentId === 'connect');
      setAgents(data);
      setIsLoading(false);
    };
    fetchAgents();
  }, [userId, defaultAgentId]);

  // Handle specialized saved results fetch for Web Search in Ingest (Import) tab
  useEffect(() => {
    const activeUserId = userId?.toString() || '1';
    if (selectedAgentId === 'ingest' && activeConnector?.name === 'Web Search using LLM' && activeUserId && !connectorResults?.results) {
      const getResults = async () => {
        try {
          const savedResults = await connectorService.getSavedResults(activeUserId, searchTopic);
          if (savedResults) {
            setConnectorResults(savedResults);
          }
        } catch (err) {
          console.error('Failed to fetch saved results:', err);
        }
      };
      getResults();
    }
  }, [selectedAgentId, activeConnector, userId, setConnectorResults, connectorResults?.results]);

  // Handle specialized 'Describe' for Web Search in Analyze tab
  useEffect(() => {
    const activeUserId = userId?.toString() || '1';
    const analyzeAgent = agents.find(a => a.id === 'analyze');
    const processingItem = analyzeAgent?.history.find(h => h.status === 'processing');
    const isAnalyzeProcessing = selectedAgentId === 'analyze' &&
      activeConnector?.name === 'Web Search using LLM' &&
      !!processingItem;

    if (isAnalyzeProcessing && !connectorResults?.description) {
      if (isDescribingRef.current) return;
      isDescribingRef.current = true;

      const describeContent = async () => {
        try {
          const response = await connectorService.describeSavedContent(activeUserId);
          if (response) {
            setConnectorResults(prev => ({ ...prev, description: response.description || response }));

            // Sync history item status to completed
            if (processingItem) {
              await agentService.updateHistoryItem('analyze', processingItem.id, {
                status: 'completed',
                details: 'Content analysis successfully generated.'
              });
              setAgents(await agentService.getAgents(userId, false));
            }
          }
        } catch (err) {
          console.error('Failed to describe content:', err);
          if (processingItem) {
            await agentService.updateHistoryItem('analyze', processingItem.id, {
              status: 'failed',
              details: 'Failed to generate content analysis.'
            });
            setAgents(await agentService.getAgents(userId, false));
          }
        } finally {
          isDescribingRef.current = false;
        }
      };
      describeContent();
    }
  }, [selectedAgentId, activeConnector, userId, setConnectorResults, connectorResults?.description, agents]);

  // Poll for updates if there are any processing items to handle tab-switching state sync
  useEffect(() => {
    const hasProcessing = agents.some(a => a.history.some(h => h.status === 'processing'));

    if (hasProcessing) {
      const interval = setInterval(async () => {
        // We set fetchFromApi to false here so that we don't spam the connection_history
        // API every 1 second while waiting for simulated local processing to finish.
        const updatedAgents = await agentService.getAgents(userId, false);
        setAgents(updatedAgents);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [agents, selectedAgentId, userId]);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const AGENT_SEQUENCE = ['connect', 'ingest', 'analyze', 'query'];

  const forwardToNextAgent = async (currentAgentId: string, contextData: string, connectionName?: string) => {
    const currentIndex = AGENT_SEQUENCE.indexOf(currentAgentId);

    if (currentIndex !== -1 && currentIndex < AGENT_SEQUENCE.length - 1) {
      const nextAgentId = AGENT_SEQUENCE[currentIndex + 1];

      let nextAction = 'Incoming Task';
      let nextDetails = `Received updated data from ${agents.find(a => a.id === currentAgentId)?.name || 'previous agent'}.`;
      let nextPrompt = 'How would you like to proceed?';
      let nextOptions = ['Continue', 'Skip'];
      let nextActivities = ['Analyzing incoming payload...', 'Preparing environment...'];
      let nextCustomInputType: 'table_selection' | undefined = undefined;
      let nextCustomInputData: any = undefined;

      if (currentAgentId === 'connect') {
        nextAction = 'Data Ingestion Required';
        nextDetails = `New schema/tables mapped from Connection (${contextData}).`;
        nextPrompt = `Data is ready to be ingested. 2 new tables found. Please configure how to handle the tables.`;
        nextOptions = [];
        nextCustomInputType = 'table_selection';
        nextCustomInputData = { newTables: ['user_activity_logs', 'payment_transactions'] };
        nextActivities = ['Receiving schema definition...', 'Allocating storage...', 'Preparing ingestion pipeline...'];
      } else if (currentAgentId === 'ingest') {
        nextAction = 'Process Pending';
        nextDetails = `Data successfully ingested and cached (${contextData}).`;
        nextPrompt = `What is your primary focus for analyzing this new dataset?`;
        nextOptions = ['Revenue Growth', 'User Retention', 'Anomalies', 'General Summary'];
        nextActivities = ['Loading cached data...', 'Initializing statistical models...', 'Scanning for patterns...'];
      } else if (currentAgentId === 'analyze') {
        nextAction = 'Query Engine Ready';
        nextDetails = `Analysis complete. Embeddings generated (${contextData}).`;
        nextPrompt = `Dataor is ready to answer your questions!`;
        nextOptions = ["Yes, let's go!"];
        nextActivities = ['Loading embeddings into memory...', 'Warming up query engine...', 'Ready for chat.'];
      }

      const newItem = await agentService.addHistoryItem(nextAgentId, {
        action: nextAction,
        details: nextDetails,
        status: 'processing',
        activities: nextActivities,
        connectionName: connectionName
      });

      setSelectedAgentId(nextAgentId);
      setAgents(await agentService.getAgents(userId, nextAgentId === 'connect'));

      // Sync sidebar with stepper
      if (onChangeTab) {
        const tabMap: Record<string, string> = {
          connect: 'connectors',
          ingest: 'collection',
          analyze: 'analysis',
          query: 'chat'
        };
        if (tabMap[nextAgentId]) {
          onChangeTab(tabMap[nextAgentId] as any);
        }
      }

      const processingTime = (nextActivities?.length || 2) * 1000 + 500;
      setTimeout(async () => {
        await agentService.updateHistoryItem(nextAgentId, newItem.id, {
          status: 'pending_input',
          prompt: nextPrompt,
          options: nextOptions,
          customInputType: nextCustomInputType,
          customInputData: nextCustomInputData
        });
        setAgents(await agentService.getAgents(userId, nextAgentId === 'connect'));
      }, processingTime);
    } else if (currentAgentId === 'query') {
      onComplete();
    }
  };

  const handleContinueToProcess = async () => {
    const historyItem = selectedAgent?.history[selectedAgent.history.length - 1];
    if (!selectedAgent || !historyItem) return;

    try {
      await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
        status: 'completed',
        details: 'Data details verified. Moving to process phase.'
      });
      setAgents(await agentService.getAgents(userId, false));

      // Forward to analyze tab
      await forwardToNextAgent(selectedAgent.id, 'Data Verified', historyItem.connectionName);
    } catch (error) {
      console.error('Failed to continue to process:', error);
    }
  };

  const handleAction = async (historyItem: AgentHistoryItem, option?: string) => {
    if (!selectedAgent) return;

    if (selectedAgentId === 'ingest' && (option === 'Continue' || !option) && activeConnector?.name === 'Web Search using LLM') {
      await handleContinueToProcess();
      return;
    }

    if (selectedAgentId === 'connect' && (option === 'Continue' || !option)) {
      if (!userId || !historyItem.connectorId) {
        console.error("Missing userId or connectorId to continue import");
        return;
      }

      // 1. Set active connector if not already set (reconstruct from history)
      if (!activeConnector) {
        setSelectedConnector({
          id: historyItem.connectorId,
          name: historyItem.connectionName || 'Data source',
          description: historyItem.details || '',
          type: 'Database',
          icon: 'database',
          status: 'connected'
        });
      }

      // 2. Set importing state
      setIsImporting(true);

      // 3. Update history to show processing
      const newActivities = historyItem.activities
        ? [...historyItem.activities, 'Initiating import process...']
        : ['Initiating import process...'];

      await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
        status: 'processing',
        details: 'Triggering data import from data source...',
        activities: newActivities
      });
      setAgents(await agentService.getAgents(userId, false));

      // 4. Forward IMMEDIATELY to switch tabs
      await forwardToNextAgent(selectedAgent.id, 'Import Triggered', historyItem.connectionName);

      // 5. Run API call in background
      (async () => {
        try {
          const response = await connectorService.continueToImport({
            user_id: userId.toString(),
            connection_id: historyItem.connectorId || '',
            session_id: historyItem.session_id
          });

          if (response) {
            setConnectorResults(response);
          }

          // Also update the agent history so it's reflected in the UI eventually
          await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
            status: 'completed',
            details: 'Import trigger successful.'
          });
        } catch (error) {
          console.error("Import failed:", error);
          await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
            status: 'failed',
            details: `Failed to start import: ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        } finally {
          setIsImporting(false);
          // We don't necessarily need to reload agents here as they'll be reloaded on tab entry,
          // but for safety in case we're still on the same tab:
          const freshAgents = await agentService.getAgents(userId, false);
          setAgents(freshAgents);
        }
      })();

      return;
    }


    const newActivities = historyItem.activities
      ? [...historyItem.activities, `Executing: ${option || 'Continue'}`]
      : [`Executing: ${option || 'Continue'}`];

    // Simulate processing an action
    await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
      status: 'processing',
      details: option ? `Processing option: ${option}...` : 'Processing...',
      activities: newActivities
    });

    // Refresh data
    setAgents(await agentService.getAgents(userId, selectedAgent.id === 'connect'));

    // Simulate completion
    setTimeout(async () => {
      // If continuing from Ingest for Web Search, trigger the describe API
      if (selectedAgent.id === 'ingest' && activeConnector?.name === 'Web Search using LLM') {
        try {
          const activeUserId = userId?.toString() || '1';
          const response = await connectorService.describeSavedContent(activeUserId);
          if (response) {
            setConnectorResults(prev => ({ ...prev, description: response.description || response }));
          }
        } catch (err) {
          console.error('Failed to describe content on continue:', err);
        }
      }

      await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
        status: 'completed',
        details: option ? `Completed action: ${option}` : 'Action completed successfully.'
      });
      setAgents(await agentService.getAgents(userId, selectedAgent.id === 'connect'));

      // Automatically forward to next agent
      await forwardToNextAgent(selectedAgent.id, option || historyItem.action, historyItem.connectionName);
    }, 2000);
  };

  const handleScenarioConfirm = async (scenario: string) => {
    if (!selectedAgent) return;

    // Add a history item for the scenario selection
    await agentService.addHistoryItem('ingest', {
      action: 'Situation Identified',
      details: scenario,
      status: 'completed',
      connectionName: activeConnector?.name
    });

    setAgents(await agentService.getAgents(userId, selectedAgent.id === 'connect'));

    // Forward to next agent
    await forwardToNextAgent('ingest', scenario, activeConnector?.name);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  const handleStepperClick = (agentId: string) => {
    setSelectedAgentId(agentId);
    if (onChangeTab) {
      const tabMap: Record<string, string> = {
        connect: 'connectors',
        ingest: 'collection',
        analyze: 'analysis',
        query: 'chat'
      };
      if (tabMap[agentId]) {
        onChangeTab(tabMap[agentId] as any);
      }
    }
  };

  return (
    <div className="w-full flex-col h-full py-1 flex gap-4">
      {/* Stepper - Agent List (hidden on Query tab) */}
      {selectedAgentId !== 'query' && (
        <AgentStepper
          agents={agents}
          selectedAgentId={selectedAgentId}
          onSelectAgent={handleStepperClick}
        />
      )}

      {/* Main Content - Agent History & Actions */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedAgent && (
          <Card className={`flex-1 flex flex-col border-[var(--border)] shadow-xl overflow-hidden bg-[var(--surface)]/50 ${compact ? 'border-none shadow-none bg-transparent' : ''}`}>
            {selectedAgent.id !== 'query' && (
              <CardHeader className={`${compact ? 'px-0 pt-1 pb-3' : 'bg-[var(--surface)] p-4 border-b border-[var(--border)]'} shrink-0`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20 relative">
                      {selectedAgent.id === 'ingest' && activeConnector?.name === 'Web Search using LLM' ? (
                        <div className="relative">
                          <Globe className="w-5 h-5" />
                          <Search className="w-3 h-3 absolute -bottom-1 -right-1" />
                        </div>
                      ) : (
                        getAgentIcon(selectedAgent.icon)
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">{selectedAgent.name}</h2>
                      <p className="text-xs text-[var(--text-secondary)]">{selectedAgent.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
            )}

            <CardContent className={`flex-1 ${selectedAgent.id === 'query' ? 'flex flex-col p-0 overflow-hidden' : compact ? 'px-0 overflow-visible space-y-4' : 'overflow-y-auto p-4 space-y-4'}`}>
              {selectedAgent.id === 'ingest' && (
                <IngestDataView
                  activeConnector={activeConnector}
                  connectorResults={connectorResults}
                  isImporting={isImporting}
                  onGoToDataSource={() => handleStepperClick('connect')}
                  onContinue={handleContinueToProcess}
                />
              )}

              {selectedAgent.id === 'connect' && (
                <div className="mb-12">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Available Connectors</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Choose from our list of supported data sources</p>
                    </div>
                    {onNewConnector && (
                      <Button variant="outline" size="sm" onClick={onNewConnector}>
                        <Play className="w-4 h-4 mr-2" />
                        Custom Data source
                      </Button>
                    )}
                  </div>
                  <ConnectorList onSelect={() => onChangeTab?.('new-connector')} />
                </div>
              )}

              {selectedAgent.id === 'query' ? (
                <div className="flex-1 h-full flex flex-col">
                  <div className="h-full overflow-hidden">
                    {(() => {
                      const getSuggestedQuestions = () => {
                        if (!activeConnector) return [
                          "How can I help you with your data today?",
                          "What insights are you looking for?",
                          "Can you summarize my recent activities?"
                        ];

                        const name = activeConnector.name;
                        const nameLower = name.toLowerCase();
                        const type = activeConnector.type;

                        if (type === 'Database' || type === 'Data Warehouse') {
                          return [
                            `Show me a summary of the tables in ${name}`,
                            `What are the most active users in ${name}?`,
                            `Find any anomalies in the last 24 hours of ${name}`
                          ];
                        }

                        if (nameLower.includes('stripe')) {
                          return [
                            "What is my total revenue this month?",
                            "Show me the churn rate for the last 30 days",
                            "List the top 5 customers by lifetime value"
                          ];
                        }

                        if (nameLower.includes('analytics') || nameLower.includes('ga4')) {
                          return [
                            "What are my top performing pages?",
                            "Show me the user acquisition breakdown",
                            "How has my bounce rate changed this week?"
                          ];
                        }

                        return [
                          `Analyze the data from ${name}`,
                          `What are the key trends in ${name}?`,
                          `Summarize the ${type} connection status`
                        ];
                      };

                      return (
                        <ChatWindow
                          initialMode="chat"
                          initialMessage={initialChatMessage}
                          suggestedQuestions={getSuggestedQuestions()}
                          onOpenDataSource={onChangeTab ? () => onChangeTab('connectors') : undefined}
                        />
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                    {selectedAgent.name} History
                  </h3>

                  {selectedAgent.id === 'analyze' && connectorResults?.description && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-8 p-6 rounded-2xl border border-[var(--border)] bg-[var(--accent)]/5"
                    >
                      {/* <div className="flex items-center gap-2 text-[var(--accent)] text-xs font-bold mb-4">
                        <Sparkles className="w-4 h-4" />
                        AI CONTENT ANALYSIS
                      </div> */}
                      <div className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed">
                        {typeof connectorResults.description === 'string'
                          ? connectorResults.description
                          : JSON.stringify(connectorResults.description, null, 2)}
                      </div>
                    </motion.div>
                  )}

                  <AnimatePresence mode="popLayout">
                    {selectedAgent.history.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl"
                      >
                        <Clock className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
                        <p className="text-[var(--text-secondary)]">No history found for this agent.</p>
                      </motion.div>
                    ) : (
                      selectedAgent.history.map((item) => (
                        <HistoryItemCard
                          key={item.id}
                          item={item}
                          agent={selectedAgent}
                          onAction={handleAction}
                          onForward={forwardToNextAgent}
                          onScenarioConfirm={handleScenarioConfirm}
                        />
                      ))
                    )}
                  </AnimatePresence>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div >
  );
};
