import React from 'react';
import { Layout } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Workspace } from '../../../services/workspace.service';

interface MangeWorkspaceProps {
    workspaces: Workspace[];
    searchQuery: string;
    isCreatingWorkspace: boolean;
    setIsCreatingWorkspace: (val: boolean) => void;
    newWorkspaceName: string;
    setNewWorkspaceName: (val: string) => void;
    handleCreateWorkspace: () => void;
    isLoading: boolean;
}

export const MangeWorkspace: React.FC<MangeWorkspaceProps> = ({
    workspaces,
    searchQuery,
    isCreatingWorkspace,
    setIsCreatingWorkspace,
    newWorkspaceName,
    setNewWorkspaceName,
    handleCreateWorkspace,
    isLoading
}) => {
    const filteredWorkspaces = workspaces.filter(w => 
        w.workspace_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Create Workspace Form Inline */}
            <AnimatePresence>
                {isCreatingWorkspace && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 border border-[var(--border)] rounded-2xl bg-[var(--surface)] mb-6 flex gap-3 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 ml-1">Workspace Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Enter new workspace name..."
                                    value={newWorkspaceName}
                                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                                />
                            </div>
                            <button 
                                onClick={handleCreateWorkspace}
                                disabled={!newWorkspaceName.trim() || isLoading}
                                className="px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 transition-colors disabled:opacity-50 font-medium h-[46px]"
                            >
                                Create
                            </button>
                            <button 
                                onClick={() => {
                                    setIsCreatingWorkspace(false);
                                    setNewWorkspaceName('');
                                }}
                                className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors h-[46px]"
                            >
                                Cancel
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg)]/50 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    <div className="col-span-2">ID</div>
                    <div className="col-span-5">Workspace Name</div>
                    <div className="col-span-5">Session/WorkSpace ID</div>
                </div>
                <div className="divide-y divide-[var(--border)]">
                    {filteredWorkspaces.length === 0 ? (
                        <div className="p-8 text-center text-[var(--text-secondary)]">No workspaces found.</div>
                    ) : (
                        filteredWorkspaces.map(ws => (
                            <div key={ws.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[var(--surface-hover)] transition-colors text-sm">
                                <div className="col-span-2 text-[var(--text-secondary)] font-medium">{ws.id}</div>
                                <div className="col-span-5  text-[var(--text-primary)] flex items-center gap-2">
                             
                                    {ws.workspace_name}
                                </div>
                                <div className="col-span-5 font-mono text-[11px] text-[var(--text-secondary)] bg-[var(--bg)] px-2 py-1 rounded truncate w-max max-w-[200px]" title={ws.session_id}>
                                    {ws.session_id}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
