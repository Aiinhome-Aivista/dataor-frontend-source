import React from 'react';
import { AdminUser } from '../types';

interface MangeUsersProps {
    users: AdminUser[];
    searchQuery: string;
}

export const MangeUser: React.FC<MangeUsersProps> = ({ users, searchQuery }) => {
    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-4 border-b border-[var(--border)] bg-[var(--bg)]/50 text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                <div className="col-span-1">ID</div>
                <div className="col-span-4">Name</div>
                <div className="col-span-4">Email</div>
                <div className="col-span-3">Created At</div>
            </div>
            <div className="divide-y divide-[var(--border)]">
                {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-[var(--text-secondary)]">No users found.</div>
                ) : (
                    filteredUsers.map(user => (
                        <div key={user.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-[var(--surface-hover)] transition-colors text-sm">
                            <div className="col-span-1 text-[var(--text-secondary)] font-medium">{user.id}</div>
                            <div className="col-span-4 font-medium text-[var(--text-primary)]">{user.name}</div>
                            <div className="col-span-4 text-[var(--text-secondary)]">{user.email}</div>
                            <div className="col-span-3 text-[var(--text-secondary)] text-xs">
                                {user.created_at ? (() => {
                                    const date = new Date(user.created_at);
                                    const d = String(date.getDate()).padStart(2, '0');
                                    const m = String(date.getMonth() + 1).padStart(2, '0');
                                    const y = String(date.getFullYear()).slice(-2);
                                    const hours = String(date.getHours()).padStart(2, '0');
                                    const minutes = String(date.getMinutes()).padStart(2, '0');
                                    return `${d}/${m}/${y} ${hours}:${minutes}`;
                                })() : '-'}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
