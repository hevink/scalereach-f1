import { api } from "../axios";

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  thumbnail: string;
  channelName: string;
  description: string;
}

export interface Video {
  id: string;
  projectId: string | null;
  userId: string;
  sourceType: "youtube" | "upload";
  sourceUrl: string;
  status: "pending" | "downloading" | "uploading" | "transcribing" | "analyzing" | "completed" | "failed";
  title: string | null;
  duration: number | null;
  storageKey: string | null;
  storageUrl: string | null;
  transcript: string | null;
  errorMessage: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
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

  // Submit YouTube URL for processing
  submitYouTubeUrl: async (youtubeUrl: string, projectId?: string): Promise<SubmitVideoResponse> => {
    const response = await api.post<SubmitVideoResponse>("/api/videos/youtube", {
      youtubeUrl,
      projectId,
    });
    return response.data;
  },

  // Get user's videos
  getMyVideos: async (): Promise<Video[]> => {
    const response = await api.get<Video[]>("/api/videos/my-videos");
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
