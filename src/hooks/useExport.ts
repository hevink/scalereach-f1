import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  exportApi,
  type ExportOptions,
  type ExportRecord,
  type ExportStatusResponse,
  type BatchExportStatusResponse,
} from "@/lib/api/export";
import { toast } from "sonner";

// Query keys following the design document pattern
export const exportKeys = {
  all: ["exports"] as const,
  byClip: (clipId: string) => [...exportKeys.all, "clip", clipId] as const,
  byId: (id: string) => [...exportKeys.all, id] as const,
  batch: (batchId: string) => [...exportKeys.all, "batch", batchId] as const,
};

/**
 * Get exports for a clip
 * Requirements: 23.1, 30.4
 */
export function useExportsByClip(clipId: string) {
  return useQuery({
    queryKey: exportKeys.byClip(clipId),
    queryFn: () => exportApi.getExportsByClip(clipId),
    enabled: !!clipId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Initiate export for a single clip
 * Requirements: 23.1, 30.1, 30.5
 */
export function useInitiateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clipId,
      options,
    }: {
      clipId: string;
      options: ExportOptions;
    }) => exportApi.initiateExport(clipId, { options }),
    onSuccess: (data, { clipId }) => {
      // Add the new export to the clip's exports cache
      queryClient.setQueryData<ExportRecord[]>(
        exportKeys.byClip(clipId),
        (oldExports) => {
          if (!oldExports) return [data.export];
          return [data.export, ...oldExports];
        }
      );
      // Also set the individual export in cache
      queryClient.setQueryData(exportKeys.byId(data.export.id), {
        export: data.export,
      });
      toast.success("Export started", {
        description: "Your clip is being exported. This may take a few minutes.",
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useInitiateExport] Failed to initiate export:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to start export", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Get export status with polling (2-second interval as per requirements)
 * Requirements: 23.1, 23.2, 30.4
 */
export function useExportStatus(exportId: string, enabled = true) {
  return useQuery({
    queryKey: exportKeys.byId(exportId),
    queryFn: () => exportApi.getExportStatus(exportId),
    enabled: !!exportId && enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: (query) => {
      const data = query.state.data as ExportStatusResponse | undefined;
      // Stop polling when export is completed or failed
      if (
        data?.export.status === "completed" ||
        data?.export.status === "failed"
      ) {
        return false;
      }
      // Poll every 2 seconds while processing (as per requirements 23.2)
      return 2000;
    },
  });
}

/**
 * Initiate batch export for multiple clips
 * Requirements: 24.1, 30.1, 30.5
 */
export function useBatchExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      clipIds,
      options,
    }: {
      clipIds: string[];
      options: ExportOptions;
    }) => exportApi.initiateBatchExport({ clipIds, options }),
    onSuccess: (data) => {
      // Set the batch export in cache
      queryClient.setQueryData(exportKeys.batch(data.batchExport.id), {
        batchExport: data.batchExport,
      });
      // Invalidate all exports to ensure fresh data
      queryClient.invalidateQueries({ queryKey: exportKeys.all });
      toast.success("Batch export started", {
        description: `Exporting ${data.batchExport.totalClips} clips. This may take a while.`,
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useBatchExport] Failed to initiate batch export:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to start batch export", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Get batch export status with polling (2-second interval as per requirements)
 * Requirements: 24.1, 24.4, 30.4
 */
export function useBatchExportStatus(batchId: string, enabled = true) {
  return useQuery({
    queryKey: exportKeys.batch(batchId),
    queryFn: () => exportApi.getBatchExportStatus(batchId),
    enabled: !!batchId && enabled,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchInterval: (query) => {
      const data = query.state.data as BatchExportStatusResponse | undefined;
      // Stop polling when batch export is completed, partial, or failed
      if (
        data?.batchExport.status === "completed" ||
        data?.batchExport.status === "partial" ||
        data?.batchExport.status === "failed"
      ) {
        return false;
      }
      // Poll every 2 seconds while processing (as per requirements 23.2)
      return 2000;
    },
  });
}
