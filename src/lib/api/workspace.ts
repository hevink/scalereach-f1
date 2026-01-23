import { api } from "../axios";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo?: string | null;
  plan?: "free" | "pro" | "agency";
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
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface WorkspaceInvitation {
  id: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "declined" | "expired";
  expiresAt: string;
  createdAt: string;
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface InvitationDetails {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  workspace: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
  };
  inviter: {
    name: string;
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

  // Update member role
  updateMemberRole: async (workspaceId: string, memberId: string, role: string) => {
    const response = await api.put<WorkspaceMember>(`/api/workspaces/${workspaceId}/members/${memberId}`, { role });
    return response.data;
  },

  // Remove member
  removeMember: async (workspaceId: string, memberId: string) => {
    const response = await api.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
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

  // === Invitation APIs ===

  // Get workspace invitations
  getInvitations: async (workspaceId: string) => {
    const response = await api.get<WorkspaceInvitation[]>(`/api/workspaces/${workspaceId}/invitations`);
    return response.data;
  },

  // Create invitation
  createInvitation: async (workspaceId: string, data: { email: string; role: string }) => {
    const response = await api.post<WorkspaceInvitation>(`/api/workspaces/${workspaceId}/invitations`, data);
    return response.data;
  },

  // Cancel invitation
  cancelInvitation: async (workspaceId: string, invitationId: string) => {
    const response = await api.delete(`/api/workspaces/${workspaceId}/invitations/${invitationId}`);
    return response.data;
  },

  // Resend invitation
  resendInvitation: async (workspaceId: string, invitationId: string) => {
    const response = await api.post(`/api/workspaces/${workspaceId}/invitations/${invitationId}/resend`);
    return response.data;
  },

  // Get invitation link token
  getInvitationLink: async (workspaceId: string, invitationId: string) => {
    const response = await api.get<{ token: string }>(`/api/workspaces/${workspaceId}/invitations/${invitationId}/link`);
    return response.data;
  },

  // Get invitation by token (public)
  getInvitationByToken: async (token: string) => {
    const response = await api.get<InvitationDetails>(`/api/invitations/${token}`);
    return response.data;
  },

  // Accept invitation
  acceptInvitation: async (token: string) => {
    const response = await api.post<{ message: string; workspace: { id: string; name: string; slug: string } }>(`/api/invitations/${token}/accept`);
    return response.data;
  },

  // Decline invitation
  declineInvitation: async (token: string) => {
    const response = await api.post<{ message: string }>(`/api/invitations/${token}/decline`);
    return response.data;
  },
};
