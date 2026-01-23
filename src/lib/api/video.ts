import { api } from "../axios";

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channelName: string;
  description: string;
}

/**
 * Lite video type for grid display - only essential fields
 */
export interface VideoLite {
  id: string;
  title: string | null;
  duration: number | null;
  status: "pending" | "pending_config" | "downloading" | "uploading" | "transcribing" | "analyzing" | "completed" | "failed";
  sourceType: "youtube" | "upload";
  sourceUrl: string | null;
  createdAt: string;
}

export interface Video extends VideoLite {
  projectId: string | null;
  userId: string;
  storageKey: string | null;
  storageUrl: string | null;
  transcript: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  updatedAt: string;
}

export interface ViralClip {
  id: string;
  videoId: string;
  title: string;
  startTime: number;
  endTime: number;
  duration: number;
  transcript: string;
  viralityScore: number;
  viralityReason: string;
  hooks: string[];
  emotions: string[];
  status: "pending" | "processing" | "completed" | "failed";
  createdAt: string;
}

export interface ValidateYouTubeResponse {
  valid: boolean;
  videoInfo?: VideoInfo;
  error?: string;
}

export interface SubmitVideoResponse {
  message: string;
  video: Video;
  videoInfo?: VideoInfo;
  redirectUrl?: string;
}

export interface SubmitVideoWithConfigRequest {
  youtubeUrl: string;
  projectId?: string;
  workspaceSlug?: string;
  config?: {
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
  };
}

export interface VideoStatusResponse {
  video: Video;
  job: {
    id: string;
    progress: number;
    state: string;
  } | null;
}

export const videoApi = {
  // Validate YouTube URL (public endpoint)
  validateYouTubeUrl: async (url: string): Promise<ValidateYouTubeResponse> => {
    const response = await api.get<ValidateYouTubeResponse>(
      `/api/videos/validate-youtube?url=${encodeURIComponent(url)}`
    );
    return response.data;
  },

  // Submit YouTube URL for processing (with optional config)
  submitYouTubeUrl: async (
    youtubeUrl: string,
    projectId?: string,
    workspaceSlug?: string,
    config?: SubmitVideoWithConfigRequest["config"]
  ): Promise<SubmitVideoResponse> => {
    const response = await api.post<SubmitVideoResponse>("/api/videos/youtube", {
      youtubeUrl,
      projectId,
      workspaceSlug,
      config,
    });
    return response.data;
  },

  // Get user's videos (lite version for grid display)
  getMyVideos: async (): Promise<VideoLite[]> => {
    const response = await api.get<VideoLite[]>("/api/videos/my-videos");
    return response.data;
  },

  // Get videos by project
  getVideosByProject: async (projectId: string): Promise<Video[]> => {
    const response = await api.get<Video[]>(`/api/videos/project/${projectId}`);
    return response.data;
  },

  // Get video by ID
  getVideoById: async (id: string): Promise<Video> => {
    const response = await api.get<Video>(`/api/videos/${id}`);
    return response.data;
  },

  // Get video status with job progress
  getVideoStatus: async (id: string): Promise<VideoStatusResponse> => {
    const response = await api.get<VideoStatusResponse>(`/api/videos/${id}/status`);
    return response.data;
  },

  // Delete video
  deleteVideo: async (id: string): Promise<void> => {
    await api.delete(`/api/videos/${id}`);
  },
};
