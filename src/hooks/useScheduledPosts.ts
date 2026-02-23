import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { socialApi, type SchedulePostPayload } from "@/lib/api/social";

export function useScheduledPosts(
  workspaceId: string | undefined,
  filters?: { status?: string; clipId?: string }
) {
  return useQuery({
    queryKey: ["social", "posts", workspaceId, filters],
    queryFn: () => socialApi.listPosts(workspaceId!, filters),
    enabled: !!workspaceId,
    refetchInterval: (query) => {
      const posts = query.state.data;
      const hasInFlight = Array.isArray(posts) && posts.some((p) => p.status === "pending" || p.status === "posting");
      return hasInFlight ? 3000 : false;
    },
  });
}

export function useSchedulePost(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SchedulePostPayload) => socialApi.schedulePost(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "posts", workspaceId] });
      toast.success("Post scheduled successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to schedule post");
    },
  });
}

export function useCancelPost(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => socialApi.cancelPost(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "posts", workspaceId] });
      toast.success("Post cancelled");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel post");
    },
  });
}

export function useUpdatePost(workspaceId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; caption?: string; hashtags?: string[]; scheduledAt?: string }) =>
      socialApi.updatePost(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social", "posts", workspaceId] });
      toast.success("Post updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update post");
    },
  });
}
