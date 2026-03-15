import { useQuery } from "@tanstack/react-query";
import { affiliateApi } from "@/lib/api/affiliate";

export function useAffiliateStats() {
  return useQuery({
    queryKey: ["affiliate", "stats"],
    queryFn: () => affiliateApi.getStats(),
    retry: (failureCount, error) => {
      if ((error as any)?.status === 401 || (error as any)?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
  });
}
