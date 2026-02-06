import { useQuery, useMutation } from "@tanstack/react-query";
import { minutesApi } from "@/lib/api/minutes";

export function useMinutesBalance(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["minutes", "balance", workspaceId],
    queryFn: () => minutesApi.getBalance(workspaceId!),
    enabled: !!workspaceId,
    retry: (failureCount, error) => {
      if ((error as any)?.status === 401 || (error as any)?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useMinuteTransactions(workspaceId: string | undefined, params?: { limit?: number; type?: string }) {
  return useQuery({
    queryKey: ["minutes", "transactions", workspaceId, params],
    queryFn: () => minutesApi.getTransactions(workspaceId!, params),
    enabled: !!workspaceId,
  });
}

export function useValidateUpload() {
  return useMutation({
    mutationFn: ({ workspaceId, duration, size }: { workspaceId: string; duration: number; size: number }) =>
      minutesApi.validateUpload(workspaceId, duration, size),
  });
}
