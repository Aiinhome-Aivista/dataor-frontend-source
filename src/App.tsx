import { ThemeProvider, useTheme, Button } from './ui-kit';
import { ConnectorList, ConnectorForm, Connector } from './features/connectors';
import { ChatWindow } from './features/chat';
import { AgentWorkflow } from './features/workflow';
import { LandingPage } from './features/marketing/LandingPage';
import { LoginPage } from './features/auth/LoginPage';
import { Moon, Sun, Layout, Settings, LogOut, Menu, MessageSquare, Database, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';

type Tab = 'connectors' | 'chat' | 'new-connector' | 'workflow';
type ViewMode = 'landing' | 'login' | 'app';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);

  const handleLogin = () => setViewMode('login');
  const handleGetStarted = () => setViewMode('login');
  const handleLoginSuccess = () => setViewMode('app');
  const handleBackToLanding = () => setViewMode('landing');
  const handleLogout = () => setViewMode('landing');

  const handleNewConnector = () => {
    setSelectedConnector(null);
    setActiveTab('new-connector');
  };

  const handleSelectConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setActiveTab('new-connector');
  };

  const handleBackToConnectors = () => {
    setSelectedConnector(null);
    setActiveTab('connectors');
  };

  const handleStartWorkflow = () => {
    setActiveTab('workflow');
  };

  const handleWorkflowComplete = () => {
    // Wait a bit then switch to chat
    setTimeout(() => {
      setActiveTab('chat');
    }, 1500);
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
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 font-bold text-xl"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white">
                D
              </div>
              <span>Dataor</span>
            </motion.div>
          )}
          <button 
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {[
            { icon: MessageSquare, label: 'Chat Assistant', id: 'chat' as Tab },
            { icon: Database, label: 'Data Connectors', id: 'connectors' as Tab },
            { icon: Settings, label: 'Settings', id: 'settings' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => {
                if (typeof item.id === 'string' && item.id !== 'settings') {
                  setActiveTab(item.id as Tab);
                }
              }}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200
                ${(activeTab === item.id || (activeTab === 'new-connector' && item.id === 'connectors') || (activeTab === 'workflow' && item.id === 'chat'))
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                  : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
              `}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border)] space-y-2">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {isSidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
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
        <header className="h-20 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {activeTab === 'chat' ? 'AI Assistant' : 
               activeTab === 'new-connector' ? 'Add Connector' : 
               activeTab === 'workflow' ? 'Agent Orchestration' : 'Connectors & MCPs'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {activeTab === 'chat' 
                ? 'Chat with Dataor to analyze your data and get insights' 
                : activeTab === 'new-connector'
                ? `Set up connection for ${selectedConnector?.name || 'new server'} with Dataor Guide`
                : activeTab === 'workflow'
                ? 'Watch your AI agents collaborate to prepare your data'
                : 'Connect your data directly to run instant analysis'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm">Docs</Button>
            {activeTab !== 'new-connector' && activeTab !== 'workflow' && (
              <Button size="sm" onClick={activeTab === 'chat' ? () => {} : handleNewConnector}>
                <Plus className="w-4 h-4 mr-2" />
                {activeTab === 'chat' ? 'New Chat' : 'New Connector'}
              </Button>
            )}
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'chat' ? (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="max-w-4xl mx-auto"
              >
                <ChatWindow />
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
            ) : activeTab === 'workflow' ? (
              <motion.div
                key="workflow"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <AgentWorkflow onComplete={handleWorkflowComplete} />
              </motion.div>
            ) : (
              <motion.section
                key="connectors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-12">
                  <h2 className="text-xl font-semibold mb-6">Integrations</h2>
                  <div className="p-6 rounded-2xl bg-[var(--accent)]/5 border border-[var(--accent)]/10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg">
                        <img src="https://picsum.photos/seed/slack/64/64" alt="Slack" className="w-8 h-8 rounded" referrerPolicy="no-referrer" />
                      </div>
                      <div>
                        <h3 className="font-bold">Slack</h3>
                        <p className="text-sm text-[var(--text-secondary)]">Connect your Slack workspace to receive reports and insights</p>
                      </div>
                    </div>
                    <Button variant="primary" size="sm">Connect</Button>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-xl font-semibold mb-2">Add Connectors</h2>
                      <p className="text-sm text-[var(--text-secondary)]">Choose from our list of supported data sources</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleNewConnector}>
                      <Plus className="w-4 h-4 mr-2" />
                      Custom Connection
                    </Button>
                  </div>
                  <ConnectorList onSelect={handleSelectConnector} />
                </div>
              </motion.section>
            )}
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
