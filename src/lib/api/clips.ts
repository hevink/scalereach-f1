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

export const clipsApi = {
  /**
   * Get all clips for a video with optional filtering and sorting
   * Requirements: 6.1, 7.4
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
    
    const response = await api.get<ClipResponse[]>(url);
    return response.data;
  },

  /**
   * Get a single clip by ID
   * Requirements: 6.1
   */
  getClipById: async (clipId: string): Promise<ClipResponse> => {
    const response = await api.get<ClipResponse>(`/api/clips/${clipId}`);
    return response.data;
  },

  /**
   * Update clip start and end times
   * Requirements: 10.8
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
   * Requirements: 9.2
   */
  toggleFavorite: async (clipId: string): Promise<ToggleFavoriteResponse> => {
    const response = await api.post<ToggleFavoriteResponse>(
      `/api/clips/${clipId}/favorite`
    );
    return response.data;
  },

  /**
   * Delete a clip
   * Requirements: 6.1
   */
  deleteClip: async (clipId: string): Promise<DeleteClipResponse> => {
    const response = await api.delete<DeleteClipResponse>(`/api/clips/${clipId}`);
    return response.data;
  },
};
