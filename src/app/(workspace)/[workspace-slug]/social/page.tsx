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
import { CalendarProvider } from "@/components/social/calendar/calendar-context";
import { CalendarClientContainer } from "@/components/social/calendar/calendar-client-container";

const PLATFORMS = [
  { id: "tiktok", label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube Shorts" },
  { id: "twitter", label: "Twitter / X" },
  { id: "linkedin", label: "LinkedIn" },
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
            <a href="/pricing" className="font-medium underline underline-offset-2">Upgrade to Starter or Pro</a> to connect your accounts.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PLATFORMS.map((platform) => {
            const connected = accounts.filter((a) => a.platform === platform.id);
            const canConnect = accountLimit > 0 && accounts.length < accountLimit;
            return (
              <div key={platform.id} className="flex flex-col gap-3 rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{platform.label}</span>
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
            {filteredPosts.map((post) => (
              <div key={post.id} className="flex items-center justify-between gap-4 rounded-xl border bg-card px-4 py-3">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium capitalize">{post.platform}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[post.status] ?? ""}`}>
                      {post.status}
                    </span>
                    {post.postType === "drip" && (
                      <Badge variant="outline" className="h-5 text-[11px]">
                        Drip #{(post.dripOrder ?? 0) + 1}
                      </Badge>
                    )}
                  </div>
                  {post.caption && (
                    <p className="max-w-xs truncate text-xs text-muted-foreground">{post.caption}</p>
                  )}
                  {post.scheduledAt && (
                    <p className="text-[11px] text-muted-foreground">
                      Scheduled: {new Date(post.scheduledAt).toLocaleString()}
                    </p>
                  )}
                  {post.platformPostUrl && (
                    <a
                      href={post.platformPostUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-primary hover:underline"
                    >
                      View post →
                    </a>
                  )}
                  {post.errorMessage && (
                    <p className="text-[11px] text-destructive">{post.errorMessage}</p>
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
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
