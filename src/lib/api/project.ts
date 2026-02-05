import { api } from "../axios";
import { Video } from "./video";

// Types based on design document

export type ProjectStatus = "draft" | "active" | "completed" | "archived";

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  videoCount: number;
  clipCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdBy: string;
  videoCount: number;
  clipCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithVideosResponse extends ProjectResponse {
  videos: Video[];
  videoCount: number;
  clipCount: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateProjectResponse {
  message: string;
  project: ProjectResponse;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface UpdateProjectResponse {
  message: string;
  project: ProjectResponse;
}

export interface DeleteProjectResponse {
  message: string;
}

export interface ProjectsListResponse {
  projects: ProjectResponse[];
}

export const projectApi = {
  /**
   * Get all projects for a workspace
   * Requirements: 25.1
   */
  getProjects: async (workspaceId: string): Promise<ProjectResponse[]> => {
    const response = await api.get<ProjectResponse[]>(
      `/api/projects/workspace/${workspaceId}`
    );
    return response.data;
  },

  /**
   * Get a single project by ID with videos
   * Requirements: 26.1
   */
  getProjectById: async (projectId: string): Promise<ProjectWithVideosResponse> => {
    const response = await api.get<ProjectWithVideosResponse>(
      `/api/projects/${projectId}/full`
    );
    return response.data;
  },

  /**
   * Create a new project in a workspace
   * Requirements: 25.4
   */
  createProject: async (
    workspaceId: string,
    request: CreateProjectRequest
  ): Promise<CreateProjectResponse> => {
    const response = await api.post<CreateProjectResponse>(
      `/api/projects`,
      { ...request, workspaceId }
    );
    return response.data;
  },

  /**
   * Update an existing project
   * Requirements: 25.1
   */
  updateProject: async (
    projectId: string,
    request: UpdateProjectRequest
  ): Promise<UpdateProjectResponse> => {
    const response = await api.patch<UpdateProjectResponse>(
      `/api/projects/${projectId}`,
      request
    );
    return response.data;
  },

  /**
   * Delete a project
   * Requirements: 25.1
   */
  deleteProject: async (projectId: string): Promise<DeleteProjectResponse> => {
    const response = await api.delete<DeleteProjectResponse>(
      `/api/projects/${projectId}`
    );
    return response.data;
  },

  /**
   * Search projects by name within a workspace
   * Requirements: 25.5
   */
  searchProjects: async (
    workspaceId: string,
    query: string
  ): Promise<ProjectResponse[]> => {
    const response = await api.get<ProjectResponse[]>(
      `/api/projects/workspace/${workspaceId}`,
      {
        params: { search: query },
      }
    );
    return response.data;
  },
};
