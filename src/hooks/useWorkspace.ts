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

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, memberId, role }: { workspaceId: string; memberId: string; role: string }) =>
      workspaceApi.updateMemberRole(workspaceId, memberId, role),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "members"] });
      toast.success("Member role updated");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update member role");
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, memberId }: { workspaceId: string; memberId: string }) =>
      workspaceApi.removeMember(workspaceId, memberId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "members"] });
      toast.success("Member removed");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to remove member");
    },
  });
}

// === Invitation Hooks ===

export function useWorkspaceInvitations(workspaceId: string) {
  return useQuery({
    queryKey: ["workspace", workspaceId, "invitations"],
    queryFn: () => workspaceApi.getInvitations(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, email, role }: { workspaceId: string; email: string; role: string }) =>
      workspaceApi.createInvitation(workspaceId, { email, role }),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "invitations"] });
      toast.success("Invitation sent successfully");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to send invitation");
    },
  });
}

export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      workspaceApi.cancelInvitation(workspaceId, invitationId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to cancel invitation");
    },
  });
}

export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, invitationId }: { workspaceId: string; invitationId: string }) =>
      workspaceApi.resendInvitation(workspaceId, invitationId),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["workspace", workspaceId, "invitations"] });
      toast.success("Invitation resent");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to resend invitation");
    },
  });
}

export function useInvitationByToken(token: string) {
  return useQuery({
    queryKey: ["invitation", token],
    queryFn: () => workspaceApi.getInvitationByToken(token),
    enabled: !!token,
    retry: false,
  });
}

export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => workspaceApi.acceptInvitation(token),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      toast.success("Invitation accepted! Welcome to the workspace.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || error.message || "Failed to accept invitation");
    },
  });
}

export function useDeclineInvitation() {
  return useMutation({
    mutationFn: (token: string) => workspaceApi.declineInvitation(token),
    onSuccess: () => {
      toast.success("Invitation declined");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to decline invitation");
    },
  });
}
