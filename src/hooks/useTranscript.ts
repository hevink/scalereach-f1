import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useReducer } from "react";
import {
  transcriptApi,
  type TranscriptSegment,
  type UpdateTranscriptTextRequest,
  type UpdateWordTimingRequest,
} from "@/lib/api/transcript";
import {
  preserveWordTiming,
  needsTimingRecalculation,
} from "@/lib/word-timing-preservation";

// Query keys following the design document pattern
export const transcriptKeys = {
  all: ["transcripts"] as const,
  byVideo: (videoId: string) => [...transcriptKeys.all, "video", videoId] as const,
};

/**
 * Get transcript for a video
 * Requirements: 4.1
 */
export function useTranscript(videoId: string) {
  return useQuery({
    queryKey: transcriptKeys.byVideo(videoId),
    queryFn: () => transcriptApi.getTranscript(videoId),
    enabled: !!videoId,
  });
}

/**
 * Update transcript text for a segment
 * Requirements: 5.4
 */
export function useUpdateTranscript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      videoId,
      request,
    }: {
      videoId: string;
      request: UpdateTranscriptTextRequest;
    }) => transcriptApi.updateTranscriptText(videoId, request),
    onSuccess: (data, variables) => {
      // Update the transcript cache with the updated segment
      queryClient.setQueryData(
        transcriptKeys.byVideo(variables.videoId),
        (oldData: Awaited<ReturnType<typeof transcriptApi.getTranscript>> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            segments: oldData.segments.map((segment) =>
              segment.id === data.segment.id ? data.segment : segment
            ),
          };
        }
      );
    },
  });
}

/**
 * Update word timing within a transcript segment
 * Requirements: 5.4
 */
export function useUpdateWordTiming() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      videoId,
      request,
    }: {
      videoId: string;
      request: UpdateWordTimingRequest;
    }) => transcriptApi.updateWordTiming(videoId, request),
    onSuccess: (data, variables) => {
      // Update the transcript cache with the updated segment
      queryClient.setQueryData(
        transcriptKeys.byVideo(variables.videoId),
        (oldData: Awaited<ReturnType<typeof transcriptApi.getTranscript>> | undefined) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            segments: oldData.segments.map((segment) =>
              segment.id === data.segment.id ? data.segment : segment
            ),
          };
        }
      );
    },
  });
}

// ============================================================================
// Undo/Redo State Management
// Requirements: 5.5
// ============================================================================

/**
 * Undo/Redo state structure following the design document
 */
export interface UndoableState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Transcript edit state for undo/redo
 */
export interface TranscriptEditState {
  past: TranscriptSegment[][];
  present: TranscriptSegment[];
  future: TranscriptSegment[][];
}

type UndoRedoAction<T> =
  | { type: "SET"; payload: T }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; payload: T };

function undoRedoReducer<T>(
  state: UndoableState<T>,
  action: UndoRedoAction<T>
): UndoableState<T> {
  switch (action.type) {
    case "SET": {
      // Don't add to history if the value is the same
      if (JSON.stringify(state.present) === JSON.stringify(action.payload)) {
        return state;
      }
      return {
        past: [...state.past, state.present],
        present: action.payload,
        future: [], // Clear future on new action
      };
    }
    case "UNDO": {
      if (state.past.length === 0) {
        return state;
      }
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, -1);
      return {
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }
    case "REDO": {
      if (state.future.length === 0) {
        return state;
      }
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }
    case "RESET": {
      return {
        past: [],
        present: action.payload,
        future: [],
      };
    }
    default:
      return state;
  }
}

/**
 * Generic hook for undo/redo state management
 * Can be used with any type of data
 */
export function useUndoRedo<T>(initialValue: T) {
  const [state, dispatch] = useReducer(undoRedoReducer<T>, {
    past: [],
    present: initialValue,
    future: [],
  });

  const set = useCallback((value: T) => {
    dispatch({ type: "SET", payload: value });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: "UNDO" });
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: "REDO" });
  }, []);

  const reset = useCallback((value: T) => {
    dispatch({ type: "RESET", payload: value });
  }, []);

  return {
    state: state.present,
    past: state.past,
    future: state.future,
    set,
    undo,
    redo,
    reset,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}

/**
 * Specialized hook for transcript editing with undo/redo
 * Combines the transcript query with local undo/redo state
 * Requirements: 4.1, 5.4, 5.5
 */
export function useTranscriptEditor(videoId: string) {
  const transcriptQuery = useTranscript(videoId);
  const updateTranscriptMutation = useUpdateTranscript();
  const updateWordTimingMutation = useUpdateWordTiming();

  // Initialize undo/redo state with empty array, will be updated when data loads
  const undoRedo = useUndoRedo<TranscriptSegment[]>([]);

  // Sync local state with server data when it changes
  const syncWithServer = useCallback(
    (segments: TranscriptSegment[]) => {
      undoRedo.reset(segments);
    },
    [undoRedo]
  );

  // Update a segment's text locally (for undo/redo)
  // Preserves word-level timing when text is modified
  // @validates Requirements 6.4 - Preserve word-level timing information when text is modified
  const updateSegmentText = useCallback(
    (segmentId: string, text: string) => {
      const newSegments = undoRedo.state.map((segment) => {
        if (segment.id !== segmentId) return segment;

        // Check if we need to recalculate word timing
        if (needsTimingRecalculation(segment.text, text)) {
          // Preserve word timing using smart matching algorithm
          const preservedWords = preserveWordTiming(
            segment.words,
            text,
            segment.startTime,
            segment.endTime
          );

          return {
            ...segment,
            text,
            words: preservedWords,
          };
        }

        // Text is essentially the same, just update the text
        return { ...segment, text };
      });
      undoRedo.set(newSegments);
    },
    [undoRedo]
  );

  // Update word timing locally (for undo/redo)
  const updateWordTimingLocal = useCallback(
    (segmentId: string, wordIndex: number, start: number, end: number) => {
      const newSegments = undoRedo.state.map((segment) => {
        if (segment.id !== segmentId) return segment;
        const newWords = segment.words.map((word, index) =>
          index === wordIndex ? { ...word, start, end } : word
        );
        return { ...segment, words: newWords };
      });
      undoRedo.set(newSegments);
    },
    [undoRedo]
  );

  // Save transcript text to server
  const saveTranscriptText = useCallback(
    async (segmentId: string, text: string) => {
      return updateTranscriptMutation.mutateAsync({
        videoId,
        request: { segmentId, text },
      });
    },
    [videoId, updateTranscriptMutation]
  );

  // Save word timing to server
  const saveWordTiming = useCallback(
    async (segmentId: string, wordIndex: number, start: number, end: number) => {
      return updateWordTimingMutation.mutateAsync({
        videoId,
        request: { segmentId, wordIndex, start, end },
      });
    },
    [videoId, updateWordTimingMutation]
  );

  return {
    // Query state
    transcript: transcriptQuery.data,
    isLoading: transcriptQuery.isLoading,
    isError: transcriptQuery.isError,
    error: transcriptQuery.error,
    refetch: transcriptQuery.refetch,

    // Local editable state with undo/redo
    segments: undoRedo.state,
    setSegments: undoRedo.set,
    syncWithServer,

    // Undo/Redo controls
    undo: undoRedo.undo,
    redo: undoRedo.redo,
    canUndo: undoRedo.canUndo,
    canRedo: undoRedo.canRedo,

    // Local edit functions (for undo/redo)
    updateSegmentText,
    updateWordTimingLocal,

    // Server persistence functions
    saveTranscriptText,
    saveWordTiming,

    // Mutation states
    isSaving:
      updateTranscriptMutation.isPending || updateWordTimingMutation.isPending,
    saveError:
      updateTranscriptMutation.error || updateWordTimingMutation.error,
  };
}

/**
 * Validates that word timing is valid (start < end and both non-negative)
 * Requirements: 5.3
 */
export function validateWordTiming(start: number, end: number): boolean {
  return start >= 0 && end >= 0 && start < end;
}
