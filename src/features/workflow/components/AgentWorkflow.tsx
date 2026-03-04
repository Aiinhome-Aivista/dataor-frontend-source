import { useState, useEffect } from 'react';
import { AgentData, AgentHistoryItem } from '../types';
import { Card, CardContent, CardHeader, Badge, Button } from '@/src/ui-kit';
import { motion, AnimatePresence } from 'motion/react';
import { Database, Server, BarChart3, MessageSquare, Sparkles, CheckCircle2, Loader2, Clock, Play, RotateCcw, ArrowRight } from 'lucide-react';
import { agentService } from '@/src/services/agent.service';

interface AgentWorkflowProps {
  onComplete: () => void;
  compact?: boolean;
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
            {agent.id === 'query' ? 'Open Chat' : 'Continue Flow'} <ArrowRight className="w-4 h-4 ml-2" />
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
              {agent.id === 'query' ? 'Open Chat' : 'Continue Flow'} <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const AgentWorkflow = ({ onComplete, compact = false }: AgentWorkflowProps) => {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('connect');
  const [isLoading, setIsLoading] = useState(true);

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

      if (currentAgentId === 'connect') {
        nextAction = 'Data Ingestion Required';
        nextDetails = `New schema/tables mapped from Connection Agent (${contextData}).`;
        nextPrompt = `Data is ready to be ingested. Select sync frequency:`;
        nextOptions = ['Real-time', 'Hourly', 'Daily', 'Manual'];
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
          options: nextOptions
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
      actionName = 'Ingesting Sales Analytics';
      details = 'Checking for new data...';
      prompt = 'New 2k data rows found. Do you want to replace the whole data or only get new data?';
      options = ['Replace Whole Data', 'Get New Data Only', 'Skip'];
      activities = [
        'Streaming rows...',
        'Normalizing data types...',
        'Indexing primary keys...',
        'Storing on local cache...'
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

  return (
    <div className={`${compact ? 'max-w-full flex-col' : 'max-w-6xl mx-auto flex-col md:flex-row h-full'} py-4 flex gap-6`}>
      {/* Sidebar - Agent List */}
      <div className={`flex ${compact ? 'flex-row overflow-x-auto pb-2 border-b border-[var(--border)]' : 'flex-col md:w-64'} gap-2 shrink-0`}>
        {agents.map(agent => (
          <button
            key={agent.id}
            onClick={() => setSelectedAgentId(agent.id)}
            className={`
              flex items-center gap-3 p-3 rounded-xl transition-all text-left whitespace-nowrap
              ${selectedAgentId === agent.id 
                ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'}
              ${compact ? 'flex-1 justify-center min-w-[140px]' : ''}
            `}
          >
            <div className={`
              w-8 h-8 rounded-lg flex items-center justify-center shrink-0
              ${selectedAgentId === agent.id ? 'bg-white/20' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}
            `}>
              {getIcon(agent.icon)}
            </div>
            <div className={`flex-1 min-w-0 ${compact ? 'block' : 'hidden md:block'}`}>
              <div className="font-bold text-sm truncate">{agent.name}</div>
              <div className={`text-[10px] truncate ${selectedAgentId === agent.id ? 'text-white/80' : 'text-[var(--text-secondary)]'}`}>
                {agent.history.length} activities
              </div>
            </div>
          </button>
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
                <Button onClick={handleNewAction} className="shrink-0">
                  <Play className="w-4 h-4 mr-2" />
                  New Task
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className={`flex-1 ${compact ? 'px-0 overflow-visible' : 'overflow-y-auto p-6'} space-y-6`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-4">
                Activity History
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
