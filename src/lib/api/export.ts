import { api } from "../axios";
import { BrandingOptions } from "./brand-kit";

// Types based on design document

export type ExportFormat = "mp4" | "mov";
export type VideoResolution = "720p" | "1080p" | "2k" | "4k";
export type ExportStatus = "queued" | "processing" | "completed" | "failed";
export type BatchExportStatus = "processing" | "completed" | "partial" | "failed";

export interface ExportOptions {
  format?: ExportFormat;
  resolution?: VideoResolution;
  captionStyleId?: string;
  brandKitId?: string;
  brandingOptions?: BrandingOptions;
  targetLanguage?: string;
  dubbingId?: string;
}

export interface ExportRecord {
  id: string;
  clipId: string;
  format: ExportFormat;
  resolution: VideoResolution;
  status: ExportStatus;
  progress: number;
  downloadUrl?: string;
  expiresAt?: string;
  fileSize?: number;
  error?: string;
  createdAt: string;
}

export interface BatchExportRecord {
  id: string;
  totalClips: number;
  completedClips: number;
  failedClips: number;
  status: BatchExportStatus;
  exports: ExportRecord[];
}

export interface InitiateExportRequest {
  options: ExportOptions;
}

export interface InitiateExportResponse {
  message: string;
  export: ExportRecord;
}

export interface ExportStatusResponse {
  export: ExportRecord;
}

export interface InitiateBatchExportRequest {
  clipIds: string[];
  options: ExportOptions;
}

export interface InitiateBatchExportResponse {
  message: string;
  batchExport: BatchExportRecord;
}

export interface BatchExportStatusResponse {
  batchExport: BatchExportRecord;
}

export const exportApi = {
  /**
   * Initiate export for a single clip
   * Requirements: 23.1
   */
  initiateExport: async (
    clipId: string,
    request: InitiateExportRequest
  ): Promise<InitiateExportResponse> => {
    const response = await api.post<InitiateExportResponse>(
      `/api/clips/${clipId}/export`,
      request
    );
    return response.data;
  },

  /**
   * Get export status for a single export
   * Requirements: 23.1
   */
  getExportStatus: async (exportId: string): Promise<ExportStatusResponse> => {
    const response = await api.get<ExportStatusResponse>(
      `/api/exports/${exportId}`
    );
    return response.data;
  },

  /**
   * Initiate batch export for multiple clips
   * Requirements: 24.1
   */
  initiateBatchExport: async (
    request: InitiateBatchExportRequest
  ): Promise<InitiateBatchExportResponse> => {
    const response = await api.post<InitiateBatchExportResponse>(
      `/api/exports/batch`,
      request
    );
    return response.data;
  },

  /**
   * Get batch export status
   * Requirements: 24.1
   */
  getBatchExportStatus: async (
    batchId: string
  ): Promise<BatchExportStatusResponse> => {
    const response = await api.get<BatchExportStatusResponse>(
      `/api/exports/batch/${batchId}`
    );
    return response.data;
  },

  /**
   * Get export history for a clip
   * Requirements: 23.1
   */
  getExportsByClip: async (clipId: string): Promise<ExportRecord[]> => {
    const response = await api.get<ExportRecord[]>(
      `/api/clips/${clipId}/exports`
    );
    return response.data;
  },
};
