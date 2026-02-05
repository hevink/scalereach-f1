import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videoApi, type VideoStatusResponse, type Video } from "@/lib/api/video";
import { toast } from "sonner";

// Adaptive polling configuration
type VideoStatus = Video["status"];

// Base polling intervals based on video duration (in milliseconds)
function getBasePollingInterval(durationSeconds?: number | null): number {
  if (!durationSeconds) return 5000; // Default 5s if unknown

  const durationMinutes = durationSeconds / 60;

  if (durationMinutes < 10) return 5000;      // < 10 min: 5 seconds
  if (durationMinutes < 30) return 15000;     // 10-30 min: 15 seconds
  if (durationMinutes < 60) return 30000;     // 30-60 min: 30 seconds
  return 60000;                                // > 60 min: 60 seconds
}

// Stage multipliers - poll faster at start and end, slower in middle
const STAGE_MULTIPLIERS: Record<VideoStatus, number> = {
  pending: 1.0,           // Normal - waiting to start
  pending_config: 2.0,    // Slow - waiting for user
  downloading: 0.5,       // Fast - quick stage, user wants to see progress
  uploading: 1.0,         // Normal - medium duration
  transcribing: 1.5,      // Slow - longest stage
  analyzing: 0.3,         // Very fast - almost done, user is excited!
  completed: 0,           // Stop polling
  failed: 0,              // Stop polling
};

// Calculate adaptive polling interval
function calculatePollingInterval(
  status?: VideoStatus,
  durationSeconds?: number | null,
  jobProgress?: number
): number | false {
  // Stop polling for terminal states
  if (!status || status === "completed" || status === "failed") {
    return false;
  }

  const baseInterval = getBasePollingInterval(durationSeconds);
  const stageMultiplier = STAGE_MULTIPLIERS[status] || 1.0;

  // If we're close to completing current stage (>80%), poll slightly faster
  const progressMultiplier = jobProgress && jobProgress > 80 ? 0.7 : 1.0;

  const interval = Math.round(baseInterval * stageMultiplier * progressMultiplier);

  // Clamp between 3 seconds (min) and 120 seconds (max)
  const finalInterval = Math.max(3000, Math.min(interval, 120000));

  // Debug log - remove in production
  console.log(`[Adaptive Polling] Status: ${status}, Duration: ${durationSeconds}s, Progress: ${jobProgress}%, Interval: ${finalInterval / 1000}s`);

  return finalInterval;
}

// Query keys
export const videoKeys = {
  all: ["videos"] as const,
  myVideos: (workspaceId: string) => [...videoKeys.all, "my", workspaceId] as const,
  byProject: (projectId: string) => [...videoKeys.all, "project", projectId] as const,
  byId: (id: string) => [...videoKeys.all, id] as const,
  status: (id: string) => [...videoKeys.all, id, "status"] as const,
};

/**
 * Get user's videos for a workspace
 * Requirements: 30.4
 */
export function useMyVideos(workspaceId: string, enabled = true, filter?: string) {
  return useQuery({
    queryKey: [...videoKeys.myVideos(workspaceId), filter],
    queryFn: () => videoApi.getMyVideos(workspaceId, filter),
    enabled: enabled && !!workspaceId,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if ((error as any)?.status === 401 || (error as any)?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Get videos by project
 * Requirements: 30.4
 */
export function useVideosByProject(projectId: string) {
  return useQuery({
    queryKey: videoKeys.byProject(projectId),
    queryFn: () => videoApi.getVideosByProject(projectId),
    enabled: !!projectId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Get video by ID
 * Requirements: 30.4
 */
export function useVideo(id: string) {
  return useQuery({
    queryKey: videoKeys.byId(id),
    queryFn: () => videoApi.getVideoById(id),
    enabled: !!id,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Get video status with adaptive polling
 * - Polls faster for short videos, slower for long videos
 * - Polls faster at start and end stages, slower in middle
 * - Stops polling when completed or failed
 * Requirements: 30.4
 */
export function useVideoStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: videoKeys.status(id),
    queryFn: () => videoApi.getVideoStatus(id),
    enabled: !!id && enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: (query) => {
      const data = query.state.data as VideoStatusResponse | undefined;

      if (!data?.video) return 5000; // Default while loading

      return calculatePollingInterval(
        data.video.status,
        data.video.duration,
        data.job?.progress
      );
    },
  });
}

/**
 * Validate YouTube URL
 * Requirements: 30.5
 */
export function useValidateYouTubeUrl() {
  return useMutation({
    mutationFn: (url: string) => videoApi.validateYouTubeUrl(url),
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useValidateYouTubeUrl] Failed to validate URL:", {
        error,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Submit YouTube URL
 * Requirements: 30.1, 30.5
 */
export function useSubmitYouTubeUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ youtubeUrl, workspaceId, projectId, workspaceSlug, config }: {
      youtubeUrl: string;
      workspaceId: string;
      projectId?: string;
      workspaceSlug?: string;
      config?: {
        skipClipping?: boolean;
        clipModel?: "ClipBasic" | "ClipPro";
        genre?: "Auto" | "Podcast" | "Gaming" | "Education" | "Entertainment";
        clipDurationMin?: number;
        clipDurationMax?: number;
        aspectRatio?: "9:16" | "16:9" | "1:1";
      };
    }) =>
      videoApi.submitYouTubeUrl(youtubeUrl, workspaceId, projectId, workspaceSlug, config),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: videoKeys.myVideos(variables.workspaceId) });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useSubmitYouTubeUrl] Failed to submit YouTube URL:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to submit video", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Delete video
 * Requirements: 30.1, 30.5
 */
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => videoApi.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
      toast.success("Video deleted", {
        description: "The video has been deleted.",
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useDeleteVideo] Failed to delete video:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to delete video", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}
