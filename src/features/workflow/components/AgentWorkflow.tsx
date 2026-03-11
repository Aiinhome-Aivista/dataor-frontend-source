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

const formatInsightsText = (text: string) => {
  if (typeof text !== 'string') return JSON.stringify(text, null, 2);

  let processed = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>$1</a>'
  );

  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[var(--text-primary)]">$1</strong>');
  processed = processed.replace(/^### (.*$)/gim, '<h4 class="text-md font-bold text-[var(--text-primary)] mt-4 mb-2">$1</h4>');
  processed = processed.replace(/^## (.*$)/gim, '<h3 class="text-lg font-bold text-[var(--text-primary)] mt-5 mb-3">$1</h3>');

  let html = '';
  const lines = processed.split('\n');
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ');
    const isNumbered = /^\d+\.\s/.test(trimmed);

    if (isBullet || isNumbered) {
      if (!inList) {
        html += `<ul class="space-y-3 my-4 ml-2">`;
        inList = true;
      }

      let itemContent = trimmed;
      if (isBullet) {
        itemContent = `<div class="flex items-start gap-3"><div class="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0"></div><div class="flex-1 leading-relaxed">${trimmed.substring(2)}</div></div>`;
      } else {
        const match = trimmed.match(/^(\d+)\.\s(.*)/);
        if (match) {
          itemContent = `<div class="flex items-start gap-3"><div class="font-bold text-[var(--accent)] min-w-4 text-right pt-0.5">${match[1]}.</div><div class="flex-1 leading-relaxed">${match[2]}</div></div>`;
        }
      }
      html += `<li>${itemContent}</li>`;
    } else {
      if (inList) {
        html += `</ul>`;
        inList = false;
      }
      if (trimmed === '') {
        html += `<div class="h-2"></div>`;
      } else {
        // Only wrap in p if it's not a header we just injected
        if (trimmed.startsWith('<h')) {
          html += trimmed;
        } else {
          html += `<p class="mb-2 leading-relaxed">${trimmed}</p>`;
        }
      }
    }
  }

  if (inList) {
    html += `</ul>`;
  }

  return html;
};

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
      const data = await agentService.getAgents(userId, defaultAgentId === 'connect', selectedAgentId === 'ingest');
      setAgents(data);
      setIsLoading(false);
    };
    fetchAgents();
  }, [userId, defaultAgentId]);

  // Re-fetch session sources when switching to ingest tab
  useEffect(() => {
    if (selectedAgentId === 'ingest' && userId) {
      const fetchSessionSources = async () => {
        const data = await agentService.getAgents(userId, true, true);
        setAgents(data);
      };
      fetchSessionSources();
    }
  }, [selectedAgentId, userId]);

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

  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  // Persist latest session_id to localStorage whenever agents data updates
  useEffect(() => {
    const connectAgent = agents.find(a => a.id === 'connect');
    const latestSessionId = connectAgent?.history
      .slice()
      .reverse()
      .find(h => h.session_id)?.session_id;
    if (latestSessionId) {
      const stored = localStorage.getItem('DAgent_session_id');
      if (stored !== latestSessionId) {
        localStorage.setItem('DAgent_session_id', latestSessionId);
      }
    }
  }, [agents]);

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
        // Skip creating history item for ingest as per user request to remove history section
        setSelectedAgentId('ingest');
        const freshAgents = await agentService.getAgents(userId, false);
        setAgents(freshAgents);

        if (onChangeTab) {
          onChangeTab('collection');
        }
        return;
      } else if (currentAgentId === 'ingest') {
        nextAction = 'Process Pending';
        nextDetails = `Data successfully ingested and cached (${contextData}).`;
        nextPrompt = `What is your primary focus for analyzing this new dataset?`;
        nextOptions = ['Revenue Growth', 'User Retention', 'Anomalies', 'General Summary'];
        nextActivities = ['Loading cached data...', 'Initializing statistical models...', 'Scanning for patterns...'];
      } else if (currentAgentId === 'analyze') {
        nextAction = 'Query Engine Ready';
        nextDetails = `Analysis complete. Embeddings generated (${contextData}).`;
        nextPrompt = `DAgent is ready to answer your questions!`;
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

      const isWebSearch = activeConnector?.name === 'Web Search using LLM' || activeConnector?.name === 'Web Search';

      if (isWebSearch && userId) {
        setIsAnalyzing(true);
        // Forward to analyze tab IMMEDIATELY and wait for it to create history items
        await forwardToNextAgent(selectedAgent.id, 'Data Verified', historyItem.connectionName);

        // Run describe API
        try {
          const response = await connectorService.describeSavedContent(userId.toString());
          if (response) {
            setConnectorResults(prev => ({ ...prev, description: response.description || response }));
            // Get latest agents to find the newly created analyze history item
            const freshAgents = await agentService.getAgents(userId, false);
            const analyzeAgent = freshAgents.find(a => a.id === 'analyze');
            const processingItem = analyzeAgent?.history.find(h => h.status === 'processing');
            if (processingItem) {
              await agentService.updateHistoryItem('analyze', processingItem.id, {
                status: 'completed',
                details: 'Content analysis successfully generated.'
              });
              setAgents(await agentService.getAgents(userId, false));
            }
          }
        } catch (err) {
          console.error('Failed to describe content on continue to process:', err);
          // On failure, update history item to failed if possible
          const freshAgents = await agentService.getAgents(userId, false);
          const analyzeAgent = freshAgents.find(a => a.id === 'analyze');
          const processingItem = analyzeAgent?.history.find(h => h.status === 'processing');
          if (processingItem) {
            await agentService.updateHistoryItem('analyze', processingItem.id, {
              status: 'failed',
              details: 'Failed to generate content analysis.'
            });
            setAgents(await agentService.getAgents(userId, false));
          }
        } finally {
          setIsAnalyzing(false);
        }
      } else {
        // Forward to analyze tab normally
        await forwardToNextAgent(selectedAgent.id, 'Data Verified', historyItem.connectionName);
      }
    } catch (error) {
      console.error('Failed to continue to process:', error);
    }
  };

  const handleAction = async (historyItem: AgentHistoryItem, option?: string) => {
    if (!selectedAgent) return;

    const isWebSearch = activeConnector?.name === 'Web Search using LLM' || activeConnector?.name === 'Web Search';

    if (selectedAgentId === 'ingest' && (option === 'Continue' || !option) && isWebSearch) {
      await handleContinueToProcess();
      return;
    }

    if (selectedAgentId === 'connect' && (option === 'Continue' || !option)) {
      if (!userId || !historyItem.connectorId) {
        console.error("Missing userId or connectorId to continue import");
        return;
      }

      // 1. Reconstruct connector from history and always update selected connector
      // This ensures that switching between types (e.g. Web Search vs Database) from history works correctly.
      const isWebSearch = historyItem.connectionName === 'Web Search' || historyItem.action?.startsWith('Saved Research:');
      setSelectedConnector({
        id: historyItem.connectorId || '',
        name: isWebSearch ? 'Web Search using LLM' : (historyItem.connectionName || 'Data source'),
        description: historyItem.details || '',
        type: isWebSearch ? 'Integration' : 'Database',
        icon: isWebSearch ? 'globe' : 'database',
        status: 'connected'
      });

      // 2. Set importing state and clear any stale results
      setIsImporting(true);
      setConnectorResults(null);

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
          let response;
          if (historyItem.connectionName === 'Web Search' || historyItem.action?.startsWith('Saved Research:')) {
            const topicStr = historyItem.action?.replace('Saved Research: ', '') || '';
            // For Web Search, we want to fetch the saved results instead of trigger regular import
            response = await connectorService.getSavedResults(userId.toString(), topicStr);
          } else {
            response = await connectorService.continueToImport({
              user_id: userId.toString(),
              connection_id: historyItem.connectorId || '',
              session_id: historyItem.session_id
            });
          }

          if (response) {
            setConnectorResults(response);
          } else {
            setConnectorResults(null);
          }

          // Also update the agent history so it's reflected in the UI eventually
          await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
            status: 'completed',
            details: 'Import trigger successful.'
          });
        } catch (error) {
          console.error("Import failed:", error);
          setConnectorResults(null); // Clear previous data on failure
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


    if (option && option.startsWith('SESSION_ANALYSIS:')) {
      const payloadStr = option.replace('SESSION_ANALYSIS:', '');
      try {
        const payload = JSON.parse(payloadStr);
        if (!historyItem.session_id) {
          console.error("Missing session_id for session analysis");
          return;
        }

        setIsAnalyzing(true);
        await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
          status: 'processing',
          details: 'Initiating session analysis with selected topics and databases...',
          activities: ['Gathering selected items...', 'Sending to analysis engine...', 'Awaiting insights...']
        });
        setAgents(await agentService.getAgents(userId, false));

        await forwardToNextAgent(selectedAgent.id, 'Session Analysis Triggered', historyItem.connectionName);

        // Run API call in background
        const response = await connectorService.processSessionAnalysis({
          session_id: historyItem.session_id,
          topics: payload.topics,
          databases: payload.databases
        });

        if (response) {
          setConnectorResults(prev => ({ ...prev, description: response.report || response.description || response }));
          const freshAgents = await agentService.getAgents(userId, false);
          const analyzeAgent = freshAgents.find(a => a.id === 'analyze');
          const processingItem = analyzeAgent?.history.find(h => h.status === 'processing');
          if (processingItem) {
            await agentService.updateHistoryItem('analyze', processingItem.id, {
              status: 'completed',
              details: 'Content analysis successfully generated.'
            });
            setAgents(await agentService.getAgents(userId, false));
          }
        }

        await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
          status: 'completed',
          details: 'Session analysis started successfully.'
        });
        setAgents(await agentService.getAgents(userId, false));

      } catch (error) {
        console.error("Session analysis failed:", error);
        await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
          status: 'failed',
          details: `Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
        setAgents(await agentService.getAgents(userId, false));
      } finally {
        setIsAnalyzing(false);
      }
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
                      return (
                        <ChatWindow
                          initialMode="chat"
                          initialMessage={initialChatMessage}
                          onOpenDataSource={onChangeTab ? () => onChangeTab('connectors') : undefined}
                        />
                      );
                    })()}
                  </div>
                </div>
              ) : (
                (() => {
                  const isIngest = selectedAgent.id === 'ingest';
                  const filteredHistory = isIngest
                    ? selectedAgent.history.filter(item => item.action === 'Session Data Imported')
                    : selectedAgent.history;

                  const shouldShowHistory = !isIngest || filteredHistory.length > 0;

                  if (!shouldShowHistory) return null;

                  return (
                    <>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                        {selectedAgent.name} History
                      </h3>

                      {selectedAgent.id === 'analyze' && (isAnalyzing || selectedAgent.history.some(h => h.status === 'processing')) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-8 p-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-center shadow-sm flex flex-col items-center justify-center gap-4"
                        >
                          <Loader2 className="w-8 h-8 animate-spin text-[var(--accent)]" />
                          <div>
                            <p className="text-sm font-bold text-[var(--text-primary)]">Analyzing your data...</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">Generating insights from the web search results</p>
                          </div>
                        </motion.div>
                      )}

                      {selectedAgent.id === 'analyze' && !isAnalyzing && connectorResults?.description && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-8 p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
                        >
                          <div className="prose prose-sm max-w-none text-[var(--text-primary)] leading-relaxed prose-a:text-[var(--accent)] hover:prose-a:underline">
                            {typeof connectorResults.description === 'string'
                              ? <div dangerouslySetInnerHTML={{ __html: formatInsightsText(connectorResults.description) }} />
                              : JSON.stringify(connectorResults.description, null, 2)}
                          </div>
                        </motion.div>
                      )}

                      <AnimatePresence mode="popLayout">
                        {filteredHistory.length === 0 ? (
                          <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center py-12 border-2 border-dashed border-[var(--border)] rounded-2xl"
                          >
                            <Clock className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-3 opacity-50" />
                            <p className="text-[var(--text-secondary)]">No history found for this agent.</p>
                          </motion.div>
                        ) : (
                          filteredHistory.map((item) => (
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
                  );
                })()
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div >
  );
};
