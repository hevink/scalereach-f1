import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  captionsApi,
  type CaptionTemplate,
  type CaptionsResponse,
  type CaptionStyle,
  type Caption,
  type UpdateCaptionStyleRequest,
  type UpdateCaptionTextRequest,
} from "@/lib/api/captions";
import { clipKeys } from "./useClips";

// Query keys following the design document pattern
export const captionKeys = {
  all: ["captions"] as const,
  byClip: (clipId: string) => [...captionKeys.all, "clip", clipId] as const,
  templates: () => [...captionKeys.all, "templates"] as const,
};

/**
 * Get all available caption templates
 * Requirements: 12.1
 */
export function useCaptionTemplates() {
  return useQuery({
    queryKey: captionKeys.templates(),
    queryFn: () => captionsApi.getCaptionTemplates(),
    staleTime: 5 * 60 * 1000, // Templates don't change often, cache for 5 minutes
  });
}

/**
 * Get captions and style for a clip
 * Requirements: 12.1, 16.5
 */
export function useCaptionStyle(clipId: string) {
  return useQuery({
    queryKey: captionKeys.byClip(clipId),
    queryFn: () => captionsApi.getCaptionsByClip(clipId),
    enabled: !!clipId,
  });
}

/**
 * Update caption style for a clip
 * Requirements: 12.4, 13.8
 */
export function useUpdateCaptionStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clipId,
      style,
    }: {
      clipId: string;
      style: Partial<CaptionStyle>;
    }) => captionsApi.updateCaptionStyle(clipId, { style }),
    onMutate: async ({ clipId, style }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: captionKeys.byClip(clipId) });

      // Snapshot the previous value
      const previousCaptions = queryClient.getQueryData<CaptionsResponse>(
        captionKeys.byClip(clipId)
      );

      // Optimistically update the caption style
      if (previousCaptions) {
        queryClient.setQueryData<CaptionsResponse>(captionKeys.byClip(clipId), {
          ...previousCaptions,
          style: previousCaptions.style
            ? {
                ...previousCaptions.style,
                config: {
                  ...previousCaptions.style.config,
                  ...style,
                },
                updatedAt: new Date().toISOString(),
              }
            : null,
        });
      }

      // Return context with the previous value for rollback
      return { previousCaptions };
    },
    onError: (_error, { clipId }, context) => {
      // Rollback to the previous value on error
      if (context?.previousCaptions) {
        queryClient.setQueryData(
          captionKeys.byClip(clipId),
          context.previousCaptions
        );
      }
    },
    onSuccess: (data, { clipId }) => {
      // Update the cache with the server response
      queryClient.setQueryData<CaptionsResponse>(
        captionKeys.byClip(clipId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            style: data.style,
          };
        }
      );
    },
    onSettled: (_data, _error, { clipId }) => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: captionKeys.byClip(clipId) });
    },
  });
}

/**
 * Update caption text for a specific caption segment
 * Requirements: 16.5
 */
export function useUpdateCaptionText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clipId,
      captionId,
      text,
    }: {
      clipId: string;
      captionId: string;
      text: string;
    }) => captionsApi.updateCaptionText(clipId, { captionId, text }),
    onMutate: async ({ clipId, captionId, text }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: captionKeys.byClip(clipId) });

      // Snapshot the previous value
      const previousCaptions = queryClient.getQueryData<CaptionsResponse>(
        captionKeys.byClip(clipId)
      );

      // Optimistically update the caption text
      if (previousCaptions) {
        queryClient.setQueryData<CaptionsResponse>(captionKeys.byClip(clipId), {
          ...previousCaptions,
          captions: previousCaptions.captions.map((caption) =>
            caption.id === captionId ? { ...caption, text } : caption
          ),
        });
      }

      // Return context with the previous value for rollback
      return { previousCaptions };
    },
    onError: (_error, { clipId }, context) => {
      // Rollback to the previous value on error
      if (context?.previousCaptions) {
        queryClient.setQueryData(
          captionKeys.byClip(clipId),
          context.previousCaptions
        );
      }
    },
    onSuccess: (data, { clipId }) => {
      // Update the cache with the server response
      queryClient.setQueryData<CaptionsResponse>(
        captionKeys.byClip(clipId),
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            captions: oldData.captions.map((caption) =>
              caption.id === data.caption.id ? data.caption : caption
            ),
          };
        }
      );
    },
    onSettled: (_data, _error, { clipId }) => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: captionKeys.byClip(clipId) });
    },
  });
}

// Re-export types for convenience
export type {
  CaptionTemplate,
  CaptionsResponse,
  CaptionStyle,
  Caption,
  CaptionPosition,
  TextAlignment,
  CaptionAnimation,
} from "@/lib/api/captions";
