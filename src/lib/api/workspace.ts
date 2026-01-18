import { api } from "../axios";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo?: string | null;
  ownerId?: string;
  role: "owner" | "admin" | "member";
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: "owner" | "admin" | "member";
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export const workspaceApi = {
  // Get all workspaces for current user
  getAll: async () => {
    const response = await api.get<Workspace[]>("/api/workspaces");
    return response.data;
  },

  // Get workspace by ID
  getById: async (id: string) => {
    const response = await api.get<Workspace>(`/api/workspaces/${id}`);
    return response.data;
  },

  // Get workspace by slug
  getBySlug: async (slug: string) => {
    const response = await api.get<Workspace>(`/api/workspaces/slug/${slug}`);
    return response.data;
  },

  // Create workspace
  create: async (data: { name: string; slug: string; description?: string }) => {
    const response = await api.post<Workspace>("/api/workspaces", data);
    return response.data;
  },

  // Update workspace
  update: async (id: string, data: Partial<Workspace>) => {
    const response = await api.put<Workspace>(`/api/workspaces/${id}`, data);
    return response.data;
  },

  // Update workspace by slug
  updateBySlug: async (slug: string, data: Partial<Workspace>) => {
    const response = await api.put<Workspace>(`/api/workspaces/slug/${slug}`, data);
    return response.data;
  },

  // Delete workspace
  delete: async (id: string) => {
    const response = await api.delete(`/api/workspaces/${id}`);
    return response.data;
  },

  // Get workspace members
  getMembers: async (id: string) => {
    const response = await api.get<WorkspaceMember[]>(`/api/workspaces/${id}/members`);
    return response.data;
  },

  // Add workspace member
  addMember: async (id: string, data: { userId: string; role: string }) => {
    const response = await api.post<WorkspaceMember>(`/api/workspaces/${id}/members`, data);
    return response.data;
  },

  // Check slug availability
  checkSlug: async (slug: string) => {
    const response = await api.get<{ available: boolean; slug: string }>(`/api/workspaces/slug/${slug}/check`);
    return response.data;
  },

  // Upload workspace logo
  uploadLogo: async (slug: string, logo: string) => {
    const response = await api.post<{ success: boolean; logo: string }>(`/api/workspaces/slug/${slug}/logo`, { logo });
    return response.data;
  },

  // Delete workspace logo
  deleteLogo: async (slug: string) => {
    const response = await api.delete(`/api/workspaces/slug/${slug}/logo`);
    return response.data;
  },

  // Delete workspace by slug
  deleteBySlug: async (slug: string) => {
    const response = await api.delete(`/api/workspaces/slug/${slug}`);
    return response.data;
  },
};
