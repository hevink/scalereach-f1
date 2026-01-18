import { api } from "../axios";

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  image?: string;
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export const userApi = {
  // Get current user
  getMe: async () => {
    const response = await api.get<User>("/api/users/me");
    return response.data;
  },

  // Update current user
  updateMe: async (data: Partial<User>) => {
    const response = await api.put<User>("/api/users/me", data);
    return response.data;
  },

  // Complete onboarding
  completeOnboarding: async () => {
    const response = await api.put<User>("/api/users/me", { isOnboarded: true });
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (image: string) => {
    const response = await api.post<{ success: boolean; image: string }>("/api/users/me/avatar", { image });
    return response.data;
  },

  // Delete avatar
  deleteAvatar: async () => {
    const response = await api.delete("/api/users/me/avatar");
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.put("/api/users/me/password", { currentPassword, newPassword });
    return response.data;
  },

  // Get preferences
  getPreferences: async () => {
    const response = await api.get("/api/users/me/preferences");
    return response.data;
  },

  // Update preferences
  updatePreferences: async (preferences: Record<string, unknown>) => {
    const response = await api.put("/api/users/me/preferences", preferences);
    return response.data;
  },

  // Get sessions
  getSessions: async () => {
    const response = await api.get("/api/users/me/sessions");
    return response.data;
  },

  // Revoke session
  revokeSession: async (sessionToken?: string) => {
    const response = await api.delete("/api/users/me/sessions", { data: { sessionToken } });
    return response.data;
  },

  // Check email availability
  checkEmail: async (email: string) => {
    const response = await api.get<{ available: boolean }>(`/api/email/check?email=${encodeURIComponent(email)}`);
    return response.data;
  },
};
