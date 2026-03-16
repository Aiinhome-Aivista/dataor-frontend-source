import { apiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface AdminUser {
    id: number;
    name?: string | null;
    email: string;
    role?: string;
    created_at?: string;
}

export const adminService = {
    getUsers: async (): Promise<any> => {
        return apiService.get(API_ENDPOINTS.USERS.GET_USERS);
    },

    getAllWorkspaces: async (userId: number): Promise<any> => {
        return apiService.get(`${API_ENDPOINTS.WORKSPACE.GET_WORKSPACES}?user_id=${userId}`);
    },

    assignWorkspace: async (userId: number, workspaceId: number): Promise<any> => {
        return apiService.post('/admin/assign-workspace', {
            user_id: userId,
            workspace_id: workspaceId
        });
    },

    assignWorkspaceUsers: async (adminId: number, workspaceId: number, userIds: number[]): Promise<any> => {
        return apiService.post(API_ENDPOINTS.WORKSPACE.ASSIGN_WORKSPACE_USERS, {
            admin_id: adminId,
            workspace_id: workspaceId,
            user_ids: userIds
        });
    },

    createWorkspace: async (userId: number, workspaceName: string): Promise<any> => {
        return apiService.post(API_ENDPOINTS.WORKSPACE.CREATE, {
            user_id: userId,
            workspace_name: workspaceName
        });
    },

    getWorkspaceUsers: async (workspaceId: number): Promise<any> => {
        return apiService.post(API_ENDPOINTS.WORKSPACE.WORKSPACE_USERS, {
            workspace_id: workspaceId
        });
    }
};
