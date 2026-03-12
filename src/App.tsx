import { ThemeProvider, useTheme, Button } from './ui-kit';
import { ConnectorList, ConnectorForm, Connector } from './features/connectors';
import { ConnectorProvider, useConnectorContext } from './context/ConnectorContext';
import { AuthProvider, useAuthContext } from './context/AuthContext';
import { ChatWindow } from './features/chat';
import { AgentWorkflow } from './features/workflow';
import { LandingPage } from './features/marketing/components/LandingPage';
import { LoginPage } from './features/auth/components/LoginPage';
import { Moon, Sun, Layout, Settings, LogOut, Menu, MessageSquare, Database, Plus, Sparkles, BarChart3, Clock, Search, ChevronDown, User, Check, X, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';
import { agentService } from './services/agent.service';
import { AgentHistoryItem } from './features/workflow/types';
import { workspaceService, Workspace } from './services/workspace.service';
import { connectorService } from './services/connector.service';

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
  const [historySearch, setHistorySearch] = useState('');

  // Workspace state
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [workspaceSearch, setWorkspaceSearch] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [workflowKey, setWorkflowKey] = useState(0);

  // Per-workspace history state
  const [expandedWorkspaceId, setExpandedWorkspaceId] = useState<number | null>(null);
  const [workspaceHistories, setWorkspaceHistories] = useState<Record<number, AgentHistoryItem[]>>({});
  const [isHistoryLoading, setIsHistoryLoading] = useState<Record<number, boolean>>({});

  const fetchWorkspaces = async () => {
    try {
      const response = await workspaceService.getWorkspaces(userId || 6);
      if (response && response.status === 'success' && response.workspaces) {
        const fetchedWorkspaces: Workspace[] = response.workspaces;
        setWorkspaces(fetchedWorkspaces);

        // Always sync selection with the active workspace from API
        const activeWS = fetchedWorkspaces.find(w => w.is_active === 1) || fetchedWorkspaces[0];
        if (activeWS) {
          setSelectedWorkspace(activeWS);
          localStorage.setItem('DAgent_session_id', activeWS.session_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    }
  };

  const fetchWorkspaceHistory = async (workspaceId: number, sessionId: string) => {
    if (workspaceHistories[workspaceId] && expandedWorkspaceId === workspaceId) {
      setExpandedWorkspaceId(null);
      return;
    }

    setIsHistoryLoading(prev => ({ ...prev, [workspaceId]: true }));
    try {
      const response = await agentService.getAgents(userId, true); // We might need to ensure agents are fetched for the session
      // However, getAgents uses localstorage DAgent_session_id. 
      // For background fetching of other workspaces, we should use connectorService directly or update agentService.
      const historyResponse = await (connectorService as any).getConnectionHistory(sessionId);
      if (historyResponse && historyResponse.status === 'success' && historyResponse.history) {
        const history = historyResponse.history.filter((h: any) => h.db_type === 'session_analysis_result' || h.action === 'Session Data Imported' || h.action.includes('Query') || h.details?.includes('query'));
        // The above filter is a bit broad, let's refine based on what's usually in queryHistory
        const queryOnly = historyResponse.history.filter((h: any) => h.action.toLowerCase().includes('query') || h.details?.toLowerCase().includes('query') || !h.db_type);

        setWorkspaceHistories(prev => ({ ...prev, [workspaceId]: queryOnly }));
      }
      setExpandedWorkspaceId(workspaceId);
    } catch (err) {
      console.error('Failed to fetch workspace history:', err);
    } finally {
      setIsHistoryLoading(prev => ({ ...prev, [workspaceId]: false }));
    }
  };

  useEffect(() => {
    if (userId || viewMode === 'app') {
      fetchWorkspaces();
    }
  }, [userId, viewMode]);


  const handleLogin = () => setViewMode('login');
  const handleGetStarted = () => setViewMode('login');
  const handleLoginSuccess = () => {
    setViewMode('app');
    setIsWorkspaceOpen(false);
    setActiveTab('chat');
  };
  const handleBackToLanding = () => setViewMode('landing');
  const { logout } = useAuthContext();
  const { resetConnectorState } = useConnectorContext();

  const handleLogout = () => {
    logout();
    resetConnectorState();
    agentService.reset();
    setViewMode('landing');
    setIsWorkspaceOpen(false);
    setActiveTab('chat');
    localStorage.clear();
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

  const handleStartWorkflow = async (connectionName?: string, shouldSwitchTab: boolean = false) => {
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


    // Redirect to connectors tab so user stays in the data source view if requested
    if (shouldSwitchTab) {
      changeTab('collection');
    } else {
      changeTab('connectors');
    }
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
                        Workspace - {selectedWorkspace?.workspace_name || 'Select'}
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
                                  if (!workspaces.find(w => w.workspace_name === trimmed)) {
                                    try {
                                      const response = await workspaceService.createWorkspace(userId || 6, trimmed);
                                      const newWS: Workspace = response.workspace || {
                                        id: response.id,
                                        workspace_name: trimmed,
                                        session_id: response.session_id
                                      };
                                      setWorkspaces(prev => [...prev, newWS]);
                                      setSelectedWorkspace(newWS);
                                      localStorage.setItem('DAgent_session_id', newWS.session_id);
                                      setWorkspaceSearch('');
                                      setIsCreatingWorkspace(false);
                                      setNewWorkspaceName('');
                                      await fetchWorkspaces();
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
                                  if (!workspaces.find(w => w.workspace_name === trimmed)) {
                                    try {
                                      const response = await workspaceService.createWorkspace(userId || 6, trimmed);
                                      const newWS: Workspace = response.workspace || {
                                        id: response.id,
                                        workspace_name: trimmed,
                                        session_id: response.session_id
                                      };
                                      setWorkspaces(prev => [...prev, newWS]);
                                      setSelectedWorkspace(newWS);
                                      localStorage.setItem('DAgent_session_id', newWS.session_id);
                                      setWorkspaceSearch('');
                                      setIsCreatingWorkspace(false);
                                      setNewWorkspaceName('');
                                      await fetchWorkspaces();
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
                      <div className="space-y-1.5 overflow-y-auto flex-1">
                        {(() => {
                          const filtered = workspaces.filter(w => {
                            return w.workspace_name.toLowerCase().includes(workspaceSearch.toLowerCase());
                          });
                          return filtered.length === 0 ? (
                            <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl">
                              <p className="text-[10px] text-[var(--text-secondary)]">No matching workspace</p>
                            </div>
                          ) : (
                            filtered.map((workspace) => (
                              <div
                                key={workspace.id}
                                className={`flex flex-col transition-all duration-300 overflow-hidden border ${selectedWorkspace?.id === workspace.id
                                  ? 'border-[var(--accent)]/40 bg-[var(--accent)]/5 shadow-sm'
                                  : 'border-[var(--border)] bg-[var(--bg)]/50 hover:bg-[var(--surface-hover)]'
                                  } ${expandedWorkspaceId === workspace.id ? 'rounded-2xl' : 'rounded-xl'}`}
                              >
                                <button
                                  onClick={async () => {
                                    // 1. Switch to this workspace
                                    try {
                                      if (selectedWorkspace?.id !== workspace.id) {
                                        await workspaceService.setActiveWorkspace(userId || 6, workspace.id);
                                        resetConnectorState();
                                        agentService.reset();
                                        setSelectedWorkspace(workspace);
                                        localStorage.setItem('DAgent_session_id', workspace.session_id);
                                        setWorkflowKey(prev => prev + 1);
                                      }

                                      // 2. Toggle history expansion
                                      fetchWorkspaceHistory(workspace.id, workspace.session_id);
                                    } catch (err) {
                                      console.error('Failed to set active workspace:', err);
                                    }
                                  }}
                                  className={`w-full text-left p-3 flex items-center justify-between cursor-pointer transition-colors
                                  ${selectedWorkspace?.id === workspace.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                                `}
                                >
                                  <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                                    <span className={`text-[11px] font-bold truncate ${selectedWorkspace?.id === workspace.id ? 'text-[var(--accent)]' : ''}`}>
                                      {workspace.workspace_name}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {/* {selectedWorkspace?.id === workspace.id && (
                                      <span className="text-[var(--accent)] text-lg leading-none">*</span>
                                    )} */}
                                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedWorkspaceId === workspace.id ? 'rotate-180 text-[var(--accent)]' : 'opacity-40'}`} />
                                  </div>
                                </button>

                                {/* Workspace History Items */}
                                <AnimatePresence>
                                  {expandedWorkspaceId === workspace.id && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="px-1 pt-1 pb-3 overflow-hidden flex flex-col min-h-0"
                                    >
                                      {/* Search - Replicating original design */}
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

                                      <div className="space-y-1.5 overflow-y-auto max-h-[300px] custom-scrollbar">
                                        {isHistoryLoading[workspace.id] ? (
                                          <div className="py-2 text-center">
                                            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mx-auto opacity-50"></div>
                                          </div>
                                        ) : (() => {
                                          const filteredData = (workspaceHistories[workspace.id] || []).filter(item =>
                                            !historySearch ||
                                            item.action.toLowerCase().includes(historySearch.toLowerCase()) ||
                                            item.details.toLowerCase().includes(historySearch.toLowerCase())
                                          );

                                          return filteredData.length === 0 ? (
                                            <div className="text-center py-6 border border-dashed border-[var(--border)] rounded-xl">
                                              <p className="text-[10px] text-[var(--text-secondary)]">No previous chats</p>
                                            </div>
                                          ) : (
                                            filteredData.map((item) => (
                                              <div
                                                key={item.id}
                                                className="w-full text-left p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 hover:bg-[var(--surface-hover)] transition-all cursor-pointer group"
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
                                                <div className="text-[11px] font-bold truncate text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors">
                                                  {item.action}
                                                </div>
                                                <div className="text-[10px] text-[var(--text-secondary)] truncate opacity-70">
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
                              </div>
                            ))
                          );
                        })()}
                      </div>
                    </div>

                    {/* Divider - Subtle divider inside the dropdown */}
                    <div className="mx-4 my-2 h-px bg-[var(--border)] opacity-30 shrink-0" />
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
                  key={`chat-${workflowKey}-${chatKey}`}
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
                  key={`ingest-${workflowKey}`}
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
                  key={`analysis-${workflowKey}`}
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
                  key={`connectors-${workflowKey}`}
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
