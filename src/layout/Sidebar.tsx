import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, Layout, Plus, Check, X, Search, ChevronDown, Settings, LogOut } from 'lucide-react';
import { Workspace, workspaceService } from '../services/workspace.service';
import { AgentHistoryItem } from '../features/workflow/types';
import { SidebarProps } from '../types/layout';

export const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setSidebarOpen,
  selectedWorkspace,
  setSelectedWorkspace,
  isWorkspaceOpen,
  setIsWorkspaceOpen,
  workspaceSearch,
  setWorkspaceSearch,
  workspaces,
  setWorkspaces,
  isCreatingWorkspace,
  setIsCreatingWorkspace,
  newWorkspaceName,
  setNewWorkspaceName,
  expandedWorkspaceId,
  setExpandedWorkspaceId,
  workspaceHistories,
  isHistoryLoading,
  historySearch,
  setHistorySearch,
  activeTab,
  setActiveTab,
  workflowKey,
  setWorkflowKey,
  chatKey,
  setChatKey,
  userId,
  fetchWorkspaces,
  fetchWorkspaceHistory,
  handleLogout,
  resetConnectorState,
  agentService,
  setInitialChatMessage
}) => {
  return (
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
              <div 
                className={`
                  w-full flex items-center overflow-hidden gap-1 p-0.5 rounded-xl border border-[var(--border)]/20 bg-[var(--bg)]/50
                `}
              >
                {/* Selection/Label Part (85%) */}
                <div
                  className={`
                    ${isSidebarOpen ? 'w-[85%]' : 'w-full px-2'} flex items-center gap-2.5 py-1.5 px-3 transition-colors rounded-l-xl
                    text-[var(--text-secondary)]
                  `}
                >
                  <Layout className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm flex-1 text-left truncate">
                      Workspace - {selectedWorkspace?.workspace_name || 'Select'}
                    </motion.span>
                  )}
                </div>

                {isSidebarOpen && (
                  <>
                    <div className="h-6 w-px bg-[var(--border)] shrink-0" />
                    
                    {/* Expansion Toggle Part (15% Width) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsWorkspaceOpen(o => !o);
                      }}
                      className={`
                        w-[15%] py-1.5 flex items-center justify-center transition-colors shrink-0 rounded-r-xl cursor-pointer
                        hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                      `}
                      title={isWorkspaceOpen ? "Collapse List" : "Expand List"}
                    >
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isWorkspaceOpen ? 'rotate-180' : ''}`} />
                      </motion.div>
                    </button>
                  </>
                )}
              </div>
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
                  <div className="px-3 pt-1 pb-3 flex flex-col shrink-0">
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
                                    setWorkspaces(prev => Array.isArray(prev) ? [...prev, newWS] : [newWS]);
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
                                    setWorkspaces(prev => Array.isArray(prev) ? [...prev, newWS] : [newWS]);
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
                                ? 'border-[var(--accent)]/20 bg-[var(--accent)]/5 shadow-sm'
                                : 'border-[var(--border)]/20 bg-[var(--bg)]/50'
                                } ${expandedWorkspaceId === workspace.id ? 'rounded-2xl' : 'rounded-xl'}`}
                            >
                              <div className="w-full flex items-center overflow-hidden gap-1 p-0.5">
                                {/* Workspace Selection Part (85% Width) */}
                                <button
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      if (selectedWorkspace?.id !== workspace.id) {
                                        await workspaceService.setActiveWorkspace(userId || 6, workspace.id);
                                        resetConnectorState();
                                        agentService.reset();
                                        setSelectedWorkspace(workspace);
                                        localStorage.setItem('DAgent_session_id', workspace.session_id);
                                        setWorkflowKey(prev => typeof prev === 'number' ? prev + 1 : prev);
                                      }
                                    } catch (err) {
                                      console.error('Failed to set active workspace:', err);
                                    }
                                  }}
                                  className={`w-[85%] text-left py-1.5 px-3 flex items-center gap-2 cursor-pointer transition-colors rounded-l-xl
                                     ${selectedWorkspace?.id === workspace.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                                     hover:bg-[var(--surface-hover)]
                                   `}
                                >
                                  <span className={`text-[11px] font-bold truncate ${selectedWorkspace?.id === workspace.id ? 'text-[var(--accent)]' : ''}`}>
                                    {workspace.workspace_name}
                                  </span>
                                </button>

                                <div className="h-6 w-px bg-[var(--border)] shrink-0" />

                                {/* Expansion Toggle Part (15% Width) */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fetchWorkspaceHistory(workspace.id, workspace.session_id);
                                  }}
                                  className={`w-[15%] py-1.5 px-3 flex items-center justify-center transition-colors shrink-0 rounded-r-xl cursor-pointer
                                     ${expandedWorkspaceId === workspace.id ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
                                     hover:bg-[var(--surface-hover)]
                                   `}
                                  title={expandedWorkspaceId === workspace.id ? "Collapse History" : "Expand History"}
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedWorkspaceId === workspace.id ? 'rotate-180 text-[var(--accent)]' : 'opacity-40'}`} />
                                </button>
                              </div>

                              {/* Workspace History Items */}
                              <AnimatePresence>
                                {expandedWorkspaceId === workspace.id && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="px-1 pt-1 pb-3 overflow-hidden flex flex-col min-h-0"
                                  >
                                    <div className="px-1 mb-3">
                                      <button
                                        onClick={() => {
                                          setInitialChatMessage(undefined);
                                          setActiveTab('chat');
                                          setChatKey((prev: number) => prev + 1);
                                        }}
                                        className="w-full flex items-center gap-2 p-2 rounded-lg  text-[var(--text-secondary)]  transition-all text-[11px] font-bold bg-[var(--accent)]/10 cursor-pointer"
                                      >
                                        New Query
                                      </button>
                                    </div>
                                    {/* Query History Label */}
                                    <div className="px-2 mb-2 flex items-center justify-between">
                                      <span className="text-[10px] font-bold tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                                        Query History
                                      </span>
                                    </div>

                                    {/* Search - Replicating original design */}
                                    <div className="relative mb-2 shrink-0 px-1">
                                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-secondary)]" />
                                      <input
                                        type="text"
                                        placeholder="Search queries..."
                                        value={historySearch}
                                        onChange={e => setHistorySearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-1.5 text-[11px] rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/40"
                                      />
                                    </div>

                                    <div className="space-y-1.5 overflow-y-auto max-h-[300px] custom-scrollbar px-1">
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
                                            <p className="text-[10px] text-[var(--text-secondary)]">No history</p>
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
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
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
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-rose-500/10 text-[var(--text-secondary)] hover:text-rose-500 transition-colors duration-200"
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
  );
};
