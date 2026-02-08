import { api } from "../axios";

export interface VoiceDubbing {
  id: string;
  translationId: string;
  videoId: string;
  workspaceId: string;
  targetLanguage: string;
  ttsProvider: string;
  voiceId: string;
  voiceName: string | null;
  voiceSettings: Record<string, any> | null;
  audioMode: "replace" | "duck";
  duckVolume: number;
  dubbedAudioKey: string | null;
  dubbedAudioUrl: string | null;
  mixedAudioKey: string | null;
  mixedAudioUrl: string | null;
  totalSegments: number;
  processedSegments: number;
  durationSeconds: number | null;
  ttsCharactersUsed: number;
  status: "pending" | "generating_tts" | "mixing_audio" | "completed" | "failed";
  error: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface TTSVoice {
  voiceId: string;
  name: string;
  language?: string;
  labels?: Record<string, string>;
  previewUrl?: string;
  provider: string;
}

export interface DubbedClipAudio {
  id: string;
  clipId: string;
  dubbingId: string;
  targetLanguage: string;
  audioKey: string | null;
  audioUrl: string | null;
  durationSeconds: number | null;
  signedUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StartDubbingParams {
  voiceId: string;
  voiceName?: string;
  voiceSettings?: {
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  };
  audioMode?: "replace" | "duck";
  duckVolume?: number;
}

export const dubbingApi = {
  // Start dubbing for a translation
  startDubbing: async (translationId: string, params: StartDubbingParams) => {
    const response = await api.post<VoiceDubbing>(
      `/api/dubbing/translations/${translationId}`,
      params
    );
    return response.data;
  },

  // Get all dubbings for a video
  getDubbingsByVideo: async (videoId: string) => {
    const response = await api.get<VoiceDubbing[]>(
      `/api/dubbing/videos/${videoId}`
    );
    return response.data;
  },

  // Get dubbing details
  getDubbing: async (dubbingId: string) => {
    const response = await api.get<VoiceDubbing>(
      `/api/dubbing/${dubbingId}`
    );
    return response.data;
  },

  // Delete a dubbing
  deleteDubbing: async (dubbingId: string) => {
    const response = await api.delete(`/api/dubbing/${dubbingId}`);
    return response.data;
  },

  // List TTS voices
  listVoices: async (provider?: string, language?: string) => {
    const params = new URLSearchParams();
    if (provider) params.set("provider", provider);
    if (language) params.set("language", language);
    const query = params.toString();
    const response = await api.get<TTSVoice[]>(
      `/api/dubbing/voices${query ? `?${query}` : ""}`
    );
    return response.data;
  },

  // Get signed URL for audio preview
  getPreview: async (dubbingId: string) => {
    const response = await api.get<{ url: string }>(
      `/api/dubbing/${dubbingId}/preview`
    );
    return response.data;
  },

  // Get dubbed audio for a clip
  getClipAudio: async (clipId: string, dubbingId: string) => {
    const response = await api.get<DubbedClipAudio>(
      `/api/dubbing/clips/${clipId}/audio/${dubbingId}`
    );
    return response.data;
  },
};
