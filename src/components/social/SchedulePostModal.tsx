"use client";

import { useState } from "react";
import { IconX, IconCheck } from "@tabler/icons-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useSocialAccounts } from "@/hooks/useSocialAccounts";
import { useSchedulePost } from "@/hooks/useScheduledPosts";
import type { ClipResponse } from "@/lib/api/clips";

interface SchedulePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clip: ClipResponse;
  workspaceId: string;
  workspaceSlug: string;
}

const PLATFORM_LABELS: Record<string, string> = {
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
  twitter: "Twitter / X",
};

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: "bg-black text-white",
  instagram: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
  youtube: "bg-red-500 text-white",
  twitter: "bg-sky-500 text-white",
};

export function SchedulePostModal({
  open,
  onOpenChange,
  clip,
  workspaceId,
}: SchedulePostModalProps) {
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [caption, setCaption] = useState(clip.title || "");
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [postType, setPostType] = useState<"immediate" | "scheduled">("scheduled");
  const [scheduledAt, setScheduledAt] = useState("");

  const { data: accounts = [], isLoading } = useSocialAccounts(workspaceId);
  const schedulePost = useSchedulePost(workspaceId);

  function addHashtag() {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) setHashtags((p) => [...p, tag]);
    setHashtagInput("");
  }

  async function handleSubmit() {
    if (!selectedAccountId) return;
    await schedulePost.mutateAsync({
      workspaceId,
      clipId: clip.id,
      socialAccountId: selectedAccountId,
      postType,
      caption,
      hashtags,
      scheduledAt: postType === "scheduled" ? scheduledAt : undefined,
    });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl gap-0 p-0 overflow-hidden [&>button]:hidden">
        {/* Header */}
        <div className="flex items-center border-b px-5 py-3.5">
          <div className="flex-1 min-w-0">
            <DialogTitle className="text-sm font-semibold leading-none">Schedule Post</DialogTitle>
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
              {clip.title || "Untitled clip"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <IconX size={15} />
          </button>
        </div>

        <div className="flex divide-x">
          {/* Left: clip preview */}
          <div className="flex w-40 shrink-0 flex-col gap-2.5 p-4">
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-muted/40">
              {clip.thumbnailUrl ? (
                <img
                  src={clip.thumbnailUrl}
                  alt={clip.title || ""}
                  className="absolute inset-0 size-full object-cover"
                />
              ) : clip.storageUrl ? (
                <video
                  src={clip.storageUrl}
                  className="absolute inset-0 size-full object-cover"
                  preload="metadata"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => {
                    (e.currentTarget as HTMLVideoElement).currentTime = 1;
                  }}
                />
              ) : (
                <div className="flex size-full items-center justify-center">
                  <span className="text-[10px] text-muted-foreground/40">No preview</span>
                </div>
              )}
            </div>
            <p className="line-clamp-3 text-xs font-medium leading-snug text-foreground">
              {clip.title || <span className="italic text-muted-foreground">Untitled clip</span>}
            </p>
          </div>

          {/* Right: form */}
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 max-h-[480px]">
            {/* Account */}
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Post to
              </Label>
              {isLoading ? (
                <p className="text-xs text-muted-foreground">Loading accounts...</p>
              ) : accounts.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No connected accounts. Go to Social → Connected Accounts to add one.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {accounts.map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                        selectedAccountId === acc.id
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-border bg-muted/30 hover:border-primary/50"
                      )}
                    >
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-bold", PLATFORM_COLORS[acc.platform] || "bg-muted")}>
                        {PLATFORM_LABELS[acc.platform]?.[0] || acc.platform[0].toUpperCase()}
                      </span>
                      {acc.accountName}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* When to post */}
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                When to post
              </Label>
              <div className="flex gap-2">
                {(["immediate", "scheduled"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPostType(type)}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-all",
                      postType === type
                        ? "border-primary bg-primary/8 text-primary"
                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    {postType === type && <IconCheck size={11} strokeWidth={3} />}
                    {type === "immediate" ? "Post now" : "Schedule"}
                  </button>
                ))}
              </div>
              {postType === "scheduled" && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="text-sm"
                />
              )}
            </div>

            {/* Caption */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Caption
              </Label>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Write a caption..."
                className="resize-none text-sm"
              />
            </div>

            {/* Hashtags */}
            <div className="flex flex-col gap-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Hashtags
              </Label>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => setHashtags((p) => p.filter((t) => t !== tag))}
                        className="opacity-60 hover:opacity-100"
                      >
                        <IconX size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="Add hashtag..."
                  className="text-sm"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                />
                <Button type="button" variant="outline" size="sm" onClick={addHashtag}>
                  Add
                </Button>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t pt-3">
              <Button
                className="w-full"
                size="sm"
                onClick={handleSubmit}
                disabled={
                  !selectedAccountId ||
                  schedulePost.isPending ||
                  (postType === "scheduled" && !scheduledAt)
                }
              >
                {schedulePost.isPending ? "Scheduling..." : postType === "immediate" ? "Post Now" : "Schedule Post"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
