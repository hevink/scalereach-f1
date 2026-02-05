import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  captionsApi,
  type CaptionStyle,
  type ClipCaptionsResponse,
  type CaptionWord,
} from "@/lib/api/captions";

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
    queryFn: () => captionsApi.getClipCaptions(clipId),
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
      templateId,
    }: {
      clipId: string;
      style: Partial<CaptionStyle>;
      templateId?: string;
    }) => captionsApi.updateCaptionStyle(clipId, style as CaptionStyle, templateId),
    onMutate: async ({ clipId, style, templateId }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: captionKeys.byClip(clipId) });

      // Snapshot the previous value
      const previousCaptions = queryClient.getQueryData<ClipCaptionsResponse>(
        captionKeys.byClip(clipId)
      );

      // Optimistically update the caption style
      if (previousCaptions) {
        queryClient.setQueryData<ClipCaptionsResponse>(captionKeys.byClip(clipId), {
          ...previousCaptions,
          style: previousCaptions.style
            ? {
                ...previousCaptions.style,
                ...style,
              }
            : (style as CaptionStyle),
          templateId: templateId ?? previousCaptions.templateId,
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
    onSettled: (_data, _error, { clipId }) => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({ queryKey: captionKeys.byClip(clipId) });
    },
  });
}

/**
 * Update caption words for a clip (bulk update)
 * This is used when user edits caption text - we update all words at once
 * Requirements: 16.5
 */
export function useUpdateCaptionWords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clipId,
      words,
    }: {
      clipId: string;
      words: CaptionWord[];
    }) => captionsApi.updateCaptionWords(clipId, words),
    onMutate: async ({ clipId, words }) => {
      await queryClient.cancelQueries({ queryKey: captionKeys.byClip(clipId) });

      const previousCaptions = queryClient.getQueryData<ClipCaptionsResponse>(
        captionKeys.byClip(clipId)
      );

      if (previousCaptions) {
        queryClient.setQueryData<ClipCaptionsResponse>(captionKeys.byClip(clipId), {
          ...previousCaptions,
          words,
        });
      }

      return { previousCaptions };
    },
    onError: (_error, { clipId }, context) => {
      if (context?.previousCaptions) {
        queryClient.setQueryData(
          captionKeys.byClip(clipId),
          context.previousCaptions
        );
      }
    },
    onSettled: (_data, _error, { clipId }) => {
      queryClient.invalidateQueries({ queryKey: captionKeys.byClip(clipId) });
    },
  });
}

/**
 * Update caption text for a specific caption segment
 * This converts the segment text edit to word-level updates
 * Requirements: 16.5
 */
export function useUpdateCaptionText() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clipId,
      captionId,
      text,
    }: {
      clipId: string;
      captionId: string;
      text: string;
    }) => {
      // Get current caption data
      const currentData = queryClient.getQueryData<ClipCaptionsResponse>(
        captionKeys.byClip(clipId)
      );

      if (!currentData?.words) {
        throw new Error("No caption data available");
      }

      // Parse the segment ID to find which words belong to this segment
      // Segment IDs are like "caption-0", "caption-1", etc.
      const segmentIndex = parseInt(captionId.replace("caption-", ""), 10);
      if (isNaN(segmentIndex)) {
        throw new Error("Invalid caption segment ID");
      }

      // Group words into segments (same logic as in the page component - max 5 words per line)
      const segments: { startIdx: number; endIdx: number; words: CaptionWord[] }[] = [];
      let currentWords: CaptionWord[] = [];
      let startIdx = 0;

      for (let i = 0; i < currentData.words.length; i++) {
        currentWords.push(currentData.words[i]);

        // Match backend: max 5 words per line, or break on sentence-ending punctuation
        if (/[.!?]$/.test(currentData.words[i].word) || currentWords.length >= 5 || i === currentData.words.length - 1) {
          segments.push({
            startIdx,
            endIdx: i,
            words: [...currentWords],
          });
          startIdx = i + 1;
          currentWords = [];
        }
      }

      // Find the segment being edited
      const segment = segments[segmentIndex];
      if (!segment) {
        throw new Error("Segment not found");
      }

      // Parse the new text into words
      const newWords = text.trim().split(/\s+/).filter(w => w.length > 0);
      if (newWords.length === 0) {
        throw new Error("Cannot have empty caption");
      }

      // Calculate timing for new words
      // Distribute the segment's time range evenly across the new words
      const segmentStart = segment.words[0].start;
      const segmentEnd = segment.words[segment.words.length - 1].end;
      const totalDuration = segmentEnd - segmentStart;
      const wordDuration = totalDuration / newWords.length;

      const updatedSegmentWords: CaptionWord[] = newWords.map((word, idx) => ({
        id: segment.words[idx]?.id || `word-${Date.now()}-${idx}`,
        word,
        start: Number((segmentStart + idx * wordDuration).toFixed(3)),
        end: Number((segmentStart + (idx + 1) * wordDuration).toFixed(3)),
      }));

      // Build the new words array
      const allWords: CaptionWord[] = [
        ...currentData.words.slice(0, segment.startIdx),
        ...updatedSegmentWords,
        ...currentData.words.slice(segment.endIdx + 1),
      ];

      // Call the bulk update API
      return captionsApi.updateCaptionWords(clipId, allWords);
    },
    onMutate: async ({ clipId }) => {
      await queryClient.cancelQueries({ queryKey: captionKeys.byClip(clipId) });

      const previousCaptions = queryClient.getQueryData<ClipCaptionsResponse>(
        captionKeys.byClip(clipId)
      );

      return { previousCaptions };
    },
    onError: (_error, { clipId }, context) => {
      if (context?.previousCaptions) {
        queryClient.setQueryData(
          captionKeys.byClip(clipId),
          context.previousCaptions
        );
      }
    },
    onSettled: (_data, _error, { clipId }) => {
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
