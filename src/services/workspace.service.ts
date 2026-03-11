import { apiService, IApiService } from './api.service';
import { API_ENDPOINTS } from './api.config';

export interface Workspace {
    id: number;
    session_id: string;
    workspace_name: string;
    is_active: number;
    created_at?: string;
    user_id?: number;
}

class WorkspaceService {
    private api: IApiService;

    constructor(api: IApiService) {
        this.api = api;
    }

    async createWorkspace(userId: number, name: string): Promise<any> {
        return this.api.post(API_ENDPOINTS.WORKSPACE.CREATE, {
            user_id: userId,
            workspace_name: name
        });
    }

    async getWorkspaces(userId: number): Promise<any> {
        return this.api.get(`${API_ENDPOINTS.WORKSPACE.GET_WORKSPACES}?user_id=${userId}`);
    }

    async setActiveWorkspace(userId: number, workspaceId: number): Promise<any> {
        return this.api.post(API_ENDPOINTS.WORKSPACE.SET_ACTIVE_WORKSPACE, {
            user_id: userId,
            workspace_id: workspaceId
        });
    }
}

export const workspaceService = new WorkspaceService(apiService);
