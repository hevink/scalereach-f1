import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { smartCropApi, type SmartCropStatusResponse } from "@/lib/api/smart-crop";
import { toast } from "sonner";

export const smartCropKeys = {
  status: (clipId: string) => ["smart-crop", clipId] as const,
};

export function useSmartCropStatus(clipId: string, enabled = true) {
  return useQuery({
    queryKey: smartCropKeys.status(clipId),
    queryFn: () => smartCropApi.getStatus(clipId),
    enabled: !!clipId && enabled,
    refetchInterval: (query) => {
      const status = (query.state.data as SmartCropStatusResponse | undefined)?.status;
      return status === "processing" || status === "pending" ? 2000 : false;
    },
  });
}

export function useTriggerSmartCrop(clipId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => smartCropApi.trigger(clipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: smartCropKeys.status(clipId) });
      toast.success("Creating vertical version", {
        description: "Face tracking is running. This takes 1-3 minutes.",
      });
    },
    onError: (error) => {
      toast.error("Failed to start smart crop", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    },
  });
}
