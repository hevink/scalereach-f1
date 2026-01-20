import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  brandKitApi,
  type BrandKitResponse,
  type CreateBrandKitRequest,
  type UpdateBrandKitRequest,
} from "@/lib/api/brand-kit";
import { toast } from "sonner";

// Query keys following the design document pattern
export const brandKitKeys = {
  all: ["brandKits"] as const,
  byWorkspace: (workspaceId: string) =>
    [...brandKitKeys.all, "workspace", workspaceId] as const,
};

/**
 * Get the brand kit for a workspace
 * Requirements: 18.4, 19.5, 21.5, 30.4
 */
export function useBrandKit(workspaceId: string) {
  return useQuery({
    queryKey: brandKitKeys.byWorkspace(workspaceId),
    queryFn: () => brandKitApi.getBrandKit(workspaceId),
    enabled: !!workspaceId,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Create a new brand kit for a workspace
 * Requirements: 19.5, 30.1, 30.5
 */
export function useCreateBrandKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      request,
    }: {
      workspaceId: string;
      request: CreateBrandKitRequest;
    }) => brandKitApi.createBrandKit(workspaceId, request),
    onSuccess: (data, variables) => {
      // Update the brand kit cache with the new data
      queryClient.setQueryData(
        brandKitKeys.byWorkspace(variables.workspaceId),
        data.brandKit
      );
      toast.success("Brand kit created", {
        description: "Your brand kit has been created successfully.",
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useCreateBrandKit] Failed to create brand kit:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to create brand kit", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Update an existing brand kit
 * Requirements: 19.5, 21.5, 30.1, 30.5
 */
export function useUpdateBrandKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      request,
    }: {
      workspaceId: string;
      request: UpdateBrandKitRequest;
    }) => brandKitApi.updateBrandKit(workspaceId, request),
    onMutate: async ({ workspaceId, request }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({
        queryKey: brandKitKeys.byWorkspace(workspaceId),
      });

      // Snapshot the previous value
      const previousBrandKit = queryClient.getQueryData<BrandKitResponse | null>(
        brandKitKeys.byWorkspace(workspaceId)
      );

      // Optimistically update the brand kit
      if (previousBrandKit) {
        queryClient.setQueryData<BrandKitResponse>(
          brandKitKeys.byWorkspace(workspaceId),
          {
            ...previousBrandKit,
            ...request,
            updatedAt: new Date().toISOString(),
          }
        );
      }

      // Return context with the previous value for rollback
      return { previousBrandKit };
    },
    onError: (error, variables, context) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useUpdateBrandKit] Failed to update brand kit:", {
        error,
        workspaceId: variables.workspaceId,
        timestamp: new Date().toISOString(),
      });

      // Rollback to the previous value on error
      if (context?.previousBrandKit) {
        queryClient.setQueryData(
          brandKitKeys.byWorkspace(variables.workspaceId),
          context.previousBrandKit
        );
      }

      // Show error toast (Requirement 30.1)
      toast.error("Failed to update brand kit", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
    onSettled: (_data, _error, variables) => {
      // Always refetch after error or success to ensure cache is in sync
      queryClient.invalidateQueries({
        queryKey: brandKitKeys.byWorkspace(variables.workspaceId),
      });
    },
  });
}

/**
 * Upload a logo for the brand kit
 * Requirements: 18.4, 30.1, 30.5
 */
export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      workspaceId,
      file,
    }: {
      workspaceId: string;
      file: File;
    }) => brandKitApi.uploadLogo(workspaceId, file),
    onSuccess: (data, variables) => {
      // Update the brand kit cache with the new logo URL
      queryClient.setQueryData(
        brandKitKeys.byWorkspace(variables.workspaceId),
        data.brandKit
      );
      toast.success("Logo uploaded", {
        description: "Your logo has been uploaded successfully.",
      });
    },
    onError: (error) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useUploadLogo] Failed to upload logo:", {
        error,
        timestamp: new Date().toISOString(),
      });
      // Show error toast (Requirement 30.1)
      toast.error("Failed to upload logo", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}

/**
 * Remove the logo from the brand kit
 * Requirements: 18.4, 30.1, 30.5
 */
export function useRemoveLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) => brandKitApi.removeLogo(workspaceId),
    onMutate: async (workspaceId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: brandKitKeys.byWorkspace(workspaceId),
      });

      // Snapshot the previous value
      const previousBrandKit = queryClient.getQueryData<BrandKitResponse | null>(
        brandKitKeys.byWorkspace(workspaceId)
      );

      // Optimistically remove the logo
      if (previousBrandKit) {
        queryClient.setQueryData<BrandKitResponse>(
          brandKitKeys.byWorkspace(workspaceId),
          {
            ...previousBrandKit,
            logoUrl: null,
            logoStorageKey: null,
            updatedAt: new Date().toISOString(),
          }
        );
      }

      return { previousBrandKit };
    },
    onError: (error, workspaceId, context) => {
      // Log error for debugging (Requirement 30.5)
      console.error("[useRemoveLogo] Failed to remove logo:", {
        error,
        workspaceId,
        timestamp: new Date().toISOString(),
      });

      // Rollback on error
      if (context?.previousBrandKit) {
        queryClient.setQueryData(
          brandKitKeys.byWorkspace(workspaceId),
          context.previousBrandKit
        );
      }

      // Show error toast (Requirement 30.1)
      toast.error("Failed to remove logo", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
    onSuccess: () => {
      toast.success("Logo removed", {
        description: "Your logo has been removed.",
      });
    },
    onSettled: (_data, _error, workspaceId) => {
      // Always refetch to ensure cache is in sync
      queryClient.invalidateQueries({
        queryKey: brandKitKeys.byWorkspace(workspaceId),
      });
    },
  });
}
