import { api } from "../axios";

export interface InitUploadResponse {
  uploadId: string;
  videoId: string;
  storageKey: string;
  totalParts: number;
  chunkSize: number;
  partUrls: { partNumber: number; url: string }[];
}

export interface PartUrlResponse {
  partNumber: number;
  url: string;
}

export interface ListPartsResponse {
  uploadId: string;
  parts: { partNumber: number; etag: string }[];
  uploadedParts: number;
}

export interface CompleteUploadResponse {
  message: string;
  videoId: string;
  storageUrl: string;
}

export const uploadApi = {
  // Initialize multipart upload
  initUpload: async (
    filename: string,
    fileSize: number,
    contentType: string,
    workspaceId: string,
    projectId?: string
  ): Promise<InitUploadResponse> => {
    const response = await api.post<InitUploadResponse>("/api/upload/init", {
      filename,
      fileSize,
      contentType,
      workspaceId,
      projectId,
    });
    return response.data;
  },

  // Get presigned URL for a specific part
  getPartUrl: async (
    uploadId: string,
    storageKey: string,
    partNumber: number
  ): Promise<PartUrlResponse> => {
    const response = await api.post<PartUrlResponse>("/api/upload/part-url", {
      uploadId,
      storageKey,
      partNumber,
    });
    return response.data;
  },

  // List uploaded parts (for resume)
  listParts: async (
    uploadId: string,
    storageKey: string
  ): Promise<ListPartsResponse> => {
    const response = await api.get<ListPartsResponse>(
      `/api/upload/${uploadId}/parts?storageKey=${encodeURIComponent(storageKey)}`
    );
    return response.data;
  },

  // Complete multipart upload
  completeUpload: async (
    uploadId: string,
    videoId: string,
    storageKey: string,
    parts: { partNumber: number; etag: string }[]
  ): Promise<CompleteUploadResponse> => {
    const response = await api.post<CompleteUploadResponse>("/api/upload/complete", {
      uploadId,
      videoId,
      storageKey,
      parts,
    });
    return response.data;
  },

  // Abort multipart upload
  abortUpload: async (
    uploadId: string,
    storageKey: string,
    videoId?: string
  ): Promise<void> => {
    await api.post("/api/upload/abort", {
      uploadId,
      storageKey,
      videoId,
    });
  },
};
