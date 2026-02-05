import { api } from "../axios";

// Types based on design document

export type CaptionPosition = "top" | "center" | "bottom";
export type TextAlignment = "left" | "center" | "right";
export type CaptionAnimation = "none" | "word-by-word" | "karaoke" | "bounce" | "fade";

export interface CaptionStyle {
  templateId?: string;
  fontFamily: string;
  fontSize: number;
  textColor: string;
  backgroundColor?: string;
  backgroundOpacity: number;
  position: CaptionPosition;
  alignment: TextAlignment;
  animation: CaptionAnimation;
  highlightColor?: string;
  highlightEnabled: boolean;
  shadow: boolean;
  outline: boolean;
  outlineColor?: string;
  // New enhanced options
  outlineWidth?: number;        // 1-8, default 3
  glowEnabled?: boolean;        // Add glow effect
  glowColor?: string;           // Glow color
  glowIntensity?: number;       // 1-5 blur strength
  highlightScale?: number;      // 100-150, default 120
  textTransform?: 'none' | 'uppercase';
  wordsPerLine?: number;        // 3-7, default 5
}

export interface CaptionTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  style: CaptionStyle;
  preview: string;
  previewThumbnail?: string;
  isNew?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CaptionWord {
  id: string;
  word: string;
  start: number;
  end: number;
  highlight?: boolean;
}

export interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words: CaptionWord[];
}

export interface ClipCaptionsResponse {
  clipId: string;
  words: CaptionWord[];
  style: CaptionStyle | null;
  templateId: string | null;
  isEdited: boolean;
}

export interface CaptionStyleResponse {
  id: string;
  clipId: string;
  templateId: string | null;
  config: CaptionStyle;
  createdAt: string;
  updatedAt: string;
}

export interface CaptionsResponse {
  clipId: string;
  style: CaptionStyleResponse | null;
  captions: Caption[];
}

export interface UpdateCaptionStyleRequest {
  style: Partial<CaptionStyle>;
}

export interface UpdateCaptionStyleResponse {
  message: string;
  style: CaptionStyleResponse;
}

export interface UpdateCaptionTextRequest {
  captionId: string;
  text: string;
}

export interface UpdateCaptionTextResponse {
  message: string;
  caption: Caption;
}

export const captionsApi = {
  /**
   * Get all available caption templates
   */
  getCaptionTemplates: async (): Promise<CaptionTemplate[]> => {
    const response = await api.get<{ success: boolean; data: { templates: CaptionTemplate[]; total: number } }>("/api/caption-templates");
    return response.data.data.templates;
  },

  /**
   * Get captions and style for a clip (new endpoint)
   */
  getClipCaptions: async (clipId: string): Promise<ClipCaptionsResponse> => {
    const response = await api.get<ClipCaptionsResponse>(`/api/clips/${clipId}/captions`);
    return response.data;
  },

  /**
   * Bulk update all caption words
   */
  updateCaptionWords: async (clipId: string, words: CaptionWord[]): Promise<ClipCaptionsResponse> => {
    const response = await api.put<ClipCaptionsResponse>(`/api/clips/${clipId}/captions/words`, { words });
    return response.data;
  },

  /**
   * Update caption style
   */
  updateCaptionStyle: async (
    clipId: string,
    style: CaptionStyle,
    templateId?: string
  ): Promise<ClipCaptionsResponse> => {
    const response = await api.patch<ClipCaptionsResponse>(`/api/clips/${clipId}/captions/style`, {
      style,
      templateId,
    });
    return response.data;
  },

  /**
   * Add a new word
   */
  addCaptionWord: async (
    clipId: string,
    word: string,
    start: number,
    end: number,
    afterWordId?: string
  ): Promise<ClipCaptionsResponse> => {
    const response = await api.post<ClipCaptionsResponse>(`/api/clips/${clipId}/captions/words`, {
      word,
      start,
      end,
      afterWordId,
    });
    return response.data;
  },

  /**
   * Update a single word
   */
  updateCaptionWord: async (
    clipId: string,
    wordId: string,
    updates: { word?: string; start?: number; end?: number }
  ): Promise<ClipCaptionsResponse> => {
    const response = await api.patch<ClipCaptionsResponse>(
      `/api/clips/${clipId}/captions/words/${wordId}`,
      updates
    );
    return response.data;
  },

  /**
   * Remove a word
   */
  removeCaptionWord: async (clipId: string, wordId: string): Promise<ClipCaptionsResponse> => {
    const response = await api.delete<ClipCaptionsResponse>(`/api/clips/${clipId}/captions/words/${wordId}`);
    return response.data;
  },

  /**
   * Reset captions to original transcript
   */
  resetCaptions: async (clipId: string, resetStyle?: boolean): Promise<ClipCaptionsResponse> => {
    const response = await api.post<ClipCaptionsResponse>(`/api/clips/${clipId}/captions/reset`, {
      resetStyle,
    });
    return response.data;
  },

  // Legacy methods for backward compatibility
  getCaptionsByClip: async (clipId: string): Promise<CaptionsResponse> => {
    const response = await api.get<CaptionsResponse>(`/api/clips/${clipId}/captions`);
    return response.data;
  },

  updateCaptionText: async (
    clipId: string,
    request: UpdateCaptionTextRequest
  ): Promise<UpdateCaptionTextResponse> => {
    const response = await api.patch<UpdateCaptionTextResponse>(
      `/api/clips/${clipId}/captions/text`,
      request
    );
    return response.data;
  },
};
