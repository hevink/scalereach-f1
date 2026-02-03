import { api } from "../axios";

// Types based on design document

export interface BrandingOptions {
  logoUrl?: string;
  logoPosition?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  logoSize?: "small" | "medium" | "large";
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

export interface BrandKit {
  id: string;
  workspaceId: string;
  logoUrl?: string;
  colors: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
  };
  fontFamily: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandKitRequest {
  logoUrl?: string;
  colors?: Partial<BrandKit["colors"]>;
  fontFamily?: string;
}

export const brandKitApi = {
  /**
   * Get brand kit for a workspace
   */
  getBrandKit: async (workspaceId: string): Promise<BrandKit | null> => {
    try {
      const response = await api.get<BrandKit>(
        `/api/workspaces/${workspaceId}/brand-kit`
      );
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * Update brand kit for a workspace
   */
  updateBrandKit: async (
    workspaceId: string,
    request: UpdateBrandKitRequest
  ): Promise<BrandKit> => {
    const response = await api.put<BrandKit>(
      `/api/workspaces/${workspaceId}/brand-kit`,
      request
    );
    return response.data;
  },

  /**
   * Upload logo for brand kit
   */
  uploadLogo: async (workspaceId: string, file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await api.post<{ logoUrl: string }>(
      `/api/workspaces/${workspaceId}/brand-kit/logo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  /**
   * Delete logo from brand kit
   */
  deleteLogo: async (workspaceId: string): Promise<void> => {
    await api.delete(`/api/workspaces/${workspaceId}/brand-kit/logo`);
  },
};
