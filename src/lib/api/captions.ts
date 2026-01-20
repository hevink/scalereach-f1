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
}

export interface CaptionTemplate {
  id: string;
  name: string;
  style: CaptionStyle;
  previewUrl: string;
}

export interface CaptionWord {
  word: string;
  startTime: number;
  endTime: number;
  highlight: boolean;
}

export interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  words: CaptionWord[];
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
   * Requirements: 12.1
   */
  getCaptionTemplates: async (): Promise<CaptionTemplate[]> => {
    const response = await api.get<CaptionTemplate[]>("/api/captions/templates");
    return response.data;
  },

  /**
   * Get captions and style for a clip
   * Requirements: 12.1, 16.5
   */
  getCaptionsByClip: async (clipId: string): Promise<CaptionsResponse> => {
    const response = await api.get<CaptionsResponse>(
      `/api/clips/${clipId}/captions`
    );
    return response.data;
  },

  /**
   * Update caption style for a clip
   * Requirements: 12.4, 13.8
   */
  updateCaptionStyle: async (
    clipId: string,
    request: UpdateCaptionStyleRequest
  ): Promise<UpdateCaptionStyleResponse> => {
    const response = await api.patch<UpdateCaptionStyleResponse>(
      `/api/clips/${clipId}/captions/style`,
      request
    );
    return response.data;
  },

  /**
   * Update caption text for a specific caption segment
   * Requirements: 16.5
   */
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
