import { api } from "../axios";

export interface DashboardStats {
  totalUsers: number;
  totalWorkspaces: number;
  totalVideos: number;
  totalClips: number;
  totalExports: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export interface UserGrowthData {
  date: string;
  users: number;
}

export interface VideoProcessingStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export interface WorkspacePlanDistribution {
  plan: string;
  count: number;
}

export interface TopWorkspace {
  id: string;
  name: string;
  slug: string;
  videoCount: number;
  clipCount: number;
  memberCount: number;
}

export interface DailyActivityData {
  date: string;
  videos: number;
  clips: number;
  exports: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  image?: string;
  role?: string;
  emailVerified: boolean;
  isOnboarded: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminWorkspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  plan?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RecentActivity {
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
  recentVideos: Array<{
    id: string;
    title?: string;
    status: string;
    createdAt: string;
  }>;
  recentWorkspaces: Array<{
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  }>;
}

export interface SystemHealth {
  queueStats: {
    videoQueue: { waiting: number; active: number; completed: number; failed: number };
    clipQueue: { waiting: number; active: number; completed: number; failed: number };
  };
  processingTimes: {
    avgTranscriptionTime: number;
    avgClipGenerationTime: number;
  };
  errorRate: number;
  uptime: number;
}

export interface CreditAnalytics {
  totalCreditsUsed: number;
  totalCreditsAdded: number;
  creditsByDay: Array<{ date: string; used: number; added: number }>;
  topCreditUsers: Array<{ userId: string; name: string; email: string; creditsUsed: number }>;
}

export interface CreditTransaction {
  id: string;
  workspaceId: string;
  workspaceName?: string;
  amount: number;
  description?: string;
  createdAt: string;
}

export interface CreditTransactionsResponse {
  transactions: CreditTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const adminApi = {
  // Dashboard stats
  getStats: async () => {
    const response = await api.get<DashboardStats>("/api/admin/stats");
    return response.data;
  },

  // Analytics
  getUserGrowth: async (days = 30) => {
    const response = await api.get<UserGrowthData[]>(`/api/admin/analytics/user-growth?days=${days}`);
    return response.data;
  },

  getVideoProcessingStats: async () => {
    const response = await api.get<VideoProcessingStats>("/api/admin/analytics/video-processing");
    return response.data;
  },

  getWorkspacePlanDistribution: async () => {
    const response = await api.get<WorkspacePlanDistribution[]>("/api/admin/analytics/workspace-plans");
    return response.data;
  },

  getTopWorkspaces: async (limit = 10) => {
    const response = await api.get<TopWorkspace[]>(`/api/admin/analytics/top-workspaces?limit=${limit}`);
    return response.data;
  },

  getDailyActivity: async (days = 30) => {
    const response = await api.get<DailyActivityData[]>(`/api/admin/analytics/daily-activity?days=${days}`);
    return response.data;
  },

  // Activity feed
  getRecentActivity: async (limit = 20) => {
    const response = await api.get<RecentActivity>(`/api/admin/activity?limit=${limit}`);
    return response.data;
  },

  // User management
  getUsers: async (page = 1, limit = 20) => {
    const response = await api.get<{ users: AdminUser[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/admin/users?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  updateUserRole: async (userId: string, role: "user" | "admin") => {
    const response = await api.put<AdminUser>(`/api/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId: string) => {
    const response = await api.delete(`/api/admin/users/${userId}`);
    return response.data;
  },

  // Workspace management
  getWorkspaces: async (page = 1, limit = 20) => {
    const response = await api.get<{ workspaces: AdminWorkspace[]; total: number; page: number; limit: number; totalPages: number }>(
      `/api/admin/workspaces?page=${page}&limit=${limit}`
    );
    return response.data;
  },

  // System health
  getSystemHealth: async () => {
    const response = await api.get<SystemHealth>("/api/admin/system-health");
    return response.data;
  },

  // Credit analytics
  getCreditAnalytics: async (days = 30) => {
    const response = await api.get<CreditAnalytics>(`/api/admin/analytics/credits?days=${days}`);
    return response.data;
  },

  // Credit transactions
  getCreditTransactions: async (page = 1, limit = 50) => {
    const response = await api.get<CreditTransactionsResponse>(
      `/api/admin/transactions?page=${page}&limit=${limit}`
    );
    return response.data;
  },
};
