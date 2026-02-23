import { api } from "../axios";

export interface BackgroundCategory {
  id: string;
  slug: string;
  displayName: string;
  thumbnailUrl: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface BackgroundVideo {
  id: string;
  categoryId: string;
  displayName: string;
  storageKey: string;
  thumbnailKey: string | null;
  thumbnailUrl?: string;
  duration: number;
  width: number;
  height: number;
  fileSize: number;
  createdAt: string;
}

export const backgroundVideoApi = {
  listCategories: async (): Promise<BackgroundCategory[]> => {
    const response = await api.get<{ success: boolean; data: BackgroundCategory[] }>("/api/backgrounds/categories");
    return response.data.data;
  },

  listAllVideos: async (): Promise<BackgroundVideo[]> => {
    const response = await api.get<{ success: boolean; data: BackgroundVideo[] }>("/api/backgrounds/videos");
    return response.data.data;
  },

  listVideosByCategory: async (categoryId: string): Promise<BackgroundVideo[]> => {
    const response = await api.get<{ success: boolean; data: BackgroundVideo[] }>(`/api/backgrounds/categories/${categoryId}`);
    return response.data.data;
  },
};
