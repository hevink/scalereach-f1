import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialApi } from "@/lib/api/social";

export function useSocialAccounts(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["social", "accounts", workspaceId],
    queryFn: () => socialApi.listAccounts(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useConnectSocialAccount() {
  return useMutation({
    mutationFn: ({ platform, workspaceId }: { platform: string; workspaceId: string }) =>
      socialApi.initiateOAuth(platform, workspaceId),
    onSuccess: (data) => {
      window.location.href = data.authUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to connect account");
    },
  });
}

export function useDisconnectSocialAccount(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialApi.disconnectAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "accounts", workspaceId] });
      toast.success("Account disconnected");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to disconnect account");
    },
  });
}
