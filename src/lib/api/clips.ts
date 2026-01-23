import { api } from "../axios";

// Types based on design document
export type ClipStatus = "detected" | "generating" | "ready" | "exported" | "failed";
export type AspectRatio = "9:16" | "1:1" | "16:9";

export interface ClipResponse {
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
  thumbnailUrl?: string;
  storageKey: string | null;
  storageUrl: string | null;
  aspectRatio: AspectRatio | null;
  favorited: boolean;
  status: ClipStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClipFilters {
  minScore?: number;
  maxScore?: number;
  favorited?: boolean;
  sortBy: "score" | "duration" | "createdAt";
  sortOrder: "asc" | "desc";
}

export interface UpdateClipBoundariesRequest {
  startTime: number;
  endTime: number;
}

export interface UpdateClipBoundariesResponse {
  message: string;
  clip: ClipResponse;
}

export interface ToggleFavoriteResponse {
  message: string;
  clip: ClipResponse;
}

export interface DeleteClipResponse {
  message: string;
}

export interface ClipsListResponse {
  videoId: string;
  clips: ClipResponse[];
  count: number;
  filters: ClipFilters;
}

export interface RegenerateClipResponse {
  message: string;
  clipId: string;
  jobId: string;
  options: {
    aspectRatio: AspectRatio;
    quality: string;
    startTime: number;
    endTime: number;
    duration: number;
    hasCaptions: boolean;
    captionWordCount: number;
  };
}

export interface ClipStatusResponse {
  clipId: string;
  status: ClipStatus;
  aspectRatio: AspectRatio | null;
  storageUrl: string | null;
  errorMessage: string | null;
  job?: {
    id: string;
    state: string;
    progress: number;
    failedReason?: string;
    processedOn?: string;
    finishedOn?: string;
  };
}

export const clipsApi = {
  /**
   * Get all clips for a video with optional filtering and sorting
   */
  getClipsByVideo: async (videoId: string, filters?: Partial<ClipFilters>): Promise<ClipResponse[]> => {
    const searchParams = new URLSearchParams();
    
    if (filters?.minScore !== undefined) {
      searchParams.set("minScore", filters.minScore.toString());
    }
    if (filters?.maxScore !== undefined) {
      searchParams.set("maxScore", filters.maxScore.toString());
    }
    if (filters?.favorited !== undefined) {
      searchParams.set("favorited", filters.favorited.toString());
    }
    if (filters?.sortBy) {
      searchParams.set("sortBy", filters.sortBy);
    }
    if (filters?.sortOrder) {
      searchParams.set("sortOrder", filters.sortOrder);
    }

    const queryString = searchParams.toString();
    const url = `/api/videos/${videoId}/clips${queryString ? `?${queryString}` : ""}`;
    
    const response = await api.get<ClipsListResponse>(url);
    return response.data.clips;
  },

  /**
   * Get a single clip by ID
   */
  getClipById: async (clipId: string): Promise<ClipResponse> => {
    const response = await api.get<ClipResponse>(`/api/clips/${clipId}`);
    return response.data;
  },

  /**
   * Update clip start and end times
   */
  updateClipBoundaries: async (
    clipId: string,
    boundaries: UpdateClipBoundariesRequest
  ): Promise<UpdateClipBoundariesResponse> => {
    const response = await api.patch<UpdateClipBoundariesResponse>(
      `/api/clips/${clipId}/boundaries`,
      boundaries
    );
    return response.data;
  },

  /**
   * Toggle the favorite status of a clip
   */
  toggleFavorite: async (clipId: string): Promise<ToggleFavoriteResponse> => {
    const response = await api.post<ToggleFavoriteResponse>(
      `/api/clips/${clipId}/favorite`
    );
    return response.data;
  },

  /**
   * Delete a clip
   */
  deleteClip: async (clipId: string): Promise<DeleteClipResponse> => {
    const response = await api.delete<DeleteClipResponse>(`/api/clips/${clipId}`);
    return response.data;
  },

  /**
   * Regenerate clip with saved captions burned in
   */
  regenerateClip: async (
    clipId: string,
    options?: { aspectRatio?: AspectRatio; quality?: string }
  ): Promise<RegenerateClipResponse> => {
    const response = await api.post<RegenerateClipResponse>(
      `/api/clips/${clipId}/regenerate`,
      options || {}
    );
    return response.data;
  },

  /**
   * Get clip generation status
   */
  getClipStatus: async (clipId: string): Promise<ClipStatusResponse> => {
    const response = await api.get<ClipStatusResponse>(`/api/clips/${clipId}/status`);
    return response.data;
  },
};
