import { api } from "../axios";

export interface VideoConfigInput {
  skipClipping?: boolean;
  clipModel?: "ClipBasic" | "ClipPro";
  genre?: "Auto" | "Podcast" | "Gaming" | "Education" | "Entertainment";
  clipDurationMin?: number;
  clipDurationMax?: number;
  timeframeStart?: number;
  timeframeEnd?: number | null;
  enableAutoHook?: boolean;
  customPrompt?: string;
  topicKeywords?: string[];
  captionTemplateId?: string;
  aspectRatio?: "9:16" | "16:9" | "1:1";
  enableWatermark?: boolean;
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
    const response = await api.get<{ templates: CaptionTemplate[] }>("/api/caption-templates");
    return response.data.templates;
  },
};

// Default configuration values
export const DEFAULT_VIDEO_CONFIG: VideoConfigInput = {
  skipClipping: false,
  clipModel: "ClipBasic",
  genre: "Auto",
  clipDurationMin: 15,
  clipDurationMax: 90,
  timeframeStart: 0,
  timeframeEnd: null,
  enableAutoHook: true,
  customPrompt: "",
  topicKeywords: [],
  captionTemplateId: "karaoke",
  aspectRatio: "9:16",
  enableWatermark: true,
};
