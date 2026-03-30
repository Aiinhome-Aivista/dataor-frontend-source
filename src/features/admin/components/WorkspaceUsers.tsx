import React, { useState, useEffect } from 'react';
import { Layout, Users, Loader2, Search } from 'lucide-react';
import { Workspace } from '../../../services/workspace.service';
import { AdminUser } from '../types';
import { adminService } from '../../../services/admin.service';

interface WorkspaceUsersProps {
    workspaces: Workspace[];
    searchQuery: string;
}

export const WorkspaceUsers: React.FC<WorkspaceUsersProps> = ({ workspaces, searchQuery }) => {
    const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null);
    const [workspaceUsers, setWorkspaceUsers] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (selectedWorkspaceId) {
            fetchWorkspaceUsers(selectedWorkspaceId);
        } else {
            setWorkspaceUsers([]);
        }
    }, [selectedWorkspaceId]);

    const fetchWorkspaceUsers = async (workspaceId: number) => {
        setIsLoading(true);
        try {
            const response = await adminService.getWorkspaceUsers(workspaceId);
            if (response?.assigned_users) {
                setWorkspaceUsers(response.assigned_users);
            }
        } catch (err) {
            console.error('Failed to fetch workspace users:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredUsers = workspaceUsers.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm">
                <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Select Workspace to view Users</label>
                <div className="relative max-w-md">
                    <select
                        value={selectedWorkspaceId || ''}
                        onChange={(e) => setSelectedWorkspaceId(Number(e.target.value) || null)}
                        className="w-full pl-4 pr-10 py-3 appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                    >
                        <option value="" disabled>-- Select a workspace --</option>
                        {workspaces.map(w => (
                            <option key={w.id} value={w.id}>{w.workspace_name}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                        <Layout className="w-4 h-4" />
                    </div>
                </div>
            </div>

            {selectedWorkspaceId && (
                <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-[var(--border)] bg-[var(--bg)]/30 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[var(--accent)]">
                            <Users className="w-4 h-4" />
                            <span className="text-sm font-semibold">Workspace Members</span>
                        </div>
                        <div className="text-xs font-medium text-[var(--text-secondary)]">
                            {filteredUsers.length} Users found
                        </div>
                    </div>

                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg)]/10 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-tight">
                        <div className="col-span-1">ID</div>
                        <div className="col-span-4">Name</div>
                        <div className="col-span-4">Email</div>
                        <div className="col-span-3">Assigned At</div>
                    </div>

                    <div className="divide-y divide-[var(--border)] min-h-[100px] bg-[var(--surface)]">
                        {isLoading ? (
                            <div className="p-12 flex flex-col items-center justify-center gap-3">
                                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                                <span className="text-sm text-[var(--text-secondary)]">Fetching users...</span>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="p-12 text-center text-[var(--text-secondary)]">
                                {searchQuery ? 'No users match your search.' : 'No users found for this workspace.'}
                            </div>
                        ) : (
                            filteredUsers.map(user => {
                                const formatDateTime = (dateStr?: string) => {
                                    if (!dateStr) return 'N/A';
                                    try {
                                        const date = new Date(dateStr);
                                        const d = String(date.getDate()).padStart(2, '0');
                                        const m = String(date.getMonth() + 1).padStart(2, '0');
                                        const y = String(date.getFullYear()).slice(-2);
                                        const hours = String(date.getHours()).padStart(2, '0');
                                        const minutes = String(date.getMinutes()).padStart(2, '0');
                                        return `${d}/${m}/${y} ${hours}:${minutes}`;
                                    } catch (e) {
                                        return dateStr;
                                    }
                                };

                                return (
                                    <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[var(--surface-hover)] transition-colors text-sm">
                                        <div className="col-span-1 text-[var(--text-secondary)] font-medium">{user.id}</div>
                                        <div className="col-span-4 font-medium text-[var(--text-primary)]">{user.name || 'N/A'}</div>
                                        <div className="col-span-4 text-[var(--text-secondary)]">{user.email}</div>
                                        <div className="col-span-3 text-[var(--text-secondary)] text-xs font-medium">
                                            {formatDateTime((user as any).assigned_at)}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
