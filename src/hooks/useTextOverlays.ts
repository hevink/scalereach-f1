import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { textOverlaysApi, type TextOverlaysResponse } from "@/lib/api/text-overlays";
import type { TextOverlay } from "@/components/text/text-overlay-panel";

export const textOverlayKeys = {
  all: ["textOverlays"] as const,
  byClip: (clipId: string) => [...textOverlayKeys.all, "clip", clipId] as const,
};

/**
 * Fetch persisted text overlays for a clip
 */
export function useTextOverlays(clipId: string) {
  return useQuery({
    queryKey: textOverlayKeys.byClip(clipId),
    queryFn: () => textOverlaysApi.getTextOverlays(clipId),
    enabled: !!clipId,
  });
}

/**
 * Mutation to save text overlays (called on explicit save)
 */
export function useUpdateTextOverlays() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clipId, overlays }: { clipId: string; overlays: TextOverlay[] }) =>
      textOverlaysApi.updateTextOverlays(clipId, overlays),
    onMutate: async ({ clipId, overlays }) => {
      await queryClient.cancelQueries({ queryKey: textOverlayKeys.byClip(clipId) });
      const previous = queryClient.getQueryData<TextOverlaysResponse>(textOverlayKeys.byClip(clipId));
      queryClient.setQueryData<TextOverlaysResponse>(textOverlayKeys.byClip(clipId), {
        clipId,
        overlays,
      });
      return { previous };
    },
    onError: (_err, { clipId }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(textOverlayKeys.byClip(clipId), context.previous);
      }
    },
    onSettled: (_data, _err, { clipId }) => {
      queryClient.invalidateQueries({ queryKey: textOverlayKeys.byClip(clipId) });
    },
  });
}
