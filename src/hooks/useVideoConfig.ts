"use client";

import { useState, useCallback, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { videoConfigApi, DEFAULT_VIDEO_CONFIG, type VideoConfigInput, type CaptionTemplate } from "@/lib/api/video-config";
import { toast } from "sonner";

const LOCAL_STORAGE_KEY = "video-config-draft";

interface UseVideoConfigOptions {
  videoId: string;
  onConfigureSuccess?: () => void;
}

export function useVideoConfig({ videoId, onConfigureSuccess }: UseVideoConfigOptions) {
  const queryClient = useQueryClient();
  const [config, setConfigState] = useState<VideoConfigInput>(DEFAULT_VIDEO_CONFIG);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch existing config
  const { data: configData, isLoading: isLoadingConfig } = useQuery({
    queryKey: ["video-config", videoId],
    queryFn: () => videoConfigApi.getConfig(videoId),
    enabled: !!videoId,
  });

  // Fetch caption templates
  const { data: templates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ["caption-templates"],
    queryFn: videoConfigApi.getCaptionTemplates,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Initialize config from server or localStorage
  useEffect(() => {
    if (configData?.config) {
      setConfigState({
        skipClipping: configData.config.skipClipping ?? DEFAULT_VIDEO_CONFIG.skipClipping,
        clipModel: configData.config.clipModel ?? DEFAULT_VIDEO_CONFIG.clipModel,
        genre: configData.config.genre ?? DEFAULT_VIDEO_CONFIG.genre,
        clipDurationMin: configData.config.clipDurationMin ?? DEFAULT_VIDEO_CONFIG.clipDurationMin,
        clipDurationMax: configData.config.clipDurationMax ?? DEFAULT_VIDEO_CONFIG.clipDurationMax,
        timeframeStart: configData.config.timeframeStart ?? DEFAULT_VIDEO_CONFIG.timeframeStart,
        timeframeEnd: configData.config.timeframeEnd ?? DEFAULT_VIDEO_CONFIG.timeframeEnd,
        enableAutoHook: configData.config.enableAutoHook ?? DEFAULT_VIDEO_CONFIG.enableAutoHook,
        customPrompt: configData.config.customPrompt ?? DEFAULT_VIDEO_CONFIG.customPrompt,
        topicKeywords: configData.config.topicKeywords ?? DEFAULT_VIDEO_CONFIG.topicKeywords,
        captionTemplateId: configData.config.captionTemplateId ?? DEFAULT_VIDEO_CONFIG.captionTemplateId,
        aspectRatio: configData.config.aspectRatio ?? DEFAULT_VIDEO_CONFIG.aspectRatio,
        enableWatermark: configData.config.enableWatermark ?? DEFAULT_VIDEO_CONFIG.enableWatermark,
      });
    } else {
      // Try to load from localStorage
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}-${videoId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setConfigState({ ...DEFAULT_VIDEO_CONFIG, ...parsed });
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [configData, videoId]);

  // Save to localStorage on change
  useEffect(() => {
    if (isDirty) {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}-${videoId}`, JSON.stringify(config));
    }
  }, [config, isDirty, videoId]);

  // Configure mutation (save and start processing)
  const configureMutation = useMutation({
    mutationFn: (configInput: VideoConfigInput) => videoConfigApi.configure(videoId, configInput),
    onSuccess: () => {
      // Clear localStorage draft
      localStorage.removeItem(`${LOCAL_STORAGE_KEY}-${videoId}`);
      queryClient.invalidateQueries({ queryKey: ["video-config", videoId] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      toast.success("Processing started", {
        description: "Your video is now being processed with the selected settings.",
      });
      onConfigureSuccess?.();
    },
    onError: (error: Error) => {
      toast.error("Failed to start processing", {
        description: error.message,
      });
    },
  });

  // Update config mutation (without starting processing)
  const updateMutation = useMutation({
    mutationFn: (configInput: Partial<VideoConfigInput>) => videoConfigApi.updateConfig(videoId, configInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-config", videoId] });
    },
  });

  const setConfig = useCallback((updates: Partial<VideoConfigInput>) => {
    setConfigState((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  const resetToDefaults = useCallback(() => {
    setConfigState(DEFAULT_VIDEO_CONFIG);
    setIsDirty(true);
  }, []);

  const saveConfig = useCallback(async () => {
    await configureMutation.mutateAsync(config);
  }, [config, configureMutation]);

  const saveAsDefault = useCallback(() => {
    localStorage.setItem("video-config-defaults", JSON.stringify(config));
    toast.success("Settings saved as default", {
      description: "These settings will be used for future videos.",
    });
  }, [config]);

  return {
    config,
    setConfig,
    video: configData?.video ?? null,
    templates,
    isLoading: isLoadingConfig || isLoadingTemplates,
    isSaving: configureMutation.isPending,
    isDirty,
    saveConfig,
    saveAsDefault,
    resetToDefaults,
  };
}

export function useCaptionTemplates() {
  return useQuery({
    queryKey: ["caption-templates"],
    queryFn: videoConfigApi.getCaptionTemplates,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
