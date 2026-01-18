"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi } from "@/lib/api";
import type { User } from "@/lib/api/user";
import { toast } from "sonner";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: userApi.getMe,
    retry: false,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateMe,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update profile");
    },
  });
}

export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete onboarding");
    },
  });
}

export function useUploadAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.uploadAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to upload avatar");
    },
  });
}

export function useDeleteAvatar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "me"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete avatar");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      userApi.changePassword(currentPassword, newPassword),
    onError: (error: Error) => {
      toast.error(error.message || "Failed to change password");
    },
  });
}

export function useUserPreferences() {
  return useQuery({
    queryKey: ["user", "preferences"],
    queryFn: userApi.getPreferences,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "preferences"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update preferences");
    },
  });
}

export function useUserSessions() {
  return useQuery({
    queryKey: ["user", "sessions"],
    queryFn: userApi.getSessions,
  });
}

export function useRevokeSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.revokeSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", "sessions"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to revoke session");
    },
  });
}
