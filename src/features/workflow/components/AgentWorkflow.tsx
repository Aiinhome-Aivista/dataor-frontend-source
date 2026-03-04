import { useState, useEffect } from 'react';
import { AgentData, AgentHistoryItem } from '../types';
import { Card, CardContent, CardHeader, Badge, Button } from '@/src/ui-kit';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Server, BarChart3, MessageSquare, Sparkles, CheckCircle2, Loader2, Clock, Play, RotateCcw, ArrowRight } from 'lucide-react';
import { agentService } from '@/src/services/agent.service';

import { ConnectorList } from '../../connectors/components/ConnectorList';
import { Connector } from '../../connectors/types';

interface AgentWorkflowProps {
  onComplete: () => void;
  compact?: boolean;
  defaultAgentId?: string;
  onChangeTab?: (tabId: string) => void;
  onNewConnector?: () => void;
  onSelectConnector?: (connector: Connector) => void;
}

const HistoryItemCard = ({ 
  item, 
  agent, 
  onAction, 
  onForward 
}: { 
  item: AgentHistoryItem, 
  agent: AgentData, 
  onAction: (item: AgentHistoryItem, option?: string) => void, 
  onForward: (agentId: string, context: string) => void 
}) => {
  const [activityIndex, setActivityIndex] = useState(() => {
    return (item.status === 'pending_input' || item.status === 'completed') 
      ? (item.activities?.length || 1) - 1 
      : 0;
  });

  useEffect(() => {
    if (item.status === 'processing' && item.activities && activityIndex < item.activities.length - 1) {
      const timer = setInterval(() => {
        setActivityIndex(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [item.status, item.activities, activityIndex]);

  // Ensure activityIndex catches up if it was pending_input
  useEffect(() => {
    if (item.status === 'pending_input' || item.status === 'completed') {
      setActivityIndex((item.activities?.length || 1) - 1);
    }
  }, [item.status, item.activities]);

  const displayIndex = (item.status === 'pending_input' || item.status === 'completed') 
    ? (item.activities?.length || 1) - 1 
    : activityIndex;

  const [tableAction, setTableAction] = useState('update');
  const [selectedNewTables, setSelectedNewTables] = useState<string[]>([]);

  useEffect(() => {
    if (item.customInputType === 'table_selection' && item.customInputData?.newTables) {
      setSelectedNewTables(item.customInputData.newTables);
    }
  }, [item]);

  const handleTableSelectionSubmit = () => {
    const actionText = `Existing: ${tableAction === 'update' ? 'Update' : 'Replace'}, New: ${selectedNewTables.length > 0 ? selectedNewTables.join(', ') : 'None'}`;
    onAction(item, actionText);
  };

  const getContinueText = (currentId: string) => {
    if (currentId === 'connect') return 'Continue to Collection Agent';
    if (currentId === 'ingest') return 'Continue to Analysis Agent';
    if (currentId === 'analyze') return 'Continue to Chat Agent';
    return 'Open Chat';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        p-5 rounded-2xl border transition-all
        ${item.status === 'processing' ? 'border-[var(--accent)] bg-[var(--accent)]/5 shadow-lg shadow-[var(--accent)]/10' : 
          item.status === 'pending_input' ? 'border-amber-500/50 bg-amber-500/5' : 
          'border-[var(--border)] bg-[var(--bg)]/50'}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {item.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
            {item.status === 'processing' && <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />}
            {item.status === 'pending_input' && <RotateCcw className="w-4 h-4 text-amber-500" />}
            <h4 className="font-bold text-[var(--text-primary)]">{item.action}</h4>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">{item.details}</p>
        </div>
        <span className="text-[10px] font-mono text-[var(--text-secondary)] bg-[var(--surface)] px-2 py-1 rounded-md border border-[var(--border)] h-fit">
          {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
        </span>
      </div>

      {item.activities && item.activities.length > 0 && (item.status === 'processing' || item.status === 'pending_input') && (
        <div className="mt-4 mb-4 space-y-3 font-mono text-sm bg-[var(--bg)]/50 p-6 rounded-2xl border border-[var(--border)]">
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
            {agent.name} Activity
          </h4>
          {item.activities.slice(0, displayIndex + 1).map((activity, i) => (
            <motion.div
              key={activity}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {i === displayIndex && item.status === 'processing' ? (
                <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              )}
              <span className={i === displayIndex && item.status === 'processing' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>
                {activity}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {item.status === 'completed' && (
        <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-end">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onForward(agent.id, item.action)}
            className="hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {getContinueText(agent.id)} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}

      {item.status === 'pending_input' && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          {item.prompt && (
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
              {item.prompt}
            </p>
          )}
          
          {item.customInputType === 'table_selection' ? (
            <div className="space-y-6 mb-6 bg-white p-4 rounded-xl border border-[var(--border)]">
              <div>
                <h5 className="text-sm font-semibold mb-3">Existing Tables Action</h5>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name={`tableAction-${item.id}`} 
                      value="update" 
                      checked={tableAction === 'update'} 
                      onChange={(e) => setTableAction(e.target.value)}
                      className="text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    Update Existing
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input 
                      type="radio" 
                      name={`tableAction-${item.id}`} 
                      value="replace" 
                      checked={tableAction === 'replace'} 
                      onChange={(e) => setTableAction(e.target.value)}
                      className="text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    Replace All
                  </label>
                </div>
              </div>
              
              {item.customInputData?.newTables && item.customInputData.newTables.length > 0 && (
                <div>
                  <h5 className="text-sm font-semibold mb-3">New Tables Detected</h5>
                  <div className="space-y-2">
                    {item.customInputData.newTables.map((table: string) => (
                      <label key={table} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selectedNewTables.includes(table)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedNewTables([...selectedNewTables, table]);
                            } else {
                              setSelectedNewTables(selectedNewTables.filter(t => t !== table));
                            }
                          }}
                          className="rounded text-[var(--accent)] focus:ring-[var(--accent)]"
                        />
                        {table}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={handleTableSelectionSubmit}
                >
                  Confirm & Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {item.options && (
                <div className="flex flex-wrap gap-2">
                  {item.options.map(opt => (
                    <Button 
                      key={opt} 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAction(item, opt)}
                      className="hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}
              <Button 
                variant="default" 
                size="sm"
                onClick={() => onAction(item, 'Continue')}
                className="ml-auto"
              >
                {getContinueText(agent.id)} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export const AgentWorkflow = ({ onComplete, compact = false, defaultAgentId = 'connect', onChangeTab, onNewConnector, onSelectConnector }: AgentWorkflowProps) => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(defaultAgentId);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSelectedAgentId(defaultAgentId);
  }, [defaultAgentId]);

  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      const data = await agentService.getAgents();
      setAgents(data);
      setIsLoading(false);
    };
    fetchAgents();
  }, []);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'database': return <Database className="w-5 h-5" />;
      case 'server': return <Server className="w-5 h-5" />;
      case 'bar-chart': return <BarChart3 className="w-5 h-5" />;
      case 'message-square': return <MessageSquare className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const AGENT_SEQUENCE = ['connect', 'ingest', 'analyze', 'query'];

  const forwardToNextAgent = async (currentAgentId: string, contextData: string) => {
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
        nextDetails = `New schema/tables mapped from Connection Agent (${contextData}).`;
        nextPrompt = `Data is ready to be ingested. 2 new tables found. Please configure how to handle the tables.`;
        nextOptions = [];
        nextCustomInputType = 'table_selection';
        nextCustomInputData = { newTables: ['user_activity_logs', 'payment_transactions'] };
        nextActivities = ['Receiving schema definition...', 'Allocating storage...', 'Preparing ingestion pipeline...'];
      } else if (currentAgentId === 'ingest') {
        nextAction = 'Analysis Pending';
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
        activities: nextActivities
      });

      setSelectedAgentId(nextAgentId);
      setAgents(await agentService.getAgents());

      const processingTime = (nextActivities?.length || 2) * 1000 + 500;
      setTimeout(async () => {
        await agentService.updateHistoryItem(nextAgentId, newItem.id, {
          status: 'pending_input',
          prompt: nextPrompt,
          options: nextOptions,
          customInputType: nextCustomInputType,
          customInputData: nextCustomInputData
        });
        setAgents(await agentService.getAgents());
      }, processingTime);
    } else if (currentAgentId === 'query') {
      onComplete();
    }
  };

  const handleAction = async (historyItem: AgentHistoryItem, option?: string) => {
    if (!selectedAgent) return;
    
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
    setAgents(await agentService.getAgents());

    // Simulate completion
    setTimeout(async () => {
      await agentService.updateHistoryItem(selectedAgent.id, historyItem.id, {
        status: 'completed',
        details: option ? `Completed action: ${option}` : 'Action completed successfully.'
      });
      setAgents(await agentService.getAgents());
      
      // Automatically forward to next agent
      await forwardToNextAgent(selectedAgent.id, option || historyItem.action);
    }, 2000);
  };

  const handleNewAction = async () => {
    if (!selectedAgent) return;
    
    let actionName = 'New Task';
    let details = 'Starting new task...';
    let prompt: string | undefined = undefined;
    let options: string[] | undefined = undefined;
    let activities: string[] | undefined = undefined;

    if (selectedAgent.id === 'connect') {
      actionName = 'Reconnecting to Sales Analytics';
      details = 'Establishing secure link...';
      prompt = 'New table "user_activity_logs" found on the database. Do you want to fetch the new table?';
      options = ['Fetch New Table', 'Ignore', 'Select Specific Tables'];
      activities = [
        'Verifying credentials...',
        'Establishing SSL tunnel...',
        'Handshaking with MySQL...',
        'Mapping schema structures...'
      ];
    } else if (selectedAgent.id === 'ingest') {
      actionName = 'Refetching Data';
      details = 'Previous fetch: 50,000 rows. Checking for updates...';
      prompt = 'Found 2,000 new rows. Do you want to replace the whole data or add the new rows?';
      options = ['Replace Whole Data', 'Add New Rows', 'Cancel'];
      activities = [
        'Connecting to source...',
        'Comparing row hashes...',
        'Streaming new rows...',
        'Updating local cache...'
      ];
    } else if (selectedAgent.id === 'analyze') {
      actionName = 'Analyzing Dataset';
      details = 'Running statistical models...';
      prompt = 'Analysis complete. Do you want to generate a summary report?';
      options = ['Generate Report', 'Skip'];
      activities = [
        'Loading data into memory...',
        'Running anomaly detection...',
        'Calculating key metrics...',
        'Generating embeddings...'
      ];
    } else if (selectedAgent.id === 'query') {
      actionName = 'Preparing Query Engine';
      details = 'Warming up models...';
      prompt = 'Query engine is ready. What would you like to know?';
      options = ['Show me revenue trends', 'Any anomalies?', 'Summarize data'];
      activities = [
        'Loading embeddings...',
        'Initializing LLM context...',
        'Ready for queries.'
      ];
    }

    const newItem = await agentService.addHistoryItem(selectedAgent.id, {
      action: actionName,
      details,
      status: 'processing',
      activities
    });
    
    setAgents(await agentService.getAgents());

    // Simulate processing time before asking for input
    const processingTime = (activities?.length || 2) * 1000 + 500;
    setTimeout(async () => {
      await agentService.updateHistoryItem(selectedAgent.id, newItem.id, {
        status: 'pending_input',
        prompt,
        options
      });
      setAgents(await agentService.getAgents());
    }, processingTime);
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
        onChangeTab(tabMap[agentId]);
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex-col h-full py-4 flex gap-6">
      {/* Stepper - Agent List */}
      <div className="flex flex-row overflow-x-auto pb-2 border-b border-[var(--border)] gap-2 shrink-0">
        {agents.map((agent, index) => (
          <div key={agent.id} className="flex items-center">
            <button
              onClick={() => handleStepperClick(agent.id)}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all text-left whitespace-nowrap min-w-[160px]
                ${selectedAgentId === agent.id 
                  ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'}
              `}
            >
              <div className={`
                w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                ${selectedAgentId === agent.id ? 'bg-white/20' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}
              `}>
                {getIcon(agent.icon)}
              </div>
              <div className="flex-1 min-w-0 block">
                <div className="font-bold text-sm truncate">{agent.name}</div>
                <div className={`text-[10px] truncate ${selectedAgentId === agent.id ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                  {agent.history.length} activities
                </div>
              </div>
            </button>
            {index < agents.length - 1 && (
              <div className="w-8 h-[2px] bg-[var(--border)] mx-2 shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Main Content - Agent History & Actions */}
      <div className="flex-1 flex flex-col min-h-0">
        {selectedAgent && (
          <Card className={`flex-1 flex flex-col border-[var(--border)] shadow-xl overflow-hidden bg-[var(--surface)]/50 ${compact ? 'border-none shadow-none bg-transparent' : ''}`}>
            <CardHeader className={`${compact ? 'px-0 pt-2 pb-4' : 'bg-[var(--surface)] p-6 border-b border-[var(--border)]'} shrink-0`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] border border-[var(--accent)]/20">
                    {getIcon(selectedAgent.icon)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedAgent.name}</h2>
                    <p className="text-sm text-[var(--text-secondary)]">{selectedAgent.description}</p>
                  </div>
                </div>
                {/* <Button onClick={handleNewAction} className="shrink-0">
                  <Play className="w-4 h-4 mr-2" />
                  New Task
                </Button> */}
              </div>
            </CardHeader>
            
            <CardContent className={`flex-1 ${compact ? 'px-0 overflow-visible' : 'overflow-y-auto p-6'} space-y-6`}>
              {selectedAgent.id === 'ingest' && (
                <div className="mb-8 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)]/50">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                    Database Details
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Total Rows</div>
                      <div className="text-2xl font-bold font-mono">50,000</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Total Columns</div>
                      <div className="text-2xl font-bold font-mono">24</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Data Size</div>
                      <div className="text-2xl font-bold font-mono">12.4 MB</div>
                    </div>
                    <div className="p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                      <div className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] mb-1">Last Sync</div>
                      <div className="text-sm font-bold mt-2">Just now</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Tables</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                        <span className="font-mono text-sm">public.users</span>
                        <span className="text-xs text-[var(--text-secondary)]">50,000 rows • 12 cols</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                        <span className="font-mono text-sm">public.transactions</span>
                        <span className="text-xs text-[var(--text-secondary)]">124,500 rows • 8 cols</span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                        <span className="font-mono text-sm">public.products</span>
                        <span className="text-xs text-[var(--text-secondary)]">1,200 rows • 4 cols</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

        

              {selectedAgent.id === 'connect' && (
                <div className="pt-0 ">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold">Available Connectors</h3>
                      <p className="text-sm text-[var(--text-secondary)]">Choose from our list of supported data sources</p>
                    </div>
                    {onNewConnector && (
                      <Button variant="outline" size="sm" onClick={onNewConnector}>
                        <Play className="w-4 h-4 mr-2" />
                        Custom Connection
                      </Button>
                    )}
                  </div>
                  <ConnectorList onSelect={onSelectConnector} />
                </div>
              )}

                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                {selectedAgent.historyName} History
              </h3>
              
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
                    />
                  ))
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
