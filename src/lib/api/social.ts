import { api } from "../axios";

export interface SocialAccount {
  id: string;
  workspaceId: string;
  platform: string;
  platformAccountId: string;
  accountName: string;
  accountHandle: string | null;
  avatarUrl: string | null;
  tokenExpiresAt: string | null;
  scopes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledPost {
  id: string;
  workspaceId: string;
  clipId: string;
  socialAccountId: string;
  platform: string;
  postType: "immediate" | "scheduled" | "drip";
  status: "pending" | "posting" | "posted" | "failed" | "cancelled";
  caption: string | null;
  hashtags: string[];
  scheduledAt: string | null;
  dripGroupId: string | null;
  dripOrder: number | null;
  platformPostId: string | null;
  platformPostUrl: string | null;
  errorMessage: string | null;
  retryCount: number;
  postedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  clipTitle?: string | null;
  clipThumbnailUrl?: string | null;
}

export interface SchedulePostPayload {
  workspaceId: string;
  postType: "immediate" | "scheduled" | "drip";
  caption?: string;
  hashtags?: string[];
  // immediate / scheduled
  clipId?: string;
  socialAccountId?: string;
  scheduledAt?: string;
  // drip
  dripClips?: Array<{ clipId: string; socialAccountId: string }>;
}

export interface WorkspaceClip {
  id: string;
  title: string | null;
  thumbnailUrl: string | null;
  storageUrl: string | null;
  score: number;
  duration: number | null;
  aspectRatio: string | null;
  hooks: string[] | null;
  recommendedPlatforms: string[] | null;
}

export const socialApi = {
  listAccounts: async (workspaceId: string) => {
    const res = await api.get<SocialAccount[]>("/api/social/accounts", {
      params: { workspaceId },
    });
    return res.data;
  },

  initiateOAuth: async (platform: string, workspaceId: string) => {
    const res = await api.get<{ authUrl: string }>(
      `/api/social/accounts/${platform}/connect`,
      { params: { workspaceId } }
    );
    return res.data;
  },

  disconnectAccount: async (id: string) => {
    const res = await api.delete<{ success: boolean }>(`/api/social/accounts/${id}`);
    return res.data;
  },

  listPosts: async (workspaceId: string, filters?: { status?: string; clipId?: string }) => {
    const res = await api.get<ScheduledPost[]>("/api/social/posts", {
      params: { workspaceId, ...filters },
    });
    return res.data;
  },

  schedulePost: async (payload: SchedulePostPayload) => {
    const res = await api.post<ScheduledPost | { posts: ScheduledPost[]; dripGroupId: string }>(
      "/api/social/posts",
      payload
    );
    return res.data;
  },

  cancelPost: async (id: string) => {
    const res = await api.delete<{ success: boolean }>(`/api/social/posts/${id}`);
    return res.data;
  },

  updatePost: async (id: string, payload: { caption?: string; hashtags?: string[]; scheduledAt?: string }) => {
    const res = await api.patch<ScheduledPost>(`/api/social/posts/${id}`, payload);
    return res.data;
  },

  listWorkspaceClips: async (workspaceId: string) => {
    const res = await api.get<WorkspaceClip[]>("/api/social/clips", {
      params: { workspaceId },
    });
    return res.data;
  },
};
