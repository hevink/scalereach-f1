import { api } from "../axios";

export interface VideoTranslation {
  id: string;
  videoId: string;
  workspaceId: string;
  sourceLanguage: string;
  targetLanguage: string;
  translatedTranscript: string | null;
  translatedWords: Array<{ word: string; start: number; end: number }> | null;
  status: "pending" | "translating" | "completed" | "failed";
  error: string | null;
  provider: string | null;
  characterCount: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranslatedClipCaption {
  id: string;
  clipId: string;
  translationId: string;
  targetLanguage: string;
  words: Array<{ word: string; start: number; end: number }>;
  styleConfig: Record<string, any> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}

export interface ClipTranslationLanguage {
  language: string;
  name: string;
}

export const translationsApi = {
  // Start a translation for a video
  startTranslation: async (videoId: string, targetLanguage: string) => {
    const response = await api.post<VideoTranslation>(
      `/api/translations/videos/${videoId}`,
      { targetLanguage }
    );
    return response.data;
  },

  // Get all translations for a video
  getTranslations: async (videoId: string) => {
    const response = await api.get<VideoTranslation[]>(
      `/api/translations/videos/${videoId}`
    );
    return response.data;
  },

  // Get a specific translation by video + language
  getTranslation: async (videoId: string, language: string) => {
    const response = await api.get<VideoTranslation>(
      `/api/translations/videos/${videoId}/${language}`
    );
    return response.data;
  },

  // Delete a translation
  deleteTranslation: async (translationId: string) => {
    const response = await api.delete(`/api/translations/${translationId}`);
    return response.data;
  },

  // Get supported translation languages
  getSupportedLanguages: async () => {
    const response = await api.get<SupportedLanguage[]>(
      `/api/translations/languages`
    );
    return response.data;
  },

  // Get translated captions for a clip in a specific language
  getTranslatedCaptions: async (clipId: string, language: string) => {
    const response = await api.get<TranslatedClipCaption>(
      `/api/translations/clips/${clipId}/captions/${language}`
    );
    return response.data;
  },

  // Get all available translation languages for a clip
  getClipTranslationLanguages: async (clipId: string) => {
    const response = await api.get<ClipTranslationLanguage[]>(
      `/api/translations/clips/${clipId}/captions`
    );
    return response.data;
  },
};
