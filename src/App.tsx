import { ThemeProvider, useTheme, Button } from './ui-kit';
import { ConnectorList, ConnectorForm, Connector } from './features/connectors';
import { ChatWindow } from './features/chat';
import { AgentWorkflow } from './features/workflow';
import { LandingPage } from './features/marketing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { Moon, Sun, Layout, Settings, LogOut, Menu, MessageSquare, Database, Plus, Sparkles, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { agentService } from './services/agent.service';

type Tab = 'connectors' | 'chat' | 'new-connector' | 'collection' | 'analysis';
type ViewMode = 'landing' | 'login' | 'app';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('app');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('connectors');
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [justFinishedWorkflow, setJustFinishedWorkflow] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0);

  const handleLogin = () => setViewMode('login');
  const handleGetStarted = () => setViewMode('login');
  const handleLoginSuccess = () => setViewMode('app');
  const handleBackToLanding = () => setViewMode('landing');
  const handleLogout = () => setViewMode('landing');

  const handleNewConnector = () => {
    setSelectedConnector(null);
    changeTab('new-connector');
  };

  const handleSelectConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    changeTab('new-connector');
  };

  const handleBackToConnectors = () => {
    setSelectedConnector(null);
    changeTab('connectors');
  };

  const handleStartWorkflow = async (connectionName?: string) => {
    const name = connectionName || 'New Connection';
    
    // Set as active connector for the session
    setSelectedConnector({
      id: 'temp-' + Date.now(),
      name: name,
      description: `Connected to ${name}`,
      type: 'Database',
      icon: 'database',
      status: 'connected'
    });

    // Add the new connection to the agent history
    await agentService.addHistoryItem('connect', {
      action: `Connected to ${name}`,
      details: 'Connection established successfully.',
      connectionName: name,
      status: 'completed',
      activities: [
        'Verifying credentials...',
        'Establishing SSL tunnel...',
        'Handshaking with database...',
        'Mapping schema structures...'
      ]
    });
    
    // Stay on connectors tab to show the success message and "Continue" button
    changeTab('connectors');
  };

  const handleWorkflowComplete = () => {
    // Wait a bit then switch to chat
    setTimeout(() => {
      setJustFinishedWorkflow(true);
      setActiveTab('chat');
    }, 1500);
  };

  const changeTab = (tab: Tab) => {
    if (tab !== 'chat') {
      setJustFinishedWorkflow(false);
      setInitialChatMessage(undefined);
    }
    setActiveTab(tab);
  };

  const handleForwardWithContext = (agentId: string, context: string) => {
    if (agentId === 'query') {
      setInitialChatMessage(context);
      setChatKey(prev => prev + 1); // Force re-render of chat agent workflow to pick up new context
    }
  };

  if (viewMode === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} onLogin={handleLogin} />;
  }

  if (viewMode === 'login') {
    return <LoginPage onBack={handleBackToLanding} onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex text-[var(--text-primary)] transition-colors duration-300">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="fixed left-0 top-0 h-full bg-[var(--surface)] border-r border-[var(--border)] z-50 flex flex-col"
      >
        <div className="p-4 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 font-bold text-lg"
            >
              <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white text-sm">
                D
              </div>
              <span>Dataor</span>
            </motion.div>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1 mt-2">
          {[
            { icon: Database, label: 'Connection', id: 'connectors' as Tab },
            { icon: Sparkles, label: 'Collection', id: 'collection' as Tab },
            { icon: BarChart3, label: 'Analysis', id: 'analysis' as Tab },
            { icon: MessageSquare, label: 'Query', id: 'chat' as Tab },
            { icon: Settings, label: 'Settings', id: 'settings' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (typeof item.id === 'string' && item.id !== 'settings') {
                  changeTab(item.id as Tab);
                }
              }}
              className={`
                w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200
                ${(activeTab === item.id || (activeTab === 'new-connector' && item.id === 'connectors'))
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                  : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
              `}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-[var(--border)] space-y-1">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all duration-200"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {isSidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                Logout
              </motion.span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main 
        className="flex-1 transition-all duration-300"
        style={{ marginLeft: isSidebarOpen ? 280 : 80 }}
      >
        <header className="h-14 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-40 px-6 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {activeTab === 'chat' ? 'Query' : 
               activeTab === 'new-connector' ? 'Add Connector' : 
               activeTab === 'collection' ? 'Collection' :
               activeTab === 'analysis' ? 'Analysis' : 'Connection'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {activeTab === 'chat' 
                ? 'Ask anything to analyze your data and get insights' 
                : activeTab === 'new-connector'
                ? `Set up connection for ${selectedConnector?.name || 'new server'} with Dataor Guide`
                : activeTab === 'collection'
                ? 'Manage data ingestion and synchronization'
                : activeTab === 'analysis'
                ? 'Review statistical models and generated insights'
                : 'Connect your data directly to run instant analysis'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">Docs</Button>
          </div>
        </header>

        <div className={`p-4 w-full ${activeTab === 'chat' ? 'max-w-none' : 'max-w-6xl mx-auto'}`}>
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100vh-8rem)]"
              >
                <AgentWorkflow 
                  key={`chat-${chatKey}`}
                  onComplete={handleWorkflowComplete} 
                  defaultAgentId="query" 
                  onChangeTab={changeTab} 
                  activeConnector={selectedConnector}
                  initialChatMessage={initialChatMessage}
                />
              </motion.div>
            ) : activeTab === 'new-connector' ? (
              <motion.div
                key="new-connector"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <ConnectorForm 
                  onBack={handleBackToConnectors} 
                  connector={selectedConnector} 
                  onTestSuccess={handleStartWorkflow}
                />
              </motion.div>
            ) : activeTab === 'collection' ? (
              <motion.div
                key="collection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100vh-8rem)]"
              >
                <AgentWorkflow 
                  onComplete={handleWorkflowComplete} 
                  defaultAgentId="ingest" 
                  onChangeTab={changeTab}
                  activeConnector={selectedConnector}
                />
              </motion.div>
            ) : activeTab === 'analysis' ? (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100vh-8rem)]"
              >
                <AgentWorkflow 
                  onComplete={handleWorkflowComplete} 
                  defaultAgentId="analyze" 
                  onChangeTab={changeTab}
                  onForwardWithContext={handleForwardWithContext}
                  activeConnector={selectedConnector}
                />
              </motion.div>
            ) : activeTab === 'connectors' ? (
              <motion.div
                key="connectors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-[calc(100vh-8rem)]"
              >
                <AgentWorkflow 
                  onComplete={handleWorkflowComplete} 
                  defaultAgentId="connect" 
                  onChangeTab={changeTab} 
                  onNewConnector={handleNewConnector} 
                  onSelectConnector={handleSelectConnector} 
                  activeConnector={selectedConnector}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
