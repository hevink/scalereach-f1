"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useSocialAccounts, useConnectSocialAccount, useDisconnectSocialAccount } from "@/hooks/useSocialAccounts";
import { useScheduledPosts, useCancelPost, useRetryPost } from "@/hooks/useScheduledPosts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import { IconVideo, IconRefresh, IconAlertTriangle } from "@tabler/icons-react";
import { CalendarProvider } from "@/components/social/calendar/calendar-context";
import { CalendarClientContainer } from "@/components/social/calendar/calendar-client-container";
import { UpgradeDialog } from "@/components/pricing/upgrade-dialog";
import { SchedulePostModal } from "@/components/social/SchedulePostModal";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
  TwitterIcon,
  LinkedInIcon,
  FacebookIcon,
  ThreadsIcon,
} from "@/components/icons/platform-icons";
import { SocialAccountAvatar } from "@/components/social/social-account-avatar";

const PLATFORMS: { id: string; label: string; Icon: React.ElementType; comingSoon?: boolean }[] = [
  { id: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { id: "instagram", label: "Instagram", Icon: InstagramIcon },
  { id: "facebook", label: "Facebook", Icon: FacebookIcon },
  { id: "youtube", label: "YouTube Shorts", Icon: YouTubeIcon },
  { id: "twitter", label: "Twitter / X", Icon: TwitterIcon, comingSoon: true },
  { id: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
  { id: "threads", label: "Threads", Icon: ThreadsIcon },
];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-500",
  posting: "bg-blue-500/15 text-blue-500",
  posted: "bg-emerald-500/15 text-emerald-500",
  failed: "bg-red-500/15 text-red-500",
  cancelled: "bg-zinc-500/15 text-zinc-400",
};

const SOCIAL_ACCOUNT_LIMITS: Record<string, number> = {
  free: 0,
  starter: 1,
  pro: 5,
  agency: 999,
};

/** Map known platform error codes to friendly messages */
const KNOWN_ERROR_CODES: Record<string, { title: string; description: string }> = {
  unaudited_client_can_only_post_to_private_accounts: {
    title: "TikTok privacy restriction",
    description: "Your TikTok account can only receive posts set to private while our app is under review. Change your post privacy to \"Only Me\" or wait for TikTok approval.",
  },
  access_token_invalid: {
    title: "Account disconnected",
    description: "Your account token has expired. Please reconnect your account and try again.",
  },
  token_expired: {
    title: "Session expired",
    description: "Your account session has expired. Please reconnect your account from the Connected Accounts section.",
  },
  spam_risk_too_many_pending_share: {
    title: "Too many pending posts",
    description: "TikTok has flagged too many pending posts. Wait a bit before scheduling more.",
  },
  rate_limit_exceeded: {
    title: "Rate limit reached",
    description: "Too many requests sent to the platform. Please wait a few minutes and retry.",
  },
  scope_not_authorized: {
    title: "Missing permissions",
    description: "The connected account doesn't have the required permissions. Please reconnect with full access.",
  },
  video_file_too_large: {
    title: "File too large",
    description: "The video exceeds the platform's maximum file size. Try a shorter or lower-resolution clip.",
  },
};

function parsePostError(raw: string): { title: string; description: string } {
  // Try to extract JSON from error strings like: `TikTok init upload error: {"code":"...","message":"..."}`
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const code = parsed.code || parsed.error_code || parsed.error?.code;
      if (code && KNOWN_ERROR_CODES[code]) {
        return KNOWN_ERROR_CODES[code];
      }
      // Unknown code but has a message - show the message cleanly
      const msg = parsed.message || parsed.error?.message || parsed.error_description;
      if (msg) {
        const platform = raw.match(/^(TikTok|YouTube|Instagram|Facebook|LinkedIn|Threads)/i)?.[0] || "Platform";
        return { title: `${platform} error`, description: msg };
      }
    } catch {
      // JSON parse failed, fall through
    }
  }

  // Known prefix patterns without JSON
  const prefixPatterns: [RegExp, string][] = [
    [/tiktok/i, "TikTok"],
    [/youtube/i, "YouTube"],
    [/instagram/i, "Instagram"],
    [/facebook/i, "Facebook"],
    [/linkedin/i, "LinkedIn"],
    [/threads/i, "Threads"],
  ];
  for (const [regex, platform] of prefixPatterns) {
    if (regex.test(raw)) {
      // Strip the technical prefix like "TikTok init upload error: "
      const cleaned = raw.replace(/^[^:]+:\s*/, "").trim();
      return { title: `${platform} posting failed`, description: cleaned || raw };
    }
  }

  // Fallback - just show it as-is but with a generic title
  return { title: "Posting failed", description: raw };
}

export default function SocialPage() {
  const params = useParams<{ "workspace-slug": string }>();
  const workspaceSlug = params["workspace-slug"];
  const searchParams = useSearchParams();
  const { data: workspace } = useWorkspaceBySlug(workspaceSlug);
  const workspaceId = workspace?.id;
  const plan = workspace?.plan || "free";
  const accountLimit = SOCIAL_ACCOUNT_LIMITS[plan] ?? 0;

  // Show success toast after OAuth redirect
  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected) {
      toast.success(`${connected.charAt(0).toUpperCase() + connected.slice(1)} account connected!`);
    }
  }, [searchParams]);

  const { data: accounts = [], isLoading: loadingAccounts } = useSocialAccounts(workspaceId);
  const { data: posts = [], isLoading: loadingPosts } = useScheduledPosts(workspaceId);
  const connectAccount = useConnectSocialAccount();
  const disconnectAccount = useDisconnectSocialAccount(workspaceId);
  const cancelPost = useCancelPost(workspaceId);
  const retryPost = useRetryPost(workspaceId);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);

  const filteredPosts = statusFilter ? posts.filter((p) => p.status === statusFilter) : posts;

  const atLimit = accountLimit === 0 || accounts.length >= accountLimit;
  const limitLabel =
    accountLimit === 0
      ? "Upgrade to connect social accounts"
      : accounts.length >= accountLimit
        ? `Limit reached (${accountLimit} account${accountLimit === 1 ? "" : "s"} on ${plan} plan)`
        : `${accounts.length}/${accountLimit} accounts connected`;

  return (
    <div className="flex flex-col gap-6 p-4 sm:gap-8 sm:p-6">
      {/* Calendar */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Post Calendar</h2>
            <p className="text-sm text-muted-foreground">
              Visualise your scheduled posts across time.
            </p>
          </div>
          {accounts.length > 0 && (
            <Button onClick={() => setCreatePostOpen(true)} size="sm" className="gap-2">
              <IconVideo size={15} />
              Create Post
            </Button>
          )}
        </div>
        {loadingPosts ? (
          <div className="flex h-64 items-center justify-center rounded-xl border bg-muted/20">
            <p className="text-sm text-muted-foreground">Loading calendar...</p>
          </div>
        ) : (
          <CalendarProvider posts={posts}>
            <CalendarClientContainer workspaceId={workspaceId || ""} />
          </CalendarProvider>
        )}
      </section>

      <Separator />

      {/* Connected Accounts */}
      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Connected Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Connect your social media accounts to post clips directly from ScaleReach.
            </p>
          </div>
          <span className={`self-start rounded-full px-3 py-1 text-xs font-medium ${accountLimit === 0
            ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
            : accounts.length >= accountLimit
              ? "bg-red-500/10 text-red-500"
              : "text-muted-foreground"
            }`}>{limitLabel}</span>
        </div>

        {accountLimit === 0 && (
          <div className="mb-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">
            Social account integration is not available on the free plan.{" "}
            <button
              type="button"
              onClick={() => setUpgradeOpen(true)}
              className="font-medium underline underline-offset-2 hover:opacity-80"
            >
              Upgrade to Starter or Pro
            </button>{" "}
            to connect your accounts.
          </div>
        )}

        <UpgradeDialog
          open={upgradeOpen}
          onOpenChange={setUpgradeOpen}
          workspaceSlug={workspaceSlug}
          feature="social accounts"
          description="Connect your social media accounts and post clips directly from ScaleReach."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PLATFORMS.map((platform) => {
            const connected = accounts.filter((a) => a.platform === platform.id);
            const canConnect = accountLimit > 0 && accounts.length < accountLimit;
            return (
              <div key={platform.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <platform.Icon className="size-4 shrink-0" />
                    <span className="text-sm font-medium">{platform.label}</span>
                    {platform.comingSoon && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={platform.comingSoon || connectAccount.isPending || !workspaceId}
                    title={platform.comingSoon ? "Coming soon" : !canConnect ? limitLabel : undefined}
                    onClick={() => {
                      if (!workspaceId || platform.comingSoon) return;
                      if (!canConnect) {
                        setUpgradeOpen(true);
                        return;
                      }
                      connectAccount.mutate({ platform: platform.id, workspaceId });
                    }}
                  >
                    + Connect
                  </Button>
                </div>

                {connected.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {connected.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                        <div className="flex items-center gap-2">
                          <SocialAccountAvatar
                            avatarUrl={acc.avatarUrl}
                            accountName={acc.accountName}
                            platform={acc.platform}
                            size="sm"
                            showBadge={false}
                          />
                          <div>
                            <p className="text-xs font-medium">{acc.accountName}</p>
                            {acc.accountHandle && (
                              <p className="text-[11px] text-muted-foreground">{acc.accountHandle}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                            disabled={connectAccount.isPending || !workspaceId}
                            onClick={() => {
                              if (!workspaceId || platform.comingSoon) return;
                              connectAccount.mutate({ platform: platform.id, workspaceId });
                            }}
                          >
                            Reconnect
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger
                              render={
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                                >
                                  Disconnect
                                </Button>
                              }
                            />
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to disconnect <strong>{acc.accountName}</strong>? Any scheduled posts for this account will no longer be published.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel disabled={disconnectAccount.isPending}>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  variant="destructive"
                                  disabled={disconnectAccount.isPending}
                                  onClick={(e) => { e.preventDefault(); disconnectAccount.mutateAsync(acc.id); }}
                                >
                                  {disconnectAccount.isPending ? "Disconnecting..." : "Disconnect"}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {loadingAccounts && connected.length === 0 && (
                  <p className="text-xs text-muted-foreground">Loading...</p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <Separator />

      {/* Scheduled Posts list */}
      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Scheduled Posts</h2>
            <p className="text-sm text-muted-foreground">All posts scheduled from your clips and uploads.</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {["", "pending", "posted", "failed"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${statusFilter === s
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/40 hover:bg-muted"
                  }`}
              >
                {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loadingPosts ? (
          <p className="text-sm text-muted-foreground">Loading posts...</p>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-xl border bg-muted/20 p-8 text-center">
            <p className="text-sm text-muted-foreground">No posts yet. Schedule a clip from the Clips page or create a custom post.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredPosts.map((post) => {
              const PlatformIcon = PLATFORMS.find((p) => p.id === post.platform)?.Icon;
              const scheduledDate = post.scheduledAt ? parseISO(post.scheduledAt) : parseISO(post.createdAt);
              const postedDate = post.postedAt ? parseISO(post.postedAt) : null;
              return (
                <div key={post.id} className="flex items-center gap-3 rounded-xl border bg-card p-3 sm:gap-4">
                  {/* Thumbnail */}
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted/40 sm:size-16">
                    {post.clipThumbnailUrl ? (
                      <img src={post.clipThumbnailUrl} alt={post.clipTitle || ""} className="absolute inset-0 size-full object-cover" />
                    ) : post.mediaThumbnailUrl ? (
                      <img src={post.mediaThumbnailUrl} alt="Custom post" className="absolute inset-0 size-full object-cover" />
                    ) : post.mediaUrl && post.mediaType === "image" ? (
                      <img src={post.mediaUrl} alt="Custom post" className="absolute inset-0 size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <IconVideo size={20} className="opacity-30" />
                      </div>
                    )}
                    {PlatformIcon && (
                      <div className="absolute bottom-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-background shadow">
                        <PlatformIcon className="size-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {post.clipTitle || (post.mediaUrl ? "Custom post" : "Untitled clip")}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[post.status] ?? ""}`}>
                        {post.status}
                      </span>
                      {post.postType === "drip" && (
                        <Badge variant="outline" className="h-5 shrink-0 text-[11px]">
                          Drip #{(post.dripOrder ?? 0) + 1}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                      {PlatformIcon && <PlatformIcon className="size-3 shrink-0" />}
                      <span className="capitalize">{post.platform}</span>
                    </div>

                    {postedDate ? (
                      <p className="text-[11px] text-muted-foreground">
                        Posted {format(postedDate, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1 text-[11px]">
                        <span className="font-medium text-foreground/70">
                          {format(scheduledDate, "MMM d, yyyy")}
                        </span>
                        <span className="text-muted-foreground/50">·</span>
                        <span className="font-semibold text-primary">
                          {format(scheduledDate, "h:mm a")}
                        </span>
                      </div>
                    )}

                    {post.caption && (
                      <p className="truncate text-[11px] text-muted-foreground/70">{post.caption}</p>
                    )}
                    {post.errorMessage && (() => {
                      const error = parsePostError(post.errorMessage);
                      return (
                        <div className="mt-1 flex items-start gap-2.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                          <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                            <IconAlertTriangle size={13} className="text-red-500" />
                          </div>
                          <div className="flex min-w-0 flex-1 flex-col gap-1">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error.title}</p>
                            <p className="text-[11px] leading-relaxed text-red-500/80 dark:text-red-400/70">{error.description}</p>
                            <div className="mt-1 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => retryPost.mutate(post.id)}
                                disabled={retryPost.isPending}
                                className="flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-600 transition-colors hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                              >
                                <IconRefresh size={12} className={retryPost.isPending ? "animate-spin" : ""} />
                                {retryPost.isPending ? "Retrying..." : "Retry"}
                              </button>
                              {post.retryCount > 0 && (
                                <span className="text-[10px] text-red-400/60">
                                  {post.retryCount} {post.retryCount === 1 ? "attempt" : "attempts"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    {post.platformPostUrl && (
                      <a href={post.platformPostUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline">
                        View post →
                      </a>
                    )}
                  </div>

                  {post.status === "pending" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={() => cancelPost.mutate(post.id)}
                    >
                      Cancel
                    </Button>
                  )}
                  {post.status === "failed" && !post.errorMessage && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1.5 border-red-500/20 text-red-600 hover:bg-red-500/10 hover:text-red-600 dark:text-red-400"
                      onClick={() => retryPost.mutate(post.id)}
                      disabled={retryPost.isPending}
                    >
                      <IconRefresh size={13} className={retryPost.isPending ? "animate-spin" : ""} />
                      Retry
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {workspaceId && (
        <SchedulePostModal
          open={createPostOpen}
          onOpenChange={setCreatePostOpen}
          workspaceId={workspaceId}
        />
      )}
    </div>
  );
}
