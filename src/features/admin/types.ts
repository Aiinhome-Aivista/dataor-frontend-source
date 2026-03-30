export interface AdminUser {
    id: number;
    name?: string | null;
    email: string;
    role?: string;
    created_at?: string;
}

export type AdminTab = 'users' | 'workspaces' | 'assignUsers' | 'workspaceUsers';
