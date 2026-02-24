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

export interface AdminVideo {
  id: string;
  title: string | null;
  status: string;
  sourceType: string;
  sourceUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  mimeType: string | null;
  errorMessage: string | null;
  creditsUsed: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  userName: string | null;
  userEmail: string | null;
  userId: string;
  workspaceName: string | null;
  workspaceSlug: string | null;
  projectName: string | null;
  clipCount: number;
}

export interface AdminVideosResponse {
  videos: AdminVideo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminVideoDetail {
  video: AdminVideo & {
    storageKey: string | null;
    storageUrl: string | null;
    transcript: string | null;
    transcriptLanguage: string | null;
    transcriptConfidence: number | null;
    regenerationCount: number;
    minutesConsumed: number;
    metadata: any;
    projectId: string | null;
    workspaceId: string | null;
  };
  config: {
    clipModel: string;
    genre: string;
    clipDurationMin: number;
    clipDurationMax: number;
    language: string | null;
    aspectRatio: string;
    enableSplitScreen: boolean;
    splitRatio: number;
    enableCaptions: boolean;
    enableWatermark: boolean;
    enableEmojis: boolean;
    enableIntroTitle: boolean;
    captionTemplateId: string;
    clipType: string;
    customPrompt: string | null;
  } | null;
  clips: {
    total: number;
    detected: number;
    generating: number;
    ready: number;
    failed: number;
    items: Array<{
      id: string;
      title: string | null;
      score: number;
      status: string;
      duration: number | null;
      startTime: number;
      endTime: number;
      errorMessage: string | null;
    }>;
  };
}

export interface AdminVideoAnalytics {
  statusDistribution: Array<{ status: string; count: number }>;
  sourceTypeDistribution: Array<{ sourceType: string; count: number }>;
  avgProcessingTime: number;
  errorRate: number;
  dailyVideos: Array<{ date: string; total: number; completed: number; failed: number }>;
}

export interface AdminVideoFilters {
  status?: string;
  sourceType?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AdminUserVideo {
  id: string;
  title: string | null;
  status: string;
  sourceType: string;
  sourceUrl: string | null;
  duration: number | null;
  fileSize: number | null;
  errorMessage: string | null;
  creditsUsed: number;
  thumbnailUrl: string | null;
  createdAt: string;
  updatedAt: string;
  workspaceName: string | null;
  workspaceSlug: string | null;
  projectName: string | null;
  clipCount: number;
}

export interface AdminUserVideosResponse {
  videos: AdminUserVideo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminUserClip {
  id: string;
  title: string | null;
  status: string;
  viralityScore: number | null;
  startTime: number | null;
  endTime: number | null;
  duration: number | null;
  aspectRatio: string | null;
  quality: string | null;
  storageUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: string;
  videoTitle: string | null;
  videoId: string;
  workspaceName: string | null;
}

export interface AdminUserClipsResponse {
  clips: AdminUserClip[];
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

  // Video management
  getVideos: async (page = 1, limit = 20, filters: AdminVideoFilters = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (filters.status) params.set("status", filters.status);
    if (filters.sourceType) params.set("sourceType", filters.sourceType);
    if (filters.search) params.set("search", filters.search);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    const response = await api.get<AdminVideosResponse>(`/api/admin/videos?${params.toString()}`);
    return response.data;
  },

  getVideoDetail: async (videoId: string) => {
    const response = await api.get<AdminVideoDetail>(`/api/admin/videos/${videoId}`);
    return response.data;
  },

  getVideoAnalytics: async (days = 30) => {
    const response = await api.get<AdminVideoAnalytics>(`/api/admin/videos/analytics?days=${days}`);
    return response.data;
  },

  retryVideo: async (videoId: string) => {
    const response = await api.post(`/api/admin/videos/${videoId}/retry`);
    return response.data;
  },

  // User videos & clips
  getUserById: async (userId: string) => {
    const response = await api.get<AdminUser>(`/api/admin/users/${userId}`);
    return response.data;
  },

  getUserVideos: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get<AdminUserVideosResponse>(`/api/admin/users/${userId}/videos?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUserClips: async (userId: string, page = 1, limit = 20) => {
    const response = await api.get<AdminUserClipsResponse>(`/api/admin/users/${userId}/clips?page=${page}&limit=${limit}`);
    return response.data;
  },
};
