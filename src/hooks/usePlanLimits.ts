import { useWorkspace } from "./useWorkspace";

/**
 * Plan limits interface for frontend display
 */
export interface PlanLimits {
  maxFileSize: number; // in bytes
  maxFileSizeGB: number; // for display
  maxDuration: number; // in seconds
  maxDurationFormatted: string; // "30 min", "2h", "3h"
  planName: string; // "Free", "Starter", "Pro"
  canUpgrade: boolean;
  nextPlan?: string;
}

/**
 * Hook to get plan limits for a workspace
 * @param workspaceSlug The workspace slug
 * @returns Plan limits for the workspace
 */
export function usePlanLimits(workspaceSlug: string): PlanLimits {
  const { data: workspace } = useWorkspace(workspaceSlug);
  const plan = workspace?.plan || "free";
  
  return getPlanLimits(plan);
}

/**
 * Get plan limits for a specific plan
 * @param plan The plan name (free, starter, pro)
 * @returns Plan limits
 */
export function getPlanLimits(plan: string): PlanLimits {
  const configs: Record<string, PlanLimits> = {
    free: {
      maxFileSize: 2 * 1024 * 1024 * 1024,
      maxFileSizeGB: 2,
      maxDuration: 1800,
      maxDurationFormatted: "30 min",
      planName: "Free",
      canUpgrade: true,
      nextPlan: "starter",
    },
    starter: {
      maxFileSize: 4 * 1024 * 1024 * 1024,
      maxFileSizeGB: 4,
      maxDuration: 7200,
      maxDurationFormatted: "2h",
      planName: "Starter",
      canUpgrade: true,
      nextPlan: "pro",
    },
    pro: {
      maxFileSize: 4 * 1024 * 1024 * 1024,
      maxFileSizeGB: 4,
      maxDuration: 10800,
      maxDurationFormatted: "3h",
      planName: "Pro",
      canUpgrade: false,
    },
  };
  
  return configs[plan] || configs.free;
}
