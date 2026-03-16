import React from 'react';
import { ShieldAlert, Loader2, Check } from 'lucide-react';
import { AdminUser } from '../types';
import { Workspace } from '../../../services/workspace.service';

interface AssignWorkspaceProps {
    users: AdminUser[];
    workspaces: Workspace[];
    selectedUserIds: number[];
    setSelectedUserIds: (ids: number[]) => void;
    selectedWorkspaceForAssignment: number | null;
    setSelectedWorkspaceForAssignment: (val: number | null) => void;
    isAssigning: boolean;
    handleAssignWorkspace: () => void;
}

export const AssignWorkspace: React.FC<AssignWorkspaceProps> = ({
    users,
    workspaces,
    selectedUserIds,
    setSelectedUserIds,
    selectedWorkspaceForAssignment,
    setSelectedWorkspaceForAssignment,
    isAssigning,
    handleAssignWorkspace
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleUser = (userId: number) => {
        if (selectedUserIds.includes(userId)) {
            setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
        } else {
            setSelectedUserIds([...selectedUserIds, userId]);
        }
    };

    const getSelectedNames = () => {
        if (selectedUserIds.length === 0) return '-- Select users --';
        if (selectedUserIds.length <= 2) {
            return users
                .filter(u => selectedUserIds.includes(u.id))
                .map(u => u.email)
                .join(', ');
        }
        return `${selectedUserIds.length} users selected`;
    };
    return (
        <div className="w-full">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">

                        Assign Workspace to User
                    </h2>

                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3">Users</label>
                        <div className="relative" ref={dropdownRef}>
                            <div 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="w-full pl-4 pr-10 py-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer min-h-[50px] flex items-center"
                            >
                                <span className={selectedUserIds.length === 0 ? "text-[var(--text-secondary)]" : ""}>
                                    {getSelectedNames()}
                                </span>
                            </div>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
                                    <div className="p-2 space-y-1">
                                        {users.map(u => (
                                            <div 
                                                key={u.id}
                                                onClick={() => toggleUser(u.id)}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                                                    selectedUserIds.includes(u.id) 
                                                        ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                                                        : 'hover:bg-[var(--surface-hover)] text-[var(--text-primary)]'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                                    selectedUserIds.includes(u.id) 
                                                        ? 'bg-[var(--accent)] border-[var(--accent)]' 
                                                        : 'border-[var(--border)] bg-[var(--bg)]'
                                                }`}>
                                                    {selectedUserIds.includes(u.id) && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{u.name || 'No Name'}</span>
                                                    <span className="text-xs opacity-70">{u.email}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-[var(--text-primary)] mb-3"> Workspace</label>
                        <div className="relative">
                            <select
                                value={selectedWorkspaceForAssignment || ''}
                                onChange={(e) => setSelectedWorkspaceForAssignment(Number(e.target.value) || null)}
                                className="w-full pl-4 pr-10 py-3.5 appearance-none rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] cursor-pointer"
                            >
                                <option value="" disabled>-- Select a workspace --</option>
                                {workspaces.map(w => (
                                    <option key={w.id} value={w.id}>{w.workspace_name}</option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-[var(--border)] flex justify-end">
                    <button
                        onClick={handleAssignWorkspace}
                        disabled={selectedUserIds.length === 0 || !selectedWorkspaceForAssignment || isAssigning}
                        className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm flex items-center gap-2 text-sm"
                    >
                        {isAssigning && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirm Assign
                    </button>
                </div>
            </div>
        </div>
    );
};
