import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { creditsApi } from "@/lib/api/credits";

export function useCreditBalance(workspaceId: string | undefined) {
  return useQuery({
    queryKey: ["credits", "balance", workspaceId],
    queryFn: () => creditsApi.getBalance(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreditTransactions(workspaceId: string | undefined, params?: { limit?: number; type?: string }) {
  return useQuery({
    queryKey: ["credits", "transactions", workspaceId, params],
    queryFn: () => creditsApi.getTransactions(workspaceId!, params),
    enabled: !!workspaceId,
  });
}

export function useCreditPackages() {
  return useQuery({
    queryKey: ["credits", "packages"],
    queryFn: () => creditsApi.getPackages(),
  });
}

export function useCreateCheckout() {
  return useMutation({
    mutationFn: ({ workspaceId, packageId }: { workspaceId: string; packageId: string }) =>
      creditsApi.createCheckout(workspaceId, packageId),
    onSuccess: (data) => {
      // Redirect to Polar checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create checkout");
    },
  });
}

export function useAddBonusCredits() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, amount, description }: { workspaceId: string; amount: number; description?: string }) =>
      creditsApi.addBonusCredits(workspaceId, amount, description),
    onSuccess: (_, { workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["credits", "balance", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["credits", "transactions", workspaceId] });
      toast.success("Bonus credits added successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to add bonus credits");
    },
  });
}
