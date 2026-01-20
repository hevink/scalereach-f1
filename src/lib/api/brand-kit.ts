import { api } from "../axios";

// Types based on design document

export type LogoPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface BrandKit {
  id: string;
  workspaceId: string;
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  createdAt: string;
  updatedAt: string;
}

export interface LogoSettings {
  position: LogoPosition;
  size: number;
  opacity: number;
}

export interface BrandingOptions {
  logoPosition: LogoPosition;
  logoSize: number;
  logoOpacity: number;
  applyColorsToCaption: boolean;
  applyFontToCaption: boolean;
}

export interface BrandKitResponse {
  id: string;
  workspaceId: string;
  logoStorageKey: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandKitRequest {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export interface CreateBrandKitResponse {
  message: string;
  brandKit: BrandKitResponse;
}

export interface UpdateBrandKitRequest {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
}

export interface UpdateBrandKitResponse {
  message: string;
  brandKit: BrandKitResponse;
}

export interface UploadLogoResponse {
  message: string;
  brandKit: BrandKitResponse;
}

export const brandKitApi = {
  /**
   * Get the brand kit for a workspace
   * Requirements: 18.4, 19.5, 21.5
   */
  getBrandKit: async (workspaceId: string): Promise<BrandKitResponse | null> => {
    try {
      const response = await api.get<BrandKitResponse>(
        `/api/workspaces/${workspaceId}/brand-kit`
      );
      return response.data;
    } catch (error) {
      // Return null if brand kit doesn't exist (404)
      if ((error as Error).message?.includes("not found") || 
          (error as Error).message?.includes("404")) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Create a new brand kit for a workspace
   * Requirements: 19.5
   */
  createBrandKit: async (
    workspaceId: string,
    request: CreateBrandKitRequest
  ): Promise<CreateBrandKitResponse> => {
    const response = await api.post<CreateBrandKitResponse>(
      `/api/workspaces/${workspaceId}/brand-kit`,
      request
    );
    return response.data;
  },

  /**
   * Update an existing brand kit
   * Requirements: 19.5, 21.5
   */
  updateBrandKit: async (
    workspaceId: string,
    request: UpdateBrandKitRequest
  ): Promise<UpdateBrandKitResponse> => {
    const response = await api.patch<UpdateBrandKitResponse>(
      `/api/workspaces/${workspaceId}/brand-kit`,
      request
    );
    return response.data;
  },

  /**
   * Upload a logo for the brand kit
   * Requirements: 18.4
   */
  uploadLogo: async (
    workspaceId: string,
    file: File
  ): Promise<UploadLogoResponse> => {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await api.post<UploadLogoResponse>(
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
   * Remove the logo from the brand kit
   * Requirements: 18.4
   */
  removeLogo: async (workspaceId: string): Promise<UpdateBrandKitResponse> => {
    const response = await api.delete<UpdateBrandKitResponse>(
      `/api/workspaces/${workspaceId}/brand-kit/logo`
    );
    return response.data;
  },
};
