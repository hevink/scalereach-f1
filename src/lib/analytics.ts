import { posthog } from "@/providers/posthog-provider";

/**
 * Analytics helper functions for tracking key events
 * Use these throughout the app to track user behavior
 */

// User events
export const analytics = {
  // Authentication
  signUp: (method: "email" | "google" | "passkey") => {
    posthog.capture("user_signed_up", { method });
  },

  login: (method: "email" | "google" | "passkey") => {
    posthog.capture("user_logged_in", { method });
  },

  logout: () => {
    posthog.capture("user_logged_out");
    posthog.reset(); // Clear user identity
  },

  // Video events
  videoUploaded: (props: {
    videoId: string;
    source: "youtube" | "upload";
    duration?: number;
  }) => {
    posthog.capture("video_uploaded", props);
  },

  videoProcessingStarted: (videoId: string) => {
    posthog.capture("video_processing_started", { videoId });
  },

  videoProcessingCompleted: (props: {
    videoId: string;
    clipsGenerated: number;
    duration: number;
  }) => {
    posthog.capture("video_processing_completed", props);
  },

  videoProcessingFailed: (videoId: string, error?: string) => {
    posthog.capture("video_processing_failed", { videoId, error });
  },

  // Clip events
  clipViewed: (clipId: string, viralScore?: number) => {
    posthog.capture("clip_viewed", { clipId, viralScore });
  },

  clipEdited: (clipId: string, editType: "boundaries" | "captions" | "style") => {
    posthog.capture("clip_edited", { clipId, editType });
  },

  clipExported: (props: {
    clipId: string;
    aspectRatio: string;
    quality: string;
    withCaptions: boolean;
  }) => {
    posthog.capture("clip_exported", props);
  },

  clipDownloaded: (clipId: string) => {
    posthog.capture("clip_downloaded", { clipId });
  },

  // Subscription events
  pricingViewed: () => {
    posthog.capture("pricing_viewed");
  },

  planSelected: (props: {
    planId: string;
    planName: string;
    price: number;
    billing: "monthly" | "yearly";
  }) => {
    posthog.capture("plan_selected", props);
  },

  subscriptionStarted: (props: {
    planId: string;
    planName: string;
    price: number;
  }) => {
    posthog.capture("subscription_started", props);
  },

  // Feature usage
  featureUsed: (feature: string, metadata?: Record<string, unknown>) => {
    posthog.capture("feature_used", { feature, ...metadata });
  },

  // Workspace events
  workspaceCreated: (workspaceId: string) => {
    posthog.capture("workspace_created", { workspaceId });
  },

  workspaceMemberInvited: (workspaceId: string) => {
    posthog.capture("workspace_member_invited", { workspaceId });
  },

  // Identify user (call after login)
  identify: (userId: string, traits?: Record<string, unknown>) => {
    posthog.identify(userId, traits);
  },

  // Set user properties
  setUserProperties: (properties: Record<string, unknown>) => {
    posthog.people.set(properties);
  },
};
