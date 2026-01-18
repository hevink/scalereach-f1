"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { workspaceApi } from "@/lib/api";
import type { Workspace } from "@/lib/api/workspace";
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

export function useCheckSlug(slug: string) {
  return useQuery({
    queryKey: ["workspace", "slug", "check", slug],
    queryFn: () => workspaceApi.checkSlug(slug),
    enabled: !!slug && slug.length >= 3,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: workspaceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
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
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update workspace");
    },
  });
}

export function useUpdateWorkspaceBySlug() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Partial<Workspace> }) =>
      workspaceApi.updateBySlug(slug, data),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", "slug", slug] });
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
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete workspace");
    },
  });
}

export function useUploadWorkspaceLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slug, logo }: { slug: string; logo: string }) =>
      workspaceApi.uploadLogo(slug, logo),
    onSuccess: (_, { slug }) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspace", "slug", slug] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload logo");
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
