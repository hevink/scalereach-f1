"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useSocialAccounts, useConnectSocialAccount, useDisconnectSocialAccount } from "@/hooks/useSocialAccounts";
import { useScheduledPosts, useCancelPost } from "@/hooks/useScheduledPosts";
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
import { IconVideo } from "@tabler/icons-react";
import { CalendarProvider } from "@/components/social/calendar/calendar-context";
import { CalendarClientContainer } from "@/components/social/calendar/calendar-client-container";
import { UpgradeDialog } from "@/components/pricing/upgrade-dialog";
import {
  TikTokIcon,
  InstagramIcon,
  YouTubeIcon,
  TwitterIcon,
  LinkedInIcon,
} from "@/components/icons/platform-icons";

const PLATFORMS: { id: string; label: string; Icon: React.ElementType }[] = [
  { id: "tiktok", label: "TikTok", Icon: TikTokIcon },
  { id: "instagram", label: "Instagram", Icon: InstagramIcon },
  { id: "youtube", label: "YouTube Shorts", Icon: YouTubeIcon },
  { id: "twitter", label: "Twitter / X", Icon: TwitterIcon },
  { id: "linkedin", label: "LinkedIn", Icon: LinkedInIcon },
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

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const filteredPosts = statusFilter ? posts.filter((p) => p.status === statusFilter) : posts;

  const atLimit = accountLimit === 0 || accounts.length >= accountLimit;
  const limitLabel =
    accountLimit === 0
      ? "Upgrade to connect social accounts"
      : accounts.length >= accountLimit
        ? `Limit reached (${accountLimit} account${accountLimit === 1 ? "" : "s"} on ${plan} plan)`
        : `${accounts.length}/${accountLimit} accounts connected`;

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Calendar */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">Post Calendar</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Visualise your scheduled posts across time.
        </p>
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-lg font-semibold">Connected Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Connect your social media accounts to post clips directly from ScaleReach.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">{limitLabel}</span>
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
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!canConnect || connectAccount.isPending || !workspaceId}
                    title={!canConnect ? limitLabel : undefined}
                    onClick={() =>
                      workspaceId && canConnect && connectAccount.mutate({ platform: platform.id, workspaceId })
                    }
                  >
                    + Connect
                  </Button>
                </div>

                {connected.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {connected.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                        <div className="flex items-center gap-2">
                          {acc.avatarUrl && (
                            <img src={acc.avatarUrl} alt="" className="size-6 rounded-full" />
                          )}
                          <div>
                            <p className="text-xs font-medium">{acc.accountName}</p>
                            {acc.accountHandle && (
                              <p className="text-[11px] text-muted-foreground">{acc.accountHandle}</p>
                            )}
                          </div>
                        </div>
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
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                variant="destructive"
                                onClick={() => disconnectAccount.mutate(acc.id)}
                              >
                                Disconnect
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Scheduled Posts</h2>
            <p className="text-sm text-muted-foreground">All posts scheduled from your clips.</p>
          </div>
          <div className="flex gap-1.5">
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
            <p className="text-sm text-muted-foreground">No posts yet. Schedule a clip from the Clips page.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredPosts.map((post) => {
              const PlatformIcon = PLATFORMS.find((p) => p.id === post.platform)?.Icon;
              const scheduledDate = post.scheduledAt ? parseISO(post.scheduledAt) : parseISO(post.createdAt);
              const postedDate = post.postedAt ? parseISO(post.postedAt) : null;
              return (
                <div key={post.id} className="flex items-center gap-4 rounded-xl border bg-card p-3">
                  {/* Thumbnail */}
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted/40">
                    {post.clipThumbnailUrl ? (
                      <img src={post.clipThumbnailUrl} alt={post.clipTitle || ""} className="absolute inset-0 size-full object-cover" />
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
                        {post.clipTitle || "Untitled clip"}
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
                    {post.errorMessage && (
                      <p className="text-[11px] text-destructive">{post.errorMessage}</p>
                    )}
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
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
