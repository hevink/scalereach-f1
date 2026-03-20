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
      queryClient.invalidateQueries({ queryKey: ["admin", "failed"] });
    },
  });
}

export function useRetryClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clipId: string) => adminApi.retryClip(clipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "failed"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "user-clips"] });
    },
  });
}

export function useFailedItems(page = 1) {
  return useQuery({
    queryKey: ["admin", "failed", page],
    queryFn: () => adminApi.getFailedItems(page, 50),
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useAdminUserById(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "user-by-id", userId],
    queryFn: () => adminApi.getUserById(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useAdminUserWorkspaces(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "user-workspaces", userId],
    queryFn: () => adminApi.getUserWorkspaces(userId!),
    enabled: !!userId,
    staleTime: 60 * 1000,
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

export function useYouTubeHealth() {
  return useQuery({
    queryKey: ["admin", "youtube-health"],
    queryFn: adminApi.getYouTubeHealth,
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export function useTestYouTubeCookie() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (url: string) => adminApi.testYouTubeCookie(url),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "youtube-health"] });
    },
  });
}

export function useTestBurstYouTube() {
  return useMutation({
    mutationFn: (url: string) => adminApi.testBurstYouTube(url),
  });
}

export function useWorkerStatus() {
  return useQuery({
    queryKey: ["admin", "worker-status"],
    queryFn: adminApi.getWorkerStatus,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useEC2Status() {
  return useQuery({
    queryKey: ["admin", "ec2-status"],
    queryFn: adminApi.getEC2Status,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });
}

export function useControlEC2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, action }: { instanceId: string; action: "start" | "stop" }) =>
      adminApi.controlEC2Instance(instanceId, action),
    onSuccess: () => {
      // Refetch EC2 status after control action
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin", "ec2-status"] }), 2000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin", "ec2-status"] }), 5000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin", "ec2-status"] }), 10000);
    },
  });
}

export function useBurstWorkerStatus() {
  return useQuery({
    queryKey: ["admin", "burst-status"],
    queryFn: adminApi.getBurstWorkerStatus,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useScalerState() {
  return useQuery({
    queryKey: ["admin", "scaler-state"],
    queryFn: adminApi.getScalerState,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
  });
}

export function useForceScalerCheck() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.forceScalerCheck(),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["admin", "scaler-state"] });
        queryClient.invalidateQueries({ queryKey: ["admin", "ec2-status"] });
      }, 2000);
    },
  });
}

export function useBurstLogs() {
  return useQuery({
    queryKey: ["admin", "burst-logs"],
    queryFn: adminApi.getBurstLogs,
    staleTime: 30 * 1000,
  });
}

export function useSyncBurstLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => adminApi.syncBurstLogs(),
    onSuccess: () => {
      // Refetch logs after a delay to give the scaler time to sync
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin", "burst-logs"] }), 10000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin", "burst-logs"] }), 20000);
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ["admin", "burst-logs"] }), 35000);
    },
  });
}

export function useBurstLogContent(key: string | null) {
  return useQuery({
    queryKey: ["admin", "burst-log-content", key],
    queryFn: () => adminApi.getBurstLogContent(key!),
    enabled: !!key,
    staleTime: 60 * 1000,
  });
}

export function useBurstLogsLive(type: "out" | "error", enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "burst-logs-live", type],
    queryFn: () => adminApi.getBurstLogsLive(type),
    enabled,
    staleTime: 10 * 1000,
    refetchInterval: enabled ? 15 * 1000 : false,
  });
}

export function useWorkerLogsLive(type: "out" | "err" | "both", lines: number, enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "worker-logs-live", type, lines],
    queryFn: () => adminApi.getWorkerLogsLive(type, lines),
    enabled,
    staleTime: 10 * 1000,
    refetchInterval: enabled ? 15 * 1000 : false,
    retry: 2,
    retryDelay: 3000,
  });
}

export function useAdminAffiliates() {
  return useQuery({
    queryKey: ["admin", "affiliates"],
    queryFn: adminApi.getAffiliateOverview,
    staleTime: 30 * 1000,
  });
}

export function useAdminAffiliateReferrals(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "affiliate-referrals", userId],
    queryFn: () => adminApi.getAffiliateReferrals(userId!),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useMarkCommissionPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commissionId: string) => adminApi.markCommissionPaid(commissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliates"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "affiliate-referrals"] });
    },
  });
}

export function useQueueAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ queue, action }: { queue: string; action: string }) =>
      adminApi.queueAction(queue, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "worker-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "burst-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "system-health"] });
    },
  });
}
