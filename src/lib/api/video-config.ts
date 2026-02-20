import { api } from "../axios";

// Supported languages for transcription (matches Deepgram)
export const SUPPORTED_LANGUAGES = {
  auto: "Auto-detect (Multilingual)",
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  nl: "Dutch",
  ja: "Japanese",
  ko: "Korean",
  zh: "Chinese",
  ru: "Russian",
  ar: "Arabic",
  hi: "Hindi",
} as const;

export type SupportedLanguageCode = keyof typeof SUPPORTED_LANGUAGES;

export interface VideoConfigInput {
  skipClipping?: boolean;
  clipModel?: "ClipBasic" | "ClipPro";
  genre?: "Auto" | "Podcast" | "Gaming" | "Education" | "Entertainment";
  clipDurationMin?: number;
  clipDurationMax?: number;
  timeframeStart?: number;
  timeframeEnd?: number | null;
  // Language Settings
  language?: SupportedLanguageCode | null; // null or 'auto' = auto-detect
  enableAutoHook?: boolean;
  clipType?: string;
  customPrompt?: string;
  topicKeywords?: string[];
  captionTemplateId?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  enableWatermark?: boolean;
  // Editing Options
  enableCaptions?: boolean;
  enableEmojis?: boolean;
  enableIntroTitle?: boolean;
  // Split-Screen Options
  enableSplitScreen?: boolean;
  splitScreenBgVideoId?: string | null;
  splitScreenBgCategoryId?: string | null;
  splitRatio?: number;
}

export interface VideoConfig extends VideoConfigInput {
  id: string;
  videoId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoConfigResponse {
  config: VideoConfig | null;
  video: {
    id: string;
    title: string | null;
    duration: number | null;
    status: string;
    sourceUrl: string | null;
  };
}

export interface ConfigureResponse {
  message: string;
  video: {
    id: string;
    status: string;
  };
  config: VideoConfig;
}

export interface CaptionTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  style: {
    fontFamily: string;
    fontSize: number;
    textColor: string;
    backgroundColor?: string;
    backgroundOpacity: number;
    position: "top" | "center" | "bottom";
    alignment: "left" | "center" | "right";
    animation: "none" | "word-by-word" | "karaoke" | "bounce" | "fade";
    highlightColor?: string;
    highlightEnabled: boolean;
    shadow: boolean;
    outline: boolean;
    outlineColor?: string;
    outlineWidth?: number;
    highlightScale?: number;
    textTransform?: "none" | "uppercase";
    wordsPerLine?: number;
    glowEnabled?: boolean;
    glowColor?: string;
    glowIntensity?: number;
  };
  preview: string;
  previewThumbnail?: string;
  isNew?: boolean;
}

export const videoConfigApi = {
  /**
   * Get video configuration
   */
  getConfig: async (videoId: string): Promise<VideoConfigResponse> => {
    const response = await api.get<VideoConfigResponse>(`/api/videos/${videoId}/config`);
    return response.data;
  },

  /**
   * Save configuration and start processing
   */
  configure: async (videoId: string, config: VideoConfigInput): Promise<ConfigureResponse> => {
    const response = await api.post<ConfigureResponse>(`/api/videos/${videoId}/configure`, config);
    return response.data;
  },

  /**
   * Update configuration without starting processing
   */
  updateConfig: async (videoId: string, config: Partial<VideoConfigInput>): Promise<{ config: VideoConfig }> => {
    const response = await api.patch<{ config: VideoConfig }>(`/api/videos/${videoId}/config`, config);
    return response.data;
  },

  /**
   * Get all caption templates
   */
  getCaptionTemplates: async (): Promise<CaptionTemplate[]> => {
    const response = await api.get<{ success: boolean; data: { templates: CaptionTemplate[]; total: number } }>("/api/caption-templates");
    return response.data.data.templates;
  },
};

// Default configuration values
export const DEFAULT_VIDEO_CONFIG: VideoConfigInput = {
  skipClipping: false,
  clipModel: "ClipBasic",
  genre: "Auto",
  clipDurationMin: 0,
  clipDurationMax: 0,
  timeframeStart: 0,
  timeframeEnd: null,
  language: "auto", // Auto-detect by default
  enableAutoHook: true,
  clipType: "viral-clips",
  customPrompt: "",
  topicKeywords: [],
  captionTemplateId: "classic",
  aspectRatio: "9:16",
  enableWatermark: true,
  // Editing Options
  enableCaptions: true,
  enableEmojis: false,
  enableIntroTitle: false,
  // Split-Screen Options
  enableSplitScreen: false,
  splitScreenBgVideoId: null,
  splitScreenBgCategoryId: null,
  splitRatio: 50,
};
