import { Workspace } from '../services/workspace.service';
import { Connector } from '../features/connectors';
import { QuerySession } from '../services/chatHistory.service';

export type Tab = 'chat' | 'connectors' | 'new-connector' | 'collection' | 'analysis' | 'admin';
export type ViewMode = 'landing' | 'login' | 'app';

export interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (ws: Workspace | null) => void;
  isWorkspaceOpen: boolean;
  setIsWorkspaceOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  workspaceSearch: string;
  setWorkspaceSearch: (search: string) => void;
  workspaces: Workspace[];
  setWorkspaces: (ws: Workspace[] | ((prev: Workspace[]) => Workspace[])) => void;
  isCreatingWorkspace: boolean;
  setIsCreatingWorkspace: (creating: boolean) => void;
  newWorkspaceName: string;
  setNewWorkspaceName: (name: string) => void;
  expandedWorkspaceId: number | null;
  setExpandedWorkspaceId: (id: number | null) => void;
  queryHistories: Record<number, QuerySession[]>;
  isQueryLoading: Record<number, boolean>;
  historySearch: string;
  setHistorySearch: (search: string) => void;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  workflowKey: number;
  setWorkflowKey: (key: number | ((prev: number) => number)) => void;
  chatKey: number;
  setChatKey: (key: number | ((prev: number) => number)) => void;
  fetchWorkspaces: () => Promise<void>;
  fetchWorkspaceHistory: (workspaceId: number, sessionId: string) => Promise<void>;
  handleLogout: () => void;
  resetConnectorState: () => void;
  agentService: any;
  setInitialChatMessage: (msg: string | undefined) => void;
}

export interface AppHeaderProps {
  activeTab: Tab;
  selectedConnector: Connector | null;
}

export interface MainContentProps {
  activeTab: Tab;
  workflowKey: number;
  chatKey: number;
  initialChatMessage: string | undefined;
  selectedConnector: Connector | null;
  handleWorkflowComplete: () => void;
  changeTab: (tab: Tab) => void;
  handleBackToConnectors: () => void;
  handleStartWorkflow: (connectionName?: string, shouldSwitchTab?: boolean) => Promise<void>;
  handleForwardWithContext: (agentId: string, context: string) => void;
}
