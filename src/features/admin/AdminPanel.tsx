import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Layout, ShieldAlert, Check, X, Search, Loader2 } from 'lucide-react';
import { adminService } from '../../services/admin.service';
import { AdminUser, AdminTab } from './types';
import { workspaceService, Workspace } from '../../services/workspace.service';
import { useAuthContext } from '../../context/AuthContext';
import { MangeUser } from './components/MangeUsers';
import { MangeWorkspace } from './components/MangeWorkspaces';
import { AssignWorkspace } from './components/AssignWorkspaces';
import { WorkspaceUsers } from './components/WorkspaceUsers';



export const AdminPanel: React.FC = () => {
    const { userId } = useAuthContext();
    const [activeTab, setActiveTab] = useState<AdminTab>('users');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data State
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [newWorkspaceName, setNewWorkspaceName] = useState('');

    // Assignment State
    const [selectedUserIdsForAssignment, setSelectedUserIdsForAssignment] = useState<number[]>([]);
    const [selectedWorkspaceForAssignment, setSelectedWorkspaceForAssignment] = useState<number | null>(null);
    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            if (activeTab === 'users' || activeTab === 'assignUsers') {
                const usersResponse = await adminService.getUsers();
                if (usersResponse?.users) {
                    setUsers(usersResponse.users);
                } else {
                
                    setUsers([
                        { id: 1, name: 'Admin User', email: 'admin@d-agent.ai', role: 'admin' },
                        { id: 2, name: 'John Doe', email: 'john@example.com', role: 'user' },
                        { id: 3, name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
                    ]);
                }
            }

            if (activeTab === 'workspaces' || activeTab === 'assignUsers' || activeTab === 'workspaceUsers') {
                // Try getting all workspaces if admin API exists
                try {
                    const wsResponse = await adminService.getAllWorkspaces(userId || 6);
                    if (wsResponse?.workspaces) {
                        setWorkspaces(wsResponse.workspaces);
                    }
                } catch (e) {
              
                    console.log("Admin workspaces endpoint not found, fetching user workspaces", e);
                    const wsFallbackResponse = await workspaceService.getWorkspaces(userId || 6);
                    if (wsFallbackResponse?.workspaces) {
                        setWorkspaces(wsFallbackResponse.workspaces);
                    }
                }
            }
        } catch (err: any) {
            console.error('Failed to fetch admin data:', err);
            setError(err.message || 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateWorkspace = async () => {
        if (!newWorkspaceName.trim()) return;
        setIsLoading(true);
        try {
     
            const response = await adminService.createWorkspace(userId || 6, newWorkspaceName.trim());
            if (response) {
                await fetchData(); // Refresh list
                setNewWorkspaceName('');
                setIsCreatingWorkspace(false);
            }
        } catch (err: any) {
            console.error('Failed to create workspace:', err);
            setError(err.message || 'Failed to create workspace');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAssignWorkspace = async () => {
        if (selectedUserIdsForAssignment.length === 0 || !selectedWorkspaceForAssignment) return;
        setIsAssigning(true);
        setError(null);
        try {
          
            await adminService.assignWorkspaceUsers(
                userId || 14, 
                selectedWorkspaceForAssignment,
                selectedUserIdsForAssignment
            );
            
            // clear selections
            setSelectedUserIdsForAssignment([]);
            setSelectedWorkspaceForAssignment(null);
            
         
        } catch (err: any) {
            console.error('Failed to assign workspace:', err);
            
        } finally {
            setIsAssigning(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredWorkspaces = workspaces.filter(w =>
        w.workspace_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const tabDisplayNames: Record<AdminTab, string> = {
        users: 'Users',
        workspaces: 'Workspaces',
        assignUsers: 'Assignments',
        workspaceUsers: 'Workspace Users'
    };

    return (
        <div className="flex flex-col h-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="shrink-0 p-6 border-b border-[var(--border)] bg-[var(--bg)]/50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                        <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-[var(--text-primary)]">Admin Panel</h1>
                        <p className="text-sm text-[var(--text-secondary)]">Manage users, workspaces, and assign workspaces to users.</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)] px-6 shrink-0 bg-[var(--bg)]/30">
                {(['users', 'workspaces', 'assignUsers', 'workspaceUsers'] as AdminTab[]).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            setSearchQuery('');
                            setError(null);
                        }}
                        className={`
                            px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize flex items-center gap-2
                            ${activeTab === tab
                                ? 'border-[var(--accent)] text-[var(--accent)]'
                                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]'
                            }
                        `}
                    >
                        {tab === 'users' && <Users className="w-4 h-4" />}
                        {tab === 'workspaces' && <Layout className="w-4 h-4" />}
                        {tab === 'assignUsers' && <ShieldAlert className="w-4 h-4" />}
                        {tab === 'workspaceUsers' && <Layout className="w-4 h-4" />}
                        {tab === 'assignUsers' ? 'Assign Users' : (tab === 'workspaceUsers' ? 'Workspace Users' : tab)}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--bg)]">
                {/* Search & Actions Bar */}
                <div className="shrink-0 p-4 border-b border-[var(--border)] flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder={`Search ${tabDisplayNames[activeTab]}...`}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                    </div>

                    {activeTab === 'users' && (
                        <button
                            onClick={() => setIsCreatingUser(true)}
                            className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2"
                        >
                            <Users className="w-4 h-4" />
                            Add User
                        </button>
                    )}

                    {activeTab === 'workspaces' && (
                        <button
                            onClick={() => setIsCreatingWorkspace(true)}
                            className="px-4 py-2 text-sm font-medium rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors flex items-center gap-2"
                        >
                            <Layout className="w-4 h-4" />
                            Create Workspace
                        </button>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="m-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-2 max-w-3xl">
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto hover:text-rose-600"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {isLoading ? (
                        <div className="h-full flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="w-full"
                            >
                                {activeTab === 'users' && (
                                    <MangeUser 
                                        users={users} 
                                        searchQuery={searchQuery} 
                                        onRefresh={fetchData} 
                                        adminId={userId || 14}
                                        isModalOpen={isCreatingUser}
                                        setIsModalOpen={setIsCreatingUser}
                                    />
                                )}

                                {activeTab === 'workspaces' && (
                                    <MangeWorkspace
                                        workspaces={workspaces}
                                        searchQuery={searchQuery}
                                        isCreatingWorkspace={isCreatingWorkspace}
                                        setIsCreatingWorkspace={setIsCreatingWorkspace}
                                        newWorkspaceName={newWorkspaceName}
                                        setNewWorkspaceName={setNewWorkspaceName}
                                        handleCreateWorkspace={handleCreateWorkspace}
                                        isLoading={isLoading}
                                    />
                                )}

                                {activeTab === 'assignUsers' && (
                                    <AssignWorkspace
                                        users={users}
                                        workspaces={workspaces}
                                        selectedUserIds={selectedUserIdsForAssignment}
                                        setSelectedUserIds={setSelectedUserIdsForAssignment}
                                        selectedWorkspaceForAssignment={selectedWorkspaceForAssignment}
                                        setSelectedWorkspaceForAssignment={setSelectedWorkspaceForAssignment}
                                        isAssigning={isAssigning}
                                        handleAssignWorkspace={handleAssignWorkspace}
                                    />
                                )}

                                {activeTab === 'workspaceUsers' && (
                                    <WorkspaceUsers 
                                        workspaces={filteredWorkspaces} 
                                        searchQuery={searchQuery}
                                    />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>
            </div>
        </div>
    );
};
