"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, AdminVideoFilters } from "@/lib/api/admin";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.getStats,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUserGrowth(days = 30) {
  return useQuery({
    queryKey: ["admin", "user-growth", days],
    queryFn: () => adminApi.getUserGrowth(days),
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useVideoProcessingStats() {
  return useQuery({
    queryKey: ["admin", "video-processing"],
    queryFn: adminApi.getVideoProcessingStats,
    staleTime: 30 * 1000,
  });
}

export function useWorkspacePlanDistribution() {
  return useQuery({
    queryKey: ["admin", "workspace-plans"],
    queryFn: adminApi.getWorkspacePlanDistribution,
    staleTime: 60 * 1000,
  });
}

export function useTopWorkspaces(limit = 10) {
  return useQuery({
    queryKey: ["admin", "top-workspaces", limit],
    queryFn: () => adminApi.getTopWorkspaces(limit),
    staleTime: 60 * 1000,
  });
}

export function useDailyActivity(days = 30) {
  return useQuery({
    queryKey: ["admin", "daily-activity", days],
    queryFn: () => adminApi.getDailyActivity(days),
    staleTime: 60 * 1000,
  });
}

export function useRecentActivity(limit = 20) {
  return useQuery({
    queryKey: ["admin", "recent-activity", limit],
    queryFn: () => adminApi.getRecentActivity(limit),
    staleTime: 30 * 1000,
  });
}

export function useAdminUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["admin", "users", page, limit],
    queryFn: () => adminApi.getUsers(page, limit),
    staleTime: 30 * 1000,
  });
}

export function useAdminWorkspaces(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["admin", "workspaces", page, limit],
    queryFn: () => adminApi.getWorkspaces(page, limit),
    staleTime: 30 * 1000,
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "user" | "admin" }) =>
      adminApi.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ["admin", "system-health"],
    queryFn: adminApi.getSystemHealth,
    staleTime: 10 * 1000, // 10 seconds - refresh more frequently
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}

export function useCreditAnalytics(days = 30) {
  return useQuery({
    queryKey: ["admin", "credit-analytics", days],
    queryFn: () => adminApi.getCreditAnalytics(days),
    staleTime: 60 * 1000,
  });
}

export function useCreditTransactions(page = 1, limit = 50) {
  return useQuery({
    queryKey: ["admin", "credit-transactions", page, limit],
    queryFn: () => adminApi.getCreditTransactions(page, limit),
    staleTime: 30 * 1000,
  });
}

export function useAdminVideos(page = 1, limit = 20, filters: AdminVideoFilters = {}) {
  return useQuery({
    queryKey: ["admin", "videos", page, limit, filters],
    queryFn: () => adminApi.getVideos(page, limit, filters),
    staleTime: 30 * 1000,
  });
}

export function useAdminVideoDetail(videoId: string | null) {
  return useQuery({
    queryKey: ["admin", "video-detail", videoId],
    queryFn: () => adminApi.getVideoDetail(videoId!),
    staleTime: 15 * 1000,
    enabled: !!videoId,
  });
}

export function useAdminVideoAnalytics(days = 30) {
  return useQuery({
    queryKey: ["admin", "video-analytics", days],
    queryFn: () => adminApi.getVideoAnalytics(days),
    staleTime: 60 * 1000,
  });
}

export function useRetryVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoId: string) => adminApi.retryVideo(videoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "videos"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "video-detail"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "video-analytics"] });
    },
  });
}

export function useAdminUserVideos(userId: string | null, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["admin", "user-videos", userId, page, limit],
    queryFn: () => adminApi.getUserVideos(userId!, page, limit),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useAdminUserClips(userId: string | null, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["admin", "user-clips", userId, page, limit],
    queryFn: () => adminApi.getUserClips(userId!, page, limit),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}
