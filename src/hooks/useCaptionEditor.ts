"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { captionsApi, CaptionWord, CaptionStyle, ClipCaptionsResponse } from "@/lib/api/captions";
import { useUndoRedo } from "./useUndoRedo";

export const captionEditorKeys = {
  captions: (clipId: string) => ["clip-captions", clipId] as const,
};

interface CaptionEditorState {
  words: CaptionWord[];
  style: CaptionStyle | null;
  templateId: string | null;
}

export function useCaptionEditor(clipId: string) {
  const queryClient = useQueryClient();
  const [isDirty, setIsDirty] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch captions
  const { data, isLoading, error } = useQuery({
    queryKey: captionEditorKeys.captions(clipId),
    queryFn: () => captionsApi.getClipCaptions(clipId),
    enabled: !!clipId,
  });

  // Undo/redo for words
  const {
    state: editorState,
    setState: setEditorState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  } = useUndoRedo<CaptionEditorState>({
    initialState: {
      words: [],
      style: null,
      templateId: null,
    },
  });

  // Sync fetched data to editor state
  useEffect(() => {
    if (data) {
      setEditorState({
        words: data.words,
        style: data.style,
        templateId: data.templateId,
      });
      clearHistory();
    }
  }, [data]);

  // Save mutations
  const updateWordsMutation = useMutation({
    mutationFn: (words: CaptionWord[]) => captionsApi.updateCaptionWords(clipId, words),
    onSuccess: (response) => {
      queryClient.setQueryData(captionEditorKeys.captions(clipId), response);
      setIsDirty(false);
    },
  });

  const updateStyleMutation = useMutation({
    mutationFn: ({ style, templateId }: { style: CaptionStyle; templateId?: string }) =>
      captionsApi.updateCaptionStyle(clipId, style, templateId),
    onSuccess: (response) => {
      queryClient.setQueryData(captionEditorKeys.captions(clipId), response);
    },
  });

  const resetMutation = useMutation({
    mutationFn: (resetStyle?: boolean) => captionsApi.resetCaptions(clipId, resetStyle),
    onSuccess: (response) => {
      queryClient.setQueryData(captionEditorKeys.captions(clipId), response);
      setEditorState({
        words: response.words,
        style: response.style,
        templateId: response.templateId,
      });
      clearHistory();
      setIsDirty(false);
    },
  });

  // Debounced auto-save
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (isDirty && editorState.words.length > 0) {
        updateWordsMutation.mutate(editorState.words);
      }
    }, 2000);
  }, [isDirty, editorState.words]);

  // Word operations
  const updateWord = useCallback(
    (wordId: string, updates: Partial<Pick<CaptionWord, "word" | "start" | "end">>) => {
      const newWords = editorState.words.map((w) =>
        w.id === wordId ? { ...w, ...updates } : w
      );
      setEditorState({ ...editorState, words: newWords });
      setIsDirty(true);
      scheduleAutoSave();
    },
    [editorState, setEditorState, scheduleAutoSave]
  );

  const addWord = useCallback(
    (word: string, start: number, end: number, afterWordId?: string) => {
      const newWord: CaptionWord = {
        id: `temp-${Date.now()}`,
        word,
        start,
        end,
      };

      let newWords: CaptionWord[];
      if (afterWordId) {
        const idx = editorState.words.findIndex((w) => w.id === afterWordId);
        newWords = [...editorState.words];
        newWords.splice(idx + 1, 0, newWord);
      } else {
        const idx = editorState.words.findIndex((w) => w.start > start);
        if (idx >= 0) {
          newWords = [...editorState.words];
          newWords.splice(idx, 0, newWord);
        } else {
          newWords = [...editorState.words, newWord];
        }
      }

      setEditorState({ ...editorState, words: newWords });
      setIsDirty(true);
      scheduleAutoSave();
    },
    [editorState, setEditorState, scheduleAutoSave]
  );

  const removeWord = useCallback(
    (wordId: string) => {
      const newWords = editorState.words.filter((w) => w.id !== wordId);
      setEditorState({ ...editorState, words: newWords });
      setIsDirty(true);
      scheduleAutoSave();
    },
    [editorState, setEditorState, scheduleAutoSave]
  );

  // Style operations
  const updateStyle = useCallback(
    (style: Partial<CaptionStyle>) => {
      const newStyle = editorState.style ? { ...editorState.style, ...style } : null;
      setEditorState({ ...editorState, style: newStyle });
      if (newStyle) {
        updateStyleMutation.mutate({ style: newStyle, templateId: editorState.templateId ?? undefined });
      }
    },
    [editorState, setEditorState, updateStyleMutation]
  );

  const applyTemplate = useCallback(
    (templateId: string, style: CaptionStyle) => {
      setEditorState({ ...editorState, style, templateId });
      updateStyleMutation.mutate({ style, templateId });
    },
    [editorState, setEditorState, updateStyleMutation]
  );

  // Actions
  const save = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await updateWordsMutation.mutateAsync(editorState.words);
  }, [editorState.words, updateWordsMutation]);

  const reset = useCallback(
    async (resetStyle?: boolean) => {
      await resetMutation.mutateAsync(resetStyle);
    },
    [resetMutation]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    // Data
    words: editorState.words,
    style: editorState.style,
    templateId: editorState.templateId,
    isEdited: data?.isEdited ?? false,
    isDirty,
    isLoading,
    isSaving: updateWordsMutation.isPending || updateStyleMutation.isPending,
    error,

    // Word operations
    updateWord,
    addWord,
    removeWord,

    // Style operations
    updateStyle,
    applyTemplate,

    // Actions
    save,
    reset,
    undo,
    redo,
    canUndo,
    canRedo,
  };
}
