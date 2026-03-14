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
import { useState, useEffect, useMemo } from 'react';
import { agentService } from './services/agent.service';
import { AgentHistoryItem } from './features/workflow/types';
import { workspaceService, Workspace } from './services/workspace.service';
import { connectorService } from './services/connector.service';
import { chatHistoryService, QuerySession } from './services/chatHistory.service';

import { Sidebar } from './layout/Sidebar';
import { AppHeader } from './layout/AppHeader';
import { MainContent } from './layout/MainContent';
import { Tab, ViewMode } from './types/layout';

function AppContent() {
  const { theme, toggleTheme } = useTheme();
  const { userId, logout } = useAuthContext();
  const [viewMode, setViewMode] = useState<ViewMode>(userId ? 'app' : 'landing');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const { selectedConnector, setSelectedConnector, resetConnectorState } = useConnectorContext();
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
  const [queryHistories, setQueryHistories] = useState<Record<number, QuerySession[]>>({});
  const [isQueryLoading, setIsQueryLoading] = useState<Record<number, boolean>>({});

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
    // If clicking the already expanded one, close it immediately
    if (expandedWorkspaceId === workspaceId) {
      setExpandedWorkspaceId(null);
      return;
    }

    // Toggle expansion state IMMEDIATELY for zero-delay UX
    setExpandedWorkspaceId(workspaceId);

    // If we already have query history, we might not need to fetch again
    if (queryHistories[workspaceId]) {
      return;
    }

    setIsQueryLoading(prev => ({ ...prev, [workspaceId]: true }));
    try {
      // Fetch Query History only
      const queryResponse = await chatHistoryService.getSessionChatHistory(sessionId, userId);

      if (queryResponse && queryResponse.status === 'success' && queryResponse.querySessions) {
        setQueryHistories(prev => ({ ...prev, [workspaceId]: queryResponse.querySessions }));
      }
    } catch (err) {
      console.error('Failed to fetch workspace history:', err);
    } finally {
      setIsQueryLoading(prev => ({ ...prev, [workspaceId]: false }));
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
    <div className="min-h-screen flex text-[var(--text-primary)]">
      <Sidebar
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        selectedWorkspace={selectedWorkspace}
        setSelectedWorkspace={setSelectedWorkspace}
        isWorkspaceOpen={isWorkspaceOpen}
        setIsWorkspaceOpen={setIsWorkspaceOpen}
        workspaceSearch={workspaceSearch}
        setWorkspaceSearch={setWorkspaceSearch}
        workspaces={workspaces}
        setWorkspaces={setWorkspaces}
        isCreatingWorkspace={isCreatingWorkspace}
        setIsCreatingWorkspace={setIsCreatingWorkspace}
        newWorkspaceName={newWorkspaceName}
        setNewWorkspaceName={setNewWorkspaceName}
        expandedWorkspaceId={expandedWorkspaceId}
        setExpandedWorkspaceId={setExpandedWorkspaceId}
        queryHistories={queryHistories}
        isQueryLoading={isQueryLoading}
        historySearch={historySearch}
        setHistorySearch={setHistorySearch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workflowKey={workflowKey}
        setWorkflowKey={setWorkflowKey}
        chatKey={chatKey}
        setChatKey={setChatKey}
        userId={userId}
        fetchWorkspaces={fetchWorkspaces}
        fetchWorkspaceHistory={fetchWorkspaceHistory}
        handleLogout={handleLogout}
        resetConnectorState={resetConnectorState}
        agentService={agentService}
        setInitialChatMessage={setInitialChatMessage}
      />

      <main
        className="flex-1"
        style={{ marginLeft: isSidebarOpen ? 280 : 80 }}
      >
        <AppHeader
          activeTab={activeTab}
          selectedConnector={selectedConnector}
        />

        <MainContent
          activeTab={activeTab}
          workflowKey={workflowKey}
          chatKey={chatKey}
          initialChatMessage={initialChatMessage}
          selectedConnector={selectedConnector}
          handleWorkflowComplete={handleWorkflowComplete}
          changeTab={changeTab}
          handleBackToConnectors={handleBackToConnectors}
          handleStartWorkflow={handleStartWorkflow}
          handleForwardWithContext={handleForwardWithContext}
        />
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
