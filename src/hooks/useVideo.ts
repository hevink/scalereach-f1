import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videoApi, type VideoStatusResponse } from "@/lib/api/video";
import { toast } from "sonner";

// Query keys
export const videoKeys = {
  all: ["videos"] as const,
  myVideos: () => [...videoKeys.all, "my"] as const,
  byProject: (projectId: string) => [...videoKeys.all, "project", projectId] as const,
  byId: (id: string) => [...videoKeys.all, id] as const,
  status: (id: string) => [...videoKeys.all, id, "status"] as const,
};

/**
 * Get user's videos
 * Requirements: 30.4
 */
export function useMyVideos(enabled = true) {
  return useQuery({
    queryKey: videoKeys.myVideos(),
    queryFn: () => videoApi.getMyVideos(),
    enabled,
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
 * Get video status with polling
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
      // Stop polling when video is completed or failed
      if (data?.video.status === "completed" || data?.video.status === "failed") {
        return false;
      }
      // Poll every 3 seconds while processing
      return 3000;
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
    mutationFn: ({ youtubeUrl, projectId, workspaceSlug, config }: { 
      youtubeUrl: string; 
      projectId?: string; 
      workspaceSlug?: string;
      config?: {
        skipClipping?: boolean;
        clipModel?: string;
        genre?: string;
        clipDurationMin?: number;
        clipDurationMax?: number;
        aspectRatio?: string;
      };
    }) =>
      videoApi.submitYouTubeUrl(youtubeUrl, projectId, workspaceSlug, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.myVideos() });
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
