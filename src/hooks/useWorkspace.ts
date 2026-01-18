"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceApi, type Workspace } from "@/lib/api";
import { toast } from "sonner";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: workspaceApi.getAll,
  });
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: () => workspaceApi.getById(id),
    enabled: !!id,
  });
}

export function useWorkspaceBySlug(slug: string) {
  return useQuery({
    queryKey: ["workspace", "slug", slug],
    queryFn: () => workspaceApi.getBySlug(slug),
    enabled: !!slug,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace created successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create workspace");
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workspace> }) =>
      workspaceApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", id] });
      toast.success("Workspace updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update workspace");
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Workspace deleted successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete workspace");
    },
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "members"],
    queryFn: () => workspaceApi.getMembers(workspaceId),
    enabled: !!workspaceId,
  });
}
