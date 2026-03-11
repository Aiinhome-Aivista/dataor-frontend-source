import { ThemeProvider, useTheme, Button } from './ui-kit';
import { ConnectorList, ConnectorForm, Connector } from './features/connectors';
import { ConnectorProvider, useConnectorContext } from './context/ConnectorContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { ChatWindow } from './features/chat';
import { AgentWorkflow } from './features/workflow';
import { LandingPage } from './features/marketing/components/LandingPage';
import { LoginPage } from './features/auth/components/LoginPage';
import { Moon, Sun, Layout, Settings, LogOut, Menu, MessageSquare, Database, Plus, Sparkles, BarChart3, Clock, Search, ChevronDown, User, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { agentService } from './services/agent.service';
import { AgentHistoryItem } from './features/workflow/types';
import { workspaceService } from './services/workspace.service';

type Tab = 'chat' | 'connectors' | 'new-connector' | 'collection' | 'analysis';
type ViewMode = 'landing' | 'login' | 'app';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { userId, setUserId } = useAuthContext();
  const [viewMode, setViewMode] = useState<ViewMode>(userId ? 'app' : 'landing');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { selectedConnector, setSelectedConnector } = useConnectorContext();
  const [justFinishedWorkflow, setJustFinishedWorkflow] = useState(false);
  const [initialChatMessage, setInitialChatMessage] = useState<string | undefined>(undefined);
  const [chatKey, setChatKey] = useState(0);
  const [queryHistory, setQueryHistory] = useState<AgentHistoryItem[]>([]);
  const [isQueryHistoryOpen, setIsQueryHistoryOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Workspace state
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState('Default');
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isWorkspacesLoading, setIsWorkspacesLoading] = useState(false);

  useEffect(() => {
    const fetchWorkspaces = async () => {
      setIsWorkspacesLoading(true);
      try {
        const response = await workspaceService.getWorkspaces(userId || 6);
        if (response && response.status === 'success' && response.workspaces) {
          const workspaceList = response.workspaces;
          setWorkspaces(workspaceList);

          // Find active workspace
          const activeWorkspace = workspaceList.find((w: any) => w.is_active === 1);
          if (activeWorkspace) {
            const name = activeWorkspace.workspace_name || activeWorkspace.name;
            setSelectedWorkspace(name);
            if (activeWorkspace.session_id) {
              localStorage.setItem('DAgent_session_id', activeWorkspace.session_id);
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch workspaces:', err);
      } finally {
        setIsWorkspacesLoading(false);
      }
    };
    if (userId || viewMode === 'app') {
      fetchWorkspaces();
    }
  }, [userId, viewMode]);

  useEffect(() => {
    const fetchQueryHistory = async () => {
      const history = await agentService.getAgentHistory('query');
      setQueryHistory(history);
    };
    fetchQueryHistory();
    // Poll for updates when on chat tab
    const interval = setInterval(fetchQueryHistory, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogin = () => setViewMode('login');
  const handleGetStarted = () => setViewMode('login');

  const resetAppState = () => {
    setActiveTab('chat');
    setSidebarOpen(true);
    setJustFinishedWorkflow(false);
    setInitialChatMessage(undefined);
    setIsWorkspaceOpen(false);
    setIsQueryHistoryOpen(false);
    setWorkspaceSearch('');
    setHistorySearch('');
    setSelectedWorkspace('Default');
    setIsCreatingWorkspace(false);
    setNewWorkspaceName('');
    setSelectedConnector(null);
    setChatKey(prev => prev + 1);
  };

  const handleLoginSuccess = () => {
    resetAppState();
    setViewMode('app');
  };
  const handleBackToLanding = () => setViewMode('landing');
  const handleLogout = () => {
    setUserId(null); // This will clear the localStorage key in AuthContext
    resetAppState();
    setViewMode('login');
  };

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

    // Redirect to connectors tab so user stays in the data source view
    changeTab('connectors');
  };

  const handleWorkflowComplete = () => {
    // Wait a bit then switch to chat
    setTimeout(() => {
      setJustFinishedWorkflow(true);
      setActiveTab('chat');
    }, 1500);
  };

  const handleWorkspaceSelect = async (workspace: any) => {
    const name = workspace.workspace_name || workspace.name;
    setSelectedWorkspace(name);
    setIsWorkspaceOpen(false);

    if (workspace.session_id) {
      localStorage.setItem('DAgent_session_id', workspace.session_id);
    }

    try {
      await workspaceService.setActiveWorkspace(userId || 10, workspace.id);
    } catch (err) {
      console.error('Failed to set active workspace:', err);
    }
  };

  const changeTab = (tab: Tab) => {
    if (tab !== 'chat') {
      setJustFinishedWorkflow(false);
      setInitialChatMessage(undefined);
    }
    setIsWorkspaceOpen(false);
    setIsQueryHistoryOpen(false);
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
              <span>DAgent</span>
            </motion.div>
          )}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-lg hover:bg-[var(--surface-hover)] transition-colors"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>

        {/* Main nav area */}
        <div className="flex flex-col mt-2 flex-1 min-h-0 overflow-hidden">
          {/* Scrollable middle section */}
          <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Workspace & Query Section */}
            <div className="flex flex-col shrink-0">
              {/* Workspace nav item */}
              <div className="px-3 mb-1">
                <button
                  onClick={() => setIsWorkspaceOpen(o => !o)}
                  className={`
                    w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200
                    hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                  `}
                >
                  <Layout className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && (
                    <>
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm flex-1 text-left ">
                        Workspace - {selectedWorkspace}
                      </motion.span>
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isWorkspaceOpen ? 'rotate-180' : ''}`} />
                      </motion.div>
                    </>
                  )}
                </button>
              </div>

              {/* Workspace Dropdown & Query Section */}
              <AnimatePresence>
                {isSidebarOpen && isWorkspaceOpen && (
                  <motion.div
                    key="workspace-dropdown"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden flex flex-col shrink-0"
                  >
                    <div className="px-3 pt-1 pb-3 flex flex-col shrink-0 max-h-[300px]">
                      {/* Create Workspace */}
                      <div className="mb-2 shrink-0">
                        {isCreatingWorkspace ? (
                          <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[var(--border)] bg-[var(--surface-hover)]">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Workspace name..."
                              value={newWorkspaceName}
                              onChange={e => setNewWorkspaceName(e.target.value)}
                              onKeyDown={async e => {
                                if (e.key === 'Enter' && newWorkspaceName.trim()) {
                                  const trimmed = newWorkspaceName.trim();
                                  if (!workspaces.includes(trimmed)) {
                                    try {
                                      await workspaceService.createWorkspace(userId || 6, trimmed);
                                      setWorkspaces(prev => [...prev, trimmed]);
                                      setSelectedWorkspace(trimmed);
                                      setWorkspaceSearch('');
                                      setIsCreatingWorkspace(false);
                                      setNewWorkspaceName('');
                                    } catch (err) {
                                      console.error('Failed to create workspace:', err);
                                    }
                                  }
                                } else if (e.key === 'Escape') {
                                  setIsCreatingWorkspace(false);
                                  setNewWorkspaceName('');
                                }
                              }}
                              className="flex-1 min-w-0 bg-transparent text-[11px] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none px-1 py-0.5"
                            />
                            <button
                              onClick={async () => {
                                if (newWorkspaceName.trim()) {
                                  const trimmed = newWorkspaceName.trim();
                                  if (!workspaces.includes(trimmed)) {
                                    try {
                                      await workspaceService.createWorkspace(userId || 6, trimmed);
                                      setWorkspaces(prev => [...prev, trimmed]);
                                      setSelectedWorkspace(trimmed);
                                      setWorkspaceSearch('');
                                      setIsCreatingWorkspace(false);
                                      setNewWorkspaceName('');
                                    } catch (err) {
                                      console.error('Failed to create workspace:', err);
                                    }
                                  }
                                }
                              }}
                              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shrink-0"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setIsCreatingWorkspace(false);
                                setNewWorkspaceName('');
                              }}
                              className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-start px-1 mb-1">
                            <button
                              onClick={() => setIsCreatingWorkspace(true)}
                              className="flex items-center gap-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-xs font-semibold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              Create workspace
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Search */}
                      <div className="relative mb-2 shrink-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)]" />
                        <input
                          type="text"
                          placeholder="Search workspace..."
                          value={workspaceSearch}
                          onChange={e => setWorkspaceSearch(e.target.value)}
                          className="w-full pl-7 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
                        />
                      </div>
                      {/* Items */}
                      <div className="space-y-1.5 overflow-y-auto flex-1 min-h-[100px]">
                        {isWorkspacesLoading ? (
                          <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <Clock className="w-6 h-6 text-[var(--accent)]" />
                            </motion.div>
                            <p className="text-[11px] font-medium text-[var(--text-secondary)] animate-pulse">Loading workspaces...</p>
                          </div>
                        ) : (() => {
                          const filtered = workspaces.filter(w => {
                            const name = w.workspace_name || w.name || '';
                            return name.toLowerCase().includes(workspaceSearch.toLowerCase());
                          });
                          return filtered.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl">
                              <p className="text-[10px] text-[var(--text-secondary)]">No matching workspace</p>
                            </div>
                          ) : (
                            filtered.map((workspace) => {
                              const name = workspace.workspace_name || workspace.name;
                              const isActive = selectedWorkspace === name;
                              return (
                                <button
                                  key={workspace.id}
                                  onClick={() => handleWorkspaceSelect(workspace)}
                                  className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer
                                  ${isActive
                                      ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5 text-[var(--accent)]'
                                      : 'border-[var(--border)] bg-[var(--bg)]/50 hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                                `}
                                >
                                  <div className="flex flex-col gap-0.5 overflow-hidden">
                                    <span className={`text-[11px] font-bold truncate ${isActive ? 'text-[var(--accent)]' : ''}`}>
                                      {name}
                                    </span>

                                  </div>
                                </button>
                              );
                            })
                          );
                        })()}
                      </div>
                    </div>

                    {/* Divider - Subtle divider inside the dropdown between workspace list and query */}
                    <div className="mx-4 my-2 h-px bg-[var(--border)] opacity-50 shrink-0" />

                    {/* Query nav item - Now nested under Workspace condition */}
                    <div className="px-3 pb-1 shrink-0">
                      <button
                        onClick={() => {
                          changeTab('chat');
                          setIsQueryHistoryOpen(o => !o);
                        }}
                        className={`
                          w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-200 hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]`}>
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        {isSidebarOpen && (
                          <>
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm flex-1 text-left">
                              Chat History
                            </motion.span>
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isQueryHistoryOpen ? 'rotate-180' : ''}`} />
                            </motion.div>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Query History — collapsible, nested under Query */}
                    <AnimatePresence>
                      {isSidebarOpen && isQueryHistoryOpen && (
                        <motion.div
                          key="query-history"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-3 pt-1 pb-3 overflow-hidden flex flex-col min-h-0"
                        >
                          {/* Search */}
                          <div className="relative mb-2 shrink-0">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)]" />
                            <input
                              type="text"
                              placeholder="Search chats..."
                              value={historySearch}
                              onChange={e => setHistorySearch(e.target.value)}
                              className="w-full pl-7 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
                            />
                          </div>
                          {/* Items */}
                          <div className="space-y-1.5 overflow-y-auto max-h-[400px]">
                            {(() => {
                              const filtered = queryHistory.filter(item =>
                                !historySearch ||
                                item.action.toLowerCase().includes(historySearch.toLowerCase()) ||
                                item.details.toLowerCase().includes(historySearch.toLowerCase())
                              );
                              return filtered.length === 0 ? (
                                <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl">
                                  <p className="text-[10px] text-[var(--text-secondary)]">
                                    {historySearch ? 'No matching chats' : 'No previous chats'}
                                  </p>
                                </div>
                              ) : (
                                filtered.map((item) => (
                                  <div
                                    key={item.id}
                                    className="w-full text-left p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 hover:bg-[var(--surface-hover)] transition-all cursor-pointer"
                                  >
                                    <div className="flex items-center justify-between mb-0.5">
                                      <span className="text-[9px] font-mono text-[var(--text-secondary)]">
                                        {new Date(item.date).toLocaleDateString()}
                                      </span>
                                      {item.connectionName && (
                                        <span className="text-[8px] text-[var(--text-secondary)] bg-[var(--surface-hover)] px-1.5 py-0.5 rounded-full font-bold truncate max-w-[80px] border border-[var(--border)]">
                                          {item.connectionName}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] font-bold truncate text-[var(--text-primary)]">
                                      {item.action}
                                    </div>
                                    <div className="text-[10px] text-[var(--text-secondary)] truncate">
                                      {item.details}
                                    </div>
                                  </div>
                                ))
                              );
                            })()}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Settings + Logout — fixed at the bottom */}
          <div className="px-3 pb-3 space-y-1 shrink-0 mt-auto border-t border-[var(--border)] pt-3">
            <button
              className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all duration-200"
            >
              <Settings className="w-4 h-4 shrink-0" />
              {isSidebarOpen && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm">
                  Settings
                </motion.span>
              )}
            </button>
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
                  activeTab === 'collection' ? 'Import' :
                    activeTab === 'analysis' ? 'Process' : 'Data source'}
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {activeTab === 'chat'
                ? 'Ask anything to analyze your data and get insights'
                : activeTab === 'new-connector'
                  ? `Set up connection for ${selectedConnector?.name || 'new server'} with DAgent Guide`
                  : activeTab === 'collection'
                    ? 'Manage data ingestion and synchronization'
                    : activeTab === 'analysis'
                      ? 'Review statistical models and generated insights'
                      : 'Connect your data directly to run instant analysis'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="flex items-center gap-2.5 rounded-full pr-4 pl-1.5 h-9 border-[var(--border)] hover:bg-[var(--surface-hover)] transition-all">
              <div className="w-6 h-6 rounded-full bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                <User className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Welcome aiinhome</span>
            </Button>
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
      <AuthProvider>
        <ConnectorProvider>
          <AppContent />
        </ConnectorProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
