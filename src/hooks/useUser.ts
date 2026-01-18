"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userApi, type User } from "@/lib/api";
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
      toast.success("Profile updated successfully");
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
      toast.success("Onboarding completed!");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to complete onboarding");
    },
  });
}
