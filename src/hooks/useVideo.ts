import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videoApi, type Video, type ValidateYouTubeResponse, type VideoStatusResponse } from "@/lib/api/video";

// Query keys
export const videoKeys = {
  all: ["videos"] as const,
  myVideos: () => [...videoKeys.all, "my"] as const,
  byProject: (projectId: string) => [...videoKeys.all, "project", projectId] as const,
  byId: (id: string) => [...videoKeys.all, id] as const,
  status: (id: string) => [...videoKeys.all, id, "status"] as const,
};

// Get user's videos
export function useMyVideos() {
  return useQuery({
    queryKey: videoKeys.myVideos(),
    queryFn: () => videoApi.getMyVideos(),
  });
}

// Get videos by project
export function useVideosByProject(projectId: string) {
  return useQuery({
    queryKey: videoKeys.byProject(projectId),
    queryFn: () => videoApi.getVideosByProject(projectId),
    enabled: !!projectId,
  });
}

// Get video by ID
export function useVideo(id: string) {
  return useQuery({
    queryKey: videoKeys.byId(id),
    queryFn: () => videoApi.getVideoById(id),
    enabled: !!id,
  });
}

// Get video status with polling
export function useVideoStatus(id: string, enabled = true) {
  return useQuery({
    queryKey: videoKeys.status(id),
    queryFn: () => videoApi.getVideoStatus(id),
    enabled: !!id && enabled,
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

// Validate YouTube URL
export function useValidateYouTubeUrl() {
  return useMutation({
    mutationFn: (url: string) => videoApi.validateYouTubeUrl(url),
  });
}

// Submit YouTube URL
export function useSubmitYouTubeUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ youtubeUrl, projectId }: { youtubeUrl: string; projectId?: string }) =>
      videoApi.submitYouTubeUrl(youtubeUrl, projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.myVideos() });
    },
  });
}

// Delete video
export function useDeleteVideo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => videoApi.deleteVideo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
}
