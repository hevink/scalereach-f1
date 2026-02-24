import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clipsApi,
  type ClipResponse,
  type ClipFilters,
  type UpdateClipBoundariesRequest,
} from "@/lib/api/clips";
import { videoKeys } from "./useVideo";
import { toast } from "sonner";

// Query keys following the design document pattern
export const clipKeys = {
  all: ["clips"] as const,
  byVideo: (videoId: string) => [...clipKeys.all, "video", videoId] as const,
  byId: (id: string) => [...clipKeys.all, id] as const,
};

/**
 * Check if any clips are still being generated
 */
function hasGeneratingClips(clips: ClipResponse[] | undefined): boolean {
  if (!clips) return false;
  return clips.some(clip => clip.status === "generating" || clip.status === "detected");
}

/**
 * Get clips for a video with optional filtering and sorting
 * Automatically polls every 5 seconds when clips are still generating
 * Requirements: 6.1, 7.4
 */
export function useClipsByVideo(videoId: string, filters?: Partial<ClipFilters>) {
  return useQuery({
    queryKey: [...clipKeys.byVideo(videoId), filters],
    queryFn: () => clipsApi.getClipsByVideo(videoId, filters),
    enabled: !!videoId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Poll every 5 seconds when there are clips still generating
    refetchInterval: (query) => {
      return hasGeneratingClips(query.state.data) ? 5000 : false;
    },
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}

/**
 * Get a single clip by ID
 * Requirements: 6.1
 */
export function useClip(clipId: string) {
  return useQuery({
    queryKey: clipKeys.byId(clipId),
    queryFn: () => clipsApi.getClipById(clipId),
    enabled: !!clipId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Update clip boundaries (start and end times)
 * Requirements: 10.8
 */
export function useUpdateClipBoundaries() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clipId,
      boundaries,
    }: {
      clipId: string;
      boundaries: UpdateClipBoundariesRequest;
    }) => clipsApi.updateClipBoundaries(clipId, boundaries),
    onSuccess: (data) => {
      // Update the single clip cache
      queryClient.setQueryData(clipKeys.byId(data.clip.id), data.clip);
      // Invalidate the video's clips list to refetch with updated data
      queryClient.invalidateQueries({
        queryKey: clipKeys.byVideo(data.clip.videoId),
      });
    },
  });
}

/**
 * Update clip metadata (title, introTitle)
 */
export function useUpdateClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clipId, data }: { clipId: string; data: { title?: string; introTitle?: string } }) =>
      clipsApi.updateClip(clipId, data),
    onSuccess: (updatedClip) => {
      queryClient.setQueryData(clipKeys.byId(updatedClip.id), updatedClip);
      queryClient.invalidateQueries({
        queryKey: clipKeys.byVideo(updatedClip.videoId),
      });
    },
  });
}

/**
 * Toggle favorite status of a clip with optimistic update
 * Requirements: 9.2, 30.1, 30.5
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clipId: string) => clipsApi.toggleFavorite(clipId),
    onMutate: async (clipId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: clipKeys.byId(clipId) });
      await queryClient.cancelQueries({ queryKey: clipKeys.all });

      // Snapshot the previous value — check individual cache first, then video lists
      let previousClip = queryClient.getQueryData<ClipResponse>(
        clipKeys.byId(clipId)
      );

      // If not individually cached, find it in a video clips list
      if (!previousClip) {
        const allQueries = queryClient.getQueriesData<ClipResponse[]>({ queryKey: clipKeys.all });
        for (const [, clips] of allQueries) {
          if (Array.isArray(clips)) {
            const found = clips.find((c) => c.id === clipId);
            if (found) {
              previousClip = found;
              break;
            }
          }
        }
      }

      // Optimistically update the clip in individual cache
      if (previousClip) {
        queryClient.setQueryData<ClipResponse>(clipKeys.byId(clipId), {
          ...previousClip,
          favorited: !previousClip.favorited,
        });
      }

      // Optimistically update in all video clips lists
      queryClient.setQueriesData<ClipResponse[]>(
        { queryKey: clipKeys.all, exact: false },
        (oldClips) => {
          if (!Array.isArray(oldClips)) return oldClips;
          return oldClips.map((clip) =>
            clip.id === clipId ? { ...clip, favorited: !clip.favorited } : clip
          );
        }
      );

      // Return context with the previous value for rollback
      return { previousClip };
    },
    onError: (error, clipId, context) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useToggleFavorite] Failed to toggle favorite:", {
        clipId,
        error,
        timestamp: new Date().toISOString(),
      });

      // Rollback to the previous value on error
      if (context?.previousClip) {
        queryClient.setQueryData(
          clipKeys.byId(clipId),
          context.previousClip
        );

        // Rollback in all clips lists
        queryClient.setQueriesData<ClipResponse[]>(
          { queryKey: clipKeys.all, exact: false },
          (oldClips) => {
            if (!Array.isArray(oldClips)) return oldClips;
            return oldClips.map((clip) =>
              clip.id === clipId ? context.previousClip! : clip
            );
          }
        );
      }

      // Show error toast (Requirement 30.1)
      toast.error("Failed to update favorite", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
    onSettled: (_data, _error, clipId) => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: clipKeys.byId(clipId) });
    },
  });
}

/**
 * Delete a clip
 * Requirements: 6.1
 */
export function useDeleteClip() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clipId: string) => clipsApi.deleteClip(clipId),
    onSuccess: (_data, clipId) => {
      // Remove the clip from cache
      queryClient.removeQueries({ queryKey: clipKeys.byId(clipId) });
      // Invalidate all clips lists to refetch
      queryClient.invalidateQueries({ queryKey: clipKeys.all });
      // Also invalidate video queries since clip count may have changed
      queryClient.invalidateQueries({ queryKey: videoKeys.all });
    },
  });
}
